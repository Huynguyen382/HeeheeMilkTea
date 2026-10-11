const db = require('../../models/db');
const anticheat = require('../anticheat.service');
const { RECIPES } = require('./constants');
const { invalidateStoreCache } = require('./cache.helper');

// --- HỆ THỐNG ỨNG VIÊN NPC BARISTA (ROADMAP SECTION II) ---
const NPC_CANDIDATES = {
  be_bap: {
    id: 'be_bap',
    name: 'Bé Bắp',
    role: 'Tập Sự Chăm Chỉ',
    avatar: '👧',
    baseRate: 16, // 16 ly/giờ
    costMargin: 0.10, // Giảm cost xuống 10% (tiết kiệm 15% nguyên liệu)
    tipPerCup: 1200,
    trait: 'Tiết Kiệm Nguyên Liệu',
    desc: 'Giảm 15% chi phí nguyên vật liệu. Nhanh nhẹn, hay cười, thỉnh thoảng vụng về đáng yêu!',
    quote: 'Dạ em pha trà sữa cẩn thận, tiết kiệm nguyên liệu cho chị HeeHee nha!'
  },
  anh_lam: {
    id: 'anh_lam',
    name: 'Anh Lâm',
    role: 'Chiến Thần Logistics',
    avatar: '🛵',
    baseRate: 19, // 16-22 ly/giờ (trung bình 19)
    costMargin: 0.25,
    tipPerCup: 1500,
    deliveryBonus: 0.25, // +25% giá trị đơn hàng
    trait: 'Ưu Tiên Shipper & Giao Đi',
    desc: 'Tăng 25% doanh thu các đơn hàng giao đi. Thao tác dứt khoát, đóng gói chuẩn chỉnh!',
    quote: 'Giao hỏa tốc, chốt đơn thần tốc! Cứ để anh Lâm lo em gái nhé!'
  },
  co_mai: {
    id: 'co_mai',
    name: 'Cô Mai',
    role: 'Nghệ Nhân Trà Cổ Truyền',
    avatar: '👵',
    baseRate: 14, // 12-16 ly/giờ
    costMargin: 0.25,
    tipPerCup: 1800, // Tip cao hơn (+20%)
    reputationBonus: 0.2,
    trait: 'Hương Vị Hoàn Hảo & Tăng Danh Tiếng',
    desc: 'Tăng 20% tiền boa Tip và tặng thêm +0.2 Điểm danh tiếng mỗi ca làm việc!',
    quote: 'Trà ngon phải ủ đúng điệu con à, khách thưởng thức là nhớ mãi không quên.'
  },
  bot_p800: {
    id: 'bot_p800',
    name: 'Barista Bot P-800',
    role: 'Công Nghệ Tương Lai',
    avatar: '🤖',
    baseRate: 22, // 20-24 ly/giờ
    costMargin: 0.22,
    tipPerCup: 1100,
    trait: 'Chính Xác Tuyệt Đối 100%',
    desc: 'Năng suất tối đa, chuẩn xác từng mililít, không bao giờ làm hỏng ly!',
    quote: 'BEEP-BOOP! NĂNG SUẤT TỐI ĐA 100%. KHÔNG PHÁT SINH LỖI KỸ THUẬT.'
  }
};

const HOURLY_TEACOIN_RATE = 5; // Chuẩn 5 TeaCoin/giờ
const MAX_OFFLINE_HOURS_CAP = 12; // Giới hạn trần 12h/ca
const MAX_HOURLY_CUPS_RATE_LIMIT = 30; // Roadmap VI.3: Không bao giờ vượt quá 30 ly/giờ
const CHAPTER_UNLOCK_REQUIRED = 3; // Mở khóa khi hoàn thành C2 (sang C3 Flagship hoặc đạt mốc 50Tr ở C2)

function isStaffFeatureUnlocked(save, contract = null) {
  if (!save) return false;
  return true;
}

function formatWorkedDuration(ms) {
  const totalMins = Math.max(1, Math.round(Math.max(0, ms) / 60000));
  const h = Math.floor(totalMins / 60);
  const m = totalMins % 60;
  if (h > 0 && m > 0) return `${h} giờ ${m} phút`;
  if (h > 0) return `${h} giờ`;
  return `${m} phút`;
}

/**
 * Thuật toán tính toán doanh thu offline tích lũy dựa trên công thức Roadmap Phần III & Phần VI
 */
async function settleContractOffline(storeId, save = null, contract = null) {
  if (!save) {
    save = await db.prepare('SELECT * FROM game_saves WHERE store_id = ?').get(storeId);
  }
  if (!contract) {
    contract = await db.prepare('SELECT * FROM npc_staff_contracts WHERE store_id = ?').get(storeId);
  }
  if (!save || !contract || !contract.is_active) {
    return { contract, save, newlySettledMoney: 0, newlySettledCups: 0 };
  }

  const now = Date.now();
  let lastSettled = Number(contract.last_settled_at || contract.hired_at);
  let expiresAt = Number(contract.expires_at);

  if (now <= lastSettled) {
    return { contract, save, newlySettledMoney: 0, newlySettledCups: 0 };
  }

  // Xử lý tự động gia hạn (Auto-Renew) nếu có tích chọn và còn đủ TeaCoin
  if (now > expiresAt && contract.auto_renew === 1) {
    const expiredHours = Math.ceil((now - expiresAt) / (3600 * 1000));
    const renewHours = Math.min(expiredHours, 8); // Tối đa 8h gia hạn mỗi lần
    const requiredTeaCoin = renewHours * HOURLY_TEACOIN_RATE;

    if ((save.teacoin || 0) >= requiredTeaCoin) {
      const newTeaCoin = save.teacoin - requiredTeaCoin;
      expiresAt += renewHours * 3600 * 1000;
      const newDuration = Number(contract.hire_duration_hours || 1) + renewHours;
      save.teacoin = newTeaCoin;

      const hash = anticheat.generateSaveHash(save);
      await db.prepare('UPDATE game_saves SET teacoin = ?, save_hash = ?, updated_at = ? WHERE store_id = ?')
        .run(newTeaCoin, hash, new Date().toISOString(), storeId);

      await db.prepare('UPDATE npc_staff_contracts SET expires_at = ?, hire_duration_hours = ? WHERE store_id = ?')
        .run(expiresAt, newDuration, storeId);
      contract.expires_at = expiresAt;
      contract.hire_duration_hours = newDuration;
    } else {
      // Roadmap VI: Nếu không đủ 5 TeaCoin khi gia hạn tự động, tắt auto_renew
      await db.prepare('UPDATE npc_staff_contracts SET auto_renew = 0 WHERE store_id = ?').run(storeId);
      contract.auto_renew = 0;
    }
  }

  const effectiveEnd = Math.min(now, expiresAt);
  if (effectiveEnd <= lastSettled) {
    if (now >= expiresAt && contract.is_active === 1) {
      await db.prepare('UPDATE npc_staff_contracts SET is_active = 0 WHERE store_id = ?').run(storeId);
      contract.is_active = 0;
    }
    return { contract, save, newlySettledMoney: 0, newlySettledCups: 0 };
  }

  // Thời gian offline hợp lệ (giờ) - Giới hạn trần 12h/ca (Roadmap III.1.A & VI.2)
  const elapsedHours = (effectiveEnd - lastSettled) / (3600 * 1000);
  const validHours = Math.min(elapsedHours, MAX_OFFLINE_HOURS_CAP);

  const candidate = NPC_CANDIDATES[contract.npc_id] || NPC_CANDIDATES.be_bap;
  const baseRate = candidate.baseRate;
  const rep = Number(save.reputation || 5.0);

  // Hệ số nâng cấp quầy máy móc M_upgrade (Roadmap III.1.B)
  let upgrades = {};
  try {
    upgrades = typeof save.upgrades === 'string' ? JSON.parse(save.upgrades) : (save.upgrades || {});
  } catch (e) {}
  let mUpgrade = 1.0;
  if (upgrades.may_dap_nap || upgrades.auto_sealer || upgrades.machine_seal) mUpgrade += 0.15;
  if (upgrades.may_lac_sieu_toc || upgrades.shaker_pro || upgrades.staff_anh_lam_captain) mUpgrade += 0.25;
  if (candidate.deliveryBonus) mUpgrade += candidate.deliveryBonus;

  // Tốc độ bán mỗi giờ (Giới hạn Rate Limit <= 30 ly/giờ theo Roadmap VI.3)
  const repFactor = Math.max(0.5, 1 + (rep - 5.0) / 10);
  const hourlyCupRate = Math.min(MAX_HOURLY_CUPS_RATE_LIMIT, baseRate * repFactor * mUpgrade);

  const isExpiredNow = now >= expiresAt;
  const exactCups = validHours * hourlyCupRate;
  const nCups = isExpiredNow ? Math.round(exactCups) : Math.floor(exactCups);

  if (nCups < 1) {
    if (isExpiredNow && contract.is_active === 1) {
      await db.prepare('UPDATE npc_staff_contracts SET is_active = 0, last_settled_at = ? WHERE store_id = ?')
        .run(effectiveEnd, storeId);
      contract.is_active = 0;
      contract.last_settled_at = effectiveEnd;
    }
    return { contract, save, newlySettledMoney: 0, newlySettledCups: 0 };
  }

  // Tiến mốc last_settled_at tương ứng với số ly đã chốt (giữ phần lẻ thời gian cho lần sau nếu chưa hết ca)
  const settledMs = isExpiredNow
    ? (effectiveEnd - lastSettled)
    : Math.min(effectiveEnd - lastSettled, Math.round((nCups / hourlyCupRate) * 3600 * 1000));
  const newLastSettled = lastSettled + settledMs;

  // Giá trung bình các món đã mở khóa (Roadmap III.1.C)
  let unlockedRecipes = [];
  try {
    unlockedRecipes = typeof save.recipes === 'string' ? JSON.parse(save.recipes) : (save.recipes || []);
  } catch (e) {}
  if (!Array.isArray(unlockedRecipes) || unlockedRecipes.length === 0) {
    unlockedRecipes = ['tra_sua_truyen_thong'];
  }

  let customPrices = {};
  try {
    customPrices = typeof save.custom_prices === 'string' ? JSON.parse(save.custom_prices) : (save.custom_prices || {});
  } catch (e) {}

  let totalPrice = 0;
  unlockedRecipes.forEach(rId => {
    const r = RECIPES[rId];
    const baseP = r ? r.basePrice : 32000;
    const customP = Number(customPrices[rId]);
    // Cho phép hưởng giá menu tùy chỉnh hợp lý (tối đa +25% để tránh lạm phát offline)
    const effectiveP = (customP && customP > 0) ? Math.min(Math.round(baseP * 1.25), customP) : baseP;
    totalPrice += effectiveP;
  });
  let avgPrice = totalPrice / unlockedRecipes.length;

  // Thưởng chuỗi chi nhánh (Bonus_franchise) & Nông trại hữu cơ Mộc Châu (Bonus_organic)
  let franchises = [];
  try {
    franchises = typeof save.franchises === 'string' ? JSON.parse(save.franchises) : (save.franchises || []);
  } catch (e) {}
  let activeBuffs = {};
  try {
    activeBuffs = typeof save.active_buffs === 'string' ? JSON.parse(save.active_buffs) : (save.active_buffs || {});
  } catch (e) {}

  let bonusMultiplier = 0;
  if ((Array.isArray(franchises) && franchises.length > 0) || Number(save.chapter || 1) >= 4) {
    bonusMultiplier += 0.20; // +20% Chuỗi nhượng quyền
  }
  if (Number(activeBuffs.organic_signature || 0) > 0) {
    bonusMultiplier += 0.15; // +15% Trà hữu cơ Mộc Châu
  }
  avgPrice *= (1 + bonusMultiplier);

  // Lợi nhuận ròng R_net (Roadmap III.1.D)
  const costMargin = candidate.costMargin || 0.25;
  const tipPerCup = candidate.tipPerCup || 1200;
  const netRevenue = Math.round(nCups * (avgPrice * (1 - costMargin) + tipPerCup));

  const newAccMoney = Number(contract.accumulated_money || 0) + netRevenue;
  const newAccCups = Number(contract.accumulated_cups || 0) + nCups;
  const isStillActive = now < expiresAt ? 1 : 0;

  await db.prepare(`
    UPDATE npc_staff_contracts
    SET accumulated_money = ?, accumulated_cups = ?, last_settled_at = ?, is_active = ?
    WHERE store_id = ?
  `).run(newAccMoney, newAccCups, newLastSettled, isStillActive, storeId);

  contract.accumulated_money = newAccMoney;
  contract.accumulated_cups = newAccCups;
  contract.last_settled_at = newLastSettled;
  contract.is_active = isStillActive;

  return {
    contract,
    save,
    newlySettledMoney: netRevenue,
    newlySettledCups: nCups,
    settledHours: settledMs / (3600 * 1000)
  };
}

/**
 * Lấy trạng thái nhân viên đang làm việc & thông tin mở khóa tiến trình
 */
async function getStaffStatus(storeId) {
  const save = await db.prepare('SELECT * FROM game_saves WHERE store_id = ?').get(storeId);
  if (!save) throw new Error('Không tìm thấy dữ liệu cửa hàng');

  let contract = await db.prepare('SELECT * FROM npc_staff_contracts WHERE store_id = ?').get(storeId);
  const currentChapter = Number(save.chapter || 1);
  const chapterGoalMoney = 50000000; // 50 triệu mở Chương 3
  const isUnlocked = isStaffFeatureUnlocked(save, contract);

  // Nếu có hợp đồng, tiến hành chốt doanh thu offline mới nhất
  if (contract) {
    const settlement = await settleContractOffline(storeId, save, contract);
    contract = settlement.contract;
  }

  const now = Date.now();
  let activeStaff = null;

  if (contract && contract.is_active && contract.expires_at > now) {
    const cand = NPC_CANDIDATES[contract.npc_id] || NPC_CANDIDATES.be_bap;
    const remainingMs = Math.max(0, contract.expires_at - now);
    const remainingHours = Math.floor(remainingMs / (3600 * 1000));
    const remainingMins = Math.floor((remainingMs % (3600 * 1000)) / (60 * 1000));
    const workedMs = Math.max(0, Math.min(now, Number(contract.expires_at)) - Number(contract.hired_at));
    const totalHoursHired = Number(contract.hire_duration_hours || 1);

    activeStaff = {
      npcId: contract.npc_id,
      name: cand.name,
      role: cand.role,
      avatar: cand.avatar,
      baseRate: cand.baseRate,
      trait: cand.trait,
      quote: cand.quote,
      hiredAt: contract.hired_at,
      expiresAt: contract.expires_at,
      workedTimeFormatted: formatWorkedDuration(workedMs),
      teacoinSpent: Math.round(totalHoursHired * (contract.hourly_rate || HOURLY_TEACOIN_RATE)),
      reputationGain: cand.reputationBonus || 0.1,
      remainingTimeFormatted: `${remainingHours}h ${remainingMins}m`,
      remainingMinutes: Math.ceil(remainingMs / 60000),
      autoRenew: !!contract.auto_renew,
      accumulatedMoney: Number(contract.accumulated_money || 0),
      accumulatedCups: Number(contract.accumulated_cups || 0),
      hourlyRate: contract.hourly_rate || HOURLY_TEACOIN_RATE
    };
  } else if (contract && Number(contract.accumulated_money || 0) > 0) {
    // Ca làm đã kết thúc nhưng vẫn còn tiền tích lũy chờ nhận
    const cand = NPC_CANDIDATES[contract.npc_id] || NPC_CANDIDATES.be_bap;
    const workedMs = Math.max(0, Number(contract.expires_at) - Number(contract.hired_at));
    const totalHoursHired = Number(contract.hire_duration_hours || 1);

    activeStaff = {
      npcId: contract.npc_id,
      name: cand.name,
      role: cand.role,
      avatar: cand.avatar,
      baseRate: cand.baseRate,
      trait: cand.trait,
      quote: cand.quote,
      expired: true,
      workedTimeFormatted: formatWorkedDuration(workedMs),
      teacoinSpent: Math.round(totalHoursHired * (contract.hourly_rate || HOURLY_TEACOIN_RATE)),
      reputationGain: cand.reputationBonus || 0.1,
      remainingTimeFormatted: 'Đã hết ca',
      remainingMinutes: 0,
      accumulatedMoney: Number(contract.accumulated_money || 0),
      accumulatedCups: Number(contract.accumulated_cups || 0),
      hourlyRate: contract.hourly_rate || HOURLY_TEACOIN_RATE
    };
  }

  return {
    isUnlocked,
    currentChapter,
    chapterGoalMoney,
    currentMoney: Number(save.money || 0),
    teacoin: Number(save.teacoin || 0),
    hourlyRate: HOURLY_TEACOIN_RATE,
    activeStaff,
    candidates: Object.values(NPC_CANDIDATES)
  };
}

/**
 * Thuê nhân viên trực quầy (Yêu cầu hoàn thành C2 / mở C3 & đủ TeaCoin)
 */
async function hireStaff(storeId, npcId, hours = 1, autoRenew = false) {
  const save = await db.prepare('SELECT * FROM game_saves WHERE store_id = ?').get(storeId);
  if (!save) throw new Error('Không tìm thấy dữ liệu cửa hàng');

  let existing = await db.prepare('SELECT * FROM npc_staff_contracts WHERE store_id = ?').get(storeId);
  if (!isStaffFeatureUnlocked(save, existing)) {
    throw new Error('Tính năng chưa khả dụng! Bạn cần hoàn thành Chương 2 và mở Cửa Hàng Flagship Phố Đi Bộ (Chương 3) để tuyển dụng nhân viên trực quầy!');
  }

  const cand = NPC_CANDIDATES[npcId];
  if (!cand) throw new Error('Ứng viên nhân viên không hợp lệ!');

  const hireHours = Math.max(1, Math.min(24, Number(hours) || 1));
  const totalCostTeaCoin = hireHours * HOURLY_TEACOIN_RATE;

  if ((save.teacoin || 0) < totalCostTeaCoin) {
    throw new Error(`Bạn không đủ TeaCoin! Cần ${totalCostTeaCoin} TeaCoin để thuê ${hireHours} giờ (Hiện có: ${save.teacoin || 0} TeaCoin). Hãy làm nhiệm vụ hoặc ghé phòng bạn bè để kiếm thêm!`);
  }

  // Chốt và lưu lại hợp đồng cũ nếu còn tiền tích lũy
  let carryOverMoney = 0;
  let carryOverCups = 0;
  if (existing) {
    const settlement = await settleContractOffline(storeId, save, existing);
    carryOverMoney = Number(settlement.contract.accumulated_money || 0);
    carryOverCups = Number(settlement.contract.accumulated_cups || 0);
  }

  // Khấu trừ TeaCoin
  const newTeaCoin = (save.teacoin || 0) - totalCostTeaCoin;
  save.teacoin = newTeaCoin;
  const hash = anticheat.generateSaveHash(save);

  await db.prepare('UPDATE game_saves SET teacoin = ?, save_hash = ?, updated_at = ? WHERE store_id = ?')
    .run(newTeaCoin, hash, new Date().toISOString(), storeId);

  const now = Date.now();
  const expiresAt = now + hireHours * 3600 * 1000;

  if (existing) {
    await db.prepare(`
      UPDATE npc_staff_contracts
      SET npc_id = ?, hourly_rate = ?, hired_at = ?, hire_duration_hours = ?,
          expires_at = ?, last_settled_at = ?, auto_renew = ?, accumulated_money = ?,
          accumulated_cups = ?, is_active = 1, created_at = ?
      WHERE store_id = ?
    `).run(
      npcId, HOURLY_TEACOIN_RATE, now, hireHours,
      expiresAt, now, autoRenew ? 1 : 0, carryOverMoney,
      carryOverCups, now, storeId
    );
  } else {
    await db.prepare(`
      INSERT INTO npc_staff_contracts (
        store_id, npc_id, hourly_rate, hired_at, hire_duration_hours,
        expires_at, last_settled_at, auto_renew, accumulated_money,
        accumulated_cups, is_active, created_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1, ?)
    `).run(
      storeId, npcId, HOURLY_TEACOIN_RATE, now, hireHours,
      expiresAt, now, autoRenew ? 1 : 0, carryOverMoney,
      carryOverCups, now
    );
  }

  invalidateStoreCache(storeId);

  const activeStaff = {
    npcId: cand.id,
    name: cand.name,
    role: cand.role,
    avatar: cand.avatar,
    baseRate: cand.baseRate,
    trait: cand.trait,
    quote: cand.quote,
    hiredAt: now,
    expiresAt,
    workedTimeFormatted: '1 phút',
    teacoinSpent: totalCostTeaCoin,
    reputationGain: cand.reputationBonus || 0.1,
    remainingTimeFormatted: `${hireHours}h 0m`,
    remainingMinutes: hireHours * 60,
    autoRenew: !!autoRenew,
    accumulatedMoney: carryOverMoney,
    accumulatedCups: carryOverCups,
    hourlyRate: HOURLY_TEACOIN_RATE,
    expired: false
  };

  return {
    success: true,
    message: `🎉 Ký hợp đồng thành công với ${cand.name}! Đã thanh toán -${totalCostTeaCoin} TeaCoin cho ca trực ${hireHours} giờ.`,
    npc: cand,
    hireHours,
    totalCostTeaCoin,
    teacoin: newTeaCoin,
    expiresAt,
    activeStaff,
    contract: activeStaff
  };
}

/**
 * Gia hạn thêm thời gian thuê cho nhân viên đang trực quầy
 */
async function extendContract(storeId, additionalHours = 1) {
  const save = await db.prepare('SELECT * FROM game_saves WHERE store_id = ?').get(storeId);
  if (!save) throw new Error('Không tìm thấy dữ liệu cửa hàng');

  const contract = await db.prepare('SELECT * FROM npc_staff_contracts WHERE store_id = ?').get(storeId);
  if (!isStaffFeatureUnlocked(save, contract)) {
    throw new Error('Tính năng chưa mở khóa ở chương này!');
  }

  if (!contract) {
    throw new Error('Bạn chưa có hợp đồng thuê nhân viên nào để gia hạn!');
  }

  const addHours = Math.max(1, Math.min(24, Number(additionalHours) || 1));
  const totalCostTeaCoin = addHours * HOURLY_TEACOIN_RATE;

  if ((save.teacoin || 0) < totalCostTeaCoin) {
    throw new Error(`Bạn cần ${totalCostTeaCoin} TeaCoin để gia hạn ${addHours} giờ (Hiện có: ${save.teacoin || 0} TeaCoin)!`);
  }

  // Khấu trừ TeaCoin
  const newTeaCoin = (save.teacoin || 0) - totalCostTeaCoin;
  save.teacoin = newTeaCoin;
  const hash = anticheat.generateSaveHash(save);

  await db.prepare('UPDATE game_saves SET teacoin = ?, save_hash = ?, updated_at = ? WHERE store_id = ?')
    .run(newTeaCoin, hash, new Date().toISOString(), storeId);

  const now = Date.now();
  const baseExpiry = Math.max(now, Number(contract.expires_at));
  const newExpiresAt = baseExpiry + addHours * 3600 * 1000;
  const newDuration = Number(contract.hire_duration_hours || 1) + addHours;

  await db.prepare(`
    UPDATE npc_staff_contracts
    SET expires_at = ?, hire_duration_hours = ?, is_active = 1
    WHERE store_id = ?
  `).run(newExpiresAt, newDuration, storeId);

  invalidateStoreCache(storeId);

  const statusAfter = await getStaffStatus(storeId);

  return {
    success: true,
    message: `🔄 Gia hạn thành công thêm ${addHours} giờ! Tiêu tốn ${totalCostTeaCoin} TeaCoin.`,
    newExpiresAt,
    teacoin: newTeaCoin,
    activeStaff: statusAfter.activeStaff,
    contract: statusAfter.activeStaff
  };
}

/**
 * Thu hoạch toàn bộ doanh thu offline tích lũy cộng vào game_saves.money
 */
async function claimOfflineRevenue(storeId) {
  const save = await db.prepare('SELECT * FROM game_saves WHERE store_id = ?').get(storeId);
  if (!save) throw new Error('Không tìm thấy dữ liệu cửa hàng');

  let contract = await db.prepare('SELECT * FROM npc_staff_contracts WHERE store_id = ?').get(storeId);
  if (!contract) throw new Error('Không có ca làm việc nào để thu hoạch');

  // Chốt doanh thu mới nhất
  const settlement = await settleContractOffline(storeId, save, contract);
  contract = settlement.contract;

  const claimedMoney = Number(contract.accumulated_money || 0);
  const claimedCups = Number(contract.accumulated_cups || 0);

  if (claimedMoney <= 0) {
    return {
      success: false,
      message: 'Chưa có doanh thu tích lũy mới để nhận!',
      claimedMoney: 0,
      claimedCups: 0
    };
  }

  const newMoney = Number(save.money || 0) + claimedMoney;
  let newRep = Number(save.reputation || 5.0);
  const cand = NPC_CANDIDATES[contract.npc_id] || NPC_CANDIDATES.be_bap;
  const repGain = Number(cand.reputationBonus || 0.1);
  newRep = Math.min(5.0, Number((newRep + repGain).toFixed(1)));

  save.money = newMoney;
  save.reputation = newRep;
  const hash = anticheat.generateSaveHash(save);

  await db.prepare(`
    UPDATE game_saves
    SET money = ?, reputation = ?, save_hash = ?, updated_at = ?
    WHERE store_id = ?
  `).run(newMoney, newRep, hash, new Date().toISOString(), storeId);

  // Cộng doanh thu & số ly của NPC vào thống kê doanh thu trong ngày (daily_stats)
  try {
    await anticheat.getOrCreateDailyStats(storeId, save.chapter || 1);
    const d = new Date();
    const utc = d.getTime() + (d.getTimezoneOffset() * 60000);
    const realDate = new Date(utc + (3600000 * 7)).toISOString().slice(0, 10);
    await db.prepare(`
      UPDATE daily_stats
      SET earned_today = earned_today + ?,
          orders_served = orders_served + ?,
          shift_earned = shift_earned + ?,
          shift_orders = shift_orders + ?
      WHERE store_id = ? AND real_date = ?
    `).run(claimedMoney, claimedCups, claimedMoney, claimedCups, storeId, realDate);
  } catch (e) {}

  // Reset tiền tích lũy trong hợp đồng
  await db.prepare(`
    UPDATE npc_staff_contracts
    SET accumulated_money = 0, accumulated_cups = 0
    WHERE store_id = ?
  `).run(storeId);

  invalidateStoreCache(storeId);

  return {
    success: true,
    message: `💰 Nhận thành công +${claimedMoney.toLocaleString('vi-VN')}đ & +${repGain}⭐ từ ca trực của ${cand.name} (${claimedCups} ly trà)!`,
    claimedMoney,
    claimedCups,
    reputationGain: repGain,
    newMoney,
    newReputation: newRep,
    npc: cand
  };
}

/**
 * Cho nhân viên nghỉ ca sớm & hoàn lại TeaCoin các giờ trọn vẹn chưa dùng
 */
async function terminateContract(storeId) {
  const save = await db.prepare('SELECT * FROM game_saves WHERE store_id = ?').get(storeId);
  if (!save) throw new Error('Không tìm thấy dữ liệu cửa hàng');

  let contract = await db.prepare('SELECT * FROM npc_staff_contracts WHERE store_id = ?').get(storeId);
  if (!contract || !contract.is_active) {
    throw new Error('Hiện không có ca làm việc nào đang kích hoạt!');
  }

  // Chốt doanh thu cho đến phút hiện tại
  await settleContractOffline(storeId, save, contract);

  const now = Date.now();
  const remainingMs = Number(contract.expires_at) - now;
  const unusedFullHours = Math.max(0, Math.floor(remainingMs / (3600 * 1000)));
  const refundTeaCoin = unusedFullHours * HOURLY_TEACOIN_RATE;

  let newTeaCoin = Number(save.teacoin || 0);
  if (refundTeaCoin > 0) {
    newTeaCoin += refundTeaCoin;
    save.teacoin = newTeaCoin;
    const hash = anticheat.generateSaveHash(save);
    await db.prepare('UPDATE game_saves SET teacoin = ?, save_hash = ?, updated_at = ? WHERE store_id = ?')
      .run(newTeaCoin, hash, new Date().toISOString(), storeId);
  }

  await db.prepare(`
    UPDATE npc_staff_contracts
    SET is_active = 0, expires_at = ?
    WHERE store_id = ?
  `).run(now, storeId);

  invalidateStoreCache(storeId);

  return {
    success: true,
    message: `Đã kết thúc ca làm việc sớm.${refundTeaCoin > 0 ? ` Hoàn lại +${refundTeaCoin} TeaCoin cho ${unusedFullHours} giờ chưa dùng.` : ''}`,
    refundTeaCoin,
    teacoin: newTeaCoin
  };
}

module.exports = {
  NPC_CANDIDATES,
  HOURLY_TEACOIN_RATE,
  MAX_OFFLINE_HOURS_CAP,
  CHAPTER_UNLOCK_REQUIRED,
  settleContractOffline,
  getStaffStatus,
  hireStaff,
  extendContract,
  claimOfflineRevenue,
  terminateContract
};

