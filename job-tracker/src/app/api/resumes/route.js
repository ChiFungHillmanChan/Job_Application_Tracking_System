// Port of backend/controllers/resumeController.js getResumes, uploadResume
// and the multer config from backend/routes/resumes.js.
// @route   GET/POST /api/resumes
// @access  Private
//
// Deviation: multer (disk storage, field `resumeFile`, 5MB limit,
// .pdf/.doc/.docx only) is replaced with Vercel Blob. The uploaded file is
// read from multipart form data and stored via uploadResumeBlob; the Resume
// document keeps both `file` (the blob pathname, mirroring the legacy
// multer-generated filename) and the new `blobUrl`.
import { NextResponse } from 'next/server';
import crypto from 'node:crypto';
import { withApi } from '@/server/http';
import { requireAuth } from '@/server/auth';
import { uploadResumeBlob, deleteResumeBlob } from '@/server/blob';
import Resume from '@/server/models/Resume';

export const GET = withApi(async (request) => {
  const user = await requireAuth(request);

  const resumes = await Resume.find({ user: user._id }).sort({ createdAt: -1 });

  return NextResponse.json(
    {
      success: true,
      count: resumes.length,
      data: resumes,
    },
    { status: 200 }
  );
});

export const POST = withApi(async (request) => {
  const user = await requireAuth(request);

  const form = await request.formData();
  const file = form.get('resumeFile');

  if (!file || typeof file === 'string') {
    return NextResponse.json(
      { success: false, error: 'Please upload a file' },
      { status: 400 }
    );
  }

  const ext = ('.' + file.name.split('.').pop()).toLowerCase();

  if (!['.pdf', '.doc', '.docx'].includes(ext)) {
    return NextResponse.json(
      { success: false, error: 'Only PDF and Word documents are allowed' },
      { status: 400 }
    );
  }

  if (file.size > 5 * 1024 * 1024) {
    return NextResponse.json(
      { success: false, error: 'File size cannot exceed 5MB' },
      { status: 400 }
    );
  }

  const pathname = `resumes/${crypto.randomUUID()}${ext}`;
  const blob = await uploadResumeBlob(pathname, file, file.type);

  const name = form.get('name');

  if (!name) {
    await deleteResumeBlob(blob.url);
    return NextResponse.json(
      { success: false, error: 'Please provide a name for your resume' },
      { status: 400 }
    );
  }

  const fileSize = `${Math.round(file.size / 1024)} KB`;

  const resumeCount = await Resume.countDocuments({ user: user._id });
  const isDefault = resumeCount === 0;

  const resume = await Resume.create({
    user: user._id,
    name,
    file: pathname,
    blobUrl: blob.url,
    originalFilename: file.name,
    mimeType: file.type,
    fileSize,
    version: form.get('version') || '1.0',
    isDefault,
  });

  return NextResponse.json(
    {
      success: true,
      data: resume,
    },
    { status: 201 }
  );
});
