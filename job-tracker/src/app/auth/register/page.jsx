
'use client';

import RegisterForm from '@/components/forms/RegisterForm';
import Link from 'next/link';

export default function RegisterPage() {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen px-4 py-12 bg-gray-50 dark:bg-gray-900 sm:px-6 lg:px-8">
      <div className="w-full max-w-md space-y-8">
        <div>
          <h2 className="mt-6 text-3xl font-extrabold text-center text-gray-900 dark:text-white">
            Create a new account
          </h2>
          <p className="mt-2 text-sm text-center text-gray-600 dark:text-gray-400">
            Start tracking your job applications today
          </p>
        </div>
        
        <RegisterForm />
        
        <div className="mt-4 text-sm text-center text-gray-500">
          <Link href="/" className="font-medium text-primary-600 hover:text-primary-500">
            ← Back to home
          </Link>
        </div>
      </div>
    </div>
  );
}