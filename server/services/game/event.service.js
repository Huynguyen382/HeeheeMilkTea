/**
 * Game Events & Dynamic Festivals Engine
 * Allows Admin to configure buff/debuff rates (%) and duration for all events,
 * while keeping exact buff/debuff percentages hidden from players.
 */

const fs = require('fs');
const path = require('path');
const db = require('../../models/db');
const anticheat = require('../anticheat.service');
const { invalidateStoreCache } = require('./cache.helper');

const EVENT_OVERRIDES_PATH = path.join(__dirname, '../../../data/event_rates_overrides.json');

const DEFAULT_EVENTS = {
  hoi_cho_am_thuc: {
    id: 'hoi_cho_am_thuc',
    name: '🎪 Hội Chợ Ẩm Thực Phố Đêm',
    durationSec: 120,
    icon: '🎪',
    desc: 'Lễ hội ẩm thực đường phố sôi động! Khách dạo phố ghé quầy và bầu không khí mua sắm đang thay đổi rõ rệt.',
    effects: {
      customerBuffPercent: 50,
      priceBuffPercent: 25,
      patienceBuffPercent: 15,
      rewardTeacoin: 0,
      repBonus: 0
    }
  },
  mua_rao_mua_he: {
    id: 'mua_rao_mua_he',
    name: '🌧️ Cơn Mưa Rào Mùa Hè',
    durationSec: 120,
    icon: '🌧️',
    desc: 'Cơn mưa mùa hạ mát lành bất chợt ghé ngang. Khách hàng ghé trú mưa tại quầy có tâm lý chờ đợi khác thường ngày.',
    effects: {
      customerBuffPercent: 10,
      priceBuffPercent: 10,
      patienceBuffPercent: 45,
      rewardTeacoin: 0,
      repBonus: 0,
      weather: 'rain'
    }
  },
  kiem_tra_vsattp: {
    id: 'kiem_tra_vsattp',
    name: '📋 Đợt Kiểm Tra Vệ Sinh Đột Xuất',
    durationSec: 60,
    icon: '📋',
    desc: 'Đoàn kiểm tra liên ngành đi tuần qua tuyến phố! Uy tín và hoạt động kinh doanh tại quầy chịu tác động trực tiếp.',
    effects: {
      customerBuffPercent: 0,
      priceBuffPercent: 15,
      patienceBuffPercent: 0,
      rewardTeacoin: 20,
      repBonus: 0.2
    }
  },
  tiktok_viral_surge: {
    id: 'tiktok_viral_surge',
    name: '📱 Cơn Sốt Review Mạng Xã Hội',
    durationSec: 90,
    icon: '📱',
    desc: 'Tiệm trà sữa bất ngờ được nhắc tên trên mạng xã hội! Lượng khách ghé quầy và mức chi tiêu đang biến động mạnh.',
    effects: {
      customerBuffPercent: 60,
      priceBuffPercent: 30,
      patienceBuffPercent: 10,
      rewardTeacoin: 0,
      repBonus: 0,
      viral: true
    }
  },
  nang_nong_40_do: {
    id: 'nang_nong_40_do',
    name: '☀️ Đợt Nắng Nóng Đỉnh Điểm',
    durationSec: 90,
    icon: '☀️',
    desc: 'Thời tiết oi bức gay gắt bao trùm khu phố! Nhu cầu giải khát và sự kiên nhẫn của khách hàng thay đổi theo nhiệt độ.',
    effects: {
      customerBuffPercent: 30,
      priceBuffPercent: 20,
      patienceBuffPercent: -20,
      rewardTeacoin: 0,
      repBonus: 0,
      weather: 'heatwave'
    }
  },
  cup_dien_khu_pho: {
    id: 'cup_dien_khu_pho',
    name: '⚡ Sự Cố Điện Lưới Khu Phố',
    durationSec: 90,
    icon: '⚡',
    desc: 'Tuyến phố bất ngờ gặp sự cố điện lưới cục bộ! Không gian oi bức khiến lượng khách và tâm lý chờ đợi bị ảnh hưởng.',
    effects: {
      customerBuffPercent: -30,
      priceBuffPercent: -20,
      patienceBuffPercent: -25,
      rewardTeacoin: 0,
      repBonus: 0
    }
  },
  cam_duong_gio_cao_diem: {
    id: 'cam_duong_gio_cao_diem',
    name: '🚧 Phân Luồng Giao Thông Tuyến Phố',
    durationSec: 120,
    icon: '🚧',
    desc: 'Tuyến đường trước quán đang phân luồng giao thông tạm thời. Lượng khách vãng lai và đơn hàng có sự điều chỉnh.',
    effects: {
      customerBuffPercent: -25,
      priceBuffPercent: -15,
      patienceBuffPercent: -15,
      rewardTeacoin: 0,
      repBonus: 0
    }
  }
};

const EVENTS = JSON.parse(JSON.stringify(DEFAULT_EVENTS));

function clampPercent(val, fallback = 0) {
  const num = Number(val);
  if (!Number.isFinite(num)) return fallback;
  return Math.max(-90, Math.min(500, Math.round(num)));
}

function applyEventRateOverrides(overrides = {}, persist = false) {
  if (!overrides || typeof overrides !== 'object') return EVENTS;

  for (const [evId, cfg] of Object.entries(overrides)) {
    if (!EVENTS[evId] || !cfg || typeof cfg !== 'object') continue;
    const target = EVENTS[evId];

    if (cfg.durationSec !== undefined) {
      const dur = Number(cfg.durationSec);
      if (Number.isFinite(dur) && dur >= 10) {
        target.durationSec = Math.min(7200, Math.round(dur));
      }
    }

    const eff = cfg.effects || cfg;
    if (eff.customerBuffPercent !== undefined) {
      target.effects.customerBuffPercent = clampPercent(eff.customerBuffPercent, target.effects.customerBuffPercent);
    }
    if (eff.priceBuffPercent !== undefined) {
      target.effects.priceBuffPercent = clampPercent(eff.priceBuffPercent, target.effects.priceBuffPercent);
    }
    if (eff.patienceBuffPercent !== undefined) {
      target.effects.patienceBuffPercent = clampPercent(eff.patienceBuffPercent, target.effects.patienceBuffPercent);
    }
    if (eff.rewardTeacoin !== undefined) {
      const tc = Number(eff.rewardTeacoin);
      if (Number.isFinite(tc)) target.effects.rewardTeacoin = Math.max(-1000, Math.min(5000, Math.round(tc)));
    }
    if (eff.repBonus !== undefined) {
      const rep = Number(eff.repBonus);
      if (Number.isFinite(rep)) target.effects.repBonus = Math.max(-5, Math.min(5, Number(rep.toFixed(2))));
    }
  }

  if (persist) {
    try {
      const dir = path.dirname(EVENT_OVERRIDES_PATH);
      if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
      const toSave = {};
      for (const [id, ev] of Object.entries(EVENTS)) {
        toSave[id] = {
          durationSec: ev.durationSec,
          effects: {
            customerBuffPercent: ev.effects.customerBuffPercent,
            priceBuffPercent: ev.effects.priceBuffPercent,
            patienceBuffPercent: ev.effects.patienceBuffPercent,
            rewardTeacoin: ev.effects.rewardTeacoin || 0,
            repBonus: ev.effects.repBonus || 0
          }
        };
      }
      fs.writeFileSync(EVENT_OVERRIDES_PATH, JSON.stringify(toSave, null, 2), 'utf8');
    } catch (e) {
      console.error('[Events] Failed to persist event rate overrides:', e.message);
    }
  }

  return EVENTS;
}

function resetEventRatesToDefault() {
  for (const [id, def] of Object.entries(DEFAULT_EVENTS)) {
    EVENTS[id] = JSON.parse(JSON.stringify(def));
  }
  try {
    if (fs.existsSync(EVENT_OVERRIDES_PATH)) {
      fs.unlinkSync(EVENT_OVERRIDES_PATH);
    }
  } catch (e) {}
  return EVENTS;
}

// Load saved overrides on startup
try {
  if (fs.existsSync(EVENT_OVERRIDES_PATH)) {
    const saved = JSON.parse(fs.readFileSync(EVENT_OVERRIDES_PATH, 'utf8'));
    applyEventRateOverrides(saved, false);
  }
} catch (e) {}

/**
 * Strip exact buff/debuff numbers before sending event info to players
 */
function toPublicEvent(eventObj) {
  if (!eventObj) return null;
  return {
    id: eventObj.id,
    name: eventObj.name,
    icon: eventObj.icon,
    desc: eventObj.desc,
    durationSec: eventObj.durationSec
  };
}

function getEventsList() {
  return Object.values(EVENTS).map(ev => ({
    ...ev,
    defaultDurationSec: DEFAULT_EVENTS[ev.id]?.durationSec || ev.durationSec,
    defaultEffects: DEFAULT_EVENTS[ev.id]?.effects || ev.effects
  }));
}

/**
 * Resolve active event effects on server when generating orders
 */
function resolveEffectiveEvent(activeBuffs) {
  const cur = activeBuffs && activeBuffs.current_event ? activeBuffs.current_event : null;
  if (!cur || !cur.expires_at || cur.expires_at <= Date.now()) {
    return null;
  }
  const baseEv = EVENTS[cur.id];
  const eff = cur.customEffects || baseEv?.effects || cur.effects || {};
  return {
    id: cur.id,
    name: cur.name,
    icon: cur.icon,
    customerBuffPercent: Number(eff.customerBuffPercent || 0),
    priceBuffPercent: Number(eff.priceBuffPercent || 0),
    patienceBuffPercent: Number(eff.patienceBuffPercent || 0),
    expiresAt: cur.expires_at
  };
}

/**
 * Trigger an event for a specific store
 * Supports optional customRates: { customerBuffPercent, priceBuffPercent, patienceBuffPercent, durationSec, rewardTeacoin, repBonus }
 */
async function triggerEventForStore(storeId, eventId, customRates = null) {
  const event = EVENTS[eventId];
  if (!event) {
    throw new Error(`Sự kiện [${eventId}] không tồn tại!`);
  }

  if (customRates && typeof customRates === 'object') {
    applyEventRateOverrides({ [eventId]: customRates }, true);
  }

  const save = await db.prepare('SELECT * FROM game_saves WHERE store_id = ?').get(storeId);
  if (!save) {
    throw new Error('Cửa hàng không tồn tại!');
  }

  const activeBuffs = JSON.parse(save.active_buffs || '{}');
  const now = Date.now();
  const durationSec = Number(event.durationSec || 90);
  const expiresAt = now + (durationSec * 1000);

  const effectiveEffects = {
    customerBuffPercent: Number(event.effects.customerBuffPercent || 0),
    priceBuffPercent: Number(event.effects.priceBuffPercent || 0),
    patienceBuffPercent: Number(event.effects.patienceBuffPercent || 0),
    rewardTeacoin: Number(event.effects.rewardTeacoin || 0),
    repBonus: Number(event.effects.repBonus || 0)
  };

  activeBuffs.current_event = {
    id: event.id,
    name: event.name,
    icon: event.icon,
    desc: event.desc,
    customEffects: effectiveEffects,
    started_at: now,
    expires_at: expiresAt
  };

  // Immediate rewards/penalties for specific events
  let newReputation = Number(save.reputation || 5.0);
  let newTeacoin = Number(save.teacoin || 0);

  if (effectiveEffects.repBonus) {
    newReputation = Math.max(1.0, Math.min(5.0, newReputation + effectiveEffects.repBonus));
  }
  if (effectiveEffects.rewardTeacoin) {
    newTeacoin = Math.max(0, newTeacoin + effectiveEffects.rewardTeacoin);
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
    event: toPublicEvent(event),
    adminEvent: event,
    expiresAt,
    playerMessage: `📢 Sự kiện diễn ra: ${event.name}! ${event.desc}`,
    message: `Đã kích hoạt sự kiện [${event.name}] cho tiệm #${storeId} trong ${durationSec} giây!`
  };
}

/**
 * Trigger event for all stores (server-wide)
 */
async function broadcastEvent(eventId, customRates = null) {
  const event = EVENTS[eventId];
  if (!event) {
    throw new Error(`Sự kiện [${eventId}] không tồn tại!`);
  }

  if (customRates && typeof customRates === 'object') {
    applyEventRateOverrides({ [eventId]: customRates }, true);
  }

  const stores = await db.prepare('SELECT id FROM stores').all();
  for (const s of (stores || [])) {
    try {
      await triggerEventForStore(s.id, eventId, null);
    } catch (e) {}
  }

  return {
    success: true,
    event: toPublicEvent(event),
    adminEvent: event,
    affectedCount: stores ? stores.length : 0,
    playerMessage: `📢 Sự kiện toàn phố: ${event.name}! ${event.desc}`,
    message: `Đã phát sóng sự kiện [${event.name}] tới toàn bộ ${stores ? stores.length : 0} tiệm trên máy chủ!`
  };
}

module.exports = {
  EVENTS,
  DEFAULT_EVENTS,
  applyEventRateOverrides,
  resetEventRatesToDefault,
  toPublicEvent,
  resolveEffectiveEvent,
  getEventsList,
  triggerEventForStore,
  broadcastEvent
};
