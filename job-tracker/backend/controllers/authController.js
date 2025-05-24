const User = require('../models/User');
const asyncHandler = require('express-async-handler');
const { generateToken, generateResetPasswordToken, verifyToken } = require('../utils/tokenManager');
const crypto = require('crypto');
const logger = require('../utils/logger');
const { sendPasswordResetEmail } = require('../utils/sendEmail');

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

// @desc    Get current logged in user
// @route   GET /api/auth/me
// @access  Private
const getMe = asyncHandler(async (req, res) => {
  // User is already available in req.user from the auth middleware
  res.status(200).json({
    success: true,
    user: {
      id: req.user._id,
      name: req.user.name,
      email: req.user.email,
      subscriptionTier: req.user.subscriptionTier,
      preferences: req.user.preferences,
      createdAt: req.user.createdAt
    }
  });
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

    // Check if user recently requested a password reset (rate limiting)
    if (user.resetPasswordExpire && user.resetPasswordExpire > Date.now()) {
      const timeLeft = Math.ceil((user.resetPasswordExpire - Date.now()) / 1000 / 60); // minutes
      logger.warn(`Password reset rate limit hit for email: ${email}, ${timeLeft} minutes remaining`);
      return res.status(429).json({
        success: false,
        error: `Please wait ${timeLeft} minutes before requesting another password reset`
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

    // Check if new password is different from current password
    const isSamePassword = await user.matchPassword(password);
    if (isSamePassword) {
      logger.warn(`User ${user.email} attempted to reset password with same password`);
      return res.status(400).json({
        success: false,
        error: 'New password must be different from your current password'
      });
    }

    // Set new password and clear reset token fields
    user.password = password;
    user.resetPasswordToken = undefined;
    user.resetPasswordExpire = undefined;
    user.passwordChangedAt = Date.now();
    
    await user.save();

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

    // Optional: Send confirmation email
    try {
      if (process.env.SEND_PASSWORD_RESET_CONFIRMATION === 'true') {
        await sendEmail({
          email: user.email,
          subject: 'Password Reset Confirmation - JobTracker',
          message: `Hello ${user.name},\n\nThis is to confirm that your password has been successfully reset for your JobTracker account.\n\nIf you did not make this change, please contact our support team immediately.\n\nBest regards,\nThe JobTracker Team`,
          userName: user.name
        });
      }
    } catch (emailError) {
      // Don't fail the password reset if confirmation email fails
      logger.warn(`Failed to send password reset confirmation email to ${user.email}: ${emailError.message}`);
    }

  } catch (error) {
    logger.error(`Password reset error: ${error.message}`);
    
    // Handle specific database errors
    if (error.name === 'ValidationError') {
      const messages = Object.values(error.errors).map(val => val.message);
      return res.status(400).json({
        success: false,
        error: messages.join(', ')
      });
    }
    
    res.status(500).json({
      success: false,
      error: 'An error occurred while resetting your password. Please try again.'
    });
  }
});

// @desc    Update user profile
// @route   PUT /api/auth/updateprofile
// @access  Private
const updateProfile = asyncHandler(async (req, res) => {
  const { name, email } = req.body;
  
  // Find user by ID
  const user = await User.findById(req.user.id);
  
  if (!user) {
    logger.error(`User not found for profile update: ${req.user.id}`);
    return res.status(404).json({
      success: false,
      error: 'User not found'
    });
  }
  
  // Update fields
  if (name) user.name = name;
  if (email && email !== user.email) {
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
  
  // Save user
  await user.save();
  
  logger.info(`Profile updated for user: ${user.email}`);
  
  res.status(200).json({
    success: true,
    user: {
      id: user._id,
      name: user.name,
      email: user.email,
      subscriptionTier: user.subscriptionTier,
      preferences: user.preferences,
      createdAt: user.createdAt
    }
  });
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

module.exports = {
  registerUser,
  loginUser,
  getMe,
  logoutUser,
  forgotPassword,
  resetPassword,
  updateProfile,
  changePassword
};