const crypto = require('crypto');
const db = require('./db');

const SECRET_KEY = process.env.HYHY_SECRET || 'hyhy_super_secret_anti_cheat_key_2026';

// Chapter configuration: Base Cap & Max Cap per real-world day (VND)
const CHAPTER_CAPS = {
  1: { base: 1200000, max: 2000000, maxCollabs: 2, collabBoost: 400000 },
  2: { base: 5000000, max: 8500000, maxCollabs: 3, collabBoost: 1166666 },
  3: { base: 1800000, max: 30000000, maxCollabs: 4, collabBoost: 3000000 },
  4: { base: 50000000, max: 80000000, maxCollabs: 5, collabBoost: 6000000 },
  5: { base: 120000000, max: 200000000, maxCollabs: 5, collabBoost: 16000000 }
};

// Get current server real-world date in VN timezone (GMT+7)
function getRealDate() {
  const d = new Date();
  const utc = d.getTime() + (d.getTimezoneOffset() * 60000);
  const vnTime = new Date(utc + (3600000 * 7));
  return vnTime.toISOString().slice(0, 10);
}

// Generate HMAC for save state to prevent client-side save file tampering
function generateSaveHash(save) {
  const payload = `${save.store_id}:${save.chapter}:${save.day_in_game}:${save.money}:${save.debt_remaining}:${save.reputation}`;
  return crypto.createHmac('sha256', SECRET_KEY).update(payload).digest('hex');
}

// Verify save hash
function verifySaveHash(save, providedHash) {
  const expected = generateSaveHash(save);
  return expected === providedHash;
}

// Get or initialize daily stats for a store
async function getOrCreateDailyStats(storeId, chapter) {
  const realDate = getRealDate();
  const capInfo = CHAPTER_CAPS[chapter] || CHAPTER_CAPS[1];

  let row = await db.prepare('SELECT * FROM daily_stats WHERE store_id = ? AND real_date = ?').get(storeId, realDate);
  if (!row) {
    await db.prepare(`
      INSERT INTO daily_stats (store_id, real_date, earned_today, collab_count, is_overloaded, last_active_ts)
      VALUES (?, ?, 0, 0, 0, ?)
    `).run(storeId, realDate, Date.now());

    row = await db.prepare('SELECT * FROM daily_stats WHERE store_id = ? AND real_date = ?').get(storeId, realDate);
  }

  // Count active collabs for today
  const collabsCountRow = await db.prepare(`
    SELECT COUNT(*) as cnt FROM collabs WHERE host_store_id = ? AND collab_date = ?
  `).get(storeId, realDate);
  const collabsCount = Math.min(collabsCountRow ? collabsCountRow.cnt : 0, capInfo.maxCollabs);

  // Daily Cap removed per user request: unlimited daily revenue!
  return {
    real_date: realDate,
    earned_today: row.earned_today,
    base_cap: null,
    effective_cap: Infinity,
    max_cap: null,
    collabs_count: collabsCount,
    max_collabs: capInfo.maxCollabs,
    is_overloaded: false,
    remaining_today: Infinity
  };
}

// Punish cheater (Jail / Market Management seizure)
async function jailStore(storeId, reason) {
  console.warn(`[ANTI-CHEAT TRIGGERED] Store ${storeId} jailed for: ${reason}`);
  await db.prepare(`
    UPDATE game_saves 
    SET is_jailed = 1, jail_reason = ?, reputation = 1.0
    WHERE store_id = ?
  `).run(reason, storeId);

  await db.prepare(`
    INSERT INTO audit_logs (store_id, event_type, detail, logged_at)
    VALUES (?, 'JAILED', ?, ?)
  `).run(storeId, reason, new Date().toISOString());
}

// Accept penalty: release store from jail and deduct 50,000,000 fine
async function acceptPenalty(storeId) {
  console.log(`[ANTI-CHEAT] Store ${storeId} accepted penalty (-50.000.000đ fine).`);
  const save = await db.prepare('SELECT * FROM game_saves WHERE store_id = ?').get(storeId);
  const currentMoney = save ? save.money : 0;
  const newMoney = currentMoney - 50000000; // Phạt trừ 50 triệu đồng
  const newRep = 1.0;

  const updatedSave = {
    store_id: storeId,
    chapter: 1,
    day_in_game: 1,
    money: newMoney,
    debt_remaining: 3000000,
    reputation: newRep,
    upgrades: '{}',
    recipes: save ? save.recipes : '["tra_sua_truyen_thong"]',
    inventory: '{"tea":10,"milk":10,"pearls":10,"cups":10}'
  };
  const hash = generateSaveHash(updatedSave);

  await db.prepare(`
    UPDATE game_saves 
    SET is_jailed = 0, jail_reason = NULL,
        chapter = 1, day_in_game = 1, money = ?, debt_remaining = 3000000, 
        reputation = ?, inventory = '{"tea":10,"milk":10,"pearls":10,"cups":10}',
        upgrades = '{}', save_hash = ?
    WHERE store_id = ?
  `).run(newMoney, newRep, hash, storeId);

  // Clear any pending active orders for this store
  await db.prepare('DELETE FROM active_orders WHERE store_id = ?').run(storeId);

  await db.prepare(`
    INSERT INTO audit_logs (store_id, event_type, detail, logged_at)
    VALUES (?, 'PENALTY_ACCEPTED', 'Chủ quán chấp nhận phạt: Bị trừ 50.000.000đ và mở niêm phong xe đẩy', ?)
  `).run(storeId, new Date().toISOString());

  return await db.prepare('SELECT * FROM game_saves WHERE store_id = ?').get(storeId);
}

// Validate order completion against anti-cheat rules
async function validateAndCompleteOrder(storeId, orderId, clientTimeTaken, clientRecipeId, clientSugar, clientIce) {
  const save = await db.prepare('SELECT * FROM game_saves WHERE store_id = ?').get(storeId);
  if (!save) return { success: false, message: 'Cửa hàng không tồn tại' };

  if (save.is_jailed === 1) {
    return { success: false, isJailed: true, jailReason: save.jail_reason };
  }

  // 1. Minimum physical time check (cannot prepare drink under 1000ms unless high automation)
  if (clientTimeTaken < 800) {
    await jailStore(storeId, 'Tốc độ pha chế bất thường (Speed-hack / Auto clicker: dưới 0.8s)');
    return { success: false, isJailed: true, jailReason: 'Gian lận tốc độ pha chế siêu nhân' };
  }

  // 2. Fetch order from active_orders table
  const order = await db.prepare('SELECT * FROM active_orders WHERE id = ? AND store_id = ?').get(orderId, storeId);
  if (!order) {
    return { success: false, message: 'Đơn hàng không hợp lệ hoặc đã giao trước đó' };
  }

  const now = Date.now();
  if (now > order.expires_at) {
    await db.prepare('DELETE FROM active_orders WHERE id = ?').run(orderId);
    return { success: false, message: 'Đơn hàng đã hết thời gian chờ, khách đã rời đi!' };
  }

  // 3. Check ingredient matching
  if (order.recipe_id !== clientRecipeId || order.sugar !== clientSugar || order.ice !== clientIce) {
    await db.prepare('DELETE FROM active_orders WHERE id = ?').run(orderId);
    return { success: false, message: 'Pha sai công thức, độ đường hoặc lượng đá! Khách càu nhàu trả lại ly.' };
  }

  // 4. Daily earnings: No limit! Full price payout every order
  const daily = await getOrCreateDailyStats(storeId, save.chapter);
  const payout = order.price;
  const isOverloadedNow = false;

  // 5. Check customer archetype effects (Tú TikToker review & Buff decrements)
  let tiktokerViral = false;
  let repGain = 0.02;
  const activeBuffs = JSON.parse(save.active_buffs || '{}');
  const isTiktokerCustomer = !!(order.customer_name && order.customer_name.includes('Tú'));
  if (isTiktokerCustomer) {
    activeBuffs.tiktoker_status = 'viral';
    activeBuffs.tiktoker_waves = 8; // 8 waves of high viral traffic
    tiktokerViral = true;
    repGain = 0.40; // +0.40⭐ Big review boost to rescue and pull rating up!
  }
  if (activeBuffs.tip_bonus) {
    activeBuffs.tip_bonus -= 1;
    if (activeBuffs.tip_bonus <= 0) delete activeBuffs.tip_bonus;
  }
  if (activeBuffs.patience_boost) {
    activeBuffs.patience_boost -= 1;
    if (activeBuffs.patience_boost <= 0) delete activeBuffs.patience_boost;
  }

  // Deduct inventory ingredients
  const { DEFAULT_INVENTORY } = require('./data/ingredients');
  const RECIPE_TEA_MAP = {
    tra_sua_truyen_thong: 'tra_den',
    hong_tra_tac: 'tra_den',
    tra_thai_xanh: 'tra_thai_xanh',
    sua_tuoi_duong_den: 'sua_tuoi',
    tra_dao_cam_sa: 'tra_lai',
    tra_olong_nuong: 'tra_olong'
  };

  const currentInv = { ...DEFAULT_INVENTORY, ...JSON.parse(save.inventory || '{}') };
  const teaInvKey = RECIPE_TEA_MAP[order.recipe_id] || 'tra_den';
  if (currentInv[teaInvKey] !== undefined) {
    currentInv[teaInvKey] = Math.max(0, (currentInv[teaInvKey] || 0) - 1);
  }
  let orderToppings = [];
  try {
    orderToppings = typeof order.toppings === 'string' ? JSON.parse(order.toppings) : (order.toppings || []);
  } catch (e) {
    orderToppings = [];
  }
  if (Array.isArray(orderToppings)) {
    orderToppings.forEach(top => {
      if (currentInv[top] !== undefined) {
        currentInv[top] = Math.max(0, (currentInv[top] || 0) - 1);
      }
    });
  }
  if (currentInv['ly_nap'] !== undefined) {
    currentInv['ly_nap'] = Math.max(0, (currentInv['ly_nap'] || 0) - 1);
  }

  // Update Database Transaction
  await db.prepare('DELETE FROM active_orders WHERE id = ?').run(orderId);

  // Update daily stats
  await db.prepare(`
    UPDATE daily_stats 
    SET earned_today = earned_today + ?, 
        is_overloaded = ?, 
        last_active_ts = ? 
    WHERE store_id = ? AND real_date = ?
  `).run(payout, isOverloadedNow ? 1 : 0, now, storeId, daily.real_date);

  // Update store money & hash
  const newMoney = save.money + payout;
  const newRep = daily.is_overloaded ? save.reputation : Math.min(5.0, Number((save.reputation + repGain).toFixed(2)));
  
  const updatedSave = {
    store_id: storeId,
    chapter: save.chapter,
    day_in_game: save.day_in_game,
    money: newMoney,
    debt_remaining: save.debt_remaining,
    reputation: newRep
  };
  const newHash = generateSaveHash(updatedSave);

  await db.prepare(`
    UPDATE game_saves 
    SET money = ?, reputation = ?, inventory = ?, active_buffs = ?, save_hash = ?, updated_at = ?
    WHERE store_id = ?
  `).run(newMoney, newRep, JSON.stringify(currentInv), JSON.stringify(activeBuffs), newHash, new Date().toISOString(), storeId);

  return {
    success: true,
    payout,
    newMoney,
    inventory: currentInv,
    reputation: newRep,
    repGain,
    isOverloaded: isOverloadedNow,
    dailyEarned: daily.earned_today + payout,
    effectiveCap: daily.effective_cap,
    tiktokerViral,
    message: tiktokerViral 
      ? `🎉 Tú (TikToker) khen nức nở và đăng clip triệu view! Đánh giá quán tăng vọt +${repGain}⭐, kéo bão khách nườm nượp kéo đến!`
      : null,
    activeBuffs
  };
}

module.exports = {
  CHAPTER_CAPS,
  getRealDate,
  generateSaveHash,
  verifySaveHash,
  getOrCreateDailyStats,
  jailStore,
  acceptPenalty,
  validateAndCompleteOrder
};
