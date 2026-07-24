// Port of backend/controllers/autoApplyController.js triggerSearchRun.
// @route   POST /api/auto-apply/run
// @access  Private
//
// Behavior change (Workflow DevKit migration): the old handler created the
// AutomationRun, responded 202, then ran runSearchPipeline() in the same process
// (fire-and-forget). Here we create the AutomationRun and hand off to a durable
// workflow via start(), returning immediately. The response now carries
// { runId, status: 'running' } (runId = the AutomationRun mongo doc id, which is
// what the queue/history UIs read). The pre-flight 400 validations are preserved
// verbatim.
import { NextResponse } from 'next/server';
import { start } from 'workflow/api';
import { withApi } from '@/server/http';
import { requireAuth } from '@/server/auth';
import UserProfile from '@/server/models/UserProfile';
import SearchConfig from '@/server/models/SearchConfig';
import AutomationRun from '@/server/models/AutomationRun';
import { userAutomationWorkflow } from '@/workflows/automation';

export const POST = withApi(async (request) => {
  const authUser = await requireAuth(request);

  const profile = await UserProfile.findOne({ user: authUser._id });
  if (!profile) {
    return NextResponse.json(
      { success: false, error: 'Please analyze your CV first to create a profile.' },
      { status: 400 }
    );
  }

  const config = await SearchConfig.findOne({ user: authUser._id });
  if (!config) {
    return NextResponse.json(
      { success: false, error: 'Please set up your search preferences first.' },
      { status: 400 }
    );
  }

  if (!config.keywords.length && !config.locations.length) {
    return NextResponse.json(
      {
        success: false,
        error: 'Please add at least one keyword or location to your search config.',
      },
      { status: 400 }
    );
  }

  const automationRun = await AutomationRun.create({
    user: authUser._id,
    searchConfig: config._id,
    status: 'running',
  });

  // If handoff fails after the run doc exists, mark it failed so it does not
  // hang in 'running' forever (parity with the cron route).
  try {
    await start(userAutomationWorkflow, [String(config._id), String(automationRun._id)]);
  } catch (error) {
    await AutomationRun.findByIdAndUpdate(automationRun._id, {
      status: 'failed',
      runErrors: [{ board: 'scheduler', error: error.message }],
    });
    throw error;
  }

  return NextResponse.json(
    {
      success: true,
      data: { runId: automationRun._id, status: 'running' },
    },
    { status: 202 }
  );
});
