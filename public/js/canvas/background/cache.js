// Offscreen Canvas Cache for Static Architectural Layers (Roadmap Sprint 4 & V.2)
export class StaticBackgroundCache {
  constructor() {
    this.canvas = null;
    this.ctx = null;
    this.cacheKey = null;
  }

  ensure(width, height) {
    if (typeof document === 'undefined') return null;
    if (!this.canvas) {
      this.canvas = document.createElement('canvas');
      this.canvas.width = width;
      this.canvas.height = height;
      this.ctx = this.canvas.getContext('2d', { alpha: true });
      if (this.ctx) this.ctx.imageSmoothingEnabled = false;
    } else if (this.canvas.width !== width || this.canvas.height !== height) {
      this.canvas.width = width;
      this.canvas.height = height;
      this.cacheKey = null;
    }
    return this.ctx;
  }

  isValid(key) {
    return this.canvas && this.ctx && this.cacheKey === key;
  }

  render(targetCtx, key, width, height, drawFn) {
    const offCtx = this.ensure(width, height);
    if (!offCtx) {
      drawFn(targetCtx);
      return;
    }
    if (!this.isValid(key)) {
      offCtx.clearRect(0, 0, width, height);
      drawFn(offCtx);
      this.cacheKey = key;
    }
    targetCtx.drawImage(this.canvas, 0, 0);
  }
}

export const staticBgCache = new StaticBackgroundCache();

