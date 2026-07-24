'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import withAuth from '@/lib/withAuth';
import autoApplyService from '@/lib/services/autoApplyService';
import jobFinderService from '@/lib/jobFinderService';

// Quota resets are UTC instants; render them in the viewer's own timezone so
// "back at 01:00" means something locally.
function fmtTime(iso) {
  if (!iso) return 'later';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return 'later';
  const sameDay = d.toDateString() === new Date().toDateString();
  return d.toLocaleString(undefined, {
    hour: '2-digit',
    minute: '2-digit',
    ...(sameDay ? {} : { month: 'short', day: 'numeric' }),
  });
}

function AutoApplyDashboard() {
  const [stats, setStats] = useState(null);
  const [config, setConfig] = useState(null);
  const [loading, setLoading] = useState(true);
  const [running, setRunning] = useState(false);
  const [error, setError] = useState(null);
  const [successMessage, setSuccessMessage] = useState('');
  const [showConfigEditor, setShowConfigEditor] = useState(false);
  // Board catalog comes from the server so this list never drifts from the
  // adapter registry (it used to be a hardcoded ['reed', 'adzuna']).
  const [boardCatalog, setBoardCatalog] = useState([]);
  const [exhaustedBoards, setExhaustedBoards] = useState([]);
  const [configForm, setConfigForm] = useState({
    keywords: '',
    locationName: '',
    locationRadius: 25,
    jobTypes: ['permanent', 'full-time'],
    workTypes: ['onsite', 'remote', 'hybrid'],
    salaryMin: 0,
    salaryMax: 0,
    boards: ['reed'],
    searchFrequency: 'daily',
    maxResultsPerRun: 50,
    matchScoreThreshold: 60,
    isActive: false
  });

  useEffect(() => {
    loadDashboard();
  }, []);

  const loadDashboard = async () => {
    setLoading(true);
    try {
      // A missing/failing board catalog must not blank the whole dashboard, so
      // it is fetched tolerantly alongside the two required calls.
      const [statsRes, configRes, boardsRes] = await Promise.all([
        autoApplyService.getStats(),
        autoApplyService.getSearchConfig(),
        jobFinderService.getBoards().catch(() => null)
      ]);
      setStats(statsRes.data);
      setBoardCatalog(boardsRes?.data?.boards || []);
      setExhaustedBoards(boardsRes?.data?.exhausted || []);

      const cfg = configRes.data;
      setConfig(cfg);
      setConfigForm({
        keywords: cfg.keywords?.join(', ') || '',
        locationName: cfg.locations?.[0]?.name || '',
        locationRadius: cfg.locations?.[0]?.radius || 25,
        jobTypes: cfg.jobTypes || ['permanent', 'full-time'],
        workTypes: cfg.workTypes || ['onsite', 'remote', 'hybrid'],
        salaryMin: cfg.salaryMin || 0,
        salaryMax: cfg.salaryMax || 0,
        boards: cfg.boards || ['reed'],
        searchFrequency: cfg.searchFrequency || 'daily',
        maxResultsPerRun: cfg.maxResultsPerRun || 50,
        matchScoreThreshold: cfg.matchScoreThreshold || 60,
        isActive: cfg.isActive || false
      });
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to load dashboard');
    } finally {
      setLoading(false);
    }
  };

  const handleSaveConfig = async () => {
    setError(null);
    try {
      const keywords = configForm.keywords.split(',').map(k => k.trim()).filter(Boolean);
      const locations = configForm.locationName.trim()
        ? [{ name: configForm.locationName.trim(), radius: configForm.locationRadius }]
        : [];

      await autoApplyService.updateSearchConfig({
        keywords,
        locations,
        jobTypes: configForm.jobTypes,
        workTypes: configForm.workTypes,
        salaryMin: configForm.salaryMin,
        salaryMax: configForm.salaryMax,
        boards: configForm.boards,
        searchFrequency: configForm.searchFrequency,
        maxResultsPerRun: configForm.maxResultsPerRun,
        matchScoreThreshold: configForm.matchScoreThreshold,
        isActive: configForm.isActive
      });

      setSuccessMessage('Search preferences saved!');
      setShowConfigEditor(false);
      loadDashboard();
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to save config');
    }
  };

  const handleTriggerRun = async () => {
    setRunning(true);
    setError(null);
    try {
      await autoApplyService.triggerSearchRun();
      setSuccessMessage('Search run started! Check the queue for results in a few minutes.');
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to start search run');
    } finally {
      setRunning(false);
    }
  };

  const toggleJobType = (type) => {
    setConfigForm(prev => ({
      ...prev,
      jobTypes: prev.jobTypes.includes(type)
        ? prev.jobTypes.filter(t => t !== type)
        : [...prev.jobTypes, type]
    }));
  };

  const toggleWorkType = (type) => {
    setConfigForm(prev => ({
      ...prev,
      workTypes: prev.workTypes.includes(type)
        ? prev.workTypes.filter(t => t !== type)
        : [...prev.workTypes, type]
    }));
  };

  const toggleBoard = (board) => {
    setConfigForm(prev => ({
      ...prev,
      boards: prev.boards.includes(board)
        ? prev.boards.filter(b => b !== board)
        : [...prev.boards, board]
    }));
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Auto-Apply</h1>
            <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
              AI-powered job search automation and application preparation
            </p>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={handleTriggerRun}
              disabled={running || !stats?.hasProfile}
              className="btn-primary flex items-center"
            >
              {running ? (
                <>
                  <svg className="mr-2 h-4 w-4 animate-spin" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
                  Running...
                </>
              ) : (
                <>Run Search Now</>
              )}
            </button>
          </div>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
            <p className="text-sm text-red-700 dark:text-red-300">{error}</p>
          </div>
        )}
        {successMessage && (
          <div className="mb-6 p-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg">
            <p className="text-sm text-green-700 dark:text-green-300">{successMessage}</p>
          </div>
        )}

        {/* Setup Checklist */}
        {(!stats?.hasProfile || !stats?.hasConfig) && (
          <div className="mb-8 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-6">
            <h2 className="text-lg font-semibold text-blue-900 dark:text-blue-200 mb-4">Getting Started</h2>
            <div className="space-y-3">
              <div className="flex items-center gap-3">
                <div className={`h-6 w-6 rounded-full flex items-center justify-center ${stats?.hasProfile ? 'bg-green-500' : 'bg-gray-300 dark:bg-gray-600'}`}>
                  {stats?.hasProfile ? (
                    <svg className="h-4 w-4 text-white" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                  ) : <span className="text-xs text-white font-bold">1</span>}
                </div>
                <div className="flex-1">
                  <Link href="/dashboard/profile" className="font-medium text-blue-900 dark:text-blue-200 hover:underline">
                    Analyze your CV to create a profile
                  </Link>
                  <p className="text-sm text-blue-700 dark:text-blue-400">AI will extract your skills and experience</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className={`h-6 w-6 rounded-full flex items-center justify-center ${stats?.hasConfig && config?.keywords?.length ? 'bg-green-500' : 'bg-gray-300 dark:bg-gray-600'}`}>
                  {stats?.hasConfig && config?.keywords?.length ? (
                    <svg className="h-4 w-4 text-white" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                  ) : <span className="text-xs text-white font-bold">2</span>}
                </div>
                <div className="flex-1">
                  <button onClick={() => setShowConfigEditor(true)} className="font-medium text-blue-900 dark:text-blue-200 hover:underline text-left">
                    Set up your search preferences
                  </button>
                  <p className="text-sm text-blue-700 dark:text-blue-400">Keywords, location, job type, and salary range</p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Stats Grid */}
        {stats && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
            <Link href="/dashboard/auto-apply/queue?status=pending_review" className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-4 hover:border-primary-300 dark:hover:border-primary-600 transition-colors">
              <p className="text-sm text-gray-600 dark:text-gray-400">Pending Review</p>
              <p className="text-2xl font-bold text-yellow-600 dark:text-yellow-400">{stats.overview.pendingReview}</p>
            </Link>
            <Link href="/dashboard/auto-apply/queue?status=approved" className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-4 hover:border-primary-300 dark:hover:border-primary-600 transition-colors">
              <p className="text-sm text-gray-600 dark:text-gray-400">Approved</p>
              <p className="text-2xl font-bold text-green-600 dark:text-green-400">{stats.overview.approved}</p>
            </Link>
            <Link href="/dashboard/auto-apply/queue?status=submitted" className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-4 hover:border-primary-300 dark:hover:border-primary-600 transition-colors">
              <p className="text-sm text-gray-600 dark:text-gray-400">Submitted</p>
              <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">{stats.overview.submitted}</p>
            </Link>
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-4">
              <p className="text-sm text-gray-600 dark:text-gray-400">Avg Match Score</p>
              <p className="text-2xl font-bold text-primary-600 dark:text-primary-400">{stats.overview.avgMatchScore}%</p>
            </div>
          </div>
        )}

        {/* Quick Links */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <Link href="/dashboard/profile" className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6 hover:border-primary-300 dark:hover:border-primary-600 transition-colors">
            <svg className="h-8 w-8 text-primary-600 dark:text-primary-400 mb-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
            </svg>
            <h3 className="font-semibold text-gray-900 dark:text-white">AI Profile</h3>
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">View and edit your AI-analyzed profile</p>
          </Link>

          <Link href="/dashboard/auto-apply/queue" className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6 hover:border-primary-300 dark:hover:border-primary-600 transition-colors">
            <svg className="h-8 w-8 text-primary-600 dark:text-primary-400 mb-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
            </svg>
            <h3 className="font-semibold text-gray-900 dark:text-white">Application Queue</h3>
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">Review and approve AI-prepared applications</p>
          </Link>

          <Link href="/dashboard/auto-apply/history" className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6 hover:border-primary-300 dark:hover:border-primary-600 transition-colors">
            <svg className="h-8 w-8 text-primary-600 dark:text-primary-400 mb-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <h3 className="font-semibold text-gray-900 dark:text-white">Run History</h3>
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">View daily automation runs and analytics</p>
          </Link>
        </div>

        {/* Search Config Editor */}
        {showConfigEditor && (
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6 mb-8">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-6">Search Preferences</h2>
            <div className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Keywords (comma-separated)
                </label>
                <input
                  type="text"
                  value={configForm.keywords}
                  onChange={(e) => setConfigForm({ ...configForm, keywords: e.target.value })}
                  placeholder="e.g. Software Developer, React, Full Stack"
                  className="input-field w-full"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Location</label>
                  <input
                    type="text"
                    value={configForm.locationName}
                    onChange={(e) => setConfigForm({ ...configForm, locationName: e.target.value })}
                    placeholder="e.g. London"
                    className="input-field w-full"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Radius (miles)</label>
                  <select
                    value={configForm.locationRadius}
                    onChange={(e) => setConfigForm({ ...configForm, locationRadius: parseInt(e.target.value) })}
                    className="input-field w-full"
                  >
                    <option value={5}>5 miles</option>
                    <option value={10}>10 miles</option>
                    <option value={25}>25 miles</option>
                    <option value={50}>50 miles</option>
                    <option value={100}>100 miles</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Job Types</label>
                <div className="flex flex-wrap gap-2">
                  {['permanent', 'contract', 'temporary', 'part-time', 'full-time'].map(type => (
                    <button
                      key={type}
                      onClick={() => toggleJobType(type)}
                      className={`px-3 py-1.5 rounded-full text-sm font-medium border transition-colors ${
                        configForm.jobTypes.includes(type)
                          ? 'bg-primary-100 text-primary-700 border-primary-300 dark:bg-primary-900 dark:text-primary-300 dark:border-primary-700'
                          : 'bg-gray-100 text-gray-600 border-gray-300 dark:bg-gray-700 dark:text-gray-400 dark:border-gray-600'
                      }`}
                    >
                      {type}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Work Types</label>
                <div className="flex flex-wrap gap-2">
                  {['onsite', 'remote', 'hybrid'].map(type => (
                    <button
                      key={type}
                      onClick={() => toggleWorkType(type)}
                      className={`px-3 py-1.5 rounded-full text-sm font-medium border transition-colors ${
                        configForm.workTypes.includes(type)
                          ? 'bg-primary-100 text-primary-700 border-primary-300 dark:bg-primary-900 dark:text-primary-300 dark:border-primary-700'
                          : 'bg-gray-100 text-gray-600 border-gray-300 dark:bg-gray-700 dark:text-gray-400 dark:border-gray-600'
                      }`}
                    >
                      {type}
                    </button>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Min Salary (£/year)</label>
                  <input
                    type="number"
                    value={configForm.salaryMin || ''}
                    onChange={(e) => setConfigForm({ ...configForm, salaryMin: parseInt(e.target.value) || 0 })}
                    placeholder="e.g. 30000"
                    className="input-field w-full"
                    min="0"
                    step="1000"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Max Salary (£/year)</label>
                  <input
                    type="number"
                    value={configForm.salaryMax || ''}
                    onChange={(e) => setConfigForm({ ...configForm, salaryMax: parseInt(e.target.value) || 0 })}
                    placeholder="e.g. 80000"
                    className="input-field w-full"
                    min="0"
                    step="1000"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Job Boards</label>
                <div className="flex flex-wrap gap-2">
                  {boardCatalog.map(board => {
                    const selected = configForm.boards.includes(board.name);
                    // Two distinct reasons a board can be off-limits, and the
                    // user can act on only one of them.
                    // Tightest remaining window drives the badge: a board with
                    // 900 left this month but 0 left today is out of requests.
                    const tightest = (board.quota?.windows || [])
                      .slice()
                      .sort((a, b) => a.remaining - b.remaining)[0];

                    const reason = board.paidDisabled
                      ? `${board.label} bills per request — disabled (set ENABLE_PAID_JOB_BOARDS=true to allow)`
                      : !board.configured
                        ? 'Not configured on this deployment'
                        : board.quota?.exhausted
                          ? `Out of requests until ${fmtTime(board.quota.availableAt)}`
                          : !board.available
                            ? `Requires the ${board.tier} plan`
                            : [
                                board.coverage,
                                ...(board.quota?.windows || []).map(
                                  (w) => `${w.remaining}/${w.limit} requests left this ${w.window}`
                                ),
                              ]
                                .filter(Boolean)
                                .join(' — ');

                    return (
                      <button
                        key={board.name}
                        onClick={() => board.available && toggleBoard(board.name)}
                        disabled={!board.available}
                        title={reason}
                        className={`px-3 py-1.5 rounded-full text-sm font-medium border transition-colors ${
                          !board.available
                            ? 'bg-gray-50 text-gray-400 border-gray-200 cursor-not-allowed dark:bg-gray-800 dark:text-gray-600 dark:border-gray-700'
                            : selected
                              ? 'bg-primary-100 text-primary-700 border-primary-300 dark:bg-primary-900 dark:text-primary-300 dark:border-primary-700'
                              : 'bg-gray-100 text-gray-600 border-gray-300 dark:bg-gray-700 dark:text-gray-400 dark:border-gray-600'
                        }`}
                      >
                        {board.label}
                        {board.paid ? (
                          <span className="ml-1.5 text-xs uppercase opacity-70">paid</span>
                        ) : board.tier !== 'free' && (
                          <span className="ml-1.5 text-xs uppercase opacity-70">{board.tier}</span>
                        )}
                        {tightest && !board.quota?.exhausted && (
                          <span className="ml-1.5 text-xs tabular-nums opacity-60">
                            {tightest.remaining}/{tightest.limit}
                          </span>
                        )}
                        {board.quota?.exhausted && (
                          <span className="ml-1.5 text-xs opacity-70">0 left</span>
                        )}
                      </button>
                    );
                  })}
                </div>
                <p className="mt-2 text-xs text-gray-500 dark:text-gray-400">
                  {boardCatalog.every(b => !b.paid || b.paidDisabled)
                    ? 'Every enabled board is free — nothing here bills per search.'
                    : 'Boards marked “paid” bill per search against your API quota.'}
                  {' '}Counts show requests left in the tightest window; searches stop
                  automatically before a board’s free tier runs out.
                </p>
                {exhaustedBoards.length > 0 && (
                  <p className="mt-1 text-xs text-amber-600 dark:text-amber-400">
                    Out of requests: {exhaustedBoards.map(b => `${b.label} (back ${fmtTime(b.availableAt)})`).join(', ')}
                  </p>
                )}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Search Frequency</label>
                  <select
                    value={configForm.searchFrequency}
                    onChange={(e) => setConfigForm({ ...configForm, searchFrequency: e.target.value })}
                    className="input-field w-full"
                  >
                    <option value="daily">Daily</option>
                    <option value="twice-daily">Twice Daily</option>
                    <option value="weekly">Weekly</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Min Match Score</label>
                  <input
                    type="number"
                    value={configForm.matchScoreThreshold}
                    onChange={(e) => setConfigForm({ ...configForm, matchScoreThreshold: parseInt(e.target.value) || 60 })}
                    className="input-field w-full"
                    min="0"
                    max="100"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Max Results/Run</label>
                  <input
                    type="number"
                    value={configForm.maxResultsPerRun}
                    onChange={(e) => setConfigForm({ ...configForm, maxResultsPerRun: parseInt(e.target.value) || 50 })}
                    className="input-field w-full"
                    min="10"
                    max="200"
                  />
                </div>
              </div>

              <div className="flex items-center gap-3">
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={configForm.isActive}
                    onChange={(e) => setConfigForm({ ...configForm, isActive: e.target.checked })}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary-300 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-primary-600"></div>
                </label>
                <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  Enable automated daily searches
                </span>
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-gray-200 dark:border-gray-700">
                <button onClick={() => setShowConfigEditor(false)} className="btn-secondary">Cancel</button>
                <button onClick={handleSaveConfig} className="btn-primary">Save Preferences</button>
              </div>
            </div>
          </div>
        )}

        {/* Config Summary (when not editing) */}
        {!showConfigEditor && config && config.keywords?.length > 0 && (
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6 mb-8">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Search Configuration</h2>
              <button onClick={() => setShowConfigEditor(true)} className="text-sm text-primary-600 hover:text-primary-700 dark:text-primary-400">
                Edit
              </button>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
              <div>
                <p className="text-gray-500 dark:text-gray-400">Keywords</p>
                <p className="font-medium text-gray-900 dark:text-white">{config.keywords.join(', ')}</p>
              </div>
              <div>
                <p className="text-gray-500 dark:text-gray-400">Location</p>
                <p className="font-medium text-gray-900 dark:text-white">{config.locations?.[0]?.name || 'Any'}</p>
              </div>
              <div>
                <p className="text-gray-500 dark:text-gray-400">Frequency</p>
                <p className="font-medium text-gray-900 dark:text-white capitalize">{config.searchFrequency}</p>
              </div>
              <div>
                <p className="text-gray-500 dark:text-gray-400">Status</p>
                <p className={`font-medium ${config.isActive ? 'text-green-600 dark:text-green-400' : 'text-gray-500'}`}>
                  {config.isActive ? 'Active' : 'Paused'}
                </p>
              </div>
            </div>
            {config.lastRunAt && (
              <p className="mt-4 text-xs text-gray-500 dark:text-gray-400">
                Last run: {new Date(config.lastRunAt).toLocaleString()}
              </p>
            )}
          </div>
        )}

        {/* Recent Runs */}
        {stats?.recentRuns?.length > 0 && (
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Recent Runs</h2>
              <Link href="/dashboard/auto-apply/history" className="text-sm text-primary-600 hover:text-primary-700 dark:text-primary-400">
                View All
              </Link>
            </div>
            <div className="space-y-3">
              {stats.recentRuns.map(run => (
                <div key={run._id} className="flex items-center justify-between py-3 border-b border-gray-100 dark:border-gray-700 last:border-b-0">
                  <div>
                    <p className="text-sm font-medium text-gray-900 dark:text-white">
                      {new Date(run.runDate).toLocaleDateString()} at {new Date(run.runDate).toLocaleTimeString()}
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      {run.jobsFound} found, {run.jobsMatched} matched, {run.applicationsPrepared} prepared
                    </p>
                  </div>
                  <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium ${
                    run.status === 'completed' ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200' :
                    run.status === 'partial' ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200' :
                    run.status === 'running' ? 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200' :
                    'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
                  }`}>
                    {run.status}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default withAuth(AutoApplyDashboard);
