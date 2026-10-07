// Environment & Background Scene Renderer for GameCanvas

export const backgroundMethods = {
  drawClouds(ctx, tod) {
    if (tod === 'night') return; // Buổi tối dùng trăng và sao thay mây
    this.clouds.forEach(c => {
      let topColor = '#ffffff';
      let bottomColor = '#dfe6e9';
      let alpha = 0.88;

      if (tod === 'morning') {
        topColor = '#ffffff';
        bottomColor = '#ffeaa7';
        alpha = 0.82;
      } else if (tod === 'noon') {
        topColor = '#ffffff';
        bottomColor = '#c7ecee';
        alpha = 0.92;
      } else if (tod === 'afternoon') {
        topColor = '#ffeaa7';
        bottomColor = '#e17055';
        alpha = 0.85;
      }

      ctx.save();
      ctx.globalAlpha = alpha;
      // Cloud base shadow
      ctx.fillStyle = bottomColor;
      ctx.beginPath();
      ctx.roundRect(c.x, c.y + 4, c.w, c.h - 4, 6);
      ctx.fill();

      // Cloud puffs
      ctx.fillStyle = topColor;
      ctx.beginPath();
      ctx.arc(c.x + c.w * 0.32, c.y + 5, c.h * 0.45, 0, Math.PI * 2);
      ctx.arc(c.x + c.w * 0.68, c.y + 4, c.h * 0.55, 0, Math.PI * 2);
      ctx.roundRect(c.x + 2, c.y + 5, c.w - 4, c.h - 5, 5);
      ctx.fill();
      ctx.restore();
    });
  },

  drawBackground(ctx) {
    const tod = this.getTimeOfDay();
    const isHUST = (this.chapter >= 2) && (this.sceneSetting === 'hust' || !this.sceneSetting);
    if (isHUST) {
      this.drawHUSTParabolBackground(ctx, tod);
      return;
    }

    // 1. SKY GRADIENT DYNAMIC THEO GIỜ TRONG NGÀY
    const skyGrad = ctx.createLinearGradient(0, 0, 0, 145);
    if (tod === 'morning') {
      // Bình minh ban mai: Xanh lam trong trẻo chuyển vàng mơ nắng sớm
      skyGrad.addColorStop(0, '#2e6bb5');
      skyGrad.addColorStop(0.38, '#5fa7e8');
      skyGrad.addColorStop(0.72, '#f5cd79');
      skyGrad.addColorStop(1, '#ffeaa7');
    } else if (tod === 'noon') {
      // Giữa trưa: Bầu trời xanh biếc nắng chói chang
      skyGrad.addColorStop(0, '#0984e3');
      skyGrad.addColorStop(0.5, '#74b9ff');
      skyGrad.addColorStop(0.85, '#81ecec');
      skyGrad.addColorStop(1, '#dff9fb');
    } else if (tod === 'afternoon') {
      // Chiều tà hoàng hôn: Tím hồng mộng mơ chuyển cam cháy rực rỡ
      skyGrad.addColorStop(0, '#2b1055');
      skyGrad.addColorStop(0.35, '#75175a');
      skyGrad.addColorStop(0.68, '#d35400');
      skyGrad.addColorStop(0.88, '#e67e22');
      skyGrad.addColorStop(1, '#f1c40f');
    } else {
      // Đêm: Tím chàm huyền ảo, phố đêm lung linh
      skyGrad.addColorStop(0, '#0c0612');
      skyGrad.addColorStop(0.5, '#1e0c24');
      skyGrad.addColorStop(1, '#3b1638');
    }
    ctx.fillStyle = skyGrad;
    ctx.fillRect(0, 0, this.width, 145);

    // 2. MẶT TRỜI / MẶT TRĂNG & SAO
    if (tod === 'night') {
      // Trăng lưỡi liềm vàng ấm
      ctx.fillStyle = 'rgba(255, 235, 160, 0.15)';
      ctx.beginPath();
      ctx.arc(45, 28, 18, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = '#fff4cc';
      ctx.beginPath();
      ctx.arc(45, 28, 11, 0, Math.PI * 2);
      ctx.fillStyle = '#1e0c24';
      ctx.beginPath();
      ctx.arc(41, 26, 9, 0, Math.PI * 2);
      ctx.fill();

      // Sao lấp lánh ban đêm
      const stars = [
        { x: 15, y: 18 }, { x: 80, y: 24 }, { x: 125, y: 15 },
        { x: 195, y: 28 }, { x: 260, y: 14 }, { x: 310, y: 22 },
        { x: 340, y: 40 }, { x: 160, y: 45 }
      ];
      ctx.fillStyle = '#fff';
      stars.forEach((s, idx) => {
        const flicker = (Math.sin(this.tick * 0.1 + idx) + 1) * 0.4 + 0.3;
        ctx.globalAlpha = flicker;
        ctx.fillRect(s.x, s.y, 2, 2);
      });
      ctx.globalAlpha = 1.0;
    } else if (tod === 'morning') {
      // Mặt trời bình minh dịu mát bên góc trái
      const sx = 55;
      const sy = 32;
      const sunHalo = ctx.createRadialGradient(sx, sy, 3, sx, sy, 30);
      sunHalo.addColorStop(0, 'rgba(255, 245, 180, 0.6)');
      sunHalo.addColorStop(0.5, 'rgba(255, 215, 100, 0.2)');
      sunHalo.addColorStop(1, 'rgba(255, 215, 100, 0)');
      ctx.fillStyle = sunHalo;
      ctx.beginPath();
      ctx.arc(sx, sy, 30, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = '#fff6b7';
      ctx.beginPath();
      ctx.arc(sx, sy, 10, 0, Math.PI * 2);
      ctx.fill();
    } else if (tod === 'noon') {
      // Mặt trời đứng bóng rực rỡ trên đỉnh trời
      const sx = 180;
      const sy = 22;
      const sunHalo = ctx.createRadialGradient(sx, sy, 4, sx, sy, 36);
      sunHalo.addColorStop(0, 'rgba(255, 255, 255, 0.85)');
      sunHalo.addColorStop(0.4, 'rgba(255, 235, 150, 0.35)');
      sunHalo.addColorStop(1, 'rgba(255, 235, 150, 0)');
      ctx.fillStyle = sunHalo;
      ctx.beginPath();
      ctx.arc(sx, sy, 36, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = '#ffffff';
      ctx.beginPath();
      ctx.arc(sx, sy, 12, 0, Math.PI * 2);
      ctx.fill();
    } else if (tod === 'afternoon') {
      // Vầng dương hoàng hôn đỏ cam lặn dần bên các tòa nhà
      const sx = 65;
      const sy = 55;
      const sunHalo = ctx.createRadialGradient(sx, sy, 4, sx, sy, 34);
      sunHalo.addColorStop(0, 'rgba(255, 107, 107, 0.75)');
      sunHalo.addColorStop(0.5, 'rgba(254, 202, 87, 0.35)');
      sunHalo.addColorStop(1, 'rgba(254, 202, 87, 0)');
      ctx.fillStyle = sunHalo;
      ctx.beginPath();
      ctx.arc(sx, sy, 34, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = '#ff6b6b';
      ctx.beginPath();
      ctx.arc(sx, sy, 12, 0, Math.PI * 2);
      ctx.fill();
    }

    // 3. MÂY TRÔI BAN NGÀY
    this.drawClouds(ctx, tod);

    // 4. TÒA NHÀ PHÍA XA (SILHOUETTES THEO BUỔI TRẢI DÀI TOÀN BỘ CHIỀU NGANG 720PX)
    let bldColor = '#18091d';
    if (tod === 'morning') bldColor = '#2f3542';
    else if (tod === 'noon') bldColor = '#2f3640';
    else if (tod === 'afternoon') bldColor = '#2b1035';

    ctx.fillStyle = bldColor;
    ctx.fillRect(20, 50, 48, 95);
    ctx.fillRect(68, 35, 55, 110);
    ctx.fillRect(123, 60, 65, 85);
    ctx.fillRect(220, 42, 60, 103);
    ctx.fillRect(280, 55, 75, 90);
    ctx.fillRect(360, 48, 65, 97);
    ctx.fillRect(430, 35, 70, 110);
    ctx.fillRect(505, 58, 60, 87);
    ctx.fillRect(570, 42, 72, 103);
    ctx.fillRect(648, 52, 68, 93);

    // 5. BẢNG HIỆU NEON TRÊN TÒA NHÀ (SÁNG VÀO HOÀNG HÔN & TỐI)
    let neonAlpha = 1.0;
    if (tod === 'morning') neonAlpha = 0.25;
    else if (tod === 'noon') neonAlpha = 0.15;
    else if (tod === 'afternoon') neonAlpha = 0.75;
    else neonAlpha = 1.0;

    const neonCyan = ((Math.sin(this.tick * 0.1) * 0.2) + 0.8) * neonAlpha;
    ctx.fillStyle = `rgba(0, 206, 201, ${neonCyan})`;
    ctx.font = 'bold 9px monospace';
    ctx.fillText('⚡TIỆM TRÀ', 72, 50);

    const neonPink = ((Math.sin(this.tick * 0.12 + 1) * 0.2) + 0.8) * neonAlpha;
    ctx.fillStyle = `rgba(253, 121, 168, ${neonPink})`;
    ctx.fillText('🍟ĂN VẶT', 228, 56);

    const neonYellow = ((Math.sin(this.tick * 0.09 + 2) * 0.2) + 0.8) * neonAlpha;
    ctx.fillStyle = `rgba(254, 202, 87, ${neonYellow})`;
    ctx.fillText('🍰BÁNH NGỌT', 438, 52);

    const neonGreen = ((Math.sin(this.tick * 0.11 + 3) * 0.2) + 0.8) * neonAlpha;
    ctx.fillStyle = `rgba(85, 239, 196, ${neonGreen})`;
    ctx.fillText('☕CÀ PHÊ', 578, 58);

    // 6. ÁNH SÁNG CỬA SỔ TÒA NHÀ
    for (let bx = 30; bx < this.width - 20; bx += 28) {
      for (let by = 60; by < 130; by += 20) {
        if ((bx + by) % 7 === 0) {
          if (tod === 'noon') {
            ctx.fillStyle = (bx % 2 === 0) ? '#dfe6e9' : '#81ecec';
          } else if (tod === 'morning') {
            ctx.fillStyle = (bx % 2 === 0) ? '#ffeaa7' : '#74b9ff';
          } else {
            ctx.fillStyle = (bx % 2 === 0) ? '#f4c430' : '#8be9fd';
          }
          ctx.fillRect(bx, by, 6, 8);
        }
      }
    }

    // 7. MẶT ĐƯỜNG & XE MÁY LƯU THÔNG
    let roadColor = '#220f20';
    if (tod === 'morning') roadColor = '#3a3440';
    else if (tod === 'noon') roadColor = '#4a4250';
    else if (tod === 'afternoon') roadColor = '#321c2e';

    ctx.fillStyle = roadColor;
    ctx.fillRect(0, 134, this.width, 8);
    this.traffic.forEach(t => {
      ctx.fillStyle = '#111';
      ctx.fillRect(t.x, 135, 8, 4);
      ctx.fillRect(t.x + 3, 132, 3, 4);
      ctx.fillStyle = t.color;
      ctx.fillRect(t.x - 3, 136, 3, 2);
      ctx.fillStyle = '#ff3838';
      ctx.fillRect(t.x + 8, 136, 1, 2);
    });

    // 8. VỈA HÈ & GẠCH LÁT THEO ÁNH SÁNG BUỔI
    let groundColor = '#261223';
    let kerb1 = '#3f1f3b';
    let kerb2 = '#542b4e';
    let grout = '#1e0c1b';

    if (tod === 'morning') {
      groundColor = '#48414a';
      kerb1 = '#5c545f';
      kerb2 = '#6e6572';
      grout = '#3a343c';
    } else if (tod === 'noon') {
      groundColor = '#57505a';
      kerb1 = '#6d6571';
      kerb2 = '#7f7684';
      grout = '#453f47';
    } else if (tod === 'afternoon') {
      groundColor = '#3b2234';
      kerb1 = '#4f2e46';
      kerb2 = '#633a57';
      grout = '#2d1827';
    }

    ctx.fillStyle = groundColor;
    ctx.fillRect(0, 142, this.width, 58);

    ctx.fillStyle = kerb1;
    ctx.fillRect(0, 142, this.width, 5);
    ctx.fillStyle = kerb2;
    ctx.fillRect(0, 145, this.width, 2);

    ctx.strokeStyle = grout;
    ctx.lineWidth = 1;
    for (let x = 0; x < this.width; x += 32) {
      ctx.beginPath();
      ctx.moveTo(x, 147);
      ctx.lineTo(x + 10, this.height);
      ctx.stroke();
    }

    // 9. DÂY ĐÈN TRANG TRÍ (FAIRY LIGHTS KÉO DÀI SUỐT 720PX)
    ctx.strokeStyle = (tod === 'morning' || tod === 'noon') ? '#57606f' : '#3a2034';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(0, 20);
    ctx.quadraticCurveTo(100, 32, 200, 22);
    ctx.quadraticCurveTo(280, 30, 360, 18);
    ctx.quadraticCurveTo(450, 32, 540, 22);
    ctx.quadraticCurveTo(630, 30, this.width, 18);
    ctx.stroke();

    const lightColors = ['#ff5555', '#f1fa8c', '#50fa7b', '#bd93f9', '#ff79c6', '#8be9fd'];
    const lightGlowAlpha = (tod === 'night') ? 0.35 : (tod === 'afternoon' ? 0.2 : 0.08);

    for (let i = 15; i < this.width - 10; i += 28) {
      const swingY = Math.sin(this.tick * 0.05 + i) * 2;
      const lightY = 22 + Math.sin((i % 180) / 180 * Math.PI) * 7 + swingY;
      const c = lightColors[(Math.floor(i / 28)) % lightColors.length];
      
      // Halo
      ctx.fillStyle = c;
      ctx.globalAlpha = lightGlowAlpha;
      ctx.beginPath();
      ctx.arc(i, lightY + 4, 6, 0, Math.PI * 2);
      ctx.fill();

      // Bóng đèn
      ctx.globalAlpha = (tod === 'morning' || tod === 'noon') ? 0.7 : 1.0;
      ctx.fillRect(i - 2, lightY + 2, 4, 6);
    }

    // 10. HOA ANH ĐÀO BAY TRONG GIÓ
    this.petals.forEach(p => {
      ctx.fillStyle = p.color;
      ctx.globalAlpha = 0.85;
      ctx.beginPath();
      ctx.ellipse(p.x, p.y, p.size + 1, p.size, Math.PI / 4, 0, Math.PI * 2);
      ctx.fill();
    });
    ctx.globalAlpha = 1.0;
  },

  drawStreetLamp(ctx) {
    const tod = this.getTimeOfDay();
    const lampPositions = [188, 528, 705];

    lampPositions.forEach(lx => {
      const ly = 55;

      // Lamp Post
      ctx.fillStyle = '#1c1c24';
      ctx.fillRect(lx + 4, ly + 25, 6, 85);
      ctx.fillRect(lx + 1, ly + 105, 12, 6); // base

      // Lamp Arm & Cap
      ctx.fillRect(lx - 12, ly + 22, 22, 4);
      ctx.fillStyle = '#2d2d3a';
      ctx.fillRect(lx - 16, ly + 24, 14, 5);

      if (tod === 'night') {
        // Đêm: Quầng sáng nón rực rỡ chiếu xuống đường phố
        const bulbGlow = (Math.sin(this.tick * 0.08) * 0.1) + 0.85;
        const radGrad = ctx.createRadialGradient(lx - 9, ly + 36, 4, lx - 9, ly + 80, 95);
        radGrad.addColorStop(0, `rgba(255, 230, 140, ${0.45 * bulbGlow})`);
        radGrad.addColorStop(0.5, `rgba(255, 200, 100, ${0.15 * bulbGlow})`);
        radGrad.addColorStop(1, 'rgba(255, 200, 100, 0)');
        ctx.fillStyle = radGrad;
        ctx.beginPath();
        ctx.arc(lx - 9, ly + 70, 90, 0, Math.PI * 2);
        ctx.fill();

        // Yellow bulb
        ctx.fillStyle = '#fff4aa';
        ctx.fillRect(lx - 12, ly + 29, 6, 6);
      } else if (tod === 'afternoon') {
        // Chiều: Đèn vàng bắt đầu sáng nhẹ
        const bulbGlow = (Math.sin(this.tick * 0.08) * 0.05) + 0.5;
        const radGrad = ctx.createRadialGradient(lx - 9, ly + 36, 2, lx - 9, ly + 70, 60);
        radGrad.addColorStop(0, `rgba(255, 200, 100, ${0.25 * bulbGlow})`);
        radGrad.addColorStop(1, 'rgba(255, 200, 100, 0)');
        ctx.fillStyle = radGrad;
        ctx.beginPath();
        ctx.arc(lx - 9, ly + 60, 60, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = '#fbc531';
        ctx.fillRect(lx - 12, ly + 29, 6, 6);
      } else {
        // Ban ngày (Sáng, Trưa): Đèn đường tắt
        ctx.fillStyle = '#4b4b5a';
        ctx.fillRect(lx - 12, ly + 29, 6, 6);
      }
    });
  },

  drawHUSTParabolBackground(ctx, tod) {
    // 1. SKY GRADIENT
    const skyGrad = ctx.createLinearGradient(0, 0, 0, 145);
    if (tod === 'morning') {
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

    // Clouds
    this.drawClouds(ctx, tod);

    // Birds flying over HUST in morning/noon
    if (tod === 'morning' || tod === 'noon') {
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

    // Tree trunks
    ctx.fillStyle = (tod === 'night') ? '#0d130f' : '#3d271d';
    ctx.fillRect(38, 80, 8, 55);
    ctx.fillRect(318, 78, 9, 57);
    ctx.fillRect(455, 80, 8, 55);
    ctx.fillRect(665, 78, 9, 57);

    // 4. DISTANT CAMPUS BUILDINGS (NHÀ C1, THƯ VIỆN TẠ QUANG BỬU TRẢI DÀI KHUÔN VIÊN 720PX)
    const bldBg = (tod === 'night') ? '#131b24' : (tod === 'afternoon' ? '#3d3448' : '#7f8c8d');
    ctx.fillStyle = bldBg;
    // Central campus buildings
    ctx.fillRect(115, 68, 50, 60);
    ctx.fillRect(195, 62, 55, 66);
    // Ta Quang Buu Library (Modern glass & steel building)
    ctx.fillStyle = (tod === 'night') ? '#1a252f' : '#34495e';
    ctx.fillRect(355, 52, 85, 76);
    ctx.fillStyle = (tod === 'night') ? '#f39c12' : '#74b9ff';
    for (let wy = 58; wy < 120; wy += 9) {
      for (let wx = 360; wx < 435; wx += 15) {
        ctx.fillRect(wx, wy, 10, 5);
      }
    }

    // Iconic C1 Building with Clock Tower
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

    // Campus windows for C1
    ctx.fillStyle = (tod === 'night') ? '#f39c12' : '#dfe6e9';
    for (let wy = 68; wy < 120; wy += 10) {
      ctx.fillRect(120, wy, 8, 4);
      ctx.fillRect(134, wy, 8, 4);
      ctx.fillRect(148, wy, 8, 4);
      ctx.fillRect(202, wy, 8, 4);
      ctx.fillRect(216, wy, 8, 4);
      ctx.fillRect(230, wy, 8, 4);
      // C1 windows
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

    // Concrete base pillars supporting arch bases (x: 70-82 and x: 278-290)
    ctx.fillStyle = archShadow;
    ctx.fillRect(70, 94, 12, 38);
    ctx.fillRect(278, 94, 12, 38);
    ctx.fillStyle = archWhite;
    ctx.fillRect(70, 94, 4, 38);
    ctx.fillRect(278, 94, 4, 38);

    // HUST EMBLEM / SEAL (Compa & Bánh Răng Đỏ Vàng tại đỉnh Parabol)
    ctx.fillStyle = '#c0392b';
    ctx.beginPath();
    ctx.arc(180, 34, 11, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#f1c40f';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.arc(180, 34, 9, 0, Math.PI * 2);
    ctx.stroke();
    // Gear teeth & compass
    ctx.fillStyle = '#f1c40f';
    ctx.fillRect(179, 25, 2, 4);
    ctx.fillRect(179, 39, 2, 4);
    ctx.fillRect(171, 33, 4, 2);
    ctx.fillRect(185, 33, 4, 2);
    // Compass needle
    ctx.strokeStyle = '#ffffff';
    ctx.beginPath();
    ctx.moveTo(177, 39);
    ctx.lineTo(180, 29);
    ctx.lineTo(183, 39);
    ctx.stroke();

    // BANNER / SIGNBOARD: "ĐẠI HỌC BÁCH KHOA HÀ NỘI"
    ctx.fillStyle = '#c0392b';
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
  }
};

