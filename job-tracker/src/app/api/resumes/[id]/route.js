// Port of backend/controllers/resumeController.js getResume, deleteResume
// @route   GET/DELETE /api/resumes/:id
// @access  Private
//
// Deviation: fs.unlinkSync(...) is replaced with deleteResumeBlob(...),
// wrapped in try/catch to mirror the source's tolerance of a missing file
// (it checked fs.existsSync and only logger.warn'd instead of throwing).
import { NextResponse } from 'next/server';
import { withApi } from '@/server/http';
import { requireAuth } from '@/server/auth';
import { deleteResumeBlob } from '@/server/blob';
import Resume from '@/server/models/Resume';
import logger from '@/server/logger';

export const GET = withApi(async (request, context) => {
  const user = await requireAuth(request);
  const { id } = await context.params;

  const resume = await Resume.findById(id);

  if (!resume) {
    return NextResponse.json(
      { success: false, error: 'Resume not found' },
      { status: 404 }
    );
  }

  if (resume.user.toString() !== user._id.toString()) {
    return NextResponse.json(
      { success: false, error: 'Not authorized to access this resume' },
      { status: 403 }
    );
  }

  return NextResponse.json(
    { success: true, data: resume },
    { status: 200 }
  );
});

export const DELETE = withApi(async (request, context) => {
  const user = await requireAuth(request);
  const { id } = await context.params;

  const resume = await Resume.findById(id);

  if (!resume) {
    return NextResponse.json(
      { success: false, error: 'Resume not found' },
      { status: 404 }
    );
  }

  if (resume.user.toString() !== user._id.toString()) {
    return NextResponse.json(
      { success: false, error: 'Not authorized to delete this resume' },
      { status: 403 }
    );
  }

  if (resume.isDefault) {
    return NextResponse.json(
      {
        success: false,
        error: 'Cannot delete the default resume. Please set another resume as default first.',
      },
      { status: 400 }
    );
  }

  if (resume.blobUrl) {
    try {
      await deleteResumeBlob(resume.blobUrl);
    } catch (error) {
      logger.warn(`Blob not found during resume deletion: ${resume.blobUrl}`);
    }
  } else {
    logger.warn(`No blobUrl for resume during deletion: ${resume._id}`);
  }

  await resume.deleteOne();

  return NextResponse.json(
    { success: true, data: {} },
    { status: 200 }
  );
});
