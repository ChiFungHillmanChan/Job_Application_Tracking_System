// Create this as route-debug-server.js in the backend directory
// This will load and test each route file individually

const express = require('express');
const cors = require('cors');

console.log('🔍 Starting route-by-route debugging...\n');

const app = express();

// Basic middleware
app.use(cors({
  origin: ['http://localhost:3000', 'http://127.0.0.1:3000'],
  credentials: true
}));
app.use(express.json());

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'OK', message: 'Debug server working' });
});

console.log('✅ Basic server setup complete\n');

// Test each route file individually
async function testRoutes() {
  console.log('Testing individual route files...\n');
  
  // Test 1: Auth routes
  try {
    console.log('1. Loading auth routes...');
    const authRoutes = require('./routes/auth');
    
    // Try to mount the route
    app.use('/api/auth', authRoutes);
    console.log('✅ Auth routes loaded and mounted successfully\n');
  } catch (error) {
    console.error('❌ ERROR with auth routes:');
    console.error('Message:', error.message);
    console.error('Stack:', error.stack);
    console.log('\n--- This is likely the problematic file! ---\n');
    return;
  }
  
  // Test 2: Jobs routes
  try {
    console.log('2. Loading job routes...');
    const jobRoutes = require('./routes/jobs');
    
    // Try to mount the route
    app.use('/api/jobs', jobRoutes);
    console.log('✅ Job routes loaded and mounted successfully\n');
  } catch (error) {
    console.error('❌ ERROR with job routes:');
    console.error('Message:', error.message);
    console.error('Stack:', error.stack);
    console.log('\n--- This is likely the problematic file! ---\n');
    return;
  }
  
  // Test 3: Resume routes
  try {
    console.log('3. Loading resume routes...');
    const resumeRoutes = require('./routes/resumes');
    
    // Try to mount the route
    app.use('/api/resumes', resumeRoutes);
    console.log('✅ Resume routes loaded and mounted successfully\n');
  } catch (error) {
    console.error('❌ ERROR with resume routes:');
    console.error('Message:', error.message);
    console.error('Stack:', error.stack);
    console.log('\n--- This is likely the problematic file! ---\n');
    return;
  }
  
  // If we get here, try to start the server
  try {
    console.log('4. All routes loaded successfully, starting server...');
    const PORT = 5001; // Use different port to avoid conflicts
    
    const server = app.listen(PORT, () => {
      console.log(`🚀 Debug server started successfully on port ${PORT}!`);
      console.log(`Test: http://localhost:${PORT}/health`);
      console.log('\n🎉 All routes are working! The problem might be elsewhere.\n');
    });
    
  } catch (error) {
    console.error('❌ ERROR starting server:');
    console.error('Message:', error.message);
    console.error('Stack:', error.stack);
  }
}

// Run the test
testRoutes();