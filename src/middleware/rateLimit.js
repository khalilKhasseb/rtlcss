const rateLimit = require('express-rate-limit');
const config = require('config');
const { tooManyRequests } = require('../utils/errors');

/**
 * Configure rate limiting by IP address
 */
const generalLimiter = rateLimit({
  windowMs: config.get('rateLimit.windowMs'),
  max: config.get('rateLimit.max'),
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req, res, next) => {
    next(tooManyRequests(
      `Too many requests from this IP. Please try again after ${Math.ceil(config.get('rateLimit.windowMs') / 60000)} minutes.`,
      'RATE_LIMIT_EXCEEDED'
    ));
  },
  keyGenerator: (req) => {
    // If API key is available, use it as part of the rate limiting key
    return req.apiKey ? `${req.ip}-${req.apiKey}` : req.ip;
  },
});

/**
 * Configure stricter rate limiting for auth endpoints
 */
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 20, // 20 requests per 15 minutes
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req, res, next) => {
    next(tooManyRequests(
      'Too many authentication attempts. Please try again after 15 minutes.',
      'AUTH_RATE_LIMIT_EXCEEDED'
    ));
  },
});

module.exports = {
  generalLimiter,
  authLimiter,
  // Also export as a property for backwards compatibility
  rateLimiter: generalLimiter
};