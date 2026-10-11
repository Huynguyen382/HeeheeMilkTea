// Atmospheric and Weather Effects for GameCanvas
// Clouds, God Rays, Fireflies, and Street Lamps

export const atmosphereMethods = {
  drawClouds(ctx, tod) {
    const isStorm = this.weather && this.weather.id === 'stormy';
    const isRain = this.weather && this.weather.id === 'rainy';
    const isCloudy = this.weather && this.weather.id === 'cloudy';
    const isWindy = this.weather && this.weather.id === 'windy';
    if (tod === 'night' && !isStorm && !isRain && !isCloudy) return; // Buổi tối quang đãng dùng trăng sao
    if (!Array.isArray(this.clouds)) return;

    this.clouds.forEach(c => {
      let topColor = '#ffffff';
      let bottomColor = '#dfe6e9';
      let alpha = 0.88;

      if (isStorm) {
        topColor = '#485460';
        bottomColor = '#1e272e';
        alpha = 0.98;
      } else if (isRain) {
        topColor = '#808e9b';
        bottomColor = '#485460';
        alpha = 0.92;
      } else if (isCloudy) {
        topColor = '#d2dae2';
        bottomColor = '#808e9b';
        alpha = 0.96;
      } else if (isWindy) {
        topColor = '#f5f6fa';
        bottomColor = '#dcdde1';
        alpha = 0.85;
      } else if (tod === 'morning') {
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

  drawStreetLamp(ctx) {
    const curScene = (typeof this.getEffectiveScene === 'function') 
      ? this.getEffectiveScene() 
      : (this.sceneSetting || 'town');
    // Street lamps for Old Quarter (town) should only be drawn in town scene
    // Other scenes (HUST, walking_street, franchise, moc_chau) have their own custom lighting and campus structures
    if (curScene !== 'town') return;

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

  drawGodRays(ctx, tod) {
    ctx.save();
    ctx.globalCompositeOperation = 'screen';
    const isMorning = (tod === 'morning');
    const rayColor = isMorning ? 'rgba(255, 245, 180, ' : 'rgba(255, 160, 100, ';
    const originX = isMorning ? 55 : 65;
    const originY = isMorning ? 32 : 55;

    // 4 Dynamic volumetric light shafts sweeping across the sky
    const rayAngles = [-0.15, 0.22, 0.58, 0.95];
    rayAngles.forEach((baseAngle, idx) => {
      const pulse = Math.sin(this.tick * 0.04 + idx * 1.5) * 0.04 + 0.12;
      const angle = baseAngle + Math.sin(this.tick * 0.02 + idx) * 0.05;
      const length = 280;
      const spread = 24;

      const grad = ctx.createLinearGradient(originX, originY, originX + Math.cos(angle) * length, originY + Math.sin(angle) * length);
      grad.addColorStop(0, rayColor + (pulse * 1.6) + ')');
      grad.addColorStop(0.5, rayColor + (pulse * 0.8) + ')');
      grad.addColorStop(1, rayColor + '0)');

      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.moveTo(originX, originY);
      ctx.lineTo(originX + Math.cos(angle - 0.08) * length - spread, originY + Math.sin(angle - 0.08) * length);
      ctx.lineTo(originX + Math.cos(angle + 0.08) * length + spread, originY + Math.sin(angle + 0.08) * length);
      ctx.closePath();
      ctx.fill();
    });

    // Golden sun dust motes dancing within God Rays (Bụi nắng vàng lấp lánh khiêu vũ)
    if (isMorning) {
      ctx.fillStyle = '#FFF9A6';
      for (let di = 0; di < 18; di++) {
        const dX = (originX + 20 + (di * 19) + Math.sin(this.tick * 0.03 + di) * 16) % this.width;
        const dY = (originY + 10 + (di * 8) + Math.cos(this.tick * 0.04 + di * 2) * 14) % 135;
        const dAlpha = (Math.sin(this.tick * 0.08 + di) + 1) * 0.35 + 0.2;
        ctx.globalAlpha = dAlpha;
        ctx.fillRect(dX, dY, (di % 2 === 0 ? 1.5 : 2), (di % 2 === 0 ? 1.5 : 2));
      }
    }
    ctx.restore();
  },

  drawFireflies(ctx) {
    const isNight = this.getTimeOfDay() === 'night';
    const isStorm = this.weather && (this.weather.id === 'stormy' || this.weather.id === 'rainy');
    if (!isNight || isStorm) return;

    ctx.save();
    for (let fi = 0; fi < 16; fi++) {
      const fx = (fi * 48 + Math.sin(this.tick * 0.04 + fi * 1.8) * 22) % this.width;
      const fy = 120 + Math.sin(this.tick * 0.06 + fi * 2.3) * 20;
      const pulse = (Math.sin(this.tick * 0.12 + fi * 1.2) + 1) * 0.45;
      if (pulse > 0.08) {
        // Soft firefly glow aura (ánh sáng xanh chuối #A3E635)
        ctx.fillStyle = `rgba(163, 230, 53, ${pulse * 0.45})`;
        ctx.beginPath();
        ctx.arc(fx, fy, 4, 0, Math.PI * 2);
        ctx.fill();
        // Firefly spark
        ctx.fillStyle = '#D9F99D';
        ctx.fillRect(fx - 0.5, fy - 0.5, 1.5, 1.5);
      }
    }
    ctx.restore();
  }
};

