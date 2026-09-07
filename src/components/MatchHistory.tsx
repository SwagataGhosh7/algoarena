import { useState, useMemo } from 'react';
import { 
  Trophy, 
  Swords, 
  Clock, 
  Code2, 
  Filter, 
  CheckCircle2, 
  XCircle, 
  ArrowUpRight, 
  ArrowDownRight,
  Search,
  Calendar,
  Layers,
  Sparkles,
  Play,
  Copy,
  Check,
  Bot,
  User as UserIcon,
  ChevronDown,
  ArrowUpDown,
  FileCode,
  ShieldAlert,
  LayoutGrid,
  List,
  Flame,
  Terminal,
  GitCompare
} from 'lucide-react';
import { MatchRecord } from '../types';
import { formatRelativeTime, formatFullTimestamp } from '../lib/matchHistoryStorage';
import { SolutionDiffViewer } from './SolutionDiffViewer';

interface MatchHistoryProps {
  matches?: MatchRecord[];
  username?: string;
  onSelectPlayback?: (match: MatchRecord) => void;
  onSelectReview?: (match: MatchRecord) => void;
  onSelectDiff?: (match: MatchRecord) => void;
}

type OutcomeFilter = 'ALL' | 'VICTORY' | 'DEFEAT';
type DifficultyFilter = 'ALL' | 'Easy' | 'Medium' | 'Hard';
type SortOption = 'NEWEST' | 'OLDEST' | 'HIGHEST_ELO' | 'LOWEST_ELO' | 'DURATION';
type ViewMode = 'CARDS' | 'TABLE' | 'BOTH';

function getLanguageBadge(language?: string) {
  const lang = (language || 'TypeScript').toLowerCase();
  if (lang.includes('type') || lang.includes('ts')) {
    return { name: language || 'TypeScript', bg: 'bg-blue-500/15 text-blue-400 border-blue-500/40' };
  }
  if (lang.includes('python') || lang.includes('py')) {
    return { name: language || 'Python', bg: 'bg-sky-500/15 text-sky-400 border-sky-500/40' };
  }
  if (lang.includes('c++') || lang.includes('cpp')) {
    return { name: language || 'C++', bg: 'bg-indigo-500/15 text-indigo-400 border-indigo-500/40' };
  }
  if (lang.includes('java')) {
    return { name: language || 'Java', bg: 'bg-orange-500/15 text-orange-400 border-orange-500/40' };
  }
  if (lang.includes('go')) {
    return { name: language || 'Go', bg: 'bg-cyan-500/15 text-cyan-400 border-cyan-500/40' };
  }
  if (lang.includes('rust')) {
    return { name: language || 'Rust', bg: 'bg-rose-500/15 text-rose-400 border-rose-500/40' };
  }
  return { name: language || 'TypeScript', bg: 'bg-zinc-800 text-zinc-300 border-white/20' };
}

export function MatchHistory({ matches = [], username, onSelectPlayback, onSelectReview, onSelectDiff }: MatchHistoryProps) {
  const [outcomeFilter, setOutcomeFilter] = useState<OutcomeFilter>('ALL');
  const [difficultyFilter, setDifficultyFilter] = useState<DifficultyFilter>('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState<SortOption>('NEWEST');
  const [viewMode, setViewMode] = useState<ViewMode>('BOTH');
  const [selectedMatch, setSelectedMatch] = useState<MatchRecord | null>(null);
  const [diffMatch, setDiffMatch] = useState<MatchRecord | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Parse helper for durations like "12m 30s", "03:45", "Forfeited"
  const getDurationSecs = (dur: string): number => {
    if (!dur || dur === 'Forfeited' || dur === 'Disconnected') return 999999;
    const m = dur.match(/(\d+)m/)?.[1];
    const s = dur.match(/(\d+)s/)?.[1];
    if (m || s) {
      return (Number(m || 0) * 60) + Number(s || 0);
    }
    const parts = dur.split(':');
    if (parts.length === 2) {
      return (Number(parts[0]) * 60) + Number(parts[1]);
    }
    return 0;
  };

  // Filtered and sorted dataset
  const processedMatches = useMemo(() => {
    let result = matches.filter(m => {
      if (outcomeFilter === 'VICTORY' && m.outcome !== 'Victory') return false;
      if (outcomeFilter === 'DEFEAT' && m.outcome !== 'Defeat') return false;
      if (difficultyFilter !== 'ALL' && m.difficulty?.toLowerCase() !== difficultyFilter.toLowerCase()) return false;
      
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        return (
          m.opponent.toLowerCase().includes(q) ||
          m.problem.toLowerCase().includes(q) ||
          m.language.toLowerCase().includes(q) ||
          m.id.toLowerCase().includes(q) ||
          (m.difficulty && m.difficulty.toLowerCase().includes(q))
        );
      }
      return true;
    });

    result.sort((a, b) => {
      if (sortBy === 'NEWEST' || sortBy === 'OLDEST') {
        const timeA = new Date(a.completedAt || `${a.date} ${a.timestamp}`).getTime() || 0;
        const timeB = new Date(b.completedAt || `${b.date} ${b.timestamp}`).getTime() || 0;
        return sortBy === 'NEWEST' ? timeB - timeA : timeA - timeB;
      }
      if (sortBy === 'HIGHEST_ELO') return b.eloChange - a.eloChange;
      if (sortBy === 'LOWEST_ELO') return a.eloChange - b.eloChange;
      if (sortBy === 'DURATION') return getDurationSecs(a.duration) - getDurationSecs(b.duration);
      return 0;
    });

    return result;
  }, [matches, outcomeFilter, difficultyFilter, searchQuery, sortBy]);

  // Summary Metrics
  const totalMatches = matches.length;
  const victories = matches.filter(m => m.outcome === 'Victory').length;
  const defeats = totalMatches - victories;
  const winRate = totalMatches === 0 ? 0 : Math.round((victories / totalMatches) * 100);
  const netElo = matches.reduce((acc, curr) => acc + curr.eloChange, 0);

  const easyCount = matches.filter(m => m.difficulty === 'Easy').length;
  const medCount = matches.filter(m => m.difficulty === 'Medium').length;
  const hardCount = matches.filter(m => m.difficulty === 'Hard').length;

  const handleCopySummary = (match: MatchRecord) => {
    const text = `[AlgoArena 1v1 Duel] Session ${match.id} vs ${match.opponent} | Result: ${match.outcome.toUpperCase()} (${match.eloChange > 0 ? '+' : ''}${match.eloChange} ELO) | Problem: ${match.problem} [${match.difficulty}] | Language: ${match.language} | Tests: ${match.testScore} | Timestamp: ${match.completedAt || `${match.date} ${match.timestamp}`}`;
    navigator.clipboard.writeText(text);
    setCopiedId(match.id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const getDifficultyBadge = (difficulty?: string) => {
    const diff = (difficulty || 'Medium').toLowerCase();
    if (diff === 'easy') {
      return (
        <span className="inline-flex items-center px-2 py-0.5 text-[9px] font-black tracking-wider uppercase bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
          EASY
        </span>
      );
    }
    if (diff === 'hard') {
      return (
        <span className="inline-flex items-center px-2 py-0.5 text-[9px] font-black tracking-wider uppercase bg-rose-500/10 text-rose-400 border border-rose-500/30">
          HARD
        </span>
      );
    }
    return (
      <span className="inline-flex items-center px-2 py-0.5 text-[9px] font-black tracking-wider uppercase bg-amber-500/10 text-amber-400 border border-amber-500/30">
        MEDIUM
      </span>
    );
  };

  return (
    <div className="bg-[#080808] border border-white/10 p-5 sm:p-6 flex flex-col font-mono text-xs w-full">
      {/* Component Header & Live Telemetry Badge */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b border-white/10 pb-5 mb-5">
        <div>
          <div className="flex flex-wrap items-center gap-2 mb-1.5">
            <Swords className="w-4 h-4 text-[#00FF00]" />
            <h2 className="text-xs sm:text-sm font-black text-white uppercase tracking-widest">
              1V1 DUEL MATCH HISTORY // COMBAT LOGS
            </h2>
            <span className="bg-[#00FF00]/10 text-[#00FF00] text-[9px] px-2 py-0.5 border border-[#00FF00]/30 font-black flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-[#00FF00] animate-pulse" />
              RECORDED LIVE
            </span>
          </div>
          <p className="text-[10px] text-zinc-500 uppercase tracking-wide">
            CHRONOLOGICAL RECORD OF COMPLETED 1V1 DUELS &middot; {totalMatches} BATTLES ENGAGED
          </p>
        </div>

        {/* Global Statistics Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
          {/* Win Rate */}
          <div className="bg-black border border-white/10 px-3 py-2 flex flex-col">
            <span className="text-[9px] text-zinc-500 uppercase font-bold">WIN RATE</span>
            <div className="flex items-center gap-2 mt-0.5">
              <span className="text-sm text-[#00FF00] font-black">{winRate}%</span>
              <span className="text-[9px] text-zinc-400">({victories}W - {defeats}L)</span>
            </div>
          </div>

          {/* Net ELO Delta */}
          <div className="bg-black border border-white/10 px-3 py-2 flex flex-col">
            <span className="text-[9px] text-zinc-500 uppercase font-bold">NET ELO</span>
            <div className="flex items-center gap-1 mt-0.5">
              <span className={`text-sm font-black ${netElo >= 0 ? 'text-[#00FF00]' : 'text-rose-400'}`}>
                {netElo > 0 ? `+${netElo}` : netElo}
              </span>
              <span className="text-[9px] text-zinc-500 uppercase">PTS</span>
            </div>
          </div>

          {/* Difficulty Clears */}
          <div className="bg-black border border-white/10 px-3 py-2 flex flex-col">
            <span className="text-[9px] text-zinc-500 uppercase font-bold">DIFFICULTY POOL</span>
            <div className="flex items-center gap-1.5 mt-0.5 text-[10px] font-bold">
              <span className="text-emerald-400">{easyCount}E</span>
              <span className="text-zinc-600">/</span>
              <span className="text-amber-400">{medCount}M</span>
              <span className="text-zinc-600">/</span>
              <span className="text-rose-400">{hardCount}H</span>
            </div>
          </div>

          {/* Total Engagements */}
          <div className="bg-black border border-white/10 px-3 py-2 flex flex-col">
            <span className="text-[9px] text-zinc-500 uppercase font-bold">COMPLETED</span>
            <div className="flex items-center gap-1 mt-0.5">
              <span className="text-sm font-black text-white">{totalMatches}</span>
              <span className="text-[9px] text-zinc-500 uppercase">SESSIONS</span>
            </div>
          </div>
        </div>
      </div>

      {/* Filter, Difficulty, Search & Sort Bar */}
      <div className="flex flex-col gap-3 mb-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          {/* Outcome Filter Buttons */}
          <div className="flex items-center gap-1">
            <span className="text-[10px] text-zinc-500 uppercase font-bold mr-1 flex items-center gap-1">
              <Filter className="w-3 h-3 text-[#00FF00]" /> OUTCOME:
            </span>
            {(['ALL', 'VICTORY', 'DEFEAT'] as const).map(tab => {
              const count = tab === 'ALL' ? totalMatches : tab === 'VICTORY' ? victories : defeats;
              return (
                <button
                  key={tab}
                  onClick={() => setOutcomeFilter(tab)}
                  className={`px-2.5 py-1 text-[10px] font-black uppercase tracking-wider transition-all border ${
                    outcomeFilter === tab
                      ? 'bg-[#00FF00]/15 text-[#00FF00] border-[#00FF00] shadow-[0_0_8px_rgba(0,255,0,0.25)]'
                      : 'bg-black text-zinc-400 border-white/10 hover:border-white/25 hover:text-white'
                  }`}
                >
                  {tab} ({count})
                </button>
              );
            })}
          </div>

          {/* Difficulty Filter Buttons & View Mode */}
          <div className="flex flex-wrap items-center gap-2">
            <div className="flex items-center gap-1">
              <span className="text-[10px] text-zinc-500 uppercase font-bold mr-1 flex items-center gap-1">
                <Layers className="w-3 h-3 text-amber-400" /> DIFFICULTY:
              </span>
              {(['ALL', 'Easy', 'Medium', 'Hard'] as const).map(diff => (
                <button
                  key={diff}
                  onClick={() => setDifficultyFilter(diff)}
                  className={`px-2 py-1 text-[10px] font-black uppercase tracking-wider transition-all border ${
                    difficultyFilter === diff
                      ? diff === 'Easy'
                        ? 'bg-emerald-500/20 text-emerald-400 border-emerald-400 shadow-[0_0_8px_rgba(16,185,129,0.25)]'
                        : diff === 'Hard'
                        ? 'bg-rose-500/20 text-rose-400 border-rose-400 shadow-[0_0_8px_rgba(244,63,94,0.25)]'
                        : 'bg-amber-500/20 text-amber-400 border-amber-400 shadow-[0_0_8px_rgba(245,158,11,0.25)]'
                      : 'bg-black text-zinc-400 border-white/10 hover:border-white/25 hover:text-white'
                  }`}
                >
                  {diff === 'ALL' ? 'ANY' : diff}
                </button>
              ))}
            </div>

            {/* View Mode Switcher */}
            <div className="flex items-center bg-black border border-white/10 p-0.5">
              <button
                onClick={() => setViewMode('BOTH')}
                title="Show Featured Cards and Table"
                className={`px-2 py-1 text-[10px] font-bold uppercase transition-all flex items-center gap-1 ${
                  viewMode === 'BOTH' ? 'bg-white/20 text-white' : 'text-zinc-500 hover:text-zinc-300'
                }`}
              >
                <Layers className="w-3 h-3 text-[#00FF00]" />
                <span className="hidden sm:inline">OVERVIEW</span>
              </button>
              <button
                onClick={() => setViewMode('CARDS')}
                title="Show Recent Duel Cards"
                className={`px-2 py-1 text-[10px] font-bold uppercase transition-all flex items-center gap-1 ${
                  viewMode === 'CARDS' ? 'bg-white/20 text-white' : 'text-zinc-500 hover:text-zinc-300'
                }`}
              >
                <LayoutGrid className="w-3 h-3 text-cyan-400" />
                <span className="hidden sm:inline">CARDS</span>
              </button>
              <button
                onClick={() => setViewMode('TABLE')}
                title="Show Detailed Table"
                className={`px-2 py-1 text-[10px] font-bold uppercase transition-all flex items-center gap-1 ${
                  viewMode === 'TABLE' ? 'bg-white/20 text-white' : 'text-zinc-500 hover:text-zinc-300'
                }`}
              >
                <List className="w-3 h-3 text-amber-400" />
                <span className="hidden sm:inline">TABLE</span>
              </button>
            </div>
          </div>
        </div>

        {/* Second Row: Search, Sort and Benchmark loader */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-2 border-t border-white/5">
          {/* Search Input */}
          <div className="relative flex-1 max-w-md">
            <Search className="w-3.5 h-3.5 text-zinc-500 absolute left-2.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              placeholder="SEARCH OPPONENT, PROBLEM, COMPILER..."
              className="w-full bg-black border border-white/10 pl-8 pr-3 py-1.5 text-[10px] text-zinc-200 placeholder:text-zinc-600 focus:outline-none focus:border-[#00FF00]/50 transition-colors uppercase font-mono font-bold"
            />
          </div>

          {/* Sort Selector */}
          <div className="flex items-center gap-2">
            <span className="text-[10px] text-zinc-500 uppercase font-bold flex items-center gap-1">
              <ArrowUpDown className="w-3 h-3 text-zinc-400" /> SORT:
            </span>
            <select
              value={sortBy}
              onChange={e => setSortBy(e.target.value as SortOption)}
              className="bg-black border border-white/15 text-zinc-300 px-2.5 py-1 text-[10px] uppercase font-mono font-bold focus:outline-none focus:border-[#00FF00]/50"
            >
              <option value="NEWEST">TIMESTAMP: NEWEST FIRST</option>
              <option value="OLDEST">TIMESTAMP: OLDEST FIRST</option>
              <option value="HIGHEST_ELO">RATING: HIGHEST GAIN</option>
              <option value="LOWEST_ELO">RATING: BIGGEST DROP</option>
              <option value="DURATION">DURATION: FASTEST</option>
            </select>
          </div>
        </div>
      </div>

      {/* Featured Recent Duel Cards Showcase */}
      {(viewMode === 'BOTH' || viewMode === 'CARDS') && processedMatches.length > 0 && (
        <div className="mb-5">
          <div className="flex items-center justify-between mb-2.5">
            <div className="flex items-center gap-2 text-[10px] font-black text-zinc-400 uppercase tracking-wider">
              <Flame className="w-3.5 h-3.5 text-[#00FF00]" />
              <span>RECENT DUEL RESULTS SHOWCASE</span>
            </div>
            <span className="text-[9px] text-zinc-500 uppercase">
              CLICK ANY DUEL CARD TO INSPECT SESSION TELEMETRY
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-3">
            {processedMatches.slice(0, 4).map((match) => {
              const isVic = match.outcome === 'Victory';
              const isSelected = selectedMatch?.id === match.id;
              const isBot = match.opponent.toLowerCase().includes('bot') || match.opponent.toLowerCase().includes('algoarena');
              const langInfo = getLanguageBadge(match.language);
              const relativeTime = formatRelativeTime(match.completedAt || `${match.date} ${match.timestamp}`);

              return (
                <div
                  key={`card-${match.id}`}
                  onClick={() => setSelectedMatch(isSelected ? null : match)}
                  className={`bg-black border p-3 flex flex-col justify-between transition-all cursor-pointer relative group ${
                    isSelected
                      ? 'border-[#00FF00] shadow-[0_0_12px_rgba(0,255,0,0.25)]'
                      : isVic
                      ? 'border-white/10 hover:border-[#00FF00]/60 hover:bg-[#00FF00]/[0.02]'
                      : 'border-white/10 hover:border-rose-500/60 hover:bg-rose-500/[0.02]'
                  }`}
                >
                  {/* Top Bar: Outcome & ELO */}
                  <div className="flex items-center justify-between border-b border-white/5 pb-2 mb-2">
                    <div className="flex items-center gap-1.5">
                      {isVic ? (
                        <span className="flex items-center gap-1 px-2 py-0.5 bg-[#00FF00]/15 text-[#00FF00] border border-[#00FF00]/40 font-black text-[10px] tracking-wider uppercase">
                          <CheckCircle2 className="w-3 h-3 text-[#00FF00]" /> VICTORY
                        </span>
                      ) : (
                        <span className="flex items-center gap-1 px-2 py-0.5 bg-rose-500/15 text-rose-400 border border-rose-500/40 font-black text-[10px] tracking-wider uppercase">
                          <XCircle className="w-3 h-3 text-rose-400" /> DEFEAT
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-1">
                      {isVic ? (
                        <span className="flex items-center font-black text-[#00FF00] text-xs">
                          <ArrowUpRight className="w-3.5 h-3.5" /> +{match.eloChange}
                        </span>
                      ) : (
                        <span className="flex items-center font-black text-rose-400 text-xs">
                          <ArrowDownRight className="w-3.5 h-3.5" /> {match.eloChange}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Opponent & Language Row */}
                  <div className="flex items-center justify-between gap-2 mb-2">
                    <div className="flex items-center gap-1.5 min-w-0">
                      <div className="w-5 h-5 bg-zinc-900 border border-white/10 flex items-center justify-center shrink-0">
                        {isBot ? <Bot className="w-3 h-3 text-cyan-400" /> : <UserIcon className="w-3 h-3 text-zinc-400" />}
                      </div>
                      <div className="truncate">
                        <span className="font-bold text-white text-[11px] uppercase truncate block">
                          {match.opponent}
                        </span>
                        <span className="text-[8px] text-zinc-500 uppercase block">
                          {match.opponentRank || '1450 ELO'}
                        </span>
                      </div>
                    </div>

                    {/* Language Pill */}
                    <span className={`px-2 py-0.5 text-[9px] font-black uppercase border shrink-0 ${langInfo.bg}`}>
                      {langInfo.name}
                    </span>
                  </div>

                  {/* Problem & Difficulty */}
                  <div className="my-1">
                    <span className="text-[11px] font-bold text-zinc-200 line-clamp-1 group-hover:text-white transition-colors">
                      {match.problem}
                    </span>
                    <div className="flex items-center gap-2 mt-1">
                      {getDifficultyBadge(match.difficulty)}
                      <span className="text-[9px] text-zinc-500 font-bold flex items-center gap-1">
                        <Clock className="w-3 h-3 text-zinc-500" /> {match.duration}
                      </span>
                    </div>
                  </div>

                  {/* Footer Stats & Date */}
                  <div className="flex items-center justify-between pt-2 mt-2 border-t border-white/5 text-[9px] text-zinc-500 font-mono">
                    <span className="flex items-center gap-1">
                      <Calendar className="w-2.5 h-2.5 text-zinc-500" />
                      {relativeTime}
                    </span>
                    <span className={isVic ? 'text-[#00FF00] font-bold' : 'text-zinc-400 font-bold'}>
                      {match.testScore} Pass
                    </span>
                  </div>

                  {/* Card Quick Action Bar */}
                  <div className="flex items-center justify-between pt-2 mt-1.5 border-t border-white/5" onClick={(e) => e.stopPropagation()}>
                    <button
                      type="button"
                      onClick={() => {
                        if (onSelectDiff) onSelectDiff(match);
                        setDiffMatch(match);
                      }}
                      className="px-2 py-1 bg-blue-600/20 hover:bg-blue-600/30 text-blue-300 hover:text-white border border-blue-500/40 hover:border-blue-400 text-[9px] font-mono font-bold uppercase flex items-center gap-1 transition-all cursor-pointer shadow-[0_0_8px_rgba(59,130,246,0.15)]"
                      title="View side-by-side solution diff"
                    >
                      <GitCompare className="w-2.5 h-2.5 text-blue-400" />
                      <span>VIEW DIFF</span>
                    </button>
                    {onSelectPlayback && (
                      <button
                        type="button"
                        onClick={() => onSelectPlayback(match)}
                        className="px-2 py-1 bg-black hover:bg-zinc-800 text-zinc-400 hover:text-white border border-white/10 text-[9px] font-mono font-bold uppercase flex items-center gap-1 transition-colors cursor-pointer"
                        title="Replay typed keystrokes"
                      >
                        <Code2 className="w-2.5 h-2.5 text-[#00FF00]" />
                        <span>REPLAY</span>
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Cyberpunk Match Data Table */}
      {(viewMode === 'BOTH' || viewMode === 'TABLE') && (
        <div className="overflow-x-auto border border-white/10 bg-black/60 custom-scrollbar">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-white/15 bg-black text-[10px] uppercase font-black text-zinc-400 tracking-wider">
                <th className="py-2.5 px-3">OUTCOME</th>
                <th className="py-2.5 px-3">OPPONENT (1V1)</th>
                <th className="py-2.5 px-3">PROBLEM CHALLENGE</th>
                <th className="py-2.5 px-3">DIFFICULTY</th>
                <th className="py-2.5 px-3">TIMESTAMP</th>
                <th className="py-2.5 px-3">DURATION</th>
                <th className="py-2.5 px-3">LANGUAGE USED</th>
                <th className="py-2.5 px-3">TESTS</th>
                <th className="py-2.5 px-3 text-right">RATING DELTA</th>
                <th className="py-2.5 px-3 text-right">ACTION</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5 font-mono">
              {processedMatches.length === 0 ? (
                <tr>
                  <td colSpan={10} className="py-12 text-center text-zinc-500 uppercase tracking-widest text-[11px]">
                    <div className="flex flex-col items-center justify-center gap-3">
                      <Swords className="w-8 h-8 text-zinc-700 animate-pulse" />
                      <div>
                        {totalMatches === 0 ? (
                          <>
                            <p className="font-bold text-zinc-300">NO 1V1 DUEL SESSIONS RECORDED YET</p>
                            <p className="text-[10px] text-zinc-600 mt-1 mb-3">
                              ENTER THE ARENA TO COMMENCE YOUR FIRST MATCH AND RECORD AUTHENTIC DUEL TELEMETRY
                            </p>
                            <div className="flex items-center justify-center gap-2">
                              <a
                                href="/"
                                className="px-3 py-1.5 bg-black border border-white/20 text-zinc-300 font-mono text-[10px] font-black uppercase hover:border-[#00FF00] hover:text-white transition-all"
                              >
                                ENTER 1V1 ARENA
                              </a>
                            </div>
                          </>
                        ) : (
                          <>
                            <p className="font-bold text-zinc-400">NO MATCHES MATCH CURRENT FILTER / SEARCH CRITERIA</p>
                            <p className="text-[10px] text-zinc-600 mt-1">TRY ADJUSTING OUTCOME OR DIFFICULTY FILTERS</p>
                          </>
                        )}
                      </div>
                    </div>
                  </td>
                </tr>
              ) : (
                processedMatches.map(match => {
                  const isVic = match.outcome === 'Victory';
                  const isSelected = selectedMatch?.id === match.id;
                  const isBot = match.opponent.toLowerCase().includes('bot') || match.opponent.toLowerCase().includes('algoarena');
                  const langInfo = getLanguageBadge(match.language);
                  
                  // Formatted timestamp
                  const relativeTime = formatRelativeTime(match.completedAt || `${match.date} ${match.timestamp}`);
                  const fullDateTime = formatFullTimestamp(match.completedAt || `${match.date} ${match.timestamp}`);

                  return (
                    <tr
                      key={match.id}
                      onClick={() => setSelectedMatch(isSelected ? null : match)}
                      className={`group transition-all cursor-pointer ${
                        isSelected
                          ? 'bg-[#00FF00]/10 border-l-2 border-l-[#00FF00]'
                          : isVic
                          ? 'hover:bg-[#00FF00]/5 hover:border-l-2 hover:border-l-[#00FF00]/60'
                          : 'hover:bg-rose-500/5 hover:border-l-2 hover:border-l-rose-500/60'
                      }`}
                    >
                      {/* Outcome Badge */}
                      <td className="py-3 px-3 whitespace-nowrap">
                        <div className="flex items-center gap-1.5">
                          {isVic ? (
                            <span className="flex items-center gap-1 px-2 py-0.5 bg-[#00FF00]/10 text-[#00FF00] border border-[#00FF00]/30 font-black text-[10px] tracking-wider uppercase shadow-[0_0_6px_rgba(0,255,0,0.15)]">
                              <CheckCircle2 className="w-3 h-3 text-[#00FF00]" /> VICTORY
                            </span>
                          ) : (
                            <span className="flex items-center gap-1 px-2 py-0.5 bg-rose-500/10 text-rose-400 border border-rose-500/30 font-black text-[10px] tracking-wider uppercase">
                              <XCircle className="w-3 h-3 text-rose-400" /> DEFEAT
                            </span>
                          )}
                        </div>
                      </td>

                      {/* Opponent Info */}
                      <td className="py-3 px-3 whitespace-nowrap">
                        <div className="flex items-center gap-2">
                          <div className="w-6 h-6 rounded-none bg-black border border-white/10 flex items-center justify-center shrink-0">
                            {isBot ? (
                              <Bot className="w-3.5 h-3.5 text-cyan-400" />
                            ) : (
                              <UserIcon className="w-3.5 h-3.5 text-zinc-400" />
                            )}
                          </div>
                          <div className="flex flex-col">
                            <span className="font-bold text-white group-hover:text-[#00FF00] transition-colors text-[11px] uppercase tracking-wide">
                              {match.opponent}
                            </span>
                            <span className="text-[9px] text-zinc-500 uppercase">
                              {match.opponentRank || '1450 ELO'} &middot; {match.id}
                            </span>
                          </div>
                        </div>
                      </td>

                      {/* Problem Challenge */}
                      <td className="py-3 px-3 whitespace-nowrap">
                        <div className="flex flex-col max-w-xs truncate">
                          <span className="font-bold text-zinc-200 text-[11px] uppercase truncate">
                            {match.problem}
                          </span>
                          <span className="text-[9px] text-zinc-500 uppercase mt-0.5">
                            1V1 ARENA DUEL
                          </span>
                        </div>
                      </td>

                      {/* Difficulty */}
                      <td className="py-3 px-3 whitespace-nowrap">
                        {getDifficultyBadge(match.difficulty)}
                      </td>

                      {/* Timestamps (Exact + Relative) */}
                      <td className="py-3 px-3 whitespace-nowrap">
                        <div className="flex flex-col" title={`Full Timestamp: ${fullDateTime}`}>
                          <span className="text-zinc-200 font-bold text-[10px] flex items-center gap-1">
                            <Calendar className="w-3 h-3 text-zinc-500" />
                            {relativeTime}
                          </span>
                          <span className="text-[9px] text-zinc-500 font-mono">
                            {match.timestamp || match.date}
                          </span>
                        </div>
                      </td>

                      {/* Duration */}
                      <td className="py-3 px-3 whitespace-nowrap text-zinc-300 font-bold">
                        <div className="flex items-center gap-1 text-[11px]">
                          <Clock className="w-3 h-3 text-zinc-500" />
                          <span>{match.duration}</span>
                        </div>
                      </td>

                      {/* Language Used */}
                      <td className="py-3 px-3 whitespace-nowrap">
                        <span className={`px-2 py-0.5 text-[10px] font-black uppercase border ${langInfo.bg}`}>
                          {langInfo.name}
                        </span>
                      </td>

                      {/* Tests Pass Rate */}
                      <td className="py-3 px-3 whitespace-nowrap">
                        <span className={`font-bold text-[10px] ${
                          isVic ? 'text-[#00FF00]' : 'text-zinc-400'
                        }`}>
                          {match.testScore}
                        </span>
                      </td>

                      {/* ELO Rating Delta */}
                      <td className="py-3 px-3 whitespace-nowrap text-right">
                        <div className="flex items-center justify-end gap-1">
                          {isVic ? (
                            <span className="flex items-center font-black text-[#00FF00] text-[11px]">
                              <ArrowUpRight className="w-3.5 h-3.5" /> +{match.eloChange}
                            </span>
                          ) : (
                            <span className="flex items-center font-black text-rose-400 text-[11px]">
                              <ArrowDownRight className="w-3.5 h-3.5" /> {match.eloChange}
                            </span>
                          )}
                        </div>
                      </td>

                      {/* View Diff Action Button */}
                      <td className="py-3 px-3 whitespace-nowrap text-right" onClick={(e) => e.stopPropagation()}>
                        <button
                          type="button"
                          onClick={() => {
                            if (onSelectDiff) onSelectDiff(match);
                            setDiffMatch(match);
                          }}
                          className="px-2.5 py-1 bg-blue-600/20 hover:bg-blue-600/30 text-blue-300 hover:text-white border border-blue-500/40 hover:border-blue-400 font-mono text-[9px] font-black uppercase inline-flex items-center gap-1 transition-all cursor-pointer shadow-[0_0_8px_rgba(59,130,246,0.15)]"
                          title="Compare solution vs opponent or optimal code"
                        >
                          <GitCompare className="w-2.5 h-2.5 text-blue-400" />
                          <span>DIFF</span>
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* Selected Match Quick Inspector (Interactive Cyber Drawer) */}
      {selectedMatch && (
        <div className="mt-3 p-4 bg-black border border-[#00FF00]/40 flex flex-col gap-3 animate-in fade-in duration-200">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-white/10 pb-3">
            <div className="flex items-center gap-3">
              <div className={`w-9 h-9 flex items-center justify-center border font-black text-sm ${
                selectedMatch.outcome === 'Victory' 
                  ? 'bg-[#00FF00]/10 text-[#00FF00] border-[#00FF00]/40 shadow-[0_0_8px_rgba(0,255,0,0.2)]' 
                  : 'bg-rose-500/10 text-rose-400 border-rose-500/40'
              }`}>
                {selectedMatch.outcome === 'Victory' ? 'W' : 'L'}
              </div>
              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <span className="font-bold text-white uppercase text-xs">
                    SESSION #{selectedMatch.id} VS {selectedMatch.opponent}
                  </span>
                  {getDifficultyBadge(selectedMatch.difficulty)}
                  <span className={`px-2 py-0.5 text-[9px] font-black border ${
                    selectedMatch.outcome === 'Victory' 
                      ? 'bg-[#00FF00]/15 text-[#00FF00] border-[#00FF00]' 
                      : 'bg-rose-500/15 text-rose-400 border-rose-500'
                  }`}>
                    {selectedMatch.eloChange > 0 ? `+${selectedMatch.eloChange}` : selectedMatch.eloChange} ELO
                  </span>
                </div>
                <p className="text-[10px] text-zinc-400 mt-1">
                  CHALLENGE: <span className="text-zinc-100 font-bold">{selectedMatch.problem}</span> &bull; COMPILER: <span className="text-zinc-200 font-bold">{selectedMatch.language}</span> &bull; DURATION: <span className="text-zinc-200 font-bold">{selectedMatch.duration}</span>
                </p>
              </div>
            </div>

            {/* Close Button */}
            <button
              onClick={() => setSelectedMatch(null)}
              className="text-zinc-500 hover:text-white px-2.5 py-1 text-[10px] font-bold border border-white/10 uppercase self-start sm:self-auto cursor-pointer"
            >
              DISMISS
            </button>
          </div>

          {/* Detailed Timestamps & Test breakdown */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-[10px] bg-white/[0.02] p-2.5 border border-white/5">
            <div>
              <span className="text-zinc-500 uppercase font-bold block">DATE & TIME RECORDED</span>
              <span className="text-zinc-200 font-bold flex items-center gap-1.5 mt-0.5">
                <Calendar className="w-3 h-3 text-[#00FF00]" />
                {formatFullTimestamp(selectedMatch.completedAt || `${selectedMatch.date} ${selectedMatch.timestamp}`)}
              </span>
            </div>
            <div>
              <span className="text-zinc-500 uppercase font-bold block">TEST SUITE RESULT</span>
              <span className="text-zinc-200 font-bold flex items-center gap-1.5 mt-0.5">
                <CheckCircle2 className="w-3 h-3 text-[#00FF00]" />
                {selectedMatch.testScore} Pass Rate
              </span>
            </div>
            <div>
              <span className="text-zinc-500 uppercase font-bold block">OPPONENT RATING</span>
              <span className="text-zinc-200 font-bold flex items-center gap-1.5 mt-0.5">
                <Trophy className="w-3 h-3 text-amber-400" />
                {selectedMatch.opponentRank || '1450 ELO'}
              </span>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-wrap items-center gap-2 pt-1">
            <button
              onClick={() => {
                if (onSelectDiff) onSelectDiff(selectedMatch);
                setDiffMatch(selectedMatch);
              }}
              className="px-3 py-1.5 bg-blue-600/20 border border-blue-500/50 text-blue-300 font-bold text-[10px] uppercase tracking-wider flex items-center gap-1.5 hover:bg-blue-600/30 hover:border-blue-400 hover:text-white transition-all cursor-pointer shadow-[0_0_12px_rgba(59,130,246,0.2)]"
            >
              <GitCompare className="w-3.5 h-3.5 text-blue-400" />
              VIEW SOLUTION DIFF
            </button>

            {onSelectPlayback && (
              <button
                onClick={() => onSelectPlayback(selectedMatch)}
                className="px-3 py-1.5 bg-[#00FF00] text-black font-black text-[10px] uppercase tracking-wider flex items-center gap-1.5 hover:bg-[#00dd00] shadow-[0_0_10px_rgba(0,255,0,0.3)] transition-all cursor-pointer"
              >
                <Code2 className="w-3.5 h-3.5" />
                WATCH CODE PLAYBACK
              </button>
            )}

            {onSelectReview && selectedMatch.review && (
              <button
                onClick={() => onSelectReview(selectedMatch)}
                className="px-3 py-1.5 bg-black border border-white/20 text-white font-bold text-[10px] uppercase tracking-wider flex items-center gap-1.5 hover:border-[#00FF00] hover:text-[#00FF00] transition-all cursor-pointer"
              >
                <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                VIEW AI CODE DOCTOR DIAGNOSTIC
              </button>
            )}

            <button
              onClick={() => handleCopySummary(selectedMatch)}
              className="px-3 py-1.5 bg-black border border-white/10 text-zinc-300 font-bold text-[10px] uppercase tracking-wider flex items-center gap-1.5 hover:text-white hover:border-white/30 transition-all cursor-pointer"
            >
              {copiedId === selectedMatch.id ? (
                <>
                  <Check className="w-3.5 h-3.5 text-[#00FF00]" />
                  TELEMETRY COPIED
                </>
              ) : (
                <>
                  <Copy className="w-3.5 h-3.5 text-zinc-500" />
                  COPY SESSION TELEMETRY
                </>
              )}
            </button>
          </div>
        </div>
      )}

      {/* Side-by-Side Solution Diff Modal */}
      {diffMatch && (
        <div 
          className="fixed inset-0 z-50 bg-black/85 backdrop-blur-sm flex items-center justify-center p-3 sm:p-6 animate-in fade-in duration-200"
          onClick={() => setDiffMatch(null)}
        >
          <div 
            className="w-full max-w-6xl h-[88vh] flex flex-col bg-[#0a0a0a] border border-blue-500/40 shadow-[0_0_50px_rgba(59,130,246,0.25)] rounded-lg overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            <SolutionDiffViewer
              userCode={diffMatch.code || '// User submitted solution code was not recorded for this session.'}
              userLanguage={diffMatch.language || 'typescript'}
              userName={username ? `${username}'s Solution` : 'Your Solution'}
              opponentCode={diffMatch.opponentCode || ''}
              opponentLanguage={diffMatch.language || 'typescript'}
              opponentName={diffMatch.opponent || 'Opponent'}
              expectedSolution={diffMatch.optimalSolution || ''}
              onClose={() => setDiffMatch(null)}
            />
          </div>
        </div>
      )}

      {/* Grid Footer Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mt-4 pt-3 border-t border-white/10 text-[10px] text-zinc-500">
        <div className="flex items-center gap-2">
          <span>SHOWING {processedMatches.length} OF {totalMatches} DUEL RECORDS</span>
          <span>&bull;</span>
          <span className="text-[#00FF00] font-bold">1V1 ARENA AUDIT VAULT</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-zinc-400 font-bold">SORT: {sortBy}</span>
        </div>
      </div>
    </div>
  );
}
