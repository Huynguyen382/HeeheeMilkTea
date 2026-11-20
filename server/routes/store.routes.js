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

// Batched state synchronization and delta save endpoint
router.post('/sync', authStore, async (req, res) => {
  try {
    const result = await gameService.syncStoreState(req.store.id, req.body);
    res.json(result);
  } catch (err) {
    console.error('Sync state error:', err);
    res.status(500).json({ error: err.message });
  }
});

router.post('/save', authStore, async (req, res) => {
  try {
    const result = await gameService.syncStoreState(req.store.id, req.body);
    res.json(result);
  } catch (err) {
    console.error('Save state error:', err);
    res.status(500).json({ error: err.message });
  }
});

// Get store state by ID (supports load-test simulations and external state queries)
router.get('/:id/state', async (req, res) => {
  try {
    let storeId = req.params.id;
    if (typeof storeId === 'string' && isNaN(Number(storeId))) {
      const storeProfile = await gameService.getOrCreateStore(storeId, storeId);
      storeId = storeProfile.store_id || storeProfile.id;
    } else {
      storeId = Number(storeId);
    }
    const state = await gameService.getStoreState(storeId);
    if (!state) return res.status(404).json({ error: 'Store not found' });
    res.json(state);
  } catch (err) {
    console.error('Get store by id state error:', err);
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
