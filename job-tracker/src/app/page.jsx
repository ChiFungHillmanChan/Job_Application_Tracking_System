import Link from 'next/link';

export default function Home() {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen px-4 py-12 bg-gray-50 dark:bg-gray-900 sm:px-6 lg:px-8">
      <div className="w-full max-w-md space-y-8">
        <div>
          <h1 className="text-4xl font-bold tracking-tight text-center text-gray-900 dark:text-white">
            Job Application Tracker
          </h1>
          <p className="mt-2 text-sm text-center text-gray-600 dark:text-gray-400">
            Organize your job search and track your applications in one place
          </p>
        </div>
        <div className="mt-8 space-y-4">
          <Link href="/auth/login" className="flex justify-center w-full btn-primary">
            Login
          </Link>
          <Link href="/auth/register" className="flex justify-center w-full btn-secondary">
            Register
          </Link>
        </div>
      </div>
    </div>
  );
}