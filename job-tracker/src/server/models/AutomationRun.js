// ESM port of backend/models/AutomationRun.js
import mongoose from 'mongoose';

const AutomationRunSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  searchConfig: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'SearchConfig',
    default: null
  },
  runDate: {
    type: Date,
    default: Date.now,
    index: true
  },
  boardsSearched: [String],
  jobsFound: {
    type: Number,
    default: 0
  },
  jobsMatched: {
    type: Number,
    default: 0
  },
  applicationsPrepared: {
    type: Number,
    default: 0
  },
  applicationsSubmitted: {
    type: Number,
    default: 0
  },
  runErrors: [{
    board: String,
    error: String
  }],
  duration: {
    type: Number,
    default: 0
  },
  status: {
    type: String,
    enum: ['running', 'completed', 'partial', 'failed'],
    default: 'running'
  }
}, {
  timestamps: true
});

AutomationRunSchema.index({ user: 1, runDate: -1 });

export default mongoose.models.AutomationRun || mongoose.model('AutomationRun', AutomationRunSchema);
