const asyncHandler = require('express-async-handler');
const path = require('path');
const fs = require('fs');
const Resume = require('../models/Resume');
const logger = require('../utils/logger');


const getResumes = asyncHandler(async (req, res) => {
  const resumes = await Resume.find({ user: req.user._id }).sort({ createdAt: -1 });
  
  res.status(200).json({
    success: true,
    count: resumes.length,
    data: resumes
  });
});


const uploadResume = asyncHandler(async (req, res) => {
  if (!req.file) {
    return res.status(400).json({
      success: false,
      error: 'Please upload a file'
    });
  }


  const { filename, path: filePath, size, mimetype, originalname } = req.file;
  

  if (!req.body.name) {
    fs.unlinkSync(filePath);
    return res.status(400).json({
      success: false,
      error: 'Please provide a name for your resume'
    });
  }

  const fileSize = `${Math.round(size / 1024)} KB`;
  
  const resumeCount = await Resume.countDocuments({ user: req.user._id });
  const isDefault = resumeCount === 0;
  
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

const getResume = asyncHandler(async (req, res) => {
  const resume = await Resume.findById(req.params.id);
  
  if (!resume) {
    return res.status(404).json({
      success: false,
      error: 'Resume not found'
    });
  }
  
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

const setDefaultResume = asyncHandler(async (req, res) => {
  console.log('=== Setting Default Resume ===');
  console.log('Resume ID:', req.params.id);
  console.log('User ID:', req.user._id);
  
  try {
    const resume = await Resume.findById(req.params.id);
    
    if (!resume) {
      return res.status(404).json({
        success: false,
        error: 'Resume not found'
      });
    }
    
    if (resume.user.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        error: 'Not authorized to modify this resume'
      });
    }
    
    if (resume.isDefault) {
      return res.status(200).json({
        success: true,
        data: resume
      });
    }
    
    if (!resume.originalFilename) {
      resume.originalFilename = resume.file || `${resume.name}.pdf`;
      console.log('Fixed missing originalFilename:', resume.originalFilename);
    }
    
    if (!resume.mimeType) {
      let mimeType = 'application/pdf';
      if (resume.file) {
        const ext = resume.file.split('.').pop()?.toLowerCase();
        switch (ext) {
          case 'pdf': mimeType = 'application/pdf'; break;
          case 'doc': mimeType = 'application/msword'; break;
          case 'docx': mimeType = 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'; break;
        }
      }
      resume.mimeType = mimeType;
      console.log('Fixed missing mimeType:', resume.mimeType);
    }
    
    await Resume.updateMany(
      { user: req.user._id, isDefault: true },
      { $set: { isDefault: false, updatedAt: new Date() } }
    );
    
    resume.isDefault = true;
    resume.updatedAt = new Date();
    
    const savedResume = await resume.save();
    
    console.log('Successfully set resume as default');
    
    res.status(200).json({
      success: true,
      data: savedResume
    });
    
  } catch (error) {
    console.error('Error setting default resume:', error);
    
    if (error.name === 'ValidationError') {
      console.error('Validation details:', error.errors);
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

const previewResume = asyncHandler(async (req, res) => {
  const resume = await Resume.findById(req.params.id);
  
  if (!resume) {
    return res.status(404).json({
      success: false,
      error: 'Resume not found'
    });
  }
  
  if (resume.user.toString() !== req.user._id.toString()) {
    return res.status(403).json({
      success: false,
      error: 'Not authorized to access this resume'
    });
  }
  
  const filePath = path.join(__dirname, '../uploads/resumes', resume.file);
  
  if (!fs.existsSync(filePath)) {
    logger.error(`File not found: ${filePath}`);
    return res.status(404).json({
      success: false,
      error: 'Resume file not found'
    });
  }
  
  try {
    const stats = fs.statSync(filePath);
    
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
    
    res.setHeader('Content-Type', contentType);
    res.setHeader('Content-Length', stats.size);
    res.setHeader('Content-Disposition', `inline; filename="${resume.originalFilename || resume.name + ext}"`);
    res.setHeader('Cache-Control', 'public, max-age=3600');
    
    res.removeHeader('X-Frame-Options');

    if (ext === '.pdf') {
      res.setHeader('X-Content-Type-Options', 'nosniff');
      res.setHeader('Accept-Ranges', 'bytes');
    }
    
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

const downloadResume = asyncHandler(async (req, res) => {
  const resume = await Resume.findById(req.params.id);
  
  if (!resume) {
    return res.status(404).json({
      success: false,
      error: 'Resume not found'
    });
  }
  
  if (resume.user.toString() !== req.user._id.toString()) {
    return res.status(403).json({
      success: false,
      error: 'Not authorized to access this resume'
    });
  }
  
  const filePath = path.join(__dirname, '../uploads/resumes', resume.file);
  
  if (!fs.existsSync(filePath)) {
    logger.error(`File not found: ${filePath}`);
    return res.status(404).json({
      success: false,
      error: 'Resume file not found'
    });
  }
  
  try {
    const stats = fs.statSync(filePath);
    
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
    
    res.setHeader('Content-Type', contentType);
    res.setHeader('Content-Length', stats.size);
    res.setHeader('Content-Disposition', `attachment; filename="${resume.originalFilename || resume.name + ext}"`);
    res.setHeader('Cache-Control', 'no-cache');
    
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

const deleteResume = asyncHandler(async (req, res) => {
  const resume = await Resume.findById(req.params.id);
  
  if (!resume) {
    return res.status(404).json({
      success: false,
      error: 'Resume not found'
    });
  }
  

  if (resume.user.toString() !== req.user._id.toString()) {
    return res.status(403).json({
      success: false,
      error: 'Not authorized to delete this resume'
    });
  }
  
  if (resume.isDefault) {
    return res.status(400).json({
      success: false,
      error: 'Cannot delete the default resume. Please set another resume as default first.'
    });
  }
  
  const filePath = path.join(__dirname, '../uploads/resumes', resume.file);
  
  if (fs.existsSync(filePath)) {
    fs.unlinkSync(filePath);
  } else {
    logger.warn(`File not found during resume deletion: ${filePath}`);
  }
  
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