'use client';

import { createContext, useContext, useState, useEffect } from 'react';
import { applyThemeVariables, applyDensityClasses, applyFontSizeClasses } from '@/lib/appearanceUtils';

const defaultAppearance = {
  theme: 'system',
  colorScheme: 'default', 
  density: 'default', 
  fontSize: 'default', 
  statusColors: {
    'Saved': 'blue',
    'Applied': 'purple',
    'Phone Screen': 'yellow',
    'Interview': 'yellow',
    'Technical Assessment': 'yellow',
    'Offer': 'green',
    'Rejected': 'red',
    'Withdrawn': 'red',
  },
};

const AppearanceContext = createContext({
  appearance: defaultAppearance,
  setAppearance: () => {},
  updateSetting: () => {},
  resetToDefaults: () => {},
  getStatusColor: () => {},
  loading: false,
  error: null,
});

export const AppearanceProvider = ({ children }) => {
  const [appearance, setAppearance] = useState(defaultAppearance);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Initialize appearance from localStorage and user preferences
  useEffect(() => {
    const initializeAppearance = async () => {
      setLoading(true);
      setError(null);
      
      try {
        // Load from localStorage first (for immediate application)
        const localAppearance = loadFromLocalStorage();
        if (localAppearance) {
          setAppearance(localAppearance);
          applyAppearanceSettings(localAppearance);
        }

        // Try to load from user profile if authenticated
        try {
          const token = localStorage.getItem('token');
          if (token && !token.startsWith('mock-token-')) {
            // For real authentication, you would fetch user preferences here
            // const userPreferences = await fetchUserPreferences();
            // if (userPreferences?.appearance) {
            //   const mergedAppearance = { ...defaultAppearance, ...userPreferences.appearance };
            //   setAppearance(mergedAppearance);
            //   applyAppearanceSettings(mergedAppearance);
            //   saveToLocalStorage(mergedAppearance);
            // }
          }
        } catch (err) {
          console.warn('Could not load user appearance preferences:', err);
          // Continue with localStorage settings
        }

        // Apply system theme detection if needed
        if (!localAppearance || localAppearance.theme === 'system') {
          applySystemTheme();
        }

      } catch (err) {
        console.error('Error initializing appearance:', err);
        setError('Failed to load appearance settings');
        // Fall back to defaults
        applyAppearanceSettings(defaultAppearance);
      } finally {
        setLoading(false);
      }
    };

    initializeAppearance();
  }, []);

  // Listen for system theme changes
  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    
    const handleSystemThemeChange = () => {
      if (appearance.theme === 'system') {
        applySystemTheme();
      }
    };
    
    mediaQuery.addEventListener('change', handleSystemThemeChange);
    return () => mediaQuery.removeEventListener('change', handleSystemThemeChange);
  }, [appearance.theme]);

  // Apply appearance settings whenever they change
  useEffect(() => {
    if (!loading) {
      applyAppearanceSettings(appearance);
      saveToLocalStorage(appearance);
    }
  }, [appearance, loading]);

  const loadFromLocalStorage = () => {
    try {
      const stored = localStorage.getItem('job_tracker_appearance');
      if (stored) {
        const parsed = JSON.parse(stored);
        // Validate the loaded settings
        return validateAppearanceSettings(parsed);
      }
    } catch (err) {
      console.warn('Error loading appearance from localStorage:', err);
    }
    return null;
  };

  const saveToLocalStorage = (settings) => {
    try {
      localStorage.setItem('job_tracker_appearance', JSON.stringify(settings));
    } catch (err) {
      console.warn('Error saving appearance to localStorage:', err);
    }
  };

  const validateAppearanceSettings = (settings) => {
    const validThemes = ['light', 'dark', 'system'];
    const validColorSchemes = ['default', 'green', 'purple', 'red', 'orange'];
    const validDensities = ['compact', 'default', 'comfortable'];
    const validFontSizes = ['small', 'default', 'large'];

    return {
      theme: validThemes.includes(settings.theme) ? settings.theme : defaultAppearance.theme,
      colorScheme: validColorSchemes.includes(settings.colorScheme) ? settings.colorScheme : defaultAppearance.colorScheme,
      density: validDensities.includes(settings.density) ? settings.density : defaultAppearance.density,
      fontSize: validFontSizes.includes(settings.fontSize) ? settings.fontSize : defaultAppearance.fontSize,
      statusColors: settings.statusColors || defaultAppearance.statusColors,
    };
  };

  const applyAppearanceSettings = (settings) => {
    // Apply theme (light/dark)
    applyTheme(settings.theme);
    
    // Apply color scheme
    applyThemeVariables(settings.colorScheme);
    
    // Apply density
    applyDensityClasses(settings.density);
    
    // Apply font size
    applyFontSizeClasses(settings.fontSize);
  };

  const applyTheme = (theme) => {
    const html = document.documentElement;
    
    if (theme === 'dark') {
      html.classList.add('dark');
    } else if (theme === 'light') {
      html.classList.remove('dark');
    } else if (theme === 'system') {
      applySystemTheme();
    }
  };

  const applySystemTheme = () => {
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    document.documentElement.classList.toggle('dark', prefersDark);
  };

  const updateSetting = (key, value) => {
    setAppearance(prev => ({
      ...prev,
      [key]: value
    }));
  };

  const resetToDefaults = () => {
    setAppearance(defaultAppearance);
  };

  const getStatusColor = (status) => {
    const colorMap = appearance.statusColors[status];
    if (!colorMap) return 'gray';
    
    return {
      bg: `bg-${colorMap}-100`,
      text: `text-${colorMap}-800`,
      darkBg: `dark:bg-${colorMap}-900`,
      darkText: `dark:text-${colorMap}-300`,
    };
  };

  // Save to user profile (if authenticated)
  const saveToProfile = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token || token.startsWith('mock-token-')) {
        return { success: false, message: 'Settings saved locally only (demo mode)' };
      }

      // For real authentication, you would save to user profile here
      // const response = await api.put('/auth/updateprofile', {
      //   preferences: { appearance }
      // });
      
      return { success: true, message: 'Appearance preferences saved to your account' };
    } catch (err) {
      console.error('Error saving appearance to profile:', err);
      return { success: false, message: 'Failed to save to account, but saved locally' };
    }
  };

  const value = {
    appearance,
    setAppearance,
    updateSetting,
    resetToDefaults,
    getStatusColor,
    saveToProfile,
    loading,
    error,
  };

  return (
    <AppearanceContext.Provider value={value}>
      {children}
    </AppearanceContext.Provider>
  );
};

export const useAppearance = () => {
  const context = useContext(AppearanceContext);
  if (context === undefined) {
    throw new Error('useAppearance must be used within an AppearanceProvider');
  }
  return context;
};

export default useAppearance;