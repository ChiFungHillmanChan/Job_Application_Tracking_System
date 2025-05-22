// Create this as env-check.js in the backend directory
// Check environment variables

const dotenv = require('dotenv');

console.log('🔍 Checking environment variables...\n');

// Load environment variables
console.log('1. Loading .env file...');
const result = dotenv.config({ path: '../.env' });

if (result.error) {
  console.log('❌ Error loading .env file:', result.error.message);
  console.log('Continuing without .env file...\n');
} else {
  console.log('✅ .env file loaded successfully\n');
}

// Check specific variables
console.log('2. Environment variables:');
console.log('NODE_ENV:', process.env.NODE_ENV || 'undefined');
console.log('PORT:', process.env.PORT || 'undefined');
console.log('FRONTEND_URL:', process.env.FRONTEND_URL || 'undefined');
console.log('MONGODB_URI:', process.env.MONGODB_URI || 'undefined');
console.log('JWT_SECRET:', process.env.JWT_SECRET ? '[SET]' : 'undefined');

console.log('\n3. All environment variables:');
Object.keys(process.env)
  .filter(key => !key.startsWith('_') && !key.includes('PATH'))
  .sort()
  .forEach(key => {
    const value = process.env[key];
    if (key.toLowerCase().includes('secret') || key.toLowerCase().includes('password')) {
      console.log(`${key}: [HIDDEN]`);
    } else {
      console.log(`${key}: ${value}`);
    }
  });

console.log('\n✅ Environment check complete');