// Centralized Modal & Pause State Controller
import { state } from './state.js';

let scheduleNextOrderFn = null;

export function isAnyModalOpen() {
  return [...document.querySelectorAll('.modal-overlay')]
    .some(modal => modal.id !== 'modal-auth' && getComputedStyle(modal).display !== 'none');
}

export function syncGamePauseState() {
  const modalOpen = isAnyModalOpen();
  const hasClass = document.body.classList.contains('modal-open');
  if (hasClass !== modalOpen) {
    document.body.classList.toggle('modal-open', modalOpen);
  }

  if (modalOpen) {
    if (!state.isGamePaused) {
      state.isGamePaused = true;
      state.pauseStartTime = Date.now();
      if (state.nextOrderTimeout) {
        clearTimeout(state.nextOrderTimeout);
        state.nextOrderTimeout = null;
      }
    }
  } else {
    if (state.isGamePaused) {
      // If rest overlay is active, startRestCountdown manages its own timer
      const overlayResting = document.getElementById('overlay-resting');
      if (overlayResting && getComputedStyle(overlayResting).display !== 'none') {
        return;
      }

      if (state.pauseStartTime > 0) {
        const pausedDuration = Date.now() - state.pauseStartTime;
        if (pausedDuration > 0) {
          state.orderStartTime += pausedDuration;
          state.totalWavePausedTime += pausedDuration;
        }
        state.pauseStartTime = 0;
      }
      state.isGamePaused = false;

      // If no active customer and queue empty, resume order scheduling
      if (!state.currentOrder && (!state.orderQueue || state.orderQueue.length === 0)) {
        if (typeof scheduleNextOrderFn === 'function') {
          scheduleNextOrderFn(1500);
        }
      }
    }
  }
}

export function initModalSync(scheduler) {
  scheduleNextOrderFn = scheduler;

  const modalObserver = new MutationObserver(syncGamePauseState);
  modalObserver.observe(document.body, { attributes: true, attributeFilter: ['style', 'class'], subtree: true });
  syncGamePauseState();

  // Allow clicking modal backdrop to close non-critical modals
  document.querySelectorAll('.modal-overlay').forEach(overlay => {
    overlay.addEventListener('click', (e) => {
      if (e.target === overlay && overlay.id !== 'modal-auth' && overlay.id !== 'overlay-resting' && overlay.id !== 'modal-jail') {
        overlay.style.display = 'none';
      }
    });
  });
}

