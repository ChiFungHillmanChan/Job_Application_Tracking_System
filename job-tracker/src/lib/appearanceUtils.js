'use client';

import { colorSchemes } from "./themeUtils";

export const applyThemeVariables = (colorScheme = 'default') => {
  if (typeof window === 'undefined') return;
  
  const colors = colorSchemes[colorScheme] || colorSchemes.default;
  const root = document.documentElement;
  
  Object.entries(colors).forEach(([shade, color]) => {
    root.style.setProperty(`--color-primary-${shade}`, color);
  });
};

export const applyDensityClasses = (density = 'default') => {
  if (typeof window === 'undefined') return;
  
  const body = document.body;
  const validDensities = ['compact', 'default', 'comfortable'];
  
  validDensities.forEach(d => {
    body.classList.remove(`density-${d}`);
  });
  
  if (validDensities.includes(density)) {
    body.classList.add(`density-${density}`);
  }
};

export const applyFontSizeClasses = (fontSize = 'default') => {
  if (typeof window === 'undefined') return;
  
  const body = document.body;
  const validSizes = ['small', 'default', 'large'];
  
  validSizes.forEach(size => {
    body.classList.remove(`font-${size}`);
  });
  
  if (validSizes.includes(fontSize)) {
    body.classList.add(`font-${fontSize}`);
  }
};

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

export const generateStatusBadgeClasses = (status, colorName = 'gray', options = {}) => {
  const {
    size = 'default', 
    variant = 'filled', 
  } = options;
  
  const colors = getStatusColorClasses(status, colorName);
  
  let classes = 'inline-flex items-center font-medium rounded-full transition-colors duration-200';
  
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

export const getSystemTheme = () => {
  if (typeof window !== 'undefined') {
    return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  }
  return 'light';
};

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


export const applyAllAppearanceSettings = (settings) => {
  if (typeof window === 'undefined') return;
  
  const validatedSettings = validateAppearanceSettings(settings);
  
  applyThemeVariables(validatedSettings.colorScheme);
  
  applyDensityClasses(validatedSettings.density);
  
  applyFontSizeClasses(validatedSettings.fontSize);
  
  applyThemeMode(validatedSettings.theme);
};


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