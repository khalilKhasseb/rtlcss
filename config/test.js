module.exports = {
    server: {
      port: process.env.PORT || 3000,
      env: 'test',
    },
    logging: {
      level: 'error', // Reduce logging noise during tests
    },
    rateLimit: {
      // Disable rate limiting for tests
      windowMs: 15 * 60 * 1000,
      max: 10000, 
    },
  };