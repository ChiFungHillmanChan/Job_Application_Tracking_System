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
  
  // Create resume record with original filename and mime type
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

// backend/controllers/resumeController.js - Enhanced setDefaultResume with debugging

const setDefaultResume = asyncHandler(async (req, res) => {
  console.log('=== Setting Default Resume ===');
  console.log('Resume ID:', req.params.id);
  console.log('User ID:', req.user._id);
  console.log('User object:', JSON.stringify(req.user, null, 2));
  
  try {
    // Validate ObjectId format
    if (!req.params.id.match(/^[0-9a-fA-F]{24}$/)) {
      console.log('Invalid ObjectId format:', req.params.id);
      return res.status(400).json({
        success: false,
        error: 'Invalid resume ID format'
      });
    }
    
    // Find the resume to set as default
    console.log('Finding resume...');
    const resume = await Resume.findById(req.params.id);
    
    if (!resume) {
      console.log('Resume not found with ID:', req.params.id);
      
      // List all resumes for this user for debugging
      const userResumes = await Resume.find({ user: req.user._id });
      console.log('User has', userResumes.length, 'resumes:');
      userResumes.forEach(r => console.log(`- ${r._id}: ${r.name}`));
      
      return res.status(404).json({
        success: false,
        error: 'Resume not found'
      });
    }
    
    console.log('Found resume:', {
      id: resume._id,
      name: resume.name,
      user: resume.user,
      isDefault: resume.isDefault
    });
    
    // Check if resume belongs to user
    if (resume.user.toString() !== req.user._id.toString()) {
      console.log('Resume ownership mismatch:');
      console.log('- Resume user:', resume.user.toString());
      console.log('- Request user:', req.user._id.toString());
      
      return res.status(403).json({
        success: false,
        error: 'Not authorized to modify this resume'
      });
    }
    
    // If already default, no need to update
    if (resume.isDefault) {
      console.log('Resume is already default');
      return res.status(200).json({
        success: true,
        data: resume
      });
    }
    
    console.log('Starting transaction to update default resume...');
    
    // Use a transaction to ensure data consistency
    const session = await Resume.startSession();
    session.startTransaction();
    
    try {
      // First, unset any current default resume for this user
      const updateResult = await Resume.updateMany(
        { user: req.user._id, isDefault: true },
        { $set: { isDefault: false, updatedAt: new Date() } },
        { session }
      );
      
      console.log('Updated existing default resumes:', updateResult);
      
      // Then set the new default resume
      resume.isDefault = true;
      resume.updatedAt = new Date();
      await resume.save({ session });
      
      // Commit the transaction
      await session.commitTransaction();
      console.log('Transaction committed successfully');
      
      console.log('Successfully set resume as default:', resume._id);
      
      res.status(200).json({
        success: true,
        data: resume
      });
      
    } catch (transactionError) {
      // Rollback the transaction on error
      await session.abortTransaction();
      console.error('Transaction error:', transactionError);
      throw transactionError;
    } finally {
      session.endSession();
    }
    
  } catch (error) {
    console.error('=== Error setting default resume ===');
    console.error('Error details:', {
      message: error.message,
      stack: error.stack,
      name: error.name
    });
    
    // Check for specific MongoDB errors
    if (error.name === 'CastError') {
      return res.status(400).json({
        success: false,
        error: 'Invalid resume ID format'
      });
    }
    
    if (error.name === 'ValidationError') {
      return res.status(400).json({
        success: false,
        error: 'Validation error: ' + error.message
      });
    }
    
    res.status(500).json({
      success: false,
      error: 'Server error while setting default resume',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
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
  
  try {
    // Get file stats
    const stats = fs.statSync(filePath);
    
    // Determine content type based on file extension
    const ext = path.extname(resume.file).toLowerCase();
    let contentType = resume.mimeType || 'application/octet-stream';
    
    if (!contentType || contentType === 'application/octet-stream') {
      if (ext === '.pdf') {
        contentType = 'application/pdf';
      } else if (ext === '.doc') {
        contentType = 'application/msword';
      } else if (ext === '.docx') {
        contentType = 'application/vnd.openxmlformats-officedocument.wordprocessingml.document';
      }
    }
    
    // Set headers for inline display with iframe support
    res.setHeader('Content-Type', contentType);
    res.setHeader('Content-Length', stats.size);
    res.setHeader('Content-Disposition', `inline; filename="${resume.originalFilename || resume.name + ext}"`);
    res.setHeader('Cache-Control', 'public, max-age=3600');
    
    // IMPORTANT: Remove X-Frame-Options or set to allow same origin
    res.removeHeader('X-Frame-Options');
    // Or alternatively, explicitly allow same origin:
    // res.setHeader('X-Frame-Options', 'SAMEORIGIN');
    
    // For PDF files, add additional headers for better browser support
    if (ext === '.pdf') {
      res.setHeader('X-Content-Type-Options', 'nosniff');
      res.setHeader('Accept-Ranges', 'bytes');
    }
    
    // Create read stream and pipe to response
    const fileStream = fs.createReadStream(filePath);
    
    fileStream.on('error', (error) => {
      logger.error(`Error reading file: ${error.message}`);
      if (!res.headersSent) {
        res.status(500).json({
          success: false,
          error: 'Error reading file'
        });
      }
    });
    
    fileStream.pipe(res);
    
  } catch (error) {
    logger.error(`Error serving file: ${error.message}`);
    res.status(500).json({
      success: false,
      error: 'Error serving file'
    });
  }
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
  
  try {
    // Get file stats
    const stats = fs.statSync(filePath);
    
    // Determine content type based on file extension
    const ext = path.extname(resume.file).toLowerCase();
    let contentType = resume.mimeType || 'application/octet-stream';
    
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
    res.setHeader('Content-Length', stats.size);
    res.setHeader('Content-Disposition', `attachment; filename="${resume.originalFilename || resume.name + ext}"`);
    res.setHeader('Cache-Control', 'no-cache');
    
    // Create read stream and pipe to response
    const fileStream = fs.createReadStream(filePath);
    
    fileStream.on('error', (error) => {
      logger.error(`Error reading file: ${error.message}`);
      if (!res.headersSent) {
        res.status(500).json({
          success: false,
          error: 'Error reading file'
        });
      }
    });
    
    fileStream.pipe(res);
    
  } catch (error) {
    logger.error(`Error serving file: ${error.message}`);
    res.status(500).json({
      success: false,
      error: 'Error serving file'
    });
  }
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