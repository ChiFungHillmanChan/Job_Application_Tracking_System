// src/lib/jobService.js - Fixed existing file
import api from './api';

const jobService = {
  /**
   * Get all jobs for the current authenticated user with optional filters
   */
  getAllJobs: async (filters = {}) => {
    try {
      console.log('Fetching jobs from API with filters:', filters);
      
      // Build query string from filters
      const queryParams = new URLSearchParams();
      
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined && value !== null && value !== '') {
          queryParams.append(key, value);
        }
      });
      
      const queryString = queryParams.toString();
      const url = queryString ? `/jobs?${queryString}` : '/jobs';
      
      const response = await api.get(url);
      
      if (!response) {
        console.warn('API response is undefined, returning empty data');
        return { success: true, data: [], count: 0 };
      }
      
      if (!response.data) {
        console.warn('API response.data is undefined, returning empty data');
        return { success: true, data: [], count: 0 };
      }
      
      console.log('Jobs API response:', response.data);
      
      // Handle different response formats
      if (response.data.success !== undefined) {
        return response.data;
      } else if (Array.isArray(response.data)) {
        return {
          success: true,
          data: response.data,
          count: response.data.length
        };
      } else {
        return {
          success: true,
          data: response.data.data || response.data || [],
          count: (response.data.data || response.data || []).length
        };
      }
    } catch (error) {
      console.error('Error fetching jobs:', error);
      // Return error object instead of empty data to handle properly
      return { 
        success: false, 
        error: error.response?.data?.error || error.message || 'Failed to fetch jobs',
        data: [], 
        count: 0 
      };
    }
  },

  /**
   * Get a single job by ID
   */
  getJob: async (jobId) => {
    try {
      console.log('Fetching job:', jobId);
      const response = await api.get(`/jobs/${jobId}`);
      
      if (!response || !response.data) {
        throw new Error('Invalid response from server');
      }
      
      return response.data;
    } catch (error) {
      console.error(`Error fetching job ${jobId}:`, error);
      throw error;
    }
  },

  /**
   * Create a new job
   */
  createJob: async (jobData) => {
    try {
      console.log('Creating job:', jobData);
      
      // Validate required fields
      const requiredFields = ['company', 'position', 'location', 'status'];
      const missingFields = requiredFields.filter(field => !jobData[field]);
      
      if (missingFields.length > 0) {
        throw new Error(`Missing required fields: ${missingFields.join(', ')}`);
      }
      
      const response = await api.post('/jobs', jobData);
      
      if (!response || !response.data) {
        throw new Error('Invalid response from server');
      }
      
      console.log('Job created successfully:', response.data);
      return response.data;
    } catch (error) {
      console.error('Error creating job:', error);
      throw error;
    }
  },

  /**
   * Update an existing job
   */
  updateJob: async (jobId, jobData) => {
    try {
      console.log('Updating job:', jobId, jobData);
      const response = await api.put(`/jobs/${jobId}`, jobData);
      
      if (!response || !response.data) {
        throw new Error('Invalid response from server');
      }
      
      console.log('Job updated successfully:', response.data);
      return response.data;
    } catch (error) {
      console.error(`Error updating job ${jobId}:`, error);
      throw error;
    }
  },

  /**
   * Delete a job
   */
  deleteJob: async (jobId) => {
    try {
      console.log('Deleting job:', jobId);
      const response = await api.delete(`/jobs/${jobId}`);
      
      if (!response || !response.data) {
        throw new Error('Invalid response from server');
      }
      
      console.log('Job deleted successfully');
      return response.data;
    } catch (error) {
      console.error(`Error deleting job ${jobId}:`, error);
      throw error;
    }
  },

  /**
   * Get job statistics for the current user
   */
  getJobStats: async () => {
    try {
      console.log('Fetching job statistics');
      const response = await api.get('/jobs/stats');
      
      if (!response || !response.data) {
        console.warn('Stats API response is invalid, returning default stats');
        return {
          success: true,
          data: {
            total: 0,
            'Saved': 0,
            'Applied': 0,
            'Phone Screen': 0,
            'Interview': 0,
            'Technical Assessment': 0,
            'Offer': 0,
            'Rejected': 0,
            'Withdrawn': 0
          }
        };
      }
      
      return response.data;
    } catch (error) {
      console.error('Error fetching job statistics:', error);
      // Return default stats on error
      return {
        success: false,
        error: error.message,
        data: {
          total: 0,
          'Saved': 0,
          'Applied': 0,
          'Phone Screen': 0,
          'Interview': 0,
          'Technical Assessment': 0,
          'Offer': 0,
          'Rejected': 0,
          'Withdrawn': 0
        }
      };
    }
  },

  /**
   * Get recent job activity
   */
  getRecentActivity: async (limit = 10) => {
    try {
      console.log('Fetching recent activity, limit:', limit);
      const response = await api.get(`/jobs/recent?limit=${limit}`);
      
      if (!response || !response.data) {
        console.warn('Recent activity API response is invalid, returning empty array');
        return { success: true, data: [], count: 0 };
      }
      
      return response.data;
    } catch (error) {
      console.error('Error fetching recent activity:', error);
      return { 
        success: false, 
        error: error.message,
        data: [], 
        count: 0 
      };
    }
  }
};

export default jobService;