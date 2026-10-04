/**
 * Comprehensive resource monitoring and health checks
 * For free tier scaling and proactive issue detection
 */

const os = require('os');
const db = require('../models/db');
const { gameCache } = require('./cache.service');
const rateLimitService = require('./rate-limit.service');

class MonitoringService {
  constructor() {
    this.metrics = {
      startTime: Date.now(),
      requests: {
        total: 0,
        successful: 0,
        failed: 0,
        byEndpoint: new Map()
      },
      responseTimes: [],
      errors: [],
      alerts: []
    };
    
    // Performance thresholds (free tier optimized)
    this.thresholds = {
      memory: {
        warning: 70, // 70% memory usage
        critical: 85 // 85% memory usage
      },
      cpu: {
        warning: 80, // 80% CPU usage
        critical: 95 // 95% CPU usage
      },
      responseTime: {
        warning: 1000, // 1 second
        critical: 3000 // 3 seconds
      },
      errorRate: {
        warning: 0.05, // 5% error rate
        critical: 0.10 // 10% error rate
      },
      database: {
        queryTimeWarning: 500, // 500ms
        queryTimeCritical: 2000 // 2 seconds
      }
    };
    
    // Historical data for trend analysis
    this.history = {
      memory: [],
      cpu: [],
      responseTimes: [],
      errorRates: [],
      userCounts: []
    };
    
    // Monitoring intervals
    this.collectionInterval = setInterval(() => this.collectMetrics(), 30000); // Every 30s
    this.analysisInterval = setInterval(() => this.analyzeMetrics(), 60000); // Every 60s
    this.cleanupInterval = setInterval(() => this.cleanupOldData(), 300000); // Every 5 minutes
    
    console.log('[Monitoring] Service initialized');
  }

  /**
   * Collect system metrics
   */
  collectMetrics() {
    try {
      const now = Date.now();
      const uptime = process.uptime();
      
      // System metrics
      const memoryUsage = process.memoryUsage();
      const memoryPercent = (memoryUsage.heapUsed / memoryUsage.heapTotal) * 100;
      const cpuUsage = process.cpuUsage();
      
      // Application metrics
      const cacheStats = gameCache.getStats();
      const rateLimitStats = rateLimitService.getStats();
      const dbStats = db.getPoolStats();
      
      const metrics = {
        timestamp: now,
        uptime,
        system: {
          memory: {
            heapUsed: memoryUsage.heapUsed,
            heapTotal: memoryUsage.heapTotal,
            heapPercent: memoryPercent,
            rss: memoryUsage.rss,
            external: memoryUsage.external,
            arrayBuffers: memoryUsage.arrayBuffers
          },
          cpu: {
            user: cpuUsage.user,
            system: cpuUsage.system
          },
          os: {
            loadavg: os.loadavg(),
            freemem: os.freemem(),
            totalmem: os.totalmem(),
            uptime: os.uptime()
          }
        },
        application: {
          cache: cacheStats,
          rateLimit: rateLimitStats,
          database: dbStats,
          requests: { ...this.metrics.requests },
          responseTime: this.calculateAverageResponseTime(),
          errorRate: this.calculateErrorRate()
        }
      };
      
      // Store in history
      this.history.memory.push({ timestamp: now, value: memoryPercent });
      this.history.cpu.push({ timestamp: now, value: (cpuUsage.user + cpuUsage.system) / 1000000 }); // Convert to ms
      this.history.userCounts.push({ timestamp: now, value: rateLimitStats.concurrentUsers });
      
      // Keep history manageable
      this.trimHistory();
      
      // Check thresholds and generate alerts
      this.checkThresholds(metrics);
      
      return metrics;
    } catch (err) {
      console.error('[Monitoring] Error collecting metrics:', err.message);
      return null;
    }
  }

  /**
   * Track request metrics
   */
  trackRequest(endpoint, method, statusCode, responseTime) {
    this.metrics.requests.total++;
    
    if (statusCode >= 200 && statusCode < 400) {
      this.metrics.requests.successful++;
    } else {
      this.metrics.requests.failed++;
    }
    
    // Track by endpoint
    const endpointKey = `${method} ${endpoint}`;
    const endpointStats = this.metrics.requests.byEndpoint.get(endpointKey) || {
      count: 0,
      totalTime: 0,
      errors: 0
    };
    
    endpointStats.count++;
    endpointStats.totalTime += responseTime;
    
    if (statusCode >= 400) {
      endpointStats.errors++;
    }
    
    this.metrics.requests.byEndpoint.set(endpointKey, endpointStats);
    
    // Store response time for percentile calculation
    this.metrics.responseTimes.push({
      timestamp: Date.now(),
      endpoint,
      responseTime
    });
    
    // Keep last 1000 response times
    if (this.metrics.responseTimes.length > 1000) {
      this.metrics.responseTimes = this.metrics.responseTimes.slice(-500);
    }
  }

  /**
   * Track error
   */
  trackError(error, context = {}) {
    const errorEntry = {
      timestamp: Date.now(),
      message: error.message,
      stack: error.stack,
      context
    };
    
    this.metrics.errors.push(errorEntry);
    
    // Keep last 100 errors
    if (this.metrics.errors.length > 100) {
      this.metrics.errors = this.metrics.errors.slice(-50);
    }
    
    // Check error rate threshold
    this.checkErrorRate();
  }

  /**
   * Calculate average response time
   */
  calculateAverageResponseTime() {
    if (this.metrics.responseTimes.length === 0) return 0;
    
    const recentTimes = this.metrics.responseTimes
      .filter(rt => Date.now() - rt.timestamp < 300000) // Last 5 minutes
      .map(rt => rt.responseTime);
    
    if (recentTimes.length === 0) return 0;
    
    const sum = recentTimes.reduce((a, b) => a + b, 0);
    return sum / recentTimes.length;
  }

  /**
   * Calculate error rate
   */
  calculateErrorRate() {
    const total = this.metrics.requests.total;
    if (total === 0) return 0;
    
    return this.metrics.requests.failed / total;
  }

  /**
   * Check thresholds and generate alerts
   */
  checkThresholds(metrics) {
    const alerts = [];
    const now = Date.now();
    
    // Memory threshold
    if (metrics.system.memory.heapPercent > this.thresholds.memory.critical) {
      alerts.push({
        level: 'critical',
        type: 'memory',
        message: `Memory usage critical: ${metrics.system.memory.heapPercent.toFixed(1)}%`,
        value: metrics.system.memory.heapPercent,
        timestamp: now
      });
    } else if (metrics.system.memory.heapPercent > this.thresholds.memory.warning) {
      alerts.push({
        level: 'warning',
        type: 'memory',
        message: `Memory usage high: ${metrics.system.memory.heapPercent.toFixed(1)}%`,
        value: metrics.system.memory.heapPercent,
        timestamp: now
      });
    }
    
    // Response time threshold
    const avgResponseTime = metrics.application.responseTime;
    if (avgResponseTime > this.thresholds.responseTime.critical) {
      alerts.push({
        level: 'critical',
        type: 'response_time',
        message: `Response time critical: ${avgResponseTime.toFixed(0)}ms`,
        value: avgResponseTime,
        timestamp: now
      });
    } else if (avgResponseTime > this.thresholds.responseTime.warning) {
      alerts.push({
        level: 'warning',
        type: 'response_time',
        message: `Response time high: ${avgResponseTime.toFixed(0)}ms`,
        value: avgResponseTime,
        timestamp: now
      });
    }
    
    // Error rate threshold
    const errorRate = metrics.application.errorRate;
    if (errorRate > this.thresholds.errorRate.critical) {
      alerts.push({
        level: 'critical',
        type: 'error_rate',
        message: `Error rate critical: ${(errorRate * 100).toFixed(1)}%`,
        value: errorRate,
        timestamp: now
      });
    } else if (errorRate > this.thresholds.errorRate.warning) {
      alerts.push({
        level: 'warning',
        type: 'error_rate',
        message: `Error rate high: ${(errorRate * 100).toFixed(1)}%`,
        value: errorRate,
        timestamp: now
      });
    }
    
    // Database connection pool threshold
    if (metrics.application.database) {
      const waitingCount = metrics.application.database.waiting || 0;
      if (waitingCount > 5) {
        alerts.push({
          level: 'warning',
          type: 'database',
          message: `Database pool has ${waitingCount} waiting connections`,
          value: waitingCount,
          timestamp: now
        });
      }
    }
    
    // Add alerts to history
    alerts.forEach(alert => {
      this.metrics.alerts.push(alert);
      console.log(`[Monitoring Alert] ${alert.level.toUpperCase()}: ${alert.message}`);
    });
    
    // Keep last 50 alerts
    if (this.metrics.alerts.length > 50) {
      this.metrics.alerts = this.metrics.alerts.slice(-25);
    }
    
    return alerts;
  }

  /**
   * Check error rate specifically
   */
  checkErrorRate() {
    const errorRate = this.calculateErrorRate();
    
    if (errorRate > this.thresholds.errorRate.critical) {
      // Implement circuit breaker pattern
      this.triggerCircuitBreaker('high_error_rate', {
        errorRate,
        threshold: this.thresholds.errorRate.critical
      });
    }
  }

  /**
   * Trigger circuit breaker actions
   */
  triggerCircuitBreaker(reason, data) {
    console.log(`[Circuit Breaker] Triggered due to ${reason}:`, data);
    
    // Implement different actions based on reason
    switch (reason) {
      case 'high_error_rate':
        // Reduce rate limits temporarily
        const currentLimit = rateLimitService.config.maxConcurrentUsers;
        const newLimit = Math.max(100, Math.floor(currentLimit * 0.7)); // Reduce by 30%
        rateLimitService.config.maxConcurrentUsers = newLimit;
        
        console.log(`[Circuit Breaker] Reduced concurrent user limit to ${newLimit}`);
        break;
        
      case 'high_memory':
        // Clear cache to free memory
        gameCache.clearAll();
        console.log('[Circuit Breaker] Cleared all caches');
        break;
    }
  }

  /**
   * Analyze metrics for trends
   */
  analyzeMetrics() {
    try {
      // Check for memory leak trends
      if (this.history.memory.length >= 10) {
        const recentMemory = this.history.memory.slice(-10).map(m => m.value);
        const memoryTrend = this.calculateTrend(recentMemory);
        
        if (memoryTrend > 0.5) { // Increasing trend > 0.5% per interval
          console.log(`[Monitoring] Memory trend increasing: +${memoryTrend.toFixed(2)}% per interval`);
        }
      }
      
      // Check for response time degradation
      if (this.history.responseTimes.length >= 10) {
        const recentTimes = this.history.responseTimes.slice(-10).map(rt => rt.value);
        const timeTrend = this.calculateTrend(recentTimes);
        
        if (timeTrend > 10) { // Increasing trend > 10ms per interval
          console.log(`[Monitoring] Response time trend increasing: +${timeTrend.toFixed(0)}ms per interval`);
        }
      }
      
      // Check user growth rate
      if (this.history.userCounts.length >= 5) {
        const recentUsers = this.history.userCounts.slice(-5).map(uc => uc.value);
        const userGrowth = this.calculateTrend(recentUsers);
        
        if (userGrowth > 20) { // Growing > 20 users per interval
          console.log(`[Monitoring] Rapid user growth: +${userGrowth.toFixed(0)} users per interval`);
          
          // Proactively adjust rate limits
          const currentLimit = rateLimitService.config.maxConcurrentUsers;
          if (userGrowth > 50 && currentLimit < 300) {
            const newLimit = Math.min(300, currentLimit + 50);
            rateLimitService.config.maxConcurrentUsers = newLimit;
            console.log(`[Monitoring] Proactively increased user limit to ${newLimit}`);
          }
        }
      }
    } catch (err) {
      console.error('[Monitoring] Error analyzing metrics:', err.message);
    }
  }

  /**
   * Calculate linear trend
   */
  calculateTrend(data) {
    if (data.length < 2) return 0;
    
    const n = data.length;
    let sumX = 0;
    let sumY = 0;
    let sumXY = 0;
    let sumX2 = 0;
    
    for (let i = 0; i < n; i++) {
      sumX += i;
      sumY += data[i];
      sumXY += i * data[i];
      sumX2 += i * i;
    }
    
    const slope = (n * sumXY - sumX * sumY) / (n * sumX2 - sumX * sumX);
    return slope;
  }

  /**
   * Trim history to keep it manageable
   */
  trimHistory() {
    const maxHistory = 60; // Keep 60 data points (30 minutes at 30s intervals)
    
    Object.keys(this.history).forEach(key => {
      if (this.history[key].length > maxHistory) {
        this.history[key] = this.history[key].slice(-maxHistory);
      }
    });
  }

  /**
   * Cleanup old data
   */
  cleanupOldData() {
    const now = Date.now();
    const fiveMinutesAgo = now - 300000;
    
    // Clean old response times
    this.metrics.responseTimes = this.metrics.responseTimes.filter(
      rt => rt.timestamp > fiveMinutesAgo
    );
    
    // Clean old errors
    this.metrics.errors = this.metrics.errors.filter(
      err => err.timestamp > fiveMinutesAgo
    );
    
    // Clean old alerts (keep last hour)
    const oneHourAgo = now - 3600000;
    this.metrics.alerts = this.metrics.alerts.filter(
      alert => alert.timestamp > oneHourAgo
    );
  }

  /**
   * Get comprehensive health status
   */
  getHealthStatus() {
    const metrics = this.collectMetrics();
    const errorRate = this.calculateErrorRate();
    const avgResponseTime = this.calculateAverageResponseTime();
    
    let status = 'healthy';
    let issues = [];
    
    // Determine overall status
    if (metrics && metrics.system.memory.heapPercent > this.thresholds.memory.critical) {
      status = 'critical';
      issues.push('High memory usage');
    } else if (errorRate > this.thresholds.errorRate.critical) {
      status = 'critical';
      issues.push('High error rate');
    } else if (avgResponseTime > this.thresholds.responseTime.critical) {
      status = 'degraded';
      issues.push('High response time');
    } else if (metrics && metrics.system.memory.heapPercent > this.thresholds.memory.warning) {
      status = 'warning';
      issues.push('Elevated memory usage');
    }
    
    return {
      status,
      issues,
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      metrics: {
        memoryPercent: metrics?.system.memory.heapPercent || 0,
        errorRate,
        responseTime: avgResponseTime,
        concurrentUsers: rateLimitService.concurrentUsers.size
      }
    };
  }

  /**
   * Get performance report
   */
  getPerformanceReport() {
    const metrics = this.collectMetrics();
    
    // Calculate percentiles
    const responseTimes = this.metrics.responseTimes.map(rt => rt.responseTime).sort((a, b) => a - b);
    const percentile = (p) => {
      if (responseTimes.length === 0) return 0;
      const index = Math.floor((p / 100) * responseTimes.length);
      return responseTimes[index];
    };
    
    // Top endpoints by request count
    const topEndpoints = Array.from(this.metrics.requests.byEndpoint.entries())
      .map(([endpoint, stats]) => ({
        endpoint,
        count: stats.count,
        avgTime: stats.totalTime / stats.count,
        errorRate: stats.errors / stats.count
      }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);
    
    return {
      summary: {
        uptime: process.uptime(),
        totalRequests: this.metrics.requests.total,
        successRate: this.metrics.requests.total > 0 
          ? (this.metrics.requests.successful / this.metrics.requests.total) * 100 
          : 100,
        avgResponseTime: this.calculateAverageResponseTime()
      },
      performance: {
        responseTimePercentiles: {
          p50: percentile(50),
          p90: percentile(90),
          p95: percentile(95),
          p99: percentile(99)
        },
        topEndpoints
      },
      resources: metrics?.system || {},
      alerts: this.metrics.alerts.slice(-10) // Last 10 alerts
    };
  }

  /**
   * Reset metrics (for testing)
   */
  resetMetrics() {
    this.metrics = {
      startTime: Date.now(),
      requests: {
        total: 0,
        successful: 0,
        failed: 0,
        byEndpoint: new Map()
      },
      responseTimes: [],
      errors: [],
      alerts: []
    };
  }

  /**
   * Destroy service
   */
  destroy() {
    clearInterval(this.collectionInterval);
    clearInterval(this.analysisInterval);
    clearInterval(this.cleanupInterval);
  }
}

// Singleton instance
const monitoringService = new MonitoringService();

// Middleware to track requests
function monitoringMiddleware(req, res, next) {
  const startTime = Date.now();
  const originalEnd = res.end;
  
  // Override res.end to capture response time
  res.end = function(...args) {
    const responseTime = Date.now() - startTime;
    
    // Track the request
    monitoringService.trackRequest(
      req.originalUrl || req.url,
      req.method,
      res.statusCode,
      responseTime
    );
    
    // Call original end
    originalEnd.apply(this, args);
  };
  
  next();
}

// Error tracking middleware
function errorTrackingMiddleware(err, req, res, next) {
  monitoringService.trackError(err, {
    endpoint: req.originalUrl || req.url,
    method: req.method,
    userId: req.store?.id,
    ip: req.headers['x-forwarded-for']?.split(',')[0]?.trim() || req.connection.remoteAddress
  });
  
  next(err);
}

module.exports = {
  MonitoringService,
  monitoringService,
  monitoringMiddleware,
  errorTrackingMiddleware
};