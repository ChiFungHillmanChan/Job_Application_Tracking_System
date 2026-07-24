// Shared Stripe client + subscription plan config for the App Router
// subscription endpoints. Ported from
// backend/controllers/subscriptionController.js (previously unmounted).
//
// Consolidated here rather than duplicated across the eight route files so the
// price-ID env renames and the lazy client live in exactly one place - this is
// the main defense against the tier-string inconsistency risk flagged in the
// task-9 brief.
//
// Env renames vs the Express source (controller-approved, task-9 brief rule 1):
//   STRIPE_PREMIUM_MONTHLY_PRICE_ID    -> STRIPE_PLUS_MONTHLY_PRICE_ID
//   STRIPE_PREMIUM_ANNUAL_PRICE_ID     -> STRIPE_PLUS_ANNUAL_PRICE_ID
//   STRIPE_ENTERPRISE_MONTHLY_PRICE_ID -> STRIPE_PRO_MONTHLY_PRICE_ID
//   STRIPE_ENTERPRISE_ANNUAL_PRICE_ID  -> STRIPE_PRO_ANNUAL_PRICE_ID
// The plan keys/ids/names were already 'plus'/'pro' in the source, aligned with
// the User model enum (free/plus/pro) and entitlements TIER_LEVELS.
import Stripe from 'stripe';

// Lazy singleton so `next build` (which evaluates every route module) does not
// crash at import time when STRIPE_SECRET_KEY is absent. The Express source
// instantiated eagerly at require time: `require('stripe')(process.env.STRIPE_SECRET_KEY)`.
// No apiVersion is pinned, matching the source (uses the account default).
let stripe;
export function getStripe() {
  if (!stripe) {
    stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
  }
  return stripe;
}

// Plan configurations with pricing - ported verbatim from the Express source
// except for the four renamed price-ID env vars above. Note: `Infinity`
// serializes to `null` through JSON (both Express res.json and NextResponse.json),
// so the /plans and /usage responses report unlimited resume/application limits
// as `null` - unchanged from the Express behavior.
export const SUBSCRIPTION_PLANS = {
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
      storage: 1,
      support: 'standard'
    }
  },
  plus: {
    id: 'plus',
    name: 'Plus',
    monthlyPrice: 888,
    annualPrice: 7477,
    stripePriceIdMonthly: process.env.STRIPE_PLUS_MONTHLY_PRICE_ID,
    stripePriceIdAnnual: process.env.STRIPE_PLUS_ANNUAL_PRICE_ID,
    features: {
      resumes: Infinity,
      jobApplications: Infinity,
      storage: 10,
      support: 'priority',
      customColors: true,
      advancedTypography: true,
      granularSpacing: true,
      themeExport: true,
      googleFonts: true,
      unlimitedThemes: true,
      advancedEffects: true
    }
  },
  pro: {
    id: 'pro',
    name: 'Pro',
    monthlyPrice: 3888,
    annualPrice: 32734,
    stripePriceIdMonthly: process.env.STRIPE_PRO_MONTHLY_PRICE_ID,
    stripePriceIdAnnual: process.env.STRIPE_PRO_ANNUAL_PRICE_ID,
    features: {
      resumes: Infinity,
      jobApplications: Infinity,
      storage: 100,
      support: 'dedicated',
      aiFeatures: true,
      personalConsultation: true,
      betaAccess: true,
      customCSS: true,
      componentTheming: true,
      teamSharing: true,
      fontUpload: true,
      apiAccess: true,
      whiteLabeling: true
    }
  }
};
