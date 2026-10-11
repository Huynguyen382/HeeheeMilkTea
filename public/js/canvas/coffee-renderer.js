/**
 * Pixel Art Coffee Lounge & World Boss Stage Canvas Renderer
 * High-Fidelity Retro Pixel Art, Multi-Layer Offscreen Pre-rendering & Zero-GC 60 FPS Engine
 * Logical Resolution: 960 x 540 (16:9 Standard Responsive)
 * Reference: COFFEE_MAP_GRAPHICS_OPTIMIZATION_ROADMAP.md & COFFEE_MAP_BOSS_EVENT_ROADMAP.md
 */

export class CoffeeRenderer {
  constructor(canvas) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d', { alpha: false });
    this.width = 960;
    this.height = 540;

    // Local Barista Player State
    this.localPlayer = {
      storeId: 0,
      storeName: 'Barista',
      avatarId: 1,
      title: 'Barista Tập Sự',
      x: 480,
      y: 380,
      state: 'idle',
      direction: 1,
      sitting: false,
      coffeeSteam: false,
      drinkAnimTimer: 0,
      shootAnimTimer: 0,
      lastChat: '',
      lastChatTime: 0,
      lastEmote: '',
      lastEmoteTime: 0,
      squidImmune: false,
      slowUntil: 0
    };

    this.remotePlayers = new Map(); // socketId -> playerData
    this.bossState = {
      isActive: false,
      currentHp: 4000000,
      maxHp: 4000000,
      phase: 1,
      isDefeated: false,
      leaderboard: []
    };

    // Screen Shake & Camera FX
    this.screenShake = 0;
    this.bossHitFlash = 0;

    // --- ZERO-GC OBJECT POOLING SYSTEM ---
    // 1. Projectiles Pool (max 200)
    this.projectilePool = new Array(200).fill(null).map(() => ({
      active: false,
      startX: 0,
      startY: 0,
      targetX: 0,
      targetY: 0,
      currentX: 0,
      currentY: 0,
      pearlType: 'pearl_basic',
      speed: 0.05,
      progress: 0,
      damage: 0,
      isCrit: false,
      isCosmic: false,
      isFreeze: false,
      isDoT: false,
      isDeflected: false
    }));

    // 2. Damage Texts Pool with Parabolic Arc (max 100)
    this.damageTextPool = new Array(100).fill(null).map(() => ({
      active: false,
      text: '',
      x: 0,
      y: 0,
      vx: 0,
      vy: 1.8,
      gravity: 0.06,
      life: 0,
      maxLife: 45,
      color: '#ffffff',
      size: 13,
      alpha: 1.0
    }));

    // 3. Particle FX Pool (max 350)
    this.particlePool = new Array(350).fill(null).map(() => ({
      active: false,
      x: 0,
      y: 0,
      vx: 0,
      vy: 0,
      color: '#ffffff',
      size: 2,
      life: 0,
      maxLife: 20,
      alpha: 1.0
    }));

    // 4. Boss Ink Bubbles Pool (max 30)
    this.inkBubblePool = new Array(30).fill(null).map(() => ({
      active: false,
      x: 0,
      y: 0,
      vx: 0,
      vy: 0,
      radius: 14,
      life: 0,
      maxLife: 200
    }));

    // 5. Celebration Fireworks Pool (max 80)
    this.celebrationPool = new Array(80).fill(null).map(() => ({
      active: false,
      x: 0,
      y: 0,
      vx: 0,
      vy: 0,
      color: '#facc15',
      size: 3,
      life: 0,
      maxLife: 35,
      alpha: 1.0
    }));

    // --- COFFEE LOUNGE NPC ECOSYSTEM ---
    this.npcs = [
      {
        id: 'anh_quan',
        name: 'Anh Quân (Barista Trưởng)',
        x: 540,
        y: 135,
        state: 'idle',
        tamperCycle: 0
      },
      {
        id: 'be_tra',
        name: 'Bé Trà (Phục Vụ)',
        x: 350,
        y: 400,
        targetX: 680,
        dir: 1,
        speed: 1.2
      },
      {
        id: 'meo_boba',
        name: 'Mèo Mướp Boba 🐱',
        x: 880,
        y: 350,
        state: 'sleep',
        breathe: 0
      },
      {
        id: 'hoang_it',
        name: 'Hoàng IT (Deadline)',
        x: 180,
        y: 375,
        state: 'typing',
        typeTimer: 0
      }
    ];

    // Furniture Definitions (Oak Tables)
    this.tables = [
      { x: 180, y: 380, id: 'table_1' },
      { x: 480, y: 460, id: 'table_2' },
      { x: 780, y: 380, id: 'table_3' }
    ];

    this.frame = 0;
    this.lastTime = performance.now();
    this.animId = null;
    this.isRunning = false;

    // Offscreen Canvas Cache for Static Background
    this.offscreenBG = document.createElement('canvas');
    this.offscreenBG.width = this.width;
    this.offscreenBG.height = this.height;
    this.renderStaticBackgroundToCache();

    this.resize();
    window.addEventListener('resize', () => this.resize());
  }

  resize() {
    if (!this.canvas) return;
    this.canvas.width = this.width;
    this.canvas.height = this.height;
    if (this.ctx) {
      this.ctx.imageSmoothingEnabled = false;
    }
  }

  /**
   * Pre-renders Static Floor, Brick Walls, Balcony & Equipment to Cache
   * CPU cost per frame: ~0.04ms instead of hundreds of drawing loops
   */
  renderStaticBackgroundToCache() {
    const octx = this.offscreenBG.getContext('2d');
    octx.imageSmoothingEnabled = false;

    // 1. Herringbone Oak Parquet Floor (Sàn gỗ sồi xương cá cổ điển)
    this.drawHerringboneFloor(octx);

    // 2. Vintage Brick Backwall (Deep Plum & Dark Walnut)
    octx.fillStyle = '#1c0a1a';
    octx.fillRect(0, 0, this.width, 200);

    octx.fillStyle = '#260e24';
    for (let r = 0; r < 7; r++) {
      const offsetX = (r % 2 === 0) ? 0 : 25;
      for (let c = 0; c < this.width; c += 50) {
        octx.fillRect(c + offsetX, r * 22, 46, 18);
      }
    }

    // 3. Sunset Balcony Frame (x: 740 to 960)
    const skyGrad = octx.createLinearGradient(740, 0, 960, 260);
    skyGrad.addColorStop(0, '#581c87'); // twilight purple
    skyGrad.addColorStop(0.5, '#c2410c'); // sunset orange
    skyGrad.addColorStop(1, '#fde047'); // yellow horizon
    octx.fillStyle = skyGrad;
    octx.fillRect(740, 0, 220, 260);

    // City Skyline Silhouettes
    octx.fillStyle = '#180728';
    octx.fillRect(750, 140, 25, 120);
    octx.fillRect(785, 110, 35, 150);
    octx.fillRect(830, 90, 45, 170); // Landmark 81 tower
    octx.fillRect(848, 60, 8, 30);   // Spire
    octx.fillRect(885, 130, 30, 130);
    octx.fillRect(925, 120, 30, 140);

    // Glass Partition Pillars & Handrail
    octx.fillStyle = 'rgba(255, 255, 255, 0.12)';
    octx.fillRect(740, 0, 6, 260);
    octx.fillRect(850, 0, 4, 260);
    octx.fillStyle = '#451a03';
    octx.fillRect(740, 230, 220, 10);
    for (let rx = 750; rx < 960; rx += 20) {
      octx.fillRect(rx, 240, 3, 20);
    }

    // Velvet Voile Curtains on Balcony Window Frames (Rèm vải voan nhung)
    octx.fillStyle = '#701a75';
    octx.fillRect(742, 0, 14, 230);
    octx.fillRect(944, 0, 16, 230);
    // Gold Tassel Tiebacks
    octx.fillStyle = '#facc15';
    octx.fillRect(740, 130, 18, 4);
    octx.fillRect(942, 130, 18, 4);

    // Potted Plants on Balcony
    octx.fillStyle = '#78350f';
    octx.fillRect(755, 215, 18, 15);
    octx.fillStyle = '#16a34a';
    octx.beginPath();
    octx.arc(764, 210, 12, 0, Math.PI * 2);
    octx.fill();

    // Persian Vintage Rugs on Floor (Pre-rendered for Zero CPU load)
    this.drawPersianRug(octx, 835, 325, 95, 48);
    this.drawPersianRug(octx, 420, 435, 120, 52);

    // Indoor Plants: Monstera Deliciosa in Terracotta Pot & Trailing Ivy
    this.drawMonsteraPlant(octx, 24, 195);
    this.drawTrailingIvy(octx, 345, 42);

    // Vintage Vinyl Turntable Stand near corner table
    this.drawVinylTurntableStand(octx, 72, 165);

    // Espresso Bar Counter Base with Vertical Oak Slats
    const barX = 310;
    const barY = 88;
    const barW = 340;
    const barH = 55;

    octx.fillStyle = '#270e04';
    octx.fillRect(barX, barY + 10, barW, barH - 10);
    for (let bx = barX + 4; bx < barX + barW - 4; bx += 8) {
      octx.fillStyle = '#3e1d0c';
      octx.fillRect(bx, barY + 10, 4, barH - 10);
      octx.fillStyle = '#4e2410';
      octx.fillRect(bx + 1, barY + 10, 1, barH - 10);
    }

    // Polished Carrara Marble Countertop (Mặt đá cẩm thạch trắng Carrara vân xám)
    octx.fillStyle = '#f8fafc';
    octx.beginPath();
    octx.roundRect(barX - 4, barY, barW + 8, 12, 3);
    octx.fill();

    // Grey Veining on Marble (Vân đá cẩm thạch)
    octx.strokeStyle = '#cbd5e1';
    octx.lineWidth = 1;
    octx.beginPath();
    octx.moveTo(barX + 25, barY + 3);
    octx.quadraticCurveTo(barX + 70, barY + 8, barX + 110, barY + 3);
    octx.moveTo(barX + 170, barY + 9);
    octx.quadraticCurveTo(barX + 220, barY + 3, barX + 265, barY + 8);
    octx.moveTo(barX + 285, barY + 2);
    octx.lineTo(barX + 325, barY + 9);
    octx.stroke();

    // Polished Brass Bevel Trim (Nẹp kim loại đồng thau vàng óng)
    octx.fillStyle = '#f59e0b';
    octx.fillRect(barX - 4, barY + 10, barW + 8, 2);
    octx.fillStyle = '#fef08a';
    octx.fillRect(barX - 4, barY + 1, barW + 8, 1);

    // Pastry Display Case (Tủ Bánh Ngọt Artisan Kính Cong) on the left of bar
    const pasX = 322;
    const pasY = 56;
    const pasW = 68;
    const pasH = 32;

    octx.fillStyle = '#78350f';
    octx.fillRect(pasX, pasY + pasH - 4, pasW, 4);
    octx.strokeStyle = '#d97706';
    octx.lineWidth = 1.2;
    octx.strokeRect(pasX, pasY, pasW, pasH);

    // Curved Glass Canopy
    octx.fillStyle = 'rgba(255, 255, 255, 0.28)';
    octx.fillRect(pasX + 1, pasY + 1, pasW - 2, pasH - 5);
    // Glass Glare Reflection
    octx.fillStyle = 'rgba(255, 255, 255, 0.65)';
    octx.beginPath();
    octx.moveTo(pasX + 4, pasY + 3);
    octx.lineTo(pasX + 22, pasY + 3);
    octx.lineTo(pasX + 14, pasY + pasH - 6);
    octx.lineTo(pasX + 4, pasY + pasH - 6);
    octx.closePath();
    octx.fill();

    // 🥐 Butter Croissant (Bánh sừng bò bơ Pháp vàng óng)
    octx.fillStyle = '#f59e0b';
    octx.beginPath();
    octx.arc(pasX + 13, pasY + 21, 5, 0.2, Math.PI - 0.2);
    octx.fill();
    octx.fillStyle = '#d97706';
    octx.fillRect(pasX + 10, pasY + 18, 6, 2);

    // 🌀 Cinnamon Roll (Bánh cuộn quế)
    octx.fillStyle = '#78350f';
    octx.beginPath();
    octx.arc(pasX + 32, pasY + 20, 5, 0, Math.PI * 2);
    octx.fill();
    octx.fillStyle = '#fef3c7';
    octx.fillRect(pasX + 30, pasY + 19, 4, 2);

    // 🍫 Tiramisu Cake Slice
    octx.fillStyle = '#fef08a';
    octx.fillRect(pasX + 47, pasY + 16, 14, 9);
    octx.fillStyle = '#451a03';
    octx.fillRect(pasX + 47, pasY + 20, 14, 3);
    octx.fillStyle = '#3f1807';
    octx.fillRect(pasX + 47, pasY + 15, 14, 2);

    // Shelves with 4 Glass Bean Canisters, Glass V60 Cone & Gold Gooseneck Kettle
    octx.fillStyle = '#270e04';
    octx.fillRect(350, 40, 260, 6);

    // 4 Glass Bean Canisters (Arabica, Robusta, Geisha, Mộc Châu)
    const beanColors = ['#5c2c16', '#261208', '#854d0e', '#451a03'];
    for (let i = 0; i < 4; i++) {
      const bx = 365 + i * 36;
      // Glass body
      octx.fillStyle = 'rgba(255, 255, 255, 0.25)';
      octx.fillRect(bx, 22, 14, 18);
      // Coffee beans inside
      octx.fillStyle = beanColors[i];
      octx.fillRect(bx + 1, 26, 12, 13);
      // Glass glare reflection
      octx.fillStyle = 'rgba(255, 255, 255, 0.65)';
      octx.fillRect(bx + 2, 23, 2, 16);
      // Wooden cap
      octx.fillStyle = '#78350f';
      octx.fillRect(bx + 1, 20, 12, 3);
    }

    // Glass V60 Dripper Cone (Phễu pha V60 thủy tinh)
    const v60X = 520;
    octx.fillStyle = 'rgba(255, 255, 255, 0.4)';
    octx.beginPath();
    octx.moveTo(v60X, 22);
    octx.lineTo(v60X + 16, 22);
    octx.lineTo(v60X + 10, 36);
    octx.lineTo(v60X + 6, 36);
    octx.closePath();
    octx.fill();
    // Paper filter inside
    octx.fillStyle = '#fff8dc';
    octx.beginPath();
    octx.moveTo(v60X + 2, 23);
    octx.lineTo(v60X + 14, 23);
    octx.lineTo(v60X + 8, 34);
    octx.closePath();
    octx.fill();

    // Golden Gooseneck Kettle (Ấm rót cổ ngỗng mạ vàng)
    const ketX = 555;
    octx.fillStyle = '#f59e0b'; // gold kettle body
    octx.beginPath();
    octx.arc(ketX + 8, 30, 8, 0, Math.PI * 2);
    octx.fill();
    octx.fillStyle = '#d97706';
    octx.fillRect(ketX + 3, 22, 10, 3); // lid
    // Curved gooseneck spout
    octx.strokeStyle = '#f59e0b';
    octx.lineWidth = 1.5;
    octx.beginPath();
    octx.moveTo(ketX + 14, 32);
    octx.quadraticCurveTo(ketX + 24, 26, ketX + 20, 18);
    octx.stroke();

    // Cozy Armchair for Mèo Boba on Balcony (x: 880, y: 350)
    octx.fillStyle = '#7c2d12'; // warm velvet armchair
    octx.beginPath();
    octx.roundRect(862, 335, 36, 26, 6);
    octx.fill();
    octx.fillStyle = '#9a3412';
    octx.fillRect(864, 345, 32, 14);
  }

  drawPersianRug(ctx, x, y, w, h) {
    // Outer border (Deep Burgundy #881337)
    ctx.fillStyle = '#881337';
    ctx.fillRect(x, y, w, h);

    // Golden ochre inner border
    ctx.strokeStyle = '#d97706';
    ctx.lineWidth = 1.5;
    ctx.strokeRect(x + 2, y + 2, w - 4, h - 4);

    // Deep Navy Blue inner field (#1e1b4b)
    ctx.fillStyle = '#1e1b4b';
    ctx.fillRect(x + 5, y + 5, w - 10, h - 10);

    // Diamond Medallion Pattern in center
    const cx = x + w / 2;
    const cy = y + h / 2;
    ctx.fillStyle = '#b45309';
    ctx.beginPath();
    ctx.moveTo(cx, cy - (h * 0.32));
    ctx.lineTo(cx + (w * 0.28), cy);
    ctx.lineTo(cx, cy + (h * 0.32));
    ctx.lineTo(cx - (w * 0.28), cy);
    ctx.closePath();
    ctx.fill();

    // Golden star motif inside medallion
    ctx.fillStyle = '#fde047';
    ctx.beginPath();
    ctx.moveTo(cx, cy - (h * 0.18));
    ctx.lineTo(cx + (w * 0.14), cy);
    ctx.lineTo(cx, cy + (h * 0.18));
    ctx.lineTo(cx - (w * 0.14), cy);
    ctx.closePath();
    ctx.fill();

    // Ivory fringe tassels on both left and right ends
    ctx.fillStyle = '#fef3c7';
    for (let ty = y + 2; ty < y + h - 2; ty += 4) {
      ctx.fillRect(x - 3, ty, 3, 2);
      ctx.fillRect(x + w, ty, 3, 2);
    }
  }

  drawMonsteraPlant(ctx, x, y) {
    // Terracotta Pot
    ctx.fillStyle = '#c2410c';
    ctx.beginPath();
    ctx.moveTo(x - 10, y + 20);
    ctx.lineTo(x + 10, y + 20);
    ctx.lineTo(x + 8, y + 36);
    ctx.lineTo(x - 8, y + 36);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = '#9a3412';
    ctx.fillRect(x - 12, y + 17, 24, 4); // rim

    // Rich Dark Earth
    ctx.fillStyle = '#451a03';
    ctx.fillRect(x - 9, y + 19, 18, 3);

    // Large Split Monstera Leaves (Phiến lá xẻ răng cưa)
    const leaves = [
      { lx: x - 14, ly: y - 2, rot: -0.4, w: 18, h: 22 },
      { lx: x + 8, ly: y - 6, rot: 0.35, w: 20, h: 24 },
      { lx: x - 4, ly: y - 16, rot: -0.1, w: 22, h: 26 }
    ];

    leaves.forEach(l => {
      ctx.save();
      ctx.translate(l.lx, l.ly);
      ctx.rotate(l.rot);
      ctx.fillStyle = '#15803d';
      ctx.beginPath();
      ctx.ellipse(0, 0, l.w * 0.5, l.h * 0.5, 0, 0, Math.PI * 2);
      ctx.fill();
      // Midrib line
      ctx.strokeStyle = '#166534';
      ctx.lineWidth = 1.2;
      ctx.beginPath();
      ctx.moveTo(0, l.h * 0.5);
      ctx.lineTo(0, -l.h * 0.5);
      ctx.stroke();
      // Cutout slits
      ctx.fillStyle = '#1c0a1a';
      ctx.fillRect(-l.w * 0.35, -4, 4, 2);
      ctx.fillRect(l.w * 0.15, 2, 4, 2);
      ctx.restore();
    });
  }

  drawTrailingIvy(ctx, x, y) {
    // Vine stems
    ctx.strokeStyle = '#166534';
    ctx.lineWidth = 1.2;
    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.quadraticCurveTo(x - 8, y + 15, x - 4, y + 30);
    ctx.stroke();
    // Ivy leaves
    const ivyCoords = [[x - 3, y + 6], [x - 8, y + 14], [x - 4, y + 22], [x - 6, y + 28]];
    ctx.fillStyle = '#22c55e';
    ivyCoords.forEach(([ix, iy]) => {
      ctx.beginPath();
      ctx.arc(ix, iy, 2.5, 0, Math.PI * 2);
      ctx.fill();
    });
  }

  drawVinylTurntableStand(ctx, x, y) {
    // Wooden Cabinet Stand
    ctx.fillStyle = '#5c2b0e';
    ctx.fillRect(x - 14, y, 28, 28);
    ctx.fillStyle = '#78350f';
    ctx.fillRect(x - 16, y - 2, 32, 4); // table top
    ctx.fillStyle = '#3f1d0b';
    ctx.fillRect(x - 12, y + 28, 4, 6); // legs
    ctx.fillRect(x + 8, y + 28, 4, 6);

    // Vinyl Record Player Box
    ctx.fillStyle = '#d97706'; // teak wood player case
    ctx.fillRect(x - 12, y - 10, 24, 8);
    // Silver control knob
    ctx.fillStyle = '#cbd5e1';
    ctx.fillRect(x + 6, y - 7, 3, 3);
  }

  /**
   * Authentic Herringbone Parquet Floor (Sàn Gỗ Sồi Xương Cá)
   */
  drawHerringboneFloor(octx) {
    const startY = 200;
    const endY = this.height;
    octx.fillStyle = '#2b1308';
    octx.fillRect(0, startY, this.width, endY - startY);

    const slatW = 32;
    const slatH = 14;
    const oakTones = ['#3e2723', '#4e2a16', '#5d4037', '#381f12', '#452614'];

    for (let y = startY; y < endY + slatH; y += slatH) {
      const row = Math.floor((y - startY) / slatH);
      const isAlt = row % 2 === 1;
      for (let x = -slatW; x < this.width + slatW; x += slatW * 2) {
        const cx = x + (isAlt ? slatW : 0);
        const tone = oakTones[(row * 5 + Math.abs(Math.floor(x / 20))) % oakTones.length];

        octx.fillStyle = tone;
        octx.fillRect(cx, y, slatW - 1, slatH - 1);

        // Highlight upper edge
        octx.fillStyle = 'rgba(255, 255, 255, 0.05)';
        octx.fillRect(cx, y, slatW - 1, 1);

        // Joint groove
        octx.fillStyle = '#170904';
        octx.fillRect(cx, y + slatH - 1, slatW, 1);
        octx.fillRect(cx + slatW - 1, y, 1, slatH);
      }
    }
  }

  start() {
    if (this.isRunning) return;
    this.isRunning = true;
    this.lastTime = performance.now();
    this.loop();
  }

  stop() {
    this.isRunning = false;
    if (this.animId) {
      cancelAnimationFrame(this.animId);
      this.animId = null;
    }
  }

  loop() {
    if (!this.isRunning) return;
    const now = performance.now();
    const dt = Math.min((now - this.lastTime) / 1000, 0.05);
    this.lastTime = now;
    this.frame++;

    this.update(dt);
    this.render();

    this.animId = requestAnimationFrame(() => this.loop());
  }

  update(dt = 0.016) {
    const now = Date.now();
    const f = this.frame;

    // Decrement animation timers
    if (this.localPlayer.drinkAnimTimer > 0) this.localPlayer.drinkAnimTimer--;
    if (this.localPlayer.shootAnimTimer > 0) this.localPlayer.shootAnimTimer--;
    for (const rp of this.remotePlayers.values()) {
      if (rp.drinkAnimTimer > 0) rp.drinkAnimTimer--;
      if (rp.shootAnimTimer > 0) rp.shootAnimTimer--;
    }

    // 1. Update Projectiles from Pool
    for (let i = 0; i < this.projectilePool.length; i++) {
      const p = this.projectilePool[i];
      if (!p.active) continue;

      p.progress += p.speed;
      p.currentX = p.startX + (p.targetX - p.startX) * p.progress;
      p.currentY = p.startY + (p.targetY - p.startY) * p.progress;

      // Add Trail FX
      if (Math.random() < 0.65) {
        this.addParticle({
          x: p.currentX,
          y: p.currentY,
          vx: (Math.random() - 0.5) * 1.5,
          vy: (Math.random() - 0.5) * 1.5,
          color: p.pearlType === 'pearl_flame' ? '#ea580c' :
                 p.pearlType === 'pearl_golden' ? '#facc15' :
                 p.pearlType === 'pearl_frost' ? '#38bdf8' :
                 p.pearlType === 'pearl_cosmic' ? '#c084fc' : '#64748b',
          size: p.pearlType === 'pearl_cosmic' ? 3 : 2,
          life: 16
        });
      }

      // Check impact at target
      if (p.progress >= 1.0) {
        this.createHitImpact(p);
        p.active = false;
      }
    }

    // 2. Update Damage Texts from Pool with Parabolic Arc
    for (let i = 0; i < this.damageTextPool.length; i++) {
      const dtObj = this.damageTextPool[i];
      if (!dtObj.active) continue;

      dtObj.x += dtObj.vx;
      dtObj.y -= dtObj.vy;
      dtObj.vy -= dtObj.gravity || 0.06;
      dtObj.life--;
      dtObj.alpha = Math.max(0, dtObj.life / dtObj.maxLife);
      if (dtObj.life <= 0) {
        dtObj.active = false;
      }
    }

    // 3. Update Particles from Pool
    for (let i = 0; i < this.particlePool.length; i++) {
      const pt = this.particlePool[i];
      if (!pt.active) continue;

      pt.x += pt.vx;
      pt.y += pt.vy;
      pt.life--;
      pt.alpha = Math.max(0, pt.life / pt.maxLife);
      if (pt.life <= 0) {
        pt.active = false;
      }
    }

    // 4. Boss Sweet Ink Bubbles Attack (Active during Boss battle)
    if (this.bossState && this.bossState.isActive && !this.bossState.isDefeated) {
      if (f % 150 === 0) {
        const count = this.bossState.phase === 3 ? 4 : this.bossState.phase === 2 ? 3 : 2;
        for (let b = 0; b < count; b++) {
          this.spawnInkBubble({
            x: 480 + (Math.random() - 0.5) * 120,
            y: 210,
            vx: (Math.random() - 0.5) * 2.2,
            vy: 0.9 + Math.random() * 1.4,
            radius: 12 + Math.random() * 6
          });
        }
      }
    }

    // Update & check player collision for Ink Bubbles
    for (let i = 0; i < this.inkBubblePool.length; i++) {
      const ib = this.inkBubblePool[i];
      if (!ib.active) continue;

      ib.x += ib.vx;
      ib.y += ib.vy;
      ib.life--;

      const dist = Math.hypot(ib.x - this.localPlayer.x, ib.y - (this.localPlayer.y - 12));
      if (dist < ib.radius + 14 || ib.life <= 0 || ib.y >= 520) {
        // Pop ink bubble with shrapnel particles!
        for (let p = 0; p < 8; p++) {
          const ang = Math.random() * Math.PI * 2;
          this.addParticle({
            x: ib.x,
            y: ib.y,
            vx: Math.cos(ang) * 2,
            vy: Math.sin(ang) * 2,
            color: '#c084fc',
            size: 2,
            life: 25
          });
        }
        if (dist < ib.radius + 14) {
          if (!this.localPlayer.squidImmune) {
            this.localPlayer.slowUntil = now + 2500;
          }
          this.screenShake = 4;
          if (window.sound && window.sound.slurp) window.sound.slurp();
        }
        ib.active = false;
      }
    }

    // 5. Defeat Celebration Confetti
    if (this.bossState && this.bossState.isDefeated && Math.random() < 0.25) {
      const fxX = 100 + Math.random() * 760;
      const fxY = 80 + Math.random() * 200;
      const colors = ['#facc15', '#ec4899', '#38bdf8', '#50fa7b', '#a855f7'];
      for (let c = 0; c < 15; c++) {
        const ang = Math.random() * Math.PI * 2;
        const spd = 2 + Math.random() * 4;
        this.spawnCelebrationParticle({
          x: fxX,
          y: fxY,
          vx: Math.cos(ang) * spd,
          vy: Math.sin(ang) * spd,
          color: colors[Math.floor(Math.random() * colors.length)]
        });
      }
    }

    for (let i = 0; i < this.celebrationPool.length; i++) {
      const cp = this.celebrationPool[i];
      if (!cp.active) continue;
      cp.x += cp.vx;
      cp.y += cp.vy;
      cp.life--;
      cp.alpha = Math.max(0, cp.life / cp.maxLife);
      if (cp.life <= 0) cp.active = false;
    }

    // 6. Update NPC Cycles
    // Bé Trà patrol movement vs safe corner during boss
    const beTra = this.npcs.find(n => n.id === 'be_tra');
    if (beTra) {
      if (this.bossState && this.bossState.isActive) {
        // Move to safety near bar corner during boss battle
        const targetSafeX = 330;
        const targetSafeY = 220;
        beTra.x += (targetSafeX - beTra.x) * 0.05;
        beTra.y += (targetSafeY - beTra.y) * 0.05;
      } else {
        beTra.y = 400;
        beTra.x += beTra.speed * beTra.dir;
        if (beTra.x > beTra.targetX) { beTra.dir = -1; beTra.speed = 1.0; }
        else if (beTra.x < 320) { beTra.dir = 1; beTra.speed = 1.2; }
      }
    }

    // Decay boss hit flash
    if (this.bossHitFlash > 0) this.bossHitFlash--;
  }

  addProjectile(data) {
    const p = this.projectilePool.find(item => !item.active);
    if (!p) return;

    p.active = true;
    p.startX = data.startX;
    p.startY = data.startY;
    p.currentX = data.startX;
    p.currentY = data.startY;
    p.targetX = data.targetX;
    p.targetY = data.targetY;
    p.pearlType = data.pearlType || 'pearl_basic';
    p.speed = p.pearlType === 'pearl_cosmic' ? 0.08 : p.pearlType === 'pearl_golden' ? 0.065 : 0.055;
    p.progress = 0;
    p.damage = data.damage;
    p.isCrit = data.isCrit;
    p.isCosmic = data.isCosmic;
    p.isFreeze = data.isFreeze;
    p.isDoT = data.isDoT;
    p.isDeflected = data.isDeflected;
  }

  addDamageText(text, x, y, color = '#ffffff', isCrit = false) {
    const dt = this.damageTextPool.find(item => !item.active);
    if (!dt) return;

    dt.active = true;
    dt.text = text;
    dt.x = x + (Math.random() - 0.5) * 20;
    dt.y = y + (Math.random() - 0.5) * 10;
    dt.vx = (Math.random() - 0.5) * (isCrit ? 2.4 : 1.5);
    dt.vy = isCrit ? 2.8 : 2.0;
    dt.gravity = 0.06;
    dt.life = isCrit ? 55 : 42;
    dt.maxLife = dt.life;
    dt.color = color;
    dt.size = isCrit ? 18 : 13;
    dt.alpha = 1.0;
  }

  addParticle(pt) {
    const p = this.particlePool.find(item => !item.active);
    if (!p) return;

    p.active = true;
    p.x = pt.x;
    p.y = pt.y;
    p.vx = pt.vx;
    p.vy = pt.vy;
    p.color = pt.color;
    p.size = pt.size || 2;
    p.life = pt.life || 20;
    p.maxLife = p.life;
    p.alpha = 1.0;
  }

  spawnInkBubble(data) {
    const ib = this.inkBubblePool.find(item => !item.active);
    if (!ib) return;

    ib.active = true;
    ib.x = data.x;
    ib.y = data.y;
    ib.vx = data.vx;
    ib.vy = data.vy;
    ib.radius = data.radius;
    ib.life = 200;
    ib.maxLife = 200;
  }

  spawnCelebrationParticle(data) {
    const cp = this.celebrationPool.find(item => !item.active);
    if (!cp) return;

    cp.active = true;
    cp.x = data.x;
    cp.y = data.y;
    cp.vx = data.vx;
    cp.vy = data.vy;
    cp.color = data.color;
    cp.size = 3;
    cp.life = 35;
    cp.maxLife = 35;
    cp.alpha = 1.0;
  }

  createHitImpact(p) {
    this.bossHitFlash = 5;

    // Trigger Screen Shake on Crit or Cosmic
    if (p.isCrit || p.isCosmic) {
      this.screenShake = p.isCosmic ? 8 : 5;
    }

    // Play Web Audio Hit Sound
    if (window.sound) {
      if (p.isCosmic && window.sound.bossCosmic) window.sound.bossCosmic();
      else if (p.isCrit && window.sound.bossCrit) window.sound.bossCrit();
      else if (window.sound.bossHit) window.sound.bossHit();
    }

    // 1. Shrapnel Fragments from burst pearl (6 fragments)
    const shrapnelColor = p.pearlType === 'pearl_flame' ? '#ea580c' :
                          p.pearlType === 'pearl_golden' ? '#facc15' :
                          p.pearlType === 'pearl_frost' ? '#38bdf8' :
                          p.pearlType === 'pearl_cosmic' ? '#c084fc' : '#111827';
    for (let s = 0; s < 6; s++) {
      const sAngle = (s * Math.PI / 3) + (Math.random() - 0.5) * 0.4;
      const sSpd = 2.5 + Math.random() * 2.5;
      this.addParticle({
        x: p.targetX,
        y: p.targetY,
        vx: Math.cos(sAngle) * sSpd,
        vy: Math.sin(sAngle) * sSpd,
        color: shrapnelColor,
        size: 3,
        life: 20
      });
    }

    // 2. Splash Particles
    const count = p.isCosmic ? 24 : p.isCrit ? 18 : 10;
    const pColor = p.isCosmic ? '#c084fc' : p.isCrit ? '#facc15' : p.isFreeze ? '#38bdf8' : '#e2e8f0';

    for (let k = 0; k < count; k++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = 2 + Math.random() * 4;
      this.addParticle({
        x: p.targetX,
        y: p.targetY,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        color: pColor,
        size: p.isCosmic ? 3 : 2,
        life: 25
      });
    }

    // Floating Damage Number with Pop-up Arc
    if (p.damage > 0) {
      const txt = p.isCosmic ? `💥 -${p.damage.toLocaleString()} (COSMIC!)` :
                  p.isCrit ? `⚡ -${p.damage.toLocaleString()} (CRIT!)` :
                  `-${p.damage.toLocaleString()}`;
      const color = p.isCosmic ? '#e879f9' : p.isCrit ? '#facc15' : p.isFreeze ? '#38bdf8' : '#ffffff';
      this.addDamageText(txt, p.targetX, p.targetY - 15, color, p.isCrit || p.isCosmic);
    }
  }

  /**
   * Main Render Pipeline with Screen Shake & 2.5D Isometric Y-Sorting
   */
  render() {
    const ctx = this.ctx;
    ctx.clearRect(0, 0, this.width, this.height);

    // Apply Screen Shake if active
    let shakeActive = false;
    if (this.screenShake > 0.1) {
      shakeActive = true;
      ctx.save();
      const sx = (Math.random() - 0.5) * this.screenShake;
      const sy = (Math.random() - 0.5) * this.screenShake;
      ctx.translate(sx, sy);
      this.screenShake *= 0.85;
    }

    // 1. Draw Pre-rendered Static Background & Dynamic Atmosphere
    this.drawEnvironment(ctx);

    // 2. Draw Summoning Altar (Bệ Triệu Hồi Vũ Trụ)
    this.drawSummoningAltar(ctx);

    // 3. Collect all 2.5D Dynamic Entities for Y-Sorting
    const renderList = [];

    // Furniture (Oak Tables)
    this.tables.forEach(t => renderList.push({ type: 'table', y: t.y, data: t }));

    // NPCs
    this.npcs.forEach(npc => renderList.push({ type: 'npc', y: npc.y, data: npc }));

    // Remote Players
    for (const player of this.remotePlayers.values()) {
      renderList.push({ type: 'player', y: player.y, data: player, isLocal: false });
    }

    // Local Player
    renderList.push({ type: 'player', y: this.localPlayer.y, data: this.localPlayer, isLocal: true });

    // World Boss Quái Vật Hưng Răm
    if (this.bossState && this.bossState.isActive) {
      renderList.push({ type: 'boss', y: 220, data: this.bossState });
    }

    // Sort by Y position (Depth Sorting)
    renderList.sort((a, b) => a.y - b.y);

    // Draw sorted entities
    renderList.forEach(item => {
      if (item.type === 'table') this.drawTable(ctx, item.data);
      else if (item.type === 'npc') this.drawNPC(ctx, item.data);
      else if (item.type === 'player') this.drawPlayer(ctx, item.data, item.isLocal);
      else if (item.type === 'boss') this.drawBoss(ctx);
    });

    // 4. Draw Boss Ink Bubbles
    this.drawBossInkBubbles(ctx);

    // 5. Draw Projectiles
    this.drawProjectiles(ctx);

    // 6. Draw Particles & Victory Celebration
    this.drawParticles(ctx);
    this.drawVictoryCelebration(ctx);

    // 7. Draw Damage Floating Numbers
    this.drawDamageTexts(ctx);

    // 8. Draw Interactive Proximity Prompts
    this.drawInteractionPrompts(ctx);

    if (shakeActive) {
      ctx.restore();
    }
  }

  /**
   * Draw Cozy Cafe Interior using Pre-rendered Cache & Dynamic Lighting
   */
  drawEnvironment(ctx) {
    const f = this.frame;

    // 1. Blit pre-rendered background in 1 command (~0.04ms)
    ctx.drawImage(this.offscreenBG, 0, 0);

    // 2. Dynamic City Lights Twinkling in Balcony Windows
    ctx.fillStyle = '#fef08a';
    for (let wy = 120; wy < 230; wy += 12) {
      if ((wy + f) % 24 < 12) ctx.fillRect(840, wy, 4, 6);
      ctx.fillRect(795, wy + 8, 4, 6);
      ctx.fillRect(895, wy + 4, 4, 6);
    }

    // 3. Pixel Rain streaks on balcony glass
    ctx.fillStyle = 'rgba(255, 255, 255, 0.25)';
    for (let r = 0; r < 6; r++) {
      const rx = 760 + (r * 32);
      const ry = ((f * 1.5 + r * 45) % 180) + 40;
      ctx.fillRect(rx, ry, 1, 5);
    }

    // 4. La Marzocco Espresso Machine (Polished Brass & Crimson)
    ctx.fillStyle = '#dc2626';
    ctx.fillRect(450, 60, 60, 25);
    ctx.fillStyle = '#f1f5f9';
    ctx.fillRect(445, 55, 70, 5); // top cup warmer
    ctx.fillStyle = '#94a3b8';
    ctx.fillRect(460, 85, 8, 6); // portafilter 1
    ctx.fillRect(485, 85, 8, 6); // portafilter 2

    // Pressure gauge vibrating
    const gaugeNeedle = Math.sin(f * 0.4) * 0.8;
    ctx.fillStyle = '#d4af37';
    ctx.beginPath();
    ctx.arc(477, 68, 4, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#1e293b';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(477, 68);
    ctx.lineTo(477 + gaugeNeedle, 66);
    ctx.stroke();

    // Pixel Steam rising from Espresso Machine
    ctx.fillStyle = 'rgba(255, 255, 255, 0.45)';
    const steamY = 50 - ((f * 1.2) % 25);
    const steamX = 475 + Math.sin(f * 0.1) * 4;
    ctx.fillRect(steamX, steamY, 4, 4);
    ctx.fillRect(steamX + 8, steamY + 6, 3, 3);

    // 5. Neon Sign: ☕ HEEHEE COFFEE LOUNGE ☕
    ctx.fillStyle = '#fbbf24';
    ctx.font = 'bold 13px Courier, monospace';
    ctx.textAlign = 'center';
    ctx.shadowColor = '#f59e0b';
    ctx.shadowBlur = 10;
    ctx.fillText('☕ HEEHEE COFFEE LOUNGE ☕', 480, 25);
    ctx.shadowBlur = 0;

    // 6. Barista NPC Chị Thảo standing behind bar
    this.drawBaristaNPC(ctx, 400, 72);

    // 7. Warm Hanging Edison Pendant Lamps with Dynamic Radial Glow Cones
    const lampPulse = 0.9 + 0.1 * Math.sin(f * 0.05);
    [160, 320, 640, 800].forEach(lx => {
      ctx.strokeStyle = '#475569';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(lx, 0);
      ctx.lineTo(lx, 40);
      ctx.stroke();

      // Lamp cone
      ctx.fillStyle = '#b45309';
      ctx.beginPath();
      ctx.moveTo(lx, 38);
      ctx.lineTo(lx - 12, 48);
      ctx.lineTo(lx + 12, 48);
      ctx.closePath();
      ctx.fill();

      // Bulb
      ctx.fillStyle = '#fef08a';
      ctx.beginPath();
      ctx.arc(lx, 49, 3, 0, Math.PI * 2);
      ctx.fill();

      // Warm radial ambient light glow cone
      const glow = ctx.createRadialGradient(lx, 50, 4, lx, 80, 65);
      glow.addColorStop(0, `rgba(254, 240, 138, ${0.28 * lampPulse})`);
      glow.addColorStop(1, 'rgba(254, 240, 138, 0)');
      ctx.fillStyle = glow;
      ctx.beginPath();
      ctx.arc(lx, 70, 55, 0, Math.PI * 2);
      ctx.fill();
    });

    // 8. Dynamic Vinyl Record Player on stand (x: 72, y: 165)
    const turnX = 70;
    const turnY = 158;
    // Spinning Vinyl Record
    ctx.save();
    ctx.translate(turnX, turnY);
    ctx.fillStyle = '#0f172a';
    ctx.beginPath();
    ctx.ellipse(0, 0, 9, 5, 0, 0, Math.PI * 2);
    ctx.fill();
    // Grooves reflection
    ctx.strokeStyle = '#334155';
    ctx.lineWidth = 0.8;
    ctx.beginPath();
    ctx.ellipse(0, 0, 6.5, 3.5, 0, 0, Math.PI * 2);
    ctx.stroke();
    // Center Red Label
    ctx.fillStyle = '#ef4444';
    ctx.beginPath();
    ctx.arc(0, 0, 2.5, 0, Math.PI * 2);
    ctx.fill();
    // Tonearm needle
    ctx.strokeStyle = '#facc15';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(8, -4);
    ctx.lineTo(2, 0);
    ctx.stroke();
    ctx.restore();

    // Floating musical notes from Vinyl Player
    const noteBob = (f * 0.6) % 36;
    const noteX = turnX + Math.sin(f * 0.1) * 6;
    const noteY = turnY - 8 - noteBob;
    const noteAlpha = Math.max(0, 1 - noteBob / 36);
    ctx.fillStyle = `rgba(253, 224, 71, ${noteAlpha})`;
    ctx.font = 'bold 9px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText((f % 140 < 70) ? '♪' : '♫', noteX, noteY);

    // 9. Ambient Golden Dust Motes (Bụi Nắng Hoàng Hôn Lofi)
    ctx.fillStyle = 'rgba(254, 240, 138, 0.45)';
    for (let d = 0; d < 14; d++) {
      const dx = (100 + d * 62 + Math.sin(f * 0.03 + d * 2) * 16) % 960;
      const dy = 60 + ((d * 38 + f * 0.35) % 380);
      ctx.fillRect(dx, dy, 1.5, 1.5);
    }
  }

  drawBaristaNPC(ctx, x, y) {
    // Hair
    ctx.fillStyle = '#3f2212';
    ctx.fillRect(x + 3, y - 2, 14, 8);
    // Face
    ctx.fillStyle = '#fed7aa';
    ctx.fillRect(x + 4, y + 4, 12, 10);
    // Eyes
    ctx.fillStyle = '#18181b';
    ctx.fillRect(x + 6, y + 8, 2, 2);
    ctx.fillRect(x + 12, y + 8, 2, 2);
    // Smile
    ctx.fillStyle = '#f43f5e';
    ctx.fillRect(x + 8, y + 11, 4, 1);
    // Green Apron
    ctx.fillStyle = '#15803d';
    ctx.fillRect(x + 2, y + 14, 16, 16);
    ctx.fillStyle = '#fef08a';
    ctx.fillRect(x + 8, y + 18, 4, 2); // Nametag
  }

  /**
   * Summoning Altar (Bệ Triệu Hồi Vũ Trụ)
   */
  drawSummoningAltar(ctx) {
    const f = this.frame;
    const cx = 480;
    const cy = 230;

    // Outer Stone Dais Ellipse
    ctx.fillStyle = '#1a0b2e';
    ctx.beginPath();
    ctx.ellipse(cx, cy, 140, 55, 0, 0, Math.PI * 2);
    ctx.fill();

    ctx.strokeStyle = '#6b21a8';
    ctx.lineWidth = 3;
    ctx.stroke();

    // Inner Glowing Magic Ring
    const pulse = 0.5 + Math.sin(f * 0.08) * 0.5;
    ctx.strokeStyle = `rgba(168, 85, 247, ${0.4 + pulse * 0.5})`;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.ellipse(cx, cy, 110, 42, 0, 0, Math.PI * 2);
    ctx.stroke();

    // Glowing Neon Runes around circle
    ctx.fillStyle = '#c084fc';
    for (let i = 0; i < 8; i++) {
      const angle = (i * Math.PI / 4) + (f * 0.01);
      const rx = cx + Math.cos(angle) * 110;
      const ry = cy + Math.sin(angle) * 42;
      ctx.fillRect(rx - 2, ry - 2, 5, 5);
    }

    // Purple Ambient Glow when Boss is Active
    if (this.bossState && this.bossState.isActive) {
      const bossGlow = ctx.createRadialGradient(cx, cy, 20, cx, cy, 150);
      bossGlow.addColorStop(0, `rgba(147, 51, 234, ${0.25 + pulse * 0.2})`);
      bossGlow.addColorStop(1, 'rgba(147, 51, 234, 0)');
      ctx.fillStyle = bossGlow;
      ctx.beginPath();
      ctx.ellipse(cx, cy, 160, 70, 0, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  /**
   * Oak Dining Table with Thonet Bentwood Chairs, Daisy Vase & Scented Candle
   */
  drawTable(ctx, t) {
    const f = this.frame;

    // 1. Thonet Bentwood Chairs (Left & Right) with Curved Backrest & Velvet Cushion
    [-36, 36].forEach(dir => {
      const cx = t.x + dir;
      const cy = t.y - 12;

      // Chair shadow
      ctx.fillStyle = 'rgba(0, 0, 0, 0.22)';
      ctx.beginPath();
      ctx.ellipse(cx, cy + 22, 10, 4, 0, 0, Math.PI * 2);
      ctx.fill();

      // Chair wooden legs
      ctx.fillStyle = '#3f1d0b';
      ctx.fillRect(cx - 7, cy + 6, 2.5, 16);
      ctx.fillRect(cx + 5, cy + 6, 2.5, 16);

      // Bentwood curved backrest
      ctx.strokeStyle = '#5c2b0e';
      ctx.lineWidth = 2.5;
      ctx.beginPath();
      ctx.arc(cx, cy - 4, 9, Math.PI, 0);
      ctx.stroke();
      ctx.fillRect(cx - 8, cy - 4, 2, 10);
      ctx.fillRect(cx + 6, cy - 4, 2, 10);

      // Padded cushion seat (Burgundy Velvet #881337 or Mustard Gold #ca8a04)
      ctx.fillStyle = dir < 0 ? '#881337' : '#9a3412';
      ctx.beginPath();
      ctx.ellipse(cx, cy + 6, 11, 5, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = '#f59e0b';
      ctx.lineWidth = 0.8;
      ctx.stroke();
    });

    // 2. Cast Iron Pedestal Table Base & Shadow
    ctx.fillStyle = 'rgba(0, 0, 0, 0.32)';
    ctx.beginPath();
    ctx.ellipse(t.x, t.y + 16, 36, 12, 0, 0, Math.PI * 2);
    ctx.fill();

    // Dark iron pedestal leg
    ctx.fillStyle = '#261208';
    ctx.fillRect(t.x - 3.5, t.y, 7, 16);
    ctx.fillStyle = '#180a04';
    ctx.beginPath();
    ctx.ellipse(t.x, t.y + 15, 12, 4, 0, 0, Math.PI * 2);
    ctx.fill();

    // 3. Solid Oak Tabletop with Beveled Rim & Concentric Wood Grain Rings
    ctx.fillStyle = '#78350f';
    ctx.beginPath();
    ctx.ellipse(t.x, t.y, 35, 15, 0, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = '#92400e';
    ctx.beginPath();
    ctx.ellipse(t.x, t.y - 1, 33, 13.5, 0, 0, Math.PI * 2);
    ctx.fill();

    // Concentric wood ring
    ctx.strokeStyle = '#a16207';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.ellipse(t.x, t.y - 1, 22, 8.5, 0, 0, Math.PI * 2);
    ctx.stroke();

    // Highlight rim
    ctx.strokeStyle = '#f59e0b';
    ctx.lineWidth = 1.2;
    ctx.beginPath();
    ctx.ellipse(t.x, t.y - 1, 33.5, 14, 0, 0, Math.PI * 2);
    ctx.stroke();

    // 4. White Ceramic Daisy Flower Vase (Lọ hoa cúc họa mi)
    const vaseX = t.x + 12;
    const vaseY = t.y - 6;
    ctx.fillStyle = '#f8fafc'; // ceramic vase body
    ctx.fillRect(vaseX - 3, vaseY - 6, 6, 7);
    ctx.fillStyle = '#16a34a'; // flower stem
    ctx.fillRect(vaseX - 1, vaseY - 10, 2, 5);
    // Daisy petals
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(vaseX - 4, vaseY - 13, 8, 3);
    ctx.fillRect(vaseX - 2, vaseY - 15, 4, 7);
    // Golden daisy flower center
    ctx.fillStyle = '#facc15';
    ctx.fillRect(vaseX - 1.5, vaseY - 12.5, 3, 3);

    // 5. Scented Candle in Glass Tumbler with Flickering Warm Flame
    const candleX = t.x - 14;
    const candleY = t.y - 6;
    ctx.fillStyle = 'rgba(255, 255, 255, 0.45)'; // glass tumbler
    ctx.fillRect(candleX - 3, candleY - 5, 6, 6);
    ctx.fillStyle = '#fef3c7'; // wax
    ctx.fillRect(candleX - 2, candleY - 2, 4, 3);
    // Flickering candle flame
    const flameFlicker = Math.sin(f * 0.25 + t.x) * 1.2;
    ctx.fillStyle = '#f59e0b';
    ctx.beginPath();
    ctx.arc(candleX + flameFlicker * 0.5, candleY - 7, 2.2, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#fef08a';
    ctx.fillRect(candleX - 0.8 + flameFlicker * 0.5, candleY - 8, 1.6, 2);

    // Soft warm candlelight ambient glow
    const candleGlow = ctx.createRadialGradient(candleX, candleY - 7, 1, candleX, candleY - 7, 16);
    candleGlow.addColorStop(0, 'rgba(254, 240, 138, 0.35)');
    candleGlow.addColorStop(1, 'rgba(254, 240, 138, 0)');
    ctx.fillStyle = candleGlow;
    ctx.beginPath();
    ctx.arc(candleX, candleY - 7, 16, 0, Math.PI * 2);
    ctx.fill();

    // 6. Ceramic Coffee Mug with Crema & Steaming Vapour
    ctx.fillStyle = '#f8fafc';
    ctx.fillRect(t.x - 4, t.y - 9, 8, 7);
    ctx.fillStyle = '#451a03';
    ctx.fillRect(t.x - 3, t.y - 8, 6, 2); // espresso
    ctx.fillStyle = '#d97706';
    ctx.fillRect(t.x - 2, t.y - 8, 4, 1); // golden crema
    // Handle
    ctx.strokeStyle = '#f8fafc';
    ctx.lineWidth = 1.2;
    ctx.strokeRect(t.x + 3.5, t.y - 7.5, 3, 4);

    // Steam vapour
    ctx.fillStyle = 'rgba(255, 255, 255, 0.5)';
    const sY = t.y - 12 - ((f * 0.8) % 12);
    const sX = t.x - 1 + Math.sin(f * 0.1) * 2;
    ctx.fillRect(sX, sY, 2, 2);
  }

  /**
   * Render Interactive NPCs
   */
  drawNPC(ctx, npc) {
    const f = this.frame;

    if (npc.id === 'anh_quan') {
      // 🧑‍🍳 Anh Quân (Barista Trưởng Rang Xay) standing at bar
      ctx.fillStyle = '#1e1b4b'; // dark hair
      ctx.fillRect(npc.x + 2, npc.y - 2, 15, 8);
      ctx.fillStyle = '#fed7aa'; // face
      ctx.fillRect(npc.x + 3, npc.y + 5, 13, 9);
      // Moustache & Eyes
      ctx.fillStyle = '#18181b';
      ctx.fillRect(npc.x + 5, npc.y + 8, 2, 2);
      ctx.fillRect(npc.x + 11, npc.y + 8, 2, 2);
      ctx.fillRect(npc.x + 6, npc.y + 11, 6, 2); // neat moustache
      // Dark leather apron
      ctx.fillStyle = '#451a03';
      ctx.fillRect(npc.x + 2, npc.y + 14, 15, 14);

      if (this.bossState && this.bossState.isActive) {
        // Giant Golden Roasting Ladle (Muôi Rang Hạt Khổng Lồ) in hand!
        ctx.fillStyle = '#f59e0b';
        ctx.fillRect(npc.x + 18, npc.y + 4, 3, 20); // ladle handle
        ctx.fillStyle = '#d97706';
        ctx.beginPath();
        ctx.arc(npc.x + 19.5, npc.y + 2, 7, 0, Math.PI * 2); // scoop
        ctx.fill();
        ctx.fillStyle = '#78350f';
        ctx.fillRect(npc.x + 16, npc.y + 1, 7, 2); // roasted coffee beans inside
        // Determined glowing eyes
        ctx.fillStyle = '#facc15';
        ctx.fillRect(npc.x + 5, npc.y + 7, 3, 2);
        ctx.fillRect(npc.x + 11, npc.y + 7, 3, 2);

        // Shouting speech bubble when Boss active!
        if (f % 220 < 110) {
          this.drawSpeechBubble(ctx, npc.x + 8, npc.y - 18, 'Bảo vệ quầy bar bằng mọi giá! ☕🔥');
        }
      } else {
        // Coffee Tamper in hand
        const tamperBob = Math.sin(f * 0.15) * 3;
        ctx.fillStyle = '#94a3b8';
        ctx.fillRect(npc.x + 18, npc.y + 15 + tamperBob, 4, 8);
        ctx.fillStyle = '#451a03';
        ctx.fillRect(npc.x + 17, npc.y + 13 + tamperBob, 6, 3);
      }
    } else if (npc.id === 'be_tra') {
      // 👧 Bé Trà (Phục Vụ) walking between tables with wooden tray or delivering ammo during Boss
      const bob = Math.sin(f * 0.25) * 2;
      ctx.save();
      ctx.translate(npc.x, npc.y + bob);
      if (npc.dir < 0) ctx.scale(-1, 1);

      // Hair pigtails
      ctx.fillStyle = '#92400e';
      ctx.fillRect(-6, -26, 12, 7);
      ctx.fillRect(-9, -23, 4, 8); // left pigtail
      ctx.fillRect(5, -23, 4, 8);  // right pigtail
      // Face
      ctx.fillStyle = '#fde68a';
      ctx.fillRect(-5, -19, 10, 8);
      // Eyes
      ctx.fillStyle = '#1e1b4b';
      ctx.fillRect(-3, -16, 2, 2);
      ctx.fillRect(1, -16, 2, 2);
      // Dress
      ctx.fillStyle = '#b45309';
      ctx.fillRect(-6, -11, 12, 10);
      ctx.fillStyle = '#fef08a'; // apron bib
      ctx.fillRect(-3, -9, 6, 8);
      // Legs
      ctx.fillStyle = '#1e293b';
      ctx.fillRect(-4, -1, 3, 5);
      ctx.fillRect(1, -1, 3, 5);

      if (this.bossState && this.bossState.isActive) {
        // Ammo crate in hands!
        ctx.fillStyle = '#f59e0b';
        ctx.fillRect(3, -12, 12, 8);
        ctx.fillStyle = '#111827';
        ctx.fillRect(5, -10, 8, 2); // pearls label
        if (f % 200 < 100) {
          this.drawSpeechBubble(ctx, npc.x, npc.y - 32, 'Cố lên Baristas! Em gửi đạn tiếp sức! 🧋');
        }
      } else {
        // Wooden Tray in hands with steaming cup
        ctx.fillStyle = '#78350f';
        ctx.fillRect(3, -9, 12, 2);
        ctx.fillStyle = '#f8fafc';
        ctx.fillRect(7, -14, 5, 5);
        ctx.fillStyle = '#ec4899';
        ctx.fillRect(8, -13, 3, 2);
      }

      ctx.restore();
    } else if (npc.id === 'meo_boba') {
      // 🐱 Mèo Mướp Boba sleeping curled up vs cheering during boss battle
      const catBreathe = Math.sin(f * 0.08) * 1.5;
      const catSurprised = this.bossState && this.bossState.isActive;

      if (catSurprised) {
        // Cat jumped up cheering!
        const cheerJump = Math.sin(f * 0.3) * 4;
        ctx.fillStyle = '#eab308'; // orange tabby
        ctx.beginPath();
        ctx.ellipse(npc.x, npc.y - 4 + cheerJump, 7, 10, 0, 0, Math.PI * 2);
        ctx.fill();
        // Head
        ctx.beginPath();
        ctx.arc(npc.x, npc.y - 14 + cheerJump, 6, 0, Math.PI * 2);
        ctx.fill();
        // Ears
        ctx.fillStyle = '#ca8a04';
        ctx.fillRect(npc.x - 6, npc.y - 20 + cheerJump, 4, 4);
        ctx.fillRect(npc.x + 2, npc.y - 20 + cheerJump, 4, 4);
        // Red Bell Collar
        ctx.fillStyle = '#ef4444';
        ctx.fillRect(npc.x - 4, npc.y - 9 + cheerJump, 8, 2);
        // Speech bubble
        if (f % 180 < 90) {
          this.drawSpeechBubble(ctx, npc.x, npc.y - 30, 'Meo meo! Cố lên! 🐱✨');
        }
      } else {
        // Cat sleeping peacefully
        ctx.fillStyle = '#eab308';
        ctx.beginPath();
        ctx.ellipse(npc.x, npc.y + catBreathe, 11, 7, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = '#ca8a04'; // tabby stripes
        ctx.fillRect(npc.x - 4, npc.y - 4 + catBreathe, 2, 6);
        ctx.fillRect(npc.x + 2, npc.y - 4 + catBreathe, 2, 6);
        // Head
        ctx.beginPath();
        ctx.arc(npc.x - 8, npc.y - 1 + catBreathe, 5, 0, Math.PI * 2);
        ctx.fill();
        // Sleeping eye line
        ctx.fillStyle = '#111827';
        ctx.fillRect(npc.x - 10, npc.y - 1 + catBreathe, 3, 1);
        // Red bell
        ctx.fillStyle = '#ef4444';
        ctx.fillRect(npc.x - 4, npc.y + catBreathe, 3, 3);
        // Tail
        ctx.fillStyle = '#eab308';
        ctx.fillRect(npc.x + 9, npc.y - 2 + Math.sin(f * 0.12) * 2, 4, 3);
      }
    } else if (npc.id === 'hoang_it') {
      // 💻 Hoàng IT sitting at corner table typing deadline
      ctx.fillStyle = '#0284c7'; // hoodie
      ctx.fillRect(npc.x - 5, npc.y - 16, 12, 14);
      // Head
      ctx.fillStyle = '#fed7aa';
      ctx.fillRect(npc.x - 4, npc.y - 26, 10, 10);
      // Thick glasses
      ctx.fillStyle = '#0f172a';
      ctx.fillRect(npc.x - 4, npc.y - 22, 10, 3);
      ctx.fillStyle = '#38bdf8'; // glasses reflection
      ctx.fillRect(npc.x - 2, npc.y - 21, 2, 1);
      ctx.fillRect(npc.x + 2, npc.y - 21, 2, 1);
      // Laptop on table
      ctx.fillStyle = '#475569';
      ctx.fillRect(npc.x + 8, npc.y - 8, 10, 2); // base
      ctx.fillStyle = '#0f172a';
      ctx.fillRect(npc.x + 14, npc.y - 16, 2, 8); // screen back
      // Glowing blue screen light
      ctx.fillStyle = '#38bdf8';
      ctx.fillRect(npc.x + 13, npc.y - 15, 1, 7);

      if (this.bossState && this.bossState.isActive && f % 220 < 100) {
        this.drawSpeechBubble(ctx, npc.x + 8, npc.y - 34, 'Đừng phá Wi-Fi quán của tao! 💻⚡');
      }
    }
  }

  /**
   * World Boss: Quái Vật Bạch Tuộc Hưng Răm (#52)
   * Rendered with Harmonic Sine Wave Tentacles & Glowing Sunglasses
   */
  drawBoss(ctx) {
    const f = this.frame;
    const bx = 480;
    const floatY = Math.sin(f * 0.08) * 8;
    const by = 160 + floatY;
    const phase = this.bossState.phase || 1;

    ctx.save();
    ctx.translate(bx, by);

    // Hit flash tint
    if (this.bossHitFlash > 0) {
      ctx.filter = 'brightness(1.9)';
    }

    // Phase 3 Foaming Bubble Barrier
    if (phase === 3) {
      ctx.strokeStyle = '#38bdf8';
      ctx.lineWidth = 3;
      ctx.setLineDash([8, 6]);
      ctx.lineDashOffset = -f * 1.5;
      ctx.beginPath();
      ctx.arc(0, 0, 88, 0, Math.PI * 2);
      ctx.stroke();
      ctx.setLineDash([]);

      ctx.fillStyle = 'rgba(56, 189, 248, 0.16)';
      ctx.beginPath();
      ctx.arc(0, 0, 88, 0, Math.PI * 2);
      ctx.fill();
    }

    // 8 Harmonic Sine Wave Tentacles
    const tentacleConfigs = [
      { x: -55, isBack: true },
      { x: -35, isBack: true },
      { x: 35, isBack: true },
      { x: 55, isBack: true },
      { x: -45, isBack: false },
      { x: -20, isBack: false },
      { x: 20, isBack: false },
      { x: 45, isBack: false }
    ];

    tentacleConfigs.forEach((tCfg, idx) => {
      ctx.fillStyle = tCfg.isBack ? '#7e22ce' : '#9333ea';
      let currentX = tCfg.x;
      let currentY = tCfg.isBack ? 22 : 30;

      // Draw 4 soft articulate segments
      for (let s = 0; s < 4; s++) {
        const wave = Math.sin(f * 0.18 + idx * 0.75 + s * 0.5) * (4 + s * 2.2);
        ctx.fillRect(currentX + wave, currentY + s * 11, 14 - s, 12);

        // Cyan Glowing Sucker Dots
        if (s >= 2) {
          ctx.fillStyle = '#22d3ee';
          ctx.fillRect(currentX + wave + 4, currentY + s * 11 + 3, 5, 5);
          ctx.fillStyle = tCfg.isBack ? '#7e22ce' : '#9333ea';
        }
      }
    });

    // Big Purple Squid Head
    ctx.fillStyle = '#9333ea';
    ctx.fillRect(-45, -35, 90, 75);
    ctx.fillStyle = '#a855f7';
    ctx.fillRect(-38, -42, 76, 12);
    ctx.fillStyle = '#7e22ce';
    ctx.fillRect(-48, -25, 96, 55);

    // Cyan Luminous Spots on Head
    ctx.fillStyle = '#22d3ee';
    ctx.fillRect(-35, -20, 8, 8);
    ctx.fillRect(27, -20, 8, 8);

    // Vietnamese Nón Lá Cute (#FDE047)
    ctx.fillStyle = '#fde047';
    ctx.beginPath();
    ctx.moveTo(0, -68);
    ctx.lineTo(-44, -36);
    ctx.lineTo(44, -36);
    ctx.closePath();
    ctx.fill();

    // Bamboo Weave Lines on Nón Lá
    ctx.strokeStyle = '#ca8a04';
    ctx.lineWidth = 1.2;
    ctx.beginPath();
    ctx.moveTo(0, -68); ctx.lineTo(-20, -36);
    ctx.moveTo(0, -68); ctx.lineTo(20, -36);
    ctx.moveTo(-30, -46); ctx.lineTo(30, -46);
    ctx.moveTo(-18, -56); ctx.lineTo(18, -56);
    ctx.stroke();

    // Cool Sunglasses (#0F172A, flashes red in Phase 2)
    const glassColor = (phase === 2) ? '#ef4444' : '#0f172a';
    ctx.fillStyle = glassColor;
    ctx.fillRect(-36, -6, 32, 22);
    ctx.fillRect(4, -6, 32, 22);

    // Golden Bridge
    ctx.fillStyle = '#facc15';
    ctx.fillRect(-4, 0, 8, 6);

    // Diagonal Glass Glint Reflection
    const glintOffset = (f * 0.6) % 30;
    ctx.fillStyle = phase === 2 ? '#fca5a5' : '#38bdf8';
    ctx.fillRect(-32 + (glintOffset % 24), -2, 6, 6);
    ctx.fillRect(8 + (glintOffset % 24), -2, 6, 6);

    // Mischievous Tooth Grin
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(-8, 20, 16, 5);
    ctx.fillStyle = '#facc15'; // golden fang
    ctx.fillRect(3, 22, 4, 5);

    // Giant Boba Cup in Tentacles
    ctx.fillStyle = 'rgba(255, 255, 255, 0.85)';
    ctx.fillRect(38, -5, 26, 34);
    ctx.fillStyle = '#78350f'; // tea
    ctx.fillRect(40, 2, 22, 24);
    // Boba pearls in cup
    ctx.fillStyle = '#111827';
    ctx.beginPath();
    ctx.arc(46, 20, 3, 0, Math.PI * 2);
    ctx.arc(54, 21, 3, 0, Math.PI * 2);
    ctx.arc(50, 15, 3, 0, Math.PI * 2);
    ctx.fill();

    ctx.restore();
  }

  /**
   * Draw Players / Baristas with 4-directional Feeling, Leather Apron, Drink Coffee & Shoot Shaker Animations
   */
  drawPlayer(ctx, p, isLocal = false) {
    if (!p) return;
    const f = this.frame;
    const px = (p.x + 0.5) | 0;
    const py = (p.y + 0.5) | 0;
    const dir = p.direction || 1;
    const isWalking = p.state === 'walk';
    const walkBob = isWalking ? Math.sin(f * 0.3) * 3 : Math.sin(f * 0.08) * 1;
    const isSitting = !!p.sitting;

    // Active animation states
    const isDrinking = (p.drinkAnimTimer || 0) > 0;
    const isShooting = (p.shootAnimTimer || 0) > 0;
    const recoilX = isShooting ? (dir > 0 ? -2 : 2) : 0;

    ctx.save();
    ctx.translate(px + recoilX, py + (isSitting ? 0 : walkBob));

    // Dynamic Drop Shadow
    ctx.fillStyle = 'rgba(0, 0, 0, 0.28)';
    ctx.beginPath();
    ctx.ellipse(0, 4, isWalking ? 10 : 12, 5, 0, 0, Math.PI * 2);
    ctx.fill();

    // Flip sprite if facing left
    if (dir < 0) ctx.scale(-1, 1);

    const bodyY = isSitting ? -14 : -18;
    const headY = isSitting ? -24 : -28;

    // Body / Outfit
    ctx.fillStyle = isLocal ? '#0284c7' : '#7c3aed';
    ctx.fillRect(-6, bodyY, 12, 14);

    // Head
    ctx.fillStyle = '#fed7aa';
    ctx.fillRect(-5, headY, 10, 10);

    // Hair & Beret Cap
    ctx.fillStyle = isLocal ? '#b45309' : '#1e1b4b';
    ctx.fillRect(-6, headY - 2, 12, 6);
    // Artist Beret accent
    ctx.fillStyle = isLocal ? '#0284c7' : '#6b21a8';
    ctx.fillRect(-5, headY - 4, 10, 3);
    ctx.fillRect(2, headY - 5, 2, 2); // beret stalk

    // Eyes: Curved happy eyes ^^ if drinking coffee, otherwise normal pixels
    if (isDrinking) {
      ctx.strokeStyle = '#18181b';
      ctx.lineWidth = 1.2;
      ctx.beginPath();
      ctx.arc(-2, headY + 5, 2, Math.PI, 0);
      ctx.arc(2, headY + 5, 2, Math.PI, 0);
      ctx.stroke();

      // White Milk Cream Foam on mouth
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(-1.5, headY + 7, 3, 1.5);

      // Raised Coffee Cup in hands
      ctx.fillStyle = '#f8fafc';
      ctx.fillRect(dir > 0 ? 3 : -7, headY + 6, 5, 6);
      ctx.fillStyle = '#78350f';
      ctx.fillRect(dir > 0 ? 4 : -6, headY + 6, 3, 2);

      // Radiant Expanding Lucky Buff Aura Ring
      const auraR = 14 + ((f * 1.5) % 18);
      ctx.strokeStyle = `rgba(251, 191, 36, ${Math.max(0, 1 - auraR / 32)})`;
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.arc(0, bodyY + 6, auraR, 0, Math.PI * 2);
      ctx.stroke();
    } else {
      // Normal Eyes
      ctx.fillStyle = '#18181b';
      ctx.fillRect(-3, headY + 4, 2, 2);
      ctx.fillRect(1, headY + 4, 2, 2);
    }

    // Legs
    ctx.fillStyle = '#1e293b';
    if (isSitting) {
      // Folded legs
      ctx.fillRect(-5, -2, 10, 5);
      ctx.fillStyle = '#0f172a';
      ctx.fillRect(0, -2, 4, 5);
      // Steaming coffee mug on lap if not drinking
      if (!isDrinking) {
        ctx.fillStyle = '#f8fafc';
        ctx.fillRect(2, -9, 5, 6);
        ctx.fillStyle = '#451a03';
        ctx.fillRect(3, -9, 3, 2);
        ctx.fillStyle = 'rgba(255, 255, 255, 0.7)';
        const smY = -11 - ((f * 0.8) % 6);
        ctx.fillRect(4, smY, 2, 2);
      }
    } else {
      const legOffset = isWalking ? Math.sin(f * 0.3) * 4 : 0;
      ctx.fillRect(-5, -4, 4, 8 + legOffset);
      ctx.fillRect(1, -4, 4, 8 - legOffset);
    }

    // Vintage Cowhide Leather Apron (#4E2A16)
    ctx.fillStyle = '#4e2a16';
    ctx.fillRect(-4, bodyY + 3, 8, 11);
    // Apron Bib Buckle
    ctx.fillStyle = '#f59e0b';
    ctx.fillRect(-3, bodyY + 2, 6, 2);
    // Pocket with blue order pen & golden cupping spoon
    ctx.fillStyle = '#38bdf8';
    ctx.fillRect(1, bodyY + 7, 1.5, 4); // order pen
    ctx.fillStyle = '#facc15';
    ctx.fillRect(-2, bodyY + 6, 1.5, 5); // gold spoon

    // Tactical Boba Shaker extended if shooting
    if (isShooting) {
      ctx.fillStyle = '#cbd5e1';
      ctx.fillRect(6, bodyY + 3, 8, 4);
      ctx.fillStyle = '#f59e0b';
      ctx.fillRect(12, bodyY + 4, 2, 2); // muzzle flash
    }

    ctx.restore();

    // Overhead Elements (Name Tag, Title, Speech Bubble, Emote)
    this.drawPlayerOverhead(ctx, p, isLocal);
  }

  drawPlayerOverhead(ctx, p, isLocal) {
    const px = (p.x + 0.5) | 0;
    const py = (p.y - 36) | 0;
    const now = Date.now();

    // 1. MVP Crown if holding top title
    if (p.title && p.title.includes('Chiến Thần Đập Răm')) {
      const crownBob = Math.sin(this.frame * 0.1) * 3;
      ctx.font = '14px Arial';
      ctx.textAlign = 'center';
      ctx.fillText('👑✨', px, py - 20 + crownBob);
    }

    // 2. Title Badge
    if (p.title) {
      ctx.fillStyle = isLocal ? '#fde047' : '#c084fc';
      ctx.font = 'bold 9px Arial, sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(p.title, px, py - 11);
    }

    // 3. Player Name Tag
    ctx.fillStyle = isLocal ? '#38bdf8' : '#ffffff';
    ctx.font = 'bold 11px Arial, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(p.storeName || 'Barista', px, py);

    // 4. Coffee Steam Aura if recently drank coffee or sitting
    if (p.coffeeSteam || p.sitting || (p.drinkAnimTimer && p.drinkAnimTimer > 0)) {
      ctx.fillStyle = 'rgba(251, 191, 36, 0.85)';
      ctx.font = '12px Arial';
      ctx.fillText('☕✨', px + 16, py - 4);
    }

    // 5. Emote Floating Pop
    if (p.lastEmote && p.lastEmoteTime && (now - p.lastEmoteTime < 4000)) {
      const emoteMap = { wave: '👋', cheers: '☕', dance: '💃', heart: '❤️' };
      const icon = emoteMap[p.lastEmote] || '👋';
      const bob = Math.sin((now - p.lastEmoteTime) * 0.008) * 4;
      ctx.font = '20px Arial';
      ctx.textAlign = 'center';
      ctx.fillText(icon, px, py - 28 + bob);
    }

    // 6. Speech Bubble
    if (p.lastChat && p.lastChatTime && (now - p.lastChatTime < 6000)) {
      this.drawSpeechBubble(ctx, px, py - 24, p.lastChat);
    }
  }

  drawSpeechBubble(ctx, x, y, message) {
    ctx.font = '11px Arial, sans-serif';
    const textWidth = ctx.measureText(message).width;
    const padX = 8;
    const boxWidth = Math.min(180, textWidth + padX * 2);
    const boxHeight = 22;
    const boxX = x - boxWidth / 2;
    const boxY = y - boxHeight - 6;

    // Bubble Background
    ctx.fillStyle = 'rgba(15, 23, 42, 0.95)';
    ctx.strokeStyle = '#38bdf8';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.roundRect(boxX, boxY, boxWidth, boxHeight, 6);
    ctx.fill();
    ctx.stroke();

    // Bubble Tail
    ctx.fillStyle = 'rgba(15, 23, 42, 0.95)';
    ctx.beginPath();
    ctx.moveTo(x - 5, boxY + boxHeight);
    ctx.lineTo(x + 5, boxY + boxHeight);
    ctx.lineTo(x, boxY + boxHeight + 6);
    ctx.closePath();
    ctx.fill();

    // Text
    ctx.fillStyle = '#ffffff';
    ctx.textAlign = 'center';
    ctx.fillText(message, x, boxY + 15, boxWidth - 10);
  }

  drawProjectiles(ctx) {
    for (let i = 0; i < this.projectilePool.length; i++) {
      const p = this.projectilePool[i];
      if (!p.active) continue;

      ctx.save();
      ctx.translate(p.currentX, p.currentY);

      if (p.pearlType === 'pearl_flame') {
        ctx.fillStyle = '#ea580c';
        ctx.beginPath();
        ctx.arc(0, 0, 5, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = '#fde047';
        ctx.beginPath();
        ctx.arc(0, 0, 2.5, 0, Math.PI * 2);
        ctx.fill();
      } else if (p.pearlType === 'pearl_golden') {
        ctx.fillStyle = '#facc15';
        ctx.beginPath();
        ctx.arc(0, 0, 6, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(-1, -1, 3, 3);
      } else if (p.pearlType === 'pearl_frost') {
        ctx.fillStyle = '#38bdf8';
        ctx.beginPath();
        ctx.arc(0, 0, 5, 0, Math.PI * 2);
        ctx.fill();
      } else if (p.pearlType === 'pearl_cosmic') {
        ctx.fillStyle = '#9333ea';
        ctx.beginPath();
        ctx.arc(0, 0, 8, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = '#f472b6';
        ctx.beginPath();
        ctx.arc(0, 0, 4, 0, Math.PI * 2);
        ctx.fill();
      } else {
        // Basic Pearl
        ctx.fillStyle = '#18181b';
        ctx.beginPath();
        ctx.arc(0, 0, 4.5, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = '#475569';
        ctx.beginPath();
        ctx.arc(-1, -1, 1.5, 0, Math.PI * 2);
        ctx.fill();
      }

      ctx.restore();
    }
  }

  drawParticles(ctx) {
    for (let i = 0; i < this.particlePool.length; i++) {
      const pt = this.particlePool[i];
      if (!pt.active) continue;

      ctx.fillStyle = pt.color;
      ctx.globalAlpha = pt.alpha;
      ctx.fillRect(pt.x, pt.y, pt.size, pt.size);
    }
    ctx.globalAlpha = 1.0;
  }

  drawDamageTexts(ctx) {
    for (let i = 0; i < this.damageTextPool.length; i++) {
      const dt = this.damageTextPool[i];
      if (!dt.active) continue;

      ctx.font = `bold ${dt.size}px Arial, sans-serif`;
      ctx.textAlign = 'center';
      ctx.fillStyle = dt.color;
      ctx.globalAlpha = dt.alpha;
      ctx.shadowColor = '#000000';
      ctx.shadowBlur = 4;
      ctx.fillText(dt.text, dt.x, dt.y);
      ctx.shadowBlur = 0;
    }
    ctx.globalAlpha = 1.0;
  }

  drawBossInkBubbles(ctx) {
    const f = this.frame;
    for (let i = 0; i < this.inkBubblePool.length; i++) {
      const b = this.inkBubblePool[i];
      if (!b.active) continue;

      ctx.save();
      ctx.translate(b.x, b.y);

      // Bubble Shadow on Floor
      ctx.fillStyle = 'rgba(0, 0, 0, 0.2)';
      ctx.beginPath();
      ctx.ellipse(0, 16, b.radius, 4, 0, 0, Math.PI * 2);
      ctx.fill();

      // Outer Translucent Bubble
      ctx.fillStyle = 'rgba(168, 85, 247, 0.55)';
      ctx.beginPath();
      ctx.arc(0, 0, b.radius, 0, Math.PI * 2);
      ctx.fill();

      ctx.strokeStyle = '#c084fc';
      ctx.lineWidth = 1.5;
      ctx.stroke();

      // Glare highlight
      ctx.fillStyle = 'rgba(255, 255, 255, 0.75)';
      ctx.beginPath();
      ctx.arc(-b.radius * 0.35, -b.radius * 0.35, b.radius * 0.25, 0, Math.PI * 2);
      ctx.fill();

      // Inner Floating Tapioca Pearl
      const bPearlY = Math.sin((f + b.x) * 0.1) * 2;
      ctx.fillStyle = '#0f172a';
      ctx.beginPath();
      ctx.arc(0, bPearlY, b.radius * 0.38, 0, Math.PI * 2);
      ctx.fill();

      ctx.restore();
    }
  }

  drawInteractionPrompts(ctx) {
    const p = this.localPlayer;
    if (!p) return;
    const f = this.frame;
    const bob = Math.sin(f * 0.1) * 3;

    // 1. Quầy Bar Chị Thảo Proximity (x: 340..520, y < 270)
    if (p.x >= 340 && p.x <= 520 && p.y <= 270) {
      this.drawPillPrompt(ctx, 430, 130 + bob, '☕ Nhấn [E] hoặc Chạm để Order Cà Phê', '#f59e0b');
    }

    // 2. Bàn Tròn Gỗ Sồi Proximity
    const nearTable = (Math.hypot(p.x - 180, p.y - 380) < 55) ||
                      (Math.hypot(p.x - 480, p.y - 460) < 55) ||
                      (Math.hypot(p.x - 780, p.y - 380) < 55);
    if (nearTable) {
      const text = p.sitting ? '🚶 Nhấn [E] hoặc Chạm để Đứng Dậy' : '🪑 Nhấn [E] hoặc Chạm để Ngồi Uống Cà Phê';
      this.drawPillPrompt(ctx, p.x, p.y - 48 + bob, text, '#10b981');
    }

    // 3. Ban Công Hoàng Hôn Proximity (x > 750)
    if (p.x > 750) {
      this.drawPillPrompt(ctx, 840, 40 + bob, '🌅 Nhấn [E] hoặc Chạm để Ngắm Hoàng Hôn 📸', '#ec4899');
    }

    // 4. Bé Trà Tiếp Tế Đạn Trân Châu (Khi Boss Đang Hoạt Động)
    if (this.bossState && this.bossState.isActive && !this.bossState.isDefeated) {
      const beTra = this.npcs.find(n => n.id === 'be_tra');
      if (beTra && Math.hypot(p.x - beTra.x, p.y - beTra.y) < 65) {
        this.drawPillPrompt(ctx, beTra.x, beTra.y - 38 + bob, '🎁 Nhấn [E] hoặc Chạm: Bé Trà Tiếp Tế +10 Đạn! 🧋', '#f59e0b');
      }
    }
  }

  drawPillPrompt(ctx, x, y, text, borderColor) {
    ctx.font = 'bold 10px Arial, sans-serif';
    const tw = ctx.measureText(text).width;
    const px = x - (tw + 16) / 2;
    const py = y - 10;

    ctx.fillStyle = 'rgba(15, 23, 42, 0.9)';
    ctx.strokeStyle = borderColor;
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.roundRect(px, py, tw + 16, 20, 6);
    ctx.fill();
    ctx.stroke();

    ctx.fillStyle = '#ffffff';
    ctx.textAlign = 'center';
    ctx.fillText(text, x, y + 4);
  }

  drawVictoryCelebration(ctx) {
    if (!this.bossState || !this.bossState.isDefeated) return;

    // Celebration Confetti
    for (let i = 0; i < this.celebrationPool.length; i++) {
      const cp = this.celebrationPool[i];
      if (!cp.active) continue;
      ctx.fillStyle = cp.color;
      ctx.globalAlpha = cp.alpha;
      ctx.fillRect(cp.x, cp.y, cp.size, cp.size);
    }
    ctx.globalAlpha = 1.0;

    // Victory Banner
    const f = this.frame;
    const pulse = 1.0 + Math.sin(f * 0.1) * 0.05;
    ctx.save();
    ctx.translate(480, 220);
    ctx.scale(pulse, pulse);

    ctx.fillStyle = 'rgba(15, 7, 24, 0.92)';
    ctx.strokeStyle = '#facc15';
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    ctx.roundRect(-210, -22, 420, 44, 10);
    ctx.fill();
    ctx.stroke();

    ctx.fillStyle = '#fde047';
    ctx.font = 'bold 15px Arial, sans-serif';
    ctx.textAlign = 'center';
    ctx.shadowColor = '#d97706';
    ctx.shadowBlur = 8;
    ctx.fillText('🎉 QUÁI VẬT HƯNG RĂM ĐÃ BỊ TIÊU DIỆT! 🎉', 0, 5);
    ctx.shadowBlur = 0;

    ctx.restore();
  }
}
