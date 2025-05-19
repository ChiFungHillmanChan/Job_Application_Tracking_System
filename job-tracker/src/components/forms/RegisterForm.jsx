'use client';

import { useState } from 'react';
import { useAuth } from '@/lib/hooks/useAuth';
import Link from 'next/link';

const RegisterForm = () => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: ''
  });
  
  const [showPassword, setShowPassword] = useState(false);
  const [formError, setFormError] = useState('');
  
  const { register, googleAuth, appleAuth, loading, error } = useAuth();

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
    if (!formData.name || !formData.email || !formData.password || !formData.confirmPassword) {
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
      // Remove confirmPassword before sending to API
      const { confirmPassword, ...registrationData } = formData;
      await register(registrationData);
    } catch (error) {
      // Error is handled by the useAuth hook
      console.error('Registration error:', error);
    }
  };

  const handleGoogleRegistration = async () => {
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
      console.error('Google registration error:', error);
    }
  };

  const handleAppleRegistration = async () => {
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
      console.error('Apple registration error:', error);
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
          <label htmlFor="name" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
            Full Name
          </label>
          <input
            id="name"
            name="name"
            type="text"
            autoComplete="name"
            required
            value={formData.name}
            onChange={handleChange}
            className="input-field"
            placeholder="John Doe"
          />
        </div>

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
          <label htmlFor="password" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
            Password
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
            Confirm Password
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
            {loading ? 'Creating account...' : 'Create account'}
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
            onClick={handleGoogleRegistration}
            className="inline-flex justify-center w-full px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md shadow-sm dark:bg-gray-800 dark:text-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700"
          >
            <span>Google</span>
          </button>
          <button
            type="button"
            onClick={handleAppleRegistration}
            className="inline-flex justify-center w-full px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md shadow-sm dark:bg-gray-800 dark:text-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700"
          >
            <span>Apple</span>
          </button>
        </div>
      </div>

      <div className="mt-6 text-sm text-center text-gray-500">
        Already have an account?{' '}
        <Link href="/auth/login" className="font-medium text-primary-600 hover:text-primary-500">
          Sign in
        </Link>
      </div>
    </div>
  );
};

export default RegisterForm;