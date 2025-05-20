const User = require('../models/User');
const asyncHandler = require('express-async-handler');
const { generateToken, generateResetPasswordToken, verifyToken } = require('../utils/tokenManager');
const crypto = require('crypto');
const logger = require('../utils/logger');

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
  const user = await User.findOne({ email: req.body.email });

  if (!user) {
    logger.warn(`Password reset attempt for non-existent email: ${req.body.email}`);
    return res.status(404).json({
      success: false,
      error: 'User not found'
    });
  }

  // Get reset token
  const { resetToken, resetPasswordToken, resetPasswordExpire } = generateResetPasswordToken();

  // Save the hashed token to the database
  await User.findByIdAndUpdate(user._id, {
    resetPasswordToken,
    resetPasswordExpire
  });

  // Create reset URL
  const resetUrl = `${req.protocol}://${req.get('host')}/auth/resetpassword/${resetToken}`;

  // In a real application, you would send an email here with the resetUrl
  logger.info(`Password reset token generated for user: ${user.email}`);

  res.status(200).json({
    success: true,
    data: 'Email sent',
    // For development only - remove in production
    resetUrl: resetUrl
  });
});

// @desc    Reset password
// @route   PUT /api/auth/resetpassword/:resettoken
// @access  Public
const resetPassword = asyncHandler(async (req, res) => {
  // Get hashed token
  const resetPasswordToken = crypto
    .createHash('sha256')
    .update(req.params.resettoken)
    .digest('hex');

  const user = await User.findOne({
    resetPasswordToken,
    resetPasswordExpire: { $gt: Date.now() }
  });

  if (!user) {
    logger.warn('Invalid or expired password reset token used');
    return res.status(400).json({
      success: false,
      error: 'Invalid or expired token'
    });
  }

  // Set new password
  user.password = req.body.password;
  user.resetPasswordToken = undefined;
  user.resetPasswordExpire = undefined;
  await user.save();

  logger.info(`Password reset successful for user: ${user.email}`);

  res.status(200).json({
    success: true,
    token: generateToken(user),
    user: {
      id: user._id,
      name: user.name,
      email: user.email
    }
  });
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

module.exports = {
  registerUser,
  loginUser,
  getMe,
  logoutUser,
  forgotPassword,
  resetPassword,
  updateProfile
};