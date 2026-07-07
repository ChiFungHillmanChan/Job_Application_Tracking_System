const mongoose = require('mongoose');

const PreparedApplicationSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  savedJob: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'SavedJob',
    required: true
  },
  matchScore: {
    type: Number,
    min: 0,
    max: 100,
    default: 0
  },
  matchReasoning: {
    type: String,
    default: ''
  },
  status: {
    type: String,
    enum: ['pending_review', 'approved', 'rejected', 'submitted', 'failed'],
    default: 'pending_review',
    index: true
  },
  coverLetter: {
    type: String,
    default: ''
  },
  applicationAnswers: [{
    question: String,
    answer: String
  }],
  cvToUse: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Resume',
    default: null
  },
  aiNotes: {
    type: String,
    default: ''
  },
  userNotes: {
    type: String,
    default: ''
  },
  reviewedAt: {
    type: Date,
    default: null
  },
  submittedAt: {
    type: Date,
    default: null
  },
  submissionResult: {
    success: { type: Boolean, default: null },
    message: { type: String, default: '' },
    confirmationUrl: { type: String, default: '' }
  }
}, {
  timestamps: true
});

PreparedApplicationSchema.index({ user: 1, status: 1 });
PreparedApplicationSchema.index({ user: 1, createdAt: -1 });
PreparedApplicationSchema.index({ user: 1, savedJob: 1 }, { unique: true });

module.exports = mongoose.model('PreparedApplication', PreparedApplicationSchema);
