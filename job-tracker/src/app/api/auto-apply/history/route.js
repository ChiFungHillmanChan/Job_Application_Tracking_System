// Port of backend/controllers/autoApplyController.js getRunHistory
// @route   GET /api/auto-apply/history
// @access  Private
import { NextResponse } from 'next/server';
import { withApi } from '@/server/http';
import { requireAuth } from '@/server/auth';
import AutomationRun from '@/server/models/AutomationRun';

export const GET = withApi(async (request) => {
  const authUser = await requireAuth(request);
  const searchParams = request.nextUrl.searchParams;

  const page = searchParams.get('page') || 1;
  const limit = searchParams.get('limit') || 20;

  const runs = await AutomationRun.find({ user: authUser._id })
    .sort({ runDate: -1 })
    .limit(parseInt(limit))
    .skip((parseInt(page) - 1) * parseInt(limit));

  const totalCount = await AutomationRun.countDocuments({ user: authUser._id });

  return NextResponse.json(
    {
      success: true,
      data: {
        runs,
        pagination: {
          currentPage: parseInt(page),
          totalPages: Math.ceil(totalCount / parseInt(limit)),
          totalCount,
        },
      },
    },
    { status: 200 }
  );
});
