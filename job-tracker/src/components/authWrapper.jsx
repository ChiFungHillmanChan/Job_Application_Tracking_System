'use client';

import { AuthProvider } from '@/lib/hooks/useAuth';

export default function AuthWrapper({ children }) {
  return <AuthProvider>{children}</AuthProvider>;
}