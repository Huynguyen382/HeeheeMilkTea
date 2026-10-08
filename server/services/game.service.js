/**
 * Game Service Facade
 * Aggregates domain sub-services for modularity, clean maintenance, and backward compatibility.
 */

const {
  RECIPES,
  CUSTOMERS,
  UPGRADES,
  SHELF_TOPPINGS,
  TEA_BASES,
  CORE_RECIPES,
  SHIPPER_SNACKS,
  generateCustomerToppings
} = require('./game/constants');

const { INGREDIENTS, DEFAULT_INVENTORY } = require('../data/ingredients');
const { invalidateStoreCache, gameCache } = require('./game/cache.helper');

const {
  generateStoreCode,
  getStaticData,
  getOrCreateStore,
  getStoreState,
  getCacheStats
} = require('./game/store.service');

const {
  generateOrder,
  handleSnackDecision,
  recordOrderFailure,
  inviteTiktoker,
  negotiateOrder,
  setCustomPrices
} = require('./game/order.service');

const {
  DAILY_QUESTS_TEMPLATE,
  ALL_QUESTS_BONUS_TEACOIN,
  getOrInitDailyQuests,
  updateDailyQuestProgress,
  getDailyQuests,
  claimDailyQuest
} = require('./game/quest.service');

const {
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
} = require('./game/collab.service');

const {
  getFriends,
  sendFriendRequest,
  acceptFriendRequest,
  rejectFriendRequest,
  removeFriend,
  sendFriendGift
} = require('./game/friend.service');

const {
  payDebt,
  unlockChapter2,
  policeFine
} = require('./game/progression.service');

const {
  buyUpgrade,
  useTalisman,
  stealPet,
  redeemPet,
  shooThief
} = require('./game/upgrade.service');

const {
  buyIngredients,
  endShift,
  skipRest
} = require('./game/inventory.service');

module.exports = {
  // Constants & Static Data
  RECIPES,
  CUSTOMERS,
  UPGRADES,
  INGREDIENTS,
  DEFAULT_INVENTORY,
  SHELF_TOPPINGS,
  TEA_BASES,
  CORE_RECIPES,
  SHIPPER_SNACKS,
  generateCustomerToppings,

  // Cache & System helpers
  invalidateStoreCache,
  gameCache,
  getCacheStats,
  getStaticData,
  generateStoreCode,

  // Store Management
  getOrCreateStore,
  getStoreState,

  // Order & Customer System
  generateOrder,
  handleSnackDecision,
  recordOrderFailure,
  inviteTiktoker,
  negotiateOrder,
  setCustomPrices,

  // Daily Quests & TeaCoin
  DAILY_QUESTS_TEMPLATE,
  ALL_QUESTS_BONUS_TEACOIN,
  getOrInitDailyQuests,
  updateDailyQuestProgress,
  getDailyQuests,
  claimDailyQuest,

  // Collab System
  THREE_DAYS_MS,
  pruneExpiredCollabs,
  getActiveCollabCount,
  getCollabData,
  addCollab,
  acceptCollab,
  declineCollab,
  cancelCollab,
  recordStoreHeartbeat,
  isStoreOnline,

  // Friend System
  getFriends,
  sendFriendRequest,
  acceptFriendRequest,
  rejectFriendRequest,
  removeFriend,
  sendFriendGift,

  // Progression & Inspection
  payDebt,
  unlockChapter2,
  policeFine,

  // Upgrades, Talismans & Pets
  buyUpgrade,
  useTalisman,
  stealPet,
  redeemPet,
  shooThief,

  // Inventory & Shifts
  buyIngredients,
  endShift,
  skipRest,

  // Events & World Dynamic
  ...require('./game/event.service'),

  // Weather System
  ...require('./game/weather.service'),

  // Room & Decor System
  ...require('./game/room.service')
};
