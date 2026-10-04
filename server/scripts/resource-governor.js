/**
 * Resource Governor Script
 * Automatically adjusts server behavior based on resource usage
 * Implements 80% threshold rule for free tier protection
 */

const monitoringService = require('../services/monitoring.service');
const rateLimitService = require('../services/rate-limit.service');
const { gameCache } = require('../services/cache.service');

class ResourceGovernor {
  constructor() {
    this.stats = {
      adjustments: [],
      throttlingActive: false,
      lastAdjustment: Date.now()
    };
    
    // Configuration
    this.config = {
      // Thresholds (80% rule)
      memoryThreshold: 80,
      cpuThreshold: 80,
      connectionThreshold: 80,
      
      // Adjustment intervals
      checkInterval: 15000, // Check every 15 seconds
      cooldownPeriod: 60000, // Wait 1 minute between major adjustments
      
      // Scaling factors
      reductionFactor: 0.7, // Reduce limits by 30% when threshold exceeded
      recoveryFactor: 1.1, // Increase limits by 10% when below threshold
      
      // Minimum limits (to prevent complete denial)
      minConcurrentUsers: 100,
      minRequestRate: 10,
      minCacheEntries: 100
    };
    
    // Start monitoring
    this.monitorInterval = setInterval(() => this.monitorAndAdjust(), this.config.checkInterval);
    
    console.log('[ResourceGovernor] Initialized with 80% threshold rule');
  }

  /**
   * Monitor resources and adjust limits
   */
  async monitorAndAdjust() {
    try {
      const now = Date.now();
      
      // Get current resource usage
      const health = monitoringService.getHealthStatus();
      const metrics = monitoringService.collectMetrics();
      
      if (!metrics || !health) return;
      
      // Calculate capacity percentages
      const capacityMetrics = this.calculateCapacity(metrics, health);
      const overallCapacity = capacityMetrics.overall;
      
      console.log(`[Governor] Capacity: ${overallCapacity.toFixed(1)}% | Memory: ${capacityMetrics.memory.toFixed(1)}% | Users: ${capacityMetrics.users.toFixed(1)}%`);
      
      // Check if we need to adjust based on 80% threshold
      if (overallCapacity > this.config.memoryThreshold) {
        this.handleHighCapacity(capacityMetrics, metrics);
      } else if (overallCapacity < this.config.memoryThreshold * 0.7) {
        // Below 56% capacity (70% of threshold) - we can relax limits
        this.handleLowCapacity(capacityMetrics, metrics);
      }
      
      // Log adjustments periodically
      if (now - this.stats.lastAdjustment > 300000) { // Every 5 minutes
        this.logStats();
        this.stats.lastAdjustment = now;
      }
      
    } catch (err) {
      console.error('[ResourceGovernor] Error:', err.message);
    }
  }

  /**
   * Calculate current capacity percentages
   */
  calculateCapacity(metrics, health) {
    // Memory capacity (0-100%)
    const memoryPercent = metrics.system.memory.heapPercent;
    
    // User capacity (concurrent users vs max)
    const currentUsers = rateLimitService.concurrentUsers.size;
    const maxUsers = rateLimitService.config.maxConcurrentUsers;
    const userPercent = (currentUsers / maxUsers) * 100;
    
    // Response time capacity (inverse - higher response time = higher capacity)
    const avgResponseTime = health.metrics.responseTime || 0;
    const responseTimePercent = Math.min(100, (avgResponseTime / 2000) * 100); // 2s = 100%
    
    // Error rate capacity (inverse - higher errors = higher capacity)
    const errorRate = health.metrics.errorRate || 0;
    const errorPercent = Math.min(100, errorRate * 1000); // 10% error rate = 100%
    
    // Weighted overall capacity (memory is most important for free tier)
    const overall = (
      memoryPercent * 0.4 +      // 40% memory
      userPercent * 0.3 +        // 30% users
      responseTimePercent * 0.2 + // 20% response time
      errorPercent * 0.1          // 10% error rate
    );
    
    return {
      overall,
      memory: memoryPercent,
      users: userPercent,
      responseTime: responseTimePercent,
      errors: errorPercent
    };
  }

  /**
   * Handle high capacity (above 80%)
   */
  handleHighCapacity(capacityMetrics, metrics) {
    const now = Date.now();
    const timeSinceLastAdjustment = now - this.stats.lastAdjustment;
    
    // Don't adjust too frequently
    if (timeSinceLastAdjustment < this.config.cooldownPeriod) {
      return;
    }
    
    console.log(`[Governor] HIGH CAPACITY DETECTED: ${capacityMetrics.overall.toFixed(1)}%`);
    
    // Determine which resource is the bottleneck
    const adjustments = [];
    
    // Memory is high
    if (capacityMetrics.memory > this.config.memoryThreshold) {
      console.log(`[Governor] Memory high: ${capacityMetrics.memory.toFixed(1)}%`);
      
      // Reduce cache size
      const currentCacheEntries = gameCache.storeState.cache.size;
      if (currentCacheEntries > this.config.minCacheEntries * 2) {
        const targetEntries = Math.floor(currentCacheEntries * this.config.reductionFactor);
        this.reduceCache(targetEntries);
        adjustments.push(`Reduced cache from ${currentCacheEntries} to ${targetEntries} entries`);
      }
      
      // Force garbage collection if available
      if (global.gc) {
        global.gc();
        adjustments.push('Forced garbage collection');
      }
    }
    
    // Users are high
    if (capacityMetrics.users > this.config.connectionThreshold) {
      console.log(`[Governor] Users high: ${capacityMetrics.users.toFixed(1)}%`);
      
      // Reduce concurrent user limit
      const currentLimit = rateLimitService.config.maxConcurrentUsers;
      const newLimit = Math.max(
        this.config.minConcurrentUsers,
        Math.floor(currentLimit * this.config.reductionFactor)
      );
      
      if (newLimit < currentLimit) {
        rateLimitService.config.maxConcurrentUsers = newLimit;
        adjustments.push(`Reduced concurrent users from ${currentLimit} to ${newLimit}`);
      }
      
      // Increase rate limiting strictness
      const currentIpLimit = rateLimitService.config.ipMaxRequests;
      const newIpLimit = Math.max(10, Math.floor(currentIpLimit * this.config.reductionFactor));
      rateLimitService.config.ipMaxRequests = newIpLimit;
      
      const currentUserLimit = rateLimitService.config.userMaxRequests;
      const newUserLimit = Math.max(5, Math.floor(currentUserLimit * this.config.reductionFactor));
      rateLimitService.config.userMaxRequests = newUserLimit;
      
      adjustments.push(`Reduced rate limits: IP ${currentIpLimit}→${newIpLimit}, User ${currentUserLimit}→${newUserLimit}`);
    }
    
    // Response time is high
    if (capacityMetrics.responseTime > 50) { // > 1s average response time
      console.log(`[Governor] Response time high: ${capacityMetrics.responseTime.toFixed(1)}%`);
      
      // Enable aggressive throttling
      this.stats.throttlingActive = true;
      adjustments.push('Enabled aggressive throttling');
    }
    
    // Record adjustment
    if (adjustments.length > 0) {
      this.stats.adjustments.push({
        timestamp: now,
        capacity: capacityMetrics.overall,
        adjustments,
        metrics: {
          memory: metrics.system.memory.heapPercent,
          users: rateLimitService.concurrentUsers.size,
          responseTime: capacityMetrics.responseTime
        }
      });
      
      this.stats.lastAdjustment = now;
      console.log(`[Governor] Applied adjustments:`, adjustments);
    }
  }

  /**
   * Handle low capacity (below 56%)
   */
  handleLowCapacity(capacityMetrics, metrics) {
    const now = Date.now();
    const timeSinceLastAdjustment = now - this.stats.lastAdjustment;
    
    // Don't adjust too frequently
    if (timeSinceLastAdjustment < this.config.cooldownPeriod * 0.5) { // Half cooldown for recovery
      return;
    }
    
    // Only recover if we're in throttling mode
    if (!this.stats.throttlingActive) {
      return;
    }
    
    console.log(`[Governor] LOW CAPACITY DETECTED: ${capacityMetrics.overall.toFixed(1)}% - Recovering`);
    
    const adjustments = [];
    
    // Increase concurrent user limit gradually
    const currentLimit = rateLimitService.config.maxConcurrentUsers;
    const defaultLimit = parseInt(process.env.MAX_CONCURRENT_USERS) || 300;
    
    if (currentLimit < defaultLimit) {
      const newLimit = Math.min(
        defaultLimit,
        Math.floor(currentLimit * this.config.recoveryFactor)
      );
      
      rateLimitService.config.maxConcurrentUsers = newLimit;
      adjustments.push(`Increased concurrent users from ${currentLimit} to ${newLimit}`);
    }
    
    // Restore rate limits to default
    const defaultIpLimit = 100;
    const defaultUserLimit = 30;
    
    if (rateLimitService.config.ipMaxRequests < defaultIpLimit) {
      rateLimitService.config.ipMaxRequests = Math.min(
        defaultIpLimit,
        Math.floor(rateLimitService.config.ipMaxRequests * this.config.recoveryFactor)
      );
    }
    
    if (rateLimitService.config.userMaxRequests < defaultUserLimit) {
      rateLimitService.config.userMaxRequests = Math.min(
        defaultUserLimit,
        Math.floor(rateLimitService.config.userMaxRequests * this.config.recoveryFactor)
      );
    }
    
    // Disable throttling if response time is good
    if (capacityMetrics.responseTime < 30) { // < 600ms average response time
      this.stats.throttlingActive = false;
      adjustments.push('Disabled aggressive throttling');
    }
    
    // Record recovery
    if (adjustments.length > 0) {
      this.stats.adjustments.push({
        timestamp: now,
        capacity: capacityMetrics.overall,
        adjustments,
        recovery: true,
        metrics: {
          memory: metrics.system.memory.heapPercent,
          users: rateLimitService.concurrentUsers.size,
          responseTime: capacityMetrics.responseTime
        }
      });
      
      this.stats.lastAdjustment = now;
      console.log(`[Governor] Recovered resources:`, adjustments);
    }
  }

  /**
   * Reduce cache size
   */
  reduceCache(targetSize) {
    const cache = gameCache.storeState;
    const currentSize = cache.cache.size;
    
    if (currentSize <= targetSize) return;
    
    // Convert to array and sort by last accessed time (oldest first)
    const entries = Array.from(cache.cache.entries())
      .map(([key, entry]) => ({ key, lastAccessed: entry.lastAccessed }))
      .sort((a, b) => a.lastAccessed - b.lastAccessed);
    
    // Remove oldest entries
    const toRemove = Math.min(entries.length, currentSize - targetSize);
    for (let i = 0; i < toRemove; i++) {
      cache.cache.delete(entries[i].key);
    }
    
    cache.updateMemoryStats();
    
    console.log(`[Governor] Cache reduced from ${currentSize} to ${cache.cache.size} entries`);
  }

  /**
   * Log statistics
   */
  logStats() {
    console.log('[Governor] Statistics:');
    console.log(`  Adjustments made: ${this.stats.adjustments.length}`);
    console.log(`  Throttling active: ${this.stats.throttlingActive}`);
    
    if (this.stats.adjustments.length > 0) {
      const lastAdjustment = this.stats.adjustments[this.stats.adjustments.length - 1];
      console.log(`  Last adjustment: ${new Date(lastAdjustment.timestamp).toLocaleTimeString()}`);
      console.log(`  Last capacity: ${lastAdjustment.capacity.toFixed(1)}%`);
    }
    
    const currentLimit = rateLimitService.config.maxConcurrentUsers;
    const defaultLimit = parseInt(process.env.MAX_CONCURRENT_USERS) || 300;
    console.log(`  Current user limit: ${currentLimit}/${defaultLimit} (${((currentLimit / defaultLimit) * 100).toFixed(1)}%)`);
    
    const currentUsers = rateLimitService.concurrentUsers.size;
    console.log(`  Active users: ${currentUsers}/${currentLimit} (${((currentUsers / currentLimit) * 100).toFixed(1)}%)`);
  }

  /**
   * Get governor status
   */
  getStatus() {
    return {
      active: true,
      throttling: this.stats.throttlingActive,
      config: this.config,
      stats: {
        totalAdjustments: this.stats.adjustments.length,
        lastAdjustment: this.stats.lastAdjustment,
        recentAdjustments: this.stats.adjustments.slice(-5)
      },
      currentLimits: {
        maxConcurrentUsers: rateLimitService.config.maxConcurrentUsers,
        ipMaxRequests: rateLimitService.config.ipMaxRequests,
        userMaxRequests: rateLimitService.config.userMaxRequests
      }
    };
  }

  /**
   * Destroy governor
   */
  destroy() {
    clearInterval(this.monitorInterval);
  }
}

// Singleton instance
const resourceGovernor = new ResourceGovernor();

// Export for manual control if needed
module.exports = resourceGovernor;