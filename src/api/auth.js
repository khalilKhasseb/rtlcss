const express = require('express');
const { body, validationResult } = require('express-validator');
const authService = require('../services/auth');
const authMiddleware = require('../middleware/auth');
const { rateLimiter } = require('../middleware/rateLimit');
const { validationError, unauthorized } = require('../utils/errors');

const router = express.Router();

/**
 * POST /api/auth/verify
 * Verify API credentials
 */
router.post('/verify', authMiddleware, (req, res) => {
  res.json({
    success: true,
    data: {
      verified: true,
      apiKey: req.apiKey,
    },
    meta: {
      service: 'rtlcss-api',
      timestamp: new Date().toISOString(),
    },
  });
});

/**
 * GET /api/auth/verify
 * Verify API credentials via GET request
 */
router.get('/verify', authMiddleware, (req, res) => {
  res.json({
    success: true,
    data: {
      verified: true,
      apiKey: req.apiKey,
    },
    meta: {
      service: 'rtlcss-api',
      timestamp: new Date().toISOString(),
    },
  });
});

/**
 * POST /api/auth/create-key
 * Create a new API key/secret pair
 * 
 * In a real-world application, this would be secured by admin authentication
 * For simplicity, we're leaving it open in this implementation
 */
router.post('/create-key', 
  // Using the middleware if it exists, otherwise providing an empty array
  typeof rateLimiter !== 'undefined' ? rateLimiter : [],
  [
    body('admin_token')
      .optional()
      .isString()
      .withMessage('Admin token must be a string')
  ],
  (req, res, next) => {
    // Check for validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return next(validationError(
        'Validation error',
        'VALIDATION_ERROR',
        errors.array()
      ));
    }
    
    // In a real app, validate admin token
    // For demo purposes, we're skipping this step
    
    try {
      // Generate new API credentials
      const credentials = authService.createApiCredentials();
      
      res.json({
        success: true,
        data: {
          apiKey: credentials.apiKey,
          apiSecret: credentials.apiSecret,
          message: 'Store your API secret securely. It will not be shown again.',
        },
        meta: {
          service: 'rtlcss-api',
          timestamp: new Date().toISOString(),
        },
      });
    } catch (error) {
      next(error);
    }
  }
);

module.exports = router;