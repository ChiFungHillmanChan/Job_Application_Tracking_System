
'use client';

import { useState } from 'react';
import withAuth from '@/lib/withAuth';
import Link from 'next/link';

function ResumesSettings() {
  const [resumeSuccess, setResumeSuccess] = useState('');
  const [resumeError, setResumeError] = useState('');
  const [uploadingResume, setUploadingResume] = useState(false);
  
  // Mock resumes data
  const [resumes, setResumes] = useState([
    {
      id: '1',
      name: 'Software Engineer Resume',
      version: '1.2',
      createdAt: '2023-09-15T14:30:00Z',
      updatedAt: '2023-10-20T09:45:00Z',
      isDefault: true,
      fileSize: '425 KB',
      file: '/resumes/software-engineer-resume.pdf'
    },
    {
      id: '2',
      name: 'Technical Resume with Cover Letter',
      version: '1.0',
      createdAt: '2023-08-10T11:15:00Z',
      updatedAt: '2023-08-10T11:15:00Z',
      isDefault: false,
      fileSize: '512 KB',
      file: '/resumes/technical-resume.pdf'
    },
    {
      id: '3',
      name: 'Project Manager Resume',
      version: '2.1',
      createdAt: '2023-07-05T16:20:00Z',
      updatedAt: '2023-11-02T14:10:00Z',
      isDefault: false,
      fileSize: '487 KB',
      file: '/resumes/project-manager-resume.pdf'
    }
  ]);
  
  const [newResumeName, setNewResumeName] = useState('');
  const [fileToUpload, setFileToUpload] = useState(null);
  
  // Format date string
  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };
  
  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setFileToUpload(file);
      // Extract name from file if no name is set
      if (!newResumeName) {
        // Remove file extension
        const fileName = file.name.replace(/\.[^/.]+$/, '');
        setNewResumeName(fileName);
      }
    }
  };
  
  const handleUploadResume = (e) => {
    e.preventDefault();
    setResumeError('');
    
    if (!fileToUpload) {
      setResumeError('Please select a file to upload');
      return;
    }
    
    if (!newResumeName) {
      setResumeError('Please provide a name for your resume');
      return;
    }
    
    // Check file type
    const fileExt = fileToUpload.name.split('.').pop().toLowerCase();
    if (!['pdf', 'doc', 'docx'].includes(fileExt)) {
      setResumeError('Only PDF, DOC, and DOCX files are supported');
      return;
    }
    
    // Check file size (5MB limit)
    if (fileToUpload.size > 5 * 1024 * 1024) {
      setResumeError('File size exceeds 5MB limit');
      return;
    }
    
    setUploadingResume(true);
    
    // In a real app, this would upload to the backend
    // For now, simulate the process
    setTimeout(() => {
      const newResume = {
        id: Date.now().toString(),
        name: newResumeName,
        version: '1.0',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        isDefault: false,
        fileSize: `${Math.round(fileToUpload.size / 1024)} KB`,
        file: URL.createObjectURL(fileToUpload)
      };
      
      setResumes((prevResumes) => [...prevResumes, newResume]);
      setResumeSuccess('Resume uploaded successfully');
      setNewResumeName('');
      setFileToUpload(null);
      
      // Reset the file input
      const fileInput = document.getElementById('resume-file');
      if (fileInput) {
        fileInput.value = '';
      }
      
      setUploadingResume(false);
      
      // Clear success message after 3 seconds
      setTimeout(() => {
        setResumeSuccess('');
      }, 3000);
    }, 1500);
  };
  
  const handleSetDefault = (resumeId) => {
    setResumes(prevResumes => 
      prevResumes.map(resume => ({
        ...resume,
        isDefault: resume.id === resumeId
      }))
    );
    
    setResumeSuccess('Default resume updated');
    setTimeout(() => {
      setResumeSuccess('');
    }, 3000);
  };
  
  const handleDeleteResume = (resumeId) => {
    const resumeToDelete = resumes.find(r => r.id === resumeId);
    
    if (resumeToDelete.isDefault) {
      setResumeError('Cannot delete the default resume. Please set another resume as default first.');
      setTimeout(() => {
        setResumeError('');
      }, 3000);
      return;
    }
    
    setResumes(prevResumes => prevResumes.filter(resume => resume.id !== resumeId));
    
    setResumeSuccess('Resume deleted successfully');
    setTimeout(() => {
      setResumeSuccess('');
    }, 3000);
  };

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-6 flex items-center">
        <Link
          href="/settings"
          className="flex items-center text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white mr-6"
        >
          <svg 
            xmlns="http://www.w3.org/2000/svg" 
            className="h-5 w-5 mr-1" 
            viewBox="0 0 20 20" 
            fill="currentColor"
          >
            <path 
              fillRule="evenodd" 
              d="M9.707 16.707a1 1 0 01-1.414 0l-6-6a1 1 0 010-1.414l6-6a1 1 0 011.414 1.414L5.414 9H17a1 1 0 110 2H5.414l4.293 4.293a1 1 0 010 1.414z" 
              clipRule="evenodd" 
            />
          </svg>
          Back to Settings
        </Link>
      </div>
      
      <header className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Resume Management</h1>
        <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
          Upload, organize, and manage your resume versions
        </p>
      </header>

      {resumeSuccess && (
        <div className="mb-6 p-3 bg-green-100 text-green-700 rounded-md text-sm dark:bg-green-900 dark:text-green-300">
          {resumeSuccess}
        </div>
      )}
      
      {resumeError && (
        <div className="mb-6 p-3 bg-red-100 text-red-700 rounded-md text-sm dark:bg-red-900 dark:text-red-300">
          {resumeError}
        </div>
      )}

      <div className="space-y-8">
        <div className="bg-white rounded-lg shadow dark:bg-gray-800 overflow-hidden">
          <div className="px-6 py-5 border-b border-gray-200 dark:border-gray-700">
            <h3 className="text-lg font-medium text-gray-900 dark:text-white">Upload New Resume</h3>
          </div>
          <div className="px-6 py-5">
            <form onSubmit={handleUploadResume} className="space-y-4">
              <div>
                <label htmlFor="resume-name" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Resume Name
                </label>
                <div className="mt-1">
                  <input
                    id="resume-name"
                    type="text"
                    value={newResumeName}
                    onChange={(e) => setNewResumeName(e.target.value)}
                    className="input-field"
                    placeholder="e.g. Software Engineer Resume"
                  />
                </div>
              </div>
              
              <div>
                <label htmlFor="resume-file" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Resume File
                </label>
                <div className="mt-1 flex items-center">
                  <label className="w-full flex justify-center px-6 pt-5 pb-6 border-2 border-gray-300 border-dashed rounded-md cursor-pointer dark:border-gray-600 hover:border-gray-400 dark:hover:border-gray-500">
                    <div className="space-y-1 text-center">
                      <svg
                        className="mx-auto h-12 w-12 text-gray-400"
                        stroke="currentColor"
                        fill="none"
                        viewBox="0 0 48 48"
                      >
                        <path
                          d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02"
                          strokeWidth={2}
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />
                      </svg>
                      <div className="flex text-sm text-gray-600 dark:text-gray-400">
                        <span className="relative rounded-md font-medium text-primary-600 hover:text-primary-500 dark:text-primary-400 dark:hover:text-primary-300">
                          Upload a file
                        </span>
                        <p className="pl-1">or drag and drop</p>
                      </div>
                      <p className="text-xs text-gray-500 dark:text-gray-400">
                        PDF, DOC, DOCX up to 5MB
                      </p>
                      
                      {fileToUpload && (
                        <p className="text-sm text-gray-700 dark:text-gray-300 mt-2">
                          Selected: {fileToUpload.name} ({(fileToUpload.size / 1024).toFixed(1)} KB)
                        </p>
                      )}
                    </div>
                    <input
                      id="resume-file"
                      name="resume-file"
                      type="file"
                      accept=".pdf,.doc,.docx"
                      className="sr-only"
                      onChange={handleFileChange}
                    />
                  </label>
                </div>
              </div>
              
              <div className="flex justify-end">
                <button
                  type="submit"
                  disabled={uploadingResume}
                  className={`inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 dark:bg-primary-700 dark:hover:bg-primary-600 ${
                    uploadingResume ? 'opacity-75 cursor-not-allowed' : ''
                  }`}
                >
                  {uploadingResume ? (
                    <>
                      <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Uploading...
                    </>
                  ) : (
                    'Upload Resume'
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow dark:bg-gray-800 overflow-hidden">
          <div className="px-6 py-5 border-b border-gray-200 dark:border-gray-700">
            <h3 className="text-lg font-medium text-gray-900 dark:text-white">My Resumes</h3>
          </div>
          <div className="px-6 py-5">
            {resumes.length > 0 ? (
              <div className="overflow-hidden">
                <div className="flex flex-col">
                  <div className="-my-2 overflow-x-auto sm:-mx-6 lg:-mx-8">
                    <div className="py-2 align-middle inline-block min-w-full sm:px-6 lg:px-8">
                      <div className="shadow overflow-hidden border-b border-gray-200 dark:border-gray-700 sm:rounded-lg">
                        <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                          <thead className="bg-gray-50 dark:bg-gray-700">
                            <tr>
                              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                                Resume
                              </th>
                              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                                Version
                              </th>
                              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                                Last Updated
                              </th>
                              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                                Status
                              </th>
                              <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                                Actions
                              </th>
                            </tr>
                          </thead>
                          <tbody className="bg-white divide-y divide-gray-200 dark:bg-gray-800 dark:divide-gray-700">
                            {resumes.map((resume) => (
                              <tr key={resume.id}>
                                <td className="px-6 py-4 whitespace-nowrap">
                                  <div className="flex items-center">
                                    <div className="flex-shrink-0 h-10 w-10 flex items-center justify-center bg-primary-100 rounded-md dark:bg-primary-900">
                                      <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-primary-600 dark:text-primary-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                      </svg>
                                    </div>
                                    <div className="ml-4">
                                      <div className="text-sm font-medium text-gray-900 dark:text-white">
                                        {resume.name}
                                      </div>
                                      <div className="text-sm text-gray-500 dark:text-gray-400">
                                        {resume.fileSize}
                                      </div>
                                    </div>
                                  </div>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap">
                                  <div className="text-sm text-gray-900 dark:text-white">{resume.version}</div>
                                  <div className="text-sm text-gray-500 dark:text-gray-400">
                                    Created {formatDate(resume.createdAt)}
                                  </div>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                                  {formatDate(resume.updatedAt)}
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap">
                                  {resume.isDefault ? (
                                    <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">
                                      Default
                                    </span>
                                  ) : (
                                    <button
                                      onClick={() => handleSetDefault(resume.id)}
                                      className="text-primary-600 hover:text-primary-900 dark:text-primary-400 dark:hover:text-primary-300 text-xs"
                                    >
                                      Set as Default
                                    </button>
                                  )}
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                  <div className="flex items-center justify-end space-x-3">
                                    <a
                                      href={resume.file}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      className="text-primary-600 hover:text-primary-900 dark:text-primary-400 dark:hover:text-primary-300"
                                    >
                                      Preview
                                    </a>
                                    <button
                                      onClick={() => handleDeleteResume(resume.id)}
                                      className="text-red-600 hover:text-red-900 dark:text-red-400 dark:hover:text-red-300"
                                    >
                                      Delete
                                    </button>
                                  </div>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="text-center py-8">
                <svg
                  className="mx-auto h-12 w-12 text-gray-400"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={1}
                    d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                  />
                </svg>
                <h3 className="mt-2 text-sm font-medium text-gray-900 dark:text-white">No resumes</h3>
                <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                  Get started by uploading your first resume.
                </p>
              </div>
            )}
          </div>
        </div>

        <div className="bg-white rounded-lg shadow dark:bg-gray-800 overflow-hidden">
          <div className="px-6 py-5 border-b border-gray-200 dark:border-gray-700">
            <h3 className="text-lg font-medium text-gray-900 dark:text-white">Resume Tips</h3>
          </div>
          <div className="px-6 py-5">
            <div className="space-y-4">
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Optimize your resume for better tracking and job matching:
              </p>
              <ul className="list-disc pl-5 text-sm text-gray-600 dark:text-gray-400 space-y-2">
                <li>Use a clean, ATS-friendly format that systems can easily parse</li>
                <li>Include relevant keywords from job descriptions to pass automated screening</li>
                <li>Create different versions for different types of roles or industries</li>
                <li>Quantify your achievements with specific metrics and results</li>
                <li>Keep your resume updated with your latest experience and skills</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default withAuth(ResumesSettings);