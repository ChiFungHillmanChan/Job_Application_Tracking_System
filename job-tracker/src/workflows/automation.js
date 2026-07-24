// Durable per-user automation workflow (Workflow DevKit).
//
// Replaces the Express in-process pipeline `runSearchPipeline`
// (backend/controllers/autoApplyController.js:106). That function did all its
// work inline in one long-running request; here the work is decomposed into
// retryable, individually-cached "steps" while the workflow function only
// orchestrates.
//
// Serialization discipline: the workflow function runs in a sandbox with NO
// Node.js access (no mongoose, no fetch, no fs). Only step functions touch the
// DB / OpenAI / job boards. Every value crossing the workflow<->step boundary
// is plain and serializable (objects/arrays/strings/numbers/Date) - never a
// mongoose document, ObjectId, or class instance. Steps convert docs to plain
// objects (explicit field-by-field, not .toJSON) before returning.
import { FatalError } from 'workflow';
import { connectDB } from '@/server/db';
import SearchConfig from '@/server/models/SearchConfig';
import UserProfile from '@/server/models/UserProfile';
import SavedJob from '@/server/models/SavedJob';
import PreparedApplication from '@/server/models/PreparedApplication';
import AutomationRun from '@/server/models/AutomationRun';
import Resume from '@/server/models/Resume';
import { searchAllBoards } from '@/server/services/jobBoards';
import { scoreJobMatch } from '@/server/services/aiJobMatcher';
import { generateCoverLetter } from '@/server/services/aiCoverLetterWriter';
import logger from '@/server/logger';

// Cost cap: at most this many jobs get an (expensive) gpt-4.1 scoring call per
// run, matching the design brief. The old pipeline was unbounded.
const MAX_JOBS_PER_RUN = 30;

export async function userAutomationWorkflow(configId, runId) {
  'use workflow';

  const ctx = await loadRunContext(configId, runId);
  if (!ctx) return;

  const search = await searchBoardsStep(ctx);
  const capped = search.jobs.slice(0, MAX_JOBS_PER_RUN);

  // One scoring step per job. scoreJobStep swallows its own errors (returns a
  // non-qualifying result) so a single bad job never kills the run - mirroring
  // the old scoreBatchJobMatches per-job tolerance.
  const results = [];
  for (const job of capped) {
    results.push(await scoreJobStep(ctx, job));
  }

  const qualified = results.filter((r) => r && r.qualifies);

  // Errors surfaced during the run: board-search errors + per-application
  // preparation errors (the old pipeline accumulated both into runErrors).
  const errors = [...(search.errors || [])];
  let applicationsPrepared = 0;
  for (const r of qualified) {
    const outcome = await prepareApplicationStep(ctx, r);
    if (outcome.prepared) applicationsPrepared += 1;
    else if (outcome.error) errors.push(outcome.error);
  }

  await finalizeRunStep(runId, ctx.configId, {
    jobsFound: search.jobsFound,
    boardsSearched: search.boardsSearched,
    jobsMatched: qualified.length,
    applicationsPrepared,
    errors,
    startedAt: ctx.startedAt,
  });
}

// Step: load config + profile, return a fully-plain context object (or null to
// abort cleanly). Deviation from the brief's literal "missing/inactive" wording:
// we do NOT abort on an inactive config here, because this same workflow backs
// the manual "Run Search Now" button, which the original triggerSearchRun ran
// regardless of isActive. The isActive + shouldRunNow() gating lives in the cron
// route only (matching automationScheduler.runScheduledSearches). A missing
// config -> null (abort); a missing profile -> FatalError (non-retryable).
async function loadRunContext(configId, runId) {
  'use step';
  await connectDB();

  const config = await SearchConfig.findById(configId).lean();
  if (!config) {
    await AutomationRun.findByIdAndUpdate(runId, {
      status: 'failed',
      runErrors: [{ board: 'system', error: 'Search config not found' }],
    });
    logger.warn(`Automation run ${runId}: config ${configId} not found`);
    return null;
  }

  const userId = String(config.user);

  const profile = await UserProfile.findOne({ user: config.user }).lean();
  if (!profile) {
    await AutomationRun.findByIdAndUpdate(runId, {
      status: 'failed',
      runErrors: [{ board: 'system', error: 'No profile found for user' }],
    });
    // Non-retryable: retrying will not conjure a profile into existence.
    throw new FatalError(`No profile found for user ${userId}`);
  }

  const defaultResume = await Resume.findOne({ user: config.user, isDefault: true })
    .select('_id')
    .lean();

  return {
    userId,
    configId: String(config._id),
    runId: String(runId),
    startedAt: Date.now(),
    // config fields used by the pipeline (plain copies; no ObjectIds/subdoc _ids)
    keywords: (config.keywords || []).map((k) => String(k)),
    locations: (config.locations || []).map((l) => ({
      name: l.name || '',
      radius: typeof l.radius === 'number' ? l.radius : 25,
    })),
    jobTypes: (config.jobTypes || []).map((t) => String(t)),
    boards: (config.boards || []).map((b) => String(b)),
    salaryMin: config.salaryMin || 0,
    salaryMax: config.salaryMax || 0,
    maxResultsPerRun: config.maxResultsPerRun || 50,
    matchScoreThreshold: config.matchScoreThreshold ?? 60,
    excludeCompanies: (config.excludeCompanies || []).map((c) => String(c)),
    excludeKeywords: (config.excludeKeywords || []).map((k) => String(k)),
    defaultResumeId: defaultResume ? String(defaultResume._id) : null,
    // profile fields consumed by scoreJobMatch + generateCoverLetter (explicit
    // plain shape - avoids leaking mongoose subdoc _ids / ObjectIds).
    profile: {
      summary: profile.summary || '',
      seniorityLevel: profile.seniorityLevel || '',
      skills: {
        technical: profile.skills?.technical || [],
        soft: profile.skills?.soft || [],
        languages: profile.skills?.languages || [],
      },
      experience: (profile.experience || []).map((e) => ({
        title: e.title || '',
        company: e.company || '',
        duration: e.duration || '',
        highlights: e.highlights || [],
      })),
      education: (profile.education || []).map((e) => ({
        degree: e.degree || '',
        institution: e.institution || '',
        year: e.year || '',
      })),
      certifications: profile.certifications || [],
      preferredRoles: profile.preferredRoles || [],
    },
  };
}

// Step: search all configured boards, apply exclude filters, dedupe against
// jobs the user already saved. Ports runSearchPipeline's search+filter+dedupe
// loop. Returns plain job objects (adapter output is already plain; Date fields
// are serialization-safe).
async function searchBoardsStep(ctx) {
  'use step';
  await connectDB();

  const queries = buildSearchQueries(ctx);

  let jobsFound = 0;
  const boardsSearched = [];
  const errors = [];
  const collected = [];

  for (const query of queries) {
    const result = await searchAllBoards(
      query.keywords,
      query.location,
      {
        jobTypes: ctx.jobTypes,
        minimumSalary: ctx.salaryMin,
        maximumSalary: ctx.salaryMax,
        limit: ctx.maxResultsPerRun,
        distance: query.radius,
      },
      ctx.boards
    );

    jobsFound += result.jobs.length;
    for (const b of result.boardsSearched || []) {
      if (!boardsSearched.includes(b)) boardsSearched.push(b);
    }
    errors.push(...(result.errors || []));

    const filtered = result.jobs.filter((job) => {
      if (ctx.excludeCompanies?.length) {
        const companyLower = (job.company || '').toLowerCase();
        if (ctx.excludeCompanies.some((c) => companyLower.includes(c.toLowerCase()))) {
          return false;
        }
      }
      if (ctx.excludeKeywords?.length) {
        const titleLower = (job.title || '').toLowerCase();
        const descLower = (job.description || '').toLowerCase();
        if (
          ctx.excludeKeywords.some(
            (k) => titleLower.includes(k.toLowerCase()) || descLower.includes(k.toLowerCase())
          )
        ) {
          return false;
        }
      }
      return true;
    });

    collected.push(...filtered);
  }

  // Dedupe across queries by externalId (searchAllBoards only dedupes within a
  // single call), then drop anything the user has already saved.
  const uniqueByExternalId = Array.from(
    new Map(collected.map((j) => [j.externalId, j])).values()
  );

  const existingExternalIds = await SavedJob.find({
    user: ctx.userId,
    externalId: { $in: uniqueByExternalId.map((j) => j.externalId) },
  }).distinct('externalId');

  const jobs = uniqueByExternalId.filter((j) => !existingExternalIds.includes(j.externalId));

  return { jobs, jobsFound, boardsSearched, errors };
}

// Port of runSearchPipeline's buildSearchQueries (cartesian product of keywords
// x locations, defaulting to a single empty query when either is empty).
function buildSearchQueries(ctx) {
  const queries = [];
  const keywords = ctx.keywords.length ? ctx.keywords : [''];
  const locations = ctx.locations.length ? ctx.locations : [{ name: '', radius: 25 }];

  for (const keyword of keywords) {
    for (const loc of locations) {
      queries.push({ keywords: keyword, location: loc.name, radius: loc.radius });
    }
  }
  return queries;
}

// Step: one gpt-4.1 scoring call for a single job. Swallows errors (returns a
// score-0, non-qualifying result) exactly like the old scoreBatchJobMatches so
// a transient/permanent OpenAI failure never aborts the whole run.
async function scoreJobStep(ctx, job) {
  'use step';
  await connectDB();

  try {
    const match = await scoreJobMatch(ctx.profile, job);
    return {
      job,
      score: match.matchScore,
      qualifies: match.matchScore >= ctx.matchScoreThreshold,
      matchReasoning: match.matchReasoning || '',
      aiNotes: match.aiNotes || '',
    };
  } catch (error) {
    logger.error(`Failed to score job "${job.title}": ${error.message}`);
    return {
      job,
      score: 0,
      qualifies: false,
      matchReasoning: 'Scoring failed',
      aiNotes: `Error: ${error.message}`,
    };
  }
}

// Step: for a qualified job, generate a cover letter, then create the SavedJob
// and the PreparedApplication. Ports the inner try/catch of runSearchPipeline:
// a duplicate (11000) is silently skipped; any other failure is recorded and the
// run continues (we return the error instead of throwing so the workflow lives).
//
// Ordering matters. The cover letter is generated BEFORE the SavedJob is
// written, and a failure after the write is compensated by deleting it. The
// original order (SavedJob -> OpenAI -> PreparedApplication) lost jobs
// permanently: a transient OpenAI failure left a SavedJob with no
// PreparedApplication, so the user never saw it in the queue, and because
// searchBoardsStep dedupes against existing SavedJob externalIds, every later
// run filtered that job out. Nothing ever retried it.
async function prepareApplicationStep(ctx, result) {
  'use step';
  await connectDB();

  const job = result.job;
  let savedJobId = null;
  try {
    // Generate first: if this throws, no rows are written and the job stays
    // undeduped, so the next run picks it up again.
    const coverLetterResult = await generateCoverLetter(ctx.profile, job);

    const savedJob = await SavedJob.create({
      user: ctx.userId,
      externalId: job.externalId,
      source: job.source,
      title: job.title,
      company: job.company,
      location: job.location,
      salary: job.salary,
      jobType: job.jobType,
      workType: job.workType,
      description: job.description,
      applicationUrl: job.applicationUrl,
      companyUrl: job.companyUrl,
      logoUrl: job.logoUrl,
      postedDate: job.postedDate,
      expirationDate: job.expirationDate,
      tags: ['auto-found'],
    });
    savedJobId = savedJob._id;

    await PreparedApplication.create({
      user: ctx.userId,
      savedJob: savedJob._id,
      matchScore: result.score,
      matchReasoning: result.matchReasoning,
      status: 'pending_review',
      coverLetter: coverLetterResult.coverLetter,
      aiNotes: result.aiNotes,
      cvToUse: ctx.defaultResumeId || null,
    });

    return { prepared: true };
  } catch (error) {
    if (error.code === 11000) {
      logger.info(`Duplicate job skipped: ${job.title} at ${job.company}`);
      return { prepared: false, duplicate: true };
    }

    // Compensate: roll back a SavedJob whose PreparedApplication failed, so it
    // cannot silently suppress this job on every future run.
    if (savedJobId) {
      try {
        await SavedJob.findByIdAndDelete(savedJobId);
        logger.warn(`Rolled back orphaned SavedJob ${savedJobId} for "${job.title}"`);
      } catch (rollbackError) {
        logger.error(
          `Failed to roll back orphaned SavedJob ${savedJobId}: ${rollbackError.message}`
        );
      }
    }

    logger.error(`Failed to prepare application: ${error.message}`);
    return { prepared: false, error: { board: job.source, error: error.message } };
  }
}

// Step: write final run stats/status onto the AutomationRun doc and stamp the
// config's lastRunAt. Status logic ported verbatim from runSearchPipeline.
async function finalizeRunStep(runId, configId, stats) {
  'use step';
  await connectDB();

  const { jobsFound, boardsSearched, jobsMatched, applicationsPrepared, errors, startedAt } = stats;

  const status =
    errors.length > 0 && jobsFound === 0
      ? 'failed'
      : errors.length > 0
        ? 'partial'
        : 'completed';

  await AutomationRun.findByIdAndUpdate(runId, {
    status,
    boardsSearched,
    jobsFound,
    jobsMatched,
    applicationsPrepared,
    runErrors: errors,
    duration: Date.now() - startedAt,
  });

  await SearchConfig.findByIdAndUpdate(configId, { lastRunAt: new Date() });

  logger.info(
    `Automation run ${runId} ${status}: ${jobsFound} found, ${jobsMatched} matched, ${applicationsPrepared} prepared`
  );
}
