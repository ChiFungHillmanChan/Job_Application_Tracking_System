// Port of backend/controllers/subscriptionController.js getCurrentSubscription
// @route   GET /api/subscription/current
// @access  Private
import { NextResponse } from 'next/server';
import { withApi } from '@/server/http';
import { requireAuth } from '@/server/auth';
import { getStripe, SUBSCRIPTION_PLANS } from '@/server/stripe';
import User from '@/server/models/User';
import logger from '@/server/logger';

export const GET = withApi(async (request) => {
  const authUser = await requireAuth(request);

  try {
    const user = await User.findById(authUser._id).select(
      'subscriptionTier subscriptionStatus stripeCustomerId stripeSubscriptionId'
    );

    if (!user) {
      return NextResponse.json(
        {
          success: false,
          error: 'User not found',
        },
        { status: 404 }
      );
    }

    const currentPlan =
      SUBSCRIPTION_PLANS[user.subscriptionTier] || SUBSCRIPTION_PLANS.free;

    let subscriptionDetails = {
      currentPlan: user.subscriptionTier,
      planDetails: currentPlan,
      status: user.subscriptionStatus || 'active',
    };

    // If user has a Stripe subscription, get additional details
    if (user.stripeSubscriptionId) {
      try {
        const subscription = await getStripe().subscriptions.retrieve(
          user.stripeSubscriptionId
        );
        subscriptionDetails = {
          ...subscriptionDetails,
          billingCycle: subscription.items.data[0].price.recurring.interval,
          currentPeriodEnd: new Date(subscription.current_period_end * 1000),
          cancelAtPeriodEnd: subscription.cancel_at_period_end,
          status: subscription.status,
        };
      } catch (stripeError) {
        logger.error(`Error fetching Stripe subscription: ${stripeError.message}`);
      }
    }

    return NextResponse.json(
      {
        success: true,
        data: subscriptionDetails,
      },
      { status: 200 }
    );
  } catch (error) {
    logger.error(`Error fetching subscription details: ${error.message}`);
    return NextResponse.json(
      {
        success: false,
        error: 'Server error while fetching subscription details',
      },
      { status: 500 }
    );
  }
});
