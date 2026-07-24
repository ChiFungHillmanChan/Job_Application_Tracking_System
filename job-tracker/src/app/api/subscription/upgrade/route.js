// Port of backend/controllers/subscriptionController.js upgradeSubscription
// @route   POST /api/subscription/upgrade
// @access  Private
//
// SECURITY: entitlement is NEVER derived from the request body. The client may
// only name which plan it wants (planId, a SUBSCRIPTION_PLANS key
// free/plus/pro). The tier is only written when Stripe itself reports an active
// subscription for this user whose price belongs to the requested plan. Any
// client-supplied stripeSubscriptionId is ignored.
import { NextResponse } from 'next/server';
import { withApi } from '@/server/http';
import { requireAuth } from '@/server/auth';
import { SUBSCRIPTION_PLANS, getStripe } from '@/server/stripe';
import User from '@/server/models/User';
import logger from '@/server/logger';

export const POST = withApi(async (request) => {
  const authUser = await requireAuth(request);

  try {
    // Only planId is read from the client. stripeSubscriptionId (and anything
    // else) is intentionally ignored - it cannot be trusted for entitlement.
    const { planId } = await request.json().catch(() => ({}));

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

    // A billing account is created by the checkout flow. Without it there can be
    // no subscription to verify, so we refuse rather than trust the client.
    if (!user.stripeCustomerId) {
      return NextResponse.json(
        {
          success: false,
          error: 'No billing account. Please subscribe via checkout first.',
        },
        { status: 400 }
      );
    }

    // Ask Stripe (the source of truth) what this customer is actually paying for.
    const subscriptions = await getStripe().subscriptions.list({
      customer: user.stripeCustomerId,
      status: 'active',
      limit: 1,
    });

    const activeSubscription = subscriptions?.data?.[0];
    if (!activeSubscription) {
      return NextResponse.json(
        {
          success: false,
          error: 'No active subscription found. Please subscribe via checkout.',
        },
        { status: 402 }
      );
    }

    // The active subscription's price must belong to the requested plan before
    // we grant the tier. This blocks requesting a higher tier than was paid for.
    const planPriceIds = [
      plan.stripePriceIdMonthly,
      plan.stripePriceIdAnnual,
    ].filter(Boolean);
    const subscriptionPriceIds = (activeSubscription.items?.data || []).map(
      (item) => item?.price?.id
    );
    const priceMatches = subscriptionPriceIds.some((priceId) =>
      planPriceIds.includes(priceId)
    );

    if (!priceMatches) {
      return NextResponse.json(
        {
          success: false,
          error: 'Active subscription does not match the requested plan.',
        },
        { status: 400 }
      );
    }

    const oldTier = user.subscriptionTier;
    user.subscriptionTier = planId;
    user.subscriptionStatus = 'active';
    user.stripeSubscriptionId = activeSubscription.id;

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
