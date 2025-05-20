'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import withAuth from '@/lib/withAuth';
import useAuth from '@/lib/hooks/useAuth';
import DashboardError from '@/components/DashboardError';

function Dashboard() {
  const { user, error: authError } = useAuth();
  const [dashboardError, setDashboardError] = useState(authError);
  const [stats, setStats] = useState({
    total: 0,
    saved: 0,
    applied: 0,
    interview: 0,
    offer: 0,
    rejected: 0
  });

  // Update dashboardError when authError changes
  useEffect(() => {
    if (authError) {
      setDashboardError(authError);
    }
  }, [authError]);

  // This would be replaced with a real API call in production
  useEffect(() => {
    // Simulating API call to get job statistics
    const mockStats = {
      total: 12,
      saved: 2,
      applied: 5,
      interview: 3,
      offer: 1,
      rejected: 1
    };
    
    setStats(mockStats);
  }, []);

  // Recent job activity (mock data)
  const recentActivity = [
    {
      id: '1',
      date: new Date(2023, 10, 15),
      company: 'Tech Solutions Inc.',
      position: 'Senior Frontend Developer',
      status: 'Interview',
      type: 'Status Change'
    },
    {
      id: '2',
      date: new Date(2023, 10, 14),
      company: 'Data Systems Corp',
      position: 'Software Engineer',
      status: 'Applied',
      type: 'Application Submitted'
    },
    {
      id: '3',
      date: new Date(2023, 10, 12),
      company: 'Innovative AI',
      position: 'Full Stack Developer',
      status: 'Saved',
      type: 'Job Saved'
    },
    {
      id: '4',
      date: new Date(2023, 10, 10),
      company: 'Cloud Networks',
      position: 'React Developer',
      status: 'Rejected',
      type: 'Status Change'
    }
  ];

  // Format date
  const formatDate = (date) => {
    return new Intl.DateTimeFormat('en-US', { 
      month: 'short', 
      day: 'numeric',
      year: 'numeric'
    }).format(date);
  };

  // Status badge color
  const getStatusColor = (status) => {
    switch (status) {
      case 'Saved':
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300';
      case 'Applied':
        return 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-300';
      case 'Phone Screen':
      case 'Interview':
      case 'Technical Assessment':
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300';
      case 'Offer':
        return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300';
      case 'Rejected':
      case 'Withdrawn':
        return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300';
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      {dashboardError && (
        <DashboardError 
          error={dashboardError} 
          onDismiss={() => setDashboardError(null)}
        />
      )}
      
      <div className="mb-10">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
          Welcome back, {user?.name || 'User'}!
        </h1>
        <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
          Track and manage your job applications from your personal dashboard.
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-6">
        <div className="bg-white dark:bg-gray-800 overflow-hidden shadow rounded-lg">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0 bg-primary-100 dark:bg-primary-900 rounded-md p-3">
                <svg className="h-6 w-6 text-primary-600 dark:text-primary-400" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                </svg>
              </div>
              <div className="ml-5 w-0 flex-1">
                <dt className="text-sm font-medium text-gray-500 dark:text-gray-400 truncate">
                  Total Applications
                </dt>
                <dd className="flex items-baseline">
                  <div className="text-2xl font-semibold text-gray-900 dark:text-white">
                    {stats.total}
                  </div>
                </dd>
              </div>
            </div>
          </div>
          <div className="bg-gray-50 dark:bg-gray-700 px-5 py-3">
            <div className="text-sm">
              <Link href="/dashboard/jobs" className="font-medium text-primary-600 hover:text-primary-500 dark:text-primary-400 dark:hover:text-primary-300">
                View all
              </Link>
            </div>
          </div>
        </div>
        
        <div className="bg-white dark:bg-gray-800 overflow-hidden shadow rounded-lg">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0 bg-blue-100 dark:bg-blue-900 rounded-md p-3">
                <svg className="h-6 w-6 text-blue-600 dark:text-blue-400" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" />
                </svg>
              </div>
              <div className="ml-5 w-0 flex-1">
                <dt className="text-sm font-medium text-gray-500 dark:text-gray-400 truncate">
                  Saved
                </dt>
                <dd className="flex items-baseline">
                  <div className="text-2xl font-semibold text-gray-900 dark:text-white">
                    {stats.saved}
                  </div>
                </dd>
              </div>
            </div>
          </div>
          <div className="bg-gray-50 dark:bg-gray-700 px-5 py-3">
            <div className="text-sm">
              <Link href="/dashboard/jobs?status=Saved" className="font-medium text-primary-600 hover:text-primary-500 dark:text-primary-400 dark:hover:text-primary-300">
                View all
              </Link>
            </div>
          </div>
        </div>
        
        <div className="bg-white dark:bg-gray-800 overflow-hidden shadow rounded-lg">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0 bg-purple-100 dark:bg-purple-900 rounded-md p-3">
                <svg className="h-6 w-6 text-purple-600 dark:text-purple-400" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div className="ml-5 w-0 flex-1">
                <dt className="text-sm font-medium text-gray-500 dark:text-gray-400 truncate">
                  Applied
                </dt>
                <dd className="flex items-baseline">
                  <div className="text-2xl font-semibold text-gray-900 dark:text-white">
                    {stats.applied}
                  </div>
                </dd>
              </div>
            </div>
          </div>
          <div className="bg-gray-50 dark:bg-gray-700 px-5 py-3">
            <div className="text-sm">
              <Link href="/dashboard/jobs?status=Applied" className="font-medium text-primary-600 hover:text-primary-500 dark:text-primary-400 dark:hover:text-primary-300">
                View all
              </Link>
            </div>
          </div>
        </div>
        
        <div className="bg-white dark:bg-gray-800 overflow-hidden shadow rounded-lg">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0 bg-yellow-100 dark:bg-yellow-900 rounded-md p-3">
                <svg className="h-6 w-6 text-yellow-600 dark:text-yellow-400" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
              </div>
              <div className="ml-5 w-0 flex-1">
                <dt className="text-sm font-medium text-gray-500 dark:text-gray-400 truncate">
                  Interviews
                </dt>
                <dd className="flex items-baseline">
                  <div className="text-2xl font-semibold text-gray-900 dark:text-white">
                    {stats.interview}
                  </div>
                </dd>
              </div>
            </div>
          </div>
          <div className="bg-gray-50 dark:bg-gray-700 px-5 py-3">
            <div className="text-sm">
              <Link href="/dashboard/jobs?status=Interview" className="font-medium text-primary-600 hover:text-primary-500 dark:text-primary-400 dark:hover:text-primary-300">
                View all
              </Link>
            </div>
          </div>
        </div>
        
        <div className="bg-white dark:bg-gray-800 overflow-hidden shadow rounded-lg">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0 bg-green-100 dark:bg-green-900 rounded-md p-3">
                <svg className="h-6 w-6 text-green-600 dark:text-green-400" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div className="ml-5 w-0 flex-1">
                <dt className="text-sm font-medium text-gray-500 dark:text-gray-400 truncate">
                  Offers
                </dt>
                <dd className="flex items-baseline">
                  <div className="text-2xl font-semibold text-gray-900 dark:text-white">
                    {stats.offer}
                  </div>
                </dd>
              </div>
            </div>
          </div>
          <div className="bg-gray-50 dark:bg-gray-700 px-5 py-3">
            <div className="text-sm">
              <Link href="/dashboard/jobs?status=Offer" className="font-medium text-primary-600 hover:text-primary-500 dark:text-primary-400 dark:hover:text-primary-300">
                View all
              </Link>
            </div>
          </div>
        </div>
        
        <div className="bg-white dark:bg-gray-800 overflow-hidden shadow rounded-lg">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0 bg-red-100 dark:bg-red-900 rounded-md p-3">
                <svg className="h-6 w-6 text-red-600 dark:text-red-400" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div className="ml-5 w-0 flex-1">
                <dt className="text-sm font-medium text-gray-500 dark:text-gray-400 truncate">
                  Rejected
                </dt>
                <dd className="flex items-baseline">
                  <div className="text-2xl font-semibold text-gray-900 dark:text-white">
                    {stats.rejected}
                  </div>
                </dd>
              </div>
            </div>
          </div>
          <div className="bg-gray-50 dark:bg-gray-700 px-5 py-3">
            <div className="text-sm">
              <Link href="/dashboard/jobs?status=Rejected" className="font-medium text-primary-600 hover:text-primary-500 dark:text-primary-400 dark:hover:text-primary-300">
                View all
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="mt-10">
        <h2 className="text-lg font-medium text-gray-900 dark:text-white mb-5">Quick Actions</h2>
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
          <Link href="/dashboard/jobs/new">
            <div className="h-24 bg-white dark:bg-gray-800 overflow-hidden shadow rounded-lg hover:shadow-md cursor-pointer">
              <div className="px-4 py-5 sm:p-6 flex items-center">
                <div className="flex-shrink-0 bg-primary-100 dark:bg-primary-900 rounded-md p-3 mr-4">
                  <svg className="h-6 w-6 text-primary-600 dark:text-primary-400" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                  </svg>
                </div>
                <span className="text-gray-900 dark:text-white font-medium">Add New Application</span>
              </div>
            </div>
          </Link>
          
          <Link href="/settings/resumes">
            <div className="h-24 bg-white dark:bg-gray-800 overflow-hidden shadow rounded-lg hover:shadow-md cursor-pointer">
              <div className="px-4 py-5 sm:p-6 flex items-center">
                <div className="flex-shrink-0 bg-primary-100 dark:bg-primary-900 rounded-md p-3 mr-4">
                  <svg className="h-6 w-6 text-primary-600 dark:text-primary-400" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                </div>
                <span className="text-gray-900 dark:text-white font-medium">Manage Resumes</span>
              </div>
            </div>
          </Link>
          
          <Link href="/dashboard/jobs">
            <div className="h-24 bg-white dark:bg-gray-800 overflow-hidden shadow rounded-lg hover:shadow-md cursor-pointer">
              <div className="px-4 py-5 sm:p-6 flex items-center">
                <div className="flex-shrink-0 bg-primary-100 dark:bg-primary-900 rounded-md p-3 mr-4">
                  <svg className="h-6 w-6 text-primary-600 dark:text-primary-400" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M3 14h18m-9-4v8m-7 0h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                  </svg>
                </div>
                <span className="text-gray-900 dark:text-white font-medium">View All Applications</span>
              </div>
            </div>
          </Link>
        </div>
      </div>

      {/* Recent Activity */}
      <div className="mt-10">
        <h2 className="text-lg font-medium text-gray-900 dark:text-white">Recent Activity</h2>
        <div className="mt-5 bg-white dark:bg-gray-800 shadow overflow-hidden sm:rounded-md">
          <ul role="list" className="divide-y divide-gray-200 dark:divide-gray-700">
            {recentActivity.map((activity) => (
              <li key={activity.id}>
                <Link href={`/dashboard/jobs/${activity.id}`}>
                  <div className="block hover:bg-gray-50 dark:hover:bg-gray-700">
                    <div className="px-4 py-4 sm:px-6">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center">
                          <p className="text-sm font-medium text-primary-600 dark:text-primary-400 truncate">
                            {activity.company}
                          </p>
                          <div className="ml-2 flex-shrink-0 flex">
                            <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusColor(activity.status)}`}>
                              {activity.status}
                            </span>
                          </div>
                        </div>
                        <div className="ml-2 flex-shrink-0 flex items-center text-sm text-gray-500 dark:text-gray-400">
                          <span>{formatDate(activity.date)}</span>
                        </div>
                      </div>
                      <div className="mt-2 sm:flex sm:justify-between">
                        <div className="sm:flex">
                          <p className="flex items-center text-sm text-gray-500 dark:text-gray-400">
                            {activity.position}
                          </p>
                        </div>
                        <div className="mt-2 flex items-center text-sm text-gray-500 dark:text-gray-400 sm:mt-0">
                          <svg className="flex-shrink-0 mr-1.5 h-5 w-5 text-gray-400 dark:text-gray-500" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                          </svg>
                          <span>{activity.type}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </Link>
              </li>
            ))}
          </ul>
        </div>
      </div>

      {/* No Applications State (conditionally rendered) */}
      {stats.total === 0 && (
        <div className="mt-10 bg-white dark:bg-gray-800 shadow overflow-hidden sm:rounded-lg">
          <div className="px-4 py-12 sm:px-6 text-center">
            <svg className="mx-auto h-12 w-12 text-gray-400 dark:text-gray-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
            </svg>
            <h3 className="mt-2 text-sm font-medium text-gray-900 dark:text-white">No applications</h3>
            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
              Get started by creating a new job application.
            </p>
            <div className="mt-6">
              <Link href="/dashboard/jobs/new" className="btn-primary">
                Add New Application
              </Link>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default withAuth(Dashboard);