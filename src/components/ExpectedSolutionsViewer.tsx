import React, { useState, useEffect } from 'react';
import Editor from '@monaco-editor/react';
import { 
  Code2, 
  Copy, 
  Check, 
  Sparkles, 
  Clock, 
  Database, 
  GitCompare, 
  Loader2, 
  HelpCircle,
  FileCode2
} from 'lucide-react';
import { SolutionLanguageOption } from '../types';
import { registerMonacoThemes } from '../lib/editorThemes';

interface ExpectedSolutionsViewerProps {
  problem: any;
  userLanguage?: string;
  theme?: string;
  onCompareInDiff?: (expectedCode: string, lang: string) => void;
}

const SUPPORTED_LANGUAGES: { id: string; name: string; ext: string; monacoLang: string }[] = [
  { id: 'python', name: 'Python 3', ext: '.py', monacoLang: 'python' },
  { id: 'javascript', name: 'JavaScript', ext: '.js', monacoLang: 'javascript' },
  { id: 'typescript', name: 'TypeScript', ext: '.ts', monacoLang: 'typescript' },
  { id: 'cpp', name: 'C++20', ext: '.cpp', monacoLang: 'cpp' },
  { id: 'java', name: 'Java 17', ext: '.java', monacoLang: 'java' },
  { id: 'c', name: 'C (C11)', ext: '.c', monacoLang: 'c' },
  { id: 'go', name: 'Go 1.22', ext: '.go', monacoLang: 'go' },
  { id: 'rust', name: 'Rust 2021', ext: '.rs', monacoLang: 'rust' },
];

export const ExpectedSolutionsViewer: React.FC<ExpectedSolutionsViewerProps> = ({
  problem,
  userLanguage = 'typescript',
  theme = 'monokai',
  onCompareInDiff,
}) => {
  const [selectedLang, setSelectedLang] = useState<string>(() => {
    const normalized = userLanguage.toLowerCase();
    const match = SUPPORTED_LANGUAGES.find(l => l.id === normalized || normalized.includes(l.id));
    return match ? match.id : 'python';
  });
  const [solutionsMap, setSolutionsMap] = useState<Record<string, SolutionLanguageOption>>({});
  const [loading, setLoading] = useState<boolean>(true);
  const [copied, setCopied] = useState<boolean>(false);

  useEffect(() => {
    let isMounted = true;

    async function loadSolutions() {
      setLoading(true);
      try {
        const response = await fetch('/api/expected-solutions', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ problem }),
        });
        const data = await response.json();
        if (isMounted && data.solutions) {
          setSolutionsMap(data.solutions);
        }
      } catch (err) {
        console.error('Failed to fetch multi-language expected solutions:', err);
      } finally {
        if (isMounted) setLoading(false);
      }
    }

    loadSolutions();
    return () => {
      isMounted = false;
    };
  }, [problem]);

  const activeSolution = solutionsMap[selectedLang] || {
    id: selectedLang,
    name: SUPPORTED_LANGUAGES.find(l => l.id === selectedLang)?.name || selectedLang,
    extension: SUPPORTED_LANGUAGES.find(l => l.id === selectedLang)?.ext || '',
    monacoLang: selectedLang,
    code: '// Generating reference solution...',
    timeComplexity: 'O(N)',
    spaceComplexity: 'O(N)',
    explanation: 'Optimal algorithmic implementation with minimal complexity.',
  };

  const handleCopy = () => {
    if (!activeSolution?.code) return;
    navigator.clipboard.writeText(activeSolution.code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const activeMonacoLang = SUPPORTED_LANGUAGES.find(l => l.id === selectedLang)?.monacoLang || selectedLang;

  return (
    <div className="flex flex-col h-full w-full bg-[#080808] border border-white/10 rounded-lg overflow-hidden shadow-2xl">
      {/* Language Selector Navigation Bar */}
      <div className="bg-[#0f0f0f] border-b border-white/10 px-4 py-2.5 flex flex-wrap items-center justify-between gap-3 shrink-0">
        <div className="flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-[#00FF00]" />
          <span className="font-mono text-xs font-bold uppercase tracking-wider text-white">
            Reference Solution Code (All Languages)
          </span>
        </div>

        {/* Action buttons */}
        <div className="flex items-center gap-2">
          {onCompareInDiff && (
            <button
              onClick={() => onCompareInDiff(activeSolution.code, selectedLang)}
              className="flex items-center gap-1.5 px-3 py-1 bg-white/10 hover:bg-white/20 border border-white/10 rounded text-xs font-mono text-zinc-200 transition-colors"
              title="Compare this expected code against your submission in Diff Editor"
            >
              <GitCompare className="w-3.5 h-3.5 text-[#00FF00]" />
              <span>Diff with My Code</span>
            </button>
          )}

          <button
            onClick={handleCopy}
            disabled={loading}
            className="flex items-center gap-1.5 px-3 py-1 bg-[#00FF00] hover:bg-[#00CC00] text-black font-black font-mono text-xs rounded transition-colors shadow-[0_0_10px_rgba(0,255,0,0.2)] disabled:opacity-50"
            title="Copy reference code"
          >
            {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
            <span>{copied ? 'COPIED!' : 'COPY CODE'}</span>
          </button>
        </div>
      </div>

      {/* Language Tabs Strip */}
      <div className="bg-[#141414] border-b border-white/10 px-3 py-1.5 flex items-center gap-1.5 overflow-x-auto shrink-0 scrollbar-none">
        {SUPPORTED_LANGUAGES.map((lang) => {
          const isSelected = selectedLang === lang.id;
          return (
            <button
              key={lang.id}
              onClick={() => setSelectedLang(lang.id)}
              className={`flex items-center gap-1.5 px-3 py-1 rounded text-xs font-mono whitespace-nowrap transition-all ${
                isSelected
                  ? 'bg-[#00FF00]/15 text-[#00FF00] font-bold border border-[#00FF00]/30 shadow-sm'
                  : 'text-zinc-400 hover:text-white hover:bg-white/5 border border-transparent'
              }`}
            >
              <FileCode2 className={`w-3.5 h-3.5 ${isSelected ? 'text-[#00FF00]' : 'text-zinc-500'}`} />
              <span>{lang.name}</span>
              <span className="text-[10px] opacity-60 font-normal">{lang.ext}</span>
            </button>
          );
        })}
      </div>

      {/* Algorithmic Complexity & Approach Banner */}
      <div className="bg-[#0b0b0b] border-b border-white/10 px-4 py-2 flex flex-wrap items-center justify-between gap-3 text-xs font-mono shrink-0">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-1.5 text-zinc-300">
            <Clock className="w-3.5 h-3.5 text-blue-400" />
            <span className="text-zinc-500">Time:</span>
            <span className="font-bold text-blue-300">{activeSolution.timeComplexity || 'O(N)'}</span>
          </div>

          <div className="flex items-center gap-1.5 text-zinc-300">
            <Database className="w-3.5 h-3.5 text-purple-400" />
            <span className="text-zinc-500">Space:</span>
            <span className="font-bold text-purple-300">{activeSolution.spaceComplexity || 'O(1)'}</span>
          </div>
        </div>

        {activeSolution.explanation && (
          <div className="text-[11px] text-zinc-400 max-w-xl truncate">
            <span className="text-zinc-500 mr-1">Approach:</span>
            <span>{activeSolution.explanation}</span>
          </div>
        )}
      </div>

      {/* Editor Canvas displaying optimal code */}
      <div className="flex-1 w-full min-h-[350px] relative bg-black/60">
        {loading && (
          <div className="absolute inset-0 bg-black/70 backdrop-blur-xs flex items-center justify-center z-10 gap-2 text-zinc-400 font-mono text-xs">
            <Loader2 className="w-4 h-4 animate-spin text-[#00FF00]" />
            <span>Compiling verified multi-language solutions...</span>
          </div>
        )}

        <Editor
          height="100%"
          language={activeMonacoLang}
          theme={theme}
          value={activeSolution.code || '// Solution unavailable'}
          beforeMount={registerMonacoThemes}
          options={{
            readOnly: true,
            fontSize: 13,
            fontFamily: "'JetBrains Mono', monospace",
            lineHeight: 22,
            minimap: { enabled: false },
            scrollBeyondLastLine: false,
            automaticLayout: true,
            padding: { top: 12 },
          }}
        />
      </div>

      {/* Footer Notes */}
      <div className="px-4 py-2 bg-[#0c0c0c] border-t border-white/10 flex items-center justify-between text-[11px] font-mono text-zinc-500 shrink-0">
        <div className="flex items-center gap-1.5">
          <HelpCircle className="w-3.5 h-3.5 text-zinc-600" />
          <span>All 8 language implementations are verified against hidden boundary test suites.</span>
        </div>
        <div className="text-zinc-600">
          AlgoArena Automated Benchmark Solutions
        </div>
      </div>
    </div>
  );
};
