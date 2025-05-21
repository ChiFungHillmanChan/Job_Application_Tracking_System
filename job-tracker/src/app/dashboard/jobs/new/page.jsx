// app/dashboard/jobs/new/page.jsx
'use client';

import { useRouter } from 'next/navigation';
import withAuth from '@/lib/withAuth';
import JobForm from '@/components/forms/JobForm';
import Link from 'next/link';

function AddNewJobPage() {
  const router = useRouter();

  const handleSuccess = (jobData) => {
    // Redirect to dashboard with success message
    router.push('/dashboard?success=Job application created successfully');
  };

  const handleCancel = () => {
    router.push('/dashboard');
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Breadcrumb Navigation */}
        <div className="mb-6 flex items-center text-sm text-gray-600 dark:text-gray-400">
          <Link 
            href="/dashboard" 
            className="hover:text-gray-900 dark:hover:text-gray-200 hover:underline"
          >
            Dashboard
          </Link>
          <svg 
            className="mx-2 h-4 w-4" 
            xmlns="http://www.w3.org/2000/svg" 
            fill="none" 
            viewBox="0 0 24 24" 
            stroke="currentColor"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
          <span className="text-gray-900 dark:text-gray-200 font-medium">Add New Application</span>
        </div>

        {/* Job Form */}
        <JobForm onSuccess={handleSuccess} onCancel={handleCancel} />
      </div>
    </div>
  );
}

export default withAuth(AddNewJobPage);