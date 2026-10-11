// Chapter 1: Phố Cổ Hà Nội & Vỉa Hè Hoài Niệm (Town Scene)
import { staticBgCache } from './cache.js';

export const townMethods = {
  drawTownBackground(ctx, tod) {
    // 1. SKY GRADIENT DYNAMIC THEO THỜI TIẾT & GIỜ TRONG NGÀY
    const skyGrad = ctx.createLinearGradient(0, 0, 0, 145);
    const isStorm = this.weather && this.weather.id === 'stormy';
    const isRain = this.weather && this.weather.id === 'rainy';
    const isCloudy = this.weather && this.weather.id === 'cloudy';
    const isWindy = this.weather && this.weather.id === 'windy';

    if (isStorm) {
      // Giông bão: Bầu trời tím sẫm cuồn cuộn mây giông
      skyGrad.addColorStop(0, '#0a0a14');
      skyGrad.addColorStop(0.45, '#19152b');
      skyGrad.addColorStop(0.85, '#2e2544');
      skyGrad.addColorStop(1, '#1b1b2f');
    } else if (isRain) {
      // Mưa rào: Trời xám bạc mát rượi
      skyGrad.addColorStop(0, '#2d3436');
      skyGrad.addColorStop(0.5, '#4b6584');
      skyGrad.addColorStop(1, '#778ca3');
    } else if (isCloudy) {
      // Trời râm mát: Tầng mây xám bạc dịu mát
      skyGrad.addColorStop(0, '#4b6584');
      skyGrad.addColorStop(0.45, '#778ca3');
      skyGrad.addColorStop(0.8, '#a4b0be');
      skyGrad.addColorStop(1, '#c7ecee');
    } else if (isWindy) {
      // Gió mùa: Xanh biếc gió lộng lẫy
      skyGrad.addColorStop(0, '#1B9CFC');
      skyGrad.addColorStop(0.4, '#55E6C1');
      skyGrad.addColorStop(0.8, '#9AECDB');
      skyGrad.addColorStop(1, '#F8EFBA');
    } else if (tod === 'morning') {
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
    } else if (!isStorm && !isRain) {
      if (isCloudy) {
        // Mây che bóng râm: Mặt trời dịu mờ sau mây
        const sx = tod === 'noon' ? 180 : (tod === 'morning' ? 55 : 65);
        const sy = tod === 'noon' ? 22 : (tod === 'morning' ? 32 : 55);
        ctx.fillStyle = 'rgba(255, 255, 255, 0.25)';
        ctx.beginPath();
        ctx.arc(sx, sy, 18, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = 'rgba(255, 255, 255, 0.45)';
        ctx.beginPath();
        ctx.arc(sx, sy, 8, 0, Math.PI * 2);
        ctx.fill();
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
    }

    // 3. MÂY TRÔI BAN NGÀY
    this.drawClouds(ctx, tod);

    // 3b. TIA NẮNG XUYÊN MÂY (VOLUMETRIC GOD RAYS BAN MAI & HOÀNG HÔN)
    if ((tod === 'morning' || tod === 'afternoon') && (!isStorm && !isRain && !isCloudy)) {
      this.drawGodRays(ctx, tod);
    }

    // 4. HANOI OLD QUARTER ARCHITECTURE (STATIC LAYER VIA OFFSCREEN CACHE)
    const weatherKey = isStorm ? 'storm' : (isRain ? 'rain' : (isCloudy ? 'cloudy' : (isWindy ? 'windy' : 'clear')));
    const townStaticKey = `town_${tod}_${weatherKey}`;

    staticBgCache.render(ctx, townStaticKey, this.width, 145, (c) => {
      // Bảng màu tường vàng kinh điển phố cổ
      const ochreWall = (tod === 'night') ? '#3a3220' : (tod === 'morning' ? '#f4d03f' : (tod === 'noon' ? '#d4ac0d' : '#c99639'));
      const ochreShade = (tod === 'night') ? '#262014' : (tod === 'morning' ? '#d4ac0d' : (tod === 'noon' ? '#7d6608' : '#946618'));
      const mossGreen = (tod === 'night') ? '#14281b' : '#27ae60';
      const mossDark  = (tod === 'night') ? '#0c1a11' : '#1e8449';
      const brickTerracotta = '#b03a2e';
      const brickShadow = '#78281f';
      const brickMortar = '#dfe6e9';
      const shutterGreen = (tod === 'night') ? '#13281c' : '#1e5f38';

      // Townhouse blocks across 720px width
      const townhouses = [
        { x: 15,  y: 42, w: 52, h: 93, roof: 'slant' },
        { x: 67,  y: 32, w: 58, h: 103, roof: 'tile' },
        { x: 125, y: 55, w: 62, h: 80, roof: 'flat' },
        { x: 218, y: 38, w: 64, h: 97, roof: 'tile' },
        { x: 282, y: 50, w: 76, h: 85, roof: 'flat' },
        { x: 358, y: 44, w: 68, h: 91, roof: 'slant' },
        { x: 426, y: 32, w: 74, h: 103, roof: 'tile' },
        { x: 500, y: 54, w: 66, h: 81, roof: 'flat' },
        { x: 566, y: 38, w: 76, h: 97, roof: 'tile' },
        { x: 642, y: 48, w: 74, h: 87, roof: 'slant' }
      ];

      townhouses.forEach((th, idx) => {
        // Base wall with shadow & ochre plaster
        c.fillStyle = ochreShade;
        c.fillRect(th.x, th.y, th.w, th.h);
        c.fillStyle = ochreWall;
        c.fillRect(th.x + 2, th.y, th.w - 4, th.h);

        // Peeling Plaster (Vết tróc vôi lộ gạch thẻ đất nung nứt nẻ với bóng đổ gờ 1px)
        const bpX = th.x + 8;
        const bpY = th.y + 22;
        const bpW = 18;
        const bpH = 12;

        // Exposed terracotta brick background
        c.fillStyle = brickTerracotta;
        c.fillRect(bpX, bpY, bpW, bpH);
        // Mortar lines between bricks
        c.fillStyle = brickMortar;
        c.fillRect(bpX, bpY + 4, bpW, 1);
        c.fillRect(bpX, bpY + 8, bpW, 1);
        c.fillRect(bpX + 6, bpY, 1, 4);
        c.fillRect(bpX + 12, bpY + 4, 1, 4);
        c.fillRect(bpX + 5, bpY + 8, 1, 4);
        // 1px bevel cast shadow around peeling hole
        c.fillStyle = brickShadow;
        c.fillRect(bpX - 1, bpY - 1, bpW + 2, 1);
        c.fillRect(bpX - 1, bpY, 1, bpH);
        // Peeling white lime crumbly edges
        c.fillStyle = '#fff9db';
        c.fillRect(bpX + bpW, bpY, 1, bpH);
        c.fillRect(bpX, bpY + bpH, bpW + 1, 1);

        // Secondary small brick patch on wider buildings
        if (th.w > 65) {
          const spX = th.x + th.w - 18;
          const spY = th.y + 36;
          c.fillStyle = brickTerracotta;
          c.fillRect(spX, spY, 11, 7);
          c.fillStyle = brickMortar;
          c.fillRect(spX, spY + 3.5, 11, 0.8);
          c.fillRect(spX + 5, spY, 0.8, 3.5);
          c.fillStyle = brickShadow;
          c.fillRect(spX - 1, spY - 1, 12, 1);
        }

        // Rain Streaks (Vệt nước mưa chảy dài sẫm màu từ gờ mái)
        c.fillStyle = (tod === 'night') ? '#141c15' : 'rgba(125, 102, 8, 0.45)';
        c.fillRect(th.x + 12, th.y + 4, 1.5, 16);
        c.fillRect(th.x + 28, th.y + 2, 1.2, 22);
        c.fillRect(th.x + th.w - 12, th.y + 5, 1.5, 18);

        // Moss Patches (Rêu xanh nhung góc ẩm thấp chân tường)
        c.fillStyle = mossDark;
        c.fillRect(th.x + 3, th.y + th.h - 18, 14, 12);
        c.fillRect(th.x + th.w - 15, th.y + th.h - 14, 12, 9);
        c.fillStyle = mossGreen;
        c.fillRect(th.x + 5, th.y + th.h - 22, 9, 6);
        c.fillRect(th.x + th.w - 12, th.y + th.h - 18, 8, 5);

        // Traditional Tile Roof (Mái ngói âm dương / vảy cá rêu phong)
        if (th.roof === 'tile') {
          // Roof base
          c.fillStyle = (tod === 'night') ? '#2a1710' : '#8b3a2b';
          c.beginPath();
          c.moveTo(th.x - 4, th.y);
          c.lineTo(th.x + th.w * 0.5, th.y - 13);
          c.lineTo(th.x + th.w + 4, th.y);
          c.fill();

          // Fish-scale tile texture ridge lines
          c.fillStyle = (tod === 'night') ? '#1e0f0a' : '#6e271a';
          for (let tx = th.x - 2; tx < th.x + th.w + 2; tx += 5) {
            c.fillRect(tx, th.y - 3, 1, 3);
          }
          // Vietnamese Imperial Cloud Ridge Top (Bờ nóc hoa văn mây)
          c.fillStyle = '#ecf0f1';
          c.fillRect(th.x + th.w * 0.5 - 3, th.y - 15, 6, 2.5);

          // Thick green moss cushion on roof troughs
          c.fillStyle = mossGreen;
          c.fillRect(th.x + 4, th.y - 5, 10, 3);
          c.fillRect(th.x + th.w - 16, th.y - 6, 8, 3);
        } else if (th.roof === 'slant') {
          c.fillStyle = (tod === 'night') ? '#2a1710' : '#7c3325';
          c.beginPath();
          c.moveTo(th.x - 2, th.y);
          c.lineTo(th.x + th.w + 2, th.y - 9);
          c.lineTo(th.x + th.w + 2, th.y);
          c.fill();
          c.fillStyle = mossGreen;
          c.fillRect(th.x + 6, th.y - 4, 8, 2);
        }

        // French Louvered Wooden Shutters (Cửa sổ gỗ lá sách xanh ngọc bích)
        const winX1 = th.x + 8;
        const winX2 = th.x + th.w - 22;
        const winY = th.y + 14;
        [winX1, winX2].forEach(wx => {
          if (wx < th.x + th.w - 14) {
            c.fillStyle = shutterGreen;
            c.fillRect(wx, winY, 14, 20);
            c.fillStyle = '#0f172a'; // Louver slats
            for (let sy = winY + 3; sy < winY + 18; sy += 3.5) {
              c.fillRect(wx + 1.5, sy, 11, 1);
            }
            // Brass latch center
            c.fillStyle = '#f4c430';
            c.fillRect(wx + 6, winY + 9, 2, 2);
          }
        });

        // Art Nouveau Wrought-Iron Balcony Frame (Lan can sắt uốn cong xanh ô-liu sẫm)
        if (idx % 2 === 1) {
          const balY = th.y + 40;
          c.strokeStyle = '#1b4f72';
          c.lineWidth = 1.2;
          c.strokeRect(th.x + 5, balY, th.w - 10, 10);
          for (let ix = th.x + 8; ix < th.x + th.w - 8; ix += 5) {
            c.fillRect(ix, balY, 1, 10);
          }
          // Green leaf foliage under-layer
          c.fillStyle = '#1b4332';
          c.fillRect(th.x + 6, balY - 4, th.w - 12, 5);
          c.fillRect(th.x + 8, balY + 1, 10, 8);
          c.fillRect(th.x + th.w - 22, balY + 1, 12, 11);
        }
      });
    });

    // 4b. DYNAMIC BALCONY BOUGAINVILLEA BLOSSOMS (GIÀN HOA GIẤY FUCHSIA ĐUNG ĐƯA THEO GIÓ)
    const townhouses = [
      { x: 15,  y: 42, w: 52 },
      { x: 67,  y: 32, w: 58 },
      { x: 125, y: 55, w: 62 },
      { x: 218, y: 38, w: 64 },
      { x: 282, y: 50, w: 76 },
      { x: 358, y: 44, w: 68 },
      { x: 426, y: 32, w: 74 },
      { x: 500, y: 54, w: 66 },
      { x: 566, y: 38, w: 76 },
      { x: 642, y: 48, w: 74 }
    ];

    townhouses.forEach((th, idx) => {
      if (idx % 2 === 1) {
        const balY = th.y + 40;
        const windSway = Math.sin(this.tick * 0.05 + idx) * 1.5;

        for (let fl = 0; fl < 14; fl++) {
          const fx = th.x + 7 + ((fl * 5) % (th.w - 14)) + (fl % 3 === 0 ? windSway : 0);
          const fy = balY - 3 + (fl * 4) % 15;
          // Fuchsia & Magenta Bougainvillea petals
          ctx.fillStyle = (fl % 3 === 0) ? '#fd79a8' : ((fl % 3 === 1) ? '#e84393' : '#ff7675');
          ctx.fillRect(fx, fy, 2.5, 2.5);
          // Tiny white blossom core
          if (fl % 4 === 0) {
            ctx.fillStyle = '#ffffff';
            ctx.fillRect(fx + 0.8, fy + 0.8, 1, 1);
          }
        }
      }
    });

    // 4c. MICRO-INTERACTION: MÈO VÀNG SƯỞI NẮNG TRÊN MÁI NGÓI (ROOF CAT WAGGING TAIL)
    const catRoofX = 248;
    const catRoofY = 32;
    const tailAngle = Math.sin(this.tick * 0.08) * 3;
    // Sleeping cat body
    ctx.fillStyle = '#f39c12'; // Orange fur
    ctx.beginPath();
    ctx.ellipse(catRoofX, catRoofY, 5, 3.5, 0, 0, Math.PI * 2);
    ctx.fill();
    // Cat ears & head
    ctx.beginPath();
    ctx.arc(catRoofX - 4, catRoofY - 1, 2.5, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#d35400';
    ctx.fillRect(catRoofX - 5.5, catRoofY - 3.5, 1.5, 2); // Left ear
    ctx.fillRect(catRoofX - 3.5, catRoofY - 3.5, 1.5, 2); // Right ear
    // White muzzle
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(catRoofX - 5, catRoofY, 1.5, 1.5);
    // Flicking tail
    ctx.strokeStyle = '#f39c12';
    ctx.lineWidth = 1.2;
    ctx.beginPath();
    ctx.moveTo(catRoofX + 4, catRoofY + 1);
    ctx.quadraticCurveTo(catRoofX + 8, catRoofY - 2 + tailAngle, catRoofX + 9, catRoofY - 4 + tailAngle);
    ctx.stroke();

    // 5. CỘT ĐIỆN "TỔ QUẠ" PHỐ CỔ & DÂY CÁP VIỄN THÔNG (CROW'S NEST UTILITY POLES)
    const polePositions = [182, 545];
    polePositions.forEach((px, pIdx) => {
      // Ly tâm concrete pole body
      ctx.fillStyle = (tod === 'night') ? '#1e2024' : '#7f8c8d';
      ctx.fillRect(px, 14, 5.5, 130);
      // Steel support rings / bands
      ctx.fillStyle = (tod === 'night') ? '#121417' : '#34495e';
      ctx.fillRect(px - 1, 28, 7.5, 2);
      ctx.fillRect(px - 1, 56, 7.5, 2);
      ctx.fillRect(px - 1, 88, 7.5, 2);
      ctx.fillRect(px - 1, 118, 7.5, 2);

      // Peeling street flyers ("Khoan Cắt Bê Tông", "Gia Sư", "Cho Thuê Nhà")
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(px - 0.5, 62 + pIdx * 6, 6.5, 10);
      ctx.fillStyle = '#e74c3c';
      ctx.fillRect(px + 0.5, 64 + pIdx * 6, 4.5, 1.2);
      ctx.fillRect(px + 0.5, 67 + pIdx * 6, 4.5, 1.2);

      ctx.fillStyle = '#ffeaa7';
      ctx.fillRect(px - 0.5, 78 + pIdx * 4, 6.5, 8);
      ctx.fillStyle = '#0984e3';
      ctx.fillRect(px + 0.5, 80 + pIdx * 4, 4.5, 1.2);

      // Rusty metal electric meter box with tiny red blinking LED
      ctx.fillStyle = '#5d4037';
      ctx.fillRect(px + 5.5, 48, 8, 12);
      ctx.fillStyle = '#8d6e63';
      ctx.fillRect(px + 7, 51, 5, 4); // glass dial
      // Red LED power indicator
      const redBlink = (Math.sin(this.tick * 0.15 + pIdx) > 0);
      ctx.fillStyle = redBlink ? '#ff3838' : '#7f1d1d';
      ctx.fillRect(px + 11, 58, 1.5, 1.5);
    });

    // Tangled hyperbolic sagging utility cables
    ctx.strokeStyle = (tod === 'night') ? '#14141d' : '#2d3436';
    ctx.lineWidth = 1.2;
    // Primary main bundle
    ctx.beginPath();
    ctx.moveTo(0, 24);
    ctx.quadraticCurveTo(182, 38, 360, 28);
    ctx.quadraticCurveTo(545, 40, this.width, 26);
    ctx.stroke();

    // Secondary sagging telephone cable
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(0, 32);
    ctx.quadraticCurveTo(190, 52, 375, 36);
    ctx.quadraticCurveTo(555, 52, this.width, 34);
    ctx.stroke();

    // Tertiary drop wire looping down to houses
    ctx.lineWidth = 0.8;
    ctx.beginPath();
    ctx.moveTo(182, 36);
    ctx.quadraticCurveTo(250, 65, 290, 55);
    ctx.moveTo(545, 38);
    ctx.quadraticCurveTo(480, 68, 440, 58);
    ctx.stroke();

    // Sparrows perched on utility wires (Chim sẻ rỉa lông)
    const sparrows = [
      { x: 145, y: 34, facing: 1 },
      { x: 156, y: 35, facing: -1 },
      { x: 385, y: 32, facing: 1 },
      { x: 520, y: 38, facing: -1 }
    ];
    sparrows.forEach((sp, sIdx) => {
      const birdFlutter = (Math.floor(this.tick / 30 + sIdx) % 8 === 0) ? -1 : 0;
      ctx.fillStyle = '#795548'; // Sparrow body
      ctx.fillRect(sp.x, sp.y - 3 + birdFlutter, 4, 3);
      ctx.fillStyle = '#d7ccc8'; // Chest
      ctx.fillRect(sp.x + (sp.facing > 0 ? 2 : 0), sp.y - 2 + birdFlutter, 2, 2);
      ctx.fillStyle = '#3e2723'; // Head
      ctx.fillRect(sp.x + (sp.facing > 0 ? 3 : -1), sp.y - 4 + birdFlutter, 2, 2);
      ctx.fillStyle = '#f1c40f'; // Beak
      ctx.fillRect(sp.x + (sp.facing > 0 ? 5 : -2), sp.y - 3 + birdFlutter, 1.5, 1);
    });

    // 6. BẢNG HIỆU NEON TRÊN TÒA NHÀ (SÁNG VÀO HOÀNG HÔN & TỐI)
    let neonAlpha = (tod === 'morning') ? 0.25 : (tod === 'noon' ? 0.15 : (tod === 'afternoon' ? 0.75 : 1.0));
    const neonCyan = ((Math.sin(this.tick * 0.1) * 0.2) + 0.8) * neonAlpha;
    ctx.fillStyle = `rgba(0, 206, 201, ${neonCyan})`;
    ctx.font = 'bold 9px monospace';
    ctx.fillText('⚡TIỆM TRÀ', 72, 48);

    const neonPink = ((Math.sin(this.tick * 0.12 + 1) * 0.2) + 0.8) * neonAlpha;
    ctx.fillStyle = `rgba(253, 121, 168, ${neonPink})`;
    ctx.fillText('🍟ĂN VẶT', 228, 52);

    const neonYellow = ((Math.sin(this.tick * 0.09 + 2) * 0.2) + 0.8) * neonAlpha;
    ctx.fillStyle = `rgba(254, 202, 87, ${neonYellow})`;
    ctx.fillText('🍰BÁNH NGỌT', 438, 48);

    const neonGreen = ((Math.sin(this.tick * 0.11 + 3) * 0.2) + 0.8) * neonAlpha;
    ctx.fillStyle = `rgba(85, 239, 196, ${neonGreen})`;
    ctx.fillText('☕CÀ PHÊ', 578, 54);

    // 7. MẶT ĐƯỜNG & XE MÁY LƯU THÔNG
    let roadColor = (tod === 'morning') ? '#3a3440' : (tod === 'noon') ? '#4a4250' : (tod === 'afternoon') ? '#321c2e' : '#220f20';
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

    // Wet Road Men Pavement Reflective Sheen during rain
    if (isRain || isStorm) {
      ctx.fillStyle = 'rgba(223, 249, 251, 0.18)';
      ctx.fillRect(0, 134, this.width, 8);
    }

    // 8. VỈA HÈ LÁT GẠCH CON SÂU LỤC GIÁC & CỎ NON MỌC KẼ NỨT
    let groundColor = (tod === 'morning') ? '#48414a' : (tod === 'noon') ? '#57505a' : (tod === 'afternoon') ? '#3b2234' : '#261223';
    let kerb1 = (tod === 'morning') ? '#5c545f' : (tod === 'noon') ? '#6d6571' : (tod === 'afternoon') ? '#4f2e46' : '#3f1f3b';
    let kerb2 = (tod === 'morning') ? '#6e6572' : (tod === 'noon') ? '#7f7684' : (tod === 'afternoon') ? '#633a57' : '#542b4e';

    ctx.fillStyle = groundColor;
    ctx.fillRect(0, 142, this.width, 58);
    ctx.fillStyle = kerb1;
    ctx.fillRect(0, 142, this.width, 5);
    ctx.fillStyle = kerb2;
    ctx.fillRect(0, 145, this.width, 2);

    // Gạch con sâu lục giác phối 2 màu vàng đất & đỏ gạch
    const tileOchre = (tod === 'night') ? 'rgba(180, 130, 40, 0.22)' : 'rgba(212, 172, 13, 0.26)';
    const tileRed   = (tod === 'night') ? 'rgba(163, 44, 44, 0.22)' : 'rgba(176, 58, 46, 0.26)';

    for (let px = 0; px < this.width; px += 20) {
      for (let py = 148; py < this.height; py += 14) {
        const isRed = ((Math.floor(px / 20) + Math.floor(py / 14)) % 2 === 0);
        ctx.fillStyle = isRed ? tileRed : tileOchre;
        ctx.fillRect(px + 1, py + 1, 18, 12);
        // Subtle bevel border
        ctx.fillStyle = 'rgba(0, 0, 0, 0.12)';
        ctx.fillRect(px + 18, py + 1, 1, 12);
        ctx.fillRect(px + 1, py + 12, 18, 1);
      }
    }

    // Green grass shoots emerging from sidewalk cracks (Cỏ non mọc kẽ nứt #2ED573)
    const grassCracks = [35, 92, 168, 245, 340, 435, 510, 615, 680];
    grassCracks.forEach((gx, gIdx) => {
      const gy = 154 + (gIdx * 7) % 36;
      ctx.fillStyle = '#2ed573';
      ctx.fillRect(gx, gy, 1.5, 3);
      ctx.fillRect(gx + 1.5, gy - 1, 1.5, 4);
      ctx.fillRect(gx + 3, gy + 1, 1.2, 2);
    });

    // 8b. GỐC CÂY SẤU GIÀ CỔ THỤ (GNARLED DRACONTOMELON TREE)
    const sauX = 312;
    const sauY = 142;
    // Gnarled rough tree trunk
    ctx.fillStyle = (tod === 'night') ? '#241b14' : '#4a3728';
    ctx.fillRect(sauX, sauY, 14, 52);
    // Tree bark texture fissures
    ctx.fillStyle = (tod === 'night') ? '#150f0b' : '#2d1e12';
    ctx.fillRect(sauX + 3, sauY + 4, 2, 42);
    ctx.fillRect(sauX + 8, sauY + 8, 2, 38);
    // Bulging root base breaking pavement
    ctx.fillStyle = (tod === 'night') ? '#241b14' : '#5d4037';
    ctx.beginPath();
    ctx.moveTo(sauX - 7, sauY + 38);
    ctx.lineTo(sauX, sauY + 20);
    ctx.lineTo(sauX + 14, sauY + 20);
    ctx.lineTo(sauX + 22, sauY + 40);
    ctx.lineTo(sauX + 16, sauY + 54);
    ctx.lineTo(sauX - 5, sauY + 54);
    ctx.closePath();
    ctx.fill();

    // Fallen yellow dracontomelon leaves (Lá sấu vàng rơi lác đác)
    const leafPositions = [
      { x: sauX - 16, y: sauY + 12 }, { x: sauX + 24, y: sauY + 18 },
      { x: sauX - 8,  y: sauY + 32 }, { x: sauX + 18, y: sauY + 38 },
      { x: sauX - 25, y: sauY + 26 }, { x: sauX + 32, y: sauY + 10 }
    ];
    leafPositions.forEach(lf => {
      ctx.fillStyle = '#f1c40f';
      ctx.fillRect(lf.x, lf.y, 2.5, 1.5);
      ctx.fillStyle = '#e67e22';
      ctx.fillRect(lf.x + 1, lf.y + 0.5, 1.2, 1);
    });

    // 8c. NẮP CỐNG KIM LOẠI TRÒN HOA VĂN TIA ĐỒNG TÂM & HƠI NƯỚC ẤM
    [75, 415].forEach((mx, mIdx) => {
      // Outer rim
      ctx.fillStyle = '#1e293b';
      ctx.beginPath();
      ctx.ellipse(mx, 172, 10, 4.5, 0, 0, Math.PI * 2);
      ctx.fill();
      // Inner plate
      ctx.fillStyle = '#475569';
      ctx.beginPath();
      ctx.ellipse(mx, 172, 8, 3.5, 0, 0, Math.PI * 2);
      ctx.fill();
      // Concentric radial lines
      ctx.fillStyle = '#94a3b8';
      ctx.fillRect(mx - 4, 171.5, 8, 1);
      ctx.fillRect(mx - 1, 169.5, 2, 5);

      // Steam rising from manhole gaps at night or during cold rain
      if (tod === 'night' || isRain || isStorm) {
        ctx.save();
        ctx.fillStyle = 'rgba(255, 255, 255, 0.16)';
        const steamOff = Math.sin(this.tick * 0.06 + mIdx * 2);
        for (let si = 0; si < 3; si++) {
          const sy = 168 - (si * 5) - ((this.tick * 0.4 + si * 4) % 15);
          const sx = mx + steamOff * 3 + (si - 1) * 2;
          ctx.beginPath();
          ctx.arc(sx, sy, 3 + si * 1.5, 0, Math.PI * 2);
          ctx.fill();
        }
        ctx.restore();
      }
    });

    // 8d. ĐẠO CỤ VỈA HÈ DÂN DÃ (TỦ THUỐC LÁ, BÀN GHẾ NHỰA, SẠP BÁO HÀ NỘI MỚI)
    // 1. Sạp báo Hà Nội Mới (x: 135)
    const baoX = 135;
    const baoY = 150;
    // Wooden frame kiosk
    ctx.fillStyle = '#5d4037';
    ctx.fillRect(baoX, baoY, 26, 28);
    ctx.fillStyle = '#8d6e63';
    ctx.fillRect(baoX + 2, baoY + 2, 22, 24);
    // Newspaper sheet with red header "HÀ NỘI MỚI"
    ctx.fillStyle = '#ecf0f1';
    ctx.fillRect(baoX + 4, baoY + 4, 18, 20);
    ctx.fillStyle = '#c0392b';
    ctx.fillRect(baoX + 5, baoY + 6, 16, 2.5); // Red logo
    ctx.fillStyle = '#2c3e50';
    for (let ny = baoY + 10; ny < baoY + 22; ny += 3) {
      ctx.fillRect(baoX + 5, ny, 16, 1);
    }

    // 2. Tủ thuốc lá vỉa hè mini nhôm kính (x: 236)
    const tuX = 236;
    const tuY = 152;
    // Aluminum frame
    ctx.fillStyle = '#bdc3c7';
    ctx.fillRect(tuX, tuY, 18, 26);
    ctx.fillStyle = '#34495e';
    ctx.fillRect(tuX + 1.5, tuY + 1.5, 15, 23);
    // Shelves of cigarette packs (various colors)
    const packColors = ['#e74c3c', '#3498db', '#f1c40f', '#2ecc71', '#e67e22'];
    for (let r = 0; r < 3; r++) {
      for (let c = 0; c < 3; c++) {
        ctx.fillStyle = packColors[(r * 3 + c) % packColors.length];
        ctx.fillRect(tuX + 3 + c * 4.2, tuY + 4 + r * 6, 3.2, 4.5);
      }
    }
    // Warm tungsten bulb inside cabinet (Sáng vào hoàng hôn & tối với micro-flicker)
    if (tod === 'afternoon' || tod === 'night') {
      const flicker = (Math.sin(this.tick * 0.25) > 0.85) ? 0.35 : 0.85;
      ctx.fillStyle = `rgba(255, 230, 120, ${0.45 * flicker})`;
      ctx.beginPath();
      ctx.arc(tuX + 9, tuY + 4, 8, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#fff4aa';
      ctx.fillRect(tuX + 8, tuY + 3, 2.5, 2.5);
    }

    // 3. Bàn inox & ghế nhựa con xanh dương & đỏ tươi (x: 260)
    const banX = 262;
    const banY = 162;
    // Mini inox table
    ctx.fillStyle = '#dfe6e9';
    ctx.fillRect(banX, banY, 14, 2);
    ctx.fillStyle = '#7f8c8d';
    ctx.fillRect(banX + 3, banY + 2, 1.5, 7);
    ctx.fillRect(banX + 9.5, banY + 2, 1.5, 7);
    // Blue plastic stool (#0984E3)
    ctx.fillStyle = '#0984e3';
    ctx.fillRect(banX - 6, banY + 3, 5, 2);
    ctx.fillRect(banX - 6, banY + 5, 1.2, 5);
    ctx.fillRect(banX - 2.2, banY + 5, 1.2, 5);
    // Red plastic stool (#D63031)
    ctx.fillStyle = '#d63031';
    ctx.fillRect(banX + 15, banY + 3, 5, 2);
    ctx.fillRect(banX + 15, banY + 5, 1.2, 5);
    ctx.fillRect(banX + 18.8, banY + 5, 1.2, 5);

    // 8e. MICRO-INTERACTION: ĐÀN CHIM BỒ CÂU VỈA HÈ (PIGEONS PECKING CRUMBS & FLUTTERING)
    const pigeons = [
      { baseX: 105, baseY: 172 },
      { baseX: 114, baseY: 176 },
      { baseX: 122, baseY: 173 }
    ];
    // Check if motorcycle traffic is nearby (x in 70..150)
    const hasNearbyTraffic = this.traffic && this.traffic.some(t => t.x > 60 && t.x < 160);
    pigeons.forEach((pg, pIdx) => {
      const isStartled = hasNearbyTraffic;
      const flyHeight = isStartled ? (Math.sin(this.tick * 0.2 + pIdx) * 12 - 16) : 0;
      const peckCycle = (!isStartled && (Math.floor(this.tick / 15 + pIdx) % 3 === 0)) ? 1 : 0;
      const px = pg.baseX + (isStartled ? (pIdx * 6) : 0);
      const py = pg.baseY + flyHeight;

      // Pigeon body (Grey #7f8c8d)
      ctx.fillStyle = '#7f8c8d';
      ctx.fillRect(px, py - 2 + peckCycle, 4.5, 3);
      // Iridescent purple/green neck band
      ctx.fillStyle = '#8e44ad';
      ctx.fillRect(px - 1, py - 3 + peckCycle, 2, 2);
      // Pigeon head
      ctx.fillStyle = '#95a5a6';
      ctx.fillRect(px - 2, py - 4 + peckCycle * 2, 2.5, 2);
      // Tiny orange beak & feet
      ctx.fillStyle = '#e67e22';
      ctx.fillRect(px - 3, py - 3 + peckCycle * 2, 1, 1);
      ctx.fillRect(px + 1, py + 1, 1, 2);
      ctx.fillRect(px + 3, py + 1, 1, 2);
      // Bread crumbs on ground
      ctx.fillStyle = '#f5cd79';
      ctx.fillRect(110, 175, 1, 1);
      ctx.fillRect(118, 176, 1, 1);
    });

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
    ctx.globalAlpha = 1.0;

    // Summer night fireflies around sidewalk planters
    this.drawFireflies(ctx);

  }
};
