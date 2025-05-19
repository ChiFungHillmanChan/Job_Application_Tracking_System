'use client';

import { useState } from 'react';
import { useAuth } from '@/lib/hooks/useAuth';
import Link from 'next/link';

export default function ResetPasswordPage({ params }) {
  const resetToken = params.token;
  
  const [formData, setFormData] = useState({
    password: '',
    confirmPassword: ''
  });
  
  const [showPassword, setShowPassword] = useState(false);
  const [formError, setFormError] = useState('');
  const [isSuccess, setIsSuccess] = useState(false);
  
  const { resetPassword, loading, error } = useAuth();

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setFormError('');
    
    // Basic validation
    if (!formData.password || !formData.confirmPassword) {
      setFormError('Please fill in all fields');
      return;
    }

    if (formData.password !== formData.confirmPassword) {
      setFormError('Passwords do not match');
      return;
    }

    if (formData.password.length < 6) {
      setFormError('Password must be at least 6 characters');
      return;
    }

    try {
      await resetPassword(resetToken, formData.password);
      setIsSuccess(true);
    } catch (error) {
      // Error is handled by the useAuth hook
      console.error('Reset password error:', error);
    }
  };

  const togglePasswordVisibility = () => {
    setShowPassword((prev) => !prev);
  };

  if (isSuccess) {
    return (
      <div className="w-full max-w-md p-6 bg-white rounded-lg shadow-md dark:bg-gray-800">
        <div className="text-center">
          <h3 className="text-lg font-medium text-gray-900 dark:text-white">
            Password reset successful!
          </h3>
          <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
            Your password has been reset successfully. You can now use your new password to sign in.
          </p>
        </div>
        <div className="mt-6 text-center">
          <Link href="/auth/login" className="font-medium text-primary-600 hover:text-primary-500">
            Go to sign in
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center justify-center min-h-screen px-4 py-12 bg-gray-50 dark:bg-gray-900 sm:px-6 lg:px-8">
      <div className="w-full max-w-md space-y-8">
        <div>
          <h2 className="mt-6 text-3xl font-extrabold text-center text-gray-900 dark:text-white">
            Create new password
          </h2>
          <p className="mt-2 text-sm text-center text-gray-600 dark:text-gray-400">
            Enter your new password below
          </p>
        </div>

        <div className="w-full max-w-md">
          <form onSubmit={handleSubmit} className="space-y-6">
            {(formError || error) && (
              <div className="p-3 mb-4 text-sm text-red-700 bg-red-100 rounded-md">
                {formError || error}
              </div>
            )}

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                New Password
              </label>
              <div className="relative mt-1">
                <input
                  id="password"
                  name="password"
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="new-password"
                  required
                  value={formData.password}
                  onChange={handleChange}
                  className="input-field"
                  placeholder="********"
                />
                <button
                  type="button"
                  onClick={togglePasswordVisibility}
                  className="absolute inset-y-0 right-0 flex items-center px-3 text-gray-500"
                >
                  {showPassword ? 'Hide' : 'Show'}
                </button>
              </div>
              <p className="mt-1 text-xs text-gray-500">
                Password must be at least 6 characters
              </p>
            </div>

            <div>
              <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                Confirm New Password
              </label>
              <input
                id="confirmPassword"
                name="confirmPassword"
                type={showPassword ? 'text' : 'password'}
                autoComplete="new-password"
                required
                value={formData.confirmPassword}
                onChange={handleChange}
                className="input-field"
                placeholder="********"
              />
            </div>

            <div>
              <button
                type="submit"
                disabled={loading}
                className="w-full btn-primary"
              >
                {loading ? 'Resetting password...' : 'Reset password'}
              </button>
            </div>

            <div className="text-sm text-center">
              <Link href="/auth/login" className="font-medium text-primary-600 hover:text-primary-500">
                Back to sign in
              </Link>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}