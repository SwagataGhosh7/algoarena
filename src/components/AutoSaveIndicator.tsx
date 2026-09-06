import React, { useState, useEffect } from 'react';
import { 
  Check, 
  CloudUpload, 
  RotateCcw, 
  X, 
  Sparkles,
  HardDrive
} from 'lucide-react';
import { formatAutoSaveTime } from '../lib/codeAutoSave';
import { soundManager } from '../lib/soundEffects';

export type AutoSaveState = 'saved' | 'saving' | 'unsaved' | 'restored';

interface AutoSaveStatusBadgeProps {
  status: AutoSaveState;
  lastSavedTimestamp: number | null;
  onManualSave?: () => void;
  disabled?: boolean;
}

export const AutoSaveStatusBadge: React.FC<AutoSaveStatusBadgeProps> = ({
  status,
  lastSavedTimestamp,
  onManualSave,
  disabled = false,
}) => {
  const [relativeTime, setRelativeTime] = useState<string>('Just now');
  const [showTooltip, setShowTooltip] = useState(false);

  useEffect(() => {
    if (!lastSavedTimestamp) return;

    const updateTime = () => {
      setRelativeTime(formatAutoSaveTime(lastSavedTimestamp));
    };

    updateTime();
    const interval = setInterval(updateTime, 5000);
    return () => clearInterval(interval);
  }, [lastSavedTimestamp]);

  const handleClick = () => {
    if (disabled || !onManualSave) return;
    soundManager.playClick();
    onManualSave();
  };

  return (
    <div 
      className="relative inline-flex items-center"
      onMouseEnter={() => setShowTooltip(true)}
      onMouseLeave={() => setShowTooltip(false)}
    >
      <button
        type="button"
        onClick={handleClick}
        disabled={disabled}
        className={`flex items-center gap-1.5 px-2 py-1 rounded text-[10px] font-mono border transition-all select-none ${
          status === 'saving'
            ? 'bg-amber-500/10 text-amber-300 border-amber-500/30 animate-pulse'
            : status === 'restored'
            ? 'bg-[#00FF00]/15 text-[#00FF00] border-[#00FF00]/40 shadow-[0_0_8px_rgba(0,255,0,0.2)]'
            : 'bg-black/50 text-zinc-400 border-white/10 hover:border-[#00FF00]/40 hover:text-white'
        } disabled:opacity-50 cursor-pointer`}
        title="Local Storage Auto-Save active (Ctrl+S / Cmd+S)"
      >
        {status === 'saving' ? (
          <>
            <CloudUpload className="w-3 h-3 text-amber-400 animate-spin" />
            <span className="hidden sm:inline">SAVING...</span>
          </>
        ) : (
          <>
            <span className="w-1.5 h-1.5 rounded-full bg-[#00FF00] inline-block shadow-[0_0_6px_#00FF00]" />
            <span className="hidden sm:inline text-zinc-400">AUTO-SAVED:</span>
            <span className="text-[#00FF00] font-bold">{relativeTime}</span>
          </>
        )}
      </button>

      {/* Tooltip on hover */}
      {showTooltip && (
        <div className="absolute right-0 top-full mt-1.5 px-2.5 py-1.5 bg-[#141414] border border-white/20 rounded shadow-xl text-[11px] font-mono text-zinc-300 z-50 whitespace-nowrap pointer-events-none">
          <div className="flex items-center gap-1.5 text-white font-bold mb-0.5">
            <HardDrive className="w-3 h-3 text-[#00FF00]" />
            <span>Local Storage Auto-Save</span>
          </div>
          <p className="text-[10px] text-zinc-400">
            Progress is continuously cached. Click or press <kbd className="px-1 py-0.5 bg-white/10 rounded text-[9px] text-white">Cmd+S</kbd> to save immediately.
          </p>
          {lastSavedTimestamp && (
            <div className="text-[9px] text-zinc-400 mt-1 border-t border-white/10 pt-1">
              Exact save: {new Date(lastSavedTimestamp).toLocaleTimeString()}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

interface AutoSaveRecoveryBannerProps {
  timestamp: number;
  lineCount: number;
  language: string;
  onKeep: () => void;
  onDiscard: () => void;
}

export const AutoSaveRecoveryBanner: React.FC<AutoSaveRecoveryBannerProps> = ({
  timestamp,
  lineCount,
  language,
  onKeep,
  onDiscard,
}) => {
  return (
    <div className="px-3.5 py-2 bg-gradient-to-r from-emerald-950/70 via-black to-[#0c180e] border-b border-[#00FF00]/30 flex flex-wrap items-center justify-between gap-2.5 text-xs font-mono animate-in slide-in-from-top duration-200">
      <div className="flex items-center gap-2">
        <Sparkles className="w-4 h-4 text-[#00FF00] shrink-0 animate-pulse" />
        <div className="flex items-center gap-1.5 flex-wrap">
          <span className="text-[#00FF00] font-bold tracking-wide">
            DRAFT RECOVERED:
          </span>
          <span className="text-zinc-300">
            Restored your unsubmitted {language.toUpperCase()} progress ({lineCount} lines, saved {formatAutoSaveTime(timestamp)}).
          </span>
        </div>
      </div>

      <div className="flex items-center gap-2 shrink-0">
        <button
          type="button"
          onClick={onKeep}
          className="px-2.5 py-1 bg-[#00FF00]/20 hover:bg-[#00FF00]/30 text-[#00FF00] border border-[#00FF00]/40 rounded text-[11px] font-bold transition-colors cursor-pointer"
        >
          KEEP DRAFT
        </button>

        <button
          type="button"
          onClick={onDiscard}
          className="flex items-center gap-1 px-2.5 py-1 bg-white/5 hover:bg-white/10 text-zinc-400 hover:text-white border border-white/10 rounded text-[11px] transition-colors cursor-pointer"
          title="Discard recovered draft and reset to default starter template"
        >
          <RotateCcw className="w-3 h-3" />
          <span>RESET TO TEMPLATE</span>
        </button>

        <button
          type="button"
          onClick={onKeep}
          className="p-1 text-zinc-400 hover:text-white rounded transition-colors"
          title="Dismiss notification"
        >
          <X className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
};
