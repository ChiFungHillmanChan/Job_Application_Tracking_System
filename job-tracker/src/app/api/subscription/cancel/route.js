// Port of backend/controllers/subscriptionController.js cancelSubscription
// @route   POST /api/subscription/cancel
// @access  Private
import { NextResponse } from 'next/server';
import { withApi } from '@/server/http';
import { requireAuth } from '@/server/auth';
import { getStripe } from '@/server/stripe';
import User from '@/server/models/User';
import logger from '@/server/logger';

export const POST = withApi(async (request) => {
  const authUser = await requireAuth(request);

  try {
    const user = await User.findById(authUser._id);

    // Cancel Stripe subscription if exists
    if (user.stripeSubscriptionId) {
      try {
        await getStripe().subscriptions.update(user.stripeSubscriptionId, {
          cancel_at_period_end: true,
        });
      } catch (stripeError) {
        logger.error(`Error cancelling Stripe subscription: ${stripeError.message}`);
      }
    }

    // Update user to free tier
    const oldTier = user.subscriptionTier;
    user.subscriptionTier = 'free';
    user.subscriptionStatus = 'cancelled';

    await user.save();

    logger.info(
      `User ${user._id} cancelled subscription, downgraded from ${oldTier} to free`
    );

    return NextResponse.json(
      {
        success: true,
        message: 'Subscription cancelled successfully',
        data: {
          user: {
            id: user._id,
            subscriptionTier: user.subscriptionTier,
            subscriptionStatus: user.subscriptionStatus,
          },
        },
      },
      { status: 200 }
    );
  } catch (error) {
    logger.error(`Error cancelling subscription: ${error.message}`);
    return NextResponse.json(
      {
        success: false,
        error: 'Server error while cancelling subscription',
      },
      { status: 500 }
    );
  }
});
