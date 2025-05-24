/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/app/**/*.{js,ts,jsx,tsx}",
    "./src/components/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        // Dynamic primary colors using CSS custom properties
        primary: {
          50: 'var(--color-primary-50)',
          100: 'var(--color-primary-100)',
          200: 'var(--color-primary-200)',
          300: 'var(--color-primary-300)',
          400: 'var(--color-primary-400)',
          500: 'var(--color-primary-500)',
          600: 'var(--color-primary-600)',
          700: 'var(--color-primary-700)',
          800: 'var(--color-primary-800)',
          900: 'var(--color-primary-900)',
        },
        // Keep the original static colors for fallback
        'primary-static': {
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
        // Additional color schemes for variety
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
      },
      spacing: {
        // Dynamic spacing using CSS custom properties
        'current': 'var(--current-spacing)',
        'current-padding': 'var(--current-padding)',
        'current-gap': 'var(--current-gap)',
      },
      fontSize: {
        // Dynamic font sizes
        'current': ['var(--current-font-size)', 'var(--current-line-height)'],
      },
      animation: {
        'fade-in': 'fadeIn 0.2s ease-in-out',
        'slide-in': 'slideIn 0.3s ease-out',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideIn: {
          '0%': { transform: 'translateY(-10px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
      },
      transitionProperty: {
        'colors': 'background-color, border-color, color, fill, stroke, text-decoration-color',
        'spacing': 'margin, padding, gap',
      },
      backdropBlur: {
        xs: '2px',
      },
    },
  },
  plugins: [
    // Custom plugin to generate all color combinations for dynamic primary colors
    function({ addUtilities, theme }) {
      const colors = theme('colors');
      const colorSchemes = ['blue', 'green', 'purple', 'red', 'orange'];
      const shades = [50, 100, 200, 300, 400, 500, 600, 700, 800, 900];
      
      const utilities = {};
      
      // Generate utilities for each color scheme
      colorSchemes.forEach(scheme => {
        shades.forEach(shade => {
          if (colors[scheme] && colors[scheme][shade]) {
            // Background utilities
            utilities[`.bg-${scheme}-${shade}`] = {
              backgroundColor: colors[scheme][shade]
            };
            
            // Text utilities
            utilities[`.text-${scheme}-${shade}`] = {
              color: colors[scheme][shade]
            };
            
            // Border utilities
            utilities[`.border-${scheme}-${shade}`] = {
              borderColor: colors[scheme][shade]
            };
            
            // Ring utilities
            utilities[`.ring-${scheme}-${shade}`] = {
              '--tw-ring-color': colors[scheme][shade]
            };
          }
        });
      });
      
      addUtilities(utilities);
    },
    
    // Plugin for density-based utilities
    function({ addUtilities }) {
      addUtilities({
        '.density-compact': {
          '--current-spacing': '0.5rem',
          '--current-padding': '0.375rem',
          '--current-gap': '0.5rem',
        },
        '.density-default': {
          '--current-spacing': '1rem',
          '--current-padding': '0.5rem',
          '--current-gap': '1rem',
        },
        '.density-comfortable': {
          '--current-spacing': '1.5rem',
          '--current-padding': '0.75rem',
          '--current-gap': '1.5rem',
        },
      });
    },
    
    // Plugin for font size utilities
    function({ addUtilities }) {
      addUtilities({
        '.font-size-small': {
          '--current-font-size': '0.875rem',
          '--current-line-height': '1.25rem',
        },
        '.font-size-default': {
          '--current-font-size': '1rem',
          '--current-line-height': '1.5rem',
        },
        '.font-size-large': {
          '--current-font-size': '1.125rem',
          '--current-line-height': '1.75rem',
        },
      });
    },
    
    // Plugin for component spacing utilities
    function({ addUtilities }) {
      addUtilities({
        '.space-current > :not([hidden]) ~ :not([hidden])': {
          marginTop: 'var(--current-spacing)',
        },
        '.gap-current': {
          gap: 'var(--current-gap)',
        },
        '.p-current': {
          padding: 'var(--current-padding)',
        },
        '.px-current': {
          paddingLeft: 'var(--current-padding)',
          paddingRight: 'var(--current-padding)',
        },
        '.py-current': {
          paddingTop: 'var(--current-padding)',
          paddingBottom: 'var(--current-padding)',
        },
        '.m-current': {
          margin: 'var(--current-spacing)',
        },
        '.mx-current': {
          marginLeft: 'var(--current-spacing)',
          marginRight: 'var(--current-spacing)',
        },
        '.my-current': {
          marginTop: 'var(--current-spacing)',
          marginBottom: 'var(--current-spacing)',
        },
      });
    },
  ],
  // Safelist important classes to ensure they're always available
  safelist: [
    // Primary color variations
    {
      pattern: /^(bg|text|border|ring)-(blue|green|purple|red|orange)-(50|100|200|300|400|500|600|700|800|900)$/,
    },
    // Dark mode variants
    {
      pattern: /^dark:(bg|text|border|ring)-(blue|green|purple|red|orange)-(50|100|200|300|400|500|600|700|800|900)$/,
    },
    // Density classes
    'density-compact',
    'density-default', 
    'density-comfortable',
    // Font size classes
    'font-small',
    'font-default',
    'font-large',
    // Dynamic spacing classes
    'gap-current',
    'p-current',
    'px-current',
    'py-current',
    'm-current',
    'mx-current',
    'my-current',
    'space-current',
  ],
};