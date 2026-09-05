import { useState } from 'react';
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
  Search
} from 'lucide-react';

export interface MatchRecord {
  id: string;
  opponent: string;
  opponentRank: string;
  opponentAvatar?: string;
  outcome: 'Victory' | 'Defeat';
  problem: string;
  difficulty: 'Easy' | 'Medium' | 'Hard';
  duration: string;
  language: string;
  eloChange: number;
  testScore: string;
  date: string;
  timestamp: string;
}

interface MatchHistoryProps {
  matches?: MatchRecord[];
  username?: string;
  onSelectPlayback?: (match: MatchRecord) => void;
}

export function MatchHistory({ matches = [], onSelectPlayback }: MatchHistoryProps) {
  const [filter, setFilter] = useState<'ALL' | 'VICTORY' | 'DEFEAT'>('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedMatch, setSelectedMatch] = useState<MatchRecord | null>(null);

  // Filtered dataset
  const filteredMatches = matches.filter(m => {
    if (filter === 'VICTORY' && m.outcome !== 'Victory') return false;
    if (filter === 'DEFEAT' && m.outcome !== 'Defeat') return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      return (
        m.opponent.toLowerCase().includes(q) ||
        m.problem.toLowerCase().includes(q) ||
        m.language.toLowerCase().includes(q) ||
        m.id.toLowerCase().includes(q)
      );
    }
    return true;
  });

  // Calculate quick stats
  const totalVictories = matches.filter(m => m.outcome === 'Victory').length;
  const winRate = Math.round((totalVictories / matches.length) * 100);
  const netElo = matches.reduce((acc, curr) => acc + curr.eloChange, 0);

  return (
    <div className="bg-[#080808] border border-white/10 p-5 sm:p-6 flex flex-col font-mono text-xs w-full">
      {/* Header & Controls */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-white/10 pb-4 mb-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Swords className="w-4 h-4 text-[#00FF00]" />
            <h2 className="text-xs sm:text-sm font-black text-white uppercase tracking-widest">
              MATCH HISTORY // TELEMETRY LOGS
            </h2>
            <span className="bg-[#00FF00]/10 text-[#00FF00] text-[9px] px-2 py-0.5 border border-[#00FF00]/30 font-black">
              SYNC: REAL-TIME
            </span>
          </div>
          <p className="text-[10px] text-zinc-500 uppercase">
            HISTORICAL COMBAT DATA &middot; {matches.length} RECORDED ENGAGEMENTS
          </p>
        </div>

        {/* Quick Summary Badges */}
        <div className="flex flex-wrap items-center gap-3">
          <div className="bg-black border border-white/10 px-3 py-1.5 flex items-center gap-2">
            <span className="text-[10px] text-zinc-500 uppercase font-bold">WIN RATE:</span>
            <span className="text-[#00FF00] font-black">{winRate}%</span>
          </div>
          <div className="bg-black border border-white/10 px-3 py-1.5 flex items-center gap-2">
            <span className="text-[10px] text-zinc-500 uppercase font-bold">NET ELO:</span>
            <span className={`font-black ${netElo >= 0 ? 'text-[#00FF00]' : 'text-red-400'}`}>
              {netElo > 0 ? `+${netElo}` : netElo}
            </span>
          </div>
          <div className="bg-black border border-white/10 px-3 py-1.5 flex items-center gap-2">
            <span className="text-[10px] text-zinc-500 uppercase font-bold">RECENT:</span>
            <span className="text-white font-bold">{totalVictories}W - {matches.length - totalVictories}L</span>
          </div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
        {/* Outcome Filter Buttons */}
        <div className="flex items-center gap-1.5">
          <span className="text-[10px] text-zinc-500 uppercase font-bold mr-1 flex items-center gap-1">
            <Filter className="w-3 h-3 text-[#00FF00]" /> STATUS:
          </span>
          {(['ALL', 'VICTORY', 'DEFEAT'] as const).map(tab => (
            <button
              key={tab}
              onClick={() => setFilter(tab)}
              className={`px-2.5 py-1 text-[10px] font-black uppercase tracking-wider transition-all border ${
                filter === tab
                  ? 'bg-[#00FF00]/15 text-[#00FF00] border-[#00FF00] shadow-[0_0_8px_rgba(0,255,0,0.25)]'
                  : 'bg-black text-zinc-400 border-white/10 hover:border-white/25 hover:text-white'
              }`}
            >
              {tab}
            </button>
          ))}
        </div>

        {/* Search Input */}
        <div className="relative sm:w-64">
          <Search className="w-3.5 h-3.5 text-zinc-500 absolute left-2.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            placeholder="FILTER BY OPPONENT / PROBLEM..."
            className="w-full bg-black border border-white/10 pl-8 pr-3 py-1 text-[10px] text-zinc-200 placeholder:text-zinc-600 focus:outline-none focus:border-[#00FF00]/50 transition-colors uppercase font-mono font-bold"
          />
        </div>
      </div>

      {/* Cyberpunk Data-Grid Table */}
      <div className="overflow-x-auto border border-white/10 bg-black/60 custom-scrollbar">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="border-b border-white/15 bg-black text-[10px] uppercase font-black text-zinc-400 tracking-wider">
              <th className="py-2.5 px-3">OUTCOME</th>
              <th className="py-2.5 px-3">OPPONENT</th>
              <th className="py-2.5 px-3">PROBLEM CHALLENGE</th>
              <th className="py-2.5 px-3">DURATION</th>
              <th className="py-2.5 px-3">LANGUAGE</th>
              <th className="py-2.5 px-3">TESTS</th>
              <th className="py-2.5 px-3 text-right">RATING DELTA</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/5 font-mono">
            {filteredMatches.length === 0 ? (
              <tr>
                <td colSpan={7} className="py-8 text-center text-zinc-500 uppercase tracking-widest text-[11px]">
                  NO MATCH RECORDS MATCHING CURRENT TELEMETRY QUERY
                </td>
              </tr>
            ) : (
              filteredMatches.map(match => {
                const isVic = match.outcome === 'Victory';
                const isSelected = selectedMatch?.id === match.id;
                return (
                  <tr
                    key={match.id}
                    onClick={() => setSelectedMatch(isSelected ? null : match)}
                    className={`group transition-all cursor-pointer ${
                      isSelected
                        ? 'bg-[#00FF00]/10 border-l-2 border-l-[#00FF00]'
                        : isVic
                        ? 'hover:bg-[#00FF00]/5 hover:border-l-2 hover:border-l-[#00FF00]/60'
                        : 'hover:bg-red-500/5 hover:border-l-2 hover:border-l-red-500/60'
                    }`}
                  >
                    {/* Outcome Badge */}
                    <td className="py-3 px-3 whitespace-nowrap">
                      <div className="flex items-center gap-1.5">
                        {isVic ? (
                          <span className="flex items-center gap-1 px-2 py-0.5 bg-[#00FF00]/10 text-[#00FF00] border border-[#00FF00]/30 font-black text-[10px] tracking-wider uppercase shadow-[0_0_6px_rgba(0,255,0,0.15)]">
                            <CheckCircle2 className="w-3 h-3" /> VICTORY
                          </span>
                        ) : (
                          <span className="flex items-center gap-1 px-2 py-0.5 bg-red-500/10 text-red-400 border border-red-500/30 font-black text-[10px] tracking-wider uppercase">
                            <XCircle className="w-3 h-3" /> DEFEAT
                          </span>
                        )}
                      </div>
                    </td>

                    {/* Opponent Info */}
                    <td className="py-3 px-3 whitespace-nowrap">
                      <div className="flex flex-col">
                        <span className="font-bold text-white group-hover:text-[#00FF00] transition-colors text-[11px] uppercase tracking-wide">
                          {match.opponent}
                        </span>
                        <span className="text-[9px] text-zinc-500 uppercase">
                          {match.opponentRank} &middot; {match.id}
                        </span>
                      </div>
                    </td>

                    {/* Problem Challenge */}
                    <td className="py-3 px-3 whitespace-nowrap">
                      <div className="flex flex-col">
                        <span className="font-bold text-zinc-200 text-[11px] uppercase">
                          {match.problem}
                        </span>
                        <div className="flex items-center gap-2 text-[9px] mt-0.5">
                          <span className={`font-black uppercase ${
                            match.difficulty === 'Easy' ? 'text-green-400' :
                            match.difficulty === 'Medium' ? 'text-amber-400' : 'text-red-400'
                          }`}>
                            {match.difficulty}
                          </span>
                          <span className="text-zinc-600">&bull;</span>
                          <span className="text-zinc-500">{match.date}</span>
                        </div>
                      </div>
                    </td>

                    {/* Duration */}
                    <td className="py-3 px-3 whitespace-nowrap text-zinc-300 font-bold">
                      <div className="flex items-center gap-1 text-[11px]">
                        <Clock className="w-3 h-3 text-zinc-500" />
                        <span>{match.duration}</span>
                      </div>
                    </td>

                    {/* Language */}
                    <td className="py-3 px-3 whitespace-nowrap">
                      <span className="bg-black border border-white/15 px-2 py-0.5 text-[10px] font-bold text-zinc-300 uppercase">
                        {match.language}
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
                          <span className="flex items-center font-black text-red-400 text-[11px]">
                            <ArrowDownRight className="w-3.5 h-3.5" /> {match.eloChange}
                          </span>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Selected Match Quick Inspector (Interactive Cyber Drawer) */}
      {selectedMatch && (
        <div className="mt-3 p-3 bg-black border border-[#00FF00]/40 flex flex-col sm:flex-row sm:items-center justify-between gap-3 animate-in fade-in duration-200">
          <div className="flex items-center gap-3">
            <div className={`w-8 h-8 flex items-center justify-center border font-black text-xs ${
              selectedMatch.outcome === 'Victory' 
                ? 'bg-[#00FF00]/10 text-[#00FF00] border-[#00FF00]/40' 
                : 'bg-red-500/10 text-red-400 border-red-500/40'
            }`}>
              {selectedMatch.outcome === 'Victory' ? 'W' : 'L'}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-bold text-white uppercase text-[11px]">
                  SESSION #{selectedMatch.id} VS {selectedMatch.opponent}
                </span>
                <span className="text-[10px] text-zinc-500 font-mono">[{selectedMatch.timestamp}]</span>
              </div>
              <p className="text-[10px] text-zinc-400 mt-0.5">
                CHALLENGE: <span className="text-zinc-200 font-bold">{selectedMatch.problem}</span> &bull; RUNTIME: {selectedMatch.duration} &bull; COMPILER: {selectedMatch.language}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3 self-end sm:self-auto">
            {onSelectPlayback && (
              <button
                onClick={() => onSelectPlayback(selectedMatch)}
                className="px-3 py-1.5 bg-[#00FF00] text-black font-black text-[10px] uppercase tracking-wider flex items-center gap-1.5 hover:bg-[#00dd00] shadow-[0_0_10px_rgba(0,255,0,0.3)] transition-all cursor-pointer"
              >
                <Code2 className="w-3.5 h-3.5" />
                WATCH CODE PLAYBACK
              </button>
            )}
            <span className={`px-2 py-1 text-[10px] font-black border ${
              selectedMatch.outcome === 'Victory' 
                ? 'bg-[#00FF00]/15 text-[#00FF00] border-[#00FF00]' 
                : 'bg-red-500/15 text-red-400 border-red-500'
            }`}>
              DELTA: {selectedMatch.eloChange > 0 ? `+${selectedMatch.eloChange}` : selectedMatch.eloChange} ELO
            </span>
            <button
              onClick={() => setSelectedMatch(null)}
              className="text-zinc-500 hover:text-white px-2 py-1 text-[10px] font-bold border border-white/10 uppercase"
            >
              CLOSE
            </button>
          </div>
        </div>
      )}

      {/* Grid Footer Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mt-4 pt-3 border-t border-white/10 text-[10px] text-zinc-500">
        <div className="flex items-center gap-2">
          <span>SHOWING {filteredMatches.length} OF {matches.length} DUEL RECORDS</span>
          <span>&bull;</span>
          <span className="text-[#00FF00] font-bold">ENCRYPTED TELEMETRY VAULT</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-zinc-400 font-bold">SORT: CHRONOLOGICAL (DESC)</span>
        </div>
      </div>
    </div>
  );
}
