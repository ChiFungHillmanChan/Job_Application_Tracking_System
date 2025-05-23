// src/lib/subscriptionService.js
import api from './api';

const subscriptionService = {
  /**
   * Get current subscription details for the authenticated user
   * @returns {Promise<Object>} Response containing subscription data
   */
  getCurrentSubscription: async () => {
    try {
      const response = await api.get('/subscription/current');
      return response.data;
    } catch (error) {
      console.error('Error fetching current subscription:', error);
      throw error;
    }
  },

  /**
   * Get available subscription plans with pricing
   * @returns {Promise<Object>} Response containing available plans
   */
  getPlans: async () => {
    try {
      const response = await api.get('/subscription/plans');
      return response.data;
    } catch (error) {
      console.error('Error fetching subscription plans:', error);
      throw error;
    }
  },

  /**
   * Upgrade or change subscription plan
   * @param {string} planId - ID of the plan to upgrade to ('free', 'plus', 'pro')
   * @param {string} billingCycle - Billing cycle ('monthly' or 'annual')
   * @returns {Promise<Object>} Response containing updated subscription data
   */
  upgradePlan: async (planId, billingCycle = 'monthly') => {
    try {
      const response = await api.post('/subscription/upgrade', {
        planId,
        billingCycle
      });
      return response.data;
    } catch (error) {
      console.error('Error upgrading subscription plan:', error);
      throw error;
    }
  },

  /**
   * Cancel subscription (downgrade to free)
   * @returns {Promise<Object>} Response containing cancellation confirmation
   */
  cancelSubscription: async () => {
    try {
      const response = await api.post('/subscription/cancel');
      return response.data;
    } catch (error) {
      console.error('Error cancelling subscription:', error);
      throw error;
    }
  },

  /**
   * Get billing history for the user
   * @returns {Promise<Object>} Response containing billing history
   */
  getBillingHistory: async () => {
    try {
      const response = await api.get('/subscription/billing-history');
      return response.data;
    } catch (error) {
      console.error('Error fetching billing history:', error);
      throw error;
    }
  },

  /**
   * Update payment method
   * @param {Object} paymentData - Payment method data
   * @returns {Promise<Object>} Response containing updated payment method
   */
  updatePaymentMethod: async (paymentData) => {
    try {
      const response = await api.put('/subscription/payment-method', paymentData);
      return response.data;
    } catch (error) {
      console.error('Error updating payment method:', error);
      throw error;
    }
  },

  /**
   * Get subscription usage statistics
   * @returns {Promise<Object>} Response containing usage data
   */
  getUsageStats: async () => {
    try {
      const response = await api.get('/subscription/usage');
      return response.data;
    } catch (error) {
      console.error('Error fetching usage statistics:', error);
      throw error;
    }
  },

  /**
   * Generate invoice for a specific billing period
   * @param {string} invoiceId - ID of the invoice to download
   * @returns {Promise<Blob>} PDF invoice blob
   */
  downloadInvoice: async (invoiceId) => {
    try {
      const response = await api.get(`/subscription/invoice/${invoiceId}/download`, {
        responseType: 'blob'
      });
      return response.data;
    } catch (error) {
      console.error('Error downloading invoice:', error);
      throw error;
    }
  },

  /**
   * Create a Stripe checkout session for subscription upgrade
   * @param {string} planId - Plan ID to upgrade to
   * @param {string} billingCycle - Billing cycle preference
   * @returns {Promise<Object>} Response containing checkout session URL
   */
  createCheckoutSession: async (planId, billingCycle) => {
    try {
      const response = await api.post('/subscription/create-checkout-session', {
        planId,
        billingCycle,
        successUrl: `${window.location.origin}/settings/subscription?success=true`,
        cancelUrl: `${window.location.origin}/settings/subscription?cancelled=true`
      });
      return response.data;
    } catch (error) {
      console.error('Error creating checkout session:', error);
      throw error;
    }
  },

  /**
   * Verify subscription status after payment
   * @param {string} sessionId - Stripe checkout session ID
   * @returns {Promise<Object>} Response containing verification result
   */
  verifySubscription: async (sessionId) => {
    try {
      const response = await api.post('/subscription/verify', { sessionId });
      return response.data;
    } catch (error) {
      console.error('Error verifying subscription:', error);
      throw error;
    }
  },

  /**
   * Get plan limits and features for a specific tier
   * @param {string} tier - Subscription tier ('free', 'plus', 'pro')
   * @returns {Object} Plan limits and features
   */
  getPlanLimits: (tier) => {
    const planLimits = {
      free: {
        resumes: 8,
        jobApplications: 50,
        features: [
          'Basic application tracking',
          'Standard email support',
          'Export to PDF/CSV'
        ],
        limits: {
          resumeVersions: 8,
          jobApplicationsPerMonth: 50,
          storageGB: 1,
          supportLevel: 'standard'
        }
      },
      plus: {
        resumes: Infinity,
        jobApplications: Infinity,
        features: [
          'Unlimited resume versions',
          'Unlimited job applications',
          'Advanced filtering & search',
          'Application analytics & insights',
          'Priority email support',
          'Advanced export options',
          'Custom tags & categories',
          'Application deadline reminders'
        ],
        limits: {
          resumeVersions: Infinity,
          jobApplicationsPerMonth: Infinity,
          storageGB: 10,
          supportLevel: 'priority'
        }
      },
      pro: {
        resumes: Infinity,
        jobApplications: Infinity,
        features: [
          'Everything in Plus',
          'AI-powered resume optimization',
          '1-on-1 resume consultation',
          'Early access to new features',
          'Beta testing participation',
          'Priority feature requests',
          'Dedicated account manager',
          'Advanced API access'
        ],
        limits: {
          resumeVersions: Infinity,
          jobApplicationsPerMonth: Infinity,
          storageGB: 100,
          supportLevel: 'dedicated',
          aiFeatures: true,
          personalConsultation: true,
          betaAccess: true
        }
      }
    };

    return planLimits[tier] || planLimits.free;
  },

  /**
   * Check if user can perform an action based on their subscription tier
   * @param {string} action - Action to check ('upload_resume', 'create_job', etc.)
   * @param {Object} currentUsage - Current usage statistics
   * @param {string} userTier - User's current subscription tier
   * @returns {Object} Permission result with allowed status and reason
   */
  checkPermission: (action, currentUsage, userTier) => {
    const limits = subscriptionService.getPlanLimits(userTier);
    
    switch (action) {
      case 'upload_resume':
        if (limits.resumeVersions === Infinity) {
          return { allowed: true };
        }
        if (currentUsage.resumeCount >= limits.resumeVersions) {
          return { 
            allowed: false, 
            reason: `You've reached the limit of ${limits.resumeVersions} resumes for your ${userTier} plan.`,
            upgradeRequired: true
          };
        }
        return { allowed: true };

      case 'create_job':
        if (limits.jobApplicationsPerMonth === Infinity) {
          return { allowed: true };
        }
        if (currentUsage.jobApplicationsThisMonth >= limits.jobApplicationsPerMonth) {
          return { 
            allowed: false, 
            reason: `You've reached the limit of ${limits.jobApplicationsPerMonth} job applications this month for your ${userTier} plan.`,
            upgradeRequired: true
          };
        }
        return { allowed: true };

      case 'ai_features':
        if (limits.limits.aiFeatures) {
          return { allowed: true };
        }
        return { 
          allowed: false, 
          reason: 'AI features are only available with the Pro plan.',
          upgradeRequired: true
        };

      case 'personal_consultation':
        if (limits.limits.personalConsultation) {
          return { allowed: true };
        }
        return { 
          allowed: false, 
          reason: '1-on-1 resume consultation is only available with the Pro plan.',
          upgradeRequired: true
        };

      default:
        return { allowed: true };
    }
  }
};

export default subscriptionService;