const express = require('express');
const db = require('../models/db');
const gameService = require('../services/game.service');
const anticheat = require('../services/anticheat.service');
const { authStore } = require('../middleware/auth.middleware');

const router = express.Router();
const handle = (label, fn) => async (req, res) => {
  try { res.json(await fn(req)); }
  catch (err) { console.error(`${label} error:`, err); res.status(500).json({ error: err.message }); }
};

router.get('/order', authStore, handle('Generate order', req => gameService.generateOrder(req.store.id).then(order => ({ order }))));
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
router.post('/pay-debt', authStore, async (req, res) => {
  if (!req.body.amount || req.body.amount <= 0) return res.status(400).json({ error: 'Số tiền không hợp lệ' });
  try { res.json(await gameService.payDebt(req.store.id, Number(req.body.amount))); }
  catch (err) { console.error('Pay debt error:', err); res.status(500).json({ error: err.message }); }
});
router.post('/upgrade', authStore, handle('Upgrade', req => gameService.buyUpgrade(req.store.id, req.body.upgradeId)));
router.post('/steal-pet', authStore, handle('Steal pet', req => gameService.stealPet(req.store.id)));
router.post('/redeem-pet', authStore, handle('Redeem pet', req => gameService.redeemPet(req.store.id)));
router.post('/shoo-thief', authStore, handle('Shoo thief', req => gameService.shooThief(req.store.id)));
router.post('/invite-tiktoker', authStore, handle('Invite tiktoker', req => gameService.inviteTiktoker(req.store.id)));
router.post('/buy-ingredients', authStore, handle('Buy ingredients', req => gameService.buyIngredients(req.store.id, req.body.items)));
router.post('/end-shift', authStore, handle('End shift', req => gameService.endShift(req.store.id)));
router.post('/advance-day', authStore, handle('Advance day', req => gameService.endShift(req.store.id)));
module.exports = router;
