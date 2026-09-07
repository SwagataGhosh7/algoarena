import { useState, useEffect } from 'react';
import { Volume2, VolumeX } from 'lucide-react';
import clsx from 'clsx';
import { soundManager } from '../lib/soundEffects';

interface SoundToggleProps {
  compact?: boolean;
  className?: string;
  showTester?: boolean;
}

export const SoundToggle = ({ compact = false, className = '' }: SoundToggleProps) => {
  const [muted, setMuted] = useState(soundManager.isMuted());

  useEffect(() => {
    const unsubscribe = soundManager.subscribe(newMuted => {
      setMuted(newMuted);
    });
    return unsubscribe;
  }, []);

  const handleToggle = () => {
    soundManager.toggleMute();
  };

  return (
    <div className="relative inline-flex items-center">
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
    </div>
  );
};

