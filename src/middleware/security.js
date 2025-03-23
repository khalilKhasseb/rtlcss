const helmet = require('helmet');
const { validationError } = require('../utils/errors');
const logger = require('../utils/logger');

/**
 * Enhanced security middleware for the API
 */

/**
 * Apply helmet security headers with custom configuration
 */
const applySecurityHeaders = helmet({
  // Content Security Policy
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'"],
      objectSrc: ["'none'"],
      upgradeInsecureRequests: [],
    },
  },
  // Strict Transport Security (force HTTPS)
  hsts: {
    maxAge: 63072000, // 2 years in seconds
    includeSubDomains: true,
    preload: true,
  },
  // No Referrer Policy
  referrerPolicy: {
    policy: 'no-referrer',
  },
  // Prevent browsers from MIME-sniffing
  noSniff: true,
  // Prevent clickjacking
  frameguard: {
    action: 'deny',
  },
  // Disable X-Powered-By header
  hidePoweredBy: true,
  // Prevent XSS attacks
  xssFilter: true,
});

/**
 * Middleware to enforce HTTPS in production
 */
const enforceHTTPS = (req, res, next) => {
  if (
    process.env.NODE_ENV === 'production' &&
    req.headers['x-forwarded-proto'] !== 'https'
  ) {
    // Redirect to HTTPS
    return res.redirect(`https://${req.hostname}${req.url}`);
  }
  next();
};

/**
 * Middleware to validate content-type headers
 */
const validateContentType = (req, res, next) => {
  // Skip for GET and OPTIONS requests
  if (['GET', 'OPTIONS'].includes(req.method)) {
    return next();
  }
  
  const contentType = req.headers['content-type'] || '';
  
  // Allow multipart/form-data for file uploads
  if (req.path.includes('/convert/') && contentType.includes('multipart/form-data')) {
    return next();
  }
  
  // Otherwise, require application/json
  if (!contentType.includes('application/json')) {
    return next(
      validationError(
        'Content-Type must be application/json',
        'INVALID_CONTENT_TYPE'
      )
    );
  }
  
  next();
};

/**
 * Middleware to prevent API abuse by validating request size
 */
const validateRequestSize = (maxSizeMB = 10) => {
  const maxSize = maxSizeMB * 1024 * 1024; // Convert to bytes
  
  return (req, res, next) => {
    // Skip for GET requests
    if (req.method === 'GET') {
      return next();
    }
    
    const contentLength = parseInt(req.headers['content-length'] || '0', 10);
    
    if (contentLength > maxSize) {
      return next(
        validationError(
          `Request body too large. Maximum size is ${maxSizeMB}MB`,
          'REQUEST_TOO_LARGE'
        )
      );
    }
    
    next();
  };
};

/**
 * Middleware to log suspicious requests
 */
const logSuspiciousRequests = (req, res, next) => {
  // Check for suspicious query parameters
  const hasInlineJS = Object.keys(req.query).some(key => {
    const value = req.query[key];
    return typeof value === 'string' && (
      value.includes('<script>') ||
      value.includes('javascript:') ||
      value.includes('eval(') ||
      value.includes('document.cookie')
    );
  });
  
  if (hasInlineJS) {
    logger.warn({
      message: 'Suspicious query parameters detected',
      ip: req.ip,
      path: req.path,
      query: req.query
    });
  }
  
  // Check for suspicious headers
  const suspiciousUserAgent = req.get('user-agent') && (
    req.get('user-agent').includes('sqlmap') ||
    req.get('user-agent').includes('nikto') ||
    req.get('user-agent').includes('nessus')
  );
  
  if (suspiciousUserAgent) {
    logger.warn({
      message: 'Suspicious user-agent detected',
      ip: req.ip,
      path: req.path,
      userAgent: req.get('user-agent')
    });
  }
  
  next();
};

module.exports = {
  applySecurityHeaders,
  enforceHTTPS,
  validateContentType,
  validateRequestSize,
  logSuspiciousRequests,
};