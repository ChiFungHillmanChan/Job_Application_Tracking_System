// Create this as import-test.js in the backend directory
// This will test each import individually to find the problematic file

console.log('Testing imports one by one...\n');

// Test 1: Basic modules
try {
  console.log('1. Testing basic modules...');
  const express = require('express');
  const cors = require('cors');
  const dotenv = require('dotenv');
  console.log('✅ Basic modules imported successfully\n');
} catch (error) {
  console.error('❌ Error with basic modules:', error.message);
  process.exit(1);
}

// Test 2: Database connection
try {
  console.log('2. Testing database connection...');
  const connectDB = require('./config/db');
  console.log('✅ Database module imported successfully\n');
} catch (error) {
  console.error('❌ Error with database module:', error.message);
  console.log('Continuing without database...\n');
}

// Test 3: Utils
try {
  console.log('3. Testing utils...');
  const logger = require('./utils/logger');
  console.log('✅ Logger imported successfully\n');
} catch (error) {
  console.error('❌ Error with logger:', error.message);
  console.log('Continuing without logger...\n');
}

// Test 4: Middleware
try {
  console.log('4. Testing auth middleware...');
  const auth = require('./middleware/auth');
  console.log('✅ Auth middleware imported successfully\n');
} catch (error) {
  console.error('❌ Error with auth middleware:', error.message);
  console.log('Continuing without auth middleware...\n');
}

try {
  console.log('5. Testing error middleware...');
  const errorHandler = require('./middleware/error');
  console.log('✅ Error middleware imported successfully\n');
} catch (error) {
  console.error('❌ Error with error middleware:', error.message);
  console.log('Continuing without error middleware...\n');
}

// Test 6: Routes (this is likely where the problem is)
try {
  console.log('6. Testing auth routes...');
  const authRoutes = require('./routes/auth');
  console.log('✅ Auth routes imported successfully\n');
} catch (error) {
  console.error('❌ Error with auth routes:', error.message);
  console.log('This might be the problem!\n');
}

try {
  console.log('7. Testing job routes...');
  const jobRoutes = require('./routes/jobs');
  console.log('✅ Job routes imported successfully\n');
} catch (error) {
  console.error('❌ Error with job routes:', error.message);
  console.log('This might be the problem!\n');
}

try {
  console.log('8. Testing resume routes...');
  const resumeRoutes = require('./routes/resumes');
  console.log('✅ Resume routes imported successfully\n');
} catch (error) {
  console.error('❌ Error with resume routes:', error.message);
  console.log('This might be the problem!\n');
}

console.log('Import testing completed!');