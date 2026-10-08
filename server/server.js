const express = require('express');
const path = require('path');
const db = require('./models/db');
const anticheat = require('./services/anticheat.service');
const gameService = require('./services/game.service');
const auth = require('./services/auth.service');
const { authStore } = require('./middleware/auth.middleware');
const { 
  rateLimitMiddleware, 
  serverStatusMiddleware,
  adminStatsMiddleware,
  clearRateLimitMiddleware,
  rateLimitService 
} = require('./middleware/rate-limit.middleware');

const {
  monitoringService,
  monitoringMiddleware,
  errorTrackingMiddleware
} = require('./services/monitoring.service');

const resourceGovernor = require('./scripts/resource-governor');
const circuitBreaker = require('./services/circuit-breaker');
const dbWrapper = require('./services/db-wrapper');

// Import routes
const authRoutes = require('./routes/auth.routes');
const storeRoutes = require('./routes/store.routes');
const gameRoutes = require('./routes/game.routes');
const anticheatRoutes = require('./routes/anticheat.routes');
const adminRoutes = require('./routes/admin.routes');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());
app.use(express.static(path.join(__dirname, '..', 'public')));

// Admin Webpage Route
app.get('/admin', (req, res) => {
  res.sendFile(path.join(__dirname, '..', 'public', 'admin.html'));
});

// Apply monitoring middleware (must be before rate limiting)
app.use(monitoringMiddleware);

// Apply circuit breaker middleware for database operations
app.use((req, res, next) => {
  // Add circuit breaker to request context
  req.circuitBreaker = circuitBreaker.getCircuitBreaker();
  next();
});

// Apply rate limiting and server status middleware
app.use(serverStatusMiddleware);
app.use('/api', rateLimitMiddleware());

// Mount routes with rate limiting
app.use('/api/auth', authRoutes);
app.use('/api/store', storeRoutes);
app.use('/api/game', gameRoutes);
app.use('/api/anticheat', anticheatRoutes);
app.use('/api/admin', adminRoutes);

// Admin endpoints for monitoring
app.get('/api/admin/ratelimit-stats', adminStatsMiddleware);
app.post('/api/admin/clear-ratelimit', clearRateLimitMiddleware);

// Monitoring endpoints
app.get('/api/monitoring/health', (req, res) => {
  const health = monitoringService.getHealthStatus();
  res.json(health);
});

app.get('/api/monitoring/performance', (req, res) => {
  // Only allow from localhost or with admin key
  const ip = req.headers['x-forwarded-for']?.split(',')[0]?.trim() || req.connection.remoteAddress;
  const adminKey = req.headers['x-admin-key'];
  
  if (ip !== '127.0.0.1' && ip !== '::1' && adminKey !== process.env.ADMIN_KEY) {
    return res.status(403).json({ error: 'Forbidden' });
  }
  
  const report = monitoringService.getPerformanceReport();
  res.json(report);
});

app.get('/api/monitoring/metrics', (req, res) => {
  // Only allow from localhost or with admin key
  const ip = req.headers['x-forwarded-for']?.split(',')[0]?.trim() || req.connection.remoteAddress;
  const adminKey = req.headers['x-admin-key'];
  
  if (ip !== '127.0.0.1' && ip !== '::1' && adminKey !== process.env.ADMIN_KEY) {
    return res.status(403).json({ error: 'Forbidden' });
  }
  
  const metrics = monitoringService.collectMetrics();
  res.json(metrics);
});

app.get('/api/monitoring/governor', (req, res) => {
  // Only allow from localhost or with admin key
  const ip = req.headers['x-forwarded-for']?.split(',')[0]?.trim() || req.connection.remoteAddress;
  const adminKey = req.headers['x-admin-key'];
  
  if (ip !== '127.0.0.1' && ip !== '::1' && adminKey !== process.env.ADMIN_KEY) {
    return res.status(403).json({ error: 'Forbidden' });
  }
  
  const governorStatus = resourceGovernor.getStatus();
  res.json(governorStatus);
});

// Circuit breaker status endpoint
app.get('/api/monitoring/circuit-breaker', (req, res) => {
  // Only allow from localhost or with admin key
  const ip = req.headers['x-forwarded-for']?.split(',')[0]?.trim() || req.connection.remoteAddress;
  const adminKey = req.headers['x-admin-key'];
  
  if (ip !== '127.0.0.1' && ip !== '::1' && adminKey !== process.env.ADMIN_KEY) {
    return res.status(403).json({ error: 'Forbidden' });
  }
  
  try {
    const breaker = circuitBreaker.getCircuitBreaker();
    const breakerStatus = breaker.getState();
    const poolStats = breaker.getPoolStats();
    
    res.json({
      ...breakerStatus,
      poolStats,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    res.status(500).json({
      error: error.message,
      status: 'Circuit breaker not initialized'
    });
  }
});

// Circuit breaker reset endpoint (admin only)
app.post('/api/monitoring/circuit-breaker/reset', (req, res) => {
  // Only allow from localhost or with admin key
  const ip = req.headers['x-forwarded-for']?.split(',')[0]?.trim() || req.connection.remoteAddress;
  const adminKey = req.headers['x-admin-key'];
  
  if (ip !== '127.0.0.1' && ip !== '::1' && adminKey !== process.env.ADMIN_KEY) {
    return res.status(403).json({ error: 'Forbidden' });
  }
  
  try {
    const breaker = circuitBreaker.getCircuitBreaker();
    breaker.reset();
    
    res.json({
      success: true,
      message: 'Circuit breaker manually reset',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    res.status(500).json({
      error: error.message,
      success: false
    });
  }
});

// Add error tracking middleware (must be after all routes)
app.use(errorTrackingMiddleware);

// Health check with detailed stats (passive by default to prevent waking Neon DB)
app.get('/api/health', async (req, res) => {
  try {
    const dbHealth = await db.healthCheck(req.query.check_db === 'true');
    const cacheStats = await gameService.getCacheStats();
    const rateLimitStats = rateLimitService.getStats();
    
    // Get circuit breaker status
    let circuitBreakerStatus = { initialized: false };
    try {
      const breaker = circuitBreaker.getCircuitBreaker();
      const breakerState = breaker.getState();
      circuitBreakerStatus = {
        initialized: true,
        state: breakerState.state,
        stats: breakerState.stats
      };
    } catch (error) {
      circuitBreakerStatus = { initialized: false, error: error.message };
    }
    
    res.json({ 
      status: 'ok', 
      serverTime: anticheat.getRealDate(), 
      database: dbHealth,
      cache: cacheStats.cache,
      rateLimit: rateLimitStats,
      capacity: rateLimitService.getCapacityPercentage(),
      circuitBreaker: circuitBreakerStatus,
      memory: {
        heapUsed: process.memoryUsage().heapUsed,
        heapTotal: process.memoryUsage().heapTotal,
        rss: process.memoryUsage().rss
      }
    });
  } catch (err) {
    res.status(500).json({
      status: 'error',
      error: err.message
    });
  }
});

// Detailed performance stats (admin only)
app.get('/api/health/detailed', async (req, res) => {
  const ip = req.headers['x-forwarded-for']?.split(',')[0]?.trim() || req.connection.remoteAddress;
  
  // Only allow from localhost or Render health checks
  if (ip !== '127.0.0.1' && ip !== '::1' && !req.headers['user-agent']?.includes('HeeHee-KeepAlive')) {
    return res.status(403).json({ error: 'Forbidden' });
  }
  
  try {
    const dbHealth = await db.healthCheck(req.query.check_db === 'true');
    const cacheStats = await gameService.getCacheStats();
    const rateLimitStats = rateLimitService.getStats();
    const poolStats = db.getPoolStats();
    
    res.json({
      status: 'ok',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      database: dbHealth,
      cache: cacheStats.cache,
      rateLimit: rateLimitStats,
      connectionPool: poolStats,
      resources: {
        memory: process.memoryUsage(),
        cpu: process.cpuUsage(),
        env: {
          NODE_ENV: process.env.NODE_ENV,
          DB_TYPE: db.isPostgres ? 'postgresql' : 'sqlite',
          MAX_CONCURRENT_USERS: process.env.MAX_CONCURRENT_USERS || '300'
        }
      }
    });
  } catch (err) {
    res.status(500).json({
      status: 'error',
      error: err.message,
      stack: process.env.NODE_ENV === 'development' ? err.stack : undefined
    });
  }
});

// Auto-ping mechanism to keep Render free tier alive (pings every 9 minutes)
function setupAutoPing() {
  const pingUrl = process.env.PING_URL || process.env.RENDER_EXTERNAL_URL;
  const intervalMinutes = parseInt(process.env.PING_INTERVAL_MINUTES, 10) || 9;
  const intervalMs = intervalMinutes * 60 * 1000;

  if (pingUrl) {
    const fullUrl = pingUrl.replace(/\/$/, '') + '/api/health';
    console.log(`[Auto-Ping] Enabled! Target: ${fullUrl} every ${intervalMinutes} minutes.`);

    setInterval(async () => {
      try {
        const res = await fetch(fullUrl, {
          headers: { 'User-Agent': 'HeeHee-KeepAlive/1.0' }
        });
        
        if (res.ok) {
          const data = await res.json();
          const capacity = data.capacity || 0;
          const memoryPercent = (data.memory?.heapUsed / data.memory?.heapTotal) * 100 || 0;
          
          console.log(`[Auto-Ping] Pinged ${fullUrl} - Status: ${res.status}, Capacity: ${capacity.toFixed(1)}%, Memory: ${memoryPercent.toFixed(1)}% at ${new Date().toLocaleTimeString('vi-VN')}`);
          
          // Update rate limit service with resource info
          rateLimitService.setResourceUsage({
            memory: memoryPercent,
            connections: data.rateLimit?.concurrentUsers || 0
          });
        } else {
          console.warn(`[Auto-Ping] Ping failed: ${res.status} ${res.statusText}`);
        }
      } catch (err) {
        console.warn(`[Auto-Ping] Failed to ping ${fullUrl}:`, err.message);
      }
    }, intervalMs);
  } else {
    console.log(`[Auto-Ping] Standby: No PING_URL or RENDER_EXTERNAL_URL detected. (Normal for local dev)`);
  }
}

(async () => {
  try {
    await db.init();
    
    // Initialize circuit breaker
    circuitBreaker.initializeCircuitBreaker(db, {
      failureThreshold: 5,
      resetTimeout: 15000,
      halfOpenSuccessThreshold: 3,
      halfOpenFailureThreshold: 1,
      timeout: 8000,
      healthCheckInterval: 30000
    });
    
    // Initialize database wrapper
    dbWrapper.initializeDbWrapper(db);
    
    app.listen(PORT, () => {
      console.log(`===============================================`);
      console.log(`  TIỆM TRÀ SỮA HEEHEE SERVER IS RUNNING!       `);
      console.log(`  URL: http://localhost:${PORT}                `);
      console.log(`  Database Mode: ${db.isPostgres ? 'Neon PostgreSQL' : 'Local SQLite'} `);
      console.log(`  Real Date Enforced: ${anticheat.getRealDate()} `);
      console.log(`  Rate Limiting: Enabled (Max ${rateLimitService.config.maxConcurrentUsers} concurrent users)`);
      console.log(`  Resource Governor: Active (80% threshold rule)`);
      console.log(`  Monitoring: Enabled with health checks`);
      console.log(`  Circuit Breaker: Active for database operations`);
      console.log(`===============================================`);

      setupAutoPing();
    });
  } catch (err) {
    console.error('Failed to initialize database / start server:', err);
    process.exit(1);
  }
})();
