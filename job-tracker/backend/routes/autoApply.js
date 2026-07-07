const express = require('express');
const {
  getSearchConfig,
  updateSearchConfig,
  triggerSearchRun,
  getApplicationQueue,
  reviewApplication,
  bulkApproveApplications,
  getRunHistory,
  getAutoApplyStats,
  generateAnswers
} = require('../controllers/autoApplyController');
const { protect } = require('../middleware/auth');

const router = express.Router();

router.use(protect);

router.get('/stats', getAutoApplyStats);

router.get('/config', getSearchConfig);
router.put('/config', updateSearchConfig);

router.post('/run', triggerSearchRun);

router.get('/queue', getApplicationQueue);
router.put('/queue/:id/review', reviewApplication);
router.post('/queue/bulk-approve', bulkApproveApplications);

router.get('/history', getRunHistory);

router.post('/generate-answers', generateAnswers);

module.exports = router;
