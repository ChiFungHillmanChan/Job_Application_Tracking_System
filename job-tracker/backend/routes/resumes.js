// backend/routes/resumes.js - Fixed version
const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { v4: uuidv4 } = require('uuid');
const { protect } = require('../middleware/auth');
const {
  getResumes,
  uploadResume,
  getResume,
  setDefaultResume,
  downloadResume,
  previewResume,
  deleteResume
} = require('../controllers/resumeController');
const router = express.Router();

// Ensure uploads directory exists
const uploadsDir = path.join(__dirname, '../uploads/resumes');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

// Configure multer storage
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadsDir);
  },
  filename: (req, file, cb) => {
    // Create unique filename with original extension
    const fileExt = path.extname(file.originalname);
    const fileName = `${uuidv4()}${fileExt}`;
    cb(null, fileName);
  }
});

// Filter for allowed file types
const fileFilter = (req, file, cb) => {
  const allowedTypes = ['.pdf', '.doc', '.docx'];
  const ext = path.extname(file.originalname).toLowerCase();
  
  if (allowedTypes.includes(ext)) {
    cb(null, true);
  } else {
    cb(new Error('Invalid file type. Only PDF, DOC, and DOCX files are allowed.'), false);
  }
};

// Initialize multer upload
const upload = multer({
  storage,
  fileFilter,
  limits: { fileSize: 5 * 1024 * 1024 } // 5MB limit
});

// Routes
router.route('/')
  .get(protect, getResumes)
  .post(protect, upload.single('resumeFile'), uploadResume);

// IMPORTANT: Put specific routes BEFORE parameterized routes
router.put('/:id/default', protect, setDefaultResume);

// Download route - serves actual file
router.get('/:id/download', protect, downloadResume);

// Preview route - serves file with inline disposition
router.get('/:id/preview', protect, previewResume);

// General routes for specific resume
router.route('/:id')
  .get(protect, getResume)
  .delete(protect, deleteResume);

module.exports = router;