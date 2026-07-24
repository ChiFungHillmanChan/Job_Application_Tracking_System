// ESM port of backend/middleware/premiumRequired.js.
//
// Per task-3 brief rule 4, the Express middleware wrappers (functions of
// `(req, res, next)` that read `req.user` and write `res.status(...).json(...)`)
// are not ported — only their logic, exposed as plain functions that take
// the already-resolved `user` document and either return a result or throw
// `ApiError` (mapped to a JSON error response by @/server/http's withApi).
// The tier/feature/usage maps and the mock getUserUsage behavior are kept
// unchanged, as are all user-facing message strings.
import { ApiError } from '@/server/http';
import logger from '@/server/logger';

export const FEATURE_TIERS = {
  'basic_themes': 'free',
  'basic_colors': 'free',
  'basic_fonts': 'free',
  'basic_density': 'free',
  // task-9: 'job_import' was missing from FEATURE_TIERS entirely, so
  // requireFeature threw ApiError(400, 'Unknown feature') for every caller,
  // making POST /api/job-finder/import/:savedJobId a hard 400 for all tiers.
  // Registered at 'free' as the working default until pricing decides its tier.
  'job_import': 'free',

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

export const TIER_LEVELS = {
  'free': 0,
  'plus': 1,
  'pro': 2
};

export const USAGE_LIMITS = {
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

export const hasRequiredTier = (requiredTier, userTier) => {
  const requiredLevel = TIER_LEVELS[requiredTier] || 0;
  const userLevel = TIER_LEVELS[userTier] || 0;
  return userLevel >= requiredLevel;
};

// Mock usage lookup, unchanged from the Express source: a real
// implementation would read from a usage-tracking collection.
export const getUserUsage = async (userId, metric, period = 'total') => {
  const mockUsage = {
    customThemes: 2,
    savedColors: 8,
    exportPerMonth: 3,
    apiCallsPerDay: 25
  };

  return mockUsage[metric] || 0;
};

export const checkUsageLimit = async (user, feature, metric) => {
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

// Port of requirePremium(requiredTier) middleware factory: throws instead of
// writing a 401/403 JSON response directly.
export const requirePremium = (user, requiredTier = 'plus') => {
  if (!user) {
    logger.warn('Plus feature access attempted without authentication');
    throw new ApiError(401, 'Authentication required');
  }

  const userTier = user.subscriptionTier || 'free';

  if (!hasRequiredTier(requiredTier, userTier)) {
    logger.warn(`Plus feature access denied for user ${user._id}: has ${userTier}, needs ${requiredTier}`);
    throw new ApiError(403, `This feature requires ${requiredTier} subscription`);
  }

  logger.info(`Plus feature access granted for user ${user._id}: ${userTier} tier`);

  return {
    tier: userTier,
    hasAccess: true,
    limits: USAGE_LIMITS[userTier]
  };
};

// Port of requireFeature(feature) middleware factory.
export const requireFeature = (user, feature) => {
  if (!user) {
    throw new ApiError(401, 'Authentication required');
  }

  const requiredTier = FEATURE_TIERS[feature];
  if (!requiredTier) {
    logger.error(`Unknown feature requested: ${feature}`);
    throw new ApiError(400, 'Unknown feature');
  }

  const userTier = user.subscriptionTier || 'free';

  if (!hasRequiredTier(requiredTier, userTier)) {
    logger.warn(`Feature access denied for user ${user._id}: feature ${feature} requires ${requiredTier}, user has ${userTier}`);
    throw new ApiError(403, `Feature '${feature}' requires ${requiredTier} subscription`);
  }

  return {
    name: feature,
    tier: requiredTier,
    hasAccess: true
  };
};

// Port of checkUsage(metric) middleware factory.
export const checkUsage = async (user, metric) => {
  if (!user) {
    throw new ApiError(401, 'Authentication required');
  }

  const usageCheck = await checkUsageLimit(user, null, metric);

  if (!usageCheck.allowed) {
    logger.warn(`Usage limit exceeded for user ${user._id}: ${usageCheck.reason}`);
    throw new ApiError(429, usageCheck.reason);
  }

  return {
    metric,
    limit: usageCheck.limit,
    currentUsage: usageCheck.currentUsage,
    remaining: usageCheck.remaining
  };
};

export const getFeatureAvailability = (user) => {
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

export const getUsageSummary = async (user) => {
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

export const incrementUsage = async (userId, metric, amount = 1) => {
  // This would typically update a usage tracking database
  logger.info(`Usage incremented for user ${userId}: ${metric} +${amount}`);

  // 1. Update usage in database
  // 2. Check if user is approaching limits
  // 3. Send notifications if needed
  // 4. Return updated usage stats

  return { success: true, metric, amount };
};

export const resetUsageCounters = async (period = 'monthly') => {
  logger.info(`Resetting ${period} usage counters`);

  return { success: true, period, resetAt: new Date() };
};
