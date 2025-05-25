const express = require('express');
const {
  registerUser,
  loginUser,
  getMe,
  logoutUser,
  forgotPassword,
  resetPassword,
  updateProfile,
  changePassword,
  getPreferences,
  updatePreferences 
} = require('../controllers/authController');
const { protect } = require('../middleware/auth');

const router = express.Router();

// Public routes
router.post('/register', registerUser);
router.post('/login', loginUser);
router.post('/forgotpassword', forgotPassword);
router.put('/resetpassword/:resettoken', resetPassword);

// Protected routes
router.get('/me', protect, getMe);
router.get('/logout', protect, logoutUser);
router.put('/updateprofile', protect, updateProfile);
router.put('/password', protect, changePassword);  

// New preference routes for hybrid system
router.get('/preferences', protect, getPreferences);
router.put('/preferences', protect, updatePreferences);

module.exports = router;