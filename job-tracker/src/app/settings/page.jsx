'use client';

import withAuth from '@/lib/withAuth';
import Link from 'next/link';

function Settings() {
  const settingsCategories = [
    {
      name: 'Profile',
      description: 'Update your personal information',
      href: '/settings/profile',
      icon: 'M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z',
    },
    {
      name: 'Account',
      description: 'Manage your account settings',
      href: '/settings/account',
      icon: 'M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z',
    },
    {
      name: 'Resumes',
      description: 'Upload and manage your resumes',
      href: '/settings/resumes',
      icon: 'M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z',
    },
    {
      name: 'Appearance',
      description: 'Customize your interface theme',
      href: '/settings/appearance',
      icon: 'M17.56 17.66a8 8 0 01-11.32 0L1.3 12.7a1 1 0 010-1.42l4.95-4.95a8 8 0 0111.32 0l4.95 4.95a1 1 0 010 1.42l-4.95 4.95zM11.9 11.94a2 2 0 102.83-2.83 2 2 0 00-2.83 2.83z',
    },
  ];

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-6 flex items-center">
        <Link
          href="/dashboard"
          className="flex items-center text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white mr-6"
        >
          <svg 
            xmlns="http://www.w3.org/2000/svg" 
            className="h-5 w-5 mr-1" 
            viewBox="0 0 20 20" 
            fill="currentColor"
          >
            <path 
              fillRule="evenodd" 
              d="M9.707 16.707a1 1 0 01-1.414 0l-6-6a1 1 0 010-1.414l6-6a1 1 0 011.414 1.414L5.414 9H17a1 1 0 110 2H5.414l4.293 4.293a1 1 0 010 1.414z" 
              clipRule="evenodd" 
            />
          </svg>
          Back to Dashboard
        </Link>
      </div>
      
      <header className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Settings</h1>
        <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
          Manage your account preferences and application settings
        </p>
      </header>

      <div className="grid gap-6 sm:grid-cols-2">
        {settingsCategories.map((category) => (
          <Link
            key={category.name}
            href={category.href}
            className="relative p-6 bg-white rounded-lg shadow dark:bg-gray-800 hover:shadow-md transition duration-150 ease-in-out"
          >
            <div className="flex items-start">
              <div className="flex-shrink-0">
                <svg
                  className="h-8 w-8 text-primary-600 dark:text-primary-400"
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={category.icon} />
                </svg>
              </div>
              <div className="ml-4">
                <h3 className="text-lg font-medium text-gray-900 dark:text-white">
                  {category.name}
                </h3>
                <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
                  {category.description}
                </p>
              </div>
            </div>
            <div className="mt-4 flex justify-end">
              <span className="inline-flex items-center text-sm font-medium text-primary-600 hover:text-primary-500 dark:text-primary-400 dark:hover:text-primary-300">
                Manage
                <svg className="ml-1 h-5 w-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                  <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
                </svg>
              </span>
            </div>
          </Link>
        ))}
      </div>

      <div className="mt-8 p-6 bg-white rounded-lg shadow dark:bg-gray-800">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-medium text-gray-900 dark:text-white">
              Subscription Plan
            </h3>
            <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
              Manage your subscription and billing information
            </p>
          </div>
          <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-green-100 text-green-800 dark:bg-green-800 dark:text-green-100">
            Active
          </span>
        </div>
        <div className="mt-4">
          <div className="p-4 border border-gray-200 rounded-md dark:border-gray-700">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-900 dark:text-white capitalize">
                  Free Plan
                </p>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Basic features with limited storage
                </p>
              </div>
              <button className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 dark:bg-primary-700 dark:hover:bg-primary-600">
                Upgrade
              </button>
            </div>
            <div className="mt-4">
              <p className="text-xs text-gray-500 dark:text-gray-400">
                Your next renewal date is N/A
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default withAuth(Settings);