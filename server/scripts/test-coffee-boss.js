const assert = require('assert');
const path = require('path');
const db = require('../models/db');
const coffeeBossService = require('../services/game/coffee-boss.service');

async function runTests() {
  console.log('--- STARTING COFFEE LOUNGE & WORLD BOSS TESTS ---');

  // 1. Initialize DB
  await db.init();
  console.log('✓ 1. Database initialized successfully');

  // Create a test store
  const testStoreCode = 'TEST_COFFEE_' + Date.now();
  let store = await db.get('SELECT * FROM stores WHERE store_code = ?', testStoreCode);
  if (!store) {
    await db.run(
      'INSERT INTO stores (username, store_code, store_name, created_at) VALUES (?, ?, ?, ?)',
      'test_barista_' + Date.now(), testStoreCode, 'Tiệm HeeHee Test', new Date().toISOString()
    );
    store = await db.get('SELECT * FROM stores WHERE store_code = ?', testStoreCode);
    await db.run(
      `INSERT INTO game_saves (store_id, money, teacoin, boss_pearl_inventory, boss_food_buffs, boss_titles) 
       VALUES (?, 500000, 20, '{"pearl_basic":20,"pearl_flame":10,"pearl_golden":5,"pearl_frost":5,"pearl_cosmic":2}', '{}', '[]')`,
      store.id
    );
  }
  const storeId = store.id;
  console.log(`✓ 2. Test store created (ID: ${storeId})`);

  // 2. Test Menus
  const menus = coffeeBossService.getMenu();
  assert.strictEqual(menus.coffeeMenu.length, 6, 'Should have 6 craft coffees');
  assert.strictEqual(menus.foodMenu.length, 5, 'Should have 5 combat foods');
  assert.strictEqual(menus.ammoMenu.length, 5, 'Should have 5 pearl ammunitions');
  console.log('✓ 3. Verified Coffee (6), Food (5), Ammo (5) menus');

  // 3. Test Drink Coffee
  const drinkResult = await coffeeBossService.drinkCoffee(storeId, 'cafe_phin');
  assert.strictEqual(drinkResult.success, true);
  assert.strictEqual(drinkResult.dailyCups, 1);
  assert(drinkResult.buff && drinkResult.buff.name, 'Should grant a random buff');
  console.log(`✓ 4. Drink Coffee tested: ${drinkResult.message}`);

  // Test daily limit: drink 2 more cups, then 4th cup must fail
  await coffeeBossService.drinkCoffee(storeId, 'bac_xiu');
  await coffeeBossService.drinkCoffee(storeId, 'cafe_muoi');
  let failedAsExpected = false;
  try {
    await coffeeBossService.drinkCoffee(storeId, 'cold_brew');
  } catch (e) {
    failedAsExpected = true;
  }
  assert.strictEqual(failedAsExpected, true, 'Drinking 4th cup in day must throw daily limit error');
  console.log('✓ 5. Daily limit (max 3 cups) verified');

  // 4. Test Buy Pearl Ammo
  const buyAmmoRes = await coffeeBossService.buyAmmo(storeId, 'pearl_flame', 2);
  assert.strictEqual(buyAmmoRes.success, true);
  assert.strictEqual(buyAmmoRes.added, 20, '2 packs of flame pearls = 20 pearls');
  console.log(`✓ 6. Ammo purchase verified: ${buyAmmoRes.message}`);

  // 5. Test Buy Combat Food
  const buyFoodRes = await coffeeBossService.buyFoodBuff(storeId, 'banh_mi_pate');
  assert.strictEqual(buyFoodRes.success, true);
  assert(buyFoodRes.foodBuff && buyFoodRes.foodBuff.atkBonus === 0.25, 'Bánh mì pate grants +25% ATK');
  console.log(`✓ 7. Food purchase verified: ${buyFoodRes.message}`);

  // 6. Test World Boss Battle Engine
  const bossManager = coffeeBossService.getBossManager();
  const event = await bossManager.startBossEvent(60); // 60s test event
  assert.strictEqual(event.isActive, true);
  assert.strictEqual(event.bossType, 'hung_ram_monster');
  assert(event.maxHp >= 1000000, 'Max HP should be scaled appropriately');
  console.log(`✓ 8. Boss Event started: HP = ${event.maxHp.toLocaleString()}, Phase = ${event.phase}`);

  // 7. Test Player Attacks on Boss
  const atk1 = await bossManager.processAttack(storeId, 'Tiệm HeeHee Test', 'pearl_basic');
  assert(atk1.damage > 0, 'Should deal valid damage');
  assert(atk1.currentHp < event.maxHp, 'Boss HP should decrease');
  console.log(`✓ 9. Pearl attack processed: ${atk1.damage} DMG dealt, Boss HP: ${atk1.currentHp.toLocaleString()} (${atk1.hpPercent}%)`);

  // Test Cosmic pearl
  const atkCosmic = await bossManager.processAttack(storeId, 'Tiệm HeeHee Test', 'pearl_cosmic');
  assert(atkCosmic.isCosmic, 'Should have cosmic flag');
  assert(atkCosmic.damage >= 1500, 'Cosmic pearl should deal high damage');
  console.log(`✓ 10. Cosmic Pearl attack processed: ${atkCosmic.damage} DMG (xuyên giáp & lá chắn)`);

  // 8. Test Leaderboard
  const topList = bossManager.getTopLeaderboard(5);
  assert(topList.length >= 1, 'Leaderboard should contain participants');
  assert.strictEqual(topList[0].storeId, storeId);
  console.log(`✓ 11. Live Leaderboard verified: Top 1 = ${topList[0].playerName} with ${topList[0].totalDamage} DMG`);

  // 9. Test Boss Defeat & Rewards Distribution
  await bossManager.endBossEvent(true);
  const updatedSave = await db.get('SELECT money, teacoin, boss_titles, cart_skin FROM game_saves WHERE store_id = ?', storeId);
  const titles = JSON.parse(updatedSave.boss_titles || '[]');
  assert(titles.includes('Chiến Thần Đập Răm 👑'), 'MVP should receive title "Chiến Thần Đập Răm 👑"');
  assert(Number(updatedSave.teacoin) >= 50, 'MVP should receive 50 TeaCoins');
  assert.strictEqual(updatedSave.cart_skin, 'cosmic_coffee_cart', 'MVP should receive cart_skin cosmic_coffee_cart');
  console.log(`✓ 12. Boss End & Rewards verified: MVP Titles = [${titles.join(', ')}], Cart Skin = ${updatedSave.cart_skin}, TeaCoin Balance = ${updatedSave.teacoin}`);

  // 10. Verify DB records
  const dbEvent = await db.get('SELECT * FROM boss_events WHERE id = ?', event.id);
  assert(dbEvent, 'Event should be recorded in boss_events');
  const dbLogs = await db.get('SELECT * FROM boss_damage_logs WHERE event_id = ? AND store_id = ?', event.id, storeId);
  assert(dbLogs, 'Damage logs should be recorded in boss_damage_logs');
  console.log(`✓ 13. Database records verified in boss_events & boss_damage_logs`);

  // 11. Test Bé Trà Ammo Supply (+10 basic pearls)
  const supplyRes = await coffeeBossService.claimBeTraSupply(storeId);
  assert(supplyRes.success, 'Bé Trà supply should succeed');
  assert(supplyRes.pearlInventory.pearl_basic >= 10, 'Should receive 10 basic pearls');
  console.log(`✓ 14. Bé Trà Ammo Supply verified: +10 Đạn Trân Châu Đen (Total = ${supplyRes.pearlInventory.pearl_basic})`);

  console.log('\n======================================================');
  console.log(' ALL COFFEE LOUNGE & WORLD BOSS TESTS PASSED (14/14)! ');
  console.log('======================================================\n');
}

runTests().then(() => {
  process.exit(0);
}).catch(err => {
  console.error('TEST FAILED:', err);
  process.exit(1);
});

