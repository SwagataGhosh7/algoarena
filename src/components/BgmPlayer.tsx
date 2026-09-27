import React, { useState, useEffect, useRef } from 'react';
import { 
  Music, 
  Play, 
  Pause, 
  SkipForward, 
  SkipBack, 
  Volume2, 
  VolumeX, 
  Sliders, 
  X, 
  Radio, 
  Sparkles, 
  ChevronUp, 
  ChevronDown,
  ExternalLink
} from 'lucide-react';
import clsx from 'clsx';
import { bgmEngine, PRESET_TRACKS, type BgmTrack } from '../lib/bgmEngine';
import { soundManager } from '../lib/soundEffects';

interface BgmPlayerProps {
  compact?: boolean;
  className?: string;
}

export const BgmPlayer: React.FC<BgmPlayerProps> = ({ compact = false, className = '' }) => {
  const [isPlaying, setIsPlaying] = useState(bgmEngine.getIsPlaying());
  const [currentTrack, setCurrentTrack] = useState<BgmTrack>(bgmEngine.getCurrentTrack());
  const [volume, setVolume] = useState(bgmEngine.getVolume());
  const [isOpen, setIsOpen] = useState(false);
  const [customUrlInput, setCustomUrlInput] = useState(bgmEngine.getCustomStreamUrl());
  const [activeTab, setActiveTab] = useState<'presets' | 'custom'>('presets');
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const animFrameRef = useRef<number | null>(null);

  // Sync state with BGM Engine
  useEffect(() => {
    const unsubscribe = bgmEngine.subscribe(() => {
      setIsPlaying(bgmEngine.getIsPlaying());
      setCurrentTrack(bgmEngine.getCurrentTrack());
      setVolume(bgmEngine.getVolume());
    });
    return unsubscribe;
  }, []);

  // Global Keyboard Shortcut: Alt + M to toggle BGM
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.altKey && (e.key === 'm' || e.key === 'M')) {
        e.preventDefault();
        soundManager.playClick();
        bgmEngine.togglePlay();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Animated Visualizer Canvas
  useEffect(() => {
    if (!isOpen || !canvasRef.current) return;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const bufferLength = 16;
    const dataArray = new Uint8Array(bufferLength);

    const render = () => {
      bgmEngine.getVisualizerData(dataArray);
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      const barWidth = (canvas.width / bufferLength) - 2;
      for (let i = 0; i < bufferLength; i++) {
        let barHeight = (dataArray[i] / 255) * canvas.height;
        if (!isPlaying) {
          barHeight = 2; // Flat idle line
        }

        const x = i * (barWidth + 2);
        const y = canvas.height - barHeight;

        // Cyberpunk neon gradient
        const gradient = ctx.createLinearGradient(0, canvas.height, 0, 0);
        gradient.addColorStop(0, '#005500');
        gradient.addColorStop(0.6, '#00FF00');
        gradient.addColorStop(1, '#66FF66');

        ctx.fillStyle = gradient;
        ctx.fillRect(x, y, barWidth, barHeight);
      }

      animFrameRef.current = requestAnimationFrame(render);
    };

    render();

    return () => {
      if (animFrameRef.current) {
        cancelAnimationFrame(animFrameRef.current);
      }
    };
  }, [isOpen, isPlaying]);

  const handleTogglePlay = (e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    soundManager.playClick();
    bgmEngine.togglePlay();
  };

  const handleNextTrack = (e: React.MouseEvent) => {
    e.stopPropagation();
    soundManager.playClick();
    bgmEngine.nextTrack();
  };

  const handlePrevTrack = (e: React.MouseEvent) => {
    e.stopPropagation();
    soundManager.playClick();
    bgmEngine.prevTrack();
  };

  const handleSelectTrack = (trackId: string) => {
    soundManager.playClick();
    bgmEngine.setTrack(trackId);
    if (!isPlaying) {
      bgmEngine.play();
    }
  };

  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = parseFloat(e.target.value);
    bgmEngine.setVolume(val);
  };

  return (
    <div className={clsx("relative inline-flex items-center", className)}>
      {/* Control Pill (Button Group - No nested buttons) */}
      <div
        className={clsx(
          "flex items-center font-mono text-[10px] font-bold uppercase transition-all border select-none overflow-hidden",
          compact ? "h-6" : "h-7",
          isPlaying
            ? "bg-[#00FF00]/15 border-[#00FF00] text-[#00FF00] shadow-[0_0_12px_rgba(0,255,0,0.25)]"
            : "bg-[#080808] border-white/15 text-zinc-400 hover:text-zinc-200 hover:border-white/30"
        )}
      >
        <button
          type="button"
          id="bgm-player-toggle"
          onClick={() => {
            soundManager.playClick();
            setIsOpen(!isOpen);
          }}
          aria-label="Toggle Arena Background Synth Music Panel"
          title={`Arena Synth BGM: ${isPlaying ? 'PLAYING (' + currentTrack.title + ')' : 'PAUSED'} [Alt+M]`}
          className={clsx(
            "flex items-center gap-1.5 transition-colors cursor-pointer",
            compact ? "px-2 py-0.5" : "px-2.5 py-1"
          )}
        >
          <Music className={clsx("w-3.5 h-3.5 shrink-0", isPlaying ? "text-[#00FF00] animate-pulse" : "text-zinc-500")} />

          {/* Mini animated equalizer bars */}
          {isPlaying ? (
            <span className="flex items-end gap-0.5 h-3 w-3.5 px-0.5">
              <span className="w-0.5 bg-[#00FF00] animate-[bounce_0.8s_ease-in-out_infinite] h-full" />
              <span className="w-0.5 bg-[#00FF00] animate-[bounce_0.6s_ease-in-out_infinite_0.2s] h-2/3" />
              <span className="w-0.5 bg-[#00FF00] animate-[bounce_1s_ease-in-out_infinite_0.4s] h-4/5" />
            </span>
          ) : null}

          {!compact && (
            <span className="hidden md:inline tracking-tight max-w-[100px] truncate">
              {isPlaying ? currentTrack.title : 'BGM: OFF'}
            </span>
          )}
        </button>

        <button
          type="button"
          onClick={handleTogglePlay}
          className="px-1.5 py-1 hover:text-white transition-colors border-l border-white/10 hover:bg-white/10 cursor-pointer"
          title={isPlaying ? "Pause music" : "Play music"}
        >
          {isPlaying ? <Pause className="w-3 h-3 text-[#00FF00]" /> : <Play className="w-3 h-3 text-zinc-400" />}
        </button>
      </div>

      {/* Cyberpunk Floating Synth Music HUD Modal / Popover */}
      {isOpen && (
        <>
          <div 
            className="fixed inset-0 z-40 bg-black/40 backdrop-blur-[1px]" 
            onClick={() => setIsOpen(false)} 
          />
          <div className="absolute right-0 top-full mt-2 w-80 sm:w-96 bg-[#0a0a0a] border border-[#00FF00]/50 p-4 shadow-[0_0_30px_rgba(0,0,0,0.8),0_0_15px_rgba(0,255,0,0.15)] z-50 font-mono text-xs">
            {/* Header */}
            <div className="flex items-center justify-between pb-3 border-b border-white/10 mb-3">
              <div className="flex items-center gap-2">
                <Radio className="w-4 h-4 text-[#00FF00] animate-pulse" />
                <span className="font-black text-white uppercase tracking-wider text-xs flex items-center gap-1.5">
                  ARENA SYNTH RADIO
                  <span className="text-[9px] px-1.5 py-0.2 bg-[#00FF00]/20 text-[#00FF00] border border-[#00FF00]/40 font-mono">
                    PROCEDURAL
                  </span>
                </span>
              </div>
              <button
                onClick={() => setIsOpen(false)}
                className="text-zinc-500 hover:text-white p-1 transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Visualizer Display & Now Playing */}
            <div className="p-3 bg-black border border-white/10 mb-3 relative overflow-hidden">
              <div className="flex items-center justify-between mb-2">
                <div>
                  <div className="text-[10px] text-zinc-500 uppercase tracking-widest">NOW BROADCASTING</div>
                  <div className="text-white font-bold text-sm tracking-wide text-[#00FF00]">
                    {currentTrack.title}
                  </div>
                  <div className="text-[10px] text-zinc-400 mt-0.5">
                    {currentTrack.genre} • <span className="text-zinc-300 font-bold">{currentTrack.bpm} BPM</span>
                  </div>
                </div>

                <button
                  onClick={handleTogglePlay}
                  className={clsx(
                    "p-3 rounded-none border transition-all cursor-pointer",
                    isPlaying
                      ? "bg-[#00FF00] text-black border-[#00FF00] shadow-[0_0_12px_rgba(0,255,0,0.4)]"
                      : "bg-[#111] text-[#00FF00] border-[#00FF00]/50 hover:bg-[#00FF00]/20"
                  )}
                  title={isPlaying ? "Pause Synth Music" : "Play Synth Music"}
                >
                  {isPlaying ? <Pause className="w-5 h-5 fill-current" /> : <Play className="w-5 h-5 fill-current" />}
                </button>
              </div>

              {/* Visualizer Canvas */}
              <canvas
                ref={canvasRef}
                width={320}
                height={36}
                className="w-full h-9 bg-[#050505] border border-white/5 rounded-none block"
              />

              <div className="flex items-center justify-between mt-2 pt-2 border-t border-white/5">
                <button
                  onClick={handlePrevTrack}
                  className="flex items-center gap-1 text-[10px] text-zinc-400 hover:text-white transition-colors cursor-pointer"
                >
                  <SkipBack className="w-3 h-3" /> PREV
                </button>
                <div className="text-[9px] text-zinc-500 font-mono">
                  HOTKEY: <kbd className="px-1 py-0.5 bg-zinc-900 border border-zinc-700 text-zinc-300">Alt+M</kbd>
                </div>
                <button
                  onClick={handleNextTrack}
                  className="flex items-center gap-1 text-[10px] text-zinc-400 hover:text-white transition-colors cursor-pointer"
                >
                  NEXT <SkipForward className="w-3 h-3" />
                </button>
              </div>
            </div>

            {/* Volume Control */}
            <div className="flex items-center gap-3 p-2 bg-[#050505] border border-white/10 mb-3">
              <button
                onClick={() => bgmEngine.setVolume(volume > 0 ? 0 : 0.4)}
                className="text-zinc-400 hover:text-white transition-colors cursor-pointer"
                title={volume === 0 ? "Unmute" : "Mute BGM"}
              >
                {volume === 0 ? <VolumeX className="w-4 h-4 text-red-400" /> : <Volume2 className="w-4 h-4 text-[#00FF00]" />}
              </button>
              <input
                type="range"
                min="0"
                max="1"
                step="0.02"
                value={volume}
                onChange={handleVolumeChange}
                className="w-full accent-[#00FF00] h-1.5 bg-zinc-800 rounded-none cursor-pointer"
                title={`Master Volume: ${Math.round(volume * 100)}%`}
              />
              <span className="text-[10px] text-zinc-400 w-8 text-right font-mono">
                {Math.round(volume * 100)}%
              </span>
            </div>

            {/* Station Preset Selector */}
            <div className="space-y-1.5 max-h-48 overflow-y-auto pr-1">
              <div className="text-[10px] text-zinc-500 uppercase tracking-wider mb-1 font-bold">
                CYBERNETIC STATIONS (WEB AUDIO SYNTH)
              </div>
              {PRESET_TRACKS.map(track => {
                const isSelected = track.id === currentTrack.id;
                return (
                  <button
                    key={track.id}
                    onClick={() => handleSelectTrack(track.id)}
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
                      <div className="text-[10px] text-zinc-500 mt-0.5">{track.genre}</div>
                    </div>
                    <span className="text-[10px] px-1.5 py-0.5 bg-black border border-white/10 text-zinc-400 font-mono">
                      {track.bpm} BPM
                    </span>
                  </button>
                );
              })}
            </div>

            {/* Footer Notice */}
            <div className="mt-3 pt-2 border-t border-white/10 text-[9px] text-zinc-500 flex items-center justify-between">
              <span>Zero bandwidth • Web Audio Synth</span>
              <span className="text-[#00FF00]">100% Royalty Free</span>
            </div>
          </div>
        </>
      )}
    </div>
  );
};
