// 8-bit Procedural Web Audio Synthesizer (Zero external audio files needed!)
class SoundManager {
  constructor() {
    this.ctx = null;
    this.soundEnabled = true;
    this.bgmEnabled = true; // Mặc định BẬT nhạc
    this.bgmInterval = null;
  }

  init() {
    if (!this.ctx) {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      this.ctx = new AudioCtx();
    }
    if (this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
  }

  tryStartBGM() {
    if (!this.bgmEnabled || this.bgmInterval) return;
    this.init();
    if (this.ctx && (this.ctx.state === 'running' || this.ctx.state === 'suspended')) {
      this.ctx.resume().then(() => {
        if (!this.bgmInterval && this.bgmEnabled) {
          this.startLofiBGM();
        }
      }).catch(() => {});
    }
  }

  playTone(freq, type, duration, startVol = 0.2, endVol = 0.01) {
    if (!this.soundEnabled) return;
    this.init();
    try {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = type;
      osc.frequency.setValueAtTime(freq, this.ctx.currentTime);
      gain.gain.setValueAtTime(startVol, this.ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(endVol, this.ctx.currentTime + duration);
      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start();
      osc.stop(this.ctx.currentTime + duration);
    } catch (e) {}
  }

  coin() {
    this.playTone(987.77, 'sine', 0.08, 0.25);
    setTimeout(() => this.playTone(1318.51, 'square', 0.2, 0.2), 80);
  }

  pour() {
    this.playTone(220, 'triangle', 0.15, 0.3);
    setTimeout(() => this.playTone(280, 'triangle', 0.15, 0.2), 60);
  }

  ice() {
    this.playTone(1400, 'square', 0.04, 0.15);
    setTimeout(() => this.playTone(1800, 'square', 0.04, 0.15), 50);
  }

  talk(pitch = 520) {
    this.playTone(pitch, 'triangle', 0.04, 0.15, 0.01);
  }

  shake() {
    this.playTone(150, 'sawtooth', 0.08, 0.3);
    setTimeout(() => this.playTone(120, 'sawtooth', 0.08, 0.3), 80);
  }

  seal() {
    this.playTone(440, 'sine', 0.06, 0.2);
    setTimeout(() => this.playTone(880, 'sine', 0.12, 0.25), 60);
  }

  strawPop() {
    this.playTone(800, 'square', 0.03, 0.3);
    setTimeout(() => this.playTone(350, 'sine', 0.08, 0.2), 30);
  }

  slurp() {
    this.playTone(320, 'triangle', 0.08, 0.2);
    setTimeout(() => this.playTone(480, 'sine', 0.12, 0.25), 60);
    setTimeout(() => this.playTone(600, 'triangle', 0.1, 0.15), 140);
  }

  bell() {
    this.playTone(1046.50, 'sine', 0.4, 0.2);
    setTimeout(() => this.playTone(1318.51, 'sine', 0.5, 0.15), 100);
  }

  fail() {
    this.playTone(300, 'sawtooth', 0.2, 0.3);
    setTimeout(() => this.playTone(200, 'sawtooth', 0.3, 0.3), 150);
  }

  siren() {
    // Police siren for Anti-cheat trigger!
    this.playTone(600, 'sawtooth', 0.25, 0.3);
    setTimeout(() => this.playTone(900, 'sawtooth', 0.25, 0.3), 200);
    setTimeout(() => this.playTone(600, 'sawtooth', 0.25, 0.3), 400);
    setTimeout(() => this.playTone(900, 'sawtooth', 0.25, 0.3), 600);
  }

  toggleBGM() {
    this.init();
    this.bgmEnabled = !this.bgmEnabled;
    if (this.bgmEnabled) {
      this.startLofiBGM();
    } else {
      if (this.bgmInterval) {
        clearInterval(this.bgmInterval);
        this.bgmInterval = null;
      }
    }
    return this.bgmEnabled;
  }

  startLofiBGM() {
    if (this.bgmInterval) clearInterval(this.bgmInterval);
    const melody = [
      { f: 523.25, d: 0.2 }, { f: 587.33, d: 0.2 }, { f: 659.25, d: 0.3 },
      { f: 783.99, d: 0.3 }, { f: 659.25, d: 0.2 }, { f: 523.25, d: 0.4 }
    ];
    let noteIdx = 0;
    this.bgmInterval = setInterval(() => {
      if (!this.bgmEnabled) return;
      const note = melody[noteIdx];
      this.playTone(note.f, 'triangle', note.d, 0.08, 0.005);
      noteIdx = (noteIdx + 1) % melody.length;
    }, 600);
  }
}

window.sound = new SoundManager();

// Automatically start BGM on first user interaction anywhere
['click', 'touchstart', 'pointerdown', 'keydown'].forEach(evt => {
  window.addEventListener(evt, () => {
    if (window.sound) window.sound.tryStartBGM();
  }, { passive: true });
});
