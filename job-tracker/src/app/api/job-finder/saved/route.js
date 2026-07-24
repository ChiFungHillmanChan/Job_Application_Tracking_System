// Port of backend/controllers/jobFinderController.js saveJob, getSavedJobs
// @route   POST/GET /api/job-finder/saved
// @access  Private
//
// Deviation: the express-rate-limit `saveLimiter` middleware (POST /saved)
// is dropped entirely (platform WAF handles rate limiting later) - no
// reimplementation.
import { NextResponse } from 'next/server';
import { withApi } from '@/server/http';
import { requireAuth } from '@/server/auth';
import SavedJob from '@/server/models/SavedJob';
import User from '@/server/models/User';
import { escapeRegex, parsePagination, readJsonBody } from '@/server/requestUtils';
import logger from '@/server/logger';

export const POST = withApi(async (request) => {
  const authUser = await requireAuth(request);
  const body = await readJsonBody(request);

  const {
    externalId,
    source,
    title,
    company,
    location,
    salary,
    jobType,
    workType,
    description,
    applicationUrl,
    companyUrl,
    logoUrl,
    postedDate,
    expirationDate,
    tags,
    notes,
  } = body;

  // Validate required fields
  if (!externalId || !source || !title || !company || !applicationUrl) {
    return NextResponse.json(
      {
        success: false,
        error: 'Missing required fields: externalId, source, title, company, applicationUrl',
      },
      { status: 400 }
    );
  }

  // Check if user can save more jobs
  const user = await User.findById(authUser._id);
  const canSave = await SavedJob.canUserSaveMore(authUser._id, user.subscriptionTier);

  if (!canSave) {
    const currentCount = await SavedJob.getUserSavedCount(authUser._id);
    const limit = user.subscriptionTier === 'free' ? 5 : 'unlimited';

    return NextResponse.json(
      {
        success: false,
        error: `You have reached your saved jobs limit (${currentCount}/${limit}). Upgrade to save more jobs.`,
        code: 'LIMIT_EXCEEDED',
        currentCount,
        limit: user.subscriptionTier === 'free' ? 5 : null,
        upgradeUrl: '/settings/subscription',
      },
      { status: 403 }
    );
  }

  // Check if job already saved
  const existingSavedJob = await SavedJob.findOne({
    user: authUser._id,
    source,
    externalId,
  });

  if (existingSavedJob) {
    return NextResponse.json(
      {
        success: false,
        error: 'Job already saved',
        data: existingSavedJob,
      },
      { status: 409 }
    );
  }

  try {
    const savedJob = await SavedJob.create({
      user: authUser._id,
      externalId,
      source,
      title,
      company,
      location,
      salary,
      jobType,
      workType,
      description,
      applicationUrl,
      companyUrl,
      logoUrl,
      postedDate: postedDate ? new Date(postedDate) : new Date(),
      expirationDate: expirationDate ? new Date(expirationDate) : null,
      tags: tags || [],
      notes: notes || '',
      originalData: body, // Store original for debugging
    });

    logger.info(`Job saved: ${title} at ${company} by user ${authUser._id}`);

    return NextResponse.json(
      {
        success: true,
        data: savedJob,
        message: 'Job saved successfully',
      },
      { status: 201 }
    );
  } catch (error) {
    logger.error(`Error saving job: ${error.message}`);

    if (error.name === 'ValidationError') {
      const messages = Object.values(error.errors).map((val) => val.message);
      return NextResponse.json(
        {
          success: false,
          error: messages.join(', '),
        },
        { status: 400 }
      );
    }

    return NextResponse.json(
      {
        success: false,
        error: 'Failed to save job',
      },
      { status: 500 }
    );
  }
});

export const GET = withApi(async (request) => {
  const authUser = await requireAuth(request);
  const searchParams = request.nextUrl.searchParams;

  const query = Object.fromEntries(searchParams.entries());
  const {
    sortBy = 'savedAt',
    sortOrder = 'desc',
    source,
    jobType,
    location,
  } = query;
  const tagsList = searchParams.getAll('tags');
  const tags = tagsList.length > 1 ? tagsList : tagsList[0];
  const { page, limit, skip } = parsePagination(searchParams, { defaultLimit: 20 });

  // Build filter query
  const filter = { user: authUser._id };

  if (source) filter.source = source;
  if (jobType) filter.jobType = jobType;
  if (location) {
    // Escaped: this is a literal location substring, and an unbalanced
    // metacharacter would otherwise throw SyntaxError and 500 the request.
    filter['location.display'] = new RegExp(escapeRegex(location), 'i');
  }
  if (tags) {
    const tagArray = Array.isArray(tags) ? tags : [tags];
    filter.tags = { $in: tagArray };
  }

  // Build sort object
  const sort = {};
  sort[sortBy] = sortOrder === 'desc' ? -1 : 1;

  try {
    const savedJobs = await SavedJob.find(filter)
      .sort(sort)
      .limit(limit)
      .skip(skip)
      .exec();

    const totalCount = await SavedJob.countDocuments(filter);
    const totalPages = Math.ceil(totalCount / limit);

    // Get user's subscription info for limits
    const user = await User.findById(authUser._id);
    const usageInfo = {
      used: await SavedJob.getUserSavedCount(authUser._id),
      limit: user.subscriptionTier === 'free' ? 5 : null,
      tier: user.subscriptionTier,
    };

    return NextResponse.json(
      {
        success: true,
        data: {
          jobs: savedJobs,
          pagination: {
            currentPage: page,
            totalPages,
            totalCount,
            limit,
            hasNextPage: page < totalPages,
            hasPreviousPage: page > 1,
          },
          usage: usageInfo,
          filters: {
            source,
            jobType,
            location,
            tags,
          },
        },
      },
      { status: 200 }
    );
  } catch (error) {
    logger.error(`Error fetching saved jobs: ${error.message}`);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to fetch saved jobs',
      },
      { status: 500 }
    );
  }
});
