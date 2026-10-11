/**
 * Franchise & Auction Service - Đế Chế Nhượng Quyền & Sàn Đấu Giá Trà Quý
 * Xử lý: Mở chi nhánh toàn cầu, thu tiền nhượng quyền thụ động, đấu giá nguyên liệu cổ thụ,
 * bảng xếp hạng Vua Trà Sữa Đô Thị.
 */

const db = require('../../models/db');
const anticheat = require('../anticheat.service');
const { invalidateStoreCache } = require('./cache.helper');
const { FRANCHISE_LOCATIONS } = require('../../data/franchises');
const { AUCTION_ITEMS, NPC_BIDDERS } = require('../../data/auction');

/**
 * Lấy toàn bộ trạng thái Đế Chế Nhượng Quyền & Sàn Đấu Giá
 */
async function getFranchiseState(storeId) {
  const save = await db.prepare('SELECT * FROM game_saves WHERE store_id = ?').get(storeId);
  if (!save) throw new Error('Không tìm thấy dữ liệu tiệm trà sữa!');

  let ownedFranchises = [];
  try {
    ownedFranchises = JSON.parse(save.franchises || '[]');
  } catch (e) {
    ownedFranchises = [];
  }

  let ownedAuctions = [];
  try {
    ownedAuctions = JSON.parse(save.auction_items || '[]');
  } catch (e) {
    ownedAuctions = [];
  }

  const now = Date.now();
  let totalPendingRoyalties = 0;

  // Map owned franchises with live accumulated earnings
  const ownedMap = new Map();
  ownedFranchises.forEach(f => {
    const config = FRANCHISE_LOCATIONS[f.id];
    if (!config) return;

    const level = f.level || 1;
    const lastCollected = f.lastCollectedAt || f.openedAt || now;
    const elapsedMinutes = Math.max(0, (now - lastCollected) / 60000);
    const multiplier = 1 + ((level - 1) * 0.35);
    const accumulated = Math.min(
      config.maxAccumulated * multiplier,
      Math.floor(elapsedMinutes * config.ratePerMinute * multiplier)
    );

    totalPendingRoyalties += accumulated;

    ownedMap.set(f.id, {
      ...f,
      level,
      accumulated,
      multiplier,
      nextUpgradeCost: Math.round(config.cost * 0.35 * level)
    });
  });

  // Format all locations
  const catalog = Object.values(FRANCHISE_LOCATIONS).map(loc => {
    const ownedData = ownedMap.get(loc.id);
    const isOwned = !!ownedData;
    return {
      ...loc,
      isOwned,
      level: ownedData ? ownedData.level : 0,
      accumulated: ownedData ? ownedData.accumulated : 0,
      nextUpgradeCost: ownedData ? ownedData.nextUpgradeCost : Math.round(loc.cost * 0.35),
      canUpgrade: ownedData ? (ownedData.level < 5 && save.money >= ownedData.nextUpgradeCost) : false,
      canBuy: !isOwned && (save.money >= loc.cost)
    };
  });

  // Format auction items
  const auctionCatalog = Object.values(AUCTION_ITEMS).map(item => {
    const isOwned = ownedAuctions.some(a => a.id === item.id);
    return {
      ...item,
      isOwned,
      canBid: !isOwned && (save.money >= item.startingBid)
    };
  });

  // Calculate Net Worth for Leaderboard
  let franchiseAssets = 0;
  ownedFranchises.forEach(f => {
    const config = FRANCHISE_LOCATIONS[f.id];
    if (config) {
      franchiseAssets += config.cost + (Math.round(config.cost * 0.35) * ((f.level || 1) - 1));
    }
  });
  const netWorth = (save.money || 0) + franchiseAssets;

  return {
    chapter: save.chapter || 1,
    money: save.money,
    franchises: catalog,
    ownedCount: ownedFranchises.length,
    totalPendingRoyalties,
    auctionItems: auctionCatalog,
    ownedAuctions,
    netWorth,
    leaderboard: generateLeaderboard(save.store_id, save.store_name || 'Tiệm Trà Sữa HeeHee', netWorth, save.reputation || 5.0, ownedFranchises.length)
  };
}

/**
 * Mở chi nhánh nhượng quyền mới
 */
async function openFranchise(storeId, franchiseId) {
  const save = await db.prepare('SELECT * FROM game_saves WHERE store_id = ?').get(storeId);
  if (!save) throw new Error('Không tìm thấy dữ liệu tiệm trà sữa!');
  if (Number(save.chapter || 1) < 4) throw new Error('🔒 Đế Chế Nhượng Quyền chỉ mở khóa khi đạt Chương 4!');

  const config = FRANCHISE_LOCATIONS[franchiseId];
  if (!config) throw new Error('Địa điểm chi nhánh không hợp lệ!');

  if (save.money < config.cost) {
    throw new Error(`Không đủ tiền mở chi nhánh! Cần ${config.cost.toLocaleString('vi-VN')}đ (còn thiếu ${(config.cost - save.money).toLocaleString('vi-VN')}đ).`);
  }

  let franchises = [];
  try {
    franchises = JSON.parse(save.franchises || '[]');
  } catch (e) {
    franchises = [];
  }

  if (franchises.some(f => f.id === franchiseId)) {
    throw new Error('Bạn đã mở chi nhánh này rồi!');
  }

  const now = Date.now();
  franchises.push({
    id: franchiseId,
    level: 1,
    openedAt: now,
    lastCollectedAt: now
  });

  const newMoney = save.money - config.cost;

  // Unlock recipe if specified
  let recipes = [];
  try {
    recipes = JSON.parse(save.recipes || '[]');
  } catch (e) {
    recipes = [];
  }
  if (config.unlockRecipe && !recipes.includes(config.unlockRecipe)) {
    recipes.push(config.unlockRecipe);
  }

  const updatedSave = {
    store_id: storeId,
    chapter: save.chapter,
    day_in_game: save.day_in_game,
    money: newMoney,
    debt_remaining: save.debt_remaining,
    reputation: Math.min(5.0, (save.reputation || 4.5) + 0.1),
    teacoin: save.teacoin || 0
  };
  const hash = anticheat.generateSaveHash(updatedSave);

  await db.prepare(`
    UPDATE game_saves 
    SET money = ?, franchises = ?, recipes = ?, reputation = ?, save_hash = ?, updated_at = ?
    WHERE store_id = ?
  `).run(newMoney, JSON.stringify(franchises), JSON.stringify(recipes), updatedSave.reputation, hash, new Date().toISOString(), storeId);

  invalidateStoreCache(storeId);

  return {
    success: true,
    message: `🎉 CHÚC MỪNG KHAI TRƯƠNG! ${config.name} (${config.location}) chính thức đi vào hoạt động! Chi nhánh bắt đầu tự động sinh lời thụ động!`,
    franchise: config,
    money: newMoney,
    recipes
  };
}

/**
 * Nâng cấp chi nhánh nhượng quyền (Level 1..5)
 */
async function upgradeFranchise(storeId, franchiseId) {
  const save = await db.prepare('SELECT * FROM game_saves WHERE store_id = ?').get(storeId);
  if (!save) throw new Error('Không tìm thấy dữ liệu tiệm trà sữa!');

  const config = FRANCHISE_LOCATIONS[franchiseId];
  if (!config) throw new Error('Địa điểm chi nhánh không hợp lệ!');

  let franchises = [];
  try {
    franchises = JSON.parse(save.franchises || '[]');
  } catch (e) {
    franchises = [];
  }

  const target = franchises.find(f => f.id === franchiseId);
  if (!target) throw new Error('Bạn chưa mở chi nhánh này!');

  const currentLevel = target.level || 1;
  if (currentLevel >= 5) throw new Error('Chi nhánh này đã đạt cấp tối đa (Level 5 ⭐)!');

  const upgradeCost = Math.round(config.cost * 0.35 * currentLevel);
  if (save.money < upgradeCost) {
    throw new Error(`Không đủ tiền nâng cấp! Cần ${upgradeCost.toLocaleString('vi-VN')}đ.`);
  }

  target.level = currentLevel + 1;
  const newMoney = save.money - upgradeCost;

  const updatedSave = {
    store_id: storeId,
    chapter: save.chapter,
    day_in_game: save.day_in_game,
    money: newMoney,
    debt_remaining: save.debt_remaining,
    reputation: Math.min(5.0, (save.reputation || 4.5) + 0.05),
    teacoin: save.teacoin || 0
  };
  const hash = anticheat.generateSaveHash(updatedSave);

  await db.prepare(`
    UPDATE game_saves 
    SET money = ?, franchises = ?, reputation = ?, save_hash = ?, updated_at = ?
    WHERE store_id = ?
  `).run(newMoney, JSON.stringify(franchises), updatedSave.reputation, hash, new Date().toISOString(), storeId);

  invalidateStoreCache(storeId);

  return {
    success: true,
    message: `✨ Nâng cấp thành công ${config.name} lên Cấp ${target.level}! Doanh thu thụ động tăng thêm +35%!`,
    newLevel: target.level,
    money: newMoney
  };
}

/**
 * Thu toàn bộ tiền nhượng quyền thụ động đang tích lũy
 */
async function collectRoyalties(storeId) {
  const save = await db.prepare('SELECT * FROM game_saves WHERE store_id = ?').get(storeId);
  if (!save) throw new Error('Không tìm thấy dữ liệu tiệm trà sữa!');

  let franchises = [];
  try {
    franchises = JSON.parse(save.franchises || '[]');
  } catch (e) {
    franchises = [];
  }

  if (franchises.length === 0) {
    throw new Error('Bạn chưa có chi nhánh nhượng quyền nào để thu tiền!');
  }

  const now = Date.now();
  let totalCollected = 0;

  franchises.forEach(f => {
    const config = FRANCHISE_LOCATIONS[f.id];
    if (!config) return;

    const level = f.level || 1;
    const lastCollected = f.lastCollectedAt || f.openedAt || now;
    const elapsedMinutes = Math.max(0, (now - lastCollected) / 60000);
    const multiplier = 1 + ((level - 1) * 0.35);
    const accumulated = Math.min(
      config.maxAccumulated * multiplier,
      Math.floor(elapsedMinutes * config.ratePerMinute * multiplier)
    );

    if (accumulated > 0) {
      totalCollected += accumulated;
      f.lastCollectedAt = now;
    }
  });

  if (totalCollected <= 0) {
    throw new Error('Chưa có tiền nhượng quyền tích lũy mới để thu. Hãy quay lại sau ít phút!');
  }

  const newMoney = save.money + totalCollected;

  const updatedSave = {
    store_id: storeId,
    chapter: save.chapter,
    day_in_game: save.day_in_game,
    money: newMoney,
    debt_remaining: save.debt_remaining,
    reputation: save.reputation,
    teacoin: save.teacoin || 0
  };
  const hash = anticheat.generateSaveHash(updatedSave);

  await db.prepare(`
    UPDATE game_saves 
    SET money = ?, franchises = ?, save_hash = ?, updated_at = ?
    WHERE store_id = ?
  `).run(newMoney, JSON.stringify(franchises), hash, new Date().toISOString(), storeId);

  invalidateStoreCache(storeId);

  return {
    success: true,
    message: `💰 Thu thành công ${totalCollected.toLocaleString('vi-VN')}đ tiền nhượng quyền thụ động từ chuỗi chi nhánh!`,
    collectedAmount: totalCollected,
    money: newMoney
  };
}

/**
 * Đấu giá nguyên liệu quý hiếm (Rare Ingredient Auction)
 */
async function bidAuction(storeId, itemId, bidAmount) {
  const save = await db.prepare('SELECT * FROM game_saves WHERE store_id = ?').get(storeId);
  if (!save) throw new Error('Không tìm thấy dữ liệu tiệm trà sữa!');

  const item = AUCTION_ITEMS[itemId];
  if (!item) throw new Error('Vật phẩm đấu giá không hợp lệ!');

  let ownedAuctions = [];
  try {
    ownedAuctions = JSON.parse(save.auction_items || '[]');
  } catch (e) {
    ownedAuctions = [];
  }

  if (ownedAuctions.some(a => a.id === itemId)) {
    throw new Error('Bạn đã sở hữu vật phẩm quý này rồi!');
  }

  const finalCost = Math.max(item.startingBid, Number(bidAmount || item.startingBid));
  if (save.money < finalCost) {
    throw new Error(`Không đủ tiền mặt để đặt giá thầu! Cần ${finalCost.toLocaleString('vi-VN')}đ.`);
  }

  // Record won item
  ownedAuctions.push({
    id: itemId,
    wonAt: Date.now(),
    pricePaid: finalCost
  });

  // Activate permanent buffs in active_buffs
  const activeBuffs = JSON.parse(save.active_buffs || '{}');
  if (itemId === 'tra_co_thu_ta_xua') {
    activeBuffs.permanent_tea_boost = 1.30;
  } else if (itemId === 'olong_alishan_hun_khoi') {
    activeBuffs.permanent_tip_boost = 1.50;
  } else if (itemId === 'sua_tuoi_hokkaido') {
    activeBuffs.permanent_milk_boost = 1.45;
  } else if (itemId === 'mat_mia_u_minh') {
    activeBuffs.permanent_speed_boost = 1.40;
  }

  const newMoney = save.money - finalCost;
  const newRep = Math.min(5.0, Number(((save.reputation || 4.5) + (item.effects.repBoost || 0.15)).toFixed(2)));

  const updatedSave = {
    store_id: storeId,
    chapter: save.chapter,
    day_in_game: save.day_in_game,
    money: newMoney,
    debt_remaining: save.debt_remaining,
    reputation: newRep,
    teacoin: save.teacoin || 0
  };
  const hash = anticheat.generateSaveHash(updatedSave);

  await db.prepare(`
    UPDATE game_saves 
    SET money = ?, auction_items = ?, active_buffs = ?, reputation = ?, save_hash = ?, updated_at = ?
    WHERE store_id = ?
  `).run(newMoney, JSON.stringify(ownedAuctions), JSON.stringify(activeBuffs), newRep, hash, new Date().toISOString(), storeId);

  invalidateStoreCache(storeId);

  const randomNPC = NPC_BIDDERS[Math.floor(Math.random() * NPC_BIDDERS.length)];

  return {
    success: true,
    message: `🔨 [BÚA ĐÃ GÕ - ĐẤU GIÁ THÀNH CÔNG!] ${randomNPC.name} tiếc nuối nhường lại! Bạn đã sở hữu vĩnh viễn: ${item.name}! Kích hoạt hào quang và tăng vĩnh viễn hiệu ứng cho toàn tiệm!`,
    item,
    pricePaid: finalCost,
    money: newMoney,
    reputation: newRep
  };
}

/**
 * Tạo Bảng Xếp Hạng Vua Trà Sữa Đô Thị (Leaderboard)
 */
function generateLeaderboard(playerStoreId, playerStoreName, playerNetWorth, playerRep, franchiseCount) {
  const competitorStores = [
    { rank: 1, name: 'Đế Chế Boba King Tokyo', owner: 'Mr. Sato', netWorth: 550000000, branches: 8, rep: 5.0, badge: '👑 Vua Trà Sữa Châu Á' },
    { rank: 2, name: 'Tập Đoàn Trà Sữa Trâu Vàng', owner: 'Lão Ba & Cổ Đông', netWorth: 280000000, branches: 5, rep: 4.8, badge: '🥈 Đại Gia Vỉa Hè' },
    { rank: 3, name: 'HeeHee Boba Global Empire', owner: playerStoreName, netWorth: playerNetWorth, branches: franchiseCount, rep: playerRep, badge: '⭐ Tiệm Của Bạn', isPlayer: true },
    { rank: 4, name: 'Trà Đạo Hoàng Gia Cung Đình', owner: 'Nghệ Nhân Hoàng Phủ', netWorth: 180000000, branches: 3, rep: 4.9, badge: '🪷 Tinh Hoa Trà Việt' },
    { rank: 5, name: 'Quỹ Trà Sữa Khởi Nghiệp BK', owner: 'Shark Tuấn HUST', netWorth: 120000000, branches: 2, rep: 4.7, badge: '🚀 Kỳ Lân Công Nghệ' }
  ];

  // Re-sort based on actual netWorth
  competitorStores.sort((a, b) => b.netWorth - a.netWorth);
  competitorStores.forEach((item, index) => {
    item.rank = index + 1;
  });

  return competitorStores;
}

module.exports = {
  getFranchiseState,
  openFranchise,
  upgradeFranchise,
  collectRoyalties,
  bidAuction
};

