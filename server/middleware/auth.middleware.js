const db = require('../models/db');
const { recordStoreHeartbeat } = require('../services/game/collab.service');
const { gameCache } = require('../services/cache.service');

// Middleware to authenticate store session with in-memory caching (zero DB queries on cached hits)
async function authStore(req, res, next) {
  let token = req.headers['x-session-token'];
  if (!token && req.headers['authorization']) {
    const authHeader = req.headers['authorization'];
    if (authHeader.startsWith('Bearer ')) {
      token = authHeader.substring(7).trim();
    } else {
      token = authHeader.trim();
    }
  }
  if (!token && req.query && req.query.token) {
    token = req.query.token.trim();
  }
  if (!token) {
    return res.status(401).json({ error: 'Chưa đăng nhập tiệm trà sữa!' });
  }

  try {
    let store = gameCache.sessions ? gameCache.sessions.get(token) : null;
    if (!store) {
      store = await db.prepare('SELECT * FROM stores WHERE session_token = ?').get(token);
      if (!store) {
        return res.status(401).json({ error: 'Phiên làm việc không hợp lệ hoặc đã hết hạn!' });
      }
      if (gameCache.sessions) {
        gameCache.sessions.set(token, store, 300000); // 5 minutes TTL
      }
    }

    req.store = store;
    recordStoreHeartbeat(store.id);
    next();
  } catch (err) {
    console.error('authStore error:', err);
    res.status(500).json({ error: 'Lỗi xác thực phiên làm việc' });
  }
}

module.exports = { authStore };
