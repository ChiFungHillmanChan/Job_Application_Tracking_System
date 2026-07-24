// ESM port of backend/services/jobBoards/adzunaAdapter.js
import BaseJobBoardAdapter from './baseAdapter';
import axios from 'axios';
import logger from '@/server/logger';
import { buildSalary } from './normalize';

// Adzuna's supported country codes and the currency each one quotes in.
const COUNTRY_CURRENCY = {
  gb: 'GBP', us: 'USD', ca: 'CAD', au: 'AUD', nz: 'NZD', sg: 'SGD', in: 'INR',
  za: 'ZAR', ch: 'CHF', pl: 'PLN', br: 'BRL', mx: 'MXN',
  de: 'EUR', fr: 'EUR', nl: 'EUR', at: 'EUR', be: 'EUR', es: 'EUR', it: 'EUR', ie: 'EUR'
};

// Adzuna's job-type flags are two mutually exclusive PAIRS, verified against
// the live API:
//   full_time  vs part_time   (hours)
//   permanent  vs contract    (engagement)
// Sending both halves of either pair returns HTTP 400 - not an empty result,
// the whole request fails. One flag from each pair together is fine.
//
// This matters because the search UI ticks every job type by default, which
// meant every default search sent all four flags and 400'd. Requesting both
// sides of an axis is semantically "no preference on this axis", so the correct
// translation is to omit that axis entirely.
function buildJobTypeFlags(jobTypes) {
  if (!jobTypes?.length) return {};

  const wants = new Set(jobTypes);
  const flags = {};

  const axis = (a, b, aFlag, bFlag) => {
    const hasA = wants.has(a);
    const hasB = wants.has(b);
    if (hasA && !hasB) flags[aFlag] = 1;
    else if (hasB && !hasA) flags[bFlag] = 1;
    // both or neither -> no constraint on this axis
  };

  axis('full-time', 'part-time', 'full_time', 'part_time');
  // 'temporary' has no Adzuna flag of its own; it sits on the contract side of
  // the engagement axis, so treating it as contract keeps the pairing honest.
  axis('permanent', 'contract', 'permanent', 'contract');
  if (!flags.permanent && !flags.contract && wants.has('temporary') && !wants.has('permanent')) {
    flags.contract = 1;
  }

  return flags;
}

class AdzunaAdapter extends BaseJobBoardAdapter {
  constructor() {
    super('adzuna', {
      label: 'Adzuna',
      tier: 'free',
      coverage: 'Aggregator across ~20 countries',
      requiresKey: true
    });
    this.apiBase = 'https://api.adzuna.com/v1/api/jobs';
  }

  // Adzuna's own API parameters are `app_id` / `app_key`, so ADZUNA_APP_* are
  // the canonical names. The ADZUNA_API_* spellings are accepted as aliases
  // because that is what deployed environments were actually populated with -
  // the mismatch meant isConfigured() was silently false and the whole adapter
  // was skipped with a bare "Not configured" entry in runErrors.
  //
  // Empty strings are treated as unset: a blank placeholder left in .env must
  // fall through to the alias rather than shadowing it.
  static appId() {
    return process.env.ADZUNA_APP_ID || process.env.ADZUNA_API_ID;
  }

  static appKey() {
    return process.env.ADZUNA_APP_KEY || process.env.ADZUNA_API_KEY;
  }

  isConfigured() {
    return !!(AdzunaAdapter.appId() && AdzunaAdapter.appKey());
  }

  async search(query, location, filters = {}) {
    if (!this.isConfigured()) {
      throw new Error('Adzuna API credentials not configured');
    }

    const country = filters.country || 'gb';
    const page = filters.page || 1;
    const resultsPerPage = Math.min(filters.limit || 50, 50);

    // NOTE: `page` is a PATH segment for Adzuna (/jobs/gb/search/1), never a
    // query parameter. Sending it as both - which this adapter used to do -
    // returns HTTP 400 on every request, whatever else is correct.
    const params = {
      app_id: AdzunaAdapter.appId(),
      app_key: AdzunaAdapter.appKey(),
      results_per_page: resultsPerPage
    };

    if (query) params.what = query;
    if (location) params.where = location;
    // `distance` is only meaningful relative to `where`; sending it alone is
    // rejected, and the search route supplies a default radius regardless of
    // whether the user typed a location.
    if (filters.distance && location) params.distance = filters.distance;
    if (filters.minimumSalary > 0) params.salary_min = filters.minimumSalary;
    if (filters.maximumSalary > 0) params.salary_max = filters.maximumSalary;

    Object.assign(params, buildJobTypeFlags(filters.jobTypes));

    params.sort_by = 'date';

    const response = await axios.get(`${this.apiBase}/${country}/search/${page}`, {
      params,
      // Adzuna defaults to JSONP when no encoding is requested; the Accept
      // header is what selects plain JSON. (The `content_type` query parameter
      // this used to send is not a real Adzuna parameter - the documented one
      // is `content-type` with a hyphen - and it made every request 400.)
      headers: { 'User-Agent': 'JobTracker/2.0', Accept: 'application/json' },
      timeout: 15000
    });

    const results = response.data.results || [];
    const totalResults = response.data.count || 0;

    logger.info(`Adzuna: Found ${results.length} jobs for "${query}" in "${location}"`);

    return {
      jobs: results.map(job => this.standardizeJob(job, country)),
      totalResults
    };
  }

  standardizeJob(raw, country = 'gb') {
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
      salary: this.parseSalary(raw, country),
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

  // Adzuna serves ~20 countries off the same schema, so the currency follows
  // the `country` path segment. Hardcoding GBP labelled a US listing's $80,000
  // as £80,000 the moment filters.country was anything but 'gb'.
  parseSalary(raw, country = 'gb') {
    return buildSalary({
      min: raw.salary_min,
      max: raw.salary_max,
      currency: COUNTRY_CURRENCY[String(country).toLowerCase()] || 'GBP',
      period: 'annual'
    });
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
