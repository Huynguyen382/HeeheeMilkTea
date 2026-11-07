// HeeHee Stall & Multi-Stall Collab Renderer for GameCanvas

export const cartMethods = {
  isCosmicCartSkin() {
    const save = window.state?.storeState?.save;
    if (!save) return false;
    if (save.cart_skin === 'cosmic_coffee_cart') return true;
    try {
      const titles = typeof save.boss_titles === 'string' ? JSON.parse(save.boss_titles || '[]') : (save.boss_titles || []);
      if (Array.isArray(titles) && titles.some(t => t && t.includes('Chiến Thần Đập Răm'))) {
        return true;
      }
    } catch (e) {}
    return false;
  },

  _createOffscreenBuffer(w, h, scale = 2) {
    let canvas;
    if (typeof OffscreenCanvas !== 'undefined') {
      canvas = new OffscreenCanvas(Math.ceil(w * scale), Math.ceil(h * scale));
    } else if (typeof document !== 'undefined') {
      canvas = document.createElement('canvas');
      canvas.width = Math.ceil(w * scale);
      canvas.height = Math.ceil(h * scale);
    } else {
      return null;
    }
    const octx = canvas.getContext('2d');
    if (octx) {
      octx.scale(scale, scale);
      octx.imageSmoothingEnabled = false;
    }
    return { canvas, ctx: octx, w, h, scale };
  },

  drawCart(ctx) {
    this.drawCartBack(ctx);
    this.drawCartFront(ctx);
  },

  // --- CART BACK LAYER: REAR PILLARS, ARTISAN SHELVES & PENDANT LIGHT (Behind Hyhy) ---
  // Pre-rendered to OffscreenCanvas for 60 FPS mobile performance
  drawCartBack(ctx) {
    const isCosmic = this.isCosmicCartSkin();
    if (!this.cachedCartBackOffscreen || this._cachedCartBackCosmic !== isCosmic) {
      const buf = this._createOffscreenBuffer(210, 175, 2);
      if (buf && buf.ctx) {
        this._renderCartBackStatic(buf.ctx, isCosmic);
        this.cachedCartBackOffscreen = buf.canvas;
        this._cachedCartBackCosmic = isCosmic;
      } else {
        this._renderCartBackStatic(ctx, isCosmic);
        return;
      }
    }
    ctx.drawImage(this.cachedCartBackOffscreen, 0, 0, 210, 175);
  },

  _renderCartBackStatic(ctx, isCosmic) {
    const cx = 35;
    const cy = 92;

    // 1. Rear Awning Support Pillars (Brushed Gunmetal & Brass)
    ctx.fillStyle = isCosmic ? '#3b1d54' : '#4b4b5a';
    ctx.fillRect(cx + 8, cy - 35, 3, 53);
    ctx.fillRect(cx + 133, cy - 35, 3, 53);

    // 2. Back Wood Shelving Panel Unit (Kệ gỗ trưng bày siro & hũ trà)
    const shelfX = cx + 6;
    const shelfY = cy - 26;
    const shelfW = 132;
    const shelfH = 44;

    // Dark oak backboard with horizontal wood slat grooves
    ctx.fillStyle = isCosmic ? '#170926' : '#2c160a';
    ctx.beginPath();
    if (ctx.roundRect) ctx.roundRect(shelfX, shelfY, shelfW, shelfH, 3);
    else ctx.rect(shelfX, shelfY, shelfW, shelfH);
    ctx.fill();

    // Soft 2x2 dithered warm shadow at top of shelving unit
    if (typeof this.drawDitheredRect === 'function') {
      this.drawDitheredRect(ctx, shelfX + 2, shelfY + 1, shelfW - 4, 6, isCosmic ? '#170926' : '#2c160a', '#1f1625');
    }

    // Wood slat grooves
    ctx.fillStyle = isCosmic ? '#0e041a' : '#1e0e06';
    for (let sy = shelfY + 9; sy < shelfY + shelfH; sy += 9) {
      ctx.fillRect(shelfX, sy, shelfW, 1);
    }

    // Upper Shelf (y = cy - 13 = 79)
    ctx.fillStyle = isCosmic ? '#3b1754' : '#5c2d13';
    ctx.fillRect(shelfX + 4, cy - 13, shelfW - 8, 3);
    ctx.fillStyle = isCosmic ? '#6b21a8' : '#8a5a36';
    ctx.fillRect(shelfX + 4, cy - 14, shelfW - 8, 1); // shelf highlight

    // Lower Shelf (y = cy + 4 = 96)
    ctx.fillStyle = isCosmic ? '#3b1754' : '#5c2d13';
    ctx.fillRect(shelfX + 4, cy + 3, shelfW - 8, 3);
    ctx.fillStyle = isCosmic ? '#6b21a8' : '#8a5a36';
    ctx.fillRect(shelfX + 4, cy + 2, shelfW - 8, 1);

    // Brass / Neon shelf brackets
    ctx.fillStyle = isCosmic ? '#c084fc' : '#f4c430';
    ctx.fillRect(shelfX + 6, cy - 10, 2, 4);
    ctx.fillRect(shelfX + shelfW - 8, cy - 10, 2, 4);
    ctx.fillRect(shelfX + 6, cy + 6, 2, 4);
    ctx.fillRect(shelfX + shelfW - 8, cy + 6, 2, 4);

    // --- UPPER SHELF ITEMS: ARTISAN SYRUP BOTTLES & TEA CANISTERS ---
    const syrups = [
      { x: shelfX + 8, color: '#e74c3c' },  // Dâu tây (Strawberry)
      { x: shelfX + 17, color: '#f39c12' }, // Đào vàng (Peach)
      { x: shelfX + 26, color: '#2ecc71' }, // Bạc hà (Mint)
      { x: shelfX + 35, color: '#9b59b6' }, // Khoai môn (Taro)
      { x: shelfX + 44, color: '#e67e22' }, // Cam quế (Orange)
    ];

    syrups.forEach(s => {
      // Bottle neck & wooden cork
      ctx.fillStyle = '#b45309';
      if (ctx.roundRect) {
        ctx.beginPath();
        ctx.roundRect(s.x + 2, cy - 25, 2.2, 2.5, 0.8);
        ctx.fill();
      } else {
        ctx.fillRect(s.x + 2, cy - 25, 2, 2);
      }
      // Translucent glass bottle neck with shoulder taper
      ctx.fillStyle = 'rgba(255, 255, 255, 0.55)';
      ctx.fillRect(s.x + 2, cy - 22.5, 2, 2.5);

      // Glass bottle body with rounded corners
      ctx.fillStyle = 'rgba(255, 255, 255, 0.35)';
      if (ctx.roundRect) {
        ctx.beginPath();
        ctx.roundRect(s.x, cy - 20, 6.2, 7.5, [1.5, 1.5, 1, 1]);
        ctx.fill();
      } else {
        ctx.fillRect(s.x, cy - 20, 6, 7);
      }

      // Rich glowing translucent syrup with meniscus
      ctx.fillStyle = s.color;
      if (ctx.roundRect) {
        ctx.beginPath();
        ctx.roundRect(s.x + 0.6, cy - 18.2, 5, 5.5, [0.5, 0.5, 0.8, 0.8]);
        ctx.fill();
      } else {
        ctx.fillRect(s.x + 0.6, cy - 18, 4.8, 5);
      }

      // Glass specular reflection glare line
      ctx.fillStyle = 'rgba(255, 255, 255, 0.65)';
      ctx.fillRect(s.x + 1, cy - 19.5, 1, 6);

      // Vintage parchment paper label
      ctx.fillStyle = '#fffdf0';
      ctx.fillRect(s.x + 1, cy - 16, 4.2, 2.6);
      ctx.fillStyle = '#d97706';
      ctx.fillRect(s.x + 1.2, cy - 14.8, 3.8, 0.5);
    });

    // Ceramic Tea Canisters
    const teaJars = [
      { x: shelfX + 56, capColor: '#c0392b', label: 'Ô' },
      { x: shelfX + 68, capColor: '#27ae60', label: 'L' },
      { x: shelfX + 80, capColor: '#2c3e50', label: 'Đ' },
    ];
    teaJars.forEach(tj => {
      ctx.fillStyle = '#f8fafc';
      ctx.beginPath();
      if (ctx.roundRect) {
        ctx.roundRect(tj.x, cy - 22, 9, 9.5, [1.5, 1.5, 2, 2]);
      } else {
        ctx.rect(tj.x, cy - 22, 9, 9);
      }
      ctx.fill();

      ctx.fillStyle = 'rgba(255, 255, 255, 0.85)';
      ctx.fillRect(tj.x + 1.2, cy - 21, 1.2, 7.5);

      ctx.fillStyle = tj.capColor;
      if (ctx.roundRect) {
        ctx.beginPath();
        ctx.roundRect(tj.x + 0.8, cy - 24.2, 7.4, 2.4, [1.2, 1.2, 0, 0]);
        ctx.fill();
      } else {
        ctx.fillRect(tj.x + 1, cy - 24, 7, 2);
      }

      ctx.fillStyle = '#fde047';
      ctx.beginPath();
      ctx.arc(tj.x + 4.5, cy - 17.5, 2.2, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#78350f';
      ctx.font = 'bold 3.5px sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(tj.label, tj.x + 4.5, cy - 17.5);
    });

    // Hanging Chalkboard Menu on back wall
    ctx.fillStyle = '#1e272e';
    ctx.beginPath();
    if (ctx.roundRect) ctx.roundRect(shelfX + 94, cy - 23, 32, 10, 1.5);
    else ctx.rect(shelfX + 94, cy - 23, 32, 10);
    ctx.fill();
    ctx.strokeStyle = isCosmic ? '#a855f7' : '#8a431c';
    ctx.lineWidth = 1;
    ctx.strokeRect(shelfX + 94, cy - 23, 32, 10);
    ctx.fillStyle = '#f1f2f6';
    ctx.font = 'bold 5px sans-serif';
    ctx.textAlign = 'left';
    ctx.fillText(isCosmic ? 'MENU VŨ TRỤ 🌌' : 'MENU HEEHEE 🧋', shelfX + 96, cy - 17);
    ctx.fillStyle = isCosmic ? '#38bdf8' : '#feca57';
    ctx.fillText(isCosmic ? 'COSMIC TEA ⭐' : 'ĐỒNG GIÁ 25k ⭐', shelfX + 96, cy - 14);

    // --- LOWER SHELF ITEMS: CUP STACKS & SUCCULENT ---
    for (let c = 0; c < 3; c++) {
      ctx.fillStyle = '#ffffff';
      ctx.beginPath();
      if (ctx.roundRect) ctx.roundRect(shelfX + 8 + c * 8, cy - 7, 6, 10, 1);
      else ctx.rect(shelfX + 8 + c * 8, cy - 7, 6, 10);
      ctx.fill();
      ctx.fillStyle = isCosmic ? '#c084fc' : '#ff7675';
      ctx.fillRect(shelfX + 9 + c * 8, cy - 3, 4, 3);
      ctx.fillStyle = '#e2e8f0';
      ctx.fillRect(shelfX + 7.5 + c * 8, cy - 7, 7, 1);
    }

    // Mini decorative potted succulent in terracotta pot
    ctx.fillStyle = '#e17055';
    ctx.beginPath();
    if (ctx.roundRect) ctx.roundRect(shelfX + 116, cy - 5, 8, 8, 1.5);
    else ctx.rect(shelfX + 116, cy - 5, 8, 8);
    ctx.fill();
    ctx.fillStyle = '#c0392b';
    ctx.fillRect(shelfX + 115, cy - 5, 10, 1.5);
    ctx.fillStyle = '#00b894';
    ctx.beginPath();
    ctx.arc(shelfX + 120, cy - 6, 4, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#55efc4';
    ctx.beginPath();
    ctx.arc(shelfX + 120, cy - 7, 2, 0, Math.PI * 2);
    ctx.fill();

    // Vintage Edison / Cosmic Pendant Bulb hanging from ceiling above Hyhy
    const lampX = cx + 64;
    const lampY = cy - 26;
    ctx.strokeStyle = '#2d3436';
    ctx.lineWidth = 1.2;
    ctx.beginPath();
    ctx.moveTo(lampX, cy - 40);
    ctx.lineTo(lampX, lampY);
    ctx.stroke();

    ctx.fillStyle = isCosmic ? '#a855f7' : '#f59e0b';
    ctx.fillRect(lampX - 2, lampY, 4, 3);
    ctx.fillStyle = '#d97706';
    ctx.fillRect(lampX - 2.5, lampY + 1.8, 5, 1);

    ctx.fillStyle = isCosmic ? 'rgba(232, 121, 249, 0.95)' : 'rgba(255, 240, 175, 0.96)';
    ctx.beginPath();
    ctx.arc(lampX, lampY + 5.5, 3.8, 0, Math.PI * 2);
    ctx.fill();

    ctx.strokeStyle = isCosmic ? '#f472b6' : '#f97316';
    ctx.lineWidth = 0.8;
    ctx.beginPath();
    ctx.moveTo(lampX - 1.2, lampY + 4);
    ctx.lineTo(lampX, lampY + 6.2);
    ctx.lineTo(lampX + 1.2, lampY + 4);
    ctx.stroke();

    const warmPendantGlow = ctx.createRadialGradient(lampX, lampY + 5.5, 2, lampX, lampY + 18, 52);
    if (isCosmic) {
      warmPendantGlow.addColorStop(0, 'rgba(168, 85, 247, 0.50)');
      warmPendantGlow.addColorStop(0.5, 'rgba(56, 189, 248, 0.20)');
      warmPendantGlow.addColorStop(1, 'rgba(56, 189, 248, 0)');
    } else {
      warmPendantGlow.addColorStop(0, 'rgba(255, 225, 90, 0.44)');
      warmPendantGlow.addColorStop(0.55, 'rgba(255, 175, 50, 0.16)');
      warmPendantGlow.addColorStop(1, 'rgba(255, 175, 50, 0)');
    }
    ctx.fillStyle = warmPendantGlow;
    ctx.beginPath();
    ctx.arc(lampX, lampY + 18, 52, 0, Math.PI * 2);
    ctx.fill();
  },

  // --- CART FRONT LAYER: COUNTERTOP, FRONT CHASSIS, GLASS SHOWCASE, AWNING & EQUIPMENT (In front of Hyhy) ---
  drawCartFront(ctx) {
    const cx = 35;
    const cy = 92;
    const isCosmic = this.isCosmicCartSkin();

    // 1. Pre-rendered Offscreen Static Cart Front (Chassis, Marble, Showcase, Equipment, Stool)
    if (!this.cachedCartFrontOffscreen || this._cachedCartFrontCosmic !== isCosmic) {
      const buf = this._createOffscreenBuffer(210, 175, 2);
      if (buf && buf.ctx) {
        this._renderCartFrontStatic(buf.ctx, isCosmic);
        this.cachedCartFrontOffscreen = buf.canvas;
        this._cachedCartFrontCosmic = isCosmic;
      } else {
        this._renderCartFrontStatic(ctx, isCosmic);
      }
    }
    if (this.cachedCartFrontOffscreen) {
      ctx.drawImage(this.cachedCartFrontOffscreen, 0, 0, 210, 175);
    }

    // If Cosmic skin is active, draw animated cosmic wheel spokes over wheels
    if (isCosmic) {
      this.drawWheel(ctx, cx + 25, cy + 54);
      this.drawWheel(ctx, cx + 115, cy + 54);
    }

    // 2. Dynamic Fabric Striped Awning Roof with Scalloped Edge & Wind Wave
    const awningY = cy - 42;
    const stripeColors = isCosmic
      ? (this._cosmicStripeColors || (this._cosmicStripeColors = ['#581c87', '#38bdf8', '#9333ea', '#c084fc', '#4c1d95', '#38bdf8', '#9333ea', '#c084fc', '#581c87']))
      : (this._classicStripeColors || (this._classicStripeColors = ['#d9383a', '#faedcd', '#d9383a', '#faedcd', '#d9383a', '#faedcd', '#d9383a', '#faedcd', '#d9383a']));
    const sw = 18;
    for (let i = 0; i < stripeColors.length; i++) {
      const sx = cx - 8 + i * sw;
      const wave = Math.sin(this.tick * 0.05 + i * 0.35) * 1.5;
      const sh = 16 + wave;

      // Base stripe fabric
      ctx.fillStyle = stripeColors[i];
      ctx.fillRect(sx, awningY, sw, sh);

      // Soft 2x2 Checkerboard Dither Shading at top & bottom seam of awning stripe
      if (typeof this.drawDitheredRect === 'function') {
        const ditherShade = (i % 2 === 0)
          ? (isCosmic ? '#3b0764' : '#991b1b')
          : (isCosmic ? '#0284c7' : '#d4a373');
        this.drawDitheredRect(ctx, sx, awningY + sh - 4, sw, 4, stripeColors[i], ditherShade);
      }

      // Scalloped bottom ruffle
      ctx.fillStyle = stripeColors[i];
      ctx.beginPath();
      ctx.arc(sx + sw / 2, awningY + sh, sw / 2, 0, Math.PI);
      ctx.fill();

      // Subtle 3D cylindrical fabric highlight
      ctx.fillStyle = 'rgba(254, 250, 224, 0.16)';
      ctx.fillRect(sx + 5, awningY, 7, sh);

      // Scalloped highlight & stitched hemline border
      ctx.strokeStyle = isCosmic ? 'rgba(192, 132, 252, 0.4)' : 'rgba(254, 250, 224, 0.4)';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.arc(sx + sw / 2, awningY + sh, sw / 2, 0, Math.PI);
      ctx.stroke();
    }

    // Awning soft drop shadow underneath onto cart front
    ctx.fillStyle = isCosmic ? 'rgba(50, 15, 80, 0.35)' : 'rgba(43, 30, 42, 0.32)';
    ctx.fillRect(cx - 8, awningY + 17, 162, 4);

    // Warm twinkling fairy lights on awning edge
    const fairyColors = isCosmic
      ? (this._cosmicFairyColors || (this._cosmicFairyColors = ['#c084fc', '#38bdf8', '#f472b6', '#a855f7', '#67e8f9']))
      : (this._classicFairyColors || (this._classicFairyColors = ['#ff7675', '#ffeaa7', '#55efc4', '#a29bfe', '#fd79a8']));
    for (let f = 0; f < 8; f++) {
      const fx = cx - 2 + f * 20;
      const fy = awningY + 18 + Math.sin(this.tick * 0.05 + f * 0.35) * 1.5;
      const glow = (Math.sin(this.tick * 0.1 + f) + 1) * 0.3 + 0.4;
      ctx.fillStyle = fairyColors[f % fairyColors.length];
      ctx.fillRect(fx + 4, fy, 2.5, 2.5);
      ctx.fillStyle = isCosmic ? `rgba(216, 180, 254, ${glow * 0.35})` : `rgba(255, 235, 160, ${glow * 0.25})`;
      ctx.beginPath();
      ctx.arc(fx + 5, fy + 1, 4, 0, Math.PI * 2);
      ctx.fill();
    }

    // --- SLEEPING CAT ON AWNING ROOF ---
    const catX = cx + 85;
    const catY = awningY - 4;
    const catBreathe = Math.sin((this.tick * Math.PI * 2) / 144) * 1.1;
    ctx.fillStyle = 'rgba(43, 30, 42, 0.32)';
    ctx.beginPath();
    ctx.ellipse(catX, catY + 4 + catBreathe, 8, 3, 0, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = isCosmic ? '#9333ea' : '#e67e22';
    ctx.beginPath();
    ctx.ellipse(catX, catY + catBreathe, 8, 5, -0.1, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = isCosmic ? '#c084fc' : '#d35400';
    ctx.beginPath();
    ctx.ellipse(catX + 1, catY - 1 + catBreathe, 6, 2.8, -0.1, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = '#fefae0';
    ctx.beginPath();
    ctx.arc(catX - 6, catY - 0.5 + catBreathe, 4, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = isCosmic ? '#9333ea' : '#e67e22';
    ctx.beginPath();
    ctx.moveTo(catX - 8.5, catY - 3 + catBreathe);
    ctx.lineTo(catX - 7, catY - 6.5 + catBreathe);
    ctx.lineTo(catX - 5.5, catY - 3 + catBreathe);
    ctx.fill();
    ctx.beginPath();
    ctx.moveTo(catX - 5, catY - 3 + catBreathe);
    ctx.lineTo(catX - 3.5, catY - 6.5 + catBreathe);
    ctx.lineTo(catX - 2, catY - 3 + catBreathe);
    ctx.fill();
    ctx.fillStyle = '#fab1a0';
    ctx.beginPath();
    ctx.arc(catX - 7, catY - 3.8 + catBreathe, 1, 0, Math.PI * 2);
    ctx.arc(catX - 3.5, catY - 3.8 + catBreathe, 1, 0, Math.PI * 2);
    ctx.fill();

    ctx.strokeStyle = '#2b1e2a';
    ctx.lineWidth = 0.9;
    ctx.beginPath();
    ctx.arc(catX - 7, catY + catBreathe, 1.2, 0, Math.PI);
    ctx.stroke();

    const catTail = Math.sin(this.tick * 0.12) * 2;
    ctx.fillStyle = isCosmic ? '#9333ea' : '#e67e22';
    ctx.beginPath();
    if (ctx.roundRect) ctx.roundRect(catX + 6, catY + 1 + catTail, 5, 2.5, 1);
    else ctx.rect(catX + 6, catY + 1 + catTail, 5, 2.5);
    ctx.fill();
    ctx.fillStyle = '#fefae0';
    ctx.beginPath();
    ctx.arc(catX + 11, catY + 2.2 + catTail, 1.3, 0, Math.PI * 2);
    ctx.fill();

    // 8. BĂNG RÔN QUẢNG CÁO TRƯỚC QUẦY: HIỆU ỨNG CHẠY CHỮ TÊN TIỆM (STORE_NAME)
    const neonPulse = (Math.sin(this.tick * 0.1) + 1) * 0.15 + 0.85;
    const plaqueX = cx + 16;
    const plaqueY = cy + 27;
    const plaqueW = 112;
    const plaqueH = 17;

    ctx.strokeStyle = isCosmic ? `rgba(168, 85, 247, ${neonPulse})` : `rgba(244, 196, 48, ${neonPulse})`;
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    if (ctx.roundRect) ctx.roundRect(plaqueX, plaqueY, plaqueW, plaqueH, 3.5);
    else ctx.rect(plaqueX, plaqueY, plaqueW, plaqueH);
    ctx.stroke();

    const innerX = plaqueX + 4;
    const innerY = plaqueY + 2;
    const innerW = plaqueW - 8;
    const innerH = plaqueH - 4;
    const centerY = plaqueY + plaqueH / 2 + 0.5;

    const rawStoreName = (this.storeName || window.state?.storeState?.store_name || window.state?.storeState?.save?.store_name || 'Tiệm Trà Sữa HeeHee').trim();
    const bannerSegment = `🧋 ${rawStoreName.toUpperCase()}   ★   CHÀO MỪNG QUÝ KHÁCH   ★   `;

    ctx.save();
    ctx.beginPath();
    if (ctx.roundRect) {
      ctx.roundRect(innerX, innerY, innerW, innerH, 2);
    } else {
      ctx.rect(innerX, innerY, innerW, innerH);
    }
    ctx.clip();

    ctx.font = 'bold 8.5px "Segoe UI", Arial, sans-serif';
    ctx.textAlign = 'left';
    ctx.textBaseline = 'middle';

    const segWidth = Math.max(20, ctx.measureText(bannerSegment).width);
    const scrollSpeed = 0.65;
    const scrollOffset = (this.tick * scrollSpeed) % segWidth;

    ctx.shadowColor = isCosmic ? 'rgba(192, 132, 252, 0.95)' : 'rgba(251, 191, 36, 0.85)';
    ctx.shadowBlur = (isCosmic ? 5 : 4) * neonPulse;
    ctx.fillStyle = isCosmic ? '#f0abfc' : '#fbbf24';

    let drawX = innerX - scrollOffset;
    while (drawX < innerX + innerW + segWidth) {
      ctx.fillText(bannerSegment, drawX, centerY);
      drawX += segWidth;
    }
    ctx.restore();

    // Dynamic Boiling Boba Pearls & Rising Steam in Pot
    const potX = cx + 120;
    const potY = cy + 3;
    const potTick = this.tick;
    const bubble1 = Math.sin(potTick * 0.15) * 1.5;
    const bubble2 = Math.cos(potTick * 0.18) * 1.5;
    ctx.fillStyle = '#171717';
    ctx.beginPath();
    ctx.arc(potX + 4.5, potY + 4.5 + bubble1 * 0.5, 1.8, 0, Math.PI * 2);
    ctx.arc(potX + 9, potY + 4 + bubble2 * 0.5, 1.6, 0, Math.PI * 2);
    ctx.arc(potX + 13.5, potY + 4.5 - bubble1 * 0.5, 1.8, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#f59e0b';
    ctx.fillRect(potX + 4, potY + 3.8 + bubble1 * 0.5, 1, 0.8);
    ctx.fillRect(potX + 8.6, potY + 3.4 + bubble2 * 0.5, 0.9, 0.7);
    ctx.fillRect(potX + 13, potY + 3.8 - bubble1 * 0.5, 1, 0.8);

    for (let s = 0; s < 5; s++) {
      const steamProg = ((potTick * 0.6 + s * 8) % 30);
      const steamAlpha = Math.max(0, 1 - (steamProg / 30));
      const sway = Math.sin(potTick * 0.08 + s * 1.2) * 3.5;
      ctx.fillStyle = `rgba(254, 250, 224, ${steamAlpha * 0.42})`;
      ctx.beginPath();
      ctx.arc(potX + 4 + s * 2.5 + sway, potY + 1 - steamProg, 1.8 + steamProg * 0.16, 0, Math.PI * 2);
      ctx.fill();
    }

    // --- PARKED FLEET VEHICLES DISPLAY (HỆ THỐNG XE ĐỖ BÊN QUÁN) ---
    this.drawParkedVehicles(ctx, cx, cy);
  },

  _renderCartFrontStatic(ctx, isCosmic) {
    const cx = 35;
    const cy = 92;

    // Cart Drop Shadow on street (#2b1e2a diffuse ambient shadow)
    ctx.fillStyle = 'rgba(20, 10, 15, 0.58)';
    ctx.beginPath();
    ctx.ellipse(cx + 70, cy + 62, 75, 10, 0, 0, Math.PI * 2);
    ctx.fill();

    // 1. Heavy Duty Wheel Axle across bottom
    ctx.fillStyle = '#2d3436';
    ctx.fillRect(cx + 25, cy + 53, 90, 3);

    // 2. Cart Wheels with Spoke detailing & Gold rim
    this.drawWheel(ctx, cx + 25, cy + 54);
    this.drawWheel(ctx, cx + 115, cy + 54);

    // 3. Cart Wooden Chassis (Warm Oak #8a5a36 & Honey #d4a373 with 2x2 Dither Shading)
    ctx.fillStyle = '#2b1e2a'; // soft dark contour
    ctx.fillRect(cx, cy + 22, 145, 27);

    ctx.fillStyle = '#8a5a36'; // warm oak chassis
    ctx.fillRect(cx + 3, cy + 24, 139, 23);

    if (typeof this.drawDitheredRect === 'function') {
      this.drawDitheredRect(ctx, cx + 3, cy + 24, 139, 5, '#8a5a36', '#d4a373');
      this.drawDitheredRect(ctx, cx + 3, cy + 42, 139, 5, '#8a5a36', '#5f2f14');
    }

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

    // 4. Modern Glass Pastry & Topping Showcase in Front Panel
    const glassX = cx + 38;
    const glassY = cy + 25;
    const glassW = 68;
    const glassH = 20;

    ctx.fillStyle = '#1f1625';
    ctx.beginPath();
    if (ctx.roundRect) ctx.roundRect(glassX, glassY, glassW, glassH, 2);
    else ctx.rect(glassX, glassY, glassW, glassH);
    ctx.fill();

    ctx.fillStyle = 'rgba(254, 250, 224, 0.22)';
    ctx.fillRect(glassX + 2, glassY + 2, glassW - 4, glassH - 4);

    ctx.fillStyle = 'rgba(255, 255, 255, 0.45)';
    ctx.fillRect(glassX + 2, glassY + 10.5, glassW - 4, 1.5);

    // Mini Egg Tarts
    for (let t = 0; t < 3; t++) {
      const tx = glassX + 6 + t * 9.5;
      ctx.fillStyle = '#c2410c';
      ctx.beginPath();
      ctx.ellipse(tx + 3.2, glassY + 8.8, 3.8, 2.2, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#f97316';
      ctx.beginPath();
      ctx.ellipse(tx + 3.2, glassY + 8.5, 3.2, 1.8, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#fde047';
      ctx.beginPath();
      ctx.ellipse(tx + 3.2, glassY + 8.2, 2.4, 1.4, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#78350f';
      ctx.fillRect(tx + 2.4, glassY + 7.8, 1.2, 0.8);
      ctx.fillRect(tx + 3.8, glassY + 8.2, 0.8, 0.6);
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(tx + 2.8, glassY + 7.6, 0.6, 0.6);
    }

    // Caramel Flan Puddings
    for (let f = 0; f < 3; f++) {
      const fx = glassX + 38 + f * 9.5;
      ctx.fillStyle = '#faedcd';
      ctx.beginPath();
      if (ctx.roundRect) {
        ctx.roundRect(fx, glassY + 12.5, 6.5, 5.5, [1, 1, 1.5, 1.5]);
      } else {
        ctx.rect(fx, glassY + 13, 6, 5);
      }
      ctx.fill();

      ctx.fillStyle = '#9a3412';
      if (ctx.roundRect) {
        ctx.beginPath();
        ctx.roundRect(fx, glassY + 12.2, 6.5, 2.0, [1, 1, 0, 0]);
        ctx.fill();
      } else {
        ctx.fillRect(fx, glassY + 12.5, 6, 1.8);
      }
      ctx.fillStyle = '#c2410c';
      ctx.fillRect(fx + 1.2, glassY + 14, 1, 2.2);
      ctx.fillRect(fx + 4.8, glassY + 14, 0.8, 1.5);
      ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
      ctx.fillRect(fx + 1.8, glassY + 12.6, 1.2, 0.7);
    }

    ctx.strokeStyle = 'rgba(255, 255, 255, 0.45)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(glassX + 4, glassY + glassH - 2);
    ctx.lineTo(glassX + 16, glassY + 2);
    ctx.moveTo(glassX + 22, glassY + glassH - 2);
    ctx.lineTo(glassX + 32, glassY + 2);
    ctx.stroke();

    // 5. Polished Carrara Marble Countertop
    ctx.fillStyle = '#fefae0';
    ctx.beginPath();
    if (ctx.roundRect) ctx.roundRect(cx - 6, cy + 17, 157, 6, 2.5);
    else ctx.rect(cx - 6, cy + 17, 157, 6);
    ctx.fill();

    ctx.strokeStyle = 'rgba(180, 160, 150, 0.35)';
    ctx.lineWidth = 0.8;
    ctx.beginPath();
    ctx.moveTo(cx + 8, cy + 18);
    ctx.lineTo(cx + 22, cy + 20);
    ctx.lineTo(cx + 34, cy + 19);
    ctx.moveTo(cx + 105, cy + 18.5);
    ctx.lineTo(cx + 125, cy + 20.5);
    ctx.stroke();

    ctx.fillStyle = '#d4a373';
    ctx.fillRect(cx - 6, cy + 21, 157, 2);
    ctx.fillStyle = 'rgba(255, 255, 255, 0.85)';
    ctx.fillRect(cx - 5, cy + 17.5, 155, 1);

    // Stainless Steel Honeycomb Drainage Tray
    ctx.fillStyle = '#94A3B8';
    ctx.beginPath();
    if (ctx.roundRect) {
      ctx.roundRect(cx + 25, cy + 17, 44, 4.2, 1);
    } else {
      ctx.rect(cx + 25, cy + 17, 44, 4);
    }
    ctx.fill();
    ctx.fillStyle = '#CBD5E1';
    ctx.fillRect(cx + 26, cy + 17.5, 42, 3);
    ctx.fillStyle = '#475569';
    for (let hx = cx + 28; hx < cx + 66; hx += 3) {
      ctx.fillRect(hx, cy + 18, 1.5, 1);
      ctx.fillRect(hx + 1.5, cy + 19, 1.5, 1);
    }

    // 6. Front Awning Support Pillars
    ctx.fillStyle = '#c5c5d2';
    ctx.fillRect(cx + 4, cy - 35, 4, 53);
    ctx.fillRect(cx + 137, cy - 35, 4, 53);
    ctx.fillStyle = '#f4c430';
    ctx.fillRect(cx + 3, cy + 13, 6, 4);
    ctx.fillRect(cx + 136, cy + 13, 6, 4);

    // 8. Static LED Marquee Plaque Base & Grid
    const plaqueX = cx + 16;
    const plaqueY = cy + 27;
    const plaqueW = 112;
    const plaqueH = 17;
    ctx.fillStyle = isCosmic ? '#0a0314' : '#140711';
    ctx.beginPath();
    if (ctx.roundRect) {
      ctx.roundRect(plaqueX, plaqueY, plaqueW, plaqueH, 3.5);
    } else {
      ctx.rect(plaqueX, plaqueY, plaqueW, plaqueH);
    }
    ctx.fill();

    ctx.fillStyle = isCosmic ? 'rgba(168, 85, 247, 0.08)' : 'rgba(244, 196, 48, 0.06)';
    for (let lx = plaqueX + 4; lx < plaqueX + plaqueW - 4; lx += 4) {
      for (let ly = plaqueY + 3; ly < plaqueY + plaqueH - 3; ly += 3) {
        ctx.fillRect(lx, ly, 1.5, 1);
      }
    }

    ctx.fillStyle = isCosmic ? '#c084fc' : '#f39c12';
    ctx.fillRect(plaqueX + 2, plaqueY + 2, 2, 2);
    ctx.fillRect(plaqueX + plaqueW - 4, plaqueY + 2, 2, 2);
    ctx.fillRect(plaqueX + 2, plaqueY + plaqueH - 4, 2, 2);
    ctx.fillRect(plaqueX + plaqueW - 4, plaqueY + plaqueH - 4, 2, 2);

    // 9. EQUIPMENT ON THE COUNTER:
    // A. Stainless Steel Tea Urn
    const urnX = cx + 8;
    const urnY = cy + 1;
    ctx.fillStyle = 'rgba(43, 30, 42, 0.35)';
    ctx.beginPath();
    ctx.ellipse(urnX + 7.5, urnY + 18, 8, 2.5, 0, 0, Math.PI * 2);
    ctx.fill();

    const urnGrad = ctx.createLinearGradient(urnX, urnY, urnX + 15, urnY);
    urnGrad.addColorStop(0, '#94a3b8');
    urnGrad.addColorStop(0.25, '#f1f5f9');
    urnGrad.addColorStop(0.65, '#cbd5e1');
    urnGrad.addColorStop(1, '#64748b');
    ctx.fillStyle = urnGrad;
    ctx.beginPath();
    if (ctx.roundRect) {
      ctx.roundRect(urnX, urnY, 15, 17, [2, 2, 1.5, 1.5]);
    } else {
      ctx.rect(urnX, urnY, 15, 17);
    }
    ctx.fill();

    ctx.fillStyle = '#475569';
    ctx.fillRect(urnX + 0.5, urnY + 16, 14, 1.5);
    ctx.fillRect(urnX + 0.5, urnY + 2.5, 14, 1);

    ctx.fillStyle = '#64748b';
    ctx.beginPath();
    if (ctx.roundRect) {
      ctx.roundRect(urnX + 1, urnY - 1, 13, 3, [2, 2, 0, 0]);
    } else {
      ctx.rect(urnX + 1, urnY - 1, 13, 3);
    }
    ctx.fill();
    ctx.fillStyle = '#f8fafc';
    ctx.fillRect(urnX + 2, urnY - 0.5, 11, 0.8);
    ctx.fillStyle = '#334155';
    ctx.beginPath();
    ctx.arc(urnX + 7.5, urnY - 2, 1.6, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = '#cbd5e1';
    ctx.fillRect(urnX + 13, cy + 13, 3, 2);
    ctx.fillStyle = '#dc2626';
    ctx.beginPath();
    if (ctx.roundRect) {
      ctx.roundRect(urnX + 14.5, cy + 11.5, 2.5, 4, 1);
    } else {
      ctx.rect(urnX + 14.5, cy + 11.5, 2.5, 4);
    }
    ctx.fill();
    ctx.fillStyle = '#f59e0b';
    ctx.fillRect(urnX + 14.5, cy + 15, 2, 1);

    ctx.fillStyle = 'rgba(255, 255, 255, 0.5)';
    ctx.fillRect(urnX - 2, urnY + 3, 2.2, 12);
    ctx.fillStyle = '#78350f';
    ctx.fillRect(urnX - 1.8, urnY + 6, 1.8, 9);
    ctx.fillStyle = '#fde047';
    ctx.fillRect(urnX - 2, urnY + 7, 1, 0.6);
    ctx.fillRect(urnX - 2, urnY + 10, 1, 0.6);
    ctx.fillRect(urnX - 2, urnY + 13, 1, 0.6);

    // B. Glass Topping Jars
    this.drawGlassJar(ctx, cx + 26, cy + 7, '#111');
    this.drawGlassJar(ctx, cx + 38, cy + 7, '#f39c12');
    this.drawGlassJar(ctx, cx + 50, cy + 7, '#27ae60');

    // C. Stainless Steel Ice Tub
    const iceX = cx + 62;
    const iceY = cy + 8;
    ctx.fillStyle = 'rgba(43, 30, 42, 0.3)';
    ctx.beginPath();
    ctx.ellipse(iceX + 6, iceY + 10, 7, 2, 0, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = '#64748b';
    ctx.beginPath();
    if (ctx.roundRect) {
      ctx.roundRect(iceX, iceY, 12, 9.5, 1.5);
    } else {
      ctx.rect(iceX, iceY, 12, 9.5);
    }
    ctx.fill();
    ctx.fillStyle = '#94a3b8';
    ctx.fillRect(iceX + 0.8, iceY + 1, 10.4, 8);
    ctx.fillStyle = '#cbd5e1';
    ctx.fillRect(iceX - 0.5, iceY - 0.5, 13, 1.5);

    ctx.fillStyle = '#e0f2fe';
    ctx.beginPath();
    if (ctx.roundRect) {
      ctx.roundRect(iceX + 1.5, iceY - 1.5, 9, 5, 1);
    } else {
      ctx.rect(iceX + 1.5, iceY - 1.5, 9, 5);
    }
    ctx.fill();
    ctx.fillStyle = '#bae6fd';
    ctx.fillRect(iceX + 2, iceY, 3, 2.5);
    ctx.fillRect(iceX + 6.5, iceY - 0.5, 3.5, 2.5);
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(iceX + 2.5, iceY - 1, 1.5, 1);
    ctx.fillRect(iceX + 7.5, iceY - 1.2, 1.5, 1);

    ctx.fillStyle = '#cbd5e1';
    ctx.fillRect(iceX + 9, iceY - 5, 2, 6);
    ctx.fillStyle = '#f8fafc';
    ctx.fillRect(iceX + 9, iceY - 5, 1, 6);

    // D. Cup Sealing Machine
    const sealX = cx + 76;
    const sealY = cy + 2;
    ctx.fillStyle = '#991b1b';
    ctx.beginPath();
    if (ctx.roundRect) {
      ctx.roundRect(sealX, sealY, 15, 16.5, [2, 2, 1, 1]);
    } else {
      ctx.rect(sealX, sealY, 15, 16.5);
    }
    ctx.fill();
    ctx.fillStyle = '#dc2626';
    ctx.beginPath();
    if (ctx.roundRect) {
      ctx.roundRect(sealX + 1.5, sealY + 2.5, 12, 13, 1);
    } else {
      ctx.rect(sealX + 1.5, sealY + 2.5, 12, 13);
    }
    ctx.fill();

    ctx.fillStyle = '#1c1917';
    ctx.fillRect(sealX + 2.5, sealY + 10, 10, 4);

    ctx.fillStyle = '#0f172a';
    ctx.fillRect(sealX + 3, sealY + 4, 7, 3.5);
    ctx.fillStyle = '#4ade80';
    ctx.font = 'bold 3.2px monospace';
    ctx.fillText('185', sealX + 3.5, sealY + 6.8);

    ctx.fillStyle = '#22c55e';
    ctx.beginPath();
    ctx.arc(sealX + 11.5, sealY + 5.5, 1, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = '#f59e0b';
    ctx.beginPath();
    if (ctx.roundRect) {
      ctx.roundRect(sealX + 2.5, sealY - 4, 10, 5, 1.5);
    } else {
      ctx.rect(sealX + 2.5, sealY - 4, 10, 5);
    }
    ctx.fill();
    ctx.fillStyle = '#fef08a';
    ctx.fillRect(sealX + 4, sealY - 3, 2, 3);
    ctx.fillRect(sealX + 8, sealY - 3, 2, 3);

    ctx.fillStyle = '#475569';
    ctx.fillRect(sealX + 13, sealY - 1, 1.8, 8);
    ctx.fillStyle = '#1e293b';
    ctx.beginPath();
    ctx.arc(sealX + 13.9, sealY - 1.5, 1.8, 0, Math.PI * 2);
    ctx.fill();

    // E. Boiling Pearl Cooker Pot Base
    const potX = cx + 120;
    const potY = cy + 3;
    ctx.fillStyle = '#1e293b';
    ctx.beginPath();
    if (ctx.roundRect) {
      ctx.roundRect(potX - 1, potY + 14.5, 20, 3, 1);
    } else {
      ctx.rect(potX - 1, potY + 14.5, 20, 3);
    }
    ctx.fill();
    ctx.fillStyle = '#f97316';
    ctx.fillRect(potX + 2, potY + 15, 14, 1);

    ctx.fillStyle = '#334155';
    ctx.beginPath();
    if (ctx.roundRect) {
      ctx.roundRect(potX, potY, 18, 14.5, [1.5, 1.5, 2.5, 2.5]);
    } else {
      ctx.rect(potX, potY, 18, 14.5);
    }
    ctx.fill();
    ctx.fillStyle = '#1e293b';
    ctx.fillRect(potX + 1, potY + 2, 16, 12);

    ctx.strokeStyle = '#64748b';
    ctx.lineWidth = 1.2;
    ctx.beginPath();
    ctx.arc(potX, potY + 5, 2, Math.PI * 0.5, Math.PI * 1.5);
    ctx.arc(potX + 18, potY + 5, 2, Math.PI * 1.5, Math.PI * 0.5);
    ctx.stroke();

    ctx.fillStyle = '#78350f';
    ctx.fillRect(potX + 1.5, potY + 3, 15, 5);

    // Side Street Stool & Iced Tea Setup
    const stoolX = cx - 22;
    const stoolY = cy + 45;
    ctx.fillStyle = '#2980b9';
    ctx.fillRect(stoolX, stoolY, 14, 3);
    ctx.fillRect(stoolX + 1, stoolY + 3, 2, 10);
    ctx.fillRect(stoolX + 11, stoolY + 3, 2, 10);
    ctx.fillStyle = '#e67e22';
    ctx.fillRect(stoolX + 2, stoolY - 3, 5, 2);
    ctx.fillStyle = '#111';
    ctx.fillRect(stoolX + 3, stoolY - 4, 3, 1);
    ctx.fillStyle = 'rgba(255, 255, 255, 0.6)';
    ctx.fillRect(stoolX + 8, stoolY - 7, 4, 7);
    ctx.fillStyle = '#f1c40f';
    ctx.fillRect(stoolX + 9, stoolY - 5, 2, 4);
  },

  drawParkedVehicles(ctx, cx, cy) {
    const upgrades = (this.upgrades || (window.state && window.state.storeState && window.state.storeState.save && window.state.storeState.save.upgrades)) || {};
    let upMap = typeof upgrades === 'string' ? {} : upgrades;
    try {
      if (typeof upgrades === 'string') upMap = JSON.parse(upgrades);
    } catch (e) {}

    // 1. Xe Đạp Thồ Sen Tây Hồ (🚲 Gác cạnh quán)
    if (upMap.xe_dap_tho_sen) {
      const bx = cx - 36;
      const by = cy + 34;

      // Ground shadow
      ctx.fillStyle = 'rgba(0, 0, 0, 0.28)';
      ctx.beginPath();
      ctx.ellipse(bx + 11, by + 23, 16, 3, 0, 0, Math.PI * 2);
      ctx.fill();

      // Bicycle Wheels (Nan hoa căm xe sắc nét từng tia)
      const spokeCycle = (Math.floor(this.tick / 6) % 2);
      // Rear wheel
      ctx.fillStyle = '#18181B';
      ctx.beginPath();
      ctx.arc(bx + 2, by + 18, 6.5, 0, Math.PI * 2);
      ctx.arc(bx + 20, by + 18, 6.5, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#475569';
      ctx.beginPath();
      ctx.arc(bx + 2, by + 18, 5, 0, Math.PI * 2);
      ctx.arc(bx + 20, by + 18, 5, 0, Math.PI * 2);
      ctx.fill();
      // Silver spokes crosshairs
      ctx.strokeStyle = '#E2E8F0';
      ctx.lineWidth = 0.8;
      [bx + 2, bx + 20].forEach(wx => {
        ctx.beginPath();
        ctx.moveTo(wx - 4.5, by + 18); ctx.lineTo(wx + 4.5, by + 18);
        ctx.moveTo(wx, by + 13.5); ctx.lineTo(wx, by + 22.5);
        if (spokeCycle) {
          ctx.moveTo(wx - 3.5, by + 14.5); ctx.lineTo(wx + 3.5, by + 21.5);
          ctx.moveTo(wx + 3.5, by + 14.5); ctx.lineTo(wx - 3.5, by + 21.5);
        }
        ctx.stroke();
      });

      // Vintage Green Steel Frame (Khung xe Thống Nhất xanh rêu)
      ctx.strokeStyle = '#15803D';
      ctx.lineWidth = 1.4;
      ctx.beginPath();
      ctx.moveTo(bx + 2, by + 18);
      ctx.lineTo(bx + 10, by + 18); // bottom bracket
      ctx.lineTo(bx + 16, by + 11);
      ctx.lineTo(bx + 20, by + 18);
      ctx.moveTo(bx + 10, by + 18);
      ctx.lineTo(bx + 8, by + 8); // seat tube
      ctx.lineTo(bx + 2, by + 18);
      ctx.moveTo(bx + 8, by + 10);
      ctx.lineTo(bx + 16, by + 11); // top tube
      ctx.stroke();

      // Leather Saddle & Handlebar
      ctx.fillStyle = '#78350F';
      ctx.fillRect(bx + 6, by + 7, 6, 2); // saddle
      ctx.strokeStyle = '#94A3B8';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(bx + 16, by + 11);
      ctx.lineTo(bx + 16, by + 5);
      ctx.lineTo(bx + 18, by + 5);
      ctx.stroke();
      ctx.fillStyle = '#FACC15';
      ctx.fillRect(bx + 17, by + 4, 1.5, 1.5); // brass bell

      // Woven Bamboo Basket overflowing with pink Lotus Blossoms (Giỏ hoa sen Tây Hồ tươi thắm)
      ctx.fillStyle = '#D97706'; // Woven bamboo basket
      ctx.fillRect(bx - 3, by + 9, 8, 6);
      ctx.fillStyle = '#B45309';
      ctx.fillRect(bx - 2, by + 10, 6, 4);

      // Lotus blossoms (Búp sen bách diệp hé nở có giọt sương mai)
      ctx.fillStyle = '#15803D'; // Lotus leaves
      ctx.fillRect(bx - 4, by + 8, 3, 2);
      ctx.fillRect(bx + 3, by + 8, 3, 2);
      ctx.fillStyle = '#F472B6'; // Pink petals
      ctx.beginPath();
      ctx.arc(bx - 1, by + 7, 2.5, 0, Math.PI * 2);
      ctx.arc(bx + 2, by + 6, 3, 0, Math.PI * 2);
      ctx.arc(bx + 4, by + 8, 2, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#FDA4AF';
      ctx.fillRect(bx + 1, by + 5, 2, 2);
      ctx.fillStyle = '#FFFFFF'; // Morning dew drop
      ctx.fillRect(bx + 2, by + 5, 1, 1);
    }

    // 2. Xe Dream Chiến Tem Lửa (🏍️ Đỗ cạnh vỉa hè)
    if (upMap.xe_dream_chien && (!this.motorbikeShipper || !this.motorbikeShipper.active)) {
      const dx = cx - 22;
      const dy = cy + 48;

      // Ground shadow
      ctx.fillStyle = 'rgba(0, 0, 0, 0.4)';
      ctx.beginPath();
      ctx.ellipse(dx + 12, dy + 11, 16, 3.5, 0, 0, Math.PI * 2);
      ctx.fill();

      // Spoke Wheels with chrome hubs
      const dWheel = (wx) => {
        ctx.fillStyle = '#0F172A';
        ctx.beginPath();
        ctx.arc(wx, dy + 7, 5.5, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = '#334155';
        ctx.beginPath();
        ctx.arc(wx, dy + 7, 4.2, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = '#E2E8F0';
        ctx.lineWidth = 0.8;
        ctx.beginPath();
        ctx.moveTo(wx - 3.5, dy + 7); ctx.lineTo(wx + 3.5, dy + 7);
        ctx.moveTo(wx, dy + 3.5); ctx.lineTo(wx, dy + 10.5);
        ctx.stroke();
        ctx.fillStyle = '#E2E8F0';
        ctx.fillRect(wx - 1, dy + 6, 2, 2);
      };
      dWheel(dx + 1);
      dWheel(dx + 19);

      // Chrome Exhaust Pipe emitting gentle pixel smoke puffs
      ctx.fillStyle = '#E2E8F0';
      ctx.fillRect(dx + 5, dy + 8, 14, 2);
      ctx.fillStyle = '#94A3B8';
      ctx.fillRect(dx + 18, dy + 7, 2, 3); // tip
      // Smoke puffs
      const smokePuff = (Math.floor(this.tick / 12) % 3);
      ctx.fillStyle = 'rgba(226, 232, 240, 0.7)';
      if (smokePuff === 0) ctx.fillRect(dx + 21, dy + 6, 2, 2);
      else if (smokePuff === 1) ctx.fillRect(dx + 23, dy + 5, 2.5, 2.5);
      else ctx.fillRect(dx + 25, dy + 4, 3, 2);

      // Engine block & Gear pedal
      ctx.fillStyle = '#64748B';
      ctx.fillRect(dx + 6, dy + 4, 8, 5);
      ctx.fillStyle = '#CBD5E1';
      ctx.fillRect(dx + 7, dy + 5, 4, 3);
      ctx.fillStyle = '#F8FAFC';
      ctx.fillRect(dx + 8, dy + 5, 2, 1); // reflection

      // Legendary White Fairing (Yếm xe trắng)
      ctx.fillStyle = '#FFFFFF';
      ctx.fillRect(dx + 5, dy + 1, 4, 8);
      ctx.fillStyle = '#E2E8F0';
      ctx.fillRect(dx + 6, dy + 3, 2, 5);

      // Deep Maroon Body with 3-tier Fire Decal (Đỏ mận tem lửa)
      ctx.fillStyle = '#991B1B';
      ctx.fillRect(dx + 8, dy + 1, 12, 4);
      // Tem Lửa: Đỏ - Cam - Vàng mạ ánh kim
      ctx.fillStyle = '#EA580C';
      ctx.fillRect(dx + 9, dy + 2, 8, 1);
      ctx.fillStyle = '#FACC15';
      ctx.fillRect(dx + 10, dy + 3, 6, 1);
      ctx.fillStyle = '#FEF08A';
      ctx.fillRect(dx + 12, dy + 2, 1, 1); // "Dream II" gold badge

      // Black Leather Seat & Chrome Rear Handle
      ctx.fillStyle = '#1E293B';
      ctx.fillRect(dx + 8, dy - 1, 10, 3);
      ctx.fillStyle = '#E2E8F0';
      ctx.fillRect(dx + 17, dy, 3, 2);

      // HeeHee Express Boba Delivery Cargo Box
      ctx.fillStyle = '#FF5376';
      ctx.fillRect(dx + 16, dy - 6, 8, 7);
      ctx.fillStyle = '#FF7597';
      ctx.fillRect(dx + 17, dy - 5, 6, 5);
      ctx.fillStyle = '#FFFFFF';
      ctx.fillRect(dx + 18, dy - 4, 4, 2); // logo
      ctx.fillStyle = '#831843';
      ctx.fillRect(dx + 19, dy - 4, 2, 1);

      // Front Basket with 2 Sealed Boba Cups
      ctx.fillStyle = '#0F172A';
      ctx.fillRect(dx - 1, dy + 1, 5, 5);
      ctx.fillStyle = '#38BDF8';
      ctx.fillRect(dx + 0, dy + 0, 2, 3);
      ctx.fillStyle = '#F472B6';
      ctx.fillRect(dx + 2, dy + 0, 2, 3);

      // Headlight with warm glow & Chrome Mirrors
      ctx.fillStyle = '#FEF08A';
      ctx.fillRect(dx + 2, dy - 1, 3, 3);
      ctx.fillStyle = '#FFFFFF';
      ctx.fillRect(dx + 2, dy - 1, 1, 1);
      ctx.fillStyle = '#94A3B8';
      ctx.fillRect(dx + 4, dy - 4, 1, 3);
      ctx.fillStyle = '#38BDF8';
      ctx.fillRect(dx + 3, dy - 5, 2, 2);
    }

    // 3. Xe Bán Tải Pickup 4x4 Offroad (🛻 Chở hàng Mộc Châu đỗ cạnh quầy)
    if (upMap.xe_ban_tai_pickup || upMap.xe_ban_tai) {
      const px = cx + 144;
      const py = cy + 46;

      // Ground shadow
      ctx.fillStyle = 'rgba(0, 0, 0, 0.42)';
      ctx.beginPath();
      ctx.ellipse(px + 14, py + 15, 18, 4, 0, 0, Math.PI * 2);
      ctx.fill();

      // Heavy Offroad Mud-Terrain Tires with red suspension springs
      const pTire = (wx) => {
        ctx.fillStyle = '#EF4444'; // Red spring
        ctx.fillRect(wx - 1, py + 7, 2, 3);
        ctx.fillStyle = '#09090B'; // Mud tire
        ctx.beginPath();
        ctx.arc(wx, py + 11, 6.5, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = '#27272A';
        ctx.beginPath();
        ctx.arc(wx, py + 11, 4, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = '#71717A';
        ctx.fillRect(wx - 1, py + 10, 2, 2); // Hub
      };
      pTire(px + 5);
      pTire(px + 23);

      // Heavy Steel Chassis & Red Tow Winch
      ctx.fillStyle = '#18181B';
      ctx.fillRect(px - 1, py + 7, 30, 4);
      ctx.fillStyle = '#DC2626'; // Winch
      ctx.fillRect(px + 28, py + 8, 2, 2);

      // Desert Orange Body & High Cab
      ctx.fillStyle = '#C2410C';
      ctx.fillRect(px + 10, py - 2, 14, 9);
      ctx.fillStyle = '#FB923C'; // Roof highlight
      ctx.fillRect(px + 11, py - 3, 12, 1);
      // Tinted Windows
      ctx.fillStyle = '#0F172A';
      ctx.fillRect(px + 12, py - 1, 4, 4); // Rear side window
      ctx.fillRect(px + 18, py - 1, 5, 4); // Front side window
      ctx.fillStyle = '#38BDF8';
      ctx.fillRect(px + 19, py + 0, 1, 3); // Glare

      // Safari Snorkel Air Intake on A-Pillar
      ctx.fillStyle = '#18181B';
      ctx.fillRect(px + 23, py - 2, 1.5, 6);
      ctx.fillRect(px + 22, py - 4, 3, 2);

      // 4-Pod Roof LED Lights
      ctx.fillStyle = '#18181B';
      ctx.fillRect(px + 12, py - 4, 10, 1.5);
      for (let li = 0; li < 4; li++) {
        ctx.fillStyle = '#FEF08A';
        ctx.fillRect(px + 13 + li * 2.2, py - 5, 1.5, 1.5);
      }

      // Truck Bed loaded with Boba Supplies (Bao Trà Ô Long 25kg, Phuy Sữa Inox, Sọt Cam Sả)
      ctx.fillStyle = '#9A3412';
      ctx.fillRect(px - 1, py + 2, 12, 6);
      // Stainless Steel Milk Drum
      ctx.fillStyle = '#E2E8F0';
      ctx.fillRect(px + 0, py - 2, 4, 5);
      ctx.fillStyle = '#94A3B8';
      ctx.fillRect(px + 0, py - 1, 4, 1);
      ctx.fillStyle = '#FFFFFF';
      ctx.fillRect(px + 1, py - 2, 1, 4);
      // 25kg Mộc Châu Tea Sack with rope
      ctx.fillStyle = '#D97706';
      ctx.fillRect(px + 5, py - 2, 5, 5);
      ctx.fillStyle = '#15803D';
      ctx.fillRect(px + 6, py - 1, 3, 2); // Green tea emblem
      ctx.fillStyle = '#FEF08A';
      ctx.fillRect(px + 5, py + 1, 5, 0.8); // Rope tie
      // Fruit crate (Orange & Lemongrass)
      ctx.fillStyle = '#78350F';
      ctx.fillRect(px + 2, py + 1, 3, 3);
      ctx.fillStyle = '#F97316';
      ctx.fillRect(px + 3, py + 0.5, 1.5, 1.5);
    }
  },

  drawWheel(ctx, x, y) {
    const isCosmic = this.isCosmicCartSkin();
    if (isCosmic) {
      const pulse = (Math.sin(this.tick * 0.1) + 1) * 0.2 + 0.8;
      ctx.fillStyle = '#0f051d';
      ctx.beginPath();
      ctx.arc(x, y, 11, 0, Math.PI * 2);
      ctx.fill();

      // Cosmic Neon Purple Rim
      ctx.fillStyle = `rgba(168, 85, 247, ${pulse})`;
      ctx.beginPath();
      ctx.arc(x, y, 9, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = '#1e1035';
      ctx.beginPath();
      ctx.arc(x, y, 7, 0, Math.PI * 2);
      ctx.fill();

      // Cyan Stardust Center Cap
      ctx.fillStyle = '#38bdf8';
      ctx.beginPath();
      ctx.arc(x, y, 3.5, 0, Math.PI * 2);
      ctx.fill();

      // 4 Starlight Spokes
      ctx.strokeStyle = 'rgba(232, 121, 249, 0.85)';
      ctx.lineWidth = 1;
      const rot = (this.tick || 0) * 0.04;
      for (let s = 0; s < 4; s++) {
        const ang = rot + (s * Math.PI / 2);
        ctx.beginPath();
        ctx.moveTo(x, y);
        ctx.lineTo(x + Math.cos(ang) * 6.5, y + Math.sin(ang) * 6.5);
        ctx.stroke();
      }
      return;
    }

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
  },

  drawCollabStalls(ctx) {
    const slots = [
      { x: 205, y: 92 },
      { x: 375, y: 92 },
      { x: 545, y: 92 }
    ];

    for (let i = 0; i < 3; i++) {
      const partner = (this.activeCollabs && this.activeCollabs[i]) ? this.activeCollabs[i] : null;
      const slot = slots[i];
      if (partner) {
        this.drawPartnerCart(ctx, slot.x, slot.y, partner, i);
      } else {
        this.drawCollabPlaceholder(ctx, slot.x, slot.y, i);
      }
    }

    // Draw active animated customers visiting online partner stalls!
    this.drawCollabCustomers(ctx);
  },

  drawPartnerCart(ctx, cx, cy, partner, index) {
    // Unique aesthetic themes per collab slot
    const themes = [
      {
        // Slot 1: Bạc hà tươi mát (Mint & Cream)
        chassis: '#2e7d32',
        chassisBorder: '#1b5e20',
        rivet: '#f1c40f',
        awning1: '#00b894',
        awning2: '#f8f9fa',
        neonBorder: (p) => `rgba(85, 239, 196, ${p})`,
        neonGlow: 'rgba(85, 239, 196, 0.7)',
        neonText: '#55efc4',
        neonRivet: '#00cec9',
        shirt: '#ffffff',
        apron: '#00b894',
        hat: '#00cec9',
        hair: '#2d3436'
      },
      {
        // Slot 2: Khoai môn hoàng gia (Taro Purple & Cream)
        chassis: '#4a235a',
        chassisBorder: '#2c1038',
        rivet: '#dcdde1',
        awning1: '#6c5ce7',
        awning2: '#ffeaa7',
        neonBorder: (p) => `rgba(162, 155, 254, ${p})`,
        neonGlow: 'rgba(162, 155, 254, 0.7)',
        neonText: '#e056fd',
        neonRivet: '#a29bfe',
        shirt: '#2d3436',
        apron: '#6c5ce7',
        hat: '#2f3542',
        hair: '#e17055'
      },
      {
        // Slot 3: Trà đào cam sả (Peach & Sunset Orange)
        chassis: '#b9770e',
        chassisBorder: '#7e5109',
        rivet: '#f39c12',
        awning1: '#e17055',
        awning2: '#fdcb6e',
        neonBorder: (p) => `rgba(255, 184, 108, ${p})`,
        neonGlow: 'rgba(255, 184, 108, 0.7)',
        neonText: '#ffeaa7',
        neonRivet: '#e67e22',
        shirt: '#ffeaa7',
        apron: '#d35400',
        hat: '#e67e22',
        hair: '#2c3e50'
      }
    ];

    const theme = themes[index % themes.length];

    // 1. Cart Drop Shadow on street
    ctx.fillStyle = 'rgba(10, 5, 12, 0.55)';
    ctx.beginPath();
    ctx.ellipse(cx + 68, cy + 62, 70, 9, 0, 0, Math.PI * 2);
    ctx.fill();

    // 2. Heavy Duty Axle & Wheels
    ctx.fillStyle = '#2d3436';
    ctx.fillRect(cx + 22, cy + 53, 90, 3);
    this.drawWheel(ctx, cx + 24, cy + 54);
    this.drawWheel(ctx, cx + 112, cy + 54);

    // 3. Rear Support Pillars & Shelves
    ctx.fillStyle = '#3d3d4a';
    ctx.fillRect(cx + 8, cy - 35, 3, 53);
    ctx.fillRect(cx + 128, cy - 35, 3, 53);

    const shelfX = cx + 6, shelfY = cy - 24, shelfW = 126, shelfH = 40;
    ctx.fillStyle = '#1e0e06';
    ctx.beginPath();
    ctx.roundRect(shelfX, shelfY, shelfW, shelfH, 2);
    ctx.fill();
    ctx.fillStyle = '#5c2d13';
    ctx.fillRect(shelfX + 4, cy - 12, shelfW - 8, 3);
    ctx.fillRect(shelfX + 4, cy + 4, shelfW - 8, 3);

    const syrups = ['#e74c3c', '#f39c12', '#2ecc71', '#9b59b6'];
    syrups.forEach((col, sIdx) => {
      ctx.fillStyle = col;
      ctx.fillRect(shelfX + 8 + sIdx * 9, cy - 10, 6, 8);
      ctx.fillStyle = '#f5cd79';
      ctx.fillRect(shelfX + 9 + sIdx * 9, cy - 13, 4, 3);
    });

    // 4. Partner Barista Sprite inside stall
    const bob = Math.round(Math.sin(this.tick * 0.12 + index * 2) * 1.5);
    const bx = cx + 64;
    const by = cy - 6 + bob;

    // Body & Apron
    ctx.fillStyle = theme.shirt;
    ctx.fillRect(bx - 8, by + 12, 16, 15);
    ctx.fillStyle = theme.apron;
    ctx.fillRect(bx - 6, by + 16, 12, 13);
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(bx - 3, by + 12, 6, 3); // collar

    // Head, Hair & Smiling Face
    ctx.fillStyle = '#ffeaa7';
    ctx.fillRect(bx - 6, by + 2, 12, 10);
    ctx.fillStyle = theme.hair;
    ctx.fillRect(bx - 7, by, 14, 4);
    ctx.fillRect(bx - 8, by + 3, 2, 5);
    ctx.fillRect(bx + 6, by + 3, 2, 5);
    // Eyes & Blush
    ctx.fillStyle = '#2d3436';
    ctx.fillRect(bx - 4, by + 5, 2, 2);
    ctx.fillRect(bx + 2, by + 5, 2, 2);
    ctx.fillStyle = '#ff7675';
    ctx.fillRect(bx - 5, by + 8, 2, 1.5);
    ctx.fillRect(bx + 3, by + 8, 2, 1.5);
    // Beret Hat
    ctx.fillStyle = theme.hat;
    ctx.beginPath();
    ctx.ellipse(bx, by - 1, 9, 4, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillRect(bx - 1, by - 4, 2, 3);

    // Shaker action
    const armShake = Math.sin(this.tick * 0.25 + index) * 2;
    ctx.fillStyle = '#bdc3c7';
    ctx.fillRect(bx + 6, by + 15 + armShake, 5, 9);
    ctx.fillStyle = '#7f8c8d';
    ctx.fillRect(bx + 7, by + 13 + armShake, 3, 2);

    // 5. Wooden Chassis Front Panel
    ctx.fillStyle = theme.chassisBorder;
    ctx.fillRect(cx, cy + 22, 138, 26);
    ctx.fillStyle = theme.chassis;
    ctx.fillRect(cx + 3, cy + 24, 132, 22);

    // Brass corner rivets
    ctx.fillStyle = theme.rivet;
    ctx.fillRect(cx, cy + 22, 5, 5);
    ctx.fillRect(cx + 133, cy + 22, 5, 5);
    ctx.fillRect(cx, cy + 43, 5, 5);
    ctx.fillRect(cx + 133, cy + 43, 5, 5);

    // 6. Glass Topping / Pastry Showcase
    const glassX = cx + 36, glassY = cy + 25, glassW = 66, glassH = 19;
    ctx.fillStyle = '#1c0f08';
    ctx.beginPath();
    ctx.roundRect(glassX, glassY, glassW, glassH, 2);
    ctx.fill();
    ctx.fillStyle = 'rgba(255, 220, 130, 0.18)';
    ctx.fillRect(glassX + 2, glassY + 2, glassW - 4, glassH - 4);
    // Tarts & pudding inside showcase
    for (let t = 0; t < 3; t++) {
      ctx.fillStyle = '#e67e22';
      ctx.fillRect(glassX + 6 + t * 9, glassY + 11, 7, 4);
      ctx.fillStyle = '#f1c40f';
      ctx.fillRect(glassX + 7 + t * 9, glassY + 9, 5, 3);
    }
    ctx.fillStyle = 'rgba(255,255,255,0.7)';
    ctx.fillRect(glassX + 42, glassY + 7, 7, 9);
    ctx.fillStyle = '#873600';
    ctx.fillRect(glassX + 43, glassY + 9, 5, 6);
    // Glass sheen
    ctx.strokeStyle = 'rgba(255,255,255,0.3)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(glassX + 4, glassY + glassH - 2);
    ctx.lineTo(glassX + 15, glassY + 2);
    ctx.stroke();

    // 7. Polished Carrara Marble Countertop
    ctx.fillStyle = '#eddcd2';
    ctx.beginPath();
    ctx.roundRect(cx - 5, cy + 17, 148, 6, 2);
    ctx.fill();
    ctx.fillStyle = '#d6c2b4';
    ctx.fillRect(cx - 5, cy + 21, 148, 2);
    ctx.fillStyle = 'rgba(255, 255, 255, 0.7)';
    ctx.fillRect(cx - 4, cy + 18, 146, 1);

    // 8. Front Awning Support Pillars
    ctx.fillStyle = '#c5c5d2';
    ctx.fillRect(cx + 4, cy - 35, 4, 53);
    ctx.fillRect(cx + 130, cy - 35, 4, 53);

    // 9. Fabric Striped Awning Roof
    const awningY = cy - 42;
    const sw = 16;
    const stripes = 9;
    for (let s = 0; s < stripes; s++) {
      ctx.fillStyle = (s % 2 === 0) ? theme.awning1 : theme.awning2;
      const sx = cx - 6 + s * sw;
      ctx.fillRect(sx, awningY, sw, 15);
      ctx.beginPath();
      ctx.arc(sx + sw / 2, awningY + 15, sw / 2, 0, Math.PI);
      ctx.fill();
    }
    ctx.fillStyle = 'rgba(0, 0, 0, 0.2)';
    ctx.fillRect(cx - 6, awningY + 15, sw * stripes, 3);

    // Cute animal resting on roof
    const catX = cx + 80, catY = awningY - 4;
    const catBreathe = Math.sin(this.tick * 0.08 + index) * 1;
    ctx.fillStyle = (index === 0) ? '#a4b0be' : (index === 1) ? '#ff7675' : '#74b9ff';
    ctx.beginPath();
    ctx.ellipse(catX, catY + catBreathe, 6, 3.5, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.arc(catX - 5, catY - 1 + catBreathe, 3, 0, Math.PI * 2);
    ctx.fill();

    // 10. Neon Sign Plaque with Partner's Custom Store Name (Marquee Banner)
    const isOnline = !!(partner.is_online || partner.online);
    const plaqueX = cx + 15, plaqueY = cy + 27, plaqueW = 108, plaqueH = 17;
    ctx.fillStyle = '#1e0c18';
    ctx.beginPath();
    if (ctx.roundRect) {
      ctx.roundRect(plaqueX, plaqueY, plaqueW, plaqueH, 3.5);
    } else {
      ctx.rect(plaqueX, plaqueY, plaqueW, plaqueH);
    }
    ctx.fill();

    const neonPulse = (Math.sin(this.tick * 0.1 + index * 1.5) + 1) * 0.15 + 0.85;
    ctx.strokeStyle = theme.neonBorder(neonPulse);
    ctx.lineWidth = 1.5;
    ctx.stroke();

    ctx.fillStyle = theme.neonRivet;
    ctx.fillRect(plaqueX + 2, plaqueY + 2, 2, 2);
    ctx.fillRect(plaqueX + plaqueW - 4, plaqueY + 2, 2, 2);
    ctx.fillRect(plaqueX + 2, plaqueY + plaqueH - 4, 2, 2);
    ctx.fillRect(plaqueX + plaqueW - 4, plaqueY + plaqueH - 4, 2, 2);

    const partnerStoreName = (partner.partner_name || partner.store_name || `QUÁN #${index + 1}`).trim().toUpperCase();
    const partnerBanner = `🧋 ${partnerStoreName}   ★   CHÀO MỪNG BẠN   ★   `;

    const pInnerX = plaqueX + 4;
    const pInnerY = plaqueY + 2;
    const pInnerW = plaqueW - 8;
    const pInnerH = plaqueH - 4;
    const pCenterY = plaqueY + plaqueH / 2 + 0.5;

    ctx.save();
    ctx.beginPath();
    if (ctx.roundRect) {
      ctx.roundRect(pInnerX, pInnerY, pInnerW, pInnerH, 2);
    } else {
      ctx.rect(pInnerX, pInnerY, pInnerW, pInnerH);
    }
    ctx.clip();

    ctx.font = 'bold 8.5px "Segoe UI", Arial, sans-serif';
    ctx.textAlign = 'left';
    ctx.textBaseline = 'middle';

    const pSegWidth = Math.max(20, ctx.measureText(partnerBanner).width);
    const pOffset = (this.tick * 0.65 + index * 35) % pSegWidth;

    ctx.shadowColor = theme.neonGlow;
    ctx.shadowBlur = 4 * neonPulse;
    ctx.fillStyle = theme.neonText;

    let pDrawX = pInnerX - pOffset;
    while (pDrawX < pInnerX + pInnerW + pSegWidth) {
      ctx.fillText(partnerBanner, pDrawX, pCenterY);
      pDrawX += pSegWidth;
    }
    ctx.restore();

    // Online / Offline Status Pill Badge on stall roof
    const badgeX = cx + 4;
    const badgeY = awningY - 8;
    ctx.save();
    ctx.fillStyle = isOnline ? 'rgba(10, 35, 20, 0.92)' : 'rgba(30, 30, 35, 0.85)';
    ctx.beginPath();
    ctx.roundRect(badgeX, badgeY, 40, 9, 3);
    ctx.fill();
    ctx.strokeStyle = isOnline ? '#2ecc71' : '#7f8c8d';
    ctx.lineWidth = 1;
    ctx.stroke();

    // Dot indicator
    ctx.fillStyle = isOnline ? (this.tick % 30 < 15 ? '#2ecc71' : '#55efc4') : '#95a5a6';
    ctx.beginPath();
    ctx.arc(badgeX + 6, badgeY + 4.5, 2.2, 0, Math.PI * 2);
    ctx.fill();

    // Label
    ctx.fillStyle = isOnline ? '#a8ff78' : '#bdc3c7';
    ctx.font = 'bold 5.5px sans-serif';
    ctx.textAlign = 'left';
    ctx.textBaseline = 'middle';
    ctx.fillText(isOnline ? 'ONLINE' : 'OFFLINE', badgeX + 11, badgeY + 4.5);
    ctx.restore();

    // 11. Equipment on Counter
    // Tea Urn
    ctx.fillStyle = '#bdc3c7';
    ctx.beginPath();
    ctx.roundRect(cx + 8, cy + 2, 14, 16, 2);
    ctx.fill();
    ctx.fillStyle = '#7f8c8d';
    ctx.fillRect(cx + 9, cy + 1, 12, 3);
    ctx.fillStyle = '#e74c3c';
    ctx.fillRect(cx + 12, cy + 12, 4, 3); // tap

    // Sealer Machine with LED
    const sX = cx + 115;
    ctx.fillStyle = '#2c3e50';
    ctx.beginPath();
    ctx.roundRect(sX, cy + 3, 14, 15, 2);
    ctx.fill();
    ctx.fillStyle = '#2ecc71'; // Green status LED
    ctx.fillRect(sX + 3, cy + 6, 2, 2);

    // Drink cup
    ctx.fillStyle = 'rgba(255,255,255,0.7)';
    ctx.fillRect(cx + 28, cy + 8, 6, 9);
    ctx.fillStyle = theme.awning1;
    ctx.fillRect(cx + 29, cy + 10, 4, 6);

    // 12. Collab Badge Sign hanging on stall
    ctx.fillStyle = '#341f11';
    ctx.beginPath();
    ctx.roundRect(cx - 3, cy + 28, 16, 9, 2);
    ctx.fill();
    ctx.strokeStyle = '#f1c40f';
    ctx.lineWidth = 1;
    ctx.strokeRect(cx - 3, cy + 28, 16, 9);
    ctx.fillStyle = '#50fa7b';
    ctx.font = 'bold 5.5px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('+10%', cx + 5, cy + 34.5);
    ctx.textAlign = 'left';

    // 13. Customer enjoying drink beside partner stall (only shown when offline to keep stall lively without AI queue)
    if (!isOnline) {
      const kx = cx + 148, ky = cy + 18;
      ctx.fillStyle = '#2d3436';
      ctx.fillRect(kx + 2, ky + 14, 3, 10);
      ctx.fillRect(kx + 7, ky + 14, 3, 10);
      ctx.fillStyle = (index % 2 === 0) ? '#e17055' : '#0984e3';
      ctx.fillRect(kx, ky + 4, 12, 11);
      ctx.fillStyle = '#ffeaa7';
      ctx.fillRect(kx + 2, ky - 6, 8, 9);
      ctx.fillStyle = '#2d3436';
      ctx.fillRect(kx + 1, ky - 7, 10, 4);
      // Boba cup in hand
      ctx.fillStyle = 'rgba(255,255,255,0.85)';
      ctx.fillRect(kx - 3, ky + 6, 4, 6);
      ctx.fillStyle = '#873600';
      ctx.fillRect(kx - 2, ky + 7, 2, 4);

      // Periodic floating heart
      if ((this.tick + index * 40) % 120 < 40) {
        const heartY = ky - 8 - ((this.tick % 40) * 0.25);
        ctx.fillStyle = '#ff4757';
        ctx.font = '8px sans-serif';
        ctx.fillText('❤️', kx + 1, heartY);
      }
    }
  },

  drawCollabPlaceholder(ctx, cx, cy, index) {
    if (index === 0) {
      // Slot 1 (cx = 205): Bồn hoa cẩm tú cầu vỉa hè & Ghế đá sinh viên
      const gx = cx + 20, gy = cy + 32;
      ctx.fillStyle = 'rgba(10, 5, 12, 0.4)';
      ctx.fillRect(gx - 4, gy + 18, 56, 4);
      ctx.fillStyle = '#b2bec3';
      ctx.fillRect(gx, gy + 8, 48, 6);
      ctx.fillStyle = '#dfe6e9';
      ctx.fillRect(gx, gy + 7, 48, 2);
      ctx.fillStyle = '#636e72';
      ctx.fillRect(gx + 6, gy + 14, 6, 6);
      ctx.fillRect(gx + 36, gy + 14, 6, 6);
      ctx.fillRect(gx, gy - 6, 48, 5);
      ctx.fillRect(gx + 6, gy - 1, 4, 9);
      ctx.fillRect(gx + 38, gy - 1, 4, 9);

      // Student backpack on park bench
      ctx.fillStyle = '#0984e3';
      ctx.fillRect(gx + 26, gy + 3, 10, 6);
      ctx.fillStyle = '#e74c3c';
      ctx.fillRect(gx + 28, gy + 5, 6, 2);

      // Terrazzo Planter with hydrangea flowers
      const bx = cx + 80, by = cy + 30;
      ctx.fillStyle = '#2d3436';
      ctx.beginPath();
      ctx.roundRect(bx, by + 6, 44, 14, 3);
      ctx.fill();
      ctx.fillStyle = '#636e72';
      ctx.fillRect(bx + 2, by + 8, 40, 3);
      ctx.fillStyle = '#27ae60';
      ctx.beginPath();
      ctx.arc(bx + 12, by + 4, 10, 0, Math.PI * 2);
      ctx.arc(bx + 24, by + 2, 12, 0, Math.PI * 2);
      ctx.arc(bx + 34, by + 5, 9, 0, Math.PI * 2);
      ctx.fill();
      const hydras = [
        { x: bx + 10, y: by + 2, c: '#e056fd' },
        { x: bx + 22, y: by - 1, c: '#ff7675' },
        { x: bx + 32, y: by + 3, c: '#686de0' }
      ];
      hydras.forEach(h => {
        ctx.fillStyle = h.c;
        ctx.beginPath();
        ctx.arc(h.x, h.y, 4, 0, Math.PI * 2);
        ctx.fill();
      });
    } else if (index === 1) {
      // Slot 2 (cx = 375): Bồn hoa hướng dương & Biển chỉ dẫn "Chờ Liên Minh"
      const bx = cx + 25, by = cy + 28;
      ctx.fillStyle = '#57606f';
      ctx.beginPath();
      ctx.roundRect(bx, by + 8, 55, 14, 3);
      ctx.fill();
      ctx.fillStyle = '#2ed573';
      ctx.beginPath();
      ctx.arc(bx + 16, by + 6, 11, 0, Math.PI * 2);
      ctx.arc(bx + 38, by + 5, 12, 0, Math.PI * 2);
      ctx.fill();
      for (let fi = 0; fi < 3; fi++) {
        const fx = bx + 14 + fi * 14, fy = by + 3 + (fi % 2) * 2;
        ctx.fillStyle = '#ffa502';
        ctx.beginPath();
        ctx.arc(fx, fy, 4, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = '#592c08';
        ctx.beginPath();
        ctx.arc(fx, fy, 2, 0, Math.PI * 2);
        ctx.fill();
      }

      // Wooden Signboard "🤝 Chờ Collab +10%"
      const sx = cx + 90, sy = cy + 22;
      ctx.fillStyle = '#5d4037';
      ctx.fillRect(sx + 18, sy + 14, 3, 14);
      ctx.fillStyle = '#8d6e63';
      ctx.beginPath();
      ctx.roundRect(sx, sy, 40, 15, 2);
      ctx.fill();
      ctx.strokeStyle = '#fbc531';
      ctx.lineWidth = 1;
      ctx.strokeRect(sx, sy, 40, 15);
      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 6.5px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('🤝 COLLAB', sx + 20, sy + 6.5);
      ctx.fillStyle = '#50fa7b';
      ctx.fillText('+10% DT', sx + 20, sy + 12.5);
      ctx.textAlign = 'left';
    } else {
      // Slot 3 (cx = 545): Cây bàng chậu đá mài & thùng thư retro
      const tx = cx + 35, ty = cy + 18;
      ctx.fillStyle = '#747d8c';
      ctx.beginPath();
      ctx.roundRect(tx + 4, ty + 20, 26, 14, 2);
      ctx.fill();
      ctx.fillStyle = '#4b382a';
      ctx.fillRect(tx + 15, ty + 6, 4, 15);
      ctx.fillStyle = '#1e824c';
      ctx.beginPath();
      ctx.arc(tx + 17, ty + 3, 15, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#26a65b';
      ctx.beginPath();
      ctx.arc(tx + 14, ty - 2, 10, 0, Math.PI * 2);
      ctx.fill();

      // Retro Red Mailbox
      const mx = cx + 80, my = cy + 24;
      ctx.fillStyle = '#2f3542';
      ctx.fillRect(mx + 6, my + 14, 3, 12);
      ctx.fillStyle = '#e74c3c';
      ctx.beginPath();
      ctx.roundRect(mx, my, 15, 14, 3);
      ctx.fill();
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(mx + 3, my + 4, 9, 2);
    }
  },

  drawCollabCustomers(ctx) {
    if (!this.collabCustomerStates) return;
    const slots = [
      { x: 205, y: 92 },
      { x: 375, y: 92 },
      { x: 545, y: 92 }
    ];

    for (let i = 0; i < 3; i++) {
      const partner = (this.activeCollabs && this.activeCollabs[i]) ? this.activeCollabs[i] : null;
      const isOnline = !!(partner && (partner.is_online || partner.online));
      if (!partner || !isOnline) continue;

      const cState = this.collabCustomerStates[i];
      if (!cState || cState.state === 'idle') continue;

      const custX = Math.round(cState.x);
      const custY = 108; // ground level

      // Draw the pixel art customer sprite
      this.drawCustomer(ctx, custX, custY, cState.type, false, '', '');

      // If customer received their drink, render cup in hand + floating heart
      if (cState.hasDrink) {
        ctx.fillStyle = 'rgba(255,255,255,0.9)';
        ctx.fillRect(custX + 10, custY - 8, 4, 6);
        ctx.fillStyle = '#b71540';
        ctx.fillRect(custX + 11, custY - 7, 2, 4);

        const heartBob = Math.sin((this.tick + i * 30) * 0.2) * 2;
        ctx.fillStyle = '#ff4757';
        ctx.font = '8px sans-serif';
        ctx.fillText('❤️', custX + 3, custY - 26 + heartBob);
      }

      // If ordering, render customer comic dialogue bubble
      if (cState.state === 'ordering' && cState.quote) {
        ctx.save();
        const bubbleBob = Math.sin((this.tick + i * 20) * 0.15) * 1.5;
        const bText = cState.quote;
        ctx.font = 'bold 7px sans-serif';
        const tw = ctx.measureText(bText).width;
        const bw = tw + 10;
        const bh = 14;
        const bx = Math.min(this.width - bw - 2, Math.max(2, custX + 5 - bw / 2));
        const by = 86 + bubbleBob;

        // Shadow & Bubble body
        ctx.fillStyle = 'rgba(0, 0, 0, 0.45)';
        ctx.fillRect(bx + 1, by + 1, bw, bh);
        ctx.fillStyle = 'rgba(20, 16, 28, 0.95)';
        ctx.fillRect(bx, by, bw, bh);
        ctx.strokeStyle = '#55efc4';
        ctx.lineWidth = 1;
        ctx.strokeRect(bx, by, bw, bh);

        // Downward tail
        ctx.fillStyle = 'rgba(20, 16, 28, 0.95)';
        ctx.beginPath();
        ctx.moveTo(custX + 5, by + bh);
        ctx.lineTo(custX + 8, by + bh);
        ctx.lineTo(custX + 6, by + bh + 3);
        ctx.fill();

        // Text inside bubble
        ctx.fillStyle = '#ffffff';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(bText, bx + bw / 2, by + bh / 2);
        ctx.restore();
      }
    }
  }
};

