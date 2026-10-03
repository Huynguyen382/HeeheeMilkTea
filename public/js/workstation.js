// First-Person Barista Workstation (Bàn Pha Chế Góc Nhìn Thứ Nhất)
// Renders the interactive central milk tea cup, real-time liquid physics,
// ice cubes, toppings, gauges, and animated first-person barista hands.

class BaristaWorkstation {
  constructor(canvasId, onChange) {
    this.canvas = document.getElementById(canvasId);
    if (!this.canvas) return;
    this.ctx = this.canvas.getContext('2d');
    this.onChange = onChange || (() => {});

    // State
    this.tea = 'den';
    this.sugar = '50%';
    this.ice = 'Vừa đá';
    this.toppings = [];
    this.isShaken = false;

    // Dimensions
    this.width = 440;
    this.height = 270;
    this.dpr = window.devicePixelRatio || 1;
    this.setupCanvas();

    // Animation & Physics
    this.tick = 0;
    this.liquidFill = 0.72; // Current fill animation target
    this.currentFill = 0.72;
    this.steamParticles = [];
    this.frostParticles = [];
    this.iceCubes = [];
    this.bobaPearls = [];
    this.floatingTexts = [];

    // Hand Animation State
    // action: null | 'pour_tea' | 'add_sugar' | 'add_ice' | 'add_topping' | 'shake' | 'serve'
    this.handAction = null;
    this.handProgress = 0; // 0 to 1
    this.handTarget = null;

    this.initCupContents();
    this.startLoop();

    window.addEventListener('resize', () => this.setupCanvas());
  }

  setupCanvas() {
    if (!this.canvas) return;
    const rect = this.canvas.getBoundingClientRect();
    const cssWidth = rect.width || 440;
    const cssHeight = rect.height || 270;
    this.width = cssWidth;
    this.height = cssHeight;

    this.canvas.width = Math.floor(cssWidth * this.dpr);
    this.canvas.height = Math.floor(cssHeight * this.dpr);
    this.ctx.setTransform(this.dpr, 0, 0, this.dpr, 0, 0);
  }

  // Sugar progression: 0% -> 30% -> 50% -> 70% -> 100% -> 0%
  static SUGAR_STEPS = ['0%', '30%', '50%', '70%', '100%'];
  // Ice progression: Nóng -> Ít đá -> Vừa đá -> Đầy đá -> Nóng
  static ICE_STEPS = ['Nóng', 'Ít đá', 'Vừa đá', 'Đầy đá'];

  // Colors for each tea type
  static TEA_COLORS = {
    den: { base: '#7c3f1d', mid: '#b25d2b', light: '#e59858', cream: '#fce3be', name: 'Trà Đen Đậm' },
    thai_xanh: { base: '#1e6840', mid: '#2fa364', light: '#67cfa2', cream: '#d4f7e5', name: 'Thái Xanh' },
    sua_tuoi: { base: '#d8c2aa', mid: '#f3e5d3', light: '#fffaf0', cream: '#ffffff', name: 'Sữa Tươi' },
    lai: { base: '#b06518', mid: '#e09838', light: '#f7c86a', cream: '#fff2d1', name: 'Lục Trà Lài' },
    olong_nuong: { base: '#553422', mid: '#824f33', light: '#ba7b53', cream: '#eed0b7', name: 'Ô Long Nướng' }
  };

  setState(tea, sugar, ice, toppings, isShaken = false) {
    this.tea = tea || 'den';
    this.sugar = sugar || '50%';
    this.ice = ice || 'Vừa đá';
    this.toppings = Array.isArray(toppings) ? [...toppings] : [];
    this.isShaken = isShaken;
    this.initCupContents();
  }

  initCupContents() {
    // Generate ice cubes based on ice level
    this.iceCubes = [];
    let count = 0;
    if (this.ice === 'Ít đá') count = 2;
    else if (this.ice === 'Vừa đá') count = 4;
    else if (this.ice === 'Đầy đá') count = 6;

    for (let i = 0; i < count; i++) {
      this.iceCubes.push({
        x: (Math.random() - 0.5) * 38,
        y: -10 - Math.random() * 25 - i * 8,
        rot: (Math.random() - 0.5) * 0.8,
        w: 14 + Math.random() * 4,
        h: 12 + Math.random() * 4,
        bobSpeed: 0.03 + Math.random() * 0.02,
        bobOffset: Math.random() * Math.PI * 2
      });
    }

    // Generate toppings at bottom
    this.bobaPearls = [];
    const pearlCount = this.toppings.length * 9;
    for (let i = 0; i < pearlCount; i++) {
      this.bobaPearls.push({
        x: (Math.random() - 0.5) * 44,
        y: 60 - Math.random() * 18 - (i % 3) * 6,
        r: 4.2 + Math.random() * 1.5,
        type: this.toppings[Math.floor(i / 9)] || 'tranchau_den',
        bobOffset: Math.random() * Math.PI * 2
      });
    }
  }

  // --- INTERACTION METHODS ---
  setTea(teaKey) {
    if (this.tea === teaKey) return;
    this.tea = teaKey;
    this.triggerHandAction('pour_tea', teaKey);
    this.addFloatingText(`🍵 ${BaristaWorkstation.TEA_COLORS[teaKey]?.name || 'Cốt Trà'}`);
    this.onChange({ tea: this.tea, sugar: this.sugar, ice: this.ice, toppings: this.toppings });
  }

  nextSugarStep() {
    const idx = BaristaWorkstation.SUGAR_STEPS.indexOf(this.sugar);
    const nextIdx = (idx + 1) % BaristaWorkstation.SUGAR_STEPS.length;
    this.sugar = BaristaWorkstation.SUGAR_STEPS[nextIdx];
    this.triggerHandAction('add_sugar', this.sugar);
    this.addFloatingText(`🍯 ${this.sugar} Đường`, '#f4c430');
    this.onChange({ tea: this.tea, sugar: this.sugar, ice: this.ice, toppings: this.toppings });
    return this.sugar;
  }

  setSugar(val) {
    this.sugar = val;
    this.triggerHandAction('add_sugar', this.sugar);
    this.addFloatingText(`🍯 ${this.sugar} Đường`, '#f4c430');
    this.onChange({ tea: this.tea, sugar: this.sugar, ice: this.ice, toppings: this.toppings });
  }

  nextIceStep() {
    const idx = BaristaWorkstation.ICE_STEPS.indexOf(this.ice);
    const nextIdx = (idx + 1) % BaristaWorkstation.ICE_STEPS.length;
    this.ice = BaristaWorkstation.ICE_STEPS[nextIdx];
    this.triggerHandAction('add_ice', this.ice);
    this.initCupContents();
    this.addFloatingText(`🧊 ${this.ice}`, '#8be9fd');
    this.onChange({ tea: this.tea, sugar: this.sugar, ice: this.ice, toppings: this.toppings });
    return this.ice;
  }

  setIce(val) {
    this.ice = val;
    this.triggerHandAction('add_ice', this.ice);
    this.initCupContents();
    this.addFloatingText(`🧊 ${this.ice}`, '#8be9fd');
    this.onChange({ tea: this.tea, sugar: this.sugar, ice: this.ice, toppings: this.toppings });
  }

  toggleTopping(toppingKey) {
    if (this.toppings.includes(toppingKey)) {
      this.toppings = this.toppings.filter(t => t !== toppingKey);
      this.addFloatingText(`Bỏ ${this.getToppingName(toppingKey)}`, '#a3899a');
    } else {
      this.toppings.push(toppingKey);
      this.triggerHandAction('add_topping', toppingKey);
      this.addFloatingText(`+ ${this.getToppingName(toppingKey)}!`, '#ff79c6');
    }
    this.initCupContents();
    this.onChange({ tea: this.tea, sugar: this.sugar, ice: this.ice, toppings: this.toppings });
    return this.toppings.includes(toppingKey);
  }

  getToppingName(key) {
    const map = {
      tranchau_den: 'Trân Châu Đen',
      thach_la_dua: 'Thạch Lá Dứa',
      tranchau_duongden: 'Đường Đen',
      dao_mieng: 'Đào Miếng',
      suong_sao: 'Sương Sáo'
    };
    return map[key] || 'Topping';
  }

  resetCup() {
    this.tea = 'den';
    this.sugar = '0%';
    this.ice = 'Nóng';
    this.toppings = [];
    this.isShaken = false;
    this.initCupContents();
    this.addFloatingText('🔄 Đã làm lại ly mới!', '#ffffff');
    this.onChange({ tea: this.tea, sugar: this.sugar, ice: this.ice, toppings: this.toppings });
  }

  triggerHandAction(action, data = null) {
    this.handAction = action;
    this.handProgress = 0;
    this.handTarget = data;
  }

  addFloatingText(text, color = '#f4c430') {
    this.floatingTexts.push({
      text,
      color,
      x: this.width * 0.5,
      y: this.height * 0.45,
      vy: -1.2,
      opacity: 1.0,
      scale: 1.2
    });
  }

  // --- RENDER LOOP ---
  startLoop() {
    const frame = () => {
      this.update();
      this.render();
      requestAnimationFrame(frame);
    };
    requestAnimationFrame(frame);
  }

  update() {
    this.tick++;

    // Update hand progress
    if (this.handAction) {
      // Shake lasts longer (~60 frames) so player can experience the full satisfying shaking action
      const step = this.handAction === 'shake' ? 0.016 : 0.045;
      this.handProgress += step;
      if (this.handProgress >= 1.0) {
        this.handAction = null;
        this.handProgress = 0;
      }
    }

    // Steam particles for hot drink
    if (this.ice === 'Nóng' && Math.random() < 0.28) {
      const cx = this.width * 0.5;
      const cy = this.height * 0.44;
      this.steamParticles.push({
        x: cx + (Math.random() - 0.5) * 30,
        y: cy,
        vx: (Math.random() - 0.5) * 0.3,
        vy: -0.6 - Math.random() * 0.5,
        alpha: 0.55,
        r: 3 + Math.random() * 3
      });
    }

    this.steamParticles.forEach(p => {
      p.x += p.vx + Math.sin(this.tick * 0.08 + p.x) * 0.2;
      p.y += p.vy;
      p.alpha -= 0.012;
      p.r += 0.1;
    });
    this.steamParticles = this.steamParticles.filter(p => p.alpha > 0);

    // Frost mist particles during shaking
    if (this.handAction === 'shake') {
      const cx = this.width * 0.5;
      const cy = this.height * 0.48;
      for (let i = 0; i < 2; i++) {
        this.frostParticles.push({
          x: cx + (Math.random() - 0.5) * 50,
          y: cy + (Math.random() - 0.5) * 70,
          vx: (Math.random() - 0.5) * 4,
          vy: -1 - Math.random() * 3,
          alpha: 0.85,
          r: 2.2 + Math.random() * 3.5
        });
      }
    }

    this.frostParticles.forEach(p => {
      p.x += p.vx;
      p.y += p.vy;
      p.alpha -= 0.035;
      p.r += 0.08;
    });
    this.frostParticles = this.frostParticles.filter(p => p.alpha > 0);

    // Floating text update
    this.floatingTexts.forEach(t => {
      t.y += t.vy;
      t.opacity -= 0.022;
      t.scale = Math.max(1.0, t.scale - 0.01);
    });
    this.floatingTexts = this.floatingTexts.filter(t => t.opacity > 0);
  }

  render() {
    const ctx = this.ctx;
    if (!ctx) return;

    ctx.clearRect(0, 0, this.width, this.height);

    // 1. Draw Countertop Background (Góc nhìn thứ nhất: quầy pha chế vân gỗ ấm & viền kim loại)
    this.drawCountertop(ctx);

    // 2. Draw Left & Right Ambient Shelves / Stations
    this.drawSideStations(ctx);

    // 3. Draw Side Meters (Độ Ngọt & Độ Lạnh)
    this.drawSweetnessMeter(ctx);
    this.drawIceMeter(ctx);

    // 4. Draw Central Mixing Bomb (Quả Bom Pha Chế Trung Tâm)
    this.drawMixingBomb(ctx);

    // 5. Draw Floating Status & Notifications
    this.drawFloatingTexts(ctx);

    // 6. Draw First-Person Barista Animated Arm & Hand
    if (this.handAction === 'shake') {
      this.drawTwoHandedShake(ctx);
    } else if (this.handAction) {
      this.drawBaristaHand(ctx);
    }
  }

  drawCountertop(ctx) {
    const w = this.width;
    const h = this.height;

    // Rich cafe wall gradient
    const wallGrad = ctx.createLinearGradient(0, 0, 0, h * 0.55);
    wallGrad.addColorStop(0, '#190d16');
    wallGrad.addColorStop(1, '#271522');
    ctx.fillStyle = wallGrad;
    ctx.fillRect(0, 0, w, h * 0.55);

    // Retro subway tile lines on back wall
    ctx.strokeStyle = 'rgba(77, 51, 69, 0.45)';
    ctx.lineWidth = 1;
    for (let y = 15; y < h * 0.55; y += 22) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(w, y);
      ctx.stroke();
    }

    // Wooden countertop bar with warm mahogany grain
    const tableTop = h * 0.52;
    const tableGrad = ctx.createLinearGradient(0, tableTop, 0, h);
    tableGrad.addColorStop(0, '#3e2417');
    tableGrad.addColorStop(0.12, '#5a3522');
    tableGrad.addColorStop(0.85, '#2e1910');
    tableGrad.addColorStop(1, '#1b0d07');
    ctx.fillStyle = tableGrad;
    ctx.fillRect(0, tableTop, w, h - tableTop);

    // Polished stainless-steel counter edge bevel
    const bevelGrad = ctx.createLinearGradient(0, tableTop - 4, 0, tableTop + 3);
    bevelGrad.addColorStop(0, '#7a523a');
    bevelGrad.addColorStop(0.5, '#ffd29d');
    bevelGrad.addColorStop(1, '#2e1910');
    ctx.fillStyle = bevelGrad;
    ctx.fillRect(0, tableTop - 3, w, 6);

    // Soft countertop shadows & reflections
    ctx.fillStyle = 'rgba(0, 0, 0, 0.35)';
    ctx.fillRect(0, tableTop + 3, w, 8);
  }

  drawSideStations(ctx) {
    const h = this.height;
    const tableTop = h * 0.52;

    // Left Shelf: Tea Dispenser Jars preview
    ctx.save();
    ctx.fillStyle = 'rgba(25, 12, 22, 0.7)';
    ctx.beginPath();
    ctx.roundRect(10, tableTop - 55, 62, 52, 6);
    ctx.fill();
    ctx.strokeStyle = 'rgba(244, 196, 48, 0.35)';
    ctx.lineWidth = 1;
    ctx.stroke();

    ctx.font = 'bold 11px sans-serif';
    ctx.fillStyle = 'var(--gold, #f4c430)';
    ctx.textAlign = 'center';
    ctx.fillText('BÌNH TRÀ', 41, tableTop - 40);

    // Mini active tea jar
    const tCol = BaristaWorkstation.TEA_COLORS[this.tea] || BaristaWorkstation.TEA_COLORS.den;
    ctx.fillStyle = tCol.mid;
    ctx.beginPath();
    ctx.roundRect(28, tableTop - 32, 26, 26, 4);
    ctx.fill();
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 1;
    ctx.stroke();
    ctx.restore();

    // Right Shelf: Ice Bucket & Sugar Spoon preview
    ctx.save();
    ctx.fillStyle = 'rgba(25, 12, 22, 0.7)';
    ctx.beginPath();
    ctx.roundRect(this.width - 72, tableTop - 55, 62, 52, 6);
    ctx.fill();
    ctx.strokeStyle = 'rgba(139, 233, 253, 0.35)';
    ctx.lineWidth = 1;
    ctx.stroke();

    ctx.font = 'bold 11px sans-serif';
    ctx.fillStyle = '#8be9fd';
    ctx.textAlign = 'center';
    ctx.fillText('ĐÁ & ĐƯỜNG', this.width - 41, tableTop - 40);

    // Mini ice and honey icon
    ctx.font = '16px sans-serif';
    ctx.fillText('🧊🍯', this.width - 41, tableTop - 14);
    ctx.restore();
  }

  drawSweetnessMeter(ctx) {
    const x = 86;
    const y = 55;
    const w = 18;
    const h = 135;

    // Meter background
    ctx.save();
    ctx.fillStyle = 'rgba(20, 10, 18, 0.82)';
    ctx.beginPath();
    ctx.roundRect(x, y, w, h, 8);
    ctx.fill();
    ctx.strokeStyle = '#b8860b';
    ctx.lineWidth = 1.2;
    ctx.stroke();

    // Fill level mapping
    const sugarMap = { '0%': 0.05, '30%': 0.35, '50%': 0.58, '70%': 0.78, '100%': 1.0 };
    const pct = sugarMap[this.sugar] || 0.5;
    const fillH = (h - 6) * pct;

    const honeyGrad = ctx.createLinearGradient(0, y + h, 0, y + h - fillH);
    honeyGrad.addColorStop(0, '#d35400');
    honeyGrad.addColorStop(0.5, '#f39c12');
    honeyGrad.addColorStop(1, '#f1c40f');

    ctx.fillStyle = honeyGrad;
    ctx.beginPath();
    ctx.roundRect(x + 3, y + h - 3 - fillH, w - 6, fillH, 5);
    ctx.fill();

    // Meter tick markers
    ctx.fillStyle = 'rgba(255, 255, 255, 0.4)';
    [0.1, 0.35, 0.58, 0.78, 0.95].forEach(t => {
      ctx.fillRect(x + 2, y + h - h * t, 5, 1);
    });

    // Label on top
    ctx.font = 'bold 12px "VT323", monospace, sans-serif';
    ctx.fillStyle = '#f4c430';
    ctx.textAlign = 'center';
    ctx.fillText('ĐƯỜNG', x + w * 0.5, y - 8);
    ctx.font = 'bold 14px "VT323", monospace, sans-serif';
    ctx.fillStyle = '#ffffff';
    ctx.fillText(this.sugar, x + w * 0.5, y + h + 16);
    ctx.restore();
  }

  drawIceMeter(ctx) {
    const x = this.width - 104;
    const y = 55;
    const w = 18;
    const h = 135;

    // Meter background
    ctx.save();
    ctx.fillStyle = 'rgba(20, 10, 18, 0.82)';
    ctx.beginPath();
    ctx.roundRect(x, y, w, h, 8);
    ctx.fill();
    ctx.strokeStyle = '#00bcd4';
    ctx.lineWidth = 1.2;
    ctx.stroke();

    // Fill level mapping
    const iceMap = { 'Nóng': 0.08, 'Ít đá': 0.38, 'Vừa đá': 0.68, 'Đầy đá': 1.0 };
    const pct = iceMap[this.ice] || 0.68;
    const fillH = (h - 6) * pct;

    const iceGrad = ctx.createLinearGradient(0, y + h, 0, y + h - fillH);
    if (this.ice === 'Nóng') {
      iceGrad.addColorStop(0, '#c0392b');
      iceGrad.addColorStop(1, '#e74c3c');
    } else {
      iceGrad.addColorStop(0, '#0097a7');
      iceGrad.addColorStop(0.5, '#00bcd4');
      iceGrad.addColorStop(1, '#b2ebf2');
    }

    ctx.fillStyle = iceGrad;
    ctx.beginPath();
    ctx.roundRect(x + 3, y + h - 3 - fillH, w - 6, fillH, 5);
    ctx.fill();

    // Meter tick markers
    ctx.fillStyle = 'rgba(255, 255, 255, 0.4)';
    [0.1, 0.38, 0.68, 0.95].forEach(t => {
      ctx.fillRect(x + w - 7, y + h - h * t, 5, 1);
    });

    // Label on top
    ctx.font = 'bold 12px "VT323", monospace, sans-serif';
    ctx.fillStyle = '#8be9fd';
    ctx.textAlign = 'center';
    ctx.fillText('ĐÁ', x + w * 0.5, y - 8);
    ctx.font = 'bold 13px "VT323", monospace, sans-serif';
    ctx.fillStyle = '#ffffff';
    ctx.fillText(this.ice, x + w * 0.5, y + h + 16);
    ctx.restore();
  }

  // --- BOM PHA CHẾ: INSPECTION PORTHOLE CONTENTS (Trà sữa, bọt kem, đá, trân châu nhìn qua kính) ---
  drawBombContents(ctx, cx, cy, r, isSwirling = false) {
    ctx.save();
    // Clip to circular window
    ctx.beginPath();
    ctx.arc(cx, cy, r, 0, Math.PI * 2);
    ctx.clip();

    // Dark interior background
    ctx.fillStyle = '#140c14';
    ctx.fillRect(cx - r, cy - r, r * 2, r * 2);

    // Liquid fill calculation
    const tCol = BaristaWorkstation.TEA_COLORS[this.tea] || BaristaWorkstation.TEA_COLORS.den;
    const fillRatio = 0.72;
    const liquidTop = cy + r - r * 2 * fillRatio;

    // Liquid gradient
    const liquidGrad = ctx.createLinearGradient(cx, cy + r, cx, liquidTop);
    liquidGrad.addColorStop(0, tCol.base);
    liquidGrad.addColorStop(0.55, tCol.mid);
    liquidGrad.addColorStop(0.9, tCol.light);
    liquidGrad.addColorStop(1, tCol.cream);
    ctx.fillStyle = liquidGrad;

    ctx.beginPath();
    ctx.moveTo(cx - r, cy + r);
    ctx.lineTo(cx - r, liquidTop);
    // Swirling wave meniscus
    const waveFreq = isSwirling ? 0.35 : 0.08;
    const waveAmp = isSwirling ? 8 : 2.5;
    const wave = Math.sin(this.tick * waveFreq) * waveAmp;
    ctx.quadraticCurveTo(cx, liquidTop + wave, cx + r, liquidTop);
    ctx.lineTo(cx + r, cy + r);
    ctx.closePath();
    ctx.fill();

    // Swirling vortex effect when shaking
    if (isSwirling) {
      ctx.strokeStyle = tCol.cream;
      ctx.lineWidth = 2.5;
      ctx.beginPath();
      const swirlRot = this.tick * 0.25;
      ctx.ellipse(cx, cy + 2, r * 0.6, r * 0.35, swirlRot, 0, Math.PI * 1.6);
      ctx.stroke();
    }

    // Boba pearls & Toppings
    this.bobaPearls.forEach((p, idx) => {
      let px, py;
      if (isSwirling) {
        // Swirling in vortex!
        const angle = this.tick * 0.15 + (idx * 0.7);
        const dist = 10 + (idx % 4) * 5;
        px = cx + Math.cos(angle) * dist;
        py = cy + 12 + Math.sin(angle) * (dist * 0.5);
      } else {
        px = cx + p.x * 0.6;
        py = cy + r - 12 + (p.y % 14) * 0.4;
      }

      if (p.type === 'thach_la_dua') {
        ctx.fillStyle = 'rgba(46, 204, 113, 0.9)';
        ctx.fillRect(px - 4, py - 4, 8, 8);
        ctx.strokeStyle = '#a8e6cf';
        ctx.lineWidth = 0.7;
        ctx.strokeRect(px - 4, py - 4, 8, 8);
      } else if (p.type === 'dao_mieng') {
        ctx.fillStyle = '#f39c12';
        ctx.beginPath();
        ctx.ellipse(px, py, 6, 3.5, 0.4, 0, Math.PI * 2);
        ctx.fill();
      } else if (p.type === 'suong_sao') {
        ctx.fillStyle = '#111111';
        ctx.fillRect(px - 5, py - 4, 10, 8);
      } else {
        // Black pearls
        ctx.fillStyle = p.type === 'tranchau_duongden' ? '#1f0d06' : '#140c14';
        ctx.beginPath();
        ctx.arc(px, py, 3.8, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = '#ffffff';
        ctx.beginPath();
        ctx.arc(px - 1.2, py - 1.2, 1.1, 0, Math.PI * 2);
        ctx.fill();
      }
    });

    // Floating Ice Cubes inside window
    if (this.ice !== 'Nóng') {
      const cubeCount = this.ice === 'Ít đá' ? 2 : (this.ice === 'Vừa đá' ? 3 : 5);
      for (let i = 0; i < cubeCount; i++) {
        let ix, iy;
        if (isSwirling) {
          const a = -this.tick * 0.12 + i * 1.5;
          ix = cx + Math.cos(a) * 16;
          iy = cy - 2 + Math.sin(a) * 10;
        } else {
          ix = cx - 18 + i * 12;
          iy = liquidTop + 10 + Math.sin(this.tick * 0.05 + i) * 2;
        }
        ctx.fillStyle = 'rgba(210, 245, 255, 0.65)';
        ctx.beginPath();
        ctx.roundRect(ix - 6, iy - 5, 12, 10, 2.5);
        ctx.fill();
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.85)';
        ctx.lineWidth = 0.8;
        ctx.stroke();
      }
    }

    // Foam & crema bubbles on liquid top
    ctx.fillStyle = tCol.cream;
    for (let bx = -r * 0.7; bx <= r * 0.7; bx += 8) {
      const bRad = 2.2 + Math.sin(this.tick * 0.1 + bx) * 0.8;
      ctx.beginPath();
      ctx.arc(cx + bx, liquidTop + 2, Math.max(1, bRad), 0, Math.PI * 2);
      ctx.fill();
    }

    // Glass Porthole Specular Crescent Glare
    const glareGrad = ctx.createLinearGradient(cx - r * 0.8, cy - r * 0.8, cx + r * 0.5, cy + r * 0.5);
    glareGrad.addColorStop(0, 'rgba(255, 255, 255, 0.55)');
    glareGrad.addColorStop(0.3, 'rgba(255, 255, 255, 0.15)');
    glareGrad.addColorStop(0.6, 'rgba(255, 255, 255, 0)');
    ctx.fillStyle = glareGrad;
    ctx.beginPath();
    ctx.arc(cx, cy, r - 1, -Math.PI * 0.85, -Math.PI * 0.15);
    ctx.lineTo(cx, cy);
    ctx.closePath();
    ctx.fill();

    ctx.restore();
  }

  // --- THE BOM PHA CHẾ (HERO CENTRAL MIXING BOMB ON COUNTERTOP) ---
  drawMixingBomb(ctx) {
    const cx = this.width * 0.5;
    const cy = this.height * 0.62;
    const bombR = 52; // spherical radius

    ctx.save();
    if (this.handAction === 'shake') {
      ctx.globalAlpha = 0.22; // Dim countertop bomb while being shaken front & center
    }

    // 1. Heavy shadow on mahogany counter
    ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
    ctx.beginPath();
    ctx.ellipse(cx, cy + bombR + 4, bombR * 0.8, 12, 0, 0, Math.PI * 2);
    ctx.fill();

    // 2. Brass Stand Pedestal
    const baseGrad = ctx.createLinearGradient(cx - 32, 0, cx + 32, 0);
    baseGrad.addColorStop(0, '#785422');
    baseGrad.addColorStop(0.3, '#d4af37');
    baseGrad.addColorStop(0.5, '#fef08a');
    baseGrad.addColorStop(0.7, '#d4af37');
    baseGrad.addColorStop(1, '#533814');
    ctx.fillStyle = baseGrad;
    ctx.beginPath();
    ctx.roundRect(cx - 34, cy + bombR - 6, 68, 14, [4, 4, 6, 6]);
    ctx.fill();
    ctx.strokeStyle = '#2f3542';
    ctx.lineWidth = 1;
    ctx.stroke();

    // 3. Side Heavy Handles (Behind the bomb body)
    [-1, 1].forEach(dir => {
      ctx.strokeStyle = '#b8860b';
      ctx.lineWidth = 5;
      ctx.beginPath();
      ctx.arc(cx + dir * (bombR + 2), cy, 14, dir === 1 ? -Math.PI * 0.45 : Math.PI * 0.55, dir === 1 ? Math.PI * 0.45 : Math.PI * 1.45);
      ctx.stroke();
      ctx.strokeStyle = '#fef08a';
      ctx.lineWidth = 1.2;
      ctx.stroke();
    });

    // 4. Main Spherical Bomb Body
    const sphereGrad = ctx.createRadialGradient(
      cx - bombR * 0.35, cy - bombR * 0.4, 4,
      cx, cy, bombR * 1.15
    );
    sphereGrad.addColorStop(0, '#636e72');
    sphereGrad.addColorStop(0.25, '#3b434a');
    sphereGrad.addColorStop(0.65, '#202428');
    sphereGrad.addColorStop(0.95, '#131618');
    sphereGrad.addColorStop(1, '#0a0c0e');
    ctx.fillStyle = sphereGrad;

    ctx.beginPath();
    ctx.arc(cx, cy, bombR, 0, Math.PI * 2);
    ctx.fill();

    // Outer rim highlight
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.25)';
    ctx.lineWidth = 1.2;
    ctx.stroke();

    // Horizontal Riveted Band
    ctx.fillStyle = 'rgba(20, 25, 30, 0.85)';
    ctx.fillRect(cx - bombR + 2, cy - 6, (bombR - 2) * 2, 12);
    ctx.strokeStyle = '#d4af37';
    ctx.lineWidth = 0.8;
    ctx.strokeRect(cx - bombR + 2, cy - 6, (bombR - 2) * 2, 12);

    // Golden Hex Rivets
    [-38, -20, 20, 38].forEach(rx => {
      ctx.fillStyle = '#f4c430';
      ctx.beginPath();
      ctx.arc(cx + rx, cy, 2.4, 0, Math.PI * 2);
      ctx.fill();
    });

    // 5. Analog Pressure Gauge on upper-left shoulder
    const gx = cx - 38;
    const gy = cy - 36;
    const gR = 13;
    // Brass bezel
    ctx.fillStyle = '#b8860b';
    ctx.beginPath();
    ctx.arc(gx, gy, gR + 2, 0, Math.PI * 2);
    ctx.fill();
    // Dial face
    ctx.fillStyle = '#f8fafc';
    ctx.beginPath();
    ctx.arc(gx, gy, gR, 0, Math.PI * 2);
    ctx.fill();
    // Gauge zones
    ctx.strokeStyle = '#22c55e';
    ctx.lineWidth = 1.6;
    ctx.beginPath();
    ctx.arc(gx, gy, gR - 2, Math.PI * 0.8, Math.PI * 1.3);
    ctx.stroke();
    ctx.strokeStyle = '#ef4444';
    ctx.beginPath();
    ctx.arc(gx, gy, gR - 2, Math.PI * 1.7, Math.PI * 2.2);
    ctx.stroke();
    // Red needle
    const needleRot = Math.PI * 0.9 + (this.sugar === '100%' ? 1.4 : 0.8);
    ctx.strokeStyle = '#dc2626';
    ctx.lineWidth = 1.2;
    ctx.beginPath();
    ctx.moveTo(gx, gy);
    ctx.lineTo(gx + Math.cos(needleRot) * (gR - 3), gy + Math.sin(needleRot) * (gR - 3));
    ctx.stroke();
    ctx.fillStyle = '#1e293b';
    ctx.beginPath();
    ctx.arc(gx, gy, 2, 0, Math.PI * 2);
    ctx.fill();

    // 6. Top Brass Funnel & Valve Collar (Miệng Rót Đồng & Ngòi Áp Suất)
    const topY = cy - bombR;
    const neckGrad = ctx.createLinearGradient(cx - 20, 0, cx + 20, 0);
    neckGrad.addColorStop(0, '#8c6708');
    neckGrad.addColorStop(0.3, '#d4af37');
    neckGrad.addColorStop(0.5, '#fef08a');
    neckGrad.addColorStop(0.8, '#d4af37');
    neckGrad.addColorStop(1, '#694a03');
    ctx.fillStyle = neckGrad;

    ctx.beginPath();
    ctx.moveTo(cx - 16, topY + 4);
    ctx.lineTo(cx - 22, topY - 14);
    ctx.lineTo(cx + 22, topY - 14);
    ctx.lineTo(cx + 16, topY + 4);
    ctx.closePath();
    ctx.fill();
    ctx.strokeStyle = '#533814';
    ctx.lineWidth = 1.2;
    ctx.stroke();

    // Funnel rim
    ctx.fillStyle = '#fef08a';
    ctx.beginPath();
    ctx.ellipse(cx, topY - 14, 22, 5, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#8c6708';
    ctx.stroke();

    // Funnel inner mouth
    ctx.fillStyle = '#2d1810';
    ctx.beginPath();
    ctx.ellipse(cx, topY - 14, 18, 3.5, 0, 0, Math.PI * 2);
    ctx.fill();

    // Valve cap / fuse on top
    ctx.fillStyle = '#ef4444';
    ctx.beginPath();
    ctx.roundRect(cx - 4, topY - 24, 8, 10, 2);
    ctx.fill();
    ctx.fillStyle = '#f4c430';
    ctx.fillRect(cx - 2, topY - 26, 4, 3);

    // Steam billows from top if hot drink
    if (this.ice === 'Nóng') {
      this.steamParticles.forEach(p => {
        ctx.fillStyle = `rgba(255, 255, 255, ${p.alpha})`;
        ctx.beginPath();
        ctx.arc(p.x, p.y - 15, p.r, 0, Math.PI * 2);
        ctx.fill();
      });
    }

    // 7. Central Crystal Porthole Flange (Vành Đồng Cửa Sổ Kính)
    const portholeR = 34;
    const flangeGrad = ctx.createLinearGradient(cx - portholeR - 6, 0, cx + portholeR + 6, 0);
    flangeGrad.addColorStop(0, '#785422');
    flangeGrad.addColorStop(0.25, '#d4af37');
    flangeGrad.addColorStop(0.5, '#fef08a');
    flangeGrad.addColorStop(0.75, '#d4af37');
    flangeGrad.addColorStop(1, '#533814');
    ctx.fillStyle = flangeGrad;

    ctx.beginPath();
    ctx.arc(cx, cy + 3, portholeR + 7, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#2f3542';
    ctx.lineWidth = 1.2;
    ctx.stroke();

    // 8 Hexagonal Golden Bolts around flange
    for (let i = 0; i < 8; i++) {
      const boltAngle = (i * Math.PI * 2) / 8;
      const bx = cx + Math.cos(boltAngle) * (portholeR + 3.8);
      const by = cy + 3 + Math.sin(boltAngle) * (portholeR + 3.8);
      ctx.fillStyle = '#fef08a';
      ctx.beginPath();
      ctx.arc(bx, by, 2.2, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = '#533814';
      ctx.lineWidth = 0.6;
      ctx.stroke();
    }

    // 8. RENDER CONTENTS INSIDE THE PORTHOLE (Trà sữa, bọt kem, đá, trân châu)
    this.drawBombContents(ctx, cx, cy + 3, portholeR, false);

    // 9. Stencil Label "HEEHEE BOMB 💣"
    ctx.font = 'bold 9px "VT323", monospace, sans-serif';
    ctx.fillStyle = '#f4c430';
    ctx.textAlign = 'center';
    ctx.fillText('HEEHEE BOMB 💣', cx, cy - 35);

    ctx.restore();
  }

  // --- FLOATING TEXTS & ANIMATIONS ---
  drawFloatingTexts(ctx) {
    ctx.save();
    ctx.textAlign = 'center';
    this.floatingTexts.forEach(t => {
      ctx.font = `bold ${Math.floor(16 * t.scale)}px "VT323", monospace, sans-serif`;
      ctx.fillStyle = t.color;
      ctx.globalAlpha = t.opacity;
      ctx.shadowColor = 'rgba(0,0,0,0.85)';
      ctx.shadowBlur = 6;
      ctx.fillText(t.text, t.x, t.y);
    });
    ctx.restore();
  }

  // --- REALISTIC ANATOMICAL BARISTA ARM ---
  drawRealisticArm(ctx, startX, startY, wristX, wristY, side = 'right') {
    ctx.save();
    const dx = wristX - startX;
    const dy = wristY - startY;
    const angle = Math.atan2(dy, dx);
    const len = Math.hypot(dx, dy);

    ctx.translate(startX, startY);
    ctx.rotate(angle);

    const baseW = 48; // forearm width near elbow
    const wristW = 22; // wrist width

    // 1. Soft Arm Cast Shadow
    ctx.fillStyle = 'rgba(0, 0, 0, 0.28)';
    ctx.beginPath();
    ctx.ellipse(len * 0.45, 18, len * 0.52, 14, 0, 0, Math.PI * 2);
    ctx.fill();

    // 2. Bare Skin Wrist & Forearm portion
    const skinGrad = ctx.createLinearGradient(0, -wristW * 0.5, 0, wristW * 0.5);
    skinGrad.addColorStop(0, '#fffbf5');
    skinGrad.addColorStop(0.35, '#ffe5cc');
    skinGrad.addColorStop(0.75, '#f8bda8');
    skinGrad.addColorStop(1, '#df8f7c');
    ctx.fillStyle = skinGrad;

    ctx.beginPath();
    ctx.moveTo(len * 0.62, -wristW * 0.6);
    ctx.quadraticCurveTo(len * 0.82, -wristW * 0.52, len, -wristW * 0.48);
    // Ulnar notch / wrist bone bump
    if (side === 'right') {
      ctx.lineTo(len, wristW * 0.55);
      ctx.quadraticCurveTo(len * 0.82, wristW * 0.6, len * 0.62, wristW * 0.68);
    } else {
      ctx.lineTo(len, wristW * 0.48);
      ctx.quadraticCurveTo(len * 0.82, wristW * 0.52, len * 0.62, wristW * 0.6);
    }
    ctx.closePath();
    ctx.fill();

    // Delicate tendon line at wrist flexion
    ctx.strokeStyle = 'rgba(180, 100, 80, 0.22)';
    ctx.lineWidth = 0.8;
    ctx.beginPath();
    ctx.arc(len - 4, 0, 8, -Math.PI * 0.35, Math.PI * 0.35);
    ctx.stroke();

    // 3. Voluminous Emerald Barista Sleeve
    const sleeveEnd = len * 0.76;
    const sleeveGrad = ctx.createLinearGradient(0, -baseW * 0.7, 0, baseW * 0.7);
    sleeveGrad.addColorStop(0, '#15522e');
    sleeveGrad.addColorStop(0.2, '#27ae60');
    sleeveGrad.addColorStop(0.5, '#2ecc71');
    sleeveGrad.addColorStop(0.85, '#1e824c');
    sleeveGrad.addColorStop(1, '#0f3c21');
    ctx.fillStyle = sleeveGrad;

    ctx.beginPath();
    ctx.moveTo(-20, -baseW * 0.65);
    ctx.quadraticCurveTo(sleeveEnd * 0.5, -baseW * 0.85, sleeveEnd, -wristW * 0.78);
    ctx.lineTo(sleeveEnd, wristW * 0.78);
    ctx.quadraticCurveTo(sleeveEnd * 0.5, baseW * 0.85, -20, baseW * 0.65);
    ctx.closePath();
    ctx.fill();

    // Sleeve Drapery Folds & Wrinkles
    ctx.strokeStyle = 'rgba(10, 45, 20, 0.45)';
    ctx.lineWidth = 1.4;
    ctx.beginPath();
    ctx.moveTo(sleeveEnd * 0.28, -baseW * 0.5);
    ctx.quadraticCurveTo(sleeveEnd * 0.5, -baseW * 0.1, sleeveEnd * 0.38, baseW * 0.3);
    ctx.moveTo(sleeveEnd * 0.58, -baseW * 0.45);
    ctx.quadraticCurveTo(sleeveEnd * 0.72, 0, sleeveEnd * 0.62, baseW * 0.4);
    ctx.stroke();

    // Sleeve Highlight Crease
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.3)';
    ctx.lineWidth = 1.0;
    ctx.beginPath();
    ctx.moveTo(sleeveEnd * 0.26, -baseW * 0.55);
    ctx.quadraticCurveTo(sleeveEnd * 0.46, -baseW * 0.15, sleeveEnd * 0.36, baseW * 0.25);
    ctx.stroke();

    // Golden Cuff Hem Stitching
    ctx.strokeStyle = '#f4c430';
    ctx.lineWidth = 1.6;
    ctx.beginPath();
    ctx.moveTo(sleeveEnd - 2, -wristW * 0.78);
    ctx.lineTo(sleeveEnd - 2, wristW * 0.78);
    ctx.stroke();

    // 4. Delicate Scalloped White Lace Cuff
    ctx.fillStyle = '#f8fafc';
    ctx.beginPath();
    ctx.ellipse(sleeveEnd + 4, 0, 7, wristW * 0.84, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#e2e8f0';
    ctx.lineWidth = 0.8;
    ctx.stroke();

    // Lace Scallop Lobes
    ctx.fillStyle = '#ffffff';
    const scallopCount = 5;
    for (let i = 0; i < scallopCount; i++) {
      const sy = -wristW * 0.68 + (i * wristW * 1.36) / (scallopCount - 1);
      ctx.beginPath();
      ctx.arc(sleeveEnd + 7, sy, 3.2, -Math.PI * 0.5, Math.PI * 0.5);
      ctx.fill();
      ctx.strokeStyle = 'rgba(200, 210, 225, 0.6)';
      ctx.stroke();
    }

    ctx.restore();
  }

  // Helper to draw realistic anime fingers with joints, pads, and manicured nails
  drawFingersWithNails(ctx, fingerList) {
    fingerList.forEach(f => {
      ctx.save();
      ctx.translate(f.x, f.y);
      ctx.rotate(f.rot || 0);

      // Finger gradient (skin tone + peach blush pad at tip)
      const fGrad = ctx.createLinearGradient(0, 0, f.w, 0);
      fGrad.addColorStop(0, '#ffe5cc');
      fGrad.addColorStop(0.7, '#f8bda8');
      fGrad.addColorStop(1, '#f49a85');
      ctx.fillStyle = fGrad;

      // Finger phalanx capsule
      ctx.beginPath();
      ctx.roundRect(0, -f.h * 0.5, f.w, f.h, f.h * 0.5);
      ctx.fill();

      // Knuckle crease line
      ctx.strokeStyle = 'rgba(180, 95, 75, 0.35)';
      ctx.lineWidth = 0.7;
      ctx.beginPath();
      ctx.moveTo(f.w * 0.45, -f.h * 0.35);
      ctx.lineTo(f.w * 0.45, f.h * 0.35);
      ctx.stroke();

      // Manicured fingernail
      if (f.nail !== false) {
        ctx.fillStyle = '#fecdd3';
        ctx.beginPath();
        ctx.roundRect(f.w - 5, -f.h * 0.38, 4.2, f.h * 0.76, [1.5, 2.5, 2.5, 1.5]);
        ctx.fill();

        // White specular gloss on nail
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(f.w - 4, -f.h * 0.25, 1.2, f.h * 0.5);
      }

      ctx.restore();
    });
  }

  // --- SINGLE-HAND BARISTA INTERACTIONS (Rót trà, múc đường, gắp đá, múc topping, giao ly) ---
  drawBaristaHand(ctx) {
    const p = this.handProgress; // 0.0 -> 1.0
    const curve = Math.sin(p * Math.PI); // 0 -> 1 -> 0
    const cx = this.width * 0.5;
    const cy = this.height * 0.52;

    const startX = this.width + 65;
    const startY = this.height + 45;
    const wristX = startX - (startX - (cx + 38)) * curve;
    const wristY = startY - (startY - (cy - 12)) * curve;

    // 1. Draw realistic forearm with sleeve & lace cuff
    this.drawRealisticArm(ctx, startX, startY, wristX, wristY, 'right');

    // 2. Draw anatomical hand & tool at wrist position
    ctx.save();
    ctx.translate(wristX, wristY);
    ctx.rotate(-0.28 * curve);

    // Anatomical Palm
    const palmGrad = ctx.createRadialGradient(-3, 6, 2, 0, 5, 20);
    palmGrad.addColorStop(0, '#fffbf5');
    palmGrad.addColorStop(0.45, '#ffe5cc');
    palmGrad.addColorStop(0.8, '#f8bda8');
    palmGrad.addColorStop(1, '#e39480');
    ctx.fillStyle = palmGrad;

    ctx.beginPath();
    ctx.ellipse(-6, 8, 11, 8, -0.35, 0, Math.PI * 2);
    ctx.fill();

    // Utensil based on Action:
    if (this.handAction === 'pour_tea') {
      // Brushed Stainless Steel Gooseneck Kettle with wood handle
      const kettleGrad = ctx.createLinearGradient(-42, -22, -10, 6);
      kettleGrad.addColorStop(0, '#f1f2f6');
      kettleGrad.addColorStop(0.4, '#ced6e0');
      kettleGrad.addColorStop(1, '#747d8c');
      ctx.fillStyle = kettleGrad;

      ctx.beginPath();
      ctx.roundRect(-42, -22, 32, 28, [6, 4, 6, 6]);
      ctx.fill();
      ctx.strokeStyle = '#57606f';
      ctx.lineWidth = 1;
      ctx.stroke();

      // Gooseneck curved spout
      ctx.fillStyle = '#a4b0be';
      ctx.beginPath();
      ctx.moveTo(-42, -5);
      ctx.quadraticCurveTo(-58, -25, -50, -32);
      ctx.lineTo(-46, -30);
      ctx.quadraticCurveTo(-52, -24, -42, -12);
      ctx.closePath();
      ctx.fill();

      // Ergonomic wooden handle grip
      ctx.fillStyle = '#8b5a2b';
      ctx.beginPath();
      ctx.roundRect(-14, -20, 8, 24, 3);
      ctx.fill();

      // Pouring liquid stream into the cup!
      if (curve > 0.35) {
        const tCol = BaristaWorkstation.TEA_COLORS[this.tea] || BaristaWorkstation.TEA_COLORS.den;
        ctx.fillStyle = tCol.mid;
        ctx.beginPath();
        ctx.moveTo(-50, -31);
        ctx.quadraticCurveTo(-65, 12, -45, 52);
        ctx.lineTo(-40, 52);
        ctx.quadraticCurveTo(-59, 12, -46, -30);
        ctx.closePath();
        ctx.fill();

        // Tea splash droplets
        ctx.fillStyle = tCol.light;
        ctx.fillRect(-48, 54, 3.5, 3.5);
        ctx.fillRect(-41, 58, 2.5, 2.5);
        ctx.fillRect(-52, 48, 2, 2);
      }

      // Fingers gripping the handle
      this.drawFingersWithNails(ctx, [
        { x: -16, y: -4, w: 14, h: 5.5, rot: 3.1, nail: true },
        { x: -16, y: 3, w: 15, h: 5.4, rot: 3.1, nail: true },
        { x: -15, y: 10, w: 14, h: 5.0, rot: 3.1, nail: true },
        { x: -6, y: -12, w: 13, h: 5.2, rot: -1.2, nail: true } // thumb on top
      ]);

    } else if (this.handAction === 'add_sugar') {
      // Long golden syrup spoon
      ctx.strokeStyle = '#f1c40f';
      ctx.lineWidth = 3.5;
      ctx.beginPath();
      ctx.moveTo(0, 5);
      ctx.lineTo(-42, -14);
      ctx.stroke();

      // Spoon bowl with dripping honey
      ctx.fillStyle = '#f39c12';
      ctx.beginPath();
      ctx.ellipse(-44, -15, 9, 6, -0.5, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = '#d35400';
      ctx.lineWidth = 1;
      ctx.stroke();

      // Viscous honey drizzle
      if (curve > 0.38) {
        ctx.fillStyle = '#f1c40f';
        ctx.beginPath();
        ctx.moveTo(-45, -10);
        ctx.quadraticCurveTo(-47, 8, -45, 26);
        ctx.lineTo(-43, 26);
        ctx.quadraticCurveTo(-44, 8, -43, -10);
        ctx.closePath();
        ctx.fill();

        ctx.beginPath();
        ctx.arc(-44, 32, 3.2, 0, Math.PI * 2);
        ctx.fill();
      }

      // Fingers gracefully holding spoon
      this.drawFingersWithNails(ctx, [
        { x: -12, y: -2, w: 14, h: 5.2, rot: 2.8, nail: true },
        { x: -11, y: 5, w: 14, h: 5.0, rot: 2.9, nail: true },
        { x: -2, y: -8, w: 12, h: 5.0, rot: -0.8, nail: true } // thumb
      ]);

    } else if (this.handAction === 'add_ice') {
      // Precision metal ice tongs
      ctx.strokeStyle = '#ced6e0';
      ctx.lineWidth = 2.5;
      ctx.beginPath();
      ctx.moveTo(-4, 0);
      ctx.lineTo(-32, -12);
      ctx.lineTo(-42, -5);
      ctx.moveTo(-4, 8);
      ctx.lineTo(-32, 2);
      ctx.lineTo(-42, -3);
      ctx.stroke();

      // Sparkling crystalline ice cube held in tongs
      ctx.fillStyle = 'rgba(180, 235, 250, 0.88)';
      ctx.beginPath();
      ctx.roundRect(-52, -12, 14, 14, 3);
      ctx.fill();
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 1.2;
      ctx.stroke();
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(-49, -9, 4, 4);

      // Droplets & cold vapors
      if (curve > 0.45) {
        ctx.fillStyle = '#8be9fd';
        ctx.fillRect(-46, 12, 2.5, 2.5);
        ctx.fillRect(-42, 20, 2, 2);
      }

      // Fingers gripping tongs
      this.drawFingersWithNails(ctx, [
        { x: -14, y: 0, w: 15, h: 5.4, rot: 2.9, nail: true },
        { x: -13, y: 7, w: 14, h: 5.2, rot: 3.0, nail: true },
        { x: -3, y: -7, w: 13, h: 5.2, rot: -0.9, nail: true } // thumb
      ]);

    } else if (this.handAction === 'add_topping') {
      // Boba perforated ladle with pearls
      ctx.strokeStyle = '#747d8c';
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.moveTo(0, 5);
      ctx.lineTo(-36, -14);
      ctx.stroke();

      ctx.fillStyle = '#2f3542';
      ctx.beginPath();
      ctx.ellipse(-42, -15, 11, 7, -0.35, 0, Math.PI * 2);
      ctx.fill();

      // Boba pearls in ladle
      ctx.fillStyle = '#111111';
      ctx.beginPath();
      ctx.arc(-44, -16, 3.5, 0, Math.PI * 2);
      ctx.arc(-39, -14, 3.2, 0, Math.PI * 2);
      ctx.arc(-42, -12, 3.0, 0, Math.PI * 2);
      ctx.fill();

      // Fingers holding ladle
      this.drawFingersWithNails(ctx, [
        { x: -14, y: -1, w: 15, h: 5.4, rot: 2.9, nail: true },
        { x: -13, y: 6, w: 14, h: 5.2, rot: 3.0, nail: true },
        { x: -3, y: -8, w: 13, h: 5.2, rot: -0.8, nail: true }
      ]);

    } else if (this.handAction === 'serve') {
      // Wooden serving tray presenting the finished cup
      ctx.fillStyle = '#8b5a2b';
      ctx.beginPath();
      ctx.ellipse(-32, 12, 28, 8, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = '#f4c430';
      ctx.lineWidth = 1.4;
      ctx.stroke();

      // Sparkles & stars
      ctx.fillStyle = '#ffd700';
      ctx.beginPath();
      ctx.arc(-48, -12, 3, 0, Math.PI * 2);
      ctx.arc(-18, -18, 2.5, 0, Math.PI * 2);
      ctx.arc(-32, -26, 2, 0, Math.PI * 2);
      ctx.fill();

      // Fingers supporting the tray
      this.drawFingersWithNails(ctx, [
        { x: -16, y: 14, w: 16, h: 5.2, rot: 3.1, nail: true },
        { x: -15, y: 20, w: 15, h: 5.0, rot: 3.1, nail: true },
        { x: -4, y: 6, w: 12, h: 5.0, rot: -0.5, nail: true }
      ]);
    }

    ctx.restore();
  }

  // --- TWO-HANDED BOM PHA CHẾ SHAKING ANIMATION (HAI TAY LẮC BOM PHA CHẾ) ---
  drawTwoHandedShake(ctx) {
    const p = this.handProgress; // 0.0 -> 1.0
    const rampIn = Math.min(1, p * 5.5);
    const rampOut = Math.min(1, (1 - p) * 5.5);
    const intensity = Math.sin(Math.min(rampIn, rampOut) * Math.PI * 0.5);

    const cx = this.width * 0.5;
    const cy = this.height * 0.46;

    // Energetic Shaking Physics (Rhythmic 60fps rapid vibration)
    const shakeCycle = this.tick * 0.95;
    const shakeX = Math.sin(shakeCycle) * 16 * intensity;
    const shakeY = Math.cos(shakeCycle * 1.3) * 22 * intensity;
    const shakeRot = Math.sin(shakeCycle) * 0.22 * intensity;

    // 1. Dynamic Speed Lines / Motion Streaks radiating around the bomb
    if (intensity > 0.4) {
      ctx.save();
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.55)';
      ctx.lineWidth = 2.5;
      for (let i = 0; i < 4; i++) {
        const lineOffset = ((this.tick * 6 + i * 25) % 80) - 40;
        const ly = cy + shakeY + lineOffset;
        ctx.beginPath();
        ctx.moveTo(cx - 65 - Math.random() * 20, ly);
        ctx.lineTo(cx - 40, ly);
        ctx.moveTo(cx + 40, ly);
        ctx.lineTo(cx + 65 + Math.random() * 20, ly);
        ctx.stroke();
      }
      ctx.restore();
    }

    // 2. Chilly Frost Mist & Sizzling Spark Particles
    this.frostParticles.forEach(fp => {
      ctx.save();
      ctx.fillStyle = `rgba(180, 235, 255, ${fp.alpha})`;
      ctx.beginPath();
      ctx.arc(fp.x, fp.y, fp.r, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    });

    // 3. LEFT ARM (reaches from bottom-left corner to left handle of the bomb)
    const leftBaseX = this.width * 0.06;
    const leftBaseY = this.height + 40;
    const leftWristX = cx - 44 + shakeX * 0.8;
    const leftWristY = cy + 12 + shakeY * 0.8;
    this.drawRealisticArm(ctx, leftBaseX, leftBaseY, leftWristX, leftWristY, 'left');

    // 4. RIGHT ARM (reaches from bottom-right corner to right handle of the bomb)
    const rightBaseX = this.width * 0.94;
    const rightBaseY = this.height + 40;
    const rightWristX = cx + 44 + shakeX * 0.8;
    const rightWristY = cy + 12 + shakeY * 0.8;
    this.drawRealisticArm(ctx, rightBaseX, rightBaseY, rightWristX, rightWristY, 'right');

    // 5. THE HERO BOM PHA CHẾ IN ACTION (BEING SHAKEN BY BOTH HANDS!)
    ctx.save();
    ctx.translate(cx + shakeX, cy + shakeY);
    ctx.rotate(shakeRot);

    const bombR = 48;

    // A. Side Brass Handles
    [-1, 1].forEach(dir => {
      ctx.strokeStyle = '#b8860b';
      ctx.lineWidth = 6;
      ctx.beginPath();
      ctx.arc(dir * (bombR + 4), 0, 16, dir === 1 ? -Math.PI * 0.5 : Math.PI * 0.5, dir === 1 ? Math.PI * 0.5 : Math.PI * 1.5);
      ctx.stroke();
      ctx.strokeStyle = '#fef08a';
      ctx.lineWidth = 1.4;
      ctx.stroke();
    });

    // B. Spherical Bomb Body
    const bGrad = ctx.createRadialGradient(-16, -18, 4, 0, 0, bombR * 1.15);
    bGrad.addColorStop(0, '#636e72');
    bGrad.addColorStop(0.3, '#3b434a');
    bGrad.addColorStop(0.7, '#202428');
    bGrad.addColorStop(1, '#0b0d0e');
    ctx.fillStyle = bGrad;
    ctx.beginPath();
    ctx.arc(0, 0, bombR, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.35)';
    ctx.lineWidth = 1.2;
    ctx.stroke();

    // Riveted horizontal band
    ctx.fillStyle = 'rgba(15, 20, 25, 0.9)';
    ctx.fillRect(-bombR + 2, -6, (bombR - 2) * 2, 12);
    ctx.strokeStyle = '#d4af37';
    ctx.lineWidth = 0.8;
    ctx.strokeRect(-bombR + 2, -6, (bombR - 2) * 2, 12);

    [-32, -16, 16, 32].forEach(rx => {
      ctx.fillStyle = '#f4c430';
      ctx.beginPath();
      ctx.arc(rx, 0, 2.2, 0, Math.PI * 2);
      ctx.fill();
    });

    // Top funnel and pressure cap
    ctx.fillStyle = '#d4af37';
    ctx.beginPath();
    ctx.moveTo(-16, -bombR + 4);
    ctx.lineTo(-20, -bombR - 12);
    ctx.lineTo(20, -bombR - 12);
    ctx.lineTo(16, -bombR + 4);
    ctx.closePath();
    ctx.fill();
    ctx.strokeStyle = '#8c6708';
    ctx.lineWidth = 1;
    ctx.stroke();

    // Sputtering spark / valve on top
    ctx.fillStyle = '#ef4444';
    ctx.beginPath();
    ctx.roundRect(-5, -bombR - 22, 10, 10, 2);
    ctx.fill();

    // Spark particles emitting from top valve while shaking!
    ctx.fillStyle = '#fef08a';
    ctx.beginPath();
    ctx.arc(0, -bombR - 25, 3, 0, Math.PI * 2);
    ctx.fill();

    // Pressure Gauge vibrating to RED ZONE!
    const gx = -32;
    const gy = -30;
    const gR = 12;
    ctx.fillStyle = '#b8860b';
    ctx.beginPath();
    ctx.arc(gx, gy, gR + 2, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#f8fafc';
    ctx.beginPath();
    ctx.arc(gx, gy, gR, 0, Math.PI * 2);
    ctx.fill();
    // Needle pointing to MAX red!
    const needleVibe = Math.sin(this.tick * 0.8) * 0.25;
    ctx.strokeStyle = '#dc2626';
    ctx.lineWidth = 1.4;
    ctx.beginPath();
    ctx.moveTo(gx, gy);
    ctx.lineTo(gx + Math.cos(Math.PI * 1.9 + needleVibe) * (gR - 3), gy + Math.sin(Math.PI * 1.9 + needleVibe) * (gR - 3));
    ctx.stroke();

    // C. Porthole Flange Ring
    const portholeR = 30;
    const flangeGrad = ctx.createLinearGradient(-portholeR - 6, 0, portholeR + 6, 0);
    flangeGrad.addColorStop(0, '#785422');
    flangeGrad.addColorStop(0.3, '#d4af37');
    flangeGrad.addColorStop(0.5, '#fef08a');
    flangeGrad.addColorStop(0.7, '#d4af37');
    flangeGrad.addColorStop(1, '#533814');
    ctx.fillStyle = flangeGrad;
    ctx.beginPath();
    ctx.arc(0, 2, portholeR + 6, 0, Math.PI * 2);
    ctx.fill();

    // 8 bolts
    for (let i = 0; i < 8; i++) {
      const boltAngle = (i * Math.PI * 2) / 8;
      const bx = Math.cos(boltAngle) * (portholeR + 3.2);
      const by = 2 + Math.sin(boltAngle) * (portholeR + 3.2);
      ctx.fillStyle = '#fef08a';
      ctx.beginPath();
      ctx.arc(bx, by, 1.8, 0, Math.PI * 2);
      ctx.fill();
    }

    // D. Swirling Tea Liquid & Boba inside porthole during shake!
    this.drawBombContents(ctx, 0, 2, portholeR, true);

    ctx.restore(); // Restore bomb transform

    // 6. LEFT HAND FIRMLY CLASPING LEFT HANDLE
    ctx.save();
    ctx.translate(leftWristX, leftWristY);
    ctx.rotate(0.35 + shakeRot * 0.5);

    const lPalmGrad = ctx.createRadialGradient(0, 0, 2, 4, 2, 16);
    lPalmGrad.addColorStop(0, '#fffbf5');
    lPalmGrad.addColorStop(0.5, '#ffe5cc');
    lPalmGrad.addColorStop(1, '#f8bda8');
    ctx.fillStyle = lPalmGrad;
    ctx.beginPath();
    ctx.ellipse(0, 2, 11, 8, -0.2, 0, Math.PI * 2);
    ctx.fill();

    this.drawFingersWithNails(ctx, [
      { x: 2, y: -8, w: 15, h: 5.5, rot: -0.35, nail: true },
      { x: 8, y: -2, w: 20, h: 5.2, rot: 0.1, nail: true },
      { x: 8, y: 5, w: 22, h: 5.4, rot: 0.05, nail: true },
      { x: 7, y: 12, w: 20, h: 5.2, rot: 0.0, nail: true },
      { x: 5, y: 18, w: 17, h: 4.8, rot: -0.05, nail: true }
    ]);
    ctx.restore();

    // 7. RIGHT HAND FIRMLY CLASPING RIGHT HANDLE
    ctx.save();
    ctx.translate(rightWristX, rightWristY);
    ctx.rotate(-0.35 + shakeRot * 0.5);

    const rPalmGrad = ctx.createRadialGradient(-2, 0, 2, 0, 4, 16);
    rPalmGrad.addColorStop(0, '#fffbf5');
    rPalmGrad.addColorStop(0.5, '#ffe5cc');
    rPalmGrad.addColorStop(1, '#f8bda8');
    ctx.fillStyle = rPalmGrad;
    ctx.beginPath();
    ctx.ellipse(-4, 0, 11, 8, 0.3, 0, Math.PI * 2);
    ctx.fill();

    this.drawFingersWithNails(ctx, [
      { x: -14, y: 4, w: 14, h: 5.2, rot: 2.7, nail: true },
      { x: -16, y: -4, w: 18, h: 5.2, rot: 3.0, nail: true },
      { x: -16, y: -10, w: 17, h: 5.0, rot: 3.1, nail: true },
      { x: -14, y: -16, w: 15, h: 4.6, rot: 3.2, nail: true }
    ]);
    ctx.restore();

    // 8. "LẮC BOM PHA CHẾ!" Dramatic Banner
    ctx.save();
    ctx.font = 'bold 22px "VT323", monospace, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillStyle = '#ff79c6';
    ctx.shadowColor = 'rgba(0,0,0,0.9)';
    ctx.shadowBlur = 8;
    ctx.fillText('💣💥 ĐANG LẮC BOM PHA CHẾ! 💥💣', cx + shakeX, cy - 72 + shakeY);
    ctx.restore();
  }
}

window.BaristaWorkstation = BaristaWorkstation;
