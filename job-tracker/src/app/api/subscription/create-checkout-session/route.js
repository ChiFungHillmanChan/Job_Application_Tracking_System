// Port of backend/controllers/subscriptionController.js createCheckoutSession
// @route   POST /api/subscription/create-checkout-session
// @access  Private
//
// Body is parsed defensively (`.catch(() => ({}))`) so an empty/invalid body
// falls through to the source's own `if (!planId || !billingCycle)` 400 check,
// matching Express where `req.body` was already an object.
import { NextResponse } from 'next/server';
import { withApi } from '@/server/http';
import { requireAuth } from '@/server/auth';
import { getStripe, SUBSCRIPTION_PLANS } from '@/server/stripe';
import User from '@/server/models/User';
import logger from '@/server/logger';

export const POST = withApi(async (request) => {
  const authUser = await requireAuth(request);

  try {
    const { planId, billingCycle, successUrl, cancelUrl } = await request
      .json()
      .catch(() => ({}));

    if (!planId || !billingCycle) {
      return NextResponse.json(
        {
          success: false,
          error: 'Plan ID and billing cycle are required',
        },
        { status: 400 }
      );
    }

    if (planId === 'free') {
      return NextResponse.json(
        {
          success: false,
          error: 'Cannot create checkout session for free plan',
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

    // Get or create Stripe customer
    let customerId = user.stripeCustomerId;
    if (!customerId) {
      const customer = await getStripe().customers.create({
        email: user.email,
        name: user.name,
        metadata: {
          userId: user._id.toString(),
        },
      });
      customerId = customer.id;
      user.stripeCustomerId = customerId;
      await user.save();
    }

    const priceId =
      billingCycle === 'annual'
        ? plan.stripePriceIdAnnual
        : plan.stripePriceIdMonthly;

    if (!priceId) {
      return NextResponse.json(
        {
          success: false,
          error: `Stripe price ID not configured for ${planId} ${billingCycle}`,
        },
        { status: 400 }
      );
    }

    const session = await getStripe().checkout.sessions.create({
      customer: customerId,
      payment_method_types: ['card'],
      line_items: [
        {
          price: priceId,
          quantity: 1,
        },
      ],
      mode: 'subscription',
      success_url: successUrl,
      cancel_url: cancelUrl,
      metadata: {
        userId: user._id.toString(),
        planId: planId,
        billingCycle: billingCycle,
      },
    });

    return NextResponse.json(
      {
        success: true,
        data: {
          sessionId: session.id,
          url: session.url,
        },
      },
      { status: 200 }
    );
  } catch (error) {
    logger.error(`Error creating checkout session: ${error.message}`);
    return NextResponse.json(
      {
        success: false,
        error: 'Server error while creating checkout session',
      },
      { status: 500 }
    );
  }
});
