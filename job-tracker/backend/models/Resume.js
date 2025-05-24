const mongoose = require('mongoose');

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

module.exports = mongoose.model('Resume', ResumeSchema);