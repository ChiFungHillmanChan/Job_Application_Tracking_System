const mongoose = require('mongoose');

const JobSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  company: {
    type: String,
    required: [true, 'Please add a company name'],
  },
  position: {
    type: String,
    required: [true, 'Please add a position'],
  },
  location: {
    type: String,
    required: [true, 'Please add a location'],
  },
  jobType: {
    type: String,
    enum: ['Full-time', 'Part-time', 'Contract', 'Internship', 'Remote', 'Other'],
    default: 'Full-time',
  },
  applicationDate: {
    type: Date,
    default: Date.now,
  },
  status: {
    type: String,
    enum: [
      'Saved',
      'Applied',
      'Phone Screen',
      'Interview',
      'Technical Assessment',
      'Offer',
      'Rejected',
      'Withdrawn',
    ],
    default: 'Saved',
  },
  description: {
    type: String,
  },
  salary: {
    type: String,
  },
  url: {
    type: String,
  },
  contactName: {
    type: String,
  },
  contactEmail: {
    type: String,
  },
  contactPhone: {
    type: String,
  },
  notes: {
    type: String,
  },
  resume: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Resume',
  },
  tags: [String],
  createdAt: {
    type: Date,
    default: Date.now,
  },
  updatedAt: {
    type: Date,
    default: Date.now,
  },
});

module.exports = mongoose.model('Job', JobSchema);