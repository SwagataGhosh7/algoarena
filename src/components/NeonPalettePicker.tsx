import { useState } from 'react';
import { 
  Palette, 
  Check, 
  Sparkles, 
  Terminal, 
  Play, 
  Flame, 
  Cpu, 
  CheckCircle2, 
  ShieldCheck, 
  RotateCcw
} from 'lucide-react';
import { useNeonTheme, NeonPalette, NEON_PALETTES, DEFAULT_NEON_PALETTE_ID } from '../lib/neonThemes';
import { soundManager } from '../lib/soundEffects';
import { useStore } from '../store';

interface NeonPalettePickerProps {
  isSelf?: boolean;
  ownerUsername?: string;
  className?: string;
  onSelectPalette?: (paletteId: string) => void;
}

export function NeonPalettePicker({
  isSelf = true,
  ownerUsername = 'Operator',
  className = '',
  onSelectPalette
}: NeonPalettePickerProps) {
  const { palette: activePalette, palettes, setPalette } = useNeonTheme();
  const { accountProfile, saveProfileAndSync } = useStore();
  const [hoveredPalette, setHoveredPalette] = useState<NeonPalette | null>(null);
  const [justEquipped, setJustEquipped] = useState(false);

  // The palette currently being previewed
  const previewPalette = hoveredPalette || activePalette;

  const handleEquip = (palette: NeonPalette) => {
    soundManager.playClick();
    setPalette(palette.id);
    setJustEquipped(true);
    setTimeout(() => setJustEquipped(false), 2500);

    if (onSelectPalette) {
      onSelectPalette(palette.id);
    }

    if (isSelf && accountProfile) {
      saveProfileAndSync({ neonPalette: palette.id }).catch(err => {
        console.warn('Failed to sync neon palette preference:', err);
      });
    }
  };

  const handleResetDefault = () => {
    const defaultPal = palettes.find(p => p.id === DEFAULT_NEON_PALETTE_ID) || palettes[0];
    handleEquip(defaultPal);
  };

  return (
    <section 
      id="persona-neon-palette-customizer"
      className={`bg-[#08080c] border border-white/10 p-5 sm:p-6 font-mono relative overflow-hidden transition-all ${className}`}
      style={{
        boxShadow: `0 0 30px rgba(${previewPalette.rgb}, 0.08)`,
        borderColor: `rgba(${previewPalette.rgb}, 0.25)`
      }}
    >
      {/* Background ambient gradient glow */}
      <div 
        className="absolute -top-32 -right-32 w-80 h-80 rounded-full opacity-15 blur-3xl pointer-events-none transition-all duration-700"
        style={{ backgroundColor: previewPalette.hex }}
      />

      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-white/10 pb-4 mb-6 relative z-10">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span 
              className="text-[10px] font-black uppercase tracking-widest px-2 py-0.5 border"
              style={{
                borderColor: `rgba(${activePalette.rgb}, 0.5)`,
                backgroundColor: `rgba(${activePalette.rgb}, 0.1)`,
                color: activePalette.hex
              }}
            >
              COMPETITIVE PERSONA // COLORWAYS
            </span>
            {justEquipped && (
              <span className="text-[10px] font-bold text-white flex items-center gap-1 animate-pulse">
                <CheckCircle2 className="w-3 h-3" style={{ color: activePalette.hex }} />
                <span>PERSONA EQUIPPED</span>
              </span>
            )}
          </div>
          <h2 className="text-lg sm:text-xl font-black italic uppercase tracking-wider text-white flex items-center gap-2">
            <Palette className="w-5 h-5" style={{ color: activePalette.hex }} />
            <span>NEON SIGNATURE PALETTES</span>
          </h2>
          <p className="text-xs text-zinc-400 mt-0.5 max-w-2xl leading-relaxed">
            Customize your competitive identity. Selected colorway updates your Operator Dossier, Telemetry Radar, and Arena combat dashboard.
          </p>
        </div>

        {/* Reset to default button */}
        {isSelf && activePalette.id !== DEFAULT_NEON_PALETTE_ID && (
          <button
            type="button"
            onClick={handleResetDefault}
            className="self-start sm:self-center px-3 py-1.5 bg-white/5 hover:bg-white/10 border border-white/15 text-zinc-300 hover:text-white text-xs font-bold uppercase tracking-wider flex items-center gap-1.5 transition-colors cursor-pointer"
            title="Reset to default Matrix Emerald palette"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Reset Default</span>
          </button>
        )}
      </div>

      {/* Palettes Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5 mb-6 relative z-10">
        {palettes.map((palette) => {
          const isEquipped = palette.id === activePalette.id;
          const isHovered = hoveredPalette?.id === palette.id;

          return (
            <div
              key={palette.id}
              id={`palette-card-${palette.id}`}
              onMouseEnter={() => setHoveredPalette(palette)}
              onMouseLeave={() => setHoveredPalette(null)}
              onClick={() => isSelf && handleEquip(palette)}
              className={`p-4 rounded-lg border transition-all select-none relative overflow-hidden flex flex-col justify-between ${
                isSelf ? 'cursor-pointer' : 'cursor-default'
              } ${
                isEquipped
                  ? 'bg-black/90'
                  : 'bg-black/40 hover:bg-black/70'
              }`}
              style={{
                borderColor: isEquipped
                  ? palette.hex
                  : isHovered
                  ? `rgba(${palette.rgb}, 0.6)`
                  : 'rgba(255, 255, 255, 0.1)',
                boxShadow: isEquipped
                  ? `0 0 20px rgba(${palette.rgb}, 0.25)`
                  : isHovered
                  ? `0 0 14px rgba(${palette.rgb}, 0.15)`
                  : undefined
              }}
            >
              {/* Subtle top indicator bar */}
              <div 
                className="absolute top-0 left-0 right-0 h-1 transition-opacity duration-200"
                style={{
                  backgroundColor: palette.hex,
                  opacity: isEquipped ? 1 : isHovered ? 0.7 : 0.2
                }}
              />

              <div>
                {/* Header with Swatch & Tag */}
                <div className="flex items-center justify-between gap-2 mb-3">
                  <div className="flex items-center gap-3">
                    {/* Concentric Neon Swatch */}
                    <div className="relative flex items-center justify-center">
                      <div 
                        className="w-7 h-7 rounded-full flex items-center justify-center border-2"
                        style={{
                          borderColor: palette.hex,
                          backgroundColor: `rgba(${palette.rgb}, 0.2)`,
                          boxShadow: `0 0 12px ${palette.hex}`
                        }}
                      >
                        <div 
                          className="w-3.5 h-3.5 rounded-full"
                          style={{ backgroundColor: palette.hex }}
                        />
                      </div>
                      {isEquipped && (
                        <span 
                          className="absolute -top-1 -right-1 w-2.5 h-2.5 rounded-full animate-ping opacity-75"
                          style={{ backgroundColor: palette.hex }}
                        />
                      )}
                    </div>

                    <div>
                      <div className="flex items-center gap-1.5">
                        <span className="text-xs font-black uppercase text-white tracking-wide">
                          {palette.name}
                        </span>
                      </div>
                      <span className="text-[10px] text-zinc-500 font-bold tracking-wider">
                        {palette.codeName}
                      </span>
                    </div>
                  </div>

                  {/* Tag badge */}
                  <span 
                    className="text-[9px] font-black uppercase tracking-wider px-1.5 py-0.5 border"
                    style={{
                      borderColor: `rgba(${palette.rgb}, 0.4)`,
                      backgroundColor: `rgba(${palette.rgb}, 0.08)`,
                      color: palette.hex
                    }}
                  >
                    {palette.tag}
                  </span>
                </div>

                {/* Description */}
                <p className="text-[11px] text-zinc-400 leading-relaxed mb-4">
                  {palette.description}
                </p>
              </div>

              {/* Action / Equipped Status */}
              <div className="pt-2 border-t border-white/5 flex items-center justify-between">
                {isEquipped ? (
                  <div 
                    className="flex items-center gap-1.5 text-xs font-black uppercase tracking-wider"
                    style={{ color: palette.hex }}
                  >
                    <Check className="w-4 h-4 stroke-[3]" />
                    <span>ACTIVE PERSONA</span>
                  </div>
                ) : isSelf ? (
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleEquip(palette);
                    }}
                    className="w-full py-1.5 px-3 bg-white/5 hover:bg-white/15 border border-white/10 text-zinc-300 hover:text-white text-xs font-bold uppercase tracking-wider rounded transition-all flex items-center justify-center gap-1.5 group cursor-pointer"
                    style={{
                      borderColor: isHovered ? `rgba(${palette.rgb}, 0.5)` : undefined,
                    }}
                  >
                    <Sparkles className="w-3 h-3 transition-transform group-hover:scale-110" style={{ color: palette.hex }} />
                    <span>Equip Colorway</span>
                  </button>
                ) : (
                  <span className="text-[10px] text-zinc-500 uppercase">Available for selection</span>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Live Persona Combat Preview Mockup */}
      <div 
        className="p-4 bg-black/80 border rounded-lg relative overflow-hidden transition-all duration-300"
        style={{
          borderColor: `rgba(${previewPalette.rgb}, 0.35)`,
          boxShadow: `0 0 20px rgba(${previewPalette.rgb}, 0.1)`
        }}
      >
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-3 pb-2 border-b border-white/10">
          <div className="flex items-center gap-2">
            <Cpu className="w-4 h-4" style={{ color: previewPalette.hex }} />
            <span className="text-xs font-black uppercase text-white tracking-wider">
              LIVE COMBAT HUD PREVIEW // {previewPalette.name.toUpperCase()}
            </span>
            {hoveredPalette && hoveredPalette.id !== activePalette.id && (
              <span className="text-[10px] text-zinc-400">(Hovering Preview)</span>
            )}
          </div>
          <span className="text-[10px] text-zinc-500">
            Previewing: {ownerUsername} Persona
          </span>
        </div>

        {/* Mock arena controls and tags */}
        <div className="flex flex-wrap items-center gap-3 justify-between">
          {/* Mock Operator Tag */}
          <div className="flex items-center gap-2">
            <div 
              className="w-7 h-7 rounded flex items-center justify-center border font-black text-xs"
              style={{
                borderColor: previewPalette.hex,
                backgroundColor: `rgba(${previewPalette.rgb}, 0.15)`,
                color: previewPalette.hex,
                boxShadow: `0 0 10px rgba(${previewPalette.rgb}, 0.3)`
              }}
            >
              {ownerUsername.charAt(0).toUpperCase()}
            </div>
            <div>
              <span className="text-xs font-black text-white">#{ownerUsername}</span>
              <div className="flex items-center gap-1.5 text-[10px]">
                <span style={{ color: previewPalette.hex }} className="font-bold">2,140 ELO</span>
                <span className="text-zinc-600">•</span>
                <span className="text-zinc-400">82% Win Rate</span>
              </div>
            </div>
          </div>

          {/* Mock Arena Action Buttons */}
          <div className="flex items-center gap-2">
            <div 
              className="px-3 py-1.5 rounded border text-xs font-bold uppercase flex items-center gap-1.5"
              style={{
                borderColor: `rgba(${previewPalette.rgb}, 0.5)`,
                backgroundColor: 'rgba(18, 18, 18, 0.9)',
                color: previewPalette.hex,
                boxShadow: `0 0 10px rgba(${previewPalette.rgb}, 0.15)`
              }}
            >
              <Terminal className="w-3.5 h-3.5" />
              <span>RUN CODE</span>
            </div>

            <div 
              className="px-4 py-1.5 rounded text-xs font-black uppercase flex items-center gap-1.5"
              style={{
                backgroundColor: previewPalette.hex,
                color: previewPalette.contrastText,
                boxShadow: `0 0 16px rgba(${previewPalette.rgb}, 0.4)`
              }}
            >
              <Play className="w-3.5 h-3.5 fill-current" />
              <span>SUBMIT</span>
            </div>
          </div>

          {/* Mock telemetry pill */}
          <div 
            className="hidden md:flex items-center gap-2 px-3 py-1 border rounded text-[11px]"
            style={{
              borderColor: `rgba(${previewPalette.rgb}, 0.3)`,
              backgroundColor: `rgba(${previewPalette.rgb}, 0.06)`,
              color: previewPalette.hex
            }}
          >
            <ShieldCheck className="w-3.5 h-3.5" />
            <span className="font-bold">ALL 5/5 TEST CASES PASSED (100%)</span>
          </div>
        </div>
      </div>
    </section>
  );
}
