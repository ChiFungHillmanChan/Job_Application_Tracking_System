'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import useAuth from '@/lib/hooks/useAuth';

export default function RegisterForm() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  
  const router = useRouter();
  const { register } = useAuth();
  
  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMessage('');
    
    // Validate form fields
    if (!name || !email || !password || !confirmPassword) {
      setErrorMessage('Please fill in all fields');
      return;
    }
    
    if (password.length < 6) {
      setErrorMessage('Password must be at least 6 characters');
      return;
    }
    
    if (password !== confirmPassword) {
      setErrorMessage('Passwords do not match');
      return;
    }
    
    setIsSubmitting(true);
    
    try {
      await register({ name, email, password });
      router.push('/dashboard');
    } catch (error) {
      console.log('Register form error:', error || 'Unknown error');
      
      // Handle different error types with fallbacks
      if (!error) {
        // Handle undefined/null errors
        setErrorMessage('An unknown error occurred. Please try again.');
      } else if (error.message && error.message.includes('Network Error')) {
        // Handle network errors specifically
        setErrorMessage(
          'Cannot connect to the server. The application is running in offline mode with limited functionality.'
        );
      } else if (error.response && error.response.data && error.response.data.error) {
        // Handle array of error messages
        if (Array.isArray(error.response.data.error)) {
          setErrorMessage(error.response.data.error.join(', '));
        } else {
          setErrorMessage(error.response.data.error);
        }
      } else if (error.message) {
        // Use the error message if it exists
        setErrorMessage(error.message);
      } else {
        // Generic error message as fallback
        setErrorMessage('Registration failed. Please try again.');
      }
    } finally {
      setIsSubmitting(false);
    }
  };
  
  return (
    <div className="w-full max-w-md space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-center text-gray-900 dark:text-white">
          Create your account
        </h1>
        <p className="mt-2 text-sm text-center text-gray-600 dark:text-gray-400">
          Already have an account?{' '}
          <Link
            href="/auth/login"
            className="font-medium text-primary-600 hover:text-primary-500 dark:text-primary-400 dark:hover:text-primary-300"
          >
            Sign in
          </Link>
        </p>
      </div>
      
      {errorMessage && (
        <div className="p-3 text-sm text-red-700 bg-red-100 rounded-md dark:bg-red-900 dark:text-red-300">
          {errorMessage}
        </div>
      )}
      
      <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
        <div className="space-y-4 rounded-md shadow-sm">
          <div>
            <label htmlFor="name" className="sr-only">
              Full Name
            </label>
            <input
              id="name"
              name="name"
              type="text"
              autoComplete="name"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="input-field"
              placeholder="Full Name"
            />
          </div>
          <div>
            <label htmlFor="email" className="sr-only">
              Email address
            </label>
            <input
              id="email"
              name="email"
              type="email"
              autoComplete="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="input-field"
              placeholder="Email address"
            />
          </div>
          <div>
            <label htmlFor="password" className="sr-only">
              Password
            </label>
            <input
              id="password"
              name="password"
              type="password"
              autoComplete="new-password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="input-field"
              placeholder="Password"
            />
          </div>
          <div>
            <label htmlFor="confirmPassword" className="sr-only">
              Confirm Password
            </label>
            <input
              id="confirmPassword"
              name="confirmPassword"
              type="password"
              autoComplete="new-password"
              required
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className="input-field"
              placeholder="Confirm Password"
            />
          </div>
        </div>
        
        <div>
          <button
            type="submit"
            disabled={isSubmitting}
            className={`w-full btn-primary ${
              isSubmitting ? 'opacity-75 cursor-not-allowed' : ''
            }`}
          >
            {isSubmitting ? (
              <div className="flex items-center justify-center">
                <svg className="w-5 h-5 mr-3 -ml-1 text-white animate-spin" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Creating Account...
              </div>
            ) : (
              'Create Account'
            )}
          </button>
        </div>
      </form>
      
      <div className="mt-6">
        <div className="relative">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-gray-300 dark:border-gray-600"></div>
          </div>
          <div className="relative flex justify-center text-sm">
            <span className="px-2 text-gray-500 bg-white dark:bg-gray-900 dark:text-gray-400">
              Or continue with
            </span>
          </div>
        </div>
        
        <div className="grid grid-cols-2 gap-3 mt-6">
          <button
            type="button"
            className="inline-flex justify-center w-full px-4 py-2 text-sm font-medium text-gray-500 bg-white border border-gray-300 rounded-md shadow-sm dark:bg-gray-800 dark:text-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700"
          >
            <svg className="w-5 h-5 mr-2" aria-hidden="true" fill="currentColor" viewBox="0 0 20 20">
              <path d="M10 0C4.477 0 0 4.484 0 10.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0110 4.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.203 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.942.359.31.678.921.678 1.856 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0020 10.017C20 4.484 15.522 0 10 0z" />
            </svg>
            <span>GitHub</span>
          </button>
          <button
            type="button"
            className="inline-flex justify-center w-full px-4 py-2 text-sm font-medium text-gray-500 bg-white border border-gray-300 rounded-md shadow-sm dark:bg-gray-800 dark:text-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700"
          >
            <svg className="w-5 h-5 mr-2" aria-hidden="true" fill="currentColor" viewBox="0 0 20 20">
              <path d="M10 0C4.477 0 0 4.484 0 10.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0110 4.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.203 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.942.359.31.678.921.678 1.856 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0020 10.017C20 4.484 15.522 0 10 0z" />
            </svg>
            <span>Google</span>
          </button>
        </div>
      </div>
      
      <div className="text-xs text-center text-gray-500 dark:text-gray-400">
        By registering, you agree to our{' '}
        <Link href="/terms" className="text-primary-600 hover:underline dark:text-primary-400">
          Terms of Service
        </Link>{' '}
        and{' '}
        <Link href="/privacy" className="text-primary-600 hover:underline dark:text-primary-400">
          Privacy Policy
        </Link>
      </div>
    </div>
  );
}