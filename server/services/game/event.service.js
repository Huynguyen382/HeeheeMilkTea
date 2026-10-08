/**
 * Game Events & Dynamic Weather / Festivals Engine
 */

const db = require('../../models/db');
const anticheat = require('../anticheat.service');
const { invalidateStoreCache } = require('./cache.helper');

const EVENTS = {
  hoi_cho_am_thuc: {
    id: 'hoi_cho_am_thuc',
    name: '🎪 Hội Chợ Ẩm Thực Phố Đêm',
    durationSec: 90,
    icon: '🎪',
    desc: 'Lễ hội ẩm thực đường phố sôi động! Khách kéo đến nườm nượp, doanh thu x2 và tiền tip tăng gấp đôi.',
    effects: {
      rushMultiplier: 2.5,
      tipMultiplier: 2.0,
      revenueBoost: 2.0
    }
  },
  mua_rao_mua_he: {
    id: 'mua_rao_mua_he',
    name: '🌧️ Cơn Mưa Rào Mùa Hè',
    durationSec: 120,
    icon: '🌧️',
    desc: 'Cơn mưa mùa hạ mát lành bất chợt ghé ngang. Khách ghé trú mưa đông đúc, thời gian kiên nhẫn tăng +50%.',
    effects: {
      patienceBoost: 1.5,
      weather: 'rain'
    }
  },
  kiem_tra_vsattp: {
    id: 'kiem_tra_vsattp',
    name: '📋 Thanh Tra An Toàn Thực Phẩm',
    durationSec: 45,
    icon: '📋',
    desc: 'Đội quản lý liên ngành kiểm tra quầy hàng sạch sẽ. Đạt chuẩn tặng +0.3⭐ danh tiếng và 500 TeaCoin!',
    effects: {
      rewardTeacoin: 500,
      repBonus: 0.3
    }
  },
  tiktok_viral_surge: {
    id: 'tiktok_viral_surge',
    name: '📱 Cơn Sốt TikTok Triệu View Bùng Nổ',
    durationSec: 90,
    icon: '📱',
    desc: 'Quán được lên video Xu Hướng! Khách hàng nườm nượp kéo đến gọi full topping và boa tiền cực khủng.',
    effects: {
      viral: true,
      tipMultiplier: 3.0
    }
  },
  nang_nong_40_do: {
    id: 'nang_nong_40_do',
    name: '☀️ Nắng Nóng Đột Ngột 40°C',
    durationSec: 90,
    icon: '☀️',
    desc: 'Trời nắng gắt, nhu cầu giải khát tăng cực mạnh! Giá bán tự động tăng +20% và khách ưu tiên gọi nhiều đá.',
    effects: {
      priceMultiplier: 1.2,
      weather: 'heatwave'
    }
  }
};

function getEventsList() {
  return Object.values(EVENTS);
}

/**
 * Trigger an event for a specific store
 */
async function triggerEventForStore(storeId, eventId) {
  const event = EVENTS[eventId];
  if (!event) {
    throw new Error(`Sự kiện [${eventId}] không tồn tại!`);
  }

  const save = await db.prepare('SELECT * FROM game_saves WHERE store_id = ?').get(storeId);
  if (!save) {
    throw new Error('Cửa hàng không tồn tại!');
  }

  const activeBuffs = JSON.parse(save.active_buffs || '{}');
  const now = Date.now();
  const expiresAt = now + (event.durationSec * 1000);

  activeBuffs.current_event = {
    id: event.id,
    name: event.name,
    icon: event.icon,
    effects: event.effects,
    started_at: now,
    expires_at: expiresAt
  };

  // Immediate rewards for specific events
  let newReputation = save.reputation;
  let newTeacoin = save.teacoin || 0;

  if (event.effects.repBonus) {
    newReputation = Math.min(5.0, Number(save.reputation) + Number(event.effects.repBonus));
  }
  if (event.effects.rewardTeacoin) {
    newTeacoin = Number(save.teacoin || 0) + Number(event.effects.rewardTeacoin);
  }

  const updatedState = {
    store_id: storeId,
    chapter: Number(save.chapter),
    day_in_game: Number(save.day_in_game),
    money: Number(save.money),
    debt_remaining: Number(save.debt_remaining),
    reputation: newReputation,
    teacoin: newTeacoin
  };
  const hash = anticheat.generateSaveHash(updatedState);

  await db.prepare(`
    UPDATE game_saves 
    SET active_buffs = ?, reputation = ?, teacoin = ?, save_hash = ?, updated_at = ?
    WHERE store_id = ?
  `).run(JSON.stringify(activeBuffs), newReputation, newTeacoin, hash, new Date().toISOString(), storeId);

  invalidateStoreCache(storeId);

  return {
    success: true,
    event,
    expiresAt,
    message: `Đã kích hoạt sự kiện [${event.name}] cho tiệm #${storeId} thành công trong ${event.durationSec} giây!`
  };
}

/**
 * Trigger event for all stores (server-wide)
 */
async function broadcastEvent(eventId) {
  const event = EVENTS[eventId];
  if (!event) {
    throw new Error(`Sự kiện [${eventId}] không tồn tại!`);
  }

  const stores = await db.prepare('SELECT id FROM stores').all();
  for (const s of (stores || [])) {
    try {
      await triggerEventForStore(s.id, eventId);
    } catch (e) {}
  }

  return {
    success: true,
    event,
    affectedCount: stores ? stores.length : 0,
    message: `Đã phát sóng sự kiện [${event.name}] tới toàn bộ ${stores.length} tiệm trên máy chủ!`
  };
}

module.exports = {
  EVENTS,
  getEventsList,
  triggerEventForStore,
  broadcastEvent
};

