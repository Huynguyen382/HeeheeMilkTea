// Main Game Application Controller (Modular Orchestrator)
import { state } from './modules/state.js';
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

document.addEventListener('DOMContentLoaded', async () => {
  // 1. Initialize Game Canvas
  if (typeof window.GameCanvas !== 'undefined') {
    state.canvas = new window.GameCanvas('scene');
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

  // 3. Launch Store Authentication & Session Flow
  await initStore();
});
