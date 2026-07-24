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
import { withApi } from '@/server/http';
import { requireAuth } from '@/server/auth';
import Job from '@/server/models/Job';
import '@/server/models/Resume';
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

    // Build search filter
    if (search) {
      filter.$or = [
        { company: { $regex: search, $options: 'i' } },
        { position: { $regex: search, $options: 'i' } },
        { location: { $regex: search, $options: 'i' } },
        { notes: { $regex: search, $options: 'i' } },
        { tags: { $in: [new RegExp(search, 'i')] } },
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
    const body = await request.json();

    // Add user to body
    body.user = user._id;

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

    // Create job
    const job = await Job.create(body);

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
