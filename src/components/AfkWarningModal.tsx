import { useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { AlertTriangle, Clock, Zap, Flag, ShieldAlert } from 'lucide-react';
import { soundManager } from '../lib/soundEffects';

interface AfkWarningModalProps {
  isOpen: boolean;
  remainingSeconds: number;
  totalCountdownSeconds?: number;
  onResume: () => void;
  onForfeit?: () => void;
}

export function AfkWarningModal({
  isOpen,
  remainingSeconds,
  totalCountdownSeconds = 30,
  onResume,
  onForfeit,
}: AfkWarningModalProps) {
  // Listen for any keyboard activity to immediately resume
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = () => {
      onResume();
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onResume]);

  if (!isOpen) return null;

  const percentage = Math.max(0, Math.min(100, (remainingSeconds / totalCountdownSeconds) * 100));
  const formattedSeconds = remainingSeconds.toString().padStart(2, '0');
  const isCritical = remainingSeconds <= 10;

  return (
    <AnimatePresence>
      {/* Full screen ambient warning vignette */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 pointer-events-none border-4 border-red-500/40 shadow-[inset_0_0_90px_rgba(239,68,68,0.35)] animate-pulse"
      />

      {/* Floating Top Warning Bar */}
      <motion.div
        initial={{ y: -60, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: -60, opacity: 0 }}
        className="fixed top-0 left-0 right-0 z-50 bg-gradient-to-r from-red-950/95 via-red-900/90 to-red-950/95 border-b-2 border-red-500 px-4 py-2 flex items-center justify-between font-mono text-xs shadow-2xl backdrop-blur-md"
      >
        <div className="flex items-center gap-2.5 text-red-300">
          <AlertTriangle className="w-4 h-4 text-red-400 animate-bounce" />
          <span className="font-black tracking-wider uppercase text-white">
            FAIR PLAY ENFORCEMENT // INACTIVITY DETECTED
          </span>
        </div>

        <div className="flex items-center gap-3">
          <span className="text-zinc-300 text-[11px] hidden sm:inline">
            Auto-forfeit in:
          </span>
          <span className="text-red-400 font-black text-sm tracking-widest bg-black/60 px-2.5 py-0.5 border border-red-500/50">
            00:{formattedSeconds}
          </span>
          <button
            type="button"
            onClick={onResume}
            className="px-3 py-1 bg-red-500 hover:bg-red-400 text-black font-black uppercase text-[11px] tracking-wider transition-colors cursor-pointer shadow-[0_0_12px_rgba(239,68,68,0.5)]"
          >
            RESUME NOW
          </button>
        </div>
      </motion.div>

      {/* Centered Modal Backdrop & Dialog */}
      <div 
        className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-4 font-mono select-none"
        onClick={onResume}
      >
        <motion.div
          initial={{ scale: 0.92, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.92, opacity: 0 }}
          transition={{ type: 'spring', damping: 25, stiffness: 350 }}
          onClick={e => e.stopPropagation()}
          className="w-full max-w-md bg-[#090909] border-2 border-red-500/80 shadow-[0_0_50px_rgba(239,68,68,0.35)] p-6 relative overflow-hidden"
        >
          {/* Subtle Cyber Grid Background */}
          <div className="absolute inset-0 bg-[radial-gradient(#ff000015_1px,transparent_1px)] [background-size:16px_16px] pointer-events-none opacity-40" />

          {/* Header */}
          <div className="relative z-10 flex items-center gap-3 mb-4 border-b border-red-500/20 pb-4">
            <div className="w-12 h-12 rounded-none bg-red-500/10 border-2 border-red-500 flex items-center justify-center text-red-500 shrink-0 shadow-[0_0_15px_rgba(239,68,68,0.3)]">
              <ShieldAlert className="w-7 h-7 animate-pulse" />
            </div>
            <div>
              <div className="text-[10px] text-red-400 font-bold tracking-widest uppercase">
                FAIR PLAY MONITOR // ACTIVE DUEL
              </div>
              <h3 className="text-base font-black text-white uppercase tracking-wider">
                INACTIVITY WARNING
              </h3>
            </div>
          </div>

          {/* Description */}
          <div className="relative z-10 text-xs text-zinc-300 leading-relaxed mb-6 space-y-2">
            <p>
              No terminal activity or keystrokes detected in the last <strong className="text-white">60 seconds</strong>.
            </p>
            <p className="text-[11px] text-zinc-400">
              To prevent AFK stalling and ensure fair play for all competitors, you will be automatically forfeited if you do not confirm activity.
            </p>
          </div>

          {/* Countdown Clock & Visual Progress Meter */}
          <div className="relative z-10 bg-black/90 border border-red-500/40 p-4 mb-6 text-center">
            <div className="text-[10px] uppercase text-zinc-500 tracking-wider mb-1">
              AUTOMATIC FORFEIT PENALTY IN
            </div>

            <div className="flex items-center justify-center gap-2">
              <Clock className={`w-6 h-6 ${isCritical ? 'text-red-500 animate-spin' : 'text-red-400'}`} />
              <div className={`text-4xl font-black tracking-widest ${isCritical ? 'text-red-500 animate-pulse' : 'text-white'}`}>
                00:{formattedSeconds}
              </div>
            </div>

            {/* Linear Progress Countdown Bar */}
            <div className="w-full bg-zinc-900 h-2 mt-3 border border-white/10 overflow-hidden">
              <motion.div
                className={`h-full ${isCritical ? 'bg-red-600' : 'bg-red-500'}`}
                style={{ width: `${percentage}%` }}
                transition={{ duration: 0.3 }}
              />
            </div>
          </div>

          {/* Actions */}
          <div className="relative z-10 space-y-2.5">
            <button
              type="button"
              onClick={() => {
                soundManager.playClick();
                onResume();
              }}
              className="w-full py-3.5 bg-red-600 hover:bg-red-500 text-black font-black uppercase text-sm tracking-wider transition-all cursor-pointer flex items-center justify-center gap-2 shadow-[0_0_20px_rgba(239,68,68,0.5)] active:scale-[0.99]"
            >
              <Zap className="w-4 h-4 fill-black" />
              <span>I AM HERE // RESUME DUEL</span>
            </button>

            <div className="flex items-center justify-between text-[10px] text-zinc-500 pt-1">
              <span>Press <kbd className="text-white bg-zinc-800 px-1.5 py-0.5 border border-white/10 font-bold">ANY KEY</kbd> to dismiss</span>
              {onForfeit && (
                <button
                  type="button"
                  onClick={onForfeit}
                  className="text-zinc-500 hover:text-red-400 underline transition-colors cursor-pointer flex items-center gap-1"
                >
                  <Flag className="w-3 h-3" />
                  <span>Concede Match Now</span>
                </button>
              )}
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
