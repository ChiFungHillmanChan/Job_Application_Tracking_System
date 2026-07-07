'use client';

import { useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import withAuth from '@/lib/withAuth';
import autoApplyService from '@/lib/services/autoApplyService';

function ApplicationQueuePage() {
  const searchParams = useSearchParams();
  const [applications, setApplications] = useState([]);
  const [pagination, setPagination] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [successMessage, setSuccessMessage] = useState('');
  const [statusFilter, setStatusFilter] = useState(searchParams.get('status') || 'pending_review');
  const [expandedId, setExpandedId] = useState(null);
  const [editingCoverLetter, setEditingCoverLetter] = useState(null);
  const [editedCoverLetter, setEditedCoverLetter] = useState('');

  useEffect(() => {
    loadQueue();
  }, [statusFilter]);

  const loadQueue = async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await autoApplyService.getApplicationQueue({
        status: statusFilter,
        sortBy: 'matchScore',
        sortOrder: 'desc'
      });
      setApplications(result.data.applications);
      setPagination(result.data.pagination);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to load application queue');
    } finally {
      setLoading(false);
    }
  };

  const handleReview = async (id, action, coverLetter) => {
    try {
      await autoApplyService.reviewApplication(id, action, { coverLetter });
      setSuccessMessage(`Application ${action === 'approve' ? 'approved' : 'rejected'}`);
      setApplications(prev => prev.filter(a => a._id !== id));
      setEditingCoverLetter(null);
    } catch (err) {
      setError(err.response?.data?.error || `Failed to ${action} application`);
    }
  };

  const handleBulkApprove = async () => {
    try {
      const ids = applications.map(a => a._id);
      const result = await autoApplyService.bulkApproveApplications(ids);
      setSuccessMessage(`${result.data.modifiedCount} applications approved`);
      loadQueue();
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to bulk approve');
    }
  };

  const getMatchScoreColor = (score) => {
    if (score >= 80) return 'text-green-600 dark:text-green-400 bg-green-100 dark:bg-green-900';
    if (score >= 60) return 'text-yellow-600 dark:text-yellow-400 bg-yellow-100 dark:bg-yellow-900';
    return 'text-red-600 dark:text-red-400 bg-red-100 dark:bg-red-900';
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <Link href="/dashboard/auto-apply" className="text-sm text-primary-600 dark:text-primary-400 hover:underline">Auto-Apply</Link>
              <span className="text-gray-400">/</span>
              <span className="text-sm text-gray-600 dark:text-gray-400">Queue</span>
            </div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Application Queue</h1>
          </div>

          {statusFilter === 'pending_review' && applications.length > 0 && (
            <button onClick={handleBulkApprove} className="btn-primary">
              Approve All ({applications.length})
            </button>
          )}
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

        {/* Status Filter */}
        <div className="flex gap-2 mb-6">
          {['pending_review', 'approved', 'rejected', 'submitted', 'all'].map(status => (
            <button
              key={status}
              onClick={() => setStatusFilter(status)}
              className={`px-3 py-1.5 rounded-full text-sm font-medium border transition-colors ${
                statusFilter === status
                  ? 'bg-primary-100 text-primary-700 border-primary-300 dark:bg-primary-900 dark:text-primary-300 dark:border-primary-700'
                  : 'bg-white text-gray-600 border-gray-300 dark:bg-gray-800 dark:text-gray-400 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700'
              }`}
            >
              {status === 'pending_review' ? 'Pending' : status === 'all' ? 'All' : status.charAt(0).toUpperCase() + status.slice(1)}
            </button>
          ))}
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary-600"></div>
          </div>
        ) : applications.length === 0 ? (
          <div className="text-center py-12 bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
            <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
            </svg>
            <h3 className="mt-4 text-lg font-medium text-gray-900 dark:text-white">No applications</h3>
            <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
              {statusFilter === 'pending_review'
                ? 'Run a search to find matching jobs and generate applications.'
                : `No ${statusFilter} applications yet.`}
            </p>
            <Link href="/dashboard/auto-apply" className="mt-4 inline-block btn-primary">
              Go to Dashboard
            </Link>
          </div>
        ) : (
          <div className="space-y-4">
            {applications.map(app => (
              <div key={app._id} className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
                {/* Application Header */}
                <div
                  className="p-4 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors"
                  onClick={() => setExpandedId(expandedId === app._id ? null : app._id)}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold text-gray-900 dark:text-white truncate">
                        {app.savedJob?.title || 'Unknown Position'}
                      </h3>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        {app.savedJob?.company || 'Unknown Company'} &middot; {app.savedJob?.location?.display || 'Unknown Location'}
                      </p>
                    </div>
                    <div className="flex items-center gap-3 ml-4">
                      <span className={`px-2.5 py-1 rounded-full text-sm font-bold ${getMatchScoreColor(app.matchScore)}`}>
                        {app.matchScore}%
                      </span>
                      {app.status === 'pending_review' && (
                        <div className="flex gap-1">
                          <button
                            onClick={(e) => { e.stopPropagation(); handleReview(app._id, 'approve'); }}
                            className="p-1.5 rounded-full text-green-600 hover:bg-green-100 dark:hover:bg-green-900/50 transition-colors"
                            title="Approve"
                          >
                            <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 20 20">
                              <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                            </svg>
                          </button>
                          <button
                            onClick={(e) => { e.stopPropagation(); handleReview(app._id, 'reject'); }}
                            className="p-1.5 rounded-full text-red-600 hover:bg-red-100 dark:hover:bg-red-900/50 transition-colors"
                            title="Reject"
                          >
                            <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 20 20">
                              <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                            </svg>
                          </button>
                        </div>
                      )}
                      <svg className={`h-5 w-5 text-gray-400 transition-transform ${expandedId === app._id ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                      </svg>
                    </div>
                  </div>

                  <div className="mt-2 flex items-center gap-4 text-xs text-gray-500 dark:text-gray-400">
                    {app.savedJob?.salary?.display && <span>{app.savedJob.salary.display}</span>}
                    {app.savedJob?.jobType && <span className="capitalize">{app.savedJob.jobType}</span>}
                    <span>Created {new Date(app.createdAt).toLocaleDateString()}</span>
                  </div>
                </div>

                {/* Expanded Content */}
                {expandedId === app._id && (
                  <div className="px-4 pb-4 border-t border-gray-200 dark:border-gray-700 pt-4">
                    {/* Match Reasoning */}
                    {app.matchReasoning && (
                      <div className="mb-4">
                        <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Match Analysis</h4>
                        <p className="text-sm text-gray-600 dark:text-gray-400">{app.matchReasoning}</p>
                      </div>
                    )}

                    {app.aiNotes && (
                      <div className="mb-4 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                        <h4 className="text-sm font-medium text-blue-900 dark:text-blue-200 mb-1">AI Notes</h4>
                        <p className="text-sm text-blue-700 dark:text-blue-400">{app.aiNotes}</p>
                      </div>
                    )}

                    {/* Cover Letter */}
                    <div className="mb-4">
                      <div className="flex items-center justify-between mb-2">
                        <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300">Cover Letter</h4>
                        {editingCoverLetter !== app._id ? (
                          <button
                            onClick={() => { setEditingCoverLetter(app._id); setEditedCoverLetter(app.coverLetter); }}
                            className="text-xs text-primary-600 hover:text-primary-700 dark:text-primary-400"
                          >
                            Edit
                          </button>
                        ) : (
                          <div className="flex gap-2">
                            <button
                              onClick={() => setEditingCoverLetter(null)}
                              className="text-xs text-gray-600 hover:text-gray-800 dark:text-gray-400"
                            >
                              Cancel
                            </button>
                            <button
                              onClick={() => handleReview(app._id, 'approve', editedCoverLetter)}
                              className="text-xs text-primary-600 hover:text-primary-700 dark:text-primary-400 font-medium"
                            >
                              Save & Approve
                            </button>
                          </div>
                        )}
                      </div>
                      {editingCoverLetter === app._id ? (
                        <textarea
                          value={editedCoverLetter}
                          onChange={(e) => setEditedCoverLetter(e.target.value)}
                          rows={10}
                          className="input-field w-full text-sm"
                        />
                      ) : (
                        <div className="text-sm text-gray-600 dark:text-gray-400 whitespace-pre-wrap bg-gray-50 dark:bg-gray-900 rounded-lg p-4 max-h-64 overflow-y-auto">
                          {app.coverLetter || 'No cover letter generated'}
                        </div>
                      )}
                    </div>

                    {/* Application Answers */}
                    {app.applicationAnswers?.length > 0 && (
                      <div className="mb-4">
                        <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Application Answers</h4>
                        <div className="space-y-3">
                          {app.applicationAnswers.map((qa, i) => (
                            <div key={i} className="bg-gray-50 dark:bg-gray-900 rounded-lg p-3">
                              <p className="text-sm font-medium text-gray-700 dark:text-gray-300">{qa.question}</p>
                              <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">{qa.answer}</p>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Job link */}
                    {app.savedJob?.applicationUrl && (
                      <a
                        href={app.savedJob.applicationUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center text-sm text-primary-600 hover:text-primary-700 dark:text-primary-400"
                      >
                        View Original Job Listing
                        <svg className="ml-1 h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                        </svg>
                      </a>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        {/* Pagination */}
        {pagination && pagination.totalPages > 1 && (
          <div className="mt-6 text-center text-sm text-gray-600 dark:text-gray-400">
            Page {pagination.currentPage} of {pagination.totalPages} ({pagination.totalCount} total)
          </div>
        )}
      </div>
    </div>
  );
}

export default withAuth(ApplicationQueuePage);
