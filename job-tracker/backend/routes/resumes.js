// backend/routes/resumes.js
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

// Configure multer storage
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    // Create uploads directory if it doesn't exist
    const uploadDir = path.join(__dirname, '../uploads/resumes');
    fs.mkdirSync(uploadDir, { recursive: true });
    cb(null, uploadDir);
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

router.route('/:id')
  .get(protect, getResume)
  .delete(protect, deleteResume);

router.put('/:id/default', protect, setDefaultResume);
router.get('/:id/download', protect, downloadResume);
router.get('/:id/preview', protect, previewResume);

module.exports = router;