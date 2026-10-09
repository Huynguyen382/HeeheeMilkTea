/**
 * Cozy Room Scene Renderer (Refactored & Modular Orchestrator)
 * Coordinates canvas loop, player physics, depth-sorted rendering,
 * and furniture interaction mechanics.
 * 
 * Sub-modules:
 * - RoomBackground: Architecture, wallpaper, floor, window, sunbeam, fairy lights, wall decor
 * - RoomFurniture: TV console, teddy bear, sofa, coffee table, rug, pet bed, plant stool, cabinet
 * - RoomAvatar: Chibi HeeHee character sprite, walk cycle, and physics
 */

import { RoomBackground } from './room-background.js';
import { RoomFurniture } from './room-furniture.js';
import { RoomAvatar } from './room-avatar.js';

export class RoomRenderer {
  constructor(canvas) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');

    // 16:9 Reference Widescreen Canvas Resolution (matching 1024x576 pixel art asset)
    this.baseW = 1024;
    this.baseH = 576;
    this.canvas.width = this.baseW;
    this.canvas.height = this.baseH;
    this.width = this.baseW;
    this.height = this.baseH;

    // Load High-Fidelity Room Backdrop Asset
    this.bgImg = new Image();
    this.bgImg.src = 'images/room/room_clean_bg.png';
    this.bgImgLoaded = false;
    this.bgImg.onload = () => { this.bgImgLoaded = true; };

    // Load High-Detail Chibi HeeHee Sprite Asset
    this.spriteImg = new Image();
    this.spriteImg.src = 'images/room/heehee_sprite.png';
    this.spriteImgLoaded = false;
    this.spriteImg.onload = () => { this.spriteImgLoaded = true; };

    this.tick = 0;
    this.weather = { id: 'sunny', icon: '☀️' };
    this.equipped = new Set();
    this.pet = null;
    this.isFriend = false;
    this.ownerName = 'HeeHee';

    // Playable Avatar
    this.player = {
      x: 705,
      y: 445,
      speed: 3.5,
      facing: 'left',
      isMoving: false,
      stepTick: 0,
      walkFrame: 0,
      state: 'idle'
    };

    // Controller input vector (-1 to 1)
    this.input = { x: 0, y: 0 };

    // Nearby interaction state
    this.nearbyInteractable = null;
    this.onInteractCallback = null;

    // Interactive prop states
    this.tvChannel = 0;
    this.tvChannels = ['🧋 TV Trà Sữa', '🌤️ Dự Báo Thời Tiết', '🎮 8-Bit Retro Gaming', '💃 Âm Nhạc Sôi Động'];
    this.petHappyTimer = 0;
    this.lampOn = true;

    // FX pools
    this.activeFloatingTexts = [];
    this.particles = [];

    // Animation loop
    this.animId = null;
    this.start();
  }

  resize(w, h) {
    this.canvas.width = this.baseW;
    this.canvas.height = this.baseH;
    this.width = this.baseW;
    this.height = this.baseH;
  }

  setData(data) {
    if (!data) return;
    this.equipped = new Set((data.equippedItems || []).map(i => i.id));
    this.weather = data.weather || { id: 'sunny', icon: '☀️' };
    this.pet = data.pet || null;
    this.ownerName = data.store_name || data.username || 'HeeHee';
    this.isFriend = !!data.isFriend;

    // Detect equipped outfit
    const equippedOutfit = (data.equippedItems || []).find(i => i.category === 'outfit');
    if (equippedOutfit && equippedOutfit.render) {
      this.player.outfit = equippedOutfit.render;
    } else {
      this.player.outfit = null;
    }

    if (this.player.y < 350 || this.player.y > 520) {
      this.player.x = 705;
      this.player.y = 445;
    }
  }

  setWeather(weather) {
    if (weather) {
      this.weather = weather;
    }
  }

  setInput(x, y) {
    this.input.x = x;
    this.input.y = y;
  }

  setOnInteractChange(cb) {
    this.onInteractCallback = cb;
  }

  start() {
    if (this.animId) cancelAnimationFrame(this.animId);
    const loop = () => {
      this.tick++;
      this.update();
      this.render();
      this.animId = requestAnimationFrame(loop);
    };
    this.animId = requestAnimationFrame(loop);
  }

  stop() {
    if (this.animId) {
      cancelAnimationFrame(this.animId);
      this.animId = null;
    }
  }

  spawnParticle(x, y, icon, color = '#ff7675', vx = 0, vy = -1.2, size = 14, maxLife = 45) {
    this.particles.push({
      x,
      y,
      icon,
      color,
      vx: vx + (Math.random() - 0.5) * 0.8,
      vy,
      size,
      life: maxLife,
      maxLife
    });
  }

  spawnFloatingText(x, y, text, color = '#ffeaa7') {
    this.activeFloatingTexts.push({
      x,
      y,
      text,
      color,
      vy: -1.0,
      life: 55,
      maxLife: 55
    });
  }

  interact() {
    if (!this.nearbyInteractable) {
      this.spawnParticle(this.player.x, this.player.y - 20, '✨', '#ffeaa7');
      if (window.sound && window.sound.pop) window.sound.pop();
      return;
    }

    const item = this.nearbyInteractable;
    if (window.sound && window.sound.pop) window.sound.pop();

    switch (item.id) {
      case 'sofa':
        this.player.state = 'sitting';
        this.player.x = item.x;
        this.player.y = item.y + 4;
        this.spawnParticle(this.player.x, this.player.y - 18, '💖', '#fd79a8');
        this.spawnFloatingText(this.player.x, this.player.y - 28, '🛋️ Sofa êm ái quá!', '#fd79a8');
        break;

      case 'table':
        this.spawnParticle(item.x, item.y - 10, '🧋', '#e17055');
        this.spawnFloatingText(item.x, item.y - 24, '+10 Điểm Chill 🧋', '#fdcb6e');
        if (window.sound && window.sound.coin) window.sound.coin();
        break;

      case 'pet':
        this.petHappyTimer = 90;
        for (let i = 0; i < 4; i++) {
          setTimeout(() => {
            this.spawnParticle(item.x + (Math.random() - 0.5) * 20, item.y - 10, '❤️', '#ff7675');
          }, i * 110);
        }
        this.spawnFloatingText(item.x, item.y - 26, 'Gâu gâu! ❤️ Cưng xỉu', '#ff7675');
        break;

      case 'tv':
        this.tvChannel = (this.tvChannel + 1) % this.tvChannels.length;
        this.spawnParticle(item.x, item.y - 12, '📺', '#00cec9');
        this.spawnFloatingText(item.x, item.y - 24, this.tvChannels[this.tvChannel], '#81ecec');
        break;

      case 'bear':
        this.spawnParticle(item.x, item.y - 14, '🧸', '#e17055');
        this.spawnFloatingText(item.x, item.y - 26, 'Ôm gấu bông ấm áp 💖', '#fab1a0');
        break;

      case 'lamp':
        this.lampOn = !this.lampOn;
        this.spawnParticle(item.x, item.y - 14, '💡', '#fffa65');
        this.spawnFloatingText(item.x, item.y - 26, this.lampOn ? 'Bật đèn ấm cúng ✨' : 'Tắt đèn ngủ ngon 🌙', '#ffeaa7');
        break;

      case 'bookshelf':
        const quotes = [
          '📖 "Thêm 50% trân châu, nhân đôi hạnh phúc!"',
          '📖 "Bí quyết buôn may bán đắt: Nụ cười thân thiện!"',
          '📖 "Công thức trà sữa trân châu đường đen đỉnh cao!"'
        ];
        const q = quotes[Math.floor(Math.random() * quotes.length)];
        this.spawnParticle(item.x, item.y - 16, '✨', '#fdcb6e');
        this.spawnFloatingText(item.x, item.y - 28, q, '#ffeaa7');
        break;

      case 'plant':
        this.spawnParticle(item.x, item.y - 12, '🌱', '#2ecc71');
        this.spawnFloatingText(item.x, item.y - 24, 'Tưới nước cho cây tươi tốt 💧', '#2ecc71');
        break;

      default:
        this.spawnParticle(this.player.x, this.player.y - 18, '✨', '#ffeaa7');
        break;
    }
  }

  update() {
    const w = this.baseW;
    const h = this.baseH;

    // 1. Player Physics & Movement bounds with subtle footstep puff
    RoomAvatar.updatePhysics(this.player, this.input, {
      minX: 65,
      maxX: w - 65,
      minY: 355,
      maxY: h - 45
    }, (stepX, stepY, vx) => {
      this.spawnParticle(
        stepX - (vx || 0) * 2,
        stepY,
        '·',
        'rgba(240, 220, 200, 0.65)',
        -(vx || 0) * 0.15,
        -0.2,
        10,
        16
      );
    });

    // 2. Check nearby interactables
    this.checkNearbyInteractables();

    // 3. Update Particles
    for (let i = this.particles.length - 1; i >= 0; i--) {
      const p = this.particles[i];
      p.x += p.vx;
      p.y += p.vy;
      p.life--;
      if (p.life <= 0) {
        this.particles.splice(i, 1);
      }
    }

    // 4. Update Floating Texts
    for (let i = this.activeFloatingTexts.length - 1; i >= 0; i--) {
      const ft = this.activeFloatingTexts[i];
      ft.y += ft.vy;
      ft.life--;
      if (ft.life <= 0) {
        this.activeFloatingTexts.splice(i, 1);
      }
    }

    if (this.petHappyTimer > 0) this.petHappyTimer--;
  }

  checkNearbyInteractables() {
    const list = [
      { id: 'tv', name: 'Tivi Retro', action: '📺 Đổi Kênh TV', x: 252, y: 345 },
      { id: 'bear', name: 'Gấu Bông 1m5', action: '🧸 Ôm Gấu Bông', x: 348, y: 355 },
      { id: 'sofa', name: 'Sofa Hồng Pastel', action: '🛋️ Ngồi Thư Giãn', x: 512, y: 345 },
      { id: 'table', name: 'Bàn Trà Gỗ', action: '🧋 Uống Trà Sữa (+10 Chill)', x: 540, y: 405 },
      { id: 'pet', name: 'Cún Cưng Shiba', action: '🐾 Vuốt Ve Cún Cưng', x: 768, y: 355 },
      { id: 'plant', name: 'Cây Cảnh', action: '🌱 Chăm Sóc Cây', x: 880, y: 345 },
      { id: 'lamp', name: 'Tủ Đầu Giường', action: '💡 Bật/Tắt Đèn Ngủ', x: 970, y: 340 },
      { id: 'bookshelf', name: 'Kệ Sách Gỗ', action: '📚 Đọc Sách Hay', x: 165, y: 345 }
    ];

    let nearest = null;
    let minDist = 62;

    for (const item of list) {
      const dist = Math.hypot(this.player.x - item.x, this.player.y - item.y);
      if (dist < minDist) {
        minDist = dist;
        nearest = item;
      }
    }

    const prevId = this.nearbyInteractable ? this.nearbyInteractable.id : null;
    const currId = nearest ? nearest.id : null;

    this.nearbyInteractable = nearest;

    if (prevId !== currId && this.onInteractCallback) {
      this.onInteractCallback(nearest);
    }
  }

  render() {
    const ctx = this.ctx;
    const w = this.baseW;
    const h = this.baseH;
    ctx.clearRect(0, 0, w, h);

    if (this.bgImgLoaded && this.bgImg.complete) {
      // 1. Draw 1024x576 pristine backdrop
      ctx.drawImage(this.bgImg, 0, 0, w, h);

      // 2. Synchronize Window View with Live Weather outside
      RoomBackground.drawDynamicWindowOverlay(ctx, this.weather, this.tick);

      // 3. Volumetric Lighting & Atmospheric Shading
      this.drawVolumetricLighting(ctx, w, h);

      // 4. Living Animated Props (TV screen graphics, Steaming Tea, Sleeping Shiba, Lamp Glow)
      this.drawLivingProps(ctx);

      // 5. Interactive Object Floor Highlight Pulse
      if (this.nearbyInteractable) {
        this.drawInteractableFloorHighlight(ctx, this.nearbyInteractable);
      }

      // 6. Render Fully Animated Chibi HeeHee Avatar (Real walking legs, swinging arms, blinking eyes, zero artifacts)
      RoomAvatar.drawPlayer(ctx, this.player, this.tick);

    } else {
      // Fallback: Full Procedural Modular Canvas Pipeline
      const wallH = 328;
      RoomBackground.drawWallpaper(ctx, w, wallH);
      RoomBackground.drawHardwoodFloor(ctx, 0, wallH, w, h - wallH);
      RoomBackground.drawFairyLights(ctx, this.tick);
      RoomBackground.drawSunsetWindow(ctx, w, this.weather, this.tick);
      RoomBackground.drawSunlightShaft(ctx, w, h);
      RoomBackground.drawWallDecor(ctx);
      RoomFurniture.drawBohoRug(ctx, Math.floor(w / 2 - 15), 445);

      const renderList = [
        { y: 335, render: () => RoomFurniture.drawTvConsole(ctx, 190, 260, this.tvChannel) },
        { y: 350, render: () => RoomFurniture.drawTeddyBear(ctx, 348, 305) },
        { y: 330, render: () => RoomFurniture.drawPinkSofa(ctx, 435, 282) },
        { y: 390, render: () => RoomFurniture.drawCoffeeTable(ctx, 495, 350) },
        { y: 355, render: () => RoomFurniture.drawPetBed(ctx, 730, 335, this.tick, this.petHappyTimer) },
        { y: 345, render: () => RoomFurniture.drawPlantStool(ctx, 855, 298) },
        { y: 340, render: () => RoomFurniture.drawSideCabinet(ctx, 945, 268, this.lampOn) },
        { y: this.player.y + 12, render: () => RoomAvatar.drawPlayer(ctx, this.player, this.tick) }
      ];

      renderList.sort((a, b) => a.y - b.y);
      for (const item of renderList) {
        item.render();
      }
    }

    // 7. Particles & Floating Texts
    this.renderParticles(ctx);

    // 8. Cinematic Vignette (Subtle cozy shadow at screen edges)
    this.drawCinematicVignette(ctx, w, h);

    // 9. Interactive Hotspot Speech Bubble with gentle hover bounce
    if (this.nearbyInteractable) {
      const hoverY = Math.sin(this.tick * 0.12) * 2.5;
      this.drawInteractionBubble(ctx, this.player.x, this.player.y - 48 + hoverY, this.nearbyInteractable.action);
    }
  }

  drawVolumetricLighting(ctx, w, h) {
    const weatherId = (this.weather && this.weather.id) || 'sunny';

    // 1. Weather-Specific Ambient Tone
    if (weatherId === 'stormy') {
      ctx.save();
      ctx.fillStyle = 'rgba(18, 12, 35, 0.24)';
      ctx.fillRect(0, 0, w, h);

      // Lightning screen flash
      const isLightning = (this.tick % 180 < 6) || (this.tick % 180 > 12 && this.tick % 180 < 16);
      if (isLightning) {
        ctx.fillStyle = 'rgba(235, 245, 255, 0.45)';
        ctx.fillRect(0, 0, w, h);
      }
      ctx.restore();
    } else if (weatherId === 'rainy') {
      ctx.save();
      ctx.fillStyle = 'rgba(25, 42, 75, 0.14)';
      ctx.fillRect(0, 0, w, h);
      ctx.restore();
    } else if (weatherId === 'sunny') {
      // Volumetric Golden Sunbeam Shaft from the window
      ctx.save();
      const winX = 428;
      const sillY = 230;
      const beamGrad = ctx.createLinearGradient(winX + 40, sillY, winX - 80, h);
      beamGrad.addColorStop(0, 'rgba(255, 225, 140, 0.22)');
      beamGrad.addColorStop(0.35, 'rgba(255, 210, 110, 0.14)');
      beamGrad.addColorStop(1, 'rgba(255, 190, 80, 0.02)');
      ctx.fillStyle = beamGrad;
      ctx.beginPath();
      ctx.moveTo(winX + 10, sillY);
      ctx.lineTo(winX + 160, sillY);
      ctx.lineTo(winX + 280, h - 10);
      ctx.lineTo(winX - 110, h - 10);
      ctx.closePath();
      ctx.fill();
      ctx.restore();

      // Golden Dust Motes floating in sunlight
      if (this.tick % 15 === 0 && Math.random() < 0.6) {
        const sx = 300 + Math.random() * 380;
        const sy = 160 + Math.random() * 300;
        this.particles.push({
          x: sx,
          y: sy,
          icon: '✦',
          color: 'rgba(255, 235, 175, 0.8)',
          vx: (Math.random() - 0.3) * 0.35,
          vy: -0.35 - Math.random() * 0.3,
          size: 7,
          life: 65,
          maxLife: 65
        });
      }
    } else if (weatherId === 'windy') {
      if (this.tick % 45 === 0 && Math.random() < 0.4) {
        this.particles.push({
          x: 450 + Math.random() * 100,
          y: 180 + Math.random() * 60,
          icon: Math.random() > 0.5 ? '🍃' : '🌸',
          color: '#2ecc71',
          vx: 1.2 + Math.random() * 0.8,
          vy: 0.6 + Math.random() * 0.5,
          size: 10,
          life: 90,
          maxLife: 90
        });
      }
    }

    // 2. Individual Fairy Lights Twinkling Glow (11 bulbs across the wall)
    const fairyBulbs = [
      { x: 642, y: 78 }, { x: 672, y: 96 }, { x: 710, y: 104 }, { x: 745, y: 96 },
      { x: 780, y: 104 }, { x: 818, y: 122 }, { x: 855, y: 124 }, { x: 888, y: 110 },
      { x: 928, y: 122 }, { x: 962, y: 134 }, { x: 994, y: 128 }
    ];
    for (let i = 0; i < fairyBulbs.length; i++) {
      const b = fairyBulbs[i];
      const pulse = Math.sin(this.tick * 0.08 + i * 0.75) * 2.5;
      const glowR = 10 + pulse;
      const grad = ctx.createRadialGradient(b.x, b.y, 1, b.x, b.y, glowR);
      grad.addColorStop(0, 'rgba(255, 245, 180, 0.85)');
      grad.addColorStop(0.4, 'rgba(253, 203, 110, 0.4)');
      grad.addColorStop(1, 'transparent');
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.arc(b.x, b.y, glowR, 0, Math.PI * 2);
      ctx.fill();
    }

    // 3. Vintage Bedside Lamp Warm Radial Light Cone
    if (this.lampOn) {
      const lampGlow = ctx.createRadialGradient(975, 305, 6, 975, 305, 95);
      lampGlow.addColorStop(0, 'rgba(255, 248, 180, 0.65)');
      lampGlow.addColorStop(0.45, 'rgba(253, 220, 120, 0.22)');
      lampGlow.addColorStop(1, 'transparent');
      ctx.fillStyle = lampGlow;
      ctx.beginPath();
      ctx.arc(975, 305, 95, 0, Math.PI * 2);
      ctx.fill();
    } else {
      // Dark corner shadow when lamp is turned off
      ctx.save();
      ctx.fillStyle = 'rgba(15, 10, 25, 0.42)';
      ctx.fillRect(860, 180, 164, 396);
      ctx.restore();
    }
  }

  drawLivingProps(ctx) {
    // 1. Dynamic CRT Television Screen
    const tvScreenX = 188;
    const tvScreenY = 282;
    const tvScreenW = 50;
    const tvScreenH = 40;

    ctx.save();
    // Screen CRT glow halo
    const tvGlow = ctx.createRadialGradient(tvScreenX + 25, tvScreenY + 20, 5, tvScreenX + 25, tvScreenY + 20, 36);
    tvGlow.addColorStop(0, 'rgba(0, 206, 201, 0.4)');
    tvGlow.addColorStop(1, 'transparent');
    ctx.fillStyle = tvGlow;
    ctx.fillRect(tvScreenX - 8, tvScreenY - 8, tvScreenW + 16, tvScreenH + 16);

    // Screen base color
    ctx.fillStyle = '#0a2336';
    ctx.beginPath();
    ctx.roundRect(tvScreenX, tvScreenY, tvScreenW, tvScreenH, 4);
    ctx.fill();

    // Channel specific dynamic graphics:
    if (this.tvChannel === 0) {
      // 🧋 TV Trà Sữa: Bobbing cup with bubbles
      const cupBob = Math.sin(this.tick * 0.1) * 2;
      ctx.fillStyle = '#f39c12';
      ctx.fillRect(tvScreenX + 17, tvScreenY + 12 + cupBob, 16, 20);
      // White foam
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(tvScreenX + 16, tvScreenY + 10 + cupBob, 18, 4);
      // Straw
      ctx.fillStyle = '#ff7675';
      ctx.fillRect(tvScreenX + 24, tvScreenY + 4 + cupBob, 3, 8);
      // Boba pearls
      ctx.fillStyle = '#2d3436';
      ctx.fillRect(tvScreenX + 19, tvScreenY + 26 + cupBob, 3, 3);
      ctx.fillRect(tvScreenX + 24, tvScreenY + 27 + cupBob, 3, 3);
      ctx.fillRect(tvScreenX + 28, tvScreenY + 25 + cupBob, 3, 3);
    } else if (this.tvChannel === 1) {
      // 🌤️ Dự Báo Thời Tiết: Drifting cloud & glowing sun
      ctx.fillStyle = '#fdcb6e';
      ctx.beginPath();
      ctx.arc(tvScreenX + 32, tvScreenY + 16, 7, 0, Math.PI * 2);
      ctx.fill();
      const cloudX = tvScreenX + 12 + ((this.tick * 0.3) % 18);
      ctx.fillStyle = '#dfe4ea';
      ctx.beginPath();
      ctx.arc(cloudX, tvScreenY + 24, 7, 0, Math.PI * 2);
      ctx.arc(cloudX + 8, tvScreenY + 22, 9, 0, Math.PI * 2);
      ctx.arc(cloudX + 16, tvScreenY + 24, 6, 0, Math.PI * 2);
      ctx.fill();
    } else if (this.tvChannel === 2) {
      // 🎮 8-Bit Retro Gaming: Bouncing pixel ball and paddles
      const ballX = tvScreenX + 10 + Math.abs(Math.sin(this.tick * 0.08)) * 30;
      const ballY = tvScreenY + 10 + Math.abs(Math.cos(this.tick * 0.08)) * 20;
      ctx.fillStyle = '#2ecc71';
      ctx.fillRect(tvScreenX + 6, tvScreenY + 10, 3, 14);
      ctx.fillRect(tvScreenX + 41, tvScreenY + 16, 3, 14);
      ctx.fillStyle = '#fff';
      ctx.fillRect(ballX, ballY, 4, 4);
    } else {
      // 💃 Âm Nhạc: Equalizer visualizer bars
      for (let i = 0; i < 5; i++) {
        const barH = 6 + Math.abs(Math.sin(this.tick * 0.15 + i * 1.1)) * 20;
        ctx.fillStyle = i % 2 === 0 ? '#e84393' : '#a29bfe';
        ctx.fillRect(tvScreenX + 8 + i * 7, tvScreenY + 32 - barH, 5, barH);
      }
    }

    // CRT scanlines
    ctx.fillStyle = 'rgba(0, 0, 0, 0.2)';
    for (let sy = tvScreenY; sy < tvScreenY + tvScreenH; sy += 3) {
      ctx.fillRect(tvScreenX, sy, tvScreenW, 1.2);
    }
    ctx.restore();

    // 2. Steaming Hot Tea on Coffee Table (x: 540, y: 390)
    const teaX = 524;
    const teaY = 380;
    ctx.save();
    for (let i = 0; i < 3; i++) {
      const steamPhase = (this.tick * 0.06 + i * 1.8) % 3;
      const sY = teaY - steamPhase * 9;
      const sX = teaX + Math.sin(this.tick * 0.08 + i * 1.5) * 3 + i * 3;
      const alpha = Math.max(0, 1 - steamPhase / 3) * 0.45;
      ctx.strokeStyle = `rgba(255, 255, 255, ${alpha})`;
      ctx.lineWidth = 1.2;
      ctx.beginPath();
      ctx.moveTo(sX, sY);
      ctx.quadraticCurveTo(sX + 2, sY - 4, sX - 1, sY - 8);
      ctx.stroke();
    }
    ctx.restore();

    // 3. Sleeping Shiba Inu Breathing in Pet Bed (x: 768, y: 345)
    if (this.petHappyTimer > 0) {
      if (this.tick % 18 === 0) {
        this.spawnParticle(768 + (Math.random() - 0.5) * 20, 345, '❤️', '#ff7675', 0, -1, 14, 30);
      }
    } else if (this.tick % 75 === 0) {
      this.spawnParticle(765, 340, '💤', '#a29bfe', 0.2, -0.6, 12, 55);
    }
  }

  drawInteractableFloorHighlight(ctx, item) {
    ctx.save();
    const pulse = Math.sin(this.tick * 0.1) * 3;
    const ringW = 28 + pulse;
    const ringH = 10 + pulse * 0.35;

    ctx.strokeStyle = 'rgba(253, 203, 110, 0.75)';
    ctx.lineWidth = 1.8;
    ctx.shadowColor = 'rgba(253, 203, 110, 0.8)';
    ctx.shadowBlur = 8;
    ctx.beginPath();
    ctx.ellipse(item.x, item.y + 14, ringW, ringH, 0, 0, Math.PI * 2);
    ctx.stroke();

    // Floating gold sparkle marker
    const markerY = item.y - 28 + Math.sin(this.tick * 0.12) * 3;
    ctx.fillStyle = '#ffeaa7';
    ctx.font = 'bold 11px sans-serif';
    ctx.fillText('▼', item.x - 5, markerY);
    ctx.restore();
  }

  drawCinematicVignette(ctx, w, h) {
    ctx.save();
    const vig = ctx.createRadialGradient(w / 2, h / 2, w * 0.42, w / 2, h / 2, w * 0.72);
    vig.addColorStop(0, 'rgba(0, 0, 0, 0)');
    vig.addColorStop(1, 'rgba(12, 6, 20, 0.32)');
    ctx.fillStyle = vig;
    ctx.fillRect(0, 0, w, h);
    ctx.restore();
  }

  renderParticles(ctx) {
    for (const p of this.particles) {
      const alpha = Math.max(0, p.life / p.maxLife);
      ctx.save();
      ctx.globalAlpha = alpha;
      ctx.font = `${p.size}px sans-serif`;
      ctx.fillStyle = p.color;
      ctx.fillText(p.icon, p.x - p.size / 2, p.y);
      ctx.restore();
    }

    for (const ft of this.activeFloatingTexts) {
      const alpha = Math.max(0, ft.life / ft.maxLife);
      ctx.save();
      ctx.globalAlpha = alpha;
      ctx.font = 'bold 12px sans-serif';
      ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
      ctx.fillText(ft.text, ft.x - ctx.measureText(ft.text).width / 2 + 1, ft.y + 1);
      ctx.fillStyle = ft.color;
      ctx.fillText(ft.text, ft.x - ctx.measureText(ft.text).width / 2, ft.y);
      ctx.restore();
    }
  }

  drawInteractionBubble(ctx, x, y, text) {
    ctx.save();
    ctx.font = 'bold 11px sans-serif';
    const textWidth = ctx.measureText(text).width;
    const bubbleW = textWidth + 24;
    const bubbleH = 24;
    const bx = Math.floor(x - bubbleW / 2);
    const by = Math.floor(y - bubbleH);

    ctx.fillStyle = 'rgba(23, 14, 30, 0.92)';
    ctx.strokeStyle = '#fdcb6e';
    ctx.lineWidth = 1.8;
    ctx.shadowColor = 'rgba(253, 203, 110, 0.8)';
    ctx.shadowBlur = 10;
    ctx.beginPath();
    ctx.roundRect(bx, by, bubbleW, bubbleH, 8);
    ctx.fill();
    ctx.stroke();

    ctx.beginPath();
    ctx.moveTo(x - 5, by + bubbleH);
    ctx.lineTo(x, by + bubbleH + 6);
    ctx.lineTo(x + 5, by + bubbleH);
    ctx.fillStyle = 'rgba(23, 14, 30, 0.92)';
    ctx.fill();

    ctx.shadowBlur = 0;
    ctx.fillStyle = '#ffeaa7';
    ctx.fillText(text, bx + 12, by + 16);

    ctx.restore();
  }
}
