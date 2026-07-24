// Port of backend/controllers/jobFinderController.js getJobFinderStats
// @route   GET /api/job-finder/stats
// @access  Private
//
// Deviation: the original wraps its $match in
// `new mongoose.Types.ObjectId(userId)` because `req.user.id` is a plain
// string there. Here `requireAuth` already returns a hydrated User document,
// so `authUser._id` is already an ObjectId and is used directly (same
// simplification already used in src/app/api/jobs/stats/route.js).
import { NextResponse } from 'next/server';
import { withApi } from '@/server/http';
import { requireAuth } from '@/server/auth';
import SavedJob from '@/server/models/SavedJob';
import User from '@/server/models/User';
import logger from '@/server/logger';

export const GET = withApi(async (request) => {
  const authUser = await requireAuth(request);

  try {
    const userId = authUser._id;

    // Get saved jobs stats
    const totalSaved = await SavedJob.countDocuments({ user: userId });

    // Get saved jobs by source
    const savedBySource = await SavedJob.aggregate([
      { $match: { user: userId } },
      { $group: { _id: '$source', count: { $sum: 1 } } },
    ]);

    // Get imported jobs count
    const importedCount = await SavedJob.countDocuments({
      user: userId,
      importedToTracker: true,
    });

    // Get recent saved jobs (last 30 days)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const recentSaved = await SavedJob.countDocuments({
      user: userId,
      savedAt: { $gte: thirtyDaysAgo },
    });

    // Get jobs by job type
    const jobsByType = await SavedJob.aggregate([
      { $match: { user: userId } },
      { $group: { _id: '$jobType', count: { $sum: 1 } } },
    ]);

    // Get average salary range (if available)
    const salaryStats = await SavedJob.aggregate([
      {
        $match: {
          user: userId,
          'salary.min': { $exists: true, $gt: 0 },
        },
      },
      {
        $group: {
          _id: null,
          avgMin: { $avg: '$salary.min' },
          avgMax: { $avg: '$salary.max' },
          minSalary: { $min: '$salary.min' },
          maxSalary: { $max: '$salary.max' },
          count: { $sum: 1 },
        },
      },
    ]);

    // Get user subscription info
    const user = await User.findById(userId);
    const limit = user.subscriptionTier === 'free' ? 5 : null;

    // Format source breakdown
    const sourceBreakdown = savedBySource.reduce((acc, item) => {
      acc[item._id] = item.count;
      return acc;
    }, {});

    // Format job type breakdown
    const typeBreakdown = jobsByType.reduce((acc, item) => {
      acc[item._id] = item.count;
      return acc;
    }, {});

    return NextResponse.json(
      {
        success: true,
        data: {
          overview: {
            totalSaved,
            importedCount,
            recentSaved,
            importRate: totalSaved > 0 ? Math.round((importedCount / totalSaved) * 100) : 0,
          },
          breakdown: {
            bySource: sourceBreakdown,
            byJobType: typeBreakdown,
          },
          salary:
            salaryStats.length > 0
              ? {
                  averageMin: Math.round(salaryStats[0].avgMin || 0),
                  averageMax: Math.round(salaryStats[0].avgMax || 0),
                  range: {
                    min: salaryStats[0].minSalary || 0,
                    max: salaryStats[0].maxSalary || 0,
                  },
                  jobsWithSalary: salaryStats[0].count || 0,
                }
              : null,
          usage: {
            used: totalSaved,
            limit,
            tier: user.subscriptionTier,
            canSaveMore: await SavedJob.canUserSaveMore(userId, user.subscriptionTier),
            percentage: limit ? Math.round((totalSaved / limit) * 100) : 0,
          },
          lastUpdated: new Date().toISOString(),
        },
      },
      { status: 200 }
    );
  } catch (error) {
    logger.error(`Error fetching job finder stats: ${error.message}`);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to fetch statistics',
      },
      { status: 500 }
    );
  }
});
