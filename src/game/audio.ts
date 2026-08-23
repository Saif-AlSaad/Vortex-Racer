/** Procedural Audio for Vortex Racer */
export class SoundKit {
  private ctx: AudioContext | null = null;
  private master: GainNode | null = null;
  private noiseBuf: AudioBuffer | null = null;
  private engineOsc: OscillatorNode | null = null;
  private engineGain: GainNode | null = null;
  muted = false;

  ensure() {
    if (!this.ctx) {
      const AC = window.AudioContext || (window as any).webkitAudioContext;
      if (!AC) return;
      this.ctx = new AC();
      this.master = this.ctx.createGain();
      this.master.gain.value = this.muted ? 0 : 0.3;
      this.master.connect(this.ctx.destination);
      
      const len = this.ctx.sampleRate * 1.5;
      this.noiseBuf = this.ctx.createBuffer(1, len, this.ctx.sampleRate);
      const data = this.noiseBuf.getChannelData(0);
      for (let i = 0; i < len; i++) data[i] = Math.random() * 2 - 1;

      // Engine hum
      this.engineOsc = this.ctx.createOscillator();
      this.engineOsc.type = "sawtooth";
      this.engineOsc.frequency.value = 40;
      this.engineGain = this.ctx.createGain();
      this.engineGain.gain.value = 0;
      this.engineOsc.connect(this.engineGain);
      this.engineGain.connect(this.master);
      this.engineOsc.start();
    }
    if (this.ctx.state === "suspended") void this.ctx.resume();
  }

  setMuted(m: boolean) {
    this.muted = m;
    if (this.master && this.ctx) {
      this.master.gain.setTargetAtTime(m ? 0 : 0.3, this.ctx.currentTime, 0.05);
    }
  }

  setEngineSpeed(normalizedSpeed: number) {
    if (!this.engineOsc || !this.engineGain || !this.ctx || this.muted) return;
    const freq = 40 + normalizedSpeed * 60;
    this.engineOsc.frequency.setTargetAtTime(freq, this.ctx.currentTime, 0.1);
    this.engineGain.gain.setTargetAtTime(0.15 + normalizedSpeed * 0.1, this.ctx.currentTime, 0.1);
  }

  stopEngine() {
    if (!this.engineGain || !this.ctx) return;
    this.engineGain.gain.setTargetAtTime(0, this.ctx.currentTime, 0.1);
  }

  private playTone(type: OscillatorType, f0: number, f1: number, dur: number, vol = 1) {
    if (!this.ctx || !this.master || this.muted) return;
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
    g.connect(this.master);
    osc.start(t0);
    osc.stop(t0 + dur);
  }

  private playNoise(dur: number, freq: number, vol: number) {
    if (!this.ctx || !this.master || !this.noiseBuf || this.muted) return;
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
    g.connect(this.master);
    src.start(t0);
    src.stop(t0 + dur);
  }

  collect() {
    if (!this.ctx) return;
    const t0 = this.ctx.currentTime;
    // Chime
    this.playTone("sine", 880, 1760, 0.15, 0.4);
    setTimeout(() => this.playTone("sine", 1100, 2200, 0.2, 0.3), 50);
  }

  crash() {
    this.stopEngine();
    this.playNoise(0.8, 800, 0.8);
    this.playTone("sawtooth", 120, 40, 0.6, 0.5);
  }

  uiHover() {
    this.playTone("square", 440, 440, 0.05, 0.1);
  }

  uiClick() {
    this.playTone("square", 880, 1200, 0.1, 0.15);
  }

  dispose() {
    if (this.ctx) void this.ctx.close();
    this.ctx = null;
    this.master = null;
    this.noiseBuf = null;
  }
}
