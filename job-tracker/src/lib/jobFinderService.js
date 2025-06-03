import api from './api';

class JobFinderService {
  constructor() {
    this.cache = new Map();
    this.cacheTimeout = 5 * 60 * 1000; // 5 minutes
  }

  // Generate cache key for search parameters
  generateCacheKey(params) {
    const normalizedParams = {
      ...params,
      page: params.page || 1,
      limit: params.limit || 20
    };
    return JSON.stringify(normalizedParams);
  }

  // Check if cached data is still valid
  isCacheValid(cacheEntry) {
    return Date.now() - cacheEntry.timestamp < this.cacheTimeout;
  }

  // Search for jobs with caching
  async searchJobs(searchParams = {}) {
    const cacheKey = this.generateCacheKey(searchParams);
    
    // Check cache first
    if (this.cache.has(cacheKey)) {
      const cached = this.cache.get(cacheKey);
      if (this.isCacheValid(cached)) {
        console.log('🎯 Returning cached job search results');
        return cached.data;
      } else {
        // Remove expired cache entry
        this.cache.delete(cacheKey);
      }
    }

    try {
      console.log('🔍 Searching jobs with params:', searchParams);
      
      const response = await api.get('/job-finder/search', {
        params: searchParams
      });

      if (response.data && response.data.success) {
        // Cache the results
        this.cache.set(cacheKey, {
          data: response.data,
          timestamp: Date.now()
        });

        // Clean up old cache entries (keep only last 20)
        if (this.cache.size > 20) {
          const oldestKey = this.cache.keys().next().value;
          this.cache.delete(oldestKey);
        }

        return response.data;
      } else {
        throw new Error('Invalid response from job search API');
      }
    } catch (error) {
      console.error('Job search failed:', error);
      
      if (error.response?.status === 503) {
        throw new Error('Job search services are temporarily unavailable. Please try again later.');
      } else if (error.response?.status === 429) {
        throw new Error('Too many search requests. Please wait a moment and try again.');
      } else if (error.message?.includes('Network Error') || error.code === 'ERR_NETWORK') {
        throw new Error('Cannot connect to job search service. Please check your connection or try again later.');
      } else if (error.code === 'ERR_CONNECTION_REFUSED') {
        throw new Error('Job search service is currently unavailable. Please try again later.');
      }
      
      throw new Error(error.response?.data?.error || 'Failed to search jobs. Please try again.');
    }
  }

  // Save a job
  async saveJob(jobData) {
    try {
      console.log('💾 Saving job:', jobData.title);
      
      const response = await api.post('/job-finder/saved', jobData);
      
      if (response.data && response.data.success) {
        return response.data;
      } else {
        throw new Error('Invalid response from save job API');
      }
    } catch (error) {
      console.error('Save job failed:', error);
      
      if (error.response?.status === 403) {
        const errorData = error.response.data;
        if (errorData.code === 'LIMIT_EXCEEDED') {
          throw new Error(`You've reached your limit of ${errorData.currentCount} saved jobs. Upgrade to save more.`);
        }
        throw new Error(errorData.error || 'You do not have permission to save jobs.');
      } else if (error.response?.status === 409) {
        throw new Error('This job is already saved.');
      } else if (error.response?.status === 429) {
        throw new Error('Too many save requests. Please slow down.');
      }
      
      throw new Error(error.response?.data?.error || 'Failed to save job. Please try again.');
    }
  }

  // Get saved jobs
  async getSavedJobs(params = {}) {
    try {
      console.log('📋 Fetching saved jobs with params:', params);
      
      const response = await api.get('/job-finder/saved', {
        params
      });
      
      if (response.data && response.data.success) {
        return response.data;
      } else {
        throw new Error('Invalid response from saved jobs API');
      }
    } catch (error) {
      console.error('Get saved jobs failed:', error);
      throw new Error(error.response?.data?.error || 'Failed to fetch saved jobs. Please try again.');
    }
  }

  // Remove a saved job
  async removeSavedJob(jobId) {
    try {
      console.log('🗑️ Removing saved job:', jobId);
      
      const response = await api.delete(`/job-finder/saved/${jobId}`);
      
      if (response.data && response.data.success) {
        return response.data;
      } else {
        throw new Error('Invalid response from remove job API');
      }
    } catch (error) {
      console.error('Remove saved job failed:', error);
      
      if (error.response?.status === 404) {
        throw new Error('Saved job not found.');
      }
      
      throw new Error(error.response?.data?.error || 'Failed to remove saved job. Please try again.');
    }
  }

  // Import job to tracker
  async importJobToTracker(savedJobId) {
    try {
      console.log('📥 Importing job to tracker:', savedJobId);
      
      const response = await api.post(`/job-finder/import/${savedJobId}`);
      
      if (response.data && response.data.success) {
        return response.data;
      } else {
        throw new Error('Invalid response from import job API');
      }
    } catch (error) {
      console.error('Import job failed:', error);
      
      if (error.response?.status === 403) {
        const errorData = error.response.data;
        if (errorData.code === 'FEATURE_RESTRICTED') {
          throw new Error(`Job import is a ${errorData.requiredTier} feature. Upgrade to import jobs.`);
        }
        throw new Error(errorData.error || 'You do not have permission to import jobs.');
      } else if (error.response?.status === 404) {
        throw new Error('Saved job not found.');
      } else if (error.response?.status === 409) {
        throw new Error('This job has already been imported to your tracker.');
      }
      
      throw new Error(error.response?.data?.error || 'Failed to import job. Please try again.');
    }
  }

  // Get job finder statistics
  async getStats() {
    try {
      console.log('📊 Fetching job finder stats');
      
      const response = await api.get('/job-finder/stats');
      
      if (response.data && response.data.success) {
        return response.data;
      } else {
        throw new Error('Invalid response from stats API');
      }
    } catch (error) {
      console.error('Get stats failed:', error);
      throw new Error(error.response?.data?.error || 'Failed to fetch statistics. Please try again.');
    }
  }

  // Clear search cache
  clearCache() {
    this.cache.clear();
    console.log('🧹 Job search cache cleared');
  }

  // Get cache info for debugging
  getCacheInfo() {
    return {
      size: this.cache.size,
      keys: Array.from(this.cache.keys()),
      timeout: this.cacheTimeout
    };
  }

  // Utility: Format salary for display
  formatSalary(salary) {
    if (!salary || (!salary.min && !salary.max && !salary.display)) {
      return 'Salary not specified';
    }

    if (salary.display) {
      return salary.display;
    }

    const currency = salary.currency === 'GBP' ? '£' : `${salary.currency} `;
    const period = salary.period || 'annual';

    if (salary.min && salary.max) {
      return `${currency}${salary.min.toLocaleString()} - ${currency}${salary.max.toLocaleString()} ${period}`;
    } else if (salary.min) {
      return `From ${currency}${salary.min.toLocaleString()} ${period}`;
    } else if (salary.max) {
      return `Up to ${currency}${salary.max.toLocaleString()} ${period}`;
    }

    return 'Competitive salary';
  }

  // Utility: Format distance
  formatDistance(meters) {
    if (!meters) return '';
    
    const miles = meters / 1609.34;
    if (miles < 1) {
      return 'Less than 1 mile';
    } else if (miles < 10) {
      return `${miles.toFixed(1)} miles`;
    } else {
      return `${Math.round(miles)} miles`;
    }
  }

  // Utility: Format job type for display
  formatJobType(type) {
    const typeMap = {
      'permanent': 'Permanent',
      'contract': 'Contract',
      'temporary': 'Temporary',
      'part-time': 'Part-time',
      'full-time': 'Full-time',
      'internship': 'Internship'
    };
    
    return typeMap[type] || type;
  }

  // Utility: Format work type for display
  formatWorkType(type) {
    const typeMap = {
      'onsite': 'On-site',
      'remote': 'Remote',
      'hybrid': 'Hybrid'
    };
    
    return typeMap[type] || type;
  }

  // Utility: Get job source badge info
  getSourceBadge(source) {
    const sourceMap = {
      'reed': {
        name: 'Reed',
        color: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300',
        url: 'https://www.reed.co.uk'
      },
      'adzuna': {
        name: 'Adzuna',
        color: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300',
        url: 'https://www.adzuna.co.uk'
      },
      'indeed': {
        name: 'Indeed',
        color: 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-300',
        url: 'https://www.indeed.co.uk'
      }
    };

    return sourceMap[source] || {
      name: source.charAt(0).toUpperCase() + source.slice(1),
      color: 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300',
      url: null
    };
  }

  // Utility: Extract skills/keywords from job description
  extractSkills(description) {
    if (!description) return [];

    const commonSkills = [
      'JavaScript', 'Python', 'Java', 'React', 'Node.js', 'SQL', 'AWS', 'Docker',
      'Kubernetes', 'Git', 'HTML', 'CSS', 'TypeScript', 'Angular', 'Vue.js',
      'Express', 'MongoDB', 'PostgreSQL', 'Redis', 'GraphQL', 'REST API',
      'Agile', 'Scrum', 'CI/CD', 'DevOps', 'Linux', 'Azure', 'GCP'
    ];

    const foundSkills = [];
    const lowerDescription = description.toLowerCase();

    commonSkills.forEach(skill => {
      if (lowerDescription.includes(skill.toLowerCase())) {
        foundSkills.push(skill);
      }
    });

    return foundSkills.slice(0, 10); // Limit to 10 skills
  }

  // Utility: Calculate job posting freshness
  getJobFreshness(postedDate) {
    if (!postedDate) return 'Unknown';

    const now = new Date();
    const posted = new Date(postedDate);
    const diffMs = now - posted;
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));

    if (diffDays === 0) {
      if (diffHours === 0) {
        return 'Just posted';
      } else if (diffHours === 1) {
        return '1 hour ago';
      } else {
        return `${diffHours} hours ago`;
      }
    } else if (diffDays === 1) {
      return 'Yesterday';
    } else if (diffDays < 7) {
      return `${diffDays} days ago`;
    } else if (diffDays < 30) {
      const weeks = Math.floor(diffDays / 7);
      return weeks === 1 ? '1 week ago' : `${weeks} weeks ago`;
    } else {
      const months = Math.floor(diffDays / 30);
      return months === 1 ? '1 month ago' : `${months} months ago`;
    }
  }
}

// Create and export singleton instance
const jobFinderService = new JobFinderService();
export default jobFinderService;