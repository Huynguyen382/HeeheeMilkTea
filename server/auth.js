const crypto = require('crypto');
const db = require('./db');
const anticheat = require('./anticheat');
const gameService = require('./game_service');

function hashPassword(password) {
  const salt = crypto.randomBytes(16).toString('hex');
  const hash = crypto.pbkdf2Sync(password, salt, 1000, 64, 'sha512').toString('hex');
  return `${salt}:${hash}`;
}

function verifyPassword(password, storedHash) {
  if (!storedHash || !storedHash.includes(':')) return false;
  const [salt, originalHash] = storedHash.split(':');
  const hash = crypto.pbkdf2Sync(password, salt, 1000, 64, 'sha512').toString('hex');
  return hash === originalHash;
}

// Register new user & store
async function register(username, password, storeName) {
  if (!username || username.trim().length < 3) {
    return { success: false, message: 'Tên đăng nhập phải có ít nhất 3 ký tự!' };
  }
  if (!password || password.length < 4) {
    return { success: false, message: 'Mật khẩu phải có ít nhất 4 ký tự!' };
  }

  const cleanUser = username.trim().toLowerCase();
  const existing = await db.prepare('SELECT id FROM stores WHERE username = ?').get(cleanUser);
  if (existing) {
    return { success: false, message: 'Tên đăng nhập này đã được sử dụng!' };
  }

  const storeCode = 'HYHY-' + crypto.randomBytes(3).toString('hex').toUpperCase();
  const token = crypto.randomBytes(16).toString('hex');
  const passHash = hashPassword(password);
  const now = new Date().toISOString();
  const finalStoreName = storeName && storeName.trim() ? storeName.trim() : `Trà Sữa ${username}`;

  const result = await db.prepare(`
    INSERT INTO stores (username, password_hash, store_code, store_name, session_token, created_at)
    VALUES (?, ?, ?, ?, ?, ?)
  `).run(cleanUser, passHash, storeCode, finalStoreName, token, now);

  const storeId = Number(result.lastInsertRowid);

  // Initialize game save for this store
  const initialSave = {
    store_id: storeId,
    chapter: 1,
    day_in_game: 1,
    money: 200000,
    debt_remaining: 3000000,
    reputation: 5.0
  };
  const hash = anticheat.generateSaveHash(initialSave);

  await db.prepare(`
    INSERT INTO game_saves (store_id, chapter, day_in_game, money, debt_remaining, reputation, recipes, save_hash, updated_at)
    VALUES (?, 1, 1, 200000, 3000000, 5.0, '["tra_sua_truyen_thong"]', ?, ?)
  `).run(storeId, hash, now);

  const state = await gameService.getStoreState(storeId);
  return {
    success: true,
    message: 'Đăng ký tiệm trà sữa thành công! Chúc mừng bạn đã chính thức khởi nghiệp.',
    session_token: token,
    state
  };
}

// Login with username or store_code and password
async function login(account, password) {
  if (!account || !password) {
    return { success: false, message: 'Vui lòng nhập đầy đủ tên đăng nhập/mã quán và mật khẩu!' };
  }

  const cleanAcc = account.trim();
  // Find either by username or by store_code
  let store = await db.prepare('SELECT * FROM stores WHERE username = ? OR store_code = ?').get(cleanAcc.toLowerCase(), cleanAcc.toUpperCase());

  if (!store) {
    return { success: false, message: 'Tài khoản hoặc Mã Quán không tồn tại!' };
  }

  if (!verifyPassword(password, store.password_hash)) {
    return { success: false, message: 'Mật khẩu không chính xác!' };
  }

  // Generate fresh session token
  const token = crypto.randomBytes(16).toString('hex');
  await db.prepare('UPDATE stores SET session_token = ? WHERE id = ?').run(token, store.id);

  const state = await gameService.getStoreState(store.id);
  state.session_token = token;

  return {
    success: true,
    message: `Chào mừng bạn quay trở lại quán [${store.store_name}]!`,
    session_token: token,
    state
  };
}

// Logout
async function logout(storeId) {
  await db.prepare('UPDATE stores SET session_token = NULL WHERE id = ?').run(storeId);
  return { success: true, message: 'Đã đăng xuất an toàn.' };
}

module.exports = {
  register,
  login,
  logout
};
