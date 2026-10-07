const crypto = require('crypto');
const db = require('../models/db');
const { DEFAULT_INVENTORY } = require('../data/ingredients');

const SECRET_KEY = process.env.HYHY_SECRET || 'hyhy_super_secret_anti_cheat_key_2026';

// Chapter configuration: Base Cap & Max Cap per real-world day (VND)
const CHAPTER_CAPS = {
  1: { base: 1200000, max: 2000000, maxCollabs: 3, collabBoost: 400000 },
  2: { base: 5000000, max: 8500000, maxCollabs: 3, collabBoost: 1166666 },
  3: { base: 1800000, max: 30000000, maxCollabs: 3, collabBoost: 3000000 },
  4: { base: 50000000, max: 80000000, maxCollabs: 3, collabBoost: 6000000 },
  5: { base: 120000000, max: 200000000, maxCollabs: 3, collabBoost: 16000000 }
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
  const teacoin = save.teacoin || 0;
  const payload = `${save.store_id}:${save.chapter}:${save.day_in_game}:${save.money}:${save.debt_remaining}:${save.reputation}:${teacoin}`;
  return crypto.createHmac('sha256', SECRET_KEY).update(payload).digest('hex');
}

// Verify save hash (supports both new teacoin hash and legacy hash)
function verifySaveHash(save, providedHash) {
  const expected = generateSaveHash(save);
  if (expected === providedHash) return true;
  const legacyPayload = `${save.store_id}:${save.chapter}:${save.day_in_game}:${save.money}:${save.debt_remaining}:${save.reputation}`;
  return crypto.createHmac('sha256', SECRET_KEY).update(legacyPayload).digest('hex') === providedHash;
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

  // Count active collabs (where store is host or friend, and status is accepted)
  const collabsCountRow = await db.prepare(`
    SELECT COUNT(*) as cnt 
    FROM collabs 
    WHERE (host_store_id = ? OR friend_store_id = ?) 
      AND status = 'accepted'
  `).get(storeId, storeId);
  const collabsCount = Math.min(collabsCountRow ? (collabsCountRow.cnt || 0) : 0, 3);

  // Daily Cap removed per user request: unlimited daily revenue!
  return {
    real_date: realDate,
    earned_today: row.earned_today,
    base_cap: null,
    effective_cap: Infinity,
    max_cap: null,
    collabs_count: collabsCount,
    max_collabs: 3,
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
async function validateAndCompleteOrder(storeId, orderId, clientTimeTaken, clientRecipeId, clientSugar, clientIce, clientToppings = [], pausedTimeMs = 0) {
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
  const safePausedTime = Math.max(0, Math.min(Number(pausedTimeMs || 0), 3600000));
  const effectiveExpiry = Number(order.expires_at) + safePausedTime + 60000;
  if (now > effectiveExpiry) {
    await db.prepare('DELETE FROM active_orders WHERE id = ?').run(orderId);
    return { success: false, message: 'Đơn hàng đã hết thời gian chờ, khách đã rời đi!' };
  }

  // 3. Check ingredient matching
  if (order.recipe_id !== clientRecipeId || order.sugar !== clientSugar || order.ice !== clientIce) {
    await db.prepare('DELETE FROM active_orders WHERE id = ?').run(orderId);
    return { success: false, message: 'Pha sai cốt trà, độ đường hoặc lượng đá! Khách càu nhàu trả lại ly.' };
  }

  // 3b. Check toppings matching
  let orderToppings = [];
  try {
    orderToppings = typeof order.toppings === 'string' ? JSON.parse(order.toppings) : (order.toppings || []);
  } catch (e) {
    orderToppings = [];
  }
  const safeClientToppings = Array.isArray(clientToppings) ? clientToppings : [];
  const sortedOrderTops = [...orderToppings].sort().join(',');
  const sortedClientTops = [...safeClientToppings].sort().join(',');

  if (sortedOrderTops !== sortedClientTops) {
    await db.prepare('DELETE FROM active_orders WHERE id = ?').run(orderId);
    return { success: false, message: 'Pha sai loại topping yêu cầu của khách! Khách càu nhàu trả lại ly.' };
  }

  // 4. Daily earnings: No limit! Full price payout + Collab revenue bonus (+10% per active partner, max 3 partners = +30%)
  const daily = await getOrCreateDailyStats(storeId, save.chapter);
  const collabRow = await db.prepare(`
    SELECT COUNT(*) as cnt 
    FROM collabs 
    WHERE (host_store_id = ? OR friend_store_id = ?) 
      AND status = 'accepted'
  `).get(storeId, storeId);
  const activeCollabs = Math.min(3, collabRow ? (collabRow.cnt || 0) : 0);
  const collabBonusPercent = activeCollabs * 10;
  const collabBonus = Math.round(order.price * (collabBonusPercent / 100));
  const payout = order.price + collabBonus;
  const isOverloadedNow = false;

  // 5. Check customer archetype effects (Tú TikToker review & Buff decrements)
  let tiktokerViral = false;
  let tiktokerGoalReached = false;
  let repGain = 0.02;
  const activeBuffs = JSON.parse(save.active_buffs || '{}');
  const isTiktokerCustomer = !!(order.customer_name && order.customer_name.includes('Tú'));
  if (isTiktokerCustomer) {
    activeBuffs.tiktoker_status = 'viral';
    tiktokerViral = true;
    repGain = 0.40; // +0.40⭐ Big review boost to rescue and pull rating up!
    const cost = activeBuffs.tiktoker_cost || 25000;
    activeBuffs.tiktoker_target = cost * 3;
    activeBuffs.tiktoker_earned = (activeBuffs.tiktoker_earned || 0) + payout;
    if (activeBuffs.tiktoker_earned >= activeBuffs.tiktoker_target) {
      tiktokerGoalReached = true;
      delete activeBuffs.tiktoker_status;
      delete activeBuffs.tiktoker_waves;
    }
  } else if (activeBuffs.tiktoker_status === 'viral') {
    activeBuffs.tiktoker_earned = (activeBuffs.tiktoker_earned || 0) + payout;
    if (activeBuffs.tiktoker_target && activeBuffs.tiktoker_earned >= activeBuffs.tiktoker_target) {
      tiktokerGoalReached = true;
      delete activeBuffs.tiktoker_status;
      delete activeBuffs.tiktoker_waves;
    }
  }
  if (activeBuffs.tip_bonus) {
    activeBuffs.tip_bonus -= 1;
    if (activeBuffs.tip_bonus <= 0) delete activeBuffs.tip_bonus;
  }
  if (activeBuffs.patience_boost) {
    activeBuffs.patience_boost -= 1;
    if (activeBuffs.patience_boost <= 0) delete activeBuffs.patience_boost;
  }

  // Update Database Transaction
  await db.prepare('DELETE FROM active_orders WHERE id = ?').run(orderId);

  // Deduct inventory ingredients used in this drink
  const currentInv = { ...DEFAULT_INVENTORY, ...JSON.parse(save.inventory || '{}') };
  const recipeTeaMap = {
    tra_sua_truyen_thong: 'tra_den',
    hong_tra_tac: 'tra_den',
    tra_thai_xanh: 'tra_thai_xanh',
    sua_tuoi_duong_den: 'sua_tuoi',
    tra_dao_cam_sa: 'tra_lai',
    tra_olong_nuong: 'tra_olong'
  };
  const teaIngId = recipeTeaMap[order.recipe_id] || 'tra_den';
  currentInv[teaIngId] = Math.max(0, (currentInv[teaIngId] || 0) - 1);

  orderToppings.forEach(topKey => {
    if (currentInv[topKey] !== undefined) {
      currentInv[topKey] = Math.max(0, currentInv[topKey] - 1);
    }
  });
  currentInv['ly_nap'] = Math.max(0, (currentInv['ly_nap'] || 0) - 1);

  // Ingredient cost estimation
  const drinkIngredientCost = 3500 + Math.max(0, orderToppings.length - 1) * 1000;

  // Update daily stats & shift stats
  try {
    await db.prepare(`
      UPDATE daily_stats 
      SET earned_today = earned_today + ?,
          orders_served = orders_served + 1,
          shift_orders = shift_orders + 1,
          shift_earned = shift_earned + ?,
          shift_ingredient_cost = shift_ingredient_cost + ?,
          is_overloaded = ?, 
          last_active_ts = ? 
      WHERE store_id = ? AND real_date = ?
    `).run(payout, payout, drinkIngredientCost, isOverloadedNow ? 1 : 0, now, storeId, daily.real_date);
  } catch (e) {
    try {
      await db.prepare(`
        UPDATE daily_stats 
        SET earned_today = earned_today + ?,
            shift_orders = shift_orders + 1,
            shift_earned = shift_earned + ?,
            shift_ingredient_cost = shift_ingredient_cost + ?,
            is_overloaded = ?, 
            last_active_ts = ? 
        WHERE store_id = ? AND real_date = ?
      `).run(payout, payout, drinkIngredientCost, isOverloadedNow ? 1 : 0, now, storeId, daily.real_date);
    } catch (e2) {
      await db.prepare(`
        UPDATE daily_stats 
        SET earned_today = earned_today + ?, 
            is_overloaded = ?, 
            last_active_ts = ? 
        WHERE store_id = ? AND real_date = ?
      `).run(payout, isOverloadedNow ? 1 : 0, now, storeId, daily.real_date);
    }
  }

  // Update daily quest progress for serving orders
  let dailyQuests = {};
  try {
    dailyQuests = JSON.parse(save.daily_quests || '{}');
  } catch (e) {}
  const currentDay = save.day_in_game || 1;
  if (!dailyQuests || dailyQuests.day !== currentDay) {
    dailyQuests = {
      day: currentDay,
      allCompletedBonusClaimed: false,
      quests: {
        quest_checkin: { progress: 1, claimed: false },
        quest_serve_5: { progress: 0, claimed: false },
        quest_variety_2: { progress: 0, recipes: [], claimed: false },
        quest_friend_gift: { progress: 0, claimed: false },
        quest_patrol_vigilant: { progress: 0, claimed: false }
      }
    };
  }
  if (!dailyQuests.quests) dailyQuests.quests = {};
  if (!dailyQuests.quests.quest_checkin) dailyQuests.quests.quest_checkin = { progress: 1, claimed: false };
  dailyQuests.quests.quest_checkin.progress = 1;

  if (!dailyQuests.quests.quest_serve_5) dailyQuests.quests.quest_serve_5 = { progress: 0, claimed: false };
  dailyQuests.quests.quest_serve_5.progress = Math.min(5, (dailyQuests.quests.quest_serve_5.progress || 0) + 1);

  if (!dailyQuests.quests.quest_variety_2) dailyQuests.quests.quest_variety_2 = { progress: 0, recipes: [], claimed: false };
  if (!Array.isArray(dailyQuests.quests.quest_variety_2.recipes)) dailyQuests.quests.quest_variety_2.recipes = [];
  if (order.recipe_id && !dailyQuests.quests.quest_variety_2.recipes.includes(order.recipe_id)) {
    dailyQuests.quests.quest_variety_2.recipes.push(order.recipe_id);
  }
  dailyQuests.quests.quest_variety_2.progress = Math.min(2, dailyQuests.quests.quest_variety_2.recipes.length);

  // Update store money, teacoin & hash
  const newMoney = save.money + payout;
  const newRep = daily.is_overloaded ? save.reputation : Math.min(5.0, Number((save.reputation + repGain).toFixed(2)));
  
  const updatedSave = {
    store_id: storeId,
    chapter: save.chapter,
    day_in_game: save.day_in_game,
    money: newMoney,
    debt_remaining: save.debt_remaining,
    reputation: newRep,
    teacoin: save.teacoin || 0
  };
  const newHash = generateSaveHash(updatedSave);

  await db.prepare(`
    UPDATE game_saves 
    SET money = ?, reputation = ?, inventory = ?, active_buffs = ?, daily_quests = ?, save_hash = ?, updated_at = ?
    WHERE store_id = ?
  `).run(newMoney, newRep, JSON.stringify(currentInv), JSON.stringify(activeBuffs), JSON.stringify(dailyQuests), newHash, new Date().toISOString(), storeId);

  return {
    success: true,
    payout,
    basePrice: order.price,
    collabBonus,
    collabBonusPercent,
    activeCollabs,
    newMoney,
    reputation: newRep,
    repGain,
    isOverloaded: isOverloadedNow,
    dailyEarned: daily.earned_today + payout,
    effectiveCap: daily.effective_cap,
    tiktokerViral,
    tiktokerGoalReached,
    message: tiktokerViral 
      ? `🎉 Tú (TikToker) khen nức nở và đăng clip triệu view! Đánh giá quán tăng vọt +${repGain}⭐, kéo bão khách nườm nượp kéo đến!`
      : (tiktokerGoalReached
          ? `🎉 Cơn sốt TikToker đã hoàn thành mục tiêu! Bạn đã thu về tổng cộng ${(activeBuffs.tiktoker_earned || 0).toLocaleString('vi-VN')}đ (gấp 3 lần vốn bỏ ra)!`
          : null),
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
