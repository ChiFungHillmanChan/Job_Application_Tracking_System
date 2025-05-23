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
  subscriptionStatus: {
    type: String,
    enum: ['active', 'cancelled', 'past_due', 'unpaid', 'trialing'],
    default: 'active',
  },
  stripeCustomerId: {
    type: String,
    default: null,
  },
  stripeSubscriptionId: {
    type: String,
    default: null,
  },
  subscriptionStartDate: {
    type: Date,
    default: null,
  },
  subscriptionEndDate: {
    type: Date,
    default: null,
  },
  billingCycle: {
    type: String,
    enum: ['monthly', 'annual'],
    default: 'monthly',
  },
  trialEndsAt: {
    type: Date,
    default: null,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

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

// Update subscription start date when tier changes
UserSchema.pre('save', function (next) {
  if (this.isModified('subscriptionTier') && !this.isNew) {
    // If upgrading from free to paid tier
    if (this.subscriptionTier !== 'free' && !this.subscriptionStartDate) {
      this.subscriptionStartDate = new Date();
    }
    
    // If downgrading to free tier
    if (this.subscriptionTier === 'free') {
      this.subscriptionEndDate = new Date();
    }
  }
  next();
});

// Match user entered password to hashed password in database
UserSchema.methods.matchPassword = async function (enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

// Check if user has access to a feature based on subscription tier
UserSchema.methods.hasFeatureAccess = function (feature) {
  const featureMap = {
    unlimited_resumes: ['premium', 'enterprise'],
    unlimited_jobs: ['premium', 'enterprise'],
    ai_features: ['enterprise'],
    priority_support: ['premium', 'enterprise'],
    personal_consultation: ['enterprise'],
    beta_access: ['enterprise'],
    advanced_analytics: ['premium', 'enterprise'],
    api_access: ['enterprise']
  };
  
  return featureMap[feature] ? featureMap[feature].includes(this.subscriptionTier) : false;
};

// Get subscription plan limits
UserSchema.methods.getPlanLimits = function () {
  const limits = {
    free: {
      resumes: 8,
      jobApplicationsPerMonth: 50,
      storageGB: 1,
      supportLevel: 'standard'
    },
    premium: {
      resumes: Infinity,
      jobApplicationsPerMonth: Infinity,
      storageGB: 10,
      supportLevel: 'priority'
    },
    enterprise: {
      resumes: Infinity,
      jobApplicationsPerMonth: Infinity,
      storageGB: 100,
      supportLevel: 'dedicated',
      aiFeatures: true,
      personalConsultation: true,
      betaAccess: true
    }
  };
  
  return limits[this.subscriptionTier] || limits.free;
};

// Check if subscription is active
UserSchema.methods.isSubscriptionActive = function () {
  return this.subscriptionStatus === 'active' || this.subscriptionStatus === 'trialing';
};

// Check if user is on trial
UserSchema.methods.isOnTrial = function () {
  return this.subscriptionStatus === 'trialing' && 
         this.trialEndsAt && 
         this.trialEndsAt > new Date();
};

// Get days remaining in trial
UserSchema.methods.getTrialDaysRemaining = function () {
  if (!this.isOnTrial()) return 0;
  
  const now = new Date();
  const trialEnd = new Date(this.trialEndsAt);
  const diffTime = trialEnd - now;
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  
  return Math.max(0, diffDays);
};

module.exports = mongoose.model('User', UserSchema);