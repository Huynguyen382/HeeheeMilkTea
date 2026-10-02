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

// AUTH: Register
app.post('/api/auth/register', async (req, res) => {
  try {
    const { username, password, store_name } = req.body;
    const result = await auth.register(username, password, store_name);
    if (!result.success) return res.status(400).json(result);
    res.json(result);
  } catch (err) {
    console.error('Register error:', err);
    res.status(500).json({ error: err.message });
  }
});

// AUTH: Login
app.post('/api/auth/login', async (req, res) => {
  try {
    const { account, password } = req.body;
    const result = await auth.login(account, password);
    if (!result.success) return res.status(400).json(result);
    res.json(result);
  } catch (err) {
    console.error('Login error:', err);
    res.status(500).json({ error: err.message });
  }
});

// AUTH: Logout
app.post('/api/auth/logout', authStore, async (req, res) => {
  try {
    const result = await auth.logout(req.store.id);
    res.json(result);
  } catch (err) {
    console.error('Logout error:', err);
    res.status(500).json({ error: err.message });
  }
});

// AUTH: Me
app.get('/api/auth/me', authStore, async (req, res) => {
  try {
    const state = await gameService.getStoreState(req.store.id);
    res.json({ success: true, username: req.store.username, state });
  } catch (err) {
    console.error('Auth me error:', err);
    res.status(500).json({ error: err.message });
  }
});

// 1. Legacy Quick Play (Anonymous store)
app.post('/api/store/login', async (req, res) => {
  const { store_name, store_code } = req.body;
  try {
    const state = await gameService.getOrCreateStore(store_name, store_code);
    res.json(state);
  } catch (err) {
    console.error('Login error:', err);
    res.status(500).json({ error: err.message });
  }
});

// 2. Get latest store state
app.get('/api/store/state', authStore, async (req, res) => {
  try {
    const state = await gameService.getStoreState(req.store.id);
    res.json(state);
  } catch (err) {
    console.error('Get state error:', err);
    res.status(500).json({ error: err.message });
  }
});

// 3. Request new customer order
app.get('/api/game/order', authStore, async (req, res) => {
  try {
    const order = await gameService.generateOrder(req.store.id);
    res.json({ order });
  } catch (err) {
    console.error('Generate order error:', err);
    res.status(500).json({ error: err.message });
  }
});

// 4. Complete order (Anti-cheat & Daily cap validated)
app.post('/api/game/serve', authStore, async (req, res) => {
  try {
    const { orderId, timeTaken, recipeId, sugar, ice } = req.body;
    
    if (!orderId || !timeTaken || !recipeId || !sugar || !ice) {
      return res.status(400).json({ error: 'Thiếu thông tin đơn hàng' });
    }

    const result = await anticheat.validateAndCompleteOrder(
      req.store.id,
      orderId,
      Number(timeTaken),
      recipeId,
      sugar,
      ice
    );

    res.json(result);
  } catch (err) {
    console.error('Serve order error:', err);
    res.status(500).json({ error: err.message });
  }
});

// 4.1 Snack Decision (Shipper offers street food)
app.post('/api/game/snack-decision', authStore, async (req, res) => {
  try {
    const { accept } = req.body;
    const result = await gameService.handleSnackDecision(req.store.id, !!accept);
    res.json(result);
  } catch (err) {
    console.error('Snack decision error:', err);
    res.status(500).json({ error: err.message });
  }
});

// 4.2 Order Failure / Timeout (Triggers TikToker flop review if failed)
app.post('/api/game/order-fail', authStore, async (req, res) => {
  try {
    const { orderId, isTiktoker } = req.body;
    const result = await gameService.recordOrderFailure(req.store.id, orderId, !!isTiktoker);
    res.json(result);
  } catch (err) {
    console.error('Order fail error:', err);
    res.status(500).json({ error: err.message });
  }
});

// 5. Collab with friend
app.post('/api/game/collab', authStore, async (req, res) => {
  try {
    const { friendCode } = req.body;
    if (!friendCode) {
      return res.status(400).json({ error: 'Vui lòng nhập Mã Quán bạn bè!' });
    }

    const result = await gameService.addCollab(req.store.id, friendCode);
    res.json(result);
  } catch (err) {
    console.error('Collab error:', err);
    res.status(500).json({ error: err.message });
  }
});

// 6. Pay Debt
app.post('/api/game/pay-debt', authStore, async (req, res) => {
  try {
    const { amount } = req.body;
    if (!amount || amount <= 0) {
      return res.status(400).json({ error: 'Số tiền không hợp lệ' });
    }

    const result = await gameService.payDebt(req.store.id, Number(amount));
    res.json(result);
  } catch (err) {
    console.error('Pay debt error:', err);
    res.status(500).json({ error: err.message });
  }
});

// 7. Buy Upgrade
app.post('/api/game/upgrade', authStore, async (req, res) => {
  try {
    const { upgradeId } = req.body;
    const result = await gameService.buyUpgrade(req.store.id, upgradeId);
    res.json(result);
  } catch (err) {
    console.error('Upgrade error:', err);
    res.status(500).json({ error: err.message });
  }
});

// Pet Theft & Protection Routes
app.post('/api/game/steal-pet', authStore, async (req, res) => {
  try {
    const result = await gameService.stealPet(req.store.id);
    res.json(result);
  } catch (err) {
    console.error('Steal pet error:', err);
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/game/redeem-pet', authStore, async (req, res) => {
  try {
    const result = await gameService.redeemPet(req.store.id);
    res.json(result);
  } catch (err) {
    console.error('Redeem pet error:', err);
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/game/shoo-thief', authStore, async (req, res) => {
  try {
    const result = await gameService.shooThief(req.store.id);
    res.json(result);
  } catch (err) {
    console.error('Shoo thief error:', err);
    res.status(500).json({ error: err.message });
  }
});

// Proactive TikToker Invitation to rescue rating & attract traffic
app.post('/api/game/invite-tiktoker', authStore, async (req, res) => {
  try {
    const result = await gameService.inviteTiktoker(req.store.id);
    res.json(result);
  } catch (err) {
    console.error('Invite tiktoker error:', err);
    res.status(500).json({ error: err.message });
  }
});

// 8. Advance In-Game Day
app.post('/api/game/advance-day', authStore, async (req, res) => {
  try {
    const save = await db.prepare('SELECT * FROM game_saves WHERE store_id = ?').get(req.store.id);
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

    await db.prepare(`
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
  } catch (err) {
    console.error('Advance day error:', err);
    res.status(500).json({ error: err.message });
  }
});

// 9. Anti-cheat Demonstration Trigger (Show tamper punishment)
app.post('/api/anticheat/test-tamper', authStore, async (req, res) => {
  try {
    await anticheat.jailStore(req.store.id, 'Phát hiện sửa đổi trái phép số dư tài khoản trên client!');
    res.json({
      success: true,
      isJailed: true,
      message: 'CƠ CHẾ CHỐNG GIAN LẬN ĐÃ KÍCH HOẠT!'
    });
  } catch (err) {
    console.error('Test tamper error:', err);
    res.status(500).json({ error: err.message });
  }
});

// 10. Accept Penalty / Unjail
app.post('/api/anticheat/accept-penalty', authStore, async (req, res) => {
  try {
    await anticheat.acceptPenalty(req.store.id);
    const state = await gameService.getStoreState(req.store.id);
    res.json({
      success: true,
      message: 'Đã nộp phạt cho Quản lý thị trường! Xe đẩy đã được gỡ niêm phong, chúc bạn khởi nghiệp chân chính!',
      state
    });
  } catch (err) {
    console.error('Accept penalty error:', err);
    res.status(500).json({ error: err.message });
  }
});

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', serverTime: anticheat.getRealDate(), database: db.isPostgres ? 'postgresql' : 'sqlite' });
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
