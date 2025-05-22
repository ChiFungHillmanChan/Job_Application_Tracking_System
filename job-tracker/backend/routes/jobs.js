const express = require('express');
const {
  getJobs,
  getJob,
  createJob,
  updateJob,
  deleteJob,
  getJobStats,
  getRecentActivity
} = require('../controllers/jobController');
const { protect } = require('../middleware/auth');

const router = express.Router();

// All routes are protected - user must be authenticated
router.use(protect);

// Job statistics and recent activity routes
router.get('/stats', getJobStats);
router.get('/recent', getRecentActivity);

// Main job CRUD routes
router.route('/')
  .get(getJobs)     
  .post(createJob); 

router.route('/:id')
  .get(getJob)       
  .put(updateJob)   
  .delete(deleteJob); 

module.exports = router;