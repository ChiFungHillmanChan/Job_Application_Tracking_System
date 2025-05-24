// src/lib/resumeService.js - Updated version
import api from './api';

const resumeService = {
  /**
   * Get all resumes for the current authenticated user
   */
  getAllResumes: async () => {
    try {
      console.log('Fetching resumes from API...');
      const response = await api.get('/resumes');
      
      if (!response) {
        console.warn('API response is undefined, returning empty data');
        return { success: true, data: [], count: 0 };
      }
      
      if (!response.data) {
        console.warn('API response.data is undefined, returning empty data');
        return { success: true, data: [], count: 0 };
      }
      
      console.log('Resume API response:', response.data);
      
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
      console.error('Error fetching resumes:', error);
      return { success: true, data: [], count: 0 };
    }
  },

  /**
   * Upload a new resume
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
   * Uses Next.js API route for proper authentication
   */
  getDownloadUrl: (resumeId) => {
    // Get token from localStorage for authentication
    let token = '';
    try {
      token = localStorage.getItem('token') || '';
    } catch (e) {
      console.warn('Could not access localStorage:', e);
    }
    
    // Use Next.js API route which handles authentication and proxies to backend
    const url = `/api/resumes/${resumeId}/download`;
    return token ? `${url}?token=${encodeURIComponent(token)}` : url;
  },

  /**
   * Get the preview URL for a resume
   * Uses Next.js API route for proper authentication
   */
  getPreviewUrl: (resumeId) => {
    // Get token from localStorage for authentication
    let token = '';
    try {
      token = localStorage.getItem('token') || '';
    } catch (e) {
      console.warn('Could not access localStorage:', e);
    }
    
    // Use Next.js API route which handles authentication and proxies to backend
    const url = `/api/resumes/${resumeId}/preview`;
    return token ? `${url}?token=${encodeURIComponent(token)}` : url;
  },

  /**
   * Delete a resume
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
  },

  /**
   * Check if a resume file exists and is accessible
   */
  checkResumeAccess: async (resumeId) => {
    try {
      // Get token from localStorage
      let token = '';
      try {
        token = localStorage.getItem('token') || '';
      } catch (e) {
        console.warn('Could not access localStorage:', e);
        return false;
      }

      const url = `/api/resumes/${resumeId}/preview${token ? `?token=${encodeURIComponent(token)}` : ''}`;
      
      const response = await fetch(url, {
        method: 'HEAD', // Only check headers, don't download content
        headers: {
          'Authorization': token ? `Bearer ${token}` : '',
        },
      });
      
      return response.ok;
    } catch (error) {
      console.error(`Error checking resume access ${resumeId}:`, error);
      return false;
    }
  }
};

export default resumeService;