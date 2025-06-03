'use client';

import { useState, useEffect, useCallback } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import withAuth from '@/lib/withAuth';
import { useAuth } from '@/lib/hooks/useAuth';
import { useJobSearch } from '@/lib/hooks/useJobSearch';
import { useSavedJobs } from '@/lib/hooks/useSavedJobs';
import JobFinderJobCard from '@/components/job-finder/JobFinderJobCard';
import locationService from '@/lib/locationService';
import Link from 'next/link';

function JobFinderPage() {
  const { user } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const {
    jobs,
    pagination,
    loading,
    error,
    searchJobs,
    loadNextPage,
    getSearchSummary,
    clearResults,
    hasResults,
    isEmpty,
    canLoadMore
  } = useJobSearch();
  
  const { usage, canSaveMore, getSavedJob } = useSavedJobs();

  // Search state
  const [searchQuery, setSearchQuery] = useState({
    keywords: searchParams.get('keywords') || '',
    location: searchParams.get('location') || '',
    distance: parseInt(searchParams.get('distance')) || 25,
    permanent: searchParams.get('permanent') !== 'false',
    contract: searchParams.get('contract') !== 'false',
    temp: searchParams.get('temp') !== 'false',
    partTime: searchParams.get('partTime') !== 'false',
    fullTime: searchParams.get('fullTime') !== 'false',
    minimumSalary: parseInt(searchParams.get('minimumSalary')) || 0,
    maximumSalary: parseInt(searchParams.get('maximumSalary')) || 0,
    postedDays: parseInt(searchParams.get('postedDays')) || 30
  });

  // UI state
  const [selectedJob, setSelectedJob] = useState(null);
  const [viewMode, setViewMode] = useState('list'); // 'list' | 'grid'
  const [showFilters, setShowFilters] = useState(false);
  const [userLocation, setUserLocation] = useState(null);
  const [gettingLocation, setGettingLocation] = useState(false);

  // Location suggestions state
  const [locationSuggestions, setLocationSuggestions] = useState([]);
  const [showLocationSuggestions, setShowLocationSuggestions] = useState(false);
  const [locationInputFocused, setLocationInputFocused] = useState(false);

  // Debounce timer for location suggestions
  const [locationDebounceTimer, setLocationDebounceTimer] = useState(null);

  // Handle search form submission - ONLY WAY TO TRIGGER SEARCH
  const handleSearch = useCallback(async (e) => {
    e?.preventDefault();
    
    console.log('🔍 Manual search triggered with:', searchQuery);
    
    // Clear any location suggestions
    setShowLocationSuggestions(false);
    
    // Clean up search params
    const cleanParams = { ...searchQuery };
    if (!cleanParams.keywords.trim()) delete cleanParams.keywords;
    if (!cleanParams.location.trim()) delete cleanParams.location;
    if (cleanParams.minimumSalary === 0) delete cleanParams.minimumSalary;
    if (cleanParams.maximumSalary === 0) delete cleanParams.maximumSalary;

    // Update URL with search params
    const urlParams = new URLSearchParams();
    Object.entries(cleanParams).forEach(([key, value]) => {
      if (value !== '' && value !== 0 && value !== false) {
        urlParams.set(key, value.toString());
      }
    });
    
    const newUrl = `/dashboard/job-finder${urlParams.toString() ? '?' + urlParams.toString() : ''}`;
    router.replace(newUrl, { shallow: true });

    await searchJobs(cleanParams);
  }, [searchQuery, searchJobs, router]);

  // Handle search input changes - NO AUTOMATIC SEARCH
  const handleSearchChange = (field, value) => {
    setSearchQuery(prev => ({
      ...prev,
      [field]: value
    }));
  };

  // Handle location input with suggestions - NO AUTOMATIC SEARCH
  const handleLocationChange = (value) => {
    // Update search query state
    handleSearchChange('location', value);
    
    // Clear existing timer
    if (locationDebounceTimer) {
      clearTimeout(locationDebounceTimer);
    }
    
    // Only get suggestions if input is focused and has reasonable length
    if (locationInputFocused && value.length >= 2) {
      // Debounce location suggestions to avoid rapid API calls
      const newTimer = setTimeout(async () => {
        try {
          console.log('🗺️ Getting location suggestions for:', value);
          const suggestions = await locationService.searchLocations(value);
          setLocationSuggestions(suggestions);
          setShowLocationSuggestions(true);
        } catch (error) {
          console.warn('Location suggestions failed:', error.message);
          // Don't show error to user for suggestions, just hide them
          setLocationSuggestions([]);
          setShowLocationSuggestions(false);
        }
      }, 500); // 500ms debounce
      
      setLocationDebounceTimer(newTimer);
    } else {
      setLocationSuggestions([]);
      setShowLocationSuggestions(false);
    }
  };

  // Select location suggestion
  const selectLocationSuggestion = (location) => {
    setSearchQuery(prev => ({
      ...prev,
      location: location.display
    }));
    setLocationSuggestions([]);
    setShowLocationSuggestions(false);
    setLocationInputFocused(false);
  };

  // Get current location
  const handleGetCurrentLocation = async () => {
    setGettingLocation(true);
    
    try {
      console.log('📍 Getting current location...');
      const location = await locationService.getCurrentLocation();
      setUserLocation(location);
      setSearchQuery(prev => ({
        ...prev,
        location: location.display
      }));
      console.log('✅ Got current location:', location.display);
    } catch (error) {
      console.error('Failed to get current location:', error);
      alert('Failed to get your location. Please enter manually or check location permissions.');
    } finally {
      setGettingLocation(false);
    }
  };

  // Clear search
  const handleClearSearch = () => {
    setSearchQuery({
      keywords: '',
      location: '',
      distance: 25,
      permanent: true,
      contract: true,
      temp: true,
      partTime: true,
      fullTime: true,
      minimumSalary: 0,
      maximumSalary: 0,
      postedDays: 30
    });
    clearResults();
    setLocationSuggestions([]);
    setShowLocationSuggestions(false);
    router.replace('/dashboard/job-finder', { shallow: true });
  };

  // Load more jobs
  const handleLoadMore = () => {
    if (canLoadMore) {
      loadNextPage();
    }
  };

  // Handle job card click
  const handleJobSelect = (job) => {
    setSelectedJob(job);
  };

  // Close modal when clicking outside
  const handleCloseModal = () => {
    setSelectedJob(null);
  };

  // Quick search suggestions
  const quickSearchSuggestions = [
    { keywords: 'Software Developer', location: 'London' },
    { keywords: 'Marketing Manager', location: 'Manchester' },
    { keywords: 'Data Analyst', location: 'Birmingham' },
    { keywords: 'UX Designer', location: 'Leeds' },
    { keywords: 'Project Manager', location: 'Bristol' },
    { keywords: 'DevOps Engineer', location: 'Edinburgh' }
  ];

  // Apply quick search
  const applyQuickSearch = (suggestion) => {
    setSearchQuery(prev => ({
      ...prev,
      keywords: suggestion.keywords,
      location: suggestion.location
    }));
  };

  // Handle location input focus
  const handleLocationFocus = () => {
    setLocationInputFocused(true);
    // Show suggestions if we have a location value
    if (searchQuery.location && searchQuery.location.length >= 2) {
      setShowLocationSuggestions(locationSuggestions.length > 0);
    }
  };

  // Handle location input blur (with delay to allow suggestion clicks)
  const handleLocationBlur = () => {
    setTimeout(() => {
      setLocationInputFocused(false);
      setShowLocationSuggestions(false);
    }, 200);
  };

  // ONLY trigger initial search if URL has search parameters
  useEffect(() => {
    const hasParams = searchParams.toString();
    const hasSearchTerms = searchQuery.keywords || searchQuery.location;
    
    if (hasParams && hasSearchTerms) {
      console.log('🚀 Initial search triggered from URL params');
      handleSearch();
    }
  }, []); // Only run once on mount

  // Close location suggestions when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (showLocationSuggestions && !event.target.closest('.location-input-container')) {
        setShowLocationSuggestions(false);
        setLocationInputFocused(false);
      }
    };

    document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
  }, [showLocationSuggestions]);

  // Cleanup location debounce timer
  useEffect(() => {
    return () => {
      if (locationDebounceTimer) {
        clearTimeout(locationDebounceTimer);
      }
    };
  }, [locationDebounceTimer]);

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 sticky top-0 z-10">
          <div className="px-4 sm:px-6 lg:px-8 py-6">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                  Job Finder
                </h1>
                <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
                  Discover job opportunities from top UK job boards
                </p>
              </div>

              {/* Quick actions */}
              <div className="flex items-center space-x-3">
                <Link
                  href="/dashboard/job-finder/saved"
                  className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 dark:bg-gray-700 dark:text-gray-300 dark:border-gray-600 dark:hover:bg-gray-600"
                >
                  <svg className="mr-2 h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                  </svg>
                  Saved Jobs ({usage.used || 0})
                </Link>

                {/* Usage indicator for free users */}
                {user?.subscriptionTier === 'free' && (
                  <div className="text-right">
                    <div className="text-sm text-gray-600 dark:text-gray-400">
                      {usage.used || 0} / {usage.limit || 5} saved
                    </div>
                    <div className="w-24 bg-gray-200 dark:bg-gray-700 rounded-full h-2 mt-1">
                      <div 
                        className={`h-2 rounded-full transition-all duration-300 ${
                          (usage.used || 0) >= (usage.limit || 5) 
                            ? 'bg-red-500' 
                            : (usage.used || 0) >= (usage.limit || 5) - 1 
                            ? 'bg-orange-500' 
                            : 'bg-primary-600'
                        }`}
                        style={{ 
                          width: `${Math.min(100, ((usage.used || 0) / (usage.limit || 5)) * 100)}%` 
                        }}
                      />
                    </div>
                    {!canSaveMore() && (
                      <Link
                        href="/settings/subscription"
                        className="text-xs text-primary-600 hover:text-primary-700 dark:text-primary-400 dark:hover:text-primary-300 mt-1 block"
                      >
                        Upgrade for unlimited saves
                      </Link>
                    )}
                  </div>
                )}
              </div>
            </div>

            {/* Search Form */}
            <form onSubmit={handleSearch} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
                {/* Keywords */}
                <div className="md:col-span-5">
                  <label htmlFor="keywords" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Job Title or Keywords
                  </label>
                  <input
                    type="text"
                    id="keywords"
                    value={searchQuery.keywords}
                    onChange={(e) => handleSearchChange('keywords', e.target.value)}
                    placeholder="e.g. Software Developer, Marketing Manager"
                    className="input-field"
                  />
                </div>

                {/* Location */}
                <div className="md:col-span-4 relative location-input-container">
                  <label htmlFor="location" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Location
                  </label>
                  <div className="relative">
                    <input
                      type="text"
                      id="location"
                      value={searchQuery.location}
                      onChange={(e) => handleLocationChange(e.target.value)}
                      onFocus={handleLocationFocus}
                      onBlur={handleLocationBlur}
                      placeholder="e.g. London, Manchester"
                      className="input-field pr-10"
                      autoComplete="off"
                    />
                    <button
                      type="button"
                      onClick={handleGetCurrentLocation}
                      disabled={gettingLocation}
                      className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-primary-600 transition-colors"
                      title="Use current location"
                    >
                      {gettingLocation ? (
                        <svg className="h-4 w-4 animate-spin" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                      ) : (
                        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                        </svg>
                      )}
                    </button>
                  </div>

                  {/* Location suggestions */}
                  {showLocationSuggestions && locationSuggestions.length > 0 && (
                    <div className="absolute z-20 w-full mt-1 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-md shadow-lg max-h-60 overflow-auto">
                      {locationSuggestions.map((location, index) => (
                        <button
                          key={index}
                          type="button"
                          onClick={() => selectLocationSuggestion(location)}
                          className="w-full px-4 py-2 text-left hover:bg-gray-50 dark:hover:bg-gray-700 border-b border-gray-100 dark:border-gray-600 last:border-b-0 transition-colors"
                        >
                          <div className="text-sm font-medium text-gray-900 dark:text-white">
                            {location.display}
                          </div>
                          {location.address?.county && (
                            <div className="text-xs text-gray-500 dark:text-gray-400">
                              {location.address.county}
                            </div>
                          )}
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                {/* Distance */}
                <div className="md:col-span-2">
                  <label htmlFor="distance" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Within
                  </label>
                  <select
                    id="distance"
                    value={searchQuery.distance}
                    onChange={(e) => handleSearchChange('distance', parseInt(e.target.value))}
                    className="input-field"
                  >
                    <option value={5}>5 miles</option>
                    <option value={10}>10 miles</option>
                    <option value={15}>15 miles</option>
                    <option value={25}>25 miles</option>
                    <option value={50}>50 miles</option>
                    <option value={100}>100 miles</option>
                  </select>
                </div>

                {/* Search button */}
                <div className="md:col-span-1 flex items-end">
                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full btn-primary flex items-center justify-center min-h-[42px]"
                  >
                    {loading ? (
                      <svg className="h-4 w-4 animate-spin" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                    ) : (
                      <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                      </svg>
                    )}
                    <span className="ml-2">Search</span>
                  </button>
                </div>
              </div>

              {/* Advanced Filters Toggle */}
              <div className="flex items-center justify-between">
                <button
                  type="button"
                  onClick={() => setShowFilters(!showFilters)}
                  className="inline-flex items-center text-sm text-primary-600 hover:text-primary-700 dark:text-primary-400 dark:hover:text-primary-300 transition-colors"
                >
                  <svg className={`mr-1 h-4 w-4 transition-transform duration-200 ${showFilters ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                  {showFilters ? 'Hide' : 'Show'} Filters
                </button>

                {(searchQuery.keywords || searchQuery.location || hasResults) && (
                  <button
                    type="button"
                    onClick={handleClearSearch}
                    className="text-sm text-gray-600 hover:text-gray-800 dark:text-gray-400 dark:hover:text-gray-200 transition-colors"
                  >
                    Clear Search
                  </button>
                )}
              </div>

              {/* Advanced Filters */}
              {showFilters && (
                <div className="p-4 bg-gray-50 dark:bg-gray-800 rounded-lg space-y-4 border border-gray-200 dark:border-gray-700">
                  {/* Job Types */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Job Types
                    </label>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                      {[
                        { key: 'permanent', label: 'Permanent' },
                        { key: 'contract', label: 'Contract' },
                        { key: 'temp', label: 'Temporary' },
                        { key: 'partTime', label: 'Part-time' }
                      ].map(type => (
                        <label key={type.key} className="inline-flex items-center">
                          <input
                            type="checkbox"
                            checked={searchQuery[type.key]}
                            onChange={(e) => handleSearchChange(type.key, e.target.checked)}
                            className="rounded border-gray-300 text-primary-600 focus:ring-primary-500 dark:bg-gray-700 dark:border-gray-600"
                          />
                          <span className="ml-2 text-sm text-gray-700 dark:text-gray-300">
                            {type.label}
                          </span>
                        </label>
                      ))}
                    </div>
                  </div>

                  {/* Salary Range */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label htmlFor="minimumSalary" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Minimum Salary (£)
                      </label>
                      <input
                        type="number"
                        id="minimumSalary"
                        value={searchQuery.minimumSalary || ''}
                        onChange={(e) => handleSearchChange('minimumSalary', parseInt(e.target.value) || 0)}
                        placeholder="e.g. 30000"
                        className="input-field"
                        min="0"
                        step="1000"
                      />
                    </div>
                    <div>
                      <label htmlFor="maximumSalary" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Maximum Salary (£)
                      </label>
                      <input
                        type="number"
                        id="maximumSalary"
                        value={searchQuery.maximumSalary || ''}
                        onChange={(e) => handleSearchChange('maximumSalary', parseInt(e.target.value) || 0)}
                        placeholder="e.g. 80000"
                        className="input-field"
                        min="0"
                        step="1000"
                      />
                    </div>
                  </div>

                  {/* Posted Date */}
                  <div>
                    <label htmlFor="postedDays" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Posted Within
                    </label>
                    <select
                      id="postedDays"
                      value={searchQuery.postedDays}
                      onChange={(e) => handleSearchChange('postedDays', parseInt(e.target.value))}
                      className="input-field max-w-xs"
                    >
                      <option value={1}>Last 24 hours</option>
                      <option value={3}>Last 3 days</option>
                      <option value={7}>Last week</option>
                      <option value={14}>Last 2 weeks</option>
                      <option value={30}>Last month</option>
                    </select>
                  </div>
                </div>
              )}
            </form>
          </div>
        </div>

        {/* Results Section */}
        <div className="px-4 sm:px-6 lg:px-8 py-6">
          {/* Results Header */}
          {(hasResults || loading || error) && (
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center space-x-4">
                <h2 className="text-lg font-medium text-gray-900 dark:text-white">
                  {loading ? 'Searching...' : getSearchSummary()}
                </h2>
                {hasResults && (
                  <span className="text-sm text-gray-500 dark:text-gray-400">
                    via {jobs[0]?.source || 'multiple sources'}
                  </span>
                )}
              </div>

              {hasResults && (
                <div className="flex items-center space-x-2">
                  <span className="text-sm text-gray-600 dark:text-gray-400">View:</span>
                  <button
                    onClick={() => setViewMode('list')}
                    className={`p-2 rounded-md transition-colors ${
                      viewMode === 'list' 
                        ? 'bg-primary-100 text-primary-600 dark:bg-primary-900 dark:text-primary-300' 
                        : 'text-gray-400 hover:text-gray-600 dark:hover:text-gray-300'
                    }`}
                    title="List view"
                  >
                    <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 10h16M4 14h16M4 18h16" />
                    </svg>
                  </button>
                  <button
                    onClick={() => setViewMode('grid')}
                    className={`p-2 rounded-md transition-colors ${
                      viewMode === 'grid' 
                        ? 'bg-primary-100 text-primary-600 dark:bg-primary-900 dark:text-primary-300' 
                        : 'text-gray-400 hover:text-gray-600 dark:hover:text-gray-300'
                    }`}
                    title="Grid view"
                  >
                    <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
                    </svg>
                  </button>
                </div>
              )}
            </div>
          )}

          {/* Error State */}
          {error && (
            <div className="text-center py-12">
              <div className="max-w-md mx-auto">
                <svg className="mx-auto h-12 w-12 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <h3 className="mt-4 text-lg font-medium text-gray-900 dark:text-white">
                  Search Failed
                </h3>
                <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
                  {error}
                </p>
                <div className="mt-6 flex justify-center space-x-3">
                  <button
                    onClick={handleSearch}
                    className="btn-primary"
                  >
                    Try Again
                  </button>
                  <button
                    onClick={handleClearSearch}
                    className="btn-secondary"
                  >
                    Clear Search
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Empty State */}
          {isEmpty && !error && (
            <div className="text-center py-12">
              <div className="max-w-md mx-auto">
                <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
                <h3 className="mt-4 text-lg font-medium text-gray-900 dark:text-white">
                  No jobs found
                </h3>
                <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
                  Try adjusting your search criteria or expanding your location radius.
                </p>
                <div className="mt-6 flex justify-center space-x-3">
                  <button
                    onClick={handleClearSearch}
                    className="btn-secondary"
                  >
                    Clear Search
                  </button>
                  <button
                    onClick={() => setShowFilters(true)}
                    className="btn-primary"
                  >
                    Adjust Filters
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Jobs List/Grid */}
          {hasResults && (
            <>
              <div className={
                viewMode === 'grid' 
                  ? 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6'
                  : 'space-y-6'
              }>
                {jobs.map((job) => (
                  <JobFinderJobCard
                    key={job.id}
                    job={job}
                    onJobSelect={handleJobSelect}
                    compact={viewMode === 'grid'}
                    showDistance={!!userLocation}
                    userLocation={userLocation}
                  />
                ))}
              </div>

              {/* Load More Button */}
              {canLoadMore && (
                <div className="text-center mt-8">
                  <button
                    onClick={handleLoadMore}
                    disabled={loading}
                    className="btn-primary inline-flex items-center"
                  >
                    {loading ? (
                      <>
                        <svg className="mr-2 h-4 w-4 animate-spin" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        Loading...
                      </>
                    ) : (
                      <>
                        <svg className="mr-2 h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                        </svg>
                        Load More Jobs ({pagination.totalResults - jobs.length} remaining)
                      </>
                    )}
                  </button>
                </div>
              )}

              {/* Pagination Info */}
              {pagination.totalPages > 1 && (
                <div className="text-center mt-4 text-sm text-gray-600 dark:text-gray-400">
                  Page {pagination.currentPage} of {pagination.totalPages} • {pagination.totalResults} total jobs
                </div>
              )}
            </>
          )}

          {/* Initial State - Welcome Screen */}
          {!hasResults && !loading && !error && !isEmpty && (
            <div className="text-center py-12">
              <div className="max-w-2xl mx-auto">
                <svg className="mx-auto h-16 w-16 text-primary-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2-2v2m8 0V6a2 2 0 012 2v6a2 2 0 01-2 2H8a2 2 0 01-2-2V8a2 2 0 012-2V6" />
                </svg>
                <h3 className="mt-4 text-xl font-medium text-gray-900 dark:text-white">
                  Find Your Next Opportunity
                </h3>
                <p className="mt-2 text-gray-600 dark:text-gray-400">
                  Search thousands of jobs from top UK employers. Enter keywords and location to get started.
                </p>
                
                {/* Quick search suggestions */}
                <div className="mt-8">
                  <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-4">
                    Popular searches:
                  </p>
                  <div className="flex flex-wrap justify-center gap-3">
                    {quickSearchSuggestions.map((suggestion, index) => (
                      <button
                        key={index}
                        onClick={() => applyQuickSearch(suggestion)}
                        className="px-4 py-2 text-sm bg-primary-100 text-primary-700 rounded-full hover:bg-primary-200 dark:bg-primary-900 dark:text-primary-300 dark:hover:bg-primary-800 transition-colors duration-200 border border-primary-200 dark:border-primary-800"
                      >
                        {suggestion.keywords} in {suggestion.location}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Features highlight */}
                <div className="mt-12 grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="text-center">
                    <div className="mx-auto h-12 w-12 bg-primary-100 dark:bg-primary-900 rounded-lg flex items-center justify-center">
                      <svg className="h-6 w-6 text-primary-600 dark:text-primary-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                      </svg>
                    </div>
                    <h4 className="mt-3 text-sm font-medium text-gray-900 dark:text-white">Smart Search</h4>
                    <p className="mt-1 text-xs text-gray-600 dark:text-gray-400">
                      Find jobs from multiple UK job boards in one search
                    </p>
                  </div>

                  <div className="text-center">
                    <div className="mx-auto h-12 w-12 bg-primary-100 dark:bg-primary-900 rounded-lg flex items-center justify-center">
                      <svg className="h-6 w-6 text-primary-600 dark:text-primary-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                      </svg>
                    </div>
                    <h4 className="mt-3 text-sm font-medium text-gray-900 dark:text-white">Save for Later</h4>
                    <p className="mt-1 text-xs text-gray-600 dark:text-gray-400">
                      Save interesting jobs to review and apply later
                    </p>
                  </div>

                  <div className="text-center">
                    <div className="mx-auto h-12 w-12 bg-primary-100 dark:bg-primary-900 rounded-lg flex items-center justify-center">
                      <svg className="h-6 w-6 text-primary-600 dark:text-primary-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                      </svg>
                    </div>
                    <h4 className="mt-3 text-sm font-medium text-gray-900 dark:text-white">
                      Track Applications
                      {user?.subscriptionTier === 'free' && (
                        <span className="ml-1 px-1.5 py-0.5 text-xs bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200 rounded">
                          Plus
                        </span>
                      )}
                    </h4>
                    <p className="mt-1 text-xs text-gray-600 dark:text-gray-400">
                      Import saved jobs directly to your application tracker
                    </p>
                  </div>
                </div>

                {/* Pro tip */}
                <div className="mt-8 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
                  <div className="flex items-start">
                    <svg className="h-5 w-5 text-blue-400 mt-0.5 mr-3 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <div className="text-left">
                      <h5 className="text-sm font-medium text-blue-900 dark:text-blue-300">Pro Tip</h5>
                      <p className="mt-1 text-sm text-blue-700 dark:text-blue-400">
                        Use specific job titles and locations for better results. Try "Software Engineer" instead of just "developer".
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Job Detail Modal */}
      {selectedJob && (
        <div className="fixed inset-0 z-50 overflow-y-auto" aria-labelledby="modal-title" role="dialog" aria-modal="true">
          <div className="flex items-end justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
            {/* Background overlay */}
            <div 
              className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity"
              aria-hidden="true"
              onClick={handleCloseModal}
            />
            
            {/* Modal panel */}
            <span className="hidden sm:inline-block sm:align-middle sm:h-screen" aria-hidden="true">&#8203;</span>
            
            <div className="inline-block align-bottom bg-white dark:bg-gray-800 rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-4xl sm:w-full">
              {/* Modal header */}
              <div className="bg-white dark:bg-gray-800 px-4 pt-5 pb-4 sm:p-6 border-b border-gray-200 dark:border-gray-700">
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="text-lg font-medium text-gray-900 dark:text-white" id="modal-title">
                      Job Details
                    </h3>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      {selectedJob.company} • {selectedJob.location?.display}
                    </p>
                  </div>
                  <button
                    onClick={handleCloseModal}
                    className="rounded-md text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 focus:outline-none focus:ring-2 focus:ring-primary-500"
                    aria-label="Close modal"
                  >
                    <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
              </div>
              
              {/* Modal content */}
              <div className="bg-white dark:bg-gray-800 px-4 pb-4 sm:p-6">
                <JobFinderJobCard
                  job={selectedJob}
                  onJobSelect={() => {}} // Prevent nested modals
                  compact={false}
                  showDistance={!!userLocation}
                  userLocation={userLocation}
                />
                
                {/* Additional actions in modal */}
                <div className="mt-6 flex justify-end space-x-3 pt-4 border-t border-gray-200 dark:border-gray-700">
                  <button
                    onClick={handleCloseModal}
                    className="btn-secondary"
                  >
                    Close
                  </button>
                  <a
                    href={selectedJob.applicationUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="btn-primary inline-flex items-center"
                  >
                    Apply Now
                    <svg className="ml-2 h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                    </svg>
                  </a>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Loading overlay for search */}
      {loading && hasResults && (
        <div className="fixed bottom-4 right-4 z-40">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 px-4 py-3 flex items-center space-x-3">
            <svg className="h-5 w-5 animate-spin text-primary-600" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            <span className="text-sm text-gray-700 dark:text-gray-300">Loading more jobs...</span>
          </div>
        </div>
      )}
    </div>
  );
}

export default withAuth(JobFinderPage);