// JSearch adapter (OpenWeb Ninja, via RapidAPI) - the paid tier.
//
// Neither Indeed nor LinkedIn offers a self-serve public API any more; JSearch
// reaches both (plus Glassdoor and ZipRecruiter) by aggregating Google for
// Jobs. It is the only source here with a per-request cost - 200 requests/month
// free, then $25/mo for 10k - so the adapter is registered at the 'pro' tier
// and the registry refuses to search it for lower plans. That keeps the API
// bill funded by the subscription instead of absorbed on the free plan.
//
// Enabling it takes TWO deliberate steps: set JSEARCH_API_KEY (a RapidAPI key)
// AND set ENABLE_PAID_JOB_BOARDS=true. Without both it reports itself
// unconfigured and the registry never calls it, so it cannot bill by accident.
//
// There is intentionally no RAPIDAPI_KEY fallback: a shared RapidAPI credential
// added for some unrelated feature would otherwise silently switch on metered
// job searching.
import BaseJobBoardAdapter, { arePaidBoardsEnabled } from './baseAdapter';
import axios from 'axios';
import logger from '@/server/logger';
import {
  buildSalary,
  describeJob,
  normalizeJobType,
  normalizeWorkType,
  normalizeUrl,
  parseDate
} from './normalize';

const RAPIDAPI_HOST = 'jsearch.p.rapidapi.com';

class JSearchAdapter extends BaseJobBoardAdapter {
  constructor() {
    super('jsearch', {
      label: 'JSearch (LinkedIn / Indeed / Glassdoor)',
      tier: 'pro',
      coverage: 'Google for Jobs aggregate - LinkedIn, Indeed, Glassdoor, ZipRecruiter',
      requiresKey: true,
      paid: true
    });
    this.apiBase = `https://${RAPIDAPI_HOST}`;
  }

  static apiKey() {
    return process.env.JSEARCH_API_KEY;
  }

  isConfigured() {
    return arePaidBoardsEnabled() && !!JSearchAdapter.apiKey();
  }

  async search(query, location, filters = {}) {
    // Re-checked here, not just in isConfigured(), so that a direct caller
    // bypassing the registry still cannot trigger a billable request.
    if (!arePaidBoardsEnabled()) {
      throw new Error('Paid job boards are disabled (set ENABLE_PAID_JOB_BOARDS=true to allow)');
    }
    if (!JSearchAdapter.apiKey()) {
      throw new Error('JSearch API key not configured');
    }

    // JSearch takes one natural-language string, not separate query/location
    // parameters - "react developer in london" is the documented form.
    const parts = [query || 'jobs'];
    if (location) parts.push(`in ${location}`);

    const params = {
      query: parts.join(' '),
      page: String(filters.page || 1),
      num_pages: '1'
    };

    if (filters.remoteOnly) params.work_from_home = 'true';
    if (filters.datePosted) params.date_posted = filters.datePosted;

    const employmentTypes = mapEmploymentTypes(filters.jobTypes);
    if (employmentTypes) params.employment_types = employmentTypes;

    const response = await axios.get(`${this.apiBase}/search`, {
      params,
      headers: {
        'X-RapidAPI-Key': JSearchAdapter.apiKey(),
        'X-RapidAPI-Host': RAPIDAPI_HOST,
        'User-Agent': 'JobTracker/2.0'
      },
      timeout: 20000
    });

    const results = response.data?.data || [];
    logger.info(`JSearch: Found ${results.length} jobs for "${params.query}"`);

    const jobs = results
      .map((job) => this.standardizeJob(job))
      // A posting with no apply link fails SavedJob's applicationUrl validator,
      // so drop it here rather than letting the user hit an error on Save.
      .filter((job) => job.applicationUrl && job.externalId);

    // JSearch reports no grand total; the page size is the only honest number.
    return { jobs, totalResults: jobs.length };
  }

  standardizeJob(raw) {
    const locationDisplay =
      [raw.job_city, raw.job_state, raw.job_country].filter(Boolean).join(', ') ||
      (raw.job_is_remote ? 'Remote' : 'Not specified');

    return {
      externalId: raw.job_id ? String(raw.job_id) : '',
      source: 'jsearch',
      title: raw.job_title || 'Untitled Position',
      company: raw.employer_name || 'Unknown Company',
      location: {
        display: locationDisplay,
        coordinates:
          raw.job_latitude && raw.job_longitude
            ? { lat: parseFloat(raw.job_latitude), lng: parseFloat(raw.job_longitude) }
            : null
      },
      salary: buildSalary({
        min: raw.job_min_salary,
        max: raw.job_max_salary,
        currency: raw.job_salary_currency,
        period: raw.job_salary_period
      }),
      jobType: normalizeJobType(raw.job_employment_type, raw.job_employment_types),
      workType: normalizeWorkType({ isRemote: raw.job_is_remote, location: locationDisplay }),
      description: describeJob(raw.job_description),
      applicationUrl: normalizeUrl(raw.job_apply_link),
      companyUrl: normalizeUrl(raw.employer_website) || null,
      logoUrl: raw.employer_logo || null,
      postedDate:
        parseDate(raw.job_posted_at_datetime_utc) ||
        parseDate(raw.job_posted_at_timestamp) ||
        new Date(),
      expirationDate: parseDate(raw.job_offer_expiration_datetime_utc),
      // Which underlying board Google surfaced this from (LinkedIn, Indeed...).
      // Not persisted by SavedJob; used for the UI badge.
      publisher: raw.job_publisher || null
    };
  }
}

// SavedJob's jobType vocabulary -> JSearch's employment_types enum.
function mapEmploymentTypes(jobTypes) {
  if (!jobTypes?.length) return null;

  const map = {
    'full-time': 'FULLTIME',
    permanent: 'FULLTIME',
    'part-time': 'PARTTIME',
    contract: 'CONTRACTOR',
    temporary: 'CONTRACTOR',
    internship: 'INTERN'
  };

  const mapped = [...new Set(jobTypes.map((t) => map[t]).filter(Boolean))];
  return mapped.length ? mapped.join(',') : null;
}

const jsearchAdapter = new JSearchAdapter();
export default jsearchAdapter;
