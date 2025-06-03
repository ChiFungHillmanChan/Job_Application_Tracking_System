'use client';

import { useState } from 'react';
import { useAuth } from '@/lib/hooks/useAuth';
import Link from 'next/link';

const PremiumFeatureLock = ({ 
  children, 
  feature, 
  requiredTier = 'plus',
  showPreview = true,
  customMessage,
  className = ''
}) => {
  const { user, isAuthenticated } = useAuth();
  const [showUpgrade, setShowUpgrade] = useState(false);

  // FIXED: Removed all console.log statements for cleaner performance
  const hasAccess = () => {
    if (!isAuthenticated() || !user) {
      return false;
    }
    
    const tierLevels = {
      'free': 0,
      'plus': 1,
      'pro': 2
    };
    
    const userLevel = tierLevels[user.subscriptionTier] || 0;
    const requiredLevel = tierLevels[requiredTier] || 1;
    
    return userLevel >= requiredLevel;
  };

  const getFeatureDescription = (feature) => {
    const descriptions = {
      'custom_colors': 'Create unlimited custom color schemes with full color wheel control',
      'advanced_typography': 'Access Google Fonts library and granular typography controls',
      'custom_css': 'Inject custom CSS and create advanced styling effects',
      'theme_export': 'Export and import custom themes, share with team members',
      'granular_spacing': 'Precise spacing controls for perfect layout customization',
      'advanced_effects': 'Custom shadows, gradients, and visual effects',
      'component_theming': 'Individual component styling and customization',
      'unlimited_themes': 'Create and save unlimited custom themes',
      'font_upload': 'Upload custom brand fonts and typography',
      'team_sharing': 'Share themes and collaborate with team members'
    };
    
    return descriptions[feature] || 'Access plus appearance customization features';
  };

  const getTierBadge = (tier) => {
    const badges = {
      'plus': {
        name: 'Plus',
        color: 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-300',
        price: '£8.88/month'
      },
      'pro': {
        name: 'Pro',
        color: 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-300',
        price: '£38.88/month'
      }
    };
    
    return badges[tier] || badges.plus;
  };

  if (hasAccess()) {
    return <div className={className}>{children}</div>;
  }

  const tierInfo = getTierBadge(requiredTier);

  return (
    <div className={`relative ${className}`}>
      {/* Preview with overlay */}
      {showPreview && (
        <div className="relative">
          <div className="pointer-events-none opacity-50 grayscale">
            {children}
          </div>
          
          {/* Gradient overlay */}
          <div className="absolute inset-0 bg-gradient-to-t from-white via-white/80 to-transparent dark:from-gray-900 dark:via-gray-900/80 pointer-events-none" />
          
          {/* Lock icon */}
          <div className="absolute top-2 right-2 p-1 bg-white dark:bg-gray-800 rounded-full shadow-lg border border-gray-200 dark:border-gray-700">
            <svg className="w-4 h-4 text-gray-600 dark:text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
            </svg>
          </div>
        </div>
      )}

      {/* Upgrade prompt */}
      <div className={`${showPreview ? 'mt-4' : ''} p-6 bg-gradient-to-br from-primary-50 to-primary-100 dark:from-primary-900/20 dark:to-primary-800/20 rounded-lg border border-primary-200 dark:border-primary-800`}>
        <div className="flex items-start space-x-4">
          {/* Premium icon */}
          <div className="flex-shrink-0 p-2 bg-primary-500 rounded-lg">
            <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
            </svg>
          </div>
          
          <div className="flex-1 min-w-0">
            <div className="flex items-center space-x-2 mb-2">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                Premium Feature
              </h3>
              <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${tierInfo.color}`}>
                {tierInfo.name}
              </span>
            </div>
            
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
              {customMessage || getFeatureDescription(feature)}
            </p>
            
            <div className="flex flex-col sm:flex-row gap-3">
              <Link
                href="/settings/subscription"
                className="inline-flex items-center justify-center px-4 py-2 bg-primary-600 text-white rounded-md hover:bg-primary-700 transition-colors duration-200 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
              >
                <svg className="w-4 h-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
                Upgrade to {tierInfo.name}
              </Link>
              
              <button
                onClick={() => setShowUpgrade(!showUpgrade)}
                className="inline-flex items-center justify-center px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-md hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors duration-200 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
              >
                Learn More
              </button>
            </div>
            
            {showUpgrade && (
              <div className="mt-4 p-4 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 animate-fade-in">
                <h4 className="font-medium text-gray-900 dark:text-white mb-2">
                  {tierInfo.name} Plan - {tierInfo.price}
                </h4>
                <ul className="text-sm text-gray-600 dark:text-gray-400 space-y-1">
                  {requiredTier === 'plus' ? (
                    <>
                      <li className="flex items-center">
                        <svg className="w-4 h-4 mr-2 text-green-500" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                        </svg>
                        Unlimited custom color schemes
                      </li>
                      <li className="flex items-center">
                        <svg className="w-4 h-4 mr-2 text-green-500" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                        </svg>
                        Google Fonts library access
                      </li>
                      <li className="flex items-center">
                        <svg className="w-4 h-4 mr-2 text-green-500" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                        </svg>
                        Advanced spacing controls
                      </li>
                      <li className="flex items-center">
                        <svg className="w-4 h-4 mr-2 text-green-500" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                        </svg>
                        Theme export & import
                      </li>
                    </>
                  ) : (
                    <>
                      <li className="flex items-center">
                        <svg className="w-4 h-4 mr-2 text-green-500" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                        </svg>
                        Everything in Plus
                      </li>
                      <li className="flex items-center">
                        <svg className="w-4 h-4 mr-2 text-green-500" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                        </svg>
                        Custom CSS injection
                      </li>
                      <li className="flex items-center">
                        <svg className="w-4 h-4 mr-2 text-green-500" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                        </svg>
                        Custom font upload
                      </li>
                      <li className="flex items-center">
                        <svg className="w-4 h-4 mr-2 text-green-500" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                        </svg>
                        Team theme sharing
                      </li>
                    </>
                  )}
                </ul>
                
                <div className="mt-3 text-xs text-gray-500 dark:text-gray-400">
                  30% off with annual billing • Cancel anytime
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default PremiumFeatureLock;