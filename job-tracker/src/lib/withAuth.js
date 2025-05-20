'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import useAuth from '@/lib/hooks/useAuth';

const withAuth = (Component) => {
  return function WithAuth(props) {
    const { isAuthenticated, loading } = useAuth();
    const router = useRouter();

    useEffect(() => {
      if (!loading && !isAuthenticated()) {
        router.push('/auth/login');
      }
    }, [loading, isAuthenticated, router]);

    // Show nothing while checking authentication
    if (loading) {
      return (
        <div className="flex items-center justify-center min-h-screen">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary-600"></div>
        </div>
      );
    }

    // If authenticated, render the component
    if (!loading && isAuthenticated()) {
      return <Component {...props} />;
    }

    // Return null while redirecting
    return null;
  };
};

export default withAuth;