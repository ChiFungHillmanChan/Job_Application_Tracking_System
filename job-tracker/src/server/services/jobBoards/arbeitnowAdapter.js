// Arbeitnow adapter - free, no API key at all.
//
// Arbeitnow republishes postings pulled directly from employers' applicant
// tracking systems (Greenhouse, SmartRecruiters, Recruitee, Join, Teamtailor,
// Comeet), which makes it the only source wired up here that can filter to
// visa-sponsoring employers. Coverage is Europe-heavy, Germany especially.
//
// Behaviour confirmed against the live API (2026-07), which differs from the
// published blog post:
//   - `search=` and `remote=` are accepted but IGNORED; the feed comes back
//     identical. All keyword/location/remote narrowing therefore happens
//     locally in matches(), which is why `feedOnly` is set - callers should not
//     try to paginate through this board the way they do with Reed.
//   - `visa_sponsorship=true` IS honoured server-side, but the job objects it
//     returns do not carry a `visa_sponsorship` field, so the flag can only be
//     inferred from the request.
import BaseJobBoardAdapter from './baseAdapter';
import axios from 'axios';
import logger from '@/server/logger';
import {
  buildSalary,
  describeJob,
  matchesJobTypes,
  normalizeJobType,
  normalizeWorkType,
  normalizeUrl,
  parseDate
} from './normalize';

// Each page is 100 jobs. Three pages keeps the whole board search inside a
// couple of seconds while still giving the local filter enough to work with.
const MAX_PAGES = 3;

function tokenize(text) {
  return String(text || '')
    .toLowerCase()
    .split(/[^a-z0-9+#.]+/)
    .filter((t) => t.length > 1);
}

class ArbeitnowAdapter extends BaseJobBoardAdapter {
  constructor() {
    super('arbeitnow', {
      label: 'Arbeitnow',
      tier: 'free',
      coverage: 'Europe / Germany, ATS-sourced, visa-sponsorship filter',
      requiresKey: false,
      feedOnly: true
    });
    this.apiBase = 'https://www.arbeitnow.com/api/job-board-api';
  }

  // No credentials exist for this API, so it is always available.
  isConfigured() {
    return true;
  }

  // One request per page; the visa-filtered search only needs a single page.
  estimateCalls(filters = {}) {
    return filters.visaSponsorship === true ? 1 : MAX_PAGES;
  }

  async search(query, location, filters = {}) {
    // Verified against the live API: `visa_sponsorship=true` is honoured
    // server-side and narrows the feed to a few dozen jobs, so one page covers
    // it. `search=` and `remote=` are accepted but ignored by the API - both
    // are handled by matches() below instead.
    const visaOnly = filters.visaSponsorship === true;
    const pageCount = visaOnly ? 1 : MAX_PAGES;
    const pages = Array.from({ length: pageCount }, (_, i) => i + 1);

    const responses = await Promise.allSettled(
      pages.map((page) =>
        axios.get(this.apiBase, {
          params: visaOnly ? { page, visa_sponsorship: 'true' } : { page },
          headers: { 'User-Agent': 'JobTracker/2.0', Accept: 'application/json' },
          timeout: 15000
        })
      )
    );

    const raw = [];
    for (const settled of responses) {
      if (settled.status === 'fulfilled') {
        raw.push(...(settled.value.data?.data || []));
      } else {
        logger.warn(`Arbeitnow: page fetch failed - ${settled.reason?.message}`);
      }
    }

    // Every page failing is a real outage, not an empty result set.
    if (!raw.length && responses.every((r) => r.status === 'rejected')) {
      throw new Error('Arbeitnow API unreachable');
    }

    const matched = raw.filter((job) => this.matches(job, query, location, filters));
    const limit = Math.min(filters.limit || 20, 100);
    const jobs = matched.slice(0, limit).map((job) => this.standardizeJob(job, visaOnly));

    logger.info(
      `Arbeitnow: ${matched.length}/${raw.length} feed jobs matched "${query}" in "${location}"`
    );

    return { jobs, totalResults: matched.length, upstreamCalls: pages.length };
  }

  // Local substitute for the server-side search the API does not offer. A job
  // has to match every supplied constraint; an empty query matches everything.
  matches(job, query, location, filters = {}) {
    // Note: no visa check here. The API filters that server-side and does NOT
    // echo a `visa_sponsorship` field back on the job objects, so testing one
    // locally would reject every result.
    if (filters.remoteOnly && !job.remote) return false;

    if (query) {
      const haystack = [job.title, job.company_name, ...(job.tags || [])]
        .join(' ')
        .toLowerCase();
      const terms = tokenize(query);
      // Any-term match: a search for "senior react developer" should still
      // surface "React Developer" rather than requiring all three words.
      if (terms.length && !terms.some((t) => haystack.includes(t))) return false;
    }

    if (location) {
      const where = String(job.location || '').toLowerCase();
      const wanted = tokenize(location);
      const remoteSearch = /remote|anywhere/i.test(location);
      if (remoteSearch && job.remote) return true;
      if (wanted.length && !wanted.some((t) => where.includes(t))) return false;
    }

    // `job_types` holds the employer's ATS labels, which are a seniority
    // taxonomy far more often than a contract type - 'executive', 'manager',
    // 'berufserfahren', 'professional / experienced'. Matching those literally
    // against our permanent/contract/full-time vocabulary rejected roughly
    // seven of every eight jobs, so only recognizable contract types filter.
    if (!matchesJobTypes(filters.jobTypes, job.job_types)) return false;

    return true;
  }

  standardizeJob(raw, visaSponsored = false) {
    const tags = Array.isArray(raw.tags) ? raw.tags : [];

    return {
      externalId: raw.slug || normalizeUrl(raw.url),
      source: 'arbeitnow',
      title: raw.title || 'Untitled Position',
      company: raw.company_name || 'Unknown Company',
      location: {
        display: raw.location || (raw.remote ? 'Remote' : 'Not specified'),
        coordinates: null
      },
      // Arbeitnow never publishes salary figures.
      salary: buildSalary({}),
      jobType: normalizeJobType(raw.job_types),
      workType: normalizeWorkType({ isRemote: raw.remote, location: raw.location, tags }),
      description: describeJob(raw.description),
      applicationUrl: normalizeUrl(raw.url),
      companyUrl: null,
      logoUrl: null,
      postedDate: parseDate(raw.created_at) || new Date(),
      expirationDate: null,
      // Derived from the request, not the payload - the API omits the field on
      // job objects, so the only thing we know is that a visa-filtered search
      // returns exclusively sponsored roles. Not persisted by SavedJob (strict
      // mode drops it); carried through so the UI can badge sponsored roles.
      visaSponsorship: visaSponsored
    };
  }
}

const arbeitnowAdapter = new ArbeitnowAdapter();
export default arbeitnowAdapter;
