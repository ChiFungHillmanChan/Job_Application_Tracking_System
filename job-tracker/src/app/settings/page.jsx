'use client';

import withAuth from '@/lib/withAuth';
import Link from 'next/link';
import { useAuth } from '@/lib/hooks/useAuth';

function Settings() {
  const { user } = useAuth();

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
      name: 'Subscription',
      description: 'Manage your plan and billing',
      href: '/settings/subscription',
      icon: 'M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z',
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

      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {settingsCategories.map((category) => (
          <Link
            key={category.name}
            href={category.href}
            className="relative p-6 bg-white rounded-lg shadow dark:bg-gray-800 hover:shadow-md transition duration-150 ease-in-out group"
          >
            <div className="flex items-start">
              <div className="flex-shrink-0">
                <svg
                  className="h-8 w-8 text-primary-600 dark:text-primary-400 group-hover:text-primary-700 dark:group-hover:text-primary-300 transition-colors"
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={category.icon} />
                </svg>
              </div>
              <div className="ml-4 flex-1">
                <h3 className="text-lg font-medium text-gray-900 dark:text-white group-hover:text-primary-600 dark:group-hover:text-primary-400 transition-colors">
                  {category.name}
                </h3>
                <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
                  {category.description}
                </p>
                {/* Add special badge for subscription if user is on free tier */}
                {category.name === 'Subscription' && user?.subscriptionTier === 'free' && (
                  <span className="mt-2 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200">
                    Upgrade Available
                  </span>
                )}
              </div>
            </div>
            <div className="mt-4 flex justify-end">
              <span className="inline-flex items-center text-sm font-medium text-primary-600 hover:text-primary-500 dark:text-primary-400 dark:hover:text-primary-300 group-hover:translate-x-1 transition-transform">
                Manage
                <svg className="ml-1 h-5 w-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                  <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
                </svg>
              </span>
            </div>
          </Link>
        ))}
      </div>

      {/* Current Subscription Status Card */}
      <div className="mt-8 p-6 bg-white rounded-lg shadow dark:bg-gray-800">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-medium text-gray-900 dark:text-white">
              Current Plan
            </h3>
            <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
              {user?.subscriptionTier === 'free' 
                ? 'You are currently on the free plan with limited features'
                : user?.subscriptionTier === 'premium'
                ? 'You have premium access with enhanced features'
                : user?.subscriptionTier === 'enterprise'
                ? 'You have enterprise access with all features'
                : 'Manage your subscription and billing information'
              }
            </p>
          </div>
          <div className="flex items-center space-x-3">
            <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${
              user?.subscriptionTier === 'free' 
                ? 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-100'
                : user?.subscriptionTier === 'premium'
                ? 'bg-blue-100 text-blue-800 dark:bg-blue-800 dark:text-blue-100'
                : user?.subscriptionTier === 'enterprise'
                ? 'bg-purple-100 text-purple-800 dark:bg-purple-800 dark:text-purple-100'
                : 'bg-green-100 text-green-800 dark:bg-green-800 dark:text-green-100'
            }`}>
              {user?.subscriptionTier ? user.subscriptionTier.charAt(0).toUpperCase() + user.subscriptionTier.slice(1) : 'Free'}
            </span>
            {user?.subscriptionTier === 'free' && (
              <Link 
                href="/settings/subscription" 
                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 dark:bg-primary-700 dark:hover:bg-primary-600"
              >
                Upgrade Plan
              </Link>
            )}
          </div>
        </div>
        
        {/* Plan Features Summary */}
        <div className="mt-4">
          <div className="p-4 border border-gray-200 rounded-md dark:border-gray-700 bg-gray-50 dark:bg-gray-900">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-sm">
              <div className="flex items-center">
                <svg className="h-4 w-4 text-green-500 mr-2" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>
                <span className="text-gray-700 dark:text-gray-300">
                  {user?.subscriptionTier === 'free' ? '8' : user?.subscriptionTier === 'premium' ? '50' : 'Unlimited'} Resumes
                </span>
              </div>
              <div className="flex items-center">
                <svg className="h-4 w-4 text-green-500 mr-2" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>
                <span className="text-gray-700 dark:text-gray-300">
                  {user?.subscriptionTier === 'free' ? '100' : user?.subscriptionTier === 'premium' ? '1,000' : 'Unlimited'} Applications
                </span>
              </div>
              <div className="flex items-center">
                <svg className={`h-4 w-4 mr-2 ${user?.subscriptionTier === 'free' ? 'text-gray-400' : 'text-green-500'}`} fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>
                <span className={`${user?.subscriptionTier === 'free' ? 'text-gray-500 dark:text-gray-500' : 'text-gray-700 dark:text-gray-300'}`}>
                  {user?.subscriptionTier === 'free' ? 'Basic Support' : 'Priority Support'}
                </span>
              </div>
            </div>
            
            {user?.subscriptionTier === 'free' && (
              <div className="mt-3 pt-3 border-t border-gray-200 dark:border-gray-700">
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  <Link href="/settings/subscription" className="text-primary-600 hover:text-primary-500 dark:text-primary-400 dark:hover:text-primary-300 font-medium">
                    Upgrade to Premium
                  </Link> for unlimited applications, advanced analytics, and priority support.
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default withAuth(Settings);