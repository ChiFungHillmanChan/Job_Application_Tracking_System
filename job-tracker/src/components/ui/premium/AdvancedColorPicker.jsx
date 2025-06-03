'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import PremiumFeatureLock from './PremiumFeatureLock';

const AdvancedColorPicker = ({ 
  value = '#0ea5e9', 
  onChange, 
  label = 'Color',
  showPresets = true,
  showHarmony = true,
  className = ''
}) => {
  const [color, setColor] = useState(value);
  const [hsl, setHsl] = useState({ h: 0, s: 0, l: 0 });
  const [rgb, setRgb] = useState({ r: 0, g: 0, b: 0 });
  const [isOpen, setIsOpen] = useState(false);
  const [inputMode, setInputMode] = useState('hsl');
  const [savedColors, setSavedColors] = useState([]);
  const [harmonyType, setHarmonyType] = useState('complementary');
  
  const pickerRef = useRef(null);

  // Convert hex to HSL
  const hexToHsl = useCallback((hex) => {
    const r = parseInt(hex.slice(1, 3), 16) / 255;
    const g = parseInt(hex.slice(3, 5), 16) / 255;
    const b = parseInt(hex.slice(5, 7), 16) / 255;

    const max = Math.max(r, g, b);
    const min = Math.min(r, g, b);
    let h, s, l = (max + min) / 2;

    if (max === min) {
      h = s = 0;
    } else {
      const d = max - min;
      s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
      switch (max) {
        case r: h = (g - b) / d + (g < b ? 6 : 0); break;
        case g: h = (b - r) / d + 2; break;
        case b: h = (r - g) / d + 4; break;
      }
      h /= 6;
    }

    return {
      h: Math.round(h * 360),
      s: Math.round(s * 100),
      l: Math.round(l * 100)
    };
  }, []);

  // Convert HSL to hex
  const hslToHex = useCallback((h, s, l) => {
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
  }, []);

  // Convert hex to RGB
  const hexToRgb = useCallback((hex) => {
    return {
      r: parseInt(hex.slice(1, 3), 16),
      g: parseInt(hex.slice(3, 5), 16),
      b: parseInt(hex.slice(5, 7), 16)
    };
  }, []);

  // Generate color harmony
  const generateHarmony = useCallback((baseHue, type) => {
    const colors = [];
    
    switch (type) {
      case 'complementary':
        colors.push(
          hslToHex(baseHue, hsl.s, hsl.l),
          hslToHex((baseHue + 180) % 360, hsl.s, hsl.l)
        );
        break;
      case 'triadic':
        colors.push(
          hslToHex(baseHue, hsl.s, hsl.l),
          hslToHex((baseHue + 120) % 360, hsl.s, hsl.l),
          hslToHex((baseHue + 240) % 360, hsl.s, hsl.l)
        );
        break;
      case 'analogous':
        colors.push(
          hslToHex((baseHue - 30 + 360) % 360, hsl.s, hsl.l),
          hslToHex(baseHue, hsl.s, hsl.l),
          hslToHex((baseHue + 30) % 360, hsl.s, hsl.l)
        );
        break;
      case 'tetradic':
        colors.push(
          hslToHex(baseHue, hsl.s, hsl.l),
          hslToHex((baseHue + 90) % 360, hsl.s, hsl.l),
          hslToHex((baseHue + 180) % 360, hsl.s, hsl.l),
          hslToHex((baseHue + 270) % 360, hsl.s, hsl.l)
        );
        break;
    }
    
    return colors;
  }, [hsl.s, hsl.l, hslToHex]);

  // Update color from different sources
  useEffect(() => {
    if (value !== color) {
      setColor(value);
      const newHsl = hexToHsl(value);
      const newRgb = hexToRgb(value);
      setHsl(newHsl);
      setRgb(newRgb);
    }
  }, [value, color, hexToHsl, hexToRgb]);

  // FIXED: Simplified color change handler
  const handleColorChange = useCallback((newColor) => {
    setColor(newColor);
    const newHsl = hexToHsl(newColor);
    const newRgb = hexToRgb(newColor);
    setHsl(newHsl);
    setRgb(newRgb);
    onChange?.(newColor);
  }, [hexToHsl, hexToRgb, onChange]);

  // Handle HSL input changes
  const handleHslChange = (component, value) => {
    const newHsl = { ...hsl, [component]: value };
    setHsl(newHsl);
    const newColor = hslToHex(newHsl.h, newHsl.s, newHsl.l);
    setColor(newColor);
    setRgb(hexToRgb(newColor));
    onChange?.(newColor);
  };

  // Handle RGB input changes
  const handleRgbChange = (component, value) => {
    const newRgb = { ...rgb, [component]: value };
    setRgb(newRgb);
    const hex = `#${newRgb.r.toString(16).padStart(2, '0')}${newRgb.g.toString(16).padStart(2, '0')}${newRgb.b.toString(16).padStart(2, '0')}`;
    setColor(hex);
    setHsl(hexToHsl(hex));
    onChange?.(hex);
  };

  // Preset colors
  const presetColors = [
    '#ef4444', '#f97316', '#f59e0b', '#eab308', '#84cc16',
    '#22c55e', '#10b981', '#14b8a6', '#06b6d4', '#0ea5e9',
    '#3b82f6', '#6366f1', '#8b5cf6', '#a855f7', '#d946ef',
    '#ec4899', '#f43f5e', '#64748b', '#475569', '#1e293b'
  ];

  // Close picker when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (pickerRef.current && !pickerRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Check contrast ratio
  const getContrastRatio = (color) => {
    const rgb = hexToRgb(color);
    const luminance = (0.299 * rgb.r + 0.587 * rgb.g + 0.114 * rgb.b) / 255;
    return luminance > 0.5 ? 'dark' : 'light';
  };

  const ColorPickerContent = () => (
    <div className={`space-y-4 ${className}`} ref={pickerRef}>
      {/* Label and current selection */}
      <div>
        {label && (
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            {label}
          </label>
        )}
        
        {/* Color display button */}
        <button
          type="button"
          onClick={() => setIsOpen(!isOpen)}
          className="w-full h-12 rounded-lg border-2 border-gray-300 dark:border-gray-600 focus:outline-none focus:ring-2 focus:ring-primary-500 transition-all duration-200 overflow-hidden"
          style={{ backgroundColor: color }}
        >
          <span 
            className={`block w-full h-full flex items-center justify-center font-medium transition-all duration-200 ${
              getContrastRatio(color) === 'light' ? 'text-white' : 'text-gray-900'
            }`}
          >
            {color.toUpperCase()}
          </span>
        </button>
      </div>

      {/* FIXED: Simplified dropdown without complex interaction tracking */}
      {isOpen && (
        <div className="space-y-4 p-4 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 shadow-lg animate-fade-in">
          {/* Color wheel area */}
          <div className="space-y-3">
            {/* Hue slider */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Hue
              </label>
              <div className="relative h-4 rounded-lg overflow-hidden bg-gradient-to-r from-red-500 via-yellow-500 via-green-500 via-cyan-500 via-blue-500 via-purple-500 to-red-500">
                <input
                  type="range"
                  min="0"
                  max="360"
                  value={hsl.h}
                  onChange={(e) => handleHslChange('h', parseInt(e.target.value))}
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                />
                <div 
                  className="absolute top-0 w-1 h-full bg-white border border-gray-400 rounded-sm pointer-events-none"
                  style={{ left: `${(hsl.h / 360) * 100}%`, transform: 'translateX(-50%)' }}
                />
              </div>
            </div>

            {/* Saturation slider */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Saturation
              </label>
              <div 
                className="relative h-4 rounded-lg overflow-hidden"
                style={{ 
                  background: `linear-gradient(to right, hsl(${hsl.h}, 0%, ${hsl.l}%), hsl(${hsl.h}, 100%, ${hsl.l}%))` 
                }}
              >
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={hsl.s}
                  onChange={(e) => handleHslChange('s', parseInt(e.target.value))}
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                />
                <div 
                  className="absolute top-0 w-1 h-full bg-white border border-gray-400 rounded-sm pointer-events-none"
                  style={{ left: `${hsl.s}%`, transform: 'translateX(-50%)' }}
                />
              </div>
            </div>

            {/* Lightness slider */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Lightness
              </label>
              <div 
                className="relative h-4 rounded-lg overflow-hidden"
                style={{ 
                  background: `linear-gradient(to right, hsl(${hsl.h}, ${hsl.s}%, 0%), hsl(${hsl.h}, ${hsl.s}%, 50%), hsl(${hsl.h}, ${hsl.s}%, 100%))` 
                }}
              >
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={hsl.l}
                  onChange={(e) => handleHslChange('l', parseInt(e.target.value))}
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                />
                <div 
                  className="absolute top-0 w-1 h-full bg-white border border-gray-400 rounded-sm pointer-events-none"
                  style={{ left: `${hsl.l}%`, transform: 'translateX(-50%)' }}
                />
              </div>
            </div>
          </div>

          {/* Input mode selector */}
          <div className="flex space-x-1 bg-gray-100 dark:bg-gray-700 rounded-lg p-1">
            {['hsl', 'rgb', 'hex'].map((mode) => (
              <button
                key={mode}
                onClick={() => setInputMode(mode)}
                className={`flex-1 py-1 px-2 text-xs font-medium rounded transition-colors duration-200 ${
                  inputMode === mode
                    ? 'bg-white dark:bg-gray-600 text-gray-900 dark:text-white shadow-sm'
                    : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
                }`}
              >
                {mode.toUpperCase()}
              </button>
            ))}
          </div>

          {/* Color inputs */}
          <div className="grid grid-cols-3 gap-2">
            {inputMode === 'hsl' && (
              <>
                <div>
                  <label className="block text-xs text-gray-600 dark:text-gray-400 mb-1">H</label>
                  <input
                    type="number"
                    min="0"
                    max="360"
                    value={hsl.h}
                    onChange={(e) => handleHslChange('h', parseInt(e.target.value) || 0)}
                    className="w-full px-2 py-1 text-xs border border-gray-300 dark:border-gray-600 rounded focus:outline-none focus:ring-1 focus:ring-primary-500 dark:bg-gray-700 dark:text-white"
                  />
                </div>
                <div>
                  <label className="block text-xs text-gray-600 dark:text-gray-400 mb-1">S</label>
                  <input
                    type="number"
                    min="0"
                    max="100"
                    value={hsl.s}
                    onChange={(e) => handleHslChange('s', parseInt(e.target.value) || 0)}
                    className="w-full px-2 py-1 text-xs border border-gray-300 dark:border-gray-600 rounded focus:outline-none focus:ring-1 focus:ring-primary-500 dark:bg-gray-700 dark:text-white"
                  />
                </div>
                <div>
                  <label className="block text-xs text-gray-600 dark:text-gray-400 mb-1">L</label>
                  <input
                    type="number"
                    min="0"
                    max="100"
                    value={hsl.l}
                    onChange={(e) => handleHslChange('l', parseInt(e.target.value) || 0)}
                    className="w-full px-2 py-1 text-xs border border-gray-300 dark:border-gray-600 rounded focus:outline-none focus:ring-1 focus:ring-primary-500 dark:bg-gray-700 dark:text-white"
                  />
                </div>
              </>
            )}
            
            {inputMode === 'rgb' && (
              <>
                <div>
                  <label className="block text-xs text-gray-600 dark:text-gray-400 mb-1">R</label>
                  <input
                    type="number"
                    min="0"
                    max="255"
                    value={rgb.r}
                    onChange={(e) => handleRgbChange('r', parseInt(e.target.value) || 0)}
                    className="w-full px-2 py-1 text-xs border border-gray-300 dark:border-gray-600 rounded focus:outline-none focus:ring-1 focus:ring-primary-500 dark:bg-gray-700 dark:text-white"
                  />
                </div>
                <div>
                  <label className="block text-xs text-gray-600 dark:text-gray-400 mb-1">G</label>
                  <input
                    type="number"
                    min="0"
                    max="255"
                    value={rgb.g}
                    onChange={(e) => handleRgbChange('g', parseInt(e.target.value) || 0)}
                    className="w-full px-2 py-1 text-xs border border-gray-300 dark:border-gray-600 rounded focus:outline-none focus:ring-1 focus:ring-primary-500 dark:bg-gray-700 dark:text-white"
                  />
                </div>
                <div>
                  <label className="block text-xs text-gray-600 dark:text-gray-400 mb-1">B</label>
                  <input
                    type="number"
                    min="0"
                    max="255"
                    value={rgb.b}
                    onChange={(e) => handleRgbChange('b', parseInt(e.target.value) || 0)}
                    className="w-full px-2 py-1 text-xs border border-gray-300 dark:border-gray-600 rounded focus:outline-none focus:ring-1 focus:ring-primary-500 dark:bg-gray-700 dark:text-white"
                  />
                </div>
              </>
            )}
            
            {inputMode === 'hex' && (
              <div className="col-span-3">
                <label className="block text-xs text-gray-600 dark:text-gray-400 mb-1">Hex</label>
                <input
                  type="text"
                  value={color}
                  onChange={(e) => {
                    const hex = e.target.value;
                    if (/^#[0-9A-F]{6}$/i.test(hex)) {
                      handleColorChange(hex);
                    }
                  }}
                  className="w-full px-2 py-1 text-xs border border-gray-300 dark:border-gray-600 rounded focus:outline-none focus:ring-1 focus:ring-primary-500 dark:bg-gray-700 dark:text-white font-mono"
                  placeholder="#000000"
                />
              </div>
            )}
          </div>

          {/* Preset colors */}
          {showPresets && (
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Preset Colors
              </label>
              <div className="grid grid-cols-10 gap-1">
                {presetColors.map((presetColor, index) => (
                  <button
                    key={index}
                    onClick={() => handleColorChange(presetColor)}
                    className={`w-6 h-6 rounded border-2 transition-all duration-200 hover:scale-110 ${
                      color === presetColor 
                        ? 'border-gray-900 dark:border-white' 
                        : 'border-gray-300 dark:border-gray-600'
                    }`}
                    style={{ backgroundColor: presetColor }}
                    title={presetColor}
                  />
                ))}
              </div>
            </div>
          )}

          {/* Color harmony */}
          {showHarmony && (
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Color Harmony
              </label>
              <div className="space-y-2">
                <select
                  value={harmonyType}
                  onChange={(e) => setHarmonyType(e.target.value)}
                  className="w-full px-2 py-1 text-sm border border-gray-300 dark:border-gray-600 rounded focus:outline-none focus:ring-1 focus:ring-primary-500 dark:bg-gray-700 dark:text-white"
                >
                  <option value="complementary">Complementary</option>
                  <option value="triadic">Triadic</option>
                  <option value="analogous">Analogous</option>
                  <option value="tetradic">Tetradic</option>
                </select>
                
                <div className="flex space-x-1">
                  {generateHarmony(hsl.h, harmonyType).map((harmonyColor, index) => (
                    <button
                      key={index}
                      onClick={() => handleColorChange(harmonyColor)}
                      className="flex-1 h-8 rounded border border-gray-300 dark:border-gray-600 hover:scale-105 transition-transform duration-200"
                      style={{ backgroundColor: harmonyColor }}
                      title={harmonyColor}
                    />
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Saved colors */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                Saved Colors
              </label>
              <button
                onClick={() => {
                  const newSaved = [...savedColors, color];
                  setSavedColors(newSaved.slice(-10)); // Keep last 10
                }}
                className="text-xs px-2 py-1 bg-primary-100 text-primary-700 rounded hover:bg-primary-200 transition-colors duration-200 dark:bg-primary-900 dark:text-primary-300"
              >
                Save
              </button>
            </div>
            
            <div className="flex flex-wrap gap-1">
              {savedColors.length === 0 ? (
                <p className="text-xs text-gray-500 dark:text-gray-400 italic">
                  No saved colors yet
                </p>
              ) : (
                savedColors.map((savedColor, index) => (
                  <div key={index} className="relative group">
                    <button
                      onClick={() => handleColorChange(savedColor)}
                      className="w-6 h-6 rounded border border-gray-300 dark:border-gray-600 hover:scale-110 transition-transform duration-200"
                      style={{ backgroundColor: savedColor }}
                      title={savedColor}
                    />
                    <button
                      onClick={() => setSavedColors(savedColors.filter((_, i) => i !== index))}
                      className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 text-white rounded-full text-xs opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex items-center justify-center"
                    >
                      ×
                    </button>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Accessibility info */}
          <div className="p-2 bg-gray-50 dark:bg-gray-700 rounded text-xs">
            <div className="flex justify-between items-center">
              <span className="text-gray-600 dark:text-gray-400">Contrast:</span>
              <span className={`font-medium ${
                getContrastRatio(color) === 'light' ? 'text-gray-900 dark:text-white' : 'text-gray-600 dark:text-gray-400'
              }`}>
                Best with {getContrastRatio(color) === 'light' ? 'dark' : 'light'} text
              </span>
            </div>
          </div>
        </div>
      )}
    </div>
  );

  return (
    <PremiumFeatureLock
      feature="custom_colors"
      requiredTier="plus"
      showPreview={true}
    >
      <ColorPickerContent />
    </PremiumFeatureLock>
  );
};

export default AdvancedColorPicker;