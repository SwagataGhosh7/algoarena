// Cyberpunk & Lo-Fi Synthesizer Background Music (BGM) Engine
// Powered by Web Audio API for zero-latency, zero-bandwidth procedural synth music
// Plus support for custom audio streams / MP3 URLs

export interface BgmTrack {
  id: string;
  title: string;
  genre: string;
  bpm: number;
  description: string;
  type: 'synth' | 'stream';
  streamUrl?: string;
}

export const PRESET_TRACKS: BgmTrack[] = [
  {
    id: 'neon-pulse',
    title: 'Neon Matrix Drift',
    genre: 'Synthwave / Cyberpunk',
    bpm: 116,
    description: 'Pumping analog synth bass with driving 16th-note neon arpeggios for intense algorithmic duels.',
    type: 'synth',
  },
  {
    id: 'deep-matrix',
    title: 'Deep Matrix Flow',
    genre: 'Ambient Lo-Fi',
    bpm: 76,
    description: 'Warm atmospheric analog pads and sub-bass resonance for deep problem solving and focus.',
    type: 'synth',
  },
  {
    id: 'cyber-drive',
    title: 'Cybernetic Overdrive',
    genre: 'Darksynth / EBM',
    bpm: 128,
    description: 'High-octane rhythmic electro bassline and aggressive harmonic sequences for crunch-time coding.',
    type: 'synth',
  },
  {
    id: 'lofi-chill',
    title: 'Code & Chill Lo-Fi',
    genre: 'Lo-Fi Chillhop',
    bpm: 82,
    description: 'Mellow minor-ninth chord progressions and smooth analog texture for relaxed practice duels.',
    type: 'synth',
  },
];

type BgmListener = () => void;

class BgmEngine {
  private ctx: AudioContext | null = null;
  private masterGain: GainNode | null = null;
  private analyser: AnalyserNode | null = null;
  private isPlaying: boolean = false;
  private currentTrackIndex: number = 0;
  private volume: number = 0.35;
  private timerId: number | null = null;
  private currentStep: number = 0;
  private customStreamUrl: string = '';
  private audioElement: HTMLAudioElement | null = null;
  private listeners: Set<BgmListener> = new Set();
  private autoUnlocked: boolean = false;

  constructor() {
    this.loadSettings();
    this.registerAutoUnlock();
  }

  private loadSettings() {
    if (typeof window === 'undefined') return;
    try {
      const storedVol = localStorage.getItem('algoarena_bgm_volume');
      if (storedVol !== null) {
        this.volume = Math.max(0, Math.min(1, parseFloat(storedVol) || 0.35));
      }
      const storedTrack = localStorage.getItem('algoarena_bgm_track_id');
      if (storedTrack) {
        const found = PRESET_TRACKS.findIndex(t => t.id === storedTrack);
        if (found >= 0) this.currentTrackIndex = found;
      }
      const storedCustom = localStorage.getItem('algoarena_bgm_custom_url');
      if (storedCustom) {
        this.customStreamUrl = storedCustom;
      }
    } catch {
      // storage unavailable
    }
  }

  private registerAutoUnlock() {
    if (typeof window === 'undefined') return;
    const unlock = () => {
      if (this.autoUnlocked) return;
      if (this.ctx && this.ctx.state === 'suspended') {
        this.ctx.resume().catch(() => {});
      }
      this.autoUnlocked = true;
    };
    window.addEventListener('pointerdown', unlock, { once: true, passive: true });
    window.addEventListener('keydown', unlock, { once: true, passive: true });
  }

  private getAudioContext(): AudioContext | null {
    if (typeof window === 'undefined') return null;
    if (!this.ctx) {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (AudioCtx) {
        this.ctx = new AudioCtx();
        this.masterGain = this.ctx.createGain();
        this.masterGain.gain.setValueAtTime(this.volume, this.ctx.currentTime);

        this.analyser = this.ctx.createAnalyser();
        this.analyser.fftSize = 64;
        this.analyser.smoothingTimeConstant = 0.8;

        this.masterGain.connect(this.analyser);
        this.analyser.connect(this.ctx.destination);
      }
    }
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume().catch(() => {});
    }
    return this.ctx;
  }

  public subscribe(listener: BgmListener): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  private notify() {
    this.listeners.forEach(fn => fn());
  }

  public getTracks(): BgmTrack[] {
    return PRESET_TRACKS;
  }

  public getCurrentTrack(): BgmTrack {
    return PRESET_TRACKS[this.currentTrackIndex] || PRESET_TRACKS[0];
  }

  public getIsPlaying(): boolean {
    return this.isPlaying;
  }

  public getVolume(): number {
    return this.volume;
  }

  public setVolume(vol: number): void {
    this.volume = Math.max(0, Math.min(1, vol));
    try {
      localStorage.setItem('algoarena_bgm_volume', this.volume.toFixed(2));
    } catch {}
    if (this.masterGain && this.ctx) {
      this.masterGain.gain.setTargetAtTime(this.volume, this.ctx.currentTime, 0.05);
    }
    if (this.audioElement) {
      this.audioElement.volume = this.volume;
    }
    this.notify();
  }

  public setTrack(trackId: string): void {
    const idx = PRESET_TRACKS.findIndex(t => t.id === trackId);
    if (idx >= 0 && idx !== this.currentTrackIndex) {
      const wasPlaying = this.isPlaying;
      if (wasPlaying) {
        this.stop();
      }
      this.currentTrackIndex = idx;
      try {
        localStorage.setItem('algoarena_bgm_track_id', trackId);
      } catch {}
      this.notify();
      if (wasPlaying) {
        this.play();
      }
    }
  }

  public nextTrack(): void {
    const nextIdx = (this.currentTrackIndex + 1) % PRESET_TRACKS.length;
    this.setTrack(PRESET_TRACKS[nextIdx].id);
  }

  public prevTrack(): void {
    const prevIdx = (this.currentTrackIndex - 1 + PRESET_TRACKS.length) % PRESET_TRACKS.length;
    this.setTrack(PRESET_TRACKS[prevIdx].id);
  }

  public togglePlay(): void {
    if (this.isPlaying) {
      this.stop();
    } else {
      this.play();
    }
  }

  public async play(): Promise<void> {
    const ctx = this.getAudioContext();
    if (!ctx) return;
    if (ctx.state === 'suspended') {
      await ctx.resume().catch(() => {});
    }

    this.isPlaying = true;
    this.notify();

    // Start procedural synth sequencer
    this.currentStep = 0;
    this.scheduleStepSequencer();
  }

  public stop(): void {
    this.isPlaying = false;
    if (this.timerId !== null) {
      window.clearInterval(this.timerId);
      this.timerId = null;
    }
    if (this.audioElement) {
      this.audioElement.pause();
      this.audioElement = null;
    }
    this.notify();
  }

  // Multi-Pattern Procedural Synthesizer
  private scheduleStepSequencer() {
    if (this.timerId !== null) {
      window.clearInterval(this.timerId);
      this.timerId = null;
    }

    const currentTrack = this.getCurrentTrack();
    const bpm = currentTrack.bpm || 110;
    // Step interval for 16th notes: (60 / bpm) / 4 in seconds
    const stepIntervalMs = Math.round(((60 / bpm) / 4) * 1000);

    this.timerId = window.setInterval(() => {
      if (!this.isPlaying) {
        if (this.timerId !== null) {
          window.clearInterval(this.timerId);
          this.timerId = null;
        }
        return;
      }

      this.triggerStepSound(this.currentStep, currentTrack.id);
      this.currentStep = (this.currentStep + 1) % 64; // 4-bar loop
    }, stepIntervalMs);
  }

  private triggerStepSound(step: number, trackId: string) {
    const ctx = this.ctx;
    const dest = this.masterGain;
    if (!ctx || !dest || ctx.state !== 'running') return;

    const t = ctx.currentTime;

    // Musical frequency tables in Hz
    // Key: D minor / F Major (cyberpunk classic)
    // Notes: D1=36.71, D2=73.42, F2=87.31, G2=98.00, A2=110.00, C3=130.81, D3=146.83, F3=174.61, G3=196.00, A3=220.00, C4=261.63, D4=293.66, E4=329.63, F4=349.23, G4=392.00, A4=440.00
    const D2 = 73.42;
    const F2 = 87.31;
    const G2 = 98.00;
    const A2 = 110.00;
    const Bb2 = 116.54;
    const B2 = 123.47;
    const C3 = 130.81;
    const D3 = 146.83;
    const E3 = 164.81;
    const F3 = 174.61;
    const G3 = 196.00;
    const A3 = 220.00;
    const Bb3 = 233.08;
    const C4 = 261.63;
    const D4 = 293.66;
    const E4 = 329.63;
    const F4 = 349.23;
    const G4 = 392.00;
    const A4 = 440.00;
    const C5 = 523.25;
    const D5 = 587.33;

    // Track 1: NEON MATRIX DRIFT (Classic Synthwave Arpeggio + Driving Bass + Kick pulse)
    if (trackId === 'neon-pulse') {
      // 1. Kick & Sub pulse on beats 0, 4, 8, 12... (quarter notes)
      if (step % 4 === 0) {
        this.playAnalogKick(ctx, dest, t, 0.45);
      }

      // 2. Off-beat Synth Bass (rolling 16th notes)
      const bar = Math.floor(step / 16);
      const rootBass = bar === 0 ? D2 : bar === 1 ? Bb2 : bar === 2 ? C3 : A2;
      if (step % 2 === 1 || step % 4 === 2) {
        this.playSynthBass(ctx, dest, t, rootBass, 0.12, 0.22);
      }

      // 3. Cyberpunk Arpeggio (every 16th note with stereo filter sweep)
      const arpNotes = [D4, F4, A4, D5, C5, A4, F4, G4, A4, F4, D4, A3, C4, D4, E4, F4];
      const noteFreq = arpNotes[step % arpNotes.length];
      this.playArpPluck(ctx, dest, t, noteFreq, 0.1, 0.18);

      // 4. Subtle Snare / Clap on beats 4 and 12 (half-notes)
      if (step % 16 === 4 || step % 16 === 12) {
        this.playCyberSnare(ctx, dest, t, 0.18);
      }

      // 5. Hi-hat pulse on 8th notes
      if (step % 2 === 0) {
        this.playClosedHiHat(ctx, dest, t, 0.04);
      }
    }

    // Track 2: DEEP MATRIX FLOW (Ambient Lo-Fi Drone, Ethereal Slow Pads)
    else if (trackId === 'deep-matrix') {
      // Slow evolving pad every 16 steps (1 bar)
      if (step % 16 === 0) {
        const chordIndex = Math.floor(step / 16) % 4;
        const chords = [
          [D3, A3, F4, C5],      // Dm7
          [Bb2, F3, D4, A4],     // Bbmaj7
          [G2, D3, Bb3, F4],     // Gm7
          [A2, E3, C4, G4],      // Am7
        ];
        const chord = chords[chordIndex];
        chord.forEach((freq, idx) => {
          this.playWarmPad(ctx, dest, t + idx * 0.04, freq, 2.2, 0.12);
        });
        // Soft sub-bass fundamental
        this.playDeepSub(ctx, dest, t, chord[0] / 2, 2.0, 0.3);
      }

      // Occasional gentle water-droplet / high melodic chime
      if (step % 8 === 3 || step % 16 === 11) {
        const chimes = [A4, C5, D5, F4, E4];
        const chimeFreq = chimes[(step * 3) % chimes.length];
        this.playChimePluck(ctx, dest, t, chimeFreq, 0.4, 0.08);
      }

      // Soft vinyl crackle simulation every quarter note
      if (step % 4 === 0) {
        this.playVinylCrackle(ctx, dest, t, 0.02);
      }
    }

    // Track 3: CYBERNETIC OVERDRIVE (Fast 128 BPM EBM / Darksynth Bass)
    else if (trackId === 'cyber-drive') {
      // Four-on-the-floor kick
      if (step % 4 === 0) {
        this.playAnalogKick(ctx, dest, t, 0.55);
      }

      // Aggressive Sawtooth Bass on every 16th note
      const bassProgression = [D2, D2, D2, D2, F2, F2, G2, G2, A2, A2, Bb2, Bb2, A2, A2, G2, F2];
      const bassFreq = bassProgression[Math.floor(step / 2) % bassProgression.length];
      this.playDistortedBass(ctx, dest, t, bassFreq, 0.09, 0.28);

      // Industrial snare on beat 4 and 12
      if (step % 16 === 4 || step % 16 === 12) {
        this.playCyberSnare(ctx, dest, t, 0.26);
      }

      // Fast Hi-Hat on every offbeat
      if (step % 2 === 1) {
        this.playClosedHiHat(ctx, dest, t, 0.08);
      }

      // High lead arpeggio on bars 2 and 4
      if (Math.floor(step / 16) >= 1 && step % 4 === 2) {
        const leadNotes = [D5, F4, A4, C5];
        this.playArpPluck(ctx, dest, t, leadNotes[(step / 2) % leadNotes.length], 0.12, 0.15);
      }
    }

    // Track 4: CODE & CHILL LO-FI (Mellow Chillhop Chords + Sub Pulse)
    else {
      // Warm Rhodes / Electric Piano chords on bar starts
      if (step % 16 === 0) {
        const chordIndex = Math.floor(step / 16) % 4;
        const lofiChords = [
          [D3, F3, A3, C4, E4],  // Dm9
          [G2, D3, F3, Bb3, D4], // Gm7
          [C3, G3, B2, E3, G4],  // Cmaj9
          [A2, E3, G3, C4, F4],  // Am7
        ];
        const chord = lofiChords[chordIndex];
        chord.forEach((freq, idx) => {
          this.playWarmPad(ctx, dest, t + idx * 0.03, freq, 1.8, 0.14);
        });
      }

      // Soft boombap kick on step 0, 7, 10
      if (step % 16 === 0 || step % 16 === 10) {
        this.playAnalogKick(ctx, dest, t, 0.35);
      }

      // Lazy rimshot / snap on beat 8
      if (step % 16 === 8) {
        this.playCyberSnare(ctx, dest, t, 0.12);
      }

      // Shaker on every 8th note
      if (step % 2 === 0) {
        this.playClosedHiHat(ctx, dest, t, 0.03);
      }
    }
  }

  // --- Sound Generation Instruments ---

  private playAnalogKick(ctx: AudioContext, dest: GainNode, time: number, volume: number) {
    try {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(140, time);
      osc.frequency.exponentialRampToValueAtTime(38, time + 0.12);

      gain.gain.setValueAtTime(volume, time);
      gain.gain.exponentialRampToValueAtTime(0.001, time + 0.22);

      osc.connect(gain);
      gain.connect(dest);

      osc.start(time);
      osc.stop(time + 0.23);
    } catch {}
  }

  private playSynthBass(ctx: AudioContext, dest: GainNode, time: number, freq: number, duration: number, volume: number) {
    try {
      const osc = ctx.createOscillator();
      const filter = ctx.createBiquadFilter();
      const gain = ctx.createGain();

      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(freq, time);

      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(600, time);
      filter.frequency.exponentialRampToValueAtTime(180, time + duration);

      gain.gain.setValueAtTime(volume, time);
      gain.gain.exponentialRampToValueAtTime(0.001, time + duration);

      osc.connect(filter);
      filter.connect(gain);
      gain.connect(dest);

      osc.start(time);
      osc.stop(time + duration + 0.02);
    } catch {}
  }

  private playDistortedBass(ctx: AudioContext, dest: GainNode, time: number, freq: number, duration: number, volume: number) {
    try {
      const osc = ctx.createOscillator();
      const osc2 = ctx.createOscillator();
      const filter = ctx.createBiquadFilter();
      const gain = ctx.createGain();

      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(freq, time);

      osc2.type = 'square';
      osc2.frequency.setValueAtTime(freq * 1.004, time); // detuned chorus effect

      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(1400, time);
      filter.frequency.exponentialRampToValueAtTime(320, time + duration);

      gain.gain.setValueAtTime(volume * 0.7, time);
      gain.gain.exponentialRampToValueAtTime(0.001, time + duration);

      osc.connect(filter);
      osc2.connect(filter);
      filter.connect(gain);
      gain.connect(dest);

      osc.start(time);
      osc2.start(time);
      osc.stop(time + duration + 0.02);
      osc2.stop(time + duration + 0.02);
    } catch {}
  }

  private playDeepSub(ctx: AudioContext, dest: GainNode, time: number, freq: number, duration: number, volume: number) {
    try {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, time);

      gain.gain.setValueAtTime(0.001, time);
      gain.gain.linearRampToValueAtTime(volume, time + 0.2);
      gain.gain.exponentialRampToValueAtTime(0.001, time + duration);

      osc.connect(gain);
      gain.connect(dest);

      osc.start(time);
      osc.stop(time + duration + 0.05);
    } catch {}
  }

  private playArpPluck(ctx: AudioContext, dest: GainNode, time: number, freq: number, duration: number, volume: number) {
    try {
      const osc = ctx.createOscillator();
      const filter = ctx.createBiquadFilter();
      const gain = ctx.createGain();

      osc.type = 'square';
      osc.frequency.setValueAtTime(freq, time);

      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(2200, time);
      filter.frequency.exponentialRampToValueAtTime(400, time + duration);

      gain.gain.setValueAtTime(volume, time);
      gain.gain.exponentialRampToValueAtTime(0.0001, time + duration);

      osc.connect(filter);
      filter.connect(gain);
      gain.connect(dest);

      osc.start(time);
      osc.stop(time + duration + 0.02);
    } catch {}
  }

  private playChimePluck(ctx: AudioContext, dest: GainNode, time: number, freq: number, duration: number, volume: number) {
    try {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'triangle';
      osc.frequency.setValueAtTime(freq, time);

      gain.gain.setValueAtTime(volume, time);
      gain.gain.exponentialRampToValueAtTime(0.0001, time + duration);

      osc.connect(gain);
      gain.connect(dest);

      osc.start(time);
      osc.stop(time + duration + 0.02);
    } catch {}
  }

  private playWarmPad(ctx: AudioContext, dest: GainNode, time: number, freq: number, duration: number, volume: number) {
    try {
      const osc = ctx.createOscillator();
      const filter = ctx.createBiquadFilter();
      const gain = ctx.createGain();

      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(freq, time);

      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(550, time);

      gain.gain.setValueAtTime(0.001, time);
      gain.gain.linearRampToValueAtTime(volume, time + 0.4);
      gain.gain.exponentialRampToValueAtTime(0.0001, time + duration);

      osc.connect(filter);
      filter.connect(gain);
      gain.connect(dest);

      osc.start(time);
      osc.stop(time + duration + 0.05);
    } catch {}
  }

  private playCyberSnare(ctx: AudioContext, dest: GainNode, time: number, volume: number) {
    try {
      const noiseBuffer = ctx.createBuffer(1, ctx.sampleRate * 0.15, ctx.sampleRate);
      const output = noiseBuffer.getChannelData(0);
      for (let i = 0; i < noiseBuffer.length; i++) {
        output[i] = Math.random() * 2 - 1;
      }

      const whiteNoise = ctx.createBufferSource();
      whiteNoise.buffer = noiseBuffer;

      const filter = ctx.createBiquadFilter();
      filter.type = 'highpass';
      filter.frequency.setValueAtTime(1200, time);

      const gain = ctx.createGain();
      gain.gain.setValueAtTime(volume, time);
      gain.gain.exponentialRampToValueAtTime(0.001, time + 0.14);

      whiteNoise.connect(filter);
      filter.connect(gain);
      gain.connect(dest);

      whiteNoise.start(time);
      whiteNoise.stop(time + 0.15);
    } catch {}
  }

  private playClosedHiHat(ctx: AudioContext, dest: GainNode, time: number, volume: number) {
    try {
      const noiseBuffer = ctx.createBuffer(1, ctx.sampleRate * 0.04, ctx.sampleRate);
      const output = noiseBuffer.getChannelData(0);
      for (let i = 0; i < noiseBuffer.length; i++) {
        output[i] = Math.random() * 2 - 1;
      }

      const whiteNoise = ctx.createBufferSource();
      whiteNoise.buffer = noiseBuffer;

      const filter = ctx.createBiquadFilter();
      filter.type = 'bandpass';
      filter.frequency.setValueAtTime(8000, time);

      const gain = ctx.createGain();
      gain.gain.setValueAtTime(volume, time);
      gain.gain.exponentialRampToValueAtTime(0.001, time + 0.035);

      whiteNoise.connect(filter);
      filter.connect(gain);
      gain.connect(dest);

      whiteNoise.start(time);
      whiteNoise.stop(time + 0.04);
    } catch {}
  }

  private playVinylCrackle(ctx: AudioContext, dest: GainNode, time: number, volume: number) {
    try {
      const count = 3;
      for (let i = 0; i < count; i++) {
        const offset = Math.random() * 0.1;
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(1000 + Math.random() * 4000, time + offset);

        gain.gain.setValueAtTime(volume, time + offset);
        gain.gain.exponentialRampToValueAtTime(0.0001, time + offset + 0.008);

        osc.connect(gain);
        gain.connect(dest);

        osc.start(time + offset);
        osc.stop(time + offset + 0.01);
      }
    } catch {}
  }

  public getVisualizerData(dataArray: Uint8Array): void {
    if (this.analyser && this.isPlaying) {
      this.analyser.getByteFrequencyData(dataArray);
    } else {
      dataArray.fill(0);
    }
  }

  public getCustomStreamUrl(): string {
    return this.customStreamUrl;
  }

  public setCustomStreamUrl(url: string): void {
    this.customStreamUrl = url.trim();
    try {
      localStorage.setItem('algoarena_bgm_custom_url', this.customStreamUrl);
    } catch {}
  }
}

export const bgmEngine = new BgmEngine();
