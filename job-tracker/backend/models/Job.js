const mongoose = require('mongoose');

const JobSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'User is required'],
    index: true
  },
  company: {
    type: String,
    required: [true, 'Company name is required'],
    trim: true,
    maxlength: [100, 'Company name cannot exceed 100 characters']
  },
  position: {
    type: String,
    required: [true, 'Position is required'],
    trim: true,
    maxlength: [200, 'Position cannot exceed 200 characters']
  },
  location: {
    type: String,
    required: [true, 'Location is required'],
    trim: true,
    maxlength: [200, 'Location cannot exceed 200 characters']
  },
  applicationUrl: {
    type: String,
    validate: {
      validator: function(v) {
        return !v || /^https?:\/\/.+/.test(v);
      },
      message: 'Application URL must be a valid HTTP/HTTPS URL'
    }
  },
  status: {
    type: String,
    required: [true, 'Status is required'],
    enum: [
      'Saved',
      'Applied', 
      'Phone Screen',
      'Interview',
      'Technical Assessment',
      'Offer',
      'Rejected',
      'Withdrawn'
    ],
    default: 'Saved'
  },
  priority: {
    type: String,
    enum: ['Low', 'Medium', 'High'],
    default: 'Medium'
  },
  salary: {
    type: String,
    trim: true,
    maxlength: [100, 'Salary cannot exceed 100 characters']
  },
  jobType: {
    type: String,
    enum: ['permanent', 'contract', 'temporary', 'part-time', 'full-time', 'internship'],
    default: 'permanent'
  },
  // NEW: Work arrangement type
  workType: {
    type: String,
    enum: ['onsite', 'remote', 'hybrid'],
    default: 'onsite'
  },
  description: {
    type: String,
    maxlength: [5000, 'Description cannot exceed 5000 characters']
  },
  requirements: {
    type: String,
    maxlength: [3000, 'Requirements cannot exceed 3000 characters']
  },
  notes: {
    type: String,
    maxlength: [2000, 'Notes cannot exceed 2000 characters']
  },
  tags: [{
    type: String,
    trim: true,
    maxlength: [50, 'Tag cannot exceed 50 characters']
  }],
  
  // Contact information
  contactPerson: {
    name: {
      type: String,
      trim: true,
      maxlength: [100, 'Contact name cannot exceed 100 characters']
    },
    email: {
      type: String,
      trim: true,
      lowercase: true,
      validate: {
        validator: function(v) {
          return !v || /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/.test(v);
        },
        message: 'Please enter a valid email address'
      }
    },
    phone: {
      type: String,
      trim: true,
      maxlength: [20, 'Phone number cannot exceed 20 characters']
    },
    title: {
      type: String,
      trim: true,
      maxlength: [100, 'Contact title cannot exceed 100 characters']
    }
  },
  
  // Important dates
  applicationDate: {
    type: Date,
    default: null
  },
  followUpDate: {
    type: Date,
    default: null
  },
  interviewDate: {
    type: Date,
    default: null
  },
  responseDate: {
    type: Date,
    default: null
  },
  deadlineDate: {
    type: Date,
    default: null
  },
  
  // Resume and documents
  resumeUsed: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Resume',
    default: null
  },
  coverLetter: {
    type: String,
    maxlength: [3000, 'Cover letter cannot exceed 3000 characters']
  },
  documents: [{
    name: {
      type: String,
      required: true,
      trim: true
    },
    url: {
      type: String,
      required: true
    },
    type: {
      type: String,
      enum: ['resume', 'cover_letter', 'portfolio', 'certificate', 'other'],
      default: 'other'
    },
    uploadedAt: {
      type: Date,
      default: Date.now
    }
  }],
  
  // NEW: External job integration fields
  source: {
    type: String,
    enum: ['manual', 'reed', 'adzuna', 'indeed', 'linkedin', 'other'],
    default: 'manual',
    index: true
  },
  externalId: {
    type: String,
    sparse: true, // Allow null values but enforce uniqueness when present
    index: true
  },
  externalUrl: {
    type: String,
    validate: {
      validator: function(v) {
        return !v || /^https?:\/\/.+/.test(v);
      },
      message: 'External URL must be a valid HTTP/HTTPS URL'
    }
  },
  importedAt: {
    type: Date,
    default: null
  },
  importedFromSaved: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'SavedJob',
    default: null,
    index: true
  },
  
  // Activity tracking
  activities: [{
    type: {
      type: String,
      required: true,
      enum: [
        'status_change',
        'note_added',
        'interview_scheduled',
        'follow_up',
        'document_uploaded',
        'contact_made',
        'offer_received',
        'application_submitted',
        'imported_from_finder'
      ]
    },
    description: {
      type: String,
      required: true,
      maxlength: [500, 'Activity description cannot exceed 500 characters']
    },
    date: {
      type: Date,
      default: Date.now
    },
    metadata: {
      type: mongoose.Schema.Types.Mixed // For storing additional activity data
    }
  }],
  
  // Company information
  companyInfo: {
    website: {
      type: String,
      validate: {
        validator: function(v) {
          return !v || /^https?:\/\/.+/.test(v);
        },
        message: 'Website must be a valid HTTP/HTTPS URL'
      }
    },
    size: {
      type: String,
      enum: ['startup', 'small', 'medium', 'large', 'enterprise']
    },
    industry: {
      type: String,
      trim: true,
      maxlength: [100, 'Industry cannot exceed 100 characters']
    },
    description: {
      type: String,
      maxlength: [1000, 'Company description cannot exceed 1000 characters']
    },
    logoUrl: {
      type: String,
      validate: {
        validator: function(v) {
          return !v || /^https?:\/\/.+/.test(v);
        },
        message: 'Logo URL must be a valid HTTP/HTTPS URL'
      }
    }
  },
  
  // Interview details
  interviews: [{
    type: {
      type: String,
      enum: ['phone', 'video', 'onsite', 'technical', 'panel', 'informal'],
      required: true
    },
    scheduledDate: {
      type: Date,
      required: true
    },
    duration: {
      type: Number, // Duration in minutes
      min: [15, 'Interview duration must be at least 15 minutes'],
      max: [480, 'Interview duration cannot exceed 8 hours']
    },
    location: {
      type: String,
      trim: true
    },
    interviewers: [{
      name: {
        type: String,
        trim: true
      },
      title: {
        type: String,
        trim: true
      },
      email: {
        type: String,
        trim: true,
        lowercase: true
      }
    }],
    notes: {
      type: String,
      maxlength: [2000, 'Interview notes cannot exceed 2000 characters']
    },
    feedback: {
      type: String,
      maxlength: [2000, 'Interview feedback cannot exceed 2000 characters']
    },
    outcome: {
      type: String,
      enum: ['pending', 'passed', 'failed', 'cancelled'],
      default: 'pending'
    },
    createdAt: {
      type: Date,
      default: Date.now
    }
  }],
  
  // Offer details
  offer: {
    salary: {
      amount: {
        type: Number,
        min: [0, 'Salary amount cannot be negative']
      },
      currency: {
        type: String,
        enum: ['GBP', 'USD', 'EUR'],
        default: 'GBP'
      },
      period: {
        type: String,
        enum: ['hourly', 'daily', 'monthly', 'annual'],
        default: 'annual'
      }
    },
    benefits: [{
      type: String,
      trim: true
    }],
    startDate: {
      type: Date
    },
    responseDeadline: {
      type: Date
    },
    negotiable: {
      type: Boolean,
      default: false
    },
    notes: {
      type: String,
      maxlength: [1000, 'Offer notes cannot exceed 1000 characters']
    },
    status: {
      type: String,
      enum: ['pending', 'accepted', 'declined', 'negotiating', 'expired'],
      default: 'pending'
    },
    receivedAt: {
      type: Date,
      default: null
    }
  },
  
  // Analytics and tracking
  analytics: {
    viewCount: {
      type: Number,
      default: 0
    },
    lastViewed: {
      type: Date,
      default: null
    },
    timeSpent: {
      type: Number, // Total time spent on this application in minutes
      default: 0
    }
  },
  
  // Metadata for external jobs
  originalData: {
    type: mongoose.Schema.Types.Mixed,
    select: false // Don't include in normal queries
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Indexes for efficient queries
JobSchema.index({ user: 1, createdAt: -1 });
JobSchema.index({ user: 1, status: 1 });
JobSchema.index({ user: 1, company: 1 });
JobSchema.index({ user: 1, followUpDate: 1 });
JobSchema.index({ user: 1, interviewDate: 1 });
JobSchema.index({ user: 1, source: 1, externalId: 1 });
JobSchema.index({ importedFromSaved: 1 });
JobSchema.index({ 'interviews.scheduledDate': 1 });

// Compound index to prevent duplicate external job imports
JobSchema.index(
  { user: 1, source: 1, externalId: 1 }, 
  { 
    unique: true,
    partialFilterExpression: { 
      source: { $ne: 'manual' },
      externalId: { $exists: true, $ne: null }
    }
  }
);

// Virtuals
JobSchema.virtual('isImported').get(function() {
  return this.source !== 'manual';
});

JobSchema.virtual('daysSinceApplication').get(function() {
  if (!this.applicationDate) return null;
  return Math.floor((Date.now() - this.applicationDate) / (1000 * 60 * 60 * 24));
});

JobSchema.virtual('isOverdue').get(function() {
  if (!this.followUpDate) return false;
  return this.followUpDate < new Date() && this.status === 'Applied';
});

JobSchema.virtual('hasUpcomingInterview').get(function() {
  if (!this.interviews || this.interviews.length === 0) return false;
  const now = new Date();
  return this.interviews.some(interview => 
    interview.scheduledDate > now && interview.outcome === 'pending'
  );
});

JobSchema.virtual('nextInterview').get(function() {
  if (!this.interviews || this.interviews.length === 0) return null;
  const now = new Date();
  const upcomingInterviews = this.interviews
    .filter(interview => interview.scheduledDate > now && interview.outcome === 'pending')
    .sort((a, b) => a.scheduledDate - b.scheduledDate);
  
  return upcomingInterviews.length > 0 ? upcomingInterviews[0] : null;
});

JobSchema.virtual('statusColor').get(function() {
  const statusColors = {
    'Saved': 'blue',
    'Applied': 'purple',
    'Phone Screen': 'yellow',
    'Interview': 'yellow',
    'Technical Assessment': 'yellow',
    'Offer': 'green',
    'Rejected': 'red',
    'Withdrawn': 'red'
  };
  return statusColors[this.status] || 'gray';
});

// Static methods
JobSchema.statics.findExistingImport = function(userId, source, externalId) {
  return this.findOne({
    user: userId,
    source: source,
    externalId: externalId
  });
};

JobSchema.statics.getStatusCounts = function(userId) {
  return this.aggregate([
    { $match: { user: mongoose.Types.ObjectId(userId) } },
    { $group: { _id: '$status', count: { $sum: 1 } } },
    { $sort: { _id: 1 } }
  ]);
};

JobSchema.statics.getRecentActivity = function(userId, limit = 10) {
  return this.find({ user: userId })
    .sort({ updatedAt: -1 })
    .limit(limit)
    .select('company position status updatedAt applicationDate')
    .exec();
};

JobSchema.statics.getUpcomingInterviews = function(userId, days = 7) {
  const startDate = new Date();
  const endDate = new Date();
  endDate.setDate(endDate.getDate() + days);
  
  return this.find({
    user: userId,
    'interviews.scheduledDate': {
      $gte: startDate,
      $lte: endDate
    },
    'interviews.outcome': 'pending'
  }).populate('interviews');
};

JobSchema.statics.getOverdueFollowUps = function(userId) {
  return this.find({
    user: userId,
    followUpDate: { $lt: new Date() },
    status: { $in: ['Applied', 'Phone Screen', 'Interview'] }
  }).sort({ followUpDate: 1 });
};

// Instance methods
JobSchema.methods.addActivity = function(type, description, metadata = {}) {
  this.activities.push({
    type,
    description,
    metadata,
    date: new Date()
  });
  return this.save();
};

JobSchema.methods.updateStatus = function(newStatus, note = '') {
  const oldStatus = this.status;
  this.status = newStatus;
  
  // Auto-set application date when status changes to Applied
  if (newStatus === 'Applied' && !this.applicationDate) {
    this.applicationDate = new Date();
  }
  
  // Add activity log
  let description = `Status changed from ${oldStatus} to ${newStatus}`;
  if (note) {
    description += `: ${note}`;
  }
  
  this.addActivity('status_change', description, {
    oldStatus,
    newStatus,
    note
  });
  
  return this.save();
};

JobSchema.methods.scheduleInterview = function(interviewData) {
  this.interviews.push({
    ...interviewData,
    createdAt: new Date()
  });
  
  // Update main interview date for easier querying
  if (!this.interviewDate || interviewData.scheduledDate < this.interviewDate) {
    this.interviewDate = interviewData.scheduledDate;
  }
  
  this.addActivity('interview_scheduled', 
    `${interviewData.type} interview scheduled for ${interviewData.scheduledDate.toLocaleDateString()}`,
    { interviewType: interviewData.type, date: interviewData.scheduledDate }
  );
  
  return this.save();
};

JobSchema.methods.canImport = function() {
  return this.source === 'manual'; // Only manual jobs can be "imported" (meaning they can receive external data)
};

JobSchema.methods.getTimeInCurrentStatus = function() {
  const activities = this.activities
    .filter(activity => activity.type === 'status_change')
    .sort((a, b) => b.date - a.date);
  
  const lastStatusChange = activities.length > 0 ? activities[0].date : this.createdAt;
  return Math.floor((Date.now() - lastStatusChange) / (1000 * 60 * 60 * 24));
};

// Pre-save middleware
JobSchema.pre('save', function(next) {
  // Update analytics
  if (this.isModified() && !this.isNew) {
    this.analytics.lastViewed = new Date();
  }
  
  // Clean up tags
  if (this.tags) {
    this.tags = this.tags
      .filter(tag => tag && tag.trim())
      .map(tag => tag.trim().toLowerCase())
      .slice(0, 10); // Limit to 10 tags
  }
  
  // Ensure external jobs have proper fields
  if (this.source !== 'manual' && !this.externalId) {
    return next(new Error('External jobs must have an external ID'));
  }
  
  next();
});

// Pre-remove middleware
JobSchema.pre('remove', async function(next) {
  try {
    // Clean up related documents if needed
    // Could add logic to handle related resume references, etc.
    next();
  } catch (error) {
    next(error);
  }
});

// Post-save middleware for activity logging
JobSchema.post('save', function(doc, next) {
  // Could add logic for sending notifications, updating dashboards, etc.
  next();
});

module.exports = mongoose.model('Job', JobSchema);