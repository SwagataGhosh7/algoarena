import React from 'react';
import { Palette } from 'lucide-react';
import clsx from 'clsx';
import { useNeonTheme } from '../lib/neonThemes';

interface ThemeToggleProps {
  className?: string;
  compact?: boolean;
}

export function ThemeToggle({ className = '', compact = false }: ThemeToggleProps) {
  const { palette, setPalette } = useNeonTheme();

  const isBlueViolet = palette.id === 'blue-violet';

  const handleToggle = () => {
    if (isBlueViolet) {
      setPalette('matrix-green');
    } else {
      setPalette('blue-violet');
    }
  };

  return (
    <button
      type="button"
      id="algoarena-theme-toggle"
      onClick={handleToggle}
      title={`Current Theme: ${isBlueViolet ? 'Blue & Violet' : 'Classic Green'}. Click to toggle theme.`}
      className={clsx(
        "inline-flex items-center gap-2 font-mono text-[10px] font-bold uppercase transition-all cursor-pointer border select-none",
        compact ? "px-2 py-1" : "px-2.5 py-1",
        isBlueViolet
          ? "bg-gradient-to-r from-[#00D2FF]/15 to-[#A855F7]/15 text-cyan-300 border-[#00D2FF]/40 hover:border-[#A855F7] shadow-[0_0_10px_rgba(0,210,255,0.2)]"
          : "bg-[#00FF00]/10 text-[#00FF00] border-[#00FF00]/40 hover:border-[#00FF00] shadow-[0_0_8px_rgba(0,255,0,0.15)]",
        className
      )}
    >
      {/* Visual Indicator Dots */}
      <div className="flex items-center gap-1">
        {isBlueViolet ? (
          <div className="flex items-center -space-x-1">
            <span className="w-2.5 h-2.5 rounded-full bg-[#00D2FF] shadow-[0_0_6px_#00D2FF]" />
            <span className="w-2.5 h-2.5 rounded-full bg-[#A855F7] shadow-[0_0_6px_#A855F7]" />
          </div>
        ) : (
          <span className="w-2.5 h-2.5 rounded-full bg-[#00FF00] shadow-[0_0_6px_#00FF00]" />
        )}
      </div>

      {!compact && (
        <span className="tracking-wider">
          {isBlueViolet ? 'THEME: BLUE & VIOLET' : 'THEME: GREEN'}
        </span>
      )}

      <Palette className={clsx("w-3 h-3 opacity-70", isBlueViolet ? "text-purple-300" : "text-[#00FF00]")} />
    </button>
  );
}
