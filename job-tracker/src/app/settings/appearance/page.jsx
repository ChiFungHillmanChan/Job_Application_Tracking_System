'use client';

import { useState, useEffect } from 'react';
import withAuth from '@/lib/withAuth';
import Link from 'next/link';
import { useTheme } from '@/lib/hooks/useTheme';
import { useAuth } from '@/lib/hooks/useAuth';

import AdvancedColorPicker from '@/components/ui/premium/AdvancedColorPicker';
import FontFamilySelector from '@/components/ui/premium/FontFamilySelector';
import GranularSlider from '@/components/ui/premium/GranularSlider';
import CustomCSSEditor from '@/components/ui/premium/CustomCSSEditor';

function AppearanceSettings() {
  const { 
    appearance, 
    updateSetting, 
    updateStatusColor, 
    resetToDefaults, 
    savePreferences,
    getStatusColor,
    loading,
    hasUnsavedChanges,
    lastSaved,
    saveStatus
  } = useTheme();
  
  const { user, isAuthenticated } = useAuth();
  const [message, setMessage] = useState({ type: '', text: '' });
  const [activeSection, setActiveSection] = useState('theme');
  const [isSaving, setIsSaving] = useState(false);
  
  // FIXED: Separate state for advanced settings that doesn't trigger appearance changes
  const [advancedSettings, setAdvancedSettings] = useState({
    primaryColor: '#0ea5e9',
    secondaryColor: '#64748b',
    accentColor: '#f59e0b',
    headingFont: 'Inter',
    bodyFont: 'Inter',
    codeFont: 'Fira Code',
    baseSpacing: 16,
    cardPadding: 24,
    borderRadius: 8,
    maxWidth: 1200,
    shadowIntensity: 3,
    animationSpeed: 200,
    customCSS: ''
  });
  
  // FIXED: Separate state for advanced tab that doesn't reset
  const [advancedActiveTab, setAdvancedActiveTab] = useState('theme');
  
  const hasPlusAccess = () => {
    return user?.subscriptionTier === 'plus' || user?.subscriptionTier === 'pro';
  };

  const hasProAccess = () => {
    return user?.subscriptionTier === 'pro';
  };

  const showMessage = (type, text) => {
    setMessage({ type, text });
    setTimeout(() => setMessage({ type: '', text: '' }), 4000);
  };

  // FIXED: Only update advanced settings without affecting main appearance state
  const handleAdvancedSettingChange = (key, value) => {
    setAdvancedSettings(prev => ({
      ...prev,
      [key]: value
    }));
    
    // Only update appearance for color changes, not layout changes
    if (['primaryColor', 'secondaryColor', 'accentColor'].includes(key)) {
      updateSetting(key, value);
    }
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      const result = await savePreferences();
      showMessage(result.success ? 'success' : 'error', result.message);
    } catch (error) {
      showMessage('error', 'Failed to save preferences');
    } finally {
      setIsSaving(false);
    }
  };

  const handleResetToDefaults = async () => {
    if (window.confirm('Are you sure you want to reset all appearance settings to defaults?')) {
      await resetToDefaults();
      setAdvancedSettings({
        primaryColor: '#0ea5e9',
        secondaryColor: '#64748b',
        accentColor: '#f59e0b',
        headingFont: 'Inter',
        bodyFont: 'Inter',
        codeFont: 'Fira Code',
        baseSpacing: 16,
        cardPadding: 24,
        borderRadius: 8,
        maxWidth: 1200,
        shadowIntensity: 3,
        animationSpeed: 200,
        customCSS: ''
      });
      showMessage('success', 'Settings reset to defaults');
    }
  };

  const getSaveStatusInfo = () => {
    if (isSaving || saveStatus === 'saving') {
      return { icon: '⏳', text: 'Saving...', color: 'text-blue-600' };
    }
    
    switch (saveStatus) {
      case 'success':
        return { icon: '✅', text: 'Saved', color: 'text-green-600' };
      case 'error':
        return { icon: '❌', text: 'Save failed', color: 'text-red-600' };
      default:
        return hasUnsavedChanges 
          ? { icon: '⚠️', text: 'Unsaved changes', color: 'text-yellow-600' }
          : { icon: '💾', text: 'Up to date', color: 'text-gray-600' };
    }
  };

  const formatLastSaved = () => {
    if (!lastSaved) return 'Never saved';
    const date = new Date(lastSaved);
    const now = new Date();
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Saved just now';
    if (diffMins < 60) return `Saved ${diffMins}m ago`;
    if (diffHours < 24) return `Saved ${diffHours}h ago`;
    return `Saved ${diffDays}d ago`;
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

  const BasicThemeSettings = () => (
    <div className="space-y-8">
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
        </div>
      </div>

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
                    className="text-sm border border-gray-300 rounded-md px-2 py-1 bg-white dark:bg-gray-800 dark:border-gray-600 dark:text-white focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-colors duration-200"
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
    </div>
  );

  const AdvancedThemeSettings = () => {
    const tabs = [
      { id: 'theme', name: 'Theme & Colors', icon: '🎨' },
      { id: 'typography', name: 'Typography', icon: '📝' },
      { id: 'spacing', name: 'Spacing & Layout', icon: '📐' },
      { id: 'effects', name: 'Visual Effects', icon: '✨' },
      ...(hasProAccess() ? [{ id: 'css', name: 'Custom CSS', icon: '💻' }] : [])
    ];

    return (
      <div className="space-y-8">
        <div className="card">
          <div className="card-header">
            <h3 className="text-lg font-medium text-gray-900 dark:text-white">
              Advanced Customization
              <span className="ml-3 inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-gradient-to-r from-purple-100 to-pink-100 text-purple-800 dark:from-purple-900 dark:to-pink-900 dark:text-purple-200">
                <svg className="w-3 h-3 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
                </svg>
                {user?.subscriptionTier === 'pro' ? 'Pro' : 'Plus'}
              </span>
            </h3>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
              Professional-grade customization tools for ultimate control
            </p>
          </div>

          <div className="border-b border-gray-200 dark:border-gray-700 mb-6">
            <nav className="-mb-px flex space-x-8 overflow-x-auto">
              {tabs.map(tab => (
                <button
                  key={tab.id}
                  onClick={() => setAdvancedActiveTab(tab.id)}
                  className={`py-2 px-1 border-b-2 font-medium text-sm whitespace-nowrap transition-colors duration-200 ${
                    advancedActiveTab === tab.id
                      ? 'border-primary-500 text-primary-600 dark:text-primary-400'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-300'
                  }`}
                >
                  <span className="mr-2">{tab.icon}</span>
                  {tab.name}
                </button>
              ))}
            </nav>
          </div>

          <div className="space-y-8">
            {/* FIXED: Use advancedActiveTab instead of activeTab */}
            {advancedActiveTab === 'theme' && (
              <div className="p-6 space-y-8">
                <div className="mb-6">
                  <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                    Theme & Color Customization
                  </h2>
                  <p className="text-gray-600 dark:text-gray-400">
                    Complete control over your theme preferences and color schemes
                  </p>
                </div>

                <div className="space-y-8">
                  <h4 className="text-lg font-medium text-gray-900 dark:text-white">Advanced Color Controls</h4>
                  <AdvancedColorPicker
                    label="Primary Color"
                    value={advancedSettings.primaryColor}
                    onChange={(color) => handleAdvancedSettingChange('primaryColor', color)}
                    showPresets={true}
                    showHarmony={true}
                  />
                  <AdvancedColorPicker
                    label="Secondary Color" 
                    value={advancedSettings.secondaryColor}
                    onChange={(color) => handleAdvancedSettingChange('secondaryColor', color)}
                    showPresets={true}
                    showHarmony={true}
                  />
                  <AdvancedColorPicker
                    label="Accent Color"
                    value={advancedSettings.accentColor}
                    onChange={(color) => handleAdvancedSettingChange('accentColor', color)}
                    showPresets={true}
                    showHarmony={true}
                  />
                </div>
              </div>
            )}

            {advancedActiveTab === 'typography' && (
              <div className="space-y-8">
                <div>
                  <h4 className="text-lg font-medium text-gray-900 dark:text-white mb-4">Advanced Typography</h4>
                  <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">
                    Choose from hundreds of Google Fonts and fine-tune typography settings
                  </p>
                  <div className="space-y-8">
                    <FontFamilySelector
                      label="Heading Font"
                      value={advancedSettings.headingFont}
                      onChange={(font) => handleAdvancedSettingChange('headingFont', font)}
                      categories={['sans-serif', 'serif', 'display']}
                    />
                    <FontFamilySelector
                      label="Body Font"
                      value={advancedSettings.bodyFont}
                      onChange={(font) => handleAdvancedSettingChange('bodyFont', font)}
                      categories={['sans-serif', 'serif']}
                    />
                    <FontFamilySelector
                      label="Code Font"
                      value={advancedSettings.codeFont}
                      onChange={(font) => handleAdvancedSettingChange('codeFont', font)}
                      categories={['monospace']}
                    />
                  </div>
                </div>
              </div>
            )}

            {advancedActiveTab === 'spacing' && (
              <div className="space-y-8">
                <div>
                  <h4 className="text-lg font-medium text-gray-900 dark:text-white mb-4">Spacing & Layout Controls</h4>
                  <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">
                    Fine-tune spacing, padding, and layout dimensions for perfect alignment
                  </p>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <GranularSlider
                      label="Base Spacing Unit"
                      value={advancedSettings.baseSpacing}
                      min={4}
                      max={32}
                      step={2}
                      unit="px"
                      description="Base unit for all spacing calculations"
                      onChange={(spacing) => handleAdvancedSettingChange('baseSpacing', spacing)}
                    />
                    <GranularSlider
                      label="Card Padding"
                      value={advancedSettings.cardPadding}
                      min={8}
                      max={48}
                      step={4}
                      unit="px"
                      description="Internal padding for cards and containers"
                      onChange={(padding) => handleAdvancedSettingChange('cardPadding', padding)}
                    />
                    <GranularSlider
                      label="Border Radius"
                      value={advancedSettings.borderRadius}
                      min={0}
                      max={32}
                      step={2}
                      unit="px"
                      description="Roundness of corners for elements"
                      onChange={(radius) => handleAdvancedSettingChange('borderRadius', radius)}
                    />
                    <GranularSlider
                      label="Container Max Width"
                      value={advancedSettings.maxWidth}
                      min={800}
                      max={1600}
                      step={50}
                      unit="px"
                      description="Maximum width for content containers"
                      onChange={(width) => handleAdvancedSettingChange('maxWidth', width)}
                    />
                  </div>
                </div>
              </div>
            )}

            {advancedActiveTab === 'effects' && (
              <div className="space-y-8">
                <div>
                  <h4 className="text-lg font-medium text-gray-900 dark:text-white mb-4">Visual Effects & Animation</h4>
                  <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">
                    Add visual polish with shadows, animations, and modern effects
                  </p>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <GranularSlider
                      label="Shadow Intensity"
                      value={advancedSettings.shadowIntensity}
                      min={0}
                      max={10}
                      step={1}
                      unit=""
                      description="Depth and intensity of drop shadows"
                      onChange={(intensity) => handleAdvancedSettingChange('shadowIntensity', intensity)}
                    />
                    <GranularSlider
                      label="Animation Speed"
                      value={advancedSettings.animationSpeed}
                      min={0}
                      max={1000}
                      step={50}
                      unit="ms"
                      description="Duration of hover and transition effects"
                      onChange={(speed) => handleAdvancedSettingChange('animationSpeed', speed)}
                    />
                  </div>
                </div>
              </div>
            )}

            {advancedActiveTab === 'css' && hasProAccess() && (
              <div className="space-y-8">
                <div>
                  <h4 className="text-lg font-medium text-gray-900 dark:text-white mb-4">Custom CSS Editor</h4>
                  <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">
                    Add your own CSS rules for ultimate customization control
                  </p>
                  <CustomCSSEditor
                    value={advancedSettings.customCSS}
                    onChange={(css) => handleAdvancedSettingChange('customCSS', css)}
                    maxHeight="500px"
                    showPreview={true}
                    showTemplates={true}
                  />
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  };

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
      
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            Appearance Settings
            {hasPlusAccess() && (
              <span className="ml-3 inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-gradient-to-r from-purple-100 to-pink-100 text-purple-800 dark:from-purple-900 dark:to-pink-900 dark:text-purple-200">
                <svg className="w-4 h-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
                </svg>
                {user?.subscriptionTier === 'pro' ? 'Pro' : 'Plus'} Features
              </span>
            )}
          </h1>
          <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
            {hasPlusAccess() 
              ? 'Advanced customization tools for ultimate control over your interface'
              : 'Customize how the application looks and feels'
            }
          </p>
        </div>
        
        <div className="flex items-center space-x-4">
          <div className="text-right">
            <div className={`flex items-center space-x-2 ${getSaveStatusInfo().color}`}>
              <span>{getSaveStatusInfo().icon}</span>
              <span className="text-sm font-medium">{getSaveStatusInfo().text}</span>
            </div>
            {lastSaved && (
              <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                {formatLastSaved()}
              </div>
            )}
          </div>
          
          <button
            onClick={handleSave}
            disabled={!hasUnsavedChanges || isSaving}
            className={`px-4 py-2 rounded-md text-sm font-medium transition-all duration-200 ${
              hasUnsavedChanges && !isSaving
                ? 'bg-primary-600 text-white hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500'
                : 'bg-gray-300 text-gray-500 cursor-not-allowed dark:bg-gray-700 dark:text-gray-400'
            }`}
          >
            {isSaving ? (
              <>
                <svg className="animate-spin -ml-1 mr-3 h-4 w-4 text-white inline" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
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

      {message.text && (
        <div className={`mb-6 p-3 rounded-md text-sm animate-fade-in ${
          message.type === 'success' 
            ? 'bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300'
            : message.type === 'error'
            ? 'bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300'
            : 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300'
        }`}>
          {message.text}
        </div>
      )}

      {hasUnsavedChanges && (
        <div className="mb-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg dark:bg-yellow-900/20 dark:border-yellow-800">
          <div className="flex items-start">
            <svg className="w-5 h-5 text-yellow-400 mt-0.5 mr-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <div>
              <h3 className="text-sm font-medium text-yellow-800 dark:text-yellow-200">
                You have unsaved changes
              </h3>
              <p className="text-sm text-yellow-700 dark:text-yellow-300 mt-1">
                Your appearance changes are visible in the interface but haven't been saved to your account yet. Click "Save Preferences" to save them.
              </p>
            </div>
          </div>
        </div>
      )}

      {hasPlusAccess() ? (
        <AdvancedThemeSettings />
      ) : (
        <BasicThemeSettings />
      )}

      {!hasPlusAccess() && (
        <div className="mt-8 p-6 bg-gradient-to-br from-primary-50 to-primary-100 dark:from-primary-900/20 dark:to-primary-800/20 rounded-lg border border-primary-200 dark:border-primary-800">
          <div className="flex items-start space-x-4">
            <div className="flex-shrink-0 p-2 bg-primary-500 rounded-lg">
              <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
              </svg>
            </div>
            
            <div className="flex-1 min-w-0">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                Unlock Advanced Appearance Features
              </h3>
              
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                Get access to professional customization tools and create the perfect interface for your workflow
              </p>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                <div className="flex items-start space-x-3">
                  <svg className="w-5 h-5 text-green-500 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                  <div>
                    <h4 className="font-medium text-gray-900 dark:text-white">Advanced Color Picker</h4>
                    <p className="text-sm text-gray-600 dark:text-gray-400">Full color wheel control with harmony generation</p>
                  </div>
                </div>
                
                <div className="flex items-start space-x-3">
                  <svg className="w-5 h-5 text-green-500 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                  <div>
                    <h4 className="font-medium text-gray-900 dark:text-white">Google Fonts Library</h4>
                    <p className="text-sm text-gray-600 dark:text-gray-400">Access to 1000+ professional fonts</p>
                  </div>
                </div>
                
                <div className="flex items-start space-x-3">
                  <svg className="w-5 h-5 text-green-500 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                  <div>
                    <h4 className="font-medium text-gray-900 dark:text-white">Granular Spacing Controls</h4>
                    <p className="text-sm text-gray-600 dark:text-gray-400">Precise control over layout and spacing</p>
                  </div>
                </div>
                
                <div className="flex items-start space-x-3">
                  <svg className="w-5 h-5 text-green-500 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                  <div>
                    <h4 className="font-medium text-gray-900 dark:text-white">Custom CSS Editor</h4>
                    <p className="text-sm text-gray-600 dark:text-gray-400">Ultimate customization with CSS injection</p>
                  </div>
                </div>
              </div>
              
              <div className="flex flex-col sm:flex-row gap-3">
                <Link
                  href="/settings/subscription"
                  className="inline-flex items-center justify-center px-4 py-2 bg-primary-600 text-white rounded-md hover:bg-primary-700 transition-colors duration-200 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
                >
                  <svg className="w-4 h-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                  </svg>
                  Upgrade to Plus
                </Link>
                
                <Link
                  href="/settings/subscription"
                  className="inline-flex items-center justify-center px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-md hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors duration-200 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
                >
                  View Pricing
                </Link>
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="mt-8 card">
        <div className="card-header">
          <h3 className="text-lg font-medium text-gray-900 dark:text-white">Live Preview</h3>
        </div>
        <div className="space-y-3">
          <p className="text-sm text-gray-500 dark:text-gray-400">
            See how your settings look with sample job applications
          </p>
          
          {[
            { company: 'Google', position: 'Software Engineer', status: 'Applied', date: '2 days ago' },
            { company: 'Microsoft', position: 'Product Manager', status: 'Interview', date: '1 week ago' },
            { company: 'Apple', position: 'UX Designer', status: 'Offer', date: '3 days ago' },
            { company: 'Meta', position: 'Data Scientist', status: 'Rejected', date: '1 month ago' },
            { company: 'Amazon', position: 'DevOps Engineer', status: 'Saved', date: 'Just now' }
          ].map((job, index) => {
            const statusColor = getStatusColor(job.status);
            return (
              <div key={index} className="flex items-center justify-between p-3 rounded-lg border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors duration-200">
                <div className="flex-1">
                  <h4 className={`font-medium text-gray-900 dark:text-white ${
                    appearance.fontSize === 'small' ? 'text-sm' : appearance.fontSize === 'large' ? 'text-lg' : 'text-base'
                  }`}>
                    {job.position}
                  </h4>
                  <p className={`text-gray-600 dark:text-gray-400 ${
                    appearance.fontSize === 'small' ? 'text-xs' : appearance.fontSize === 'large' ? 'text-base' : 'text-sm'
                  }`}>
                    {job.company} • {job.date}
                  </p>
                </div>
                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium transition-colors duration-200 ${statusColor.bg} ${statusColor.text} ${statusColor.darkBg} ${statusColor.darkText}`}>
                  {job.status}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      <div className="mt-8 flex justify-between">
        <button
          onClick={handleResetToDefaults}
          className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 dark:bg-gray-800 dark:text-gray-300 dark:border-gray-600 dark:hover:bg-gray-700 transition-colors duration-200"
        >
          Reset to Defaults
        </button>
        
        {hasPlusAccess() && (
          <Link
            href="/settings/appearance/advanced"
            className="px-4 py-2 text-sm font-medium text-primary-600 bg-primary-50 border border-primary-200 rounded-md hover:bg-primary-100 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 dark:bg-primary-900/20 dark:border-primary-800 dark:hover:bg-primary-900/30 transition-colors duration-200"
          >
            Advanced Settings
          </Link>
        )}
      </div>
    </div>
  );
}

export default withAuth(AppearanceSettings);