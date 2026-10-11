const db = require('../../models/db');
const anticheat = require('../anticheat.service');

// 6 Craft Coffee Items
const COFFEE_MENU = {
  cafe_phin: {
    id: 'cafe_phin',
    name: 'Cà Phê Phin Sữa Đá Đậm Vị',
    price: 15000,
    currency: 'money',
    buffId: 'buff_tinh_tao',
    buffName: 'Tỉnh Táo Xuyên Ca',
    buffDesc: '+35% Tốc độ phục vụ & dập nắp ly trong 90 phút',
    icon: '☕',
    durationMin: 90,
    weight: 30,
    multiplierSpeed: 1.35
  },
  bac_xiu: {
    id: 'bac_xiu',
    name: 'Bạc Xỉu Ba Tầng Sài Gòn',
    price: 18000,
    currency: 'money',
    buffId: 'buff_hut_khach_genz',
    buffName: 'Hút Khách Gen Z',
    buffDesc: '+40% Tỉ lệ xuất hiện Học Sinh & Sinh Viên tip thêm tiền',
    icon: '🥛',
    durationMin: 90,
    weight: 25,
    genZBonus: 1.40
  },
  cafe_muoi: {
    id: 'cafe_muoi',
    name: 'Cà Phê Muối Cố Đô Huế',
    price: 22000,
    currency: 'money',
    buffId: 'buff_man_ma_doanh_thu',
    buffName: 'Mặn Mà Doanh Thu',
    buffDesc: 'Mọi ly trà sữa bán ra được cộng thêm +25% giá tiền trong 60 phút',
    icon: '🧂',
    durationMin: 60,
    weight: 20,
    priceBonus: 1.25
  },
  cold_brew: {
    id: 'cold_brew',
    name: 'Cold Brew Cam Sả Thanh Mát',
    price: 25000,
    currency: 'money',
    buffId: 'buff_chien_than_toc_do',
    buffName: 'Chiến Thần Tốc Độ',
    buffDesc: 'Tăng tốc độ xe Wave của Anh Lâm Shipper gấp đôi (x2 Speed)',
    icon: '🍊',
    durationMin: 90,
    weight: 15,
    shipperSpeed: 2.0
  },
  cafe_trung: {
    id: 'cafe_trung',
    name: 'Cà Phê Trứng Khò Phố Cổ',
    price: 30000,
    currency: 'money',
    buffId: 'buff_hao_quang_5sao',
    buffName: 'Hào Quang 5 Sao',
    buffDesc: 'Danh tiếng quán được khóa cứng ở mức tối đa 5.0⭐',
    icon: '🍳',
    durationMin: 90,
    weight: 8,
    lockReputation: 5.0
  },
  espresso_hoang_gia: {
    id: 'espresso_hoang_gia',
    name: 'Espresso Trầm Hương Hoàng Gia',
    price: 2,
    currency: 'teacoin',
    buffId: 'buff_van_may_dai_cat',
    buffName: 'Vận May Đại Cát',
    buffDesc: 'Đơn hàng tiếp theo có 50% tỉ lệ nổ "Đơn Hàng Doanh Nghiệp x10 Ly"',
    icon: '👑',
    durationMin: 120,
    weight: 2,
    corpOrderChance: 0.50
  }
};

// 5 Combat Foods
const FOOD_MENU = {
  banh_mi_pate: {
    id: 'banh_mi_pate',
    name: 'Bánh Mì Pate Cay Xè Lưỡi',
    price: 5000,
    currency: 'money',
    icon: '🥖',
    desc: '+25% Sát Thương Tấn Công (ATK) cho mọi loại trân châu',
    atkBonus: 0.25,
    critRate: 0,
    critMult: 1.5,
    speedBonus: 0,
    immuneSquid: false,
    durationMin: 15
  },
  tiramisu: {
    id: 'tiramisu',
    name: 'Tiramisu Cacao Đậm Đặc',
    price: 10000,
    currency: 'money',
    icon: '🍰',
    desc: '+30% Tỉ Lệ Bạo Kích (Crit Rate) & Sát Thương Crit x2.0',
    atkBonus: 0,
    critRate: 0.30,
    critMult: 2.0,
    speedBonus: 0,
    immuneSquid: false,
    durationMin: 15
  },
  sandwich_cheese: {
    id: 'sandwich_cheese',
    name: 'Sandwich Phô Mai Nướng Giòn',
    price: 8000,
    currency: 'money',
    icon: '🥪',
    desc: 'Giảm 50% thời gian nạp đạn (Tốc độ nã trân châu x2)',
    atkBonus: 0,
    critRate: 0,
    critMult: 1.5,
    speedBonus: 0.50,
    immuneSquid: false,
    durationMin: 15
  },
  salad_bo_trung: {
    id: 'salad_bo_trung',
    name: 'Salad Bơ Trứng Hồi Phục',
    price: 6000,
    currency: 'money',
    icon: '🥗',
    desc: 'Kháng Mực Bạch Tuộc: Đạn không bị chệch hướng khi Boss cuồng nộ',
    atkBonus: 0,
    critRate: 0,
    critMult: 1.5,
    speedBonus: 0,
    immuneSquid: true,
    durationMin: 15
  },
  steak_tieu: {
    id: 'steak_tieu',
    name: 'Bò Bít Tết Sốt Tiêu Thượng Hạng',
    price: 1,
    currency: 'teacoin',
    icon: '🍖',
    desc: 'Chiến Binh Toàn Năng: +40% ATK, +30% Crit, đạn hào quang vàng!',
    atkBonus: 0.40,
    critRate: 0.30,
    critMult: 2.5,
    speedBonus: 0.30,
    immuneSquid: true,
    cosmicAura: true,
    durationMin: 20
  }
};

// 5 Battle Boba Ammunitions
const PEARL_AMMO = {
  pearl_basic: {
    id: 'pearl_basic',
    name: 'Trân Châu Đen Dẻo Dai',
    price: 500,
    quantity: 10,
    currency: 'money',
    minDmg: 120,
    maxDmg: 180,
    color: '#18181b',
    icon: '⚫',
    desc: 'Đạn phổ thông, bay nhanh, 120 - 180 DMG'
  },
  pearl_flame: {
    id: 'pearl_flame',
    name: 'Trân Châu Đường Đen Nấu Nồi Đất',
    price: 2000,
    quantity: 10,
    currency: 'money',
    minDmg: 350,
    maxDmg: 450,
    dotDmg: 80,
    dotDurationSec: 3,
    color: '#ea580c',
    icon: '🔥',
    desc: 'Thiêu đốt mật mía, 350 - 450 DMG + 80 DoT/giây'
  },
  pearl_golden: {
    id: 'pearl_golden',
    name: 'Trân Châu Hoàng Kim Phủ Vàng',
    price: 5000,
    quantity: 10,
    currency: 'money',
    minDmg: 650,
    maxDmg: 900,
    critRateBonus: 0.45,
    critMult: 2.5,
    color: '#facc15',
    icon: '✨',
    desc: '45% nảy Bạo Kích x2.5 Sát thương (lên đến 2.250 DMG)'
  },
  pearl_frost: {
    id: 'pearl_frost',
    name: 'Trân Châu Băng Tuyết Mộc Châu',
    price: 8000,
    quantity: 5,
    currency: 'money',
    minDmg: 400,
    maxDmg: 400,
    slowBonus: 0.40,
    freezeThreshold: 10,
    color: '#38bdf8',
    icon: '❄️',
    desc: 'Làm chậm xúc tu 40%, đóng băng Boss 2 giây'
  },
  pearl_cosmic: {
    id: 'pearl_cosmic',
    name: 'Trân Châu Nổ Thiên Hà Vũ Trụ',
    price: 1,
    quantity: 15,
    currency: 'teacoin',
    minDmg: 2200,
    maxDmg: 3000,
    ignoresArmor: true,
    aoe: true,
    color: '#a855f7',
    icon: '🌌',
    desc: 'Nổ chùm sao neon tím, 2.200 - 3.000 DMG, xuyên thủng giáp & lá chắn!'
  }
};

/**
 * World Boss Runtime State & In-Memory Storage
 */
class BossEventManager {
  constructor() {
    this.activeEvent = null; // { id, eventDate, startTime, endTime, maxHp, currentHp, phase, isDefeated, damageMap }
    this.eventTimer = null;
    this.countdownTimer = null;
    this.socketGateway = null;
    this.initScheduler();
  }

  setGateway(gateway) {
    this.socketGateway = gateway;
  }

  initScheduler() {
    // Check every 30 seconds if it's Boss time:
    // Wednesday (3) & Sunday (0) at 20:00:00 (Vietnam local time)
    setInterval(() => {
      this.checkScheduledEvent();
    }, 30000);
  }

  checkScheduledEvent() {
    const now = new Date();
    // Use Vietnam Timezone (UTC+7)
    const utc = now.getTime() + (now.getTimezoneOffset() * 60000);
    const vnTime = new Date(utc + (3600000 * 7));

    const dayOfWeek = vnTime.getDay(); // 0 is Sunday, 3 is Wednesday
    const hour = vnTime.getHours();
    const minute = vnTime.getMinutes();

    // Check pre-countdown warning (19:45)
    if ((dayOfWeek === 3 || dayOfWeek === 0) && hour === 19 && minute >= 45 && minute < 60) {
      if (!this.activeEvent && this.socketGateway) {
        const remainingSec = (60 - minute) * 60 - vnTime.getSeconds();
        this.socketGateway.broadcastCountdown(remainingSec);
      }
    }

    // Check boss start (20:00)
    if ((dayOfWeek === 3 || dayOfWeek === 0) && hour === 20 && minute < 15) {
      if (!this.activeEvent) {
        const remainingMinutes = 15 - minute;
        const durationSec = remainingMinutes * 60 - vnTime.getSeconds();
        this.startBossEvent(durationSec > 60 ? durationSec : 900);
      }
    }
  }

  /**
   * Starts a Boss Battle session
   */
  async startBossEvent(durationSec = 900) {
    if (this.activeEvent && this.activeEvent.isActive) {
      return this.activeEvent;
    }

    const now = Date.now();
    const eventId = 'boss_event_' + now;
    const realDate = anticheat.getRealDate();
    const dayOfWeek = new Date().getDay();
    const startTime = now;
    const endTime = now + (durationSec * 1000);

    // Dynamic HP: Scaled for participating Baristas (min 2,000,000 HP, max 10,000,000 HP)
    const playerCount = this.socketGateway ? this.socketGateway.getConnectedPlayerCount() : 10;
    const scaledCount = Math.max(5, Math.min(25, playerCount || 10));
    const maxHp = 200000 * scaledCount;

    this.activeEvent = {
      id: eventId,
      eventDate: realDate,
      dayOfWeek,
      startTime,
      endTime,
      bossType: 'hung_ram_monster',
      maxHp,
      currentHp: maxHp,
      phase: 1, // 1: 100%-60%, 2: 60%-25%, 3: 25%-0%
      isDefeated: false,
      isActive: true,
      damageMap: new Map() // storeId -> { storeId, playerName, totalDamage, pearlsShot, critHits }
    };

    // Save initial record to DB
    try {
      await db.run(
        `INSERT INTO boss_events (id, event_date, day_of_week, start_time, end_time, boss_type, max_hp, current_hp, is_defeated, created_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, 0, ?)`,
        eventId, realDate, dayOfWeek, startTime, endTime, 'hung_ram_monster', maxHp, maxHp, new Date().toISOString()
      );
    } catch (err) {
      console.error('[BossEvent] Failed to insert initial boss_events record:', err);
    }

    console.log(`[BossEvent] 🐙 Quái Vật Hưng Răm đã xuất hiện! HP: ${maxHp.toLocaleString()} (Duration: ${durationSec}s)`);

    // Broadcast spawn to all connected coffee sockets
    if (this.socketGateway) {
      this.socketGateway.broadcastBossSpawn(this.getPublicState());
    }

    // Set end timer
    if (this.eventTimer) clearTimeout(this.eventTimer);
    this.eventTimer = setTimeout(() => {
      this.endBossEvent(false);
    }, durationSec * 1000);

    return this.activeEvent;
  }

  getPublicState() {
    if (!this.activeEvent) return { isActive: false };
    const now = Date.now();
    const remainingMs = Math.max(0, this.activeEvent.endTime - now);
    const hpPercent = Math.max(0, (this.activeEvent.currentHp / this.activeEvent.maxHp) * 100);

    return {
      isActive: this.activeEvent.isActive,
      id: this.activeEvent.id,
      bossType: this.activeEvent.bossType,
      maxHp: this.activeEvent.maxHp,
      currentHp: this.activeEvent.currentHp,
      hpPercent: Number(hpPercent.toFixed(1)),
      phase: this.activeEvent.phase,
      remainingSec: Math.floor(remainingMs / 1000),
      isDefeated: this.activeEvent.isDefeated,
      leaderboard: this.getTopLeaderboard(5)
    };
  }

  getTopLeaderboard(limit = 5) {
    if (!this.activeEvent) return [];
    const logs = Array.from(this.activeEvent.damageMap.values());
    logs.sort((a, b) => b.totalDamage - a.totalDamage);
    return logs.slice(0, limit).map((item, idx) => ({
      rank: idx + 1,
      storeId: item.storeId,
      playerName: item.playerName,
      totalDamage: item.totalDamage,
      pearlsShot: item.pearlsShot,
      critHits: item.critHits
    }));
  }

  /**
   * Process a player projectile shot
   */
  async processAttack(storeId, playerName, pearlType) {
    if (!this.activeEvent || !this.activeEvent.isActive) {
      throw new Error('Sự kiện Boss chưa diễn ra hoặc đã kết thúc!');
    }

    const sid = Number(storeId);
    const save = await db.get('SELECT money, teacoin, boss_pearl_inventory, boss_food_buffs FROM game_saves WHERE store_id = ?', sid);
    if (!save) throw new Error('Không tìm thấy dữ liệu quán');

    let pearlInv = {};
    try { pearlInv = JSON.parse(save.boss_pearl_inventory || '{}'); } catch (e) { pearlInv = {}; }

    // Check pearl stock
    const currentStock = pearlInv[pearlType] || 0;
    if (currentStock <= 0) {
      throw new Error(`Bạn đã hết ${PEARL_AMMO[pearlType]?.name || 'trân châu'}! Vui lòng nạp thêm tại Kho Đạn.`);
    }

    // Deduct 1 ammo
    pearlInv[pearlType] = currentStock - 1;
    await db.run('UPDATE game_saves SET boss_pearl_inventory = ? WHERE store_id = ?', JSON.stringify(pearlInv), sid);

    // Parse food buffs
    let foodBuffs = {};
    try { foodBuffs = JSON.parse(save.boss_food_buffs || '{}'); } catch (e) { foodBuffs = {}; }
    const now = Date.now();
    let atkMultiplier = 1.0;
    let extraCritRate = 0;
    let critMultiplier = 1.5;
    let immuneSquid = false;
    let cosmicAura = false;

    // Check active food buffs
    for (const [fId, buff] of Object.entries(foodBuffs)) {
      if (buff && buff.expiresAt > now) {
        if (buff.atkBonus) atkMultiplier += buff.atkBonus;
        if (buff.critRate) extraCritRate += buff.critRate;
        if (buff.critMult && buff.critMult > critMultiplier) critMultiplier = buff.critMult;
        if (buff.immuneSquid) immuneSquid = true;
        if (buff.cosmicAura) cosmicAura = true;
      }
    }

    const ammoDef = PEARL_AMMO[pearlType] || PEARL_AMMO.pearl_basic;
    // Calculate raw damage
    const baseDamage = Math.floor(ammoDef.minDmg + Math.random() * (ammoDef.maxDmg - ammoDef.minDmg + 1));

    // Crit roll
    const totalCritChance = (ammoDef.critRateBonus || 0) + extraCritRate;
    const isCrit = Math.random() < totalCritChance;
    let dmg = Math.floor(baseDamage * (isCrit ? critMultiplier : 1.0) * atkMultiplier);

    // Armor reduction: 15% armor reduction unless cosmic pearl ignores armor
    if (!ammoDef.ignoresArmor) {
      dmg = Math.floor(dmg * 0.85);
    }

    // Phase 2 Squid rage deflection
    let isDeflected = false;
    if (this.activeEvent.phase === 2 && !immuneSquid && Math.random() < 0.25) {
      isDeflected = true;
      dmg = Math.floor(dmg * 0.6); // 40% damage penalty on deflection
    }

    // Phase 3 Foaming shield
    if (this.activeEvent.phase === 3 && !ammoDef.ignoresArmor) {
      dmg = Math.floor(dmg * 0.8);
    }

    // Apply DoT damage if flame
    const isDoT = ammoDef.id === 'pearl_flame';

    // Deduct HP from boss
    this.activeEvent.currentHp = Math.max(0, this.activeEvent.currentHp - dmg);

    // Check boss phase transition
    const hpRatio = this.activeEvent.currentHp / this.activeEvent.maxHp;
    if (hpRatio <= 0.25) {
      this.activeEvent.phase = 3;
    } else if (hpRatio <= 0.60) {
      this.activeEvent.phase = 2;
    } else {
      this.activeEvent.phase = 1;
    }

    // Record damage log
    if (!this.activeEvent.damageMap.has(sid)) {
      this.activeEvent.damageMap.set(sid, {
        storeId: sid,
        playerName: playerName || `Barista #${sid}`,
        totalDamage: 0,
        pearlsShot: 0,
        critHits: 0
      });
    }
    const pLog = this.activeEvent.damageMap.get(sid);
    pLog.totalDamage += dmg;
    pLog.pearlsShot += 1;
    if (isCrit) pLog.critHits += 1;

    // Check if boss defeated
    let isDefeated = false;
    if (this.activeEvent.currentHp <= 0) {
      this.activeEvent.currentHp = 0;
      this.activeEvent.isDefeated = true;
      isDefeated = true;
      setTimeout(() => this.endBossEvent(true), 800);
    }

    return {
      damage: dmg,
      isCrit,
      isCosmic: ammoDef.id === 'pearl_cosmic' || cosmicAura,
      isFreeze: ammoDef.id === 'pearl_frost',
      isDoT,
      isDeflected,
      currentHp: this.activeEvent.currentHp,
      maxHp: this.activeEvent.maxHp,
      hpPercent: Number(((this.activeEvent.currentHp / this.activeEvent.maxHp) * 100).toFixed(1)),
      phase: this.activeEvent.phase,
      remainingAmmo: pearlInv[pearlType],
      ammoInventory: pearlInv,
      isDefeated
    };
  }

  /**
   * Concludes the Boss Event & distributes rewards to Top 1-5 & participants
   */
  async endBossEvent(bossDefeated = false) {
    if (!this.activeEvent || !this.activeEvent.isActive) return;

    if (this.eventTimer) clearTimeout(this.eventTimer);
    this.eventTimer = null;

    this.activeEvent.isActive = false;
    this.activeEvent.isDefeated = bossDefeated;

    const eventId = this.activeEvent.id;
    const finalHp = this.activeEvent.currentHp;

    // Update boss_events in DB
    try {
      await db.run(
        'UPDATE boss_events SET current_hp = ?, is_defeated = ? WHERE id = ?',
        finalHp, bossDefeated ? 1 : 0, eventId
      );
    } catch (e) {
      console.error('[BossEvent] Failed to update boss_events in DB:', e);
    }

    // Rank players
    const rankedPlayers = Array.from(this.activeEvent.damageMap.values());
    rankedPlayers.sort((a, b) => b.totalDamage - a.totalDamage);

    const distributedRewards = [];

    for (let i = 0; i < rankedPlayers.length; i++) {
      const p = rankedPlayers[i];
      const rank = i + 1;
      let reward = {
        rank,
        storeId: p.storeId,
        playerName: p.playerName,
        totalDamage: p.totalDamage,
        pearlsShot: p.pearlsShot,
        critHits: p.critHits,
        teacoin: 5,
        title: 'Cư Dân Quán Ghiền Boba',
        money: 200000,
        specialItem: 'Hộp Quà Lưu Niệm Quán Cà Phê'
      };

      if (rank === 1) {
        reward.teacoin = 50;
        reward.title = 'Chiến Thần Đập Răm 👑';
        reward.money = 5000000;
        reward.specialItem = 'Skin Xe Đẩy: Cỗ Xe Cà Phê Vũ Trụ Pixel + 10 Thẻ Miễn Phí Thuê NPC';
      } else if (rank === 2) {
        reward.teacoin = 35;
        reward.title = 'Đại Kiện Tướng Trân Châu 🥈';
        reward.money = 3000000;
        reward.specialItem = '5 Thùng Hạt Cà Phê Geisha Hoàng Gia';
      } else if (rank === 3) {
        reward.teacoin = 25;
        reward.title = 'Xạ Thủ Xúc Tu Khét Tiếng 🥉';
        reward.money = 2000000;
        reward.specialItem = '3 Thùng Hạt Cà Phê Cầu Đất';
      } else if (rank === 4) {
        reward.teacoin = 15;
        reward.title = 'Dũng Sĩ Cafe Cà Pháo 🎖️';
        reward.money = 1000000;
        reward.specialItem = '2 Thẻ Giảm 50% Tiền Thuê Mặt Bằng';
      } else if (rank === 5) {
        reward.teacoin = 10;
        reward.title = 'Dũng Sĩ Cafe Cà Pháo 🎖️';
        reward.money = 500000;
        reward.specialItem = '1 Thẻ Giảm 50% Tiền Thuê Mặt Bằng';
      }

      distributedRewards.push(reward);

      // Save to boss_damage_logs
      try {
        await db.run(
          `INSERT INTO boss_damage_logs (event_id, store_id, player_name, total_damage, pearls_shot, crit_hits, rank_position, reward_claimed, updated_at)
           VALUES (?, ?, ?, ?, ?, ?, ?, 1, ?)`,
          eventId, p.storeId, p.playerName, p.totalDamage, p.pearlsShot, p.critHits, rank, new Date().toISOString()
        );
      } catch (err) {
        console.error(`[BossEvent] Failed to insert damage log for store ${p.storeId}:`, err);
      }

      // Credit TeaCoin, Money, and Titles to player save
      try {
        const userSave = await db.get('SELECT money, teacoin, boss_titles, cart_skin FROM game_saves WHERE store_id = ?', p.storeId);
        if (userSave) {
          const newMoney = Number(userSave.money || 0) + reward.money;
          const newTeaCoin = Number(userSave.teacoin || 0) + reward.teacoin;
          let titles = [];
          try { titles = JSON.parse(userSave.boss_titles || '[]'); } catch (e) { titles = []; }
          if (!titles.includes(reward.title)) {
            titles.push(reward.title);
          }
          let cartSkin = userSave.cart_skin || '';
          if (rank === 1) {
            cartSkin = 'cosmic_coffee_cart';
          }
          await db.run(
            'UPDATE game_saves SET money = ?, teacoin = ?, boss_titles = ?, cart_skin = ? WHERE store_id = ?',
            newMoney, newTeaCoin, JSON.stringify(titles), cartSkin, p.storeId
          );
        }
      } catch (err) {
        console.error(`[BossEvent] Failed to credit rewards to store ${p.storeId}:`, err);
      }
    }

    console.log(`[BossEvent] 🏁 Kết thúc đại chiến Boss Hưng Răm! Diệt Boss: ${bossDefeated}. Tổng người tham gia: ${rankedPlayers.length}`);

    // Broadcast conclusion
    if (this.socketGateway) {
      this.socketGateway.broadcastBossEnded({
        bossDefeated,
        finalRanks: distributedRewards.slice(0, 5),
        allRewards: distributedRewards
      });
    }
  }
}

const bossManager = new BossEventManager();

/**
 * Service Methods for Store Operations
 */
const coffeeBossService = {
  getMenu() {
    return {
      coffeeMenu: Object.values(COFFEE_MENU),
      foodMenu: Object.values(FOOD_MENU),
      ammoMenu: Object.values(PEARL_AMMO)
    };
  },

  /**
   * Get store's current coffee & boss state
   */
  async getStoreCoffeeState(storeId) {
    const sid = Number(storeId);
    const save = await db.get(
      'SELECT money, teacoin, active_buffs, coffee_buffs, coffee_daily_cups, coffee_daily_date, boss_pearl_inventory, boss_food_buffs, boss_titles FROM game_saves WHERE store_id = ?',
      sid
    );
    if (!save) throw new Error('Không tìm thấy dữ liệu quán');

    const realDate = anticheat.getRealDate();
    let dailyCups = Number(save.coffee_daily_cups || 0);
    if (save.coffee_daily_date !== realDate) {
      dailyCups = 0;
      await db.run('UPDATE game_saves SET coffee_daily_cups = 0, coffee_daily_date = ? WHERE store_id = ?', realDate, sid);
    }

    let coffeeBuffs = {};
    let bossPearlInventory = { pearl_basic: 50, pearl_flame: 20, pearl_golden: 10, pearl_frost: 5, pearl_cosmic: 1 };
    let bossFoodBuffs = {};
    let bossTitles = [];

    try { coffeeBuffs = JSON.parse(save.coffee_buffs || '{}'); } catch (e) {}
    try { if (save.boss_pearl_inventory) bossPearlInventory = JSON.parse(save.boss_pearl_inventory); } catch (e) {}
    try { bossFoodBuffs = JSON.parse(save.boss_food_buffs || '{}'); } catch (e) {}
    try { bossTitles = JSON.parse(save.boss_titles || '[]'); } catch (e) {}

    // Clean expired food buffs
    const now = Date.now();
    const activeFoods = {};
    for (const [k, v] of Object.entries(bossFoodBuffs)) {
      if (v && v.expiresAt > now) activeFoods[k] = v;
    }

    return {
      dailyCups,
      maxDailyCups: 3,
      coffeeBuffs,
      bossPearlInventory,
      bossFoodBuffs: activeFoods,
      bossTitles,
      money: Number(save.money || 0),
      teacoin: Number(save.teacoin || 0),
      bossState: bossManager.getPublicState()
    };
  },

  /**
   * Drink Coffee & Roll Random Buff
   */
  async drinkCoffee(storeId, coffeeId) {
    const sid = Number(storeId);
    const coffee = COFFEE_MENU[coffeeId];
    if (!coffee) throw new Error('Món cà phê không hợp lệ');

    const save = await db.get(
      'SELECT money, teacoin, active_buffs, coffee_buffs, coffee_daily_cups, coffee_daily_date FROM game_saves WHERE store_id = ?',
      sid
    );
    if (!save) throw new Error('Không tìm thấy quán');

    const realDate = anticheat.getRealDate();
    let dailyCups = Number(save.coffee_daily_cups || 0);
    if (save.coffee_daily_date !== realDate) {
      dailyCups = 0;
    }

    if (dailyCups >= 3) {
      throw new Error('Bạn đã uống tối đa 3 ly cà phê trong ngày hôm nay! Hãy quay lại vào ngày mai nhé ☕');
    }

    let currentMoney = Number(save.money || 0);
    let currentTeaCoin = Number(save.teacoin || 0);

    // Validate payment
    if (coffee.currency === 'teacoin') {
      if (currentTeaCoin < coffee.price) {
        throw new Error(`Bạn cần ${coffee.price} TeaCoin để thưởng thức ly cà phê này!`);
      }
      currentTeaCoin -= coffee.price;
    } else {
      if (currentMoney < coffee.price) {
        throw new Error(`Bạn không đủ tiền mua ly này (Giá: ${coffee.price.toLocaleString()}đ)`);
      }
      currentMoney -= coffee.price;
    }

    dailyCups += 1;

    // Roll Random Buff according to roadmap weights
    const availableBuffs = Object.values(COFFEE_MENU);
    const totalWeight = availableBuffs.reduce((sum, item) => sum + item.weight, 0);
    let randomNum = Math.random() * totalWeight;
    let chosenCoffee = coffee; // default to ordered coffee

    for (const item of availableBuffs) {
      if (randomNum < item.weight) {
        chosenCoffee = item;
        break;
      }
      randomNum -= item.weight;
    }

    const now = Date.now();
    const expiresAt = now + (chosenCoffee.durationMin * 60 * 1000);

    const buffObj = {
      id: chosenCoffee.buffId,
      name: chosenCoffee.buffName,
      desc: chosenCoffee.buffDesc,
      icon: chosenCoffee.icon,
      coffeeName: chosenCoffee.name,
      startedAt: now,
      expiresAt,
      durationMin: chosenCoffee.durationMin
    };

    let activeBuffs = {};
    try { activeBuffs = JSON.parse(save.active_buffs || '{}'); } catch (e) {}
    activeBuffs[chosenCoffee.buffId] = buffObj;

    let coffeeBuffs = {};
    try { coffeeBuffs = JSON.parse(save.coffee_buffs || '{}'); } catch (e) {}
    coffeeBuffs[chosenCoffee.buffId] = buffObj;

    // Save state
    await db.run(
      `UPDATE game_saves 
       SET money = ?, teacoin = ?, active_buffs = ?, coffee_buffs = ?, coffee_daily_cups = ?, coffee_daily_date = ? 
       WHERE store_id = ?`,
      currentMoney, currentTeaCoin, JSON.stringify(activeBuffs), JSON.stringify(coffeeBuffs), dailyCups, realDate, sid
    );

    return {
      success: true,
      message: `Đã uống xong 1 ly ${coffee.name}! Ban tặng ngẫu nhiên Buff: [${chosenCoffee.buffName}]`,
      buff: buffObj,
      dailyCups,
      remainingCups: 3 - dailyCups,
      money: currentMoney,
      teacoin: currentTeaCoin
    };
  },

  /**
   * Buy combat ammunition
   */
  async buyAmmo(storeId, pearlType, packs = 1) {
    const sid = Number(storeId);
    const ammoDef = PEARL_AMMO[pearlType];
    if (!ammoDef) throw new Error('Loại trân châu không hợp lệ');

    const packCount = Math.max(1, Number(packs || 1));
    const totalCost = ammoDef.price * packCount;
    const totalQuantity = ammoDef.quantity * packCount;

    const save = await db.get('SELECT money, teacoin, boss_pearl_inventory FROM game_saves WHERE store_id = ?', sid);
    if (!save) throw new Error('Không tìm thấy quán');

    let currentMoney = Number(save.money || 0);
    let currentTeaCoin = Number(save.teacoin || 0);

    if (ammoDef.currency === 'teacoin') {
      if (currentTeaCoin < totalCost) {
        throw new Error(`Bạn cần ${totalCost} TeaCoin để mua ${totalQuantity} viên ${ammoDef.name}`);
      }
      currentTeaCoin -= totalCost;
    } else {
      if (currentMoney < totalCost) {
        throw new Error(`Bạn cần ${totalCost.toLocaleString()}đ để mua ${totalQuantity} viên ${ammoDef.name}`);
      }
      currentMoney -= totalCost;
    }

    let pearlInv = {};
    try { pearlInv = JSON.parse(save.boss_pearl_inventory || '{}'); } catch (e) {}
    pearlInv[pearlType] = (pearlInv[pearlType] || 0) + totalQuantity;

    await db.run(
      'UPDATE game_saves SET money = ?, teacoin = ?, boss_pearl_inventory = ? WHERE store_id = ?',
      currentMoney, currentTeaCoin, JSON.stringify(pearlInv), sid
    );

    return {
      success: true,
      message: `Đã nạp thành công ${totalQuantity} viên [${ammoDef.name}] vào Kho Đạn!`,
      pearlType,
      added: totalQuantity,
      currentTotal: pearlInv[pearlType],
      pearlInventory: pearlInv,
      money: currentMoney,
      teacoin: currentTeaCoin
    };
  },

  /**
   * Buy combat food buff
   */
  async buyFoodBuff(storeId, foodId) {
    const sid = Number(storeId);
    const food = FOOD_MENU[foodId];
    if (!food) throw new Error('Món ăn tiếp sức không hợp lệ');

    const save = await db.get('SELECT money, teacoin, boss_food_buffs FROM game_saves WHERE store_id = ?', sid);
    if (!save) throw new Error('Không tìm thấy quán');

    let currentMoney = Number(save.money || 0);
    let currentTeaCoin = Number(save.teacoin || 0);

    if (food.currency === 'teacoin') {
      if (currentTeaCoin < food.price) {
        throw new Error(`Bạn cần ${food.price} TeaCoin để mua món ${food.name}!`);
      }
      currentTeaCoin -= food.price;
    } else {
      if (currentMoney < food.price) {
        throw new Error(`Bạn cần ${food.price.toLocaleString()}đ để mua món ${food.name}!`);
      }
      currentMoney -= food.price;
    }

    const now = Date.now();
    const expiresAt = now + (food.durationMin * 60 * 1000);

    let foodBuffs = {};
    try { foodBuffs = JSON.parse(save.boss_food_buffs || '{}'); } catch (e) {}

    foodBuffs[foodId] = {
      id: food.id,
      name: food.name,
      desc: food.desc,
      icon: food.icon,
      atkBonus: food.atkBonus,
      critRate: food.critRate,
      critMult: food.critMult,
      speedBonus: food.speedBonus,
      immuneSquid: food.immuneSquid,
      cosmicAura: food.cosmicAura,
      startedAt: now,
      expiresAt
    };

    await db.run(
      'UPDATE game_saves SET money = ?, teacoin = ?, boss_food_buffs = ? WHERE store_id = ?',
      currentMoney, currentTeaCoin, JSON.stringify(foodBuffs), sid
    );

    return {
      success: true,
      message: `Đã thưởng thức [${food.name}]! ${food.desc}`,
      foodBuff: foodBuffs[foodId],
      bossFoodBuffs: foodBuffs,
      money: currentMoney,
      teacoin: currentTeaCoin
    };
  },

  /**
   * Bé Trà supply (+10 basic pearls)
   */
  async claimBeTraSupply(storeId) {
    const sid = Number(storeId);
    const save = await db.get('SELECT boss_pearl_inventory FROM game_saves WHERE store_id = ?', sid);
    if (!save) throw new Error('Không tìm thấy quán');

    let pearlInv = {};
    try { pearlInv = JSON.parse(save.boss_pearl_inventory || '{}'); } catch (e) {}
    pearlInv.pearl_basic = (pearlInv.pearl_basic || 0) + 10;

    await db.run(
      'UPDATE game_saves SET boss_pearl_inventory = ? WHERE store_id = ?',
      JSON.stringify(pearlInv), sid
    );

    return {
      success: true,
      message: 'Bé Trà tiếp tế +10 Đạn Trân Châu Đen!',
      pearlInventory: pearlInv
    };
  },

  getBossManager() {
    return bossManager;
  }
};

module.exports = coffeeBossService;

