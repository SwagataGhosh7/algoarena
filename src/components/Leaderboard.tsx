import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Trophy, 
  Medal, 
  Flame, 
  TrendingUp, 
  Search, 
  RefreshCw, 
  Crown, 
  Swords, 
  User, 
  ArrowUpRight, 
  Radio, 
  Sparkles, 
  Filter,
  CheckCircle2,
  ChevronRight,
  ShieldAlert
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import clsx from 'clsx';
import { socket } from '../socket';
import { useStore } from '../store';
import { LeaderboardUser, LeaderboardResponse } from '../types';
import { apiUrl } from '../api';
import { OnlineStatusIndicator } from './OnlineStatusIndicator';
import { triggerDirectChallenge } from './DirectChallengeModal';

interface LeaderboardProps {
  embedded?: boolean;
  onClose?: () => void;
}

export function Leaderboard({ embedded = false, onClose }: LeaderboardProps) {
  const navigate = useNavigate();
  const { currentUser, accountProfile } = useStore();

  const [leaderboard, setLeaderboard] = useState<LeaderboardUser[]>([]);
  const [meta, setMeta] = useState<LeaderboardResponse['meta'] | null>(null);
  const [selectedBracket, setSelectedBracket] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isRefreshing, setIsRefreshing] = useState<boolean>(false);
  const [livePulse, setLivePulse] = useState<boolean>(false);
  const [scope, setScope] = useState<'global' | 'friends'>('global');

  const fetchLeaderboard = useCallback(async (showLoadingSpinner = false) => {
    if (showLoadingSpinner) setIsLoading(true);
    setIsRefreshing(true);
    try {
      const params = new URLSearchParams();
      params.set('scope', scope);
      if (selectedBracket !== 'all') params.set('tier', selectedBracket);
      if (searchQuery.trim()) params.set('search', searchQuery.trim());
      if (accountProfile?.username || currentUser?.name) params.set('currentUser', accountProfile?.username || currentUser.name);

      const queryStr = params.toString();
      const targetUrl = apiUrl(`/api/leaderboard?${queryStr}`);
      let res: Response | null = null;
      try {
        res = await fetch(targetUrl);
      } catch (networkErr) {
        if (targetUrl.startsWith('http')) {
          try {
            res = await fetch(`/api/leaderboard?${queryStr}`);
          } catch {
            // ignore fallback error
          }
        }
        if (!res) throw networkErr;
      }

      if (res && res.ok) {
        const data: LeaderboardResponse = await res.json();
        setLeaderboard(data.leaderboard || []);
        setMeta(data.meta);
        setLivePulse(true);
        setTimeout(() => setLivePulse(false), 1200);
      }
    } catch (err) {
      console.warn('Leaderboard update unavailable:', err);
      // Auto-retry once after 1.5s if initial load failed during startup
      if (showLoadingSpinner) {
        setTimeout(() => {
          fetchLeaderboard(false);
        }, 1500);
      }
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, [selectedBracket, searchQuery, scope, accountProfile?.username, currentUser?.name]);

  // Initial fetch and dependency trigger
  useEffect(() => {
    fetchLeaderboard(true);
  }, [fetchLeaderboard]);

  // Real-time listener via Socket.IO + 12s polling fallback
  useEffect(() => {
    const handleLeaderboardUpdate = () => {
      fetchLeaderboard(false);
    };

    socket.on('leaderboard_update', handleLeaderboardUpdate);
    socket.on('online_users_update', handleLeaderboardUpdate);
    const interval = setInterval(() => {
      fetchLeaderboard(false);
    }, 12000);

    return () => {
      socket.off('leaderboard_update', handleLeaderboardUpdate);
      socket.off('online_users_update', handleLeaderboardUpdate);
      clearInterval(interval);
    };
  }, [fetchLeaderboard]);

  // Helper to format rank badge styling
  const getRankBadge = (rank: number) => {
    if (rank === 1) {
      return (
        <div className="w-8 h-8 rounded-none bg-gradient-to-br from-amber-300 to-yellow-500 text-black flex items-center justify-center font-black text-xs shadow-[0_0_12px_rgba(251,191,36,0.5)] border border-amber-200">
          <Crown className="w-4 h-4" />
        </div>
      );
    }
    if (rank === 2) {
      return (
        <div className="w-8 h-8 rounded-none bg-gradient-to-br from-slate-200 to-zinc-400 text-black flex items-center justify-center font-black text-xs shadow-[0_0_10px_rgba(203,213,225,0.4)] border border-white/60">
          <Medal className="w-4 h-4" />
        </div>
      );
    }
    if (rank === 3) {
      return (
        <div className="w-8 h-8 rounded-none bg-gradient-to-br from-amber-600 to-amber-800 text-white flex items-center justify-center font-black text-xs shadow-[0_0_10px_rgba(217,119,6,0.3)] border border-amber-500/50">
          <Medal className="w-4 h-4" />
        </div>
      );
    }
    return (
      <div className="w-8 h-8 rounded-none bg-[#141414] border border-white/10 text-zinc-400 flex items-center justify-center font-mono font-bold text-xs">
        #{rank < 10 ? `0${rank}` : rank}
      </div>
    );
  };

  // Helper for ELO rating badge
  const getEloBadge = (elo: number) => {
    if (elo >= 2000) {
      return (
        <span className="bg-[#00FF00]/15 text-[#00FF00] border border-[#00FF00]/50 px-2 py-0.5 text-[10px] font-mono font-black uppercase tracking-wider shadow-[0_0_8px_rgba(0,255,0,0.2)]">
          {elo} ELO
        </span>
      );
    }
    if (elo >= 1600) {
      return (
        <span className="bg-purple-500/15 text-purple-400 border border-purple-500/40 px-2 py-0.5 text-[10px] font-mono font-black uppercase tracking-wider shadow-[0_0_8px_rgba(168,85,247,0.2)]">
          {elo} ELO
        </span>
      );
    }
    if (elo >= 1200) {
      return (
        <span className="bg-cyan-500/15 text-cyan-400 border border-cyan-500/40 px-2 py-0.5 text-[10px] font-mono font-black uppercase tracking-wider shadow-[0_0_8px_rgba(6,182,212,0.2)]">
          {elo} ELO
        </span>
      );
    }
    return (
      <span className="bg-zinc-800 text-zinc-400 border border-zinc-700 px-2 py-0.5 text-[10px] font-mono font-black uppercase tracking-wider">
        {elo} ELO
      </span>
    );
  };

  // Top 3 Podium Users
  const topThree = leaderboard.slice(0, 3);
  const currentUserEntry = meta?.currentUserStats;

  return (
    <div className={clsx(
      "w-full text-left font-sans selection:bg-[#00FF00]/30",
      embedded ? "p-0" : "max-w-6xl mx-auto py-8 px-4 sm:px-6"
    )}>
      {/* Top Header Controls */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-white/10 pb-5 mb-8">
        <div>
          <div className="flex items-center gap-2 text-[#00FF00] font-mono text-[11px] font-bold uppercase tracking-widest mb-1.5">
            <span className={clsx(
              "w-2 h-2 rounded-full transition-all duration-300",
              livePulse ? "bg-white scale-125 shadow-[0_0_12px_#ffffff]" : "bg-[#00FF00] shadow-[0_0_8px_#00FF00]"
            )} />
            <span>REAL-TIME RANKED LADDER</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black italic uppercase tracking-tighter text-white flex items-center gap-3">
            <Trophy className="w-7 h-7 text-[#00FF00]" />
            {scope === 'global' ? 'GLOBAL LEADERBOARD' : 'FRIENDS LEADERBOARD'}
          </h1>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center border border-white/10 bg-[#0c0c0c] p-0.5 font-mono">
            <button
              onClick={() => setScope('global')}
              className={clsx('px-2.5 py-1.5 text-[10px] font-bold uppercase transition-colors', scope === 'global' ? 'bg-[#00FF00] text-black' : 'text-zinc-400 hover:text-white')}
            >
              GLOBAL
            </button>
            <button
              onClick={() => setScope('friends')}
              className={clsx('px-2.5 py-1.5 text-[10px] font-bold uppercase transition-colors', scope === 'friends' ? 'bg-[#00FF00] text-black' : 'text-zinc-400 hover:text-white')}
            >
              FRIENDS
            </button>
          </div>
          {/* Real-time Indicator pill */}
          <div className="flex items-center gap-2 bg-[#0c0c0c] border border-white/10 px-3 py-1.5 font-mono text-[10px] text-zinc-400 uppercase">
            <Radio className="w-3.5 h-3.5 text-[#00FF00] animate-pulse" />
            <span>SYNCD: <strong className="text-white">{meta?.lastUpdated || 'ACTIVE'}</strong></span>
          </div>

          {/* Manual Refresh Button */}
          <button
            onClick={() => fetchLeaderboard(false)}
            disabled={isRefreshing}
            className="flex items-center gap-2 bg-[#0c0c0c] border border-[#00FF00]/40 hover:border-[#00FF00] text-[#00FF00] px-3.5 py-1.5 font-mono text-xs font-bold uppercase tracking-wider transition-all cursor-pointer disabled:opacity-50"
            title="Refresh current ladder standings"
          >
            <RefreshCw className={clsx("w-3.5 h-3.5", isRefreshing && "animate-spin")} />
            <span>{isRefreshing ? 'SYNCING...' : 'REFRESH'}</span>
          </button>

          {onClose && (
            <button
              onClick={onClose}
              className="bg-zinc-900 border border-white/10 hover:border-white/30 text-zinc-400 hover:text-white px-3 py-1.5 font-mono text-xs uppercase"
            >
              CLOSE
            </button>
          )}
        </div>
      </div>

      {meta && !meta.isEligible && (
        <div className="mb-6 flex items-center gap-3 border border-[#F27D26]/50 bg-[#F27D26]/10 px-4 py-3 font-mono text-xs text-[#F27D26]">
          <ShieldAlert className="w-4 h-4 shrink-0" />
          <span>RANKED ACCESS LOCKED: COMPLETE {Math.max(0, (meta.minimumGames || 5) - (meta.currentUserGames || 0))} MORE GAMES TO JOIN THE {scope === 'global' ? 'GLOBAL' : 'FRIENDS'} LEADERBOARD. ({meta.currentUserGames || 0}/{meta.minimumGames || 5})</span>
        </div>
      )}

      {scope === 'friends' && meta?.isEligible && (meta.friendCount || 0) === 0 && (
        <div className="mb-6 border border-[#00FF00]/30 bg-[#00FF00]/5 px-4 py-3 font-mono text-xs text-zinc-300">
          Add duelists from their profile or during a match to populate your friends leaderboard.
        </div>
      )}

      {/* Top 3 Podium Cards */}
      {selectedBracket === 'all' && !searchQuery.trim() && topThree.length === 3 && (
        <div className="mb-10">
          <div className="flex items-center gap-2 font-mono text-xs uppercase font-bold text-zinc-400 mb-4 tracking-wider">
            <Crown className="w-4 h-4 text-amber-400" />
            <span>TOP 3 ELO PLAYERS</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
            {/* Rank 2 (Left) */}
            <PodiumCard
              user={topThree[1]}
              rank={2}
              badgeColor="border-slate-300/40 bg-slate-400/10 text-slate-200"
              medalIcon={<Medal className="w-4 h-4 text-slate-300" />}
              onNavigate={() => navigate(`/profile/${topThree[1].username}`)}
            />

            {/* Rank 1 (Center - Elevated) */}
            <PodiumCard
              user={topThree[0]}
              rank={1}
              isLeader
              badgeColor="border-amber-400/60 bg-amber-400/15 text-amber-300"
              medalIcon={<Crown className="w-5 h-5 text-amber-400" />}
              onNavigate={() => navigate(`/profile/${topThree[0].username}`)}
            />

            {/* Rank 3 (Right) */}
            <PodiumCard
              user={topThree[2]}
              rank={3}
              badgeColor="border-amber-700/40 bg-amber-700/10 text-amber-400"
              medalIcon={<Medal className="w-4 h-4 text-amber-600" />}
              onNavigate={() => navigate(`/profile/${topThree[2].username}`)}
            />
          </div>
        </div>
      )}

      {/* Current Player Rank Banner (Sticky / Prominent) */}
      {currentUserEntry && (
        <div className="mb-8 p-4 bg-gradient-to-r from-[#00FF00]/10 via-[#0a180a] to-[#0a0a0a] border border-[#00FF00]/50 shadow-[0_0_20px_rgba(0,255,0,0.1)] flex flex-col sm:flex-row sm:items-center justify-between gap-4 font-mono">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-[#00FF00] text-black font-black text-sm flex items-center justify-center shadow-[0_0_12px_rgba(0,255,0,0.4)]">
              #{currentUserEntry.rank}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-white font-black text-sm uppercase tracking-wider">{currentUserEntry.username}</span>
                <span className="bg-[#00FF00] text-black font-black text-[9px] px-1.5 py-0.2 uppercase">YOU</span>
                {getEloBadge(currentUserEntry.elo)}
              </div>
              <p className="text-[11px] text-zinc-400 mt-0.5">
                Rating: <strong className="text-[#00FF00] font-bold">{currentUserEntry.elo} ELO</strong> &bull; Win Rate: <strong className="text-white">{currentUserEntry.winRate}%</strong> &bull; Streak: <strong className="text-[#F27D26]">{currentUserEntry.streak}W</strong>
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="hidden md:flex flex-col text-right text-xs">
              <span className="text-zinc-500 text-[10px] uppercase font-bold">Accuracy</span>
              <span className="text-white font-bold">{currentUserEntry.testAccuracy}%</span>
            </div>
            <button
              onClick={() => navigate(`/profile/${currentUserEntry.username}`)}
              className="px-3.5 py-1.5 bg-[#00FF00] hover:bg-[#00DD00] text-black font-black text-xs uppercase tracking-wider flex items-center gap-1.5 transition-all cursor-pointer shadow-[0_0_12px_rgba(0,255,0,0.3)]"
            >
              <span>VIEW DOSSIER</span>
              <ArrowUpRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      )}

      {/* Filter and Search Controls */}
      <div className="bg-[#0c0c0c] border border-white/10 p-4 mb-6 flex flex-col md:flex-row md:items-center justify-between gap-4 font-mono">
        {/* Rating Bracket Filter Tabs */}
        <div className="flex flex-wrap items-center gap-1.5">
          <span className="text-zinc-500 text-xs mr-2 flex items-center gap-1">
            <Filter className="w-3.5 h-3.5" />
            <span>RATING:</span>
          </span>
          {[
            { id: 'all', label: 'ALL RATINGS' },
            { id: 'elite', label: '2000+ ELO' },
            { id: 'advanced', label: '1600 - 1999' },
            { id: 'intermediate', label: '1200 - 1599' },
            { id: 'novice', label: '< 1200' },
          ].map(bracket => (
            <button
              key={bracket.id}
              onClick={() => setSelectedBracket(bracket.id)}
              className={clsx(
                "px-2.5 py-1 text-xs font-bold uppercase transition-all cursor-pointer border",
                selectedBracket === bracket.id
                  ? "bg-[#00FF00] text-black border-[#00FF00] shadow-[0_0_10px_rgba(0,255,0,0.3)]"
                  : "bg-black text-zinc-400 border-white/10 hover:border-white/30 hover:text-white"
              )}
            >
              {bracket.label}
            </button>
          ))}
        </div>

        {/* Search Player Handle */}
        <div className="relative w-full md:w-64">
          <Search className="w-4 h-4 text-zinc-500 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search player handle..."
            className="w-full bg-black border border-white/15 pl-9 pr-3 py-1.5 text-xs text-white placeholder:text-zinc-600 outline-none focus:border-[#00FF00] transition-colors"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-white text-xs"
            >
              &times;
            </button>
          )}
        </div>
      </div>

      {/* Main Leaderboard Table */}
      <div className="border border-white/10 bg-[#080808] overflow-x-auto shadow-2xl">
        <table className="w-full text-left font-mono text-xs border-collapse">
          <thead>
            <tr className="border-b border-white/10 bg-[#101010] text-zinc-500 text-[10px] uppercase tracking-wider font-bold">
              <th className="py-3 px-4 w-16 text-center">RANK</th>
              <th className="py-3 px-4">PLAYER</th>
              <th className="py-3 px-4 text-right">RATING (ELO)</th>
              <th className="py-3 px-4 text-center">RECORD</th>
              <th className="py-3 px-4 text-right">WIN RATE</th>
              <th className="py-3 px-4 text-center">STREAK</th>
              <th className="py-3 px-4 text-right">ACCURACY</th>
              <th className="py-3 px-4 text-center">CORE LANG</th>
              <th className="py-3 px-4 text-right">DOSSIER</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/5">
            {isLoading ? (
              <tr>
                <td colSpan={9} className="py-16 text-center text-zinc-500">
                  <div className="flex flex-col items-center justify-center gap-3">
                    <RefreshCw className="w-6 h-6 animate-spin text-[#00FF00]" />
                    <span className="text-xs uppercase font-bold tracking-widest text-zinc-400">
                      SYNCHRONIZING GLOBAL LADDER PROTOCOL...
                    </span>
                  </div>
                </td>
              </tr>
            ) : leaderboard.length === 0 ? (
              <tr>
                <td colSpan={9} className="py-14 text-center text-zinc-500">
                  <p className="text-sm font-bold uppercase text-zinc-400">NO PLAYERS MATCH CRITERIA</p>
                  <p className="text-xs text-zinc-600 mt-1">Try resetting the rating filter or searching another handle.</p>
                </td>
              </tr>
            ) : (
              leaderboard.map((user) => {
                const isCurrent = user.isCurrentUser || (currentUser && user.username.toLowerCase() === currentUser.name.toLowerCase());
                return (
                  <tr
                    key={user.username}
                    onClick={() => navigate(`/profile/${user.username}`)}
                    className={clsx(
                      "transition-colors cursor-pointer group hover:bg-white/[0.04]",
                      isCurrent ? "bg-[#00FF00]/5 border-l-2 border-l-[#00FF00]" : ""
                    )}
                  >
                    {/* Rank */}
                    <td className="py-3 px-4 text-center">
                      <div className="flex justify-center">
                        {getRankBadge(user.rank)}
                      </div>
                    </td>

                    {/* Operator Handle & Status */}
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-3">
                        <div className="relative">
                          <div className={clsx(
                            "w-8 h-8 rounded-none flex items-center justify-center font-bold text-xs uppercase border",
                            isCurrent 
                              ? "bg-[#00FF00]/20 border-[#00FF00] text-[#00FF00]" 
                              : "bg-zinc-900 border-white/10 text-zinc-300"
                          )}>
                            {user.username.slice(0, 2)}
                          </div>
                          <div className="absolute -bottom-1 -right-1">
                            <OnlineStatusIndicator
                              isOnline={user.isOnline}
                              status={user.status}
                              size="sm"
                            />
                          </div>
                        </div>

                        <div>
                          <div className="flex items-center gap-2">
                            <span className={clsx(
                              "font-bold text-sm tracking-wide transition-colors",
                              isCurrent ? "text-[#00FF00]" : "text-white group-hover:text-[#00FF00]"
                            )}>
                              {user.username}
                            </span>
                            {isCurrent && (
                              <span className="bg-[#00FF00] text-black font-black text-[9px] px-1 py-0.2 uppercase">
                                YOU
                              </span>
                            )}
                          </div>
                          <div className="text-[10px] text-zinc-500 uppercase flex items-center gap-1.5 mt-0.5">
                            <OnlineStatusIndicator
                              isOnline={user.isOnline}
                              status={user.status}
                              showLabel={true}
                              size="xs"
                            />
                          </div>
                        </div>
                      </div>
                    </td>

                    {/* ELO Rating & Trend */}
                    <td className="py-3 px-4 text-right">
                      <div className="font-bold text-sm text-white">{user.elo}</div>
                      <div className={clsx(
                        "text-[10px] font-bold flex items-center justify-end gap-0.5",
                        user.recentDelta.startsWith('+') ? "text-[#00FF00]" : "text-red-400"
                      )}>
                        <TrendingUp className="w-2.5 h-2.5" />
                        <span>{user.recentDelta} ELO</span>
                      </div>
                    </td>

                    {/* Record */}
                    <td className="py-3 px-4 text-center">
                      <div className="text-xs text-zinc-300">
                        <span className="text-[#00FF00] font-bold">{user.wins}W</span>
                        <span className="text-zinc-600 mx-1">-</span>
                        <span className="text-zinc-400">{user.losses}L</span>
                      </div>
                      <div className="w-16 h-1 bg-zinc-800 mx-auto mt-1 overflow-hidden">
                        <div 
                          className="h-full bg-[#00FF00]" 
                          style={{ width: `${user.winRate}%` }}
                        />
                      </div>
                    </td>

                    {/* Win Rate */}
                    <td className="py-3 px-4 text-right font-bold text-zinc-200">
                      {user.winRate}%
                    </td>

                    {/* Streak */}
                    <td className="py-3 px-4 text-center">
                      {user.streak > 0 ? (
                        <span className="inline-flex items-center gap-1 text-[#F27D26] font-bold text-xs bg-[#F27D26]/10 px-2 py-0.5 border border-[#F27D26]/30">
                          <Flame className="w-3 h-3 text-[#F27D26]" />
                          <span>{user.streak}W</span>
                        </span>
                      ) : (
                        <span className="text-zinc-600 text-xs">-</span>
                      )}
                    </td>

                    {/* Test Accuracy */}
                    <td className="py-3 px-4 text-right text-zinc-300 font-bold">
                      {user.testAccuracy}%
                    </td>

                    {/* Core Lang */}
                    <td className="py-3 px-4 text-center">
                      <span className="bg-black border border-white/10 text-zinc-400 px-2 py-0.5 text-[10px] font-bold uppercase">
                        {user.primaryLanguage}
                      </span>
                    </td>

                    {/* Actions: Challenge & Dossier Link */}
                    <td className="py-3 px-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        {!isCurrent && (
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              triggerDirectChallenge(user.username, undefined, user.elo);
                            }}
                            className="px-2 py-0.5 bg-[#00FF00]/10 hover:bg-[#00FF00] border border-[#00FF00]/40 text-[#00FF00] hover:text-black font-black uppercase text-[9px] tracking-wider transition-all cursor-pointer inline-flex items-center gap-1"
                            title={`Send direct duel challenge to ${user.username}`}
                          >
                            <Swords className="w-2.5 h-2.5" />
                            <span>CHALLENGE</span>
                          </button>
                        )}
                        <span className="text-zinc-600 group-hover:text-[#00FF00] inline-flex items-center gap-1 text-[11px] font-bold uppercase transition-colors">
                          <span>DOSSIER</span>
                          <ChevronRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
                        </span>
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Ladder Rules & Meta Footer */}
      <div className="mt-6 flex flex-col sm:flex-row items-center justify-between gap-4 text-zinc-500 font-mono text-[11px] border-t border-white/10 pt-4">
        <div className="flex items-center gap-4">
          <span>RATING BRACKETS: ELITE &ge; 2000 ELO &bull; ADVANCED &ge; 1600 ELO &bull; INTERMEDIATE &ge; 1200 ELO</span>
        </div>
        <div className="flex items-center gap-2">
          <span>SEASON ENDS: <strong className="text-white">{meta?.seasonEndsIn || '14 DAYS'}</strong></span>
        </div>
      </div>
    </div>
  );
}

// Podium Sub-Component for Top 3 Duelists
interface PodiumCardProps {
  user: LeaderboardUser;
  rank: number;
  isLeader?: boolean;
  badgeColor: string;
  medalIcon: React.ReactNode;
  onNavigate: () => void;
}

function PodiumCard({ user, rank, isLeader = false, badgeColor, medalIcon, onNavigate }: PodiumCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: rank * 0.1 }}
      onClick={onNavigate}
      className={clsx(
        "bg-[#0a0a0a] border text-left p-5 cursor-pointer group transition-all relative overflow-hidden font-mono",
        isLeader 
          ? "border-amber-400/60 shadow-[0_0_30px_rgba(251,191,36,0.15)] md:-translate-y-2" 
          : "border-white/10 hover:border-white/30"
      )}
    >
      {/* Background Accent glow */}
      {isLeader && (
        <div className="absolute top-0 right-0 w-32 h-32 bg-amber-400/5 rounded-full blur-2xl pointer-events-none" />
      )}

      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-2.5">
          <div className={clsx("w-8 h-8 flex items-center justify-center font-black text-xs border", badgeColor)}>
            {medalIcon}
          </div>
          <div>
            <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">
              RANK #{rank}
            </span>
            <h3 className="text-base font-black uppercase text-white group-hover:text-[#00FF00] transition-colors">
              {user.username}
            </h3>
          </div>
        </div>

        <span className="bg-[#00FF00]/15 text-[#00FF00] border border-[#00FF00]/40 text-[9px] px-2 py-0.5 font-bold uppercase font-mono">
          {user.elo} ELO
        </span>
      </div>

      <div className="grid grid-cols-3 gap-2 border-t border-b border-white/5 py-3 my-3 text-center">
        <div>
          <span className="text-[9px] text-zinc-500 uppercase font-bold block">Rating</span>
          <span className="text-white font-black text-sm">{user.elo}</span>
        </div>
        <div>
          <span className="text-[9px] text-zinc-500 uppercase font-bold block">Win Rate</span>
          <span className="text-[#00FF00] font-black text-sm">{user.winRate}%</span>
        </div>
        <div>
          <span className="text-[9px] text-zinc-500 uppercase font-bold block">Streak</span>
          <span className="text-[#F27D26] font-black text-sm">{user.streak}W</span>
        </div>
      </div>

      <div className="flex items-center justify-between text-[11px] text-zinc-400 pt-1">
        <span className="flex items-center gap-1.5">
          <span className={clsx(
            "w-1.5 h-1.5 rounded-full",
            user.status === 'IN DUEL' ? "bg-amber-400 shadow-[0_0_6px_#fbbf24]" : "bg-[#00FF00]"
          )} />
          <span className="uppercase text-[10px]">{user.status}</span>
        </span>
        <span className="text-zinc-500 group-hover:text-[#00FF00] flex items-center gap-0.5 uppercase text-[10px] font-bold transition-colors">
          <span>INSPECT</span>
          <ArrowUpRight className="w-3 h-3" />
        </span>
      </div>
    </motion.div>
  );
}
