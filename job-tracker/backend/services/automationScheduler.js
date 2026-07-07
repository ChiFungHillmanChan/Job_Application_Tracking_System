const cron = require('node-cron');
const SearchConfig = require('../models/SearchConfig');
const UserProfile = require('../models/UserProfile');
const AutomationRun = require('../models/AutomationRun');
const { runSearchPipeline } = require('../controllers/autoApplyController');
const logger = require('../utils/logger');

let scheduledTask = null;

function startScheduler() {
  if (scheduledTask) {
    logger.info('Automation scheduler already running');
    return;
  }

  // Run every 6 hours: at 00:00, 06:00, 12:00, 18:00
  scheduledTask = cron.schedule('0 */6 * * *', async () => {
    logger.info('Automation scheduler triggered');
    await runScheduledSearches();
  });

  logger.info('Automation scheduler started (runs every 6 hours)');
}

function stopScheduler() {
  if (scheduledTask) {
    scheduledTask.stop();
    scheduledTask = null;
    logger.info('Automation scheduler stopped');
  }
}

async function runScheduledSearches() {
  try {
    const activeConfigs = await SearchConfig.find({ isActive: true })
      .populate('user');

    if (activeConfigs.length === 0) {
      logger.info('No active search configs found');
      return;
    }

    logger.info(`Processing ${activeConfigs.length} active search configs`);

    for (const config of activeConfigs) {
      if (!config.shouldRunNow()) {
        logger.info(`Skipping config ${config._id} - not due yet`);
        continue;
      }

      const profile = await UserProfile.findOne({ user: config.user._id || config.user });
      if (!profile) {
        logger.warn(`No profile found for user ${config.user._id || config.user}, skipping`);
        continue;
      }

      const automationRun = await AutomationRun.create({
        user: config.user._id || config.user,
        searchConfig: config._id,
        status: 'running'
      });

      try {
        await runSearchPipeline(
          config.user._id || config.user,
          config,
          profile,
          automationRun._id
        );
        logger.info(`Completed scheduled run for config ${config._id}`);
      } catch (error) {
        logger.error(`Scheduled run failed for config ${config._id}: ${error.message}`);
        await AutomationRun.findByIdAndUpdate(automationRun._id, {
          status: 'failed',
          runErrors: [{ board: 'scheduler', error: error.message }]
        });
      }
    }
  } catch (error) {
    logger.error(`Scheduler error: ${error.message}`);
  }
}

module.exports = { startScheduler, stopScheduler, runScheduledSearches };
