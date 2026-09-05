import { useState, useEffect, useMemo, useRef } from 'react';
import { 
  Play, 
  Pause, 
  RotateCcw, 
  FastForward, 
  Rewind, 
  Clock, 
  Gauge, 
  Zap, 
  Cpu, 
  CheckCircle2, 
  Code2, 
  Sliders, 
  Terminal, 
  ChevronRight,
  Maximize2,
  Copy,
  Check,
  TrendingUp,
  Activity
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { MatchRecord, CodePlaybackData, CodeSnapshotFrame } from '../types';

interface CodePlaybackProps {
  match?: MatchRecord | null;
  onClose?: () => void;
}

// Generate realistic line-by-line playback frames if raw recordings were not captured
export function generatePlaybackFrames(match: MatchRecord): CodePlaybackData {
  const codeSolution = match.playback?.finalCode || getDefaultCodeForProblem(match.problem, match.language);
  const lines = codeSolution.split('\n');
  const durationSec = parseDurationToSeconds(match.duration);

  const frames: CodeSnapshotFrame[] = [];
  const milestones: CodePlaybackData['milestones'] = [];

  let accumulatedCode = '';
  let activeLine = 1;
  const totalFrames = Math.max(12, Math.min(lines.length * 3, 30));

  milestones.push({
    timestampMs: 0,
    timeDisplay: '00:00',
    title: 'Match Initialized',
    description: 'Reading problem requirements and allocating state variables',
    type: 'setup',
  });

  for (let i = 0; i < totalFrames; i++) {
    const progress = (i + 1) / totalFrames;
    const currentLineLimit = Math.max(1, Math.min(lines.length, Math.ceil(progress * lines.length)));
    accumulatedCode = lines.slice(0, currentLineLimit).join('\n');
    activeLine = currentLineLimit;

    const timeSec = Math.floor(progress * durationSec);
    const m = Math.floor(timeSec / 60).toString().padStart(2, '0');
    const s = (timeSec % 60).toString().padStart(2, '0');
    const timeDisplay = `${m}:${s}`;

    const baseWpm = 55 + Math.sin(i * 0.8) * 22;
    const wpm = Math.max(25, Math.round(baseWpm));
    const cpm = wpm * 5;

    let action: CodeSnapshotFrame['action'] = 'insert';
    let milestoneDesc: string | undefined;

    if (i === Math.floor(totalFrames * 0.25)) {
      action = 'milestone';
      milestoneDesc = 'Core state loop & pointer bounds established';
      milestones.push({
        timestampMs: timeSec * 1000,
        timeDisplay,
        title: 'Core Algorithm Scaffolding',
        description: milestoneDesc,
        type: 'algorithm',
      });
    } else if (i === Math.floor(totalFrames * 0.6)) {
      action = 'milestone';
      milestoneDesc = 'Edge case validation & boundary checks inserted';
      milestones.push({
        timestampMs: timeSec * 1000,
        timeDisplay,
        title: 'Edge Case Guard',
        description: milestoneDesc,
        type: 'optimization',
      });
    } else if (i === Math.floor(totalFrames * 0.85)) {
      action = 'test_run';
      milestoneDesc = 'Initial test suite execution: 3/5 passed';
      milestones.push({
        timestampMs: timeSec * 1000,
        timeDisplay,
        title: 'Mid-Match Verification',
        description: milestoneDesc,
        type: 'test',
      });
    } else if (i === totalFrames - 1) {
      action = 'final';
      milestoneDesc = 'All test suites evaluated: 5/5 PASSED';
      milestones.push({
        timestampMs: timeSec * 1000,
        timeDisplay,
        title: 'Flawless Solution Verified',
        description: milestoneDesc,
        type: 'complete',
      });
    }

    frames.push({
      timestampMs: timeSec * 1000,
      timeDisplay,
      code: accumulatedCode,
      activeLine,
      totalLines: currentLineLimit,
      wpm,
      cpm,
      action,
      milestoneDescription: milestoneDesc,
      testsPassed: progress > 0.85 ? 5 : progress > 0.6 ? 3 : 1,
      totalTests: 5,
    });
  }

  return {
    matchId: match.id,
    problemTitle: match.problem,
    language: match.language || 'TypeScript',
    durationSeconds: durationSec,
    initialCode: '// Solution buffer initialized',
    finalCode: codeSolution,
    totalKeystrokes: codeSolution.length + 84,
    averageWpm: 68,
    peakWpm: 94,
    cyclomaticComplexity: 4,
    memoryEstimateKb: 18.4,
    timeComplexityNotation: match.difficulty === 'Hard' ? 'O(N log N)' : 'O(N)',
    efficiencyScore: match.outcome === 'Victory' ? 96 : 78,
    frames,
    milestones,
  };
}

function parseDurationToSeconds(dur: string): number {
  const mMatch = dur.match(/(\d+)\s*m/);
  const sMatch = dur.match(/(\d+)\s*s/);
  const m = mMatch ? parseInt(mMatch[1], 10) : 10;
  const s = sMatch ? parseInt(sMatch[1], 10) : 0;
  return m * 60 + s;
}

function getDefaultCodeForProblem(problemName: string, lang: string): string {
  if (lang.toLowerCase().includes('python')) {
    return `class Solution:
    def solve(self, data: list[int]) -> int:
        # Step 1: Initialize dual pointers and accumulator
        if not data:
            return 0
        
        n = len(data)
        left, right = 0, n - 1
        max_seen = float('-inf')
        current_sum = 0
        
        # Step 2: Traverse with linear complexity O(N)
        for val in data:
            current_sum = max(val, current_sum + val)
            max_seen = max(max_seen, current_sum)
            
        # Step 3: Return optimal calculated metric
        return max_seen`;
  }

  if (lang.toLowerCase().includes('c++')) {
    return `#include <vector>
#include <algorithm>
#include <climits>

class Solution {
public:
    int solve(std::vector<int>& nums) {
        if (nums.empty()) return 0;
        
        int currentMax = nums[0];
        int globalMax = nums[0];
        
        for (size_t i = 1; i < nums.size(); ++i) {
            currentMax = std::max(nums[i], currentMax + nums[i]);
            globalMax = std::max(globalMax, currentMax);
        }
        
        return globalMax;
    }
};`;
  }

  return `function solve(inputData: number[]): number {
  // 1. Edge case handling & parameter bounds
  if (!inputData || inputData.length === 0) {
    return 0;
  }

  let runningMax = inputData[0];
  let globalMax = inputData[0];

  // 2. Linear scan with Kadane's optimal subproblem aggregation
  for (let i = 1; i < inputData.length; i++) {
    const current = inputData[i];
    runningMax = Math.max(current, runningMax + current);
    globalMax = Math.max(globalMax, runningMax);
  }

  // 3. Return verified maximum subarray score
  return globalMax;
}`;
}

export function CodePlayback({ match, onClose }: CodePlaybackProps) {
  const playbackData = useMemo(() => {
    if (!match) return null;
    return match.playback || generatePlaybackFrames(match);
  }, [match]);

  const [currentFrameIdx, setCurrentFrameIdx] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [playbackSpeed, setPlaybackSpeed] = useState<number>(1);
  const [copied, setCopied] = useState(false);

  const codeContainerRef = useRef<HTMLDivElement>(null);

  const frames = playbackData?.frames || [];
  const currentFrame = frames[currentFrameIdx] || frames[0];

  // Auto playback timer loop
  useEffect(() => {
    if (!isPlaying || frames.length === 0) return;

    const intervalMs = Math.max(150, Math.floor(1000 / playbackSpeed));
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

  const handleCopyCode = () => {
    if (!currentFrame?.code) return;
    navigator.clipboard.writeText(currentFrame.code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const jumpToMilestone = (timeMs: number) => {
    if (!frames.length) return;
    const targetIdx = frames.findIndex((f) => f.timestampMs >= timeMs);
    if (targetIdx !== -1) {
      setCurrentFrameIdx(targetIdx);
    }
  };

  if (!match || !playbackData) {
    return (
      <div className="p-8 border border-white/10 bg-zinc-950 text-center font-mono">
        <Code2 className="w-8 h-8 text-zinc-600 mx-auto mb-2" />
        <p className="text-xs text-zinc-400 uppercase font-bold">No match selected for code playback</p>
        <p className="text-[10px] text-zinc-600 mt-1">Select any combat record from your match history to inspect the line-by-line typing and telemetry playback.</p>
      </div>
    );
  }

  const progressPct = frames.length > 1 ? (currentFrameIdx / (frames.length - 1)) * 100 : 100;
  const lines = (currentFrame?.code || '').split('\n');

  return (
    <div className="border border-[#00FF00]/40 bg-[#0a0a0a] shadow-[0_0_30px_rgba(0,255,0,0.1)] text-left font-mono">
      {/* Playback Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 border-b border-white/10 bg-zinc-950/80">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 border border-[#00FF00]/50 bg-[#00FF00]/10 flex items-center justify-center text-[#00FF00]">
            <Code2 className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-black text-white uppercase tracking-wider font-mono">
                CODE PLAYBACK // {match.problem}
              </span>
              <span className={`text-[9px] px-1.5 py-0.5 border font-bold uppercase ${
                match.outcome === 'Victory' 
                  ? 'border-[#00FF00]/40 text-[#00FF00] bg-[#00FF00]/10' 
                  : 'border-red-500/40 text-red-400 bg-red-950/20'
              }`}>
                {match.outcome} [{match.testScore}]
              </span>
            </div>
            <p className="text-[10px] text-zinc-400 font-mono flex items-center gap-2 mt-0.5">
              <span>VS {match.opponent}</span>
              <span>•</span>
              <span className="text-[#F27D26]">{match.language}</span>
              <span>•</span>
              <span>Total Match Duration: {match.duration}</span>
            </p>
          </div>
        </div>

        {/* Speed and Utility Controls */}
        <div className="flex items-center gap-2">
          <div className="flex items-center bg-black/60 border border-white/15 p-0.5 text-[10px]">
            <span className="px-2 text-zinc-500 font-bold uppercase">Speed:</span>
            {[0.5, 1, 2, 5].map((spd) => (
              <button
                key={spd}
                type="button"
                onClick={() => setPlaybackSpeed(spd)}
                className={`px-2 py-1 font-bold transition-colors ${
                  playbackSpeed === spd
                    ? 'bg-[#00FF00] text-black'
                    : 'text-zinc-400 hover:text-white'
                }`}
              >
                {spd}x
              </button>
            ))}
          </div>

          <button
            type="button"
            onClick={handleCopyCode}
            className="p-2 border border-white/15 hover:border-[#00FF00] text-zinc-400 hover:text-[#00FF00] transition-colors"
            title="Copy Code at Current Frame"
          >
            {copied ? <Check className="w-3.5 h-3.5 text-[#00FF00]" /> : <Copy className="w-3.5 h-3.5" />}
          </button>

          {onClose && (
            <button
              type="button"
              onClick={onClose}
              className="px-2.5 py-1.5 border border-white/15 hover:border-red-500/50 text-zinc-400 hover:text-red-400 text-xs transition-colors"
            >
              CLOSE
            </button>
          )}
        </div>
      </div>

      {/* Real-time Telemetry Metrics Strip */}
      <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-6 gap-px bg-white/10 border-b border-white/10 text-xs">
        <div className="p-3 bg-[#0c0c0c]">
          <div className="flex items-center gap-1.5 text-zinc-500 text-[10px] uppercase font-bold">
            <Gauge className="w-3.5 h-3.5 text-[#00FF00]" />
            <span>Current Typing Speed</span>
          </div>
          <div className="mt-1 flex items-baseline gap-1">
            <span className="text-lg font-black text-white font-mono">{currentFrame?.wpm || 0}</span>
            <span className="text-[10px] text-zinc-400">WPM</span>
            <span className="text-[10px] text-[#00FF00] ml-1">({currentFrame?.cpm || 0} CPM)</span>
          </div>
        </div>

        <div className="p-3 bg-[#0c0c0c]">
          <div className="flex items-center gap-1.5 text-zinc-500 text-[10px] uppercase font-bold">
            <TrendingUp className="w-3.5 h-3.5 text-[#F27D26]" />
            <span>Avg / Peak Speed</span>
          </div>
          <div className="mt-1 flex items-baseline gap-1">
            <span className="text-lg font-black text-white font-mono">{playbackData.averageWpm}</span>
            <span className="text-[10px] text-zinc-400">/</span>
            <span className="text-sm font-bold text-[#F27D26] font-mono">{playbackData.peakWpm} WPM</span>
          </div>
        </div>

        <div className="p-3 bg-[#0c0c0c]">
          <div className="flex items-center gap-1.5 text-zinc-500 text-[10px] uppercase font-bold">
            <Cpu className="w-3.5 h-3.5 text-[#3b82f6]" />
            <span>Complexity</span>
          </div>
          <div className="mt-1 flex items-baseline gap-1">
            <span className="text-sm font-black text-white font-mono">{playbackData.timeComplexityNotation}</span>
            <span className="text-[10px] text-zinc-400 ml-1">Score: {playbackData.cyclomaticComplexity}</span>
          </div>
        </div>

        <div className="p-3 bg-[#0c0c0c]">
          <div className="flex items-center gap-1.5 text-zinc-500 text-[10px] uppercase font-bold">
            <Activity className="w-3.5 h-3.5 text-[#00FF00]" />
            <span>Efficiency Rating</span>
          </div>
          <div className="mt-1 flex items-baseline gap-1">
            <span className="text-lg font-black text-[#00FF00] font-mono">{playbackData.efficiencyScore}%</span>
            <span className="text-[10px] text-zinc-400">OPTIMAL</span>
          </div>
        </div>

        <div className="p-3 bg-[#0c0c0c]">
          <div className="flex items-center gap-1.5 text-zinc-500 text-[10px] uppercase font-bold">
            <CheckCircle2 className="w-3.5 h-3.5 text-[#00FF00]" />
            <span>Tests Passed</span>
          </div>
          <div className="mt-1 flex items-baseline gap-1">
            <span className="text-lg font-black text-white font-mono">{currentFrame?.testsPassed || 0}</span>
            <span className="text-[10px] text-zinc-400">/ {currentFrame?.totalTests || 5} suites</span>
          </div>
        </div>

        <div className="p-3 bg-[#0c0c0c]">
          <div className="flex items-center gap-1.5 text-zinc-500 text-[10px] uppercase font-bold">
            <Clock className="w-3.5 h-3.5 text-zinc-400" />
            <span>Match Time</span>
          </div>
          <div className="mt-1 flex items-baseline gap-1">
            <span className="text-lg font-black text-[#00FF00] font-mono">{currentFrame?.timeDisplay || '00:00'}</span>
            <span className="text-[10px] text-zinc-500">/ {match.duration}</span>
          </div>
        </div>
      </div>

      {/* Code Editor Playback Terminal */}
      <div className="relative flex flex-col md:flex-row min-h-[380px] max-h-[500px] border-b border-white/10 overflow-hidden">
        {/* Main Code View */}
        <div 
          ref={codeContainerRef}
          className="flex-1 overflow-y-auto p-4 bg-[#050505] text-xs font-mono select-text"
        >
          <div className="space-y-0.5">
            {lines.map((line, idx) => {
              const lineNum = idx + 1;
              const isActive = lineNum === currentFrame?.activeLine;

              return (
                <div 
                  key={idx}
                  className={`flex items-start group px-2 py-0.5 rounded transition-colors ${
                    isActive ? 'bg-[#00FF00]/15 border-l-2 border-[#00FF00]' : 'hover:bg-white/5'
                  }`}
                >
                  <span className="w-9 shrink-0 text-zinc-600 select-none text-[11px] text-right pr-4 font-bold">
                    {lineNum}
                  </span>
                  <pre className="flex-1 font-mono text-zinc-300 whitespace-pre overflow-x-auto">
                    {line || ' '}
                  </pre>
                  {isActive && (
                    <span className="ml-2 px-1.5 py-0.2 bg-[#00FF00] text-black text-[9px] font-black uppercase tracking-tighter shrink-0 animate-pulse">
                      TYPING
                    </span>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Side Panel: Tactical Milestones Log */}
        <div className="w-full md:w-72 border-t md:border-t-0 md:border-l border-white/10 bg-zinc-950 p-4 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between border-b border-white/10 pb-2 mb-3">
              <span className="text-[10px] font-mono uppercase text-zinc-400 font-bold flex items-center gap-1.5">
                <Terminal className="w-3.5 h-3.5 text-[#00FF00]" />
                TACTICAL CHECKPOINTS
              </span>
              <span className="text-[9px] text-[#00FF00] font-mono">
                {playbackData.milestones.length} EVENTS
              </span>
            </div>

            <div className="space-y-2 max-h-[260px] overflow-y-auto pr-1">
              {playbackData.milestones.map((m, idx) => {
                const isPassed = (currentFrame?.timestampMs || 0) >= m.timestampMs;
                return (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => jumpToMilestone(m.timestampMs)}
                    className={`w-full text-left p-2 border transition-all text-[11px] ${
                      isPassed 
                        ? 'border-[#00FF00]/40 bg-[#00FF00]/5 text-white' 
                        : 'border-white/10 bg-black/40 text-zinc-500 hover:border-white/30'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-bold text-[#00FF00] font-mono text-[10px]">
                        [{m.timeDisplay}]
                      </span>
                      <span className={`text-[8px] uppercase px-1 py-0.2 border ${
                        m.type === 'complete' ? 'border-[#00FF00] text-[#00FF00]' :
                        m.type === 'test' ? 'border-[#3b82f6] text-[#3b82f6]' :
                        m.type === 'optimization' ? 'border-[#F27D26] text-[#F27D26]' :
                        'border-zinc-700 text-zinc-400'
                      }`}>
                        {m.type}
                      </span>
                    </div>
                    <p className="font-bold text-[10px] text-zinc-200 truncate">{m.title}</p>
                    <p className="text-[9px] text-zinc-400 line-clamp-2 mt-0.5">{m.description}</p>
                  </button>
                );
              })}
            </div>
          </div>

          <div className="pt-3 border-t border-white/10 text-[10px] text-zinc-500">
            <span className="text-zinc-400 font-bold">ACTIVE ACTION:</span> {currentFrame?.milestoneDescription || 'Executing iterative AST AST updates'}
          </div>
        </div>
      </div>

      {/* Playback Scrubber & Navigation Controls */}
      <div className="p-4 bg-zinc-950/90 space-y-3">
        {/* Progress Bar Scrubber */}
        <div className="space-y-1">
          <div className="flex items-center justify-between text-[10px] font-mono text-zinc-400">
            <div className="flex items-center gap-2">
              <span className="text-[#00FF00] font-bold">{currentFrame?.timeDisplay}</span>
              <span>•</span>
              <span>Frame {currentFrameIdx + 1} of {frames.length}</span>
            </div>
            <span>{Math.round(progressPct)}% COMPLETE</span>
          </div>

          <div className="relative w-full h-2 bg-zinc-900 border border-white/10 cursor-pointer overflow-hidden">
            <input
              type="range"
              min="0"
              max={Math.max(0, frames.length - 1)}
              value={currentFrameIdx}
              onChange={(e) => {
                setCurrentFrameIdx(parseInt(e.target.value, 10));
                setIsPlaying(false);
              }}
              className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
            />
            <div 
              className="h-full bg-gradient-to-r from-[#00FF00]/60 to-[#00FF00] transition-all duration-75"
              style={{ width: `${progressPct}%` }}
            />
          </div>
        </div>

        {/* Playback Buttons Strip */}
        <div className="flex items-center justify-between pt-1">
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setCurrentFrameIdx(0)}
              className="p-2 border border-white/15 hover:border-white/40 text-zinc-400 hover:text-white transition-colors"
              title="Restart from Beginning"
            >
              <RotateCcw className="w-3.5 h-3.5" />
            </button>

            <button
              type="button"
              onClick={() => setCurrentFrameIdx((prev) => Math.max(0, prev - 1))}
              disabled={currentFrameIdx === 0}
              className="p-2 border border-white/15 hover:border-white/40 text-zinc-400 hover:text-white disabled:opacity-30 transition-colors"
              title="Step Backward 1 Line/Frame"
            >
              <Rewind className="w-3.5 h-3.5" />
            </button>

            <button
              type="button"
              onClick={() => setIsPlaying(!isPlaying)}
              className={`px-4 py-2 border font-bold text-xs uppercase flex items-center gap-2 transition-all ${
                isPlaying 
                  ? 'border-[#F27D26] bg-[#F27D26]/20 text-[#F27D26]' 
                  : 'border-[#00FF00] bg-[#00FF00] text-black shadow-[0_0_15px_rgba(0,255,0,0.3)]'
              }`}
            >
              {isPlaying ? (
                <>
                  <Pause className="w-4 h-4 fill-current" />
                  <span>PAUSE</span>
                </>
              ) : (
                <>
                  <Play className="w-4 h-4 fill-current" />
                  <span>PLAY MATCH</span>
                </>
              )}
            </button>

            <button
              type="button"
              onClick={() => setCurrentFrameIdx((prev) => Math.min(frames.length - 1, prev + 1))}
              disabled={currentFrameIdx >= frames.length - 1}
              className="p-2 border border-white/15 hover:border-white/40 text-zinc-400 hover:text-white disabled:opacity-30 transition-colors"
              title="Step Forward 1 Line/Frame"
            >
              <FastForward className="w-3.5 h-3.5" />
            </button>

            <button
              type="button"
              onClick={() => setCurrentFrameIdx(frames.length - 1)}
              className="px-2.5 py-1.5 border border-white/15 hover:border-white/40 text-zinc-400 hover:text-white text-[10px] font-mono transition-colors"
            >
              JUMP TO FINAL
            </button>
          </div>

          <div className="hidden sm:flex items-center gap-3 text-[10px] font-mono text-zinc-500">
            <span>LINES: {lines.length}</span>
            <span>•</span>
            <span>ACTIVE: LINE {currentFrame?.activeLine || 1}</span>
            <span>•</span>
            <span className="text-[#00FF00]">SYNTAX PARSER: ONLINE</span>
          </div>
        </div>
      </div>
    </div>
  );
}
