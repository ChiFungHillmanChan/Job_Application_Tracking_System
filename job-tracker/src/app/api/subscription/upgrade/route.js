// Port of backend/controllers/subscriptionController.js upgradeSubscription
// @route   POST /api/subscription/upgrade
// @access  Private
//
// Direct tier mapping: `user.subscriptionTier = planId` where planId is a
// SUBSCRIPTION_PLANS key (free/plus/pro), which matches the User model enum
// exactly - no premium/enterprise transformation.
import { NextResponse } from 'next/server';
import { withApi } from '@/server/http';
import { requireAuth } from '@/server/auth';
import { SUBSCRIPTION_PLANS } from '@/server/stripe';
import User from '@/server/models/User';
import logger from '@/server/logger';

export const POST = withApi(async (request) => {
  const authUser = await requireAuth(request);

  try {
    const { planId, stripeSubscriptionId } = await request
      .json()
      .catch(() => ({}));

    if (!planId) {
      return NextResponse.json(
        {
          success: false,
          error: 'Plan ID is required',
        },
        { status: 400 }
      );
    }

    const plan = SUBSCRIPTION_PLANS[planId];
    if (!plan) {
      return NextResponse.json(
        {
          success: false,
          error: 'Invalid plan ID',
        },
        { status: 400 }
      );
    }

    const user = await User.findById(authUser._id);

    // Direct tier mapping instead of transformation
    const oldTier = user.subscriptionTier;
    user.subscriptionTier = planId;
    user.subscriptionStatus = 'active';

    if (stripeSubscriptionId) {
      user.stripeSubscriptionId = stripeSubscriptionId;
    }

    await user.save();

    logger.info(
      `User ${user._id} upgraded from ${oldTier} to ${user.subscriptionTier}`
    );

    return NextResponse.json(
      {
        success: true,
        data: {
          user: {
            id: user._id,
            subscriptionTier: user.subscriptionTier,
            subscriptionStatus: user.subscriptionStatus,
          },
          plan: plan,
        },
      },
      { status: 200 }
    );
  } catch (error) {
    logger.error(`Error upgrading subscription: ${error.message}`);
    return NextResponse.json(
      {
        success: false,
        error: 'Server error while upgrading subscription',
      },
      { status: 500 }
    );
  }
});
