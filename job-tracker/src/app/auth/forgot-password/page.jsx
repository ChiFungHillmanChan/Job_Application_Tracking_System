'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import ForgotPasswordForm from '@/components/forms/ForgotPasswordForm';
import useAuth from '@/lib/hooks/useAuth';

export default function ForgotPasswordPage() {
  const { isAuthenticated, loading } = useAuth();
  const router = useRouter();

  // Redirect if already authenticated
  useEffect(() => {
    if (!loading && isAuthenticated()) {
      router.push('/dashboard');
    }
  }, [loading, isAuthenticated, router]);

  // Show loading indicator while checking authentication
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  // Only render forgot password form if not authenticated
  if (!loading && !isAuthenticated()) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen px-4 py-12 bg-gray-50 dark:bg-gray-900 sm:px-6 lg:px-8">
        <div className="mb-8">
          <Link href="/" className="text-primary-600 dark:text-primary-400 hover:underline flex items-center">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-1" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M9.707 16.707a1 1 0 01-1.414 0l-6-6a1 1 0 010-1.414l6-6a1 1 0 011.414 1.414L5.414 9H17a1 1 0 110 2H5.414l4.293 4.293a1 1 0 010 1.414z" clipRule="evenodd" />
            </svg>
            Back to Home
          </Link>
        </div>
        
        <div className="w-full max-w-md space-y-8">
          <div>
            <h2 className="mt-6 text-3xl font-extrabold text-center text-gray-900 dark:text-white">
              Reset your password
            </h2>
            <p className="mt-2 text-sm text-center text-gray-600 dark:text-gray-400">
              Enter your email address and we'll send you a link to reset your password.
            </p>
          </div>
          
          <ForgotPasswordForm />
          
          <div className="text-center">
            <Link 
              href="/auth/login" 
              className="text-sm font-medium text-primary-600 hover:text-primary-500 dark:text-primary-400 dark:hover:text-primary-300"
            >
              Remember your password? Sign in
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // Return null while redirecting
  return null;
}