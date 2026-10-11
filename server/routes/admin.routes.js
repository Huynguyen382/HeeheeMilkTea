const express = require('express');
const crypto = require('crypto');
const db = require('../models/db');
const anticheat = require('../services/anticheat.service');
const gameService = require('../services/game.service');
const { invalidateStoreCache, gameCache } = require('../services/game/cache.helper');
const { RECIPES, UPGRADES, CORE_RECIPES, CHAPTER_CUP_PRICE_CAPS } = require('../services/game/constants');
const {
  INGREDIENTS,
  DEFAULT_INGREDIENT_PRICES,
  applyIngredientPriceOverrides,
  resetIngredientPricesToDefault
} = require('../data/ingredients');
const { LOCATIONS, DECORATIONS } = require('../data/locations');
const circuitBreaker = require('../services/circuit-breaker');
const { rateLimitService } = require('../middleware/rate-limit.middleware');
const liveSync = require('../services/live-sync.service');
const collabService = require('../services/game/collab.service');

const router = express.Router();

/**
 * Helper to determine a store's online presence
 */
function getStorePresence(storeId) {
  const sid = Number(storeId);
  const now = Date.now();
  const isSse = liveSync.isStoreSSEConnected ? liveSync.isStoreSSEConnected(sid) : false;
  const lastActive = collabService.getStoreHeartbeatTime ? collabService.getStoreHeartbeatTime(sid) : null;
  const isHeartbeat = !!(lastActive && (now - lastActive < 60000));
  const isOnline = isSse || isHeartbeat;
  const idleSeconds = lastActive ? Math.max(0, Math.floor((now - lastActive) / 1000)) : (isSse ? 0 : null);

  return {
    is_online: isOnline,
    last_active_at: lastActive,
    idle_seconds: idleSeconds,
    connection_type: isSse ? 'sse' : (isHeartbeat ? 'heartbeat' : 'offline')
  };
}

// Admin credentials from environment or fallback default for development
const ADMIN_USERNAME = process.env.ADMIN_USERNAME || 'admin';
const ADMIN_SECRET = process.env.ADMIN_KEY || process.env.ADMIN_PASSWORD || 'admin123';

const VALID_ADMIN_SECRETS = new Set([
  'admin123',
  'huytestadmin123',
  ADMIN_SECRET,
  process.env.ADMIN_KEY,
  process.env.ADMIN_PASSWORD
].filter(Boolean));

function isValidAdminSecret(key) {
  if (!key) return false;
  return VALID_ADMIN_SECRETS.has(String(key).trim());
}

/**
 * Middleware: Admin Authentication
 */
function requireAdmin(req, res, next) {
  const authHeader = req.headers['authorization'];
  let token = null;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    token = authHeader.substring(7).trim();
  }
  const customKey = req.headers['x-admin-key'];
  const queryKey = req.query.admin_key;

  const providedKey = token || customKey || queryKey;

  if (!providedKey || !isValidAdminSecret(providedKey)) {
    return res.status(401).json({
      success: false,
      error: 'Truy cập bị từ chối: Mật mã quản trị viên không chính xác!'
    });
  }
  next();
}

/**
 * Helper to log audit events
 */
async function recordAuditLog(storeId, eventType, detail) {
  try {
    const now = new Date().toISOString();
    await db.prepare(`
      INSERT INTO audit_logs (store_id, event_type, detail, logged_at)
      VALUES (?, ?, ?, ?)
    `).run(storeId || null, eventType, typeof detail === 'string' ? detail : JSON.stringify(detail), now);
  } catch (err) {
    console.error('[Admin Audit Log Error]', err.message);
  }
}

/**
 * Helper to hash password
 */
function hashPassword(password) {
  const salt = crypto.randomBytes(16).toString('hex');
  const hash = crypto.pbkdf2Sync(password, salt, 1000, 64, 'sha512').toString('hex');
  return `${salt}:${hash}`;
}

// -------------------------------------------------------------
// AUTH ENDPOINTS
// -------------------------------------------------------------

router.post('/login', (req, res) => {
  const { username, password, key } = req.body;

  // Support direct secret key
  if (key && isValidAdminSecret(key)) {
    return res.json({
      success: true,
      token: key,
      username: ADMIN_USERNAME,
      message: 'Đăng nhập trang quản trị thành công!'
    });
  }

  // Support username + password
  const inputUser = (username || '').trim().toLowerCase();
  const inputPass = (password || '').trim();

  // Validate password
  if (!isValidAdminSecret(inputPass)) {
    return res.status(401).json({
      success: false,
      message: 'Mật khẩu quản trị viên không chính xác! (Mặc định: admin123)'
    });
  }

  // If username is provided, accept 'admin' or configured ADMIN_USERNAME
  const validUsers = new Set(['admin', ADMIN_USERNAME.toLowerCase()]);
  if (inputUser && !validUsers.has(inputUser)) {
    return res.status(401).json({
      success: false,
      message: 'Tài khoản quản trị viên không đúng! (Mặc định: admin)'
    });
  }

  res.json({
    success: true,
    token: inputPass || ADMIN_SECRET,
    username: inputUser || ADMIN_USERNAME,
    message: 'Đăng nhập trang quản trị thành công!'
  });
});

router.get('/verify', requireAdmin, (req, res) => {
  res.json({ success: true, message: 'Xác thực thành công!' });
});

// -------------------------------------------------------------
// STORES MANAGEMENT ENDPOINTS
// -------------------------------------------------------------

// 1. Get all stores with summary data
router.get('/stores', requireAdmin, async (req, res) => {
  try {
    const search = (req.query.search || '').trim().toLowerCase();
    const stores = await db.prepare(`
      SELECT 
        s.id, s.username, s.store_code, s.store_name, s.session_token, s.created_at,
        g.chapter, g.day_in_game, g.money, g.debt_remaining, g.reputation, g.teacoin,
        g.is_jailed, g.jail_reason, g.rest_until_ts, g.updated_at
      FROM stores s
      LEFT JOIN game_saves g ON s.id = g.store_id
      ORDER BY s.id DESC
    `).all();

    // Fetch order counts
    const orderCounts = await db.prepare(`
      SELECT store_id, COUNT(*) as active_orders_count 
      FROM active_orders 
      GROUP BY store_id
    `).all();
    const orderCountMap = {};
    (orderCounts || []).forEach(o => {
      orderCountMap[o.store_id] = Number(o.active_orders_count);
    });

    let filtered = stores || [];
    if (search) {
      filtered = filtered.filter(s => 
        (s.store_name && s.store_name.toLowerCase().includes(search)) ||
        (s.store_code && s.store_code.toLowerCase().includes(search)) ||
        (s.username && s.username.toLowerCase().includes(search)) ||
        String(s.id) === search
      );
    }

    let result = (filtered || []).map(s => {
      const presence = getStorePresence(s.id);
      return {
        ...s,
        active_orders_count: orderCountMap[s.id] || 0,
        is_online: presence.is_online,
        last_active_at: presence.last_active_at,
        idle_seconds: presence.idle_seconds,
        connection_type: presence.connection_type
      };
    });

    if (req.query.online === '1' || req.query.filter === 'online') {
      result = result.filter(s => s.is_online);
    }

    res.json({ success: true, count: result.length, stores: result });
  } catch (err) {
    console.error('Admin get stores error:', err);
    res.status(500).json({ success: false, error: err.message });
  }
});

// 1b. Get only online stores with real-time connection status
router.get('/online', requireAdmin, async (req, res) => {
  try {
    const stores = await db.prepare(`
      SELECT 
        s.id, s.username, s.store_code, s.store_name, s.session_token, s.created_at,
        g.chapter, g.day_in_game, g.money, g.debt_remaining, g.reputation, g.teacoin,
        g.is_jailed, g.jail_reason, g.rest_until_ts, g.updated_at
      FROM stores s
      LEFT JOIN game_saves g ON s.id = g.store_id
      ORDER BY s.id DESC
    `).all();

    const orderCounts = await db.prepare(`
      SELECT store_id, COUNT(*) as active_orders_count 
      FROM active_orders 
      GROUP BY store_id
    `).all();
    const orderCountMap = {};
    (orderCounts || []).forEach(o => {
      orderCountMap[o.store_id] = Number(o.active_orders_count);
    });

    const onlineStores = [];
    for (const s of stores || []) {
      const presence = getStorePresence(s.id);
      if (presence.is_online) {
        onlineStores.push({
          ...s,
          active_orders_count: orderCountMap[s.id] || 0,
          is_online: true,
          last_active_at: presence.last_active_at,
          idle_seconds: presence.idle_seconds,
          connection_type: presence.connection_type
        });
      }
    }

    // Sort by most recently active first
    onlineStores.sort((a, b) => (b.last_active_at || 0) - (a.last_active_at || 0));

    res.json({
      success: true,
      count: onlineStores.length,
      stores: onlineStores,
      serverTime: new Date().toISOString()
    });
  } catch (err) {
    console.error('Admin get online stores error:', err);
    res.status(500).json({ success: false, error: err.message });
  }
});

// 2. Get full details of a single store
router.get('/stores/:id', requireAdmin, async (req, res) => {
  try {
    const storeId = Number(req.params.id);
    const store = await db.prepare('SELECT id, username, store_code, store_name, session_token, created_at FROM stores WHERE id = ?').get(storeId);
    if (!store) {
      return res.status(404).json({ success: false, error: 'Không tìm thấy cửa hàng này!' });
    }

    const save = await db.prepare('SELECT * FROM game_saves WHERE store_id = ?').get(storeId);
    const realDate = anticheat.getRealDate();
    const daily = await db.prepare('SELECT * FROM daily_stats WHERE store_id = ? AND real_date = ?').get(storeId, realDate);
    const orders = await db.prepare('SELECT * FROM active_orders WHERE store_id = ? ORDER BY created_at DESC').all(storeId);

    // Parse JSON safely
    const parsedSave = save ? {
      ...save,
      upgrades: JSON.parse(save.upgrades || '{}'),
      recipes: JSON.parse(save.recipes || '["tra_sua_truyen_thong"]'),
      inventory: JSON.parse(save.inventory || '{}'),
      active_buffs: JSON.parse(save.active_buffs || '{}'),
      properties: JSON.parse(save.properties || '{}'),
      decorations: JSON.parse(save.decorations || '[]'),
      custom_prices: JSON.parse(save.custom_prices || '{}'),
      daily_quests: JSON.parse(save.daily_quests || '{}')
    } : null;

    res.json({
      success: true,
      store,
      save: parsedSave,
      dailyStats: daily || null,
      orders: orders || [],
      staticDb: {
        recipes: RECIPES,
        upgrades: UPGRADES,
        ingredients: INGREDIENTS,
        locations: LOCATIONS,
        decorations: DECORATIONS
      }
    });
  } catch (err) {
    console.error('Admin get store detail error:', err);
    res.status(500).json({ success: false, error: err.message });
  }
});

// 3. Update basic game stats (Money, Debt, Rep, Day, Chapter, Teacoin, Jail, Rest)
router.put('/stores/:id/stats', requireAdmin, async (req, res) => {
  try {
    const storeId = Number(req.params.id);
    let save = await db.prepare('SELECT * FROM game_saves WHERE store_id = ?').get(storeId);
    if (!save) return res.status(404).json({ success: false, error: 'Chưa có dữ liệu save của cửa hàng' });

    const {
      money,
      debt_remaining,
      reputation,
      teacoin,
      chapter,
      day_in_game,
      is_jailed,
      jail_reason,
      rest_until_ts
    } = req.body;

    const newMoney = (money !== undefined) ? Math.max(0, Number(money)) : Number(save.money);
    const newDebt = (debt_remaining !== undefined) ? Math.max(0, Number(debt_remaining)) : Number(save.debt_remaining);
    const newRep = (reputation !== undefined) ? Math.min(5.0, Math.max(1.0, parseFloat(reputation))) : Number(save.reputation);
    const newTeacoin = (teacoin !== undefined) ? Math.max(0, Number(teacoin)) : Number(save.teacoin || 0);
    const newChapter = (chapter !== undefined) ? Math.max(1, Number(chapter)) : Number(save.chapter || 1);
    const newDay = (day_in_game !== undefined) ? Math.max(1, Number(day_in_game)) : Number(save.day_in_game || 1);
    const newJailed = (is_jailed !== undefined) ? (is_jailed ? 1 : 0) : Number(save.is_jailed || 0);
    const newJailReason = (jail_reason !== undefined) ? jail_reason : save.jail_reason;
    const newRestUntil = (rest_until_ts !== undefined) ? Number(rest_until_ts) : Number(save.rest_until_ts || 0);

    const updatedState = {
      store_id: storeId,
      chapter: newChapter,
      day_in_game: newDay,
      money: newMoney,
      debt_remaining: newDebt,
      reputation: newRep,
      teacoin: newTeacoin
    };

    const newHash = anticheat.generateSaveHash(updatedState);
    const now = new Date().toISOString();

    await db.prepare(`
      UPDATE game_saves 
      SET money = ?, debt_remaining = ?, reputation = ?, teacoin = ?, chapter = ?, 
          day_in_game = ?, is_jailed = ?, jail_reason = ?, rest_until_ts = ?, 
          save_hash = ?, updated_at = ?
      WHERE store_id = ?
    `).run(
      newMoney, newDebt, newRep, newTeacoin, newChapter,
      newDay, newJailed, newJailReason, newRestUntil,
      newHash, now, storeId
    );

    invalidateStoreCache(storeId);
    await recordAuditLog(storeId, 'ADMIN_UPDATE_STATS', req.body);

    const fullStoreState = await gameService.getStoreState(storeId);
    liveSync.pushToStore(storeId, 'state_updated', {
      state: fullStoreState,
      message: 'Chỉ số cửa hàng vừa được cập nhật bởi Quản trị viên!'
    });

    res.json({
      success: true,
      message: 'Cập nhật chỉ số thành công!',
      data: updatedState
    });
  } catch (err) {
    console.error('Admin update stats error:', err);
    res.status(500).json({ success: false, error: err.message });
  }
});

// 4. Update Inventory
router.put('/stores/:id/inventory', requireAdmin, async (req, res) => {
  try {
    const storeId = Number(req.params.id);
    const { inventory } = req.body;
    if (!inventory || typeof inventory !== 'object') {
      return res.status(400).json({ success: false, error: 'Dữ liệu kho nguyên liệu không hợp lệ!' });
    }

    const save = await db.prepare('SELECT * FROM game_saves WHERE store_id = ?').get(storeId);
    if (!save) return res.status(404).json({ success: false, error: 'Không tìm thấy save!' });

    const currentInv = JSON.parse(save.inventory || '{}');
    const mergedInv = { ...currentInv, ...inventory };

    // Ensure all numeric values >= 0
    Object.keys(mergedInv).forEach(k => {
      mergedInv[k] = Math.max(0, parseInt(mergedInv[k], 10) || 0);
    });

    const now = new Date().toISOString();
    await db.prepare(`
      UPDATE game_saves 
      SET inventory = ?, updated_at = ?
      WHERE store_id = ?
    `).run(JSON.stringify(mergedInv), now, storeId);

    invalidateStoreCache(storeId);
    await recordAuditLog(storeId, 'ADMIN_UPDATE_INVENTORY', mergedInv);

    const fullStoreState = await gameService.getStoreState(storeId);
    liveSync.pushToStore(storeId, 'state_updated', {
      state: fullStoreState,
      message: 'Kho nguyên liệu của bạn vừa được cập nhật!'
    });

    res.json({ success: true, message: 'Đã cập nhật kho nguyên liệu!', inventory: mergedInv });
  } catch (err) {
    console.error('Admin update inventory error:', err);
    res.status(500).json({ success: false, error: err.message });
  }
});

// 5. Update Upgrades & Pets
router.put('/stores/:id/upgrades', requireAdmin, async (req, res) => {
  try {
    const storeId = Number(req.params.id);
    const { upgrades } = req.body;
    if (!upgrades || typeof upgrades !== 'object') {
      return res.status(400).json({ success: false, error: 'Dữ liệu nâng cấp không hợp lệ!' });
    }

    const save = await db.prepare('SELECT * FROM game_saves WHERE store_id = ?').get(storeId);
    if (!save) return res.status(404).json({ success: false, error: 'Không tìm thấy save!' });

    const now = new Date().toISOString();
    await db.prepare(`
      UPDATE game_saves 
      SET upgrades = ?, updated_at = ?
      WHERE store_id = ?
    `).run(JSON.stringify(upgrades), now, storeId);

    invalidateStoreCache(storeId);
    await recordAuditLog(storeId, 'ADMIN_UPDATE_UPGRADES', upgrades);

    const fullStoreState = await gameService.getStoreState(storeId);
    liveSync.pushToStore(storeId, 'state_updated', {
      state: fullStoreState,
      message: 'Danh sách trang bị & thú cưng vừa được cập nhật!'
    });

    res.json({ success: true, message: 'Đã cập nhật nâng cấp & thú cưng!', upgrades });
  } catch (err) {
    console.error('Admin update upgrades error:', err);
    res.status(500).json({ success: false, error: err.message });
  }
});

// 6. Update Recipes
router.put('/stores/:id/recipes', requireAdmin, async (req, res) => {
  try {
    const storeId = Number(req.params.id);
    const { recipes } = req.body;
    if (!Array.isArray(recipes)) {
      return res.status(400).json({ success: false, error: 'Danh sách công thức phải là một mảng!' });
    }

    const save = await db.prepare('SELECT * FROM game_saves WHERE store_id = ?').get(storeId);
    if (!save) return res.status(404).json({ success: false, error: 'Không tìm thấy save!' });

    const now = new Date().toISOString();
    await db.prepare(`
      UPDATE game_saves 
      SET recipes = ?, updated_at = ?
      WHERE store_id = ?
    `).run(JSON.stringify(recipes), now, storeId);

    invalidateStoreCache(storeId);
    await recordAuditLog(storeId, 'ADMIN_UPDATE_RECIPES', recipes);

    const fullStoreState = await gameService.getStoreState(storeId);
    liveSync.pushToStore(storeId, 'state_updated', {
      state: fullStoreState,
      message: 'Danh mục công thức pha chế của quán vừa được mở khóa mới!'
    });

    res.json({ success: true, message: 'Đã cập nhật danh sách công thức!', recipes });
  } catch (err) {
    console.error('Admin update recipes error:', err);
    res.status(500).json({ success: false, error: err.message });
  }
});

// 7. Update Custom Prices
router.put('/stores/:id/custom-prices', requireAdmin, async (req, res) => {
  try {
    const storeId = Number(req.params.id);
    const { customPrices } = req.body;
    if (!customPrices || typeof customPrices !== 'object') {
      return res.status(400).json({ success: false, error: 'Dữ liệu giá bán không hợp lệ!' });
    }

    const save = await db.prepare('SELECT chapter FROM game_saves WHERE store_id = ?').get(storeId);
    const chapterCap = CHAPTER_CUP_PRICE_CAPS[save ? save.chapter : 1] || 80000;
    const sanitizedPrices = {};
    for (const [rId, val] of Object.entries(customPrices)) {
      const p = Number(val);
      if (!isNaN(p) && p > 0) {
        sanitizedPrices[rId] = Math.min(Math.round(p), chapterCap);
      }
    }

    const now = new Date().toISOString();
    await db.prepare(`
      UPDATE game_saves 
      SET custom_prices = ?, updated_at = ?
      WHERE store_id = ?
    `).run(JSON.stringify(sanitizedPrices), now, storeId);

    invalidateStoreCache(storeId);
    await recordAuditLog(storeId, 'ADMIN_UPDATE_CUSTOM_PRICES', sanitizedPrices);

    res.json({ success: true, message: `Đã cập nhật giá bán tùy chỉnh (Giới hạn Chương ${save ? save.chapter : 1}: tối đa ${chapterCap.toLocaleString('vi-VN')}đ/ly)!`, customPrices: sanitizedPrices });
  } catch (err) {
    console.error('Admin update custom prices error:', err);
    res.status(500).json({ success: false, error: err.message });
  }
});

// 8. Update Properties & Decorations
router.put('/stores/:id/properties', requireAdmin, async (req, res) => {
  try {
    const storeId = Number(req.params.id);
    const { properties, decorations } = req.body;

    const save = await db.prepare('SELECT * FROM game_saves WHERE store_id = ?').get(storeId);
    if (!save) return res.status(404).json({ success: false, error: 'Không tìm thấy save!' });

    const now = new Date().toISOString();
    const propsJson = properties !== undefined ? JSON.stringify(properties) : save.properties;
    const decorsJson = decorations !== undefined ? JSON.stringify(decorations) : save.decorations;

    await db.prepare(`
      UPDATE game_saves 
      SET properties = ?, decorations = ?, updated_at = ?
      WHERE store_id = ?
    `).run(propsJson, decorsJson, now, storeId);

    invalidateStoreCache(storeId);
    await recordAuditLog(storeId, 'ADMIN_UPDATE_PROPERTIES', { properties, decorations });

    res.json({ success: true, message: 'Đã cập nhật mặt bằng và trang trí quán!' });
  } catch (err) {
    console.error('Admin update properties error:', err);
    res.status(500).json({ success: false, error: err.message });
  }
});

// 9. Update Account Details (Store Name, Username, Password)
router.put('/stores/:id/account', requireAdmin, async (req, res) => {
  try {
    const storeId = Number(req.params.id);
    const { store_name, username, password } = req.body;

    const store = await db.prepare('SELECT * FROM stores WHERE id = ?').get(storeId);
    if (!store) return res.status(404).json({ success: false, error: 'Không tìm thấy cửa hàng!' });

    let newUsername = store.username;
    if (username && username.trim().toLowerCase() !== store.username) {
      newUsername = username.trim().toLowerCase();
      const existing = await db.prepare('SELECT id FROM stores WHERE username = ? AND id != ?').get(newUsername, storeId);
      if (existing) {
        return res.status(400).json({ success: false, error: 'Tên đăng nhập này đã được quán khác sử dụng!' });
      }
    }

    const newStoreName = (store_name && store_name.trim()) ? store_name.trim() : store.store_name;
    let newPassHash = store.password_hash;
    if (password && password.trim()) {
      newPassHash = hashPassword(password.trim());
    }

    await db.prepare(`
      UPDATE stores 
      SET store_name = ?, username = ?, password_hash = ?
      WHERE id = ?
    `).run(newStoreName, newUsername, newPassHash, storeId);

    invalidateStoreCache(storeId);
    await recordAuditLog(storeId, 'ADMIN_UPDATE_ACCOUNT', { store_name: newStoreName, username: newUsername, passwordChanged: !!password });

    res.json({
      success: true,
      message: 'Cập nhật thông tin tài khoản thành công!'
    });
  } catch (err) {
    console.error('Admin update account error:', err);
    res.status(500).json({ success: false, error: err.message });
  }
});

// 10. Quick Action Shortcuts (Add Money, Clear Debt, Max Inventory, Unlock All, Unjail, Reset Day Cap)
router.post('/stores/:id/quick-action', requireAdmin, async (req, res) => {
  try {
    const storeId = Number(req.params.id);
    const { action, amount } = req.body;

    const save = await db.prepare('SELECT * FROM game_saves WHERE store_id = ?').get(storeId);
    if (!save) return res.status(404).json({ success: false, error: 'Không tìm thấy save!' });

    const now = new Date().toISOString();

    switch (action) {
      case 'add_money': {
        const add = Number(amount) || 10000000;
        const newMoney = Number(save.money) + add;
        const state = {
          store_id: storeId,
          chapter: Number(save.chapter),
          day_in_game: Number(save.day_in_game),
          money: newMoney,
          debt_remaining: Number(save.debt_remaining),
          reputation: Number(save.reputation),
          teacoin: Number(save.teacoin || 0)
        };
        const hash = anticheat.generateSaveHash(state);
        await db.prepare(`UPDATE game_saves SET money = ?, save_hash = ?, updated_at = ? WHERE store_id = ?`).run(newMoney, hash, now, storeId);
        break;
      }

      case 'clear_debt': {
        const state = {
          store_id: storeId,
          chapter: Number(save.chapter),
          day_in_game: Number(save.day_in_game),
          money: Number(save.money),
          debt_remaining: 0,
          reputation: Number(save.reputation),
          teacoin: Number(save.teacoin || 0)
        };
        const hash = anticheat.generateSaveHash(state);
        await db.prepare(`UPDATE game_saves SET debt_remaining = 0, save_hash = ?, updated_at = ? WHERE store_id = ?`).run(hash, now, storeId);
        break;
      }

      case 'add_teacoin': {
        const addCoin = Number(amount) || 1000;
        const newTeacoin = Number(save.teacoin || 0) + addCoin;
        const state = {
          store_id: storeId,
          chapter: Number(save.chapter),
          day_in_game: Number(save.day_in_game),
          money: Number(save.money),
          debt_remaining: Number(save.debt_remaining),
          reputation: Number(save.reputation),
          teacoin: newTeacoin
        };
        const hash = anticheat.generateSaveHash(state);
        await db.prepare(`UPDATE game_saves SET teacoin = ?, save_hash = ?, updated_at = ? WHERE store_id = ?`).run(newTeacoin, hash, now, storeId);
        break;
      }

      case 'full_inventory': {
        const full = {
          tra_den: 999,
          tra_thai_xanh: 999,
          sua_tuoi: 999,
          tra_lai: 999,
          tra_olong: 999,
          tranchau_den: 999,
          thach_la_dua: 999,
          tranchau_duongden: 999,
          dao_mieng: 999,
          cam_vang: 999,
          sa_tuoi: 999,
          suong_sao: 999,
          cups: 999
        };
        await db.prepare(`UPDATE game_saves SET inventory = ?, updated_at = ? WHERE store_id = ?`).run(JSON.stringify(full), now, storeId);
        break;
      }

      case 'unlock_all_recipes': {
        const allRecipes = Object.keys(RECIPES);
        await db.prepare(`UPDATE game_saves SET recipes = ?, updated_at = ? WHERE store_id = ?`).run(JSON.stringify(allRecipes), now, storeId);
        break;
      }

      case 'unlock_all_upgrades': {
        const allUpgrades = {
          may_dap_nap: true,
          binh_u_lon: true,
          xe_wave: true,
          bua_an_than: { count: 3 },
          loa_keo_keo: true,
          tui_muoi_phong_thuy: true,
          may_lac_sieu_toc: true,
          ve_vang_vip: 5,
          bien_led_neon: true,
          pet_corgi: true,
          pet_meo_tam_the: true,
          pet_capybara: true,
          pets: {
            corgi: { active: true, stolen: false },
            meo_tam_the: { active: true, stolen: false },
            capybara: { active: true, stolen: false }
          }
        };
        await db.prepare(`UPDATE game_saves SET upgrades = ?, updated_at = ? WHERE store_id = ?`).run(JSON.stringify(allUpgrades), now, storeId);
        break;
      }

      case 'unban_unjail': {
        await db.prepare(`
          UPDATE game_saves 
          SET is_jailed = 0, jail_reason = NULL, rest_until_ts = 0, updated_at = ?
          WHERE store_id = ?
        `).run(now, storeId);
        break;
      }

      case 'jail_player': {
        const reason = req.body.reason || 'Bị phạt do vi phạm quản lý trật tự đô thị';
        await db.prepare(`
          UPDATE game_saves 
          SET is_jailed = 1, jail_reason = ?, updated_at = ?
          WHERE store_id = ?
        `).run(reason, now, storeId);
        break;
      }

      case 'reset_daily_cap': {
        const realDate = anticheat.getRealDate();
        await db.prepare(`
          UPDATE daily_stats 
          SET earned_today = 0, is_overloaded = 0 
          WHERE store_id = ? AND real_date = ?
        `).run(storeId, realDate);
        break;
      }

      case 'complete_all_quests': {
        const dailyQuests = {
          date: anticheat.getRealDate(),
          bonusClaimed: true,
          quests: [
            { id: 'serve_orders', title: 'Pha Chế Chăm Chỉ', desc: 'Hoàn thành 10 ly trà sữa cho khách', current: 10, target: 10, completed: true, claimed: true, rewardTeacoin: 15 },
            { id: 'earn_revenue', title: 'Doanh Thu Ngày Mới', desc: 'Kiếm được 200.000đ từ tiền bán trà sữa', current: 200000, target: 200000, completed: true, claimed: true, rewardTeacoin: 20 },
            { id: 'shipper_snack', title: 'Đối Tác Thân Thiết', desc: 'Chốt thành công 1 đơn ăn vặt với Shipper', current: 1, target: 1, completed: true, claimed: true, rewardTeacoin: 15 },
            { id: 'negotiate_win', title: 'Bậc Thầy Thương Thuyết', desc: 'Thương lượng chốt đơn thành công với khách khó tính', current: 1, target: 1, completed: true, claimed: true, rewardTeacoin: 20 }
          ]
        };
        await db.prepare(`UPDATE game_saves SET daily_quests = ?, updated_at = ? WHERE store_id = ?`).run(JSON.stringify(dailyQuests), now, storeId);
        break;
      }

      default:
        return res.status(400).json({ success: false, error: 'Thao tác nhanh không được hỗ trợ!' });
    }

    invalidateStoreCache(storeId);
    await recordAuditLog(storeId, 'ADMIN_QUICK_ACTION', { action, amount });

    // Push state update to client immediately
    const updatedState = await gameService.getStoreState(storeId);
    liveSync.pushToStore(storeId, 'state_updated', {
      state: updatedState,
      action,
      message: `Quản trị viên vừa áp dụng thao tác [${action}] lên tiệm của bạn!`
    });

    res.json({
      success: true,
      message: `Thực hiện thao tác [${action}] thành công!`
    });
  } catch (err) {
    console.error('Admin quick action error:', err);
    res.status(500).json({ success: false, error: err.message });
  }
});

// 11. Reset Player to New Game
router.post('/stores/:id/reset', requireAdmin, async (req, res) => {
  try {
    const storeId = Number(req.params.id);
    const store = await db.prepare('SELECT * FROM stores WHERE id = ?').get(storeId);
    if (!store) return res.status(404).json({ success: false, error: 'Không tìm thấy cửa hàng!' });

    const now = new Date().toISOString();
    const initialSave = {
      store_id: storeId,
      chapter: 1,
      day_in_game: 1,
      money: 200000,
      debt_remaining: 3000000,
      reputation: 5.0,
      teacoin: 0
    };
    const hash = anticheat.generateSaveHash(initialSave);

    await db.prepare(`
      UPDATE game_saves 
      SET chapter = 1, day_in_game = 1, money = 200000, debt_remaining = 3000000, 
          reputation = 5.0, teacoin = 0, upgrades = '{}', recipes = ?, 
          inventory = '{"tea":50,"milk":50,"pearls":50,"cups":50}',
          save_hash = ?, is_jailed = 0, jail_reason = NULL, rest_until_ts = 0,
          active_buffs = '{}', properties = '{}', decorations = '[]', custom_prices = '{}',
          daily_quests = '{}', updated_at = ?
      WHERE store_id = ?
    `).run(JSON.stringify(CORE_RECIPES), hash, now, storeId);

    // Delete active orders for this store
    await db.prepare('DELETE FROM active_orders WHERE store_id = ?').run(storeId);

    invalidateStoreCache(storeId);
    await recordAuditLog(storeId, 'ADMIN_RESET_GAME_SAVE', {});

    res.json({ success: true, message: 'Đã reset tiến trình quán về trạng thái ban đầu!' });
  } catch (err) {
    console.error('Admin reset game save error:', err);
    res.status(500).json({ success: false, error: err.message });
  }
});

// 12. Delete Store Permanently
router.delete('/stores/:id', requireAdmin, async (req, res) => {
  try {
    const storeId = Number(req.params.id);
    const store = await db.prepare('SELECT * FROM stores WHERE id = ?').get(storeId);
    if (!store) return res.status(404).json({ success: false, error: 'Không tìm thấy cửa hàng!' });

    // Cascade delete store and all related records
    await db.prepare('DELETE FROM active_orders WHERE store_id = ?').run(storeId);
    await db.prepare('DELETE FROM daily_stats WHERE store_id = ?').run(storeId);
    await db.prepare('DELETE FROM game_saves WHERE store_id = ?').run(storeId);
    await db.prepare('DELETE FROM stores WHERE id = ?').run(storeId);

    invalidateStoreCache(storeId);
    await recordAuditLog(storeId, 'ADMIN_DELETE_STORE', { store_name: store.store_name, code: store.store_code });

    res.json({ success: true, message: `Đã xóa vĩnh viễn tiệm [${store.store_name}]!` });
  } catch (err) {
    console.error('Admin delete store error:', err);
    res.status(500).json({ success: false, error: err.message });
  }
});

// 13. Create New Store from Admin
router.post('/stores/create', requireAdmin, async (req, res) => {
  try {
    const { username, password, store_name, money, chapter } = req.body;
    if (!store_name || !store_name.trim()) {
      return res.status(400).json({ success: false, error: 'Tên quán không được để trống!' });
    }

    let cleanUser = null;
    let passHash = null;
    if (username && username.trim()) {
      cleanUser = username.trim().toLowerCase();
      const existing = await db.prepare('SELECT id FROM stores WHERE username = ?').get(cleanUser);
      if (existing) {
        return res.status(400).json({ success: false, error: 'Tên đăng nhập này đã tồn tại!' });
      }
      passHash = hashPassword(password || '123456');
    }

    const code = 'HYHY-' + crypto.randomBytes(3).toString('hex').toUpperCase();
    const token = crypto.randomBytes(16).toString('hex');
    const now = new Date().toISOString();

    const insertResult = await db.prepare(`
      INSERT INTO stores (username, password_hash, store_code, store_name, session_token, created_at)
      VALUES (?, ?, ?, ?, ?, ?)
    `).run(cleanUser, passHash, code, store_name.trim(), token, now);

    const storeId = Number(insertResult.lastInsertRowid);
    const initialMoney = Number(money) || 200000;
    const initialChapter = Number(chapter) || 1;

    const initialSave = {
      store_id: storeId,
      chapter: initialChapter,
      day_in_game: 1,
      money: initialMoney,
      debt_remaining: 3000000,
      reputation: 5.0,
      teacoin: 0
    };
    const hash = anticheat.generateSaveHash(initialSave);

    await db.prepare(`
      INSERT INTO game_saves (store_id, chapter, day_in_game, money, debt_remaining, reputation, teacoin, recipes, save_hash, updated_at)
      VALUES (?, ?, 1, ?, 3000000, 5.0, 0, ?, ?, ?)
    `).run(storeId, initialChapter, initialMoney, JSON.stringify(CORE_RECIPES), hash, now);

    await recordAuditLog(storeId, 'ADMIN_CREATE_STORE', { store_name, code, username: cleanUser });

    res.json({
      success: true,
      message: 'Tạo cửa hàng mới thành công!',
      store: {
        id: storeId,
        store_name,
        store_code: code,
        username: cleanUser
      }
    });
  } catch (err) {
    console.error('Admin create store error:', err);
    res.status(500).json({ success: false, error: err.message });
  }
});

// -------------------------------------------------------------
// ORDERS MANAGEMENT ENDPOINTS
// -------------------------------------------------------------

// 1. Get all active orders across all stores
router.get('/orders', requireAdmin, async (req, res) => {
  try {
    const orders = await db.prepare(`
      SELECT o.*, s.store_name, s.store_code 
      FROM active_orders o
      JOIN stores s ON o.store_id = s.id
      ORDER BY o.created_at DESC
      LIMIT 100
    `).all();

    res.json({ success: true, count: orders ? orders.length : 0, orders: orders || [] });
  } catch (err) {
    console.error('Admin get orders error:', err);
    res.status(500).json({ success: false, error: err.message });
  }
});

// 2. Force complete an order (Credit money & tips to store)
router.post('/orders/force-complete', requireAdmin, async (req, res) => {
  try {
    const { orderId } = req.body;
    if (!orderId) return res.status(400).json({ success: false, error: 'Thiếu orderId!' });

    const order = await db.prepare('SELECT * FROM active_orders WHERE id = ?').get(orderId);
    if (!order) return res.status(404).json({ success: false, error: 'Đơn hàng không tồn tại hoặc đã xử lý!' });

    const storeId = order.store_id;
    const save = await db.prepare('SELECT * FROM game_saves WHERE store_id = ?').get(storeId);
    if (!save) return res.status(404).json({ success: false, error: 'Không tìm thấy save!' });

    const earned = Number(order.price) || 20000;
    const bonusTip = 5000;
    const totalGained = earned + bonusTip;
    const newMoney = Number(save.money) + totalGained;

    const state = {
      store_id: storeId,
      chapter: Number(save.chapter),
      day_in_game: Number(save.day_in_game),
      money: newMoney,
      debt_remaining: Number(save.debt_remaining),
      reputation: Math.min(5.0, Number(save.reputation) + 0.1),
      teacoin: Number(save.teacoin || 0)
    };
    const hash = anticheat.generateSaveHash(state);
    const now = new Date().toISOString();

    await db.prepare(`
      UPDATE game_saves 
      SET money = ?, reputation = ?, save_hash = ?, updated_at = ?
      WHERE store_id = ?
    `).run(newMoney, state.reputation, hash, now, storeId);

    // Delete active order
    await db.prepare('DELETE FROM active_orders WHERE id = ?').run(orderId);

    // Update daily stats
    const realDate = anticheat.getRealDate();
    await db.prepare(`
      UPDATE daily_stats 
      SET earned_today = earned_today + ?, orders_served = orders_served + 1
      WHERE store_id = ? AND real_date = ?
    `).run(totalGained, storeId, realDate);

    invalidateStoreCache(storeId);
    await recordAuditLog(storeId, 'ADMIN_FORCE_COMPLETE_ORDER', { orderId, totalGained });

    res.json({
      success: true,
      message: `Đã cưỡng chế hoàn thành đơn hàng #${orderId}! Cộng +${totalGained.toLocaleString()}đ vào quán.`
    });
  } catch (err) {
    console.error('Admin force complete order error:', err);
    res.status(500).json({ success: false, error: err.message });
  }
});

// 3. Cancel / Delete an active order
router.delete('/orders/:id', requireAdmin, async (req, res) => {
  try {
    const orderId = req.params.id;
    await db.prepare('DELETE FROM active_orders WHERE id = ?').run(orderId);
    res.json({ success: true, message: `Đã hủy đơn hàng #${orderId}!` });
  } catch (err) {
    console.error('Admin delete order error:', err);
    res.status(500).json({ success: false, error: err.message });
  }
});

// 4. Force spawn a customer order for store
router.post('/orders/spawn', requireAdmin, async (req, res) => {
  try {
    const { storeId, type } = req.body;
    if (!storeId) return res.status(400).json({ success: false, error: 'Thiếu storeId!' });

    const isShipper = (type === 'shipper');
    const order = await gameService.generateOrder(Number(storeId), { isShipper });

    await recordAuditLog(storeId, 'ADMIN_SPAWN_ORDER', { type, orderId: order.id });

    res.json({
      success: true,
      message: `Đã tạo đơn hàng thành công cho tiệm! (${order.customer.name} - ${order.recipe.name})`,
      order
    });
  } catch (err) {
    console.error('Admin spawn order error:', err);
    res.status(500).json({ success: false, error: err.message });
  }
});

// -------------------------------------------------------------
// SYSTEM MONITORING & TOOLS ENDPOINTS
// -------------------------------------------------------------

// 1. System Overview Metrics
router.get('/system/overview', requireAdmin, async (req, res) => {
  try {
    const totalStores = await db.prepare('SELECT COUNT(*) as cnt FROM stores').get();
    const totalOrders = await db.prepare('SELECT COUNT(*) as cnt FROM active_orders').get();
    const totalMoneyDebt = await db.prepare('SELECT SUM(money) as sum_money, SUM(debt_remaining) as sum_debt FROM game_saves').get();
    const realDate = anticheat.getRealDate();
    const todayStats = await db.prepare('SELECT SUM(earned_today) as earned, SUM(orders_served) as orders FROM daily_stats WHERE real_date = ?').get(realDate);

    // Circuit Breaker state
    let cbState = { state: 'UNKNOWN' };
    try {
      cbState = circuitBreaker.getCircuitBreaker().getState();
    } catch (e) {}

    const mem = process.memoryUsage();

    // Online stores count
    let onlineCount = 0;
    try {
      const allStores = await db.prepare('SELECT id FROM stores').all();
      (allStores || []).forEach(row => {
        if (getStorePresence(row.id).is_online) {
          onlineCount++;
        }
      });
    } catch (e) {}

    res.json({
      success: true,
      database: db.isPostgres ? 'Neon PostgreSQL' : 'SQLite',
      totalStores: Number(totalStores ? totalStores.cnt : 0),
      onlineStores: onlineCount,
      activeOrders: Number(totalOrders ? totalOrders.cnt : 0),
      totalMoney: Number(totalMoneyDebt ? totalMoneyDebt.sum_money : 0),
      totalDebt: Number(totalMoneyDebt ? totalMoneyDebt.sum_debt : 0),
      todayEarned: Number(todayStats ? todayStats.earned : 0),
      todayOrdersServed: Number(todayStats ? todayStats.orders : 0),
      uptimeSeconds: Math.floor(process.uptime()),
      memory: {
        heapUsedMB: Math.round(mem.heapUsed / 1024 / 1024),
        heapTotalMB: Math.round(mem.heapTotal / 1024 / 1024),
        rssMB: Math.round(mem.rss / 1024 / 1024)
      },
      circuitBreaker: cbState,
      serverTime: new Date().toISOString()
    });
  } catch (err) {
    console.error('Admin system overview error:', err);
    res.status(500).json({ success: false, error: err.message });
  }
});

// 2. Audit Logs
router.get('/logs', requireAdmin, async (req, res) => {
  try {
    const logs = await db.prepare(`
      SELECT l.*, s.store_name, s.store_code 
      FROM audit_logs l
      LEFT JOIN stores s ON l.store_id = s.id
      ORDER BY l.id DESC
      LIMIT 150
    `).all();

    res.json({ success: true, count: logs ? logs.length : 0, logs: logs || [] });
  } catch (err) {
    console.error('Admin get logs error:', err);
    res.status(500).json({ success: false, error: err.message });
  }
});

// 3. Clear Audit Logs
router.delete('/logs', requireAdmin, async (req, res) => {
  try {
    await db.prepare('DELETE FROM audit_logs').run();
    res.json({ success: true, message: 'Đã dọn dẹp sạch nhật ký hệ thống!' });
  } catch (err) {
    console.error('Admin clear logs error:', err);
    res.status(500).json({ success: false, error: err.message });
  }
});

// 4. Flush Memory Cache
router.post('/system/flush-cache', requireAdmin, (req, res) => {
  try {
    if (gameCache.storeState) gameCache.storeState.clear();
    if (gameCache.staticData) gameCache.staticData.clear();
    if (gameCache.collabs) gameCache.collabs.clear();
    res.json({ success: true, message: 'Đã xóa toàn bộ Cache bộ nhớ máy chủ!' });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// 5. Clear Rate Limit blocks
router.post('/system/clear-ratelimit', requireAdmin, (req, res) => {
  try {
    rateLimitService.clearAll();
    res.json({ success: true, message: 'Đã mở khóa toàn bộ IP & token bị chặn Rate Limit!' });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// 6. Reset Circuit Breaker
router.post('/system/reset-circuit-breaker', requireAdmin, (req, res) => {
  try {
    const breaker = circuitBreaker.getCircuitBreaker();
    breaker.reset();
    res.json({ success: true, message: 'Đã khởi động lại Circuit Breaker về trạng thái CLOSED an toàn!' });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// -------------------------------------------------------------
// EVENTS & NPC MANAGEMENT ENDPOINTS
// -------------------------------------------------------------

// 1. Get all events with current & default buff/debuff rates
router.get('/events', requireAdmin, (req, res) => {
  res.json({
    success: true,
    events: gameService.getEventsList()
  });
});

// 1b. Update buff/debuff rates for events
router.put('/events/rates', requireAdmin, async (req, res) => {
  try {
    const { rates } = req.body;
    if (!rates || typeof rates !== 'object') {
      return res.status(400).json({ success: false, error: 'Dữ liệu tỉ lệ buff/debuff sự kiện không hợp lệ!' });
    }

    const { applyEventRateOverrides, getEventsList } = require('../services/game/event.service');
    applyEventRateOverrides(rates, true);

    if (gameCache.storeState) gameCache.storeState.clear();
    await recordAuditLog(null, 'ADMIN_UPDATE_EVENT_RATES', rates);

    res.json({
      success: true,
      message: 'Đã lưu cấu hình tỉ lệ Buff/Debuff sự kiện thành công!',
      events: getEventsList()
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// 1c. Reset event buff/debuff rates to default
router.post('/events/rates/reset', requireAdmin, async (req, res) => {
  try {
    const { resetEventRatesToDefault, getEventsList } = require('../services/game/event.service');
    resetEventRatesToDefault();

    if (gameCache.storeState) gameCache.storeState.clear();
    await recordAuditLog(null, 'ADMIN_RESET_EVENT_RATES', {});

    res.json({
      success: true,
      message: 'Đã khôi phục tỉ lệ Buff/Debuff sự kiện về mặc định!',
      events: getEventsList()
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// 2. Trigger an event (single store or broadcast) with optional customRates
router.post('/events/trigger', requireAdmin, async (req, res) => {
  try {
    const { storeId, eventId, customRates } = req.body;
    if (!eventId) return res.status(400).json({ success: false, error: 'Thiếu eventId!' });

    if (storeId === 'all') {
      const result = await gameService.broadcastEvent(eventId, customRates);
      await recordAuditLog(null, 'ADMIN_BROADCAST_EVENT', { eventId, customRates, affected: result.affectedCount });

      // Realtime push to all clients (playerMessage hides exact percentages)
      liveSync.broadcast('event_triggered', {
        event: result.event,
        message: result.playerMessage || result.message
      });

      return res.json(result);
    } else {
      if (!storeId) return res.status(400).json({ success: false, error: 'Thiếu storeId!' });
      const result = await gameService.triggerEventForStore(Number(storeId), eventId, customRates);
      await recordAuditLog(Number(storeId), 'ADMIN_TRIGGER_EVENT', { eventId, customRates });

      // Realtime push to target store client (playerMessage hides exact percentages)
      liveSync.pushToStore(Number(storeId), 'event_triggered', {
        event: result.event,
        expiresAt: result.expiresAt,
        message: result.playerMessage || result.message
      });

      return res.json(result);
    }
  } catch (err) {
    console.error('Admin trigger event error:', err);
    res.status(500).json({ success: false, error: err.message });
  }
});

// 3. Get all NPCs
router.get('/npcs', requireAdmin, (req, res) => {
  try {
    const npcs = gameService.CUSTOMERS.map((c, idx) => ({
      index: idx,
      id: c.id,
      name: c.name,
      patience: c.patience,
      fav: c.fav,
      tipMult: c.tipMult,
      isTiktoker: !!c.isTiktoker,
      isShipper: !!c.isShipper,
      isVIP: !!c.isVIP,
      dialogues: c.dialogues
    }));
    res.json({ success: true, count: npcs.length, npcs });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// 4. Force spawn a specific NPC at a store
router.post('/npcs/spawn', requireAdmin, async (req, res) => {
  try {
    const { storeId, npcId } = req.body;
    if (!storeId) return res.status(400).json({ success: false, error: 'Thiếu storeId!' });

    const cust = gameService.CUSTOMERS.find(c => c.id === Number(npcId)) || gameService.CUSTOMERS[0];
    const isShipper = !!cust.isShipper;
    
    // Spawn order for this customer
    const order = await gameService.generateOrder(Number(storeId), { isShipper });
    // Override customer to the specific NPC
    order.customer = cust;
    order.customerName = cust.name;

    await recordAuditLog(Number(storeId), 'ADMIN_SPAWN_NPC', { npcId: cust.id, npcName: cust.name });

    // Realtime push to player client to instantly arrive NPC
    liveSync.pushToStore(Number(storeId), 'npc_spawned', {
      order,
      customer: cust,
      message: `🎉 [${cust.name}] vừa bất ngờ xuất hiện tại quầy của bạn!`
    });

    res.json({
      success: true,
      message: `Đã triệu hồi [${cust.name}] đến quầy của tiệm #${storeId}!`,
      order
    });
  } catch (err) {
    console.error('Admin spawn NPC error:', err);
    res.status(500).json({ success: false, error: err.message });
  }
});

// 5. Get weather types & current buff/debuff rates
router.get('/weather', requireAdmin, async (req, res) => {
  try {
    const { WEATHER_TYPES, DEFAULT_WEATHER_TYPES } = require('../services/game/weather.service');
    const list = Object.values(WEATHER_TYPES).map(w => ({
      ...w,
      defaultRates: DEFAULT_WEATHER_TYPES[w.id] || w
    }));
    res.json({
      success: true,
      weatherTypes: list
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// 5b. Update weather buff/debuff rates
router.put('/weather/rates', requireAdmin, async (req, res) => {
  try {
    const { rates } = req.body;
    if (!rates || typeof rates !== 'object') {
      return res.status(400).json({ success: false, error: 'Dữ liệu tỉ lệ buff/debuff thời tiết không hợp lệ!' });
    }

    const { WEATHER_TYPES, DEFAULT_WEATHER_TYPES, applyWeatherRateOverrides } = require('../services/game/weather.service');
    applyWeatherRateOverrides(rates, true);

    if (gameCache.storeState) gameCache.storeState.clear();
    await recordAuditLog(null, 'ADMIN_UPDATE_WEATHER_RATES', rates);

    res.json({
      success: true,
      message: 'Đã lưu cấu hình tỉ lệ Buff/Debuff thời tiết thành công!',
      weatherTypes: Object.values(WEATHER_TYPES).map(w => ({
        ...w,
        defaultRates: DEFAULT_WEATHER_TYPES[w.id] || w
      }))
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// 5c. Reset weather buff/debuff rates to default
router.post('/weather/rates/reset', requireAdmin, async (req, res) => {
  try {
    const { WEATHER_TYPES, DEFAULT_WEATHER_TYPES, resetWeatherRatesToDefault } = require('../services/game/weather.service');
    resetWeatherRatesToDefault();

    if (gameCache.storeState) gameCache.storeState.clear();
    await recordAuditLog(null, 'ADMIN_RESET_WEATHER_RATES', {});

    res.json({
      success: true,
      message: 'Đã khôi phục tỉ lệ Buff/Debuff thời tiết về mặc định!',
      weatherTypes: Object.values(WEATHER_TYPES).map(w => ({
        ...w,
        defaultRates: DEFAULT_WEATHER_TYPES[w.id] || w
      }))
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// 6. Force set weather for a store or broadcast to all stores (supports customRates)
router.post('/weather/change', requireAdmin, async (req, res) => {
  try {
    const { weatherId, storeId, broadcast, customRates } = req.body;
    if (!weatherId) return res.status(400).json({ success: false, error: 'Thiếu weatherId!' });

    if (broadcast) {
      const result = await gameService.setGlobalWeather(weatherId, customRates);
      await recordAuditLog(null, 'ADMIN_BROADCAST_WEATHER', { weatherId, customRates });

      // Realtime push to all connected player clients
      liveSync.broadcast('weather_changed', {
        weather: result.weather,
        message: result.message
      });

      return res.json(result);
    } else {
      if (!storeId) return res.status(400).json({ success: false, error: 'Thiếu storeId hoặc broadcast flag!' });
      const result = await gameService.setWeatherForStore(Number(storeId), weatherId, customRates);
      await recordAuditLog(Number(storeId), 'ADMIN_SET_WEATHER', { weatherId, customRates });

      // Realtime push to target store client
      liveSync.pushToStore(Number(storeId), 'weather_changed', {
        weather: result.weather,
        message: result.message
      });

      return res.json(result);
    }
  } catch (err) {
    console.error('Admin set weather error:', err);
    res.status(500).json({ success: false, error: err.message });
  }
});

// 7. Get Room Decorations Catalog
router.get('/room/decorations', requireAdmin, (req, res) => {
  try {
    const { ROOM_DECORATIONS } = require('../data/room_decorations');
    res.json({
      success: true,
      items: Object.values(ROOM_DECORATIONS)
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// -------------------------------------------------------------
// WHOLESALE INGREDIENT PRICES MANAGEMENT ENDPOINTS
// -------------------------------------------------------------

// 1. Get all ingredients with current & default prices
router.get('/ingredients/prices', requireAdmin, (req, res) => {
  try {
    res.json({
      success: true,
      ingredients: INGREDIENTS.map(item => ({
        ...item,
        defaultPrice: DEFAULT_INGREDIENT_PRICES[item.id] || item.price
      })),
      defaultPrices: DEFAULT_INGREDIENT_PRICES,
      chapterCupCaps: CHAPTER_CUP_PRICE_CAPS
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// 2. Update wholesale ingredient prices globally
router.put('/ingredients/prices', requireAdmin, async (req, res) => {
  try {
    const { prices } = req.body;
    if (!prices || typeof prices !== 'object') {
      return res.status(400).json({ success: false, error: 'Dữ liệu bảng giá nguyên liệu không hợp lệ!' });
    }

    const updatedList = applyIngredientPriceOverrides(prices, true);

    // Clear server caches so all stores immediately get the new ingredient prices
    if (gameCache.storeState) gameCache.storeState.clear();
    if (gameCache.staticData) gameCache.staticData.clear();

    await recordAuditLog(null, 'ADMIN_UPDATE_INGREDIENT_PRICES', prices);

    // Broadcast live sync event so connected players see updated Chợ Đầu Mối prices immediately
    liveSync.broadcast('ingredients_updated', {
      ingredients: updatedList,
      message: '🏪 Quản trị viên vừa cập nhật bảng giá nguyên liệu tại Chợ Đầu Mối!'
    });

    res.json({
      success: true,
      message: 'Đã cập nhật bảng giá nguyên liệu toàn máy chủ thành công!',
      ingredients: updatedList.map(item => ({
        ...item,
        defaultPrice: DEFAULT_INGREDIENT_PRICES[item.id] || item.price
      }))
    });
  } catch (err) {
    console.error('Admin update ingredient prices error:', err);
    res.status(500).json({ success: false, error: err.message });
  }
});

// 3. Reset wholesale ingredient prices to default
router.post('/ingredients/prices/reset', requireAdmin, async (req, res) => {
  try {
    const updatedList = resetIngredientPricesToDefault();

    if (gameCache.storeState) gameCache.storeState.clear();
    if (gameCache.staticData) gameCache.staticData.clear();

    await recordAuditLog(null, 'ADMIN_RESET_INGREDIENT_PRICES', {});

    liveSync.broadcast('ingredients_updated', {
      ingredients: updatedList,
      message: '🏪 Giá nguyên liệu tại Chợ Đầu Mối đã được khôi phục về mức mặc định!'
    });

    res.json({
      success: true,
      message: 'Đã khôi phục giá nguyên liệu về mức mặc định!',
      ingredients: updatedList.map(item => ({
        ...item,
        defaultPrice: DEFAULT_INGREDIENT_PRICES[item.id] || item.price
      }))
    });
  } catch (err) {
    console.error('Admin reset ingredient prices error:', err);
    res.status(500).json({ success: false, error: err.message });
  }
});

module.exports = router;

