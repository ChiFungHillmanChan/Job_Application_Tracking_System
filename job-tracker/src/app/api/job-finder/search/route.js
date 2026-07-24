// Port of backend/controllers/jobFinderController.js searchJobs + its
// inline Reed API integration (searchReedJobs/standardizeReedJob/
// parseSalary/parseJobType), kept as-is in this file since it is a
// self-contained, single-consumer implementation in the Express source too.
// @route   GET /api/job-finder/search
// @access  Private
//
// Deviation: the express-rate-limit `searchLimiter` middleware is dropped
// entirely (platform WAF handles rate limiting later) - no reimplementation.
//
// This endpoint was public in the Express source. It is now behind requireAuth:
// with no auth and no rate limit it was an open proxy onto our metered Reed API
// key, so any anonymous caller could exhaust the quota. Only the UI (which is
// itself behind auth) ever calls it, so gating it costs nothing.
import { NextResponse } from 'next/server';
import axios from 'axios';
import { withApi } from '@/server/http';
import { requireAuth } from '@/server/auth';
import logger from '@/server/logger';

// Reed.co.uk API configuration
const REED_API_BASE = 'https://www.reed.co.uk/api/1.0';
const REED_API_KEY = process.env.REED_API_KEY;

export const GET = withApi(async (request) => {
  await requireAuth(request);

  const query = Object.fromEntries(request.nextUrl.searchParams.entries());
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
    limit = 20,
  } = query;

  logger.info(`Job search request: ${keywords} in ${location}`);

  // Check if Reed API key is configured
  if (!REED_API_KEY) {
    logger.error('Reed API key not configured');
    return NextResponse.json(
      {
        success: false,
        error: 'Job search service is not configured. Please contact support.',
        code: 'SERVICE_UNAVAILABLE',
      },
      { status: 503 }
    );
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
      limit,
    });

    const jobs = reedResults.jobs || [];
    const totalResults = reedResults.totalResults || 0;

    logger.info(`Reed API returned ${jobs.length} jobs out of ${totalResults} total`);

    // Calculate pagination
    const totalPages = Math.ceil(totalResults / limit);
    const hasNextPage = page < totalPages;
    const hasPreviousPage = page > 1;

    // Return successful response
    return NextResponse.json(
      {
        success: true,
        data: {
          jobs,
          pagination: {
            currentPage: parseInt(page),
            totalPages,
            totalResults,
            limit: parseInt(limit),
            hasNextPage,
            hasPreviousPage,
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
              postedDays,
            },
          },
        },
      },
      { status: 200 }
    );
  } catch (error) {
    logger.error(`Reed API search failed: ${error.message}`);

    // Handle specific error types
    if (error.response?.status === 503) {
      return NextResponse.json(
        {
          success: false,
          error: 'Job search service is temporarily unavailable. Please try again later.',
          code: 'SERVICE_UNAVAILABLE',
        },
        { status: 503 }
      );
    } else if (error.response?.status === 429) {
      return NextResponse.json(
        {
          success: false,
          error: 'Too many search requests. Please wait a moment and try again.',
          code: 'RATE_LIMITED',
        },
        { status: 429 }
      );
    } else if (error.response?.status === 401) {
      return NextResponse.json(
        {
          success: false,
          error: 'Job search service authentication failed. Please contact support.',
          code: 'AUTH_FAILED',
        },
        { status: 503 }
      );
    } else if (error.code === 'ECONNREFUSED' || error.code === 'ENOTFOUND') {
      return NextResponse.json(
        {
          success: false,
          error: 'Cannot connect to job search service. Please try again later.',
          code: 'CONNECTION_FAILED',
        },
        { status: 503 }
      );
    }

    // Generic error response
    return NextResponse.json(
      {
        success: false,
        error: 'Job search failed. Please try again.',
        code: 'SEARCH_FAILED',
      },
      { status: 500 }
    );
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
    limit,
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
        password: '',
      },
      headers: {
        'User-Agent': 'JobTracker/1.0',
        Accept: 'application/json',
      },
      timeout: 15000, // 15 second timeout
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
      const locations = results.slice(0, 3).map((job) => job.locationName).join(', ');
      logger.info(`Sample job locations: ${locations}`);
    }

    // Standardize job format
    const jobs = results.map((job) => standardizeReedJob(job));

    return {
      jobs,
      totalResults,
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
      coordinates:
        job.latitude && job.longitude
          ? {
              lat: parseFloat(job.latitude),
              lng: parseFloat(job.longitude),
            }
          : null,
    },
    salary: parseSalary(job.minimumSalary, job.maximumSalary, 'GBP', 'annual'),
    jobType: parseJobType(job.jobType),
    workType: 'onsite', // Reed doesn't specify, default to onsite
    description: job.jobDescription || 'No description available',
    applicationUrl: job.jobUrl || '',
    companyUrl: job.employerProfileUrl || null,
    logoUrl: job.employerLogoUrl || null,
    postedDate: job.date ? new Date(job.date) : new Date(),
    expirationDate: job.expirationDate ? new Date(job.expirationDate) : null,
  };
};

// Helper function to parse salary information
const parseSalary = (min, max, currency = 'GBP', period = 'annual') => {
  const result = {
    currency,
    period,
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
