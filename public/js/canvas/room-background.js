/**
 * Room Background & Architecture Renderer
 * Handles wallpaper, hardwood floor, panoramic sunset window,
 * volumetric sunbeam, fairy string lights, and wall decor
 */

export const RoomBackground = {
  /**
   * Deep plum vertical pinstriped wallpaper with baseboard & 'D' ART sign
   */
  drawWallpaper(ctx, w, wallH) {
    ctx.save();
    // Deep rich plum gradient base
    const wallGrad = ctx.createLinearGradient(0, 0, 0, wallH);
    wallGrad.addColorStop(0, '#2b1736');
    wallGrad.addColorStop(1, '#1f1027');
    ctx.fillStyle = wallGrad;
    ctx.fillRect(0, 0, w, wallH);

    // Vertical pinstripes with subtle bevel lines
    const stripeW = 12;
    for (let x = 0; x < w; x += stripeW) {
      if ((x / stripeW) % 2 === 0) {
        ctx.fillStyle = '#24122d';
        ctx.fillRect(x, 0, stripeW, wallH);
        // 1px highlight
        ctx.fillStyle = 'rgba(255, 255, 255, 0.035)';
        ctx.fillRect(x, 0, 1, wallH);
        // 1px shadow
        ctx.fillStyle = 'rgba(0, 0, 0, 0.12)';
        ctx.fillRect(x + stripeW - 1, 0, 1, wallH);
      }
    }

    // Baseboard Wooden Trim Moulding
    ctx.fillStyle = '#3a1f2b';
    ctx.fillRect(0, wallH - 12, w, 12);
    ctx.fillStyle = '#5c3748'; // top bevel highlight
    ctx.fillRect(0, wallH - 12, w, 3);
    ctx.fillStyle = '#180c1e'; // bottom seam shadow
    ctx.fillRect(0, wallH - 1, w, 1);

    // Framed "'D' ART" Sign on upper left wall
    ctx.fillStyle = '#c0392b';
    ctx.fillRect(52, 94, 28, 28);
    ctx.fillStyle = '#e67e22';
    ctx.fillRect(54, 96, 24, 24);
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 8px sans-serif';
    ctx.fillText("D'ART", 56, 111);

    ctx.restore();
  },

  /**
   * Hardwood parquet floor with plank grain, seams & nail accents
   */
  drawHardwoodFloor(ctx, x, y, w, h) {
    ctx.save();
    ctx.fillStyle = '#3e2217';
    ctx.fillRect(x, y, w, h);

    const rowH = 22;
    const boardW = 95;

    for (let py = y; py < y + h; py += rowH) {
      // Horizontal seam shadow & highlight
      ctx.fillStyle = '#26130b';
      ctx.fillRect(x, py, w, 2);
      ctx.fillStyle = '#563020';
      ctx.fillRect(x, py + 2, w, 1);

      // Staggered vertical seams (brick pattern)
      const rowIndex = Math.floor((py - y) / rowH);
      const shift = (rowIndex % 3) * 38;

      for (let px = x + (shift % boardW); px < x + w; px += boardW) {
        ctx.fillStyle = '#26130b';
        ctx.fillRect(px, py, 2, Math.min(rowH, y + h - py));
        // Nail dot
        ctx.fillStyle = '#1c0f0a';
        ctx.fillRect(px + 4, py + 4, 1.5, 1.5);
      }
    }
    ctx.restore();
  },

  /**
   * Fairy string lights with 12 glowing warm bulbs draped across wall
   */
  drawFairyLights(ctx, tick) {
    ctx.save();
    ctx.strokeStyle = '#2d3436';
    ctx.lineWidth = 1.4;

    // Catena curve 1
    ctx.beginPath();
    ctx.moveTo(595, 62);
    ctx.quadraticCurveTo(650, 110, 715, 88);
    ctx.stroke();

    // Catena curve 2
    ctx.beginPath();
    ctx.moveTo(715, 88);
    ctx.quadraticCurveTo(775, 135, 840, 105);
    ctx.stroke();

    // Catena curve 3
    ctx.beginPath();
    ctx.moveTo(840, 105);
    ctx.quadraticCurveTo(900, 140, 960, 118);
    ctx.stroke();

    // Glowing Bulbs
    const bulbs = [
      { x: 612, y: 76 }, { x: 638, y: 95 }, { x: 672, y: 104 }, { x: 700, y: 96 },
      { x: 732, y: 102 }, { x: 765, y: 122 }, { x: 800, y: 122 }, { x: 830, y: 109 },
      { x: 865, y: 120 }, { x: 900, y: 132 }, { x: 935, y: 128 }, { x: 955, y: 120 }
    ];

    const pulse = Math.sin(tick * 0.08) * 1.5;

    for (let i = 0; i < bulbs.length; i++) {
      const b = bulbs[i];
      const glowR = 11 + pulse + (i % 3 === 0 ? 2 : 0);

      const glow = ctx.createRadialGradient(b.x, b.y, 1, b.x, b.y, glowR);
      glow.addColorStop(0, 'rgba(255, 234, 167, 0.95)');
      glow.addColorStop(0.4, 'rgba(253, 203, 110, 0.45)');
      glow.addColorStop(1, 'rgba(253, 203, 110, 0)');
      ctx.fillStyle = glow;
      ctx.beginPath();
      ctx.arc(b.x, b.y, glowR, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = '#fff9db';
      ctx.beginPath();
      ctx.arc(b.x, b.y, 3.2, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.restore();
  },

  /**
   * Panoramic sunset window with clouds, golden sun, curtains & 4 sill plants
   */
  drawSunsetWindow(ctx, baseW) {
    const winW = 195;
    const winH = 205;
    const winX = Math.floor(baseW / 2 - winW / 2); // 382
    const winY = 48;

    ctx.save();

    // 1. Curtains Drapery Rod & Bracket Finials
    ctx.fillStyle = '#533529';
    ctx.fillRect(winX - 28, winY - 14, winW + 56, 5);
    ctx.fillRect(winX - 32, winY - 17, 6, 11);
    ctx.fillRect(winX + winW + 26, winY - 17, 6, 11);

    // Hanging rings
    ctx.fillStyle = '#8d5d48';
    for (let rx = winX - 22; rx <= winX + winW + 22; rx += 14) {
      ctx.fillRect(rx, winY - 15, 3, 7);
    }

    // 2. Window Frame Outer Border
    ctx.fillStyle = '#3a2016';
    ctx.fillRect(winX - 4, winY - 4, winW + 8, winH + 8);

    // 3. Sunset Sky Canvas
    const skyGrad = ctx.createLinearGradient(winX, winY, winX, winY + winH);
    skyGrad.addColorStop(0, '#a5678e');   // Dusk violet top
    skyGrad.addColorStop(0.35, '#ff8b8b'); // Coral pink
    skyGrad.addColorStop(0.7, '#ffbe76');  // Warm peach
    skyGrad.addColorStop(1, '#ffdd59');    // Golden horizon
    ctx.fillStyle = skyGrad;
    ctx.fillRect(winX, winY, winW, winH);

    // Golden Sunset Glowing Orb
    const sunX = winX + Math.floor(winW * 0.76);
    const sunY = winY + Math.floor(winH * 0.65);
    const sunGrad = ctx.createRadialGradient(sunX, sunY, 4, sunX, sunY, 32);
    sunGrad.addColorStop(0, '#ffffff');
    sunGrad.addColorStop(0.4, '#fff275');
    sunGrad.addColorStop(0.7, 'rgba(255, 190, 118, 0.6)');
    sunGrad.addColorStop(1, 'rgba(255, 190, 118, 0)');
    ctx.fillStyle = sunGrad;
    ctx.beginPath();
    ctx.arc(sunX, sunY, 32, 0, Math.PI * 2);
    ctx.fill();

    // Pixel Clouds
    ctx.fillStyle = 'rgba(255, 230, 220, 0.75)';
    this.drawPixelCloud(ctx, winX + 15, winY + 45, 60, 14);
    this.drawPixelCloud(ctx, winX + 105, winY + 28, 75, 16);
    this.drawPixelCloud(ctx, winX + 70, winY + 75, 80, 15);
    this.drawPixelCloud(ctx, winX + 25, winY + 115, 95, 14);

    // Distant mountain ridge
    ctx.fillStyle = '#e58080';
    ctx.beginPath();
    ctx.moveTo(winX, winY + winH);
    ctx.lineTo(winX, winY + winH - 22);
    ctx.lineTo(winX + 45, winY + winH - 35);
    ctx.lineTo(winX + 110, winY + winH - 24);
    ctx.lineTo(winX + 160, winY + winH - 38);
    ctx.lineTo(winX + winW, winY + winH - 20);
    ctx.lineTo(winX + winW, winY + winH);
    ctx.closePath();
    ctx.fill();

    // 4. Wooden Window Frame & Cross Panes (2x2 Grid)
    ctx.fillStyle = '#5d3826';
    ctx.fillRect(winX + Math.floor(winW / 2) - 3, winY, 6, winH);
    ctx.fillRect(winX, winY + Math.floor(winH * 0.48) - 3, winW, 6);
    ctx.fillStyle = '#7a4b33';
    ctx.fillRect(winX, winY, winW, 4);
    ctx.fillRect(winX, winY, 4, winH);
    ctx.fillRect(winX + winW - 4, winY, 4, winH);

    // 5. Curtains Hanging on Sides (Soft beige folds)
    const curtainW = 28;
    this.drawCurtainFold(ctx, winX - 22, winY - 10, curtainW, winH + 16);
    this.drawCurtainFold(ctx, winX + winW - 6, winY - 10, curtainW, winH + 16);

    // 6. Window Sill Shelf (Extended wooden ledge holding potted plants)
    const sillX = winX - 16;
    const sillY = winY + winH;
    const sillW = winW + 32;
    const sillH = 14;

    ctx.fillStyle = '#4e2d1d';
    ctx.fillRect(sillX, sillY, sillW, sillH);
    ctx.fillStyle = '#784730';
    ctx.fillRect(sillX, sillY, sillW, 3);
    ctx.fillStyle = '#28140c';
    ctx.fillRect(sillX + 2, sillY + sillH, sillW - 4, 3);

    // 7. 4 Potted Plants on Window Sill Shelf
    this.drawSillPlantTerracotta(ctx, winX + 8, sillY - 26);
    this.drawSillPlantSucculent(ctx, winX + 54, sillY - 22);
    this.drawSillPlantSmallCactus(ctx, winX + 130, sillY - 20);
    this.drawSillPlantTallCacti(ctx, winX + 155, sillY - 26);

    ctx.restore();
  },

  drawPixelCloud(ctx, x, y, w, h) {
    ctx.save();
    ctx.beginPath();
    ctx.roundRect(x, y, w, h, 6);
    ctx.fill();
    ctx.beginPath();
    ctx.arc(x + w * 0.35, y, h * 0.65, 0, Math.PI * 2);
    ctx.arc(x + w * 0.65, y, h * 0.55, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  },

  drawCurtainFold(ctx, x, y, w, h) {
    ctx.fillStyle = '#e2cfbf';
    ctx.fillRect(x, y, w, h);

    ctx.fillStyle = '#cbb39e';
    for (let fx = x + 4; fx < x + w; fx += 8) {
      ctx.fillRect(fx, y, 4, h);
    }

    ctx.fillStyle = '#f5e8dc';
    for (let fx = x + 1; fx < x + w; fx += 8) {
      ctx.fillRect(fx, y, 2, h);
    }

    const tieY = y + Math.floor(h * 0.65);
    ctx.fillStyle = '#a68c76';
    ctx.fillRect(x, tieY, w, 4);
  },

  drawSillPlantTerracotta(ctx, x, y) {
    ctx.fillStyle = '#c0392b';
    ctx.fillRect(x + 2, y + 14, 18, 12);
    ctx.fillStyle = '#e67e22';
    ctx.fillRect(x, y + 12, 22, 3);
    ctx.fillStyle = '#27ae60';
    ctx.beginPath();
    ctx.arc(x + 11, y + 6, 9, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#2ecc71';
    ctx.beginPath();
    ctx.arc(x + 8, y + 3, 6, 0, Math.PI * 2);
    ctx.arc(x + 14, y + 4, 5, 0, Math.PI * 2);
    ctx.fill();
  },

  drawSillPlantSucculent(ctx, x, y) {
    ctx.fillStyle = '#00cec9';
    ctx.fillRect(x + 2, y + 11, 15, 11);
    ctx.fillStyle = '#81ecec';
    ctx.fillRect(x, y + 9, 19, 3);
    ctx.fillStyle = '#16a085';
    ctx.fillRect(x + 4, y + 4, 3, 6);
    ctx.fillRect(x + 8, y + 2, 3, 8);
    ctx.fillRect(x + 12, y + 4, 3, 6);
  },

  drawSillPlantSmallCactus(ctx, x, y) {
    ctx.fillStyle = '#d35400';
    ctx.fillRect(x + 2, y + 10, 14, 10);
    ctx.fillStyle = '#2ecc71';
    ctx.beginPath();
    ctx.arc(x + 9, y + 5, 6, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#e84393';
    ctx.fillRect(x + 8, y - 2, 3, 3);
  },

  drawSillPlantTallCacti(ctx, x, y) {
    ctx.fillStyle = '#c0392b';
    ctx.fillRect(x, y + 14, 26, 12);
    ctx.fillStyle = '#d35400';
    ctx.fillRect(x - 1, y + 12, 28, 3);
    ctx.fillStyle = '#27ae60';
    ctx.fillRect(x + 4, y + 2, 6, 11);
    ctx.fillRect(x + 14, y - 2, 7, 15);
    ctx.fillRect(x + 21, y + 3, 3, 4);
  },

  /**
   * Volumetric golden sunlight shaft
   */
  drawSunlightShaft(ctx, baseW, baseH) {
    ctx.save();
    const winX = Math.floor(baseW / 2 - 195 / 2); // 382
    const sillY = 253;

    const beam = ctx.createLinearGradient(winX + 10, sillY, winX - 60, baseH);
    beam.addColorStop(0, 'rgba(255, 220, 130, 0.18)');
    beam.addColorStop(0.4, 'rgba(255, 210, 110, 0.14)');
    beam.addColorStop(1, 'rgba(255, 190, 80, 0.03)');

    ctx.fillStyle = beam;
    ctx.beginPath();
    ctx.moveTo(winX + 12, sillY);
    ctx.lineTo(winX + 185, sillY);
    ctx.lineTo(winX + 265, baseH - 20);
    ctx.lineTo(winX - 65, baseH - 20);
    ctx.closePath();
    ctx.fill();

    ctx.restore();
  },

  /**
   * Wall mounted decor: bookshelves & framed paintings
   */
  drawWallDecor(ctx) {
    ctx.save();

    // 1. LEFT WALL SHELVES & ART
    // Upper Shelf 1 at (112, 138)
    ctx.fillStyle = '#5d3826';
    ctx.fillRect(112, 142, 76, 5);
    ctx.fillStyle = '#3a2016';
    ctx.fillRect(118, 147, 4, 8);
    ctx.fillRect(178, 147, 4, 8);
    const shelf1Books = [
      { color: '#e74c3c', x: 120, w: 5, h: 22 },
      { color: '#3498db', x: 126, w: 6, h: 24 },
      { color: '#2ecc71', x: 133, w: 5, h: 20 },
      { color: '#f1c40f', x: 139, w: 6, h: 23 },
      { color: '#9b59b6', x: 146, w: 7, h: 21 },
      { color: '#e67e22', x: 162, w: 6, h: 18 }
    ];
    for (const b of shelf1Books) {
      ctx.fillStyle = b.color;
      ctx.fillRect(b.x, 142 - b.h, b.w, b.h);
    }

    // Shelf 2 at (238, 112)
    ctx.fillStyle = '#5d3826';
    ctx.fillRect(238, 116, 78, 5);
    ctx.fillStyle = '#3a2016';
    ctx.fillRect(244, 121, 4, 8);
    ctx.fillRect(306, 121, 4, 8);
    ctx.fillStyle = '#2ecc71';
    ctx.fillRect(245, 94, 6, 22);
    ctx.fillStyle = '#e74c3c';
    ctx.fillRect(252, 92, 7, 24);
    ctx.fillStyle = '#3498db';
    ctx.fillRect(260, 96, 6, 20);
    ctx.fillStyle = '#1abc9c';
    ctx.fillRect(282, 102, 24, 7);
    ctx.fillStyle = '#f39c12';
    ctx.fillRect(284, 96, 20, 6);

    // Landscape Pixel Art Painting at (245, 144)
    ctx.fillStyle = '#5d3826';
    ctx.fillRect(244, 144, 66, 38);
    ctx.fillStyle = '#1c0f0a';
    ctx.fillRect(247, 147, 60, 32);
    ctx.fillStyle = '#74b9ff';
    ctx.fillRect(248, 148, 58, 18);
    ctx.fillStyle = '#a8e6cf';
    ctx.fillRect(248, 166, 58, 12);
    ctx.fillStyle = '#27ae60';
    ctx.beginPath();
    ctx.arc(265, 172, 10, 0, Math.PI * 2);
    ctx.arc(292, 172, 14, 0, Math.PI * 2);
    ctx.fill();

    // 2. RIGHT WALL GALLERY OF FRAMED ART
    // Big City Sunset Painting at (670, 96)
    ctx.fillStyle = '#5d3826';
    ctx.fillRect(668, 94, 90, 48);
    ctx.fillStyle = '#1c0f0a';
    ctx.fillRect(671, 97, 84, 42);
    const cityGrad = ctx.createLinearGradient(671, 97, 671, 139);
    cityGrad.addColorStop(0, '#8e44ad');
    cityGrad.addColorStop(0.6, '#e67e22');
    cityGrad.addColorStop(1, '#f1c40f');
    ctx.fillStyle = cityGrad;
    ctx.fillRect(671, 97, 84, 42);
    ctx.fillStyle = '#2c3e50';
    ctx.fillRect(678, 124, 10, 15);
    ctx.fillRect(692, 118, 12, 21);
    ctx.fillRect(708, 122, 14, 17);
    ctx.fillRect(728, 126, 12, 13);
    ctx.fillStyle = '#e74c3c';
    ctx.beginPath();
    ctx.arc(735, 108, 4, 0, Math.PI * 2);
    ctx.fill();

    // Frame 1: Shiba / Fox portrait at (670, 154)
    ctx.fillStyle = '#5d3826';
    ctx.fillRect(668, 152, 38, 32);
    ctx.fillStyle = '#34495e';
    ctx.fillRect(671, 155, 32, 26);
    ctx.fillStyle = '#e67e22';
    ctx.beginPath();
    ctx.arc(687, 168, 7, 0, Math.PI * 2);
    ctx.fill();

    // Frame 2: Cat & Moon at (715, 154)
    ctx.fillStyle = '#5d3826';
    ctx.fillRect(713, 152, 36, 32);
    ctx.fillStyle = '#2c3e50';
    ctx.fillRect(716, 155, 30, 26);
    ctx.fillStyle = '#f1c40f';
    ctx.beginPath();
    ctx.arc(726, 163, 4, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#111';
    ctx.fillRect(730, 166, 6, 8);

    // Frame 3: Girl portrait at (768, 122)
    ctx.fillStyle = '#5d3826';
    ctx.fillRect(766, 120, 42, 42);
    ctx.fillStyle = '#4b6584';
    ctx.fillRect(769, 123, 36, 36);
    ctx.fillStyle = '#222';
    ctx.beginPath();
    ctx.arc(787, 138, 7, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#ffeaa7';
    ctx.beginPath();
    ctx.arc(787, 139, 5, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#e84393';
    ctx.fillRect(782, 144, 10, 11);

    ctx.restore();
  },

  /**
   * Dynamic weather window overlay in the backdrop
   * Synchronizes window view with live weather: sunny, rainy, stormy, cloudy, windy
   */
  drawDynamicWindowOverlay(ctx, weather, tick) {
    const winX = 428;
    const winY = 58;
    const winW = 168;
    const winH = 172;
    const weatherId = (weather && weather.id) || 'sunny';

    ctx.save();
    // Clip strictly to window glass pane opening
    ctx.beginPath();
    ctx.rect(winX, winY, winW, winH);
    ctx.clip();

    if (weatherId === 'rainy') {
      // Overcast rainy dark teal/slate sky
      const skyGrad = ctx.createLinearGradient(winX, winY, winX, winY + winH);
      skyGrad.addColorStop(0, '#2c3e50');
      skyGrad.addColorStop(0.5, '#34495e');
      skyGrad.addColorStop(1, '#4b6584');
      ctx.fillStyle = skyGrad;
      ctx.fillRect(winX, winY, winW, winH);

      // Drifting dark rain clouds
      ctx.fillStyle = 'rgba(44, 62, 80, 0.75)';
      for (let i = 0; i < 3; i++) {
        const cx = winX + ((tick * 0.4 + i * 70) % (winW + 60)) - 30;
        ctx.beginPath();
        ctx.arc(cx, winY + 25 + i * 14, 25, 0, Math.PI * 2);
        ctx.arc(cx + 20, winY + 28 + i * 14, 20, 0, Math.PI * 2);
        ctx.fill();
      }

      // Animated diagonal rain streaks falling across the glass
      ctx.strokeStyle = 'rgba(200, 225, 255, 0.55)';
      ctx.lineWidth = 1.2;
      for (let i = 0; i < 28; i++) {
        const rx = winX + ((i * 19 + tick * 3.5) % (winW + 20)) - 10;
        const ry = winY + ((i * 23 + tick * 8.0) % (winH + 30)) - 15;
        ctx.beginPath();
        ctx.moveTo(rx, ry);
        ctx.lineTo(rx - 4, ry + 12);
        ctx.stroke();
      }

      // Trickling droplets on the glass pane
      ctx.fillStyle = 'rgba(255, 255, 255, 0.4)';
      for (let i = 0; i < 6; i++) {
        const dx = winX + 14 + i * 26;
        const dy = winY + ((tick * 0.8 + i * 40) % winH);
        ctx.beginPath();
        ctx.arc(dx, dy, 1.6, 0, Math.PI * 2);
        ctx.fill();
      }

    } else if (weatherId === 'stormy') {
      // Midnight stormy purple/black sky
      const skyGrad = ctx.createLinearGradient(winX, winY, winX, winY + winH);
      skyGrad.addColorStop(0, '#130f40');
      skyGrad.addColorStop(0.6, '#1e272e');
      skyGrad.addColorStop(1, '#2c3a47');
      ctx.fillStyle = skyGrad;
      ctx.fillRect(winX, winY, winW, winH);

      // Heavy torrential rain streaks
      ctx.strokeStyle = 'rgba(180, 215, 255, 0.65)';
      ctx.lineWidth = 1.5;
      for (let i = 0; i < 38; i++) {
        const rx = winX + ((i * 15 + tick * 6.0) % (winW + 30)) - 15;
        const ry = winY + ((i * 17 + tick * 12.0) % (winH + 30)) - 15;
        ctx.beginPath();
        ctx.moveTo(rx, ry);
        ctx.lineTo(rx - 8, ry + 16);
        ctx.stroke();
      }

      // Lightning strike flashes (every ~180 frames or on test)
      const isLightning = (tick % 180 < 6) || (tick % 180 > 12 && tick % 180 < 16);
      if (isLightning) {
        ctx.fillStyle = 'rgba(255, 255, 255, 0.9)';
        ctx.fillRect(winX, winY, winW, winH);

        // Jagged lightning bolt
        ctx.strokeStyle = '#74b9ff';
        ctx.lineWidth = 2.4;
        ctx.beginPath();
        ctx.moveTo(winX + 90, winY);
        ctx.lineTo(winX + 80, winY + 45);
        ctx.lineTo(winX + 105, winY + 80);
        ctx.lineTo(winX + 75, winY + 125);
        ctx.lineTo(winX + 95, winY + 165);
        ctx.stroke();
      }

    } else if (weatherId === 'cloudy') {
      // Soft overcast lavender-silver sky
      const skyGrad = ctx.createLinearGradient(winX, winY, winX, winY + winH);
      skyGrad.addColorStop(0, '#747d8c');
      skyGrad.addColorStop(0.5, '#a4b0be');
      skyGrad.addColorStop(1, '#dfe4ea');
      ctx.fillStyle = skyGrad;
      ctx.fillRect(winX, winY, winW, winH);

      // Drifting clouds
      ctx.fillStyle = 'rgba(255, 255, 255, 0.65)';
      for (let i = 0; i < 4; i++) {
        const cx = winX + ((tick * 0.3 + i * 55) % (winW + 80)) - 40;
        const cy = winY + 30 + i * 32;
        ctx.beginPath();
        ctx.arc(cx, cy, 26, 0, Math.PI * 2);
        ctx.arc(cx + 20, cy - 4, 20, 0, Math.PI * 2);
        ctx.arc(cx - 16, cy + 2, 16, 0, Math.PI * 2);
        ctx.fill();
      }

    } else if (weatherId === 'windy') {
      // Breezy turquoise-blue sky
      const skyGrad = ctx.createLinearGradient(winX, winY, winX, winY + winH);
      skyGrad.addColorStop(0, '#48dbfb');
      skyGrad.addColorStop(0.5, '#00d2d3');
      skyGrad.addColorStop(1, '#c7ecee');
      ctx.fillStyle = skyGrad;
      ctx.fillRect(winX, winY, winW, winH);

      // Wind gusts streaks
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.45)';
      ctx.lineWidth = 1.2;
      for (let i = 0; i < 8; i++) {
        const wx = winX + ((tick * 4.0 + i * 30) % (winW + 60)) - 30;
        const wy = winY + 25 + i * 18;
        ctx.beginPath();
        ctx.moveTo(wx, wy);
        ctx.quadraticCurveTo(wx + 25, wy - 5, wx + 45, wy + 2);
        ctx.stroke();
      }

      // Fluttering green leaves & cherry blossom petals
      for (let i = 0; i < 7; i++) {
        const lx = winX + ((tick * 2.8 + i * 28) % (winW + 40)) - 20;
        const ly = winY + ((tick * 1.5 + i * 35) % winH);
        ctx.fillStyle = i % 2 === 0 ? '#2ecc71' : '#ff7675';
        ctx.beginPath();
        ctx.ellipse(lx, ly, 3.5, 2, (tick + i * 20) * 0.1, 0, Math.PI * 2);
        ctx.fill();
      }

    } else {
      // Default: Sunny / Sunset warm sky
      const skyGrad = ctx.createLinearGradient(winX, winY, winX, winY + winH);
      skyGrad.addColorStop(0, '#a5678e');   // Dusk violet
      skyGrad.addColorStop(0.35, '#ff8b8b'); // Coral pink
      skyGrad.addColorStop(0.7, '#ffbe76');  // Peach
      skyGrad.addColorStop(1, '#ffdd59');    // Golden horizon
      ctx.fillStyle = skyGrad;
      ctx.fillRect(winX, winY, winW, winH);

      // Golden glowing sun orb
      const sunGrad = ctx.createRadialGradient(winX + 60, winY + 70, 5, winX + 60, winY + 70, 45);
      sunGrad.addColorStop(0, '#ffffff');
      sunGrad.addColorStop(0.35, '#fff9db');
      sunGrad.addColorStop(0.7, 'rgba(255, 221, 89, 0.6)');
      sunGrad.addColorStop(1, 'transparent');
      ctx.fillStyle = sunGrad;
      ctx.beginPath();
      ctx.arc(winX + 60, winY + 70, 45, 0, Math.PI * 2);
      ctx.fill();

      // Soft sunset clouds
      ctx.fillStyle = 'rgba(255, 200, 180, 0.55)';
      for (let i = 0; i < 3; i++) {
        const cx = winX + ((tick * 0.25 + i * 65) % (winW + 60)) - 30;
        ctx.beginPath();
        ctx.arc(cx, winY + 35 + i * 25, 22, 0, Math.PI * 2);
        ctx.arc(cx + 18, winY + 35 + i * 25, 16, 0, Math.PI * 2);
        ctx.fill();
      }
    }

    // 3. Wooden cross mullions (grid divider)
    ctx.fillStyle = '#3a2016';
    ctx.fillRect(510, winY, 4, winH);
    ctx.fillRect(winX, 140, winW, 4);

    // 4. Subtle diagonal glass reflection sheen
    ctx.fillStyle = 'rgba(255, 255, 255, 0.08)';
    ctx.beginPath();
    ctx.moveTo(winX + 20, winY);
    ctx.lineTo(winX + 60, winY);
    ctx.lineTo(winX + 15, winY + winH);
    ctx.lineTo(winX - 25, winY + winH);
    ctx.fill();

    ctx.restore();

    // 5. Redraw the 4 potted plants on the sill ledge in front of the window
    this.drawSillPlantTerracotta(ctx, winX + 10, winY + winH - 2);
    this.drawSillPlantSucculent(ctx, winX + 52, winY + winH + 2);
    this.drawSillPlantSmallCactus(ctx, winX + 120, winY + winH + 4);
    this.drawSillPlantTallCacti(ctx, winX + 144, winY + winH - 2);
  }
};

