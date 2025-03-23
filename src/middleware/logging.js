const logger = require('../utils/logger');

/**
 * Middleware to log each request
 */
module.exports = (req, res, next) => {
  // Log basic request information
  logger.info({
    type: 'request',
    method: req.method,
    path: req.path,
    ip: req.ip,
    userAgent: req.get('user-agent'),
    apiKey: req.headers['x-api-key'] ? '**present**' : '**missing**',
  });
  
  // Track response time
  const startTime = Date.now();
  
  // Once the response is finished, log the result
  res.on('finish', () => {
    const duration = Date.now() - startTime;
    
    // Determine log level based on status code
    const logMethod = res.statusCode >= 500 
      ? logger.error.bind(logger)
      : res.statusCode >= 400 
        ? logger.warn.bind(logger)
        : logger.info.bind(logger);
    
    logMethod({
      type: 'response',
      method: req.method,
      path: req.path,
      statusCode: res.statusCode,
      duration: `${duration}ms`,
      apiKey: req.apiKey ? '**authenticated**' : '**unauthenticated**',
    });
  });
  
  next();
};