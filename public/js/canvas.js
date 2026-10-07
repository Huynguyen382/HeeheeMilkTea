// High-Fidelity Retro Pixel Art Canvas Scene Renderer for "Quán Trà Sữa Hyhy"
// Modular Orchestrator combining scene renderers & game loop

import { timeMethods } from './canvas/time.js';
import { fxMethods } from './canvas/fx.js';
import { backgroundMethods } from './canvas/background.js';
import { cartMethods } from './canvas/cart.js';
import { primitiveMethods } from './canvas/primitives.js';
import { npcMethods } from './canvas/npc.js';
import { eventMethods } from './canvas/events.js';

class GameCanvas {
  setChapter(chapter) {
    this.chapter = chapter || 1;
    if (this.chapter < 2) {
      this.sceneSetting = 'town';
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
    this.sceneSetting = 'town'; // 'town' (Phố Nhỏ Ch.1) or 'hust' (Cổng Bách Khoa Ch.2)
    this.hasAmulet = false;
    this.talismanCount = 0;
    this.activeCollabs = [];
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
      state: 'idle', // 'idle', 'approaching', 'parked', 'departing'
      x: 390,
      targetX: 235,
      walkX: 235,
      speed: 2.3,
      timer: 0,
      orderId: null,
      bubble: '🛵 Ship hỏa tốc!'
    };
    this.shipperSpawnTimer = 1800; // ~30 seconds

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

  setSceneSetting(setting) {
    if (this.chapter < 2) {
      this.sceneSetting = 'town';
      return;
    }
    this.sceneSetting = setting || 'town';
  }

  toggleSceneSetting() {
    if (this.chapter < 2) {
      this.sceneSetting = 'town';
      return 'town';
    }
    this.sceneSetting = (this.sceneSetting === 'hust') ? 'town' : 'hust';
    return this.sceneSetting;
  }

  initLoop() {
    const loop = () => {
      this.update();
      this.render();
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

    let accumulatedX = 185;
    this.queue = currentOrders.map((order, idx) => {
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

      const currentTargetX = accumulatedX;
      accumulatedX += spacing;

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
        drinkLevel: 1.0
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
      leavingCust.state = 'leaving';
      this.leavingCustomers.push(leavingCust);

      this.queue.forEach((cust, idx) => {
        cust.targetX = 185 + (idx * 38);
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
          ms.active = true;
          ms.state = 'approaching';
          ms.x = this.width + 25;
          ms.targetX = 230;
          ms.bubble = '🛵 Có đơn ship hỏa tốc!';
          ms.timer = 0;
        }
      } else {
        if (ms.state === 'approaching') {
          ms.x -= ms.speed;
          if (ms.x <= ms.targetX) {
            ms.state = 'parked';
            ms.walkX = ms.x;
            ms.timer = 360; // ~6s to park, walk over & grab drink
            ms.bubble = '📦 Lấy đơn mang về nhé!';
          }
        } else if (ms.state === 'parked') {
          ms.timer--;
          if (ms.timer > 180) {
            if (ms.walkX > 185) ms.walkX -= 1.1;
            if (ms.timer === 260) ms.bubble = '🥤 Đã nhận đồ, đi giao ngay!';
          } else {
            if (ms.walkX < ms.x) ms.walkX += 1.1;
          }
          if (ms.timer <= 0) {
            ms.state = 'departing';
            ms.bubble = '💨 Chúc quán đắt hàng!';
          }
        } else if (ms.state === 'departing') {
          ms.x -= ms.speed * 1.5;
          if (ms.x < -60) {
            ms.active = false;
            ms.state = 'idle';
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
  }

  render() {
    const ctx = this.ctx;
    ctx.save();
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

    // 3c. MILK TEA CART FRONT COUNTER & EQUIPMENT (In front of Hyhy's body)
    this.drawCartFront(ctx);
    
    // 3d. HYHY FOREARMS & SHAKER (Resting/active on top of the counter)
    this.drawHyhyForearms(ctx);

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
    if (tod === 'night' || tod === 'afternoon') {
      ctx.globalCompositeOperation = 'multiply';
      ctx.fillStyle = tod === 'night' ? '#707090' : '#d2b48c'; 
      ctx.fillRect(0, 0, this.width, this.height);
      ctx.globalCompositeOperation = 'source-over';
      
      ctx.globalCompositeOperation = 'screen';
      [188, 528, 705].forEach(lx => {
        const ly = 55;
        const radGrad = ctx.createRadialGradient(lx - 9, ly + 60, 10, lx - 9, ly + 90, 120);
        radGrad.addColorStop(0, tod === 'night' ? 'rgba(255, 230, 120, 0.4)' : 'rgba(255, 200, 100, 0.2)');
        radGrad.addColorStop(1, 'rgba(0, 0, 0, 0)');
        ctx.fillStyle = radGrad;
        ctx.fillRect(0, 0, this.width, this.height);
      });
      ctx.globalCompositeOperation = 'source-over';
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
  eventMethods
);

// Global window export for browser compatibility
if (typeof window !== 'undefined') {
  window.GameCanvas = GameCanvas;
}

export { GameCanvas };
export default GameCanvas;
