'use client';

import { useState, useEffect, useRef } from 'react';
import PremiumFeatureLock from './PremiumFeatureLock';

const FontFamilySelector = ({
  value = 'Inter',
  onChange,
  label = 'Font Family',
  showPreview = true,
  categories = ['sans-serif', 'serif', 'monospace', 'display', 'handwriting'],
  maxResults = 50,
  className = ''
}) => {
  const [selectedFont, setSelectedFont] = useState(value);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [isOpen, setIsOpen] = useState(false);
  const [loadedFonts, setLoadedFonts] = useState(new Set());
  const [favoritesFonts, setFavoritesFonts] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  
  const selectorRef = useRef(null);

  // Popular Google Fonts organized by category
  const googleFonts = {
    'sans-serif': [
      { name: 'Inter', variants: ['300', '400', '500', '600', '700'], popularity: 95 },
      { name: 'Roboto', variants: ['300', '400', '500', '700'], popularity: 90 },
      { name: 'Open Sans', variants: ['300', '400', '600', '700'], popularity: 88 },
      { name: 'Lato', variants: ['300', '400', '700'], popularity: 85 },
      { name: 'Montserrat', variants: ['300', '400', '500', '600', '700'], popularity: 82 },
      { name: 'Source Sans Pro', variants: ['300', '400', '600', '700'], popularity: 80 },
      { name: 'Poppins', variants: ['300', '400', '500', '600', '700'], popularity: 78 },
      { name: 'Nunito', variants: ['300', '400', '600', '700'], popularity: 75 },
      { name: 'Ubuntu', variants: ['300', '400', '500', '700'], popularity: 72 },
      { name: 'Oxygen', variants: ['300', '400', '700'], popularity: 70 },
      { name: 'Work Sans', variants: ['300', '400', '500', '600', '700'], popularity: 68 },
      { name: 'Fira Sans', variants: ['300', '400', '500', '600', '700'], popularity: 65 },
      { name: 'Noto Sans', variants: ['400', '700'], popularity: 63 },
      { name: 'PT Sans', variants: ['400', '700'], popularity: 60 }
    ],
    'serif': [
      { name: 'Playfair Display', variants: ['400', '500', '600', '700'], popularity: 85 },
      { name: 'Merriweather', variants: ['300', '400', '700'], popularity: 80 },
      { name: 'Lora', variants: ['400', '500', '600', '700'], popularity: 78 },
      { name: 'Source Serif Pro', variants: ['400', '600', '700'], popularity: 75 },
      { name: 'Crimson Text', variants: ['400', '600', '700'], popularity: 72 },
      { name: 'Libre Baskerville', variants: ['400', '700'], popularity: 70 },
      { name: 'Cormorant Garamond', variants: ['300', '400', '500', '600', '700'], popularity: 68 },
      { name: 'PT Serif', variants: ['400', '700'], popularity: 65 },
      { name: 'Noto Serif', variants: ['400', '700'], popularity: 63 },
      { name: 'Georgia', variants: ['400', '700'], popularity: 60 }
    ],
    'monospace': [
      { name: 'Fira Code', variants: ['300', '400', '500', '600', '700'], popularity: 90 },
      { name: 'Source Code Pro', variants: ['300', '400', '500', '600', '700'], popularity: 85 },
      { name: 'JetBrains Mono', variants: ['300', '400', '500', '600', '700'], popularity: 80 },
      { name: 'Inconsolata', variants: ['400', '700'], popularity: 75 },
      { name: 'Roboto Mono', variants: ['300', '400', '500', '700'], popularity: 72 },
      { name: 'Space Mono', variants: ['400', '700'], popularity: 68 },
      { name: 'IBM Plex Mono', variants: ['300', '400', '500', '600', '700'], popularity: 65 },
      { name: 'Courier Prime', variants: ['400', '700'], popularity: 60 }
    ],
    'display': [
      { name: 'Oswald', variants: ['300', '400', '500', '600', '700'], popularity: 85 },
      { name: 'Raleway', variants: ['300', '400', '500', '600', '700'], popularity: 82 },
      { name: 'Bebas Neue', variants: ['400'], popularity: 80 },
      { name: 'Anton', variants: ['400'], popularity: 75 },
      { name: 'Fjalla One', variants: ['400'], popularity: 70 },
      { name: 'Righteous', variants: ['400'], popularity: 68 },
      { name: 'Bangers', variants: ['400'], popularity: 65 },
      { name: 'Fredoka One', variants: ['400'], popularity: 62 }
    ],
    'handwriting': [
      { name: 'Dancing Script', variants: ['400', '500', '600', '700'], popularity: 85 },
      { name: 'Pacifico', variants: ['400'], popularity: 80 },
      { name: 'Lobster', variants: ['400'], popularity: 75 },
      { name: 'Great Vibes', variants: ['400'], popularity: 70 },
      { name: 'Kaushan Script', variants: ['400'], popularity: 68 },
      { name: 'Satisfy', variants: ['400'], popularity: 65 },
      { name: 'Caveat', variants: ['400', '700'], popularity: 62 },
      { name: 'Patrick Hand', variants: ['400'], popularity: 60 }
    ]
  };

  // Get all fonts or filtered by category
  const getAllFonts = () => {
    if (selectedCategory === 'all') {
      return Object.values(googleFonts).flat();
    }
    return googleFonts[selectedCategory] || [];
  };

  // Filter fonts based on search term
  const getFilteredFonts = () => {
    const allFonts = getAllFonts();
    if (!searchTerm) {
      return allFonts.slice(0, maxResults);
    }
    
    return allFonts
      .filter(font => 
        font.name.toLowerCase().includes(searchTerm.toLowerCase())
      )
      .slice(0, maxResults);
  };

  // Load Google Font dynamically
  const loadGoogleFont = (fontName) => {
    if (loadedFonts.has(fontName)) return;

    const link = document.createElement('link');
    link.href = `https://fonts.googleapis.com/css2?family=${fontName.replace(/\s+/g, '+')}:wght@300;400;500;600;700&display=swap`;
    link.rel = 'stylesheet';
    document.head.appendChild(link);
    
    setLoadedFonts(prev => new Set([...prev, fontName]));
  };

  // Handle font selection
  const handleFontSelect = (fontName) => {
    setSelectedFont(fontName);
    onChange?.(fontName);
    loadGoogleFont(fontName);
    setIsOpen(false);
  };

  // Toggle favorite
  const toggleFavorite = (fontName) => {
    setFavoritesFonts(prev => 
      prev.includes(fontName)
        ? prev.filter(f => f !== fontName)
        : [...prev, fontName]
    );
  };

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (selectorRef.current && !selectorRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Load selected font on mount
  useEffect(() => {
    loadGoogleFont(selectedFont);
  }, [selectedFont]);

  // Font preview text
  const previewText = "The quick brown fox jumps over the lazy dog";

  const FontSelectorContent = () => (
    <div className={`space-y-4 ${className}`} ref={selectorRef}>
      {/* Label and current selection */}
      <div>
        <label className="block text-sm font-medium text-gray-900 dark:text-white mb-2">
          {label}
        </label>
        
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="w-full flex items-center justify-between p-3 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg hover:border-primary-400 focus:outline-none focus:ring-2 focus:ring-primary-500 transition-colors duration-200"
        >
          <div className="flex items-center space-x-3">
            <div 
              className="text-lg font-medium text-gray-900 dark:text-white"
              style={{ fontFamily: selectedFont }}
            >
              {selectedFont}
            </div>
            <span className="text-xs text-gray-500 dark:text-gray-400">
              {Object.entries(googleFonts).find(([category, fonts]) => 
                fonts.some(font => font.name === selectedFont)
              )?.[0] || 'Custom'}
            </span>
          </div>
          
          <svg 
            className={`w-5 h-5 text-gray-400 transition-transform duration-200 ${
              isOpen ? 'rotate-180' : ''
            }`} 
            fill="none" 
            viewBox="0 0 24 24" 
            stroke="currentColor"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </button>
      </div>

      {/* Font preview */}
      {showPreview && (
        <div className="p-4 bg-gray-50 dark:bg-gray-900 rounded-lg">
          <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-2">
            Preview
          </label>
          <div 
            className="text-gray-900 dark:text-white space-y-2"
            style={{ fontFamily: selectedFont }}
          >
            <p className="text-lg">{previewText}</p>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Font family: {selectedFont}
            </p>
          </div>
        </div>
      )}

      {/* Font dropdown */}
      {isOpen && (
        <div className="absolute z-50 w-full mt-1 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg max-h-96 overflow-hidden animate-fade-in">
          {/* Search and filters */}
          <div className="p-3 border-b border-gray-200 dark:border-gray-700">
            <div className="space-y-3">
              {/* Search input */}
              <div className="relative">
                <input
                  type="text"
                  placeholder="Search fonts..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-8 pr-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded focus:outline-none focus:ring-1 focus:ring-primary-500 dark:bg-gray-700 dark:text-white"
                />
                <svg className="absolute left-2.5 top-2.5 w-4 h-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </div>

              {/* Category filter */}
              <div className="flex flex-wrap gap-1">
                <button
                  onClick={() => setSelectedCategory('all')}
                  className={`px-2 py-1 text-xs rounded transition-colors duration-200 ${
                    selectedCategory === 'all'
                      ? 'bg-primary-100 text-primary-700 dark:bg-primary-900 dark:text-primary-300'
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-400 dark:hover:bg-gray-600'
                  }`}
                >
                  All
                </button>
                {categories.map(category => (
                  <button
                    key={category}
                    onClick={() => setSelectedCategory(category)}
                    className={`px-2 py-1 text-xs rounded transition-colors duration-200 capitalize ${
                      selectedCategory === category
                        ? 'bg-primary-100 text-primary-700 dark:bg-primary-900 dark:text-primary-300'
                        : 'bg-gray-100 text-gray-600 hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-400 dark:hover:bg-gray-600'
                    }`}
                  >
                    {category.replace('-', ' ')}
                  </button>
                ))}
              </div>

              {/* Favorites */}
              {favoritesFonts.length > 0 && (
                <div>
                  <h4 className="text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Favorites
                  </h4>
                  <div className="flex flex-wrap gap-1">
                    {favoritesFonts.slice(0, 5).map(fontName => (
                      <button
                        key={fontName}
                        onClick={() => handleFontSelect(fontName)}
                        className="px-2 py-1 text-xs bg-yellow-100 text-yellow-800 rounded hover:bg-yellow-200 transition-colors duration-200 dark:bg-yellow-900 dark:text-yellow-300"
                        style={{ fontFamily: fontName }}
                      >
                        {fontName}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Font list */}
          <div className="max-h-64 overflow-y-auto">
            {getFilteredFonts().map((font, index) => (
              <div
                key={font.name}
                className={`flex items-center justify-between p-3 hover:bg-gray-50 dark:hover:bg-gray-700 cursor-pointer transition-colors duration-200 ${
                  selectedFont === font.name ? 'bg-primary-50 dark:bg-primary-900/20' : ''
                }`}
                onClick={() => handleFontSelect(font.name)}
                onMouseEnter={() => loadGoogleFont(font.name)}
              >
                <div className="flex-1 min-w-0">
                  <div 
                    className="text-base font-medium text-gray-900 dark:text-white truncate"
                    style={{ fontFamily: font.name }}
                  >
                    {font.name}
                  </div>
                  <div className="flex items-center space-x-2 mt-1">
                    <span className="text-xs text-gray-500 dark:text-gray-400 capitalize">
                      {Object.entries(googleFonts).find(([category, fonts]) => 
                        fonts.includes(font)
                      )?.[0]}
                    </span>
                    <span className="text-xs text-gray-400">
                      {font.variants.length} weight{font.variants.length !== 1 ? 's' : ''}
                    </span>
                    {font.popularity >= 80 && (
                      <span className="inline-flex items-center px-1.5 py-0.5 rounded text-xs font-medium bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300">
                        Popular
                      </span>
                    )}
                  </div>
                </div>

                <div className="flex items-center space-x-2 ml-4">
                  {/* Popularity indicator */}
                  <div className="flex space-x-0.5">
                    {[...Array(5)].map((_, i) => (
                      <div
                        key={i}
                        className={`w-1 h-3 rounded-full ${
                          i < Math.floor(font.popularity / 20)
                            ? 'bg-primary-400'
                            : 'bg-gray-200 dark:bg-gray-600'
                        }`}
                      />
                    ))}
                  </div>

                  {/* Favorite toggle */}
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      toggleFavorite(font.name);
                    }}
                    className={`p-1 rounded transition-colors duration-200 ${
                      favoritesFonts.includes(font.name)
                        ? 'text-yellow-500 hover:text-yellow-600'
                        : 'text-gray-400 hover:text-gray-600 dark:hover:text-gray-300'
                    }`}
                  >
                    <svg className="w-4 h-4" fill={favoritesFonts.includes(font.name) ? 'currentColor' : 'none'} viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
                    </svg>
                  </button>
                </div>
              </div>
            ))}
            
            {getFilteredFonts().length === 0 && (
              <div className="p-8 text-center text-gray-500 dark:text-gray-400">
                <svg className="w-12 h-12 mx-auto mb-4 text-gray-300 dark:text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 4V2a1 1 0 011-1h8a1 1 0 011 1v2m0 0V1a1 1 0 011-1h2a1 1 0 011 1v18a1 1 0 01-1 1H4a1 1 0 01-1-1V1a1 1 0 011-1h2a1 1 0 011 1v3m0 0h8m-8 0H5a1 1 0 00-1 1v3m1-4h14" />
                </svg>
                <p className="text-sm">No fonts found</p>
                <p className="text-xs mt-1">Try adjusting your search or category filter</p>
              </div>
            )}
          </div>

          {/* Load more button */}
          {getAllFonts().length > maxResults && getFilteredFonts().length === maxResults && (
            <div className="p-3 border-t border-gray-200 dark:border-gray-700">
              <button
                onClick={() => {
                  // Implement load more functionality
                }}
                className="w-full py-2 text-sm text-primary-600 hover:text-primary-700 font-medium transition-colors duration-200"
              >
                Load more fonts...
              </button>
            </div>
          )}
        </div>
      )}

      {/* Font information */}
      <div className="flex items-center justify-between text-xs text-gray-500 dark:text-gray-400">
        <div className="flex items-center space-x-4">
          <span>
            {getFilteredFonts().length} font{getFilteredFonts().length !== 1 ? 's' : ''} available
          </span>
          {favoritesFonts.length > 0 && (
            <span>{favoritesFonts.length} favorite{favoritesFonts.length !== 1 ? 's' : ''}</span>
          )}
        </div>
        
        <div className="flex items-center space-x-2">
          <span className="text-xs">Powered by Google Fonts</span>
          <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
            <path d="M12.017 0C5.396 0 .029 5.367.029 11.987c0 6.62 5.367 11.987 11.988 11.987s11.987-5.367 11.987-11.987C24.004 5.367 18.637.001 12.017.001zM8.449 7.865c.926 0 1.685.759 1.685 1.685s-.759 1.685-1.685 1.685-1.685-.759-1.685-1.685.759-1.685 1.685-1.685zm7.102 0c.926 0 1.685.759 1.685 1.685s-.759 1.685-1.685 1.685-1.685-.759-1.685-1.685.759-1.685 1.685-1.685z"/>
          </svg>
        </div>
      </div>
    </div>
  );

  return (
    <div className="relative">
      <PremiumFeatureLock
        feature="advanced_typography"
        requiredTier="plus"
        showPreview={true}
      >
        <FontSelectorContent />
      </PremiumFeatureLock>
    </div>
  );
};

export default FontFamilySelector;