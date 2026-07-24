// Port of backend/controllers/jobFinderController.js removeSavedJob
// @route   DELETE /api/job-finder/saved/:id
// @access  Private
//
// Deviation: `savedJob.remove()` (Mongoose document method, removed in
// Mongoose 7+) is replaced with `savedJob.deleteOne()`, matching the same
// substitution already made for Job/Resume deletes elsewhere in this app.
import { NextResponse } from 'next/server';
import { withApi } from '@/server/http';
import { requireAuth } from '@/server/auth';
import SavedJob from '@/server/models/SavedJob';
import logger from '@/server/logger';

export const DELETE = withApi(async (request, context) => {
  const authUser = await requireAuth(request);
  const { id } = await context.params;

  const savedJob = await SavedJob.findOne({
    _id: id,
    user: authUser._id,
  });

  if (!savedJob) {
    return NextResponse.json(
      {
        success: false,
        error: 'Saved job not found',
      },
      { status: 404 }
    );
  }

  await savedJob.deleteOne();

  logger.info(`Saved job removed: ${savedJob.title} by user ${authUser._id}`);

  return NextResponse.json(
    {
      success: true,
      message: 'Saved job removed successfully',
    },
    { status: 200 }
  );
});
