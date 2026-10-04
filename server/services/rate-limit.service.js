/**
 * Rate limiting and concurrent user management
 * Designed to protect free tier from overload
 */

class RateLimitService {
  constructor() {
    // Store rate limit data
    this.ipLimits = new Map();
    this.userLimits = new Map();
    this.concurrentUsers = new Set();
    
    // Configuration
    this.config = {
      // IP-based rate limiting
      ipLimitWindowMs: 60000, // 1 minute window
      ipMaxRequests: 100, // 100 requests per minute per IP
      
      // User-based rate limiting (stricter)
      userLimitWindowMs: 60000, // 1 minute window  
      userMaxRequests: 30, // 30 requests per minute per user
      
      // Concurrent user limits (free tier protection)
      maxConcurrentUsers: process.env.MAX_CONCURRENT_USERS || 300,
      userTimeoutMs: 300000, // 5 minutes timeout for inactive users
      
      // Global rate limiting
      globalRPS: process.env.GLOBAL_RPS || 50, // Requests per second globally
      globalBurst: process.env.GLOBAL_BURST || 100 // Burst capacity
    };
    
    // Global request tracking for overall RPS limiting
    this.globalRequests = [];
    this.globalRequestCount = 0;
    
    // Resource usage tracking
    this.resourceUsage = {
      memory: 0,
      cpu: 0,
      connections: 0
    };
    
    // Cleanup intervals
    this.cleanupInterval = setInterval(() => this.cleanup(), 30000); // Every 30s
    this.monitorInterval = setInterval(() => this.monitorResources(), 10000); // Every 10s
    
    console.log(`[RateLimit] Initialized with max ${this.config.maxConcurrentUsers} concurrent users`);
  }

  /**
   * Check if a request is allowed
   * @param {string} ip - Client IP address
   * @param {string} userId - User ID (if authenticated)
   * @param {string} endpoint - API endpoint
   * @returns {object} - { allowed: boolean, reason: string, waitMs: number }
   */
  check(ip, userId = null, endpoint = '') {
    const now = Date.now();
    
    // 1. Check global rate limit first
    if (!this.checkGlobalRateLimit(now)) {
      return {
        allowed: false,
        reason: 'Global rate limit exceeded. Server is at capacity.',
        waitMs: 1000,
        limitType: 'global'
      };
    }
    
    // 2. Check concurrent user limit (if new user)
    if (userId && !this.concurrentUsers.has(userId)) {
      if (this.concurrentUsers.size >= this.config.maxConcurrentUsers) {
        // Check if we can evict inactive users
        this.cleanupInactiveUsers(now);
        
        if (this.concurrentUsers.size >= this.config.maxConcurrentUsers) {
          return {
            allowed: false,
            reason: 'Server at maximum capacity. Please try again later.',
            waitMs: 5000,
            limitType: 'concurrent'
          };
        }
      }
    }
    
    // 3. Check IP-based rate limit
    const ipLimit = this.checkIPLimit(ip, now, endpoint);
    if (!ipLimit.allowed) {
      return ipLimit;
    }
    
    // 4. Check user-based rate limit (if authenticated)
    if (userId) {
      const userLimit = this.checkUserLimit(userId, now, endpoint);
      if (!userLimit.allowed) {
        return userLimit;
      }
      
      // Track active user
      this.trackUserActivity(userId, now);
    }
    
    // 5. Check resource-based throttling
    const resourceLimit = this.checkResourceLimits();
    if (!resourceLimit.allowed) {
      return resourceLimit;
    }
    
    // Request allowed
    this.trackGlobalRequest(now);
    
    return {
      allowed: true,
      reason: '',
      waitMs: 0,
      limitType: 'none'
    };
  }

  /**
   * Check global rate limit
   */
  checkGlobalRateLimit(now) {
    // Clean old requests
    const windowStart = now - 1000; // 1 second window
    this.globalRequests = this.globalRequests.filter(time => time > windowStart);
    
    // Check RPS limit
    if (this.globalRequests.length >= this.config.globalRPS) {
      // Check burst allowance
      if (this.globalRequests.length >= this.config.globalBurst) {
        return false;
      }
      
      // Apply gradual backoff for burst
      const oldestRequest = Math.min(...this.globalRequests);
      const timeSinceOldest = now - oldestRequest;
      
      if (timeSinceOldest < 500) { // Too many requests in 500ms
        return false;
      }
    }
    
    return true;
  }

  /**
   * Check IP-based rate limit
   */
  checkIPLimit(ip, now, endpoint) {
    const key = `ip:${ip}`;
    let limitData = this.ipLimits.get(key);
    
    if (!limitData) {
      limitData = {
        requests: [],
        endpointCounts: new Map(),
        firstSeen: now,
        lastSeen: now
      };
      this.ipLimits.set(key, limitData);
    }
    
    // Clean old requests (within window)
    const windowStart = now - this.config.ipLimitWindowMs;
    limitData.requests = limitData.requests.filter(time => time > windowStart);
    
    // Update endpoint count
    const endpointCount = limitData.endpointCounts.get(endpoint) || 0;
    limitData.endpointCounts.set(endpoint, endpointCount + 1);
    
    limitData.lastSeen = now;
    
    // Check limit
    if (limitData.requests.length >= this.config.ipMaxRequests) {
      const oldestRequest = Math.min(...limitData.requests);
      const waitTime = windowStart + this.config.ipLimitWindowMs - now;
      
      return {
        allowed: false,
        reason: `Too many requests from your IP. Please slow down.`,
        waitMs: Math.max(1000, waitTime),
        limitType: 'ip'
      };
    }
    
    // Add current request
    limitData.requests.push(now);
    
    return { allowed: true };
  }

  /**
   * Check user-based rate limit
   */
  checkUserLimit(userId, now, endpoint) {
    const key = `user:${userId}`;
    let limitData = this.userLimits.get(key);
    
    if (!limitData) {
      limitData = {
        requests: [],
        endpointCounts: new Map(),
        firstSeen: now,
        lastSeen: now,
        penaltyLevel: 0 // 0 = normal, 1-3 = increasing penalties
      };
      this.userLimits.set(key, limitData);
    }
    
    // Apply penalty multiplier if user has been penalized
    const penaltyMultiplier = 1 + (limitData.penaltyLevel * 0.5); // 1x, 1.5x, 2x, 2.5x slower
    const effectiveMaxRequests = Math.floor(this.config.userMaxRequests / penaltyMultiplier);
    
    // Clean old requests
    const windowStart = now - this.config.userLimitWindowMs;
    limitData.requests = limitData.requests.filter(time => time > windowStart);
    
    // Update endpoint count
    const endpointCount = limitData.endpointCounts.get(endpoint) || 0;
    limitData.endpointCounts.set(endpoint, endpointCount + 1);
    
    limitData.lastSeen = now;
    
    // Check limit with penalty
    if (limitData.requests.length >= effectiveMaxRequests) {
      // Increase penalty level
      limitData.penaltyLevel = Math.min(3, limitData.penaltyLevel + 1);
      
      const oldestRequest = Math.min(...limitData.requests);
      const waitTime = windowStart + this.config.userLimitWindowMs - now;
      const penaltyWait = waitTime * penaltyMultiplier;
      
      return {
        allowed: false,
        reason: `Rate limit exceeded. Please slow down${limitData.penaltyLevel > 0 ? ` (penalty level ${limitData.penaltyLevel})` : ''}.`,
        waitMs: Math.max(2000, penaltyWait),
        limitType: 'user'
      };
    }
    
    // Reduce penalty level gradually (if user is behaving)
    if (limitData.penaltyLevel > 0 && limitData.requests.length < effectiveMaxRequests * 0.5) {
      // User is below 50% of limit, reduce penalty
      limitData.penaltyLevel = Math.max(0, limitData.penaltyLevel - 0.1);
    }
    
    // Add current request
    limitData.requests.push(now);
    
    return { allowed: true };
  }

  /**
   * Check resource-based limits
   */
  checkResourceLimits() {
    // Check memory usage
    const memoryUsage = process.memoryUsage();
    const memoryPercent = (memoryUsage.heapUsed / memoryUsage.heapTotal) * 100;
    
    if (memoryPercent > 80) {
      // High memory usage - throttle requests
      const throttlePercent = Math.min(90, (memoryPercent - 80) * 5); // 0-50% throttle
      if (Math.random() * 100 < throttlePercent) {
        return {
          allowed: false,
          reason: 'Server resources are high. Please try again in a moment.',
          waitMs: 1000 + (throttlePercent * 10),
          limitType: 'resource'
        };
      }
    }
    
    // Check concurrent connections (estimated)
    const connectionEstimate = this.concurrentUsers.size * 2; // Estimate 2 connections per user
    if (connectionEstimate > 100) { // Arbitrary limit for free tier
      const overloadPercent = Math.min(90, ((connectionEstimate - 100) / 100) * 100);
      if (Math.random() * 100 < overloadPercent) {
        return {
          allowed: false,
          reason: 'Server is experiencing high load.',
          waitMs: 2000,
          limitType: 'connection'
        };
      }
    }
    
    return { allowed: true };
  }

  /**
   * Track user activity
   */
  trackUserActivity(userId, now) {
    this.concurrentUsers.add(userId);
    
    // Update user last seen time
    const userKey = `user:${userId}`;
    const limitData = this.userLimits.get(userKey);
    if (limitData) {
      limitData.lastSeen = now;
    }
  }

  /**
   * Track global request
   */
  trackGlobalRequest(now) {
    this.globalRequests.push(now);
    this.globalRequestCount++;
    
    // Keep array manageable
    if (this.globalRequests.length > 1000) {
      this.globalRequests = this.globalRequests.slice(-500);
    }
  }

  /**
   * Cleanup inactive users and old limit data
   */
  cleanup() {
    const now = Date.now();
    const inactiveThreshold = now - this.config.userTimeoutMs;
    
    // Clean inactive users from concurrent set
    for (const userId of this.concurrentUsers) {
      const userKey = `user:${userId}`;
      const limitData = this.userLimits.get(userKey);
      
      if (!limitData || limitData.lastSeen < inactiveThreshold) {
        this.concurrentUsers.delete(userId);
      }
    }
    
    // Clean old IP limit data
    for (const [key, data] of this.ipLimits.entries()) {
      if (data.lastSeen < now - 3600000) { // 1 hour
        this.ipLimits.delete(key);
      }
    }
    
    // Clean old user limit data
    for (const [key, data] of this.userLimits.entries()) {
      if (data.lastSeen < now - 3600000) { // 1 hour
        this.userLimits.delete(key);
      }
    }
    
    // Log cleanup stats periodically
    if (Math.random() < 0.01) { // 1% chance
      console.log(`[RateLimit] Cleanup: ${this.concurrentUsers.size} concurrent users, ${this.ipLimits.size} IPs tracked`);
    }
  }

  /**
   * Cleanup inactive users specifically for making room
   */
  cleanupInactiveUsers(now) {
    const inactiveThreshold = now - 120000; // 2 minutes inactive
    
    let cleaned = 0;
    for (const userId of this.concurrentUsers) {
      const userKey = `user:${userId}`;
      const limitData = this.userLimits.get(userKey);
      
      if (!limitData || limitData.lastSeen < inactiveThreshold) {
        this.concurrentUsers.delete(userId);
        cleaned++;
        
        if (cleaned >= 10) break; // Clean max 10 at a time
      }
    }
    
    if (cleaned > 0) {
      console.log(`[RateLimit] Cleared ${cleaned} inactive users to make room`);
    }
  }

  /**
   * Monitor resource usage
   */
  monitorResources() {
    const memoryUsage = process.memoryUsage();
    this.resourceUsage = {
      memory: (memoryUsage.heapUsed / memoryUsage.heapTotal) * 100,
      cpu: 0, // Would need external monitoring
      connections: this.concurrentUsers.size
    };
    
    // Auto-adjust limits based on resource usage
    if (this.resourceUsage.memory > 70) {
      // Reduce concurrent user limit when memory is high
      const reduction = Math.floor((this.resourceUsage.memory - 70) / 10 * this.config.maxConcurrentUsers * 0.1);
      this.config.maxConcurrentUsers = Math.max(100, this.config.maxConcurrentUsers - reduction);
    } else if (this.resourceUsage.memory < 50 && this.config.maxConcurrentUsers < 300) {
      // Increase limit when memory is low
      this.config.maxConcurrentUsers = Math.min(300, this.config.maxConcurrentUsers + 10);
    }
  }

  /**
   * Get current statistics
   */
  getStats() {
    return {
      concurrentUsers: this.concurrentUsers.size,
      maxConcurrentUsers: this.config.maxConcurrentUsers,
      ipLimits: this.ipLimits.size,
      userLimits: this.userLimits.size,
      globalRequestsLastMinute: this.globalRequests.length,
      resourceUsage: this.resourceUsage,
      config: {
        ...this.config,
        userTimeoutMs: undefined // Don't expose timeout
      }
    };
  }

  /**
   * Reset rate limits for a specific user/IP (for testing or manual override)
   */
  resetLimits(identifier, type = 'user') {
    const key = type === 'user' ? `user:${identifier}` : `ip:${identifier}`;
    
    if (type === 'user') {
      this.userLimits.delete(key);
      this.concurrentUsers.delete(identifier);
    } else {
      this.ipLimits.delete(key);
    }
    
    return true;
  }

  /**
   * Set resource usage (for external monitoring)
   */
  setResourceUsage(usage) {
    this.resourceUsage = { ...this.resourceUsage, ...usage };
  }

  /**
   * Check if server is at capacity (for load balancing decisions)
   */
  isAtCapacity() {
    const memoryPercent = this.resourceUsage.memory || 0;
    const atUserLimit = this.concurrentUsers.size >= this.config.maxConcurrentUsers * 0.8; // 80% capacity
    const highMemory = memoryPercent > 75;
    
    return atUserLimit || highMemory;
  }

  /**
   * Get capacity percentage (0-100)
   */
  getCapacityPercentage() {
    const userPercent = (this.concurrentUsers.size / this.config.maxConcurrentUsers) * 100;
    const memoryPercent = this.resourceUsage.memory || 0;
    
    // Weighted average: 70% users, 30% memory
    return (userPercent * 0.7) + (memoryPercent * 0.3);
  }

  /**
   * Destroy service
   */
  destroy() {
    clearInterval(this.cleanupInterval);
    clearInterval(this.monitorInterval);
    this.concurrentUsers.clear();
    this.ipLimits.clear();
    this.userLimits.clear();
  }
}

// Singleton instance
const rateLimitService = new RateLimitService();

module.exports = rateLimitService;