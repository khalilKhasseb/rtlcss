const express = require('express');
const { body, validationResult } = require('express-validator');
const config = require('config');
const authService = require('../services/auth');
const statsService = require('../services/stats');
const monitoringService = require('../services/monitoring');
const cacheService = require('../services/cache');
const logger = require('../utils/logger');
const { unauthorized, validationError, forbidden } = require('../utils/errors');

const router = express.Router();

/**
 * Admin authentication middleware
 * Requires a special admin token in the header
 */
const adminAuth = (req, res, next) => {
  const adminToken = req.header('X-Admin-Token');
  const configToken = process.env.ADMIN_API_TOKEN || 'development_admin_token';
  
  if (!adminToken || adminToken !== configToken) {
    return next(forbidden('Admin authentication required', 'ADMIN_AUTH_REQUIRED'));
  }
  
  next();
};

// Apply admin authentication to all routes in this router
// router.use(adminAuth);

/**
 * GET /api/admin/metrics
 * Get service metrics
 */
router.get('/metrics', (req, res) => {
  // Get detailed metrics if requested
  const detailed = req.query.detailed === 'true';
  
  // Get metrics from the monitoring service
  const metrics = monitoringService.getMetrics(detailed);
  
  // Add cache statistics
  metrics.cache = cacheService.getStats();
  
  res.json({
    success: true,
    data: {
      metrics,
      service: {
        version: require('../../package.json').version,
        environment: config.get('server.env'),
        nodeVersion: process.version,
        uptime: process.uptime()
      }
    },
    meta: {
      service: 'rtlcss-api',
      timestamp: new Date().toISOString()
    }
  });
});

/**
 * GET /api/admin/api-keys
 * Get all API keys
 */
router.get('/api-keys', async (req, res, next) => {
  try {
    const keys = await authService.getAllApiKeys();
    
    res.json({
      success: true,
      data: {
        keys
      },
      meta: {
        service: 'rtlcss-api',
        timestamp: new Date().toISOString()
      }
    });
  } catch (error) {
    next(error);
  }
});

/**
 * POST /api/admin/api-keys
 * Create a new API key
 */
router.post('/api-keys', async (req, res, next) => {
  try {
    // Generate new API credentials
    const credentials = authService.createApiCredentials();

    // Respond with the generated API key and secret
    res.json({
      success: true,
      data: {
        apiKey: credentials.apiKey,
        apiSecret: credentials.apiSecret,
        createdAt: new Date().toISOString()
      },
      meta: {
        service: 'rtlcss-api',
        timestamp: new Date().toISOString()
      }
    });
  } catch (error) {
    next(error);
  }
});

/**
 * POST /api/admin/api-keys/:apiKey/disable
 * Disable an API key
 */
router.post('/api-keys/:apiKey/disable', async (req, res, next) => {
  try {
    const { apiKey } = req.params;
    
    const success = await authService.disableApiKey(apiKey);
    
    if (!success) {
      return next(validationError(`API key ${apiKey} not found`, 'API_KEY_NOT_FOUND'));
    }
    
    res.json({
      success: true,
      data: {
        apiKey,
        status: 'disabled',
        message: 'API key disabled successfully'
      },
      meta: {
        service: 'rtlcss-api',
        timestamp: new Date().toISOString()
      }
    });
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/admin/stats/usage
 * Get usage statistics for all API keys
 */
router.get('/stats/usage', async (req, res, next) => {
  try {
    const aggregateStats = await statsService.getAggregateStats();
    
    res.json({
      success: true,
      data: {
        stats: aggregateStats
      },
      meta: {
        service: 'rtlcss-api',
        timestamp: new Date().toISOString()
      }
    });
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/admin/stats/api-key/:apiKey
 * Get usage statistics for a specific API key
 */
router.get('/stats/api-key/:apiKey', async (req, res, next) => {
  try {
    const { apiKey } = req.params;
    
    // Verify API key exists
    const isValid = await authService.verifyApiKey(apiKey);
    
    if (!isValid) {
      return next(validationError(`API key ${apiKey} not found`, 'API_KEY_NOT_FOUND'));
    }
    
    const stats = await statsService.getStats(apiKey);
    
    res.json({
      success: true,
      data: {
        apiKey,
        stats
      },
      meta: {
        service: 'rtlcss-api',
        timestamp: new Date().toISOString()
      }
    });
  } catch (error) {
    next(error);
  }
});

/**
 * POST /api/admin/cache/clear
 * Clear the cache
 */
router.post('/cache/clear', (req, res) => {
  // Clear the cache
  cacheService.clear();
  
  res.json({
    success: true,
    data: {
      message: 'Cache cleared successfully',
      stats: cacheService.getStats()
    },
    meta: {
      service: 'rtlcss-api',
      timestamp: new Date().toISOString()
    }
  });
});

/**
 * GET /api/admin/logs
 * Get recent logs (placeholder - would typically use a proper logging service)
 */
router.get('/logs', (req, res) => {
  // In a real implementation, this would fetch logs from a database or logging service
  // For demo purposes, we'll just return a message
  res.json({
    success: true,
    data: {
      message: 'In production, this endpoint would return logs from a proper logging service.'
    },
    meta: {
      service: 'rtlcss-api',
      timestamp: new Date().toISOString()
    }
  });
});

module.exports = router;