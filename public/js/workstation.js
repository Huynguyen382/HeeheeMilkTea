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
      this.handProgress += 0.055;
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

    // 4. Draw Central Milk Tea Cup (Cốc Trà Sữa Trung Tâm)
    this.drawCentralCup(ctx);

    // 5. Draw Floating Status & Notifications
    this.drawFloatingTexts(ctx);

    // 6. Draw First-Person Barista Animated Arm & Hand
    if (this.handAction) {
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

  // --- THE CENTRAL HERO CUP ---
  drawCentralCup(ctx) {
    const cx = this.width * 0.5;
    const cy = this.height * 0.62;

    const cupTopW = 76;
    const cupBotW = 56;
    const cupH = 135;

    const topY = cy - cupH * 0.72;
    const botY = topY + cupH;

    ctx.save();

    // 1. Cup shadow on the wooden table
    ctx.fillStyle = 'rgba(0, 0, 0, 0.45)';
    ctx.beginPath();
    ctx.ellipse(cx, botY + 4, cupBotW * 0.65, 8, 0, 0, Math.PI * 2);
    ctx.fill();

    // 2. Clear Glass Cup Outline Path
    ctx.beginPath();
    ctx.moveTo(cx - cupTopW * 0.5, topY);
    ctx.lineTo(cx - cupBotW * 0.5, botY);
    ctx.quadraticCurveTo(cx, botY + 6, cx + cupBotW * 0.5, botY);
    ctx.lineTo(cx + cupTopW * 0.5, topY);
    ctx.quadraticCurveTo(cx, topY - 6, cx - cupTopW * 0.5, topY);
    ctx.closePath();

    // Save clip to draw contents cleanly inside the cup
    ctx.save();
    ctx.clip();

    // Background glass tint
    ctx.fillStyle = 'rgba(255, 255, 255, 0.08)';
    ctx.fill();

    // 3. Liquid level
    const tCol = BaristaWorkstation.TEA_COLORS[this.tea] || BaristaWorkstation.TEA_COLORS.den;
    const liquidTop = botY - cupH * 0.82;

    const liquidGrad = ctx.createLinearGradient(0, botY, 0, liquidTop);
    liquidGrad.addColorStop(0, tCol.base);
    liquidGrad.addColorStop(0.55, tCol.mid);
    liquidGrad.addColorStop(0.9, tCol.light);
    liquidGrad.addColorStop(1, tCol.cream);

    ctx.fillStyle = liquidGrad;
    ctx.beginPath();
    ctx.moveTo(cx - cupTopW * 0.52, liquidTop);
    ctx.lineTo(cx - cupBotW * 0.52, botY);
    ctx.lineTo(cx + cupBotW * 0.52, botY);
    ctx.lineTo(cx + cupTopW * 0.52, liquidTop);
    // Liquid meniscus wave
    const wave = Math.sin(this.tick * 0.08) * 1.5;
    ctx.quadraticCurveTo(cx, liquidTop + wave + 3, cx - cupTopW * 0.52, liquidTop);
    ctx.closePath();
    ctx.fill();

    // 4. Boba Pearls & Toppings at the bottom
    this.bobaPearls.forEach(p => {
      const px = cx + p.x;
      const py = botY - 14 + p.y * 0.25;

      if (p.type === 'thach_la_dua') {
        // Pandan green jelly cube
        ctx.fillStyle = 'rgba(46, 204, 113, 0.9)';
        ctx.fillRect(px - 5, py - 5, 10, 10);
        ctx.strokeStyle = '#a8e6cf';
        ctx.lineWidth = 0.8;
        ctx.strokeRect(px - 5, py - 5, 10, 10);
      } else if (p.type === 'dao_mieng') {
        // Golden peach slice
        ctx.fillStyle = '#f39c12';
        ctx.beginPath();
        ctx.ellipse(px, py, 7, 4, 0.4, 0, Math.PI * 2);
        ctx.fill();
      } else if (p.type === 'suong_sao') {
        // Grass jelly black block
        ctx.fillStyle = '#111111';
        ctx.fillRect(px - 6, py - 5, 12, 10);
        ctx.fillStyle = 'rgba(255, 255, 255, 0.2)';
        ctx.fillRect(px - 4, py - 4, 4, 3);
      } else {
        // Chewy black boba pearls
        ctx.fillStyle = p.type === 'tranchau_duongden' ? '#1f0d06' : '#140c14';
        ctx.beginPath();
        ctx.arc(px, py, p.r, 0, Math.PI * 2);
        ctx.fill();
        // Pearl glossy highlight
        ctx.fillStyle = '#ffffff';
        ctx.beginPath();
        ctx.arc(px - p.r * 0.35, py - p.r * 0.35, 1.3, 0, Math.PI * 2);
        ctx.fill();
      }
    });

    // Brown sugar syrup streaks on glass walls
    if (this.toppings.includes('tranchau_duongden')) {
      ctx.strokeStyle = 'rgba(60, 24, 12, 0.75)';
      ctx.lineWidth = 3.5;
      ctx.lineCap = 'round';
      ctx.beginPath();
      ctx.moveTo(cx - 24, liquidTop + 10);
      ctx.quadraticCurveTo(cx - 20, liquidTop + 35, cx - 22, botY - 15);
      ctx.moveTo(cx + 20, liquidTop + 15);
      ctx.quadraticCurveTo(cx + 25, liquidTop + 40, cx + 18, botY - 10);
      ctx.stroke();
    }

    // 5. Floating Ice Cubes
    if (this.ice !== 'Nóng') {
      this.iceCubes.forEach(c => {
        const bob = Math.sin(this.tick * c.bobSpeed + c.bobOffset) * 2.5;
        const ix = cx + c.x;
        const iy = liquidTop + 24 + c.y + bob;

        ctx.save();
        ctx.translate(ix, iy);
        ctx.rotate(c.rot);

        // Translucent blue crystal cube
        ctx.fillStyle = 'rgba(220, 245, 255, 0.55)';
        ctx.beginPath();
        ctx.roundRect(-c.w * 0.5, -c.h * 0.5, c.w, c.h, 3);
        ctx.fill();

        // Ice cube 3D crystal bevels
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.85)';
        ctx.lineWidth = 1;
        ctx.stroke();

        ctx.fillStyle = 'rgba(255, 255, 255, 0.6)';
        ctx.fillRect(-c.w * 0.3, -c.h * 0.3, c.w * 0.4, c.h * 0.3);
        ctx.restore();
      });
    }

    // Foam & crema bubbles on liquid top
    ctx.fillStyle = tCol.cream;
    for (let bx = -cupTopW * 0.45; bx <= cupTopW * 0.45; bx += 8) {
      const bRad = 2.5 + Math.sin(this.tick * 0.1 + bx) * 1.0;
      ctx.beginPath();
      ctx.arc(cx + bx, liquidTop + 2, Math.max(1, bRad), 0, Math.PI * 2);
      ctx.fill();
    }

    // 6. Milk Tea Straw (Ống hút boba to chéo góc)
    ctx.fillStyle = '#ff79c6';
    ctx.beginPath();
    ctx.moveTo(cx + 12, topY - 32);
    ctx.lineTo(cx + 18, topY - 32);
    ctx.lineTo(cx - 10, botY - 8);
    ctx.lineTo(cx - 16, botY - 8);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = 'rgba(255, 255, 255, 0.35)';
    ctx.fillRect(cx + 13, topY - 30, 2, cupH + 18);

    ctx.restore(); // Restore clip

    // 7. Glass Cup Highlights & Reflections
    // Glass rim ring
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.75)';
    ctx.lineWidth = 2.2;
    ctx.beginPath();
    ctx.ellipse(cx, topY, cupTopW * 0.5, 5, 0, 0, Math.PI * 2);
    ctx.stroke();

    // Vertical specular sheen on glass left edge
    const sheenGrad = ctx.createLinearGradient(cx - cupTopW * 0.46, 0, cx - cupTopW * 0.3, 0);
    sheenGrad.addColorStop(0, 'rgba(255, 255, 255, 0.6)');
    sheenGrad.addColorStop(1, 'rgba(255, 255, 255, 0)');
    ctx.fillStyle = sheenGrad;
    ctx.beginPath();
    ctx.moveTo(cx - cupTopW * 0.46, topY + 4);
    ctx.lineTo(cx - cupBotW * 0.46, botY - 4);
    ctx.lineTo(cx - cupBotW * 0.32, botY - 4);
    ctx.lineTo(cx - cupTopW * 0.32, topY + 4);
    ctx.closePath();
    ctx.fill();

    // Volume measuring ticks on right side
    ctx.fillStyle = 'rgba(255, 255, 255, 0.55)';
    [0.25, 0.5, 0.75].forEach((m, idx) => {
      const my = botY - cupH * m;
      ctx.fillRect(cx + cupBotW * 0.36 + idx * 2, my, 8, 1.2);
    });

    // 8. Steam Particles for Hot Drink
    if (this.ice === 'Nóng') {
      this.steamParticles.forEach(p => {
        ctx.fillStyle = `rgba(255, 255, 255, ${p.alpha})`;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        ctx.fill();
      });
    }

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

  // --- FIRST-PERSON BARISTA HAND & ARM ANIMATION ---
  drawBaristaHand(ctx) {
    const p = this.handProgress; // 0.0 -> 1.0
    // Sine curve: hand enters from bottom-right (p=0 to 0.5), acts at peak (p=0.5), retracts (0.5 to 1.0)
    const curve = Math.sin(p * Math.PI); // 0 -> 1 -> 0
    const cx = this.width * 0.5;
    const cy = this.height * 0.52;

    const startX = this.width + 60;
    const startY = this.height + 40;
    const handX = startX - (startX - (cx + 35)) * curve;
    const handY = startY - (startY - (cy - 10)) * curve;

    ctx.save();
    ctx.translate(handX, handY);
    ctx.rotate(-0.25 * curve);

    // 1. Arm with Emerald Green Apron Sleeve
    const sleeveGrad = ctx.createLinearGradient(0, 0, 70, 70);
    sleeveGrad.addColorStop(0, '#2e8b57');
    sleeveGrad.addColorStop(0.5, '#27ae60');
    sleeveGrad.addColorStop(1, '#1b5233');
    ctx.fillStyle = sleeveGrad;

    ctx.beginPath();
    ctx.moveTo(15, 20);
    ctx.lineTo(80, 85);
    ctx.lineTo(45, 110);
    ctx.lineTo(-10, 45);
    ctx.closePath();
    ctx.fill();

    // 2. Cute white lace / ruffled cuff
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.ellipse(8, 28, 14, 8, -0.7, 0, Math.PI * 2);
    ctx.fill();

    // 3. Delicate Barista Hand / Fingers (Soft Anime Skin)
    const skinGrad = ctx.createRadialGradient(-4, 4, 2, 0, 0, 16);
    skinGrad.addColorStop(0, '#fff5eb');
    skinGrad.addColorStop(0.6, '#ffe0bd');
    skinGrad.addColorStop(1, '#f3b49f');
    ctx.fillStyle = skinGrad;

    // Palm and curved fingers gripping the utensil
    ctx.beginPath();
    ctx.ellipse(-6, 8, 11, 8, -0.4, 0, Math.PI * 2);
    ctx.fill();

    // Thumb & fingers
    ctx.beginPath();
    ctx.roundRect(-16, -2, 14, 6, 3);
    ctx.roundRect(-18, 5, 15, 6, 3);
    ctx.roundRect(-16, 12, 14, 5, 2.5);
    ctx.fill();

    // 4. Utensil based on Action:
    if (this.handAction === 'pour_tea') {
      // Stainless steel tea kettle pouring stream
      ctx.fillStyle = '#bdc3c7';
      ctx.beginPath();
      ctx.roundRect(-36, -18, 28, 24, 4);
      ctx.fill();
      ctx.fillStyle = '#95a5a6';
      ctx.fillRect(-44, -12, 10, 6); // spout

      // Pouring liquid stream into the cup!
      if (curve > 0.35) {
        const tCol = BaristaWorkstation.TEA_COLORS[this.tea] || BaristaWorkstation.TEA_COLORS.den;
        ctx.fillStyle = tCol.mid;
        ctx.beginPath();
        ctx.moveTo(-44, -9);
        ctx.quadraticCurveTo(-55, 15, -42, 45);
        ctx.lineTo(-37, 45);
        ctx.quadraticCurveTo(-49, 15, -38, -9);
        ctx.closePath();
        ctx.fill();

        // Droplets
        ctx.fillStyle = tCol.light;
        ctx.fillRect(-44, 48, 3, 3);
        ctx.fillRect(-38, 52, 2.5, 2.5);
      }
    } else if (this.handAction === 'add_sugar') {
      // Long golden honey / syrup spoon
      ctx.strokeStyle = '#f1c40f';
      ctx.lineWidth = 3.5;
      ctx.beginPath();
      ctx.moveTo(0, 5);
      ctx.lineTo(-38, -12);
      ctx.stroke();

      // Spoon bowl with golden honey
      ctx.fillStyle = '#f39c12';
      ctx.beginPath();
      ctx.ellipse(-40, -13, 8, 5, -0.5, 0, Math.PI * 2);
      ctx.fill();

      // Honey drip
      if (curve > 0.4) {
        ctx.fillStyle = '#f1c40f';
        ctx.beginPath();
        ctx.arc(-42, 6, 3, 0, Math.PI * 2);
        ctx.fill();
      }
    } else if (this.handAction === 'add_ice') {
      // Metal ice tongs holding ice cube
      ctx.strokeStyle = '#bdc3c7';
      ctx.lineWidth = 2.5;
      ctx.beginPath();
      ctx.moveTo(-5, 0);
      ctx.lineTo(-30, -10);
      ctx.lineTo(-38, -4);
      ctx.moveTo(-5, 8);
      ctx.lineTo(-30, 2);
      ctx.lineTo(-38, -2);
      ctx.stroke();

      // Translucent ice cube held in tongs
      ctx.fillStyle = 'rgba(178, 235, 242, 0.85)';
      ctx.beginPath();
      ctx.roundRect(-46, -10, 12, 12, 2.5);
      ctx.fill();
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 1;
      ctx.stroke();
    } else if (this.handAction === 'add_topping') {
      // Boba perforated ladle with pearls
      ctx.strokeStyle = '#7f8c8d';
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.moveTo(0, 5);
      ctx.lineTo(-34, -12);
      ctx.stroke();

      ctx.fillStyle = '#34495e';
      ctx.beginPath();
      ctx.ellipse(-38, -13, 9, 6, -0.4, 0, Math.PI * 2);
      ctx.fill();

      // Boba pearls in ladle
      ctx.fillStyle = '#140c14';
      ctx.beginPath();
      ctx.arc(-40, -14, 3, 0, Math.PI * 2);
      ctx.arc(-36, -12, 2.8, 0, Math.PI * 2);
      ctx.fill();
    } else if (this.handAction === 'shake') {
      // Sleek stainless steel cocktail shaker
      const shakeVibe = Math.sin(this.tick * 0.8) * 4;
      ctx.fillStyle = '#bdc3c7';
      ctx.beginPath();
      ctx.roundRect(-42 + shakeVibe, -28, 26, 38, [6, 6, 4, 4]);
      ctx.fill();
      ctx.fillStyle = '#ecf0f1';
      ctx.fillRect(-38 + shakeVibe, -34, 18, 7);
      ctx.strokeStyle = '#7f8c8d';
      ctx.lineWidth = 1;
      ctx.strokeRect(-42 + shakeVibe, -28, 26, 38);
    } else if (this.handAction === 'serve') {
      // Wooden serving tray offering the finished drink
      ctx.fillStyle = '#8b5a2b';
      ctx.beginPath();
      ctx.ellipse(-30, 10, 24, 7, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = '#f4c430';
      ctx.lineWidth = 1.2;
      ctx.stroke();

      // Sparkle stars
      ctx.fillStyle = '#ffd700';
      ctx.beginPath();
      ctx.arc(-45, -8, 2.5, 0, Math.PI * 2);
      ctx.arc(-18, -12, 2, 0, Math.PI * 2);
      ctx.fill();
    }

    ctx.restore();
  }
}

window.BaristaWorkstation = BaristaWorkstation;
