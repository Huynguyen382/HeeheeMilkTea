/**
 * Rate limiting middleware for Express
 */

const rateLimitService = require('../services/rate-limit.service');

// Endpoint-specific configurations
const endpointConfigs = {
  // Public endpoints (more restrictive)
  '/api/auth/login': { userMultiplier: 1.0, ipMultiplier: 1.0 },
  '/api/auth/register': { userMultiplier: 0.5, ipMultiplier: 0.5 }, // Stricter for registration
  '/api/store/login': { userMultiplier: 1.0, ipMultiplier: 1.0 },
  
  // Game endpoints (moderate)
  '/api/game/order': { userMultiplier: 2.0, ipMultiplier: 1.5 }, // More frequent for gameplay
  '/api/game/serve': { userMultiplier: 2.0, ipMultiplier: 1.5 },
  '/api/game/snack-decision': { userMultiplier: 1.0, ipMultiplier: 1.0 },
  
  // Management endpoints (less frequent)
  '/api/game/collab': { userMultiplier: 0.3, ipMultiplier: 0.5 },
  '/api/game/pay-debt': { userMultiplier: 0.2, ipMultiplier: 0.3 },
  '/api/game/upgrade': { userMultiplier: 0.2, ipMultiplier: 0.3 },
  '/api/game/end-shift': { userMultiplier: 0.1, ipMultiplier: 0.2 },
  
  // Read-only endpoints (more lenient)
  '/api/store/state': { userMultiplier: 3.0, ipMultiplier: 2.0 },
  '/api/game/collabs': { userMultiplier: 1.0, ipMultiplier: 1.0 },
  '/api/auth/me': { userMultiplier: 2.0, ipMultiplier: 1.5 }
};

function getClientIP(req) {
  // Try various headers for IP (for proxy support)
  return req.headers['x-forwarded-for']?.split(',')[0]?.trim() ||
         req.headers['x-real-ip'] ||
         req.connection?.remoteAddress ||
         req.socket?.remoteAddress ||
         req.connection?.socket?.remoteAddress ||
         '127.0.0.1';
}

function rateLimitMiddleware(options = {}) {
  return async (req, res, next) => {
    try {
      const ip = getClientIP(req);
      const userId = req.store?.id || null;
      const endpoint = req.originalUrl || req.url;
      
      // Apply endpoint-specific multipliers
      const config = endpointConfigs[endpoint] || { userMultiplier: 1.0, ipMultiplier: 1.0 };
      
      // Clone rate limit service config for this request
      const requestConfig = {
        ...rateLimitService.config,
        ipMaxRequests: Math.floor(rateLimitService.config.ipMaxRequests * config.ipMultiplier),
        userMaxRequests: Math.floor(rateLimitService.config.userMaxRequests * config.userMultiplier)
      };
      
      // Save original config and apply temporary config
      const originalConfig = { ...rateLimitService.config };
      Object.assign(rateLimitService.config, requestConfig);
      
      // Check rate limit
      const limitResult = rateLimitService.check(ip, userId, endpoint);
      
      // Restore original config
      Object.assign(rateLimitService.config, originalConfig);
      
      if (!limitResult.allowed) {
        // Add rate limit headers
        res.setHeader('X-RateLimit-Limit', rateLimitService.config.userMaxRequests);
        res.setHeader('X-RateLimit-Remaining', 0);
        res.setHeader('X-RateLimit-Reset', Math.ceil(Date.now() / 1000) + Math.ceil(limitResult.waitMs / 1000));
        res.setHeader('Retry-After', Math.ceil(limitResult.waitMs / 1000));
        
        // Log rate limit hit (but not too frequently)
        if (Math.random() < 0.1) { // 10% sampling
          console.log(`[RateLimit] ${limitResult.limitType} limit hit for ${userId ? `user ${userId}` : `IP ${ip}`} on ${endpoint}: ${limitResult.reason}`);
        }
        
        return res.status(429).json({
          success: false,
          error: 'Rate limit exceeded',
          message: limitResult.reason,
          retryAfter: Math.ceil(limitResult.waitMs / 1000),
          limitType: limitResult.limitType
        });
      }
      
      // Add rate limit headers for successful requests
      const userKey = userId ? `user:${userId}` : null;
      let remainingRequests = rateLimitService.config.userMaxRequests;
      
      if (userId && rateLimitService.userLimits.has(userKey)) {
        const limitData = rateLimitService.userLimits.get(userKey);
        const now = Date.now();
        const windowStart = now - rateLimitService.config.userLimitWindowMs;
        const recentRequests = limitData.requests.filter(time => time > windowStart);
        remainingRequests = Math.max(0, rateLimitService.config.userMaxRequests - recentRequests.length);
      }
      
      res.setHeader('X-RateLimit-Limit', rateLimitService.config.userMaxRequests);
      res.setHeader('X-RateLimit-Remaining', remainingRequests);
      res.setHeader('X-RateLimit-Reset', Math.ceil(Date.now() / 1000) + 60); // Reset in 1 minute
      
      // Add server load header
      const capacityPercent = rateLimitService.getCapacityPercentage();
      res.setHeader('X-Server-Load', Math.round(capacityPercent));
      
      if (capacityPercent > 80) {
        res.setHeader('X-Server-Warning', 'high-load');
      }
      
      next();
    } catch (err) {
      console.error('[RateLimit Middleware Error]', err);
      // On error, allow the request through (fail open for availability)
      next();
    }
  };
}

// Middleware to add server status to response
function serverStatusMiddleware(req, res, next) {
  // Add server status header
  const capacityPercent = rateLimitService.getCapacityPercentage();
  res.setHeader('X-Server-Capacity', Math.round(capacityPercent));
  res.setHeader('X-Server-Concurrent-Users', rateLimitService.concurrentUsers.size);
  
  // If server is at high capacity, add warning
  if (capacityPercent > 80) {
    res.setHeader('X-Server-Warning', 'high-capacity');
    
    // For non-critical requests, suggest client-side delay
    if (req.method === 'GET' && !req.originalUrl.includes('/api/game/order') && !req.originalUrl.includes('/api/game/serve')) {
      res.setHeader('X-Server-Suggestion', 'delay-non-critical');
    }
  }
  
  next();
}

// Admin endpoint to view rate limit stats
function adminStatsMiddleware(req, res, next) {
  // Only allow from localhost or with admin key
  const adminKey = req.headers['x-admin-key'];
  const ip = getClientIP(req);
  
  if (ip === '127.0.0.1' || ip === '::1' || adminKey === process.env.ADMIN_KEY) {
    // Return rate limit statistics
    return res.json({
      success: true,
      stats: rateLimitService.getStats(),
      timestamp: new Date().toISOString()
    });
  }
  
  next();
}

// Middleware to clear rate limits (admin only)
function clearRateLimitMiddleware(req, res, next) {
  const adminKey = req.headers['x-admin-key'];
  const ip = getClientIP(req);
  
  if (ip === '127.0.0.1' || ip === '::1' || adminKey === process.env.ADMIN_KEY) {
    const { identifier, type } = req.body;
    
    if (identifier && type) {
      const success = rateLimitService.resetLimits(identifier, type);
      return res.json({
        success,
        message: `Rate limits cleared for ${type}: ${identifier}`
      });
    }
  }
  
  next();
}

module.exports = {
  rateLimitMiddleware,
  serverStatusMiddleware,
  adminStatsMiddleware,
  clearRateLimitMiddleware,
  rateLimitService
};