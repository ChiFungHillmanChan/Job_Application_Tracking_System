const Job = require('../models/Job');
const asyncHandler = require('express-async-handler');
const logger = require('../utils/logger');

// @desc    Get all jobs for a user
// @route   GET /api/jobs
// @access  Private
const getJobs = asyncHandler(async (req, res) => {
  try {
    const { status, jobType, search, sortBy = 'updatedAt', sortOrder = 'desc' } = req.query;
    
    // Build filter object
    const filter = { user: req.user._id };
    
    if (status) {
      filter.status = status;
    }
    
    if (jobType) {
      filter.jobType = jobType;
    }
    
    // Build search filter
    if (search) {
      filter.$or = [
        { company: { $regex: search, $options: 'i' } },
        { position: { $regex: search, $options: 'i' } },
        { location: { $regex: search, $options: 'i' } },
        { notes: { $regex: search, $options: 'i' } },
        { tags: { $in: [new RegExp(search, 'i')] } }
      ];
    }
    
    // Build sort object
    const sort = {};
    sort[sortBy] = sortOrder === 'desc' ? -1 : 1;
    
    const jobs = await Job.find(filter)
      .populate('resume', 'name version')
      .sort(sort);
    
    res.status(200).json({
      success: true,
      count: jobs.length,
      data: jobs
    });
  } catch (error) {
    logger.error(`Error fetching jobs for user ${req.user._id}: ${error.message}`);
    res.status(500).json({
      success: false,
      error: 'Server error while fetching jobs'
    });
  }
});

// @desc    Get single job
// @route   GET /api/jobs/:id
// @access  Private
const getJob = asyncHandler(async (req, res) => {
  try {
    const job = await Job.findById(req.params.id)
      .populate('resume', 'name version')
      .populate('user', 'name email');
    
    if (!job) {
      return res.status(404).json({
        success: false,
        error: 'Job not found'
      });
    }
    
    // Check if job belongs to user
    if (job.user._id.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        error: 'Not authorized to access this job'
      });
    }
    
    res.status(200).json({
      success: true,
      data: job
    });
  } catch (error) {
    logger.error(`Error fetching job ${req.params.id}: ${error.message}`);
    
    if (error.name === 'CastError') {
      return res.status(404).json({
        success: false,
        error: 'Job not found'
      });
    }
    
    res.status(500).json({
      success: false,
      error: 'Server error while fetching job'
    });
  }
});

// @desc    Create new job
// @route   POST /api/jobs
// @access  Private
const createJob = asyncHandler(async (req, res) => {
  try {
    // Add user to req.body
    req.body.user = req.user._id;
    
    // Validate required fields
    const { company, position, location, status } = req.body;
    
    if (!company || !position || !location || !status) {
      return res.status(400).json({
        success: false,
        error: 'Please provide company, position, location, and status'
      });
    }
    
    // Create job
    const job = await Job.create(req.body);
    
    // Populate the job with related data
    const populatedJob = await Job.findById(job._id)
      .populate('resume', 'name version')
      .populate('user', 'name email');
    
    logger.info(`New job created by user ${req.user._id}: ${company} - ${position}`);
    
    res.status(201).json({
      success: true,
      data: populatedJob
    });
  } catch (error) {
    logger.error(`Error creating job for user ${req.user._id}: ${error.message}`);
    
    // Handle mongoose validation errors
    if (error.name === 'ValidationError') {
      const messages = Object.values(error.errors).map(val => val.message);
      return res.status(400).json({
        success: false,
        error: messages
      });
    }
    
    res.status(500).json({
      success: false,
      error: 'Server error while creating job'
    });
  }
});

// @desc    Update job
// @route   PUT /api/jobs/:id
// @access  Private
const updateJob = asyncHandler(async (req, res) => {
  try {
    let job = await Job.findById(req.params.id);
    
    if (!job) {
      return res.status(404).json({
        success: false,
        error: 'Job not found'
      });
    }
    
    // Check if job belongs to user
    if (job.user.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        error: 'Not authorized to update this job'
      });
    }
    
    // Update job
    job = await Job.findByIdAndUpdate(
      req.params.id,
      { ...req.body, updatedAt: Date.now() },
      { new: true, runValidators: true }
    ).populate('resume', 'name version');
    
    logger.info(`Job updated by user ${req.user._id}: ${job.company} - ${job.position}`);
    
    res.status(200).json({
      success: true,
      data: job
    });
  } catch (error) {
    logger.error(`Error updating job ${req.params.id}: ${error.message}`);
    
    if (error.name === 'CastError') {
      return res.status(404).json({
        success: false,
        error: 'Job not found'
      });
    }
    
    if (error.name === 'ValidationError') {
      const messages = Object.values(error.errors).map(val => val.message);
      return res.status(400).json({
        success: false,
        error: messages
      });
    }
    
    res.status(500).json({
      success: false,
      error: 'Server error while updating job'
    });
  }
});

// @desc    Delete job
// @route   DELETE /api/jobs/:id
// @access  Private
const deleteJob = asyncHandler(async (req, res) => {
  try {
    const job = await Job.findById(req.params.id);
    
    if (!job) {
      return res.status(404).json({
        success: false,
        error: 'Job not found'
      });
    }
    
    // Check if job belongs to user
    if (job.user.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        error: 'Not authorized to delete this job'
      });
    }
    
    await job.deleteOne();
    
    logger.info(`Job deleted by user ${req.user._id}: ${job.company} - ${job.position}`);
    
    res.status(200).json({
      success: true,
      data: {}
    });
  } catch (error) {
    logger.error(`Error deleting job ${req.params.id}: ${error.message}`);
    
    if (error.name === 'CastError') {
      return res.status(404).json({
        success: false,
        error: 'Job not found'
      });
    }
    
    res.status(500).json({
      success: false,
      error: 'Server error while deleting job'
    });
  }
});

// @desc    Get job statistics for user
// @route   GET /api/jobs/stats
// @access  Private
const getJobStats = asyncHandler(async (req, res) => {
  try {
    const stats = await Job.aggregate([
      { $match: { user: req.user._id } },
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 }
        }
      }
    ]);
    
    // Initialize all status counts to 0
    const statusCounts = {
      'Saved': 0,
      'Applied': 0,
      'Phone Screen': 0,
      'Interview': 0,
      'Technical Assessment': 0,
      'Offer': 0,
      'Rejected': 0,
      'Withdrawn': 0
    };
    
    // Update counts from aggregation
    stats.forEach(stat => {
      statusCounts[stat._id] = stat.count;
    });
    
    // Calculate total
    const total = Object.values(statusCounts).reduce((sum, count) => sum + count, 0);
    
    res.status(200).json({
      success: true,
      data: {
        total,
        ...statusCounts
      }
    });
  } catch (error) {
    logger.error(`Error fetching job stats for user ${req.user._id}: ${error.message}`);
    res.status(500).json({
      success: false,
      error: 'Server error while fetching job statistics'
    });
  }
});

// @desc    Get recent job activity
// @route   GET /api/jobs/recent
// @access  Private
const getRecentActivity = asyncHandler(async (req, res) => {
  try {
    const { limit = 10 } = req.query;
    
    const recentJobs = await Job.find({ user: req.user._id })
      .sort({ updatedAt: -1 })
      .limit(parseInt(limit))
      .select('company position status updatedAt createdAt applicationDate')
      .lean();
    
    // Transform to activity format
    const activities = recentJobs.map(job => {
      let type = 'Status Change';
      let date = job.updatedAt;
      
      // Determine activity type based on dates
      if (job.createdAt.getTime() === job.updatedAt.getTime()) {
        type = 'Job Added';
      } else if (job.applicationDate && 
                 Math.abs(job.applicationDate.getTime() - job.updatedAt.getTime()) < 60000) {
        type = 'Application Submitted';
      }
      
      return {
        id: job._id,
        date,
        company: job.company,
        position: job.position,
        status: job.status,
        type
      };
    });
    
    res.status(200).json({
      success: true,
      count: activities.length,
      data: activities
    });
  } catch (error) {
    logger.error(`Error fetching recent activity for user ${req.user._id}: ${error.message}`);
    res.status(500).json({
      success: false,
      error: 'Server error while fetching recent activity'
    });
  }
});

module.exports = {
  getJobs,
  getJob,
  createJob,
  updateJob,
  deleteJob,
  getJobStats,
  getRecentActivity
};