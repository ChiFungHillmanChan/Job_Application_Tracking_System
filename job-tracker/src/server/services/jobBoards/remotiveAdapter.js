// Remotive adapter - free, no API key.
//
// Remote-only listings, curated and worldwide. Remotive's terms ask consumers
// to cache aggressively rather than hit the endpoint per user request, so this
// adapter keeps a short-lived in-process cache. On serverless that cache lives
// only for the lifetime of a warm instance, which is exactly the "don't hammer
// it" behaviour they ask for without pulling in external storage.
//
// Behaviour confirmed against the live API (2026-07): the documented `search`
// and `limit` parameters are accepted but IGNORED - the endpoint returns the
// same fixed public feed either way (~35 jobs at time of writing, reported in
// `job-count`). All narrowing therefore happens locally, and the whole feed is
// fetched once per cache window rather than per query. Treat this board as a
// small supplementary source, not a searchable index.
import BaseJobBoardAdapter from './baseAdapter';
import axios from 'axios';
import logger from '@/server/logger';
import {
  buildSalary,
  describeJob,
  matchesJobTypes,
  normalizeJobType,
  normalizeUrl,
  parseDate
} from './normalize';

const CACHE_TTL_MS = 15 * 60 * 1000;

// Cached on globalThis so it survives Next's module re-evaluation between
// route handlers on the same warm instance, mirroring how db.js caches the
// mongoose connection.
function cacheStore() {
  if (!globalThis.__remotiveCache) {
    globalThis.__remotiveCache = new Map();
  }
  return globalThis.__remotiveCache;
}

class RemotiveAdapter extends BaseJobBoardAdapter {
  constructor() {
    super('remotive', {
      label: 'Remotive',
      tier: 'free',
      coverage: 'Remote-only roles worldwide (small curated feed)',
      requiresKey: false,
      feedOnly: true
    });
    this.apiBase = 'https://remotive.com/api/remote-jobs';
  }

  isConfigured() {
    return true;
  }

  async search(query, location, filters = {}) {
    const limit = Math.min(filters.limit || 20, 100);
    const { jobs: results, fetched } = await this.fetchFeed();

    // Keyword narrowing, done locally because the API's `search` is a no-op.
    // Any-term match so "senior react developer" still surfaces "React
    // Developer" rather than requiring every word.
    let filtered = results;
    if (query) {
      const terms = String(query)
        .toLowerCase()
        .split(/[^a-z0-9+#.]+/)
        .filter((t) => t.length > 1);

      if (terms.length) {
        filtered = filtered.filter((job) => {
          const haystack = [job.title, job.company_name, job.category, ...(job.tags || [])]
            .join(' ')
            .toLowerCase();
          return terms.some((t) => haystack.includes(t));
        });
      }
    }

    // Remotive is remote-only, so a location term can only usefully filter on
    // the candidate-eligibility field ("USA only", "Europe", "Worldwide").
    if (location && !/remote|anywhere/i.test(location)) {
      const wanted = String(location).toLowerCase();
      filtered = filtered.filter((job) => {
        const eligible = String(job.candidate_required_location || '').toLowerCase();
        return !eligible || eligible.includes('worldwide') || eligible.includes(wanted);
      });
    }

    // Most of the feed leaves job_type blank, and matchesJobTypes treats an
    // unrecognizable label as "no information" rather than a rejection.
    filtered = filtered.filter((job) => matchesJobTypes(filters.jobTypes, job.job_type));

    logger.info(`Remotive: ${filtered.length}/${results.length} feed jobs matched "${query}"`);

    return {
      jobs: filtered.slice(0, limit).map((job) => this.standardizeJob(job)),
      totalResults: filtered.length,
      // A cache hit costs nothing; the registry refunds the reserved budget.
      upstreamCalls: fetched ? 1 : 0
    };
  }

  // One cached copy of the whole public feed, shared across every query.
  async fetchFeed() {
    const cache = cacheStore();
    const hit = cache.get('feed');

    if (hit && Date.now() - hit.at < CACHE_TTL_MS) {
      return { jobs: hit.jobs, fetched: false };
    }

    const response = await axios.get(this.apiBase, {
      headers: { 'User-Agent': 'JobTracker/2.0', Accept: 'application/json' },
      timeout: 15000
    });

    const jobs = response.data?.jobs || [];
    cache.set('feed', { at: Date.now(), jobs });
    logger.info(`Remotive: fetched feed (${jobs.length} jobs)`);
    return { jobs, fetched: true };
  }

  standardizeJob(raw) {
    return {
      externalId: raw.id ? String(raw.id) : normalizeUrl(raw.url),
      source: 'remotive',
      title: raw.title || 'Untitled Position',
      company: raw.company_name || 'Unknown Company',
      location: {
        display: raw.candidate_required_location || 'Remote',
        coordinates: null
      },
      // Remotive's `salary` is optional free text ("$70,000 - $90,000").
      salary: buildSalary({ rawDisplay: raw.salary }),
      jobType: normalizeJobType(raw.job_type),
      workType: 'remote',
      description: describeJob(raw.description),
      applicationUrl: normalizeUrl(raw.url),
      companyUrl: null,
      logoUrl: raw.company_logo || null,
      postedDate: parseDate(raw.publication_date) || new Date(),
      expirationDate: null
    };
  }
}

const remotiveAdapter = new RemotiveAdapter();
export default remotiveAdapter;
