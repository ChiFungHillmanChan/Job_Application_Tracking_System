// Port of backend/controllers/autoApplyController.js getAutoApplyStats
// @route   GET /api/auto-apply/stats
// @access  Private
import { NextResponse } from 'next/server';
import mongoose from 'mongoose';
import { withApi } from '@/server/http';
import { requireAuth } from '@/server/auth';
import PreparedApplication from '@/server/models/PreparedApplication';
import AutomationRun from '@/server/models/AutomationRun';
import SearchConfig from '@/server/models/SearchConfig';
import UserProfile from '@/server/models/UserProfile';

export const GET = withApi(async (request) => {
  const authUser = await requireAuth(request);
  const userId = authUser._id;

  const [
    totalPrepared,
    pendingReview,
    approved,
    submitted,
    rejected,
    recentRuns,
    config,
    profile,
  ] = await Promise.all([
    PreparedApplication.countDocuments({ user: userId }),
    PreparedApplication.countDocuments({ user: userId, status: 'pending_review' }),
    PreparedApplication.countDocuments({ user: userId, status: 'approved' }),
    PreparedApplication.countDocuments({ user: userId, status: 'submitted' }),
    PreparedApplication.countDocuments({ user: userId, status: 'rejected' }),
    AutomationRun.find({ user: userId }).sort({ runDate: -1 }).limit(5),
    SearchConfig.findOne({ user: userId }),
    UserProfile.findOne({ user: userId }),
  ]);

  const avgMatchScore = await PreparedApplication.aggregate([
    { $match: { user: new mongoose.Types.ObjectId(userId) } },
    { $group: { _id: null, avg: { $avg: '$matchScore' } } },
  ]);

  return NextResponse.json(
    {
      success: true,
      data: {
        overview: {
          totalPrepared,
          pendingReview,
          approved,
          submitted,
          rejected,
          avgMatchScore: avgMatchScore[0]?.avg ? Math.round(avgMatchScore[0].avg) : 0,
        },
        hasProfile: !!profile,
        hasConfig: !!config,
        isActive: config?.isActive || false,
        lastRunAt: config?.lastRunAt || null,
        recentRuns,
      },
    },
    { status: 200 }
  );
});
