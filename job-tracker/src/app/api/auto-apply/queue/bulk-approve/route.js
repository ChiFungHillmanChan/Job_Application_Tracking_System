// Port of backend/controllers/autoApplyController.js bulkApproveApplications
// @route   POST /api/auto-apply/queue/bulk-approve
// @access  Private
import { NextResponse } from 'next/server';
import mongoose from 'mongoose';
import { withApi } from '@/server/http';
import { requireAuth } from '@/server/auth';
import PreparedApplication from '@/server/models/PreparedApplication';

export const POST = withApi(async (request) => {
  const authUser = await requireAuth(request);
  const { applicationIds, minScore } = await request.json();

  const filter = { user: authUser._id, status: 'pending_review' };

  if (applicationIds?.length) {
    filter._id = { $in: applicationIds.map((id) => new mongoose.Types.ObjectId(id)) };
  } else if (minScore) {
    filter.matchScore = { $gte: minScore };
  }

  const result = await PreparedApplication.updateMany(filter, {
    status: 'approved',
    reviewedAt: new Date(),
  });

  return NextResponse.json(
    {
      success: true,
      data: { modifiedCount: result.modifiedCount },
      message: `${result.modifiedCount} applications approved`,
    },
    { status: 200 }
  );
});
