const crypto = require('crypto');
const asyncHandler = require('express-async-handler');
const User = require('../models/User');
const logger = require('../utils/logger');
const { generateToken, generateResetPasswordToken } = require('../utils/tokenManager');
const sendEmail = require('../utils/sendEmail');

// @desc    Register user
// @route   POST /api/auth/register
// @access  Public
const register = asyncHandler(async (req, res) => {
  const { name, email, password } = req.body;

  // Check if user exists
  const userExists = await User.findOne({ email });

  if (userExists) {
    logger.warn(`Registration attempt with existing email: ${email}`);
    return res.status(400).json({
      success: false,
      error: 'User already exists'
    });
  }

  // Create user
  const user = await User.create({
    name,
    email,
    password
  });

  if (user) {
    // Generate token
    const token = generateToken(user);

    logger.info(`New user registered: ${email}`);
    res.status(201).json({
      success: true,
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        subscriptionTier: user.subscriptionTier,
        preferences: user.preferences
      }
    });
  } else {
    logger.error(`Failed to register user: ${email}`);
    res.status(400).json({
      success: false,
      error: 'Invalid user data'
    });
  }
});

// @desc    Login user
// @route   POST /api/auth/login
// @access  Public
const login = asyncHandler(async (req, res) => {
  const { email, password } = req.body;

  // Check for user
  const user = await User.findOne({ email }).select('+password');

  if (!user) {
    logger.warn(`Login attempt with non-existent email: ${email}`);
    return res.status(401).json({
      success: false,
      error: 'Invalid credentials'
    });
  }

  // Check if password matches
  const isMatch = await user.matchPassword(password);

  if (!isMatch) {
    logger.warn(`Failed login attempt for user: ${email}`);
    return res.status(401).json({
      success: false,
      error: 'Invalid credentials'
    });
  }

  // Generate token
  const token = generateToken(user);

  logger.info(`User logged in: ${email}`);
  res.status(200).json({
    success: true,
    token,
    user: {
      id: user._id,
      name: user.name,
      email: user.email,
      subscriptionTier: user.subscriptionTier,
      preferences: user.preferences
    }
  });
});

// @desc    Get current logged in user
// @route   GET /api/auth/me
// @access  Private
const getMe = asyncHandler(async (req, res) => {
  // User is already available in req due to the auth middleware
  const user = await User.findById(req.user.id);

  if (!user) {
    logger.error(`Failed to retrieve user profile: ${req.user.id}`);
    return res.status(404).json({
      success: false,
      error: 'User not found'
    });
  }

  logger.info(`User profile retrieved: ${user.email}`);
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

// @desc    Forgot password
// @route   POST /api/auth/forgotpassword
// @access  Public
const forgotPassword = asyncHandler(async (req, res) => {
  const user = await User.findOne({ email: req.body.email });

  if (!user) {
    logger.warn(`Password reset attempt for non-existent email: ${req.body.email}`);
    return res.status(404).json({
      success: false,
      error: 'There is no user with that email'
    });
  }

  // Get reset token
  const { resetToken, resetPasswordToken, resetPasswordExpire } = generateResetPasswordToken();

  // Save to database
  await User.findByIdAndUpdate(user._id, {
    resetPasswordToken,
    resetPasswordExpire
  });

  // Create reset url
  const resetUrl = `${req.protocol}://${req.get('host')}/auth/resetpassword/${resetToken}`;

  const message = `You are receiving this email because you (or someone else) has requested the reset of a password. Please make a PUT request to: \n\n ${resetUrl}`;

  try {
    await sendEmail({
      email: user.email,
      subject: 'Password reset token',
      message
    });

    logger.info(`Password reset email sent to: ${user.email}`);
    res.status(200).json({
      success: true,
      data: 'Email sent'
    });
  } catch (error) {
    logger.error(`Failed to send password reset email: ${error.message}`);
    
    user.resetPasswordToken = undefined;
    user.resetPasswordExpire = undefined;

    await user.save({ validateBeforeSave: false });

    res.status(500).json({
      success: false,
      error: 'Email could not be sent'
    });
  }
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
      error: 'Invalid token'
    });
  }

  // Set new password
  user.password = req.body.password;
  user.resetPasswordToken = undefined;
  user.resetPasswordExpire = undefined;
  await user.save();

  // Generate new token
  const token = generateToken(user);

  logger.info(`Password successfully reset for user: ${user.email}`);
  res.status(200).json({
    success: true,
    token,
    user: {
      id: user._id,
      name: user.name,
      email: user.email
    }
  });
});

// @desc    Google OAuth login/register
// @route   POST /api/auth/google
// @access  Public
const googleAuth = asyncHandler(async (req, res) => {
  const { googleId, name, email } = req.body;

  if (!googleId || !name || !email) {
    logger.error('Incomplete Google auth data provided');
    return res.status(400).json({
      success: false,
      error: 'Please provide all required fields'
    });
  }

  // Check if user exists
  let user = await User.findOne({ email });

  if (user) {
    // Update googleId if not set
    if (!user.googleId) {
      user.googleId = googleId;
      await user.save();
    }
  } else {
    // Create new user
    user = await User.create({
      name,
      email,
      googleId,
      // Generate a random password for the account
      password: crypto.randomBytes(16).toString('hex')
    });
  }

  // Generate token
  const token = generateToken(user);

  logger.info(`User authenticated via Google: ${email}`);
  res.status(200).json({
    success: true,
    token,
    user: {
      id: user._id,
      name: user.name,
      email: user.email,
      subscriptionTier: user.subscriptionTier,
      preferences: user.preferences
    }
  });
});

// @desc    Apple OAuth login/register
// @route   POST /api/auth/apple
// @access  Public
const appleAuth = asyncHandler(async (req, res) => {
  const { appleId, name, email } = req.body;

  if (!appleId || !email) {
    logger.error('Incomplete Apple auth data provided');
    return res.status(400).json({
      success: false,
      error: 'Please provide all required fields'
    });
  }

  // Check if user exists
  let user = await User.findOne({ email });

  if (user) {
    // Update appleId if not set
    if (!user.appleId) {
      user.appleId = appleId;
      await user.save();
    }
  } else {
    // Create new user
    user = await User.create({
      name: name || email.split('@')[0], // Use part of email as name if not provided
      email,
      appleId,
      // Generate a random password for the account
      password: crypto.randomBytes(16).toString('hex')
    });
  }

  // Generate token
  const token = generateToken(user);

  logger.info(`User authenticated via Apple: ${email}`);
  res.status(200).json({
    success: true,
    token,
    user: {
      id: user._id,
      name: user.name,
      email: user.email,
      subscriptionTier: user.subscriptionTier,
      preferences: user.preferences
    }
  });
});

module.exports = {
  register,
  login,
  getMe,
  forgotPassword,
  resetPassword,
  googleAuth,
  appleAuth
};