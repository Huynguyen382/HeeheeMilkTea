// Chapter 3: Phố Đi Bộ Hồ Gươm & Cửa Hàng Flagship 2 Tầng (Walking Street Scene)
import { staticBgCache } from './cache.js';

export const walkingStreetMethods = {
  drawWalkingStreetFlagshipBackground(ctx, tod) {
    const isStorm = this.weather && this.weather.id === 'stormy';
    const isRain = this.weather && this.weather.id === 'rainy';
    const isCloudy = this.weather && this.weather.id === 'cloudy';
    const isWindy = this.weather && this.weather.id === 'windy';

    // 1. SKY GRADIENT
    const skyGrad = ctx.createLinearGradient(0, 0, 0, 145);
    if (isStorm) {
      skyGrad.addColorStop(0, '#0a0a14');
      skyGrad.addColorStop(0.5, '#1e1a32');
      skyGrad.addColorStop(1, '#1b1b2f');
    } else if (isRain) {
      skyGrad.addColorStop(0, '#2d3436');
      skyGrad.addColorStop(0.5, '#4b6584');
      skyGrad.addColorStop(1, '#636e72');
    } else if (isCloudy) {
      skyGrad.addColorStop(0, '#4b6584');
      skyGrad.addColorStop(0.45, '#778ca3');
      skyGrad.addColorStop(0.8, '#a4b0be');
      skyGrad.addColorStop(1, '#dfe6e9');
    } else if (isWindy) {
      skyGrad.addColorStop(0, '#1B9CFC');
      skyGrad.addColorStop(0.45, '#4a69bd');
      skyGrad.addColorStop(0.8, '#82ccdd');
      skyGrad.addColorStop(1, '#ffeaa7');
    } else if (tod === 'morning') {
      skyGrad.addColorStop(0, '#1e3799');
      skyGrad.addColorStop(0.4, '#4a69bd');
      skyGrad.addColorStop(0.75, '#f6b93b');
      skyGrad.addColorStop(1, '#ffeaa7');
    } else if (tod === 'noon') {
      skyGrad.addColorStop(0, '#0c2461');
      skyGrad.addColorStop(0.45, '#1e3799');
      skyGrad.addColorStop(0.85, '#4a69bd');
      skyGrad.addColorStop(1, '#82ccdd');
    } else if (tod === 'afternoon') {
      skyGrad.addColorStop(0, '#2c003e');
      skyGrad.addColorStop(0.35, '#511845');
      skyGrad.addColorStop(0.7, '#900c3f');
      skyGrad.addColorStop(0.9, '#c70039');
      skyGrad.addColorStop(1, '#ff5733');
    } else {
      // Night (Phố đêm lung linh)
      skyGrad.addColorStop(0, '#090a0f');
      skyGrad.addColorStop(0.45, '#141829');
      skyGrad.addColorStop(0.85, '#1f2440');
      skyGrad.addColorStop(1, '#181b30');
    }
    ctx.fillStyle = skyGrad;
    ctx.fillRect(0, 0, this.width, 145);

    // 2. CELESTIAL BODIES (Moon & Stars / Sun)
    if (tod === 'night') {
      // Crescent Moon
      ctx.fillStyle = 'rgba(255, 234, 167, 0.25)';
      ctx.beginPath();
      ctx.arc(38, 26, 15, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#fff7d6';
      ctx.beginPath();
      ctx.arc(38, 26, 10, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#141829';
      ctx.beginPath();
      ctx.arc(34, 24, 8, 0, Math.PI * 2);
      ctx.fill();

      // Twinkling stars
      const stars = [
        { x: 16, y: 14 }, { x: 72, y: 18 }, { x: 110, y: 10 },
        { x: 165, y: 16 }, { x: 215, y: 12 }, { x: 295, y: 20 },
        { x: 350, y: 15 }, { x: 410, y: 22 }
      ];
      ctx.fillStyle = '#ffffff';
      stars.forEach((s, idx) => {
        const flicker = (Math.sin(this.tick * 0.12 + idx * 1.5) + 1) * 0.4 + 0.3;
        ctx.globalAlpha = flicker;
        ctx.fillRect(s.x, s.y, 2, 2);
      });
      ctx.globalAlpha = 1.0;
    } else if (!isStorm && !isRain) {
      if (isCloudy) {
        // Diffused pale sun behind cloud deck
        const sx = tod === 'morning' ? 45 : (tod === 'noon' ? 200 : 55);
        const sy = tod === 'morning' ? 28 : (tod === 'noon' ? 18 : 42);
        ctx.fillStyle = 'rgba(255, 255, 255, 0.25)';
        ctx.beginPath();
        ctx.arc(sx, sy, 18, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = 'rgba(255, 255, 255, 0.45)';
        ctx.beginPath();
        ctx.arc(sx, sy, 8, 0, Math.PI * 2);
        ctx.fill();
      } else {
        // Sun
        const sx = tod === 'morning' ? 45 : (tod === 'noon' ? 200 : 55);
        const sy = tod === 'morning' ? 28 : (tod === 'noon' ? 18 : 42);
        const sunHalo = ctx.createRadialGradient(sx, sy, 3, sx, sy, 30);
        sunHalo.addColorStop(0, tod === 'afternoon' ? 'rgba(255, 87, 51, 0.8)' : 'rgba(255, 255, 255, 0.85)');
        sunHalo.addColorStop(0.5, 'rgba(255, 234, 167, 0.3)');
        sunHalo.addColorStop(1, 'rgba(0,0,0,0)');
        ctx.fillStyle = sunHalo;
        ctx.beginPath();
        ctx.arc(sx, sy, 30, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = tod === 'afternoon' ? '#ff5733' : '#ffffff';
        ctx.beginPath();
        ctx.arc(sx, sy, 9, 0, Math.PI * 2);
        ctx.fill();
      }
    }

    // Clouds
    this.drawClouds(ctx, tod);

    // Volumetric God Rays across Walking Street Flagship
    if ((tod === 'morning' || tod === 'afternoon') && (!isStorm && !isRain && !isCloudy)) {
      this.drawGodRays(ctx, tod);
    }

    // 3. BACKGROUND FRENCH COLONIAL SHOPHOUSES (Phố Cổ Hà Nội)
    const ochreWall = (tod === 'night') ? '#3a3220' : '#e5ba55';
    const ochreShade = (tod === 'night') ? '#262014' : '#b88b2e';
    const tileRoof = (tod === 'night') ? '#2c1810' : '#8b3a2b';
    const greenShutter = (tod === 'night') ? '#13281c' : '#1e5f38';

    // 3. HOÀN KIẾM LAKE VISTA & THÁP RÙA, CẦU THÊ HÚC (CẢNH QUAN HỒ GƯƠM LỤC THỦY)
    const lakeY = 48;
    const lakeH = 87;
    const isNight = (tod === 'night');

    // Lake water: Emerald Green Lục Thủy (#16A085 -> #1ABC9C)
    const waterGrad = ctx.createLinearGradient(0, lakeY, 0, lakeY + lakeH);
    if (isNight) {
      waterGrad.addColorStop(0, '#093129');
      waterGrad.addColorStop(0.5, '#0e4a3e');
      waterGrad.addColorStop(1, '#165b4c');
    } else {
      waterGrad.addColorStop(0, '#16a085');
      waterGrad.addColorStop(0.5, '#1abc9c');
      waterGrad.addColorStop(1, '#2ecc71');
    }
    ctx.fillStyle = waterGrad;
    ctx.fillRect(0, lakeY, 110, lakeH);

    // Specular Wave Dithering (Hiệu ứng sóng nước lấp lánh chuyển động nhịp nhàng)
    ctx.fillStyle = isNight ? 'rgba(254, 202, 87, 0.32)' : 'rgba(255, 255, 255, 0.28)';
    for (let wy = lakeY + 6; wy < lakeY + lakeH - 6; wy += 6) {
      const wOff = Math.sin(this.tick * 0.08 + wy) * 3;
      // Dither dashed ripple pixels
      ctx.fillRect(8 + wOff, wy, 16, 1.2);
      ctx.fillRect(36 - wOff, wy + 2, 22, 1.2);
      ctx.fillRect(72 + wOff, wy + 4, 28, 1.2);
      // Extra specular shimmer highlights
      if ((wy + Math.floor(this.tick * 0.05)) % 4 === 0) {
        ctx.fillStyle = isNight ? '#ffeaa7' : '#ffffff';
        ctx.fillRect(26 + wOff, wy + 1, 3, 1);
        ctx.fillRect(60 - wOff, wy + 3, 4, 1);
        ctx.fillStyle = isNight ? 'rgba(254, 202, 87, 0.32)' : 'rgba(255, 255, 255, 0.28)';
      }
    }

    // Turtle Tower (Tháp Rùa Cổ Kính 3 Tầng rêu phong giữa gò cỏ)
    const towerX = 40;
    const towerY = 62;
    // Mist veil
    ctx.fillStyle = isNight ? 'rgba(15, 30, 25, 0.45)' : 'rgba(255, 255, 255, 0.3)';
    ctx.fillRect(15, towerY - 10, 75, 34);

    // Island grass mound
    ctx.fillStyle = '#2d3436';
    ctx.fillRect(towerX - 6, towerY + 14, 32, 5);
    ctx.fillStyle = '#27ae60';
    ctx.fillRect(towerX - 4, towerY + 13, 28, 3);

    // Tower Tier 1 (Base tier with 3 Gothic arches)
    ctx.fillStyle = isNight ? '#4a3f31' : '#c8ad8d';
    ctx.fillRect(towerX, towerY + 5, 20, 9);
    // Green moss streaks on base
    ctx.fillStyle = '#1e8449';
    ctx.fillRect(towerX + 1, towerY + 11, 3, 3);
    ctx.fillRect(towerX + 16, towerY + 10, 3, 4);
    // Arch openings tier 1
    ctx.fillStyle = '#1e272e';
    ctx.fillRect(towerX + 3, towerY + 8, 3, 6);
    ctx.fillRect(towerX + 8.5, towerY + 7, 3, 7);
    ctx.fillRect(towerX + 14, towerY + 8, 3, 6);

    // Tower Tier 2 (Middle tier with 2 arches)
    ctx.fillStyle = isNight ? '#534737' : '#d5bea1';
    ctx.fillRect(towerX + 2, towerY - 1, 16, 7);
    ctx.fillStyle = '#1e272e';
    ctx.fillRect(towerX + 5, towerY + 1, 2.5, 5);
    ctx.fillRect(towerX + 10.5, towerY + 1, 2.5, 5);

    // Tower Tier 3 & Pagoda Eaves (Đỉnh tháp & ngói rêu phong)
    ctx.fillStyle = isNight ? '#2c1810' : '#8b3a2b';
    ctx.fillRect(towerX + 1, towerY - 2, 18, 1.8); // Eaves
    ctx.fillStyle = isNight ? '#534737' : '#d5bea1';
    ctx.fillRect(towerX + 5, towerY - 6, 10, 5);
    ctx.fillStyle = '#f1c40f'; // Golden star top
    ctx.fillRect(towerX + 9, towerY - 8, 2, 2);

    // Golden spotlight illuminating Turtle Tower at night
    if (isNight) {
      const spotGlow = ctx.createRadialGradient(towerX + 10, towerY + 4, 3, towerX + 10, towerY + 4, 28);
      spotGlow.addColorStop(0, 'rgba(255, 234, 167, 0.45)');
      spotGlow.addColorStop(0.6, 'rgba(243, 156, 18, 0.15)');
      spotGlow.addColorStop(1, 'rgba(0, 0, 0, 0)');
      ctx.fillStyle = spotGlow;
      ctx.beginPath();
      ctx.arc(towerX + 10, towerY + 4, 28, 0, Math.PI * 2);
      ctx.fill();
    }

    // CẦU THÊ HÚC SON ĐỎ (VERMILION RED THÊ HÚC BRIDGE & NGỌC SƠN TEMPLE)
    // Red curved arched bridge
    const brX = 72;
    const brY = 56;
    ctx.strokeStyle = '#c0392b'; // Son đỏ
    ctx.lineWidth = 3.5;
    ctx.beginPath();
    ctx.moveTo(brX, brY + 10);
    ctx.quadraticCurveTo(brX + 16, brY - 4, brX + 32, brY + 8);
    ctx.stroke();
    // Bridge vermilion highlight rail
    ctx.strokeStyle = '#e74c3c';
    ctx.lineWidth = 1.2;
    ctx.beginPath();
    ctx.moveTo(brX, brY + 8);
    ctx.quadraticCurveTo(brX + 16, brY - 6, brX + 32, brY + 6);
    ctx.stroke();
    // Wooden piers in water
    ctx.fillStyle = '#78281f';
    ctx.fillRect(brX + 6, brY + 6, 2, 8);
    ctx.fillRect(brX + 16, brY + 2, 2, 12);
    ctx.fillRect(brX + 26, brY + 5, 2, 9);
    // Ancient Banyan tree (Cây đa Đền Ngọc Sơn)
    ctx.fillStyle = isNight ? '#12251a' : '#1e5f38';
    ctx.beginPath();
    ctx.arc(brX + 34, brY - 2, 12, 0, Math.PI * 2);
    ctx.arc(brX + 40, brY + 4, 10, 0, Math.PI * 2);
    ctx.fill();

    // WEEPING WILLOWS (CÀNH LIỄU RỦ THƯỚT THA CHẤM MẶT NƯỚC Ở GÓC PHẢI HỒ)
    const willowX = 106;
    const willowY = 48;
    ctx.strokeStyle = isNight ? '#13281c' : '#27ae60';
    ctx.lineWidth = 1.2;
    for (let wi = 0; wi < 5; wi++) {
      const wSway = Math.sin(this.tick * 0.04 + wi) * 3;
      ctx.beginPath();
      ctx.moveTo(willowX - wi * 3, willowY);
      ctx.quadraticCurveTo(willowX - wi * 4 + wSway, willowY + 20, willowX - wi * 3 + wSway * 1.5, willowY + 36);
      ctx.stroke();
      // Willow leaves
      ctx.fillStyle = isNight ? '#1b4332' : '#2ecc71';
      for (let ly = willowY + 6; ly < willowY + 35; ly += 7) {
        ctx.fillRect(willowX - wi * 3 + wSway * 0.8, ly, 2, 1.5);
      }
    }

    // Lakeside Balustrade & Flower Shrubs (Hàng rào hoa ven hồ & ghế đá)
    ctx.fillStyle = '#2c3e50';
    ctx.fillRect(0, 131, 110, 4);
    ctx.fillStyle = '#ff7675';
    for (let fx = 5; fx < 105; fx += 16) {
      ctx.fillRect(fx, 127, 4, 4);
    }
    // Park Bench with couple looking at the lake
    ctx.fillStyle = '#78350F';
    ctx.fillRect(72, 131, 16, 3);
    ctx.fillStyle = '#1E293B';
    ctx.fillRect(74, 134, 2, 4);
    ctx.fillRect(84, 134, 2, 4);
    // Couple silhouette enjoying the view
    ctx.fillStyle = '#F472B6';
    ctx.fillRect(75, 124, 4, 7); // girl
    ctx.fillStyle = '#38BDF8';
    ctx.fillRect(81, 122, 5, 9); // boy

    // CỘT ĐỒNG HỒ BƯU ĐIỆN HÀ NỘI BỐN MẶT (HANOI POST OFFICE CLOCK TOWER)
    const bdx = 14;
    const bdy = 88;
    // Clock pillar stone base
    ctx.fillStyle = isNight ? '#2c3e50' : '#7f8c8d';
    ctx.fillRect(bdx + 2, bdy + 16, 8, 27);
    ctx.fillStyle = isNight ? '#1e272e' : '#bdc3c7';
    ctx.fillRect(bdx, bdy + 41, 12, 3);
    // 4-sided clock head
    ctx.fillStyle = '#2c3e50';
    ctx.fillRect(bdx, bdy, 12, 16);
    // Clock white face
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(bdx + 2, bdy + 2, 8, 8);
    // Clock hands
    ctx.fillStyle = '#2d3436';
    ctx.fillRect(bdx + 5, bdy + 4, 1.5, 3);
    ctx.fillRect(bdx + 5, bdy + 6, 3, 1.5);
    // Post Office spire
    ctx.fillStyle = '#f1c40f';
    ctx.fillRect(bdx + 5, bdy - 4, 2, 4);

    // XE KEM QUE TRÀNG TIỀN VINTAGE (VINTAGE TRÀNG TIỀN ICE CREAM BICYCLE)
    const kemX = 42;
    const kemY = 127;
    // Bicycle wheels
    ctx.strokeStyle = '#2d3436';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.arc(kemX, kemY + 12, 4, 0, Math.PI * 2);
    ctx.arc(kemX + 18, kemY + 12, 4, 0, Math.PI * 2);
    ctx.stroke();
    // Frame
    ctx.fillStyle = '#2d3436';
    ctx.fillRect(kemX + 2, kemY + 8, 14, 1.5);
    // Iconic white styrofoam cooler box with red text (Thùng xốp trắng)
    ctx.fillStyle = '#f5f6fa';
    ctx.fillRect(kemX + 4, kemY, 14, 10);
    ctx.strokeStyle = '#bdc3c7';
    ctx.lineWidth = 0.8;
    ctx.strokeRect(kemX + 4, kemY, 14, 10);
    // Red vintage text: "TRÀNG TIỀN"
    ctx.fillStyle = '#d63031';
    ctx.fillRect(kemX + 6, kemY + 3, 10, 2);
    ctx.fillRect(kemX + 7, kemY + 6, 8, 1.5);

    // Hanging strings of Vietnamese festive lanterns across the street (ĐÈN LỒNG HỘI AN)
    const lanternColors = ['#e74c3c', '#f1c40f', '#e67e22', '#2ecc71', '#9b59b6'];
    ctx.strokeStyle = 'rgba(0,0,0,0.5)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(0, 24);
    ctx.quadraticCurveTo(this.width * 0.5, 36, this.width, 22);
    ctx.stroke();

    for (let lx = 30; lx < this.width; lx += 45) {
      const t = lx / this.width;
      const wireY = 24 + Math.sin(t * Math.PI) * 12;
      const sway = Math.sin(this.tick * 0.08 + lx) * 1.5;
      const col = lanternColors[(Math.floor(lx / 45)) % lanternColors.length];

      // Lantern cord
      ctx.fillStyle = '#222';
      ctx.fillRect(lx, wireY, 1, 5);

      // Lantern body (Hội An silk lantern)
      ctx.fillStyle = col;
      ctx.beginPath();
      ctx.roundRect(lx - 4 + sway, wireY + 5, 9, 11, 3);
      ctx.fill();

      // Golden tassel
      ctx.fillStyle = '#f1c40f';
      ctx.fillRect(lx + sway, wireY + 16, 1, 4);

      if (isNight) {
        ctx.fillStyle = 'rgba(255, 234, 167, 0.15)';
        ctx.beginPath();
        ctx.arc(lx + sway, wireY + 10, 8, 0, Math.PI * 2);
        ctx.fill();
      }
    }

    // 4. THE HEEHEE FLAGSHIP STORE (2-STORY MODERN BOUTIQUE)
    const bldgX = 110;
    const bldgY = 18;
    const bldgW = Math.max(310, this.width - 110);
    const bldgH = 127;

    // Building primary facade - Warm cream marble & Rose gold trims
    const facadeColor = isNight ? '#1e1622' : '#fcf5ed';
    const trimGold = '#f4c430';
    const darkWood = '#3d1f14';

    ctx.fillStyle = facadeColor;
    ctx.fillRect(bldgX, bldgY, bldgW, bldgH);

    // Cornice / Crown moulding top edge
    ctx.fillStyle = trimGold;
    ctx.fillRect(bldgX - 4, bldgY - 3, bldgW + 8, 4);
    ctx.fillStyle = isNight ? '#2a1a2f' : '#e0d2c3';
    ctx.fillRect(bldgX - 2, bldgY + 1, bldgW + 4, 3);

    // --- TẦNG 2 (BAN CÔNG NGẮM PHỐ & DINE-IN SYSTEM) ---
    const fl2Y = bldgY + 4;
    const fl2H = 55;

    // French arched windows with warm indoor glow & Crystal Chandelier
    const winWidth = 32;
    const winHeight = 36;
    const winGap = 16;
    for (let wx = bldgX + 16; wx < bldgX + bldgW - 40; wx += (winWidth + winGap)) {
      // Interior warm light
      const winGrad = ctx.createLinearGradient(wx, fl2Y + 8, wx, fl2Y + 8 + winHeight);
      winGrad.addColorStop(0, '#ffeaa7');
      winGrad.addColorStop(1, '#fab1a0');
      ctx.fillStyle = isNight ? winGrad : '#dfe6e9';
      ctx.beginPath();
      ctx.roundRect(wx, fl2Y + 6, winWidth, winHeight, [12, 12, 0, 0]);
      ctx.fill();

      // Window arch molding
      ctx.strokeStyle = darkWood;
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.roundRect(wx, fl2Y + 6, winWidth, winHeight, [12, 12, 0, 0]);
      ctx.stroke();

      // White silk swaying curtains (Rèm lụa trắng lay động)
      const curtainSway = Math.sin(this.tick * 0.05 + wx) * 1.5;
      ctx.fillStyle = 'rgba(255, 255, 255, 0.75)';
      ctx.beginPath();
      ctx.moveTo(wx + 2, fl2Y + 8);
      ctx.lineTo(wx + 7 + curtainSway, fl2Y + 8 + winHeight);
      ctx.lineTo(wx + 2, fl2Y + 8 + winHeight);
      ctx.fill();

      // Window panes grid
      ctx.fillStyle = darkWood;
      ctx.fillRect(wx + winWidth * 0.5 - 1, fl2Y + 6, 2, winHeight);
      ctx.fillRect(wx, fl2Y + 22, winWidth, 1.5);
    }

    // Crystal Chandelier in first arched window (Đèn chùm pha lê châu Âu)
    const chX = bldgX + 32;
    const chY = fl2Y + 14;
    ctx.fillStyle = '#FACC15';
    ctx.fillRect(chX, chY - 4, 1, 4); // chain
    ctx.fillRect(chX - 4, chY, 9, 2); // gold tier 1
    ctx.fillRect(chX - 2, chY + 3, 5, 1.5); // gold tier 2
    ctx.fillStyle = '#FFFFFF';
    for (let ci = -4; ci <= 4; ci += 2) {
      ctx.fillRect(chX + ci, chY + 2, 1, 2); // crystal drops
    }
    ctx.fillStyle = 'rgba(254, 240, 138, 0.4)';
    ctx.beginPath();
    ctx.arc(chX, chY + 2, 10, 0, Math.PI * 2);
    ctx.fill();

    // Spiral Staircase silhouette inside right window
    ctx.strokeStyle = 'rgba(61, 31, 20, 0.45)';
    ctx.lineWidth = 1;
    for (let st = 0; st < 5; st++) {
      ctx.strokeRect(bldgX + 85 + Math.sin(st * 0.8) * 3, fl2Y + 12 + st * 5, 7, 1.5);
    }

    // Floor 2 Balcony Floor Sump
    ctx.fillStyle = '#2c3e50';
    ctx.fillRect(bldgX, fl2Y + fl2H - 8, bldgW, 8);
    ctx.fillStyle = trimGold;
    ctx.fillRect(bldgX, fl2Y + fl2H - 9, bldgW, 1.5);

    // Balcony Wrought Iron Railing with Golden Lotus Emblem (Hoa sắt cánh sen vàng)
    ctx.strokeStyle = '#1e272e';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(bldgX, fl2Y + fl2H - 20);
    ctx.lineTo(bldgX + bldgW, fl2Y + fl2H - 20);
    ctx.stroke();

    for (let rx = bldgX + 6; rx < bldgX + bldgW; rx += 8) {
      ctx.fillStyle = '#1e272e';
      ctx.fillRect(rx, fl2Y + fl2H - 20, 1.5, 12);
      // Golden lotus emblem finials
      ctx.fillStyle = trimGold;
      ctx.fillRect(rx - 0.5, fl2Y + fl2H - 22, 2.5, 2.5);
    }

    // Monstera & Lotus Flower Planters on Balcony (Chậu cây Monstera & Sen Bách Diệp)
    const planterXList = [bldgX + 10, bldgX + 90, bldgX + 175, bldgX + 250];
    planterXList.forEach(px => {
      if (px < bldgX + bldgW - 20) {
        ctx.fillStyle = '#636e72';
        ctx.fillRect(px, fl2Y + fl2H - 16, 22, 8);
        ctx.fillStyle = trimGold;
        ctx.fillRect(px + 1, fl2Y + fl2H - 17, 20, 1.5);

        // Monstera split-leaves (Xanh mướt)
        ctx.fillStyle = '#10ac84';
        ctx.beginPath();
        ctx.ellipse(px + 5, fl2Y + fl2H - 20, 5, 4, -0.3, 0, Math.PI * 2);
        ctx.ellipse(px + 17, fl2Y + fl2H - 19, 5.5, 4, 0.3, 0, Math.PI * 2);
        ctx.fill();

        // Lotus Blossom
        ctx.fillStyle = '#ff7675';
        ctx.beginPath();
        ctx.arc(px + 11, fl2Y + fl2H - 22, 3.5, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = '#fd79a8';
        ctx.fillRect(px + 10, fl2Y + fl2H - 24, 2, 3);
      }
    });

    // Dine-In Walnut Wood Tables on Balcony (Bàn gỗ óc chó)
    const tableX = bldgX + 50;
    if (tableX + 25 < bldgX + bldgW) {
      ctx.fillStyle = '#fab1a0';
      ctx.beginPath();
      ctx.moveTo(tableX + 12, fl2Y + 12);
      ctx.lineTo(tableX + 2, fl2Y + 22);
      ctx.lineTo(tableX + 22, fl2Y + 22);
      ctx.fill();
      ctx.fillStyle = '#e17055';
      ctx.fillRect(tableX + 11, fl2Y + 22, 2, 14);

      // Walnut Table (#3D1F14)
      ctx.fillStyle = '#3d1f14';
      ctx.fillRect(tableX + 5, fl2Y + 34, 14, 2.5);
      ctx.fillRect(tableX + 11, fl2Y + 36.5, 2, 7);

      // Mini Boba Cup
      ctx.fillStyle = '#f4c430';
      ctx.fillRect(tableX + 10, fl2Y + 30.5, 4, 4);
      ctx.fillStyle = '#e74c3c';
      ctx.fillRect(tableX + 11.5, fl2Y + 28, 1, 3);
    }

    // --- TẦNG 1: QUẦY BAR FLAGSHIP & KÍNH TRÀN VIỀN ---
    const fl1Y = fl2Y + fl2H;
    const fl1H = bldgH - fl2H;

    // Grand Entrance Awning
    const awningY = fl1Y - 4;
    const awningH = 14;
    const stripeW = 10;
    for (let ax = bldgX; ax < bldgX + bldgW; ax += stripeW) {
      const isGoldStripe = (Math.floor((ax - bldgX) / stripeW) % 2 === 0);
      ctx.fillStyle = isGoldStripe ? '#f4c430' : '#2d1d28';
      ctx.beginPath();
      ctx.moveTo(ax, awningY);
      ctx.lineTo(ax + stripeW, awningY);
      ctx.lineTo(ax + stripeW - 2, awningY + awningH);
      ctx.lineTo(ax - 2, awningY + awningH);
      ctx.fill();

      ctx.fillStyle = isGoldStripe ? '#e67e22' : '#1e0c18';
      ctx.beginPath();
      ctx.arc(ax + stripeW * 0.5 - 2, awningY + awningH, 3, 0, Math.PI);
      ctx.fill();
    }

    // Glowing 3D Neon Signboard: "★ HEEHEE BOBA TEA - FLAGSHIP HANOI ★"
    const signBoxX = bldgX + 25;
    const signBoxY = fl1Y + 12;
    const signBoxW = Math.min(260, bldgW - 50);
    const signBoxH = 18;

    ctx.fillStyle = '#1e0c18';
    ctx.beginPath();
    ctx.roundRect(signBoxX, signBoxY, signBoxW, signBoxH, 4);
    ctx.fill();

    const neonPulse = (Math.sin(this.tick * 0.1) + 1) * 0.2 + 0.8;
    ctx.strokeStyle = `rgba(244, 196, 48, ${neonPulse})`;
    ctx.lineWidth = 1.8;
    ctx.stroke();

    ctx.save();
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.font = 'bold 8px sans-serif';
    ctx.shadowColor = 'rgba(244, 196, 48, 0.8)';
    ctx.shadowBlur = 6 * neonPulse;
    ctx.fillStyle = '#f4c430';
    ctx.fillText('★ HEEHEE BOBA TEA - FLAGSHIP HANOI ★', signBoxX + signBoxW * 0.5, signBoxY + signBoxH * 0.5 + 0.5);
    ctx.restore();

    // Floor-to-ceiling boutique glass windows with luxury interior visible inside
    const glassY = signBoxY + signBoxH + 4;
    const glassH = 145 - glassY;
    if (glassH > 0) {
      const glassGrad = ctx.createLinearGradient(bldgX, glassY, bldgX, glassY + glassH);
      glassGrad.addColorStop(0, isNight ? 'rgba(255, 234, 167, 0.3)' : 'rgba(255, 255, 255, 0.45)');
      glassGrad.addColorStop(1, isNight ? 'rgba(243, 156, 18, 0.18)' : 'rgba(223, 230, 233, 0.35)');
      ctx.fillStyle = glassGrad;
      ctx.fillRect(bldgX + 15, glassY, bldgW - 30, glassH);

      // Carrara White Marble Bar Counter (#ECF0F1 with grey smoke veins)
      const barX = bldgX + 30;
      const barY = glassY + 12;
      const barW = 120;
      const barH = glassH - 12;
      ctx.fillStyle = '#ecf0f1';
      ctx.fillRect(barX, barY, barW, barH);
      ctx.fillStyle = '#bdc3c7'; // Grey smoke veins
      ctx.fillRect(barX + 15, barY + 3, 22, 1.2);
      ctx.fillRect(barX + 65, barY + 6, 28, 1.2);

      // Rose Gold Espresso Machines & Vacuum Tea Brewers (#B76E79 / #E0A899)
      ctx.fillStyle = '#b76e79';
      ctx.fillRect(barX + 20, barY - 10, 16, 10);
      ctx.fillStyle = '#e0a899';
      ctx.fillRect(barX + 22, barY - 12, 12, 3);
      ctx.fillRect(barX + 48, barY - 14, 10, 14); // Vacuum tea siphon
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(barX + 50, barY - 12, 6, 6);

      // Hermes Orange Leather Bar Stools (#E67E22)
      for (let si = 0; si < 3; si++) {
        const sx = barX + 18 + si * 36;
        const sy = barY + 6;
        ctx.fillStyle = '#e67e22'; // Hermes orange leather seat
        ctx.fillRect(sx, sy, 8, 4);
        ctx.fillStyle = '#f4c430'; // Gold legs
        ctx.fillRect(sx + 1, sy + 4, 1.5, barH - 4);
        ctx.fillRect(sx + 5.5, sy + 4, 1.5, barH - 4);
      }

      // Gold framed pillars
      ctx.fillStyle = trimGold;
      ctx.fillRect(bldgX + 12, glassY, 3, glassH);
      ctx.fillRect(bldgX + bldgW - 15, glassY, 3, glassH);
    }

    // 5. PEDESTRIAN PROMENADE GROUND (Quảng Trường Đi Bộ & Đá Lát Hoa Cương)
    const roadY = 145;
    const roadH = this.height - roadY;

    // Kerbstone with polished granite finish
    ctx.fillStyle = isNight ? '#1e272e' : '#7f8c8d';
    ctx.fillRect(0, roadY, this.width, 3);
    ctx.fillStyle = trimGold;
    ctx.fillRect(0, roadY + 2.5, this.width, 1);

    // Promenade Paving with clean diamond pavers
    const paveColor1 = isNight ? '#191d24' : '#bdc3c7';
    const paveColor2 = isNight ? '#13161c' : '#a4b0be';
    ctx.fillStyle = paveColor1;
    ctx.fillRect(0, roadY + 3.5, this.width, roadH);

    // Diagonal paver grout lines
    ctx.strokeStyle = paveColor2;
    ctx.lineWidth = 1;
    for (let px = -roadH; px < this.width + roadH; px += 18) {
      ctx.beginPath();
      ctx.moveTo(px, roadY + 3.5);
      ctx.lineTo(px + roadH, this.height);
      ctx.stroke();

      ctx.beginPath();
      ctx.moveTo(px + roadH, roadY + 3.5);
      ctx.lineTo(px, this.height);
      ctx.stroke();
    }

    // Cast-iron Antique Parisian Lamp Post (Đèn Phố Cổ Cột Gang)
    const lampX = 95;
    ctx.fillStyle = '#2d3436';
    ctx.fillRect(lampX - 1.5, 95, 3, 50); // Post
    ctx.fillRect(lampX - 5, 142, 10, 3);  // Base

    // Lamp head & arm
    ctx.fillRect(lampX - 8, 92, 16, 3);
    ctx.fillRect(lampX - 5, 82, 10, 10);

    // Glowing Lantern Light
    ctx.fillStyle = isNight ? '#ffeaa7' : '#ffffff';
    ctx.fillRect(lampX - 4, 83, 8, 8);

    if (isNight) {
      const lampGlow = ctx.createRadialGradient(lampX, 87, 2, lampX, 87, 26);
      lampGlow.addColorStop(0, 'rgba(255, 234, 167, 0.55)');
      lampGlow.addColorStop(0.5, 'rgba(243, 156, 18, 0.2)');
      lampGlow.addColorStop(1, 'rgba(0,0,0,0)');
      ctx.fillStyle = lampGlow;
      ctx.beginPath();
      ctx.arc(lampX, 87, 26, 0, Math.PI * 2);
      ctx.fill();
    }

    // Wet Road Men Pavement Reflective Sheen during rain
    if (isRain || isStorm) {
      ctx.fillStyle = 'rgba(223, 249, 251, 0.18)';
      ctx.fillRect(0, roadY, this.width, roadH);
    }

    // Summer night fireflies around promenade planters & lake
    this.drawFireflies(ctx);
  }
};
