/**
 * In-memory cache service with TTL and memory limit
 * Designed for free tier scaling
 */

class CacheService {
  constructor() {
    this.cache = new Map();
    this.stats = {
      hits: 0,
      misses: 0,
      evictions: 0,
      memoryUsage: 0
    };
    
    // Memory limits for free tier (adjust based on 512MB total)
    this.maxEntries = process.env.CACHE_MAX_ENTRIES || 1000;
    this.maxMemoryMB = process.env.CACHE_MAX_MEMORY_MB || 50; // 50MB cache max
    
    // Cleanup interval
    this.cleanupInterval = setInterval(() => this.cleanup(), 60000); // Every minute
    
    // Monitor memory usage
    if (global.gc) {
      setInterval(() => this.monitorMemory(), 30000); // Every 30s if gc available
    }
  }

  /**
   * Set cache entry with TTL
   * @param {string} key 
   * @param {any} value 
   * @param {number} ttlMs - Time to live in milliseconds
   * @returns {boolean}
   */
  set(key, value, ttlMs = 10000) { // Default 10 seconds
    if (this.cache.size >= this.maxEntries) {
      this.evictOldest();
    }
    
    const entry = {
      value,
      expiresAt: Date.now() + ttlMs,
      size: this.estimateSize(value),
      lastAccessed: Date.now()
    };
    
    this.cache.set(key, entry);
    this.updateMemoryStats();
    
    return true;
  }

  /**
   * Get cache entry
   * @param {string} key 
   * @returns {any|null}
   */
  get(key) {
    const entry = this.cache.get(key);
    
    if (!entry) {
      this.stats.misses++;
      return null;
    }
    
    // Check if expired
    if (Date.now() > entry.expiresAt) {
      this.cache.delete(key);
      this.stats.misses++;
      this.updateMemoryStats();
      return null;
    }
    
    // Update last accessed time for LRU
    entry.lastAccessed = Date.now();
    this.stats.hits++;
    
    return entry.value;
  }

  /**
   * Delete cache entry
   * @param {string} key 
   * @returns {boolean}
   */
  delete(key) {
    const existed = this.cache.delete(key);
    if (existed) {
      this.updateMemoryStats();
    }
    return existed;
  }

  /**
   * Check if key exists and is not expired
   * @param {string} key 
   * @returns {boolean}
   */
  has(key) {
    const entry = this.cache.get(key);
    if (!entry) return false;
    
    if (Date.now() > entry.expiresAt) {
      this.cache.delete(key);
      this.updateMemoryStats();
      return false;
    }
    
    return true;
  }

  /**
   * Clear all cache
   */
  clear() {
    this.cache.clear();
    this.stats.evictions += this.cache.size;
    this.updateMemoryStats();
  }

  /**
   * Get cache statistics
   * @returns {object}
   */
  getStats() {
    return {
      ...this.stats,
      size: this.cache.size,
      hitRate: this.stats.hits + this.stats.misses > 0 
        ? (this.stats.hits / (this.stats.hits + this.stats.misses)) * 100 
        : 0,
      memoryUsageMB: this.stats.memoryUsage / (1024 * 1024)
    };
  }

  /**
   * Estimate size of value in bytes
   * @param {any} value 
   * @returns {number}
   */
  estimateSize(value) {
    try {
      const str = typeof value === 'string' ? value : JSON.stringify(value);
      return Buffer.byteLength(str, 'utf8');
    } catch (err) {
      return 1024; // Default 1KB estimate
    }
  }

  /**
   * Update memory usage statistics
   */
  updateMemoryStats() {
    let totalSize = 0;
    for (const entry of this.cache.values()) {
      totalSize += entry.size;
    }
    this.stats.memoryUsage = totalSize;
  }

  /**
   * Evict oldest entries when at capacity
   */
  evictOldest() {
    if (this.cache.size === 0) return;
    
    // Find oldest accessed entry
    let oldestKey = null;
    let oldestTime = Date.now();
    
    for (const [key, entry] of this.cache) {
      if (entry.lastAccessed < oldestTime) {
        oldestTime = entry.lastAccessed;
        oldestKey = key;
      }
    }
    
    if (oldestKey) {
      this.cache.delete(oldestKey);
      this.stats.evictions++;
    }
  }

  /**
   * Cleanup expired entries
   */
  cleanup() {
    const now = Date.now();
    let expiredCount = 0;
    
    for (const [key, entry] of this.cache) {
      if (now > entry.expiresAt) {
        this.cache.delete(key);
        expiredCount++;
      }
    }
    
    this.stats.evictions += expiredCount;
    this.updateMemoryStats();
    
    if (expiredCount > 0) {
      console.log(`[Cache] Cleaned up ${expiredCount} expired entries`);
    }
  }

  /**
   * Monitor memory usage and evict if needed
   */
  monitorMemory() {
    const containerMaxBytes = (parseInt(process.env.MAX_MEMORY_MB) || 512) * 1024 * 1024;
    const rss = process.memoryUsage().rss;
    const usagePercent = (rss / containerMaxBytes) * 100;
    
    // If real memory usage is high (>85% of container), clear some cache
    if (usagePercent > 85) {
      const targetClear = Math.floor(this.cache.size * 0.3); // Clear 30%
      console.log(`[Cache] High memory usage (${usagePercent.toFixed(1)}%), clearing ${targetClear} entries`);
      
      // Clear oldest entries
      const entries = Array.from(this.cache.entries())
        .sort((a, b) => a[1].lastAccessed - b[1].lastAccessed);
      
      for (let i = 0; i < Math.min(targetClear, entries.length); i++) {
        this.cache.delete(entries[i][0]);
      }
      
      this.updateMemoryStats();
      
      // Force garbage collection if available
      if (global.gc) {
        global.gc();
      }
    }
  }

  /**
   * Get all cache keys (for debugging)
   * @returns {string[]}
   */
  keys() {
    return Array.from(this.cache.keys());
  }

  /**
   * Destroy cache instance
   */
  destroy() {
    clearInterval(this.cleanupInterval);
    this.cache.clear();
  }
}

// Game-specific cache helpers
const gameCache = {
  // Store state cache (high hit rate)
  storeState: new CacheService(),
  
  // Order generation cache (medium TTL)
  orderGeneration: new CacheService(),
  
  // Static data cache (long TTL)
  staticData: new CacheService(),
  
  // Get combined stats
  getStats() {
    return {
      storeState: this.storeState.getStats(),
      orderGeneration: this.orderGeneration.getStats(),
      staticData: this.staticData.getStats()
    };
  },
  
  // Clear all caches
  clearAll() {
    this.storeState.clear();
    this.orderGeneration.clear();
    this.staticData.clear();
  }
};

module.exports = {
  CacheService,
  gameCache
};