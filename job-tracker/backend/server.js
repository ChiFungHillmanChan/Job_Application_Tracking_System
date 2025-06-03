// Updated server.js with working CORS configuration and Job Finder routes

const express = require('express');
const dotenv = require('dotenv');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const path = require('path');
const connectDB = require('./config/db');
const logger = require('./utils/logger');
const errorHandler = require('./middleware/error');

// Load environment variables
dotenv.config({ path: '../.env' });

// Connect to database
connectDB();

const app = express();

// Build allowed origins array
const allowedOrigins = [
  'http://localhost:3000',
  'http://127.0.0.1:3000',
  'http://localhost:3001',
  'https://localhost:3000',
];

// Add production frontend URL if set
if (process.env.FRONTEND_URL) {
  allowedOrigins.push(process.env.FRONTEND_URL);
}

console.log('Allowed origins:', allowedOrigins);

// Use simple CORS configuration
app.use(cors({
  origin: function (origin, callback) {
    // Allow requests with no origin (mobile apps, etc.)
    if (!origin) return callback(null, true);
    
    if (allowedOrigins.indexOf(origin) !== -1) {
      callback(null, true);
    } else {
      console.log('Blocked by CORS:', origin);
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH', 'HEAD'],
  allowedHeaders: [
    'Content-Type', 
    'Authorization', 
    'X-Requested-With',
    'Accept',
    'Origin',
    'Access-Control-Request-Method',
    'Access-Control-Request-Headers',
    'Cache-Control'
  ],
  exposedHeaders: [
    'Content-Length', 
    'X-Request-ID', 
    'Content-Disposition',
    'Content-Type'
  ],
  preflightContinue: false,
  optionsSuccessStatus: 204
}));

// Handle preflight requests
app.options('*', cors());

// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Security middleware
app.use(helmet({
  crossOriginEmbedderPolicy: false,
  contentSecurityPolicy: false
}));

// Logging middleware
if (process.env.NODE_ENV === 'development') {
  app.use(morgan('dev'));
}

// Health check endpoint
app.get('/health', (req, res) => {
  res.status(200).json({
    status: 'OK',
    message: 'Server is running',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development'
  });
});

// Development logging
if (process.env.NODE_ENV === 'development') {
  app.use((req, res, next) => {
    console.log(`${req.method} ${req.path} - Origin: ${req.get('Origin') || 'no origin'}`);
    next();
  });
}

// API Routes
console.log('Loading API routes...');

// Existing routes
app.use('/api/auth', require('./routes/auth'));
app.use('/api/jobs', require('./routes/jobs'));
app.use('/api/resumes', require('./routes/resumes'));

// NEW: Job Finder routes
try {
  app.use('/api/job-finder', require('./routes/jobFinder'));
  console.log('✅ Job Finder routes loaded successfully');
} catch (error) {
  console.error('❌ Failed to load Job Finder routes:', error.message);
  console.log('📝 Make sure you have created the following files:');
  console.log('   - backend/routes/jobFinder.js');
  console.log('   - backend/controllers/jobFinderController.js');
  console.log('   - backend/models/SavedJob.js');
}

console.log('API routes loaded');

// Serve static files from uploads directory
app.use('/api/uploads', express.static(path.join(__dirname, 'uploads')));

// API route debugging middleware
app.use('/api/*', (req, res, next) => {
  console.log(`🔍 API Request: ${req.method} ${req.originalUrl}`);
  next();
});

// Catch-all for undefined routes
app.use('*', (req, res) => {
  console.log(`❌ Route not found: ${req.method} ${req.originalUrl}`);
  res.status(404).json({
    success: false,
    error: `Route ${req.originalUrl} not found`,
    availableRoutes: [
      'GET /health',
      'POST /api/auth/login',
      'POST /api/auth/register',
      'GET /api/jobs',
      'GET /api/job-finder/search',
      'POST /api/job-finder/saved',
      'GET /api/job-finder/saved'
    ]
  });
});

// Error handling middleware (must be last)
app.use(errorHandler);

const PORT = process.env.PORT || 5001;

const server = app.listen(PORT, () => {
  logger.info(`Server running in ${process.env.NODE_ENV || 'development'} mode on port ${PORT}`);
  console.log(`Server started successfully!`);
  console.log(`Health check: http://localhost:${PORT}/health`);
  console.log(`API Base URL: http://localhost:${PORT}/api`);
  console.log(`Job Finder API: http://localhost:${PORT}/api/job-finder`);
  console.log(`Allowed origins: ${allowedOrigins.join(', ')}`);
  
  // Test if Job Finder routes are working
  console.log('\n🧪 Testing Job Finder routes...');
  const testRoutes = [
    '/api/job-finder/search',
    '/api/job-finder/saved'
  ];
  
  testRoutes.forEach(route => {
    console.log(`   - ${route} ${app._router.stack.some(layer => 
      layer.route && layer.route.path === route || 
      layer.regexp.test(route)
    ) ? '✅' : '❌'}`);
  });
});

// Handle unhandled promise rejections
process.on('unhandledRejection', (err, promise) => {
  logger.error(`Error: ${err.message}`);
  console.log('💥 Shutting down the server due to Unhandled Promise Rejection');
  server.close(() => process.exit(1));
});

// Handle SIGTERM
process.on('SIGTERM', () => {
  logger.info('SIGTERM received');
  console.log('SIGTERM received, shutting down gracefully');
  server.close(() => {
    console.log('Process terminated');
  });
});