const crypto = require('crypto');
const logger = require('../utils/logger');

/**
 * Simple in-memory caching service
 * In production, this would typically be replaced with Redis or a similar caching system
 */
class CacheService {
  constructor() {
    // Initialize cache storage
    this.cache = new Map();
    this.stats = {
      hits: 0,
      misses: 0,
      stored: 0,
      evicted: 0
    };
    
    // Set max cache size (items)
    this.maxSize = 1000;
    
    // Default TTL (time to live) in milliseconds (1 hour)
    this.defaultTtl = 60 * 60 * 1000;
    
    // Start garbage collection interval (runs every 5 minutes)
    this.gcInterval = setInterval(() => this.runGarbageCollection(), 5 * 60 * 1000);
    
    logger.info('Cache service initialized');
  }

  /**
   * Generate a cache key from data
   * 
   * @param {string} prefix Key prefix for namespace
   * @param {*} data Data to hash for the key
   * @returns {string} Generated cache key
   */
  generateKey(prefix, data) {
    // For simple strings, use them directly with prefix
    if (typeof data === 'string') {
      return `${prefix}:${data}`;
    }
    
    // For objects, create a hash of the stringified data
    const hash = crypto
      .createHash('md5')
      .update(JSON.stringify(data))
      .digest('hex');
    
    return `${prefix}:${hash}`;
  }

  /**
   * Store an item in the cache
   * 
   * @param {string} key Cache key
   * @param {*} value Value to store
   * @param {number} ttl TTL in milliseconds (optional, defaults to 1 hour)
   */
  set(key, value, ttl = this.defaultTtl) {
    // Check if we need to evict items before adding
    if (this.cache.size >= this.maxSize) {
      this.evictOldest();
    }
    
    const expiresAt = Date.now() + ttl;
    
    this.cache.set(key, {
      value,
      expiresAt
    });
    
    this.stats.stored++;
    
    logger.debug(`Cache item stored: ${key}`);
  }

  /**
   * Retrieve an item from the cache
   * 
   * @param {string} key Cache key
   * @returns {*} Cached value or null if not found or expired
   */
  get(key) {
    // Check if key exists
    if (!this.cache.has(key)) {
      this.stats.misses++;
      return null;
    }
    
    const item = this.cache.get(key);
    
    // Check if item has expired
    if (item.expiresAt < Date.now()) {
      // Remove expired item
      this.cache.delete(key);
      this.stats.misses++;
      this.stats.evicted++;
      return null;
    }
    
    this.stats.hits++;
    logger.debug(`Cache hit: ${key}`);
    
    return item.value;
  }

  /**
   * Remove an item from the cache
   * 
   * @param {string} key Cache key
   * @returns {boolean} True if item was removed, false if it didn't exist
   */
  delete(key) {
    const result = this.cache.delete(key);
    if (result) {
      logger.debug(`Cache item deleted: ${key}`);
    }
    return result;
  }

  /**
   * Clear all items from the cache
   */
  clear() {
    const size = this.cache.size;
    this.cache.clear();
    logger.info(`Cache cleared, ${size} items removed`);
  }

  /**
   * Get cache statistics
   * 
   * @returns {Object} Cache statistics
   */
  getStats() {
    return {
      ...this.stats,
      size: this.cache.size,
      hitRate: this.stats.hits + this.stats.misses > 0 
        ? (this.stats.hits / (this.stats.hits + this.stats.misses)) * 100 
        : 0
    };
  }

  /**
   * Run garbage collection to remove expired items
   */
  runGarbageCollection() {
    const now = Date.now();
    let removedCount = 0;
    
    for (const [key, item] of this.cache.entries()) {
      if (item.expiresAt < now) {
        this.cache.delete(key);
        removedCount++;
        this.stats.evicted++;
      }
    }
    
    if (removedCount > 0) {
      logger.debug(`Garbage collection removed ${removedCount} expired items`);
    }
  }

  /**
   * Evict the oldest item from the cache
   */
  evictOldest() {
    // Find the item with the earliest expiration time
    let oldestKey = null;
    let oldestExpiry = Infinity;
    
    for (const [key, item] of this.cache.entries()) {
      if (item.expiresAt < oldestExpiry) {
        oldestExpiry = item.expiresAt;
        oldestKey = key;
      }
    }
    
    if (oldestKey) {
      this.cache.delete(oldestKey);
      this.stats.evicted++;
      logger.debug(`Cache eviction: ${oldestKey}`);
    }
  }

  /**
   * Cleanup resources when shutting down
   */
  shutdown() {
    if (this.gcInterval) {
      clearInterval(this.gcInterval);
    }
    logger.info('Cache service shutdown');
  }
}

// Export singleton instance
module.exports = new CacheService();