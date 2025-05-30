// src/lib/resumeService.js
import api from './api';

const resumeService = {
  /**
   * Get all resumes for the current authenticated user
   * @returns {Promise<Object>} Response containing success status and resumes data
   */
  getAllResumes: async () => {
    try {
      console.log('Fetching resumes from API...');
      const response = await api.get('/resumes');
      
      // Add defensive programming to handle different response formats
      if (!response) {
        console.warn('API response is undefined, returning empty data');
        return { success: true, data: [], count: 0 };
      }
      
      if (!response.data) {
        console.warn('API response.data is undefined, returning empty data');
        return { success: true, data: [], count: 0 };
      }
      
      console.log('Resume API response:', response.data);
      
      // Handle different response formats
      if (response.data.success !== undefined) {
        // Standard API response format
        return response.data;
      } else if (Array.isArray(response.data)) {
        // Direct array response
        return {
          success: true,
          data: response.data,
          count: response.data.length
        };
      } else {
        // Unknown format, wrap it
        return {
          success: true,
          data: response.data.data || response.data || [],
          count: (response.data.data || response.data || []).length
        };
      }
    } catch (error) {
      console.error('Error fetching resumes:', error);
      // Return empty array instead of throwing
      return { success: true, data: [], count: 0 };
    }
  },

  /**
   * Upload a new resume
   * @param {string} name - Name of the resume
   * @param {File} file - Resume file to upload
   * @param {string} version - Version number (defaults to '1.0')
   * @returns {Promise<Object>} Response containing success status and resume data
   */
  uploadResume: async (name, file, version = '1.0') => {
    try {
      const formData = new FormData();
      formData.append('name', name);
      formData.append('resumeFile', file);
      formData.append('version', version);

      const response = await api.post('/resumes', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      
      // Handle response format defensively
      if (!response || !response.data) {
        throw new Error('Invalid response from server');
      }
      
      return response.data;
    } catch (error) {
      console.error('Error uploading resume:', error);
      throw error;
    }
  },

  /**
   * Get a single resume by ID
   * @param {string} resumeId - ID of the resume to retrieve
   * @returns {Promise<Object>} Response containing success status and resume data
   */
  getResume: async (resumeId) => {
    try {
      const response = await api.get(`/resumes/${resumeId}`);
      
      if (!response || !response.data) {
        throw new Error('Invalid response from server');
      }
      
      return response.data;
    } catch (error) {
      console.error(`Error fetching resume ${resumeId}:`, error);
      throw error;
    }
  },

  /**
   * Set a resume as the default resume
   * @param {string} resumeId - ID of the resume to set as default
   * @returns {Promise<Object>} Response containing success status and updated resume data
   */
  setDefaultResume: async (resumeId) => {
    try {
      const response = await api.put(`/resumes/${resumeId}/default`);
      
      if (!response || !response.data) {
        throw new Error('Invalid response from server');
      }
      
      return response.data;
    } catch (error) {
      console.error(`Error setting resume ${resumeId} as default:`, error);
      throw error;
    }
  },

  /**
   * Get the download URL for a resume
   * @param {string} resumeId - ID of the resume to download
   * @returns {string} URL for downloading the resume
   */
  getDownloadUrl: (resumeId) => {
    return `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api'}/resumes/${resumeId}/download`;
  },

  /**
   * Get the preview URL for a resume
   * @param {string} resumeId - ID of the resume to preview
   * @returns {string} URL for previewing the resume
   */
  getPreviewUrl: (resumeId) => {
    return `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api'}/resumes/${resumeId}/preview`;
  },

  /**
   * Delete a resume
   * @param {string} resumeId - ID of the resume to delete
   * @returns {Promise<Object>} Response containing success status
   */
  deleteResume: async (resumeId) => {
    try {
      const response = await api.delete(`/resumes/${resumeId}`);
      
      if (!response || !response.data) {
        throw new Error('Invalid response from server');
      }
      
      return response.data;
    } catch (error) {
      console.error(`Error deleting resume ${resumeId}:`, error);
      throw error;
    }
  }
};

export default resumeService;