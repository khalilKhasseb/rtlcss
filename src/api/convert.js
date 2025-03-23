const express = require('express');
const { body, validationResult } = require('express-validator');
const convertService = require('../services/convert');
const validatorService = require('../services/validator');
const authMiddleware = require('../middleware/auth');
const { handleCssUpload, cleanupUploads } = require('../middleware/upload');
const { generalLimiter } = require('../middleware/rateLimit');
const { validationError } = require('../utils/errors');
const logger = require('../utils/logger');

const router = express.Router();

/**
 * Helper function to process conversion requests
 */
const processConversion = async (req, res, next, conversionFunction) => {
  try {
    // Get CSS content - either from file upload or request body
    let css = null;
    if (req.file) {
      const fs = require('fs').promises;
      css = await fs.readFile(req.file.path, 'utf8');
    } else if (req.body.css) {
      css = req.body.css;
    }
    
    // Validate RTLCSS options if provided
    let rtlcssOptions = {};
    if (req.body.options) {
      try {
        const optionsObj = typeof req.body.options === 'string' 
          ? JSON.parse(req.body.options) 
          : req.body.options;
        
        rtlcssOptions = validatorService.validateRtlcssOptions(optionsObj);
      } catch (error) {
        if (error.isOperational) {
          return next(error);
        }
        return next(validationError('Invalid options format', 'INVALID_OPTIONS_FORMAT'));
      }
    }
    
    // Perform conversion
    const result = await conversionFunction({
      css,
      filePath: req.file ? req.file.path : null,
      rtlcssOptions,
      apiKey: req.apiKey,
    });
    
    res.json({
      success: true,
      data: {
        converted: result.converted,
        stats: result.stats,
      },
      meta: {
        service: 'rtlcss-api',
        version: require('../../package.json').version,
        timestamp: new Date().toISOString(),
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * POST /api/convert/ltr-to-rtl
 * Convert LTR CSS to RTL
 */
router.post(
  '/ltr-to-rtl',
  authMiddleware,
  generalLimiter,
  handleCssUpload,
  cleanupUploads,
  async (req, res, next) => {
    logger.info('Processing LTR to RTL conversion');
    await processConversion(req, res, next, convertService.ltrToRtl);
  }
);

/**
 * POST /api/convert/rtl-to-ltr
 * Convert RTL CSS to LTR
 */
router.post(
  '/rtl-to-ltr',
  authMiddleware,
  generalLimiter,
  handleCssUpload,
  cleanupUploads,
  async (req, res, next) => {
    logger.info('Processing RTL to LTR conversion');
    await processConversion(req, res, next, convertService.rtlToLtr);
  }
);

module.exports = router;