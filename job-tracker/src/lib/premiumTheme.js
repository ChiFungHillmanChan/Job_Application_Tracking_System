// src/lib/premiumThemes.js - Premium theme templates and management

/**
 * Premium theme templates with complete styling configurations
 */
export const PREMIUM_THEME_TEMPLATES = {
  'ocean-breeze': {
    id: 'ocean-breeze',
    name: 'Ocean Breeze',
    description: 'Calming blue tones inspired by ocean depths',
    category: 'nature',
    isPremium: true,
    preview: '/themes/ocean-breeze-preview.jpg',
    author: 'JobTracker Team',
    downloads: 1250,
    rating: 4.8,
    tags: ['blue', 'calm', 'professional', 'nature'],
    config: {
      theme: 'light',
      colorScheme: 'custom',
      density: 'comfortable',
      fontSize: 'default',
      customColors: {
        primary: {
          50: '#f0f9ff',
          100: '#e0f2fe',
          200: '#bae6fd',
          300: '#7dd3fc',
          400: '#38bdf8',
          500: '#0ea5e9',
          600: '#0284c7',
          700: '#0369a1',
          800: '#075985',
          900: '#0c4a6e'
        }
      },
      typography: {
        fontFamily: 'Inter',
        headingFont: 'Inter',
        bodyFont: 'Inter',
        codeFont: 'Fira Code'
      },
      effects: {
        borderRadius: '12px',
        shadowIntensity: 'medium',
        animationSpeed: '200ms'
      },
      statusColors: {
        'Saved': 'blue',
        'Applied': 'cyan',
        'Phone Screen': 'teal',
        'Interview': 'green',
        'Technical Assessment': 'yellow',
        'Offer': 'emerald',
        'Rejected': 'red',
        'Withdrawn': 'gray'
      }
    }
  },

  'midnight-professional': {
    id: 'midnight-professional',
    name: 'Midnight Professional',
    description: 'Sophisticated dark theme for professional environments',
    category: 'professional',
    isPremium: true,
    preview: '/themes/midnight-professional-preview.jpg',
    author: 'Design Studio',
    downloads: 2100,
    rating: 4.9,
    tags: ['dark', 'professional', 'elegant', 'modern'],
    config: {
      theme: 'dark',
      colorScheme: 'custom',
      density: 'default',
      fontSize: 'default',
      customColors: {
        primary: {
          50: '#f8fafc',
          100: '#f1f5f9',
          200: '#e2e8f0',
          300: '#cbd5e1',
          400: '#94a3b8',
          500: '#64748b',
          600: '#475569',
          700: '#334155',
          800: '#1e293b',
          900: '#0f172a'
        }
      },
      typography: {
        fontFamily: 'Source Sans Pro',
        headingFont: 'Montserrat',
        bodyFont: 'Source Sans Pro',
        codeFont: 'Source Code Pro'
      },
      effects: {
        borderRadius: '8px',
        shadowIntensity: 'high',
        animationSpeed: '150ms',
        glassEffect: true
      },
      statusColors: {
        'Saved': 'slate',
        'Applied': 'blue',
        'Phone Screen': 'purple',
        'Interview': 'indigo',
        'Technical Assessment': 'amber',
        'Offer': 'green',
        'Rejected': 'red',
        'Withdrawn': 'gray'
      }
    }
  },

  'forest-harmony': {
    id: 'forest-harmony',
    name: 'Forest Harmony',
    description: 'Earth tones and greens for a natural, calming experience',
    category: 'nature',
    isPremium: true,
    preview: '/themes/forest-harmony-preview.jpg',
    author: 'Nature Designs',
    downloads: 890,
    rating: 4.7,
    tags: ['green', 'nature', 'calming', 'organic'],
    config: {
      theme: 'light',
      colorScheme: 'custom',
      density: 'comfortable',
      fontSize: 'default',
      customColors: {
        primary: {
          50: '#f0fdf4',
          100: '#dcfce7',
          200: '#bbf7d0',
          300: '#86efac',
          400: '#4ade80',
          500: '#22c55e',
          600: '#16a34a',
          700: '#15803d',
          800: '#166534',
          900: '#14532d'
        }
      },
      typography: {
        fontFamily: 'Nunito',
        headingFont: 'Nunito',
        bodyFont: 'Open Sans',
        codeFont: 'JetBrains Mono'
      },
      effects: {
        borderRadius: '16px',
        shadowIntensity: 'soft',
        animationSpeed: '300ms',
        gradientAccents: true
      },
      statusColors: {
        'Saved': 'emerald',
        'Applied': 'green',
        'Phone Screen': 'teal',
        'Interview': 'lime',
        'Technical Assessment': 'yellow',
        'Offer': 'green',
        'Rejected': 'red',
        'Withdrawn': 'stone'
      }
    }
  },

  'sunset-creative': {
    id: 'sunset-creative',
    name: 'Sunset Creative',
    description: 'Vibrant oranges and purples for creative professionals',
    category: 'creative',
    isPremium: true,
    preview: '/themes/sunset-creative-preview.jpg',
    author: 'Creative Collective',
    downloads: 1560,
    rating: 4.6,
    tags: ['vibrant', 'creative', 'energetic', 'colorful'],
    config: {
      theme: 'light',
      colorScheme: 'custom',
      density: 'compact',
      fontSize: 'large',
      customColors: {
        primary: {
          50: '#fff7ed',
          100: '#ffedd5',
          200: '#fed7aa',
          300: '#fdba74',
          400: '#fb923c',
          500: '#f97316',
          600: '#ea580c',
          700: '#c2410c',
          800: '#9a3412',
          900: '#7c2d12'
        }
      },
      typography: {
        fontFamily: 'Poppins',
        headingFont: 'Oswald',
        bodyFont: 'Poppins',
        codeFont: 'Fira Code'
      },
      effects: {
        borderRadius: '20px',
        shadowIntensity: 'high',
        animationSpeed: '250ms',
        gradientAccents: true,
        boldContrasts: true
      },
      statusColors: {
        'Saved': 'orange',
        'Applied': 'amber',
        'Phone Screen': 'yellow',
        'Interview': 'red',
        'Technical Assessment': 'pink',
        'Offer': 'emerald',
        'Rejected': 'red',
        'Withdrawn': 'gray'
      }
    }
  },

  'minimalist-zen': {
    id: 'minimalist-zen',
    name: 'Minimalist Zen',
    description: 'Clean, minimal design focusing on content',
    category: 'minimal',
    isPremium: true,
    preview: '/themes/minimalist-zen-preview.jpg',
    author: 'Zen Studios',
    downloads: 2850,
    rating: 4.9,
    tags: ['minimal', 'clean', 'focus', 'zen'],
    config: {
      theme: 'light',
      colorScheme: 'custom',
      density: 'comfortable',
      fontSize: 'default',
      customColors: {
        primary: {
          50: '#fafafa',
          100: '#f4f4f5',
          200: '#e4e4e7',
          300: '#d4d4d8',
          400: '#a1a1aa',
          500: '#71717a',
          600: '#52525b',
          700: '#3f3f46',
          800: '#27272a',
          900: '#18181b'
        }
      },
      typography: {
        fontFamily: 'Inter',
        headingFont: 'Inter',
        bodyFont: 'Inter',
        codeFont: 'JetBrains Mono'
      },
      effects: {
        borderRadius: '4px',
        shadowIntensity: 'minimal',
        animationSpeed: '100ms',
        cleanLines: true
      },
      statusColors: {
        'Saved': 'zinc',
        'Applied': 'slate',
        'Phone Screen': 'gray',
        'Interview': 'neutral',
        'Technical Assessment': 'stone',
        'Offer': 'green',
        'Rejected': 'red',
        'Withdrawn': 'gray'
      }
    }
  },

  'corporate-blue': {
    id: 'corporate-blue',
    name: 'Corporate Blue',
    description: 'Professional blue theme for enterprise environments',
    category: 'professional',
    isPremium: false,
    preview: '/themes/corporate-blue-preview.jpg',
    author: 'JobTracker Team',
    downloads: 5200,
    rating: 4.5,
    tags: ['corporate', 'professional', 'blue', 'enterprise'],
    config: {
      theme: 'light',
      colorScheme: 'default',
      density: 'default',
      fontSize: 'default',
      typography: {
        fontFamily: 'Roboto',
        headingFont: 'Roboto',
        bodyFont: 'Roboto',
        codeFont: 'Source Code Pro'
      },
      effects: {
        borderRadius: '6px',
        shadowIntensity: 'medium',
        animationSpeed: '200ms'
      },
      statusColors: {
        'Saved': 'blue',
        'Applied': 'indigo',
        'Phone Screen': 'purple',
        'Interview': 'violet',
        'Technical Assessment': 'amber',
        'Offer': 'green',
        'Rejected': 'red',
        'Withdrawn': 'gray'
      }
    }
  }
};

/**
 * Theme categories for organization
 */
export const THEME_CATEGORIES = {
  all: { name: 'All Themes', icon: '🎨' },
  professional: { name: 'Professional', icon: '💼' },
  creative: { name: 'Creative', icon: '🌈' },
  nature: { name: 'Nature', icon: '🌿' },
  minimal: { name: 'Minimal', icon: '⚪' },
  dark: { name: 'Dark Mode', icon: '🌙' },
  trending: { name: 'Trending', icon: '🔥' }
};

/**
 * Premium theme management class
 */
export class PremiumThemeManager {
  constructor() {
    this.customThemes = new Map();
    this.favoriteThemes = new Set();
    this.installedThemes = new Set();
    this.recentThemes = [];
  }

  /**
   * Get all available themes
   * @param {string} category - Filter by category
   * @param {boolean} premiumOnly - Show only premium themes
   */
  getThemes(category = 'all', premiumOnly = false) {
    let themes = Object.values(PREMIUM_THEME_TEMPLATES);
    
    // Add custom themes
    themes = [...themes, ...Array.from(this.customThemes.values())];
    
    if (category !== 'all') {
      if (category === 'trending') {
        themes = themes.sort((a, b) => b.downloads - a.downloads).slice(0, 6);
      } else if (category === 'dark') {
        themes = themes.filter(theme => theme.config.theme === 'dark');
      } else {
        themes = themes.filter(theme => theme.category === category);
      }
    }
    
    if (premiumOnly) {
      themes = themes.filter(theme => theme.isPremium);
    }
    
    return themes.sort((a, b) => b.rating - a.rating);
  }

  /**
   * Get theme by ID
   * @param {string} themeId - Theme identifier
   */
  getTheme(themeId) {
    return PREMIUM_THEME_TEMPLATES[themeId] || this.customThemes.get(themeId);
  }

  /**
   * Create custom theme
   * @param {Object} themeData - Theme configuration
   */
  createCustomTheme(themeData) {
    const customTheme = {
      id: `custom-${Date.now()}`,
      name: themeData.name || 'Custom Theme',
      description: themeData.description || 'User created theme',
      category: 'custom',
      isPremium: false,
      isCustom: true,
      author: 'You',
      downloads: 0,
      rating: 0,
      tags: ['custom'],
      createdAt: new Date().toISOString(),
      config: {
        ...themeData.config,
        version: '1.0.0'
      }
    };
    
    this.customThemes.set(customTheme.id, customTheme);
    return customTheme;
  }

  /**
   * Export theme configuration
   * @param {string} themeId - Theme identifier
   */
  exportTheme(themeId) {
    const theme = this.getTheme(themeId);
    if (!theme) return null;
    
    const exportData = {
      name: theme.name,
      description: theme.description,
      author: theme.author,
      version: theme.config.version || '1.0.0',
      exportedAt: new Date().toISOString(),
      config: theme.config
    };
    
    return JSON.stringify(exportData, null, 2);
  }

  /**
   * Import theme from JSON
   * @param {string} themeJson - JSON theme data
   */
  importTheme(themeJson) {
    try {
      const themeData = JSON.parse(themeJson);
      
      if (!themeData.config || !themeData.name) {
        throw new Error('Invalid theme format');
      }
      
      return this.createCustomTheme({
        name: themeData.name,
        description: themeData.description,
        config: themeData.config
      });
    } catch (error) {
      throw new Error(`Failed to import theme: ${error.message}`);
    }
  }

  /**
   * Apply theme to application
   * @param {string} themeId - Theme identifier
   */
  applyTheme(themeId) {
    const theme = this.getTheme(themeId);
    if (!theme) return false;
    
    const { config } = theme;
    
    // Apply basic theme settings
    if (config.theme) {
      document.documentElement.classList.toggle('dark', config.theme === 'dark');
    }
    
    // Apply custom colors if available
    if (config.customColors?.primary) {
      this.applyCustomColors(config.customColors.primary);
    }
    
    // Apply typography
    if (config.typography) {
      this.applyTypography(config.typography);
    }
    
    // Apply visual effects
    if (config.effects) {
      this.applyEffects(config.effects);
    }
    
    // Mark theme as installed
    this.installedThemes.add(themeId);
    this.addToRecent(themeId);
    
    return true;
  }

  /**
   * Apply custom colors to CSS variables
   * @param {Object} colors - Color palette object
   */
  applyCustomColors(colors) {
    const root = document.documentElement;
    
    Object.entries(colors).forEach(([shade, color]) => {
      root.style.setProperty(`--color-primary-${shade}`, color);
    });
  }

  /**
   * Apply typography settings
   * @param {Object} typography - Typography configuration
   */
  applyTypography(typography) {
    const root = document.documentElement;
    
    if (typography.fontFamily) {
      root.style.setProperty('--font-family-primary', `"${typography.fontFamily}", sans-serif`);
    }
    
    if (typography.headingFont) {
      root.style.setProperty('--font-family-heading', `"${typography.headingFont}", sans-serif`);
    }
    
    if (typography.bodyFont) {
      root.style.setProperty('--font-family-body', `"${typography.bodyFont}", sans-serif`);
    }
    
    if (typography.codeFont) {
      root.style.setProperty('--font-family-mono', `"${typography.codeFont}", monospace`);
    }
  }

  /**
   * Apply visual effects
   * @param {Object} effects - Effects configuration
   */
  applyEffects(effects) {
    const root = document.documentElement;
    
    if (effects.borderRadius) {
      root.style.setProperty('--border-radius-base', effects.borderRadius);
    }
    
    if (effects.shadowIntensity) {
      const shadows = {
        minimal: '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
        soft: '0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px 0 rgba(0, 0, 0, 0.06)',
        medium: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
        high: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)'
      };
      root.style.setProperty('--shadow-base', shadows[effects.shadowIntensity] || shadows.medium);
    }
    
    if (effects.animationSpeed) {
      root.style.setProperty('--animation-speed', effects.animationSpeed);
    }
    
    // Apply effect classes
    const body = document.body;
    const effectClasses = ['glass-effect', 'gradient-accents', 'clean-lines'];
    effectClasses.forEach(className => body.classList.remove(className));
    
    if (effects.glassEffect) body.classList.add('glass-effect');
    if (effects.gradientAccents) body.classList.add('gradient-accents');
    if (effects.cleanLines) body.classList.add('clean-lines');
  }

  /**
   * Toggle favorite theme
   * @param {string} themeId - Theme identifier
   */
  toggleFavorite(themeId) {
    if (this.favoriteThemes.has(themeId)) {
      this.favoriteThemes.delete(themeId);
      return false;
    } else {
      this.favoriteThemes.add(themeId);
      return true;
    }
  }

  /**
   * Get favorite themes
   */
  getFavoriteThemes() {
    return Array.from(this.favoriteThemes)
      .map(id => this.getTheme(id))
      .filter(Boolean);
  }

  /**
   * Add theme to recent list
   * @param {string} themeId - Theme identifier
   */
  addToRecent(themeId) {
    this.recentThemes = this.recentThemes.filter(id => id !== themeId);
    this.recentThemes.unshift(themeId);
    this.recentThemes = this.recentThemes.slice(0, 10);
  }

  /**
   * Get recent themes
   */
  getRecentThemes() {
    return this.recentThemes
      .map(id => this.getTheme(id))
      .filter(Boolean);
  }

  /**
   * Search themes
   * @param {string} query - Search query
   */
  searchThemes(query) {
    const allThemes = [
      ...Object.values(PREMIUM_THEME_TEMPLATES),
      ...Array.from(this.customThemes.values())
    ];
    
    if (!query) return allThemes;
    
    const searchTerms = query.toLowerCase().split(' ');
    
    return allThemes.filter(theme => {
      const searchableText = `${theme.name} ${theme.description} ${theme.category} ${theme.author} ${(theme.tags || []).join(' ')}`.toLowerCase();
      return searchTerms.every(term => searchableText.includes(term));
    });
  }

  /**
   * Get theme compatibility score
   * @param {string} themeId - Theme identifier
   * @param {Object} userPreferences - User's current preferences
   */
  getCompatibilityScore(themeId, userPreferences) {
    const theme = this.getTheme(themeId);
    if (!theme) return 0;
    
    let score = 0;
    let maxScore = 0;
    
    // Check theme mode compatibility
    maxScore += 20;
    if (theme.config.theme === userPreferences.theme) {
      score += 20;
    } else if (userPreferences.theme === 'system') {
      score += 10;
    }
    
    // Check density compatibility
    maxScore += 15;
    if (theme.config.density === userPreferences.density) {
      score += 15;
    }
    
    // Check font size compatibility
    maxScore += 10;
    if (theme.config.fontSize === userPreferences.fontSize) {
      score += 10;
    }
    
    // Check color scheme compatibility
    maxScore += 25;
    if (theme.config.colorScheme === userPreferences.colorScheme) {
      score += 25;
    }
    
    // Check status colors compatibility
    maxScore += 30;
    if (theme.config.statusColors && userPreferences.statusColors) {
      const matchingColors = Object.keys(theme.config.statusColors).filter(
        status => theme.config.statusColors[status] === userPreferences.statusColors[status]
      ).length;
      score += (matchingColors / Object.keys(theme.config.statusColors).length) * 30;
    }
    
    return Math.round((score / maxScore) * 100);
  }

  /**
   * Get theme recommendations
   * @param {Object} userPreferences - User's current preferences
   * @param {number} limit - Maximum number of recommendations
   */
  getRecommendations(userPreferences, limit = 5) {
    const allThemes = Object.values(PREMIUM_THEME_TEMPLATES);
    
    const scoredThemes = allThemes.map(theme => ({
      ...theme,
      compatibilityScore: this.getCompatibilityScore(theme.id, userPreferences)
    }));
    
    return scoredThemes
      .sort((a, b) => {
        if (b.compatibilityScore !== a.compatibilityScore) {
          return b.compatibilityScore - a.compatibilityScore;
        }
        return b.rating - a.rating;
      })
      .slice(0, limit);
  }

  /**
   * Validate theme configuration
   * @param {Object} config - Theme configuration to validate
   */
  validateThemeConfig(config) {
    const errors = [];
    const warnings = [];
    
    // Required fields
    if (!config.theme) {
      errors.push('Theme mode (light/dark) is required');
    }
    
    if (!config.colorScheme) {
      errors.push('Color scheme is required');
    }
    
    // Validate custom colors if present
    if (config.customColors?.primary) {
      const requiredShades = ['50', '100', '200', '300', '400', '500', '600', '700', '800', '900'];
      const missingShades = requiredShades.filter(shade => !config.customColors.primary[shade]);
      
      if (missingShades.length > 0) {
        warnings.push(`Missing color shades: ${missingShades.join(', ')}`);
      }
      
      Object.entries(config.customColors.primary).forEach(([shade, color]) => {
        if (!/^#[0-9A-F]{6}$/i.test(color)) {
          errors.push(`Invalid color format for shade ${shade}: ${color}`);
        }
      });
    }
    
    return {
      isValid: errors.length === 0,
      errors,
      warnings
    };
  }

  /**
   * Get theme analytics
   */
  getAnalytics() {
    const themes = Object.values(PREMIUM_THEME_TEMPLATES);
    
    return {
      totalThemes: themes.length,
      premiumThemes: themes.filter(t => t.isPremium).length,
      freeThemes: themes.filter(t => !t.isPremium).length,
      customThemes: this.customThemes.size,
      favoriteThemes: this.favoriteThemes.size,
      installedThemes: this.installedThemes.size,
      averageRating: themes.reduce((sum, t) => sum + t.rating, 0) / themes.length,
      totalDownloads: themes.reduce((sum, t) => sum + t.downloads, 0),
      mostPopular: themes.reduce((prev, current) => 
        prev.downloads > current.downloads ? prev : current
      )
    };
  }

  /**
   * Export user theme data
   */
  exportUserData() {
    return {
      customThemes: Array.from(this.customThemes.entries()),
      favoriteThemes: Array.from(this.favoriteThemes),
      installedThemes: Array.from(this.installedThemes),
      recentThemes: this.recentThemes,
      exportedAt: new Date().toISOString()
    };
  }

  /**
   * Import user theme data
   * @param {Object} data - User theme data
   */
  importUserData(data) {
    if (data.customThemes) {
      this.customThemes = new Map(data.customThemes);
    }
    
    if (data.favoriteThemes) {
      this.favoriteThemes = new Set(data.favoriteThemes);
    }
    
    if (data.installedThemes) {
      this.installedThemes = new Set(data.installedThemes);
    }
    
    if (data.recentThemes) {
      this.recentThemes = data.recentThemes;
    }
  }
}

/**
 * Theme utility functions
 */
export const ThemeUtils = {
  /**
   * Generate color palette from a single color
   * @param {string} baseColor - Base color in hex format
   */
  generateColorPalette(baseColor) {
    const hex = baseColor.replace('#', '');
    const r = parseInt(hex.substr(0, 2), 16);
    const g = parseInt(hex.substr(2, 2), 16);
    const b = parseInt(hex.substr(4, 2), 16);
    
    const palette = {};
    const steps = [50, 100, 200, 300, 400, 500, 600, 700, 800, 900];
    
    steps.forEach((step, index) => {
      const factor = (index - 5) * 0.1;
      const newR = Math.max(0, Math.min(255, r + (255 - r) * Math.max(0, -factor) + r * Math.max(0, factor)));
      const newG = Math.max(0, Math.min(255, g + (255 - g) * Math.max(0, -factor) + g * Math.max(0, factor)));
      const newB = Math.max(0, Math.min(255, b + (255 - b) * Math.max(0, -factor) + b * Math.max(0, factor)));
      
      palette[step] = `#${Math.round(newR).toString(16).padStart(2, '0')}${Math.round(newG).toString(16).padStart(2, '0')}${Math.round(newB).toString(16).padStart(2, '0')}`;
    });
    
    return palette;
  },

  /**
   * Check color contrast ratio
   * @param {string} color1 - First color in hex
   * @param {string} color2 - Second color in hex
   */
  getContrastRatio(color1, color2) {
    const getLuminance = (hex) => {
      const rgb = parseInt(hex.slice(1), 16);
      const r = (rgb >> 16) & 0xff;
      const g = (rgb >> 8) & 0xff;
      const b = (rgb >> 0) & 0xff;
      
      const [rs, gs, bs] = [r, g, b].map(c => {
        c = c / 255;
        return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
      });
      
      return 0.2126 * rs + 0.7152 * gs + 0.0722 * bs;
    };
    
    const l1 = getLuminance(color1);
    const l2 = getLuminance(color2);
    
    return (Math.max(l1, l2) + 0.05) / (Math.min(l1, l2) + 0.05);
  },

  /**
   * Convert theme config to CSS variables
   * @param {Object} config - Theme configuration
   */
  configToCSS(config) {
    let css = ':root {\n';
    
    // Add color variables
    if (config.customColors?.primary) {
      Object.entries(config.customColors.primary).forEach(([shade, color]) => {
        css += `  --color-primary-${shade}: ${color};\n`;
      });
    }
    
    // Add typography variables
    if (config.typography) {
      if (config.typography.fontFamily) {
        css += `  --font-family-primary: "${config.typography.fontFamily}", sans-serif;\n`;
      }
      if (config.typography.headingFont) {
        css += `  --font-family-heading: "${config.typography.headingFont}", sans-serif;\n`;
      }
      if (config.typography.bodyFont) {
        css += `  --font-family-body: "${config.typography.bodyFont}", sans-serif;\n`;
      }
      if (config.typography.codeFont) {
        css += `  --font-family-mono: "${config.typography.codeFont}", monospace;\n`;
      }
    }
    
    // Add effect variables
    if (config.effects) {
      if (config.effects.borderRadius) {
        css += `  --border-radius-base: ${config.effects.borderRadius};\n`;
      }
      if (config.effects.animationSpeed) {
        css += `  --animation-speed: ${config.effects.animationSpeed};\n`;
      }
    }
    
    css += '}\n';
    
    // Add dark mode styles if needed
    if (config.theme === 'dark') {
      css += '\nhtml.dark {\n';
      css += '  color-scheme: dark;\n';
      css += '}\n';
    }
    
    return css;
  },

  /**
   * Get optimal text color for background
   * @param {string} backgroundColor - Background color in hex
   */
  getOptimalTextColor(backgroundColor) {
    const whiteRatio = this.getContrastRatio(backgroundColor, '#ffffff');
    const blackRatio = this.getContrastRatio(backgroundColor, '#000000');
    
    return whiteRatio > blackRatio ? '#ffffff' : '#000000';
  },

  /**
   * Generate harmonious color scheme
   * @param {string} baseColor - Base color in hex
   * @param {string} harmonyType - Type of harmony
   */
  generateColorHarmony(baseColor, harmonyType = 'complementary') {
    const hex = baseColor.replace('#', '');
    const r = parseInt(hex.substr(0, 2), 16) / 255;
    const g = parseInt(hex.substr(2, 2), 16) / 255;
    const b = parseInt(hex.substr(4, 2), 16) / 255;
    
    // Convert to HSL
    const max = Math.max(r, g, b);
    const min = Math.min(r, g, b);
    const diff = max - min;
    const sum = max + min;
    const l = sum / 2;
    
    let s, h;
    if (diff === 0) {
      h = s = 0;
    } else {
      s = l < 0.5 ? diff / sum : diff / (2 - sum);
      switch (max) {
        case r: h = (g - b) / diff + (g < b ? 6 : 0); break;
        case g: h = (b - r) / diff + 2; break;
        case b: h = (r - g) / diff + 4; break;
      }
      h /= 6;
    }
    
    const hue = h * 360;
    const colors = [baseColor];
    
    switch (harmonyType) {
      case 'complementary':
        colors.push(this.hslToHex((hue + 180) % 360, s * 100, l * 100));
        break;
      case 'triadic':
        colors.push(
          this.hslToHex((hue + 120) % 360, s * 100, l * 100),
          this.hslToHex((hue + 240) % 360, s * 100, l * 100)
        );
        break;
      case 'analogous':
        colors.push(
          this.hslToHex((hue + 30) % 360, s * 100, l * 100),
          this.hslToHex((hue - 30 + 360) % 360, s * 100, l * 100)
        );
        break;
    }
    
    return colors;
  },

  /**
   * Convert HSL to hex
   * @param {number} h - Hue (0-360)
   * @param {number} s - Saturation (0-100)
   * @param {number} l - Lightness (0-100)
   */
  hslToHex(h, s, l) {
    h /= 360;
    s /= 100;
    l /= 100;

    const hue2rgb = (p, q, t) => {
      if (t < 0) t += 1;
      if (t > 1) t -= 1;
      if (t < 1/6) return p + (q - p) * 6 * t;
      if (t < 1/2) return q;
      if (t < 2/3) return p + (q - p) * (2/3 - t) * 6;
      return p;
    };

    let r, g, b;
    if (s === 0) {
      r = g = b = l;
    } else {
      const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
      const p = 2 * l - q;
      r = hue2rgb(p, q, h + 1/3);
      g = hue2rgb(p, q, h);
      b = hue2rgb(p, q, h - 1/3);
    }

    const toHex = (c) => {
      const hex = Math.round(c * 255).toString(16);
      return hex.length === 1 ? '0' + hex : hex;
    };

    return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
  },

  /**
   * Validate color accessibility
   * @param {Object} colors - Color palette
   * @param {string} backgroundColor - Background color to test against
   */
  validateColorAccessibility(colors, backgroundColor = '#ffffff') {
    const results = {};
    
    Object.entries(colors).forEach(([shade, color]) => {
      const ratio = this.getContrastRatio(color, backgroundColor);
      
      results[shade] = {
        color,
        contrastRatio: Math.round(ratio * 100) / 100,
        isReadable: ratio >= 4.5,
        wcagLevel: ratio >= 7 ? 'AAA' : ratio >= 4.5 ? 'AA' : 'Fail'
      };
    });
    
    return results;
  },

  /**
   * Blend two colors
   * @param {string} color1 - First color in hex
   * @param {string} color2 - Second color in hex
   * @param {number} ratio - Blend ratio (0-1)
   */
  blendColors(color1, color2, ratio = 0.5) {
    const hex1 = color1.replace('#', '');
    const hex2 = color2.replace('#', '');
    
    const r1 = parseInt(hex1.substr(0, 2), 16);
    const g1 = parseInt(hex1.substr(2, 2), 16);
    const b1 = parseInt(hex1.substr(4, 2), 16);
    
    const r2 = parseInt(hex2.substr(0, 2), 16);
    const g2 = parseInt(hex2.substr(2, 2), 16);
    const b2 = parseInt(hex2.substr(4, 2), 16);
    
    const r = Math.round(r1 * (1 - ratio) + r2 * ratio);
    const g = Math.round(g1 * (1 - ratio) + g2 * ratio);
    const b = Math.round(b1 * (1 - ratio) + b2 * ratio);
    
    const toHex = (c) => c.toString(16).padStart(2, '0');
    return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
  }
};

// Create singleton instance
const premiumThemeManager = new PremiumThemeManager();

export default premiumThemeManager;