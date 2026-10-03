const express = require('express');
const router = express.Router();
const gameService = require('../services/game.service');
const { authStore } = require('../middleware/auth.middleware');

// Legacy Quick Play (Anonymous store)
router.post('/login', async (req, res) => {
  const { store_name, store_code } = req.body;
  try {
    const state = await gameService.getOrCreateStore(store_name, store_code);
    res.json(state);
  } catch (err) {
    console.error('Login error:', err);
    res.status(500).json({ error: err.message });
  }
});

// Get latest store state
router.get('/state', authStore, async (req, res) => {
  try {
    const state = await gameService.getStoreState(req.store.id);
    res.json(state);
  } catch (err) {
    console.error('Get state error:', err);
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
