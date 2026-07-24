// Port of backend/controllers/jobController.js getJobStats
// @route   GET /api/jobs/stats
// @access  Private
import { NextResponse } from 'next/server';
import { withApi } from '@/server/http';
import { requireAuth } from '@/server/auth';
import Job from '@/server/models/Job';
import logger from '@/server/logger';

export const GET = withApi(async (request) => {
  const user = await requireAuth(request);

  try {
    const stats = await Job.aggregate([
      { $match: { user: user._id } },
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 },
        },
      },
    ]);

    // Initialize all status counts to 0
    const statusCounts = {
      Saved: 0,
      Applied: 0,
      'Phone Screen': 0,
      Interview: 0,
      'Technical Assessment': 0,
      Offer: 0,
      Rejected: 0,
      Withdrawn: 0,
    };

    // Update counts from aggregation
    stats.forEach((stat) => {
      statusCounts[stat._id] = stat.count;
    });

    // Calculate total
    const total = Object.values(statusCounts).reduce((sum, count) => sum + count, 0);

    return NextResponse.json(
      {
        success: true,
        data: {
          total,
          ...statusCounts,
        },
      },
      { status: 200 }
    );
  } catch (error) {
    logger.error(`Error fetching job stats for user ${user._id}: ${error.message}`);
    return NextResponse.json(
      {
        success: false,
        error: 'Server error while fetching job statistics',
      },
      { status: 500 }
    );
  }
});
