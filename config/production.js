module.exports = {
    server: {
      port: process.env.PORT || 3000,
      env: 'production',
    },
    logging: {
      level: process.env.LOG_LEVEL || 'error',
    },
    auth: {
      // This ensures we don't use the default key in production
      secretKey: process.env.AUTH_SECRET_KEY || (() => {
        throw new Error('AUTH_SECRET_KEY environment variable is required in production');
      })(),
    },
    rateLimit: {
      // More conservative rate limiting in production
      windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS || '900000', 10), // 15 minutes
      max: parseInt(process.env.RATE_LIMIT_MAX || '50', 10), // Limit to 50 requests per window by default
    },
  };