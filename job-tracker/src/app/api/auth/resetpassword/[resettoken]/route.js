// Port of backend/controllers/authController.js resetPassword
// @route   PUT /api/auth/resetpassword/:resettoken
// @access  Public
import { NextResponse } from 'next/server';
import crypto from 'node:crypto';
import { withApi } from '@/server/http';
import User from '@/server/models/User';
import { generateToken } from '@/server/utils/tokenManager';
import { sendEmail } from '@/server/utils/sendEmail';
import logger from '@/server/logger';

export const PUT = withApi(async (request, context) => {
  const { password } = await request.json();
  const { resettoken } = await context.params;

  console.log('🔐 Password reset attempt for token:', resettoken?.substring(0, 8) + '...');
  console.log('🔐 Password provided:', password ? 'Yes' : 'No');
  console.log('🔐 Password length:', password?.length);

  // Input validation
  if (!password) {
    logger.warn('Password reset attempt without password');
    return NextResponse.json(
      {
        success: false,
        error: 'Please provide a new password',
      },
      { status: 400 }
    );
  }

  if (password.length < 6) {
    logger.warn('Password reset attempt with short password');
    return NextResponse.json(
      {
        success: false,
        error: 'Password must be at least 6 characters long',
      },
      { status: 400 }
    );
  }

  if (!resettoken) {
    logger.warn('Password reset attempt without reset token');
    return NextResponse.json(
      {
        success: false,
        error: 'Invalid reset token',
      },
      { status: 400 }
    );
  }

  try {
    // Get hashed token
    const resetPasswordToken = crypto
      .createHash('sha256')
      .update(resettoken)
      .digest('hex');

    console.log('🔍 Looking for user with hashed token:', resetPasswordToken.substring(0, 8) + '...');

    // Find user with valid reset token that hasn't expired
    const user = await User.findOne({
      resetPasswordToken,
      resetPasswordExpire: { $gt: Date.now() },
    });

    if (!user) {
      logger.warn(`Invalid or expired password reset token used: ${resettoken.substring(0, 8)}...`);
      return NextResponse.json(
        {
          success: false,
          error: 'Invalid or expired reset token. Please request a new password reset.',
        },
        { status: 400 }
      );
    }

    console.log('✅ User found:', user.email);

    // Check if new password is different from current password
    try {
      const isSamePassword = await user.matchPassword(password);
      if (isSamePassword) {
        logger.warn(`User ${user.email} attempted to reset password with same password`);
        return NextResponse.json(
          {
            success: false,
            error: 'New password must be different from your current password',
          },
          { status: 400 }
        );
      }
    } catch (matchError) {
      // If matchPassword fails, continue - it might be due to the old password format
      console.log('⚠️ matchPassword check failed, continuing with reset:', matchError.message);
    }

    console.log('🔄 Setting new password...');

    // Set new password properly
    user.password = password; // The pre-save hook will hash it
    user.resetPasswordToken = undefined;
    user.resetPasswordExpire = undefined;
    user.passwordChangedAt = Date.now();

    // Save user and handle bcrypt errors
    try {
      await user.save();
      console.log('✅ Password saved successfully');
    } catch (saveError) {
      console.log('❌ Error saving user:', saveError.message);

      if (saveError.message.includes('Illegal arguments')) {
        // Handle bcrypt error
        return NextResponse.json(
          {
            success: false,
            error: 'Error processing password. Please try again.',
          },
          { status: 500 }
        );
      }

      throw saveError;
    }

    logger.info(`Password reset successful for user: ${user.email}`);

    // Generate new auth token for immediate login
    const token = generateToken(user);

    // Optional: Send confirmation email (don't fail if this fails)
    // NOTE: in the Express source this ran *after* res.json() had already
    // sent the response (fire-and-forget on the long-lived server process).
    // A serverless route handler ends as soon as it returns, so this is
    // awaited here, before the response, to actually let it send.
    try {
      if (process.env.SEND_PASSWORD_RESET_CONFIRMATION === 'true') {
        await sendEmail({
          email: user.email,
          subject: 'Password Reset Confirmation - JobTracker',
          message: `Hello ${user.name},\n\nThis confirms that your password has been successfully reset for your JobTracker account.\n\nIf you did not make this change, please contact our support team immediately.\n\nBest regards,\nThe JobTracker Team`,
          userName: user.name,
        });
      }
    } catch (emailError) {
      // Don't fail the password reset if confirmation email fails
      logger.warn(`Failed to send password reset confirmation email to ${user.email}: ${emailError.message}`);
    }

    // Send success response with user data and token
    return NextResponse.json(
      {
        success: true,
        message: 'Password has been reset successfully',
        token,
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
  } catch (error) {
    logger.error(`Password reset error: ${error.message}`);
    console.log('❌ Full error details:', error);

    // Handle specific database errors
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

    // Handle bcrypt errors
    if (error.message.includes('Illegal arguments')) {
      return NextResponse.json(
        {
          success: false,
          error: 'Error processing password. Please ensure your password is valid and try again.',
        },
        { status: 500 }
      );
    }

    return NextResponse.json(
      {
        success: false,
        error: 'An error occurred while resetting your password. Please try again.',
      },
      { status: 500 }
    );
  }
});
