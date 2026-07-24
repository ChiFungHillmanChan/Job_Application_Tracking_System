// Port of backend/controllers/resumeController.js downloadResume
// @route   GET /api/resumes/:id/download
// @access  Private
//
// Deviation: fs.createReadStream(...).pipe(res) is replaced with fetching
// the file from Vercel Blob and streaming that response body straight
// through. Content-Type/Content-Disposition/Cache-Control are ported
// verbatim; Content-Length is forwarded from the blob response when present
// (the source computed it from fs.statSync).
import { NextResponse } from 'next/server';
import path from 'path';
import { withApi } from '@/server/http';
import { requireAuth } from '@/server/auth';
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

  if (!resume.blobUrl) {
    logger.error(`No blob URL for resume: ${resume._id}`);
    return NextResponse.json(
      { success: false, error: 'Resume file not found' },
      { status: 404 }
    );
  }

  try {
    const blobRes = await fetch(resume.blobUrl);

    if (!blobRes.ok) {
      logger.error(`File not found: ${resume.blobUrl}`);
      return NextResponse.json(
        { success: false, error: 'Resume file not found' },
        { status: 404 }
      );
    }

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

    const headers = new Headers();
    headers.set('Content-Type', contentType);
    const contentLength = blobRes.headers.get('content-length');
    if (contentLength) headers.set('Content-Length', contentLength);
    headers.set(
      'Content-Disposition',
      `attachment; filename="${resume.originalFilename || resume.name + ext}"`
    );
    // private, no-store: the file is served over a ?token= auth path, so it must
    // never be cached by shared/CDN caches where the URL (token) could leak.
    headers.set('Cache-Control', 'private, no-store');

    return new Response(blobRes.body, { status: 200, headers });
  } catch (error) {
    logger.error(`Error serving file: ${error.message}`);
    return NextResponse.json(
      { success: false, error: 'Error serving file' },
      { status: 500 }
    );
  }
});
