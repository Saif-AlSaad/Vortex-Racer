/** Procedural Audio and Synthwave Music Engine for Vortex Racer */
export class SoundKit {
  private ctx: AudioContext | null = null;
  private master: GainNode | null = null;
  private musicGain: GainNode | null = null;
  private sfxGain: GainNode | null = null;
  private noiseBuf: AudioBuffer | null = null;
  private engineOsc: OscillatorNode | null = null;
  private engineGain: GainNode | null = null;

  // Music Sequencer State
  private musicPlaying = false;
  private musicStep = 0;
  private bpm = 124;
  private nextNoteTime = 0;
  private schedulerInterval: number | null = null;
  private speedNorm = 0;
  private isBoosting = false;

  muted = false;

  ensure() {
    if (!this.ctx) {
      const AC = window.AudioContext || (window as any).webkitAudioContext;
      if (!AC) return;
      this.ctx = new AC();

      // Master output
      this.master = this.ctx.createGain();
      this.master.gain.value = this.muted ? 0 : 0.35;
      this.master.connect(this.ctx.destination);

      // Separate sub-mixers
      this.musicGain = this.ctx.createGain();
      this.musicGain.gain.value = 0.4;
      this.musicGain.connect(this.master);

      this.sfxGain = this.ctx.createGain();
      this.sfxGain.gain.value = 0.7;
      this.sfxGain.connect(this.master);

      // Procedural Noise Buffer
      const len = this.ctx.sampleRate * 1.5;
      this.noiseBuf = this.ctx.createBuffer(1, len, this.ctx.sampleRate);
      const data = this.noiseBuf.getChannelData(0);
      for (let i = 0; i < len; i++) data[i] = Math.random() * 2 - 1;

      // Engine Hum Oscillator
      this.engineOsc = this.ctx.createOscillator();
      this.engineOsc.type = "sawtooth";
      this.engineOsc.frequency.value = 40;
      this.engineGain = this.ctx.createGain();
      this.engineGain.gain.value = 0;
      this.engineOsc.connect(this.engineGain);
      this.engineGain.connect(this.sfxGain);
      this.engineOsc.start();
    }
    if (this.ctx.state === "suspended") {
      void this.ctx.resume();
    }
  }

  handleVisibilityChange(visible: boolean) {
    if (!this.ctx) return;
    if (visible && this.ctx.state === "suspended" && !this.muted) {
      void this.ctx.resume();
    } else if (!visible && this.ctx.state === "running") {
      void this.ctx.suspend();
    }
  }

  setMuted(m: boolean) {
    this.muted = m;
    if (this.master && this.ctx) {
      this.master.gain.setTargetAtTime(m ? 0 : 0.35, this.ctx.currentTime, 0.05);
    }
  }

  setEngineSpeed(normalizedSpeed: number, isBoosting = false) {
    this.speedNorm = normalizedSpeed;
    this.isBoosting = isBoosting;
    if (!this.engineOsc || !this.engineGain || !this.ctx || this.muted) return;
    const baseFreq = isBoosting ? 90 : 40;
    const freq = baseFreq + normalizedSpeed * (isBoosting ? 120 : 65);
    this.engineOsc.frequency.setTargetAtTime(freq, this.ctx.currentTime, 0.1);
    this.engineGain.gain.setTargetAtTime(0.12 + normalizedSpeed * 0.1, this.ctx.currentTime, 0.1);

    // Accelerate synthwave music tempo smoothly with speed
    this.bpm = 122 + Math.min(36, normalizedSpeed * 35) + (isBoosting ? 12 : 0);
  }

  stopEngine() {
    if (!this.engineGain || !this.ctx) return;
    this.engineGain.gain.setTargetAtTime(0, this.ctx.currentTime, 0.1);
  }

  // ---- PROCEDURAL SYNTHWAVE MUSIC ENGINE ----

  startMusic() {
    this.ensure();
    if (this.musicPlaying || !this.ctx) return;
    this.musicPlaying = true;
    this.musicStep = 0;
    this.nextNoteTime = this.ctx.currentTime + 0.05;

    if (this.schedulerInterval !== null) {
      window.clearInterval(this.schedulerInterval);
    }

    this.schedulerInterval = window.setInterval(() => {
      this.scheduleMusicLookahead();
    }, 30);
  }

  stopMusic() {
    this.musicPlaying = false;
    if (this.schedulerInterval !== null) {
      window.clearInterval(this.schedulerInterval);
      this.schedulerInterval = null;
    }
  }

  private scheduleMusicLookahead() {
    if (!this.ctx || !this.musicPlaying) return;
    const lookAheadTime = 0.12;

    while (this.nextNoteTime < this.ctx.currentTime + lookAheadTime) {
      this.playSequencerStep(this.musicStep, this.nextNoteTime);
      const secondsPerBeat = 60 / this.bpm;
      const secondsPer16th = secondsPerBeat / 4;
      this.nextNoteTime += secondsPer16th;
      this.musicStep = (this.musicStep + 1) % 32;
    }
  }

  private playSequencerStep(step: number, time: number) {
    if (!this.ctx || !this.musicGain || this.muted) return;

    // 1. Synthwave Drums
    // Four-on-the-floor kick
    if (step % 4 === 0) {
      this.synthKick(time);
    }
    // Snare / Clap on 2 and 4 (steps 4, 12, 20, 28)
    if (step % 8 === 4) {
      this.synthSnare(time);
    }
    // 16th-note Hi-hats with accent
    if (step % 2 === 1) {
      const isAccent = step % 4 === 2;
      this.synthHiHat(time, isAccent);
    }

    // 2. 80s Synth Bassline (D minor -> Bb -> F -> C progression)
    // 32-step loop: 8 steps per chord
    const chordIndex = Math.floor(step / 8);
    const stepInChord = step % 8;

    const bassRoots = [
      [73.42, 146.83, 73.42, 146.83, 87.31, 146.83, 110.0, 146.83], // Dm (D2 / D3 / F2 / A2)
      [58.27, 116.54, 58.27, 116.54, 73.42, 116.54, 87.31, 116.54], // Bb (Bb1 / Bb2 / D2 / F2)
      [87.31, 174.61, 87.31, 174.61, 110.0, 174.61, 130.81, 174.61], // F (F2 / F3 / A2 / C3)
      [65.41, 130.81, 65.41, 130.81, 82.41, 130.81, 98.0, 130.81],   // C (C2 / C3 / E2 / G2)
    ];

    const freq = bassRoots[chordIndex][stepInChord];
    this.synthBassNote(time, freq);

    // 3. Synthwave Pad Stabs on chord transitions (step 0, 8, 16, 24)
    if (stepInChord === 0) {
      const chords = [
        [220.0, 261.63, 329.63], // Am/Dm flavor (A3, C4, E4)
        [233.08, 293.66, 349.23], // Bb major (Bb3, D4, F4)
        [174.61, 220.0, 261.63],  // F major (F3, A3, C4)
        [196.0, 246.94, 293.66],  // C major (G3, B3, D4)
      ];
      this.synthPadChords(time, chords[chordIndex]);
    }
  }

  private synthKick(t: number) {
    if (!this.ctx || !this.musicGain) return;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = "sine";
    osc.frequency.setValueAtTime(130, t);
    osc.frequency.exponentialRampToValueAtTime(36, t + 0.09);

    gain.gain.setValueAtTime(0.7, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.22);

    osc.connect(gain);
    gain.connect(this.musicGain);
    osc.start(t);
    osc.stop(t + 0.25);
  }

  private synthSnare(t: number) {
    if (!this.ctx || !this.musicGain || !this.noiseBuf) return;
    // Noise component
    const noise = this.ctx.createBufferSource();
    noise.buffer = this.noiseBuf;
    const filter = this.ctx.createBiquadFilter();
    filter.type = "bandpass";
    filter.frequency.setValueAtTime(1400, t);
    filter.Q.value = 1.2;

    const noiseGain = this.ctx.createGain();
    noiseGain.gain.setValueAtTime(0.4, t);
    noiseGain.gain.exponentialRampToValueAtTime(0.001, t + 0.16);

    noise.connect(filter);
    filter.connect(noiseGain);
    noiseGain.connect(this.musicGain);

    // Tone body
    const osc = this.ctx.createOscillator();
    const toneGain = this.ctx.createGain();
    osc.type = "triangle";
    osc.frequency.setValueAtTime(180, t);
    osc.frequency.exponentialRampToValueAtTime(80, t + 0.08);

    toneGain.gain.setValueAtTime(0.35, t);
    toneGain.gain.exponentialRampToValueAtTime(0.001, t + 0.08);

    osc.connect(toneGain);
    toneGain.connect(this.musicGain);

    noise.start(t);
    noise.stop(t + 0.18);
    osc.start(t);
    osc.stop(t + 0.1);
  }

  private synthHiHat(t: number, isAccent: boolean) {
    if (!this.ctx || !this.musicGain || !this.noiseBuf) return;
    const noise = this.ctx.createBufferSource();
    noise.buffer = this.noiseBuf;

    const filter = this.ctx.createBiquadFilter();
    filter.type = "highpass";
    filter.frequency.setValueAtTime(7500, t);

    const gain = this.ctx.createGain();
    const vol = isAccent ? 0.22 : 0.12;
    const dur = isAccent ? 0.08 : 0.04;
    gain.gain.setValueAtTime(vol, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + dur);

    noise.connect(filter);
    filter.connect(gain);
    gain.connect(this.musicGain);

    noise.start(t);
    noise.stop(t + dur + 0.01);
  }

  private synthBassNote(t: number, freq: number) {
    if (!this.ctx || !this.musicGain) return;
    const osc = this.ctx.createOscillator();
    const filter = this.ctx.createBiquadFilter();
    const gain = this.ctx.createGain();

    osc.type = "sawtooth";
    osc.frequency.setValueAtTime(freq, t);

    filter.type = "lowpass";
    filter.Q.value = 3.5;
    // Brighten cutoff filter with game speed and boost
    const baseCutoff = 800 + this.speedNorm * 1200 + (this.isBoosting ? 800 : 0);
    filter.frequency.setValueAtTime(baseCutoff, t);
    filter.frequency.exponentialRampToValueAtTime(baseCutoff * 0.28, t + 0.12);

    gain.gain.setValueAtTime(0.28, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.14);

    osc.connect(filter);
    filter.connect(gain);
    gain.connect(this.musicGain);

    osc.start(t);
    osc.stop(t + 0.15);
  }

  private synthPadChords(t: number, freqs: number[]) {
    if (!this.ctx || !this.musicGain) return;
    freqs.forEach((freq) => {
      const osc = this.ctx!.createOscillator();
      const gain = this.ctx!.createGain();
      const filter = this.ctx!.createBiquadFilter();

      osc.type = "sawtooth";
      osc.frequency.setValueAtTime(freq, t);

      filter.type = "lowpass";
      filter.frequency.setValueAtTime(1100, t);

      gain.gain.setValueAtTime(0, t);
      gain.gain.linearRampToValueAtTime(0.06, t + 0.3);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 1.6);

      osc.connect(filter);
      filter.connect(gain);
      gain.connect(this.musicGain!);

      osc.start(t);
      osc.stop(t + 1.7);
    });
  }

  // ---- SOUND EFFECTS ----

  private playTone(type: OscillatorType, f0: number, f1: number, dur: number, vol = 1) {
    if (!this.ctx || !this.sfxGain || this.muted) return;
    const t0 = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const g = this.ctx.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(f0, t0);
    osc.frequency.exponentialRampToValueAtTime(f1, t0 + dur);
    g.gain.setValueAtTime(0, t0);
    g.gain.linearRampToValueAtTime(vol, t0 + dur * 0.1);
    g.gain.exponentialRampToValueAtTime(0.001, t0 + dur);
    osc.connect(g);
    g.connect(this.sfxGain);
    osc.start(t0);
    osc.stop(t0 + dur);
  }

  private playNoise(dur: number, freq: number, vol: number) {
    if (!this.ctx || !this.sfxGain || !this.noiseBuf || this.muted) return;
    const t0 = this.ctx.currentTime;
    const src = this.ctx.createBufferSource();
    src.buffer = this.noiseBuf;
    const filter = this.ctx.createBiquadFilter();
    filter.type = "lowpass";
    filter.frequency.value = freq;
    const g = this.ctx.createGain();
    g.gain.setValueAtTime(vol, t0);
    g.gain.exponentialRampToValueAtTime(0.001, t0 + dur);
    src.connect(filter);
    filter.connect(g);
    g.connect(this.sfxGain);
    src.start(t0);
    src.stop(t0 + dur);
  }

  collect(combo = 1) {
    if (!this.ctx) return;
    // Ascending chime pitch scaled with combo tier
    const pitchMultiplier = 1 + (combo - 1) * 0.12;
    const f0 = 880 * pitchMultiplier;
    const f1 = 1760 * pitchMultiplier;
    this.playTone("sine", f0, f1, 0.15, 0.45);
    setTimeout(() => {
      this.playTone("sine", f0 * 1.25, f1 * 1.25, 0.2, 0.35);
    }, 45);
  }

  powerupShield() {
    this.playTone("sine", 520, 1040, 0.2, 0.45);
    setTimeout(() => this.playTone("triangle", 1040, 2080, 0.25, 0.4), 60);
  }

  powerupMagnet() {
    this.playTone("triangle", 440, 880, 0.2, 0.4);
    setTimeout(() => this.playTone("sine", 660, 1320, 0.22, 0.4), 80);
  }

  powerupBoost() {
    this.playNoise(0.5, 1200, 0.6);
    this.playTone("sawtooth", 140, 480, 0.4, 0.5);
  }

  shieldBreak() {
    // Heavy glass shatter and protective thud
    this.playNoise(0.5, 2200, 0.75);
    this.playTone("triangle", 360, 90, 0.4, 0.6);
  }

  ramObstacle() {
    // Firework smash when boosting through wall
    this.playNoise(0.4, 900, 0.7);
    this.playTone("square", 220, 70, 0.25, 0.4);
  }

  crash() {
    this.stopEngine();
    this.stopMusic();
    this.playNoise(0.8, 800, 0.85);
    this.playTone("sawtooth", 120, 40, 0.6, 0.55);
  }

  uiHover() {
    this.playTone("square", 440, 440, 0.05, 0.1);
  }

  uiClick() {
    this.playTone("square", 880, 1200, 0.1, 0.15);
  }

  dispose() {
    this.stopMusic();
    if (this.ctx) void this.ctx.close();
    this.ctx = null;
    this.master = null;
    this.musicGain = null;
    this.sfxGain = null;
    this.noiseBuf = null;
  }
}
