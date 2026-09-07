import React from 'react';
import clsx from 'clsx';

export type PresenceStatus = 'online' | 'in-match' | 'in_match' | 'in duel' | 'idle' | 'offline' | string;

export interface OnlineStatusIndicatorProps {
  isOnline?: boolean;
  status?: PresenceStatus;
  showLabel?: boolean;
  size?: 'xs' | 'sm' | 'md' | 'lg';
  pulse?: boolean;
  variant?: 'dot' | 'badge';
  className?: string;
}

export const OnlineStatusIndicator: React.FC<OnlineStatusIndicatorProps> = ({
  isOnline = false,
  status,
  showLabel = false,
  size = 'md',
  pulse = true,
  variant = 'dot',
  className = '',
}) => {
  // Normalize status string
  const rawStatus = (status || (isOnline ? 'ONLINE' : 'OFFLINE')).toString().trim().toUpperCase();
  
  let normalizedStatus: 'ONLINE' | 'IN-MATCH' | 'IDLE' | 'OFFLINE' = 'OFFLINE';
  if (rawStatus === 'IN-MATCH' || rawStatus === 'IN_MATCH' || rawStatus === 'IN DUEL' || rawStatus === 'IN_ROOM') {
    normalizedStatus = 'IN-MATCH';
  } else if (rawStatus === 'ONLINE' || (isOnline && rawStatus !== 'IDLE' && rawStatus !== 'IN-MATCH')) {
    normalizedStatus = 'ONLINE';
  } else if (rawStatus === 'IDLE' || rawStatus === 'AWAY') {
    normalizedStatus = 'IDLE';
  } else {
    normalizedStatus = isOnline ? 'ONLINE' : 'OFFLINE';
  }

  const sizeClasses = {
    xs: 'w-1.5 h-1.5',
    sm: 'w-2 h-2',
    md: 'w-2.5 h-2.5',
    lg: 'w-3 h-3',
  }[size];

  // Specific visual configuration for each presence mode
  const presenceConfig = {
    ONLINE: {
      label: 'ONLINE',
      labelColor: 'text-[#00FF00]',
      dotClasses: clsx(
        sizeClasses,
        'rounded-full bg-[#00FF00] shadow-[0_0_8px_#00FF00] border border-black/40',
        pulse && 'animate-pulse'
      ),
      badgeClasses: 'border-[#00FF00]/40 bg-[#00FF00]/10 text-[#00FF00] shadow-[0_0_10px_rgba(0,255,0,0.15)]',
      tooltip: 'Status: ONLINE (Available for direct duel)',
    },
    'IN-MATCH': {
      label: 'IN-MATCH',
      labelColor: 'text-[#F27D26]',
      dotClasses: clsx(
        sizeClasses,
        'rounded-full bg-[#F27D26] shadow-[0_0_8px_rgba(242,125,38,0.8)] border border-black/40',
        pulse && 'animate-pulse'
      ),
      badgeClasses: 'border-[#F27D26]/40 bg-[#F27D26]/10 text-[#F27D26] shadow-[0_0_10px_rgba(242,125,38,0.15)]',
      tooltip: 'Status: IN-MATCH (Currently engaged in a duel room)',
    },
    IDLE: {
      label: 'IDLE',
      labelColor: 'text-amber-400',
      dotClasses: clsx(
        sizeClasses,
        'rounded-full bg-amber-400 shadow-[0_0_6px_rgba(251,191,36,0.6)] border border-black/40'
      ),
      badgeClasses: 'border-amber-400/40 bg-amber-400/10 text-amber-400 shadow-[0_0_8px_rgba(251,191,36,0.1)]',
      tooltip: 'Status: IDLE (Connected but away / inactive)',
    },
    OFFLINE: {
      label: 'OFFLINE',
      labelColor: 'text-zinc-500',
      dotClasses: clsx(
        sizeClasses,
        'rounded-full bg-zinc-600 border border-zinc-700'
      ),
      badgeClasses: 'border-white/10 bg-zinc-900/80 text-zinc-500',
      tooltip: 'Status: OFFLINE',
    },
  }[normalizedStatus];

  if (variant === 'badge') {
    return (
      <div
        className={clsx(
          'inline-flex items-center gap-1.5 px-2 py-0.5 border font-mono text-[10px] font-bold select-none tracking-wider uppercase transition-all',
          presenceConfig.badgeClasses,
          className
        )}
        title={presenceConfig.tooltip}
        aria-label={presenceConfig.tooltip}
      >
        <span className={presenceConfig.dotClasses} />
        <span>{presenceConfig.label}</span>
      </div>
    );
  }

  return (
    <div 
      className={clsx('inline-flex items-center gap-1.5 font-mono text-[10px] font-bold select-none', className)}
      title={presenceConfig.tooltip}
      aria-label={presenceConfig.tooltip}
    >
      <span className={presenceConfig.dotClasses} />
      {showLabel && (
        <span className={clsx('uppercase tracking-wider font-mono', presenceConfig.labelColor)}>
          {presenceConfig.label}
        </span>
      )}
    </div>
  );
};
