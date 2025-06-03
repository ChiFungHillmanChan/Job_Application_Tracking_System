const logger = require('../utils/logger');


const FEATURE_TIERS = {
  'basic_themes': 'free',
  'basic_colors': 'free',
  'basic_fonts': 'free',
  'basic_density': 'free',
  
  'custom_colors': 'plus',
  'advanced_typography': 'plus',
  'granular_spacing': 'plus',
  'theme_export': 'plus',
  'google_fonts': 'plus',
  'unlimited_themes': 'plus',
  'advanced_effects': 'plus',
  
  'custom_css': 'pro',
  'component_theming': 'pro',
  'team_sharing': 'pro',
  'font_upload': 'pro',
  'api_access': 'pro',
  'white_labeling': 'pro'
};

const TIER_LEVELS = {
  'free': 0,
  'plus': 1,
  'pro': 2
};

const USAGE_LIMITS = {
  free: {
    customThemes: 1,
    savedColors: 5,
    exportPerMonth: 0,
    apiCallsPerDay: 0
  },
  plus: {
    customThemes: 25,
    savedColors: 50,
    exportPerMonth: 10,
    apiCallsPerDay: 100
  },
  pro: {
    customThemes: -1, 
    savedColors: -1,
    exportPerMonth: -1,
    apiCallsPerDay: -1
  }
};

const hasRequiredTier = (requiredTier, userTier) => {
  const requiredLevel = TIER_LEVELS[requiredTier] || 0;
  const userLevel = TIER_LEVELS[userTier] || 0;
  return userLevel >= requiredLevel;
};

const getUserUsage = async (userId, metric, period = 'total') => {

  const mockUsage = {
    customThemes: 2,
    savedColors: 8,
    exportPerMonth: 3,
    apiCallsPerDay: 25
  };
  
  return mockUsage[metric] || 0;
};

const checkUsageLimit = async (user, feature, metric) => {
  const userTier = user.subscriptionTier || 'free';
  const limits = USAGE_LIMITS[userTier];
  
  if (!limits) {
    return { allowed: false, reason: 'Invalid subscription tier' };
  }
  
  const limit = limits[metric];
  
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

const requirePremium = (requiredTier = 'plus') => {
  return async (req, res, next) => {
    try {
      if (!req.user) {
        logger.warn('Plus feature access attempted without authentication');
        return res.status(401).json({
          success: false,
          error: 'Authentication required',
          code: 'AUTH_REQUIRED'
        });
      }
      
      const userTier = req.user.subscriptionTier || 'free';
      
      if (!hasRequiredTier(requiredTier, userTier)) {
        logger.warn(`Plus feature access denied for user ${req.user._id}: has ${userTier}, needs ${requiredTier}`);
        
        return res.status(403).json({
          success: false,
          error: `This feature requires ${requiredTier} subscription`,
          code: 'PLUS_REQUIRED',
          userTier,
          requiredTier,
          upgradeUrl: '/settings/subscription'
        });
      }
      
      req.plus = {
        tier: userTier,
        hasAccess: true,
        limits: USAGE_LIMITS[userTier]
      };
      
      logger.info(`Plus feature access granted for user ${req.user._id}: ${userTier} tier`);
      next();
      
    } catch (error) {
      logger.error('Error in plus middleware:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to verify plus access',
        code: 'PLUS_CHECK_FAILED'
      });
    }
  };
};

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


const incrementUsage = async (userId, metric, amount = 1) => {
  // This would typically update a usage tracking database
  logger.info(`Usage incremented for user ${userId}: ${metric} +${amount}`);
  
  // 1. Update usage in database
  // 2. Check if user is approaching limits
  // 3. Send notifications if needed
  // 4. Return updated usage stats
  
  return { success: true, metric, amount };
};


const resetUsageCounters = async (period = 'monthly') => {
  logger.info(`Resetting ${period} usage counters`);
  
  return { success: true, period, resetAt: new Date() };
};


const trackUsage = (feature, metric) => {
  return async (req, res, next) => {
    try {
      next();
      
      if (req.user && res.statusCode < 400) {
        await incrementUsage(req.user._id, metric);
        logger.info(`Feature usage tracked: ${feature} for user ${req.user._id}`);
      }
      
    } catch (error) {
      logger.error('Error tracking usage:', error);
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