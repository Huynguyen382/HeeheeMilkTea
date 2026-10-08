const { gameCache } = require('../cache.service');

/**
 * Invalidate store cached state whenever store changes occur
 * @param {number|string} storeId
 */
function invalidateStoreCache(storeId) {
  if (storeId) {
    gameCache.storeState.delete(`store:${storeId}`);
    if (gameCache.collabs) {
      gameCache.collabs.delete(`collab:${storeId}`);
    }
  }
}

module.exports = {
  gameCache,
  invalidateStoreCache
};
