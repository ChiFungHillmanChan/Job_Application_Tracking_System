const express = require('express');
const rateLimit = require('express-rate-limit');
const {
  searchJobs,
  saveJob,
  getSavedJobs,
  removeSavedJob,
  importJobToTracker,
  getJobFinderStats
} = require('../controllers/jobFinderController');
const { protect } = require('../middleware/auth');
const { requireFeature } = require('../middleware/premiumRequired');

const router = express.Router();

const searchLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, 
  max: 100, 
  message: {
    success: false,
    error: 'Too many search requests from this IP, please try again later.',
    retryAfter: '15 minutes'
  },
  standardHeaders: true,
  legacyHeaders: false,
});

const saveLimiter = rateLimit({
  windowMs: 60 * 1000, 
  max: 20, 
  message: {
    success: false,
    error: 'Too many save requests, please slow down.',
    retryAfter: '1 minute'
  },
  standardHeaders: true,
  legacyHeaders: false,
});

router.get('/search', searchLimiter, searchJobs);


router.use(protect); 


router.post('/saved', saveLimiter, saveJob);
router.get('/saved', getSavedJobs);
router.delete('/saved/:id', removeSavedJob);
router.get('/stats', getJobFinderStats);

router.post('/import/:savedJobId', requireFeature('job_import'), importJobToTracker);

module.exports = router;