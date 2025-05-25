'use client';

import { useState, useEffect, useRef } from 'react';
import PremiumFeatureLock from './PremiumFeatureLock';

const CustomCSSEditor = ({
  value = '',
  onChange,
  label = 'Custom CSS',
  placeholder = '/* Add your custom CSS here */',
  maxHeight = '400px',
  showPreview = true,
  showTemplates = true,
  className = ''
}) => {
  const [css, setCss] = useState(value);
  const [isValid, setIsValid] = useState(true);
  const [errors, setErrors] = useState([]);
  const [activeTab, setActiveTab] = useState('editor');
  const [savedSnippets, setSavedSnippets] = useState([]);
  const [isFullscreen, setIsFullscreen] = useState(false);
  
  const editorRef = useRef(null);
  const previewRef = useRef(null);

  // CSS Templates
  const cssTemplates = {
    'glassmorphism': {
      name: 'Glassmorphism Effect',
      description: 'Modern glass-like transparent effect',
      css: `/* Glassmorphism Cards */
.card {
  background: rgba(255, 255, 255, 0.25);
  backdrop-filter: blur(10px);
  border: 1px solid rgba(255, 255, 255, 0.18);
  border-radius: 16px;
  box-shadow: 0 8px 32px 0 rgba(31, 38, 135, 0.37);
}

.dark .card {
  background: rgba(255, 255, 255, 0.1);
  border: 1px solid rgba(255, 255, 255, 0.1);
}`
    },
    'gradient-buttons': {
      name: 'Gradient Buttons',
      description: 'Eye-catching gradient button styles',
      css: `/* Gradient Buttons */
.btn-gradient {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  border: none;
  color: white;
  transition: all 0.3s ease;
}

.btn-gradient:hover {
  background: linear-gradient(135deg, #764ba2 0%, #667eea 100%);
  transform: translateY(-2px);
  box-shadow: 0 10px 20px rgba(102, 126, 234, 0.4);
}`
    },
    'custom-scrollbar': {
      name: 'Custom Scrollbar',
      description: 'Styled scrollbar for better aesthetics',
      css: `/* Custom Scrollbar */
::-webkit-scrollbar {
  width: 8px;
}

::-webkit-scrollbar-track {
  background: rgba(0, 0, 0, 0.1);
  border-radius: 4px;
}

::-webkit-scrollbar-thumb {
  background: linear-gradient(180deg, #667eea, #764ba2);
  border-radius: 4px;
}

::-webkit-scrollbar-thumb:hover {
  background: linear-gradient(180deg, #764ba2, #667eea);
}`
    },
    'animated-underlines': {
      name: 'Animated Underlines',
      description: 'Smooth underline animations for links',
      css: `/* Animated Underlines */
.animated-link {
  position: relative;
  text-decoration: none;
  transition: color 0.3s ease;
}

.animated-link::after {
  content: '';
  position: absolute;
  width: 0;
  height: 2px;
  bottom: -2px;
  left: 0;
  background: linear-gradient(90deg, #667eea, #764ba2);
  transition: width 0.3s ease;
}

.animated-link:hover::after {
  width: 100%;
}`
    },
    'floating-elements': {
      name: 'Floating Elements',
      description: 'Subtle floating animation effects',
      css: `/* Floating Elements */
@keyframes float {
  0% { transform: translateY(0px); }
  50% { transform: translateY(-10px); }
  100% { transform: translateY(0px); }
}

.floating-card {
  animation: float 3s ease-in-out infinite;
}

.floating-card:hover {
  animation-play-state: paused;
  transform: translateY(-5px);
}`
    },
    'neon-glow': {
      name: 'Neon Glow Effect',
      description: 'Vibrant neon glow for dark themes',
      css: `/* Neon Glow Effect */
.neon-text {
  color: #fff;
  text-shadow:
    0 0 5px #00ffff,
    0 0 10px #00ffff,
    0 0 15px #00ffff,
    0 0 20px #00ffff;
}

.neon-border {
  border: 2px solid #00ffff;
  box-shadow:
    0 0 5px #00ffff,
    inset 0 0 5px #00ffff;
  border-radius: 8px;
}`
    }
  };

  // Basic CSS validation
  const validateCSS = (cssText) => {
    const errors = [];
    
    // Check for basic syntax issues
    const openBraces = (cssText.match(/{/g) || []).length;
    const closeBraces = (cssText.match(/}/g) || []).length;
    
    if (openBraces !== closeBraces) {
      errors.push('Unmatched braces detected');
    }
    
    // Check for unclosed strings
    const singleQuotes = (cssText.match(/'/g) || []).length;
    const doubleQuotes = (cssText.match(/"/g) || []).length;
    
    if (singleQuotes % 2 !== 0) {
      errors.push('Unclosed single quote detected');
    }
    if (doubleQuotes % 2 !== 0) {
      errors.push('Unclosed double quote detected');
    }
    
    // Check for dangerous content
    const dangerousPatterns = [
      /@import\s+url\(/i,
      /javascript:/i,
      /expression\(/i,
      /behavior:/i
    ];
    
    dangerousPatterns.forEach(pattern => {
      if (pattern.test(cssText)) {
        errors.push('Potentially unsafe CSS detected');
      }
    });
    
    return errors;
  };

  // Handle CSS change
  const handleCSSChange = (newCSS) => {
    setCss(newCSS);
    const validationErrors = validateCSS(newCSS);
    setErrors(validationErrors);
    setIsValid(validationErrors.length === 0);
    onChange?.(newCSS);
  };

  // Apply CSS to preview
  useEffect(() => {
    if (showPreview && previewRef.current) {
      // Remove previous custom styles
      const existingStyle = document.getElementById('custom-css-preview');
      if (existingStyle) {
        existingStyle.remove();
      }
      
      // Add new styles if valid
      if (css && isValid) {
        const style = document.createElement('style');
        style.id = 'custom-css-preview';
        style.textContent = css;
        document.head.appendChild(style);
      }
    }
  }, [css, isValid, showPreview]);

  // Save CSS snippet
  const saveSnippet = () => {
    const name = prompt('Enter a name for this CSS snippet:');
    if (name && css.trim()) {
      const snippet = {
        id: Date.now(),
        name,
        css: css.trim(),
        createdAt: new Date().toISOString()
      };
      setSavedSnippets(prev => [...prev, snippet]);
    }
  };

  // Load CSS snippet
  const loadSnippet = (snippet) => {
    if (confirm(`Replace current CSS with "${snippet.name}"?`)) {
      handleCSSChange(snippet.css);
    }
  };

  // Insert template
  const insertTemplate = (template) => {
    const templateCSS = cssTemplates[template].css;
    if (css.trim()) {
      if (confirm('Add this template to your existing CSS?')) {
        handleCSSChange(css + '\n\n' + templateCSS);
      }
    } else {
      handleCSSChange(templateCSS);
    }
  };

  // Format CSS (basic)
  const formatCSS = () => {
    let formatted = css
      .replace(/\s*{\s*/g, ' {\n  ')
      .replace(/;\s*/g, ';\n  ')
      .replace(/\s*}\s*/g, '\n}\n\n')
      .replace(/,\s*/g, ',\n');
    
    handleCSSChange(formatted.trim());
  };

  // Line numbers
  const getLineNumbers = () => {
    const lines = css.split('\n');
    return lines.map((_, index) => index + 1).join('\n');
  };

  const CSSEditorContent = () => (
    <div className={`space-y-4 ${className} ${isFullscreen ? 'fixed inset-0 z-50 bg-white dark:bg-gray-900 p-6' : ''}`}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <label className="block text-sm font-medium text-gray-900 dark:text-white">
            {label}
          </label>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
            Add custom CSS to personalize your interface
          </p>
        </div>
        
        <div className="flex items-center space-x-2">
          {/* Validation status */}
          <div className={`flex items-center space-x-1 text-xs ${
            isValid ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'
          }`}>
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              {isValid ? (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              ) : (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              )}
            </svg>
            <span>{isValid ? 'Valid' : 'Invalid'}</span>
          </div>
          
          {/* Fullscreen toggle */}
          <button
            onClick={() => setIsFullscreen(!isFullscreen)}
            className="p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors duration-200"
            title={isFullscreen ? 'Exit fullscreen' : 'Enter fullscreen'}
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              {isFullscreen ? (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              ) : (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4" />
              )}
            </svg>
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200 dark:border-gray-700">
        <nav className="-mb-px flex space-x-8">
          {[
            { id: 'editor', name: 'Editor' },
            { id: 'templates', name: 'Templates' },
            { id: 'snippets', name: 'Saved' },
            { id: 'preview', name: 'Preview' }
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`py-2 px-1 border-b-2 font-medium text-sm transition-colors duration-200 ${
                activeTab === tab.id
                  ? 'border-primary-500 text-primary-600 dark:text-primary-400'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-300'
              }`}
            >
              {tab.name}
              {tab.id === 'snippets' && savedSnippets.length > 0 && (
                <span className="ml-1 inline-flex items-center justify-center px-1.5 py-0.5 rounded-full text-xs font-medium bg-primary-100 text-primary-800 dark:bg-primary-900 dark:text-primary-300">
                  {savedSnippets.length}
                </span>
              )}
            </button>
          ))}
        </nav>
      </div>

      {/* Error display */}
      {errors.length > 0 && (
        <div className="p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
          <div className="flex items-start">
            <svg className="w-5 h-5 text-red-400 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <div className="ml-3">
              <h3 className="text-sm font-medium text-red-800 dark:text-red-200">
                CSS Validation Errors
              </h3>
              <ul className="mt-1 text-sm text-red-700 dark:text-red-300 list-disc list-inside">
                {errors.map((error, index) => (
                  <li key={index}>{error}</li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      )}

      {/* Editor Tab */}
      {activeTab === 'editor' && (
        <div className="space-y-4">
          {/* Toolbar */}
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <button
                onClick={formatCSS}
                className="px-3 py-1 text-xs bg-gray-100 text-gray-700 rounded hover:bg-gray-200 transition-colors duration-200 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600"
              >
                Format
              </button>
              <button
                onClick={() => handleCSSChange('')}
                className="px-3 py-1 text-xs bg-gray-100 text-gray-700 rounded hover:bg-gray-200 transition-colors duration-200 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600"
              >
                Clear
              </button>
              <button
                onClick={saveSnippet}
                disabled={!css.trim()}
                className="px-3 py-1 text-xs bg-primary-100 text-primary-700 rounded hover:bg-primary-200 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200 dark:bg-primary-900 dark:text-primary-300"
              >
                Save Snippet
              </button>
            </div>
            
            <div className="text-xs text-gray-500 dark:text-gray-400">
              {css.split('\n').length} lines • {css.length} characters
            </div>
          </div>

          {/* CSS Editor */}
          <div className="relative border border-gray-300 dark:border-gray-600 rounded-lg overflow-hidden">
            <div className="flex">
              {/* Line numbers */}
              <div className="bg-gray-50 dark:bg-gray-800 p-4 text-xs text-gray-500 dark:text-gray-400 font-mono select-none min-w-[3rem] text-right">
                <pre>{getLineNumbers()}</pre>
              </div>
              
              {/* Editor */}
              <div className="flex-1 relative">
                <textarea
                  ref={editorRef}
                  value={css}
                  onChange={(e) => handleCSSChange(e.target.value)}
                  placeholder={placeholder}
                  className="w-full h-64 p-4 bg-white dark:bg-gray-900 text-gray-900 dark:text-white font-mono text-sm resize-none focus:outline-none"
                  style={{ maxHeight }}
                  spellCheck={false}
                />
              </div>
            </div>
          </div>

          {/* Quick help */}
          <details className="group">
            <summary className="cursor-pointer text-xs text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 flex items-center">
              <svg className="w-3 h-3 mr-1 transform group-open:rotate-90 transition-transform duration-200" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
              CSS Tips & Best Practices
            </summary>
            
            <div className="mt-2 p-3 bg-gray-50 dark:bg-gray-800 rounded-lg text-xs text-gray-600 dark:text-gray-400 space-y-2">
              <div><strong>Selectors:</strong> Use .class-name for styling existing components</div>
              <div><strong>Variables:</strong> Access theme colors with var(--color-primary-500)</div>
              <div><strong>Dark mode:</strong> Use .dark selector for dark theme styles</div>
              <div><strong>Responsive:</strong> Use @media queries for mobile-first design</div>
              <div><strong>Performance:</strong> Avoid !important, prefer specific selectors</div>
            </div>
          </details>
        </div>
      )}

      {/* Templates Tab */}
      {activeTab === 'templates' && showTemplates && (
        <div className="space-y-4">
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Choose from pre-built CSS templates to quickly style your interface
          </p>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {Object.entries(cssTemplates).map(([key, template]) => (
              <div
                key={key}
                className="p-4 border border-gray-200 dark:border-gray-700 rounded-lg hover:border-primary-300 dark:hover:border-primary-600 transition-colors duration-200 cursor-pointer group"
                onClick={() => insertTemplate(key)}
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <h3 className="font-medium text-gray-900 dark:text-white group-hover:text-primary-600 dark:group-hover:text-primary-400 transition-colors duration-200">
                      {template.name}
                    </h3>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                      {template.description}
                    </p>
                  </div>
                  <svg className="w-5 h-5 text-gray-400 group-hover:text-primary-500 transition-colors duration-200" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                  </svg>
                </div>
                
                {/* Preview code */}
                <div className="mt-3 p-2 bg-gray-50 dark:bg-gray-800 rounded text-xs font-mono text-gray-600 dark:text-gray-400 overflow-hidden">
                  <pre className="truncate">
                    {template.css.split('\n')[0]}...
                  </pre>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Saved Snippets Tab */}
      {activeTab === 'snippets' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Your saved CSS snippets
            </p>
            {savedSnippets.length > 0 && (
              <button
                onClick={() => {
                  if (confirm('Delete all saved snippets?')) {
                    setSavedSnippets([]);
                  }
                }}
                className="text-xs text-red-600 hover:text-red-700 dark:text-red-400"
              >
                Clear All
              </button>
            )}
          </div>
          
          {savedSnippets.length === 0 ? (
            <div className="text-center py-8">
              <svg className="w-12 h-12 mx-auto text-gray-300 dark:text-gray-600 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              <p className="text-sm text-gray-500 dark:text-gray-400">No saved snippets yet</p>
              <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">
                Save CSS snippets from the editor to reuse them later
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {savedSnippets.map(snippet => (
                <div
                  key={snippet.id}
                  className="p-3 border border-gray-200 dark:border-gray-700 rounded-lg"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <h3 className="font-medium text-gray-900 dark:text-white">
                        {snippet.name}
                      </h3>
                      <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                        Saved on {new Date(snippet.createdAt).toLocaleDateString()}
                      </p>
                    </div>
                    
                    <div className="flex items-center space-x-2">
                      <button
                        onClick={() => loadSnippet(snippet)}
                        className="text-xs px-2 py-1 bg-primary-100 text-primary-700 rounded hover:bg-primary-200 transition-colors duration-200 dark:bg-primary-900 dark:text-primary-300"
                      >
                        Load
                      </button>
                      <button
                        onClick={() => {
                          setSavedSnippets(prev => prev.filter(s => s.id !== snippet.id));
                        }}
                        className="text-xs px-2 py-1 bg-red-100 text-red-700 rounded hover:bg-red-200 transition-colors duration-200 dark:bg-red-900 dark:text-red-300"
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                  
                  <div className="mt-2 p-2 bg-gray-50 dark:bg-gray-800 rounded text-xs font-mono text-gray-600 dark:text-gray-400 max-h-24 overflow-y-auto">
                    <pre>{snippet.css}</pre>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Preview Tab */}
      {activeTab === 'preview' && showPreview && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Live preview of your custom CSS
            </p>
            <div className="flex items-center space-x-2">
              <span className={`text-xs ${isValid ? 'text-green-600' : 'text-red-600'}`}>
                {isValid ? 'CSS Applied' : 'CSS Not Applied'}
              </span>
              <div className={`w-2 h-2 rounded-full ${isValid ? 'bg-green-500' : 'bg-red-500'}`} />
            </div>
          </div>
          
          <div ref={previewRef} className="p-6 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg">
            {/* Sample elements for preview */}
            <div className="space-y-4">
              <div className="card p-4">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Sample Card</h3>
                <p className="text-gray-600 dark:text-gray-400">
                  This card will reflect your custom CSS changes.
                </p>
                <button className="btn-primary mt-3">Sample Button</button>
              </div>
              
              <div className="space-y-2">
                <a href="#" className="animated-link text-primary-600">Sample Link</a>
                <p className="neon-text">Neon text effect</p>
                <div className="neon-border p-2 inline-block">Neon border</div>
              </div>
              
              <div className="floating-card p-3 bg-gray-100 dark:bg-gray-800 rounded">
                Floating card animation
              </div>
            </div>
          </div>
          
          {!isValid && (
            <div className="text-sm text-red-600 dark:text-red-400">
              Fix CSS errors to see the preview
            </div>
          )}
        </div>
      )}
    </div>
  );

  return (
    <PremiumFeatureLock
      feature="custom_css"
      requiredTier="enterprise"
      showPreview={true}
    >
      <CSSEditorContent />
    </PremiumFeatureLock>
  );
};

export default CustomCSSEditor;