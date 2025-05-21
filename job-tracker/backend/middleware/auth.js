const jwt = require('jsonwebtoken');
const asyncHandler = require('express-async-handler');
const User = require('../models/User');
const logger = require('../utils/logger');
const { verifyToken } = require('../utils/tokenManager');

// Protect routes
const protect = asyncHandler(async (req, res, next) => {
  let token;

  // Check if authorization header exists and starts with Bearer
  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith('Bearer')
  ) {
    try {
      // Get token from header
      token = req.headers.authorization.split(' ')[1];

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
      logger.error(`Authentication error: ${error.message}`);
      res.status(401).json({
        success: false,
        error: 'Not authorized, token failed'
      });
    }
  } else {
    logger.error('No token provided');
    res.status(401).json({
      success: false,
      error: 'Not authorized, no token'
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