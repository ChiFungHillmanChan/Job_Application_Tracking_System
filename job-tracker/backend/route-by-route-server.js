// Create this as route-by-route-server.js in the backend directory
// Load each route individually to find the exact problematic route

const express = require('express');
const dotenv = require('dotenv');
const cors = require('cors');

console.log('🔍 Loading routes one by one to find the issue...\n');

// Load environment variables
dotenv.config({ path: '../.env' });

const app = express();

// Setup basic CORS (we know this works)
const allowedOrigins = [
  'http://localhost:3000',
  'http://127.0.0.1:3000',
  'http://localhost:3001',
  'https://localhost:3000',
];

if (process.env.FRONTEND_URL) {
  allowedOrigins.push(process.env.FRONTEND_URL);
}

app.use(cors({
  origin: allowedOrigins,
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'Accept', 'Origin'],
  optionsSuccessStatus: 200
}));

app.use(express.json());
console.log('✅ Basic setup complete\n');

// Test each route file individually
console.log('Testing route files individually...\n');

// Route 1: Auth routes
try {
  console.log('1. Loading auth routes...');
  const authRoutes = require('./routes/auth');
  console.log('   ✅ Auth routes required successfully');
  
  app.use('/api/auth', authRoutes);
  console.log('   ✅ Auth routes mounted successfully\n');
} catch (error) {
  console.error('   ❌ ERROR with auth routes:');
  console.error('   Message:', error.message);
  console.error('   Stack:', error.stack);
  process.exit(1);
}

// Route 2: Jobs routes  
try {
  console.log('2. Loading jobs routes...');
  const jobRoutes = require('./routes/jobs');
  console.log('   ✅ Jobs routes required successfully');
  
  app.use('/api/jobs', jobRoutes);
  console.log('   ✅ Jobs routes mounted successfully\n');
} catch (error) {
  console.error('   ❌ ERROR with jobs routes:');
  console.error('   Message:', error.message);
  console.error('   Stack:', error.stack);
  process.exit(1);
}

// Route 3: Resume routes
try {
  console.log('3. Loading resume routes...');
  const resumeRoutes = require('./routes/resumes');
  console.log('   ✅ Resume routes required successfully');
  
  app.use('/api/resumes', resumeRoutes);
  console.log('   ✅ Resume routes mounted successfully\n');
} catch (error) {
  console.error('   ❌ ERROR with resume routes:');
  console.error('   Message:', error.message);
  console.error('   Stack:', error.stack);
  process.exit(1);
}

// If we get here, try to start the server
console.log('4. All routes loaded successfully! Starting server...');

const PORT = 5004;
const server = app.listen(PORT, () => {
  console.log(`🚀 Route-by-route server started on port ${PORT}!`);
  console.log(`📍 Test: http://localhost:${PORT}/api/auth/me`);
  console.log('\n🎉 All routes work! The issue must be in other middleware.\n');
});

server.on('error', (err) => {
  console.error('❌ Server error:', err);
});