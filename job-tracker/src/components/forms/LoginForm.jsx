'use client';

import { useState } from 'react';
import { useAuth } from '@/lib/hooks/useAuth';
import Link from 'next/link';

const LoginForm = () => {
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  });
  const [showPassword, setShowPassword] = useState(false);
  const [formError, setFormError] = useState('');
  
  const { login, googleAuth, appleAuth, loading, error } = useAuth();

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
    if (!formData.email || !formData.password) {
      setFormError('Please fill in all fields');
      return;
    }

    try {
      await login(formData);
    } catch (error) {
      // Error is handled by the useAuth hook
      console.error('Login error:', error);
    }
  };

  const handleGoogleLogin = async () => {
    // In a real implementation, this would integrate with Google OAuth
    // For now, we'll simulate the response data
    try {
      const mockGoogleData = {
        googleId: 'google-oauth2-id',
        name: 'Google User',
        email: 'googleuser@example.com'
      };
      
      await googleAuth(mockGoogleData);
    } catch (error) {
      console.error('Google login error:', error);
    }
  };

  const handleAppleLogin = async () => {
    // In a real implementation, this would integrate with Apple OAuth
    // For now, we'll simulate the response data
    try {
      const mockAppleData = {
        appleId: 'apple-oauth2-id',
        name: 'Apple User',
        email: 'appleuser@example.com'
      };
      
      await appleAuth(mockAppleData);
    } catch (error) {
      console.error('Apple login error:', error);
    }
  };

  const togglePasswordVisibility = () => {
    setShowPassword((prev) => !prev);
  };

  return (
    <div className="w-full max-w-md">
      <form onSubmit={handleSubmit} className="space-y-6">
        {(formError || error) && (
          <div className="p-3 mb-4 text-sm text-red-700 bg-red-100 rounded-md">
            {formError || error}
          </div>
        )}

        <div>
          <label htmlFor="email" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
            Email Address
          </label>
          <input
            id="email"
            name="email"
            type="email"
            autoComplete="email"
            required
            value={formData.email}
            onChange={handleChange}
            className="input-field"
            placeholder="you@example.com"
          />
        </div>

        <div>
          <div className="flex items-center justify-between">
            <label htmlFor="password" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
              Password
            </label>
            <Link href="/auth/forgot-password" className="text-sm font-medium text-primary-600 hover:text-primary-500">
              Forgot password?
            </Link>
          </div>
          <div className="relative mt-1">
            <input
              id="password"
              name="password"
              type={showPassword ? 'text' : 'password'}
              autoComplete="current-password"
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
        </div>

        <div>
          <button
            type="submit"
            disabled={loading}
            className="w-full btn-primary"
          >
            {loading ? 'Signing in...' : 'Sign in'}
          </button>
        </div>
      </form>

      <div className="mt-8">
        <div className="relative">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-gray-300 dark:border-gray-700"></div>
          </div>
          <div className="relative flex justify-center text-sm">
            <span className="px-2 text-gray-500 bg-white dark:bg-gray-900">Or continue with</span>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3 mt-6">
          <button
            type="button"
            onClick={handleGoogleLogin}
            className="inline-flex justify-center w-full px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md shadow-sm dark:bg-gray-800 dark:text-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700"
          >
            <span>Google</span>
          </button>
          <button
            type="button"
            onClick={handleAppleLogin}
            className="inline-flex justify-center w-full px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md shadow-sm dark:bg-gray-800 dark:text-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700"
          >
            <span>Apple</span>
          </button>
        </div>
      </div>

      <div className="mt-6 text-sm text-center text-gray-500">
        Don't have an account?{' '}
        <Link href="/auth/register" className="font-medium text-primary-600 hover:text-primary-500">
          Sign up
        </Link>
      </div>
    </div>
  );
};

export default LoginForm;