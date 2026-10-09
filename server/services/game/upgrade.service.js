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

  // XỬ LÝ CHO CÁC LOẠI THẺ TIÊU HAO (HÃM HẠI, PHÒNG THỦ, SỰ KIỆN, TIỆN ÍCH)
  const isConsumableCard = ['sabotage_card', 'defense_card', 'event_card', 'utility_card'].includes(item.type);
  if (isConsumableCard) {
    const requiredChapter = item.chapter || 2;
    if ((save.chapter || 1) < requiredChapter) {
      return {
        success: false,
        message: `🔒 Thẻ này chỉ mở khóa từ Chương ${requiredChapter}!`
      };
    }

    if (save.money < item.cost) {
      return { success: false, message: `Không đủ tiền! Cần ${item.cost.toLocaleString('vi-VN')}đ để mua ${item.name}.` };
    }

    const currentCount = Number(upgrades[upgradeId] || 0);
    if (currentCount >= 5) {
      return {
        success: false,
        message: `Đã đạt sức chứa tối đa (5 thẻ ${item.name})! Hãy dùng bớt trước khi mua thêm.`
      };
    }

    upgrades[upgradeId] = currentCount + 1;
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
      itemCount: upgrades[upgradeId],
      message: `🎯 Đã mua thành công 1 [${item.name}]! Hiện có: ${upgrades[upgradeId]} thẻ trong kho đồ.`
    };
  }

  // XỬ LÝ CHO PHÂN QUYỀN NHÂN SỰ CHƯƠNG 3
  if (item.type === 'staff') {
    if ((save.chapter || 1) < 3) {
      return {
        success: false,
        message: '🔒 Thăng chức nhân sự chỉ khả dụng từ Chương 3: Cửa Hàng Phố Đi Bộ!'
      };
    }
    if (upgrades[upgradeId]) {
      return { success: false, message: 'Đã thăng chức cho nhân sự này rồi!' };
    }
    if (save.money < item.cost) {
      return { success: false, message: `Không đủ tiền! Cần ${item.cost.toLocaleString('vi-VN')}đ để thăng chức ${item.name}.` };
    }
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

async function useSabotageCard(storeId, cardId, targetStoreCode) {
  const card = UPGRADES[cardId];
  if (!card || card.type !== 'sabotage_card') {
    return { success: false, message: 'Thẻ hãm hại không hợp lệ!' };
  }

  const save = await db.prepare('SELECT * FROM game_saves WHERE store_id = ?').get(storeId);
  if (!save) return { success: false, message: 'Cửa hàng không tồn tại' };

  const upgrades = JSON.parse(save.upgrades || '{}');
  const count = Number(upgrades[cardId] || 0);
  if (count <= 0) {
    return { success: false, message: `Bạn không còn [${card.name}]! Hãy vào cửa hàng Nâng Cấp để mua thêm.` };
  }

  // Find target store
  const targetCodeClean = (targetStoreCode || '').trim().toUpperCase();
  if (!targetCodeClean) {
    return { success: false, message: 'Vui lòng cung cấp Mã Quán của đối thủ cần hãm hại!' };
  }

  const targetStore = await db.prepare('SELECT id, store_name, store_code FROM stores WHERE UPPER(store_code) = ?').get(targetCodeClean);
  if (!targetStore) {
    return { success: false, message: `Không tìm thấy quán nào có Mã [${targetCodeClean}]!` };
  }

  if (Number(targetStore.id) === Number(storeId)) {
    return { success: false, message: 'Không thể tự sử dụng thẻ hãm hại lên chính quán của mình!' };
  }

  const targetSave = await db.prepare('SELECT * FROM game_saves WHERE store_id = ?').get(targetStore.id);
  if (!targetSave) {
    return { success: false, message: 'Quán đối thủ chưa khởi tạo dữ liệu lưu game!' };
  }

  // Deduct card from attacker
  upgrades[cardId] = count - 1;
  upgrades.sabotage_used_count = (upgrades.sabotage_used_count || 0) + 1;

  const updatedSenderSave = {
    store_id: storeId,
    chapter: save.chapter,
    day_in_game: save.day_in_game,
    money: save.money,
    debt_remaining: save.debt_remaining,
    reputation: save.reputation
  };
  const senderHash = anticheat.generateSaveHash(updatedSenderSave);

  await db.prepare('UPDATE game_saves SET upgrades = ?, save_hash = ?, updated_at = ? WHERE store_id = ?')
    .run(JSON.stringify(upgrades), senderHash, new Date().toISOString(), storeId);
  invalidateStoreCache(storeId);

  // Apply sabotage penalty onto target store's active_buffs
  const targetBuffs = JSON.parse(targetSave.active_buffs || '{}');
  const senderStore = await db.prepare('SELECT store_name FROM stores WHERE id = ?').get(storeId);
  const senderName = senderStore ? senderStore.store_name : 'Quán đối thủ';

  const sabotageType = card.sabotageType; // 'tiktoker_flop' | 'market_inspection'
  const isMarketInspection = (sabotageType === 'market_inspection');

  targetBuffs.sabotage = {
    id: cardId,
    name: card.name,
    type: sabotageType,
    waves: 10,
    started_at: Date.now(),
    attacker_name: senderName
  };

  // If flop, also assign tiktoker_status = 'flop' for dual impact
  if (!isMarketInspection) {
    targetBuffs.tiktoker_status = 'flop';
    targetBuffs.tiktoker_waves = 10;
  }

  const updatedTargetSave = {
    store_id: targetStore.id,
    chapter: targetSave.chapter,
    day_in_game: targetSave.day_in_game,
    money: targetSave.money,
    debt_remaining: targetSave.debt_remaining,
    reputation: targetSave.reputation
  };
  const targetHash = anticheat.generateSaveHash(updatedTargetSave);

  await db.prepare('UPDATE game_saves SET active_buffs = ?, save_hash = ?, updated_at = ? WHERE store_id = ?')
    .run(JSON.stringify(targetBuffs), targetHash, new Date().toISOString(), targetStore.id);
  invalidateStoreCache(targetStore.id);

  await db.prepare(`
    INSERT INTO audit_logs (store_id, event_type, detail, logged_at)
    VALUES (?, 'SABOTAGE_USED', ?, ?)
  `).run(storeId, `Dùng [${card.name}] lên quán [${targetStore.store_name}] (${targetCodeClean})`, new Date().toISOString());

  await db.prepare(`
    INSERT INTO audit_logs (store_id, event_type, detail, logged_at)
    VALUES (?, 'SABOTAGED_BY_RIVAL', ?, ?)
  `).run(targetStore.id, `Bị quán [${senderName}] dùng [${card.name}] hãm hại!`, new Date().toISOString());

  // Push immediate real-time event to victim store if online!
  const liveSync = require('../live-sync.service');
  const alertTitle = isMarketInspection
    ? `🚨 ĐỘI QUẢN LÝ THỊ TRƯỜNG ĐỘT XUẤT KIỂM TRA!`
    : `📉 BỊ TIKTOKER REVIEW BÓC PHỐT TẨY CHAY!`;
  const alertDesc = isMarketInspection
    ? `Quán của bạn bị Quản lý thị trường ập vào niêm phong kiểm tra nguồn gốc cốt trà! Giảm 60% lượng khách và -40% doanh thu trong 10 đợt đơn!`
    : `Một clip TikToker tố quán dùng nguyên liệu bẩn bỗng lên xu hướng triệu view! Khách hàng e ngại quay lưng, lượng khách giảm 50% trong 10 đợt đơn!`;

  liveSync.pushToStore(targetStore.id, 'sabotaged', {
    sabotageType,
    cardName: card.name,
    title: alertTitle,
    message: alertDesc,
    attackerName: senderName,
    buffs: targetBuffs
  });

  const successMsg = isMarketInspection
    ? `👮 Đã điều Quản lý thị trường ập vào kiểm tra quán [${targetStore.store_name}]! Đối thủ bị niêm phong tạm thời, tụt 60% khách và mất 40% doanh thu trong 10 đợt!`
    : `📱 Đã tung clip bóc phốt thành công quán [${targetStore.store_name}]! Tin đồn lan truyền khắp mạng xã hội khiến đối thủ vắng khách và tụt 50% doanh thu trong 10 đợt!`;

  return {
    success: true,
    remainingCards: upgrades[cardId],
    upgrades,
    targetStoreName: targetStore.store_name,
    message: successMsg
  };
}

async function useSupportCard(storeId, cardId) {
  const card = UPGRADES[cardId];
  if (!card || !['defense_card', 'event_card', 'utility_card'].includes(card.type)) {
    return { success: false, message: 'Thẻ hỗ trợ không hợp lệ!' };
  }

  const save = await db.prepare('SELECT * FROM game_saves WHERE store_id = ?').get(storeId);
  if (!save) return { success: false, message: 'Cửa hàng không tồn tại' };

  const upgrades = JSON.parse(save.upgrades || '{}');
  const count = Number(upgrades[cardId] || 0);
  if (count <= 0) {
    return { success: false, message: `Bạn không còn [${card.name}]! Hãy vào Cửa Hàng Nâng Cấp để mua thêm.` };
  }

  // Deduct 1 card
  upgrades[cardId] = count - 1;

  const activeBuffs = JSON.parse(save.active_buffs || '{}');
  let successMessage = '';
  let patienceRefreshed = false;

  if (cardId === 'the_attp_5sao') {
    // Giải tỏa lệnh niêm phong của Quản Lý Thị Trường
    if (activeBuffs.sabotage && activeBuffs.sabotage.type === 'market_inspection') {
      delete activeBuffs.sabotage;
    }
    activeBuffs.attp_shield = {
      waves: 5,
      started_at: Date.now()
    };
    successMessage = '🛡️ ĐÃ TRÌNH GIẤY CHỨNG NHẬN ATTP 5 SAO! Đội Quản lý thị trường gỡ bỏ niêm phong, vãn hồi 100% khách hàng và uy tín cho quán!';
  } else if (cardId === 'the_dinh_chinh') {
    // Dập tắt tin đồn bóc phốt TikToker & lội ngược dòng +30%
    if (activeBuffs.sabotage && activeBuffs.sabotage.type === 'tiktoker_flop') {
      delete activeBuffs.sabotage;
    }
    if (activeBuffs.tiktoker_status === 'flop') {
      delete activeBuffs.tiktoker_status;
      delete activeBuffs.tiktoker_waves;
    }
    activeBuffs.dinh_chinh_buff = {
      waves: 5,
      bonusMultiplier: 1.3,
      started_at: Date.now()
    };
    successMessage = '🎥 VIDEO ĐÍNH CHÍNH & PHỎNG VẤN VIRAL! Clip giải oan minh bạch lên xu hướng, đập tan mọi phốt giả! Lượng khách & doanh thu tăng +30% trong 5 đợt đơn tiếp theo!';
  } else if (cardId === 'the_idol_trieu_view') {
    // Ca sĩ thần tượng nổi tiếng ghé check-in -> 15 đợt đơn bão khách
    activeBuffs.idol_viral = {
      waves: 15,
      started_at: Date.now()
    };
    successMessage = '🎤 HỢP ĐỒNG IDOL TRIỆU VIEW KÍCH HOẠT! Ca sĩ thần tượng nổi tiếng vừa ghé check-in và livestream! Bão fan hâm mộ xếp hàng vòng quanh phố trong 15 đợt đơn!';
  } else if (cardId === 'the_mua_giai_nhiet') {
    // Cơn mưa rào giải nhiệt -> hồi phục 50% kiên nhẫn
    patienceRefreshed = true;
    activeBuffs.cool_rain = {
      applied_at: Date.now()
    };
    successMessage = '🌧️ CƠN MƯA RÀO GIẢI NHIỆT MÁT RƯỢI! Không khí trong lành xua tan oi bức, hồi phục 50% thanh kiên nhẫn của toàn bộ khách hàng đang chờ tại quầy!';
  }

  const updatedSave = {
    store_id: storeId,
    chapter: save.chapter,
    day_in_game: save.day_in_game,
    money: save.money,
    debt_remaining: save.debt_remaining,
    reputation: save.reputation
  };
  const saveHash = anticheat.generateSaveHash(updatedSave);

  await db.prepare(`
    UPDATE game_saves 
    SET upgrades = ?, active_buffs = ?, save_hash = ?, updated_at = ? 
    WHERE store_id = ?
  `).run(JSON.stringify(upgrades), JSON.stringify(activeBuffs), saveHash, new Date().toISOString(), storeId);

  invalidateStoreCache(storeId);

  await db.prepare(`
    INSERT INTO audit_logs (store_id, event_type, detail, logged_at)
    VALUES (?, 'SUPPORT_CARD_USED', ?, ?)
  `).run(storeId, `Dùng thẻ hỗ trợ: [${card.name}]`, new Date().toISOString());

  // Push LiveSync update to client
  const liveSync = require('../live-sync.service');
  liveSync.pushToStore(storeId, 'state_updated', {
    message: successMessage,
    activeBuffs
  });

  return {
    success: true,
    cardId,
    remainingCards: upgrades[cardId],
    upgrades,
    activeBuffs,
    patienceRefreshed,
    message: successMessage
  };
}

module.exports = {
  buyUpgrade,
  useTalisman,
  useSabotageCard,
  useSupportCard,
  stealPet,
  redeemPet,
  shooThief
};

