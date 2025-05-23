// backend/controllers/adminController.js
const User = require('../models/User');
const asyncHandler = require('express-async-handler');
const { generateToken } = require('../utils/tokenManager');
const logger = require('../utils/logger');

// @desc    Create super user (admin only)
// @route   POST /api/admin/create-super-user
// @access  Private/Admin
const createSuperUser = asyncHandler(async (req, res) => {
  const { name, email, password, subscriptionTier = 'enterprise' } = req.body;

  // Input validation
  if (!name || !email || !password) {
    logger.warn('Super user creation attempt with missing required fields');
    return res.status(400).json({
      success: false,
      error: 'Please provide name, email, and password'
    });
  }

  // Check if user already exists
  const userExists = await User.findOne({ email });

  if (userExists) {
    // Update existing user to super user status
    userExists.subscriptionTier = subscriptionTier;
    userExists.isLifetimeSubscription = true;
    userExists.subscriptionStatus = 'active';
    userExists.subscriptionStartDate = new Date();
    userExists.subscriptionEndDate = new Date('2099-12-31');
    userExists.maxResumes = -1;
    userExists.maxApplications = -1;
    userExists.role = 'admin';
    
    await userExists.save();
    
    logger.info(`User upgraded to super user: ${email}`);
    
    return res.status(200).json({
      success: true,
      message: 'User upgraded to super user successfully',
      user: {
        id: userExists._id,
        name: userExists.name,
        email: userExists.email,
        subscriptionTier: userExists.subscriptionTier,
        isLifetimeSubscription: userExists.isLifetimeSubscription,
        role: userExists.role
      }
    });
  }

  try {
    // Create new super user
    const superUser = await User.create({
      name,
      email,
      password,
      subscriptionTier,
      isLifetimeSubscription: true,
      subscriptionStatus: 'active',
      subscriptionStartDate: new Date(),
      subscriptionEndDate: new Date('2099-12-31'),
      maxResumes: -1,
      maxApplications: -1,
      role: 'admin'
    });

    logger.info(`New super user created: ${email}`);
    
    res.status(201).json({
      success: true,
      message: 'Super user created successfully',
      user: {
        id: superUser._id,
        name: superUser.name,
        email: superUser.email,
        subscriptionTier: superUser.subscriptionTier,
        isLifetimeSubscription: superUser.isLifetimeSubscription,
        role: superUser.role,
        createdAt: superUser.createdAt
      }
    });
  } catch (error) {
    logger.error(`Error during super user creation: ${error.message}`);
    
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
      error: 'Server error during super user creation'
    });
  }
});

// @desc    List all super users
// @route   GET /api/admin/super-users
// @access  Private/Admin
const getSuperUsers = asyncHandler(async (req, res) => {
  try {
    const superUsers = await User.find({
      $or: [
        { isLifetimeSubscription: true },
        { role: 'admin' },
        { role: 'superadmin' },
        { subscriptionTier: 'enterprise' }
      ]
    }).select('-password');

    res.status(200).json({
      success: true,
      count: superUsers.length,
      data: superUsers
    });
  } catch (error) {
    logger.error(`Error fetching super users: ${error.message}`);
    res.status(500).json({
      success: false,
      error: 'Server error while fetching super users'
    });
  }
});

// @desc    Upgrade user to super user
// @route   PUT /api/admin/upgrade-user/:userId
// @access  Private/Admin
const upgradeToSuperUser = asyncHandler(async (req, res) => {
  try {
    const user = await User.findById(req.params.userId);

    if (!user) {
      return res.status(404).json({
        success: false,
        error: 'User not found'
      });
    }

    // Upgrade user
    user.subscriptionTier = 'enterprise';
    user.isLifetimeSubscription = true;
    user.subscriptionStatus = 'active';
    user.subscriptionStartDate = new Date();
    user.subscriptionEndDate = new Date('2099-12-31');
    user.maxResumes = -1;
    user.maxApplications = -1;
    user.role = 'admin';

    await user.save();

    logger.info(`User upgraded to super user: ${user.email}`);

    res.status(200).json({
      success: true,
      message: 'User upgraded to super user successfully',
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        subscriptionTier: user.subscriptionTier,
        isLifetimeSubscription: user.isLifetimeSubscription,
        role: user.role
      }
    });
  } catch (error) {
    logger.error(`Error upgrading user to super user: ${error.message}`);
    res.status(500).json({
      success: false,
      error: 'Server error while upgrading user'
    });
  }
});

module.exports = {
  createSuperUser,
  getSuperUsers,
  upgradeToSuperUser
};