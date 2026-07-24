// Port of backend/controllers/resumeController.js setDefaultResume
// @route   PUT /api/resumes/:id/default
// @access  Private
//
// Deviation: dropped the source's ad hoc console.log debug tracing
// ("=== Setting Default Resume ===", etc.) - not part of the response
// contract. The try/catch with ValidationError handling and the generic
// 500 fallback (including the dev-only `details` field) are ported verbatim.
import { NextResponse } from 'next/server';
import { withApi } from '@/server/http';
import { requireAuth } from '@/server/auth';
import Resume from '@/server/models/Resume';
import logger from '@/server/logger';

export const PUT = withApi(async (request, context) => {
  const user = await requireAuth(request);
  const { id } = await context.params;

  try {
    const resume = await Resume.findById(id);

    if (!resume) {
      return NextResponse.json(
        { success: false, error: 'Resume not found' },
        { status: 404 }
      );
    }

    if (resume.user.toString() !== user._id.toString()) {
      return NextResponse.json(
        { success: false, error: 'Not authorized to modify this resume' },
        { status: 403 }
      );
    }

    if (resume.isDefault) {
      return NextResponse.json(
        { success: true, data: resume },
        { status: 200 }
      );
    }

    if (!resume.originalFilename) {
      resume.originalFilename = resume.file || `${resume.name}.pdf`;
    }

    if (!resume.mimeType) {
      let mimeType = 'application/pdf';
      if (resume.file) {
        const ext = resume.file.split('.').pop()?.toLowerCase();
        switch (ext) {
          case 'pdf':
            mimeType = 'application/pdf';
            break;
          case 'doc':
            mimeType = 'application/msword';
            break;
          case 'docx':
            mimeType = 'application/vnd.openxmlformats-officedocument.wordprocessingml.document';
            break;
        }
      }
      resume.mimeType = mimeType;
    }

    await Resume.updateMany(
      { user: user._id, isDefault: true },
      { $set: { isDefault: false, updatedAt: new Date() } }
    );

    resume.isDefault = true;
    resume.updatedAt = new Date();

    const savedResume = await resume.save();

    return NextResponse.json(
      { success: true, data: savedResume },
      { status: 200 }
    );
  } catch (error) {
    logger.error(`Error setting default resume: ${error.message}`);

    if (error.name === 'ValidationError') {
      return NextResponse.json(
        { success: false, error: 'Validation error: ' + error.message },
        { status: 400 }
      );
    }

    return NextResponse.json(
      {
        success: false,
        error: 'Server error while setting default resume',
        details: process.env.NODE_ENV === 'development' ? error.message : undefined,
      },
      { status: 500 }
    );
  }
});
