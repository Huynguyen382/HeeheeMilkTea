const express = require('express');
const path = require('path');
const db = require('./db');
const anticheat = require('./anticheat');
const gameService = require('./game_service');
const auth = require('./auth');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());
app.use(express.static(path.join(__dirname, '..', 'public')));

// Middleware to authenticate store session
function authStore(req, res, next) {
  const token = req.headers['x-session-token'];
  if (!token) {
    return res.status(401).json({ error: 'Chưa đăng nhập tiệm trà sữa!' });
  }

  const store = db.prepare('SELECT * FROM stores WHERE session_token = ?').get(token);
  if (!store) {
    return res.status(401).json({ error: 'Phiên làm việc không hợp lệ hoặc đã hết hạn!' });
  }

  req.store = store;
  next();
}

// AUTH: Register
app.post('/api/auth/register', (req, res) => {
  const { username, password, store_name } = req.body;
  const result = auth.register(username, password, store_name);
  if (!result.success) return res.status(400).json(result);
  res.json(result);
});

// AUTH: Login
app.post('/api/auth/login', (req, res) => {
  const { account, password } = req.body;
  const result = auth.login(account, password);
  if (!result.success) return res.status(400).json(result);
  res.json(result);
});

// AUTH: Logout
app.post('/api/auth/logout', authStore, (req, res) => {
  const result = auth.logout(req.store.id);
  res.json(result);
});

// AUTH: Me
app.get('/api/auth/me', authStore, (req, res) => {
  const state = gameService.getStoreState(req.store.id);
  res.json({ success: true, username: req.store.username, state });
});

// 1. Legacy Quick Play (Anonymous store)
app.post('/api/store/login', (req, res) => {
  const { store_name, store_code } = req.body;
  try {
    const state = gameService.getOrCreateStore(store_name, store_code);
    res.json(state);
  } catch (err) {
    console.error('Login error:', err);
    res.status(500).json({ error: err.message });
  }
});

// 2. Get latest store state
app.get('/api/store/state', authStore, (req, res) => {
  const state = gameService.getStoreState(req.store.id);
  res.json(state);
});

// 3. Request new customer order
app.get('/api/game/order', authStore, (req, res) => {
  const order = gameService.generateOrder(req.store.id);
  res.json({ order });
});

// 4. Complete order (Anti-cheat & Daily cap validated)
app.post('/api/game/serve', authStore, (req, res) => {
  const { orderId, timeTaken, recipeId, sugar, ice } = req.body;
  
  if (!orderId || !timeTaken || !recipeId || !sugar || !ice) {
    return res.status(400).json({ error: 'Thiếu thông tin đơn hàng' });
  }

  const result = anticheat.validateAndCompleteOrder(
    req.store.id,
    orderId,
    Number(timeTaken),
    recipeId,
    sugar,
    ice
  );

  res.json(result);
});

// 4.1 Snack Decision (Shipper offers street food)
app.post('/api/game/snack-decision', authStore, (req, res) => {
  const { accept } = req.body;
  const result = gameService.handleSnackDecision(req.store.id, !!accept);
  res.json(result);
});

// 4.2 Order Failure / Timeout (Triggers TikToker flop review if failed)
app.post('/api/game/order-fail', authStore, (req, res) => {
  const { orderId, isTiktoker } = req.body;
  const result = gameService.recordOrderFailure(req.store.id, orderId, !!isTiktoker);
  res.json(result);
});

// 5. Collab with friend
app.post('/api/game/collab', authStore, (req, res) => {
  const { friendCode } = req.body;
  if (!friendCode) {
    return res.status(400).json({ error: 'Vui lòng nhập Mã Quán bạn bè!' });
  }

  const result = gameService.addCollab(req.store.id, friendCode);
  res.json(result);
});

// 6. Pay Debt
app.post('/api/game/pay-debt', authStore, (req, res) => {
  const { amount } = req.body;
  if (!amount || amount <= 0) {
    return res.status(400).json({ error: 'Số tiền không hợp lệ' });
  }

  const result = gameService.payDebt(req.store.id, Number(amount));
  res.json(result);
});

// 7. Buy Upgrade
app.post('/api/game/upgrade', authStore, (req, res) => {
  const { upgradeId } = req.body;
  const result = gameService.buyUpgrade(req.store.id, upgradeId);
  res.json(result);
});

// Pet Theft & Protection Routes
app.post('/api/game/steal-pet', authStore, (req, res) => {
  const result = gameService.stealPet(req.store.id);
  res.json(result);
});

app.post('/api/game/redeem-pet', authStore, (req, res) => {
  const result = gameService.redeemPet(req.store.id);
  res.json(result);
});

app.post('/api/game/shoo-thief', authStore, (req, res) => {
  const result = gameService.shooThief(req.store.id);
  res.json(result);
});

// Proactive TikToker Invitation to rescue rating & attract traffic
app.post('/api/game/invite-tiktoker', authStore, (req, res) => {
  const result = gameService.inviteTiktoker(req.store.id);
  res.json(result);
});

// 8. Advance In-Game Day
app.post('/api/game/advance-day', authStore, (req, res) => {
  const save = db.prepare('SELECT * FROM game_saves WHERE store_id = ?').get(req.store.id);
  const nextDay = save.day_in_game + 1;

  // Small daily rent/maintenance cost
  const rentCost = save.chapter === 1 ? 20000 : 80000;
  const newMoney = Math.max(0, save.money - rentCost);

  const updatedSave = {
    store_id: req.store.id,
    chapter: save.chapter,
    day_in_game: nextDay,
    money: newMoney,
    debt_remaining: save.debt_remaining,
    reputation: save.reputation
  };
  const hash = anticheat.generateSaveHash(updatedSave);

  db.prepare(`
    UPDATE game_saves 
    SET day_in_game = ?, money = ?, save_hash = ?, updated_at = ?
    WHERE store_id = ?
  `).run(nextDay, newMoney, hash, new Date().toISOString(), req.store.id);

  res.json({
    success: true,
    day_in_game: nextDay,
    rentCost,
    newMoney,
    message: `Bắt đầu Ngày ${nextDay} trong game! Tiền mặt bằng xe đẩy hôm nay: -${rentCost.toLocaleString('vi-VN')}đ.`
  });
});

// 9. Anti-cheat Demonstration Trigger (Show tamper punishment)
app.post('/api/anticheat/test-tamper', authStore, (req, res) => {
  anticheat.jailStore(req.store.id, 'Phát hiện sửa đổi trái phép số dư tài khoản trên client!');
  res.json({
    success: true,
    isJailed: true,
    message: 'CƠ CHẾ CHỐNG GIAN LẬN ĐÃ KÍCH HOẠT!'
  });
});

// 10. Accept Penalty / Unjail
app.post('/api/anticheat/accept-penalty', authStore, (req, res) => {
  anticheat.acceptPenalty(req.store.id);
  const state = gameService.getStoreState(req.store.id);
  res.json({
    success: true,
    message: 'Đã nộp phạt cho Quản lý thị trường! Xe đẩy đã được gỡ niêm phong, chúc bạn khởi nghiệp chân chính!',
    state
  });
});

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', serverTime: anticheat.getRealDate() });
});

app.listen(PORT, () => {
  console.log(`===============================================`);
  console.log(`  TIỆM TRÀ SỮA HEEHEE SERVER IS RUNNING!       `);
  console.log(`  URL: http://localhost:${PORT}                `);
  console.log(`  Real Date Enforced: ${anticheat.getRealDate()} `);
  console.log(`===============================================`);
});
