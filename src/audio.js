// Tiny WebAudio synth: no audio files needed.
export class Audio {
  constructor() { this.ctx = null; this.muted = false; this.master = null; }
  init() {
    if (this.ctx) { this.ctx.resume(); return; }
    const AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return;
    this.ctx = new AC();
    this.master = this.ctx.createGain(); this.master.gain.value = 0.6; this.master.connect(this.ctx.destination);
    // soft night ambience: filtered noise like distant city/traffic
    const buf = this.noiseBuffer(4);
    const src = this.ctx.createBufferSource(); src.buffer = buf; src.loop = true;
    const lp = this.ctx.createBiquadFilter(); lp.type = 'lowpass'; lp.frequency.value = 380;
    this.amb = this.ctx.createGain(); this.amb.gain.value = 0.035;
    src.connect(lp).connect(this.amb).connect(this.master); src.start();
  }
  noiseBuffer(sec) {
    const b = this.ctx.createBuffer(1, this.ctx.sampleRate * sec, this.ctx.sampleRate);
    const d = b.getChannelData(0); let last = 0;
    for (let i = 0; i < d.length; i++) { last = (last + 0.02 * (Math.random() * 2 - 1)) / 1.02; d[i] = last * 3.5; }
    return b;
  }
  setMuted(m) { this.muted = m; if (this.master) this.master.gain.value = m ? 0 : 0.6; }
  tone(freq, dur, { type = 'sine', vol = 0.2, delay = 0, attack = 0.005 } = {}) {
    if (!this.ctx) return;
    const t = this.ctx.currentTime + delay;
    const o = this.ctx.createOscillator(), g = this.ctx.createGain();
    o.type = type; o.frequency.value = freq;
    g.gain.setValueAtTime(0, t); g.gain.linearRampToValueAtTime(vol, t + attack); g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    o.connect(g).connect(this.master); o.start(t); o.stop(t + dur + 0.05);
  }
  ding() { this.tone(1318.5, 1.2, { vol: 0.16 }); this.tone(1046.5, 1.5, { vol: 0.16, delay: 0.32 }); }
  chime() { [784, 988, 1175, 1568].forEach((f, i) => this.tone(f, 0.6, { vol: 0.1, delay: i * 0.09, type: 'triangle' })); }
  hum(dur) {
    if (!this.ctx) return;
    const t = this.ctx.currentTime;
    const o = this.ctx.createOscillator(), g = this.ctx.createGain();
    o.type = 'sawtooth'; o.frequency.value = 55;
    const lp = this.ctx.createBiquadFilter(); lp.type = 'lowpass'; lp.frequency.value = 180;
    g.gain.setValueAtTime(0, t); g.gain.linearRampToValueAtTime(0.06, t + 0.5); g.gain.setValueAtTime(0.06, t + dur - 0.5); g.gain.linearRampToValueAtTime(0, t + dur);
    o.connect(lp).connect(g).connect(this.master); o.start(t); o.stop(t + dur + 0.1);
  }
  noise(dur, { freq = 800, q = 1, vol = 0.2, type = 'bandpass' } = {}) {
    if (!this.ctx) return;
    const t = this.ctx.currentTime;
    const src = this.ctx.createBufferSource(); src.buffer = this._nb || (this._nb = this.whiteBuffer());
    const f = this.ctx.createBiquadFilter(); f.type = type; f.frequency.value = freq; f.Q.value = q;
    const g = this.ctx.createGain();
    g.gain.setValueAtTime(vol, t); g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    src.connect(f).connect(g).connect(this.master); src.start(t); src.stop(t + dur + 0.05);
  }
  whiteBuffer() {
    const b = this.ctx.createBuffer(1, this.ctx.sampleRate, this.ctx.sampleRate);
    const d = b.getChannelData(0); for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
    return b;
  }
  step(surface = 'tile') { this.noise(0.07, { freq: surface === 'wood' ? 300 : surface === 'stairs' ? 500 : 1400, q: 0.8, vol: 0.05 + Math.random() * 0.02 }); }
  door() { this.noise(0.25, { freq: 400, q: 2, vol: 0.08 }); this.tone(180, 0.15, { type: 'triangle', vol: 0.05 }); }
  gate() { this.noise(0.4, { freq: 2500, q: 6, vol: 0.12 }); this.tone(420, 0.5, { type: 'square', vol: 0.02 }); }
  click() { this.tone(2200, 0.05, { type: 'square', vol: 0.04 }); }
}
