// Main Game Application Controller (Modular Orchestrator)
import './audio.js';
import './characters.js';
import './workstation.js';
import './api.js';
import { state } from './modules/state.js';
import { GameCanvas } from './canvas.js';
import './modules/npc-appearances.js';
import { initUIControls } from './modules/ui.js';
import { initDevMode } from './modules/dev-mode.js';
import { initModalSync } from './modules/modal-sync.js';
import { scheduleNextOrder, handleShipperOrderArrival } from './modules/order-manager.js';
import { initWorkstation, initWorkflow } from './modules/workflow.js';
import { initMarket } from './modules/market.js';
import { initStory } from './modules/story.js';
import { initEvents } from './modules/events.js';
import { initModals } from './modules/modals.js';
import { initShift } from './modules/shift.js';
import { initStore } from './modules/auth.js';
import { initRoomModule } from './modules/room.js';
import { initWeatherModule } from './modules/weather.js';
import { initFarmModule } from './modules/farm.js';
import { initFranchiseModule } from './modules/franchise.js';
import { initStaffModule } from './modules/staff.js';
import { initLiveSync } from './modules/live-sync.js';

let isBootstrapped = false;

async function bootstrapApp() {
  if (isBootstrapped) return;
  isBootstrapped = true;

  // Expose state globally for non-module scripts (e.g. workstation.js)
  if (typeof window !== 'undefined') {
    window.state = state;
  }

  // 1. Initialize Game Canvas
  const CanvasClass = GameCanvas || window.GameCanvas;
  if (CanvasClass) {
    state.canvas = new CanvasClass('scene');
    state.canvas.onShipperArrived = handleShipperOrderArrival;
  }

  // 2. Initialize Core Systems & Listeners
  initUIControls();
  initDevMode();
  initModalSync(scheduleNextOrder);
  initWorkstation();
  initWorkflow();
  initMarket();
  initStory();
  initEvents();
  initModals();
  initShift();
  initRoomModule();
  initWeatherModule();
  initFarmModule();
  initFranchiseModule();
  initStaffModule();
  initLiveSync();

  // 3. Launch Store Authentication & Session Flow
  await initStore();
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', bootstrapApp);
} else {
  bootstrapApp();
}
