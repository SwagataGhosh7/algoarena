import { useState } from 'react';
import Editor from '@monaco-editor/react';
import { 
  Check, Copy, Terminal, Code2, Sparkles, RotateCcw, 
  CheckCircle2, XCircle, Clock, Zap, Maximize2, Minimize2, ZoomIn, ZoomOut
} from 'lucide-react';
import { highlightCodeWithPrism, normalizeLanguage } from '../lib/prismHighlighter';
import { registerMonacoThemes } from '../lib/editorThemes';
import { triggerDuelVictoryConfetti } from '../lib/confetti';

export interface SubmissionCodeViewerProps {
  code: string;
  language?: string;
  theme?: string;
  status?: 'Accepted' | 'Wrong Answer' | 'Runtime Error' | 'Evaluated' | 'Pending';
  passedCount?: number;
  totalCount?: number;
  runtime?: string;
  memory?: string;
  timestamp?: string;
  submissionId?: string;
  feedback?: string;
  height?: string;
  onRestoreToEditor?: (code: string, language?: string) => void;
  showEngineToggle?: boolean;
  defaultEngine?: 'monaco' | 'prism';
  compact?: boolean;
}

export function SubmissionCodeViewer({
  code,
  language = 'javascript',
  theme = 'monokai',
  status,
  passedCount,
  totalCount,
  runtime,
  memory,
  timestamp,
  submissionId,
  feedback,
  height = '280px',
  onRestoreToEditor,
  showEngineToggle = true,
  defaultEngine = 'monaco',
  compact = false,
}: SubmissionCodeViewerProps) {
  const [engine, setEngine] = useState<'monaco' | 'prism'>(defaultEngine);
  const [fontSize, setFontSize] = useState<number>(13);
  const [copied, setCopied] = useState<boolean>(false);
  const [isExpanded, setIsExpanded] = useState<boolean>(false);

  const normLang = normalizeLanguage(language);
  const monacoLang = normLang === 'cpp' ? 'cpp' : normLang === 'c' ? 'c' : normLang === 'python' ? 'python' : normLang === 'typescript' ? 'typescript' : normLang === 'java' ? 'java' : normLang === 'go' ? 'go' : normLang === 'rust' ? 'rust' : 'javascript';

  const lineCount = code ? code.split('\n').length : 0;

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(code);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Fallback
    }
  };

  const isSuccess = status === 'Accepted' || (passedCount !== undefined && totalCount !== undefined && passedCount === totalCount && totalCount > 0);
  const isFailure = status === 'Wrong Answer' || status === 'Runtime Error' || (passedCount !== undefined && totalCount !== undefined && passedCount < totalCount);

  // Prism highlighted lines
  const prismHtml = highlightCodeWithPrism(code, normLang);

  return (
    <div className={`border border-white/15 bg-[#0a0a0a] font-mono flex flex-col transition-all ${isExpanded ? 'fixed inset-4 z-50 shadow-[0_0_50px_rgba(0,0,0,0.9)] border-[#00FF00]/50' : 'w-full'}`}>
      {/* Header Bar */}
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-white/10 bg-[#101010] px-3 py-2 shrink-0">
        <div className="flex items-center gap-2">
          <Code2 className="w-4 h-4 text-[#00FF00]" />
          <div className="flex items-center gap-1.5">
            <span className="text-xs font-black text-white uppercase tracking-wider">
              {submissionId ? `SUBMISSION [${submissionId}]` : 'SUBMITTED SOLUTION'}
            </span>
            <span className="px-1.5 py-0.5 text-[9px] font-black uppercase tracking-wider bg-black border border-white/20 text-zinc-300">
              {language.toUpperCase()}
            </span>
          </div>

          {/* Status Badge */}
          {status && (
            <button
              type="button"
              onClick={() => {
                if (isSuccess) triggerDuelVictoryConfetti();
              }}
              title={isSuccess ? "All test cases passed! Click to blast confetti 🎉" : undefined}
              className={`flex items-center gap-1 px-2 py-0.5 text-[10px] font-black uppercase tracking-wider border transition-all ${
                isSuccess 
                  ? 'bg-[#00FF00]/15 text-[#00FF00] border-[#00FF00]/40 shadow-[0_0_8px_rgba(0,255,0,0.2)] hover:bg-[#00FF00]/25 cursor-pointer'
                  : isFailure 
                  ? 'bg-rose-500/15 text-rose-400 border-rose-500/40 cursor-default' 
                  : 'bg-zinc-800 text-zinc-300 border-white/15 cursor-default'
              }`}
            >
              {isSuccess ? <CheckCircle2 className="w-3 h-3 text-[#00FF00]" /> : isFailure ? <XCircle className="w-3 h-3" /> : <Terminal className="w-3 h-3" />}
              <span>
                {status}
                {passedCount !== undefined && totalCount !== undefined ? ` (${passedCount}/${totalCount})` : ''}
              </span>
              {isSuccess && <Sparkles className="w-2.5 h-2.5 ml-0.5 text-[#00FF00] animate-pulse" />}
            </button>
          )}
        </div>

        {/* Controls & Engine Switcher */}
        <div className="flex items-center gap-1.5">
          {/* Telemetry info */}
          {(runtime || memory) && (
            <div className="hidden sm:flex items-center gap-2 text-[10px] text-zinc-400 bg-black/60 px-2 py-0.5 border border-white/10 mr-1">
              {runtime && (
                <span className="flex items-center gap-1">
                  <Clock className="w-3 h-3 text-[#00FF00]" /> {runtime}
                </span>
              )}
              {memory && (
                <span className="flex items-center gap-1">
                  <Zap className="w-3 h-3 text-amber-400" /> {memory}
                </span>
              )}
            </div>
          )}

          {/* Engine Toggle: Monaco vs Prism.js */}
          {showEngineToggle && (
            <div className="flex items-center bg-black border border-white/15 p-0.5 text-[9px]">
              <button
                type="button"
                onClick={() => setEngine('monaco')}
                title="Monaco Editor High-Fidelity IDE Highlight"
                className={`px-2 py-0.5 font-bold uppercase transition-all flex items-center gap-1 ${
                  engine === 'monaco'
                    ? 'bg-[#00FF00] text-black shadow-[0_0_8px_rgba(0,255,0,0.3)]'
                    : 'text-zinc-400 hover:text-white'
                }`}
              >
                <Sparkles className="w-2.5 h-2.5" />
                <span>MONACO</span>
              </button>
              <button
                type="button"
                onClick={() => setEngine('prism')}
                title="Prism.js Real-time Syntax Highlight"
                className={`px-2 py-0.5 font-bold uppercase transition-all flex items-center gap-1 ${
                  engine === 'prism'
                    ? 'bg-[#00FF00] text-black shadow-[0_0_8px_rgba(0,255,0,0.3)]'
                    : 'text-zinc-400 hover:text-white'
                }`}
              >
                <Terminal className="w-2.5 h-2.5" />
                <span>PRISM.JS</span>
              </button>
            </div>
          )}

          {/* Font Zoom */}
          <div className="hidden md:flex items-center bg-black border border-white/10 p-0.5">
            <button
              type="button"
              onClick={() => setFontSize(f => Math.max(10, f - 1))}
              className="p-1 text-zinc-400 hover:text-white transition-colors"
              title="Decrease Font Size"
            >
              <ZoomOut className="w-3 h-3" />
            </button>
            <span className="text-[9px] text-zinc-400 px-1 font-bold">{fontSize}px</span>
            <button
              type="button"
              onClick={() => setFontSize(f => Math.min(20, f + 1))}
              className="p-1 text-zinc-400 hover:text-white transition-colors"
              title="Increase Font Size"
            >
              <ZoomIn className="w-3 h-3" />
            </button>
          </div>

          {/* Copy Button */}
          <button
            type="button"
            onClick={handleCopy}
            className="px-2 py-1 bg-black border border-white/15 hover:border-[#00FF00] text-zinc-300 hover:text-[#00FF00] text-[10px] font-bold uppercase flex items-center gap-1 transition-all cursor-pointer"
            title="Copy submitted code"
          >
            {copied ? <Check className="w-3 h-3 text-[#00FF00]" /> : <Copy className="w-3 h-3" />}
            <span className="hidden sm:inline">{copied ? 'COPIED' : 'COPY'}</span>
          </button>

          {/* Restore to Editor Button */}
          {onRestoreToEditor && (
            <button
              type="button"
              onClick={() => onRestoreToEditor(code, language)}
              className="px-2 py-1 bg-[#00FF00]/15 hover:bg-[#00FF00]/25 text-[#00FF00] border border-[#00FF00]/40 text-[10px] font-black uppercase flex items-center gap-1 transition-all cursor-pointer shadow-[0_0_8px_rgba(0,255,0,0.15)]"
              title="Load this submission into the active Arena Editor"
            >
              <RotateCcw className="w-3 h-3" />
              <span className="hidden sm:inline">RESTORE</span>
            </button>
          )}

          {/* Expand / Minimize Modal */}
          <button
            type="button"
            onClick={() => setIsExpanded(!isExpanded)}
            className="p-1 bg-black border border-white/15 text-zinc-400 hover:text-white transition-colors cursor-pointer"
            title={isExpanded ? 'Minimize View' : 'Expand Fullscreen'}
          >
            {isExpanded ? <Minimize2 className="w-3.5 h-3.5" /> : <Maximize2 className="w-3.5 h-3.5" />}
          </button>
        </div>
      </div>

      {/* Optional Feedback Alert */}
      {feedback && (
        <div className={`px-3 py-1.5 border-b border-white/10 text-[11px] flex items-center gap-2 ${
          isSuccess ? 'bg-[#00FF00]/5 text-[#00FF00]' : 'bg-rose-500/5 text-zinc-300'
        }`}>
          <span className="font-bold uppercase tracking-wider text-[10px] text-zinc-500">REFEREE COMMENTARY:</span>
          <span>{feedback}</span>
        </div>
      )}

      {/* Editor Body */}
      <div 
        className="relative flex-1 bg-[#050505] overflow-hidden" 
        style={{ height: isExpanded ? 'calc(100% - 75px)' : height }}
      >
        {engine === 'monaco' ? (
          <Editor
            height="100%"
            language={monacoLang}
            theme={theme}
            beforeMount={registerMonacoThemes}
            value={code}
            options={{
              readOnly: true,
              domReadOnly: true,
              minimap: { enabled: !compact && isExpanded },
              fontSize,
              fontFamily: "'JetBrains Mono', monospace",
              lineHeight: Math.round(fontSize * 1.65),
              padding: { top: 12, bottom: 12 },
              scrollBeyondLastLine: false,
              wordWrap: 'on',
              renderLineHighlight: 'all',
              lineNumbers: 'on',
              folding: true,
              contextmenu: false,
              smoothScrolling: true,
            }}
          />
        ) : (
          /* Prism.js Syntax Highlighting View */
          <div className="h-full overflow-auto custom-scrollbar p-3 font-mono">
            <div className="grid grid-cols-[2.5rem_1fr] text-xs leading-relaxed">
              {/* Line Numbers */}
              <div className="select-none text-right pr-3 text-zinc-600 border-r border-white/10 font-mono text-[11px]">
                {Array.from({ length: lineCount }).map((_, i) => (
                  <div key={i} style={{ height: `${Math.round(fontSize * 1.65)}px` }}>
                    {i + 1}
                  </div>
                ))}
              </div>

              {/* Syntax Highlighted Code */}
              <pre
                className="pl-3 overflow-x-auto prism-code whitespace-pre font-mono text-zinc-200"
                style={{ fontSize: `${fontSize}px`, lineHeight: `${Math.round(fontSize * 1.65)}px` }}
                dangerouslySetInnerHTML={{ __html: prismHtml }}
              />
            </div>
          </div>
        )}
      </div>

      {/* Footer Status Bar */}
      <div className="flex items-center justify-between px-3 py-1 bg-[#0d0d0d] border-t border-white/10 text-[9px] text-zinc-500 uppercase tracking-wider shrink-0">
        <div className="flex items-center gap-3">
          <span>LINES: {lineCount}</span>
          <span>LANG: {language}</span>
          <span>HIGHLIGHT: {engine === 'monaco' ? 'MONACO ENGINE' : 'PRISM.JS ENGINE'}</span>
        </div>
        <div>
          {timestamp ? <span>SUBMITTED AT: {timestamp}</span> : <span>READ-ONLY SUBMISSION TELEMETRY</span>}
        </div>
      </div>
    </div>
  );
}
