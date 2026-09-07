import React from 'react';

interface AlgoArenaLogoProps {
  className?: string;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  showTagline?: boolean;
  showText?: boolean;
  align?: 'left' | 'center';
}

export function AlgoArenaLogo({
  className = '',
  size = 'md',
  showTagline = false,
  showText = true,
  align = 'left'
}: AlgoArenaLogoProps) {
  // Dimensions according to size
  const iconDimensions = {
    sm: { width: 28, height: 28 },
    md: { width: 36, height: 36 },
    lg: { width: 56, height: 56 },
    xl: { width: 96, height: 96 }
  }[size];

  const textSizes = {
    sm: 'text-base tracking-tight',
    md: 'text-xl tracking-tight',
    lg: 'text-3xl tracking-tight',
    xl: 'text-5xl tracking-tight'
  }[size];

  const taglineSizes = {
    sm: 'text-[7px] tracking-[0.25em]',
    md: 'text-[9px] tracking-[0.28em]',
    lg: 'text-[11px] tracking-[0.32em]',
    xl: 'text-[14px] tracking-[0.36em]'
  }[size];

  return (
    <div className={`inline-flex ${align === 'center' ? 'flex-col items-center text-center' : 'items-center gap-3 text-left'} ${className}`}>
      {/* Precision Vector Emblem matching uploaded brand logo */}
      <div 
        className="relative shrink-0 select-none flex items-center justify-center"
        style={{ width: iconDimensions.width, height: iconDimensions.height }}
      >
        <svg
          viewBox="0 0 200 200"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className="w-full h-full drop-shadow-[0_0_14px_rgba(0,210,255,0.4)]"
        >
          <defs>
            {/* Gradients matching exact cyan-to-violet spectrum */}
            <linearGradient id="bracketGradLeft" x1="20" y1="30" x2="60" y2="150" gradientUnits="userSpaceOnUse">
              <stop offset="0%" stopColor="#00E5FF" />
              <stop offset="50%" stopColor="#00B4D8" />
              <stop offset="100%" stopColor="#9333EA" />
            </linearGradient>

            <linearGradient id="bracketGradRight" x1="180" y1="30" x2="140" y2="150" gradientUnits="userSpaceOnUse">
              <stop offset="0%" stopColor="#8B5CF6" />
              <stop offset="50%" stopColor="#7C3AED" />
              <stop offset="100%" stopColor="#A855F7" />
            </linearGradient>

            <linearGradient id="pedestalGrad" x1="30" y1="160" x2="170" y2="160" gradientUnits="userSpaceOnUse">
              <stop offset="0%" stopColor="#00E5FF" />
              <stop offset="50%" stopColor="#2563EB" />
              <stop offset="100%" stopColor="#9333EA" />
            </linearGradient>

            <linearGradient id="cubeTopGrad" x1="0" y1="0" x2="1" y2="1">
              <stop offset="0%" stopColor="#38BDF8" />
              <stop offset="100%" stopColor="#0284C7" />
            </linearGradient>

            <linearGradient id="cubeLeftGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#0284C7" />
              <stop offset="100%" stopColor="#0369A1" />
            </linearGradient>

            <linearGradient id="cubeRightGrad" x1="0" y1="0" x2="1" y2="1">
              <stop offset="0%" stopColor="#8B5CF6" />
              <stop offset="100%" stopColor="#6D28D9" />
            </linearGradient>

            <radialGradient id="pedestalCoreGlow" cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor="#00D2FF" stopOpacity="0.8" />
              <stop offset="60%" stopColor="#0284C7" stopOpacity="0.3" />
              <stop offset="100%" stopColor="#000000" stopOpacity="0" />
            </radialGradient>
          </defs>

          {/* Glowing Platform Pedestal Base Rings */}
          <ellipse cx="100" cy="158" rx="55" ry="16" fill="url(#pedestalCoreGlow)" />
          
          {/* Outer ring */}
          <path
            d="M 38 152 C 38 165, 162 165, 162 152 C 162 169, 38 169, 38 152"
            fill="url(#pedestalGrad)"
            opacity="0.9"
          />
          <ellipse
            cx="100"
            cy="154"
            rx="66"
            ry="17"
            stroke="url(#pedestalGrad)"
            strokeWidth="5"
            strokeLinecap="round"
            fill="none"
            opacity="0.95"
          />
          {/* Inner pedestal ring */}
          <ellipse
            cx="100"
            cy="154"
            rx="46"
            ry="11"
            stroke="url(#pedestalGrad)"
            strokeWidth="3.5"
            fill="#060913"
          />

          {/* Left Bracket { */}
          <path
            d="M 62 42 L 50 42 C 43 42 38 47 38 54 L 38 88 C 38 95 32 99 26 100 C 32 101 38 105 38 112 L 38 146 C 38 153 43 158 50 158 L 62 158"
            stroke="url(#bracketGradLeft)"
            strokeWidth="8"
            strokeLinecap="round"
            strokeLinejoin="round"
            fill="none"
          />

          {/* Right Bracket } */}
          <path
            d="M 138 42 L 150 42 C 157 42 162 47 162 54 L 162 88 C 162 95 168 99 174 100 C 168 101 162 105 162 112 L 162 146 C 162 153 157 158 150 158 L 138 158"
            stroke="url(#bracketGradRight)"
            strokeWidth="8"
            strokeLinecap="round"
            strokeLinejoin="round"
            fill="none"
          />

          {/* Isometric Cubes Group forming the A Chevron */}
          <g id="isometric-a" transform="translate(0, -6)">
            {/* Top Peak Cube */}
            <g transform="translate(90, 52)">
              <rect width="20" height="20" fill="#00D2FF" rx="2" className="shadow-lg" />
              <rect x="2" y="2" width="16" height="16" fill="#38BDF8" opacity="0.6" rx="1" />
            </g>

            {/* Row 2: Left and Right */}
            <g transform="translate(77, 72)">
              <rect width="20" height="20" fill="#0284C7" rx="2" />
            </g>
            <g transform="translate(103, 72)">
              <rect width="20" height="20" fill="#3B82F6" rx="2" />
            </g>

            {/* Row 3: Step Down */}
            <g transform="translate(68, 92)">
              <rect width="20" height="20" fill="#0369A1" rx="2" />
            </g>
            <g transform="translate(112, 92)">
              <rect width="20" height="20" fill="#6366F1" rx="2" />
            </g>

            {/* Row 4: Base Feet */}
            <g transform="translate(60, 112)">
              <rect width="20" height="20" fill="#00D2FF" rx="2" />
            </g>
            <g transform="translate(120, 112)">
              <rect width="20" height="20" fill="#8B5CF6" rx="2" />
            </g>
          </g>
        </svg>
      </div>

      {/* Typography: "AlgoɅrena" */}
      {showText && (
        <div className="flex flex-col leading-none">
          <div className={`font-brand font-black ${textSizes} flex items-center select-none`}>
            {/* "Algo" in crisp white */}
            <span className="text-white drop-shadow-[0_2px_10px_rgba(255,255,255,0.2)]">Algo</span>
            {/* "Ʌ" in electric cyan/blue */}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#00E5FF] to-[#00B4D8] font-black mx-[0.5px] drop-shadow-[0_0_12px_rgba(0,229,255,0.6)]">
              Ʌ
            </span>
            {/* "rena" in radiant purple/violet */}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#8B5CF6] to-[#A855F7] drop-shadow-[0_0_12px_rgba(168,85,247,0.5)]">
              rena
            </span>
          </div>

          {/* Tagline: "PRACTICE  /  COMPETE  /  GROW" */}
          {showTagline && (
            <div className={`font-brand font-bold text-zinc-400 uppercase mt-1.5 flex items-center justify-between text-center gap-1.5 ${taglineSizes}`}>
              <span className="hover:text-cyan-400 transition-colors">PRACTICE</span>
              <span className="text-zinc-600">/</span>
              <span className="hover:text-blue-400 transition-colors">COMPETE</span>
              <span className="text-zinc-600">/</span>
              <span className="hover:text-purple-400 transition-colors">GROW</span>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
