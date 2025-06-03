'use client';
// Apply theme mode (light, dark, system)
export const applyThemeMode = (mode) => {
  if (typeof window === 'undefined') return;
  
  if (mode === 'dark') {
    document.documentElement.classList.add('dark');
  } else if (mode === 'light') {
    document.documentElement.classList.remove('dark');
  } else if (mode === 'system') {
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    document.documentElement.classList.toggle('dark', prefersDark);
  }
};

// Get color scheme values by name
export const colorSchemes = {
  default: {
    50: '#f0f9ff',
    100: '#e0f2fe',
    200: '#bae6fd',
    300: '#7dd3fc',
    400: '#38bdf8',
    500: '#0ea5e9',
    600: '#0284c7',
    700: '#0369a1',
    800: '#075985',
    900: '#0c4a6e',
  },
  green: {
    50: '#f0fdf4',
    100: '#dcfce7',
    200: '#bbf7d0',
    300: '#86efac',
    400: '#4ade80',
    500: '#22c55e',
    600: '#16a34a',
    700: '#15803d',
    800: '#166534',
    900: '#14532d',
  },
  purple: {
    50: '#faf5ff',
    100: '#f3e8ff',
    200: '#e9d5ff',
    300: '#d8b4fe',
    400: '#c084fc',
    500: '#a855f7',
    600: '#9333ea',
    700: '#7c3aed',
    800: '#6b21a8',
    900: '#581c87',
  },
  red: {
    50: '#fef2f2',
    100: '#fee2e2',
    200: '#fecaca',
    300: '#fca5a5',
    400: '#f87171',
    500: '#ef4444',
    600: '#dc2626',
    700: '#b91c1c',
    800: '#991b1b',
    900: '#7f1d1d',
  },
  orange: {
    50: '#fff7ed',
    100: '#ffedd5',
    200: '#fed7aa',
    300: '#fdba74',
    400: '#fb923c',
    500: '#f97316',
    600: '#ea580c',
    700: '#c2410c',
    800: '#9a3412',
    900: '#7c2d12',
  },
};

export const getColorScheme = (scheme) => {
  return colorSchemes[scheme] || colorSchemes.default;
};

// Apply color scheme to CSS variables
export const applyColorScheme = (scheme) => {
  if (typeof window === 'undefined') return;
  
  const colors = getColorScheme(scheme);
  Object.entries(colors).forEach(([key, value]) => {
    document.documentElement.style.setProperty(`--color-primary-${key}`, value);
  });
};

// Apply layout density
export const applyDensity = (density) => {
  if (typeof window === 'undefined') return;
  
  document.documentElement.classList.remove('density-compact', 'density-default', 'density-comfortable');
  document.documentElement.classList.add(`density-${density}`);
};

// Apply font size
export const applyFontSize = (size) => {
  if (typeof window === 'undefined') return;
  
  document.documentElement.classList.remove('font-small', 'font-default', 'font-large');
  document.documentElement.classList.add(`font-${size}`);
};

// Get CSS class for status color
export const getStatusColorClass = (status, statusColors = {}) => {
  const defaultColors = {
    'Saved': 'blue',
    'Applied': 'purple',
    'Phone Screen': 'yellow',
    'Interview': 'yellow',
    'Technical Assessment': 'yellow',
    'Offer': 'green',
    'Rejected': 'red',
    'Withdrawn': 'red',
  };
  
  const colorMap = {
    blue: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300',
    purple: 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-300',
    yellow: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300',
    green: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300',
    red: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300',
    orange: 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-300',
    gray: 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300',
  };
  
  const color = statusColors[status] || defaultColors[status] || 'gray';
  return colorMap[color];
};

// Initialize theme from local storage
export const initializeTheme = () => {
  if (typeof window === 'undefined') return null;
  
  try {
    const storedTheme = localStorage.getItem('job_tracker_theme');
    if (storedTheme) {
      return JSON.parse(storedTheme);
    }
    
    // Default theme
    return {
      mode: 'system',
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
      }
    };
  } catch (error) {
    console.error('Error initializing theme:', error);
    return null;
  }
};

// Save theme to local storage
export const saveThemeToLocalStorage = (theme) => {
  if (typeof window === 'undefined') return false;
  
  try {
    localStorage.setItem('job_tracker_theme', JSON.stringify(theme));
    return true;
  } catch (error) {
    console.error('Error saving theme to localStorage:', error);
    return false;
  }
};