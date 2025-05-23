const express = require('express');
const {
  getCurrentSubscription,
  getPlans,
  createCheckoutSession,
  upgradeSubscription,
  cancelSubscription,
  getBillingHistory,
  getUsageStats,
  handleStripeWebhook
} = require('../controllers/subscriptionController');
const { protect } = require('../middleware/auth');

const router = express.Router();

// Public routes
router.get('/plans', getPlans);

// Webhook route (must be before other middleware that parses JSON)
router.post('/webhook', express.raw({ type: 'application/json' }), handleStripeWebhook);

// Protected routes - user must be authenticated
router.use(protect);

// Subscription management routes
router.get('/current', getCurrentSubscription);
router.get('/usage', getUsageStats);
router.get('/billing-history', getBillingHistory);

// Subscription modification routes
router.post('/create-checkout-session', createCheckoutSession);
router.post('/upgrade', upgradeSubscription);
router.post('/cancel', cancelSubscription);

module.exports = router;