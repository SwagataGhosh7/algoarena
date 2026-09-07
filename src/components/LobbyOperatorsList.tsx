import { useState, useEffect, useMemo } from 'react';
import { 
  Users, 
  Swords, 
  Radio, 
  RefreshCw, 
  Search, 
  Bot, 
  Trophy, 
  Zap,
  Clock,
  ShieldCheck,
  AlertCircle,
  CheckCircle2,
  Moon,
  Sun
} from 'lucide-react';
import { socket } from '../socket';
import { apiUrl } from '../api';
import { ActiveLobbyUser } from '../types';
import { triggerDirectChallenge } from './DirectChallengeModal';
import { OnlineStatusIndicator } from './OnlineStatusIndicator';

interface LobbyOperatorsListProps {
  currentUsername: string;
}

type PresenceFilter = 'ALL' | 'ONLINE' | 'IN_MATCH' | 'IDLE';

export function LobbyOperatorsList({ currentUsername }: LobbyOperatorsListProps) {
  const [operators, setOperators] = useState<ActiveLobbyUser[]>([]);
  const [search, setSearch] = useState('');
  const [presenceFilter, setPresenceFilter] = useState<PresenceFilter>('ALL');
  const [myPresence, setMyPresence] = useState<'online' | 'idle'>('online');
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [actionNotice, setActionNotice] = useState<string | null>(null);

  const fetchOperators = async (isManual = false) => {
    if (isManual) setIsRefreshing(true);
    try {
      const res = await fetch(apiUrl('/api/lobby-operators'));
      if (res.ok) {
        const data = await res.json();
        setOperators(data.operators || []);
      }
    } catch (err) {
      console.warn('Could not fetch lobby operators:', err);
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  };

  // Sync initial operators and listen for socket updates
  useEffect(() => {
    fetchOperators();

    // Transmit initial presence to server
    if (currentUsername) {
      socket.emit('user_presence', { username: currentUsername, status: myPresence });
    }

    const handleUpdate = (data: { operators: ActiveLobbyUser[] }) => {
      if (Array.isArray(data.operators)) {
        setOperators(data.operators);
      }
    };

    socket.on('lobby_operators_update', handleUpdate);
    const interval = setInterval(() => fetchOperators(), 12000);

    return () => {
      socket.off('lobby_operators_update', handleUpdate);
      clearInterval(interval);
    };
  }, [currentUsername]);

  // Client-side automatic idle detection after inactivity or tab hidden
  useEffect(() => {
    let idleTimer: NodeJS.Timeout;
    const resetIdleTimer = () => {
      clearTimeout(idleTimer);
      if (myPresence === 'idle') {
        setMyPresence('online');
        socket.emit('set_presence', { status: 'online' });
      }
      idleTimer = setTimeout(() => {
        setMyPresence('idle');
        socket.emit('set_presence', { status: 'idle' });
      }, 120000); // 2 minutes inactivity
    };

    const handleVisibilityChange = () => {
      if (document.hidden) {
        setMyPresence('idle');
        socket.emit('set_presence', { status: 'idle' });
      } else {
        setMyPresence('online');
        socket.emit('set_presence', { status: 'online' });
        resetIdleTimer();
      }
    };

    window.addEventListener('mousemove', resetIdleTimer, { passive: true });
    window.addEventListener('keydown', resetIdleTimer, { passive: true });
    window.addEventListener('click', resetIdleTimer, { passive: true });
    document.addEventListener('visibilitychange', handleVisibilityChange);

    resetIdleTimer();

    return () => {
      clearTimeout(idleTimer);
      window.removeEventListener('mousemove', resetIdleTimer);
      window.removeEventListener('keydown', resetIdleTimer);
      window.removeEventListener('click', resetIdleTimer);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [myPresence]);

  const toggleMyPresence = () => {
    const nextStatus = myPresence === 'online' ? 'idle' : 'online';
    setMyPresence(nextStatus);
    socket.emit('set_presence', { status: nextStatus });
  };

  const getNormalizedStatus = (op: ActiveLobbyUser): 'ONLINE' | 'IN-MATCH' | 'IDLE' => {
    const s = (op.status || '').toLowerCase();
    if (s === 'in_match' || s === 'in-match' || s === 'in duel' || s === 'in_room') {
      return 'IN-MATCH';
    }
    if (s === 'idle' || s === 'away') {
      return 'IDLE';
    }
    return 'ONLINE';
  };

  // Metrics count for presence badges
  const counts = useMemo(() => {
    let online = 0;
    let inMatch = 0;
    let idle = 0;
    operators.forEach(op => {
      const status = getNormalizedStatus(op);
      if (status === 'ONLINE') online++;
      else if (status === 'IN-MATCH') inMatch++;
      else if (status === 'IDLE') idle++;
    });
    return { all: operators.length, online, inMatch, idle };
  }, [operators]);

  // Filtered operators based on search and presence filter
  const filtered = useMemo(() => {
    return operators.filter(op => {
      const matchesSearch = !search.trim() || op.username.toLowerCase().includes(search.toLowerCase().trim());
      if (!matchesSearch) return false;

      const norm = getNormalizedStatus(op);
      if (presenceFilter === 'ONLINE') return norm === 'ONLINE';
      if (presenceFilter === 'IN_MATCH') return norm === 'IN-MATCH';
      if (presenceFilter === 'IDLE') return norm === 'IDLE';
      return true;
    });
  }, [operators, search, presenceFilter]);

  const handleChallengeClick = (op: ActiveLobbyUser) => {
    const norm = getNormalizedStatus(op);
    if (norm === 'IN-MATCH') {
      setActionNotice(`Operator ${op.username} is currently engaged in a duel match. You can challenge them once their duel concludes.`);
      setTimeout(() => setActionNotice(null), 4000);
      return;
    }
    triggerDirectChallenge(op.username, op.socketId, op.elo);
  };

  return (
    <div className="bg-[#080808] border border-white/10 font-mono text-xs overflow-hidden">
      {/* Header with Title & Search */}
      <div className="p-4 bg-[#0d0d0d] border-b border-white/10 flex flex-col md:flex-row md:items-center justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 bg-[#00FF00]/10 border border-[#00FF00] flex items-center justify-center text-[#00FF00] shrink-0">
            <Radio className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-xs font-black uppercase text-white tracking-wider flex items-center gap-2">
              <span>ACTIVE LOBBY OPERATORS</span>
              <span className="text-[10px] bg-[#00FF00]/20 text-[#00FF00] px-1.5 py-0.5 border border-[#00FF00]/40 font-mono">
                {counts.online} AVAILABLE FOR CHALLENGE
              </span>
            </h3>
            <p className="text-[10px] text-zinc-400">
              Live presence indicators show who is online, in-match, or idle for direct 1v1 challenges
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* Quick Local Player Presence Switcher */}
          <button
            type="button"
            onClick={toggleMyPresence}
            className={`px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider border transition-all cursor-pointer inline-flex items-center gap-1.5 ${
              myPresence === 'online'
                ? 'bg-[#00FF00]/10 border-[#00FF00]/40 text-[#00FF00] hover:bg-[#00FF00]/20'
                : 'bg-amber-400/10 border-amber-400/40 text-amber-400 hover:bg-amber-400/20'
            }`}
            title="Toggle your presence between Online and Idle"
          >
            <span className={`w-1.5 h-1.5 rounded-full ${myPresence === 'online' ? 'bg-[#00FF00] animate-pulse shadow-[0_0_6px_#00FF00]' : 'bg-amber-400'}`} />
            <span>YOU: {myPresence.toUpperCase()}</span>
          </button>

          {/* Search Input */}
          <div className="relative flex-1 sm:w-48">
            <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-zinc-500" />
            <input
              type="text"
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="FILTER OPERATORS..."
              className="w-full bg-black border border-white/15 pl-8 pr-2 py-1 text-[11px] text-white uppercase placeholder:text-zinc-600 outline-none focus:border-[#00FF00]"
            />
          </div>

          {/* Refresh Button */}
          <button
            type="button"
            onClick={() => fetchOperators(true)}
            disabled={isRefreshing}
            className="p-1.5 bg-black border border-white/15 hover:border-[#00FF00] text-zinc-400 hover:text-white cursor-pointer disabled:opacity-50"
            title="Refresh presence telemetry"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin text-[#00FF00]' : ''}`} />
          </button>
        </div>
      </div>

      {/* Presence Filter Navigation Tabs */}
      <div className="px-4 py-2.5 bg-black/80 border-b border-white/10 flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-1.5 overflow-x-auto text-[10px] font-bold">
          <span className="text-zinc-500 uppercase mr-1 hidden sm:inline">Filter Presence:</span>
          
          <button
            type="button"
            onClick={() => setPresenceFilter('ALL')}
            className={`px-2.5 py-1 uppercase tracking-wider transition-all cursor-pointer border ${
              presenceFilter === 'ALL'
                ? 'bg-white/10 border-white text-white'
                : 'bg-transparent border-white/10 text-zinc-400 hover:text-white hover:border-white/30'
            }`}
          >
            ALL ({counts.all})
          </button>

          <button
            type="button"
            onClick={() => setPresenceFilter('ONLINE')}
            className={`px-2.5 py-1 uppercase tracking-wider transition-all cursor-pointer border flex items-center gap-1.5 ${
              presenceFilter === 'ONLINE'
                ? 'bg-[#00FF00]/20 border-[#00FF00] text-[#00FF00] shadow-[0_0_10px_rgba(0,255,0,0.2)]'
                : 'bg-transparent border-white/10 text-[#00FF00]/80 hover:text-[#00FF00] hover:border-[#00FF00]/40'
            }`}
          >
            <span className="w-1.5 h-1.5 rounded-full bg-[#00FF00] animate-pulse" />
            <span>ONLINE ({counts.online})</span>
          </button>

          <button
            type="button"
            onClick={() => setPresenceFilter('IN_MATCH')}
            className={`px-2.5 py-1 uppercase tracking-wider transition-all cursor-pointer border flex items-center gap-1.5 ${
              presenceFilter === 'IN_MATCH'
                ? 'bg-[#F27D26]/20 border-[#F27D26] text-[#F27D26] shadow-[0_0_10px_rgba(242,125,38,0.2)]'
                : 'bg-transparent border-white/10 text-[#F27D26]/80 hover:text-[#F27D26] hover:border-[#F27D26]/40'
            }`}
          >
            <span className="w-1.5 h-1.5 rounded-full bg-[#F27D26] animate-pulse" />
            <span>IN-MATCH ({counts.inMatch})</span>
          </button>

          <button
            type="button"
            onClick={() => setPresenceFilter('IDLE')}
            className={`px-2.5 py-1 uppercase tracking-wider transition-all cursor-pointer border flex items-center gap-1.5 ${
              presenceFilter === 'IDLE'
                ? 'bg-amber-400/20 border-amber-400 text-amber-400 shadow-[0_0_10px_rgba(251,191,36,0.2)]'
                : 'bg-transparent border-white/10 text-amber-400/80 hover:text-amber-400 hover:border-amber-400/40'
            }`}
          >
            <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />
            <span>IDLE ({counts.idle})</span>
          </button>
        </div>

        {/* Presence Legend Guide */}
        <div className="flex items-center gap-3 text-[9px] text-zinc-400 uppercase font-medium">
          <div className="flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-[#00FF00] shadow-[0_0_6px_#00FF00]" />
            <span className="text-zinc-300">Ready</span>
          </div>
          <div className="flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-[#F27D26] shadow-[0_0_6px_#F27D26]" />
            <span className="text-zinc-300">In Duel</span>
          </div>
          <div className="flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />
            <span className="text-zinc-300">Away</span>
          </div>
        </div>
      </div>

      {/* Interactive notification notice when user clicks on an in-match operator */}
      {actionNotice && (
        <div className="p-2.5 bg-[#F27D26]/10 border-b border-[#F27D26]/30 text-[#F27D26] text-[11px] flex items-center justify-between gap-2 animate-fadeIn">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{actionNotice}</span>
          </div>
          <button
            type="button"
            onClick={() => setActionNotice(null)}
            className="text-xs uppercase font-bold text-zinc-400 hover:text-white cursor-pointer"
          >
            [CLOSE]
          </button>
        </div>
      )}

      {/* Operators Grid / Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="border-b border-white/10 text-[10px] text-zinc-500 uppercase tracking-wider bg-black/60">
              <th className="py-2.5 px-4">Operator</th>
              <th className="py-2.5 px-4 text-center">Rating</th>
              <th className="py-2.5 px-4 text-center">Presence Status</th>
              <th className="py-2.5 px-4 text-right">Direct Challenge</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/5">
            {isLoading ? (
              <tr>
                <td colSpan={4} className="py-8 text-center text-zinc-500 text-xs">
                  <div className="flex items-center justify-center gap-2">
                    <Radio className="w-4 h-4 text-[#00FF00] animate-pulse" />
                    <span>SCANNING ARENA TELEMETRY FOR ACTIVE OPERATORS...</span>
                  </div>
                </td>
              </tr>
            ) : filtered.length === 0 ? (
              <tr>
                <td colSpan={4} className="py-8 text-center text-zinc-500 text-xs">
                  {presenceFilter !== 'ALL'
                    ? `No operators found with presence status [${presenceFilter}].`
                    : 'No active operators matching query. Try summoning AlgoArena Bot.'}
                </td>
              </tr>
            ) : (
              filtered.map(op => {
                const isSelf = op.username.toLowerCase() === (currentUsername || '').toLowerCase();
                const normStatus = getNormalizedStatus(op);

                return (
                  <tr
                    key={op.socketId || op.username}
                    className="hover:bg-white/[0.02] transition-colors group"
                  >
                    {/* Operator info */}
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-3">
                        <div className="relative">
                          <div className="w-8 h-8 bg-zinc-900 border border-white/15 flex items-center justify-center font-bold text-xs text-white">
                            {op.isBot ? (
                              <Bot className="w-4 h-4 text-[#00FF00]" />
                            ) : (
                              op.username.slice(0, 2).toUpperCase()
                            )}
                          </div>
                          {/* Corner mini presence dot */}
                          <span 
                            className={`absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full border-2 border-black ${
                              normStatus === 'ONLINE'
                                ? 'bg-[#00FF00] shadow-[0_0_6px_#00FF00]'
                                : normStatus === 'IN-MATCH'
                                ? 'bg-[#F27D26] shadow-[0_0_6px_#F27D26]'
                                : 'bg-amber-400'
                            }`}
                            title={`Presence: ${normStatus}`}
                          />
                        </div>

                        <div>
                          <div className="text-xs font-bold text-white uppercase flex items-center gap-1.5">
                            <span>{op.username}</span>
                            {isSelf && (
                              <span className="bg-[#00FF00] text-black text-[9px] px-1 font-black">
                                YOU
                              </span>
                            )}
                            {op.isBot && (
                              <span className="bg-[#00FF00]/15 border border-[#00FF00]/40 text-[#00FF00] text-[9px] px-1 font-black">
                                BOT
                              </span>
                            )}
                          </div>
                          <div className="text-[10px] text-zinc-500 flex items-center gap-2">
                            <span>Node: US-EAST // Arena 04</span>
                            {normStatus === 'ONLINE' && (
                              <span className="text-[#00FF00] font-bold">● Available</span>
                            )}
                            {normStatus === 'IN-MATCH' && (
                              <span className="text-[#F27D26] font-bold">● Busy in duel</span>
                            )}
                            {normStatus === 'IDLE' && (
                              <span className="text-amber-400 font-bold">● Away</span>
                            )}
                          </div>
                        </div>
                      </div>
                    </td>

                    {/* ELO Rating */}
                    <td className="py-3 px-4 text-center">
                      <div className="text-xs font-bold text-[#F27D26] flex items-center justify-center gap-1">
                        <Trophy className="w-3 h-3 text-[#F27D26]" />
                        <span>{op.elo || 1200} ELO</span>
                      </div>
                    </td>

                    {/* Presence Indicator Column */}
                    <td className="py-3 px-4 text-center">
                      <div className="flex flex-col items-center justify-center gap-1">
                        <OnlineStatusIndicator
                          isOnline={normStatus === 'ONLINE'}
                          status={normStatus}
                          showLabel={true}
                          variant="badge"
                          size="xs"
                        />
                        <span className="text-[9px] text-zinc-500 uppercase">
                          {normStatus === 'ONLINE' 
                            ? 'Ready for Duel' 
                            : normStatus === 'IN-MATCH' 
                            ? 'Engaged in Room' 
                            : 'Inactive / Idle'}
                        </span>
                      </div>
                    </td>

                    {/* Action Column */}
                    <td className="py-3 px-4 text-right">
                      {isSelf ? (
                        <div className="inline-flex items-center gap-2">
                          <button
                            type="button"
                            onClick={toggleMyPresence}
                            className="px-2 py-1 bg-black border border-white/20 hover:border-[#00FF00] text-zinc-300 hover:text-white text-[10px] uppercase font-bold cursor-pointer transition-colors"
                            title="Switch your status to Online or Idle"
                          >
                            SWITCH TO {myPresence === 'online' ? 'IDLE' : 'ONLINE'}
                          </button>
                        </div>
                      ) : normStatus === 'IN-MATCH' ? (
                        <button
                          type="button"
                          onClick={() => handleChallengeClick(op)}
                          className="px-3 py-1 bg-[#F27D26]/10 hover:bg-[#F27D26]/20 border border-[#F27D26]/40 text-[#F27D26] font-bold uppercase text-[10px] tracking-wider transition-all cursor-pointer inline-flex items-center gap-1.5"
                          title="Operator is currently in a duel. Click for details."
                        >
                          <Clock className="w-3 h-3" />
                          <span>IN MATCH</span>
                        </button>
                      ) : normStatus === 'IDLE' ? (
                        <button
                          type="button"
                          onClick={() => handleChallengeClick(op)}
                          className="px-3 py-1 bg-amber-400/10 hover:bg-amber-400/20 border border-amber-400/50 text-amber-400 font-bold uppercase text-[10px] tracking-wider transition-all cursor-pointer inline-flex items-center gap-1.5 shadow-[0_0_8px_rgba(251,191,36,0.15)]"
                          title="Operator is idle. Send duel challenge alert."
                        >
                          <Swords className="w-3 h-3" />
                          <span>INVITE (IDLE)</span>
                        </button>
                      ) : (
                        <button
                          type="button"
                          onClick={() => handleChallengeClick(op)}
                          className="px-3 py-1 bg-[#00FF00]/15 hover:bg-[#00FF00] border border-[#00FF00]/50 hover:border-[#00FF00] text-[#00FF00] hover:text-black font-black uppercase text-[10px] tracking-wider transition-all cursor-pointer inline-flex items-center gap-1.5 shadow-[0_0_10px_rgba(0,255,0,0.15)]"
                          title="Transmit direct 1v1 duel challenge immediately"
                        >
                          <Swords className="w-3 h-3" />
                          <span>CHALLENGE</span>
                        </button>
                      )}
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Footer Details & Real-Time Presence Telemetry */}
      <div className="p-3 bg-black border-t border-white/10 flex flex-col sm:flex-row items-center justify-between gap-2 text-[10px] text-zinc-500">
        <div className="flex items-center gap-4">
          <span className="flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-[#00FF00] animate-pulse" />
            <strong className="text-zinc-300 font-normal">GREEN</strong>: Available for instant challenge
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-[#F27D26]" />
            <strong className="text-zinc-300 font-normal">ORANGE</strong>: Busy in match
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />
            <strong className="text-zinc-300 font-normal">YELLOW</strong>: Idle / Away
          </span>
        </div>
        <span className="text-[#00FF00] font-bold tracking-wider">SOCKET REAL-TIME PRESENCE ACTIVE</span>
      </div>
    </div>
  );
}
