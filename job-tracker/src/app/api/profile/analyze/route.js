// Port of backend/controllers/profileController.js analyzeUserCV
// @route   POST /api/profile/analyze
// @access  Private
//
// Deviation: the disk-based `extractTextFromFile(resume.file)` is replaced
// with fetching the resume from Vercel Blob and extracting text from the
// in-memory buffer - resumes no longer live on local disk (see
// src/server/blob.js, src/server/services/cvParser.js). `resume.blobUrl` is
// read directly off the hydrated Mongoose document (never returned to
// clients - Resume's toJSON/toObject transforms strip it).
import { NextResponse } from 'next/server';
import { withApi } from '@/server/http';
import { requireAuth } from '@/server/auth';
import UserProfile from '@/server/models/UserProfile';
import Resume from '@/server/models/Resume';
import { fetchResumeBuffer } from '@/server/blob';
import { extractTextFromBuffer } from '@/server/services/cvParser';
import { analyzeCV } from '@/server/services/aiProfileAnalyzer';
import logger from '@/server/logger';

export const maxDuration = 300;

export const POST = withApi(async (request) => {
  const authUser = await requireAuth(request);
  const body = await request.json();
  const { resumeId } = body;

  let resume;
  if (resumeId) {
    resume = await Resume.findOne({ _id: resumeId, user: authUser._id });
    if (!resume) {
      return NextResponse.json({ success: false, error: 'Resume not found' }, { status: 404 });
    }
  } else {
    resume = await Resume.findOne({ user: authUser._id, isDefault: true });
    if (!resume) {
      resume = await Resume.findOne({ user: authUser._id }).sort({ createdAt: -1 });
    }
    if (!resume) {
      return NextResponse.json(
        {
          success: false,
          error: 'No resume found. Please upload a resume first.',
        },
        { status: 400 }
      );
    }
  }

  const buffer = await fetchResumeBuffer(resume.blobUrl);
  const cvText = await extractTextFromBuffer(buffer, resume.originalFilename || resume.file);
  const analysisResult = await analyzeCV(cvText);

  const profileData = {
    user: authUser._id,
    rawCvText: cvText,
    summary: analysisResult.summary,
    skills: analysisResult.skills,
    experience: analysisResult.experience,
    education: analysisResult.education,
    certifications: analysisResult.certifications,
    preferredRoles: analysisResult.preferredRoles,
    seniorityLevel: analysisResult.seniorityLevel,
    lastAnalyzedAt: new Date(),
    cvFileRef: resume._id,
  };

  const profile = await UserProfile.findOneAndUpdate(
    { user: authUser._id },
    profileData,
    { upsert: true, new: true, runValidators: true }
  );

  logger.info(`Profile analyzed for user ${authUser._id}`);

  return NextResponse.json(
    {
      success: true,
      data: profile,
      message: 'CV analyzed and profile updated successfully',
    },
    { status: 200 }
  );
});
