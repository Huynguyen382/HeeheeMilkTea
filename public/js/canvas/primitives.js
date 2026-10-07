// Retro Pixel Art Primitives & Barista Hyhy Renderer for GameCanvas

export const primitiveMethods = {
  drawGlassJar(ctx, x, y, contentsColor) {
    ctx.fillStyle = 'rgba(255, 255, 255, 0.5)';
    ctx.fillRect(x, y, 9, 10);
    ctx.fillStyle = contentsColor;
    ctx.fillRect(x + 1, y + 4, 7, 5);
    ctx.fillStyle = '#8b4513'; // cork lid
    ctx.fillRect(x, y - 2, 9, 3);
  },

  // Integer-aligned crisp pixel rectangle
  drawPixel(ctx, x, y, w, h, color) {
    ctx.fillStyle = color;
    ctx.fillRect(Math.round(x), Math.round(y), Math.max(1, Math.round(w)), Math.max(1, Math.round(h)));
  },

  // Standard Pixel Art Head & Expressive Anime Pixel Face
  drawOrganicHead(ctx, cx, cy, rx, ry, skinColor, blushColor, isBlinking, eyeColor = '#1a1016', isHappy = false, browColor = null) {
    const px = Math.round(cx);
    const py = Math.round(cy);
    const w = Math.round(rx * 2);
    const h = Math.round(ry * 2);
    const left = px - Math.floor(w / 2);
    const top = py - Math.floor(h / 2);

    const baseSkin = skinColor || '#ffe0bd';
    const isTanned = (baseSkin === '#e0a96d' || baseSkin === '#d49b61');
    const outlineColor = '#3a1e28'; // Warm dark outline
    const shadowSkin = isTanned ? '#b87333' : '#e8a882';   // Warm chin/neck shadow
    const highlightSkin = isTanned ? '#f5c699' : '#fff6ee'; // Soft forehead / cheek light

    // 1. Pixel Art Head Silhouette & Outline
    this.drawPixel(ctx, left + 3, top, w - 6, 1, outlineColor);
    this.drawPixel(ctx, left + 1, top + 1, 2, 1, outlineColor);
    this.drawPixel(ctx, left + w - 3, top + 1, 2, 1, outlineColor);
    this.drawPixel(ctx, left, top + 2, 1, h - 5, outlineColor);
    this.drawPixel(ctx, left + w - 1, top + 2, 1, h - 5, outlineColor);
    this.drawPixel(ctx, left + 1, top + h - 3, 2, 1, outlineColor);
    this.drawPixel(ctx, left + w - 3, top + h - 3, 2, 1, outlineColor);
    this.drawPixel(ctx, left + 3, top + h - 2, 2, 1, outlineColor);
    this.drawPixel(ctx, left + w - 5, top + h - 2, 2, 1, outlineColor);
    this.drawPixel(ctx, left + 5, top + h - 1, w - 10, 1, outlineColor);

    // 2. Base Skin Fill & Multi-Tone Shading
    this.drawPixel(ctx, left + 3, top + 1, w - 6, 1, highlightSkin);
    this.drawPixel(ctx, left + 1, top + 2, w - 2, h - 6, baseSkin);
    this.drawPixel(ctx, left + 2, top + 3, 3, 1, highlightSkin); // Left temple light
    this.drawPixel(ctx, left + w - 5, top + 3, 3, 1, highlightSkin); // Right temple light
    this.drawPixel(ctx, left + 2, top + h - 4, w - 4, 1, baseSkin);
    this.drawPixel(ctx, left + 3, top + h - 3, w - 6, 1, shadowSkin); // Jawline contour
    this.drawPixel(ctx, left + 5, top + h - 2, w - 10, 1, shadowSkin);

    // 3. Cute Pixel Ears with Gold Earring Studs
    this.drawPixel(ctx, left - 1, py - 1, 1, 3, outlineColor);
    this.drawPixel(ctx, left, py, 1, 2, shadowSkin);
    this.drawPixel(ctx, left - 1, py + 1, 1, 1, '#f1c40f'); // Left gold earring glint
    this.drawPixel(ctx, left + w, py - 1, 1, 3, outlineColor);
    this.drawPixel(ctx, left + w - 1, py, 1, 2, shadowSkin);
    this.drawPixel(ctx, left + w, py + 1, 1, 1, '#f1c40f'); // Right gold earring glint

    // 4. Rosy Pixel Blush & Sparkle Catchlight (cheeks below eyes)
    const blush = blushColor || (isHappy ? '#ff6b81' : '#ff7675');
    this.drawPixel(ctx, left + 2, py + 2, 2, 1, blush);
    this.drawPixel(ctx, left + w - 4, py + 2, 2, 1, blush);
    this.drawPixel(ctx, left + 2, py + 2, 1, 1, '#ffffff'); // Cheek sparkle shine!
    this.drawPixel(ctx, left + w - 3, py + 2, 1, 1, '#ffffff');
    if (isHappy) {
      this.drawPixel(ctx, left + 2, py + 3, 2, 1, blush);
      this.drawPixel(ctx, left + w - 4, py + 3, 2, 1, blush);
    }

    // 5. Expressive Pixel Eyes & Eyebrows
    const eyeSpacing = Math.round(rx * 0.44);
    const eyeY = py - 1;
    const leftEyeX = px - eyeSpacing - 2;
    const rightEyeX = px + eyeSpacing - 1;

    // Eyebrow color determination
    const defaultBrow = browColor || (isTanned ? '#2d3436' : (eyeColor === '#dfe6e9' ? '#8c7b75' : (eyeColor === '#0984e3' ? '#c2921a' : '#3e271a')));

    if (isHappy) {
      // Joyful curved anime eyes: ^ ^ with happy eyelashes
      const drawHappyEye = (ex) => {
        this.drawPixel(ctx, ex, eyeY + 1, 1, 1, '#1e1018');
        this.drawPixel(ctx, ex + 1, eyeY, 2, 1, '#1e1018');
        this.drawPixel(ctx, ex + 3, eyeY + 1, 1, 1, '#1e1018');
        this.drawPixel(ctx, ex + 4, eyeY, 1, 1, '#1e1018'); // Eyelash flick
      };
      drawHappyEye(leftEyeX);
      drawHappyEye(rightEyeX);

      // Cheerful high arched eyebrows
      this.drawPixel(ctx, leftEyeX, eyeY - 4, 3, 1, defaultBrow);
      this.drawPixel(ctx, leftEyeX + 3, eyeY - 3, 1, 1, defaultBrow);
      this.drawPixel(ctx, rightEyeX + 1, eyeY - 4, 3, 1, defaultBrow);
      this.drawPixel(ctx, rightEyeX, eyeY - 3, 1, 1, defaultBrow);
    } else if (isBlinking) {
      // Resting blink: sweet closed lash line _ _
      this.drawPixel(ctx, leftEyeX, eyeY + 1, 4, 1, '#1e1018');
      this.drawPixel(ctx, leftEyeX + 3, eyeY, 1, 1, '#1e1018');
      this.drawPixel(ctx, leftEyeX + 4, eyeY - 1, 1, 1, '#1e1018');
      this.drawPixel(ctx, rightEyeX, eyeY + 1, 4, 1, '#1e1018');
      this.drawPixel(ctx, rightEyeX + 3, eyeY, 1, 1, '#1e1018');
      this.drawPixel(ctx, rightEyeX + 4, eyeY - 1, 1, 1, '#1e1018');

      // Relaxed gentle eyebrows
      this.drawPixel(ctx, leftEyeX, eyeY - 3, 3, 1, defaultBrow);
      this.drawPixel(ctx, rightEyeX + 1, eyeY - 3, 3, 1, defaultBrow);
    } else {
      // High-End Anime Pixel Eyes with 2-tone Iris & Dual Specular Catchlights
      const drawStandardEye = (ex) => {
        // Upper eyelash bar with winged flick
        this.drawPixel(ctx, ex, eyeY - 1, 4, 1, '#1e1018');
        this.drawPixel(ctx, ex + 3, eyeY - 1, 1, 1, '#1e1018');
        this.drawPixel(ctx, ex + 4, eyeY - 2, 1, 1, '#1e1018'); // Wing flick
        // Sclera
        this.drawPixel(ctx, ex, eyeY, 4, 3, '#ffffff');
        // Iris: 2-tone glowing gradient
        this.drawPixel(ctx, ex + 1, eyeY, 2, 1, '#110813'); // Upper shadow
        this.drawPixel(ctx, ex + 1, eyeY + 1, 2, 2, eyeColor); // Vibrant iris base
        // Pupil
        this.drawPixel(ctx, ex + 1, eyeY + 1, 1, 1, '#000000');
        // Dual catchlight sparkle
        this.drawPixel(ctx, ex + 1, eyeY, 1, 1, '#ffffff'); // Primary bright star glint
        this.drawPixel(ctx, ex + 2, eyeY + 2, 1, 1, 'rgba(255, 255, 255, 0.7)'); // Secondary crystal refraction
        // Lower eyelid rim
        this.drawPixel(ctx, ex + 1, eyeY + 3, 2, 1, '#3a1824');
      };
      drawStandardEye(leftEyeX);
      drawStandardEye(rightEyeX);

      // Delicate expressive pixel eyebrows with outer taper
      this.drawPixel(ctx, leftEyeX, eyeY - 3, 3, 1, defaultBrow);
      this.drawPixel(ctx, leftEyeX + 3, eyeY - 4, 1, 1, defaultBrow);
      this.drawPixel(ctx, rightEyeX + 1, eyeY - 3, 3, 1, defaultBrow);
      this.drawPixel(ctx, rightEyeX - 1, eyeY - 4, 1, 1, defaultBrow);
    }

    // 6. Cute Pixel Nose & Smiling Cupid's Bow Mouth
    this.drawPixel(ctx, px, py + 1, 1, 1, highlightSkin); // Nose bridge light
    this.drawPixel(ctx, px, py + 2, 1, 1, shadowSkin);    // Nose shadow
    if (isHappy) {
      this.drawPixel(ctx, px - 1, py + 4, 3, 1, '#8b263e');
      this.drawPixel(ctx, px, py + 5, 2, 1, '#ff7675');
      this.drawPixel(ctx, px, py + 4, 1, 1, '#ffffff'); // White smile glint!
    } else {
      this.drawPixel(ctx, px - 1, py + 4, 2, 1, '#a33045');
      this.drawPixel(ctx, px + 1, py + 4, 1, 1, '#d63031');
      this.drawPixel(ctx, px, py + 4, 1, 1, '#ff7675'); // Lip center tone
    }
  },

  // Standard Pixel Art Neck Pillar connecting head to torso
  drawNeck(ctx, cx, y, w = 5, h = 4, skinColor = '#ffe0bd', shadowColor = null) {
    const nx = Math.round(cx - Math.floor(w / 2));
    const ny = Math.round(y);
    const baseSkin = skinColor || '#ffe0bd';
    const isTanned = (baseSkin === '#e0a96d' || baseSkin === '#d49b61');
    const shadow = shadowColor || (isTanned ? '#b87333' : '#e8a882');

    // Neck column
    this.drawPixel(ctx, nx, ny, w, h, baseSkin);
    // Shadow under the jawline
    this.drawPixel(ctx, nx, ny, w, 2, shadow);
    // Dark outline on sides of neck for clear silhouette
    this.drawPixel(ctx, nx - 1, ny + 1, 1, h - 1, '#3a1e28');
    this.drawPixel(ctx, nx + w, ny + 1, 1, h - 1, '#3a1e28');
    // Collarbone notch / throat contour
    this.drawPixel(ctx, Math.round(cx), ny + h - 1, 1, 1, shadow);
  },

  // Standard Pixel Art Hand (with palm, fingers, knuckles, grip)
  drawHand(ctx, x, y, skinColor = '#ffe0bd', pose = 'relaxed') {
    const hx = Math.round(x);
    const hy = Math.round(y);
    const baseSkin = skinColor || '#ffe0bd';
    const isTanned = (baseSkin === '#e0a96d' || baseSkin === '#d49b61');
    const shadowSkin = isTanned ? '#b87333' : '#e8a882';

    if (pose === 'grip' || pose === 'fist') {
      // 3x3 curled grip hand around handle/object
      this.drawPixel(ctx, hx, hy, 3, 3, baseSkin);
      this.drawPixel(ctx, hx, hy + 2, 3, 1, shadowSkin); // finger creases
      this.drawPixel(ctx, hx, hy, 1, 2, shadowSkin);     // thumb knuckle
      this.drawPixel(ctx, hx + 1, hy, 1, 1, '#ffffff');  // knuckle highlight
    } else if (pose === 'peace' || pose === 'v') {
      this.drawPixel(ctx, hx, hy + 2, 3, 2, baseSkin);
      this.drawPixel(ctx, hx, hy, 1, 2, baseSkin); // index finger
      this.drawPixel(ctx, hx + 2, hy, 1, 2, baseSkin); // middle finger
    } else {
      // Relaxed anime hand
      this.drawPixel(ctx, hx, hy, 3, 3, baseSkin);
      this.drawPixel(ctx, hx + 1, hy + 3, 2, 1, baseSkin); // fingers
      this.drawPixel(ctx, hx + 2, hy + 1, 1, 2, shadowSkin); // palm shadow
      this.drawPixel(ctx, hx + 1, hy + 1, 1, 1, '#ffffff'); // skin glint
    }
  },

  // Standard Pixel Art Limbs (Arms & Legs with integer grid snapping)
  drawCurvedLimb(ctx, x1, y1, x2, y2, r1, r2, color) {
    const rx1 = Math.round(x1);
    const ry1 = Math.round(y1);
    const rx2 = Math.round(x2);
    const ry2 = Math.round(y2);
    const w = Math.max(2, Math.round(r1 + r2));
    const h = Math.abs(ry2 - ry1);
    const minX = Math.min(rx1, rx2);
    const minY = Math.min(ry1, ry2);

    ctx.fillStyle = color;
    if (h >= 1) {
      ctx.fillRect(minX, minY, w, h);
      // Outer shadow strip
      ctx.fillStyle = 'rgba(0, 0, 0, 0.15)';
      ctx.fillRect(minX + w - 1, minY, 1, h);
    } else {
      const len = Math.abs(rx2 - rx1);
      ctx.fillRect(minX, minY, Math.max(w, len), w);
    }
  },

  // Standard Pixel Art Shoes & Footwear (with clean soles & highlights)
  drawCurvedShoe(ctx, x, y, len, h, color, soleColor = '#ffffff') {
    const sx = Math.round(x - len * 0.4);
    const sy = Math.round(y);
    const sw = Math.round(len);
    const sh = Math.max(3, Math.round(h));

    // Upper shoe vamp
    ctx.fillStyle = color;
    ctx.fillRect(sx, sy, sw, sh - 1);
    ctx.fillRect(sx + 1, sy - 1, sw - 2, 1);

    // Sole
    ctx.fillStyle = soleColor;
    ctx.fillRect(sx, sy + sh - 1, sw + 1, 1);

    // Gloss highlight pixel
    ctx.fillStyle = 'rgba(255, 255, 255, 0.4)';
    ctx.fillRect(sx + sw - 2, sy, 1, 1);
  },

  // Standard Pixel Art Fabric Creases & Shading
  drawFabricFinish(ctx, cx, top, width, height, baseShade = 'rgba(0, 0, 0, 0.16)') {
    const px = Math.round(cx - width / 2);
    const py = Math.round(top);
    const w = Math.round(width);
    const h = Math.round(height);

    ctx.save();
    // Shaded side fold
    ctx.fillStyle = baseShade;
    ctx.fillRect(px, py, 1, h);
    ctx.fillRect(px + w - 1, py, 1, h);
    // Subtle vertical crease
    ctx.fillStyle = 'rgba(0, 0, 0, 0.1)';
    ctx.fillRect(Math.round(cx), py + 2, 1, h - 4);
    // Subtle highlight fold
    ctx.fillStyle = 'rgba(255, 255, 255, 0.15)';
    ctx.fillRect(Math.round(cx) - 1, py + 1, 1, h - 3);
    ctx.restore();
  },

  // Standard Anime Pixel Hair Halo / Sheen Band
  drawHairGloss(ctx, cx, cy, scale = 1) {
    const px = Math.round(cx);
    const py = Math.round(cy);
    const span = Math.round(5 * scale);

    ctx.save();
    // Stepped pixel hair shine band
    ctx.fillStyle = 'rgba(255, 245, 220, 0.45)';
    ctx.fillRect(px - span, py, span * 2 + 1, 1);
    // Specular catchlight pixels
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(px - Math.round(span * 0.4), py, 2, 1);
    ctx.fillRect(px + Math.round(span * 0.3), py, 1, 1);
    ctx.restore();
  },

  // BARISTA CHỦ QUÁN (CHỊ THẢO BOBA - Pixel Art Sprite ModelNPC)
  drawHyhy(ctx) {
    const hx = 78;
    const hy = 78;
    const bob = Math.round(Math.sin(this.tick * 0.1) * 1); // Crisp integer breathing bob
    const isBlinking = (this.tick % 80) < 4;

    if (typeof drawOwnerBarista === 'function') {
      drawOwnerBarista(ctx, hx, hy, bob, isBlinking);
    }
  },

  // --- BARISTA FOREARMS & SHAKER ON COUNTER ---
  drawHyhyForearms(ctx) {
    const hx = 78;
    const hy = 78;
    const bob = Math.round(Math.sin(this.tick * 0.1) * 1);

    if (typeof drawOwnerForearms === 'function') {
      drawOwnerForearms(ctx, hx, hy, bob, this.isShaking, this.tick);
    }
  }
};

