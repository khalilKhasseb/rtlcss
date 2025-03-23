const multer = require('multer');
const path = require('path');
const fs = require('fs');
const config = require('config');
const { badRequest } = require('../utils/errors');

// Create uploads directory if it doesn't exist
const uploadsDir = path.join(__dirname, '../../uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

// Configure multer storage
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadsDir);
  },
  filename: (req, file, cb) => {
    // Generate a unique filename with timestamp
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, `${uniqueSuffix}-${file.originalname}`);
  }
});

// File filter function
const fileFilter = (req, file, cb) => {
  const allowedMimeTypes = config.get('upload.allowedMimeTypes');
  
  // Check if the file's MIME type is allowed
  if (allowedMimeTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    // Reject file
    cb(badRequest(
      `Invalid file type. Allowed types: ${allowedMimeTypes.join(', ')}`,
      'INVALID_FILE_TYPE'
    ), false);
  }
};

// Configure multer
const upload = multer({
  storage,
  limits: {
    fileSize: config.get('upload.limits.fileSize')
  },
  fileFilter
});

// Middleware to handle CSS file uploads
const cssFileUpload = upload.single('cssFile');

// Wrapper to handle multer errors
const handleCssUpload = (req, res, next) => {
  cssFileUpload(req, res, (err) => {
    if (err) {
      if (err.code === 'LIMIT_FILE_SIZE') {
        return next(badRequest(
          `File too large. Maximum size: ${config.get('upload.limits.fileSize') / (1024 * 1024)}MB`,
          'FILE_TOO_LARGE'
        ));
      }
      
      // If it's already an AppError, pass it along
      if (err.isOperational) {
        return next(err);
      }
      
      // Otherwise, create a generic error
      return next(badRequest(err.message, 'UPLOAD_ERROR'));
    }
    
    // If there's no file and no CSS text, return an error
    if (!req.file && !req.body.css) {
      return next(badRequest(
        'No CSS content provided. Please upload a file or provide CSS text in the request body.',
        'NO_CSS_CONTENT'
      ));
    }
    
    next();
  });
};

// Cleanup function to remove temporary files
const cleanupUploads = (req, res, next) => {
  // Clean up file after response is sent
  res.on('finish', () => {
    if (req.file && req.file.path) {
      fs.unlink(req.file.path, (err) => {
        if (err) {
          console.error('Error cleaning up temporary file:', err);
        }
      });
    }
  });
  
  next();
};

module.exports = {
  handleCssUpload,
  cleanupUploads
};