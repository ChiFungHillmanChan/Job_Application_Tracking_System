'use client';

import { AuthProvider } from '@/lib/hooks/useAuth';
import { ThemeProvider } from '@/lib/hooks/useTheme';

export default function AuthWrapper({ children }) {
  return (
    <AuthProvider>
      <ThemeProvider>
        {children}
      </ThemeProvider>
    </AuthProvider>
  );
}