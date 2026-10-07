const db = require('../../models/db');
const anticheat = require('../anticheat.service');
const { invalidateStoreCache } = require('./cache.helper');
const { UPGRADES } = require('./constants');
const { updateDailyQuestProgress } = require('./quest.service');

async function buyUpgrade(storeId, upgradeId) {
  const item = UPGRADES[upgradeId];
  if (!item) return { success: false, message: 'Vật phẩm không tồn tại' };

  const save = await db.prepare('SELECT * FROM game_saves WHERE store_id = ?').get(storeId);
  if (!save) return { success: false, message: 'Cửa hàng không tồn tại' };

  const upgrades = JSON.parse(save.upgrades || '{}');
  let recipes = JSON.parse(save.recipes || '["tra_sua_truyen_thong"]');

  // XỬ LÝ RIÊNG CHO BÙA ẨN THÂN (Vật phẩm tiêu hao, sức chứa tối đa 3 tấm)
  if (upgradeId === 'bua_an_than') {
    let talismanCount = typeof upgrades.bua_an_than === 'number'
      ? upgrades.bua_an_than
      : (upgrades.bua_an_than ? 1 : 0);

    if (talismanCount >= 3) {
      return {
        success: false,
        message: 'Đã đạt sức chứa tối đa (3/3 tấm Bùa Ẩn Thân)! Bạn chỉ có thể mua thêm khi số lượng < 3.'
      };
    }

    if (save.money < item.cost) {
      return { success: false, message: `Không đủ tiền! Cần ${item.cost.toLocaleString('vi-VN')}đ để mua Bùa Ẩn Thân.` };
    }

    talismanCount += 1;
    upgrades.bua_an_than = talismanCount;

    const newMoney = save.money - item.cost;
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
      SET money = ?, upgrades = ?, save_hash = ?, updated_at = ?
      WHERE store_id = ?
    `).run(newMoney, JSON.stringify(upgrades), hash, new Date().toISOString(), storeId);

    invalidateStoreCache(storeId);

    return {
      success: true,
      money: newMoney,
      upgrades,
      recipes,
      talismanCount,
      message: `🔮 Mua thành công 1 tấm Bùa Ẩn Thân! Hiện có: ${talismanCount}/3 tấm trong túi.`
    };
  }

  if (upgrades[upgradeId] || (item.type === 'recipe' && recipes.includes(item.recipeId))) {
    return { success: false, message: 'Đã sở hữu nâng cấp/công thức này rồi!' };
  }

  if (save.money < item.cost) {
    return { success: false, message: 'Không đủ tiền mua nâng cấp này!' };
  }

  upgrades[upgradeId] = true;
  if (item.type === 'pet') {
    upgrades.active_pet = item.petId;
    upgrades.is_pet_stolen = false;
  } else if (item.type === 'recipe') {
    if (!recipes.includes(item.recipeId)) {
      recipes.push(item.recipeId);
    }
  }

  const newMoney = save.money - item.cost;
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
    SET money = ?, upgrades = ?, recipes = ?, save_hash = ?, updated_at = ?
    WHERE store_id = ?
  `).run(newMoney, JSON.stringify(upgrades), JSON.stringify(recipes), hash, new Date().toISOString(), storeId);

  invalidateStoreCache(storeId);

  return {
    success: true,
    money: newMoney,
    upgrades,
    recipes,
    message: item.type === 'recipe' 
      ? `🎉 Mở khóa thành công [${item.name}]! Khách hàng bắt đầu có thể order món này!` 
      : `Đã trang bị thành công [${item.name}]!`
  };
}

async function useTalisman(storeId) {
  const save = await db.prepare('SELECT * FROM game_saves WHERE store_id = ?').get(storeId);
  if (!save) return { success: false, message: 'Cửa hàng không tồn tại' };

  const upgrades = JSON.parse(save.upgrades || '{}');
  let talismanCount = typeof upgrades.bua_an_than === 'number'
    ? upgrades.bua_an_than
    : (upgrades.bua_an_than ? 1 : 0);

  if (talismanCount <= 0) {
    return {
      success: false,
      message: 'Bạn đã hết Bùa Ẩn Thân! Hãy vào Cửa Hàng Nâng Cấp để mua thêm (tối đa 3 tấm).'
    };
  }

  talismanCount -= 1;
  upgrades.bua_an_than = talismanCount;

  const updatedSave = {
    store_id: storeId,
    chapter: save.chapter,
    day_in_game: save.day_in_game,
    money: save.money,
    debt_remaining: save.debt_remaining,
    reputation: save.reputation
  };
  const hash = anticheat.generateSaveHash(updatedSave);

  await db.prepare(`
    UPDATE game_saves 
    SET upgrades = ?, save_hash = ?, updated_at = ?
    WHERE store_id = ?
  `).run(JSON.stringify(upgrades), hash, new Date().toISOString(), storeId);

  try { await updateDailyQuestProgress(storeId, 'vigilant'); } catch (e) {}
  invalidateStoreCache(storeId);

  return {
    success: true,
    talismanCount,
    upgrades,
    message: `🔮 Đã kích hoạt 1 Bùa Ẩn Thân! Tàng hình cả quán tối đa 60s (Còn lại: ${talismanCount}/3 tấm).`
  };
}

async function stealPet(storeId) {
  const save = await db.prepare('SELECT * FROM game_saves WHERE store_id = ?').get(storeId);
  if (!save) return { success: false, message: 'Cửa hàng không tồn tại' };

  const upgrades = JSON.parse(save.upgrades || '{}');
  if (!upgrades.active_pet || upgrades.is_pet_stolen) {
    return { success: false, message: 'Không có thú cưng để bắt cóc' };
  }

  upgrades.is_pet_stolen = true;
  upgrades.stolen_at = Date.now();
  
  const petKey = upgrades.active_pet;
  const petItem = Object.values(UPGRADES).find(u => u.type === 'pet' && (u.petId === petKey || u.id === petKey));
  const petCost = petItem ? petItem.cost : 1800000;
  const ransomCost = Math.floor(petCost * 0.5);
  upgrades.ransom_cost = ransomCost;

  const updatedSave = {
    store_id: storeId,
    chapter: save.chapter,
    day_in_game: save.day_in_game,
    money: save.money,
    debt_remaining: save.debt_remaining,
    reputation: Math.max(1.0, Number((save.reputation - 0.2).toFixed(1)))
  };
  const hash = anticheat.generateSaveHash(updatedSave);

  await db.prepare(`
    UPDATE game_saves 
    SET reputation = ?, upgrades = ?, save_hash = ?, updated_at = ?
    WHERE store_id = ?
  `).run(updatedSave.reputation, JSON.stringify(upgrades), hash, new Date().toISOString(), storeId);

  await db.prepare(`
    INSERT INTO audit_logs (store_id, event_type, detail, logged_at)
    VALUES (?, 'PET_STOLEN', 'Kẻ trộm đồ đen đeo khẩu trang đã câu trộm mất thú cưng khi quán đông khách!', ?)
  `).run(storeId, new Date().toISOString());

  return {
    success: true,
    petId: upgrades.active_pet,
    ransomCost,
    upgrades,
    reputation: updatedSave.reputation,
    message: `🚨 Ôi không! Kẻ trộm đồ đen đã bắt cóc mất thú cưng! Tiền chuộc là ${ransomCost.toLocaleString('vi-VN')}đ (50% giá trị thú cưng)!`
  };
}

async function redeemPet(storeId) {
  const save = await db.prepare('SELECT * FROM game_saves WHERE store_id = ?').get(storeId);
  if (!save) return { success: false, message: 'Cửa hàng không tồn tại' };

  const upgrades = JSON.parse(save.upgrades || '{}');
  if (!upgrades.is_pet_stolen) {
    return { success: false, message: 'Thú cưng không bị bắt cóc!' };
  }

  const petKey = upgrades.active_pet;
  const petItem = Object.values(UPGRADES).find(u => u.type === 'pet' && (u.petId === petKey || u.id === petKey));
  const petCost = petItem ? petItem.cost : 1800000;
  const defaultRansom = Math.floor(petCost * 0.5);
  const ransom = upgrades.ransom_cost || defaultRansom;

  if (save.money < ransom) {
    return { success: false, message: `Không đủ tiền chuộc thú cưng (${ransom.toLocaleString('vi-VN')}đ - 50% giá trị)! Hãy bán thêm trà sữa nhé!` };
  }

  upgrades.is_pet_stolen = false;
  const newMoney = save.money - ransom;

  const updatedSave = {
    store_id: storeId,
    chapter: save.chapter,
    day_in_game: save.day_in_game,
    money: newMoney,
    debt_remaining: save.debt_remaining,
    reputation: Math.min(5.0, Number((save.reputation + 0.1).toFixed(1)))
  };
  const hash = anticheat.generateSaveHash(updatedSave);

  await db.prepare(`
    UPDATE game_saves 
    SET money = ?, reputation = ?, upgrades = ?, save_hash = ?, updated_at = ?
    WHERE store_id = ?
  `).run(newMoney, updatedSave.reputation, JSON.stringify(upgrades), hash, new Date().toISOString(), storeId);

  await db.prepare(`
    INSERT INTO audit_logs (store_id, event_type, detail, logged_at)
    VALUES (?, 'PET_REDEEMED', 'Chủ quán đã chi tiền chuộc thú cưng trở về an toàn', ?)
  `).run(storeId, new Date().toISOString());

  return {
    success: true,
    money: newMoney,
    upgrades,
    message: '🎉 Bé thú cưng đã trở về an toàn bên cạnh quầy trà sữa! Bé mừng rỡ vẫy đuôi rối rít!'
  };
}

async function shooThief(storeId) {
  const save = await db.prepare('SELECT * FROM game_saves WHERE store_id = ?').get(storeId);
  if (!save) return { success: false, message: 'Cửa hàng không tồn tại' };

  const reward = 10000;
  const newMoney = save.money + reward;
  const newRep = Math.min(5.0, Number((save.reputation + 0.1).toFixed(1)));
  const upgrades = JSON.parse(save.upgrades || '{}');
  upgrades.thieves_caught = (upgrades.thieves_caught || 0) + 1;

  const updatedSave = {
    store_id: storeId,
    chapter: save.chapter,
    day_in_game: save.day_in_game,
    money: newMoney,
    debt_remaining: save.debt_remaining,
    reputation: newRep
  };
  const hash = anticheat.generateSaveHash(updatedSave);

  await db.prepare(`
    UPDATE game_saves 
    SET money = ?, reputation = ?, upgrades = ?, save_hash = ?, updated_at = ?
    WHERE store_id = ?
  `).run(newMoney, newRep, JSON.stringify(upgrades), hash, new Date().toISOString(), storeId);

  try { await updateDailyQuestProgress(storeId, 'vigilant'); } catch (e) {}
  invalidateStoreCache(storeId);

  return {
    success: true,
    reward,
    money: newMoney,
    reputation: newRep,
    thievesCaught: upgrades.thieves_caught,
    message: '🩴 NÉM DÉP CHÍNH XÁC! Chiếc dép tổ ong bay chuẩn xác làm tên trộm ôm đầu la oai oái chạy thục mạng! Thưởng cảnh giác: +10.000đ! ⭐'
  };
}

module.exports = {
  buyUpgrade,
  useTalisman,
  stealPet,
  redeemPet,
  shooThief
};
