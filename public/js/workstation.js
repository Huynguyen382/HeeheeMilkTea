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
    this.cupState = 'empty'; // 'empty' | 'filled' | 'sealed'

    // Dimensions
    this.width = 440;
    this.height = 175;
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
    const cssHeight = rect.height || 175;
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

  isGoldLeafRecipe() {
    return this.currentRecipe === 'tra_sua_dat_vang' ||
      (this.tea === 'den' && this.toppings.includes('tranchau_den') && this.toppings.includes('tranchau_duongden'));
  }

  isNitroRecipe() {
    return this.currentRecipe === 'nitro_cold_brew' ||
      (this.tea === 'olong_nuong' && this.toppings.includes('suong_sao') && this.toppings.includes('tranchau_den'));
  }

  isLotusRecipe() {
    return this.currentRecipe === 'tra_sen_tay_ho' ||
      (this.tea === 'lai' && this.toppings.includes('dao_mieng') && this.toppings.includes('sa_tuoi'));
  }

  isBruleeRecipe() {
    return this.currentRecipe === 'kem_kho_banh_bong' ||
      (this.tea === 'thai_xanh' && this.toppings.includes('thach_la_dua') && this.toppings.includes('tranchau_duongden'));
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

    // Generate floating 24K gold flakes for Trà Sữa Dát Vàng
    this.goldFlakes = [];
    if (this.isGoldLeafRecipe()) {
      for (let i = 0; i < 9; i++) {
        this.goldFlakes.push({
          x: (Math.random() - 0.5) * 34,
          y: (Math.random() - 0.5) * 36,
          size: 2.2 + Math.random() * 3.2,
          rot: Math.random() * Math.PI * 2,
          rotSpeed: (Math.random() - 0.5) * 0.04,
          sparklePhase: Math.random() * Math.PI * 2
        });
      }
    }

    // Generate nitro micro-bubbles for Nitro Cold Brew
    this.nitroBubbles = [];
    if (this.isNitroRecipe()) {
      for (let i = 0; i < 22; i++) {
        this.nitroBubbles.push({
          x: (Math.random() - 0.5) * 38,
          y: Math.random() * 50 - 25,
          speed: 0.35 + Math.random() * 0.75,
          size: 0.8 + Math.random() * 1.5,
          phase: Math.random() * Math.PI * 2
        });
      }
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
    if (idx >= BaristaWorkstation.SUGAR_STEPS.length - 1 || this.sugar === '100%') {
      this.addFloatingText('⚠️ Đã 100% Đường (Tối đa)!', '#ff6b81');
      return this.sugar;
    }
    const nextIdx = idx + 1;
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
    if (idx >= BaristaWorkstation.ICE_STEPS.length - 1 || this.ice === 'Đầy đá') {
      this.addFloatingText('⚠️ Đã Đầy Đá (Tối đa)!', '#ff6b81');
      return this.ice;
    }
    const nextIdx = idx + 1;
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
      cam_vang: 'Cam Vàng',
      sa_tuoi: 'Sả Tươi',
      suong_sao: 'Sương Sáo'
    };
    return map[key] || 'Topping';
  }

  setCupState(state) {
    this.cupState = state;
  }

  resetCupState() {
    this.cupState = 'empty';
  }

  resetCup() {
    this.tea = 'den';
    this.sugar = '0%';
    this.ice = 'Nóng';
    this.toppings = [];
    this.isShaken = false;
    this.cupState = 'empty';
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
      // Custom durations:
      // Shake: ~60 frames
      // Pour cup: ~50 frames
      // Seal cup: ~45 frames
      let step = 0.045;
      if (this.handAction === 'shake') step = 0.016;
      else if (this.handAction === 'pour_cup') step = 0.020;
      else if (this.handAction === 'seal_cup') step = 0.022;

      this.handProgress += step;
      if (this.handProgress >= 1.0) {
        if (this.handAction === 'pour_cup') {
          this.cupState = 'filled';
        } else if (this.handAction === 'seal_cup') {
          this.cupState = 'sealed';
        }
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

    // 4. Draw Central Barista Shaker (Bình Lắc Pha Chế Inox Chuyên Nghiệp)
    this.drawMixingBomb(ctx);

    // 5. Draw Takeaway Cup on Countertop (Ly Trà Sữa Mang Đi)
    this.drawTakeawayCup(ctx);

    // 6. Draw Floating Status & Notifications
    this.drawFloatingTexts(ctx);

    // 7. Draw First-Person Barista Animated Arm & Hand
    if (this.handAction === 'shake') {
      this.drawTwoHandedShake(ctx);
    } else if (this.handAction === 'pour_cup') {
      this.drawPourCupAnimation(ctx);
    } else if (this.handAction === 'seal_cup') {
      this.drawSealCupAnimation(ctx);
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
    const x = Math.max(76, Math.round(this.width * 0.19));
    const h = Math.min(135, Math.max(60, Math.round(this.height * 0.52)));
    const y = Math.max(16, Math.round(this.height * 0.48 - h * 0.5));
    const w = 16;

    // Meter background
    ctx.save();
    ctx.fillStyle = 'rgba(20, 10, 18, 0.82)';
    ctx.beginPath();
    ctx.roundRect(x, y, w, h, 6);
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
    ctx.roundRect(x + 2, y + h - 3 - fillH, w - 4, fillH, 4);
    ctx.fill();

    // Meter tick markers
    ctx.fillStyle = 'rgba(255, 255, 255, 0.4)';
    [0.1, 0.35, 0.58, 0.78, 0.95].forEach(t => {
      ctx.fillRect(x + 2, y + h - h * t, 4, 1);
    });

    // Label on top
    ctx.font = 'bold 11px "VT323", monospace, sans-serif';
    ctx.fillStyle = '#f4c430';
    ctx.textAlign = 'center';
    ctx.fillText('ĐƯỜNG', x + w * 0.5, y - 6);
    ctx.font = 'bold 12px "VT323", monospace, sans-serif';
    ctx.fillStyle = '#ffffff';
    ctx.fillText(this.sugar, x + w * 0.5, y + h + 13);
    ctx.restore();
  }

  drawIceMeter(ctx) {
    const w = 16;
    const x = Math.min(this.width - 92, Math.round(this.width * 0.81 - w));
    const h = Math.min(135, Math.max(60, Math.round(this.height * 0.52)));
    const y = Math.max(16, Math.round(this.height * 0.48 - h * 0.5));

    // Meter background
    ctx.save();
    ctx.fillStyle = 'rgba(20, 10, 18, 0.82)';
    ctx.beginPath();
    ctx.roundRect(x, y, w, h, 6);
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
    ctx.roundRect(x + 2, y + h - 3 - fillH, w - 4, fillH, 4);
    ctx.fill();

    // Meter tick markers
    ctx.fillStyle = 'rgba(255, 255, 255, 0.4)';
    [0.1, 0.38, 0.68, 0.95].forEach(t => {
      ctx.fillRect(x + w - 6, y + h - h * t, 4, 1);
    });

    // Label on top
    ctx.font = 'bold 11px "VT323", monospace, sans-serif';
    ctx.fillStyle = '#8be9fd';
    ctx.textAlign = 'center';
    ctx.fillText('ĐÁ', x + w * 0.5, y - 6);
    ctx.font = 'bold 12px "VT323", monospace, sans-serif';
    ctx.fillStyle = '#ffffff';
    ctx.fillText(this.ice, x + w * 0.5, y + h + 13);
    ctx.restore();
  }

  // --- BÌNH LẮC: NỘI DUNG CỬA SỔ KÍNH (Trà sữa, bọt kem, đá, trân châu nhìn qua kính) ---
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
      } else if (p.type === 'cam_vang') {
        ctx.fillStyle = '#ff9f43';
        ctx.beginPath();
        ctx.arc(px, py, 5.5, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = '#feca57';
        ctx.lineWidth = 1;
        ctx.stroke();
      } else if (p.type === 'sa_tuoi') {
        ctx.fillStyle = '#a8e6cf';
        ctx.fillRect(px - 4, py - 2, 8, 4);
        ctx.strokeStyle = '#1dd1a1';
        ctx.lineWidth = 0.8;
        ctx.strokeRect(px - 4, py - 2, 8, 4);
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

    // Special Effect: 24K Gold Flakes swirling in Shaker Window
    if (this.goldFlakes && this.goldFlakes.length > 0) {
      this.goldFlakes.forEach((gf, idx) => {
        let gx, gy;
        if (isSwirling) {
          const a = this.tick * 0.2 + idx * 0.9;
          const d = 6 + (idx % 3) * 6;
          gx = cx + Math.cos(a) * d;
          gy = cy + 4 + Math.sin(a) * (d * 0.7);
        } else {
          gx = cx + gf.x * 0.7;
          gy = cy + gf.y * 0.6 + Math.sin(this.tick * 0.05 + gf.sparklePhase) * 2;
        }
        ctx.save();
        ctx.translate(gx, gy);
        ctx.rotate(gf.rot + this.tick * gf.rotSpeed);
        // Rich 24K Gold Foil Flake
        const gGrad = ctx.createLinearGradient(-gf.size, -gf.size, gf.size, gf.size);
        gGrad.addColorStop(0, '#fff799');
        gGrad.addColorStop(0.4, '#ffd700');
        gGrad.addColorStop(0.8, '#d4af37');
        gGrad.addColorStop(1, '#b8860b');
        ctx.fillStyle = gGrad;
        ctx.fillRect(-gf.size * 0.5, -gf.size * 0.5, gf.size, gf.size * 0.8);

        // Specular gold sparkle star
        const sparkle = Math.sin(this.tick * 0.15 + gf.sparklePhase);
        if (sparkle > 0.6) {
          ctx.fillStyle = '#ffffff';
          ctx.fillRect(-0.8, -2.5, 1.6, 5);
          ctx.fillRect(-2.5, -0.8, 5, 1.6);
        }
        ctx.restore();
      });
    }

    // Special Effect: Nitro Cold Brew micro-bubbles swirling in Shaker Window
    if (this.nitroBubbles && this.nitroBubbles.length > 0) {
      ctx.fillStyle = 'rgba(255, 255, 255, 0.75)';
      this.nitroBubbles.forEach((nb, idx) => {
        let nx, ny;
        if (isSwirling) {
          const a = -this.tick * 0.25 + idx * 0.5;
          const d = 4 + (idx % 4) * 5;
          nx = cx + Math.cos(a) * d;
          ny = cy + 2 + Math.sin(a) * (d * 0.8);
        } else {
          nx = cx + nb.x * 0.7;
          const yOff = ((this.tick * nb.speed + idx * 4) % 36);
          ny = cy + r - 8 - yOff;
        }
        ctx.beginPath();
        ctx.arc(nx, ny, nb.size * 0.7, 0, Math.PI * 2);
        ctx.fill();
      });
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

  // --- BÌNH LẮC PHA CHẾ INOX CHUYÊN NGHIỆP (BARISTA STAINLESS STEEL SHAKER ON COUNTERTOP) ---
  drawMixingBomb(ctx) {
    const scale = Math.min(1.0, Math.max(0.72, this.height / 235));
    const cx = this.width * 0.5;
    const cy = this.height * 0.58;

    ctx.save();
    if (this.handAction === 'shake' || this.handAction === 'pour_cup') {
      ctx.globalAlpha = 0.22; // Dim countertop shaker while being handled in foreground
    }

    const shakerBaseW = 44 * scale;
    const shakerShoulderW = 54 * scale;
    const shakerBodyH = 70 * scale;
    const baseY = cy + 44 * scale; // bottom of canister
    const shoulderY = baseY - shakerBodyH; // top of canister
    const lidH = 24 * scale; // strainer lid
    const lidY = shoulderY - lidH;
    const capH = 16 * scale; // top cap
    const capY = lidY - capH;

    // 1. Soft Counter Shadow
    ctx.fillStyle = 'rgba(0, 0, 0, 0.45)';
    ctx.beginPath();
    ctx.ellipse(cx, baseY + 4, shakerBaseW * 0.6, 7 * scale, 0, 0, Math.PI * 2);
    ctx.fill();

    // 2. Anti-slip Base Ring (Silicone + Brushed Gold Accent)
    const baseGrad = ctx.createLinearGradient(cx - 24, 0, cx + 24, 0);
    baseGrad.addColorStop(0, '#1e293b');
    baseGrad.addColorStop(0.3, '#334155');
    baseGrad.addColorStop(0.5, '#475569');
    baseGrad.addColorStop(0.7, '#334155');
    baseGrad.addColorStop(1, '#0f172a');
    ctx.fillStyle = baseGrad;
    ctx.beginPath();
    ctx.roundRect(cx - 23, baseY - 4, 46, 8, [2, 2, 4, 4]);
    ctx.fill();
    ctx.strokeStyle = '#d4af37';
    ctx.lineWidth = 1;
    ctx.stroke();

    // 3. Shaker Main Canister Body (Thân Bình Inox 304 Phản Chiếu Ánh Kim)
    const steelGrad = ctx.createLinearGradient(cx - shakerShoulderW * 0.5, 0, cx + shakerShoulderW * 0.5, 0);
    steelGrad.addColorStop(0, '#475569');
    steelGrad.addColorStop(0.12, '#94a3b8');
    steelGrad.addColorStop(0.28, '#ffffff'); // crisp specular chrome shine
    steelGrad.addColorStop(0.48, '#cbd5e1');
    steelGrad.addColorStop(0.7, '#64748b');
    steelGrad.addColorStop(0.88, '#e2e8f0');
    steelGrad.addColorStop(1, '#334155');
    ctx.fillStyle = steelGrad;

    ctx.beginPath();
    ctx.moveTo(cx - shakerBaseW * 0.5, baseY);
    ctx.lineTo(cx + shakerBaseW * 0.5, baseY);
    ctx.lineTo(cx + shakerShoulderW * 0.5, shoulderY);
    ctx.lineTo(cx - shakerShoulderW * 0.5, shoulderY);
    ctx.closePath();
    ctx.fill();

    // Brushed metal rim stroke
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.4)';
    ctx.lineWidth = 1.0;
    ctx.stroke();

    // Fine brushed lathe reflection rings
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.15)';
    ctx.lineWidth = 0.8;
    for (let ly = baseY - 12; ly > shoulderY + 8; ly -= 14) {
      ctx.beginPath();
      ctx.moveTo(cx - shakerShoulderW * 0.45, ly);
      ctx.lineTo(cx + shakerShoulderW * 0.45, ly);
      ctx.stroke();
    }

    // Measurement Volume Ticks on right side (150ml, 300ml, 500ml)
    ctx.fillStyle = 'rgba(255, 255, 255, 0.55)';
    ctx.font = '8px "VT323", monospace, sans-serif';
    ctx.textAlign = 'right';
    [
      { y: baseY - 15, txt: '150ml' },
      { y: baseY - 35, txt: '300ml' },
      { y: baseY - 55, txt: '500ml' }
    ].forEach(m => {
      ctx.fillRect(cx + shakerShoulderW * 0.38, m.y, 5, 1);
      ctx.fillText(m.txt, cx + shakerShoulderW * 0.36, m.y + 3);
    });

    // 4. Central Crystal Capsule Window (Cửa Sổ Kính Pha Chế Trong Suốt)
    const winR = 24;
    const winY = cy + 10;

    // Gold Bezel Frame around window
    const winFrameGrad = ctx.createLinearGradient(cx - winR - 4, 0, cx + winR + 4, 0);
    winFrameGrad.addColorStop(0, '#785422');
    winFrameGrad.addColorStop(0.3, '#d4af37');
    winFrameGrad.addColorStop(0.5, '#fef08a');
    winFrameGrad.addColorStop(0.7, '#d4af37');
    winFrameGrad.addColorStop(1, '#533814');
    ctx.fillStyle = winFrameGrad;
    ctx.beginPath();
    ctx.arc(cx, winY, winR + 3, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#2f3542';
    ctx.lineWidth = 1;
    ctx.stroke();

    // Draw Liquid contents inside the shaker window!
    this.drawBombContents(ctx, cx, winY, winR, false);

    // 5. Shoulder Band & Knurled Strainer Collar (Cổ Nắp Lưới Lọc)
    const collarGrad = ctx.createLinearGradient(cx - 24, 0, cx + 24, 0);
    collarGrad.addColorStop(0, '#64748b');
    collarGrad.addColorStop(0.3, '#e2e8f0');
    collarGrad.addColorStop(0.5, '#ffffff');
    collarGrad.addColorStop(0.7, '#94a3b8');
    collarGrad.addColorStop(1, '#475569');
    ctx.fillStyle = collarGrad;

    // Domed shoulder
    ctx.beginPath();
    ctx.moveTo(cx - shakerShoulderW * 0.5, shoulderY);
    ctx.quadraticCurveTo(cx - 20, shoulderY - 6, cx - 18, lidY + 6);
    ctx.lineTo(cx + 18, lidY + 6);
    ctx.quadraticCurveTo(cx + 20, shoulderY - 6, cx + shakerShoulderW * 0.5, shoulderY);
    ctx.closePath();
    ctx.fill();
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.4)';
    ctx.stroke();

    // Gold accent trim line
    ctx.strokeStyle = '#d4af37';
    ctx.lineWidth = 1.4;
    ctx.beginPath();
    ctx.moveTo(cx - shakerShoulderW * 0.5 + 2, shoulderY - 1);
    ctx.lineTo(cx + shakerShoulderW * 0.5 - 2, shoulderY - 1);
    ctx.stroke();

    // Strainer collar cylinder
    ctx.fillStyle = collarGrad;
    ctx.beginPath();
    ctx.roundRect(cx - 16, lidY, 32, 8, 2);
    ctx.fill();
    ctx.strokeStyle = '#334155';
    ctx.lineWidth = 0.8;
    ctx.stroke();

    // 6. Shaker Top Cap (Nắp Đậy Nhỏ Đỉnh Bình)
    const capGrad = ctx.createLinearGradient(cx - 14, 0, cx + 14, 0);
    capGrad.addColorStop(0, '#475569');
    capGrad.addColorStop(0.25, '#cbd5e1');
    capGrad.addColorStop(0.5, '#ffffff');
    capGrad.addColorStop(0.75, '#94a3b8');
    capGrad.addColorStop(1, '#334155');
    ctx.fillStyle = capGrad;

    ctx.beginPath();
    ctx.moveTo(cx - 13, lidY);
    ctx.lineTo(cx - 11, capY + 4);
    ctx.quadraticCurveTo(cx, capY - 3, cx + 11, capY + 4);
    ctx.lineTo(cx + 13, lidY);
    ctx.closePath();
    ctx.fill();
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.5)';
    ctx.lineWidth = 1;
    ctx.stroke();

    // Gold Finial Bead on top of cap
    ctx.fillStyle = '#fef08a';
    ctx.beginPath();
    ctx.arc(cx, capY - 1, 3.5, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#b8860b';
    ctx.lineWidth = 0.8;
    ctx.stroke();

    // Steam vapor if hot drink
    if (this.ice === 'Nóng') {
      this.steamParticles.forEach(p => {
        ctx.fillStyle = `rgba(255, 255, 255, ${p.alpha})`;
        ctx.beginPath();
        ctx.arc(p.x, p.y - 18, p.r, 0, Math.PI * 2);
        ctx.fill();
      });
    }

    // 7. Laser-Etched Brand Inscription
    ctx.font = 'bold 8.5px "VT323", monospace, sans-serif';
    ctx.fillStyle = '#f4c430';
    ctx.textAlign = 'center';
    ctx.fillText('✨ HEEHEE BARISTA SHAKER ✨', cx, shoulderY + 8);

    ctx.restore();
  }

  // --- TAKEAWAY CUP ON COUNTERTOP (LY TRÀ SỮA MANG ĐI TRÊN QUẦY PHA CHẾ) ---
  drawTakeawayCup(ctx) {
    const scale = Math.min(1.0, Math.max(0.72, this.height / 235));
    const cx = this.width * 0.5;
    const cy = this.height * 0.58;
    const cupX = Math.min(this.width - 56, cx + 82 * scale);
    const cupY = cy + 22 * scale; // base of cup on counter
    const cupH = 46 * scale;
    const cupTopY = cupY - cupH;
    const topR = 16 * scale;
    const botR = 11 * scale;

    ctx.save();

    // 1. Soft Counter Shadow & Cork Coaster
    ctx.fillStyle = 'rgba(0, 0, 0, 0.4)';
    ctx.beginPath();
    ctx.ellipse(cupX, cupY + 4, botR + 8, 4.5, 0, 0, Math.PI * 2);
    ctx.fill();

    // Cork Coaster
    const coasterGrad = ctx.createLinearGradient(cupX - botR - 6, 0, cupX + botR + 6, 0);
    coasterGrad.addColorStop(0, '#7c532b');
    coasterGrad.addColorStop(0.5, '#ba8a5b');
    coasterGrad.addColorStop(1, '#66421f');
    ctx.fillStyle = coasterGrad;
    ctx.beginPath();
    ctx.ellipse(cupX, cupY + 3, botR + 7, 5, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#4e3116';
    ctx.lineWidth = 1;
    ctx.stroke();

    // 2. Liquid Contents Calculation
    let fillRatio = 0;
    if (this.cupState === 'filled' || this.cupState === 'sealed') {
      fillRatio = 0.86;
    } else if (this.handAction === 'pour_cup') {
      // Liquid rises dynamically during pouring!
      fillRatio = Math.max(0, Math.min(0.86, (this.handProgress - 0.22) / 0.68 * 0.86));
    }

    // 3. Clear Acrylic Cup Body (Trapezoid Clip for Liquid)
    if (fillRatio > 0) {
      ctx.save();
      // Clip inside cup
      ctx.beginPath();
      ctx.moveTo(cupX - topR + 1, cupTopY + 2);
      ctx.lineTo(cupX + topR - 1, cupTopY + 2);
      ctx.lineTo(cupX + botR - 1, cupY);
      ctx.lineTo(cupX - botR + 1, cupY);
      ctx.closePath();
      ctx.clip();

      const liquidH = cupH * fillRatio;
      const liquidTop = cupY - liquidH;
      const tCol = BaristaWorkstation.TEA_COLORS[this.tea] || BaristaWorkstation.TEA_COLORS.den;

      // Milk tea gradient
      const teaGrad = ctx.createLinearGradient(0, cupY, 0, liquidTop);
      teaGrad.addColorStop(0, tCol.base);
      teaGrad.addColorStop(0.5, tCol.mid);
      teaGrad.addColorStop(0.88, tCol.light);
      teaGrad.addColorStop(1, tCol.cream);
      ctx.fillStyle = teaGrad;
      ctx.fillRect(cupX - topR - 2, liquidTop, (topR + 2) * 2, liquidH + 10);

      // Fresh Milk tiger brown sugar syrup streaks along cup wall
      if (this.tea === 'sua_tuoi') {
        ctx.fillStyle = '#6e2c00';
        ctx.beginPath();
        ctx.moveTo(cupX - botR + 2, cupY);
        ctx.quadraticCurveTo(cupX - botR + 5, cupY - liquidH * 0.6, cupX - topR * 0.7, liquidTop + 4);
        ctx.quadraticCurveTo(cupX - botR + 7, cupY - liquidH * 0.4, cupX - botR + 6, cupY);
        ctx.fill();

        ctx.beginPath();
        ctx.moveTo(cupX + botR - 2, cupY);
        ctx.quadraticCurveTo(cupX + botR - 5, cupY - liquidH * 0.55, cupX + topR * 0.65, liquidTop + 6);
        ctx.quadraticCurveTo(cupX + botR - 7, cupY - liquidH * 0.35, cupX + botR - 5, cupY);
        ctx.fill();
      }

      // Meniscus ellipse
      const menW = botR + (topR - botR) * fillRatio;
      ctx.fillStyle = tCol.cream;
      ctx.beginPath();
      ctx.ellipse(cupX, liquidTop, menW, 3.5, 0, 0, Math.PI * 2);
      ctx.fill();

      // Diverse Artisanal Toppings in Takeaway Cup
      if (this.toppings && this.toppings.length > 0) {
        const totalItems = Math.min(16, this.toppings.length * 6);
        for (let i = 0; i < totalItems; i++) {
          const tType = this.toppings[i % this.toppings.length];
          const px = cupX + ((i * 7 + 4) % Math.max(1, botR * 1.6)) - botR * 0.8;
          const py = cupY - 4 - Math.floor(i / 4) * 5;

          if (tType === 'thach_la_dua') {
            // Pandan Jelly: Translucent emerald jade cube
            ctx.fillStyle = 'rgba(46, 204, 113, 0.92)';
            ctx.fillRect(px - 3.5, py - 3.5, 7, 7);
            ctx.strokeStyle = '#a8e6cf';
            ctx.lineWidth = 0.6;
            ctx.strokeRect(px - 3.5, py - 3.5, 7, 7);
          } else if (tType === 'dao_mieng') {
            // Peach slice crescent
            ctx.fillStyle = '#f39c12';
            ctx.beginPath();
            ctx.ellipse(px, py, 5.5, 3.2, 0.35, 0, Math.PI * 2);
            ctx.fill();
            ctx.strokeStyle = '#f1c40f';
            ctx.lineWidth = 0.6;
            ctx.stroke();
          } else if (tType === 'cam_vang') {
            // Citrus orange slice
            ctx.fillStyle = '#ff9f43';
            ctx.beginPath();
            ctx.arc(px, py, 4.5, 0, Math.PI * 2);
            ctx.fill();
            ctx.strokeStyle = '#feca57';
            ctx.lineWidth = 0.8;
            ctx.stroke();
          } else if (tType === 'sa_tuoi') {
            // Fresh lemongrass sliver
            ctx.fillStyle = '#a8e6cf';
            ctx.fillRect(px - 4, py - 1.5, 8, 3.2);
            ctx.strokeStyle = '#1dd1a1';
            ctx.lineWidth = 0.6;
            ctx.strokeRect(px - 4, py - 1.5, 8, 3.2);
          } else if (tType === 'suong_sao') {
            // Grass jelly: Glossy onyx cube
            ctx.fillStyle = '#111111';
            ctx.fillRect(px - 4, py - 3.5, 8, 7);
            ctx.fillStyle = 'rgba(255, 255, 255, 0.4)';
            ctx.fillRect(px - 3, py - 2.5, 3, 1);
          } else if (tType === 'tranchau_duongden') {
            // Tiger brown sugar boba pearl
            ctx.fillStyle = '#2b1307';
            ctx.beginPath();
            ctx.arc(px, py, 2.9, 0, Math.PI * 2);
            ctx.fill();
            ctx.strokeStyle = '#d35400';
            ctx.lineWidth = 0.5;
            ctx.stroke();
            ctx.fillStyle = '#ffffff';
            ctx.beginPath();
            ctx.arc(px - 0.9, py - 0.9, 0.8, 0, Math.PI * 2);
            ctx.fill();
          } else {
            // Classic black tapioca pearl
            ctx.fillStyle = '#140c14';
            ctx.beginPath();
            ctx.arc(px, py, 2.8, 0, Math.PI * 2);
            ctx.fill();
            ctx.fillStyle = '#ffffff';
            ctx.beginPath();
            ctx.arc(px - 0.8, py - 0.8, 0.8, 0, Math.PI * 2);
            ctx.fill();
          }
        }
      }

      // Special Drink FX: Trà Sữa Dát Vàng (24K Gold Flakes & Shimmering Glints)
      if (this.isGoldLeafRecipe()) {
        const goldCount = 8;
        for (let g = 0; g < goldCount; g++) {
          const gx = cupX - botR * 0.7 + ((g * 9 + 5) % Math.max(1, botR * 1.5));
          const gy = liquidTop + 4 + (g % 4) * 8;
          ctx.save();
          ctx.translate(gx, gy);
          ctx.rotate(this.tick * 0.02 + g);
          const gGrad = ctx.createLinearGradient(-2, -2, 2, 2);
          gGrad.addColorStop(0, '#fff799');
          gGrad.addColorStop(0.5, '#ffd700');
          gGrad.addColorStop(1, '#b8860b');
          ctx.fillStyle = gGrad;
          ctx.fillRect(-1.8, -1.8, 3.6, 2.8);

          // Specular golden star sparkle
          const spk = Math.sin(this.tick * 0.12 + g * 1.2);
          if (spk > 0.6) {
            ctx.fillStyle = '#ffffff';
            ctx.fillRect(-0.5, -2.5, 1, 5);
            ctx.fillRect(-2.5, -0.5, 5, 1);
          }
          ctx.restore();
        }
      }

      // Special Drink FX: Nitro Cold Brew (Velvety Crema Head & Cascading Micro-bubbles)
      if (this.isNitroRecipe()) {
        // Velvet nitro microfoam head
        ctx.fillStyle = '#fdf6e2';
        ctx.beginPath();
        ctx.ellipse(cupX, liquidTop + 2, menW - 0.5, 4.2, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = '#faebd7';
        ctx.lineWidth = 0.8;
        ctx.stroke();

        // Downward cascading micro-bubble streams (reverse cascade)
        ctx.fillStyle = 'rgba(255, 255, 255, 0.65)';
        for (let nb = 0; nb < 14; nb++) {
          const nx = cupX - menW * 0.7 + (nb * 5) % (menW * 1.4);
          const ny = liquidTop + 6 + ((this.tick * 0.6 + nb * 7) % Math.max(1, liquidH * 0.7));
          ctx.beginPath();
          ctx.arc(nx, ny, 0.8, 0, Math.PI * 2);
          ctx.fill();
        }
      }

      // Special Drink FX: Trà Sen Tây Hồ (Floating Pink Lotus Petal)
      if (this.isLotusRecipe()) {
        const lx = cupX - 3;
        const ly = liquidTop + 1.5;
        ctx.save();
        ctx.translate(lx, ly);
        ctx.rotate(-0.2 + Math.sin(this.tick * 0.04) * 0.1);
        ctx.fillStyle = '#ff79c6';
        ctx.beginPath();
        ctx.ellipse(0, 0, 5, 2.5, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = '#ffb8b8';
        ctx.beginPath();
        ctx.ellipse(1, 0, 3, 1.4, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      }

      // Special Drink FX: Trà Sữa Kem Khò Bánh Bỏng (Torched Brulee Crust & Crispy Rice)
      if (this.isBruleeRecipe()) {
        // Thick cheese foam crown
        ctx.fillStyle = '#fffbe7';
        ctx.beginPath();
        ctx.ellipse(cupX, liquidTop + 2, menW - 0.5, 4.5, 0, 0, Math.PI * 2);
        ctx.fill();

        // Caramelized torched brulee scorch spots
        ctx.fillStyle = '#873600';
        ctx.beginPath();
        ctx.ellipse(cupX - 4, liquidTop + 1.5, 3.2, 1.4, 0.2, 0, Math.PI * 2);
        ctx.ellipse(cupX + 4, liquidTop + 2.5, 2.8, 1.2, -0.3, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = '#d35400';
        ctx.beginPath();
        ctx.ellipse(cupX, liquidTop + 2, 2, 0.9, 0, 0, Math.PI * 2);
        ctx.fill();

        // Crispy golden cereal pops
        ctx.fillStyle = '#f39c12';
        [-6, -1, 5].forEach((popX, idx) => {
          ctx.fillRect(cupX + popX, liquidTop + (idx % 2), 1.8, 1.8);
        });
      }

      // Ice cubes in cup
      if (this.ice !== 'Nóng' && fillRatio > 0.4) {
        const iceCount = this.ice === 'Ít đá' ? 1 : (this.ice === 'Vừa đá' ? 2 : 3);
        for (let i = 0; i < iceCount; i++) {
          const ix = cupX - 6 + i * 7;
          const iy = liquidTop + 5 + (i % 2) * 4;
          ctx.fillStyle = 'rgba(220, 248, 255, 0.75)';
          ctx.beginPath();
          ctx.roundRect(ix - 4, iy - 4, 8, 7, 2);
          ctx.fill();
          ctx.strokeStyle = 'rgba(255, 255, 255, 0.9)';
          ctx.lineWidth = 0.8;
          ctx.stroke();
        }
      }

      ctx.restore();
    }

    // 4. Transparent Plastic Cup Shell & Highlights
    ctx.save();
    const cupGrad = ctx.createLinearGradient(cupX - topR, 0, cupX + topR, 0);
    cupGrad.addColorStop(0, 'rgba(255, 255, 255, 0.45)');
    cupGrad.addColorStop(0.2, 'rgba(220, 240, 255, 0.15)');
    cupGrad.addColorStop(0.7, 'rgba(255, 255, 255, 0.08)');
    cupGrad.addColorStop(0.9, 'rgba(255, 255, 255, 0.35)');
    cupGrad.addColorStop(1, 'rgba(255, 255, 255, 0.55)');
    ctx.fillStyle = cupGrad;

    ctx.beginPath();
    ctx.moveTo(cupX - topR, cupTopY);
    ctx.lineTo(cupX + topR, cupTopY);
    ctx.lineTo(cupX + botR, cupY);
    ctx.ellipse(cupX, cupY, botR, 3, 0, 0, Math.PI);
    ctx.lineTo(cupX - topR, cupTopY);
    ctx.closePath();
    ctx.fill();

    // Cup outline
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.6)';
    ctx.lineWidth = 1.2;
    ctx.stroke();

    // Vertical gloss streak reflection
    ctx.fillStyle = 'rgba(255, 255, 255, 0.38)';
    ctx.beginPath();
    ctx.moveTo(cupX - topR * 0.7, cupTopY + 5);
    ctx.lineTo(cupX - topR * 0.55, cupTopY + 5);
    ctx.lineTo(cupX - botR * 0.55, cupY - 5);
    ctx.lineTo(cupX - botR * 0.7, cupY - 5);
    ctx.closePath();
    ctx.fill();

    // Cup Top Rolled Lip Rim
    ctx.fillStyle = 'rgba(255, 255, 255, 0.85)';
    ctx.beginPath();
    ctx.ellipse(cupX, cupTopY, topR, 4, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = 'rgba(200, 225, 245, 0.9)';
    ctx.lineWidth = 1.0;
    ctx.stroke();

    ctx.restore();

    // 5. Sealed Film Lid & Straw (If sealed)
    if (this.cupState === 'sealed') {
      ctx.save();
      // Heat-sealed plastic membrane film
      const filmGrad = ctx.createRadialGradient(cupX, cupTopY, 2, cupX, cupTopY, topR);
      filmGrad.addColorStop(0, 'rgba(255, 255, 255, 0.95)');
      filmGrad.addColorStop(0.6, 'rgba(240, 250, 255, 0.75)');
      filmGrad.addColorStop(1, 'rgba(254, 240, 138, 0.9)');
      ctx.fillStyle = filmGrad;

      ctx.beginPath();
      ctx.ellipse(cupX, cupTopY, topR + 1.2, 4.8, 0, 0, Math.PI * 2);
      ctx.fill();

      // Golden heat-crimp edge seal
      ctx.strokeStyle = '#f4c430';
      ctx.lineWidth = 1.8;
      ctx.stroke();

      // Mini HeeHee seal print logo on the film
      ctx.fillStyle = '#ff79c6';
      ctx.beginPath();
      ctx.arc(cupX, cupTopY, 3.2, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 6px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('H', cupX, cupTopY + 2.2);

      // Boba Giant Straw piercing through sealed film!
      const strawX = cupX + 4;
      const strawY = cupTopY;
      ctx.save();
      ctx.translate(strawX, strawY);
      ctx.rotate(-0.25); // ~15 deg tilt

      // Straw tube
      const strawGrad = ctx.createLinearGradient(-3.5, 0, 3.5, 0);
      strawGrad.addColorStop(0, '#f59e0b');
      strawGrad.addColorStop(0.5, '#fbbf24');
      strawGrad.addColorStop(1, '#d97706');
      ctx.fillStyle = strawGrad;
      // Below lid inside drink
      ctx.fillRect(-3.5, 0, 7, 26);
      // Above lid
      ctx.fillRect(-3.5, -24, 7, 24);

      // Red spiral candy stripe on straw
      ctx.strokeStyle = '#ef4444';
      ctx.lineWidth = 2.2;
      for (let sY = -22; sY < 20; sY += 8) {
        ctx.beginPath();
        ctx.moveTo(-3.5, sY);
        ctx.lineTo(3.5, sY + 4);
        ctx.stroke();
      }

      // Top oval cut of straw
      ctx.fillStyle = '#fffbeb';
      ctx.beginPath();
      ctx.ellipse(0, -24, 3.5, 1.8, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();

      // Sparkles around freshly sealed cup
      ctx.fillStyle = '#fef08a';
      const sparkA = this.tick * 0.1;
      [-1, 1].forEach((dir, idx) => {
        const sx = cupX + dir * 16 + Math.cos(sparkA + idx) * 3;
        const sy = cupTopY - 8 + Math.sin(sparkA + idx) * 3;
        ctx.beginPath();
        ctx.arc(sx, sy, 1.8, 0, Math.PI * 2);
        ctx.fill();
      });

      ctx.restore();
    }

    // 6. Label & Indicator above the cup
    ctx.save();
    ctx.textAlign = 'center';
    ctx.font = 'bold 11px "VT323", monospace, sans-serif';
    if (this.cupState === 'empty') {
      ctx.fillStyle = 'rgba(255, 255, 255, 0.45)';
      ctx.fillText('[ CỐC TRỐNG ]', cupX, cupTopY - 8);
    } else if (this.cupState === 'filled') {
      ctx.fillStyle = '#f4c430';
      ctx.fillText('🧋 ĐÃ RÓT TRÀ', cupX, cupTopY - 8);
    } else if (this.cupState === 'sealed') {
      ctx.fillStyle = '#50fa7b';
      ctx.fillText('✨ ĐÃ DẬP NẮP', cupX, cupTopY - 8);
    }
    ctx.restore();

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

      // Mini sealed takeaway cup sitting on the tray
      const tCol = BaristaWorkstation.TEA_COLORS[this.tea] || BaristaWorkstation.TEA_COLORS.den;
      // Cup body with tea
      ctx.fillStyle = tCol.mid;
      ctx.beginPath();
      ctx.moveTo(-38, 10);
      ctx.lineTo(-26, 10);
      ctx.lineTo(-24, -12);
      ctx.lineTo(-40, -12);
      ctx.closePath();
      ctx.fill();
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.7)';
      ctx.lineWidth = 0.8;
      ctx.stroke();

      // Sealed film on cup top
      ctx.fillStyle = '#fef08a';
      ctx.beginPath();
      ctx.ellipse(-32, -12, 8, 2.5, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = '#f4c430';
      ctx.lineWidth = 1.2;
      ctx.stroke();

      // Boba straw
      ctx.strokeStyle = '#f59e0b';
      ctx.lineWidth = 2.2;
      ctx.beginPath();
      ctx.moveTo(-31, -12);
      ctx.lineTo(-28, -26);
      ctx.stroke();

      // Sparkles & stars
      ctx.fillStyle = '#ffd700';
      ctx.beginPath();
      ctx.arc(-48, -14, 3, 0, Math.PI * 2);
      ctx.arc(-18, -20, 2.5, 0, Math.PI * 2);
      ctx.arc(-32, -28, 2, 0, Math.PI * 2);
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

  // --- TWO-HANDED BARISTA SHAKER ANIMATION (KỸ THUẬT LẮC BÌNH BARISTA CHUYÊN NGHIỆP) ---
  drawTwoHandedShake(ctx) {
    const p = this.handProgress; // 0.0 -> 1.0
    const rampIn = Math.min(1, p * 5.5);
    const rampOut = Math.min(1, (1 - p) * 5.5);
    const intensity = Math.sin(Math.min(rampIn, rampOut) * Math.PI * 0.5);

    const cx = this.width * 0.5;
    const cy = this.height * 0.46;

    // Ergonomic Shaking Physics (Rhythmic 60fps rapid vibration)
    const shakeCycle = this.tick * 0.95;
    const shakeX = Math.sin(shakeCycle) * 14 * intensity;
    const shakeY = Math.cos(shakeCycle * 1.3) * 18 * intensity;
    const shakeRot = Math.sin(shakeCycle) * 0.18 * intensity;

    // 1. Dynamic Speed Lines / Motion Streaks radiating around the shaker
    if (intensity > 0.4) {
      ctx.save();
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.55)';
      ctx.lineWidth = 2.0;
      for (let i = 0; i < 4; i++) {
        const lineOffset = ((this.tick * 6 + i * 25) % 80) - 40;
        const ly = cy + shakeY + lineOffset;
        ctx.beginPath();
        ctx.moveTo(cx - 55 - Math.random() * 18, ly);
        ctx.lineTo(cx - 32, ly);
        ctx.moveTo(cx + 32, ly);
        ctx.lineTo(cx + 55 + Math.random() * 18, ly);
        ctx.stroke();
      }
      ctx.restore();
    }

    // 2. Chilly Frost Mist & Condensation Vapor
    this.frostParticles.forEach(fp => {
      ctx.save();
      ctx.fillStyle = `rgba(180, 235, 255, ${fp.alpha})`;
      ctx.beginPath();
      ctx.arc(fp.x, fp.y, fp.r, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    });

    // 3. LEFT ARM (reaches from bottom-left corner to cup base of shaker)
    const leftBaseX = this.width * 0.06;
    const leftBaseY = this.height + 40;
    const leftWristX = cx - 18 + shakeX * 0.8;
    const leftWristY = cy + 42 + shakeY * 0.8;
    this.drawRealisticArm(ctx, leftBaseX, leftBaseY, leftWristX, leftWristY, 'left');

    // 4. RIGHT ARM (reaches from bottom-right corner to TOP CAP of shaker - chuẩn kỹ thuật giữ nắp!)
    const rightBaseX = this.width * 0.94;
    const rightBaseY = this.height + 40;
    const rightWristX = cx + 8 + shakeX * 0.8;
    const rightWristY = cy - 44 + shakeY * 0.8;
    this.drawRealisticArm(ctx, rightBaseX, rightBaseY, rightWristX, rightWristY, 'right');

    // 5. THE HERO BARISTA STAINLESS STEEL SHAKER IN ACTION!
    ctx.save();
    ctx.translate(cx + shakeX, cy + shakeY);
    ctx.rotate(shakeRot);

    const sBaseW = 40;
    const sShoulderW = 50;
    const sBodyH = 68;
    const sBaseY = 44;
    const sShoulderY = sBaseY - sBodyH;
    const sLidY = sShoulderY - 24;
    const sCapY = sLidY - 16;

    // A. Main Stainless Steel Shaker Body
    const shakerGrad = ctx.createLinearGradient(-sShoulderW * 0.5, 0, sShoulderW * 0.5, 0);
    shakerGrad.addColorStop(0, '#475569');
    shakerGrad.addColorStop(0.12, '#94a3b8');
    shakerGrad.addColorStop(0.28, '#ffffff'); // bright metallic reflection
    shakerGrad.addColorStop(0.48, '#cbd5e1');
    shakerGrad.addColorStop(0.7, '#64748b');
    shakerGrad.addColorStop(0.88, '#e2e8f0');
    shakerGrad.addColorStop(1, '#334155');
    ctx.fillStyle = shakerGrad;

    ctx.beginPath();
    ctx.moveTo(-sBaseW * 0.5, sBaseY);
    ctx.lineTo(sBaseW * 0.5, sBaseY);
    ctx.lineTo(sShoulderW * 0.5, sShoulderY);
    ctx.lineTo(-sShoulderW * 0.5, sShoulderY);
    ctx.closePath();
    ctx.fill();
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.45)';
    ctx.lineWidth = 1.0;
    ctx.stroke();

    // B. Inspection Crystal Porthole with Swirling Milk Tea Vortex!
    const winR = 20;
    const winY = 10;
    ctx.save();
    ctx.fillStyle = '#d4af37';
    ctx.beginPath();
    ctx.arc(0, winY, winR + 2.5, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();

    this.drawBombContents(ctx, 0, winY, winR, true);

    // C. Shoulder & Built-in Strainer Lid
    ctx.fillStyle = shakerGrad;
    ctx.beginPath();
    ctx.moveTo(-sShoulderW * 0.5, sShoulderY);
    ctx.quadraticCurveTo(-18, sShoulderY - 6, -16, sLidY + 4);
    ctx.lineTo(16, sLidY + 4);
    ctx.quadraticCurveTo(18, sShoulderY - 6, sShoulderW * 0.5, sShoulderY);
    ctx.closePath();
    ctx.fill();
    ctx.strokeStyle = '#d4af37';
    ctx.lineWidth = 1.2;
    ctx.stroke();

    // D. Top Cap (Nắp đậy nhỏ)
    ctx.fillStyle = shakerGrad;
    ctx.beginPath();
    ctx.moveTo(-12, sLidY);
    ctx.lineTo(-10, sCapY + 4);
    ctx.quadraticCurveTo(0, sCapY - 2, 10, sCapY + 4);
    ctx.lineTo(12, sLidY);
    ctx.closePath();
    ctx.fill();
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.6)';
    ctx.stroke();

    // Gold finial bead
    ctx.fillStyle = '#fef08a';
    ctx.beginPath();
    ctx.arc(0, sCapY, 3, 0, Math.PI * 2);
    ctx.fill();

    ctx.restore(); // Restore shaker transform

    // 6. LEFT HAND CUPPING & SUPPORTING THE SHAKER BASE
    ctx.save();
    ctx.translate(leftWristX, leftWristY);
    ctx.rotate(0.25 + shakeRot * 0.4);

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

    // 7. RIGHT HAND FIRMLY PRESSING DOWN ON TOP CAP (KỸ THUẬT BARISTA CHUẨN)
    ctx.save();
    ctx.translate(rightWristX, rightWristY);
    ctx.rotate(-0.85 + shakeRot * 0.4);

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

    // 8. "LẮC BÌNH PHA CHẾ!" Dramatic Banner
    ctx.save();
    ctx.font = 'bold 22px "VT323", monospace, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillStyle = '#f4c430';
    ctx.shadowColor = 'rgba(0,0,0,0.9)';
    ctx.shadowBlur = 8;
    ctx.fillText('🍸✨ ĐANG LẮC BÌNH PHA CHẾ! ✨🍸', cx + shakeX, cy - 72 + shakeY);
    ctx.restore();
  }

  // --- POUR MILK TEA FROM SHAKER INTO TAKEAWAY CUP (RÓT TRÀ SỮA TỪ BÌNH LẮC VÀO CỐC) ---
  drawPourCupAnimation(ctx) {
    const p = this.handProgress; // 0.0 -> 1.0
    const cx = this.width * 0.5;
    const cy = this.height * 0.56;
    const cupX = Math.min(this.width - 66, cx + 86);
    const cupTopY = this.height * 0.62 + 22 - 50;

    // Tilt angle ramps up to ~38 degrees then returns smoothly
    const curve = Math.sin(p * Math.PI); // 0 -> 1 -> 0
    const tilt = curve * 0.65; // ~37 degrees tilt

    // Shaker center shifts slightly towards the cup
    const shakerX = cx + curve * 30;
    const shakerY = cy - curve * 12;

    // 1. Draw Left Arm reaching to base canister of shaker
    const leftBaseX = this.width * 0.06;
    const leftBaseY = this.height + 40;
    const leftWristX = shakerX - 32 + Math.cos(tilt) * -10;
    const leftWristY = shakerY + 28 + Math.sin(tilt) * -10;
    this.drawRealisticArm(ctx, leftBaseX, leftBaseY, leftWristX, leftWristY, 'left');

    // 2. Draw Right Arm reaching to shoulder of shaker
    const rightBaseX = this.width * 0.94;
    const rightBaseY = this.height + 40;
    const rightWristX = shakerX + 26 + Math.cos(tilt) * 12;
    const rightWristY = shakerY - 10 + Math.sin(tilt) * 12;
    this.drawRealisticArm(ctx, rightBaseX, rightBaseY, rightWristX, rightWristY, 'right');

    // 3. Draw Tilted Barista Stainless Steel Shaker (Nắp nhỏ đã mở, để lộ nắp lưới lọc rót trà!)
    ctx.save();
    ctx.translate(shakerX, shakerY);
    ctx.rotate(tilt);

    const sBaseW = 38;
    const sShoulderW = 48;
    const sBodyH = 65;
    const sBaseY = 40;
    const sShoulderY = sBaseY - sBodyH;
    const sLidY = sShoulderY - 22;

    // A. Stainless steel canister
    const steelGrad = ctx.createLinearGradient(-sShoulderW * 0.5, 0, sShoulderW * 0.5, 0);
    steelGrad.addColorStop(0, '#475569');
    steelGrad.addColorStop(0.15, '#94a3b8');
    steelGrad.addColorStop(0.3, '#ffffff');
    steelGrad.addColorStop(0.5, '#cbd5e1');
    steelGrad.addColorStop(0.7, '#64748b');
    steelGrad.addColorStop(0.9, '#e2e8f0');
    steelGrad.addColorStop(1, '#334155');
    ctx.fillStyle = steelGrad;

    ctx.beginPath();
    ctx.moveTo(-sBaseW * 0.5, sBaseY);
    ctx.lineTo(sBaseW * 0.5, sBaseY);
    ctx.lineTo(sShoulderW * 0.5, sShoulderY);
    ctx.lineTo(-sShoulderW * 0.5, sShoulderY);
    ctx.closePath();
    ctx.fill();
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.45)';
    ctx.stroke();

    // B. Crystal porthole contents swirling while tilting
    const winR = 18;
    this.drawBombContents(ctx, 0, 8, winR, curve > 0.3);

    // C. Shoulder leading to built-in strainer mouth
    ctx.fillStyle = steelGrad;
    ctx.beginPath();
    ctx.moveTo(-sShoulderW * 0.5, sShoulderY);
    ctx.quadraticCurveTo(-16, sShoulderY - 6, -14, sLidY);
    ctx.lineTo(14, sLidY);
    ctx.quadraticCurveTo(16, sShoulderY - 6, sShoulderW * 0.5, sShoulderY);
    ctx.closePath();
    ctx.fill();
    ctx.strokeStyle = '#d4af37';
    ctx.lineWidth = 1;
    ctx.stroke();

    // D. Strainer nozzle holes (Lỗ lưới lọc inox)
    ctx.fillStyle = '#1e293b';
    [-8, 0, 8].forEach(hx => {
      ctx.beginPath();
      ctx.arc(hx, sLidY + 3, 2, 0, Math.PI * 2);
      ctx.fill();
    });

    ctx.restore();

    // World spout coordinates (where tea pours out from the strainer mouth)
    const spoutX = shakerX + Math.sin(tilt) * 48;
    const spoutY = shakerY - Math.cos(tilt) * 48;

    // 4. Luscious Pouring Milk Tea Stream (Arc from shaker spout to cup)
    if (curve > 0.2) {
      const tCol = BaristaWorkstation.TEA_COLORS[this.tea] || BaristaWorkstation.TEA_COLORS.den;
      ctx.save();

      // Smooth bezier stream
      const streamGrad = ctx.createLinearGradient(spoutX, spoutY, cupX, cupTopY);
      streamGrad.addColorStop(0, tCol.light);
      streamGrad.addColorStop(0.35, tCol.mid);
      streamGrad.addColorStop(0.85, tCol.base);
      streamGrad.addColorStop(1, tCol.cream);
      ctx.fillStyle = streamGrad;

      const streamW = 6 * curve;
      ctx.beginPath();
      ctx.moveTo(spoutX - streamW * 0.5, spoutY);
      ctx.quadraticCurveTo(spoutX + 20, (spoutY + cupTopY) * 0.5, cupX - 3, cupTopY + 2);
      ctx.lineTo(cupX + 3, cupTopY + 2);
      ctx.quadraticCurveTo(spoutX + 20 + streamW, (spoutY + cupTopY) * 0.5, spoutX + streamW * 0.5, spoutY);
      ctx.closePath();
      ctx.fill();

      // Boba pearls sliding down the liquid stream!
      for (let i = 0; i < 3; i++) {
        const pearlP = ((p * 3.5 + i * 0.33) % 1.0);
        if (pearlP > 0.1 && pearlP < 0.9) {
          const t = pearlP;
          const pX = (1 - t) * (1 - t) * spoutX + 2 * (1 - t) * t * (spoutX + 20) + t * t * cupX;
          const pY = (1 - t) * (1 - t) * spoutY + 2 * (1 - t) * t * ((spoutY + cupTopY) * 0.5) + t * t * (cupTopY + 2);
          ctx.fillStyle = '#140c14';
          ctx.beginPath();
          ctx.arc(pX, pY, 2.5, 0, Math.PI * 2);
          ctx.fill();
        }
      }

      // 24K Gold flakes cascading down the pouring stream
      if (this.isGoldLeafRecipe()) {
        ctx.fillStyle = '#ffd700';
        for (let g = 0; g < 4; g++) {
          const goldP = ((p * 4.2 + g * 0.25) % 1.0);
          if (goldP > 0.05 && goldP < 0.95) {
            const t = goldP;
            const gX = (1 - t) * (1 - t) * spoutX + 2 * (1 - t) * t * (spoutX + 20) + t * t * cupX;
            const gY = (1 - t) * (1 - t) * spoutY + 2 * (1 - t) * t * ((spoutY + cupTopY) * 0.5) + t * t * (cupTopY + 2);
            ctx.fillRect(gX - 1, gY - 1, 2.2, 2.2);
          }
        }
      }

      // Splash droplets at the mouth of the cup
      ctx.fillStyle = tCol.cream;
      for (let d = 0; d < 4; d++) {
        const dx = cupX + (Math.sin(this.tick * 0.3 + d) * 8);
        const dy = cupTopY - Math.abs(Math.cos(this.tick * 0.4 + d) * 10);
        ctx.beginPath();
        ctx.arc(dx, dy, 1.6, 0, Math.PI * 2);
        ctx.fill();
      }

      ctx.restore();
    }

    // 5. Left Hand grip
    ctx.save();
    ctx.translate(leftWristX, leftWristY);
    ctx.rotate(0.35 + tilt * 0.3);
    this.drawFingersWithNails(ctx, [
      { x: 4, y: -4, w: 16, h: 5.2, rot: 0.1, nail: true },
      { x: 4, y: 3, w: 18, h: 5.2, rot: 0.05, nail: true },
      { x: 3, y: 10, w: 16, h: 5.0, rot: -0.05, nail: true }
    ]);
    ctx.restore();

    // 6. Right Hand grip
    ctx.save();
    ctx.translate(rightWristX, rightWristY);
    ctx.rotate(-0.35 + tilt * 0.3);
    this.drawFingersWithNails(ctx, [
      { x: -14, y: 2, w: 14, h: 5.2, rot: 2.8, nail: true },
      { x: -15, y: -5, w: 16, h: 5.0, rot: 3.0, nail: true },
      { x: -14, y: -12, w: 14, h: 4.8, rot: 3.1, nail: true }
    ]);
    ctx.restore();

    // 7. Dramatic Banner
    ctx.save();
    ctx.font = 'bold 20px "VT323", monospace, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillStyle = '#f4c430';
    ctx.shadowColor = 'rgba(0,0,0,0.9)';
    ctx.shadowBlur = 8;
    ctx.fillText('🧋 ĐANG RÓT TRÀ SỮA TỪ BÌNH VÀO CỐC... ✨', cx, cy - 72);
    ctx.restore();
  }

  // --- SEAL CUP WITH CUP-SEALER MACHINE (DẬP MÀNG NIÊM PHONG MIỆNG CỐC) ---
  drawSealCupAnimation(ctx) {
    const p = this.handProgress; // 0.0 -> 1.0
    const cx = this.width * 0.5;
    const cy = this.height * 0.62;
    const cupX = Math.min(this.width - 66, cx + 86);
    const cupTopY = cy + 22 - 50;

    // Sealer Stamp descends:
    let stampY;
    const restY = cupTopY - 48;
    const pressY = cupTopY - 2;

    if (p < 0.4) {
      const t = p / 0.4;
      stampY = restY + (pressY - restY) * Math.sin(t * Math.PI * 0.5);
    } else if (p < 0.65) {
      stampY = pressY + Math.sin((p - 0.4) * 80) * 0.8;
    } else {
      const t = (p - 0.65) / 0.35;
      stampY = pressY - (pressY - restY) * (t * t);
    }

    // 1. Right Arm pulling the sealing machine lever
    const rightBaseX = this.width * 0.94;
    const rightBaseY = this.height + 40;
    const leverWristX = cupX + 28;
    const leverWristY = stampY + 12;
    this.drawRealisticArm(ctx, rightBaseX, rightBaseY, leverWristX, leverWristY, 'right');

    // 2. Stainless Steel & Brass Cup Sealer Machine Head
    ctx.save();
    ctx.translate(cupX, stampY);

    // Chrome vertical plunger shaft
    const shaftGrad = ctx.createLinearGradient(-6, 0, 6, 0);
    shaftGrad.addColorStop(0, '#747d8c');
    shaftGrad.addColorStop(0.5, '#f1f2f6');
    shaftGrad.addColorStop(1, '#57606f');
    ctx.fillStyle = shaftGrad;
    ctx.fillRect(-5, -45, 10, 45);

    // Sealer Head Bell Housing
    const bellGrad = ctx.createLinearGradient(-24, 0, 24, 0);
    bellGrad.addColorStop(0, '#2f3542');
    bellGrad.addColorStop(0.3, '#57606f');
    bellGrad.addColorStop(0.5, '#a4b0be');
    bellGrad.addColorStop(0.8, '#57606f');
    bellGrad.addColorStop(1, '#2f3542');
    ctx.fillStyle = bellGrad;

    ctx.beginPath();
    ctx.moveTo(-18, -12);
    ctx.lineTo(-24, 0);
    ctx.lineTo(24, 0);
    ctx.lineTo(18, -12);
    ctx.closePath();
    ctx.fill();
    ctx.strokeStyle = '#1e272e';
    ctx.lineWidth = 1;
    ctx.stroke();

    // Glowing Golden Heat Element Ring (Heats up intensely during press!)
    const isPressing = p >= 0.38 && p <= 0.68;
    const ringGrad = ctx.createLinearGradient(-22, 0, 22, 0);
    if (isPressing) {
      ringGrad.addColorStop(0, '#ef4444');
      ringGrad.addColorStop(0.5, '#fef08a');
      ringGrad.addColorStop(1, '#ef4444');
      ctx.shadowColor = '#f59e0b';
      ctx.shadowBlur = 14;
    } else {
      ringGrad.addColorStop(0, '#b8860b');
      ringGrad.addColorStop(0.5, '#fef08a');
      ringGrad.addColorStop(1, '#b8860b');
    }
    ctx.fillStyle = ringGrad;
    ctx.beginPath();
    ctx.ellipse(0, 0, 22, 5.5, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = isPressing ? '#ffffff' : '#d4af37';
    ctx.lineWidth = 1.2;
    ctx.stroke();

    ctx.restore();

    // 3. Electrical Heat Sparks & Steam Burst during press!
    if (isPressing) {
      ctx.save();
      // Steam / hot air vapor puffs
      ctx.fillStyle = 'rgba(255, 255, 255, 0.65)';
      for (let s = 0; s < 5; s++) {
        const sx = cupX + (Math.sin(this.tick * 0.5 + s) * 22);
        const sy = cupTopY - 4 - Math.random() * 8;
        ctx.beginPath();
        ctx.arc(sx, sy, 2 + Math.random() * 3, 0, Math.PI * 2);
        ctx.fill();
      }

      // Golden electric heat sparks
      ctx.strokeStyle = '#fef08a';
      ctx.lineWidth = 1.8;
      for (let sp = 0; sp < 4; sp++) {
        const sparkAng = (this.tick * 0.4 + sp * 1.5);
        const sX1 = cupX + Math.cos(sparkAng) * 20;
        const sY1 = cupTopY + Math.sin(sparkAng) * 4;
        const sX2 = sX1 + Math.cos(sparkAng) * 7;
        const sY2 = sY1 + Math.sin(sparkAng) * 5;
        ctx.beginPath();
        ctx.moveTo(sX1, sY1);
        ctx.lineTo(sX2, sY2);
        ctx.stroke();
      }
      ctx.restore();
    }

    // 4. Dramatic Banner
    ctx.save();
    ctx.font = 'bold 20px "VT323", monospace, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillStyle = '#50fa7b';
    ctx.shadowColor = 'rgba(0,0,0,0.9)';
    ctx.shadowBlur = 8;
    ctx.fillText('🖲️ ĐANG DẬP MÀNG NIÊM PHONG... 🔒', cx, cy - 72);
    ctx.restore();
  }
}

window.BaristaWorkstation = BaristaWorkstation;
