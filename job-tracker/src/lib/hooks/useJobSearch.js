'use client';

import { useState, useCallback, useRef, useEffect } from 'react';
import jobFinderService from '../jobFinderService';

export const useJobSearch = () => {
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [pagination, setPagination] = useState({
    currentPage: 1,
    totalPages: 0,
    totalResults: 0,
    limit: 20,
    hasNextPage: false,
    hasPreviousPage: false
  });
  const [searchParams, setSearchParams] = useState({});
  const [source, setSource] = useState('');

  // Keep track of the latest search to avoid race conditions
  const searchIdRef = useRef(0);

  // Search for jobs
  const searchJobs = useCallback(async (params = {}, options = {}) => {
    const { append = false, showLoading = true } = options;
    
    // Generate unique search ID
    const currentSearchId = ++searchIdRef.current;
    
    if (showLoading) {
      setLoading(true);
    }
    setError(null);

    try {
      // Merge with default params
      const searchParameters = {
        page: 1,
        limit: 20,
        ...params
      };

      console.log('🔍 Searching jobs:', searchParameters);

      const response = await jobFinderService.searchJobs(searchParameters);

      // Check if this is still the latest search
      if (currentSearchId !== searchIdRef.current) {
        console.log('🚫 Ignoring outdated search result');
        return;
      }

      if (response && response.success) {
        const newJobs = response.data.jobs || [];
        
        setJobs(prevJobs => {
          if (append && searchParameters.page > 1) {
            // Append to existing jobs for pagination
            const existingIds = new Set(prevJobs.map(job => job.id));
            const uniqueNewJobs = newJobs.filter(job => !existingIds.has(job.id));
            return [...prevJobs, ...uniqueNewJobs];
          } else {
            // Replace jobs for new search
            return newJobs;
          }
        });

        setPagination(response.data.pagination || {});
        setSearchParams(response.data.searchParams || searchParameters);
        setSource(response.data.source || '');

        console.log(`✅ Found ${newJobs.length} jobs (total: ${response.data.pagination?.totalResults || 0})`);
      } else {
        throw new Error('Invalid search response');
      }
    } catch (err) {
      // Only set error if this is still the latest search
      if (currentSearchId === searchIdRef.current) {
        console.error('❌ Job search failed:', err);
        setError(err.message || 'Failed to search jobs');
        
        // Don't clear jobs on error if appending
        if (!append) {
          setJobs([]);
          setPagination({
            currentPage: 1,
            totalPages: 0,
            totalResults: 0,
            limit: 20,
            hasNextPage: false,
            hasPreviousPage: false
          });
        }
      }
    } finally {
      if (currentSearchId === searchIdRef.current && showLoading) {
        setLoading(false);
      }
    }
  }, []);

  // Load next page
  const loadNextPage = useCallback(async () => {
    if (!pagination.hasNextPage || loading) {
      return;
    }

    const nextPageParams = {
      ...searchParams,
      page: pagination.currentPage + 1
    };

    await searchJobs(nextPageParams, { append: true, showLoading: false });
  }, [searchParams, pagination, loading, searchJobs]);

  // Load previous page
  const loadPreviousPage = useCallback(async () => {
    if (!pagination.hasPreviousPage || loading) {
      return;
    }

    const prevPageParams = {
      ...searchParams,
      page: pagination.currentPage - 1
    };

    await searchJobs(prevPageParams, { append: false });
  }, [searchParams, pagination, loading, searchJobs]);

  // Go to specific page
  const goToPage = useCallback(async (page) => {
    if (page < 1 || page > pagination.totalPages || loading) {
      return;
    }

    const pageParams = {
      ...searchParams,
      page
    };

    await searchJobs(pageParams, { append: false });
  }, [searchParams, pagination.totalPages, loading, searchJobs]);

  // Refresh current search
  const refresh = useCallback(async () => {
    if (Object.keys(searchParams).length === 0) {
      return;
    }

    await searchJobs(searchParams, { append: false });
  }, [searchParams, searchJobs]);

  // Clear search results
  const clearResults = useCallback(() => {
    setJobs([]);
    setPagination({
      currentPage: 1,
      totalPages: 0,
      totalResults: 0,
      limit: 20,
      hasNextPage: false,
      hasPreviousPage: false
    });
    setSearchParams({});
    setSource('');
    setError(null);
    setLoading(false);
  }, []);

  // Get search summary
  const getSearchSummary = useCallback(() => {
    if (pagination.totalResults === 0) {
      return 'No jobs found';
    }

    const { currentPage, limit, totalResults } = pagination;
    const start = (currentPage - 1) * limit + 1;
    const end = Math.min(currentPage * limit, totalResults);

    return `Showing ${start}-${end} of ${totalResults.toLocaleString()} jobs`;
  }, [pagination]);

  // Check if a specific job is in current results
  const hasJob = useCallback((jobId) => {
    return jobs.some(job => job.id === jobId);
  }, [jobs]);

  // Find job by ID in current results
  const findJob = useCallback((jobId) => {
    return jobs.find(job => job.id === jobId) || null;
  }, [jobs]);

  // Update a job in the results (useful for saved state changes)
  const updateJob = useCallback((jobId, updates) => {
    setJobs(prevJobs => 
      prevJobs.map(job => 
        job.id === jobId ? { ...job, ...updates } : job
      )
    );
  }, []);

  // Remove a job from the results
  const removeJob = useCallback((jobId) => {
    setJobs(prevJobs => prevJobs.filter(job => job.id !== jobId));
  }, []);

  // Get filtering utilities
  const getFilterOptions = useCallback(() => {
    if (jobs.length === 0) {
      return {
        companies: [],
        locations: [],
        jobTypes: [],
        sources: []
      };
    }

    const companies = [...new Set(jobs.map(job => job.company))].sort();
    const locations = [...new Set(jobs.map(job => job.location?.display).filter(Boolean))].sort();
    const jobTypes = [...new Set(jobs.map(job => job.jobType))].sort();
    const sources = [...new Set(jobs.map(job => job.source))].sort();

    return {
      companies: companies.slice(0, 20), // Limit for performance
      locations: locations.slice(0, 20),
      jobTypes,
      sources
    };
  }, [jobs]);

  // Apply client-side filters to current results
  const filterJobs = useCallback((filters) => {
    if (!filters || Object.keys(filters).length === 0) {
      return jobs;
    }

    return jobs.filter(job => {
      // Company filter
      if (filters.company && !job.company.toLowerCase().includes(filters.company.toLowerCase())) {
        return false;
      }

      // Location filter
      if (filters.location && !job.location?.display?.toLowerCase().includes(filters.location.toLowerCase())) {
        return false;
      }

      // Job type filter
      if (filters.jobType && job.jobType !== filters.jobType) {
        return false;
      }

      // Source filter
      if (filters.source && job.source !== filters.source) {
        return false;
      }

      // Salary filter
      if (filters.minSalary && job.salary?.min && job.salary.min < filters.minSalary) {
        return false;
      }

      if (filters.maxSalary && job.salary?.max && job.salary.max > filters.maxSalary) {
        return false;
      }

      // Keywords filter (search in title and description)
      if (filters.keywords) {
        const keywords = filters.keywords.toLowerCase();
        const searchText = `${job.title} ${job.description}`.toLowerCase();
        if (!searchText.includes(keywords)) {
          return false;
        }
      }

      return true;
    });
  }, [jobs]);

  // Cancel any ongoing search
  const cancelSearch = useCallback(() => {
    searchIdRef.current++;
    setLoading(false);
  }, []);

  // Effect to cancel search on unmount
  useEffect(() => {
    return () => {
      cancelSearch();
    };
  }, [cancelSearch]);

  return {
    // Data
    jobs,
    pagination,
    searchParams,
    source,
    loading,
    error,

    // Actions
    searchJobs,
    loadNextPage,
    loadPreviousPage,
    goToPage,
    refresh,
    clearResults,
    cancelSearch,

    // Job manipulation
    updateJob,
    removeJob,
    hasJob,
    findJob,

    // Utilities
    getSearchSummary,
    getFilterOptions,
    filterJobs,

    // State checks
    hasResults: jobs.length > 0,
    isFirstPage: pagination.currentPage === 1,
    isLastPage: pagination.currentPage === pagination.totalPages,
    canLoadMore: pagination.hasNextPage && !loading,
    isEmpty: !loading && jobs.length === 0 && !error
  };
};

export default useJobSearch;