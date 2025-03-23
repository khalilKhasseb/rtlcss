const crypto = require('crypto');
const config = require('config');
const { v4: uuidv4 } = require('uuid');

/**
 * Utility functions for cryptographic operations
 */
module.exports = {
  /**
   * Generate a new API key and secret pair
   * @returns {Object} Object containing apiKey and apiSecret
   */
  generateApiCredentials: () => {
    return {
      apiKey: uuidv4(),
      apiSecret: crypto.randomBytes(32).toString('hex'),
    };
  },

  /**
   * Create an HMAC signature for a given payload
   * @param {string} payload - The data to sign
   * @param {string} secret - The secret key to use for signing
   * @returns {string} The HMAC signature
   */
  createSignature: (payload, secret) => {
    return crypto
      .createHmac('sha256', secret)
      .update(payload)
      .digest('hex');
  },

  /**
   * Verify the HMAC signature of a payload
   * @param {string} payload - The data that was signed
   * @param {string} signature - The signature to verify
   * @param {string} secret - The secret key used for signing
   * @returns {boolean} True if the signature is valid
   */
  verifySignature: (payload, signature, secret) => {
    const expectedSignature = crypto
      .createHmac('sha256', secret)
      .update(payload)
      .digest('hex');
      console.log('Expected Signature:', expectedSignature);
      console.log('Received Signature:', signature);
    return crypto.timingSafeEqual(
      Buffer.from(signature),
      Buffer.from(expectedSignature)
    );
  },
  
  /**
   * Check if a timestamp is within the acceptable time window
   * @param {number} timestamp - The timestamp to check (in milliseconds)
   * @returns {boolean} True if the timestamp is valid
   */
  isTimestampValid: (timestamp) => {
    const now = Date.now();
    const maxAgeSeconds = config.get('auth.requestTimeout');
    const maxAgeMs = maxAgeSeconds * 1000;
    
    return Math.abs(now - timestamp) < maxAgeMs;
  }
};