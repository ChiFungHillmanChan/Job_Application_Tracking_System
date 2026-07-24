// Job board call budgeting.
//
// WHY THIS EXISTS, AND WHAT IT IS NOT
// -----------------------------------
// None of the boards we call publish an authoritative, machine-readable free
// tier limit. Adzuna documents none at all (~1000 calls/month is a third-party
// figure); Jooble says only "generous"; Reed publishes 2000/hr for its
// *Recruiter* API, which is not the Jobseeker endpoint we use. So the numbers
// below are OUR SPENDING BUDGET, deliberately set under the reported ceilings —
// they are not a mirror of the providers' real quotas and should not be
// presented as such.
//
// Two independent brakes, because the budget alone can only ever be a guess:
//
//   1. Local budget (this table). Calls are reserved atomically BEFORE the
//      request goes out, so the app stops short of the limit rather than
//      discovering it by being rejected. This is what keeps you from ever
//      hitting the provider.
//   2. Upstream 429. If a provider rate-limits us anyway, that answer is
//      authoritative and overrides the local budget: the board is parked until
//      Retry-After (or the end of the window) regardless of budget remaining.
//
// Every limit is overridable per environment, e.g.
//   JOB_BOARD_QUOTA_ADZUNA_MONTH=2000
//   JOB_BOARD_QUOTA_REED_DAY=250
// Set a limit to 0 to disable that board's calls entirely.
import BoardUsage from '@/server/models/BoardUsage';
import logger from '@/server/logger';

// Conservative defaults. `null` means "no budget in this window".
const DEFAULT_QUOTAS = {
  // Reported ~1000/day for the Jobseeker API; budgeted at half for headroom.
  reed: { day: 500, month: null },
  // Reported ~1000/month. The daily sub-budget stops a single runaway
  // afternoon from consuming the entire month's allowance.
  adzuna: { day: 30, month: 1000 },
  // No published figure; a deliberately cautious starting point.
  jooble: { day: 300, month: null },
  // No API key and an explicit "please do not abuse" in their own payload.
  arbeitnow: { day: 200, month: null },
  // Remotive ask consumers to cache rather than call per request. The adapter
  // caches for 15 minutes, so ~96 calls/day is the natural ceiling anyway.
  remotive: { day: 100, month: null },
  // RapidAPI free tier is 200 requests/month.
  jsearch: { day: 20, month: 200 }
};

export function getLimits(board) {
  const defaults = DEFAULT_QUOTAS[board] || { day: null, month: null };

  const read = (window, fallback) => {
    const raw = process.env[`JOB_BOARD_QUOTA_${board.toUpperCase()}_${window.toUpperCase()}`];
    if (raw === undefined || raw === '') return fallback;
    const n = Number(raw);
    // A malformed override must not silently become "unlimited".
    if (!Number.isFinite(n) || n < 0) {
      logger.warn(`Ignoring invalid quota override for ${board}.${window}: "${raw}"`);
      return fallback;
    }
    return n;
  };

  return { day: read('day', defaults.day), month: read('month', defaults.month) };
}

// All period maths is UTC so the reset instant does not drift with the server's
// local timezone or with daylight saving.
export function periodKey(window, now = new Date()) {
  const y = now.getUTCFullYear();
  const m = String(now.getUTCMonth() + 1).padStart(2, '0');
  if (window === 'month') return `${y}-${m}`;
  return `${y}-${m}-${String(now.getUTCDate()).padStart(2, '0')}`;
}

export function resetAt(window, now = new Date()) {
  if (window === 'month') {
    return new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() + 1, 1, 0, 0, 0, 0));
  }
  return new Date(
    Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate() + 1, 0, 0, 0, 0)
  );
}

// Keep a day row for a week and a month row for a year, then let the TTL index
// remove it.
function expiryFor(window, now) {
  const at = resetAt(window, now);
  const days = window === 'month' ? 365 : 7;
  return new Date(at.getTime() + days * 24 * 60 * 60 * 1000);
}

const ACTIVE_WINDOWS = ['day', 'month'];

// Read-only snapshot for display. Never mutates, so it is safe to call from a
// listing endpoint on every page load.
export async function getQuotaStatus(board, now = new Date()) {
  const limits = getLimits(board);
  const windows = ACTIVE_WINDOWS.filter((w) => typeof limits[w] === 'number');

  if (!windows.length) {
    return { board, limited: false, windows: [], exhausted: false, blockedUntil: null };
  }

  const rows = await BoardUsage.find({
    board,
    $or: windows.map((w) => ({ window: w, periodKey: periodKey(w, now) }))
  }).lean();

  const byWindow = new Map(rows.map((r) => [r.window, r]));

  let exhausted = false;
  let blockedUntil = null;
  let soonestReset = null;

  const detail = windows.map((window) => {
    const row = byWindow.get(window);
    const limit = limits[window];
    const used = row?.count || 0;
    const remaining = Math.max(limit - used, 0);
    const reset = resetAt(window, now);

    if (remaining === 0) {
      exhausted = true;
      if (!soonestReset || reset < soonestReset) soonestReset = reset;
    }

    // An upstream 429 cooldown outranks the local budget.
    if (row?.blockedUntil && new Date(row.blockedUntil) > now) {
      const until = new Date(row.blockedUntil);
      if (!blockedUntil || until > blockedUntil) blockedUntil = until;
    }

    return { window, limit, used, remaining, resetAt: reset.toISOString() };
  });

  if (blockedUntil) {
    exhausted = true;
    if (!soonestReset || blockedUntil > soonestReset) soonestReset = blockedUntil;
  }

  return {
    board,
    limited: true,
    windows: detail,
    exhausted,
    blockedUntil: blockedUntil ? blockedUntil.toISOString() : null,
    // When the board becomes usable again. Null while it is still usable.
    availableAt: exhausted && soonestReset ? soonestReset.toISOString() : null
  };
}

// Atomically reserves `cost` calls across every budgeted window.
//
// Reserving up front (rather than counting after the fact) is what makes the
// budget hold under concurrency: two simultaneous searches cannot both read
// "1 remaining" and then both spend it. If any window cannot cover the cost the
// already-reserved windows are refunded and the whole reservation fails.
export async function reserve(board, cost = 1, now = new Date()) {
  const limits = getLimits(board);
  const windows = ACTIVE_WINDOWS.filter((w) => typeof limits[w] === 'number');

  if (!windows.length) return { ok: true, reserved: 0, windows: [] };

  const granted = [];

  for (const window of windows) {
    const key = periodKey(window, now);
    const limit = limits[window];

    // Upstream cooldown check first - it ignores remaining budget entirely.
    const existing = await BoardUsage.findOne({ board, window, periodKey: key })
      .select('blockedUntil')
      .lean();

    if (existing?.blockedUntil && new Date(existing.blockedUntil) > now) {
      await refund(board, granted, cost, now);
      return {
        ok: false,
        reason: 'upstream_rate_limited',
        availableAt: new Date(existing.blockedUntil).toISOString(),
        window
      };
    }

    // Conditional $inc: only succeeds while the counter still leaves room, so
    // the check and the increment are a single atomic operation.
    const updated = await BoardUsage.findOneAndUpdate(
      { board, window, periodKey: key, count: { $lte: limit - cost } },
      {
        $inc: { count: cost },
        $setOnInsert: { expiresAt: expiryFor(window, now) }
      },
      { new: true, upsert: true }
    ).catch((err) => {
      // Upsert races on the unique index surface as duplicate key errors; the
      // retry below resolves them against the now-existing document.
      if (err?.code === 11000) return null;
      throw err;
    });

    if (!updated) {
      const retried = await BoardUsage.findOneAndUpdate(
        { board, window, periodKey: key, count: { $lte: limit - cost } },
        { $inc: { count: cost } },
        { new: true }
      );

      if (!retried) {
        await refund(board, granted, cost, now);
        return {
          ok: false,
          reason: 'quota_exhausted',
          availableAt: resetAt(window, now).toISOString(),
          window,
          limit
        };
      }
      granted.push(window);
      continue;
    }

    granted.push(window);
  }

  return { ok: true, reserved: cost, windows: granted };
}

async function refund(board, windows, cost, now) {
  for (const window of windows) {
    await BoardUsage.updateOne(
      { board, window, periodKey: periodKey(window, now) },
      { $inc: { count: -cost } }
    );
  }
}

// Gives back the difference when a search cost less than estimated - a cached
// Remotive hit makes no request at all, and Arbeitnow reserves for 3 pages but
// spends 1 when the visa filter is on.
export async function settle(board, reserved, actual, now = new Date()) {
  const diff = reserved - actual;
  if (diff <= 0) return;

  const limits = getLimits(board);
  const windows = ACTIVE_WINDOWS.filter((w) => typeof limits[w] === 'number');
  await refund(board, windows, diff, now);
}

// Records a provider-issued rate limit. This is the authoritative signal, so it
// parks the board even when our own budget says there is room left.
export async function recordUpstreamLimit(board, retryAfterSeconds, now = new Date()) {
  const seconds = Number(retryAfterSeconds);
  const until =
    Number.isFinite(seconds) && seconds > 0
      ? new Date(now.getTime() + seconds * 1000)
      : resetAt('day', now);

  const window = 'day';
  const key = periodKey(window, now);

  await BoardUsage.updateOne(
    { board, window, periodKey: key },
    {
      $set: { blockedUntil: until, lastUpstreamLimitAt: now },
      $setOnInsert: { expiresAt: expiryFor(window, now) }
    },
    { upsert: true }
  );

  logger.warn(`${board}: upstream rate limit hit, parked until ${until.toISOString()}`);
  return until;
}

// Seconds until `iso`, floored at 0 - shaped for a Retry-After header.
export function secondsUntil(iso, now = new Date()) {
  if (!iso) return null;
  return Math.max(Math.ceil((new Date(iso).getTime() - now.getTime()) / 1000), 0);
}
