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
import { initCoffeeModule } from './modules/coffee.js';
import { initPricing } from './modules/pricing.js';
import { initSaveSync } from './modules/save-sync.js';

let isBootstrapped = false;

async function bootstrapApp() {
  if (isBootstrapped) return;
  isBootstrapped = true;

  // Expose state globally for non-module scripts (e.g. workstation.js)
  if (typeof window !== 'undefined') {
    window.state = state;
  }

  // Safe runner to prevent an error in one module from bricking the entire boot sequence
  const safeInit = (name, fn) => {
    try {
      fn();
    } catch (err) {
      console.error(`[Bootstrap] Error initializing ${name}:`, err);
    }
  };

  // 1. Initialize Game Canvas
  try {
    const CanvasClass = GameCanvas || (typeof window !== 'undefined' ? window.GameCanvas : null);
    if (CanvasClass) {
      state.canvas = new CanvasClass('scene');
      state.canvas.onShipperArrived = handleShipperOrderArrival;
    }
  } catch (err) {
    console.error('[Bootstrap] Error initializing GameCanvas:', err);
  }

  // 2. Initialize Core Systems & Listeners safely
  safeInit('UIControls', initUIControls);
  safeInit('DevMode', initDevMode);
  safeInit('ModalSync', () => initModalSync(scheduleNextOrder));
  safeInit('Workstation', initWorkstation);
  safeInit('Workflow', initWorkflow);
  safeInit('Market', initMarket);
  safeInit('Story', initStory);
  safeInit('Events', initEvents);
  safeInit('Modals', initModals);
  safeInit('Shift', initShift);
  safeInit('RoomModule', initRoomModule);
  safeInit('WeatherModule', initWeatherModule);
  safeInit('FarmModule', initFarmModule);
  safeInit('FranchiseModule', initFranchiseModule);
  safeInit('StaffModule', initStaffModule);
  safeInit('Pricing', initPricing);
  safeInit('SaveSync', initSaveSync);
  safeInit('LiveSync', initLiveSync);
  safeInit('CoffeeModule', initCoffeeModule);

  // 3. Launch Store Authentication & Session Flow
  try {
    await initStore();
  } catch (err) {
    console.error('[Bootstrap] Critical error in initStore:', err);
    const authModal = document.getElementById('modal-auth');
    if (authModal) authModal.style.display = 'flex';
  }
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', bootstrapApp);
} else {
  bootstrapApp();
}
