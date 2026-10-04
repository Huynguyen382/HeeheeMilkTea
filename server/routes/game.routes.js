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
    const { orderId, timeTaken, recipeId, sugar, ice, toppings } = req.body;
    if (!orderId || !timeTaken || !recipeId || !sugar || !ice) return res.status(400).json({ error: 'Thiếu thông tin đơn hàng' });
    res.json(await anticheat.validateAndCompleteOrder(req.store.id, orderId, Number(timeTaken), recipeId, sugar, ice, toppings));
  } catch (err) { console.error('Serve order error:', err); res.status(500).json({ error: err.message }); }
});
router.post('/snack-decision', authStore, handle('Snack decision', req => gameService.handleSnackDecision(req.store.id, !!req.body.accept)));
router.post('/order-fail', authStore, handle('Order fail', req => gameService.recordOrderFailure(req.store.id, req.body.orderId, !!req.body.isTiktoker)));
router.post('/collab', authStore, async (req, res) => {
  if (!req.body.friendCode) return res.status(400).json({ error: 'Vui lòng nhập Mã Quán bạn bè!' });
  try { res.json(await gameService.addCollab(req.store.id, req.body.friendCode)); }
  catch (err) { console.error('Collab error:', err); res.status(500).json({ error: err.message }); }
});
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
router.post('/advance-day', authStore, async (req, res) => {
  try {
    const save = await db.prepare('SELECT * FROM game_saves WHERE store_id = ?').get(req.store.id);
    const nextDay = save.day_in_game + 1;
    const rentCost = save.chapter === 1 ? 20000 : 80000;
    const newMoney = Math.max(0, save.money - rentCost);
    const updatedSave = { store_id: req.store.id, chapter: save.chapter, day_in_game: nextDay, money: newMoney, debt_remaining: save.debt_remaining, reputation: save.reputation };
    const hash = anticheat.generateSaveHash(updatedSave);
    await db.prepare('UPDATE game_saves SET day_in_game = ?, money = ?, save_hash = ?, updated_at = ? WHERE store_id = ?').run(nextDay, newMoney, hash, new Date().toISOString(), req.store.id);
    res.json({ success: true, day_in_game: nextDay, rentCost, newMoney, message: `Bắt đầu Ngày ${nextDay} trong game! Tiền mặt bằng xe đẩy hôm nay: -${rentCost.toLocaleString('vi-VN')}đ.` });
  } catch (err) { console.error('Advance day error:', err); res.status(500).json({ error: err.message }); }
});
module.exports = router;
