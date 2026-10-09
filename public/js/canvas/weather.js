/**
 * Dynamic Weather Canvas Effects:
 * Rain, Storms, Thunderstorm Lightning Bolts, Screen Flash & Screen Shake
 */

export const weatherMethods = {
  setWeather(weather) {
    if (!weather) return;
    this.weather = typeof weather === 'string' ? { id: weather } : weather;
    // Pre-populate raindrops if changing to rain or storm
    if ((this.weather.id === 'rainy' || this.weather.id === 'stormy') && (!this.raindrops || this.raindrops.length === 0)) {
      this.initRaindrops();
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

  updateWeather() {
    if (!this.weather) {
      this.weather = { id: 'sunny' };
    }

    const isRain = this.weather.id === 'rainy';
    const isStorm = this.weather.id === 'stormy';

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
    if (window.sound && typeof window.sound.thunder === 'function') {
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
      const lampXs = (this.chapter === 3) ? [645] : [188, 528, 705];
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
  }
};

