// backend/middleware/auth.js - Updated to handle token in query params for iframe requests

const jwt = require('jsonwebtoken');
const asyncHandler = require('express-async-handler');
const User = require('../models/User');
const logger = require('../utils/logger');
const { verifyToken } = require('../utils/tokenManager');

// Protect routes - Updated to handle tokens in query params for file access
const protect = asyncHandler(async (req, res, next) => {
  let token;

  // Check multiple sources for the token
  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith('Bearer')
  ) {
    // Get token from Authorization header
    token = req.headers.authorization.split(' ')[1];
  } else if (req.query.token) {
    // Get token from query parameter (for iframe file access)
    token = req.query.token;
  } else if (req.cookies && req.cookies.token) {
    // Get token from cookies
    token = req.cookies.token;
  }

  if (!token) {
    logger.error('No token provided');
    return res.status(401).json({
      success: false,
      error: 'Not authorized, no token'
    });
  }

  try {
    // Verify token
    const decoded = verifyToken(token);
    
    if (!decoded) {
      logger.error('Invalid token provided');
      return res.status(401).json({
        success: false,
        error: 'Not authorized, invalid token'
      });
    }

    // Get user from the token
    req.user = await User.findById(decoded.id).select('-password');

    if (!req.user) {
      logger.error(`User not found for id: ${decoded.id}`);
      return res.status(401).json({
        success: false,
        error: 'User not found'
      });
    }

    next();
  } catch (error) {
    logger.error(`Token verification failed: ${error.message}`);
    res.status(401).json({
      success: false,
      error: 'Not authorized, token failed'
    });
  }
});

// Authorize by role
const authorize = (...roles) => {
  return (req, res, next) => {
    if (!req.user || !req.user.subscriptionTier) {
      logger.error('User role verification failed');
      return res.status(403).json({
        success: false,
        error: 'Not authorized to access this resource'
      });
    }

    if (!roles.includes(req.user.subscriptionTier)) {
      logger.error(`User with role ${req.user.subscriptionTier} attempted to access restricted resource`);
      return res.status(403).json({
        success: false,
        error: `User with ${req.user.subscriptionTier} role not authorized to access this resource`
      });
    }

    next();
  };
};

module.exports = { protect, authorize };