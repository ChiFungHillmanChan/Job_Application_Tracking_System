// Port of backend/controllers/authController.js updateProfile
// @route   PUT /api/auth/updateprofile
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

export const PUT = withApi(async (request) => {
  const authUser = await requireAuth(request);
  const { name, email, preferences } = await request.json();

  try {
    const user = await User.findById(authUser.id);

    if (!user) {
      logger.error(`User not found for profile update: ${authUser.id}`);
      return NextResponse.json(
        {
          success: false,
          error: 'User not found',
        },
        { status: 404 }
      );
    }

    if (name && name.trim()) {
      user.name = name.trim();
    }

    if (email && email !== user.email) {
      const emailRegex = /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/;
      if (!emailRegex.test(email)) {
        return NextResponse.json(
          {
            success: false,
            error: 'Please provide a valid email address',
          },
          { status: 400 }
        );
      }

      const emailExists = await User.findOne({ email });
      if (emailExists && emailExists._id.toString() !== authUser.id) {
        logger.warn(`Profile update attempt with existing email: ${email}`);
        return NextResponse.json(
          {
            success: false,
            error: 'Email already in use',
          },
          { status: 400 }
        );
      }
      user.email = email;
    }

    if (preferences && typeof preferences === 'object') {
      if (!user.preferences) {
        user.preferences = {
          theme: 'system',
          notifications: {
            email: true,
            push: true,
          },
        };
      }

      // Handle appearance preferences with validation
      if (preferences.appearance) {
        const validatedAppearance = validateAppearanceSettings(preferences.appearance);
        user.preferences.appearance = validatedAppearance;
        user.preferences.lastModified = preferences.lastModified || Date.now();

        logger.info(`Appearance preferences updated for user: ${user.email}`, {
          theme: validatedAppearance.theme,
          colorScheme: validatedAppearance.colorScheme,
          density: validatedAppearance.density,
          fontSize: validatedAppearance.fontSize,
        });
      }

      // Handle other preference updates
      if (preferences.theme && ['light', 'dark', 'system'].includes(preferences.theme)) {
        user.preferences.theme = preferences.theme;
      }

      if (preferences.notifications && typeof preferences.notifications === 'object') {
        user.preferences.notifications = {
          ...user.preferences.notifications,
          ...preferences.notifications,
        };
      }

      // Add timestamp for last preference update
      user.preferences.updatedAt = new Date();
    }

    // Save user with validation
    await user.save();

    logger.info(`Profile updated successfully for user: ${user.email}`, {
      updatedFields: {
        name: !!name,
        email: !!email,
        preferences: !!preferences,
      },
    });

    return NextResponse.json(
      {
        success: true,
        message: 'Profile updated successfully',
        user: {
          id: user._id,
          name: user.name,
          email: user.email,
          subscriptionTier: user.subscriptionTier,
          preferences: user.preferences,
          createdAt: user.createdAt,
          updatedAt: user.updatedAt,
        },
      },
      { status: 200 }
    );
  } catch (error) {
    logger.error(`Error saving profile update for user ${authUser.email}:`, error);

    if (error.name === 'ValidationError') {
      const messages = Object.values(error.errors).map((val) => val.message);
      return NextResponse.json(
        {
          success: false,
          error: messages.join(', '),
        },
        { status: 400 }
      );
    }

    return NextResponse.json(
      {
        success: false,
        error: 'Failed to update profile. Please try again.',
      },
      { status: 500 }
    );
  }
});
