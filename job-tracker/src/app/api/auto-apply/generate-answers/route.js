// Port of backend/controllers/autoApplyController.js generateAnswers
// @route   POST /api/auto-apply/generate-answers
// @access  Private
import { NextResponse } from 'next/server';
import { withApi } from '@/server/http';
import { requireAuth } from '@/server/auth';
import PreparedApplication from '@/server/models/PreparedApplication';
import UserProfile from '@/server/models/UserProfile';
import '@/server/models/SavedJob';
import { generateApplicationAnswers } from '@/server/services/aiApplicationAnswerer';

// This handler makes a synchronous gpt-4.1 call (potentially several questions),
// so it gets a longer function budget than the default.
export const maxDuration = 300;

export const POST = withApi(async (request) => {
  const authUser = await requireAuth(request);
  const { applicationId, questions } = await request.json();

  if (!questions?.length) {
    return NextResponse.json(
      { success: false, error: 'Please provide at least one question' },
      { status: 400 }
    );
  }

  const profile = await UserProfile.findOne({ user: authUser._id });
  if (!profile) {
    return NextResponse.json(
      { success: false, error: 'Please analyze your CV first to create a profile.' },
      { status: 400 }
    );
  }

  let jobData = {};
  if (applicationId) {
    const application = await PreparedApplication.findOne({
      _id: applicationId,
      user: authUser._id,
    }).populate('savedJob');

    if (application?.savedJob) {
      jobData = application.savedJob;
    }
  }

  const answers = await generateApplicationAnswers(profile, jobData, questions);

  if (applicationId) {
    await PreparedApplication.findByIdAndUpdate(applicationId, {
      applicationAnswers: answers,
    });
  }

  return NextResponse.json({ success: true, data: answers }, { status: 200 });
});
