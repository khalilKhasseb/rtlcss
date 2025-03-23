const { generateApiCredentials } = require('../utils/crypto');
const logger = require('../utils/logger');

/**
 * In-memory storage for API credentials
 * In a production environment, this would be replaced with a database
 */
const apiCredentials = new Map();

/**
 * Authentication service
 */
module.exports = {
  /**
   * Create a new API key and secret
   * @returns {Object} Object containing apiKey and apiSecret
   */
  createApiCredentials: () => {
    const credentials = generateApiCredentials();
    
    // Store credentials (in a real app, this would be in a database)
    apiCredentials.set(credentials.apiKey, {
      secret: credentials.apiSecret,
      createdAt: new Date(),
      lastUsed: null,
      enabled: true,
    });
    
    logger.info(`Created new API credentials with key: ${credentials.apiKey}`);
    
    return credentials;
  },
  
  /**
   * Get API secret for a given key
   * @param {string} apiKey - The API key to look up
   * @returns {string|null} The API secret or null if not found/disabled
   */
  getApiSecret: async (apiKey) => {
    // In a real app, this would be a database lookup
    const credentials = apiCredentials.get(apiKey);
    
    if (!credentials || !credentials.enabled) {
      return null;
    }
    
    // Update last used timestamp
    credentials.lastUsed = new Date();
    apiCredentials.set(apiKey, credentials);
    
    return credentials.secret;
  },
  
  /**
   * Verify if an API key exists and is enabled
   * @param {string} apiKey - The API key to verify
   * @returns {boolean} True if the API key is valid
   */
  verifyApiKey: async (apiKey) => {
    // In a real app, this would be a database lookup
    const credentials = apiCredentials.get(apiKey);
    return credentials && credentials.enabled;
  },
  
  /**
   * Disable an API key
   * @param {string} apiKey - The API key to disable
   * @returns {boolean} True if the API key was found and disabled
   */
  disableApiKey: async (apiKey) => {
    // In a real app, this would be a database update
    const credentials = apiCredentials.get(apiKey);
    
    if (!credentials) {
      return false;
    }
    
    credentials.enabled = false;
    apiCredentials.set(apiKey, credentials);
    
    logger.info(`Disabled API key: ${apiKey}`);
    
    return true;
  },
  
  /**
   * Get all API keys (for admin purposes)
   * @returns {Array} Array of API key information objects
   */
  getAllApiKeys: async () => {
    // In a real app, this would be a database query
    const keys = [];
    
    for (const [key, data] of apiCredentials.entries()) {
      keys.push({
        apiKey: key,
        createdAt: data.createdAt,
        lastUsed: data.lastUsed,
        enabled: data.enabled,
      });
    }
    
    return keys;
  }
};