const mongoose = require('mongoose');

const SavedJobSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'User is required'],
    index: true
  },
  externalId: {
    type: String,
    required: [true, 'External job ID is required'],
    index: true
  },
  source: {
    type: String,
    required: [true, 'Job source is required'],
    enum: ['reed', 'adzuna', 'indeed', 'other'],
    default: 'reed'
  },
  title: {
    type: String,
    required: [true, 'Job title is required'],
    trim: true,
    maxlength: [200, 'Job title cannot exceed 200 characters']
  },
  company: {
    type: String,
    required: [true, 'Company name is required'],
    trim: true,
    maxlength: [100, 'Company name cannot exceed 100 characters']
  },
  location: {
    display: {
      type: String,
      required: [true, 'Location display is required'],
      trim: true
    },
    coordinates: {
      lat: {
        type: Number,
        required: false,
        min: [-90, 'Latitude must be between -90 and 90'],
        max: [90, 'Latitude must be between -90 and 90']
      },
      lng: {
        type: Number,
        required: false,
        min: [-180, 'Longitude must be between -180 and 180'],
        max: [180, 'Longitude must be between -180 and 180']
      }
    },
    postcode: String,
    region: String,
    country: {
      type: String,
      default: 'UK'
    }
  },
  salary: {
    min: {
      type: Number,
      min: [0, 'Minimum salary cannot be negative']
    },
    max: {
      type: Number,
      min: [0, 'Maximum salary cannot be negative']
    },
    currency: {
      type: String,
      default: 'GBP',
      enum: ['GBP', 'USD', 'EUR']
    },
    period: {
      type: String,
      enum: ['annual', 'monthly', 'daily', 'hourly'],
      default: 'annual'
    },
    display: String 
  },
  jobType: {
    type: String,
    required: [true, 'Job type is required'],
    enum: ['permanent', 'contract', 'temporary', 'part-time', 'full-time', 'internship'],
    default: 'permanent'
  },
  workType: {
    type: String,
    enum: ['onsite', 'remote', 'hybrid'],
    default: 'onsite'
  },
  description: {
    type: String,
    required: [true, 'Job description is required'],
    maxlength: [5000, 'Description cannot exceed 5000 characters']
  },
  requirements: [String], 
  benefits: [String],
  applicationUrl: {
    type: String,
    required: [true, 'Application URL is required'],
    validate: {
      validator: function(v) {
        return /^https?:\/\/.+/.test(v);
      },
      message: 'Application URL must be a valid HTTP/HTTPS URL'
    }
  },
  companyUrl: String,
  logoUrl: String,
  postedDate: {
    type: Date,
    required: [true, 'Posted date is required']
  },
  expirationDate: Date,
  savedAt: {
    type: Date,
    default: Date.now,
    index: true
  },
  tags: [{
    type: String,
    trim: true,
    maxlength: [50, 'Tag cannot exceed 50 characters']
  }], 
  notes: {
    type: String,
    maxlength: [1000, 'Notes cannot exceed 1000 characters']
  },
  importedToTracker: {
    type: Boolean,
    default: false
  },
  importedJobId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Job',
    default: null
  },
  importedAt: Date,
  originalData: {
    type: mongoose.Schema.Types.Mixed,
    select: false 
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

SavedJobSchema.index({ user: 1, savedAt: -1 });
SavedJobSchema.index({ user: 1, source: 1, externalId: 1 }, { unique: true });
SavedJobSchema.index({ 'location.coordinates': '2dsphere' }); 
SavedJobSchema.index({ postedDate: -1 });
SavedJobSchema.index({ expirationDate: 1 });

SavedJobSchema.virtual('daysSaved').get(function() {
  return Math.floor((Date.now() - this.savedAt) / (1000 * 60 * 60 * 24));
});

SavedJobSchema.virtual('isExpired').get(function() {
  return this.expirationDate && this.expirationDate < new Date();
});

SavedJobSchema.virtual('formattedSalary').get(function() {
  if (!this.salary || (!this.salary.min && !this.salary.max)) {
    return 'Salary not specified';
  }
  
  const formatAmount = (amount) => {
    if (this.salary.currency === 'GBP') {
      return `£${amount.toLocaleString()}`;
    }
    return `${this.salary.currency} ${amount.toLocaleString()}`;
  };
  
  if (this.salary.min && this.salary.max) {
    return `${formatAmount(this.salary.min)} - ${formatAmount(this.salary.max)} ${this.salary.period}`;
  } else if (this.salary.min) {
    return `From ${formatAmount(this.salary.min)} ${this.salary.period}`;
  } else if (this.salary.max) {
    return `Up to ${formatAmount(this.salary.max)} ${this.salary.period}`;
  }
  
  return this.salary.display || 'Competitive salary';
});

SavedJobSchema.statics.getUserSavedCount = async function(userId) {
  return await this.countDocuments({ user: userId });
};

SavedJobSchema.statics.canUserSaveMore = async function(userId, userTier) {
  const count = await this.getUserSavedCount(userId);
  
  if (userTier === 'free') {
    return count < 5;
  }
  
  return true;
};


SavedJobSchema.statics.findNearLocation = function(userId, lat, lng, maxDistance = 25000) {
  return this.find({
    user: userId,
    'location.coordinates': {
      $near: {
        $geometry: {
          type: 'Point',
          coordinates: [lng, lat]
        },
        $maxDistance: maxDistance
      }
    }
  });
};

SavedJobSchema.methods.canImport = function() {
  return !this.importedToTracker && !this.isExpired;
};

SavedJobSchema.pre('save', function(next) {
  if (this.location.coordinates.lat && this.location.coordinates.lng) {
    this.location.coordinates = {
      lat: this.location.coordinates.lat,
      lng: this.location.coordinates.lng
    };
  }
  

  if (this.tags) {
    this.tags = this.tags
      .filter(tag => tag && tag.trim())
      .map(tag => tag.trim().toLowerCase())
      .slice(0, 10); 
  }
  
  next();
});

SavedJobSchema.pre('remove', function(next) {
  next();
});

module.exports = mongoose.model('SavedJob', SavedJobSchema);