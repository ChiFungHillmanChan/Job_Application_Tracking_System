// Port of backend/controllers/authController.js getMe
// @route   GET /api/auth/me
// @access  Private
import { NextResponse } from 'next/server';
import { withApi } from '@/server/http';
import { requireAuth } from '@/server/auth';
import User from '@/server/models/User';
import logger from '@/server/logger';

export const GET = withApi(async (request) => {
  const authUser = await requireAuth(request);

  try {
    const user = await User.findById(authUser._id);

    if (!user) {
      logger.error(`User not found in getMe: ${authUser._id}`);
      return NextResponse.json(
        {
          success: false,
          error: 'User not found',
        },
        { status: 404 }
      );
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
        },
      },
    };

    const userPreferences = user.preferences || defaultPreferences;

    logger.info(`Retrieved user profile: ${user.email}`);

    return NextResponse.json(
      {
        success: true,
        user: {
          id: user._id,
          name: user.name,
          email: user.email,
          subscriptionTier: user.subscriptionTier,
          preferences: userPreferences,
          createdAt: user.createdAt,
          updatedAt: user.updatedAt,
        },
      },
      { status: 200 }
    );
  } catch (error) {
    logger.error(`Error in getMe: ${error.message}`);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to retrieve user information',
      },
      { status: 500 }
    );
  }
});
