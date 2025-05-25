// backend/controllers/authController.js - Fixed version with proper preference handling

const User = require('../models/User');
const asyncHandler = require('express-async-handler');
const { generateResetPasswordToken, verifyToken } = require('../utils/tokenManager');
const crypto = require('crypto');
const logger = require('../utils/logger');
const { sendPasswordResetEmail } = require('../utils/sendEmail');

const generateToken = (user) => {
  const jwt = require('jsonwebtoken');
  return jwt.sign(
    {
      id: user._id,
      name: user.name,
      email: user.email,
      subscriptionTier: user.subscriptionTier
    },
    process.env.JWT_SECRET,
    {
      expiresIn: process.env.JWT_EXPIRE || '30d'
    }
  );
};

// @desc    Register user
// @route   POST /api/auth/register
// @access  Public
const registerUser = asyncHandler(async (req, res) => {
  const { name, email, password } = req.body;

  // Input validation
  if (!name || !email || !password) {
    logger.warn('Registration attempt with missing required fields');
    return res.status(400).json({
      success: false,
      error: 'Please provide name, email, and password'
    });
  }

  if (password.length < 6) {
    logger.warn(`Registration attempt with short password for email: ${email}`);
    return res.status(400).json({
      success: false,
      error: 'Password must be at least 6 characters'
    });
  }

  // Check if user already exists
  const userExists = await User.findOne({ email });

  if (userExists) {
    logger.warn(`Registration attempt with existing email: ${email}`);
    return res.status(400).json({
      success: false,
      error: 'User already exists'
    });
  }

  try {
    // Create user
    const user = await User.create({
      name,
      email,
      password
    });

    logger.info(`New user registered: ${email}`);
    
    res.status(201).json({
      success: true,
      token: generateToken(user),
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        subscriptionTier: user.subscriptionTier,
        createdAt: user.createdAt
      }
    });
  } catch (error) {
    logger.error(`Error during user registration: ${error.message}`);
    
    // Handle mongoose validation errors
    if (error.name === 'ValidationError') {
      const messages = Object.values(error.errors).map(val => val.message);
      return res.status(400).json({
        success: false,
        error: messages
      });
    }
    
    res.status(500).json({
      success: false,
      error: 'Server error during registration'
    });
  }
});

// @desc    Login user
// @route   POST /api/auth/login
// @access  Public
const loginUser = asyncHandler(async (req, res) => {
  const { email, password } = req.body;

  // Input validation
  if (!email || !password) {
    logger.warn('Login attempt with missing email or password');
    return res.status(400).json({
      success: false,
      error: 'Please provide email and password'
    });
  }

  // Find user
  const user = await User.findOne({ email }).select('+password');

  if (!user) {
    logger.warn(`Failed login attempt for non-existent email: ${email}`);
    return res.status(401).json({
      success: false,
      error: 'Invalid credentials'
    });
  }

  // Check if password matches
  const isMatch = await user.matchPassword(password);
  if (!isMatch) {
    logger.warn(`Failed login attempt (password mismatch) for email: ${email}`);
    return res.status(401).json({
      success: false,
      error: 'Invalid credentials'
    });
  }

  logger.info(`User logged in: ${email}`);
  
  res.status(200).json({
    success: true,
    token: generateToken(user),
    user: {
      id: user._id,
      name: user.name,
      email: user.email,
      subscriptionTier: user.subscriptionTier,
      createdAt: user.createdAt
    }
  });
});

// @desc    Get current logged in user with full preferences
// @route   GET /api/auth/me
// @access  Private
const getMe = asyncHandler(async (req, res) => {
  try {
    // Get user with all data
    const user = await User.findById(req.user._id);
    
    if (!user) {
      logger.error(`User not found in getMe: ${req.user._id}`);
      return res.status(404).json({
        success: false,
        error: 'User not found'
      });
    }

    // Ensure preferences exist with defaults
    const defaultPreferences = {
      theme: 'system',
      notifications: {
        email: true,
        push: true,
      },
      appearance: {
        theme: 'system',
        colorScheme: 'default',
        density: 'default',
        fontSize: 'default',
        statusColors: {
          'Saved': 'blue',
          'Applied': 'purple',
          'Phone Screen': 'yellow',
          'Interview': 'yellow',
          'Technical Assessment': 'yellow',
          'Offer': 'green',
          'Rejected': 'red',
          'Withdrawn': 'red',
        }
      }
    };

    const userPreferences = user.preferences || defaultPreferences;
    
    logger.info(`Retrieved user profile: ${user.email}`);
    
    res.status(200).json({
      success: true,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        subscriptionTier: user.subscriptionTier,
        preferences: userPreferences,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt
      }
    });
  } catch (error) {
    logger.error(`Error in getMe: ${error.message}`);
    res.status(500).json({
      success: false,
      error: 'Failed to retrieve user information'
    });
  }
});

// @desc    Logout user (clear cookie)
// @route   GET /api/auth/logout
// @access  Private
const logoutUser = asyncHandler(async (req, res) => {
  logger.info(`User logged out: ${req.user.email}`);
  
  res.status(200).json({
    success: true,
    message: 'Logged out successfully'
  });
});

// @desc    Update user profile with enhanced preferences support
// @route   PUT /api/auth/updateprofile
// @access  Private
const updateProfile = asyncHandler(async (req, res) => {
  const { name, email, preferences } = req.body;
  
  try {
    // Find user by ID
    const user = await User.findById(req.user.id);
    
    if (!user) {
      logger.error(`User not found for profile update: ${req.user.id}`);
      return res.status(404).json({
        success: false,
        error: 'User not found'
      });
    }
    
    // Update basic fields
    if (name && name.trim()) {
      user.name = name.trim();
    }
    
    if (email && email !== user.email) {
      // Validate email format
      const emailRegex = /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/;
      if (!emailRegex.test(email)) {
        return res.status(400).json({
          success: false,
          error: 'Please provide a valid email address'
        });
      }
      
      // Check if email is already in use by another user
      const emailExists = await User.findOne({ email });
      if (emailExists && emailExists._id.toString() !== req.user.id) {
        logger.warn(`Profile update attempt with existing email: ${email}`);
        return res.status(400).json({
          success: false,
          error: 'Email already in use'
        });
      }
      user.email = email;
    }
    
    // Update preferences with proper validation and merging
    if (preferences && typeof preferences === 'object') {
      // Initialize preferences if they don't exist
      if (!user.preferences) {
        user.preferences = {
          theme: 'system',
          notifications: {
            email: true,
            push: true,
          }
        };
      }
      
      // Handle appearance preferences with validation
      if (preferences.appearance) {
        const validatedAppearance = validateAppearanceSettings(preferences.appearance);
        user.preferences.appearance = validatedAppearance;
        user.preferences.lastModified = preferences.lastModified || Date.now();
        
        logger.info(`Appearance preferences updated for user: ${user.email}`, {
          theme: validatedAppearance.theme,
          colorScheme: validatedAppearance.colorScheme,
          density: validatedAppearance.density,
          fontSize: validatedAppearance.fontSize
        });
      }
      
      // Handle other preference updates
      if (preferences.theme && ['light', 'dark', 'system'].includes(preferences.theme)) {
        user.preferences.theme = preferences.theme;
      }
      
      if (preferences.notifications && typeof preferences.notifications === 'object') {
        user.preferences.notifications = {
          ...user.preferences.notifications,
          ...preferences.notifications
        };
      }
      
      // Add timestamp for last preference update
      user.preferences.updatedAt = new Date();
    }
    
    // Save user with validation
    await user.save();
    
    logger.info(`Profile updated successfully for user: ${user.email}`, {
      updatedFields: {
        name: !!name,
        email: !!email,
        preferences: !!preferences
      }
    });
    
    res.status(200).json({
      success: true,
      message: 'Profile updated successfully',
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        subscriptionTier: user.subscriptionTier,
        preferences: user.preferences,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt
      }
    });
    
  } catch (error) {
    logger.error(`Error saving profile update for user ${req.user.email}:`, error);
    
    if (error.name === 'ValidationError') {
      const messages = Object.values(error.errors).map(val => val.message);
      return res.status(400).json({
        success: false,
        error: messages.join(', ')
      });
    }
    
    return res.status(500).json({
      success: false,
      error: 'Failed to update profile. Please try again.'
    });
  }
});

// @desc    Get user preferences only
// @route   GET /api/auth/preferences
// @access  Private
const getPreferences = asyncHandler(async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    
    if (!user) {
      return res.status(404).json({
        success: false,
        error: 'User not found'
      });
    }
    
    const defaultPreferences = {
      theme: 'system',
      notifications: {
        email: true,
        push: true,
      },
      appearance: {
        theme: 'system',
        colorScheme: 'default',
        density: 'default',
        fontSize: 'default',
        statusColors: {
          'Saved': 'blue',
          'Applied': 'purple',
          'Phone Screen': 'yellow',
          'Interview': 'yellow',
          'Technical Assessment': 'yellow',
          'Offer': 'green',
          'Rejected': 'red',
          'Withdrawn': 'red',
        }
      }
    };
    
    res.status(200).json({
      success: true,
      preferences: user.preferences || defaultPreferences,
      lastModified: user.preferences?.lastModified || user.updatedAt
    });
  } catch (error) {
    logger.error(`Error getting preferences: ${error.message}`);
    res.status(500).json({
      success: false,
      error: 'Failed to retrieve preferences'
    });
  }
});

// @desc    Update user preferences only
// @route   PUT /api/auth/preferences
// @access  Private
const updatePreferences = asyncHandler(async (req, res) => {
  const { preferences } = req.body;
  
  if (!preferences || typeof preferences !== 'object') {
    return res.status(400).json({
      success: false,
      error: 'Valid preferences object is required'
    });
  }
  
  try {
    const user = await User.findById(req.user._id);
    
    if (!user) {
      return res.status(404).json({
        success: false,
        error: 'User not found'
      });
    }
    
    // Initialize preferences if they don't exist
    if (!user.preferences) {
      user.preferences = {
        theme: 'system',
        notifications: {
          email: true,
          push: true,
        }
      };
    }
    
    // Update preferences with validation
    if (preferences.appearance) {
      const validatedAppearance = validateAppearanceSettings(preferences.appearance);
      user.preferences.appearance = validatedAppearance;
    }
    
    if (preferences.theme && ['light', 'dark', 'system'].includes(preferences.theme)) {
      user.preferences.theme = preferences.theme;
    }
    
    if (preferences.notifications && typeof preferences.notifications === 'object') {
      user.preferences.notifications = {
        ...user.preferences.notifications,
        ...preferences.notifications
      };
    }
    
    // Add timestamps
    user.preferences.lastModified = Date.now();
    user.preferences.updatedAt = new Date();
    
    await user.save();
    
    logger.info(`Preferences updated for user: ${user.email}`);
    
    res.status(200).json({
      success: true,
      message: 'Preferences updated successfully',
      preferences: user.preferences,
      lastModified: user.preferences.lastModified
    });
    
  } catch (error) {
    logger.error(`Error updating preferences for user ${req.user.email}:`, error);
    
    return res.status(500).json({
      success: false,
      error: 'Failed to update preferences. Please try again.'
    });
  }
});

// @desc    Forgot password
// @route   POST /api/auth/forgotpassword
// @access  Public
const forgotPassword = asyncHandler(async (req, res) => {
  const { email } = req.body;

  // Input validation
  if (!email) {
    logger.warn('Forgot password attempt without email');
    return res.status(400).json({
      success: false,
      error: 'Please provide an email address'
    });
  }

  // Email format validation
  const emailRegex = /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/;
  if (!emailRegex.test(email)) {
    logger.warn(`Forgot password attempt with invalid email format: ${email}`);
    return res.status(400).json({
      success: false,
      error: 'Please provide a valid email address'
    });
  }

  try {
    const user = await User.findOne({ email });

    if (!user) {
      logger.warn(`Password reset attempt for non-existent email: ${email}`);
      // For security reasons, don't reveal whether the email exists or not
      return res.status(200).json({
        success: true,
        data: 'If an account with that email exists, we have sent a password reset link.'
      });
    }

    // Get reset token
    const { resetToken, resetPasswordToken, resetPasswordExpire } = generateResetPasswordToken();

    // Save the hashed token to the database
    await User.findByIdAndUpdate(user._id, {
      resetPasswordToken,
      resetPasswordExpire
    });

    // Create reset URL - use frontend URL for better UX
    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
    const resetUrl = `${frontendUrl}/auth/resetpassword/${resetToken}`;

    try {
      // Send password reset email with enhanced template
      const emailResult = await sendPasswordResetEmail(
        user.email,
        resetUrl,
        user.name
      );

      logger.info(`Password reset email sent successfully to: ${user.email}`);
      
      // Success response (don't reveal if email was sent or not for security)
      res.status(200).json({
        success: true,
        data: 'If an account with that email exists, we have sent a password reset link.',
        // Include preview URL in development for testing
        ...(process.env.NODE_ENV === 'development' && emailResult.previewUrl && {
          previewUrl: emailResult.previewUrl
        })
      });

    } catch (emailError) {
      logger.error(`Failed to send password reset email to ${user.email}: ${emailError.message}`);
      
      // Clear the reset token if email failed to send
      await User.findByIdAndUpdate(user._id, {
        resetPasswordToken: undefined,
        resetPasswordExpire: undefined
      });

      return res.status(500).json({
        success: false,
        error: 'Email service is currently unavailable. Please try again later.'
      });
    }

  } catch (error) {
    logger.error(`Forgot password error: ${error.message}`);
    res.status(500).json({
      success: false,
      error: 'An error occurred while processing your request. Please try again later.'
    });
  }
});

// @desc    Reset password
// @route   PUT /api/auth/resetpassword/:resettoken
// @access  Public
const resetPassword = asyncHandler(async (req, res) => {
  const { password } = req.body;
  const { resettoken } = req.params;

  console.log('🔐 Password reset attempt for token:', resettoken?.substring(0, 8) + '...');
  console.log('🔐 Password provided:', password ? 'Yes' : 'No');
  console.log('🔐 Password length:', password?.length);

  // Input validation
  if (!password) {
    logger.warn('Password reset attempt without password');
    return res.status(400).json({
      success: false,
      error: 'Please provide a new password'
    });
  }

  if (password.length < 6) {
    logger.warn('Password reset attempt with short password');
    return res.status(400).json({
      success: false,
      error: 'Password must be at least 6 characters long'
    });
  }

  if (!resettoken) {
    logger.warn('Password reset attempt without reset token');
    return res.status(400).json({
      success: false,
      error: 'Invalid reset token'
    });
  }

  try {
    // Get hashed token
    const resetPasswordToken = crypto
      .createHash('sha256')
      .update(resettoken)
      .digest('hex');

    console.log('🔍 Looking for user with hashed token:', resetPasswordToken.substring(0, 8) + '...');

    // Find user with valid reset token that hasn't expired
    const user = await User.findOne({
      resetPasswordToken,
      resetPasswordExpire: { $gt: Date.now() }
    });

    if (!user) {
      logger.warn(`Invalid or expired password reset token used: ${resettoken.substring(0, 8)}...`);
      return res.status(400).json({
        success: false,
        error: 'Invalid or expired reset token. Please request a new password reset.'
      });
    }

    console.log('✅ User found:', user.email);

    // FIXED: Check if new password is different from current password
    try {
      const isSamePassword = await user.matchPassword(password);
      if (isSamePassword) {
        logger.warn(`User ${user.email} attempted to reset password with same password`);
        return res.status(400).json({
          success: false,
          error: 'New password must be different from your current password'
        });
      }
    } catch (matchError) {
      // If matchPassword fails, continue - it might be due to the old password format
      console.log('⚠️ matchPassword check failed, continuing with reset:', matchError.message);
    }

    console.log('🔄 Setting new password...');

    // FIXED: Set new password properly
    user.password = password; // The pre-save hook will hash it
    user.resetPasswordToken = undefined;
    user.resetPasswordExpire = undefined;
    user.passwordChangedAt = Date.now();
    
    // FIXED: Save user and handle bcrypt errors
    try {
      await user.save();
      console.log('✅ Password saved successfully');
    } catch (saveError) {
      console.log('❌ Error saving user:', saveError.message);
      
      if (saveError.message.includes('Illegal arguments')) {
        // Handle bcrypt error
        return res.status(500).json({
          success: false,
          error: 'Error processing password. Please try again.'
        });
      }
      
      throw saveError;
    }

    logger.info(`Password reset successful for user: ${user.email}`);

    // Generate new auth token for immediate login
    const token = generateToken(user);

    // Send success response with user data and token
    res.status(200).json({
      success: true,
      message: 'Password has been reset successfully',
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        subscriptionTier: user.subscriptionTier,
        createdAt: user.createdAt
      }
    });

    // Optional: Send confirmation email (don't fail if this fails)
    try {
      if (process.env.SEND_PASSWORD_RESET_CONFIRMATION === 'true') {
        const { sendEmail } = require('../utils/sendEmail');
        await sendEmail({
          email: user.email,
          subject: 'Password Reset Confirmation - JobTracker',
          message: `Hello ${user.name},\n\nThis confirms that your password has been successfully reset for your JobTracker account.\n\nIf you did not make this change, please contact our support team immediately.\n\nBest regards,\nThe JobTracker Team`,
          userName: user.name
        });
      }
    } catch (emailError) {
      // Don't fail the password reset if confirmation email fails
      logger.warn(`Failed to send password reset confirmation email to ${user.email}: ${emailError.message}`);
    }

  } catch (error) {
    logger.error(`Password reset error: ${error.message}`);
    console.log('❌ Full error details:', error);
    
    // Handle specific database errors
    if (error.name === 'ValidationError') {
      const messages = Object.values(error.errors).map(val => val.message);
      return res.status(400).json({
        success: false,
        error: messages.join(', ')
      });
    }
    
    // Handle bcrypt errors
    if (error.message.includes('Illegal arguments')) {
      return res.status(500).json({
        success: false,
        error: 'Error processing password. Please ensure your password is valid and try again.'
      });
    }
    
    res.status(500).json({
      success: false,
      error: 'An error occurred while resetting your password. Please try again.'
    });
  }
});

// @desc    Change user password
// @route   PUT /api/auth/password
// @access  Private
const changePassword = asyncHandler(async (req, res) => {
  const { currentPassword, newPassword } = req.body;

  // Input validation
  if (!currentPassword || !newPassword) {
    logger.warn(`Password change attempt missing required fields for user ID: ${req.user.id}`);
    return res.status(400).json({
      success: false,
      error: 'Current password and new password are required'
    });
  }

  if (newPassword.length < 6) {
    logger.warn(`Password change attempt with short password for user ID: ${req.user.id}`);
    return res.status(400).json({
      success: false,
      error: 'New password must be at least 6 characters'
    });
  }

  // Find user by ID
  const user = await User.findById(req.user.id).select('+password');
  
  if (!user) {
    logger.error(`User not found for password change: ${req.user.id}`);
    return res.status(404).json({
      success: false,
      error: 'User not found'
    });
  }

  // Check if current password matches
  const isMatch = await user.matchPassword(currentPassword);
  if (!isMatch) {
    logger.warn(`Failed password change attempt (incorrect current password) for email: ${user.email}`);
    return res.status(401).json({
      success: false,
      error: 'Current password is incorrect'
    });
  }

  // Set new password
  user.password = newPassword;
  // The passwordChangedAt field will be updated by the pre-save hook
  await user.save();

  // Log detailed password change information to server console
  console.log('Password change details:', {
    userName: user.name,
    userEmail: user.email,
    newPassword: '******', // Don't log actual password for security
    changeDate: new Date().toISOString(),
    accountCreateDate: user.createdAt
  });

  logger.info(`Password updated successfully for user: ${user.email}, name: ${user.name}, changed at: ${new Date().toISOString()}, account created: ${user.createdAt}`);

  res.status(200).json({
    success: true,
    message: 'Password updated successfully'
  });
});

// Helper function to validate appearance settings
const validateAppearanceSettings = (appearance) => {
  const validThemes = ['light', 'dark', 'system'];
  const validColorSchemes = ['default', 'green', 'purple', 'red', 'orange'];
  const validDensities = ['compact', 'default', 'comfortable'];
  const validFontSizes = ['small', 'default', 'large'];
  
  const validated = {
    theme: validThemes.includes(appearance.theme) ? appearance.theme : 'system',
    colorScheme: validColorSchemes.includes(appearance.colorScheme) ? appearance.colorScheme : 'default',
    density: validDensities.includes(appearance.density) ? appearance.density : 'default',
    fontSize: validFontSizes.includes(appearance.fontSize) ? appearance.fontSize : 'default',
    statusColors: {},
    lastModified: appearance.lastModified || Date.now()
  };
  
  // Validate status colors
  if (appearance.statusColors && typeof appearance.statusColors === 'object') {
    const validColors = ['blue', 'green', 'yellow', 'red', 'purple', 'pink', 'indigo', 'gray', 'orange', 'teal'];
    const validStatuses = ['Saved', 'Applied', 'Phone Screen', 'Interview', 'Technical Assessment', 'Offer', 'Rejected', 'Withdrawn'];
    
    for (const [status, color] of Object.entries(appearance.statusColors)) {
      if (validStatuses.includes(status) && validColors.includes(color)) {
        validated.statusColors[status] = color;
      }
    }
  }
  
  // Set default status colors if none provided
  if (Object.keys(validated.statusColors).length === 0) {
    validated.statusColors = {
      'Saved': 'blue',
      'Applied': 'purple',
      'Phone Screen': 'yellow',
      'Interview': 'yellow',
      'Technical Assessment': 'yellow',
      'Offer': 'green',
      'Rejected': 'red',
      'Withdrawn': 'red',
    };
  }
  
  return validated;
};

module.exports = {
  registerUser,
  loginUser,
  getMe,
  logoutUser,
  forgotPassword,
  resetPassword,
  updateProfile,
  changePassword,
  getPreferences,
  updatePreferences,
};