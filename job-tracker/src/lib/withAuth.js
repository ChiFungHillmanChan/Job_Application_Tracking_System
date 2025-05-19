'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/hooks/useAuth';

export default function withAuth(Component) {
  return function ProtectedRoute(props) {
    const { user, loading } = useAuth();
    const router = useRouter();

    useEffect(() => {
      // If the user is not authenticated and not loading, redirect to login
      if (!loading && !user) {
        router.push('/auth/login');
      }
    }, [user, loading, router]);

    // Show loading indicator while checking authentication
    if (loading) {
      return (
        <div className="flex items-center justify-center min-h-screen">
          <div className="w-16 h-16 border-4 border-gray-300 border-t-primary-600 rounded-full animate-spin"></div>
        </div>
      );
    }

    // If the user is authenticated, render the component
    return user ? <Component {...props} /> : null;
  };
}