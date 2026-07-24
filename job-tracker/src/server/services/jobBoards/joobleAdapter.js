// Jooble aggregator adapter.
//
// Jooble indexes ~70 countries and is one of the few genuinely free aggregators
// (an API key is issued on request at https://jooble.org/api/about, no card).
// Unlike every other adapter here the API is POST-with-JSON-body and the key is
// part of the path rather than a header.
//
// Jooble does not return numeric salary bounds - `salary` is free text such as
// "£45,000 - £55,000 per year" - so we parse what we can and fall back to
// showing the board's own string.
import BaseJobBoardAdapter from './baseAdapter';
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

// "£45,000 - £55,000 per year", "$30 per hour", "From 50 000 PLN"
const SALARY_TEXT = /([£$€]|\b(?:GBP|USD|EUR|PLN|CAD|AUD|INR|SEK|CHF)\b)?\s*([\d][\d\s,.]*)\s*(?:-|–|to)?\s*([\d][\d\s,.]*)?/i;
const SYMBOL_TO_CODE = { '£': 'GBP', $: 'USD', '€': 'EUR' };

// Jooble issues region-scoped keys and resolves bare city names inside that
// region first. A US-region key searching "London" therefore returns London,
// Kentucky (3 hits) rather than London, UK (218) - silently, with no error.
// Qualifying the location with a country name is what disambiguates it, so the
// country the caller asked for is appended when it is not already present.
const COUNTRY_NAMES = {
  gb: 'UK', uk: 'UK', us: 'USA', ca: 'Canada', au: 'Australia', nz: 'New Zealand',
  ie: 'Ireland', de: 'Germany', fr: 'France', nl: 'Netherlands', es: 'Spain',
  it: 'Italy', pl: 'Poland', in: 'India', sg: 'Singapore', za: 'South Africa',
  ch: 'Switzerland', at: 'Austria', be: 'Belgium', se: 'Sweden', br: 'Brazil', mx: 'Mexico'
};

export function qualifyLocation(location, country = 'gb') {
  const name = COUNTRY_NAMES[String(country).toLowerCase()];
  if (!name) return location || '';

  const value = String(location || '').trim();
  if (!value) return name;

  // Already qualified - "London, UK", "Berlin, Germany", "remote".
  const lower = value.toLowerCase();
  if (lower.includes(name.toLowerCase())) return value;
  if (/\bremote\b|\banywhere\b/.test(lower)) return value;

  return `${value}, ${name}`;
}

function parseJoobleSalary(text) {
  if (!text || !String(text).trim()) return buildSalary({});

  const raw = String(text).trim();
  const match = SALARY_TEXT.exec(raw);
  if (!match) return buildSalary({ rawDisplay: raw });

  const toNumber = (s) => {
    if (!s) return null;
    // Jooble writes thousands separators as spaces, commas or dots depending on
    // locale. Strip them all; a trailing ".50" of pence is not worth preserving.
    const n = parseFloat(String(s).replace(/[\s,]/g, '').replace(/\.(?=\d{3}\b)/g, ''));
    return Number.isFinite(n) ? n : null;
  };

  const token = match[1] ? match[1].toUpperCase() : null;
  const currency = token ? (SYMBOL_TO_CODE[match[1]] || token) : null;

  // Only trust a period we can actually read out of the string.
  const periodMatch = /\b(year|annum|annual|month|week|day|hour)\w*\b/i.exec(raw);

  const salary = buildSalary({
    min: toNumber(match[2]),
    max: toNumber(match[3]),
    currency,
    period: periodMatch ? periodMatch[1] : null,
    rawDisplay: raw
  });

  // Jooble's own wording is more precise than anything we can reconstruct.
  salary.display = raw;
  return salary;
}

class JoobleAdapter extends BaseJobBoardAdapter {
  constructor() {
    super('jooble', {
      label: 'Jooble',
      tier: 'free',
      coverage: 'Aggregator across ~70 countries',
      requiresKey: true
    });
    this.apiBase = 'https://jooble.org/api';
  }

  // JOOBLE_REST_API_KEY is accepted as an alias - Jooble's own dashboard calls
  // it a "REST API key", so that is the name people naturally reach for. Empty
  // strings fall through, so a blank placeholder cannot shadow a real key.
  static apiKey() {
    return process.env.JOOBLE_API_KEY || process.env.JOOBLE_REST_API_KEY;
  }

  isConfigured() {
    return !!JoobleAdapter.apiKey();
  }

  async search(query, location, filters = {}) {
    if (!this.isConfigured()) {
      throw new Error('Jooble API key not configured');
    }

    const body = {
      keywords: query || '',
      location: qualifyLocation(location, filters.country),
      page: String(filters.page || 1),
      ResultOnPage: String(Math.min(filters.limit || 20, 100))
    };

    if (filters.distance) body.radius = String(filters.distance);
    // Jooble takes a single lower bound as free text, not a min/max pair.
    if (filters.minimumSalary > 0) body.salary = String(filters.minimumSalary);

    const response = await axios.post(
      `${this.apiBase}/${JoobleAdapter.apiKey()}`,
      body,
      {
        headers: { 'Content-Type': 'application/json', 'User-Agent': 'JobTracker/2.0' },
        timeout: 15000
      }
    );

    const results = response.data?.jobs || [];
    logger.info(`Jooble: Found ${results.length} jobs for "${query}" in "${location}"`);

    return {
      jobs: results.map((job) => this.standardizeJob(job)),
      totalResults: response.data?.totalCount || 0
    };
  }

  standardizeJob(raw) {
    // Jooble's numeric `id` is not stable across responses for every partner
    // account, so fall back to the destination link when it is absent.
    const externalId = raw.id ? String(raw.id) : normalizeUrl(raw.link);

    return {
      externalId,
      source: 'jooble',
      title: raw.title || 'Untitled Position',
      company: raw.company || 'Unknown Company',
      location: {
        display: raw.location || 'Not specified',
        coordinates: null
      },
      salary: parseJoobleSalary(raw.salary),
      jobType: normalizeJobType(raw.type),
      workType: normalizeWorkType({ location: raw.location, tags: [raw.title, raw.type] }),
      description: describeJob(raw.snippet),
      applicationUrl: normalizeUrl(raw.link),
      companyUrl: null,
      logoUrl: null,
      postedDate: parseDate(raw.updated) || new Date(),
      expirationDate: null
    };
  }
}

const joobleAdapter = new JoobleAdapter();
export default joobleAdapter;
