// Enhanced useTheme.js with full account integration

'use client';

import { createContext, useContext, useState, useEffect } from 'react';
import { applyThemeVariables, applyDensityClasses, applyFontSizeClasses } from '@/lib/appearanceUtils';
import api from '@/lib/api';
import { useAuth } from '@/lib/hooks/useAuth';

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

const ThemeContext = createContext({
  appearance: defaultAppearance,
  setAppearance: () => {},
  updateSetting: () => {},
  updateStatusColor: () => {},
  resetToDefaults: () => {},
  getStatusColor: () => {},
  saveToProfile: () => {},
  syncFromProfile: () => {},
  loading: false,
  error: null,
  saveMode: 'device', // 'device', 'account', 'both'
});

export const ThemeProvider = ({ children }) => {
  const { user, isAuthenticated } = useAuth();
  const [appearance, setAppearance] = useState(defaultAppearance);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [saveMode, setSaveMode] = useState('device'); // Default to device-only

  // Initialize appearance - prioritize account settings if logged in
  useEffect(() => {
    const initializeAppearance = async () => {
      setLoading(true);
      setError(null);
      
      try {
        let finalAppearance = defaultAppearance;
        
        // 1. Start with localStorage settings (for immediate application)
        const localAppearance = loadFromLocalStorage();
        if (localAppearance) {
          finalAppearance = localAppearance;
        }

        // 2. If authenticated, try to load from user profile (overrides localStorage)
        if (isAuthenticated() && user) {
          try {
            const profileAppearance = await loadFromProfile();
            if (profileAppearance) {
              finalAppearance = profileAppearance;
              setSaveMode('account'); // User has account settings
              
              // Update localStorage to match account settings
              saveToLocalStorage(profileAppearance);
            }
          } catch (err) {
            console.warn('Could not load appearance from profile, using local settings:', err);
            setSaveMode('device'); // Fall back to device-only
          }
        } else {
          setSaveMode('device'); // Not authenticated
        }

        setAppearance(finalAppearance);
        applyAppearanceSettings(finalAppearance);

        // Apply system theme detection if needed
        if (finalAppearance.theme === 'system') {
          applySystemTheme();
        }

      } catch (err) {
        console.error('Error initializing appearance:', err);
        setError('Failed to load appearance settings');
        applyAppearanceSettings(defaultAppearance);
        setSaveMode('device');
      } finally {
        setLoading(false);
      }
    };

    initializeAppearance();
  }, [user, isAuthenticated]);

  // Listen for authentication changes
  useEffect(() => {
    if (isAuthenticated() && user && saveMode === 'device') {
      // User just logged in, try to sync settings
      syncFromProfile();
    } else if (!isAuthenticated() && saveMode === 'account') {
      // User logged out, switch to device-only mode
      setSaveMode('device');
    }
  }, [user, isAuthenticated]);

  // Listen for system theme changes
  useEffect(() => {
    if (typeof window === 'undefined') return;
    
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
      
      // Auto-save based on current mode
      if (saveMode === 'device' || saveMode === 'both') {
        saveToLocalStorage(appearance);
      }
      if ((saveMode === 'account' || saveMode === 'both') && isAuthenticated()) {
        // Debounced auto-save to account (don't await to avoid blocking UI)
        debouncedSaveToProfile(appearance);
      }
    }
  }, [appearance, loading, saveMode]);

  // Debounced save function to avoid too many API calls
  const debouncedSaveToProfile = (() => {
    let timeout;
    return (settings) => {
      clearTimeout(timeout);
      timeout = setTimeout(() => {
        saveToProfileAPI(settings);
      }, 1000); // Wait 1 second after last change
    };
  })();

  const loadFromLocalStorage = () => {
    if (typeof window === 'undefined') return null;
    
    try {
      const stored = localStorage.getItem('job_tracker_appearance');
      if (stored) {
        const parsed = JSON.parse(stored);
        return validateAppearanceSettings(parsed);
      }
    } catch (err) {
      console.warn('Error loading appearance from localStorage:', err);
    }
    return null;
  };

  const saveToLocalStorage = (settings) => {
    if (typeof window === 'undefined') return;
    
    try {
      localStorage.setItem('job_tracker_appearance', JSON.stringify(settings));
    } catch (err) {
      console.warn('Error saving appearance to localStorage:', err);
    }
  };

  const loadFromProfile = async () => {
    try {
      const response = await api.get('/auth/me');
      if (response.data?.success && response.data.user?.preferences?.appearance) {
        return validateAppearanceSettings(response.data.user.preferences.appearance);
      }
    } catch (error) {
      console.warn('Error loading appearance from profile:', error);
      throw error;
    }
    return null;
  };

  const saveToProfileAPI = async (settings) => {
    try {
      const response = await api.put('/auth/updateprofile', {
        preferences: {
          appearance: settings
        }
      });
      return response.data;
    } catch (error) {
      console.error('Error saving appearance to profile:', error);
      throw error;
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
    if (typeof window === 'undefined') return;
    
    applyTheme(settings.theme);
    applyThemeVariables(settings.colorScheme);
    applyDensityClasses(settings.density);
    applyFontSizeClasses(settings.fontSize);
  };

  const applyTheme = (theme) => {
    if (typeof window === 'undefined') return;
    
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
    if (typeof window === 'undefined') return;
    
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    document.documentElement.classList.toggle('dark', prefersDark);
  };

  const updateSetting = (key, value) => {
    setAppearance(prev => ({
      ...prev,
      [key]: value
    }));
  };

  const updateStatusColor = (status, color) => {
    setAppearance(prev => ({
      ...prev,
      statusColors: {
        ...prev.statusColors,
        [status]: color
      }
    }));
  };

  const resetToDefaults = () => {
    setAppearance(defaultAppearance);
  };

  const getStatusColor = (status) => {
    const colorName = appearance.statusColors[status] || 'gray';
    
    return {
      bg: `bg-${colorName}-100`,
      text: `text-${colorName}-800`,
      border: `border-${colorName}-200`,
      darkBg: `dark:bg-${colorName}-900`,
      darkText: `dark:text-${colorName}-300`,
      darkBorder: `dark:border-${colorName}-800`,
    };
  };

  // Manual save to profile (for explicit save button)
  const saveToProfile = async () => {
    if (!isAuthenticated()) {
      return { 
        success: false, 
        message: 'Please log in to save settings to your account' 
      };
    }

    try {
      setLoading(true);
      await saveToProfileAPI(appearance);
      setSaveMode('account'); // Switch to account mode
      
      return { 
        success: true, 
        message: 'Appearance preferences saved to your account' 
      };
    } catch (err) {
      console.error('Error saving appearance to profile:', err);
      return { 
        success: false, 
        message: 'Failed to save to account, but saved locally' 
      };
    } finally {
      setLoading(false);
    }
  };

  // Manual sync from profile
  const syncFromProfile = async () => {
    if (!isAuthenticated()) {
      return { success: false, message: 'Not authenticated' };
    }

    try {
      setLoading(true);
      const profileAppearance = await loadFromProfile();
      
      if (profileAppearance) {
        setAppearance(profileAppearance);
        setSaveMode('account');
        saveToLocalStorage(profileAppearance);
        
        return { 
          success: true, 
          message: 'Settings synced from your account' 
        };
      } else {
        return { 
          success: false, 
          message: 'No saved settings found in your account' 
        };
      }
    } catch (err) {
      console.error('Error syncing from profile:', err);
      return { 
        success: false, 
        message: 'Failed to sync from account' 
      };
    } finally {
      setLoading(false);
    }
  };

  const value = {
    appearance,
    setAppearance,
    updateSetting,
    updateStatusColor,
    resetToDefaults,
    getStatusColor,
    saveToProfile,
    syncFromProfile,
    loading,
    error,
    saveMode, // 'device', 'account', or 'both'
  };

  return (
    <ThemeContext.Provider value={value}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};

export default useTheme;