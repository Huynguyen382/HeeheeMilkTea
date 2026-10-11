// Chapter 4: Đô Thị Nhượng Quyền Toàn Cầu (Franchise Global Scene)
import { staticBgCache } from './cache.js';

export const franchiseMethods = {
  drawFranchiseGlobalBackground(ctx, tod) {
    const isStorm = this.weather && this.weather.id === 'stormy';
    const isRain = this.weather && this.weather.id === 'rainy';
    const isCloudy = this.weather && this.weather.id === 'cloudy';
    const isWindy = this.weather && this.weather.id === 'windy';

    // 1. SKY GRADIENT METROPOLIS
    const skyGrad = ctx.createLinearGradient(0, 0, 0, 145);
    if (isStorm) {
      skyGrad.addColorStop(0, '#0a0a16');
      skyGrad.addColorStop(0.5, '#191530');
      skyGrad.addColorStop(1, '#1b1b32');
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
      skyGrad.addColorStop(0.4, '#55E6C1');
      skyGrad.addColorStop(0.8, '#a29bfe');
      skyGrad.addColorStop(1, '#ffeaa7');
    } else if (tod === 'morning') {
      skyGrad.addColorStop(0, '#0c2461');
      skyGrad.addColorStop(0.35, '#1e3799');
      skyGrad.addColorStop(0.7, '#f39c12');
      skyGrad.addColorStop(1, '#f1c40f');
    } else if (tod === 'noon') {
      skyGrad.addColorStop(0, '#0984e3');
      skyGrad.addColorStop(0.4, '#74b9ff');
      skyGrad.addColorStop(0.8, '#a29bfe');
      skyGrad.addColorStop(1, '#dfe6e9');
    } else if (tod === 'afternoon') {
      skyGrad.addColorStop(0, '#2c003e');
      skyGrad.addColorStop(0.3, '#511845');
      skyGrad.addColorStop(0.65, '#900c3f');
      skyGrad.addColorStop(0.85, '#e17055');
      skyGrad.addColorStop(1, '#fdcb6e');
    } else {
      // Night (Sài Gòn không ngủ - ánh đèn đô thị quốc tế)
      skyGrad.addColorStop(0, '#06070d');
      skyGrad.addColorStop(0.4, '#0f1124');
      skyGrad.addColorStop(0.75, '#1b1d3a');
      skyGrad.addColorStop(1, '#1e2444');
    }
    ctx.fillStyle = skyGrad;
    ctx.fillRect(0, 0, this.width, 145);

    // 2. CELESTIAL BODIES (Moon & Stars / Sun)
    if (tod === 'night') {
      // Neon/Gold Full Moon
      ctx.fillStyle = 'rgba(255, 234, 167, 0.2)';
      ctx.beginPath();
      ctx.arc(42, 24, 16, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#fff9e6';
      ctx.beginPath();
      ctx.arc(42, 24, 11, 0, Math.PI * 2);
      ctx.fill();

      // Twinkling city stars
      const stars = [
        { x: 18, y: 12 }, { x: 80, y: 16 }, { x: 140, y: 10 },
        { x: 220, y: 14 }, { x: 310, y: 12 }, { x: 380, y: 18 }
      ];
      ctx.fillStyle = '#ffffff';
      stars.forEach((s, idx) => {
        const flicker = (Math.sin(this.tick * 0.12 + idx * 1.6) + 1) * 0.4 + 0.3;
        ctx.globalAlpha = flicker;
        ctx.fillRect(s.x, s.y, 2, 2);
      });
      ctx.globalAlpha = 1.0;

      // Sky Searchlights / Rotating Lasers (Đèn rọi sự kiện quốc tế ban đêm)
      if (!isStorm && !isRain) {
        ctx.save();
        const beamAngle1 = Math.sin(this.tick * 0.02) * 0.35 - 0.25;
        const beamAngle2 = Math.sin(this.tick * 0.025 + 2) * 0.35 + 0.25;
        [ { x: 140, angle: beamAngle1 }, { x: 580, angle: beamAngle2 } ].forEach(b => {
          ctx.save();
          ctx.translate(b.x, 140);
          ctx.rotate(b.angle);
          const beamGrad = ctx.createLinearGradient(0, 0, 0, -120);
          beamGrad.addColorStop(0, 'rgba(116, 185, 255, 0.3)');
          beamGrad.addColorStop(0.7, 'rgba(162, 155, 254, 0.12)');
          beamGrad.addColorStop(1, 'rgba(255, 255, 255, 0)');
          ctx.fillStyle = beamGrad;
          ctx.beginPath();
          ctx.moveTo(-4, 0);
          ctx.lineTo(-24, -120);
          ctx.lineTo(24, -120);
          ctx.lineTo(4, 0);
          ctx.closePath();
          ctx.fill();
          ctx.restore();
        });
        ctx.restore();
      }
    } else if (!isStorm && !isRain) {
      if (isCloudy) {
        // Hazy diffused sun behind cloud cover
        const sx = tod === 'morning' ? 50 : (tod === 'noon' ? 220 : 60);
        const sy = tod === 'morning' ? 26 : (tod === 'noon' ? 18 : 40);
        ctx.fillStyle = 'rgba(255, 255, 255, 0.25)';
        ctx.beginPath();
        ctx.arc(sx, sy, 18, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = 'rgba(255, 255, 255, 0.45)';
        ctx.beginPath();
        ctx.arc(sx, sy, 8, 0, Math.PI * 2);
        ctx.fill();
      } else {
        // Golden Sun
        const sx = tod === 'morning' ? 50 : (tod === 'noon' ? 220 : 60);
        const sy = tod === 'morning' ? 26 : (tod === 'noon' ? 18 : 40);
        const sunHalo = ctx.createRadialGradient(sx, sy, 3, sx, sy, 32);
        sunHalo.addColorStop(0, tod === 'afternoon' ? 'rgba(255, 107, 107, 0.85)' : 'rgba(255, 255, 255, 0.9)');
        sunHalo.addColorStop(0.5, 'rgba(255, 234, 167, 0.3)');
        sunHalo.addColorStop(1, 'rgba(0,0,0,0)');
        ctx.fillStyle = sunHalo;
        ctx.beginPath();
        ctx.arc(sx, sy, 32, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = tod === 'afternoon' ? '#ee5253' : '#ffffff';
        ctx.beginPath();
        ctx.arc(sx, sy, 9, 0, Math.PI * 2);
        ctx.fill();
      }
    }

    // Clouds
    this.drawClouds(ctx, tod);

    // God Rays in morning/afternoon
    if ((tod === 'morning' || tod === 'afternoon') && (!isStorm && !isRain && !isCloudy)) {
      this.drawGodRays(ctx, tod);
    }

    // 3. ICONIC SKYLINE: LANDMARK 81 & BITEXCO FINANCIAL TOWER (HẬU CẢNH THÀNH PHỐ HIỆN ĐẠI)
    // A. LANDMARK 81 (Tòa tháp cao nhất Việt Nam)
    const lmX = 45;
    const lmW = 28;
    const lmBaseY = 138;
    // Lower tier
    ctx.fillStyle = (tod === 'night') ? '#1e243b' : '#576574';
    ctx.fillRect(lmX - 4, 85, lmW + 8, lmBaseY - 85);
    // Mid tier
    ctx.fillStyle = (tod === 'night') ? '#252e4d' : '#8395a7';
    ctx.fillRect(lmX - 1, 52, lmW + 2, 33);
    // Upper tier (bó ống thu nhỏ)
    ctx.fillStyle = (tod === 'night') ? '#2e3a5f' : '#a4b0be';
    ctx.fillRect(lmX + 2, 28, lmW - 4, 24);
    // Spire top & needle
    ctx.fillStyle = (tod === 'night') ? '#3d4d7c' : '#c8d6e5';
    ctx.fillRect(lmX + 6, 12, lmW - 12, 16);
    ctx.fillRect(lmX + lmW / 2 - 1, 3, 2, 9);
    // Spire aviation warning red blinker
    const blinkOn = Math.sin(this.tick * 0.15) > 0;
    if (blinkOn) {
      ctx.fillStyle = '#ff4757';
      ctx.fillRect(lmX + lmW / 2 - 1, 2, 2, 2);
    }
    // Vertical glass mullion highlights
    ctx.fillStyle = (tod === 'night') ? 'rgba(84, 160, 255, 0.4)' : 'rgba(255, 255, 255, 0.4)';
    ctx.fillRect(lmX + 3, 30, 1, 80);
    ctx.fillRect(lmX + lmW / 2, 20, 1, 100);
    ctx.fillRect(lmX + lmW - 4, 30, 1, 80);
    // Glowing windows at night
    if (tod === 'night') {
      ctx.fillStyle = '#feca57';
      for (let wy = 36; wy < 115; wy += 9) {
        if ((wy + this.tick) % 5 !== 0) {
          ctx.fillRect(lmX + 4, wy, 2, 2);
          ctx.fillRect(lmX + lmW - 6, wy, 2, 2);
        }
      }
    }

    // B. BITEXCO FINANCIAL TOWER (Hình búp sen & Sân đỗ trực thăng Helipad)
    const bxX = 96;
    const bxW = 24;
    // Body (curved glass tower)
    ctx.fillStyle = (tod === 'night') ? '#18243c' : '#546de5';
    ctx.fillRect(bxX, 48, bxW, lmBaseY - 48);
    // Top crown rounded
    ctx.beginPath();
    ctx.arc(bxX + bxW / 2, 48, bxW / 2, Math.PI, 0);
    ctx.fill();
    // Glass reflex
    ctx.fillStyle = (tod === 'night') ? 'rgba(72, 219, 251, 0.35)' : 'rgba(255, 255, 255, 0.35)';
    ctx.fillRect(bxX + 4, 42, 2, 85);
    // Cantilever Helipad at level 52 (Sân trực thăng chìa ra)
    const heliY = 64;
    ctx.fillStyle = (tod === 'night') ? '#57606f' : '#747d8c';
    ctx.fillRect(bxX + bxW - 2, heliY, 14, 3);
    ctx.fillStyle = '#ff4757';
    ctx.fillRect(bxX + bxW + 10, heliY - 1, 2, 2); // Helipad beacon

    // C. BACKGROUND SKYSCRAPERS (Dãy cao ốc tài chính & khách sạn sang trọng)
    const bgTowers = [
      { x: 132, w: 22, y: 70, col: (tod === 'night') ? '#151b2e' : '#718093' },
      { x: 162, w: 28, y: 62, col: (tod === 'night') ? '#1a2238' : '#7f8fa6' },
      { x: 200, w: 24, y: 76, col: (tod === 'night') ? '#131828' : '#57606f' },
      { x: 232, w: 34, y: 68, col: (tod === 'night') ? '#1c253d' : '#8395a7' }
    ];
    bgTowers.forEach(t => {
      ctx.fillStyle = t.col;
      ctx.fillRect(t.x, t.y, t.w, lmBaseY - t.y);
      // Windows
      if (tod === 'night') {
        ctx.fillStyle = 'rgba(254, 202, 87, 0.7)';
        for (let wy = t.y + 6; wy < 125; wy += 8) {
          for (let wx = t.x + 3; wx < t.x + t.w - 3; wx += 5) {
            if (((wx * 7 + wy * 11) % 4) !== 0) {
              ctx.fillRect(wx, wy, 2.5, 3);
            }
          }
        }
      }
    });

    // D. SÔNG SÀI GÒN BẾN BẠCH ĐẰNG & TÀU DU LỊCH 2 TẦNG (RIVER CRUISE & WATER REFLECTIONS)
    const rivX = 268;
    const rivW = 56;
    const rivY = 112;
    ctx.fillStyle = (tod === 'night') ? '#0c1b2b' : '#1e3799';
    ctx.fillRect(rivX, rivY, rivW, 26);
    // Water reflections
    ctx.fillStyle = (tod === 'night') ? 'rgba(254, 202, 87, 0.35)' : 'rgba(255, 255, 255, 0.3)';
    for (let ry = rivY + 3; ry < rivY + 24; ry += 5) {
      const rwOff = Math.sin(this.tick * 0.1 + ry) * 3;
      ctx.fillRect(rivX + 4 + rwOff, ry, 18, 1.2);
      ctx.fillRect(rivX + 28 - rwOff, ry + 2, 22, 1.2);
    }
    // 2-Story Saigon River Cruise Boat (Tàu du lịch 2 tầng Bến Bạch Đằng)
    const boatX = rivX + 10 + Math.sin(this.tick * 0.04) * 4;
    const boatY = rivY + 6;
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(boatX, boatY + 4, 32, 6); // Hull
    ctx.fillStyle = '#d63031';
    ctx.fillRect(boatX + 4, boatY, 24, 4); // Upper deck
    ctx.fillStyle = '#f1c40f';
    ctx.fillRect(boatX + 6, boatY + 1, 3, 2); // Warm cabin lights
    ctx.fillRect(boatX + 14, boatY + 1, 3, 2);
    ctx.fillRect(boatX + 22, boatY + 1, 3, 2);

    // E. GLOBAL FRANCHISE ACCENTS: ĐÀ NẴNG CẦU RỒNG, TOKYO SHIBUYA & SEOUL MYEONGDONG
    // 1. Cầu Rồng Đà Nẵng (Golden Dragon Bridge with Weekend Fire/Water Breath)
    const drgX = 328;
    const drgY = 88;
    ctx.strokeStyle = '#f1c40f'; // Golden dragon steel body
    ctx.lineWidth = 3.5;
    ctx.beginPath();
    ctx.moveTo(drgX, drgY + 8);
    ctx.quadraticCurveTo(drgX + 12, drgY - 6, drgX + 24, drgY + 6);
    ctx.quadraticCurveTo(drgX + 36, drgY - 6, drgX + 46, drgY + 8);
    ctx.stroke();
    // Dragon head (Đầu Rồng hướng ra sông)
    ctx.fillStyle = '#f39c12';
    ctx.fillRect(drgX + 44, drgY + 2, 6, 5);
    ctx.fillStyle = '#e74c3c';
    ctx.fillRect(drgX + 48, drgY + 1, 3, 2); // Horn/crest
    // Dragon Breath (Phun lửa đỏ cam hoặc phun nước sống động)
    const breathCycle = Math.floor(this.tick / 40) % 2;
    if (breathCycle === 0) {
      // Fire breath (Phun lửa)
      ctx.fillStyle = '#e74c3c';
      ctx.fillRect(drgX + 50, drgY + 2, 4 + (this.tick % 4), 2);
      ctx.fillStyle = '#f39c12';
      ctx.fillRect(drgX + 54, drgY + 1, 3, 2);
    } else {
      // Water mist spray (Phun nước)
      ctx.fillStyle = 'rgba(116, 185, 255, 0.7)';
      ctx.fillRect(drgX + 50, drgY + 2, 5 + (this.tick % 4), 2);
    }

    // 2. Tokyo Shibuya Cyberpunk Neon Signage (Biển hiệu neon chữ Nhật kanji/katakana & Shinkansen)
    const tkyX = 380;
    const tkyY = 64;
    // Japanese Neon Billboards
    const tkyNeonPulse = (Math.sin(this.tick * 0.15) > 0);
    ctx.fillStyle = tkyNeonPulse ? '#fd79a8' : '#e84393';
    ctx.font = 'bold 6.5px monospace';
    ctx.fillText('ボバ', tkyX, tkyY); // BOBA in katakana
    ctx.fillStyle = '#00cec9';
    ctx.fillText('東京', tkyX, tkyY + 9); // TOKYO in kanji
    // Shinkansen bullet train passing on elevated viaduct
    const trainX = (this.tick * 2.2) % (this.width + 120) - 60;
    const trainY = 56;
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(trainX, trainY, 42, 4); // White train body
    ctx.fillStyle = '#0984e3';
    ctx.fillRect(trainX, trainY + 1.5, 42, 1); // Blue Shinkansen stripe

    // 3. Seoul Myeongdong Autumn Ginkgo Trees & N Seoul Tower (Cây Ngân Hạnh lá vàng & Tháp Namsan)
    const seoX = 405;
    const seoY = 52;
    // N Seoul Tower on Mount Namsan
    ctx.fillStyle = (tod === 'night') ? '#2c3e50' : '#7f8c8d';
    ctx.fillRect(seoX + 6, seoY, 2.5, 22); // Tower shaft
    ctx.fillStyle = (tod === 'night') ? '#00cec9' : '#e74c3c';
    ctx.fillRect(seoX + 4, seoY + 8, 6.5, 3); // Observation deck
    ctx.fillRect(seoX + 7, seoY - 4, 1, 4); // Antenna spire
    // Autumn Golden Ginkgo Tree (Cây ngân hạnh mùa thu lá vàng)
    ctx.fillStyle = (tod === 'night') ? '#b7950b' : '#f1c40f';
    ctx.beginPath();
    ctx.arc(seoX + 16, seoY + 36, 9, 0, Math.PI * 2);
    ctx.arc(seoX + 22, seoY + 32, 7, 0, Math.PI * 2);
    ctx.fill();

    // 4. TRỤ SỞ TẬP ĐOÀN HEEHEE GLOBAL TOWER (MID-GROUND x = 425 -> 720)
    const hqX = 425;
    const hqW = 290;
    const hqY = 32;
    // Luxury glass curtain wall façade
    const facadeGrad = ctx.createLinearGradient(hqX, 0, hqX + hqW, 0);
    facadeGrad.addColorStop(0, (tod === 'night') ? '#1b223c' : '#2c3e50');
    facadeGrad.addColorStop(0.5, (tod === 'night') ? '#242f52' : '#34495e');
    facadeGrad.addColorStop(1, (tod === 'night') ? '#181f36' : '#2c3e50');
    ctx.fillStyle = facadeGrad;
    ctx.fillRect(hqX, hqY, hqW, lmBaseY - hqY);

    // Architectural Gold Trim Columns
    ctx.fillStyle = (tod === 'night') ? '#b8860b' : '#f1c40f';
    for (let cx = hqX; cx <= hqX + hqW; cx += 58) {
      ctx.fillRect(cx, hqY, 4, lmBaseY - hqY);
    }
    // Rooftop Terrace with glass railing
    ctx.fillStyle = (tod === 'night') ? '#2f3542' : '#747d8c';
    ctx.fillRect(hqX - 4, hqY - 5, hqW + 8, 5);
    ctx.fillStyle = 'rgba(116, 185, 255, 0.6)';
    ctx.fillRect(hqX - 2, hqY - 9, hqW + 4, 4);

    // MEGA 3D CURVED LED BILLBOARD (MÀN HÌNH LED KHỔNG LỒ QUẢNG CÁO NHƯỢNG QUYỀN TOÀN CẦU)
    const ledX = hqX + 24;
    const ledY = hqY + 14;
    const ledW = 215;
    const ledH = 46;
    // Bezel
    ctx.fillStyle = '#0f111a';
    ctx.fillRect(ledX - 3, ledY - 3, ledW + 6, ledH + 6);
    // Display screen
    const screenGrad = ctx.createLinearGradient(ledX, ledY, ledX, ledY + ledH);
    screenGrad.addColorStop(0, '#130f40');
    screenGrad.addColorStop(1, '#0c2461');
    ctx.fillStyle = screenGrad;
    ctx.fillRect(ledX, ledY, ledW, ledH);

    // Billboard Animated Ticker & Hologram Content
    ctx.save();
    ctx.beginPath();
    ctx.rect(ledX, ledY, ledW, ledH);
    ctx.clip();

    // 3D Giant Boba Cup Hologram in Billboard Center
    const cupPulse = (Math.sin(this.tick * 0.08) + 1) * 0.5;
    const cupX = ledX + 28;
    const cupY = ledY + 12;
    ctx.fillStyle = 'rgba(255, 234, 167, 0.25)';
    ctx.beginPath();
    ctx.arc(cupX + 8, cupY + 12, 16 + cupPulse * 2, 0, Math.PI * 2);
    ctx.fill();
    // Hologram Cup Body
    ctx.fillStyle = '#fdcb6e';
    ctx.fillRect(cupX + 2, cupY + 4, 12, 16);
    // Hologram Boba Pearls
    ctx.fillStyle = '#2d3436';
    ctx.fillRect(cupX + 4, cupY + 14, 3, 3);
    ctx.fillRect(cupX + 9, cupY + 13, 3, 3);
    ctx.fillRect(cupX + 6, cupY + 10, 3, 3);
    // Straw
    ctx.fillStyle = '#ff7675';
    ctx.fillRect(cupX + 7, cupY - 2, 2, 7);

    // Neon Headings on Billboard
    ctx.fillStyle = '#fdcb6e';
    ctx.font = 'bold 9px sans-serif';
    ctx.fillText('👑 HEEHEE GLOBAL EMPIRE', ledX + 54, ledY + 14);

    ctx.fillStyle = '#00cec9';
    ctx.font = 'bold 7.5px sans-serif';
    ctx.fillText('FRANCHISE: SÀI GÒN • TOKYO • SEOUL', ledX + 54, ledY + 26);

    // Moving News Ticker at bottom of Billboard
    const tickerText = '★ KHAI TRƯƠNG CHI NHÁNH NGUYỄN HUỆ ★ DOANH THU KỶ LỤC 100.000.000Đ ★ ĐẤU GIÁ TRÀ CỔ THỤ THƯỢNG HẠNG ★';
    ctx.font = '7px sans-serif';
    ctx.fillStyle = '#55efc4';
    const tickerW = ctx.measureText(tickerText).width;
    const tickerOffset = (this.tick * 0.8) % (tickerW + 40);
    ctx.fillText(tickerText, ledX + 54 - tickerOffset, ledY + 39);
    ctx.fillText(tickerText, ledX + 54 - tickerOffset + tickerW + 40, ledY + 39);

    ctx.restore();

    // 5. XE BUÝT 2 TẦNG CITY TOUR SÀI GÒN (DOUBLE-DECKER RED TOUR BUS)
    const busX = 188;
    const busY = 104;
    const busW = 68;
    const busH = 34;
    // Wheel shadows
    ctx.fillStyle = 'rgba(0,0,0,0.35)';
    ctx.fillRect(busX + 4, busY + busH, busW - 8, 3);
    // Lower deck (Đỏ tươi #d63031)
    ctx.fillStyle = (tod === 'night') ? '#a31b1b' : '#d63031';
    ctx.fillRect(busX, busY + 14, busW, 18);
    // Lower deck windows
    ctx.fillStyle = (tod === 'night') ? '#ffeaa7' : '#74b9ff';
    for (let bw = busX + 6; bw < busX + busW - 12; bw += 11) {
      ctx.fillRect(bw, busY + 17, 8, 8);
    }
    // Upper deck open-top railing & windscreen
    ctx.fillStyle = (tod === 'night') ? '#8c1616' : '#b71540';
    ctx.fillRect(busX, busY + 6, busW, 8);
    // Railing slats
    ctx.fillStyle = '#dfe6e9';
    for (let rx = busX + 4; rx < busX + busW - 6; rx += 7) {
      ctx.fillRect(rx, busY + 1, 1.5, 6);
    }
    ctx.fillRect(busX + 2, busY + 1, busW - 4, 1.5);
    // Passengers with Boba Cups on open-top deck
    ctx.fillStyle = '#f5cd79'; // Chibi face
    ctx.fillRect(busX + 16, busY - 3, 5, 5);
    ctx.fillRect(busX + 38, busY - 3, 5, 5);
    // Tiny boba cup
    ctx.fillStyle = '#fab1a0';
    ctx.fillRect(busX + 22, busY - 1, 2.5, 3.5);
    ctx.fillRect(busX + 44, busY - 1, 2.5, 3.5);
    // Front bus windshield
    ctx.fillStyle = (tod === 'night') ? '#ffeaa7' : '#81ecec';
    ctx.fillRect(busX + busW - 6, busY + 16, 5, 12);
    // Bus wheels
    ctx.fillStyle = '#2d3436';
    ctx.beginPath();
    ctx.arc(busX + 14, busY + 32, 5, 0, Math.PI * 2);
    ctx.arc(busX + busW - 16, busY + 32, 5, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#b2bec3';
    ctx.beginPath();
    ctx.arc(busX + 14, busY + 32, 2.2, 0, Math.PI * 2);
    ctx.arc(busX + busW - 16, busY + 32, 2.2, 0, Math.PI * 2);
    ctx.fill();
    // City Tour Banner
    ctx.fillStyle = '#fdcb6e';
    ctx.font = 'bold 5px sans-serif';
    ctx.fillText('SAIGON CITY TOUR', busX + 12, busY + 12);

    // 6. HÀNG CÂY CỌ DẦU HOÀNG GIA NHIỆT ĐỚI (SAIGON ROYAL PALMS)
    const palms = [156, 276, 396];
    palms.forEach((px, pidx) => {
      const pBaseY = 140;
      const pTopY = 76;
      // Slender curved trunk with segments
      ctx.fillStyle = (tod === 'night') ? '#3d3429' : '#8d6e63';
      const sway = Math.sin(this.tick * 0.04 + pidx * 1.5) * 2;
      ctx.fillRect(px, pTopY + 10, 3.5, pBaseY - (pTopY + 10));
      // Ring segments
      ctx.fillStyle = (tod === 'night') ? '#2c251c' : '#6d4c41';
      for (let ry = pTopY + 14; ry < pBaseY; ry += 6) {
        ctx.fillRect(px - 0.5, ry, 4.5, 1.2);
      }
      // Lush tropical fronds / palm leaves
      const frondCol = (tod === 'night') ? '#13281c' : '#10ac84';
      const frondLight = (tod === 'night') ? '#1e3f2d' : '#2ed573';
      ctx.fillStyle = frondCol;
      // Left fronds
      ctx.beginPath();
      ctx.ellipse(px - 14 + sway, pTopY + 6, 16, 5, -0.4, 0, Math.PI * 2);
      ctx.fill();
      ctx.beginPath();
      ctx.ellipse(px - 18 + sway, pTopY + 12, 14, 4, -0.15, 0, Math.PI * 2);
      ctx.fill();
      // Right fronds
      ctx.fillStyle = frondLight;
      ctx.beginPath();
      ctx.ellipse(px + 16 + sway, pTopY + 6, 16, 5, 0.4, 0, Math.PI * 2);
      ctx.fill();
      ctx.beginPath();
      ctx.ellipse(px + 19 + sway, pTopY + 12, 14, 4, 0.15, 0, Math.PI * 2);
      ctx.fill();
      // Upward frond
      ctx.beginPath();
      ctx.ellipse(px + 1 + sway, pTopY, 7, 12, 0, 0, Math.PI * 2);
      ctx.fill();
    });

    // 7. ĐÀI PHUN NƯỚC NHẠC NƯỚC NGUYỄN HUỆ (CHOREOGRAPHED MUSICAL FOUNTAIN)
    const fX = 312;
    const fW = 68;
    const fY = 127;
    // Granite pool rim
    ctx.fillStyle = (tod === 'night') ? '#2f3542' : '#747d8c';
    ctx.fillRect(fX, fY + 6, fW, 8);
    ctx.fillStyle = (tod === 'night') ? '#1e243b' : '#3742fa';
    ctx.fillRect(fX + 3, fY + 7, fW - 6, 5);

    // Water jets dancing with sinusoidal rhythm
    for (let ji = 0; ji < 7; ji++) {
      const jx = fX + 7 + ji * 8.5;
      const jHeight = 8 + Math.abs(Math.sin(this.tick * 0.14 + ji * 0.9)) * 14;
      // Colored LED underwater light shining through jet
      const ledCol = ji % 3 === 0 ? 'rgba(0, 206, 201, 0.75)' : (ji % 3 === 1 ? 'rgba(253, 121, 168, 0.75)' : 'rgba(254, 202, 87, 0.75)');
      ctx.fillStyle = ledCol;
      ctx.fillRect(jx - 0.5, fY + 6 - jHeight, 1.8, jHeight);
      // Top water droplets splash
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(jx - 1, fY + 5 - jHeight, 2.5, 2);
    }

    // 8. LUXURY GRANITE PROMENADE PAVEMENT (VỈA HÈ ĐÁ GRANITE & DẢI ĐÈN LED ÂM SÀN)
    const paveY = 138;
    const paveH = this.height - paveY;
    const paveGrad = ctx.createLinearGradient(0, paveY, 0, this.height);
    paveGrad.addColorStop(0, (tod === 'night') ? '#1e2430' : '#4b5563');
    paveGrad.addColorStop(1, (tod === 'night') ? '#11151e' : '#2d3436');
    ctx.fillStyle = paveGrad;
    ctx.fillRect(0, paveY, this.width, paveH);

    // Granite grid tiles
    ctx.fillStyle = (tod === 'night') ? '#2c3545' : '#636e72';
    for (let px = 0; px < this.width; px += 24) {
      ctx.fillRect(px, paveY, 1, paveH);
    }
    for (let py = paveY; py < this.height; py += 14) {
      ctx.fillRect(0, py, this.width, 1);
    }

    // Ground Embedded Dynamic LED Light Strips (Dải LED âm sàn hiện đại đổi màu)
    const stripY = paveY + 5;
    const stripHue = (this.tick * 2) % 360;
    ctx.fillStyle = `hsla(${stripHue}, 85%, 60%, 0.65)`;
    ctx.fillRect(0, stripY, this.width, 1.5);

    // Modern High-tech Lotus Street Lamps
    [120, 480, 680].forEach(lx => {
      const lBase = 140;
      // Stainless steel post
      ctx.fillStyle = '#dcdde1';
      ctx.fillRect(lx, 78, 2.5, lBase - 78);
      // Modern arm
      ctx.fillRect(lx - 4, 78, 10, 2);
      // Lamp head
      ctx.fillStyle = (tod === 'night') ? '#ffeaa7' : '#ffffff';
      ctx.fillRect(lx - 5, 80, 12, 3);
      if (tod === 'night') {
        // Soft aura
        ctx.fillStyle = 'rgba(255, 234, 167, 0.18)';
        ctx.beginPath();
        ctx.arc(lx + 1, 86, 18, 0, Math.PI * 2);
        ctx.fill();
      }
    });

    // Wet Road Men Pavement Reflective Sheen during rain
    if (isRain || isStorm) {
      ctx.fillStyle = 'rgba(223, 249, 251, 0.18)';
      ctx.fillRect(0, 134, this.width, 9);
    }

    // Summer night fireflies around promenade planters
    this.drawFireflies(ctx);
  }
};
