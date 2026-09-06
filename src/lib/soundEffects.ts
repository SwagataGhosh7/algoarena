// Web Audio API Synthesizer for Arena Sound FX
// Zero external audio files required, fast and responsive across all browsers.

class SoundEffectsManager {
  private ctx: AudioContext | null = null;
  private muted: boolean = false;
  private listeners: Set<(muted: boolean) => void> = new Set();
  private unlocked: boolean = false;

  constructor() {
    this.muted = this.getStoredMuteState();
    this.registerAutoUnlock();
  }

  private getStoredMuteState(): boolean {
    try {
      const val = localStorage.getItem('algoarena_sound_muted');
      return val === 'true';
    } catch {
      return false;
    }
  }

  /**
   * Browser autoplay policy requires user interaction before audio plays.
   * This unlocks the AudioContext automatically upon first touch/click/keypress anywhere.
   */
  private registerAutoUnlock() {
    if (typeof window === 'undefined') return;
    const unlockHandler = () => {
      if (this.unlocked) return;
      const ctx = this.getAudioContext();
      if (ctx && ctx.state === 'suspended') {
        ctx.resume().then(() => {
          this.unlocked = true;
        }).catch(() => {});
      } else if (ctx) {
        this.unlocked = true;
      }
      window.removeEventListener('pointerdown', unlockHandler);
      window.removeEventListener('keydown', unlockHandler);
      window.removeEventListener('touchstart', unlockHandler);
    };

    window.addEventListener('pointerdown', unlockHandler, { once: false, passive: true });
    window.addEventListener('keydown', unlockHandler, { once: false, passive: true });
    window.addEventListener('touchstart', unlockHandler, { once: false, passive: true });
  }

  public isMuted(): boolean {
    return this.muted;
  }

  public setMuted(muted: boolean): void {
    this.muted = muted;
    try {
      localStorage.setItem('algoarena_sound_muted', muted ? 'true' : 'false');
    } catch {
      // ignore
    }
    this.listeners.forEach(fn => fn(this.muted));
    if (!muted) {
      // Play a quick test ping so duelist knows audio feedback is active
      this.playSubtleTone(880, 0.08, 'sine', 0.05);
    }
  }

  public toggleMute(): boolean {
    const next = !this.muted;
    this.setMuted(next);
    return next;
  }

  public subscribe(fn: (muted: boolean) => void): () => void {
    this.listeners.add(fn);
    return () => this.listeners.delete(fn);
  }

  private getAudioContext(): AudioContext | null {
    if (typeof window === 'undefined') return null;
    try {
      if (!this.ctx) {
        const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
        if (AudioContextClass) {
          this.ctx = new AudioContextClass();
        }
      }
      if (this.ctx && this.ctx.state === 'suspended') {
        this.ctx.resume().catch(() => {});
      }
      return this.ctx;
    } catch {
      return null;
    }
  }

  private playSubtleTone(
    freq: number,
    duration: number,
    type: OscillatorType = 'sine',
    gainVal: number = 0.05,
    delay: number = 0
  ) {
    if (this.muted) return;
    const ctx = this.getAudioContext();
    if (!ctx) return;

    try {
      const startTime = ctx.currentTime + delay;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = type;
      osc.frequency.setValueAtTime(freq, startTime);

      gain.gain.setValueAtTime(0.0001, startTime);
      gain.gain.exponentialRampToValueAtTime(gainVal, startTime + 0.015);
      gain.gain.exponentialRampToValueAtTime(0.0001, startTime + duration);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(startTime);
      osc.stop(startTime + duration + 0.05);
    } catch {
      // Ignore audio synthesis errors
    }
  }

  /**
   * CRITICAL EVENT 1: 'MATCH FOUND'
   * Alerts the duelist that a challenger has joined the room or matchmaking connected!
   * Multi-tone bright futuristic alert chime with crisp harmonic shimmer.
   */
  public playMatchFound(): void {
    if (this.muted) return;
    const ctx = this.getAudioContext();
    if (!ctx) return;

    try {
      const now = ctx.currentTime;

      // Note 1: C5 (523.25 Hz)
      this.playSubtleTone(523.25, 0.12, 'sine', 0.08, 0.0);
      this.playSubtleTone(1046.5, 0.08, 'triangle', 0.02, 0.0);

      // Note 2: G5 (783.99 Hz)
      this.playSubtleTone(783.99, 0.14, 'sine', 0.09, 0.09);
      this.playSubtleTone(1567.98, 0.08, 'triangle', 0.02, 0.09);

      // Note 3: High C6 (1046.50 Hz) with resonant tail
      this.playSubtleTone(1046.5, 0.35, 'sine', 0.10, 0.18);
      this.playSubtleTone(2093.0, 0.25, 'triangle', 0.03, 0.18);

      // Soft high sparkle finish: G6 (1567.98 Hz)
      this.playSubtleTone(1567.98, 0.22, 'sine', 0.04, 0.26);
    } catch {
      // ignore
    }
  }

  /**
   * CRITICAL EVENT 2: 'SUBMISSION SUCCESS'
   * Played when submitted code passes all hidden tests and succeeds in the arena!
   * Triumphant, multi-stage cyber arpeggio + bell harmony.
   */
  public playSubmissionSuccess(): void {
    if (this.muted) return;
    const ctx = this.getAudioContext();
    if (!ctx) return;

    try {
      // Triumphant ascending arpeggio (D major pentatonic energy)
      // D5 -> F#5 -> A5 -> D6 -> F#6 with bright decay
      this.playSubtleTone(587.33, 0.12, 'sine', 0.07, 0.0);
      this.playSubtleTone(739.99, 0.14, 'sine', 0.08, 0.07);
      this.playSubtleTone(880.00, 0.16, 'sine', 0.09, 0.14);
      this.playSubtleTone(1174.66, 0.22, 'sine', 0.11, 0.22);
      this.playSubtleTone(1479.98, 0.40, 'sine', 0.12, 0.32);

      // Shimmering harmonic chord sustain
      this.playSubtleTone(880.00, 0.38, 'triangle', 0.04, 0.32);
      this.playSubtleTone(1760.0, 0.28, 'sine', 0.04, 0.36);
    } catch {
      // ignore
    }
  }

  /**
   * CRITICAL EVENT 3: 'DUEL START'
   * Played when both duelists ready up and the match clock engages!
   * Punchy sub-bass tactical drop + double cyber brass fanfare.
   */
  public playDuelStart(): void {
    if (this.muted) return;
    const ctx = this.getAudioContext();
    if (!ctx) return;

    try {
      const now = ctx.currentTime;

      // Sub-bass tactical kick impact (160 Hz swept down to 50 Hz)
      const kickOsc = ctx.createOscillator();
      const kickGain = ctx.createGain();
      kickOsc.type = 'sine';
      kickOsc.frequency.setValueAtTime(160, now);
      kickOsc.frequency.exponentialRampToValueAtTime(50, now + 0.20);
      kickGain.gain.setValueAtTime(0.001, now);
      kickGain.gain.exponentialRampToValueAtTime(0.12, now + 0.02);
      kickGain.gain.exponentialRampToValueAtTime(0.0001, now + 0.22);
      kickOsc.connect(kickGain);
      kickGain.connect(ctx.destination);
      kickOsc.start(now);
      kickOsc.stop(now + 0.25);

      // Cyber combat brass pulses
      // Staccato pulse 1: A3 (220 Hz) + E4 (329.63 Hz)
      this.playSubtleTone(220.00, 0.12, 'sawtooth', 0.04, 0.05);
      this.playSubtleTone(329.63, 0.12, 'sine', 0.06, 0.05);

      // Staccato pulse 2: D4 (293.66 Hz) + A4 (440 Hz)
      this.playSubtleTone(293.66, 0.14, 'sawtooth', 0.05, 0.16);
      this.playSubtleTone(440.00, 0.14, 'sine', 0.07, 0.16);

      // Resonant strike: E4 (329.63 Hz) + B4 (493.88 Hz) -> High A5 (880 Hz)
      this.playSubtleTone(440.00, 0.35, 'sawtooth', 0.06, 0.28);
      this.playSubtleTone(880.00, 0.45, 'sine', 0.09, 0.28);
      this.playSubtleTone(1318.5, 0.30, 'triangle', 0.04, 0.35);
    } catch {
      // ignore
    }
  }

  /**
   * Alias for backward compatibility with match start calls
   */
  public playMatchStart(): void {
    this.playDuelStart();
  }

  /**
   * Subtle, pleasant upward chord when sample test cases pass
   * D5 (587Hz) -> A5 (880Hz)
   */
  public playTestPassed(): void {
    if (this.muted) return;
    this.playSubtleTone(587.33, 0.12, 'sine', 0.06, 0.0);
    this.playSubtleTone(880, 0.24, 'sine', 0.07, 0.07);
  }

  /**
   * Soft, low-frequency buzz when test fails or runtime error occurs
   * C4 (261Hz) -> G3 (196Hz)
   */
  public playTestFailed(): void {
    if (this.muted) return;
    this.playSubtleTone(261.63, 0.10, 'triangle', 0.05, 0.0);
    this.playSubtleTone(196.00, 0.18, 'triangle', 0.06, 0.07);
  }

  /**
   * Celebratory chord when match is fully concluded and victory is verified
   */
  public playMatchWon(): void {
    if (this.muted) return;
    this.playSubmissionSuccess();
    // Additional victory chord sustain
    this.playSubtleTone(1046.50, 0.45, 'sine', 0.08, 0.42);
  }

  /**
   * Subtle low tone when match concludes in defeat
   */
  public playMatchLost(): void {
    if (this.muted) return;
    this.playSubtleTone(329.63, 0.16, 'sine', 0.06, 0.0);
    this.playSubtleTone(261.63, 0.26, 'sine', 0.07, 0.11);
  }

  /**
   * Subtle tick for countdowns
   */
  public playCountdownTick(): void {
    if (this.muted) return;
    this.playSubtleTone(920, 0.04, 'sine', 0.03, 0.0);
  }

  /**
   * Urgent, dual-frequency warning tick for critical countdown (< 30s)
   */
  public playUrgentTick(): void {
    if (this.muted) return;
    this.playSubtleTone(1100, 0.03, 'square', 0.04, 0.0);
    this.playSubtleTone(740, 0.03, 'sine', 0.05, 0.02);
  }

  /**
   * Klaxon/buzzer alert when duel timer reaches 0:00
   */
  public playTimeUpWarning(): void {
    if (this.muted) return;
    this.playSubtleTone(280, 0.25, 'sawtooth', 0.07, 0.0);
    this.playSubtleTone(200, 0.35, 'sawtooth', 0.08, 0.2);
  }

  /**
   * Subtle click for toggles, language switches, and buttons
   */
  public playClick(): void {
    if (this.muted) return;
    this.playSubtleTone(880, 0.05, 'sine', 0.03, 0.0);
  }

  /**
   * Preview a specific notification sound for testing/calibration
   */
  public testAudio(type: 'matchFound' | 'submissionSuccess' | 'duelStart' = 'matchFound'): void {
    if (this.muted) {
      this.setMuted(false);
    }
    if (type === 'matchFound') {
      this.playMatchFound();
    } else if (type === 'submissionSuccess') {
      this.playSubmissionSuccess();
    } else if (type === 'duelStart') {
      this.playDuelStart();
    }
  }
}

export const soundManager = new SoundEffectsManager();

