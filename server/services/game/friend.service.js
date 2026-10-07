const db = require('../../models/db');
const anticheat = require('../anticheat.service');
const { invalidateStoreCache } = require('./cache.helper');
const { updateDailyQuestProgress } = require('./quest.service');

// Get friends list, incoming & outgoing requests
async function getFriends(storeId) {
  // 1. Accepted friends
  const friends = await db.prepare(`
    SELECT f.id as friendship_id, f.gift_claimed_date, f.created_at,
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
  const formattedFriends = (friends || []).map(fr => ({
    ...fr,
    canSendGift: fr.gift_claimed_date !== todayStr
  }));

  return {
    success: true,
    friends: formattedFriends,
    incoming: incoming || [],
    outgoing: outgoing || []
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
async function sendFriendGift(storeId, friendshipId) {
  const fr = await db.prepare(`
    SELECT f.*, 
           CASE WHEN f.user_store_id = ? THEN s_friend.id ELSE s_user.id END as target_store_id,
           CASE WHEN f.user_store_id = ? THEN s_friend.store_name ELSE s_user.store_name END as target_name
    FROM friends f
    JOIN stores s_user ON s_user.id = f.user_store_id
    JOIN stores s_friend ON s_friend.id = f.friend_store_id
    WHERE f.id = ? AND (f.user_store_id = ? OR f.friend_store_id = ?) AND f.status = 'accepted'
  `).get(storeId, friendshipId, storeId, storeId);

  if (!fr) {
    return { success: false, message: 'Không tìm thấy thông tin bạn bè này!' };
  }

  const todayStr = new Date().toISOString().split('T')[0];
  if (fr.gift_claimed_date === todayStr) {
    return { success: false, message: 'Hôm nay bạn đã gửi quà tình bạn cho người bạn này rồi! Hãy quay lại vào ngày mai nhé!' };
  }

  const mySave = await db.prepare('SELECT * FROM game_saves WHERE store_id = ?').get(storeId);
  const friendSave = await db.prepare('SELECT * FROM game_saves WHERE store_id = ?').get(fr.target_store_id);

  if (mySave) {
    const newMyMoney = mySave.money + 10000;
    const myHash = anticheat.generateSaveHash({ ...mySave, money: newMyMoney });
    await db.prepare('UPDATE game_saves SET money = ?, save_hash = ? WHERE store_id = ?').run(newMyMoney, myHash, storeId);
  }

  if (friendSave) {
    const newFriendMoney = friendSave.money + 10000;
    const frHash = anticheat.generateSaveHash({ ...friendSave, money: newFriendMoney });
    await db.prepare('UPDATE game_saves SET money = ?, save_hash = ? WHERE store_id = ?').run(newFriendMoney, frHash, fr.target_store_id);
  }

  await db.prepare('UPDATE friends SET gift_claimed_date = ? WHERE id = ?').run(todayStr, friendshipId);
  try { await updateDailyQuestProgress(storeId, 'friend_gift'); } catch (e) {}
  invalidateStoreCache(storeId);
  invalidateStoreCache(fr.target_store_id);

  return {
    success: true,
    bonusMoney: 10000,
    message: `🎁 Đã gửi hộp quà tình bạn tới [${fr.target_name}]! Cả hai bạn cùng nhận được +10.000đ!`
  };
}

module.exports = {
  getFriends,
  sendFriendRequest,
  acceptFriendRequest,
  rejectFriendRequest,
  removeFriend,
  sendFriendGift
};
