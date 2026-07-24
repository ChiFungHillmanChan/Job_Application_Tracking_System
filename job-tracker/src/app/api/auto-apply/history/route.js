// Port of backend/controllers/autoApplyController.js getRunHistory
// @route   GET /api/auto-apply/history
// @access  Private
import { NextResponse } from 'next/server';
import { withApi } from '@/server/http';
import { requireAuth } from '@/server/auth';
import AutomationRun from '@/server/models/AutomationRun';
import { parsePagination } from '@/server/requestUtils';

export const GET = withApi(async (request) => {
  const authUser = await requireAuth(request);
  const searchParams = request.nextUrl.searchParams;

  // Clamped to positive integers; `?page=0` / `?limit=abc` previously produced
  // a negative or NaN skip.
  const { page, limit, skip } = parsePagination(searchParams, { defaultLimit: 20 });

  const runs = await AutomationRun.find({ user: authUser._id })
    .sort({ runDate: -1 })
    .limit(limit)
    .skip(skip);

  const totalCount = await AutomationRun.countDocuments({ user: authUser._id });

  return NextResponse.json(
    {
      success: true,
      data: {
        runs,
        pagination: {
          currentPage: page,
          totalPages: Math.ceil(totalCount / limit),
          totalCount,
        },
      },
    },
    { status: 200 }
  );
});
