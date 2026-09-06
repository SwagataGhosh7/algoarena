import React from 'react';
import clsx from 'clsx';

export interface OnlineStatusIndicatorProps {
  isOnline?: boolean;
  status?: 'ONLINE' | 'IN DUEL' | 'IDLE' | 'OFFLINE' | string;
  showLabel?: boolean;
  size?: 'xs' | 'sm' | 'md' | 'lg';
  pulse?: boolean;
  className?: string;
}

export const OnlineStatusIndicator: React.FC<OnlineStatusIndicatorProps> = ({
  isOnline = false,
  status,
  showLabel = false,
  size = 'md',
  pulse = true,
  className = '',
}) => {
  // Determine if active based on status string or isOnline prop
  const normalizedStatus = (status || (isOnline ? 'ONLINE' : 'OFFLINE')).toUpperCase();
  const active = isOnline || normalizedStatus === 'ONLINE' || normalizedStatus === 'IN DUEL';

  const sizeClasses = {
    xs: 'w-1.5 h-1.5',
    sm: 'w-2 h-2',
    md: 'w-2.5 h-2.5',
    lg: 'w-3 h-3',
  }[size];

  const dotClasses = active
    ? clsx(
        sizeClasses,
        'rounded-full bg-[#00FF00]',
        'shadow-[0_0_8px_#00FF00]',
        pulse && 'animate-pulse',
        'border border-black/40'
      )
    : clsx(
        sizeClasses,
        'rounded-full bg-zinc-500',
        'border border-zinc-700'
      );

  const labelText = normalizedStatus === 'IN DUEL'
    ? 'IN DUEL'
    : active
    ? 'ONLINE'
    : normalizedStatus === 'IDLE'
    ? 'IDLE'
    : 'OFFLINE';

  const labelColor = normalizedStatus === 'IN DUEL'
    ? 'text-amber-400'
    : active
    ? 'text-[#00FF00]'
    : 'text-zinc-500';

  return (
    <div className={clsx('inline-flex items-center gap-1.5 font-mono text-[10px] font-bold select-none', className)}>
      <span
        className={dotClasses}
        title={`Status: ${labelText} (${active ? 'Active' : 'Offline'})`}
        aria-label={`Status: ${labelText}`}
      />
      {showLabel && (
        <span className={clsx('uppercase tracking-wider font-mono', labelColor)}>
          {labelText}
        </span>
      )}
    </div>
  );
};
