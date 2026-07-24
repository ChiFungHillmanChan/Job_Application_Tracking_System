// Port of backend/controllers/subscriptionController.js handleStripeWebhook
// (plus its handleSuccessfulPayment / handleSubscriptionUpdate /
// handleSubscriptionCancellation / handlePaymentFailure helpers).
// @route   POST /api/subscription/webhook
// @access  Public (Stripe webhook)
//
// This handler intentionally does NOT use withApi: it needs Stripe's raw
// request body for signature verification and returns the source's exact
// non-JSON responses (a plain-text `Webhook Error: ...` 400 on signature
// failure, and `{ received: true }` on success). connectDB() is called before
// any user lookup/update. In the App Router the raw body comes from
// `request.text()` - there is no body parser to disable (that is a Pages
// Router concern), so no route `config` export is needed.
//
// Tier handling matches the source: metadata.planId is written straight to
// user.subscriptionTier (free/plus/pro), so no premium/enterprise mapping.
import { NextResponse } from 'next/server';
import { connectDB } from '@/server/db';
import { getStripe } from '@/server/stripe';
import User from '@/server/models/User';
import logger from '@/server/logger';

export async function POST(request) {
  const body = await request.text();
  const sig = request.headers.get('stripe-signature');
  let event;

  try {
    event = getStripe().webhooks.constructEvent(
      body,
      sig,
      process.env.STRIPE_WEBHOOK_SECRET
    );
  } catch (err) {
    logger.error(`Webhook signature verification failed: ${err.message}`);
    return new NextResponse(`Webhook Error: ${err.message}`, { status: 400 });
  }

  // Connect before any user lookups/updates in the handlers below.
  await connectDB();

  // Handle the event
  switch (event.type) {
    case 'checkout.session.completed': {
      const session = event.data.object;
      await handleSuccessfulPayment(session);
      break;
    }

    case 'customer.subscription.updated': {
      const subscription = event.data.object;
      await handleSubscriptionUpdate(subscription);
      break;
    }

    case 'customer.subscription.deleted': {
      const deletedSubscription = event.data.object;
      await handleSubscriptionCancellation(deletedSubscription);
      break;
    }

    case 'invoice.payment_failed': {
      const failedInvoice = event.data.object;
      await handlePaymentFailure(failedInvoice);
      break;
    }

    default:
      logger.info(`Unhandled event type: ${event.type}`);
  }

  return NextResponse.json({ received: true });
}

// Helper function to handle successful payment
async function handleSuccessfulPayment(session) {
  try {
    const userId = session.metadata.userId;
    const planId = session.metadata.planId;

    const user = await User.findById(userId);
    if (!user) {
      logger.error(`User not found for successful payment: ${userId}`);
      return;
    }

    // Direct tier mapping - keep planId as-is (free/plus/pro)
    user.subscriptionTier = planId;
    user.subscriptionStatus = 'active';
    user.stripeSubscriptionId = session.subscription;

    await user.save();

    logger.info(
      `Successfully updated user ${userId} to ${user.subscriptionTier} after payment`
    );
  } catch (error) {
    logger.error(`Error handling successful payment: ${error.message}`);
  }
}

// Helper function to handle subscription updates
async function handleSubscriptionUpdate(subscription) {
  try {
    const user = await User.findOne({ stripeSubscriptionId: subscription.id });
    if (!user) {
      logger.error(`User not found for subscription update: ${subscription.id}`);
      return;
    }

    user.subscriptionStatus = subscription.status;
    await user.save();

    logger.info(
      `Updated subscription status for user ${user._id} to ${subscription.status}`
    );
  } catch (error) {
    logger.error(`Error handling subscription update: ${error.message}`);
  }
}

// Helper function to handle subscription cancellation
async function handleSubscriptionCancellation(subscription) {
  try {
    const user = await User.findOne({ stripeSubscriptionId: subscription.id });
    if (!user) {
      logger.error(
        `User not found for subscription cancellation: ${subscription.id}`
      );
      return;
    }

    user.subscriptionTier = 'free';
    user.subscriptionStatus = 'cancelled';
    user.stripeSubscriptionId = null;

    await user.save();

    logger.info(
      `Cancelled subscription for user ${user._id}, downgraded to free tier`
    );
  } catch (error) {
    logger.error(`Error handling subscription cancellation: ${error.message}`);
  }
}

// Helper function to handle payment failures
async function handlePaymentFailure(invoice) {
  try {
    const user = await User.findOne({ stripeCustomerId: invoice.customer });
    if (!user) {
      logger.error(`User not found for payment failure: ${invoice.customer}`);
      return;
    }

    // Could send notification email or update user status
    logger.warn(`Payment failed for user ${user._id}, invoice ${invoice.id}`);

    // Optionally update subscription status
    user.subscriptionStatus = 'past_due';
    await user.save();
  } catch (error) {
    logger.error(`Error handling payment failure: ${error.message}`);
  }
}
