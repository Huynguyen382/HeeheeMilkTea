const express = require('express');
const { authStore } = require('../middleware/auth.middleware');
const coffeeBossService = require('../services/game/coffee-boss.service');

const router = express.Router();

// Get menus (coffees, foods, ammo)
router.get('/menu', (req, res) => {
  res.json(coffeeBossService.getMenu());
});

// Get store coffee & boss state
router.get('/state', authStore, async (req, res) => {
  try {
    const data = await coffeeBossService.getStoreCoffeeState(req.store.id);
    res.json({ success: true, ...data });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Drink Coffee
router.post('/drink', authStore, async (req, res) => {
  try {
    const { coffeeId } = req.body;
    if (!coffeeId) return res.status(400).json({ error: 'Thiếu coffeeId' });
    const result = await coffeeBossService.drinkCoffee(req.store.id, coffeeId);
    res.json(result);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// Buy Pearl Ammunition
router.post('/buy-ammo', authStore, async (req, res) => {
  try {
    const { pearlType, packs } = req.body;
    if (!pearlType) return res.status(400).json({ error: 'Thiếu pearlType' });
    const result = await coffeeBossService.buyAmmo(req.store.id, pearlType, packs);
    res.json(result);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// Buy Combat Food
router.post('/buy-food', authStore, async (req, res) => {
  try {
    const { foodId } = req.body;
    if (!foodId) return res.status(400).json({ error: 'Thiếu foodId' });
    const result = await coffeeBossService.buyFoodBuff(req.store.id, foodId);
    res.json(result);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// REST endpoint for shooting boss (REST fallback)
router.post('/boss/shoot', authStore, async (req, res) => {
  try {
    const { pearlType } = req.body;
    const bossManager = coffeeBossService.getBossManager();
    const result = await bossManager.processAttack(req.store.id, req.store.store_name, pearlType || 'pearl_basic');
    res.json(result);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// Bé Trà Ammo Supply (+10 basic pearls)
router.post('/boss/supply', authStore, async (req, res) => {
  try {
    const result = await coffeeBossService.claimBeTraSupply(req.store.id);
    res.json(result);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// Admin / Test Trigger Boss
router.post('/boss/trigger', authStore, async (req, res) => {
  try {
    const duration = Number(req.body.durationSec || 900);
    const bossManager = coffeeBossService.getBossManager();
    const event = await bossManager.startBossEvent(duration);
    res.json({ success: true, event: bossManager.getPublicState() });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

module.exports = router;

