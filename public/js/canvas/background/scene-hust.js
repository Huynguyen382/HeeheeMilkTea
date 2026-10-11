// Chapter 2: Cổng Parabol Đại Học Bách Khoa Hà Nội (HUST Scene)
import { staticBgCache } from './cache.js';

export const hustMethods = {
  drawHUSTParabolBackground(ctx, tod) {
    // 1. SKY GRADIENT THEO THỜI TIẾT
    const skyGrad = ctx.createLinearGradient(0, 0, 0, 145);
    const isStorm = this.weather && this.weather.id === 'stormy';
    const isRain = this.weather && this.weather.id === 'rainy';
    const isCloudy = this.weather && this.weather.id === 'cloudy';
    const isWindy = this.weather && this.weather.id === 'windy';

    if (isStorm) {
      skyGrad.addColorStop(0, '#0a0b12');
      skyGrad.addColorStop(0.45, '#1e1c30');
      skyGrad.addColorStop(0.85, '#2b2442');
      skyGrad.addColorStop(1, '#1b1b2f');
    } else if (isRain) {
      skyGrad.addColorStop(0, '#2f3542');
      skyGrad.addColorStop(0.5, '#57606f');
      skyGrad.addColorStop(1, '#a4b0be');
    } else if (isCloudy) {
      skyGrad.addColorStop(0, '#4b6584');
      skyGrad.addColorStop(0.45, '#778ca3');
      skyGrad.addColorStop(0.8, '#a4b0be');
      skyGrad.addColorStop(1, '#dfe6e9');
    } else if (isWindy) {
      skyGrad.addColorStop(0, '#1B9CFC');
      skyGrad.addColorStop(0.45, '#55E6C1');
      skyGrad.addColorStop(0.8, '#81ecec');
      skyGrad.addColorStop(1, '#ffeaa7');
    } else if (tod === 'morning') {
      skyGrad.addColorStop(0, '#2980b9');
      skyGrad.addColorStop(0.4, '#6dd5fa');
      skyGrad.addColorStop(0.75, '#fbc531');
      skyGrad.addColorStop(1, '#ffeaa7');
    } else if (tod === 'noon') {
      skyGrad.addColorStop(0, '#0984e3');
      skyGrad.addColorStop(0.5, '#74b9ff');
      skyGrad.addColorStop(0.85, '#81ecec');
      skyGrad.addColorStop(1, '#dfe6e9');
    } else if (tod === 'afternoon') {
      skyGrad.addColorStop(0, '#2c3e50');
      skyGrad.addColorStop(0.35, '#8e44ad');
      skyGrad.addColorStop(0.7, '#d35400');
      skyGrad.addColorStop(0.9, '#e67e22');
      skyGrad.addColorStop(1, '#f1c40f');
    } else {
      skyGrad.addColorStop(0, '#0b0c10');
      skyGrad.addColorStop(0.45, '#1f2833');
      skyGrad.addColorStop(0.85, '#2c3e50');
      skyGrad.addColorStop(1, '#1b1b2f');
    }
    ctx.fillStyle = skyGrad;
    ctx.fillRect(0, 0, this.width, 145);

    // 2. CELESTIAL BODIES (SUN / MOON & STARS)
    if (tod === 'night') {
      // Warm crescent moon
      ctx.fillStyle = 'rgba(255, 234, 167, 0.2)';
      ctx.beginPath();
      ctx.arc(42, 26, 16, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#fff4cc';
      ctx.beginPath();
      ctx.arc(42, 26, 10, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#1f2833';
      ctx.beginPath();
      ctx.arc(38, 24, 8, 0, Math.PI * 2);
      ctx.fill();

      // Twinkling stars
      const stars = [
        { x: 18, y: 15 }, { x: 75, y: 22 }, { x: 120, y: 12 },
        { x: 185, y: 20 }, { x: 245, y: 14 }, { x: 315, y: 24 },
        { x: 345, y: 38 }, { x: 155, y: 32 }
      ];
      ctx.fillStyle = '#ffffff';
      stars.forEach((s, idx) => {
        const flicker = (Math.sin(this.tick * 0.1 + idx) + 1) * 0.4 + 0.3;
        ctx.globalAlpha = flicker;
        ctx.fillRect(s.x, s.y, 2, 2);
      });
      ctx.globalAlpha = 1.0;
    } else if (!isStorm && !isRain) {
      if (isCloudy) {
        // Soft pale diffused sun disc behind clouds
        const sx = tod === 'morning' ? 50 : (tod === 'noon' ? 180 : 60);
        const sy = tod === 'morning' ? 32 : (tod === 'noon' ? 20 : 48);
        ctx.fillStyle = 'rgba(255, 255, 255, 0.25)';
        ctx.beginPath();
        ctx.arc(sx, sy, 18, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = 'rgba(255, 255, 255, 0.45)';
        ctx.beginPath();
        ctx.arc(sx, sy, 8, 0, Math.PI * 2);
        ctx.fill();
      } else {
        // Sun according to time of day
        const sx = tod === 'morning' ? 50 : (tod === 'noon' ? 180 : 60);
        const sy = tod === 'morning' ? 32 : (tod === 'noon' ? 20 : 48);
        const sunHalo = ctx.createRadialGradient(sx, sy, 4, sx, sy, 32);
        sunHalo.addColorStop(0, tod === 'afternoon' ? 'rgba(235, 94, 40, 0.7)' : 'rgba(255, 255, 255, 0.8)');
        sunHalo.addColorStop(0.5, tod === 'afternoon' ? 'rgba(243, 156, 18, 0.3)' : 'rgba(255, 234, 167, 0.3)');
        sunHalo.addColorStop(1, 'rgba(0,0,0,0)');
        ctx.fillStyle = sunHalo;
        ctx.beginPath();
        ctx.arc(sx, sy, 32, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = tod === 'afternoon' ? '#e74c3c' : '#ffffff';
        ctx.beginPath();
        ctx.arc(sx, sy, 10, 0, Math.PI * 2);
        ctx.fill();
      }
    }

    // Clouds
    this.drawClouds(ctx, tod);

    // Volumetric God Rays across Parabol Gate
    if ((tod === 'morning' || tod === 'afternoon') && (!isStorm && !isRain && !isCloudy)) {
      this.drawGodRays(ctx, tod);
    }

    // Birds flying over HUST in morning/noon (chỉ bay khi trời quang)
    if ((tod === 'morning' || tod === 'noon') && (!isStorm && !isRain)) {
      const bx = (this.tick * 0.5) % (this.width + 80) - 40;
      ctx.strokeStyle = '#2d3436';
      ctx.lineWidth = 1;
      [0, 18, 36].forEach((offset, idx) => {
        const wingY = Math.sin(this.tick * 0.15 + idx) * 2;
        ctx.beginPath();
        ctx.moveTo(bx + offset - 4, 30 + wingY);
        ctx.quadraticCurveTo(bx + offset - 2, 27 + wingY, bx + offset, 29 + wingY);
        ctx.quadraticCurveTo(bx + offset + 2, 27 + wingY, bx + offset + 4, 30 + wingY);
        ctx.stroke();
      });
    }

    // 3. CAMPUS TREES BEHIND PARABOL GATE (CÂY XÀ CỪ & PHƯỢNG VĨ BÁCH KHOA)
    const treeShade = (tod === 'night') ? '#11221b' : (tod === 'afternoon' ? '#203a27' : '#1b4332');
    const treeMid   = (tod === 'night') ? '#1b382b' : (tod === 'afternoon' ? '#2d6a4f' : '#2d6a4f');
    const treeLight = (tod === 'night') ? '#264a39' : (tod === 'afternoon' ? '#40916c' : '#52b788');

    // Massive lush tree canopies flanking and rising behind the arch (Extended to 720px)
    const treeClusters = [
      { x: 25,  y: 55, r: 42 },
      { x: 55,  y: 42, r: 38 },
      { x: 95,  y: 48, r: 32 },
      { x: 265, y: 52, r: 35 },
      { x: 305, y: 44, r: 40 },
      { x: 335, y: 56, r: 44 },
      { x: 385, y: 50, r: 36 },
      { x: 455, y: 42, r: 40 },
      { x: 515, y: 52, r: 35 },
      { x: 595, y: 44, r: 38 },
      { x: 670, y: 54, r: 44 }
    ];

    treeClusters.forEach(tc => {
      // Dark canopy base
      ctx.fillStyle = treeShade;
      ctx.beginPath();
      ctx.arc(tc.x, tc.y + 4, tc.r, 0, Math.PI * 2);
      ctx.fill();
      // Mid canopy
      ctx.fillStyle = treeMid;
      ctx.beginPath();
      ctx.arc(tc.x, tc.y, tc.r - 4, 0, Math.PI * 2);
      ctx.fill();
      // Highlight foliage clusters
      ctx.fillStyle = treeLight;
      ctx.beginPath();
      ctx.arc(tc.x - 6, tc.y - 8, tc.r * 0.55, 0, Math.PI * 2);
      ctx.arc(tc.x + 8, tc.y - 6, tc.r * 0.45, 0, Math.PI * 2);
      ctx.fill();

      // Red flamboyant flowers (Hoa phượng vĩ đỏ mùa thi)
      if (tod !== 'night') {
        ctx.fillStyle = '#e74c3c';
        for (let fi = 0; fi < 5; fi++) {
          const fx = tc.x + Math.sin(fi * 2.3) * (tc.r * 0.6);
          const fy = tc.y + Math.cos(fi * 1.8) * (tc.r * 0.5) - 6;
          ctx.fillRect(fx, fy, 2, 2);
        }
      }
    });

    // Old Khaya Senegalensis (Cây xà cừ cổ thụ) Trunks with 1.5m White Lime Band (Vôi trắng quét gốc cây)
    const trunks = [
      { x: 38, y: 80, w: 8, h: 55 },
      { x: 318, y: 78, w: 9, h: 57 },
      { x: 455, y: 80, w: 8, h: 55 },
      { x: 665, y: 78, w: 9, h: 57 }
    ];
    trunks.forEach(tr => {
      // Bark
      ctx.fillStyle = (tod === 'night') ? '#0d130f' : '#3d271d';
      ctx.fillRect(tr.x, tr.y, tr.w, tr.h);
      // 1.5m White lime band protecting tree base from insects
      ctx.fillStyle = (tod === 'night') ? '#a4b0be' : '#f5f6fa';
      ctx.fillRect(tr.x - 0.5, tr.y + tr.h - 18, tr.w + 1, 16);
      ctx.fillStyle = 'rgba(0, 0, 0, 0.15)';
      ctx.fillRect(tr.x - 0.5, tr.y + tr.h - 18, tr.w + 1, 1.5);
    });

    // 4. SOVIET 1960s RED BRICK LECTURE HALLS D3 - D5 (GIẢNG ĐƯỜNG D3/D5 GẠCH ĐỎ XÔ VIẾT & LAM CHẮN NẮNG)
    const dBrick = (tod === 'night') ? '#4a1e1e' : '#a93226';
    const dShade = (tod === 'night') ? '#2e1212' : '#7b241c';
    const dLouver = (tod === 'night') ? '#57606f' : '#bdc3c7';

    // D3 Lecture Hall block (x: 115-167)
    ctx.fillStyle = dBrick;
    ctx.fillRect(115, 68, 52, 60);
    ctx.fillStyle = dShade;
    ctx.fillRect(115, 68, 2, 60);

    // D5 Lecture Hall block (x: 195-253)
    ctx.fillStyle = dBrick;
    ctx.fillRect(195, 62, 58, 66);
    ctx.fillStyle = dShade;
    ctx.fillRect(195, 62, 2, 66);

    // Diagonal sun-shade louvers (Hệ lam chắn nắng bê tông sọc xiên Xô Viết)
    ctx.strokeStyle = dLouver;
    ctx.lineWidth = 1.2;
    for (let lx = 120; lx < 162; lx += 6) {
      ctx.beginPath();
      ctx.moveTo(lx, 74);
      ctx.lineTo(lx + 4, 86);
      ctx.stroke();
    }
    for (let lx = 200; lx < 248; lx += 6) {
      ctx.beginPath();
      ctx.moveTo(lx, 70);
      ctx.lineTo(lx + 4, 84);
      ctx.stroke();
    }

    // Cool Fluorescent Lab Windows (Cửa sổ phòng thí nghiệm phát sáng trắng xanh mát mắt)
    const labWindowColor = (tod === 'night') ? '#81ecec' : '#dfe6e9';
    ctx.fillStyle = labWindowColor;
    for (let wy = 90; wy < 122; wy += 8) {
      ctx.fillRect(120, wy, 7, 4);
      ctx.fillRect(132, wy, 7, 4);
      ctx.fillRect(144, wy, 7, 4);
      ctx.fillRect(202, wy, 7, 4);
      ctx.fillRect(216, wy, 7, 4);
      ctx.fillRect(230, wy, 7, 4);
    }

    // Ta Quang Buu Modern Steel & Glass Library
    ctx.fillStyle = (tod === 'night') ? '#1a252f' : '#34495e';
    ctx.fillRect(355, 52, 85, 76);
    ctx.fillStyle = (tod === 'night') ? '#f39c12' : '#74b9ff';
    for (let wy = 58; wy < 120; wy += 9) {
      for (let wx = 360; wx < 435; wx += 15) {
        ctx.fillRect(wx, wy, 10, 5);
      }
    }

    // Iconic C1 Building with Clock Tower
    const bldBg = (tod === 'night') ? '#131b24' : (tod === 'afternoon' ? '#3d3448' : '#7f8c8d');
    ctx.fillStyle = bldBg;
    ctx.fillRect(525, 58, 95, 70);
    ctx.fillRect(560, 42, 25, 18); // Clock tower top
    // Tower clock
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.arc(572, 51, 6, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#2d3436';
    ctx.fillRect(571, 48, 2, 4); // clock hands
    ctx.fillRect(571, 51, 3, 1.5);

    // C1 windows
    ctx.fillStyle = (tod === 'night') ? '#f39c12' : '#dfe6e9';
    for (let wy = 68; wy < 120; wy += 10) {
      ctx.fillRect(535, wy, 8, 4);
      ctx.fillRect(548, wy, 8, 4);
      ctx.fillRect(595, wy, 8, 4);
      ctx.fillRect(608, wy, 8, 4);
    }

    // 5. THE ICONIC HUST PARABOL ARCH (CỔNG PARABOL HUYỀN THOẠI)
    // Parabola equation: y = 16 + 0.0108 * (x - 180)^2 from x=74 to x=286 (vertex at x=180, y=16)
    const archWhite = (tod === 'night') ? '#dcdde1' : '#ffffff';
    const archShadow = (tod === 'night') ? '#718093' : '#b2bec3';
    const steelRib = (tod === 'night') ? '#2f3640' : '#485460';

    // Horizontal concrete roof beam/slab spanning across
    ctx.fillStyle = archShadow;
    ctx.fillRect(10, 88, 340, 8);
    ctx.fillStyle = archWhite;
    ctx.fillRect(10, 86, 340, 3);

    // Parabol Internal Lattice Tension Steel Ribs
    ctx.strokeStyle = steelRib;
    ctx.lineWidth = 1;
    for (let rx = 96; rx <= 264; rx += 14) {
      const py = 16 + 0.0108 * Math.pow(rx - 180, 2);
      ctx.beginPath();
      ctx.moveTo(rx, py);
      ctx.lineTo(rx, 88);
      ctx.stroke();

      // Diagonal criss-cross tension web
      ctx.beginPath();
      ctx.moveTo(rx, py);
      ctx.lineTo(rx + 14, 88);
      ctx.stroke();
    }

    // Main Parabolic Concrete Arch Rib
    // Draw outer arch
    ctx.strokeStyle = archShadow;
    ctx.lineWidth = 6;
    ctx.beginPath();
    for (let px = 72; px <= 288; px += 2) {
      const py = 16 + 0.0108 * Math.pow(px - 180, 2);
      if (px === 72) ctx.moveTo(px, py);
      else ctx.lineTo(px, py);
    }
    ctx.stroke();

    // Inner bright white arch
    ctx.strokeStyle = archWhite;
    ctx.lineWidth = 4;
    ctx.beginPath();
    for (let px = 74; px <= 286; px += 2) {
      const py = 16 + 0.0108 * Math.pow(px - 180, 2);
      if (px === 74) ctx.moveTo(px, py);
      else ctx.lineTo(px, py);
    }
    ctx.stroke();

    // Concrete base pillars with Speckled Granite Stone cladding (Móng ốp đá hoa cương granite xám tro chấm bi)
    ctx.fillStyle = archShadow;
    ctx.fillRect(70, 94, 12, 38);
    ctx.fillRect(278, 94, 12, 38);
    ctx.fillStyle = archWhite;
    ctx.fillRect(70, 94, 4, 38);
    ctx.fillRect(278, 94, 4, 38);
    // Granite stone black/white speckles
    ctx.fillStyle = '#2c3e50';
    [72, 75, 78, 280, 283, 286].forEach(gx => {
      for (let gy = 98; gy < 130; gy += 6) {
        ctx.fillRect(gx, gy, 1.2, 1.2);
      }
    });

    // HUST EMBLEM / SEAL: COMPAS & BÁNH RĂNG MẠ ĐỒNG TẠI ĐỈNH VÒM
    ctx.fillStyle = '#b71540'; // HUST crimson base
    ctx.beginPath();
    ctx.arc(180, 34, 12, 0, Math.PI * 2);
    ctx.fill();
    // Bronze gear teeth rim (Bánh răng mạ đồng #D4AF37)
    ctx.strokeStyle = '#d4af37';
    ctx.lineWidth = 1.8;
    ctx.beginPath();
    ctx.arc(180, 34, 10, 0, Math.PI * 2);
    ctx.stroke();
    // Gear cogs
    ctx.fillStyle = '#d4af37';
    ctx.fillRect(179, 23, 2, 4);
    ctx.fillRect(179, 41, 2, 4);
    ctx.fillRect(169, 33, 4, 2);
    ctx.fillRect(187, 33, 4, 2);
    ctx.fillRect(172, 26, 3, 3);
    ctx.fillRect(185, 39, 3, 3);
    // Bronze technical compass (Compa kỹ thuật mạ đồng óng ánh)
    ctx.strokeStyle = '#f1c40f';
    ctx.lineWidth = 1.2;
    ctx.beginPath();
    ctx.moveTo(176, 41);
    ctx.lineTo(180, 28);
    ctx.lineTo(184, 41);
    ctx.stroke();
    ctx.fillRect(178.5, 33, 3, 1.2); // Compass hinge crossbar

    // BANNER / SIGNBOARD: "ĐẠI HỌC BÁCH KHOA HÀ NỘI"
    ctx.fillStyle = '#b71540';
    ctx.fillRect(105, 87, 150, 11);
    ctx.strokeStyle = '#f1c40f';
    ctx.lineWidth = 1;
    ctx.strokeRect(105, 87, 150, 11);

    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 7.5px monospace';
    ctx.textAlign = 'center';
    ctx.fillText('ĐẠI HỌC BÁCH KHOA HÀ NỘI', 180, 95.5);
    ctx.textAlign = 'left';

    // 6. ACCORDION STAINLESS STEEL RETRACTABLE GATE (CỔNG XẾP INOX TỰ ĐỘNG)
    // Driveway road into campus
    ctx.fillStyle = (tod === 'night') ? '#1e272e' : '#34495e';
    ctx.fillRect(84, 126, 192, 12);

    // Retractable gate bars with metallic inox shine
    const inoxBright = '#ffffff';
    const inoxMid    = (tod === 'night') ? '#718093' : '#dcdde1';
    const inoxDark   = (tod === 'night') ? '#2f3640' : '#7f8c8d';

    for (let gx = 88; gx <= 270; gx += 7) {
      // Vertical stainless steel posts
      ctx.fillStyle = inoxDark;
      ctx.fillRect(gx, 118, 3, 16);
      ctx.fillStyle = inoxBright;
      ctx.fillRect(gx, 118, 1, 16);

      // Diamond scissor crossbars
      ctx.strokeStyle = inoxMid;
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(gx, 121);
      ctx.lineTo(gx + 7, 131);
      ctx.moveTo(gx, 131);
      ctx.lineTo(gx + 7, 121);
      ctx.stroke();

      // Red circular safety reflector badge in center of each scissor
      if (gx % 14 === 0) {
        ctx.fillStyle = '#e74c3c';
        ctx.fillRect(gx + 3, 125, 2, 2);
      }
    }

    // 7. SECURITY BOOTH & AUTOMATED BARRIER (BỐT BẢO VỆ CỔNG BÁCH KHOA)
    ctx.fillStyle = (tod === 'night') ? '#1e272e' : '#ecf0f1';
    ctx.fillRect(292, 104, 28, 28);
    ctx.fillStyle = (tod === 'night') ? '#2c3e50' : '#bdc3c7';
    ctx.fillRect(290, 102, 32, 4); // Roof canopy
    // Tinted glass window
    ctx.fillStyle = (tod === 'night') ? '#f39c12' : '#3498db';
    ctx.fillRect(296, 108, 20, 12);
    // Security officer inside silhouette
    ctx.fillStyle = '#2c3e50';
    ctx.fillRect(302, 112, 6, 8);

    // Boom barrier arm (thanh barie kẻ vằn vàng đỏ)
    ctx.fillStyle = '#e74c3c';
    ctx.fillRect(272, 122, 22, 3);
    ctx.fillStyle = '#f1c40f';
    for (let bx = 274; bx < 294; bx += 6) {
      ctx.fillRect(bx, 122, 3, 3);
    }

    // Hàng rào hoa sắt Bách Khoa dọc đường Giải Phóng (từ 320 đến hết khuôn viên)
    const fencePostColor = (tod === 'night') ? '#2c3e50' : '#bdc3c7';
    const fenceIronColor = (tod === 'night') ? '#1e272e' : '#2d3436';
    ctx.fillStyle = fencePostColor;
    ctx.fillRect(320, 124, this.width - 320, 3); // Gờ bê tông chân rào
    for (let fx = 324; fx < this.width - 10; fx += 24) {
      // Cột trụ đá trắng
      ctx.fillStyle = fencePostColor;
      ctx.fillRect(fx, 112, 5, 18);
      // Chấn song sắt hoa văn
      ctx.fillStyle = fenceIronColor;
      for (let rx = fx + 6; rx < fx + 24 && rx < this.width - 6; rx += 4) {
        ctx.fillRect(rx, 114, 1.5, 14);
        ctx.fillRect(rx - 0.5, 112, 2.5, 2); // Mũi giáo nhọn
      }
    }

    // 8. ĐƯỜNG GIẢI PHÓNG / ĐẠI CỒ VIỆT (ASPHALT ROADWAY)
    const roadColor = (tod === 'morning') ? '#3a3d40' : (tod === 'noon' ? '#474b4e' : (tod === 'afternoon' ? '#35333a' : '#1e2022'));
    ctx.fillStyle = roadColor;
    ctx.fillRect(0, 134, this.width, 9);

    // White dashed road lane dividers
    ctx.fillStyle = 'rgba(255, 255, 255, 0.7)';
    for (let rx = 0; rx < this.width; rx += 28) {
      ctx.fillRect(rx, 138, 14, 1.5);
    }

    // Zebra Crossing with Worn Tire Tracks (Vạch sang đường cho người đi bộ mòn vệt bánh xe)
    const zxStart = 330;
    const zxWidth = 42;
    for (let zx = zxStart; zx < zxStart + zxWidth; zx += 7) {
      ctx.fillStyle = 'rgba(255, 255, 255, 0.85)';
      ctx.fillRect(zx, 135, 4.5, 7.5);
      // Worn black tire tread track marks
      ctx.fillStyle = 'rgba(30, 32, 34, 0.35)';
      ctx.fillRect(zx + 1, 137, 2.5, 3.5);
    }

    // Dappled Sunlight dancing through xà cừ leaves on asphalt (Đốm nắng nhảy múa trên mặt đường)
    if ((tod === 'morning' || tod === 'noon') && (!isStorm && !isRain)) {
      ctx.fillStyle = 'rgba(255, 245, 180, 0.22)';
      for (let di = 0; di < 16; di++) {
        const dx = (di * 44 + Math.sin(this.tick * 0.05 + di) * 5) % this.width;
        const dy = 135 + ((di * 3) % 7);
        ctx.beginPath();
        ctx.ellipse(dx, dy, 3 + (di % 2), 1.5, 0.2, 0, Math.PI * 2);
        ctx.fill();
      }
    }

    // 8b. TRẠM XE BUÝT SINH VIÊN (BUS 08/26/31/32) & BẢNG TIN CLB
    // Bus Stop Shelter at x: 472
    const bStopX = 472;
    const bStopY = 118;
    // Blue corrugated metal roof
    ctx.fillStyle = '#0984e3';
    ctx.fillRect(bStopX - 4, bStopY, 38, 3.5);
    ctx.fillStyle = '#74b9ff';
    ctx.fillRect(bStopX - 4, bStopY, 38, 1);
    // Steel shelter posts
    ctx.fillStyle = '#636e72';
    ctx.fillRect(bStopX, bStopY + 3.5, 2, 22);
    ctx.fillRect(bStopX + 30, bStopY + 3.5, 2, 22);
    // Yellow bus route sign board: "BUS 08 • 26 • 31 • 32"
    ctx.fillStyle = '#f1c40f';
    ctx.fillRect(bStopX + 2, bStopY + 4, 28, 7);
    ctx.fillStyle = '#d63031';
    ctx.font = 'bold 5px sans-serif';
    ctx.fillText('BUS 08-26', bStopX + 4, bStopY + 9.5);

    // Student Wooden Bulletin Board with Club Posters (Bảng tin sinh viên Bách Khoa)
    const bbX = 520;
    const bbY = 122;
    ctx.fillStyle = '#795548';
    ctx.fillRect(bbX, bbY, 26, 18);
    ctx.fillStyle = '#a1887f';
    ctx.fillRect(bbX + 1.5, bbY + 1.5, 23, 15);
    // Poster 1: CLB Robotics (Blue)
    ctx.fillStyle = '#0984e3';
    ctx.fillRect(bbX + 3, bbY + 3, 9, 6);
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(bbX + 4, bbY + 4, 7, 1);
    // Poster 2: Rock SV (Black & Red)
    ctx.fillStyle = '#2d3436';
    ctx.fillRect(bbX + 14, bbY + 3, 9, 7);
    ctx.fillStyle = '#ff7675';
    ctx.fillRect(bbX + 15, bbY + 4, 7, 1.5);
    // Poster 3: Giải bóng đá BK (Green)
    ctx.fillStyle = '#27ae60';
    ctx.fillRect(bbX + 4, bbY + 10, 10, 5);

    // Parked Leaning Wave Alpha & Bicycle by the curb
    // Leaning student Wave Alpha (x: 435)
    ctx.fillStyle = '#e67e22'; // Orange wave
    ctx.fillRect(435, 137, 10, 3);
    ctx.fillStyle = '#111';
    ctx.fillRect(433, 139, 3, 3); // rear wheel
    ctx.fillRect(444, 139, 3, 3); // front wheel
    ctx.fillStyle = '#bdc3c7';
    ctx.fillRect(438, 140, 2, 3); // kickstand
    // Parked student cào cào bicycle (x: 450)
    ctx.strokeStyle = '#0984e3';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.arc(450, 140, 3, 0, Math.PI * 2);
    ctx.arc(459, 140, 3, 0, Math.PI * 2);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(450, 140);
    ctx.lineTo(454, 136);
    ctx.lineTo(459, 140);
    ctx.stroke();

    // 9. CHAPTER 2 STUDENT TRAFFIC (HONDA DREAM, WAVE, STUDENT BICYCLES)
    if (this.hustTraffic) {
      this.hustTraffic.forEach(veh => {
        const vx = veh.x;
        const vy = 135;

        if (veh.type === 'dream') {
          // Classic Honda Dream II (Maroon #800000, chrome exhaust, boxy headlight)
          ctx.fillStyle = '#111';
          ctx.fillRect(vx - 2, vy + 4, 4, 3); // Rear wheel
          ctx.fillRect(vx + 12, vy + 4, 4, 3); // Front wheel
          ctx.fillStyle = veh.color; // Maroon body
          ctx.fillRect(vx, vy + 2, 12, 3);
          ctx.fillStyle = '#dcdde1'; // Chrome exhaust & engine
          ctx.fillRect(vx - 1, vy + 5, 8, 1.5);
          ctx.fillStyle = '#f1c40f'; // Headlight
          ctx.fillRect(vx + 15, vy + 2, 2, 2);
          // Student rider
          ctx.fillStyle = veh.riderColor;
          ctx.fillRect(vx + 3, vy - 4, 5, 6); // Torso
          ctx.fillStyle = '#2c3e50';
          ctx.fillRect(vx + 4, vy - 8, 4, 4); // Helmet
        } else if (veh.type === 'wave') {
          // Honda Wave Alpha (Green/Orange, sporty headlight)
          ctx.fillStyle = '#111';
          ctx.fillRect(vx - 2, vy + 4, 4, 3);
          ctx.fillRect(vx + 11, vy + 4, 4, 3);
          ctx.fillStyle = veh.color;
          ctx.fillRect(vx, vy + 2, 11, 3);
          ctx.fillStyle = '#ffffff';
          ctx.fillRect(vx + 13, vy + 1, 2, 2);
          // Rider with backpack
          ctx.fillStyle = veh.riderColor;
          ctx.fillRect(vx + 3, vy - 4, 5, 6);
          ctx.fillStyle = '#0984e3'; // Backpack
          ctx.fillRect(vx + 1, vy - 3, 3, 5);
          ctx.fillStyle = '#d63031';
          ctx.fillRect(vx + 4, vy - 8, 4, 4);
        } else {
          // Student fixed-gear / Asama bicycle
          ctx.strokeStyle = veh.color;
          ctx.lineWidth = 1;
          ctx.beginPath();
          ctx.arc(vx, vy + 5, 3.5, 0, Math.PI * 2); // Wheels
          ctx.arc(vx + 11, vy + 5, 3.5, 0, Math.PI * 2);
          ctx.stroke();
          // Frame
          ctx.beginPath();
          ctx.moveTo(vx, vy + 5);
          ctx.lineTo(vx + 5, vy + 5);
          ctx.lineTo(vx + 8, vy);
          ctx.lineTo(vx + 11, vy + 5);
          ctx.stroke();
          // Student rider in white Bách Khoa uniform
          ctx.fillStyle = veh.riderColor;
          ctx.fillRect(vx + 3, vy - 4, 4, 6);
          ctx.fillStyle = '#ffeaa7';
          ctx.fillRect(vx + 4, vy - 7, 3, 3); // Head
        }
      });

      // Hanoi Bus Route 08 (Xe buýt Hà Nội Tuyến 08: Đỏ & Vàng chạy qua đường Giải Phóng)
      const busCycle = (this.tick * 0.75) % (this.width + 160) - 80;
      const busY = 126;
      // Bus body
      ctx.fillStyle = '#DC2626'; // Red bottom half
      ctx.fillRect(busCycle, busY + 6, 52, 6);
      ctx.fillStyle = '#FACC15'; // Yellow top half
      ctx.fillRect(busCycle, busY, 52, 6);
      // Windows & Passengers
      ctx.fillStyle = '#1E293B';
      for (let bw = 0; bw < 5; bw++) {
        ctx.fillRect(busCycle + 4 + bw * 9, busY + 2, 7, 4);
        ctx.fillStyle = '#38BDF8';
        ctx.fillRect(busCycle + 5 + bw * 9, busY + 2.5, 2, 3); // Glare
        ctx.fillStyle = '#1E293B';
      }
      // Route 08 LED badge
      ctx.fillStyle = '#FEF08A';
      ctx.fillRect(busCycle + 44, busY + 2, 5, 2);
      ctx.fillStyle = '#DC2626';
      ctx.fillRect(busCycle + 45, busY + 2.5, 3, 1);
      // Wheels
      ctx.fillStyle = '#09090B';
      ctx.fillRect(busCycle + 8, busY + 10, 7, 4);
      ctx.fillRect(busCycle + 36, busY + 10, 7, 4);
      ctx.fillStyle = '#71717A';
      ctx.fillRect(busCycle + 10, busY + 11, 3, 2);
      ctx.fillRect(busCycle + 38, busY + 11, 3, 2);
      // Headlights & Tail Lights
      ctx.fillStyle = '#FEF08A';
      ctx.fillRect(busCycle + 52, busY + 7, 2, 2);
      ctx.fillStyle = '#EF4444';
      ctx.fillRect(busCycle - 1, busY + 7, 2, 2);
    }

    // Wet Road Men Pavement Reflective Sheen during rain
    if (isRain || isStorm) {
      ctx.fillStyle = 'rgba(223, 249, 251, 0.18)';
      ctx.fillRect(0, 134, this.width, 9);
    }

    // 10. VỈA HÈ BÁCH KHOA (PAVEMENT / TERRAZZO TILES)
    let groundColor = (tod === 'morning') ? '#596275' : (tod === 'noon' ? '#636e72' : (tod === 'afternoon' ? '#4b4b5a' : '#2d3436'));
    let kerb1 = (tod === 'morning') ? '#718093' : '#b2bec3';
    let kerb2 = (tod === 'morning') ? '#2f3542' : '#57606f';

    ctx.fillStyle = groundColor;
    ctx.fillRect(0, 142, this.width, 58);

    // Granite stone kerb
    ctx.fillStyle = kerb1;
    ctx.fillRect(0, 142, this.width, 3);
    ctx.fillStyle = kerb2;
    ctx.fillRect(0, 145, this.width, 2);

    // Terrazzo red & grey paving grid pattern (Gạch vỉa hè Bách Khoa)
    ctx.strokeStyle = (tod === 'night') ? '#1e272e' : 'rgba(47, 53, 66, 0.35)';
    ctx.lineWidth = 1;
    for (let px = 0; px < this.width; px += 20) {
      ctx.beginPath();
      ctx.moveTo(px, 147);
      ctx.lineTo(px + 8, this.height);
      ctx.stroke();
    }
    for (let py = 152; py < this.height; py += 12) {
      ctx.beginPath();
      ctx.moveTo(0, py);
      ctx.lineTo(this.width, py);
      ctx.stroke();
    }

    // Fallen red flamboyant petals on the pavement
    ctx.fillStyle = '#e74c3c';
    [15, 68, 140, 210, 280, 335].forEach((lx, idx) => {
      ctx.fillRect(lx, 150 + (idx * 7) % 35, 2, 1.5);
      ctx.fillRect(lx + 4, 151 + (idx * 5) % 30, 1.5, 1.5);
    });

    // Summer night fireflies around campus greenery
    this.drawFireflies(ctx);
  }
};
