const db = require('../../models/db');
const anticheat = require('../anticheat.service');
const { invalidateStoreCache } = require('./cache.helper');

// Pay debt to Anh Bảnh
async function payDebt(storeId, amount) {
  const save = await db.prepare('SELECT * FROM game_saves WHERE store_id = ?').get(storeId);
  if (!save) return { success: false, message: 'Cửa hàng không tồn tại' };

  if (save.money < amount) {
    return { success: false, message: 'Không đủ tiền mặt để trả nợ!' };
  }

  const newMoney = save.money - amount;
  const newDebt = Math.max(0, save.debt_remaining - amount);

  const updatedSave = {
    store_id: storeId,
    chapter: save.chapter,
    day_in_game: save.day_in_game,
    money: newMoney,
    debt_remaining: newDebt,
    reputation: save.reputation,
    teacoin: save.teacoin || 0
  };
  const hash = anticheat.generateSaveHash(updatedSave);

  await db.prepare(`
    UPDATE game_saves 
    SET money = ?, debt_remaining = ?, save_hash = ?, updated_at = ?
    WHERE store_id = ?
  `).run(newMoney, newDebt, hash, new Date().toISOString(), storeId);

  invalidateStoreCache(storeId);

  const canUnlockC2 = (newDebt === 0 && save.chapter === 1);

  return {
    success: true,
    money: newMoney,
    debt_remaining: newDebt,
    chapter: save.chapter,
    canUnlockChapter2: canUnlockC2,
    message: newDebt === 0 
      ? '🎉 TUYỆT VỜI! Bạn đã trả sạch 100% nợ nần cho Anh Bảnh! Bạn đã có thể Mở Khóa Chương 2: Cổng Parabol Bách Khoa Hà Nội!' 
      : `Đã trả ${amount.toLocaleString('vi-VN')}đ. Nợ còn lại: ${newDebt.toLocaleString('vi-VN')}đ.`
  };
}

// Unlock Chapter 2 (Move from rural hometown to HUST Hanoi Parabol Gate)
async function unlockChapter2(storeId) {
  const save = await db.prepare('SELECT * FROM game_saves WHERE store_id = ?').get(storeId);
  if (!save) return { success: false, message: 'Cửa hàng không tồn tại' };

  if (save.debt_remaining > 0) {
    return { 
      success: false, 
      message: `Bạn chưa trả hết nợ cho Anh Bảnh (còn nợ ${save.debt_remaining.toLocaleString('vi-VN')}đ). Phải trả sạch 100% nợ mới có thể mở Chương 2!` 
    };
  }

  if (save.chapter >= 2) {
    return { success: false, message: 'Bạn đã mở khóa Chương 2 rồi!' };
  }

  const newChapter = 2;

  const updatedSave = {
    store_id: storeId,
    chapter: newChapter,
    day_in_game: save.day_in_game,
    money: save.money,
    debt_remaining: 0,
    reputation: save.reputation,
    teacoin: save.teacoin || 0
  };
  const hash = anticheat.generateSaveHash(updatedSave);

  await db.prepare(`
    UPDATE game_saves 
    SET chapter = ?, debt_remaining = 0, save_hash = ?, updated_at = ?
    WHERE store_id = ?
  `).run(newChapter, hash, new Date().toISOString(), storeId);

  invalidateStoreCache(storeId);

  return {
    success: true,
    chapter: newChapter,
    money: save.money,
    costPaid: 0,
    message: '🎉 CHÚC MỪNG BẠN ĐÃ MỞ KHÓA CHƯƠNG 2: HƯƠNG TRÀ BÁCH KHOA - GIẤC MƠ THỦ ĐÔ! Xe trà sữa chính thức chuyển tới trước Cổng Parabol Đại học Bách Khoa Hà Nội!'
  };
}

// Police inspection with 10% fine chance and 90% reminder
async function policeFine(storeId, forceFine = false) {
  const save = await db.prepare('SELECT * FROM game_saves WHERE store_id = ?').get(storeId);
  if (!save) return { success: false, message: 'Cửa hàng không tồn tại' };

  const isFined = forceFine || (Math.random() < 0.10);

  if (!isFined) {
    return {
      success: true,
      isFined: false,
      fineAmount: 0,
      actualFinePaid: 0,
      money: save.money,
      message: '👮 CÔNG AN NHẮC NHỞ: Tổ tuần tra trật tự đô thị nhắc nhở quán thu dọn xe đẩy, không lấn chiếm lòng lề đường. Lần này bạn KHÔNG BỊ PHẠT TIỀN!'
    };
  }

  const fineAmount = 500000;
  const newMoney = Math.max(0, save.money - fineAmount);
  const actualFinePaid = save.money - newMoney;

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
    SET money = ?, save_hash = ?, updated_at = ?
    WHERE store_id = ?
  `).run(newMoney, hash, new Date().toISOString(), storeId);

  invalidateStoreCache(storeId);

  return {
    success: true,
    isFined: true,
    fineAmount,
    actualFinePaid,
    money: newMoney,
    message: '🚨 [TỈ LỆ 10% PHẠT] Tổ tuần tra đô thị lập biên bản xử phạt 500.000đ do vi phạm trật tự vỉa hè!'
  };
}

// Unlock Chapter 3 (Flagship Store 2 Tầng Phố Đi Bộ)
async function unlockChapter3(storeId) {
  const save = await db.prepare('SELECT * FROM game_saves WHERE store_id = ?').get(storeId);
  if (!save) return { success: false, message: 'Cửa hàng không tồn tại' };

  if ((save.chapter || 1) < 2) {
    return { success: false, message: 'Bạn cần hoàn thành Chương 1 trước khi mở khóa Chương 3!' };
  }

  if (save.chapter >= 3) {
    return { success: false, message: 'Bạn đã mở khóa Chương 3 rồi!' };
  }

  const TARGET_CAPITAL = 50000000;
  if (save.money < TARGET_CAPITAL) {
    return {
      success: false,
      message: `Chưa gom đủ 50.000.000đ vốn chuyển nhượng mặt bằng Phố Đi Bộ! Hiện có: ${save.money.toLocaleString('vi-VN')}đ (còn thiếu ${(TARGET_CAPITAL - save.money).toLocaleString('vi-VN')}đ).`
    };
  }

  const newChapter = 3;
  let recipes = [];
  try {
    recipes = JSON.parse(save.recipes || '["tra_sua_truyen_thong"]');
  } catch (e) {
    recipes = ['tra_sua_truyen_thong'];
  }
  if (!recipes.includes('tra_olong_nuong')) {
    recipes.push('tra_olong_nuong');
  }

  const updatedSave = {
    store_id: storeId,
    chapter: newChapter,
    day_in_game: save.day_in_game,
    money: save.money,
    debt_remaining: 0,
    reputation: Math.max(save.reputation, 4.5),
    teacoin: save.teacoin || 0
  };
  const hash = anticheat.generateSaveHash(updatedSave);

  await db.prepare(`
    UPDATE game_saves 
    SET chapter = ?, recipes = ?, reputation = ?, save_hash = ?, updated_at = ?
    WHERE store_id = ?
  `).run(newChapter, JSON.stringify(recipes), updatedSave.reputation, hash, new Date().toISOString(), storeId);

  invalidateStoreCache(storeId);

  return {
    success: true,
    chapter: newChapter,
    money: save.money,
    recipes,
    message: '🎉 ĐẠI CHIẾN CỔNG BÁCH KHOA TOÀN THẮNG! Lão Ba (Trâu Vàng) khâm phục khẩu phục, xin làm đối tác cung ứng trân châu thủ công! HeeHee chính thức khai trương CỬA HÀNG FLAGSHIP 2 TẦNG PHỐ ĐI BỘ LUNG LINH!'
  };
}

module.exports = {
  payDebt,
  unlockChapter2,
  unlockChapter3,
  policeFine
};
