
'use client';

import { useState } from 'react';
import { useAuth } from '@/lib/hooks/useAuth';
import Link from 'next/link';

const ForgotPasswordForm = () => {
  const [email, setEmail] = useState('');
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [formError, setFormError] = useState('');
  
  const { forgotPassword, loading, error } = useAuth();

  const handleChange = (e) => {
    setEmail(e.target.value);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setFormError('');
    
    // Basic validation
    if (!email) {
      setFormError('Please enter your email address');
      return;
    }

    try {
      await forgotPassword(email);
      setIsSubmitted(true);
    } catch (error) {
      // Error is handled by the useAuth hook
      console.error('Forgot password error:', error);
    }
  };

  if (isSubmitted) {
    return (
      <div className="w-full max-w-md p-6 bg-white rounded-lg shadow-md dark:bg-gray-800">
        <div className="text-center">
          <h3 className="text-lg font-medium text-gray-900 dark:text-white">
            Check your email
          </h3>
          <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
            We've sent a password reset link to {email}. Please check your inbox and follow the instructions to reset your password.
          </p>
          <p className="mt-4 text-sm text-gray-600 dark:text-gray-400">
            If you don't see the email, check your spam folder.
          </p>
        </div>
        <div className="mt-6 text-center">
          <Link href="/auth/login" className="font-medium text-primary-600 hover:text-primary-500">
            Back to sign in
          </Link>
        </div>
      </div>
    );
  }

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
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            Enter the email address associated with your account and we'll send you a link to reset your password.
          </p>
          <input
            id="email"
            name="email"
            type="email"
            autoComplete="email"
            required
            value={email}
            onChange={handleChange}
            className="input-field mt-1"
            placeholder="you@example.com"
          />
        </div>

        <div>
          <button
            type="submit"
            disabled={loading}
            className="w-full btn-primary"
          >
            {loading ? 'Sending...' : 'Send reset link'}
          </button>
        </div>

        <div className="text-sm text-center">
          <Link href="/auth/login" className="font-medium text-primary-600 hover:text-primary-500">
            Back to sign in
          </Link>
        </div>
      </form>
    </div>
  );
};

export default ForgotPasswordForm;