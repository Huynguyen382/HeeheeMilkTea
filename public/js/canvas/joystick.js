/**
 * Virtual Joystick Controller for Mobile & Desktop
 * Provides smooth analog touch controls and keyboard WASD/Arrow key fallback
 */

export class VirtualJoystick {
  constructor({ baseEl, stickEl, onMove, maxDistance = 38 }) {
    this.base = baseEl;
    this.stick = stickEl;
    this.onMove = onMove || (() => {});
    this.maxDistance = maxDistance;

    this.active = false;
    this.pointerId = null;
    this.centerX = 0;
    this.centerY = 0;

    // Output vector (-1 to 1)
    this.vector = { x: 0, y: 0 };

    // Keyboard state
    this.keys = new Set();
    this.keyboardEnabled = false;

    this._onPointerDown = this.handlePointerDown.bind(this);
    this._onPointerMove = this.handlePointerMove.bind(this);
    this._onPointerUp = this.handlePointerUp.bind(this);
    this._onKeyDown = this.handleKeyDown.bind(this);
    this._onKeyUp = this.handleKeyUp.bind(this);

    this.init();
  }

  init() {
    if (!this.base || !this.stick) return;

    this.base.style.touchAction = 'none';
    this.base.addEventListener('pointerdown', this._onPointerDown);
    window.addEventListener('pointermove', this._onPointerMove);
    window.addEventListener('pointerup', this._onPointerUp);
    window.addEventListener('pointercancel', this._onPointerUp);

    this.enableKeyboard();
  }

  updateCenter() {
    if (!this.base) return;
    const rect = this.base.getBoundingClientRect();
    this.centerX = rect.left + rect.width / 2;
    this.centerY = rect.top + rect.height / 2;
  }

  handlePointerDown(e) {
    if (this.active) return;
    e.preventDefault();
    e.stopPropagation();

    this.active = true;
    this.pointerId = e.pointerId;
    if (this.base.setPointerCapture) {
      try { this.base.setPointerCapture(e.pointerId); } catch (_) {}
    }

    this.updateCenter();
    this.processPointerMove(e.clientX, e.clientY);
  }

  handlePointerMove(e) {
    if (!this.active || e.pointerId !== this.pointerId) return;
    e.preventDefault();
    this.processPointerMove(e.clientX, e.clientY);
  }

  processPointerMove(clientX, clientY) {
    const dx = clientX - this.centerX;
    const dy = clientY - this.centerY;
    const dist = Math.hypot(dx, dy);

    const clampedDist = Math.min(dist, this.maxDistance);
    const angle = Math.atan2(dy, dx);

    const stickX = Math.cos(angle) * clampedDist;
    const stickY = Math.sin(angle) * clampedDist;

    this.stick.style.transform = `translate(${stickX}px, ${stickY}px)`;

    const normX = clampedDist > 0 ? (stickX / this.maxDistance) : 0;
    const normY = clampedDist > 0 ? (stickY / this.maxDistance) : 0;

    this.vector = { x: normX, y: normY };
    this.onMove({ x: normX, y: normY, active: true });
  }

  handlePointerUp(e) {
    if (!this.active || e.pointerId !== this.pointerId) return;
    this.active = false;
    this.pointerId = null;

    if (this.base.releasePointerCapture) {
      try { this.base.releasePointerCapture(e.pointerId); } catch (_) {}
    }

    this.resetStick();

    // If no keys pressed, reset vector to 0
    if (this.keys.size === 0) {
      this.vector = { x: 0, y: 0 };
      this.onMove({ x: 0, y: 0, active: false });
    } else {
      this.updateKeyboardVector();
    }
  }

  resetStick() {
    if (this.stick) {
      this.stick.style.transform = 'translate(0px, 0px)';
    }
  }

  enableKeyboard() {
    if (this.keyboardEnabled) return;
    this.keyboardEnabled = true;
    window.addEventListener('keydown', this._onKeyDown);
    window.addEventListener('keyup', this._onKeyUp);
  }

  disableKeyboard() {
    this.keyboardEnabled = false;
    this.keys.clear();
    window.removeEventListener('keydown', this._onKeyDown);
    window.removeEventListener('keyup', this._onKeyUp);
  }

  handleKeyDown(e) {
    const code = e.code;
    const watchedKeys = ['KeyW', 'KeyA', 'KeyS', 'KeyD', 'ArrowUp', 'ArrowLeft', 'ArrowDown', 'ArrowRight'];
    if (!watchedKeys.includes(code)) return;

    // Don't hijack typing if focus is in an input field
    const activeEl = document.activeElement;
    if (activeEl && (activeEl.tagName === 'INPUT' || activeEl.tagName === 'TEXTAREA')) return;

    this.keys.add(code);
    this.updateKeyboardVector();
  }

  handleKeyUp(e) {
    const code = e.code;
    if (this.keys.has(code)) {
      this.keys.delete(code);
      this.updateKeyboardVector();
    }
  }

  updateKeyboardVector() {
    // If pointer joystick is actively held, prioritize pointer
    if (this.active) return;

    let kx = 0;
    let ky = 0;

    if (this.keys.has('KeyW') || this.keys.has('ArrowUp')) ky -= 1;
    if (this.keys.has('KeyS') || this.keys.has('ArrowDown')) ky += 1;
    if (this.keys.has('KeyA') || this.keys.has('ArrowLeft')) kx -= 1;
    if (this.keys.has('KeyD') || this.keys.has('ArrowRight')) kx += 1;

    const len = Math.hypot(kx, ky);
    if (len > 0) {
      kx /= len;
      ky /= len;
      if (this.stick) {
        this.stick.style.transform = `translate(${kx * this.maxDistance * 0.75}px, ${ky * this.maxDistance * 0.75}px)`;
      }
      this.vector = { x: kx, y: ky };
      this.onMove({ x: kx, y: ky, active: true });
    } else {
      this.resetStick();
      this.vector = { x: 0, y: 0 };
      this.onMove({ x: 0, y: 0, active: false });
    }
  }

  destroy() {
    if (this.base) {
      this.base.removeEventListener('pointerdown', this._onPointerDown);
    }
    window.removeEventListener('pointermove', this._onPointerMove);
    window.removeEventListener('pointerup', this._onPointerUp);
    window.removeEventListener('pointercancel', this._onPointerUp);
    this.disableKeyboard();
    this.resetStick();
  }
}

