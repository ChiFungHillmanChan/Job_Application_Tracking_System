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

router.use((req, res, next) => {
  console.log(`Resume route: ${req.method} ${req.path}`);
  console.log('Route params:', req.params);
  console.log('Query params:', req.query);
  next();
});

const uploadsDir = path.join(__dirname, '../uploads/resumes');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadsDir);
  },
  filename: (req, file, cb) => {
    const fileExt = path.extname(file.originalname);
    const fileName = `${uuidv4()}${fileExt}`;
    cb(null, fileName);
  }
});

const fileFilter = (req, file, cb) => {
  const allowedTypes = ['.pdf', '.doc', '.docx'];
  const ext = path.extname(file.originalname).toLowerCase();
  
  if (allowedTypes.includes(ext)) {
    cb(null, true);
  } else {
    cb(new Error('Invalid file type. Only PDF, DOC, and DOCX files are allowed.'), false);
  }
};

const upload = multer({
  storage,
  fileFilter,
  limits: { fileSize: 5 * 1024 * 1024 } 
});

console.log('Setting up resume routes...');

router.route('/')
  .get(protect, getResumes)
  .post(protect, upload.single('resumeFile'), uploadResume);

router.put('/:id/default', protect, (req, res, next) => {
  console.log('Hit /default route with ID:', req.params.id);
  next();
}, setDefaultResume);

router.get('/:id/download', protect, downloadResume);
router.get('/:id/preview', protect, previewResume);

router.route('/:id')
  .get(protect, getResume)
  .delete(protect, deleteResume);

console.log('Resume routes configured');

module.exports = router;