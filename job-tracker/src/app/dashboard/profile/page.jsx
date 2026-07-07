'use client';

import { useState, useEffect } from 'react';
import withAuth from '@/lib/withAuth';
import autoApplyService from '@/lib/services/autoApplyService';
import api from '@/lib/api';

function ProfilePage() {
  const [profile, setProfile] = useState(null);
  const [resumes, setResumes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [analyzing, setAnalyzing] = useState(false);
  const [error, setError] = useState(null);
  const [successMessage, setSuccessMessage] = useState('');
  const [selectedResumeId, setSelectedResumeId] = useState('');
  const [editing, setEditing] = useState(false);
  const [editData, setEditData] = useState({});

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const [profileRes, resumesRes] = await Promise.allSettled([
        autoApplyService.getProfile(),
        api.get('/resumes')
      ]);

      if (profileRes.status === 'fulfilled') {
        setProfile(profileRes.value.data);
      }
      if (resumesRes.status === 'fulfilled') {
        setResumes(resumesRes.value.data?.data || []);
      }
    } catch {
      // Profile may not exist yet
    } finally {
      setLoading(false);
    }
  };

  const handleAnalyzeCV = async () => {
    setAnalyzing(true);
    setError(null);
    setSuccessMessage('');
    try {
      const result = await autoApplyService.analyzeCV(selectedResumeId || undefined);
      setProfile(result.data);
      setSuccessMessage('CV analyzed successfully! Your profile has been updated.');
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to analyze CV');
    } finally {
      setAnalyzing(false);
    }
  };

  const handleSaveEdits = async () => {
    try {
      const result = await autoApplyService.updateProfile(editData);
      setProfile(result.data);
      setEditing(false);
      setSuccessMessage('Profile updated successfully');
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to update profile');
    }
  };

  const startEditing = () => {
    setEditData({
      summary: profile.summary || '',
      skills: { ...profile.skills },
      preferredRoles: [...(profile.preferredRoles || [])],
      seniorityLevel: profile.seniorityLevel || 'mid'
    });
    setEditing(true);
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
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">AI Profile</h1>
          <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
            Your AI-analyzed professional profile powers automated job matching and applications.
          </p>
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

        {/* Analyze CV Section */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6 mb-6">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            {profile ? 'Re-analyze CV' : 'Analyze Your CV'}
          </h2>
          <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
            {profile
              ? 'Upload a new CV or re-analyze an existing one to update your profile.'
              : 'Select a resume to analyze. AI will extract your skills, experience, and qualifications.'}
          </p>

          <div className="flex items-end gap-4">
            <div className="flex-1">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Select Resume
              </label>
              <select
                value={selectedResumeId}
                onChange={(e) => setSelectedResumeId(e.target.value)}
                className="input-field"
              >
                <option value="">Default resume</option>
                {resumes.map(r => (
                  <option key={r._id} value={r._id}>
                    {r.name} {r.isDefault ? '(Default)' : ''}
                  </option>
                ))}
              </select>
            </div>
            <button
              onClick={handleAnalyzeCV}
              disabled={analyzing}
              className="btn-primary flex items-center whitespace-nowrap"
            >
              {analyzing ? (
                <>
                  <svg className="mr-2 h-4 w-4 animate-spin" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
                  Analyzing...
                </>
              ) : (
                <>Analyze CV</>
              )}
            </button>
          </div>
        </div>

        {/* Profile Display */}
        {profile && (
          <div className="space-y-6">
            {/* Summary */}
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Professional Summary</h2>
                {!editing && (
                  <button onClick={startEditing} className="text-sm text-primary-600 hover:text-primary-700 dark:text-primary-400">
                    Edit Profile
                  </button>
                )}
              </div>

              {editing ? (
                <textarea
                  value={editData.summary}
                  onChange={(e) => setEditData({ ...editData, summary: e.target.value })}
                  rows={4}
                  className="input-field w-full"
                />
              ) : (
                <p className="text-gray-700 dark:text-gray-300">{profile.summary}</p>
              )}

              <div className="mt-3 flex items-center gap-4 text-sm text-gray-500 dark:text-gray-400">
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200 capitalize">
                  {profile.seniorityLevel} level
                </span>
                {profile.lastAnalyzedAt && (
                  <span>Last analyzed: {new Date(profile.lastAnalyzedAt).toLocaleDateString()}</span>
                )}
              </div>
            </div>

            {/* Skills */}
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Skills</h2>

              <div className="space-y-4">
                <div>
                  <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Technical Skills</h3>
                  <div className="flex flex-wrap gap-2">
                    {profile.skills?.technical?.map((skill, i) => (
                      <span key={i} className="px-3 py-1 rounded-full text-xs font-medium bg-primary-100 text-primary-700 dark:bg-primary-900 dark:text-primary-300">
                        {skill}
                      </span>
                    ))}
                    {(!profile.skills?.technical?.length) && <span className="text-sm text-gray-400">None detected</span>}
                  </div>
                </div>

                <div>
                  <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Soft Skills</h3>
                  <div className="flex flex-wrap gap-2">
                    {profile.skills?.soft?.map((skill, i) => (
                      <span key={i} className="px-3 py-1 rounded-full text-xs font-medium bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300">
                        {skill}
                      </span>
                    ))}
                    {(!profile.skills?.soft?.length) && <span className="text-sm text-gray-400">None detected</span>}
                  </div>
                </div>

                <div>
                  <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Languages</h3>
                  <div className="flex flex-wrap gap-2">
                    {profile.skills?.languages?.map((lang, i) => (
                      <span key={i} className="px-3 py-1 rounded-full text-xs font-medium bg-purple-100 text-purple-700 dark:bg-purple-900 dark:text-purple-300">
                        {lang}
                      </span>
                    ))}
                    {(!profile.skills?.languages?.length) && <span className="text-sm text-gray-400">None detected</span>}
                  </div>
                </div>
              </div>
            </div>

            {/* Experience */}
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Experience</h2>
              <div className="space-y-4">
                {profile.experience?.map((exp, i) => (
                  <div key={i} className="border-l-4 border-primary-500 pl-4">
                    <h3 className="font-medium text-gray-900 dark:text-white">{exp.title}</h3>
                    <p className="text-sm text-gray-600 dark:text-gray-400">{exp.company} &middot; {exp.duration}</p>
                    {exp.highlights?.length > 0 && (
                      <ul className="mt-2 space-y-1">
                        {exp.highlights.map((h, j) => (
                          <li key={j} className="text-sm text-gray-700 dark:text-gray-300 flex items-start">
                            <span className="mr-2 mt-1.5 h-1.5 w-1.5 rounded-full bg-gray-400 flex-shrink-0" />
                            {h}
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                ))}
                {(!profile.experience?.length) && <p className="text-sm text-gray-400">No experience detected</p>}
              </div>
            </div>

            {/* Education & Certifications */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
                <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Education</h2>
                <div className="space-y-3">
                  {profile.education?.map((edu, i) => (
                    <div key={i}>
                      <h3 className="font-medium text-gray-900 dark:text-white text-sm">{edu.degree}</h3>
                      <p className="text-sm text-gray-600 dark:text-gray-400">{edu.institution} &middot; {edu.year}</p>
                    </div>
                  ))}
                  {(!profile.education?.length) && <p className="text-sm text-gray-400">No education detected</p>}
                </div>
              </div>

              <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
                <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Certifications</h2>
                <div className="space-y-2">
                  {profile.certifications?.map((cert, i) => (
                    <div key={i} className="flex items-center text-sm text-gray-700 dark:text-gray-300">
                      <svg className="h-4 w-4 mr-2 text-green-500" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                      </svg>
                      {cert}
                    </div>
                  ))}
                  {(!profile.certifications?.length) && <p className="text-sm text-gray-400">No certifications detected</p>}
                </div>
              </div>
            </div>

            {/* Preferred Roles */}
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">AI-Suggested Roles</h2>
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">Based on your CV, AI recommends searching for these roles:</p>
              <div className="flex flex-wrap gap-2">
                {profile.preferredRoles?.map((role, i) => (
                  <span key={i} className="px-3 py-1.5 rounded-lg text-sm font-medium bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200 border border-yellow-200 dark:border-yellow-800">
                    {role}
                  </span>
                ))}
              </div>
            </div>

            {/* Edit actions */}
            {editing && (
              <div className="flex justify-end gap-3">
                <button onClick={() => setEditing(false)} className="btn-secondary">Cancel</button>
                <button onClick={handleSaveEdits} className="btn-primary">Save Changes</button>
              </div>
            )}
          </div>
        )}

        {/* Empty state */}
        {!profile && !loading && (
          <div className="text-center py-12 bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
            <svg className="mx-auto h-16 w-16 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
            </svg>
            <h3 className="mt-4 text-lg font-medium text-gray-900 dark:text-white">No Profile Yet</h3>
            <p className="mt-2 text-sm text-gray-600 dark:text-gray-400 max-w-sm mx-auto">
              Analyze your CV to create an AI-powered profile. This profile will be used to match you with relevant jobs and generate tailored applications.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

export default withAuth(ProfilePage);
