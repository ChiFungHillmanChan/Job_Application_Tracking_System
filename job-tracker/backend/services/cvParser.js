const fs = require('fs');
const path = require('path');
const pdfParse = require('pdf-parse');
const mammoth = require('mammoth');
const logger = require('../utils/logger');

async function extractTextFromFile(filePath) {
  const absolutePath = path.isAbsolute(filePath)
    ? filePath
    : path.join(__dirname, '../uploads/resumes', filePath);

  if (!fs.existsSync(absolutePath)) {
    throw new Error(`File not found: ${absolutePath}`);
  }

  const ext = path.extname(absolutePath).toLowerCase();

  switch (ext) {
    case '.pdf':
      return extractFromPdf(absolutePath);
    case '.docx':
      return extractFromDocx(absolutePath);
    case '.doc':
      return extractFromDocx(absolutePath);
    case '.txt':
      return fs.readFileSync(absolutePath, 'utf-8');
    default:
      throw new Error(`Unsupported file type: ${ext}. Supported: .pdf, .docx, .doc, .txt`);
  }
}

async function extractFromPdf(filePath) {
  const dataBuffer = fs.readFileSync(filePath);
  const data = await pdfParse(dataBuffer);

  if (!data.text || data.text.trim().length === 0) {
    throw new Error('PDF appears to be image-based or empty. Please upload a text-based PDF.');
  }

  logger.info(`Extracted ${data.text.length} characters from PDF (${data.numpages} pages)`);
  return data.text;
}

async function extractFromDocx(filePath) {
  const result = await mammoth.extractRawText({ path: filePath });

  if (!result.value || result.value.trim().length === 0) {
    throw new Error('DOCX appears to be empty. Please upload a file with text content.');
  }

  if (result.messages && result.messages.length > 0) {
    logger.warn('DOCX extraction warnings:', result.messages);
  }

  logger.info(`Extracted ${result.value.length} characters from DOCX`);
  return result.value;
}

module.exports = { extractTextFromFile };
