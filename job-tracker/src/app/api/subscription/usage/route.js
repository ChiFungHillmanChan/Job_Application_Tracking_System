// Port of backend/controllers/subscriptionController.js getUsageStats
// @route   GET /api/subscription/usage
// @access  Private
//
// Resume and Job are imported directly (the Express source lazy-required them
// via `require('../models/Resume')` / `require('../models/Job')`); explicit
// imports here also guarantee the models are registered for this route bundle.
import { NextResponse } from 'next/server';
import { withApi } from '@/server/http';
import { requireAuth } from '@/server/auth';
import { SUBSCRIPTION_PLANS } from '@/server/stripe';
import User from '@/server/models/User';
import Resume from '@/server/models/Resume';
import Job from '@/server/models/Job';
import logger from '@/server/logger';

export const GET = withApi(async (request) => {
  const authUser = await requireAuth(request);

  try {
    const userId = authUser._id;

    const currentMonth = new Date();
    currentMonth.setDate(1);
    currentMonth.setHours(0, 0, 0, 0);

    const [resumeCount, jobApplicationsThisMonth, totalJobApplications] =
      await Promise.all([
        Resume.countDocuments({ user: userId }),
        Job.countDocuments({
          user: userId,
          createdAt: { $gte: currentMonth },
        }),
        Job.countDocuments({ user: userId }),
      ]);

    const user = await User.findById(userId);

    // Direct tier lookup instead of transformation
    const planLimits =
      SUBSCRIPTION_PLANS[user.subscriptionTier] || SUBSCRIPTION_PLANS.free;

    return NextResponse.json(
      {
        success: true,
        data: {
          resumeCount,
          resumeLimit: planLimits.features.resumes,
          jobApplicationsThisMonth,
          jobApplicationsLimit: planLimits.features.jobApplications,
          totalJobApplications,
          planLimits: planLimits.features,
          subscriptionTier: user.subscriptionTier, // Include current tier
        },
      },
      { status: 200 }
    );
  } catch (error) {
    logger.error(`Error fetching usage statistics: ${error.message}`);
    return NextResponse.json(
      {
        success: false,
        error: 'Server error while fetching usage statistics',
      },
      { status: 500 }
    );
  }
});
