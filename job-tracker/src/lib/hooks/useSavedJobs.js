'use client';

import { useState, useCallback, useEffect, useRef } from 'react';
import { useAuth } from './useAuth';
import jobFinderService from '../jobFinderService';

export const useSavedJobs = () => {
  const { user } = useAuth();
  const [savedJobs, setSavedJobs] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [pagination, setPagination] = useState({
    currentPage: 1,
    totalPages: 0,
    totalCount: 0,
    limit: 20,
    hasNextPage: false,
    hasPreviousPage: false
  });
  const [usage, setUsage] = useState({
    used: 0,
    limit: null,
    tier: 'free',
    canSaveMore: true
  });
  const [stats, setStats] = useState(null);

  // Use ref to track if initial load is done
  const initialLoadDone = useRef(false);
  const currentUserId = useRef(null);

  // Load saved jobs
  const loadSavedJobs = useCallback(async (params = {}) => {
    if (!user) return;

    setLoading(true);
    setError(null);

    try {
      console.log('📋 Loading saved jobs...');
      
      const response = await jobFinderService.getSavedJobs(params);
      
      if (response && response.success) {
        setSavedJobs(response.data.jobs || []);
        setPagination(response.data.pagination || {});
        setUsage(response.data.usage || {});
        
        console.log(`✅ Loaded ${response.data.jobs?.length || 0} saved jobs`);
      } else {
        throw new Error('Failed to load saved jobs');
      }
    } catch (err) {
      console.error('❌ Failed to load saved jobs:', err);
      setError(err.message || 'Failed to load saved jobs');
      setSavedJobs([]);
    } finally {
      setLoading(false);
    }
  }, [user]);

  // Save a job
  const saveJob = useCallback(async (jobData) => {
    if (!user) {
      throw new Error('Please log in to save jobs');
    }

    // Check if we can save more jobs
    if (!usage.canSaveMore) {
      const message = usage.limit 
        ? `You've reached your limit of ${usage.limit} saved jobs. Upgrade to save more.`
        : 'You cannot save more jobs at this time.';
      throw new Error(message);
    }

    setLoading(true);
    setError(null);

    try {
      console.log('💾 Saving job:', jobData.title);
      
      const response = await jobFinderService.saveJob(jobData);
      
      if (response && response.success) {
        // Add to local state
        setSavedJobs(prev => [response.data, ...prev]);
        
        // Update usage
        setUsage(prev => ({
          ...prev,
          used: prev.used + 1,
          canSaveMore: prev.limit ? (prev.used + 1) < prev.limit : true
        }));
        
        console.log('✅ Job saved successfully');
        return response.data;
      } else {
        throw new Error('Failed to save job');
      }
    } catch (err) {
      console.error('❌ Failed to save job:', err);
      setError(err.message || 'Failed to save job');
      throw err;
    } finally {
      setLoading(false);
    }
  }, [user, usage]);

  // Remove a saved job
  const unsaveJob = useCallback(async (jobId) => {
    if (!user) {
      throw new Error('Please log in to manage saved jobs');
    }

    setLoading(true);
    setError(null);

    try {
      console.log('🗑️ Removing saved job:', jobId);
      
      await jobFinderService.removeSavedJob(jobId);
      
      // Remove from local state
      setSavedJobs(prev => prev.filter(job => job._id !== jobId));
      
      // Update usage
      setUsage(prev => ({
        ...prev,
        used: Math.max(0, prev.used - 1),
        canSaveMore: true
      }));
      
      console.log('✅ Job removed successfully');
    } catch (err) {
      console.error('❌ Failed to remove saved job:', err);
      setError(err.message || 'Failed to remove saved job');
      throw err;
    } finally {
      setLoading(false);
    }
  }, [user]);

  // Import job to tracker
  const importJob = useCallback(async (savedJobId) => {
    if (!user) {
      throw new Error('Please log in to import jobs');
    }

    // Check subscription tier
    if (user.subscriptionTier === 'free') {
      throw new Error('Job import is a Plus feature. Upgrade to import jobs to your tracker.');
    }

    setLoading(true);
    setError(null);

    try {
      console.log('📥 Importing job to tracker:', savedJobId);
      
      const response = await jobFinderService.importJobToTracker(savedJobId);
      
      if (response && response.success) {
        // Update local state to mark as imported
        setSavedJobs(prev => 
          prev.map(job => 
            job._id === savedJobId 
              ? { ...job, importedToTracker: true, importedJobId: response.data.job._id }
              : job
          )
        );
        
        console.log('✅ Job imported successfully');
        return response.data;
      } else {
        throw new Error('Failed to import job');
      }
    } catch (err) {
      console.error('❌ Failed to import job:', err);
      setError(err.message || 'Failed to import job');
      throw err;
    } finally {
      setLoading(false);
    }
  }, [user]);

  // Check if a job is saved
  const isJobSaved = useCallback((externalId, source = 'reed') => {
    return savedJobs.some(job => 
      job.externalId === externalId && job.source === source
    );
  }, [savedJobs]);

  // Get saved job by external ID
  const getSavedJob = useCallback((externalId, source = 'reed') => {
    return savedJobs.find(job => 
      job.externalId === externalId && job.source === source
    ) || null;
  }, [savedJobs]);

  // Load next page
  const loadNextPage = useCallback(async () => {
    if (!pagination.hasNextPage || loading) return;

    await loadSavedJobs({
      page: pagination.currentPage + 1,
      limit: pagination.limit
    });
  }, [pagination, loading, loadSavedJobs]);

  // Load statistics (separate function to avoid dependency issues)
  const loadStats = useCallback(async () => {
    if (!user) return;

    try {
      console.log('📊 Loading job finder stats...');
      const response = await jobFinderService.getStats();
      
      if (response && response.success) {
        setStats(response.data);
        console.log('✅ Stats loaded successfully:', response.data);
      }
    } catch (err) {
      console.warn('⚠️ Failed to load stats (this is non-critical):', err.message);
      
      // Set fallback stats to prevent UI errors
      setStats({
        overview: {
          totalSaved: usage.used || 0,
          importedCount: 0,
          recentSaved: 0,
          importRate: 0
        },
        breakdown: {
          bySource: {},
          byJobType: {}
        },
        salary: null,
        usage: {
          used: usage.used || 0,
          limit: usage.limit,
          tier: usage.tier || 'free',
          canSaveMore: usage.canSaveMore !== false,
          percentage: usage.limit ? Math.round(((usage.used || 0) / usage.limit) * 100) : 0
        },
        lastUpdated: new Date().toISOString()
      });
    }
  }, [user, usage.used, usage.limit, usage.tier, usage.canSaveMore]);

  // Filter saved jobs
  const filterSavedJobs = useCallback((filters = {}) => {
    if (!filters || Object.keys(filters).length === 0) {
      return savedJobs;
    }

    return savedJobs.filter(job => {
      // Source filter
      if (filters.source && job.source !== filters.source) {
        return false;
      }

      // Job type filter
      if (filters.jobType && job.jobType !== filters.jobType) {
        return false;
      }

      // Company filter
      if (filters.company && !job.company.toLowerCase().includes(filters.company.toLowerCase())) {
        return false;
      }

      // Location filter
      if (filters.location && !job.location?.display?.toLowerCase().includes(filters.location.toLowerCase())) {
        return false;
      }

      // Imported status filter
      if (typeof filters.imported === 'boolean' && job.importedToTracker !== filters.imported) {
        return false;
      }

      // Tags filter
      if (filters.tags && filters.tags.length > 0) {
        const hasTag = filters.tags.some(tag => 
          job.tags?.some(jobTag => 
            jobTag.toLowerCase().includes(tag.toLowerCase())
          )
        );
        if (!hasTag) return false;
      }

      // Date range filter
      if (filters.dateFrom && new Date(job.savedAt) < new Date(filters.dateFrom)) {
        return false;
      }

      if (filters.dateTo && new Date(job.savedAt) > new Date(filters.dateTo)) {
        return false;
      }

      return true;
    });
  }, [savedJobs]);

  // Get filter options from current saved jobs
  const getFilterOptions = useCallback(() => {
    if (savedJobs.length === 0) {
      return {
        sources: [],
        companies: [],
        jobTypes: [],
        locations: [],
        tags: []
      };
    }

    const sources = [...new Set(savedJobs.map(job => job.source))].sort();
    const companies = [...new Set(savedJobs.map(job => job.company))].sort();
    const jobTypes = [...new Set(savedJobs.map(job => job.jobType))].sort();
    const locations = [...new Set(savedJobs.map(job => job.location?.display).filter(Boolean))].sort();
    const tags = [...new Set(savedJobs.flatMap(job => job.tags || []))].sort();

    return {
      sources,
      companies: companies.slice(0, 20),
      jobTypes,
      locations: locations.slice(0, 20),
      tags: tags.slice(0, 30)
    };
  }, [savedJobs]);

  // Get usage percentage
  const getUsagePercentage = useCallback(() => {
    if (!usage.limit) return 0;
    return Math.round((usage.used / usage.limit) * 100);
  }, [usage]);

  // Check if user can save more jobs
  const canSaveMore = useCallback(() => {
    return usage.canSaveMore;
  }, [usage]);

  // Get upgrade message if needed
  const getUpgradeMessage = useCallback(() => {
    if (usage.tier === 'free' && usage.used >= (usage.limit || 5)) {
      return 'Upgrade to Plus for unlimited saved jobs';
    }
    return null;
  }, [usage]);

  // 🔧 FIX: Initialize data only when user changes, not when functions change
  useEffect(() => {
    const userId = user?.id;
    
    // Reset state when user changes or logs out
    if (!user) {
      setSavedJobs([]);
      setUsage({ used: 0, limit: null, tier: 'free', canSaveMore: true });
      setStats(null);
      initialLoadDone.current = false;
      currentUserId.current = null;
      return;
    }

    // Only load if user changed or initial load not done
    if (userId !== currentUserId.current || !initialLoadDone.current) {
      console.log('🚀 Initializing saved jobs for user:', userId);
      
      currentUserId.current = userId;
      initialLoadDone.current = true;
      
      // Load data
      const initializeData = async () => {
        try {
          // Load saved jobs first
          await loadSavedJobs();
          // Then load stats
          await loadStats();
        } catch (error) {
          console.error('Failed to initialize saved jobs data:', error);
        }
      };
      
      initializeData();
    }
  }, [user?.id]); // 🔧 Only depend on user.id, not the functions

  return {
    // Data
    savedJobs,
    loading,
    error,
    pagination,
    usage,
    stats,

    // Actions
    saveJob,
    unsaveJob,
    importJob,
    loadSavedJobs,
    loadNextPage,
    loadStats,

    // Utilities
    isJobSaved,
    getSavedJob,
    filterSavedJobs,
    getFilterOptions,
    getUsagePercentage,
    canSaveMore,
    getUpgradeMessage,

    // State checks
    hasSavedJobs: savedJobs.length > 0,
    isEmpty: !loading && savedJobs.length === 0,
    isNearLimit: usage.limit && usage.used >= usage.limit - 1,
    isAtLimit: usage.limit && usage.used >= usage.limit,
    canImport: user?.subscriptionTier !== 'free'
  };
};

export default useSavedJobs;