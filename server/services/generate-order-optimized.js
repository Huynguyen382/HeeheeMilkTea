/**
 * Optimized version of generateOrder function with CPU optimizations
 */

const crypto = require('crypto');

// Import game data (would need to be passed or imported)
const CUSTOMERS = require('./game.service').CUSTOMERS || [];
const RECIPES = require('./game.service').RECIPES || {};
const CORE_RECIPES = require('./game.service').CORE_RECIPES || [];
const TEA_BASES = require('./game.service').TEA_BASES || [];
const SHIPPER_SNACKS = require('./game.service').SHIPPER_SNACKS || [];
const LOCATIONS = require('../data/locations').LOCATIONS || {};
const NEGOTIATION = require('../data/negotiation');

// Import optimized utilities
const cpuOptimizer = require('./cpu-optimizer');
const fastRandom = cpuOptimizer.fastRandom;
const jsonOptimizer = cpuOptimizer.jsonOptimizer;
const idGenerator = cpuOptimizer.idGenerator;
const probabilityDistributions = cpuOptimizer.probabilityDistributions;
const orderPool = cpuOptimizer.orderPool;

/**
 * Optimized generateOrder function with CPU improvements
 */
async function generateOrderOptimized(db, storeId) {
  const save = await db.prepare('SELECT * FROM game_saves WHERE store_id = ?').get(storeId);
  if (!save || save.is_jailed === 1) return null;

  const now = Date.now();
  
  // Track JSON parse calls
  cpuOptimizer.performance.jsonParseCalls++;

  // Parse once and reuse
  const activeBuffs = jsonOptimizer.parseWithCache(save.active_buffs || '{}', `buffs_${storeId}`);
  
  // Check rest condition
  if (save.rest_until_ts && now < save.rest_until_ts) {
    const remainingSec = Math.ceil((save.rest_until_ts - now) / 1000);
    const isEndShift = activeBuffs.rest_reason === 'end_shift';
    return {
      resting: true,
      restUntil: save.rest_until_ts,
      remainingSeconds: remainingSec,
      restReason: isEndShift ? 'end_shift' : 'snack_sick',
      message: isEndShift
        ? `Quán đang nghỉ ngơi sau một ngày làm việc mệt mỏi (${Math.floor(remainingSec / 60)} phút ${remainingSec % 60} giây còn lại).`
        : `HeeHee đang bị đau bụng do ăn vặt vỉa hè! Quán tạm nghỉ ngơi (${Math.floor(remainingSec / 60)} phút ${remainingSec % 60} giải còn lại).`
    };
  } else if (save.rest_until_ts) {
    // Rest period has expired, clean up
    if (activeBuffs.rest_reason) delete activeBuffs.rest_reason;
    if (activeBuffs.rest_until) delete activeBuffs.rest_until;
    await db.prepare('UPDATE game_saves SET rest_until_ts = 0, active_buffs = ? WHERE store_id = ?')
      .run(JSON.stringify(activeBuffs), storeId);
    save.rest_until_ts = 0;
  }

  // Check Proactive TikToker Invitation
  let isInvitedTiktoker = false;
  if (activeBuffs.tiktoker_invited) {
    isInvitedTiktoker = true;
    delete activeBuffs.tiktoker_invited;
    await db.prepare('UPDATE game_saves SET active_buffs = ? WHERE store_id = ?')
      .run(JSON.stringify(activeBuffs), storeId);
  }

  // Requirement: Đánh giá tiệm dưới 3* sẽ giảm tỉ lệ khách ghé quán
  if (save.reputation < 3.0 && fastRandom.next() < 0.50 && !isInvitedTiktoker && activeBuffs.tiktoker_status !== 'viral') {
    return {
      isLowReputation: true,
      reputation: save.reputation,
      message: `⚠️ Đánh giá tiệm chỉ còn ${save.reputation.toFixed(1)}⭐ (< 3⭐)! Khách hàng e ngại chất lượng nên thưa thớt. Hãy chủ động mời TikToker review để kéo lại sao!`
    };
  }

  // Parse recipes once
  let unlocked = [];
  try {
    unlocked = jsonOptimizer.parseWithCache(save.recipes || '[]', `recipes_${storeId}`);
  } catch (e) {
    unlocked = [];
  }
  
  const combinedRecipes = Array.from(new Set([...CORE_RECIPES, ...unlocked]));
  const validKeys = combinedRecipes.filter(k => !!RECIPES[k]);

  // Pre-compute tea recipes mapping for faster lookup
  const teaRecipesCache = {};
  for (const tea of TEA_BASES) {
    teaRecipesCache[tea] = validKeys.filter(k => RECIPES[k] && RECIPES[k].tea === tea);
  }

  // 2. Wave size calculation using optimized distribution
  const waveCondition = cpuOptimizer.getWaveCondition(activeBuffs, save.reputation, isInvitedTiktoker);
  const waveSize = probabilityDistributions.getWaveSize(fastRandom, waveCondition);

  const orders = [];
  let snackEvent = null;

  // Pre-parse other JSON fields for reuse
  const upgrades = jsonOptimizer.parseWithCache(save.upgrades || '{}', `upgrades_${storeId}`);
  const properties = jsonOptimizer.parseWithCache(save.properties || '{}', `properties_${storeId}`);

  // Get location config once
  const currentLocationId = properties.current_location || 'que';
  const locationConfig = LOCATIONS[currentLocationId] || {};

  // Pre-calculate customer preferences
  const tiktokerCustomer = CUSTOMERS.find(c => c.isTiktoker) || CUSTOMERS[3];

  for (let i = 0; i < waveSize; i++) {
    // Select customer: if invited TikToker, ensure first customer is Tú (TikToker)
    let cust = CUSTOMERS[fastRandom.int(0, CUSTOMERS.length - 1)];
    if (isInvitedTiktoker && i === 0) {
      cust = tiktokerCustomer;
    }

    // 1. Cân bằng tỷ lệ các loại cốt trà của cửa hàng
    const targetTea = TEA_BASES[fastRandom.int(0, TEA_BASES.length - 1)];
    const teaRecipes = teaRecipesCache[targetTea] || validKeys;
    const custFavsForTea = (cust.fav || []).filter(k => teaRecipes.includes(k));

    let selectedKey;
    if (custFavsForTea.length > 0 && fastRandom.next() < 0.70) {
      // Ưu tiên chọn món yêu thích của NPC thuộc dòng trà này
      selectedKey = custFavsForTea[fastRandom.int(0, custFavsForTea.length - 1)];
    } else if (teaRecipes.length > 0) {
      // Chọn ngẫu nhiên công thức có cốt trà được cân bằng
      selectedKey = teaRecipes[fastRandom.int(0, teaRecipes.length - 1)];
    } else {
      selectedKey = validKeys[fastRandom.int(0, validKeys.length - 1)];
    }
    const recipe = RECIPES[selectedKey] || RECIPES['tra_sua_truyen_thong'];

    // 2. NPC chọn nhiều loại topping
    const orderToppings = require('./game.service').generateCustomerToppings(cust, recipe);
    
    let quote = cust.dialogues[fastRandom.int(0, cust.dialogues.length - 1)];
    if (isInvitedTiktoker && i === 0) {
      quote = 'Hello HeeHee! Nhận lời mời của quán, hôm nay Tú vác máy quay qua làm clip review thực tế xem có đỉnh nóc kịch trần không nha! Ngon là Tú kéo bão sao cho quán liền!';
    }

    let sugar = probabilityDistributions.getRandomSugar(fastRandom);
    if (cust.type === 6 && fastRandom.next() < 0.8) sugar = '0%'; // Gymer prefers 0% sugar

    let ice = probabilityDistributions.getRandomIce(fastRandom);
    if (cust.type === 5 && fastRandom.next() < 0.7) ice = 'Ít đá'; // Elder prefers warm/low ice

    const orderId = idGenerator.next();
    
    // Patience with active buff & Capybara pet
    let patienceMs = cust.patience * 2 + 15000;
    if (activeBuffs.patience_boost && activeBuffs.patience_boost > 0) {
      patienceMs = Math.floor(patienceMs * 1.4); // +40% patience
    }
    if (upgrades.active_pet === 'capybara' && !upgrades.is_pet_stolen) {
      patienceMs = Math.floor(patienceMs * 1.4); // Capybara +40% patience
    }
    
    const expiresAt = now + patienceMs + 10000 + (i * (patienceMs + 5000));

    // Price calculation
    let price = recipe.basePrice;
    const baseToppingCount = (recipe.toppings && recipe.toppings.length > 0) ? 1 : 0;
    const toppingDiff = orderToppings.length - baseToppingCount;
    
    if (toppingDiff > 0) {
      price += toppingDiff * 3000; // Thêm topping: +3.000đ mỗi loại
    } else if (toppingDiff < 0) {
      price = Math.max(10000, price - 2000); // Không lấy topping: giảm 2.000đ
    }

    if (cust.tipMult) price = Math.floor(price * cust.tipMult);
    if (activeBuffs.tip_bonus && activeBuffs.tip_bonus > 0) {
      price = Math.floor(price * 1.1); // +10% money
    }
    if (upgrades.active_pet === 'corgi' && !upgrades.is_pet_stolen) {
      price = Math.floor(price * 1.2); // Corgi +20% tip
    } else if (upgrades.active_pet === 'meo_tam_the' && !upgrades.is_pet_stolen) {
      price = Math.floor(price * 1.15); // Mèo Tam Thể +15% revenue
    }

    // Thuộc tính bất động sản: điều chỉnh giá theo khu vực
    if (locationConfig && locationConfig.priceMultiplier !== 1) {
      price = Math.floor(price * locationConfig.priceMultiplier);
    }

    // Đàm phán: khách chủ động đề nghị giá thấp hơn
    let negotiation = null;
    const customerBonus = locationConfig.customerBonus || 0;
    const hagglerChance = Math.min(0.6, NEGOTIATION.haggleChance + customerBonus * 0.2);
    
    if (fastRandom.next() < hagglerChance) {
      const discountRatio = 0.1 + fastRandom.next() * NEGOTIATION.maxDiscount;
      const discountAmount = Math.floor(price * discountRatio);
      const requestedPrice = Math.max(1000, price - discountAmount);
      const line = NEGOTIATION.haggleLines[fastRandom.int(0, NEGOTIATION.haggleLines.length - 1)]
        .replace('{discount}', discountAmount.toLocaleString('vi-VN'));
      
      negotiation = {
        requestedPrice,
        originalPrice: price,
        discountAmount,
        line,
        offerToppings: orderToppings,
        status: 'pending'
      };
    }

    // Shipper snack offer (40% chance if Shipper is in the wave)
    if (cust.isShipper && !snackEvent && fastRandom.next() < 0.45) {
      const snack = SHIPPER_SNACKS[fastRandom.int(0, SHIPPER_SNACKS.length - 1)];
      snackEvent = {
        snackId: snack.id,
        snackName: snack.name,
        snackIcon: snack.icon,
        snackDesc: snack.desc,
        shipperName: cust.name,
        offerQuote: `Nè HeeHee ơi! Anh vừa mua được phần ${snack.name} thơm nức mũi, em ăn cùng anh một miếng lấy sức pha chế hông?`
      };
    }

    await db.prepare(`
      INSERT INTO active_orders (id, store_id, recipe_id, customer_name, sugar, ice, toppings, price, original_price, negotiation, created_at, expires_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(orderId, storeId, recipe.id, cust.name, sugar, ice, JSON.stringify(orderToppings), price, price, JSON.stringify(negotiation || null), now, expiresAt);

    // Use object pooling for order objects
    const orderObj = orderPool.acquire();
    orderObj.orderId = orderId;
    orderObj.customerType = cust.type;
    orderObj.customerName = cust.name;
    orderObj.quote = quote;
    orderObj.isTiktoker = !!cust.isTiktoker;
    orderObj.isShipper = !!cust.isShipper;
    orderObj.recipeId = recipe.id;
    orderObj.recipeName = recipe.name;
    orderObj.tea = recipe.tea;
    orderObj.recipeDesc = recipe.desc;
    orderObj.sugar = sugar;
    orderObj.ice = ice;
    orderObj.toppings = orderToppings;
    orderObj.price = price;
    orderObj.originalPrice = price;
    orderObj.negotiation = negotiation;
    orderObj.patienceMs = patienceMs;
    orderObj.expiresAt = expiresAt;
    // isOverloaded would need daily stats

    orders.push(orderObj);
  }

  // Decrement TikToker flop waves count
  if (activeBuffs.tiktoker_status === 'flop') {
    activeBuffs.tiktoker_waves = (activeBuffs.tiktoker_waves || 1) - 1;
    if (activeBuffs.tiktoker_waves <= 0) {
      delete activeBuffs.tiktoker_status;
      delete activeBuffs.tiktoker_waves;
    }
    await db.prepare('UPDATE game_saves SET active_buffs = ? WHERE store_id = ?')
      .run(JSON.stringify(activeBuffs), storeId);
  }

  // Clean up - release order objects back to pool
  const result = {
    resting: false,
    waveSize: orders.length,
    orders: orders.map(o => ({...o})), // Create copies for response
    snackEvent,
    tiktokerStatus: activeBuffs.tiktoker_status || null,
    activeBuffs
  };

  // Release order objects back to pool
  orders.forEach(orderPool.release);

  return result;
}

module.exports = {
  generateOrderOptimized,
  cpuOptimizer
};