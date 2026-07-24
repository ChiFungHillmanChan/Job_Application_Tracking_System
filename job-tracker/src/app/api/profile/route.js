// Port of backend/controllers/profileController.js getProfile, updateProfile
// @route   GET/PUT /api/profile
// @access  Private
//
// The `Resume` model import is side-effect only: `.populate('cvFileRef', ...)`
// needs the 'Resume' schema registered under Next's per-route bundling (same
// reasoning as src/app/api/jobs/route.js's `.populate('resumeUsed', ...)`).
import { NextResponse } from 'next/server';
import { withApi } from '@/server/http';
import { requireAuth } from '@/server/auth';
import UserProfile from '@/server/models/UserProfile';
import '@/server/models/Resume';

export const GET = withApi(async (request) => {
  const authUser = await requireAuth(request);

  const profile = await UserProfile.findOne({ user: authUser._id }).populate(
    'cvFileRef',
    'name originalFilename mimeType'
  );

  if (!profile) {
    return NextResponse.json(
      {
        success: false,
        error: 'No profile found. Please analyze your CV first.',
      },
      { status: 404 }
    );
  }

  return NextResponse.json({ success: true, data: profile }, { status: 200 });
});

export const PUT = withApi(async (request) => {
  const authUser = await requireAuth(request);
  const body = await request.json();

  const profile = await UserProfile.findOne({ user: authUser._id });

  if (!profile) {
    return NextResponse.json(
      {
        success: false,
        error: 'No profile found. Please analyze your CV first.',
      },
      { status: 404 }
    );
  }

  const allowedFields = [
    'summary',
    'skills',
    'experience',
    'education',
    'certifications',
    'preferredRoles',
    'seniorityLevel',
  ];

  const updateData = {};
  for (const field of allowedFields) {
    if (body[field] !== undefined) {
      updateData[field] = body[field];
    }
  }

  const updatedProfile = await UserProfile.findOneAndUpdate(
    { user: authUser._id },
    updateData,
    { new: true, runValidators: true }
  );

  return NextResponse.json({ success: true, data: updatedProfile }, { status: 200 });
});
