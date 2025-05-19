'use client';

import Link from 'next/link';
import { useAuth } from '@/lib/hooks/useAuth';
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function Home() {
  const { user, loading } = useAuth();
  const router = useRouter();

  // If user is already logged in, redirect to dashboard
  useEffect(() => {
    if (!loading && user) {
      router.push('/dashboard');
    }
  }, [user, loading, router]);

  // Show loading state
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="w-16 h-16 border-4 border-gray-300 border-t-primary-600 rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center justify-center min-h-screen px-4 py-12 bg-gray-50 dark:bg-gray-900 sm:px-6 lg:px-8">
      <div className="w-full max-w-md space-y-8">
        <div>
          <h1 className="text-4xl font-bold tracking-tight text-center text-gray-900 dark:text-white">
            Job Application Tracker
          </h1>
          <p className="mt-2 text-sm text-center text-gray-600 dark:text-gray-400">
            Organize your job search and track your applications in one place
          </p>
        </div>
        <div className="mt-8 space-y-4">
          <Link href="/auth/login" className="flex justify-center w-full btn-primary">
            Login
          </Link>
          <Link href="/auth/register" className="flex justify-center w-full btn-secondary">
            Register
          </Link>
        </div>
        
        <div className="pt-8 mt-8 text-center border-t border-gray-200 dark:border-gray-700">
          <h2 className="text-xl font-semibold text-gray-800 dark:text-white">Features</h2>
          <ul className="mt-4 space-y-2 text-sm text-left text-gray-600 dark:text-gray-400">
            <li className="flex items-center">
              <svg className="w-5 h-5 mr-2 text-green-500" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
              Track applications with detailed status updates
            </li>
            <li className="flex items-center">
              <svg className="w-5 h-5 mr-2 text-green-500" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
              Manage multiple versions of your resume
            </li>
            <li className="flex items-center">
              <svg className="w-5 h-5 mr-2 text-green-500" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
              Set reminders for follow-ups and interviews
            </li>
            <li className="flex items-center">
              <svg className="w-5 h-5 mr-2 text-green-500" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
              Organize job listings with custom tags and notes
            </li>
          </ul>
        </div>
      </div>
    </div>
  );
}