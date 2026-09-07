import { useState, useEffect } from 'react';

export interface NeonPalette {
  id: string;
  name: string;
  codeName: string;
  hex: string;
  secondaryHex: string;
  rgb: string;
  contrastText: string;
  description: string;
  tag: string;
  borderClass?: string;
  textClass?: string;
  bgClass?: string;
}

export const NEON_PALETTES: NeonPalette[] = [
  {
    id: 'matrix-green',
    name: 'Matrix Emerald',
    codeName: 'CYBER-01',
    hex: '#00FF00',
    secondaryHex: '#00CC00',
    rgb: '0, 255, 0',
    contrastText: '#000000',
    description: 'Canonical competitive cyberpunk terminal green. High clarity, zero latency perception.',
    tag: 'ESPORTS CANON'
  },
  {
    id: 'cyber-cyan',
    name: 'Cyber Cyan',
    codeName: 'ICE-02',
    hex: '#00F0FF',
    secondaryHex: '#00B8FF',
    rgb: '0, 240, 255',
    contrastText: '#000000',
    description: 'High-frequency electric ice & Neo Tokyo skyline. Cold, hyper-focused precision.',
    tag: 'NEO TOKYO'
  },
  {
    id: 'laser-magenta',
    name: 'Laser Magenta',
    codeName: 'SYNTH-03',
    hex: '#FF007F',
    secondaryHex: '#E6006E',
    rgb: '255, 0, 127',
    contrastText: '#FFFFFF',
    description: 'Vivid synthwave neon pink & hyperdrive fuchsia. Striking, high-voltage aggressive aesthetic.',
    tag: 'SYNTHWAVE'
  },
  {
    id: 'solar-amber',
    name: 'Solar Amber',
    codeName: 'FLARE-04',
    hex: '#FFB800',
    secondaryHex: '#E69900',
    rgb: '255, 184, 0',
    contrastText: '#000000',
    description: 'Overclocked core temperature & golden plasma flare. Radiates pure compute dominance.',
    tag: 'OVERCLOCK'
  },
  {
    id: 'plasma-violet',
    name: 'Plasma Violet',
    codeName: 'VOID-05',
    hex: '#B026FF',
    secondaryHex: '#8C00FF',
    rgb: '176, 38, 255',
    contrastText: '#FFFFFF',
    description: 'Dark-energy void pulse & quantum entanglement violet. Deep, mysterious cryptographic aura.',
    tag: 'QUANTUM'
  },
  {
    id: 'toxic-volt',
    name: 'Toxic Volt',
    codeName: 'HAZARD-06',
    hex: '#CCFF00',
    secondaryHex: '#B2E600',
    rgb: '204, 255, 0',
    contrastText: '#000000',
    description: 'Blinding electric lime & hazardous industrial voltage. Maximum contrast on black terminals.',
    tag: 'HIGH VOLT'
  }
];

export const DEFAULT_NEON_PALETTE_ID = 'matrix-green';
const STORAGE_KEY = 'algoarena_neon_palette';
const CHANGE_EVENT = 'algoarena_neon_palette_change';

/**
 * Get current stored neon palette or fallback to default
 */
export function getStoredNeonPalette(): NeonPalette {
  if (typeof window === 'undefined') return NEON_PALETTES[0];
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      const found = NEON_PALETTES.find(p => p.id === stored);
      if (found) return found;
    }
  } catch (e) {
    console.warn('Failed to read neon palette from storage', e);
  }
  return NEON_PALETTES[0];
}

/**
 * Apply neon palette to document root CSS variables
 */
export function applyNeonPalette(paletteIdOrObject: string | NeonPalette): NeonPalette {
  const palette = typeof paletteIdOrObject === 'string'
    ? NEON_PALETTES.find(p => p.id === paletteIdOrObject) || NEON_PALETTES[0]
    : paletteIdOrObject;

  if (typeof document !== 'undefined') {
    const root = document.documentElement;
    root.style.setProperty('--neon-primary', palette.hex);
    root.style.setProperty('--neon-secondary', palette.secondaryHex);
    root.style.setProperty('--neon-rgb', palette.rgb);
    root.style.setProperty('--neon-contrast', palette.contrastText);
    root.style.setProperty('--neon-glow', `0 0 16px rgba(${palette.rgb}, 0.35)`);
    root.style.setProperty('--neon-glow-lg', `0 0 28px rgba(${palette.rgb}, 0.5)`);
    root.setAttribute('data-neon-palette', palette.id);
  }

  return palette;
}

/**
 * Save neon palette preference to localStorage, apply to DOM, and dispatch event
 */
export function saveStoredNeonPalette(paletteId: string): NeonPalette {
  const palette = applyNeonPalette(paletteId);
  if (typeof window !== 'undefined') {
    try {
      localStorage.setItem(STORAGE_KEY, palette.id);
      window.dispatchEvent(new CustomEvent(CHANGE_EVENT, { detail: palette }));
    } catch (e) {
      console.warn('Failed to save neon palette to storage', e);
    }
  }
  return palette;
}

/**
 * React hook to reactively track and switch active neon palette
 */
export function useNeonTheme() {
  const [currentPalette, setCurrentPalette] = useState<NeonPalette>(() => getStoredNeonPalette());

  useEffect(() => {
    // Ensure applied on mount
    applyNeonPalette(currentPalette.id);

    const handlePaletteChange = (e: Event) => {
      const customEvent = e as CustomEvent<NeonPalette>;
      if (customEvent?.detail) {
        setCurrentPalette(customEvent.detail);
      } else {
        setCurrentPalette(getStoredNeonPalette());
      }
    };

    window.addEventListener(CHANGE_EVENT, handlePaletteChange);
    return () => {
      window.removeEventListener(CHANGE_EVENT, handlePaletteChange);
    };
  }, []);

  const setPalette = (paletteId: string) => {
    const updated = saveStoredNeonPalette(paletteId);
    setCurrentPalette(updated);
  };

  return {
    palette: currentPalette,
    palettes: NEON_PALETTES,
    setPalette,
    applyPalette: setPalette
  };
}
