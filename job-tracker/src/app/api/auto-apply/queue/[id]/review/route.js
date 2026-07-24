// Port of backend/controllers/autoApplyController.js reviewApplication
// @route   PUT /api/auto-apply/queue/:id/review
// @access  Private
import { NextResponse } from 'next/server';
import { withApi } from '@/server/http';
import { requireAuth } from '@/server/auth';
import PreparedApplication from '@/server/models/PreparedApplication';
import '@/server/models/SavedJob';

export const PUT = withApi(async (request, context) => {
  const authUser = await requireAuth(request);
  const { id } = await context.params;
  const { action, coverLetter, userNotes } = await request.json();

  if (!['approve', 'reject'].includes(action)) {
    return NextResponse.json(
      { success: false, error: 'Action must be "approve" or "reject"' },
      { status: 400 }
    );
  }

  const application = await PreparedApplication.findOne({
    _id: id,
    user: authUser._id,
  });

  if (!application) {
    return NextResponse.json(
      { success: false, error: 'Application not found' },
      { status: 404 }
    );
  }

  const updateData = {
    status: action === 'approve' ? 'approved' : 'rejected',
    reviewedAt: new Date(),
  };

  if (coverLetter !== undefined) updateData.coverLetter = coverLetter;
  if (userNotes !== undefined) updateData.userNotes = userNotes;

  const updated = await PreparedApplication.findByIdAndUpdate(
    application._id,
    updateData,
    { new: true }
  ).populate('savedJob');

  return NextResponse.json({ success: true, data: updated }, { status: 200 });
});
