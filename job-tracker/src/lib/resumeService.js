// src/lib/resumeService.js
import api from './api';

const resumeService = {
  getAllResumes: async () => {
    try {
      const response = await api.get('/resumes');
      return response.data;
    } catch (error) {
      console.error('Error fetching resumes:', error);
      throw error;
    }
  },

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
      return response.data;
    } catch (error) {
      console.error('Error uploading resume:', error);
      throw error;
    }
  },

  getResume: async (resumeId) => {
    try {
      const response = await api.get(`/resumes/${resumeId}`);
      return response.data;
    } catch (error) {
      console.error(`Error fetching resume ${resumeId}:`, error);
      throw error;
    }
  },

  setDefaultResume: async (resumeId) => {
    try {
      const response = await api.put(`/resumes/${resumeId}/default`);
      return response.data;
    } catch (error) {
      console.error(`Error setting resume ${resumeId} as default:`, error);
      throw error;
    }
  },
  getAllResumes: async () => {
    try {
        console.log('Fetching resumes from API...');
        const response = await api.get('/resumes');
        console.log('Resume API response:', response.data);
        return response.data;
    } catch (error) {
        console.error('Error fetching resumes:', error);
        // Return empty array instead of throwing
        return { success: true, data: [], count: 0 };
    }
    },

  getDownloadUrl: (resumeId) => {
    return `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api'}/resumes/${resumeId}/download`;
  },

  getPreviewUrl: (resumeId) => {
    return `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api'}/resumes/${resumeId}/preview`;
  },

  deleteResume: async (resumeId) => {
    try {
      const response = await api.delete(`/resumes/${resumeId}`);
      return response.data;
    } catch (error) {
      console.error(`Error deleting resume ${resumeId}:`, error);
      throw error;
    }
  }
};

export default resumeService;