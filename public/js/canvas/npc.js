// Modular NPC Generator & Customer Rendering for GameCanvas

export const npcMethods = {
  getArchetypeByName(name) {
    if (typeof getCharacter === 'function') {
      const char = getCharacter(name);
      return char ? char.id : 2;
    }
    if (!name) return 0;
    if (name.includes('Lan') || name.includes('sinh')) return 0;
    if (name.includes('Nam') || name.includes('phòng')) return 1;
    if (name.includes('Ba') || name.includes('xóm')) return 2;
    if (name.includes('Tú') || name.includes('Review')) return 3;
    if (name.includes('Ship')) return 4;
    if (name.includes('Cụ') || name.includes('Trưởng Phố') || name.includes('Đồ')) return 5;
    if (name.includes('Gymer') || name.includes('Quân')) return 6;
    if (name.includes('Đôi') || name.includes('Gà Bông') || name.includes('Duy')) return 7;
    if (name.includes('David') || name.includes('Tây')) return 8;
    if (name.includes('Vé Số') || name.includes('Hạnh')) return 9;
    return Math.floor(Math.random() * 10);
  },

  drawNPCHair(ctx, baseX, headTop, hairId, hairColor, sway = 0, subColor = '#f472b6') {
    const pR = (x, y, w, h, col) => {
      if (!col) return;
      ctx.fillStyle = col;
      ctx.fillRect(Math.round(x), Math.round(y), Math.max(1, Math.round(w)), Math.max(1, Math.round(h)));
    };
    const pD = (x, y, col) => {
      if (!col) return;
      ctx.fillStyle = col;
      ctx.fillRect(Math.round(x), Math.round(y), 1, 1);
    };

    switch (hairId) {
      // ===== FEMALE HAIRSTYLES =====
      case 'twin_tails':
        // Top dome & bangs
        pR(baseX + 4, headTop + 1, 14, 5, hairColor);
        pR(baseX + 6, headTop + 0, 10, 2, hairColor);
        pR(baseX + 5, headTop + 4, 12, 2, hairColor);
        // Left bun/tail + sway
        pR(baseX + 1 - sway, headTop + 1, 4, 11, hairColor);
        pR(baseX + 2 - sway, headTop + 12, 3, 3, hairColor);
        // Right bun/tail + sway
        pR(baseX + 17 + sway, headTop + 1, 4, 11, hairColor);
        pR(baseX + 17 + sway, headTop + 12, 3, 3, hairColor);
        // Ribbon bows
        pR(baseX + 3, headTop + 2, 2, 2, subColor);
        pR(baseX + 17, headTop + 2, 2, 2, subColor);
        pD(baseX + 8, headTop + 1, '#ffffff66');
        break;

      case 'ponytail':
        pR(baseX + 4, headTop + 0, 14, 6, hairColor);
        pR(baseX + 6, headTop - 1, 9, 2, hairColor);
        pR(baseX + 4, headTop + 4, 2, 4, hairColor);
        // Ponytail swooping right
        pR(baseX + 16, headTop - 2, 5, 5, hairColor);
        pR(baseX + 19 + sway, headTop + 2, 4, 9, hairColor);
        pR(baseX + 18 + sway, headTop + 11, 3, 4, hairColor);
        // Scrunchie
        pR(baseX + 16, headTop - 1, 2, 3, subColor);
        pD(baseX + 9, headTop + 0, '#ffffff66');
        break;

      case 'long_straight':
        pR(baseX + 4, headTop + 0, 14, 5, hairColor);
        pR(baseX + 6, headTop - 1, 10, 2, hairColor);
        pR(baseX + 5, headTop + 3, 12, 2, hairColor);
        // Left & right locks
        pR(baseX + 3, headTop + 3, 3, 18, hairColor);
        pR(baseX + 4, headTop + 21, 2, 3, hairColor);
        pR(baseX + 16, headTop + 3, 3, 18, hairColor);
        pR(baseX + 16, headTop + 21, 2, 3, hairColor);
        pR(baseX + 2, headTop + 7, 18, 14, hairColor + 'cc');
        pD(baseX + 8, headTop + 0, '#ffffff77');
        break;

      case 'short_bob':
        pR(baseX + 4, headTop + 0, 14, 5, hairColor);
        pR(baseX + 6, headTop - 1, 10, 2, hairColor);
        pR(baseX + 3, headTop + 3, 3, 7, hairColor);
        pR(baseX + 16, headTop + 3, 3, 7, hairColor);
        pR(baseX + 5, headTop + 3, 12, 2, hairColor);
        // X hair clip
        pD(baseX + 5, headTop + 3, subColor);
        pD(baseX + 6, headTop + 4, subColor);
        pD(baseX + 7, headTop + 3, subColor);
        pD(baseX + 6, headTop + 2, subColor);
        pD(baseX + 10, headTop + 0, '#ffffff66');
        break;

      case 'braided':
        pR(baseX + 4, headTop + 1, 14, 5, hairColor);
        pR(baseX + 6, headTop + 0, 9, 2, hairColor);
        pR(baseX + 16, headTop + 4, 4, 3, hairColor);
        pR(baseX + 15, headTop + 7, 4, 3, hairColor);
        pR(baseX + 16, headTop + 10, 3, 3, hairColor);
        pR(baseX + 15, headTop + 13, 3, 3, hairColor);
        pR(baseX + 15, headTop + 16, 2, 2, subColor);
        pD(baseX + 8, headTop + 1, '#ffffff66');
        break;

      case 'curly_wavy':
        pR(baseX + 3, headTop - 1, 16, 6, hairColor);
        pR(baseX + 2, headTop + 4, 4, 12, hairColor);
        pD(baseX + 1, headTop + 8, hairColor);
        pD(baseX + 1, headTop + 13, hairColor);
        pR(baseX + 16, headTop + 4, 4, 12, hairColor);
        pD(baseX + 20, headTop + 9, hairColor);
        pD(baseX + 20, headTop + 14, hairColor);
        pD(baseX + 7, headTop + 0, '#ffffff66');
        break;

      case 'high_bun':
        pR(baseX + 8, headTop - 5, 6, 6, hairColor);
        pR(baseX + 9, headTop - 6, 4, 2, hairColor);
        pR(baseX + 13, headTop - 4, 3, 2, subColor);
        pD(baseX + 15, headTop - 5, '#fde047');
        pR(baseX + 4, headTop + 1, 14, 5, hairColor);
        pR(baseX + 4, headTop + 5, 1, 4, hairColor);
        pR(baseX + 17, headTop + 5, 1, 4, hairColor);
        break;

      case 'hime_cut':
        pR(baseX + 4, headTop + 0, 14, 5, hairColor);
        pR(baseX + 5, headTop + 3, 12, 3, hairColor);
        pR(baseX + 3, headTop + 3, 3, 9, hairColor);
        pR(baseX + 16, headTop + 3, 3, 9, hairColor);
        pR(baseX + 2, headTop + 7, 18, 16, hairColor + 'dd');
        pD(baseX + 9, headTop + 0, '#ffffff66');
        break;

      // ===== MALE HAIRSTYLES =====
      case 'undercut':
        pR(baseX + 4, headTop + 3, 2, 4, '#1e293b');
        pR(baseX + 16, headTop + 3, 2, 4, '#1e293b');
        pR(baseX + 5, headTop - 2, 12, 6, hairColor);
        pR(baseX + 6, headTop - 4, 10, 3, hairColor);
        pD(baseX + 8, headTop - 3, '#ffffff66');
        break;

      case 'korean_curtain':
        pR(baseX + 4, headTop + 0, 14, 4, hairColor);
        pR(baseX + 6, headTop - 2, 10, 3, hairColor);
        pR(baseX + 4, headTop + 3, 4, 3, hairColor);
        pR(baseX + 3, headTop + 5, 2, 3, hairColor);
        pR(baseX + 14, headTop + 3, 4, 3, hairColor);
        pR(baseX + 17, headTop + 5, 2, 3, hairColor);
        pD(baseX + 7, headTop - 1, '#ffffff66');
        break;

      case 'short_crew':
        pR(baseX + 5, headTop + 0, 12, 5, hairColor);
        pR(baseX + 6, headTop - 1, 10, 2, hairColor);
        pR(baseX + 4, headTop + 3, 2, 3, hairColor);
        pR(baseX + 16, headTop + 3, 2, 3, hairColor);
        pD(baseX + 9, headTop + 0, '#ffffff55');
        break;

      case 'messy_spiky':
        pR(baseX + 5, headTop + 0, 12, 5, hairColor);
        pD(baseX + 6, headTop - 2, hairColor);
        pD(baseX + 9, headTop - 3, hairColor);
        pD(baseX + 13, headTop - 2, hairColor);
        pD(baseX + 16, headTop - 1, hairColor);
        pR(baseX + 4, headTop + 3, 2, 4, hairColor);
        pR(baseX + 16, headTop + 3, 2, 4, hairColor);
        pD(baseX + 10, headTop - 2, '#ffffff66');
        break;

      case 'side_part':
        pR(baseX + 5, headTop + 0, 12, 5, hairColor);
        pR(baseX + 6, headTop - 1, 10, 2, hairColor);
        pR(baseX + 8, headTop + 0, 8, 3, hairColor);
        pD(baseX + 7, headTop + 1, '#1e293b44');
        pR(baseX + 4, headTop + 3, 2, 4, hairColor);
        pR(baseX + 16, headTop + 3, 2, 4, hairColor);
        break;

      case 'curly_perm':
        pR(baseX + 4, headTop - 1, 14, 6, hairColor);
        pD(baseX + 5, headTop - 2, hairColor);
        pD(baseX + 8, headTop - 3, hairColor);
        pD(baseX + 12, headTop - 3, hairColor);
        pD(baseX + 15, headTop - 2, hairColor);
        pD(baseX + 6, headTop + 4, hairColor);
        pD(baseX + 9, headTop + 4, hairColor);
        pD(baseX + 12, headTop + 4, hairColor);
        pD(baseX + 10, headTop - 1, '#ffffff66');
        break;

      case 'buzz_cut':
        pR(baseX + 5, headTop + 2, 12, 3, hairColor);
        pR(baseX + 6, headTop + 1, 10, 2, hairColor);
        break;

      // ===== UNISEX / HATS =====
      case 'cap_backward':
        pR(baseX + 4, headTop - 1, 14, 5, subColor);
        pR(baseX + 15, headTop + 2, 5, 2, subColor);
        pD(baseX + 10, headTop + 0, '#fde047');
        pR(baseX + 5, headTop + 4, 12, 1, hairColor);
        break;

      case 'beanie':
        pR(baseX + 4, headTop - 3, 14, 7, subColor);
        pR(baseX + 3, headTop + 2, 16, 2, subColor);
        pR(baseX + 6, headTop + 4, 7, 2, hairColor);
        break;

      case 'bucket_hat':
        pR(baseX + 5, headTop - 2, 12, 5, subColor);
        pR(baseX + 2, headTop + 3, 18, 2, subColor);
        pR(baseX + 4, headTop + 5, 2, 3, hairColor);
        pR(baseX + 16, headTop + 5, 2, 3, hairColor);
        break;

      case 'afro':
        pR(baseX + 2, headTop - 3, 18, 9, hairColor);
        pR(baseX + 3, headTop - 4, 16, 2, hairColor);
        pD(baseX + 9, headTop - 2, '#ffffff66');
        break;

      case 'middle_part':
      default:
        pR(baseX + 4, headTop + 0, 14, 5, hairColor);
        pR(baseX + 6, headTop - 1, 10, 2, hairColor);
        pR(baseX + 3, headTop + 3, 3, 5, hairColor);
        pR(baseX + 16, headTop + 3, 3, 5, hairColor);
        pD(baseX + 8, headTop + 0, '#ffffff66');
        break;
    }
  },

  drawNPCOutfit(ctx, baseX, torsoTop, pantsTop, shoeTop, torsoH, legLength, outfitId, palette, gender = 'female', sway = 0) {
    const pR = (x, y, w, h, col) => {
      if (!col) return;
      ctx.fillStyle = col;
      ctx.fillRect(Math.round(x), Math.round(y), Math.max(1, Math.round(w)), Math.max(1, Math.round(h)));
    };
    const pD = (x, y, col) => {
      if (!col) return;
      ctx.fillStyle = col;
      ctx.fillRect(Math.round(x), Math.round(y), 1, 1);
    };

    const clothes = palette.clothes || '#ffffff';
    const sub = palette.sub || '#fb7185';
    const pants = palette.pants || '#1e293b';
    const skin = palette.skin || '#ffe0bd';

    switch (outfitId) {
      // ===== FEMALE OUTFITS =====
      case 'ao_dai':
        pR(baseX + 9, torsoTop - 1, 4, 2, sub);
        pR(baseX + 5, torsoTop + 1, 12, torsoH, clothes);
        pR(baseX + 9, torsoTop + 1, 4, torsoH, clothes);
        pR(baseX + 5, pantsTop, 12, legLength - 2, clothes);
        pR(baseX + 7, pantsTop + 3, 3, legLength - 3, pants);
        pR(baseX + 12, pantsTop + 3, 3, legLength - 3, pants);
        pR(baseX + 6, shoeTop, 4, 2, sub);
        pR(baseX + 12, shoeTop, 4, 2, sub);
        break;

      case 'dress_cute':
        pR(baseX + 5, torsoTop + 1, 12, 6, clothes);
        pR(baseX + 9, torsoTop + 2, 4, 2, sub);
        pR(baseX + 3, torsoTop + 7, 16, 7, clothes);
        pR(baseX + 2, torsoTop + 13, 18, 2, sub);
        pR(baseX + 7, pantsTop + 2, 3, legLength - 2, skin);
        pR(baseX + 12, pantsTop + 2, 3, legLength - 2, skin);
        pR(baseX + 6, shoeTop, 4, 2, '#2d3436');
        pR(baseX + 12, shoeTop, 4, 2, '#2d3436');
        break;

      case 'crop_top_jeans':
        pR(baseX + 5, torsoTop + 1, 12, 7, clothes);
        pR(baseX + 8, torsoTop + 3, 6, 3, sub);
        pR(baseX + 6, torsoTop + 8, 10, 3, skin);
        pR(baseX + 5, torsoTop + 11, 12, 4, pants);
        pR(baseX + 9, torsoTop + 11, 4, 1, '#2d3436');
        pR(baseX + 6, pantsTop, 4, legLength, pants);
        pR(baseX + 12, pantsTop, 4, legLength, pants);
        pR(baseX + 5, shoeTop, 5, 2, '#ffffff');
        pR(baseX + 12, shoeTop, 5, 2, '#ffffff');
        break;

      case 'hoodie_skirt':
        pR(baseX + 4, torsoTop + 1, 14, 10, clothes);
        pR(baseX + 6, torsoTop + 6, 10, 4, clothes);
        pD(baseX + 8, torsoTop + 2, sub);
        pD(baseX + 13, torsoTop + 2, sub);
        pR(baseX + 4, torsoTop + 11, 14, 5, sub);
        pR(baseX + 4, torsoTop + 15, 14, 1, '#ffffff88');
        pR(baseX + 6, pantsTop + 3, 3, legLength - 3, '#ffffff');
        pR(baseX + 13, pantsTop + 3, 3, legLength - 3, '#ffffff');
        pR(baseX + 5, shoeTop, 5, 2, clothes);
        pR(baseX + 12, shoeTop, 5, 2, clothes);
        break;

      case 'office_blouse':
        pR(baseX + 5, torsoTop + 1, 12, 8, clothes);
        pR(baseX + 9, torsoTop + 2, 4, 4, sub);
        pR(baseX + 6, torsoTop + 9, 10, 8, pants);
        pR(baseX + 7, pantsTop + 3, 3, legLength - 3, skin);
        pR(baseX + 12, pantsTop + 3, 3, legLength - 3, skin);
        pR(baseX + 6, shoeTop, 4, 2, pants);
        pR(baseX + 12, shoeTop, 4, 2, pants);
        break;

      case 'student_girl':
        pR(baseX + 5, torsoTop + 1, 12, 8, '#ffffff');
        pR(baseX + 9, torsoTop + 2, 4, 5, '#dc2626');
        pR(baseX + 4, torsoTop + 9, 14, 7, '#1e3799');
        pR(baseX + 6, pantsTop + 3, 3, legLength - 3, '#ffffff');
        pR(baseX + 13, pantsTop + 3, 3, legLength - 3, '#ffffff');
        pR(baseX + 5, shoeTop, 5, 2, '#1e293b');
        pR(baseX + 12, shoeTop, 5, 2, '#1e293b');
        break;

      case 'sweater_skirt':
        pR(baseX + 8, torsoTop - 1, 6, 3, clothes);
        pR(baseX + 4, torsoTop + 2, 14, 11, clothes);
        pR(baseX + 4, torsoTop + 13, 14, 6, pants);
        pR(baseX + 7, pantsTop + 4, 3, legLength - 4, skin);
        pR(baseX + 12, pantsTop + 4, 3, legLength - 4, skin);
        pR(baseX + 6, shoeTop, 4, 2, '#78350f');
        pR(baseX + 12, shoeTop, 4, 2, '#78350f');
        break;

      case 'party_dress':
        pR(baseX + 5, torsoTop + 2, 12, 14, clothes);
        pD(baseX + 7, torsoTop + 5, '#ffffffaa');
        pD(baseX + 12, torsoTop + 8, '#ffffffaa');
        pR(baseX + 4, torsoTop + 13, 14, 4, clothes);
        pR(baseX + 7, pantsTop + 2, 3, legLength - 2, skin);
        pR(baseX + 12, pantsTop + 2, 3, legLength - 2, skin);
        pR(baseX + 6, shoeTop, 4, 2, sub);
        pR(baseX + 12, shoeTop, 4, 2, sub);
        break;

      // ===== MALE OUTFITS =====
      case 'student_boy':
        pR(baseX + 5, torsoTop + 1, 12, torsoH - 2, '#ffffff');
        pD(baseX + 7, torsoTop + 4, '#dc2626');
        pR(baseX + 10, torsoTop + 2, 2, 5, sub);
        pR(baseX + 5, pantsTop - 2, 12, 3, pants);
        pR(baseX + 6, pantsTop + 1, 4, legLength - 1, pants);
        pR(baseX + 12, pantsTop + 1, 4, legLength - 1, pants);
        pR(baseX + 5, shoeTop, 5, 2, '#1e293b');
        pR(baseX + 12, shoeTop, 5, 2, '#1e293b');
        break;

      case 'tshirt_cargo':
        pR(baseX + 4, torsoTop + 1, 14, torsoH - 1, clothes);
        pR(baseX + 8, torsoTop + 4, 6, 3, sub);
        pR(baseX + 5, pantsTop, 5, legLength, pants);
        pR(baseX + 12, pantsTop, 5, legLength, pants);
        pR(baseX + 4, pantsTop + 5, 2, 4, '#334155');
        pR(baseX + 16, pantsTop + 5, 2, 4, '#334155');
        pR(baseX + 5, shoeTop, 5, 2, '#ffffff');
        pR(baseX + 12, shoeTop, 5, 2, '#ffffff');
        break;

      case 'hoodie_jogger':
        pR(baseX + 4, torsoTop + 1, 14, torsoH, clothes);
        pR(baseX + 6, torsoTop + 7, 10, 4, sub);
        pR(baseX + 6, pantsTop + 1, 4, legLength - 1, pants);
        pR(baseX + 12, pantsTop + 1, 4, legLength - 1, pants);
        pR(baseX + 5, shoeTop, 5, 2, '#ffffff');
        pR(baseX + 12, shoeTop, 5, 2, '#ffffff');
        break;

      case 'suit_formal':
        pR(baseX + 4, torsoTop + 1, 14, torsoH, clothes);
        pR(baseX + 9, torsoTop + 1, 4, 5, '#ffffff');
        pR(baseX + 10, torsoTop + 2, 2, 6, sub);
        pR(baseX + 6, pantsTop + 1, 4, legLength - 1, pants);
        pR(baseX + 12, pantsTop + 1, 4, legLength - 1, pants);
        pR(baseX + 5, shoeTop, 5, 2, '#09090b');
        pR(baseX + 12, shoeTop, 5, 2, '#09090b');
        break;

      case 'polo_khaki':
        pR(baseX + 5, torsoTop + 1, 12, torsoH - 1, clothes);
        pR(baseX + 8, torsoTop + 1, 6, 2, sub);
        pD(baseX + 10, torsoTop + 4, '#2d3436');
        pR(baseX + 6, pantsTop, 4, legLength, pants);
        pR(baseX + 12, pantsTop, 4, legLength, pants);
        pR(baseX + 5, shoeTop, 5, 2, '#78350f');
        pR(baseX + 12, shoeTop, 5, 2, '#78350f');
        break;

      case 'gym_tank':
        pR(baseX + 7, torsoTop + 1, 8, torsoH - 3, clothes);
        pR(baseX + 4, torsoTop + 2, 3, 8, skin);
        pR(baseX + 15, torsoTop + 2, 3, 8, skin);
        pR(baseX + 5, pantsTop - 2, 12, 6, pants);
        pR(baseX + 7, pantsTop + 4, 3, legLength - 4, skin);
        pR(baseX + 12, pantsTop + 4, 3, legLength - 4, skin);
        pR(baseX + 6, shoeTop, 5, 2, '#ffffff');
        pR(baseX + 12, shoeTop, 5, 2, '#ffffff');
        break;

      case 'denim_jacket':
        pR(baseX + 4, torsoTop + 1, 14, torsoH, '#2980b9');
        pR(baseX + 8, torsoTop + 2, 6, torsoH - 2, '#ffffff');
        pR(baseX + 6, pantsTop, 4, legLength, pants);
        pR(baseX + 12, pantsTop, 4, legLength, pants);
        pD(baseX + 8, pantsTop + 6, '#ffffff');
        pR(baseX + 5, shoeTop, 5, 2, '#1e293b');
        pR(baseX + 12, shoeTop, 5, 2, '#1e293b');
        break;

      case 'hawaii_shirt':
        pR(baseX + 4, torsoTop + 1, 14, torsoH, clothes);
        pD(baseX + 6, torsoTop + 4, sub);
        pD(baseX + 11, torsoTop + 5, sub);
        pD(baseX + 14, torsoTop + 8, sub);
        pR(baseX + 6, pantsTop, 4, 7, pants);
        pR(baseX + 12, pantsTop, 4, 7, pants);
        pR(baseX + 7, pantsTop + 7, 3, legLength - 7, skin);
        pR(baseX + 12, pantsTop + 7, 3, legLength - 7, skin);
        pR(baseX + 6, shoeTop, 4, 2, '#78350f');
        pR(baseX + 12, shoeTop, 4, 2, '#78350f');
        break;

      // ===== UNISEX OUTFITS =====
      case 'barista_apron':
        pR(baseX + 4, torsoTop + 1, 14, torsoH, clothes);
        pR(baseX + 6, torsoTop + 2, 10, torsoH - 1, sub);
        pR(baseX + 7, torsoTop + 7, 8, 4, '#2d343633');
        pR(baseX + 6, pantsTop + 1, 4, legLength - 1, pants);
        pR(baseX + 12, pantsTop + 1, 4, legLength - 1, pants);
        pR(baseX + 5, shoeTop, 5, 2, '#1e293b');
        pR(baseX + 12, shoeTop, 5, 2, '#1e293b');
        break;

      case 'shipper_jacket':
        pR(baseX + 4, torsoTop + 1, 14, torsoH, clothes);
        pR(baseX + 4, torsoTop + 6, 14, 2, '#50fa7b');
        pD(baseX + 7, torsoTop + 4, '#ffffff');
        pR(baseX + 6, pantsTop + 1, 4, legLength - 1, pants);
        pR(baseX + 12, pantsTop + 1, 4, legLength - 1, pants);
        pR(baseX + 5, shoeTop, 5, 2, '#1e293b');
        pR(baseX + 12, shoeTop, 5, 2, '#1e293b');
        break;

      case 'doctor_coat':
        pR(baseX + 4, torsoTop + 1, 14, torsoH + 3, '#f8fafc');
        pR(baseX + 8, torsoTop + 2, 6, torsoH, clothes);
        pR(baseX + 7, torsoTop + 1, 8, 4, '#334155');
        pR(baseX + 6, pantsTop + 4, 4, legLength - 4, pants);
        pR(baseX + 12, pantsTop + 4, 4, legLength - 4, pants);
        pR(baseX + 5, shoeTop, 5, 2, '#ffffff');
        pR(baseX + 12, shoeTop, 5, 2, '#ffffff');
        break;

      case 'police_uniform':
        pR(baseX + 4, torsoTop + 1, 14, torsoH, clothes);
        pR(baseX + 4, torsoTop + 1, 3, 2, '#dc2626');
        pR(baseX + 15, torsoTop + 1, 3, 2, '#dc2626');
        pR(baseX + 4, torsoTop + 11, 14, 2, '#1e293b');
        pD(baseX + 10, torsoTop + 11, '#fde047');
        pR(baseX + 6, pantsTop + 1, 4, legLength - 1, pants);
        pR(baseX + 12, pantsTop + 1, 4, legLength - 1, pants);
        pR(baseX + 5, shoeTop, 5, 2, '#0f172a');
        pR(baseX + 12, shoeTop, 5, 2, '#0f172a');
        break;

      case 'sport_tracksuit':
        pR(baseX + 4, torsoTop + 1, 14, torsoH, clothes);
        pR(baseX + 4, torsoTop + 2, 1, torsoH - 2, sub);
        pR(baseX + 17, torsoTop + 2, 1, torsoH - 2, sub);
        pR(baseX + 6, pantsTop + 1, 4, legLength - 1, pants);
        pR(baseX + 12, pantsTop + 1, 4, legLength - 1, pants);
        pR(baseX + 6, pantsTop + 2, 1, legLength - 2, sub);
        pR(baseX + 15, pantsTop + 2, 1, legLength - 2, sub);
        pR(baseX + 5, shoeTop, 5, 2, '#ffffff');
        pR(baseX + 12, shoeTop, 5, 2, '#ffffff');
        break;

      case 'winter_puffer':
      default:
        pR(baseX + 3, torsoTop + 1, 16, torsoH + 1, clothes);
        pR(baseX + 3, torsoTop + 5, 16, 1, '#00000022');
        pR(baseX + 3, torsoTop + 9, 16, 1, '#00000022');
        pR(baseX + 6, pantsTop + 2, 4, legLength - 2, pants);
        pR(baseX + 12, pantsTop + 2, 4, legLength - 2, pants);
        pR(baseX + 5, shoeTop, 5, 2, '#1e293b');
        pR(baseX + 12, shoeTop, 5, 2, '#1e293b');
        break;
    }
  },

  drawModularNPC(ctx, npc, baseX, baseY, sway = 0, isFront = false, isHappy = false, isBlinking = false) {
    const pR = (x, y, w, h, col) => {
      if (!col) return;
      ctx.fillStyle = col;
      ctx.fillRect(Math.round(x), Math.round(y), Math.max(1, Math.round(w)), Math.max(1, Math.round(h)));
    };

    const palette = npc.palette || {};
    const skin = palette.skin || '#ffe0bd';
    const skinShadow = palette.skinShadow || '#e8a882';
    const blush = palette.blush || '#ff7675';
    const hair = palette.hair || '#3e2723';
    const sub = palette.sub || '#fb7185';
    const gender = npc.gender || 'female';

    const headTop = baseY + 2;
    const faceTop = headTop + 4;
    const torsoTop = faceTop + 10;
    const torsoH = 15;
    const pantsTop = torsoTop + torsoH;
    const legLength = 17;
    const shoeTop = pantsTop + legLength;

    // 1. Back hair / Silhouette
    this.drawNPCHair(ctx, baseX, headTop, npc.hairStyle, hair, sway, sub);

    // 2. Organic Head, Facial Features & Blush
    this.drawOrganicHead(ctx, baseX + 11, faceTop + 3, 6, 6, skin, blush, isBlinking, '#1e293b', isHappy, hair);

    // 3. Front hair & Bangs layer
    this.drawNPCHair(ctx, baseX, headTop, npc.hairStyle, hair, sway, sub);

    // 4. Neck Column
    this.drawNeck(ctx, baseX + 11, torsoTop - 2, 4, 3, skin, skinShadow);

    // 5. Outfit (Torso, Pants/Skirt, Shoes)
    this.drawNPCOutfit(ctx, baseX, torsoTop, pantsTop, shoeTop, torsoH, legLength, npc.outfitStyle, palette, gender, sway);

    // 6. Arms & Boba Cup
    const armColor = palette.clothes || '#ffffff';
    pR(baseX + 3, torsoTop + 2, 3, 10, armColor);
    pR(baseX + 16, torsoTop + 2, 3, 10, armColor);

    if (npc.prop === 'boba' || isFront) {
      this.drawHand(ctx, baseX + 7, torsoTop + 9, skin, 'grip');
      this.drawHand(ctx, baseX + 13, torsoTop + 9, skin, 'grip');
      if (typeof drawBobaCup === 'function') {
        drawBobaCup(ctx, baseX + 8, torsoTop + 7, '#ffedd5', '#b45309', '#f43f5e', true);
      } else {
        this.drawPixel(ctx, baseX + 9, torsoTop + 8, 5, 7, '#ffedd5');
        this.drawPixel(ctx, baseX + 10, torsoTop + 9, 3, 5, '#b45309');
        this.drawPixel(ctx, baseX + 11, torsoTop + 6, 1, 4, '#f43f5e');
      }
    } else {
      this.drawHand(ctx, baseX + 3, torsoTop + 11, skin, 'relaxed');
      this.drawHand(ctx, baseX + 16, torsoTop + 11, skin, 'relaxed');
    }
  },

  getOrCreateModularNPC(key) {
    if (!this.modularNPCCache) this.modularNPCCache = new Map();
    const strKey = String(key || 'guest');
    if (this.modularNPCCache.has(strKey)) {
      return this.modularNPCCache.get(strKey);
    }

    // Determine deterministic gender from key or random
    const femaleHints = ['thảo', 'linh', 'trang', 'lan', 'ngọc', 'hạnh', 'nhi', 'vy', 'hoa', 'mai', 'ly', 'nữ', 'girl', 'cô', 'chị', 'bé'];
    const lower = strKey.toLowerCase();
    const isFemale = femaleHints.some(h => lower.includes(h)) || (strKey.charCodeAt(0) % 2 === 0);
    const gender = isFemale ? 'female' : 'male';

    let npc;
    if (typeof window !== 'undefined' && window.NPC_SYSTEM && window.NPC_SYSTEM.generateRandomNPC) {
      npc = window.NPC_SYSTEM.generateRandomNPC(gender, { name: strKey });
    } else {
      npc = this.generateRandomNPC(gender, { name: strKey });
    }

    this.modularNPCCache.set(strKey, npc);
    return npc;
  },

  generateRandomNPC(gender = null, overrides = {}) {
    const finalGender = gender || (Math.random() > 0.5 ? 'female' : 'male');
    const fHairs = ['twin_tails', 'ponytail', 'long_straight', 'short_bob', 'braided', 'curly_wavy', 'high_bun', 'hime_cut'];
    const mHairs = ['undercut', 'korean_curtain', 'short_crew', 'messy_spiky', 'side_part', 'curly_perm', 'buzz_cut'];
    const uHairs = ['cap_backward', 'beanie', 'bucket_hat', 'afro', 'middle_part'];

    const fOutfits = ['ao_dai', 'dress_cute', 'crop_top_jeans', 'hoodie_skirt', 'office_blouse', 'student_girl', 'sweater_skirt', 'party_dress'];
    const mOutfits = ['student_boy', 'tshirt_cargo', 'hoodie_jogger', 'suit_formal', 'polo_khaki', 'gym_tank', 'denim_jacket', 'hawaii_shirt'];
    const uOutfits = ['barista_apron', 'shipper_jacket', 'doctor_coat', 'police_uniform', 'sport_tracksuit', 'winter_puffer'];

    const hairPool = (Math.random() < 0.75) ? (finalGender === 'female' ? fHairs : mHairs) : uHairs;
    const outfitPool = (Math.random() < 0.8) ? (finalGender === 'female' ? fOutfits : mOutfits) : uOutfits;

    const skins = ['#FFE0BD', '#FCD7B0', '#D79E6D', '#C28456'];
    const hairColors = ['#1E293B', '#3E2723', '#4E2A16', '#B45309', '#FACC15', '#F472B6', '#881337', '#CBD5E1', '#0284C7'];
    const fPalettes = [
      { clothes: '#FFF1F2', sub: '#FB7185', pants: '#BE185D' },
      { clothes: '#FFFFFF', sub: '#0284C7', pants: '#1E3A8A' },
      { clothes: '#FEF08A', sub: '#F59E0B', pants: '#78350F' },
      { clothes: '#F3E8FF', sub: '#A855F7', pants: '#6B21A8' },
      { clothes: '#18181B', sub: '#F43F5E', pants: '#09090B' }
    ];
    const mPalettes = [
      { clothes: '#FFFFFF', sub: '#EF4444', pants: '#1E293B' },
      { clothes: '#0F172A', sub: '#38BDF8', pants: '#334155' },
      { clothes: '#15803D', sub: '#FACC15', pants: '#1F2937' },
      { clothes: '#1D4ED8', sub: '#FFFFFF', pants: '#1E293B' },
      { clothes: '#78350F', sub: '#FDE68A', pants: '#1C1917' }
    ];

    const pick = arr => arr[Math.floor(Math.random() * arr.length)];
    const chosenPalette = pick(finalGender === 'female' ? fPalettes : mPalettes);

    return {
      isModular: true,
      id: overrides.id || ('npc_' + Date.now() + '_' + Math.floor(Math.random() * 1000)),
      name: overrides.name || (finalGender === 'female' ? 'Bạn Nữ' : 'Bạn Nam'),
      gender: finalGender,
      role: overrides.role || 'Khách Quen',
      quote: overrides.quote || 'Pha ngon giùm mình nhé!',
      hairStyle: overrides.hairStyle || pick(hairPool),
      outfitStyle: overrides.outfitStyle || pick(outfitPool),
      palette: {
        skin: overrides.palette?.skin || pick(skins),
        skinShadow: '#E8A882',
        blush: '#FF7675',
        hair: overrides.palette?.hair || pick(hairColors),
        clothes: overrides.palette?.clothes || chosenPalette.clothes,
        sub: overrides.palette?.sub || chosenPalette.sub,
        pants: overrides.palette?.pants || chosenPalette.pants
      },
      prop: overrides.prop || 'boba',
      height: overrides.height || 54
    };
  },

  createCustomNPC(config) {
    const gender = config.gender || 'female';
    return {
      isModular: true,
      id: config.id || ('custom_' + Date.now()),
      name: config.name || (gender === 'female' ? 'Bạn Nữ' : 'Bạn Nam'),
      gender: gender,
      role: config.role || 'Khách Quen',
      quote: config.quote || 'Trà sữa tuyệt vời!',
      hairStyle: config.hairStyle || (gender === 'female' ? 'twin_tails' : 'undercut'),
      outfitStyle: config.outfitStyle || (gender === 'female' ? 'ao_dai' : 'student_boy'),
      palette: {
        skin: config.palette?.skin || '#FFE0BD',
        skinShadow: config.palette?.skinShadow || '#E8A882',
        blush: config.palette?.blush || '#FF7675',
        hair: config.palette?.hair || '#3E2723',
        clothes: config.palette?.clothes || '#FFFFFF',
        sub: config.palette?.sub || '#EF4444',
        pants: config.palette?.pants || '#1E293B'
      },
      prop: config.prop || 'boba',
      height: config.height || 54
    };
  },

  // 50 RETRO PIXEL ART CHARACTERS SYSTEM
  drawCustomer(ctx, x, y, type, isFront = true, quote = '', customerName = '') {
    const char = (typeof getCharacter === 'function') ? (getCharacter(customerName) || getCharacter(type)) : null;
    const isMoving = isFront ? (x < this.targetCustomerX) : false;
    const idleBob = Math.round(Math.sin(this.tick * 0.16) * 1.2);
    const walkBob = (this.customerState === 'waiting' && isMoving)
      ? Math.round(Math.sin(this.tick * 0.45) * 2)
      : idleBob;

    const height = (char && char.height) ? char.height : ((typeof getCharacterHeight === 'function') ? getCharacterHeight(char) : 54);
    const baseX = Math.round(x) - 1;
    const baseY = Math.round(148 - height + walkBob);
    const sway = isMoving
      ? (Math.sin(this.tick * 0.45) > 0 ? 1 : 0)
      : (Math.sin(this.tick * 0.18) > 0 ? 1 : 0);

    // 1. Soft Multi-layer Pixel Shadow (Faithfully matching ModelNPC.html)
    const shadowX = Math.round(baseX + 12);
    const shadowY = 148;
    ctx.fillStyle = 'rgba(25, 15, 10, 0.10)';
    ctx.beginPath();
    ctx.ellipse(shadowX, shadowY, 14, 4, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = 'rgba(20, 10, 5, 0.22)';
    ctx.beginPath();
    ctx.ellipse(shadowX, shadowY, 9, 2.5, 0, 0, Math.PI * 2);
    ctx.fill();

    const isBlinking = (this.tick % 90) < 4;
    const isHappy = isFront && this.isDrinking;

    // 2. Master NPC Character Pipeline (Supports both classic 50 NPCs & Modular NPC generator)
    if (char && char.isModular) {
      this.drawModularNPC(ctx, char, baseX, baseY, sway, isFront, isHappy, isBlinking);
    } else if (char && typeof drawNPCCharacter === 'function') {
      drawNPCCharacter(ctx, char, baseX, baseY, sway, isFront, isHappy, isBlinking);
    } else {
      const autoNpc = this.getOrCreateModularNPC(customerName || type);
      this.drawModularNPC(ctx, autoNpc, baseX, baseY, sway, isFront, isHappy, isBlinking);
    }

    // 3. Floating Pixel Pink Hearts when happily drinking boba
    if (isHappy) {
      for (let h = 0; h < 3; h++) {
        const hOffset = Math.round(Math.sin(this.tick * 0.15 + h * 2) * 3);
        const hY = Math.round(baseY - 8 - h * 7 - ((this.tick * 0.6) % 12));
        const hX = Math.round(x + 3 + h * 7 + hOffset);
        this.drawPixel(ctx, hX - 2, hY, 2, 2, '#ff7675');
        this.drawPixel(ctx, hX + 1, hY, 2, 2, '#ff7675');
        this.drawPixel(ctx, hX - 2, hY + 2, 5, 2, '#ff7675');
        this.drawPixel(ctx, hX - 1, hY + 4, 3, 1, '#ff7675');
        this.drawPixel(ctx, hX, hY + 5, 1, 1, '#ff7675');
      }
    }

    // 4. Shop / Companion Pet (if character does not have their own pet)
    const hasOwnPet = char && char.style === 'lottery_girl';
    if (!hasOwnPet && isFront && (!this.queue || this.queue.length <= 1 || x <= 195)) {
      const petBob = (this.customerState === 'waiting' && isMoving) ? Math.round(Math.sin(this.tick * 0.45) * 2) : 0;
      const petTail = Math.round(Math.sin(this.tick * 0.25) * 2);
      const petX = x - 18;
      const petY = 136;
      // Pet shadow
      ctx.fillStyle = 'rgba(10, 5, 12, 0.3)';
      ctx.beginPath();
      ctx.ellipse(petX + 6, petY + 12, 8, 3, 0, 0, Math.PI * 2);
      ctx.fill();

      if ((char ? char.id : type) % 2 === 0) { // CÚN POODLE VÀNG LÔNG XOĂN
        ctx.fillStyle = '#e5a65e';
        ctx.fillRect(petX + 2, petY + 2 + petBob, 10, 8);
        ctx.fillRect(petX + 8, petY - 4 + petBob, 7, 7);
        ctx.fillRect(petX + 13, petY - 2 + petBob, 3, 5);
        ctx.fillStyle = '#e74c3c';
        ctx.fillRect(petX + 7, petY + 2 + petBob, 3, 2);
        ctx.fillStyle = '#f4c430';
        ctx.fillRect(petX + 8, petY + 4 + petBob, 2, 2);
        ctx.fillStyle = '#c8853b';
        ctx.fillRect(petX + 3, petY + 9, 3, 4);
        ctx.fillRect(petX + 8, petY + 9, 3, 4);
        ctx.fillRect(petX - 1, petY + 2 + petTail, 3, 3);
      } else { // MÈO TAM THỂ MƯỚP
        ctx.fillStyle = '#fff';
        ctx.fillRect(petX + 2, petY + 3 + petBob, 9, 7);
        ctx.fillStyle = '#e67e22';
        ctx.fillRect(petX + 4, petY + 4 + petBob, 4, 3);
        ctx.fillStyle = '#fff';
        ctx.fillRect(petX + 7, petY - 3 + petBob, 6, 6);
        ctx.fillStyle = '#e67e22';
        ctx.fillRect(petX + 7, petY - 5 + petBob, 2, 2);
        ctx.fillStyle = '#2c3e50';
        ctx.fillRect(petX + 11, petY - 5 + petBob, 2, 2);
        ctx.fillStyle = '#2ecc71';
        ctx.fillRect(petX + 11, petY - 1 + petBob, 1, 2);
        ctx.fillStyle = '#eee';
        ctx.fillRect(petX + 3, petY + 9, 2, 3);
        ctx.fillRect(petX + 8, petY + 9, 2, 3);
        ctx.fillStyle = '#e67e22';
        ctx.fillRect(petX - 2, petY + petTail, 2, 5);
      }
    }

    // Emotion & Typewriter Speech Bubble (Only for Front Waiting Customer)
    const activeQuote = quote || this.customerQuote;
    if (isFront && this.customerState === 'waiting' && x >= 175 && !this.isDrinking) {
      const bubbleBob = Math.sin(this.tick * 0.15) * 2;
      const bx = x + 10;
      const by = baseY - 12 + bubbleBob;

      if (this.bubbleType === 'dialogue' && activeQuote) {
        // Retro Pixel Comic Dialogue Bubble with Dark Contrast Frame & Crisp White Text
        const textWidth = Math.min(145, ctx.measureText(activeQuote).width + 18);
        const bw = Math.max(96, textWidth);
        const bh = 24;
        const boxX = Math.min(this.width - bw - 5, Math.max(5, bx - bw / 2 + 5));
        const boxY = by - 14;

        // Drop shadow
        ctx.fillStyle = 'rgba(0, 0, 0, 0.45)';
        ctx.fillRect(boxX + 2, boxY + 2, bw, bh);

        // Dark sleek dialogue box for maximum text readability
        ctx.fillStyle = 'rgba(22, 12, 24, 0.95)';
        ctx.fillRect(boxX, boxY, bw, bh);
        ctx.strokeStyle = '#f4c430'; // Gold border
        ctx.lineWidth = 1.5;
        ctx.strokeRect(boxX, boxY, bw, bh);

        // Tail pointing down to customer
        ctx.fillStyle = 'rgba(22, 12, 24, 0.95)';
        ctx.beginPath();
        ctx.moveTo(bx - 3, boxY + bh);
        ctx.lineTo(bx + 1, boxY + bh + 6);
        ctx.lineTo(bx + 5, boxY + bh);
        ctx.fill();
        ctx.strokeStyle = '#f4c430';
        ctx.beginPath();
        ctx.moveTo(bx - 3, boxY + bh);
        ctx.lineTo(bx + 1, boxY + bh + 6);
        ctx.lineTo(bx + 5, boxY + bh);
        ctx.stroke();

        // Crisp White Text for Highest Readability
        ctx.fillStyle = '#ffffff';
        ctx.font = 'bold 9.5px "Courier New", monospace, sans-serif';
        ctx.fillText(activeQuote.slice(0, 22), boxX + 6, boxY + 10.5);
        if (activeQuote.length > 22) {
          ctx.fillText(activeQuote.slice(22, 44), boxX + 6, boxY + 19.5);
        }
      } else {
        // Classic Round Bubble
        ctx.fillStyle = '#fff';
        ctx.beginPath();
        ctx.arc(bx, by, 12, 0, Math.PI * 2);
        ctx.fill();

        // Tail
        ctx.beginPath();
        ctx.moveTo(bx - 3, by + 10);
        ctx.lineTo(bx - 1, by + 18);
        ctx.lineTo(bx + 4, by + 9);
        ctx.fill();

        ctx.font = '13px monospace';
        if (this.bubbleType === 'boba') {
          ctx.fillText('🧋', bx - 7, by + 4);
        } else if (this.bubbleType === 'heart') {
          ctx.fillText('💖', bx - 7, by + 4);
        } else if (this.bubbleType === 'angry') {
          ctx.fillText('💢', bx - 7, by + 4);
        }
      }
    }
  }
};

