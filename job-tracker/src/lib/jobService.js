// src/lib/jobService.js
import api from './api';

const jobService = {
  /**
   * Get all jobs for the current authenticated user
   * @param {Object} filters - Filter options (status, jobType, search, sortBy, sortOrder)
   * @returns {Promise<Object>} Response containing success status and jobs data
   */
  getAllJobs: async (filters = {}) => {
    try {
      const queryParams = new URLSearchParams();
      
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined && value !== null && value !== '') {
          queryParams.append(key, value);
        }
      });
      
      const queryString = queryParams.toString();
      const url = `/jobs${queryString ? `?${queryString}` : ''}`;
      
      console.log('Fetching jobs from API with filters:', filters);
      const response = await api.get(url);
      console.log('Jobs API response:', response.data);
      return response.data;
    } catch (error) {
      console.error('Error fetching jobs:', error);
      // Return empty array instead of throwing for better UX
      return { success: true, data: [], count: 0 };
    }
  },

  /**
   * Get a single job by ID
   * @param {string} jobId - ID of the job to retrieve
   * @returns {Promise<Object>} Response containing success status and job data
   */
  getJob: async (jobId) => {
    try {
      const response = await api.get(`/jobs/${jobId}`);
      return response.data;
    } catch (error) {
      console.error(`Error fetching job ${jobId}:`, error);
      throw error;
    }
  },

  /**
   * Create a new job application
   * @param {Object} jobData - Job application data
   * @returns {Promise<Object>} Response containing success status and created job data
   */
  createJob: async (jobData) => {
    try {
      console.log('Creating job with data:', jobData);
      const response = await api.post('/jobs', jobData);
      console.log('Create job response:', response.data);
      return response.data;
    } catch (error) {
      console.error('Error creating job:', error);
      throw error;
    }
  },

  /**
   * Update an existing job application
   * @param {string} jobId - ID of the job to update
   * @param {Object} jobData - Updated job data
   * @returns {Promise<Object>} Response containing success status and updated job data
   */
  updateJob: async (jobId, jobData) => {
    try {
      const response = await api.put(`/jobs/${jobId}`, jobData);
      return response.data;
    } catch (error) {
      console.error(`Error updating job ${jobId}:`, error);
      throw error;
    }
  },

  /**
   * Delete a job application
   * @param {string} jobId - ID of the job to delete
   * @returns {Promise<Object>} Response containing success status
   */
  deleteJob: async (jobId) => {
    try {
      const response = await api.delete(`/jobs/${jobId}`);
      return response.data;
    } catch (error) {
      console.error(`Error deleting job ${jobId}:`, error);
      throw error;
    }
  },

  /**
   * Get job statistics for the current user
   * @returns {Promise<Object>} Response containing job statistics
   */
  getJobStats: async () => {
    try {
      console.log('Fetching job statistics...');
      const response = await api.get('/jobs/stats');
      console.log('Job stats response:', response.data);
      return response.data;
    } catch (error) {
      console.error('Error fetching job statistics:', error);
      // Return default stats instead of throwing
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
  },

  /**
   * Get recent job activity for the current user
   * @param {number} limit - Number of recent activities to fetch (default: 10)
   * @returns {Promise<Object>} Response containing recent activities
   */
  getRecentActivity: async (limit = 10) => {
    try {
      console.log('Fetching recent job activity...');
      const response = await api.get(`/jobs/recent?limit=${limit}`);
      console.log('Recent activity response:', response.data);
      return response.data;
    } catch (error) {
      console.error('Error fetching recent activity:', error);
      // Return empty activity instead of throwing
      return { success: true, data: [], count: 0 };
    }
  }
};

export default jobService;