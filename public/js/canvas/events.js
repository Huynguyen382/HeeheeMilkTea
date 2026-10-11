// Pets, Thief, Invisibility Amulet, Police Patrol & Shipper for GameCanvas

export const eventMethods = {
  setActivePet(petId, isStolen = false) {
    this.activePet = petId;
    this.isPetStolen = !!isStolen;
  },

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
  },

  shooThief() {
    if (!this.thief || this.thief.state === 'escaping') return false;

    // Launch Honeycomb Slipper Projectile from Barista!
    this.slipper = {
      startX: 55,
      startY: 110,
      targetX: this.thief.x + 8,
      targetY: 138,
      x: 55,
      y: 110,
      progress: 0,
      rot: 0
    };

    this.thief.state = 'escaping';
    this.thief.runSpeed = 5.0;
    this.thief.bubble = '😱 DÉP TỔ ONG BAY TỚI!';

    // Vigilance reward text
    this.floatingTexts.push({
      text: '+10.000đ BẮT TRỘM! ⭐',
      x: Math.min(240, Math.max(20, this.thief.x - 20)),
      y: 100,
      alpha: 1.0,
      color: '#ffd700'
    });

    if (this.onThiefCaught) {
      this.onThiefCaught();
    }
    return true;
  },

  checkThiefClick(clickX, clickY) {
    if (!this.thief || this.thief.state === 'escaping') return false;
    const tx = this.thief.x;
    const ty = 138;
    // Hitbox covering the crouching thief sprite
    if (clickX >= tx - 15 && clickX <= tx + 35 && clickY >= ty - 15 && clickY <= ty + 45) {
      return this.shooThief();
    }
    return false;
  },

  checkAmuletClick(clickX, clickY) {
    // Hitbox covering amulet hanging at right stall corner (x: 150 - 188, y: 60 - 118)
    if (clickX >= 150 && clickX <= 188 && clickY >= 60 && clickY <= 118) {
      if (this.talismanCount <= 0 && !this.isInvisible) {
        this.floatingTexts.push({
          text: '❌ HẾT BÙA! MUA THÊM (0/3)',
          x: 55,
          y: 75,
          alpha: 1.0,
          color: '#ff5555'
        });
        return { isAmulet: true, empty: true };
      }

      const nightStatus = this.getNightPatrolStatus();
      if (nightStatus.isAmuletInvalid) {
        this.floatingTexts.push({
          text: '💀 BÙA ĐÃ VÔ HIỆU SAU 1H SÁNG!',
          x: 70,
          y: 75,
          alpha: 1.0,
          color: '#ff5555'
        });
        return { isAmulet: true, invalidAfter1AM: true };
      }

      const now = Date.now();
      if (now - this.lastAmuletClickTime < 500) {
        // Double-click detected
        if (this.isInvisible) {
          // Deactivate early
          this.isInvisible = false;
          this.invisibilityRemaining = 0;
          this.lastAmuletClickTime = 0;
          this.floatingTexts.push({
            text: '👁️ ĐÃ THOÁT TÀNG HÌNH!',
            x: 60,
            y: 80,
            alpha: 1.0,
            color: '#ffeaa7'
          });
          return { isAmulet: true, isInvisible: false };
        }

        if (this.talismanCount <= 0) {
          this.floatingTexts.push({
            text: '❌ HẾT BÙA! MUA THÊM (0/3)',
            x: 55,
            y: 75,
            alpha: 1.0,
            color: '#ff5555'
          });
          return { isAmulet: true, empty: true };
        }

        // Consume 1 talisman!
        this.talismanCount = Math.max(0, this.talismanCount - 1);
        this.hasAmulet = this.talismanCount > 0;
        this.isInvisible = true;
        this.invisibilityRemaining = 60 * 60; // 60s max
        this.lastAmuletClickTime = 0;

        this.floatingTexts.push({
          text: `🔮 KÍCH HOẠT ẨN THÂN (Còn ${this.talismanCount}/3)! ⭐`,
          x: 35,
          y: 80,
          alpha: 1.0,
          color: '#00cec9'
        });

        for (let i = 0; i < 25; i++) {
          this.particles.push({
            x: 100 + (Math.random() * 70 - 35),
            y: 110 + (Math.random() * 40 - 20),
            vx: (Math.random() - 0.5) * 3,
            vy: -Math.random() * 2.5 - 0.5,
            life: 40,
            maxLife: 40,
            color: ['#00cec9', '#81ecec', '#fdcb6e', '#ffffff'][Math.floor(Math.random() * 4)],
            size: 2
          });
        }

        return { isAmulet: true, isInvisible: true, consumed: true, remaining: this.talismanCount };
      } else {
        this.lastAmuletClickTime = now;
        this.floatingTexts.push({
          text: `✨ Nhấp đúp để dùng Bùa (${this.talismanCount}/3) ✨`,
          x: 40,
          y: 80,
          alpha: 0.9,
          color: '#fdcb6e'
        });
        return { isAmulet: true, doubleClickPrompt: true, remaining: this.talismanCount };
      }
    }
    return false;
  },

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
        ctx.fillStyle = 'rgba(24, 13, 24, 0.92)';
        ctx.beginPath();
        ctx.roundRect(px + 18, py - 12 + bob, 20, 10, 3);
        ctx.fill();
        ctx.strokeStyle = '#f39c12';
        ctx.lineWidth = 1;
        ctx.stroke();
        ctx.fillStyle = '#ffffff';
        ctx.font = 'bold 7px monospace';
        ctx.fillText('Gâu!🐾', px + 19.5, py - 5 + bob);
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
        ctx.fillStyle = 'rgba(24, 13, 24, 0.92)';
        ctx.beginPath();
        ctx.roundRect(px + 18, py - 12 + bob, 24, 10, 3);
        ctx.fill();
        ctx.strokeStyle = '#fd79a8';
        ctx.lineWidth = 1;
        ctx.stroke();
        ctx.fillStyle = '#ffffff';
        ctx.font = 'bold 7px monospace';
        ctx.fillText('Meow~✨', px + 19, py - 5 + bob);
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
        ctx.fillStyle = 'rgba(24, 13, 24, 0.92)';
        ctx.beginPath();
        ctx.roundRect(px + 18, py - 14 + bob, 24, 10, 3);
        ctx.fill();
        ctx.strokeStyle = '#ff9f1a';
        ctx.lineWidth = 1;
        ctx.stroke();
        ctx.fillStyle = '#ffffff';
        ctx.font = 'bold 7px monospace';
        ctx.fillText('Chill...🍊', px + 19, py - 6.5 + bob);
      }
    }
  },

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
    this.drawPixel(ctx, tx - 3, ty + 24, 22, 3, 'rgba(0, 0, 0, 0.4)');
    this.drawPixel(ctx, tx - 1, ty + 23, 18, 4, 'rgba(0, 0, 0, 0.25)');

    // 2. Black Cargo Pants & Tactical Combat Sneakers
    const legSwing = isEscaping ? Math.round(Math.sin(t.tick * 0.45) * 4) : Math.round(Math.sin(t.tick * 0.18) * 2);

    // Left & Right legs with knee crease
    this.drawPixel(ctx, tx + 4 - legSwing, ty + 12 + bob, 4, 8, '#1e1e24');
    this.drawPixel(ctx, tx + 5 - legSwing, ty + 14 + bob, 2, 2, '#2b2b36'); // Knee patch
    this.drawPixel(ctx, tx + 9 + legSwing, ty + 12 + bob, 4, 8, '#1e1e24');
    this.drawPixel(ctx, tx + 10 + legSwing, ty + 14 + bob, 2, 2, '#2b2b36');

    // Black High-Top Tactical Sneakers with White Tread Soles & Red Accents
    this.drawPixel(ctx, tx + 3 - legSwing, ty + 19 + bob, 6, 3, '#0f0f14');
    this.drawPixel(ctx, tx + 4 - legSwing, ty + 18 + bob, 2, 1, '#ff4757'); // Red pull tab
    this.drawPixel(ctx, tx + 3 - legSwing, ty + 22 + bob, 6, 1, '#ffffff'); // Rubber sole
    this.drawPixel(ctx, tx + 8 + legSwing, ty + 19 + bob, 6, 3, '#0f0f14');
    this.drawPixel(ctx, tx + 9 + legSwing, ty + 18 + bob, 2, 1, '#ff4757');
    this.drawPixel(ctx, tx + 8 + legSwing, ty + 22 + bob, 6, 1, '#ffffff');

    // 3. Burlap Sack (Rustic thief loot bag slung over back with cross-hatching)
    const bagX = isEscaping ? tx - 6 : (t.state === 'pacing_left' || t.state === 'approaching_pet' ? tx + 13 : tx - 5);
    const bagWiggle = isEscaping ? Math.round(Math.sin(t.tick * 0.5)) : 0;

    // Burlap Sack Body & Coarse Weave Texture
    this.drawPixel(ctx, bagX, ty + 6 + bob + bagWiggle, 8, 10, '#6b411d');
    this.drawPixel(ctx, bagX + 1, ty + 7 + bob + bagWiggle, 6, 8, '#9c6634');
    this.drawPixel(ctx, bagX + 2, ty + 8 + bob + bagWiggle, 1, 1, '#523114'); // Burlap stitch
    this.drawPixel(ctx, bagX + 4, ty + 10 + bob + bagWiggle, 1, 1, '#523114');
    this.drawPixel(ctx, bagX + 2, ty + 12 + bob + bagWiggle, 1, 1, '#523114');
    this.drawPixel(ctx, bagX + 5, ty + 13 + bob + bagWiggle, 1, 1, '#523114');
    // Hemp Rope Tie & Knot
    this.drawPixel(ctx, bagX + 2, ty + 4 + bob + bagWiggle, 4, 3, '#f5cd79');
    this.drawPixel(ctx, bagX + 3, ty + 3 + bob + bagWiggle, 2, 2, '#d4a046');

    // If pet has been snatched, draw cute pet ears or tail struggling inside sack!
    if (t.state === 'snatching' || (isEscaping && this.isPetStolen)) {
      this.drawPixel(ctx, bagX - 1, ty + 2 + bob + bagWiggle, 3, 3, '#e58e26');
      this.drawPixel(ctx, bagX, ty + 1 + bob + bagWiggle, 1, 1, '#ff6b81'); // Pink inner ear
    }

    // 4. Black Oversized Hoodie Body (Hunched sneak posture)
    this.drawPixel(ctx, tx + 2, ty + 2 + bob, 13, 11, '#0a0a0e');
    this.drawPixel(ctx, tx + 3, ty + 3 + bob, 11, 9, '#18181f');
    this.drawPixel(ctx, tx + 4, ty + 10 + bob, 9, 1, '#272730'); // Pocket fold
    this.drawPixel(ctx, tx + 6, ty + 4 + bob, 1, 5, '#ffffff'); // Left drawstring
    this.drawPixel(ctx, tx + 9, ty + 4 + bob, 1, 5, '#ffffff'); // Right drawstring

    // 5. Oversized Black Hood & Deep Face Cavity Shadow
    this.drawPixel(ctx, tx + 3, ty - 6 + bob, 12, 9, '#0a0a0e');
    this.drawPixel(ctx, tx + 4, ty - 5 + bob, 10, 7, '#121217');
    this.drawPixel(ctx, tx + 5, ty - 4 + bob, 8, 5, '#040406'); // Deep face cavity shadow

    // 6. Shifty Suspicious Anime Eyes (Glancing back and forth with glint)
    this.drawPixel(ctx, tx + 6, ty - 3 + bob, 2, 2, '#ffffff');
    this.drawPixel(ctx, tx + 10, ty - 3 + bob, 2, 2, '#ffffff');

    const glanceOffset = isEscaping ? 1 : (t.state === 'pacing_left' || t.state === 'approaching_pet' ? -1 : (t.state === 'pacing_right' ? 1 : (Math.sin(t.tick * 0.1) > 0 ? 1 : 0)));
    this.drawPixel(ctx, tx + 6 + glanceOffset, ty - 3 + bob, 1, 2, '#000000');
    this.drawPixel(ctx, tx + 10 + glanceOffset, ty - 3 + bob, 1, 2, '#000000');
    // Suspicious furrowed brow
    this.drawPixel(ctx, tx + 5, ty - 4 + bob, 3, 1, '#1e1e24');
    this.drawPixel(ctx, tx + 10, ty - 4 + bob, 3, 1, '#1e1e24');

    // 7. Black Pleated Face Mask / Surgical Mask
    this.drawPixel(ctx, tx + 5, ty - 1 + bob, 8, 4, '#18181f');
    this.drawPixel(ctx, tx + 6, ty + bob, 6, 1, '#2f3542'); // Pleat seam

    // 8. Sweat Drops & Speed Lines if Escaping
    if (isEscaping) {
      this.drawPixel(ctx, tx - 5, ty - 4 + bob, 2, 2, '#00d2d3');
      this.drawPixel(ctx, tx - 9, ty + 2 + bob, 2, 2, '#00d2d3');
      // Anime escape speed lines
      this.drawPixel(ctx, tx - 12, ty + 8 + bob, 6, 1, '#ffffff');
      this.drawPixel(ctx, tx - 16, ty + 14 + bob, 8, 1, '#ffffff');
      this.drawPixel(ctx, tx - 10, ty + 18 + bob, 5, 1, '#ffffff');
    }

    // 9. Speech / Thought Bubble
    if (t.bubble) {
      const bubbleW = t.bubble.length * 6 + 10;
      const bx = tx - 4;
      const by = ty - 20 + bob;

      this.drawPixel(ctx, bx + 1, by + 1, bubbleW, 11, 'rgba(0, 0, 0, 0.5)');
      this.drawPixel(ctx, bx, by, bubbleW, 11, isEscaping ? '#c0392b' : 'rgba(22, 12, 24, 0.95)');
      this.drawPixel(ctx, bx, by, bubbleW, 1, isEscaping ? '#ff7675' : '#f4c430');
      this.drawPixel(ctx, bx + 8, by + 11, 4, 3, isEscaping ? '#c0392b' : 'rgba(22, 12, 24, 0.95)');

      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 7px monospace';
      ctx.fillText(t.bubble, bx + 5, by + 8);
    }
  },

  drawInvisibilityAmulet(ctx) {
    // Hanging beside stall counter at right awning post (x=168, y=84)
    const ax = 168;
    const floatY = Math.sin(this.tick * 0.08) * 2;
    const ay = 84 + floatY;
    const nightStatus = this.getNightPatrolStatus();
    const isInvalid = nightStatus.isAmuletInvalid;

    // If no talismans and not invisible, draw empty cord slot
    if (this.talismanCount <= 0 && !this.isInvisible) {
      // Crimson silk cord
      ctx.strokeStyle = '#57606f';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(ax + 5, 68);
      ctx.lineTo(ax + 5, ay);
      ctx.stroke();

      // Empty ghost talisman outline
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.25)';
      ctx.lineWidth = 1;
      ctx.strokeRect(ax, ay, 11, 20);

      ctx.fillStyle = '#a4b0be';
      ctx.font = 'bold 5.5px monospace';
      ctx.fillText('0/3', ax + 1, ay - 3);
      return;
    }

    // Hanging crimson silk cord from awning beam (y=68)
    ctx.strokeStyle = isInvalid ? '#535c68' : '#c0392b';
    ctx.lineWidth = 1.2;
    ctx.beginPath();
    ctx.moveTo(ax + 5, 68);
    ctx.lineTo(ax + 5, ay);
    ctx.stroke();

    if (isInvalid) {
      // Burnt & Exhausted Talisman Paper (Bùa mất linh nghiệm sau 1h sáng)
      ctx.fillStyle = '#2f3542';
      ctx.fillRect(ax, ay, 11, 20);
      ctx.strokeStyle = '#1e272e';
      ctx.lineWidth = 1;
      ctx.strokeRect(ax, ay, 11, 20);

      // Ashy faded runes
      ctx.fillStyle = '#57606f';
      ctx.fillRect(ax + 4, ay + 3, 3, 2);
      ctx.fillRect(ax + 2, ay + 6, 7, 1.5);
      ctx.fillRect(ax + 4, ay + 9, 3, 5);
      ctx.fillRect(ax + 2, ay + 15, 7, 1.5);

      // Burnt embers / cracks
      ctx.fillStyle = '#eb2f06';
      ctx.fillRect(ax + 2, ay + 17, 2, 2);
      ctx.fillRect(ax + 7, ay + 18, 2, 1.5);

      // Invalid Badge "💀 1H"
      ctx.fillStyle = '#ff4757';
      ctx.font = 'bold 6.5px monospace';
      ctx.fillText('💀 1H', ax - 2, ay - 3);
    } else {
      // Sacred Yellow Talisman Paper (Bùa vàng đạo gia linh nghiệm)
      ctx.fillStyle = '#f1c40f';
      ctx.fillRect(ax, ay, 11, 20);
      ctx.strokeStyle = '#d35400';
      ctx.lineWidth = 1;
      ctx.strokeRect(ax, ay, 11, 20);

      // Red sacred cinnabar runes (Chữ bùa chu sa đỏ linh nghiệm)
      ctx.fillStyle = '#c0392b';
      ctx.fillRect(ax + 4, ay + 2, 3, 2);
      ctx.fillRect(ax + 2, ay + 5, 7, 1.5);
      ctx.fillRect(ax + 4, ay + 7, 3, 5);
      ctx.fillRect(ax + 2, ay + 11, 7, 1.5);
      ctx.fillRect(ax + 3, ay + 14, 5, 2);
      ctx.fillRect(ax + 4, ay + 17, 3, 2);

      // Glowing mystic aura ring
      const auraPulse = (Math.sin(this.tick * 0.1) + 1) * 0.5;
      ctx.strokeStyle = this.isInvisible ? 'rgba(0, 206, 201, 0.85)' : 'rgba(241, 196, 15, 0.7)';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.arc(ax + 5.5, ay + 10, 13 + auraPulse * 3, 0, Math.PI * 2);
      ctx.stroke();

      // Top Tag Badge
      if (this.isInvisible && this.invisibilityRemaining > 0) {
        const secLeft = Math.ceil(this.invisibilityRemaining / 60);
        ctx.fillStyle = '#00cec9';
        ctx.font = 'bold 7px monospace';
        ctx.fillText(secLeft + 's 🔮', ax - 3, ay - 3);
      } else {
        ctx.fillStyle = '#f6b93b';
        ctx.font = 'bold 6px monospace';
        ctx.fillText(`✨ ${this.talismanCount}/3`, ax - 3, ay - 3);
      }
    }
  },

  drawInvisibilityAura(ctx) {
    // Shimmering cyan mystic particle fog around cloaked stall
    ctx.save();
    const auraGlow = (Math.sin(this.tick * 0.12) + 1) * 0.5;
    ctx.strokeStyle = 'rgba(0, 206, 201, 0.45)';
    ctx.lineWidth = 2;
    ctx.strokeRect(10, 100, 105, 75);

    // Mystic floating runes / glints
    ctx.fillStyle = 'rgba(129, 236, 236, 0.8)';
    for (let i = 0; i < 4; i++) {
      const rx = 20 + ((this.tick * 1.5 + i * 28) % 90);
      const ry = 110 + Math.sin(this.tick * 0.08 + i) * 25;
      ctx.fillRect(rx, ry, 2, 2);
    }
    ctx.restore();
  },

  drawSlipper(ctx) {
    if (!this.slipper) return;
    const sl = this.slipper;

    ctx.save();
    ctx.translate(sl.x, sl.y);
    ctx.rotate(sl.rot);

    // Motion blur speed lines behind slipper
    ctx.strokeStyle = 'rgba(255, 234, 167, 0.5)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(-12, 0);
    ctx.lineTo(-4, 0);
    ctx.stroke();

    // Honeycomb slipper body (Dép tổ ong huyền thoại màu trắng ngà)
    ctx.fillStyle = '#f7f1e3'; // Ivory rubber
    ctx.fillRect(-6, -3, 13, 6);
    // Blue rubber sole trim
    ctx.fillStyle = '#3867d6';
    ctx.fillRect(-6, 2, 13, 1.5);
    // Honeycomb perforations on the strap (Lỗ tổ ong)
    ctx.fillStyle = '#706fd3';
    ctx.fillRect(-2, -2, 1.5, 1.5);
    ctx.fillRect(1, -2, 1.5, 1.5);
    ctx.fillRect(4, -2, 1.5, 1.5);
    ctx.fillRect(-1, 0, 1.5, 1.5);
    ctx.fillRect(2, 0, 1.5, 1.5);

    ctx.restore();
  },

  drawPolicePatrol(ctx) {
    const p = this.policePatrol;
    if (p.state === 'idle' || p.state === 'warning') return;

    const px = p.x;
    const py = 126;
    const walkBob = Math.sin(this.tick * 0.25) * 2;

    // Shadow
    ctx.fillStyle = 'rgba(0, 0, 0, 0.3)';
    ctx.beginPath();
    ctx.ellipse(px + 6, py + 30, 8, 3, 0, 0, Math.PI * 2);
    ctx.fill();

    // Legs & Polished Boots
    ctx.fillStyle = '#1e272e'; // Dark trousers
    ctx.fillRect(px + 2, py + 18, 3, 10);
    ctx.fillRect(px + 7, py + 18, 3, 10);
    ctx.fillStyle = '#000000'; // Shiny boots
    ctx.fillRect(px + 1, py + 26, 4, 3);
    ctx.fillRect(px + 7, py + 26, 4, 3);

    // Vietnamese Police Uniform Shirt (Green / Navy #1e3799)
    ctx.fillStyle = '#1e3799';
    ctx.fillRect(px + 1, py + 8 + walkBob, 10, 11);
    // Gold epaulets (cầu vai vàng)
    ctx.fillStyle = '#f1c40f';
    ctx.fillRect(px, py + 8 + walkBob, 2, 2);
    ctx.fillRect(px + 10, py + 8 + walkBob, 2, 2);
    // Tie & badge
    ctx.fillStyle = '#e74c3c';
    ctx.fillRect(px + 5, py + 10 + walkBob, 2, 5);
    ctx.fillStyle = '#f1c40f';
    ctx.fillRect(px + 2, py + 11 + walkBob, 2, 2);

    // Head & Police Visor Cap (Mũ kepi)
    ctx.fillStyle = '#ffeaa7'; // Face
    ctx.fillRect(px + 3, py + 1 + walkBob, 6, 7);
    ctx.fillStyle = '#1e3799'; // Cap top
    ctx.fillRect(px + 1, py - 3 + walkBob, 10, 5);
    ctx.fillStyle = '#000000'; // Black visor
    ctx.fillRect(px - 1, py + 1 + walkBob, 4, 1.5);
    ctx.fillStyle = '#f1c40f'; // Gold badge on cap
    ctx.fillRect(px + 4, py - 1 + walkBob, 2, 2);

    // Clipboard / Ticket pad in hand
    ctx.fillStyle = '#d35400';
    ctx.fillRect(px - 2, py + 12 + walkBob, 4, 6);
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(px - 1, py + 13 + walkBob, 2, 4);

    // Speech bubble
    if (p.bubble) {
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(px - 25, py - 20, 68, 14);
      ctx.strokeStyle = '#2f3542';
      ctx.lineWidth = 1;
      ctx.strokeRect(px - 25, py - 20, 68, 14);
      ctx.fillStyle = '#2f3542';
      ctx.font = 'bold 7px sans-serif';
      ctx.fillText(p.bubble, px - 22, py - 10);
    }
  },

  drawMotorbikeShipper(ctx) {
    const ms = this.motorbikeShipper;
    if (!ms || !ms.active) return;

    const mx = Math.round(ms.x);
    const my = 136; // Align wheels with sidewalk / street curb (y = 148)
    const isRiding = (ms.state === 'approaching' || ms.state === 'departing');
    const engineVib = isRiding ? Math.round(Math.sin(this.tick * 0.8) * 0.6) : 0;

    ctx.save();

    // 1. Ground Shadow under Motorbike
    ctx.fillStyle = 'rgba(10, 5, 12, 0.42)';
    ctx.beginPath();
    ctx.ellipse(mx + 12, my + 12, 20, 4, 0, 0, Math.PI * 2);
    ctx.fill();

    // 2. Spoke Wheels with Chrome Hubs (Matching cart.js Dream/Wave)
    const drawBikeWheel = (wx) => {
      ctx.fillStyle = '#0F172A';
      ctx.beginPath();
      ctx.arc(wx, my + 7, 5.5, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#334155';
      ctx.beginPath();
      ctx.arc(wx, my + 7, 4.2, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = '#E2E8F0';
      ctx.lineWidth = 0.8;
      ctx.beginPath();
      const rot = isRiding ? (this.tick * 0.4) : 0;
      ctx.moveTo(wx - Math.cos(rot) * 3.5, my + 7 - Math.sin(rot) * 3.5);
      ctx.lineTo(wx + Math.cos(rot) * 3.5, my + 7 + Math.sin(rot) * 3.5);
      ctx.moveTo(wx - Math.cos(rot + 1.57) * 3.5, my + 7 - Math.sin(rot + 1.57) * 3.5);
      ctx.lineTo(wx + Math.cos(rot + 1.57) * 3.5, my + 7 + Math.sin(rot + 1.57) * 3.5);
      ctx.stroke();
      ctx.fillStyle = '#E2E8F0';
      ctx.fillRect(wx - 1, my + 6, 2, 2);
    };
    // Facing left toward the stall counter: front wheel at mx + 1, rear wheel at mx + 20
    drawBikeWheel(mx + 1);
    drawBikeWheel(mx + 20);

    // 3. Chrome Exhaust Pipe & Animated Smoke Puffs
    ctx.fillStyle = '#E2E8F0';
    ctx.fillRect(mx + 6, my + 7 + engineVib, 15, 2);
    ctx.fillStyle = '#94A3B8';
    ctx.fillRect(mx + 19, my + 6 + engineVib, 3, 3);
    const smokePuff = (Math.floor(this.tick / 10) % 3);
    ctx.fillStyle = 'rgba(226, 232, 240, 0.72)';
    if (smokePuff === 0) ctx.fillRect(mx + 23, my + 5, 2, 2);
    else if (smokePuff === 1) ctx.fillRect(mx + 25, my + 4, 2.5, 2.5);
    else ctx.fillRect(mx + 27, my + 3, 3, 2);

    // 4. Engine Block & Kickstand
    ctx.fillStyle = '#64748B';
    ctx.fillRect(mx + 6, my + 3 + engineVib, 8, 5);
    ctx.fillStyle = '#CBD5E1';
    ctx.fillRect(mx + 7, my + 4 + engineVib, 5, 3);
    if (!isRiding) {
      ctx.strokeStyle = '#94A3B8';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(mx + 10, my + 8);
      ctx.lineTo(mx + 8, my + 12);
      ctx.stroke();
    }

    // 5. Wave Chiến / Dream Chiến Body & White Fairing (Yếm trắng + Thân Xanh Lá/Cam Giao Hàng)
    ctx.fillStyle = '#FFFFFF';
    ctx.fillRect(mx + 4, my + engineVib, 4, 8);
    ctx.fillStyle = '#E2E8F0';
    ctx.fillRect(mx + 5, my + 2 + engineVib, 2, 5);

    ctx.fillStyle = '#16A34A'; // Shipper green fairing
    ctx.fillRect(mx + 7, my + engineVib, 13, 4);
    ctx.fillStyle = '#EA580C'; // Orange speed decal
    ctx.fillRect(mx + 8, my + 1 + engineVib, 9, 1);
    ctx.fillStyle = '#FACC15'; // Gold lightning stripe
    ctx.fillRect(mx + 9, my + 2 + engineVib, 7, 1);

    // Black Leather Seat & Handlebars
    ctx.fillStyle = '#1E293B';
    ctx.fillRect(mx + 8, my - 2 + engineVib, 10, 3);
    ctx.fillStyle = '#334155';
    ctx.fillRect(mx + 3, my - 5 + engineVib, 3, 6); // Steering column
    ctx.fillStyle = '#FEF08A'; // Bright LED Headlight facing left
    ctx.fillRect(mx + 1, my - 5 + engineVib, 2, 3);
    ctx.fillStyle = 'rgba(254, 240, 138, 0.28)';
    ctx.beginPath();
    ctx.moveTo(mx + 1, my - 4 + engineVib);
    ctx.lineTo(mx - 14, my - 9 + engineVib);
    ctx.lineTo(mx - 14, my + 2 + engineVib);
    ctx.closePath();
    ctx.fill();

    // 6. Insulated Rear Delivery Cargo Box (Thùng Giữ Nhiệt Cam Phản Quang)
    const boxX = mx + 17;
    const boxY = my - 12 + engineVib;
    ctx.fillStyle = '#EA580C';
    ctx.fillRect(boxX, boxY, 12, 11);
    ctx.fillStyle = '#F97316';
    ctx.fillRect(boxX + 1, boxY + 1, 10, 9);
    ctx.fillStyle = '#F1F5F9'; // Reflective silver band
    ctx.fillRect(boxX, boxY + 4, 12, 2);
    ctx.fillStyle = '#0F172A';
    ctx.fillRect(boxX + 2, boxY + 1, 8, 3);
    ctx.fillStyle = '#FDE047';
    ctx.font = 'bold 5.5px monospace';
    if (ms.servedCount && ms.servedCount > 0) {
      ctx.fillText(`${ms.servedCount}LY`, boxX + 2.5, boxY + 9);
    } else {
      ctx.fillText('BOBA', boxX + 2, boxY + 9);
    }

    // 7. ANH LÂM SHIPPER CHARACTER MODEL (Synchronized with characters.js style: 'anhlam_shipper')
    const pR = (x, y, w, h, col) => {
      ctx.fillStyle = col;
      ctx.fillRect(Math.round(x), Math.round(y), Math.max(1, Math.round(w)), Math.max(1, Math.round(h)));
    };
    const pD = (x, y, col) => {
      ctx.fillStyle = col;
      ctx.fillRect(Math.round(x), Math.round(y), 1, 1);
    };
    const isBlinking = (this.tick % 85) < 4;

    if (isRiding) {
      // Anh Lâm ngồi lái xe Wave Chiến (Tỷ lệ chuẩn ModelNPC anhlam_shipper)
      const rX = mx + 3;
      const rY = my - 30 + engineVib;
      const skin = '#FCD7B0';

      // Mũ bảo hiểm nửa đầu đỏ sọc trắng & Kính phi công xanh phản quang
      pR(rX + 4, rY + 1, 12, 5, '#B91C1C');
      pR(rX + 5, rY, 10, 2, '#DC2626');
      pR(rX + 9, rY + 1, 2, 5, '#FFFFFF');
      pR(rX + 4, rY + 3, 12, 3, '#0F172A');
      pR(rX + 5, rY + 4, 4, 2, '#38BDF8'); pD(rX + 6, rY + 4, '#FFFFFF');
      pR(rX + 11, rY + 4, 4, 2, '#38BDF8'); pD(rX + 12, rY + 4, '#FFFFFF');

      // Khuôn mặt nam tính
      pR(rX + 5, rY + 6, 10, 7, skin);
      pR(rX + 6, rY + 12, 8, 1, '#E5B88A');
      if (!isBlinking) {
        pR(rX + 6, rY + 8, 2, 2, '#0F172A'); pD(rX + 6, rY + 8, '#FFFFFF');
        pR(rX + 11, rY + 8, 2, 2, '#0F172A'); pD(rX + 11, rY + 8, '#FFFFFF');
      } else {
        pR(rX + 6, rY + 8, 2, 1, '#0F172A');
        pR(rX + 11, rY + 8, 2, 1, '#0F172A');
      }
      pR(rX + 8, rY + 11, 3, 1, '#B91C1C');

      // Áo Bomber Shipper Xanh Lá Phản Quang + Dải Cam + Túi Bao Tử
      pR(rX + 5, rY + 13, 11, 12, '#16A34A');
      pR(rX + 5, rY + 18, 11, 2, '#F1F5F9');
      pR(rX + 5, rY + 20, 11, 1, '#EA580C');
      pR(rX + 6, rY + 16, 7, 3, '#0F172A');
      pR(rX + 8, rY + 17, 3, 1, '#FACC15');

      // Tay cầm ghi-đông xe máy
      pR(rX + 1, rY + 15, 5, 3, '#16A34A');
      pR(rX, rY + 17, 3, 3, skin);

      // Chân gác lên để chân xe máy & Giày Sneaker Đỏ Đế Trắng
      pR(rX + 6, rY + 24, 5, 7, '#1E293B');
      pR(rX + 4, rY + 29, 5, 3, '#DC2626');
      pR(rX + 4, rY + 31, 5, 1, '#FFFFFF');
    } else {
      // Anh Lâm bước xuống xe đi bộ tới quầy (Sử dụng trực tiếp drawNPCCharacter của characters.js!)
      const wx = Math.round(ms.walkX);
      const isWalking = (ms.state === 'walking_to_counter' || ms.state === 'carrying_drink' || ms.state === 'departing_empty');
      const walkBob = isWalking ? Math.round(Math.sin(this.tick * 0.4) * 2) : Math.round(Math.sin(this.tick * 0.16) * 1);
      const sway = isWalking
        ? (Math.sin(this.tick * 0.4) > 0 ? 1 : 0)
        : (Math.sin(this.tick * 0.18) > 0 ? 1 : 0);

      const shipperChar = (typeof getCharacter === 'function')
        ? getCharacter('Anh Lâm Shipper')
        : (window.getCharacter ? window.getCharacter('Anh Lâm Shipper') : null);
      const fnDrawNPC = (typeof drawNPCCharacter === 'function')
        ? drawNPCCharacter
        : (window.drawNPCCharacter || null);

      const height = 56;
      const baseX = wx - 8;
      const baseY = Math.round(148 - height + walkBob);

      // Bóng đổ dưới chân đồng bộ với khách hàng trên vỉa hè (y = 148)
      ctx.fillStyle = 'rgba(20, 10, 5, 0.25)';
      ctx.beginPath();
      ctx.ellipse(baseX + 11, 148, 10, 3, 0, 0, Math.PI * 2);
      ctx.fill();

      if (shipperChar && typeof fnDrawNPC === 'function') {
        fnDrawNPC(ctx, shipperChar, baseX, baseY, sway, true, !!ms.hasDrink, isBlinking);
      }

      // Khi đã nhận trà sữa từ quầy (ms.hasDrink), vẽ thêm ly trà sữa dập nắp trên tay Anh Lâm
      if (ms.hasDrink) {
        const cupX = baseX - 2;
        const cupY = baseY + 18;
        pR(cupX, cupY, 5, 7, '#FFFBEB');
        pR(cupX + 1, cupY + 2, 3, 4, '#D97706');
        pD(cupX + 2, cupY + 5, '#18181B');
        pR(cupX - 1, cupY, 7, 2, '#2ECC71');
        pR(cupX + 2, cupY - 3, 1, 3, '#FACC15');
      }

      // Bong bóng thoại gọn gàng phía trên đầu Anh Lâm
      if (ms.bubble) {
        ctx.font = 'bold 6.5px sans-serif';
        const shortBubble = ms.bubble.length > 28 ? ms.bubble.slice(0, 27) + '…' : ms.bubble;
        const tw = Math.ceil(ctx.measureText(shortBubble).width);
        const bw = Math.max(60, Math.min(115, tw + 8));
        const bh = 12;
        const bx = Math.min(this.width - bw - 6, Math.max(6, Math.round(baseX + 11 - bw / 2)));
        const by = Math.max(10, baseY - 14);

        ctx.fillStyle = 'rgba(15, 23, 42, 0.88)';
        ctx.fillRect(bx, by, bw, bh);
        ctx.strokeStyle = '#22c55e';
        ctx.lineWidth = 1;
        ctx.strokeRect(bx, by, bw, bh);

        ctx.fillStyle = '#ffffff';
        ctx.fillText(shortBubble, bx + 4, by + 8.5);
      }
    }

    // Bong bóng thoại gọn khi đang chạy xe
    if (isRiding && ms.bubble) {
      ctx.font = 'bold 6.5px sans-serif';
      const shortBubble = ms.bubble.length > 26 ? ms.bubble.slice(0, 25) + '…' : ms.bubble;
      const tw = Math.ceil(ctx.measureText(shortBubble).width);
      const bw = Math.max(58, Math.min(110, tw + 8));
      const bh = 12;
      const bx = Math.min(this.width - bw - 6, Math.max(6, Math.round(mx + 10 - bw / 2)));
      const by = my - 43;

      ctx.fillStyle = 'rgba(15, 23, 42, 0.88)';
      ctx.fillRect(bx, by, bw, bh);
      ctx.strokeStyle = '#22c55e';
      ctx.lineWidth = 1;
      ctx.strokeRect(bx, by, bw, bh);

      ctx.fillStyle = '#ffffff';
      ctx.fillText(shortBubble, bx + 4, by + 8.5);
    }

    ctx.restore();
  }
};

