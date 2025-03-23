const { unauthorized, badRequest } = require('../utils/errors');
const { verifySignature, isTimestampValid } = require('../utils/crypto');
const authService = require('../services/auth');
const logger = require('../utils/logger');

/**
 * Authentication middleware to validate API requests
 */
module.exports = async (req, res, next) => {
  try {
    // Extract headers
    const apiKey = req.header('X-API-Key');
    const timestamp = req.header('X-Timestamp');
    const signature = req.header('X-Signature');
    
    // Ensure all required headers are present
    if (!apiKey || !timestamp || !signature) {
      return next(unauthorized('Missing authentication headers', 'MISSING_AUTH_HEADERS'));
    }
    
    // Validate timestamp format
    const timestampNum = parseInt(timestamp, 10);
    if (isNaN(timestampNum)) {
      return next(badRequest('Invalid timestamp format', 'INVALID_TIMESTAMP'));
    }
    
    // Check if timestamp is within acceptable range
    if (!isTimestampValid(timestampNum)) {
      return next(unauthorized('Request timestamp expired', 'TIMESTAMP_EXPIRED'));
    }
    
    // Get API secret for this key
    const apiSecret = await authService.getApiSecret(apiKey);
    if (!apiSecret) {
      logger.warn(`Authentication attempt with invalid API key: ${apiKey}`);
      return next(unauthorized('Invalid API key', 'INVALID_API_KEY'));
    }
    
    // Create payload string to verify
    // For simplicity, we're signing a combination of:
    // - Request path
    // - Request method
    // - Timestamp
    // In a real-world app, you might want to include more data in the signature
    logger.debug(`Verifying signature for API key: ${apiKey}`);
    logger.debug(`Request path: ${req.path}`);
    logger.debug(`Request method: ${req.method}`);
    logger.debug(`Timestamp: ${timestamp}`);
    const payload = `${req.path}|${req.method}|${timestamp}`;
    
    // Verify signature
    if (!verifySignature(payload, signature, apiSecret)) {
      logger.warn(`Invalid signature for API key: ${apiKey}`);
      return next(unauthorized('Invalid signature', 'INVALID_SIGNATURE'));
    }
    
    // Store API key in request for later use (e.g., usage tracking)
    req.apiKey = apiKey;
    
    // Authentication successful, proceed to the next middleware/route
    next();
  } catch (error) {
    logger.error('Authentication error:', error);
    next(unauthorized('Authentication failed', 'AUTH_FAILED'));
  }
};