const SavedJob = require('../models/SavedJob');
const Job = require('../models/Job');
const User = require('../models/User');
const asyncHandler = require('express-async-handler');
const logger = require('../utils/logger');
const axios = require('axios');
const mongoose = require('mongoose');

// Reed.co.uk API configuration
const REED_API_BASE = 'https://www.reed.co.uk/api/1.0';
const REED_API_KEY = process.env.REED_API_KEY;

// @desc    Search for jobs using Reed API only
// @route   GET /api/job-finder/search
// @access  Public (with rate limiting)
const searchJobs = asyncHandler(async (req, res) => {
  const {
    keywords = '',
    location = '',
    distance = 25,
    permanent = true,
    contract = true,
    temp = true,
    partTime = true,
    fullTime = true,
    minimumSalary = 0,
    maximumSalary = 0,
    postedDays = 30,
    page = 1,
    limit = 20
  } = req.query;

  logger.info(`Job search request: ${keywords} in ${location}`);

  // Check if Reed API key is configured
  if (!REED_API_KEY) {
    logger.error('Reed API key not configured');
    return res.status(503).json({
      success: false,
      error: 'Job search service is not configured. Please contact support.',
      code: 'SERVICE_UNAVAILABLE'
    });
  }

  try {
    // Search using Reed API
    const reedResults = await searchReedJobs({
      keywords,
      location,
      distance,
      permanent,
      contract,
      temp,
      partTime,
      fullTime,
      minimumSalary,
      maximumSalary,
      page,
      limit
    });

    const jobs = reedResults.jobs || [];
    const totalResults = reedResults.totalResults || 0;

    logger.info(`Reed API returned ${jobs.length} jobs out of ${totalResults} total`);

    // Calculate pagination
    const totalPages = Math.ceil(totalResults / limit);
    const hasNextPage = page < totalPages;
    const hasPreviousPage = page > 1;

    // Return successful response
    res.status(200).json({
      success: true,
      data: {
        jobs,
        pagination: {
          currentPage: parseInt(page),
          totalPages,
          totalResults,
          limit: parseInt(limit),
          hasNextPage,
          hasPreviousPage
        },
        source: 'reed',
        searchParams: {
          keywords,
          location,
          distance,
          filters: {
            permanent,
            contract,
            temp,
            partTime,
            fullTime,
            minimumSalary,
            maximumSalary,
            postedDays
          }
        }
      }
    });

  } catch (error) {
    logger.error(`Reed API search failed: ${error.message}`);
    
    // Handle specific error types
    if (error.response?.status === 503) {
      return res.status(503).json({
        success: false,
        error: 'Job search service is temporarily unavailable. Please try again later.',
        code: 'SERVICE_UNAVAILABLE'
      });
    } else if (error.response?.status === 429) {
      return res.status(429).json({
        success: false,
        error: 'Too many search requests. Please wait a moment and try again.',
        code: 'RATE_LIMITED'
      });
    } else if (error.response?.status === 401) {
      return res.status(503).json({
        success: false,
        error: 'Job search service authentication failed. Please contact support.',
        code: 'AUTH_FAILED'
      });
    } else if (error.code === 'ECONNREFUSED' || error.code === 'ENOTFOUND') {
      return res.status(503).json({
        success: false,
        error: 'Cannot connect to job search service. Please try again later.',
        code: 'CONNECTION_FAILED'
      });
    }

    // Generic error response
    res.status(500).json({
      success: false,
      error: 'Job search failed. Please try again.',
      code: 'SEARCH_FAILED'
    });
  }
});

// Reed API integration function with CORRECT parameters
const searchReedJobs = async (params) => {
  const {
    keywords,
    location,
    distance,
    permanent,
    contract,
    temp,
    partTime,
    fullTime,
    minimumSalary,
    maximumSalary,
    page,
    limit
  } = params;

  // Build Reed API parameters with CORRECT parameter names
  const reedParams = new URLSearchParams();
  
  // Keywords search
  if (keywords && keywords.trim()) {
    reedParams.append('keywords', keywords.trim());
  }
  
  // Location search - use correct parameter name
  if (location && location.trim()) {
    reedParams.append('locationName', location.trim());
  }
  
  // Distance from location - use correct parameter name and only if location is provided
  if (distance && location && location.trim()) {
    reedParams.append('distanceFromLocation', distance.toString());
  }
  
  // Salary filters
  if (minimumSalary && minimumSalary > 0) {
    reedParams.append('minimumSalary', minimumSalary.toString());
  }
  if (maximumSalary && maximumSalary > 0) {
    reedParams.append('maximumSalary', maximumSalary.toString());
  }
  
  // Job type filters - Reed expects explicit true/false values
  // Only send parameters that are explicitly set to true
  if (permanent === true) {
    reedParams.append('permanent', 'true');
  } else if (permanent === false) {
    reedParams.append('permanent', 'false');
  }
  
  if (contract === true) {
    reedParams.append('contract', 'true');
  } else if (contract === false) {
    reedParams.append('contract', 'false');
  }
  
  if (temp === true) {
    reedParams.append('temp', 'true');
  } else if (temp === false) {
    reedParams.append('temp', 'false');
  }
  
  if (partTime === true) {
    reedParams.append('partTime', 'true');
  } else if (partTime === false) {
    reedParams.append('partTime', 'false');
  }
  
  if (fullTime === true) {
    reedParams.append('fullTime', 'true');
  } else if (fullTime === false) {
    reedParams.append('fullTime', 'false');
  }
  
  // Pagination parameters
  reedParams.append('resultsToTake', Math.min(parseInt(limit) || 20, 100).toString()); // Reed max is 100
  reedParams.append('resultsToSkip', (((parseInt(page) || 1) - 1) * (parseInt(limit) || 20)).toString());

  logger.info(`Calling Reed API with corrected params: ${reedParams.toString()}`);

  try {
    const response = await axios.get(`${REED_API_BASE}/search`, {
      params: reedParams,
      auth: {
        username: REED_API_KEY,
        password: ''
      },
      headers: {
        'User-Agent': 'JobTracker/1.0',
        'Accept': 'application/json'
      },
      timeout: 15000 // 15 second timeout
    });

    // Validate response
    if (!response.data) {
      throw new Error('No data received from Reed API');
    }

    // Extract results
    const results = response.data.results || [];
    const totalResults = response.data.totalResults || 0;

    logger.info(`Reed API response: ${results.length} jobs, ${totalResults} total results`);

    // Log first few job locations for debugging
    if (results.length > 0) {
      const locations = results.slice(0, 3).map(job => job.locationName).join(', ');
      logger.info(`Sample job locations: ${locations}`);
    }

    // Standardize job format
    const jobs = results.map(job => standardizeReedJob(job));

    return { 
      jobs, 
      totalResults 
    };

  } catch (error) {
    logger.error(`Reed API call failed: ${error.message}`);
    
    // Log the actual URL being called for debugging
    const debugUrl = `${REED_API_BASE}/search?${reedParams.toString()}`;
    logger.error(`Failed URL: ${debugUrl}`);
    
    // Re-throw with more context
    if (error.response) {
      // HTTP error response
      const status = error.response.status;
      const statusText = error.response.statusText;
      const responseData = error.response.data;
      
      logger.error(`Reed API HTTP ${status}: ${statusText}`, { responseData });
      throw new Error(`Reed API returned ${status} ${statusText}: ${responseData?.message || 'Unknown error'}`);
    } else if (error.request) {
      // Network error
      logger.error('Reed API network error:', error.code);
      throw new Error('Network error: Unable to reach Reed API');
    } else {
      // Other error
      throw new Error(`Reed API error: ${error.message}`);
    }
  }
};

// Standardize Reed job format
const standardizeReedJob = (job) => {
  return {
    id: `reed_${job.jobId}`,
    externalId: job.jobId.toString(),
    source: 'reed',
    title: job.jobTitle || 'Untitled Position',
    company: job.employerName || 'Unknown Company',
    location: {
      display: job.locationName || 'Location not specified',
      coordinates: job.latitude && job.longitude ? {
        lat: parseFloat(job.latitude),
        lng: parseFloat(job.longitude)
      } : null
    },
    salary: parseSalary(job.minimumSalary, job.maximumSalary, 'GBP', 'annual'),
    jobType: parseJobType(job.jobType),
    workType: 'onsite', // Reed doesn't specify, default to onsite
    description: job.jobDescription || 'No description available',
    applicationUrl: job.jobUrl || '',
    companyUrl: job.employerProfileUrl || null,
    logoUrl: job.employerLogoUrl || null,
    postedDate: job.date ? new Date(job.date) : new Date(),
    expirationDate: job.expirationDate ? new Date(job.expirationDate) : null
  };
};

// Helper function to parse salary information
const parseSalary = (min, max, currency = 'GBP', period = 'annual') => {
  const result = {
    currency,
    period
  };

  if (min && min > 0) result.min = parseFloat(min);
  if (max && max > 0) result.max = parseFloat(max);

  // Generate display string
  if (result.min && result.max) {
    result.display = `£${result.min.toLocaleString()} - £${result.max.toLocaleString()} ${period}`;
  } else if (result.min) {
    result.display = `From £${result.min.toLocaleString()} ${period}`;
  } else if (result.max) {
    result.display = `Up to £${result.max.toLocaleString()} ${period}`;
  }

  return result;
};

// Helper function to parse job type
const parseJobType = (type) => {
  if (!type) return 'permanent';
  
  const lowerType = type.toLowerCase();
  
  if (lowerType.includes('contract')) return 'contract';
  if (lowerType.includes('temp')) return 'temporary';
  if (lowerType.includes('part')) return 'part-time';
  if (lowerType.includes('full')) return 'full-time';
  if (lowerType.includes('intern')) return 'internship';
  
  return 'permanent';
};

// @desc    Save a job for later
// @route   POST /api/job-finder/saved
// @access  Private
const saveJob = asyncHandler(async (req, res) => {
  const {
    externalId,
    source,
    title,
    company,
    location,
    salary,
    jobType,
    workType,
    description,
    applicationUrl,
    companyUrl,
    logoUrl,
    postedDate,
    expirationDate,
    tags,
    notes
  } = req.body;

  // Validate required fields
  if (!externalId || !source || !title || !company || !applicationUrl) {
    return res.status(400).json({
      success: false,
      error: 'Missing required fields: externalId, source, title, company, applicationUrl'
    });
  }

  // Check if user can save more jobs
  const user = await User.findById(req.user.id);
  const canSave = await SavedJob.canUserSaveMore(req.user.id, user.subscriptionTier);
  
  if (!canSave) {
    const currentCount = await SavedJob.getUserSavedCount(req.user.id);
    const limit = user.subscriptionTier === 'free' ? 5 : 'unlimited';
    
    return res.status(403).json({
      success: false,
      error: `You have reached your saved jobs limit (${currentCount}/${limit}). Upgrade to save more jobs.`,
      code: 'LIMIT_EXCEEDED',
      currentCount,
      limit: user.subscriptionTier === 'free' ? 5 : null,
      upgradeUrl: '/settings/subscription'
    });
  }

  // Check if job already saved
  const existingSavedJob = await SavedJob.findOne({
    user: req.user.id,
    source,
    externalId
  });

  if (existingSavedJob) {
    return res.status(409).json({
      success: false,
      error: 'Job already saved',
      data: existingSavedJob
    });
  }

  try {
    const savedJob = await SavedJob.create({
      user: req.user.id,
      externalId,
      source,
      title,
      company,
      location,
      salary,
      jobType,
      workType,
      description,
      applicationUrl,
      companyUrl,
      logoUrl,
      postedDate: postedDate ? new Date(postedDate) : new Date(),
      expirationDate: expirationDate ? new Date(expirationDate) : null,
      tags: tags || [],
      notes: notes || '',
      originalData: req.body // Store original for debugging
    });

    logger.info(`Job saved: ${title} at ${company} by user ${req.user.id}`);

    res.status(201).json({
      success: true,
      data: savedJob,
      message: 'Job saved successfully'
    });
  } catch (error) {
    logger.error(`Error saving job: ${error.message}`);
    
    if (error.name === 'ValidationError') {
      const messages = Object.values(error.errors).map(val => val.message);
      return res.status(400).json({
        success: false,
        error: messages.join(', ')
      });
    }
    
    res.status(500).json({
      success: false,
      error: 'Failed to save job'
    });
  }
});

// @desc    Get user's saved jobs
// @route   GET /api/job-finder/saved
// @access  Private
const getSavedJobs = asyncHandler(async (req, res) => {
  const {
    page = 1,
    limit = 20,
    sortBy = 'savedAt',
    sortOrder = 'desc',
    source,
    jobType,
    location,
    tags
  } = req.query;

  // Build filter query
  const filter = { user: req.user.id };
  
  if (source) filter.source = source;
  if (jobType) filter.jobType = jobType;
  if (location) {
    filter['location.display'] = new RegExp(location, 'i');
  }
  if (tags) {
    const tagArray = Array.isArray(tags) ? tags : [tags];
    filter.tags = { $in: tagArray };
  }

  // Build sort object
  const sort = {};
  sort[sortBy] = sortOrder === 'desc' ? -1 : 1;

  try {
    const savedJobs = await SavedJob.find(filter)
      .sort(sort)
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .exec();

    const totalCount = await SavedJob.countDocuments(filter);
    const totalPages = Math.ceil(totalCount / limit);

    // Get user's subscription info for limits
    const user = await User.findById(req.user.id);
    const usageInfo = {
      used: await SavedJob.getUserSavedCount(req.user.id),
      limit: user.subscriptionTier === 'free' ? 5 : null,
      tier: user.subscriptionTier
    };

    res.status(200).json({
      success: true,
      data: {
        jobs: savedJobs,
        pagination: {
          currentPage: parseInt(page),
          totalPages,
          totalCount,
          limit: parseInt(limit),
          hasNextPage: page < totalPages,
          hasPreviousPage: page > 1
        },
        usage: usageInfo,
        filters: {
          source,
          jobType,
          location,
          tags
        }
      }
    });
  } catch (error) {
    logger.error(`Error fetching saved jobs: ${error.message}`);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch saved jobs'
    });
  }
});

// @desc    Remove a saved job
// @route   DELETE /api/job-finder/saved/:id
// @access  Private
const removeSavedJob = asyncHandler(async (req, res) => {
  const savedJob = await SavedJob.findOne({
    _id: req.params.id,
    user: req.user.id
  });

  if (!savedJob) {
    return res.status(404).json({
      success: false,
      error: 'Saved job not found'
    });
  }

  await savedJob.remove();

  logger.info(`Saved job removed: ${savedJob.title} by user ${req.user.id}`);

  res.status(200).json({
    success: true,
    message: 'Saved job removed successfully'
  });
});

// @desc    Import saved job to job tracker
// @route   POST /api/job-finder/import/:savedJobId
// @access  Private
const importJobToTracker = asyncHandler(async (req, res) => {
  const savedJob = await SavedJob.findOne({
    _id: req.params.savedJobId,
    user: req.user.id
  });

  if (!savedJob) {
    return res.status(404).json({
      success: false,
      error: 'Saved job not found'
    });
  }

  if (savedJob.importedToTracker) {
    return res.status(409).json({
      success: false,
      error: 'Job already imported to tracker',
      data: { importedJobId: savedJob.importedJobId }
    });
  }

  // Check user's subscription tier for import feature
  const user = await User.findById(req.user.id);
  if (user.subscriptionTier === 'free') {
    return res.status(403).json({
      success: false,
      error: 'Job import is a Plus feature. Upgrade to import jobs to your tracker.',
      code: 'FEATURE_RESTRICTED',
      requiredTier: 'plus',
      userTier: user.subscriptionTier,
      upgradeUrl: '/settings/subscription'
    });
  }

  try {
    // Create new Job entry
    const jobData = {
      user: req.user.id,
      company: savedJob.company,
      position: savedJob.title,
      location: savedJob.location.display,
      applicationUrl: savedJob.applicationUrl,
      status: 'Saved', // Default status for imported jobs
      salary: savedJob.salary?.display || '',
      jobType: savedJob.jobType,
      workType: savedJob.workType,
      description: savedJob.description,
      notes: `Imported from ${savedJob.source}${savedJob.notes ? `\n\nOriginal notes: ${savedJob.notes}` : ''}`,
      tags: savedJob.tags,
      source: savedJob.source,
      externalId: savedJob.externalId,
      externalUrl: savedJob.applicationUrl,
      importedAt: new Date(),
      importedFromSaved: savedJob._id
    };

    const newJob = await Job.create(jobData);

    // Update saved job to mark as imported
    savedJob.importedToTracker = true;
    savedJob.importedJobId = newJob._id;
    savedJob.importedAt = new Date();
    await savedJob.save();

    logger.info(`Job imported to tracker: ${savedJob.title} by user ${req.user.id}`);

    res.status(201).json({
      success: true,
      data: {
        job: newJob,
        savedJob: savedJob
      },
      message: 'Job imported to tracker successfully'
    });
  } catch (error) {
    logger.error(`Error importing job to tracker: ${error.message}`);
    
    if (error.name === 'ValidationError') {
      const messages = Object.values(error.errors).map(val => val.message);
      return res.status(400).json({
        success: false,
        error: `Failed to import job: ${messages.join(', ')}`
      });
    }
    
    res.status(500).json({
      success: false,
      error: 'Failed to import job to tracker'
    });
  }
});

// @desc    Get job finder statistics
// @route   GET /api/job-finder/stats
// @access  Private
const getJobFinderStats = asyncHandler(async (req, res) => {
  try {
    const userId = req.user.id;
    
    // Get saved jobs stats
    const totalSaved = await SavedJob.countDocuments({ user: userId });
    
    // Get saved jobs by source
    const savedBySource = await SavedJob.aggregate([
      { $match: { user: new mongoose.Types.ObjectId(userId) } },
      { $group: { _id: '$source', count: { $sum: 1 } } }
    ]);
    
    // Get imported jobs count
    const importedCount = await SavedJob.countDocuments({ 
      user: userId, 
      importedToTracker: true 
    });
    
    // Get recent saved jobs (last 30 days)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    
    const recentSaved = await SavedJob.countDocuments({
      user: userId,
      savedAt: { $gte: thirtyDaysAgo }
    });
    
    // Get jobs by job type
    const jobsByType = await SavedJob.aggregate([
      { $match: { user: new mongoose.Types.ObjectId(userId) } },
      { $group: { _id: '$jobType', count: { $sum: 1 } } }
    ]);
    
    // Get average salary range (if available)
    const salaryStats = await SavedJob.aggregate([
      { 
        $match: { 
          user: new mongoose.Types.ObjectId(userId),
          'salary.min': { $exists: true, $gt: 0 }
        }
      },
      {
        $group: {
          _id: null,
          avgMin: { $avg: '$salary.min' },
          avgMax: { $avg: '$salary.max' },
          minSalary: { $min: '$salary.min' },
          maxSalary: { $max: '$salary.max' },
          count: { $sum: 1 }
        }
      }
    ]);
    
    // Get user subscription info
    const user = await User.findById(userId);
    const limit = user.subscriptionTier === 'free' ? 5 : null;
    
    // Format source breakdown
    const sourceBreakdown = savedBySource.reduce((acc, item) => {
      acc[item._id] = item.count;
      return acc;
    }, {});
    
    // Format job type breakdown
    const typeBreakdown = jobsByType.reduce((acc, item) => {
      acc[item._id] = item.count;
      return acc;
    }, {});
    
    res.status(200).json({
      success: true,
      data: {
        overview: {
          totalSaved,
          importedCount,
          recentSaved,
          importRate: totalSaved > 0 ? Math.round((importedCount / totalSaved) * 100) : 0
        },
        breakdown: {
          bySource: sourceBreakdown,
          byJobType: typeBreakdown
        },
        salary: salaryStats.length > 0 ? {
          averageMin: Math.round(salaryStats[0].avgMin || 0),
          averageMax: Math.round(salaryStats[0].avgMax || 0),
          range: {
            min: salaryStats[0].minSalary || 0,
            max: salaryStats[0].maxSalary || 0
          },
          jobsWithSalary: salaryStats[0].count || 0
        } : null,
        usage: {
          used: totalSaved,
          limit,
          tier: user.subscriptionTier,
          canSaveMore: await SavedJob.canUserSaveMore(userId, user.subscriptionTier),
          percentage: limit ? Math.round((totalSaved / limit) * 100) : 0
        },
        lastUpdated: new Date().toISOString()
      }
    });
  } catch (error) {
    logger.error(`Error fetching job finder stats: ${error.message}`);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch statistics'
    });
  }
});

module.exports = {
  searchJobs,
  saveJob,
  getSavedJobs,
  removeSavedJob,
  importJobToTracker,
  getJobFinderStats
};