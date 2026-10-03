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
    ctx.imageSmoothingEnabled = true;

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

  // Smooth Anatomical Face & Expression Helper
  drawOrganicHead(ctx, cx, cy, rx, ry, skinColor, blushColor, isBlinking, eyeColor = '#1a1016', isHappy = false) {
    // Chin and jaw curve with a warm, soft directional skin gradient.
    const skinGrad = ctx.createRadialGradient(
      cx - rx * 0.35, cy - ry * 0.55, 0,
      cx + rx * 0.45, cy + ry * 0.8, Math.max(rx, ry) * 1.8
    );
    skinGrad.addColorStop(0, '#fff9f0');
    skinGrad.addColorStop(0.38, skinColor);
    skinGrad.addColorStop(0.82, 'rgba(215, 135, 115, 0.42)');
    skinGrad.addColorStop(1, 'rgba(175, 95, 78, 0.48)');
    ctx.fillStyle = skinGrad;
    ctx.beginPath();
    ctx.moveTo(cx - rx, cy - ry * 0.25);
    ctx.quadraticCurveTo(cx - rx * 0.98, cy + ry * 0.55, cx - rx * 0.45, cy + ry * 0.88);
    ctx.quadraticCurveTo(cx, cy + ry * 1.02, cx + rx * 0.45, cy + ry * 0.88);
    ctx.quadraticCurveTo(cx + rx * 0.98, cy + ry * 0.55, cx + rx, cy - ry * 0.25);
    ctx.quadraticCurveTo(cx + rx * 0.9, cy - ry * 0.95, cx, cy - ry);
    ctx.quadraticCurveTo(cx - rx * 0.9, cy - ry * 0.95, cx - rx, cy - ry * 0.25);
    ctx.fill();

    // Feathered cheek light and a soft jaw rim
    ctx.fillStyle = 'rgba(255, 255, 255, 0.18)';
    ctx.beginPath();
    ctx.ellipse(cx - rx * 0.42, cy - ry * 0.38, rx * 0.28, ry * 0.42, -0.35, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = 'rgba(110, 57, 53, 0.2)';
    ctx.lineWidth = 0.5;
    ctx.beginPath();
    ctx.arc(cx, cy + ry * 0.1, rx * 0.86, Math.PI * 0.12, Math.PI * 0.88);
    ctx.stroke();

    // Soft curved ears
    ctx.beginPath();
    ctx.ellipse(cx - rx - 0.5, cy, 1.6, 2.4, 0, 0, Math.PI * 2);
    ctx.ellipse(cx + rx + 0.5, cy, 1.6, 2.4, 0, 0, Math.PI * 2);
    ctx.fill();

    // 1. Soft chin shadow contour
    ctx.fillStyle = 'rgba(0, 0, 0, 0.06)';
    ctx.beginPath();
    ctx.ellipse(cx, cy + ry * 0.92, rx * 0.7, ry * 0.22, 0, 0, Math.PI * 2);
    ctx.fill();

    // 2. Cute subtle nose contour & soft highlight tip
    ctx.fillStyle = 'rgba(165, 85, 70, 0.26)';
    ctx.beginPath();
    ctx.ellipse(cx, cy + ry * 0.22, 0.8, 1.2, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = 'rgba(255, 255, 255, 0.45)';
    ctx.beginPath();
    ctx.arc(cx - 0.4, cy + ry * 0.16, 0.7, 0, Math.PI * 2);
    ctx.fill();

    // 3. Soft airbrushed anime blush with radiant diffusion & twinkle dots
    if (blushColor || isHappy) {
      const bColor = isHappy ? 'rgba(255, 99, 132, 0.75)' : (blushColor || 'rgba(255, 125, 125, 0.42)');
      [-1, 1].forEach(side => {
        const bx = cx + side * rx * 0.52;
        const by = cy + ry * 0.35;
        const bGrad = ctx.createRadialGradient(bx, by, 0, bx, by, rx * 0.42);
        bGrad.addColorStop(0, bColor);
        bGrad.addColorStop(0.7, 'rgba(255, 125, 125, 0.15)');
        bGrad.addColorStop(1, 'rgba(255, 255, 255, 0)');
        ctx.fillStyle = bGrad;
        ctx.beginPath();
        ctx.ellipse(bx, by, isHappy ? 3.5 : 2.8, 1.9, 0, 0, Math.PI * 2);
        ctx.fill();
        // Anime blush twinkle dots
        ctx.fillStyle = 'rgba(255, 255, 255, 0.88)';
        ctx.fillRect(bx - 0.5, by - 0.5, 1.1, 1.1);
      });
    }

    // 4. High-Fidelity Anime Eyes
    const eyeSpacing = rx * 0.48;
    const eyeY = cy - ry * 0.05;
    if (isHappy) {
      // Joyful curved anime eyes (^ ^) with double upper lashes
      ctx.strokeStyle = '#1a1016';
      ctx.lineWidth = 1.6;
      ctx.beginPath();
      ctx.arc(cx - eyeSpacing, eyeY + 0.6, 2.4, Math.PI * 1.15, Math.PI * 1.85);
      ctx.arc(cx + eyeSpacing, eyeY + 0.6, 2.4, Math.PI * 1.15, Math.PI * 1.85);
      ctx.stroke();
    } else if (isBlinking) {
      // Natural blink with delicate curved lash line
      ctx.strokeStyle = '#1a1016';
      ctx.lineWidth = 1.3;
      ctx.beginPath();
      ctx.arc(cx - eyeSpacing, eyeY + 1, 2.2, Math.PI * 0.15, Math.PI * 0.85);
      ctx.arc(cx + eyeSpacing, eyeY + 1, 2.2, Math.PI * 0.15, Math.PI * 0.85);
      ctx.stroke();
    } else {
      // White sclera
      ctx.fillStyle = '#ffffff';
      ctx.beginPath();
      ctx.ellipse(cx - eyeSpacing, eyeY, 2.2, 2.8, 0, 0, Math.PI * 2);
      ctx.ellipse(cx + eyeSpacing, eyeY, 2.2, 2.8, 0, 0, Math.PI * 2);
      ctx.fill();

      // Colored Iris with depth gradient
      const irisGradL = ctx.createLinearGradient(cx - eyeSpacing, eyeY - 2.5, cx - eyeSpacing, eyeY + 2.5);
      irisGradL.addColorStop(0, '#100814');
      irisGradL.addColorStop(0.55, eyeColor);
      irisGradL.addColorStop(1, '#e8f0fe');
      ctx.fillStyle = irisGradL;
      ctx.beginPath();
      ctx.ellipse(cx - eyeSpacing, eyeY + 0.2, 1.8, 2.5, 0, 0, Math.PI * 2);
      ctx.fill();

      const irisGradR = ctx.createLinearGradient(cx + eyeSpacing, eyeY - 2.5, cx + eyeSpacing, eyeY + 2.5);
      irisGradR.addColorStop(0, '#100814');
      irisGradR.addColorStop(0.55, eyeColor);
      irisGradR.addColorStop(1, '#e8f0fe');
      ctx.fillStyle = irisGradR;
      ctx.beginPath();
      ctx.ellipse(cx + eyeSpacing, eyeY + 0.2, 1.8, 2.5, 0, 0, Math.PI * 2);
      ctx.fill();

      // Deep dark pupil
      ctx.fillStyle = '#0b080c';
      ctx.beginPath();
      ctx.arc(cx - eyeSpacing, eyeY + 0.3, 0.9, 0, Math.PI * 2);
      ctx.arc(cx + eyeSpacing, eyeY + 0.3, 0.9, 0, Math.PI * 2);
      ctx.fill();

      // Double Specular Catchlights (Primary star & secondary spark)
      ctx.fillStyle = '#ffffff';
      ctx.beginPath();
      ctx.arc(cx - eyeSpacing - 0.7, eyeY - 0.9, 0.8, 0, Math.PI * 2);
      ctx.arc(cx - eyeSpacing + 0.7, eyeY + 0.9, 0.45, 0, Math.PI * 2);
      ctx.arc(cx + eyeSpacing - 0.7, eyeY - 0.9, 0.8, 0, Math.PI * 2);
      ctx.arc(cx + eyeSpacing + 0.7, eyeY + 0.9, 0.45, 0, Math.PI * 2);
      ctx.fill();

      // Upper Eyeliner & Lashes
      ctx.strokeStyle = '#1a1016';
      ctx.lineWidth = 1.25;
      ctx.beginPath();
      ctx.arc(cx - eyeSpacing, eyeY - 1, 2.4, Math.PI * 1.1, Math.PI * 1.9);
      ctx.arc(cx + eyeSpacing, eyeY - 1, 2.4, Math.PI * 1.1, Math.PI * 1.9);
      ctx.stroke();

      // Double-eyelid crease
      ctx.strokeStyle = 'rgba(26, 16, 22, 0.38)';
      ctx.lineWidth = 0.55;
      ctx.beginPath();
      ctx.arc(cx - eyeSpacing, eyeY - 2.2, 2.0, Math.PI * 1.2, Math.PI * 1.8);
      ctx.arc(cx + eyeSpacing, eyeY - 2.2, 2.0, Math.PI * 1.2, Math.PI * 1.8);
      ctx.stroke();
    }

    // 5. Delicate soft eyebrows
    ctx.strokeStyle = 'rgba(45, 25, 35, 0.6)';
    ctx.lineWidth = 0.7;
    ctx.beginPath();
    ctx.arc(cx - eyeSpacing, eyeY - 2.9, 2.2, Math.PI * 1.15, Math.PI * 1.78);
    ctx.arc(cx + eyeSpacing, eyeY - 2.9, 2.2, Math.PI * 1.22, Math.PI * 1.85);
    ctx.stroke();

    // 6. Delicate anime mouth with subtle lip gloss
    if (isHappy) {
      const mouthGrad = ctx.createLinearGradient(cx, cy + ry * 0.48, cx, cy + ry * 0.78);
      mouthGrad.addColorStop(0, '#e74c3c');
      mouthGrad.addColorStop(1, '#ff7675');
      ctx.fillStyle = mouthGrad;
      ctx.beginPath();
      ctx.arc(cx, cy + ry * 0.5, 2.5, 0, Math.PI);
      ctx.fill();
      ctx.strokeStyle = '#8b263e';
      ctx.lineWidth = 0.8;
      ctx.stroke();
      // Lip shine highlight
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(cx - 0.6, cy + ry * 0.5 + 1.2, 1.2, 0.8);
    } else {
      // Soft gentle smile with subtle pink tint
      ctx.fillStyle = 'rgba(235, 110, 110, 0.3)';
      ctx.beginPath();
      ctx.ellipse(cx, cy + ry * 0.57, 1.6, 0.75, 0, 0, Math.PI * 2);
      ctx.fill();

      ctx.strokeStyle = '#8b4513';
      ctx.lineWidth = 0.75;
      ctx.beginPath();
      ctx.arc(cx, cy + ry * 0.52, 1.4, 0.15, Math.PI - 0.15);
      ctx.stroke();

      // Lower lip tiny shine glint
      ctx.fillStyle = 'rgba(255, 255, 255, 0.65)';
      ctx.fillRect(cx - 0.4, cy + ry * 0.58, 0.9, 0.6);
    }
  }

  // Smooth Curved Limb Capsule Helper (Arms & Legs with organic joints)
  drawCurvedLimb(ctx, x1, y1, x2, y2, r1, r2, color) {
    ctx.fillStyle = color;
    const angle = Math.atan2(y2 - y1, x2 - x1);
    const perp = angle + Math.PI / 2;
    const p1x = x1 + Math.cos(perp) * r1;
    const p1y = y1 + Math.sin(perp) * r1;
    const p2x = x2 + Math.cos(perp) * r2;
    const p2y = y2 + Math.sin(perp) * r2;
    const p3x = x2 - Math.cos(perp) * r2;
    const p3y = y2 - Math.sin(perp) * r2;
    const p4x = x1 - Math.cos(perp) * r1;
    const p4y = y1 - Math.sin(perp) * r1;

    ctx.beginPath();
    ctx.moveTo(p1x, p1y);
    ctx.lineTo(p2x, p2y);
    ctx.arc(x2, y2, r2, perp, perp + Math.PI);
    ctx.lineTo(p4x, p4y);
    ctx.arc(x1, y1, r1, perp + Math.PI, perp);
    ctx.closePath();
    ctx.fill();
  }

  // Smooth Curved Foot / Shoe Helper
  drawCurvedShoe(ctx, x, y, len, h, color, soleColor = '#ffffff') {
    // Upper shoe
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.moveTo(x - len * 0.4, y);
    ctx.quadraticCurveTo(x, y - h, x + len * 0.5, y);
    ctx.lineTo(x + len * 0.6, y + h * 0.4);
    ctx.lineTo(x - len * 0.4, y + h * 0.4);
    ctx.closePath();
    ctx.fill();

    // Outsole with tread bevel
    ctx.fillStyle = soleColor;
    ctx.beginPath();
    ctx.roundRect(x - len * 0.45, y + h * 0.4, len * 1.1, h * 0.4, 1.5);
    ctx.fill();
  }

  // Soft fabric finish: gentle rim light, draping folds, and crease shading
  drawFabricFinish(ctx, cx, top, width, height, baseShade = 'rgba(0, 0, 0, 0.16)') {
    ctx.save();
    const grad = ctx.createLinearGradient(cx - width * 0.6, top, cx + width * 0.6, top + height);
    grad.addColorStop(0, 'rgba(255, 255, 255, 0.22)');
    grad.addColorStop(0.35, 'rgba(255, 255, 255, 0.03)');
    grad.addColorStop(0.75, 'rgba(0, 0, 0, 0.05)');
    grad.addColorStop(1, baseShade);
    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.roundRect(cx - width / 2, top, width, height, [3, 3, 3, 3]);
    ctx.fill();

    // Organic soft draping crease curves
    ctx.strokeStyle = 'rgba(0, 0, 0, 0.13)';
    ctx.lineWidth = 0.6;
    ctx.beginPath();
    ctx.moveTo(cx - width * 0.22, top + height * 0.15);
    ctx.quadraticCurveTo(cx - width * 0.3, top + height * 0.52, cx - width * 0.18, top + height * 0.88);
    ctx.moveTo(cx + width * 0.24, top + height * 0.16);
    ctx.quadraticCurveTo(cx + width * 0.32, top + height * 0.54, cx + width * 0.2, top + height * 0.86);
    ctx.stroke();

    // Soft highlight on fold crests
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.22)';
    ctx.lineWidth = 0.5;
    ctx.beginPath();
    ctx.moveTo(cx - width * 0.18, top + height * 0.18);
    ctx.quadraticCurveTo(cx - width * 0.26, top + height * 0.52, cx - width * 0.14, top + height * 0.86);
    ctx.stroke();

    ctx.restore();
  }

  // Silk hair gloss: soft multi-layered angel halo ring with gradient transparency & specular catchlights
  drawHairGloss(ctx, cx, cy, scale = 1) {
    ctx.save();
    // 1. Soft diffused halo glow along crown
    const haloGrad = ctx.createLinearGradient(cx - 6 * scale, cy - 3 * scale, cx + 6 * scale, cy);
    haloGrad.addColorStop(0, 'rgba(255, 255, 255, 0)');
    haloGrad.addColorStop(0.3, 'rgba(255, 248, 225, 0.45)');
    haloGrad.addColorStop(0.7, 'rgba(255, 255, 255, 0.7)');
    haloGrad.addColorStop(1, 'rgba(255, 255, 255, 0)');
    ctx.strokeStyle = haloGrad;
    ctx.lineWidth = 1.6 * scale;
    ctx.beginPath();
    ctx.arc(cx, cy - 1 * scale, 6.5 * scale, Math.PI * 1.15, Math.PI * 1.85);
    ctx.stroke();

    // 2. Crisp specular hair streaks (angel's ring highlight)
    ctx.globalAlpha = 0.85;
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.ellipse(cx - 1.8 * scale, cy - 2.4 * scale, 3.8 * scale, 1.2 * scale, -0.38, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.ellipse(cx + 2.2 * scale, cy - 1.6 * scale, 2.4 * scale, 0.8 * scale, -0.22, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }

  // HYHY - BARISTA CHỦ QUÁN (Toàn thân chi tiết: giày Oxford viền chỉ, vớ đen, váy xếp ly viền vàng, tạp dề xanh ngọc bích, tóc bóng halo)
  drawHyhy(ctx) {
    const hx = 78;
    const hy = 78;
    const bob = Math.sin(this.tick * 0.12) * 1.5;
    const isBlinking = (this.tick % 80) < 4;

    // 1. FEET & OXFORD BROGUES (Đứng vững chãi trên vỉa hè)
    // Left Oxford shoe
    this.drawCurvedShoe(ctx, hx + 3, 144, 7.5, 3.5, '#2e180d', '#1a0c06');
    // Right Oxford shoe
    this.drawCurvedShoe(ctx, hx + 10, 144, 7.5, 3.5, '#2e180d', '#1a0c06');

    // Polished Brass Buckles & Shoe Gloss
    ctx.fillStyle = '#f4c430';
    ctx.fillRect(hx + 2.5, 143, 2, 1);
    ctx.fillRect(hx + 9.5, 143, 2, 1);
    ctx.fillStyle = 'rgba(255, 255, 255, 0.4)';
    ctx.fillRect(hx + 4, 142.5, 2, 0.8);
    ctx.fillRect(hx + 11, 142.5, 2, 0.8);

    // 2. SLENDER CURVED LEGS IN CHIC DARK TIGHTS (Vớ đen barista cao cấp)
    this.drawCurvedLimb(ctx, hx + 3, 118 + bob, hx + 3, 144, 2.4, 1.8, '#1e1822');
    this.drawCurvedLimb(ctx, hx + 10, 118 + bob, hx + 10, 144, 2.4, 1.8, '#1e1822');

    // Soft knee highlights
    ctx.fillStyle = 'rgba(255, 255, 255, 0.15)';
    ctx.beginPath();
    ctx.ellipse(hx + 3, 131 + bob, 1.4, 2.5, 0, 0, Math.PI * 2);
    ctx.ellipse(hx + 10, 131 + bob, 1.4, 2.5, 0, 0, Math.PI * 2);
    ctx.fill();

    // 3. FLARED PLEATED SKIRT (Chân váy xếp ly xanh navy viền chỉ vàng satin)
    ctx.fillStyle = '#151c2e';
    ctx.beginPath();
    ctx.moveTo(hx - 2, 107 + bob);
    ctx.lineTo(hx + 15, 107 + bob);
    ctx.quadraticCurveTo(hx + 18, 114 + bob, hx + 17, 121 + bob);
    ctx.lineTo(hx - 4, 121 + bob);
    ctx.quadraticCurveTo(hx - 5, 114 + bob, hx - 2, 107 + bob);
    ctx.fill();

    // Gold satin hemline ribbon
    ctx.strokeStyle = '#f1c40f';
    ctx.lineWidth = 0.8;
    ctx.beginPath();
    ctx.moveTo(hx - 3.5, 120 + bob);
    ctx.lineTo(hx + 16.5, 120 + bob);
    ctx.stroke();

    // Crisp vertical pleat fold lines
    ctx.strokeStyle = '#0f1422';
    ctx.lineWidth = 1;
    for (let px = hx - 1; px <= hx + 14; px += 3) {
      ctx.beginPath();
      ctx.moveTo(px, 107 + bob);
      ctx.lineTo(px + (px < hx + 6 ? -1 : 1), 120 + bob);
      ctx.stroke();
    }

    // Apron Ribbon Bow tied at back of waist
    ctx.fillStyle = '#1e824c';
    ctx.beginPath();
    ctx.ellipse(hx - 4, 108 + bob, 3, 2, -0.4, 0, Math.PI * 2);
    ctx.ellipse(hx - 4, 112 + bob, 2.5, 1.5, 0.4, 0, Math.PI * 2);
    ctx.fill();

    // 4. TORSO & BLOUSE: White Silk Blouse with Ruffled Collar
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.roundRect(hx - 2, hy + 16 + bob, 17, 20, [5, 5, 0, 0]);
    ctx.fill();

    // Peter Pan Collar with fine scalloped lace edge
    ctx.fillStyle = '#f8f9fa';
    ctx.beginPath();
    ctx.ellipse(hx + 4, hy + 17 + bob, 3.8, 2.2, -0.2, 0, Math.PI * 2);
    ctx.ellipse(hx + 9, hy + 17 + bob, 3.8, 2.2, 0.2, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#e9ecef';
    ctx.lineWidth = 0.6;
    ctx.stroke();

    // Ruby Silk Brooch Ribbon with golden filigree jewel
    ctx.fillStyle = '#e74c3c';
    ctx.beginPath();
    ctx.arc(hx + 6.5, hy + 18 + bob, 1.8, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#f1c40f'; // Golden jewel center
    ctx.beginPath();
    ctx.arc(hx + 6.5, hy + 18 + bob, 0.8, 0, Math.PI * 2);
    ctx.fill();

    // 5. EMERALD GREEN BARISTA APRON (Tạp dề xanh ngọc bích sang trọng)
    ctx.fillStyle = '#27ae60';
    ctx.beginPath();
    ctx.moveTo(hx + 1, hy + 18 + bob);
    ctx.lineTo(hx + 12, hy + 18 + bob);
    ctx.quadraticCurveTo(hx + 14, hy + 26 + bob, hx + 15, hy + 38 + bob);
    ctx.lineTo(hx - 2, hy + 38 + bob);
    ctx.quadraticCurveTo(hx - 1, hy + 26 + bob, hx + 1, hy + 18 + bob);
    ctx.closePath();
    ctx.fill();

    // Tan Leather Cross Straps & Brass Buckles
    ctx.fillStyle = '#d35400';
    ctx.fillRect(hx + 2, hy + 18 + bob, 2, 7);
    ctx.fillRect(hx + 9, hy + 18 + bob, 2, 7);
    ctx.fillStyle = '#f4c430'; // Brass buckles
    ctx.fillRect(hx + 1.8, hy + 22 + bob, 2.4, 1.2);
    ctx.fillRect(hx + 8.8, hy + 22 + bob, 2.4, 1.2);

    // Front utility pocket with gold embroidered boba cup insignia
    ctx.fillStyle = '#1e824c';
    ctx.beginPath();
    ctx.roundRect(hx + 2, hy + 26 + bob, 9, 8, [1, 1, 4, 4]);
    ctx.fill();
    ctx.strokeStyle = '#2ecc71';
    ctx.lineWidth = 0.6;
    ctx.stroke();

    // Gold Boba Cup Insignia on pocket
    ctx.fillStyle = '#f4c430';
    ctx.beginPath();
    ctx.roundRect(hx + 5.5, hy + 28 + bob, 2.2, 3.2, 0.5);
    ctx.fill();
    ctx.fillRect(hx + 6.2, hy + 26.8 + bob, 0.8, 1.2); // mini straw

    // 6. SLENDER CURVED NECK
    ctx.fillStyle = '#ffe0bd';
    ctx.beginPath();
    ctx.roundRect(hx + 4, hy + 12 + bob, 5, 5, 2);
    ctx.fill();

    // 7. HEAD & SWEET EXPRESSIVE FACE with Amethyst Violet Eyes
    this.drawOrganicHead(ctx, hx + 6.5, hy + 7 + bob, 7.5, 8.5, '#ffe0bd', 'rgba(255, 123, 123, 0.45)', isBlinking, '#8e44ad');

    // 8. SOFT CHESTNUT BOB HAIRCUT WITH ANGEL'S HALO SHINE (Vòng sáng tóc thiên thần)
    ctx.fillStyle = '#3e1c0c';
    // Back hair dome
    ctx.beginPath();
    ctx.arc(hx + 6.5, hy + 5 + bob, 9.5, Math.PI * 0.8, Math.PI * 2.2);
    ctx.fill();
    // Flowing curved side locks
    ctx.beginPath();
    ctx.moveTo(hx - 2, hy + 4 + bob);
    ctx.quadraticCurveTo(hx - 4, hy + 12 + bob, hx - 1, hy + 16 + bob);
    ctx.quadraticCurveTo(hx, hy + 10 + bob, hx - 1, hy + 6 + bob);
    ctx.fill();
    // Sweeping bangs across forehead
    ctx.beginPath();
    ctx.moveTo(hx - 2, hy + 3 + bob);
    ctx.quadraticCurveTo(hx + 4, hy + 8 + bob, hx + 9, hy + 4 + bob);
    ctx.quadraticCurveTo(hx + 14, hy + 9 + bob, hx + 15, hy + 6 + bob);
    ctx.quadraticCurveTo(hx + 13, hy, hx + 6, hy - 2 + bob);
    ctx.closePath();
    ctx.fill();

    // Angel's Halo Hair Specular Ring (Vòng sáng tóc anime)
    ctx.strokeStyle = 'rgba(255, 240, 220, 0.65)';
    ctx.lineWidth = 1.4;
    ctx.beginPath();
    ctx.arc(hx + 6.5, hy + 1 + bob, 7.5, Math.PI * 1.15, Math.PI * 1.65);
    ctx.stroke();

    // Cute Gold Boba Hairpin on Side Bangs
    ctx.fillStyle = '#f1c40f';
    ctx.beginPath();
    ctx.arc(hx + 12, hy + 4 + bob, 1.4, 0, Math.PI * 2);
    ctx.fill();

    // Fine chestnut hair sheen, painted before the beret so the accessory remains crisp.
    this.drawHairGloss(ctx, hx + 6.5, hy + 1 + bob, 0.9);

    // 9. CHIC PARISIAN BARISTA BERET (Mũ nồi xanh lá đính huy hiệu sao vàng)
    ctx.fillStyle = '#27ae60';
    ctx.beginPath();
    ctx.ellipse(hx + 7, hy - 2 + bob, 9.5, 4.5, -0.15, 0, Math.PI * 2);
    ctx.fill();
    // Beret shadow fold
    ctx.fillStyle = '#1e824c';
    ctx.beginPath();
    ctx.ellipse(hx + 6.5, hy - 1 + bob, 8.5, 3.5, -0.15, 0, Math.PI * 2);
    ctx.fill();

    // 3D Embossed Gold Star Boba Brooch on Beret
    ctx.fillStyle = '#f4c430';
    ctx.beginPath();
    ctx.arc(hx + 12, hy - 1 + bob, 2.2, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(hx + 11.5, hy - 1.5 + bob, 1, 1);

    // 10. UPPER ARMS (Down to elbow level behind counter)
    this.drawCurvedLimb(ctx, hx - 2, hy + 18 + bob, hx - 1, hy + 25 + bob, 2.4, 2.0, '#ffe0bd');
    this.drawCurvedLimb(ctx, hx + 14, hy + 18 + bob, hx + 13, hy + 24 + bob, 2.4, 2.0, '#ffe0bd');

    // Fabric drape finishing on apron and blouse for depth.
    this.drawFabricFinish(ctx, hx + 6.5, hy + 18 + bob, 14, 20, 'rgba(0, 0, 0, 0.22)');
  }

  // --- HYHY FOREARMS & INTERACTIVE ACTIONS (Resting / shaking over countertop) ---
  drawHyhyForearms(ctx) {
    const hx = 78;
    const hy = 78;
    const bob = Math.sin(this.tick * 0.12) * 1.5;
    const shakeArm = this.isShaking ? Math.sin(this.tick * 0.8) * 4 : 0;

    if (this.isShaking) {
      // Rapid animated curved forearms vigorously shaking shaker above the counter!
      this.drawCurvedLimb(ctx, hx + 13, hy + 24 + bob, hx + 17, hy + 16 + bob + shakeArm, 2.4, 2.0, '#ffe0bd');
      this.drawCurvedLimb(ctx, hx - 1, hy + 25 + bob, hx + 13, hy + 18 + bob + shakeArm, 2.4, 2.0, '#ffe0bd');

      // Stainless steel cocktail shaker with specular gloss & silicone ring
      const shakerX = hx + 14;
      const shakerY = hy + 10 + bob + shakeArm;
      ctx.fillStyle = '#bdc3c7';
      ctx.beginPath();
      ctx.roundRect(shakerX, shakerY, 8.5, 15, [4, 4, 2, 2]);
      ctx.fill();
      // Metallic reflection stripe
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(shakerX + 1.5, shakerY + 1, 1.8, 13);
      // Red silicone grip ring
      ctx.fillStyle = '#e74c3c';
      ctx.fillRect(shakerX, shakerY + 6, 8.5, 2.5);
      // Shaker cap knob
      ctx.fillStyle = '#7f8c8d';
      ctx.beginPath();
      ctx.arc(shakerX + 4.25, shakerY - 1, 2.5, Math.PI, 0);
      ctx.fill();

      // Dynamic Shaking Motion Blur Action Lines & Sparkles
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.7)';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(shakerX - 3, shakerY + 4);
      ctx.lineTo(shakerX - 5, shakerY + 8);
      ctx.moveTo(shakerX + 11, shakerY + 4);
      ctx.lineTo(shakerX + 13, shakerY + 8);
      ctx.stroke();
    } else {
      // Resting left forearm with rose gold bracelet holding a silver jigger
      this.drawCurvedLimb(ctx, hx - 1, hy + 24 + bob, hx + 2, hy + 31 + bob, 2.4, 2.0, '#ffe0bd');
      // Rose gold bracelet
      ctx.strokeStyle = '#e17055';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.arc(hx + 1.5, hy + 30 + bob, 2.2, 0, Math.PI * 2);
      ctx.stroke();

      ctx.fillStyle = '#ffe0bd';
      ctx.beginPath();
      ctx.arc(hx + 2, hy + 32 + bob, 2.2, 0, Math.PI * 2);
      ctx.fill();

      // Silver dual-ended barista jigger (ly đong siro)
      ctx.fillStyle = '#bdc3c7';
      ctx.beginPath();
      ctx.moveTo(hx + 4, hy + 28 + bob);
      ctx.lineTo(hx + 8, hy + 28 + bob);
      ctx.lineTo(hx + 6.5, hy + 31 + bob);
      ctx.lineTo(hx + 8.5, hy + 34 + bob);
      ctx.lineTo(hx + 3.5, hy + 34 + bob);
      ctx.lineTo(hx + 5.5, hy + 31 + bob);
      ctx.closePath();
      ctx.fill();

      // Resting right arm gracefully on the marble countertop
      this.drawCurvedLimb(ctx, hx + 13, hy + 23 + bob, hx + 17, hy + 30 + bob, 2.4, 2.0, '#ffe0bd');
      ctx.fillStyle = '#ffe0bd';
      ctx.beginPath();
      ctx.arc(hx + 17, hy + 31 + bob, 2.2, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  // 10 CUSTOMER ARCHETYPES WITH CURVED ANATOMY & REALISTIC ATTIRE
  drawCustomer(ctx, x, y, type, isFront = true, quote = '') {
    const isMoving = isFront ? (x < this.targetCustomerX) : false;
    const walkBob = (this.customerState === 'waiting' && isMoving)
      ? Math.sin(this.tick * 0.45) * 3
      : 0;

    // Soft drop shadow
    ctx.fillStyle = 'rgba(10, 5, 12, 0.35)';
    ctx.beginPath();
    ctx.ellipse(x + 10, y + 42, 13, 3.8, 0, 0, Math.PI * 2);
    ctx.fill();

    const isBlinking = (this.tick % 90) < 4;
    const isHappy = isFront && this.isDrinking;
    const petBob = (this.customerState === 'waiting' && isMoving) ? Math.sin(this.tick * 0.45) * 2 : 0;
    const petTail = Math.sin(this.tick * 0.25) * 3;

    switch (type) {
      case 0: { // BÉ LAN - NỮ SINH CẤP 3 (Áo thủy thủ viền kép, váy xếp ly viền ribbon, nơ lụa đỏ, balo có charm boba lắc lư)
        // Slender curved legs in ribbed white knee-high socks
        this.drawCurvedLimb(ctx, x + 6, y + 23 + walkBob, x + 6, y + 38 + walkBob, 2.6, 2.0, '#ffffff');
        this.drawCurvedLimb(ctx, x + 13, y + 23 - walkBob, x + 13, y + 38 - walkBob, 2.6, 2.0, '#ffffff');
        // Sock top ribbing
        ctx.fillStyle = '#dfe6e9';
        ctx.fillRect(x + 4.5, y + 23 + walkBob, 3.2, 1);
        ctx.fillRect(x + 11.5, y + 23 - walkBob, 3.2, 1);

        // Glossy Mary Jane Shoes with rounded toe and gold buckle
        this.drawCurvedShoe(ctx, x + 7, y + 38 + walkBob, 7.5, 3.2, '#1e0c1b', '#3d1b37');
        this.drawCurvedShoe(ctx, x + 14, y + 38 - walkBob, 7.5, 3.2, '#1e0c1b', '#3d1b37');
        ctx.fillStyle = '#f4c430'; // Gold buckles
        ctx.fillRect(x + 6, y + 37 + walkBob, 2, 1.5);
        ctx.fillRect(x + 13, y + 37 - walkBob, 2, 1.5);

        // Flared knife-pleated navy skirt with white satin hemline ribbon
        ctx.fillStyle = '#1e3799';
        ctx.beginPath();
        ctx.moveTo(x + 3, y + 19);
        ctx.lineTo(x + 16, y + 19);
        ctx.quadraticCurveTo(x + 19, y + 23, x + 20, y + 27);
        ctx.lineTo(x - 1, y + 27);
        ctx.quadraticCurveTo(x - 2, y + 23, x + 3, y + 19);
        ctx.closePath();
        ctx.fill();

        // White satin hemline ribbon on skirt
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 0.8;
        ctx.beginPath();
        ctx.moveTo(x - 0.5, y + 26);
        ctx.lineTo(x + 19.5, y + 26);
        ctx.stroke();

        // Pleat vertical lines
        ctx.strokeStyle = '#0c2461';
        ctx.lineWidth = 0.8;
        for (let px = x + 3; px <= x + 16; px += 3) {
          ctx.beginPath();
          ctx.moveTo(px, y + 19);
          ctx.lineTo(px + (px < x + 10 ? -1 : 1), y + 26);
          ctx.stroke();
        }

        // White Sailor Blouse with curved silhouette
        ctx.fillStyle = '#ffffff';
        ctx.beginPath();
        ctx.roundRect(x + 2, y + 7, 15, 13, [4, 4, 2, 2]);
        ctx.fill();

        // Navy Sailor Collar with twin white ribbon stripes
        ctx.fillStyle = '#1e3799';
        ctx.beginPath();
        ctx.moveTo(x + 1, y + 7);
        ctx.lineTo(x + 18, y + 7);
        ctx.lineTo(x + 17, y + 13);
        ctx.lineTo(x + 13, y + 14);
        ctx.lineTo(x + 9.5, y + 9);
        ctx.lineTo(x + 6, y + 14);
        ctx.lineTo(x + 2, y + 13);
        ctx.closePath();
        ctx.fill();

        // Twin white ribbon stripes on sailor collar
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 0.6;
        ctx.beginPath();
        ctx.moveTo(x + 2, y + 12);
        ctx.lineTo(x + 5.5, y + 13);
        ctx.moveTo(x + 17, y + 12);
        ctx.lineTo(x + 13.5, y + 13);
        ctx.stroke();

        // Ruby Red Silk Bowtie with fluttering ribbon tails
        ctx.fillStyle = '#e84118';
        ctx.beginPath();
        ctx.ellipse(x + 9.5, y + 10, 3, 2, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.beginPath();
        ctx.moveTo(x + 8, y + 11);
        ctx.quadraticCurveTo(x + 5.5, y + 15, x + 6.5, y + 18);
        ctx.lineTo(x + 9, y + 12);
        ctx.moveTo(x + 11, y + 11);
        ctx.quadraticCurveTo(x + 13.5, y + 15, x + 12.5, y + 18);
        ctx.lineTo(x + 10, y + 12);
        ctx.fill();
        ctx.fillStyle = '#f4c430'; // Gold brooch jewel
        ctx.beginPath();
        ctx.arc(x + 9.5, y + 10, 0.8, 0, Math.PI * 2);
        ctx.fill();

        // Curved head & anime face with chocolate eyes
        this.drawOrganicHead(ctx, x + 9.5, y - 2, 7.5, 8.5, '#ffe0bd', 'rgba(255, 123, 123, 0.45)', isBlinking, '#5d3a1a', isHappy);

        // Silky dark brown hair, curved bangs & high ponytail
        ctx.fillStyle = '#2c1e13';
        ctx.beginPath();
        ctx.arc(x + 9.5, y - 4, 8.5, Math.PI * 0.75, Math.PI * 2.25);
        ctx.fill();
        // Bangs
        ctx.beginPath();
        ctx.moveTo(x + 2, y - 5);
        ctx.quadraticCurveTo(x + 7, y, x + 11, y - 4);
        ctx.quadraticCurveTo(x + 15, y + 1, x + 17, y - 4);
        ctx.quadraticCurveTo(x + 16, y - 8, x + 10, y - 10);
        ctx.closePath();
        ctx.fill();

        // High ponytail swaying with natural bounce
        const pTailSway = Math.sin(this.tick * 0.25) * 2.8;
        ctx.beginPath();
        ctx.moveTo(x + 15, y - 7);
        ctx.quadraticCurveTo(x + 23 + pTailSway, y - 3, x + 21 + pTailSway, y + 11);
        ctx.quadraticCurveTo(x + 16 + pTailSway, y + 6, x + 15, y - 5);
        ctx.fill();

        // Red silk scrunchie & gold star hairpins
        ctx.fillStyle = '#e84118';
        ctx.beginPath();
        ctx.arc(x + 15, y - 6, 2.8, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = '#f1c40f'; // Star hairpin
        ctx.fillRect(x + 4, y - 6, 1.8, 1.8);

        // Pastel Pink Canvas Schoolbag with Boba Plushie Charm
        ctx.fillStyle = '#ff9ff3';
        ctx.beginPath();
        ctx.roundRect(x - 4, y + 9, 6, 13, [3, 1, 1, 3]);
        ctx.fill();
        ctx.strokeStyle = '#f368e0';
        ctx.lineWidth = 0.6;
        ctx.stroke();

        // Boba Plushie charm bouncing
        const charmSwing = Math.sin(this.tick * 0.2) * 2.5;
        ctx.fillStyle = '#8b4513';
        ctx.beginPath();
        ctx.arc(x - 3 + charmSwing, y + 19, 2.2, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = '#ffffff'; // mini dome lid
        ctx.fillRect(x - 4 + charmSwing, y + 17, 2, 0.8);
        break;
      }

      case 1: { // ANH NAM - VĂN PHÒNG / IT (Sơ mi xanh baby, cravat dệt kim đỏ đô, kẹp cà vạt bạc, đồng hồ smartwatch OLED, kính gọng đồi mồi)
        // Tailored charcoal slacks with crisp center crease
        this.drawCurvedLimb(ctx, x + 6, y + 24 + walkBob, x + 6, y + 38 + walkBob, 2.8, 2.2, '#1e272c');
        this.drawCurvedLimb(ctx, x + 13, y + 24 - walkBob, x + 13, y + 38 - walkBob, 2.8, 2.2, '#1e272c');
        // Slacks vertical crease line
        ctx.strokeStyle = '#2d3436';
        ctx.lineWidth = 0.6;
        ctx.beginPath();
        ctx.moveTo(x + 6, y + 25 + walkBob); ctx.lineTo(x + 6, y + 37 + walkBob);
        ctx.moveTo(x + 13, y + 25 - walkBob); ctx.lineTo(x + 13, y + 37 - walkBob);
        ctx.stroke();

        // Polished Walnut Derby shoes with leather gloss
        this.drawCurvedShoe(ctx, x + 7, y + 38 + walkBob, 8, 3.2, '#2c1e13', '#111');
        this.drawCurvedShoe(ctx, x + 14, y + 38 - walkBob, 8, 3.2, '#2c1e13', '#111');
        ctx.fillStyle = 'rgba(255, 255, 255, 0.3)';
        ctx.fillRect(x + 7, y + 37 + walkBob, 2.5, 0.8);
        ctx.fillRect(x + 14, y + 37 - walkBob, 2.5, 0.8);

        // Baby Blue Oxford Dress Shirt
        ctx.fillStyle = '#74b9ff';
        ctx.beginPath();
        ctx.roundRect(x + 2, y + 7, 16, 18, [3, 3, 1, 1]);
        ctx.fill();

        // Crisp White Collar Points
        ctx.fillStyle = '#f8f9fa';
        ctx.beginPath();
        ctx.moveTo(x + 6, y + 7);
        ctx.lineTo(x + 8.5, y + 10);
        ctx.lineTo(x + 10, y + 7);
        ctx.closePath();
        ctx.moveTo(x + 14, y + 7);
        ctx.lineTo(x + 11.5, y + 10);
        ctx.lineTo(x + 10, y + 7);
        ctx.closePath();
        ctx.fill();

        // Burgundy Silk Tie with Silver Tie Clip
        ctx.fillStyle = '#800020'; // Burgundy
        ctx.beginPath();
        ctx.moveTo(x + 9, y + 8);
        ctx.lineTo(x + 11, y + 8);
        ctx.lineTo(x + 11.5, y + 20);
        ctx.lineTo(x + 10, y + 22);
        ctx.lineTo(x + 8.5, y + 20);
        ctx.closePath();
        ctx.fill();

        // Polished Silver Tie Clip
        ctx.fillStyle = '#ecf0f1';
        ctx.fillRect(x + 8.8, y + 14, 2.4, 1.0);

        // Smartwatch on wrist with glowing cyan OLED screen
        ctx.fillStyle = '#2d3436';
        ctx.beginPath();
        ctx.roundRect(x + 16, y + 20 - walkBob, 3.2, 4, 1);
        ctx.fill();
        ctx.fillStyle = '#00cec9'; // Glowing OLED
        ctx.fillRect(x + 16.5, y + 21 - walkBob, 2.2, 2);

        // Head & Handsome Jawline
        this.drawOrganicHead(ctx, x + 10, y - 2, 7.5, 8.5, '#ffe0bd', 'rgba(255, 150, 150, 0.25)', isBlinking, '#2c3e50', isHappy);

        // Undercut hairstyle with curved swept volume
        ctx.fillStyle = '#2d3436';
        ctx.beginPath();
        ctx.moveTo(x + 2, y - 6);
        ctx.quadraticCurveTo(x + 6, y - 12, x + 14, y - 10);
        ctx.quadraticCurveTo(x + 18, y - 7, x + 17, y - 3);
        ctx.quadraticCurveTo(x + 13, y - 7, x + 6, y - 5);
        ctx.quadraticCurveTo(x + 13, y - 7, x + 6, y - 5);
        ctx.closePath();
        ctx.fill();

        // Tortoiseshell Glasses with Anti-glare Cyan Reflection
        ctx.strokeStyle = '#6d4c41';
        ctx.lineWidth = 1.0;
        ctx.beginPath();
        ctx.ellipse(x + 7.5, y - 2, 2.5, 2.2, 0, 0, Math.PI * 2);
        ctx.stroke();
        ctx.beginPath();
        ctx.ellipse(x + 12.5, y - 2, 2.5, 2.2, 0, 0, Math.PI * 2);
        ctx.stroke();
        ctx.beginPath();
        ctx.moveTo(x + 10, y - 2);
        ctx.lineTo(x + 10, y - 2);
        ctx.stroke();
        ctx.fillStyle = '#81ecec'; // Lens anti-glare reflection
        ctx.fillRect(x + 8, y - 3, 1.2, 1);
        ctx.fillRect(x + 13, y - 3, 1.2, 1);

        // Premium Leather Messenger Bag with brass hardware
        ctx.fillStyle = '#5d4037';
        ctx.beginPath();
        ctx.roundRect(x - 5, y + 20, 7.5, 12, 2);
        ctx.fill();
        ctx.fillStyle = '#f4c430'; // Brass buckles
        ctx.fillRect(x - 3.5, y + 23, 2, 1.5);
        ctx.fillRect(x - 3.5, y + 28, 2, 1.5);
        break;
      }

      case 2: { // CÔ BA - HÀNG XÓM (Áo bà ba gấm vàng hoa sen, nút ngọc trai, nón lá quai lụa hồng, khăn rằn tua rua, giỏ hoa sen tươi)
        // Black satin flowing trousers with soft flutter
        this.drawCurvedLimb(ctx, x + 6, y + 24 + walkBob, x + 6, y + 38 + walkBob, 2.8, 2.2, '#1e131d');
        this.drawCurvedLimb(ctx, x + 13, y + 24 - walkBob, x + 13, y + 38 - walkBob, 2.8, 2.2, '#1e131d');

        // Radiant Golden Silk Áo Bà Ba with embossed lotus brocade
        ctx.fillStyle = '#f1c40f';
        ctx.beginPath();
        ctx.moveTo(x + 3, y + 7);
        ctx.lineTo(x + 16, y + 7);
        ctx.quadraticCurveTo(x + 17, y + 16, x + 19, y + 26);
        ctx.lineTo(x + 13, y + 25);
        ctx.quadraticCurveTo(x + 10, y + 17, x + 6, y + 25);
        ctx.lineTo(x, y + 26);
        ctx.quadraticCurveTo(x + 2, y + 16, x + 3, y + 7);
        ctx.closePath();
        ctx.fill();

        // Shimmering Lotus Brocade Gold Petal Accents
        ctx.fillStyle = '#f39c12';
        ctx.beginPath();
        ctx.arc(x + 5, y + 14, 1.5, 0, Math.PI * 2);
        ctx.arc(x + 14, y + 18, 1.5, 0, Math.PI * 2);
        ctx.arc(x + 11, y + 12, 1.2, 0, Math.PI * 2);
        ctx.fill();

        // Pearl Buttons down center with specular highlight
        for (let pb = y + 10; pb <= y + 22; pb += 4) {
          ctx.fillStyle = '#ffffff';
          ctx.beginPath();
          ctx.arc(x + 9.5, pb, 1.2, 0, Math.PI * 2);
          ctx.fill();
        }

        // Southern Checkered Scarf (Khăn Rằn) draped with fine fringe tassels
        ctx.fillStyle = '#ecf0f1';
        ctx.beginPath();
        ctx.roundRect(x + 2, y + 8, 4, 15, 2);
        ctx.fill();
        ctx.fillStyle = '#2c3e50';
        ctx.fillRect(x + 3, y + 11, 2, 2);
        ctx.fillRect(x + 3, y + 15, 2, 2);
        ctx.fillRect(x + 3, y + 19, 2, 2);
        // Fringe tassels at scarf end
        ctx.fillStyle = '#bdc3c7';
        ctx.fillRect(x + 2.5, y + 23, 3, 2.5);

        // Head & Warm Gentle Smile
        this.drawOrganicHead(ctx, x + 9.5, y - 2, 7.2, 8.2, '#ffe0bd', 'rgba(255, 123, 123, 0.4)', isBlinking, '#2c1e13', isHappy);

        // Conical Leaf Hat (Nón Lá) with fine straw weave rings & pink silk ribbon
        const hatSway = Math.sin(this.tick * 0.1) * 1.5;
        ctx.fillStyle = '#f5deb3';
        ctx.beginPath();
        ctx.moveTo(x + 9.5, y - 16 + hatSway);
        ctx.lineTo(x - 5, y - 4 + hatSway);
        ctx.quadraticCurveTo(x + 9.5, y - 1 + hatSway, x + 24, y - 4 + hatSway);
        ctx.closePath();
        ctx.fill();
        // Straw weave rings
        ctx.strokeStyle = '#d7ba89';
        ctx.lineWidth = 0.8;
        ctx.stroke();
        ctx.beginPath();
        ctx.moveTo(x - 1, y - 7 + hatSway);
        ctx.quadraticCurveTo(x + 9.5, y - 4 + hatSway, x + 20, y - 7 + hatSway);
        ctx.stroke();

        // Pastel Magenta Silk Chin Ribbon
        ctx.fillStyle = '#ff79c6';
        ctx.beginPath();
        ctx.arc(x + 9.5, y + 4 + hatSway, 2.2, 0, Math.PI * 2);
        ctx.fill();

        // Shimmering Emerald Jade Bangle on wrist
        ctx.fillStyle = '#2ecc71';
        ctx.beginPath();
        ctx.ellipse(x + 16, y + 21 - walkBob, 2.5, 1.8, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(x + 16, y + 20 - walkBob, 1, 0.8);

        // Wicker Basket with fresh blooming lotus blossoms
        ctx.fillStyle = '#b7791f';
        ctx.beginPath();
        ctx.roundRect(x + 17, y + 16, 9.5, 9.5, [2, 2, 4, 4]);
        ctx.fill();
        // Pink Lotus blooms peeking out
        ctx.fillStyle = '#ff7675';
        ctx.beginPath();
        ctx.arc(x + 20, y + 14, 2.8, 0, Math.PI * 2);
        ctx.arc(x + 24, y + 15, 2.2, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = '#2ecc71'; // Lotus leaf
        ctx.beginPath();
        ctx.ellipse(x + 21, y + 17, 3, 1.5, 0.2, 0, Math.PI * 2);
        ctx.fill();
        break;
      }

      case 3: { // TÚ - TIKTOKER REVIEWER (Hoodie ombre pastel, tóc bạch kim ombre hồng, tai nghe DJ RGB đổi màu, smartphone quay video có sóng âm REC)
        // Baggy cargo joggers with ankle cuffs & Chunky Dad Sneakers
        this.drawCurvedLimb(ctx, x + 6, y + 24 + walkBob, x + 6, y + 38 + walkBob, 3.2, 2.4, '#2d3436');
        this.drawCurvedLimb(ctx, x + 13, y + 24 - walkBob, x + 13, y + 38 - walkBob, 3.2, 2.4, '#2d3436');
        // Chunky Dad Sneakers with neon turquoise curved air soles
        this.drawCurvedShoe(ctx, x + 6, y + 38 + walkBob, 8.5, 3.6, '#dfe6e9', '#00cec9');
        this.drawCurvedShoe(ctx, x + 13, y + 38 - walkBob, 8.5, 3.6, '#dfe6e9', '#00cec9');

        // Oversized Pastel Gradient Hoodie (Lavender fading to Soft Peach)
        const hoodGrad = ctx.createLinearGradient(x, y + 6, x, y + 25);
        hoodGrad.addColorStop(0, '#a29bfe'); // Lavender
        hoodGrad.addColorStop(1, '#fab1a0'); // Soft Peach
        ctx.fillStyle = hoodGrad;
        ctx.beginPath();
        ctx.roundRect(x, y + 6, 19, 19, [6, 6, 4, 4]);
        ctx.fill();

        // White hoodie drawstrings with silver aglets
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(x + 7, y + 10); ctx.lineTo(x + 6, y + 17);
        ctx.moveTo(x + 12, y + 10); ctx.lineTo(x + 13, y + 17);
        ctx.stroke();
        ctx.fillStyle = '#bdc3c7'; // Silver aglets
        ctx.fillRect(x + 5.5, y + 17, 1.2, 2);
        ctx.fillRect(x + 12.5, y + 17, 1.2, 2);

        // Front Kangaroo curved pouch with heart pin
        ctx.fillStyle = 'rgba(108, 92, 231, 0.45)';
        ctx.beginPath();
        ctx.roundRect(x + 4, y + 15, 11, 6.5, [2, 2, 3, 3]);
        ctx.fill();
        ctx.fillStyle = '#ff7675'; // Enamel heart pin
        ctx.beginPath();
        ctx.arc(x + 9.5, y + 18, 1.5, 0, Math.PI * 2);
        ctx.fill();

        // Head & Trendy Anime Face
        this.drawOrganicHead(ctx, x + 9.5, y - 2, 7.5, 8.5, '#ffe0bd', 'rgba(255, 118, 117, 0.4)', isBlinking, '#2d3436', isHappy);

        // Platinum Blonde to Pastel Pink Ombré Wavy Hair
        ctx.fillStyle = '#ffeaa7'; // Platinum blonde roots
        ctx.beginPath();
        ctx.arc(x + 9.5, y - 5, 8.5, Math.PI * 0.8, Math.PI * 2.2);
        ctx.fill();
        // Pink Ombre wavy tips
        ctx.fillStyle = '#ff7675';
        ctx.beginPath();
        ctx.moveTo(x + 1, y - 4);
        ctx.quadraticCurveTo(x - 1, y + 4, x + 2, y + 8);
        ctx.lineTo(x + 3, y - 2);
        ctx.moveTo(x + 18, y - 4);
        ctx.quadraticCurveTo(x + 20, y + 4, x + 17, y + 8);
        ctx.lineTo(x + 16, y - 2);
        ctx.fill();

        // Over-Ear DJ Headphones with Cycling RGB Rainbow Glow
        const rgbHue = (this.tick * 4) % 360;
        ctx.strokeStyle = '#2d3436';
        ctx.lineWidth = 2.5;
        ctx.beginPath();
        ctx.arc(x + 9.5, y - 6, 8.5, Math.PI * 1.1, Math.PI * 1.9);
        ctx.stroke();
        // Cycling RGB Glowing earcups!
        ctx.fillStyle = `hsl(${rgbHue}, 100%, 65%)`;
        ctx.beginPath();
        ctx.roundRect(x - 1, y - 4, 3.5, 6, 2);
        ctx.roundRect(x + 16.5, y - 4, 3.5, 6, 2);
        ctx.fill();

        // Smartphone Gimbal with glowing screen & pulsing RED REC light
        ctx.fillStyle = '#1e272e';
        ctx.beginPath();
        ctx.roundRect(x + 17, y + 8, 6.5, 13, 1.5);
        ctx.fill();
        // Screen with audio waveform
        ctx.fillStyle = '#74b9ff';
        ctx.fillRect(x + 18, y + 10, 4.5, 9);
        // Audio wave ticks
        ctx.fillStyle = '#00cec9';
        const waveTick = (this.tick % 6);
        ctx.fillRect(x + 18.5, y + 14 - waveTick * 0.5, 1, 3 + waveTick * 0.5);
        ctx.fillRect(x + 20, y + 13 + waveTick * 0.3, 1, 4 - waveTick * 0.3);

        // Flashing RED REC recording dot!
        if ((this.tick % 24) < 12) {
          ctx.fillStyle = '#ff4757';
          ctx.beginPath();
          ctx.arc(x + 20.5, y + 9.5, 1.2, 0, Math.PI * 2);
          ctx.fill();
        }
        break;
      }

      case 4: { // ANH SHIPPER (Sporty windbreaker, 3M reflective safety stripes, cat-ear helmet with rainbow iridescent visor, live GPS navigation, thermal bag)
        // Waterproof Riding Cargo Trousers with reinforced knee patches & walk bounce
        this.drawCurvedLimb(ctx, x + 6, y + 24 + walkBob, x + 6, y + 38 + walkBob, 3.0, 2.4, '#1e272e');
        this.drawCurvedLimb(ctx, x + 13, y + 24 - walkBob, x + 13, y + 38 - walkBob, 3.0, 2.4, '#1e272e');
        // Reinforced motorcycle knee pads
        ctx.fillStyle = '#2f3640';
        ctx.beginPath();
        ctx.ellipse(x + 6, y + 30 + walkBob, 2.2, 3, 0, 0, Math.PI * 2);
        ctx.ellipse(x + 13, y + 30 - walkBob, 2.2, 3, 0, 0, Math.PI * 2);
        ctx.fill();

        // Heavy-duty Motorcycle Touring Boots with high-traction treads
        this.drawCurvedShoe(ctx, x + 6.5, y + 38 + walkBob, 8.5, 3.6, '#0f1416', '#718093');
        this.drawCurvedShoe(ctx, x + 13.5, y + 38 - walkBob, 8.5, 3.6, '#0f1416', '#718093');
        // Fluorescent yellow boot accents
        ctx.fillStyle = '#f1c40f';
        ctx.fillRect(x + 7.5, y + 39 + walkBob, 2.5, 1);
        ctx.fillRect(x + 14.5, y + 39 - walkBob, 2.5, 1);

        // Sporty Dual-Tone Delivery Windbreaker (Emerald & Graphite)
        const jacketGrad = ctx.createLinearGradient(x + 1, y + 7, x + 18, y + 26);
        jacketGrad.addColorStop(0, '#00b894');
        jacketGrad.addColorStop(0.6, '#00a884');
        jacketGrad.addColorStop(1, '#2d3436');
        ctx.fillStyle = jacketGrad;
        ctx.beginPath();
        ctx.roundRect(x + 1, y + 7, 17, 19, [4, 4, 3, 3]);
        ctx.fill();

        // 3M Fluorescent Hi-Vis Reflective Safety Stripes with soft neon glow
        ctx.fillStyle = '#55efc4';
        ctx.beginPath();
        ctx.roundRect(x + 1, y + 13, 17, 2.2, 1);
        ctx.roundRect(x + 1, y + 19, 17, 2.2, 1);
        ctx.fill();
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(x + 2, y + 13.5, 15, 1); // high specular core
        ctx.fillRect(x + 2, y + 19.5, 15, 1);

        // Central metal zipper & company crest badge
        ctx.strokeStyle = '#dfe6e9';
        ctx.lineWidth = 0.9;
        ctx.beginPath();
        ctx.moveTo(x + 9.5, y + 7);
        ctx.lineTo(x + 9.5, y + 26);
        ctx.stroke();
        // Golden Express Delivery Crest on chest
        ctx.fillStyle = '#f39c12';
        ctx.beginPath();
        ctx.arc(x + 5.5, y + 10.5, 1.8, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = '#fff';
        ctx.beginPath();
        ctx.arc(x + 5.5, y + 10.5, 0.8, 0, Math.PI * 2);
        ctx.fill();

        // Aerodynamic Full-Face Helmet with Gloss Shell & 3D Cat Ears
        ctx.fillStyle = '#00a884';
        ctx.beginPath();
        ctx.arc(x + 9.5, y - 2, 9.5, 0, Math.PI * 2);
        ctx.fill();
        // Helmet rim shadow & trim
        ctx.strokeStyle = '#1e272e';
        ctx.lineWidth = 1.2;
        ctx.stroke();

        // Rainbow Iridescent Curved Visor (Chroma Mirror Coating)
        const visorGrad = ctx.createLinearGradient(x + 5, y - 5, x + 15, y + 2);
        visorGrad.addColorStop(0, '#00cec9');
        visorGrad.addColorStop(0.4, '#6c5ce7');
        visorGrad.addColorStop(0.8, '#fd79a8');
        visorGrad.addColorStop(1, '#ffeaa7');
        ctx.fillStyle = visorGrad;
        ctx.beginPath();
        ctx.roundRect(x + 4.5, y - 4.5, 10, 6.5, 2.5);
        ctx.fill();
        // Specular glossy reflection sweep across visor
        ctx.fillStyle = 'rgba(255, 255, 255, 0.7)';
        ctx.beginPath();
        ctx.moveTo(x + 6, y - 4);
        ctx.lineTo(x + 13, y - 4);
        ctx.lineTo(x + 11, y - 2);
        ctx.lineTo(x + 6, y - 2);
        ctx.closePath();
        ctx.fill();

        // 3D Cute Cat Ears on helmet with pastel pink inner cushions
        ctx.fillStyle = '#ffffff';
        ctx.beginPath();
        ctx.moveTo(x + 3.5, y - 7.5);
        ctx.lineTo(x + 6.5, y - 14.5);
        ctx.lineTo(x + 9, y - 8);
        ctx.closePath();
        ctx.fill();
        ctx.beginPath();
        ctx.moveTo(x + 10.5, y - 8);
        ctx.lineTo(x + 13, y - 14.5);
        ctx.lineTo(x + 16, y - 7.5);
        ctx.closePath();
        ctx.fill();
        // Pink inner cushions
        ctx.fillStyle = '#ff7675';
        ctx.beginPath();
        ctx.moveTo(x + 4.8, y - 8.5);
        ctx.lineTo(x + 6.5, y - 13);
        ctx.lineTo(x + 8.2, y - 8.8);
        ctx.closePath();
        ctx.fill();
        ctx.beginPath();
        ctx.moveTo(x + 11.2, y - 8.8);
        ctx.lineTo(x + 13, y - 13);
        ctx.lineTo(x + 14.8, y - 8.5);
        ctx.closePath();
        ctx.fill();

        // Professional Orange Thermal Delivery Backpack on Hip
        ctx.fillStyle = '#e17055';
        ctx.beginPath();
        ctx.roundRect(x - 7, y + 11, 8.5, 15, 2.5);
        ctx.fill();
        // Reflective white safety stripe on thermal pack
        ctx.fillStyle = '#f5f6fa';
        ctx.fillRect(x - 7, y + 17, 8.5, 2);
        // Mesh side drink pocket
        ctx.fillStyle = '#d63031';
        ctx.fillRect(x - 6, y + 20, 6.5, 4.5);

        // Smartphone Mount displaying Live GPS Route
        ctx.fillStyle = '#1e272e';
        ctx.beginPath();
        ctx.roundRect(x + 17, y + 13, 6, 10, 1.2);
        ctx.fill();
        // Cyan GPS map screen
        ctx.fillStyle = '#0984e3';
        ctx.fillRect(x + 17.8, y + 14, 4.4, 8);
        // Glowing cyan route track
        ctx.strokeStyle = '#00cec9';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(x + 18.5, y + 21);
        ctx.lineTo(x + 20, y + 18);
        ctx.lineTo(x + 19.5, y + 15.5);
        ctx.stroke();
        // Pulsing Destination Waypoint Dot
        ctx.fillStyle = ((this.tick % 20) < 10) ? '#ff4757' : '#ffa502';
        ctx.beginPath();
        ctx.arc(x + 19.5, y + 15.5, 1.1, 0, Math.PI * 2);
        ctx.fill();
        break;
      }

      case 5: { // BÁC BA TRƯỞNG PHỐ (Royal sapphire blue brocade Áo Dài with golden cloud embroidery, black Khăn Đóng, flowing silver beard, calligraphy bamboo fan, jade prayer beads)
        // Pristine White Silk inner pants with flowing drape & walk bob
        this.drawCurvedLimb(ctx, x + 6, y + 25 + walkBob, x + 6, y + 38 + walkBob, 2.8, 2.2, '#f5f6fa');
        this.drawCurvedLimb(ctx, x + 13, y + 25 - walkBob, x + 13, y + 38 - walkBob, 2.8, 2.2, '#f5f6fa');
        // Traditional Embroidered Silk Slip-On Slippers
        this.drawCurvedShoe(ctx, x + 6.5, y + 38 + walkBob, 7.5, 3.2, '#8b4513', '#d4a373');
        this.drawCurvedShoe(ctx, x + 13.5, y + 38 - walkBob, 7.5, 3.2, '#8b4513', '#d4a373');
        ctx.fillStyle = '#f1c40f'; // Golden embroidered toe tip
        ctx.fillRect(x + 10, y + 39 + walkBob, 2, 1.2);
        ctx.fillRect(x + 17, y + 39 - walkBob, 2, 1.2);

        // Traditional Royal Sapphire Blue Brocade Áo Dài Gấm The with sweeping split panels
        const aoDaiGrad = ctx.createLinearGradient(x + 2, y + 6, x + 18, y + 34);
        aoDaiGrad.addColorStop(0, '#1e3799');
        aoDaiGrad.addColorStop(0.5, '#0984e3');
        aoDaiGrad.addColorStop(1, '#0c2461');
        ctx.fillStyle = aoDaiGrad;
        ctx.beginPath();
        ctx.moveTo(x + 2, y + 6);
        ctx.lineTo(x + 17, y + 6);
        ctx.quadraticCurveTo(x + 18.5, y + 20, x + 19.5, y + 33);
        ctx.lineTo(x + 13, y + 32);
        ctx.quadraticCurveTo(x + 9.5, y + 21, x + 6, y + 32);
        ctx.lineTo(x + 1, y + 33);
        ctx.quadraticCurveTo(x + 1.5, y + 20, x + 2, y + 6);
        ctx.closePath();
        ctx.fill();

        // Intricate Golden Dragon & Cloud Brocade Embroidery (Chữ Vạn & mây vàng)
        ctx.fillStyle = '#f1c40f';
        ctx.beginPath();
        ctx.arc(x + 6, y + 12, 1.3, 0, Math.PI * 2);
        ctx.arc(x + 8, y + 14, 1.1, 0, Math.PI * 2);
        ctx.arc(x + 14, y + 17, 1.4, 0, Math.PI * 2);
        ctx.arc(x + 12, y + 24, 1.2, 0, Math.PI * 2);
        ctx.arc(x + 5, y + 26, 1.3, 0, Math.PI * 2);
        ctx.fill();
        // Golden hemline piping
        ctx.strokeStyle = '#f1c40f';
        ctx.lineWidth = 0.8;
        ctx.beginPath();
        ctx.moveTo(x + 1, y + 33);
        ctx.lineTo(x + 6, y + 32);
        ctx.moveTo(x + 13, y + 32);
        ctx.lineTo(x + 19.5, y + 33);
        ctx.stroke();

        // Traditional golden frog buttons down right shoulder
        ctx.fillStyle = '#f5cd79';
        ctx.beginPath();
        ctx.arc(x + 12.5, y + 8.5, 1.3, 0, Math.PI * 2);
        ctx.arc(x + 12.5, y + 13.5, 1.3, 0, Math.PI * 2);
        ctx.arc(x + 12.5, y + 18.5, 1.3, 0, Math.PI * 2);
        ctx.fill();

        // Head & Wise Aged Face
        this.drawOrganicHead(ctx, x + 9.5, y - 2, 7.5, 8.5, '#ffe0bd', 'rgba(255, 170, 150, 0.22)', isBlinking, '#2c3e50', isHappy);

        // Traditional Multi-Layered Black Khăn Đóng (headwrap) with silk pleats
        ctx.fillStyle = '#111111';
        ctx.beginPath();
        ctx.ellipse(x + 9.5, y - 6.5, 8.5, 3.6, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = '#333333';
        ctx.lineWidth = 0.7;
        ctx.beginPath();
        ctx.ellipse(x + 9.5, y - 7.5, 7.5, 2.8, 0, 0, Math.PI * 2);
        ctx.stroke();

        // Flowing Long White Silver Beard cascading over chest with gentle swaying
        const beardSway = Math.sin(this.tick * 0.15) * 1.5;
        const beardGrad = ctx.createLinearGradient(x + 9.5, y + 3, x + 9.5, y + 22);
        beardGrad.addColorStop(0, '#ffffff');
        beardGrad.addColorStop(1, '#dcdde1');
        ctx.fillStyle = beardGrad;
        ctx.beginPath();
        ctx.moveTo(x + 6.5, y + 3);
        ctx.quadraticCurveTo(x + 5 + beardSway, y + 14, x + 9.5 + beardSway, y + 22);
        ctx.quadraticCurveTo(x + 14 + beardSway, y + 14, x + 12.5, y + 3);
        ctx.closePath();
        ctx.fill();
        // Whisker hair strands
        ctx.strokeStyle = '#b2bec3';
        ctx.lineWidth = 0.6;
        ctx.beginPath();
        ctx.moveTo(x + 8.5, y + 6);
        ctx.lineTo(x + 9.5 + beardSway, y + 19);
        ctx.stroke();

        // Calligraphy Bamboo Fan with dangling red silk tassel waving gently
        const fanWave = Math.sin(this.tick * 0.2) * 3.5;
        ctx.fillStyle = '#f5deb3';
        ctx.beginPath();
        ctx.ellipse(x + 19 + fanWave, y + 15, 6.5, 4.5, 0.4, 0, Math.PI * 2);
        ctx.fill();
        // Bamboo ribs & calligraphy stroke
        ctx.strokeStyle = '#8b5a2b';
        ctx.lineWidth = 0.8;
        ctx.beginPath();
        ctx.moveTo(x + 16, y + 18);
        ctx.lineTo(x + 22 + fanWave, y + 12);
        ctx.moveTo(x + 16, y + 18);
        ctx.lineTo(x + 20 + fanWave, y + 11);
        ctx.stroke();
        // Dangling Red Silk Tassel
        ctx.strokeStyle = '#e74c3c';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(x + 16, y + 18);
        ctx.lineTo(x + 15 + fanWave * 0.5, y + 23);
        ctx.stroke();
        ctx.fillStyle = '#e74c3c';
        ctx.beginPath();
        ctx.arc(x + 15 + fanWave * 0.5, y + 23.5, 1.2, 0, Math.PI * 2);
        ctx.fill();

        // Shimmering Jade Prayer Beads on wrist
        ctx.fillStyle = '#00b894';
        for (let b = 0; b < 4; b++) {
          ctx.beginPath();
          ctx.arc(x + 15 + b * 1.5, y + 19 - b * 0.5, 1.1, 0, Math.PI * 2);
          ctx.fill();
        }

        // Curved Bamboo Birdcage with chirping yellow canary
        ctx.strokeStyle = '#cd853f';
        ctx.lineWidth = 1.1;
        ctx.beginPath();
        ctx.arc(x - 5, y + 12, 4.5, Math.PI, 0);
        ctx.lineTo(x - 0.5, y + 22);
        ctx.lineTo(x - 9.5, y + 22);
        ctx.closePath();
        ctx.stroke();
        // Canary bird inside
        ctx.fillStyle = '#f1fa8c';
        ctx.beginPath();
        ctx.arc(x - 5, y + 17, 2.2, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = '#e17055'; // beak
        ctx.fillRect(x - 3.2, y + 16.5, 1.2, 1);
        break;
      }

      case 6: { // HOÀNG QUÂN GYMER (Compression tank top with pectoral & deltoid muscle contours, athletic joggers with white racing side stripes, shaker bottle, smartwatch heart rate ♥ 115 bpm)
        // Charcoal athletic tapered joggers with double white racing stripes & walk bounce
        this.drawCurvedLimb(ctx, x + 6, y + 24 + walkBob, x + 6, y + 38 + walkBob, 3.4, 2.6, '#2d3436');
        this.drawCurvedLimb(ctx, x + 13, y + 24 - walkBob, x + 13, y + 38 - walkBob, 3.4, 2.6, '#2d3436');
        // Double white side racing stripes along outer legs
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(x + 4.2, y + 25 + walkBob, 0.8, 12);
        ctx.fillRect(x + 14.8, y + 25 - walkBob, 0.8, 12);

        // Chunky Training Sneakers with red/white air-cushion bounce soles
        this.drawCurvedShoe(ctx, x + 6.5, y + 38 + walkBob, 8.5, 3.6, '#ff4757', '#ffffff');
        this.drawCurvedShoe(ctx, x + 13.5, y + 38 - walkBob, 8.5, 3.6, '#ff4757', '#ffffff');
        ctx.fillStyle = '#2f3542'; // Laces
        ctx.fillRect(x + 8.5, y + 37.5 + walkBob, 2.5, 0.8);
        ctx.fillRect(x + 15.5, y + 37.5 - walkBob, 2.5, 0.8);

        // Broad Muscular Tanned Torso with curved athletic taper
        ctx.fillStyle = '#e0a96d';
        ctx.beginPath();
        ctx.roundRect(x - 1.5, y + 5, 22, 20, [7, 7, 3, 3]);
        ctx.fill();

        // Deep Crimson Muscle Cut-off Tank Top fitting tightly to frame
        const tankGrad = ctx.createLinearGradient(x + 2, y + 5, x + 17, y + 24);
        tankGrad.addColorStop(0, '#ff4757');
        tankGrad.addColorStop(1, '#c0392b');
        ctx.fillStyle = tankGrad;
        ctx.beginPath();
        ctx.moveTo(x + 3.5, y + 5);
        ctx.lineTo(x + 15.5, y + 5);
        ctx.quadraticCurveTo(x + 17, y + 14, x + 15.5, y + 24);
        ctx.lineTo(x + 3.5, y + 24);
        ctx.quadraticCurveTo(x + 2, y + 14, x + 3.5, y + 5);
        ctx.closePath();
        ctx.fill();

        // Pectoral Muscle Contour Line & Clavicle Shading
        ctx.strokeStyle = '#a32b20';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(x + 9.5, y + 9);
        ctx.lineTo(x + 9.5, y + 16);
        ctx.moveTo(x + 5.5, y + 15);
        ctx.quadraticCurveTo(x + 9.5, y + 17, x + 13.5, y + 15);
        ctx.stroke();

        // Sculpted Deltoids & Bulging Biceps
        ctx.fillStyle = '#d49b61';
        ctx.beginPath();
        ctx.ellipse(x - 2.5, y + 10.5, 3.2, 5, 0.15, 0, Math.PI * 2);
        ctx.ellipse(x + 21.5, y + 10.5, 3.2, 5, -0.15, 0, Math.PI * 2);
        ctx.fill();

        // Head & Confident Handsome Expression
        this.drawOrganicHead(ctx, x + 9.5, y - 2, 7.8, 8.5, '#e0a96d', 'rgba(230, 100, 100, 0.25)', isBlinking, '#111', isHappy);

        // Modern Undercut Fade Hairstyle
        ctx.fillStyle = '#1e272c';
        ctx.beginPath();
        ctx.arc(x + 9.5, y - 6.5, 8.2, Math.PI * 0.9, Math.PI * 2.1);
        ctx.fill();

        // White Performance Sweat Headband with Crimson Logo
        ctx.fillStyle = '#ffffff';
        ctx.beginPath();
        ctx.roundRect(x + 2, y - 6.5, 15, 3.5, 1.5);
        ctx.fill();
        ctx.fillStyle = '#ff4757';
        ctx.fillRect(x + 8.5, y - 5.5, 2, 1.5); // Brand emblem

        // Smartwatch on wrist with Live Heart Rate Monitor (♥ 115 bpm)
        ctx.fillStyle = '#1e272e';
        ctx.beginPath();
        ctx.roundRect(x - 5.5, y + 17, 3.5, 4.5, 1);
        ctx.fill();
        // Glowing OLED screen displaying pulsing red heart
        ctx.fillStyle = '#ff4757';
        if ((this.tick % 16) < 8) {
          ctx.beginPath();
          ctx.arc(x - 4, y + 19, 0.9, 0, Math.PI * 2);
          ctx.fill();
        }

        // Ergonomic Translucent Protein Shaker Bottle with Neon Cap
        ctx.fillStyle = 'rgba(255, 255, 255, 0.75)';
        ctx.beginPath();
        ctx.roundRect(x + 19, y + 14, 6, 11, [2, 2, 3, 3]);
        ctx.fill();
        // Shake fluid inside (Chocolate whey)
        ctx.fillStyle = '#8b5a2b';
        ctx.fillRect(x + 19.5, y + 17, 5, 7.5);
        // Measurement markings on bottle
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(x + 23.5, y + 18, 1, 0.7);
        ctx.fillRect(x + 23.5, y + 20, 1, 0.7);
        ctx.fillRect(x + 23.5, y + 22, 1, 0.7);
        // Vibrant Neon Orange Flip-Cap
        ctx.fillStyle = '#ff793f';
        ctx.beginPath();
        ctx.roundRect(x + 18.5, y + 12, 7, 3, 1.5);
        ctx.fill();
        break;
      }

      case 7: { // CẶP ĐÔI GÀ BÔNG (Duy & Linh: Matching cream & strawberry hoodies, interlocking hands with pulsing pink love aura, shared jumbo boba cup with crossing heart straws)
        // Boy (Left) and Girl (Right) standing snugly side-by-side
        // Duy: Cuffed dark denim jeans & high-top sneakers
        this.drawCurvedLimb(ctx, x + 4, y + 25 + walkBob, x + 4, y + 38 + walkBob, 2.6, 2.0, '#2d3436');
        this.drawCurvedShoe(ctx, x + 4, y + 38 + walkBob, 6.8, 3.2, '#1e272e', '#ffffff');
        // Linh: Flirty knife-pleated white tennis skirt & knee-high socks
        this.drawCurvedLimb(ctx, x + 15, y + 25 - walkBob, x + 15, y + 38 - walkBob, 2.6, 2.0, '#ffffff');
        this.drawCurvedShoe(ctx, x + 15, y + 38 - walkBob, 6.8, 3.2, '#ff6b81', '#ffffff');
        // Knife-pleated skirt for Linh
        ctx.fillStyle = '#f1f2f6';
        ctx.beginPath();
        ctx.moveTo(x + 12, y + 24);
        ctx.lineTo(x + 19, y + 24);
        ctx.lineTo(x + 20.5, y + 29);
        ctx.lineTo(x + 10.5, y + 29);
        ctx.closePath();
        ctx.fill();

        // Matching Couple Hoodies (Duy wears Cream #ffeaa7, Linh wears Strawberry #ff7675)
        // Duy's Hoodie (Left half)
        ctx.fillStyle = '#ffeaa7';
        ctx.beginPath();
        ctx.roundRect(x - 2, y + 7, 12, 18, [5, 2, 2, 4]);
        ctx.fill();
        // Linh's Hoodie (Right half)
        ctx.fillStyle = '#ff7675';
        ctx.beginPath();
        ctx.roundRect(x + 10, y + 7, 12, 17, [2, 5, 4, 2]);
        ctx.fill();

        // Interlocking Embroidered Full Heart stitched across the seam
        ctx.fillStyle = '#e84118';
        ctx.beginPath();
        ctx.arc(x + 8.5, y + 13, 2.2, Math.PI, 0);
        ctx.arc(x + 11.5, y + 13, 2.2, Math.PI, 0);
        ctx.lineTo(x + 10, y + 17.5);
        ctx.closePath();
        ctx.fill();

        // Warm Shared Chunky Knit Scarf looping tenderly around both necks
        ctx.fillStyle = '#f7d794';
        ctx.beginPath();
        ctx.roundRect(x - 1, y + 4.5, 22, 5.5, 2.5);
        ctx.fill();
        // Scarf knit fringe tassels
        ctx.strokeStyle = '#eccc68';
        ctx.lineWidth = 0.8;
        ctx.stroke();

        // Duy Head (Left)
        this.drawOrganicHead(ctx, x + 5, y - 2, 5.5, 6.8, '#ffe0bd', null, isBlinking, '#2c1e13', isHappy);
        // Duy's fluffy textured boy hair
        ctx.fillStyle = '#3d312a';
        ctx.beginPath();
        ctx.arc(x + 5, y - 4.5, 6.2, Math.PI * 0.9, Math.PI * 2.1);
        ctx.fill();

        // Linh Head (Right)
        this.drawOrganicHead(ctx, x + 15, y - 2, 5.5, 6.8, '#ffe0bd', 'rgba(255, 107, 129, 0.45)', isBlinking, '#2c1e13', isHappy);
        // Linh's soft dark hair with cute twin low buns & cherry hairpin
        ctx.fillStyle = '#2c1e13';
        ctx.beginPath();
        ctx.arc(x + 15, y - 4.5, 6.2, Math.PI * 0.9, Math.PI * 2.1);
        ctx.fill();
        // Cute twin buns
        ctx.beginPath();
        ctx.arc(x + 11, y - 7, 2.5, 0, Math.PI * 2);
        ctx.arc(x + 19, y - 7, 2.5, 0, Math.PI * 2);
        ctx.fill();
        // Cherry Red Hairpin
        ctx.fillStyle = '#ff3838';
        ctx.beginPath();
        ctx.arc(x + 17.5, y - 6, 1.5, 0, Math.PI * 2);
        ctx.fill();

        // Interlocking Hands at the Center with Pulsing Pink Love Aura
        const lovePulse = Math.sin(this.tick * 0.2) * 1.5;
        ctx.fillStyle = `rgba(255, 121, 121, ${0.4 + lovePulse * 0.1})`;
        ctx.beginPath();
        ctx.arc(x + 10, y + 21, 3.5 + lovePulse, 0, Math.PI * 2);
        ctx.fill();

        // Joint Jumbo Boba Cup with 2 Crossing Heart-Shaped Straws (Coral Red & Sky Blue)
        ctx.fillStyle = 'rgba(255, 255, 255, 0.85)';
        ctx.beginPath();
        ctx.roundRect(x + 7, y + 15, 6, 8.5, [1, 1, 2.5, 2.5]);
        ctx.fill();
        // Milk tea with chewy black tapioca pearls
        ctx.fillStyle = '#d2a679';
        ctx.fillRect(x + 7.5, y + 17.5, 5, 5.5);
        ctx.fillStyle = '#2c1e13';
        ctx.beginPath();
        ctx.arc(x + 8.5, y + 22, 0.8, 0, Math.PI * 2);
        ctx.arc(x + 10, y + 22, 0.8, 0, Math.PI * 2);
        ctx.arc(x + 11.5, y + 22, 0.8, 0, Math.PI * 2);
        ctx.fill();
        // Red Straw for Linh & Blue Straw for Duy
        ctx.strokeStyle = '#ff4757';
        ctx.lineWidth = 1.1;
        ctx.beginPath();
        ctx.moveTo(x + 7.5, y + 11);
        ctx.lineTo(x + 9.5, y + 16.5);
        ctx.stroke();
        ctx.strokeStyle = '#0984e3';
        ctx.beginPath();
        ctx.moveTo(x + 12.5, y + 11);
        ctx.lineTo(x + 10.5, y + 16.5);
        ctx.stroke();
        break;
      }

      case 8: { // DAVID TÂY BA-LÔ (Hawaiian Aloha shirt with hibiscus floral print, Panama straw hat, 35mm rangefinder camera with glass reflection, aviator sunglasses)
        // Multi-pocket utility cargo shorts in sand-tan & walk bounce
        this.drawCurvedLimb(ctx, x + 6, y + 24 + walkBob, x + 6, y + 33 + walkBob, 2.8, 2.4, '#d2b48c');
        this.drawCurvedLimb(ctx, x + 13, y + 24 - walkBob, x + 13, y + 33 - walkBob, 2.8, 2.4, '#d2b48c');
        // Tanned legs & sturdy leather trekking sandals with buckles
        this.drawCurvedLimb(ctx, x + 6, y + 33 + walkBob, x + 6, y + 38 + walkBob, 2.2, 1.8, '#ffe0bd');
        this.drawCurvedLimb(ctx, x + 13, y + 33 - walkBob, x + 13, y + 38 - walkBob, 2.2, 1.8, '#ffe0bd');
        this.drawCurvedShoe(ctx, x + 6.5, y + 38 + walkBob, 8, 3.2, '#5d4037', '#d2b48c');
        this.drawCurvedShoe(ctx, x + 13.5, y + 38 - walkBob, 8, 3.2, '#5d4037', '#d2b48c');

        // Vibrant Sunshine-Yellow Hawaiian Tropical Floral Aloha Shirt
        ctx.fillStyle = '#f1c40f';
        ctx.beginPath();
        ctx.roundRect(x + 1, y + 7, 18, 18, [5, 5, 2, 2]);
        ctx.fill();
        // Lush Monstera Palm Leaves & Pink Hibiscus Blossom Prints
        ctx.fillStyle = '#2ed573';
        ctx.beginPath();
        ctx.ellipse(x + 4, y + 12, 2.5, 1.5, 0.4, 0, Math.PI * 2);
        ctx.ellipse(x + 15, y + 18, 2.5, 1.5, -0.4, 0, Math.PI * 2);
        ctx.ellipse(x + 9, y + 22, 2.2, 1.3, 0.2, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = '#ff4757';
        ctx.beginPath();
        ctx.arc(x + 13, y + 11.5, 2.2, 0, Math.PI * 2);
        ctx.arc(x + 5, y + 19, 2.0, 0, Math.PI * 2);
        ctx.fill();
        // White flower center stamen
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(x + 12.5, y + 11, 1, 1);
        ctx.fillRect(x + 4.5, y + 18.5, 1, 1);

        // Open camp-collar neckline revealing tanned chest
        ctx.fillStyle = '#ffe0bd';
        ctx.beginPath();
        ctx.moveTo(x + 7.5, y + 7);
        ctx.lineTo(x + 9.5, y + 13);
        ctx.lineTo(x + 11.5, y + 7);
        ctx.closePath();
        ctx.fill();

        // Head & Blue Anime Eyes
        this.drawOrganicHead(ctx, x + 9.5, y - 2, 7.5, 8.5, '#ffe0bd', 'rgba(255, 140, 100, 0.3)', isBlinking, '#0984e3', isHappy);

        // Sun-bleached Golden Blonde Wavy Beach Hair
        ctx.fillStyle = '#f9ca24';
        ctx.beginPath();
        ctx.arc(x + 4.5, y - 4, 3.8, 0, Math.PI * 2);
        ctx.arc(x + 14.5, y - 4, 3.8, 0, Math.PI * 2);
        ctx.arc(x + 9.5, y - 6.5, 7.8, 0, Math.PI * 2);
        ctx.fill();

        // Panama Straw Sun Hat with textured weave rings & red-navy ribbon
        ctx.fillStyle = '#f5deb3';
        ctx.beginPath();
        ctx.ellipse(x + 9.5, y - 8, 11.5, 3.8, 0, 0, Math.PI * 2);
        ctx.roundRect(x + 4.5, y - 14.5, 10, 6.5, [3, 3, 0, 0]);
        ctx.fill();
        // Red-and-Navy grosgrain hatband
        ctx.fillStyle = '#e74c3c';
        ctx.fillRect(x + 4.5, y - 10, 10, 2);
        ctx.fillStyle = '#1e3799';
        ctx.fillRect(x + 4.5, y - 9, 10, 1);

        // Polarized Aviator Sunglasses perched on head or eyes
        ctx.fillStyle = '#00d2d3';
        ctx.beginPath();
        ctx.ellipse(x + 7.5, y - 3, 2.2, 1.8, 0.1, 0, Math.PI * 2);
        ctx.ellipse(x + 11.5, y - 3, 2.2, 1.8, -0.1, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = '#f1c40f'; // Golden frame
        ctx.lineWidth = 0.7;
        ctx.beginPath();
        ctx.moveTo(x + 5, y - 3.5);
        ctx.lineTo(x + 14, y - 3.5);
        ctx.stroke();

        // Vintage 35mm Rangefinder Camera with leather strap & glass reflection
        // Leather neck strap
        ctx.strokeStyle = '#8b5a2b';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(x + 5, y + 9);
        ctx.lineTo(x + 7, y + 15);
        ctx.moveTo(x + 14, y + 9);
        ctx.lineTo(x + 12, y + 15);
        ctx.stroke();
        // Camera metal body
        ctx.fillStyle = '#2d3436';
        ctx.beginPath();
        ctx.roundRect(x + 5.5, y + 14.5, 9, 7.5, 1.8);
        ctx.fill();
        ctx.fillStyle = '#bdc3c7'; // Silver top plate
        ctx.fillRect(x + 5.5, y + 14.5, 9, 2);
        // Circular glass lens with anti-reflective optical cyan sheen
        ctx.fillStyle = '#00cec9';
        ctx.beginPath();
        ctx.arc(x + 10, y + 18.5, 2.5, 0, Math.PI * 2);
        ctx.fill();
        // Glass specular glint
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(x + 9, y + 17.5, 1.2, 1);
        break;
      }

      case 9: { // BÉ HẠNH VÉ SỐ & CÚN VÀNG (Denim dungaree overalls with embroidered cartoon duckling, sunshine yellow striped tee, reverse cat-ear cap, lucky lottery ticket display board, golden puppy at her feet)
        // Dark Indigo Denim Dungarees with brass rivets & walk bounce
        this.drawCurvedLimb(ctx, x + 6, y + 24 + walkBob, x + 6, y + 38 + walkBob, 2.8, 2.2, '#2c3e50');
        this.drawCurvedLimb(ctx, x + 13, y + 24 - walkBob, x + 13, y + 38 - walkBob, 2.8, 2.2, '#2c3e50');

        // Legendary Vietnamese Honeycomb Sandals (Dép Tổ Ong trắng huyền thoại với lỗ tổ ong chi tiết)
        this.drawCurvedShoe(ctx, x + 6.5, y + 38 + walkBob, 7.8, 3, '#f5f6fa', '#dcdde1');
        this.drawCurvedShoe(ctx, x + 13.5, y + 38 - walkBob, 7.8, 3, '#f5f6fa', '#dcdde1');
        // Honeycomb perforation grid dots
        ctx.fillStyle = '#bdc3c7';
        ctx.fillRect(x + 8.5, y + 38.5 + walkBob, 0.8, 0.8);
        ctx.fillRect(x + 10, y + 38.5 + walkBob, 0.8, 0.8);
        ctx.fillRect(x + 15.5, y + 38.5 - walkBob, 0.8, 0.8);
        ctx.fillRect(x + 17, y + 38.5 - walkBob, 0.8, 0.8);

        // Sunshine Yellow & White Striped Tee
        ctx.fillStyle = '#f1c40f';
        ctx.beginPath();
        ctx.roundRect(x + 1, y + 7, 17, 19, [4, 4, 2, 2]);
        ctx.fill();
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(x + 1, y + 9, 17, 2);
        ctx.fillRect(x + 1, y + 13, 17, 2);

        // Denim Dungaree Overalls on top with brass buckles
        ctx.fillStyle = '#2980b9';
        ctx.beginPath();
        ctx.roundRect(x + 3.5, y + 14, 12, 11, [2, 2, 1, 1]);
        ctx.fill();
        // Dungaree shoulder straps
        ctx.fillRect(x + 4, y + 8, 2.2, 7);
        ctx.fillRect(x + 13, y + 8, 2.2, 7);
        // Brass overall buttons
        ctx.fillStyle = '#f39c12';
        ctx.beginPath();
        ctx.arc(x + 5.1, y + 14.5, 1, 0, Math.PI * 2);
        ctx.arc(x + 14.1, y + 14.5, 1, 0, Math.PI * 2);
        ctx.fill();

        // Embroidered Cute Little Yellow Duckling on dungaree bib pocket
        ctx.fillStyle = '#ffeaa7';
        ctx.beginPath();
        ctx.arc(x + 9.5, y + 18, 1.8, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = '#e17055'; // duck beak
        ctx.fillRect(x + 10.8, y + 17.5, 1, 0.8);

        // Traditional Southern Black & White Checkered Khăn Rằn around neck
        ctx.fillStyle = '#f5f6fa';
        ctx.beginPath();
        ctx.roundRect(x + 3, y + 6, 13, 3.8, 2);
        ctx.fill();
        ctx.fillStyle = '#2f3640';
        ctx.fillRect(x + 4.5, y + 6, 1.5, 3.8);
        ctx.fillRect(x + 8.5, y + 6, 1.5, 3.8);
        ctx.fillRect(x + 12.5, y + 6, 1.5, 3.8);
        // Dangling knotted fringe tassel
        ctx.fillStyle = '#f5f6fa';
        ctx.fillRect(x + 2.5, y + 9, 2.5, 9);
        ctx.fillStyle = '#2f3640';
        ctx.fillRect(x + 2.5, y + 11, 2.5, 1.5);
        ctx.fillRect(x + 2.5, y + 14, 2.5, 1.5);

        // Head & Radiant Sun-kissed Smiling Face with Rosy Cheeks
        this.drawOrganicHead(ctx, x + 9.5, y - 2, 7.2, 8.2, '#ffe0bd', 'rgba(255, 107, 129, 0.4)', isBlinking, '#2c1e13', true);

        // Weathered Olive-Green Floppy Bucket Hat (Nón Tai Bèo) with lucky 4-leaf clover pin
        ctx.fillStyle = '#556b2f';
        ctx.beginPath();
        ctx.ellipse(x + 9.5, y - 7, 11.5, 3.8, 0, 0, Math.PI * 2);
        ctx.roundRect(x + 4, y - 13.5, 11, 7, [4, 4, 1, 1]);
        ctx.fill();
        // Emerald 4-leaf lucky clover badge
        ctx.fillStyle = '#2ecc71';
        ctx.beginPath();
        ctx.arc(x + 12.5, y - 10, 1.2, 0, Math.PI * 2);
        ctx.arc(x + 14, y - 10, 1.2, 0, Math.PI * 2);
        ctx.fill();

        // Clear Acrylic Display Board with Lucky Rainbow Lottery Tickets (Bảng Vé Số May Mắn)
        ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
        ctx.beginPath();
        ctx.roundRect(x + 16, y + 12, 8, 14, 1.5);
        ctx.fill();
        // Colorful tickets in rows (Red, Yellow, Blue)
        ctx.fillStyle = '#ff7675';
        ctx.fillRect(x + 17, y + 13.5, 6, 2.2);
        ctx.fillStyle = '#ffeaa7';
        ctx.fillRect(x + 17, y + 16.5, 6, 2.2);
        ctx.fillStyle = '#74b9ff';
        ctx.fillRect(x + 17, y + 19.5, 6, 2.2);
        // Red rubber band holding them firmly
        ctx.fillStyle = '#e74c3c';
        ctx.fillRect(x + 16, y + 18, 8, 1.2);

        // Adorable Golden Puppy (Chú Cún Vàng) sitting faithfully at her feet!
        const pupTail = Math.sin(this.tick * 0.3) * 2;
        ctx.fillStyle = '#f39c12';
        // Puppy body & head
        ctx.beginPath();
        ctx.ellipse(x - 6, y + 33, 4, 3, 0, 0, Math.PI * 2);
        ctx.arc(x - 7.5, y + 29, 2.8, 0, Math.PI * 2);
        ctx.fill();
        // Floppy puppy ears
        ctx.fillStyle = '#d35400';
        ctx.beginPath();
        ctx.ellipse(x - 9.5, y + 29, 1.2, 2.2, 0.2, 0, Math.PI * 2);
        ctx.fill();
        // Tiny dark nose & eye
        ctx.fillStyle = '#111';
        ctx.fillRect(x - 8.5, y + 28.5, 0.8, 0.8);
        // Wagging tail
        ctx.strokeStyle = '#f39c12';
        ctx.lineWidth = 1.2;
        ctx.beginPath();
        ctx.moveTo(x - 2.5, y + 33);
        ctx.lineTo(x - 0.5, y + 30 + pupTail);
        ctx.stroke();
        // Red cute collar with tiny golden bell
        ctx.fillStyle = '#e74c3c';
        ctx.fillRect(x - 8.5, y + 30.5, 2.5, 1);
        ctx.fillStyle = '#f1c40f';
        ctx.beginPath();
        ctx.arc(x - 7.2, y + 31.8, 0.8, 0, Math.PI * 2);
        ctx.fill();
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
      // Floating Pink Hearts drifting above head
      for (let h = 0; h < 3; h++) {
        const hOffset = Math.sin(this.tick * 0.15 + h * 2) * 4;
        const hY = y - 14 - h * 7 - ((this.tick * 0.6) % 12);
        const hX = x + 3 + h * 7 + hOffset;
        ctx.fillStyle = '#ff7675';
        ctx.beginPath();
        ctx.arc(hX - 1.5, hY, 1.8, Math.PI, 0);
        ctx.arc(hX + 1.5, hY, 1.8, Math.PI, 0);
        ctx.lineTo(hX, hY + 3.5);
        ctx.closePath();
        ctx.fill();
      }

      // Customer holds mini boba cup and sips with straw
      const cupX = x + 7;
      const cupY = y + 8;
      ctx.fillStyle = '#ffffff';
      ctx.beginPath();
      ctx.roundRect(cupX, cupY, 7, 10, 1.5);
      ctx.fill();
      ctx.fillStyle = '#f39c12'; // milk tea inside
      ctx.fillRect(cupX + 1, cupY + 3, 5, 6);
      ctx.fillStyle = '#111'; // boba pearls
      ctx.fillRect(cupX + 2, cupY + 7, 3, 2);
      // Straw leading up to mouth
      ctx.strokeStyle = '#e74c3c';
      ctx.lineWidth = 1.2;
      ctx.beginPath();
      ctx.moveTo(cupX + 3.5, cupY + 3);
      ctx.lineTo(x + 9.5, y + 2);
      ctx.stroke();
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
    const tx = t.x;
    const ty = 138;

    // 1. Street Ground Shadow
    ctx.fillStyle = 'rgba(0, 0, 0, 0.38)';
    ctx.beginPath();
    ctx.ellipse(tx + 8, ty + 24, 13, 4, 0, 0, Math.PI * 2);
    ctx.fill();

    // Motion parameters
    const isEscaping = t.state === 'escaping';
    const bob = isEscaping 
      ? Math.sin(t.tick * 0.45) * 3 
      : Math.sin(t.tick * 0.18) * 1.4;

    // 2. Black Cargo Pants & Tactical Sneakers
    ctx.fillStyle = '#1e1e24'; // Deep charcoal black pants
    const legSwing = isEscaping ? Math.sin(t.tick * 0.45) * 6 : Math.sin(t.tick * 0.18) * 3;
    
    // Left leg
    ctx.beginPath();
    ctx.roundRect(tx + 4 - legSwing, ty + 12 + bob, 3.5, 9, 1);
    ctx.fill();
    // Right leg
    ctx.beginPath();
    ctx.roundRect(tx + 9 + legSwing, ty + 12 + bob, 3.5, 9, 1);
    ctx.fill();

    // Black High-Top Sneakers with Clean White Rubber Sole
    ctx.fillStyle = '#0f0f14';
    ctx.fillRect(tx + 3 - legSwing, ty + 19 + bob, 5.5, 3.5);
    ctx.fillRect(tx + 8 + legSwing, ty + 19 + bob, 5.5, 3.5);
    ctx.fillStyle = '#ffffff'; // White soles
    ctx.fillRect(tx + 3 - legSwing, ty + 22 + bob, 5.5, 1);
    ctx.fillRect(tx + 8 + legSwing, ty + 22 + bob, 5.5, 1);

    // 3. Burlap Sack (Rustic thief loot bag slung over back)
    const bagX = isEscaping ? tx - 5 : (t.state === 'pacing_left' || t.state === 'approaching_pet' ? tx + 12 : tx - 4);
    const bagWiggle = isEscaping ? Math.sin(t.tick * 0.5) * 2 : 0;
    
    // Burlap Sack Body
    ctx.fillStyle = '#9c6634';
    ctx.beginPath();
    ctx.ellipse(bagX, ty + 7 + bob + bagWiggle, 7, 8.5, 0.2, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#6b411d';
    ctx.lineWidth = 1;
    ctx.stroke();

    // Sack rope tie
    ctx.fillStyle = '#f5cd79';
    ctx.fillRect(bagX - 1.5, ty - 1.5 + bob, 3, 2.5);

    // If pet has been snatched, draw cute pet ears or tail struggling inside sack!
    if (t.state === 'snatching' || (isEscaping && this.isPetStolen)) {
      ctx.fillStyle = '#e58e26'; // Little paw or tail peeking
      ctx.beginPath();
      ctx.arc(bagX - 2, ty + 2 + bob + bagWiggle, 2.2, 0, Math.PI * 2);
      ctx.fill();
    }

    // 4. Black Oversized Hoodie Body (Hunched sneak posture)
    ctx.fillStyle = '#121217'; // Pitch black hoodie
    ctx.beginPath();
    ctx.roundRect(tx + 2, ty + 2 + bob, 13, 12, 3);
    ctx.fill();

    // Hoodie pocket fold & shadows
    ctx.strokeStyle = '#272730';
    ctx.lineWidth = 0.8;
    ctx.beginPath();
    ctx.moveTo(tx + 4, ty + 10 + bob);
    ctx.lineTo(tx + 13, ty + 10 + bob);
    ctx.stroke();

    // 5. Oversized Black Hood & Head
    ctx.fillStyle = '#0a0a0e';
    ctx.beginPath();
    ctx.arc(tx + 8.5, ty - 2 + bob, 7.5, 0, Math.PI * 2);
    ctx.fill();

    // Deep Face Cavity Shadow
    ctx.fillStyle = '#040406';
    ctx.beginPath();
    ctx.ellipse(tx + 8.5, ty - 1 + bob, 5, 4.5, 0, 0, Math.PI * 2);
    ctx.fill();

    // 6. Shifty Suspicious Eyes (Glancing back and forth)
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.ellipse(tx + 6.5, ty - 2.5 + bob, 2, 1.4, 0, 0, Math.PI * 2);
    ctx.ellipse(tx + 10.5, ty - 2.5 + bob, 2, 1.4, 0, 0, Math.PI * 2);
    ctx.fill();

    // Moving Black Pupils looking around suspiciously
    const glanceOffset = isEscaping ? 1.2 : (t.state === 'pacing_left' || t.state === 'approaching_pet' ? -1.0 : (t.state === 'pacing_right' ? 1.0 : Math.sin(t.tick * 0.1) * 1.0));
    ctx.fillStyle = '#000000';
    ctx.beginPath();
    ctx.arc(tx + 6.5 + glanceOffset, ty - 2.5 + bob, 0.9, 0, Math.PI * 2);
    ctx.arc(tx + 10.5 + glanceOffset, ty - 2.5 + bob, 0.9, 0, Math.PI * 2);
    ctx.fill();

    // 7. Black Face Mask / Surgical Mask (User Prompt requirement: "đeo khẩu trang")
    ctx.fillStyle = '#18181f';
    ctx.beginPath();
    ctx.roundRect(tx + 5, ty - 1.2 + bob, 7, 4.2, 1.5);
    ctx.fill();
    // Mask pleat & ear loop lines
    ctx.strokeStyle = '#2f3542';
    ctx.lineWidth = 0.6;
    ctx.stroke();

    // 8. Sweat Drops & Speed Lines if Escaping
    if (isEscaping) {
      ctx.fillStyle = '#00d2d3';
      ctx.beginPath();
      ctx.arc(tx - 6, ty - 4 + bob, 1.2, 0, Math.PI * 2);
      ctx.arc(tx - 11, ty + 2 + bob, 1.4, 0, Math.PI * 2);
      ctx.fill();
    }

    // 9. Speech / Thought Bubble
    if (t.bubble) {
      const bubbleW = t.bubble.length * 5.2 + 10;
      const bx = tx - 4;
      const by = ty - 20 + bob;

      // Bubble background with drop shadow
      ctx.fillStyle = 'rgba(0, 0, 0, 0.3)';
      ctx.beginPath();
      ctx.roundRect(bx + 1, by + 1, bubbleW, 11, 3);
      ctx.fill();

      ctx.fillStyle = isEscaping ? '#ff4757' : '#ffffff';
      ctx.beginPath();
      ctx.roundRect(bx, by, bubbleW, 11, 3);
      ctx.fill();

      // Tail pointing to thief's hood
      ctx.beginPath();
      ctx.moveTo(bx + 10, by + 11);
      ctx.lineTo(bx + 8, by + 15);
      ctx.lineTo(bx + 14, by + 11);
      ctx.fill();

      // Bubble text
      ctx.fillStyle = isEscaping ? '#ffffff' : '#2f3542';
      ctx.font = 'bold 7px sans-serif';
      ctx.fillText(t.bubble, bx + 5, by + 8);
    }
  }
}

window.GameCanvas = GameCanvas;
