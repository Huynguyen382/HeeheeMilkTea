/**
 * Dynamic Weather System Engine
 * Supports: Sunny, Rainy, Stormy (with lightning & thunder), Cloudy, Windy
 * Allows Admin to customize buff/debuff percentages while keeping exact rates hidden from players.
 */

const fs = require('fs');
const path = require('path');
const db = require('../../models/db');
const anticheat = require('../anticheat.service');
const { invalidateStoreCache } = require('./cache.helper');

const WEATHER_OVERRIDES_PATH = path.join(__dirname, '../../../data/weather_rates_overrides.json');

const DEFAULT_WEATHER_TYPES = {
  sunny: {
    id: 'sunny',
    name: 'Nắng Vàng Rực Rỡ',
    icon: '☀️',
    desc: 'Trời quang đãng nắng ấm chan hòa. Khách đi dạo phố ghé quầy nhộn nhịp hơn thường ngày!',
    customerBonus: 0.25,   // +25% lượng khách
    tipBonus: 0.10,        // +10% giá/tip
    patienceBonus: 0,      // 0% thời gian chờ
    shipperBonus: 0.20,    // 20% tỉ lệ shipper
    skyTheme: 'sunny'
  },
  rainy: {
    id: 'rainy',
    name: 'Mưa Rào Mát Rượi',
    icon: '🌧️',
    desc: 'Cơn mưa rào mát lạnh làm dịu phố phường. Khách ghé trú mưa thong thả chờ đợi đồ uống lâu hơn!',
    customerBonus: 0,
    tipBonus: 0.05,
    patienceBonus: 0.40,
    shipperBonus: 0.40,
    skyTheme: 'rainy'
  },
  stormy: {
    id: 'stormy',
    name: 'Giông Bão Sấm Sét',
    icon: '⛈️',
    desc: 'Mưa to gió lớn kèm sấm sét rền vang! Khách đi bộ giảm bớt nhưng nhu cầu đặt Shipper giao tận nơi và tiền thưởng biến động mạnh!',
    customerBonus: -0.15,
    tipBonus: 0.25,
    patienceBonus: 0.20,
    shipperBonus: 0.60,
    isStorm: true,
    lightning: true,
    skyTheme: 'stormy'
  },
  cloudy: {
    id: 'cloudy',
    name: 'Trời Râm Mát Mẻ',
    icon: '⛅',
    desc: 'Mây che bóng râm mát dịu, thời tiết lý tưởng để khách dạo phố và nhâm nhi trà sữa cùng bạn bè.',
    customerBonus: 0.10,
    tipBonus: 0.05,
    patienceBonus: 0.15,
    shipperBonus: 0.25,
    skyTheme: 'cloudy'
  },
  windy: {
    id: 'windy',
    name: 'Gió Mùa Vi Vu',
    icon: '🍃',
    desc: 'Từng cơn gió mát thổi qua hàng cây, cánh hoa rơi lượn bay. Khách thích ghé mua trà sữa mang đi.',
    customerBonus: 0.15,
    tipBonus: 0.10,
    patienceBonus: 0.10,
    shipperBonus: 0.25,
    skyTheme: 'windy'
  }
};

// Deep clone defaults into live WEATHER_TYPES
const WEATHER_TYPES = JSON.parse(JSON.stringify(DEFAULT_WEATHER_TYPES));

function clampRate(val, fallback = 0) {
  const num = Number(val);
  if (!Number.isFinite(num)) return fallback;
  // Allow from -90% (-0.90) debuff up to +500% (+5.0) buff
  return Math.max(-0.90, Math.min(5.0, num));
}

function applyWeatherRateOverrides(overrides = {}, persist = false) {
  if (!overrides || typeof overrides !== 'object') return WEATHER_TYPES;

  for (const [wId, cfg] of Object.entries(overrides)) {
    if (!WEATHER_TYPES[wId] || !cfg || typeof cfg !== 'object') continue;
    const target = WEATHER_TYPES[wId];

    // Support both decimal (0.25) and percentage (25) inputs
    if (cfg.customerBuffPercent !== undefined) {
      target.customerBonus = clampRate(Number(cfg.customerBuffPercent) / 100, target.customerBonus);
    } else if (cfg.customerBonus !== undefined) {
      target.customerBonus = clampRate(cfg.customerBonus, target.customerBonus);
    }

    if (cfg.priceBuffPercent !== undefined) {
      target.tipBonus = clampRate(Number(cfg.priceBuffPercent) / 100, target.tipBonus);
    } else if (cfg.tipBonus !== undefined) {
      target.tipBonus = clampRate(cfg.tipBonus, target.tipBonus);
    }

    if (cfg.patienceBuffPercent !== undefined) {
      target.patienceBonus = clampRate(Number(cfg.patienceBuffPercent) / 100, target.patienceBonus);
    } else if (cfg.patienceBonus !== undefined) {
      target.patienceBonus = clampRate(cfg.patienceBonus, target.patienceBonus);
    }

    if (cfg.shipperBuffPercent !== undefined) {
      target.shipperBonus = clampRate(Number(cfg.shipperBuffPercent) / 100, target.shipperBonus);
      target.shipperRate = target.shipperBonus;
    } else if (cfg.shipperBonus !== undefined) {
      target.shipperBonus = clampRate(cfg.shipperBonus, target.shipperBonus);
      target.shipperRate = target.shipperBonus;
    }
  }

  if (persist) {
    try {
      const dir = path.dirname(WEATHER_OVERRIDES_PATH);
      if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
      const toSave = {};
      for (const [id, w] of Object.entries(WEATHER_TYPES)) {
        toSave[id] = {
          customerBonus: w.customerBonus,
          tipBonus: w.tipBonus,
          patienceBonus: w.patienceBonus,
          shipperBonus: w.shipperBonus
        };
      }
      fs.writeFileSync(WEATHER_OVERRIDES_PATH, JSON.stringify(toSave, null, 2), 'utf8');
    } catch (e) {
      console.error('[Weather] Failed to persist weather rate overrides:', e.message);
    }
  }

  return WEATHER_TYPES;
}

function resetWeatherRatesToDefault() {
  for (const [id, def] of Object.entries(DEFAULT_WEATHER_TYPES)) {
    WEATHER_TYPES[id] = JSON.parse(JSON.stringify(def));
  }
  try {
    if (fs.existsSync(WEATHER_OVERRIDES_PATH)) {
      fs.unlinkSync(WEATHER_OVERRIDES_PATH);
    }
  } catch (e) {}
  return WEATHER_TYPES;
}

// Load saved overrides on startup
try {
  if (fs.existsSync(WEATHER_OVERRIDES_PATH)) {
    const saved = JSON.parse(fs.readFileSync(WEATHER_OVERRIDES_PATH, 'utf8'));
    applyWeatherRateOverrides(saved, false);
  }
} catch (e) {}

/**
 * Strip numeric buff/debuff rates before sending weather info to player clients
 */
function toPublicWeather(weatherObj) {
  if (!weatherObj) return toPublicWeather(WEATHER_TYPES.sunny);
  const wId = weatherObj.id || 'sunny';
  return {
    id: weatherObj.id,
    name: weatherObj.name,
    icon: weatherObj.icon,
    desc: weatherObj.desc,
    message: getWeatherForecastMessage(wId),
    forecast: getWeatherForecastMessage(wId),
    isStorm: !!weatherObj.isStorm,
    lightning: !!weatherObj.lightning,
    skyTheme: weatherObj.skyTheme || weatherObj.id,
    since: weatherObj.since || Date.now()
  };
}

/**
 * Weighted random weather selection for a new day
 */
function getRandomWeather() {
  const roll = Math.random();
  if (roll < 0.40) return WEATHER_TYPES.sunny;
  if (roll < 0.65) return WEATHER_TYPES.rainy;
  if (roll < 0.82) return WEATHER_TYPES.stormy;
  if (roll < 0.93) return WEATHER_TYPES.cloudy;
  return WEATHER_TYPES.windy;
}

/**
 * Get current weather for a store (returns public player-safe object)
 */
async function getCurrentWeather(storeId) {
  const save = await db.prepare('SELECT active_buffs FROM game_saves WHERE store_id = ?').get(storeId);
  if (!save) return toPublicWeather(WEATHER_TYPES.sunny);

  let activeBuffs = {};
  try {
    activeBuffs = JSON.parse(save.active_buffs || '{}');
  } catch (e) {}

  if (activeBuffs.weather && WEATHER_TYPES[activeBuffs.weather.id]) {
    const base = WEATHER_TYPES[activeBuffs.weather.id];
    return toPublicWeather({
      ...base,
      since: activeBuffs.weather.since || Date.now()
    });
  }

  return toPublicWeather(WEATHER_TYPES.sunny);
}

/**
 * Resolve effective server-side weather with any per-store custom overrides
 */
function resolveEffectiveWeather(activeBuffs) {
  const wData = activeBuffs && activeBuffs.weather ? activeBuffs.weather : null;
  const weatherId = wData && WEATHER_TYPES[wData.id] ? wData.id : 'sunny';
  const base = WEATHER_TYPES[weatherId] || WEATHER_TYPES.sunny;

  if (wData && wData.customOverrides && typeof wData.customOverrides === 'object') {
    const ov = wData.customOverrides;
    return {
      ...base,
      customerBonus: ov.customerBonus !== undefined ? Number(ov.customerBonus) : base.customerBonus,
      tipBonus: ov.tipBonus !== undefined ? Number(ov.tipBonus) : base.tipBonus,
      patienceBonus: ov.patienceBonus !== undefined ? Number(ov.patienceBonus) : base.patienceBonus,
      shipperBonus: ov.shipperBonus !== undefined ? Number(ov.shipperBonus) : base.shipperBonus
    };
  }
  return base;
}

function getWeatherForecastMessage(weatherId) {
  const w = WEATHER_TYPES[weatherId] || WEATHER_TYPES.sunny;
  const forecasts = {
    sunny: `📺 Dự báo thời tiết: Bầu trời chuyển sang ${w.icon} ${w.name} — Trời quang mây tạnh, nắng ấm chan hòa khắp phố phường!`,
    rainy: `📺 Dự báo thời tiết: Khu vực đón đợt ${w.icon} ${w.name} — Trời đổ mưa rào mát lạnh, đường phố lất phất mưa bay!`,
    stormy: `📺 Dự báo thời tiết: Cảnh báo ${w.icon} ${w.name} — Mây đen kéo đến kèm mưa lớn và sấm sét rền vang!`,
    cloudy: `📺 Dự báo thời tiết: Bầu trời chuyển sang ${w.icon} ${w.name} — Mây nhẹ che nắng, không khí dịu mát dễ chịu!`,
    windy: `📺 Dự báo thời tiết: Đón đợt ${w.icon} ${w.name} — Từng cơn gió mát thổi qua hàng cây, lá bay xào xạc!`
  };
  return forecasts[w.id] || `📺 Dự báo thời tiết: Khu vực chuyển sang ${w.icon} ${w.name} — ${w.desc}`;
}

/**
 * Set weather for a specific store (via Admin or daily progression)
 * Supports optional customRates: { customerBuffPercent, priceBuffPercent, patienceBuffPercent, shipperBuffPercent }
 */
async function setWeatherForStore(storeId, weatherId, customRates = null, skipPersist = false) {
  const weather = WEATHER_TYPES[weatherId];
  if (!weather) {
    throw new Error(`Loại thời tiết [${weatherId}] không hợp lệ! Hỗ trợ: sunny, rainy, stormy, cloudy, windy`);
  }

  // If Admin provided customRates, also update WEATHER_TYPES[weatherId] so it stays consistent
  let customOverrides = null;
  if (customRates && typeof customRates === 'object') {
    if (!skipPersist) {
      applyWeatherRateOverrides({ [weatherId]: customRates }, true);
    }
    customOverrides = {
      customerBonus: WEATHER_TYPES[weatherId].customerBonus,
      tipBonus: WEATHER_TYPES[weatherId].tipBonus,
      patienceBonus: WEATHER_TYPES[weatherId].patienceBonus,
      shipperBonus: WEATHER_TYPES[weatherId].shipperBonus
    };
  }

  const save = await db.prepare('SELECT * FROM game_saves WHERE store_id = ?').get(storeId);
  if (!save) throw new Error('Cửa hàng không tồn tại!');

  let activeBuffs = {};
  try {
    activeBuffs = JSON.parse(save.active_buffs || '{}');
  } catch (e) {}

  activeBuffs.weather = {
    id: weather.id,
    name: weather.name,
    icon: weather.icon,
    desc: weather.desc,
    since: Date.now(),
    ...(customOverrides ? { customOverrides } : {})
  };

  const updatedState = {
    store_id: storeId,
    chapter: Number(save.chapter),
    day_in_game: Number(save.day_in_game),
    money: Number(save.money),
    debt_remaining: Number(save.debt_remaining),
    reputation: Number(save.reputation),
    teacoin: Number(save.teacoin || 0)
  };
  const hash = anticheat.generateSaveHash(updatedState);

  await db.prepare(`
    UPDATE game_saves 
    SET active_buffs = ?, save_hash = ?, updated_at = ?
    WHERE store_id = ?
  `).run(JSON.stringify(activeBuffs), hash, new Date().toISOString(), storeId);

  invalidateStoreCache(storeId);

  const forecastMsg = getWeatherForecastMessage(weatherId);

  return {
    success: true,
    weather: toPublicWeather(WEATHER_TYPES[weatherId]),
    adminWeather: WEATHER_TYPES[weatherId],
    playerMessage: forecastMsg,
    message: forecastMsg
  };
}

/**
 * Broadcast weather change to all stores on server
 */
async function setGlobalWeather(weatherId, customRates = null) {
  const weather = WEATHER_TYPES[weatherId];
  if (!weather) {
    throw new Error(`Loại thời tiết [${weatherId}] không hợp lệ!`);
  }

  if (customRates && typeof customRates === 'object') {
    applyWeatherRateOverrides({ [weatherId]: customRates }, true);
  }

  const stores = await db.prepare('SELECT id FROM stores').all();
  for (const s of (stores || [])) {
    try {
      await setWeatherForStore(s.id, weatherId, customRates, true);
    } catch (e) {}
  }

  const forecastMsg = getWeatherForecastMessage(weatherId);

  return {
    success: true,
    weather: toPublicWeather(WEATHER_TYPES[weatherId]),
    adminWeather: WEATHER_TYPES[weatherId],
    affectedStores: stores ? stores.length : 0,
    playerMessage: forecastMsg,
    message: forecastMsg
  };
}

module.exports = {
  WEATHER_TYPES,
  DEFAULT_WEATHER_TYPES,
  applyWeatherRateOverrides,
  resetWeatherRatesToDefault,
  toPublicWeather,
  getWeatherForecastMessage,
  resolveEffectiveWeather,
  getRandomWeather,
  getCurrentWeather,
  setWeatherForStore,
  setGlobalWeather
};
