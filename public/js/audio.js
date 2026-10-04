// 8-bit & Lofi Procedural Web Audio Synthesizer (Zero external audio files needed!)
// Soft, Gentle, Headache-Free Background Music & Authentic Cafe Ambient System

const BGM_TRACKS = [
  {
    id: 'nang_som',
    name: 'Nắng Sớm Trà Quán',
    icon: '☕',
    style: 'Lofi Cafe Piano',
    tempo: 420, // ms per step (approx 72 BPM)
    filterCutoff: 650,
    steps: [
      // Measure 1: Cmaj7
      { step: 0, bass: 130.81, pad: [329.63, 392.00, 493.88], melody: 523.25 }, // C3, [E4, G4, B4], C5
      { step: 2, bass: 98.00, melody: 659.25 }, // G2, E5
      { step: 4, melody: 392.00 }, // G4
      { step: 6, melody: 493.88 }, // B4
      // Measure 2: Am7
      { step: 8, bass: 110.00, pad: [261.63, 329.63, 392.00], melody: 440.00 }, // A2, [C4, E4, G4], A4
      { step: 10, bass: 82.41, melody: 523.25 }, // E2, C5
      { step: 12, melody: 659.25 }, // E5
      { step: 14, melody: 523.25 }, // C5
      // Measure 3: Dm7
      { step: 16, bass: 146.83, pad: [349.23, 440.00, 523.25], melody: 349.23 }, // D3, [F4, A4, C5], F4
      { step: 18, bass: 110.00, melody: 440.00 }, // A2, A4
      { step: 20, melody: 587.33 }, // D5
      { step: 22, melody: 523.25 }, // C5
      // Measure 4: G7sus / G6
      { step: 24, bass: 98.00, pad: [349.23, 392.00, 493.88], melody: 587.33 }, // G2, [F4, G4, B4], D5
      { step: 26, bass: 146.83, melody: 493.88 }, // D3, B4
      { step: 28, melody: 392.00 }, // G4
      { step: 30, melody: 293.66 }  // D4
    ]
  },
  {
    id: 'mua_chieu',
    name: 'Mưa Chiều Phố Nhỏ',
    icon: '🌧️',
    style: 'Rainy Day Chill',
    tempo: 480, // ms per step (approx 62 BPM, slow & cozy)
    filterCutoff: 580,
    steps: [
      // Measure 1: Fmaj7
      { step: 0, bass: 87.31, pad: [220.00, 261.63, 329.63], melody: 523.25 }, // F2, [A3, C4, E4], C5
      { step: 2, melody: 440.00 }, // A4
      { step: 4, bass: 130.81, melody: 329.63 }, // C3, E4
      { step: 6, melody: 349.23 }, // F4
      // Measure 2: Em7
      { step: 8, bass: 82.41, pad: [196.00, 246.94, 293.66], melody: 493.88 }, // E2, [G3, B3, D4], B4
      { step: 10, melody: 392.00 }, // G4
      { step: 12, bass: 123.47, melody: 293.66 }, // B2, D4
      { step: 14, melody: 329.63 }, // E4
      // Measure 3: Dm7
      { step: 16, bass: 146.83, pad: [174.61, 220.00, 261.63], melody: 440.00 }, // D3, [F3, A3, C4], A4
      { step: 18, melody: 349.23 }, // F4
      { step: 20, bass: 110.00, melody: 523.25 }, // A2, C5
      { step: 22, melody: 587.33 }, // D5
      // Measure 4: Cmaj7
      { step: 24, bass: 130.81, pad: [164.81, 196.00, 246.94], melody: 392.00 }, // C3, [E3, G3, B3], G4
      { step: 26, melody: 329.63 }, // E4
      { step: 28, bass: 98.00, melody: 261.63 }, // G2, C4
      { step: 30, melody: 196.00 }  // G3
    ]
  },
  {
    id: 'gio_thoang',
    name: 'Gió Thoảng Vỉa Hè',
    icon: '🍃',
    style: 'Acoustic Music Box',
    tempo: 390, // ms per step (gentle breeze, music box feel)
    filterCutoff: 720,
    steps: [
      // Measure 1: Gmaj7
      { step: 0, bass: 98.00, pad: [293.66, 369.99, 493.88], melody: 587.33 }, // G2, [D4, F#4, B4], D5
      { step: 2, melody: 493.88 }, // B4
      { step: 4, melody: 392.00 }, // G4
      { step: 6, melody: 293.66 }, // D4
      // Measure 2: Em9
      { step: 8, bass: 82.41, pad: [246.94, 329.63, 392.00], melody: 659.25 }, // E2, [B3, E4, G4], E5
      { step: 10, melody: 493.88 }, // B4
      { step: 12, melody: 392.00 }, // G4
      { step: 14, melody: 369.99 }, // F#4
      // Measure 3: Cmaj7
      { step: 16, bass: 130.81, pad: [329.63, 392.00, 493.88], melody: 523.25 }, // C3, [E4, G4, B4], C5
      { step: 18, melody: 392.00 }, // G4
      { step: 20, melody: 329.63 }, // E4
      { step: 22, melody: 392.00 }, // G4
      // Measure 4: D7sus / D
      { step: 24, bass: 146.83, pad: [220.00, 293.66, 392.00], melody: 440.00 }, // D3, [A3, D4, G4], A4
      { step: 26, melody: 587.33 }, // D5
      { step: 28, melody: 523.25 }, // C5
      { step: 30, melody: 440.00 }  // A4
    ]
  },
  {
    id: 'dem_muon',
    name: 'Đêm Muộn HeeHee',
    icon: '🌙',
    style: 'Deep Chill Ambient Lofi',
    tempo: 520, // ms per step (slow, very calm & relaxing)
    filterCutoff: 520,
    steps: [
      // Measure 1: Cm9
      { step: 0, bass: 130.81, pad: [311.13, 392.00, 466.16], melody: 587.33 }, // C3, [Eb4, G4, Bb4], D5
      { step: 3, melody: 466.16 }, // Bb4
      { step: 5, bass: 98.00, melody: 392.00 }, // G2, G4
      // Measure 2: Fm7
      { step: 8, bass: 87.31, pad: [207.65, 261.63, 311.13], melody: 392.00 }, // F2, [Ab3, C4, Eb4], G4
      { step: 11, melody: 311.13 }, // Eb4
      { step: 13, bass: 130.81, melody: 261.63 }, // C3, C4
      // Measure 3: Bb7
      { step: 16, bass: 116.54, pad: [207.65, 293.66, 349.23], melody: 349.23 }, // Bb2, [Ab3, D4, F4], F4
      { step: 19, melody: 293.66 }, // D4
      { step: 21, bass: 87.31, melody: 415.30 }, // F2, Ab4
      // Measure 4: Ebmaj7
      { step: 24, bass: 77.78, pad: [196.00, 233.08, 293.66], melody: 466.16 }, // Eb2, [G3, Bb3, D4], Bb4
      { step: 27, melody: 392.00 }, // G4
      { step: 29, bass: 116.54, melody: 311.13 }  // Bb2, Eb4
    ]
  }
];

class SoundManager {
  constructor() {
    this.ctx = null;
    this.soundEnabled = true;
    this.bgmEnabled = localStorage.getItem('heehee_bgm_enabled') !== 'false'; // Default ON
    this.currentTrackIdx = parseInt(localStorage.getItem('heehee_bgm_track_idx') || '0', 10) % BGM_TRACKS.length;
    this.bgmTimer = null;
    this.currentStep = 0;
    this.trackLoops = 0;
    this.onTrackChangeCallback = null;
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

  setTrackChangeCallback(cb) {
    this.onTrackChangeCallback = cb;
  }

  getCurrentTrack() {
    return BGM_TRACKS[this.currentTrackIdx];
  }

  tryStartBGM() {
    if (!this.bgmEnabled || this.bgmTimer) return;
    this.init();
    if (this.ctx && (this.ctx.state === 'running' || this.ctx.state === 'suspended')) {
      this.ctx.resume().then(() => {
        if (!this.bgmTimer && this.bgmEnabled) {
          this.startBGM();
        }
      }).catch(() => {});
    }
  }

  // Play a soft, warm procedural note with a dedicated low-pass filter & soft envelope
  playWarmNote(freq, type = 'sine', duration = 0.5, peakVol = 0.035, filterCutoff = 650) {
    if (!this.soundEnabled || !this.bgmEnabled) return;
    this.init();
    try {
      const now = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      const filter = this.ctx.createBiquadFilter();

      // Soft low-pass filter eliminates all harshness
      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(filterCutoff, now);

      osc.type = type;
      osc.frequency.setValueAtTime(freq, now);

      // Gentle attack to avoid clicks, soft natural decay
      const attack = 0.04;
      gain.gain.setValueAtTime(0.0001, now);
      gain.gain.linearRampToValueAtTime(peakVol, now + attack);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + duration);

      osc.connect(gain);
      gain.connect(filter);
      filter.connect(this.ctx.destination);

      osc.start(now);
      osc.stop(now + duration + 0.05);
    } catch (e) {}
  }

  // Play a gentle warm chord pad in the background
  playWarmPad(notes, duration = 1.6, vol = 0.016, filterCutoff = 500) {
    if (!this.soundEnabled || !this.bgmEnabled || !Array.isArray(notes)) return;
    notes.forEach(f => {
      this.playWarmNote(f, 'sine', duration, vol, filterCutoff);
    });
  }

  // Legacy SFX Tone generator for crisp arcade interactions
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

  // --- SOUND EFFECTS ---
  coin() {
    this.playTone(987.77, 'sine', 0.08, 0.22);
    setTimeout(() => this.playTone(1318.51, 'sine', 0.2, 0.18), 80);
  }

  pour() {
    this.playTone(220, 'triangle', 0.15, 0.25);
    setTimeout(() => this.playTone(280, 'triangle', 0.15, 0.18), 60);
  }

  ice() {
    this.playTone(1200, 'sine', 0.04, 0.15);
    setTimeout(() => this.playTone(1600, 'sine', 0.04, 0.15), 50);
  }

  talk(pitch = 520) {
    this.playTone(pitch, 'triangle', 0.04, 0.12, 0.01);
  }

  shake() {
    this.playTone(150, 'sawtooth', 0.08, 0.22);
    setTimeout(() => this.playTone(120, 'sawtooth', 0.08, 0.22), 80);
  }

  seal() {
    this.playTone(440, 'sine', 0.06, 0.18);
    setTimeout(() => this.playTone(880, 'sine', 0.12, 0.2), 60);
  }

  strawPop() {
    this.playTone(800, 'sine', 0.03, 0.25);
    setTimeout(() => this.playTone(350, 'sine', 0.08, 0.18), 30);
  }

  slurp() {
    this.playTone(320, 'triangle', 0.08, 0.18);
    setTimeout(() => this.playTone(480, 'sine', 0.12, 0.2), 60);
    setTimeout(() => this.playTone(600, 'triangle', 0.1, 0.12), 140);
  }

  bell() {
    this.playTone(1046.50, 'sine', 0.35, 0.18);
    setTimeout(() => this.playTone(1318.51, 'sine', 0.45, 0.14), 100);
  }

  fail() {
    this.playTone(300, 'triangle', 0.2, 0.25);
    setTimeout(() => this.playTone(200, 'triangle', 0.3, 0.25), 150);
  }

  siren() {
    this.playTone(600, 'sawtooth', 0.25, 0.25);
    setTimeout(() => this.playTone(900, 'sawtooth', 0.25, 0.25), 200);
    setTimeout(() => this.playTone(600, 'sawtooth', 0.25, 0.25), 400);
    setTimeout(() => this.playTone(900, 'sawtooth', 0.25, 0.25), 600);
  }

  // --- BACKGROUND MUSIC CONTROLLER ---
  // Cycles through tracks: Track 0 -> Track 1 -> Track 2 -> Track 3 -> Mute -> Track 0
  cycleBGM() {
    this.init();
    if (!this.bgmEnabled) {
      // Was muted, turn on with current or first track
      this.bgmEnabled = true;
      localStorage.setItem('heehee_bgm_enabled', 'true');
      this.startBGM();
      return { enabled: true, track: BGM_TRACKS[this.currentTrackIdx] };
    } else {
      // Currently playing. If we are on the last track, next step is Mute!
      if (this.currentTrackIdx >= BGM_TRACKS.length - 1) {
        this.bgmEnabled = false;
        this.currentTrackIdx = 0;
        localStorage.setItem('heehee_bgm_enabled', 'false');
        localStorage.setItem('heehee_bgm_track_idx', '0');
        this.stopBGM();
        return { enabled: false, track: null };
      } else {
        // Switch to next peaceful track
        this.currentTrackIdx = (this.currentTrackIdx + 1) % BGM_TRACKS.length;
        localStorage.setItem('heehee_bgm_track_idx', this.currentTrackIdx.toString());
        this.startBGM();
        return { enabled: true, track: BGM_TRACKS[this.currentTrackIdx] };
      }
    }
  }

  // Direct toggle on/off
  toggleBGM() {
    return this.cycleBGM();
  }

  selectTrack(index) {
    if (index >= 0 && index < BGM_TRACKS.length) {
      this.currentTrackIdx = index;
      localStorage.setItem('heehee_bgm_track_idx', this.currentTrackIdx.toString());
      this.bgmEnabled = true;
      localStorage.setItem('heehee_bgm_enabled', 'true');
      this.startBGM();
      return BGM_TRACKS[this.currentTrackIdx];
    }
    return null;
  }

  stopBGM() {
    if (this.bgmTimer) {
      clearInterval(this.bgmTimer);
      this.bgmTimer = null;
    }
    this.currentStep = 0;
  }

  startBGM() {
    this.stopBGM();
    if (!this.bgmEnabled) return;
    this.init();

    const track = BGM_TRACKS[this.currentTrackIdx];
    this.currentStep = 0;
    this.trackLoops = 0;

    if (typeof this.onTrackChangeCallback === 'function') {
      this.onTrackChangeCallback(track);
    }

    const stepInterval = track.tempo || 420;

    this.bgmTimer = setInterval(() => {
      if (!this.bgmEnabled) {
        this.stopBGM();
        return;
      }

      // Check for note events at this step
      const stepEvents = track.steps.filter(s => s.step === this.currentStep);
      stepEvents.forEach(evt => {
        // 1. Play warm sub-bass note (gentle sine, below 200Hz)
        if (evt.bass) {
          this.playWarmNote(evt.bass, 'sine', (stepInterval * 2) / 1000, 0.026, 350);
        }
        // 2. Play warm harmonic chord pad
        if (evt.pad && evt.pad.length > 0) {
          this.playWarmPad(evt.pad, (stepInterval * 4) / 1000, 0.016, track.filterCutoff - 100);
        }
        // 3. Play gentle melody note (soft sine or warm triangle)
        if (evt.melody) {
          this.playWarmNote(evt.melody, 'triangle', (stepInterval * 1.5) / 1000, 0.028, track.filterCutoff);
        }
      });

      this.currentStep++;

      // When the 32-step cycle completes (4 measures)
      if (this.currentStep >= 32) {
        this.currentStep = 0;
        this.trackLoops++;

        // After 2 peaceful loops (~30-40 seconds of cozy music), smoothly auto-cycle to the next track in the playlist!
        if (this.trackLoops >= 2) {
          this.trackLoops = 0;
          this.currentTrackIdx = (this.currentTrackIdx + 1) % BGM_TRACKS.length;
          localStorage.setItem('heehee_bgm_track_idx', this.currentTrackIdx.toString());
          this.startBGM(); // Seamlessly starts the next track
        }
      }
    }, stepInterval);
  }
}

window.sound = new SoundManager();

// Automatically start gentle BGM on first user interaction anywhere
['click', 'touchstart', 'pointerdown', 'keydown'].forEach(evt => {
  window.addEventListener(evt, () => {
    if (window.sound) window.sound.tryStartBGM();
  }, { passive: true, once: true });
});
