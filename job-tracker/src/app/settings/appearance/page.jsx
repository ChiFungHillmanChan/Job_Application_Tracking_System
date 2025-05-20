'use client';

import { useState } from 'react';
import withAuth from '@/lib/withAuth';
import Link from 'next/link';

function AppearanceSettings() {
  const [theme, setTheme] = useState('system');
  const [colorScheme, setColorScheme] = useState('default');
  const [density, setDensity] = useState('default');
  const [fontSize, setFontSize] = useState('default');
  const [settingsSuccess, setSettingsSuccess] = useState('');
  
  const handleSavePreferences = () => {
    // In a real app, this would save to backend/localStorage
    setSettingsSuccess('Display preferences saved successfully');
    
    setTimeout(() => {
      setSettingsSuccess('');
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
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Appearance Settings</h1>
        <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
          Customize how the application looks and feels
        </p>
      </header>

      {settingsSuccess && (
        <div className="mb-6 p-3 bg-green-100 text-green-700 rounded-md text-sm dark:bg-green-900 dark:text-green-300">
          {settingsSuccess}
        </div>
      )}

      <div className="space-y-8">
        <div className="bg-white rounded-lg shadow dark:bg-gray-800 overflow-hidden">
          <div className="px-6 py-5 border-b border-gray-200 dark:border-gray-700">
            <h3 className="text-lg font-medium text-gray-900 dark:text-white">Theme Preferences</h3>
          </div>
          <div className="px-6 py-5">
            <div className="space-y-6">
              <div>
                <h4 className="text-sm font-medium text-gray-900 dark:text-white">Theme Mode</h4>
                <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                  Choose between light, dark, or system preference
                </p>
                <div className="mt-4 grid grid-cols-3 gap-4">
                  <div 
                    className={`relative rounded-lg border ${theme === 'light' ? 'border-primary-500 ring-2 ring-primary-500' : 'border-gray-300 dark:border-gray-700'} p-4 cursor-pointer`}
                    onClick={() => setTheme('light')}
                  >
                    <div className="flex flex-col items-center">
                      <div className="w-10 h-10 rounded-full bg-white border border-gray-300 flex items-center justify-center">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-yellow-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
                        </svg>
                      </div>
                      <div className="mt-2 text-sm font-medium text-gray-900 dark:text-white">Light</div>
                    </div>
                    {theme === 'light' && (
                      <div className="absolute top-2 right-2 text-primary-600">
                        <svg className="h-5 w-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                        </svg>
                      </div>
                    )}
                  </div>
                  
                  <div 
                    className={`relative rounded-lg border ${theme === 'dark' ? 'border-primary-500 ring-2 ring-primary-500' : 'border-gray-300 dark:border-gray-700'} p-4 cursor-pointer`}
                    onClick={() => setTheme('dark')}
                  >
                    <div className="flex flex-col items-center">
                      <div className="w-10 h-10 rounded-full bg-gray-900 flex items-center justify-center">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-gray-200" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
                        </svg>
                      </div>
                      <div className="mt-2 text-sm font-medium text-gray-900 dark:text-white">Dark</div>
                    </div>
                    {theme === 'dark' && (
                      <div className="absolute top-2 right-2 text-primary-600">
                        <svg className="h-5 w-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                        </svg>
                      </div>
                    )}
                  </div>
                  
                  <div 
                    className={`relative rounded-lg border ${theme === 'system' ? 'border-primary-500 ring-2 ring-primary-500' : 'border-gray-300 dark:border-gray-700'} p-4 cursor-pointer`}
                    onClick={() => setTheme('system')}
                  >
                    <div className="flex flex-col items-center">
                      <div className="w-10 h-10 rounded-full bg-gradient-to-r from-gray-900 to-white flex items-center justify-center">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                        </svg>
                      </div>
                      <div className="mt-2 text-sm font-medium text-gray-900 dark:text-white">System</div>
                    </div>
                    {theme === 'system' && (
                      <div className="absolute top-2 right-2 text-primary-600">
                        <svg className="h-5 w-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                        </svg>
                      </div>
                    )}
                  </div>
                </div>
              </div>
              
              <div>
                <h4 className="text-sm font-medium text-gray-900 dark:text-white">Color Scheme</h4>
                <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                  Select your preferred accent color
                </p>
                <div className="mt-4 flex space-x-3">
                  {[
                    { name: 'Default', color: 'bg-blue-500' },
                    { name: 'Green', color: 'bg-green-500' },
                    { name: 'Purple', color: 'bg-purple-500' },
                    { name: 'Red', color: 'bg-red-500' },
                    { name: 'Orange', color: 'bg-orange-500' }
                  ].map((scheme) => (
                    <div 
                      key={scheme.name}
                      className="flex flex-col items-center"
                      onClick={() => setColorScheme(scheme.name.toLowerCase())}
                    >
                      <div 
                        className={`h-8 w-8 rounded-full ${scheme.color} cursor-pointer ${colorScheme === scheme.name.toLowerCase() ? 'ring-2 ring-offset-2 ring-gray-400' : ''}`}
                      ></div>
                      <div className="mt-1 text-xs text-gray-600 dark:text-gray-400">{scheme.name}</div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow dark:bg-gray-800 overflow-hidden">
          <div className="px-6 py-5 border-b border-gray-200 dark:border-gray-700">
            <h3 className="text-lg font-medium text-gray-900 dark:text-white">Layout & Typography</h3>
          </div>
          <div className="px-6 py-5">
            <div className="space-y-6">
              <div>
                <h4 className="text-sm font-medium text-gray-900 dark:text-white">Density</h4>
                <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                  Adjust the spacing between elements
                </p>
                <div className="mt-4 flex items-center space-x-4">
                  <div className="w-full max-w-xs">
                    <input
                      type="range"
                      min="0"
                      max="2"
                      value={['compact', 'default', 'comfortable'].indexOf(density)}
                      onChange={(e) => {
                        const values = ['compact', 'default', 'comfortable'];
                        setDensity(values[e.target.value]);
                      }}
                      className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer dark:bg-gray-700"
                    />
                  </div>
                  <div className="w-16 text-sm font-medium text-gray-900 dark:text-white capitalize">
                    {density}
                  </div>
                </div>
              </div>
              
              <div>
                <h4 className="text-sm font-medium text-gray-900 dark:text-white">Font Size</h4>
                <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                  Change the text size throughout the application
                </p>
                <div className="mt-4">
                  <div className="grid grid-cols-3 gap-3">
                    {['small', 'default', 'large'].map((size) => (
                      <button
                        key={size}
                        type="button"
                        onClick={() => setFontSize(size)}
                        className={`px-4 py-2 rounded-md ${
                          fontSize === size
                            ? 'bg-primary-100 text-primary-700 dark:bg-primary-900 dark:text-primary-300'
                            : 'bg-white text-gray-700 border border-gray-300 dark:bg-gray-800 dark:text-gray-300 dark:border-gray-700'
                        } text-sm font-medium focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500`}
                      >
                        {size === 'small' && 'Small'}
                        {size === 'default' && 'Medium'}
                        {size === 'large' && 'Large'}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
              
              <div>
                <h4 className="text-sm font-medium text-gray-900 dark:text-white">Font Preview</h4>
                <div className={`mt-3 p-4 bg-gray-50 rounded-md border border-gray-200 dark:bg-gray-900 dark:border-gray-700`}>
                  <p className={`text-gray-900 dark:text-white ${
                    fontSize === 'small' ? 'text-sm' : fontSize === 'large' ? 'text-lg' : 'text-base'
                  }`}>
                    This is how your text will appear throughout the application.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow dark:bg-gray-800 overflow-hidden">
          <div className="px-6 py-5 border-b border-gray-200 dark:border-gray-700">
            <h3 className="text-lg font-medium text-gray-900 dark:text-white">Status Display</h3>
          </div>
          <div className="px-6 py-5">
            <div className="space-y-4">
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Customize how job application statuses appear
              </p>
              
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {[
                  { name: 'Saved', color: 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300' },
                  { name: 'Applied', color: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300' },
                  { name: 'Interview', color: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300' },
                  { name: 'Offer', color: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300' }
                ].map((status) => (
                  <div key={status.name} className="flex items-center space-x-2">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${status.color}`}>
                      {status.name}
                    </span>
                    <button className="text-gray-400 hover:text-gray-500 dark:hover:text-gray-300">
                      <svg className="h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                        <path d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.38-8.379-2.83-2.828z" />
                      </svg>
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
        
        <div className="flex justify-end">
          <button
            type="button"
            onClick={handleSavePreferences}
            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 dark:bg-primary-700 dark:hover:bg-primary-600"
          >
            Save Preferences
          </button>
        </div>
      </div>
    </div>
  );
}

export default withAuth(AppearanceSettings);