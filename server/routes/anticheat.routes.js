const express = require('express');
const router = express.Router();
const anticheat = require('../services/anticheat.service');
const gameService = require('../services/game.service');
const { authStore } = require('../middleware/auth.middleware');

router.post('/test-tamper', authStore, async (req, res) => {
  try {
    await anticheat.jailStore(req.store.id, 'Phát hiện sửa đổi trái phép số dư tài khoản trên client!');
    res.json({ success: true, isJailed: true, message: 'CƠ CHẾ CHỐNG GIAN LẬN ĐÃ KÍCH HOẠT!' });
  } catch (err) { console.error('Test tamper error:', err); res.status(500).json({ error: err.message }); }
});

router.post('/accept-penalty', authStore, async (req, res) => {
  try {
    await anticheat.acceptPenalty(req.store.id);
    const state = await gameService.getStoreState(req.store.id);
    res.json({ success: true, message: 'Đã nộp phạt cho Quản lý thị trường! Xe đẩy đã được gỡ niêm phong, chúc bạn khởi nghiệp chân chính!', state });
  } catch (err) { console.error('Accept penalty error:', err); res.status(500).json({ error: err.message }); }
});
module.exports = router;
