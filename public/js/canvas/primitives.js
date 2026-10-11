// Retro Pixel Art Primitives & Barista Hyhy Renderer for GameCanvas

export const primitiveMethods = {
  drawGlassJar(ctx, x, y, contentsColor, toppingType) {
    // Under-shelf LED bottom-edge glow
    ctx.fillStyle = 'rgba(255, 235, 160, 0.25)';
    ctx.fillRect(x - 1, y + 9, 13, 2);

    // Translucent glass body with rounded bevels
    ctx.fillStyle = 'rgba(255, 255, 255, 0.45)';
    ctx.fillRect(x, y, 11, 10);
    ctx.fillStyle = 'rgba(255, 255, 255, 0.2)';
    ctx.fillRect(x + 1, y + 1, 9, 8);

    // Topping liquid / solid fill
    ctx.fillStyle = contentsColor;
    ctx.fillRect(x + 1, y + 4, 9, 5);

    // Specular liquid highlights & topping textures
    if (contentsColor === '#111' || toppingType === 'boba') {
      // Brown sugar tapioca with caramel gloss & boba dots
      ctx.fillStyle = '#78350F';
      ctx.fillRect(x + 1, y + 4, 9, 1.5);
      ctx.fillStyle = '#F59E0B';
      ctx.fillRect(x + 2, y + 5, 2, 1);
      ctx.fillRect(x + 6, y + 6, 2, 1);
    } else if (contentsColor === '#f39c12' || toppingType === 'peach') {
      // Golden peach slices with golden shimmer
      ctx.fillStyle = '#FDE047';
      ctx.fillRect(x + 2, y + 5, 3, 2);
      ctx.fillRect(x + 6, y + 4, 3, 2);
      ctx.fillStyle = '#EA580C';
      ctx.fillRect(x + 3, y + 7, 2, 1);
    } else {
      // Jade pandan / matcha jelly with emerald edge glow
      ctx.fillStyle = '#34D399';
      ctx.fillRect(x + 1, y + 4, 9, 1);
      ctx.fillRect(x + 2, y + 6, 2, 2);
      ctx.fillRect(x + 6, y + 5, 2, 2);
    }

    // Glass glare reflection lines
    ctx.fillStyle = 'rgba(255, 255, 255, 0.65)';
    ctx.fillRect(x + 1, y + 1, 1, 8); // left highlight line
    ctx.fillRect(x + 8, y + 1, 1, 3);

    // Inox Stainless Steel Rim & Handle
    ctx.fillStyle = '#CBD5E1';
    ctx.fillRect(x, y - 2, 11, 2);
    ctx.fillStyle = '#94A3B8';
    ctx.fillRect(x + 4, y - 4, 3, 2); // knob handle
    ctx.fillStyle = '#FFFFFF';
    ctx.fillRect(x + 1, y - 2, 3, 1);
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

    const outfit = this.currentOutfit || (window.activeOutfitRender) || null;

    const fnDrawBarista = (typeof drawOwnerBarista === 'function') ? drawOwnerBarista : (typeof window !== 'undefined' ? window.drawOwnerBarista : null);
    if (typeof fnDrawBarista === 'function') {
      const isTalking = !!(this.customerQuote && this.bubbleType === 'dialogue');
      fnDrawBarista(ctx, hx, hy, bob, isBlinking, outfit, this.tick, isTalking, this.isShaking);
    }
  },

  // --- BARISTA FOREARMS & SHAKER ON COUNTER ---
  drawHyhyForearms(ctx) {
    const hx = 78;
    const hy = 78;
    const bob = Math.round(Math.sin(this.tick * 0.1) * 1);

    const fnDrawForearms = (typeof drawOwnerForearms === 'function') ? drawOwnerForearms : (typeof window !== 'undefined' ? window.drawOwnerForearms : null);
    if (typeof fnDrawForearms === 'function') {
      fnDrawForearms(ctx, hx, hy, bob, this.isShaking, this.tick);
    }
  },

  // --- TRỢ THỦ BÉ BẮP (Full-body Anime Pixel Art Barista đứng trực quầy tại bx = 132) ---
  drawBeBap(ctx) {
    const bx = 132;
    const bob = Math.round(Math.sin(this.tick * 0.12 + 1) * 1);
    const hairSway = Math.round(Math.sin(this.tick * 0.06) * 0.6);
    const isBlinking = (this.tick % 75) < 4;
    const isTalking = !!(this.staffActionText);
    const skin = '#FFE0BD';

    const pR = (x, y, w, h, col) => {
      ctx.fillStyle = col;
      ctx.fillRect(Math.round(x), Math.round(y), Math.round(w), Math.round(h));
    };
    const pD = (x, y, col) => {
      ctx.fillStyle = col;
      ctx.fillRect(Math.round(x), Math.round(y), 1, 1);
    };

    // 1. Giày búp bê nâu & vớ trắng cổ ren (lộ dưới gầm xe y = 141..144 giống Chị Thảo)
    pR(bx + 3, 142, 5, 2, '#78350F');
    pR(bx + 10, 142, 5, 2, '#78350F');
    pR(bx + 2, 143, 7, 1, '#FFFFFF');
    pR(bx + 9, 143, 7, 1, '#FFFFFF');
    pR(bx + 4, 137, 4, 5, '#FFFFFF');
    pR(bx + 10, 137, 4, 5, '#FFFFFF');
    pD(bx + 5, 138, '#FACC15');
    pD(bx + 11, 138, '#FACC15');

    // 2. Đôi chân & Chân váy xếp ly cam nâu (y = 104..137)
    const legTop = 114 + bob;
    pR(bx + 4, legTop, 4, 23, skin);
    pR(bx + 10, legTop, 4, 23, skin);
    const skirtTop = 104 + bob;
    pR(bx, skirtTop, 18, 13, '#C2410C');
    for (let px = bx + 1; px <= bx + 15; px += 3) {
      pR(px, skirtTop, 1, 12, '#9A3412');
    }

    // 3. Thân áo trắng cổ sen & Tạp dề vàng Bắp Ngô (y = 92..108, nổi bật phía trên mặt bàn đá)
    const torsoTop = 92 + bob;
    pR(bx, torsoTop, 18, 15, '#FFFBEB');
    pR(bx + 6, torsoTop, 6, 2, skin); // cổ áo
    pR(bx + 6, torsoTop + 1, 6, 2, '#F97316'); // nơ cổ cam
    // Tạp dề vàng bắp ngô
    pR(bx + 2, torsoTop + 3, 14, 12, '#FACC15');
    pR(bx + 3, torsoTop + 4, 12, 10, '#FDE047');
    pR(bx + 3, torsoTop + 1, 2, 6, '#EA580C'); // dây yếm trái
    pR(bx + 13, torsoTop + 1, 2, 6, '#EA580C'); // dây yếm phải
    pD(bx + 3, torsoTop + 3, '#FFFFFF');
    pD(bx + 14, torsoTop + 3, '#FFFFFF');
    // Huy hiệu trái bắp ngô trước ngực
    pR(bx + 7, torsoTop + 6, 4, 4, '#F59E0B');
    pR(bx + 8, torsoTop + 5, 2, 4, '#FACC15');
    pD(bx + 7, torsoTop + 9, '#16A34A');
    pD(bx + 10, torsoTop + 9, '#16A34A');
    // Tay áo phồng trắng hai bên
    pR(bx - 2, torsoTop + 1, 3, 8, '#FFFBEB');
    pR(bx + 17, torsoTop + 1, 3, 8, '#FFFBEB');

    // 4. Đầu Anime, Tóc búi đôi Pucca & Kẹp Tóc Bắp Ngô 🌽 (y = 75..91)
    const headX = bx + 8;
    const headTop = 75 + bob;
    const faceTop = 79 + bob;

    // Tóc sau & Hai búi tóc tròn cột nơ vàng
    pR(headX - 7 + hairSway, headTop - 2, 16, 14, '#5C2D13');
    pR(headX - 10, headTop - 6, 5, 5, '#5C2D13');
    pR(headX - 9, headTop - 5, 3, 3, '#FACC15');
    pR(headX + 7, headTop - 6, 5, 5, '#5C2D13');
    pR(headX + 8, headTop - 5, 3, 3, '#FACC15');

    // Kẹp tóc bắp ngô 🌽 nổi bật
    pR(headX - 8, headTop - 8, 3, 4, '#FDE047');
    pD(headX - 7, headTop - 7, '#F59E0B');
    pR(headX - 8, headTop - 5, 2, 2, '#16A34A');

    // Khuôn mặt Anime
    pR(headX - 6, faceTop, 14, 10, skin);
    pR(headX - 5, faceTop + 8, 12, 2, '#F6C8A6');
    pR(headX - 7, faceTop + 2, 2, 4, skin);
    pR(headX + 7, faceTop + 2, 2, 4, skin);

    // Đôi mắt to tròn long lanh
    if (isBlinking) {
      pR(headX - 4, faceTop + 3, 4, 1, '#1E293B');
      pR(headX + 2, faceTop + 3, 4, 1, '#1E293B');
    } else {
      pR(headX - 4, faceTop + 1, 3, 1, '#1E293B');
      pR(headX - 4, faceTop + 2, 3, 3, '#1E293B');
      pD(headX - 4, faceTop + 2, '#FFFFFF');
      pD(headX - 3, faceTop + 4, '#F59E0B');

      pR(headX + 3, faceTop + 1, 3, 1, '#1E293B');
      pR(headX + 3, faceTop + 2, 3, 3, '#1E293B');
      pD(headX + 3, faceTop + 2, '#FFFFFF');
      pD(headX + 4, faceTop + 4, '#F59E0B');
    }

    // Má hồng & Nụ cười tươi
    pR(headX - 5, faceTop + 5, 2, 1, '#FF79C6');
    pR(headX + 5, faceTop + 5, 2, 1, '#FF79C6');
    if (isTalking && (Math.floor(this.tick / 6) % 2 === 0)) {
      pR(headX, faceTop + 6, 3, 2, '#E11D48');
      pD(headX + 1, faceTop + 6, '#FFFFFF');
    } else {
      pR(headX - 1, faceTop + 6, 4, 1, '#F43F5E');
      pD(headX, faceTop + 6, '#FFFFFF');
    }

    // Tóc mái ngang & Angel ring
    pR(headX - 6, headTop - 3, 14, 4, '#5C2D13');
    pR(headX - 4, headTop - 4, 10, 2, '#78350F');
    pD(headX, headTop - 4, '#FDE047');
  },

  // --- ANH LÂM SHIPPER (Đồng bộ chuẩn 100% với ModelNPC anhlam_shipper trong characters.js tại bx = 132) ---
  drawAnhLam(ctx) {
    const bx = 132;
    const bob = Math.round(Math.sin(this.tick * 0.09 + 0.5) * 1);
    const isBlinking = (this.tick % 85) < 4;
    const isTalking = !!(this.staffActionText);
    const skin = '#FCD7B0';

    const pR = (x, y, w, h, col) => {
      ctx.fillStyle = col;
      ctx.fillRect(Math.round(x), Math.round(y), Math.round(w), Math.round(h));
    };
    const pD = (x, y, col) => {
      ctx.fillStyle = col;
      ctx.fillRect(Math.round(x), Math.round(y), 1, 1);
    };

    // 1. Giày Sneaker Đỏ Đế Trắng & Quần Jeans Xanh Đen (y = 106..144, chuẩn anhlam_shipper)
    pR(bx + 3, 141, 6, 3, '#DC2626');
    pR(bx + 10, 141, 6, 3, '#DC2626');
    pR(bx + 2, 143, 7, 1, '#FFFFFF');
    pR(bx + 9, 143, 7, 1, '#FFFFFF');
    const legTop = 106 + bob;
    pR(bx + 3, legTop, 5, 35, '#1E293B');
    pR(bx + 10, legTop, 5, 35, '#1E293B');
    pD(bx + 4, legTop + 12, '#64748B');
    pD(bx + 11, legTop + 12, '#64748B');

    // 2. Áo Bomber Shipper Xanh Lá Phản Quang + Dải Cam + Túi Bao Tử Đeo Chéo (y = 92..108)
    const torsoTop = 92 + bob;
    pR(bx - 1, torsoTop, 20, 16, '#16A34A');
    pR(bx + 6, torsoTop, 6, 2, '#1E293B'); // cổ áo bomber
    // Sọc bạc phản quang & dải cam đặc trưng của Anh Lâm Shipper
    pR(bx - 1, torsoTop + 6, 20, 2, '#F1F5F9');
    pR(bx - 1, torsoTop + 9, 20, 1, '#EA580C');
    // Túi bao tử đen đeo chéo ngực khóa vàng
    pR(bx + 3, torsoTop + 4, 12, 4, '#0F172A');
    pR(bx + 7, torsoTop + 5, 4, 2, '#FACC15');
    // Tay áo Bomber Shipper xanh lá
    pR(bx - 2, torsoTop + 1, 3, 8, '#16A34A');
    pR(bx + 17, torsoTop + 1, 3, 8, '#16A34A');

    // 3. Đầu Anime, Mũ Bảo Hiểm Nửa Đầu Đỏ Sọc Trắng & Kính Phi Công Phản Quang (y = 73..91)
    const headX = bx + 8;
    const headTop = 75 + bob;
    const faceTop = 79 + bob;

    // Tóc mai & tai
    pR(headX - 6, faceTop, 2, 5, '#18181B');
    pR(headX + 6, faceTop, 2, 5, '#18181B');
    pR(headX - 7, faceTop + 2, 2, 4, skin);
    pR(headX + 7, faceTop + 2, 2, 4, skin);

    // Khuôn mặt nam tính
    pR(headX - 5, faceTop, 12, 10, skin);
    pR(headX - 4, faceTop + 8, 10, 2, '#E5B88A');
    pR(headX - 4, faceTop + 1, 3, 1, '#18181B');
    pR(headX + 3, faceTop + 1, 3, 1, '#18181B');

    if (isBlinking) {
      pR(headX - 4, faceTop + 3, 3, 1, '#0F172A');
      pR(headX + 3, faceTop + 3, 3, 1, '#0F172A');
    } else {
      pR(headX - 4, faceTop + 2, 3, 3, '#0F172A');
      pD(headX - 4, faceTop + 2, '#FFFFFF');
      pR(headX + 3, faceTop + 2, 3, 3, '#0F172A');
      pD(headX + 3, faceTop + 2, '#FFFFFF');
    }

    // Nụ cười nhiệt huyết
    if (isTalking && (Math.floor(this.tick / 6) % 2 === 0)) {
      pR(headX - 1, faceTop + 6, 4, 2, '#B91C1C');
      pD(headX, faceTop + 6, '#FFFFFF');
    } else {
      pR(headX - 1, faceTop + 6, 4, 1, '#B91C1C');
      pD(headX + 1, faceTop + 6, '#FFFFFF');
    }

    // Mũ bảo hiểm nửa đầu đỏ sọc trắng & Kính phi công xanh phản quang kéo trên trán
    pR(headX - 7, headTop - 5, 16, 6, '#B91C1C');
    pR(headX - 5, headTop - 6, 12, 2, '#DC2626');
    pR(headX, headTop - 6, 2, 7, '#FFFFFF'); // sọc trắng giữa mũ
    pR(headX - 7, headTop - 2, 16, 3, '#0F172A'); // đai kính phi công
    pR(headX - 5, headTop - 1, 5, 2, '#38BDF8'); // mắt kính trái xanh neon
    pD(headX - 4, headTop - 1, '#FFFFFF');
    pR(headX + 2, headTop - 1, 5, 2, '#38BDF8'); // mắt kính phải xanh neon
    pD(headX + 3, headTop - 1, '#FFFFFF');
  },

  // --- CÔ MAI (Full-body Anime Pixel Art Quản Lý Duyên Dáng tại bx = 132) ---
  drawCoMai(ctx) {
    const bx = 132;
    const bob = Math.round(Math.sin(this.tick * 0.08 + 1.2) * 1);
    const isBlinking = (this.tick % 80) < 4;
    const isTalking = !!(this.staffActionText);
    const skin = '#FED7AA';

    const pR = (x, y, w, h, col) => {
      ctx.fillStyle = col;
      ctx.fillRect(Math.round(x), Math.round(y), Math.round(w), Math.round(h));
    };
    const pD = (x, y, col) => {
      ctx.fillStyle = col;
      ctx.fillRect(Math.round(x), Math.round(y), 1, 1);
    };

    // 1. Guốc mộc truyền thống & Quần lụa đen (y = 104..144)
    pR(bx + 3, 141, 5, 3, '#78350F');
    pR(bx + 10, 141, 5, 3, '#78350F');
    const legTop = 106 + bob;
    pR(bx + 3, legTop, 5, 35, '#1E293B');
    pR(bx + 10, legTop, 5, 35, '#1E293B');

    // 2. Áo Bà Ba लụa Tím Hoa Cà & Chuỗi Ngọc Trai (y = 92..108)
    const torsoTop = 92 + bob;
    pR(bx, torsoTop, 18, 16, '#8B5CF6');
    pR(bx + 2, torsoTop + 1, 14, 14, '#A78BFA');
    pR(bx + 8, torsoTop + 2, 2, 13, '#6D28D9'); // hàng khuy giữa
    // Chuỗi vòng ngọc trai trắng quý phái
    pR(bx + 5, torsoTop, 8, 2, '#F8FAFC');
    pD(bx + 6, torsoTop + 2, '#FFFFFF');
    pD(bx + 9, torsoTop + 2, '#FFFFFF');
    pD(bx + 11, torsoTop + 2, '#FFFFFF');
    // Họa tiết thêu hoa mai vàng trên áo
    pR(bx + 4, torsoTop + 5, 2, 2, '#FDE047');
    pR(bx + 12, torsoTop + 7, 2, 2, '#FDE047');
    // Tay áo bà ba tím
    pR(bx - 2, torsoTop + 1, 3, 8, '#8B5CF6');
    pR(bx + 17, torsoTop + 1, 3, 8, '#8B5CF6');

    // 3. Đầu Anime, Búi tóc cài Trâm Ngọc Bích & Kính Lão (y = 75..91)
    const headX = bx + 8;
    const headTop = 75 + bob;
    const faceTop = 79 + bob;

    // Búi tóc vấn cao điểm hoa râm & trâm ngọc bích
    pR(headX - 4, headTop - 9, 10, 5, '#334155');
    pR(headX - 6, headTop - 8, 14, 2, '#34D399'); // trâm cài ngọc bích
    pD(headX + 7, headTop - 8, '#FDE047'); // đầu trâm vàng
    pR(headX - 7, headTop - 3, 16, 13, '#334155');

    // Gương mặt phúc hậu
    pR(headX - 6, faceTop, 14, 10, skin);
    pR(headX - 5, faceTop + 8, 12, 2, '#FDBA74');
    pR(headX - 7, faceTop + 2, 2, 4, skin);
    pR(headX + 7, faceTop + 2, 2, 4, skin);
    pD(headX - 7, faceTop + 5, '#F8FAFC'); // bông tai ngọc trai
    pD(headX + 8, faceTop + 5, '#F8FAFC');

    // Kính lão gọng vàng mảnh & đôi mắt hiền từ
    pR(headX - 5, faceTop + 2, 4, 1, '#FACC15');
    pR(headX + 3, faceTop + 2, 4, 1, '#FACC15');
    if (isBlinking) {
      pR(headX - 4, faceTop + 3, 3, 1, '#1E293B');
      pR(headX + 3, faceTop + 3, 3, 1, '#1E293B');
    } else {
      pR(headX - 4, faceTop + 3, 3, 2, '#1E293B');
      pD(headX - 4, faceTop + 3, '#FFFFFF');
      pR(headX + 3, faceTop + 3, 3, 2, '#1E293B');
      pD(headX + 3, faceTop + 3, '#FFFFFF');
    }

    // Má hồng ấm áp & nụ cười hiền hậu
    pR(headX - 5, faceTop + 5, 2, 1, '#F472B6');
    pR(headX + 5, faceTop + 5, 2, 1, '#F472B6');
    pR(headX - 1, faceTop + 6, 4, 1, '#E11D48');
    if (isTalking) pD(headX, faceTop + 7, '#FB7185');

    // Tóc mái rẽ ngôi điểm bạc
    pR(headX - 6, headTop - 4, 14, 4, '#334155');
    pR(headX - 4, headTop - 3, 3, 1, '#94A3B8');
    pR(headX + 3, headTop - 3, 3, 1, '#94A3B8');
  },

  // --- BOT P-800 (Full-body Robot Barista Bách Khoa Công Nghệ Cao tại bx = 132) ---
  drawBotP800(ctx) {
    const bx = 132;
    const bob = Math.round(Math.sin(this.tick * 0.16) * 1);
    const pulseLed = (Math.sin(this.tick * 0.25) + 1) * 0.5;

    const pR = (x, y, w, h, col) => {
      ctx.fillStyle = col;
      ctx.fillRect(Math.round(x), Math.round(y), Math.round(w), Math.round(h));
    };
    const pD = (x, y, col) => {
      ctx.fillStyle = col;
      ctx.fillRect(Math.round(x), Math.round(y), 1, 1);
    };

    // 1. Chân đế Servo Thủy Lực Titan (y = 110..144)
    pR(bx + 2, 141, 6, 3, '#0284C7');
    pR(bx + 10, 141, 6, 3, '#0284C7');
    pR(bx + 1, 143, 8, 1, '#38BDF8');
    pR(bx + 9, 143, 8, 1, '#38BDF8');
    const legTop = 108 + bob;
    pR(bx + 4, legTop, 4, 33, '#334155');
    pR(bx + 10, legTop, 4, 33, '#334155');

    // 2. Thân Máy Hợp Kim Cyber & Lõi Năng Lượng Lò Phản Ứng (y = 92..108)
    const torsoTop = 92 + bob;
    pR(bx - 1, torsoTop, 20, 16, '#0369A1');
    pR(bx + 1, torsoTop + 1, 16, 14, '#0284C7');
    // Màn hình LED đo công suất pha chế trước ngực
    pR(bx + 3, torsoTop + 3, 12, 8, '#0F172A');
    pR(bx + 4, torsoTop + 5, 10, 4, '#10B981');
    pR(bx + 5, torsoTop + 6, 6, 2, '#A7F3D0');
    // Khớp vai cơ khí vàng
    pR(bx - 3, torsoTop + 1, 3, 7, '#F59E0B');
    pR(bx + 18, torsoTop + 1, 3, 7, '#F59E0B');

    // 3. Đầu Robot Titan, Ăng-ten Radar & Màn Hình Visor Mắt Neon (y = 72..91)
    const headX = bx + 8;
    const headTop = 75 + bob;
    const faceTop = 78 + bob;

    // Ăng-ten thu phát sóng LED đỏ nhấp nháy
    pR(headX, headTop - 7, 2, 5, '#94A3B8');
    pR(headX - 1, headTop - 9, 4, 3, pulseLed > 0.45 ? '#EF4444' : '#FDE047');

    // Khối đầu hợp kim & tai bộ đàm
    pR(headX - 7, headTop - 2, 16, 13, '#0284C7');
    pR(headX - 6, headTop - 1, 14, 11, '#38BDF8');
    pR(headX - 9, faceTop + 1, 2, 6, '#F59E0B');
    pR(headX + 9, faceTop + 1, 2, 6, '#F59E0B');

    // Màn hình Visor Kính Đen & Đôi Mắt LED Điện Tử
    pR(headX - 5, faceTop, 12, 8, '#0F172A');
    pR(headX - 4, faceTop + 2, 4, 3, '#38BDF8');
    pR(headX + 2, faceTop + 2, 4, 3, '#38BDF8');
    pD(headX - 3, faceTop + 2, '#FFFFFF');
    pD(headX + 3, faceTop + 2, '#FFFFFF');
    // Sóng âm thanh LED miệng
    pR(headX - 2, faceTop + 6, 6, 1, pulseLed > 0.5 ? '#34D399' : '#10B981');
  },

  // --- BỘ ĐIỀU PHỐI VẼ THÂN NHÂN VIÊN TRỰC QUẦY (TRƯỚC MẶT BÀN) ---
  drawActiveStaff(ctx) {
    if (!this.activeStaff || this.activeStaff.expired) return;
    const id = this.activeStaff.npcId;
    if (id === 'anh_lam') {
      this.drawAnhLam(ctx);
    } else if (id === 'co_mai') {
      this.drawCoMai(ctx);
    } else if (id === 'bot_p800') {
      this.drawBotP800(ctx);
    } else {
      this.drawBeBap(ctx);
    }
  },

  // --- VẼ CÁNH TAY NHÂN VIÊN ĐẶT TRÊN MẶT QUẦY ĐÁ, BÌNH LẮC & BẢNG TÊN (VẼ LỚP TRÊN CÙNG SAU DRAWCARTFRONT) ---
  drawActiveStaffForearms(ctx) {
    if (!this.activeStaff || this.activeStaff.expired) return;
    const bx = 132;
    const bob = Math.round(Math.sin(this.tick * 0.12 + 1) * 1);
    const id = this.activeStaff.npcId;
    const isBot = id === 'bot_p800';
    const skin = isBot ? '#38BDF8' : (id === 'anh_lam' ? '#FCD7B0' : (id === 'co_mai' ? '#FED7AA' : '#FFE0BD'));
    const isWorking = !!(this.isShaking || this.staffActionText);

    const pR = (x, y, w, h, col) => {
      ctx.fillStyle = col;
      ctx.fillRect(Math.round(x), Math.round(y), Math.round(w), Math.round(h));
    };
    const pD = (x, y, col) => {
      ctx.fillStyle = col;
      ctx.fillRect(Math.round(x), Math.round(y), 1, 1);
    };

    if (isWorking) {
      const shakeArm = Math.round(Math.sin(this.tick * 0.85) * 3);
      // Cánh tay cầm bình lắc Inox trên mặt quầy
      pR(bx - 1, 104 + bob, 3, 7, skin);
      pR(bx + 15, 104 + bob, 3, 7, skin);
      pR(bx + 6, 98 + bob + shakeArm, 4, 8, skin);

      // Bình lắc Inox 304 chuyển động trên tay nhân viên
      const shX = bx + 5;
      const shY = 91 + bob + shakeArm;
      pR(shX, shY, 8, 13, '#CBD5E1');
      pR(shX + 1, shY, 2, 13, '#FFFFFF');
      pR(shX + 6, shY, 2, 13, '#64748B');
      pR(shX + 2, shY - 3, 4, 3, '#94A3B8');
      pD(shX + 3, shY + 4, '#F472B6');
      pD(shX - 2, shY + 2, '#FDE047');
      pD(shX + 9, shY + 5, '#FFFFFF');
    } else {
      // Cánh tay đặt ngay ngắn trên mặt bàn đá cẩm thạch + Ly trà sữa vừa pha xong
      pR(bx - 1, 104 + bob, 3, 8, skin);
      pR(bx + 1, 110 + bob, 3, 3, skin);
      pR(bx + 15, 104 + bob, 3, 8, skin);
      pR(bx + 14, 110 + bob, 3, 3, skin);

      // Ly trà sữa trân châu đặt trước mặt nhân viên trên quầy
      const cupX = bx + 6;
      const cupY = 104 + bob;
      pR(cupX, cupY, 6, 9, '#FFFBEB');
      pR(cupX + 1, cupY + 2, 4, 6, '#D97706'); // cốt trà sữa
      pD(cupX + 2, cupY + 6, '#1E293B'); // trân châu đen
      pD(cupX + 4, cupY + 7, '#1E293B');
      pR(cupX - 1, cupY, 8, 2, '#F43F5E'); // màng dập nắp đỏ
      pR(cupX + 3, cupY - 4, 1, 4, '#2ECC71'); // ống hút xanh
    }

    // Bảng tên & trạng thái trực quầy nổi rõ phía trên đầu NPC (không bị mái hiên che)
    const label = this.staffActionText || `🧑‍🍳 ${this.activeStaff.name || 'Barista'}`;
    ctx.save();
    ctx.font = 'bold 6.5px sans-serif';
    const textW = Math.max(36, Math.ceil(ctx.measureText(label).width) + 10);
    const centerX = bx + 9;
    const pillX = Math.round(centerX - textW / 2);
    const pillY = 63 + bob;

    ctx.fillStyle = 'rgba(15, 23, 42, 0.88)';
    ctx.beginPath();
    if (ctx.roundRect) {
      ctx.roundRect(pillX, pillY, textW, 9, 3);
    } else {
      ctx.rect(pillX, pillY, textW, 9);
    }
    ctx.fill();
    ctx.strokeStyle = this.staffActionText ? '#00cec9' : '#2ecc71';
    ctx.lineWidth = 0.8;
    ctx.stroke();

    ctx.fillStyle = this.staffActionText ? '#55efc4' : '#ffeaa7';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(label, centerX, pillY + 4.8);
    ctx.restore();
  }
};

