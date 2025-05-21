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
  .get(getJobs)      // GET /api/jobs - Get all jobs for user with filtering
  .post(createJob);  // POST /api/jobs - Create new job

router.route('/:id')
  .get(getJob)       // GET /api/jobs/:id - Get single job
  .put(updateJob)    // PUT /api/jobs/:id - Update job
  .delete(deleteJob); // DELETE /api/jobs/:id - Delete job

module.exports = router;