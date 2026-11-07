const db = require('../../models/db');
const anticheat = require('../anticheat.service');
const { invalidateStoreCache } = require('./cache.helper');
const { updateDailyQuestProgress } = require('./quest.service');

const GIFT_CONFIGS = {
  friendship_box: {
    id: 'friendship_box',
    name: 'Hộp Quà Tình Bạn Tri Kỷ',
    icon: '🎁',
    money: 10000,
    teacoin: 5,
    ingredients: { tea: 5, pearls: 5 },
    senderMoney: 10000,
    senderTeaCoin: 5,
    desc: '+10.000đ, +5 TeaCoin & 5 Trân Châu + 5 Trà'
  },
  tea_supply: {
    id: 'tea_supply',
    name: 'Tiếp Tế Trà Mộc Châu',
    icon: '🍵',
    money: 0,
    teacoin: 5,
    ingredients: { tea: 15 },
    senderMoney: 0,
    senderTeaCoin: 5,
    desc: '+15 Cốt Trà Mộc Châu tươi mát'
  },
  pearl_supply: {
    id: 'pearl_supply',
    name: 'Tiếp Tế Trân Châu Thủ Công',
    icon: '🧋',
    money: 0,
    teacoin: 5,
    ingredients: { pearls: 15 },
    senderMoney: 0,
    senderTeaCoin: 5,
    desc: '+15 Trân Châu Đen dẻo quánh'
  },
  room_cheer: {
    id: 'room_cheer',
    name: 'Thiệp Khen & Thả Tim Căn Phòng',
    icon: '❤️',
    money: 0,
    teacoin: 50,
    ingredients: {},
    senderMoney: 0,
    senderTeaCoin: 0,
    desc: '+50 TeaCoin'
  }
};

// Get friends list, incoming & outgoing requests, and pending gift count
async function getFriends(storeId) {
  // 1. Accepted friends
  const friends = await db.prepare(`
    SELECT f.id as friendship_id, f.created_at,
           CASE WHEN f.user_store_id = ? THEN s_friend.id ELSE s_user.id END as friend_store_id,
           CASE WHEN f.user_store_id = ? THEN s_friend.store_name ELSE s_user.store_name END as store_name,
           CASE WHEN f.user_store_id = ? THEN s_friend.store_code ELSE s_user.store_code END as store_code,
           CASE WHEN f.user_store_id = ? THEN s_friend.username ELSE s_user.username END as username,
           gs.chapter, gs.day_in_game, gs.reputation, gs.money
    FROM friends f
    JOIN stores s_user ON s_user.id = f.user_store_id
    JOIN stores s_friend ON s_friend.id = f.friend_store_id
    LEFT JOIN game_saves gs ON gs.store_id = (CASE WHEN f.user_store_id = ? THEN s_friend.id ELSE s_user.id END)
    WHERE (f.user_store_id = ? OR f.friend_store_id = ?)
      AND f.status = 'accepted'
    ORDER BY f.id DESC
  `).all(storeId, storeId, storeId, storeId, storeId, storeId, storeId);

  // 2. Incoming friend requests
  const incoming = await db.prepare(`
    SELECT f.id, f.user_store_id, f.created_at, s.store_name, s.store_code, s.username,
           gs.chapter, gs.day_in_game, gs.reputation
    FROM friends f
    JOIN stores s ON s.id = f.user_store_id
    LEFT JOIN game_saves gs ON gs.store_id = f.user_store_id
    WHERE f.friend_store_id = ? AND f.status = 'pending'
    ORDER BY f.id DESC
  `).all(storeId);

  // 3. Outgoing friend requests
  const outgoing = await db.prepare(`
    SELECT f.id, f.friend_store_id, f.created_at, s.store_name, s.store_code, s.username
    FROM friends f
    JOIN stores s ON s.id = f.friend_store_id
    WHERE f.user_store_id = ? AND f.status = 'pending'
    ORDER BY f.id DESC
  `).all(storeId);

  const todayStr = new Date().toISOString().split('T')[0];

  // Check which friends current user has already sent a gift to today
  const formattedFriends = await Promise.all((friends || []).map(async fr => {
    let sentGift = null;
    try {
      sentGift = await db.prepare(`
        SELECT id FROM friend_gifts 
        WHERE sender_store_id = ? AND receiver_store_id = ? AND created_at LIKE ?
        LIMIT 1
      `).get(storeId, fr.friend_store_id, `${todayStr}%`);
    } catch (e) {
      sentGift = null;
    }
    return {
      ...fr,
      canSendGift: !sentGift
    };
  }));

  // Count pending (unclaimed) gifts for current user
  let pendingGiftsCount = 0;
  try {
    const row = await db.prepare(`
      SELECT COUNT(*) as count FROM friend_gifts 
      WHERE receiver_store_id = ? AND claimed = 0
    `).get(storeId);
    pendingGiftsCount = row ? (Number(row.count) || 0) : 0;
  } catch (e) {
    pendingGiftsCount = 0;
  }

  return {
    success: true,
    friends: formattedFriends,
    incoming: incoming || [],
    outgoing: outgoing || [],
    pendingGiftsCount
  };
}

// Get pending and claimed gifts mailbox for current store
async function getGifts(storeId) {
  let pendingGifts = [];
  let claimedGifts = [];

  try {
    pendingGifts = await db.prepare(`
      SELECT fg.*, s.store_name as sender_name, s.store_code as sender_code, s.username as sender_username,
             gs.chapter as sender_chapter, gs.reputation as sender_reputation
      FROM friend_gifts fg
      JOIN stores s ON s.id = fg.sender_store_id
      LEFT JOIN game_saves gs ON gs.store_id = fg.sender_store_id
      WHERE fg.receiver_store_id = ? AND fg.claimed = 0
      ORDER BY fg.id DESC
    `).all(storeId) || [];
  } catch (e) {
    pendingGifts = [];
  }

  try {
    claimedGifts = await db.prepare(`
      SELECT fg.*, s.store_name as sender_name, s.store_code as sender_code, s.username as sender_username
      FROM friend_gifts fg
      JOIN stores s ON s.id = fg.sender_store_id
      WHERE fg.receiver_store_id = ? AND fg.claimed = 1
      ORDER BY fg.claimed_at DESC LIMIT 15
    `).all(storeId) || [];
  } catch (e) {
    claimedGifts = [];
  }

  // Format gifts with parsed ingredients and visual labels
  const formatGift = (g) => {
    let ings = {};
    try { ings = typeof g.ingredients === 'string' ? JSON.parse(g.ingredients || '{}') : (g.ingredients || {}); } catch (e) {}
    const cfg = GIFT_CONFIGS[g.gift_type] || GIFT_CONFIGS.friendship_box;
    return {
      id: g.id,
      gift_type: g.gift_type,
      gift_name: cfg.name,
      gift_icon: cfg.icon,
      money: g.money_amount,
      teacoin: g.teacoin_amount,
      ingredients: ings,
      message: g.message || 'Chúc bạn buôn may bán đắt!',
      created_at: g.created_at,
      claimed_at: g.claimed_at,
      claimed: !!g.claimed,
      title: cfg.name,
      icon: cfg.icon,
      money_amount: g.money_amount,
      teacoin_amount: g.teacoin_amount,
      sender_name: g.sender_name,
      sender_code: g.sender_code,
      sender: {
        id: g.sender_store_id,
        name: g.sender_name,
        code: g.sender_code,
        username: g.sender_username,
        chapter: g.sender_chapter || 1,
        reputation: g.sender_reputation || 5.0
      }
    };
  };

  return {
    success: true,
    pendingGifts: pendingGifts.map(formatGift),
    claimedGifts: claimedGifts.map(formatGift),
    pendingCount: pendingGifts.length,
    totalPending: pendingGifts.length,
    giftConfigs: GIFT_CONFIGS
  };
}

// Send friend request by store_code, username, or store_name
async function sendFriendRequest(storeId, targetCodeOrName) {
  if (!targetCodeOrName || typeof targetCodeOrName !== 'string') {
    return { success: false, message: 'Vui lòng nhập Mã Quán hoặc Tên tiệm của bạn bè!' };
  }

  const query = targetCodeOrName.trim().toUpperCase();
  const targetStore = await db.prepare(`
    SELECT id, store_name, store_code, username 
    FROM stores 
    WHERE UPPER(store_code) = ? OR UPPER(username) = ? OR UPPER(store_name) = ?
  `).get(query, query, query);

  if (!targetStore) {
    return { success: false, message: 'Không tìm thấy tiệm trà sữa này! Hãy kiểm tra lại Mã Quán (Ví dụ: HYHY-0000).' };
  }

  if (targetStore.id === storeId) {
    return { success: false, message: 'Bạn không thể tự kết bạn với chính tiệm của mình!' };
  }

  const existing = await db.prepare(`
    SELECT * FROM friends 
    WHERE (user_store_id = ? AND friend_store_id = ?)
       OR (user_store_id = ? AND friend_store_id = ?)
  `).get(storeId, targetStore.id, targetStore.id, storeId);

  if (existing) {
    if (existing.status === 'accepted') {
      return { success: false, message: `Bạn và [${targetStore.store_name}] đã là bạn bè từ trước rồi!` };
    }
    if (existing.user_store_id === storeId) {
      return { success: false, message: `Bạn đã gửi lời mời kết bạn tới [${targetStore.store_name}], đang chờ đối phương phản hồi!` };
    }
    await db.prepare("UPDATE friends SET status = 'accepted' WHERE id = ?").run(existing.id);
    return {
      success: true,
      message: `🎉 [${targetStore.store_name}] cũng đã gửi lời mời kết bạn! Hai bạn chính thức trở thành Bạn Bè!`
    };
  }

  await db.prepare(`
    INSERT INTO friends (user_store_id, friend_store_id, status, created_at)
    VALUES (?, ?, 'pending', ?)
  `).run(storeId, targetStore.id, new Date().toISOString());

  return {
    success: true,
    message: `Đã gửi lời mời kết bạn tới [${targetStore.store_name}] (${targetStore.store_code}) thành công!`
  };
}

// Accept friend request
async function acceptFriendRequest(storeId, requestId) {
  const req = await db.prepare(`
    SELECT f.*, s.store_name 
    FROM friends f
    JOIN stores s ON s.id = f.user_store_id
    WHERE f.id = ? AND f.friend_store_id = ? AND f.status = 'pending'
  `).get(requestId, storeId);

  if (!req) {
    return { success: false, message: 'Lời mời kết bạn không tồn tại hoặc đã được xử lý!' };
  }

  await db.prepare("UPDATE friends SET status = 'accepted' WHERE id = ?").run(requestId);
  return {
    success: true,
    message: `🎉 Đã đồng ý kết bạn với [${req.store_name}]!`
  };
}

// Reject friend request
async function rejectFriendRequest(storeId, requestId) {
  const req = await db.prepare(`
    SELECT * FROM friends 
    WHERE id = ? AND friend_store_id = ? AND status = 'pending'
  `).get(requestId, storeId);

  if (!req) {
    return { success: false, message: 'Lời mời kết bạn không tồn tại!' };
  }

  await db.prepare('DELETE FROM friends WHERE id = ?').run(requestId);
  return { success: true, message: 'Đã từ chối lời mời kết bạn.' };
}

// Remove friend
async function removeFriend(storeId, friendshipId) {
  const fr = await db.prepare(`
    SELECT f.*, 
           CASE WHEN f.user_store_id = ? THEN s_friend.store_name ELSE s_user.store_name END as friend_name
    FROM friends f
    JOIN stores s_user ON s_user.id = f.user_store_id
    JOIN stores s_friend ON s_friend.id = f.friend_store_id
    WHERE f.id = ? AND (f.user_store_id = ? OR f.friend_store_id = ?)
  `).get(storeId, friendshipId, storeId, storeId);

  if (!fr) {
    return { success: false, message: 'Không tìm thấy thông tin bạn bè này!' };
  }

  await db.prepare('DELETE FROM friends WHERE id = ?').run(friendshipId);
  return { success: true, message: `Đã hủy kết bạn với [${fr.friend_name}].` };
}

// Send daily friendship gift
async function sendFriendGift(storeId, friendshipId, giftType = 'friendship_box', customMessage = '') {
  const fr = await db.prepare(`
    SELECT f.*, 
           CASE WHEN f.user_store_id = ? THEN s_friend.id ELSE s_user.id END as target_store_id,
           CASE WHEN f.user_store_id = ? THEN s_friend.store_name ELSE s_user.store_name END as target_name,
           s_me.store_name as my_store_name,
           s_me.store_code as my_store_code
    FROM friends f
    JOIN stores s_user ON s_user.id = f.user_store_id
    JOIN stores s_friend ON s_friend.id = f.friend_store_id
    JOIN stores s_me ON s_me.id = ?
    WHERE f.id = ? AND (f.user_store_id = ? OR f.friend_store_id = ?) AND f.status = 'accepted'
  `).get(storeId, friendshipId, storeId, storeId, storeId, storeId);

  if (!fr) {
    return { success: false, message: 'Không tìm thấy thông tin bạn bè này!' };
  }

  const todayStr = new Date().toISOString().split('T')[0];
  const alreadySent = await db.prepare(`
    SELECT id FROM friend_gifts 
    WHERE sender_store_id = ? AND receiver_store_id = ? AND created_at LIKE ?
    LIMIT 1
  `).get(storeId, fr.target_store_id, `${todayStr}%`);

  if (alreadySent) {
    return { success: false, message: `Hôm nay bạn đã gửi quà cho bạn [${fr.target_name}] rồi! Hãy quay lại vào ngày mai nhé!` };
  }

  const cfg = GIFT_CONFIGS[giftType] || GIFT_CONFIGS.friendship_box;
  const msg = customMessage ? customMessage.trim().substring(0, 80) : 'Chúc bạn ngày mới kinh doanh phát tài, buôn may bán đắt! 🧋✨';

  // 1. Insert gift into friend_gifts inbox for target friend
  await db.prepare(`
    INSERT INTO friend_gifts (sender_store_id, receiver_store_id, gift_type, money_amount, teacoin_amount, ingredients, message, claimed, created_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, 0, ?)
  `).run(
    storeId,
    fr.target_store_id,
    cfg.id,
    cfg.money,
    cfg.teacoin,
    JSON.stringify(cfg.ingredients || {}),
    msg,
    new Date().toISOString()
  );

  // 2. Award sender reward immediately (Khích lệ người tặng)
  const mySave = await db.prepare('SELECT * FROM game_saves WHERE store_id = ?').get(storeId);
  let senderMoneyBonus = cfg.senderMoney || 0;
  let senderTeaCoinBonus = cfg.senderTeaCoin || 0;

  if (mySave) {
    const newMyMoney = (mySave.money || 0) + senderMoneyBonus;
    const newMyTeaCoin = (mySave.teacoin || 0) + senderTeaCoinBonus;
    const myHash = anticheat.generateSaveHash({ ...mySave, money: newMyMoney, teacoin: newMyTeaCoin });
    await db.prepare('UPDATE game_saves SET money = ?, teacoin = ?, save_hash = ?, updated_at = ? WHERE store_id = ?')
      .run(newMyMoney, newMyTeaCoin, myHash, new Date().toISOString(), storeId);
  }

  // Update Daily Quest
  try { await updateDailyQuestProgress(storeId, 'friend_gift'); } catch (e) {}

  // Real-time notification push to target friend if online
  try {
    const liveSync = require('../live-sync.service');
    liveSync.pushToStore(fr.target_store_id, 'friend_gift_received', {
      senderName: fr.my_store_name,
      senderCode: fr.my_store_code,
      giftName: cfg.name,
      giftIcon: cfg.icon,
      message: msg
    });
  } catch (e) {}

  invalidateStoreCache(storeId);
  invalidateStoreCache(fr.target_store_id);

  return {
    success: true,
    senderReward: {
      money: senderMoneyBonus,
      teacoin: senderTeaCoinBonus
    },
    message: `🎁 Đã gửi [${cfg.name}] tới [${fr.target_name}]! Bạn nhận được +${senderMoneyBonus.toLocaleString('vi-VN')}đ & +${senderTeaCoinBonus} TeaCoin!`
  };
}

// Send gifts to all friends who haven't received one today
async function sendAllFriendGifts(storeId) {
  const friendsRes = await getFriends(storeId);
  const eligible = (friendsRes.friends || []).filter(fr => fr.canSendGift);

  if (eligible.length === 0) {
    return {
      success: false,
      message: 'Hôm nay bạn đã gửi quà cho toàn bộ bạn bè trong danh sách rồi! Hãy quay lại vào ngày mai nhé!'
    };
  }

  let sentCount = 0;
  for (const fr of eligible) {
    await sendFriendGift(storeId, fr.friendship_id, 'friendship_box', 'Chúc bạn buôn may bán đắt!');
    sentCount++;
  }

  const totalMoney = sentCount * 10000;
  const totalTeaCoin = sentCount * 5;

  return {
    success: true,
    sentCount,
    totalMoneyBonus: totalMoney,
    totalTeaCoinBonus: totalTeaCoin,
    message: `🚀 Đã gửi Hộp Quà Tình Bạn tới toàn bộ ${sentCount} người bạn! Bạn nhận được tổng cộng +${totalMoney.toLocaleString('vi-VN')}đ & +${totalTeaCoin} TeaCoin!`
  };
}

// Claim a single pending gift
async function claimFriendGift(storeId, giftId) {
  const gift = await db.prepare(`
    SELECT fg.*, s.store_name as sender_name, s.store_code as sender_code 
    FROM friend_gifts fg
    JOIN stores s ON s.id = fg.sender_store_id
    WHERE fg.id = ? AND fg.receiver_store_id = ? AND fg.claimed = 0
  `).get(giftId, storeId);

  if (!gift) {
    return { success: false, message: 'Hộp quà này không tồn tại hoặc đã được mở nhận trước đó!' };
  }

  const save = await db.prepare('SELECT * FROM game_saves WHERE store_id = ?').get(storeId);
  if (!save) return { success: false, message: 'Cửa hàng không tồn tại!' };

  let ingredients = {};
  try {
    ingredients = typeof gift.ingredients === 'string' ? JSON.parse(gift.ingredients || '{}') : (gift.ingredients || {});
  } catch (e) {
    ingredients = {};
  }

  let inventory = { tea: 50, milk: 50, pearls: 50, cups: 50 };
  try {
    inventory = typeof save.inventory === 'string' ? JSON.parse(save.inventory) : (save.inventory || {});
  } catch (e) {}

  if (ingredients.tea) inventory.tea = (inventory.tea || 0) + ingredients.tea;
  if (ingredients.pearls) inventory.pearls = (inventory.pearls || 0) + ingredients.pearls;
  if (ingredients.milk) inventory.milk = (inventory.milk || 0) + ingredients.milk;
  if (ingredients.cups) inventory.cups = (inventory.cups || 0) + ingredients.cups;

  const newMoney = (save.money || 0) + (gift.money_amount || 0);
  const newTeaCoin = (save.teacoin || 0) + (gift.teacoin_amount || 0);

  const hash = anticheat.generateSaveHash({
    ...save,
    money: newMoney,
    teacoin: newTeaCoin
  });

  const nowStr = new Date().toISOString();
  await db.prepare(`
    UPDATE game_saves 
    SET money = ?, teacoin = ?, inventory = ?, save_hash = ?, updated_at = ?
    WHERE store_id = ?
  `).run(newMoney, newTeaCoin, JSON.stringify(inventory), hash, nowStr, storeId);

  await db.prepare(`
    UPDATE friend_gifts 
    SET claimed = 1, claimed_at = ?
    WHERE id = ?
  `).run(nowStr, giftId);

  invalidateStoreCache(storeId);

  const cfg = GIFT_CONFIGS[gift.gift_type] || GIFT_CONFIGS.friendship_box;
  let rewardDescParts = [];
  if (gift.money_amount > 0) rewardDescParts.push(`+${gift.money_amount.toLocaleString('vi-VN')}đ`);
  if (gift.teacoin_amount > 0) rewardDescParts.push(`+${gift.teacoin_amount} TeaCoin`);
  if (ingredients.tea) rewardDescParts.push(`+${ingredients.tea} Trà`);
  if (ingredients.pearls) rewardDescParts.push(`+${ingredients.pearls} Trân Châu`);

  return {
    success: true,
    giftId,
    money: gift.money_amount,
    teacoin: gift.teacoin_amount,
    ingredients,
    message: `🎉 Đã mở [${cfg.name}] từ [${gift.sender_name}]! Nhận: ${rewardDescParts.join(', ')}!`
  };
}

// Claim all pending gifts and automatically send back friendship boxes
async function claimAllAndSendBackGifts(storeId) {
  const pendingGifts = await db.prepare(`
    SELECT fg.*, s.store_name as sender_name, s.store_code as sender_code 
    FROM friend_gifts fg
    JOIN stores s ON s.id = fg.sender_store_id
    WHERE fg.receiver_store_id = ? AND fg.claimed = 0
  `).all(storeId);

  if (!pendingGifts || pendingGifts.length === 0) {
    return { success: false, message: 'Hiện tại bạn không có hộp quà nào đang chờ nhận!' };
  }

  const save = await db.prepare('SELECT * FROM game_saves WHERE store_id = ?').get(storeId);
  if (!save) return { success: false, message: 'Cửa hàng không tồn tại!' };

  let totalMoney = 0;
  let totalTeaCoin = 0;
  let totalTea = 0;
  let totalPearls = 0;

  let inventory = { tea: 50, milk: 50, pearls: 50, cups: 50 };
  try {
    inventory = typeof save.inventory === 'string' ? JSON.parse(save.inventory) : (save.inventory || {});
  } catch (e) {}

  const nowStr = new Date().toISOString();
  const todayStr = nowStr.split('T')[0];
  const senderIds = new Set();

  for (const g of pendingGifts) {
    totalMoney += (g.money_amount || 0);
    totalTeaCoin += (g.teacoin_amount || 0);

    let ings = {};
    try { ings = typeof g.ingredients === 'string' ? JSON.parse(g.ingredients || '{}') : (g.ingredients || {}); } catch (e) {}
    if (ings.tea) { inventory.tea = (inventory.tea || 0) + ings.tea; totalTea += ings.tea; }
    if (ings.pearls) { inventory.pearls = (inventory.pearls || 0) + ings.pearls; totalPearls += ings.pearls; }

    senderIds.add(g.sender_store_id);
    await db.prepare('UPDATE friend_gifts SET claimed = 1, claimed_at = ? WHERE id = ?').run(nowStr, g.id);
  }

  // Update receiver saves
  const newMoney = (save.money || 0) + totalMoney;
  const newTeaCoin = (save.teacoin || 0) + totalTeaCoin;
  const hash = anticheat.generateSaveHash({ ...save, money: newMoney, teacoin: newTeaCoin });

  await db.prepare(`
    UPDATE game_saves 
    SET money = ?, teacoin = ?, inventory = ?, save_hash = ?, updated_at = ?
    WHERE store_id = ?
  `).run(newMoney, newTeaCoin, JSON.stringify(inventory), hash, nowStr, storeId);

  // Send Back Logic: for each sender, if current user hasn't sent them a gift today, send one back!
  let sentBackCount = 0;
  const myStore = await db.prepare('SELECT store_name, store_code FROM stores WHERE id = ?').get(storeId);

  for (const senderId of senderIds) {
    const alreadySent = await db.prepare(`
      SELECT id FROM friend_gifts 
      WHERE sender_store_id = ? AND receiver_store_id = ? AND created_at LIKE ?
      LIMIT 1
    `).get(storeId, senderId, `${todayStr}%`);

    if (!alreadySent) {
      await db.prepare(`
        INSERT INTO friend_gifts (sender_store_id, receiver_store_id, gift_type, money_amount, teacoin_amount, ingredients, message, claimed, created_at)
        VALUES (?, ?, 'friendship_box', 10000, 5, '{"tea":5,"pearls":5}', 'Cảm ơn bạn đã gửi quà! Chúc bạn buôn may bán đắt! 🧋✨', 0, ?)
      `).run(storeId, senderId, nowStr);
      sentBackCount++;
    }
  }

  // If gifts sent back, give sender reward bonuses too
  if (sentBackCount > 0) {
    const curSave = await db.prepare('SELECT money, teacoin FROM game_saves WHERE store_id = ?').get(storeId);
    const bonusM = sentBackCount * 10000;
    const bonusTC = sentBackCount * 5;
    const upM = (curSave.money || 0) + bonusM;
    const upTC = (curSave.teacoin || 0) + bonusTC;
    const upHash = anticheat.generateSaveHash({ ...save, money: upM, teacoin: upTC });
    await db.prepare('UPDATE game_saves SET money = ?, teacoin = ?, save_hash = ? WHERE store_id = ?')
      .run(upM, upTC, upHash, storeId);
    totalMoney += bonusM;
    totalTeaCoin += bonusTC;
    try { await updateDailyQuestProgress(storeId, 'friend_gift'); } catch (e) {}
  }

  invalidateStoreCache(storeId);

  return {
    success: true,
    claimedCount: pendingGifts.length,
    sentBackCount,
    totalMoney,
    totalTeaCoin,
    ingredients: { tea: totalTea, pearls: totalPearls },
    message: `🎁 Đã mở ${pendingGifts.length} hộp quà! Thu về: +${totalMoney.toLocaleString('vi-VN')}đ, +${totalTeaCoin} TeaCoin${totalTea > 0 ? `, +${totalTea} Trà` : ''}${totalPearls > 0 ? `, +${totalPearls} Trân Châu` : ''}! ${sentBackCount > 0 ? `(Đã tự động tặng lại ${sentBackCount} hộp quà cho bạn bè 🔄)` : ''}`
  };
}

module.exports = {
  GIFT_CONFIGS,
  getFriends,
  getGifts,
  sendFriendRequest,
  acceptFriendRequest,
  rejectFriendRequest,
  removeFriend,
  sendFriendGift,
  sendAllFriendGifts,
  claimFriendGift,
  claimAllAndSendBackGifts
};
