import React, { useState, useMemo } from 'react';
import { 
  Columns, 
  Rows, 
  Copy, 
  Check, 
  Terminal, 
  AlertCircle, 
  Info, 
  Search, 
  WrapText, 
  Play, 
  CheckSquare, 
  X, 
  Maximize2,
  Minimize2,
  RotateCcw
} from 'lucide-react';
import { RunCodeResponse, RunTestCaseResult } from '../types';
import { soundManager } from '../lib/soundEffects';
import clsx from 'clsx';

interface StreamSplitPaneProps {
  runResults: RunCodeResponse | null;
  selectedCaseIdx: number;
  onSelectCaseIdx: (idx: number) => void;
  onRunCode?: () => void;
  isRunning?: boolean;
  language: string;
}

export const StreamSplitPane: React.FC<StreamSplitPaneProps> = ({
  runResults,
  selectedCaseIdx,
  onSelectCaseIdx,
  onRunCode,
  isRunning = false,
  language,
}) => {
  const [orientation, setOrientation] = useState<'horizontal' | 'vertical'>('horizontal');
  const [splitRatio, setSplitRatio] = useState<number>(50); // percentage for left/top pane
  const [isWordWrap, setIsWordWrap] = useState<boolean>(true);
  const [stdoutFilter, setStdoutFilter] = useState<string>('');
  const [stderrFilter, setStderrFilter] = useState<string>('');
  const [copiedStdout, setCopiedStdout] = useState<boolean>(false);
  const [copiedStderr, setCopiedStderr] = useState<boolean>(false);
  const [copiedBoth, setCopiedBoth] = useState<boolean>(false);
  const [isAllCasesMode, setIsAllCasesMode] = useState<boolean>(false);

  // Determine active case result
  const activeCase: RunTestCaseResult | undefined = useMemo(() => {
    if (!runResults || isAllCasesMode) return undefined;
    if (selectedCaseIdx === -1) {
      return runResults.results.find(r => r.id === 'custom');
    }
    return runResults.results[selectedCaseIdx];
  }, [runResults, selectedCaseIdx, isAllCasesMode]);

  // Combined or single stdout content
  const rawStdout = useMemo(() => {
    if (!runResults) return '';
    if (isAllCasesMode) {
      return runResults.results
        .map((r, i) => {
          const header = `=== Case #${r.id === 'custom' ? 'Custom' : i + 1} (${r.status}) ===`;
          const content = r.stdout ? r.stdout.trim() : '(No standard output)';
          return `${header}\n${content}`;
        })
        .join('\n\n');
    }
    return activeCase?.stdout ? activeCase.stdout.trim() : '';
  }, [runResults, isAllCasesMode, activeCase]);

  // Combined or single stderr content
  const rawStderr = useMemo(() => {
    if (!runResults) return '';
    if (isAllCasesMode) {
      const errorBlocks = runResults.results
        .map((r, i) => {
          const err = [r.stderr, r.compileOutput].filter(Boolean).join('\n').trim();
          if (!err && r.passed) return null;
          const header = `=== Case #${r.id === 'custom' ? 'Custom' : i + 1} (${r.status}${r.exitCode !== undefined ? ` | Exit ${r.exitCode}` : ''}) ===`;
          const content = err || (r.passed ? '(Clean stream)' : `Failed: expected "${r.expected}", got "${r.actual}"`);
          return `${header}\n${content}`;
        })
        .filter(Boolean);

      return errorBlocks.length > 0 ? errorBlocks.join('\n\n') : '';
    }

    const errParts = [activeCase?.stderr, activeCase?.compileOutput].filter(Boolean).join('\n').trim();
    if (!errParts && activeCase && !activeCase.passed) {
      return `[Assertion Failed]\nExpected Output: ${activeCase.expected}\nActual Output:   ${activeCase.actual}`;
    }
    return errParts;
  }, [runResults, isAllCasesMode, activeCase]);

  // Filtered lines
  const stdoutLines = useMemo(() => {
    if (!rawStdout) return [];
    const lines = rawStdout.split('\n');
    if (!stdoutFilter.trim()) return lines;
    return lines.filter(l => l.toLowerCase().includes(stdoutFilter.toLowerCase()));
  }, [rawStdout, stdoutFilter]);

  const stderrLines = useMemo(() => {
    if (!rawStderr) return [];
    const lines = rawStderr.split('\n');
    if (!stderrFilter.trim()) return lines;
    return lines.filter(l => l.toLowerCase().includes(stderrFilter.toLowerCase()));
  }, [rawStderr, stderrFilter]);

  const handleCopyStdout = () => {
    if (!rawStdout) return;
    soundManager.playClick();
    navigator.clipboard.writeText(rawStdout);
    setCopiedStdout(true);
    setTimeout(() => setCopiedStdout(false), 2000);
  };

  const handleCopyStderr = () => {
    if (!rawStderr) return;
    soundManager.playClick();
    navigator.clipboard.writeText(rawStderr);
    setCopiedStderr(true);
    setTimeout(() => setCopiedStderr(false), 2000);
  };

  const handleCopyBoth = () => {
    soundManager.playClick();
    const combined = `=== STANDARD OUTPUT (STDOUT) ===\n${rawStdout || '(Empty)'}\n\n=== STANDARD ERROR (STDERR) ===\n${rawStderr || '(Clean)'}`;
    navigator.clipboard.writeText(combined);
    setCopiedBoth(true);
    setTimeout(() => setCopiedBoth(false), 2000);
  };

  // If no test cases have been executed yet
  if (!runResults) {
    return (
      <div className="h-full flex flex-col items-center justify-center p-6 text-center font-mono">
        <div className="w-12 h-12 rounded-full bg-zinc-900 border border-white/10 flex items-center justify-center mb-3 text-zinc-500">
          <Terminal className="w-6 h-6 text-[#00FF00]" />
        </div>
        <h4 className="text-sm font-bold text-white mb-1">
          SPLIT-PANE STDOUT & STDERR STREAM
        </h4>
        <p className="text-xs text-zinc-400 max-w-md mb-4 leading-relaxed">
          Execute test cases to inspect intermediate logging (<code className="text-[#00FF00]">print</code>, <code className="text-[#00FF00]">console.log</code>, <code className="text-[#00FF00]">std::cout</code>) and standard error streams in real-time.
        </p>
        {onRunCode && (
          <button
            type="button"
            onClick={() => {
              soundManager.playClick();
              onRunCode();
            }}
            disabled={isRunning}
            className="flex items-center gap-2 px-4 py-2 bg-[#00FF00] hover:bg-[#00FF00]/90 text-black font-bold text-xs uppercase tracking-wider transition-colors shadow-[0_0_12px_rgba(0,255,0,0.3)] cursor-pointer"
          >
            <Play className="w-3.5 h-3.5 fill-black" />
            <span>{isRunning ? 'EXECUTING TEST CASES...' : 'RUN CODE [CTRL+ENTER]'}</span>
          </button>
        )}
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full font-mono text-xs select-text">
      {/* Sub-Header Toolbar: Case Selection & Stream Controls */}
      <div className="flex flex-wrap items-center justify-between gap-2 pb-2.5 mb-2.5 border-b border-white/10 shrink-0">
        {/* Case Selection Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto custom-scrollbar pb-1 sm:pb-0">
          <button
            type="button"
            onClick={() => {
              soundManager.playClick();
              setIsAllCasesMode(true);
            }}
            className={clsx(
              "px-2.5 py-1 text-[11px] font-bold uppercase transition-all flex items-center gap-1.5 border cursor-pointer",
              isAllCasesMode
                ? "bg-[#00FF00]/15 text-[#00FF00] border-[#00FF00]/50"
                : "bg-black/60 text-zinc-400 border-white/10 hover:text-white"
            )}
          >
            <Terminal className="w-3 h-3" />
            <span>ALL CASES ({runResults.results.length})</span>
          </button>

          {runResults.results.map((res, idx) => {
            const isCustom = res.id === 'custom';
            const isSelected = !isAllCasesMode && ((isCustom && selectedCaseIdx === -1) || selectedCaseIdx === idx);

            return (
              <button
                key={idx}
                type="button"
                onClick={() => {
                  soundManager.playClick();
                  setIsAllCasesMode(false);
                  onSelectCaseIdx(isCustom ? -1 : idx);
                }}
                className={clsx(
                  "px-2.5 py-1 text-[11px] font-bold uppercase transition-all flex items-center gap-1.5 border cursor-pointer",
                  isSelected
                    ? "bg-zinc-800 text-white border-white/30 shadow-xs"
                    : "bg-black/60 text-zinc-400 border-white/10 hover:text-zinc-200"
                )}
              >
                <span>{isCustom ? 'Custom' : `Case ${idx + 1}`}</span>
                {res.passed ? (
                  <Check className="w-3 h-3 text-[#00FF00]" />
                ) : (
                  <X className="w-3 h-3 text-rose-400" />
                )}
                {res.stdout && <span className="w-1 h-1 rounded-full bg-[#00FF00]" title="Has stdout" />}
                {res.stderr && <span className="w-1 h-1 rounded-full bg-rose-500" title="Has stderr" />}
              </button>
            );
          })}
        </div>

        {/* View Controls: Split Orientation, Presets, Wrap & Copy */}
        <div className="flex items-center gap-2 shrink-0">
          {/* Ratio Presets */}
          <div className="hidden md:flex items-center bg-black/60 border border-white/10 px-1 py-0.5 text-[10px] text-zinc-400">
            <button
              type="button"
              onClick={() => {
                soundManager.playClick();
                setSplitRatio(50);
              }}
              className={clsx("px-1.5 py-0.5 transition-colors cursor-pointer", splitRatio === 50 ? "text-[#00FF00] font-bold" : "hover:text-white")}
              title="50% / 50% split ratio"
            >
              50/50
            </button>
            <span className="text-zinc-700">|</span>
            <button
              type="button"
              onClick={() => {
                soundManager.playClick();
                setSplitRatio(65);
              }}
              className={clsx("px-1.5 py-0.5 transition-colors cursor-pointer", splitRatio === 65 ? "text-[#00FF00] font-bold" : "hover:text-white")}
              title="65% stdout / 35% stderr"
            >
              65/35
            </button>
            <span className="text-zinc-700">|</span>
            <button
              type="button"
              onClick={() => {
                soundManager.playClick();
                setSplitRatio(35);
              }}
              className={clsx("px-1.5 py-0.5 transition-colors cursor-pointer", splitRatio === 35 ? "text-[#00FF00] font-bold" : "hover:text-white")}
              title="35% stdout / 65% stderr"
            >
              35/65
            </button>
          </div>

          {/* Orientation Toggle */}
          <div className="flex items-center bg-black/60 border border-white/10 p-0.5 text-zinc-400">
            <button
              type="button"
              onClick={() => {
                soundManager.playClick();
                setOrientation('horizontal');
              }}
              className={clsx(
                "p-1 transition-colors cursor-pointer",
                orientation === 'horizontal' ? "bg-zinc-800 text-white" : "hover:text-white"
              )}
              title="Side-by-Side Horizontal Split"
            >
              <Columns className="w-3.5 h-3.5" />
            </button>
            <button
              type="button"
              onClick={() => {
                soundManager.playClick();
                setOrientation('vertical');
              }}
              className={clsx(
                "p-1 transition-colors cursor-pointer",
                orientation === 'vertical' ? "bg-zinc-800 text-white" : "hover:text-white"
              )}
              title="Stacked Vertical Split"
            >
              <Rows className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Word Wrap Toggle */}
          <button
            type="button"
            onClick={() => {
              soundManager.playClick();
              setIsWordWrap(!isWordWrap);
            }}
            className={clsx(
              "px-2 py-1 border text-[10px] font-bold flex items-center gap-1 transition-colors cursor-pointer",
              isWordWrap
                ? "bg-[#00FF00]/15 text-[#00FF00] border-[#00FF00]/40"
                : "bg-black/60 text-zinc-400 border-white/10 hover:text-white"
            )}
            title="Toggle line wrapping"
          >
            <WrapText className="w-3 h-3" />
            <span className="hidden sm:inline">WRAP</span>
          </button>

          {/* Copy Both Streams */}
          <button
            type="button"
            onClick={handleCopyBoth}
            className="px-2 py-1 bg-black/60 hover:bg-zinc-800 border border-white/10 text-[10px] text-zinc-300 hover:text-white flex items-center gap-1 transition-colors cursor-pointer"
            title="Copy both stdout and stderr streams to clipboard"
          >
            {copiedBoth ? <Check className="w-3 h-3 text-[#00FF00]" /> : <Copy className="w-3 h-3" />}
            <span className="hidden sm:inline">{copiedBoth ? 'COPIED' : 'COPY ALL'}</span>
          </button>
        </div>
      </div>

      {/* Split-Pane Canvas Container */}
      <div 
        className={clsx(
          "flex-1 flex gap-2 min-h-0 overflow-hidden",
          orientation === 'horizontal' ? "flex-col md:flex-row" : "flex-col"
        )}
      >
        {/* ================= Pane 1: Standard Output (STDOUT) ================= */}
        <div 
          className="flex flex-col bg-[#050505] border border-white/10 min-h-0 overflow-hidden"
          style={
            orientation === 'horizontal'
              ? { flex: `0 0 ${splitRatio}%` }
              : { flex: `0 0 ${splitRatio}%` }
          }
        >
          {/* Pane Header */}
          <div className="h-8 bg-[#101010] border-b border-white/10 px-2.5 flex items-center justify-between text-[11px] shrink-0">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-[#00FF00] shadow-[0_0_6px_#00FF00]" />
              <span className="font-bold text-[#00FF00] tracking-wider uppercase">
                STDOUT STREAM
              </span>
              <span className="text-zinc-400 text-[10px] hidden sm:inline">
                ({stdoutLines.length} {stdoutLines.length === 1 ? 'line' : 'lines'})
              </span>
            </div>

            <div className="flex items-center gap-1.5">
              {/* Search Filter */}
              <div className="relative flex items-center">
                <Search className="w-3 h-3 absolute left-1.5 text-zinc-400" />
                <input
                  type="text"
                  value={stdoutFilter}
                  onChange={(e) => setStdoutFilter(e.target.value)}
                  placeholder="Filter stdout..."
                  className="w-24 sm:w-32 pl-5 pr-1.5 py-0.5 bg-black/60 border border-white/10 text-[10px] text-zinc-200 placeholder-zinc-400 focus:outline-none focus:border-[#00FF00]"
                />
              </div>

              {/* Copy Stdout */}
              <button
                type="button"
                onClick={handleCopyStdout}
                disabled={!rawStdout}
                className="px-1.5 py-0.5 bg-black/60 hover:bg-zinc-800 border border-white/10 text-[10px] text-zinc-300 disabled:opacity-40 transition-colors flex items-center gap-1 cursor-pointer"
                title="Copy Standard Output"
              >
                {copiedStdout ? <Check className="w-3 h-3 text-[#00FF00]" /> : <Copy className="w-3 h-3" />}
                <span className="hidden lg:inline">{copiedStdout ? 'COPIED' : 'COPY'}</span>
              </button>
            </div>
          </div>

          {/* Pane Stream Body */}
          <div className="flex-1 overflow-y-auto p-2.5 custom-scrollbar bg-black/80 font-mono text-[11px] leading-relaxed">
            {stdoutLines.length > 0 ? (
              <div className={clsx("space-y-0.5", !isWordWrap && "whitespace-pre overflow-x-auto")}>
                {stdoutLines.map((line, idx) => {
                  const isHeader = line.startsWith('=== Case #');
                  return (
                    <div 
                      key={idx} 
                      className={clsx(
                        "flex items-start gap-2.5 hover:bg-white/5 px-1 py-0.5 rounded-xs transition-colors",
                        isHeader && "text-[#00FF00] font-bold border-b border-[#00FF00]/20 pb-1 mt-1.5 first:mt-0"
                      )}
                    >
                      <span className="text-zinc-600 select-none text-[10px] font-mono shrink-0 w-6 text-right">
                        {idx + 1}
                      </span>
                      <span className={clsx(
                        "break-all flex-1",
                        isHeader 
                          ? "text-[#00FF00]" 
                          : line.includes('[ERROR]') || line.includes('Error') 
                          ? "text-rose-300" 
                          : line.includes('[WARN]') 
                          ? "text-amber-300" 
                          : line.includes('[INFO]') 
                          ? "text-sky-300" 
                          : "text-zinc-300"
                      )}>
                        {line}
                      </span>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="h-full flex flex-col items-center justify-center text-center p-4 text-zinc-400">
                <Info className="w-5 h-5 text-zinc-400 mb-1.5" />
                <p className="text-[11px] font-bold text-zinc-400 mb-1">
                  NO STANDARD OUTPUT RECORDED
                </p>
                <p className="text-[10px] text-zinc-400 max-w-xs leading-normal">
                  Add print expressions in your {language.toUpperCase()} code (e.g. <code className="text-zinc-400">console.log()</code> or <code className="text-zinc-400">print()</code>) to view outputs here.
                </p>
              </div>
            )}
          </div>
        </div>

        {/* ================= Pane 2: Standard Error (STDERR) ================= */}
        <div 
          className="flex flex-col bg-[#070202] border border-white/10 min-h-0 overflow-hidden"
          style={
            orientation === 'horizontal'
              ? { flex: `0 0 ${100 - splitRatio}%` }
              : { flex: `0 0 ${100 - splitRatio}%` }
          }
        >
          {/* Pane Header */}
          <div className="h-8 bg-[#140606] border-b border-rose-950/40 px-2.5 flex items-center justify-between text-[11px] shrink-0">
            <div className="flex items-center gap-2">
              <span className={clsx(
                "w-2 h-2 rounded-full",
                stderrLines.length > 0 ? "bg-rose-500 shadow-[0_0_6px_#f43f5e]" : "bg-[#00FF00]"
              )} />
              <span className={clsx(
                "font-bold tracking-wider uppercase",
                stderrLines.length > 0 ? "text-rose-400" : "text-zinc-300"
              )}>
                STDERR / DIAGNOSTICS
              </span>

              {/* Status or Exit code badge */}
              {activeCase && !isAllCasesMode && (
                <span className={clsx(
                  "px-1.5 py-0.2 border text-[9px] font-black uppercase font-mono",
                  activeCase.passed 
                    ? "bg-emerald-500/15 text-[#00FF00] border-emerald-500/30" 
                    : "bg-rose-500/20 text-rose-300 border-rose-500/40"
                )}>
                  {activeCase.status}
                </span>
              )}
            </div>

            <div className="flex items-center gap-1.5">
              {/* Search Filter */}
              <div className="relative flex items-center">
                <Search className="w-3 h-3 absolute left-1.5 text-zinc-400" />
                <input
                  type="text"
                  value={stderrFilter}
                  onChange={(e) => setStderrFilter(e.target.value)}
                  placeholder="Filter stderr..."
                  className="w-24 sm:w-32 pl-5 pr-1.5 py-0.5 bg-black/60 border border-white/10 text-[10px] text-zinc-200 placeholder-zinc-400 focus:outline-none focus:border-rose-500"
                />
              </div>

              {/* Copy Stderr */}
              <button
                type="button"
                onClick={handleCopyStderr}
                disabled={!rawStderr}
                className="px-1.5 py-0.5 bg-black/60 hover:bg-zinc-800 border border-white/10 text-[10px] text-zinc-300 disabled:opacity-40 transition-colors flex items-center gap-1 cursor-pointer"
                title="Copy Standard Error Stream"
              >
                {copiedStderr ? <Check className="w-3 h-3 text-[#00FF00]" /> : <Copy className="w-3 h-3" />}
                <span className="hidden lg:inline">{copiedStderr ? 'COPIED' : 'COPY'}</span>
              </button>
            </div>
          </div>

          {/* Pane Stream Body */}
          <div className="flex-1 overflow-y-auto p-2.5 custom-scrollbar bg-black/80 font-mono text-[11px] leading-relaxed">
            {stderrLines.length > 0 ? (
              <div className={clsx("space-y-0.5", !isWordWrap && "whitespace-pre overflow-x-auto")}>
                {stderrLines.map((line, idx) => {
                  const isHeader = line.startsWith('=== Case #');
                  const isErrorKey = line.includes('Error') || line.includes('Exception') || line.includes('Traceback') || line.includes('SIGSEGV') || line.includes('Failed:');

                  return (
                    <div 
                      key={idx} 
                      className={clsx(
                        "flex items-start gap-2.5 hover:bg-rose-950/20 px-1 py-0.5 rounded-xs transition-colors",
                        isHeader && "text-rose-400 font-bold border-b border-rose-900/30 pb-1 mt-1.5 first:mt-0"
                      )}
                    >
                      <span className="text-zinc-600 select-none text-[10px] font-mono shrink-0 w-6 text-right">
                        {idx + 1}
                      </span>
                      <span className={clsx(
                        "break-all flex-1",
                        isHeader 
                          ? "text-rose-400" 
                          : isErrorKey 
                          ? "text-rose-400 font-bold" 
                          : "text-rose-300/80"
                      )}>
                        {line}
                      </span>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="h-full flex flex-col items-center justify-center text-center p-4 text-zinc-400">
                <Check className="w-5 h-5 text-[#00FF00] mb-1.5" />
                <p className="text-[11px] font-bold text-[#00FF00] mb-1">
                  CLEAN ERROR STREAM
                </p>
                <p className="text-[10px] text-zinc-400 max-w-xs leading-normal">
                  Standard error is empty. Zero exceptions, stack traces, compiler faults, or panic signals were detected for this execution.
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
