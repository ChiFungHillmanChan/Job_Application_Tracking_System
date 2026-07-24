// Port of backend/controllers/autoApplyController.js getSearchConfig, updateSearchConfig
// @route   GET/PUT /api/auto-apply/config
// @access  Private
import { NextResponse } from 'next/server';
import { withApi } from '@/server/http';
import { requireAuth } from '@/server/auth';
import SearchConfig from '@/server/models/SearchConfig';

export const GET = withApi(async (request) => {
  const authUser = await requireAuth(request);

  let config = await SearchConfig.findOne({ user: authUser._id });

  if (!config) {
    config = await SearchConfig.create({
      user: authUser._id,
      keywords: [],
      locations: [],
      jobTypes: ['permanent', 'full-time'],
      workTypes: ['onsite', 'remote', 'hybrid'],
      boards: ['reed'],
      isActive: false,
    });
  }

  return NextResponse.json({ success: true, data: config }, { status: 200 });
});

export const PUT = withApi(async (request) => {
  const authUser = await requireAuth(request);
  const body = await request.json();

  const allowedFields = [
    'keywords',
    'locations',
    'jobTypes',
    'workTypes',
    'salaryMin',
    'salaryMax',
    'excludeCompanies',
    'excludeKeywords',
    'boards',
    'isActive',
    'searchFrequency',
    'maxResultsPerRun',
    'matchScoreThreshold',
  ];

  const updateData = {};
  for (const field of allowedFields) {
    if (body[field] !== undefined) {
      updateData[field] = body[field];
    }
  }

  const config = await SearchConfig.findOneAndUpdate(
    { user: authUser._id },
    updateData,
    { new: true, runValidators: true, upsert: true }
  );

  return NextResponse.json({ success: true, data: config }, { status: 200 });
});
