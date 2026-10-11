// Bối Cảnh Nông Trại Chè Mộc Châu (Tea Farm Scene)
import { staticBgCache } from './cache.js';

export const mocChauMethods = {
  drawMocChauTeaFarmBackground(ctx, tod) {
    const isStorm = this.weather && this.weather.id === 'stormy';
    const isRain = this.weather && this.weather.id === 'rainy';
    const isCloudy = this.weather && this.weather.id === 'cloudy';
    const isWindy = this.weather && this.weather.id === 'windy';

    // 1. SKY GRADIENT MOUNTAIN HORIZON
    const skyGrad = ctx.createLinearGradient(0, 0, 0, 145);
    if (isStorm) {
      skyGrad.addColorStop(0, '#0a0a14');
      skyGrad.addColorStop(0.5, '#19152b');
      skyGrad.addColorStop(1, '#2e2544');
    } else if (isRain) {
      skyGrad.addColorStop(0, '#2d3436');
      skyGrad.addColorStop(0.5, '#4b6584');
      skyGrad.addColorStop(1, '#778ca3');
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
      skyGrad.addColorStop(0, '#74b9ff');
      skyGrad.addColorStop(0.4, '#a8e6cf');
      skyGrad.addColorStop(0.75, '#f5cd79');
      skyGrad.addColorStop(1, '#ffeaa7');
    } else if (tod === 'noon') {
      skyGrad.addColorStop(0, '#0984e3');
      skyGrad.addColorStop(0.4, '#74b9ff');
      skyGrad.addColorStop(0.8, '#81ecec');
      skyGrad.addColorStop(1, '#dff9fb');
    } else if (tod === 'afternoon') {
      skyGrad.addColorStop(0, '#2c003e');
      skyGrad.addColorStop(0.35, '#8e44ad');
      skyGrad.addColorStop(0.7, '#d35400');
      skyGrad.addColorStop(1, '#f1c40f');
    } else {
      skyGrad.addColorStop(0, '#0c0612');
      skyGrad.addColorStop(0.5, '#1e0c24');
      skyGrad.addColorStop(1, '#3b1638');
    }
    ctx.fillStyle = skyGrad;
    ctx.fillRect(0, 0, this.width, 145);

    // 2. CELESTIAL BODIES (SUN / MOON)
    if (tod === 'night') {
      ctx.fillStyle = '#fff4cc';
      ctx.beginPath();
      ctx.arc(48, 26, 10, 0, Math.PI * 2);
      ctx.fill();
    } else if (!isStorm && !isRain) {
      const sx = tod === 'morning' ? 55 : (tod === 'noon' ? 180 : 65);
      const sy = tod === 'morning' ? 30 : (tod === 'noon' ? 20 : 45);
      if (isCloudy) {
        ctx.fillStyle = 'rgba(255, 255, 255, 0.35)';
        ctx.beginPath();
        ctx.arc(sx, sy, 14, 0, Math.PI * 2);
        ctx.fill();
      } else {
        ctx.fillStyle = '#ffffff';
        ctx.beginPath();
        ctx.arc(sx, sy, 10, 0, Math.PI * 2);
        ctx.fill();
      }
    }

    this.drawClouds(ctx, tod);
    if ((tod === 'morning' || tod === 'afternoon') && (!isStorm && !isRain && !isCloudy)) {
      this.drawGodRays(ctx, tod);
    }

    // 3. TÂY BẮC LIMESTONE KARST PEAKS IN FAR SILHOUETTE
    const mountainShade = (tod === 'night') ? '#131b24' : '#576574';
    ctx.fillStyle = mountainShade;
    ctx.beginPath();
    ctx.moveTo(0, 85);
    ctx.lineTo(60, 48);
    ctx.lineTo(130, 72);
    ctx.lineTo(210, 42);
    ctx.lineTo(290, 68);
    ctx.lineTo(390, 38);
    ctx.lineTo(490, 74);
    ctx.lineTo(590, 44);
    ctx.lineTo(680, 66);
    ctx.lineTo(this.width, 52);
    ctx.lineTo(this.width, 145);
    ctx.lineTo(0, 145);
    ctx.closePath();
    ctx.fill();

    // Drifting mountain sea of clouds (Biển mây Tây Bắc)
    ctx.fillStyle = (tod === 'night') ? 'rgba(30, 40, 50, 0.4)' : 'rgba(255, 255, 255, 0.45)';
    ctx.beginPath();
    ctx.ellipse(180, 78, 120, 16, 0, 0, Math.PI * 2);
    ctx.ellipse(450, 75, 140, 18, 0, 0, Math.PI * 2);
    ctx.fill();

    // 4. MỘC CHÂU TERRACED TEA HILLS (ĐỒI CHÈ TRÁI TIM BẬC THANG UỐN LƯỢN)
    // 4 undulating layers of tea terraces
    const teaTiers = [
      { y: 72,  h: 22, col: '#1b5e20', wave: 18 },
      { y: 92,  h: 25, col: '#2e7d32', wave: 24 },
      { y: 114, h: 28, col: '#388e3c', wave: 30 },
      { y: 136, h: 32, col: '#4caf50', wave: 36 }
    ];

    teaTiers.forEach((tier, tIdx) => {
      ctx.fillStyle = (tod === 'night') ? '#102517' : tier.col;
      ctx.beginPath();
      ctx.moveTo(0, tier.y);
      for (let tx = 0; tx <= this.width; tx += 20) {
        const ty = tier.y + Math.sin(tx * 0.015 + tIdx) * 6;
        ctx.lineTo(tx, ty);
      }
      ctx.lineTo(this.width, 145);
      ctx.lineTo(0, 145);
      ctx.closePath();
      ctx.fill();

      // Curved rows of tea bushes (Luống chè bán nguyệt uốn lượn Parallax)
      ctx.strokeStyle = (tod === 'night') ? '#0c1a11' : '#1b5e20';
      ctx.lineWidth = 1.5;
      for (let tx = 10; tx < this.width; tx += 18) {
        ctx.beginPath();
        ctx.arc(tx, tier.y + 6, 7, Math.PI * 0.8, Math.PI * 0.2, true);
        ctx.stroke();
      }

      // Sparking morning dewdrops on young tea buds (Búp non ngậm sương)
      if (tod === 'morning' || tod === 'noon') {
        ctx.fillStyle = '#a8e6cf';
        for (let di = 0; di < 12; di++) {
          const dx = (di * 58 + tIdx * 14) % this.width;
          const dy = tier.y + 4 + (di % 4) * 3;
          ctx.fillRect(dx, dy, 2, 2);
        }
      }
    });

    // 5. RUSTIC WOODEN STILT HOUSE WITH GENTLE WOODSMOKE (NHÀ SÀN GỖ & KHÓI LAM CHIỀU)
    const houseX = 540;
    const houseY = 96;
    // Wooden stilt stilts
    ctx.fillStyle = '#5d4037';
    ctx.fillRect(houseX + 4, houseY + 22, 3, 16);
    ctx.fillRect(houseX + 38, houseY + 22, 3, 16);
    ctx.fillRect(houseX + 21, houseY + 22, 3, 16);
    // House body
    ctx.fillStyle = '#795548';
    ctx.fillRect(houseX, houseY + 8, 45, 16);
    // Palm leaf thatch roof
    ctx.fillStyle = '#a1887f';
    ctx.beginPath();
    ctx.moveTo(houseX - 5, houseY + 8);
    ctx.lineTo(houseX + 22.5, houseY - 8);
    ctx.lineTo(houseX + 50, houseY + 8);
    ctx.closePath();
    ctx.fill();
    // Door & window
    ctx.fillStyle = '#3e2723';
    ctx.fillRect(houseX + 8, houseY + 12, 6, 6);
    ctx.fillRect(houseX + 28, houseY + 12, 8, 12);
    // Smoke chimney & wafting woodsmoke
    ctx.fillStyle = '#bcaaa4';
    ctx.fillRect(houseX + 34, houseY - 14, 3, 8);
    // Rising woodsmoke
    ctx.fillStyle = 'rgba(236, 240, 241, 0.35)';
    for (let sm = 0; sm < 4; sm++) {
      const smY = houseY - 16 - sm * 7 - ((this.tick * 0.3) % 12);
      const smX = houseX + 35 + Math.sin(this.tick * 0.05 + sm) * 4;
      ctx.beginPath();
      ctx.arc(smX, smY, 3 + sm * 1.5, 0, Math.PI * 2);
      ctx.fill();
    }

    // 6. GROUND EMBANKMENT FOR TEA WORKERS & CARTS
    const gY = 142;
    ctx.fillStyle = (tod === 'night') ? '#1e241b' : '#3e2723';
    ctx.fillRect(0, gY, this.width, this.height - gY);
    ctx.fillStyle = (tod === 'night') ? '#2e3a2b' : '#5d4037';
    ctx.fillRect(0, gY, this.width, 3);

    // Grassy edge
    ctx.fillStyle = '#2ecc71';
    for (let gx = 0; gx < this.width; gx += 8) {
      ctx.fillRect(gx, gY - 1, 4, 2);
    }

    this.drawFireflies(ctx);
  }
};
