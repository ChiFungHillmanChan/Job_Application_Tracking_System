// ESM port of backend/services/jobBoards/index.js
import reedAdapter from './reedAdapter';
import adzunaAdapter from './adzunaAdapter';
import joobleAdapter from './joobleAdapter';
import arbeitnowAdapter from './arbeitnowAdapter';
import remotiveAdapter from './remotiveAdapter';
import jsearchAdapter from './jsearchAdapter';
import { arePaidBoardsEnabled } from './baseAdapter';
import { deduplicateJobs } from './dedupe';
import { reserve, settle as settleQuota, recordUpstreamLimit, getQuotaStatus } from './quota';
import logger from '@/server/logger';

const adapters = {
  reed: reedAdapter,
  adzuna: adzunaAdapter,
  jooble: joobleAdapter,
  arbeitnow: arbeitnowAdapter,
  remotive: remotiveAdapter,
  jsearch: jsearchAdapter
};

// Tie-break order when the same posting is found on several boards: earlier
// entries win an otherwise-equal richness comparison. Reed and Adzuna lead
// because their records carry structured salary bounds.
const BOARD_PRIORITY = ['reed', 'adzuna', 'jsearch', 'jooble', 'remotive', 'arbeitnow'];

// Deliberately duplicated from @/server/entitlements rather than imported.
// This module is pulled into the Workflow DevKit step bundle, and entitlements
// imports @/server/stripe at module scope; keeping the comparison local avoids
// dragging the Stripe SDK into that bundle for three lines of arithmetic.
const TIER_ORDER = { free: 0, plus: 1, pro: 2 };

export function getAdapter(name) {
  const adapter = adapters[name];
  if (!adapter) {
    throw new Error(`Unknown job board adapter: ${name}`);
  }
  return adapter;
}

export function getConfiguredAdapters() {
  return Object.entries(adapters)
    .filter(([, adapter]) => adapter.isConfigured())
    .map(([name]) => name);
}

// Catalog for the UI (GET /api/job-finder/boards) and for the auto-apply board
// picker, so neither has to hardcode a board list that drifts from this file.
export function listBoards(tier = 'pro') {
  const paidEnabled = arePaidBoardsEnabled();

  return Object.entries(adapters).map(([name, adapter]) => ({
    name,
    label: adapter.label,
    coverage: adapter.coverage,
    tier: adapter.tier,
    requiresKey: adapter.requiresKey,
    feedOnly: adapter.feedOnly,
    // `paid` is what the UI should warn on - it means "searching this costs
    // money", independently of plan tier.
    paid: adapter.paid,
    paidDisabled: adapter.paid && !paidEnabled,
    configured: adapter.isConfigured(),
    available: adapter.isConfigured() && tierAllows(tier, adapter.tier)
  }));
}

// True when every board that could actually be searched is free of charge.
// Used by GET /api/job-finder/boards so the UI can state plainly that nothing
// in the current configuration bills.
export function allEnabledBoardsAreFree() {
  return Object.values(adapters).every((a) => !a.paid || !a.isConfigured());
}

// listBoards() plus live budget figures. Split from listBoards because this one
// hits the database and the plain catalog does not.
export async function listBoardsWithQuota(tier = 'pro') {
  const boards = listBoards(tier);

  const withQuota = await Promise.all(
    boards.map(async (board) => {
      // Reading quota for a board that cannot be searched is wasted work.
      if (!board.configured) return { ...board, quota: null };
      const quota = await getQuotaStatus(board.name);
      return {
        ...board,
        quota,
        // A board inside its budget but out of requests is still "unavailable"
        // right now; the UI needs one field it can trust.
        available: board.available && !quota.exhausted
      };
    })
  );

  return withQuota;
}

function tierAllows(userTier, requiredTier) {
  return (TIER_ORDER[userTier] ?? 0) >= (TIER_ORDER[requiredTier] ?? 0);
}

// Resolves the board list actually searchable for a given request: drops
// unknown names, unconfigured boards, and boards above the caller's plan.
// Returns the reasons alongside so callers can tell the user *why* a board they
// picked produced nothing, instead of silently returning fewer results.
export function resolveBoards({ requested = null, tier = 'free' } = {}) {
  const candidates =
    requested?.length
      ? requested.map(String)
      : Object.keys(adapters).filter((name) => tierAllows(tier, adapters[name].tier));

  const boards = [];
  const skipped = [];

  for (const name of candidates) {
    const adapter = adapters[name];
    if (!adapter) {
      skipped.push({ board: name, reason: 'unknown', error: 'Unknown adapter' });
      continue;
    }
    // Checked before the generic not-configured branch so the message names the
    // actual blocker: a disabled paid board is a spending decision, not a
    // missing credential.
    if (adapter.paid && !arePaidBoardsEnabled()) {
      skipped.push({
        board: name,
        reason: 'paid_disabled',
        error: `${adapter.label} bills per request and paid boards are disabled`
      });
      continue;
    }
    if (!adapter.isConfigured()) {
      skipped.push({ board: name, reason: 'not_configured', error: 'Not configured' });
      continue;
    }
    if (!tierAllows(tier, adapter.tier)) {
      skipped.push({
        board: name,
        reason: 'upgrade_required',
        error: `${adapter.label} requires the ${adapter.tier} plan`
      });
      continue;
    }
    if (!boards.includes(name)) boards.push(name);
  }

  return { boards, skipped };
}

export async function searchAllBoards(query, location, filters = {}, boardNames = null) {
  const boardsToSearch = boardNames || getConfiguredAdapters();

  if (boardsToSearch.length === 0) {
    logger.warn('No job board adapters are configured');
    return { jobs: [], totalResults: 0, boardsSearched: [], errors: [] };
  }

  // Boards are searched concurrently. Sequentially awaiting each one meant the
  // wall-clock cost was the SUM of every board's 15s timeout, which blows past
  // the serverless function limit as soon as more than three boards are
  // enabled; now it is the slowest single board.
  const settled = await Promise.allSettled(
    boardsToSearch.map(async (boardName) => {
      const adapter = adapters[boardName];
      if (!adapter) throw new Error('Unknown adapter');
      if (!adapter.isConfigured()) throw new Error('Not configured');

      // Budget is reserved before the request, not counted after it, so a
      // burst of concurrent searches cannot collectively overshoot the free
      // tier. See quota.js for why the app budgets itself at all.
      const estimate = adapter.estimateCalls(filters);
      const grant = await reserve(boardName, estimate);

      if (!grant.ok) {
        const err = new Error(
          grant.reason === 'upstream_rate_limited'
            ? `${adapter.label} was rate limited by the provider`
            : `${adapter.label} has used its configured request budget`
        );
        err.quota = grant;
        throw err;
      }

      let actual = estimate;
      try {
        const result = await adapter.search(query, location, filters);
        actual = typeof result.upstreamCalls === 'number' ? result.upstreamCalls : estimate;
        return { boardName, result };
      } catch (error) {
        // A provider-issued 429 is authoritative - park the board regardless of
        // what our own budget thinks is left.
        if (error.response?.status === 429) {
          await recordUpstreamLimit(boardName, error.response.headers?.['retry-after']);
        }
        // The request was still spent (or failed mid-flight); do not refund.
        throw error;
      } finally {
        await settleQuota(boardName, estimate, actual);
      }
    })
  );

  const allJobs = [];
  const errors = [];
  const boardsSearched = [];
  let totalResults = 0;

  settled.forEach((outcome, i) => {
    const boardName = boardsToSearch[i];

    if (outcome.status === 'rejected') {
      const reason = outcome.reason;
      const message = reason?.message || String(reason);
      logger.error(`Error searching ${boardName}: ${message}`);
      errors.push({
        board: boardName,
        error: message,
        // Present only for budget/rate-limit refusals, so callers can tell the
        // user when the board comes back rather than just that it failed.
        ...(reason?.quota
          ? { reason: reason.quota.reason, availableAt: reason.quota.availableAt }
          : {}),
        ...(reason?.response?.status === 429 ? { reason: 'upstream_rate_limited' } : {})
      });
      return;
    }

    const { result } = outcome.value;
    allJobs.push(...(result.jobs || []));
    totalResults += result.totalResults || 0;
    boardsSearched.push(boardName);
  });

  return {
    jobs: deduplicateJobs(allJobs),
    totalResults,
    boardsSearched,
    errors
  };
}

export { adapters };
