const crypto = require('crypto');
const db = require('../../models/db');
const anticheat = require('../anticheat.service');
const { gameCache } = require('../cache.service');
const { invalidateStoreCache } = require('./cache.helper');
const { LOCATIONS, DECORATIONS } = require('../../data/locations');
const { INGREDIENTS, DEFAULT_INVENTORY } = require('../../data/ingredients');
const NEGOTIATION = require('../../data/negotiation');
const { RECIPES, CUSTOMERS, UPGRADES, CORE_RECIPES } = require('./constants');
const { getOrInitDailyQuests } = require('./quest.service');
const { getCollabData } = require('./collab.service');

// Helper to generate store code
function generateStoreCode() {
  return 'HYHY-' + crypto.randomBytes(3).toString('hex').toUpperCase();
}

// Cache static data that doesn't change often
function getStaticData() {
  const cacheKey = 'static:all';
  const cached = gameCache.staticData.get(cacheKey);
  if (cached) {
    return cached;
  }

  const staticData = {
    recipes_db: RECIPES,
    customers_db: CUSTOMERS,
    locations: LOCATIONS,
    ingredients: INGREDIENTS,
    decorations_db: DECORATIONS,
    negotiation: NEGOTIATION,
    upgrades: UPGRADES
  };

  // Cache static data for 5 minutes (300000ms)
  gameCache.staticData.set(cacheKey, staticData, 300000);
  return staticData;
}

// Create or get store profile
async function getOrCreateStore(storeName, inputCode) {
  let store = null;
  if (inputCode) {
    store = await db.prepare('SELECT * FROM stores WHERE store_code = ?').get(inputCode);
  }

  if (!store) {
    const code = generateStoreCode();
    const token = crypto.randomBytes(16).toString('hex');
    const now = new Date().toISOString();

    const result = await db.prepare(`
      INSERT INTO stores (store_code, store_name, session_token, created_at)
      VALUES (?, ?, ?, ?)
    `).run(code, storeName || 'Tiệm Trà Sữa HeeHee', token, now);

    const storeId = Number(result.lastInsertRowid);

    const initialSave = {
      store_id: storeId,
      chapter: 1,
      day_in_game: 1,
      money: 200000,
      debt_remaining: 3000000,
      reputation: 5.0,
      teacoin: 0
    };
    const hash = anticheat.generateSaveHash(initialSave);

    await db.prepare(`
      INSERT INTO game_saves (store_id, chapter, day_in_game, money, debt_remaining, reputation, teacoin, recipes, save_hash, updated_at)
      VALUES (?, 1, 1, 200000, 3000000, 5.0, 0, ?, ?, ?)
    `).run(storeId, JSON.stringify(CORE_RECIPES), hash, now);

    store = await db.prepare('SELECT * FROM stores WHERE id = ?').get(storeId);
  }

  return await getStoreState(store.id);
}

// Get full state of a store with caching
async function getStoreState(storeId) {
  if (!storeId) return null;
  const id = Number(storeId);
  if (isNaN(id) || id <= 0) return null;

  // Try cache first (5 second TTL for fast-changing data)
  const cacheKey = `store:${id}`;
  const cached = gameCache.storeState.get(cacheKey);
  if (cached) {
    return cached;
  }

  // Try optimized query first
  let optimizedResult = await db.getStoreStateOptimized(id);
  if (optimizedResult) {
    // Add static data from cache
    const staticData = getStaticData();
    optimizedResult.recipes_db = staticData.recipes_db;
    optimizedResult.customers_db = staticData.customers_db;
    optimizedResult.locations = staticData.locations;
    optimizedResult.ingredients = staticData.ingredients;
    optimizedResult.decorations_db = staticData.decorations_db;
    optimizedResult.negotiation = staticData.negotiation;

    // Cache for 5 seconds (reduced for game state that changes frequently)
    gameCache.storeState.set(cacheKey, optimizedResult, 5000);
    return optimizedResult;
  }

  // Fallback to original method if optimized fails
  const store = await db.prepare('SELECT * FROM stores WHERE id = ?').get(id);
  if (!store) return null;

  let save = await db.prepare('SELECT * FROM game_saves WHERE store_id = ?').get(id);
  if (!save) {
    console.warn(`[Self-Healing] Missing game_saves for store ID ${id}, auto-creating default save...`);
    const initialSave = {
      store_id: id,
      chapter: 1,
      day_in_game: 1,
      money: 200000,
      debt_remaining: 3000000,
      reputation: 5.0
    };
    const hash = anticheat.generateSaveHash(initialSave);
    const now = new Date().toISOString();

    await db.prepare(`
      INSERT INTO game_saves (store_id, chapter, day_in_game, money, debt_remaining, reputation, recipes, save_hash, updated_at)
      VALUES (?, 1, 1, 200000, 3000000, 5.0, ?, ?, ?)
    `).run(id, JSON.stringify(CORE_RECIPES), hash, now);

    save = await db.prepare('SELECT * FROM game_saves WHERE store_id = ?').get(id);
  }

  const chapter = save ? (save.chapter || 1) : 1;
  const daily = await anticheat.getOrCreateDailyStats(id, chapter);

  // Get static data from cache
  const staticData = getStaticData();

  const result = {
    store_id: store.id,
    username: store.username || store.store_name,
    store_code: store.store_code,
    store_name: store.store_name,
    session_token: store.session_token,
    save: {
      store_id: store.id,
      chapter: save.chapter,
      day_in_game: save.day_in_game,
      money: save.money,
      debt_remaining: save.debt_remaining,
      reputation: save.reputation,
      teacoin: save.teacoin || 0,
      daily_quests: getOrInitDailyQuests(save),
      is_jailed: save.is_jailed,
      jail_reason: save.jail_reason,
      rest_until_ts: save.rest_until_ts || 0,
      active_buffs: (() => {
        const buffs = JSON.parse(save.active_buffs || '{}');
        if (!buffs.tiktoker_daily || buffs.tiktoker_daily.day !== save.day_in_game) {
          buffs.tiktoker_daily = {
            day: save.day_in_game,
            count: 0,
            nextCost: 25000
          };
        }
        return buffs;
      })(),
      inventory: { ...DEFAULT_INVENTORY, ...JSON.parse(save.inventory || '{}') },
      upgrades: JSON.parse(save.upgrades || '{}'),
      recipes: Array.from(new Set([...CORE_RECIPES, ...JSON.parse(save.recipes || '[]')])),
      custom_prices: JSON.parse(save.custom_prices || '{}'),
      properties: JSON.parse(save.properties || '{}'),
      decorations: JSON.parse(save.decorations || '[]')
    },
    collabs: await getCollabData(id),
    daily_stats: daily,
    weather: (() => {
      const buffs = JSON.parse(save.active_buffs || '{}');
      const { WEATHER_TYPES } = require('./weather.service');
      if (buffs.weather && WEATHER_TYPES[buffs.weather.id]) {
        return WEATHER_TYPES[buffs.weather.id];
      }
      return WEATHER_TYPES.sunny;
    })(),
    recipes_db: staticData.recipes_db,
    customers_db: staticData.customers_db,
    locations: staticData.locations,
    ingredients: staticData.ingredients,
    decorations_db: staticData.decorations_db,
    room_decorations_db: require('../../data/room_decorations').ROOM_DECORATIONS,
    negotiation: staticData.negotiation
  };

  // Cache for 5 seconds
  gameCache.storeState.set(cacheKey, result, 5000);
  return result;
}

// Add cache stats endpoint
async function getCacheStats() {
  return {
    cache: gameCache.getStats(),
    database: await db.healthCheck(),
    timestamp: new Date().toISOString()
  };
}

module.exports = {
  generateStoreCode,
  getStaticData,
  getOrCreateStore,
  getStoreState,
  getCacheStats
};
