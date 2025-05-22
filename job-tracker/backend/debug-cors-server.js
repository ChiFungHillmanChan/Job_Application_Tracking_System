// Create this as debug-cors-server.js
// This will show us exactly what's happening with CORS requests

const express = require('express');
const cors = require('cors');

const app = express();

// CORS debugging middleware - logs everything
app.use((req, res, next) => {
  console.log('\n🔍 Incoming Request:');
  console.log('Method:', req.method);
  console.log('URL:', req.url);
  console.log('Origin:', req.get('Origin') || 'NO ORIGIN');
  console.log('Headers:', {
    'Access-Control-Request-Method': req.get('Access-Control-Request-Method'),
    'Access-Control-Request-Headers': req.get('Access-Control-Request-Headers'),
    'Content-Type': req.get('Content-Type'),
    'Authorization': req.get('Authorization') ? 'PRESENT' : 'NONE'
  });
  
  // Log if this is a preflight request
  if (req.method === 'OPTIONS') {
    console.log('🚨 This is a PREFLIGHT (OPTIONS) request');
  }
  
  next();
});

// Apply CORS with detailed logging
const corsOptions = {
  origin: function (origin, callback) {
    console.log('\n🌐 CORS Origin Check:');
    console.log('Request origin:', origin || 'NO ORIGIN');
    
    const allowedOrigins = [
      'http://localhost:3000',
      'http://127.0.0.1:3000',
      'http://localhost:3001'
    ];
    
    console.log('Allowed origins:', allowedOrigins);
    
    // Allow requests with no origin (mobile apps, etc.)
    if (!origin) {
      console.log('✅ Allowing request with no origin');
      return callback(null, true);
    }
    
    if (allowedOrigins.includes(origin)) {
      console.log('✅ Origin is allowed');
      callback(null, true);
    } else {
      console.log('❌ Origin is NOT allowed');
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'Accept', 'Origin'],
  preflightContinue: false,
  optionsSuccessStatus: 200
};

app.use(cors(corsOptions));

// Additional response logging
app.use((req, res, next) => {
  const originalSend = res.send;
  res.send = function(data) {
    console.log('\n📤 Response:');
    console.log('Status:', res.statusCode);
    console.log('Headers:', {
      'Access-Control-Allow-Origin': res.get('Access-Control-Allow-Origin'),
      'Access-Control-Allow-Methods': res.get('Access-Control-Allow-Methods'),
      'Access-Control-Allow-Headers': res.get('Access-Control-Allow-Headers'),
      'Access-Control-Allow-Credentials': res.get('Access-Control-Allow-Credentials')
    });
    return originalSend.call(this, data);
  };
  next();
});

app.use(express.json());

// Test endpoints
app.get('/api/test', (req, res) => {
  res.json({
    success: true,
    message: 'CORS test endpoint working',
    origin: req.get('Origin'),
    timestamp: new Date().toISOString()
  });
});

app.post('/api/auth/login', (req, res) => {
  console.log('\n🔐 Login endpoint hit');
  console.log('Body:', req.body);
  
  res.json({
    success: true,
    message: 'Login endpoint working (this is just a test)',
    data: req.body
  });
});

// Explicit OPTIONS handler for troubleshooting
app.options('*', (req, res) => {
  console.log('\n⚠️  Manual OPTIONS handler called');
  res.header('Access-Control-Allow-Origin', req.get('Origin') || '*');
  res.header('Access-Control-Allow-Methods', 'GET,PUT,POST,DELETE,OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With, Accept, Origin');
  res.header('Access-Control-Allow-Credentials', 'true');
  res.sendStatus(200);
});

const PORT = 5005;

app.listen(PORT, () => {
  console.log(`🔍 CORS Debug Server running on port ${PORT}`);
  console.log(`Test this URL from your frontend: http://localhost:${PORT}/api/test`);
  console.log(`Login test: http://localhost:${PORT}/api/auth/login`);
  console.log('\nThis server will show detailed CORS debugging info.\n');
});