const asyncHandler = require('express-async-handler');
const SearchConfig = require('../models/SearchConfig');
const PreparedApplication = require('../models/PreparedApplication');
const AutomationRun = require('../models/AutomationRun');
const UserProfile = require('../models/UserProfile');
const SavedJob = require('../models/SavedJob');
const Resume = require('../models/Resume');
const { searchAllBoards } = require('../services/jobBoards');
const { scoreBatchJobMatches } = require('../services/aiJobMatcher');
const { generateCoverLetter } = require('../services/aiCoverLetterWriter');
const { generateApplicationAnswers } = require('../services/aiApplicationAnswerer');
const logger = require('../utils/logger');
const mongoose = require('mongoose');

// @desc    Get or create search config
// @route   GET /api/auto-apply/config
// @access  Private
const getSearchConfig = asyncHandler(async (req, res) => {
  let config = await SearchConfig.findOne({ user: req.user._id });

  if (!config) {
    config = await SearchConfig.create({
      user: req.user._id,
      keywords: [],
      locations: [],
      jobTypes: ['permanent', 'full-time'],
      workTypes: ['onsite', 'remote', 'hybrid'],
      boards: ['reed'],
      isActive: false
    });
  }

  res.status(200).json({ success: true, data: config });
});

// @desc    Update search config
// @route   PUT /api/auto-apply/config
// @access  Private
const updateSearchConfig = asyncHandler(async (req, res) => {
  const allowedFields = [
    'keywords', 'locations', 'jobTypes', 'workTypes',
    'salaryMin', 'salaryMax', 'excludeCompanies', 'excludeKeywords',
    'boards', 'isActive', 'searchFrequency', 'maxResultsPerRun',
    'matchScoreThreshold'
  ];

  const updateData = {};
  for (const field of allowedFields) {
    if (req.body[field] !== undefined) {
      updateData[field] = req.body[field];
    }
  }

  const config = await SearchConfig.findOneAndUpdate(
    { user: req.user._id },
    updateData,
    { new: true, runValidators: true, upsert: true }
  );

  res.status(200).json({ success: true, data: config });
});

// @desc    Manually trigger a search run
// @route   POST /api/auto-apply/run
// @access  Private
const triggerSearchRun = asyncHandler(async (req, res) => {
  const profile = await UserProfile.findOne({ user: req.user._id });
  if (!profile) {
    return res.status(400).json({
      success: false,
      error: 'Please analyze your CV first to create a profile.'
    });
  }

  const config = await SearchConfig.findOne({ user: req.user._id });
  if (!config) {
    return res.status(400).json({
      success: false,
      error: 'Please set up your search preferences first.'
    });
  }

  if (!config.keywords.length && !config.locations.length) {
    return res.status(400).json({
      success: false,
      error: 'Please add at least one keyword or location to your search config.'
    });
  }

  const automationRun = await AutomationRun.create({
    user: req.user._id,
    searchConfig: config._id,
    status: 'running'
  });

  res.status(202).json({
    success: true,
    data: { runId: automationRun._id },
    message: 'Search run started. Check back for results.'
  });

  runSearchPipeline(req.user._id, config, profile, automationRun._id)
    .catch(err => logger.error(`Search pipeline failed: ${err.message}`));
});

async function runSearchPipeline(userId, config, profile, runId) {
  const startTime = Date.now();
  let totalJobsFound = 0;
  let totalJobsMatched = 0;
  let applicationsPrepared = 0;
  const boardsSearched = [];
  const errors = [];

  try {
    const searchQueries = buildSearchQueries(config);

    for (const query of searchQueries) {
      const result = await searchAllBoards(
        query.keywords,
        query.location,
        {
          jobTypes: config.jobTypes,
          minimumSalary: config.salaryMin,
          maximumSalary: config.salaryMax,
          limit: config.maxResultsPerRun,
          distance: query.radius
        },
        config.boards
      );

      totalJobsFound += result.jobs.length;
      boardsSearched.push(...result.boardsSearched.filter(b => !boardsSearched.includes(b)));
      errors.push(...result.errors);

      let filteredJobs = result.jobs.filter(job => {
        if (config.excludeCompanies?.length) {
          const companyLower = job.company.toLowerCase();
          if (config.excludeCompanies.some(c => companyLower.includes(c.toLowerCase()))) {
            return false;
          }
        }
        if (config.excludeKeywords?.length) {
          const titleLower = job.title.toLowerCase();
          const descLower = (job.description || '').toLowerCase();
          if (config.excludeKeywords.some(k => titleLower.includes(k.toLowerCase()) || descLower.includes(k.toLowerCase()))) {
            return false;
          }
        }
        return true;
      });

      const existingExternalIds = await SavedJob.find({
        user: userId,
        externalId: { $in: filteredJobs.map(j => j.externalId) }
      }).distinct('externalId');

      filteredJobs = filteredJobs.filter(j => !existingExternalIds.includes(j.externalId));

      if (filteredJobs.length === 0) continue;

      const matchedJobs = await scoreBatchJobMatches(profile, filteredJobs);

      const qualifiedJobs = matchedJobs.filter(m => m.matchScore >= config.matchScoreThreshold);
      totalJobsMatched += qualifiedJobs.length;

      for (const match of qualifiedJobs) {
        try {
          const savedJob = await SavedJob.create({
            user: userId,
            externalId: match.job.externalId,
            source: match.job.source,
            title: match.job.title,
            company: match.job.company,
            location: match.job.location,
            salary: match.job.salary,
            jobType: match.job.jobType,
            workType: match.job.workType,
            description: match.job.description,
            applicationUrl: match.job.applicationUrl,
            companyUrl: match.job.companyUrl,
            logoUrl: match.job.logoUrl,
            postedDate: match.job.postedDate,
            expirationDate: match.job.expirationDate,
            tags: ['auto-found']
          });

          const coverLetterResult = await generateCoverLetter(profile, match.job);

          const defaultResume = await Resume.findOne({ user: userId, isDefault: true });

          await PreparedApplication.create({
            user: userId,
            savedJob: savedJob._id,
            matchScore: match.matchScore,
            matchReasoning: match.matchReasoning,
            status: 'pending_review',
            coverLetter: coverLetterResult.coverLetter,
            aiNotes: match.aiNotes,
            cvToUse: defaultResume?._id || null
          });

          applicationsPrepared++;
        } catch (error) {
          if (error.code === 11000) {
            logger.info(`Duplicate job skipped: ${match.job.title} at ${match.job.company}`);
          } else {
            logger.error(`Failed to prepare application: ${error.message}`);
            errors.push({ board: match.job.source, error: error.message });
          }
        }
      }
    }

    await AutomationRun.findByIdAndUpdate(runId, {
      status: errors.length > 0 && totalJobsFound === 0 ? 'failed' : errors.length > 0 ? 'partial' : 'completed',
      boardsSearched,
      jobsFound: totalJobsFound,
      jobsMatched: totalJobsMatched,
      applicationsPrepared,
      runErrors: errors,
      duration: Date.now() - startTime
    });

    await SearchConfig.findByIdAndUpdate(config._id, {
      lastRunAt: new Date()
    });

    logger.info(`Search run completed: ${totalJobsFound} found, ${totalJobsMatched} matched, ${applicationsPrepared} prepared`);
  } catch (error) {
    logger.error(`Search pipeline error: ${error.message}`);
    await AutomationRun.findByIdAndUpdate(runId, {
      status: 'failed',
      runErrors: [{ board: 'system', error: error.message }],
      duration: Date.now() - startTime
    });
  }
}

function buildSearchQueries(config) {
  const queries = [];
  const keywords = config.keywords.length ? config.keywords : [''];
  const locations = config.locations.length ? config.locations : [{ name: '', radius: 25 }];

  for (const keyword of keywords) {
    for (const loc of locations) {
      queries.push({
        keywords: keyword,
        location: loc.name,
        radius: loc.radius
      });
    }
  }

  return queries;
}

// @desc    Get prepared applications queue
// @route   GET /api/auto-apply/queue
// @access  Private
const getApplicationQueue = asyncHandler(async (req, res) => {
  const { status = 'pending_review', page = 1, limit = 20, sortBy = 'matchScore', sortOrder = 'desc' } = req.query;

  const filter = { user: req.user._id };
  if (status !== 'all') {
    filter.status = status;
  }

  const sort = {};
  sort[sortBy] = sortOrder === 'desc' ? -1 : 1;

  const applications = await PreparedApplication.find(filter)
    .populate('savedJob')
    .populate('cvToUse', 'name originalFilename')
    .sort(sort)
    .limit(parseInt(limit))
    .skip((parseInt(page) - 1) * parseInt(limit));

  const totalCount = await PreparedApplication.countDocuments(filter);

  res.status(200).json({
    success: true,
    data: {
      applications,
      pagination: {
        currentPage: parseInt(page),
        totalPages: Math.ceil(totalCount / parseInt(limit)),
        totalCount,
        limit: parseInt(limit)
      }
    }
  });
});

// @desc    Review (approve/reject) a prepared application
// @route   PUT /api/auto-apply/queue/:id/review
// @access  Private
const reviewApplication = asyncHandler(async (req, res) => {
  const { action, coverLetter, userNotes } = req.body;

  if (!['approve', 'reject'].includes(action)) {
    return res.status(400).json({
      success: false,
      error: 'Action must be "approve" or "reject"'
    });
  }

  const application = await PreparedApplication.findOne({
    _id: req.params.id,
    user: req.user._id
  });

  if (!application) {
    return res.status(404).json({ success: false, error: 'Application not found' });
  }

  const updateData = {
    status: action === 'approve' ? 'approved' : 'rejected',
    reviewedAt: new Date()
  };

  if (coverLetter !== undefined) updateData.coverLetter = coverLetter;
  if (userNotes !== undefined) updateData.userNotes = userNotes;

  const updated = await PreparedApplication.findByIdAndUpdate(
    application._id,
    updateData,
    { new: true }
  ).populate('savedJob');

  res.status(200).json({ success: true, data: updated });
});

// @desc    Bulk approve applications
// @route   POST /api/auto-apply/queue/bulk-approve
// @access  Private
const bulkApproveApplications = asyncHandler(async (req, res) => {
  const { applicationIds, minScore } = req.body;

  const filter = { user: req.user._id, status: 'pending_review' };

  if (applicationIds?.length) {
    filter._id = { $in: applicationIds.map(id => new mongoose.Types.ObjectId(id)) };
  } else if (minScore) {
    filter.matchScore = { $gte: minScore };
  }

  const result = await PreparedApplication.updateMany(
    filter,
    { status: 'approved', reviewedAt: new Date() }
  );

  res.status(200).json({
    success: true,
    data: { modifiedCount: result.modifiedCount },
    message: `${result.modifiedCount} applications approved`
  });
});

// @desc    Get automation run history
// @route   GET /api/auto-apply/history
// @access  Private
const getRunHistory = asyncHandler(async (req, res) => {
  const { page = 1, limit = 20 } = req.query;

  const runs = await AutomationRun.find({ user: req.user._id })
    .sort({ runDate: -1 })
    .limit(parseInt(limit))
    .skip((parseInt(page) - 1) * parseInt(limit));

  const totalCount = await AutomationRun.countDocuments({ user: req.user._id });

  res.status(200).json({
    success: true,
    data: {
      runs,
      pagination: {
        currentPage: parseInt(page),
        totalPages: Math.ceil(totalCount / parseInt(limit)),
        totalCount
      }
    }
  });
});

// @desc    Get automation dashboard stats
// @route   GET /api/auto-apply/stats
// @access  Private
const getAutoApplyStats = asyncHandler(async (req, res) => {
  const userId = req.user._id;

  const [
    totalPrepared,
    pendingReview,
    approved,
    submitted,
    rejected,
    recentRuns,
    config,
    profile
  ] = await Promise.all([
    PreparedApplication.countDocuments({ user: userId }),
    PreparedApplication.countDocuments({ user: userId, status: 'pending_review' }),
    PreparedApplication.countDocuments({ user: userId, status: 'approved' }),
    PreparedApplication.countDocuments({ user: userId, status: 'submitted' }),
    PreparedApplication.countDocuments({ user: userId, status: 'rejected' }),
    AutomationRun.find({ user: userId }).sort({ runDate: -1 }).limit(5),
    SearchConfig.findOne({ user: userId }),
    UserProfile.findOne({ user: userId })
  ]);

  const avgMatchScore = await PreparedApplication.aggregate([
    { $match: { user: new mongoose.Types.ObjectId(userId) } },
    { $group: { _id: null, avg: { $avg: '$matchScore' } } }
  ]);

  res.status(200).json({
    success: true,
    data: {
      overview: {
        totalPrepared,
        pendingReview,
        approved,
        submitted,
        rejected,
        avgMatchScore: avgMatchScore[0]?.avg ? Math.round(avgMatchScore[0].avg) : 0
      },
      hasProfile: !!profile,
      hasConfig: !!config,
      isActive: config?.isActive || false,
      lastRunAt: config?.lastRunAt || null,
      recentRuns
    }
  });
});

// @desc    Generate answers for application questions
// @route   POST /api/auto-apply/generate-answers
// @access  Private
const generateAnswers = asyncHandler(async (req, res) => {
  const { applicationId, questions } = req.body;

  if (!questions?.length) {
    return res.status(400).json({
      success: false,
      error: 'Please provide at least one question'
    });
  }

  const profile = await UserProfile.findOne({ user: req.user._id });
  if (!profile) {
    return res.status(400).json({
      success: false,
      error: 'Please analyze your CV first to create a profile.'
    });
  }

  let jobData = {};
  if (applicationId) {
    const application = await PreparedApplication.findOne({
      _id: applicationId,
      user: req.user._id
    }).populate('savedJob');

    if (application?.savedJob) {
      jobData = application.savedJob;
    }
  }

  const answers = await generateApplicationAnswers(profile, jobData, questions);

  if (applicationId) {
    await PreparedApplication.findByIdAndUpdate(applicationId, {
      applicationAnswers: answers
    });
  }

  res.status(200).json({ success: true, data: answers });
});

module.exports = {
  getSearchConfig,
  updateSearchConfig,
  triggerSearchRun,
  getApplicationQueue,
  reviewApplication,
  bulkApproveApplications,
  getRunHistory,
  getAutoApplyStats,
  generateAnswers,
  runSearchPipeline
};
