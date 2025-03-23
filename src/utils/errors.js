/**
 * Application error classes and factories
 */

class AppError extends Error {
    constructor(message, statusCode, errorCode) {
      super(message);
      this.statusCode = statusCode;
      this.errorCode = errorCode;
      this.isOperational = true; // Indicates if error is operational (expected)
    }
  }
  
  // Factory functions for common error types
  module.exports = {
    AppError,
    
    // 400 Bad Request
    badRequest: (message = 'Bad Request', errorCode = 'BAD_REQUEST') => 
      new AppError(message, 400, errorCode),
    
    // 401 Unauthorized
    unauthorized: (message = 'Authentication required', errorCode = 'UNAUTHORIZED') => 
      new AppError(message, 401, errorCode),
    
    // 403 Forbidden
    forbidden: (message = 'Access denied', errorCode = 'FORBIDDEN') => 
      new AppError(message, 403, errorCode),
    
    // 404 Not Found
    notFound: (message = 'Resource not found', errorCode = 'NOT_FOUND') => 
      new AppError(message, 404, errorCode),
    
    // 409 Conflict
    conflict: (message = 'Resource conflict', errorCode = 'CONFLICT') => 
      new AppError(message, 409, errorCode),
    
    // 422 Unprocessable Entity
    validationError: (message = 'Validation error', errorCode = 'VALIDATION_ERROR') => 
      new AppError(message, 422, errorCode),
    
    // 429 Too Many Requests
    tooManyRequests: (message = 'Too many requests', errorCode = 'RATE_LIMIT_EXCEEDED') => 
      new AppError(message, 429, errorCode),
    
    // 500 Internal Server Error
    internal: (message = 'Internal server error', errorCode = 'INTERNAL_ERROR') => 
      new AppError(message, 500, errorCode),
    
    // Custom error
    custom: (message, statusCode, errorCode) => 
      new AppError(message, statusCode, errorCode),
  };