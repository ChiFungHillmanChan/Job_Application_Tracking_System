// Create this as trace-error-source.js in the backend directory
// Try to trace what's calling the problematic path-to-regexp function

console.log('🔍 Tracing the source of path-to-regexp error...\n');

// Override the problematic function to see what's calling it
try {
  console.log('1. Loading path-to-regexp module...');
  
  // First, let's see if we can require it directly
  const pathToRegexp = require('path-to-regexp');
  console.log('✅ path-to-regexp loaded successfully');
  console.log('Available functions:', Object.keys(pathToRegexp));
  
} catch (error) {
  console.error('❌ Failed to load path-to-regexp directly:');
  console.error('Message:', error.message);
  console.error('Stack:', error.stack);
  console.log('\n');
}

// Try to monkey-patch the problematic function to see what calls it
try {
  console.log('2. Attempting to patch path-to-regexp to trace calls...');
  
  // Load the module and override the problematic function
  const Module = require('module');
  const originalRequire = Module.prototype.require;
  
  Module.prototype.require = function(id) {
    const result = originalRequire.apply(this, arguments);
    
    // If this is path-to-regexp, intercept it
    if (id === 'path-to-regexp' && result.pathToRegexp) {
      console.log('🔍 Intercepted path-to-regexp loading');
      
      const originalPathToRegexp = result.pathToRegexp;
      result.pathToRegexp = function(...args) {
        console.log('🚨 pathToRegexp called with args:', args);
        console.log('Stack trace:', new Error().stack);
        return originalPathToRegexp.apply(this, args);
      };
    }
    
    return result;
  };
  
  console.log('✅ Monkey patch applied');
  
} catch (error) {
  console.error('❌ Failed to apply monkey patch:', error.message);
}

// Now try to load Express and see what happens
try {
  console.log('3. Loading Express to see what triggers the error...');
  const express = require('express');
  console.log('✅ Express loaded');
  
  console.log('4. Creating Express app...');
  const app = express();
  console.log('✅ Express app created');
  
  console.log('5. Trying to add a simple route...');
  app.get('/test', (req, res) => {
    res.send('test');
  });
  console.log('✅ Simple route added');
  
  console.log('6. Trying to add a route with parameters...');
  app.get('/test/:id', (req, res) => {
    res.send('test with id');
  });
  console.log('✅ Parameterized route added');
  
  console.log('7. Trying to use app.use...');
  app.use('/api', (req, res, next) => {
    next();
  });
  console.log('✅ Middleware added');
  
} catch (error) {
  console.error('❌ Error during Express setup:');
  console.error('Message:', error.message);
  console.error('Stack:', error.stack);
  
  // Check if this is our target error
  if (error.message.includes('Missing parameter name')) {
    console.log('\n🎯 FOUND THE ERROR!');
    console.log('This is the same error we\'ve been seeing.');
    console.log('The error occurs during Express route setup.');
  }
}

console.log('\n✅ Error tracing complete');