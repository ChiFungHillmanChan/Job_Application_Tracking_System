// backend/models/User.js - Updated subscription tiers

const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

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
    // Enhanced appearance preferences
    appearance: {
      theme: {
        type: String,
        enum: ['light', 'dark', 'system'],
        default: 'system',
      },
      colorScheme: {
        type: String,
        enum: ['default', 'green', 'purple', 'red', 'orange'],
        default: 'default',
      },
      density: {
        type: String,
        enum: ['compact', 'default', 'comfortable'],
        default: 'default',
      },
      fontSize: {
        type: String,
        enum: ['small', 'default', 'large'],
        default: 'default',
      },
      statusColors: {
        type: Object,
        default: {
          'Saved': 'blue',
          'Applied': 'purple',
          'Phone Screen': 'yellow',
          'Interview': 'yellow',
          'Technical Assessment': 'yellow',
          'Offer': 'green',
          'Rejected': 'red',
          'Withdrawn': 'red',
        }
      },
      lastModified: {
        type: Number,
        default: Date.now
      }
    },
    lastModified: {
      type: Number,
      default: Date.now
    },
    updatedAt: {
      type: Date,
      default: Date.now
    }
  },
  // FIXED: Updated subscription tiers to match premium components
  subscriptionTier: {
    type: String,
    enum: ['free', 'plus', 'pro'], 
    default: 'free',
  },
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
    default: null
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
  // Usage limits (for premium users, set to -1 for unlimited)
  maxResumes: {
    type: Number,
    default: function() {
      switch(this.subscriptionTier) {
        case 'free': return 8;
        case 'plus': return -1; 
        case 'pro': return -1; 
        default: return 8;
      }
    }
  },
  maxApplications: {
    type: Number,
    default: function() {
      switch(this.subscriptionTier) {
        case 'free': return 100;
        case 'plus': return -1; // Changed from 1000 to unlimited
        case 'pro': return -1; 
        default: return 100;
      }
    }
  },
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

// Update usage limits when subscription tier changes
UserSchema.pre('save', function(next) {
  if (this.isModified('subscriptionTier')) {
    if (this.subscriptionTier === 'pro' || this.isLifetimeSubscription) {
      this.maxResumes = -1;
      this.maxApplications = -1;
    } else if (this.subscriptionTier === 'plus') {
      this.maxResumes = -1;
      this.maxApplications = -1;
    } else {
      this.maxResumes = 8;
      this.maxApplications = 100;
    }
  }
  next();
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
  return this.subscriptionTier === 'pro' || 
         this.subscriptionTier === 'plus' || 
         this.isLifetimeSubscription;
};

// Method to check if user has premium features
UserSchema.methods.hasPremiumAccess = function() {
  return this.subscriptionTier === 'pro' || 
         this.subscriptionTier === 'plus' || 
         this.isLifetimeSubscription;
};

// Method to get current usage limits
UserSchema.methods.getUsageLimits = function() {
  return {
    resumes: this.maxResumes === -1 ? 'unlimited' : this.maxResumes,
    applications: this.maxApplications === -1 ? 'unlimited' : this.maxApplications
  };
};

// Password hashing and other methods remain the same...
UserSchema.pre('save', async function (next) {
  if (!this.isModified('password')) {
    return next();
  }

  try {
    console.log('🔐 Hashing password for user:', this.email);
    
    if (!this.password || typeof this.password !== 'string') {
      console.log('❌ Invalid password provided:', typeof this.password);
      const error = new Error('Password must be a valid string');
      return next(error);
    }

    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
    
    console.log('✅ Password hashed successfully');
    
    if (this.isModified('password') && !this.isNew) {
      this.passwordChangedAt = Date.now();
    }
    
    next();
  } catch (error) {
    console.log('❌ Error hashing password:', error.message);
    next(error);
  }
});

UserSchema.methods.matchPassword = async function (enteredPassword) {
  try {
    if (!enteredPassword || !this.password) {
      return false;
    }
    return await bcrypt.compare(enteredPassword, this.password);
  } catch (error) {
    console.log('❌ Error in matchPassword:', error.message);
    return false;
  }
};

module.exports = mongoose.model('User', UserSchema);