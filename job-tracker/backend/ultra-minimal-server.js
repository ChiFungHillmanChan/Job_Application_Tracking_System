// Create this as ultra-minimal-server.js in the backend directory
// Test the absolute minimum Express setup

console.log('Testing ultra-minimal Express server...');

try {
  console.log('1. Requiring Express...');
  const express = require('express');
  console.log('✅ Express required successfully');
  
  console.log('2. Creating Express app...');
  const app = express();
  console.log('✅ Express app created');
  
  console.log('3. Adding basic JSON middleware...');
  app.use(express.json());
  console.log('✅ JSON middleware added');
  
  console.log('4. Adding simple route...');
  app.get('/', (req, res) => {
    res.json({ message: 'Ultra minimal server works!' });
  });
  console.log('✅ Route added');
  
  console.log('5. Starting server...');
  const server = app.listen(5999, () => {
    console.log('🚀 Ultra minimal server running on port 5999');
    console.log('Test: http://localhost:5999');
    console.log('✅ SUCCESS: Basic Express works!');
    
    // Auto-close after 3 seconds
    setTimeout(() => {
      console.log('Shutting down...');
      server.close();
      process.exit(0);
    }, 3000);
  });
  
} catch (error) {
  console.error('❌ Ultra minimal server failed:');
  console.error('Message:', error.message);
  console.error('Stack:', error.stack);
  process.exit(1);
}