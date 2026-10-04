// High-Fidelity Retro Pixel Art Canvas Scene Renderer for "Quán Trà Sữa Hyhy"
class GameCanvas {
  constructor(canvasId) {
    this.canvas = document.getElementById(canvasId);
    this.ctx = this.canvas.getContext('2d');
    
    // Set high-fidelity canvas resolution (2x for super smooth curved graphics)
    this.canvas.width = 720;
    this.canvas.height = 400;
    this.width = 360;
    this.height = 200;
    
    // Animation states
    this.tick = 0;
    this.customerX = -40;
    this.targetCustomerX = 185;
    this.customerActive = false;
    this.customerState = 'idle'; // walking, waiting, leaving
    this.customerType = 0; // 0 to 9 archetypes
    this.customerQuote = '';
    this.bubbleType = 'boba'; // 'boba', 'heart', 'angry', 'sweat', 'dialogue'
    this.queue = []; // multi-customer queue: array of customer objects
    this.leavingCustomers = []; // customers walking away after being served
    
    this.currentDrink = null;
    this.isShaking = false;
    this.isDrinking = false;
    this.drinkLevel = 1.0;
    
    // Drifting blossom petals / leaves in the wind
    this.petals = [];
    for (let i = 0; i < 16; i++) {
      this.petals.push({
        x: Math.random() * this.width,
        y: Math.random() * 150,
        vx: -(Math.random() * 0.8 + 0.5),
        vy: Math.random() * 0.4 + 0.2,
        size: Math.random() > 0.5 ? 2 : 3,
        color: Math.random() > 0.4 ? '#ffb8b8' : '#ffeaa7'
      });
    }

    // Distant background traffic
    this.traffic = [
      { x: 30, speed: 0.8, color: '#f1fa8c' },
      { x: 220, speed: 1.1, color: '#50fa7b' }
    ];

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
    this.queue = orders.map((order, idx) => {
      const startX = idx === 0 
        ? (this.customerX > 0 && this.customerX < 200 ? this.customerX : -35) 
        : (200 + idx * 40);

      const type = (typeof order.customerType === 'number') 
        ? order.customerType 
        : this.getArchetypeByName(order.customerName);

      return {
        orderId: order.orderId,
        customerType: type,
        name: order.customerName,
        quote: order.quote || 'Cho mình 1 ly trà sữa nha!',
        currentX: startX,
        targetX: 185 + (idx * 38),
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

  getArchetypeByName(name) {
    if (!name) return 0;
    if (name.includes('Lan') || name.includes('sinh')) return 0;
    if (name.includes('Nam') || name.includes('phòng')) return 1;
    if (name.includes('Ba') || name.includes('xóm')) return 2;
    if (name.includes('Tú') || name.includes('Review')) return 3;
    if (name.includes('Ship')) return 4;
    if (name.includes('Cụ') || name.includes('Trưởng Phố') || name.includes('Đồ')) return 5;
    if (name.includes('Gymer') || name.includes('Quân')) return 6;
    if (name.includes('Đôi') || name.includes('Gà Bông') || name.includes('Duy')) return 7;
    if (name.includes('David') || name.includes('Tây')) return 8;
    if (name.includes('Vé Số') || name.includes('Hạnh')) return 9;
    return Math.floor(Math.random() * 10);
  }

  setCustomer(active, state = 'waiting', customerName = '', type = null, quote = '') {
    this.customerActive = active;
    this.customerState = state;
    this.isDrinking = false;
    this.drinkLevel = 1.0;

    if (active) {
      this.customerX = -35;
      this.bubbleType = 'dialogue';
      this.customerType = (type !== null) ? type : this.getArchetypeByName(customerName);
      this.customerQuote = quote || 'Cho một ly trà sữa thơm ngon béo ngậy nha!';
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

  triggerSuccessEffects(payout) {
    this.bubbleType = 'heart';
    this.isDrinking = true;
    
    // Play straw puncture and slurp audio!
    if (window.sound) {
      window.sound.strawPop();
      setTimeout(() => window.sound.slurp(), 250);
    }

    const currentX = (this.queue.length > 0) ? this.queue[0].currentX : this.customerX;

    // Spawn floating coins & sparkles
    this.floatingTexts.push({
      text: `+${payout.toLocaleString('vi-VN')}đ ⭐`,
      x: currentX + 5,
      y: 95,
      alpha: 1.0,
      color: '#50fa7b'
    });

    for (let i = 0; i < 20; i++) {
      this.particles.push({
        x: currentX + 15 + (Math.random() * 24 - 12),
        y: 105 + (Math.random() * 24 - 12),
        vx: (Math.random() - 0.5) * 3,
        vy: -Math.random() * 2.5 - 1,
        life: 45,
        maxLife: 45,
        color: ['#f4c430', '#ff79c6', '#8be9fd', '#50fa7b', '#ffb86c'][Math.floor(Math.random() * 5)],
        size: Math.random() > 0.5 ? 3 : 2
      });
    }

    setTimeout(() => {
      this.isDrinking = false;
      this.drinkLevel = 1.0;
      if (this.queue.length > 0) {
        this.advanceQueue();
      } else {
        this.customerState = 'leaving';
      }
    }, 1100);
  }

  triggerFailEffects() {
    this.bubbleType = 'angry';
    const currentX = (this.queue.length > 0) ? this.queue[0].currentX : this.customerX;
    this.floatingTexts.push({
      text: 'HUỶ ĐƠN! ❌',
      x: currentX,
      y: 95,
      alpha: 1.0,
      color: '#ff5555'
    });

    setTimeout(() => {
      if (this.queue.length > 0) {
        this.advanceQueue();
      } else {
        this.customerState = 'leaving';
      }
    }, 800);
  }

  setDrinkPreview(drink) {
    this.currentDrink = drink;
  }

  setShaking(isShaking) {
    this.isShaking = isShaking;
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

    // 1. SKY & DISTANT STREET BACKGROUND WITH NEON SIGNS
    this.drawBackground(ctx);

    // 2. STREET LAMP WITH RADIANT CONE OF LIGHT
    this.drawStreetLamp(ctx);

    // 3. CART BACK WALL & ARTISAN SHELVES (Behind Hyhy)
    this.drawCartBack(ctx);

    // 4. HYHY BARISTA SPRITE (Full body: legs, skirt, apron, head, beret standing inside stall)
    this.drawHyhy(ctx);

    // 5. MILK TEA CART FRONT COUNTER & EQUIPMENT (In front of Hyhy's body)
    this.drawCartFront(ctx);

    // 6. HYHY FOREARMS & SHAKER (Resting/active on top of the counter)
    this.drawHyhyForearms(ctx);

    // 7. STORE PET (Corgi, Mèo Thần Tài, Capybara)
    this.drawStorePet(ctx);

    // 8. CUSTOMER SPRITES & QUEUE
    this.leavingCustomers.forEach(lc => {
      this.drawCustomer(ctx, lc.currentX, 108, lc.customerType, false, '');
    });

    if (this.queue && this.queue.length > 0) {
      for (let i = this.queue.length - 1; i >= 0; i--) {
        const qCust = this.queue[i];
        this.drawCustomer(ctx, qCust.currentX, 108, qCust.customerType, i === 0, qCust.quote);
      }
    } else if (this.customerActive) {
      this.drawCustomer(ctx, this.customerX, 108, this.customerType, true, this.customerQuote);
    }

    // 9. THIEF SPRITE (Black hoodie & mask sneaking across)
    this.drawThief(ctx);

    // 10. PARTICLES & FLOATING NUMBERS
    this.drawParticles(ctx);

    ctx.restore();
  }

  getTimeOfDay() {
    if (this.customTimeOfDay) return this.customTimeOfDay;
    const hour = new Date().getHours();
    if (hour >= 5 && hour < 11) return 'morning';   // 5h00 - 10h59: Buổi Sáng
    if (hour >= 11 && hour < 15) return 'noon';      // 11h00 - 14h59: Buổi Trưa
    if (hour >= 15 && hour < 19) return 'afternoon'; // 15h00 - 18h59: Buổi Chiều (Hoàng hôn)
    return 'night';                                  // 19h00 - 4h59: Buổi Tối / Đêm
  }

  getTimeOfDayLabel() {
    const tod = this.getTimeOfDay();
    const labels = {
      morning: '🌅 Sáng',
      noon: '☀️ Trưa',
      afternoon: '🌇 Chiều',
      night: '🌙 Tối'
    };
    return labels[tod] || '🌅 Sáng';
  }

  cycleTimeOfDay() {
    const list = ['morning', 'noon', 'afternoon', 'night'];
    const cur = this.getTimeOfDay();
    const curIdx = list.indexOf(cur);
    const nextIdx = (curIdx + 1) % list.length;
    this.customTimeOfDay = list[nextIdx];
    return {
      tod: this.customTimeOfDay,
      label: this.getTimeOfDayLabel()
    };
  }

  drawClouds(ctx, tod) {
    if (tod === 'night') return; // Buổi tối dùng trăng và sao thay mây
    this.clouds.forEach(c => {
      let topColor = '#ffffff';
      let bottomColor = '#dfe6e9';
      let alpha = 0.88;

      if (tod === 'morning') {
        topColor = '#ffffff';
        bottomColor = '#ffeaa7';
        alpha = 0.82;
      } else if (tod === 'noon') {
        topColor = '#ffffff';
        bottomColor = '#c7ecee';
        alpha = 0.92;
      } else if (tod === 'afternoon') {
        topColor = '#ffeaa7';
        bottomColor = '#e17055';
        alpha = 0.85;
      }

      ctx.save();
      ctx.globalAlpha = alpha;
      // Cloud base shadow
      ctx.fillStyle = bottomColor;
      ctx.beginPath();
      ctx.roundRect(c.x, c.y + 4, c.w, c.h - 4, 6);
      ctx.fill();

      // Cloud puffs
      ctx.fillStyle = topColor;
      ctx.beginPath();
      ctx.arc(c.x + c.w * 0.32, c.y + 5, c.h * 0.45, 0, Math.PI * 2);
      ctx.arc(c.x + c.w * 0.68, c.y + 4, c.h * 0.55, 0, Math.PI * 2);
      ctx.roundRect(c.x + 2, c.y + 5, c.w - 4, c.h - 5, 5);
      ctx.fill();
      ctx.restore();
    });
  }

  drawBackground(ctx) {
    const tod = this.getTimeOfDay();

    // 1. SKY GRADIENT DYNAMIC THEO GIỜ TRONG NGÀY
    const skyGrad = ctx.createLinearGradient(0, 0, 0, 145);
    if (tod === 'morning') {
      // Bình minh ban mai: Xanh lam trong trẻo chuyển vàng mơ nắng sớm
      skyGrad.addColorStop(0, '#2e6bb5');
      skyGrad.addColorStop(0.38, '#5fa7e8');
      skyGrad.addColorStop(0.72, '#f5cd79');
      skyGrad.addColorStop(1, '#ffeaa7');
    } else if (tod === 'noon') {
      // Giữa trưa: Bầu trời xanh biếc nắng chói chang
      skyGrad.addColorStop(0, '#0984e3');
      skyGrad.addColorStop(0.5, '#74b9ff');
      skyGrad.addColorStop(0.85, '#81ecec');
      skyGrad.addColorStop(1, '#dff9fb');
    } else if (tod === 'afternoon') {
      // Chiều tà hoàng hôn: Tím hồng mộng mơ chuyển cam cháy rực rỡ
      skyGrad.addColorStop(0, '#2b1055');
      skyGrad.addColorStop(0.35, '#75175a');
      skyGrad.addColorStop(0.68, '#d35400');
      skyGrad.addColorStop(0.88, '#e67e22');
      skyGrad.addColorStop(1, '#f1c40f');
    } else {
      // Đêm: Tím chàm huyền ảo, phố đêm lung linh
      skyGrad.addColorStop(0, '#0c0612');
      skyGrad.addColorStop(0.5, '#1e0c24');
      skyGrad.addColorStop(1, '#3b1638');
    }
    ctx.fillStyle = skyGrad;
    ctx.fillRect(0, 0, this.width, 145);

    // 2. MẶT TRỜI / MẶT TRĂNG & SAO
    if (tod === 'night') {
      // Trăng lưỡi liềm vàng ấm
      ctx.fillStyle = 'rgba(255, 235, 160, 0.15)';
      ctx.beginPath();
      ctx.arc(45, 28, 18, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = '#fff4cc';
      ctx.beginPath();
      ctx.arc(45, 28, 11, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#1e0c24';
      ctx.beginPath();
      ctx.arc(41, 26, 9, 0, Math.PI * 2);
      ctx.fill();

      // Sao lấp lánh ban đêm
      const stars = [
        { x: 15, y: 18 }, { x: 80, y: 24 }, { x: 125, y: 15 },
        { x: 195, y: 28 }, { x: 260, y: 14 }, { x: 310, y: 22 },
        { x: 340, y: 40 }, { x: 160, y: 45 }
      ];
      ctx.fillStyle = '#fff';
      stars.forEach((s, idx) => {
        const flicker = (Math.sin(this.tick * 0.1 + idx) + 1) * 0.4 + 0.3;
        ctx.globalAlpha = flicker;
        ctx.fillRect(s.x, s.y, 2, 2);
      });
      ctx.globalAlpha = 1.0;
    } else if (tod === 'morning') {
      // Mặt trời bình minh dịu mát bên góc trái
      const sx = 55;
      const sy = 32;
      const sunHalo = ctx.createRadialGradient(sx, sy, 3, sx, sy, 30);
      sunHalo.addColorStop(0, 'rgba(255, 245, 180, 0.6)');
      sunHalo.addColorStop(0.5, 'rgba(255, 215, 100, 0.2)');
      sunHalo.addColorStop(1, 'rgba(255, 215, 100, 0)');
      ctx.fillStyle = sunHalo;
      ctx.beginPath();
      ctx.arc(sx, sy, 30, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = '#fff6b7';
      ctx.beginPath();
      ctx.arc(sx, sy, 10, 0, Math.PI * 2);
      ctx.fill();
    } else if (tod === 'noon') {
      // Mặt trời đứng bóng rực rỡ trên đỉnh trời
      const sx = 180;
      const sy = 22;
      const sunHalo = ctx.createRadialGradient(sx, sy, 4, sx, sy, 36);
      sunHalo.addColorStop(0, 'rgba(255, 255, 255, 0.85)');
      sunHalo.addColorStop(0.4, 'rgba(255, 235, 150, 0.35)');
      sunHalo.addColorStop(1, 'rgba(255, 235, 150, 0)');
      ctx.fillStyle = sunHalo;
      ctx.beginPath();
      ctx.arc(sx, sy, 36, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = '#ffffff';
      ctx.beginPath();
      ctx.arc(sx, sy, 12, 0, Math.PI * 2);
      ctx.fill();
    } else if (tod === 'afternoon') {
      // Vầng dương hoàng hôn đỏ cam lặn dần bên các tòa nhà
      const sx = 65;
      const sy = 55;
      const sunHalo = ctx.createRadialGradient(sx, sy, 4, sx, sy, 34);
      sunHalo.addColorStop(0, 'rgba(255, 107, 107, 0.75)');
      sunHalo.addColorStop(0.5, 'rgba(254, 202, 87, 0.35)');
      sunHalo.addColorStop(1, 'rgba(254, 202, 87, 0)');
      ctx.fillStyle = sunHalo;
      ctx.beginPath();
      ctx.arc(sx, sy, 34, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = '#ff6b6b';
      ctx.beginPath();
      ctx.arc(sx, sy, 12, 0, Math.PI * 2);
      ctx.fill();
    }

    // 3. MÂY TRÔI BAN NGÀY
    this.drawClouds(ctx, tod);

    // 4. TÒA NHÀ PHÍA XA (SILHOUETTES THEO BUỔI)
    let bldColor = '#18091d';
    if (tod === 'morning') bldColor = '#2f3542';
    else if (tod === 'noon') bldColor = '#2f3640';
    else if (tod === 'afternoon') bldColor = '#2b1035';

    ctx.fillStyle = bldColor;
    ctx.fillRect(20, 50, 48, 95);
    ctx.fillRect(68, 35, 55, 110);
    ctx.fillRect(123, 60, 65, 85);
    ctx.fillRect(220, 42, 60, 103);
    ctx.fillRect(280, 55, 75, 90);

    // 5. BẢNG HIỆU NEON TRÊN TÒA NHÀ (SÁNG VÀO HOÀNG HÔN & TỐI)
    let neonAlpha = 1.0;
    if (tod === 'morning') neonAlpha = 0.25;
    else if (tod === 'noon') neonAlpha = 0.15;
    else if (tod === 'afternoon') neonAlpha = 0.75;
    else neonAlpha = 1.0;

    const neonCyan = ((Math.sin(this.tick * 0.1) * 0.2) + 0.8) * neonAlpha;
    ctx.fillStyle = `rgba(0, 206, 201, ${neonCyan})`;
    ctx.font = 'bold 9px monospace';
    ctx.fillText('⚡TIỆM TRÀ', 72, 50);

    const neonPink = ((Math.sin(this.tick * 0.12 + 1) * 0.2) + 0.8) * neonAlpha;
    ctx.fillStyle = `rgba(253, 121, 168, ${neonPink})`;
    ctx.fillText('🍟ĂN VẶT', 228, 56);

    // 6. ÁNH SÁNG CỬA SỔ TÒA NHÀ
    for (let bx = 30; bx < 340; bx += 28) {
      for (let by = 60; by < 130; by += 20) {
        if ((bx + by) % 7 === 0) {
          if (tod === 'noon') {
            ctx.fillStyle = (bx % 2 === 0) ? '#dfe6e9' : '#81ecec';
          } else if (tod === 'morning') {
            ctx.fillStyle = (bx % 2 === 0) ? '#ffeaa7' : '#74b9ff';
          } else {
            ctx.fillStyle = (bx % 2 === 0) ? '#f4c430' : '#8be9fd';
          }
          ctx.fillRect(bx, by, 6, 8);
        }
      }
    }

    // 7. MẶT ĐƯỜNG & XE MÁY LƯU THÔNG
    let roadColor = '#220f20';
    if (tod === 'morning') roadColor = '#3a3440';
    else if (tod === 'noon') roadColor = '#4a4250';
    else if (tod === 'afternoon') roadColor = '#321c2e';

    ctx.fillStyle = roadColor;
    ctx.fillRect(0, 134, this.width, 8);
    this.traffic.forEach(t => {
      ctx.fillStyle = '#111';
      ctx.fillRect(t.x, 135, 8, 4);
      ctx.fillRect(t.x + 3, 132, 3, 4);
      ctx.fillStyle = t.color;
      ctx.fillRect(t.x - 3, 136, 3, 2);
      ctx.fillStyle = '#ff3838';
      ctx.fillRect(t.x + 8, 136, 1, 2);
    });

    // 8. VỈA HÈ & GẠCH LÁT THEO ÁNH SÁNG BUỔI
    let groundColor = '#261223';
    let kerb1 = '#3f1f3b';
    let kerb2 = '#542b4e';
    let grout = '#1e0c1b';

    if (tod === 'morning') {
      groundColor = '#48414a';
      kerb1 = '#5c545f';
      kerb2 = '#6e6572';
      grout = '#3a343c';
    } else if (tod === 'noon') {
      groundColor = '#57505a';
      kerb1 = '#6d6571';
      kerb2 = '#7f7684';
      grout = '#453f47';
    } else if (tod === 'afternoon') {
      groundColor = '#3b2234';
      kerb1 = '#4f2e46';
      kerb2 = '#633a57';
      grout = '#2d1827';
    }

    ctx.fillStyle = groundColor;
    ctx.fillRect(0, 142, this.width, 58);

    ctx.fillStyle = kerb1;
    ctx.fillRect(0, 142, this.width, 5);
    ctx.fillStyle = kerb2;
    ctx.fillRect(0, 145, this.width, 2);

    ctx.strokeStyle = grout;
    ctx.lineWidth = 1;
    for (let x = 0; x < this.width; x += 32) {
      ctx.beginPath();
      ctx.moveTo(x, 147);
      ctx.lineTo(x + 10, this.height);
      ctx.stroke();
    }

    // 9. DÂY ĐÈN TRANG TRÍ (FAIRY LIGHTS)
    ctx.strokeStyle = (tod === 'morning' || tod === 'noon') ? '#57606f' : '#3a2034';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(0, 20);
    ctx.quadraticCurveTo(100, 32, 200, 22);
    ctx.quadraticCurveTo(280, 30, 360, 18);
    ctx.stroke();

    const lightColors = ['#ff5555', '#f1fa8c', '#50fa7b', '#bd93f9', '#ff79c6', '#8be9fd'];
    const lightGlowAlpha = (tod === 'night') ? 0.35 : (tod === 'afternoon' ? 0.2 : 0.08);

    for (let i = 15; i < 350; i += 28) {
      const swingY = Math.sin(this.tick * 0.05 + i) * 2;
      const lightY = (i < 200 ? 20 + Math.sin(i / 100 * Math.PI) * 8 : 22 + Math.sin((i - 200) / 80 * Math.PI) * 7) + swingY;
      const c = lightColors[(Math.floor(i / 28)) % lightColors.length];
      
      // Halo
      ctx.fillStyle = c;
      ctx.globalAlpha = lightGlowAlpha;
      ctx.beginPath();
      ctx.arc(i, lightY + 4, 6, 0, Math.PI * 2);
      ctx.fill();

      // Bóng đèn
      ctx.globalAlpha = (tod === 'morning' || tod === 'noon') ? 0.7 : 1.0;
      ctx.fillRect(i - 2, lightY + 2, 4, 6);
    }

    // 10. HOA ANH ĐÀO BAY TRONG GIÓ
    this.petals.forEach(p => {
      ctx.fillStyle = p.color;
      ctx.globalAlpha = 0.85;
      ctx.beginPath();
      ctx.ellipse(p.x, p.y, p.size + 1, p.size, Math.PI / 4, 0, Math.PI * 2);
      ctx.fill();
    });
    ctx.globalAlpha = 1.0;
  }

  drawStreetLamp(ctx) {
    const tod = this.getTimeOfDay();
    const lx = 295;
    const ly = 55;

    // Lamp Post
    ctx.fillStyle = '#1c1c24';
    ctx.fillRect(lx + 4, ly + 25, 6, 85);
    ctx.fillRect(lx + 1, ly + 105, 12, 6); // base

    // Lamp Arm & Cap
    ctx.fillRect(lx - 12, ly + 22, 22, 4);
    ctx.fillStyle = '#2d2d3a';
    ctx.fillRect(lx - 16, ly + 24, 14, 5);

    if (tod === 'night') {
      // Đêm: Quầng sáng nón rực rỡ chiếu xuống xe trà sữa
      const bulbGlow = (Math.sin(this.tick * 0.08) * 0.1) + 0.85;
      const radGrad = ctx.createRadialGradient(lx - 9, ly + 36, 4, lx - 9, ly + 80, 95);
      radGrad.addColorStop(0, `rgba(255, 230, 140, ${0.45 * bulbGlow})`);
      radGrad.addColorStop(0.5, `rgba(255, 200, 100, ${0.15 * bulbGlow})`);
      radGrad.addColorStop(1, 'rgba(255, 200, 100, 0)');
      ctx.fillStyle = radGrad;
      ctx.beginPath();
      ctx.arc(lx - 9, ly + 70, 90, 0, Math.PI * 2);
      ctx.fill();

      // Yellow bulb
      ctx.fillStyle = '#fff4aa';
      ctx.fillRect(lx - 12, ly + 29, 6, 6);
    } else if (tod === 'afternoon') {
      // Chiều: Đèn vàng bắt đầu sáng nhẹ
      const bulbGlow = (Math.sin(this.tick * 0.08) * 0.05) + 0.5;
      const radGrad = ctx.createRadialGradient(lx - 9, ly + 36, 2, lx - 9, ly + 70, 60);
      radGrad.addColorStop(0, `rgba(255, 200, 100, ${0.25 * bulbGlow})`);
      radGrad.addColorStop(1, 'rgba(255, 200, 100, 0)');
      ctx.fillStyle = radGrad;
      ctx.beginPath();
      ctx.arc(lx - 9, ly + 60, 60, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = '#fbc531';
      ctx.fillRect(lx - 12, ly + 29, 6, 6);
    } else {
      // Ban ngày (Sáng, Trưa): Đèn đường tắt
      ctx.fillStyle = '#4b4b5a';
      ctx.fillRect(lx - 12, ly + 29, 6, 6);
    }
  }

  drawCart(ctx) {
    this.drawCartBack(ctx);
    this.drawCartFront(ctx);
  }

  // --- CART BACK LAYER: REAR PILLARS, ARTISAN SHELVES & PENDANT LIGHT (Behind Hyhy) ---
  drawCartBack(ctx) {
    const cx = 35;
    const cy = 92;

    // 1. Rear Awning Support Pillars (Brushed Gunmetal & Brass)
    ctx.fillStyle = '#4b4b5a';
    ctx.fillRect(cx + 8, cy - 35, 3, 53);
    ctx.fillRect(cx + 133, cy - 35, 3, 53);

    // 2. Back Wood Shelving Panel Unit (Kệ gỗ trưng bày siro & hũ trà)
    const shelfX = cx + 6;
    const shelfY = cy - 26;
    const shelfW = 132;
    const shelfH = 44;

    // Dark oak backboard with horizontal wood slat grooves
    ctx.fillStyle = '#2c160a';
    ctx.beginPath();
    ctx.roundRect(shelfX, shelfY, shelfW, shelfH, 3);
    ctx.fill();

    // Wood slat grooves
    ctx.fillStyle = '#1e0e06';
    for (let sy = shelfY + 9; sy < shelfY + shelfH; sy += 9) {
      ctx.fillRect(shelfX, sy, shelfW, 1);
    }

    // Upper Shelf (y = cy - 13 = 79)
    ctx.fillStyle = '#5c2d13';
    ctx.fillRect(shelfX + 4, cy - 13, shelfW - 8, 3);
    ctx.fillStyle = '#8a431c';
    ctx.fillRect(shelfX + 4, cy - 14, shelfW - 8, 1); // shelf highlight

    // Lower Shelf (y = cy + 4 = 96)
    ctx.fillStyle = '#5c2d13';
    ctx.fillRect(shelfX + 4, cy + 3, shelfW - 8, 3);
    ctx.fillStyle = '#8a431c';
    ctx.fillRect(shelfX + 4, cy + 2, shelfW - 8, 1);

    // Brass shelf brackets
    ctx.fillStyle = '#f4c430';
    ctx.fillRect(shelfX + 6, cy - 10, 2, 4);
    ctx.fillRect(shelfX + shelfW - 8, cy - 10, 2, 4);
    ctx.fillRect(shelfX + 6, cy + 6, 2, 4);
    ctx.fillRect(shelfX + shelfW - 8, cy + 6, 2, 4);

    // --- UPPER SHELF ITEMS: ARTISAN SYRUP BOTTLES & TEA CANISTERS ---
    // 5 Slender glass syrup bottles with colorful glowing translucent syrups
    const syrups = [
      { x: shelfX + 8, color: '#e74c3c' },  // Dâu tây (Strawberry)
      { x: shelfX + 17, color: '#f39c12' }, // Đào vàng (Peach)
      { x: shelfX + 26, color: '#2ecc71' }, // Bạc hà (Mint)
      { x: shelfX + 35, color: '#9b59b6' }, // Khoai môn (Taro)
      { x: shelfX + 44, color: '#e67e22' }, // Cam quế (Orange)
    ];

    syrups.forEach(s => {
      // Bottle neck & cork
      ctx.fillStyle = '#d35400';
      ctx.fillRect(s.x + 2, cy - 24, 2, 2); // cork
      ctx.fillStyle = 'rgba(255, 255, 255, 0.4)';
      ctx.fillRect(s.x + 2, cy - 22, 2, 2); // glass neck
      // Bottle glass body
      ctx.fillRect(s.x, cy - 20, 6, 7);
      // Colorful syrup liquid
      ctx.fillStyle = s.color;
      ctx.fillRect(s.x + 0.6, cy - 18, 4.8, 5);
      // Paper label
      ctx.fillStyle = '#fff8dc';
      ctx.fillRect(s.x + 1, cy - 16, 4, 2.5);
    });

    // Ceramic Tea Canisters (Hũ trà men sứ trắng cổ truyền)
    const teaJars = [
      { x: shelfX + 56, capColor: '#c0392b' }, // Oolong
      { x: shelfX + 68, capColor: '#27ae60' }, // Lài
      { x: shelfX + 80, capColor: '#2c3e50' }, // Trà Đen
    ];
    teaJars.forEach(tj => {
      ctx.fillStyle = '#ecf0f1';
      ctx.beginPath();
      ctx.roundRect(tj.x, cy - 22, 9, 9, 2);
      ctx.fill();
      ctx.fillStyle = tj.capColor;
      ctx.fillRect(tj.x + 1, cy - 24, 7, 2);
      ctx.fillStyle = '#bdc3c7';
      ctx.fillRect(tj.x + 2, cy - 18, 5, 2);
    });

    // Hanging Chalkboard Menu on back wall
    ctx.fillStyle = '#1e272e';
    ctx.beginPath();
    ctx.roundRect(shelfX + 94, cy - 23, 32, 10, 1.5);
    ctx.fill();
    ctx.strokeStyle = '#8a431c';
    ctx.lineWidth = 1;
    ctx.strokeRect(shelfX + 94, cy - 23, 32, 10);
    ctx.fillStyle = '#f1f2f6';
    ctx.font = 'bold 5px sans-serif';
    ctx.fillText('MENU HEEHEE 🧋', shelfX + 96, cy - 17);
    ctx.fillStyle = '#feca57';
    ctx.fillText('ĐỒNG GIÁ 25k ⭐', shelfX + 96, cy - 14);

    // --- LOWER SHELF ITEMS: CUP STACKS & SUCCULENT ---
    // Stacks of paper cups
    for (let c = 0; c < 3; c++) {
      ctx.fillStyle = '#ffffff';
      ctx.beginPath();
      ctx.roundRect(shelfX + 8 + c * 8, cy - 7, 6, 10, 1);
      ctx.fill();
      ctx.fillStyle = '#ff7675';
      ctx.fillRect(shelfX + 9 + c * 8, cy - 3, 4, 3);
    }

    // Mini decorative potted succulent
    ctx.fillStyle = '#e17055';
    ctx.beginPath();
    ctx.roundRect(shelfX + 116, cy - 5, 8, 8, 1);
    ctx.fill();
    ctx.fillStyle = '#00b894';
    ctx.beginPath();
    ctx.arc(shelfX + 120, cy - 6, 4, 0, Math.PI * 2);
    ctx.fill();

    // Vintage Edison Pendant Bulb hanging from ceiling above Hyhy
    const lampX = cx + 64;
    const lampY = cy - 26;
    ctx.strokeStyle = '#2d3436';
    ctx.lineWidth = 1.2;
    ctx.beginPath();
    ctx.moveTo(lampX, cy - 40);
    ctx.lineTo(lampX, lampY);
    ctx.stroke();
    ctx.fillStyle = '#f4c430';
    ctx.fillRect(lampX - 2, lampY, 4, 3);
    ctx.fillStyle = 'rgba(255, 235, 160, 0.95)';
    ctx.beginPath();
    ctx.arc(lampX, lampY + 5, 3.5, 0, Math.PI * 2);
    ctx.fill();
    // Warm radial ambient light glow cone
    const warmPendantGlow = ctx.createRadialGradient(lampX, lampY + 5, 2, lampX, lampY + 16, 42);
    warmPendantGlow.addColorStop(0, 'rgba(255, 215, 0, 0.38)');
    warmPendantGlow.addColorStop(0.6, 'rgba(255, 175, 50, 0.14)');
    warmPendantGlow.addColorStop(1, 'rgba(255, 175, 50, 0)');
    ctx.fillStyle = warmPendantGlow;
    ctx.beginPath();
    ctx.arc(lampX, lampY + 16, 42, 0, Math.PI * 2);
    ctx.fill();
  }

  // --- CART FRONT LAYER: COUNTERTOP, FRONT CHASSIS, GLASS SHOWCASE, AWNING & EQUIPMENT (In front of Hyhy) ---
  drawCartFront(ctx) {
    const cx = 35;
    const cy = 92;

    // Cart Drop Shadow on street
    ctx.fillStyle = 'rgba(10, 5, 12, 0.6)';
    ctx.beginPath();
    ctx.ellipse(cx + 70, cy + 62, 75, 10, 0, 0, Math.PI * 2);
    ctx.fill();

    // 1. Heavy Duty Wheel Axle across bottom
    ctx.fillStyle = '#2d3436';
    ctx.fillRect(cx + 25, cy + 53, 90, 3);

    // 2. Cart Wheels with Spoke detailing & Gold rim
    this.drawWheel(ctx, cx + 25, cy + 54);
    this.drawWheel(ctx, cx + 115, cy + 54);

    // 3. Cart Wooden Chassis (Front Panel with clearance underneath for visible legs)
    ctx.fillStyle = '#4a2612'; // dark wood border
    ctx.fillRect(cx, cy + 22, 145, 27);

    ctx.fillStyle = '#783e1d'; // warm polished mahogany
    ctx.fillRect(cx + 3, cy + 24, 139, 23);

    // Wood panel horizontal bevels
    ctx.fillStyle = '#5f2f14';
    ctx.fillRect(cx + 3, cy + 32, 139, 1.5);
    ctx.fillRect(cx + 3, cy + 40, 139, 1.5);

    // Polished Brass Corner Brackets with rivets
    ctx.fillStyle = '#f4c430';
    ctx.fillRect(cx, cy + 22, 6, 6);
    ctx.fillRect(cx + 139, cy + 22, 6, 6);
    ctx.fillRect(cx, cy + 43, 6, 6);
    ctx.fillRect(cx + 139, cy + 43, 6, 6);

    // 4. Modern Glass Pastry & Topping Showcase in Front Panel (Tủ kính trưng bày bánh flan & tart)
    const glassX = cx + 38;
    const glassY = cy + 25;
    const glassW = 68;
    const glassH = 20;

    // Showcase frame & dark interior
    ctx.fillStyle = '#1c0f08';
    ctx.beginPath();
    ctx.roundRect(glassX, glassY, glassW, glassH, 2);
    ctx.fill();

    // Showcase interior warm glow
    ctx.fillStyle = 'rgba(255, 220, 130, 0.2)';
    ctx.fillRect(glassX + 2, glassY + 2, glassW - 4, glassH - 4);

    // Glass showcase shelf
    ctx.fillStyle = 'rgba(255, 255, 255, 0.4)';
    ctx.fillRect(glassX + 2, glassY + 11, glassW - 4, 1.5);

    // Showcase Items: Mini Egg Tarts (Bánh tart trứng vàng óng)
    for (let t = 0; t < 3; t++) {
      const tx = glassX + 6 + t * 9;
      ctx.fillStyle = '#e67e22'; // crust
      ctx.beginPath();
      ctx.ellipse(tx + 3, glassY + 9, 3.5, 2, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#f1c40f'; // golden egg custard
      ctx.beginPath();
      ctx.ellipse(tx + 3, glassY + 8.5, 2.5, 1.5, 0, 0, Math.PI * 2);
      ctx.fill();
    }

    // Showcase Items: Caramel Flan Puddings (Bánh flan caramen)
    for (let f = 0; f < 3; f++) {
      const fx = glassX + 38 + f * 9;
      ctx.fillStyle = '#f5cd79'; // pudding body
      ctx.beginPath();
      ctx.roundRect(fx, glassY + 13, 6, 5, 1);
      ctx.fill();
      ctx.fillStyle = '#d35400'; // dark caramel syrup top
      ctx.fillRect(fx, glassY + 13, 6, 1.5);
    }

    // Glass glare reflection lines
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.35)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(glassX + 4, glassY + glassH - 2);
    ctx.lineTo(glassX + 16, glassY + 2);
    ctx.moveTo(glassX + 20, glassY + glassH - 2);
    ctx.lineTo(glassX + 30, glassY + 2);
    ctx.stroke();

    // 5. Polished Carrara Marble Countertop with rounded edges & gloss highlight
    ctx.fillStyle = '#eddcd2';
    ctx.beginPath();
    ctx.roundRect(cx - 6, cy + 17, 157, 6, 2);
    ctx.fill();
    ctx.fillStyle = '#d6c2b4';
    ctx.fillRect(cx - 6, cy + 21, 157, 2); // bevel edge
    ctx.fillStyle = 'rgba(255, 255, 255, 0.7)';
    ctx.fillRect(cx - 5, cy + 18, 155, 1); // specular gloss line

    // 6. Front Awning Support Pillars (Polished Chrome & Gold Brackets)
    ctx.fillStyle = '#c5c5d2';
    ctx.fillRect(cx + 4, cy - 35, 4, 53);
    ctx.fillRect(cx + 137, cy - 35, 4, 53);
    ctx.fillStyle = '#f4c430';
    ctx.fillRect(cx + 3, cy + 13, 6, 4);
    ctx.fillRect(cx + 136, cy + 13, 6, 4);

    // 7. Fabric Striped Awning Roof with Scalloped Edge
    const awningY = cy - 42;
    const stripeColors = ['#d9383a', '#fff8dc', '#d9383a', '#fff8dc', '#d9383a', '#fff8dc', '#d9383a', '#fff8dc', '#d9383a'];
    const sw = 18;
    for (let i = 0; i < stripeColors.length; i++) {
      ctx.fillStyle = stripeColors[i];
      const sx = cx - 8 + i * sw;
      ctx.fillRect(sx, awningY, sw, 16);

      // Scalloped bottom ruffle
      ctx.beginPath();
      ctx.arc(sx + sw / 2, awningY + 16, sw / 2, 0, Math.PI);
      ctx.fill();
    }

    // Awning shadow underneath
    ctx.fillStyle = 'rgba(0, 0, 0, 0.25)';
    ctx.fillRect(cx - 8, awningY + 16, 162, 3);

    // --- SLEEPING CAT ON AWNING ROOF ---
    const catX = cx + 85;
    const catY = awningY - 4;
    const catBreathe = Math.sin(this.tick * 0.08) * 1;
    ctx.fillStyle = '#e67e22'; // Orange tabby body
    ctx.beginPath();
    ctx.ellipse(catX, catY + catBreathe, 7, 4, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#fff'; // White head
    ctx.beginPath();
    ctx.arc(catX - 6, catY - 1 + catBreathe, 3.5, 0, Math.PI * 2);
    ctx.fill();
    // Sleeping eyes
    ctx.fillStyle = '#111';
    ctx.fillRect(catX - 7, catY - 1 + catBreathe, 2, 1);
    // Tail twitch
    const catTail = Math.sin(this.tick * 0.12) * 2;
    ctx.fillStyle = '#e67e22';
    ctx.fillRect(catX + 6, catY + catTail, 4, 2);

    // 8. Glowing Neon Store Plaque "TRÀ SỮA HEEHEE" (Tự động căn giữa, bo góc và chống tràn viền)
    const neonPulse = (Math.sin(this.tick * 0.1) + 1) * 0.15 + 0.85;
    const plaqueX = cx + 16;
    const plaqueY = cy + 27;
    const plaqueW = 112;
    const plaqueH = 17;

    // Plaque body with dark lacquer finish
    ctx.fillStyle = '#1e0c18';
    ctx.beginPath();
    ctx.roundRect(plaqueX, plaqueY, plaqueW, plaqueH, 3.5);
    ctx.fill();

    // Glowing Neon Golden Border
    ctx.strokeStyle = `rgba(244, 196, 48, ${neonPulse})`;
    ctx.lineWidth = 1.5;
    ctx.stroke();

    // Brass corner rivets
    ctx.fillStyle = '#f39c12';
    ctx.fillRect(plaqueX + 2, plaqueY + 2, 2, 2);
    ctx.fillRect(plaqueX + plaqueW - 4, plaqueY + 2, 2, 2);
    ctx.fillRect(plaqueX + 2, plaqueY + plaqueH - 4, 2, 2);
    ctx.fillRect(plaqueX + plaqueW - 4, plaqueY + plaqueH - 4, 2, 2);

    // Neon glowing text centered perfectly inside plaque
    ctx.save();
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    let fontSize = 9.5;
    const signText = '🧋 TRÀ SỮA HEEHEE';
    ctx.font = `bold ${fontSize}px sans-serif`;
    while (ctx.measureText(signText).width > plaqueW - 14 && fontSize > 6) {
      fontSize -= 0.5;
      ctx.font = `bold ${fontSize}px sans-serif`;
    }
    // Subtle neon glow
    ctx.shadowColor = 'rgba(244, 196, 48, 0.6)';
    ctx.shadowBlur = 4 * neonPulse;
    ctx.fillStyle = '#f4c430';
    ctx.fillText(signText, plaqueX + plaqueW / 2, plaqueY + plaqueH / 2 + 0.5);
    ctx.restore();

    // 9. EQUIPMENT ON THE COUNTER:
    // A. Stainless Steel Tea Urn with Sight Glass Gauge
    ctx.fillStyle = '#bdc3c7';
    ctx.beginPath();
    ctx.roundRect(cx + 8, cy + 1, 15, 17, 2);
    ctx.fill();
    ctx.fillStyle = '#7f8c8d';
    ctx.fillRect(cx + 9, cy, 13, 3); // lid
    ctx.fillStyle = '#e74c3c';
    ctx.fillRect(cx + 13, cy + 13, 5, 3); // red spigot
    // Clear sight tube on side showing tea level!
    ctx.fillStyle = 'rgba(255, 255, 255, 0.7)';
    ctx.fillRect(cx + 6, cy + 3, 2, 12);
    ctx.fillStyle = '#8b4513'; // tea liquid inside gauge
    ctx.fillRect(cx + 6, cy + 6, 2, 9);

    // B. Glass Topping Jars with Condensation Sheen
    this.drawGlassJar(ctx, cx + 28, cy + 7, '#111'); // Tapioca
    this.drawGlassJar(ctx, cx + 40, cy + 7, '#f39c12'); // Golden pearl
    this.drawGlassJar(ctx, cx + 52, cy + 7, '#27ae60'); // Matcha jelly

    // C. Stainless Steel Ice Tub with Ice Scoop Handle
    ctx.fillStyle = '#95a5a6';
    ctx.beginPath();
    ctx.roundRect(cx + 66, cy + 8, 14, 9, 1);
    ctx.fill();
    ctx.fillStyle = '#ecf0f1'; // ice cubes
    ctx.fillRect(cx + 68, cy + 7, 10, 4);
    ctx.fillStyle = '#bdc3c7';
    ctx.fillRect(cx + 76, cy + 3, 2, 6);

    // D. Cup Sealing Machine (Máy dập nắp)
    const sealX = cx + 84;
    ctx.fillStyle = '#c0392b';
    ctx.beginPath();
    ctx.roundRect(sealX, cy + 2, 16, 16, 2);
    ctx.fill();
    ctx.fillStyle = '#e74c3c';
    ctx.fillRect(sealX + 2, cy + 4, 12, 12);
    // Film roll
    ctx.fillStyle = '#f39c12';
    ctx.fillRect(sealX + 3, cy - 3, 10, 5);
    // Pull lever
    ctx.fillStyle = '#34495e';
    ctx.fillRect(sealX + 13, cy, 2, 7);

    // E. Boiling Pearl Cooker Pot with Animated Brown Sugar Bubbles & Steam
    ctx.fillStyle = '#2c3e50';
    ctx.beginPath();
    ctx.roundRect(cx + 120, cy + 3, 18, 15, 2);
    ctx.fill();
    ctx.fillStyle = '#d35400';
    ctx.fillRect(cx + 121, cy + 4, 16, 4);
    // Amber bubbles
    if ((this.tick % 12) < 6) {
      ctx.fillStyle = '#f39c12';
      ctx.fillRect(cx + 124, cy + 5, 3, 2);
      ctx.fillRect(cx + 131, cy + 4, 2, 2);
    }

    // Steam particles
    for (let s = 0; s < 4; s++) {
      const steamProg = ((this.tick * 0.7 + s * 10) % 28);
      const steamAlpha = 1 - (steamProg / 28);
      ctx.fillStyle = `rgba(255, 255, 255, ${steamAlpha * 0.45})`;
      ctx.beginPath();
      ctx.arc(cx + 126 + s * 3 + Math.sin(this.tick * 0.1 + s) * 4, cy + 2 - steamProg, 2 + steamProg * 0.15, 0, Math.PI * 2);
      ctx.fill();
    }

    // --- SIDE STREET STOOL & ICED TEA SETUP ---
    const stoolX = cx - 22;
    const stoolY = cy + 45;
    // Blue plastic stool (Ghế nhựa xanh vỉa hè)
    ctx.fillStyle = '#2980b9';
    ctx.fillRect(stoolX, stoolY, 14, 3); // seat
    ctx.fillRect(stoolX + 1, stoolY + 3, 2, 10); // legs
    ctx.fillRect(stoolX + 11, stoolY + 3, 2, 10);
    // Low table with iced tea (Trà đá) and sunflower seeds
    ctx.fillStyle = '#e67e22';
    ctx.fillRect(stoolX + 2, stoolY - 3, 5, 2);
    ctx.fillStyle = '#111';
    ctx.fillRect(stoolX + 3, stoolY - 4, 3, 1);
    // Tall glass of iced tea with lemon slice!
    ctx.fillStyle = 'rgba(255, 255, 255, 0.6)';
    ctx.fillRect(stoolX + 8, stoolY - 7, 4, 7);
    ctx.fillStyle = '#f1c40f';
    ctx.fillRect(stoolX + 9, stoolY - 5, 2, 4);
  }

  drawWheel(ctx, x, y) {
    ctx.fillStyle = '#111';
    ctx.beginPath();
    ctx.arc(x, y, 11, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#f4c430'; // Gold rim
    ctx.beginPath();
    ctx.arc(x, y, 9, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#444';
    ctx.beginPath();
    ctx.arc(x, y, 7, 0, Math.PI * 2);
    ctx.fill();
    // Center cap
    ctx.fillStyle = '#f4c430';
    ctx.beginPath();
    ctx.arc(x, y, 3, 0, Math.PI * 2);
    ctx.fill();
  }

  drawGlassJar(ctx, x, y, contentsColor) {
    ctx.fillStyle = 'rgba(255, 255, 255, 0.5)';
    ctx.fillRect(x, y, 9, 10);
    ctx.fillStyle = contentsColor;
    ctx.fillRect(x + 1, y + 4, 7, 5);
    ctx.fillStyle = '#8b4513'; // cork lid
    ctx.fillRect(x, y - 2, 9, 3);
  }

  // ==========================================
  // RETRO PIXEL ART CHARACTER SYSTEM ENGINE
  // ==========================================

  // Integer-aligned crisp pixel rectangle
  drawPixel(ctx, x, y, w, h, color) {
    ctx.fillStyle = color;
    ctx.fillRect(Math.round(x), Math.round(y), Math.max(1, Math.round(w)), Math.max(1, Math.round(h)));
  }

  // Standard Pixel Art Head & Expressive Anime Pixel Face
  drawOrganicHead(ctx, cx, cy, rx, ry, skinColor, blushColor, isBlinking, eyeColor = '#1a1016', isHappy = false) {
    const px = Math.round(cx);
    const py = Math.round(cy);
    const w = Math.round(rx * 2);
    const h = Math.round(ry * 2);
    const left = px - Math.floor(w / 2);
    const top = py - Math.floor(h / 2);

    const baseSkin = skinColor || '#ffe0bd';
    const outlineColor = '#3a1e28'; // Warm dark outline
    const shadowSkin = '#e8a882';   // Warm peach chin/neck shadow
    const highlightSkin = '#fff4ea'; // Soft forehead / cheek light

    // 1. Pixel Art Head Silhouette & Outline
    this.drawPixel(ctx, left + 3, top, w - 6, 1, outlineColor);
    this.drawPixel(ctx, left + 1, top + 1, 2, 1, outlineColor);
    this.drawPixel(ctx, left + w - 3, top + 1, 2, 1, outlineColor);
    this.drawPixel(ctx, left, top + 2, 1, h - 5, outlineColor);
    this.drawPixel(ctx, left + w - 1, top + 2, 1, h - 5, outlineColor);
    this.drawPixel(ctx, left + 1, top + h - 3, 2, 1, outlineColor);
    this.drawPixel(ctx, left + w - 3, top + h - 3, 2, 1, outlineColor);
    this.drawPixel(ctx, left + 3, top + h - 2, 2, 1, outlineColor);
    this.drawPixel(ctx, left + w - 5, top + h - 2, 2, 1, outlineColor);
    this.drawPixel(ctx, left + 5, top + h - 1, w - 10, 1, outlineColor);

    // 2. Base Skin Fill & Shading
    this.drawPixel(ctx, left + 3, top + 1, w - 6, 1, highlightSkin);
    this.drawPixel(ctx, left + 1, top + 2, w - 2, h - 6, baseSkin);
    this.drawPixel(ctx, left + 2, top + h - 4, w - 4, 1, baseSkin);
    this.drawPixel(ctx, left + 3, top + h - 3, w - 6, 1, shadowSkin);
    this.drawPixel(ctx, left + 5, top + h - 2, w - 10, 1, shadowSkin);

    // 3. Cute Pixel Ears
    this.drawPixel(ctx, left - 1, py - 1, 1, 3, outlineColor);
    this.drawPixel(ctx, left, py, 1, 2, shadowSkin);
    this.drawPixel(ctx, left + w, py - 1, 1, 3, outlineColor);
    this.drawPixel(ctx, left + w - 1, py, 1, 2, shadowSkin);

    // 4. Rosy Pixel Blush (cheeks below eyes)
    const blush = blushColor || (isHappy ? '#ff6b81' : '#ff7675');
    ctx.fillStyle = blush;
    ctx.globalAlpha = 0.7;
    this.drawPixel(ctx, left + 2, py + 2, 2, 1, blush);
    this.drawPixel(ctx, left + w - 4, py + 2, 2, 1, blush);
    if (isHappy) {
      this.drawPixel(ctx, left + 2, py + 3, 1, 1, blush);
      this.drawPixel(ctx, left + w - 3, py + 3, 1, 1, blush);
    }
    ctx.globalAlpha = 1.0;

    // 5. Expressive Pixel Eyes
    const eyeSpacing = Math.round(rx * 0.44);
    const eyeY = py - 1;
    const leftEyeX = px - eyeSpacing - 2;
    const rightEyeX = px + eyeSpacing - 1;

    if (isHappy) {
      // Joyful curved anime eyes: ^ ^
      const drawHappyEye = (ex) => {
        this.drawPixel(ctx, ex, eyeY + 1, 1, 1, '#1e1018');
        this.drawPixel(ctx, ex + 1, eyeY, 2, 1, '#1e1018');
        this.drawPixel(ctx, ex + 3, eyeY + 1, 1, 1, '#1e1018');
      };
      drawHappyEye(leftEyeX);
      drawHappyEye(rightEyeX);
    } else if (isBlinking) {
      // Resting blink: sweet closed lash line _ _
      this.drawPixel(ctx, leftEyeX, eyeY + 1, 4, 1, '#1e1018');
      this.drawPixel(ctx, leftEyeX + 3, eyeY, 1, 1, '#1e1018');
      this.drawPixel(ctx, rightEyeX, eyeY + 1, 4, 1, '#1e1018');
      this.drawPixel(ctx, rightEyeX + 3, eyeY, 1, 1, '#1e1018');
    } else {
      // Standard High-Grade Anime Pixel Eyes with iris & white specular shine
      const drawStandardEye = (ex) => {
        // Upper eyelash bar
        this.drawPixel(ctx, ex, eyeY - 1, 4, 1, '#1e1018');
        this.drawPixel(ctx, ex + 3, eyeY, 1, 1, '#1e1018');
        // Sclera
        this.drawPixel(ctx, ex, eyeY, 3, 3, '#ffffff');
        // Iris
        this.drawPixel(ctx, ex + 1, eyeY, 2, 3, eyeColor);
        // Pupil
        this.drawPixel(ctx, ex + 1, eyeY + 1, 1, 2, '#110813');
        // PURE WHITE SPECULAR CATCHLIGHT PIXEL (top-left)
        this.drawPixel(ctx, ex + 1, eyeY, 1, 1, '#ffffff');
        // Lower rim
        this.drawPixel(ctx, ex + 1, eyeY + 3, 2, 1, '#3a1824');
      };
      drawStandardEye(leftEyeX);
      drawStandardEye(rightEyeX);

      // Delicate pixel eyebrows
      this.drawPixel(ctx, leftEyeX, eyeY - 3, 3, 1, '#533020');
      this.drawPixel(ctx, rightEyeX + 1, eyeY - 3, 3, 1, '#533020');
    }

    // 6. Cute Pixel Nose & Smiling Mouth
    this.drawPixel(ctx, px, py + 2, 1, 1, shadowSkin);
    if (isHappy) {
      this.drawPixel(ctx, px - 1, py + 4, 3, 1, '#8b263e');
      this.drawPixel(ctx, px, py + 5, 1, 1, '#ff7675');
    } else {
      this.drawPixel(ctx, px - 1, py + 4, 2, 1, '#a33045');
      this.drawPixel(ctx, px + 1, py + 4, 1, 1, '#d63031');
    }
  }

  // Standard Pixel Art Limbs (Arms & Legs with integer grid snapping)
  drawCurvedLimb(ctx, x1, y1, x2, y2, r1, r2, color) {
    const rx1 = Math.round(x1);
    const ry1 = Math.round(y1);
    const rx2 = Math.round(x2);
    const ry2 = Math.round(y2);
    const w = Math.max(2, Math.round(r1 + r2));
    const h = Math.abs(ry2 - ry1);
    const minX = Math.min(rx1, rx2);
    const minY = Math.min(ry1, ry2);

    ctx.fillStyle = color;
    if (h >= 1) {
      ctx.fillRect(minX, minY, w, h);
      // Outer shadow strip
      ctx.fillStyle = 'rgba(0, 0, 0, 0.15)';
      ctx.fillRect(minX + w - 1, minY, 1, h);
    } else {
      const len = Math.abs(rx2 - rx1);
      ctx.fillRect(minX, minY, Math.max(w, len), w);
    }
  }

  // Standard Pixel Art Shoes & Footwear (with clean soles & highlights)
  drawCurvedShoe(ctx, x, y, len, h, color, soleColor = '#ffffff') {
    const sx = Math.round(x - len * 0.4);
    const sy = Math.round(y);
    const sw = Math.round(len);
    const sh = Math.max(3, Math.round(h));

    // Upper shoe vamp
    ctx.fillStyle = color;
    ctx.fillRect(sx, sy, sw, sh - 1);
    ctx.fillRect(sx + 1, sy - 1, sw - 2, 1);

    // Sole
    ctx.fillStyle = soleColor;
    ctx.fillRect(sx, sy + sh - 1, sw + 1, 1);

    // Gloss highlight pixel
    ctx.fillStyle = 'rgba(255, 255, 255, 0.4)';
    ctx.fillRect(sx + sw - 2, sy, 1, 1);
  }

  // Standard Pixel Art Fabric Creases & Shading
  drawFabricFinish(ctx, cx, top, width, height, baseShade = 'rgba(0, 0, 0, 0.16)') {
    const px = Math.round(cx - width / 2);
    const py = Math.round(top);
    const w = Math.round(width);
    const h = Math.round(height);

    ctx.save();
    // Shaded side fold
    ctx.fillStyle = baseShade;
    ctx.fillRect(px, py, 1, h);
    ctx.fillRect(px + w - 1, py, 1, h);
    // Subtle vertical crease
    ctx.fillStyle = 'rgba(0, 0, 0, 0.1)';
    ctx.fillRect(Math.round(cx), py + 2, 1, h - 4);
    // Subtle highlight fold
    ctx.fillStyle = 'rgba(255, 255, 255, 0.15)';
    ctx.fillRect(Math.round(cx) - 1, py + 1, 1, h - 3);
    ctx.restore();
  }

  // Standard Anime Pixel Hair Halo / Sheen Band
  drawHairGloss(ctx, cx, cy, scale = 1) {
    const px = Math.round(cx);
    const py = Math.round(cy);
    const span = Math.round(5 * scale);

    ctx.save();
    // Stepped pixel hair shine band
    ctx.fillStyle = 'rgba(255, 245, 220, 0.45)';
    ctx.fillRect(px - span, py, span * 2 + 1, 1);
    // Specular catchlight pixels
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(px - Math.round(span * 0.4), py, 2, 1);
    ctx.fillRect(px + Math.round(span * 0.3), py, 1, 1);
    ctx.restore();
  }

  // HYHY - BARISTA CHỦ QUÁN (Pixel Art Sprite: Giày Oxford viền chỉ, vớ đen, váy xếp ly navy viền vàng, tạp dề ngọc bích, tóc hạt dẻ halo)
  drawHyhy(ctx) {
    const hx = 78;
    const hy = 78;
    const bob = Math.round(Math.sin(this.tick * 0.1) * 1); // Crisp integer breathing bob
    const isBlinking = (this.tick % 80) < 4;

    // 1. FEET & OXFORD BROGUES (Giày da Oxford nâu bóng viền chỉ vàng)
    this.drawCurvedShoe(ctx, hx + 3, 144, 7, 3, '#2e180d', '#1a0c06');
    this.drawCurvedShoe(ctx, hx + 10, 144, 7, 3, '#2e180d', '#1a0c06');
    this.drawPixel(ctx, hx + 4, 143, 2, 1, '#f4c430'); // Gold buckle
    this.drawPixel(ctx, hx + 11, 143, 2, 1, '#f4c430');
    this.drawPixel(ctx, hx + 5, 142, 2, 1, 'rgba(255, 255, 255, 0.45)'); // Leather shine

    // 2. SLENDER LEGS IN CHIC DARK TIGHTS (Vớ đen Barista cao cấp)
    this.drawCurvedLimb(ctx, hx + 4, 120 + bob, hx + 4, 144, 1.5, 1.5, '#1e1822');
    this.drawCurvedLimb(ctx, hx + 11, 120 + bob, hx + 11, 144, 1.5, 1.5, '#1e1822');
    this.drawPixel(ctx, hx + 4, 131 + bob, 1, 2, '#382a40'); // Knee highlights
    this.drawPixel(ctx, hx + 11, 131 + bob, 1, 2, '#382a40');

    // 3. PLEATED NAVY SKIRT (Chân váy xếp ly xanh navy viền vàng satin)
    const skirtTop = 108 + bob;
    this.drawPixel(ctx, hx - 2, skirtTop, 19, 13, '#151c2e');
    // Vertical pleats
    for (let px = hx - 1; px <= hx + 15; px += 3) {
      this.drawPixel(ctx, px, skirtTop, 1, 12, '#0c121e');
      this.drawPixel(ctx, px + 1, skirtTop + 1, 1, 11, '#1e2942');
    }
    // Gold satin hemline
    this.drawPixel(ctx, hx - 3, skirtTop + 12, 21, 1, '#f1c40f');
    this.drawPixel(ctx, hx - 2, skirtTop + 13, 19, 1, '#b78b02');

    // 4. WHITE SILK BLOUSE WITH RUFFLED PETER PAN COLLAR
    const torsoTop = hy + 16 + bob;
    this.drawPixel(ctx, hx - 1, torsoTop, 17, 18, '#ffffff');
    this.drawPixel(ctx, hx - 1, torsoTop, 1, 18, '#dcdde1'); // side seam
    this.drawPixel(ctx, hx + 15, torsoTop, 1, 18, '#dcdde1');

    // Peter Pan Collar
    this.drawPixel(ctx, hx + 2, torsoTop, 5, 3, '#f5f6fa');
    this.drawPixel(ctx, hx + 8, torsoTop, 5, 3, '#f5f6fa');
    this.drawPixel(ctx, hx + 1, torsoTop + 2, 6, 1, '#dfe4ea');
    this.drawPixel(ctx, hx + 8, torsoTop + 2, 6, 1, '#dfe4ea');

    // Ruby Silk Brooch Ribbon with golden jewel center
    this.drawPixel(ctx, hx + 5, torsoTop + 2, 5, 3, '#c0392b');
    this.drawPixel(ctx, hx + 6, torsoTop + 1, 3, 2, '#e74c3c');
    this.drawPixel(ctx, hx + 7, torsoTop + 2, 1, 1, '#f1c40f');

    // 5. EMERALD GREEN BARISTA APRON (Tạp dề Barista ngọc bích)
    this.drawPixel(ctx, hx, torsoTop + 3, 15, 17, '#1e824c');
    this.drawPixel(ctx, hx, torsoTop + 3, 1, 17, '#145a32'); // shadow border
    this.drawPixel(ctx, hx + 14, torsoTop + 3, 1, 17, '#145a32');

    // Tan Leather Cross Straps & Brass Buckles
    this.drawPixel(ctx, hx + 2, torsoTop + 2, 2, 7, '#d35400');
    this.drawPixel(ctx, hx + 11, torsoTop + 2, 2, 7, '#d35400');
    this.drawPixel(ctx, hx + 2, torsoTop + 5, 2, 1, '#f4c430'); // brass buckles
    this.drawPixel(ctx, hx + 11, torsoTop + 5, 2, 1, '#f4c430');

    // Front Utility Pocket
    this.drawPixel(ctx, hx + 3, torsoTop + 9, 9, 8, '#145a32');
    this.drawPixel(ctx, hx + 4, torsoTop + 10, 7, 6, '#196f3d');
    // Mini Gold Boba Cup Insignia on Pocket
    this.drawPixel(ctx, hx + 6, torsoTop + 12, 3, 3, '#f4c430');
    this.drawPixel(ctx, hx + 7, torsoTop + 11, 1, 1, '#ffffff'); // straw

    // 6. NECK
    this.drawPixel(ctx, hx + 5, hy + 13 + bob, 5, 4, '#ffe0bd');
    this.drawPixel(ctx, hx + 5, hy + 15 + bob, 5, 2, '#e8a882');

    // 7. CHESTNUT HAIR (Back Dome)
    const headX = hx + 7;
    const headY = hy + 7 + bob;
    this.drawPixel(ctx, headX - 7, headY - 8, 15, 12, '#3e1c0c');
    this.drawPixel(ctx, headX - 8, headY - 5, 17, 10, '#3e1c0c');

    // 8. PIXEL ART HEAD & EXPRESSIVE ANIME FACE (Amethyst Violet Eyes with Specular Shine)
    this.drawOrganicHead(ctx, headX, headY, 7, 7, '#ffe0bd', 'rgba(255, 123, 123, 0.45)', isBlinking, '#8e44ad', false);

    // 9. CHESTNUT HAIR (Front Bangs, Side Locks & Hair Halo)
    // Left side lock
    this.drawPixel(ctx, headX - 7, headY - 3, 3, 10, '#4a2411');
    this.drawPixel(ctx, headX - 8, headY + 1, 2, 7, '#3e1c0c');
    // Right side lock
    this.drawPixel(ctx, headX + 5, headY - 3, 3, 9, '#4a2411');
    this.drawPixel(ctx, headX + 7, headY + 1, 2, 6, '#3e1c0c');
    // Sweeping Bangs
    this.drawPixel(ctx, headX - 6, headY - 6, 13, 3, '#5c2d15');
    this.drawPixel(ctx, headX - 5, headY - 3, 4, 3, '#4a2411');
    this.drawPixel(ctx, headX + 1, headY - 3, 5, 2, '#4a2411');
    this.drawPixel(ctx, headX - 1, headY - 1, 3, 2, '#3e1c0c');

    // Anime Hair Halo Specular Shine Band
    this.drawHairGloss(ctx, headX, headY - 5, 1);

    // Cute Gold Boba Hairpin
    this.drawPixel(ctx, headX + 4, headY - 4, 2, 2, '#f1c40f');
    this.drawPixel(ctx, headX + 5, headY - 5, 1, 1, '#ffffff');

    // 10. CHIC PARISIAN BARISTA BERET (Mũ nồi xanh ngọc bích)
    this.drawPixel(ctx, headX - 8, headY - 10, 17, 4, '#27ae60');
    this.drawPixel(ctx, headX - 6, headY - 12, 13, 3, '#2ecc71');
    this.drawPixel(ctx, headX - 8, headY - 7, 17, 2, '#1e824c');
    // Embossed Gold Star Brooch on Beret
    this.drawPixel(ctx, headX + 4, headY - 9, 3, 3, '#f4c430');
    this.drawPixel(ctx, headX + 5, headY - 9, 1, 1, '#ffffff');

    // 11. UPPER ARMS (Down behind counter)
    this.drawCurvedLimb(ctx, hx - 2, hy + 18 + bob, hx - 1, hy + 25 + bob, 1.5, 1.5, '#ffe0bd');
    this.drawCurvedLimb(ctx, hx + 14, hy + 18 + bob, hx + 13, hy + 24 + bob, 1.5, 1.5, '#ffe0bd');

    this.drawFabricFinish(ctx, hx + 7, hy + 18 + bob, 14, 20, 'rgba(0, 0, 0, 0.18)');
  }

  // --- HYHY FOREARMS & INTERACTIVE ACTIONS (Pixel Art Forearms & Shaker) ---
  drawHyhyForearms(ctx) {
    const hx = 78;
    const hy = 78;
    const bob = Math.round(Math.sin(this.tick * 0.1) * 1);
    const shakeArm = this.isShaking ? Math.round(Math.sin(this.tick * 0.8) * 4) : 0;

    if (this.isShaking) {
      // Rapid animated forearms shaking cocktail shaker
      this.drawCurvedLimb(ctx, hx + 13, hy + 24 + bob, hx + 17, hy + 16 + bob + shakeArm, 1.5, 1.5, '#ffe0bd');
      this.drawCurvedLimb(ctx, hx - 1, hy + 25 + bob, hx + 13, hy + 18 + bob + shakeArm, 1.5, 1.5, '#ffe0bd');

      // Stainless steel shaker in pixel art
      const shakerX = hx + 13;
      const shakerY = hy + 8 + bob + shakeArm;
      this.drawPixel(ctx, shakerX, shakerY, 8, 15, '#bdc3c7');
      this.drawPixel(ctx, shakerX + 1, shakerY, 2, 15, '#ffffff'); // metallic specular line
      this.drawPixel(ctx, shakerX + 6, shakerY, 2, 15, '#7f8c8d'); // metallic shadow
      this.drawPixel(ctx, shakerX, shakerY + 6, 8, 3, '#e74c3c');  // silicone grip ring
      this.drawPixel(ctx, shakerX + 2, shakerY - 2, 4, 3, '#95a5a6'); // cap knob
      this.drawPixel(ctx, shakerX + 3, shakerY - 3, 2, 2, '#bdc3c7');

      // Action motion blur lines in pixel art
      this.drawPixel(ctx, shakerX - 3, shakerY + 3, 2, 1, '#ffffff');
      this.drawPixel(ctx, shakerX - 4, shakerY + 7, 2, 1, '#ffffff');
      this.drawPixel(ctx, shakerX + 9, shakerY + 3, 2, 1, '#ffffff');
      this.drawPixel(ctx, shakerX + 10, shakerY + 7, 2, 1, '#ffffff');
    } else {
      // Resting left forearm holding silver jigger
      this.drawCurvedLimb(ctx, hx - 1, hy + 24 + bob, hx + 2, hy + 31 + bob, 1.5, 1.5, '#ffe0bd');
      this.drawPixel(ctx, hx + 1, hy + 30 + bob, 3, 1, '#e17055'); // rose gold bracelet
      this.drawPixel(ctx, hx + 2, hy + 31 + bob, 3, 3, '#ffe0bd'); // hand

      // Silver dual-ended jigger
      this.drawPixel(ctx, hx + 4, hy + 28 + bob, 4, 2, '#bdc3c7');
      this.drawPixel(ctx, hx + 5, hy + 30 + bob, 2, 2, '#95a5a6');
      this.drawPixel(ctx, hx + 4, hy + 32 + bob, 4, 3, '#bdc3c7');
      this.drawPixel(ctx, hx + 5, hy + 28 + bob, 1, 7, '#ffffff'); // shine line

      // Resting right arm
      this.drawCurvedLimb(ctx, hx + 13, hy + 23 + bob, hx + 17, hy + 30 + bob, 1.5, 1.5, '#ffe0bd');
      this.drawPixel(ctx, hx + 16, hy + 30 + bob, 3, 3, '#ffe0bd'); // hand
    }
  }

  // 10 CUSTOMER ARCHETYPES WITH AUTHENTIC RETRO PIXEL ART GRAPHICS
  drawCustomer(ctx, x, y, type, isFront = true, quote = '') {
    const isMoving = isFront ? (x < this.targetCustomerX) : false;
    const walkBob = (this.customerState === 'waiting' && isMoving)
      ? Math.round(Math.sin(this.tick * 0.45) * 2)
      : (this.tick % 60 < 30 ? 1 : 0);

    // Pixel art ground drop shadow
    const shadowX = Math.round(x);
    const shadowY = Math.round(y + 41);
    this.drawPixel(ctx, shadowX - 2, shadowY, 24, 3, 'rgba(10, 5, 12, 0.35)');
    this.drawPixel(ctx, shadowX, shadowY - 1, 20, 5, 'rgba(10, 5, 12, 0.2)');

    const isBlinking = (this.tick % 90) < 4;
    const isHappy = isFront && this.isDrinking;
    const petBob = (this.customerState === 'waiting' && isMoving) ? Math.round(Math.sin(this.tick * 0.45) * 2) : 0;
    const petTail = Math.round(Math.sin(this.tick * 0.25) * 2);

    switch (type) {
      case 0: { // BÉ LAN - NỮ SINH CẤP 3 (Áo thủy thủ Sailor Fuku, váy xếp ly navy viền ribbon, nơ đỏ, tóc đuôi ngựa, balo boba)
        // Knee-high white socks
        this.drawCurvedLimb(ctx, x + 5, y + 23 + walkBob, x + 5, y + 38 + walkBob, 1.6, 1.6, '#ffffff');
        this.drawCurvedLimb(ctx, x + 12, y + 23 - walkBob, x + 12, y + 38 - walkBob, 1.6, 1.6, '#ffffff');
        this.drawPixel(ctx, x + 4, y + 23 + walkBob, 4, 1, '#dfe6e9');
        this.drawPixel(ctx, x + 11, y + 23 - walkBob, 4, 1, '#dfe6e9');

        // Mary Jane Shoes with gold buckles
        this.drawCurvedShoe(ctx, x + 6, y + 38 + walkBob, 7, 3, '#1a1016', '#331826');
        this.drawCurvedShoe(ctx, x + 13, y + 38 - walkBob, 7, 3, '#1a1016', '#331826');
        this.drawPixel(ctx, x + 6, y + 38 + walkBob, 2, 1, '#f4c430');
        this.drawPixel(ctx, x + 13, y + 38 - walkBob, 2, 1, '#f4c430');

        // Navy knife-pleated skirt with white ribbon hem
        this.drawPixel(ctx, x + 2, y + 18, 16, 9, '#1e3799');
        this.drawPixel(ctx, x + 5, y + 18, 1, 9, '#0c2461');
        this.drawPixel(ctx, x + 9, y + 18, 1, 9, '#0c2461');
        this.drawPixel(ctx, x + 13, y + 18, 1, 9, '#0c2461');
        this.drawPixel(ctx, x + 1, y + 26, 18, 1, '#ffffff'); // white satin ribbon

        // White Sailor Blouse & Navy Collar with Twin Ribbon Stripes
        this.drawPixel(ctx, x + 2, y + 8, 16, 11, '#ffffff');
        this.drawPixel(ctx, x + 1, y + 7, 18, 3, '#1e3799');
        this.drawPixel(ctx, x + 2, y + 10, 4, 3, '#1e3799');
        this.drawPixel(ctx, x + 14, y + 10, 4, 3, '#1e3799');
        this.drawPixel(ctx, x + 2, y + 11, 4, 1, '#ffffff');
        this.drawPixel(ctx, x + 14, y + 11, 4, 1, '#ffffff');

        // Ruby Red Silk Bowtie with gold center
        this.drawPixel(ctx, x + 8, y + 10, 4, 3, '#e84118');
        this.drawPixel(ctx, x + 9, y + 11, 2, 1, '#f4c430');

        // Back Hair Dome
        this.drawPixel(ctx, x + 3, y - 9, 14, 8, '#2c1e13');

        // Pixel Anime Head & Face (Chocolate Eyes)
        this.drawOrganicHead(ctx, x + 10, y - 2, 7, 7, '#ffe0bd', 'rgba(255, 123, 123, 0.45)', isBlinking, '#5d3a1a', isHappy);

        // Front Bangs & Side Strands
        this.drawPixel(ctx, x + 4, y - 6, 12, 3, '#3e271a');
        this.drawPixel(ctx, x + 4, y - 3, 3, 2, '#2c1e13');
        this.drawPixel(ctx, x + 12, y - 3, 3, 2, '#2c1e13');
        this.drawHairGloss(ctx, x + 10, y - 5, 0.85);

        // High Ponytail Swaying with step cycle
        const pTailSway = Math.round(Math.sin(this.tick * 0.25) * 2);
        this.drawPixel(ctx, x + 15, y - 7, 4, 3, '#2c1e13');
        this.drawPixel(ctx, x + 16 + pTailSway, y - 5, 4, 9, '#2c1e13');
        this.drawPixel(ctx, x + 17 + pTailSway, y + 4, 3, 6, '#3e271a');
        this.drawPixel(ctx, x + 15, y - 6, 3, 3, '#e84118'); // red scrunchie
        this.drawPixel(ctx, x + 5, y - 6, 2, 2, '#f1c40f'); // gold star clip

        // Pastel Pink Schoolbag with Bouncing Boba Charm
        this.drawPixel(ctx, x - 4, y + 9, 6, 13, '#ff9ff3');
        this.drawPixel(ctx, x - 4, y + 9, 1, 13, '#f368e0');
        const charmSwing = Math.round(Math.sin(this.tick * 0.2) * 2);
        this.drawPixel(ctx, x - 4 + charmSwing, y + 19, 4, 4, '#8b4513');
        this.drawPixel(ctx, x - 4 + charmSwing, y + 18, 3, 1, '#ffffff');
        break;
      }

      case 1: { // ANH NAM - VĂN PHÒNG / IT (Sơ mi baby blue, cà vạt đỏ đô, quần âu xám than, kính đồi mồi, smartwatch OLED, thẻ nhân viên)
        // Tailored charcoal slacks
        this.drawCurvedLimb(ctx, x + 5, y + 24 + walkBob, x + 5, y + 38 + walkBob, 1.8, 1.8, '#1e272c');
        this.drawCurvedLimb(ctx, x + 12, y + 24 - walkBob, x + 12, y + 38 - walkBob, 1.8, 1.8, '#1e272c');
        this.drawPixel(ctx, x + 6, y + 24 + walkBob, 1, 14, '#2d3436');
        this.drawPixel(ctx, x + 13, y + 24 - walkBob, 1, 14, '#2d3436');

        // Polished walnut Derby shoes
        this.drawCurvedShoe(ctx, x + 6, y + 38 + walkBob, 8, 3, '#2c1e13', '#111');
        this.drawCurvedShoe(ctx, x + 13, y + 38 - walkBob, 8, 3, '#2c1e13', '#111');
        this.drawPixel(ctx, x + 7, y + 38 + walkBob, 2, 1, '#5d4037');
        this.drawPixel(ctx, x + 14, y + 38 - walkBob, 2, 1, '#5d4037');

        // Baby Blue Dress Shirt & Crimson Tie
        this.drawPixel(ctx, x + 2, y + 8, 16, 17, '#74b9ff');
        this.drawPixel(ctx, x + 6, y + 7, 3, 2, '#ffffff'); // white collar points
        this.drawPixel(ctx, x + 11, y + 7, 3, 2, '#ffffff');
        this.drawPixel(ctx, x + 9, y + 8, 2, 10, '#c0392b'); // crimson knit tie
        this.drawPixel(ctx, x + 9, y + 12, 3, 1, '#ecf0f1'); // silver tie clip

        // Head & Dark Hair
        this.drawPixel(ctx, x + 3, y - 9, 14, 7, '#1e1e1e');
        this.drawOrganicHead(ctx, x + 10, y - 2, 7, 7, '#ffe0bd', 'rgba(255, 150, 150, 0.25)', isBlinking, '#2c3e50', isHappy);
        this.drawPixel(ctx, x + 4, y - 6, 9, 2, '#2d3436'); // side-part bangs

        // Tortoiseshell Glasses with cyan reflection glint
        this.drawPixel(ctx, x + 5, y - 2, 4, 3, '#5d3a1a');
        this.drawPixel(ctx, x + 11, y - 2, 4, 3, '#5d3a1a');
        this.drawPixel(ctx, x + 9, y - 2, 2, 1, '#5d3a1a');
        this.drawPixel(ctx, x + 6, y - 2, 1, 1, '#81ecec');
        this.drawPixel(ctx, x + 12, y - 2, 1, 1, '#81ecec');

        // Smartwatch OLED & Blue Lanyard Badge
        this.drawPixel(ctx, x + 1, y + 17, 3, 2, '#00cec9');
        this.drawPixel(ctx, x + 7, y + 9, 1, 8, '#0984e3');
        this.drawPixel(ctx, x + 7, y + 17, 3, 4, '#ffffff');
        break;
      }

      case 2: { // CÔ BA - HÀNG XÓM (Áo bà ba vàng gấm hoa sen, cúc ngọc trai, quần lụa đen, nón lá quai hồng, khăn rằn, giỏ sen)
        // Flowing black silk trousers & traditional wooden clogs
        this.drawCurvedLimb(ctx, x + 5, y + 24 + walkBob, x + 5, y + 38 + walkBob, 1.8, 1.8, '#1e131d');
        this.drawCurvedLimb(ctx, x + 12, y + 24 - walkBob, x + 12, y + 38 - walkBob, 1.8, 1.8, '#1e131d');
        this.drawCurvedShoe(ctx, x + 6, y + 38 + walkBob, 7, 3, '#8e44ad', '#d35400');
        this.drawCurvedShoe(ctx, x + 13, y + 38 - walkBob, 7, 3, '#8e44ad', '#d35400');

        // Golden Yellow Silk Áo Bà Ba with Pearl Buttons
        this.drawPixel(ctx, x + 2, y + 8, 16, 18, '#f1c40f');
        this.drawPixel(ctx, x + 2, y + 8, 1, 18, '#d4ac0d');
        this.drawPixel(ctx, x + 17, y + 8, 1, 18, '#d4ac0d');
        // Pearl buttons down the center
        for (let by = y + 9; by <= y + 21; by += 3) {
          this.drawPixel(ctx, x + 9, by, 2, 1, '#ffffff');
        }

        // Checkered Khăn Rằn around neck
        this.drawPixel(ctx, x + 6, y + 7, 8, 2, '#dfe6e9');
        this.drawPixel(ctx, x + 7, y + 7, 2, 1, '#2d3436');
        this.drawPixel(ctx, x + 11, y + 7, 2, 1, '#2d3436');

        // Head, Hair Bun & Pearl Earrings
        this.drawPixel(ctx, x + 3, y - 8, 14, 7, '#1e1e1e');
        this.drawOrganicHead(ctx, x + 10, y - 2, 7, 7, '#ffe0bd', 'rgba(255, 123, 123, 0.4)', isBlinking, '#2c1e13', isHappy);
        this.drawPixel(ctx, x + 15, y - 2, 4, 5, '#1e1e1e'); // low hair bun
        this.drawPixel(ctx, x + 17, y - 3, 2, 1, '#b2bec3'); // silver hairpin
        this.drawPixel(ctx, x + 2, y, 1, 2, '#ffffff'); // pearl earring

        // Conical Hat (Nón Lá) slung on back with pink silk ribbon
        this.drawPixel(ctx, x - 4, y + 6, 6, 14, '#f5cd79');
        this.drawPixel(ctx, x - 3, y + 8, 4, 10, '#e5ba65');
        this.drawPixel(ctx, x + 1, y + 12, 2, 6, '#ff7675'); // pink ribbon

        // Bamboo Basket with Fresh Lotus Blossoms
        this.drawPixel(ctx, x + 16, y + 16, 7, 7, '#d35400');
        this.drawPixel(ctx, x + 17, y + 13, 3, 3, '#ff7675');
        this.drawPixel(ctx, x + 20, y + 14, 3, 3, '#fd79a8');
        this.drawPixel(ctx, x + 18, y + 16, 2, 1, '#2ecc71');
        break;
      }

      case 3: { // TÚ - TIKTOKER REVIEWER (Hoodie ombre lavender-pink, tóc bạch kim, tai nghe DJ RGB đổi màu, smartphone quay video REC)
        // Dark athletic shorts & striped tube socks
        this.drawCurvedLimb(ctx, x + 5, y + 24 + walkBob, x + 5, y + 33 + walkBob, 2, 2, '#2d3436');
        this.drawCurvedLimb(ctx, x + 12, y + 24 - walkBob, x + 12, y + 33 - walkBob, 2, 2, '#2d3436');
        this.drawPixel(ctx, x + 5, y + 33 + walkBob, 3, 4, '#ffffff');
        this.drawPixel(ctx, x + 5, y + 34 + walkBob, 3, 1, '#00cec9');
        this.drawPixel(ctx, x + 12, y + 33 - walkBob, 3, 4, '#ffffff');
        this.drawPixel(ctx, x + 12, y + 34 - walkBob, 3, 1, '#00cec9');
        this.drawCurvedShoe(ctx, x + 6, y + 38 + walkBob, 8, 4, '#dfe6e9', '#00cec9');
        this.drawCurvedShoe(ctx, x + 13, y + 38 - walkBob, 8, 4, '#dfe6e9', '#00cec9');

        // Gradient Pastel Hoodie (Lavender to Coral Pink)
        this.drawPixel(ctx, x + 2, y + 8, 16, 9, '#a29bfe');
        this.drawPixel(ctx, x + 2, y + 17, 16, 8, '#fd79a8');
        this.drawPixel(ctx, x + 7, y + 10, 1, 6, '#ffffff'); // drawstrings
        this.drawPixel(ctx, x + 12, y + 10, 1, 6, '#ffffff');

        // Head & Platinum-Blonde Hair with Pink Dip-Dye Tips
        this.drawPixel(ctx, x + 3, y - 9, 14, 7, '#dfe6e9');
        this.drawOrganicHead(ctx, x + 10, y - 2, 7, 7, '#ffe0bd', 'rgba(255, 118, 117, 0.4)', isBlinking, '#2d3436', isHappy);
        this.drawPixel(ctx, x + 2, y - 11, 4, 3, '#fd79a8'); // pink dyed tips
        this.drawPixel(ctx, x + 10, y - 11, 4, 3, '#fd79a8');

        // DJ Over-Ear Headphones with Animated RGB Glow
        const rgbColors = ['#00cec9', '#fd79a8', '#fdcb6e', '#a29bfe'];
        const rgbCur = rgbColors[Math.floor(this.tick * 0.1) % 4];
        this.drawPixel(ctx, x + 4, y - 10, 12, 2, '#2d3436');
        this.drawPixel(ctx, x + 1, y - 3, 3, 5, '#2d3436');
        this.drawPixel(ctx, x + 2, y - 2, 1, 3, rgbCur);
        this.drawPixel(ctx, x + 16, y - 3, 3, 5, '#2d3436');
        this.drawPixel(ctx, x + 17, y - 2, 1, 3, rgbCur);

        // Smartphone with Flashing Red "REC" Dot
        this.drawPixel(ctx, x + 17, y + 10, 5, 9, '#1e272e');
        this.drawPixel(ctx, x + 18, y + 11, 3, 7, '#74b9ff');
        if ((this.tick % 30) < 15) {
          this.drawPixel(ctx, x + 19, y + 12, 1, 1, '#ff4757');
        }
        break;
      }

      case 4: { // ANH SHIPPER (Áo khoác gió thể thao 3M phản quang, mũ bảo hiểm kính cong, túi bao tử, thùng hàng boba, live GPS)
        // Sturdy cargo pants & grip sneakers
        this.drawCurvedLimb(ctx, x + 5, y + 24 + walkBob, x + 5, y + 38 + walkBob, 2, 2, '#1e272e');
        this.drawCurvedLimb(ctx, x + 12, y + 24 - walkBob, x + 12, y + 38 - walkBob, 2, 2, '#1e272e');
        this.drawCurvedShoe(ctx, x + 6, y + 38 + walkBob, 8, 3, '#0f1416', '#718093');
        this.drawCurvedShoe(ctx, x + 13, y + 38 - walkBob, 8, 3, '#0f1416', '#718093');

        // Green Delivery Windbreaker & 3M Reflective Safety Stripes
        this.drawPixel(ctx, x + 2, y + 8, 16, 17, '#00b894');
        this.drawPixel(ctx, x + 2, y + 12, 16, 2, '#ffffff'); // 3M silver stripe
        this.drawPixel(ctx, x - 1, y + 14, 3, 2, '#ffffff');
        this.drawPixel(ctx, x + 16, y + 14, 3, 2, '#ffffff');

        // Thermal Insulated Delivery Backpack
        this.drawPixel(ctx, x - 6, y + 5, 8, 17, '#00a885');
        this.drawPixel(ctx, x - 4, y + 10, 4, 5, '#ffffff');
        this.drawPixel(ctx, x - 3, y + 11, 2, 3, '#e17055');

        // Delivery Helmet with Tinted Visor
        this.drawPixel(ctx, x + 2, y - 11, 16, 8, '#00a885');
        this.drawPixel(ctx, x + 4, y - 13, 12, 3, '#00b894');
        this.drawPixel(ctx, x + 4, y - 5, 12, 4, '#1e272e');
        this.drawPixel(ctx, x + 6, y - 4, 5, 1, '#55efc4'); // visor glint
        this.drawPixel(ctx, x + 5, y - 1, 1, 4, '#2d3436'); // chin strap

        // Head inside helmet
        this.drawOrganicHead(ctx, x + 10, y - 2, 6, 6, '#ffe0bd', null, isBlinking, '#2c3e50', isHappy);

        // Handheld GPS Navigation Phone
        this.drawPixel(ctx, x + 16, y + 12, 5, 8, '#2d3436');
        this.drawPixel(ctx, x + 17, y + 13, 3, 6, '#2ed573');
        this.drawPixel(ctx, x + 18, y + 15, 1, 1, '#ff4757');
        break;
      }

      case 5: { // BÁC BA TRƯỞNG PHỐ (Royal sapphire blue brocade Áo Dài with golden cloud embroidery, black Khăn Đóng, flowing silver beard, calligraphy bamboo fan, jade prayer beads)
        const pBob = Math.round(walkBob);
        const pBeard = Math.round(Math.sin(this.tick * 0.15));
        const pFan = Math.round(Math.sin(this.tick * 0.2) * 2);

        // Pristine White Silk inner pants with walking step
        this.drawPixel(ctx, x + 5, y + 25 + pBob, 4, 13, '#dfe4ea');
        this.drawPixel(ctx, x + 6, y + 25 + pBob, 2, 13, '#ffffff');
        this.drawPixel(ctx, x + 11, y + 25 - pBob, 4, 13, '#dfe4ea');
        this.drawPixel(ctx, x + 12, y + 25 - pBob, 2, 13, '#ffffff');

        // Traditional Embroidered Silk Slip-On Slippers
        this.drawPixel(ctx, x + 4, y + 38 + pBob, 6, 3, '#573312');
        this.drawPixel(ctx, x + 5, y + 38 + pBob, 5, 2, '#8b4513');
        this.drawPixel(ctx, x + 8, y + 39 + pBob, 2, 1, '#f1c40f'); // Golden embroidered toe tip

        this.drawPixel(ctx, x + 11, y + 38 - pBob, 6, 3, '#573312');
        this.drawPixel(ctx, x + 12, y + 38 - pBob, 5, 2, '#8b4513');
        this.drawPixel(ctx, x + 15, y + 39 - pBob, 2, 1, '#f1c40f');

        // Traditional Royal Sapphire Blue Brocade Áo Dài Gấm The with split panels
        // Outline / Dark shadow
        this.drawPixel(ctx, x + 2, y + 6, 16, 27, '#0c2461');
        // Base royal sapphire blue
        this.drawPixel(ctx, x + 3, y + 7, 14, 25, '#1e3799');
        // Center slit creating left and right flaps
        this.drawPixel(ctx, x + 9, y + 22, 2, 11, '#0c2461');
        // Upper chest highlight
        this.drawPixel(ctx, x + 4, y + 8, 12, 6, '#2e86de');

        // Golden Cloud & Dragon Brocade Embroidery
        this.drawPixel(ctx, x + 5, y + 11, 2, 2, '#f1c40f');
        this.drawPixel(ctx, x + 13, y + 13, 2, 2, '#f1c40f');
        this.drawPixel(ctx, x + 6, y + 18, 2, 2, '#f1c40f');
        this.drawPixel(ctx, x + 12, y + 23, 2, 2, '#f1c40f');
        this.drawPixel(ctx, x + 5, y + 27, 2, 2, '#f1c40f');
        // Golden hemline piping
        this.drawPixel(ctx, x + 3, y + 31, 6, 1, '#f1c40f');
        this.drawPixel(ctx, x + 11, y + 31, 6, 1, '#f1c40f');

        // Traditional golden frog buttons down right shoulder
        this.drawPixel(ctx, x + 12, y + 8, 2, 2, '#f5cd79');
        this.drawPixel(ctx, x + 12, y + 12, 2, 2, '#f5cd79');
        this.drawPixel(ctx, x + 12, y + 16, 2, 2, '#f5cd79');

        // Head & Wise Aged Face
        this.drawOrganicHead(ctx, x + 10, y - 2, 7, 8, '#ffe0bd', 'rgba(255, 170, 150, 0.22)', isBlinking, '#2c3e50', isHappy);

        // Traditional Multi-Layered Black Khăn Đóng (headwrap)
        this.drawPixel(ctx, x + 3, y - 9, 14, 4, '#111111');
        this.drawPixel(ctx, x + 4, y - 10, 12, 2, '#1e272e');
        this.drawPixel(ctx, x + 5, y - 8, 10, 1, '#485460'); // Fabric fold highlight

        // Flowing Long White Silver Beard cascading over chest
        this.drawPixel(ctx, x + 7 + pBeard, y + 4, 6, 6, '#ffffff');
        this.drawPixel(ctx, x + 8 + pBeard, y + 10, 4, 7, '#f5f6fa');
        this.drawPixel(ctx, x + 9 + pBeard, y + 17, 2, 5, '#dcdde1');
        // Whisker accent
        this.drawPixel(ctx, x + 8 + pBeard, y + 6, 1, 8, '#d2dae2');

        // Calligraphy Bamboo Fan with dangling red silk tassel waving
        this.drawPixel(ctx, x + 18 + pFan, y + 12, 6, 7, '#f5deb3');
        this.drawPixel(ctx, x + 19 + pFan, y + 13, 4, 5, '#ffeaa7');
        this.drawPixel(ctx, x + 17 + pFan, y + 17, 2, 3, '#8b5a2b'); // Fan handle
        // Dangling Red Silk Tassel
        this.drawPixel(ctx, x + 17 + pFan, y + 20, 1, 3, '#e74c3c');
        this.drawPixel(ctx, x + 16 + pFan, y + 23, 3, 2, '#c0392b');

        // Shimmering Jade Prayer Beads on wrist
        this.drawPixel(ctx, x + 15, y + 18, 2, 2, '#00b894');
        this.drawPixel(ctx, x + 16, y + 19, 2, 2, '#55efc4');
        this.drawPixel(ctx, x + 17, y + 18, 2, 2, '#00b894');

        // Bamboo Birdcage with chirping yellow canary
        this.drawPixel(ctx, x - 7, y + 9, 8, 1, '#cd853f'); // top bar
        this.drawPixel(ctx, x - 7, y + 9, 1, 14, '#cd853f'); // left cage rib
        this.drawPixel(ctx, x - 3, y + 9, 1, 14, '#cd853f'); // mid cage rib
        this.drawPixel(ctx, x, y + 9, 1, 14, '#cd853f'); // right cage rib
        this.drawPixel(ctx, x - 7, y + 22, 8, 2, '#8b5a2b'); // cage base
        // Canary bird inside
        this.drawPixel(ctx, x - 5, y + 15, 3, 3, '#f1fa8c');
        this.drawPixel(ctx, x - 6, y + 16, 2, 2, '#f6e58d');
        this.drawPixel(ctx, x - 3, y + 16, 1, 1, '#e17055'); // beak
        break;
      }

      case 6: { // HOÀNG QUÂN GYMER (Compression tank top with pectoral & deltoid muscle contours, athletic joggers with white racing side stripes, shaker bottle, smartwatch heart rate ♥ 115 bpm)
        const pBob = Math.round(walkBob);

        // Charcoal athletic tapered joggers with double white racing stripes
        this.drawPixel(ctx, x + 5, y + 24 + pBob, 4, 14, '#2d3436');
        this.drawPixel(ctx, x + 4, y + 25 + pBob, 1, 12, '#ffffff'); // Left racing stripe
        this.drawPixel(ctx, x + 11, y + 24 - pBob, 4, 14, '#2d3436');
        this.drawPixel(ctx, x + 15, y + 25 - pBob, 1, 12, '#ffffff'); // Right racing stripe

        // Chunky Training Sneakers with red/white air-cushion soles
        this.drawPixel(ctx, x + 3, y + 38 + pBob, 7, 3, '#c0392b');
        this.drawPixel(ctx, x + 4, y + 37 + pBob, 5, 2, '#ff4757');
        this.drawPixel(ctx, x + 3, y + 40 + pBob, 7, 1, '#ffffff'); // Air sole
        this.drawPixel(ctx, x + 6, y + 37 + pBob, 2, 1, '#2f3542'); // Laces

        this.drawPixel(ctx, x + 10, y + 38 - pBob, 7, 3, '#c0392b');
        this.drawPixel(ctx, x + 11, y + 37 - pBob, 5, 2, '#ff4757');
        this.drawPixel(ctx, x + 10, y + 40 - pBob, 7, 1, '#ffffff');
        this.drawPixel(ctx, x + 13, y + 37 - pBob, 2, 1, '#2f3542');

        // Broad Muscular Tanned Torso & Arms
        this.drawPixel(ctx, x - 2, y + 8, 4, 10, '#d49b61'); // Left deltoid/arm
        this.drawPixel(ctx, x + 18, y + 8, 4, 10, '#d49b61'); // Right deltoid/arm

        // Deep Crimson Muscle Cut-off Tank Top
        this.drawPixel(ctx, x + 2, y + 5, 16, 19, '#962d22'); // Tank outline
        this.drawPixel(ctx, x + 3, y + 6, 14, 18, '#ff4757'); // Tank body
        this.drawPixel(ctx, x + 5, y + 6, 10, 3, '#e0a96d'); // Exposed chest/collarbone
        // Pectoral contours
        this.drawPixel(ctx, x + 9, y + 9, 2, 8, '#c0392b');
        this.drawPixel(ctx, x + 5, y + 14, 10, 1, '#c0392b');
        this.drawPixel(ctx, x + 4, y + 8, 2, 14, '#ff6b81'); // Left tank highlight

        // Head & Confident Handsome Expression
        this.drawOrganicHead(ctx, x + 10, y - 2, 7, 8, '#e0a96d', 'rgba(230, 100, 100, 0.25)', isBlinking, '#111', isHappy);

        // Modern Undercut Fade Hairstyle
        this.drawPixel(ctx, x + 4, y - 10, 12, 4, '#1e272c');
        this.drawPixel(ctx, x + 3, y - 8, 14, 3, '#2f3542');

        // White Performance Sweat Headband with Crimson Logo
        this.drawPixel(ctx, x + 3, y - 6, 14, 3, '#ffffff');
        this.drawPixel(ctx, x + 9, y - 5, 2, 1, '#ff4757'); // Brand emblem

        // Smartwatch on wrist with Live Heart Rate Monitor (♥ 115 bpm)
        this.drawPixel(ctx, x - 4, y + 16, 4, 5, '#1e272e');
        this.drawPixel(ctx, x - 3, y + 17, 2, 3, '#000000');
        if ((this.tick % 16) < 8) {
          this.drawPixel(ctx, x - 3, y + 18, 2, 1, '#ff4757'); // Pulsing heart pixel
        }

        // Translucent Protein Shaker Bottle with Neon Cap
        this.drawPixel(ctx, x + 19, y + 14, 6, 11, '#ffffff');
        this.drawPixel(ctx, x + 20, y + 16, 4, 8, '#8b5a2b'); // Chocolate whey shake
        this.drawPixel(ctx, x + 23, y + 17, 1, 1, '#ffffff'); // Measurement tick
        this.drawPixel(ctx, x + 23, y + 19, 1, 1, '#ffffff');
        this.drawPixel(ctx, x + 23, y + 21, 1, 1, '#ffffff');
        this.drawPixel(ctx, x + 19, y + 12, 6, 3, '#ff793f'); // Neon orange flip cap
        this.drawPixel(ctx, x + 20, y + 11, 2, 2, '#e67e22');
        break;
      }

      case 7: { // CẶP ĐÔI GÀ BÔNG (Duy & Linh: Matching cream & strawberry hoodies, interlocking hands, shared jumbo boba cup)
        const pBob = Math.round(walkBob);

        // Duy: Cuffed dark denim jeans & high-top sneakers
        this.drawPixel(ctx, x + 3, y + 25 + pBob, 4, 13, '#2d3436');
        this.drawPixel(ctx, x + 2, y + 38 + pBob, 6, 3, '#1e272e');
        this.drawPixel(ctx, x + 2, y + 40 + pBob, 6, 1, '#ffffff');

        // Linh: Flirty knife-pleated white tennis skirt & knee-high socks & pink shoes
        this.drawPixel(ctx, x + 14, y + 25 - pBob, 4, 13, '#f5f6fa');
        this.drawPixel(ctx, x + 13, y + 38 - pBob, 6, 3, '#ff6b81');
        this.drawPixel(ctx, x + 13, y + 40 - pBob, 6, 1, '#ffffff');
        // Tennis skirt
        this.drawPixel(ctx, x + 11, y + 23, 9, 6, '#dfe4ea');
        this.drawPixel(ctx, x + 12, y + 23, 7, 5, '#ffffff');
        this.drawPixel(ctx, x + 13, y + 24, 1, 4, '#c8d6e5');
        this.drawPixel(ctx, x + 16, y + 24, 1, 4, '#c8d6e5');

        // Matching Couple Hoodies (Duy wears Cream #ffeaa7, Linh wears Strawberry #ff7675)
        // Duy's Hoodie (Left)
        this.drawPixel(ctx, x - 2, y + 7, 12, 17, '#f6e58d');
        this.drawPixel(ctx, x - 1, y + 8, 10, 15, '#ffeaa7');
        // Linh's Hoodie (Right)
        this.drawPixel(ctx, x + 10, y + 7, 12, 16, '#ee5253');
        this.drawPixel(ctx, x + 11, y + 8, 10, 14, '#ff7675');

        // Interlocking Embroidered Full Heart stitched across the seam
        this.drawPixel(ctx, x + 8, y + 12, 4, 3, '#e84118');
        this.drawPixel(ctx, x + 9, y + 15, 2, 2, '#e84118');

        // Warm Shared Chunky Knit Scarf looping tenderly around both necks
        this.drawPixel(ctx, x - 1, y + 4, 22, 5, '#f7d794');
        this.drawPixel(ctx, x, y + 5, 20, 3, '#fed330');

        // Duy Head (Left)
        this.drawOrganicHead(ctx, x + 5, y - 2, 6, 7, '#ffe0bd', null, isBlinking, '#2c1e13', isHappy);
        // Duy's fluffy hair
        this.drawPixel(ctx, x + 1, y - 9, 8, 4, '#3d312a');
        this.drawPixel(ctx, x, y - 7, 9, 3, '#2c1e13');

        // Linh Head (Right)
        this.drawOrganicHead(ctx, x + 15, y - 2, 6, 7, '#ffe0bd', 'rgba(255, 107, 129, 0.45)', isBlinking, '#2c1e13', isHappy);
        // Linh's hair & twin buns
        this.drawPixel(ctx, x + 11, y - 9, 8, 4, '#2c1e13');
        this.drawPixel(ctx, x + 10, y - 7, 9, 3, '#1a1008');
        this.drawPixel(ctx, x + 10, y - 8, 3, 3, '#2c1e13'); // Left bun
        this.drawPixel(ctx, x + 17, y - 8, 3, 3, '#2c1e13'); // Right bun
        this.drawPixel(ctx, x + 17, y - 7, 2, 2, '#ff3838'); // Cherry hairpin

        // Joint Jumbo Boba Cup with 2 Crossing Heart Straws
        this.drawPixel(ctx, x + 7, y + 15, 6, 9, '#ffffff');
        this.drawPixel(ctx, x + 8, y + 17, 4, 6, '#d2a679'); // Boba liquid
        this.drawPixel(ctx, x + 8, y + 21, 2, 2, '#2c1e13'); // Pearls
        this.drawPixel(ctx, x + 10, y + 21, 2, 2, '#2c1e13');
        // Straws
        this.drawPixel(ctx, x + 8, y + 12, 1, 4, '#0984e3'); // Blue straw (Duy)
        this.drawPixel(ctx, x + 11, y + 12, 1, 4, '#ff4757'); // Red straw (Linh)
        break;
      }

      case 8: { // DAVID TÂY BA-LÔ (Hawaiian Aloha shirt with hibiscus floral print, Panama straw hat, 35mm rangefinder camera)
        const pBob = Math.round(walkBob);

        // Multi-pocket utility cargo shorts in sand-tan
        this.drawPixel(ctx, x + 5, y + 24 + pBob, 4, 9, '#bfa17c');
        this.drawPixel(ctx, x + 6, y + 24 + pBob, 2, 8, '#d2b48c');
        this.drawPixel(ctx, x + 11, y + 24 - pBob, 4, 9, '#bfa17c');
        this.drawPixel(ctx, x + 12, y + 24 - pBob, 2, 8, '#d2b48c');

        // Tanned legs & sturdy leather trekking sandals
        this.drawPixel(ctx, x + 6, y + 33 + pBob, 3, 5, '#e0a96d');
        this.drawPixel(ctx, x + 12, y + 33 - pBob, 3, 5, '#e0a96d');
        this.drawPixel(ctx, x + 4, y + 38 + pBob, 7, 3, '#5d4037');
        this.drawPixel(ctx, x + 5, y + 39 + pBob, 5, 1, '#d2b48c'); // Sandal buckle
        this.drawPixel(ctx, x + 11, y + 38 - pBob, 7, 3, '#5d4037');
        this.drawPixel(ctx, x + 12, y + 39 - pBob, 5, 1, '#d2b48c');

        // Sunshine-Yellow Hawaiian Tropical Floral Aloha Shirt
        this.drawPixel(ctx, x + 1, y + 7, 18, 18, '#d4ac0d');
        this.drawPixel(ctx, x + 2, y + 8, 16, 16, '#f1c40f');
        // Palm Leaf & Floral Patterns
        this.drawPixel(ctx, x + 4, y + 11, 3, 2, '#2ed573');
        this.drawPixel(ctx, x + 13, y + 13, 3, 3, '#ff4757');
        this.drawPixel(ctx, x + 14, y + 14, 1, 1, '#ffffff'); // Stamen
        this.drawPixel(ctx, x + 5, y + 18, 3, 3, '#ff4757');
        this.drawPixel(ctx, x + 6, y + 19, 1, 1, '#ffffff');
        this.drawPixel(ctx, x + 11, y + 20, 3, 2, '#2ed573');

        // Open collar revealing chest
        this.drawPixel(ctx, x + 8, y + 8, 4, 4, '#ffe0bd');

        // Head & Blue Anime Eyes
        this.drawOrganicHead(ctx, x + 10, y - 2, 7, 8, '#ffe0bd', 'rgba(255, 140, 100, 0.3)', isBlinking, '#0984e3', isHappy);

        // Sun-bleached Golden Blonde Hair
        this.drawPixel(ctx, x + 3, y - 6, 14, 4, '#f9ca24');
        this.drawPixel(ctx, x + 2, y - 4, 3, 4, '#e1b12c');
        this.drawPixel(ctx, x + 15, y - 4, 3, 4, '#e1b12c');

        // Panama Straw Sun Hat with navy/red ribbon
        this.drawPixel(ctx, x, y - 8, 20, 2, '#f5deb3');
        this.drawPixel(ctx, x + 4, y - 13, 12, 5, '#f5deb3');
        this.drawPixel(ctx, x + 5, y - 14, 10, 1, '#ffeaa7'); // Crown highlight
        this.drawPixel(ctx, x + 4, y - 9, 12, 1, '#e74c3c'); // Red ribbon
        this.drawPixel(ctx, x + 4, y - 10, 12, 1, '#1e3799'); // Navy ribbon

        // Polarized Aviator Sunglasses
        this.drawPixel(ctx, x + 6, y - 3, 3, 2, '#00d2d3');
        this.drawPixel(ctx, x + 11, y - 3, 3, 2, '#00d2d3');
        this.drawPixel(ctx, x + 5, y - 4, 10, 1, '#f1c40f'); // Golden frame

        // Vintage 35mm Rangefinder Camera
        this.drawPixel(ctx, x + 5, y + 9, 1, 6, '#8b5a2b'); // Leather strap
        this.drawPixel(ctx, x + 14, y + 9, 1, 6, '#8b5a2b');
        this.drawPixel(ctx, x + 5, y + 14, 10, 7, '#2d3436');
        this.drawPixel(ctx, x + 5, y + 14, 10, 2, '#bdc3c7'); // Silver top plate
        this.drawPixel(ctx, x + 8, y + 16, 4, 4, '#00cec9'); // Cyan lens
        this.drawPixel(ctx, x + 9, y + 17, 1, 1, '#ffffff'); // Glass catchlight
        break;
      }

      case 9: { // BÉ HẠNH VÉ SỐ & CÚN VÀNG (Denim dungaree overalls with embroidered cartoon duckling, sunshine yellow striped tee, Nón Tai Bèo, lucky lottery board, golden puppy)
        const pBob = Math.round(walkBob);

        // Dark Indigo Denim Dungarees
        this.drawPixel(ctx, x + 5, y + 24 + pBob, 4, 14, '#2c3e50');
        this.drawPixel(ctx, x + 11, y + 24 - pBob, 4, 14, '#2c3e50');

        // Legendary Vietnamese Honeycomb Sandals (Dép Tổ Ong trắng huyền thoại)
        this.drawPixel(ctx, x + 4, y + 38 + pBob, 7, 3, '#f5f6fa');
        this.drawPixel(ctx, x + 5, y + 39 + pBob, 1, 1, '#bdc3c7'); // Honeycomb dots
        this.drawPixel(ctx, x + 7, y + 39 + pBob, 1, 1, '#bdc3c7');
        this.drawPixel(ctx, x + 9, y + 39 + pBob, 1, 1, '#bdc3c7');

        this.drawPixel(ctx, x + 10, y + 38 - pBob, 7, 3, '#f5f6fa');
        this.drawPixel(ctx, x + 11, y + 39 - pBob, 1, 1, '#bdc3c7');
        this.drawPixel(ctx, x + 13, y + 39 - pBob, 1, 1, '#bdc3c7');
        this.drawPixel(ctx, x + 15, y + 39 - pBob, 1, 1, '#bdc3c7');

        // Sunshine Yellow & White Striped Tee
        this.drawPixel(ctx, x + 2, y + 7, 16, 17, '#f1c40f');
        this.drawPixel(ctx, x + 2, y + 9, 16, 2, '#ffffff');
        this.drawPixel(ctx, x + 2, y + 13, 16, 2, '#ffffff');

        // Denim Dungaree Overalls on top with brass buckles
        this.drawPixel(ctx, x + 4, y + 14, 12, 11, '#2980b9');
        this.drawPixel(ctx, x + 4, y + 8, 2, 7, '#2980b9'); // Left strap
        this.drawPixel(ctx, x + 14, y + 8, 2, 7, '#2980b9'); // Right strap
        this.drawPixel(ctx, x + 4, y + 14, 2, 2, '#f39c12'); // Brass buttons
        this.drawPixel(ctx, x + 14, y + 14, 2, 2, '#f39c12');

        // Embroidered Cute Little Yellow Duckling on bib pocket
        this.drawPixel(ctx, x + 9, y + 17, 3, 3, '#ffeaa7');
        this.drawPixel(ctx, x + 12, y + 17, 1, 1, '#e17055'); // duck beak

        // Traditional Checkered Khăn Rằn around neck
        this.drawPixel(ctx, x + 4, y + 5, 12, 3, '#f5f6fa');
        this.drawPixel(ctx, x + 6, y + 5, 2, 3, '#2f3640');
        this.drawPixel(ctx, x + 10, y + 5, 2, 3, '#2f3640');
        // Dangling knotted fringe tassel
        this.drawPixel(ctx, x + 3, y + 8, 2, 7, '#f5f6fa');
        this.drawPixel(ctx, x + 3, y + 10, 2, 2, '#2f3640');
        this.drawPixel(ctx, x + 3, y + 13, 2, 2, '#2f3640');

        // Head & Radiant Sun-kissed Smiling Face with Rosy Cheeks
        this.drawOrganicHead(ctx, x + 10, y - 2, 7, 8, '#ffe0bd', 'rgba(255, 107, 129, 0.4)', isBlinking, '#2c1e13', true);

        // Weathered Olive-Green Floppy Bucket Hat (Nón Tai Bèo) with lucky clover
        this.drawPixel(ctx, x, y - 7, 20, 2, '#556b2f');
        this.drawPixel(ctx, x + 4, y - 13, 12, 6, '#556b2f');
        this.drawPixel(ctx, x + 5, y - 14, 10, 1, '#6b8e23'); // Highlight crown
        this.drawPixel(ctx, x + 13, y - 10, 2, 2, '#2ecc71'); // Lucky clover pin

        // Clear Acrylic Display Board with Lucky Rainbow Lottery Tickets
        this.drawPixel(ctx, x + 16, y + 12, 8, 14, '#dfe4ea');
        this.drawPixel(ctx, x + 17, y + 13, 6, 12, '#ffffff');
        this.drawPixel(ctx, x + 17, y + 14, 6, 2, '#ff7675'); // Red tickets
        this.drawPixel(ctx, x + 17, y + 17, 6, 2, '#ffeaa7'); // Yellow tickets
        this.drawPixel(ctx, x + 17, y + 20, 6, 2, '#74b9ff'); // Blue tickets
        this.drawPixel(ctx, x + 16, y + 18, 8, 1, '#e74c3c'); // Rubber band

        // Adorable Golden Puppy (Chú Cún Vàng) sitting faithfully at her feet
        const pupTail = Math.round(Math.sin(this.tick * 0.3));
        this.drawPixel(ctx, x - 9, y + 31, 7, 6, '#f39c12'); // Puppy body
        this.drawPixel(ctx, x - 10, y + 27, 5, 5, '#f39c12'); // Puppy head
        this.drawPixel(ctx, x - 11, y + 28, 2, 4, '#d35400'); // Floppy ear
        this.drawPixel(ctx, x - 8, y + 28, 1, 1, '#111111'); // Puppy eye
        this.drawPixel(ctx, x - 10, y + 30, 1, 1, '#111111'); // Puppy nose
        // Red collar & bell
        this.drawPixel(ctx, x - 9, y + 31, 3, 1, '#e74c3c');
        this.drawPixel(ctx, x - 8, y + 32, 1, 1, '#f1c40f');
        // Wagging tail
        this.drawPixel(ctx, x - 3, y + 31 + pupTail, 2, 2, '#f39c12');
        break;
      }
    }

    // --- Shared hair gloss & outfit finishing for extra polish ---
    // (drawn after each archetype's costume so details stay readable underneath)
    if (type === 7) {
      // Couple: separate gloss for Duy and Linh
      this.drawHairGloss(ctx, x + 5, y - 4.5, 0.65);
      this.drawHairGloss(ctx, x + 15, y - 4.5, 0.65);
      this.drawFabricFinish(ctx, x + 4, y + 7, 12, 18);
      this.drawFabricFinish(ctx, x + 16, y + 7, 12, 17);
    } else if (type === 4) {
      // Shipper wears a helmet, so only the jacket gets fabric finishing.
      this.drawHairGloss(ctx, x + 9.5, y - 6, 0.8);
      this.drawFabricFinish(ctx, x + 9.5, y + 7, 17, 19);
    } else if (type === 5) {
      // Elder: gloss stays on the khan-dong silk wrap, áo dài gets a rich sheen.
      this.drawHairGloss(ctx, x + 9.5, y - 6.5, 0.8);
      this.drawFabricFinish(ctx, x + 9.5, y + 6, 17, 27, 'rgba(0, 10, 40, 0.25)');
    } else {
      this.drawHairGloss(ctx, x + 9.5, y - 5, 0.85);
      this.drawFabricFinish(ctx, x + 9.5, y + 7, 17, 18);
    }

    // --- CUSTOMER DRINKING HAPPINESS EFFECTS (Floating Hearts & Sipping Boba) ---
    if (isHappy) {
      // Floating Pixel Pink Hearts drifting above head
      for (let h = 0; h < 3; h++) {
        const hOffset = Math.round(Math.sin(this.tick * 0.15 + h * 2) * 3);
        const hY = Math.round(y - 14 - h * 7 - ((this.tick * 0.6) % 12));
        const hX = Math.round(x + 3 + h * 7 + hOffset);
        this.drawPixel(ctx, hX - 2, hY, 2, 2, '#ff7675');
        this.drawPixel(ctx, hX + 1, hY, 2, 2, '#ff7675');
        this.drawPixel(ctx, hX - 2, hY + 2, 5, 2, '#ff7675');
        this.drawPixel(ctx, hX - 1, hY + 4, 3, 1, '#ff7675');
        this.drawPixel(ctx, hX, hY + 5, 1, 1, '#ff7675');
      }

      // Customer holds mini boba cup and sips with straw
      const cupX = x + 7;
      const cupY = y + 8;
      this.drawPixel(ctx, cupX, cupY, 7, 10, '#ffffff');
      this.drawPixel(ctx, cupX + 1, cupY + 3, 5, 6, '#f39c12'); // milk tea
      this.drawPixel(ctx, cupX + 2, cupY + 7, 3, 2, '#111111'); // boba pearls
      // Pixel straw leading up to mouth
      this.drawPixel(ctx, cupX + 3, cupY - 2, 1, 5, '#e74c3c');
      this.drawPixel(ctx, cupX + 4, cupY - 4, 1, 2, '#e74c3c');
    }

    // --- CUTE PET COMPANION (Mèo Tam Thể hoặc Cún Poodle đi theo khách hàng dẫn đầu) ---
    if (isFront && (!this.queue || this.queue.length <= 1 || x <= 195)) {
      const petX = x - 18;
      const petY = y + 28;
      // Pet shadow
      ctx.fillStyle = 'rgba(10, 5, 12, 0.3)';
      ctx.beginPath();
      ctx.ellipse(petX + 6, petY + 12, 8, 3, 0, 0, Math.PI * 2);
      ctx.fill();

      if (type % 2 === 0) { // CÚN POODLE VÀNG LÔNG XOĂN (theo chân Bé Lan / Cô Ba)
        ctx.fillStyle = '#e5a65e'; // Golden apricot fur
        ctx.fillRect(petX + 2, petY + 2 + petBob, 10, 8); // body
        ctx.fillRect(petX + 8, petY - 4 + petBob, 7, 7); // head
        ctx.fillRect(petX + 13, petY - 2 + petBob, 3, 5); // floppy ears
        // Red collar with gold bell
        ctx.fillStyle = '#e74c3c';
        ctx.fillRect(petX + 7, petY + 2 + petBob, 3, 2);
        ctx.fillStyle = '#f4c430'; // bell
        ctx.fillRect(petX + 8, petY + 4 + petBob, 2, 2);
        // Paws
        ctx.fillStyle = '#c8853b';
        ctx.fillRect(petX + 3, petY + 9, 3, 4);
        ctx.fillRect(petX + 8, petY + 9, 3, 4);
        // Wagging tail
        ctx.fillRect(petX - 1, petY + 2 + petTail, 3, 3);
      } else { // MÈO TAM THỂ MƯỚP (theo chân Dân văn phòng / TikToker / Shipper)
        ctx.fillStyle = '#fff'; // White fur
        ctx.fillRect(petX + 2, petY + 3 + petBob, 9, 7); // body
        ctx.fillStyle = '#e67e22'; // orange calico patch
        ctx.fillRect(petX + 4, petY + 4 + petBob, 4, 3);
        ctx.fillStyle = '#fff';
        ctx.fillRect(petX + 7, petY - 3 + petBob, 6, 6); // head
        // Pointed Cat ears
        ctx.fillStyle = '#e67e22';
        ctx.fillRect(petX + 7, petY - 5 + petBob, 2, 2);
        ctx.fillStyle = '#2c3e50';
        ctx.fillRect(petX + 11, petY - 5 + petBob, 2, 2);
        // Green eyes
        ctx.fillStyle = '#2ecc71';
        ctx.fillRect(petX + 11, petY - 1 + petBob, 1, 2);
        // Paws
        ctx.fillStyle = '#eee';
        ctx.fillRect(petX + 3, petY + 9, 2, 3);
        ctx.fillRect(petX + 8, petY + 9, 2, 3);
        // Curled swinging tail
        ctx.fillStyle = '#e67e22';
        ctx.fillRect(petX - 2, petY + petTail, 2, 5);
      }
    }

    // --- DRINKING SIP ANIMATION WHEN SERVED ---
    if (this.isDrinking && isFront) {
      // Customer holds cup to mouth
      ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
      ctx.fillRect(x + 7, y + 4, 8, 11);
      ctx.fillStyle = '#a0522d';
      ctx.fillRect(x + 8, y + 6 + (1 - this.drinkLevel) * 7, 6, 7 * this.drinkLevel);
      // Straw into mouth
      ctx.fillStyle = '#e74c3c';
      ctx.fillRect(x + 10, y - 1, 2, 6);
      // Heart eyes!
      ctx.fillStyle = '#ff7675';
      ctx.font = '10px monospace';
      ctx.fillText('😍', x + 5, y - 2);
    }

    // Emotion & Typewriter Speech Bubble (Only for Front Waiting Customer)
    const activeQuote = quote || this.customerQuote;
    if (isFront && this.customerState === 'waiting' && x >= 175 && !this.isDrinking) {
      const bubbleBob = Math.sin(this.tick * 0.15) * 2;
      const bx = x + 10;
      const by = y - 24 + bubbleBob;

      if (this.bubbleType === 'dialogue' && activeQuote) {
        // Retro Pixel Comic Dialogue Bubble
        const textWidth = Math.min(130, ctx.measureText(activeQuote).width + 16);
        const bw = Math.max(90, textWidth);
        const bh = 22;
        const boxX = Math.min(this.width - bw - 5, bx - bw / 2 + 5);
        const boxY = by - 12;

        ctx.fillStyle = '#fff8dc';
        ctx.fillRect(boxX, boxY, bw, bh);
        ctx.strokeStyle = '#8b4513';
        ctx.lineWidth = 1.5;
        ctx.strokeRect(boxX, boxY, bw, bh);

        // Tail pointing down to customer
        ctx.fillStyle = '#fff8dc';
        ctx.beginPath();
        ctx.moveTo(bx - 3, boxY + bh);
        ctx.lineTo(bx + 1, boxY + bh + 6);
        ctx.lineTo(bx + 5, boxY + bh);
        ctx.fill();

        ctx.fillStyle = '#1a1016';
        ctx.font = 'bold 9px monospace';
        ctx.fillText(activeQuote.slice(0, 22), boxX + 4, boxY + 10);
        if (activeQuote.length > 22) {
          ctx.fillText(activeQuote.slice(22, 44), boxX + 4, boxY + 18);
        }
      } else {
        // Classic Round Bubble
        ctx.fillStyle = '#fff';
        ctx.beginPath();
        ctx.arc(bx, by, 12, 0, Math.PI * 2);
        ctx.fill();

        // Tail
        ctx.beginPath();
        ctx.moveTo(bx - 3, by + 10);
        ctx.lineTo(bx - 1, by + 18);
        ctx.lineTo(bx + 4, by + 9);
        ctx.fill();

        ctx.font = '13px monospace';
        if (this.bubbleType === 'boba') {
          ctx.fillText('🧋', bx - 7, by + 4);
        } else if (this.bubbleType === 'heart') {
          ctx.fillText('💖', bx - 7, by + 4);
        } else if (this.bubbleType === 'angry') {
          ctx.fillText('💢', bx - 7, by + 4);
        }
      }
    }
  }

  drawDetailedCup(ctx, x, y, drink) {
    // 1. Soft Cup Shadow on marble countertop
    ctx.fillStyle = 'rgba(10, 5, 12, 0.45)';
    ctx.beginPath();
    ctx.ellipse(x + 10, y + 26, 11, 3.5, 0, 0, Math.PI * 2);
    ctx.fill();

    // 2. Tapered Transparent Cup Geometry
    const topW = 20;
    const botW = 15;
    const cupH = 25;
    const topL = x;
    const topR = x + topW;
    const botL = x + (topW - botW) / 2;
    const botR = botL + botW;

    // Cup background glass translucency
    ctx.fillStyle = 'rgba(255, 255, 255, 0.35)';
    ctx.beginPath();
    ctx.moveTo(topL, y + 3);
    ctx.lineTo(topR, y + 3);
    ctx.lineTo(botR, y + cupH);
    ctx.quadraticCurveTo(botR, y + cupH + 1.5, botR - 1.5, y + cupH + 1.5);
    ctx.lineTo(botL + 1.5, y + cupH + 1.5);
    ctx.quadraticCurveTo(botL, y + cupH + 1.5, botL, y + cupH);
    ctx.closePath();
    ctx.fill();

    // 3. Beverage Liquid Color Gradient
    let teaTop = '#d35400';
    let teaBot = '#873600';
    let foamColor = null;

    if (drink.tea === 'thai_xanh') {
      teaTop = '#2ecc71';
      teaBot = '#1e824c';
    } else if (drink.tea === 'sua_tuoi') {
      teaTop = '#ffffff';
      teaBot = '#e8ebed';
    } else if (drink.tea === 'lai') {
      teaTop = '#f9ca24';
      teaBot = '#f0932b';
    } else if (drink.tea === 'olong_nuong') {
      teaTop = '#e67e22';
      teaBot = '#a04000';
      foamColor = '#fffbe7'; // Thick cheese foam crown
    } else {
      teaTop = '#ca6f1e';
      teaBot = '#784212';
    }

    const teaGrad = ctx.createLinearGradient(0, y + 6, 0, y + cupH);
    teaGrad.addColorStop(0, teaTop);
    teaGrad.addColorStop(1, teaBot);

    ctx.fillStyle = teaGrad;
    ctx.beginPath();
    ctx.moveTo(topL + 1, y + 6);
    ctx.lineTo(topR - 1, y + 6);
    ctx.lineTo(botR - 0.5, y + cupH);
    ctx.lineTo(botL + 0.5, y + cupH);
    ctx.closePath();
    ctx.fill();

    // Marbling Brown Sugar Syrup Streaks if Fresh Milk
    if (drink.tea === 'sua_tuoi') {
      ctx.fillStyle = '#6e2c00';
      ctx.beginPath();
      ctx.moveTo(botL + 2, y + cupH);
      ctx.quadraticCurveTo(botL + 5, y + 15, botL + 3, y + 10);
      ctx.quadraticCurveTo(botL + 7, y + 17, botL + 6, y + cupH);
      ctx.fill();

      ctx.beginPath();
      ctx.moveTo(botR - 3, y + cupH);
      ctx.quadraticCurveTo(botR - 6, y + 14, botR - 4, y + 9);
      ctx.quadraticCurveTo(botR - 8, y + 16, botR - 7, y + cupH);
      ctx.fill();
    }

    // 4. Spherical Boba Tapioca Pearls with Highlights
    if (drink.toppings && drink.toppings.length > 0) {
      const pearls = [
        { px: botL + 3, py: y + 23 },
        { px: botL + 7, py: y + 24 },
        { px: botL + 11, py: y + 23 },
        { px: botL + 4.5, py: y + 19.5 },
        { px: botL + 9, py: y + 20 },
        { px: botL + 7, py: y + 16.5 }
      ];

      pearls.forEach(p => {
        ctx.fillStyle = '#110a08';
        ctx.beginPath();
        ctx.arc(p.px, p.py, 2.3, 0, Math.PI * 2);
        ctx.fill();
        // Pearl glossy specular highlight dot
        ctx.fillStyle = 'rgba(255, 255, 255, 0.75)';
        ctx.beginPath();
        ctx.arc(p.px - 0.7, p.py - 0.7, 0.7, 0, Math.PI * 2);
        ctx.fill();
      });
    }

    // 5. Faceted Floating Ice Cubes
    ctx.fillStyle = 'rgba(255, 255, 255, 0.55)';
    ctx.beginPath();
    ctx.roundRect(x + 3.5, y + 9, 4.5, 4.5, 1);
    ctx.roundRect(x + 11.5, y + 10.5, 4.5, 4.5, 1);
    ctx.fill();
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.8)';
    ctx.lineWidth = 0.6;
    ctx.stroke();

    // 6. Fluffy Cheese Foam / Cream Top with Torched Brulee Spots
    if (foamColor) {
      ctx.fillStyle = foamColor;
      ctx.beginPath();
      ctx.roundRect(topL + 1, y + 5, topW - 2, 5.5, [2, 2, 0, 0]);
      ctx.fill();
      ctx.fillStyle = '#a04000';
      ctx.beginPath();
      ctx.ellipse(x + 7, y + 6.5, 2, 1, 0, 0, Math.PI * 2);
      ctx.ellipse(x + 13, y + 7, 2.5, 1, 0, 0, Math.PI * 2);
      ctx.fill();
    }

    // 7. Crystal Specular Glare Lines on Cup Edge
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.55)';
    ctx.lineWidth = 1.2;
    ctx.beginPath();
    ctx.moveTo(topL + 2, y + 6);
    ctx.lineTo(botL + 2, y + cupH - 2);
    ctx.stroke();

    // 8. Cup Lip Rim & Dome Lid
    ctx.fillStyle = 'rgba(255, 255, 255, 0.85)';
    ctx.beginPath();
    ctx.roundRect(topL - 1, y + 3, topW + 2, 2.5, 1.2);
    ctx.fill();

    // Crystal Dome Lid
    ctx.fillStyle = 'rgba(255, 255, 255, 0.65)';
    ctx.beginPath();
    ctx.arc(x + topW / 2, y + 3, 8.5, Math.PI, 0);
    ctx.fill();
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.9)';
    ctx.lineWidth = 0.8;
    ctx.beginPath();
    ctx.arc(x + topW / 2, y + 3, 8.5, Math.PI, 0);
    ctx.stroke();

    // 9. Angled Striped Boba Straw
    const strawX = x + 12;
    const strawY = y - 8;
    ctx.fillStyle = '#e74c3c'; // ruby red
    ctx.beginPath();
    ctx.roundRect(strawX, strawY, 3.2, 16, 1);
    ctx.fill();
    // Spiral white stripe on straw
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(strawX + 0.5, strawY + 2, 2.2, 2);
    ctx.fillRect(strawX + 0.5, strawY + 7, 2.2, 2);
    ctx.fillRect(strawX + 0.5, strawY + 12, 2.2, 2);
  }

  drawParticles(ctx) {
    // Sparkle particles
    this.particles.forEach(p => {
      ctx.fillStyle = p.color;
      ctx.globalAlpha = p.life / p.maxLife;
      ctx.fillRect(p.x, p.y, p.size, p.size);
    });
    ctx.globalAlpha = 1.0;

    // Floating text numbers (+15.000đ ⭐)
    this.floatingTexts.forEach(ft => {
      ctx.fillStyle = ft.color;
      ctx.globalAlpha = Math.max(0, ft.alpha);
      ctx.font = 'bold 14px monospace';
      ctx.fillText(ft.text, ft.x, ft.y);
    });
    ctx.globalAlpha = 1.0;
  }

  // --- PET & THIEF SYSTEM METHODS ---

  setActivePet(petId, isStolen = false) {
    this.activePet = petId;
    this.isPetStolen = !!isStolen;
  }

  spawnThief() {
    if (this.thief) return;
    this.thief = {
      x: 375,
      y: 138,
      state: 'pacing_left', // 'pacing_left', 'glancing', 'pacing_right', 'approaching_pet', 'snatching', 'escaping'
      passCount: 0,
      maxPasses: 2, // Paces back and forth 2-3 times before snatching
      runSpeed: 1.0,
      bubble: '👀 ...',
      tick: 0,
      glanceTimer: 0
    };
  }

  shooThief() {
    if (!this.thief || this.thief.state === 'escaping') return false;
    this.thief.state = 'escaping';
    this.thief.runSpeed = 4.8;
    this.thief.bubble = '😱 Á BỊ BẮT RỒI!';

    // Add floating vigilance reward text
    this.floatingTexts.push({
      text: '+10.000đ BẮT TRỘM! ⭐',
      x: Math.min(240, Math.max(20, this.thief.x - 20)),
      y: 100,
      alpha: 1.0,
      color: '#ffd700'
    });

    // Alert & startled dust/sparkle particles
    for (let i = 0; i < 20; i++) {
      this.particles.push({
        x: this.thief.x + 8 + (Math.random() * 16 - 8),
        y: 140 + (Math.random() * 16 - 8),
        vx: (Math.random() - 0.5) * 4.5,
        vy: -Math.random() * 3.5 - 0.5,
        life: 35,
        maxLife: 35,
        color: ['#f1c40f', '#e74c3c', '#ffffff', '#3498db'][Math.floor(Math.random() * 4)],
        size: Math.random() > 0.5 ? 3 : 2
      });
    }

    if (this.onThiefCaught) {
      this.onThiefCaught();
    }
    return true;
  }

  checkThiefClick(clickX, clickY) {
    if (!this.thief || this.thief.state === 'escaping') return false;
    const tx = this.thief.x;
    const ty = 138;
    // Hitbox covering the crouching thief sprite
    if (clickX >= tx - 15 && clickX <= tx + 35 && clickY >= ty - 15 && clickY <= ty + 45) {
      return this.shooThief();
    }
    return false;
  }

  drawStorePet(ctx) {
    // Sits beside the front-left corner of the cart stall
    const px = 20;
    const py = 150;

    // 1. Cozy Pet Cushion / Pillow Base (always drawn if pet is owned)
    if (!this.activePet && !this.isPetStolen) return;

    // Cushion Shadow
    ctx.fillStyle = 'rgba(0, 0, 0, 0.35)';
    ctx.beginPath();
    ctx.ellipse(px + 12, py + 18, 16, 5, 0, 0, Math.PI * 2);
    ctx.fill();

    // Cushion Main Pillow (Warm peach / coral with soft quilting)
    ctx.fillStyle = '#ff7675';
    ctx.beginPath();
    ctx.ellipse(px + 12, py + 16, 15, 6, 0, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = '#fab1a0';
    ctx.beginPath();
    ctx.ellipse(px + 12, py + 14.5, 13, 4.5, 0, 0, Math.PI * 2);
    ctx.fill();

    // Cute white paw print emblem in center of pillow
    ctx.fillStyle = 'rgba(255, 255, 255, 0.5)';
    ctx.beginPath();
    ctx.arc(px + 12, py + 14, 2, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.arc(px + 10, py + 12.5, 0.9, 0, Math.PI * 2);
    ctx.arc(px + 12, py + 11.8, 0.9, 0, Math.PI * 2);
    ctx.arc(px + 14, py + 12.5, 0.9, 0, Math.PI * 2);
    ctx.fill();

    // 2. STOLEN STATE: Broken chain, empty bed, warning alert
    if (this.isPetStolen) {
      // Broken silver collar chain lying limp on pillow
      ctx.strokeStyle = '#bdc3c7';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.arc(px + 8, py + 13, 2.5, 0, Math.PI * 1.5);
      ctx.stroke();
      ctx.beginPath();
      ctx.arc(px + 13, py + 14, 2.5, 0.5, Math.PI * 1.8);
      ctx.stroke();

      // Floating emergency alert tag
      const bounce = Math.sin(this.tick * 0.1) * 2;
      ctx.fillStyle = '#e74c3c';
      ctx.beginPath();
      ctx.roundRect(px - 5, py - 6 + bounce, 34, 11, 3);
      ctx.fill();
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 1;
      ctx.stroke();

      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 6.5px monospace';
      ctx.fillText('BỊ BẮT! 🚨', px - 2, py + 2 + bounce);
      return;
    }

    // 3. ACTIVE PET SPRITES: High-fidelity Vector Art
    const petKey = this.activePet;

    // --- A. CÚN CORGI CHÂN NGẮN MÔNG TRÁI TIM ---
    if (petKey === 'pet_corgi' || petKey === 'corgi') {
      const bob = Math.sin(this.tick * 0.08) * 0.8;
      const tailWag = Math.sin(this.tick * 0.28) * 3;

      // Stubby Heart-shaped Butt / Wagging Tail
      ctx.fillStyle = '#e58e26'; // Honey gold
      ctx.beginPath();
      ctx.arc(px + 3 + tailWag, py + 9 + bob, 3, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#ffffff'; // White tip
      ctx.beginPath();
      ctx.arc(px + 2 + tailWag, py + 9 + bob, 1.5, 0, Math.PI * 2);
      ctx.fill();

      // Chubby Body
      ctx.fillStyle = '#e58e26';
      ctx.beginPath();
      ctx.ellipse(px + 10, py + 10 + bob, 9, 6, -0.05, 0, Math.PI * 2);
      ctx.fill();

      // Snowy White Chest & Belly
      ctx.fillStyle = '#ffffff';
      ctx.beginPath();
      ctx.ellipse(px + 14, py + 11 + bob, 5, 5, 0.2, 0, Math.PI * 2);
      ctx.fill();

      // Short Stubby White Paws
      ctx.fillStyle = '#ffffff';
      ctx.beginPath();
      ctx.roundRect(px + 9, py + 13 + bob, 3.5, 4, 1.5);
      ctx.roundRect(px + 15, py + 13 + bob, 3.5, 4, 1.5);
      ctx.fill();

      // Head
      ctx.fillStyle = '#e58e26';
      ctx.beginPath();
      ctx.arc(px + 16, py + 5 + bob, 6.5, 0, Math.PI * 2);
      ctx.fill();

      // White Blaze on Forehead
      ctx.fillStyle = '#ffffff';
      ctx.beginPath();
      ctx.moveTo(px + 16, py - 1 + bob);
      ctx.lineTo(px + 14.5, py + 7 + bob);
      ctx.lineTo(px + 17.5, py + 7 + bob);
      ctx.closePath();
      ctx.fill();

      // Fox-like Upright Triangular Ears
      ctx.fillStyle = '#d35400';
      ctx.beginPath();
      ctx.moveTo(px + 11.5, py + 2 + bob);
      ctx.lineTo(px + 10, py - 5 + bob);
      ctx.lineTo(px + 15, py - 1 + bob);
      ctx.closePath();
      ctx.fill();

      ctx.beginPath();
      ctx.moveTo(px + 17, py - 1 + bob);
      ctx.lineTo(px + 21, py - 5 + bob);
      ctx.lineTo(px + 20.5, py + 2 + bob);
      ctx.closePath();
      ctx.fill();

      // Pink Inner Ear
      ctx.fillStyle = '#fab1a0';
      ctx.beginPath();
      ctx.moveTo(px + 12, py + 1 + bob);
      ctx.lineTo(px + 11, py - 3 + bob);
      ctx.lineTo(px + 14, py - 0.5 + bob);
      ctx.closePath();
      ctx.fill();

      // Sparkly Anime Eyes
      ctx.fillStyle = '#2c3e50';
      ctx.beginPath();
      ctx.arc(px + 14, py + 4.5 + bob, 1.2, 0, Math.PI * 2);
      ctx.arc(px + 18, py + 4.5 + bob, 1.2, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#ffffff';
      ctx.beginPath();
      ctx.arc(px + 13.8, py + 4.1 + bob, 0.5, 0, Math.PI * 2);
      ctx.arc(px + 17.8, py + 4.1 + bob, 0.5, 0, Math.PI * 2);
      ctx.fill();

      // Cute Black Snout
      ctx.fillStyle = '#2d3436';
      ctx.beginPath();
      ctx.ellipse(px + 16, py + 6.2 + bob, 1.2, 0.8, 0, 0, Math.PI * 2);
      ctx.fill();

      // Cheerful Open Mouth & Panting Pink Tongue
      ctx.fillStyle = '#ff7675';
      ctx.beginPath();
      ctx.ellipse(px + 16, py + 8.2 + bob, 1.2, 1.8, 0, 0, Math.PI * 2);
      ctx.fill();

      // Teal Bandana Collar with Gold Coin Tag
      ctx.fillStyle = '#16a085';
      ctx.beginPath();
      ctx.moveTo(px + 11.5, py + 9.5 + bob);
      ctx.lineTo(px + 16, py + 12 + bob);
      ctx.lineTo(px + 19.5, py + 9.5 + bob);
      ctx.closePath();
      ctx.fill();

      ctx.fillStyle = '#f1c40f'; // Golden medal
      ctx.beginPath();
      ctx.arc(px + 16, py + 12.5 + bob, 1.2, 0, Math.PI * 2);
      ctx.fill();

      // Periodic Cute Bark Bubble
      if (Math.floor(this.tick / 60) % 4 === 0) {
        ctx.fillStyle = '#ffffff';
        ctx.beginPath();
        ctx.roundRect(px + 18, py - 12 + bob, 18, 9, 3);
        ctx.fill();
        ctx.fillStyle = '#e67e22';
        ctx.font = 'bold 6.5px monospace';
        ctx.fillText('Gâu!🐾', px + 19.5, py - 5.5 + bob);
      }
    }

    // --- B. MÈO TAM THỂ CHIÊU TÀI MANEKI NEKO ---
    else if (petKey === 'pet_meo_tam_the' || petKey === 'meo_tam_the') {
      const bob = Math.sin(this.tick * 0.07) * 0.6;
      const waveY = Math.sin(this.tick * 0.16) * 3; // Waving fortune paw

      // White Body with Calico Patches
      ctx.fillStyle = '#ffffff';
      ctx.beginPath();
      ctx.ellipse(px + 12, py + 10 + bob, 8, 7, 0, 0, Math.PI * 2);
      ctx.fill();

      // Calico Patch on Back (Ginger & Charcoal)
      ctx.fillStyle = '#e67e22'; // Ginger
      ctx.beginPath();
      ctx.ellipse(px + 7, py + 8 + bob, 3.5, 3.5, 0.3, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#2d3436'; // Charcoal
      ctx.beginPath();
      ctx.ellipse(px + 9, py + 13 + bob, 3, 2.5, -0.2, 0, Math.PI * 2);
      ctx.fill();

      // Cat Head
      ctx.fillStyle = '#ffffff';
      ctx.beginPath();
      ctx.arc(px + 12, py + 4.5 + bob, 6, 0, Math.PI * 2);
      ctx.fill();

      // Orange Ear Patch
      ctx.fillStyle = '#e67e22';
      ctx.beginPath();
      ctx.arc(px + 9, py + 3 + bob, 3.5, 0, Math.PI * 2);
      ctx.fill();

      // Pointed Cat Ears
      ctx.fillStyle = '#e67e22'; // Left ear
      ctx.beginPath();
      ctx.moveTo(px + 7, py + 2 + bob);
      ctx.lineTo(px + 7.5, py - 4 + bob);
      ctx.lineTo(px + 11, py + 0.5 + bob);
      ctx.closePath();
      ctx.fill();

      ctx.fillStyle = '#2d3436'; // Right ear (Charcoal)
      ctx.beginPath();
      ctx.moveTo(px + 13, py + 0.5 + bob);
      ctx.lineTo(px + 16.5, py - 4 + bob);
      ctx.lineTo(px + 17, py + 2 + bob);
      ctx.closePath();
      ctx.fill();

      // Pink Inner Ear
      ctx.fillStyle = '#ff7675';
      ctx.beginPath();
      ctx.moveTo(px + 8, py + 1 + bob);
      ctx.lineTo(px + 8.5, py - 2.5 + bob);
      ctx.lineTo(px + 10.5, py + 0.5 + bob);
      ctx.closePath();
      ctx.fill();

      // Curved Happy Eyes (^ ^)
      ctx.strokeStyle = '#2d3436';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.arc(px + 10, py + 4.5 + bob, 1.4, Math.PI, 0);
      ctx.stroke();
      ctx.beginPath();
      ctx.arc(px + 14, py + 4.5 + bob, 1.4, Math.PI, 0);
      ctx.stroke();

      // Cute Pink Nose & Whiskers
      ctx.fillStyle = '#ff7675';
      ctx.beginPath();
      ctx.arc(px + 12, py + 5.8 + bob, 0.8, 0, Math.PI * 2);
      ctx.fill();

      ctx.strokeStyle = '#b2bec3';
      ctx.lineWidth = 0.6;
      ctx.beginPath();
      ctx.moveTo(px + 7, py + 5.5 + bob); ctx.lineTo(px + 4, py + 5 + bob);
      ctx.moveTo(px + 7, py + 6.5 + bob); ctx.lineTo(px + 4, py + 7.5 + bob);
      ctx.moveTo(px + 17, py + 5.5 + bob); ctx.lineTo(px + 20, py + 5 + bob);
      ctx.moveTo(px + 17, py + 6.5 + bob); ctx.lineTo(px + 20, py + 7.5 + bob);
      ctx.stroke();

      // Red Ribbon Collar with Shiny Golden Bell
      ctx.fillStyle = '#e74c3c';
      ctx.beginPath();
      ctx.roundRect(px + 8, py + 8.5 + bob, 8, 1.8, 0.8);
      ctx.fill();
      ctx.fillStyle = '#f1c40f'; // Golden bell
      ctx.beginPath();
      ctx.arc(px + 12, py + 10.5 + bob, 1.4, 0, Math.PI * 2);
      ctx.fill();

      // Left Resting Paw
      ctx.fillStyle = '#ffffff';
      ctx.beginPath();
      ctx.ellipse(px + 8.5, py + 12 + bob, 2, 2.5, 0, 0, Math.PI * 2);
      ctx.fill();

      // RIGHT WAVING FORTUNE PAW (Maneki Neko wave)
      ctx.fillStyle = '#ffffff';
      ctx.beginPath();
      ctx.ellipse(px + 17, py + 6 + bob + waveY, 2.3, 3.8, 0.3, 0, Math.PI * 2);
      ctx.fill();
      // Pink Paw Pad
      ctx.fillStyle = '#ff7675';
      ctx.beginPath();
      ctx.arc(px + 17.2, py + 5 + bob + waveY, 1, 0, Math.PI * 2);
      ctx.fill();

      // Periodic "Meow~ ✨" Bubble
      if (Math.floor(this.tick / 60) % 5 === 0) {
        ctx.fillStyle = '#ffffff';
        ctx.beginPath();
        ctx.roundRect(px + 18, py - 12 + bob, 22, 9, 3);
        ctx.fill();
        ctx.fillStyle = '#e84393';
        ctx.font = 'bold 6.5px monospace';
        ctx.fillText('Meow~✨', px + 19, py - 5.5 + bob);
      }
    }

    // --- C. CHUỘT LANG NƯỚC CAPYBARA SIÊU CHILL ---
    else if (petKey === 'pet_capybara' || petKey === 'capybara') {
      const bob = Math.sin(this.tick * 0.04) * 0.5; // Very slow, calm breathing

      // Robust Loaf Body (Warm toasted brown fur)
      ctx.fillStyle = '#8b572a';
      ctx.beginPath();
      ctx.ellipse(px + 11, py + 10 + bob, 11, 7.5, 0, 0, Math.PI * 2);
      ctx.fill();

      // Fur texture highlight
      ctx.fillStyle = '#a66a38';
      ctx.beginPath();
      ctx.ellipse(px + 11, py + 8 + bob, 9, 5, 0, 0, Math.PI * 2);
      ctx.fill();

      // Characteristic Blunt Rounded Snout Head
      ctx.fillStyle = '#7a461b';
      ctx.beginPath();
      ctx.roundRect(px + 14, py + 2.5 + bob, 9, 9, 3);
      ctx.fill();

      // Tiny Rounded Ears
      ctx.fillStyle = '#5c3311';
      ctx.beginPath();
      ctx.arc(px + 15, py + 2 + bob, 1.4, 0, Math.PI * 2);
      ctx.fill();

      // Ultra-peaceful Half-closed Slit Eyes (- -)
      ctx.strokeStyle = '#2d3436';
      ctx.lineWidth = 1.2;
      ctx.beginPath();
      ctx.moveTo(px + 16.5, py + 5.5 + bob);
      ctx.lineTo(px + 19.5, py + 5.5 + bob);
      ctx.stroke();

      // Calm Snout Nostril
      ctx.fillStyle = '#2d3436';
      ctx.beginPath();
      ctx.arc(px + 21.5, py + 8 + bob, 0.8, 0, Math.PI * 2);
      ctx.fill();

      // Short Little Loaf Paws
      ctx.fillStyle = '#5c3311';
      ctx.beginPath();
      ctx.ellipse(px + 8, py + 15 + bob, 3, 2, 0, 0, Math.PI * 2);
      ctx.ellipse(px + 18, py + 15 + bob, 3, 2, 0, 0, Math.PI * 2);
      ctx.fill();

      // Pristine Ripe Orange / Yuzu Fruit on Head! (Iconic Capybara)
      ctx.fillStyle = '#ff9f1a'; // Orange body
      ctx.beginPath();
      ctx.arc(px + 18.5, py - 1.5 + bob, 3.2, 0, Math.PI * 2);
      ctx.fill();
      // Green stem & leaf
      ctx.fillStyle = '#2ed573';
      ctx.fillRect(px + 18, py - 5.5 + bob, 1, 2);
      ctx.beginPath();
      ctx.ellipse(px + 20, py - 4.5 + bob, 1.5, 0.8, 0.3, 0, Math.PI * 2);
      ctx.fill();

      // Periodic "Chill... 🍊" Bubble
      if (Math.floor(this.tick / 60) % 5 === 0) {
        ctx.fillStyle = '#ffffff';
        ctx.beginPath();
        ctx.roundRect(px + 18, py - 14 + bob, 22, 9, 3);
        ctx.fill();
        ctx.fillStyle = '#d35400';
        ctx.font = 'bold 6.5px monospace';
        ctx.fillText('Chill...🍊', px + 19, py - 7.5 + bob);
      }
    }
  }

  drawThief(ctx) {
    if (!this.thief) return;
    const t = this.thief;
    const tx = Math.round(t.x);
    const ty = 138;

    // Motion parameters with stepped integer pixel animations
    const isEscaping = t.state === 'escaping';
    const bob = isEscaping 
      ? Math.round(Math.sin(t.tick * 0.45) * 2) 
      : Math.round(Math.sin(t.tick * 0.18));

    // 1. Street Ground Shadow
    this.drawPixel(ctx, tx - 2, ty + 24, 20, 3, 'rgba(0, 0, 0, 0.35)');

    // 2. Black Cargo Pants & Tactical Sneakers
    const legSwing = isEscaping ? Math.round(Math.sin(t.tick * 0.45) * 4) : Math.round(Math.sin(t.tick * 0.18) * 2);

    // Left & Right legs
    this.drawPixel(ctx, tx + 4 - legSwing, ty + 12 + bob, 4, 8, '#1e1e24');
    this.drawPixel(ctx, tx + 9 + legSwing, ty + 12 + bob, 4, 8, '#1e1e24');

    // Black High-Top Sneakers with Clean White Sole
    this.drawPixel(ctx, tx + 3 - legSwing, ty + 19 + bob, 6, 3, '#0f0f14');
    this.drawPixel(ctx, tx + 3 - legSwing, ty + 22 + bob, 6, 1, '#ffffff');
    this.drawPixel(ctx, tx + 8 + legSwing, ty + 19 + bob, 6, 3, '#0f0f14');
    this.drawPixel(ctx, tx + 8 + legSwing, ty + 22 + bob, 6, 1, '#ffffff');

    // 3. Burlap Sack (Rustic thief loot bag slung over back)
    const bagX = isEscaping ? tx - 6 : (t.state === 'pacing_left' || t.state === 'approaching_pet' ? tx + 13 : tx - 5);
    const bagWiggle = isEscaping ? Math.round(Math.sin(t.tick * 0.5)) : 0;

    // Burlap Sack Body
    this.drawPixel(ctx, bagX, ty + 6 + bob + bagWiggle, 8, 10, '#6b411d');
    this.drawPixel(ctx, bagX + 1, ty + 7 + bob + bagWiggle, 6, 8, '#9c6634');
    this.drawPixel(ctx, bagX + 2, ty + 4 + bob + bagWiggle, 4, 3, '#f5cd79'); // Sack rope tie

    // If pet has been snatched, draw cute pet ears or tail struggling inside sack!
    if (t.state === 'snatching' || (isEscaping && this.isPetStolen)) {
      this.drawPixel(ctx, bagX - 1, ty + 2 + bob + bagWiggle, 3, 3, '#e58e26');
    }

    // 4. Black Oversized Hoodie Body (Hunched sneak posture)
    this.drawPixel(ctx, tx + 2, ty + 2 + bob, 13, 11, '#0a0a0e');
    this.drawPixel(ctx, tx + 3, ty + 3 + bob, 11, 9, '#18181f');
    this.drawPixel(ctx, tx + 4, ty + 10 + bob, 9, 1, '#272730'); // Pocket fold

    // 5. Oversized Black Hood & Head
    this.drawPixel(ctx, tx + 3, ty - 6 + bob, 12, 9, '#0a0a0e');
    this.drawPixel(ctx, tx + 4, ty - 5 + bob, 10, 7, '#121217');
    this.drawPixel(ctx, tx + 5, ty - 3 + bob, 8, 4, '#040406'); // Deep face cavity shadow

    // 6. Shifty Suspicious Eyes (Glancing back and forth)
    this.drawPixel(ctx, tx + 6, ty - 3 + bob, 2, 2, '#ffffff');
    this.drawPixel(ctx, tx + 10, ty - 3 + bob, 2, 2, '#ffffff');

    const glanceOffset = isEscaping ? 1 : (t.state === 'pacing_left' || t.state === 'approaching_pet' ? -1 : (t.state === 'pacing_right' ? 1 : (Math.sin(t.tick * 0.1) > 0 ? 1 : 0)));
    this.drawPixel(ctx, tx + 6 + glanceOffset, ty - 3 + bob, 1, 2, '#000000');
    this.drawPixel(ctx, tx + 10 + glanceOffset, ty - 3 + bob, 1, 2, '#000000');

    // 7. Black Face Mask / Surgical Mask
    this.drawPixel(ctx, tx + 5, ty - 1 + bob, 8, 4, '#18181f');
    this.drawPixel(ctx, tx + 6, ty + bob, 6, 1, '#2f3542');

    // 8. Sweat Drops & Speed Lines if Escaping
    if (isEscaping) {
      this.drawPixel(ctx, tx - 5, ty - 4 + bob, 2, 2, '#00d2d3');
      this.drawPixel(ctx, tx - 9, ty + 2 + bob, 2, 2, '#00d2d3');
    }

    // 9. Speech / Thought Bubble
    if (t.bubble) {
      const bubbleW = t.bubble.length * 6 + 8;
      const bx = tx - 4;
      const by = ty - 20 + bob;

      this.drawPixel(ctx, bx + 1, by + 1, bubbleW, 11, 'rgba(0, 0, 0, 0.3)');
      this.drawPixel(ctx, bx, by, bubbleW, 11, isEscaping ? '#ff4757' : '#ffffff');
      this.drawPixel(ctx, bx + 8, by + 11, 4, 3, isEscaping ? '#ff4757' : '#ffffff');

      ctx.fillStyle = isEscaping ? '#ffffff' : '#2f3542';
      ctx.font = 'bold 7px monospace';
      ctx.fillText(t.bubble, bx + 4, by + 8);
    }
  }
}

window.GameCanvas = GameCanvas;
