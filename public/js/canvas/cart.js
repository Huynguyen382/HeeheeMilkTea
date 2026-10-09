// HeeHee Stall & Multi-Stall Collab Renderer for GameCanvas

export const cartMethods = {
  drawCart(ctx) {
    this.drawCartBack(ctx);
    this.drawCartFront(ctx);
  },

  // --- CART BACK LAYER: REAR PILLARS, ARTISAN SHELVES & PENDANT LIGHT (Behind Hyhy) ---
  drawCartBack(ctx) {
    const cx = 35;
    const cy = 92;

    // 1. Rear Awning Support Pillars (Brushed Gunmetal & Brass)
    ctx.fillStyle = '#4b4b5a';
    ctx.fillRect(cx + 8, cy - 35, 3, 53);
    ctx.fillRect(cx + 133, cy - 35, 3, 53);

    // 2. Back Wood Shelving Panel Unit (Kệ gỗ trưng bày siro & hũ trà)
    const shelfX = cx + 6;
    const shelfY = cy - 26;
    const shelfW = 132;
    const shelfH = 44;

    // Dark oak backboard with horizontal wood slat grooves
    ctx.fillStyle = '#2c160a';
    ctx.beginPath();
    ctx.roundRect(shelfX, shelfY, shelfW, shelfH, 3);
    ctx.fill();

    // Wood slat grooves
    ctx.fillStyle = '#1e0e06';
    for (let sy = shelfY + 9; sy < shelfY + shelfH; sy += 9) {
      ctx.fillRect(shelfX, sy, shelfW, 1);
    }

    // Upper Shelf (y = cy - 13 = 79)
    ctx.fillStyle = '#5c2d13';
    ctx.fillRect(shelfX + 4, cy - 13, shelfW - 8, 3);
    ctx.fillStyle = '#8a431c';
    ctx.fillRect(shelfX + 4, cy - 14, shelfW - 8, 1); // shelf highlight

    // Lower Shelf (y = cy + 4 = 96)
    ctx.fillStyle = '#5c2d13';
    ctx.fillRect(shelfX + 4, cy + 3, shelfW - 8, 3);
    ctx.fillStyle = '#8a431c';
    ctx.fillRect(shelfX + 4, cy + 2, shelfW - 8, 1);

    // Brass shelf brackets
    ctx.fillStyle = '#f4c430';
    ctx.fillRect(shelfX + 6, cy - 10, 2, 4);
    ctx.fillRect(shelfX + shelfW - 8, cy - 10, 2, 4);
    ctx.fillRect(shelfX + 6, cy + 6, 2, 4);
    ctx.fillRect(shelfX + shelfW - 8, cy + 6, 2, 4);

    // --- UPPER SHELF ITEMS: ARTISAN SYRUP BOTTLES & TEA CANISTERS ---
    // 5 Slender glass syrup bottles with colorful glowing translucent syrups
    const syrups = [
      { x: shelfX + 8, color: '#e74c3c' },  // Dâu tây (Strawberry)
      { x: shelfX + 17, color: '#f39c12' }, // Đào vàng (Peach)
      { x: shelfX + 26, color: '#2ecc71' }, // Bạc hà (Mint)
      { x: shelfX + 35, color: '#9b59b6' }, // Khoai môn (Taro)
      { x: shelfX + 44, color: '#e67e22' }, // Cam quế (Orange)
    ];

    syrups.forEach(s => {
      // Bottle neck & cork
      ctx.fillStyle = '#d35400';
      ctx.fillRect(s.x + 2, cy - 24, 2, 2); // cork
      ctx.fillStyle = 'rgba(255, 255, 255, 0.4)';
      ctx.fillRect(s.x + 2, cy - 22, 2, 2); // glass neck
      // Bottle glass body
      ctx.fillRect(s.x, cy - 20, 6, 7);
      // Colorful syrup liquid
      ctx.fillStyle = s.color;
      ctx.fillRect(s.x + 0.6, cy - 18, 4.8, 5);
      // Paper label
      ctx.fillStyle = '#fff8dc';
      ctx.fillRect(s.x + 1, cy - 16, 4, 2.5);
    });

    // Ceramic Tea Canisters (Hũ trà men sứ trắng cổ truyền)
    const teaJars = [
      { x: shelfX + 56, capColor: '#c0392b' }, // Oolong
      { x: shelfX + 68, capColor: '#27ae60' }, // Lài
      { x: shelfX + 80, capColor: '#2c3e50' }, // Trà Đen
    ];
    teaJars.forEach(tj => {
      ctx.fillStyle = '#ecf0f1';
      ctx.beginPath();
      ctx.roundRect(tj.x, cy - 22, 9, 9, 2);
      ctx.fill();
      ctx.fillStyle = tj.capColor;
      ctx.fillRect(tj.x + 1, cy - 24, 7, 2);
      ctx.fillStyle = '#bdc3c7';
      ctx.fillRect(tj.x + 2, cy - 18, 5, 2);
    });

    // Hanging Chalkboard Menu on back wall
    ctx.fillStyle = '#1e272e';
    ctx.beginPath();
    ctx.roundRect(shelfX + 94, cy - 23, 32, 10, 1.5);
    ctx.fill();
    ctx.strokeStyle = '#8a431c';
    ctx.lineWidth = 1;
    ctx.strokeRect(shelfX + 94, cy - 23, 32, 10);
    ctx.fillStyle = '#f1f2f6';
    ctx.font = 'bold 5px sans-serif';
    ctx.fillText('MENU HEEHEE 🧋', shelfX + 96, cy - 17);
    ctx.fillStyle = '#feca57';
    ctx.fillText('ĐỒNG GIÁ 25k ⭐', shelfX + 96, cy - 14);

    // --- LOWER SHELF ITEMS: CUP STACKS & SUCCULENT ---
    // Stacks of paper cups
    for (let c = 0; c < 3; c++) {
      ctx.fillStyle = '#ffffff';
      ctx.beginPath();
      ctx.roundRect(shelfX + 8 + c * 8, cy - 7, 6, 10, 1);
      ctx.fill();
      ctx.fillStyle = '#ff7675';
      ctx.fillRect(shelfX + 9 + c * 8, cy - 3, 4, 3);
    }

    // Mini decorative potted succulent
    ctx.fillStyle = '#e17055';
    ctx.beginPath();
    ctx.roundRect(shelfX + 116, cy - 5, 8, 8, 1);
    ctx.fill();
    ctx.fillStyle = '#00b894';
    ctx.beginPath();
    ctx.arc(shelfX + 120, cy - 6, 4, 0, Math.PI * 2);
    ctx.fill();

    // Vintage Edison Pendant Bulb hanging from ceiling above Hyhy
    const lampX = cx + 64;
    const lampY = cy - 26;
    ctx.strokeStyle = '#2d3436';
    ctx.lineWidth = 1.2;
    ctx.beginPath();
    ctx.moveTo(lampX, cy - 40);
    ctx.lineTo(lampX, lampY);
    ctx.stroke();
    ctx.fillStyle = '#f4c430';
    ctx.fillRect(lampX - 2, lampY, 4, 3);
    ctx.fillStyle = 'rgba(255, 235, 160, 0.95)';
    ctx.beginPath();
    ctx.arc(lampX, lampY + 5, 3.5, 0, Math.PI * 2);
    ctx.fill();
    // Warm radial ambient light glow cone
    const warmPendantGlow = ctx.createRadialGradient(lampX, lampY + 5, 2, lampX, lampY + 16, 42);
    warmPendantGlow.addColorStop(0, 'rgba(255, 215, 0, 0.38)');
    warmPendantGlow.addColorStop(0.6, 'rgba(255, 175, 50, 0.14)');
    warmPendantGlow.addColorStop(1, 'rgba(255, 175, 50, 0)');
    ctx.fillStyle = warmPendantGlow;
    ctx.beginPath();
    ctx.arc(lampX, lampY + 16, 42, 0, Math.PI * 2);
    ctx.fill();
  },

  // --- CART FRONT LAYER: COUNTERTOP, FRONT CHASSIS, GLASS SHOWCASE, AWNING & EQUIPMENT (In front of Hyhy) ---
  drawCartFront(ctx) {
    const cx = 35;
    const cy = 92;

    // Cart Drop Shadow on street
    ctx.fillStyle = 'rgba(10, 5, 12, 0.6)';
    ctx.beginPath();
    ctx.ellipse(cx + 70, cy + 62, 75, 10, 0, 0, Math.PI * 2);
    ctx.fill();

    // 1. Heavy Duty Wheel Axle across bottom
    ctx.fillStyle = '#2d3436';
    ctx.fillRect(cx + 25, cy + 53, 90, 3);

    // 2. Cart Wheels with Spoke detailing & Gold rim
    this.drawWheel(ctx, cx + 25, cy + 54);
    this.drawWheel(ctx, cx + 115, cy + 54);

    // 3. Cart Wooden Chassis (Front Panel with clearance underneath for visible legs)
    ctx.fillStyle = '#4a2612'; // dark wood border
    ctx.fillRect(cx, cy + 22, 145, 27);

    ctx.fillStyle = '#783e1d'; // warm polished mahogany
    ctx.fillRect(cx + 3, cy + 24, 139, 23);

    // Wood panel horizontal bevels
    ctx.fillStyle = '#5f2f14';
    ctx.fillRect(cx + 3, cy + 32, 139, 1.5);
    ctx.fillRect(cx + 3, cy + 40, 139, 1.5);

    // Polished Brass Corner Brackets with rivets
    ctx.fillStyle = '#f4c430';
    ctx.fillRect(cx, cy + 22, 6, 6);
    ctx.fillRect(cx + 139, cy + 22, 6, 6);
    ctx.fillRect(cx, cy + 43, 6, 6);
    ctx.fillRect(cx + 139, cy + 43, 6, 6);

    // 4. Modern Glass Pastry & Topping Showcase in Front Panel (Tủ kính trưng bày bánh flan & tart)
    const glassX = cx + 38;
    const glassY = cy + 25;
    const glassW = 68;
    const glassH = 20;

    // Showcase frame & dark interior
    ctx.fillStyle = '#1c0f08';
    ctx.beginPath();
    ctx.roundRect(glassX, glassY, glassW, glassH, 2);
    ctx.fill();

    // Showcase interior warm glow
    ctx.fillStyle = 'rgba(255, 220, 130, 0.2)';
    ctx.fillRect(glassX + 2, glassY + 2, glassW - 4, glassH - 4);

    // Glass showcase shelf
    ctx.fillStyle = 'rgba(255, 255, 255, 0.4)';
    ctx.fillRect(glassX + 2, glassY + 11, glassW - 4, 1.5);

    // Showcase Items: Mini Egg Tarts (Bánh tart trứng vàng óng)
    for (let t = 0; t < 3; t++) {
      const tx = glassX + 6 + t * 9;
      ctx.fillStyle = '#e67e22'; // crust
      ctx.beginPath();
      ctx.ellipse(tx + 3, glassY + 9, 3.5, 2, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#f1c40f'; // golden egg custard
      ctx.beginPath();
      ctx.ellipse(tx + 3, glassY + 8.5, 2.5, 1.5, 0, 0, Math.PI * 2);
      ctx.fill();
    }

    // Showcase Items: Caramel Flan Puddings (Bánh flan caramen)
    for (let f = 0; f < 3; f++) {
      const fx = glassX + 38 + f * 9;
      ctx.fillStyle = '#f5cd79'; // pudding body
      ctx.beginPath();
      ctx.roundRect(fx, glassY + 13, 6, 5, 1);
      ctx.fill();
      ctx.fillStyle = '#d35400'; // dark caramel syrup top
      ctx.fillRect(fx, glassY + 13, 6, 1.5);
    }

    // Glass glare reflection lines
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.35)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(glassX + 4, glassY + glassH - 2);
    ctx.lineTo(glassX + 16, glassY + 2);
    ctx.moveTo(glassX + 20, glassY + glassH - 2);
    ctx.lineTo(glassX + 30, glassY + 2);
    ctx.stroke();

    // 5. Polished Carrara Marble Countertop with rounded edges & gloss highlight
    ctx.fillStyle = '#eddcd2';
    ctx.beginPath();
    ctx.roundRect(cx - 6, cy + 17, 157, 6, 2);
    ctx.fill();
    ctx.fillStyle = '#d6c2b4';
    ctx.fillRect(cx - 6, cy + 21, 157, 2); // bevel edge
    ctx.fillStyle = 'rgba(255, 255, 255, 0.7)';
    ctx.fillRect(cx - 5, cy + 18, 155, 1); // specular gloss line

    // 6. Front Awning Support Pillars (Polished Chrome & Gold Brackets)
    ctx.fillStyle = '#c5c5d2';
    ctx.fillRect(cx + 4, cy - 35, 4, 53);
    ctx.fillRect(cx + 137, cy - 35, 4, 53);
    ctx.fillStyle = '#f4c430';
    ctx.fillRect(cx + 3, cy + 13, 6, 4);
    ctx.fillRect(cx + 136, cy + 13, 6, 4);

    // 7. Fabric Striped Awning Roof with Scalloped Edge
    const awningY = cy - 42;
    const stripeColors = ['#d9383a', '#fff8dc', '#d9383a', '#fff8dc', '#d9383a', '#fff8dc', '#d9383a', '#fff8dc', '#d9383a'];
    const sw = 18;
    for (let i = 0; i < stripeColors.length; i++) {
      ctx.fillStyle = stripeColors[i];
      const sx = cx - 8 + i * sw;
      ctx.fillRect(sx, awningY, sw, 16);

      // Scalloped bottom ruffle
      ctx.beginPath();
      ctx.arc(sx + sw / 2, awningY + 16, sw / 2, 0, Math.PI);
      ctx.fill();
    }

    // Awning shadow underneath
    ctx.fillStyle = 'rgba(0, 0, 0, 0.25)';
    ctx.fillRect(cx - 8, awningY + 16, 162, 3);

    // --- SLEEPING CAT ON AWNING ROOF ---
    const catX = cx + 85;
    const catY = awningY - 4;
    const catBreathe = Math.sin(this.tick * 0.08) * 1;
    ctx.fillStyle = '#e67e22'; // Orange tabby body
    ctx.beginPath();
    ctx.ellipse(catX, catY + catBreathe, 7, 4, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#fff'; // White head
    ctx.beginPath();
    ctx.arc(catX - 6, catY - 1 + catBreathe, 3.5, 0, Math.PI * 2);
    ctx.fill();
    // Sleeping eyes
    ctx.fillStyle = '#111';
    ctx.fillRect(catX - 7, catY - 1 + catBreathe, 2, 1);
    // Tail twitch
    const catTail = Math.sin(this.tick * 0.12) * 2;
    ctx.fillStyle = '#e67e22';
    ctx.fillRect(catX + 6, catY + catTail, 4, 2);

    // 8. Glowing Neon Store Plaque "TRÀ SỮA HEEHEE" (Tự động căn giữa, bo góc và chống tràn viền)
    const neonPulse = (Math.sin(this.tick * 0.1) + 1) * 0.15 + 0.85;
    const plaqueX = cx + 16;
    const plaqueY = cy + 27;
    const plaqueW = 112;
    const plaqueH = 17;

    // Plaque body with dark lacquer finish
    ctx.fillStyle = '#1e0c18';
    ctx.beginPath();
    ctx.roundRect(plaqueX, plaqueY, plaqueW, plaqueH, 3.5);
    ctx.fill();

    // Glowing Neon Golden Border
    ctx.strokeStyle = `rgba(244, 196, 48, ${neonPulse})`;
    ctx.lineWidth = 1.5;
    ctx.stroke();

    // Brass corner rivets
    ctx.fillStyle = '#f39c12';
    ctx.fillRect(plaqueX + 2, plaqueY + 2, 2, 2);
    ctx.fillRect(plaqueX + plaqueW - 4, plaqueY + 2, 2, 2);
    ctx.fillRect(plaqueX + 2, plaqueY + plaqueH - 4, 2, 2);
    ctx.fillRect(plaqueX + plaqueW - 4, plaqueY + plaqueH - 4, 2, 2);

    // Neon glowing text centered perfectly inside plaque
    ctx.save();
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    let fontSize = 9.5;
    const signText = (this.chapter >= 3) ? '★ HEEHEE FLAGSHIP ★' : '🧋 TRÀ SỮA HEEHEE';
    ctx.font = `bold ${fontSize}px sans-serif`;
    while (ctx.measureText(signText).width > plaqueW - 14 && fontSize > 6) {
      fontSize -= 0.5;
      ctx.font = `bold ${fontSize}px sans-serif`;
    }
    // Subtle neon glow
    ctx.shadowColor = 'rgba(244, 196, 48, 0.6)';
    ctx.shadowBlur = 4 * neonPulse;
    ctx.fillStyle = '#f4c430';
    ctx.fillText(signText, plaqueX + plaqueW / 2, plaqueY + plaqueH / 2 + 0.5);
    ctx.restore();

    // 9. EQUIPMENT ON THE COUNTER:
    // A. Stainless Steel Tea Urn with Sight Glass Gauge
    ctx.fillStyle = '#bdc3c7';
    ctx.beginPath();
    ctx.roundRect(cx + 8, cy + 1, 15, 17, 2);
    ctx.fill();
    ctx.fillStyle = '#7f8c8d';
    ctx.fillRect(cx + 9, cy, 13, 3); // lid
    ctx.fillStyle = '#e74c3c';
    ctx.fillRect(cx + 13, cy + 13, 5, 3); // red spigot
    // Clear sight tube on side showing tea level!
    ctx.fillStyle = 'rgba(255, 255, 255, 0.7)';
    ctx.fillRect(cx + 6, cy + 3, 2, 12);
    ctx.fillStyle = '#8b4513'; // tea liquid inside gauge
    ctx.fillRect(cx + 6, cy + 6, 2, 9);

    // B. Glass Topping Jars with Condensation Sheen
    this.drawGlassJar(ctx, cx + 28, cy + 7, '#111'); // Tapioca
    this.drawGlassJar(ctx, cx + 40, cy + 7, '#f39c12'); // Golden pearl
    this.drawGlassJar(ctx, cx + 52, cy + 7, '#27ae60'); // Matcha jelly

    // C. Stainless Steel Ice Tub with Ice Scoop Handle
    ctx.fillStyle = '#95a5a6';
    ctx.beginPath();
    ctx.roundRect(cx + 66, cy + 8, 14, 9, 1);
    ctx.fill();
    ctx.fillStyle = '#ecf0f1'; // ice cubes
    ctx.fillRect(cx + 68, cy + 7, 10, 4);
    ctx.fillStyle = '#bdc3c7';
    ctx.fillRect(cx + 76, cy + 3, 2, 6);

    // D. Cup Sealing Machine (Máy dập nắp)
    const sealX = cx + 84;
    ctx.fillStyle = '#c0392b';
    ctx.beginPath();
    ctx.roundRect(sealX, cy + 2, 16, 16, 2);
    ctx.fill();
    ctx.fillStyle = '#e74c3c';
    ctx.fillRect(sealX + 2, cy + 4, 12, 12);
    // Film roll
    ctx.fillStyle = '#f39c12';
    ctx.fillRect(sealX + 3, cy - 3, 10, 5);
    // Pull lever
    ctx.fillStyle = '#34495e';
    ctx.fillRect(sealX + 13, cy, 2, 7);

    // E. Boiling Pearl Cooker Pot with Animated Brown Sugar Bubbles & Steam
    ctx.fillStyle = '#2c3e50';
    ctx.beginPath();
    ctx.roundRect(cx + 120, cy + 3, 18, 15, 2);
    ctx.fill();
    ctx.fillStyle = '#d35400';
    ctx.fillRect(cx + 121, cy + 4, 16, 4);
    // Amber bubbles
    if ((this.tick % 12) < 6) {
      ctx.fillStyle = '#f39c12';
      ctx.fillRect(cx + 124, cy + 5, 3, 2);
      ctx.fillRect(cx + 131, cy + 4, 2, 2);
    }

    // Steam particles
    for (let s = 0; s < 4; s++) {
      const steamProg = ((this.tick * 0.7 + s * 10) % 28);
      const steamAlpha = 1 - (steamProg / 28);
      ctx.fillStyle = `rgba(255, 255, 255, ${steamAlpha * 0.45})`;
      ctx.beginPath();
      ctx.arc(cx + 126 + s * 3 + Math.sin(this.tick * 0.1 + s) * 4, cy + 2 - steamProg, 2 + steamProg * 0.15, 0, Math.PI * 2);
      ctx.fill();
    }

    // --- SIDE STREET STOOL & ICED TEA SETUP ---
    const stoolX = cx - 22;
    const stoolY = cy + 45;
    // Blue plastic stool (Ghế nhựa xanh vỉa hè)
    ctx.fillStyle = '#2980b9';
    ctx.fillRect(stoolX, stoolY, 14, 3); // seat
    ctx.fillRect(stoolX + 1, stoolY + 3, 2, 10); // legs
    ctx.fillRect(stoolX + 11, stoolY + 3, 2, 10);
    // Low table with iced tea (Trà đá) and sunflower seeds
    ctx.fillStyle = '#e67e22';
    ctx.fillRect(stoolX + 2, stoolY - 3, 5, 2);
    ctx.fillStyle = '#111';
    ctx.fillRect(stoolX + 3, stoolY - 4, 3, 1);
    // Tall glass of iced tea with lemon slice!
    ctx.fillStyle = 'rgba(255, 255, 255, 0.6)';
    ctx.fillRect(stoolX + 8, stoolY - 7, 4, 7);
    ctx.fillStyle = '#f1c40f';
    ctx.fillRect(stoolX + 9, stoolY - 5, 2, 4);

    // --- PARKED FLEET VEHICLES DISPLAY (HỆ THỐNG XE ĐỖ BÊN QUÁN) ---
    this.drawParkedVehicles(ctx, cx, cy);
  },

  drawParkedVehicles(ctx, cx, cy) {
    const upgrades = (this.upgrades || (window.state && window.state.storeState && window.state.storeState.save && window.state.storeState.save.upgrades)) || {};
    let upMap = typeof upgrades === 'string' ? {} : upgrades;
    try {
      if (typeof upgrades === 'string') upMap = JSON.parse(upgrades);
    } catch (e) {}

    // 1. Xe Đạp Thồ Sen Tây Hồ (🚲 Gác cạnh quán)
    if (upMap.xe_dap_tho_sen) {
      const bx = cx - 28;
      const by = cy + 38;
      // Bicycle wheels
      ctx.fillStyle = '#2d3436';
      ctx.beginPath();
      ctx.arc(bx, by + 12, 6, 0, Math.PI * 2);
      ctx.arc(bx + 16, by + 12, 6, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#dfe6e9'; // Spokes center
      ctx.fillRect(bx - 0.5, by + 11.5, 1, 1);
      ctx.fillRect(bx + 15.5, by + 11.5, 1, 1);
      // Frame (Vintage green)
      ctx.strokeStyle = '#27ae60';
      ctx.lineWidth = 1.2;
      ctx.beginPath();
      ctx.moveTo(bx, by + 12);
      ctx.lineTo(bx + 7, by + 12);
      ctx.lineTo(bx + 13, by + 6);
      ctx.lineTo(bx + 16, by + 12);
      ctx.moveTo(bx + 7, by + 12);
      ctx.lineTo(bx + 5, by + 4); // seat post
      ctx.lineTo(bx, by + 12);
      ctx.stroke();
      // Handlebar & Saddle
      ctx.fillStyle = '#795548';
      ctx.fillRect(bx + 3, by + 3, 5, 1.5); // saddle
      ctx.strokeStyle = '#95a5a6';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(bx + 13, by + 6);
      ctx.lineTo(bx + 12, by + 2);
      ctx.lineTo(bx + 14, by + 2);
      ctx.stroke();
      // Lotus Flower Basket on Rear Rack (Bó hoa sen Tây Hồ tươi thắm)
      ctx.fillStyle = '#55efc4';
      ctx.beginPath();
      ctx.arc(bx + 1, by + 6, 3, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#ff7675'; // Lotus blossoms
      ctx.beginPath();
      ctx.arc(bx + 2, by + 4, 2, 0, Math.PI * 2);
      ctx.arc(bx - 1, by + 5, 2, 0, Math.PI * 2);
      ctx.fill();
    }

    // 2. Xe Dream Chiến Tem Lửa (🏍️ Đỗ cạnh vỉa hè)
    if (upMap.xe_dream_chien && (!this.motorbikeShipper || !this.motorbikeShipper.active)) {
      const dx = cx - 18;
      const dy = cy + 50;
      // Ground shadow
      ctx.fillStyle = 'rgba(0, 0, 0, 0.35)';
      ctx.beginPath();
      ctx.ellipse(dx + 8, dy + 10, 10, 3, 0, 0, Math.PI * 2);
      ctx.fill();
      // Wheels
      ctx.fillStyle = '#111';
      ctx.fillRect(dx - 3, dy + 5, 4, 4);
      ctx.fillRect(dx + 13, dy + 5, 4, 4);
      // Silver spokes
      ctx.fillStyle = '#bdc3c7';
      ctx.fillRect(dx - 2, dy + 6, 2, 2);
      ctx.fillRect(dx + 14, dy + 6, 2, 2);
      // Engine block & Exhaust pipe (Bô Dream sáng loáng)
      ctx.fillStyle = '#7f8c8d';
      ctx.fillRect(dx + 2, dy + 4, 6, 4);
      ctx.fillStyle = '#ecf0f1';
      ctx.fillRect(dx + 3, dy + 7, 10, 1.5);
      // Dark Red Body with Fire Decal (Đỏ mận tem lửa)
      ctx.fillStyle = '#78281f';
      ctx.fillRect(dx, dy + 1, 14, 4);
      ctx.fillStyle = '#f39c12'; // Fire decal
      ctx.fillRect(dx + 4, dy + 2, 5, 1);
      ctx.fillStyle = '#e74c3c';
      ctx.fillRect(dx + 7, dy + 1, 2, 1);
      // Black seat
      ctx.fillStyle = '#2c3e50';
      ctx.fillRect(dx, dy - 1, 9, 2);
      // Headlight & Mirror
      ctx.fillStyle = '#f1c40f';
      ctx.fillRect(dx + 13, dy, 2, 2);
      ctx.fillStyle = '#bdc3c7';
      ctx.fillRect(dx + 11, dy - 3, 1, 3);
    }
  },

  drawWheel(ctx, x, y) {
    ctx.fillStyle = '#111';
    ctx.beginPath();
    ctx.arc(x, y, 11, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#f4c430'; // Gold rim
    ctx.beginPath();
    ctx.arc(x, y, 9, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#444';
    ctx.beginPath();
    ctx.arc(x, y, 7, 0, Math.PI * 2);
    ctx.fill();
    // Center cap
    ctx.fillStyle = '#f4c430';
    ctx.beginPath();
    ctx.arc(x, y, 3, 0, Math.PI * 2);
    ctx.fill();
  },

  drawCollabStalls(ctx) {
    const slots = [
      { x: 205, y: 92 },
      { x: 375, y: 92 },
      { x: 545, y: 92 }
    ];

    for (let i = 0; i < 3; i++) {
      const partner = (this.activeCollabs && this.activeCollabs[i]) ? this.activeCollabs[i] : null;
      const slot = slots[i];
      if (partner) {
        this.drawPartnerCart(ctx, slot.x, slot.y, partner, i);
      } else {
        this.drawCollabPlaceholder(ctx, slot.x, slot.y, i);
      }
    }

    // Draw active animated customers visiting online partner stalls!
    this.drawCollabCustomers(ctx);
  },

  drawPartnerCart(ctx, cx, cy, partner, index) {
    // Unique aesthetic themes per collab slot
    const themes = [
      {
        // Slot 1: Bạc hà tươi mát (Mint & Cream)
        chassis: '#2e7d32',
        chassisBorder: '#1b5e20',
        rivet: '#f1c40f',
        awning1: '#00b894',
        awning2: '#f8f9fa',
        neonBorder: (p) => `rgba(85, 239, 196, ${p})`,
        neonGlow: 'rgba(85, 239, 196, 0.7)',
        neonText: '#55efc4',
        neonRivet: '#00cec9',
        shirt: '#ffffff',
        apron: '#00b894',
        hat: '#00cec9',
        hair: '#2d3436'
      },
      {
        // Slot 2: Khoai môn hoàng gia (Taro Purple & Cream)
        chassis: '#4a235a',
        chassisBorder: '#2c1038',
        rivet: '#dcdde1',
        awning1: '#6c5ce7',
        awning2: '#ffeaa7',
        neonBorder: (p) => `rgba(162, 155, 254, ${p})`,
        neonGlow: 'rgba(162, 155, 254, 0.7)',
        neonText: '#e056fd',
        neonRivet: '#a29bfe',
        shirt: '#2d3436',
        apron: '#6c5ce7',
        hat: '#2f3542',
        hair: '#e17055'
      },
      {
        // Slot 3: Trà đào cam sả (Peach & Sunset Orange)
        chassis: '#b9770e',
        chassisBorder: '#7e5109',
        rivet: '#f39c12',
        awning1: '#e17055',
        awning2: '#fdcb6e',
        neonBorder: (p) => `rgba(255, 184, 108, ${p})`,
        neonGlow: 'rgba(255, 184, 108, 0.7)',
        neonText: '#ffeaa7',
        neonRivet: '#e67e22',
        shirt: '#ffeaa7',
        apron: '#d35400',
        hat: '#e67e22',
        hair: '#2c3e50'
      }
    ];

    const theme = themes[index % themes.length];

    // 1. Cart Drop Shadow on street
    ctx.fillStyle = 'rgba(10, 5, 12, 0.55)';
    ctx.beginPath();
    ctx.ellipse(cx + 68, cy + 62, 70, 9, 0, 0, Math.PI * 2);
    ctx.fill();

    // 2. Heavy Duty Axle & Wheels
    ctx.fillStyle = '#2d3436';
    ctx.fillRect(cx + 22, cy + 53, 90, 3);
    this.drawWheel(ctx, cx + 24, cy + 54);
    this.drawWheel(ctx, cx + 112, cy + 54);

    // 3. Rear Support Pillars & Shelves
    ctx.fillStyle = '#3d3d4a';
    ctx.fillRect(cx + 8, cy - 35, 3, 53);
    ctx.fillRect(cx + 128, cy - 35, 3, 53);

    const shelfX = cx + 6, shelfY = cy - 24, shelfW = 126, shelfH = 40;
    ctx.fillStyle = '#1e0e06';
    ctx.beginPath();
    ctx.roundRect(shelfX, shelfY, shelfW, shelfH, 2);
    ctx.fill();
    ctx.fillStyle = '#5c2d13';
    ctx.fillRect(shelfX + 4, cy - 12, shelfW - 8, 3);
    ctx.fillRect(shelfX + 4, cy + 4, shelfW - 8, 3);

    const syrups = ['#e74c3c', '#f39c12', '#2ecc71', '#9b59b6'];
    syrups.forEach((col, sIdx) => {
      ctx.fillStyle = col;
      ctx.fillRect(shelfX + 8 + sIdx * 9, cy - 10, 6, 8);
      ctx.fillStyle = '#f5cd79';
      ctx.fillRect(shelfX + 9 + sIdx * 9, cy - 13, 4, 3);
    });

    // 4. Partner Barista Sprite inside stall
    const bob = Math.round(Math.sin(this.tick * 0.12 + index * 2) * 1.5);
    const bx = cx + 64;
    const by = cy - 6 + bob;

    // Body & Apron
    ctx.fillStyle = theme.shirt;
    ctx.fillRect(bx - 8, by + 12, 16, 15);
    ctx.fillStyle = theme.apron;
    ctx.fillRect(bx - 6, by + 16, 12, 13);
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(bx - 3, by + 12, 6, 3); // collar

    // Head, Hair & Smiling Face
    ctx.fillStyle = '#ffeaa7';
    ctx.fillRect(bx - 6, by + 2, 12, 10);
    ctx.fillStyle = theme.hair;
    ctx.fillRect(bx - 7, by, 14, 4);
    ctx.fillRect(bx - 8, by + 3, 2, 5);
    ctx.fillRect(bx + 6, by + 3, 2, 5);
    // Eyes & Blush
    ctx.fillStyle = '#2d3436';
    ctx.fillRect(bx - 4, by + 5, 2, 2);
    ctx.fillRect(bx + 2, by + 5, 2, 2);
    ctx.fillStyle = '#ff7675';
    ctx.fillRect(bx - 5, by + 8, 2, 1.5);
    ctx.fillRect(bx + 3, by + 8, 2, 1.5);
    // Beret Hat
    ctx.fillStyle = theme.hat;
    ctx.beginPath();
    ctx.ellipse(bx, by - 1, 9, 4, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillRect(bx - 1, by - 4, 2, 3);

    // Shaker action
    const armShake = Math.sin(this.tick * 0.25 + index) * 2;
    ctx.fillStyle = '#bdc3c7';
    ctx.fillRect(bx + 6, by + 15 + armShake, 5, 9);
    ctx.fillStyle = '#7f8c8d';
    ctx.fillRect(bx + 7, by + 13 + armShake, 3, 2);

    // 5. Wooden Chassis Front Panel
    ctx.fillStyle = theme.chassisBorder;
    ctx.fillRect(cx, cy + 22, 138, 26);
    ctx.fillStyle = theme.chassis;
    ctx.fillRect(cx + 3, cy + 24, 132, 22);

    // Brass corner rivets
    ctx.fillStyle = theme.rivet;
    ctx.fillRect(cx, cy + 22, 5, 5);
    ctx.fillRect(cx + 133, cy + 22, 5, 5);
    ctx.fillRect(cx, cy + 43, 5, 5);
    ctx.fillRect(cx + 133, cy + 43, 5, 5);

    // 6. Glass Topping / Pastry Showcase
    const glassX = cx + 36, glassY = cy + 25, glassW = 66, glassH = 19;
    ctx.fillStyle = '#1c0f08';
    ctx.beginPath();
    ctx.roundRect(glassX, glassY, glassW, glassH, 2);
    ctx.fill();
    ctx.fillStyle = 'rgba(255, 220, 130, 0.18)';
    ctx.fillRect(glassX + 2, glassY + 2, glassW - 4, glassH - 4);
    // Tarts & pudding inside showcase
    for (let t = 0; t < 3; t++) {
      ctx.fillStyle = '#e67e22';
      ctx.fillRect(glassX + 6 + t * 9, glassY + 11, 7, 4);
      ctx.fillStyle = '#f1c40f';
      ctx.fillRect(glassX + 7 + t * 9, glassY + 9, 5, 3);
    }
    ctx.fillStyle = 'rgba(255,255,255,0.7)';
    ctx.fillRect(glassX + 42, glassY + 7, 7, 9);
    ctx.fillStyle = '#873600';
    ctx.fillRect(glassX + 43, glassY + 9, 5, 6);
    // Glass sheen
    ctx.strokeStyle = 'rgba(255,255,255,0.3)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(glassX + 4, glassY + glassH - 2);
    ctx.lineTo(glassX + 15, glassY + 2);
    ctx.stroke();

    // 7. Polished Carrara Marble Countertop
    ctx.fillStyle = '#eddcd2';
    ctx.beginPath();
    ctx.roundRect(cx - 5, cy + 17, 148, 6, 2);
    ctx.fill();
    ctx.fillStyle = '#d6c2b4';
    ctx.fillRect(cx - 5, cy + 21, 148, 2);
    ctx.fillStyle = 'rgba(255, 255, 255, 0.7)';
    ctx.fillRect(cx - 4, cy + 18, 146, 1);

    // 8. Front Awning Support Pillars
    ctx.fillStyle = '#c5c5d2';
    ctx.fillRect(cx + 4, cy - 35, 4, 53);
    ctx.fillRect(cx + 130, cy - 35, 4, 53);

    // 9. Fabric Striped Awning Roof
    const awningY = cy - 42;
    const sw = 16;
    const stripes = 9;
    for (let s = 0; s < stripes; s++) {
      ctx.fillStyle = (s % 2 === 0) ? theme.awning1 : theme.awning2;
      const sx = cx - 6 + s * sw;
      ctx.fillRect(sx, awningY, sw, 15);
      ctx.beginPath();
      ctx.arc(sx + sw / 2, awningY + 15, sw / 2, 0, Math.PI);
      ctx.fill();
    }
    ctx.fillStyle = 'rgba(0, 0, 0, 0.2)';
    ctx.fillRect(cx - 6, awningY + 15, sw * stripes, 3);

    // Cute animal resting on roof
    const catX = cx + 80, catY = awningY - 4;
    const catBreathe = Math.sin(this.tick * 0.08 + index) * 1;
    ctx.fillStyle = (index === 0) ? '#a4b0be' : (index === 1) ? '#ff7675' : '#74b9ff';
    ctx.beginPath();
    ctx.ellipse(catX, catY + catBreathe, 6, 3.5, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.arc(catX - 5, catY - 1 + catBreathe, 3, 0, Math.PI * 2);
    ctx.fill();

    // 10. Neon Sign Plaque with Partner's Custom Store Name
    const isOnline = !!(partner.is_online || partner.online);
    const plaqueX = cx + 15, plaqueY = cy + 27, plaqueW = 108, plaqueH = 17;
    ctx.fillStyle = '#1e0c18';
    ctx.beginPath();
    ctx.roundRect(plaqueX, plaqueY, plaqueW, plaqueH, 3.5);
    ctx.fill();

    const neonPulse = (Math.sin(this.tick * 0.1 + index * 1.5) + 1) * 0.15 + 0.85;
    ctx.strokeStyle = theme.neonBorder(neonPulse);
    ctx.lineWidth = 1.5;
    ctx.stroke();

    ctx.fillStyle = theme.neonRivet;
    ctx.fillRect(plaqueX + 2, plaqueY + 2, 2, 2);
    ctx.fillRect(plaqueX + plaqueW - 4, plaqueY + 2, 2, 2);
    ctx.fillRect(plaqueX + 2, plaqueY + plaqueH - 4, 2, 2);
    ctx.fillRect(plaqueX + plaqueW - 4, plaqueY + plaqueH - 4, 2, 2);

    const partnerTitle = '🧋 ' + (partner.partner_name || partner.store_name || `QUÁN #${index + 1}`).toUpperCase();
    ctx.save();
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    let fSize = 9.0;
    ctx.font = `bold ${fSize}px sans-serif`;
    while (ctx.measureText(partnerTitle).width > plaqueW - 14 && fSize > 6.0) {
      fSize -= 0.5;
      ctx.font = `bold ${fSize}px sans-serif`;
    }
    ctx.shadowColor = theme.neonGlow;
    ctx.shadowBlur = 4 * neonPulse;
    ctx.fillStyle = theme.neonText;
    ctx.fillText(partnerTitle, plaqueX + plaqueW / 2, plaqueY + plaqueH / 2 + 0.5);
    ctx.restore();

    // Online / Offline Status Pill Badge on stall roof
    const badgeX = cx + 4;
    const badgeY = awningY - 8;
    ctx.save();
    ctx.fillStyle = isOnline ? 'rgba(10, 35, 20, 0.92)' : 'rgba(30, 30, 35, 0.85)';
    ctx.beginPath();
    ctx.roundRect(badgeX, badgeY, 40, 9, 3);
    ctx.fill();
    ctx.strokeStyle = isOnline ? '#2ecc71' : '#7f8c8d';
    ctx.lineWidth = 1;
    ctx.stroke();

    // Dot indicator
    ctx.fillStyle = isOnline ? (this.tick % 30 < 15 ? '#2ecc71' : '#55efc4') : '#95a5a6';
    ctx.beginPath();
    ctx.arc(badgeX + 6, badgeY + 4.5, 2.2, 0, Math.PI * 2);
    ctx.fill();

    // Label
    ctx.fillStyle = isOnline ? '#a8ff78' : '#bdc3c7';
    ctx.font = 'bold 5.5px sans-serif';
    ctx.textAlign = 'left';
    ctx.textBaseline = 'middle';
    ctx.fillText(isOnline ? 'ONLINE' : 'OFFLINE', badgeX + 11, badgeY + 4.5);
    ctx.restore();

    // 11. Equipment on Counter
    // Tea Urn
    ctx.fillStyle = '#bdc3c7';
    ctx.beginPath();
    ctx.roundRect(cx + 8, cy + 2, 14, 16, 2);
    ctx.fill();
    ctx.fillStyle = '#7f8c8d';
    ctx.fillRect(cx + 9, cy + 1, 12, 3);
    ctx.fillStyle = '#e74c3c';
    ctx.fillRect(cx + 12, cy + 12, 4, 3); // tap

    // Sealer Machine with LED
    const sX = cx + 115;
    ctx.fillStyle = '#2c3e50';
    ctx.beginPath();
    ctx.roundRect(sX, cy + 3, 14, 15, 2);
    ctx.fill();
    ctx.fillStyle = '#2ecc71'; // Green status LED
    ctx.fillRect(sX + 3, cy + 6, 2, 2);

    // Drink cup
    ctx.fillStyle = 'rgba(255,255,255,0.7)';
    ctx.fillRect(cx + 28, cy + 8, 6, 9);
    ctx.fillStyle = theme.awning1;
    ctx.fillRect(cx + 29, cy + 10, 4, 6);

    // 12. Collab Badge Sign hanging on stall
    ctx.fillStyle = '#341f11';
    ctx.beginPath();
    ctx.roundRect(cx - 3, cy + 28, 16, 9, 2);
    ctx.fill();
    ctx.strokeStyle = '#f1c40f';
    ctx.lineWidth = 1;
    ctx.strokeRect(cx - 3, cy + 28, 16, 9);
    ctx.fillStyle = '#50fa7b';
    ctx.font = 'bold 5.5px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('+10%', cx + 5, cy + 34.5);
    ctx.textAlign = 'left';

    // 13. Customer enjoying drink beside partner stall (only shown when offline to keep stall lively without AI queue)
    if (!isOnline) {
      const kx = cx + 148, ky = cy + 18;
      ctx.fillStyle = '#2d3436';
      ctx.fillRect(kx + 2, ky + 14, 3, 10);
      ctx.fillRect(kx + 7, ky + 14, 3, 10);
      ctx.fillStyle = (index % 2 === 0) ? '#e17055' : '#0984e3';
      ctx.fillRect(kx, ky + 4, 12, 11);
      ctx.fillStyle = '#ffeaa7';
      ctx.fillRect(kx + 2, ky - 6, 8, 9);
      ctx.fillStyle = '#2d3436';
      ctx.fillRect(kx + 1, ky - 7, 10, 4);
      // Boba cup in hand
      ctx.fillStyle = 'rgba(255,255,255,0.85)';
      ctx.fillRect(kx - 3, ky + 6, 4, 6);
      ctx.fillStyle = '#873600';
      ctx.fillRect(kx - 2, ky + 7, 2, 4);

      // Periodic floating heart
      if ((this.tick + index * 40) % 120 < 40) {
        const heartY = ky - 8 - ((this.tick % 40) * 0.25);
        ctx.fillStyle = '#ff4757';
        ctx.font = '8px sans-serif';
        ctx.fillText('❤️', kx + 1, heartY);
      }
    }
  },

  drawCollabPlaceholder(ctx, cx, cy, index) {
    if (index === 0) {
      // Slot 1 (cx = 205): Bồn hoa cẩm tú cầu vỉa hè & Ghế đá sinh viên
      const gx = cx + 20, gy = cy + 32;
      ctx.fillStyle = 'rgba(10, 5, 12, 0.4)';
      ctx.fillRect(gx - 4, gy + 18, 56, 4);
      ctx.fillStyle = '#b2bec3';
      ctx.fillRect(gx, gy + 8, 48, 6);
      ctx.fillStyle = '#dfe6e9';
      ctx.fillRect(gx, gy + 7, 48, 2);
      ctx.fillStyle = '#636e72';
      ctx.fillRect(gx + 6, gy + 14, 6, 6);
      ctx.fillRect(gx + 36, gy + 14, 6, 6);
      ctx.fillRect(gx, gy - 6, 48, 5);
      ctx.fillRect(gx + 6, gy - 1, 4, 9);
      ctx.fillRect(gx + 38, gy - 1, 4, 9);

      // Student backpack on park bench
      ctx.fillStyle = '#0984e3';
      ctx.fillRect(gx + 26, gy + 3, 10, 6);
      ctx.fillStyle = '#e74c3c';
      ctx.fillRect(gx + 28, gy + 5, 6, 2);

      // Terrazzo Planter with hydrangea flowers
      const bx = cx + 80, by = cy + 30;
      ctx.fillStyle = '#2d3436';
      ctx.beginPath();
      ctx.roundRect(bx, by + 6, 44, 14, 3);
      ctx.fill();
      ctx.fillStyle = '#636e72';
      ctx.fillRect(bx + 2, by + 8, 40, 3);
      ctx.fillStyle = '#27ae60';
      ctx.beginPath();
      ctx.arc(bx + 12, by + 4, 10, 0, Math.PI * 2);
      ctx.arc(bx + 24, by + 2, 12, 0, Math.PI * 2);
      ctx.arc(bx + 34, by + 5, 9, 0, Math.PI * 2);
      ctx.fill();
      const hydras = [
        { x: bx + 10, y: by + 2, c: '#e056fd' },
        { x: bx + 22, y: by - 1, c: '#ff7675' },
        { x: bx + 32, y: by + 3, c: '#686de0' }
      ];
      hydras.forEach(h => {
        ctx.fillStyle = h.c;
        ctx.beginPath();
        ctx.arc(h.x, h.y, 4, 0, Math.PI * 2);
        ctx.fill();
      });
    } else if (index === 1) {
      // Slot 2 (cx = 375): Bồn hoa hướng dương & Biển chỉ dẫn "Chờ Liên Minh"
      const bx = cx + 25, by = cy + 28;
      ctx.fillStyle = '#57606f';
      ctx.beginPath();
      ctx.roundRect(bx, by + 8, 55, 14, 3);
      ctx.fill();
      ctx.fillStyle = '#2ed573';
      ctx.beginPath();
      ctx.arc(bx + 16, by + 6, 11, 0, Math.PI * 2);
      ctx.arc(bx + 38, by + 5, 12, 0, Math.PI * 2);
      ctx.fill();
      for (let fi = 0; fi < 3; fi++) {
        const fx = bx + 14 + fi * 14, fy = by + 3 + (fi % 2) * 2;
        ctx.fillStyle = '#ffa502';
        ctx.beginPath();
        ctx.arc(fx, fy, 4, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = '#592c08';
        ctx.beginPath();
        ctx.arc(fx, fy, 2, 0, Math.PI * 2);
        ctx.fill();
      }

      // Wooden Signboard "🤝 Chờ Collab +10%"
      const sx = cx + 90, sy = cy + 22;
      ctx.fillStyle = '#5d4037';
      ctx.fillRect(sx + 18, sy + 14, 3, 14);
      ctx.fillStyle = '#8d6e63';
      ctx.beginPath();
      ctx.roundRect(sx, sy, 40, 15, 2);
      ctx.fill();
      ctx.strokeStyle = '#fbc531';
      ctx.lineWidth = 1;
      ctx.strokeRect(sx, sy, 40, 15);
      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 6.5px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('🤝 COLLAB', sx + 20, sy + 6.5);
      ctx.fillStyle = '#50fa7b';
      ctx.fillText('+10% DT', sx + 20, sy + 12.5);
      ctx.textAlign = 'left';
    } else {
      // Slot 3 (cx = 545): Cây bàng chậu đá mài & thùng thư retro
      const tx = cx + 35, ty = cy + 18;
      ctx.fillStyle = '#747d8c';
      ctx.beginPath();
      ctx.roundRect(tx + 4, ty + 20, 26, 14, 2);
      ctx.fill();
      ctx.fillStyle = '#4b382a';
      ctx.fillRect(tx + 15, ty + 6, 4, 15);
      ctx.fillStyle = '#1e824c';
      ctx.beginPath();
      ctx.arc(tx + 17, ty + 3, 15, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#26a65b';
      ctx.beginPath();
      ctx.arc(tx + 14, ty - 2, 10, 0, Math.PI * 2);
      ctx.fill();

      // Retro Red Mailbox
      const mx = cx + 80, my = cy + 24;
      ctx.fillStyle = '#2f3542';
      ctx.fillRect(mx + 6, my + 14, 3, 12);
      ctx.fillStyle = '#e74c3c';
      ctx.beginPath();
      ctx.roundRect(mx, my, 15, 14, 3);
      ctx.fill();
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(mx + 3, my + 4, 9, 2);
    }
  },

  drawCollabCustomers(ctx) {
    if (!this.collabCustomerStates) return;
    const slots = [
      { x: 205, y: 92 },
      { x: 375, y: 92 },
      { x: 545, y: 92 }
    ];

    for (let i = 0; i < 3; i++) {
      const partner = (this.activeCollabs && this.activeCollabs[i]) ? this.activeCollabs[i] : null;
      const isOnline = !!(partner && (partner.is_online || partner.online));
      if (!partner || !isOnline) continue;

      const cState = this.collabCustomerStates[i];
      if (!cState || cState.state === 'idle') continue;

      const custX = Math.round(cState.x);
      const custY = 108; // ground level

      // Draw the pixel art customer sprite
      this.drawCustomer(ctx, custX, custY, cState.type, false, '', '');

      // If customer received their drink, render cup in hand + floating heart
      if (cState.hasDrink) {
        ctx.fillStyle = 'rgba(255,255,255,0.9)';
        ctx.fillRect(custX + 10, custY - 8, 4, 6);
        ctx.fillStyle = '#b71540';
        ctx.fillRect(custX + 11, custY - 7, 2, 4);

        const heartBob = Math.sin((this.tick + i * 30) * 0.2) * 2;
        ctx.fillStyle = '#ff4757';
        ctx.font = '8px sans-serif';
        ctx.fillText('❤️', custX + 3, custY - 26 + heartBob);
      }

      // If ordering, render customer comic dialogue bubble
      if (cState.state === 'ordering' && cState.quote) {
        ctx.save();
        const bubbleBob = Math.sin((this.tick + i * 20) * 0.15) * 1.5;
        const bText = cState.quote;
        ctx.font = 'bold 7px sans-serif';
        const tw = ctx.measureText(bText).width;
        const bw = tw + 10;
        const bh = 14;
        const bx = Math.min(this.width - bw - 2, Math.max(2, custX + 5 - bw / 2));
        const by = 86 + bubbleBob;

        // Shadow & Bubble body
        ctx.fillStyle = 'rgba(0, 0, 0, 0.45)';
        ctx.fillRect(bx + 1, by + 1, bw, bh);
        ctx.fillStyle = 'rgba(20, 16, 28, 0.95)';
        ctx.fillRect(bx, by, bw, bh);
        ctx.strokeStyle = '#55efc4';
        ctx.lineWidth = 1;
        ctx.strokeRect(bx, by, bw, bh);

        // Downward tail
        ctx.fillStyle = 'rgba(20, 16, 28, 0.95)';
        ctx.beginPath();
        ctx.moveTo(custX + 5, by + bh);
        ctx.lineTo(custX + 8, by + bh);
        ctx.lineTo(custX + 6, by + bh + 3);
        ctx.fill();

        // Text inside bubble
        ctx.fillStyle = '#ffffff';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(bText, bx + bw / 2, by + bh / 2);
        ctx.restore();
      }
    }
  }
};

