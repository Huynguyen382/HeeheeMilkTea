const db = require('../../models/db');
const anticheat = require('../anticheat.service');
const { invalidateStoreCache } = require('./cache.helper');

const DAILY_QUESTS_TEMPLATE = [
  {
    id: 'quest_checkin',
    icon: '🌅',
    title: 'Điểm Danh Đầu Ngày',
    desc: 'Mở quán chào ngày mới và pha ly trà sữa đầu tiên',
    target: 1,
    rewardTeaCoin: 5,
    rewardMoney: 0
  },
  {
    id: 'quest_serve_5',
    icon: '🧋',
    title: 'Pha Chế Chuyên Cần',
    desc: 'Phục vụ thành công 5 ly trà sữa cho khách hàng',
    target: 5,
    rewardTeaCoin: 10,
    rewardMoney: 20000
  },
  {
    id: 'quest_variety_2',
    icon: '🍵',
    title: 'Đa Dạng Hương Vị',
    desc: 'Pha chế ít nhất 2 loại trà sữa khác nhau trong menu',
    target: 2,
    rewardTeaCoin: 10,
    rewardMoney: 0
  },
  {
    id: 'quest_friend_gift',
    icon: '🎁',
    title: 'Tình Bạn Tri Kỷ',
    desc: 'Gửi quà tình bạn cho 1 người bạn trong danh sách bạn bè',
    target: 1,
    rewardTeaCoin: 10,
    rewardMoney: 0
  },
  {
    id: 'quest_patrol_vigilant',
    icon: '🛡️',
    title: 'Bán Hàng Cảnh Giác',
    desc: 'Dùng Bùa Ẩn Thân né kiểm tra hoặc ném dép xua đuổi kẻ trộm',
    target: 1,
    rewardTeaCoin: 15,
    rewardMoney: 0
  }
];

const ALL_QUESTS_BONUS_TEACOIN = 25;

function getOrInitDailyQuests(save) {
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
  DAILY_QUESTS_TEMPLATE.forEach(t => {
    if (!dailyQuests.quests[t.id]) {
      dailyQuests.quests[t.id] = { progress: t.id === 'quest_checkin' ? 1 : 0, claimed: false };
    }
  });

  return dailyQuests;
}

async function updateDailyQuestProgress(storeId, type, data = {}) {
  const save = await db.prepare('SELECT * FROM game_saves WHERE store_id = ?').get(storeId);
  if (!save) return;

  const dailyQuests = getOrInitDailyQuests(save);
  let changed = false;

  if (type === 'friend_gift') {
    if (dailyQuests.quests.quest_friend_gift && dailyQuests.quests.quest_friend_gift.progress < 1) {
      dailyQuests.quests.quest_friend_gift.progress = 1;
      changed = true;
    }
  } else if (type === 'vigilant') {
    if (dailyQuests.quests.quest_patrol_vigilant && dailyQuests.quests.quest_patrol_vigilant.progress < 1) {
      dailyQuests.quests.quest_patrol_vigilant.progress = 1;
      changed = true;
    }
  }

  if (changed) {
    await db.prepare('UPDATE game_saves SET daily_quests = ?, updated_at = ? WHERE store_id = ?')
      .run(JSON.stringify(dailyQuests), new Date().toISOString(), storeId);
    invalidateStoreCache(storeId);
  }
}

async function getDailyQuests(storeId) {
  const save = await db.prepare('SELECT * FROM game_saves WHERE store_id = ?').get(storeId);
  if (!save) return { success: false, message: 'Cửa hàng không tồn tại' };

  const dailyQuests = getOrInitDailyQuests(save);
  const currentDay = save.day_in_game || 1;
  const teacoin = save.teacoin || 0;

  const questList = DAILY_QUESTS_TEMPLATE.map(t => {
    const q = dailyQuests.quests[t.id] || { progress: 0, claimed: false };
    const progress = Math.min(t.target, q.progress || 0);
    const isCompleted = progress >= t.target;
    return {
      ...t,
      progress,
      isCompleted,
      claimed: !!q.claimed
    };
  });

  const completedCount = questList.filter(q => q.isCompleted).length;
  const allCompleted = completedCount === DAILY_QUESTS_TEMPLATE.length;

  return {
    success: true,
    day: currentDay,
    teacoin,
    quests: questList,
    completedCount,
    totalQuests: DAILY_QUESTS_TEMPLATE.length,
    allCompleted,
    allBonusClaimed: !!dailyQuests.allCompletedBonusClaimed,
    allBonusTeaCoin: ALL_QUESTS_BONUS_TEACOIN
  };
}

async function claimDailyQuest(storeId, questId) {
  const save = await db.prepare('SELECT * FROM game_saves WHERE store_id = ?').get(storeId);
  if (!save) return { success: false, message: 'Cửa hàng không tồn tại' };

  const dailyQuests = getOrInitDailyQuests(save);
  let newTeaCoin = save.teacoin || 0;
  let newMoney = save.money || 0;
  let rewardMsg = '';

  if (questId === 'all_bonus') {
    if (dailyQuests.allCompletedBonusClaimed) {
      return { success: false, message: 'Bạn đã nhận Rương Chuyên Cần hôm nay rồi!' };
    }
    const allDone = DAILY_QUESTS_TEMPLATE.every(t => {
      const q = dailyQuests.quests[t.id];
      return q && q.progress >= t.target;
    });
    if (!allDone) {
      return { success: false, message: 'Bạn chưa hoàn thành đủ cả 5 nhiệm vụ hôm nay!' };
    }

    dailyQuests.allCompletedBonusClaimed = true;
    newTeaCoin += ALL_QUESTS_BONUS_TEACOIN;
    rewardMsg = `🎉 Nhận Rương Chuyên Cần thành công! +${ALL_QUESTS_BONUS_TEACOIN} 🍵 TeaCoin!`;
  } else {
    const template = DAILY_QUESTS_TEMPLATE.find(t => t.id === questId);
    if (!template) {
      return { success: false, message: 'Nhiệm vụ không hợp lệ' };
    }

    const q = dailyQuests.quests[questId];
    if (!q || (q.progress || 0) < template.target) {
      return { success: false, message: 'Nhiệm vụ chưa hoàn thành!' };
    }
    if (q.claimed) {
      return { success: false, message: 'Bạn đã nhận thưởng nhiệm vụ này rồi!' };
    }

    q.claimed = true;
    newTeaCoin += template.rewardTeaCoin;
    if (template.rewardMoney > 0) {
      newMoney += template.rewardMoney;
    }

    rewardMsg = `🎉 Hoàn thành [${template.title}]! Nhận +${template.rewardTeaCoin} 🍵 TeaCoin${template.rewardMoney > 0 ? ` & +${template.rewardMoney.toLocaleString('vi-VN')}đ` : ''}!`;
  }

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
    SET money = ?, teacoin = ?, daily_quests = ?, save_hash = ?, updated_at = ?
    WHERE store_id = ?
  `).run(newMoney, newTeaCoin, JSON.stringify(dailyQuests), hash, new Date().toISOString(), storeId);

  invalidateStoreCache(storeId);

  const rewardTeaCoinClaimed = (questId === 'all_bonus') 
    ? ALL_QUESTS_BONUS_TEACOIN 
    : (DAILY_QUESTS_TEMPLATE.find(t => t.id === questId)?.rewardTeaCoin || 0);

  return {
    success: true,
    teacoin: newTeaCoin,
    money: newMoney,
    reward_teacoin: rewardTeaCoinClaimed,
    message: rewardMsg
  };
}

module.exports = {
  DAILY_QUESTS_TEMPLATE,
  ALL_QUESTS_BONUS_TEACOIN,
  getOrInitDailyQuests,
  updateDailyQuestProgress,
  getDailyQuests,
  claimDailyQuest
};
