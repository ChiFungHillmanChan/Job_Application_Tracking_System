// Port of backend/controllers/authController.js getPreferences + updatePreferences
// @route   GET/PUT /api/auth/preferences
// @access  Private
import { NextResponse } from 'next/server';
import { withApi } from '@/server/http';
import { requireAuth } from '@/server/auth';
import User from '@/server/models/User';
import logger from '@/server/logger';

// Helper function to validate appearance settings (ported from authController.js)
const validateAppearanceSettings = (appearance) => {
  const validThemes = ['light', 'dark', 'system'];
  const validColorSchemes = ['default', 'green', 'purple', 'red', 'orange'];
  const validDensities = ['compact', 'default', 'comfortable'];
  const validFontSizes = ['small', 'default', 'large'];

  const validated = {
    theme: validThemes.includes(appearance.theme) ? appearance.theme : 'system',
    colorScheme: validColorSchemes.includes(appearance.colorScheme) ? appearance.colorScheme : 'default',
    density: validDensities.includes(appearance.density) ? appearance.density : 'default',
    fontSize: validFontSizes.includes(appearance.fontSize) ? appearance.fontSize : 'default',
    statusColors: {},
    lastModified: appearance.lastModified || Date.now(),
  };

  // Validate status colors
  if (appearance.statusColors && typeof appearance.statusColors === 'object') {
    const validColors = ['blue', 'green', 'yellow', 'red', 'purple', 'pink', 'indigo', 'gray', 'orange', 'teal'];
    const validStatuses = ['Saved', 'Applied', 'Phone Screen', 'Interview', 'Technical Assessment', 'Offer', 'Rejected', 'Withdrawn'];

    for (const [status, color] of Object.entries(appearance.statusColors)) {
      if (validStatuses.includes(status) && validColors.includes(color)) {
        validated.statusColors[status] = color;
      }
    }
  }

  // Set default status colors if none provided
  if (Object.keys(validated.statusColors).length === 0) {
    validated.statusColors = {
      'Saved': 'blue',
      'Applied': 'purple',
      'Phone Screen': 'yellow',
      'Interview': 'yellow',
      'Technical Assessment': 'yellow',
      'Offer': 'green',
      'Rejected': 'red',
      'Withdrawn': 'red',
    };
  }

  return validated;
};

// @desc    Get user preferences only
// @route   GET /api/auth/preferences
// @access  Private
export const GET = withApi(async (request) => {
  const authUser = await requireAuth(request);

  try {
    const user = await User.findById(authUser._id);

    if (!user) {
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

    return NextResponse.json(
      {
        success: true,
        preferences: user.preferences || defaultPreferences,
        lastModified: user.preferences?.lastModified || user.updatedAt,
      },
      { status: 200 }
    );
  } catch (error) {
    logger.error(`Error getting preferences: ${error.message}`);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to retrieve preferences',
      },
      { status: 500 }
    );
  }
});

// @desc    Update user preferences only
// @route   PUT /api/auth/preferences
// @access  Private
export const PUT = withApi(async (request) => {
  const authUser = await requireAuth(request);
  const { preferences } = await request.json();

  if (!preferences || typeof preferences !== 'object') {
    return NextResponse.json(
      {
        success: false,
        error: 'Valid preferences object is required',
      },
      { status: 400 }
    );
  }

  try {
    const user = await User.findById(authUser._id);

    if (!user) {
      return NextResponse.json(
        {
          success: false,
          error: 'User not found',
        },
        { status: 404 }
      );
    }

    // Initialize preferences if they don't exist
    if (!user.preferences) {
      user.preferences = {
        theme: 'system',
        notifications: {
          email: true,
          push: true,
        },
      };
    }

    // Update preferences with validation
    if (preferences.appearance) {
      const validatedAppearance = validateAppearanceSettings(preferences.appearance);
      user.preferences.appearance = validatedAppearance;
    }

    if (preferences.theme && ['light', 'dark', 'system'].includes(preferences.theme)) {
      user.preferences.theme = preferences.theme;
    }

    if (preferences.notifications && typeof preferences.notifications === 'object') {
      user.preferences.notifications = {
        ...user.preferences.notifications,
        ...preferences.notifications,
      };
    }

    // Add timestamps
    user.preferences.lastModified = Date.now();
    user.preferences.updatedAt = new Date();

    await user.save();

    logger.info(`Preferences updated for user: ${user.email}`);

    return NextResponse.json(
      {
        success: true,
        message: 'Preferences updated successfully',
        preferences: user.preferences,
        lastModified: user.preferences.lastModified,
      },
      { status: 200 }
    );
  } catch (error) {
    logger.error(`Error updating preferences for user ${authUser.email}:`, error);

    return NextResponse.json(
      {
        success: false,
        error: 'Failed to update preferences. Please try again.',
      },
      { status: 500 }
    );
  }
});
