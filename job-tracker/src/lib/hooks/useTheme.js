'use client';

import { createContext, useContext, useState, useEffect, useCallback } from 'react';
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

// Simple error handler function
const handleError = (error, context = 'operation') => {
  console.error(`Error during ${context}:`, error);
  
  if (error.response?.data?.error) {
    return error.response.data.error;
  }
  if (error.response?.data?.message) {
    return error.response.data.message;
  }
  if (error.message) {
    return error.message;
  }
  return `An error occurred during ${context}. Please try again.`;
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
  setSaveMode: () => {},
  loading: false,
  error: null,
  saveMode: 'device',
  lastSynced: null,
  hasUnsavedChanges: false,
  syncStatus: 'idle',
});

export const ThemeProvider = ({ children }) => {
  const { user, isAuthenticated, token } = useAuth();
  const [appearance, setAppearance] = useState(defaultAppearance);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [saveMode, setSaveMode] = useState('device');
  const [lastSynced, setLastSynced] = useState(null);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [autoSaveEnabled, setAutoSaveEnabled] = useState(true);
  const [syncStatus, setSyncStatus] = useState('idle');

  // Debounced save function with better error handling
  const debouncedSaveToProfile = useCallback((() => {
    let timeout;
    return (settings) => {
      clearTimeout(timeout);
      timeout = setTimeout(async () => {
        if (!autoSaveEnabled || !isAuthenticated() || !token) {
          console.log('🔒 Auto-save skipped: not authenticated or disabled');
          return;
        }

        if (saveMode !== 'hybrid' && saveMode !== 'account') {
          console.log('📱 Auto-save skipped: device-only mode');
          return;
        }

        try {
          setSyncStatus('syncing');
          console.log('🔄 Auto-saving appearance settings...');
          
          await saveToProfileAPI(settings);
          
          setLastSynced(new Date().toISOString());
          setHasUnsavedChanges(false);
          setSyncStatus('success');
          
          console.log('✅ Auto-save successful');
          
          // Clear success status after 3 seconds
          setTimeout(() => setSyncStatus('idle'), 3000);
          
        } catch (err) {
          console.warn('⚠️ Auto-save failed:', err.message);
          setHasUnsavedChanges(true);
          setSyncStatus('error');
          
          // Clear error status after 5 seconds
          setTimeout(() => setSyncStatus('idle'), 5000);
        }
      }, 2000);
    };
  })(), [autoSaveEnabled, saveMode, isAuthenticated, token]);

  // Initialize appearance system
  useEffect(() => {
    const initializeAppearance = async () => {
      setLoading(true);
      setError(null);
      setSyncStatus('idle');
      
      try {
        let finalAppearance = defaultAppearance;
        let initialSaveMode = 'device';
        
        console.log('🎨 Initializing appearance system...');
        
        // 1. Load from localStorage first (immediate application)
        const localAppearance = loadFromLocalStorage();
        if (localAppearance) {
          finalAppearance = { ...defaultAppearance, ...localAppearance };
          console.log('📱 Loaded local appearance settings');
        }

        // 2. If authenticated, try to load from user profile
        if (isAuthenticated() && user && token) {
          console.log('🔐 User authenticated, checking profile settings...');
          
          try {
            const profileResult = await loadFromProfile();
            if (profileResult.success && profileResult.data) {
              const profileAppearance = { ...defaultAppearance, ...profileResult.data };
              
              // Compare timestamps to determine which is newer
              const localTimestamp = localAppearance?.lastModified || 0;
              const profileTimestamp = profileResult.lastModified || 0;
              
              if (profileTimestamp > localTimestamp) {
                // Profile is newer, use it
                finalAppearance = profileAppearance;
                saveToLocalStorage({ ...profileAppearance, lastModified: profileTimestamp });
                console.log('☁️ Using profile settings (newer than local)');
              } else if (localTimestamp > profileTimestamp) {
                // Local is newer, keep it but mark for sync
                setHasUnsavedChanges(true);
                console.log('📝 Using local settings (newer than profile, will sync)');
              } else {
                // Same or no timestamp, use profile
                finalAppearance = profileAppearance;
                console.log('🔄 Using profile settings (synchronized)');
              }
              
              initialSaveMode = 'hybrid';
              setLastSynced(profileResult.lastModified || new Date().toISOString());
            } else {
              // No profile settings exist yet
              initialSaveMode = 'hybrid';
              setHasUnsavedChanges(true);
              console.log('📝 No profile settings found, will create from local');
            }
          } catch (err) {
            console.warn('⚠️ Could not load from profile:', err.message);
            initialSaveMode = 'device';
            
            // Only set error if it's not a network issue
            if (!err.message.includes('Network') && !err.message.includes('CORS')) {
              setError('Failed to sync with account. Using local settings.');
            }
          }
        } else {
          console.log('👤 User not authenticated, using device-only mode');
        }

        setAppearance(finalAppearance);
        setSaveMode(initialSaveMode);
        applyAppearanceSettings(finalAppearance);

        // Apply system theme detection if needed
        if (finalAppearance.theme === 'system') {
          applySystemTheme();
        }

        console.log(`✅ Appearance system initialized in ${initialSaveMode} mode`);

      } catch (err) {
        console.error('❌ Error initializing appearance:', err);
        setError('Failed to load appearance settings');
        applyAppearanceSettings(defaultAppearance);
        setSaveMode('device');
      } finally {
        setLoading(false);
      }
    };

    initializeAppearance();
  }, [user, isAuthenticated, token]);

  // Handle authentication state changes
  useEffect(() => {
    if (isAuthenticated() && user && token && saveMode === 'device') {
      console.log('🔄 Upgrading to hybrid mode after login');
      setSaveMode('hybrid');
      setHasUnsavedChanges(true);
    } else if (!isAuthenticated() && saveMode === 'hybrid') {
      console.log('📱 Downgrading to device-only mode after logout');
      setSaveMode('device');
      setLastSynced(null);
      setHasUnsavedChanges(false);
      setSyncStatus('idle');
    }
  }, [user, isAuthenticated, token, saveMode]);

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

  // Auto-save when appearance changes
  useEffect(() => {
    if (!loading) {
      const settingsWithTimestamp = {
        ...appearance,
        lastModified: Date.now()
      };
      
      // Always save to localStorage
      saveToLocalStorage(settingsWithTimestamp);
      
      // Apply visual changes
      applyAppearanceSettings(appearance);
      
      // Auto-save to profile if in hybrid mode
      if ((saveMode === 'hybrid' || saveMode === 'account') && isAuthenticated() && token) {
        setHasUnsavedChanges(true);
        debouncedSaveToProfile(appearance);
      }
    }
  }, [appearance, loading, saveMode, isAuthenticated, token, debouncedSaveToProfile]);

  // Storage functions
  const loadFromLocalStorage = () => {
    if (typeof window === 'undefined') return null;
    
    try {
      const stored = localStorage.getItem('job_tracker_appearance');
      if (stored) {
        const parsed = JSON.parse(stored);
        return validateAppearanceSettings(parsed);
      }
    } catch (err) {
      console.warn('⚠️ Error loading from localStorage:', err);
    }
    return null;
  };

  const saveToLocalStorage = (settings) => {
    if (typeof window === 'undefined') return;
    
    try {
      localStorage.setItem('job_tracker_appearance', JSON.stringify(settings));
    } catch (err) {
      console.warn('⚠️ Error saving to localStorage:', err);
    }
  };

  const loadFromProfile = async () => {
    if (!isAuthenticated() || !token) {
      throw new Error('User not authenticated');
    }

    try {
      console.log('📡 Loading appearance settings from profile...');
      const response = await api.get('/auth/me');
      
      if (response.data?.success && response.data.user?.preferences?.appearance) {
        return {
          success: true,
          data: response.data.user.preferences.appearance,
          lastModified: response.data.user.preferences.lastModified || response.data.user.updatedAt
        };
      }
      
      return { success: false, message: 'No appearance settings found in profile' };
    } catch (error) {
      const errorMessage = handleError(error, 'loading profile settings');
      console.error('❌ Error loading from profile:', errorMessage);
      throw new Error(errorMessage);
    }
  };

  const saveToProfileAPI = async (settings) => {
    if (!isAuthenticated() || !token) {
      throw new Error('User not authenticated');
    }

    try {
      const settingsWithTimestamp = {
        ...settings,
        lastModified: Date.now()
      };
      
      console.log('📡 Saving appearance settings to profile...');
      const response = await api.put('/auth/updateprofile', {
        preferences: {
          appearance: settingsWithTimestamp,
          lastModified: Date.now()
        }
      });
      
      if (!response.data?.success) {
        throw new Error(response.data?.error || 'Failed to save settings');
      }
      
      return { success: true, data: response.data };
    } catch (error) {
      const errorMessage = handleError(error, 'saving profile settings');
      console.error('❌ Error saving to profile:', errorMessage);
      throw new Error(errorMessage);
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
      lastModified: settings.lastModified || Date.now(),
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

  // Public API methods
  const updateSetting = (key, value) => {
    console.log(`🎨 Updating ${key} to ${value}`);
    setAppearance(prev => ({
      ...prev,
      [key]: value
    }));
  };

  const updateStatusColor = (status, color) => {
    console.log(`🎨 Updating status ${status} to ${color}`);
    setAppearance(prev => ({
      ...prev,
      statusColors: {
        ...prev.statusColors,
        [status]: color
      }
    }));
  };

  const resetToDefaults = async () => {
    console.log('🔄 Resetting appearance to defaults');
    setAppearance(defaultAppearance);
    
    if ((saveMode === 'hybrid' || saveMode === 'account') && isAuthenticated() && token) {
      try {
        setSyncStatus('syncing');
        await saveToProfileAPI(defaultAppearance);
        setLastSynced(new Date().toISOString());
        setHasUnsavedChanges(false);
        setSyncStatus('success');
        setTimeout(() => setSyncStatus('idle'), 3000);
      } catch (err) {
        console.warn('⚠️ Failed to sync reset to profile:', err.message);
        setHasUnsavedChanges(true);
        setSyncStatus('error');
        setTimeout(() => setSyncStatus('idle'), 5000);
      }
    }
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

  // Manual sync functions
  const saveToProfile = async () => {
    if (!isAuthenticated() || !token) {
      return { 
        success: false, 
        message: 'Please log in to save settings to your account' 
      };
    }

    try {
      setLoading(true);
      setSyncStatus('syncing');
      
      await saveToProfileAPI(appearance);
      setLastSynced(new Date().toISOString());
      setHasUnsavedChanges(false);
      setSaveMode('hybrid');
      setSyncStatus('success');
      
      setTimeout(() => setSyncStatus('idle'), 3000);
      
      return { 
        success: true, 
        message: 'Settings saved to your account and will sync across devices' 
      };
    } catch (err) {
      setSyncStatus('error');
      setTimeout(() => setSyncStatus('idle'), 5000);
      
      return { 
        success: false, 
        message: err.message || 'Failed to save to account, but saved locally' 
      };
    } finally {
      setLoading(false);
    }
  };

  const syncFromProfile = async () => {
    if (!isAuthenticated() || !token) {
      return { success: false, message: 'Please log in to sync from your account' };
    }

    try {
      setLoading(true);
      setSyncStatus('syncing');
      
      const result = await loadFromProfile();
      
      if (result.success && result.data) {
        const profileAppearance = validateAppearanceSettings(result.data);
        setAppearance(profileAppearance);
        setSaveMode('hybrid');
        saveToLocalStorage({ ...profileAppearance, lastModified: result.lastModified });
        setLastSynced(result.lastModified || new Date().toISOString());
        setHasUnsavedChanges(false);
        setSyncStatus('success');
        
        setTimeout(() => setSyncStatus('idle'), 3000);
        
        return { 
          success: true, 
          message: 'Settings synced from your account' 
        };
      } else {
        setSyncStatus('error');
        setTimeout(() => setSyncStatus('idle'), 5000);
        
        return { 
          success: false, 
          message: 'No saved settings found in your account' 
        };
      }
    } catch (err) {
      setSyncStatus('error');
      setTimeout(() => setSyncStatus('idle'), 5000);
      
      return { 
        success: false, 
        message: err.message || 'Failed to sync from account' 
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
    setSaveMode,
    loading,
    error,
    saveMode,
    lastSynced,
    hasUnsavedChanges,
    autoSaveEnabled,
    setAutoSaveEnabled,
    syncStatus,
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