// Port of backend/controllers/autoApplyController.js getApplicationQueue
// @route   GET /api/auto-apply/queue
// @access  Private
//
// Resume model imported for its registration side effect so the
// populate('cvToUse', ...) resolves under Next's per-route bundling.
import { NextResponse } from 'next/server';
import { withApi } from '@/server/http';
import { requireAuth } from '@/server/auth';
import PreparedApplication from '@/server/models/PreparedApplication';
import '@/server/models/SavedJob';
import '@/server/models/Resume';

export const GET = withApi(async (request) => {
  const authUser = await requireAuth(request);
  const searchParams = request.nextUrl.searchParams;

  const status = searchParams.get('status') || 'pending_review';
  const page = searchParams.get('page') || 1;
  const limit = searchParams.get('limit') || 20;
  const sortBy = searchParams.get('sortBy') || 'matchScore';
  const sortOrder = searchParams.get('sortOrder') || 'desc';

  const filter = { user: authUser._id };
  if (status !== 'all') {
    filter.status = status;
  }

  const sort = {};
  sort[sortBy] = sortOrder === 'desc' ? -1 : 1;

  const applications = await PreparedApplication.find(filter)
    .populate('savedJob')
    .populate('cvToUse', 'name originalFilename')
    .sort(sort)
    .limit(parseInt(limit))
    .skip((parseInt(page) - 1) * parseInt(limit));

  const totalCount = await PreparedApplication.countDocuments(filter);

  return NextResponse.json(
    {
      success: true,
      data: {
        applications,
        pagination: {
          currentPage: parseInt(page),
          totalPages: Math.ceil(totalCount / parseInt(limit)),
          totalCount,
          limit: parseInt(limit),
        },
      },
    },
    { status: 200 }
  );
});
