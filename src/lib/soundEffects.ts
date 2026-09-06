// Web Audio API Synthesizer for Arena Sound FX
// Zero external audio files required, fast and responsive across all browsers.

class SoundEffectsManager {
  private ctx: AudioContext | null = null;
  private muted: boolean = false;
  private listeners: Set<(muted: boolean) => void> = new Set();

  constructor() {
    this.muted = this.getStoredMuteState();
  }

  private getStoredMuteState(): boolean {
    try {
      const val = localStorage.getItem('algoarena_sound_muted');
      return val === 'true';
    } catch {
      return false;
    }
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
      // Play a very subtle feedback blip so user knows audio is active
      this.playSubtleTone(784, 0.08, 'sine', 0.04);
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
    } catch (e) {
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
      gain.gain.exponentialRampToValueAtTime(gainVal, startTime + 0.02);
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
   * Subtle sound for when match begins
   * Energetic, subtle ascending arpeggio: A4 (440Hz) -> E5 (659Hz) -> A5 (880Hz)
   */
  public playMatchStart(): void {
    if (this.muted) return;
    this.playSubtleTone(440, 0.12, 'sine', 0.05, 0.0);
    this.playSubtleTone(659.25, 0.15, 'sine', 0.05, 0.08);
    this.playSubtleTone(880, 0.28, 'sine', 0.06, 0.16);
  }

  /**
   * Subtle, pleasant upward chord when all test cases pass
   * D5 (587Hz) -> A5 (880Hz)
   */
  public playTestPassed(): void {
    if (this.muted) return;
    this.playSubtleTone(587.33, 0.12, 'sine', 0.05, 0.0);
    this.playSubtleTone(880, 0.22, 'sine', 0.06, 0.08);
  }

  /**
   * Soft, low-frequency subtle buzz when test fails or runtime error occurs
   * C4 (261Hz) -> G3 (196Hz) triangle wave with quick decay
   */
  public playTestFailed(): void {
    if (this.muted) return;
    this.playSubtleTone(261.63, 0.10, 'triangle', 0.04, 0.0);
    this.playSubtleTone(196.00, 0.16, 'triangle', 0.05, 0.07);
  }

  /**
   * Celebratory chord when solution passes all tests and wins
   */
  public playMatchWon(): void {
    if (this.muted) return;
    this.playSubtleTone(523.25, 0.14, 'sine', 0.05, 0.0);
    this.playSubtleTone(659.25, 0.16, 'sine', 0.05, 0.09);
    this.playSubtleTone(783.99, 0.18, 'sine', 0.05, 0.18);
    this.playSubtleTone(1046.50, 0.35, 'sine', 0.07, 0.27);
  }

  /**
   * Subtle tick for countdowns
   */
  public playCountdownTick(): void {
    if (this.muted) return;
    this.playSubtleTone(900, 0.04, 'sine', 0.02, 0.0);
  }
}

export const soundManager = new SoundEffectsManager();
