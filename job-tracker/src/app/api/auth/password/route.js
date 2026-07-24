// Port of backend/controllers/authController.js changePassword
// @route   PUT /api/auth/password
// @access  Private
import { NextResponse } from 'next/server';
import { withApi } from '@/server/http';
import { requireAuth } from '@/server/auth';
import User from '@/server/models/User';
import logger from '@/server/logger';

export const PUT = withApi(async (request) => {
  const authUser = await requireAuth(request);
  const { currentPassword, newPassword } = await request.json();

  // Input validation
  if (!currentPassword || !newPassword) {
    logger.warn(`Password change attempt missing required fields for user ID: ${authUser.id}`);
    return NextResponse.json(
      {
        success: false,
        error: 'Current password and new password are required',
      },
      { status: 400 }
    );
  }

  if (newPassword.length < 6) {
    logger.warn(`Password change attempt with short password for user ID: ${authUser.id}`);
    return NextResponse.json(
      {
        success: false,
        error: 'New password must be at least 6 characters',
      },
      { status: 400 }
    );
  }

  // Find user by ID
  const user = await User.findById(authUser.id).select('+password');

  if (!user) {
    logger.error(`User not found for password change: ${authUser.id}`);
    return NextResponse.json(
      {
        success: false,
        error: 'User not found',
      },
      { status: 404 }
    );
  }

  // Check if current password matches
  const isMatch = await user.matchPassword(currentPassword);
  if (!isMatch) {
    logger.warn(`Failed password change attempt (incorrect current password) for email: ${user.email}`);
    return NextResponse.json(
      {
        success: false,
        error: 'Current password is incorrect',
      },
      { status: 401 }
    );
  }

  // Set new password
  user.password = newPassword;
  // The passwordChangedAt field will be updated by the pre-save hook
  await user.save();

  // Log detailed password change information to server console
  console.log('Password change details:', {
    userName: user.name,
    userEmail: user.email,
    newPassword: '******', // Don't log actual password for security
    changeDate: new Date().toISOString(),
    accountCreateDate: user.createdAt,
  });

  logger.info(`Password updated successfully for user: ${user.email}, name: ${user.name}, changed at: ${new Date().toISOString()}, account created: ${user.createdAt}`);

  return NextResponse.json(
    {
      success: true,
      message: 'Password updated successfully',
    },
    { status: 200 }
  );
});
