import { useState, useRef, useEffect } from 'react';
import { Palette, Check, ChevronDown, Sparkles } from 'lucide-react';
import clsx from 'clsx';
import { EDITOR_THEMES, EditorThemeOption } from '../lib/editorThemes';

interface EditorThemeSelectorProps {
  currentTheme: string;
  onSelectTheme: (themeId: string) => void;
}

export const EditorThemeSelector = ({ currentTheme, onSelectTheme }: EditorThemeSelectorProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const activeTheme = EDITOR_THEMES.find(t => t.id === currentTheme) || EDITOR_THEMES[0];

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      document.addEventListener('keydown', handleKeyDown);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen]);

  const handleSelect = (themeId: string) => {
    onSelectTheme(themeId);
    setIsOpen(false);
  };

  return (
    <div className="relative font-mono" ref={containerRef}>
      {/* Selector Trigger Button */}
      <button
        type="button"
        id="theme-selector-trigger"
        onClick={() => setIsOpen(prev => !prev)}
        aria-label="Select Editor Theme"
        aria-expanded={isOpen}
        className={clsx(
          "flex items-center gap-2 px-2.5 py-1 text-xs font-bold border transition-all cursor-pointer select-none",
          isOpen
            ? "bg-[#1f1f1f] text-white border-[#00FF00] shadow-[0_0_10px_rgba(0,255,0,0.25)]"
            : "bg-[#181818] text-zinc-300 border-white/10 hover:border-white/30 hover:text-white"
        )}
      >
        <Palette className="w-3.5 h-3.5 text-[#00FF00] shrink-0" />
        <span className="hidden sm:inline text-[10px] text-zinc-500 uppercase tracking-tight">THEME:</span>
        <span className="text-white font-bold">{activeTheme.name}</span>

        {/* Visual Swatch Preview of Current Theme */}
        <span className="flex items-center -space-x-1 ml-1" title={`${activeTheme.name} palette`}>
          {activeTheme.swatch.slice(1, 4).map((c, i) => (
            <span
              key={i}
              className="w-2 h-2 rounded-full border border-black/60 shadow-xs"
              style={{ backgroundColor: c }}
            />
          ))}
        </span>

        <ChevronDown className={clsx("w-3 h-3 text-zinc-400 transition-transform duration-150", isOpen && "rotate-180")} />
      </button>

      {/* Dropdown Menu */}
      {isOpen && (
        <div
          id="theme-selector-dropdown"
          className="absolute right-0 top-full mt-1.5 w-64 bg-[#111111] border border-white/20 shadow-[0_10px_30px_rgba(0,0,0,0.8)] z-50 p-2 space-y-1 backdrop-blur-md"
        >
          <div className="flex items-center justify-between px-2 py-1 border-b border-white/10 mb-1 text-[10px] text-zinc-400 font-bold uppercase tracking-wider">
            <span className="flex items-center gap-1 text-[#00FF00]">
              <Sparkles className="w-3 h-3" />
              SYNTAX THEMES
            </span>
            <span className="text-[9px] text-zinc-500">LIVE SWITCH</span>
          </div>

          <div className="space-y-1">
            {EDITOR_THEMES.map((theme: EditorThemeOption) => {
              const isSelected = theme.id === currentTheme;
              return (
                <button
                  key={theme.id}
                  type="button"
                  id={`theme-option-${theme.id}`}
                  onClick={() => handleSelect(theme.id)}
                  className={clsx(
                    "w-full flex items-center justify-between px-2.5 py-2 text-xs border text-left transition-all cursor-pointer group",
                    isSelected
                      ? "bg-white/10 border-[#00FF00] text-white shadow-[0_0_12px_rgba(0,255,0,0.15)]"
                      : "bg-transparent border-transparent hover:bg-white/5 hover:border-white/10 text-zinc-300 hover:text-white"
                  )}
                >
                  <div className="flex items-center gap-2">
                    {/* Background Preview Chip */}
                    <div
                      className="w-4 h-4 rounded-xs border border-white/20 flex items-center justify-center shrink-0 shadow-inner"
                      style={{ backgroundColor: theme.bg }}
                    >
                      <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: theme.accent }} />
                    </div>

                    <div>
                      <div className="flex items-center gap-1.5 leading-none">
                        <span className="font-bold">{theme.name}</span>
                        {theme.badge && (
                          <span
                            className={clsx(
                              "text-[8px] px-1 py-0.5 uppercase rounded-xs font-bold leading-none",
                              theme.id === 'monokai' ? "bg-amber-500/20 text-amber-300 border border-amber-500/30" :
                              theme.id === 'dracula' ? "bg-purple-500/20 text-purple-300 border border-purple-500/30" :
                              theme.id === 'github-dark' ? "bg-blue-500/20 text-blue-300 border border-blue-500/30" :
                              theme.id === 'algoarena-cyber' ? "bg-[#00FF00]/20 text-[#00FF00] border border-[#00FF00]/30" :
                              "bg-zinc-800 text-zinc-400"
                            )}
                          >
                            {theme.badge}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    {/* Multi-color Palette Swatches */}
                    <div className="flex items-center -space-x-1">
                      {theme.swatch.map((color, idx) => (
                        <div
                          key={idx}
                          className="w-2.5 h-2.5 rounded-full border border-black/70 shrink-0"
                          style={{ backgroundColor: color }}
                          title={color}
                        />
                      ))}
                    </div>

                    {/* Selection Indicator */}
                    <div className="w-4 flex items-center justify-center">
                      {isSelected && <Check className="w-3.5 h-3.5 text-[#00FF00]" />}
                    </div>
                  </div>
                </button>
              );
            })}
          </div>

          <div className="pt-1.5 px-2 text-[9px] text-zinc-500 border-t border-white/5 flex items-center justify-between">
            <span>Themes persist automatically</span>
            <span className="text-[#00FF00]">ESC to close</span>
          </div>
        </div>
      )}
    </div>
  );
};
