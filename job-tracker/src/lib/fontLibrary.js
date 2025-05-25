// src/lib/fontLibrary.js - Google Fonts integration and font management

/**
 * Google Fonts API integration and font management utilities
 */

// Popular Google Fonts categorized by type
export const FONT_CATEGORIES = {
  'sans-serif': {
    name: 'Sans Serif',
    description: 'Clean, modern fonts without decorative strokes',
    fonts: [
      { 
        family: 'Inter', 
        variants: ['300', '400', '500', '600', '700'], 
        popularity: 95,
        description: 'Modern, highly legible font optimized for UI',
        previewText: 'The quick brown fox jumps over the lazy dog'
      },
      { 
        family: 'Roboto', 
        variants: ['300', '400', '500', '700'], 
        popularity: 90,
        description: 'Google\'s signature font, geometric and friendly',
        previewText: 'The quick brown fox jumps over the lazy dog'
      },
      { 
        family: 'Open Sans', 
        variants: ['300', '400', '600', '700'], 
        popularity: 88,
        description: 'Optimized for print, web, and mobile interfaces',
        previewText: 'The quick brown fox jumps over the lazy dog'
      },
      { 
        family: 'Lato', 
        variants: ['300', '400', '700'], 
        popularity: 85,
        description: 'Semi-rounded details giving a feeling of warmth',
        previewText: 'The quick brown fox jumps over the lazy dog'
      },
      { 
        family: 'Montserrat', 
        variants: ['300', '400', '500', '600', '700'], 
        popularity: 82,
        description: 'Inspired by urban typography from Buenos Aires',
        previewText: 'The quick brown fox jumps over the lazy dog'
      },
      { 
        family: 'Source Sans Pro', 
        variants: ['300', '400', '600', '700'], 
        popularity: 80,
        description: 'Adobe\'s first open source typeface family',
        previewText: 'The quick brown fox jumps over the lazy dog'
      },
      { 
        family: 'Poppins', 
        variants: ['300', '400', '500', '600', '700'], 
        popularity: 78,
        description: 'Geometric sans serif with rounded letterforms',
        previewText: 'The quick brown fox jumps over the lazy dog'
      },
      { 
        family: 'Nunito', 
        variants: ['300', '400', '600', '700'], 
        popularity: 75,
        description: 'Well balanced and highly readable typeface',
        previewText: 'The quick brown fox jumps over the lazy dog'
      },
      { 
        family: 'Ubuntu', 
        variants: ['300', '400', '500', '700'], 
        popularity: 72,
        description: 'Contemporary humanist typeface',
        previewText: 'The quick brown fox jumps over the lazy dog'
      },
      { 
        family: 'Work Sans', 
        variants: ['300', '400', '500', '600', '700'], 
        popularity: 68,
        description: 'Optimized for on-screen text usage',
        previewText: 'The quick brown fox jumps over the lazy dog'
      }
    ]
  },
  'serif': {
    name: 'Serif',
    description: 'Traditional fonts with decorative strokes',
    fonts: [
      { 
        family: 'Playfair Display', 
        variants: ['400', '500', '600', '700'], 
        popularity: 85,
        description: 'Transitional design for large sizes and headlines',
        previewText: 'The quick brown fox jumps over the lazy dog'
      },
      { 
        family: 'Merriweather', 
        variants: ['300', '400', '700'], 
        popularity: 80,
        description: 'Designed to be pleasant to read on screens',
        previewText: 'The quick brown fox jumps over the lazy dog'
      },
      { 
        family: 'Lora', 
        variants: ['400', '500', '600', '700'], 
        popularity: 78,
        description: 'Well-balanced contemporary serif',
        previewText: 'The quick brown fox jumps over the lazy dog'
      },
      { 
        family: 'Source Serif Pro', 
        variants: ['400', '600', '700'], 
        popularity: 75,
        description: 'Complement to Source Sans Pro',
        previewText: 'The quick brown fox jumps over the lazy dog'
      },
      { 
        family: 'Crimson Text', 
        variants: ['400', '600', '700'], 
        popularity: 72,
        description: 'Font family for book production',
        previewText: 'The quick brown fox jumps over the lazy dog'
      },
      { 
        family: 'Libre Baskerville', 
        variants: ['400', '700'], 
        popularity: 70,
        description: 'Web optimized version of Baskerville',
        previewText: 'The quick brown fox jumps over the lazy dog'
      }
    ]
  },
  'monospace': {
    name: 'Monospace',
    description: 'Fixed-width fonts perfect for code',
    fonts: [
      { 
        family: 'Fira Code', 
        variants: ['300', '400', '500', '600', '700'], 
        popularity: 90,
        description: 'Monospaced font with programming ligatures',
        previewText: '() => { return "Hello World"; }'
      },
      { 
        family: 'Source Code Pro', 
        variants: ['300', '400', '500', '600', '700'], 
        popularity: 85,
        description: 'Monospaced font family for coding environments',
        previewText: 'function example() { return true; }'
      },
      { 
        family: 'JetBrains Mono', 
        variants: ['300', '400', '500', '600', '700'], 
        popularity: 80,
        description: 'Typeface for developers',
        previewText: 'const value = await getData();'
      },
      { 
        family: 'Inconsolata', 
        variants: ['400', '700'], 
        popularity: 75,
        description: 'Monospace font designed for code listings',
        previewText: 'npm install package-name'
      },
      { 
        family: 'Roboto Mono', 
        variants: ['300', '400', '500', '700'], 
        popularity: 72,
        description: 'Monospaced addition to the Roboto family',
        previewText: 'git commit -m "Initial commit"'
      }
    ]
  },
  'display': {
    name: 'Display',
    description: 'Eye-catching fonts for headlines',
    fonts: [
      { 
        family: 'Oswald', 
        variants: ['300', '400', '500', '600', '700'], 
        popularity: 85,
        description: 'Gothic typeface for headlines',
        previewText: 'BOLD HEADLINES'
      },
      { 
        family: 'Raleway', 
        variants: ['300', '400', '500', '600', '700'], 
        popularity: 82,
        description: 'Elegant sans-serif typeface',
        previewText: 'Elegant Typography'
      },
      { 
        family: 'Bebas Neue', 
        variants: ['400'], 
        popularity: 80,
        description: 'All caps display typeface',
        previewText: 'DISPLAY FONT'
      },
      { 
        family: 'Anton', 
        variants: ['400'], 
        popularity: 75,
        description: 'Sans serif with short ascenders',
        previewText: 'STRONG IMPACT'
      }
    ]
  },
  'handwriting': {
    name: 'Handwriting',
    description: 'Script and cursive fonts',
    fonts: [
      { 
        family: 'Dancing Script', 
        variants: ['400', '500', '600', '700'], 
        popularity: 85,
        description: 'Lively casual script',
        previewText: 'Beautiful Script Text'
      },
      { 
        family: 'Pacifico', 
        variants: ['400'], 
        popularity: 80,
        description: 'Original and fun brush script',
        previewText: 'Creative Design'
      },
      { 
        family: 'Lobster', 
        variants: ['400'], 
        popularity: 75,
        description: 'Script with many quirks',
        previewText: 'Quirky & Fun'
      }
    ]
  }
};

// Font pairing suggestions
export const FONT_PAIRINGS = [
  {
    name: 'Modern & Clean',
    description: 'Perfect for web applications and interfaces',
    heading: 'Inter',
    body: 'Inter',
    accent: 'Source Code Pro'
  },
  {
    name: 'Classic Editorial',
    description: 'Traditional and elegant for content-heavy sites',
    heading: 'Playfair Display',
    body: 'Crimson Text',
    accent: 'Source Sans Pro'
  },
  {
    name: 'Friendly & Approachable',
    description: 'Warm and welcoming for user-facing applications',
    heading: 'Montserrat',
    body: 'Open Sans',
    accent: 'Nunito'
  },
  {
    name: 'Technical & Professional',
    description: 'Clean and authoritative for business applications',
    heading: 'Roboto',
    body: 'Source Sans Pro',
    accent: 'Roboto Mono'
  },
  {
    name: 'Creative & Bold',
    description: 'Expressive and distinctive for creative projects',
    heading: 'Oswald',
    body: 'Lato',
    accent: 'Dancing Script'
  }
];

/**
 * Font management utilities
 */
class FontLibrary {
  constructor() {
    this.loadedFonts = new Set();
    this.apiKey = process.env.NEXT_PUBLIC_GOOGLE_FONTS_API_KEY;
    this.baseUrl = 'https://fonts.googleapis.com';
  }

  /**
   * Load a Google Font dynamically
   * @param {string} fontFamily - Font family name
   * @param {string[]} variants - Font weight variants to load
   * @param {string[]} subsets - Character subsets to include
   */
  loadFont(fontFamily, variants = ['400'], subsets = ['latin']) {
    if (this.loadedFonts.has(fontFamily)) {
      return Promise.resolve();
    }

    return new Promise((resolve, reject) => {
      const fontName = fontFamily.replace(/\s+/g, '+');
      const variantString = variants.join(',');
      const subsetString = subsets.join(',');
      
      const link = document.createElement('link');
      link.rel = 'stylesheet';
      link.href = `${this.baseUrl}/css2?family=${fontName}:wght@${variantString}&subset=${subsetString}&display=swap`;
      
      link.onload = () => {
        this.loadedFonts.add(fontFamily);
        resolve();
      };
      
      link.onerror = () => {
        reject(new Error(`Failed to load font: ${fontFamily}`));
      };
      
      document.head.appendChild(link);
    });
  }

  /**
   * Load multiple fonts at once
   * @param {Array} fonts - Array of font objects with family, variants, subsets
   */
  async loadFonts(fonts) {
    const loadPromises = fonts.map(font => 
      this.loadFont(font.family, font.variants, font.subsets)
    );
    
    try {
      await Promise.all(loadPromises);
      return { success: true, loadedFonts: fonts.map(f => f.family) };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  /**
   * Get all available fonts from a category
   * @param {string} category - Font category
   */
  getFontsByCategory(category) {
    return FONT_CATEGORIES[category]?.fonts || [];
  }

  /**
   * Search fonts by name
   * @param {string} query - Search query
   * @param {number} limit - Maximum results to return
   */
  searchFonts(query, limit = 20) {
    if (!query) return [];
    
    const allFonts = Object.values(FONT_CATEGORIES)
      .flatMap(category => category.fonts)
      .filter(font => 
        font.family.toLowerCase().includes(query.toLowerCase())
      )
      .sort((a, b) => b.popularity - a.popularity)
      .slice(0, limit);
    
    return allFonts;
  }

  /**
   * Get font pairing suggestions
   * @param {string} primaryFont - Primary font family
   */
  getFontPairings(primaryFont) {
    // Find pairings that include the primary font
    const matchingPairings = FONT_PAIRINGS.filter(pairing => 
      pairing.heading === primaryFont || 
      pairing.body === primaryFont ||
      pairing.accent === primaryFont
    );
    
    if (matchingPairings.length > 0) {
      return matchingPairings;
    }
    
    // If no direct matches, return general recommendations
    return FONT_PAIRINGS.slice(0, 3);
  }

  /**
   * Generate CSS for a font family
   * @param {string} fontFamily - Font family name
   * @param {string[]} variants - Font weight variants
   */
  generateFontCSS(fontFamily, variants = ['400']) {
    const fontStack = this.getFontStack(fontFamily);
    const variantRules = variants.map(variant => {
      const weight = variant.replace(/[^0-9]/g, '');
      const style = variant.includes('i') ? 'italic' : 'normal';
      
      return `
  font-family: ${fontStack};
  font-weight: ${weight};
  font-style: ${style};`;
    });
    
    return `/* ${fontFamily} Font Family */
.font-${fontFamily.toLowerCase().replace(/\s+/g, '-')} {${variantRules[0]}
}`;
  }

  /**
   * Get appropriate font stack for fallbacks
   * @param {string} fontFamily - Primary font family
   */
  getFontStack(fontFamily) {
    // Determine category to provide appropriate fallbacks
    const category = this.getFontCategory(fontFamily);
    
    const fallbacks = {
      'sans-serif': ['"Helvetica Neue"', 'Helvetica', 'Arial', 'sans-serif'],
      'serif': ['Georgia', '"Times New Roman"', 'Times', 'serif'],
      'monospace': ['"Courier New"', 'Courier', 'monospace'],
      'display': ['Impact', '"Arial Black"', 'sans-serif'],
      'handwriting': ['cursive']
    };
    
    const categoryFallbacks = fallbacks[category] || fallbacks['sans-serif'];
    return [`"${fontFamily}"`, ...categoryFallbacks].join(', ');
  }

  /**
   * Determine font category
   * @param {string} fontFamily - Font family name
   */
  getFontCategory(fontFamily) {
    for (const [category, data] of Object.entries(FONT_CATEGORIES)) {
      if (data.fonts.some(font => font.family === fontFamily)) {
        return category;
      }
    }
    return 'sans-serif'; // Default fallback
  }

  /**
   * Check if a font is loaded
   * @param {string} fontFamily - Font family name
   */
  isFontLoaded(fontFamily) {
    return this.loadedFonts.has(fontFamily);
  }

  /**
   * Get font metrics for better typography
   * @param {string} fontFamily - Font family name
   */
  getFontMetrics(fontFamily) {
    // Basic font metrics for better line height and spacing
    const metrics = {
      'Inter': { lineHeight: 1.5, letterSpacing: '-0.011em' },
      'Roboto': { lineHeight: 1.47, letterSpacing: 'normal' },
      'Open Sans': { lineHeight: 1.45, letterSpacing: 'normal' },
      'Playfair Display': { lineHeight: 1.3, letterSpacing: 'normal' },
      'Fira Code': { lineHeight: 1.5, letterSpacing: 'normal' },
      'Montserrat': { lineHeight: 1.5, letterSpacing: '-0.01em' }
    };
    
    return metrics[fontFamily] || { lineHeight: 1.5, letterSpacing: 'normal' };
  }

  /**
   * Generate Tailwind CSS configuration for custom fonts
   * @param {string[]} fontFamilies - Array of font family names
   */
  generateTailwindConfig(fontFamilies) {
    const fontConfig = {};
    
    fontFamilies.forEach(fontFamily => {
      const key = fontFamily.toLowerCase().replace(/\s+/g, '-');
      const stack = this.getFontStack(fontFamily);
      fontConfig[key] = stack.split(', ');
    });
    
    return {
      fontFamily: fontConfig
    };
  }

  /**
   * Get popular fonts for quick selection
   * @param {number} limit - Number of fonts to return
   */
  getPopularFonts(limit = 10) {
    const allFonts = Object.values(FONT_CATEGORIES)
      .flatMap(category => category.fonts)
      .sort((a, b) => b.popularity - a.popularity)
      .slice(0, limit);
    
    return allFonts;
  }

  /**
   * Validate font availability
   * @param {string} fontFamily - Font family name
   */
  async validateFont(fontFamily) {
    try {
      // Create a test element to check if font loads
      const testElement = document.createElement('div');
      testElement.style.fontFamily = fontFamily;
      testElement.style.fontSize = '12px';
      testElement.style.position = 'absolute';
      testElement.style.visibility = 'hidden';
      testElement.textContent = 'Test';
      
      document.body.appendChild(testElement);
      
      // Get computed style
      const computedStyle = window.getComputedStyle(testElement);
      const actualFont = computedStyle.fontFamily;
      
      document.body.removeChild(testElement);
      
      // Check if the font was actually applied
      return actualFont.includes(fontFamily);
    } catch (error) {
      console.warn(`Font validation failed for ${fontFamily}:`, error);
      return false;
    }
  }

  /**
   * Preload fonts for better performance
   * @param {string[]} fontFamilies - Array of font families to preload
   */
  preloadFonts(fontFamilies) {
    fontFamilies.forEach(fontFamily => {
      const link = document.createElement('link');
      link.rel = 'preload';
      link.as = 'style';
      link.href = `${this.baseUrl}/css2?family=${fontFamily.replace(/\s+/g, '+')}:wght@400&display=swap`;
      document.head.appendChild(link);
    });
  }

  /**
   * Get font loading performance metrics
   */
  getLoadingMetrics() {
    return {
      loadedFonts: Array.from(this.loadedFonts),
      totalLoaded: this.loadedFonts.size,
      isGoogleFontsEnabled: !!this.apiKey
    };
  }
}

// Font weight mappings
export const FONT_WEIGHTS = {
  100: 'Thin',
  200: 'Extra Light',
  300: 'Light',
  400: 'Regular',
  500: 'Medium',
  600: 'Semi Bold',
  700: 'Bold',
  800: 'Extra Bold',
  900: 'Black'
};

// Font size scales
export const FONT_SCALES = {
  'minor-second': 1.067,
  'major-second': 1.125,
  'minor-third': 1.2,
  'major-third': 1.25,
  'perfect-fourth': 1.333,
  'augmented-fourth': 1.414,
  'perfect-fifth': 1.5,
  'golden-ratio': 1.618
};

/**
 * Generate typographic scale
 * @param {number} baseSize - Base font size in pixels
 * @param {string} scaleType - Scale type from FONT_SCALES
 * @param {number} steps - Number of scale steps
 */
export const generateTypographicScale = (baseSize = 16, scaleType = 'major-third', steps = 8) => {
  const scale = FONT_SCALES[scaleType] || FONT_SCALES['major-third'];
  const sizes = [];
  
  // Generate smaller sizes
  for (let i = 2; i >= 1; i--) {
    sizes.push(Math.round((baseSize / Math.pow(scale, i)) * 100) / 100);
  }
  
  // Add base size
  sizes.push(baseSize);
  
  // Generate larger sizes
  for (let i = 1; i <= steps; i++) {
    sizes.push(Math.round((baseSize * Math.pow(scale, i)) * 100) / 100);
  }
  
  return sizes;
};

/**
 * Font performance optimization utilities
 */
export const FontOptimization = {
  /**
   * Use font-display: swap for better loading performance
   */
  getFontDisplayCSS(fontFamily) {
    return `
@font-face {
  font-family: '${fontFamily}';
  font-display: swap;
}`;
  },

  /**
   * Critical font subset for faster loading
   */
  getCriticalSubset() {
    return 'latin'; // Most common subset for web applications
  },

  /**
   * Font loading strategy recommendations
   */
  getLoadingStrategy(priority = 'medium') {
    const strategies = {
      high: {
        display: 'block', // Ensure text is visible immediately
        preload: true,
        subset: ['latin', 'latin-ext']
      },
      medium: {
        display: 'swap', // Balance between flash and performance
        preload: false,
        subset: ['latin']
      },
      low: {
        display: 'optional', // Only load if network is good
        preload: false,
        subset: ['latin']
      }
    };
    
    return strategies[priority] || strategies.medium;
  }
};

// Create singleton instance
const fontLibrary = new FontLibrary();

export default fontLibrary;