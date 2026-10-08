/**
 * Dynamic Weather System Engine
 * Supports: Sunny, Rainy, Stormy (with lightning & thunder), Cloudy, Windy
 */

const db = require('../../models/db');
const anticheat = require('../anticheat.service');
const { invalidateStoreCache } = require('./cache.helper');

const WEATHER_TYPES = {
  sunny: {
    id: 'sunny',
    name: 'Nắng Vàng Rực Rỡ',
    icon: '☀️',
    desc: 'Trời quang đãng nắng ấm chan hòa. Khách đi dạo phố nhiều, lượng khách ghé quầy tăng +25%!',
    customerBonus: 0.25,
    tipBonus: 0.1,
    patienceBonus: 0,
    shipperRate: 0.2,
    skyTheme: 'sunny'
  },
  rainy: {
    id: 'rainy',
    name: 'Mưa Rào Mát Rượi',
    icon: '🌧️',
    desc: 'Cơn mưa rào mát lạnh làm dịu phố phường. Khách ghé trú mưa kiên nhẫn hơn +40%!',
    customerBonus: 0,
    tipBonus: 0.05,
    patienceBonus: 0.4,
    shipperRate: 0.4,
    skyTheme: 'rainy'
  },
  stormy: {
    id: 'stormy',
    name: 'Giông Bão Sấm Sét',
    icon: '⛈️',
    desc: 'Mưa to gió lớn, sấm sét giật chớp lóe sáng rền vang! Khách ngại ra đường nhưng đặt ship xe máy tăng vọt +60% và tiền tip shipper +25%!',
    customerBonus: -0.15, // Người đi bộ giảm nhẹ
    tipBonus: 0.25,
    patienceBonus: 0.2,
    shipperBonus: 0.6, // Shipper xuất hiện nhiều gấp đôi
    isStorm: true,
    lightning: true,
    skyTheme: 'stormy'
  },
  cloudy: {
    id: 'cloudy',
    name: 'Trời Râm Mát Mẻ',
    icon: '⛅',
    desc: 'Mây che bóng râm mát dịu, thời tiết lý tưởng để nhâm nhi trà sữa cùng bạn bè.',
    customerBonus: 0.1,
    tipBonus: 0.05,
    patienceBonus: 0.15,
    shipperRate: 0.25,
    skyTheme: 'cloudy'
  },
  windy: {
    id: 'windy',
    name: 'Gió Mùa Vi Vu',
    icon: '🍃',
    desc: 'Từng cơn gió mát thổi qua hàng cây, cánh hoa rơi lượn bay. Khách thích mua trà sữa mang đi.',
    customerBonus: 0.15,
    tipBonus: 0.1,
    patienceBonus: 0.1,
    shipperRate: 0.25,
    skyTheme: 'windy'
  }
};

/**
 * Weighted random weather selection for a new day
 */
function getRandomWeather() {
  const roll = Math.random();
  if (roll < 0.40) return WEATHER_TYPES.sunny;
  if (roll < 0.65) return WEATHER_TYPES.rainy;
  if (roll < 0.82) return WEATHER_TYPES.stormy; // 17% chance of thunderstorm
  if (roll < 0.93) return WEATHER_TYPES.cloudy;
  return WEATHER_TYPES.windy;
}

/**
 * Get current weather for a store
 */
async function getCurrentWeather(storeId) {
  const save = await db.prepare('SELECT active_buffs FROM game_saves WHERE store_id = ?').get(storeId);
  if (!save) return WEATHER_TYPES.sunny;

  let activeBuffs = {};
  try {
    activeBuffs = JSON.parse(save.active_buffs || '{}');
  } catch (e) {}

  if (activeBuffs.weather && WEATHER_TYPES[activeBuffs.weather.id]) {
    return {
      ...WEATHER_TYPES[activeBuffs.weather.id],
      since: activeBuffs.weather.since || Date.now()
    };
  }

  // Default to Sunny if none configured
  return WEATHER_TYPES.sunny;
}

/**
 * Set weather for a specific store (via Admin or daily progression)
 */
async function setWeatherForStore(storeId, weatherId) {
  const weather = WEATHER_TYPES[weatherId];
  if (!weather) {
    throw new Error(`Loại thời tiết [${weatherId}] không hợp lệ! Hỗ trợ: sunny, rainy, stormy, cloudy, windy`);
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
    since: Date.now()
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

  return {
    success: true,
    weather,
    message: `Thời tiết tại tiệm đã chuyển sang: ${weather.icon} ${weather.name}!`
  };
}

/**
 * Broadcast weather change to all stores on server
 */
async function setGlobalWeather(weatherId) {
  const weather = WEATHER_TYPES[weatherId];
  if (!weather) {
    throw new Error(`Loại thời tiết [${weatherId}] không hợp lệ!`);
  }

  const stores = await db.prepare('SELECT id FROM stores').all();
  for (const s of (stores || [])) {
    try {
      await setWeatherForStore(s.id, weatherId);
    } catch (e) {}
  }

  return {
    success: true,
    weather,
    affectedStores: stores ? stores.length : 0,
    message: `Đã áp dụng thời tiết [${weather.icon} ${weather.name}] trên toàn bộ hệ thống!`
  };
}

module.exports = {
  WEATHER_TYPES,
  getRandomWeather,
  getCurrentWeather,
  setWeatherForStore,
  setGlobalWeather
};

