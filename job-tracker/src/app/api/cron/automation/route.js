// Vercel Cron entrypoint. Replaces backend/services/automationScheduler.js's
// in-process node-cron loop: instead of running every user's pipeline inline
// (unbounded, minutes-to-hours), this route fans out - it creates one
// AutomationRun and starts one durable workflow per due config, then returns
// immediately. The schedule lives in vercel.json (0 */6 * * *).
import { NextResponse } from 'next/server';
import { connectDB } from '@/server/db';
import SearchConfig from '@/server/models/SearchConfig';
import UserProfile from '@/server/models/UserProfile';
import AutomationRun from '@/server/models/AutomationRun';
import { userAutomationWorkflow } from '@/workflows/automation';
import logger from '@/server/logger';

export const maxDuration = 60;

export async function GET(request) {
  // Without a configured secret there is nothing to authenticate against - a
  // request sending `Bearer undefined` must never be treated as authorized.
  if (!process.env.CRON_SECRET) {
    return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
  }

  // Vercel Cron sends `Authorization: Bearer <CRON_SECRET>`. Reject anything else.
  const authHeader = request.headers.get('authorization');
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
  }

  await connectDB();

  const activeConfigs = await SearchConfig.find({ isActive: true });

  if (activeConfigs.length === 0) {
    logger.info('Cron: no active search configs found');
    return NextResponse.json({ success: true, data: { active: 0, triggered: 0, skipped: 0 } });
  }

  logger.info(`Cron: evaluating ${activeConfigs.length} active search configs`);

  const { start } = await import('workflow/api');

  let triggered = 0;
  let skipped = 0;

  for (const config of activeConfigs) {
    // One bad config (a DB hiccup on the profile lookup / run create, a start()
    // failure, etc.) must not 500 the whole cron - log it and move on, matching
    // automationScheduler.runScheduledSearches' per-config tolerance.
    try {
      // shouldRunNow() gates on searchFrequency vs lastRunAt (instance method).
      if (!config.shouldRunNow()) {
        skipped += 1;
        continue;
      }

      const profile = await UserProfile.findOne({ user: config.user }).select('_id');
      if (!profile) {
        logger.warn(`Cron: no profile for user ${config.user}, skipping config ${config._id}`);
        skipped += 1;
        continue;
      }

      const automationRun = await AutomationRun.create({
        user: config.user,
        searchConfig: config._id,
        status: 'running',
      });

      try {
        await start(userAutomationWorkflow, [String(config._id), String(automationRun._id)]);
        triggered += 1;
      } catch (error) {
        logger.error(`Cron: failed to start workflow for config ${config._id}: ${error.message}`);
        await AutomationRun.findByIdAndUpdate(automationRun._id, {
          status: 'failed',
          runErrors: [{ board: 'scheduler', error: error.message }],
        });
      }
    } catch (error) {
      logger.error(`Cron: error processing config ${config._id}: ${error.message}`);
      skipped += 1;
    }
  }

  logger.info(`Cron: triggered ${triggered}, skipped ${skipped}`);
  return NextResponse.json({
    success: true,
    data: { active: activeConfigs.length, triggered, skipped },
  });
}
