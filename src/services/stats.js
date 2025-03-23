const logger = require('../utils/logger');

/**
 * In-memory storage for usage statistics
 * In a production environment, this would be replaced with a database
 */
const usageStats = new Map();

/**
 * Statistics service
 */
module.exports = {
  /**
   * Record a conversion for usage tracking
   * 
   * @param {Object} data - Conversion data
   * @param {string} data.apiKey - API key that performed the conversion
   * @param {string} data.conversionType - Type of conversion (ltr_to_rtl or rtl_to_ltr)
   * @param {number} data.originalSize - Size of the original CSS in bytes
   * @param {number} data.convertedSize - Size of the converted CSS in bytes
   * @param {number} data.processingTimeMs - Processing time in milliseconds
   */
  recordConversion: async ({ 
    apiKey, 
    conversionType, 
    originalSize, 
    convertedSize, 
    processingTimeMs 
  }) => {
    try {
      // Ensure we have a stats object for this API key
      if (!usageStats.has(apiKey)) {
        usageStats.set(apiKey, {
          totalConversions: 0,
          totalProcessingTimeMs: 0,
          totalOriginalSize: 0,
          totalConvertedSize: 0,
          conversionsByType: {
            ltr_to_rtl: 0,
            rtl_to_ltr: 0,
          },
          lastUsed: null,
          history: [],
        });
      }
      
      const stats = usageStats.get(apiKey);
      
      // Update stats
      stats.totalConversions += 1;
      stats.totalProcessingTimeMs += processingTimeMs;
      stats.totalOriginalSize += originalSize;
      stats.totalConvertedSize += convertedSize;
      stats.conversionsByType[conversionType] += 1;
      stats.lastUsed = new Date();
      
      // Add to history (limit to last 100 conversions)
      stats.history.unshift({
        timestamp: new Date(),
        conversionType,
        originalSize,
        convertedSize,
        processingTimeMs,
      });
      
      if (stats.history.length > 100) {
        stats.history = stats.history.slice(0, 100);
      }
      
      // Update the map
      usageStats.set(apiKey, stats);
      
      logger.debug(`Recorded conversion for API key: ${apiKey}, type: ${conversionType}`);
    } catch (error) {
      // Log error but don't throw - we don't want to fail the main operation
      logger.error('Error recording conversion stats:', error);
    }
  },
  
  /**
   * Get usage statistics for an API key
   * 
   * @param {string} apiKey - API key to get stats for
   * @returns {Object} Usage statistics
   */
  getStats: async (apiKey) => {
    const stats = usageStats.get(apiKey) || {
      totalConversions: 0,
      totalProcessingTimeMs: 0,
      totalOriginalSize: 0,
      totalConvertedSize: 0,
      conversionsByType: {
        ltr_to_rtl: 0,
        rtl_to_ltr: 0,
      },
      lastUsed: null,
      history: [],
    };
    
    return {
      ...stats,
      averageProcessingTimeMs: stats.totalConversions > 0 
        ? Math.round(stats.totalProcessingTimeMs / stats.totalConversions) 
        : 0,
      averageOriginalSize: stats.totalConversions > 0 
        ? Math.round(stats.totalOriginalSize / stats.totalConversions) 
        : 0,
      averageConvertedSize: stats.totalConversions > 0 
        ? Math.round(stats.totalConvertedSize / stats.totalConversions) 
        : 0,
    };
  },
  
  /**
   * Get aggregated usage statistics for all API keys
   * 
   * @returns {Object} Aggregated usage statistics
   */
  getAggregateStats: async () => {
    let totalConversions = 0;
    let totalProcessingTimeMs = 0;
    let totalOriginalSize = 0;
    let totalConvertedSize = 0;
    let ltrToRtlCount = 0;
    let rtlToLtrCount = 0;
    let apiKeyCount = 0;
    let activeApiKeyCount = 0; // Used in the last 24 hours
    
    const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
    
    for (const [key, stats] of usageStats.entries()) {
      apiKeyCount++;
      
      if (stats.lastUsed && stats.lastUsed > twentyFourHoursAgo) {
        activeApiKeyCount++;
      }
      
      totalConversions += stats.totalConversions;
      totalProcessingTimeMs += stats.totalProcessingTimeMs;
      totalOriginalSize += stats.totalOriginalSize;
      totalConvertedSize += stats.totalConvertedSize;
      ltrToRtlCount += stats.conversionsByType.ltr_to_rtl || 0;
      rtlToLtrCount += stats.conversionsByType.rtl_to_ltr || 0;
    }
    
    return {
      totalConversions,
      apiKeyCount,
      activeApiKeyCount,
      conversionsByType: {
        ltr_to_rtl: ltrToRtlCount,
        rtl_to_ltr: rtlToLtrCount,
      },
      averageProcessingTimeMs: totalConversions > 0 
        ? Math.round(totalProcessingTimeMs / totalConversions) 
        : 0,
      averageOriginalSize: totalConversions > 0 
        ? Math.round(totalOriginalSize / totalConversions) 
        : 0,
      averageConvertedSize: totalConversions > 0 
        ? Math.round(totalConvertedSize / totalConversions) 
        : 0,
    };
  }
};