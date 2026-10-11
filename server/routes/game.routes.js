const express = require('express');
const db = require('../models/db');
const gameService = require('../services/game.service');
const anticheat = require('../services/anticheat.service');
const { authStore } = require('../middleware/auth.middleware');

const liveSync = require('../services/live-sync.service');

const router = express.Router();
const handle = (label, fn) => async (req, res) => {
  try { res.json(await fn(req)); }
  catch (err) { console.error(`${label} error:`, err); res.status(500).json({ error: err.message }); }
};

router.get('/order', authStore, handle('Generate order', req => {
  const isShipper = req.query.isShipper === 'true' || req.query.isShipper === '1';
  return gameService.generateOrder(req.store.id, { isShipper }).then(order => ({ order }));
}));
router.post('/serve', authStore, async (req, res) => {
  try {
    const { orderId, timeTaken, recipeId, sugar, ice, toppings, pausedTimeMs } = req.body;
    if (!orderId || !timeTaken || !recipeId || !sugar || !ice) return res.status(400).json({ error: 'Thiếu thông tin đơn hàng' });
    res.json(await anticheat.validateAndCompleteOrder(req.store.id, orderId, Number(timeTaken), recipeId, sugar, ice, toppings, Number(pausedTimeMs || 0)));
  } catch (err) { console.error('Serve order error:', err); res.status(500).json({ error: err.message }); }
});
router.post('/snack-decision', authStore, handle('Snack decision', req => gameService.handleSnackDecision(req.store.id, !!req.body.accept)));
router.post('/order-fail', authStore, handle('Order fail', req => gameService.recordOrderFailure(req.store.id, req.body.orderId, !!req.body.isTiktoker)));
router.get('/collabs', authStore, handle('Get collabs', req => gameService.getCollabData(req.store.id)));
router.post('/collab', authStore, async (req, res) => {
  if (!req.body.friendCode) return res.status(400).json({ error: 'Vui lòng nhập Mã Quán bạn bè!' });
  try { res.json(await gameService.addCollab(req.store.id, req.body.friendCode)); }
  catch (err) { console.error('Collab error:', err); res.status(500).json({ error: err.message }); }
});
router.post('/collab/accept', authStore, handle('Accept collab', req => gameService.acceptCollab(req.store.id, req.body.collabId)));
router.post('/collab/decline', authStore, handle('Decline collab', req => gameService.declineCollab(req.store.id, req.body.collabId)));
router.post('/collab/cancel', authStore, handle('Cancel collab', req => gameService.cancelCollab(req.store.id, req.body.collabId)));

// Friend System Routes
router.get('/friends', authStore, handle('Get friends', req => gameService.getFriends(req.store.id)));
router.post('/friends/request', authStore, handle('Send friend request', req => gameService.sendFriendRequest(req.store.id, req.body.friendCode)));
router.post('/friends/accept', authStore, handle('Accept friend request', req => gameService.acceptFriendRequest(req.store.id, req.body.requestId)));
router.post('/friends/reject', authStore, handle('Reject friend request', req => gameService.rejectFriendRequest(req.store.id, req.body.requestId)));
router.post('/friends/remove', authStore, handle('Remove friend', req => gameService.removeFriend(req.store.id, req.body.friendshipId)));
router.post('/friends/gift', authStore, handle('Send friend gift', req => gameService.sendFriendGift(req.store.id, req.body.friendshipId)));
router.post('/pay-debt', authStore, async (req, res) => {
  if (!req.body.amount || req.body.amount <= 0) return res.status(400).json({ error: 'Số tiền không hợp lệ' });
  try { res.json(await gameService.payDebt(req.store.id, Number(req.body.amount))); }
  catch (err) { console.error('Pay debt error:', err); res.status(500).json({ error: err.message }); }
});
router.post('/upgrade', authStore, handle('Upgrade', req => gameService.buyUpgrade(req.store.id, req.body.upgradeId)));
router.post('/use-talisman', authStore, handle('Use talisman', req => gameService.useTalisman(req.store.id)));
router.post('/unlock-chapter-2', authStore, handle('Unlock Chapter 2', req => gameService.unlockChapter2(req.store.id)));
router.post('/police-fine', authStore, handle('Police fine', req => gameService.policeFine(req.store.id)));
router.post('/steal-pet', authStore, handle('Steal pet', req => gameService.stealPet(req.store.id)));
router.post('/redeem-pet', authStore, handle('Redeem pet', req => gameService.redeemPet(req.store.id)));
router.post('/shoo-thief', authStore, handle('Shoo thief', req => gameService.shooThief(req.store.id)));
router.post('/invite-tiktoker', authStore, handle('Invite tiktoker', req => gameService.inviteTiktoker(req.store.id)));
router.post('/buy-ingredients', authStore, handle('Buy ingredients', req => gameService.buyIngredients(req.store.id, req.body.items)));
router.post('/advance-day', authStore, handle('Advance day', req => gameService.endShift(req.store.id)));
router.post('/end-shift', authStore, handle('End shift', req => gameService.endShift(req.store.id)));
router.post('/unlock-chapter-3', authStore, handle('Unlock Chapter 3', req => gameService.unlockChapter3(req.store.id)));
router.post('/unlock-chapter-4', authStore, handle('Unlock Chapter 4', req => gameService.unlockChapter4(req.store.id)));
router.post('/negotiate', authStore, handle('Negotiate order', req => gameService.negotiateOrder(req.store.id, req.body.orderId, !!req.body.accept)));
router.post('/custom-prices', authStore, handle('Custom prices', req => gameService.setCustomPrices(req.store.id, req.body.customPrices)));
router.post('/use-sabotage', authStore, handle('Use sabotage card', req => gameService.useSabotageCard(req.store.id, req.body.cardId, req.body.targetStoreCode)));
router.post('/use-support-card', authStore, handle('Use support card', req => gameService.useSupportCard(req.store.id, req.body.cardId)));
router.post('/skip-rest', authStore, handle('Skip rest', req => gameService.skipRest(req.store.id)));

// Daily Quests Routes
router.get('/quests', authStore, handle('Get daily quests', req => gameService.getDailyQuests(req.store.id)));
router.post('/quests/claim', authStore, handle('Claim daily quest', req => gameService.claimDailyQuest(req.store.id, req.body.questId)));

// Cozy Room & Outfits Routes
router.get('/room', authStore, handle('Get room state', req => gameService.getRoomState(req.store.id)));
router.post('/room/buy', authStore, handle('Buy room decor', req => gameService.buyRoomDecor(req.store.id, req.body.decorId)));
router.post('/room/equip', authStore, handle('Equip room decor', req => gameService.equipRoomDecor(req.store.id, req.body.decorId, req.body.equipped)));
router.get('/room/visit/:identifier', authStore, handle('Visit friend room', req => gameService.getFriendRoom(req.params.identifier)));
router.post('/room/cheer', authStore, handle('Cheer friend room', req => gameService.cheerFriendRoom(req.store.id, req.body.toStoreId, req.body.message)));

// Moc Chau Tea Farm & Crafting Workshop Routes
router.get('/farm', authStore, handle('Get farm state', req => gameService.getFarmState(req.store.id)));
router.post('/farm/plant', authStore, handle('Plant crop', req => gameService.plantCrop(req.store.id, req.body.plotId, req.body.cropId)));
router.post('/farm/water', authStore, handle('Water plot', req => gameService.waterPlot(req.store.id, req.body.plotId)));
router.post('/farm/fertilize', authStore, handle('Fertilize plot', req => gameService.fertilizePlot(req.store.id, req.body.plotId, !!req.body.useTeaCoin)));
router.post('/farm/harvest', authStore, handle('Harvest plot', req => gameService.harvestPlot(req.store.id, req.body.plotId)));
router.post('/farm/harvest-all', authStore, handle('Harvest all plots', req => gameService.harvestAll(req.store.id)));
router.post('/farm/craft', authStore, handle('Craft recipe', req => gameService.craftRecipe(req.store.id, req.body.recipeId)));

// Franchise & Rare Ingredient Auction Routes
router.get('/franchise', authStore, handle('Get franchise state', req => gameService.getFranchiseState(req.store.id)));
router.post('/franchise/open', authStore, handle('Open franchise branch', req => gameService.openFranchise(req.store.id, req.body.franchiseId)));
router.post('/franchise/upgrade', authStore, handle('Upgrade franchise branch', req => gameService.upgradeFranchise(req.store.id, req.body.franchiseId)));
router.post('/franchise/collect', authStore, handle('Collect franchise royalties', req => gameService.collectRoyalties(req.store.id)));
router.post('/auction/bid', authStore, handle('Bid rare auction', req => gameService.bidAuction(req.store.id, req.body.itemId, req.body.bidAmount)));

// Weather System
router.get('/weather', authStore, handle('Get weather', req => gameService.getCurrentWeather(req.store.id)));
router.post('/weather/change', authStore, async (req, res) => {
  try {
    const { weatherId } = req.body;
    if (!weatherId) return res.status(400).json({ error: 'Thiếu weatherId' });
    const result = await gameService.setWeatherForStore(req.store.id, weatherId);
    liveSync.pushToStore(req.store.id, 'weather_changed', {
      weather: result.weather,
      message: result.message
    });
    res.json(result);
  } catch (err) {
    console.error('Change weather error:', err);
    res.status(500).json({ error: err.message });
  }
});

// Real-time Event Stream & Polling Heartbeat
router.get('/live-stream', authStore, (req, res) => {
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  res.setHeader('X-Accel-Buffering', 'no');
  liveSync.registerSSE(req.store.id, res);
});

router.post('/heartbeat', authStore, (req, res) => {
  const since = Number(req.body.since || 0);
  const events = liveSync.pullEvents(req.store.id, since);
  res.json({ success: true, timestamp: Date.now(), events });
});

module.exports = router;
