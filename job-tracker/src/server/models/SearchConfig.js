// ESM port of backend/models/SearchConfig.js
import mongoose from 'mongoose';

const SearchConfigSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  keywords: [{
    type: String,
    trim: true
  }],
  locations: [{
    name: {
      type: String,
      trim: true
    },
    radius: {
      type: Number,
      default: 25
    },
    coordinates: {
      lat: Number,
      lng: Number
    }
  }],
  jobTypes: [{
    type: String,
    enum: ['permanent', 'contract', 'temporary', 'part-time', 'full-time', 'internship']
  }],
  workTypes: [{
    type: String,
    enum: ['onsite', 'remote', 'hybrid']
  }],
  salaryMin: {
    type: Number,
    default: 0
  },
  salaryMax: {
    type: Number,
    default: 0
  },
  excludeCompanies: [String],
  excludeKeywords: [String],
  // Note: the default must live on the array itself — a `default` on the
  // element definition leaves new documents with an empty array, which made
  // the automation silently search zero boards.
  // Only names with a registered adapter in src/server/services/jobBoards belong
  // here. 'indeed' / 'linkedin' / 'totaljobs' were previously accepted with no
  // adapter behind them, so selecting one made searchAllBoards throw "Unknown
  // job board adapter" for the whole run. Indeed and LinkedIn are now reachable
  // through the 'jsearch' aggregator instead.
  boards: {
    type: [{
      type: String,
      enum: ['reed', 'adzuna', 'jooble', 'arbeitnow', 'remotive', 'jsearch']
    }],
    default: ['reed']
  },
  isActive: {
    type: Boolean,
    default: true
  },
  searchFrequency: {
    type: String,
    enum: ['daily', 'twice-daily', 'weekly'],
    default: 'daily'
  },
  maxResultsPerRun: {
    type: Number,
    default: 50,
    min: 10,
    max: 200
  },
  matchScoreThreshold: {
    type: Number,
    default: 60,
    min: 0,
    max: 100
  },
  lastRunAt: {
    type: Date,
    default: null
  },
  nextRunAt: {
    type: Date,
    default: null
  }
}, {
  timestamps: true
});

SearchConfigSchema.index({ user: 1, isActive: 1 });

SearchConfigSchema.methods.shouldRunNow = function () {
  if (!this.isActive) return false;
  if (!this.lastRunAt) return true;

  const now = new Date();
  const hoursSinceLastRun = (now - this.lastRunAt) / (1000 * 60 * 60);

  switch (this.searchFrequency) {
    case 'twice-daily': return hoursSinceLastRun >= 12;
    case 'daily': return hoursSinceLastRun >= 24;
    case 'weekly': return hoursSinceLastRun >= 168;
    default: return hoursSinceLastRun >= 24;
  }
};

export default mongoose.models.SearchConfig || mongoose.model('SearchConfig', SearchConfigSchema);
