const config = require('config');
const app = require('./app');
const logger = require('./utils/logger');
// Import services for cleanup
const monitoringService = require('./services/monitoring');
const cacheService = require('./services/cache');

// Get port from configuration
const port = config.get('server.port');

// Start the server
const server = app.listen(port, () => {
    logger.info(`RTLCSS API service listening on port ${port} in ${config.get('server.env')} mode`);
});

// Handle unhandled rejections
process.on('unhandledRejection', (err) => {
    logger.error('Unhandled Rejection', err);
    // Gracefully shutdown on critical errors
    server.close(() => {
        monitoringService.shutdown();
        cacheService.shutdown();
        logger.info('Server closed due to unhandled rejection');
        process.exit(1);
    });
});

// Handle uncaught exceptions
process.on('uncaughtException', (err) => {
    logger.error('Uncaught Exception', err);
    // Gracefully shutdown on critical errors
    server.close(() => {
        // Clean up services
        monitoringService.shutdown();
        cacheService.shutdown();
        logger.info('Server closed due to uncaught exception');
        process.exit(1);
    });
});

// Handle graceful shutdown on SIGTERM
process.on('SIGTERM', () => {
    logger.info('SIGTERM received, shutting down gracefully');
    server.close(() => {
        // Clean up services
        monitoringService.shutdown();
        cacheService.shutdown();

        logger.info('Server closed gracefully');
        process.exit(0);
    });
});

module.exports = server; // Export for testing