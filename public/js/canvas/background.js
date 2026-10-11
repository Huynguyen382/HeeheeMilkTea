// Environment & Background Scene Renderer for GameCanvas
// Artisan Pixel Art HD System with 5-Layer Parallax & Offscreen Caching
// Refactored Modular Orchestrator

import { StaticBackgroundCache, staticBgCache } from './background/cache.js';
import { atmosphereMethods } from './background/atmosphere.js';
import { townMethods } from './background/scene-town.js';
import { hustMethods } from './background/scene-hust.js';
import { walkingStreetMethods } from './background/scene-walking-street.js';
import { mocChauMethods } from './background/scene-moc-chau.js';
import { franchiseMethods } from './background/scene-franchise.js';

export { StaticBackgroundCache, staticBgCache };

export const backgroundMethods = {
  ...atmosphereMethods,
  ...townMethods,
  ...hustMethods,
  ...walkingStreetMethods,
  ...mocChauMethods,
  ...franchiseMethods,

  /**
   * Main background renderer routing to active chapter / venue scene
   * @param {CanvasRenderingContext2D} ctx - Main canvas 2D context
   */
  drawBackground(ctx) {
    const tod = this.getTimeOfDay();
    const scene = (typeof this.getEffectiveScene === 'function') 
      ? this.getEffectiveScene() 
      : (this.sceneSetting || 'town');

    if (scene === 'franchise') {
      this.drawFranchiseGlobalBackground(ctx, tod);
      return;
    }
    if (scene === 'walking_street') {
      this.drawWalkingStreetFlagshipBackground(ctx, tod);
      return;
    }
    if (scene === 'hust') {
      this.drawHUSTParabolBackground(ctx, tod);
      return;
    }
    if (scene === 'moc_chau') {
      this.drawMocChauTeaFarmBackground(ctx, tod);
      return;
    }

    // Default: Chapter 1 Phố Cổ Hà Nội
    this.drawTownBackground(ctx, tod);
  }
};

export default backgroundMethods;
