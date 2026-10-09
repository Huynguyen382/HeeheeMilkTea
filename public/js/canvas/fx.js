// Visual FX, Particles, Drink Previews & Audio Triggers for GameCanvas

export const fxMethods = {
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
  },

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
  },

  setDrinkPreview(drink) {
    this.currentDrink = drink;
  },

  setShaking(isShaking) {
    this.isShaking = isShaking;
  },

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

    // 4. Diverse Artisanal Toppings in Detailed Cup
    if (drink.toppings && drink.toppings.length > 0) {
      const toppingCoords = [
        { px: botL + 3, py: y + 23 },
        { px: botL + 7, py: y + 24 },
        { px: botL + 11, py: y + 23 },
        { px: botL + 4.5, py: y + 19.5 },
        { px: botL + 9, py: y + 20 },
        { px: botL + 7, py: y + 16.5 }
      ];

      toppingCoords.forEach((coord, idx) => {
        const tType = drink.toppings[idx % drink.toppings.length];
        if (tType === 'thach_la_dua') {
          ctx.fillStyle = 'rgba(46, 204, 113, 0.9)';
          ctx.fillRect(coord.px - 2, coord.py - 2, 4, 4);
          ctx.strokeStyle = '#a8e6cf';
          ctx.lineWidth = 0.5;
          ctx.strokeRect(coord.px - 2, coord.py - 2, 4, 4);
        } else if (tType === 'dao_mieng') {
          ctx.fillStyle = '#f39c12';
          ctx.beginPath();
          ctx.ellipse(coord.px, coord.py, 3.5, 2, 0.3, 0, Math.PI * 2);
          ctx.fill();
        } else if (tType === 'cam_vang') {
          ctx.fillStyle = '#ff9f43';
          ctx.beginPath();
          ctx.arc(coord.px, coord.py, 2.5, 0, Math.PI * 2);
          ctx.fill();
        } else if (tType === 'sa_tuoi') {
          ctx.fillStyle = '#a8e6cf';
          ctx.fillRect(coord.px - 2.5, coord.py - 1, 5, 2);
          ctx.strokeStyle = '#1dd1a1';
          ctx.lineWidth = 0.5;
          ctx.strokeRect(coord.px - 2.5, coord.py - 1, 5, 2);
        } else if (tType === 'suong_sao') {
          ctx.fillStyle = '#111111';
          ctx.fillRect(coord.px - 2.2, coord.py - 2.2, 4.4, 4.4);
          ctx.fillStyle = 'rgba(255, 255, 255, 0.5)';
          ctx.fillRect(coord.px - 1.5, coord.py - 1.5, 1.8, 0.8);
        } else if (tType === 'tranchau_duongden') {
          ctx.fillStyle = '#2b1307';
          ctx.beginPath();
          ctx.arc(coord.px, coord.py, 2.2, 0, Math.PI * 2);
          ctx.fill();
          ctx.strokeStyle = '#d35400';
          ctx.lineWidth = 0.5;
          ctx.stroke();
          ctx.fillStyle = '#ffffff';
          ctx.beginPath();
          ctx.arc(coord.px - 0.6, coord.py - 0.6, 0.6, 0, Math.PI * 2);
          ctx.fill();
        } else {
          // Classic black tapioca pearl
          ctx.fillStyle = '#110a08';
          ctx.beginPath();
          ctx.arc(coord.px, coord.py, 2.2, 0, Math.PI * 2);
          ctx.fill();
          ctx.fillStyle = 'rgba(255, 255, 255, 0.75)';
          ctx.beginPath();
          ctx.arc(coord.px - 0.6, coord.py - 0.6, 0.6, 0, Math.PI * 2);
          ctx.fill();
        }
      });
    }

    // Special Drink FX: Trà Sữa Hoàng Gia Dát Vàng 24K (Floating Gold Flakes)
    const isGold = drink.recipe === 'tra_sua_dat_vang' || 
      (drink.tea === 'den' && drink.toppings?.includes('tranchau_den') && drink.toppings?.includes('tranchau_duongden'));
    if (isGold) {
      const goldPositions = [
        { gx: x + 6, gy: y + 10 },
        { gx: x + 14, gy: y + 12 },
        { gx: x + 10, gy: y + 16 },
        { gx: x + 8, gy: y + 21 }
      ];
      goldPositions.forEach((g, idx) => {
        ctx.fillStyle = '#ffd700';
        ctx.fillRect(g.gx, g.gy, 2, 1.6);
        ctx.fillStyle = '#ffffff';
        if ((idx + (this.tick || 0)) % 4 === 0) {
          ctx.fillRect(g.gx + 0.5, g.gy - 1, 1, 3.6);
          ctx.fillRect(g.gx - 0.8, g.gy + 0.3, 3.6, 1);
        }
      });
    }

    // Special Drink FX: Trà Nitro Lạnh (Cascading micro-bubbles & thick head)
    const isNitro = drink.recipe === 'nitro_cold_brew' ||
      (drink.tea === 'olong_nuong' && drink.toppings?.includes('suong_sao') && drink.toppings?.includes('tranchau_den'));
    if (isNitro) {
      foamColor = '#fdf6e2';
      ctx.fillStyle = 'rgba(255, 255, 255, 0.6)';
      [x + 6, x + 10, x + 14].forEach((bx, idx) => {
        ctx.fillRect(bx, y + 12 + (idx * 3), 1, 1);
        ctx.fillRect(bx + 1, y + 17 + (idx * 2), 1, 1);
      });
    }

    // Special Drink FX: Trà Sen Bách Diệp Tây Hồ (Pink Lotus Petal)
    const isLotus = drink.recipe === 'tra_sen_tay_ho' ||
      (drink.tea === 'lai' && drink.toppings?.includes('dao_mieng') && drink.toppings?.includes('sa_tuoi'));
    if (isLotus) {
      ctx.fillStyle = '#ff79c6';
      ctx.beginPath();
      ctx.ellipse(x + 10, y + 8, 3.5, 1.8, -0.2, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#ffb8b8';
      ctx.beginPath();
      ctx.ellipse(x + 10.5, y + 8, 2, 1, -0.2, 0, Math.PI * 2);
      ctx.fill();
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
    const isBrulee = drink.recipe === 'kem_kho_banh_bong' ||
      (drink.tea === 'thai_xanh' && drink.toppings?.includes('thach_la_dua') && drink.toppings?.includes('tranchau_duongden'));
    if (isBrulee) {
      foamColor = '#fffbe7';
    }

    if (foamColor) {
      ctx.fillStyle = foamColor;
      ctx.beginPath();
      ctx.roundRect(topL + 1, y + 5, topW - 2, 5.5, [2, 2, 0, 0]);
      ctx.fill();
      ctx.fillStyle = '#873600';
      ctx.beginPath();
      ctx.ellipse(x + 7, y + 6.5, 2.2, 1, 0, 0, Math.PI * 2);
      ctx.ellipse(x + 13, y + 7, 2.6, 1.1, 0, 0, Math.PI * 2);
      ctx.fill();
      if (isBrulee) {
        ctx.fillStyle = '#f39c12';
        ctx.fillRect(x + 5, y + 5.5, 1.5, 1.5);
        ctx.fillRect(x + 11, y + 5.2, 1.5, 1.5);
      }
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
  },

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
  },

  updateAtmosphere() {
    const tod = this.getTimeOfDay();

    // 1. Drifting Petals & Leaves
    if (!this.petals || this.petals.length === 0) {
      this.petals = [];
      for (let i = 0; i < 20; i++) {
        this.petals.push({
          x: Math.random() * this.width,
          y: Math.random() * 150,
          vx: -(Math.random() * 0.7 + 0.4),
          vy: Math.random() * 0.35 + 0.15,
          size: Math.random() > 0.5 ? 2.5 : 2,
          rot: Math.random() * Math.PI * 2,
          color: Math.random() > 0.4 ? '#ff7675' : '#fdcb6e'
        });
      }
    }

    this.petals.forEach(p => {
      p.x += p.vx;
      p.y += p.vy + Math.sin(this.tick * 0.04 + p.x) * 0.35;
      p.rot = (p.rot || 0) + 0.02;
      if (p.x < -10) {
        p.x = this.width + 10;
        p.y = Math.random() * 130;
      }
      if (p.y > 165) p.y = -5;
    });

    // 2. Golden Sun Dust Motes (Morning & Noon sunbeams)
    if (tod === 'morning' || tod === 'noon') {
      if (!this.sunDustMotes) {
        this.sunDustMotes = [];
        for (let i = 0; i < 22; i++) {
          this.sunDustMotes.push({
            x: Math.random() * this.width,
            y: Math.random() * 140,
            vx: (Math.random() - 0.4) * 0.4,
            vy: (Math.random() - 0.5) * 0.3,
            size: Math.random() > 0.6 ? 1.5 : 1,
            phase: Math.random() * Math.PI * 2
          });
        }
      }
      this.sunDustMotes.forEach(m => {
        m.x += m.vx;
        m.y += m.vy + Math.sin(this.tick * 0.03 + m.phase) * 0.15;
        if (m.x < 0) m.x = this.width;
        if (m.x > this.width) m.x = 0;
        if (m.y < 5) m.y = 140;
        if (m.y > 145) m.y = 10;
      });
    }

    // 3. Summer Night Fireflies (Đom đóm đêm hè)
    if (tod === 'night') {
      if (!this.fireflies) {
        this.fireflies = [];
        for (let i = 0; i < 14; i++) {
          this.fireflies.push({
            x: 40 + Math.random() * (this.width - 80),
            y: 50 + Math.random() * 95,
            vx: (Math.random() - 0.5) * 0.5,
            vy: (Math.random() - 0.5) * 0.35,
            size: 1.5,
            phase: Math.random() * Math.PI * 2
          });
        }
      }
      this.fireflies.forEach(ff => {
        ff.x += ff.vx + Math.sin(this.tick * 0.03 + ff.phase) * 0.25;
        ff.y += ff.vy + Math.cos(this.tick * 0.02 + ff.phase) * 0.2;
        if (ff.x < 20) ff.vx = Math.abs(ff.vx);
        if (ff.x > this.width - 20) ff.vx = -Math.abs(ff.vx);
        if (ff.y < 35) ff.vy = Math.abs(ff.vy);
        if (ff.y > 155) ff.vy = -Math.abs(ff.vy);
      });
    }
  },

  drawAmbientAtmosphere(ctx, tod) {
    // 1. Drifting Blossom Petals (Morning, Noon, Afternoon)
    if (tod !== 'night' && this.petals) {
      ctx.save();
      this.petals.forEach(p => {
        const petalCol = (tod === 'afternoon') 
          ? (p.color === '#ff7675' ? '#e17055' : '#f39c12')
          : (p.color === '#ff7675' ? '#ff9ff3' : '#fdcb6e');
        ctx.fillStyle = petalCol;
        ctx.globalAlpha = 0.82;
        ctx.save();
        ctx.translate(p.x, p.y);
        ctx.rotate(p.rot || 0);
        ctx.beginPath();
        ctx.ellipse(0, 0, p.size + 1.2, p.size * 0.8, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      });
      ctx.restore();
    }

    // 2. Golden Sun Dust Motes (Morning & Noon)
    if ((tod === 'morning' || tod === 'noon') && this.sunDustMotes) {
      ctx.save();
      ctx.globalCompositeOperation = 'screen';
      this.sunDustMotes.forEach(m => {
        const alpha = 0.3 + Math.sin(this.tick * 0.06 + m.phase) * 0.25;
        if (alpha > 0.05) {
          ctx.fillStyle = `rgba(255, 245, 170, ${alpha})`;
          ctx.fillRect(m.x, m.y, m.size, m.size);
        }
      });
      ctx.restore();
    }

    // 3. Summer Night Fireflies (Đom đóm bay lượn phát sáng)
    if (tod === 'night' && this.fireflies) {
      ctx.save();
      this.fireflies.forEach(ff => {
        const pulse = Math.sin(this.tick * 0.08 + ff.phase);
        const glowAlpha = Math.max(0, 0.45 + pulse * 0.45);
        if (glowAlpha > 0.1) {
          // Soft radial lime-green aura
          const aura = ctx.createRadialGradient(ff.x, ff.y, 0.5, ff.x, ff.y, 7);
          aura.addColorStop(0, `rgba(168, 255, 120, ${glowAlpha})`);
          aura.addColorStop(0.5, `rgba(80, 250, 123, ${glowAlpha * 0.35})`);
          aura.addColorStop(1, 'rgba(0, 0, 0, 0)');
          ctx.fillStyle = aura;
          ctx.beginPath();
          ctx.arc(ff.x, ff.y, 7, 0, Math.PI * 2);
          ctx.fill();

          // Bright white-gold incandescent firefly core
          ctx.fillStyle = '#ffffff';
          ctx.fillRect(ff.x - 0.7, ff.y - 0.7, 1.4, 1.4);
        }
      });
      ctx.restore();
    }
  }
};

