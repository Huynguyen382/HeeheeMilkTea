// High-Fidelity Retro Pixel Art Canvas Scene Renderer for "Quán Trà Sữa Hyhy"
// Modular Orchestrator combining scene renderers & game loop

import { timeMethods } from './canvas/time.js';
import { fxMethods } from './canvas/fx.js';
import { backgroundMethods } from './canvas/background.js';
import { cartMethods } from './canvas/cart.js';
import { primitiveMethods } from './canvas/primitives.js';
import { npcMethods } from './canvas/npc.js';
import { eventMethods } from './canvas/events.js';
import { weatherMethods } from './canvas/weather.js';

class GameCanvas {
  getEffectiveScene() {
    const chap = Number(this.chapter) || 1;
    const validScenes = ['town'];
    if (chap >= 2) validScenes.push('hust');
    if (chap >= 3) {
      validScenes.push('walking_street');
      validScenes.push('moc_chau');
    }
    if (chap >= 4) validScenes.push('franchise');

    if (this.sceneSetting && validScenes.includes(this.sceneSetting)) {
      return this.sceneSetting;
    }

    if (chap >= 4) return 'franchise';
    if (chap >= 3) return 'walking_street';
    if (chap >= 2) return 'hust';
    return 'town';
  }

  setChapter(chapter) {
    const newChap = Number(chapter) || 1;
    const oldChapter = Number(this.chapter) || 1;
    this.chapter = newChap;

    if (!this._chapterInitialized) {
      this._chapterInitialized = true;
      let saved = null;
      try { saved = localStorage.getItem('hyhy_scene_setting'); } catch (e) {}
      if (saved) {
        this.setSceneSetting(saved);
      } else {
        this.sceneSetting = this.getEffectiveScene();
      }
      return;
    }

    if (newChap > oldChapter) {
      // Advance automatically to the new chapter's scene when unlocking a new chapter
      if (newChap >= 4) this.sceneSetting = 'franchise';
      else if (newChap === 3) this.sceneSetting = 'walking_street';
      else if (newChap === 2) this.sceneSetting = 'hust';
      else this.sceneSetting = 'town';
      try { localStorage.setItem('hyhy_scene_setting', this.sceneSetting); } catch (e) {}
    } else {
      let saved = null;
      try { saved = localStorage.getItem('hyhy_scene_setting'); } catch (e) {}
      if (saved) {
        this.setSceneSetting(saved);
      } else {
        this.sceneSetting = this.getEffectiveScene();
      }
    }
  }

  setHasAmulet(hasAmulet, talismanCount) {
    if (typeof hasAmulet === 'number') {
      this.talismanCount = hasAmulet;
      this.hasAmulet = this.talismanCount > 0;
    } else {
      const cnt = (typeof talismanCount === 'number') ? talismanCount : (hasAmulet ? 1 : 0);
      this.talismanCount = cnt;
      this.hasAmulet = cnt > 0;
    }
  }

  setCollabs(collabs) {
    this.activeCollabs = Array.isArray(collabs) ? collabs.slice(0, 3) : [];
  }

  setStoreName(name) {
    if (typeof name === 'string' && name.trim()) {
      this.storeName = name.trim();
    }
  }

  constructor(canvasId) {
    this.canvas = document.getElementById(canvasId);
    this.ctx = this.canvas.getContext('2d');
    
    // Set high-fidelity canvas resolution (2x for super smooth pixel graphics)
    // Extended scene width (720px) to accommodate up to 4 stalls (1 main + 3 collabs)
    this.canvas.width = 1440;
    this.canvas.height = 400;
    this.width = 720;
    this.height = 200;
    
    // Chapter & Setting
    this.chapter = 1;
    this._chapterInitialized = false;
    let initialScene = 'town';
    try {
      const saved = localStorage.getItem('hyhy_scene_setting');
      if (saved) initialScene = saved;
    } catch (e) {}
    this.sceneSetting = initialScene;
    this.hasAmulet = false;
    this.talismanCount = 0;
    this.activeCollabs = [];
    this.storeName = null;
    this.isInvisible = false;
    this.invisibilityRemaining = 0;
    this.lastAmuletClickTime = 0;
    this.slipper = null;

    // In-game time offset (allows fast-forwarding to 7:00 AM on rest end / wake up)
    try {
      const savedOffset = localStorage.getItem('hyhy_time_offset');
      this.inGameTimeOffsetMs = savedOffset ? parseInt(savedOffset, 10) : 0;
    } catch (e) {
      this.inGameTimeOffsetMs = 0;
    }

    // Animation states
    this.tick = 0;
    this.customerX = -40;
    this.targetCustomerX = 185;
    this.customerActive = false;
    this.customerState = 'idle'; // walking, waiting, leaving
    this.customerType = 0; // 0 to 9 archetypes
    this.customerQuote = '';
    this.bubbleType = 'boba'; // 'boba', 'heart', 'angry', 'sweat', 'dialogue'
    this.queue = []; // multi-customer queue: array of customer objects (up to 14)
    this.leavingCustomers = []; // customers walking away after being served
    this.modularNPCCache = new Map(); // Cache for procedural / modular customer sprites
    
    this.currentDrink = null;
    this.isShaking = false;
    this.isDrinking = false;
    this.drinkLevel = 1.0;
    
    // Dynamic Weather system
    this.weather = { id: 'sunny' };
    this.raindrops = [];
    this.rainRipples = [];
    this.windParticles = [];
    this.cloudyMist = [];
    this.dustMotes = [];
    this.lightning = null;
    this.screenFlash = 0;
    this.screenShake = 0;
    if (typeof this.setWeather === 'function') {
      this.setWeather(this.weather);
    }
    
    // Drifting blossom petals / leaves in the wind
    this.petals = [];
    for (let i = 0; i < 18; i++) {
      this.petals.push({
        x: Math.random() * this.width,
        y: Math.random() * 150,
        vx: -(Math.random() * 0.8 + 0.5),
        vy: Math.random() * 0.4 + 0.2,
        size: Math.random() > 0.5 ? 2 : 3,
        color: Math.random() > 0.4 ? '#ff7675' : '#fdcb6e'
      });
    }

    // Distant background traffic
    this.traffic = [
      { x: 30, speed: 0.8, color: '#f1fa8c' },
      { x: 220, speed: 1.1, color: '#50fa7b' },
      { x: 420, speed: 0.9, color: '#ff79c6' },
      { x: 610, speed: 1.2, color: '#8be9fd' }
    ];

    // Chapter 2 HUST traffic on Giải Phóng street (Honda Dream, Wave, student bicycles)
    this.hustTraffic = [
      { x: 45, speed: 1.4, type: 'dream', color: '#800000', riderColor: '#2d3436' },
      { x: 175, speed: 0.85, type: 'bicycle', color: '#0984e3', riderColor: '#ffffff' },
      { x: 295, speed: 1.6, type: 'wave', color: '#27ae60', riderColor: '#e17055' },
      { x: 470, speed: 1.35, type: 'dream', color: '#2c3e50', riderColor: '#ffeaa7' },
      { x: 630, speed: 0.95, type: 'bicycle', color: '#e74c3c', riderColor: '#dfe6e9' }
    ];

    // Motorbike Delivery Shipper System
    this.motorbikeShipper = {
      active: false,
      state: 'idle', // 'idle', 'approaching', 'walking_to_counter', 'waiting_for_drink', 'carrying_drink', 'stowing_drink', 'departing', 'departing_empty'
      x: 390,
      targetX: 230,
      walkX: 230,
      speed: 2.3,
      timer: 0,
      orderId: null,
      totalCount: 0,
      servedCount: 0,
      needsOrderFetch: false,
      hasDrink: false,
      bubble: '🛵 Ship hỏa tốc!'
    };
    this.shipperSpawnTimer = 1800; // ~30 seconds
    this.onShipperArrived = null;

    // Police Patrol System (Đã giảm tần suất xuất hiện)
    this.policePatrol = {
      state: 'idle', // 'idle', 'warning', 'approaching', 'inspecting', 'leaving'
      patrolInterval: 8400, // ~140s between patrols (giảm tần suất gấp 2 lần)
      timer: 4200,
      warningTimer: 0,
      x: 390,
      speed: 1.15,
      bubble: '',
      caughtTimer: 0
    };
    this.onPoliceWarning = null;
    this.onPolicePassed = null;
    this.onPoliceCaught = null;

    // Particle system (floating sparkles, steam, coins)
    this.particles = [];
    this.floatingTexts = [];

    // Pet & Thief System
    this.activePet = null; // 'corgi', 'meo_tam_the', 'capybara'
    this.isPetStolen = false;
    this.thief = null; // Thief sprite object
    this.onPetStolen = null;
    this.onThiefCaught = null;
    
    // Time of Day system ('morning', 'noon', 'afternoon', 'night', or null for auto based on real clock)
    this.customTimeOfDay = null;
    this.clouds = [
      { x: 35, y: 16, w: 46, h: 14, speed: 0.12 },
      { x: 155, y: 30, w: 58, h: 16, speed: 0.09 },
      { x: 275, y: 14, w: 50, h: 15, speed: 0.15 }
    ];

    this.initLoop();
  }

  getUnlockedScenes() {
    const chap = Number(this.chapter) || 1;
    const validScenes = ['town'];
    if (chap >= 2) validScenes.push('hust');
    if (chap >= 3) {
      validScenes.push('walking_street');
      validScenes.push('moc_chau');
    }
    if (chap >= 4) validScenes.push('franchise');
    return validScenes;
  }

  setSceneSetting(setting) {
    const validScenes = this.getUnlockedScenes();
    if (setting && validScenes.includes(setting)) {
      this.sceneSetting = setting;
    } else {
      this.sceneSetting = this.getEffectiveScene();
    }
    try { localStorage.setItem('hyhy_scene_setting', this.sceneSetting); } catch (e) {}
    return this.sceneSetting;
  }

  toggleSceneSetting() {
    const chap = Number(this.chapter) || 1;
    if (chap < 2) {
      this.sceneSetting = 'town';
      return 'town';
    }

    const current = this.getEffectiveScene();
    let next = 'town';

    if (chap === 2) {
      next = (current === 'hust') ? 'town' : 'hust';
    } else if (chap === 3) {
      // Cycle: walking_street -> moc_chau -> hust -> town -> walking_street
      if (current === 'walking_street') next = 'moc_chau';
      else if (current === 'moc_chau') next = 'hust';
      else if (current === 'hust') next = 'town';
      else next = 'walking_street';
    } else if (chap >= 4) {
      // Cycle: franchise -> walking_street -> moc_chau -> hust -> town -> franchise
      if (current === 'franchise') next = 'walking_street';
      else if (current === 'walking_street') next = 'moc_chau';
      else if (current === 'moc_chau') next = 'hust';
      else if (current === 'hust') next = 'town';
      else next = 'franchise';
    }

    this.sceneSetting = next;
    try { localStorage.setItem('hyhy_scene_setting', next); } catch (e) {}
    return next;
  }

  initLoop() {
    const loop = () => {
      try {
        this.update();
        this.render();
      } catch (err) {
        console.error('GameCanvas loop error:', err);
      }
      requestAnimationFrame(loop);
    };
    requestAnimationFrame(loop);
  }

  setCustomerQueue(orders) {
    if (!orders || orders.length === 0) {
      this.customerActive = false;
      this.queue = [];
      return;
    }

    this.customerActive = true;
    const maxCustomers = Math.min(14, orders.length);
    const currentOrders = orders.slice(0, maxCustomers);

    const shipperOrdersInQueue = currentOrders.filter(o => o.isShipper);
    if (shipperOrdersInQueue.length > 0) {
      if (!this.motorbikeShipper.active || this.motorbikeShipper.state === 'departing' || this.motorbikeShipper.state === 'departing_empty') {
        this.spawnMotorbikeShipper(shipperOrdersInQueue[0].orderId, shipperOrdersInQueue.length);
      } else {
        const ms = this.motorbikeShipper;
        if (!ms.orderId) ms.orderId = shipperOrdersInQueue[0].orderId;
        ms.totalCount = Math.max(ms.totalCount || 0, (ms.servedCount || 0) + shipperOrdersInQueue.length);
        ms.needsOrderFetch = false;
      }
    }

    let accumulatedX = 185;
    let shipperSlotOccupied = false;
    this.queue = currentOrders.map((order, idx) => {
      const isShipper = !!order.isShipper;

      const startX = idx === 0 
        ? (this.customerX > 0 && this.customerX < 200 ? this.customerX : -35) 
        : (accumulatedX + 35);

      const type = (typeof order.customerType === 'number') 
        ? order.customerType 
        : this.getArchetypeByName(order.customerName);
        
      // Dynamic spacing: up to 14 customers queueing in 2 depth rows
      let spacing = 36;
      if (currentOrders.length > 8) {
        spacing = 15;
      } else if (currentOrders.length > 4) {
        spacing = 22;
      }
      if (type === 44 || (order.customerName && order.customerName.includes('Gà Bông'))) {
        spacing += 18;
      }

      const currentTargetX = isShipper ? 185 : accumulatedX;
      if (!isShipper) {
        accumulatedX += spacing;
      } else if (!shipperSlotOccupied) {
        shipperSlotOccupied = true;
        accumulatedX += spacing;
      }

      // Even in front row (Y=108), odd in back row (Y=104) for crowded queue
      const targetY = (currentOrders.length > 5 && idx > 0) ? (idx % 2 === 0 ? 108 : 104) : 108;

      return {
        orderId: order.orderId,
        customerType: type,
        name: order.customerName,
        quote: order.quote || 'Cho mình 1 ly trà sữa nha!',
        currentX: startX,
        targetX: currentTargetX,
        targetY: targetY,
        state: 'waiting',
        isDrinking: false,
        drinkLevel: 1.0,
        isShipper: isShipper
      };
    });

    if (this.queue.length > 0) {
      this.customerType = this.queue[0].customerType;
      this.customerQuote = this.queue[0].quote;
      this.customerX = this.queue[0].currentX;
      this.targetCustomerX = 185;
      this.customerState = 'waiting';
      this.bubbleType = 'dialogue';
    }
  }

  setCustomer(active, state = 'waiting', customerName = '', type = null, quote = '') {
    this.customerActive = active;
    this.customerState = state;
    this.isDrinking = false;
    this.drinkLevel = 1.0;
    this.customerName = customerName;
    if (type !== null) this.customerType = type;
    if (quote) this.customerQuote = quote;

    if (active) {
      this.customerX = -35;
      this.targetCustomerX = 185;
      this.bubbleType = 'dialogue';
    }
  }

  advanceQueue() {
    if (this.queue.length > 0) {
      const leavingCust = this.queue.shift();
      if (!leavingCust.isShipper) {
        leavingCust.state = 'leaving';
        this.leavingCustomers.push(leavingCust);
      }

      let visualIdx = 0;
      let shipperCounted = false;
      this.queue.forEach((cust, idx) => {
        if (cust.isShipper) {
          cust.targetX = 185;
          if (!shipperCounted) {
            shipperCounted = true;
            visualIdx++;
          }
        } else {
          cust.targetX = 185 + (visualIdx * 38);
          visualIdx++;
        }
        if (idx === 0) {
          this.customerType = cust.customerType;
          this.customerQuote = cust.quote;
          this.bubbleType = 'dialogue';
        }
      });

      if (this.queue.length === 0) {
        this.customerActive = false;
      }
    }
  }

  spawnMotorbikeShipper(orderId = null, totalCount = 0) {
    if (!this.motorbikeShipper) return;
    const ms = this.motorbikeShipper;
    if (ms.active && ms.state !== 'departing' && ms.state !== 'departing_empty') {
      if (orderId && !ms.orderId) ms.orderId = orderId;
      if (totalCount > 0) {
        ms.totalCount = Math.max(ms.totalCount || 0, (ms.servedCount || 0) + totalCount);
      }
      if (orderId) ms.needsOrderFetch = false;
      return;
    }
    ms.active = true;
    ms.state = 'approaching';
    ms.x = this.width + 25;
    ms.walkX = ms.x;
    const save = window.state?.storeState?.save;
    const buffs = save?.active_buffs || {};
    const coffeeBuffs = save?.coffee_buffs || {};
    const isFast = (buffs.buff_chien_than_toc_do && buffs.buff_chien_than_toc_do.expiresAt > Date.now()) ||
                   (coffeeBuffs.buff_chien_than_toc_do && coffeeBuffs.buff_chien_than_toc_do.expiresAt > Date.now());
    ms.speed = isFast ? 4.6 : 2.3;
    ms.timer = 0;
    ms.orderId = orderId;
    ms.totalCount = totalCount > 0 ? totalCount : (orderId ? 1 : 0);
    ms.servedCount = 0;
    ms.needsOrderFetch = !orderId;
    ms.hasDrink = false;
    ms.bubble = isFast
      ? '⚡ Wave Chiến Hỏa Tốc x2!'
      : (ms.totalCount > 1 ? `🛵 Nhận đơn ${ms.totalCount} ly hỏa tốc!` : '🛵 Có đơn ship hỏa tốc!');
  }

  onShipperOrderServed(orderId = null, remainingShipperOrders = null) {
    if (!this.motorbikeShipper) return;
    const ms = this.motorbikeShipper;
    if (!ms.active) {
      this.spawnMotorbikeShipper(orderId);
    }

    ms.servedCount = (ms.servedCount || 0) + 1;
    const remaining = typeof remainingShipperOrders === 'number'
      ? remainingShipperOrders
      : (this.queue || []).filter(q => q.isShipper && q.orderId !== orderId).length;
    ms.totalCount = Math.max(ms.totalCount || 1, ms.servedCount + remaining);

    if (remaining > 0) {
      // Vẫn còn đơn trong đợt ship: Shipper đứng tại quầy giữ các đơn đã làm xong, chờ nhận đủ hết đơn mới đi giao!
      ms.hasDrink = true;
      if (ms.state !== 'approaching' && ms.state !== 'walking_to_counter') {
        ms.state = 'waiting_for_drink';
        ms.walkX = 185;
      }
      ms.bubble = `📦 Đã nhận ${ms.servedCount}/${ms.totalCount} đơn! Còn ${remaining} đơn nữa!`;
      this.floatingTexts.push({
        text: `📦 ĐÃ GIAO ${ms.servedCount}/${ms.totalCount} ĐƠN!`,
        x: Math.max(150, (ms.walkX || 185) - 14),
        y: 95,
        alpha: 1.0,
        color: '#50fa7b'
      });
      return;
    }

    // Đã giao hết toàn bộ đơn trong đợt ship -> Shipper mang hàng ra xe và bắt đầu đi giao!
    if (ms.state === 'approaching') {
      ms.x = ms.targetX;
      ms.walkX = 185;
    }
    ms.state = 'carrying_drink';
    ms.hasDrink = true;
    ms.bubble = ms.totalCount > 1
      ? `🥤 Đủ ${ms.servedCount}/${ms.totalCount} đơn rồi, đi giao ngay!`
      : '🥤 Đã nhận đồ, đi giao ngay!';
    this.floatingTexts.push({
      text: ms.totalCount > 1 ? `🛵 ĐỦ ${ms.servedCount} ĐƠN! ĐI GIAO!` : '📦 ĐÃ LẤY HÀNG!',
      x: Math.max(150, (ms.walkX || 185) - 14),
      y: 95,
      alpha: 1.0,
      color: '#50fa7b'
    });
  }

  onShipperOrderFailed(orderId = null, remainingShipperOrders = null) {
    if (!this.motorbikeShipper || !this.motorbikeShipper.active) return;
    const ms = this.motorbikeShipper;

    const remaining = typeof remainingShipperOrders === 'number'
      ? remainingShipperOrders
      : (this.queue || []).filter(q => q.isShipper && q.orderId !== orderId).length;

    if (remaining > 0) {
      if (ms.state !== 'approaching' && ms.state !== 'walking_to_counter') {
        ms.state = 'waiting_for_drink';
        ms.walkX = 185;
      }
      ms.bubble = `⏳ Trễ 1 đơn rồi, làm nhanh ${remaining} đơn còn lại nha!`;
      return;
    }

    if (ms.servedCount && ms.servedCount > 0) {
      if (ms.state === 'approaching') {
        ms.x = ms.targetX;
        ms.walkX = 185;
      }
      ms.state = 'carrying_drink';
      ms.hasDrink = true;
      ms.bubble = `🛵 Em mang ${ms.servedCount} đơn đã xong đi giao luôn nhé!`;
    } else {
      ms.state = 'departing_empty';
      ms.hasDrink = false;
      ms.bubble = '❌ Khách đợi lâu quá hủy đơn rồi!';
    }
  }

  update() {
    this.tick++;

    // Drifting petals & leaves animation
    this.petals.forEach(p => {
      p.x += p.vx;
      p.y += p.vy + Math.sin(this.tick * 0.05 + p.x) * 0.3;
      if (p.x < -10) p.x = this.width + 10;
      if (p.y > 150) p.y = -5;
    });

    // Distant traffic
    this.traffic.forEach(t => {
      t.x -= t.speed;
      if (t.x < -30) t.x = this.width + 20;
    });

    // Chapter 2 HUST traffic on Giải Phóng street
    if (this.hustTraffic) {
      this.hustTraffic.forEach(veh => {
        veh.x -= veh.speed;
        if (veh.x < -40) veh.x = this.width + 30;
      });
    }

    // Drifting clouds for daytime
    this.clouds.forEach(c => {
      c.x += c.speed;
      if (c.x > this.width + 45) c.x = -65;
    });

    // Customer walk movement: queue & active
    if (this.queue && this.queue.length > 0) {
      this.queue.forEach((qCust, idx) => {
        if (qCust.state === 'waiting') {
          if (qCust.currentX < qCust.targetX) {
            qCust.currentX = Math.min(qCust.targetX, qCust.currentX + (idx === 0 ? 2.4 : 1.8));
          } else if (qCust.currentX > qCust.targetX) {
            qCust.currentX = Math.max(qCust.targetX, qCust.currentX - 2.0);
          }
        }
      });
      this.customerX = this.queue[0].currentX;
      this.customerType = this.queue[0].customerType;
      this.customerQuote = this.queue[0].quote;
    } else if (this.customerActive) {
      if (this.customerState === 'waiting' && this.customerX < this.targetCustomerX) {
        this.customerX += 2.2;
      } else if (this.customerState === 'leaving') {
        this.customerX += 2.8;
        if (this.customerX > this.width + 45) {
          this.customerActive = false;
        }
      }
    }

    // Update leaving customers walking away
    for (let i = this.leavingCustomers.length - 1; i >= 0; i--) {
      const lc = this.leavingCustomers[i];
      lc.currentX += 3.0;
      if (lc.currentX > this.width + 50) {
        this.leavingCustomers.splice(i, 1);
      }
    }

    // Sip drinking animation
    if (this.isDrinking && this.drinkLevel > 0.2) {
      this.drinkLevel -= 0.02;
    }

    // Update Honeycomb Slipper Projectile flight
    if (this.slipper) {
      const sl = this.slipper;
      sl.progress += 0.085;
      sl.rot += 0.45;
      const p = Math.min(1.0, sl.progress);
      sl.x = sl.startX + (sl.targetX - sl.startX) * p;
      const arcY = Math.sin(p * Math.PI) * 26;
      sl.y = sl.startY + (sl.targetY - sl.startY) * p - arcY;
      if (p >= 1.0) {
        // Hit impact: burst rubber sparkles
        for (let i = 0; i < 10; i++) {
          this.particles.push({
            x: sl.targetX + (Math.random() * 8 - 4),
            y: sl.targetY + (Math.random() * 8 - 4),
            vx: (Math.random() - 0.5) * 4,
            vy: (Math.random() - 0.5) * 4,
            life: 25,
            maxLife: 25,
            color: '#f7f1e3',
            size: 2
          });
        }
        this.slipper = null;
      }
    }

    // Invisibility Amulet Timer & 1AM auto-invalidation
    if (this.isInvisible) {
      const nightStatus = this.getNightPatrolStatus();
      if (nightStatus.isAmuletInvalid) {
        this.isInvisible = false;
        this.invisibilityRemaining = 0;
        this.floatingTexts.push({
          text: '💀 ĐÃ QUÁ 1H SÁNG! BÙA ẨN THÂN MẤT LINH NGHIỆM!',
          x: 40,
          y: 75,
          alpha: 1.0,
          color: '#ff5555'
        });
      } else {
        this.invisibilityRemaining--;
        if (this.invisibilityRemaining <= 0) {
          this.isInvisible = false;
          this.floatingTexts.push({
            text: '👁️ HẾT THỜI GIAN TÀNG HÌNH!',
            x: 55,
            y: 80,
            alpha: 1.0,
            color: '#ffeaa7'
          });
        }
      }
    }

    // Update Motorbike Delivery Shipper AI
    if (this.motorbikeShipper) {
      const ms = this.motorbikeShipper;
      if (!ms.active) {
        this.shipperSpawnTimer--;
        if (this.shipperSpawnTimer <= 0) {
          this.shipperSpawnTimer = 2200 + Math.random() * 2200; // Spawns every 35-75s
          this.spawnMotorbikeShipper();
        }
      } else {
        const save = window.state?.storeState?.save;
        const buffs = save?.active_buffs || {};
        const coffeeBuffs = save?.coffee_buffs || {};
        const isFast = (buffs.buff_chien_than_toc_do && buffs.buff_chien_than_toc_do.expiresAt > Date.now()) ||
                       (coffeeBuffs.buff_chien_than_toc_do && coffeeBuffs.buff_chien_than_toc_do.expiresAt > Date.now());
        const walkSpeed = isFast ? 2.2 : 1.1;

        if (ms.state === 'approaching') {
          ms.x -= ms.speed;
          if (ms.x <= ms.targetX) {
            ms.x = ms.targetX;
            ms.walkX = ms.x;
            ms.state = 'walking_to_counter';
            ms.bubble = '📦 Lấy đơn giao hàng nhé!';
          }
        } else if (ms.state === 'walking_to_counter') {
          ms.walkX -= walkSpeed;
          if (ms.walkX <= 185) {
            ms.walkX = 185;
            ms.state = 'waiting_for_drink';
            const existingShipperOrders = (this.queue || []).filter(q => q.isShipper);
            if (existingShipperOrders.length > 0 && !ms.needsOrderFetch) {
              ms.totalCount = Math.max(ms.totalCount || 0, (ms.servedCount || 0) + existingShipperOrders.length);
              ms.bubble = ms.totalCount > 1
                ? `🛵 Anh Lâm: Đơn app ${ms.totalCount} ly hỏa tốc nha quán!`
                : (isFast ? '⚡ Ship hỏa tốc x2 đây!' : '📦 Cho em lấy đơn ship hỏa tốc!');
            } else if (typeof this.onShipperArrived === 'function') {
              ms.needsOrderFetch = false;
              ms.bubble = isFast ? '⚡ Ship hỏa tốc x2 đây!' : '📦 Cho em lấy đơn ship hỏa tốc!';
              Promise.resolve(this.onShipperArrived()).then(firstOrder => {
                const hasShipperInQueue = (this.queue || []).some(q => q.isShipper);
                if (!firstOrder && !hasShipperInQueue && ms.active && ms.state === 'waiting_for_drink') {
                  ms.state = 'departing_empty';
                  ms.bubble = '🛵 Quán đang đông quá, em nhận cuốc khác nhé!';
                }
              });
            }
          }
        } else if (ms.state === 'waiting_for_drink') {
          // Stands patiently at the counter waiting for all drinks in the batch to be prepared & served
          if (this.tick % 240 === 0) {
            const total = ms.totalCount || 1;
            const served = ms.servedCount || 0;
            const remaining = Math.max(0, total - served);
            if (total > 1 && served > 0 && remaining > 0) {
              const multiQuotes = [
                `📦 Đã nhận ${served}/${total} đơn, đợi ${remaining} đơn nữa em đi giao!`,
                `🛵 Đủ ${total} đơn là em phóng xe đi giao hàng liền nha!`,
                `☕ Còn ${remaining} ly nữa là hoàn tất đơn ship tổng!`
              ];
              ms.bubble = multiQuotes[Math.floor(Math.random() * multiQuotes.length)];
            } else {
              const waitQuotes = [
                '☕ Quán làm nhanh nha, khách app giục quá!',
                '📦 Đang đợi quán làm đủ đơn để đi giao...',
                '🛵 Đơn hỏa tốc ráng làm chuẩn vị giùm em nha!',
                '✨ Trà thơm quá, xong đủ đơn em phóng vèo đi giao!'
              ];
              ms.bubble = waitQuotes[Math.floor(Math.random() * waitQuotes.length)];
            }
          }
        } else if (ms.state === 'carrying_drink') {
          // Walking back from counter (185) to parked motorbike (ms.x) holding drink
          ms.walkX += (isFast ? 2.4 : 1.2);
          if (ms.walkX >= ms.x) {
            ms.walkX = ms.x;
            ms.state = 'stowing_drink';
            ms.timer = isFast ? 22 : 45; // Faster stowing if fast!
            ms.bubble = ms.servedCount > 1
              ? `📦 Cất ${ms.servedCount} đơn vào thùng giữ nhiệt!`
              : '📦 Cất vào thùng giữ nhiệt!';
            for (let i = 0; i < 6; i++) {
              this.particles.push({
                x: ms.x - 5 + (Math.random() * 8 - 4),
                y: 125 + (Math.random() * 6 - 3),
                vx: (Math.random() - 0.5) * 2,
                vy: -Math.random() * 1.5,
                life: 20,
                maxLife: 20,
                color: '#2ecc71',
                size: 2
              });
            }
          }
        } else if (ms.state === 'stowing_drink') {
          ms.timer--;
          if (ms.timer <= 0) {
            ms.hasDrink = false;
            ms.state = 'departing';
            ms.bubble = ms.servedCount > 1
              ? `💨 Đủ ${ms.servedCount} đơn, em đi giao hàng đây!`
              : '💨 Chúc quán đắt hàng, em đi giao đây!';
          }
        } else if (ms.state === 'departing_empty') {
          // Walking back without drink after cancellation/timeout
          ms.walkX += 1.2;
          if (ms.walkX >= ms.x) {
            ms.walkX = ms.x;
            ms.state = 'departing';
            ms.bubble = '💨 Tiếc quá, em chạy cuốc khác vậy!';
          }
        } else if (ms.state === 'departing') {
          ms.x -= ms.speed * 1.6;
          // Exhaust dust particles
          if (this.tick % 4 === 0) {
            this.particles.push({
              x: ms.x + 20,
              y: 138,
              vx: 0.8 + Math.random() * 0.5,
              vy: -0.3 - Math.random() * 0.4,
              life: 14,
              maxLife: 14,
              color: '#bdc3c7',
              size: 2
            });
          }
          if (ms.x < -60) {
            ms.active = false;
            ms.state = 'idle';
            ms.orderId = null;
            ms.totalCount = 0;
            ms.servedCount = 0;
            ms.needsOrderFetch = false;
            ms.hasDrink = false;
            this.shipperSpawnTimer = 2200 + Math.random() * 2200;
          }
        }
      }
    }

    // Update Police Patrol System
    if (this.policePatrol) {
      const p = this.policePatrol;
      const nightStatus = this.getNightPatrolStatus();

      if (p.state === 'idle') {
        p.timer--;
        if (p.timer <= 0) {
          let shouldSpawn = false;
          if (nightStatus.isOvertime) {
            // Overtime probability: 25% at 22:30, +5%/h up to 50% (đã giảm đáng kể)
            const roll = Math.random() * 100;
            if (roll < nightStatus.probability) {
              shouldSpawn = true;
            } else {
              p.timer = 2400; // Roll lại sau ~40s
            }
          } else {
            // Daytime sidewalk inspection: Giảm còn 10% tỉ lệ xuất hiện ban ngày
            shouldSpawn = (Math.random() * 100 < 10);
            if (!shouldSpawn) p.timer = 4800; // Nghỉ ~80s
          }

          if (shouldSpawn) {
            p.state = 'warning';
            p.warningTimer = 900; // 15 seconds warning before officer arrives
            p.isFinedRoll = (Math.random() < 0.10); // 10% tỉ lệ phạt tiền, 90% chỉ nhắc nhở
            if (this.onPoliceWarning) {
              this.onPoliceWarning(15, nightStatus.isOvertime ? nightStatus.probability : 10);
            }
            this.floatingTexts.push({
              text: '🚨 CÔNG AN ĐI TUẦN! DÙNG BÙA ẨN THÂN! 🚨',
              x: 25,
              y: 65,
              alpha: 1.0,
              color: '#ff5555'
            });
          }
        }
      } else if (p.state === 'warning') {
        p.warningTimer--;
        if (p.warningTimer % 60 === 0 && this.onPoliceWarning) {
          this.onPoliceWarning(Math.ceil(p.warningTimer / 60), nightStatus.isOvertime ? nightStatus.probability : 10);
        }
        if (p.warningTimer <= 0) {
          p.state = 'approaching';
          p.x = this.width + 20;
          p.bubble = '👮 Trật tự đô thị đây!';
        }
      } else if (p.state === 'approaching') {
        p.x -= p.speed;
        if (p.x <= 180) {
          p.state = 'inspecting';
          p.timer = 180; // 3 seconds inspecting
        }
      } else if (p.state === 'inspecting') {
        p.timer--;
        const isCaught = (!this.isInvisible || nightStatus.isAmuletInvalid);
        if (p.isFinedRoll === undefined) {
          p.isFinedRoll = (Math.random() < 0.10);
        }

        p.bubble = isCaught 
          ? (p.isFinedRoll
              ? (nightStatus.isAmuletInvalid ? '👮 BÙA VÔ HIỆU! PHẠT TIỀN 500K!' : '👮 [10% PHẠT] LẬP BIÊN BẢN 500K!')
              : '👮 NHẮC NHỞ: Thu dọn xe đẩy, không lấn chiếm vỉa hè nhé!')
          : '❓ Ủa? Quán đâu mất rồi? Gió thổi hiu hiu...';

        if (p.timer <= 0) {
          if (isCaught) {
            if (p.isFinedRoll) {
              // 10% Tỉ lệ phạt tiền thật sự
              if (this.onPoliceCaught) {
                this.onPoliceCaught(500000, nightStatus.isAmuletInvalid, true);
              }
              this.floatingTexts.push({
                text: '-500.000đ PHẠT TRẬT TỰ! 💸',
                x: 70,
                y: 70,
                alpha: 1.0,
                color: '#ff4757'
              });
            } else {
              // 90% Nhắc nhở - Không phạt tiền!
              if (this.onPoliceCaught) {
                this.onPoliceCaught(0, nightStatus.isAmuletInvalid, false);
              }
              this.floatingTexts.push({
                text: '⚠️ CÔNG AN NHẮC NHỞ (KHÔNG PHẠT) 📋',
                x: 25,
                y: 70,
                alpha: 1.0,
                color: '#f1fa8c'
              });
            }
          } else {
            if (this.onPolicePassed) {
              this.onPolicePassed();
            }
            this.floatingTexts.push({
              text: '✨ ĐÃ QUA MẶT CÔNG AN AN TOÀN! ✨',
              x: 60,
              y: 70,
              alpha: 1.0,
              color: '#2ed573'
            });
          }
          p.state = 'leaving';
          p.bubble = isCaught 
            ? (p.isFinedRoll ? '👮 Về phường xử lý nộp phạt!' : '🚶 Nhớ thu dọn nghe chưa!')
            : '🚶 Đi kiểm tra phố khác...';
          p.isFinedRoll = undefined;
        }
      } else if (p.state === 'leaving') {
        p.x -= p.speed * 1.35;
        if (p.x < -60) {
          p.state = 'idle';
          p.timer = nightStatus.isOvertime ? 1800 : 3600;
          p.bubble = '';
        }
      }
    }

    // Update Thief Movement & Theft AI
    if (this.thief) {
      const t = this.thief;
      t.tick = (t.tick || 0) + 1;

      if (t.state === 'pacing_left') {
        t.x -= t.runSpeed;
        if (t.x <= 130) {
          t.state = 'glancing';
          t.glanceTimer = 65; // Glance around for ~1 second
          t.bubble = '👀 ...';
        }
      } else if (t.state === 'glancing') {
        t.glanceTimer--;
        if (t.glanceTimer <= 0) {
          t.passCount = (t.passCount || 0) + 1;
          if (t.passCount >= t.maxPasses) {
            // Decide to sneak in and snatch the pet!
            t.state = 'approaching_pet';
            t.runSpeed = 1.1;
            t.bubble = '💭 🐕🎯';
          } else {
            // Turn back and pace right
            t.state = 'pacing_right';
            t.bubble = '👣 ...';
          }
        }
      } else if (t.state === 'pacing_right') {
        t.x += t.runSpeed;
        if (t.x >= 280) {
          t.state = 'pacing_left';
          t.bubble = '👀 Rình...';
        }
      } else if (t.state === 'approaching_pet') {
        t.x -= t.runSpeed;
        if (t.x <= 36) {
          // Snatched!
          t.state = 'snatching';
          this.isPetStolen = true;
          t.bubble = '😈 CÂU ĐƯỢC RỒI!';
          if (this.onPetStolen) this.onPetStolen();
          setTimeout(() => {
            if (this.thief) {
              this.thief.state = 'escaping';
              this.thief.runSpeed = 4.2;
              this.thief.bubble = '🏃💨 CHUỒN!';
            }
          }, 350);
        }
      } else if (t.state === 'escaping') {
        t.x += t.runSpeed;
        if (t.x > this.width + 50) {
          this.thief = null;
        }
      }
    }

    // Update Particles
    for (let i = this.particles.length - 1; i >= 0; i--) {
      const p = this.particles[i];
      p.x += p.vx;
      p.y += p.vy;
      p.life--;
      if (p.life <= 0) {
        this.particles.splice(i, 1);
      }
    }

    // Update Floating texts
    for (let i = this.floatingTexts.length - 1; i >= 0; i--) {
      const ft = this.floatingTexts[i];
      ft.y -= 0.8;
      ft.alpha -= 0.02;
      if (ft.alpha <= 0) {
        this.floatingTexts.splice(i, 1);
      }
    }

    // Update Dynamic Weather system (rain, storm, lightning, puddle ripples)
    if (typeof this.updateWeather === 'function') {
      this.updateWeather();
    }
  }

  render() {
    const ctx = this.ctx;
    ctx.save();
    if (this.screenShake > 0) {
      const shakeX = (Math.random() - 0.5) * 4;
      const shakeY = (Math.random() - 0.5) * 4;
      ctx.translate(shakeX, shakeY);
    }
    ctx.scale(2, 2);
    ctx.imageSmoothingEnabled = false;

    // 1. SKY & DISTANT STREET BACKGROUND WITH NEON SIGNS (HUST PARABOL or CHAPTER 1 PHỐ NHỎ)
    this.drawBackground(ctx);

    // 2. STREET LAMP WITH RADIANT CONE OF LIGHT
    this.drawStreetLamp(ctx);

    // 3. CART STALL & BARISTA HYHY (With Invisibility Cloaking effect if activated)
    if (this.isInvisible) {
      ctx.save();
      ctx.globalAlpha = 0.22;
    }

    // 3a. CART BACK WALL & ARTISAN SHELVES (Behind Hyhy)
    this.drawCartBack(ctx);

    // 3b. HYHY BARISTA SPRITE (Full body: legs, skirt, apron, head, beret standing inside stall)
    this.drawHyhy(ctx);

    // 3b-2. ACTIVE HIRED NPC STAFF SPRITE (Standing behind stall counter next to Hyhy)
    if (this.activeStaff && typeof this.drawActiveStaff === 'function') {
      this.drawActiveStaff(ctx);
    }

    // 3c. MILK TEA CART FRONT COUNTER & EQUIPMENT (In front of Hyhy's body)
    this.drawCartFront(ctx);
    
    // 3d. HYHY FOREARMS & SHAKER (Resting/active on top of the counter)
    this.drawHyhyForearms(ctx);

    // 3d-2. ACTIVE HIRED NPC STAFF FOREARMS, COUNTER CUP/SHAKER & NAMEPLATE
    if (this.activeStaff && typeof this.drawActiveStaffForearms === 'function') {
      this.drawActiveStaffForearms(ctx);
    }

    // 3e. STORE PET (Corgi, Mèo Thần Tài, Capybara)
    this.drawStorePet(ctx);

    if (this.isInvisible) {
      ctx.restore();
      // Shimmering mystic aura surrounding cloaked stall
      this.drawInvisibilityAura(ctx);
    }

    // 3f. PARTNER COLLAB CARTS (Up to 3 active collab stalls) OR PLACEHOLDERS
    this.drawCollabStalls(ctx);

    // 4. INVISIBILITY AMULET (Bùa Ẩn Thân treo ở cột quầy hàng)
    this.drawInvisibilityAmulet(ctx);

    // 5. MOTORBIKE SHIPPER (Shipper xe máy nhận đồ & đi giao)
    this.drawMotorbikeShipper(ctx);

    // 6. CUSTOMER SPRITES & QUEUE (Dual depth support up to 14 customers)
    if (this.queue && this.queue.length > 0) {
      for (let i = this.queue.length - 1; i >= 0; i--) {
        const qCust = this.queue[i];
        if (qCust.isShipper) continue; // Skip pedestrian sprite since Motorbike Shipper is rendered by drawMotorbikeShipper
        this.drawCustomer(ctx, qCust.currentX, qCust.targetY || 108, qCust.customerType, i === 0, qCust.quote, qCust.name);
      }
    } else if (this.customerActive) {
      this.drawCustomer(ctx, this.customerX, 108, this.customerType, true, this.customerQuote, this.customerName);
    }

    this.leavingCustomers.forEach(lc => {
      this.drawCustomer(ctx, lc.currentX, 108, lc.customerType, false, '', lc.name);
    });

    // 7. POLICE PATROL OFFICER (Cảnh sát trật tự tuần tra)
    this.drawPolicePatrol(ctx);

    // 8. THIEF SPRITE & HONEYCOMB SLIPPER PROJECTILE
    this.drawThief(ctx);
    this.drawSlipper(ctx);

    // 9. PARTICLES & FLOATING NUMBERS
    this.drawParticles(ctx);
    const tod = this.getTimeOfDay();
    const weatherId = (this.weather && this.weather.id) || 'sunny';
    const isStorm = weatherId === 'stormy';
    const isRain = weatherId === 'rainy';
    const isCloudy = weatherId === 'cloudy';
    const isWindy = weatherId === 'windy';

    // Determine atmospheric ambient tone depending on time of day AND active weather
    let ambientMultiply = null;
    if (isStorm) {
      ambientMultiply = tod === 'night' ? '#686688' : (tod === 'afternoon' ? '#7d7596' : '#8a86a8');
    } else if (isRain) {
      ambientMultiply = tod === 'night' ? '#707890' : (tod === 'afternoon' ? '#98a2b2' : '#a8b8c8');
    } else if (isCloudy) {
      ambientMultiply = tod === 'night' ? '#707090' : (tod === 'afternoon' ? '#c8b8a8' : '#d8e0e8');
    } else if (tod === 'night') {
      ambientMultiply = '#707090';
    } else if (tod === 'afternoon') {
      ambientMultiply = '#d2b48c';
    }

    if (ambientMultiply) {
      ctx.globalCompositeOperation = 'multiply';
      ctx.fillStyle = ambientMultiply; 
      ctx.fillRect(0, 0, this.width, this.height);
      ctx.globalCompositeOperation = 'source-over';
    }

    // Street Lamp illumination / glow passes
    const shouldLightLamps = tod === 'night' || tod === 'afternoon' || isStorm || isRain;
    if (shouldLightLamps) {
      ctx.globalCompositeOperation = 'screen';
      const curScene = (typeof this.getEffectiveScene === 'function') ? this.getEffectiveScene() : (this.sceneSetting || 'town');
      const lampLxs = (curScene === 'walking_street') 
        ? [95] 
        : (curScene === 'franchise') 
          ? [120, 480, 680] 
          : (curScene === 'town')
            ? [188, 528, 705]
            : []; // HUST & moc_chau have their own specialized ambient & illuminated elements
      lampLxs.forEach(lx => {
        const ly = 55;
        const radGrad = ctx.createRadialGradient(lx - 9, ly + 60, 10, lx - 9, ly + 90, 120);
        const lampAlpha = tod === 'night' ? 0.45 : (isStorm ? 0.38 : (isRain ? 0.28 : 0.2));
        radGrad.addColorStop(0, `rgba(255, 230, 120, ${lampAlpha})`);
        radGrad.addColorStop(1, 'rgba(0, 0, 0, 0)');
        ctx.fillStyle = radGrad;
        ctx.fillRect(0, 0, this.width, this.height);
      });
      ctx.globalCompositeOperation = 'source-over';
    }

    // 10. DYNAMIC WEATHER EFFECTS (Rain, Storms, Wet Pavement Reflections, Lightning & Screen Flash)
    if (typeof this.drawWeatherEffects === 'function') {
      this.drawWeatherEffects(ctx);
    }

    ctx.restore();
  }
}

// Extend GameCanvas prototype with domain submodule methods
Object.assign(
  GameCanvas.prototype,
  timeMethods,
  fxMethods,
  backgroundMethods,
  cartMethods,
  primitiveMethods,
  npcMethods,
  eventMethods,
  weatherMethods
);

// Global window export for browser compatibility
if (typeof window !== 'undefined') {
  window.GameCanvas = GameCanvas;
}

export { GameCanvas };
export default GameCanvas;
