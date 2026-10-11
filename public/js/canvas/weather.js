/**
 * Dynamic Weather Canvas Effects:
 * Rain, Storms, Thunderstorm Lightning Bolts, Screen Flash & Screen Shake
 */

import { staticBgCache } from './background/cache.js';

export const weatherMethods = {
  setWeather(weather) {
    if (!weather) return;
    const oldId = this.weather ? this.weather.id : null;
    this.weather = typeof weather === 'string' ? { id: weather } : weather;
    // Invalidate static background cache if weather id changed so new sky gradient & clouds re-render
    if (oldId !== this.weather.id && staticBgCache) {
      staticBgCache.cacheKey = null;
    }
    // Handle particles when changing weather
    if (this.weather.id === 'rainy' || this.weather.id === 'stormy') {
      const targetCount = this.weather.id === 'stormy' ? 95 : 45;
      if (!this.raindrops || this.raindrops.length < targetCount - 5 || oldId !== this.weather.id) {
        this.initRaindrops();
      }
    } else {
      this.raindrops = [];
      this.rainRipples = [];
    }

    if (this.weather.id === 'windy') {
      this.initWindParticles();
    } else {
      this.windParticles = [];
    }

    if (this.weather.id === 'cloudy') {
      this.initCloudyMist();
    } else {
      this.cloudyMist = [];
    }

    if (this.weather.id === 'sunny' || !this.weather.id) {
      this.initSunnyParticles();
    } else {
      this.dustMotes = [];
    }
  },

  initSunnyParticles() {
    this.dustMotes = [];
    const count = 24;
    for (let i = 0; i < count; i++) {
      this.dustMotes.push({
        x: Math.random() * (this.width || 440),
        y: Math.random() * 145 + 10,
        vy: -(Math.random() * 0.18 + 0.08),
        vx: (Math.random() - 0.5) * 0.22,
        r: Math.random() * 1.4 + 0.6,
        alpha: Math.random() * 0.55 + 0.25,
        pulseSpeed: Math.random() * 0.04 + 0.02,
        phase: Math.random() * Math.PI * 2
      });
    }
  },

  initRaindrops() {
    this.raindrops = [];
    const count = this.weather && this.weather.id === 'stormy' ? 95 : 45;
    for (let i = 0; i < count; i++) {
      this.raindrops.push({
        x: Math.random() * (this.width + 60) - 30,
        y: Math.random() * this.height,
        len: Math.random() * 8 + (this.weather && this.weather.id === 'stormy' ? 10 : 5),
        speed: Math.random() * 4 + (this.weather && this.weather.id === 'stormy' ? 7 : 4),
        angle: this.weather && this.weather.id === 'stormy' ? -0.35 : -0.1
      });
    }
  },

  initWindParticles() {
    this.windParticles = [];
    const colors = ['#e67e22', '#d35400', '#f39c12', '#27ae60', '#ff7675', '#fdcb6e'];
    for (let i = 0; i < 35; i++) {
      this.windParticles.push({
        x: Math.random() * (this.width + 100) - 50,
        y: Math.random() * 180,
        vx: -(Math.random() * 3.5 + 2.5),
        vy: (Math.random() - 0.2) * 1.2,
        size: Math.random() > 0.4 ? 3 : 2,
        color: colors[Math.floor(Math.random() * colors.length)],
        angle: Math.random() * Math.PI * 2,
        spin: (Math.random() - 0.5) * 0.15,
        type: Math.random() < 0.25 ? 'gust' : 'leaf'
      });
    }
  },

  initCloudyMist() {
    this.cloudyMist = [];
    for (let i = 0; i < 6; i++) {
      this.cloudyMist.push({
        x: (i * (this.width / 5)) - 40,
        y: 110 + (i % 3) * 18,
        w: 120 + Math.random() * 60,
        h: 24 + Math.random() * 14,
        speed: 0.15 + Math.random() * 0.12,
        alpha: 0.18 + Math.random() * 0.12
      });
    }
  },

  updateWeather() {
    if (!this.weather) {
      this.weather = { id: 'sunny' };
    }

    const isRain = this.weather.id === 'rainy';
    const isStorm = this.weather.id === 'stormy';
    const isWind = this.weather.id === 'windy';
    const isCloud = this.weather.id === 'cloudy';

    // 1. Update Raindrops
    if (isRain || isStorm) {
      if (!this.raindrops || this.raindrops.length < (isStorm ? 90 : 40)) {
        this.initRaindrops();
      }

      this.raindrops.forEach(drop => {
        drop.x += Math.sin(drop.angle) * drop.speed;
        drop.y += Math.cos(drop.angle) * drop.speed;

        // Splashing on pavement at y >= 142
        if (drop.y >= 142) {
          if (Math.random() < 0.25) {
            if (!this.particles) this.particles = [];
            this.particles.push({
              x: drop.x,
              y: 142 + Math.random() * 20,
              vx: (Math.random() - 0.5) * 2,
              vy: -Math.random() * 1.5,
              life: 8,
              maxLife: 8,
              color: '#dff9fb',
              size: 1.5
            });
          }
          if (!this.rainRipples) this.rainRipples = [];
          if (Math.random() < 0.35 && this.rainRipples.length < 24) {
            this.rainRipples.push({
              x: drop.x,
              y: 144 + Math.random() * 52,
              r: 1,
              maxR: 4 + Math.random() * 5,
              alpha: 0.75
            });
          }
          drop.y = -10;
          drop.x = Math.random() * (this.width + 60) - 20;
        }

        if (drop.x < -40) drop.x = this.width + 20;
      });

      // Update expanding rain puddle ripples
      if (this.rainRipples) {
        for (let rIdx = this.rainRipples.length - 1; rIdx >= 0; rIdx--) {
          const rip = this.rainRipples[rIdx];
          rip.r += 0.35;
          rip.alpha -= 0.045;
          if (rip.alpha <= 0 || rip.r >= rip.maxR) {
            this.rainRipples.splice(rIdx, 1);
          }
        }
      }
    }

    // 2. Storm Lightning System
    if (isStorm) {
      if (!this.lightningTimer) {
        this.lightningTimer = Math.floor(Math.random() * 240) + 180; // 3 - 7 seconds between strikes
      }

      this.lightningTimer--;
      if (this.lightningTimer <= 0) {
        this.triggerLightning();
        this.lightningTimer = Math.floor(Math.random() * 320) + 200;
      }
    }

    // 3. Lightning Fade & Screen Flash Decay
    if (this.lightning) {
      this.lightning.life--;
      if (this.lightning.life <= 0) {
        this.lightning = null;
      }
    }

    if (this.screenFlash > 0) {
      this.screenFlash = Math.max(0, this.screenFlash - 0.08);
    }

    if (this.screenShake > 0) {
      this.screenShake--;
    }

    // 4. Windy Particles & Leaves Update
    if (isWind) {
      if (!this.windParticles || this.windParticles.length < 25) {
        this.initWindParticles();
      }
      this.windParticles.forEach(p => {
        p.x += p.vx;
        p.y += p.vy + Math.sin(p.angle) * 0.45;
        p.angle += p.spin;
        if (p.x < -40) {
          p.x = this.width + 30;
          p.y = Math.random() * 180;
        }
        if (p.y < 10) p.y = 10;
        if (p.y > 195) p.y = 170;
      });
    }

    // 5. Cloudy Mist Update
    if (isCloud) {
      if (!this.cloudyMist || this.cloudyMist.length < 4) {
        this.initCloudyMist();
      }
      this.cloudyMist.forEach(m => {
        m.x += m.speed;
        if (m.x > this.width + 50) {
          m.x = -m.w - 30;
          m.y = 110 + Math.random() * 30;
        }
      });
    }

    // 6. Sunny Dust Motes Update (Roadmap III.2)
    const isSunny = !this.weather.id || this.weather.id === 'sunny';
    if (isSunny) {
      if (!this.dustMotes || this.dustMotes.length < 15) {
        this.initSunnyParticles();
      }
      this.dustMotes.forEach(m => {
        m.y += m.vy;
        m.x += m.vx + Math.sin(m.phase) * 0.22;
        m.phase += m.pulseSpeed;
        if (m.y < 12) {
          m.y = 150;
          m.x = Math.random() * (this.width || 440);
        }
        if (m.x < -10) m.x = (this.width || 440) + 10;
        if (m.x > (this.width || 440) + 10) m.x = -10;
      });
    }
  },

  // Generate procedural branching jagged lightning bolt
  triggerLightning() {
    const startX = Math.random() * (this.width - 120) + 60;
    const branches = [];

    // Main central bolt from sky to ground
    let curX = startX;
    let curY = 0;
    const mainSegments = [];
    const targetY = 135 + Math.random() * 25;

    while (curY < targetY) {
      const nextY = Math.min(targetY, curY + Math.random() * 14 + 8);
      const nextX = curX + (Math.random() - 0.5) * 22;
      mainSegments.push({ x1: curX, y1: curY, x2: nextX, y2: nextY });

      // Fork sub-branches
      if (Math.random() < 0.35 && curY > 30) {
        const subBranch = [];
        let subX = nextX;
        let subY = nextY;
        const subSteps = Math.floor(Math.random() * 3) + 2;
        for (let s = 0; s < subSteps; s++) {
          const sNextY = subY + Math.random() * 12 + 6;
          const sNextX = subX + (Math.random() - 0.3) * 20;
          subBranch.push({ x1: subX, y1: subY, x2: sNextX, y2: sNextY });
          subX = sNextX;
          subY = sNextY;
        }
        branches.push(subBranch);
      }

      curX = nextX;
      curY = nextY;
    }
    branches.push(mainSegments);

    this.lightning = {
      branches,
      life: 14 // lasts ~0.25s
    };

    // Intense screen flash & screen rumble
    this.screenFlash = 0.88;
    this.screenShake = 12;

    // Trigger thunder audio clap
    if (typeof window !== 'undefined' && window.sound && typeof window.sound.thunder === 'function') {
      window.sound.thunder();
    }
  },

  drawWeatherEffects(ctx) {
    if (!this.weather) return;

    // 1. Draw Wet Pavement Sheen, Lamp Reflections, Puddle Ripples & Rain Streaks
    if ((this.weather.id === 'rainy' || this.weather.id === 'stormy') && this.raindrops) {
      ctx.save();
      const isStorm = this.weather.id === 'stormy';

      // 1a. Wet Pavement Sheen & Gloss Layer (y: 142 to 200)
      ctx.save();
      ctx.fillStyle = isStorm ? 'rgba(10, 20, 35, 0.42)' : 'rgba(15, 25, 40, 0.32)';
      ctx.fillRect(0, 142, this.width, this.height - 142);

      // Light Reflections on Wet Surface (Cart & Street Lamps)
      ctx.globalCompositeOperation = 'screen';

      // Stall / Cart Golden Glow Reflection on wet road
      const cartRefGrad = ctx.createLinearGradient(0, 144, 0, 185);
      cartRefGrad.addColorStop(0, 'rgba(241, 196, 15, 0.28)');
      cartRefGrad.addColorStop(0.5, 'rgba(230, 126, 34, 0.12)');
      cartRefGrad.addColorStop(1, 'rgba(0, 0, 0, 0)');
      ctx.fillStyle = cartRefGrad;
      ctx.fillRect(68, 144, 75, 40);

      // Street Lamp Wet Reflections
      const curScene = (typeof this.getEffectiveScene === 'function') ? this.getEffectiveScene() : (this.sceneSetting || 'town');
      const lampXs = (curScene === 'walking_street') 
        ? [95] 
        : (curScene === 'franchise') 
          ? [120, 480, 680] 
          : (curScene === 'town')
            ? [188, 528, 705]
            : [];
      lampXs.forEach(lx => {
        const lampRefGrad = ctx.createLinearGradient(0, 144, 0, 195);
        lampRefGrad.addColorStop(0, 'rgba(255, 234, 167, 0.32)');
        lampRefGrad.addColorStop(0.6, 'rgba(243, 156, 18, 0.12)');
        lampRefGrad.addColorStop(1, 'rgba(0, 0, 0, 0)');
        ctx.fillStyle = lampRefGrad;
        ctx.fillRect(lx - 12, 144, 24, 48);
      });
      ctx.restore();

      // 1b. Rain Puddle Ripple Rings on Pavement
      if (this.rainRipples && this.rainRipples.length > 0) {
        ctx.save();
        this.rainRipples.forEach(rip => {
          ctx.strokeStyle = `rgba(223, 249, 251, ${rip.alpha})`;
          ctx.lineWidth = 0.8;
          ctx.beginPath();
          ctx.ellipse(rip.x, rip.y, rip.r * 2.2, rip.r * 0.7, 0, 0, Math.PI * 2);
          ctx.stroke();
        });
        ctx.restore();
      }

      // 1c. Rain Streaks
      ctx.strokeStyle = isStorm ? 'rgba(223, 249, 251, 0.75)' : 'rgba(200, 230, 255, 0.55)';
      ctx.lineWidth = isStorm ? 1.5 : 1.0;

      ctx.beginPath();
      this.raindrops.forEach(drop => {
        const endX = drop.x + Math.sin(drop.angle) * drop.len;
        const endY = drop.y + Math.cos(drop.angle) * drop.len;
        ctx.moveTo(drop.x, drop.y);
        ctx.lineTo(endX, endY);
      });
      ctx.stroke();
      ctx.restore();
    }

    // 2. Draw Branching Jagged Lightning
    if (this.lightning && this.lightning.branches) {
      ctx.save();
      const lifeRatio = this.lightning.life / 14;

      // Glow pass
      ctx.strokeStyle = `rgba(112, 161, 255, ${0.7 * lifeRatio})`;
      ctx.lineWidth = 4;
      ctx.lineCap = 'round';
      this.lightning.branches.forEach(branch => {
        ctx.beginPath();
        branch.forEach(seg => {
          ctx.moveTo(seg.x1, seg.y1);
          ctx.lineTo(seg.x2, seg.y2);
        });
        ctx.stroke();
      });

      // Bright white electric core pass
      ctx.strokeStyle = `rgba(255, 255, 255, ${0.95 * lifeRatio})`;
      ctx.lineWidth = 2;
      this.lightning.branches.forEach(branch => {
        ctx.beginPath();
        branch.forEach(seg => {
          ctx.moveTo(seg.x1, seg.y1);
          ctx.lineTo(seg.x2, seg.y2);
        });
        ctx.stroke();
      });
      ctx.restore();
    }

    // 3. Screen Flash
    if (this.screenFlash > 0) {
      ctx.save();
      ctx.fillStyle = `rgba(240, 248, 255, ${this.screenFlash})`;
      ctx.fillRect(0, 0, this.width, this.height);
      ctx.restore();
    }

    // 4. Draw Windy Leaves & Air Swirl Streaks
    if (this.weather.id === 'windy' && this.windParticles && this.windParticles.length > 0) {
      ctx.save();
      this.windParticles.forEach(p => {
        if (p.type === 'gust') {
          // Semi-transparent wind gust line
          ctx.strokeStyle = 'rgba(255, 255, 255, 0.35)';
          ctx.lineWidth = 1.2;
          ctx.beginPath();
          ctx.moveTo(p.x, p.y);
          ctx.quadraticCurveTo(p.x + 12, p.y + 2, p.x + 24, p.y - 1);
          ctx.stroke();
        } else {
          // Drifting leaf / flower petal
          ctx.save();
          ctx.translate(p.x, p.y);
          ctx.rotate(p.angle);
          ctx.fillStyle = p.color;
          ctx.beginPath();
          ctx.ellipse(0, 0, p.size * 2, p.size, 0, 0, Math.PI * 2);
          ctx.fill();
          ctx.restore();
        }
      });
      ctx.restore();
    }

    // 5. Draw Cloudy Low-Lying Atmospheric Mist
    if (this.weather.id === 'cloudy' && this.cloudyMist && this.cloudyMist.length > 0) {
      ctx.save();
      this.cloudyMist.forEach(m => {
        const grad = ctx.createRadialGradient(
          m.x + m.w / 2, m.y + m.h / 2, 2,
          m.x + m.w / 2, m.y + m.h / 2, m.w / 2
        );
        grad.addColorStop(0, `rgba(223, 230, 233, ${m.alpha})`);
        grad.addColorStop(0.5, `rgba(200, 214, 229, ${m.alpha * 0.6})`);
        grad.addColorStop(1, 'rgba(200, 214, 229, 0)');
        ctx.fillStyle = grad;
        ctx.beginPath();
        ctx.ellipse(m.x + m.w / 2, m.y + m.h / 2, m.w / 2, m.h / 2, 0, 0, Math.PI * 2);
        ctx.fill();
      });
      ctx.restore();
    }

    // 6. Draw Sunny God Rays & Floating Golden Dust Motes (Roadmap III.2)
    const isSunny = !this.weather || !this.weather.id || this.weather.id === 'sunny';
    const tod = (typeof this.getTimeOfDay === 'function') ? this.getTimeOfDay() : 'noon';
    if (isSunny && tod !== 'night') {
      ctx.save();
      ctx.globalCompositeOperation = 'screen';

      // 6a. Conical Translucent God Rays streaming diagonally through canopy and eaves
      const rayAlpha = tod === 'morning' ? 0.08 : (tod === 'afternoon' ? 0.11 : 0.06);
      const rayOrigins = [
        { x: 55, topW: 16, botX: 115, botW: 75 },
        { x: 195, topW: 22, botX: 280, botW: 95 },
        { x: 340, topW: 18, botX: 425, botW: 85 }
      ];

      rayOrigins.forEach(ray => {
        const grad = ctx.createLinearGradient(ray.x, 0, ray.botX, 175);
        grad.addColorStop(0, `rgba(255, 235, 160, ${rayAlpha * 1.4})`);
        grad.addColorStop(0.6, `rgba(255, 220, 120, ${rayAlpha * 0.8})`);
        grad.addColorStop(1, 'rgba(255, 220, 120, 0)');

        ctx.fillStyle = grad;
        ctx.beginPath();
        ctx.moveTo(ray.x - ray.topW / 2, 0);
        ctx.lineTo(ray.x + ray.topW / 2, 0);
        ctx.lineTo(ray.botX + ray.botW / 2, 175);
        ctx.lineTo(ray.botX - ray.botW / 2, 175);
        ctx.closePath();
        ctx.fill();
      });

      // 6b. Golden Dust Motes floating softly in sunlight
      if (this.dustMotes && this.dustMotes.length > 0) {
        this.dustMotes.forEach(m => {
          const currentAlpha = m.alpha * (0.6 + 0.4 * Math.sin(m.phase));
          ctx.fillStyle = `rgba(254, 211, 48, ${currentAlpha})`;
          ctx.beginPath();
          ctx.arc(m.x, m.y, m.r, 0, Math.PI * 2);
          ctx.fill();
        });
      }

      ctx.restore();
    }
  }
};

