const express = require('express');
const {
  register,
  login,
  getMe,
  forgotPassword,
  resetPassword,
  googleAuth,
  appleAuth
} = require('../controllers/authController');
const { protect } = require('../middleware/auth');

const router = express.Router();

// Public routes
router.post('/register', register);
router.post('/login', login);
router.post('/forgotpassword', forgotPassword);
router.put('/resetpassword/:resettoken', resetPassword);
router.post('/google', googleAuth);
router.post('/apple', appleAuth);

// Protected routes
router.get('/me', protect, getMe);

module.exports = router;