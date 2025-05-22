// Create this as full-debug-server.js in the backend directory
// This mimics your full server.js but with step-by-step debugging

const express = require('express');

console.log('🔍 Starting full server debugging...\n');

// Step 1: Test basic imports
try {
  console.log('1. Testing imports...');
  const dotenv = require('dotenv');
  const cors = require('cors');
  const helmet = require('helmet');
  const morgan = require('morgan');
  const path = require('path');
  console.log('✅ Basic imports successful\n');
} catch (error) {
  console.error('❌ Import error:', error.message);
  process.exit(1);
}

// Step 2: Test environment loading
try {
  console.log('2. Loading environment variables...');
  const dotenv = require('dotenv');
  dotenv.config({ path: '../.env' });
  console.log('✅ Environment variables loaded\n');
} catch (error) {
  console.error('❌ Environment error:', error.message);
  console.log('Continuing without environment file...\n');
}

// Step 3: Test database connection
try {
  console.log('3. Testing database connection...');
  const connectDB = require('./config/db');
  console.log('✅ Database module loaded');
  
  // Try to connect
  connectDB();
  console.log('✅ Database connection initiated\n');
} catch (error) {
  console.error('❌ Database error:', error.message);
  console.log('Continuing without database...\n');
}

// Step 4: Test utility imports
try {
  console.log('4. Testing utilities...');
  const logger = require('./utils/logger');
  const errorHandler = require('./middleware/error');
  console.log('✅ Utilities loaded\n');
} catch (error) {
  console.error('❌ Utilities error:', error.message);
  console.log('Continuing without utilities...\n');
}

// Step 5: Create Express app
console.log('5. Creating Express app...');
const app = express();

// Step 6: Test CORS middleware
try {
  console.log('6. Setting up CORS...');
  const cors = require('cors');
  
  app.use(cors({
    origin: function (origin, callback) {
      if (!origin) return callback(null, true);
      
      const allowedOrigins = [
        'http://localhost:3000',
        'http://127.0.0.1:3000',
        'http://localhost:3001',
        'https://localhost:3000',
      ];
      
      if (process.env.FRONTEND_URL) {
        allowedOrigins.push(process.env.FRONTEND_URL);
      }
      
      if (allowedOrigins.indexOf(origin) !== -1) {
        callback(null, true);
      } else {
        console.log('Blocked by CORS:', origin);
        callback(new Error('Not allowed by CORS'));
      }
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
    allowedHeaders: [
      'Content-Type', 
      'Authorization', 
      'X-Requested-With',
      'Accept',
      'Origin',
      'Access-Control-Request-Method',
      'Access-Control-Request-Headers'
    ],
    exposedHeaders: ['Content-Length', 'X-Request-ID'],
    preflightContinue: false,
    optionsSuccessStatus: 204
  }));
  
  app.options('*', cors());
  console.log('✅ CORS configured\n');
} catch (error) {
  console.error('❌ CORS error:', error.message);
  process.exit(1);
}

// Step 7: Test body parsing
try {
  console.log('7. Setting up body parsing...');
  app.use(express.json({ limit: '10mb' }));
  app.use(express.urlencoded({ extended: true, limit: '10mb' }));
  console.log('✅ Body parsing configured\n');
} catch (error) {
  console.error('❌ Body parsing error:', error.message);
  process.exit(1);
}

// Step 8: Test security middleware
try {
  console.log('8. Setting up security middleware...');
  const helmet = require('helmet');
  app.use(helmet({
    crossOriginEmbedderPolicy: false,
    contentSecurityPolicy: false
  }));
  console.log('✅ Security middleware configured\n');
} catch (error) {
  console.error('❌ Security middleware error:', error.message);
  console.log('Continuing without helmet...\n');
}

// Step 9: Test logging middleware
try {
  console.log('9. Setting up logging...');
  if (process.env.NODE_ENV === 'development') {
    const morgan = require('morgan');
    app.use(morgan('dev'));
  }
  console.log('✅ Logging configured\n');
} catch (error) {
  console.error('❌ Logging error:', error.message);
  console.log('Continuing without morgan...\n');
}

// Step 10: Add basic routes
console.log('10. Setting up basic routes...');
app.get('/health', (req, res) => {
  res.status(200).json({
    status: 'OK',
    message: 'Server is running',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development'
  });
});

if (process.env.NODE_ENV === 'development') {
  app.use((req, res, next) => {
    console.log(`${req.method} ${req.path} - Origin: ${req.get('Origin') || 'no origin'}`);
    next();
  });
}
console.log('✅ Basic routes configured\n');

// Step 11: Load API routes
console.log('11. Loading API routes...');

try {
  console.log('  - Loading auth routes...');
  const authRoutes = require('./routes/auth');
  app.use('/api/auth', authRoutes);
  console.log('  ✅ Auth routes loaded');
} catch (error) {
  console.error('  ❌ Auth routes error:', error.message);
  process.exit(1);
}

try {
  console.log('  - Loading job routes...');
  const jobRoutes = require('./routes/jobs');
  app.use('/api/jobs', jobRoutes);
  console.log('  ✅ Job routes loaded');
} catch (error) {
  console.error('  ❌ Job routes error:', error.message);
  process.exit(1);
}

try {
  console.log('  - Loading resume routes...');
  const resumeRoutes = require('./routes/resumes');
  app.use('/api/resumes', resumeRoutes);
  console.log('  ✅ Resume routes loaded');
} catch (error) {
  console.error('  ❌ Resume routes error:', error.message);
  process.exit(1);
}

console.log('✅ All API routes loaded\n');

// Step 12: Static files
try {
  console.log('12. Setting up static files...');
  const path = require('path');
  app.use('/api/uploads', express.static(path.join(__dirname, 'uploads')));
  console.log('✅ Static files configured\n');
} catch (error) {
  console.error('❌ Static files error:', error.message);
  console.log('Continuing without static files...\n');
}

// Step 13: Catch-all route
console.log('13. Setting up catch-all route...');
app.use('*', (req, res) => {
  res.status(404).json({
    success: false,
    error: `Route ${req.originalUrl} not found`
  });
});
console.log('✅ Catch-all route configured\n');

// Step 14: Error handling
try {
  console.log('14. Setting up error handling...');
  const errorHandler = require('./middleware/error');
  app.use(errorHandler);
  console.log('✅ Error handling configured\n');
} catch (error) {
  console.error('❌ Error handling setup error:', error.message);
  console.log('Continuing without error handler...\n');
}

// Step 15: Start server
console.log('15. Starting server...');
const PORT = process.env.PORT || 5002;

try {
  const server = app.listen(PORT, () => {
    console.log(`🚀 Full debug server running on port ${PORT}`);
    console.log(`📍 Health check: http://localhost:${PORT}/health`);
    console.log(`🔗 API Base URL: http://localhost:${PORT}/api`);
    console.log('\n🎉 Server started successfully! All components working.\n');
  });

  server.on('error', (err) => {
    console.error('❌ Server startup error:', err);
    process.exit(1);
  });

} catch (error) {
  console.error('❌ Server creation error:', error.message);
  console.error('Stack:', error.stack);
  process.exit(1);
}