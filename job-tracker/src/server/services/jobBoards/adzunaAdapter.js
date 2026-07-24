// ESM port of backend/services/jobBoards/adzunaAdapter.js
import BaseJobBoardAdapter from './baseAdapter';
import axios from 'axios';
import logger from '@/server/logger';

class AdzunaAdapter extends BaseJobBoardAdapter {
  constructor() {
    super('adzuna');
    this.apiBase = 'https://api.adzuna.com/v1/api/jobs';
  }

  isConfigured() {
    return !!(process.env.ADZUNA_APP_ID && process.env.ADZUNA_APP_KEY);
  }

  async search(query, location, filters = {}) {
    if (!this.isConfigured()) {
      throw new Error('Adzuna API credentials not configured');
    }

    const country = filters.country || 'gb';
    const page = filters.page || 1;
    const resultsPerPage = Math.min(filters.limit || 50, 50);

    const params = {
      app_id: process.env.ADZUNA_APP_ID,
      app_key: process.env.ADZUNA_APP_KEY,
      results_per_page: resultsPerPage,
      page
    };

    if (query) params.what = query;
    if (location) params.where = location;
    if (filters.distance) params.distance = filters.distance;
    if (filters.minimumSalary > 0) params.salary_min = filters.minimumSalary;
    if (filters.maximumSalary > 0) params.salary_max = filters.maximumSalary;

    if (filters.jobTypes?.length) {
      if (filters.jobTypes.includes('full-time')) params.full_time = 1;
      if (filters.jobTypes.includes('part-time')) params.part_time = 1;
      if (filters.jobTypes.includes('contract')) params.contract = 1;
      if (filters.jobTypes.includes('permanent')) params.permanent = 1;
    }

    params.sort_by = 'date';
    params.content_type = 'application/json';

    const response = await axios.get(`${this.apiBase}/${country}/search/${page}`, {
      params,
      headers: { 'User-Agent': 'JobTracker/2.0' },
      timeout: 15000
    });

    const results = response.data.results || [];
    const totalResults = response.data.count || 0;

    logger.info(`Adzuna: Found ${results.length} jobs for "${query}" in "${location}"`);

    return {
      jobs: results.map(job => this.standardizeJob(job)),
      totalResults
    };
  }

  standardizeJob(raw) {
    return {
      externalId: raw.id?.toString() || raw.adref || '',
      source: 'adzuna',
      title: raw.title || 'Untitled Position',
      company: raw.company?.display_name || 'Unknown Company',
      location: {
        display: raw.location?.display_name || 'Not specified',
        coordinates: raw.latitude && raw.longitude
          ? { lat: parseFloat(raw.latitude), lng: parseFloat(raw.longitude) }
          : null
      },
      salary: this.parseSalary(raw),
      jobType: this.parseJobType(raw.contract_type, raw.contract_time),
      workType: 'onsite',
      description: raw.description || '',
      applicationUrl: raw.redirect_url || '',
      companyUrl: null,
      logoUrl: null,
      postedDate: raw.created ? new Date(raw.created) : new Date(),
      expirationDate: null
    };
  }

  parseSalary(raw) {
    const result = { currency: 'GBP', period: 'annual' };
    if (raw.salary_min > 0) result.min = parseFloat(raw.salary_min);
    if (raw.salary_max > 0) result.max = parseFloat(raw.salary_max);

    if (result.min && result.max) {
      result.display = `£${result.min.toLocaleString()} - £${result.max.toLocaleString()} annual`;
    } else if (result.min) {
      result.display = `From £${result.min.toLocaleString()} annual`;
    } else if (result.max) {
      result.display = `Up to £${result.max.toLocaleString()} annual`;
    }

    return result;
  }

  parseJobType(contractType, contractTime) {
    if (contractType === 'contract') return 'contract';
    if (contractType === 'permanent') return 'permanent';
    if (contractTime === 'part_time') return 'part-time';
    if (contractTime === 'full_time') return 'full-time';
    return 'permanent';
  }
}

const adzunaAdapter = new AdzunaAdapter();
export default adzunaAdapter;
