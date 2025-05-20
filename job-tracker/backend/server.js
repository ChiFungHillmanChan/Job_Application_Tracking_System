// Updated server.js file with resume routes added

const express = require('express');
const dotenv = require('dotenv');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const path = require('path');
const connectDB = require('./config/db');
const logger = require('./utils/logger');
const errorHandler = require('./middleware/error');

dotenv.config({ path: '../.env' });

connectDB();

const app = express();

app.use(express.json());

// Update the CORS configuration to allow requests from the frontend
app.use(cors({
  origin: process.env.NODE_ENV === 'production' 
    ? process.env.FRONTEND_URL 
    : ['http://localhost:3000', 'http://127.0.0.1:3000'],
  credentials: true
}));

app.use(helmet());

if (process.env.NODE_ENV === 'development') {
  app.use(morgan('dev'));
}

// Routes
app.use('/api/auth', require('./routes/auth'));
app.use('/api/jobs', require('./routes/jobs'));
app.use('/api/resumes', require('./routes/resumes')); // Add the resume routes

// Serve static files from the uploads directory
app.use('/api/uploads', express.static(path.join(__dirname, 'uploads')));

app.use(errorHandler);

const PORT = process.env.PORT || 5000;

const server = app.listen(PORT, () => {
  logger.info(`Server running in ${process.env.NODE_ENV} mode on port ${PORT}`);
});

process.on('unhandledRejection', (err, promise) => {
  logger.error(`Error: ${err.message}`);
  server.close(() => process.exit(1));
});