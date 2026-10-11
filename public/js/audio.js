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
  },
  {
    id: 'dai_chien_hung_ram',
    name: 'Đại Chiến Hưng Răm',
    icon: '🐙',
    style: 'Chiptune Boss Battle 8-Bit',
    tempo: 160, // fast, energetic boss battle
    filterCutoff: 1200,
    steps: [
      // Measure 1: Dm
      { step: 0, bass: 146.83, pad: [293.66, 349.23, 440.00], melody: 587.33 },
      { step: 2, melody: 698.46 },
      { step: 4, bass: 146.83, melody: 880.00 },
      { step: 6, melody: 698.46 },
      // Measure 2: Bb
      { step: 8, bass: 116.54, pad: [233.08, 293.66, 349.23], melody: 783.99 },
      { step: 10, melody: 698.46 },
      { step: 12, bass: 116.54, melody: 587.33 },
      { step: 14, melody: 466.16 },
      // Measure 3: C
      { step: 16, bass: 130.81, pad: [261.63, 329.63, 392.00], melody: 523.25 },
      { step: 18, melody: 659.25 },
      { step: 20, bass: 130.81, melody: 783.99 },
      { step: 22, melody: 659.25 },
      // Measure 4: A7
      { step: 24, bass: 110.00, pad: [277.18, 329.63, 440.00], melody: 880.00 },
      { step: 26, melody: 830.61 },
      { step: 28, bass: 110.00, melody: 783.99 },
      { step: 30, melody: 698.46 }
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

  // --- BARISTA WORKSTATION ASMR SOUND EFFECTS (ROADMAP SECTION V) ---

  // Gắp đá vào bình shaker: Tiếng kim loại lanh lảnh clink-clack (tần số cao 3.2 kHz)
  ice() {
    if (!this.soundEnabled) return;
    this.init();
    try {
      const now = this.ctx.currentTime;
      // 1. First high-frequency metallic ping (3200 Hz)
      const osc1 = this.ctx.createOscillator();
      const gain1 = this.ctx.createGain();
      const filter1 = this.ctx.createBiquadFilter();
      filter1.type = 'bandpass';
      filter1.frequency.setValueAtTime(3200, now);
      filter1.Q.setValueAtTime(3.8, now);

      osc1.type = 'sine';
      osc1.frequency.setValueAtTime(3200, now);
      osc1.frequency.exponentialRampToValueAtTime(2950, now + 0.08);

      gain1.gain.setValueAtTime(0.24, now);
      gain1.gain.exponentialRampToValueAtTime(0.001, now + 0.08);

      osc1.connect(filter1);
      filter1.connect(gain1);
      gain1.connect(this.ctx.destination);
      osc1.start(now);
      osc1.stop(now + 0.09);

      // 2. Second bouncing ice clack rebound at 2650 Hz
      setTimeout(() => {
        try {
          const now2 = this.ctx.currentTime;
          const osc2 = this.ctx.createOscillator();
          const gain2 = this.ctx.createGain();
          osc2.type = 'triangle';
          osc2.frequency.setValueAtTime(2650, now2);
          gain2.gain.setValueAtTime(0.18, now2);
          gain2.gain.exponentialRampToValueAtTime(0.001, now2 + 0.06);
          osc2.connect(gain2);
          gain2.connect(this.ctx.destination);
          osc2.start(now2);
          osc2.stop(now2 + 0.07);
        } catch(e) {}
      }, 45);
    } catch (e) {}
  }

  // Bơm siro đường: Tiếng nén pít-tông dính dớp squish-pump
  syrupPump() {
    if (!this.soundEnabled) return;
    this.init();
    try {
      const now = this.ctx.currentTime;
      // 1. Mechanical spring click
      const clickOsc = this.ctx.createOscillator();
      const clickGain = this.ctx.createGain();
      clickOsc.type = 'triangle';
      clickOsc.frequency.setValueAtTime(1400, now);
      clickGain.gain.setValueAtTime(0.12, now);
      clickGain.gain.exponentialRampToValueAtTime(0.001, now + 0.03);
      clickOsc.connect(clickGain);
      clickGain.connect(this.ctx.destination);
      clickOsc.start(now);
      clickOsc.stop(now + 0.035);

      // 2. Viscous squish-pump suction glide (220Hz -> 85Hz)
      const squishOsc = this.ctx.createOscillator();
      const squishGain = this.ctx.createGain();
      const squishFilter = this.ctx.createBiquadFilter();
      squishFilter.type = 'lowpass';
      squishFilter.frequency.setValueAtTime(450, now);
      squishFilter.frequency.exponentialRampToValueAtTime(120, now + 0.14);

      squishOsc.type = 'sawtooth';
      squishOsc.frequency.setValueAtTime(220, now);
      squishOsc.frequency.exponentialRampToValueAtTime(85, now + 0.14);

      squishGain.gain.setValueAtTime(0.18, now);
      squishGain.gain.exponentialRampToValueAtTime(0.001, now + 0.14);

      squishOsc.connect(squishFilter);
      squishFilter.connect(squishGain);
      squishGain.connect(this.ctx.destination);
      squishOsc.start(now);
      squishOsc.stop(now + 0.15);
    } catch (e) {}
  }
  squishPump() { this.syrupPump(); }

  // Lắc bình Shaker: Tiếng đá va đập mạnh trong chất lỏng chuka-chuka
  shake() {
    if (!this.soundEnabled) return;
    this.init();
    try {
      const now = this.ctx.currentTime;
      // Triple rhythmic shaker stroke (forward-backward-impact)
      const playStroke = (time, baseFreq, vol) => {
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        const filter = this.ctx.createBiquadFilter();
        filter.type = 'bandpass';
        filter.frequency.setValueAtTime(baseFreq, time);
        filter.Q.setValueAtTime(2.2, time);

        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(baseFreq * 0.45, time);
        osc.frequency.exponentialRampToValueAtTime(110, time + 0.08);

        gain.gain.setValueAtTime(vol, time);
        gain.gain.exponentialRampToValueAtTime(0.001, time + 0.08);

        osc.connect(filter);
        filter.connect(gain);
        gain.connect(this.ctx.destination);
        osc.start(time);
        osc.stop(time + 0.09);

        // Resonant ice slosh ping
        const icePing = this.ctx.createOscillator();
        const iceGain = this.ctx.createGain();
        icePing.type = 'triangle';
        icePing.frequency.setValueAtTime(baseFreq * 1.8, time);
        iceGain.gain.setValueAtTime(vol * 0.55, time);
        iceGain.gain.exponentialRampToValueAtTime(0.001, time + 0.05);
        icePing.connect(iceGain);
        iceGain.connect(this.ctx.destination);
        icePing.start(time);
        icePing.stop(time + 0.06);
      };

      playStroke(now, 850, 0.22);
      playStroke(now + 0.07, 1050, 0.20);
      playStroke(now + 0.14, 780, 0.16);
    } catch (e) {}
  }

  // Rót trà vào cốc: Dòng trà tuôn trào sóng sánh glug-glug
  pour() {
    if (!this.soundEnabled) return;
    this.init();
    try {
      const now = this.ctx.currentTime;
      const playGlug = (time, startFreq, endFreq, vol, dur) => {
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(startFreq, time);
        osc.frequency.exponentialRampToValueAtTime(endFreq, time + dur);

        gain.gain.setValueAtTime(0.001, time);
        gain.gain.linearRampToValueAtTime(vol, time + 0.015);
        gain.gain.exponentialRampToValueAtTime(0.001, time + dur);

        osc.connect(gain);
        gain.connect(this.ctx.destination);
        osc.start(time);
        osc.stop(time + dur + 0.01);
      };

      playGlug(now, 260, 420, 0.20, 0.12);
      playGlug(now + 0.06, 320, 540, 0.18, 0.13);
      playGlug(now + 0.13, 380, 680, 0.15, 0.14);
    } catch (e) {}
  }

  // Dập nắp niêm phong: Cần gạt dập dứt khoát chunk-click!
  seal() {
    if (!this.soundEnabled) return;
    this.init();
    try {
      const now = this.ctx.currentTime;
      // 1. Heavy mechanical chunk (impact 160Hz -> 55Hz)
      const chunkOsc = this.ctx.createOscillator();
      const chunkGain = this.ctx.createGain();
      const chunkFilter = this.ctx.createBiquadFilter();
      chunkFilter.type = 'lowpass';
      chunkFilter.frequency.setValueAtTime(350, now);

      chunkOsc.type = 'triangle';
      chunkOsc.frequency.setValueAtTime(160, now);
      chunkOsc.frequency.exponentialRampToValueAtTime(55, now + 0.09);

      chunkGain.gain.setValueAtTime(0.28, now);
      chunkGain.gain.exponentialRampToValueAtTime(0.001, now + 0.09);

      chunkOsc.connect(chunkFilter);
      chunkFilter.connect(chunkGain);
      chunkGain.connect(this.ctx.destination);
      chunkOsc.start(now);
      chunkOsc.stop(now + 0.10);

      // 2. High-pitch heat-lock click at +70ms (1850Hz latch snap)
      setTimeout(() => {
        try {
          const now2 = this.ctx.currentTime;
          const clickOsc = this.ctx.createOscillator();
          const clickGain = this.ctx.createGain();
          clickOsc.type = 'sine';
          clickOsc.frequency.setValueAtTime(1850, now2);
          clickOsc.frequency.exponentialRampToValueAtTime(1100, now2 + 0.08);

          clickGain.gain.setValueAtTime(0.22, now2);
          clickGain.gain.exponentialRampToValueAtTime(0.001, now2 + 0.08);

          clickOsc.connect(clickGain);
          clickGain.connect(this.ctx.destination);
          clickOsc.start(now2);
          clickOsc.stop(now2 + 0.09);
        } catch(e) {}
      }, 70);
    } catch (e) {}
  }

  // Khò lửa Brûlée: Ngọn lửa xanh quét mặt kem và caramen nổ lách tách sizzle-crackle
  torchFlame() {
    if (!this.soundEnabled) return;
    this.init();
    try {
      const now = this.ctx.currentTime;
      // 1. Gas blowtorch jet whoosh
      const jetOsc = this.ctx.createOscillator();
      const jetGain = this.ctx.createGain();
      const jetFilter = this.ctx.createBiquadFilter();
      jetFilter.type = 'bandpass';
      jetFilter.frequency.setValueAtTime(1800, now);
      jetFilter.Q.setValueAtTime(1.8, now);

      jetOsc.type = 'sawtooth';
      jetOsc.frequency.setValueAtTime(320, now);

      jetGain.gain.setValueAtTime(0.18, now);
      jetGain.gain.linearRampToValueAtTime(0.22, now + 0.1);
      jetGain.gain.exponentialRampToValueAtTime(0.001, now + 0.35);

      jetOsc.connect(jetFilter);
      jetFilter.connect(jetGain);
      jetGain.connect(this.ctx.destination);
      jetOsc.start(now);
      jetOsc.stop(now + 0.36);

      // 2. Caramel crackle sizzle bursts
      [0.05, 0.12, 0.19, 0.26].forEach((offset, idx) => {
        setTimeout(() => {
          try {
            const nowC = this.ctx.currentTime;
            const popOsc = this.ctx.createOscillator();
            const popGain = this.ctx.createGain();
            popOsc.type = 'triangle';
            popOsc.frequency.setValueAtTime(2400 + idx * 300, nowC);
            popGain.gain.setValueAtTime(0.12, nowC);
            popGain.gain.exponentialRampToValueAtTime(0.001, nowC + 0.04);
            popOsc.connect(popGain);
            popGain.connect(this.ctx.destination);
            popOsc.start(nowC);
            popOsc.stop(nowC + 0.045);
          } catch(e) {}
        }, offset * 1000);
      });
    } catch (e) {}
  }
  bruleeSizzle() { this.torchFlame(); }

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

  // Tiếng búa gõ sàn đấu giá (Gavel knock)
  gavel() {
    if (!this.soundEnabled) return;
    this.init();
    try {
      const now = this.ctx.currentTime;
      // Sharp wooden impact
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      const filter = this.ctx.createBiquadFilter();

      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(450, now);
      filter.frequency.exponentialRampToValueAtTime(80, now + 0.15);

      osc.type = 'triangle';
      osc.frequency.setValueAtTime(180, now);
      osc.frequency.exponentialRampToValueAtTime(50, now + 0.15);

      gain.gain.setValueAtTime(0.35, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.15);

      osc.connect(filter);
      filter.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start(now);
      osc.stop(now + 0.16);

      // Second crisp knock rebound
      setTimeout(() => {
        this.playTone(160, 'triangle', 0.12, 0.25, 0.01);
      }, 120);
    } catch (e) {}
  }

  // Tiếng giọt nước suối tưới đồi chè
  waterDrop() {
    if (!this.soundEnabled) return;
    this.init();
    try {
      const now = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(700, now);
      osc.frequency.exponentialRampToValueAtTime(1760, now + 0.08);

      gain.gain.setValueAtTime(0.01, now);
      gain.gain.linearRampToValueAtTime(0.2, now + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.12);

      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start(now);
      osc.stop(now + 0.13);
    } catch (e) {}
  }

  // Tiếng hái búp chè tươi giòn tan (Bright crisp chime)
  harvest() {
    this.playTone(1046.5, 'sine', 0.06, 0.2); // C6
    setTimeout(() => this.playTone(1318.5, 'sine', 0.08, 0.22), 50); // E6
    setTimeout(() => this.playTone(1567.98, 'sine', 0.15, 0.25), 110); // G6
  }

  // Tiếng xưởng chế biến thủ công (Craft chime)
  craft() {
    this.playTone(523.25, 'triangle', 0.08, 0.18);
    setTimeout(() => this.playTone(659.25, 'sine', 0.08, 0.2), 60);
    setTimeout(() => this.playTone(783.99, 'triangle', 0.1, 0.22), 120);
    setTimeout(() => this.playTone(1046.5, 'sine', 0.2, 0.25), 180);
  }

  // Realistic Procedural Thunder Clap & Rumble for Stormy Weather
  thunder() {
    if (!this.soundEnabled) return;
    this.init();
    try {
      const now = this.ctx.currentTime;
      // 1. Initial sharp crack / lightning strike
      const strikeOsc = this.ctx.createOscillator();
      const strikeGain = this.ctx.createGain();
      const strikeFilter = this.ctx.createBiquadFilter();
      strikeFilter.type = 'bandpass';
      strikeFilter.frequency.setValueAtTime(800, now);
      strikeFilter.Q.setValueAtTime(1.5, now);

      strikeOsc.type = 'sawtooth';
      strikeOsc.frequency.setValueAtTime(160, now);
      strikeOsc.frequency.exponentialRampToValueAtTime(40, now + 0.35);

      strikeGain.gain.setValueAtTime(0.4, now);
      strikeGain.gain.exponentialRampToValueAtTime(0.001, now + 0.35);

      strikeOsc.connect(strikeFilter);
      strikeFilter.connect(strikeGain);
      strikeGain.connect(this.ctx.destination);
      strikeOsc.start(now);
      strikeOsc.stop(now + 0.35);

      // 2. Heavy bass rolling thunder rumble
      const rumbleOsc = this.ctx.createOscillator();
      const rumbleGain = this.ctx.createGain();
      const rumbleFilter = this.ctx.createBiquadFilter();
      rumbleFilter.type = 'lowpass';
      rumbleFilter.frequency.setValueAtTime(260, now);
      rumbleFilter.frequency.exponentialRampToValueAtTime(45, now + 1.8);

      rumbleOsc.type = 'sawtooth';
      rumbleOsc.frequency.setValueAtTime(75, now);
      rumbleOsc.frequency.linearRampToValueAtTime(32, now + 1.8);

      rumbleGain.gain.setValueAtTime(0.01, now);
      rumbleGain.gain.linearRampToValueAtTime(0.35, now + 0.08);
      rumbleGain.gain.exponentialRampToValueAtTime(0.001, now + 1.8);

      rumbleOsc.connect(rumbleFilter);
      rumbleFilter.connect(rumbleGain);
      rumbleGain.connect(this.ctx.destination);
      rumbleOsc.start(now);
      rumbleOsc.stop(now + 1.8);
    } catch (e) {}
  }

  // --- COFFEE & WORLD BOSS SFX ---
  bossPew(type = 'basic') {
    this.init();
    if (!this.ctx) return;
    try {
      const now = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = type === 'cosmic' ? 'sawtooth' : type === 'flame' ? 'square' : 'triangle';
      const startFreq = type === 'cosmic' ? 880 : type === 'golden' ? 740 : 520;
      const endFreq = type === 'cosmic' ? 220 : 180;
      osc.frequency.setValueAtTime(startFreq, now);
      osc.frequency.exponentialRampToValueAtTime(endFreq, now + 0.12);
      gain.gain.setValueAtTime(0.18, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.12);
      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start(now);
      osc.stop(now + 0.12);
    } catch (e) {}
  }

  bossHit() {
    this.init();
    if (!this.ctx) return;
    try {
      const now = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(140, now);
      osc.frequency.exponentialRampToValueAtTime(40, now + 0.15);
      gain.gain.setValueAtTime(0.25, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.15);
      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start(now);
      osc.stop(now + 0.15);
    } catch (e) {}
  }

  bossCrit() {
    this.init();
    if (!this.ctx) return;
    try {
      const now = this.ctx.currentTime;
      [880, 1174, 1760].forEach((freq, idx) => {
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(freq, now + idx * 0.04);
        gain.gain.setValueAtTime(0.12, now + idx * 0.04);
        gain.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.04 + 0.2);
        osc.connect(gain);
        gain.connect(this.ctx.destination);
        osc.start(now + idx * 0.04);
        osc.stop(now + idx * 0.04 + 0.2);
      });
    } catch (e) {}
  }

  bossCosmic() {
    this.init();
    if (!this.ctx) return;
    try {
      const now = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(320, now);
      osc.frequency.linearRampToValueAtTime(70, now + 0.4);
      gain.gain.setValueAtTime(0.3, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.4);
      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start(now);
      osc.stop(now + 0.4);
    } catch (e) {}
  }

  coffeeDrink() {
    this.init();
    if (!this.ctx) return;
    try {
      const now = this.ctx.currentTime;
      [523.25, 659.25, 783.99, 1046.50].forEach((f, i) => {
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(f, now + i * 0.08);
        gain.gain.setValueAtTime(0.12, now + i * 0.08);
        gain.gain.exponentialRampToValueAtTime(0.001, now + i * 0.08 + 0.35);
        osc.connect(gain);
        gain.connect(this.ctx.destination);
        osc.start(now + i * 0.08);
        osc.stop(now + i * 0.08 + 0.35);
      });
    } catch (e) {}
  }

  bossWarning() {
    this.siren();
  }

  bossVictory() {
    this.init();
    if (!this.ctx) return;
    try {
      const now = this.ctx.currentTime;
      [523.25, 659.25, 783.99, 1046.50, 1318.51].forEach((freq, idx) => {
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(freq, now + idx * 0.1);
        gain.gain.setValueAtTime(0.18, now + idx * 0.1);
        gain.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.1 + 0.4);
        osc.connect(gain);
        gain.connect(this.ctx.destination);
        osc.start(now + idx * 0.1);
        osc.stop(now + idx * 0.1 + 0.4);
      });
    } catch (e) {}
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

  playBossBGM() {
    this.savedTrackIdx = this.currentTrackIdx;
    const bossTrackIdx = BGM_TRACKS.findIndex(t => t.id === 'dai_chien_hung_ram');
    if (bossTrackIdx !== -1) {
      this.currentTrackIdx = bossTrackIdx;
      this.bgmEnabled = true;
      this.startBGM();
    }
  }

  restorePreviousBGM() {
    if (this.savedTrackIdx !== undefined && this.savedTrackIdx !== -1) {
      this.currentTrackIdx = this.savedTrackIdx;
      this.startBGM();
    }
  }
}

window.sound = new SoundManager();

// Automatically start gentle BGM on first user interaction anywhere
['click', 'touchstart', 'pointerdown', 'keydown'].forEach(evt => {
  window.addEventListener(evt, () => {
    if (window.sound) window.sound.tryStartBGM();
  }, { passive: true, once: true });
});
