// ESM port of backend/services/cvParser.js.
//
// Per task-3 brief rule 3, the disk-path based `extractTextFromFile(filePath)`
// is replaced with `extractTextFromBuffer(buffer, filenameOrExt)` — resumes
// now live in Vercel Blob storage (see @/server/blob.js), not on local disk,
// so extraction takes an in-memory Buffer instead of reading from a path.
// No disk-path alias is kept; the profile-analyze route (ported later) is
// the only caller and uses this new name directly.
//
// pdf-parse is installed at v2 (see job-tracker/package.json), whose API is
// a full rewrite from the v1 `pdfParse(buffer) -> { text, numpages }`
// function call the original Express source used. v2 exposes a `PDFParse`
// class (`new PDFParse({ data: buffer }).getText()` -> `{ text, total }`);
// that class-based shape is used here so extraction actually works against
// the installed package, while preserving the same validation/logging
// behavior the original had.
import mammoth from 'mammoth';
import { PDFParse } from 'pdf-parse';
import logger from '@/server/logger';

export async function extractTextFromBuffer(buffer, filenameOrExt) {
  const ext = normalizeExt(filenameOrExt);

  switch (ext) {
    case '.pdf':
      return extractFromPdf(buffer);
    case '.docx':
      return extractFromDocx(buffer);
    case '.doc':
      return extractFromDocx(buffer);
    case '.txt':
      return buffer.toString('utf-8');
    default:
      throw new Error(`Unsupported file type: ${ext}. Supported: .pdf, .docx, .doc, .txt`);
  }
}

function normalizeExt(filenameOrExt) {
  if (!filenameOrExt) return '';
  const trimmed = filenameOrExt.trim().toLowerCase();
  const withDot = trimmed.startsWith('.') ? trimmed : `.${trimmed}`;
  // Handles both a bare extension ("pdf" / ".pdf") and a full filename
  // ("resume.pdf") by taking the last dot-segment.
  const lastDot = withDot.lastIndexOf('.');
  return withDot.slice(lastDot);
}

async function extractFromPdf(buffer) {
  const parser = new PDFParse({ data: buffer });

  let result;
  try {
    result = await parser.getText();
  } finally {
    await parser.destroy();
  }

  if (!result.text || result.text.trim().length === 0) {
    throw new Error('PDF appears to be image-based or empty. Please upload a text-based PDF.');
  }

  logger.info(`Extracted ${result.text.length} characters from PDF (${result.total} pages)`);
  return result.text;
}

async function extractFromDocx(buffer) {
  const result = await mammoth.extractRawText({ buffer });

  if (!result.value || result.value.trim().length === 0) {
    throw new Error('DOCX appears to be empty. Please upload a file with text content.');
  }

  if (result.messages && result.messages.length > 0) {
    logger.warn('DOCX extraction warnings:', result.messages);
  }

  logger.info(`Extracted ${result.value.length} characters from DOCX`);
  return result.value;
}
