import { useState } from 'react';
import { 
  Bot, 
  Lightbulb, 
  Compass, 
  Sparkles, 
  AlertTriangle, 
  ChevronDown, 
  ChevronUp, 
  Send, 
  Check, 
  Copy, 
  Loader2, 
  History,
  HelpCircle,
  Zap
} from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import { apiUrl } from '../api';
import { Problem, AIHelperItem } from '../types';
import { soundManager } from '../lib/soundEffects';

interface AIHelperProps {
  problem: Problem | null;
  code: string;
  language: string;
  roomId?: string;
  hintsUsed: number;
  hintCostPenalty: number;
  onHintApplied: (cost: number, item: AIHelperItem) => void;
  isMatchActive: boolean;
  compact?: boolean;
}

export function AIHelper({
  problem,
  code,
  language,
  roomId,
  hintsUsed,
  hintCostPenalty,
  onHintApplied,
  isMatchActive,
  compact = false,
}: AIHelperProps) {
  const [isEnabled, setIsEnabled] = useState(true);
  const [isExpanded, setIsExpanded] = useState(true);
  const [activeTab, setActiveTab] = useState<'hint' | 'strategy' | 'ask' | 'history'>('hint');
  const [isLoading, setIsLoading] = useState(false);
  const [customQuestion, setCustomQuestion] = useState('');
  const [history, setHistory] = useState<AIHelperItem[]>([]);
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);
  const [confirmPending, setConfirmPending] = useState<{
    type: 'hint' | 'strategy' | 'custom';
    cost: number;
    question?: string;
  } | null>(null);

  const handleRequestHelp = (type: 'hint' | 'strategy' | 'custom', cost: number, question?: string) => {
    if (!problem) return;
    soundManager.playClick();
    setConfirmPending({ type, cost, question });
  };

  const executeRequest = async () => {
    if (!confirmPending || !problem) return;
    const { type, cost, question } = confirmPending;
    setConfirmPending(null);
    setIsLoading(true);

    try {
      const res = await fetch(apiUrl('/api/ai-helper'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          problem,
          code,
          language,
          type,
          customQuestion: question,
        }),
      });

      const data = await res.json();
      if (data.success && data.content) {
        soundManager.playNotification();
        const newItem: AIHelperItem = {
          id: `ai-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
          type,
          content: data.content,
          cost: data.cost ?? cost,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
        };

        setHistory(prev => [newItem, ...prev]);
        onHintApplied(newItem.cost, newItem);
        setActiveTab('history');
      } else {
        throw new Error(data.error || 'Failed to generate guidance');
      }
    } catch (err: any) {
      console.warn('AI Helper API call error, falling back:', err);
      // Fallback in-client response
      const fallbackCost = cost;
      const fallbackItem: AIHelperItem = {
        id: `ai-fb-${Date.now()}`,
        type,
        content: type === 'hint'
          ? `💡 **Recurrence Invariant**: Focus on avoiding redundant subproblem calculations. Store results in a hash table or use two pointers to contract the search space in linear time.`
          : `### 🧭 Algorithm Strategy Blueprint: ${problem.title}\n\n1. **Core Intuition:** Analyze constraints (N ≤ 10⁵ suggests O(N) or O(N log N)).\n2. **Roadmap:** Traverse elements while maintaining an invariant data structure.\n3. **Edge Cases:** Handle empty or single-element inputs gracefully.`,
        cost: fallbackCost,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
      };
      setHistory(prev => [fallbackItem, ...prev]);
      onHintApplied(fallbackCost, fallbackItem);
      setActiveTab('history');
    } finally {
      setIsLoading(false);
      setCustomQuestion('');
    }
  };

  const copyToClipboard = (text: string, index: number) => {
    navigator.clipboard.writeText(text);
    setCopiedIndex(index);
    setTimeout(() => setCopiedIndex(null), 2000);
  };

  return (
    <div className="border border-[#00FF00]/40 bg-[#070c07]/90 text-zinc-200 font-mono text-xs overflow-hidden shadow-[0_0_15px_rgba(0,255,0,0.1)]">
      {/* Header bar with Master Toggle Switch */}
      <div className="p-3 bg-[#0a120a] border-b border-[#00FF00]/30 flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 bg-[#00FF00]/20 border border-[#00FF00] flex items-center justify-center text-[#00FF00] shrink-0">
            <Bot className="w-3.5 h-3.5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-black text-white uppercase tracking-wider text-[11px]">
                GEMINI AI HELPER
              </span>
              <span className="text-[9px] bg-[#00FF00]/20 text-[#00FF00] px-1.5 py-0.2 border border-[#00FF00]/40 font-bold uppercase">
                v3.8
              </span>
            </div>
            <p className="text-[9px] text-zinc-400">
              DSA Mentorship with Score Penalty
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {/* Toggle Switch */}
          <div className="flex items-center gap-2 bg-black/60 px-2 py-1 border border-white/10">
            <span className="text-[9px] font-bold uppercase text-zinc-400">
              {isEnabled ? 'ACTIVE' : 'OFF'}
            </span>
            <button
              type="button"
              onClick={() => {
                soundManager.playClick();
                setIsEnabled(!isEnabled);
              }}
              className={`w-9 h-4.5 flex items-center rounded-full p-0.5 transition-colors cursor-pointer ${
                isEnabled ? 'bg-[#00FF00]' : 'bg-zinc-800'
              }`}
              title="Toggle AI Helper"
            >
              <div
                className={`w-3.5 h-3.5 rounded-full bg-black shadow-md transform transition-transform ${
                  isEnabled ? 'translate-x-4.5' : 'translate-x-0'
                }`}
              />
            </button>
          </div>

          <button
            type="button"
            onClick={() => setIsExpanded(!isExpanded)}
            className="text-zinc-400 hover:text-white p-0.5 cursor-pointer"
          >
            {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {/* When disabled */}
      {!isEnabled && (
        <div className="p-3 bg-black/50 text-zinc-500 text-[10px] italic flex items-center justify-between">
          <span>AI Helper is currently deactivated. Toggle ON to consult hints or algorithm strategies.</span>
          <span className="text-[#00FF00] font-bold uppercase">NO PENALTY APPLIED</span>
        </div>
      )}

      {/* Expanded body */}
      {isEnabled && isExpanded && (
        <div className="p-3 space-y-3">
          {/* Penalty Meter Banner */}
          <div className="p-2.5 bg-black border border-amber-500/40 text-amber-300 text-[10px] flex items-center justify-between gap-3 shadow-[0_0_10px_rgba(245,158,11,0.08)]">
            <div className="flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0" />
              <div>
                <span className="font-black uppercase tracking-wider">HINT PENALTY ACTIVE:</span>{' '}
                <span>Using AI assistance deducts points from your final match score.</span>
              </div>
            </div>
            <div className="text-right shrink-0">
              <div className="font-black text-xs text-amber-400">
                -{hintCostPenalty} PTS
              </div>
              <div className="text-[9px] text-zinc-400 uppercase">
                {hintsUsed} {hintsUsed === 1 ? 'CONSULTATION' : 'CONSULTATIONS'}
              </div>
            </div>
          </div>

          {/* Tab Selector */}
          <div className="grid grid-cols-4 gap-1 border-b border-white/10 pb-2">
            <button
              type="button"
              onClick={() => setActiveTab('hint')}
              className={`py-1.5 px-2 text-[10px] font-black uppercase flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                activeTab === 'hint'
                  ? 'bg-[#00FF00]/20 border border-[#00FF00] text-[#00FF00]'
                  : 'bg-black/60 border border-white/10 text-zinc-400 hover:text-white'
              }`}
            >
              <Lightbulb className="w-3 h-3" />
              <span>HINT (-50)</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('strategy')}
              className={`py-1.5 px-2 text-[10px] font-black uppercase flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                activeTab === 'strategy'
                  ? 'bg-[#00FF00]/20 border border-[#00FF00] text-[#00FF00]'
                  : 'bg-black/60 border border-white/10 text-zinc-400 hover:text-white'
              }`}
            >
              <Compass className="w-3 h-3" />
              <span>STRATEGY (-100)</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('ask')}
              className={`py-1.5 px-2 text-[10px] font-black uppercase flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                activeTab === 'ask'
                  ? 'bg-[#00FF00]/20 border border-[#00FF00] text-[#00FF00]'
                  : 'bg-black/60 border border-white/10 text-zinc-400 hover:text-white'
              }`}
            >
              <HelpCircle className="w-3 h-3" />
              <span>ASK (-50)</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('history')}
              className={`py-1.5 px-2 text-[10px] font-black uppercase flex items-center justify-center gap-1.5 transition-all cursor-pointer relative ${
                activeTab === 'history'
                  ? 'bg-[#00FF00]/20 border border-[#00FF00] text-[#00FF00]'
                  : 'bg-black/60 border border-white/10 text-zinc-400 hover:text-white'
              }`}
            >
              <History className="w-3 h-3" />
              <span>LOG ({history.length})</span>
            </button>
          </div>

          {/* Confirmation Overlay before deducting score */}
          {confirmPending && (
            <div className="p-3 bg-zinc-950 border border-amber-500 text-amber-200 text-xs space-y-2.5 animate-fadeIn">
              <div className="flex items-center gap-2 font-bold text-amber-400 uppercase">
                <AlertTriangle className="w-4 h-4 text-amber-400" />
                <span>CONFIRM HINT PENALTY</span>
              </div>
              <p className="text-[11px] text-zinc-300 leading-relaxed">
                Requesting a <span className="font-bold text-white uppercase">{confirmPending.type}</span> will immediately apply a{' '}
                <span className="font-bold text-amber-400">-{confirmPending.cost} POINTS</span> penalty to your match score.
              </p>
              <div className="flex items-center justify-end gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => setConfirmPending(null)}
                  className="px-3 py-1 bg-black border border-white/20 text-zinc-400 hover:text-white text-[10px] uppercase font-bold cursor-pointer"
                >
                  CANCEL
                </button>
                <button
                  type="button"
                  onClick={executeRequest}
                  className="px-3 py-1 bg-amber-500 hover:bg-amber-400 text-black text-[10px] uppercase font-black cursor-pointer shadow-[0_0_10px_rgba(245,158,11,0.3)]"
                >
                  ACCEPT -{confirmPending.cost} PTS & REVEAL
                </button>
              </div>
            </div>
          )}

          {/* TAB 1: Algorithmic Hint */}
          {activeTab === 'hint' && !confirmPending && (
            <div className="space-y-2.5">
              <div className="text-[11px] text-zinc-300 leading-relaxed">
                Receive a targeted algorithmic invariant, data structure recommendation, or mathematical recurrence insight without spoiling the full solution code.
              </div>
              <div className="flex items-center justify-between pt-1">
                <span className="text-[10px] text-amber-400 font-bold">
                  Cost: 50 Match Points
                </span>
                <button
                  type="button"
                  onClick={() => handleRequestHelp('hint', 50)}
                  disabled={isLoading || !isMatchActive}
                  className="px-4 py-2 bg-[#00FF00] hover:bg-[#00DD00] text-black font-black uppercase tracking-wider text-[10px] flex items-center gap-1.5 shadow-[0_0_12px_rgba(0,255,0,0.3)] transition-all cursor-pointer disabled:opacity-50"
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      <span>ANALYZING MATRIX...</span>
                    </>
                  ) : (
                    <>
                      <Lightbulb className="w-3.5 h-3.5" />
                      <span>REQUEST HINT (-50 PTS)</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          )}

          {/* TAB 2: Algorithm Strategy Blueprint */}
          {activeTab === 'strategy' && !confirmPending && (
            <div className="space-y-2.5">
              <div className="text-[11px] text-zinc-300 leading-relaxed">
                Generate a comprehensive Algorithm Strategy Roadmap: Core algorithmic intuition, target Big-O time and space complexity, tactical step-by-step implementation guide, and critical boundary edge cases.
              </div>
              <div className="flex items-center justify-between pt-1">
                <span className="text-[10px] text-amber-400 font-bold">
                  Cost: 100 Match Points
                </span>
                <button
                  type="button"
                  onClick={() => handleRequestHelp('strategy', 100)}
                  disabled={isLoading || !isMatchActive}
                  className="px-4 py-2 bg-[#00FF00] hover:bg-[#00DD00] text-black font-black uppercase tracking-wider text-[10px] flex items-center gap-1.5 shadow-[0_0_12px_rgba(0,255,0,0.3)] transition-all cursor-pointer disabled:opacity-50"
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      <span>SYNTHESIZING BLUEPRINT...</span>
                    </>
                  ) : (
                    <>
                      <Compass className="w-3.5 h-3.5" />
                      <span>GET STRATEGY BLUEPRINT (-100 PTS)</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          )}

          {/* TAB 3: Ask Custom Question */}
          {activeTab === 'ask' && !confirmPending && (
            <div className="space-y-2.5">
              <div className="text-[11px] text-zinc-300">
                Ask Gemini DSA Mentor a specific question regarding your approach, edge cases, or potential time-limit bottleneck.
              </div>
              <div className="relative">
                <textarea
                  value={customQuestion}
                  onChange={e => setCustomQuestion(e.target.value)}
                  placeholder="e.g. How can I optimize this from O(N²) to O(N)? Or how should I handle empty strings?"
                  rows={3}
                  className="w-full bg-black border border-white/20 p-2 text-xs text-white placeholder:text-zinc-600 outline-none focus:border-[#00FF00] resize-none"
                />
              </div>
              <div className="flex items-center justify-between">
                <span className="text-[10px] text-amber-400 font-bold">
                  Cost: 50 Match Points
                </span>
                <button
                  type="button"
                  disabled={!customQuestion.trim() || isLoading || !isMatchActive}
                  onClick={() => handleRequestHelp('custom', 50, customQuestion.trim())}
                  className="px-4 py-1.5 bg-[#00FF00] hover:bg-[#00DD00] text-black font-black uppercase tracking-wider text-[10px] flex items-center gap-1.5 shadow-[0_0_12px_rgba(0,255,0,0.3)] transition-all cursor-pointer disabled:opacity-50"
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      <span>TRANSMITTING...</span>
                    </>
                  ) : (
                    <>
                      <Send className="w-3.5 h-3.5" />
                      <span>SUBMIT QUERY (-50 PTS)</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          )}

          {/* TAB 4: History / Active Guidance Log */}
          {activeTab === 'history' && (
            <div className="space-y-3 max-h-72 overflow-y-auto custom-scrollbar pr-1">
              {history.length === 0 ? (
                <div className="py-6 text-center text-zinc-600 text-[11px] italic">
                  No hints or strategy blueprints consulted yet this match.
                </div>
              ) : (
                history.map((item, idx) => (
                  <div
                    key={item.id || idx}
                    className="p-3 bg-black/90 border border-[#00FF00]/40 space-y-2 shadow-[0_0_12px_rgba(0,255,0,0.06)]"
                  >
                    <div className="flex items-center justify-between pb-1.5 border-b border-white/10 text-[10px]">
                      <div className="flex items-center gap-1.5">
                        <span className="px-1.5 py-0.5 bg-[#00FF00]/20 text-[#00FF00] font-black uppercase">
                          {item.type === 'strategy' ? 'STRATEGY BLUEPRINT' : item.type === 'custom' ? 'MENTOR ADVICE' : 'ALGORITHMIC HINT'}
                        </span>
                        <span className="text-zinc-500 font-bold">[{item.timestamp}]</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-amber-400 font-bold">-{item.cost} PTS</span>
                        <button
                          type="button"
                          onClick={() => copyToClipboard(item.content, idx)}
                          className="text-zinc-400 hover:text-white p-0.5 cursor-pointer"
                          title="Copy Guidance"
                        >
                          {copiedIndex === idx ? (
                            <Check className="w-3.5 h-3.5 text-[#00FF00]" />
                          ) : (
                            <Copy className="w-3.5 h-3.5" />
                          )}
                        </button>
                      </div>
                    </div>

                    <div className="text-[11.5px] text-zinc-200 leading-relaxed prose prose-invert prose-p:my-1 prose-pre:bg-zinc-950 prose-pre:p-2 max-w-none">
                      <ReactMarkdown>{item.content}</ReactMarkdown>
                    </div>
                  </div>
                ))
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
