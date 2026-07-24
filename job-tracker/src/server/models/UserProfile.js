// ESM port of backend/models/UserProfile.js
import mongoose from 'mongoose';

const UserProfileSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    unique: true,
    index: true
  },
  rawCvText: {
    type: String,
    select: false
  },
  summary: {
    type: String,
    default: ''
  },
  skills: {
    technical: [String],
    soft: [String],
    languages: [String]
  },
  experience: [{
    title: String,
    company: String,
    duration: String,
    highlights: [String]
  }],
  education: [{
    degree: String,
    institution: String,
    year: String
  }],
  certifications: [String],
  preferredRoles: [String],
  seniorityLevel: {
    type: String,
    enum: ['entry', 'junior', 'mid', 'senior', 'lead', 'principal', 'executive'],
    default: 'mid'
  },
  lastAnalyzedAt: {
    type: Date,
    default: null
  },
  cvFileRef: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Resume',
    default: null
  }
}, {
  timestamps: true
});

export default mongoose.models.UserProfile || mongoose.model('UserProfile', UserProfileSchema);
