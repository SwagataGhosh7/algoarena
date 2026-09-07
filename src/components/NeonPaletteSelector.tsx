import { useState, useRef, useEffect } from 'react';
import { Palette, Check, Sparkles } from 'lucide-react';
import { useNeonTheme, NeonPalette } from '../lib/neonThemes';
import { soundManager } from '../lib/soundEffects';
import { useStore } from '../store';

interface NeonPaletteSelectorProps {
  compact?: boolean;
  className?: string;
}

export function NeonPaletteSelector({ compact = false, className = '' }: NeonPaletteSelectorProps) {
  const [isOpen, setIsOpen] = useState(false);
  const { palette: currentPalette, palettes, setPalette } = useNeonTheme();
  const { accountProfile, saveProfileAndSync } = useStore();
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  const handleSelect = (selected: NeonPalette) => {
    soundManager.playClick();
    setPalette(selected.id);
    setIsOpen(false);

    // If logged in, sync with user profile
    if (accountProfile) {
      saveProfileAndSync({ neonPalette: selected.id }).catch(err => {
        console.warn('Failed to sync neon palette with profile', err);
      });
    }
  };

  return (
    <div className={`relative ${className}`} ref={dropdownRef}>
      {/* Trigger Button */}
      <button
        id="neon-palette-selector-trigger"
        type="button"
        onClick={() => {
          soundManager.playClick();
          setIsOpen(!isOpen);
        }}
        className="flex items-center gap-1.5 px-2.5 py-1 bg-black/60 hover:bg-zinc-900 border text-xs font-mono font-bold uppercase transition-all cursor-pointer select-none"
        style={{
          borderColor: isOpen ? currentPalette.hex : 'rgba(255, 255, 255, 0.15)',
          boxShadow: isOpen ? `0 0 12px rgba(${currentPalette.rgb}, 0.3)` : undefined,
        }}
        title={`Combat Neon Palette: ${currentPalette.name}`}
      >
        <div className="relative flex items-center justify-center">
          <Palette className="w-3.5 h-3.5" style={{ color: currentPalette.hex }} />
          <span 
            className="absolute -top-0.5 -right-0.5 w-1.5 h-1.5 rounded-full"
            style={{ 
              backgroundColor: currentPalette.hex,
              boxShadow: `0 0 6px ${currentPalette.hex}`
            }} 
          />
        </div>

        {!compact && (
          <span className="hidden md:inline text-[11px] text-zinc-300">
            {currentPalette.name.replace('Matrix ', '').replace('Cyber ', '').replace('Solar ', '')}
          </span>
        )}

        <div 
          className="w-2 h-2 rounded-full shrink-0" 
          style={{ 
            backgroundColor: currentPalette.hex,
            boxShadow: `0 0 5px ${currentPalette.hex}`
          }} 
        />
      </button>

      {/* Dropdown Menu */}
      {isOpen && (
        <div
          id="neon-palette-selector-dropdown"
          className="absolute right-0 top-full mt-1.5 w-72 sm:w-80 bg-[#0a0a0c]/98 border border-white/20 rounded-lg shadow-[0_10px_35px_rgba(0,0,0,0.9),0_0_20px_rgba(0,0,0,0.8)] z-50 overflow-hidden font-mono backdrop-blur-xl"
          style={{ borderColor: `rgba(${currentPalette.rgb}, 0.4)` }}
        >
          {/* Header */}
          <div className="px-3.5 py-2.5 bg-black/80 border-b border-white/10 flex items-center justify-between">
            <div className="flex items-center gap-1.5 text-xs font-bold text-white tracking-wider">
              <Sparkles className="w-3.5 h-3.5" style={{ color: currentPalette.hex }} />
              <span className="uppercase">COMPETITIVE PERSONA HUD</span>
            </div>
            <span className="text-[10px] text-zinc-400 font-bold uppercase tracking-wider">
              {palettes.length} PALETTES
            </span>
          </div>

          <div className="p-1.5 max-h-80 overflow-y-auto custom-scrollbar space-y-1">
            {palettes.map((p) => {
              const isSelected = p.id === currentPalette.id;
              return (
                <button
                  key={p.id}
                  id={`neon-palette-option-${p.id}`}
                  type="button"
                  onClick={() => handleSelect(p)}
                  className={`w-full text-left px-3 py-2 rounded flex items-center justify-between gap-3 transition-all cursor-pointer group ${
                    isSelected
                      ? 'bg-white/10 border'
                      : 'hover:bg-white/5 border border-transparent hover:border-white/10'
                  }`}
                  style={{
                    borderColor: isSelected ? p.hex : undefined,
                    boxShadow: isSelected ? `0 0 10px rgba(${p.rgb}, 0.2)` : undefined,
                  }}
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    {/* Glowing Swatch Ring */}
                    <div 
                      className="w-4 h-4 rounded-full shrink-0 flex items-center justify-center border border-black"
                      style={{ 
                        backgroundColor: p.hex,
                        boxShadow: `0 0 8px ${p.hex}`
                      }}
                    />

                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <span className={`text-xs font-bold truncate ${isSelected ? 'text-white' : 'text-zinc-300 group-hover:text-white'}`}>
                          {p.name}
                        </span>
                        <span className="text-[9px] px-1 py-0.2 bg-black border border-white/10 text-zinc-400 rounded">
                          {p.codeName}
                        </span>
                      </div>
                      <div className="text-[10px] text-zinc-500 truncate group-hover:text-zinc-400">
                        {p.tag}
                      </div>
                    </div>
                  </div>

                  {isSelected ? (
                    <div 
                      className="w-5 h-5 rounded-full flex items-center justify-center shrink-0"
                      style={{ 
                        backgroundColor: `rgba(${p.rgb}, 0.2)`,
                        color: p.hex 
                      }}
                    >
                      <Check className="w-3.5 h-3.5" />
                    </div>
                  ) : (
                    <div 
                      className="w-2 h-2 rounded-full opacity-0 group-hover:opacity-100 transition-opacity shrink-0"
                      style={{ backgroundColor: p.hex }}
                    />
                  )}
                </button>
              );
            })}
          </div>

          {/* Footer note */}
          <div className="px-3 py-1.5 bg-black/60 border-t border-white/10 text-[10px] text-zinc-400 flex items-center justify-between">
            <span>Updates Arena HUD & Profile</span>
            <span style={{ color: currentPalette.hex }} className="font-bold">Active</span>
          </div>
        </div>
      )}
    </div>
  );
}
