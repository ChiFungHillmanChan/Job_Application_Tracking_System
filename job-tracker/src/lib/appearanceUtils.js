'use client';

/**
 * Utility functions for managing appearance and theming
 */

// Color scheme definitions
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

/**
 * Apply theme variables to the document root
 * @param {string} colorScheme - The color scheme to apply
 */
export const applyThemeVariables = (colorScheme = 'default') => {
  if (typeof window === 'undefined') return;
  
  const colors = colorSchemes[colorScheme] || colorSchemes.default;
  const root = document.documentElement;
  
  // Apply primary color variables
  Object.entries(colors).forEach(([shade, color]) => {
    root.style.setProperty(`--color-primary-${shade}`, color);
  });
};

/**
 * Apply density classes to the document
 * @param {string} density - The density setting to apply
 */
export const applyDensityClasses = (density = 'default') => {
  if (typeof window === 'undefined') return;
  
  const body = document.body;
  const validDensities = ['compact', 'default', 'comfortable'];
  
  // Remove existing density classes
  validDensities.forEach(d => {
    body.classList.remove(`density-${d}`);
  });
  
  // Add new density class
  if (validDensities.includes(density)) {
    body.classList.add(`density-${density}`);
  }
};

/**
 * Apply font size classes to the document
 * @param {string} fontSize - The font size setting to apply
 */
export const applyFontSizeClasses = (fontSize = 'default') => {
  if (typeof window === 'undefined') return;
  
  const body = document.body;
  const validSizes = ['small', 'default', 'large'];
  
  // Remove existing font size classes
  validSizes.forEach(size => {
    body.classList.remove(`font-${size}`);
  });
  
  // Add new font size class
  if (validSizes.includes(fontSize)) {
    body.classList.add(`font-${fontSize}`);
  }
};

/**
 * Get status color classes based on status and current theme
 * @param {string} status - The job application status
 * @param {string} colorName - The color name to use
 * @returns {Object} Color classes for the status
 */
export const getStatusColorClasses = (status, colorName = 'gray') => {
  return {
    bg: `bg-${colorName}-100`,
    text: `text-${colorName}-800`,
    border: `border-${colorName}-200`,
    darkBg: `dark:bg-${colorName}-900`,
    darkText: `dark:text-${colorName}-300`,
    darkBorder: `dark:border-${colorName}-800`,
    hover: `hover:bg-${colorName}-200`,
    darkHover: `dark:hover:bg-${colorName}-800`,
  };
};

/**
 * Generate a complete status badge class string
 * @param {string} status - The job application status
 * @param {string} colorName - The color name to use
 * @param {Object} options - Options for customization
 * @returns {string} Complete class string for status badge
 */
export const generateStatusBadgeClasses = (status, colorName = 'gray', options = {}) => {
  const {
    size = 'default', // 'small', 'default', 'large'
    variant = 'filled', // 'filled', 'outlined', 'soft'
  } = options;
  
  const colors = getStatusColorClasses(status, colorName);
  
  // Base classes
  let classes = 'inline-flex items-center font-medium rounded-full transition-colors duration-200';
  
  // Size variants
  switch (size) {
    case 'small':
      classes += ' px-2 py-0.5 text-xs';
      break;
    case 'large':
      classes += ' px-3 py-1 text-sm';
      break;
    default:
      classes += ' px-2.5 py-0.5 text-xs';
  }
  
  // Style variants
  switch (variant) {
    case 'outlined':
      classes += ` border-2 ${colors.border} ${colors.text} ${colors.darkBorder} ${colors.darkText} bg-transparent`;
      break;
    case 'soft':
      classes += ` ${colors.bg} ${colors.text} ${colors.darkBg} ${colors.darkText} bg-opacity-50`;
      break;
    default: // filled
      classes += ` ${colors.bg} ${colors.text} ${colors.darkBg} ${colors.darkText}`;
  }
  
  return classes;
};

/**
 * Get available color options for status customization
 * @returns {Array} Array of color options
 */
export const getStatusColorOptions = () => {
  return [
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
};

/**
 * Validate appearance settings object
 * @param {Object} settings - Appearance settings to validate
 * @returns {Object} Validated settings
 */
export const validateAppearanceSettings = (settings) => {
  const validThemes = ['light', 'dark', 'system'];
  const validColorSchemes = Object.keys(colorSchemes);
  const validDensities = ['compact', 'default', 'comfortable'];
  const validFontSizes = ['small', 'default', 'large'];

  return {
    theme: validThemes.includes(settings?.theme) ? settings.theme : 'system',
    colorScheme: validColorSchemes.includes(settings?.colorScheme) ? settings.colorScheme : 'default',
    density: validDensities.includes(settings?.density) ? settings.density : 'default',
    fontSize: validFontSizes.includes(settings?.fontSize) ? settings.fontSize : 'default',
    statusColors: typeof settings?.statusColors === 'object' ? settings.statusColors : {},
  };
};

/**
 * Get the system's preferred color scheme
 * @returns {string} 'light' or 'dark'
 */
export const getSystemTheme = () => {
  if (typeof window !== 'undefined') {
    return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  }
  return 'light';
};

/**
 * Create a debounced function
 * @param {Function} func - Function to debounce
 * @param {number} wait - Wait time in milliseconds
 * @returns {Function} Debounced function
 */
export const debounce = (func, wait) => {
  let timeout;
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
};

/**
 * Apply all appearance settings at once
 * @param {Object} settings - Complete appearance settings object
 */
export const applyAllAppearanceSettings = (settings) => {
  if (typeof window === 'undefined') return;
  
  const validatedSettings = validateAppearanceSettings(settings);
  
  // Apply theme variables
  applyThemeVariables(validatedSettings.colorScheme);
  
  // Apply density classes
  applyDensityClasses(validatedSettings.density);
  
  // Apply font size classes
  applyFontSizeClasses(validatedSettings.fontSize);
  
  // Apply theme mode
  applyThemeMode(validatedSettings.theme);
};

/**
 * Apply theme mode (light/dark/system)
 * @param {string} theme - Theme mode to apply
 */
export const applyThemeMode = (theme) => {
  if (typeof window === 'undefined') return;
  
  const html = document.documentElement;
  
  if (theme === 'dark') {
    html.classList.add('dark');
  } else if (theme === 'light') {
    html.classList.remove('dark');
  } else if (theme === 'system') {
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    html.classList.toggle('dark', prefersDark);
  }
};