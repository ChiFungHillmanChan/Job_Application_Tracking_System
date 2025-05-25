'use client';

import { useState } from 'react';
import withAuth from '@/lib/withAuth';
import Link from 'next/link';
import { useTheme } from '@/lib/hooks/useTheme';
import ColorPicker from '@/components/ui/ColorPicker';

function AppearanceSettings() {
  const { 
    appearance, 
    updateSetting, 
    updateStatusColor, 
    resetToDefaults, 
    saveToProfile,
    getStatusColor 
  } = useTheme();
  
  const [settingsSuccess, setSettingsSuccess] = useState('');
  const [saving, setSaving] = useState(false);
  
  const handleSavePreferences = async () => {
    setSaving(true);
    try {
      const result = await saveToProfile();
      setSettingsSuccess(result.message);
      
      setTimeout(() => {
        setSettingsSuccess('');
      }, 3000);
    } catch (error) {
      setSettingsSuccess('Failed to save preferences');
    } finally {
      setSaving(false);
    }
  };

  const handleResetToDefaults = () => {
    resetToDefaults();
    setSettingsSuccess('Settings reset to defaults');
    setTimeout(() => setSettingsSuccess(''), 3000);
  };

  const statusColorOptions = [
    { name: 'Blue', value: 'blue' },
    { name: 'Green', value: 'green' },
    { name: 'Yellow', value: 'yellow' },
    { name: 'Red', value: 'red' },
    { name: 'Purple', value: 'purple' },
    { name: 'Pink', value: 'pink' },
    { name: 'Indigo', value: 'indigo' },
    { name: 'Gray', value: 'gray' },
    { name: 'Orange', value: 'orange' },
    { name: 'Teal', value: 'teal' },
  ];

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-6 flex items-center">
        <Link
          href="/settings"
          className="flex items-center text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white mr-6 transition-colors duration-200"
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
        <div className="mb-6 p-3 bg-green-100 text-green-700 rounded-md text-sm dark:bg-green-900 dark:text-green-300 animate-fade-in">
          {settingsSuccess}
        </div>
      )}

      <div className="space-y-8">
        {/* Theme Preferences */}
        <div className="card">
          <div className="card-header">
            <h3 className="text-lg font-medium text-gray-900 dark:text-white">Theme Preferences</h3>
          </div>
          <div className="space-y-6">
            <div>
              <h4 className="text-sm font-medium text-gray-900 dark:text-white mb-2">Theme Mode</h4>
              <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
                Choose between light, dark, or system preference
              </p>
              <div className="grid grid-cols-3 gap-4">
                {[
                  { 
                    value: 'light', 
                    label: 'Light',
                    icon: (
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-yellow-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
                      </svg>
                    ),
                    bg: 'bg-white border border-gray-300'
                  },
                  { 
                    value: 'dark', 
                    label: 'Dark',
                    icon: (
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-gray-200" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
                      </svg>
                    ),
                    bg: 'bg-gray-900'
                  },
                  { 
                    value: 'system', 
                    label: 'System',
                    icon: (
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                      </svg>
                    ),
                    bg: 'bg-gradient-to-r from-gray-900 to-white'
                  }
                ].map((theme) => (
                  <div 
                    key={theme.value}
                    className={`relative rounded-lg border cursor-pointer p-4 transition-all duration-200 hover:scale-105 ${
                      appearance.theme === theme.value 
                        ? 'border-primary-500 ring-2 ring-primary-500 shadow-lg' 
                        : 'border-gray-300 dark:border-gray-700 hover:border-primary-300'
                    }`}
                    onClick={() => updateSetting('theme', theme.value)}
                  >
                    <div className="flex flex-col items-center">
                      <div className={`w-10 h-10 rounded-full flex items-center justify-center ${theme.bg}`}>
                        {theme.icon}
                      </div>
                      <div className="mt-2 text-sm font-medium text-gray-900 dark:text-white">{theme.label}</div>
                    </div>
                    {appearance.theme === theme.value && (
                      <div className="absolute top-2 right-2 text-primary-600">
                        <svg className="h-5 w-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                        </svg>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
            
            <div>
              <h4 className="text-sm font-medium text-gray-900 dark:text-white mb-2">Color Scheme</h4>
              <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
                Select your preferred accent color
              </p>
              <div className="flex flex-wrap gap-3">
                {[
                  { name: 'Default', value: 'default', color: 'bg-blue-500' },
                  { name: 'Green', value: 'green', color: 'bg-green-500' },
                  { name: 'Purple', value: 'purple', color: 'bg-purple-500' },
                  { name: 'Red', value: 'red', color: 'bg-red-500' },
                  { name: 'Orange', value: 'orange', color: 'bg-orange-500' }
                ].map((scheme) => (
                  <div 
                    key={scheme.value}
                    className="flex flex-col items-center cursor-pointer"
                    onClick={() => updateSetting('colorScheme', scheme.value)}
                  >
                    <div 
                      className={`h-8 w-8 rounded-full transition-all duration-200 hover:scale-110 ${scheme.color} ${
                        appearance.colorScheme === scheme.value ? 'ring-2 ring-offset-2 ring-gray-400 dark:ring-gray-600' : ''
                      }`}
                    ></div>
                    <div className="mt-1 text-xs text-gray-600 dark:text-gray-400">{scheme.name}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Layout & Typography */}
        <div className="card">
          <div className="card-header">
            <h3 className="text-lg font-medium text-gray-900 dark:text-white">Layout & Typography</h3>
          </div>
          <div className="space-y-6">
            <div>
              <h4 className="text-sm font-medium text-gray-900 dark:text-white mb-2">Density</h4>
              <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
                Adjust the spacing between elements
              </p>
              <div className="flex items-center space-x-4">
                <div className="w-full max-w-xs">
                  <input
                    type="range"
                    min="0"
                    max="2"
                    value={['compact', 'default', 'comfortable'].indexOf(appearance.density)}
                    onChange={(e) => {
                      const values = ['compact', 'default', 'comfortable'];
                      updateSetting('density', values[e.target.value]);
                    }}
                    className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer dark:bg-gray-700 accent-primary-500"
                  />
                </div>
                <div className="w-20 text-sm font-medium text-gray-900 dark:text-white capitalize">
                  {appearance.density}
                </div>
              </div>
            </div>
            
            <div>
              <h4 className="text-sm font-medium text-gray-900 dark:text-white mb-2">Font Size</h4>
              <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
                Change the text size throughout the application
              </p>
              <div className="grid grid-cols-3 gap-3">
                {[
                  { value: 'small', label: 'Small' },
                  { value: 'default', label: 'Medium' },
                  { value: 'large', label: 'Large' }
                ].map((size) => (
                  <button
                    key={size.value}
                    type="button"
                    onClick={() => updateSetting('fontSize', size.value)}
                    className={`px-4 py-2 rounded-md transition-all duration-200 ${
                      appearance.fontSize === size.value
                        ? 'bg-primary-100 text-primary-700 dark:bg-primary-900 dark:text-primary-300 ring-2 ring-primary-500'
                        : 'bg-white text-gray-700 border border-gray-300 dark:bg-gray-800 dark:text-gray-300 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700'
                    } text-sm font-medium focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500`}
                  >
                    {size.label}
                  </button>
                ))}
              </div>
            </div>
            
            <div>
              <h4 className="text-sm font-medium text-gray-900 dark:text-white mb-2">Font Preview</h4>
              <div className="p-4 bg-gray-50 rounded-md border border-gray-200 dark:bg-gray-900 dark:border-gray-700">
                <p className={`text-gray-900 dark:text-white transition-all duration-200 ${
                  appearance.fontSize === 'small' ? 'text-sm' : appearance.fontSize === 'large' ? 'text-lg' : 'text-base'
                }`}>
                  This is how your text will appear throughout the application. The quick brown fox jumps over the lazy dog.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Status Display */}
        <div className="card">
          <div className="card-header">
            <h3 className="text-lg font-medium text-gray-900 dark:text-white">Status Display</h3>
          </div>
          <div className="space-y-4">
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Customize how job application statuses appear
            </p>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {Object.entries(appearance.statusColors).map(([status, color]) => {
                const statusColor = getStatusColor(status);
                return (
                  <div key={status} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-900 rounded-lg">
                    <div className="flex items-center space-x-3">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium transition-colors duration-200 ${statusColor.bg} ${statusColor.text} ${statusColor.darkBg} ${statusColor.darkText}`}>
                        {status}
                      </span>
                    </div>
                    <select
                      value={color}
                      onChange={(e) => updateStatusColor(status, e.target.value)}
                      className="text-sm border border-gray-300 rounded-md px-2 py-1 bg-white dark:bg-gray-800 dark:border-gray-600 dark:text-white focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                    >
                      {statusColorOptions.map((option) => (
                        <option key={option.value} value={option.value}>
                          {option.name}
                        </option>
                      ))}
                    </select>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
        
        {/* Action Buttons */}
        <div className="flex justify-between">
          <button
            type="button"
            onClick={handleResetToDefaults}
            className="inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 dark:bg-gray-800 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-700 transition-colors duration-200"
          >
            Reset to Defaults
          </button>
          
          <button
            type="button"
            onClick={handleSavePreferences}
            disabled={saving}
            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200"
          >
            {saving ? (
              <>
                <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Saving...
              </>
            ) : (
              'Save Preferences'
            )}
          </button>
        </div>
      </div>
    </div>
  );
}

export default withAuth(AppearanceSettings);