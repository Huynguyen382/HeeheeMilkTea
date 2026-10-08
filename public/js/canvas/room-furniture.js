/**
 * Room Furniture & Props Renderer
 * Handles TV console, teddy bear, pink sofa, coffee table,
 * boho embroidered rug, sleeping Shiba pet bed, plant stool, and side cabinet
 */

export const RoomFurniture = {
  /**
   * Left media console with retro CRT television & lower shelf
   */
  drawTvConsole(ctx, x, y, tvChannel) {
    ctx.save();
    const cw = 105;
    const ch = 48;
    const cx = x;
    const cy = y + 26;

    // Drop shadow
    ctx.fillStyle = 'rgba(15, 8, 5, 0.5)';
    ctx.fillRect(cx - 2, cy + ch - 2, cw + 4, 6);

    // Wooden Cabinet
    ctx.fillStyle = '#5d3826';
    ctx.fillRect(cx, cy, cw, ch);
    ctx.fillStyle = '#7a4b33';
    ctx.fillRect(cx - 3, cy - 3, cw + 6, 5);
    // Shelf divider
    ctx.fillStyle = '#3a2016';
    ctx.fillRect(cx + 4, cy + 6, cw - 8, ch - 14);
    // VCR Tuner / Game console inside lower shelf
    ctx.fillStyle = '#2d3436';
    ctx.fillRect(cx + 10, cy + 12, 38, 12);
    ctx.fillStyle = '#00cec9'; // power LED
    ctx.fillRect(cx + 14, cy + 17, 2, 2);
    // Stacked books in right shelf
    ctx.fillStyle = '#e74c3c';
    ctx.fillRect(cx + 62, cy + 10, 6, 18);
    ctx.fillStyle = '#f1c40f';
    ctx.fillRect(cx + 70, cy + 12, 5, 16);
    ctx.fillStyle = '#3498db';
    ctx.fillRect(cx + 77, cy + 9, 6, 19);

    // Console Wooden Legs
    ctx.fillStyle = '#3a2016';
    ctx.fillRect(cx + 6, cy + ch, 6, 8);
    ctx.fillRect(cx + cw - 12, cy + ch, 6, 8);

    // Retro CRT Television Set
    const tvW = 72;
    const tvH = 54;
    const tvX = cx + 16;
    const tvY = cy - tvH + 3;

    // Body
    ctx.fillStyle = '#2d3436';
    ctx.beginPath();
    ctx.roundRect(tvX, tvY, tvW, tvH, 6);
    ctx.fill();
    ctx.strokeStyle = '#636e72';
    ctx.lineWidth = 1.5;
    ctx.stroke();

    // Curved CRT Screen
    const scrX = tvX + 6;
    const scrY = tvY + 6;
    const scrW = 46;
    const scrH = 40;

    const scrGrad = ctx.createLinearGradient(scrX, scrY, scrX + scrW, scrY + scrH);
    scrGrad.addColorStop(0, '#00cec9');
    scrGrad.addColorStop(1, '#0984e3');
    ctx.fillStyle = scrGrad;
    ctx.beginPath();
    ctx.roundRect(scrX, scrY, scrW, scrH, 4);
    ctx.fill();

    // Channel icon
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 12px sans-serif';
    const channelIcons = ['🧋', '🌤️', '🎮', '💃'];
    ctx.fillText(channelIcons[tvChannel || 0], scrX + 16, scrY + 25);

    // Screen scanlines
    ctx.fillStyle = 'rgba(0, 0, 0, 0.15)';
    for (let sy = scrY; sy < scrY + scrH; sy += 3) {
      ctx.fillRect(scrX, sy, scrW, 1);
    }

    // Right Control Knobs
    ctx.fillStyle = '#b2bec3';
    ctx.beginPath();
    ctx.arc(tvX + 60, tvY + 14, 4, 0, Math.PI * 2);
    ctx.arc(tvX + 60, tvY + 26, 4, 0, Math.PI * 2);
    ctx.fill();

    // Rabbit-Ear Antenna
    ctx.strokeStyle = '#b2bec3';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(tvX + 36, tvY);
    ctx.lineTo(tvX + 18, tvY - 22);
    ctx.moveTo(tvX + 36, tvY);
    ctx.lineTo(tvX + 54, tvY - 22);
    ctx.stroke();

    ctx.restore();
  },

  /**
   * Chubby plush brown teddy bear sitting on floor
   */
  drawTeddyBear(ctx, x, y) {
    ctx.save();
    // Ground shadow
    ctx.fillStyle = 'rgba(15, 8, 5, 0.4)';
    ctx.beginPath();
    ctx.ellipse(x, y + 36, 24, 7, 0, 0, Math.PI * 2);
    ctx.fill();

    // Legs / Paws
    ctx.fillStyle = '#a06236';
    ctx.beginPath();
    ctx.ellipse(x - 14, y + 32, 10, 8, 0.3, 0, Math.PI * 2);
    ctx.ellipse(x + 14, y + 32, 10, 8, -0.3, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#e8ba8c';
    ctx.beginPath();
    ctx.arc(x - 14, y + 32, 4.5, 0, Math.PI * 2);
    ctx.arc(x + 14, y + 32, 4.5, 0, Math.PI * 2);
    ctx.fill();

    // Body
    ctx.fillStyle = '#b37748';
    ctx.beginPath();
    ctx.ellipse(x, y + 18, 20, 20, 0, 0, Math.PI * 2);
    ctx.fill();
    // Tummy patch
    ctx.fillStyle = '#e8ba8c';
    ctx.beginPath();
    ctx.ellipse(x, y + 20, 13, 14, 0, 0, Math.PI * 2);
    ctx.fill();

    // Head
    ctx.fillStyle = '#b37748';
    ctx.beginPath();
    ctx.arc(x, y - 2, 16, 0, Math.PI * 2);
    ctx.fill();

    // Ears
    ctx.fillStyle = '#a06236';
    ctx.beginPath();
    ctx.arc(x - 12, y - 16, 6, 0, Math.PI * 2);
    ctx.arc(x + 12, y - 16, 6, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#e8ba8c';
    ctx.beginPath();
    ctx.arc(x - 12, y - 16, 3.5, 0, Math.PI * 2);
    ctx.arc(x + 12, y - 16, 3.5, 0, Math.PI * 2);
    ctx.fill();

    // Snout
    ctx.fillStyle = '#f5deb3';
    ctx.beginPath();
    ctx.ellipse(x, y, 7.5, 6, 0, 0, Math.PI * 2);
    ctx.fill();
    // Nose
    ctx.fillStyle = '#1c0f0a';
    ctx.fillRect(x - 2.5, y - 3, 5, 3.5);

    // Beaded Eyes
    ctx.fillStyle = '#1c0f0a';
    ctx.beginPath();
    ctx.arc(x - 6, y - 5, 2.5, 0, Math.PI * 2);
    ctx.arc(x + 6, y - 5, 2.5, 0, Math.PI * 2);
    ctx.fill();
    // Eye shine
    ctx.fillStyle = '#fff';
    ctx.fillRect(x - 7, y - 6, 1.2, 1.2);
    ctx.fillRect(x + 5, y - 6, 1.2, 1.2);

    ctx.restore();
  },

  /**
   * Pastel pink 3-seat sofa with 3 pillows
   */
  drawPinkSofa(ctx, x, y) {
    ctx.save();
    const sw = 145;
    const sh = 65;

    // Drop shadow
    ctx.fillStyle = 'rgba(15, 8, 5, 0.4)';
    ctx.fillRect(x + 4, y + sh - 4, sw - 8, 8);

    // Wooden feet
    ctx.fillStyle = '#3a2016';
    ctx.fillRect(x + 12, y + sh, 8, 6);
    ctx.fillRect(x + sw - 20, y + sh, 8, 6);

    // Backrest Cushion
    ctx.fillStyle = '#f78da7';
    ctx.beginPath();
    ctx.roundRect(x + 6, y, sw - 12, 38, 8);
    ctx.fill();
    // Tufting lines
    ctx.fillStyle = '#e8728f';
    ctx.fillRect(x + Math.floor(sw * 0.35), y + 6, 2, 28);
    ctx.fillRect(x + Math.floor(sw * 0.65), y + 6, 2, 28);

    // Base Seat Cushion
    ctx.fillStyle = '#ff9eb5';
    ctx.beginPath();
    ctx.roundRect(x + 4, y + 30, sw - 8, 28, 6);
    ctx.fill();
    ctx.fillStyle = '#e8728f';
    ctx.fillRect(x + 4, y + 44, sw - 8, 2);

    // Rounded Armrests
    ctx.fillStyle = '#f78da7';
    ctx.beginPath();
    ctx.roundRect(x - 6, y + 16, 18, 42, 7);
    ctx.roundRect(x + sw - 12, y + 16, 18, 42, 7);
    ctx.fill();
    ctx.strokeStyle = '#e8728f';
    ctx.lineWidth = 1.2;
    ctx.stroke();

    // 3 Pastel Throw Pillows
    // Pillow 1 (Left): Pastel Mint Green
    ctx.fillStyle = '#a8e6cf';
    ctx.beginPath();
    ctx.roundRect(x + 15, y + 15, 20, 20, 4);
    ctx.fill();

    // Pillow 2 (Middle): Pastel Lavender
    ctx.fillStyle = '#dcd6f7';
    ctx.beginPath();
    ctx.roundRect(x + 36, y + 18, 22, 20, 4);
    ctx.fill();

    // Pillow 3 (Right): Pastel Butter Yellow
    ctx.fillStyle = '#ffeaa7';
    ctx.beginPath();
    ctx.roundRect(x + sw - 36, y + 16, 22, 20, 4);
    ctx.fill();

    ctx.restore();
  },

  /**
   * Oval wooden coffee table with drink & book stack
   */
  drawCoffeeTable(ctx, x, y) {
    ctx.save();
    const tw = 76;
    const th = 28;

    // Drop shadow
    ctx.fillStyle = 'rgba(15, 8, 5, 0.45)';
    ctx.beginPath();
    ctx.ellipse(x + tw / 2, y + th + 4, tw / 2 + 2, 8, 0, 0, Math.PI * 2);
    ctx.fill();

    // Table legs
    ctx.fillStyle = '#3a2016';
    ctx.fillRect(x + 12, y + th - 2, 5, 12);
    ctx.fillRect(x + tw - 17, y + th - 2, 5, 12);

    // Tabletop rim & surface
    ctx.fillStyle = '#5d3826';
    ctx.beginPath();
    ctx.ellipse(x + tw / 2, y + th / 2 + 2, tw / 2, th / 2, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#784730';
    ctx.beginPath();
    ctx.ellipse(x + tw / 2, y + th / 2, tw / 2, th / 2, 0, 0, Math.PI * 2);
    ctx.fill();

    // Glass of water / tea with straw
    const gx = x + 18;
    const gy = y - 2;
    ctx.fillStyle = 'rgba(255, 255, 255, 0.85)';
    ctx.fillRect(gx, gy, 9, 13);
    ctx.fillStyle = '#74b9ff';
    ctx.fillRect(gx + 1, gy + 3, 7, 9);
    ctx.fillStyle = '#ff7675';
    ctx.fillRect(gx + 4, gy - 6, 2, 8);

    // Stack of 3 colorful books on table
    const bx = x + 44;
    const by = y - 4;
    ctx.fillStyle = '#2980b9';
    ctx.fillRect(bx, by + 8, 22, 5);
    ctx.fillStyle = '#27ae60';
    ctx.fillRect(bx + 1, by + 4, 20, 5);
    ctx.fillStyle = '#e67e22';
    ctx.fillRect(bx + 3, by, 17, 5);
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(bx + 2, by + 2, 2, 10);

    ctx.restore();
  },

  /**
   * Ornate embroidered boho oval rug
   */
  drawBohoRug(ctx, rx, ry, rw = 135, rh = 40) {
    ctx.save();
    // Drop shadow
    ctx.fillStyle = 'rgba(20, 10, 8, 0.45)';
    ctx.beginPath();
    ctx.ellipse(rx, ry + 2, rw + 2, rh + 2, 0, 0, Math.PI * 2);
    ctx.fill();

    // Outer warm coral-terracotta base
    ctx.fillStyle = '#d35400';
    ctx.beginPath();
    ctx.ellipse(rx, ry, rw, rh, 0, 0, Math.PI * 2);
    ctx.fill();

    // Secondary lighter warm layer
    ctx.fillStyle = '#e17055';
    ctx.beginPath();
    ctx.ellipse(rx, ry, rw - 4, rh - 3, 0, 0, Math.PI * 2);
    ctx.fill();

    // Intricate ornamental embroidered floral border lace
    ctx.strokeStyle = '#f8c291';
    ctx.lineWidth = 1.6;
    ctx.beginPath();
    ctx.ellipse(rx, ry, rw - 14, rh - 9, 0, 0, Math.PI * 2);
    ctx.stroke();

    // Decorative embroidered pattern leaf notches
    ctx.fillStyle = '#ffeaa7';
    const totalLeaves = 26;
    for (let i = 0; i < totalLeaves; i++) {
      const angle = (i / totalLeaves) * Math.PI * 2;
      const lx = rx + Math.cos(angle) * (rw - 14);
      const ly = ry + Math.sin(angle) * (rh - 9);
      ctx.beginPath();
      ctx.arc(lx, ly, 1.8, 0, Math.PI * 2);
      ctx.fill();
    }

    // Inner smooth plain center
    ctx.fillStyle = '#e17055';
    ctx.beginPath();
    ctx.ellipse(rx, ry, rw - 26, rh - 15, 0, 0, Math.PI * 2);
    ctx.fill();

    ctx.restore();
  },

  /**
   * Sleeping Shiba Inu in circular pet bed
   */
  drawPetBed(ctx, x, y, tick, petHappyTimer) {
    ctx.save();
    const pw = 42;
    const ph = 22;

    // Drop shadow
    ctx.fillStyle = 'rgba(15, 8, 5, 0.4)';
    ctx.beginPath();
    ctx.ellipse(x + pw, y + ph + 2, pw + 3, ph + 2, 0, 0, Math.PI * 2);
    ctx.fill();

    // Wooden rim bed
    ctx.fillStyle = '#d35400';
    ctx.beginPath();
    ctx.ellipse(x + pw, y + ph, pw, ph, 0, 0, Math.PI * 2);
    ctx.fill();

    // Turquoise plush cushion
    ctx.fillStyle = '#00cec9';
    ctx.beginPath();
    ctx.ellipse(x + pw, y + ph, pw - 8, ph - 5, 0, 0, Math.PI * 2);
    ctx.fill();

    // Sleeping Shiba Inu curled up
    const shibaX = x + pw;
    const shibaY = y + ph - 2;

    // Gentle breathing jump
    const breath = Math.sin(tick * 0.08) * 1.2;

    // Shiba body (orange fur)
    ctx.fillStyle = '#e67e22';
    ctx.beginPath();
    ctx.ellipse(shibaX, shibaY + breath, 18, 11, 0, 0, Math.PI * 2);
    ctx.fill();

    // White chest & belly
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.ellipse(shibaX + 4, shibaY + 2 + breath, 10, 6, 0.4, 0, Math.PI * 2);
    ctx.fill();

    // Shiba Head
    ctx.fillStyle = '#e67e22';
    ctx.beginPath();
    ctx.arc(shibaX - 10, shibaY - 3 + breath, 9, 0, Math.PI * 2);
    ctx.fill();

    // White snout & cheeks
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.ellipse(shibaX - 13, shibaY + breath, 5, 4, 0, 0, Math.PI * 2);
    ctx.fill();
    // Black nose
    ctx.fillStyle = '#1c0f0a';
    ctx.fillRect(shibaX - 16, shibaY - 1 + breath, 3, 2.5);

    // Pointy Shiba Ears
    ctx.fillStyle = '#d35400';
    ctx.beginPath();
    ctx.moveTo(shibaX - 14, shibaY - 10 + breath);
    ctx.lineTo(shibaX - 11, y - 17 + breath);
    ctx.lineTo(shibaX - 7, shibaY - 9 + breath);
    ctx.fill();

    // Peaceful sleeping eye curve
    ctx.strokeStyle = '#1c0f0a';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.arc(shibaX - 9, shibaY - 3 + breath, 2, 0, Math.PI);
    ctx.stroke();

    // Sleep Zzz bubbles if not cheered
    if (petHappyTimer <= 0) {
      ctx.fillStyle = '#a29bfe';
      ctx.font = 'bold 9px sans-serif';
      const zY = (tick * 0.25) % 10;
      ctx.fillText('z', shibaX + 16, shibaY - 6 - zY);
    }

    ctx.restore();
  },

  /**
   * Potted houseplant on 3-legged wooden stool
   */
  drawPlantStool(ctx, x, y) {
    ctx.save();
    const sx = x + 12;
    const sy = y + 26;
    ctx.fillStyle = '#5d3826';
    ctx.beginPath();
    ctx.ellipse(sx, sy, 14, 5, 0, 0, Math.PI * 2);
    ctx.fill();

    // 3 Stool legs
    ctx.fillStyle = '#3a2016';
    ctx.fillRect(sx - 10, sy + 2, 4, 18);
    ctx.fillRect(sx - 1, sy + 2, 4, 18);
    ctx.fillRect(sx + 7, sy + 2, 4, 18);

    // Terracotta Pot
    ctx.fillStyle = '#d35400';
    ctx.fillRect(sx - 9, sy - 14, 18, 14);
    ctx.fillStyle = '#e67e22';
    ctx.fillRect(sx - 11, sy - 17, 22, 4);

    // Lush Green Houseplant Leaves
    ctx.fillStyle = '#27ae60';
    ctx.beginPath();
    ctx.arc(sx, sy - 22, 12, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = '#2ecc71';
    ctx.beginPath();
    ctx.arc(sx - 6, sy - 26, 8, 0, Math.PI * 2);
    ctx.arc(sx + 6, sy - 26, 8, 0, Math.PI * 2);
    ctx.arc(sx, sy - 30, 7, 0, Math.PI * 2);
    ctx.fill();

    ctx.restore();
  },

  /**
   * Right side cabinet with vintage lamp, photo & flower vase
   */
  drawSideCabinet(ctx, x, y, lampOn) {
    ctx.save();
    const cw = 68;
    const ch = 55;

    // Drop shadow
    ctx.fillStyle = 'rgba(15, 8, 5, 0.4)';
    ctx.fillRect(x - 2, y + ch, cw + 4, 6);

    // Wooden Cabinet
    ctx.fillStyle = '#5d3826';
    ctx.fillRect(x, y, cw, ch);
    ctx.fillStyle = '#7a4b33';
    ctx.fillRect(x - 2, y - 2, cw + 4, 5);

    // 2-Door frame & brass hardware
    ctx.fillStyle = '#422416';
    ctx.fillRect(x + 4, y + 8, cw / 2 - 6, ch - 14);
    ctx.fillRect(x + cw / 2 + 2, y + 8, cw / 2 - 6, ch - 14);
    ctx.fillStyle = '#f1c40f';
    ctx.fillRect(x + cw / 2 - 6, y + 24, 2, 5);
    ctx.fillRect(x + cw / 2 + 4, y + 24, 2, 5);

    // Feet
    ctx.fillStyle = '#3a2016';
    ctx.fillRect(x + 4, y + ch, 6, 6);
    ctx.fillRect(x + cw - 10, y + ch, 6, 6);

    // Tabletop Items:
    // 1. Vintage Bedside Lamp
    const lampX = x + 16;
    const lampY = y - 40;

    ctx.fillStyle = '#f1c40f';
    ctx.fillRect(lampX + 6, lampY + 28, 4, 12);
    ctx.beginPath();
    ctx.arc(lampX + 8, lampY + 40, 6, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = lampOn ? '#fff9db' : '#dcdde1';
    ctx.beginPath();
    ctx.moveTo(lampX + 3, lampY + 28);
    ctx.lineTo(lampX - 4, lampY + 38);
    ctx.lineTo(lampX + 20, lampY + 38);
    ctx.lineTo(lampX + 13, lampY + 28);
    ctx.closePath();
    ctx.fill();

    // Warm radial glow halo
    if (lampOn) {
      const lampGlow = ctx.createRadialGradient(lampX + 8, lampY + 35, 4, lampX + 8, lampY + 35, 48);
      lampGlow.addColorStop(0, 'rgba(255, 245, 160, 0.7)');
      lampGlow.addColorStop(0.5, 'rgba(255, 230, 110, 0.25)');
      lampGlow.addColorStop(1, 'rgba(255, 230, 110, 0)');
      ctx.fillStyle = lampGlow;
      ctx.beginPath();
      ctx.arc(lampX + 8, lampY + 35, 48, 0, Math.PI * 2);
      ctx.fill();
    }

    // 2. Mini Picture Frame
    ctx.fillStyle = '#3a2016';
    ctx.fillRect(x + 36, y - 16, 12, 16);
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(x + 38, y - 14, 8, 12);

    // 3. Ceramic Vase with Pink Flowers
    const vaseX = x + 54;
    const vaseY = y - 18;
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.arc(vaseX + 5, vaseY + 12, 5, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#ff7675';
    ctx.beginPath();
    ctx.arc(vaseX + 3, vaseY + 4, 3, 0, Math.PI * 2);
    ctx.arc(vaseX + 8, vaseY + 3, 3, 0, Math.PI * 2);
    ctx.fill();

    ctx.restore();
  }
};

