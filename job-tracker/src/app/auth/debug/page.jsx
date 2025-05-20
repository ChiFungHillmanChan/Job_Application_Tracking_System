'use client';

import { useState, useEffect } from 'react';
import { getAuthDebugInfo, resetMockUsers, clearAuthData, createMockUser } from '@/lib/authDebug';
import Link from 'next/link';

export default function AuthDebugPage() {
  const [debugInfo, setDebugInfo] = useState(null);
  const [message, setMessage] = useState('');
  const [newUser, setNewUser] = useState({
    name: '',
    email: '',
    password: ''
  });

  // Only allow in development mode
  useEffect(() => {
    if (process.env.NODE_ENV !== 'development') {
      setMessage('Debug tools are only available in development mode');
      return;
    }

    refreshDebugInfo();
  }, []);

  const refreshDebugInfo = () => {
    setDebugInfo(getAuthDebugInfo());
  };

  const handleResetMockUsers = () => {
    if (resetMockUsers()) {
      setMessage('Mock users reset successfully');
      refreshDebugInfo();
    } else {
      setMessage('Error resetting mock users');
    }
  };

  const handleClearAuthData = () => {
    if (clearAuthData()) {
      setMessage('Auth data cleared successfully');
      refreshDebugInfo();
    } else {
      setMessage('Error clearing auth data');
    }
  };

  const handleCreateMockUser = (e) => {
    e.preventDefault();
    
    if (!newUser.name || !newUser.email || !newUser.password) {
      setMessage('Please fill in all fields');
      return;
    }
    
    if (createMockUser(newUser)) {
      setMessage(`Mock user ${newUser.email} created successfully`);
      setNewUser({
        name: '',
        email: '',
        password: ''
      });
      refreshDebugInfo();
    } else {
      setMessage('Error creating mock user');
    }
  };

  // If not in development, show restricted message
  if (typeof window !== 'undefined' && process.env.NODE_ENV !== 'development') {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
          <h1 className="text-lg font-semibold">Access Restricted</h1>
          <p>Auth debug tools are only available in development mode.</p>
        </div>
        <div className="mt-4">
          <Link href="/" className="text-primary-600 hover:text-primary-800">
            Return to Home
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">
        Authentication Debug Tools
      </h1>

      {message && (
        <div className="mb-6 p-4 rounded-md bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300">
          {message}
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <div className="bg-white dark:bg-gray-800 shadow rounded-lg overflow-hidden">
            <div className="px-4 py-5 border-b border-gray-200 dark:border-gray-700 sm:px-6">
              <h3 className="text-lg font-medium text-gray-900 dark:text-white">
                Current Authentication State
              </h3>
            </div>
            <div className="p-4">
              <button
                onClick={refreshDebugInfo}
                className="mb-4 inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
              >
                Refresh Info
              </button>

              {debugInfo ? (
                <div className="overflow-x-auto">
                  <pre className="bg-gray-100 dark:bg-gray-900 p-4 rounded text-xs font-mono">
                    {JSON.stringify(debugInfo, null, 2)}
                  </pre>
                </div>
              ) : (
                <p className="text-gray-500 dark:text-gray-400">No debug info available</p>
              )}
            </div>
          </div>

          <div className="mt-6 bg-white dark:bg-gray-800 shadow rounded-lg overflow-hidden">
            <div className="px-4 py-5 border-b border-gray-200 dark:border-gray-700 sm:px-6">
              <h3 className="text-lg font-medium text-gray-900 dark:text-white">
                Actions
              </h3>
            </div>
            <div className="p-4 space-y-4">
              <button
                onClick={handleResetMockUsers}
                className="w-full inline-flex justify-center items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-yellow-600 hover:bg-yellow-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-yellow-500"
              >
                Reset Mock Users
              </button>
              
              <button
                onClick={handleClearAuthData}
                className="w-full inline-flex justify-center items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
              >
                Clear Auth Data (Logout)
              </button>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 shadow rounded-lg overflow-hidden">
          <div className="px-4 py-5 border-b border-gray-200 dark:border-gray-700 sm:px-6">
            <h3 className="text-lg font-medium text-gray-900 dark:text-white">
              Create Test User
            </h3>
          </div>
          <div className="p-4">
            <form onSubmit={handleCreateMockUser}>
              <div className="space-y-4">
                <div>
                  <label htmlFor="name" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                    Name
                  </label>
                  <input
                    type="text"
                    id="name"
                    value={newUser.name}
                    onChange={(e) => setNewUser({ ...newUser, name: e.target.value })}
                    className="mt-1 block w-full border border-gray-300 dark:border-gray-700 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm dark:bg-gray-700 dark:text-white"
                    placeholder="John Doe"
                  />
                </div>
                
                <div>
                  <label htmlFor="email" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                    Email
                  </label>
                  <input
                    type="email"
                    id="email"
                    value={newUser.email}
                    onChange={(e) => setNewUser({ ...newUser, email: e.target.value })}
                    className="mt-1 block w-full border border-gray-300 dark:border-gray-700 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm dark:bg-gray-700 dark:text-white"
                    placeholder="john@example.com"
                  />
                </div>
                
                <div>
                  <label htmlFor="password" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                    Password
                  </label>
                  <input
                    type="text"
                    id="password"
                    value={newUser.password}
                    onChange={(e) => setNewUser({ ...newUser, password: e.target.value })}
                    className="mt-1 block w-full border border-gray-300 dark:border-gray-700 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm dark:bg-gray-700 dark:text-white"
                    placeholder="password123"
                  />
                  <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                    Note: In development mode, passwords are stored in plaintext for debugging
                  </p>
                </div>
                
                <div>
                  <button
                    type="submit"
                    className="w-full inline-flex justify-center items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
                  >
                    Create User
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      </div>

      <div className="mt-8 bg-gray-50 dark:bg-gray-900 p-4 rounded-md border border-gray-200 dark:border-gray-700">
        <h3 className="text-md font-medium text-gray-900 dark:text-white mb-2">
          Browser Console Commands
        </h3>
        <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
          These commands are available in the browser console for debugging:
        </p>
        <div className="bg-gray-100 dark:bg-gray-800 p-3 rounded text-sm font-mono">
          <div>window.__authDebug.getAuthDebugInfo() // Get current auth state</div>
          <div>window.__authDebug.resetMockUsers() // Reset mock users</div>
          <div>window.__authDebug.clearAuthData() // Clear auth data (logout)</div>
          <div>window.__authDebug.createMockUser({'{name, email, password}'}) // Create test user</div>
        </div>
      </div>

      <div className="mt-6">
        <Link href="/" className="text-primary-600 hover:text-primary-800 dark:text-primary-400 dark:hover:text-primary-300">
          Return to Home
        </Link>
      </div>
    </div>
  );
}