// ESM port of backend/services/jobBoards/baseAdapter.js
//
// The constructor now takes an optional `meta` object alongside the name. The
// registry surfaces it to the UI (GET /api/job-finder/boards) and uses `tier`
// to decide which boards a given subscription may search, so board capability
// lives on the adapter that owns it rather than in a table that drifts.

// Master switch for boards that bill per request. A paid board stays OFF even
// when its API key is present, unless the deployment sets this explicitly.
//
// The key alone is deliberately NOT enough to enable billing. Keys get added
// for all sorts of reasons - a shared RapidAPI credential pulled in for some
// unrelated feature, a key copied between environments - and any of those would
// otherwise silently start charging for every job search. Spending money is an
// opt-in decision, so it takes a dedicated variable that can only have been set
// on purpose.
export function arePaidBoardsEnabled() {
  return process.env.ENABLE_PAID_JOB_BOARDS === 'true';
}

export default class BaseJobBoardAdapter {
  constructor(name, meta = {}) {
    this.name = name;
    this.label = meta.label || name;
    // Subscription tier required to search this board ('free' | 'plus' | 'pro').
    // Paid upstream APIs sit at 'pro' so their per-request cost is funded by the
    // subscription rather than absorbed on the free plan.
    this.tier = meta.tier || 'free';
    this.coverage = meta.coverage || '';
    this.requiresKey = meta.requiresKey !== false;
    // True when the upstream API bills per request. Gated by
    // arePaidBoardsEnabled() on top of whatever credentials it needs.
    this.paid = meta.paid === true;
    // True when the board has no server-side keyword search and the adapter has
    // to pull a feed and filter locally. Callers use this to avoid paging into
    // such boards.
    this.feedOnly = meta.feedOnly === true;
  }

  async search(query, location, filters) {
    throw new Error(`${this.name}: search() not implemented`);
  }

  // How many upstream HTTP requests one search() will make, worst case. The
  // registry reserves this much budget BEFORE calling, then settles up against
  // the `upstreamCalls` the adapter actually reports back. Overridden by boards
  // that page (Arbeitnow fetches 3) or cache (Remotive can spend nothing).
  estimateCalls(filters = {}) {
    return 1;
  }

  async getJobDetails(jobId) {
    throw new Error(`${this.name}: getJobDetails() not implemented`);
  }

  canAutoApply() {
    return false;
  }

  async submitApplication(job, profile, documents) {
    throw new Error(`${this.name}: submitApplication() not implemented`);
  }

  isConfigured() {
    return false;
  }

  standardizeJob(rawJob) {
    throw new Error(`${this.name}: standardizeJob() not implemented`);
  }
}
