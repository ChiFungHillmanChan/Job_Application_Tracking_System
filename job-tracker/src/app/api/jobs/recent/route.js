// Port of backend/controllers/jobController.js getRecentActivity
// @route   GET /api/jobs/recent
// @access  Private
import { NextResponse } from 'next/server';
import { withApi } from '@/server/http';
import { requireAuth } from '@/server/auth';
import Job from '@/server/models/Job';
import logger from '@/server/logger';

export const GET = withApi(async (request) => {
  const user = await requireAuth(request);

  try {
    const limitParam = request.nextUrl.searchParams.get('limit');
    const limit = limitParam ? parseInt(limitParam) : 10;

    const recentJobs = await Job.find({ user: user._id })
      .sort({ updatedAt: -1 })
      .limit(limit)
      .select('company position status updatedAt createdAt applicationDate')
      .lean();

    // Transform to activity format
    const activities = recentJobs.map((job) => {
      let type = 'Status Change';
      let date = job.updatedAt;

      // Determine activity type based on dates
      if (job.createdAt.getTime() === job.updatedAt.getTime()) {
        type = 'Job Added';
      } else if (
        job.applicationDate &&
        Math.abs(job.applicationDate.getTime() - job.updatedAt.getTime()) < 60000
      ) {
        type = 'Application Submitted';
      }

      return {
        id: job._id,
        date,
        company: job.company,
        position: job.position,
        status: job.status,
        type,
      };
    });

    return NextResponse.json(
      {
        success: true,
        count: activities.length,
        data: activities,
      },
      { status: 200 }
    );
  } catch (error) {
    logger.error(`Error fetching recent activity for user ${user._id}: ${error.message}`);
    return NextResponse.json(
      {
        success: false,
        error: 'Server error while fetching recent activity',
      },
      { status: 500 }
    );
  }
});
