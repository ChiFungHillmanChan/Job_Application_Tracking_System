'use client';

import { useState } from 'react';
import { useAuth } from '@/lib/hooks/useAuth';
import withAuth from '@/lib/withAuth';
import Link from 'next/link';

function AccountSettings() {
  const { user, logout } = useAuth();
  
  // State for password reset section
  const [showPasswordForm, setShowPasswordForm] = useState(false);
  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });
  const [showPasswords, setShowPasswords] = useState(false);
  const [passwordError, setPasswordError] = useState('');
  const [passwordSuccess, setPasswordSuccess] = useState('');

  // State for delete account confirmation
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleteConfirmInput, setDeleteConfirmInput] = useState('');
  
  const handlePasswordChange = (e) => {
    const { name, value } = e.target;
    setPasswordData((prev) => ({
      ...prev,
      [name]: value
    }));
  };

  const togglePasswordVisibility = () => {
    setShowPasswords(!showPasswords);
  };

  const handlePasswordSubmit = async (e) => {
    e.preventDefault();
    setPasswordError('');
    setPasswordSuccess('');
    
    // Validation
    if (!passwordData.currentPassword || !passwordData.newPassword || !passwordData.confirmPassword) {
      setPasswordError('All fields are required');
      return;
    }
    
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      setPasswordError('New passwords do not match');
      return;
    }
    
    if (passwordData.newPassword.length < 6) {
      setPasswordError('New password must be at least 6 characters');
      return;
    }
    
    try {
      // This would be a real API call in production
      // await api.put('/api/users/password', passwordData);
      
      // For demo purposes, we'll just simulate success
      setTimeout(() => {
        setPasswordSuccess('Password updated successfully');
        setPasswordData({
          currentPassword: '',
          newPassword: '',
          confirmPassword: ''
        });
        setShowPasswordForm(false);
      }, 1000);
      
    } catch (error) {
      console.error('Error changing password:', error);
      setPasswordError(error.response?.data?.error || 'Failed to update password');
    }
  };

  const handleDeleteAccount = async () => {
    if (deleteConfirmInput !== 'delete my account') {
      return;
    }
    
    try {
      // This would be a real API call in production
      // await api.delete('/api/users/account');
      
      // For demo purposes, we'll just log out
      setTimeout(() => {
        logout();
      }, 1000);
      
    } catch (error) {
      console.error('Error deleting account:', error);
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-6 flex items-center">
        <Link
          href="/settings"
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
          Back to Settings
        </Link>
      </div>
      
      <header className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Account Settings</h1>
        <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
          Manage your account security and preferences
        </p>
      </header>

      <div className="space-y-8">
        {/* Account Info Section */}
        <div className="bg-white rounded-lg shadow dark:bg-gray-800 overflow-hidden">
          <div className="px-6 py-5 border-b border-gray-200 dark:border-gray-700">
            <h3 className="text-lg font-medium text-gray-900 dark:text-white">Account Information</h3>
          </div>
          <div className="px-6 py-5">
            <dl className="grid grid-cols-1 gap-x-4 gap-y-6 sm:grid-cols-2">
              <div>
                <dt className="text-sm font-medium text-gray-500 dark:text-gray-400">Email</dt>
                <dd className="mt-1 text-sm text-gray-900 dark:text-white">{user?.email || 'example@email.com'}</dd>
              </div>
              <div>
                <dt className="text-sm font-medium text-gray-500 dark:text-gray-400">Account Type</dt>
                <dd className="mt-1 text-sm text-gray-900 dark:text-white capitalize">{user?.subscriptionTier || 'Free'}</dd>
              </div>
              <div>
                <dt className="text-sm font-medium text-gray-500 dark:text-gray-400">Account Created</dt>
                <dd className="mt-1 text-sm text-gray-900 dark:text-white">
                  {user?.createdAt ? new Date(user.createdAt).toLocaleDateString() : 'January 1, 2023'}
                </dd>
              </div>
              <div>
                <dt className="text-sm font-medium text-gray-500 dark:text-gray-400">Authentication Method</dt>
                <dd className="mt-1 text-sm text-gray-900 dark:text-white">
                  {user?.googleId ? 'Google' : user?.appleId ? 'Apple' : 'Email & Password'}
                </dd>
              </div>
            </dl>
          </div>
        </div>

        {/* Password Section */}
        <div className="bg-white rounded-lg shadow dark:bg-gray-800 overflow-hidden">
          <div className="px-6 py-5 border-b border-gray-200 dark:border-gray-700 flex justify-between items-center">
            <h3 className="text-lg font-medium text-gray-900 dark:text-white">Password</h3>
            <button
              onClick={() => setShowPasswordForm(!showPasswordForm)}
              className="inline-flex items-center px-3 py-1.5 border border-transparent text-sm font-medium rounded-md text-primary-600 bg-primary-100 hover:bg-primary-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 dark:bg-primary-900 dark:text-primary-300 dark:hover:bg-primary-800"
            >
              {showPasswordForm ? 'Cancel' : 'Change Password'}
            </button>
          </div>
          <div className="px-6 py-5">
            {!showPasswordForm ? (
              <p className="text-sm text-gray-600 dark:text-gray-400">
                {user?.googleId || user?.appleId ? 
                  'You are using social login and do not have a password set.' : 
                  'Your password was last changed on [date]. For security, consider changing it regularly.'}
              </p>
            ) : (
              <form onSubmit={handlePasswordSubmit} className="space-y-6">
                {passwordError && (
                  <div className="p-3 bg-red-100 text-red-700 rounded-md text-sm dark:bg-red-900 dark:text-red-300">
                    {passwordError}
                  </div>
                )}
                {passwordSuccess && (
                  <div className="p-3 bg-green-100 text-green-700 rounded-md text-sm dark:bg-green-900 dark:text-green-300">
                    {passwordSuccess}
                  </div>
                )}

                <div>
                  <label htmlFor="currentPassword" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                    Current Password
                  </label>
                  <div className="relative mt-1">
                    <input
                      id="currentPassword"
                      name="currentPassword"
                      type={showPasswords ? 'text' : 'password'}
                      required
                      value={passwordData.currentPassword}
                      onChange={handlePasswordChange}
                      className="input-field"
                    />
                  </div>
                </div>

                <div>
                  <label htmlFor="newPassword" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                    New Password
                  </label>
                  <div className="relative mt-1">
                    <input
                      id="newPassword"
                      name="newPassword"
                      type={showPasswords ? 'text' : 'password'}
                      required
                      value={passwordData.newPassword}
                      onChange={handlePasswordChange}
                      className="input-field"
                    />
                  </div>
                </div>

                <div>
                  <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                    Confirm New Password
                  </label>
                  <div className="relative mt-1">
                    <input
                      id="confirmPassword"
                      name="confirmPassword"
                      type={showPasswords ? 'text' : 'password'}
                      required
                      value={passwordData.confirmPassword}
                      onChange={handlePasswordChange}
                      className="input-field"
                    />
                  </div>
                </div>

                <div className="flex items-center">
                  <input
                    id="showPasswords"
                    name="showPasswords"
                    type="checkbox"
                    checked={showPasswords}
                    onChange={togglePasswordVisibility}
                    className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
                  />
                  <label htmlFor="showPasswords" className="ml-2 block text-sm text-gray-700 dark:text-gray-300">
                    Show passwords
                  </label>
                </div>

                <div className="flex justify-end">
                  <button
                    type="submit"
                    className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 dark:bg-primary-700 dark:hover:bg-primary-600"
                  >
                    Update Password
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>

        {/* Connected Accounts Section */}
        <div className="bg-white rounded-lg shadow dark:bg-gray-800 overflow-hidden">
          <div className="px-6 py-5 border-b border-gray-200 dark:border-gray-700">
            <h3 className="text-lg font-medium text-gray-900 dark:text-white">Connected Accounts</h3>
          </div>
          <div className="px-6 py-5">
            <ul className="divide-y divide-gray-200 dark:divide-gray-700">
              <li className="py-4 flex items-center justify-between">
                <div className="flex items-center">
                  <svg className="h-6 w-6 text-red-500" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M12.545,10.239v3.821h5.445c-0.712,2.315-2.647,3.972-5.445,3.972c-3.332,0-6.033-2.701-6.033-6.032s2.701-6.032,6.033-6.032c1.498,0,2.866,0.549,3.921,1.453l2.814-2.814C17.503,2.988,15.139,2,12.545,2C7.021,2,2.543,6.477,2.543,12s4.478,10,10.002,10c8.396,0,10.249-7.85,9.426-11.748L12.545,10.239z" />
                  </svg>
                  <div className="ml-3">
                    <p className="text-sm font-medium text-gray-900 dark:text-white">Google</p>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      {user?.googleId ? 'Connected' : 'Not connected'}
                    </p>
                  </div>
                </div>
                <button 
                  className={`inline-flex items-center px-3 py-1.5 border border-transparent text-sm font-medium rounded-md ${
                    user?.googleId 
                      ? 'text-gray-700 bg-gray-100 hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600' 
                      : 'text-primary-600 bg-primary-100 hover:bg-primary-200 dark:bg-primary-900 dark:text-primary-300 dark:hover:bg-primary-800'
                  } focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500`}
                >
                  {user?.googleId ? 'Disconnect' : 'Connect'}
                </button>
              </li>
              <li className="py-4 flex items-center justify-between">
                <div className="flex items-center">
                  <svg className="h-6 w-6 text-gray-900 dark:text-white" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M17.05 20.28c-.98.95-2.05.8-3.08.35-1.09-.46-2.09-.48-3.24 0-1.44.62-2.2.44-3.06-.35C2.79 15.74 3.51 7.1 8.66 6.89c1.33.07 2.23.82 3.05.82.92 0 1.92-.88 3.38-.83 1.36.05 2.39.35 3.12 1.35-2.61 1.54-2.2 5.04.84 6.05-.67 1.97-1.9 3.93-4 6zm-5.18-15c-.04 1.72 1.27 3.27 2.96 3.35-1.12 0-2.45-1.32-2.96-3.35" />
                  </svg>
                  <div className="ml-3">
                    <p className="text-sm font-medium text-gray-900 dark:text-white">Apple</p>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      {user?.appleId ? 'Connected' : 'Not connected'}
                    </p>
                  </div>
                </div>
                <button 
                  className={`inline-flex items-center px-3 py-1.5 border border-transparent text-sm font-medium rounded-md ${
                    user?.appleId 
                      ? 'text-gray-700 bg-gray-100 hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600' 
                      : 'text-primary-600 bg-primary-100 hover:bg-primary-200 dark:bg-primary-900 dark:text-primary-300 dark:hover:bg-primary-800'
                  } focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500`}
                >
                  {user?.appleId ? 'Disconnect' : 'Connect'}
                </button>
              </li>
            </ul>
          </div>
        </div>

        {/* Danger Zone Section */}
        <div className="bg-white rounded-lg shadow dark:bg-gray-800 overflow-hidden">
          <div className="px-6 py-5 border-b border-gray-200 dark:border-gray-700">
            <h3 className="text-lg font-medium text-red-600 dark:text-red-400">Danger Zone</h3>
          </div>
          <div className="px-6 py-5">
            <div className="border border-red-200 rounded-lg p-4 dark:border-red-900">
              <h4 className="text-base font-medium text-gray-900 dark:text-white">Delete Account</h4>
              <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
                Once you delete your account, all of your data will be permanently removed. This action cannot be undone.
              </p>
              
              {!showDeleteConfirm ? (
                <button
                  onClick={() => setShowDeleteConfirm(true)}
                  className="mt-4 inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-red-700 bg-red-100 hover:bg-red-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 dark:bg-red-900 dark:text-red-300 dark:hover:bg-red-800"
                >
                  Delete Account
                </button>
              ) : (
                <div className="mt-4 space-y-4">
                  <p className="text-sm font-medium text-gray-900 dark:text-white">
                    To confirm, type "delete my account" below:
                  </p>
                  <input
                    type="text"
                    value={deleteConfirmInput}
                    onChange={(e) => setDeleteConfirmInput(e.target.value)}
                    placeholder="delete my account"
                    className="input-field"
                  />
                  <div className="flex space-x-3">
                    <button
                      onClick={handleDeleteAccount}
                      disabled={deleteConfirmInput !== 'delete my account'}
                      className={`inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md ${
                        deleteConfirmInput === 'delete my account'
                          ? 'text-white bg-red-600 hover:bg-red-700 dark:bg-red-700 dark:hover:bg-red-600'
                          : 'text-red-700 bg-red-100 opacity-50 cursor-not-allowed dark:bg-red-900 dark:text-red-300'
                      } focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500`}
                    >
                      Permanently Delete
                    </button>
                    <button
                      onClick={() => {
                        setShowDeleteConfirm(false);
                        setDeleteConfirmInput('');
                      }}
                      className="inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 dark:bg-gray-700 dark:text-gray-300 dark:border-gray-600 dark:hover:bg-gray-600"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default withAuth(AccountSettings);