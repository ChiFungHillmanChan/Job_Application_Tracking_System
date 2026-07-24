// Port of backend/middleware/auth.js (protect/authorize) for the App Router.
// The cookie fallback from the Express version is dead code (no code path
// ever set a `token` cookie) and has been dropped; only the Authorization
// header and `?token=` query param are honored, matching the iframe file
// access use case the original comment describes.
import User from '@/server/models/User';
import { verifyToken } from '@/server/utils/tokenManager';
import { ApiError } from '@/server/http';

// Resolves the authenticated user for a request, or throws ApiError.
export async function requireAuth(request) {
  let token;

  const authHeader = request.headers.get('authorization');
  if (authHeader && authHeader.startsWith('Bearer')) {
    token = authHeader.split(' ')[1];
  } else {
    token = request.nextUrl.searchParams.get('token');
  }

  if (!token) {
    throw new ApiError(401, 'Not authorized, no token');
  }

  const decoded = verifyToken(token);

  if (!decoded) {
    throw new ApiError(401, 'Not authorized, invalid token');
  }

  const user = await User.findById(decoded.id).select('-password');

  if (!user) {
    throw new ApiError(401, 'User not found');
  }

  return user;
}

// Port of backend/middleware/auth.js's authorize(...roles).
export function requireTier(user, ...tiers) {
  if (!user || !user.subscriptionTier) {
    throw new ApiError(403, 'Not authorized to access this resource');
  }

  if (!tiers.includes(user.subscriptionTier)) {
    throw new ApiError(
      403,
      `User with ${user.subscriptionTier} role not authorized to access this resource`
    );
  }
}
