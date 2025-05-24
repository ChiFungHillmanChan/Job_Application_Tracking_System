// src/app/resume/[id]/page.jsx - Customized to match your job tracker style
'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import resumeService from '@/lib/resumeService';
import api from '@/lib/api';
import Link from 'next/link';
import useAuth from '@/lib/hooks/useAuth';

export default function ResumeViewer() {
  const { id } = useParams();
  const router = useRouter();
  const { user } = useAuth();
  const [resume, setResume] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [previewError, setPreviewError] = useState(false);
  const [isMockData, setIsMockData] = useState(false);
  const [previewUrl, setPreviewUrl] = useState(null);

  useEffect(() => {
    const fetchResume = async () => {
      try {
        setLoading(true);
        setError(null);
        
        // Check if we're using mock data
        if (id.startsWith('mock-resume-')) {
          setIsMockData(true);
          try {
            const storedResumes = localStorage.getItem('job_tracker_mock_resumes');
            if (storedResumes) {
              const mockResumes = JSON.parse(storedResumes);
              
              const token = localStorage.getItem('token');
              let userId = null;
              
              if (token && token.startsWith('mock-token-')) {
                userId = token.split('-')[2];
              }
              
              if (userId) {
                const foundResume = mockResumes.find(r => r._id === id && r.user === userId);
                if (foundResume) {
                  setResume(foundResume);
                  return;
                }
              }
            }
          } catch (e) {
            console.error('Error accessing localStorage:', e);
          }
          setError('Resume not found or you do not have permission to view it');
          return;
        }

        // Real API call for non-mock data
        const response = await resumeService.getResume(id);
        if (response && response.success) {
          setResume(response.data);
          
          // Try to create preview URL for real backend
          try {
            const backendUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5001/api';
            const token = localStorage.getItem('token');
            
            if (token && !token.startsWith('mock-token-')) {
              // For real backend, try to check if file is accessible
              const testResponse = await fetch(`${backendUrl}/resumes/${id}/preview?token=${encodeURIComponent(token)}`, {
                method: 'HEAD',
                headers: {
                  'Authorization': `Bearer ${token}`,
                },
              });
              
              if (testResponse.ok) {
                setPreviewUrl(`${backendUrl}/resumes/${id}/preview?token=${encodeURIComponent(token)}`);
              } else {
                console.warn('Preview test failed:', testResponse.status, testResponse.statusText);
                setPreviewError(true);
              }
            } else {
              setPreviewError(true);
            }
          } catch (err) {
            console.warn('Error checking preview access:', err);
            setPreviewError(true);
          }
        } else {
          setError('Failed to load resume');
        }
      } catch (err) {
        console.error('Error loading resume:', err);
        setError('Error loading resume. Please try again later.');
      } finally {
        setLoading(false);
      }
    };

    if (id) {
      fetchResume();
    }
  }, [id]);

  const handleBack = () => {
    router.push('/settings/resumes');
  };

  const handleDownload = async () => {
    try {
      if (isMockData) {
        // Handle mock download
        const mockContent = `Mock Resume: ${resume.name}\n\nThis is a sample resume file created for development purposes.\n\nFile: ${resume.file}\nVersion: ${resume.version}\nCreated: ${resume.createdAt}\nUpdated: ${resume.updatedAt}`;
        
        const blob = new Blob([mockContent], { type: 'text/plain' });
        const downloadUrl = URL.createObjectURL(blob);
        
        const link = document.createElement('a');
        link.href = downloadUrl;
        link.download = resume.originalFilename || `${resume.name}.txt`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(downloadUrl);
      } else {
        // For real backend, make authenticated request
        const backendUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5001/api';
        const token = localStorage.getItem('token');
        
        const response = await fetch(`${backendUrl}/resumes/${id}/download?token=${encodeURIComponent(token)}`, {
          headers: {
            'Authorization': `Bearer ${token}`,
          },
        });
        
        if (response.ok) {
          const blob = await response.blob();
          const downloadUrl = URL.createObjectURL(blob);
          
          // Get filename from Content-Disposition header
          const contentDisposition = response.headers.get('content-disposition');
          let filename = `${resume.name}.pdf`;
          if (contentDisposition) {
            const filenameMatch = contentDisposition.match(/filename="(.+)"/);
            if (filenameMatch) {
              filename = filenameMatch[1];
            }
          }
          
          const link = document.createElement('a');
          link.href = downloadUrl;
          link.download = filename;
          document.body.appendChild(link);
          link.click();
          document.body.removeChild(link);
          URL.revokeObjectURL(downloadUrl);
        } else {
          throw new Error('Download failed');
        }
      }
    } catch (err) {
      console.error('Download error:', err);
      setError('Failed to download resume. Please try again.');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-4 border-gray-300 border-t-primary-600 mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-400">Loading resume...</p>
        </div>
      </div>
    );
  }

  if (error || !resume) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center px-4">
        <div className="max-w-md w-full">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 p-6">
            <div className="flex items-center mb-4">
              <div className="flex-shrink-0">
                <svg className="h-10 w-10 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
                </svg>
              </div>
              <div className="ml-3">
                <h3 className="text-lg font-medium text-gray-900 dark:text-white">Unable to Load Resume</h3>
                <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">{error || 'Resume not found'}</p>
              </div>
            </div>
            <div className="flex justify-end">
              <button 
                onClick={handleBack}
                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 transition-colors"
              >
                <svg className="h-4 w-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                </svg>
                Back to Resumes
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Get file extension
  const fileExtension = resume.file ? 
    resume.file.substring(resume.file.lastIndexOf('.')).toLowerCase() : 
    '.pdf';
  
  // Handle mock data display
  if (isMockData) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
        {/* Header */}
        <div className="bg-white dark:bg-gray-800 shadow-sm border-b border-gray-200 dark:border-gray-700">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-3 sm:space-y-0">
              <div>
                <div className="flex items-center">
                  <h1 className="text-xl font-semibold text-gray-900 dark:text-white">
                    {resume.name}
                  </h1>
                  <span className="ml-3 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200">
                    Development Mode
                  </span>
                </div>
                <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                  Version {resume.version || '1.0'} • {resume.fileSize || 'Unknown size'} • {fileExtension.toUpperCase().substring(1)} file
                </p>
              </div>
              <div className="flex space-x-3">
                <button
                  onClick={handleBack}
                  className="inline-flex items-center px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md text-sm font-medium text-gray-700 dark:text-gray-200 bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 transition-colors"
                >
                  <svg className="h-4 w-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                  </svg>
                  Back
                </button>
                <button
                  onClick={handleDownload}
                  className="inline-flex items-center px-4 py-2 border border-transparent rounded-md text-sm font-medium text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 transition-colors"
                >
                  <svg className="h-4 w-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                  </svg>
                  Download
                </button>
              </div>
            </div>
          </div>
        </div>
        
        {/* Content */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
            <div className="px-6 py-12 text-center">
              <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-orange-100 dark:bg-orange-900 mb-6">
                <svg className="h-8 w-8 text-orange-600 dark:text-orange-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
              
              <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-3">
                Development Preview
              </h3>
              <p className="text-gray-600 dark:text-gray-400 max-w-md mx-auto mb-8">
                You're viewing a mock resume that exists only in your browser's local storage. 
                In a production environment, this would display the actual document.
              </p>
              
              <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-6 max-w-lg mx-auto mb-8">
                <h4 className="text-sm font-medium text-gray-900 dark:text-white mb-3">Resume Information</h4>
                <dl className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <dt className="text-gray-500 dark:text-gray-400">Filename:</dt>
                    <dd className="text-gray-900 dark:text-white font-mono">{resume.file}</dd>
                  </div>
                  <div className="flex justify-between">
                    <dt className="text-gray-500 dark:text-gray-400">File Type:</dt>
                    <dd className="text-gray-900 dark:text-white">{fileExtension.toUpperCase().substring(1)} Document</dd>
                  </div>
                  <div className="flex justify-between">
                    <dt className="text-gray-500 dark:text-gray-400">Created:</dt>
                    <dd className="text-gray-900 dark:text-white">{new Date(resume.createdAt).toLocaleDateString()}</dd>
                  </div>
                  <div className="flex justify-between">
                    <dt className="text-gray-500 dark:text-gray-400">Updated:</dt>
                    <dd className="text-gray-900 dark:text-white">{new Date(resume.updatedAt).toLocaleDateString()}</dd>
                  </div>
                  <div className="flex justify-between">
                    <dt className="text-gray-500 dark:text-gray-400">Default Resume:</dt>
                    <dd className="text-gray-900 dark:text-white">{resume.isDefault ? 'Yes' : 'No'}</dd>
                  </div>
                  <div className="flex justify-between">
                    <dt className="text-gray-500 dark:text-gray-400">Owner:</dt>
                    <dd className="text-gray-900 dark:text-white">{user?.name || 'Current User'}</dd>
                  </div>
                </dl>
              </div>
              
              <div className="bg-blue-50 dark:bg-blue-900 rounded-lg p-4 max-w-md mx-auto">
                <p className="text-sm text-blue-800 dark:text-blue-200">
                  <strong>Note:</strong> To view real resumes, connect to a backend server and upload actual files.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // For real data with a backend
  const isPdf = fileExtension === '.pdf';
  
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Header */}
      <div className="bg-white dark:bg-gray-800 shadow-sm border-b border-gray-200 dark:border-gray-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-3 sm:space-y-0">
            <div>
              <div className="flex items-center">
                <h1 className="text-xl font-semibold text-gray-900 dark:text-white">
                  {resume.name}
                </h1>
                {resume.isDefault && (
                  <span className="ml-3 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">
                    Default
                  </span>
                )}
              </div>
              <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                Version {resume.version || '1.0'} • {resume.fileSize || 'Unknown size'} • {fileExtension.toUpperCase().substring(1)} file
              </p>
            </div>
            <div className="flex space-x-3">
              <button
                onClick={handleBack}
                className="inline-flex items-center px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md text-sm font-medium text-gray-700 dark:text-gray-200 bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 transition-colors"
              >
                <svg className="h-4 w-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                </svg>
                Back
              </button>
              <button
                onClick={handleDownload}
                className="inline-flex items-center px-4 py-2 border border-transparent rounded-md text-sm font-medium text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 transition-colors"
              >
                <svg className="h-4 w-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                </svg>
                Download
              </button>
            </div>
          </div>
        </div>
      </div>
      
      {/* Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden" style={{ height: 'calc(100vh - 200px)' }}>
          {previewError || !previewUrl ? (
            <div className="flex items-center justify-center h-full">
              <div className="text-center p-12">
                <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-gray-100 dark:bg-gray-700 mb-6">
                  <svg className="h-8 w-8 text-gray-500 dark:text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                  </svg>
                </div>
                <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-3">
                  Preview Not Available
                </h3>
                <p className="text-gray-600 dark:text-gray-400 mb-6 max-w-sm mx-auto">
                  Unable to preview this resume. The file may not exist or the backend server may not be running.
                </p>
                <button 
                  onClick={handleDownload}
                  className="inline-flex items-center px-4 py-2 border border-transparent rounded-md text-sm font-medium text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 transition-colors"
                >
                  <svg className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                  </svg>
                  Download Instead
                </button>
              </div>
            </div>
          ) : isPdf ? (
            // For PDF files, use iframe with authentication token
            <iframe
              src={previewUrl}
              className="w-full h-full"
              title={`Preview of ${resume.name}`}
              onError={() => setPreviewError(true)}
              onLoad={(e) => {
                // Check if iframe loaded successfully
                try {
                  const iframe = e.target;
                  if (iframe.contentDocument === null) {
                    console.warn('Iframe content blocked - may be CORS issue');
                  }
                } catch (err) {
                  console.warn('Iframe access error:', err);
                }
              }}
            >
              <div className="flex items-center justify-center h-full">
                <div className="text-center">
                  <p className="text-gray-600 dark:text-gray-400 mb-4">
                    Unable to display PDF. Your browser doesn't support PDF viewing.
                  </p>
                  <button 
                    onClick={handleDownload}
                    className="inline-flex items-center px-4 py-2 border border-transparent rounded-md text-sm font-medium text-white bg-primary-600 hover:bg-primary-700 transition-colors"
                  >
                    Download Instead
                  </button>
                </div>
              </div>
            </iframe>
          ) : (
            // For non-PDF files (Word documents), display a message and download button
            <div className="flex items-center justify-center h-full">
              <div className="text-center p-12">
                <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-gray-100 dark:bg-gray-700 mb-6">
                  <svg className="h-8 w-8 text-gray-500 dark:text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                </div>
                <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-3">
                  {fileExtension.toUpperCase().substring(1)} Document
                </h3>
                <p className="text-gray-600 dark:text-gray-400 mb-6 max-w-sm mx-auto">
                  This document type cannot be previewed directly in the browser. Please download it to view the content.
                </p>
                <button 
                  onClick={handleDownload}
                  className="inline-flex items-center px-4 py-2 border border-transparent rounded-md text-sm font-medium text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 transition-colors"
                >
                  <svg className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                  </svg>
                  Download Document
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}