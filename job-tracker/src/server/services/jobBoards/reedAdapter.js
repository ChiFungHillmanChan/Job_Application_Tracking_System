// ESM port of backend/services/jobBoards/reedAdapter.js
import BaseJobBoardAdapter from './baseAdapter';
import axios from 'axios';
import logger from '@/server/logger';

class ReedAdapter extends BaseJobBoardAdapter {
  constructor() {
    super('reed');
    this.apiBase = 'https://www.reed.co.uk/api/1.0';
  }

  isConfigured() {
    return !!process.env.REED_API_KEY;
  }

  async search(query, location, filters = {}) {
    if (!this.isConfigured()) {
      throw new Error('Reed API key not configured');
    }

    const params = new URLSearchParams();
    if (query) params.append('keywords', query);
    if (location) params.append('locationName', location);
    if (filters.distance) params.append('distanceFromLocation', filters.distance.toString());
    if (filters.minimumSalary > 0) params.append('minimumSalary', filters.minimumSalary.toString());
    if (filters.maximumSalary > 0) params.append('maximumSalary', filters.maximumSalary.toString());

    const jobTypeMap = {
      'permanent': 'permanent',
      'contract': 'contract',
      'temporary': 'temp',
      'part-time': 'partTime',
      'full-time': 'fullTime'
    };

    if (filters.jobTypes?.length) {
      for (const type of filters.jobTypes) {
        const reedParam = jobTypeMap[type];
        if (reedParam) params.append(reedParam, 'true');
      }
    }

    params.append('resultsToTake', Math.min(filters.limit || 50, 100).toString());
    params.append('resultsToSkip', ((filters.page || 1) - 1) * (filters.limit || 50));

    const response = await axios.get(`${this.apiBase}/search`, {
      params,
      auth: { username: process.env.REED_API_KEY, password: '' },
      headers: { 'User-Agent': 'JobTracker/2.0', 'Accept': 'application/json' },
      timeout: 15000
    });

    const results = response.data.results || [];
    logger.info(`Reed: Found ${results.length} jobs for "${query}" in "${location}"`);

    return {
      jobs: results.map(job => this.standardizeJob(job)),
      totalResults: response.data.totalResults || 0
    };
  }

  async getJobDetails(jobId) {
    if (!this.isConfigured()) {
      throw new Error('Reed API key not configured');
    }

    const response = await axios.get(`${this.apiBase}/jobs/${jobId}`, {
      auth: { username: process.env.REED_API_KEY, password: '' },
      headers: { 'User-Agent': 'JobTracker/2.0' },
      timeout: 10000
    });

    return this.standardizeJob(response.data);
  }

  standardizeJob(raw) {
    return {
      externalId: (raw.jobId || raw.id)?.toString(),
      source: 'reed',
      title: raw.jobTitle || raw.title || 'Untitled Position',
      company: raw.employerName || raw.employer || 'Unknown Company',
      location: {
        display: raw.locationName || raw.location || 'Not specified',
        coordinates: raw.latitude && raw.longitude
          ? { lat: parseFloat(raw.latitude), lng: parseFloat(raw.longitude) }
          : null
      },
      salary: this.parseSalary(raw),
      jobType: this.parseJobType(raw.jobType),
      workType: 'onsite',
      description: raw.jobDescription || raw.description || '',
      applicationUrl: raw.jobUrl || raw.url || '',
      companyUrl: raw.employerProfileUrl || null,
      logoUrl: raw.employerLogoUrl || null,
      postedDate: raw.date ? new Date(raw.date) : new Date(),
      expirationDate: raw.expirationDate ? new Date(raw.expirationDate) : null
    };
  }

  parseSalary(raw) {
    const result = { currency: 'GBP', period: 'annual' };
    if (raw.minimumSalary > 0) result.min = parseFloat(raw.minimumSalary);
    if (raw.maximumSalary > 0) result.max = parseFloat(raw.maximumSalary);

    if (result.min && result.max) {
      result.display = `£${result.min.toLocaleString()} - £${result.max.toLocaleString()} annual`;
    } else if (result.min) {
      result.display = `From £${result.min.toLocaleString()} annual`;
    } else if (result.max) {
      result.display = `Up to £${result.max.toLocaleString()} annual`;
    }

    return result;
  }

  parseJobType(type) {
    if (!type) return 'permanent';
    const lower = type.toLowerCase();
    if (lower.includes('contract')) return 'contract';
    if (lower.includes('temp')) return 'temporary';
    if (lower.includes('part')) return 'part-time';
    if (lower.includes('full')) return 'full-time';
    return 'permanent';
  }
}

const reedAdapter = new ReedAdapter();
export default reedAdapter;
