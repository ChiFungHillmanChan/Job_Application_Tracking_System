// backend/controllers/resumeController.js
const asyncHandler = require('express-async-handler');
const path = require('path');
const fs = require('fs');
const Resume = require('../models/Resume');
const logger = require('../utils/logger');

// @desc    Get all resumes for a user
// @route   GET /api/resumes
// @access  Private
const getResumes = asyncHandler(async (req, res) => {
  const resumes = await Resume.find({ user: req.user._id }).sort({ createdAt: -1 });
  
  res.status(200).json({
    success: true,
    count: resumes.length,
    data: resumes
  });
});

// @desc    Upload a new resume
// @route   POST /api/resumes
// @access  Private
const uploadResume = asyncHandler(async (req, res) => {
  if (!req.file) {
    return res.status(400).json({
      success: false,
      error: 'Please upload a file'
    });
  }

  // Get file info
  const { filename, path: filePath, size, mimetype, originalname } = req.file;
  
  // Check if name is provided
  if (!req.body.name) {
    // Delete the uploaded file if no name provided
    fs.unlinkSync(filePath);
    return res.status(400).json({
      success: false,
      error: 'Please provide a name for your resume'
    });
  }

  // Calculate file size in KB
  const fileSize = `${Math.round(size / 1024)} KB`;
  
  // Check if this is the first resume (to set as default)
  const resumeCount = await Resume.countDocuments({ user: req.user._id });
  const isDefault = resumeCount === 0;
  
  // Create resume record
  const resume = await Resume.create({
    user: req.user._id,
    name: req.body.name,
    file: filename,
    originalFilename: originalname,
    mimeType: mimetype,
    fileSize,
    version: req.body.version || '1.0',
    isDefault
  });

  res.status(201).json({
    success: true,
    data: resume
  });
});

// @desc    Get a single resume
// @route   GET /api/resumes/:id
// @access  Private
const getResume = asyncHandler(async (req, res) => {
  const resume = await Resume.findById(req.params.id);
  
  if (!resume) {
    return res.status(404).json({
      success: false,
      error: 'Resume not found'
    });
  }
  
  // Check if resume belongs to user
  if (resume.user.toString() !== req.user._id.toString()) {
    return res.status(403).json({
      success: false,
      error: 'Not authorized to access this resume'
    });
  }
  
  res.status(200).json({
    success: true,
    data: resume
  });
});

// @desc    Set a resume as default
// @route   PUT /api/resumes/:id/default
// @access  Private
const setDefaultResume = asyncHandler(async (req, res) => {
  // Find the resume to set as default
  const resume = await Resume.findById(req.params.id);
  
  if (!resume) {
    return res.status(404).json({
      success: false,
      error: 'Resume not found'
    });
  }
  
  // Check if resume belongs to user
  if (resume.user.toString() !== req.user._id.toString()) {
    return res.status(403).json({
      success: false,
      error: 'Not authorized to modify this resume'
    });
  }
  
  // If already default, no need to update
  if (resume.isDefault) {
    return res.status(200).json({
      success: true,
      data: resume
    });
  }
  
  // First, unset any current default resume
  await Resume.updateMany(
    { user: req.user._id, isDefault: true },
    { isDefault: false }
  );
  
  // Then set the new default resume
  resume.isDefault = true;
  await resume.save();
  
  res.status(200).json({
    success: true,
    data: resume
  });
});

// @desc    Download a resume
// @route   GET /api/resumes/:id/download
// @access  Private
const downloadResume = asyncHandler(async (req, res) => {
  const resume = await Resume.findById(req.params.id);
  
  if (!resume) {
    return res.status(404).json({
      success: false,
      error: 'Resume not found'
    });
  }
  
  // Check if resume belongs to user
  if (resume.user.toString() !== req.user._id.toString()) {
    return res.status(403).json({
      success: false,
      error: 'Not authorized to access this resume'
    });
  }
  
  // Build file path
  const filePath = path.join(__dirname, '../uploads/resumes', resume.file);
  
  // Check if file exists
  if (!fs.existsSync(filePath)) {
    logger.error(`File not found: ${filePath}`);
    return res.status(404).json({
      success: false,
      error: 'Resume file not found'
    });
  }
  
  // Determine content type based on file extension
  const ext = path.extname(resume.file).toLowerCase();
  let contentType = resume.mimeType || 'application/octet-stream'; // Use stored MIME type if available
  
  // Fallback content type determination if MIME type is not available
  if (!contentType || contentType === 'application/octet-stream') {
    if (ext === '.pdf') {
      contentType = 'application/pdf';
    } else if (ext === '.doc') {
      contentType = 'application/msword';
    } else if (ext === '.docx') {
      contentType = 'application/vnd.openxmlformats-officedocument.wordprocessingml.document';
    }
  }
  
  // Set headers for download
  res.setHeader('Content-Type', contentType);
  res.setHeader('Content-Disposition', `attachment; filename="${resume.originalFilename || resume.name + ext}"`);
  
  // Send file stream
  const fileStream = fs.createReadStream(filePath);
  fileStream.pipe(res);
});

// @desc    Preview a resume
// @route   GET /api/resumes/:id/preview
// @access  Private
const previewResume = asyncHandler(async (req, res) => {
  const resume = await Resume.findById(req.params.id);
  
  if (!resume) {
    return res.status(404).json({
      success: false,
      error: 'Resume not found'
    });
  }
  
  // Check if resume belongs to user
  if (resume.user.toString() !== req.user._id.toString()) {
    return res.status(403).json({
      success: false,
      error: 'Not authorized to access this resume'
    });
  }
  
  // Build file path
  const filePath = path.join(__dirname, '../uploads/resumes', resume.file);
  
  // Check if file exists
  if (!fs.existsSync(filePath)) {
    logger.error(`File not found: ${filePath}`);
    return res.status(404).json({
      success: false,
      error: 'Resume file not found'
    });
  }
  
  // Determine content type based on file extension
  const ext = path.extname(resume.file).toLowerCase();
  let contentType = resume.mimeType || 'application/octet-stream'; // Use stored MIME type if available
  
  // Fallback content type determination if MIME type is not available
  if (!contentType || contentType === 'application/octet-stream') {
    if (ext === '.pdf') {
      contentType = 'application/pdf';
    } else if (ext === '.doc') {
      contentType = 'application/msword';
    } else if (ext === '.docx') {
      contentType = 'application/vnd.openxmlformats-officedocument.wordprocessingml.document';
    }
  }
  
  // Set headers for inline display
  res.setHeader('Content-Type', contentType);
  res.setHeader('Content-Disposition', `inline; filename="${resume.originalFilename || resume.name + ext}"`);
  
  // Send file stream
  const fileStream = fs.createReadStream(filePath);
  fileStream.pipe(res);
});

// @desc    Delete a resume
// @route   DELETE /api/resumes/:id
// @access  Private
const deleteResume = asyncHandler(async (req, res) => {
  const resume = await Resume.findById(req.params.id);
  
  if (!resume) {
    return res.status(404).json({
      success: false,
      error: 'Resume not found'
    });
  }
  
  // Check if resume belongs to user
  if (resume.user.toString() !== req.user._id.toString()) {
    return res.status(403).json({
      success: false,
      error: 'Not authorized to delete this resume'
    });
  }
  
  // Cannot delete default resume
  if (resume.isDefault) {
    return res.status(400).json({
      success: false,
      error: 'Cannot delete the default resume. Please set another resume as default first.'
    });
  }
  
  // Get file path
  const filePath = path.join(__dirname, '../uploads/resumes', resume.file);
  
  // Delete file if it exists
  if (fs.existsSync(filePath)) {
    fs.unlinkSync(filePath);
  } else {
    logger.warn(`File not found during resume deletion: ${filePath}`);
  }
  
  // Remove database entry
  await resume.deleteOne();
  
  res.status(200).json({
    success: true,
    data: {}
  });
});

module.exports = {
  getResumes,
  uploadResume,
  getResume,
  setDefaultResume,
  downloadResume,
  previewResume,
  deleteResume
};