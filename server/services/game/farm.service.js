/**
 * Farm Service - Nông Trại Chè Mộc Châu & Xưởng Chế Biến Thủ Công
 * Xử lý: Gieo trồng, tưới nước, bón phân, thu hoạch nông sản, ủ siro, nấu trân châu thủ công,
 * kích hoạt nhãn Signature Organic 5⭐ (+40% giá bán & tăng danh tiếng).
 */

const db = require('../../models/db');
const anticheat = require('../anticheat.service');
const { invalidateStoreCache } = require('./cache.helper');
const { DEFAULT_INVENTORY } = require('../../data/ingredients');
const {
  FARM_CROPS,
  CRAFT_RECIPES,
  RAW_MATERIAL_INFO,
  createDefaultFarmData
} = require('../../data/farm_crops');

/**
 * Lấy hoặc khởi tạo dữ liệu farm từ save
 */
function parseFarmData(save) {
  if (!save.farm_data) return createDefaultFarmData();
  try {
    const data = JSON.parse(save.farm_data);
    if (!data.plots || !Array.isArray(data.plots)) {
      return createDefaultFarmData();
    }
    // Ensure rawMaterials map exists
    if (!data.rawMaterials || typeof data.rawMaterials !== 'object') {
      data.rawMaterials = createDefaultFarmData().rawMaterials;
    }
    return data;
  } catch (e) {
    return createDefaultFarmData();
  }
}

/**
 * Lấy toàn bộ trạng thái Nông Trại & Xưởng Chế Biến
 */
async function getFarmState(storeId) {
  const save = await db.prepare('SELECT * FROM game_saves WHERE store_id = ?').get(storeId);
  if (!save) throw new Error('Không tìm thấy dữ liệu tiệm trà sữa!');

  const farmData = parseFarmData(save);
  const now = Date.now();
  const activeBuffs = JSON.parse(save.active_buffs || '{}');
  const inventory = { ...DEFAULT_INVENTORY, ...JSON.parse(save.inventory || '{}') };

  // Format plots with live progress
  const formattedPlots = farmData.plots.map(plot => {
    if (!plot.cropId || !FARM_CROPS[plot.cropId]) {
      return {
        ...plot,
        crop: null,
        isGrowing: false,
        isReady: false,
        remainingSeconds: 0,
        progressPercent: 0
      };
    }

    const crop = FARM_CROPS[plot.cropId];
    const totalDurationMs = (crop.growthSeconds || 60) * 1000;
    const elapsedMs = Math.max(0, now - plot.plantedAt);
    const remainingMs = Math.max(0, plot.readyAt - now);
    const isReady = remainingMs === 0;
    const progressPercent = isReady ? 100 : Math.min(99, Math.floor((elapsedMs / totalDurationMs) * 100));

    return {
      ...plot,
      crop,
      isGrowing: !isReady,
      isReady,
      remainingSeconds: Math.ceil(remainingMs / 1000),
      progressPercent
    };
  });

  // Calculate craft recipes with affordability
  const craftCatalog = Object.values(CRAFT_RECIPES).map(recipe => {
    let canCraft = true;
    const missing = {};

    for (const [matId, requiredQty] of Object.entries(recipe.requires)) {
      const ownedQty = farmData.rawMaterials[matId] || 0;
      if (ownedQty < requiredQty) {
        canCraft = false;
        missing[matId] = requiredQty - ownedQty;
      }
    }

    return {
      ...recipe,
      canCraft,
      missing
    };
  });

  return {
    plots: formattedPlots,
    rawMaterials: farmData.rawMaterials,
    rawMaterialInfo: RAW_MATERIAL_INFO,
    cropsCatalog: Object.values(FARM_CROPS),
    craftCatalog,
    harvestCount: farmData.harvestCount || 0,
    organicSignatureCups: activeBuffs.organic_signature || 0,
    money: save.money,
    teacoin: save.teacoin || 0,
    inventory
  };
}

/**
 * Gieo hạt một ô đất
 */
async function plantCrop(storeId, plotId, cropId) {
  const save = await db.prepare('SELECT * FROM game_saves WHERE store_id = ?').get(storeId);
  if (!save) throw new Error('Không tìm thấy dữ liệu tiệm trà sữa!');
  if (Number(save.chapter || 1) < 3) throw new Error('🔒 Nông Trại Chè Mộc Châu chỉ mở khóa khi đạt Chương 3!');

  const crop = FARM_CROPS[cropId];
  if (!crop) throw new Error('Giống cây trồng không hợp lệ!');

  if (save.money < crop.seedCost) {
    throw new Error(`Không đủ tiền mua hạt giống! Cần ${crop.seedCost.toLocaleString('vi-VN')}đ.`);
  }

  const farmData = parseFarmData(save);
  const targetPlot = farmData.plots.find(p => p.id === Number(plotId));
  if (!targetPlot) throw new Error('Ô đất không tồn tại!');

  if (targetPlot.cropId) {
    throw new Error('Ô đất này đang có cây trồng! Hãy chờ thu hoạch hoặc chọn ô đất trống khác.');
  }

  const now = Date.now();
  targetPlot.cropId = cropId;
  targetPlot.plantedAt = now;
  targetPlot.readyAt = now + (crop.growthSeconds * 1000);
  targetPlot.wateredCount = 0;
  targetPlot.lastWateredAt = 0;

  const newMoney = save.money - crop.seedCost;
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
    SET money = ?, farm_data = ?, save_hash = ?, updated_at = ?
    WHERE store_id = ?
  `).run(newMoney, JSON.stringify(farmData), hash, new Date().toISOString(), storeId);

  invalidateStoreCache(storeId);

  return {
    success: true,
    message: `🌱 Đã gieo ${crop.name} vào ô đất số ${plotId}!`,
    crop,
    plotId,
    money: newMoney
  };
}

/**
 * Tưới nước suối khoáng (giảm 30% thời gian sinh trưởng còn lại)
 */
async function waterPlot(storeId, plotId) {
  const save = await db.prepare('SELECT * FROM game_saves WHERE store_id = ?').get(storeId);
  if (!save) throw new Error('Không tìm thấy dữ liệu tiệm trà sữa!');

  const farmData = parseFarmData(save);
  const targetPlot = farmData.plots.find(p => p.id === Number(plotId));
  if (!targetPlot || !targetPlot.cropId) throw new Error('Ô đất không có cây trồng!');

  const now = Date.now();
  if (now >= targetPlot.readyAt) {
    throw new Error('Cây đã chín rộ sẵn sàng thu hoạch, không cần tưới thêm nước!');
  }

  // 10-second watering cooldown per plot
  if (targetPlot.lastWateredAt && (now - targetPlot.lastWateredAt) < 10000) {
    const waitSec = Math.ceil((10000 - (now - targetPlot.lastWateredAt)) / 1000);
    throw new Error(`Đất còn ẩm ướt! Vui lòng chờ ${waitSec}s nữa trước khi tưới tiếp.`);
  }

  const remaining = targetPlot.readyAt - now;
  const reductionMs = Math.round(remaining * 0.35); // Giảm 35% thời gian còn lại
  targetPlot.readyAt = Math.max(now, targetPlot.readyAt - reductionMs);
  targetPlot.wateredCount = (targetPlot.wateredCount || 0) + 1;
  targetPlot.lastWateredAt = now;

  await db.prepare(`
    UPDATE game_saves 
    SET farm_data = ?, updated_at = ?
    WHERE store_id = ?
  `).run(JSON.stringify(farmData), new Date().toISOString(), storeId);

  invalidateStoreCache(storeId);

  return {
    success: true,
    message: `💧 Đã tưới nước suối Mộc Châu mát lành! Thời gian lớn nhanh thêm ${Math.round(reductionMs / 1000)}s!`,
    plotId,
    isReady: now >= targetPlot.readyAt
  };
}

/**
 * Bón phân hữu cơ (Làm chín cây ngay lập tức bằng 1 TeaCoin hoặc 10.000đ)
 */
async function fertilizePlot(storeId, plotId, useTeaCoin = false) {
  const save = await db.prepare('SELECT * FROM game_saves WHERE store_id = ?').get(storeId);
  if (!save) throw new Error('Không tìm thấy dữ liệu tiệm trà sữa!');

  const farmData = parseFarmData(save);
  const targetPlot = farmData.plots.find(p => p.id === Number(plotId));
  if (!targetPlot || !targetPlot.cropId) throw new Error('Ô đất không có cây trồng!');

  const now = Date.now();
  if (now >= targetPlot.readyAt) {
    throw new Error('Cây đã chín rồi, hãy thu hoạch ngay!');
  }

  let newMoney = save.money;
  let newTeaCoin = save.teacoin || 0;

  if (useTeaCoin) {
    if (newTeaCoin < 1) throw new Error('Không đủ TeaCoin! Cần 1 TeaCoin.');
    newTeaCoin -= 1;
  } else {
    if (newMoney < 10000) throw new Error('Không đủ tiền mặt! Cần 10.000đ.');
    newMoney -= 10000;
  }

  targetPlot.readyAt = now; // Ready immediately!

  const updatedSave = {
    store_id: storeId,
    chapter: save.chapter,
    day_in_game: save.day_in_game,
    money: newMoney,
    debt_remaining: save.debt_remaining,
    reputation: save.reputation,
    teacoin: newTeaCoin
  };
  const hash = anticheat.generateSaveHash(updatedSave);

  await db.prepare(`
    UPDATE game_saves 
    SET money = ?, teacoin = ?, farm_data = ?, save_hash = ?, updated_at = ?
    WHERE store_id = ?
  `).run(newMoney, newTeaCoin, JSON.stringify(farmData), hash, new Date().toISOString(), storeId);

  invalidateStoreCache(storeId);

  return {
    success: true,
    message: '✨ Bón phân hữu cơ trùn quế thành công! Cây đã nở rộ búp nõn sẵn sàng thu hoạch ngay lập tức!',
    plotId,
    money: newMoney,
    teacoin: newTeaCoin
  };
}

/**
 * Thu hoạch một ô đất
 */
async function harvestPlot(storeId, plotId) {
  const save = await db.prepare('SELECT * FROM game_saves WHERE store_id = ?').get(storeId);
  if (!save) throw new Error('Không tìm thấy dữ liệu tiệm trà sữa!');

  const farmData = parseFarmData(save);
  const targetPlot = farmData.plots.find(p => p.id === Number(plotId));
  if (!targetPlot || !targetPlot.cropId) throw new Error('Ô đất trống, không có gì để thu hoạch!');

  const crop = FARM_CROPS[targetPlot.cropId];
  if (!crop) throw new Error('Giống cây trồng không tồn tại!');

  const now = Date.now();
  if (now < targetPlot.readyAt) {
    const remainSec = Math.ceil((targetPlot.readyAt - now) / 1000);
    throw new Error(`Cây chưa chín! Còn ${remainSec}s nữa mới có thể thu hoạch.`);
  }

  // Add produced ingredients to store inventory
  const inventory = { ...DEFAULT_INVENTORY, ...JSON.parse(save.inventory || '{}') };
  for (const [ingId, qty] of Object.entries(crop.produce)) {
    inventory[ingId] = (inventory[ingId] || 0) + qty;
  }

  // Add raw produce to farm rawMaterials
  if (!farmData.rawMaterials) farmData.rawMaterials = {};
  for (const [rawId, qty] of Object.entries(crop.rawProduce)) {
    farmData.rawMaterials[rawId] = (farmData.rawMaterials[rawId] || 0) + qty;
  }

  farmData.harvestCount = (farmData.harvestCount || 0) + 1;
  targetPlot.cropId = null;
  targetPlot.plantedAt = 0;
  targetPlot.readyAt = 0;
  targetPlot.wateredCount = 0;
  targetPlot.lastWateredAt = 0;

  await db.prepare(`
    UPDATE game_saves 
    SET inventory = ?, farm_data = ?, updated_at = ?
    WHERE store_id = ?
  `).run(JSON.stringify(inventory), JSON.stringify(farmData), new Date().toISOString(), storeId);

  invalidateStoreCache(storeId);

  return {
    success: true,
    message: `🎉 Thu hoạch thành công ${crop.name}! Đã cộng nguyên liệu vào Kho Quán và Nông Sản Thô vào Xưởng Chế Biến!`,
    produce: crop.produce,
    rawProduce: crop.rawProduce,
    inventory,
    rawMaterials: farmData.rawMaterials
  };
}

/**
 * Thu hoạch tất cả các ô đất đã chín
 */
async function harvestAll(storeId) {
  const save = await db.prepare('SELECT * FROM game_saves WHERE store_id = ?').get(storeId);
  if (!save) throw new Error('Không tìm thấy dữ liệu tiệm trà sữa!');

  const farmData = parseFarmData(save);
  const now = Date.now();
  const ripePlots = farmData.plots.filter(p => p.cropId && now >= p.readyAt);

  if (ripePlots.length === 0) {
    throw new Error('Chưa có ô đất nào chín để thu hoạch!');
  }

  const inventory = { ...DEFAULT_INVENTORY, ...JSON.parse(save.inventory || '{}') };
  const totalProduce = {};
  const totalRawProduce = {};

  if (!farmData.rawMaterials) farmData.rawMaterials = {};

  for (const plot of ripePlots) {
    const crop = FARM_CROPS[plot.cropId];
    if (!crop) continue;

    for (const [ingId, qty] of Object.entries(crop.produce)) {
      inventory[ingId] = (inventory[ingId] || 0) + qty;
      totalProduce[ingId] = (totalProduce[ingId] || 0) + qty;
    }

    for (const [rawId, qty] of Object.entries(crop.rawProduce)) {
      farmData.rawMaterials[rawId] = (farmData.rawMaterials[rawId] || 0) + qty;
      totalRawProduce[rawId] = (totalRawProduce[rawId] || 0) + qty;
    }

    farmData.harvestCount = (farmData.harvestCount || 0) + 1;
    plot.cropId = null;
    plot.plantedAt = 0;
    plot.readyAt = 0;
    plot.wateredCount = 0;
    plot.lastWateredAt = 0;
  }

  await db.prepare(`
    UPDATE game_saves 
    SET inventory = ?, farm_data = ?, updated_at = ?
    WHERE store_id = ?
  `).run(JSON.stringify(inventory), JSON.stringify(farmData), new Date().toISOString(), storeId);

  invalidateStoreCache(storeId);

  return {
    success: true,
    message: `🎉 Đã thu hoạch toàn bộ ${ripePlots.length} ô đất! Kho quán và xưởng chế biến đã tràn ngập nguyên liệu thơm ngon!`,
    harvestedCount: ripePlots.length,
    totalProduce,
    totalRawProduce,
    inventory,
    rawMaterials: farmData.rawMaterials
  };
}

/**
 * Xưởng chế biến thủ công: Nấu trân châu, ủ siro, ướp trà sen
 * Kích hoạt hoặc cộng dồn buff "Signature Organic 5⭐" (+40% giá bán)
 */
async function craftRecipe(storeId, recipeId) {
  const save = await db.prepare('SELECT * FROM game_saves WHERE store_id = ?').get(storeId);
  if (!save) throw new Error('Không tìm thấy dữ liệu tiệm trà sữa!');

  const recipe = CRAFT_RECIPES[recipeId];
  if (!recipe) throw new Error('Công thức chế biến không hợp lệ!');

  const farmData = parseFarmData(save);
  if (!farmData.rawMaterials) farmData.rawMaterials = {};

  // Check required materials
  for (const [matId, reqQty] of Object.entries(recipe.requires)) {
    const owned = farmData.rawMaterials[matId] || 0;
    if (owned < reqQty) {
      const matName = RAW_MATERIAL_INFO[matId] ? RAW_MATERIAL_INFO[matId].name : matId;
      throw new Error(`Không đủ nguyên liệu ${matName}! Cần ${reqQty}, hiện có ${owned}. Hãy gieo trồng thêm ở Đồi Chè Mộc Châu.`);
    }
  }

  // Deduct materials
  for (const [matId, reqQty] of Object.entries(recipe.requires)) {
    farmData.rawMaterials[matId] -= reqQty;
  }

  // Add produced ingredients to inventory
  const inventory = { ...DEFAULT_INVENTORY, ...JSON.parse(save.inventory || '{}') };
  for (const [ingId, qty] of Object.entries(recipe.produce)) {
    inventory[ingId] = (inventory[ingId] || 0) + qty;
  }

  // Activate or stack "organic_signature" buff in active_buffs
  const activeBuffs = JSON.parse(save.active_buffs || '{}');
  activeBuffs.organic_signature = (activeBuffs.organic_signature || 0) + recipe.organicBuffCups;

  // Boost reputation
  const newReputation = Math.min(5.0, Number((save.reputation + recipe.repGain).toFixed(2)));

  const updatedSave = {
    store_id: storeId,
    chapter: save.chapter,
    day_in_game: save.day_in_game,
    money: save.money,
    debt_remaining: save.debt_remaining,
    reputation: newReputation,
    teacoin: save.teacoin || 0
  };
  const hash = anticheat.generateSaveHash(updatedSave);

  await db.prepare(`
    UPDATE game_saves 
    SET inventory = ?, farm_data = ?, active_buffs = ?, reputation = ?, save_hash = ?, updated_at = ?
    WHERE store_id = ?
  `).run(
    JSON.stringify(inventory),
    JSON.stringify(farmData),
    JSON.stringify(activeBuffs),
    newReputation,
    hash,
    new Date().toISOString(),
    storeId
  );

  invalidateStoreCache(storeId);

  return {
    success: true,
    message: `🧋 [CHẾ BIẾN THÀNH CÔNG] Đã hoàn thành ${recipe.name}! Nhận ngay nguyên liệu xịn và kích hoạt nhãn 'Signature Organic 5⭐' (+40% giá bán) cho ${recipe.organicBuffCups} ly tiếp theo!`,
    recipe,
    produce: recipe.produce,
    organicSignatureCups: activeBuffs.organic_signature,
    inventory,
    rawMaterials: farmData.rawMaterials,
    reputation: newReputation
  };
}

module.exports = {
  getFarmState,
  plantCrop,
  waterPlot,
  fertilizePlot,
  harvestPlot,
  harvestAll,
  craftRecipe
};

