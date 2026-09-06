import { useState, useEffect, useRef } from 'react';
import { Volume2, VolumeX, Music, Check, Zap, Flame } from 'lucide-react';
import clsx from 'clsx';
import { soundManager } from '../lib/soundEffects';

interface SoundToggleProps {
  compact?: boolean;
  className?: string;
  showTester?: boolean;
}

export const SoundToggle = ({ compact = false, className = '', showTester = true }: SoundToggleProps) => {
  const [muted, setMuted] = useState(soundManager.isMuted());
  const [showTestMenu, setShowTestMenu] = useState(false);
  const [lastTested, setLastTested] = useState<string | null>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const unsubscribe = soundManager.subscribe(newMuted => {
      setMuted(newMuted);
    });
    return unsubscribe;
  }, []);

  useEffect(() => {
    const handleOutsideClick = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setShowTestMenu(false);
      }
    };
    if (showTestMenu) {
      document.addEventListener('mousedown', handleOutsideClick);
    }
    return () => document.removeEventListener('mousedown', handleOutsideClick);
  }, [showTestMenu]);

  const handleToggle = () => {
    soundManager.toggleMute();
  };

  const handleTestSound = (type: 'matchFound' | 'submissionSuccess' | 'duelStart') => {
    soundManager.testAudio(type);
    setLastTested(type);
    setTimeout(() => setLastTested(null), 1200);
  };

  return (
    <div className="relative inline-flex items-center" ref={menuRef}>
      <button
        type="button"
        id="arena-audio-toggle"
        onClick={handleToggle}
        aria-label={muted ? 'Unmute Arena sound effects' : 'Mute Arena sound effects'}
        title={muted ? 'Audio notifications: MUTED (click to enable)' : 'Audio notifications: ACTIVE (click to mute)'}
        className={clsx(
          "flex items-center gap-1.5 font-mono text-[10px] font-bold uppercase transition-all cursor-pointer border select-none",
          compact ? "px-2 py-1" : "px-2.5 py-1",
          muted
            ? "bg-black/60 border-white/10 text-zinc-500 hover:text-zinc-300 hover:border-white/20"
            : "bg-[#00FF00]/10 border-[#00FF00]/40 text-[#00FF00] hover:bg-[#00FF00]/20 shadow-[0_0_8px_rgba(0,255,0,0.15)]",
          className
        )}
      >
        {muted ? (
          <VolumeX className="w-3.5 h-3.5 text-zinc-500 shrink-0" />
        ) : (
          <Volume2 className="w-3.5 h-3.5 text-[#00FF00] shrink-0" />
        )}
        {!compact && (
          <span className="hidden sm:inline tracking-tight">
            {muted ? 'AUDIO: OFF' : 'AUDIO: ON'}
          </span>
        )}
      </button>

      {/* Mini test / preview button */}
      {showTester && !muted && !compact && (
        <button
          type="button"
          onClick={() => setShowTestMenu(prev => !prev)}
          title="Preview critical arena audio notifications"
          className={clsx(
            "ml-1 p-1 border text-[9px] font-mono font-bold uppercase transition-colors cursor-pointer",
            showTestMenu 
              ? "bg-[#00FF00] text-black border-[#00FF00]" 
              : "bg-black/50 border-white/15 text-zinc-400 hover:text-white hover:border-white/30"
          )}
        >
          <Music className="w-3 h-3" />
        </button>
      )}

      {/* Audio FX Test Menu */}
      {showTestMenu && (
        <div className="absolute right-0 top-full mt-1 w-52 bg-zinc-950 border border-[#00FF00]/40 shadow-[0_4px_20px_rgba(0,0,0,0.8)] p-2 z-50 font-mono text-xs flex flex-col gap-1">
          <div className="text-[10px] uppercase font-bold text-zinc-400 px-1 pb-1 border-b border-white/10 flex items-center justify-between">
            <span>ARENA AUDIO NOTIFICATIONS</span>
            <span className="text-[#00FF00] text-[9px]">LIVE FX</span>
          </div>

          <button
            type="button"
            onClick={() => handleTestSound('matchFound')}
            className={clsx(
              "flex items-center justify-between p-1.5 text-left text-[11px] font-bold transition-colors cursor-pointer",
              lastTested === 'matchFound' ? "bg-[#00FF00] text-black" : "hover:bg-white/10 text-zinc-200"
            )}
          >
            <span className="flex items-center gap-1.5">
              <Zap className="w-3 h-3 text-[#00FF00]" />
              <span>Match Found</span>
            </span>
            <span className="text-[9px] opacity-70">PLAY</span>
          </button>

          <button
            type="button"
            onClick={() => handleTestSound('duelStart')}
            className={clsx(
              "flex items-center justify-between p-1.5 text-left text-[11px] font-bold transition-colors cursor-pointer",
              lastTested === 'duelStart' ? "bg-amber-400 text-black" : "hover:bg-white/10 text-zinc-200"
            )}
          >
            <span className="flex items-center gap-1.5">
              <Flame className="w-3 h-3 text-amber-400" />
              <span>Duel Start</span>
            </span>
            <span className="text-[9px] opacity-70">PLAY</span>
          </button>

          <button
            type="button"
            onClick={() => handleTestSound('submissionSuccess')}
            className={clsx(
              "flex items-center justify-between p-1.5 text-left text-[11px] font-bold transition-colors cursor-pointer",
              lastTested === 'submissionSuccess' ? "bg-[#00FF00] text-black" : "hover:bg-white/10 text-zinc-200"
            )}
          >
            <span className="flex items-center gap-1.5">
              <Check className="w-3 h-3 text-[#00FF00]" />
              <span>Submission Success</span>
            </span>
            <span className="text-[9px] opacity-70">PLAY</span>
          </button>
        </div>
      )}
    </div>
  );
};

