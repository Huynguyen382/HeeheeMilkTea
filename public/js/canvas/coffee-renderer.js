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

    // 3. Sunset Balcony Frame & Skyline (x: 740 to 960)
    const skyGrad = octx.createLinearGradient(740, 0, 960, 260);
    skyGrad.addColorStop(0, '#2e1065'); // deep twilight violet
    skyGrad.addColorStop(0.35, '#701a75'); // dusk magenta
    skyGrad.addColorStop(0.7, '#c2410c'); // fiery sunset orange
    skyGrad.addColorStop(1, '#fde047'); // radiant golden horizon
    octx.fillStyle = skyGrad;
    octx.fillRect(740, 0, 220, 260);

    // Golden Sunset Sun Disc dipping behind skyline
    const sunGrad = octx.createRadialGradient(845, 145, 6, 845, 145, 48);
    sunGrad.addColorStop(0, '#fffbeb');
    sunGrad.addColorStop(0.3, '#fef08a');
    sunGrad.addColorStop(0.7, 'rgba(251, 146, 60, 0.45)');
    sunGrad.addColorStop(1, 'rgba(251, 146, 60, 0)');
    octx.fillStyle = sunGrad;
    octx.beginPath();
    octx.arc(845, 145, 48, 0, Math.PI * 2);
    octx.fill();

    // City Skyline Silhouettes (Saigon Dusk Skyline with Landmark 81)
    octx.fillStyle = '#140620';
    // Left highrise towers
    octx.fillRect(748, 148, 22, 112);
    octx.fillRect(772, 128, 20, 132);
    // Bitexco-style helipad tower silhouette
    octx.fillRect(788, 108, 30, 152);
    octx.fillStyle = '#1c0a2a';
    octx.fillRect(782, 138, 12, 4); // helipad flange
    octx.fillRect(802, 94, 3, 14); // antenna

    // Landmark 81 Tower - Stepped Iconic Architectural Silhouette
    octx.fillStyle = '#12041c';
    // Tier 1 (Base): 42px wide
    octx.fillRect(828, 140, 42, 120);
    // Tier 2: 34px wide
    octx.fillRect(832, 108, 34, 32);
    // Tier 3: 26px wide
    octx.fillRect(836, 82, 26, 26);
    // Tier 4 (Crown): 18px wide
    octx.fillRect(840, 64, 18, 18);
    // Spire: Slender spire rising to peak at y: 46
    octx.fillRect(847, 46, 4, 18);
    octx.fillStyle = '#38bdf8';
    octx.fillRect(848, 48, 2, 8); // spire highlight

    // Right skyline towers
    octx.fillStyle = '#160624';
    octx.fillRect(880, 122, 28, 138);
    octx.fillRect(912, 136, 22, 124);
    octx.fillRect(938, 115, 20, 145);
    octx.fillRect(946, 98, 2, 17); // antenna

    // Pre-rendered warm window lights in skyline towers
    octx.fillStyle = '#fef08a';
    const staticWindows = [
      [752, 160], [758, 175], [764, 190],
      [792, 125], [798, 140], [804, 165], [794, 185],
      [836, 120], [842, 120], [850, 120], [856, 120],
      [838, 145], [846, 145], [854, 145], [862, 145],
      [836, 170], [844, 170], [852, 170], [860, 170],
      [840, 92], [846, 92], [852, 92],
      [886, 135], [894, 150], [902, 165],
      [916, 150], [922, 168], [944, 130], [950, 155]
    ];
    staticWindows.forEach(([wx, wy]) => {
      octx.fillRect(wx, wy, 2.5, 3.5);
    });

    // Glass Partition Pillars & Handrail
    octx.fillStyle = 'rgba(255, 255, 255, 0.15)';
    octx.fillRect(740, 0, 6, 260);
    octx.fillRect(850, 0, 4, 260);
    // Diagonal glass reflections
    octx.fillStyle = 'rgba(255, 255, 255, 0.08)';
    octx.beginPath();
    octx.moveTo(750, 0); octx.lineTo(790, 0); octx.lineTo(740, 160); octx.lineTo(740, 60); octx.closePath();
    octx.fill();
    octx.beginPath();
    octx.moveTo(860, 0); octx.lineTo(910, 0); octx.lineTo(850, 200); octx.lineTo(850, 90); octx.closePath();
    octx.fill();

    // Balcony Handrail
    octx.fillStyle = '#451a03';
    octx.fillRect(740, 230, 220, 10);
    octx.fillStyle = '#78350f';
    octx.fillRect(740, 229, 220, 2); // handrail highlight
    for (let rx = 750; rx < 960; rx += 20) {
      octx.fillStyle = '#270e04';
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

    // 4. Tall Lo-fi Bookshelf (x: 10, y: 16, w: 68, h: 184)
    this.drawBookshelf(octx, 10, 16, 68, 184);

    // 5. Vintage Vinyl Turntable Stand & Indoor Monstera Plant
    this.drawVinylTurntableStand(octx, 92, 165);
    this.drawMonsteraPlant(octx, 84, 195);

    // 6. Detailed Stone Fireplace Structure (Lò Sưởi Đá Cuội) (x: 118, y: 82, w: 98, h: 118)
    this.drawStoneFireplaceStructure(octx, 118, 82, 98, 118);

    // 7. Vintage Chalkboard Menu (Bảng Phấn Menu Cà Phê) (x: 226, y: 22, w: 78, h: 96)
    this.drawVintageChalkboardMenu(octx, 226, 22, 78, 96);

    // Trailing Ivy above counter
    this.drawTrailingIvy(octx, 345, 42);

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

    // Dual Commercial Coffee Grinders & Bean Hoppers (Mazzer / Mahlkönig)
    [435, 528].forEach((gx, idx) => {
      // Grinder cast-iron body
      octx.fillStyle = '#1e293b';
      octx.fillRect(gx - 6, 68, 12, 20);
      octx.fillStyle = '#0f172a';
      octx.fillRect(gx - 7, 85, 14, 3); // base
      // Silver adjustment collar
      octx.fillStyle = '#cbd5e1';
      octx.fillRect(gx - 5, 65, 10, 3);
      // Transparent Conical Glass Bean Hopper
      octx.fillStyle = 'rgba(255, 255, 255, 0.28)';
      octx.beginPath();
      octx.moveTo(gx - 8, 42);
      octx.lineTo(gx + 8, 42);
      octx.lineTo(gx + 4, 65);
      octx.lineTo(gx - 4, 65);
      octx.closePath();
      octx.fill();
      // Whole roasted coffee beans inside hopper
      octx.fillStyle = idx === 0 ? '#3f1d0b' : '#5c2b0e';
      octx.beginPath();
      octx.moveTo(gx - 6, 46);
      octx.lineTo(gx + 6, 46);
      octx.lineTo(gx + 3, 64);
      octx.lineTo(gx - 3, 64);
      octx.closePath();
      octx.fill();
      // Curved glass glare reflection
      octx.fillStyle = 'rgba(255, 255, 255, 0.65)';
      octx.fillRect(gx - 5, 44, 2, 18);
      // Chrome hopper lid
      octx.fillStyle = '#e2e8f0';
      octx.fillRect(gx - 9, 39, 18, 3);
      octx.fillStyle = '#94a3b8';
      octx.fillRect(gx - 2, 37, 4, 2); // knob
    });

    // Cozy Plush Velvet Armchair for Mèo Boba on Balcony (x: 880, y: 350)
    // Dark carved walnut feet
    octx.fillStyle = '#270e04';
    octx.fillRect(864, 360, 4, 6);
    octx.fillRect(894, 360, 4, 6);
    // Armchair shadow
    octx.fillStyle = 'rgba(0, 0, 0, 0.28)';
    octx.beginPath();
    octx.ellipse(881, 364, 22, 6, 0, 0, Math.PI * 2);
    octx.fill();
    // Warm royal burgundy velvet upholstery
    octx.fillStyle = '#831843'; // deep velvet base
    octx.beginPath();
    octx.roundRect(860, 332, 42, 30, 8);
    octx.fill();
    octx.fillStyle = '#9d174d'; // inner cushion
    octx.beginPath();
    octx.roundRect(863, 338, 36, 18, 5);
    octx.fill();
    // Cream Knitted Throw Blanket draped over left armrest
    octx.fillStyle = '#fef3c7';
    octx.beginPath();
    octx.roundRect(858, 336, 10, 22, 3);
    octx.fill();
    // Blanket fringe tassels
    octx.fillStyle = '#fde68a';
    for (let ty = 340; ty < 356; ty += 3) {
      octx.fillRect(856, ty, 2, 1.5);
    }
    // Brass nailhead trim along seat bottom
    octx.fillStyle = '#facc15';
    for (let bx = 864; bx <= 898; bx += 6) {
      octx.fillRect(bx, 358, 2, 2);
    }
  }

  /**
   * Tall Lo-fi Bookshelf with Books, Retro Radio, Potted Succulents & Trailing Ivy
   */
  drawBookshelf(ctx, x, y, w, h) {
    // 1. Dark Walnut Bookshelf Frame
    ctx.fillStyle = '#270e04';
    ctx.fillRect(x, y, w, h);
    ctx.fillStyle = '#3e1d0c';
    ctx.fillRect(x + 3, y + 3, w - 6, h - 6);

    // Decorative Crown Molding at top
    ctx.fillStyle = '#4e2410';
    ctx.fillRect(x - 2, y - 2, w + 4, 6);
    ctx.fillStyle = '#78350f';
    ctx.fillRect(x - 3, y - 4, w + 6, 3);
    // Gold filigree band
    ctx.fillStyle = '#f59e0b';
    ctx.fillRect(x + 2, y + 2, w - 4, 1.5);

    // 4 Shelves (Y intervals)
    const shelfY = [y + 44, y + 88, y + 132, y + 176];
    shelfY.forEach(sy => {
      ctx.fillStyle = '#270e04';
      ctx.fillRect(x + 2, sy, w - 4, 5);
      ctx.fillStyle = '#5c2b0e';
      ctx.fillRect(x + 2, sy, w - 4, 2);
    });

    // --- SHELF 1 (Top: y+4 to y+44) ---
    // Terracotta pot with succulent
    ctx.fillStyle = '#c2410c';
    ctx.fillRect(x + 10, y + 32, 9, 10);
    ctx.fillStyle = '#9a3412';
    ctx.fillRect(x + 9, y + 31, 11, 2);
    ctx.fillStyle = '#22c55e';
    ctx.beginPath();
    ctx.arc(x + 14.5, y + 28, 5, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#4ade80';
    ctx.fillRect(x + 13, y + 25, 3, 3);

    // Vintage Brass Camera / Telescope
    ctx.fillStyle = '#d97706';
    ctx.fillRect(x + 28, y + 30, 14, 11);
    ctx.fillStyle = '#cbd5e1';
    ctx.fillRect(x + 39, y + 33, 4, 5); // lens
    ctx.fillStyle = '#f59e0b';
    ctx.fillRect(x + 31, y + 27, 4, 3); // flash/knob

    // Leaning antique pocketbook
    ctx.fillStyle = '#854d0e';
    ctx.beginPath();
    ctx.moveTo(x + 48, y + 42);
    ctx.lineTo(x + 55, y + 25);
    ctx.lineTo(x + 60, y + 27);
    ctx.lineTo(x + 53, y + 44);
    ctx.closePath();
    ctx.fill();

    // --- SHELF 2 (Upper-Middle: y+48 to y+88: Row of colorful books) ---
    const bookColors = [
      { col: '#991b1b', gold: true, w: 5, h: 32 },  // Crimson leather
      { col: '#1e3a8a', gold: false, w: 6, h: 36 }, // Deep Navy
      { col: '#14532d', gold: true, w: 5, h: 30 },  // Forest Green
      { col: '#b45309', gold: true, w: 7, h: 34 },  // Antique Ochre
      { col: '#701a75', gold: false, w: 5, h: 28 }, // Plum
      { col: '#0f172a', gold: true, w: 6, h: 35 }   // Charcoal black
    ];
    let curBx = x + 8;
    bookColors.forEach(b => {
      ctx.fillStyle = b.col;
      ctx.fillRect(curBx, y + 86 - b.h, b.w, b.h);
      if (b.gold) {
        ctx.fillStyle = '#facc15';
        ctx.fillRect(curBx + 1, y + 86 - b.h + 5, b.w - 2, 1.5);
        ctx.fillRect(curBx + 1, y + 86 - 7, b.w - 2, 1.5);
      }
      curBx += b.w + 1;
    });
    // Two leaning books against brass owl bookend
    ctx.fillStyle = '#ca8a04';
    ctx.beginPath();
    ctx.moveTo(curBx + 3, y + 86);
    ctx.lineTo(curBx + 10, y + 62);
    ctx.lineTo(curBx + 14, y + 64);
    ctx.lineTo(curBx + 7, y + 86);
    ctx.closePath();
    ctx.fill();
    // Owl bookend
    ctx.fillStyle = '#d97706';
    ctx.fillRect(curBx + 15, y + 72, 6, 14);

    // --- SHELF 3 (Lower-Middle: y+92 to y+132: Retro Transistor Radio) ---
    const radX = x + 8;
    const radY = y + 104;
    // Radio Teak Cabinet
    ctx.fillStyle = '#78350f';
    ctx.fillRect(radX, radY, 32, 24);
    ctx.fillStyle = '#451a03';
    ctx.fillRect(radX + 1, radY + 1, 30, 22);
    // Woven speaker cloth
    ctx.fillStyle = '#b45309';
    ctx.fillRect(radX + 3, radY + 4, 14, 16);
    ctx.fillStyle = '#78350f';
    for (let gy = radY + 6; gy < radY + 18; gy += 3) {
      ctx.fillRect(radX + 3, gy, 14, 1);
    }
    // Illuminated frequency tuning panel
    ctx.fillStyle = '#fef08a';
    ctx.fillRect(radX + 19, radY + 5, 10, 8);
    // Red tuning needle
    ctx.fillStyle = '#ef4444';
    ctx.fillRect(radX + 23, radY + 5, 1.5, 8);
    // Silver knobs
    ctx.fillStyle = '#cbd5e1';
    ctx.beginPath();
    ctx.arc(radX + 22, radY + 17, 2.5, 0, Math.PI * 2);
    ctx.arc(radX + 27, radY + 17, 2.5, 0, Math.PI * 2);
    ctx.fill();
    // Telescoping silver antenna pointing up-right
    ctx.strokeStyle = '#94a3b8';
    ctx.lineWidth = 1.2;
    ctx.beginPath();
    ctx.moveTo(radX + 6, radY);
    ctx.lineTo(radX + 24, radY - 14);
    ctx.stroke();

    // Mini framed photo on shelf 3
    ctx.fillStyle = '#f8fafc';
    ctx.fillRect(x + 45, y + 112, 14, 16);
    ctx.fillStyle = '#38bdf8';
    ctx.fillRect(x + 47, y + 114, 10, 10); // sky in photo
    ctx.fillStyle = '#f59e0b';
    ctx.fillRect(x + 49, y + 119, 6, 5); // HeeHee cup

    // --- SHELF 4 (Bottom: y+136 to y+176: Vinyl Records Crate & Chemex) ---
    // Wooden Vinyl Record Crate
    ctx.fillStyle = '#5c2b0e';
    ctx.fillRect(x + 8, y + 148, 28, 24);
    ctx.fillStyle = '#78350f';
    ctx.fillRect(x + 7, y + 146, 30, 3);
    // Vinyl album sleeves poking out
    const vinylSleeves = ['#ef4444', '#3b82f6', '#f59e0b', '#10b981', '#a855f7'];
    vinylSleeves.forEach((vc, vi) => {
      ctx.fillStyle = vc;
      ctx.fillRect(x + 10 + vi * 5, y + 140 + (vi % 2) * 2, 4, 12);
    });

    // Glass Chemex Pour-over Coffee Maker
    const chmX = x + 44;
    const chmY = y + 148;
    ctx.fillStyle = 'rgba(255, 255, 255, 0.4)';
    ctx.beginPath();
    ctx.moveTo(chmX, chmY);
    ctx.lineTo(chmX + 14, chmY);
    ctx.lineTo(chmX + 9, chmY + 10);
    ctx.lineTo(chmX + 16, chmY + 24);
    ctx.lineTo(chmX - 2, chmY + 24);
    ctx.lineTo(chmX + 5, chmY + 10);
    ctx.closePath();
    ctx.fill();
    // Wooden collar & rawhide tie
    ctx.fillStyle = '#78350f';
    ctx.fillRect(chmX + 4, chmY + 8, 6, 4);
    ctx.fillStyle = '#facc15';
    ctx.fillRect(chmX + 6, chmY + 12, 2, 4); // tassel

    // --- Trailing Ivy Vines Cascading down the Bookshelf Left Side ---
    ctx.strokeStyle = '#166534';
    ctx.lineWidth = 1.2;
    ctx.beginPath();
    ctx.moveTo(x + 8, y + 25);
    ctx.quadraticCurveTo(x - 2, y + 60, x + 4, y + 95);
    ctx.quadraticCurveTo(x - 4, y + 130, x + 2, y + 160);
    ctx.stroke();

    const ivyClusters = [
      [x + 4, y + 30], [x - 1, y + 42], [x + 2, y + 54],
      [x - 3, y + 68], [x + 3, y + 82], [x - 1, y + 96],
      [x - 4, y + 115], [x + 1, y + 132], [x - 2, y + 148]
    ];
    ivyClusters.forEach(([ix, iy]) => {
      ctx.fillStyle = '#15803d';
      ctx.beginPath();
      ctx.arc(ix, iy, 3, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#22c55e';
      ctx.beginPath();
      ctx.arc(ix + 1, iy - 1, 2, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#4ade80';
      ctx.fillRect(ix, iy, 1.5, 1.5);
    });
  }

  /**
   * Detailed Stone Fireplace Structure (Lò Sưởi Đá Cuội)
   * Pre-rendered cobblestone masonry, heavy carved dark oak mantelpiece, and hearth grate
   */
  drawStoneFireplaceStructure(ctx, x, y, w, h) {
    // 1. Heavy Dark Oak Carved Mantelpiece on top
    ctx.fillStyle = '#3f1d0b';
    ctx.fillRect(x - 4, y - 2, w + 8, 12);
    ctx.fillStyle = '#5c2b0e';
    ctx.fillRect(x - 5, y - 4, w + 10, 4); // top ledge
    ctx.fillStyle = '#78350f';
    ctx.fillRect(x - 4, y - 4, w + 8, 1.5); // highlight line

    // Mantelpiece Decor:
    // Antique Brass Candlestick with white candle
    ctx.fillStyle = '#f59e0b';
    ctx.fillRect(x + 10, y - 10, 7, 6);
    ctx.fillStyle = '#fef3c7';
    ctx.fillRect(x + 12, y - 17, 3, 8); // candle wax
    // Framed Vintage Coffee Botanical Oil Painting
    ctx.fillStyle = '#d97706';
    ctx.fillRect(x + 32, y - 26, 26, 22);
    ctx.fillStyle = '#1e293b';
    ctx.fillRect(x + 34, y - 24, 22, 18);
    // Painting landscape
    ctx.fillStyle = '#166534';
    ctx.fillRect(x + 34, y - 14, 22, 8); // green hill
    ctx.fillStyle = '#fef08a';
    ctx.beginPath();
    ctx.arc(x + 40, y - 19, 3, 0, Math.PI * 2); // sun
    ctx.fill();
    // Trailing ivy sprig cascading over right mantel edge
    ctx.fillStyle = '#15803d';
    ctx.beginPath();
    ctx.arc(x + w - 4, y + 2, 3, 0, Math.PI * 2);
    ctx.arc(x + w - 2, y + 8, 2.5, 0, Math.PI * 2);
    ctx.arc(x + w - 3, y + 14, 2, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#22c55e';
    ctx.fillRect(x + w - 5, y + 1, 2, 2);

    // 2. Handcrafted River-Stone / Cobblestone Masonry Surround
    ctx.fillStyle = '#0f172a'; // dark mortar background
    ctx.fillRect(x, y + 10, w, h - 10);

    // Varied River Cobblestones
    const stonePalette = ['#475569', '#334155', '#64748b', '#1e293b', '#52525b', '#3f3f46'];
    const stoneGrid = [
      // row 1
      [{ rx: 2, ry: 12, rw: 18, rh: 14, c: 0 }, { rx: 22, ry: 12, rw: 24, rh: 14, c: 2 }, { rx: 48, ry: 12, rw: 26, rh: 14, c: 1 }, { rx: 76, ry: 12, rw: 20, rh: 14, c: 4 }],
      // row 2
      [{ rx: 2, ry: 28, rw: 14, rh: 15, c: 3 }, { rx: 18, ry: 28, rw: 15, rh: 15, c: 1 }, { rx: 65, ry: 28, rw: 16, rh: 15, c: 0 }, { rx: 83, ry: 28, rw: 13, rh: 15, c: 2 }],
      // row 3 (sides of arch)
      [{ rx: 2, ry: 45, rw: 14, rh: 16, c: 2 }, { rx: 82, ry: 45, rw: 14, rh: 16, c: 3 }],
      // row 4
      [{ rx: 2, ry: 63, rw: 14, rh: 17, c: 0 }, { rx: 82, ry: 63, rw: 14, rh: 17, c: 1 }],
      // row 5
      [{ rx: 2, ry: 82, rw: 15, rh: 17, c: 4 }, { rx: 81, ry: 82, rw: 15, rh: 17, c: 2 }],
      // row 6
      [{ rx: 2, ry: 101, rw: 16, rh: 14, c: 1 }, { rx: 80, ry: 101, rw: 16, rh: 14, c: 0 }]
    ];

    stoneGrid.forEach(row => {
      row.forEach(s => {
        const sx = x + s.rx;
        const sy = y + s.ry;
        ctx.fillStyle = stonePalette[s.c % stonePalette.length];
        ctx.beginPath();
        ctx.roundRect(sx, sy, s.rw, s.rh, 3.5);
        ctx.fill();
        // Highlight top rim
        ctx.fillStyle = 'rgba(255, 255, 255, 0.14)';
        ctx.fillRect(sx + 1, sy + 1, s.rw - 2, 2);
        // Shadow bottom rim
        ctx.fillStyle = 'rgba(0, 0, 0, 0.35)';
        ctx.fillRect(sx + 1, sy + s.rh - 2, s.rw - 2, 2);
      });
    });

    // 3. Arched Firebox Hearth Cavity
    const archX = x + 18;
    const archY = y + 28;
    const archW = 62;
    const archH = 88;

    // Keystone in top center of arch
    ctx.fillStyle = '#64748b';
    ctx.beginPath();
    ctx.moveTo(x + w / 2 - 6, y + 22);
    ctx.lineTo(x + w / 2 + 6, y + 22);
    ctx.lineTo(x + w / 2 + 8, y + 32);
    ctx.lineTo(x + w / 2 - 8, y + 32);
    ctx.closePath();
    ctx.fill();

    // Dark soot firebrick cavity interior
    ctx.fillStyle = '#09050d';
    ctx.beginPath();
    ctx.roundRect(archX, archY + 4, archW, archH - 4, [18, 18, 2, 2]);
    ctx.fill();

    // Inner backwall firebrick lines
    ctx.fillStyle = '#190a1f';
    for (let fby = archY + 16; fby < archY + archH - 12; fby += 10) {
      ctx.fillRect(archX + 4, fby, archW - 8, 2);
    }

    // Cast-iron log grate
    ctx.fillStyle = '#1e293b';
    ctx.fillRect(archX + 8, archY + archH - 16, archW - 16, 5);
    ctx.fillStyle = '#0f172a';
    ctx.fillRect(archX + 12, archY + archH - 11, 4, 10); // grate foot
    ctx.fillRect(archX + archW - 16, archY + archH - 11, 4, 10);

    // Birch / Oak Wood Logs
    ctx.fillStyle = '#382419';
    ctx.beginPath();
    ctx.ellipse(archX + 22, archY + archH - 15, 14, 5, -0.15, 0, Math.PI * 2);
    ctx.ellipse(archX + 40, archY + archH - 15, 14, 5, 0.15, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#d1d5db'; // white birch bark patches
    ctx.fillRect(archX + 14, archY + archH - 18, 6, 2);
    ctx.fillRect(archX + 38, archY + archH - 18, 6, 2);

    // Charcoal Embers Bed (Deep glowing reds pre-rendered)
    ctx.fillStyle = '#7f1d1d';
    ctx.fillRect(archX + 10, archY + archH - 10, archW - 20, 8);
    ctx.fillStyle = '#b91c1c';
    ctx.fillRect(archX + 16, archY + archH - 9, archW - 32, 5);

    // Stone Apron Curb on Floor
    ctx.fillStyle = '#334155';
    ctx.beginPath();
    ctx.ellipse(x + w / 2, y + h + 2, w * 0.44, 7, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#1e293b';
    ctx.lineWidth = 1.5;
    ctx.stroke();
  }

  /**
   * Animated Crackling Pixel Flames, Rising Embers & Warm Radial Glow
   */
  drawStoneFireplaceAnimation(ctx, x, y, w, h) {
    const f = this.frame;
    const cx = x + w / 2;
    const cy = y + h - 18;

    // 1. Warm Radial Flickering Ambient Light Glow
    const flicker = 0.28 + 0.08 * Math.sin(f * 0.18) + 0.04 * Math.sin(f * 0.37 + 1.2);
    const glow = ctx.createRadialGradient(cx, cy - 8, 8, cx, cy - 8, 110);
    glow.addColorStop(0, `rgba(251, 146, 60, ${flicker})`);
    glow.addColorStop(0.35, `rgba(245, 158, 11, ${flicker * 0.6})`);
    glow.addColorStop(0.75, `rgba(220, 38, 38, ${flicker * 0.22})`);
    glow.addColorStop(1, 'rgba(220, 38, 38, 0)');
    ctx.fillStyle = glow;
    ctx.beginPath();
    ctx.arc(cx, cy - 8, 110, 0, Math.PI * 2);
    ctx.fill();

    // Candlestick flickering flame on mantel
    const candleFlicker = Math.sin(f * 0.3) * 1;
    ctx.fillStyle = '#f59e0b';
    ctx.beginPath();
    ctx.arc(x + 13.5 + candleFlicker * 0.4, y - 19, 2.2, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#fef08a';
    ctx.fillRect(x + 13 + candleFlicker * 0.4, y - 20, 1.5, 2);

    // 2. Procedural Crackling Pixel Flames
    // Base Crimson Flame
    ctx.fillStyle = '#dc2626';
    for (let i = 0; i < 6; i++) {
      const fx = cx - 20 + i * 7;
      const fHeight = 14 + Math.sin(f * 0.25 + i * 1.3) * 6;
      ctx.beginPath();
      ctx.moveTo(fx, cy);
      ctx.lineTo(fx + 3.5, cy - fHeight);
      ctx.lineTo(fx + 7, cy);
      ctx.closePath();
      ctx.fill();
    }

    // Mid Orange Flame
    ctx.fillStyle = '#f97316';
    for (let i = 0; i < 5; i++) {
      const fx = cx - 16 + i * 7;
      const fHeight = 11 + Math.sin(f * 0.3 + i * 1.5 + 2) * 5;
      ctx.beginPath();
      ctx.moveTo(fx, cy);
      ctx.lineTo(fx + 3.5, cy - fHeight);
      ctx.lineTo(fx + 7, cy);
      ctx.closePath();
      ctx.fill();
    }

    // Core Yellow-White Hot Tongue
    ctx.fillStyle = '#fef08a';
    for (let i = 0; i < 4; i++) {
      const fx = cx - 12 + i * 6.5;
      const fHeight = 7 + Math.sin(f * 0.35 + i * 1.8 + 4) * 4;
      ctx.beginPath();
      ctx.moveTo(fx, cy);
      ctx.lineTo(fx + 3, cy - fHeight);
      ctx.lineTo(fx + 6, cy);
      ctx.closePath();
      ctx.fill();
    }

    // 3. Floating Rising Ember Sparks drifting up chimney flue
    for (let e = 0; e < 6; e++) {
      const eProgress = ((f * 1.1 + e * 18) % 46);
      const eX = cx - 14 + Math.sin(f * 0.12 + e * 2) * 6 + ((e * 9) % 28);
      const eY = cy - 8 - eProgress;
      const eAlpha = Math.max(0, 1 - eProgress / 46);
      ctx.fillStyle = (e % 2 === 0) ? `rgba(254, 240, 138, ${eAlpha})` : `rgba(249, 115, 22, ${eAlpha})`;
      ctx.fillRect(eX, eY, (e % 3 === 0) ? 2 : 1.5, (e % 3 === 0) ? 2 : 1.5);
    }
  }

  /**
   * Vintage Chalkboard Menu with Hand-drawn Colorful Chalk Art
   */
  drawVintageChalkboardMenu(ctx, x, y, w, h) {
    // 1. Carved Teak / Walnut Frame
    ctx.fillStyle = '#3f1d0b';
    ctx.fillRect(x, y, w, h);
    ctx.fillStyle = '#5c2b0e';
    ctx.fillRect(x + 2, y + 2, w - 4, h - 4);

    // Brass Corner Brackets
    ctx.fillStyle = '#f59e0b';
    [[x, y], [x + w - 6, y], [x, y + h - 6], [x + w - 6, y + h - 6]].forEach(([bx, by]) => {
      ctx.fillRect(bx, by, 6, 6);
      ctx.fillStyle = '#78350f';
      ctx.fillRect(bx + 2, by + 2, 2, 2); // screw
      ctx.fillStyle = '#f59e0b';
    });

    // 2. Dark Slate Chalkboard Surface with subtle texture
    ctx.fillStyle = '#09131b';
    ctx.fillRect(x + 5, y + 5, w - 10, h - 10);
    // Subtle powdery chalk dust smudges
    ctx.fillStyle = 'rgba(255, 255, 255, 0.04)';
    ctx.fillRect(x + 8, y + 8, w - 16, h - 16);

    // 3. String Lights Wire draped across top frame
    ctx.strokeStyle = '#1e293b';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(x + 4, y + 5);
    ctx.quadraticCurveTo(x + w * 0.25, y + 9, x + w * 0.5, y + 5);
    ctx.quadraticCurveTo(x + w * 0.75, y + 9, x + w - 4, y + 5);
    ctx.stroke();

    // 4. Colorful Chalk Art
    // Header: "☕ MENU ☕"
    ctx.font = 'bold 9px Courier, monospace';
    ctx.textAlign = 'center';
    ctx.fillStyle = '#fde047';
    ctx.fillText('☕ MENU ☕', x + w / 2, y + 17);

    // Decorative Chalk Divider Line
    ctx.strokeStyle = 'rgba(254, 240, 138, 0.5)';
    ctx.lineWidth = 0.8;
    ctx.beginPath();
    ctx.moveTo(x + 12, y + 21);
    ctx.lineTo(x + w - 12, y + 21);
    ctx.stroke();

    // Item 1: Phin Sữa Đá
    ctx.font = '8px Arial, sans-serif';
    ctx.textAlign = 'left';
    ctx.fillStyle = '#38bdf8'; // Sky blue chalk
    ctx.fillText('Phin Sữa', x + 16, y + 33);
    // Mini Phin dripper icon
    ctx.fillStyle = '#cbd5e1';
    ctx.fillRect(x + 8, y + 27, 5, 4); // lid
    ctx.fillRect(x + 9, y + 31, 3, 3); // body
    // Price
    ctx.textAlign = 'right';
    ctx.fillStyle = '#4ade80'; // Mint green price
    ctx.fillText('25k', x + w - 8, y + 33);

    // Item 2: Cà Phê Trứng
    ctx.textAlign = 'left';
    ctx.fillStyle = '#fbbf24'; // Warm yellow chalk
    ctx.fillText('C.Phê Trứng', x + 16, y + 49);
    // Mini Egg cup icon
    ctx.fillStyle = '#fef08a';
    ctx.beginPath();
    ctx.arc(x + 10.5, y + 46, 3, 0, Math.PI * 2);
    ctx.fill();
    // Price
    ctx.textAlign = 'right';
    ctx.fillStyle = '#4ade80';
    ctx.fillText('35k', x + w - 8, y + 49);

    // Item 3: Croissant
    ctx.textAlign = 'left';
    ctx.fillStyle = '#f97316'; // Orange chalk
    ctx.fillText('Croissant', x + 16, y + 65);
    // Mini golden croissant doodle
    ctx.fillStyle = '#f59e0b';
    ctx.beginPath();
    ctx.arc(x + 10.5, y + 62, 3.5, 0.2, Math.PI - 0.2);
    ctx.fill();
    // Price
    ctx.textAlign = 'right';
    ctx.fillStyle = '#4ade80';
    ctx.fillText('30k', x + w - 8, y + 65);

    // Chalk Doodles at bottom: stars, coffee bean, heart
    ctx.textAlign = 'center';
    ctx.font = '7px sans-serif';
    ctx.fillStyle = 'rgba(255, 255, 255, 0.55)';
    ctx.fillText('✨ Fresh Daily ✨', x + w / 2, y + 78);
    ctx.fillStyle = '#f472b6';
    ctx.fillText('♥ ☕ ♥', x + w / 2, y + 87);
  }

  /**
   * Dynamic String Lights Glowing Bulbs on Chalkboard Menu
   */
  drawChalkboardLights(ctx, x, y, w, h) {
    const f = this.frame;
    const bulbPositions = [
      [x + 8, y + 6], [x + 20, y + 8], [x + 32, y + 6],
      [x + 44, y + 6], [x + 56, y + 8], [x + 68, y + 6]
    ];

    bulbPositions.forEach(([bx, by], idx) => {
      const pulse = 0.8 + 0.2 * Math.sin(f * 0.1 + idx * 1.1);
      // Warm glowing radial halo
      const bGlow = ctx.createRadialGradient(bx, by, 1, bx, by, 8);
      bGlow.addColorStop(0, `rgba(254, 240, 138, ${0.45 * pulse})`);
      bGlow.addColorStop(1, 'rgba(254, 240, 138, 0)');
      ctx.fillStyle = bGlow;
      ctx.beginPath();
      ctx.arc(bx, by, 8, 0, Math.PI * 2);
      ctx.fill();

      // Golden bulb
      ctx.fillStyle = '#fef08a';
      ctx.beginPath();
      ctx.arc(bx, by, 1.8, 0, Math.PI * 2);
      ctx.fill();
    });
  }

  /**
   * Stylized Drifting Dusk Clouds with Golden / Pink Sunset Rim Lighting
   */
  drawSunsetDuskClouds(ctx) {
    const f = this.frame;
    // 3 Cloud formations drifting slowly across the balcony window
    const clouds = [
      { y: 35, speed: 0.15, scale: 1.0, color: '#701a75', rim: '#fde047', baseW: 55 },
      { y: 65, speed: 0.10, scale: 0.85, color: '#831843', rim: '#fb923c', baseW: 45 },
      { y: 105, speed: 0.18, scale: 1.15, color: '#581c87', rim: '#facc15', baseW: 65 }
    ];

    clouds.forEach((c, idx) => {
      const rawX = 730 + ((f * c.speed + idx * 85) % 240);
      const cx = rawX > 960 ? rawX - 240 : rawX;
      if (cx < 735 || cx > 960) return;

      ctx.save();
      ctx.translate(cx, c.y);
      ctx.scale(c.scale, c.scale);

      // Fluffy pixel cloud silhouette
      ctx.fillStyle = c.color;
      ctx.beginPath();
      ctx.arc(0, 0, 10, 0, Math.PI * 2);
      ctx.arc(12, -4, 13, 0, Math.PI * 2);
      ctx.arc(26, -2, 11, 0, Math.PI * 2);
      ctx.arc(36, 2, 8, 0, Math.PI * 2);
      ctx.fill();

      // Golden sunset rim highlight on bottom and edges
      ctx.fillStyle = c.rim;
      ctx.fillRect(-6, 7, 38, 2.5);
      ctx.fillRect(8, 8, 18, 2);

      ctx.restore();
    });
  }

  /**
   * Volumetric God Rays (Tia Nắng Hoàng Hôn) Streaming through Balcony Glass
   */
  drawVolumetricGodRays(ctx) {
    const f = this.frame;
    const shimmer = 0.09 + 0.03 * Math.sin(f * 0.035);

    // 4 Angled Volumetric Light Beams streaming diagonally down-left
    const rayConfigs = [
      { topX1: 760, topX2: 805, botX1: 340, botX2: 440, topY: 30, botY: 480, alpha: shimmer * 1.1 },
      { topX1: 820, topX2: 865, botX1: 460, botX2: 570, topY: 40, botY: 510, alpha: shimmer * 1.25 },
      { topX1: 880, topX2: 925, botX1: 590, botX2: 700, topY: 60, botY: 520, alpha: shimmer * 0.95 },
      { topX1: 935, topX2: 960, botX1: 720, botX2: 810, topY: 80, botY: 490, alpha: shimmer * 0.75 }
    ];

    rayConfigs.forEach(rc => {
      const grad = ctx.createLinearGradient(rc.topX1, rc.topY, rc.botX1, rc.botY);
      grad.addColorStop(0, `rgba(254, 240, 138, ${rc.alpha})`);
      grad.addColorStop(0.4, `rgba(251, 146, 60, ${rc.alpha * 0.55})`);
      grad.addColorStop(0.85, `rgba(234, 88, 12, ${rc.alpha * 0.18})`);
      grad.addColorStop(1, 'rgba(234, 88, 12, 0)');

      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.moveTo(rc.topX1, rc.topY);
      ctx.lineTo(rc.topX2, rc.topY);
      ctx.lineTo(rc.botX2, rc.botY);
      ctx.lineTo(rc.botX1, rc.botY);
      ctx.closePath();
      ctx.fill();

      // Golden floor reflection patch where ray touches herringbone floor
      ctx.fillStyle = `rgba(254, 240, 138, ${rc.alpha * 0.45})`;
      ctx.beginPath();
      ctx.ellipse((rc.botX1 + rc.botX2) / 2, rc.botY - 15, (rc.botX2 - rc.botX1) * 0.45, 6, 0, 0, Math.PI * 2);
      ctx.fill();
    });

    // Golden sparkling dust motes drifting through God Rays
    ctx.fillStyle = 'rgba(254, 240, 138, 0.85)';
    for (let m = 0; m < 18; m++) {
      const mx = 400 + ((m * 43 + f * 0.35) % 460);
      const my = 120 + ((m * 29 + Math.sin(f * 0.04 + m) * 16 + f * 0.2) % 360);
      const mSize = (m % 3 === 0) ? 2 : 1.5;
      const mAlpha = 0.3 + 0.4 * Math.sin(f * 0.08 + m * 2);
      ctx.globalAlpha = mAlpha;
      ctx.fillRect(mx, my, mSize, mSize);
    }
    ctx.globalAlpha = 1.0;
  }

  /**
   * Procedural Rising Coffee Steam with Natural Sine Sway & Dissipation
   */
  drawRisingCoffeeSteam(ctx, x, y, style = 'espresso') {
    const f = this.frame;

    if (style === 'egg_coffee') {
      // Hanoi Egg Coffee with heart-shaped wavy steam curls
      for (let s = 0; s < 4; s++) {
        const progress = ((f * 0.6 + s * 14) % 36);
        const sy = y - progress;
        const sway = Math.sin(f * 0.12 + s * 1.5) * (2 + progress * 0.12);
        const alpha = Math.max(0, 0.65 * (1 - progress / 36));
        ctx.fillStyle = `rgba(255, 255, 255, ${alpha})`;
        ctx.fillRect(x + sway, sy, 2.5, 2.5);
        if (progress > 18 && s === 0) {
          // Sweet tiny heart loop
          ctx.fillRect(x + sway - 2, sy - 2, 2, 2);
          ctx.fillRect(x + sway + 2, sy - 2, 2, 2);
        }
      }
    } else if (style === 'phin') {
      // Vietnamese Phin Sữa Đá with multi-plume aromatic steam wafting up
      for (let s = 0; s < 5; s++) {
        const progress = ((f * 0.7 + s * 10) % 32);
        const sy = y - progress;
        const sway = Math.sin(f * 0.15 + s * 1.8) * (1.8 + progress * 0.15);
        const alpha = Math.max(0, 0.7 * (1 - progress / 32));
        ctx.fillStyle = `rgba(255, 255, 255, ${alpha})`;
        ctx.fillRect(x + sway, sy, 2, 2);
        ctx.fillRect(x + sway + 3, sy + 3, 1.5, 1.5);
      }
    } else {
      // Double Espresso / Americano Steam
      for (let s = 0; s < 4; s++) {
        const progress = ((f * 0.75 + s * 12) % 28);
        const sy = y - progress;
        const sway = Math.sin(f * 0.14 + s * 2.0) * (2 + progress * 0.1);
        const alpha = Math.max(0, 0.6 * (1 - progress / 28));
        ctx.fillStyle = `rgba(255, 255, 255, ${alpha})`;
        ctx.fillRect(x + sway, sy, 2, 2);
      }
    }
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

    // 3. Expanding Concentric Shockwave Ring on Crit or Cosmic Impact
    if (p.isCrit || p.isCosmic) {
      const ringCount = p.isCosmic ? 16 : 12;
      const ringColor = p.isCosmic ? '#e879f9' : '#fde047';
      for (let r = 0; r < ringCount; r++) {
        const rAng = (r * Math.PI * 2) / ringCount;
        const rSpd = p.isCosmic ? 4.5 : 3.2;
        this.addParticle({
          x: p.targetX,
          y: p.targetY,
          vx: Math.cos(rAng) * rSpd,
          vy: Math.sin(rAng) * rSpd,
          color: ringColor,
          size: p.isCosmic ? 3.5 : 2.5,
          life: 18
        });
      }
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

    // 2. Balcony & Sunset Skyline Dynamic Atmosphere
    // A. Drifting Dusk Clouds with Golden / Pink Sunset Rim Lighting
    this.drawSunsetDuskClouds(ctx);

    // B. Landmark 81 Spire Blinking Red Aviation Warning Beacon (x: 848, y: 46)
    const beaconOn = Math.floor(f / 35) % 2 === 0;
    if (beaconOn) {
      // Glowing red radial beacon pulse
      const bGrad = ctx.createRadialGradient(848, 46, 1, 848, 46, 8);
      bGrad.addColorStop(0, '#fca5a5');
      bGrad.addColorStop(0.3, '#ef4444');
      bGrad.addColorStop(0.7, 'rgba(239, 68, 68, 0.45)');
      bGrad.addColorStop(1, 'rgba(239, 68, 68, 0)');
      ctx.fillStyle = bGrad;
      ctx.beginPath();
      ctx.arc(848, 46, 8, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(847.5, 45.5, 1.5, 1.5);
    } else {
      ctx.fillStyle = '#7f1d1d';
      ctx.fillRect(847.5, 45.5, 1.5, 1.5);
    }

    // C. Dynamic City Lights Twinkling in Balcony Windows
    ctx.fillStyle = '#fef08a';
    for (let wy = 120; wy < 230; wy += 14) {
      if ((wy + f) % 28 < 14) ctx.fillRect(840, wy, 3.5, 4.5);
      if ((wy * 3 + f) % 36 < 18) ctx.fillRect(796, wy + 6, 3.5, 4.5);
      if ((wy * 7 + f) % 32 < 16) ctx.fillRect(896, wy + 3, 3.5, 4.5);
      // Cyan office light variations
      ctx.fillStyle = '#67e8f9';
      if ((wy * 5 + f) % 40 < 20) ctx.fillRect(852, wy + 8, 3, 4);
      ctx.fillStyle = '#fef08a';
    }

    // 3. Volumetric God Rays (Tia Nắng Hoàng Hôn) Streaming through Balcony Glass
    this.drawVolumetricGodRays(ctx);

    // 4. Stone Fireplace (Lò Sưởi Đá Cuội) Crackling Flames, Embers & Radial Glow
    this.drawStoneFireplaceAnimation(ctx, 118, 82, 98, 118);

    // 5. Vintage Chalkboard Menu String Lights Glowing Bulbs
    this.drawChalkboardLights(ctx, 226, 22, 78, 96);

    // 6. Bookshelf Retro Radio Tuning Panel Warm Dial Illumination (x: 27, y: 124)
    ctx.fillStyle = `rgba(254, 240, 138, ${0.35 + 0.1 * Math.sin(f * 0.08)})`;
    ctx.fillRect(27, 124, 10, 8);

    // 7. Bar Counter Underglow: Warm Amber LED Strip beneath Carrara Marble Overhang
    const barUnderglow = ctx.createLinearGradient(0, 98, 0, 144);
    barUnderglow.addColorStop(0, 'rgba(245, 158, 11, 0.42)');
    barUnderglow.addColorStop(0.45, 'rgba(217, 119, 6, 0.18)');
    barUnderglow.addColorStop(1, 'rgba(217, 119, 6, 0)');
    ctx.fillStyle = barUnderglow;
    ctx.fillRect(310, 98, 340, 46);

    // Soft warm underglow floor reflection beneath bar counter
    ctx.fillStyle = 'rgba(245, 158, 11, 0.14)';
    ctx.fillRect(306, 144, 348, 12);

    // 8. Enhanced La Marzocco Espresso Machine (Linea PB / Strada Crimson & Chrome)
    const emX = 452;
    const emY = 60;
    const emW = 62;
    const emH = 26;

    // Red Italian Crimson Chassis
    ctx.fillStyle = '#dc2626';
    ctx.fillRect(emX, emY, emW, emH);
    ctx.fillStyle = '#991b1b';
    ctx.fillRect(emX, emY + emH - 3, emW, 3);

    // Mirror-finish Chrome Side Panels
    ctx.fillStyle = '#f8fafc';
    ctx.fillRect(emX, emY, 4, emH);
    ctx.fillRect(emX + emW - 4, emY, 4, emH);
    ctx.fillStyle = '#cbd5e1';
    ctx.fillRect(emX + 3, emY, 2, emH);

    // Top Cup Warmer Tray with Neatly Stacked Ceramic Cups
    ctx.fillStyle = '#f1f5f9';
    ctx.fillRect(emX - 3, emY - 6, emW + 6, 6);
    ctx.fillStyle = '#94a3b8';
    ctx.fillRect(emX - 3, emY - 7, emW + 6, 1.5); // chrome railing

    // Miniature Ceramic Espresso Cups on Top Warmer
    const cupColors = ['#f8fafc', '#fed7aa', '#38bdf8', '#f8fafc'];
    cupColors.forEach((cc, ci) => {
      ctx.fillStyle = cc;
      ctx.fillRect(emX + 4 + ci * 14, emY - 5, 8, 5);
      ctx.fillStyle = '#451a03';
      ctx.fillRect(emX + 5 + ci * 14, emY - 5, 6, 1.5);
    });

    // Dual Chromed E61 Group Heads & Dark Walnut Portafilters
    [emX + 14, emX + 40].forEach(ghX => {
      // Chrome group head
      ctx.fillStyle = '#cbd5e1';
      ctx.fillRect(ghX, emY + emH - 2, 9, 5);
      // Portafilter handle with dark walnut wood
      ctx.fillStyle = '#451a03';
      ctx.fillRect(ghX + 1, emY + emH + 3, 7, 3);
      ctx.fillStyle = '#78350f';
      ctx.fillRect(ghX + 2, emY + emH + 6, 5, 6);
      // Metal spout
      ctx.fillStyle = '#cbd5e1';
      ctx.fillRect(ghX + 3.5, emY + emH + 2, 2, 3);
    });

    // Dual Vibrating Pressure Gauges (Boiler & Pump Pressure)
    const gaugeNeedle1 = Math.sin(f * 0.35) * 1.0;
    const gaugeNeedle2 = Math.cos(f * 0.42) * 0.8;
    [
      { gx: emX + 20, needle: gaugeNeedle1, label: 'B' },
      { gx: emX + 34, needle: gaugeNeedle2, label: 'P' }
    ].forEach(g => {
      // Brass bezel
      ctx.fillStyle = '#f59e0b';
      ctx.beginPath();
      ctx.arc(g.gx, emY + 11, 4.5, 0, Math.PI * 2);
      ctx.fill();
      // White illuminated dial face
      ctx.fillStyle = '#ffffff';
      ctx.beginPath();
      ctx.arc(g.gx, emY + 11, 3.2, 0, Math.PI * 2);
      ctx.fill();
      // Vibrating black needle
      ctx.strokeStyle = '#0f172a';
      ctx.lineWidth = 0.9;
      ctx.beginPath();
      ctx.moveTo(g.gx, emY + 11);
      ctx.lineTo(g.gx + g.needle, emY + 8);
      ctx.stroke();
    });

    // Golden "La Marzocco" Lion Crest Emblem in Center
    ctx.fillStyle = '#facc15';
    ctx.fillRect(emX + 26, emY + 19, 9, 3);
    ctx.fillStyle = '#78350f';
    ctx.fillRect(emX + 29, emY + 20, 3, 1);

    // Dual Chrome Steam Wands with Fine Steam Jets
    // Left Steam Wand
    ctx.strokeStyle = '#e2e8f0';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(emX + 5, emY + emH - 2);
    ctx.lineTo(emX - 2, emY + emH + 6);
    ctx.stroke();
    // Fine steam puffs from left wand
    if (f % 160 < 80) {
      const sY = emY + emH + 6 - ((f * 0.7) % 15);
      const sX = emX - 3 + Math.sin(f * 0.15) * 3;
      ctx.fillStyle = 'rgba(255, 255, 255, 0.45)';
      ctx.fillRect(sX, sY, 2.5, 2.5);
    }

    // Right Steam Wand
    ctx.beginPath();
    ctx.moveTo(emX + emW - 5, emY + emH - 2);
    ctx.lineTo(emX + emW + 2, emY + emH + 6);
    ctx.stroke();

    // Pixel Steam rising from Espresso Machine Top Cup Warmer
    ctx.fillStyle = 'rgba(255, 255, 255, 0.42)';
    const steamY = 50 - ((f * 1.2) % 25);
    const steamX = 478 + Math.sin(f * 0.1) * 4;
    ctx.fillRect(steamX, steamY, 3.5, 3.5);
    ctx.fillRect(steamX + 9, steamY + 6, 2.5, 2.5);

    // 9. Neon Sign: ☕ HEEHEE COFFEE LOUNGE ☕
    ctx.fillStyle = '#fbbf24';
    ctx.font = 'bold 13px Courier, monospace';
    ctx.textAlign = 'center';
    ctx.shadowColor = '#f59e0b';
    ctx.shadowBlur = 10;
    ctx.fillText('☕ HEEHEE COFFEE LOUNGE ☕', 480, 25);
    ctx.shadowBlur = 0;

    // 10. Barista NPC Chị Thảo standing behind bar
    this.drawBaristaNPC(ctx, 396, 72);

    // 11. Warm Hanging Edison Pendant Lamps with Dynamic Radial Glow Cones
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

    // 12. Dynamic Vinyl Record Player on stand (x: 90, y: 165)
    const turnX = 90;
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

    // 13. Ambient Golden Dust Motes (Bụi Nắng Hoàng Hôn Lofi)
    ctx.fillStyle = 'rgba(254, 240, 138, 0.45)';
    for (let d = 0; d < 14; d++) {
      const dx = (100 + d * 62 + Math.sin(f * 0.03 + d * 2) * 16) % 960;
      const dy = 60 + ((d * 38 + f * 0.35) % 380);
      ctx.fillRect(dx, dy, 1.5, 1.5);
    }
  }

  drawBaristaNPC(ctx, x, y) {
    ctx.save();
    // 1. Back hair & Volume
    ctx.fillStyle = '#3f2212';
    if (ctx.roundRect) {
      ctx.beginPath();
      ctx.roundRect(x + 2, y - 3, 16, 12, [5, 5, 2, 2]);
      ctx.fill();
    } else {
      ctx.fillRect(x + 2, y - 3, 16, 12);
    }

    // 2. Face & Complexion
    ctx.fillStyle = '#fed7aa';
    if (ctx.roundRect) {
      ctx.beginPath();
      ctx.roundRect(x + 4, y + 4, 12, 10, [2, 2, 4, 4]);
      ctx.fill();
    } else {
      ctx.fillRect(x + 4, y + 4, 12, 10);
    }

    // 3. Front Bangs & Angel Ring Sheen
    ctx.fillStyle = '#3f2212';
    ctx.beginPath();
    ctx.arc(x + 10, y + 4, 7, Math.PI, 0);
    ctx.fill();

    ctx.fillStyle = 'rgba(253, 224, 71, 0.45)';
    ctx.beginPath();
    ctx.ellipse(x + 10, y + 1, 5, 1.2, 0, 0, Math.PI * 2);
    ctx.fill();

    // 4. Rosy Blush
    ctx.fillStyle = 'rgba(255, 121, 198, 0.55)';
    ctx.beginPath();
    ctx.arc(x + 6, y + 10.5, 1.5, 0, Math.PI * 2);
    ctx.arc(x + 14, y + 10.5, 1.5, 0, Math.PI * 2);
    ctx.fill();

    // 5. Expressive Anime Eyes
    ctx.fillStyle = '#18181b';
    ctx.fillRect(x + 6, y + 7, 2.5, 2.8);
    ctx.fillRect(x + 11.5, y + 7, 2.5, 2.8);
    // Specular sparkles
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(x + 6, y + 7, 1.2, 1.2);
    ctx.fillRect(x + 11.5, y + 7, 1.2, 1.2);

    // 6. Sweet Smile
    ctx.fillStyle = '#f43f5e';
    ctx.beginPath();
    ctx.arc(x + 10, y + 11.5, 1.5, 0, Math.PI);
    ctx.fill();

    // 7. Green Barista Apron with Golden Nametag & Pockets
    ctx.fillStyle = '#15803d';
    if (ctx.roundRect) {
      ctx.beginPath();
      ctx.roundRect(x + 2, y + 14, 16, 16, [3, 3, 2, 2]);
      ctx.fill();
    } else {
      ctx.fillRect(x + 2, y + 14, 16, 16);
    }
    // Apron straps
    ctx.fillStyle = '#166534';
    ctx.fillRect(x + 4, y + 14, 2, 8);
    ctx.fillRect(x + 14, y + 14, 2, 8);

    // Golden Nametag & Mini Boba Badge
    ctx.fillStyle = '#fde047';
    ctx.fillRect(x + 8, y + 17, 5, 2.2);
    ctx.fillStyle = '#78350f';
    ctx.fillRect(x + 9, y + 18, 3, 0.8);
    ctx.restore();
  }

  /**
   * Glowing Ancient Magic Summoning Circle (Bệ Triệu Hồi Vũ Trụ Cổ Đại)
   * Arcane Runes, Sacred Geometry Hexagram, Swirling Void Vortex & Lightning Arcs
   */
  drawSummoningAltar(ctx) {
    const f = this.frame;
    const cx = 480;
    const cy = 230;

    // 1. Weathered Stone Dais with Radial Flagstones & Arcane Engravings
    ctx.fillStyle = '#160824';
    ctx.beginPath();
    ctx.ellipse(cx, cy, 146, 58, 0, 0, Math.PI * 2);
    ctx.fill();

    // Stone Dais Outer Curb
    ctx.strokeStyle = '#4c1d95';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.ellipse(cx, cy, 146, 58, 0, 0, Math.PI * 2);
    ctx.stroke();

    // Radial Flagstone Groove Lines
    ctx.strokeStyle = '#2e1065';
    ctx.lineWidth = 1;
    for (let r = 0; r < 12; r++) {
      const rAng = (r * Math.PI) / 6;
      ctx.beginPath();
      ctx.moveTo(cx + Math.cos(rAng) * 65, cy + Math.sin(rAng) * 26);
      ctx.lineTo(cx + Math.cos(rAng) * 142, cy + Math.sin(rAng) * 56);
      ctx.stroke();
    }

    // 2. Concentric Glowing Arcane Magic Rings
    const pulse = 0.5 + Math.sin(f * 0.08) * 0.5;
    const pulseFast = 0.5 + Math.sin(f * 0.18) * 0.5;

    // Outer Arcane Ring with Deep Glow
    ctx.strokeStyle = `rgba(168, 85, 247, ${0.45 + pulse * 0.45})`;
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    ctx.ellipse(cx, cy, 136, 52, 0, 0, Math.PI * 2);
    ctx.stroke();

    // Orbiting Arcane Runes (16 Ancient Glyphs rotating with neon luminescence)
    const runes = ['ᚲ', 'ᚦ', 'ᚱ', 'ᛟ', 'ᚷ', 'ᛚ', 'ᛗ', 'ᛉ', 'ᛞ', 'ᛊ', 'ᛏ', 'ᛒ', 'ᛖ', 'ᛃ', 'ᛈ', 'ᚢ'];
    const runeRotation = f * 0.008;

    ctx.font = 'bold 11px sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';

    for (let i = 0; i < 16; i++) {
      const angle = (i * Math.PI / 8) + runeRotation;
      const rx = cx + Math.cos(angle) * 136;
      const ry = cy + Math.sin(angle) * 52;

      // Glowing rune halo
      ctx.fillStyle = (i % 2 === 0) ? `rgba(192, 132, 252, ${0.5 + pulseFast * 0.5})` : `rgba(34, 211, 238, ${0.5 + pulseFast * 0.5})`;
      ctx.fillText(runes[i], rx, ry);

      // Specular bright core
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(rx - 0.75, ry - 0.75, 1.5, 1.5);
    }

    // Middle Ring: Sacred Geometry Star / Hexagram Lines
    ctx.strokeStyle = `rgba(56, 189, 248, ${0.35 + pulse * 0.35})`;
    ctx.lineWidth = 1.2;
    ctx.beginPath();
    ctx.ellipse(cx, cy, 102, 39, 0, 0, Math.PI * 2);
    ctx.stroke();

    // Intersecting sacred geometry chords connecting opposing runes
    ctx.strokeStyle = `rgba(168, 85, 247, ${0.2 + pulse * 0.25})`;
    ctx.lineWidth = 1;
    for (let s = 0; s < 6; s++) {
      const a1 = (s * Math.PI / 3) - runeRotation * 1.5;
      const a2 = a1 + (Math.PI * 2 / 3);
      ctx.beginPath();
      ctx.moveTo(cx + Math.cos(a1) * 102, cy + Math.sin(a1) * 39);
      ctx.lineTo(cx + Math.cos(a2) * 102, cy + Math.sin(a2) * 39);
      ctx.stroke();
    }

    // Inner Core: Swirling Void Energy Vortex
    const vortexGrad = ctx.createRadialGradient(cx, cy, 2, cx, cy, 66);
    vortexGrad.addColorStop(0, '#090312');
    vortexGrad.addColorStop(0.4, `rgba(126, 34, 206, ${0.4 + pulse * 0.3})`);
    vortexGrad.addColorStop(0.8, `rgba(59, 130, 246, ${0.2 + pulse * 0.2})`);
    vortexGrad.addColorStop(1, 'rgba(126, 34, 206, 0)');
    ctx.fillStyle = vortexGrad;
    ctx.beginPath();
    ctx.ellipse(cx, cy, 66, 26, 0, 0, Math.PI * 2);
    ctx.fill();

    // 3. Procedural Cosmic Lightning Sparks creeping across floor flagstones
    ctx.strokeStyle = '#c084fc';
    ctx.lineWidth = 1.2;
    for (let l = 0; l < 4; l++) {
      if ((f + l * 25) % 50 < 25) {
        const lAng = (l * Math.PI / 2) + Math.sin(f * 0.1) * 0.4;
        const midR = 75;
        const outR = 125;
        const jx = cx + Math.cos(lAng) * midR + (Math.sin(f * 0.3) * 6);
        const jy = cy + Math.sin(lAng) * (midR * 0.38) + (Math.cos(f * 0.3) * 3);
        const ox = cx + Math.cos(lAng) * outR;
        const oy = cy + Math.sin(lAng) * (outR * 0.38);

        ctx.beginPath();
        ctx.moveTo(cx + Math.cos(lAng) * 30, cy + Math.sin(lAng) * 12);
        ctx.lineTo(jx, jy);
        ctx.lineTo(ox, oy);
        ctx.stroke();
      }
    }

    // 4. Dramatic Cosmic Light Pillar & Gravitational Distortion when Boss is Active
    if (this.bossState && this.bossState.isActive) {
      // Ethereal vertical pillar of cosmic light shooting upward
      const pillarGrad = ctx.createLinearGradient(cx - 70, 0, cx + 70, 0);
      pillarGrad.addColorStop(0, 'rgba(147, 51, 234, 0)');
      pillarGrad.addColorStop(0.3, `rgba(168, 85, 247, ${0.18 + pulse * 0.15})`);
      pillarGrad.addColorStop(0.5, `rgba(56, 189, 248, ${0.25 + pulse * 0.2})`);
      pillarGrad.addColorStop(0.7, `rgba(168, 85, 247, ${0.18 + pulse * 0.15})`);
      pillarGrad.addColorStop(1, 'rgba(147, 51, 234, 0)');
      ctx.fillStyle = pillarGrad;
      ctx.fillRect(cx - 70, 0, 140, cy + 20);

      // Deep Purple Cosmic Ambient Radial Glow
      const bossGlow = ctx.createRadialGradient(cx, cy, 15, cx, cy, 160);
      bossGlow.addColorStop(0, `rgba(147, 51, 234, ${0.35 + pulse * 0.25})`);
      bossGlow.addColorStop(0.5, `rgba(59, 130, 246, ${0.18 + pulse * 0.15})`);
      bossGlow.addColorStop(1, 'rgba(147, 51, 234, 0)');
      ctx.fillStyle = bossGlow;
      ctx.beginPath();
      ctx.ellipse(cx, cy, 170, 75, 0, 0, Math.PI * 2);
      ctx.fill();

      // Swirling gravitational distortion particle sparks
      for (let p = 0; p < 8; p++) {
        const pAng = (f * 0.05 + p * (Math.PI / 4));
        const pRad = 40 + ((f * 0.8 + p * 15) % 95);
        const px = cx + Math.cos(pAng) * pRad;
        const py = cy + Math.sin(pAng) * (pRad * 0.38);
        ctx.fillStyle = (p % 2 === 0) ? '#c084fc' : '#38bdf8';
        ctx.fillRect(px, py, 2, 2);
      }
    }
  }

  /**
   * Oak Dining Table with Distinct Smoking Hot Coffee Drinks & Multi-tier Pixel Steam
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
    const vaseX = t.x + 14;
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
    const candleX = t.x - 16;
    const candleY = t.y - 5;
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

    // 6. Distinct Smoking Hot Coffee Drinks & Multi-tier Pixel Steam for Every Table
    if (t.x < 300) {
      // === TABLE 1 (Hoàng IT's Table): Double Espresso Mug & Iced Cold Brew Glass ===
      // A. Dark Stoneware Ceramic Espresso Mug
      ctx.fillStyle = '#1e293b';
      ctx.fillRect(t.x - 8, t.y - 9, 8, 7);
      ctx.fillStyle = '#451a03';
      ctx.fillRect(t.x - 7, t.y - 8, 6, 2); // espresso
      ctx.fillStyle = '#d97706';
      ctx.fillRect(t.x - 6, t.y - 8, 4, 1); // golden crema
      // Handle
      ctx.strokeStyle = '#1e293b';
      ctx.lineWidth = 1.2;
      ctx.strokeRect(t.x - 11, t.y - 7.5, 3, 4);

      // B. Tall Ribbed Glass of Iced Cold Brew with Ice Cubes
      ctx.fillStyle = 'rgba(255, 255, 255, 0.3)';
      ctx.fillRect(t.x + 2, t.y - 13, 7, 11);
      ctx.fillStyle = '#3f1d0b';
      ctx.fillRect(t.x + 3, t.y - 11, 5, 8); // cold brew
      // Clear Ice cubes
      ctx.fillStyle = 'rgba(255, 255, 255, 0.75)';
      ctx.fillRect(t.x + 3.5, t.y - 10, 2, 2);
      ctx.fillRect(t.x + 5.5, t.y - 8, 2, 2);
      // Red Drinking Straw
      ctx.fillStyle = '#ef4444';
      ctx.fillRect(t.x + 6, t.y - 16, 1.5, 6);

      // Delicate Rising Steam from Espresso Mug
      this.drawRisingCoffeeSteam(ctx, t.x - 4, t.y - 11, 'espresso');
    } else if (t.x > 600) {
      // === TABLE 3 (Balcony Scenic Table): Hanoi Egg Coffee (Cà Phê Trứng) ===
      // White Porcelain Bowl filled with warm water bath
      ctx.fillStyle = '#f8fafc';
      ctx.beginPath();
      ctx.ellipse(t.x, t.y - 5, 11, 5, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = '#cbd5e1';
      ctx.lineWidth = 1;
      ctx.stroke();

      // Ceramic Cup inside water bath
      ctx.fillStyle = '#f1f5f9';
      ctx.fillRect(t.x - 5, t.y - 11, 10, 7);
      // Dark Vietnamese Coffee layer
      ctx.fillStyle = '#270e04';
      ctx.fillRect(t.x - 4, t.y - 8, 8, 3);
      // Thick Whipped Golden Egg Yolk Foam Top Layer
      ctx.fillStyle = '#fbbf24';
      ctx.fillRect(t.x - 4, t.y - 10, 8, 2.5);
      ctx.fillStyle = '#fef08a';
      ctx.fillRect(t.x - 3, t.y - 10.5, 6, 1); // glossy foam highlight

      // Aromatic Sweet Heart-shaped Steam Curls
      this.drawRisingCoffeeSteam(ctx, t.x, t.y - 13, 'egg_coffee');
    } else {
      // === TABLE 2 (Center VIP Table): Authentic Vietnamese Phin Sữa Đá ===
      // Clear Glass Tumbler
      ctx.fillStyle = 'rgba(255, 255, 255, 0.35)';
      ctx.fillRect(t.x - 4, t.y - 10, 9, 10);
      // Sweet Condensed Milk Bottom Layer
      ctx.fillStyle = '#fef3c7';
      ctx.fillRect(t.x - 3, t.y - 3, 7, 3);
      // Dark Robusta Coffee Middle Layer
      ctx.fillStyle = '#261208';
      ctx.fillRect(t.x - 3, t.y - 8, 7, 5);

      // Stainless Steel Phin Dripper on Top of Glass
      ctx.fillStyle = '#cbd5e1';
      ctx.fillRect(t.x - 6, t.y - 11, 13, 2); // phin saucer plate
      ctx.fillStyle = '#94a3b8';
      ctx.fillRect(t.x - 4, t.y - 16, 9, 5); // phin body chamber
      ctx.fillStyle = '#e2e8f0';
      ctx.fillRect(t.x - 5, t.y - 18, 11, 2.5); // phin lid
      ctx.fillStyle = '#64748b';
      ctx.fillRect(t.x - 1, t.y - 19.5, 3, 1.5); // lid knob

      // Dripping dark coffee drop from Phin into milk!
      const dropProgress = (f * 0.08) % 1;
      if (dropProgress < 0.8) {
        ctx.fillStyle = '#451a03';
        ctx.fillRect(t.x, t.y - 9 + dropProgress * 6, 1.5, 2);
      }

      // Hot Rising Phin Steam Wafting Up
      this.drawRisingCoffeeSteam(ctx, t.x, t.y - 20, 'phin');
    }
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
      // 🐱 Mèo Mướp Boba on Velvet Armchair by Balcony with Belly Breathing & Floating 'Zzz'
      const catSurprised = this.bossState && this.bossState.isActive;

      if (catSurprised) {
        // Cat jumped up cheering the Baristas!
        const cheerJump = Math.sin(f * 0.3) * 4;
        ctx.fillStyle = '#eab308'; // orange tabby coat
        ctx.beginPath();
        ctx.ellipse(npc.x, npc.y - 4 + cheerJump, 8, 11, 0, 0, Math.PI * 2);
        ctx.fill();
        // White chest bib
        ctx.fillStyle = '#f8fafc';
        ctx.beginPath();
        ctx.ellipse(npc.x, npc.y - 2 + cheerJump, 4, 6, 0, 0, Math.PI * 2);
        ctx.fill();
        // Head
        ctx.fillStyle = '#eab308';
        ctx.beginPath();
        ctx.arc(npc.x, npc.y - 15 + cheerJump, 7, 0, Math.PI * 2);
        ctx.fill();
        // Ears with pink interior
        ctx.fillStyle = '#ca8a04';
        ctx.fillRect(npc.x - 7, npc.y - 22 + cheerJump, 4, 5);
        ctx.fillRect(npc.x + 3, npc.y - 22 + cheerJump, 4, 5);
        ctx.fillStyle = '#f472b6';
        ctx.fillRect(npc.x - 6, npc.y - 21 + cheerJump, 2, 3);
        ctx.fillRect(npc.x + 4, npc.y - 21 + cheerJump, 2, 3);
        // Wide excited eyes with sparkles
        ctx.fillStyle = '#1e1b4b';
        ctx.fillRect(npc.x - 5, npc.y - 17 + cheerJump, 3, 3);
        ctx.fillRect(npc.x + 2, npc.y - 17 + cheerJump, 3, 3);
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(npc.x - 5, npc.y - 17 + cheerJump, 1.5, 1.5);
        ctx.fillRect(npc.x + 2, npc.y - 17 + cheerJump, 1.5, 1.5);
        // Pink nose & whiskers
        ctx.fillStyle = '#fb7185';
        ctx.fillRect(npc.x - 1, npc.y - 13 + cheerJump, 2, 1.5);
        // Red Collar & Golden Bell
        ctx.fillStyle = '#ef4444';
        ctx.fillRect(npc.x - 5, npc.y - 9 + cheerJump, 10, 2.5);
        ctx.fillStyle = '#facc15';
        ctx.beginPath();
        ctx.arc(npc.x, npc.y - 7 + cheerJump, 2.2, 0, Math.PI * 2);
        ctx.fill();
        // White raised paws cheering!
        ctx.fillStyle = '#f8fafc';
        ctx.beginPath();
        ctx.arc(npc.x - 7, npc.y - 8 + cheerJump - 3, 3, 0, Math.PI * 2);
        ctx.arc(npc.x + 7, npc.y - 8 + cheerJump - 3, 3, 0, Math.PI * 2);
        ctx.fill();

        // Speech bubble
        if (f % 180 < 90) {
          this.drawSpeechBubble(ctx, npc.x, npc.y - 32, 'Meo meo! Cố lên! 🐱✨');
        }
      } else {
        // --- Cat Sleeping Peacefully on Velvet Armchair ---
        // 1. Rhythmic Belly Breathing Animation
        const catBreathe = Math.sin(f * 0.06) * 1.5;
        const earTwitch = (f % 160 < 12) ? Math.sin(f * 0.6) * 1.5 : 0;

        // Cat Body (curled up sleeping)
        ctx.fillStyle = '#eab308'; // ginger orange tabby
        ctx.beginPath();
        ctx.ellipse(npc.x, npc.y + catBreathe, 12, 7.5 + catBreathe * 0.4, 0, 0, Math.PI * 2);
        ctx.fill();

        // Tabby Stripes
        ctx.fillStyle = '#9a3412';
        ctx.fillRect(npc.x - 5, npc.y - 5 + catBreathe, 2.5, 6.5);
        ctx.fillRect(npc.x + 1, npc.y - 5 + catBreathe, 2.5, 6.5);
        ctx.fillRect(npc.x + 6, npc.y - 4 + catBreathe, 2.5, 5);

        // White Mitten Paws tucked in front
        ctx.fillStyle = '#f8fafc';
        ctx.beginPath();
        ctx.arc(npc.x - 3, npc.y + 5 + catBreathe, 2.5, 0, Math.PI * 2);
        ctx.arc(npc.x + 2, npc.y + 5 + catBreathe, 2.5, 0, Math.PI * 2);
        ctx.fill();

        // Cat Head resting on paws
        ctx.fillStyle = '#eab308';
        ctx.beginPath();
        ctx.arc(npc.x - 9, npc.y - 1 + catBreathe, 6, 0, Math.PI * 2);
        ctx.fill();

        // Ears with subtle twitch
        ctx.fillStyle = '#ca8a04';
        ctx.beginPath();
        ctx.moveTo(npc.x - 14, npc.y - 5 + catBreathe + earTwitch);
        ctx.lineTo(npc.x - 10, npc.y - 9 + catBreathe + earTwitch);
        ctx.lineTo(npc.x - 7, npc.y - 4 + catBreathe);
        ctx.closePath();
        ctx.fill();
        ctx.fillStyle = '#f472b6'; // pink inner ear
        ctx.fillRect(npc.x - 11, npc.y - 6 + catBreathe + earTwitch, 2, 2.5);

        // Cute Sleeping Eye Line (curved happy sleeping line)
        ctx.strokeStyle = '#18181b';
        ctx.lineWidth = 1.2;
        ctx.beginPath();
        ctx.arc(npc.x - 11, npc.y - 1 + catBreathe, 2.2, 0.2, Math.PI - 0.2);
        ctx.stroke();

        // Tiny Pink Nose
        ctx.fillStyle = '#fb7185';
        ctx.fillRect(npc.x - 13, npc.y + catBreathe, 2, 1.5);

        // Red Bell Collar & Shiny Golden Bell
        ctx.fillStyle = '#ef4444';
        ctx.fillRect(npc.x - 6, npc.y + catBreathe, 4, 3);
        ctx.fillStyle = '#facc15';
        ctx.beginPath();
        ctx.arc(npc.x - 4, npc.y + 2 + catBreathe, 2, 0, Math.PI * 2);
        ctx.fill();

        // Curled Striped Tail with Gentle Tip Waggle
        const tailWag = Math.sin(f * 0.1) * 2;
        ctx.fillStyle = '#eab308';
        ctx.beginPath();
        ctx.arc(npc.x + 11, npc.y - 2 + catBreathe + tailWag, 4.5, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = '#9a3412';
        ctx.fillRect(npc.x + 10, npc.y - 4 + catBreathe + tailWag, 2, 4);

        // 2. Floating 'Zzz' Particles rising from cat's nose
        for (let z = 0; z < 3; z++) {
          const zProg = ((f * 0.45 + z * 24) % 72);
          const zX = npc.x - 14 - Math.sin(zProg * 0.08 + z) * 4;
          const zY = npc.y - 5 - zProg;
          const zAlpha = Math.max(0, 0.85 * (1 - zProg / 72));
          const zSize = 7 + z * 2.5;

          ctx.font = `bold ${zSize}px Arial, sans-serif`;
          ctx.fillStyle = `rgba(254, 240, 138, ${zAlpha})`;
          ctx.fillText(z === 2 ? 'Z' : 'z', zX, zY);
        }
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
   * Multi-layered Cosmic Visual Aura, Harmonic Sine Wave Tentacles, Dripping Ink & Laser Sunglasses
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

    // 1. Multi-layered Cosmic Visual Aura
    const auraPulse = 0.5 + 0.5 * Math.sin(f * 0.1);
    const auraRadius = 100 + auraPulse * 15;
    const auraGrad = ctx.createRadialGradient(0, -10, 20, 0, -10, auraRadius);

    if (phase === 2) {
      // Phase 2: Raging Crimson Flame Aura & Berserk Sparks
      auraGrad.addColorStop(0, `rgba(239, 68, 68, ${0.45 + auraPulse * 0.25})`);
      auraGrad.addColorStop(0.5, `rgba(249, 115, 22, ${0.28 + auraPulse * 0.15})`);
      auraGrad.addColorStop(0.85, 'rgba(220, 38, 38, 0.08)');
      auraGrad.addColorStop(1, 'rgba(220, 38, 38, 0)');

      // Berserk Red Lightning Sparks
      ctx.strokeStyle = '#f87171';
      ctx.lineWidth = 1.5;
      for (let s = 0; s < 3; s++) {
        if ((f + s * 15) % 28 < 14) {
          const sAng = (s * Math.PI * 2 / 3) + Math.sin(f * 0.2) * 0.6;
          ctx.beginPath();
          ctx.moveTo(Math.cos(sAng) * 35, -10 + Math.sin(sAng) * 25);
          ctx.lineTo(Math.cos(sAng) * 60 + Math.sin(f * 0.5) * 8, -10 + Math.sin(sAng) * 50);
          ctx.lineTo(Math.cos(sAng) * 85, -10 + Math.sin(sAng) * 68);
          ctx.stroke();
        }
      }
    } else {
      // Phase 1 & 3: Deep Cosmic Violet & Nebula Cyan Aura
      auraGrad.addColorStop(0, `rgba(147, 51, 234, ${0.4 + auraPulse * 0.2})`);
      auraGrad.addColorStop(0.5, `rgba(59, 130, 246, ${0.22 + auraPulse * 0.12})`);
      auraGrad.addColorStop(0.85, 'rgba(168, 85, 247, 0.08)');
      auraGrad.addColorStop(1, 'rgba(147, 51, 234, 0)');
    }

    ctx.fillStyle = auraGrad;
    ctx.beginPath();
    ctx.arc(0, -10, auraRadius, 0, Math.PI * 2);
    ctx.fill();

    // Orbiting Cosmic Tapioca Pearls (4 Pearls revolving in 3D perspective)
    for (let op = 0; op < 4; op++) {
      const opAng = (f * 0.035 + op * (Math.PI / 2));
      const opX = Math.cos(opAng) * 72;
      const opY = Math.sin(opAng) * 24 - 8;
      const opScale = 0.8 + 0.4 * ((Math.sin(opAng) + 1) / 2);

      // Pearl body
      ctx.fillStyle = (phase === 2) ? '#991b1b' : '#1e1b4b';
      ctx.beginPath();
      ctx.arc(opX, opY, 4.5 * opScale, 0, Math.PI * 2);
      ctx.fill();
      // Pearl glow halo
      ctx.fillStyle = (phase === 2) ? '#ef4444' : '#c084fc';
      ctx.beginPath();
      ctx.arc(opX - 1, opY - 1, 2 * opScale, 0, Math.PI * 2);
      ctx.fill();
    }

    // Phase 3 Foaming Bubble Forcefield Barrier with Rotating Runic Shield Wards
    if (phase === 3) {
      ctx.strokeStyle = '#38bdf8';
      ctx.lineWidth = 3;
      ctx.setLineDash([8, 6]);
      ctx.lineDashOffset = -f * 1.5;
      ctx.beginPath();
      ctx.arc(0, 0, 92, 0, Math.PI * 2);
      ctx.stroke();
      ctx.setLineDash([]);

      ctx.fillStyle = 'rgba(56, 189, 248, 0.18)';
      ctx.beginPath();
      ctx.arc(0, 0, 92, 0, Math.PI * 2);
      ctx.fill();

      // 4 Rotating Hexagonal Shield Wards
      for (let w = 0; w < 4; w++) {
        const wAng = (f * 0.04 + w * (Math.PI / 2));
        const wx = Math.cos(wAng) * 92;
        const wy = Math.sin(wAng) * 92;
        ctx.fillStyle = '#67e8f9';
        ctx.fillRect(wx - 4, wy - 4, 8, 8);
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(wx - 2, wy - 2, 4, 4);
      }
    }

    // 2. 8 Harmonic Sine Wave Tentacles with Kinematic Articulation & Dripping Ink
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
      ctx.fillStyle = tCfg.isBack ? '#6b21a8' : '#9333ea';
      let currentX = tCfg.x;
      let currentY = tCfg.isBack ? 22 : 30;
      let lastWave = 0;

      // Draw 4 soft articulate segments with fluid wave motion
      for (let s = 0; s < 4; s++) {
        const wave = Math.sin(f * 0.2 + idx * 0.75 + s * 0.55) * (4.5 + s * 2.5);
        lastWave = wave;
        ctx.fillRect(currentX + wave, currentY + s * 11, 14 - s, 12);

        // Cyan Glowing Sucker Dots pulsing with cosmic power
        if (s >= 1) {
          const suckerPulse = 0.7 + 0.3 * Math.sin(f * 0.15 + idx + s);
          ctx.fillStyle = `rgba(34, 211, 238, ${suckerPulse})`;
          ctx.fillRect(currentX + wave + 3.5, currentY + s * 11 + 3, 5, 5);
          ctx.fillStyle = '#ffffff';
          ctx.fillRect(currentX + wave + 4.5, currentY + s * 11 + 4, 2, 2);
          ctx.fillStyle = tCfg.isBack ? '#6b21a8' : '#9333ea';
        }
      }

      // Dynamic Dripping Purple Ink Droplet falling from tentacle tip
      const inkProgress = ((f * 0.9 + idx * 14) % 40);
      const inkX = currentX + lastWave + 5;
      const inkY = currentY + 44 + inkProgress;
      const inkAlpha = Math.max(0, 1 - inkProgress / 40);
      ctx.fillStyle = `rgba(126, 34, 206, ${inkAlpha})`;
      ctx.fillRect(inkX, inkY, 2.5, 3.5);
    });

    // 3. Big Purple Squid Head with Highlights
    ctx.fillStyle = '#9333ea';
    ctx.fillRect(-45, -35, 90, 75);
    ctx.fillStyle = '#a855f7';
    ctx.fillRect(-38, -42, 76, 12);
    ctx.fillStyle = '#7e22ce';
    ctx.fillRect(-48, -25, 96, 55);

    // Head Volume Specular Highlight
    ctx.fillStyle = 'rgba(255, 255, 255, 0.22)';
    ctx.fillRect(-32, -32, 64, 4);

    // Cyan Luminous Spots on Head
    ctx.fillStyle = '#22d3ee';
    ctx.fillRect(-35, -20, 8, 8);
    ctx.fillRect(27, -20, 8, 8);
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(-33, -18, 3, 3);
    ctx.fillRect(29, -18, 3, 3);

    // 4. Vietnamese Nón Lá Cute (#FDE047)
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

    // Golden Tassel on Nón Lá Apex swinging with float bob
    const tasselSway = Math.sin(f * 0.12) * 3;
    ctx.fillStyle = '#ef4444';
    ctx.fillRect(tasselSway - 1, -70, 3, 4);
    ctx.fillStyle = '#facc15';
    ctx.fillRect(tasselSway - 2, -66, 5, 5);

    // 5. Cool Sunglasses (#0F172A, flashes fiery red in Phase 2)
    const glassColor = (phase === 2) ? '#ef4444' : '#0f172a';
    ctx.fillStyle = glassColor;
    ctx.fillRect(-36, -6, 32, 22);
    ctx.fillRect(4, -6, 32, 22);

    // Golden Bridge
    ctx.fillStyle = '#facc15';
    ctx.fillRect(-4, 0, 8, 6);

    // Diagonal Laser Glint Sweep across lenses
    const glintOffset = (f * 0.75) % 36;
    ctx.fillStyle = phase === 2 ? '#fca5a5' : '#38bdf8';
    ctx.fillRect(-32 + (glintOffset % 26), -2, 6, 6);
    ctx.fillRect(8 + (glintOffset % 26), -2, 6, 6);
    // Extra bright core
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(-30 + (glintOffset % 26), 0, 2.5, 2.5);
    ctx.fillRect(10 + (glintOffset % 26), 0, 2.5, 2.5);

    // Mischievous Tooth Grin
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(-8, 20, 16, 5);
    ctx.fillStyle = '#facc15'; // golden fang
    ctx.fillRect(3, 22, 4, 5);

    // 6. Giant Boba Cup in Tentacles with Sloshing Brown Sugar Milk Tea
    ctx.fillStyle = 'rgba(255, 255, 255, 0.88)';
    ctx.fillRect(38, -5, 26, 34);
    // Dark brown sugar milk tea
    ctx.fillStyle = '#78350f';
    ctx.fillRect(40, 2, 22, 24);
    // White foam cap
    ctx.fillStyle = '#fef3c7';
    ctx.fillRect(40, 2, 22, 4);
    // Tapioca pearls in cup
    ctx.fillStyle = '#111827';
    ctx.beginPath();
    ctx.arc(46, 20, 3, 0, Math.PI * 2);
    ctx.arc(54, 21, 3, 0, Math.PI * 2);
    ctx.arc(50, 15, 3, 0, Math.PI * 2);
    ctx.arc(44, 13, 2.5, 0, Math.PI * 2);
    ctx.fill();
    // Purple jumbo straw poking out
    ctx.fillStyle = '#9333ea';
    ctx.fillRect(48, -12, 4, 14);

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
