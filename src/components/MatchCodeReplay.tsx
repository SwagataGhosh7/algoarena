import { useState, useEffect, useMemo, useRef } from 'react';
import { 
  Play, 
  Pause, 
  RotateCcw, 
  FastForward, 
  Rewind, 
  Clock, 
  Gauge, 
  Cpu, 
  CheckCircle2, 
  XCircle,
  Code2, 
  Terminal, 
  ChevronRight,
  Maximize2,
  Minimize2,
  Copy, 
  Check, 
  TrendingUp, 
  Activity,
  User,
  Bot,
  ArrowLeft,
  Eye,
  Sliders,
  Sparkles,
  ShieldCheck,
  CheckCheck
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import clsx from 'clsx';
import { CodePlaybackData, CodeSnapshotFrame } from '../types';
import { generatePlaybackData, parseDurationToSeconds, getDefaultCodeForProblem } from './CodePlayback';
import { highlightCodeWithPrism, normalizeLanguage } from '../lib/prismHighlighter';

export interface MatchCodeReplayProps {
  // Current user's info
  myCode: string;
  myLanguage: string;
  myName: string;
  myOutcome: 'Victory' | 'Defeat';
  myPassedTests?: number;
  myTotalTests?: number;

  // Opponent's info
  opponentCode?: string;
  opponentLanguage?: string;
  opponentName: string;
  opponentOutcome: 'Victory' | 'Defeat';
  opponentPassedTests?: number;
  opponentTotalTests?: number;
  isOpponentBot?: boolean;

  // Match details
  problemTitle: string;
  problemDifficulty?: string;
  duration?: string;
  matchId?: string;

  // Actions
  onBackToSummary?: () => void;
  defaultParticipant?: 'mine' | 'opponent';
}

export function MatchCodeReplay({
  myCode,
  myLanguage,
  myName,
  myOutcome,
  myPassedTests = 5,
  myTotalTests = 5,
  opponentCode,
  opponentLanguage = 'TypeScript',
  opponentName,
  opponentOutcome,
  opponentPassedTests = 5,
  opponentTotalTests = 5,
  isOpponentBot = false,
  problemTitle,
  problemDifficulty = 'Medium',
  duration = '04m 30s',
  matchId = 'duel-replay',
  onBackToSummary,
  defaultParticipant = 'mine',
}: MatchCodeReplayProps) {
  // Active participant being reviewed ('mine' or 'opponent')
  const [selectedParticipant, setSelectedParticipant] = useState<'mine' | 'opponent'>(defaultParticipant);
  
  // View mode: 'replay' (interactive playback) or 'full' (static full source code)
  const [viewMode, setViewMode] = useState<'replay' | 'full'>('replay');

  // Playback engine state
  const [currentFrameIdx, setCurrentFrameIdx] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [playbackSpeed, setPlaybackSpeed] = useState<number>(1);
  const [copied, setCopied] = useState(false);
  const [isMilestonesOpen, setIsMilestonesOpen] = useState(true);

  const codeContainerRef = useRef<HTMLDivElement>(null);

  // Prepare resolved participant code and language
  const activeSubmission = useMemo(() => {
    if (selectedParticipant === 'mine') {
      const codeToUse = myCode && myCode.trim() 
        ? myCode 
        : getDefaultCodeForProblem(problemTitle, myLanguage);
      return {
        id: 'mine',
        name: myName || 'My Submission',
        isMe: true,
        isBot: false,
        code: codeToUse,
        language: myLanguage || 'TypeScript',
        outcome: myOutcome,
        passedTests: myPassedTests,
        totalTests: myTotalTests,
      };
    } else {
      const codeToUse = opponentCode && opponentCode.trim() 
        ? opponentCode 
        : getDefaultCodeForProblem(problemTitle, opponentLanguage);
      return {
        id: 'opponent',
        name: opponentName || 'Opponent',
        isMe: false,
        isBot: isOpponentBot,
        code: codeToUse,
        language: opponentLanguage || 'TypeScript',
        outcome: opponentOutcome,
        passedTests: opponentPassedTests,
        totalTests: opponentTotalTests,
      };
    }
  }, [
    selectedParticipant,
    myCode,
    myLanguage,
    myName,
    myOutcome,
    myPassedTests,
    myTotalTests,
    opponentCode,
    opponentLanguage,
    opponentName,
    opponentOutcome,
    opponentPassedTests,
    opponentTotalTests,
    isOpponentBot,
    problemTitle,
  ]);

  // Generate synthetic / captured playback frames for current active participant
  const playbackData: CodePlaybackData = useMemo(() => {
    return generatePlaybackData({
      codeSolution: activeSubmission.code,
      language: activeSubmission.language,
      problemTitle,
      duration,
      outcome: activeSubmission.outcome,
      difficulty: problemDifficulty,
      matchId,
      authorName: activeSubmission.name,
      testsPassed: activeSubmission.passedTests,
      totalTests: activeSubmission.totalTests,
    });
  }, [activeSubmission, problemTitle, duration, problemDifficulty, matchId]);

  const frames = playbackData.frames || [];
  const currentFrame = frames[currentFrameIdx] || frames[0];

  // Reset frame when switching participant
  useEffect(() => {
    setCurrentFrameIdx(0);
    setIsPlaying(false);
  }, [selectedParticipant]);

  // Auto-play timer loop
  useEffect(() => {
    if (!isPlaying || frames.length === 0) return;

    const intervalMs = Math.max(140, Math.floor(1000 / playbackSpeed));
    const timer = setInterval(() => {
      setCurrentFrameIdx((prev) => {
        if (prev >= frames.length - 1) {
          setIsPlaying(false);
          return prev;
        }
        return prev + 1;
      });
    }, intervalMs);

    return () => clearInterval(timer);
  }, [isPlaying, playbackSpeed, frames.length]);

  // Keyboard shortcut: Spacebar toggles playback
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const activeTag = (document.activeElement?.tagName || '').toLowerCase();
      if (activeTag === 'input' || activeTag === 'textarea') return;

      if (e.code === 'Space') {
        e.preventDefault();
        setIsPlaying(prev => !prev);
      } else if (e.code === 'ArrowRight') {
        e.preventDefault();
        setCurrentFrameIdx(prev => Math.min(frames.length - 1, prev + 1));
      } else if (e.code === 'ArrowLeft') {
        e.preventDefault();
        setCurrentFrameIdx(prev => Math.max(0, prev - 1));
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [frames.length]);

  const handleCopyCode = async () => {
    const textToCopy = viewMode === 'replay' ? currentFrame?.code : activeSubmission.code;
    if (!textToCopy) return;
    try {
      await navigator.clipboard.writeText(textToCopy);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Fallback
    }
  };

  const jumpToMilestone = (timeMs: number) => {
    if (!frames.length) return;
    const targetIdx = frames.findIndex((f) => f.timestampMs >= timeMs);
    if (targetIdx !== -1) {
      setCurrentFrameIdx(targetIdx);
    }
  };

  const lines = (viewMode === 'replay' ? (currentFrame?.code || '') : activeSubmission.code).split('\n');
  const progressPct = frames.length > 1 ? (currentFrameIdx / (frames.length - 1)) * 100 : 100;

  return (
    <div className="w-full flex-1 flex flex-col bg-[#070707] border border-white/10 font-mono text-left select-none overflow-hidden">
      {/* Top Header & Context Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 px-4 py-3 bg-[#0d0d0d] border-b border-white/10 shrink-0">
        <div className="flex items-center gap-3">
          {onBackToSummary && (
            <button
              type="button"
              onClick={onBackToSummary}
              className="flex items-center gap-1.5 px-2.5 py-1.5 bg-black hover:bg-zinc-800 border border-white/20 hover:border-white/40 text-zinc-300 hover:text-white text-xs font-bold uppercase tracking-wider transition-colors cursor-pointer"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Summary</span>
            </button>
          )}

          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-sm bg-[#00FF00]/10 border border-[#00FF00]/40 flex items-center justify-center text-[#00FF00]">
              <Code2 className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-black text-white uppercase tracking-wider">
                  CODE REPLAY // {problemTitle}
                </span>
                <span className={clsx(
                  "px-1.5 py-0.5 text-[9px] font-black uppercase tracking-wider border",
                  problemDifficulty.toLowerCase() === 'hard'
                    ? "bg-red-950/40 text-red-400 border-red-500/40"
                    : problemDifficulty.toLowerCase() === 'easy'
                      ? "bg-emerald-950/40 text-emerald-400 border-emerald-500/40"
                      : "bg-amber-950/40 text-amber-400 border-amber-500/40"
                )}>
                  {problemDifficulty.toUpperCase()}
                </span>
              </div>
              <p className="text-[10px] text-zinc-400 mt-0.5">
                Inspect step-by-step typing and keystroke reconstruction for this match
              </p>
            </div>
          </div>
        </div>

        {/* View Mode & Copy Code Actions */}
        <div className="flex items-center gap-2">
          {/* Mode Switcher */}
          <div className="flex items-center bg-black/80 border border-white/15 p-0.5 rounded text-[11px]">
            <button
              type="button"
              onClick={() => setViewMode('replay')}
              className={clsx(
                "flex items-center gap-1 px-2.5 py-1 font-bold uppercase transition-all cursor-pointer rounded-sm",
                viewMode === 'replay'
                  ? "bg-[#00FF00] text-black shadow-[0_0_10px_rgba(0,255,0,0.3)]"
                  : "text-zinc-400 hover:text-white"
              )}
            >
              <Play className="w-3 h-3 fill-current" />
              <span>Replay</span>
            </button>
            <button
              type="button"
              onClick={() => setViewMode('full')}
              className={clsx(
                "flex items-center gap-1 px-2.5 py-1 font-bold uppercase transition-all cursor-pointer rounded-sm",
                viewMode === 'full'
                  ? "bg-white/20 text-white font-black"
                  : "text-zinc-400 hover:text-white"
              )}
            >
              <Eye className="w-3 h-3" />
              <span>Full Code</span>
            </button>
          </div>

          {/* Copy Code */}
          <button
            type="button"
            onClick={handleCopyCode}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-black hover:bg-zinc-800 border border-white/20 hover:border-[#00FF00]/50 text-zinc-300 hover:text-white text-xs font-bold uppercase tracking-wider transition-colors cursor-pointer"
            title="Copy current code buffer to clipboard"
          >
            {copied ? (
              <>
                <Check className="w-3.5 h-3.5 text-[#00FF00]" />
                <span className="text-[#00FF00]">Copied</span>
              </>
            ) : (
              <>
                <Copy className="w-3.5 h-3.5 text-zinc-400" />
                <span>Copy Code</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Participant Selector Tabs (My Submission vs Opponent's Submission) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 p-3 bg-[#0a0a0a] border-b border-white/10 shrink-0">
        {/* Mine Tab */}
        <button
          type="button"
          onClick={() => setSelectedParticipant('mine')}
          className={clsx(
            "p-2.5 border rounded-sm flex items-center justify-between text-left transition-all cursor-pointer group",
            selectedParticipant === 'mine'
              ? "bg-black border-[#00FF00] shadow-[0_0_15px_rgba(0,255,0,0.15)] ring-1 ring-[#00FF00]/30"
              : "bg-black/50 border-white/10 hover:border-white/25 hover:bg-black/80"
          )}
        >
          <div className="flex items-center gap-2.5">
            <div className={clsx(
              "w-7 h-7 rounded-sm flex items-center justify-center text-xs font-bold",
              selectedParticipant === 'mine'
                ? "bg-[#00FF00]/20 text-[#00FF00] border border-[#00FF00]/40"
                : "bg-zinc-800 text-zinc-400"
            )}>
              <User className="w-3.5 h-3.5" />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="text-xs font-black text-white uppercase tracking-wider">
                  {myName} (You)
                </span>
                <span className="text-[9px] px-1 py-0.2 bg-zinc-800 border border-white/10 text-zinc-300 font-bold uppercase">
                  {myLanguage.toUpperCase()}
                </span>
              </div>
              <p className="text-[10px] text-zinc-400 font-mono mt-0.5">
                {myPassedTests}/{myTotalTests} Test Suites Verified • {myCode ? myCode.split('\n').length : 0} Lines
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <span className={clsx(
              "px-2 py-0.5 text-[10px] font-black uppercase tracking-wider border",
              myOutcome === 'Victory'
                ? "bg-[#00FF00]/15 text-[#00FF00] border-[#00FF00]/40"
                : "bg-red-950/40 text-red-400 border-red-500/30"
            )}>
              {myOutcome}
            </span>
            {selectedParticipant === 'mine' && (
              <span className="w-2 h-2 rounded-full bg-[#00FF00] animate-ping" />
            )}
          </div>
        </button>

        {/* Opponent Tab */}
        <button
          type="button"
          onClick={() => setSelectedParticipant('opponent')}
          className={clsx(
            "p-2.5 border rounded-sm flex items-center justify-between text-left transition-all cursor-pointer group",
            selectedParticipant === 'opponent'
              ? "bg-black border-[#00FF00] shadow-[0_0_15px_rgba(0,255,0,0.15)] ring-1 ring-[#00FF00]/30"
              : "bg-black/50 border-white/10 hover:border-white/25 hover:bg-black/80"
          )}
        >
          <div className="flex items-center gap-2.5">
            <div className={clsx(
              "w-7 h-7 rounded-sm flex items-center justify-center text-xs font-bold",
              selectedParticipant === 'opponent'
                ? "bg-[#00FF00]/20 text-[#00FF00] border border-[#00FF00]/40"
                : "bg-zinc-800 text-zinc-400"
            )}>
              {isOpponentBot ? <Bot className="w-3.5 h-3.5 text-[#F27D26]" /> : <User className="w-3.5 h-3.5" />}
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="text-xs font-black text-white uppercase tracking-wider">
                  {opponentName} {isOpponentBot ? '[AI]' : '[Rival]'}
                </span>
                <span className="text-[9px] px-1 py-0.2 bg-zinc-800 border border-white/10 text-zinc-300 font-bold uppercase">
                  {opponentLanguage.toUpperCase()}
                </span>
              </div>
              <p className="text-[10px] text-zinc-400 font-mono mt-0.5">
                {opponentPassedTests}/{opponentTotalTests} Test Suites Verified • {activeSubmission.code ? activeSubmission.code.split('\n').length : 0} Lines
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <span className={clsx(
              "px-2 py-0.5 text-[10px] font-black uppercase tracking-wider border",
              opponentOutcome === 'Victory'
                ? "bg-[#00FF00]/15 text-[#00FF00] border-[#00FF00]/40"
                : "bg-red-950/40 text-red-400 border-red-500/30"
            )}>
              {opponentOutcome}
            </span>
            {selectedParticipant === 'opponent' && (
              <span className="w-2 h-2 rounded-full bg-[#00FF00] animate-ping" />
            )}
          </div>
        </button>
      </div>

      {/* Replay Controls & Timeline Strip (Visible in Replay Mode) */}
      {viewMode === 'replay' && (
        <div className="bg-[#0b0b0b] border-b border-white/10 px-4 py-2.5 flex flex-col gap-2.5 shrink-0">
          <div className="flex flex-wrap items-center justify-between gap-3">
            {/* Playback Button Group */}
            <div className="flex items-center gap-1.5">
              <button
                type="button"
                onClick={() => setCurrentFrameIdx(0)}
                className="p-1.5 bg-black hover:bg-zinc-800 border border-white/15 text-zinc-400 hover:text-white rounded-sm transition-colors cursor-pointer"
                title="Restart playback from beginning"
              >
                <RotateCcw className="w-3.5 h-3.5" />
              </button>

              <button
                type="button"
                onClick={() => setCurrentFrameIdx(prev => Math.max(0, prev - 1))}
                disabled={currentFrameIdx === 0}
                className="p-1.5 bg-black hover:bg-zinc-800 border border-white/15 text-zinc-400 hover:text-white rounded-sm transition-colors disabled:opacity-40 cursor-pointer"
                title="Step backward one frame (Left Arrow)"
              >
                <Rewind className="w-3.5 h-3.5" />
              </button>

              <button
                type="button"
                onClick={() => setIsPlaying(prev => !prev)}
                className={clsx(
                  "flex items-center gap-1.5 px-3 py-1.5 rounded-sm font-black text-xs uppercase tracking-wider transition-all cursor-pointer",
                  isPlaying
                    ? "bg-amber-500 hover:bg-amber-400 text-black shadow-[0_0_12px_rgba(245,158,11,0.4)]"
                    : "bg-[#00FF00] hover:bg-[#00CC00] text-black shadow-[0_0_12px_rgba(0,255,0,0.3)]"
                )}
                title="Play/Pause keystroke replay (Spacebar)"
              >
                {isPlaying ? (
                  <>
                    <Pause className="w-3.5 h-3.5 fill-black" />
                    <span>PAUSE</span>
                  </>
                ) : (
                  <>
                    <Play className="w-3.5 h-3.5 fill-black" />
                    <span>PLAY REPLAY</span>
                  </>
                )}
              </button>

              <button
                type="button"
                onClick={() => setCurrentFrameIdx(prev => Math.min(frames.length - 1, prev + 1))}
                disabled={currentFrameIdx >= frames.length - 1}
                className="p-1.5 bg-black hover:bg-zinc-800 border border-white/15 text-zinc-400 hover:text-white rounded-sm transition-colors disabled:opacity-40 cursor-pointer"
                title="Step forward one frame (Right Arrow)"
              >
                <FastForward className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* Time / Frame Indicator */}
            <div className="flex items-center gap-2 bg-black/60 border border-white/10 px-2.5 py-1 text-xs">
              <Clock className="w-3.5 h-3.5 text-[#00FF00]" />
              <span className="font-mono text-white font-bold">
                {currentFrame?.timeDisplay || '00:00'}
              </span>
              <span className="text-zinc-500">/</span>
              <span className="text-zinc-400">{duration}</span>
              <span className="text-[10px] text-zinc-500 ml-2">
                Frame {currentFrameIdx + 1} / {frames.length}
              </span>
            </div>

            {/* Speed Selector */}
            <div className="flex items-center bg-black/80 border border-white/15 p-0.5 text-[10px] rounded">
              <span className="px-2 text-zinc-500 font-bold uppercase">Speed:</span>
              {[0.5, 1, 2, 5].map((spd) => (
                <button
                  key={spd}
                  type="button"
                  onClick={() => setPlaybackSpeed(spd)}
                  className={clsx(
                    "px-2 py-0.5 font-bold transition-colors cursor-pointer rounded-xs",
                    playbackSpeed === spd
                      ? "bg-[#00FF00] text-black font-black"
                      : "text-zinc-400 hover:text-white"
                  )}
                >
                  {spd}x
                </button>
              ))}
            </div>

            {/* Milestones Drawer Toggle */}
            <button
              type="button"
              onClick={() => setIsMilestonesOpen(prev => !prev)}
              className={clsx(
                "flex items-center gap-1 px-2 py-1 text-[10px] uppercase font-bold border transition-colors cursor-pointer",
                isMilestonesOpen
                  ? "bg-white/10 text-white border-white/20"
                  : "bg-transparent text-zinc-400 border-white/10 hover:text-white"
              )}
              title="Toggle Milestones Timeline sidebar"
            >
              <Sliders className="w-3 h-3" />
              <span>Milestones ({playbackData.milestones.length})</span>
            </button>
          </div>

          {/* Interactive Scrubber Slider Bar */}
          <div className="flex items-center gap-3">
            <div className="flex-1 relative flex items-center group">
              <input
                type="range"
                min="0"
                max={Math.max(0, frames.length - 1)}
                value={currentFrameIdx}
                onChange={(e) => {
                  setCurrentFrameIdx(Number(e.target.value));
                  setIsPlaying(false);
                }}
                className="w-full h-1.5 bg-zinc-800 rounded-lg appearance-none cursor-pointer accent-[#00FF00] focus:outline-none"
              />
              <div 
                className="absolute left-0 top-1/2 -translate-y-1/2 h-1.5 bg-[#00FF00] pointer-events-none rounded-lg"
                style={{ width: `${progressPct}%` }}
              />
            </div>
            <span className="text-[10px] text-zinc-400 font-mono w-10 text-right">
              {Math.round(progressPct)}%
            </span>
          </div>
        </div>
      )}

      {/* Telemetry Metrics Bar */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-px bg-white/10 border-b border-white/10 text-xs shrink-0">
        <div className="p-2.5 bg-[#0c0c0c]">
          <div className="flex items-center gap-1.5 text-zinc-500 text-[10px] uppercase font-bold">
            <Gauge className="w-3.5 h-3.5 text-[#00FF00]" />
            <span>Typing Cadence</span>
          </div>
          <div className="mt-0.5 flex items-baseline gap-1">
            <span className="text-base font-black text-white font-mono">
              {viewMode === 'replay' ? (currentFrame?.wpm || 0) : playbackData.averageWpm}
            </span>
            <span className="text-[10px] text-zinc-400">WPM</span>
            <span className="text-[10px] text-[#00FF00] ml-1">
              ({viewMode === 'replay' ? (currentFrame?.cpm || 0) : playbackData.averageWpm * 5} CPM)
            </span>
          </div>
        </div>

        <div className="p-2.5 bg-[#0c0c0c]">
          <div className="flex items-center gap-1.5 text-zinc-500 text-[10px] uppercase font-bold">
            <TrendingUp className="w-3.5 h-3.5 text-[#F27D26]" />
            <span>Avg / Peak Speed</span>
          </div>
          <div className="mt-0.5 flex items-baseline gap-1">
            <span className="text-base font-black text-white font-mono">{playbackData.averageWpm}</span>
            <span className="text-[10px] text-zinc-400">/</span>
            <span className="text-xs font-bold text-[#F27D26] font-mono">{playbackData.peakWpm} WPM</span>
          </div>
        </div>

        <div className="p-2.5 bg-[#0c0c0c]">
          <div className="flex items-center gap-1.5 text-zinc-500 text-[10px] uppercase font-bold">
            <Cpu className="w-3.5 h-3.5 text-[#3b82f6]" />
            <span>Complexity</span>
          </div>
          <div className="mt-0.5 flex items-baseline gap-1">
            <span className="text-sm font-black text-white font-mono">{playbackData.timeComplexityNotation}</span>
            <span className="text-[10px] text-zinc-400 ml-1">Score: {playbackData.cyclomaticComplexity}</span>
          </div>
        </div>

        <div className="p-2.5 bg-[#0c0c0c]">
          <div className="flex items-center gap-1.5 text-zinc-500 text-[10px] uppercase font-bold">
            <Activity className="w-3.5 h-3.5 text-[#00FF00]" />
            <span>Efficiency Score</span>
          </div>
          <div className="mt-0.5 flex items-baseline gap-1">
            <span className="text-base font-black text-[#00FF00] font-mono">{playbackData.efficiencyScore}%</span>
            <span className="text-[10px] text-zinc-400">OPTIMAL</span>
          </div>
        </div>

        <div className="p-2.5 bg-[#0c0c0c]">
          <div className="flex items-center gap-1.5 text-zinc-500 text-[10px] uppercase font-bold">
            <CheckCircle2 className="w-3.5 h-3.5 text-[#00FF00]" />
            <span>Test Suite Status</span>
          </div>
          <div className="mt-0.5 flex items-baseline gap-1">
            <span className="text-base font-black text-white font-mono">
              {viewMode === 'replay' ? (currentFrame?.testsPassed || 0) : activeSubmission.passedTests}
            </span>
            <span className="text-[10px] text-zinc-400">
              / {activeSubmission.totalTests} Passed
            </span>
          </div>
        </div>

        <div className="p-2.5 bg-[#0c0c0c]">
          <div className="flex items-center gap-1.5 text-zinc-500 text-[10px] uppercase font-bold">
            <Code2 className="w-3.5 h-3.5 text-zinc-400" />
            <span>Lines / Characters</span>
          </div>
          <div className="mt-0.5 flex items-baseline gap-1">
            <span className="text-base font-black text-white font-mono">{lines.length}</span>
            <span className="text-[10px] text-zinc-400">lines</span>
            <span className="text-[10px] text-zinc-500 ml-1">
              ({(viewMode === 'replay' ? currentFrame?.code?.length : activeSubmission.code?.length) || 0} chars)
            </span>
          </div>
        </div>
      </div>

      {/* Main Code View Area & Milestones Sidebar */}
      <div className="flex-1 flex flex-col md:flex-row overflow-hidden min-h-[400px]">
        {/* Code Editor Frame */}
        <div 
          ref={codeContainerRef}
          className="flex-1 overflow-y-auto p-4 bg-[#050505] text-xs font-mono select-text"
        >
          <div className="space-y-0.5">
            {lines.map((line, idx) => {
              const lineNum = idx + 1;
              const isActive = viewMode === 'replay' && lineNum === currentFrame?.activeLine;

              return (
                <div 
                  key={idx}
                  className={clsx(
                    "flex items-start group px-2 py-0.5 rounded transition-colors",
                    isActive ? "bg-[#00FF00]/15 border-l-2 border-[#00FF00]" : "hover:bg-white/5"
                  )}
                >
                  <span className="w-10 shrink-0 text-zinc-600 select-none text-[11px] text-right pr-4 font-bold">
                    {lineNum}
                  </span>
                  <pre className="flex-1 font-mono text-zinc-300 whitespace-pre overflow-x-auto">
                    {line || ' '}
                  </pre>
                  {isActive && (
                    <span className="text-[10px] text-[#00FF00] font-bold uppercase tracking-wider pl-2 animate-pulse shrink-0">
                      ← TYPING CURSOR
                    </span>
                  )}
                </div>
              );
            })}
          </div>

          {/* End of Replay Prompt */}
          {viewMode === 'replay' && currentFrameIdx === frames.length - 1 && (
            <div className="mt-6 p-3 bg-[#00FF00]/10 border border-[#00FF00]/30 rounded-sm flex items-center justify-between text-xs text-[#00FF00]">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4" />
                <span className="font-bold uppercase tracking-wider">
                  Replay Reached Final Submission State ({lines.length} lines)
                </span>
              </div>
              <button
                type="button"
                onClick={() => setCurrentFrameIdx(0)}
                className="px-2.5 py-1 bg-[#00FF00] hover:bg-[#00CC00] text-black font-black uppercase text-[10px] tracking-wider transition-colors cursor-pointer"
              >
                Replay Again
              </button>
            </div>
          )}
        </div>

        {/* Milestones Events Sidebar */}
        {viewMode === 'replay' && isMilestonesOpen && (
          <aside className="w-full md:w-72 bg-[#090909] border-t md:border-t-0 md:border-l border-white/10 flex flex-col shrink-0 overflow-hidden">
            <div className="p-3 border-b border-white/10 bg-[#111111] flex items-center justify-between">
              <span className="text-xs font-black text-white uppercase tracking-wider flex items-center gap-1.5">
                <Sliders className="w-3.5 h-3.5 text-[#00FF00]" />
                Milestone Jump Points
              </span>
              <span className="text-[10px] text-zinc-500 uppercase">
                {playbackData.milestones.length} Events
              </span>
            </div>

            <div className="flex-1 overflow-y-auto p-2 space-y-2">
              {playbackData.milestones.map((m, idx) => {
                const isCurrent = currentFrame && currentFrame.timeDisplay >= m.timeDisplay;
                return (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => jumpToMilestone(m.timestampMs)}
                    className={clsx(
                      "w-full text-left p-2.5 border rounded-sm transition-all cursor-pointer group",
                      isCurrent
                        ? "bg-white/10 border-[#00FF00]/50 text-white"
                        : "bg-black/60 border-white/5 text-zinc-400 hover:border-white/20 hover:text-zinc-200"
                    )}
                  >
                    <div className="flex items-center justify-between text-[10px] mb-1 font-bold">
                      <span className="px-1.5 py-0.5 bg-black border border-white/15 text-[#00FF00]">
                        {m.timeDisplay}
                      </span>
                      <span className="text-zinc-500 uppercase tracking-widest text-[9px]">
                        {m.type}
                      </span>
                    </div>
                    <div className="text-xs font-black uppercase tracking-wider text-zinc-200 group-hover:text-[#00FF00]">
                      {m.title}
                    </div>
                    <p className="text-[10px] text-zinc-400 mt-1 leading-snug">
                      {m.description}
                    </p>
                  </button>
                );
              })}
            </div>
          </aside>
        )}
      </div>

      {/* Footer Helper Notice */}
      <div className="px-4 py-2 bg-[#090909] border-t border-white/10 flex flex-wrap items-center justify-between text-[10px] text-zinc-500 font-mono">
        <div className="flex items-center gap-2">
          <span>Shortcuts:</span>
          <kbd className="px-1.5 py-0.5 bg-black border border-white/20 text-zinc-300">Space</kbd> Play/Pause
          <kbd className="px-1.5 py-0.5 bg-black border border-white/20 text-zinc-300 ml-1">←</kbd>
          <kbd className="px-1.5 py-0.5 bg-black border border-white/20 text-zinc-300">→</kbd> Step Frames
        </div>
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => setSelectedParticipant(selectedParticipant === 'mine' ? 'opponent' : 'mine')}
            className="text-zinc-400 hover:text-[#00FF00] transition-colors underline cursor-pointer"
          >
            Switch to {selectedParticipant === 'mine' ? `${opponentName}'s submission` : 'your submission'}
          </button>
        </div>
      </div>
    </div>
  );
}
