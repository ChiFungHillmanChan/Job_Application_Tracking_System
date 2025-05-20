'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import resumeService from '@/lib/resumeService';
import Link from 'next/link';

export default function ResumeViewer() {
  const { id } = useParams();
  const router = useRouter();
  const [resume, setResume] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isMockData, setIsMockData] = useState(false);

  useEffect(() => {
    const fetchResume = async () => {
      try {
        setLoading(true);
        // Check if we're using mock data
        if (id.startsWith('mock-resume-')) {
          setIsMockData(true);
          // Find resume in localStorage
          try {
            const storedResumes = localStorage.getItem('job_tracker_mock_resumes');
            if (storedResumes) {
              const mockResumes = JSON.parse(storedResumes);
              const foundResume = mockResumes.find(r => r._id === id);
              if (foundResume) {
                setResume(foundResume);
                return;
              }
            }
          } catch (e) {
            console.error('Error accessing localStorage:', e);
          }
          setError('Resume not found in mock data');
          return;
        }

        // Real API call for non-mock data
        const response = await resumeService.getResume(id);
        if (response && response.success) {
          setResume(response.data);
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

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  if (error || !resume) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen px-4">
        <div className="bg-red-100 p-4 rounded-md text-red-700 mb-4 max-w-md w-full">
          <h2 className="text-lg font-semibold">Error</h2>
          <p>{error || 'Resume not found'}</p>
        </div>
        <button 
          onClick={handleBack}
          className="text-primary-600 hover:underline"
        >
          Back to Resumes
        </button>
      </div>
    );
  }

  // Get file extension (if available)
  const fileExtension = resume.file ? 
    resume.file.substring(resume.file.lastIndexOf('.')).toLowerCase() : 
    '.pdf';
  
  // Determine what to display
  if (isMockData) {
    // For mock data, display sample content
    return (
      <div className="flex flex-col min-h-screen bg-gray-50 dark:bg-gray-900">
        <header className="bg-white dark:bg-gray-800 shadow-sm py-4">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row justify-between items-start sm:items-center space-y-2 sm:space-y-0">
            <div>
              <h1 className="text-xl font-semibold text-gray-900 dark:text-white">
                {resume.name} <span className="text-sm text-amber-600">(Mock Data)</span>
              </h1>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Version: {resume.version || '1.0'} • Size: {resume.fileSize || 'Unknown size'}
              </p>
            </div>
            <div className="flex space-x-4">
              <button
                onClick={handleBack}
                className="inline-flex items-center px-3 py-1.5 border border-gray-300 dark:border-gray-600 rounded-md text-sm font-medium text-gray-700 dark:text-gray-200 bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                </svg>
                Back
              </button>
            </div>
          </div>
        </header>
        
        <main className="flex-grow flex flex-col items-center justify-center p-4">
          <div className="w-full max-w-7xl bg-white dark:bg-gray-800 rounded-lg shadow-md p-8">
            <div className="flex flex-col items-center justify-center py-12">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-24 w-24 text-amber-500 mb-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">Mock Resume Preview</h2>
              <p className="text-gray-600 dark:text-gray-400 text-center max-w-md mb-6">
                You're viewing a mock resume that exists only in your browser's local storage. 
                In a real application, this would display the actual PDF or document.
              </p>
              <div className="bg-amber-50 dark:bg-amber-900 p-4 rounded-md border border-amber-200 dark:border-amber-800 max-w-md">
                <h3 className="font-medium text-amber-800 dark:text-amber-200">Sample Resume Contents</h3>
                <p className="mt-2 text-amber-700 dark:text-amber-300 text-sm">
                  Filename: {resume.file}<br />
                  Type: {fileExtension.toUpperCase().substring(1)} File<br />
                  Created: {new Date(resume.createdAt).toLocaleString()}<br />
                  Updated: {new Date(resume.updatedAt).toLocaleString()}<br />
                  Default: {resume.isDefault ? 'Yes' : 'No'}
                </p>
              </div>
              
              <p className="mt-8 text-sm text-gray-500 dark:text-gray-400">
                To view real resumes, you need to connect to a backend server and upload actual files.
              </p>
            </div>
          </div>
        </main>
      </div>
    );
  }

  // For real data with a backend
  // Create URL for the resume preview
  const previewUrl = resumeService.getPreviewUrl(resume._id);
  
  // For PDF files, embed directly
  const isPdf = fileExtension === '.pdf';
  
  return (
    <div className="flex flex-col min-h-screen bg-gray-50 dark:bg-gray-900">
      <header className="bg-white dark:bg-gray-800 shadow-sm py-4">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row justify-between items-start sm:items-center space-y-2 sm:space-y-0">
          <div>
            <h1 className="text-xl font-semibold text-gray-900 dark:text-white">
              {resume.name}
            </h1>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Version: {resume.version || '1.0'} • Size: {resume.fileSize || 'Unknown size'}
            </p>
          </div>
          <div className="flex space-x-4">
            <button
              onClick={handleBack}
              className="inline-flex items-center px-3 py-1.5 border border-gray-300 dark:border-gray-600 rounded-md text-sm font-medium text-gray-700 dark:text-gray-200 bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
              </svg>
              Back
            </button>
            <a 
              href={resumeService.getDownloadUrl(resume._id)}
              download
              className="inline-flex items-center px-3 py-1.5 border border-transparent rounded-md text-sm font-medium text-white bg-primary-600 hover:bg-primary-700 dark:bg-primary-700 dark:hover:bg-primary-600"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
              </svg>
              Download
            </a>
          </div>
        </div>
      </header>
      
      <main className="flex-grow flex flex-col items-center justify-center p-4">
        <div className="w-full max-w-7xl h-[calc(100vh-150px)] bg-white dark:bg-gray-800 rounded-lg shadow-md">
          {isPdf ? (
            // For PDF files, use the native PDF viewer
            <object
              data={previewUrl}
              type="application/pdf"
              className="w-full h-full rounded-lg"
            >
              <div className="flex flex-col items-center justify-center h-full">
                <p className="text-gray-700 dark:text-gray-300 mb-4">
                  Unable to display PDF. You can try to 
                  <a 
                    href={previewUrl} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="text-primary-600 hover:underline mx-1"
                  >
                    open it directly
                  </a> 
                  or download it.
                </p>
                <a 
                  href={resumeService.getDownloadUrl(resume._id)}
                  download
                  className="inline-flex items-center px-3 py-1.5 border border-transparent rounded-md text-sm font-medium text-white bg-primary-600 hover:bg-primary-700"
                >
                  Download
                </a>
              </div>
            </object>
          ) : (
            // For non-PDF files (Word documents), display a message and download button
            <div className="flex flex-col items-center justify-center h-full">
              <div className="p-12 text-center">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-16 w-16 mx-auto text-gray-400 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                <h2 className="text-xl font-medium text-gray-900 dark:text-white mb-2">
                  {fileExtension.toUpperCase().substring(1)} Document
                </h2>
                <p className="text-gray-500 dark:text-gray-400 mb-6">
                  This document type cannot be previewed directly in the browser.
                  Please download it to view.
                </p>
                <a 
                  href={resumeService.getDownloadUrl(resume._id)}
                  download
                  className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                  </svg>
                  Download Document
                </a>
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}