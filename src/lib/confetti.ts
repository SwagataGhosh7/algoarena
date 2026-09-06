import confetti from 'canvas-confetti';

/**
 * AlgoArena Cyber-Neon Palette for match celebrations
 */
export const ARENA_CONFETTI_COLORS = [
  '#00FF00', // Matrix Neon Green
  '#00E5FF', // Electric Cyan
  '#F27D26', // Cyberpunk Amber / Orange
  '#FF0055', // Neon Rose
  '#FFD700', // Trophy Gold
  '#FFFFFF', // High-contrast White
  '#8A2BE2', // Neon Violet
];

/**
 * Triggers a single configured confetti explosion.
 */
export const triggerConfetti = (options?: confetti.Options): Promise<null> | null => {
  if (typeof window === 'undefined') return null;

  // Respect user preference for reduced motion
  const prefersReduced = window.matchMedia?.('(prefers-reduced-motion: reduce)')?.matches;
  if (prefersReduced) return null;

  try {
    return confetti({
      zIndex: 9999,
      disableForReducedMotion: true,
      ...options,
    });
  } catch (err) {
    console.error('Confetti trigger failed:', err);
    return null;
  }
};

/**
 * Grand Multi-Wave Confetti Explosion
 * Designed specifically for duel completion when all test cases pass!
 * 
 * Wave 1: Immediate central hyper-burst
 * Wave 2 (+180ms): Left and right high-angle cannon cross-fire
 * Wave 3 (+360ms): Cyber gold & emerald star shower
 * Wave 4 (+550ms): Floating ambient drift
 */
export const triggerDuelVictoryConfetti = () => {
  if (typeof window === 'undefined') return;

  const prefersReduced = window.matchMedia?.('(prefers-reduced-motion: reduce)')?.matches;
  if (prefersReduced) return;

  // Wave 1: Central shockwave blast
  triggerConfetti({
    particleCount: 110,
    spread: 90,
    startVelocity: 55,
    origin: { x: 0.5, y: 0.55 },
    colors: ARENA_CONFETTI_COLORS,
    ticks: 200,
    scalar: 1.1,
  });

  // Wave 2: Left and right perimeter cannons cross-firing inward
  setTimeout(() => {
    // Left Cannon
    triggerConfetti({
      particleCount: 65,
      angle: 60,
      spread: 60,
      startVelocity: 50,
      origin: { x: 0.05, y: 0.75 },
      colors: ['#00FF00', '#00E5FF', '#FFD700', '#FFFFFF'],
      ticks: 220,
    });

    // Right Cannon
    triggerConfetti({
      particleCount: 65,
      angle: 120,
      spread: 60,
      startVelocity: 50,
      origin: { x: 0.95, y: 0.75 },
      colors: ['#F27D26', '#00FF00', '#FF0055', '#FFFFFF'],
      ticks: 220,
    });
  }, 180);

  // Wave 3: Golden Star Shower
  setTimeout(() => {
    triggerConfetti({
      particleCount: 45,
      spread: 100,
      startVelocity: 35,
      origin: { x: 0.5, y: 0.35 },
      colors: ['#FFD700', '#00FF00', '#FFFFFF'],
      shapes: ['star'],
      scalar: 1.35,
      ticks: 250,
    });
  }, 360);

  // Wave 4: Gentle floating drift
  setTimeout(() => {
    triggerConfetti({
      particleCount: 50,
      spread: 120,
      startVelocity: 25,
      decay: 0.92,
      gravity: 0.6,
      origin: { x: 0.5, y: 0.25 },
      colors: ARENA_CONFETTI_COLORS,
      ticks: 300,
    });
  }, 550);
};

/**
 * Snappy quick burst for passing individual tests or checkpoints
 */
export const triggerQuickSuccessConfetti = (origin = { x: 0.5, y: 0.6 }) => {
  triggerConfetti({
    particleCount: 40,
    spread: 60,
    startVelocity: 35,
    origin,
    colors: ['#00FF00', '#00E5FF', '#FFFFFF'],
    ticks: 140,
  });
};
