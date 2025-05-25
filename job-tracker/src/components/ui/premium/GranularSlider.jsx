'use client';

import { useState, useEffect, useRef } from 'react';
import PremiumFeatureLock from './PremiumFeatureLock';

const GranularSlider = ({
  value = 16,
  onChange,
  min = 0,
  max = 100,
  step = 1,
  unit = 'px',
  label = 'Value',
  description,
  presets = [],
  showInput = true,
  showPresets = true,
  className = '',
  requiredTier = 'plus'
}) => {
  const [currentValue, setCurrentValue] = useState(value);
  const [isDragging, setIsDragging] = useState(false);
  const [isInteracting, setIsInteracting] = useState(false);
  const [showTooltip, setShowTooltip] = useState(false);
  const sliderRef = useRef(null);
  const inputRef = useRef(null);

  // Update internal value when prop changes
  useEffect(() => {
    setCurrentValue(value);
  }, [value]);

const handleValueChange = (newValue) => {
  const clampedValue = Math.min(Math.max(newValue, min), max);
  const steppedValue = Math.round(clampedValue / step) * step;
  
  setIsInteracting(true);
  setCurrentValue(steppedValue);
  onChange?.(steppedValue);
  
  // Clear interaction flag after a delay
  setTimeout(() => {
    setIsInteracting(false);
  }, 500);
};

  // Handle slider input
  const handleSliderChange = (e) => {
    handleValueChange(parseFloat(e.target.value));
  };

  // Handle direct input
  const handleInputChange = (e) => {
    const newValue = parseFloat(e.target.value);
    if (!isNaN(newValue)) {
      handleValueChange(newValue);
    }
  };

  // Handle preset selection
  const handlePresetSelect = (presetValue) => {
    handleValueChange(presetValue);
  };

  // Calculate percentage for visual indicator
  const percentage = ((currentValue - min) / (max - min)) * 100;

  // Format value for display
  const formatValue = (val) => {
    if (unit === 'rem') {
      return `${val}${unit}`;
    } else if (unit === '%') {
      return `${val}%`;
    } else if (unit === 'px') {
      return `${val}px`;
    } else if (unit === 'em') {
      return `${val}em`;
    } else if (unit === 'x') {
      return `${val}x`;
    }
    return `${val}${unit}`;
  };

  // Get step suggestions based on unit
  const getStepSuggestions = () => {
    switch (unit) {
      case 'px':
        return [1, 2, 4, 8];
      case 'rem':
      case 'em':
        return [0.125, 0.25, 0.5, 1];
      case '%':
        return [1, 5, 10, 25];
      default:
        return [0.1, 0.5, 1, 2];
    }
  };

  // Common presets based on unit
  const getCommonPresets = () => {
    if (presets.length > 0) return presets;
    
    switch (unit) {
      case 'px':
        if (label.toLowerCase().includes('font') || label.toLowerCase().includes('text')) {
          return [
            { label: 'XS', value: 12 },
            { label: 'SM', value: 14 },
            { label: 'Base', value: 16 },
            { label: 'LG', value: 18 },
            { label: 'XL', value: 20 },
            { label: 'XXL', value: 24 }
          ];
        } else {
          return [
            { label: 'None', value: 0 },
            { label: 'XS', value: 4 },
            { label: 'SM', value: 8 },
            { label: 'MD', value: 16 },
            { label: 'LG', value: 24 },
            { label: 'XL', value: 32 }
          ];
        }
      case 'rem':
        return [
          { label: 'XS', value: 0.25 },
          { label: 'SM', value: 0.5 },
          { label: 'MD', value: 1 },
          { label: 'LG', value: 1.5 },
          { label: 'XL', value: 2 },
          { label: 'XXL', value: 3 }
        ];
      case '%':
        return [
          { label: '0%', value: 0 },
          { label: '25%', value: 25 },
          { label: '50%', value: 50 },
          { label: '75%', value: 75 },
          { label: '100%', value: 100 }
        ];
      default:
        return [];
    }
  };

  const SliderContent = () => (
    <div className={`space-y-4 ${className}`}>
      {/* Label and current value */}
      <div className="flex items-center justify-between">
        <div>
          <label className="block text-sm font-medium text-gray-900 dark:text-white">
            {label}
          </label>
          {description && (
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
              {description}
            </p>
          )}
        </div>
        <div className="flex items-center space-x-2">
          <span className="text-sm font-semibold text-primary-600 dark:text-primary-400">
            {formatValue(currentValue)}
          </span>
          {showInput && (
            <input
              ref={inputRef}
              type="number"
              min={min}
              max={max}
              step={step}
              value={currentValue}
              onChange={handleInputChange}
              className="w-16 px-2 py-1 text-xs border border-gray-300 dark:border-gray-600 rounded focus:outline-none focus:ring-1 focus:ring-primary-500 dark:bg-gray-700 dark:text-white text-center"
            />
          )}
        </div>
      </div>

      {/* Main slider */}
      <div className="relative">
        <div className="relative h-6 bg-gray-200 dark:bg-gray-700 rounded-lg overflow-hidden">
          {/* Progress fill */}
          <div
            className="absolute left-0 top-0 h-full bg-gradient-to-r from-primary-500 to-primary-600 transition-all duration-200"
            style={{ width: `${percentage}%` }}
          />
          
          {/* Slider input */}
          <input
            ref={sliderRef}
            type="range"
            min={min}
            max={max}
            step={step}
            value={currentValue}
            onChange={handleSliderChange}
            onMouseDown={() => setIsDragging(true)}
            onMouseUp={() => setIsDragging(false)}
            onMouseEnter={() => setShowTooltip(true)}
            onMouseLeave={() => {
              setShowTooltip(false);
              setIsDragging(false);
            }}
            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
          />
          
          {/* Slider thumb indicator */}
          <div
            className={`absolute top-1/2 w-4 h-4 bg-white border-2 border-primary-500 rounded-full shadow-md transform -translate-y-1/2 pointer-events-none transition-all duration-200 ${
              isDragging || showTooltip ? 'scale-125' : ''
            }`}
            style={{ left: `${percentage}%`, transform: `translateX(-50%) translateY(-50%)` }}
          />
        </div>

        {/* Value tooltip */}
        {showTooltip && (
          <div
            className="absolute -top-10 bg-gray-900 text-white text-xs px-2 py-1 rounded transform -translate-x-1/2 pointer-events-none z-10"
            style={{ left: `${percentage}%` }}
          >
            {formatValue(currentValue)}
            <div className="absolute top-full left-1/2 transform -translate-x-1/2 w-2 h-2 bg-gray-900 rotate-45" />
          </div>
        )}
      </div>

      {/* Step size controls */}
      <div className="flex items-center justify-between text-xs">
        <div className="flex items-center space-x-2">
          <span className="text-gray-500 dark:text-gray-400">Step:</span>
          <div className="flex space-x-1">
            {getStepSuggestions().map((stepSize) => (
              <button
                key={stepSize}
                onClick={() => {
                  const newSlider = sliderRef.current;
                  if (newSlider) {
                    newSlider.step = stepSize;
                  }
                }}
                className={`px-2 py-0.5 rounded text-xs transition-colors duration-200 ${
                  step === stepSize
                    ? 'bg-primary-100 text-primary-700 dark:bg-primary-900 dark:text-primary-300'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-400 dark:hover:bg-gray-600'
                }`}
              >
                {stepSize}
              </button>
            ))}
          </div>
        </div>
        
        <div className="flex items-center space-x-2">
          <span className="text-gray-500 dark:text-gray-400">Range:</span>
          <span className="text-gray-700 dark:text-gray-300">
            {formatValue(min)} - {formatValue(max)}
          </span>
        </div>
      </div>

      {/* Presets */}
      {showPresets && getCommonPresets().length > 0 && (
        <div>
          <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-2">
            Quick Presets
          </label>
          <div className="flex flex-wrap gap-1">
            {getCommonPresets().map((preset, index) => (
              <button
                key={index}
                onClick={() => handlePresetSelect(preset.value)}
                className={`px-2 py-1 text-xs rounded border transition-all duration-200 ${
                  currentValue === preset.value
                    ? 'bg-primary-100 border-primary-300 text-primary-700 dark:bg-primary-900 dark:border-primary-700 dark:text-primary-300'
                    : 'bg-white border-gray-300 text-gray-700 hover:bg-gray-50 dark:bg-gray-800 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-700'
                }`}
              >
                {preset.label}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Visual preview for spacing/sizing */}
      {(unit === 'px' || unit === 'rem' || unit === 'em') && (
        <div className="p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
          <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-2">
            Visual Preview
          </label>
          
          {label.toLowerCase().includes('spacing') || label.toLowerCase().includes('margin') || label.toLowerCase().includes('padding') ? (
            <div className="flex items-center space-x-2">
              <div 
                className="bg-primary-200 dark:bg-primary-800 rounded"
                style={{ 
                  padding: unit === 'px' ? `${currentValue}px` : `${currentValue}${unit}` 
                }}
              >
                <div className="bg-primary-500 text-white text-xs px-2 py-1 rounded">
                  Content
                </div>
              </div>
              <span className="text-xs text-gray-500 dark:text-gray-400">
                {formatValue(currentValue)} spacing
              </span>
            </div>
          ) : label.toLowerCase().includes('font') || label.toLowerCase().includes('text') ? (
            <div>
              <p 
                className="text-gray-900 dark:text-white"
                style={{ 
                  fontSize: unit === 'px' ? `${currentValue}px` : `${currentValue}${unit}` 
                }}
              >
                Sample text at {formatValue(currentValue)}
              </p>
            </div>
          ) : (
            <div className="flex items-center space-x-2">
              <div 
                className="bg-primary-500 rounded"
                style={{ 
                  width: unit === 'px' ? `${currentValue}px` : `${currentValue}${unit}`,
                  height: '20px'
                }}
              />
              <span className="text-xs text-gray-500 dark:text-gray-400">
                {formatValue(currentValue)} width
              </span>
            </div>
          )}
        </div>
      )}

      {/* Advanced controls */}
      <details className="group">
        <summary className="cursor-pointer text-xs text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 flex items-center">
          <svg className="w-3 h-3 mr-1 transform group-open:rotate-90 transition-transform duration-200" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
          Advanced Options
        </summary>
        
        <div className="mt-2 p-3 bg-gray-50 dark:bg-gray-800 rounded-lg space-y-2">
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="block text-xs text-gray-600 dark:text-gray-400 mb-1">Min Value</label>
              <input
                type="number"
                value={min}
                onChange={(e) => {
                  const newMin = parseFloat(e.target.value);
                  if (newMin < currentValue) {
                    // Update min value logic would go here
                  }
                }}
                className="w-full px-2 py-1 text-xs border border-gray-300 dark:border-gray-600 rounded focus:outline-none focus:ring-1 focus:ring-primary-500 dark:bg-gray-700 dark:text-white"
              />
            </div>
            <div>
              <label className="block text-xs text-gray-600 dark:text-gray-400 mb-1">Max Value</label>
              <input
                type="number"
                value={max}
                onChange={(e) => {
                  const newMax = parseFloat(e.target.value);
                  if (newMax > currentValue) {
                    // Update max value logic would go here
                  }
                }}
                className="w-full px-2 py-1 text-xs border border-gray-300 dark:border-gray-600 rounded focus:outline-none focus:ring-1 focus:ring-primary-500 dark:bg-gray-700 dark:text-white"
              />
            </div>
          </div>
          
          <div className="flex items-center justify-between">
            <button
              onClick={() => handleValueChange(min)}
              className="text-xs px-2 py-1 bg-gray-200 text-gray-700 rounded hover:bg-gray-300 transition-colors duration-200 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600"
            >
              Reset to Min
            </button>
            <button
              onClick={() => handleValueChange((min + max) / 2)}
              className="text-xs px-2 py-1 bg-gray-200 text-gray-700 rounded hover:bg-gray-300 transition-colors duration-200 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600"
            >
              Center
            </button>
            <button
              onClick={() => handleValueChange(max)}
              className="text-xs px-2 py-1 bg-gray-200 text-gray-700 rounded hover:bg-gray-300 transition-colors duration-200 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600"
            >
              Reset to Max
            </button>
          </div>
        </div>
      </details>
    </div>
  );

  return (
    <PremiumFeatureLock
      feature="granular_spacing"
      requiredTier={requiredTier}
      showPreview={true}
    >
      <SliderContent />
    </PremiumFeatureLock>
  );
};

export default GranularSlider;