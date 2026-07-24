// Port of backend/controllers/jobController.js getJob, updateJob, deleteJob
// @route   GET/PUT/DELETE /api/jobs/:id
// @access  Private
//
// Deviation: populate('resume', ...) -> populate('resumeUsed', ...), and an
// import of the Resume model for its registration side effect (needed for
// that populate to resolve at all under Next's per-route bundling) - see
// src/app/api/jobs/route.js for the full explanation.
import { NextResponse } from 'next/server';
import { withApi } from '@/server/http';
import { requireAuth } from '@/server/auth';
import Job from '@/server/models/Job';
import '@/server/models/Resume';
import logger from '@/server/logger';

export const GET = withApi(async (request, context) => {
  const user = await requireAuth(request);
  const { id } = await context.params;

  try {
    const job = await Job.findById(id)
      .populate('resumeUsed', 'name version')
      .populate('user', 'name email');

    if (!job) {
      return NextResponse.json(
        {
          success: false,
          error: 'Job not found',
        },
        { status: 404 }
      );
    }

    // Check if job belongs to user
    if (job.user._id.toString() !== user._id.toString()) {
      return NextResponse.json(
        {
          success: false,
          error: 'Not authorized to access this job',
        },
        { status: 403 }
      );
    }

    return NextResponse.json(
      {
        success: true,
        data: job,
      },
      { status: 200 }
    );
  } catch (error) {
    logger.error(`Error fetching job ${id}: ${error.message}`);

    if (error.name === 'CastError') {
      return NextResponse.json(
        {
          success: false,
          error: 'Job not found',
        },
        { status: 404 }
      );
    }

    return NextResponse.json(
      {
        success: false,
        error: 'Server error while fetching job',
      },
      { status: 500 }
    );
  }
});

export const PUT = withApi(async (request, context) => {
  const user = await requireAuth(request);
  const { id } = await context.params;

  try {
    const body = await request.json();

    let job = await Job.findById(id);

    if (!job) {
      return NextResponse.json(
        {
          success: false,
          error: 'Job not found',
        },
        { status: 404 }
      );
    }

    // Check if job belongs to user
    if (job.user.toString() !== user._id.toString()) {
      return NextResponse.json(
        {
          success: false,
          error: 'Not authorized to update this job',
        },
        { status: 403 }
      );
    }

    // Update job
    job = await Job.findByIdAndUpdate(
      id,
      { ...body, updatedAt: Date.now() },
      { new: true, runValidators: true }
    ).populate('resumeUsed', 'name version');

    logger.info(`Job updated by user ${user._id}: ${job.company} - ${job.position}`);

    return NextResponse.json(
      {
        success: true,
        data: job,
      },
      { status: 200 }
    );
  } catch (error) {
    logger.error(`Error updating job ${id}: ${error.message}`);

    if (error.name === 'CastError') {
      return NextResponse.json(
        {
          success: false,
          error: 'Job not found',
        },
        { status: 404 }
      );
    }

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
        error: 'Server error while updating job',
      },
      { status: 500 }
    );
  }
});

export const DELETE = withApi(async (request, context) => {
  const user = await requireAuth(request);
  const { id } = await context.params;

  try {
    const job = await Job.findById(id);

    if (!job) {
      return NextResponse.json(
        {
          success: false,
          error: 'Job not found',
        },
        { status: 404 }
      );
    }

    // Check if job belongs to user
    if (job.user.toString() !== user._id.toString()) {
      return NextResponse.json(
        {
          success: false,
          error: 'Not authorized to delete this job',
        },
        { status: 403 }
      );
    }

    await job.deleteOne();

    logger.info(`Job deleted by user ${user._id}: ${job.company} - ${job.position}`);

    return NextResponse.json(
      {
        success: true,
        data: {},
      },
      { status: 200 }
    );
  } catch (error) {
    logger.error(`Error deleting job ${id}: ${error.message}`);

    if (error.name === 'CastError') {
      return NextResponse.json(
        {
          success: false,
          error: 'Job not found',
        },
        { status: 404 }
      );
    }

    return NextResponse.json(
      {
        success: false,
        error: 'Server error while deleting job',
      },
      { status: 500 }
    );
  }
});
