// backend/middleware/premiumRequired.js - Premium feature access control

const logger = require('../utils/logger');

/**
 * Premium feature access levels
 */
const FEATURE_TIERS = {
  // Free tier features
  'basic_themes': 'free',
  'basic_colors': 'free',
  'basic_fonts': 'free',
  'basic_density': 'free',
  
  // Premium tier features
  'custom_colors': 'premium',
  'advanced_typography': 'premium',
  'granular_spacing': 'premium',
  'theme_export': 'premium',
  'google_fonts': 'premium',
  'unlimited_themes': 'premium',
  'advanced_effects': 'premium',
  
  // Enterprise tier features
  'custom_css': 'enterprise',
  'component_theming': 'enterprise',
  'team_sharing': 'enterprise',
  'font_upload': 'enterprise',
  'api_access': 'enterprise',
  'white_labeling': 'enterprise'
};

/**
 * Subscription tier hierarchy
 */
const TIER_LEVELS = {
  'free': 0,
  'premium': 1,
  'enterprise': 2
};

/**
 * Feature usage limits by tier
 */
const USAGE_LIMITS = {
  free: {
    customThemes: 1,
    savedColors: 5,
    exportPerMonth: 0,
    apiCallsPerDay: 0
  },
  premium: {
    customThemes: 25,
    savedColors: 50,
    exportPerMonth: 10,
    apiCallsPerDay: 100
  },
  enterprise: {
    customThemes: -1, // unlimited
    savedColors: -1,
    exportPerMonth: -1,
    apiCallsPerDay: -1
  }
};

/**
 * Check if user has required subscription tier
 * @param {string} requiredTier - Minimum required tier
 * @param {string} userTier - User's current tier
 */
const hasRequiredTier = (requiredTier, userTier) => {
  const requiredLevel = TIER_LEVELS[requiredTier] || 0;
  const userLevel = TIER_LEVELS[userTier] || 0;
  return userLevel >= requiredLevel;
};

/**
 * Get user's current usage for a specific metric
 * @param {string} userId - User ID
 * @param {string} metric - Usage metric to check
 * @param {string} period - Time period ('day', 'month', 'total')
 */
const getUserUsage = async (userId, metric, period = 'total') => {
  // This would typically query a usage tracking database
  // For now, return mock data
  
  const mockUsage = {
    customThemes: 2,
    savedColors: 8,
    exportPerMonth: 3,
    apiCallsPerDay: 25
  };
  
  return mockUsage[metric] || 0;
};

/**
 * Check if user has reached usage limit
 * @param {Object} user - User object
 * @param {string} feature - Feature being accessed
 * @param {string} metric - Usage metric to check
 */
const checkUsageLimit = async (user, feature, metric) => {
  const userTier = user.subscriptionTier || 'free';
  const limits = USAGE_LIMITS[userTier];
  
  if (!limits) {
    return { allowed: false, reason: 'Invalid subscription tier' };
  }
  
  const limit = limits[metric];
  
  // -1 means unlimited
  if (limit === -1) {
    return { allowed: true };
  }
  
  const currentUsage = await getUserUsage(user._id, metric);
  
  if (currentUsage >= limit) {
    return {
      allowed: false,
      reason: `Usage limit reached: ${currentUsage}/${limit} ${metric}`,
      limit,
      currentUsage
    };
  }
  
  return {
    allowed: true,
    limit,
    currentUsage,
    remaining: limit - currentUsage
  };
};

/**
 * Middleware to check if user has premium access
 * @param {string} requiredTier - Minimum required subscription tier
 */
const requirePremium = (requiredTier = 'premium') => {
  return async (req, res, next) => {
    try {
      // Check if user is authenticated
      if (!req.user) {
        logger.warn('Premium feature access attempted without authentication');
        return res.status(401).json({
          success: false,
          error: 'Authentication required',
          code: 'AUTH_REQUIRED'
        });
      }
      
      const userTier = req.user.subscriptionTier || 'free';
      
      // Check if user has required tier
      if (!hasRequiredTier(requiredTier, userTier)) {
        logger.warn(`Premium feature access denied for user ${req.user._id}: has ${userTier}, needs ${requiredTier}`);
        
        return res.status(403).json({
          success: false,
          error: `This feature requires ${requiredTier} subscription`,
          code: 'PREMIUM_REQUIRED',
          userTier,
          requiredTier,
          upgradeUrl: '/settings/subscription'
        });
      }
      
      // Attach premium info to request
      req.premium = {
        tier: userTier,
        hasAccess: true,
        limits: USAGE_LIMITS[userTier]
      };
      
      logger.info(`Premium feature access granted for user ${req.user._id}: ${userTier} tier`);
      next();
      
    } catch (error) {
      logger.error('Error in premium middleware:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to verify premium access',
        code: 'PREMIUM_CHECK_FAILED'
      });
    }
  };
};

/**
 * Middleware to check specific feature access
 * @param {string} feature - Feature identifier
 */
const requireFeature = (feature) => {
  return async (req, res, next) => {
    try {
      if (!req.user) {
        return res.status(401).json({
          success: false,
          error: 'Authentication required',
          code: 'AUTH_REQUIRED'
        });
      }
      
      const requiredTier = FEATURE_TIERS[feature];
      if (!requiredTier) {
        logger.error(`Unknown feature requested: ${feature}`);
        return res.status(400).json({
          success: false,
          error: 'Unknown feature',
          code: 'UNKNOWN_FEATURE'
        });
      }
      
      const userTier = req.user.subscriptionTier || 'free';
      
      if (!hasRequiredTier(requiredTier, userTier)) {
        logger.warn(`Feature access denied for user ${req.user._id}: feature ${feature} requires ${requiredTier}, user has ${userTier}`);
        
        return res.status(403).json({
          success: false,
          error: `Feature '${feature}' requires ${requiredTier} subscription`,
          code: 'FEATURE_RESTRICTED',
          feature,
          userTier,
          requiredTier
        });
      }
      
      req.feature = {
        name: feature,
        tier: requiredTier,
        hasAccess: true
      };
      
      next();
      
    } catch (error) {
      logger.error('Error in feature middleware:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to verify feature access',
        code: 'FEATURE_CHECK_FAILED'
      });
    }
  };
};

/**
 * Middleware to check usage limits
 * @param {string} metric - Usage metric to check
 * @param {string} period - Time period for the limit
 */
const checkUsage = (metric, period = 'total') => {
  return async (req, res, next) => {
    try {
      if (!req.user) {
        return res.status(401).json({
          success: false,
          error: 'Authentication required',
          code: 'AUTH_REQUIRED'
        });
      }
      
      const usageCheck = await checkUsageLimit(req.user, null, metric);
      
      if (!usageCheck.allowed) {
        logger.warn(`Usage limit exceeded for user ${req.user._id}: ${usageCheck.reason}`);
        
        return res.status(429).json({
          success: false,
          error: usageCheck.reason,
          code: 'USAGE_LIMIT_EXCEEDED',
          metric,
          limit: usageCheck.limit,
          currentUsage: usageCheck.currentUsage,
          upgradeUrl: '/settings/subscription'
        });
      }
      
      req.usage = {
        metric,
        limit: usageCheck.limit,
        currentUsage: usageCheck.currentUsage,
        remaining: usageCheck.remaining
      };
      
      next();
      
    } catch (error) {
      logger.error('Error in usage middleware:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to check usage limits',
        code: 'USAGE_CHECK_FAILED'
      });
    }
  };
};

/**
 * Get feature availability for user
 * @param {Object} user - User object
 * @returns {Object} Feature availability map
 */
const getFeatureAvailability = (user) => {
  const userTier = user?.subscriptionTier || 'free';
  const availability = {};
  
  Object.entries(FEATURE_TIERS).forEach(([feature, requiredTier]) => {
    availability[feature] = {
      available: hasRequiredTier(requiredTier, userTier),
      requiredTier,
      userTier
    };
  });
  
  return availability;
};

/**
 * Get usage summary for user
 * @param {Object} user - User object
 * @returns {Object} Usage summary
 */
const getUsageSummary = async (user) => {
  const userTier = user?.subscriptionTier || 'free';
  const limits = USAGE_LIMITS[userTier];
  const summary = {};
  
  for (const [metric, limit] of Object.entries(limits)) {
    const currentUsage = await getUserUsage(user._id, metric);
    
    summary[metric] = {
      limit: limit === -1 ? 'unlimited' : limit,
      current: currentUsage,
      remaining: limit === -1 ? 'unlimited' : Math.max(0, limit - currentUsage),
      percentage: limit === -1 ? 0 : Math.round((currentUsage / limit) * 100)
    };
  }
  
  return summary;
};

/**
 * Increment usage counter
 * @param {string} userId - User ID
 * @param {string} metric - Usage metric
 * @param {number} amount - Amount to increment
 */
const incrementUsage = async (userId, metric, amount = 1) => {
  // This would typically update a usage tracking database
  logger.info(`Usage incremented for user ${userId}: ${metric} +${amount}`);
  
  // In a real implementation, you would:
  // 1. Update usage in database
  // 2. Check if user is approaching limits
  // 3. Send notifications if needed
  // 4. Return updated usage stats
  
  return { success: true, metric, amount };
};

/**
 * Reset usage counters (typically run on a schedule)
 * @param {string} period - Period to reset ('daily', 'monthly')
 */
const resetUsageCounters = async (period = 'monthly') => {
  logger.info(`Resetting ${period} usage counters`);
  
  // This would typically reset usage counters in the database
  // based on the period (daily for API calls, monthly for exports, etc.)
  
  return { success: true, period, resetAt: new Date() };
};

/**
 * Middleware to track feature usage
 * @param {string} feature - Feature being used
 * @param {string} metric - Usage metric to increment
 */
const trackUsage = (feature, metric) => {
  return async (req, res, next) => {
    try {
      // Call next first to process the request
      next();
      
      // Track usage after successful request
      if (req.user && res.statusCode < 400) {
        await incrementUsage(req.user._id, metric);
        logger.info(`Feature usage tracked: ${feature} for user ${req.user._id}`);
      }
      
    } catch (error) {
      logger.error('Error tracking usage:', error);
      // Don't fail the request if usage tracking fails
    }
  };
};

module.exports = {
  requirePremium,
  requireFeature,
  checkUsage,
  trackUsage,
  getFeatureAvailability,
  getUsageSummary,
  incrementUsage,
  resetUsageCounters,
  hasRequiredTier,
  FEATURE_TIERS,
  TIER_LEVELS,
  USAGE_LIMITS
};