'use client';

import { useAuth } from '@/lib/hooks/useAuth';
import withAuth from '@/lib/withAuth';
import Link from 'next/link';

function Dashboard() {
  const { user, logout } = useAuth();

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <header className="bg-white shadow dark:bg-gray-800">
        <div className="px-4 py-6 mx-auto max-w-7xl sm:px-6 lg:px-8">
          <div className="flex items-center justify-between">
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Dashboard</h1>
            <div className="flex items-center space-x-4">
              <span className="text-sm text-gray-700 dark:text-gray-300">
                Welcome, {user?.name}
              </span>
              <button
                onClick={logout}
                className="px-3 py-2 text-sm font-medium text-white bg-red-600 rounded-md hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2"
              >
                Sign out
              </button>
            </div>
          </div>
        </div>
      </header>
      
      <main>
        <div className="py-6 mx-auto max-w-7xl sm:px-6 lg:px-8">
          <div className="px-4 py-6 sm:px-0">
            <div className="p-6 bg-white rounded-lg shadow dark:bg-gray-800">
              <h2 className="mb-4 text-xl font-semibold text-gray-900 dark:text-white">
                Account Information
              </h2>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                  <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Name</p>
                  <p className="mt-1 text-gray-900 dark:text-white">{user?.name}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Email</p>
                  <p className="mt-1 text-gray-900 dark:text-white">{user?.email}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Subscription</p>
                  <p className="mt-1 capitalize text-gray-900 dark:text-white">{user?.subscriptionTier}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Account Created</p>
                  <p className="mt-1 text-gray-900 dark:text-white">
                    {user?.createdAt ? new Date(user.createdAt).toLocaleDateString() : 'N/A'}
                  </p>
                </div>
              </div>
            </div>
            
            <div className="grid grid-cols-1 gap-6 mt-6 sm:grid-cols-2 lg:grid-cols-3">
              <div className="p-6 bg-white rounded-lg shadow dark:bg-gray-800">
                <h3 className="text-lg font-medium text-gray-900 dark:text-white">Job Applications</h3>
                <p className="mt-2 text-gray-600 dark:text-gray-400">Track and manage your job applications</p>
                <div className="mt-4">
                  <Link href="/dashboard/jobs" className="text-primary-600 hover:text-primary-500">
                    View applications →
                  </Link>
                </div>
              </div>
              
              <div className="p-6 bg-white rounded-lg shadow dark:bg-gray-800">
                <h3 className="text-lg font-medium text-gray-900 dark:text-white">Resumes</h3>
                <p className="mt-2 text-gray-600 dark:text-gray-400">Manage your resumes and cover letters</p>
                <div className="mt-4">
                  <Link href="/settings/resumes" className="text-primary-600 hover:text-primary-500">
                    Manage resumes →
                  </Link>
                </div>
              </div>
              
              <div className="p-6 bg-white rounded-lg shadow dark:bg-gray-800">
                <h3 className="text-lg font-medium text-gray-900 dark:text-white">Settings</h3>
                <p className="mt-2 text-gray-600 dark:text-gray-400">Update your profile and preferences</p>
                <div className="mt-4">
                  <Link href="/settings" className="text-primary-600 hover:text-primary-500">
                    Go to settings →
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

export default withAuth(Dashboard);