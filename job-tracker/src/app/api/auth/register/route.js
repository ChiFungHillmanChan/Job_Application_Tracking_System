// Port of backend/controllers/authController.js registerUser
// @route   POST /api/auth/register
// @access  Public
import { NextResponse } from 'next/server';
import { withApi } from '@/server/http';
import User from '@/server/models/User';
import { generateToken } from '@/server/utils/tokenManager';
import logger from '@/server/logger';

export const POST = withApi(async (request) => {
  const { name, email, password } = await request.json();

  if (!name || !email || !password) {
    logger.warn('Registration attempt with missing required fields');
    return NextResponse.json(
      {
        success: false,
        error: 'Please provide name, email, and password',
      },
      { status: 400 }
    );
  }

  if (password.length < 6) {
    logger.warn(`Registration attempt with short password for email: ${email}`);
    return NextResponse.json(
      {
        success: false,
        error: 'Password must be at least 6 characters',
      },
      { status: 400 }
    );
  }

  const userExists = await User.findOne({ email });

  if (userExists) {
    logger.warn(`Registration attempt with existing email: ${email}`);
    return NextResponse.json(
      {
        success: false,
        error: 'User already exists',
      },
      { status: 400 }
    );
  }

  try {
    const user = await User.create({
      name,
      email,
      password,
    });

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
      { status: 201 }
    );
  } catch (error) {
    logger.error(`Error during user registration: ${error.message}`);

    if (error.name === 'ValidationError') {
      const messages = Object.values(error.errors).map((val) => val.message);
      return NextResponse.json(
        {
          success: false,
          error: messages,
        },
        { status: 400 }
      );
    }

    return NextResponse.json(
      {
        success: false,
        error: 'Server error during registration',
      },
      { status: 500 }
    );
  }
});
