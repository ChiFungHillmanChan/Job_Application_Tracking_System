// Updated server.js file with improved CORS configuration

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

// CORS configuration - Enhanced to ensure proper headers
const corsOptions = {
  origin: function(origin, callback) {
    // Allow requests with no origin (like mobile apps, curl requests)
    if (!origin) return callback(null, true);
    
    const allowedOrigins = process.env.NODE_ENV === 'production'
      ? [process.env.FRONTEND_URL]
      : ['http://localhost:3000', 'http://127.0.0.1:3000'];
    
    if (allowedOrigins.indexOf(origin) !== -1 || !origin) {
      callback(null, true);
    } else {
      logger.warn(`Origin ${origin} not allowed by CORS`);
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
  exposedHeaders: ['Content-Range', 'X-Content-Range'],
  preflightContinue: false,
  optionsSuccessStatus: 204
};

// Apply CORS before any other middleware or route handlers
app.use(cors(corsOptions));

// Apply other middleware
app.use(express.json());
app.use(helmet({
  // Configure helmet to not block certain resources
  contentSecurityPolicy: false,
}));

// Logging middleware
if (process.env.NODE_ENV === 'development') {
  app.use(morgan('dev'));
}

// Pre-flight OPTIONS handler for CORS
app.options('*', cors(corsOptions));

// Test route for CORS verification
app.get('/api/test-cors', (req, res) => {
  res.json({ message: 'CORS is working correctly!' });
});

// Routes
app.use('/api/auth', require('./routes/auth'));
app.use('/api/jobs', require('./routes/jobs'));
app.use('/api/resumes', require('./routes/resumes')); 

// Serve static files from the uploads directory
app.use('/api/uploads', express.static(path.join(__dirname, 'uploads')));

// Error handler middleware
app.use(errorHandler);

// Set port and start server
const PORT = process.env.PORT || 5000;

const server = app.listen(PORT, () => {
  logger.info(`Server running in ${process.env.NODE_ENV} mode on port ${PORT}`);
});

// Handle unhandled promise rejections
process.on('unhandledRejection', (err, promise) => {
  logger.error(`Error: ${err.message}`);
  server.close(() => process.exit(1));
});