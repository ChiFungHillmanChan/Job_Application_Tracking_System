// Port of backend/controllers/authController.js logoutUser
// @route   GET /api/auth/logout
// @access  Private
import { NextResponse } from 'next/server';
import { withApi } from '@/server/http';
import { requireAuth } from '@/server/auth';
import logger from '@/server/logger';

export const GET = withApi(async (request) => {
  const user = await requireAuth(request);

  logger.info(`User logged out: ${user.email}`);

  return NextResponse.json(
    {
      success: true,
      message: 'Logged out successfully',
    },
    { status: 200 }
  );
});
