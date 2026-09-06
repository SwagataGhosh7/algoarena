import React, { useState, useEffect, useMemo, useRef } from 'react';
import { Clock, AlertTriangle, Flame, ShieldAlert, Zap, Activity, Info } from 'lucide-react';
import clsx from 'clsx';
import { soundManager } from '../lib/soundEffects';

export interface CountdownTimerProps {
  seconds: number;
  totalSeconds?: number;
  isActive?: boolean;
  onTimeUp?: () => void;
  variant?: 'header' | 'hero' | 'compact';
  showProgressRing?: boolean;
  showUrgencyBadge?: boolean;
  className?: string;
}

export type UrgencyTier = 'normal' | 'warning' | 'critical' | 'expired';

export const getUrgencyTier = (seconds: number): UrgencyTier => {
  if (seconds <= 0) return 'expired';
  if (seconds <= 60) return 'critical';
  if (seconds <= 180) return 'warning';
  return 'normal';
};

export const formatTimerParts = (secs: number) => {
  const safeSecs = Math.max(0, secs);
  const m = Math.floor(safeSecs / 60).toString().padStart(2, '0');
  const s = (safeSecs % 60).toString().padStart(2, '0');
  return { m, s, full: `${m}:${s}` };
};

export const CountdownTimer: React.FC<CountdownTimerProps> = ({
  seconds,
  totalSeconds = 600,
  isActive = true,
  onTimeUp,
  variant = 'header',
  showProgressRing = true,
  showUrgencyBadge = true,
  className,
}) => {
  const [isHovered, setIsHovered] = useState(false);
  const [subSecond, setSubSecond] = useState(9);
  const prevSecondsRef = useRef(seconds);

  const urgency = useMemo(() => getUrgencyTier(seconds), [seconds]);
  const { m, s, full } = useMemo(() => formatTimerParts(seconds), [seconds]);

  // Sub-second tenths countdown when in extreme danger (<= 10 seconds)
  useEffect(() => {
    if (!isActive || seconds > 10 || seconds <= 0) return;
    const interval = setInterval(() => {
      setSubSecond(prev => (prev > 0 ? prev - 1 : 9));
    }, 100);
    return () => clearInterval(interval);
  }, [isActive, seconds]);

  // Track time transitions for audio alerts
  useEffect(() => {
    const prev = prevSecondsRefRef();
    if (prev !== seconds) {
      if (seconds === 60 && prev > 60) {
        // 60-second warning ping
        soundManager.playUrgentTick();
      } else if (seconds === 30 && prev > 30) {
        // 30-second warning
        soundManager.playUrgentTick();
      } else if (seconds <= 10 && seconds > 0 && isActive) {
        // Final 10 seconds rapid countdown tick
        soundManager.playUrgentTick();
      } else if (seconds === 0 && prev > 0) {
        soundManager.playTimeUpWarning();
        onTimeUp?.();
      }
      prevSecondsRef.current = seconds;
    }

    function prevSecondsRefRef() {
      return prevSecondsRef.current;
    }
  }, [seconds, isActive, onTimeUp]);

  // Percentage and SVG gauge math
  const fraction = Math.max(0, Math.min(1, seconds / totalSeconds));
  const percent = Math.round(fraction * 100);
  const elapsedSeconds = Math.max(0, totalSeconds - seconds);
  const elapsedFormatted = formatTimerParts(elapsedSeconds).full;

  const radius = 16;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference * (1 - fraction);

  const tierStyles = {
    normal: {
      text: 'text-[#00FF00]',
      border: 'border-[#00FF00]/40',
      bg: 'bg-[#00FF00]/10',
      badgeBg: 'bg-[#00FF00]/15 text-[#00FF00] border-[#00FF00]/30',
      stroke: '#00FF00',
      glow: 'shadow-[0_0_12px_rgba(0,255,0,0.25)]',
      dropShadow: 'drop-shadow(0 0 5px rgba(0,255,0,0.6))',
      label: 'STABLE',
      pulse: false,
    },
    warning: {
      text: 'text-[#F27D26]',
      border: 'border-[#F27D26]/50',
      bg: 'bg-[#F27D26]/10',
      badgeBg: 'bg-[#F27D26]/15 text-[#F27D26] border-[#F27D26]/40',
      stroke: '#F27D26',
      glow: 'shadow-[0_0_14px_rgba(242,125,38,0.35)]',
      dropShadow: 'drop-shadow(0 0 6px rgba(242,125,38,0.7))',
      label: 'PRESSURE // < 3M',
      pulse: false,
    },
    critical: {
      text: 'text-rose-400',
      border: 'border-rose-500/70',
      bg: 'bg-rose-500/15',
      badgeBg: 'bg-rose-500/25 text-rose-300 border-rose-500/50',
      stroke: '#FF0055',
      glow: 'shadow-[0_0_20px_rgba(255,0,85,0.5)]',
      dropShadow: 'drop-shadow(0 0 8px rgba(255,0,85,0.9))',
      label: 'CRITICAL // FINAL RUSH',
      pulse: true,
    },
    expired: {
      text: 'text-zinc-500',
      border: 'border-white/10',
      bg: 'bg-zinc-900',
      badgeBg: 'bg-zinc-800 text-zinc-400 border-zinc-700',
      stroke: '#555555',
      glow: '',
      dropShadow: '',
      label: 'TIME EXPIRED',
      pulse: false,
    },
  }[urgency];

  return (
    <div 
      className={clsx("relative inline-flex items-center select-none", className)}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      id="algoarena-countdown-timer"
    >
      <div className={clsx(
        "flex items-center gap-2.5 px-3 py-1.5 border transition-all duration-300 backdrop-blur-md",
        tierStyles.border,
        tierStyles.bg,
        tierStyles.glow,
        tierStyles.pulse && "animate-pulse"
      )}>
        {/* Visual Circular Progress Ring */}
        {showProgressRing && (
          <div className="relative w-8 h-8 sm:w-9 sm:h-9 shrink-0 flex items-center justify-center">
            <svg className="w-full h-full -rotate-90 transform" viewBox="0 0 40 40">
              {/* Background Track */}
              <circle
                cx="20"
                cy="20"
                r={radius}
                className="stroke-white/10"
                strokeWidth="3.5"
                fill="transparent"
              />
              {/* Animated Foreground Progress */}
              <circle
                cx="20"
                cy="20"
                r={radius}
                stroke={tierStyles.stroke}
                strokeWidth="3.5"
                strokeLinecap="round"
                fill="transparent"
                style={{
                  strokeDasharray: circumference,
                  strokeDashoffset,
                  transition: 'stroke-dashoffset 0.8s linear, stroke 0.4s ease',
                  filter: tierStyles.dropShadow,
                }}
              />
            </svg>
            
            {/* Center Dynamic Icon */}
            <div className="absolute inset-0 flex items-center justify-center">
              {urgency === 'critical' ? (
                <Flame className="w-3.5 h-3.5 text-rose-400 animate-bounce" />
              ) : urgency === 'warning' ? (
                <Zap className="w-3.5 h-3.5 text-[#F27D26]" />
              ) : urgency === 'expired' ? (
                <ShieldAlert className="w-3.5 h-3.5 text-zinc-500" />
              ) : (
                <Clock className="w-3.5 h-3.5 text-[#00FF00]" />
              )}
            </div>
          </div>
        )}

        {/* Digital Time Readout */}
        <div className="flex flex-col justify-center">
          <div className="flex items-center gap-1.5">
            <span className={clsx(
              "font-mono font-black tracking-wider text-base sm:text-lg leading-tight transition-colors duration-300",
              tierStyles.text
            )}>
              {full}
              {/* Show tenths under 10 seconds for suspense */}
              {seconds <= 10 && seconds > 0 && (
                <span className="text-xs text-rose-300 font-bold opacity-80">
                  .{subSecond}
                </span>
              )}
            </span>

            {/* Pulsing indicator light */}
            <span className={clsx(
              "w-1.5 h-1.5 rounded-full shrink-0",
              urgency === 'critical' ? "bg-rose-500 animate-ping" : 
              urgency === 'warning' ? "bg-[#F27D26] animate-pulse" : 
              urgency === 'expired' ? "bg-zinc-600" : "bg-[#00FF00]"
            )} />
          </div>

          {/* Micro Urgency Label or Percentage Meter */}
          {showUrgencyBadge && (
            <div className="flex items-center gap-1.5">
              <span className={clsx(
                "text-[8px] font-mono font-bold uppercase tracking-widest leading-none px-1 py-0.5 border",
                tierStyles.badgeBg
              )}>
                {tierStyles.label}
              </span>
              <span className="text-[9px] font-mono text-zinc-400 hidden xl:inline">
                {percent}%
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Hover Urgency Tooltip */}
      {isHovered && (
        <div className="absolute top-full right-0 mt-2 z-50 w-64 bg-zinc-950 border border-white/20 p-3 shadow-2xl font-mono text-xs text-zinc-300 pointer-events-none animate-in fade-in zoom-in-95 duration-150">
          <div className="flex items-center justify-between border-b border-white/10 pb-2 mb-2">
            <span className="font-bold text-white flex items-center gap-1.5 uppercase text-[11px]">
              <Activity className="w-3.5 h-3.5 text-[#00FF00]" />
              DUEL TIME METRICS
            </span>
            <span className={clsx("text-[9px] px-1.5 py-0.5 font-black uppercase border", tierStyles.badgeBg)}>
              {urgency}
            </span>
          </div>

          <div className="space-y-1.5 text-[11px]">
            <div className="flex justify-between">
              <span className="text-zinc-500">TIME REMAINING:</span>
              <span className={clsx("font-bold", tierStyles.text)}>{full}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-zinc-500">TIME ELAPSED:</span>
              <span className="font-bold text-white">{elapsedFormatted}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-zinc-500">TOTAL DURATION:</span>
              <span className="text-zinc-300">{formatTimerParts(totalSeconds).full}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-zinc-500">MATCH PROGRESS:</span>
              <span className="text-zinc-300 font-bold">{100 - percent}% Elapsed</span>
            </div>
          </div>

          {/* Linear bar inside tooltip */}
          <div className="mt-2.5 pt-2 border-t border-white/10">
            <div className="h-1.5 w-full bg-black border border-white/10 overflow-hidden">
              <div 
                className={clsx(
                  "h-full transition-all duration-300",
                  urgency === 'critical' ? "bg-rose-500" :
                  urgency === 'warning' ? "bg-[#F27D26]" : "bg-[#00FF00]"
                )}
                style={{ width: `${percent}%` }}
              />
            </div>
            <p className="mt-1.5 text-[9px] text-zinc-500 text-center">
              {urgency === 'critical'
                ? 'CRITICAL ALERT: Submit solution before time expires!'
                : urgency === 'warning'
                ? 'High pressure phase: Under 3 minutes remaining.'
                : 'Steady pace: Plenty of time to test and optimize.'}
            </p>
          </div>
        </div>
      )}
    </div>
  );
};

/**
 * Ambient Urgency Bar that runs along the very top of the Arena screen
 * Shifts smoothly from green -> amber -> pulsing red as duel reaches conclusion
 */
export const AmbientUrgencyBar: React.FC<{
  seconds: number;
  totalSeconds?: number;
  isActive?: boolean;
}> = ({ seconds, totalSeconds = 600, isActive = true }) => {
  if (!isActive) return null;

  const fraction = Math.max(0, Math.min(1, seconds / totalSeconds));
  const percent = Math.round(fraction * 100);
  const urgency = getUrgencyTier(seconds);

  return (
    <div 
      className="absolute top-0 left-0 right-0 h-[2.5px] z-50 pointer-events-none bg-transparent"
      id="arena-ambient-urgency-bar"
    >
      <div 
        className={clsx(
          "h-full transition-all duration-700 ease-linear",
          urgency === 'critical' 
            ? "bg-rose-500 shadow-[0_0_12px_rgba(255,0,85,0.8)] animate-pulse" 
            : urgency === 'warning'
            ? "bg-[#F27D26] shadow-[0_0_10px_rgba(242,125,38,0.6)]"
            : "bg-[#00FF00] shadow-[0_0_8px_rgba(0,255,0,0.5)]"
        )}
        style={{ width: `${percent}%` }}
      />
    </div>
  );
};

/**
 * Critical Urgency Banner displayed directly above the coding or testing console
 * when time drops below 60 seconds to create immediate tactical focus
 */
export const CriticalUrgencyBanner: React.FC<{
  seconds: number;
  onQuickSubmit?: () => void;
  isSubmitting?: boolean;
}> = ({ seconds, onQuickSubmit, isSubmitting }) => {
  if (seconds > 60 || seconds <= 0) return null;

  const { m, s } = formatTimerParts(seconds);

  return (
    <div 
      className={clsx(
        "px-3 py-1.5 border font-mono text-xs flex items-center justify-between gap-3 backdrop-blur-md transition-all",
        seconds <= 30 
          ? "bg-rose-950/70 border-rose-500/80 text-rose-200 shadow-[0_0_16px_rgba(255,0,85,0.3)] animate-pulse" 
          : "bg-amber-950/60 border-[#F27D26]/70 text-amber-200 shadow-[0_0_12px_rgba(242,125,38,0.2)]"
      )}
      id="arena-critical-urgency-banner"
    >
      <div className="flex items-center gap-2">
        <Flame className={clsx("w-4 h-4 shrink-0", seconds <= 30 ? "text-rose-400 animate-bounce" : "text-[#F27D26]")} />
        <span className="font-black uppercase tracking-wider text-[11px]">
          {seconds <= 30 ? 'FINAL COUNTDOWN' : 'TIME PRESSURE WARNING'}:
        </span>
        <span className="text-zinc-300 hidden sm:inline">
          {seconds <= 30 ? 'Less than 30s remain! Lock in your code now.' : 'Under 60 seconds left on the duel clock.'}
        </span>
      </div>

      <div className="flex items-center gap-2 shrink-0">
        <div className="font-black text-sm px-2 py-0.5 bg-black/70 border border-white/20 text-white">
          {m}:{s}
        </div>
        {onQuickSubmit && (
          <button
            type="button"
            onClick={onQuickSubmit}
            disabled={isSubmitting}
            className="px-2.5 py-1 bg-white hover:bg-zinc-200 text-black font-black uppercase text-[10px] tracking-wider transition-colors disabled:opacity-40 cursor-pointer shadow-md"
          >
            {isSubmitting ? 'EVALUATING...' : 'SUBMIT NOW'}
          </button>
        )}
      </div>
    </div>
  );
};
