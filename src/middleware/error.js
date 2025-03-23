const logger = require('../utils/logger');
const { AppError } = require('../utils/errors');

/**
 * Global error handling middleware
 */
module.exports = (err, req, res, next) => {
  // Log the error
  logger.error({
    message: err.message,
    stack: err.stack,
    path: req.path,
    method: req.method,
    ip: req.ip,
    isOperational: err.isOperational || false,
  });
  
  // If it's an AppError, use its status code and error code
  if (err instanceof AppError) {
    return res.status(err.statusCode).json({
      success: false,
      error: {
        code: err.errorCode,
        message: err.message,
      },
    });
  }
  
  // Handle Multer errors
  if (err.code === 'LIMIT_FILE_SIZE') {
    return res.status(400).json({
      success: false,
      error: {
        code: 'FILE_TOO_LARGE',
        message: 'Uploaded file is too large',
      },
    });
  }
  
  if (err.code === 'LIMIT_UNEXPECTED_FILE') {
    return res.status(400).json({
      success: false,
      error: {
        code: 'INVALID_FIELD_NAME',
        message: 'Invalid field name in form data',
      },
    });
  }
  
  // Handle other errors (default to 500 Internal Server Error)
  res.status(500).json({
    success: false,
    error: {
      code: 'INTERNAL_ERROR',
      message: process.env.NODE_ENV === 'production' 
        ? 'An unexpected error occurred' 
        : err.message,
    },
  });
};