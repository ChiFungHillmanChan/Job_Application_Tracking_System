// Port of backend/controllers/autoApplyController.js bulkApproveApplications
// @route   POST /api/auto-apply/queue/bulk-approve
// @access  Private
import { NextResponse } from 'next/server';
import mongoose from 'mongoose';
import { withApi } from '@/server/http';
import { requireAuth } from '@/server/auth';
import PreparedApplication from '@/server/models/PreparedApplication';
import { readJsonBody, toFiniteNumber } from '@/server/requestUtils';

export const POST = withApi(async (request) => {
  const authUser = await requireAuth(request);
  const { applicationIds, minScore } = await readJsonBody(request);

  const filter = { user: authUser._id, status: 'pending_review' };

  if (applicationIds?.length) {
    // A malformed id throws a BSONError from the ObjectId constructor; convert
    // that into a 400 instead of letting it surface as a 500.
    let objectIds;
    try {
      objectIds = applicationIds.map((id) => new mongoose.Types.ObjectId(id));
    } catch {
      return NextResponse.json(
        { success: false, error: 'Invalid application id' },
        { status: 400 }
      );
    }
    filter._id = { $in: objectIds };
  } else if (minScore !== undefined && minScore !== null) {
    // Coerced to a real number so a client cannot smuggle an operator object
    // (e.g. {"$gt":""}) into the comparison. Mongoose's cast already rejected
    // that, but only as a misleading 404 "Resource not found"; a bad value is
    // a client error and should say so.
    const score = toFiniteNumber(minScore);
    if (score === null) {
      return NextResponse.json(
        { success: false, error: 'minScore must be a number' },
        { status: 400 }
      );
    }
    filter.matchScore = { $gte: score };
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
