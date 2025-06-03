'use client';

import { useState } from 'react';
import { useAuth } from '@/lib/hooks/useAuth';
import { useSavedJobs } from '@/lib/hooks/useSavedJobs';
import jobFinderService from '@/lib/jobFinderService';

const JobFinderJobCard = ({ 
  job, 
  onJobSelect, 
  compact = false,
  showDistance = false,
  userLocation = null 
}) => {
  const { user } = useAuth();
  const { isJobSaved, saveJob, unsaveJob, importJob, canSaveMore } = useSavedJobs();
  const [saving, setSaving] = useState(false);
  const [importing, setImporting] = useState(false);

  const isSaved = isJobSaved(job.externalId, job.source);
  const sourceBadge = jobFinderService.getSourceBadge(job.source);

  // Handle save/unsave
  const handleSaveToggle = async (e) => {
    e.stopPropagation();
    
    if (!user) {
      alert('Please log in to save jobs');
      return;
    }

    if (!isSaved && !canSaveMore()) {
      alert('You\'ve reached your saved jobs limit. Upgrade to save more jobs.');
      return;
    }

    setSaving(true);
    
    try {
      if (isSaved) {
        const savedJob = getSavedJob(job.externalId, job.source);
        if (savedJob) {
          await unsaveJob(savedJob._id);
        }
      } else {
        await saveJob({
          externalId: job.externalId,
          source: job.source,
          title: job.title,
          company: job.company,
          location: job.location,
          salary: job.salary,
          jobType: job.jobType,
          workType: job.workType,
          description: job.description,
          applicationUrl: job.applicationUrl,
          companyUrl: job.companyUrl,
          logoUrl: job.logoUrl,
          postedDate: job.postedDate,
          expirationDate: job.expirationDate
        });
      }
    } catch (error) {
      alert(error.message);
    } finally {
      setSaving(false);
    }
  };

  // Handle import to tracker
  const handleImport = async (e) => {
    e.stopPropagation();
    
    if (!user) {
      alert('Please log in to import jobs');
      return;
    }

    if (user.subscriptionTier === 'free') {
      alert('Job import is a Plus feature. Upgrade to import jobs to your tracker.');
      return;
    }

    if (!isSaved) {
      alert('Please save this job first before importing');
      return;
    }

    setImporting(true);
    
    try {
      const savedJob = getSavedJob(job.externalId, job.source);
      if (savedJob) {
        await importJob(savedJob._id);
        alert('Job imported to your tracker successfully!');
      }
    } catch (error) {
      alert(error.message);
    } finally {
      setImporting(false);
    }
  };

  // Calculate distance if available
  const distance = showDistance && userLocation && job.location?.coordinates
    ? jobFinderService.formatDistance(
        calculateDistance(userLocation, job.location.coordinates)
      )
    : null;

  const calculateDistance = (point1, point2) => {
    const R = 6371e3; // Earth's radius in metres
    const φ1 = point1.lat * Math.PI / 180;
    const φ2 = point2.lat * Math.PI / 180;
    const Δφ = (point2.lat - point1.lat) * Math.PI / 180;
    const Δλ = (point2.lng - point1.lng) * Math.PI / 180;

    const a = Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
              Math.cos(φ1) * Math.cos(φ2) *
              Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    const distance = R * c; // in metres
    
    return {
      meters: Math.round(distance),
      miles: Math.round(distance / 1609.34 * 100) / 100
    };
  };

  // Format posted date
  const formatPostedDate = (date) => {
    if (!date) return '';
    return jobFinderService.getJobFreshness(date);
  };

  // Handle card click
  const handleCardClick = () => {
    if (onJobSelect) {
      onJobSelect(job);
    }
  };

  if (compact) {
    return (
      <div 
        className="p-3 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg cursor-pointer hover:shadow-md transition-shadow duration-200"
        onClick={handleCardClick}
      >
        <div className="flex justify-between items-start">
          <div className="flex-1 min-w-0">
            <h3 className="text-sm font-semibold text-gray-900 dark:text-white truncate">
              {job.title}
            </h3>
            <p className="text-xs text-gray-600 dark:text-gray-400 truncate">
              {job.company}
            </p>
            <p className="text-xs text-gray-500 dark:text-gray-500 truncate">
              {job.location?.display}
            </p>
          </div>
          
          <div className="flex items-center space-x-1 ml-2">
            <button
              onClick={handleSaveToggle}
              disabled={saving}
              className={`p-1 rounded ${
                isSaved 
                  ? 'text-red-600 hover:text-red-700' 
                  : 'text-gray-400 hover:text-red-600'
              } transition-colors duration-200`}
              title={isSaved ? 'Remove from saved' : 'Save job'}
            >
              <svg className="h-4 w-4" fill={isSaved ? 'currentColor' : 'none'} viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
              </svg>
            </button>
          </div>
        </div>
        
        {job.salary && (
          <div className="mt-1">
            <span className="text-xs font-medium text-green-600 dark:text-green-400">
              {jobFinderService.formatSalary(job.salary)}
            </span>
          </div>
        )}
      </div>
    );
  }

  return (
    <div 
      className="p-6 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-sm cursor-pointer hover:shadow-md transition-all duration-200 hover:border-primary-300 dark:hover:border-primary-600"
      onClick={handleCardClick}
    >
      {/* Header */}
      <div className="flex justify-between items-start mb-4">
        <div className="flex-1 min-w-0">
          <div className="flex items-center space-x-2 mb-1">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white line-clamp-2">
              {job.title}
            </h3>
            <span className={`px-2 py-1 text-xs font-medium rounded-full ${sourceBadge.color}`}>
              {sourceBadge.name}
            </span>
          </div>
          
          <div className="flex items-center space-x-2 text-sm text-gray-600 dark:text-gray-400">
            <span className="font-medium">{job.company}</span>
            {job.companyUrl && (
              <a 
                href={job.companyUrl} 
                target="_blank" 
                rel="noopener noreferrer"
                onClick={(e) => e.stopPropagation()}
                className="text-primary-600 hover:text-primary-700 dark:text-primary-400 dark:hover:text-primary-300"
              >
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                </svg>
              </a>
            )}
          </div>
        </div>

        {/* Action buttons */}
        <div className="flex items-center space-x-2 ml-4">
          <button
            onClick={handleSaveToggle}
            disabled={saving}
            className={`p-2 rounded-md transition-all duration-200 ${
              isSaved 
                ? 'text-red-600 bg-red-50 hover:bg-red-100 dark:bg-red-900/20 dark:hover:bg-red-900/30' 
                : 'text-gray-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20'
            } ${saving ? 'opacity-50 cursor-not-allowed' : ''}`}
            title={isSaved ? 'Remove from saved jobs' : 'Save this job'}
          >
            {saving ? (
              <svg className="h-5 w-5 animate-spin" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
            ) : (
              <svg className="h-5 w-5" fill={isSaved ? 'currentColor' : 'none'} viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
              </svg>
            )}
          </button>

          {/* Import button - Premium feature */}
          {user?.subscriptionTier !== 'free' && isSaved && (
            <button
              onClick={handleImport}
              disabled={importing}
              className={`p-2 rounded-md transition-all duration-200 text-primary-600 hover:text-primary-700 hover:bg-primary-50 dark:hover:bg-primary-900/20 ${
                importing ? 'opacity-50 cursor-not-allowed' : ''
              }`}
              title="Import to job tracker"
            >
              {importing ? (
                <svg className="h-5 w-5 animate-spin" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
              ) : (
                <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                </svg>
              )}
            </button>
          )}
        </div>
      </div>

      {/* Job details badges */}
      <div className="flex flex-wrap gap-2 mb-4">
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200">
          <svg className="mr-1 h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
          </svg>
          {job.location?.display}
          {distance && <span className="ml-1">({distance})</span>}
        </span>

        {job.salary && (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">
            <svg className="mr-1 h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
            </svg>
            {jobFinderService.formatSalary(job.salary)}
          </span>
        )}

        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200">
          <svg className="mr-1 h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2-2v2m8 0V6a2 2 0 012 2v6a2 2 0 01-2 2H8a2 2 0 01-2-2V8a2 2 0 012-2V6" />
          </svg>
          {jobFinderService.formatJobType(job.jobType)}
        </span>

        {job.workType && job.workType !== 'onsite' && (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200">
            <svg className="mr-1 h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
            </svg>
            {jobFinderService.formatWorkType(job.workType)}
          </span>
        )}
      </div>

      {/* Job description preview */}
      <div className="mb-4">
        <p className="text-sm text-gray-600 dark:text-gray-400 line-clamp-3">
          {job.description}
        </p>
      </div>

      {/* Footer */}
      <div className="flex justify-between items-center pt-4 border-t border-gray-200 dark:border-gray-700">
        <div className="flex items-center space-x-4 text-xs text-gray-500 dark:text-gray-400">
          <span className="flex items-center">
            <svg className="mr-1 h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            {formatPostedDate(job.postedDate)}
          </span>
          
          {job.expirationDate && (
            <span className="flex items-center">
              <svg className="mr-1 h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
              Expires {formatPostedDate(job.expirationDate)}
            </span>
          )}
        </div>

        <a
          href={job.applicationUrl}
          target="_blank"
          rel="noopener noreferrer"
          onClick={(e) => e.stopPropagation()}
          className="inline-flex items-center px-4 py-2 text-sm font-medium text-white bg-primary-600 border border-transparent rounded-md shadow-sm hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 transition-colors duration-200"
        >
          Apply Now
          <svg className="ml-1 h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
          </svg>
        </a>
      </div>
    </div>
  );
};

export default JobFinderJobCard;