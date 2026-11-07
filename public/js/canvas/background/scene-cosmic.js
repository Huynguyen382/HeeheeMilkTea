// Chapter 5: Vương Triều Trà Sữa Vũ Trụ (Cosmic Boba Empire Scene)
// Retro Pixel Art HD space station citadel with nebulae, blue planet horizon, orbital boba satellites, and quantum energy conduits.
import { staticBgCache } from './cache.js';

export const cosmicMethods = {
  drawCosmicEmpireBackground(ctx, tod) {
    const isStorm = this.weather && this.weather.id === 'stormy';
    const isRain = this.weather && this.weather.id === 'rainy';
    const isCloudy = this.weather && this.weather.id === 'cloudy';
    const isWindy = this.weather && this.weather.id === 'windy';

    // 1. SKY GRADIENT - DEEP SPACE NEBULA & COSMIC VOID
    const skyGrad = ctx.createLinearGradient(0, 0, 0, 145);
    if (isStorm) {
      // Cosmic Ion Tempest
      skyGrad.addColorStop(0, '#04010a');
      skyGrad.addColorStop(0.4, '#150628');
      skyGrad.addColorStop(0.75, '#2e0854');
      skyGrad.addColorStop(1, '#491059');
    } else if (isRain) {
      // Cosmic Stardust Mist
      skyGrad.addColorStop(0, '#060614');
      skyGrad.addColorStop(0.5, '#121936');
      skyGrad.addColorStop(1, '#1e2d4a');
    } else if (isCloudy) {
      // Milky Way Dense Gas Cloud
      skyGrad.addColorStop(0, '#09081a');
      skyGrad.addColorStop(0.5, '#1c1b3d');
      skyGrad.addColorStop(1, '#2f2b5c');
    } else if (isWindy) {
      // Solar Wind Aurora Gale
      skyGrad.addColorStop(0, '#030d22');
      skyGrad.addColorStop(0.4, '#0a3254');
      skyGrad.addColorStop(0.75, '#0e626e');
      skyGrad.addColorStop(1, '#1b9cfc');
    } else if (tod === 'morning') {
      // Celestial Solar Dawn
      skyGrad.addColorStop(0, '#07051a');
      skyGrad.addColorStop(0.35, '#211042');
      skyGrad.addColorStop(0.65, '#6a1b6a');
      skyGrad.addColorStop(0.85, '#d35400');
      skyGrad.addColorStop(1, '#f1c40f');
    } else if (tod === 'noon') {
      // High Solar Radiance
      skyGrad.addColorStop(0, '#080521');
      skyGrad.addColorStop(0.4, '#1b1b4d');
      skyGrad.addColorStop(0.7, '#2f3575');
      skyGrad.addColorStop(1, '#5352ed');
    } else if (tod === 'afternoon') {
      // Pulsar Twilight / Flare
      skyGrad.addColorStop(0, '#0f021f');
      skyGrad.addColorStop(0.3, '#320b3b');
      skyGrad.addColorStop(0.65, '#831a4a');
      skyGrad.addColorStop(0.85, '#e056fd');
      skyGrad.addColorStop(1, '#ff9ff3');
    } else {
      // Deep Space Night: Majestic Violet-Magenta Nebula Void
      skyGrad.addColorStop(0, '#020108');
      skyGrad.addColorStop(0.35, '#0b0416');
      skyGrad.addColorStop(0.7, '#18072b');
      skyGrad.addColorStop(1, '#240a3e');
    }
    ctx.fillStyle = skyGrad;
    ctx.fillRect(0, 0, this.width, 145);

    // 2. SWIRLING NEBULA CLOUD FORMATIONS (Artisan Radial Glow Layers)
    const nebPulse = Math.sin(this.tick * 0.015) * 0.08 + 0.22;
    // Purple Nebula (left-center)
    const neb1 = ctx.createRadialGradient(160, 50, 10, 160, 50, 110);
    neb1.addColorStop(0, `rgba(189, 147, 249, ${nebPulse * 0.9})`);
    neb1.addColorStop(0.5, `rgba(139, 92, 246, ${nebPulse * 0.45})`);
    neb1.addColorStop(1, 'rgba(0, 0, 0, 0)');
    ctx.fillStyle = neb1;
    ctx.beginPath();
    ctx.arc(160, 50, 110, 0, Math.PI * 2);
    ctx.fill();

    // Cyan / Teal Cosmic Drift (right-upper)
    const neb2 = ctx.createRadialGradient(520, 42, 10, 520, 42, 95);
    neb2.addColorStop(0, `rgba(0, 206, 201, ${nebPulse * 0.75})`);
    neb2.addColorStop(0.55, `rgba(116, 185, 255, ${nebPulse * 0.35})`);
    neb2.addColorStop(1, 'rgba(0, 0, 0, 0)');
    ctx.fillStyle = neb2;
    ctx.beginPath();
    ctx.arc(520, 42, 95, 0, Math.PI * 2);
    ctx.fill();

    // Magenta Starburst Rift (center-deep)
    const neb3 = ctx.createRadialGradient(340, 75, 5, 340, 75, 80);
    neb3.addColorStop(0, `rgba(255, 121, 198, ${nebPulse * 0.65})`);
    neb3.addColorStop(0.6, `rgba(224, 86, 253, ${nebPulse * 0.25})`);
    neb3.addColorStop(1, 'rgba(0, 0, 0, 0)');
    ctx.fillStyle = neb3;
    ctx.beginPath();
    ctx.arc(340, 75, 80, 0, Math.PI * 2);
    ctx.fill();

    // 3. TWINKLING MULTI-LAYER STAR FIELD & METEOR SHOWERS
    const stars = [
      { x: 22, y: 14, s: 2, c: '#ffffff' }, { x: 55, y: 35, s: 1, c: '#a29bfe' },
      { x: 88, y: 18, s: 2, c: '#ffeaa7' }, { x: 125, y: 44, s: 1, c: '#ffffff' },
      { x: 175, y: 12, s: 2.5, c: '#81ecec' }, { x: 210, y: 32, s: 1, c: '#dfe6e9' },
      { x: 250, y: 16, s: 2, c: '#ffffff' }, { x: 295, y: 52, s: 1, c: '#fab1a0' },
      { x: 335, y: 22, s: 2, c: '#ffffff' }, { x: 375, y: 38, s: 1.5, c: '#fd79a8' },
      { x: 420, y: 15, s: 2, c: '#ffeaa7' }, { x: 465, y: 48, s: 1, c: '#81ecec' },
      { x: 505, y: 20, s: 2.5, c: '#ffffff' }, { x: 545, y: 35, s: 1, c: '#a29bfe' },
      { x: 585, y: 18, s: 2, c: '#ffffff' }, { x: 625, y: 45, s: 1, c: '#ffeaa7' },
      { x: 665, y: 25, s: 2, c: '#81ecec' }, { x: 710, y: 32, s: 1, c: '#ffffff' }
    ];
    stars.forEach((st, idx) => {
      const flicker = (Math.sin(this.tick * 0.1 + idx * 1.7) + 1) * 0.4 + 0.25;
      ctx.fillStyle = st.c;
      ctx.globalAlpha = flicker;
      ctx.fillRect(st.x, st.y, st.s, st.s);
      // 4-point sparkle cross on brighter stars
      if (st.s >= 2) {
        ctx.fillRect(st.x - 1, st.y + (st.s > 2 ? 1 : 0.5), st.s + 2, 0.8);
        ctx.fillRect(st.x + (st.s > 2 ? 1 : 0.5), st.y - 1, 0.8, st.s + 2);
      }
    });
    ctx.globalAlpha = 1.0;

    // Periodic Shooting Stars (Meteors streaking across upper space)
    const meteorCycle = (this.tick % 240);
    if (meteorCycle < 35) {
      const mP = meteorCycle / 35;
      const mStartX = 580 - mP * 240;
      const mStartY = 8 + mP * 55;
      const mLen = 32;
      const mGrad = ctx.createLinearGradient(mStartX, mStartY, mStartX + mLen, mStartY - mLen * 0.35);
      mGrad.addColorStop(0, '#ffffff');
      mGrad.addColorStop(0.3, '#74b9ff');
      mGrad.addColorStop(0.7, '#bd93f9');
      mGrad.addColorStop(1, 'rgba(0, 0, 0, 0)');
      ctx.strokeStyle = mGrad;
      ctx.lineWidth = 1.6;
      ctx.beginPath();
      ctx.moveTo(mStartX, mStartY);
      ctx.lineTo(mStartX + mLen, mStartY - mLen * 0.35);
      ctx.stroke();
    }

    // 4. CELESTIAL PLANETARY HORIZON (BLUE MARBLE GAIA / EARTH CRESCENT)
    const earthCX = 80;
    const earthCY = 155;
    const earthR = 64;
    // Atmospheric glow rim
    const atmoGrad = ctx.createRadialGradient(earthCX, earthCY, earthR - 4, earthCX, earthCY, earthR + 18);
    atmoGrad.addColorStop(0, 'rgba(0, 206, 201, 0.45)');
    atmoGrad.addColorStop(0.6, 'rgba(9, 132, 227, 0.22)');
    atmoGrad.addColorStop(1, 'rgba(0, 0, 0, 0)');
    ctx.fillStyle = atmoGrad;
    ctx.beginPath();
    ctx.arc(earthCX, earthCY, earthR + 18, 0, Math.PI * 2);
    ctx.fill();

    // Planet body
    const planetGrad = ctx.createRadialGradient(earthCX - 15, earthCY - 15, 6, earthCX, earthCY, earthR);
    planetGrad.addColorStop(0, '#00cec9');
    planetGrad.addColorStop(0.35, '#0984e3');
    planetGrad.addColorStop(0.7, '#1e3799');
    planetGrad.addColorStop(1, '#060a1c');
    ctx.fillStyle = planetGrad;
    ctx.beginPath();
    ctx.arc(earthCX, earthCY, earthR, 0, Math.PI * 2);
    ctx.fill();

    // Swirling white clouds over planet
    ctx.fillStyle = 'rgba(255, 255, 255, 0.38)';
    ctx.beginPath();
    ctx.ellipse(earthCX - 12, earthCY - 22, 22, 6, -0.2, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.ellipse(earthCX + 14, earthCY - 8, 18, 5, 0.15, 0, Math.PI * 2);
    ctx.fill();

    // 5. ORBITING CELESTIAL BOBA PEARL SATELLITES WITH SATURNIAN RINGS
    const satAngle = this.tick * 0.02;
    const satX = 610 + Math.sin(satAngle) * 22;
    const satY = 36 + Math.cos(satAngle) * 6;
    // Glowing pearl orb
    const pearlGrad = ctx.createRadialGradient(satX - 3, satY - 3, 2, satX, satY, 14);
    pearlGrad.addColorStop(0, '#ff9ff3');
    pearlGrad.addColorStop(0.4, '#bd93f9');
    pearlGrad.addColorStop(0.85, '#5f27cd');
    pearlGrad.addColorStop(1, '#1b0933');
    ctx.fillStyle = pearlGrad;
    ctx.beginPath();
    ctx.arc(satX, satY, 13, 0, Math.PI * 2);
    ctx.fill();

    // Holographic golden-cyan planetary ring around Boba Satellite
    ctx.save();
    ctx.translate(satX, satY);
    ctx.rotate(-0.35);
    ctx.strokeStyle = 'rgba(254, 202, 87, 0.65)';
    ctx.lineWidth = 2.2;
    ctx.beginPath();
    ctx.ellipse(0, 0, 26, 7, 0, 0, Math.PI * 2);
    ctx.stroke();
    ctx.strokeStyle = 'rgba(129, 236, 236, 0.45)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.ellipse(0, 0, 31, 8.5, 0, 0, Math.PI * 2);
    ctx.stroke();
    ctx.restore();

    // Solar panels on satellite
    ctx.fillStyle = '#0984e3';
    ctx.fillRect(satX - 22, satY - 2, 6, 4);
    ctx.fillRect(satX + 16, satY - 2, 6, 4);
    ctx.fillStyle = '#74b9ff';
    ctx.fillRect(satX - 22, satY - 1, 6, 1);
    ctx.fillRect(satX + 16, satY - 1, 6, 1);

    // 6. DISTANT COSMIC BOBALONIA CITADEL & HIGH-TECH SPIRES (SKYLINE)
    const spires = [
      { x: 190, w: 28, h: 62, c: '#160d2b', neon: '#a855f7' },
      { x: 226, w: 38, h: 80, c: '#1a0f35', neon: '#00cec9' },
      { x: 272, w: 24, h: 54, c: '#130a24', neon: '#ff7675' },
      { x: 390, w: 42, h: 92, c: '#1e113d', neon: '#fdcb6e' }, // Main Headquarters Spire
      { x: 440, w: 32, h: 68, c: '#170c2e', neon: '#00cec9' },
      { x: 480, w: 26, h: 56, c: '#120922', neon: '#a855f7' }
    ];
    spires.forEach(sp => {
      const spY = 140 - sp.h;
      // Building silhouette
      ctx.fillStyle = sp.c;
      ctx.fillRect(sp.x, spY, sp.w, sp.h);
      // Top pyramid / antennae needle
      ctx.fillStyle = '#2d1b54';
      ctx.beginPath();
      ctx.moveTo(sp.x, spY);
      ctx.lineTo(sp.x + sp.w * 0.5, spY - 14);
      ctx.lineTo(sp.x + sp.w, spY);
      ctx.fill();
      // Antenna beacon
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(sp.x + sp.w * 0.5 - 0.5, spY - 22, 1.5, 9);
      const blink = Math.sin(this.tick * 0.15 + sp.x) > 0 ? '#ff7675' : '#74b9ff';
      ctx.fillStyle = blink;
      ctx.fillRect(sp.x + sp.w * 0.5 - 1.5, spY - 24, 3, 3);

      // Neon vertical groove trims
      ctx.fillStyle = sp.neon;
      ctx.globalAlpha = 0.7;
      ctx.fillRect(sp.x + 2, spY + 4, 1.5, sp.h - 8);
      ctx.fillRect(sp.x + sp.w - 3.5, spY + 4, 1.5, sp.h - 8);
      ctx.globalAlpha = 1.0;

      // Crystalline hexagonal windows
      ctx.fillStyle = (Math.sin(this.tick * 0.05 + sp.x) > 0.1) ? 'rgba(255, 234, 167, 0.85)' : 'rgba(129, 236, 236, 0.75)';
      for (let wy = spY + 8; wy < 136; wy += 9) {
        for (let wx = sp.x + 6; wx < sp.x + sp.w - 7; wx += 8) {
          ctx.fillRect(wx, wy, 3, 4);
        }
      }
    });

    // 7. CENTRAL HOLOGRAPHIC MARQUEE: "🌌 HEEHEE COSMIC BOBA 👑"
    const hX = 330;
    const hY = 28;
    const hW = 160;
    const hH = 26;
    ctx.save();
    // Hologram projection emitter base
    ctx.fillStyle = '#2f1854';
    ctx.fillRect(hX + 15, hY + hH + 4, hW - 30, 4);
    // Translucent holographic glow screen
    const holoGrad = ctx.createLinearGradient(0, hY, 0, hY + hH);
    holoGrad.addColorStop(0, 'rgba(189, 147, 249, 0.28)');
    holoGrad.addColorStop(0.5, 'rgba(0, 206, 201, 0.18)');
    holoGrad.addColorStop(1, 'rgba(255, 121, 198, 0.24)');
    ctx.fillStyle = holoGrad;
    ctx.fillRect(hX, hY, hW, hH);
    ctx.strokeStyle = 'rgba(0, 206, 201, 0.85)';
    ctx.lineWidth = 1;
    ctx.strokeRect(hX, hY, hW, hH);

    // Hologram scanlines
    ctx.fillStyle = 'rgba(255, 255, 255, 0.18)';
    for (let sl = hY + 2; sl < hY + hH; sl += 3) {
      ctx.fillRect(hX, sl, hW, 1);
    }

    // Holographic Text with Glitch Shimmer
    const glitchOffset = (Math.sin(this.tick * 0.4) > 0.94) ? 1.5 : 0;
    ctx.font = 'bold 9px "Press Start 2P", monospace, sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillStyle = 'rgba(255, 121, 198, 0.7)';
    ctx.fillText('COSMIC BOBA EMPIRE', hX + hW * 0.5 + glitchOffset, hY + 9);
    ctx.fillStyle = '#ffffff';
    ctx.fillText('COSMIC BOBA EMPIRE', hX + hW * 0.5, hY + 9);
    ctx.font = 'bold 8px monospace, sans-serif';
    ctx.fillStyle = '#fdcb6e';
    ctx.fillText('★ VƯƠNG TRIỀU VŨ TRỤ ★', hX + hW * 0.5, hY + 19);
    ctx.restore();

    // 8. TWIN COSMIC LASER SEARCHLIGHTS SWEEPING THE STARS
    if (!isStorm) {
      ctx.save();
      const laserAngle1 = Math.sin(this.tick * 0.02) * 0.45 - 0.25;
      const laserAngle2 = Math.sin(this.tick * 0.025 + 3.14) * 0.45 + 0.25;
      [
        { x: 245, angle: laserAngle1, col: 'rgba(189, 147, 249, 0.35)' },
        { x: 500, angle: laserAngle2, col: 'rgba(0, 206, 201, 0.35)' }
      ].forEach(b => {
        ctx.save();
        ctx.translate(b.x, 140);
        ctx.rotate(b.angle);
        const beamGrad = ctx.createLinearGradient(0, 0, 0, -135);
        beamGrad.addColorStop(0, b.col);
        beamGrad.addColorStop(0.7, 'rgba(255, 255, 255, 0.12)');
        beamGrad.addColorStop(1, 'rgba(255, 255, 255, 0)');
        ctx.fillStyle = beamGrad;
        ctx.beginPath();
        ctx.moveTo(-3, 0);
        ctx.lineTo(-20, -135);
        ctx.lineTo(20, -135);
        ctx.lineTo(3, 0);
        ctx.fill();
        ctx.restore();
      });
      ctx.restore();
    }

    // 9. OBSIDIAN CRYSTALLINE OBSERVATION DECK (SÀN TÀU KHÔNG GIAN THẠCH ANH ĐEN)
    const deckY = 138;
    const deckH = this.height - deckY;
    const deckGrad = ctx.createLinearGradient(0, deckY, 0, this.height);
    deckGrad.addColorStop(0, '#150927');
    deckGrad.addColorStop(0.5, '#0d041c');
    deckGrad.addColorStop(1, '#06010f');
    ctx.fillStyle = deckGrad;
    ctx.fillRect(0, deckY, this.width, deckH);

    // Glowing Starlight Floor Grid (Đường lưới sàn công nghệ phản quang)
    ctx.fillStyle = '#241042';
    for (let px = 0; px < this.width; px += 28) {
      ctx.fillRect(px, deckY, 1, deckH);
    }
    for (let py = deckY; py < this.height; py += 12) {
      ctx.fillRect(0, py, this.width, 1);
    }

    // Embedded Quantum Energy Conduit (Dải dẫn năng lượng pha chế phát sáng đổi màu)
    const condY = deckY + 4;
    const condHue = (this.tick * 3) % 360;
    ctx.fillStyle = `hsla(${condHue}, 90%, 65%, 0.85)`;
    ctx.fillRect(0, condY, this.width, 2);

    // Secondary energy conduit at bottom border
    ctx.fillStyle = `hsla(${(condHue + 180) % 360}, 85%, 60%, 0.55)`;
    ctx.fillRect(0, this.height - 2, this.width, 2);

    // 10. HIGH-TECH PHOTON OBELISK BEACONS (ĐÈN TRỤ NĂNG LƯỢNG VŨ TRỤ TẠI [120, 360, 600])
    [120, 360, 600].forEach(lx => {
      const lBase = 140;
      // Titanium dark obelisk post
      ctx.fillStyle = '#2a1a45';
      ctx.fillRect(lx - 2, 74, 5, lBase - 74);
      // Floating glowing crystal prism top
      const prismY = 66 + Math.sin(this.tick * 0.08 + lx) * 2;
      ctx.fillStyle = '#c084fc';
      ctx.beginPath();
      ctx.moveTo(lx + 0.5, prismY - 7);
      ctx.lineTo(lx + 5, prismY);
      ctx.lineTo(lx + 0.5, prismY + 7);
      ctx.lineTo(lx - 4, prismY);
      ctx.closePath();
      ctx.fill();

      // Soft radiant photon aura
      const auraGrad = ctx.createRadialGradient(lx + 0.5, prismY, 2, lx + 0.5, prismY, 24);
      auraGrad.addColorStop(0, 'rgba(192, 132, 252, 0.45)');
      auraGrad.addColorStop(0.5, 'rgba(0, 206, 201, 0.2)');
      auraGrad.addColorStop(1, 'rgba(0, 0, 0, 0)');
      ctx.fillStyle = auraGrad;
      ctx.beginPath();
      ctx.arc(lx + 0.5, prismY, 24, 0, Math.PI * 2);
      ctx.fill();
    });

    // 11. COSMIC STARDUST & AURORAL FIREFLIES DRIFTING IN THE VOID
    ctx.save();
    for (let si = 0; si < 20; si++) {
      const sx = (si * 42 + Math.sin(this.tick * 0.03 + si * 1.5) * 28) % this.width;
      const sy = 115 + Math.sin(this.tick * 0.05 + si * 2.1) * 22;
      const sPulse = (Math.sin(this.tick * 0.1 + si * 1.4) + 1) * 0.5;
      if (sPulse > 0.1) {
        // Soft violet/cyan stardust aura
        ctx.fillStyle = si % 2 === 0 ? `rgba(189, 147, 249, ${sPulse * 0.5})` : `rgba(0, 206, 201, ${sPulse * 0.5})`;
        ctx.beginPath();
        ctx.arc(sx, sy, 3.5, 0, Math.PI * 2);
        ctx.fill();
        // Bright core
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(sx - 0.5, sy - 0.5, 1.5, 1.5);
      }
    }
    ctx.restore();
  }
};

export default cosmicMethods;
