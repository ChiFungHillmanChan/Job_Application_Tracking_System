// ESM port of backend/utils/tokenManager.js
import jwt from 'jsonwebtoken';
import crypto from 'node:crypto';
import logger from '@/server/logger';

// Generate JWT Token
export const generateToken = (user) => {
  return jwt.sign(
    {
      id: user._id,
      name: user.name,
      email: user.email,
      subscriptionTier: user.subscriptionTier,
    },
    process.env.JWT_SECRET,
    {
      expiresIn: process.env.JWT_EXPIRE,
    }
  );
};

// Generate Reset Password Token
export const generateResetPasswordToken = () => {
  // Generate random token
  const resetToken = crypto.randomBytes(20).toString('hex');

  // Hash token and set to resetPasswordToken field
  const resetPasswordToken = crypto
    .createHash('sha256')
    .update(resetToken)
    .digest('hex');

  // Set expire time - 10 minutes
  const resetPasswordExpire = Date.now() + 10 * 60 * 1000;

  return {
    resetToken,
    resetPasswordToken,
    resetPasswordExpire,
  };
};

// Verify JWT Token
export const verifyToken = (token) => {
  try {
    return jwt.verify(token, process.env.JWT_SECRET);
  } catch (error) {
    logger.error(`Token verification failed: ${error.message}`);
    return null;
  }
};
