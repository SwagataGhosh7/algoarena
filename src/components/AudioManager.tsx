import React, { useState, useEffect, useRef } from 'react';
import { 
  Play, 
  Pause, 
  SkipForward, 
  SkipBack, 
  Volume2, 
  VolumeX, 
  Radio, 
  Sliders, 
  X, 
  Headphones, 
  Activity,
  ChevronUp
} from 'lucide-react';
import clsx from 'clsx';
import { useAudioManager } from '../hooks/useAudioManager';
import { soundManager } from '../lib/soundEffects';

interface AudioManagerProps {
  mode?: 'footer' | 'compact' | 'drawer';
  className?: string;
  showVisualizer?: boolean;
}

export const AudioManager: React.FC<AudioManagerProps> = ({
  mode = 'footer',
  className = '',
  showVisualizer = true,
}) => {
  const {
    isPlaying,
    currentTrack,
    volume,
    tracks,
    togglePlay,
    nextTrack,
    prevTrack,
    setTrack,
    setVolume,
    toggleMute,
    getVisualizerData,
  } = useAudioManager();

  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const animRef = useRef<number | null>(null);

  // Keyboard shortcut: Alt + M to toggle atmospheric background music
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.altKey && (e.key === 'm' || e.key === 'M')) {
        e.preventDefault();
        soundManager.playClick();
        togglePlay();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [togglePlay]);

  // Visualizer Canvas for drawer
  useEffect(() => {
    if (!isDrawerOpen || !canvasRef.current) return;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const bufferLength = 24;
    const dataArray = new Uint8Array(bufferLength);

    const render = () => {
      getVisualizerData(dataArray);
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      const barWidth = (canvas.width / bufferLength) - 1.5;
      for (let i = 0; i < bufferLength; i++) {
        let barHeight = (dataArray[i] / 255) * canvas.height;
        if (!isPlaying) {
          barHeight = 2; // Flat idle line
        }

        const x = i * (barWidth + 1.5);
        const y = canvas.height - barHeight;

        // Cyberpunk neon green gradient
        const gradient = ctx.createLinearGradient(0, canvas.height, 0, 0);
        gradient.addColorStop(0, '#003300');
        gradient.addColorStop(0.5, '#00FF00');
        gradient.addColorStop(1, '#77FF77');

        ctx.fillStyle = gradient;
        ctx.fillRect(x, y, barWidth, barHeight);
      }

      animRef.current = requestAnimationFrame(render);
    };

    render();

    return () => {
      if (animRef.current) {
        cancelAnimationFrame(animRef.current);
      }
    };
  }, [isDrawerOpen, isPlaying, getVisualizerData]);

  const handlePlayToggle = (e: React.MouseEvent) => {
    e.stopPropagation();
    soundManager.playClick();
    togglePlay();
  };

  const handleNext = (e: React.MouseEvent) => {
    e.stopPropagation();
    soundManager.playClick();
    nextTrack();
  };

  const handlePrev = (e: React.MouseEvent) => {
    e.stopPropagation();
    soundManager.playClick();
    prevTrack();
  };

  return (
    <div className={clsx("relative flex items-center select-none font-mono text-[10px]", className)}>
      {/* Footer Bar Inline Controls */}
      <div className="flex items-center gap-2 text-zinc-400">
        {/* Play/Pause Toggle with Pulsing Visual */}
        <button
          type="button"
          onClick={handlePlayToggle}
          title={isPlaying ? "Pause Atmospheric Music [Alt+M]" : "Play Atmospheric Coding Music [Alt+M]"}
          className={clsx(
            "flex items-center gap-1.5 px-2 py-0.5 rounded-none border transition-all cursor-pointer font-bold",
            isPlaying
              ? "bg-[#00FF00]/15 border-[#00FF00] text-[#00FF00] shadow-[0_0_8px_rgba(0,255,0,0.25)]"
              : "bg-black/60 border-white/15 text-zinc-400 hover:text-zinc-200 hover:border-white/30"
          )}
        >
          {isPlaying ? (
            <Pause className="w-3 h-3 text-[#00FF00] fill-current" />
          ) : (
            <Play className="w-3 h-3 text-zinc-400 fill-current" />
          )}

          <Headphones className={clsx("w-3 h-3", isPlaying ? "text-[#00FF00] animate-pulse" : "text-zinc-500")} />

          {/* Mini animated equalizer bars */}
          {isPlaying && showVisualizer && (
            <span className="flex items-end gap-0.5 h-2.5 w-3 px-0.5">
              <span className="w-0.5 bg-[#00FF00] animate-[bounce_0.8s_ease-in-out_infinite] h-full" />
              <span className="w-0.5 bg-[#00FF00] animate-[bounce_0.6s_ease-in-out_infinite_0.2s] h-2/3" />
              <span className="w-0.5 bg-[#00FF00] animate-[bounce_1s_ease-in-out_infinite_0.4s] h-4/5" />
            </span>
          )}

          <span className="tracking-wider">
            {isPlaying ? 'ATMOSPHERE: ACTIVE' : 'BGM: OFF'}
          </span>
        </button>

        {/* Track Title and Quick Switcher */}
        <div className="hidden lg:flex items-center gap-1.5 px-2 py-0.5 bg-black/60 border border-white/10 text-zinc-300">
          <button
            type="button"
            onClick={handlePrev}
            className="hover:text-white p-0.5 transition-colors cursor-pointer"
            title="Previous Atmospheric Soundscape"
          >
            <SkipBack className="w-2.5 h-2.5" />
          </button>

          <span 
            onClick={() => setIsDrawerOpen(!isDrawerOpen)}
            className="cursor-pointer hover:text-[#00FF00] transition-colors truncate max-w-[150px]"
            title={`${currentTrack.title} (${currentTrack.genre}) - Click for Atmospheric Controls`}
          >
            {currentTrack.title}
          </span>

          <button
            type="button"
            onClick={handleNext}
            className="hover:text-white p-0.5 transition-colors cursor-pointer"
            title="Next Atmospheric Soundscape"
          >
            <SkipForward className="w-2.5 h-2.5" />
          </button>
        </div>

        {/* Volume & Drawer Expansion Toggle */}
        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={toggleMute}
            className="p-1 hover:text-white text-zinc-400 transition-colors cursor-pointer"
            title={volume === 0 ? "Unmute BGM" : "Mute BGM"}
          >
            {volume === 0 ? <VolumeX className="w-3 h-3 text-red-400" /> : <Volume2 className="w-3 h-3 text-[#00FF00]" />}
          </button>

          <button
            type="button"
            onClick={() => setIsDrawerOpen(!isDrawerOpen)}
            className={clsx(
              "px-1.5 py-0.5 border transition-all cursor-pointer flex items-center gap-1 font-bold",
              isDrawerOpen
                ? "bg-[#00FF00]/20 border-[#00FF00] text-[#00FF00]"
                : "border-white/10 hover:border-white/30 text-zinc-400 hover:text-white"
            )}
            title="Open Atmospheric Music Drawer & Soundscapes"
          >
            <Sliders className="w-2.5 h-2.5" />
            <span className="hidden sm:inline">SOUNDSCAPE</span>
            <ChevronUp className={clsx("w-2.5 h-2.5 transition-transform", isDrawerOpen && "rotate-180")} />
          </button>
        </div>
      </div>

      {/* Floating Soundscape HUD Drawer / Modal (Pops up from footer) */}
      {isDrawerOpen && (
        <>
          <div 
            className="fixed inset-0 z-40 bg-black/50 backdrop-blur-[2px]" 
            onClick={() => setIsDrawerOpen(false)} 
          />
          <div className="absolute bottom-full right-0 mb-2 w-80 sm:w-96 bg-[#0a0a0a] border border-[#00FF00]/50 p-4 shadow-[0_0_30px_rgba(0,0,0,0.9),0_0_15px_rgba(0,255,0,0.15)] z-50 font-mono text-xs">
            {/* Header */}
            <div className="flex items-center justify-between pb-2.5 border-b border-white/10 mb-3">
              <div className="flex items-center gap-2">
                <Radio className="w-4 h-4 text-[#00FF00] animate-pulse" />
                <span className="font-black text-white uppercase tracking-wider text-xs flex items-center gap-1.5">
                  ATMOSPHERIC CODING AUDIO
                  <span className="text-[9px] px-1.5 py-0.2 bg-[#00FF00]/20 text-[#00FF00] border border-[#00FF00]/40 font-mono">
                    SYNTH
                  </span>
                </span>
              </div>
              <button
                type="button"
                onClick={() => setIsDrawerOpen(false)}
                className="text-zinc-500 hover:text-white p-1 transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Now Playing Card with Visualizer */}
            <div className="p-3 bg-black border border-white/10 mb-3 relative overflow-hidden">
              <div className="flex items-center justify-between mb-2">
                <div>
                  <div className="text-[9px] text-zinc-500 uppercase tracking-widest flex items-center gap-1">
                    <Activity className="w-3 h-3 text-[#00FF00]" />
                    ACTIVE ATMOSPHERE
                  </div>
                  <div className="text-white font-bold text-sm tracking-wide text-[#00FF00] mt-0.5">
                    {currentTrack.title}
                  </div>
                  <div className="text-[10px] text-zinc-400 mt-0.5">
                    {currentTrack.mood || currentTrack.genre} • <span className="text-zinc-300 font-bold">{currentTrack.bpm} BPM</span>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={handlePlayToggle}
                  className={clsx(
                    "p-3 rounded-none border transition-all cursor-pointer",
                    isPlaying
                      ? "bg-[#00FF00] text-black border-[#00FF00] shadow-[0_0_12px_rgba(0,255,0,0.4)]"
                      : "bg-[#111] text-[#00FF00] border-[#00FF00]/50 hover:bg-[#00FF00]/20"
                  )}
                  title={isPlaying ? "Pause Music" : "Play Music"}
                >
                  {isPlaying ? <Pause className="w-5 h-5 fill-current" /> : <Play className="w-5 h-5 fill-current" />}
                </button>
              </div>

              {/* Live Visualizer Canvas */}
              <canvas
                ref={canvasRef}
                width={320}
                height={32}
                className="w-full h-8 bg-[#050505] border border-white/5 rounded-none block mt-2"
              />

              {/* Prev / Next controls */}
              <div className="flex items-center justify-between mt-2 pt-2 border-t border-white/5 text-[10px]">
                <button
                  type="button"
                  onClick={handlePrev}
                  className="flex items-center gap-1 text-zinc-400 hover:text-white transition-colors cursor-pointer"
                >
                  <SkipBack className="w-3 h-3" /> PREV
                </button>
                <div className="text-[9px] text-zinc-500">
                  SHORTCUT: <kbd className="px-1 py-0.5 bg-zinc-900 border border-zinc-700 text-zinc-300">Alt+M</kbd>
                </div>
                <button
                  type="button"
                  onClick={handleNext}
                  className="flex items-center gap-1 text-zinc-400 hover:text-white transition-colors cursor-pointer"
                >
                  NEXT <SkipForward className="w-3 h-3" />
                </button>
              </div>
            </div>

            {/* Master Volume Slider */}
            <div className="flex items-center gap-3 p-2 bg-[#050505] border border-white/10 mb-3">
              <button
                type="button"
                onClick={toggleMute}
                className="text-zinc-400 hover:text-white transition-colors cursor-pointer"
                title={volume === 0 ? "Unmute" : "Mute"}
              >
                {volume === 0 ? <VolumeX className="w-4 h-4 text-red-400" /> : <Volume2 className="w-4 h-4 text-[#00FF00]" />}
              </button>
              <input
                type="range"
                min="0"
                max="1"
                step="0.02"
                value={volume}
                onChange={(e) => setVolume(parseFloat(e.target.value))}
                className="w-full accent-[#00FF00] h-1.5 bg-zinc-800 rounded-none cursor-pointer"
                title={`Volume: ${Math.round(volume * 100)}%`}
              />
              <span className="text-[10px] text-zinc-400 w-8 text-right font-mono">
                {Math.round(volume * 100)}%
              </span>
            </div>

            {/* Soundscape List */}
            <div className="space-y-1.5 max-h-48 overflow-y-auto pr-1">
              <div className="text-[10px] text-zinc-500 uppercase tracking-wider mb-1 font-bold">
                SELECT ATMOSPHERE FOR CODING SESSION
              </div>
              {tracks.map(track => {
                const isSelected = track.id === currentTrack.id;
                return (
                  <button
                    key={track.id}
                    type="button"
                    onClick={() => {
                      soundManager.playClick();
                      setTrack(track.id);
                      if (!isPlaying) {
                        togglePlay();
                      }
                    }}
                    className={clsx(
                      "w-full text-left p-2.5 border transition-all cursor-pointer flex items-center justify-between group",
                      isSelected
                        ? "bg-[#00FF00]/10 border-[#00FF00] text-white shadow-[0_0_10px_rgba(0,255,0,0.15)]"
                        : "bg-[#050505] border-white/10 text-zinc-400 hover:border-white/30 hover:text-zinc-200"
                    )}
                  >
                    <div>
                      <div className={clsx("font-bold text-xs flex items-center gap-1.5", isSelected ? "text-[#00FF00]" : "group-hover:text-white")}>
                        {track.title}
                        {isSelected && isPlaying && (
                          <span className="w-1.5 h-1.5 rounded-full bg-[#00FF00] animate-ping" />
                        )}
                      </div>
                      <div className="text-[10px] text-zinc-500 mt-0.5">
                        {track.recommendedFor || track.genre}
                      </div>
                    </div>
                    <span className="text-[10px] px-1.5 py-0.5 bg-black border border-white/10 text-zinc-400 font-mono shrink-0">
                      {track.bpm} BPM
                    </span>
                  </button>
                );
              })}
            </div>

            {/* Footer Information */}
            <div className="mt-3 pt-2 border-t border-white/10 text-[9px] text-zinc-500 flex items-center justify-between">
              <span>Web Audio Procedural Engine</span>
              <span className="text-[#00FF00]">100% Royalty Free</span>
            </div>
          </div>
        </>
      )}
    </div>
  );
};
