const crypto = require('crypto');
const db = require('../../models/db');
const anticheat = require('../anticheat.service');
const { invalidateStoreCache } = require('./cache.helper');
const { LOCATIONS } = require('../../data/locations');
const NEGOTIATION = require('../../data/negotiation');
const {
  RECIPES,
  CUSTOMERS,
  TEA_BASES,
  CORE_RECIPES,
  SHIPPER_SNACKS,
  generateCustomerToppings
} = require('./constants');

// Generate new random customer order wave (1 - 4 customers, or up to 14 in Chapter 2)
async function generateOrder(storeId, options = {}) {
  const save = await db.prepare('SELECT * FROM game_saves WHERE store_id = ?').get(storeId);
  if (!save || save.is_jailed === 1) return null;

  const now = Date.now();

  // 1. Check rest condition (Nghỉ ngơi kết ca 2 phút hoặc Đau bụng ăn vặt 15 phút)
  if (save.rest_until_ts) {
    if (now < save.rest_until_ts) {
      const remainingSec = Math.ceil((save.rest_until_ts - now) / 1000);
      const activeBuffs = JSON.parse(save.active_buffs || '{}');
      const isEndShift = activeBuffs.rest_reason === 'end_shift';
      return {
        resting: true,
        restUntil: save.rest_until_ts,
        remainingSeconds: remainingSec,
        restReason: isEndShift ? 'end_shift' : 'snack_sick',
        message: isEndShift
          ? `Quán đang nghỉ ngơi sau một ngày làm việc mệt mỏi (${Math.floor(remainingSec / 60)} phút ${remainingSec % 60} giây còn lại).`
          : `HeeHee đang bị đau bụng do ăn vặt vỉa hè! Quán tạm nghỉ ngơi (${Math.floor(remainingSec / 60)} phút ${remainingSec % 60} giây còn lại).`
      };
    } else {
      // Rest period has expired, clean up
      const activeBuffs = JSON.parse(save.active_buffs || '{}');
      delete activeBuffs.rest_reason;
      delete activeBuffs.rest_until;
      await db.prepare('UPDATE game_saves SET rest_until_ts = 0, active_buffs = ? WHERE store_id = ?')
        .run(JSON.stringify(activeBuffs), storeId);
      save.rest_until_ts = 0;
    }
  }

  const daily = await anticheat.getOrCreateDailyStats(storeId, save.chapter);
  const activeBuffs = JSON.parse(save.active_buffs || '{}');

  // Check Proactive TikToker Invitation
  let isInvitedTiktoker = false;
  if (activeBuffs.tiktoker_invited) {
    isInvitedTiktoker = true;
    delete activeBuffs.tiktoker_invited;
    await db.prepare('UPDATE game_saves SET active_buffs = ? WHERE store_id = ?')
      .run(JSON.stringify(activeBuffs), storeId);
  }

  // Requirement: Đánh giá tiệm dưới 3* sẽ giảm tỉ lệ khách ghé quán (50% cơ hội khách e ngại không ghé)
  if (save.reputation < 3.0 && Math.random() < 0.50 && !isInvitedTiktoker && activeBuffs.tiktoker_status !== 'viral') {
    return {
      isLowReputation: true,
      reputation: save.reputation,
      message: `⚠️ Đánh giá tiệm chỉ còn ${save.reputation.toFixed(1)}⭐ (< 3⭐)! Khách hàng e ngại chất lượng nên thưa thớt. Hãy chủ động mời TikToker review để kéo lại sao!`
    };
  }

  let unlocked = [];
  try {
    unlocked = JSON.parse(save.recipes || '[]');
  } catch (e) {
    unlocked = [];
  }
  const combinedRecipes = Array.from(new Set([...CORE_RECIPES, ...unlocked]));
  const validKeys = combinedRecipes.filter(k => !!RECIPES[k]);

  // 2. Wave size calculation: up to 14 customers queueing in Chapter 2
  let waveSize = 1;
  const randWave = Math.random();

  if (save.chapter >= 2) {
    // Chapter 2: Trước cổng Bách Khoa - giờ tan trường sinh viên xếp hàng đông đúc
    if (activeBuffs.tiktoker_status === 'viral') {
      const isBigCampaign = (activeBuffs.tiktoker_cost || 0) >= 1000000;
      if (isBigCampaign) {
        waveSize = Math.floor(Math.random() * 6) + 9; // 9 - 14 khách
      } else {
        waveSize = Math.floor(Math.random() * 5) + 6; // 6 - 10 khách
      }
    } else if (activeBuffs.tiktoker_status === 'flop') {
      waveSize = randWave < 0.6 ? 2 : 3;
    } else if (save.reputation < 3.0) {
      waveSize = randWave < 0.7 ? 1 : 2;
    } else {
      // Giờ cao điểm tan học sinh viên Bách Khoa: 4 đến 14 khách
      if (randWave < 0.35) waveSize = Math.floor(Math.random() * 4) + 4; // 4 - 7 khách
      else if (randWave < 0.75) waveSize = Math.floor(Math.random() * 4) + 7; // 7 - 10 khách
      else waveSize = Math.floor(Math.random() * 5) + 10; // 10 - 14 khách (đông nghẹt trước cổng trường)
    }
  } else {
    // Chapter 1: Xe đẩy quê 1 - 4 khách
    if (activeBuffs.tiktoker_status === 'viral') {
      const isBigCampaign = (activeBuffs.tiktoker_cost || 0) >= 1000000;
      if (isBigCampaign) {
        if (randWave < 0.60) waveSize = 4;
        else if (randWave < 0.90) waveSize = 3;
        else waveSize = 2;
      } else {
        if (randWave < 0.35) waveSize = 4;
        else if (randWave < 0.70) waveSize = 3;
        else waveSize = 2;
      }
    } else if (activeBuffs.tiktoker_status === 'flop') {
      waveSize = randWave < 0.8 ? 1 : 2;
    } else if (save.reputation < 3.0) {
      waveSize = 1;
    } else {
      if (randWave < 0.35) waveSize = 1;
      else if (randWave < 0.70) waveSize = 2;
      else if (randWave < 0.90) waveSize = 3;
      else waveSize = 4;
    }
  }
  if (options.isShipper) {
    // Shipper randomly orders multiple drinks, up to 12 orders
    // Weighted distribution: 1-2 drinks (30%), 3-5 drinks (35%), 6-9 drinks (25%), 10-12 drinks (10%)
    const randShipperWave = Math.random();
    if (randShipperWave < 0.30) {
      waveSize = Math.floor(Math.random() * 2) + 1; // 1 - 2 đơn
    } else if (randShipperWave < 0.65) {
      waveSize = Math.floor(Math.random() * 3) + 3; // 3 - 5 đơn
    } else if (randShipperWave < 0.90) {
      waveSize = Math.floor(Math.random() * 4) + 6; // 6 - 9 đơn
    } else {
      waveSize = Math.floor(Math.random() * 3) + 10; // 10 - 12 đơn
    }
  }
  waveSize = Math.min(14, Math.max(1, waveSize));

  const sugars = ['0%', '30%', '50%', '70%', '100%'];
  const ices = ['Nóng', 'Ít đá', 'Vừa đá', 'Đầy đá'];

  const orders = [];
  const pendingDbOrders = [];
  let snackEvent = null;

  for (let i = 0; i < waveSize; i++) {
    // Select customer: if invited TikToker, ensure first customer is Tú (TikToker)
    let cust = CUSTOMERS[Math.floor(Math.random() * CUSTOMERS.length)];
    if (options.isShipper) {
      cust = CUSTOMERS.find(c => c.isShipper) || {
        type: 23,
        id: 24,
        name: 'Huy Shipper Bất Bại',
        patience: 28000,
        fav: ['hong_tra_tac', 'tra_dao_cam_sa'],
        tipMult: 1.25,
        isShipper: true,
        dialogues: [
          'Chị ơi đơn app #9928 hỏa tốc nè, khách đang ngóng lắm, làm nhanh em đi giao nha! 🛵',
          'Trời nắng chang chang, làm ly giao liền giúp em nha quán ơi! 💨',
          'Đơn app này khách dặn kĩ lắm, em chờ quán pha xong em đi ship ngay! 📦'
        ]
      };
    } else if (isInvitedTiktoker && i === 0) {
      cust = CUSTOMERS.find(c => c.isTiktoker) || CUSTOMERS[3];
    }

    // 1. Cân bằng tỷ lệ các loại cốt trà của cửa hàng (Mỗi loại cốt trà ~20% cơ hội)
    const targetTea = TEA_BASES[Math.floor(Math.random() * TEA_BASES.length)];
    const teaRecipes = validKeys.filter(k => RECIPES[k] && RECIPES[k].tea === targetTea);
    const custFavsForTea = (cust.fav || []).filter(k => teaRecipes.includes(k));

    let selectedKey;
    if (custFavsForTea.length > 0 && Math.random() < 0.70) {
      // Ưu tiên chọn món yêu thích của NPC thuộc dòng trà này
      selectedKey = custFavsForTea[Math.floor(Math.random() * custFavsForTea.length)];
    } else if (teaRecipes.length > 0) {
      // Chọn ngẫu nhiên công thức có cốt trà được cân bằng
      selectedKey = teaRecipes[Math.floor(Math.random() * teaRecipes.length)];
    } else {
      selectedKey = validKeys[Math.floor(Math.random() * validKeys.length)];
    }
    const recipe = RECIPES[selectedKey] || RECIPES['tra_sua_truyen_thong'];

    // 2. NPC chọn nhiều loại topping (0 đến 3 topping kết hợp phong phú)
    const orderToppings = generateCustomerToppings(cust, recipe);
    
    let quote = cust.dialogues[Math.floor(Math.random() * cust.dialogues.length)];
    if (options.isShipper) {
      const isStorm = activeBuffs.weather && activeBuffs.weather.id === 'stormy';
      const isRain = activeBuffs.weather && activeBuffs.weather.id === 'rainy';
      const orderTag = waveSize > 1 ? ` [Ly ${i + 1}/${waveSize}]` : '';
      const shipperQuotes = isStorm ? [
        `⚡ Trời mưa to sấm sét giật ầm ầm! Khách trùm chăn đặt ship hỏa tốc nổ máy app luôn nè chị! 🛵⛈️${orderTag}`,
        `⛈️ Giông bão sấm chớp giật dữ quá, khách boa tip thêm tiền ship đó quán! Làm nhanh em phóng đi giao nha! 💨${orderTag}`,
        `🛵 Đơn ship giông bão hỏa tốc #8899 nè chị! Đội mưa đi ship nhưng có tiền tip cao là vui rồi! ⚡${orderTag}`
      ] : (isRain ? [
        `🌧️ Trời mưa rào khách lười ra đường nên app nổ đơn liên tục nè quán ơi! 🛵${orderTag}`,
        `📦 Đơn ship ngày mưa mát mẻ, cho em nhận ${waveSize > 1 ? waveSize + ' ly' : 'ly'} giao liền nha chị! 💨${orderTag}`
      ] : [
        `Chị ơi đơn app ${waveSize > 1 ? '(' + waveSize + ' ly)' : '#9928'} hỏa tốc nè, khách đang ngóng lắm, làm nhanh em đi giao nha! 🛵${orderTag}`,
        `Trời nắng chang chang, làm ${waveSize > 1 ? waveSize + ' ly' : 'ly'} giao liền giúp em nha quán ơi! 💨${orderTag}`,
        `Đơn app này khách dặn kĩ lắm, em chờ quán pha đủ ${waveSize > 1 ? waveSize + ' ly' : ''} em đi ship ngay! 📦${orderTag}`,
        `Chào quán! Cho em nhận đơn giao hàng hỏa tốc ${waveSize > 1 ? waveSize + ' ly ' : ''}này nha, khách công ty giục quá trời! 🧋${orderTag}`
      ]);
      quote = shipperQuotes[Math.floor(Math.random() * shipperQuotes.length)];
    } else if (isInvitedTiktoker && i === 0) {
      quote = 'Hello HeeHee! Nhận lời mời của quán, hôm nay Tú vác máy quay qua làm clip review thực tế xem có đỉnh nóc kịch trần không nha! Ngon là Tú kéo bão sao cho quán liền!';
    }

    let sugar = sugars[Math.floor(Math.random() * sugars.length)];
    if (cust.type === 6 && Math.random() < 0.8) sugar = '0%'; // Gymer prefers 0% sugar

    let ice = ices[Math.floor(Math.random() * ices.length)];
    if (cust.type === 5 && Math.random() < 0.7) ice = 'Ít đá'; // Elder prefers warm/low ice

    const orderId = 'ORD-' + crypto.randomBytes(4).toString('hex');
    
    // Patience with active buff & Capybara pet
    // Base patience is extended x2.5 + 25s so players have ample time to brew without stress
    let patienceMs = Math.floor(cust.patience * 2.5 + 25000);
    if (activeBuffs.patience_boost && activeBuffs.patience_boost > 0) {
      patienceMs = Math.floor(patienceMs * 1.5); // +50% patience
    }
    const upgrades = JSON.parse(save.upgrades || '{}');
    if (upgrades.active_pet === 'capybara' && !upgrades.is_pet_stolen) {
      patienceMs = Math.floor(patienceMs * 1.5); // Capybara +50% patience
    }
    // The client only starts a customer's countdown when it reaches the front of the queue,
    // so the server deadline must include all waiting time of earlier customers in the wave.
    const expiresAt = now + patienceMs + 60000 + (i * (patienceMs + 15000));

    // Custom price & Market price check
    const customPrices = JSON.parse(save.custom_prices || '{}');
    const marketBasePrice = recipe.basePrice;
    const customRecipePrice = (customPrices[recipe.id] && Number(customPrices[recipe.id]) > 0)
      ? Number(customPrices[recipe.id])
      : marketBasePrice;

    // Price with multi-toppings, tip buff & Pet buffs
    let price = customRecipePrice;
    const baseToppingCount = (recipe.toppings && recipe.toppings.length > 0) ? recipe.toppings.length : 0;
    const toppingDiff = orderToppings.length - baseToppingCount;
    if (toppingDiff > 0) {
      price += toppingDiff * 7000; // Thêm topping: +7.000đ mỗi loại
    } else if (toppingDiff < 0) {
      price = Math.max(25000, price + toppingDiff * 6000); // Bớt topping: giảm 6.000đ mỗi loại, không dưới 25.000đ
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
    const properties = JSON.parse(save.properties || '{}');
    const currentLocationId = properties.current_location || 'que';
    const locationConfig = LOCATIONS[currentLocationId];
    if (locationConfig && locationConfig.priceMultiplier !== 1) {
      price = Math.floor(price * locationConfig.priceMultiplier);
    }

    // Luôn đảm bảo giá trà sữa tối thiểu 25.000đ
    price = Math.max(25000, price);

    // Đàm phán & Mặc cả: Khi đặt giá quá cao các NPC có thể mặc cả
    let negotiation = null;
    const priceRatio = customRecipePrice / marketBasePrice;
    let haggleChance = 0;

    if (priceRatio > 1.0) {
      // Đặt giá cao hơn thị trường: NPC có nguy cơ mặc cả tỷ lệ thuận với mức giá chênh lệch
      if (priceRatio <= 1.2) {
        haggleChance = 0.35; // Cao hơn 1-20%: 35% cơ hội khách mặc cả
      } else if (priceRatio <= 1.5) {
        haggleChance = 0.65; // Cao hơn 21-50%: 65% cơ hội khách mặc cả
      } else {
        haggleChance = 0.90; // Cao hơn >50%: 90% khách sẽ mặc cả!
      }
    } else {
      // Giá bằng hoặc thấp hơn giá thị trường: chỉ có một ít khách có tính kì kèo mặc cả nhẹ
      const customerBonus = locationConfig?.customerBonus || 0;
      haggleChance = Math.min(0.20, NEGOTIATION.haggleChance * 0.3 + customerBonus * 0.1);
    }

    if (Math.random() < haggleChance) {
      let requestedPrice;
      let line;
      if (priceRatio > 1.0) {
        // NPC bức xúc/kì kèo vì giá quá cao
        const targetRef = Math.floor(marketBasePrice * (1.0 + Math.random() * 0.15)) + (toppingDiff > 0 ? toppingDiff * 7000 : 0);
        requestedPrice = Math.max(25000, Math.min(price - 1000, Math.max(marketBasePrice, targetRef)));
        const discountAmount = price - requestedPrice;

        const highPriceHaggleLines = [
          `Quán ơi, giá ${price.toLocaleString('vi-VN')}đ này hơi chát quá! Bớt cho mình còn ${requestedPrice.toLocaleString('vi-VN')}đ được không?`,
          `Ủa giá ${price.toLocaleString('vi-VN')}đ cao hơn thị trường nè! Bớt ${discountAmount.toLocaleString('vi-VN')}đ lấy ${requestedPrice.toLocaleString('vi-VN')}đ nha?`,
          `Hôm nay xẹp ví quá mà thèm trà sữa, lấy mình ${requestedPrice.toLocaleString('vi-VN')}đ được hông quán ơi?`,
          `Trà sữa ở đây bán đắt thế! Giảm còn ${requestedPrice.toLocaleString('vi-VN')}đ thì mình mới lấy nha!`,
          `Cho mình xin bớt ${discountAmount.toLocaleString('vi-VN')}đ còn ${requestedPrice.toLocaleString('vi-VN')}đ nhé chủ quán ơi!`
        ];
        line = highPriceHaggleLines[Math.floor(Math.random() * highPriceHaggleLines.length)];

        negotiation = {
          isHighPriceHaggle: true,
          originalPrice: price,
          requestedPrice,
          discountAmount,
          line,
          status: 'pending'
        };
      } else {
        // Mặc cả thông thường
        const discountRatio = 0.08 + Math.random() * 0.12;
        const discountAmount = Math.floor(price * discountRatio);
        requestedPrice = Math.max(25000, price - discountAmount);
        line = NEGOTIATION.haggleLines[Math.floor(Math.random() * NEGOTIATION.haggleLines.length)]
          .replace('{discount}', discountAmount.toLocaleString('vi-VN'));

        negotiation = {
          isHighPriceHaggle: false,
          originalPrice: price,
          requestedPrice,
          discountAmount,
          line,
          status: 'pending'
        };
      }
    }

    // Shipper snack offer (40% chance if Shipper is in the wave)
    if (cust.isShipper && !snackEvent && Math.random() < 0.45) {
      const snack = SHIPPER_SNACKS[Math.floor(Math.random() * SHIPPER_SNACKS.length)];
      snackEvent = {
        snackId: snack.id,
        snackName: snack.name,
        snackIcon: snack.icon,
        snackDesc: snack.desc,
        shipperName: cust.name,
        offerQuote: `Nè HeeHee ơi! Anh vừa mua được phần ${snack.name} thơm nức mũi, em ăn cùng anh một miếng lấy sức pha chế hông?`
      };
    }

    pendingDbOrders.push([
      orderId,
      storeId,
      recipe.id,
      cust.name,
      sugar,
      ice,
      JSON.stringify(orderToppings),
      price,
      price,
      JSON.stringify(negotiation || null),
      now,
      expiresAt
    ]);

    orders.push({
      orderId,
      customerType: cust.type,
      customerName: cust.name,
      quote,
      isTiktoker: !!cust.isTiktoker,
      isShipper: !!cust.isShipper,
      recipeId: recipe.id,
      recipeName: recipe.name,
      tea: recipe.tea,
      recipeDesc: recipe.desc,
      sugar,
      ice,
      toppings: orderToppings,
      price,
      originalPrice: price,
      negotiation,
      patienceMs,
      expiresAt,
      isOverloaded: daily.is_overloaded
    });
  }

  // Batch insert all orders in this wave in a single query (conserves Neon compute & prevents pool exhaustion)
  if (pendingDbOrders.length > 0) {
    const placeholders = pendingDbOrders.map(() => '(?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)').join(', ');
    const params = pendingDbOrders.flat();
    await db.prepare(`
      INSERT INTO active_orders (id, store_id, recipe_id, customer_name, sugar, ice, toppings, price, original_price, negotiation, created_at, expires_at)
      VALUES ${placeholders}
    `).run(...params);
  }

  // Decrement TikToker flop waves count (viral status ends only when target revenue 3x capital is earned)
  if (activeBuffs.tiktoker_status === 'flop') {
    activeBuffs.tiktoker_waves = (activeBuffs.tiktoker_waves || 1) - 1;
    if (activeBuffs.tiktoker_waves <= 0) {
      delete activeBuffs.tiktoker_status;
      delete activeBuffs.tiktoker_waves;
    }
    await db.prepare('UPDATE game_saves SET active_buffs = ? WHERE store_id = ?')
      .run(JSON.stringify(activeBuffs), storeId);
  }

  return {
    resting: false,
    waveSize: orders.length,
    orders,
    snackEvent,
    tiktokerStatus: activeBuffs.tiktoker_status || null,
    activeBuffs
  };
}

// Player's response to Shipper snack offer
async function handleSnackDecision(storeId, accept) {
  const save = await db.prepare('SELECT * FROM game_saves WHERE store_id = ?').get(storeId);
  if (!save) return { success: false, message: 'Cửa hàng không tồn tại' };

  if (!accept) {
    return {
      success: true,
      accepted: false,
      message: 'HeeHee mỉm cười từ chối: "Dạ em cảm ơn anh nhiều, nhưng em đang tập trung bán hàng ạ!". Anh Shipper gật gù rồi ăn một mình.'
    };
  }

  const activeBuffs = JSON.parse(save.active_buffs || '{}');
  const now = Date.now();

  // 75% good buff, 25% bad buff (Đau bụng 15 phút thực)
  const isGood = Math.random() < 0.75;

  if (isGood) {
    const isPatience = Math.random() < 0.5;
    if (isPatience) {
      activeBuffs.patience_boost = 6;
      await db.prepare('UPDATE game_saves SET active_buffs = ? WHERE store_id = ?')
        .run(JSON.stringify(activeBuffs), storeId);
      invalidateStoreCache(storeId);
      return {
        success: true,
        accepted: true,
        outcome: 'good',
        buffType: 'patience_boost',
        message: '😋 Món ăn vặt thơm ngon giòn rụm! Tinh thần HeeHee phấn chấn vui vẻ, khách hàng thấy thương nên kiên nhẫn chờ lâu hơn +40%!'
      };
    } else {
      activeBuffs.tip_bonus = 6;
      await db.prepare('UPDATE game_saves SET active_buffs = ? WHERE store_id = ?')
        .run(JSON.stringify(activeBuffs), storeId);
      invalidateStoreCache(storeId);
      return {
        success: true,
        accepted: true,
        outcome: 'good',
        buffType: 'tip_bonus',
        message: '✨ Ăn vặt tràn đầy năng lượng, pha chế siêu tốc! Khách uống tấm tắc khen ngợi, tip thêm +10% doanh thu mỗi ly!'
      };
    }
  } else {
    // 25% bad effect: Đau bụng -> trừ 150.000đ tiền thuốc và buộc nghỉ 15 phút thực
    const medicineCost = 150000;
    const currentMoney = Number(save.money || 0);
    const newMoney = Math.max(0, currentMoney - medicineCost);
    const actualDeducted = currentMoney - newMoney;

    const restUntil = now + (15 * 60 * 1000);
    activeBuffs.rest_reason = 'snack_sick';
    activeBuffs.rest_until = restUntil;

    const updatedSave = {
      store_id: storeId,
      chapter: save.chapter,
      day_in_game: save.day_in_game,
      money: newMoney,
      debt_remaining: save.debt_remaining,
      reputation: save.reputation
    };
    const hash = anticheat.generateSaveHash(updatedSave);

    await db.prepare(`
      UPDATE game_saves 
      SET money = ?, rest_until_ts = ?, active_buffs = ?, save_hash = ?, updated_at = ? 
      WHERE store_id = ?
    `).run(newMoney, restUntil, JSON.stringify(activeBuffs), hash, new Date().toISOString(), storeId);

    invalidateStoreCache(storeId);

    try {
      await db.prepare('DELETE FROM active_orders WHERE store_id = ?').run(storeId);
    } catch (e) {}

    return {
      success: true,
      accepted: true,
      outcome: 'bad',
      medicineCost: actualDeducted,
      newMoney,
      restUntil,
      restMinutes: 15,
      message: `🤢 Ôi không! Bánh tráng cay xé lưỡi hoặc sốt me có vấn đề khiến bụng HeeHee đau quằn quại! Bạn phải mua thuốc uống (-${actualDeducted.toLocaleString('vi-VN')}đ) và tạm đóng quầy nghỉ ngơi 15 phút thực!`
    };
  }
}

// Record order timeout / failure (penalty to reputation & flop debuff if TikToker fails)
async function recordOrderFailure(storeId, orderId, isTiktoker = false) {
  await db.prepare('DELETE FROM active_orders WHERE id = ? AND store_id = ?').run(orderId, storeId);
  const save = await db.prepare('SELECT * FROM game_saves WHERE store_id = ?').get(storeId);
  if (!save) return { success: true };

  const activeBuffs = JSON.parse(save.active_buffs || '{}');
  let repPenalty = 0.10;
  let message = 'Khách hàng bực mình bỏ đi vì chờ quá lâu! Đánh giá quán giảm -0.1⭐.';

  if (isTiktoker) {
    activeBuffs.tiktoker_status = 'flop';
    activeBuffs.tiktoker_waves = 5;
    repPenalty = 0.35;
    message = '😱 Tú (TikToker) bực mình bỏ đi và đăng clip bóc phốt phục vụ chậm! Đánh giá bị trừ -0.35⭐ và quán bị flop vắng khách!';
  }

  const newRep = Math.max(1.0, Number((save.reputation - repPenalty).toFixed(2)));
  const updatedSave = {
    store_id: storeId,
    chapter: save.chapter,
    day_in_game: save.day_in_game,
    money: save.money,
    debt_remaining: save.debt_remaining,
    reputation: newRep
  };
  const hash = anticheat.generateSaveHash(updatedSave);

  await db.prepare(`
    UPDATE game_saves 
    SET reputation = ?, active_buffs = ?, save_hash = ?, updated_at = ?
    WHERE store_id = ?
  `).run(newRep, JSON.stringify(activeBuffs), hash, new Date().toISOString(), storeId);

  return {
    success: true,
    tiktokerFlop: isTiktoker,
    reputation: newRep,
    message
  };
}

// Proactively invite Tú (TikToker Reviewer) to boost store reputation & attract customer rush
async function inviteTiktoker(storeId) {
  const save = await db.prepare('SELECT * FROM game_saves WHERE store_id = ?').get(storeId);
  if (!save) return { success: false, message: 'Không tìm thấy tiệm trà sữa!' };

  const activeBuffs = JSON.parse(save.active_buffs || '{}');
  if (activeBuffs.tiktoker_invited) {
    return { success: false, message: 'Bạn đã gửi lời mời Tú (TikToker) rồi! Tú đang trên đường đến quán, hãy chuẩn bị đón tiếp nhé!' };
  }
  if (activeBuffs.tiktoker_status === 'viral') {
    return { success: false, message: 'Quán đang trong Cơn Sốt Viral của Tú TikToker! Hãy phục vụ hết đợt khách này trước khi mời tiếp nhé!' };
  }

  // 1. Giới hạn 1 ngày người chơi chỉ có thể mời TikToker 2 lần
  if (!activeBuffs.tiktoker_daily || activeBuffs.tiktoker_daily.day !== save.day_in_game) {
    activeBuffs.tiktoker_daily = {
      day: save.day_in_game,
      count: 0,
      nextCost: 25000
    };
  }

  const daily = activeBuffs.tiktoker_daily;
  if (daily.count >= 2) {
    return { 
      success: false, 
      message: 'Hôm nay bạn đã mời Tú (TikToker) tối đa 2/2 lần! Hãy đợi sang ngày mới (hoặc bấm Kết ca) để tiếp tục mời nhé!' 
    };
  }

  // 2. Xác định chi phí: Lần đầu 25k (ưu đãi cho người mới chơi), lần thứ 2 dao động 2 - 5 triệu
  let cost = 25000;
  if (daily.count === 0) {
    cost = 25000;
  } else {
    cost = daily.nextCost;
    if (!cost || cost < 2000000 || cost > 5000000) {
      cost = 2000000 + Math.floor(Math.random() * 31) * 100000; // 2.000.000đ - 5.000.000đ
    }
  }

  if (save.money < cost) {
    return { 
      success: false, 
      message: `Bạn cần tối thiểu ${cost.toLocaleString('vi-VN')}đ tiền mặt để book lịch mời TikToker (Lần ${daily.count + 1}/2)!` 
    };
  }

  const newMoney = save.money - cost;
  activeBuffs.tiktoker_invited = true;
  activeBuffs.tiktoker_cost = cost;
  activeBuffs.tiktoker_target = cost * 3; // Cam kết kéo khách cho đến khi thu về gấp 3 lần số vốn bỏ ra
  activeBuffs.tiktoker_earned = 0;

  daily.count += 1;
  if (daily.count === 1) {
    // Chi phí lần 2 dao động từ 2 - 5 triệu (bước 100k)
    daily.nextCost = 2000000 + Math.floor(Math.random() * 31) * 100000;
  } else {
    daily.nextCost = null;
  }

  const updatedSave = {
    store_id: storeId,
    chapter: save.chapter,
    day_in_game: save.day_in_game,
    money: newMoney,
    debt_remaining: save.debt_remaining,
    reputation: save.reputation
  };
  const hash = anticheat.generateSaveHash(updatedSave);

  await db.prepare(`
    UPDATE game_saves 
    SET money = ?, active_buffs = ?, save_hash = ?, updated_at = ?
    WHERE store_id = ?
  `).run(newMoney, JSON.stringify(activeBuffs), hash, new Date().toISOString(), storeId);

  return {
    success: true,
    newMoney,
    cost,
    target: cost * 3,
    dailyCount: daily.count,
    nextCost: daily.nextCost,
    activeBuffs,
    message: daily.count === 1
      ? `🎉 Đã book thành công Tú (TikToker) với giá ưu đãi ${cost.toLocaleString('vi-VN')}đ! Tú đang tới, bão khách sẽ kéo đến cho đến khi quán kiếm được ${(cost * 3).toLocaleString('vi-VN')}đ (gấp 3 lần vốn)!`
      : `🚀 Đã book thành công Tú (TikToker) với gói Marketing VIP ${cost.toLocaleString('vi-VN')}đ! Bão khách cực khủng sắp đổ bộ cho đến khi quán kiếm được ${(cost * 3).toLocaleString('vi-VN')}đ (gấp 3 lần vốn)!`
  };
}

// Handle customer negotiation decision
async function negotiateOrder(storeId, orderId, accept = false) {
  const order = await db.prepare('SELECT * FROM active_orders WHERE id = ? AND store_id = ?').get(orderId, storeId);
  if (!order) {
    return { success: false, message: 'Đơn hàng không tồn tại hoặc đã được xử lý!' };
  }

  let negotiation = null;
  try {
    negotiation = typeof order.negotiation === 'string' ? JSON.parse(order.negotiation) : order.negotiation;
  } catch (e) {
    negotiation = null;
  }

  if (!negotiation) {
    return { success: false, message: 'Đơn hàng này không có đề nghị mặc cả!' };
  }

  if (accept) {
    // Player accepts the discount
    const newPrice = Number(negotiation.requestedPrice) || order.price;
    negotiation.status = 'accepted';
    await db.prepare('UPDATE active_orders SET price = ?, negotiation = ? WHERE id = ? AND store_id = ?')
      .run(newPrice, JSON.stringify(negotiation), orderId, storeId);

    const acceptQuotes = [
      'Cảm ơn chủ quán dễ thương nha! Chúc quán buôn may bán đắt! ❤️',
      'Được bớt giá vui quá! Pha thật ngon giùm mình nhé! 🥰',
      'Chủ quán hào sảng ghê, mai mình lại ghé ủng hộ tiếp! ✨'
    ];
    const quote = acceptQuotes[Math.floor(Math.random() * acceptQuotes.length)];

    return {
      success: true,
      cancelled: false,
      accepted: true,
      newPrice,
      quote
    };
  } else {
    // Player refuses to discount
    // Nếu bạn từ chối, có 70% tỷ lệ NPC hủy đơn!
    const willCancel = Math.random() < 0.70;

    if (willCancel) {
      await db.prepare('DELETE FROM active_orders WHERE id = ? AND store_id = ?').run(orderId, storeId);

      const cancelQuotes = [
        'Đắt thế này ai mà mua, mình qua quán khác đây! 😤',
        'Bán giá trên trời mà không bớt một cắc! Hủy đơn nhé! 💢',
        'Thôi đắt quá mình không mua nữa đâu, đi chỗ khác uống! 🙅‍♂️',
        'Giá chát thật sự, thôi mình hủy đơn về uống nước lọc! 🚶'
      ];
      const quote = cancelQuotes[Math.floor(Math.random() * cancelQuotes.length)];

      return {
        success: true,
        cancelled: true,
        accepted: false,
        quote
      };
    } else {
      // 30% tỷ lệ NPC tiếc nuối nhưng vẫn cắn răng mua ở mức giá cao
      negotiation.status = 'refused_stayed';
      await db.prepare('UPDATE active_orders SET negotiation = ? WHERE id = ? AND store_id = ?')
        .run(JSON.stringify(negotiation), orderId, storeId);

      const stayQuotes = [
        'Hic, không bớt tí nào luôn... Nhưng vì thèm quá nên mình vẫn mua vậy! 🥺',
        'Đắt xót cả ruột! Nhớ pha thật đậm đà full topping bù đắp cho mình nhé! 🧋',
        'Thôi được rồi, chịu chi hôm nay vậy! Pha ngon nhé quán! 😅'
      ];
      const quote = stayQuotes[Math.floor(Math.random() * stayQuotes.length)];

      return {
        success: true,
        cancelled: false,
        accepted: false,
        currentPrice: order.price,
        quote
      };
    }
  }
}

// Set custom prices for milk tea recipes
async function setCustomPrices(storeId, customPrices) {
  if (!customPrices || typeof customPrices !== 'object') {
    throw new Error('Dữ liệu bảng giá không hợp lệ!');
  }

  const save = await db.prepare('SELECT * FROM game_saves WHERE store_id = ?').get(storeId);
  if (!save) throw new Error('Không tìm thấy dữ liệu quán!');

  let currentPrices = {};
  try {
    currentPrices = JSON.parse(save.custom_prices || '{}');
  } catch (e) {
    currentPrices = {};
  }

  for (const [recipeId, price] of Object.entries(customPrices)) {
    if (RECIPES[recipeId]) {
      const numPrice = Math.round(Number(price));
      if (!isNaN(numPrice) && numPrice >= 20000 && numPrice <= 200000) {
        currentPrices[recipeId] = numPrice;
      }
    }
  }

  await db.prepare('UPDATE game_saves SET custom_prices = ?, updated_at = ? WHERE store_id = ?')
    .run(JSON.stringify(currentPrices), new Date().toISOString(), storeId);

  invalidateStoreCache(storeId);

  return {
    success: true,
    customPrices: currentPrices
  };
}

module.exports = {
  generateOrder,
  handleSnackDecision,
  recordOrderFailure,
  inviteTiktoker,
  negotiateOrder,
  setCustomPrices
};
