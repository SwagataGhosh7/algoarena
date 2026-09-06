import React, { useState, useMemo } from 'react';
import { DiffEditor } from '@monaco-editor/react';
import { 
  GitCompare, 
  SplitSquareVertical, 
  AlignLeft, 
  Copy, 
  Check, 
  User, 
  Bot, 
  Sparkles, 
  Code2, 
  CheckCircle2, 
  X,
  Palette
} from 'lucide-react';
import { EDITOR_THEMES, registerMonacoThemes } from '../lib/editorThemes';

interface SolutionDiffViewerProps {
  userCode: string;
  userLanguage?: string;
  userName?: string;
  opponentCode?: string;
  opponentLanguage?: string;
  opponentName?: string;
  expectedSolution?: string;
  theme?: string;
  onThemeChange?: (theme: string) => void;
  onClose?: () => void;
}

function normalizeMonacoLang(lang?: string): string {
  if (!lang) return 'javascript';
  const l = lang.toLowerCase();
  if (l === 'c') return 'c';
  if (l === 'cpp' || l === 'c++') return 'cpp';
  if (l === 'java') return 'java';
  if (l === 'python' || l === 'py') return 'python';
  if (l === 'typescript' || l === 'ts') return 'typescript';
  if (l === 'go' || l === 'golang') return 'go';
  if (l === 'rust' || l === 'rs') return 'rust';
  return 'javascript';
}

export const SolutionDiffViewer: React.FC<SolutionDiffViewerProps> = ({
  userCode,
  userLanguage = 'typescript',
  userName = 'Your Code',
  opponentCode = '',
  opponentLanguage = 'typescript',
  opponentName = 'Opponent',
  expectedSolution = '',
  theme = 'monokai',
  onThemeChange,
  onClose,
}) => {
  // Diff target: 'opponent' or 'expected'
  const [diffTarget, setDiffTarget] = useState<'opponent' | 'expected'>('opponent');
  const [sideBySide, setSideBySide] = useState<boolean>(true);
  const [copiedLeft, setCopiedLeft] = useState(false);
  const [copiedRight, setCopiedRight] = useState(false);
  const [showThemePicker, setShowThemePicker] = useState(false);

  // Active right-side code and details based on target
  const rightCode = useMemo(() => {
    if (diffTarget === 'opponent') {
      if (opponentCode && opponentCode.trim().length > 0) {
        return opponentCode;
      }
      return expectedSolution || '// Opponent submission was not recorded or match concluded early.';
    }
    return expectedSolution || '// No canonical solution loaded.';
  }, [diffTarget, opponentCode, expectedSolution]);

  const rightTitle = diffTarget === 'opponent' ? opponentName : 'Expected Canonical Solution';
  const rightLang = diffTarget === 'opponent' ? opponentLanguage : userLanguage;

  const leftLangFormatted = normalizeMonacoLang(userLanguage);
  const rightLangFormatted = normalizeMonacoLang(rightLang);

  const leftLineCount = userCode.split('\n').length;
  const rightLineCount = rightCode.split('\n').length;

  const handleCopyLeft = () => {
    navigator.clipboard.writeText(userCode);
    setCopiedLeft(true);
    setTimeout(() => setCopiedLeft(false), 2000);
  };

  const handleCopyRight = () => {
    navigator.clipboard.writeText(rightCode);
    setCopiedRight(true);
    setTimeout(() => setCopiedRight(false), 2000);
  };

  return (
    <div className="flex flex-col h-full w-full bg-[#080808] border border-white/10 rounded-lg overflow-hidden shadow-2xl">
      {/* Top Header Controls Bar */}
      <div className="bg-[#0f0f0f] border-b border-white/10 px-4 py-3 flex flex-wrap items-center justify-between gap-3 shrink-0">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 text-white font-mono font-bold text-sm tracking-wide">
            <GitCompare className="w-4 h-4 text-[#00FF00]" />
            <span>SOLUTION DIFF VIEWER</span>
          </div>

          {/* Comparison Target Selector */}
          <div className="flex items-center bg-black/60 border border-white/10 rounded-md p-0.5">
            <button
              onClick={() => setDiffTarget('opponent')}
              className={`flex items-center gap-1.5 px-3 py-1 text-xs font-mono rounded transition-all ${
                diffTarget === 'opponent'
                  ? 'bg-white/20 text-white font-bold shadow-sm'
                  : 'text-zinc-400 hover:text-white'
              }`}
            >
              <User className="w-3.5 h-3.5" />
              <span>VS OPPONENT</span>
            </button>
            <button
              onClick={() => setDiffTarget('expected')}
              className={`flex items-center gap-1.5 px-3 py-1 text-xs font-mono rounded transition-all ${
                diffTarget === 'expected'
                  ? 'bg-[#00FF00]/20 text-[#00FF00] font-bold border border-[#00FF00]/30 shadow-sm'
                  : 'text-zinc-400 hover:text-white'
              }`}
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>VS EXPECTED SOLUTION</span>
            </button>
          </div>
        </div>

        {/* View mode, theme, and close controls */}
        <div className="flex items-center gap-2">
          {/* Split vs Inline Toggle */}
          <div className="flex items-center bg-black/60 border border-white/10 rounded-md p-0.5">
            <button
              onClick={() => setSideBySide(true)}
              title="Side-by-Side Split View"
              className={`p-1.5 rounded transition-all ${
                sideBySide ? 'bg-white/20 text-white' : 'text-zinc-400 hover:text-white'
              }`}
            >
              <SplitSquareVertical className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => setSideBySide(false)}
              title="Unified Inline Diff View"
              className={`p-1.5 rounded transition-all ${
                !sideBySide ? 'bg-white/20 text-white' : 'text-zinc-400 hover:text-white'
              }`}
            >
              <AlignLeft className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Theme Dropdown Toggle */}
          {onThemeChange && (
            <div className="relative">
              <button
                onClick={() => setShowThemePicker(!showThemePicker)}
                title="Change Monaco Theme"
                className="flex items-center gap-1.5 px-2.5 py-1.5 bg-black/60 border border-white/10 rounded text-xs font-mono text-zinc-300 hover:text-white hover:border-white/20 transition-all"
              >
                <Palette className="w-3.5 h-3.5 text-zinc-400" />
                <span className="hidden sm:inline capitalize">{theme}</span>
              </button>

              {showThemePicker && (
                <div className="absolute right-0 top-full mt-1 w-44 bg-[#141414] border border-white/20 rounded shadow-xl py-1 z-50">
                  <div className="px-2.5 py-1 text-[10px] font-mono uppercase tracking-widest text-zinc-500 border-b border-white/5">
                    Editor Themes
                  </div>
                  {EDITOR_THEMES.map((t) => (
                    <button
                      key={t.id}
                      onClick={() => {
                        onThemeChange(t.id);
                        setShowThemePicker(false);
                      }}
                      className={`w-full px-2.5 py-1.5 text-xs text-left font-mono flex items-center justify-between hover:bg-white/10 transition-colors ${
                        theme === t.id ? 'text-[#00FF00] font-bold bg-[#00FF00]/5' : 'text-zinc-300'
                      }`}
                    >
                      <span>{t.name}</span>
                      {theme === t.id && <Check className="w-3.5 h-3.5 text-[#00FF00]" />}
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Close Action */}
          {onClose && (
            <button
              onClick={onClose}
              className="p-1.5 text-zinc-400 hover:text-white hover:bg-white/10 rounded transition-colors"
              title="Close Diff Viewer"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {/* Pane Headers (Left vs Right) */}
      <div className="grid grid-cols-2 bg-[#141414] border-b border-white/10 text-xs font-mono divide-x divide-white/10">
        {/* Left Side: User Code */}
        <div className="px-4 py-2 flex items-center justify-between bg-black/30">
          <div className="flex items-center gap-2 truncate">
            <span className="w-2 h-2 rounded-full bg-blue-500"></span>
            <span className="font-bold text-white truncate">{userName} (Original)</span>
            <span className="px-1.5 py-0.5 rounded bg-blue-500/10 text-blue-400 text-[10px] uppercase">
              {leftLangFormatted}
            </span>
            <span className="text-zinc-500 text-[11px]">({leftLineCount} lines)</span>
          </div>
          <button
            onClick={handleCopyLeft}
            className="flex items-center gap-1 text-[11px] text-zinc-400 hover:text-white transition-colors"
            title="Copy Your Code"
          >
            {copiedLeft ? <Check className="w-3 h-3 text-[#00FF00]" /> : <Copy className="w-3 h-3" />}
            <span>{copiedLeft ? 'Copied' : 'Copy'}</span>
          </button>
        </div>

        {/* Right Side: Opponent or Expected Solution */}
        <div className="px-4 py-2 flex items-center justify-between bg-black/30">
          <div className="flex items-center gap-2 truncate">
            <span className={`w-2 h-2 rounded-full ${diffTarget === 'opponent' ? 'bg-amber-500' : 'bg-[#00FF00]'}`}></span>
            <span className="font-bold text-white truncate">{rightTitle}</span>
            <span className={`px-1.5 py-0.5 rounded text-[10px] uppercase ${
              diffTarget === 'opponent' 
                ? 'bg-amber-500/10 text-amber-400' 
                : 'bg-[#00FF00]/10 text-[#00FF00]'
            }`}>
              {rightLangFormatted}
            </span>
            <span className="text-zinc-500 text-[11px]">({rightLineCount} lines)</span>
          </div>
          <button
            onClick={handleCopyRight}
            className="flex items-center gap-1 text-[11px] text-zinc-400 hover:text-white transition-colors"
            title="Copy Target Code"
          >
            {copiedRight ? <Check className="w-3 h-3 text-[#00FF00]" /> : <Copy className="w-3 h-3" />}
            <span>{copiedRight ? 'Copied' : 'Copy'}</span>
          </button>
        </div>
      </div>

      {/* Monaco DiffEditor Canvas */}
      <div className="flex-1 w-full min-h-[350px] relative bg-black/50">
        <DiffEditor
          height="100%"
          language={leftLangFormatted}
          original={userCode}
          modified={rightCode}
          theme={theme}
          beforeMount={registerMonacoThemes}
          options={{
            readOnly: true,
            renderSideBySide: sideBySide,
            fontSize: 13,
            fontFamily: "'JetBrains Mono', monospace",
            lineHeight: 22,
            minimap: { enabled: false },
            scrollBeyondLastLine: false,
            automaticLayout: true,
            renderOverviewRuler: true,
            diffWordWrap: 'off',
            ignoreTrimWhitespace: false,
          }}
        />
      </div>

      {/* Bottom Diff Legend & Summary */}
      <div className="px-4 py-2 bg-[#0c0c0c] border-t border-white/10 flex flex-wrap items-center justify-between gap-3 text-xs font-mono text-zinc-400 shrink-0">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-sm bg-red-500/40 border border-red-500"></span>
            <span>Removed / Modified in original</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-sm bg-green-500/40 border border-green-500"></span>
            <span>Added / Divergent in target</span>
          </div>
        </div>
        <div className="text-[11px] text-zinc-500">
          Tip: Use the target toggle above to compare against your opponent or the canonical reference solution.
        </div>
      </div>
    </div>
  );
};
