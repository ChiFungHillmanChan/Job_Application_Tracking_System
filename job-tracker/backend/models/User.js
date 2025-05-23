// backend/models/User.js - Enhanced version
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const crypto = require('crypto');

const UserSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Please add a name'],
  },
  email: {
    type: String,
    required: [true, 'Please add an email'],
    unique: true,
    match: [
      /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/,
      'Please add a valid email',
    ],
  },
  password: {
    type: String,
    required: [true, 'Please add a password'],
    minlength: 6,
    select: false,
  },
  googleId: {
    type: String,
  },
  appleId: {
    type: String,
  },
  resetPasswordToken: {
    type: String,
  },
  resetPasswordExpire: {
    type: Date,
  },
  passwordChangedAt: {
    type: Date,
    default: null
  },
  preferences: {
    theme: {
      type: String,
      enum: ['light', 'dark', 'system'],
      default: 'system',
    },
    notifications: {
      email: {
        type: Boolean,
        default: true,
      },
      push: {
        type: Boolean,
        default: true,
      },
    },
  },
  subscriptionTier: {
    type: String,
    enum: ['free', 'premium', 'enterprise'],
    default: 'free',
  },
  // Enhanced subscription fields for super users
  subscriptionStatus: {
    type: String,
    enum: ['active', 'inactive', 'cancelled', 'past_due'],
    default: 'active'
  },
  subscriptionStartDate: {
    type: Date,
    default: Date.now
  },
  subscriptionEndDate: {
    type: Date,
    default: null // null means no end date (lifetime)
  },
  isLifetimeSubscription: {
    type: Boolean,
    default: false
  },
  stripeCustomerId: {
    type: String,
    default: null
  },
  stripeSubscriptionId: {
    type: String,
    default: null
  },
  // Usage limits (for super users, set to -1 for unlimited)
  maxResumes: {
    type: Number,
    default: function() {
      switch(this.subscriptionTier) {
        case 'free': return 8;
        case 'premium': return 50;
        case 'enterprise': return -1; // unlimited
        default: return 8;
      }
    }
  },
  maxApplications: {
    type: Number,
    default: function() {
      switch(this.subscriptionTier) {
        case 'free': return 100;
        case 'premium': return 1000;
        case 'enterprise': return -1; // unlimited
        default: return 100;
      }
    }
  },
  // Role for admin access
  role: {
    type: String,
    enum: ['user', 'admin', 'superadmin'],
    default: 'user'
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

// Method to check if subscription is active
UserSchema.methods.isSubscriptionActive = function() {
  if (this.isLifetimeSubscription) return true;
  if (this.subscriptionStatus !== 'active') return false;
  if (this.subscriptionEndDate && new Date() > this.subscriptionEndDate) return false;
  return true;
};

// Method to check if user has unlimited access
UserSchema.methods.hasUnlimitedAccess = function() {
  return this.subscriptionTier === 'enterprise' || this.isLifetimeSubscription;
};

// Method to get current usage limits
UserSchema.methods.getUsageLimits = function() {
  return {
    resumes: this.maxResumes === -1 ? 'unlimited' : this.maxResumes,
    applications: this.maxApplications === -1 ? 'unlimited' : this.maxApplications
  };
};

// Encrypt password using bcrypt
UserSchema.pre('save', async function (next) {
  if (!this.isModified('password')) {
    next();
  }

  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
  
  // If password is modified and it's not a new user, update passwordChangedAt
  if (this.isModified('password') && !this.isNew) {
    this.passwordChangedAt = Date.now();
  }
});

// Update usage limits when subscription tier changes
UserSchema.pre('save', function(next) {
  if (this.isModified('subscriptionTier')) {
    if (this.subscriptionTier === 'enterprise' || this.isLifetimeSubscription) {
      this.maxResumes = -1;
      this.maxApplications = -1;
    } else if (this.subscriptionTier === 'premium') {
      this.maxResumes = 50;
      this.maxApplications = 1000;
    } else {
      this.maxResumes = 8;
      this.maxApplications = 100;
    }
  }
  next();
});

// Match user entered password to hashed password in database
UserSchema.methods.matchPassword = async function (enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

module.exports = mongoose.model('User', UserSchema);