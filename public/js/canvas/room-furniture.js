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
    ctx.fillStyle = 'rgba(15, 8, 5, 0.35)';
    ctx.beginPath();
    ctx.ellipse(x + sw / 2, y + sh + 2, sw / 2 - 2, 7, 0, 0, Math.PI * 2);
    ctx.fill();

    // Turned wooden feet with brass caps
    [-1, 1].forEach(side => {
      const legX = side === -1 ? x + 16 : x + sw - 24;
      ctx.fillStyle = '#4a2810';
      ctx.fillRect(legX, y + sh - 2, 7, 8);
      ctx.fillStyle = '#f59e0b'; // brass cap
      ctx.fillRect(legX, y + sh + 4, 7, 2);
    });

    // Backrest Cushion with velvet depth gradient
    const backGrad = ctx.createLinearGradient(0, y, 0, y + 38);
    backGrad.addColorStop(0, '#f9a8d4');
    backGrad.addColorStop(1, '#f472b6');
    ctx.fillStyle = backGrad;
    ctx.beginPath();
    if (ctx.roundRect) {
      ctx.roundRect(x + 6, y, sw - 12, 38, [10, 10, 4, 4]);
    } else {
      ctx.rect(x + 6, y, sw - 12, 38);
    }
    ctx.fill();

    // Diamond Button-Tufting creases & buttons
    const tuftXCols = [x + 28, x + 52, x + 76, x + 100, x + 122];
    ctx.fillStyle = '#db2777';
    tuftXCols.forEach((tx, idx) => {
      const ty = (idx % 2 === 0) ? y + 14 : y + 24;
      // Button
      ctx.beginPath();
      ctx.arc(tx, ty, 2, 0, Math.PI * 2);
      ctx.fill();
      // Crease lines
      ctx.strokeStyle = 'rgba(219, 39, 119, 0.4)';
      ctx.lineWidth = 0.8;
      ctx.beginPath();
      ctx.moveTo(tx - 6, ty - 6); ctx.lineTo(tx + 6, ty + 6);
      ctx.moveTo(tx + 6, ty - 6); ctx.lineTo(tx - 6, ty + 6);
      ctx.stroke();
    });

    // Base Seat Cushion with velvet plush volume
    const seatGrad = ctx.createLinearGradient(0, y + 28, 0, y + 58);
    seatGrad.addColorStop(0, '#fbcfe8');
    seatGrad.addColorStop(1, '#f472b6');
    ctx.fillStyle = seatGrad;
    ctx.beginPath();
    if (ctx.roundRect) {
      ctx.roundRect(x + 4, y + 28, sw - 8, 30, [6, 6, 8, 8]);
    } else {
      ctx.rect(x + 4, y + 28, sw - 8, 30);
    }
    ctx.fill();

    // Piped cushion seam
    ctx.strokeStyle = '#f43f5e';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(x + 5, y + 43);
    ctx.lineTo(x + sw - 5, y + 43);
    ctx.stroke();

    // Rounded Plush Armrests
    [-1, 1].forEach(side => {
      const armX = side === -1 ? x - 6 : x + sw - 12;
      const armGrad = ctx.createLinearGradient(armX, y + 14, armX + 18, y + 14);
      armGrad.addColorStop(0, side === -1 ? '#fbcfe8' : '#ec4899');
      armGrad.addColorStop(1, side === -1 ? '#ec4899' : '#fbcfe8');
      ctx.fillStyle = armGrad;
      ctx.beginPath();
      if (ctx.roundRect) {
        ctx.roundRect(armX, y + 14, 18, 44, 9);
      } else {
        ctx.rect(armX, y + 14, 18, 44);
      }
      ctx.fill();
      ctx.strokeStyle = 'rgba(225, 29, 72, 0.4)';
      ctx.lineWidth = 1;
      ctx.stroke();
    });

    // 3 Pastel Throw Pillows with plush shadows
    // Pillow 1 (Left): Pastel Mint Green (slight rotation)
    ctx.save();
    ctx.translate(x + 24, y + 24);
    ctx.rotate(-0.1);
    ctx.fillStyle = '#a7f3d0';
    ctx.beginPath();
    if (ctx.roundRect) ctx.roundRect(-10, -10, 20, 20, 5);
    else ctx.rect(-10, -10, 20, 20);
    ctx.fill();
    ctx.fillStyle = '#34d399';
    ctx.beginPath();
    ctx.arc(0, 0, 1.8, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();

    // Pillow 2 (Middle): Pastel Lavender
    ctx.save();
    ctx.translate(x + 54, y + 26);
    ctx.fillStyle = '#e9d5ff';
    ctx.beginPath();
    if (ctx.roundRect) ctx.roundRect(-11, -10, 22, 20, 5);
    else ctx.rect(-11, -10, 22, 20);
    ctx.fill();
    ctx.fillStyle = '#c084fc';
    ctx.beginPath();
    ctx.arc(0, 0, 1.8, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();

    // Pillow 3 (Right): Pastel Butter Yellow
    ctx.save();
    ctx.translate(x + sw - 28, y + 24);
    ctx.rotate(0.12);
    ctx.fillStyle = '#fef08a';
    ctx.beginPath();
    if (ctx.roundRect) ctx.roundRect(-11, -10, 22, 20, 5);
    else ctx.rect(-11, -10, 22, 20);
    ctx.fill();
    ctx.fillStyle = '#facc15';
    ctx.beginPath();
    ctx.arc(0, 0, 1.8, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();

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
    ctx.fillStyle = 'rgba(15, 8, 5, 0.35)';
    ctx.beginPath();
    ctx.ellipse(x + pw, y + ph + 3, pw + 3, ph + 1.5, 0, 0, Math.PI * 2);
    ctx.fill();

    // Natural woven wicker basket bed rim
    ctx.fillStyle = '#b45309';
    ctx.beginPath();
    ctx.ellipse(x + pw, y + ph, pw, ph, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#d97706';
    ctx.beginPath();
    ctx.ellipse(x + pw, y + ph - 1, pw - 2, ph - 2, 0, 0, Math.PI * 2);
    ctx.fill();

    // Plush Sherpa fleece cloud cushion
    const fleeceGrad = ctx.createRadialGradient(x + pw, y + ph, 2, x + pw, y + ph, pw - 6);
    fleeceGrad.addColorStop(0, '#e0f2fe');
    fleeceGrad.addColorStop(0.7, '#bae6fd');
    fleeceGrad.addColorStop(1, '#7dd3fc');
    ctx.fillStyle = fleeceGrad;
    ctx.beginPath();
    ctx.ellipse(x + pw, y + ph, pw - 7, ph - 4.5, 0, 0, Math.PI * 2);
    ctx.fill();

    // Cushion stitch tufts with tiny star indentations
    ctx.fillStyle = '#0284c7';
    [-15, 0, 15].forEach(ox => {
      ctx.beginPath();
      ctx.arc(x + pw + ox, y + ph + 2, 1.5, 0, Math.PI * 2);
      ctx.fill();
    });

    // Sleeping Shiba Inu curled up
    const shibaX = x + pw;
    const shibaY = y + ph - 2;

    // Gentle breathing rhythm
    const breath = Math.sin(tick * 0.08) * 1.2;

    // Body shadow underneath curled dog
    ctx.fillStyle = 'rgba(2, 132, 199, 0.35)';
    ctx.beginPath();
    ctx.ellipse(shibaX + 2, shibaY + 7, 16, 5, 0, 0, Math.PI * 2);
    ctx.fill();

    // Shiba body (warm amber-chestnut coat)
    const bodyGrad = ctx.createLinearGradient(shibaX - 16, shibaY - 10, shibaX + 16, shibaY + 10);
    bodyGrad.addColorStop(0, '#f97316');
    bodyGrad.addColorStop(0.6, '#ea580c');
    bodyGrad.addColorStop(1, '#c2410c');
    ctx.fillStyle = bodyGrad;
    ctx.beginPath();
    ctx.ellipse(shibaX, shibaY + breath, 18.5, 11.5, 0, 0, Math.PI * 2);
    ctx.fill();

    // Fur tone highlight stripe along the spine
    ctx.fillStyle = '#fb923c';
    ctx.beginPath();
    ctx.ellipse(shibaX + 1, shibaY - 3 + breath, 14, 5, -0.15, 0, Math.PI * 2);
    ctx.fill();

    // Soft white belly and chest fur
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.ellipse(shibaX + 4, shibaY + 2 + breath, 11, 6.5, 0.35, 0, Math.PI * 2);
    ctx.fill();

    // Curled bushy tail with white tip and gentle twitch
    const tailTwitch = Math.sin(tick * 0.1) * 1.6;
    ctx.fillStyle = '#ea580c';
    ctx.beginPath();
    ctx.ellipse(shibaX + 16, shibaY - 2 + breath + tailTwitch, 6.5, 6.5, 0.3, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.arc(shibaX + 18.5, shibaY - 4 + breath + tailTwitch, 3.2, 0, Math.PI * 2);
    ctx.fill();

    // Front tucked white paws (socks)
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.ellipse(shibaX - 4, shibaY + 5.5 + breath, 3.8, 2.5, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#e2e8f0';
    ctx.fillRect(shibaX - 5, shibaY + 6.2 + breath, 1, 1.2); // toe separation

    // Shiba Head
    ctx.fillStyle = '#ea580c';
    ctx.beginPath();
    ctx.arc(shibaX - 10, shibaY - 3 + breath, 9.5, 0, Math.PI * 2);
    ctx.fill();

    // Fluffy cheek fur tufts
    ctx.beginPath();
    ctx.moveTo(shibaX - 17, shibaY - 1 + breath);
    ctx.lineTo(shibaX - 19, shibaY + 2 + breath);
    ctx.lineTo(shibaX - 16, shibaY + 3.5 + breath);
    ctx.fill();

    // White muzzle, cheeks & eyebrows
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.ellipse(shibaX - 13, shibaY + breath, 5.5, 4.2, 0, 0, Math.PI * 2);
    ctx.fill();

    // Cute tan eyebrow dots (Maro spots)
    ctx.fillStyle = '#fed7aa';
    ctx.beginPath();
    ctx.arc(shibaX - 12, shibaY - 6.5 + breath, 1.2, 0, Math.PI * 2);
    ctx.arc(shibaX - 7, shibaY - 6.5 + breath, 1.2, 0, Math.PI * 2);
    ctx.fill();

    // Shiny black button nose & mouth
    ctx.fillStyle = '#1c0f0a';
    ctx.beginPath();
    ctx.ellipse(shibaX - 16.5, shibaY - 1 + breath, 2, 1.6, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(shibaX - 17, shibaY - 1.5 + breath, 0.8, 0.8); // nose shine

    // Pointy Shiba Ears with inner pink
    ctx.fillStyle = '#c2410c';
    ctx.beginPath();
    ctx.moveTo(shibaX - 14, shibaY - 10 + breath);
    ctx.lineTo(shibaX - 11, y - 17 + breath);
    ctx.lineTo(shibaX - 7, shibaY - 9 + breath);
    ctx.fill();
    ctx.fillStyle = '#fecdd3';
    ctx.beginPath();
    ctx.moveTo(shibaX - 13, shibaY - 11 + breath);
    ctx.lineTo(shibaX - 11, y - 15 + breath);
    ctx.lineTo(shibaX - 9, shibaY - 10 + breath);
    ctx.fill();

    // Peaceful sleeping eye curve with tiny lashes
    ctx.strokeStyle = '#1c0f0a';
    ctx.lineWidth = 1.2;
    ctx.beginPath();
    ctx.arc(shibaX - 9, shibaY - 3 + breath, 2.5, 0, Math.PI);
    ctx.stroke();

    // Soft pink cheek blush
    ctx.fillStyle = 'rgba(244, 63, 94, 0.35)';
    ctx.beginPath();
    ctx.ellipse(shibaX - 10, shibaY + 0.5 + breath, 2.5, 1.5, 0, 0, Math.PI * 2);
    ctx.fill();

    // Dream bubbles / Sleep Zzz bubbles
    if (petHappyTimer <= 0) {
      const zPhase = (tick * 0.05);
      const zY1 = ((tick * 0.35) % 22);
      const zY2 = ((tick * 0.35 + 11) % 22);
      const sway1 = Math.sin(zPhase) * 2;
      const sway2 = Math.cos(zPhase) * 2;

      // Soft dream bubbles with glow
      ctx.fillStyle = 'rgba(167, 139, 250, 0.85)';
      ctx.font = 'bold 8px "Segoe UI", sans-serif';
      ctx.fillText('z', shibaX + 12 + sway1, shibaY - 4 - zY1);

      ctx.fillStyle = 'rgba(192, 132, 252, 0.95)';
      ctx.font = 'bold 11px "Segoe UI", sans-serif';
      ctx.fillText('Z', shibaX + 17 + sway2, shibaY - 8 - zY2);
    } else {
      // Pet happy floating heart
      const heartBob = Math.sin(tick * 0.15) * 2;
      ctx.fillStyle = '#f43f5e';
      ctx.font = '12px sans-serif';
      ctx.fillText('💖', shibaX - 12, shibaY - 18 + heartBob);
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

