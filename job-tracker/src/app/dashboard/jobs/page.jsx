'use client';

import { useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import withAuth from '@/lib/withAuth';
import jobService from '@/lib/jobService';

function JobApplicationsPage() {
  const searchParams = useSearchParams();
  const initialStatus = searchParams.get('status') || '';
  
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [filters, setFilters] = useState({
    status: initialStatus,
    jobType: '',
    search: '',
    sortBy: 'updatedAt',
    sortOrder: 'desc'
  });

  // Status options
  const statusOptions = [
    'Saved',
    'Applied',
    'Phone Screen',
    'Interview',
    'Technical Assessment',
    'Offer',
    'Rejected',
    'Withdrawn'
  ];

  // Job type options
  const jobTypeOptions = [
    'Full-time',
    'Part-time',
    'Contract',
    'Internship',
    'Remote',
    'Other'
  ];

  // Load jobs
  useEffect(() => {
    const loadJobs = async () => {
      setLoading(true);
      try {
        const response = await jobService.getAllJobs(filters);
        if (response && response.success) {
          setJobs(response.data || []);
        }
        setError('');
      } catch (err) {
        console.error('Error loading jobs:', err);
        setError('Failed to load job applications');
        setJobs([]);
      } finally {
        setLoading(false);
      }
    };

    loadJobs();
  }, [filters]);

  // Handle filter changes
  const handleFilterChange = (filterName, value) => {
    setFilters(prev => ({
      ...prev,
      [filterName]: value
    }));
  };

  // Handle search
  const handleSearch = (e) => {
    e.preventDefault();
    // Search is already handled by the useEffect dependency on filters
  };

  // Clear filters
  const clearFilters = () => {
    setFilters({
      status: '',
      jobType: '',
      search: '',
      sortBy: 'updatedAt',
      sortOrder: 'desc'
    });
  };

  // Format date
  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('en-US', { 
      month: 'short', 
      day: 'numeric',
      year: 'numeric'
    }).format(date);
  };

  // Status badge color
  const getStatusColor = (status) => {
    switch (status) {
      case 'Saved':
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300';
      case 'Applied':
        return 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-300';
      case 'Phone Screen':
      case 'Interview':
      case 'Technical Assessment':
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300';
      case 'Offer':
        return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300';
      case 'Rejected':
      case 'Withdrawn':
        return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300';
    }
  };

  // Handle job deletion
  const handleDeleteJob = async (jobId, jobTitle) => {
    if (!confirm(`Are you sure you want to delete the application for "${jobTitle}"?`)) {
      return;
    }

    try {
      await jobService.deleteJob(jobId);
      // Refresh the job list
      const response = await jobService.getAllJobs(filters);
      if (response && response.success) {
        setJobs(response.data || []);
      }
    } catch (err) {
      console.error('Error deleting job:', err);
      setError('Failed to delete job application');
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
              Job Applications
            </h1>
            <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
              Manage and track all your job applications
            </p>
          </div>
          <Link 
            href="/dashboard/jobs/new"
            className="btn-primary"
          >
            Add New Application
          </Link>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 mb-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {/* Search */}
          <div>
            <label htmlFor="search" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Search
            </label>
            <input
              type="text"
              id="search"
              value={filters.search}
              onChange={(e) => handleFilterChange('search', e.target.value)}
              placeholder="Company, position, location..."
              className="input-field"
            />
          </div>

          {/* Status Filter */}
          <div>
            <label htmlFor="status" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Status
            </label>
            <select
              id="status"
              value={filters.status}
              onChange={(e) => handleFilterChange('status', e.target.value)}
              className="input-field"
            >
              <option value="">All Statuses</option>
              {statusOptions.map(status => (
                <option key={status} value={status}>
                  {status}
                </option>
              ))}
            </select>
          </div>

          {/* Job Type Filter */}
          <div>
            <label htmlFor="jobType" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Job Type
            </label>
            <select
              id="jobType"
              value={filters.jobType}
              onChange={(e) => handleFilterChange('jobType', e.target.value)}
              className="input-field"
            >
              <option value="">All Types</option>
              {jobTypeOptions.map(type => (
                <option key={type} value={type}>
                  {type}
                </option>
              ))}
            </select>
          </div>

          {/* Sort */}
          <div>
            <label htmlFor="sort" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Sort By
            </label>
            <select
              id="sort"
              value={`${filters.sortBy}-${filters.sortOrder}`}
              onChange={(e) => {
                const [sortBy, sortOrder] = e.target.value.split('-');
                handleFilterChange('sortBy', sortBy);
                handleFilterChange('sortOrder', sortOrder);
              }}
              className="input-field"
            >
              <option value="updatedAt-desc">Recently Updated</option>
              <option value="createdAt-desc">Recently Added</option>
              <option value="applicationDate-desc">Application Date (Newest)</option>
              <option value="applicationDate-asc">Application Date (Oldest)</option>
              <option value="company-asc">Company (A-Z)</option>
              <option value="company-desc">Company (Z-A)</option>
            </select>
          </div>
        </div>

        {/* Filter Actions */}
        <div className="mt-4 flex justify-between items-center">
          <span className="text-sm text-gray-500 dark:text-gray-400">
            {loading ? 'Loading...' : `${jobs.length} application${jobs.length !== 1 ? 's' : ''} found`}
          </span>
          <button
            onClick={clearFilters}
            className="text-sm text-primary-600 hover:text-primary-500 dark:text-primary-400 dark:hover:text-primary-300"
          >
            Clear Filters
          </button>
        </div>
      </div>

      {/* Error Message */}
      {error && (
        <div className="mb-6 p-4 bg-red-100 text-red-700 rounded-md dark:bg-red-900 dark:text-red-300">
          {error}
        </div>
      )}

      {/* Job List */}
      {loading ? (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-8 text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto"></div>
          <p className="mt-4 text-gray-500 dark:text-gray-400">Loading job applications...</p>
        </div>
      ) : jobs.length > 0 ? (
        <div className="bg-white dark:bg-gray-800 shadow overflow-hidden sm:rounded-md">
          <ul role="list" className="divide-y divide-gray-200 dark:divide-gray-700">
            {jobs.map((job) => (
              <li key={job._id}>
                <div className="px-4 py-4 sm:px-6 hover:bg-gray-50 dark:hover:bg-gray-700">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center min-w-0 flex-1">
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center">
                          <p className="text-sm font-medium text-primary-600 dark:text-primary-400 truncate">
                            {job.company}
                          </p>
                          <span className={`ml-2 px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusColor(job.status)}`}>
                            {job.status}
                          </span>
                        </div>
                        <div className="mt-2 flex">
                          <div className="flex items-center text-sm text-gray-500 dark:text-gray-400">
                            <p className="font-medium text-gray-900 dark:text-white mr-4">
                              {job.position}
                            </p>
                            <p className="mr-4">
                              📍 {job.location}
                            </p>
                            <p className="mr-4">
                              💼 {job.jobType}
                            </p>
                            {job.salary && (
                              <p className="mr-4">
                                💰 {job.salary}
                              </p>
                            )}
                          </div>
                        </div>
                        <div className="mt-2 flex items-center text-xs text-gray-500 dark:text-gray-400">
                          <span>Applied: {formatDate(job.applicationDate)}</span>
                          <span className="mx-2">•</span>
                          <span>Updated: {formatDate(job.updatedAt)}</span>
                          {job.tags && job.tags.length > 0 && (
                            <>
                              <span className="mx-2">•</span>
                              <span>Tags: {job.tags.join(', ')}</span>
                            </>
                          )}
                        </div>
                      </div>
                    </div>
                    
                    {/* Actions */}
                    <div className="flex items-center space-x-2">
                      {job.url && (
                        <a
                          href={job.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-gray-400 hover:text-gray-500 dark:hover:text-gray-300"
                          title="View job posting"
                        >
                          <svg className="h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                          </svg>
                        </a>
                      )}
                      
                      <Link
                        href={`/dashboard/jobs/${job._id}/edit`}
                        className="text-gray-400 hover:text-gray-500 dark:hover:text-gray-300"
                        title="Edit application"
                      >
                        <svg className="h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                        </svg>
                      </Link>
                      
                      <button
                        onClick={() => handleDeleteJob(job._id, `${job.company} - ${job.position}`)}
                        className="text-gray-400 hover:text-red-500 dark:hover:text-red-400"
                        title="Delete application"
                      >
                        <svg className="h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                      </button>
                    </div>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        </div>
      ) : (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-12 text-center">
          <svg className="mx-auto h-12 w-12 text-gray-400 dark:text-gray-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
          </svg>
          <h3 className="mt-2 text-sm font-medium text-gray-900 dark:text-white">No job applications found</h3>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            {Object.values(filters).some(f => f) 
              ? 'Try adjusting your filters or search terms.'
              : 'Get started by creating your first job application.'
            }
          </p>
          <div className="mt-6">
            <Link href="/dashboard/jobs/new" className="btn-primary">
              Add New Application
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}

export default withAuth(JobApplicationsPage);