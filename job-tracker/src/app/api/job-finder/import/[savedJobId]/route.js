// Port of backend/controllers/jobFinderController.js importJobToTracker
// @route   POST /api/job-finder/import/:savedJobId
// @access  Private (requires the 'job_import' feature)
//
// Fix (task-11 local E2E): 'job_import' was registered at 'free' tier in
// FEATURE_TIERS (src/server/entitlements.js, commit 288b617) specifically so
// requireFeature() would grant free-tier users access instead of 400-ing
// 'Unknown feature'. That change made the manual
// `user.subscriptionTier === 'free'` block below - previously "unreachable
// dead code" per the old comment here - into live code that immediately
// re-blocked the exact tier requireFeature had just been fixed to allow,
// with a stale 'Plus feature' message. Removed the redundant re-fetch/check;
// requireFeature(authUser, 'job_import') is the single source of truth for
// this gate, and authUser (from requireAuth) already carries
// subscriptionTier.
import { NextResponse } from 'next/server';
import { withApi } from '@/server/http';
import { requireAuth } from '@/server/auth';
import { requireFeature } from '@/server/entitlements';
import SavedJob from '@/server/models/SavedJob';
import Job from '@/server/models/Job';
import logger from '@/server/logger';

export const POST = withApi(async (request, context) => {
  const authUser = await requireAuth(request);
  const { savedJobId } = await context.params;

  requireFeature(authUser, 'job_import');

  const savedJob = await SavedJob.findOne({
    _id: savedJobId,
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

  if (savedJob.importedToTracker) {
    return NextResponse.json(
      {
        success: false,
        error: 'Job already imported to tracker',
        data: { importedJobId: savedJob.importedJobId },
      },
      { status: 409 }
    );
  }

  try {
    // Create new Job entry
    const jobData = {
      user: authUser._id,
      company: savedJob.company,
      position: savedJob.title,
      location: savedJob.location.display,
      applicationUrl: savedJob.applicationUrl,
      status: 'Saved', // Default status for imported jobs
      salary: savedJob.salary?.display || '',
      jobType: savedJob.jobType,
      workType: savedJob.workType,
      description: savedJob.description,
      notes: `Imported from ${savedJob.source}${savedJob.notes ? `\n\nOriginal notes: ${savedJob.notes}` : ''}`,
      tags: savedJob.tags,
      source: savedJob.source,
      externalId: savedJob.externalId,
      externalUrl: savedJob.applicationUrl,
      importedAt: new Date(),
      importedFromSaved: savedJob._id,
    };

    const newJob = await Job.create(jobData);

    // Update saved job to mark as imported
    savedJob.importedToTracker = true;
    savedJob.importedJobId = newJob._id;
    savedJob.importedAt = new Date();
    await savedJob.save();

    logger.info(`Job imported to tracker: ${savedJob.title} by user ${authUser._id}`);

    return NextResponse.json(
      {
        success: true,
        data: {
          job: newJob,
          savedJob: savedJob,
        },
        message: 'Job imported to tracker successfully',
      },
      { status: 201 }
    );
  } catch (error) {
    logger.error(`Error importing job to tracker: ${error.message}`);

    if (error.name === 'ValidationError') {
      const messages = Object.values(error.errors).map((val) => val.message);
      return NextResponse.json(
        {
          success: false,
          error: `Failed to import job: ${messages.join(', ')}`,
        },
        { status: 400 }
      );
    }

    return NextResponse.json(
      {
        success: false,
        error: 'Failed to import job to tracker',
      },
      { status: 500 }
    );
  }
});
