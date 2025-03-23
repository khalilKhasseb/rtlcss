const fs = require('fs').promises;
const rtlcss = require('rtlcss');
const config = require('config');
const { validationError, internal } = require('../utils/errors');
const logger = require('../utils/logger');
const statsService = require('./stats');
const cacheService = require('./cache');
const monitoringService = require('./monitoring');

/**
 * CSS Conversion Service
 */
module.exports = {
    /**
     * Convert CSS from LTR to RTL
     * 
     * @param {Object} options - Conversion options
     * @param {string} options.css - CSS content to convert
     * @param {string} options.filePath - Path to CSS file (alternative to css)
     * @param {Object} options.rtlcssOptions - RTLCSS configuration options
     * @param {string} options.apiKey - API key for usage tracking
     * @returns {Object} Conversion result with stats
     */
    ltrToRtl: async ({ css, filePath, rtlcssOptions = {}, apiKey }) => {
        const startTime = process.hrtime();

        try {
            // If content is not provided directly, read from file
            if (!css && filePath) {
                css = await fs.readFile(filePath, 'utf8');
            }

            // Validate CSS content
            if (!css || typeof css !== 'string') {
                throw validationError('No valid CSS content provided', 'INVALID_CSS');
            }

            // Merge with default options
            const options = {
                ...config.get('rtlcss.defaultOptions'),
                ...rtlcssOptions,
            };

            // Generate cache key
            const cacheKey = cacheService.generateKey('ltr2rtl', {
                css,
                options
            });

            // Check cache first
            const cachedResult = cacheService.get(cacheKey);
            if (cachedResult) {
                // Record cache hit in monitoring
                logger.debug('Cache hit for LTR to RTL conversion');

                // Still record usage stats for the API key
                if (apiKey) {
                    await statsService.recordConversion({
                        apiKey,
                        conversionType: 'ltr_to_rtl',
                        originalSize: cachedResult.stats.originalSize,
                        convertedSize: cachedResult.stats.convertedSize,
                        processingTimeMs: 0, // From cache, so processing time is effectively zero
                    });
                }

                return cachedResult;
            }

            // Process CSS
            const originalSize = Buffer.byteLength(css, 'utf8');
            const convertedCss = rtlcss.process(css, options);
            const convertedSize = Buffer.byteLength(convertedCss, 'utf8');

            // Calculate processing time
            const [seconds, nanoseconds] = process.hrtime(startTime);
            const processingTimeMs = (seconds * 1000) + (nanoseconds / 1000000);

            // Create result object
            const result = {
                converted: convertedCss,
                stats: {
                    originalSize,
                    convertedSize,
                    processingTimeMs: Math.round(processingTimeMs),
                    cached: false
                },
            };

            // Store in cache
            cacheService.set(cacheKey, result);

            // Record conversion in monitoring service
            monitoringService.recordConversion({
                type: 'ltr_to_rtl',
                originalSize,
                convertedSize,
                processingTime: processingTimeMs,
                apiKey
            });
            // Record usage stats
            if (apiKey) {
                await statsService.recordConversion({
                    apiKey,
                    conversionType: 'ltr_to_rtl',
                    originalSize,
                    convertedSize,
                    processingTimeMs,
                });
            }

            return result;
        } catch (error) {
            // Log error
            // Record error in monitoring
            monitoringService.recordError({
                type: error.errorCode || 'CONVERSION_ERROR',
                message: error.message,
                apiKey
            });
            logger.error('Error converting LTR to RTL:', error);

            // If it's already an AppError, rethrow it
            if (error.isOperational) {
                throw error;
            }

            // Otherwise, wrap in an internal error
            throw internal('Error processing CSS conversion', 'CONVERSION_ERROR');
        }
    },

    /**
     * Convert CSS from RTL to LTR
     * 
     * This is trickier since RTLCSS doesn't directly support RTL to LTR conversion.
     * We implement a workaround by preprocessing the CSS to swap certain properties
     * and then applying RTLCSS.
     * 
     * @param {Object} options - Conversion options
     * @param {string} options.css - CSS content to convert
     * @param {string} options.filePath - Path to CSS file (alternative to css)
     * @param {Object} options.rtlcssOptions - RTLCSS configuration options
     * @param {string} options.apiKey - API key for usage tracking
     * @returns {Object} Conversion result with stats
     */
    rtlToLtr: async ({ css, filePath, rtlcssOptions = {}, apiKey }) => {
        const startTime = process.hrtime();

        try {
            // If content is not provided directly, read from file
            if (!css && filePath) {
                css = await fs.readFile(filePath, 'utf8');
            }

            // Validate CSS content
            if (!css || typeof css !== 'string') {
                throw validationError('No valid CSS content provided', 'INVALID_CSS');
            }

            // Preprocess the CSS to swap directions
            const preprocessedCss = css
                // Swap 'direction' property
                .replace(/direction\s*:\s*rtl\s*;/gi, 'direction: __LTR_PLACEHOLDER__;')
                .replace(/direction\s*:\s*ltr\s*;/gi, 'direction: rtl;')
                .replace(/direction\s*:\s*__LTR_PLACEHOLDER__\s*;/gi, 'direction: ltr;')

                // Swap 'right' and 'left' in property names
                .replace(/(margin|padding|border)-left/gi, '$1-__RIGHT_PLACEHOLDER__')
                .replace(/(margin|padding|border)-right/gi, '$1-left')
                .replace(/(margin|padding|border)-__RIGHT_PLACEHOLDER__/gi, '$1-right')

                // Swap 'right' and 'left' in property values
                .replace(/:\s*left\b/gi, ': __RIGHT_PLACEHOLDER__')
                .replace(/:\s*right\b/gi, ': left')
                .replace(/:\s*__RIGHT_PLACEHOLDER__\b/gi, ': right')

                // Handle float property
                .replace(/float\s*:\s*left\s*;/gi, 'float: __RIGHT_PLACEHOLDER__;')
                .replace(/float\s*:\s*right\s*;/gi, 'float: left;')
                .replace(/float\s*:\s*__RIGHT_PLACEHOLDER__\s*;/gi, 'float: right;')

                // Handle text-align property
                .replace(/text-align\s*:\s*left\s*;/gi, 'text-align: __RIGHT_PLACEHOLDER__;')
                .replace(/text-align\s*:\s*right\s*;/gi, 'text-align: left;')
                .replace(/text-align\s*:\s*__RIGHT_PLACEHOLDER__\s*;/gi, 'text-align: right;');

            // Merge with default options
            const options = {
                ...config.get('rtlcss.defaultOptions'),
                ...rtlcssOptions,
            };

            // Process CSS using RTLCSS
            const originalSize = Buffer.byteLength(css, 'utf8');
            const convertedCss = rtlcss.process(preprocessedCss, options);
            const convertedSize = Buffer.byteLength(convertedCss, 'utf8');

            // Calculate processing time
            const [seconds, nanoseconds] = process.hrtime(startTime);
            const processingTimeMs = (seconds * 1000) + (nanoseconds / 1000000);

            // Record usage stats
            if (apiKey) {
                await statsService.recordConversion({
                    apiKey,
                    conversionType: 'rtl_to_ltr',
                    originalSize,
                    convertedSize,
                    processingTimeMs,
                });
            }

            return {
                converted: convertedCss,
                stats: {
                    originalSize,
                    convertedSize,
                    processingTimeMs: Math.round(processingTimeMs),
                },
            };
        } catch (error) {
            // Log error
            logger.error('Error converting RTL to LTR:', error);

            // If it's already an AppError, rethrow it
            if (error.isOperational) {
                throw error;
            }

            // Otherwise, wrap in an internal error
            throw internal('Error processing CSS conversion', 'CONVERSION_ERROR');
        }
    },

    /**
     * Validate CSS content
     * @param {string} css - CSS content to validate
     * @returns {boolean} True if CSS is valid
     */
    validateCss: (css) => {
        // This is a simple validation; a more robust implementation
        // would use a CSS parser to check for syntax errors

        if (!css || typeof css !== 'string') {
            return false;
        }

        // Check for basic CSS structure (property-value pairs)
        const hasPropertyValuePairs = /[a-z-]+\s*:[^;]+;/i.test(css);

        // Check for balanced braces
        let braces = 0;
        for (let i = 0; i < css.length; i++) {
            if (css[i] === '{') braces++;
            if (css[i] === '}') braces--;

            // If at any point we have more closing than opening braces, it's invalid
            if (braces < 0) return false;
        }

        // CSS should have balanced braces and at least one property-value pair
        return braces === 0 && hasPropertyValuePairs;
    }
};