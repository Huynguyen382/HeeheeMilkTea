const crypto = require('crypto');
const db = require('../models/db');
const anticheat = require('./anticheat.service');
const { LOCATIONS, DECORATIONS } = require('../data/locations');
const { INGREDIENTS } = require('../data/ingredients');
const NEGOTIATION = require('../data/negotiation');

// Drink Recipes Database
const RECIPES = {
  tra_sua_truyen_thong: {
    id: 'tra_sua_truyen_thong',
    name: 'Trà Sữa Truyền Thống',
    chapter: 1,
    basePrice: 15000,
    cost: 5000,
    tea: 'den',
    toppings: ['tranchau_den'],
    desc: 'Cốt trà đen đậm đà, sữa đặc thơm béo, trân châu dẻo quánh'
  },
  hong_tra_tac: {
    id: 'hong_tra_tac',
    name: 'Hồng Trà Tắc Xí Muội',
    chapter: 1,
    basePrice: 12000,
    cost: 4000,
    tea: 'den',
    toppings: [],
    desc: 'Giải khát thanh mát, vị chua dịu của tắc và xí muội mằn mặn'
  },
  tra_thai_xanh: {
    id: 'tra_thai_xanh',
    name: 'Trà Sữa Thái Xanh',
    chapter: 1,
    basePrice: 18000,
    cost: 6000,
    tea: 'thai_xanh',
    toppings: ['thach_la_dua'],
    desc: 'Màu xanh mát mắt, hương hoa lài thơm mát đặc trưng'
  },
  sua_tuoi_duong_den: {
    id: 'sua_tuoi_duong_den',
    name: 'Sữa Tươi Trân Châu Đường Đen',
    chapter: 2,
    basePrice: 25000,
    cost: 8000,
    tea: 'sua_tuoi',
    toppings: ['tranchau_duongden'],
    desc: 'Đường đen cô đặc sánh mịn quanh thành ly cùng sữa tươi thanh trùng'
  },
  tra_dao_cam_sa: {
    id: 'tra_dao_cam_sa',
    name: 'Trà Đào Cam Sả',
    chapter: 2,
    basePrice: 28000,
    cost: 9000,
    tea: 'lai',
    toppings: ['dao_mieng'],
    desc: 'Sả tươi đập dập, lát cam vàng óng và những miếng đào giòn tan'
  },
  tra_olong_nuong: {
    id: 'tra_olong_nuong',
    name: 'Trà Ô Long Nướng Sương Sáo',
    chapter: 3,
    basePrice: 35000,
    cost: 11000,
    tea: 'olong_nuong',
    toppings: ['suong_sao', 'tranchau_hoangkim'],
    desc: 'Trà sao cháy thơm mùi khói mộc mạc hòa quyện thạch sương sáo mềm mướt'
  }
};

// 10 Customer archetypes with 40 authentic dialogues
const CUSTOMERS = [
  {
    type: 0,
    name: 'Bé Lan (Nữ sinh)',
    patience: 25000,
    fav: ['tra_sua_truyen_thong', 'tra_thai_xanh'],
    tipMult: 1.0,
    dialogues: [
      'Chị HeeHee ơi, cho em ly ít đường ít đá mang vào tiết Toán nha!',
      'Trà sữa quán mình ngon nhất phố, em rủ cả lớp ra ủng hộ nè!',
      'Em vừa thi xong môn Sử mệt quá, cần bổ sung gấp một liều ngọt ngào!',
      'Trân châu dẻo quánh nhai thích mê luôn, cho em xin thêm trân châu nha chị!'
    ]
  },
  {
    type: 1,
    name: 'Anh Nam (Văn phòng)',
    patience: 20000,
    fav: ['hong_tra_tac', 'tra_olong_nuong'],
    tipMult: 1.1,
    dialogues: [
      'Em gái ơi, làm anh một ly đậm trà ít ngọt để chạy kịp deadline quý 3!',
      'Sếp anh vừa khen trà sữa chỗ này thơm béo, bảo anh đặt cho cả phòng!',
      'Cả sáng họp căng thẳng quá, chỉ có trà sữa mới cứu rỗi được tâm hồn anh.',
      'Ghi giùm anh hóa đơn đỏ được không em? Đùa thôi, làm nhanh giùm anh nhé!'
    ]
  },
  {
    type: 2,
    name: 'Cô Ba (Hàng xóm)',
    patience: 30000,
    fav: ['tra_sua_truyen_thong', 'tra_dao_cam_sa'],
    tipMult: 1.0,
    dialogues: [
      'HeeHee hả con? Pha cho cô Ba ly béo ngậy đãi mấy đứa cháu ngoại nghen!',
      'Bữa nay buôn bán đắt không con gái? Nhìn nồi trân châu thấy ham ghê!',
      'Cho cô ly nóng nha, trời này gió lạnh uống ấm bụng đỡ ho dữ lắm.',
      'Mai mốt có chi nhánh to nhớ cho cô Ba chân bảo vệ giữ xe nghen con!'
    ]
  },
  {
    type: 3,
    name: 'Tú (TikToker Reviewer)',
    patience: 16000,
    fav: ['sua_tuoi_duong_den', 'tra_olong_nuong'],
    tipMult: 2.0,
    isTiktoker: true,
    dialogues: [
      'Hello cả nhà! Hôm nay Tú sẽ test xem trà sữa HeeHee có thực sự đỉnh nóc kịch trần không!',
      'Visual ly nước này lên video bao đẹp, HeeHee nhớ rưới đường đen chảy quanh thành ly nha!',
      'Kênh mình vừa đạt 500k follow, review này mà ngon là quán nổ đơn từ sáng tới khuya!',
      'Làm chỉn chu giùm em nha, ngon thì em khen nức nở, dở là coi chừng bóc phốt đó!'
    ]
  },
  {
    type: 4,
    name: 'Anh Shipper Giao Hàng',
    patience: 18000,
    fav: ['tra_sua_truyen_thong', 'sua_tuoi_duong_den'],
    tipMult: 1.0,
    isShipper: true,
    dialogues: [
      'Đơn này khách hối cháy máy quận 1, làm lẹ giùm anh kẻo bị trừ sao nghe em gái!',
      'Trưa nắng chang chang chạy ngoài đường, ngửi mùi trà sữa quán em mát cả người!',
      'Anh vừa tiện đường mua mấy món ăn vặt nóng hổi, em ăn chung với anh cho vui không?',
      'Dạo này quán nổ cuốc liên tục, anh em shipper khoái nhận đơn quán HeeHee lắm á!'
    ]
  },
  {
    type: 5,
    name: 'Bác Ba Trưởng Phố (Cụ Đồ)',
    patience: 32000,
    fav: ['tra_sua_truyen_thong', 'hong_tra_tac'],
    tipMult: 1.15,
    dialogues: [
      'Chào cô chủ nhỏ! Bác đi dưỡng sinh về, cho bác một ly trà thanh nhiệt giải độc nhé.',
      'Thời trẻ bác mê trà sen hồ Tây, giờ thấy trà của cháu cũng thơm tao nhã lắm.',
      'Làm ăn buôn bán cái tình cái nghĩa là trên hết, cháu giữ được vị trà mộc là quý lắm.',
      'Cho bác ít đá thôi nghen, tuổi già răng cỏ buốt không chịu được lạnh đâu.'
    ]
  },
  {
    type: 6,
    name: 'Chú Quân Gymer',
    patience: 19000,
    fav: ['hong_tra_tac', 'tra_thai_xanh'],
    tipMult: 1.2,
    dialogues: [
      'Em gái ơi! Cho anh ly 0% đường, nhiều đá, trà thật đậm để anh siết cơ nhé!',
      'Vừa cày xong 10 hiệp squat rã rời chân tay, cần nạp chút cafein giải mỏi!',
      'Có topping nào thanh đạm không em? Cho anh gấp đôi thạch rau câu nhé!',
      'Uống trà sữa xong là anh vào phòng gym đẩy tạ 100kg ngon ơ liền!'
    ]
  },
  {
    type: 7,
    name: 'Cặp Đôi Gà Bông (Duy & Linh)',
    patience: 26000,
    fav: ['sua_tuoi_duong_den', 'tra_dao_cam_sa'],
    tipMult: 1.3,
    dialogues: [
      'Chị ơi cho tụi em 1 ly size L cắm 2 ống hút nha, tụi em chia nhau uống chung!',
      'Hôm nay là kỷ niệm 100 ngày yêu nhau, HeeHee vẽ hình trái tim lên nắp ly giùm nha!',
      'Cậu uống ngụm đầu đi nè, trà thơm lắm... Cảm ơn quán đã có góc hẹn hò dễ thương!',
      'Người yêu em kén uống ngọt lắm, quán làm thanh thanh nhẹ nhàng giùm em nghen!'
    ]
  },
  {
    type: 8,
    name: 'David (Khách Tây Ba-lô)',
    patience: 24000,
    fav: ['tra_sua_truyen_thong', 'tra_olong_nuong'],
    tipMult: 1.5,
    dialogues: [
      'Hello! Vietnamese milk tea is legendary, can I try your signature Boba please?',
      'Wow, the smell of black tea from your cart is amazing! Street style is the best!',
      'Not too sweet, please! I love these chewy black pearls so much!',
      'Can I take a selfie with the tea cart? This retro aesthetic is gorgeous!'
    ]
  },
  {
    type: 9,
    name: 'Chị Hạnh Vé Số',
    patience: 28000,
    fav: ['hong_tra_tac', 'tra_thai_xanh'],
    tipMult: 1.0,
    dialogues: [
      'Em gái ơi, đổi giùm chị tờ vé số lấy ly hồng trà tắc đá mát lạnh được không nè?',
      'Nắng đổ lửa đi bộ từ sáng tới giờ rát họng, nhấp ngụm trà tắc của em tỉnh cả người!',
      'Chúc cô chủ nhỏ buôn may bán đắt, khách đông nườm nượp tràn cả vỉa hè nghen!',
      'Uống ly trà của em thơm ngọt mát lành, xua tan hết nhọc nhằn một ngày mưu sinh.'
    ]
  }
];

// Shipper snacks pool
const SHIPPER_SNACKS = [
  { id: 'banh_trang_tron', name: 'Bánh Tráng Trộn Bò Khô Trứng Cút', icon: '🥡', desc: 'Chua cay mặn ngọt bùng nổ vị giác vỉa hè' },
  { id: 'bap_xao', name: 'Bắp Xào Bơ Tép Mỡ Hành', icon: '🌽', desc: 'Béo ngậy thơm nức mũi mùi bơ vàng' },
  { id: 'xien_ban', name: 'Xiên Que Chiên Sốt Me Chua Ngọt', icon: '🍢', desc: 'Hương vị tuổi thơ cổng trường học giòn rụm' },
  { id: 'banh_trang_nuong', name: 'Bánh Tráng Nướng Trứng Xúc Xích', icon: '🍕', desc: 'Pizza Việt Nam nóng hổi giòn tan' },
  { id: 'goi_cuon', name: 'Gỏi Cuốn Tôm Thịt Tương Đen', icon: '🥢', desc: 'Tươi mát nhiều rau kèm đậu phộng rang' },
  { id: 'che_buoi', name: 'Chè Bưởi Cốt Dừa An Giang', icon: '🥣', desc: 'Cùi bưởi giòn sần sật béo ngậy nước cốt dừa' }
];

// Helper to generate store code
function generateStoreCode() {
  return 'HYHY-' + crypto.randomBytes(3).toString('hex').toUpperCase();
}

// Create or get store profile
async function getOrCreateStore(storeName, inputCode) {
  let store = null;
  if (inputCode) {
    store = await db.prepare('SELECT * FROM stores WHERE store_code = ?').get(inputCode);
  }

  if (!store) {
    const code = generateStoreCode();
    const token = crypto.randomBytes(16).toString('hex');
    const now = new Date().toISOString();

    const result = await db.prepare(`
      INSERT INTO stores (store_code, store_name, session_token, created_at)
      VALUES (?, ?, ?, ?)
    `).run(code, storeName || 'Tiệm Trà Sữa HeeHee', token, now);

    const storeId = Number(result.lastInsertRowid);

    const initialSave = {
      store_id: storeId,
      chapter: 1,
      day_in_game: 1,
      money: 200000,
      debt_remaining: 3000000,
      reputation: 5.0
    };
    const hash = anticheat.generateSaveHash(initialSave);

    await db.prepare(`
      INSERT INTO game_saves (store_id, chapter, day_in_game, money, debt_remaining, reputation, recipes, save_hash, updated_at)
      VALUES (?, 1, 1, 200000, 3000000, 5.0, '["tra_sua_truyen_thong"]', ?, ?)
    `).run(storeId, hash, now);

    store = await db.prepare('SELECT * FROM stores WHERE id = ?').get(storeId);
  }

  return await getStoreState(store.id);
}

// Get full state of a store
async function getStoreState(storeId) {
  if (!storeId) return null;
  const id = Number(storeId);
  if (isNaN(id) || id <= 0) return null;

  const store = await db.prepare('SELECT * FROM stores WHERE id = ?').get(id);
  if (!store) return null;

  let save = await db.prepare('SELECT * FROM game_saves WHERE store_id = ?').get(id);
  if (!save) {
    console.warn(`[Self-Healing] Missing game_saves for store ID ${id}, auto-creating default save...`);
    const initialSave = {
      store_id: id,
      chapter: 1,
      day_in_game: 1,
      money: 200000,
      debt_remaining: 3000000,
      reputation: 5.0
    };
    const hash = anticheat.generateSaveHash(initialSave);
    const now = new Date().toISOString();

    await db.prepare(`
      INSERT INTO game_saves (store_id, chapter, day_in_game, money, debt_remaining, reputation, recipes, save_hash, updated_at)
      VALUES (?, 1, 1, 200000, 3000000, 5.0, '["tra_sua_truyen_thong"]', ?, ?)
    `).run(id, hash, now);

    save = await db.prepare('SELECT * FROM game_saves WHERE store_id = ?').get(id);
  }

  const chapter = save ? (save.chapter || 1) : 1;
  const daily = await anticheat.getOrCreateDailyStats(id, chapter);

  return {
    store_id: store.id,
    username: store.username || store.store_name,
    store_code: store.store_code,
    store_name: store.store_name,
    session_token: store.session_token,
    save: {
      store_id: store.id,
      chapter: save.chapter,
      day_in_game: save.day_in_game,
      money: save.money,
      debt_remaining: save.debt_remaining,
      reputation: save.reputation,
      is_jailed: save.is_jailed,
      jail_reason: save.jail_reason,
      rest_until_ts: save.rest_until_ts || 0,
      active_buffs: JSON.parse(save.active_buffs || '{}'),
      inventory: JSON.parse(save.inventory || '{}'),
      upgrades: JSON.parse(save.upgrades || '{}'),
      recipes: JSON.parse(save.recipes || '[]'),
      properties: JSON.parse(save.properties || '{}'),
      decorations: JSON.parse(save.decorations || '[]')
    },
    daily_stats: daily,
    recipes_db: RECIPES,
    customers_db: CUSTOMERS,
    locations: LOCATIONS,
    ingredients: INGREDIENTS,
    decorations_db: DECORATIONS,
    negotiation: NEGOTIATION
  };
}

// Generate new random customer order wave (1 - 4 customers)
async function generateOrder(storeId) {
  const save = await db.prepare('SELECT * FROM game_saves WHERE store_id = ?').get(storeId);
  if (!save || save.is_jailed === 1) return null;

  const now = Date.now();

  // 1. Check 15-minute rest condition (Đau bụng effect)
  if (save.rest_until_ts && now < save.rest_until_ts) {
    const remainingSec = Math.ceil((save.rest_until_ts - now) / 1000);
    return {
      resting: true,
      restUntil: save.rest_until_ts,
      remainingSeconds: remainingSec,
      message: `HeeHee đang bị đau bụng do ăn vặt vỉa hè! Quán tạm nghỉ ngơi (${Math.floor(remainingSec / 60)} phút ${remainingSec % 60} giây còn lại).`
    };
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

  const unlocked = JSON.parse(save.recipes || '["tra_sua_truyen_thong"]');
  const availableKeys = Object.keys(RECIPES).filter(k => unlocked.includes(k));
  const validKeys = availableKeys.length > 0 ? availableKeys : ['tra_sua_truyen_thong'];

  // 2. Wave size calculation: 1 to 4 customers per wave
  let waveSize = 1;
  const randWave = Math.random();

  if (activeBuffs.tiktoker_status === 'viral') {
    // High traffic boost (1.5x - 3x customers): 2 to 4 customers
    if (randWave < 0.35) waveSize = 4;
    else if (randWave < 0.70) waveSize = 3;
    else waveSize = 2;
  } else if (activeBuffs.tiktoker_status === 'flop') {
    // Bad review debuff: mostly single customer
    waveSize = randWave < 0.8 ? 1 : 2;
  } else if (save.reputation < 3.0) {
    // Low reputation penalty: single customer per wave
    waveSize = 1;
  } else {
    // Normal traffic: 1 to 4 customers
    if (randWave < 0.35) waveSize = 1;
    else if (randWave < 0.70) waveSize = 2;
    else if (randWave < 0.90) waveSize = 3;
    else waveSize = 4;
  }

  const sugars = ['0%', '30%', '50%', '70%', '100%'];
  const ices = ['Nóng', 'Ít đá', 'Vừa đá', 'Đầy đá'];

  const orders = [];
  let snackEvent = null;

  for (let i = 0; i < waveSize; i++) {
    // Select customer: if invited TikToker, ensure first customer is Tú (TikToker)
    let cust = CUSTOMERS[Math.floor(Math.random() * CUSTOMERS.length)];
    if (isInvitedTiktoker && i === 0) {
      cust = CUSTOMERS.find(c => c.isTiktoker) || CUSTOMERS[3];
    }

    // Customer picks a drink that exists in the store's unlocked menu!
    const custUnlockedFavs = (cust.fav || []).filter(k => validKeys.includes(k));
    let selectedKey;
    if (custUnlockedFavs.length > 0 && Math.random() < 0.75) {
      selectedKey = custUnlockedFavs[Math.floor(Math.random() * custUnlockedFavs.length)];
    } else {
      selectedKey = validKeys[Math.floor(Math.random() * validKeys.length)];
    }
    const recipe = RECIPES[selectedKey] || RECIPES['tra_sua_truyen_thong'];
    
    let quote = cust.dialogues[Math.floor(Math.random() * cust.dialogues.length)];
    if (isInvitedTiktoker && i === 0) {
      quote = 'Hello HeeHee! Nhận lời mời của quán, hôm nay Tú vác máy quay qua làm clip review thực tế xem có đỉnh nóc kịch trần không nha! Ngon là Tú kéo bão sao cho quán liền!';
    }

    let sugar = sugars[Math.floor(Math.random() * sugars.length)];
    if (cust.type === 6 && Math.random() < 0.8) sugar = '0%'; // Gymer prefers 0% sugar

    let ice = ices[Math.floor(Math.random() * ices.length)];
    if (cust.type === 5 && Math.random() < 0.7) ice = 'Ít đá'; // Elder prefers warm/low ice

    const orderId = 'ORD-' + crypto.randomBytes(4).toString('hex');
    
    // Patience with active buff & Capybara pet
    let patienceMs = cust.patience;
    if (activeBuffs.patience_boost && activeBuffs.patience_boost > 0) {
      patienceMs = Math.floor(patienceMs * 1.4); // +40% patience
    }
    const upgrades = JSON.parse(save.upgrades || '{}');
    if (upgrades.active_pet === 'capybara' && !upgrades.is_pet_stolen) {
      patienceMs = Math.floor(patienceMs * 1.4); // Capybara +40% patience
    }
    const expiresAt = now + patienceMs + (i * 7000); // subsequent queue members wait longer

    // Price with tip buff & Pet buffs
    let price = recipe.basePrice;
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

    // Đàm phán: khách chủ động đề nghị giá thấp hơn
    let negotiation = null;
    const customerBonus = locationConfig?.customerBonus || 0;
    const hagglerChance = Math.min(0.6, NEGOTIATION.haggleChance + customerBonus * 0.2);
    if (Math.random() < hagglerChance) {
      const discountRatio = 0.1 + Math.random() * NEGOTIATION.maxDiscount;
      const discountAmount = Math.floor(price * discountRatio);
      const requestedPrice = Math.max(1000, price - discountAmount);
      const line = NEGOTIATION.haggleLines[Math.floor(Math.random() * NEGOTIATION.haggleLines.length)]
        .replace('{discount}', discountAmount.toLocaleString('vi-VN'));
      negotiation = {
        requestedPrice,
        originalPrice: price,
        discountAmount,
        line,
        offerToppings: recipe.toppings,
        status: 'pending'
      };
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

    await db.prepare(`
      INSERT INTO active_orders (id, store_id, recipe_id, customer_name, sugar, ice, toppings, price, original_price, negotiation, created_at, expires_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(orderId, storeId, recipe.id, cust.name, sugar, ice, JSON.stringify(recipe.toppings), price, price, JSON.stringify(negotiation || null), now, expiresAt);

    orders.push({
      orderId,
      customerType: cust.type,
      customerName: cust.name,
      quote,
      isTiktoker: !!cust.isTiktoker,
      isShipper: !!cust.isShipper,
      recipeId: recipe.id,
      recipeName: recipe.name,
      sugar,
      ice,
      toppings: recipe.toppings,
      price,
      originalPrice: price,
      negotiation,
      patienceMs,
      expiresAt,
      isOverloaded: daily.is_overloaded
    });
  }

  // Decrement TikToker waves count
  if (activeBuffs.tiktoker_status) {
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
      return {
        success: true,
        accepted: true,
        outcome: 'good',
        buffType: 'tip_bonus',
        message: '✨ Ăn vặt tràn đầy năng lượng, pha chế siêu tốc! Khách uống tấm tắc khen ngợi, tip thêm +10% doanh thu mỗi ly!'
      };
    }
  } else {
    // 25% bad effect: Đau bụng -> buộc nghỉ 15 phút thực
    const restUntil = now + (15 * 60 * 1000);
    await db.prepare('UPDATE game_saves SET rest_until_ts = ? WHERE store_id = ?').run(restUntil, storeId);
    await db.prepare('DELETE FROM active_orders WHERE store_id = ?').run(storeId);

    return {
      success: true,
      accepted: true,
      outcome: 'bad',
      restUntil,
      restMinutes: 15,
      message: '🤢 Ôi không! Bánh tráng cay xé lưỡi hoặc sốt me có vấn đề khiến bụng HeeHee sôi ùng ục đau quằn quại! Bác sĩ yêu cầu tạm đóng quầy nghỉ ngơi đúng 15 phút thực!'
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

  const cost = 25000;
  if (save.money < cost) {
    return { success: false, message: `Bạn cần tối thiểu ${cost.toLocaleString('vi-VN')}đ tiền mặt để book lịch mời TikToker!` };
  }

  const newMoney = save.money - cost;
  activeBuffs.tiktoker_invited = true;

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
    message: '🎉 Đã book thành công Tú (TikToker Reviewer)! Tú đang cầm máy quay đến quán của bạn để trải nghiệm và làm clip review kéo sao!'
  };
}

// Collab with a friend's store code
async function addCollab(hostStoreId, friendCode) {
  const hostStore = await db.prepare('SELECT * FROM stores WHERE id = ?').get(hostStoreId);
  const friendStore = await db.prepare('SELECT * FROM stores WHERE store_code = ?').get(friendCode.trim().toUpperCase());

  if (!friendStore) {
    return { success: false, message: 'Không tìm thấy Mã Quán bạn bè này!' };
  }

  if (friendStore.id === hostStoreId) {
    return { success: false, message: 'Bạn không thể tự Collab với chính mình!' };
  }

  const save = await db.prepare('SELECT * FROM game_saves WHERE store_id = ?').get(hostStoreId);
  const realDate = anticheat.getRealDate();
  const capInfo = anticheat.CHAPTER_CAPS[save.chapter] || anticheat.CHAPTER_CAPS[1];

  // Check current collabs
  const countRow = await db.prepare('SELECT COUNT(*) as cnt FROM collabs WHERE host_store_id = ? AND collab_date = ?').get(hostStoreId, realDate);
  if (countRow.cnt >= capInfo.maxCollabs) {
    return { success: false, message: `Hôm nay bạn đã đạt giới hạn tối đa ${capInfo.maxCollabs} đối tác Collab!` };
  }

  // Check duplicate
  const existing = await db.prepare('SELECT * FROM collabs WHERE host_store_id = ? AND friend_store_id = ? AND collab_date = ?')
    .get(hostStoreId, friendStore.id, realDate);
  if (existing) {
    return { success: false, message: 'Hôm nay bạn và quán này đã ký thỏa thuận Collab rồi!' };
  }

  // Insert two-way or one-way collab
  await db.prepare(`
    INSERT INTO collabs (host_store_id, friend_store_id, collab_date)
    VALUES (?, ?, ?)
  `).run(hostStoreId, friendStore.id, realDate);

  // Update daily stats
  await db.prepare(`
    UPDATE daily_stats 
    SET collab_count = collab_count + 1 
    WHERE store_id = ? AND real_date = ?
  `).run(hostStoreId, realDate);

  const bonus = 50000;
  const newMoney = save.money + bonus;
  const updatedSave = {
    store_id: hostStoreId,
    chapter: save.chapter,
    day_in_game: save.day_in_game,
    money: newMoney,
    debt_remaining: save.debt_remaining,
    reputation: save.reputation
  };
  const hash = anticheat.generateSaveHash(updatedSave);

  await db.prepare(`
    UPDATE game_saves 
    SET money = ?, save_hash = ?, updated_at = ?
    WHERE store_id = ?
  `).run(newMoney, hash, new Date().toISOString(), hostStoreId);

  const updatedDaily = await anticheat.getOrCreateDailyStats(hostStoreId, save.chapter);

  return {
    success: true,
    message: `Ký kết Collab thành công với [${friendStore.store_name}]! Nhận ngay +${bonus.toLocaleString('vi-VN')}đ tiền thưởng đối tác!`,
    daily_stats: updatedDaily
  };
}

// Pay debt to Anh Bảnh
async function payDebt(storeId, amount) {
  const save = await db.prepare('SELECT * FROM game_saves WHERE store_id = ?').get(storeId);
  if (!save) return { success: false, message: 'Cửa hàng không tồn tại' };

  if (save.money < amount) {
    return { success: false, message: 'Không đủ tiền mặt để trả nợ!' };
  }

  const newMoney = save.money - amount;
  const newDebt = Math.max(0, save.debt_remaining - amount);
  let newChapter = save.chapter;

  if (newDebt === 0 && save.chapter === 1) {
    newChapter = 2; // Unlock Chapter 2!
  }

  const updatedSave = {
    store_id: storeId,
    chapter: newChapter,
    day_in_game: save.day_in_game,
    money: newMoney,
    debt_remaining: newDebt,
    reputation: save.reputation
  };
  const hash = anticheat.generateSaveHash(updatedSave);

  await db.prepare(`
    UPDATE game_saves 
    SET money = ?, debt_remaining = ?, chapter = ?, save_hash = ?, updated_at = ?
    WHERE store_id = ?
  `).run(newMoney, newDebt, newChapter, hash, new Date().toISOString(), storeId);

  return {
    success: true,
    money: newMoney,
    debt_remaining: newDebt,
    chapter: newChapter,
    message: newDebt === 0 
      ? 'Chúc mừng! Bạn đã trả hết sạch nợ nần cho Anh Bảnh! Mở khóa Chương 2: Góc Hẻm Sinh Viên!' 
      : `Đã trả ${amount.toLocaleString('vi-VN')}đ. Nợ còn lại: ${newDebt.toLocaleString('vi-VN')}đ.`
  };
}

// Purchase upgrade
const UPGRADES = {
  may_dap_nap: { name: 'Máy Dập Nắp Tự Động', cost: 500000, desc: 'Bé Bắp tự động dập nắp ly siêu tốc' },
  binh_u_lon: { name: 'Bình Ủ Inox 10L', cost: 400000, desc: 'Cốt trà thơm lâu, không sợ thiu chua' },
  xe_wave: { name: 'Xe Wave Giao Hàng Cho Lâm', cost: 1200000, desc: 'Tăng tốc độ ship và rượt bắt kẻ bùng tiền' },
  
  // HỆ THỐNG THÚ CƯNG GIỮ QUÁN (PETS - Giá tăng gấp 10 lần)
  pet_corgi: {
    name: '🐶 Cún Corgi Chân Ngắn (Mông Trái Tim)',
    cost: 1800000,
    type: 'pet',
    petId: 'corgi',
    desc: 'Cún cưng giữ quầy siêu dễ thương, giúp tăng +20% tiền tip của khách. (Cảnh giác kẻ trộm khi quán đông!)'
  },
  pet_meo_tam_the: {
    name: '🐱 Mèo Tam Thể Chiêu Tài (Maneki Neko)',
    cost: 3200000,
    type: 'pet',
    petId: 'meo_tam_the',
    desc: 'Mèo thần tài vẫy chân may mắn, tăng +15% tổng doanh thu mỗi ly trà sữa!'
  },
  pet_capybara: {
    name: '🐹 Chuột Lang Nước Capybara Siêu Chill',
    cost: 5500000,
    type: 'pet',
    petId: 'capybara',
    desc: 'Thánh ngoại giao bình tĩnh nhất quả đất, tăng +40% thời gian kiên nhẫn chờ đợi của khách hàng!'
  },

  // HỆ THỐNG CÔNG THỨC MÓN MỚI (MỞ RỘNG MENU)
  recipe_hong_tra_tac: {
    name: '📜 Công Thức: Hồng Trà Tắc Xí Muội',
    cost: 120000,
    type: 'recipe',
    recipeId: 'hong_tra_tac',
    desc: 'Mở khóa món Hồng Trà Tắc Xí Muội vào Menu quán! Giá bán: 12.000đ/ly.'
  },
  recipe_tra_thai_xanh: {
    name: '📜 Công Thức: Trà Sữa Thái Xanh',
    cost: 250000,
    type: 'recipe',
    recipeId: 'tra_thai_xanh',
    desc: 'Mở khóa món Trà Sữa Thái Xanh vào Menu quán! Giá bán: 18.000đ/ly.'
  },
  recipe_sua_tuoi_duong_den: {
    name: '📜 Công Thức: Sữa Tươi Trân Châu Đường Đen',
    cost: 500000,
    type: 'recipe',
    recipeId: 'sua_tuoi_duong_den',
    desc: 'Mở khóa món Sữa Tươi Đường Đen hot trend vào Menu quán! Giá bán: 25.000đ/ly.'
  },
  recipe_tra_dao_cam_sa: {
    name: '📜 Công Thức: Trà Đào Cam Sả',
    cost: 800000,
    type: 'recipe',
    recipeId: 'tra_dao_cam_sa',
    desc: 'Mở khóa món Trà Đào Cam Sả giải nhiệt vào Menu quán! Giá bán: 28.000đ/ly.'
  },
  recipe_tra_olong_nuong: {
    name: '📜 Công Thức: Trà Ô Long Nướng Sương Sáo',
    cost: 1500000,
    type: 'recipe',
    recipeId: 'tra_olong_nuong',
    desc: 'Mở khóa món Trà Ô Long Nướng Thượng Hạng vào Menu quán! Giá bán: 35.000đ/ly.'
  }
};

async function buyUpgrade(storeId, upgradeId) {
  const item = UPGRADES[upgradeId];
  if (!item) return { success: false, message: 'Vật phẩm không tồn tại' };

  const save = await db.prepare('SELECT * FROM game_saves WHERE store_id = ?').get(storeId);
  const upgrades = JSON.parse(save.upgrades || '{}');
  let recipes = JSON.parse(save.recipes || '["tra_sua_truyen_thong"]');

  if (upgrades[upgradeId] || (item.type === 'recipe' && recipes.includes(item.recipeId))) {
    return { success: false, message: 'Đã sở hữu nâng cấp/công thức này rồi!' };
  }

  if (save.money < item.cost) {
    return { success: false, message: 'Không đủ tiền mua nâng cấp này!' };
  }

  upgrades[upgradeId] = true;
  if (item.type === 'pet') {
    upgrades.active_pet = item.petId;
    upgrades.is_pet_stolen = false;
  } else if (item.type === 'recipe') {
    if (!recipes.includes(item.recipeId)) {
      recipes.push(item.recipeId);
    }
  }

  const newMoney = save.money - item.cost;
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
    SET money = ?, upgrades = ?, recipes = ?, save_hash = ?, updated_at = ?
    WHERE store_id = ?
  `).run(newMoney, JSON.stringify(upgrades), JSON.stringify(recipes), hash, new Date().toISOString(), storeId);

  return {
    success: true,
    money: newMoney,
    upgrades,
    recipes,
    message: item.type === 'recipe' 
      ? `🎉 Mở khóa thành công [${item.name}]! Khách hàng bắt đầu có thể order món này!` 
      : `Đã trang bị thành công [${item.name}]!`
  };
}

// Thief snatches pet during rush hour
async function stealPet(storeId) {
  const save = await db.prepare('SELECT * FROM game_saves WHERE store_id = ?').get(storeId);
  if (!save) return { success: false, message: 'Cửa hàng không tồn tại' };

  const upgrades = JSON.parse(save.upgrades || '{}');
  if (!upgrades.active_pet || upgrades.is_pet_stolen) {
    return { success: false, message: 'Không có thú cưng để bắt cóc' };
  }

  upgrades.is_pet_stolen = true;
  upgrades.stolen_at = Date.now();
  
  // Tiền chuộc bằng 50% giá trị thú cưng
  const petKey = upgrades.active_pet;
  const petItem = Object.values(UPGRADES).find(u => u.type === 'pet' && (u.petId === petKey || u.id === petKey));
  const petCost = petItem ? petItem.cost : 1800000;
  const ransomCost = Math.floor(petCost * 0.5);
  upgrades.ransom_cost = ransomCost;

  const updatedSave = {
    store_id: storeId,
    chapter: save.chapter,
    day_in_game: save.day_in_game,
    money: save.money,
    debt_remaining: save.debt_remaining,
    reputation: Math.max(1.0, Number((save.reputation - 0.2).toFixed(1)))
  };
  const hash = anticheat.generateSaveHash(updatedSave);

  await db.prepare(`
    UPDATE game_saves 
    SET reputation = ?, upgrades = ?, save_hash = ?, updated_at = ?
    WHERE store_id = ?
  `).run(updatedSave.reputation, JSON.stringify(upgrades), hash, new Date().toISOString(), storeId);

  await db.prepare(`
    INSERT INTO audit_logs (store_id, event_type, detail, logged_at)
    VALUES (?, 'PET_STOLEN', 'Kẻ trộm đồ đen đeo khẩu trang đã câu trộm mất thú cưng khi quán đông khách!', ?)
  `).run(storeId, new Date().toISOString());

  return {
    success: true,
    petId: upgrades.active_pet,
    ransomCost,
    upgrades,
    reputation: updatedSave.reputation,
    message: `🚨 Ôi không! Kẻ trộm đồ đen đã bắt cóc mất thú cưng! Tiền chuộc là ${ransomCost.toLocaleString('vi-VN')}đ (50% giá trị thú cưng)!`
  };
}

// Redeem / Ransom pet back (Tiền chuộc bằng 50% giá trị thú cưng)
async function redeemPet(storeId) {
  const save = await db.prepare('SELECT * FROM game_saves WHERE store_id = ?').get(storeId);
  if (!save) return { success: false, message: 'Cửa hàng không tồn tại' };

  const upgrades = JSON.parse(save.upgrades || '{}');
  if (!upgrades.is_pet_stolen) {
    return { success: false, message: 'Thú cưng không bị bắt cóc!' };
  }

  const petKey = upgrades.active_pet;
  const petItem = Object.values(UPGRADES).find(u => u.type === 'pet' && (u.petId === petKey || u.id === petKey));
  const petCost = petItem ? petItem.cost : 1800000;
  const defaultRansom = Math.floor(petCost * 0.5);
  const ransom = upgrades.ransom_cost || defaultRansom;

  if (save.money < ransom) {
    return { success: false, message: `Không đủ tiền chuộc thú cưng (${ransom.toLocaleString('vi-VN')}đ - 50% giá trị)! Hãy bán thêm trà sữa nhé!` };
  }

  upgrades.is_pet_stolen = false;
  const newMoney = save.money - ransom;

  const updatedSave = {
    store_id: storeId,
    chapter: save.chapter,
    day_in_game: save.day_in_game,
    money: newMoney,
    debt_remaining: save.debt_remaining,
    reputation: Math.min(5.0, Number((save.reputation + 0.1).toFixed(1)))
  };
  const hash = anticheat.generateSaveHash(updatedSave);

  await db.prepare(`
    UPDATE game_saves 
    SET money = ?, reputation = ?, upgrades = ?, save_hash = ?, updated_at = ?
    WHERE store_id = ?
  `).run(newMoney, updatedSave.reputation, JSON.stringify(upgrades), hash, new Date().toISOString(), storeId);

  await db.prepare(`
    INSERT INTO audit_logs (store_id, event_type, detail, logged_at)
    VALUES (?, 'PET_REDEEMED', 'Chủ quán đã chi tiền chuộc thú cưng trở về an toàn', ?)
  `).run(storeId, new Date().toISOString());

  return {
    success: true,
    money: newMoney,
    upgrades,
    message: '🎉 Bé thú cưng đã trở về an toàn bên cạnh quầy trà sữa! Bé mừng rỡ vẫy đuôi rối rít!'
  };
}

// Catch and shoo away thief
async function shooThief(storeId) {
  const save = await db.prepare('SELECT * FROM game_saves WHERE store_id = ?').get(storeId);
  if (!save) return { success: false, message: 'Cửa hàng không tồn tại' };

  const reward = 10000;
  const newMoney = save.money + reward;
  const newRep = Math.min(5.0, Number((save.reputation + 0.1).toFixed(1)));

  const updatedSave = {
    store_id: storeId,
    chapter: save.chapter,
    day_in_game: save.day_in_game,
    money: newMoney,
    debt_remaining: save.debt_remaining,
    reputation: newRep
  };
  const hash = anticheat.generateSaveHash(updatedSave);

  await db.prepare(`
    UPDATE game_saves 
    SET money = ?, reputation = ?, save_hash = ?, updated_at = ?
    WHERE store_id = ?
  `).run(newMoney, newRep, hash, new Date().toISOString(), storeId);

  return {
    success: true,
    reward,
    money: newMoney,
    reputation: newRep,
    message: '👮 BẮT QUẢ TANG KẺ TRỘM! Tên trộm đồ đen hoảng sợ vứt bao tải bỏ chạy! Thưởng cảnh giác: +10.000đ và tăng uy tín! ⭐'
  };
}

module.exports = {
  RECIPES,
  CUSTOMERS,
  UPGRADES,
  getOrCreateStore,
  getStoreState,
  generateOrder,
  handleSnackDecision,
  recordOrderFailure,
  addCollab,
  payDebt,
  buyUpgrade,
  stealPet,
  redeemPet,
  shooThief,
  inviteTiktoker
};
