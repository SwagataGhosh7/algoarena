import React, { useState, useEffect } from 'react';
import Editor from '@monaco-editor/react';
import { 
  Stethoscope, 
  AlertCircle, 
  AlertTriangle, 
  CheckCircle2, 
  Wrench, 
  Copy, 
  Check, 
  ArrowRight, 
  RefreshCw, 
  Code2, 
  GitCompare, 
  Filter, 
  CheckSquare,
  Sparkles,
  ChevronRight
} from 'lucide-react';
import { LineByLineAnalysisItem, LineByLineAnalysisResult } from '../types';
import { registerMonacoThemes } from '../lib/editorThemes';

interface LineByLineAnalyzerProps {
  code: string;
  language: string;
  problem: any;
  testResults?: any;
  error?: string;
  theme?: string;
  onApplyFixedCode?: (fixedCode: string) => void;
  onDiffFixedCode?: (fixedCode: string) => void;
}

export const LineByLineAnalyzer: React.FC<LineByLineAnalyzerProps> = ({
  code,
  language,
  problem,
  testResults,
  error,
  theme = 'monokai',
  onApplyFixedCode,
  onDiffFixedCode,
}) => {
  const [loading, setLoading] = useState<boolean>(true);
  const [analysis, setAnalysis] = useState<LineByLineAnalysisResult | null>(null);
  const [filterMode, setFilterMode] = useState<'all' | 'errors' | 'warnings'>('errors');
  const [activeTab, setActiveTab] = useState<'lines' | 'full_code'>('lines');
  const [copiedLine, setCopiedLine] = useState<number | null>(null);
  const [copiedFull, setCopiedFull] = useState<boolean>(false);

  const runAnalysis = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/analyze-code-lines', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          code,
          language,
          problem,
          testResults,
          error,
        }),
      });
      const data = await response.json();
      if (data.analysis) {
        setAnalysis(data.analysis);
        // If no errors, default to 'all' lines filter
        if (!data.analysis.hasErrors) {
          setFilterMode('all');
        }
      }
    } catch (err) {
      console.error('Error running line analysis:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    runAnalysis();
  }, [code, language, problem]);

  const handleCopyLine = (lineNum: number, fixText?: string) => {
    if (!fixText) return;
    navigator.clipboard.writeText(fixText);
    setCopiedLine(lineNum);
    setTimeout(() => setCopiedLine(null), 2000);
  };

  const handleCopyFull = () => {
    if (!analysis?.fullFixedCode) return;
    navigator.clipboard.writeText(analysis.fullFixedCode);
    setCopiedFull(true);
    setTimeout(() => setCopiedFull(false), 2000);
  };

  const lineAnalyses = analysis?.lineAnalyses || [];

  const filteredLines = lineAnalyses.filter((item) => {
    if (filterMode === 'all') return true;
    if (filterMode === 'errors') {
      return item.status === 'error' || item.status === 'fix_recommended';
    }
    if (filterMode === 'warnings') {
      return item.status === 'warning' || item.status === 'error' || item.status === 'fix_recommended';
    }
    return true;
  });

  const errorCount = lineAnalyses.filter((l) => l.status === 'error').length;
  const fixCount = lineAnalyses.filter((l) => l.status === 'fix_recommended').length;
  const warningCount = lineAnalyses.filter((l) => l.status === 'warning').length;

  return (
    <div className="flex flex-col h-full w-full bg-[#080808] border border-white/10 rounded-lg overflow-hidden shadow-2xl">
      {/* Top Header Controls Bar */}
      <div className="bg-[#0f0f0f] border-b border-white/10 px-4 py-2.5 flex flex-wrap items-center justify-between gap-3 shrink-0">
        <div className="flex items-center gap-2.5">
          <div className="p-1 rounded bg-[#00FF00]/10 text-[#00FF00]">
            <Stethoscope className="w-4 h-4" />
          </div>
          <div>
            <div className="font-mono text-xs font-bold uppercase tracking-wider text-white flex items-center gap-2">
              <span>Code Doctor & Line-by-Line Fixes</span>
              {analysis && (
                <span className={`px-1.5 py-0.2 rounded text-[10px] uppercase font-mono ${
                  analysis.hasErrors 
                    ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20' 
                    : 'bg-[#00FF00]/10 text-[#00FF00] border border-[#00FF00]/20'
                }`}>
                  {analysis.hasErrors ? `${errorCount + fixCount} Fixes Found` : 'No Critical Flaws'}
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Action controls */}
        <div className="flex items-center gap-2">
          {/* Tab Switcher: Line Breakdown vs Full Fixed Code */}
          <div className="flex items-center bg-black/60 border border-white/10 rounded-md p-0.5">
            <button
              onClick={() => setActiveTab('lines')}
              className={`px-3 py-1 text-xs font-mono rounded transition-all ${
                activeTab === 'lines'
                  ? 'bg-white/20 text-white font-bold'
                  : 'text-zinc-400 hover:text-white'
              }`}
            >
              Line Diagnostics
            </button>
            <button
              onClick={() => setActiveTab('full_code')}
              className={`flex items-center gap-1.5 px-3 py-1 text-xs font-mono rounded transition-all ${
                activeTab === 'full_code'
                  ? 'bg-[#00FF00]/20 text-[#00FF00] font-bold border border-[#00FF00]/30'
                  : 'text-zinc-400 hover:text-white'
              }`}
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>Full Fixed Code</span>
            </button>
          </div>

          <button
            onClick={runAnalysis}
            disabled={loading}
            className="flex items-center gap-1.5 px-2.5 py-1 bg-white/5 hover:bg-white/10 border border-white/10 rounded text-xs font-mono text-zinc-300 transition-colors disabled:opacity-50"
            title="Re-run deep code diagnosis"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin text-[#00FF00]' : ''}`} />
            <span className="hidden sm:inline">Re-analyze</span>
          </button>
        </div>
      </div>

      {/* Main Analysis Card Overview */}
      {analysis && (
        <div className="bg-[#121212] border-b border-white/10 p-4 shrink-0">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-2.5">
            <div className="flex items-center gap-2">
              {analysis.hasErrors ? (
                <AlertCircle className="w-5 h-5 text-amber-400 shrink-0" />
              ) : (
                <CheckCircle2 className="w-5 h-5 text-[#00FF00] shrink-0" />
              )}
              <span className="font-mono text-sm font-bold text-white">
                {analysis.overallVerdict}
              </span>
            </div>

            <div className="flex items-center gap-3 text-xs font-mono text-zinc-400">
              {analysis.timeComplexity && (
                <span className="bg-black/50 px-2 py-0.5 rounded border border-white/10">
                  Target: <span className="text-blue-400 font-bold">{analysis.timeComplexity}</span>
                </span>
              )}
              {analysis.spaceComplexity && (
                <span className="bg-black/50 px-2 py-0.5 rounded border border-white/10">
                  Space: <span className="text-purple-400 font-bold">{analysis.spaceComplexity}</span>
                </span>
              )}
            </div>
          </div>

          <p className="text-xs text-zinc-300 font-mono leading-relaxed mb-3">
            {analysis.summary}
          </p>

          {analysis.keyFixes && analysis.keyFixes.length > 0 && (
            <div className="bg-black/40 border border-white/5 rounded p-2.5">
              <div className="text-[11px] font-mono font-bold uppercase tracking-wider text-zinc-400 mb-1.5 flex items-center gap-1.5">
                <Wrench className="w-3.5 h-3.5 text-[#00FF00]" />
                <span>Key Recommended Adjustments:</span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5 text-xs font-mono text-zinc-300">
                {analysis.keyFixes.map((fix, idx) => (
                  <div key={idx} className="flex items-start gap-1.5">
                    <ChevronRight className="w-3.5 h-3.5 text-[#00FF00] shrink-0 mt-0.5" />
                    <span>{fix}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Filter and View Mode Toolbar (for lines tab) */}
      {activeTab === 'lines' && (
        <div className="bg-[#0e0e0e] border-b border-white/10 px-4 py-2 flex flex-wrap items-center justify-between gap-3 text-xs font-mono shrink-0">
          <div className="flex items-center gap-2">
            <Filter className="w-3.5 h-3.5 text-zinc-500" />
            <span className="text-zinc-500 text-[11px] uppercase">Filter:</span>

            <button
              onClick={() => setFilterMode('errors')}
              className={`px-2 py-0.5 rounded transition-all ${
                filterMode === 'errors'
                  ? 'bg-amber-500/20 text-amber-300 font-bold border border-amber-500/30'
                  : 'text-zinc-400 hover:text-white'
              }`}
            >
              Fixes & Errors ({errorCount + fixCount})
            </button>

            <button
              onClick={() => setFilterMode('warnings')}
              className={`px-2 py-0.5 rounded transition-all ${
                filterMode === 'warnings'
                  ? 'bg-yellow-500/20 text-yellow-300 font-bold border border-yellow-500/30'
                  : 'text-zinc-400 hover:text-white'
              }`}
            >
              Warnings ({warningCount})
            </button>

            <button
              onClick={() => setFilterMode('all')}
              className={`px-2 py-0.5 rounded transition-all ${
                filterMode === 'all'
                  ? 'bg-white/20 text-white font-bold'
                  : 'text-zinc-400 hover:text-white'
              }`}
            >
              All Lines ({lineAnalyses.length})
            </button>
          </div>

          <div className="text-[11px] text-zinc-500">
            Click 'Copy Line' on any recommendation to patch into your editor
          </div>
        </div>
      )}

      {/* Content Area: Either Lines View or Full Fixed Code */}
      <div className="flex-1 w-full overflow-y-auto min-h-[300px] relative bg-black/40">
        {loading && (
          <div className="absolute inset-0 bg-black/75 backdrop-blur-xs flex flex-col items-center justify-center z-20 gap-3 text-zinc-300 font-mono text-xs">
            <RefreshCw className="w-6 h-6 animate-spin text-[#00FF00]" />
            <p className="tracking-wider uppercase font-bold text-white">
              Inspecting code line-by-line & computing boundary fixes...
            </p>
          </div>
        )}

        {activeTab === 'lines' ? (
          <div className="divide-y divide-white/5 font-mono text-xs p-2">
            {filteredLines.length === 0 ? (
              <div className="text-center py-12 text-zinc-500">
                <CheckCircle2 className="w-8 h-8 mx-auto mb-2 text-[#00FF00]" />
                <p>No issues found in this category.</p>
              </div>
            ) : (
              filteredLines.map((item) => {
                const hasFix = item.status !== 'ok';
                const isError = item.status === 'error';
                const isFix = item.status === 'fix_recommended';
                const isWarning = item.status === 'warning';

                return (
                  <div
                    key={item.lineNumber}
                    className={`p-3 rounded my-1 transition-all ${
                      isError
                        ? 'bg-red-950/15 border border-red-500/20'
                        : isFix
                        ? 'bg-amber-950/15 border border-amber-500/20'
                        : isWarning
                        ? 'bg-yellow-950/10 border border-yellow-500/15'
                        : 'hover:bg-white/5'
                    }`}
                  >
                    {/* Line Header */}
                    <div className="flex items-center justify-between gap-2 mb-2">
                      <div className="flex items-center gap-2">
                        <span className="px-2 py-0.5 rounded bg-black/60 border border-white/10 font-bold text-zinc-300 text-[11px]">
                          Line {item.lineNumber}
                        </span>

                        <span
                          className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                            isError
                              ? 'bg-red-500/20 text-red-400 border border-red-500/30'
                              : isFix
                              ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                              : isWarning
                              ? 'bg-yellow-500/20 text-yellow-400 border border-yellow-500/30'
                              : 'bg-[#00FF00]/10 text-[#00FF00]'
                          }`}
                        >
                          {item.status.replace('_', ' ')}
                        </span>

                        {item.issue && (
                          <span className="text-zinc-300 font-medium text-xs">
                            {item.issue}
                          </span>
                        )}
                      </div>

                      {item.recommendedFix && (
                        <button
                          onClick={() => handleCopyLine(item.lineNumber, item.recommendedFix)}
                          className="flex items-center gap-1 px-2 py-1 rounded bg-black/50 hover:bg-white/10 border border-white/10 text-zinc-300 text-[11px] transition-colors"
                          title="Copy recommended replacement line"
                        >
                          {copiedLine === item.lineNumber ? (
                            <>
                              <Check className="w-3 h-3 text-[#00FF00]" />
                              <span className="text-[#00FF00]">Copied</span>
                            </>
                          ) : (
                            <>
                              <Copy className="w-3 h-3" />
                              <span>Copy Fix</span>
                            </>
                          )}
                        </button>
                      )}
                    </div>

                    {/* Original Submitted Line */}
                    <div className="bg-black/70 rounded p-2 border border-white/5 mb-1.5 flex items-start gap-2 overflow-x-auto">
                      <span className="text-red-400 font-bold select-none shrink-0">-</span>
                      <code className="text-zinc-300 whitespace-pre">{item.code || '(empty line)'}</code>
                    </div>

                    {/* Recommended Replacement Line */}
                    {item.recommendedFix && (
                      <div className="bg-[#00FF00]/5 rounded p-2 border border-[#00FF00]/20 mb-2 flex items-start gap-2 overflow-x-auto">
                        <span className="text-[#00FF00] font-bold select-none shrink-0">+</span>
                        <code className="text-[#00FF00] font-bold whitespace-pre">{item.recommendedFix}</code>
                      </div>
                    )}

                    {/* Explanation */}
                    {item.explanation && (
                      <p className="text-[11px] text-zinc-400 mt-1 pl-1">
                        <span className="text-zinc-500 mr-1">Why:</span>
                        {item.explanation}
                      </p>
                    )}
                  </div>
                );
              })
            )}
          </div>
        ) : (
          /* Full Fixed Code View */
          <div className="h-full flex flex-col">
            <div className="p-3 bg-[#111] border-b border-white/10 flex items-center justify-between gap-3 shrink-0">
              <div className="flex items-center gap-2 text-xs font-mono text-zinc-300">
                <Sparkles className="w-4 h-4 text-[#00FF00]" />
                <span>Complete fully-passing, corrected {language} solution:</span>
              </div>
              <div className="flex items-center gap-2">
                {onDiffFixedCode && analysis?.fullFixedCode && (
                  <button
                    onClick={() => onDiffFixedCode(analysis.fullFixedCode!)}
                    className="flex items-center gap-1.5 px-3 py-1 bg-white/10 hover:bg-white/20 border border-white/10 rounded text-xs font-mono text-zinc-200 transition-colors"
                  >
                    <GitCompare className="w-3.5 h-3.5 text-[#00FF00]" />
                    <span>Diff with Submission</span>
                  </button>
                )}
                <button
                  onClick={handleCopyFull}
                  className="flex items-center gap-1.5 px-3 py-1 bg-[#00FF00] hover:bg-[#00CC00] text-black font-bold font-mono text-xs rounded transition-colors"
                >
                  {copiedFull ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copiedFull ? 'COPIED!' : 'COPY FULL FIXED CODE'}</span>
                </button>
              </div>
            </div>
            <div className="flex-1 min-h-[350px]">
              <Editor
                height="100%"
                language={
                  language === 'c' ? 'c' :
                  language === 'cpp' ? 'cpp' :
                  language === 'java' ? 'java' :
                  language === 'python' ? 'python' :
                  language === 'typescript' ? 'typescript' :
                  language === 'go' ? 'go' :
                  language === 'rust' ? 'rust' : 'javascript'
                }
                theme={theme}
                value={analysis?.fullFixedCode || '// Generating full solution...'}
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
          </div>
        )}
      </div>

      {/* Footer bar */}
      <div className="px-4 py-2 bg-[#0c0c0c] border-t border-white/10 flex items-center justify-between text-[11px] font-mono text-zinc-500 shrink-0">
        <span>Powered by AlgoArena Automated Line Diagnostic Engine</span>
        <span>Compiler verified with hidden boundary constraints</span>
      </div>
    </div>
  );
};
