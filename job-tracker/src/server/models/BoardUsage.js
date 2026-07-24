// Per-board API call accounting.
//
// Job board free tiers are metered, and none of the providers we use publish a
// machine-readable quota — so the app keeps its own ledger and refuses to spend
// past a configured budget. Counting has to survive across serverless
// invocations, which rules out an in-process counter; this collection is the
// shared ledger.
//
// One document per (board, window, periodKey), e.g.
//   { board: 'adzuna', window: 'day',   periodKey: '2026-07-25' }
//   { board: 'adzuna', window: 'month', periodKey: '2026-07'    }
// so a board can be budgeted daily and monthly at the same time.
import mongoose from 'mongoose';

const BoardUsageSchema = new mongoose.Schema(
  {
    board: {
      type: String,
      required: true
    },
    window: {
      type: String,
      required: true,
      enum: ['day', 'month']
    },
    // 'YYYY-MM-DD' for day, 'YYYY-MM' for month, always UTC.
    periodKey: {
      type: String,
      required: true
    },
    // Reserved calls. Incremented BEFORE the upstream request so concurrent
    // invocations cannot both slip past the budget, then refunded if the
    // request turns out to be cheaper than estimated or never happened.
    count: {
      type: Number,
      default: 0,
      min: 0
    },
    // Set when the provider itself answers 429. Authoritative: it overrides our
    // own budget, because the provider knows its real limit and we do not.
    blockedUntil: {
      type: Date,
      default: null
    },
    lastUpstreamLimitAt: {
      type: Date,
      default: null
    },
    // Housekeeping only - old period rows are of no interest once their window
    // has long passed.
    expiresAt: {
      type: Date,
      required: true
    }
  },
  { timestamps: true }
);

BoardUsageSchema.index({ board: 1, window: 1, periodKey: 1 }, { unique: true });
BoardUsageSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

export default mongoose.models.BoardUsage || mongoose.model('BoardUsage', BoardUsageSchema);
