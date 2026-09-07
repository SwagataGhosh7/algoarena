import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { socket } from '../socket';
import { LiveDuelSummary } from '../types';
import { 
  Eye, 
  Tv, 
  Swords, 
  Bot, 
  ShieldCheck, 
  RefreshCw, 
  Clock, 
  Zap, 
  Search, 
  Users, 
  Flame,
  ArrowRight,
  ShieldAlert,
  Play
} from 'lucide-react';
import clsx from 'clsx';
import { motion, AnimatePresence } from 'motion/react';

interface LiveSpectateListProps {
  onQuickMatch?: () => void;
  onPracticeWithBot?: () => void;
}

export function LiveSpectateList({ onQuickMatch, onPracticeWithBot }: LiveSpectateListProps) {
  const navigate = useNavigate();
  const [liveDuels, setLiveDuels] = useState<LiveDuelSummary[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterDifficulty, setFilterDifficulty] = useState<'all' | 'easy' | 'medium' | 'hard'>('all');
  const [directRoomCode, setDirectRoomCode] = useState('');
  const [directError, setDirectError] = useState('');

  const fetchLiveDuels = () => {
    setIsLoading(true);
    socket.emit('get_live_duels', (duels: LiveDuelSummary[]) => {
      if (Array.isArray(duels)) {
        setLiveDuels(duels);
      }
      setIsLoading(false);
    });
  };

  useEffect(() => {
    fetchLiveDuels();

    const handleDuelsUpdate = (duels: LiveDuelSummary[]) => {
      if (Array.isArray(duels)) {
        setLiveDuels(duels);
      }
      setIsLoading(false);
    };

    socket.on('live_duels_update', handleDuelsUpdate);

    const interval = setInterval(fetchLiveDuels, 6000);

    return () => {
      socket.off('live_duels_update', handleDuelsUpdate);
      clearInterval(interval);
    };
  }, []);

  const handleSpectate = (roomId: string) => {
    navigate(`/room/${roomId}?spectate=true`);
  };

  const handleDirectSpectateSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const clean = directRoomCode.trim().replace(/^#/, '');
    if (!clean) {
      setDirectError('Please specify a match room ID to spectate.');
      return;
    }
    setDirectError('');
    navigate(`/room/${clean}?spectate=true`);
  };

  const filteredDuels = liveDuels.filter(duel => {
    if (filterDifficulty !== 'all' && duel.difficulty !== filterDifficulty) {
      return false;
    }
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchPlayer = duel.players.some(p => p.name.toLowerCase().includes(q));
      const matchTopic = duel.topic?.toLowerCase().includes(q);
      const matchProblem = duel.problemTitle?.toLowerCase().includes(q);
      const matchRoom = duel.roomId.toLowerCase().includes(q);
      return matchPlayer || matchTopic || matchProblem || matchRoom;
    }
    return true;
  });

  return (
    <div className="w-full space-y-6 font-mono text-left">
      {/* Fair Play Guarantee Banner */}
      <div className="bg-[#080808] border border-[#00FF00]/30 p-4 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 bg-[#00FF00]/10 border border-[#00FF00]/40 flex items-center justify-center shrink-0">
            <ShieldCheck className="w-5 h-5 text-[#00FF00]" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-black text-white uppercase tracking-wider">
                COMPETITIVE INTEGRITY & FAIR PLAY ENFORCED
              </span>
              <span className="px-1.5 py-0.5 bg-[#00FF00]/20 text-[#00FF00] text-[9px] font-bold uppercase border border-[#00FF00]/40">
                PASSIVE SPECTATOR FEED
              </span>
            </div>
            <p className="text-[11px] text-zinc-400 mt-0.5">
              Spectators stream live code and test evaluations in real-time. In-match chat, code execution, and player interactions are locked to ensure 100% fair play.
            </p>
          </div>
        </div>

        {/* Direct Spectate Input */}
        <form onSubmit={handleDirectSpectateSubmit} className="flex items-center gap-2 w-full md:w-auto shrink-0">
          <input
            type="text"
            placeholder="Room ID (e.g. 8a7f1c)"
            value={directRoomCode}
            onChange={(e) => {
              setDirectRoomCode(e.target.value);
              if (directError) setDirectError('');
            }}
            className="bg-black border border-white/20 focus:border-[#00FF00] px-3 py-1.5 text-xs text-white placeholder:text-zinc-600 outline-none w-full md:w-44 uppercase"
          />
          <button
            type="submit"
            className="flex items-center gap-1.5 px-3 py-1.5 bg-[#00FF00] hover:bg-[#00DD00] text-black font-black text-xs uppercase cursor-pointer transition-all shadow-[0_0_10px_rgba(0,255,0,0.2)]"
          >
            <Eye className="w-3.5 h-3.5" />
            <span>WATCH</span>
          </button>
        </form>
      </div>

      {directError && (
        <div className="text-xs text-red-400 flex items-center gap-1.5 px-1">
          <ShieldAlert className="w-3.5 h-3.5" />
          <span>{directError}</span>
        </div>
      )}

      {/* Control Bar: Filters & Search */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-[#0c0c0c] border border-white/10 p-3">
        <div className="flex items-center gap-2 flex-1 max-w-md bg-black border border-white/15 px-3 py-1.5">
          <Search className="w-3.5 h-3.5 text-zinc-500 shrink-0" />
          <input
            type="text"
            placeholder="Filter by duelist handle, topic, or problem..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="bg-transparent text-xs text-white placeholder:text-zinc-600 outline-none w-full"
          />
          {searchQuery && (
            <button 
              onClick={() => setSearchQuery('')}
              className="text-zinc-500 hover:text-white text-xs cursor-pointer"
            >
              ×
            </button>
          )}
        </div>

        <div className="flex items-center gap-2 justify-between sm:justify-end">
          <div className="flex items-center gap-1 bg-black border border-white/15 p-0.5">
            {(['all', 'easy', 'medium', 'hard'] as const).map((diff) => (
              <button
                key={diff}
                onClick={() => setFilterDifficulty(diff)}
                className={clsx(
                  "px-2.5 py-1 text-[10px] font-bold uppercase transition-all cursor-pointer",
                  filterDifficulty === diff
                    ? "bg-[#00FF00] text-black"
                    : "text-zinc-400 hover:text-white"
                )}
              >
                {diff}
              </button>
            ))}
          </div>

          <button
            onClick={fetchLiveDuels}
            disabled={isLoading}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-black border border-white/20 hover:border-[#00FF00] text-zinc-300 hover:text-white text-xs font-bold uppercase transition-colors cursor-pointer"
            title="Refresh Live Duels"
          >
            <RefreshCw className={clsx("w-3.5 h-3.5 text-[#00FF00]", isLoading && "animate-spin")} />
            <span className="hidden sm:inline">REFRESH</span>
          </button>
        </div>
      </div>

      {/* Matches Grid */}
      {filteredDuels.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <AnimatePresence>
            {filteredDuels.map((duel) => {
              const p1 = duel.players[0];
              const p2 = duel.players[1];
              const isMatchActive = duel.status === 'active';
              const isFinished = duel.status === 'finished';

              return (
                <motion.div
                  key={duel.roomId}
                  initial={{ opacity: 0, scale: 0.98 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.98 }}
                  className={clsx(
                    "bg-[#0a0a0a] border transition-all relative flex flex-col justify-between overflow-hidden",
                    isMatchActive 
                      ? "border-[#00FF00]/40 hover:border-[#00FF00] shadow-[0_0_15px_rgba(0,255,0,0.08)]" 
                      : isFinished 
                        ? "border-zinc-800 opacity-80" 
                        : "border-white/15 hover:border-white/30"
                  )}
                >
                  {/* Top Header */}
                  <div className="p-3.5 border-b border-white/10 flex items-center justify-between bg-black/40">
                    <div className="flex items-center gap-2">
                      {isMatchActive ? (
                        <div className="flex items-center gap-1.5 px-2 py-0.5 bg-red-500/10 border border-red-500/40 text-red-400 text-[10px] font-black uppercase">
                          <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-ping" />
                          <span>LIVE DUEL</span>
                        </div>
                      ) : isFinished ? (
                        <div className="px-2 py-0.5 bg-zinc-800 text-zinc-400 text-[10px] font-black uppercase border border-zinc-700">
                          MATCH CONCLUDED
                        </div>
                      ) : (
                        <div className="px-2 py-0.5 bg-amber-500/10 text-amber-400 text-[10px] font-black uppercase border border-amber-500/30">
                          WAITING IN LOBBY
                        </div>
                      )}

                      <span className={clsx(
                        "text-[10px] font-bold uppercase px-1.5 py-0.5 border",
                        duel.difficulty === 'easy' ? "border-green-500/40 text-green-400 bg-green-500/10" :
                        duel.difficulty === 'hard' ? "border-red-500/40 text-red-400 bg-red-500/10" :
                        "border-amber-500/40 text-amber-400 bg-amber-500/10"
                      )}>
                        {duel.difficulty}
                      </span>
                    </div>

                    <div className="flex items-center gap-3 text-xs text-zinc-400 font-mono">
                      <div className="flex items-center gap-1 text-[#00FF00]" title="Current Spectators">
                        <Eye className="w-3.5 h-3.5" />
                        <span className="font-bold">{duel.spectatorCount}</span>
                      </div>
                      <span className="text-zinc-600">#{duel.roomId}</span>
                    </div>
                  </div>

                  {/* Duel Content */}
                  <div className="p-4 space-y-4">
                    {/* Problem / Topic title */}
                    <div>
                      <div className="text-[10px] text-zinc-500 uppercase tracking-wider font-bold">
                        {duel.topic || 'ALGORITHMS & DATA STRUCTURES'}
                      </div>
                      <h4 className="text-sm font-bold text-white line-clamp-1 mt-0.5">
                        {duel.problemTitle || 'Competitive 1v1 Arena Challenge'}
                      </h4>
                    </div>

                    {/* Competitors Matchup */}
                    <div className="bg-black/60 border border-white/10 p-3 grid grid-cols-[1fr_auto_1fr] items-center gap-2">
                      {/* Player 1 */}
                      <div className="flex flex-col items-start min-w-0">
                        <div className="flex items-center gap-1.5 w-full">
                          <div className="w-6 h-6 bg-[#00FF00]/20 border border-[#00FF00] text-[#00FF00] flex items-center justify-center font-bold text-[10px] shrink-0">
                            {p1?.name ? p1.name.slice(0, 2).toUpperCase() : 'P1'}
                          </div>
                          <span className="text-xs font-bold text-white truncate">
                            {p1?.name || 'Duelist 1'}
                          </span>
                        </div>
                        <div className="mt-1.5 flex items-center gap-2 text-[10px] text-zinc-400">
                          <span className="text-[#F27D26] font-mono">{p1?.elo ? `[${p1.elo}]` : '[1200]'}</span>
                          <span>{p1?.progress || 0}% TEST SUITE</span>
                        </div>
                        {/* Progress Bar */}
                        <div className="w-full bg-zinc-900 h-1.5 mt-1 overflow-hidden border border-zinc-800">
                          <div 
                            className="bg-[#00FF00] h-full transition-all duration-300"
                            style={{ width: `${Math.min(100, Math.max(0, p1?.progress || 0))}%` }}
                          />
                        </div>
                      </div>

                      {/* VS Divider */}
                      <div className="px-2 flex flex-col items-center justify-center">
                        <span className="text-xs font-black text-[#F27D26] bg-[#F27D26]/10 px-1.5 py-0.5 border border-[#F27D26]/30">
                          VS
                        </span>
                      </div>

                      {/* Player 2 */}
                      <div className="flex flex-col items-end min-w-0 text-right">
                        <div className="flex items-center gap-1.5 justify-end w-full">
                          <span className="text-xs font-bold text-white truncate">
                            {p2?.name || (duel.status === 'waiting' ? 'Awaiting...' : 'AlgoArena Bot')}
                          </span>
                          <div className={clsx(
                            "w-6 h-6 flex items-center justify-center font-bold text-[10px] shrink-0 border",
                            p2?.isAi 
                              ? "bg-purple-500/20 border-purple-400 text-purple-300" 
                              : "bg-[#00FF00]/20 border-[#00FF00] text-[#00FF00]"
                          )}>
                            {p2?.isAi ? <Bot className="w-3.5 h-3.5" /> : (p2?.name ? p2.name.slice(0, 2).toUpperCase() : 'P2')}
                          </div>
                        </div>
                        <div className="mt-1.5 flex items-center gap-2 text-[10px] text-zinc-400">
                          <span>{p2?.progress || 0}% TEST SUITE</span>
                          <span className="text-[#F27D26] font-mono">{p2?.isAi ? '[AI BOT]' : (p2?.elo ? `[${p2.elo}]` : '[1200]')}</span>
                        </div>
                        {/* Progress Bar */}
                        <div className="w-full bg-zinc-900 h-1.5 mt-1 overflow-hidden border border-zinc-800">
                          <div 
                            className={clsx(
                              "h-full transition-all duration-300",
                              p2?.isAi ? "bg-purple-400" : "bg-[#00FF00]"
                            )}
                            style={{ width: `${Math.min(100, Math.max(0, p2?.progress || 0))}%` }}
                          />
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Bottom Action Footer */}
                  <div className="p-3.5 bg-black/80 border-t border-white/10 flex items-center justify-between">
                    <div className="flex items-center gap-2 text-[11px] text-zinc-400">
                      <Tv className="w-3.5 h-3.5 text-[#00FF00]" />
                      <span>Live Stream Active</span>
                    </div>

                    <button
                      onClick={() => handleSpectate(duel.roomId)}
                      className="flex items-center gap-2 px-4 py-2 bg-[#00FF00] hover:bg-[#00DD00] text-black font-black text-xs uppercase tracking-wider transition-all shadow-[0_0_12px_rgba(0,255,0,0.25)] hover:shadow-[0_0_20px_rgba(0,255,0,0.4)] cursor-pointer"
                    >
                      <Eye className="w-4 h-4" />
                      <span>SPECTATE DUEL</span>
                    </button>
                  </div>
                </motion.div>
              );
            })}
          </AnimatePresence>
        </div>
      ) : (
        /* Empty State */
        <div className="bg-[#0a0a0a] border border-white/10 p-12 text-center flex flex-col items-center justify-center space-y-4">
          <div className="w-14 h-14 bg-black border border-white/20 flex items-center justify-center text-zinc-500">
            <Tv className="w-7 h-7 text-[#00FF00]" />
          </div>
          <div>
            <h3 className="text-base font-black uppercase text-white tracking-wider font-brand">
              NO ONGOING 1V1 DUELS FOUND
            </h3>
            <p className="text-xs text-zinc-400 max-w-md mx-auto mt-1 font-mono">
              There are currently no active competitive duels to observe in this arena shard. Launch a match or spar with AlgoArena Bot to generate live action!
            </p>
          </div>

          <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
            {onQuickMatch && (
              <button
                onClick={onQuickMatch}
                className="flex items-center gap-2 px-4 py-2 bg-[#00FF00] hover:bg-[#00DD00] text-black font-bold text-xs uppercase cursor-pointer shadow-[0_0_12px_rgba(0,255,0,0.25)]"
              >
                <Swords className="w-3.5 h-3.5" />
                <span>START QUICK 1V1</span>
              </button>
            )}
            {onPracticeWithBot && (
              <button
                onClick={onPracticeWithBot}
                className="flex items-center gap-2 px-4 py-2 bg-black border border-[#00FF00]/40 hover:border-[#00FF00] text-white font-bold text-xs uppercase cursor-pointer"
              >
                <Bot className="w-3.5 h-3.5 text-[#00FF00]" />
                <span>PLAY BOT PRACTICE</span>
              </button>
            )}
            <button
              onClick={fetchLiveDuels}
              className="flex items-center gap-2 px-4 py-2 bg-black border border-white/20 hover:border-white/40 text-zinc-300 hover:text-white font-bold text-xs uppercase cursor-pointer"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>REFRESH FEED</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
