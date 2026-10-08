const db = require('../../models/db');
const anticheat = require('../anticheat.service');
const { gameCache, invalidateStoreCache } = require('./cache.helper');

const THREE_DAYS_MS = 3 * 24 * 60 * 60 * 1000;

// Rate-limited prune expired collabs (runs at most once every 60s)
let lastPruneTime = 0;
async function pruneExpiredCollabs() {
  const now = Date.now();
  if (now - lastPruneTime < 60000) return;
  lastPruneTime = now;
  try {
    const expiredCutoff = new Date(now - THREE_DAYS_MS).toISOString();
    await db.prepare(`
      DELETE FROM collabs 
      WHERE (created_at IS NOT NULL AND created_at != '' AND created_at < ?)
         OR (created_at IS NULL AND collab_date < ?)
    `).run(expiredCutoff, expiredCutoff.slice(0, 10));
  } catch (e) {
    console.error('Error pruning expired collabs:', e);
  }
}

// Get active collab count for a store (max 3 partner stores, total 4 stalls including own store)
async function getActiveCollabCount(storeId) {
  await pruneExpiredCollabs();
  const row = await db.prepare(`
    SELECT COUNT(*) as cnt 
    FROM collabs 
    WHERE (host_store_id = ? OR friend_store_id = ?) 
      AND status = 'accepted'
  `).get(storeId, storeId);
  return Math.min(3, row ? (row.cnt || 0) : 0);
}

// In-memory heartbeat tracker for store presence (online within 60s)
const storeHeartbeats = new Map();

function recordStoreHeartbeat(storeId) {
  if (storeId) {
    storeHeartbeats.set(Number(storeId), Date.now());
  }
}

function isStoreOnline(storeId) {
  if (!storeId) return false;
  const last = storeHeartbeats.get(Number(storeId));
  return !!(last && (Date.now() - last < 60000));
}

// Get full Collab Dashboard data (cached for 15s to protect free tier DB)
async function getCollabData(storeId) {
  recordStoreHeartbeat(storeId);
  const now = Date.now();

  const cacheKey = `collab:${storeId}`;
  const cached = gameCache && gameCache.collabs ? gameCache.collabs.get(cacheKey) : null;
  if (cached) {
    const refreshedActive = (cached.activeCollabs || []).map(c => {
      const remainingMs = Math.max(0, (c.expires_at_ms || 0) - now);
      return {
        ...c,
        is_online: isStoreOnline(c.partner_id) || !!c.is_online_db,
        remaining_ms: remainingMs,
        remaining_hours: Math.ceil(remainingMs / (1000 * 60 * 60))
      };
    });
    return {
      ...cached,
      activeCollabs: refreshedActive
    };
  }

  await pruneExpiredCollabs();

  const activeCollabs = await db.prepare(`
    SELECT c.id, c.host_store_id, c.friend_store_id, c.created_at,
           CASE WHEN c.host_store_id = ? THEN s_friend.id ELSE s_host.id END as partner_id,
           CASE WHEN c.host_store_id = ? THEN s_friend.store_name ELSE s_host.store_name END as partner_name,
           CASE WHEN c.host_store_id = ? THEN s_friend.store_code ELSE s_host.store_code END as partner_code,
           CASE WHEN c.host_store_id = ? THEN s_friend.username ELSE s_host.username END as partner_username,
           CASE WHEN c.host_store_id = ? THEN s_friend.session_token ELSE s_host.session_token END as partner_session_token
    FROM collabs c
    JOIN stores s_host ON s_host.id = c.host_store_id
    JOIN stores s_friend ON s_friend.id = c.friend_store_id
    WHERE (c.host_store_id = ? OR c.friend_store_id = ?)
      AND c.status = 'accepted'
    ORDER BY c.id ASC
    LIMIT 3
  `).all(storeId, storeId, storeId, storeId, storeId, storeId, storeId);

  const enrichedActiveCollabs = [];

  for (const c of activeCollabs) {
    const createdAtMs = c.created_at ? new Date(c.created_at).getTime() : now;
    const expiresAtMs = createdAtMs + THREE_DAYS_MS;
    const remainingMs = Math.max(0, expiresAtMs - now);

    let partnerSave = null;
    try {
      partnerSave = await db.prepare('SELECT chapter, reputation, upgrades FROM game_saves WHERE store_id = ?').get(c.partner_id);
    } catch (e) {}

    let partnerDaily = null;
    try {
      partnerDaily = await db.prepare('SELECT last_active_ts FROM daily_stats WHERE store_id = ? ORDER BY id DESC LIMIT 1').get(c.partner_id);
    } catch (e) {}

    const isOnlineDb = !!(partnerDaily && partnerDaily.last_active_ts && (now - Number(partnerDaily.last_active_ts) < 90000));
    const isOnline = isStoreOnline(c.partner_id) || isOnlineDb;

    enrichedActiveCollabs.push({
      ...c,
      is_online: !!isOnline,
      is_online_db: isOnlineDb,
      created_at_ms: createdAtMs,
      expires_at_ms: expiresAtMs,
      remaining_ms: remainingMs,
      remaining_hours: Math.ceil(remainingMs / (1000 * 60 * 60)),
      partner_chapter: partnerSave ? (partnerSave.chapter || 1) : 1,
      partner_rep: partnerSave ? (partnerSave.reputation || 5.0) : 5.0
    });
  }

  const incomingRequests = await db.prepare(`
    SELECT c.id, c.host_store_id, c.created_at, s.store_name, s.store_code, s.username
    FROM collabs c
    JOIN stores s ON s.id = c.host_store_id
    WHERE c.friend_store_id = ? AND c.status = 'pending'
    ORDER BY c.id DESC
  `).all(storeId);

  const outgoingRequests = await db.prepare(`
    SELECT c.id, c.friend_store_id, c.created_at, s.store_name, s.store_code, s.username
    FROM collabs c
    JOIN stores s ON s.id = c.friend_store_id
    WHERE c.host_store_id = ? AND c.status = 'pending'
    ORDER BY c.id DESC
  `).all(storeId);

  const activeCount = enrichedActiveCollabs.length;
  const bonusPercent = activeCount * 10;

  const result = {
    success: true,
    activeCollabs: enrichedActiveCollabs,
    incomingRequests,
    outgoingRequests,
    activeCount,
    maxCollabs: 3,
    bonusPercent
  };

  if (gameCache && gameCache.collabs) {
    gameCache.collabs.set(cacheKey, result, 15000); // 15 seconds TTL
  }

  return result;
}

async function addCollab(hostStoreId, friendCode) {
  const cleanCode = (friendCode || '').trim().toUpperCase();
  if (!cleanCode) {
    return { success: false, message: 'Vui lòng nhập Mã Quán bạn bè!' };
  }

  const hostStore = await db.prepare('SELECT * FROM stores WHERE id = ?').get(hostStoreId);
  const friendStore = await db.prepare('SELECT * FROM stores WHERE store_code = ?').get(cleanCode);

  if (!friendStore) {
    return { success: false, message: 'Không tìm thấy Mã Quán bạn bè này! Hãy kiểm tra lại mã.' };
  }

  if (friendStore.id === hostStoreId) {
    return { success: false, message: 'Bạn không thể tự gửi lời mời Collab cho chính mình!' };
  }

  const hostCount = await getActiveCollabCount(hostStoreId);
  if (hostCount >= 3) {
    return { 
      success: false, 
      message: 'Bạn đã đạt giới hạn tối đa 3 đối tác Collab (+30% doanh thu)! Hãy hủy bớt liên kết cũ nếu muốn liên minh quán mới.' 
    };
  }

  const friendCount = await getActiveCollabCount(friendStore.id);
  if (friendCount >= 3) {
    return { 
      success: false, 
      message: `Quán [${friendStore.store_name}] hiện đã có đủ 3 đối tác Collab tối đa!` 
    };
  }

  const existingAccepted = await db.prepare(`
    SELECT * FROM collabs 
    WHERE ((host_store_id = ? AND friend_store_id = ?) OR (host_store_id = ? AND friend_store_id = ?))
      AND status = 'accepted'
  `).get(hostStoreId, friendStore.id, friendStore.id, hostStoreId);

  if (existingAccepted) {
    return { success: false, message: `Hai bạn đã là đối tác Collab của nhau rồi (+10% doanh thu đang kích hoạt)!` };
  }

  const incomingPending = await db.prepare(`
    SELECT * FROM collabs 
    WHERE host_store_id = ? AND friend_store_id = ? AND status = 'pending'
  `).get(friendStore.id, hostStoreId);

  if (incomingPending) {
    await db.prepare("UPDATE collabs SET status = 'accepted' WHERE id = ?").run(incomingPending.id);
    invalidateStoreCache(hostStoreId);
    invalidateStoreCache(friendStore.id);
    return {
      success: true,
      accepted: true,
      message: `🎉 Quán [${friendStore.store_name}] trước đó đã gửi lời mời cho bạn! Hai quán đã chính thức liên minh Collab thành công (Tăng +10% doanh thu)!`
    };
  }

  const outgoingPending = await db.prepare(`
    SELECT * FROM collabs 
    WHERE host_store_id = ? AND friend_store_id = ? AND status = 'pending'
  `).get(hostStoreId, friendStore.id);

  if (outgoingPending) {
    return { success: false, message: `Bạn đã gửi lời mời Collab cho quán [${friendStore.store_name}] rồi! Vui lòng chờ bạn bè bấm Chấp nhận.` };
  }

  try {
    await db.prepare(`
      DELETE FROM collabs 
      WHERE ((host_store_id = ? AND friend_store_id = ?) OR (host_store_id = ? AND friend_store_id = ?))
        AND status != 'accepted'
    `).run(hostStoreId, friendStore.id, friendStore.id, hostStoreId);
  } catch (e) {}

  const realDate = anticheat.getRealDate();
  const createdAt = new Date().toISOString();

  await db.prepare(`
    INSERT INTO collabs (host_store_id, friend_store_id, collab_date, status, created_at)
    VALUES (?, ?, ?, 'pending', ?)
  `).run(hostStoreId, friendStore.id, realDate, createdAt);

  return {
    success: true,
    pending: true,
    message: `📨 Đã gửi lời mời Collab thành công tới [${friendStore.store_name}]! Khi đối phương bấm Chấp nhận, liên minh sẽ chính thức được kích hoạt (+10% doanh thu)!`
  };
}

async function acceptCollab(storeId, collabId) {
  const request = await db.prepare(`
    SELECT c.*, s.store_name, s.store_code 
    FROM collabs c 
    JOIN stores s ON s.id = c.host_store_id 
    WHERE c.id = ? AND c.friend_store_id = ? AND c.status = 'pending'
  `).get(collabId, storeId);

  if (!request) {
    return { success: false, message: 'Không tìm thấy lời mời Collab hợp lệ hoặc lời mời đã hết hạn!' };
  }

  const myCount = await getActiveCollabCount(storeId);
  if (myCount >= 3) {
    return { success: false, message: 'Bạn đã có đủ 3 đối tác Collab tối đa! Hãy hủy bớt liên minh cũ để chấp nhận thêm.' };
  }

  const hostCount = await getActiveCollabCount(request.host_store_id);
  if (hostCount >= 3) {
    return { success: false, message: `Quán [${request.store_name}] hiện đã có đủ 3 đối tác Collab!` };
  }

  await db.prepare("UPDATE collabs SET status = 'accepted' WHERE id = ?").run(collabId);
  invalidateStoreCache(storeId);
  invalidateStoreCache(request.host_store_id);

  return {
    success: true,
    message: `🎉 Chấp nhận lời mời Collab thành công! Quán của bạn và [${request.store_name}] đã chính thức liên minh (+10% doanh thu mỗi ly trà sữa)!`
  };
}

async function declineCollab(storeId, collabId) {
  const request = await db.prepare(`
    SELECT c.*, s.store_name 
    FROM collabs c 
    JOIN stores s ON s.id = c.host_store_id 
    WHERE c.id = ? AND c.friend_store_id = ? AND c.status = 'pending'
  `).get(collabId, storeId);

  if (!request) {
    return { success: false, message: 'Không tìm thấy lời mời cần từ chối!' };
  }

  await db.prepare('DELETE FROM collabs WHERE id = ?').run(collabId);
  invalidateStoreCache(storeId);
  invalidateStoreCache(request.host_store_id);

  return {
    success: true,
    message: `Đã từ chối lời mời Collab từ [${request.store_name}].`
  };
}

async function cancelCollab(storeId, collabId) {
  const collab = await db.prepare(`
    SELECT c.*, 
           CASE WHEN c.host_store_id = ? THEN s_friend.store_name ELSE s_host.store_name END as partner_name,
           CASE WHEN c.host_store_id = ? THEN s_friend.id ELSE s_host.id END as partner_id
    FROM collabs c
    JOIN stores s_host ON s_host.id = c.host_store_id
    JOIN stores s_friend ON s_friend.id = c.friend_store_id
    WHERE c.id = ? AND (c.host_store_id = ? OR c.friend_store_id = ?)
  `).get(storeId, storeId, collabId, storeId, storeId);

  if (!collab) {
    return { success: false, message: 'Không tìm thấy thông tin liên minh cần hủy!' };
  }

  await db.prepare('DELETE FROM collabs WHERE id = ?').run(collabId);
  invalidateStoreCache(storeId);
  if (collab.partner_id) invalidateStoreCache(collab.partner_id);

  const isPending = collab.status === 'pending';
  return {
    success: true,
    message: isPending 
      ? `Đã thu hồi lời mời Collab gửi tới [${collab.partner_name}].` 
      : `Đã hủy liên kết Collab với [${collab.partner_name}]. Quầy hàng của bạn bè đã rời đi!`
  };
}

module.exports = {
  THREE_DAYS_MS,
  pruneExpiredCollabs,
  getActiveCollabCount,
  getCollabData,
  addCollab,
  acceptCollab,
  declineCollab,
  cancelCollab,
  recordStoreHeartbeat,
  isStoreOnline
};
