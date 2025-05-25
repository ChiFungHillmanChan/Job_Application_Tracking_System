'use client';

import { useState, useEffect } from 'react';
import withAuth from '@/lib/withAuth';
import Link from 'next/link';
import { useTheme } from '@/lib/hooks/useTheme';
import { useAuth } from '@/lib/hooks/useAuth';

// Premium Components
import AdvancedColorPicker from '@/components/ui/premium/AdvancedColorPicker';
import FontFamilySelector from '@/components/ui/premium/FontFamilySelector';
import GranularSlider from '@/components/ui/premium/GranularSlider';
import CustomCSSEditor from '@/components/ui/premium/CustomCSSEditor';
import PremiumFeatureLock from '@/components/ui/premium/PremiumFeatureLock';

function AdvancedAppearanceSettings() {
  const { 
    appearance, 
    updateSetting, 
    updateStatusColor,
    saveToProfile,
    syncFromProfile,
    resetToDefaults,
    loading,
    saveMode,
    hasUnsavedChanges,
    syncStatus
  } = useTheme();
  
  const { user, isAuthenticated } = useAuth();
  const [message, setMessage] = useState({ type: '', text: '' });
  const [activeSection, setActiveSection] = useState('colors');
  const [customCSS, setCustomCSS] = useState('');
  const [previewMode, setPreviewMode] = useState(false);

  const showMessage = (type, text) => {
    setMessage({ type, text });
    setTimeout(() => setMessage({ type: '', text: '' }), 4000);
  };

  // Check if user has premium access
  const hasPremiumAccess = () => {
    return user?.subscriptionTier === 'premium' || user?.subscriptionTier === 'enterprise';
  };

  const hasEnterpriseAccess = () => {
    return user?.subscriptionTier === 'enterprise';
  };

  // Handle save
  const handleSave = async () => {
    try {
      const result = await saveToProfile();
      showMessage(result.success ? 'success' : 'error', result.message);
    } catch (error) {
      showMessage('error', 'Failed to save settings');
    }
  };

  // Handle reset
  const handleReset = async () => {
    if (confirm('Reset all advanced settings to defaults? This cannot be undone.')) {
      await resetToDefaults();
      showMessage('success', 'Settings reset to defaults');
    }
  };

  // Handle custom CSS change
  const handleCustomCSSChange = (css) => {
    setCustomCSS(css);
    // Apply CSS in real-time if in preview mode
    if (previewMode) {
      const existingStyle = document.getElementById('custom-css-live');
      if (existingStyle) {
        existingStyle.remove();
      }
      
      if (css.trim()) {
        const style = document.createElement('style');
        style.id = 'custom-css-live';
        style.textContent = css;
        document.head.appendChild(style);
      }
    }
  };

  // Navigation sections
  const sections = [
    { id: 'colors', name: 'Advanced Colors', icon: '🎨', premium: true },
    { id: 'typography', name: 'Typography', icon: '📝', premium: true },
    { id: 'spacing', name: 'Spacing & Layout', icon: '📐', premium: true },
    { id: 'effects', name: 'Visual Effects', icon: '✨', premium: true },
    { id: 'css', name: 'Custom CSS', icon: '💻', premium: true, enterprise: true },
    { id: 'components', name: 'Components', icon: '🧩', premium: true }
  ];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center space-x-4 mb-4">
          <Link
            href="/settings/appearance"
            className="flex items-center text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white transition-colors duration-200"
          >
            <svg className="h-5 w-5 mr-1" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M9.707 16.707a1 1 0 01-1.414 0l-6-6a1 1 0 010-1.414l6-6a1 1 0 011.414 1.414L5.414 9H17a1 1 0 110 2H5.414l4.293 4.293a1 1 0 010 1.414z" clipRule="evenodd" />
            </svg>
            Back to Appearance
          </Link>
          
          <svg className="h-5 w-5 text-gray-300" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 111.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
          </svg>
          
          <span className="text-gray-500 dark:text-gray-400">Advanced Settings</span>
        </div>
        
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
              Advanced Appearance
            </h1>
            <p className="mt-2 text-gray-600 dark:text-gray-400">
              Fine-tune every aspect of your interface with powerful customization tools
            </p>
          </div>
          
          {/* Premium badge */}
          <div className="flex items-center space-x-2">
            <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-gradient-to-r from-purple-100 to-pink-100 text-purple-800 dark:from-purple-900 dark:to-pink-900 dark:text-purple-200">
              <svg className="w-4 h-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
              </svg>
              Premium Features
            </span>
          </div>
        </div>
      </div>

      {/* Status Messages */}
      {message.text && (
        <div className={`mb-6 p-4 rounded-lg animate-fade-in ${
          message.type === 'success' 
            ? 'bg-green-50 text-green-800 border border-green-200 dark:bg-green-900/20 dark:text-green-300 dark:border-green-800'
            : 'bg-red-50 text-red-800 border border-red-200 dark:bg-red-900/20 dark:text-red-300 dark:border-red-800'
        }`}>
          <div className="flex items-center">
            <svg className="w-5 h-5 mr-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              {message.type === 'success' ? (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              ) : (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              )}
            </svg>
            {message.text}
          </div>
        </div>
      )}

      <div className="flex flex-col lg:flex-row gap-8">
        {/* Sidebar Navigation */}
        <div className="lg:w-64 flex-shrink-0">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow border border-gray-200 dark:border-gray-700 p-4">
            <nav className="space-y-2">
              {sections.map(section => (
                <button
                  key={section.id}
                  onClick={() => setActiveSection(section.id)}
                  className={`w-full flex items-center justify-between px-3 py-2 rounded-md text-sm font-medium transition-colors duration-200 ${
                    activeSection === section.id
                      ? 'bg-primary-100 text-primary-700 dark:bg-primary-900 dark:text-primary-300'
                      : 'text-gray-600 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-700'
                  }`}
                >
                  <div className="flex items-center">
                    <span className="mr-3">{section.icon}</span>
                    {section.name}
                  </div>
                  
                  {section.premium && (
                    <div className="flex items-center space-x-1">
                      {section.enterprise && (
                        <span className="inline-flex items-center px-1.5 py-0.5 rounded text-xs font-medium bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-300">
                          Pro
                        </span>
                      )}
                      {!section.enterprise && (
                        <span className="inline-flex items-center px-1.5 py-0.5 rounded text-xs font-medium bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-300">
                          Plus
                        </span>
                      )}
                    </div>
                  )}
                </button>
              ))}
            </nav>
            
            {/* Quick Actions */}
            <div className="mt-6 pt-6 border-t border-gray-200 dark:border-gray-700">
              <div className="space-y-2">
                <button
                  onClick={() => setPreviewMode(!previewMode)}
                  className={`w-full flex items-center px-3 py-2 rounded-md text-sm font-medium transition-colors duration-200 ${
                    previewMode
                      ? 'bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300'
                      : 'text-gray-600 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-700'
                  }`}
                >
                  <svg className="w-4 h-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                  </svg>
                  {previewMode ? 'Exit Preview' : 'Live Preview'}
                </button>
                
                <button
                  onClick={handleSave}
                  disabled={!hasUnsavedChanges}
                  className="w-full flex items-center px-3 py-2 rounded-md text-sm font-medium text-white bg-primary-600 hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200"
                >
                  <svg className="w-4 h-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3-3m0 0l-3 3m3-3v12" />
                  </svg>
                  Save Changes
                </button>
                
                <button
                  onClick={handleReset}
                  className="w-full flex items-center px-3 py-2 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-700 transition-colors duration-200"
                >
                  <svg className="w-4 h-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                  </svg>
                  Reset All
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="flex-1 min-w-0">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow border border-gray-200 dark:border-gray-700">
            
            {/* Advanced Colors Section */}
            {activeSection === 'colors' && (
              <div className="p-6">
                <div className="mb-6">
                  <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                    Advanced Color Customization
                  </h2>
                  <p className="text-gray-600 dark:text-gray-400">
                    Create custom color schemes with full control over hue, saturation, and lightness
                  </p>
                </div>

                <div className="space-y-8">
                  {/* Primary Color Picker */}
                  <AdvancedColorPicker
                    label="Primary Color"
                    value="#0ea5e9"
                    onChange={(color) => updateSetting('primaryColor', color)}
                    showPresets={true}
                    showHarmony={true}
                  />

                  {/* Secondary Color Picker */}
                  <AdvancedColorPicker
                    label="Secondary Color" 
                    value="#64748b"
                    onChange={(color) => updateSetting('secondaryColor', color)}
                    showPresets={true}
                    showHarmony={true}
                  />

                  {/* Accent Color Picker */}
                  <AdvancedColorPicker
                    label="Accent Color"
                    value="#f59e0b"
                    onChange={(color) => updateSetting('accentColor', color)}
                    showPresets={true}
                    showHarmony={true}
                  />
                </div>
              </div>
            )}

            {/* Typography Section */}
            {activeSection === 'typography' && (
              <div className="p-6">
                <div className="mb-6">
                  <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                    Advanced Typography
                  </h2>
                  <p className="text-gray-600 dark:text-gray-400">
                    Choose from hundreds of Google Fonts and fine-tune typography settings
                  </p>
                </div>

                <div className="space-y-8">
                  {/* Font Family Selectors */}
                  <FontFamilySelector
                    label="Heading Font"
                    value="Inter"
                    onChange={(font) => updateSetting('headingFont', font)}
                    categories={['sans-serif', 'serif', 'display']}
                  />

                  <FontFamilySelector
                    label="Body Font"
                    value="Inter"
                    onChange={(font) => updateSetting('bodyFont', font)}
                    categories={['sans-serif', 'serif']}
                  />

                  <FontFamilySelector
                    label="Code Font"
                    value="Fira Code"
                    onChange={(font) => updateSetting('codeFont', font)}
                    categories={['monospace']}
                  />

                  {/* Typography Controls */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <GranularSlider
                      label="Base Font Size"
                      value={16}
                      min={12}
                      max={24}
                      step={1}
                      unit="px"
                      description="Base font size for body text"
                      onChange={(size) => updateSetting('baseFontSize', size)}
                    />

                    <GranularSlider
                      label="Line Height"
                      value={1.5}
                      min={1.0}
                      max={2.5}
                      step={0.1}
                      unit="x"
                      description="Spacing between lines of text"
                      onChange={(height) => updateSetting('lineHeight', height)}
                    />

                    <GranularSlider
                      label="Letter Spacing"
                      value={0}
                      min={-0.5}
                      max={0.5}
                      step={0.025}
                      unit="em"
                      description="Spacing between characters"
                      onChange={(spacing) => updateSetting('letterSpacing', spacing)}
                    />

                    <GranularSlider
                      label="Heading Scale"
                      value={1.25}
                      min={1.1}
                      max={1.8}
                      step={0.05}
                      unit="x"
                      description="Size ratio between heading levels"
                      onChange={(scale) => updateSetting('headingScale', scale)}
                    />
                  </div>
                </div>
              </div>
            )}

            {/* Spacing & Layout Section */}
            {activeSection === 'spacing' && (
              <div className="p-6">
                <div className="mb-6">
                  <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                    Spacing & Layout Controls
                  </h2>
                  <p className="text-gray-600 dark:text-gray-400">
                    Fine-tune spacing, padding, and layout dimensions for perfect alignment
                  </p>
                </div>

                <div className="space-y-8">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <GranularSlider
                      label="Base Spacing Unit"
                      value={16}
                      min={4}
                      max={32}
                      step={2}
                      unit="px"
                      description="Base unit for all spacing calculations"
                      onChange={(spacing) => updateSetting('baseSpacing', spacing)}
                    />

                    <GranularSlider
                      label="Card Padding"
                      value={24}
                      min={8}
                      max={48}
                      step={4}
                      unit="px"
                      description="Internal padding for cards and containers"
                      onChange={(padding) => updateSetting('cardPadding', padding)}
                    />

                    <GranularSlider
                      label="Element Gap"
                      value={16}
                      min={4}
                      max={40}
                      step={2}
                      unit="px"
                      description="Space between adjacent elements"
                      onChange={(gap) => updateSetting('elementGap', gap)}
                    />

                    <GranularSlider
                      label="Section Spacing"
                      value={32}
                      min={16}
                      max={80}
                      step={8}
                      unit="px"
                      description="Space between major sections"
                      onChange={(spacing) => updateSetting('sectionSpacing', spacing)}
                    />

                    <GranularSlider
                      label="Border Radius"
                      value={8}
                      min={0}
                      max={32}
                      step={2}
                      unit="px"
                      description="Roundness of corners for elements"
                      onChange={(radius) => updateSetting('borderRadius', radius)}
                    />

                    <GranularSlider
                      label="Container Max Width"
                      value={1200}
                      min={800}
                      max={1600}
                      step={50}
                      unit="px"
                      description="Maximum width for content containers"
                      onChange={(width) => updateSetting('maxWidth', width)}
                    />
                  </div>
                </div>
              </div>
            )}

            {/* Visual Effects Section */}
            {activeSection === 'effects' && (
              <div className="p-6">
                <div className="mb-6">
                  <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                    Visual Effects & Animation
                  </h2>
                  <p className="text-gray-600 dark:text-gray-400">
                    Add visual polish with shadows, animations, and modern effects
                  </p>
                </div>

                <div className="space-y-8">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <GranularSlider
                      label="Shadow Intensity"
                      value={3}
                      min={0}
                      max={10}
                      step={1}
                      unit=""
                      description="Depth and intensity of drop shadows"
                      onChange={(intensity) => updateSetting('shadowIntensity', intensity)}
                    />

                    <GranularSlider
                      label="Animation Speed"
                      value={200}
                      min={0}
                      max={1000}
                      step={50}
                      unit="ms"
                      description="Duration of hover and transition effects"
                      onChange={(speed) => updateSetting('animationSpeed', speed)}
                    />

                    <GranularSlider
                      label="Blur Intensity"
                      value={0}
                      min={0}
                      max={20}
                      step={2}
                      unit="px"
                      description="Background blur for glassmorphism effects"
                      onChange={(blur) => updateSetting('blurIntensity', blur)}
                    />

                    <GranularSlider
                      label="Opacity Level"
                      value={100}
                      min={50}
                      max={100}
                      step={5}
                      unit="%"
                      description="Transparency level for overlay elements"
                      onChange={(opacity) => updateSetting('opacityLevel', opacity)}
                    />
                  </div>

                  {/* Effect Toggles */}
                  <div className="space-y-4">
                    <h3 className="text-lg font-medium text-gray-900 dark:text-white">
                      Effect Options
                    </h3>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {[
                        { key: 'glassmorphism', label: 'Glassmorphism Effect', description: 'Frosted glass appearance' },
                        { key: 'gradients', label: 'Gradient Accents', description: 'Color gradient backgrounds' },
                        { key: 'animations', label: 'Hover Animations', description: 'Interactive hover effects' },
                        { key: 'particles', label: 'Particle Effects', description: 'Subtle floating particles' }
                      ].map(effect => (
                        <PremiumFeatureLock
                          key={effect.key}
                          feature="advanced_effects"
                          requiredTier="premium"
                          showPreview={false}
                        >
                          <div className="flex items-center justify-between p-4 border border-gray-200 dark:border-gray-700 rounded-lg">
                            <div>
                              <h4 className="font-medium text-gray-900 dark:text-white">
                                {effect.label}
                              </h4>
                              <p className="text-sm text-gray-500 dark:text-gray-400">
                                {effect.description}
                              </p>
                            </div>
                            <label className="relative inline-flex items-center cursor-pointer">
                              <input
                                type="checkbox"
                                className="sr-only peer"
                                checked={appearance[effect.key] || false}
                                onChange={(e) => updateSetting(effect.key, e.target.checked)}
                              />
                              <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary-300 dark:peer-focus:ring-primary-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-primary-600"></div>
                            </label>
                          </div>
                        </PremiumFeatureLock>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Custom CSS Section */}
            {activeSection === 'css' && (
              <div className="p-6">
                <div className="mb-6">
                  <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                    Custom CSS Editor
                  </h2>
                  <p className="text-gray-600 dark:text-gray-400">
                    Add your own CSS rules for ultimate customization control
                  </p>
                </div>

                <CustomCSSEditor
                  value={customCSS}
                  onChange={handleCustomCSSChange}
                  maxHeight="500px"
                  showPreview={true}
                  showTemplates={true}
                />
              </div>
            )}

            {/* Components Section */}
            {activeSection === 'components' && (
              <div className="p-6">
                <div className="mb-6">
                  <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                    Component Styling
                  </h2>
                  <p className="text-gray-600 dark:text-gray-400">
                    Customize the appearance of individual interface components
                  </p>
                </div>

                <PremiumFeatureLock
                  feature="component_theming"
                  requiredTier="premium"
                  showPreview={true}
                >
                  <div className="space-y-6">
                    {/* Component customization would go here */}
                    <div className="p-4 border border-gray-200 dark:border-gray-700 rounded-lg">
                      <h3 className="font-medium text-gray-900 dark:text-white mb-4">
                        Button Styles
                      </h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <button className="btn-primary">Primary Button</button>
                        <button className="btn-secondary">Secondary Button</button>
                      </div>
                    </div>

                    <div className="p-4 border border-gray-200 dark:border-gray-700 rounded-lg">
                      <h3 className="font-medium text-gray-900 dark:text-white mb-4">
                        Card Styles
                      </h3>
                      <div className="card p-4">
                        <h4 className="font-medium mb-2">Sample Card</h4>
                        <p className="text-gray-600 dark:text-gray-400">
                          This is how cards will appear with your customizations.
                        </p>
                      </div>
                    </div>
                  </div>
                </PremiumFeatureLock>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default withAuth(AdvancedAppearanceSettings);