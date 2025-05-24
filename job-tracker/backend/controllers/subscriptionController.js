const User = require('../models/User');
const asyncHandler = require('express-async-handler');
const logger = require('../utils/logger');
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);

// Plan configurations with pricing
const SUBSCRIPTION_PLANS = {
  free: {
    id: 'free',
    name: 'Free',
    monthlyPrice: 0,
    annualPrice: 0,
    stripePriceIdMonthly: null,
    stripePriceIdAnnual: null,
    features: {
      resumes: 5,
      jobApplications: 30,
      storage: 1, // GB
      support: 'standard'
    }
  },
  plus: {
    id: 'plus',
    name: 'Plus',
    monthlyPrice: 888, // in pence (£8.88)
    annualPrice: 7477, // in pence (£74.77 - 30% discount)
    stripePriceIdMonthly: process.env.STRIPE_PLUS_MONTHLY_PRICE_ID,
    stripePriceIdAnnual: process.env.STRIPE_PLUS_ANNUAL_PRICE_ID,
    features: {
      resumes: Infinity,
      jobApplications: Infinity,
      storage: 10, // GB
      support: 'priority'
    }
  },
  pro: {
    id: 'pro',
    name: 'Pro',
    monthlyPrice: 3888, // in pence (£38.88)
    annualPrice: 32734, // in pence (£327.34 - 30% discount)
    stripePriceIdMonthly: process.env.STRIPE_PRO_MONTHLY_PRICE_ID,
    stripePriceIdAnnual: process.env.STRIPE_PRO_ANNUAL_PRICE_ID,
    features: {
      resumes: Infinity,
      jobApplications: Infinity,
      storage: 100, // GB
      support: 'dedicated',
      aiFeatures: true,
      personalConsultation: true,
      betaAccess: true
    }
  }
};

// @desc    Get current subscription details
// @route   GET /api/subscription/current
// @access  Private
const getCurrentSubscription = asyncHandler(async (req, res) => {
  try {
    const user = await User.findById(req.user._id).select('subscriptionTier subscriptionStatus stripeCustomerId stripeSubscriptionId');
    
    if (!user) {
      return res.status(404).json({
        success: false,
        error: 'User not found'
      });
    }

    const currentPlan = SUBSCRIPTION_PLANS[user.subscriptionTier] || SUBSCRIPTION_PLANS.free;
    
    let subscriptionDetails = {
      currentPlan: user.subscriptionTier,
      planDetails: currentPlan,
      status: user.subscriptionStatus || 'active'
    };

    // If user has a Stripe subscription, get additional details
    if (user.stripeSubscriptionId) {
      try {
        const subscription = await stripe.subscriptions.retrieve(user.stripeSubscriptionId);
        subscriptionDetails = {
          ...subscriptionDetails,
          billingCycle: subscription.items.data[0].price.recurring.interval,
          currentPeriodEnd: new Date(subscription.current_period_end * 1000),
          cancelAtPeriodEnd: subscription.cancel_at_period_end,
          status: subscription.status
        };
      } catch (stripeError) {
        logger.error(`Error fetching Stripe subscription: ${stripeError.message}`);
      }
    }

    res.status(200).json({
      success: true,
      data: subscriptionDetails
    });
  } catch (error) {
    logger.error(`Error fetching subscription details: ${error.message}`);
    res.status(500).json({
      success: false,
      error: 'Server error while fetching subscription details'
    });
  }
});

// @desc    Get available subscription plans
// @route   GET /api/subscription/plans
// @access  Public
const getPlans = asyncHandler(async (req, res) => {
  res.status(200).json({
    success: true,
    data: Object.values(SUBSCRIPTION_PLANS)
  });
});

// @desc    Create Stripe checkout session for subscription upgrade
// @route   POST /api/subscription/create-checkout-session
// @access  Private
const createCheckoutSession = asyncHandler(async (req, res) => {
  try {
    const { planId, billingCycle, successUrl, cancelUrl } = req.body;
    
    if (!planId || !billingCycle) {
      return res.status(400).json({
        success: false,
        error: 'Plan ID and billing cycle are required'
      });
    }

    if (planId === 'free') {
      return res.status(400).json({
        success: false,
        error: 'Cannot create checkout session for free plan'
      });
    }

    const plan = SUBSCRIPTION_PLANS[planId];
    if (!plan) {
      return res.status(400).json({
        success: false,
        error: 'Invalid plan ID'
      });
    }

    const user = await User.findById(req.user._id);
    
    // Get or create Stripe customer
    let customerId = user.stripeCustomerId;
    if (!customerId) {
      const customer = await stripe.customers.create({
        email: user.email,
        name: user.name,
        metadata: {
          userId: user._id.toString()
        }
      });
      customerId = customer.id;
      user.stripeCustomerId = customerId;
      await user.save();
    }

    const priceId = billingCycle === 'annual' ? plan.stripePriceIdAnnual : plan.stripePriceIdMonthly;
    
    if (!priceId) {
      return res.status(400).json({
        success: false,
        error: `Stripe price ID not configured for ${planId} ${billingCycle}`
      });
    }

    const session = await stripe.checkout.sessions.create({
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
        billingCycle: billingCycle
      }
    });

    res.status(200).json({
      success: true,
      data: {
        sessionId: session.id,
        url: session.url
      }
    });

  } catch (error) {
    logger.error(`Error creating checkout session: ${error.message}`);
    res.status(500).json({
      success: false,
      error: 'Server error while creating checkout session'
    });
  }
});

// @desc    Handle successful subscription upgrade
// @route   POST /api/subscription/upgrade
// @access  Private
const upgradeSubscription = asyncHandler(async (req, res) => {
  try {
    const { planId, stripeSubscriptionId } = req.body;
    
    if (!planId) {
      return res.status(400).json({
        success: false,
        error: 'Plan ID is required'
      });
    }

    const plan = SUBSCRIPTION_PLANS[planId];
    if (!plan) {
      return res.status(400).json({
        success: false,
        error: 'Invalid plan ID'
      });
    }

    const user = await User.findById(req.user._id);
    
    // Update user subscription
    const oldTier = user.subscriptionTier;
    user.subscriptionTier = planId === 'plus' ? 'premium' : planId === 'pro' ? 'enterprise' : 'free';
    user.subscriptionStatus = 'active';
    
    if (stripeSubscriptionId) {
      user.stripeSubscriptionId = stripeSubscriptionId;
    }
    
    await user.save();

    logger.info(`User ${user._id} upgraded from ${oldTier} to ${user.subscriptionTier}`);

    res.status(200).json({
      success: true,
      data: {
        user: {
          id: user._id,
          subscriptionTier: user.subscriptionTier,
          subscriptionStatus: user.subscriptionStatus
        },
        plan: plan
      }
    });

  } catch (error) {
    logger.error(`Error upgrading subscription: ${error.message}`);
    res.status(500).json({
      success: false,
      error: 'Server error while upgrading subscription'
    });
  }
});

// @desc    Cancel subscription (downgrade to free)
// @route   POST /api/subscription/cancel
// @access  Private
const cancelSubscription = asyncHandler(async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    
    // Cancel Stripe subscription if exists
    if (user.stripeSubscriptionId) {
      try {
        await stripe.subscriptions.update(user.stripeSubscriptionId, {
          cancel_at_period_end: true
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

    logger.info(`User ${user._id} cancelled subscription, downgraded from ${oldTier} to free`);

    res.status(200).json({
      success: true,
      message: 'Subscription cancelled successfully',
      data: {
        user: {
          id: user._id,
          subscriptionTier: user.subscriptionTier,
          subscriptionStatus: user.subscriptionStatus
        }
      }
    });

  } catch (error) {
    logger.error(`Error cancelling subscription: ${error.message}`);
    res.status(500).json({
      success: false,
      error: 'Server error while cancelling subscription'
    });
  }
});

// @desc    Get billing history
// @route   GET /api/subscription/billing-history
// @access  Private
const getBillingHistory = asyncHandler(async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    
    if (!user.stripeCustomerId) {
      return res.status(200).json({
        success: true,
        data: []
      });
    }

    const invoices = await stripe.invoices.list({
      customer: user.stripeCustomerId,
      limit: 100
    });

    const billingHistory = invoices.data.map(invoice => ({
      id: invoice.id,
      date: new Date(invoice.created * 1000),
      amount: invoice.amount_paid,
      currency: invoice.currency,
      status: invoice.status,
      invoiceUrl: invoice.hosted_invoice_url,
      downloadUrl: invoice.invoice_pdf
    }));

    res.status(200).json({
      success: true,
      data: billingHistory
    });

  } catch (error) {
    logger.error(`Error fetching billing history: ${error.message}`);
    res.status(500).json({
      success: false,
      error: 'Server error while fetching billing history'
    });
  }
});

// @desc    Get subscription usage statistics
// @route   GET /api/subscription/usage
// @access  Private
const getUsageStats = asyncHandler(async (req, res) => {
  try {
    const userId = req.user._id;
    
    // Get current month's job applications count
    const currentMonth = new Date();
    currentMonth.setDate(1);
    currentMonth.setHours(0, 0, 0, 0);
    
    const [resumeCount, jobApplicationsThisMonth, totalJobApplications] = await Promise.all([
      // Count user's resumes
      require('../models/Resume').countDocuments({ user: userId }),
      // Count this month's job applications
      require('../models/Job').countDocuments({
        user: userId,
        createdAt: { $gte: currentMonth }
      }),
      // Count total job applications
      require('../models/Job').countDocuments({ user: userId })
    ]);

    const user = await User.findById(userId);
    const planLimits = SUBSCRIPTION_PLANS[user.subscriptionTier === 'premium' ? 'plus' : user.subscriptionTier === 'enterprise' ? 'pro' : 'free'];

    res.status(200).json({
      success: true,
      data: {
        resumeCount,
        resumeLimit: planLimits.features.resumes,
        jobApplicationsThisMonth,
        jobApplicationsLimit: planLimits.features.jobApplications,
        totalJobApplications,
        planLimits: planLimits.features
      }
    });

  } catch (error) {
    logger.error(`Error fetching usage statistics: ${error.message}`);
    res.status(500).json({
      success: false,
      error: 'Server error while fetching usage statistics'
    });
  }
});

// @desc    Webhook handler for Stripe events
// @route   POST /api/subscription/webhook
// @access  Public (Stripe webhook)
const handleStripeWebhook = asyncHandler(async (req, res) => {
  const sig = req.headers['stripe-signature'];
  let event;

  try {
    event = stripe.webhooks.constructEvent(req.body, sig, process.env.STRIPE_WEBHOOK_SECRET);
  } catch (err) {
    logger.error(`Webhook signature verification failed: ${err.message}`);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  // Handle the event
  switch (event.type) {
    case 'checkout.session.completed':
      const session = event.data.object;
      await handleSuccessfulPayment(session);
      break;
      
    case 'customer.subscription.updated':
      const subscription = event.data.object;
      await handleSubscriptionUpdate(subscription);
      break;
      
    case 'customer.subscription.deleted':
      const deletedSubscription = event.data.object;
      await handleSubscriptionCancellation(deletedSubscription);
      break;
      
    case 'invoice.payment_failed':
      const failedInvoice = event.data.object;
      await handlePaymentFailure(failedInvoice);
      break;
      
    default:
      logger.info(`Unhandled event type: ${event.type}`);
  }

  res.json({ received: true });
});

// Helper function to handle successful payment
const handleSuccessfulPayment = async (session) => {
  try {
    const userId = session.metadata.userId;
    const planId = session.metadata.planId;
    
    const user = await User.findById(userId);
    if (!user) {
      logger.error(`User not found for successful payment: ${userId}`);
      return;
    }

    // Update user subscription
    user.subscriptionTier = planId === 'plus' ? 'premium' : planId === 'pro' ? 'enterprise' : 'free';
    user.subscriptionStatus = 'active';
    user.stripeSubscriptionId = session.subscription;
    
    await user.save();
    
    logger.info(`Successfully updated user ${userId} to ${user.subscriptionTier} after payment`);
  } catch (error) {
    logger.error(`Error handling successful payment: ${error.message}`);
  }
};

// Helper function to handle subscription updates
const handleSubscriptionUpdate = async (subscription) => {
  try {
    const user = await User.findOne({ stripeSubscriptionId: subscription.id });
    if (!user) {
      logger.error(`User not found for subscription update: ${subscription.id}`);
      return;
    }

    user.subscriptionStatus = subscription.status;
    await user.save();
    
    logger.info(`Updated subscription status for user ${user._id} to ${subscription.status}`);
  } catch (error) {
    logger.error(`Error handling subscription update: ${error.message}`);
  }
};

// Helper function to handle subscription cancellation
const handleSubscriptionCancellation = async (subscription) => {
  try {
    const user = await User.findOne({ stripeSubscriptionId: subscription.id });
    if (!user) {
      logger.error(`User not found for subscription cancellation: ${subscription.id}`);
      return;
    }

    user.subscriptionTier = 'free';
    user.subscriptionStatus = 'cancelled';
    user.stripeSubscriptionId = null;
    
    await user.save();
    
    logger.info(`Cancelled subscription for user ${user._id}, downgraded to free tier`);
  } catch (error) {
    logger.error(`Error handling subscription cancellation: ${error.message}`);
  }
};

// Helper function to handle payment failures
const handlePaymentFailure = async (invoice) => {
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
};

module.exports = {
  getCurrentSubscription,
  getPlans,
  createCheckoutSession,
  upgradeSubscription,
  cancelSubscription,
  getBillingHistory,
  getUsageStats,
  handleStripeWebhook
};