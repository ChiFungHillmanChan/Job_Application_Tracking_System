// Multi-board job search.
// @route   GET /api/job-finder/search
// @access  Private
//
// This handler previously carried its own inline Reed integration and searched
// Reed and nothing else, while the adapter registry in
// src/server/services/jobBoards (Reed + Adzuna + friends) was used only by the
// automation workflow. The duplicated Reed client has been deleted and this
// route now goes through the same registry, so every board the automation can
// reach is reachable from the Job Finder UI too.
//
// Response shape is unchanged: { success, data: { jobs, pagination, source,
// searchParams } }. `boardsSearched` / `boardErrors` are additive.
//
// Deviation: the express-rate-limit `searchLimiter` middleware is dropped
// entirely (platform WAF handles rate limiting later) - no reimplementation.
//
// This endpoint was public in the Express source. It is now behind requireAuth:
// with no auth and no rate limit it was an open proxy onto our metered job board
// API keys, so any anonymous caller could exhaust the quota. Only the UI (which
// is itself behind auth) ever calls it, so gating it costs nothing.
import { NextResponse } from 'next/server';
import { withApi } from '@/server/http';
import { requireAuth } from '@/server/auth';
import { searchAllBoards, resolveBoards } from '@/server/services/jobBoards';
import { secondsUntil } from '@/server/services/jobBoards/quota';
import logger from '@/server/logger';

// Boards are searched concurrently, but the slowest (JSearch, 20s) plus
// Mongo connect can outrun the platform default.
export const maxDuration = 60;

const asBool = (value, fallback) => {
  if (value === undefined || value === '') return fallback;
  return value === true || value === 'true';
};

const asInt = (value, fallback) => {
  const n = parseInt(value, 10);
  return Number.isFinite(n) ? n : fallback;
};

export const GET = withApi(async (request) => {
  const authUser = await requireAuth(request);

  const query = Object.fromEntries(request.nextUrl.searchParams.entries());
  const {
    keywords = '',
    location = '',
    distance = 25,
    minimumSalary = 0,
    maximumSalary = 0,
    postedDays = 30,
    country = 'gb',
    sort = 'mixed',
  } = query;

  const page = Math.max(asInt(query.page, 1), 1);
  const limit = Math.min(Math.max(asInt(query.limit, 20), 1), 100);
  const tier = authUser.subscriptionTier || 'free';

  // The UI sends job types as individual booleans; the adapters take a list.
  const jobTypes = [
    asBool(query.permanent, true) && 'permanent',
    asBool(query.contract, true) && 'contract',
    asBool(query.temp, true) && 'temporary',
    asBool(query.partTime, true) && 'part-time',
    asBool(query.fullTime, true) && 'full-time',
  ].filter(Boolean);

  const requested = query.boards
    ? query.boards.split(',').map((b) => b.trim()).filter(Boolean)
    : null;

  const { boards, skipped } = resolveBoards({ requested, tier });

  logger.info(
    `Job search request: "${keywords}" in "${location}" across [${boards.join(', ')}] (tier ${tier})`
  );

  if (boards.length === 0) {
    // Three distinguishable causes, and conflating them sends the user down the
    // wrong path: an upgrade prompt, a deliberate cost control, or a genuine
    // deployment problem they cannot fix themselves.
    const allAre = (reason) => skipped.length > 0 && skipped.every((s) => s.reason === reason);

    const { error, code, status } = allAre('upgrade_required')
      ? { error: skipped[0].error, code: 'UPGRADE_REQUIRED', status: 403 }
      : allAre('paid_disabled')
        ? {
            error: `${skipped[0].error}. Enable it by setting ENABLE_PAID_JOB_BOARDS=true, or search a free board instead.`,
            code: 'PAID_BOARDS_DISABLED',
            status: 409,
          }
        : {
            error: 'Job search service is not configured. Please contact support.',
            code: 'SERVICE_UNAVAILABLE',
            status: 503,
          };

    return NextResponse.json({ success: false, error, code, boardErrors: skipped }, { status });
  }

  const result = await searchAllBoards(
    keywords,
    location,
    {
      distance: asInt(distance, 25),
      minimumSalary: asInt(minimumSalary, 0),
      maximumSalary: asInt(maximumSalary, 0),
      jobTypes,
      page,
      limit,
      country,
      remoteOnly: asBool(query.remoteOnly, false),
      visaSponsorship: asBool(query.visaSponsorship, false),
    },
    boards
  );

  const boardErrors = [...skipped, ...(result.errors || [])];

  // Every board erroring is an outage, not an empty result set - saying "no
  // jobs found" there would send the user off rewriting a search that was fine.
  if (result.jobs.length === 0 && result.boardsSearched.length === 0) {
    // Running out of free-tier requests is not an outage and must not be
    // reported as one: it is expected, self-healing, and the user needs the
    // time it clears rather than "try again shortly".
    const quotaBlocked = boardErrors.filter(
      (e) => e.reason === 'quota_exhausted' || e.reason === 'upstream_rate_limited'
    );

    if (quotaBlocked.length && quotaBlocked.length === boardErrors.length) {
      // Soonest board to free up - that is when a retry can actually succeed.
      const availableAt = quotaBlocked
        .map((e) => e.availableAt)
        .filter(Boolean)
        .sort()[0] || null;

      const retryAfter = secondsUntil(availableAt);

      logger.warn(`All boards out of request budget until ${availableAt}`);

      return NextResponse.json(
        {
          success: false,
          error: availableAt
            ? `Daily search limit reached for every enabled job board. Searches resume at ${new Date(availableAt).toUTCString()}.`
            : 'Search limit reached for every enabled job board.',
          code: 'QUOTA_EXCEEDED',
          availableAt,
          retryAfterSeconds: retryAfter,
          boardErrors,
        },
        {
          status: 429,
          // Standard header so any HTTP client (not just our UI) can back off.
          ...(retryAfter ? { headers: { 'Retry-After': String(retryAfter) } } : {}),
        }
      );
    }

    logger.error(`All job boards failed: ${JSON.stringify(boardErrors)}`);
    return NextResponse.json(
      {
        success: false,
        error: 'Job search is temporarily unavailable. Please try again shortly.',
        code: 'SERVICE_UNAVAILABLE',
        boardErrors,
      },
      { status: 503 }
    );
  }

  const ordered = sort === 'date' ? byDateDesc(result.jobs) : interleaveByBoard(result.jobs, boards);

  // Each board was asked for `limit` results, so the merged set can be several
  // times the page size. Trim to the requested size and keep pagination honest:
  // page N asks every board for its own page N.
  const jobs = ordered.slice(0, limit).map((job) => ({
    ...job,
    id: `${job.source}_${job.externalId}`,
  }));

  const totalResults = result.totalResults;

  return NextResponse.json(
    {
      success: true,
      data: {
        jobs,
        pagination: {
          currentPage: page,
          totalPages: Math.max(Math.ceil(totalResults / limit), 1),
          totalResults,
          limit,
          hasNextPage: ordered.length > limit || page * limit < totalResults,
          hasPreviousPage: page > 1,
        },
        // Kept as a string for backwards compatibility with the previous
        // `source: 'reed'` field; `boardsSearched` is the structured version.
        source: result.boardsSearched.join(', '),
        boardsSearched: result.boardsSearched,
        boardErrors,
        // Boards that sat this search out because their budget is spent, and
        // when each returns. Present even on a successful search so the UI can
        // warn before the user runs out entirely rather than only after.
        quotaBlocked: boardErrors
          .filter((e) => e.reason === 'quota_exhausted' || e.reason === 'upstream_rate_limited')
          .map((e) => ({ board: e.board, availableAt: e.availableAt || null })),
        searchParams: {
          keywords,
          location,
          distance,
          boards,
          filters: {
            jobTypes,
            minimumSalary,
            maximumSalary,
            postedDays,
          },
        },
      },
    },
    { status: 200 }
  );
});

function byDateDesc(jobs) {
  return [...jobs].sort(
    (a, b) => new Date(b.postedDate || 0).getTime() - new Date(a.postedDate || 0).getTime()
  );
}

// Round-robin across boards so page 1 is not monopolised by whichever board
// happened to return fastest or most. Within a board, newest first.
function interleaveByBoard(jobs, boards) {
  const buckets = new Map(boards.map((b) => [b, []]));

  for (const job of byDateDesc(jobs)) {
    if (!buckets.has(job.source)) buckets.set(job.source, []);
    buckets.get(job.source).push(job);
  }

  const queues = [...buckets.values()].filter((q) => q.length);
  const out = [];

  while (queues.some((q) => q.length)) {
    for (const queue of queues) {
      if (queue.length) out.push(queue.shift());
    }
  }

  return out;
}
