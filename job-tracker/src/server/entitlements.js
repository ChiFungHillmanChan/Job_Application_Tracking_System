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
import { SUBSCRIPTION_PLANS } from '@/server/stripe';
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

export const hasRequiredTier = (requiredTier, userTier) => {
  const requiredLevel = TIER_LEVELS[requiredTier] || 0;
  const userLevel = TIER_LEVELS[userTier] || 0;
  return userLevel >= requiredLevel;
};

// The former USAGE_LIMITS table and its getUserUsage/checkUsageLimit/checkUsage/
// getUsageSummary/incrementUsage/resetUsageCounters helpers were removed. They
// had no callers anywhere in the app, and getUserUsage was a stub returning
// hardcoded numbers (customThemes: 2, savedColors: 8, ...), so any future
// caller would have silently gated on fabricated usage - e.g. checkUsage(user,
// 'customThemes') returned 429 for every free user regardless of reality.
// Real, enforceable limits live in SUBSCRIPTION_PLANS and are applied by
// assertWithinPlanLimit below.

// Resolves a numeric plan limit for a feature. SUBSCRIPTION_PLANS is the single
// source of truth: it is what GET /api/subscription/usage and /plans report to
// the UI, so enforcement and display cannot drift apart. `Infinity` means
// unlimited and compares correctly without any special-casing.
export const getPlanLimit = (user, feature) => {
  const tier = user?.subscriptionTier || 'free';
  const plan = SUBSCRIPTION_PLANS[tier] || SUBSCRIPTION_PLANS.free;
  const limit = plan.features?.[feature];
  return typeof limit === 'number' ? limit : Infinity;
};

// Throws ApiError(403) when `currentCount` has already reached the caller's
// plan allowance for `feature`. The message mirrors the saved-jobs limit
// response shape the job-finder UI already understands.
export const assertWithinPlanLimit = (user, feature, currentCount, label) => {
  const limit = getPlanLimit(user, feature);

  if (currentCount >= limit) {
    const tier = user?.subscriptionTier || 'free';
    logger.warn(
      `Plan limit reached for user ${user?._id}: ${feature} ${currentCount}/${limit} on ${tier}`
    );
    throw new ApiError(
      403,
      `You have reached your ${label} limit (${currentCount}/${limit}) on the ${tier} plan. Upgrade to add more.`
    );
  }

  return { limit, currentCount, remaining: limit - currentCount };
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
    limits: (SUBSCRIPTION_PLANS[userTier] || SUBSCRIPTION_PLANS.free).features
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

