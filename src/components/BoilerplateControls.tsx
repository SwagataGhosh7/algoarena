import React, { useState, useRef, useEffect } from 'react';
import { 
  Sparkles, 
  ChevronDown, 
  Check, 
  Undo2, 
  FileCode, 
  RotateCcw, 
  Zap, 
  Info, 
  X,
  Sliders
} from 'lucide-react';
import { 
  BoilerplateStyle, 
  LANGUAGE_BOILERPLATE_METAS,
  LanguageBoilerplateMeta 
} from '../lib/languageBoilerplates';
import { soundManager } from '../lib/soundEffects';

interface BoilerplateControlsProps {
  currentLanguage: string;
  autoInjectEnabled: boolean;
  onToggleAutoInject: (enabled: boolean) => void;
  boilerplateStyle: BoilerplateStyle;
  onChangeStyle: (style: BoilerplateStyle) => void;
  onInjectBoilerplate: (style?: BoilerplateStyle) => void;
  disabled?: boolean;
}

export const BoilerplateControls: React.FC<BoilerplateControlsProps> = ({
  currentLanguage,
  autoInjectEnabled,
  onToggleAutoInject,
  boilerplateStyle,
  onChangeStyle,
  onInjectBoilerplate,
  disabled = false,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const meta: LanguageBoilerplateMeta | undefined = 
    LANGUAGE_BOILERPLATE_METAS[currentLanguage.toLowerCase()] ||
    LANGUAGE_BOILERPLATE_METAS.javascript;

  // Close popover on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen]);

  const handleTriggerClick = () => {
    if (disabled) return;
    soundManager.playClick();
    setIsOpen(prev => !prev);
  };

  const handleQuickInject = (style: BoilerplateStyle) => {
    soundManager.playClick();
    onInjectBoilerplate(style);
    setIsOpen(false);
  };

  const handleToggleAuto = () => {
    soundManager.playClick();
    onToggleAutoInject(!autoInjectEnabled);
  };

  return (
    <div className="relative inline-flex items-center" ref={containerRef}>
      {/* Trigger Button */}
      <button
        id="boilerplate-controls-btn"
        type="button"
        disabled={disabled}
        onClick={handleTriggerClick}
        className={`group flex items-center gap-1.5 px-2 py-1 rounded text-[10px] font-mono font-bold uppercase transition-all border select-none cursor-pointer ${
          autoInjectEnabled
            ? 'bg-emerald-950/40 text-emerald-300 border-emerald-500/40 hover:bg-emerald-900/50 hover:border-emerald-400'
            : 'bg-black/60 text-zinc-400 border-white/10 hover:text-white hover:border-white/25'
        } ${isOpen ? 'ring-1 ring-[#00FF00]' : ''}`}
        title={`Language Boilerplate Generator: Auto-Inject is ${autoInjectEnabled ? 'ON' : 'OFF'}`}
      >
        <Sparkles className={`w-3 h-3 transition-colors ${autoInjectEnabled ? 'text-[#00FF00] animate-pulse' : 'text-zinc-500'}`} />
        <span className="hidden sm:inline">BOILERPLATE</span>
        <span className={`text-[9px] px-1 py-0.2 rounded font-mono ${
          autoInjectEnabled ? 'bg-[#00FF00]/20 text-[#00FF00]' : 'bg-white/5 text-zinc-500'
        }`}>
          {autoInjectEnabled ? 'AUTO' : 'MANUAL'}
        </span>
        <ChevronDown className={`w-2.5 h-2.5 transition-transform duration-200 ${isOpen ? 'rotate-180 text-white' : 'text-zinc-400'}`} />
      </button>

      {/* Popover Menu */}
      {isOpen && (
        <div 
          id="boilerplate-popover-menu"
          className="absolute right-0 top-full mt-2 w-80 bg-[#111111] border border-[#00FF00]/40 rounded-lg shadow-[0_10px_35px_rgba(0,0,0,0.85)] z-50 overflow-hidden text-xs font-mono backdrop-blur-md animate-in fade-in zoom-in-95 duration-150"
        >
          {/* Header */}
          <div className="p-3 bg-[#181818] border-b border-white/10 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Zap className="w-3.5 h-3.5 text-[#00FF00]" />
              <span className="font-bold text-white uppercase tracking-wider text-xs">
                Code Boilerplate Engine
              </span>
            </div>
            <span className="text-[10px] text-[#00FF00] font-bold px-1.5 py-0.5 rounded bg-[#00FF00]/10 border border-[#00FF00]/20">
              {meta?.name || currentLanguage}
            </span>
          </div>

          {/* Auto-Inject Switch Row */}
          <div className="p-3 bg-black/40 border-b border-white/10 flex items-center justify-between gap-3">
            <div>
              <div className="text-white font-bold flex items-center gap-1.5">
                <span>Auto-Inject on Switch</span>
                {autoInjectEnabled && (
                  <span className="w-1.5 h-1.5 rounded-full bg-[#00FF00] shadow-[0_0_6px_#00FF00]" />
                )}
              </div>
              <div className="text-[10px] text-zinc-400 mt-0.5 leading-tight">
                Automatically loads standard imports and class structures when selecting another language.
              </div>
            </div>

            <button
              id="toggle-auto-boilerplate-switch"
              type="button"
              onClick={handleToggleAuto}
              className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                autoInjectEnabled ? 'bg-[#00FF00]' : 'bg-zinc-700'
              }`}
            >
              <span
                className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-black shadow-lg ring-0 transition duration-200 ease-in-out ${
                  autoInjectEnabled ? 'translate-x-4' : 'translate-x-0'
                }`}
              />
            </button>
          </div>

          {/* Current Language Capabilities Summary */}
          {meta && (
            <div className="p-3 bg-zinc-950/60 border-b border-white/5 space-y-2">
              <div className="text-[10px] text-zinc-400 uppercase tracking-widest flex items-center justify-between">
                <span>{meta.name} ({meta.version}) SPECS:</span>
                <span className="text-emerald-400 text-[10px] font-bold">READY</span>
              </div>

              {/* Class & Entry Point preview */}
              <div className="p-2 rounded bg-black/80 border border-white/10 text-[11px] space-y-1">
                <div className="text-zinc-300">
                  <span className="text-zinc-500 uppercase text-[9px] block">Class / Architecture:</span>
                  <span className="text-emerald-300 font-bold">{meta.classStructure}</span>
                </div>
                <div className="text-zinc-300 pt-1 border-t border-white/5">
                  <span className="text-zinc-500 uppercase text-[9px] block">Test Harness Hook:</span>
                  <span className="text-sky-300">{meta.entryPoint}</span>
                </div>
              </div>

              {/* Features Chips */}
              <div className="flex flex-wrap gap-1 pt-1">
                {meta.features.map(f => (
                  <span 
                    key={f} 
                    className="text-[9px] px-1.5 py-0.5 rounded bg-white/5 border border-white/10 text-zinc-300"
                  >
                    • {f}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Boilerplate Style Selector */}
          <div className="p-3 bg-[#141414] border-b border-white/10 space-y-2">
            <div className="text-[10px] text-zinc-400 uppercase tracking-widest flex items-center justify-between">
              <span>TEMPLATE FLAVOR:</span>
              <span className="text-zinc-400 font-bold uppercase">{boilerplateStyle}</span>
            </div>

            <div className="grid grid-cols-3 gap-1.5">
              {[
                { id: 'full', label: 'Full Class', desc: 'Imports + Class + Stubs' },
                { id: 'competitive', label: 'Fast I/O', desc: 'Optimized CP setup' },
                { id: 'minimal', label: 'Minimal', desc: 'Compact function stub' },
              ].map(item => {
                const isSelected = boilerplateStyle === item.id;
                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => {
                      soundManager.playClick();
                      onChangeStyle(item.id as BoilerplateStyle);
                    }}
                    className={`p-1.5 rounded text-left border transition-all ${
                      isSelected
                        ? 'bg-[#00FF00]/15 border-[#00FF00]/50 text-white'
                        : 'bg-white/5 border-white/10 text-zinc-400 hover:text-white hover:bg-white/10'
                    }`}
                  >
                    <div className="font-bold text-[10px] text-white flex items-center justify-between">
                      <span>{item.label}</span>
                      {isSelected && <Check className="w-2.5 h-2.5 text-[#00FF00]" />}
                    </div>
                    <div className="text-[8px] text-zinc-500 leading-tight mt-0.5">
                      {item.desc}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Action: Inject Now Button */}
          <div className="p-3 bg-[#111111] flex items-center gap-2">
            <button
              type="button"
              onClick={() => handleQuickInject(boilerplateStyle)}
              className="flex-1 flex items-center justify-center gap-1.5 py-1.5 px-3 rounded bg-[#00FF00] hover:bg-[#00FF00]/90 text-black font-bold text-xs uppercase tracking-wider shadow-[0_0_15px_rgba(0,255,0,0.3)] transition-all cursor-pointer"
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>Inject {meta?.name || 'Code'} Now</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

interface BoilerplateNotificationBannerProps {
  language: string;
  features?: string[];
  onUndo?: () => void;
  onDismiss: () => void;
}

export const BoilerplateNotificationBanner: React.FC<BoilerplateNotificationBannerProps> = ({
  language,
  features,
  onUndo,
  onDismiss,
}) => {
  useEffect(() => {
    const timer = setTimeout(() => {
      onDismiss();
    }, 6500);
    return () => clearTimeout(timer);
  }, [onDismiss]);

  const meta = LANGUAGE_BOILERPLATE_METAS[language.toLowerCase()];
  const langName = meta?.name || language;

  return (
    <div 
      id="boilerplate-injection-notification"
      className="bg-emerald-950/90 border-y border-emerald-500/40 text-emerald-200 px-3 py-2 text-xs font-mono flex flex-wrap items-center justify-between gap-2 shadow-[0_4px_16px_rgba(0,0,0,0.5)] backdrop-blur-md animate-in slide-in-from-top duration-200"
    >
      <div className="flex items-center gap-2">
        <div className="w-5 h-5 rounded bg-emerald-500/20 border border-emerald-400 flex items-center justify-center shrink-0">
          <Sparkles className="w-3 h-3 text-[#00FF00] animate-pulse" />
        </div>
        <div>
          <span className="font-bold text-white">
            Injected {langName} Boilerplate:
          </span>{' '}
          <span className="text-emerald-300">
            Standard imports and {meta?.classStructure ? 'Solution class structure' : 'runtime wrapper'} ready.
          </span>
        </div>
      </div>

      <div className="flex items-center gap-2">
        {onUndo && (
          <button
            type="button"
            onClick={() => {
              soundManager.playClick();
              onUndo();
            }}
            className="flex items-center gap-1 px-2 py-1 rounded bg-black/60 hover:bg-black border border-white/20 text-xs font-bold text-white transition-colors cursor-pointer"
            title="Revert back to your previous code buffer"
          >
            <Undo2 className="w-3 h-3 text-amber-400" />
            <span>Undo</span>
          </button>
        )}

        <button
          type="button"
          onClick={onDismiss}
          className="p-1 text-zinc-400 hover:text-white transition-colors cursor-pointer"
          title="Dismiss notification"
        >
          <X className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
};
