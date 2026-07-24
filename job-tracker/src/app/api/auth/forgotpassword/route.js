// Port of backend/controllers/authController.js forgotPassword
// @route   POST /api/auth/forgotpassword
// @access  Public
import { NextResponse } from 'next/server';
import { withApi } from '@/server/http';
import User from '@/server/models/User';
import { generateResetPasswordToken } from '@/server/utils/tokenManager';
import { sendPasswordResetEmail } from '@/server/utils/sendEmail';
import logger from '@/server/logger';

export const POST = withApi(async (request) => {
  const { email } = await request.json();

  // Input validation
  if (!email) {
    logger.warn('Forgot password attempt without email');
    return NextResponse.json(
      {
        success: false,
        error: 'Please provide an email address',
      },
      { status: 400 }
    );
  }

  // Email format validation
  const emailRegex = /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/;
  if (!emailRegex.test(email)) {
    logger.warn(`Forgot password attempt with invalid email format: ${email}`);
    return NextResponse.json(
      {
        success: false,
        error: 'Please provide a valid email address',
      },
      { status: 400 }
    );
  }

  try {
    const user = await User.findOne({ email });

    if (!user) {
      logger.warn(`Password reset attempt for non-existent email: ${email}`);
      // For security reasons, don't reveal whether the email exists or not
      return NextResponse.json(
        {
          success: true,
          data: 'If an account with that email exists, we have sent a password reset link.',
        },
        { status: 200 }
      );
    }

    // Get reset token
    const { resetToken, resetPasswordToken, resetPasswordExpire } = generateResetPasswordToken();

    // Save the hashed token to the database
    await User.findByIdAndUpdate(user._id, {
      resetPasswordToken,
      resetPasswordExpire,
    });

    // Create reset URL - use frontend URL for better UX
    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
    const resetUrl = `${frontendUrl}/auth/resetpassword/${resetToken}`;

    try {
      // Send password reset email with enhanced template
      const emailResult = await sendPasswordResetEmail(
        user.email,
        resetUrl,
        user.name
      );

      logger.info(`Password reset email sent successfully to: ${user.email}`);

      // Success response (don't reveal if email was sent or not for security)
      return NextResponse.json(
        {
          success: true,
          data: 'If an account with that email exists, we have sent a password reset link.',
          // Include preview URL in development for testing
          ...(process.env.NODE_ENV === 'development' && emailResult.previewUrl && {
            previewUrl: emailResult.previewUrl,
          }),
        },
        { status: 200 }
      );
    } catch (emailError) {
      logger.error(`Failed to send password reset email to ${user.email}: ${emailError.message}`);

      // Clear the reset token if email failed to send
      await User.findByIdAndUpdate(user._id, {
        resetPasswordToken: undefined,
        resetPasswordExpire: undefined,
      });

      return NextResponse.json(
        {
          success: false,
          error: 'Email service is currently unavailable. Please try again later.',
        },
        { status: 500 }
      );
    }
  } catch (error) {
    logger.error(`Forgot password error: ${error.message}`);
    return NextResponse.json(
      {
        success: false,
        error: 'An error occurred while processing your request. Please try again later.',
      },
      { status: 500 }
    );
  }
});
