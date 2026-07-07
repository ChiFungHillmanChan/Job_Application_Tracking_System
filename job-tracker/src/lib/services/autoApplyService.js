'use client';

import api from '@/lib/api';

export const autoApplyService = {
  // Profile
  async getProfile() {
    const response = await api.get('/profile');
    return response.data;
  },

  async analyzeCV(resumeId) {
    const response = await api.post('/profile/analyze', { resumeId });
    return response.data;
  },

  async updateProfile(profileData) {
    const response = await api.put('/profile', profileData);
    return response.data;
  },

  // Search Config
  async getSearchConfig() {
    const response = await api.get('/auto-apply/config');
    return response.data;
  },

  async updateSearchConfig(configData) {
    const response = await api.put('/auto-apply/config', configData);
    return response.data;
  },

  // Search Runs
  async triggerSearchRun() {
    const response = await api.post('/auto-apply/run');
    return response.data;
  },

  // Application Queue
  async getApplicationQueue(params = {}) {
    const response = await api.get('/auto-apply/queue', { params });
    return response.data;
  },

  async reviewApplication(id, action, data = {}) {
    const response = await api.put(`/auto-apply/queue/${id}/review`, { action, ...data });
    return response.data;
  },

  async bulkApproveApplications(applicationIds, minScore) {
    const response = await api.post('/auto-apply/queue/bulk-approve', { applicationIds, minScore });
    return response.data;
  },

  // History & Stats
  async getRunHistory(params = {}) {
    const response = await api.get('/auto-apply/history', { params });
    return response.data;
  },

  async getStats() {
    const response = await api.get('/auto-apply/stats');
    return response.data;
  },

  // AI Generation
  async generateAnswers(applicationId, questions) {
    const response = await api.post('/auto-apply/generate-answers', { applicationId, questions });
    return response.data;
  }
};

export default autoApplyService;
