const express = require('express');
const config = require('config');
const helmet = require('helmet');
const cors = require('cors');
const morgan = require('morgan');
const path = require('path');

// Import middleware
const errorMiddleware = require('./middleware/error');
const loggingMiddleware = require('./middleware/logging');
const security = require('./middleware/security');
// Import additional services
const monitoringService = require('./services/monitoring');
const cacheService = require('./services/cache');

// Import routes
const authRoutes = require('./api/auth');
const convertRoutes = require('./api/convert');
const statusRoutes = require('./api/status');
const testRoutes = require('./api/test');
const adminRoutes = require('./api/admin');


// Configure CORS with appropriate options
const corsOptions = {
    origin: config.get('server.env') === 'production'
        ? config.get('server.allowedOrigins') || '*'
        : '*',
    methods: ['GET', 'POST', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'X-API-Key', 'X-Timestamp', 'X-Signature'],
    maxAge: 86400 // 24 hours
};
// Create Express app
const app = express();

app.use(security.enforceHTTPS);
app.use(security.applySecurityHeaders);
app.use(security.validateRequestSize(config.get('upload.limits.fileSize') / (1024 * 1024)));
app.use(security.logSuspiciousRequests);

// Apply security middleware
app.use(helmet());

app.use(cors(corsOptions));

// Request parsing
app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: true, limit: '1mb' }));
app.use(security.validateContentType);


// Logging
if (config.get('server.env') !== 'test') {
    app.use(morgan('combined'));
}
app.use(loggingMiddleware);

// API routes
app.use('/api/auth', authRoutes);
app.use('/api/convert', convertRoutes);
app.use('/api/status', statusRoutes);
app.use('/api/test', testRoutes);
app.use('/api/admin', adminRoutes);

app.use('/admin', express.static(path.join(__dirname, 'public')));


// Root route for basic info
app.get('/', (req, res) => {
    res.json({
        name: 'rtlcss-api',
        version: require('../package.json').version,
        status: 'operational',
    });
});

// 404 handler
app.use((req, res, next) => {
    res.status(404).json({
        success: false,
        error: {
            code: 'RESOURCE_NOT_FOUND',
            message: `Route ${req.method} ${req.path} not found`,
        },
    });
});

// Request tracking middleware - place after routes to capture response info
app.use((req, res, next) => {
    // Record request completion in monitoring service
    const responseTime = Date.now() - req._startTime;
    monitoringService.recordRequest({
        endpoint: req.path,
        method: req.method,
        apiKey: req.apiKey,
        success: res.statusCode < 400,
        statusCode: res.statusCode,
        responseTime
    });
    next();
});

// Error handling
app.use(errorMiddleware);

module.exports = app;