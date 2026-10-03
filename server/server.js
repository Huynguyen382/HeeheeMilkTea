const express = require('express');
const path = require('path');
const db = require('./models/db');
const anticheat = require('./services/anticheat.service');
const gameService = require('./services/game.service');
const auth = require('./services/auth.service');
const { authStore } = require('./middleware/auth.middleware');

// Import routes
const authRoutes = require('./routes/auth.routes');
const storeRoutes = require('./routes/store.routes');
const gameRoutes = require('./routes/game.routes');
const anticheatRoutes = require('./routes/anticheat.routes');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());
app.use(express.static(path.join(__dirname, '..', 'public')));

// Mount routes
app.use('/api/auth', authRoutes);
app.use('/api/store', storeRoutes);
app.use('/api/game', gameRoutes);
app.use('/api/anticheat', anticheatRoutes);

// Health check
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'ok', 
    serverTime: anticheat.getRealDate(), 
    database: db.isPostgres ? 'postgresql' : 'sqlite' 
  });
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
        console.log(`[Auto-Ping] Pinged ${fullUrl} - Status: ${res.status} at ${new Date().toLocaleTimeString('vi-VN')}`);
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
    app.listen(PORT, () => {
      console.log(`===============================================`);
      console.log(`  TIỆM TRÀ SỮA HEEHEE SERVER IS RUNNING!       `);
      console.log(`  URL: http://localhost:${PORT}                `);
      console.log(`  Database Mode: ${db.isPostgres ? 'Neon PostgreSQL' : 'Local SQLite'} `);
      console.log(`  Real Date Enforced: ${anticheat.getRealDate()} `);
      console.log(`===============================================`);

      setupAutoPing();
    });
  } catch (err) {
    console.error('Failed to initialize database / start server:', err);
    process.exit(1);
  }
})();
