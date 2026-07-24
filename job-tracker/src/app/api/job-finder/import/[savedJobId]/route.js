// Port of backend/controllers/jobFinderController.js importJobToTracker
// @route   POST /api/job-finder/import/:savedJobId
// @access  Private (requires the 'job_import' feature)
//
// Note: `requireFeature(authUser, 'job_import')` is called per the task
// brief, mirroring the Express route wiring
// (`requireFeature('job_import')` middleware in backend/routes/jobFinder.js).
// However 'job_import' is not present in FEATURE_TIERS
// (src/server/entitlements.js), nor was it present in the original Express
// FEATURE_TIERS map (backend/middleware/premiumRequired.js) - this is a
// pre-existing bug carried over verbatim: requireFeature throws
// ApiError(400, 'Unknown feature') for every caller regardless of tier,
// so the manual `user.subscriptionTier === 'free'` check further below
// (also ported verbatim) is unreachable dead code, same as in Express.
import { NextResponse } from 'next/server';
import { withApi } from '@/server/http';
import { requireAuth } from '@/server/auth';
import { requireFeature } from '@/server/entitlements';
import SavedJob from '@/server/models/SavedJob';
import Job from '@/server/models/Job';
import User from '@/server/models/User';
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

  // Check user's subscription tier for import feature
  const user = await User.findById(authUser._id);
  if (user.subscriptionTier === 'free') {
    return NextResponse.json(
      {
        success: false,
        error: 'Job import is a Plus feature. Upgrade to import jobs to your tracker.',
        code: 'FEATURE_RESTRICTED',
        requiredTier: 'plus',
        userTier: user.subscriptionTier,
        upgradeUrl: '/settings/subscription',
      },
      { status: 403 }
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
