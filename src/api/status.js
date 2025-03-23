const express = require('express');
const authMiddleware = require('../middleware/auth');
const statsService = require('../services/stats');

const router = express.Router();

/**
 * GET /api/status
 * Get service status (public)
 */
router.get('/', (req, res) => {
  const rtlcssVersion = require('rtlcss/package.json').version;
  
  res.json({
    success: true,
    data: {
      status: 'operational',
      version: require('../../package.json').version,
      rtlcssVersion,
      uptime: Math.floor(process.uptime()),
      environment: process.env.NODE_ENV || 'development',
    },
    meta: {
      service: 'rtlcss-api',
      timestamp: new Date().toISOString(),
    },
  });
});

/**
 * GET /api/status/usage
 * Get usage statistics for the authenticated API key
 */
router.get('/usage', authMiddleware, async (req, res, next) => {
  try {
    const stats = await statsService.getStats(req.apiKey);
    
    res.json({
      success: true,
      data: {
        usage: {
          totalConversions: stats.totalConversions,
          ltrToRtl: stats.conversionsByType.ltr_to_rtl,
          rtlToLtr: stats.conversionsByType.rtl_to_ltr,
          averageProcessingTimeMs: stats.averageProcessingTimeMs,
          averageOriginalSize: stats.averageOriginalSize,
          averageConvertedSize: stats.averageConvertedSize,
          lastUsed: stats.lastUsed,
        },
        // Include recent conversion history (limited)
        history: stats.history.slice(0, 10).map(entry => ({
          timestamp: entry.timestamp,
          conversionType: entry.conversionType,
          originalSize: entry.originalSize,
          convertedSize: entry.convertedSize,
          processingTimeMs: entry.processingTimeMs,
        })),
      },
      meta: {
        service: 'rtlcss-api',
        timestamp: new Date().toISOString(),
      },
    });
  } catch (error) {
    next(error);
  }
});

module.exports = router;