// Port of backend/controllers/subscriptionController.js getBillingHistory
// @route   GET /api/subscription/billing-history
// @access  Private
import { NextResponse } from 'next/server';
import { withApi } from '@/server/http';
import { requireAuth } from '@/server/auth';
import { getStripe, isStripeConfigured } from '@/server/stripe';
import User from '@/server/models/User';
import logger from '@/server/logger';

export const GET = withApi(async (request) => {
  const authUser = await requireAuth(request);

  try {
    const user = await User.findById(authUser._id);

    // No billing account, or billing not configured on this deployment: there
    // is genuinely no history to show, so degrade to an empty list rather than
    // 503-ing the settings page.
    if (!user.stripeCustomerId || !isStripeConfigured()) {
      return NextResponse.json(
        {
          success: true,
          data: [],
        },
        { status: 200 }
      );
    }

    const invoices = await getStripe().invoices.list({
      customer: user.stripeCustomerId,
      limit: 100,
    });

    const billingHistory = invoices.data.map((invoice) => ({
      id: invoice.id,
      date: new Date(invoice.created * 1000),
      amount: invoice.amount_paid,
      currency: invoice.currency,
      status: invoice.status,
      invoiceUrl: invoice.hosted_invoice_url,
      downloadUrl: invoice.invoice_pdf,
    }));

    return NextResponse.json(
      {
        success: true,
        data: billingHistory,
      },
      { status: 200 }
    );
  } catch (error) {
    logger.error(`Error fetching billing history: ${error.message}`);
    return NextResponse.json(
      {
        success: false,
        error: 'Server error while fetching billing history',
      },
      { status: 500 }
    );
  }
});
