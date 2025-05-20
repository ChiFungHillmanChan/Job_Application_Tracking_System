'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';

export default function DashboardError({ error, onDismiss }) {
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    // Reset visibility when error changes
    if (error) {
      setVisible(true);
    }
  }, [error]);

  if (!error || !visible) {
    return null;
  }

  const handleDismiss = () => {
    setVisible(false);
    if (onDismiss) {
      onDismiss();
    }
  };

  return (
    <div className="mb-6 bg-red-50 dark:bg-red-900 border-l-4 border-red-500 p-4 rounded-md">
      <div className="flex items-start">
        <div className="flex-shrink-0">
          <svg className="h-5 w-5 text-red-600 dark:text-red-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
          </svg>
        </div>
        <div className="ml-3 flex-1">
          <h3 className="text-sm font-medium text-red-800 dark:text-red-200">Authentication Error</h3>
          <div className="mt-2 text-sm text-red-700 dark:text-red-300">
            <p>{error}</p>
          </div>
          <div className="mt-3">
            <div className="flex space-x-4">
              <button
                type="button"
                onClick={handleDismiss}
                className="text-sm font-medium text-red-600 dark:text-red-400 hover:text-red-800 dark:hover:text-red-300"
              >
                Dismiss
              </button>
              <Link
                href="/auth/login"
                className="text-sm font-medium text-red-600 dark:text-red-400 hover:text-red-800 dark:hover:text-red-300"
              >
                Return to login
              </Link>
              <Link
                href="/debug"
                className="text-sm font-medium text-red-600 dark:text-red-400 hover:text-red-800 dark:hover:text-red-300"
              >
                Debug
              </Link>
            </div>
          </div>
        </div>
        <div className="ml-auto pl-3">
          <div className="-mx-1.5 -my-1.5">
            <button
              type="button"
              onClick={handleDismiss}
              className="inline-flex rounded-md p-1.5 text-red-600 dark:text-red-400 hover:bg-red-100 dark:hover:bg-red-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 dark:focus:ring-offset-red-900"
            >
              <span className="sr-only">Dismiss</span>
              <svg className="h-5 w-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
              </svg>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}