'use client';

import { useState, useRef, useEffect } from 'react';

const ColorPicker = ({ value, onChange, colors, className = '' }) => {
  const [isOpen, setIsOpen] = useState(false);
  const pickerRef = useRef(null);

  // Default color palette if none provided
  const defaultColors = [
    { name: 'Blue', bg: 'bg-blue-100', text: 'text-blue-800', darkBg: 'dark:bg-blue-900', darkText: 'dark:text-blue-300' },
    { name: 'Green', bg: 'bg-green-100', text: 'text-green-800', darkBg: 'dark:bg-green-900', darkText: 'dark:text-green-300' },
    { name: 'Yellow', bg: 'bg-yellow-100', text: 'text-yellow-800', darkBg: 'dark:bg-yellow-900', darkText: 'dark:text-yellow-300' },
    { name: 'Red', bg: 'bg-red-100', text: 'text-red-800', darkBg: 'dark:bg-red-900', darkText: 'dark:text-red-300' },
    { name: 'Purple', bg: 'bg-purple-100', text: 'text-purple-800', darkBg: 'dark:bg-purple-900', darkText: 'dark:text-purple-300' },
    { name: 'Pink', bg: 'bg-pink-100', text: 'text-pink-800', darkBg: 'dark:bg-pink-900', darkText: 'dark:text-pink-300' },
    { name: 'Indigo', bg: 'bg-indigo-100', text: 'text-indigo-800', darkBg: 'dark:bg-indigo-900', darkText: 'dark:text-indigo-300' },
    { name: 'Gray', bg: 'bg-gray-100', text: 'text-gray-800', darkBg: 'dark:bg-gray-900', darkText: 'dark:text-gray-300' },
  ];

  const colorOptions = colors || defaultColors;

  // Close picker when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (pickerRef.current && !pickerRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const handleColorSelect = (color) => {
    onChange(color);
    setIsOpen(false);
  };

  const getCurrentColor = () => {
    return colorOptions.find(color => 
      value && (
        color.bg === value.bg || 
        color.name.toLowerCase() === value.name?.toLowerCase()
      )
    ) || colorOptions[0];
  };

  const currentColor = getCurrentColor();

  return (
    <div className={`relative ${className}`} ref={pickerRef}>
      {/* Color picker trigger */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className={`inline-flex items-center px-3 py-1.5 rounded-full text-xs font-medium transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 ${currentColor.bg} ${currentColor.text} ${currentColor.darkBg} ${currentColor.darkText}`}
      >
        <span className="w-2 h-2 rounded-full bg-current mr-1.5"></span>
        {currentColor.name}
        <svg 
          className={`ml-1 h-3 w-3 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} 
          fill="none" 
          viewBox="0 0 24 24" 
          stroke="currentColor"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {/* Color picker dropdown */}
      {isOpen && (
        <div className="absolute z-50 mt-2 p-2 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 animate-fade-in">
          <div className="grid grid-cols-4 gap-1 w-48">
            {colorOptions.map((color, index) => (
              <button
                key={index}
                type="button"
                onClick={() => handleColorSelect(color)}
                className={`p-2 rounded-md text-xs font-medium transition-colors duration-200 hover:scale-105 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 ${color.bg} ${color.text} ${color.darkBg} ${color.darkText}`}
                title={color.name}
              >
                <span className="w-3 h-3 rounded-full bg-current mx-auto block"></span>
                <span className="mt-1 block truncate">{color.name}</span>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default ColorPicker;