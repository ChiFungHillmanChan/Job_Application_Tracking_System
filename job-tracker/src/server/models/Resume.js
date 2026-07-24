// ESM port of backend/models/Resume.js
// Adds `blobUrl` (per task-3 brief) to hold the Vercel Blob URL for the
// uploaded resume file, alongside the existing `file` field.
import mongoose from 'mongoose';

const ResumeSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  name: {
    type: String,
    required: [true, 'Please add a resume name'],
  },
  file: {
    type: String,
    required: [true, 'Please add a file path'],
  },
  blobUrl: {
    type: String,
  },
  originalFilename: {
    type: String,
    required: false,
    default: function() {
      return this.name ? `${this.name}.pdf` : 'resume.pdf';
    }
  },
  mimeType: {
    type: String,
    required: false,
    default: function() {
      if (this.file) {
        const ext = this.file.split('.').pop()?.toLowerCase();
        switch (ext) {
          case 'pdf': return 'application/pdf';
          case 'doc': return 'application/msword';
          case 'docx': return 'application/vnd.openxmlformats-officedocument.wordprocessingml.document';
          default: return 'application/octet-stream';
        }
      }
      return 'application/pdf';
    }
  },
  fileSize: {
    type: String,
  },
  version: {
    type: String,
    default: '1.0',
  },
  isDefault: {
    type: Boolean,
    default: false,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
  updatedAt: {
    type: Date,
    default: Date.now,
  },
});

ResumeSchema.pre('save', function(next) {
  this.updatedAt = new Date();

  if (!this.originalFilename) {
    this.originalFilename = this.name ? `${this.name}.pdf` : 'resume.pdf';
  }

  if (!this.mimeType && this.file) {
    const ext = this.file.split('.').pop()?.toLowerCase();
    switch (ext) {
      case 'pdf':
        this.mimeType = 'application/pdf';
        break;
      case 'doc':
        this.mimeType = 'application/msword';
        break;
      case 'docx':
        this.mimeType = 'application/vnd.openxmlformats-officedocument.wordprocessingml.document';
        break;
      default:
        this.mimeType = 'application/pdf';
    }
  } else if (!this.mimeType) {
    this.mimeType = 'application/pdf';
  }

  next();
});

// blobUrl is a permanent, public, unauthenticated URL to the user's CV -
// treat it as an internal-only field. Server code (download/preview/delete
// handlers) reads `resume.blobUrl` directly off the Mongoose document, which
// is unaffected by these transforms; only JSON/object serialization (i.e.
// what API responses send to the client) has it stripped.
ResumeSchema.set('toJSON', {
  transform(doc, ret) {
    delete ret.blobUrl;
    return ret;
  },
});
ResumeSchema.set('toObject', {
  transform(doc, ret) {
    delete ret.blobUrl;
    return ret;
  },
});

export default mongoose.models.Resume || mongoose.model('Resume', ResumeSchema);
