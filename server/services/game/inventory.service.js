const db = require('../../models/db');
const anticheat = require('../anticheat.service');
const { invalidateStoreCache } = require('./cache.helper');
const { INGREDIENTS, DEFAULT_INVENTORY } = require('../../data/ingredients');
const { LOCATIONS } = require('../../data/locations');

// Buy ingredients from Wholesale Market
async function buyIngredients(storeId, items) {
  if (!items || !Array.isArray(items) || items.length === 0) {
    return { success: false, message: 'Danh sách nhập hàng trống!' };
  }

  const save = await db.prepare('SELECT * FROM game_saves WHERE store_id = ?').get(storeId);
  if (!save) return { success: false, message: 'Cửa hàng không tồn tại' };

  let totalCost = 0;
  const currentInv = { ...DEFAULT_INVENTORY, ...JSON.parse(save.inventory || '{}') };

  for (const item of items) {
    const ing = INGREDIENTS.find(i => i.id === item.id);
    if (!ing) return { success: false, message: `Không tìm thấy nguyên liệu: ${item.id}` };
    const qty = parseInt(item.quantity, 10);
    if (isNaN(qty) || qty <= 0) return { success: false, message: 'Số lượng mua không hợp lệ' };
    totalCost += ing.price * qty;
    currentInv[item.id] = (currentInv[item.id] || 0) + qty;
  }

  if (save.money < totalCost) {
    return {
      success: false,
      message: `Quán không đủ tiền nhập hàng! Cần ${totalCost.toLocaleString('vi-VN')}đ, hiện có ${save.money.toLocaleString('vi-VN')}đ.`
    };
  }

  const newMoney = save.money - totalCost;
  const updatedSave = {
    store_id: storeId,
    chapter: save.chapter,
    day_in_game: save.day_in_game,
    money: newMoney,
    debt_remaining: save.debt_remaining,
    reputation: save.reputation
  };
  const hash = anticheat.generateSaveHash(updatedSave);

  await db.prepare(`
    UPDATE game_saves 
    SET money = ?, inventory = ?, save_hash = ?, updated_at = ?
    WHERE store_id = ?
  `).run(newMoney, JSON.stringify(currentInv), hash, new Date().toISOString(), storeId);

  invalidateStoreCache(storeId);

  return {
    success: true,
    newMoney,
    inventory: currentInv,
    totalCost,
    message: `🎉 Nhập sỉ thành công! Đã thanh toán -${totalCost.toLocaleString('vi-VN')}đ tiền nguyên liệu.`
  };
}

// End of Shift (Kết ca - Trừ chi phí mặt bằng và báo cáo tài chính)
async function endShift(storeId) {
  const save = await db.prepare('SELECT * FROM game_saves WHERE store_id = ?').get(storeId);
  if (!save) return { success: false, message: 'Cửa hàng không tồn tại' };

  const daily = await anticheat.getOrCreateDailyStats(storeId, save.chapter);
  const nextDay = save.day_in_game + 1;

  // Chi phí mặt bằng theo chương hoặc vị trí bất động sản
  let rentCost = save.chapter === 1 ? 20000 : 80000;
  try {
    const properties = JSON.parse(save.properties || '{}');
    const locId = properties.current_location || 'que';
    if (LOCATIONS[locId] && LOCATIONS[locId].rentCost) {
      rentCost = LOCATIONS[locId].rentCost;
    }
  } catch (e) {}

  const ordersServed = daily.shift_orders || daily.orders_served || 0;
  const grossRevenue = daily.shift_earned || daily.earned_today || 0;
  const ingredientCost = daily.shift_ingredient_cost || 0;
  const tips = daily.shift_tips || 0;
  const totalCosts = rentCost + ingredientCost;
  const netProfit = grossRevenue - totalCosts;

  const newMoney = Math.max(0, save.money - rentCost);

  const restDurationMs = 2 * 60 * 1000; // 2 phút nghỉ ngơi sau một ngày làm việc
  const restUntilTs = Date.now() + restDurationMs;

  const activeBuffs = JSON.parse(save.active_buffs || '{}');
  activeBuffs.tiktoker_daily = {
    day: nextDay,
    count: 0,
    nextCost: 25000
  };
  activeBuffs.rest_reason = 'end_shift';
  activeBuffs.rest_until = restUntilTs;

  const updatedSave = {
    store_id: storeId,
    chapter: save.chapter,
    day_in_game: nextDay,
    money: newMoney,
    debt_remaining: save.debt_remaining,
    reputation: save.reputation
  };
  const hash = anticheat.generateSaveHash(updatedSave);

  await db.prepare(`
    UPDATE game_saves 
    SET day_in_game = ?, money = ?, active_buffs = ?, rest_until_ts = ?, save_hash = ?, updated_at = ?
    WHERE store_id = ?
  `).run(nextDay, newMoney, JSON.stringify(activeBuffs), restUntilTs, hash, new Date().toISOString(), storeId);

  invalidateStoreCache(storeId);

  // Clear any existing active orders so store closes cleanly for the night
  try {
    await db.prepare('DELETE FROM active_orders WHERE store_id = ?').run(storeId);
  } catch (e) {}

  // Reset shift counters for the new day
  try {
    await db.prepare(`
      UPDATE daily_stats 
      SET shift_orders = 0, shift_earned = 0, shift_ingredient_cost = 0, shift_tips = 0
      WHERE store_id = ? AND real_date = ?
    `).run(storeId, daily.real_date);
  } catch (e) {}

  return {
    success: true,
    previousDay: save.day_in_game,
    day_in_game: nextDay,
    ordersServed,
    grossRevenue,
    rentCost,
    ingredientCost,
    tips,
    totalCosts,
    netProfit,
    newMoney,
    resting: true,
    restUntil: restUntilTs,
    restReason: 'end_shift',
    restDurationSeconds: 120,
    message: `🎉 Kết ca Ngày ${save.day_in_game} thành công! Lợi nhuận ròng: ${netProfit >= 0 ? '+' : ''}${netProfit.toLocaleString('vi-VN')}đ. HeeHee đang nghỉ ngơi 2 phút sau một ngày làm việc mệt mỏi trước khi bắt đầu Ngày ${nextDay}!`
  };
}

// Spend 200,000 VND to immediately escape resting state
async function skipRest(storeId) {
  const save = await db.prepare('SELECT * FROM game_saves WHERE store_id = ?').get(storeId);
  if (!save) return { success: false, message: 'Cửa hàng không tồn tại' };

  const skipCost = 200000;
  if (save.money < skipCost) {
    return {
      success: false,
      message: `Bạn không đủ tiền! Cần ${skipCost.toLocaleString('vi-VN')}đ để thức dậy ngay (Hiện có: ${save.money.toLocaleString('vi-VN')}đ).`
    };
  }

  const newMoney = Math.max(0, save.money - skipCost);
  const activeBuffs = JSON.parse(save.active_buffs || '{}');
  delete activeBuffs.rest_reason;
  delete activeBuffs.rest_until;

  const updatedSave = {
    store_id: storeId,
    chapter: save.chapter,
    day_in_game: save.day_in_game,
    money: newMoney,
    debt_remaining: save.debt_remaining,
    reputation: save.reputation
  };
  const hash = anticheat.generateSaveHash(updatedSave);

  await db.prepare(`
    UPDATE game_saves 
    SET money = ?, rest_until_ts = 0, active_buffs = ?, save_hash = ?, updated_at = ?
    WHERE store_id = ?
  `).run(newMoney, JSON.stringify(activeBuffs), hash, new Date().toISOString(), storeId);

  invalidateStoreCache(storeId);

  return {
    success: true,
    message: 'Đã bỏ ra 200.000đ để thức dậy ngay! Quán sẵn sàng mở cửa lúc 7h sáng!',
    money: newMoney,
    costPaid: skipCost,
    rest_until_ts: 0
  };
}

module.exports = {
  buyIngredients,
  endShift,
  skipRest
};
