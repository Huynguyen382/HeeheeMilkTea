const express = require('express');
const router = express.Router();
const auth = require('../services/auth.service');
const { authStore } = require('../middleware/auth.middleware');
const gameService = require('../services/game.service');

// Register
router.post('/register', async (req, res) => {
  try {
    const { username, password, store_name } = req.body;
    const result = await auth.register(username, password, store_name);
    if (!result.success) return res.status(400).json(result);
    res.json(result);
  } catch (err) {
    console.error('Register error:', err);
    res.status(500).json({ error: err.message });
  }
});

// Login
router.post('/login', async (req, res) => {
  try {
    const { account, password } = req.body;
    const result = await auth.login(account, password);
    if (!result.success) return res.status(400).json(result);
    res.json(result);
  } catch (err) {
    console.error('Login error:', err);
    res.status(500).json({ error: err.message });
  }
});

// Logout
router.post('/logout', authStore, async (req, res) => {
  try {
    const result = await auth.logout(req.store.id);
    res.json(result);
  } catch (err) {
    console.error('Logout error:', err);
    res.status(500).json({ error: err.message });
  }
});

// Me
router.get('/me', authStore, async (req, res) => {
  try {
    const state = await gameService.getStoreState(req.store.id);
    res.json({ success: true, username: req.store.username, state });
  } catch (err) {
    console.error('Auth me error:', err);
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
