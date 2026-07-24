// Port of backend/controllers/subscriptionController.js getPlans
// @route   GET /api/subscription/plans
// @access  Public
import { NextResponse } from 'next/server';
import { withApi } from '@/server/http';
import { SUBSCRIPTION_PLANS } from '@/server/stripe';

export const GET = withApi(async () => {
  return NextResponse.json(
    {
      success: true,
      data: Object.values(SUBSCRIPTION_PLANS),
    },
    { status: 200 }
  );
});
