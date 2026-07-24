// Port of backend/controllers/jobController.js getJobs, createJob
// @route   GET/POST /api/jobs
// @access  Private
//
// Deviation: the Express controller calls `.populate('resume', 'name version')`
// but the Job schema field is `resumeUsed` (ref: 'Resume') - there is no
// `resume` path. Under Mongoose 8 (no strictPopulate:false anywhere in the
// app) that throws StrictPopulateError as soon as populate touches a real
// document, which would 500 every create/list/get/update call. Fixed by
// populating the actual field name, `resumeUsed`, here and in
// src/app/api/jobs/[id]/route.js. See task-5-report.md for details.
//
// Also imports the Resume model purely for its registration side effect:
// in Express, requiring server.js pulled in every model up front, so
// populate('resumeUsed', ...) could always resolve the 'Resume' ref. Next's
// per-route bundles only load what a file imports, so without this the
// same populate call fails with "Schema hasn't been registered for model
// Resume".
import { NextResponse } from 'next/server';
import { withApi, ApiError } from '@/server/http';
import { requireAuth } from '@/server/auth';
import { assertWithinPlanLimit } from '@/server/entitlements';
import Job, { JOB_UPDATABLE_FIELDS } from '@/server/models/Job';
import '@/server/models/Resume';
import { escapeRegex, pickAllowed, readJsonBody } from '@/server/requestUtils';
import logger from '@/server/logger';

export const GET = withApi(async (request) => {
  const user = await requireAuth(request);

  try {
    const searchParams = request.nextUrl.searchParams;
    const status = searchParams.get('status');
    const jobType = searchParams.get('jobType');
    const search = searchParams.get('search');
    const sortBy = searchParams.get('sortBy') || 'updatedAt';
    const sortOrder = searchParams.get('sortOrder') || 'desc';

    // Build filter object
    const filter = { user: user._id };

    if (status) {
      filter.status = status;
    }

    if (jobType) {
      filter.jobType = jobType;
    }

    // Build search filter.
    //
    // The search term is escaped before it reaches a RegExp: it is a literal
    // substring from the user, not a pattern. Previously `new RegExp(search)`
    // threw SyntaxError for any input containing an unbalanced metacharacter,
    // so searching "C++" (or "(", "*", "[", "?") returned a 500.
    if (search) {
      const safeSearch = escapeRegex(search);
      filter.$or = [
        { company: { $regex: safeSearch, $options: 'i' } },
        { position: { $regex: safeSearch, $options: 'i' } },
        { location: { $regex: safeSearch, $options: 'i' } },
        { notes: { $regex: safeSearch, $options: 'i' } },
        { tags: { $in: [new RegExp(safeSearch, 'i')] } },
      ];
    }

    // Build sort object
    const sort = {};
    sort[sortBy] = sortOrder === 'desc' ? -1 : 1;

    const jobs = await Job.find(filter)
      .populate('resumeUsed', 'name version')
      .sort(sort);

    return NextResponse.json(
      {
        success: true,
        count: jobs.length,
        data: jobs,
      },
      { status: 200 }
    );
  } catch (error) {
    logger.error(`Error fetching jobs for user ${user._id}: ${error.message}`);
    return NextResponse.json(
      {
        success: false,
        error: 'Server error while fetching jobs',
      },
      { status: 500 }
    );
  }
});

export const POST = withApi(async (request) => {
  const user = await requireAuth(request);

  try {
    // readJsonBody (not request.json()) so an empty/malformed body falls through
    // to the 400 below instead of throwing and surfacing as a generic 500.
    const body = await readJsonBody(request);

    // Validate required fields
    const { company, position, location, status } = body;

    if (!company || !position || !location || !status) {
      return NextResponse.json(
        {
          success: false,
          error: 'Please provide company, position, location, and status',
        },
        { status: 400 }
      );
    }

    // Monthly application allowance, matching the `jobApplicationsThisMonth` /
    // `jobApplicationsLimit` pair that GET /api/subscription/usage already
    // reports to the UI. Counted per calendar month, so an existing user with
    // more historical jobs than the allowance is never locked out of the app -
    // only from adding new ones this month.
    const monthStart = new Date();
    monthStart.setDate(1);
    monthStart.setHours(0, 0, 0, 0);
    const jobsThisMonth = await Job.countDocuments({
      user: user._id,
      createdAt: { $gte: monthStart },
    });
    assertWithinPlanLimit(user, 'jobApplications', jobsThisMonth, 'monthly job application');

    // Same allowlist as PUT /api/jobs/:id - `user` is taken from the verified
    // token, never from the request body.
    const job = await Job.create({
      ...pickAllowed(body, JOB_UPDATABLE_FIELDS),
      user: user._id,
    });

    // Populate the job with related data
    const populatedJob = await Job.findById(job._id)
      .populate('resumeUsed', 'name version')
      .populate('user', 'name email');

    logger.info(`New job created by user ${user._id}: ${company} - ${position}`);

    return NextResponse.json(
      {
        success: true,
        data: populatedJob,
      },
      { status: 201 }
    );
  } catch (error) {
    // ApiError carries its own status and user-facing message (e.g. the 403
    // from the plan-limit check). Let withApi render it instead of flattening
    // it into a generic 500.
    if (error instanceof ApiError) throw error;

    logger.error(`Error creating job for user ${user._id}: ${error.message}`);

    // Handle mongoose validation errors
    if (error.name === 'ValidationError') {
      const messages = Object.values(error.errors).map((val) => val.message);
      return NextResponse.json(
        {
          success: false,
          error: messages,
        },
        { status: 400 }
      );
    }

    return NextResponse.json(
      {
        success: false,
        error: 'Server error while creating job',
      },
      { status: 500 }
    );
  }
});
