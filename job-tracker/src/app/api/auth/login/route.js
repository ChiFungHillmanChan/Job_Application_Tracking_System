// Port of backend/controllers/authController.js loginUser
// @route   POST /api/auth/login
// @access  Public
import { NextResponse } from 'next/server';
import { withApi } from '@/server/http';
import User from '@/server/models/User';
import { generateToken } from '@/server/utils/tokenManager';
import logger from '@/server/logger';

export const POST = withApi(async (request) => {
  const { email, password } = await request.json();

  if (!email || !password) {
    logger.warn('Login attempt with missing email or password');
    return NextResponse.json(
      {
        success: false,
        error: 'Please provide email and password',
      },
      { status: 400 }
    );
  }

  const user = await User.findOne({ email }).select('+password');

  if (!user) {
    logger.warn(`Failed login attempt for non-existent email: ${email}`);
    return NextResponse.json(
      {
        success: false,
        error: 'Invalid credentials',
      },
      { status: 401 }
    );
  }

  const isMatch = await user.matchPassword(password);
  if (!isMatch) {
    logger.warn(`Failed login attempt (password mismatch) for email: ${email}`);
    return NextResponse.json(
      {
        success: false,
        error: 'Invalid credentials',
      },
      { status: 401 }
    );
  }

  logger.info(`User logged in: ${email}`);

  return NextResponse.json(
    {
      success: true,
      token: generateToken(user),
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        subscriptionTier: user.subscriptionTier,
        createdAt: user.createdAt,
      },
    },
    { status: 200 }
  );
});
