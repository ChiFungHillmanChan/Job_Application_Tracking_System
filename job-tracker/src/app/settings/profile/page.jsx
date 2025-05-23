'use client';

import { useState } from 'react';
import { useAuth } from '@/lib/hooks/useAuth';
import withAuth from '@/lib/withAuth';
import Link from 'next/link';

function ProfileSettings() {
  const { user } = useAuth();
  
  const [formData, setFormData] = useState({
    name: user?.name || '',
    email: user?.email || '',
    jobTitle: user?.jobTitle || '',
    location: user?.location || '',
    bio: user?.bio || ''
  });
  
  const [isEditing, setIsEditing] = useState(false);
  const [formError, setFormError] = useState('');
  const [formSuccess, setFormSuccess] = useState('');
  
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value
    }));
  };
  
  const handleSubmit = async (e) => {
    e.preventDefault();
    setFormError('');
    setFormSuccess('');
    
    try {
      // This would be a real API call in production
      // await updateProfile(formData);
      
      // For demo purposes, we'll just simulate success
      setTimeout(() => {
        setFormSuccess('Profile updated successfully');
        setIsEditing(false);
      }, 1000);
      
    } catch (error) {
      console.error('Error updating profile:', error);
      setFormError(error.response?.data?.error || 'Failed to update profile');
    }
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
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Profile Settings</h1>
        <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
          Update your personal information
        </p>
      </header>

      <div className="bg-white rounded-lg shadow dark:bg-gray-800 overflow-hidden">
        <div className="px-6 py-5 border-b border-gray-200 dark:border-gray-700 flex justify-between items-center">
          <h3 className="text-lg font-medium text-gray-900 dark:text-white">Personal Information</h3>
          
          {!isEditing && (
            <button
              onClick={() => setIsEditing(true)}
              className="inline-flex items-center px-3 py-1.5 border border-transparent text-sm font-medium rounded-md text-primary-600 bg-primary-100 hover:bg-primary-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 dark:bg-primary-900 dark:text-primary-300 dark:hover:bg-primary-800"
            >
              Edit Profile
            </button>
          )}
        </div>
        
        <div className="px-6 py-5">
          {formError && (
            <div className="mb-4 p-3 bg-red-100 text-red-700 rounded-md text-sm dark:bg-red-900 dark:text-red-300">
              {formError}
            </div>
          )}
          
          {formSuccess && (
            <div className="mb-4 p-3 bg-green-100 text-green-700 rounded-md text-sm dark:bg-green-900 dark:text-green-300">
              {formSuccess}
            </div>
          )}
          
          {isEditing ? (
            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <label htmlFor="name" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Full Name
                </label>
                <div className="mt-1">
                  <input
                    id="name"
                    name="name"
                    type="text"
                    required
                    value={formData.name}
                    onChange={handleChange}
                    className="input-field"
                  />
                </div>
              </div>
              
              <div>
                <label htmlFor="email" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Email Address
                </label>
                <div className="mt-1">
                  <input
                    id="email"
                    name="email"
                    type="email"
                    required
                    value={formData.email}
                    onChange={handleChange}
                    disabled={user?.googleId || user?.appleId}
                    className={`input-field ${(user?.googleId || user?.appleId) ? 'bg-gray-100 dark:bg-gray-700 cursor-not-allowed' : ''}`}
                  />
                  {(user?.googleId || user?.appleId) && (
                    <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                      Email cannot be changed when using social login.
                    </p>
                  )}
                </div>
              </div>
              
              <div>
                <label htmlFor="jobTitle" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Job Title (Optional)
                </label>
                <div className="mt-1">
                  <input
                    id="jobTitle"
                    name="jobTitle"
                    type="text"
                    value={formData.jobTitle}
                    onChange={handleChange}
                    className="input-field"
                    placeholder="e.g. Software Engineer"
                  />
                </div>
              </div>
              
              <div>
                <label htmlFor="location" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Location (Optional)
                </label>
                <div className="mt-1">
                  <input
                    id="location"
                    name="location"
                    type="text"
                    value={formData.location}
                    onChange={handleChange}
                    className="input-field"
                    placeholder="e.g. San Francisco, CA"
                  />
                </div>
              </div>
              
              <div>
                <label htmlFor="bio" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Bio (Optional)
                </label>
                <div className="mt-1">
                  <textarea
                    id="bio"
                    name="bio"
                    rows={4}
                    value={formData.bio}
                    onChange={handleChange}
                    className="input-field"
                    placeholder="Tell us a little about yourself..."
                  />
                </div>
                <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                  Brief description for your profile. URLs are hyperlinked.
                </p>
              </div>
              
              <div className="flex justify-end space-x-3">
                <button
                  type="button"
                  onClick={() => {
                    setIsEditing(false);
                    setFormData({
                      name: user?.name || '',
                      email: user?.email || '',
                      jobTitle: user?.jobTitle || '',
                      location: user?.location || '',
                      bio: user?.bio || ''
                    });
                  }}
                  className="inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 dark:bg-gray-700 dark:text-gray-300 dark:border-gray-600 dark:hover:bg-gray-600"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 dark:bg-primary-700 dark:hover:bg-primary-600"
                >
                  Save Changes
                </button>
              </div>
            </form>
          ) : (
            <dl className="grid grid-cols-1 gap-x-4 gap-y-6 sm:grid-cols-2">
              <div className="sm:col-span-2">
                <dt className="text-sm font-medium text-gray-500 dark:text-gray-400">Full Name</dt>
                <dd className="mt-1 text-sm text-gray-900 dark:text-white">{formData.name}</dd>
              </div>
              
              <div className="sm:col-span-2">
                <dt className="text-sm font-medium text-gray-500 dark:text-gray-400">Email Address</dt>
                <dd className="mt-1 text-sm text-gray-900 dark:text-white">{formData.email}</dd>
              </div>
              
              {formData.jobTitle && (
                <div>
                  <dt className="text-sm font-medium text-gray-500 dark:text-gray-400">Job Title</dt>
                  <dd className="mt-1 text-sm text-gray-900 dark:text-white">{formData.jobTitle}</dd>
                </div>
              )}
              
              {formData.location && (
                <div>
                  <dt className="text-sm font-medium text-gray-500 dark:text-gray-400">Location</dt>
                  <dd className="mt-1 text-sm text-gray-900 dark:text-white">{formData.location}</dd>
                </div>
              )}
              
              {formData.bio && (
                <div className="sm:col-span-2">
                  <dt className="text-sm font-medium text-gray-500 dark:text-gray-400">Bio</dt>
                  <dd className="mt-1 text-sm text-gray-900 dark:text-white whitespace-pre-line">{formData.bio}</dd>
                </div>
              )}
            </dl>
          )}
        </div>
      </div>

      <div className="mt-8 bg-white rounded-lg shadow dark:bg-gray-800 overflow-hidden">
        <div className="px-6 py-5 border-b border-gray-200 dark:border-gray-700">
          <h3 className="text-lg font-medium text-gray-900 dark:text-white">Profile Picture</h3>
        </div>
        <div className="px-6 py-5">
          <div className="flex items-center">
            <div className="h-24 w-24 rounded-full overflow-hidden bg-gray-200 dark:bg-gray-700 flex items-center justify-center">
              {user?.name ? (
                <span className="text-3xl font-medium text-gray-600 dark:text-gray-300">
                  {user.name.charAt(0)}
                </span>
              ) : (
                <svg className="h-12 w-12 text-gray-400" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
              )}
            </div>
            <div className="ml-5">
              <div className="text-sm font-medium text-gray-900 dark:text-white">Add a photo to your profile</div>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                JPG, GIF or PNG. Max size of 800K
              </p>
              <div className="mt-3 flex space-x-3">
                <button
                  type="button"
                  className="inline-flex items-center px-3 py-1.5 border border-transparent text-sm font-medium rounded-md text-primary-600 bg-primary-100 hover:bg-primary-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 dark:bg-primary-900 dark:text-primary-300 dark:hover:bg-primary-800"
                >
                  Upload
                </button>
                <button
                  type="button"
                  className="inline-flex items-center px-3 py-1.5 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 dark:bg-gray-700 dark:text-gray-300 dark:border-gray-600 dark:hover:bg-gray-600"
                >
                  Remove
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="mt-8 bg-white rounded-lg shadow dark:bg-gray-800 overflow-hidden">
        <div className="px-6 py-5 border-b border-gray-200 dark:border-gray-700">
          <h3 className="text-lg font-medium text-gray-900 dark:text-white">Job Preferences</h3>
        </div>
        <div className="px-6 py-5">
          <div className="mt-4 space-y-6">
            <div>
              <h4 className="text-sm font-medium text-gray-900 dark:text-white">Job Types</h4>
              <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                Select the types of roles you're interested in
              </p>
              <div className="mt-2 grid grid-cols-2 gap-2 sm:grid-cols-3">
                {['Full-time', 'Part-time', 'Contract', 'Internship', 'Remote', 'Hybrid'].map((type) => (
                  <div key={type} className="flex items-center">
                    <input
                      id={`job-type-${type.toLowerCase()}`}
                      name={`job-type-${type.toLowerCase()}`}
                      type="checkbox"
                      className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
                    />
                    <label htmlFor={`job-type-${type.toLowerCase()}`} className="ml-2 text-sm text-gray-700 dark:text-gray-300">
                      {type}
                    </label>
                  </div>
                ))}
              </div>
            </div>
            
            <div>
              <h4 className="text-sm font-medium text-gray-900 dark:text-white">Salary Range</h4>
              <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                Set your preferred salary range
              </p>
              <div className="mt-2 flex space-x-4">
                <div className="w-1/2">
                  <select
                    id="minimum-salary"
                    name="minimum-salary"
                    className="input-field"
                  >
                    <option value="">Minimum</option>
                    <option value="30000">$30,000</option>
                    <option value="50000">$50,000</option>
                    <option value="70000">$70,000</option>
                    <option value="90000">$90,000</option>
                    <option value="120000">$120,000</option>
                    <option value="150000">$150,000+</option>
                  </select>
                </div>
                <div className="w-1/2">
                  <select
                    id="maximum-salary"
                    name="maximum-salary"
                    className="input-field"
                  >
                    <option value="">Maximum</option>
                    <option value="50000">$50,000</option>
                    <option value="70000">$70,000</option>
                    <option value="90000">$90,000</option>
                    <option value="120000">$120,000</option>
                    <option value="150000">$150,000</option>
                    <option value="200000">$200,000+</option>
                  </select>
                </div>
              </div>
            </div>
            
            <div>
              <h4 className="text-sm font-medium text-gray-900 dark:text-white">Skills</h4>
              <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                Add skills to highlight your expertise (comma separated)
              </p>
              <div className="mt-2">
                <input
                  type="text"
                  id="skills"
                  name="skills"
                  className="input-field"
                  placeholder="e.g. React, Node.js, TypeScript"
                />
              </div>
            </div>
            
            <div className="flex justify-end">
              <button
                type="button"
                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 dark:bg-primary-700 dark:hover:bg-primary-600"
              >
                Save Preferences
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default withAuth(ProfileSettings);