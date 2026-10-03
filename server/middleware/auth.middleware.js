const db = require('../models/db');

// Middleware to authenticate store session
async function authStore(req, res, next) {
  const token = req.headers['x-session-token'];
  if (!token) {
    return res.status(401).json({ error: 'Chưa đăng nhập tiệm trà sữa!' });
  }

  try {
    const store = await db.prepare('SELECT * FROM stores WHERE session_token = ?').get(token);
    if (!store) {
      return res.status(401).json({ error: 'Phiên làm việc không hợp lệ hoặc đã hết hạn!' });
    }

    req.store = store;
    next();
  } catch (err) {
    console.error('authStore error:', err);
    res.status(500).json({ error: 'Lỗi xác thực phiên làm việc' });
  }
}

module.exports = { authStore };
