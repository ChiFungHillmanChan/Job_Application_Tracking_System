const asyncHandler = require('express-async-handler');
const path = require('path');
const UserProfile = require('../models/UserProfile');
const Resume = require('../models/Resume');
const { extractTextFromFile } = require('../services/cvParser');
const { analyzeCV } = require('../services/aiProfileAnalyzer');
const logger = require('../utils/logger');

// @desc    Analyze CV and create/update user profile
// @route   POST /api/profile/analyze
// @access  Private
const analyzeUserCV = asyncHandler(async (req, res) => {
  const { resumeId } = req.body;

  let resume;
  if (resumeId) {
    resume = await Resume.findOne({ _id: resumeId, user: req.user._id });
    if (!resume) {
      return res.status(404).json({ success: false, error: 'Resume not found' });
    }
  } else {
    resume = await Resume.findOne({ user: req.user._id, isDefault: true });
    if (!resume) {
      resume = await Resume.findOne({ user: req.user._id }).sort({ createdAt: -1 });
    }
    if (!resume) {
      return res.status(400).json({
        success: false,
        error: 'No resume found. Please upload a resume first.'
      });
    }
  }

  const cvText = await extractTextFromFile(resume.file);
  const analysisResult = await analyzeCV(cvText);

  const profileData = {
    user: req.user._id,
    rawCvText: cvText,
    summary: analysisResult.summary,
    skills: analysisResult.skills,
    experience: analysisResult.experience,
    education: analysisResult.education,
    certifications: analysisResult.certifications,
    preferredRoles: analysisResult.preferredRoles,
    seniorityLevel: analysisResult.seniorityLevel,
    lastAnalyzedAt: new Date(),
    cvFileRef: resume._id
  };

  const profile = await UserProfile.findOneAndUpdate(
    { user: req.user._id },
    profileData,
    { upsert: true, new: true, runValidators: true }
  );

  logger.info(`Profile analyzed for user ${req.user._id}`);

  res.status(200).json({
    success: true,
    data: profile,
    message: 'CV analyzed and profile updated successfully'
  });
});

// @desc    Get user profile
// @route   GET /api/profile
// @access  Private
const getProfile = asyncHandler(async (req, res) => {
  const profile = await UserProfile.findOne({ user: req.user._id })
    .populate('cvFileRef', 'name originalFilename mimeType');

  if (!profile) {
    return res.status(404).json({
      success: false,
      error: 'No profile found. Please analyze your CV first.'
    });
  }

  res.status(200).json({ success: true, data: profile });
});

// @desc    Update user profile manually
// @route   PUT /api/profile
// @access  Private
const updateProfile = asyncHandler(async (req, res) => {
  const profile = await UserProfile.findOne({ user: req.user._id });

  if (!profile) {
    return res.status(404).json({
      success: false,
      error: 'No profile found. Please analyze your CV first.'
    });
  }

  const allowedFields = [
    'summary', 'skills', 'experience', 'education',
    'certifications', 'preferredRoles', 'seniorityLevel'
  ];

  const updateData = {};
  for (const field of allowedFields) {
    if (req.body[field] !== undefined) {
      updateData[field] = req.body[field];
    }
  }

  const updatedProfile = await UserProfile.findOneAndUpdate(
    { user: req.user._id },
    updateData,
    { new: true, runValidators: true }
  );

  res.status(200).json({ success: true, data: updatedProfile });
});

module.exports = { analyzeUserCV, getProfile, updateProfile };
