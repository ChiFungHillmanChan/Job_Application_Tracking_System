// Create this as simple-cors-test.js in the backend directory
// Test with very basic CORS configuration

const express = require('express');
const cors = require('cors');

console.log('🔍 Testing simple CORS configuration...\n');

const app = express();

console.log('1. Creating Express app...');

// Test 1: No CORS at all
try {
  console.log('2. Testing without any CORS...');
  app.get('/test1', (req, res) => {
    res.json({ message: 'No CORS test' });
  });
  console.log('✅ No CORS - OK\n');
} catch (error) {
  console.error('❌ No CORS failed:', error.message);
  process.exit(1);
}

// Test 2: Very basic CORS
try {
  console.log('3. Testing basic CORS...');
  app.use(cors());
  console.log('✅ Basic CORS - OK\n');
} catch (error) {
  console.error('❌ Basic CORS failed:', error.message);
  process.exit(1);
}

// Test 3: CORS with simple origin array
try {
  console.log('4. Testing CORS with origin array...');
  app.use(cors({
    origin: ['http://localhost:3000', 'http://127.0.0.1:3000'],
    credentials: true
  }));
  console.log('✅ CORS with origin array - OK\n');
} catch (error) {
  console.error('❌ CORS with origin array failed:', error.message);
  process.exit(1);
}

// Test 4: Try to start server
try {
  console.log('5. Starting server...');
  const PORT = 5003;
  
  const server = app.listen(PORT, () => {
    console.log(`🚀 Simple CORS test server running on port ${PORT}`);
    console.log(`Test: http://localhost:${PORT}/test1`);
    console.log('\n✅ Simple CORS configuration works!\n');
    
    // Auto-close after 3 seconds
    setTimeout(() => {
      console.log('Closing test server...');
      server.close();
      process.exit(0);
    }, 3000);
  });
  
} catch (error) {
  console.error('❌ Server start failed:', error.message);
  process.exit(1);
}