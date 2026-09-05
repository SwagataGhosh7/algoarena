import { useState, useEffect } from 'react';
import { Swords, Users, Zap, CheckCircle2, Radio, ArrowUpRight, Activity } from 'lucide-react';
import { motion } from 'motion/react';
import { socket } from '../socket';
import { apiUrl } from '../api';

interface MatchEvent {
  id: string;
  time: string;
  winner: string;
  loser?: string;
  problem: string;
  eloChange: string;
  tests: string;
}

export function GlobalActivity() {
  const [activeBattles, setActiveBattles] = useState<number>(0);
  const [onlineUsers, setOnlineUsers] = useState<number>(1);
  const [submissionsPerMin, setSubmissionsPerMin] = useState<number>(0);
  const [solveRate, setSolveRate] = useState<number>(0);
  const [recentEvents, setRecentEvents] = useState<MatchEvent[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchGlobalTelemetry = async () => {
    try {
      const res = await fetch(apiUrl('/api/global-activity'));
      if (res.ok) {
        const data = await res.json();
        setActiveBattles(data.activeBattles ?? 0);
        setOnlineUsers(data.onlineUsers ?? 1);
        setSubmissionsPerMin(data.submissionsPerMin ?? 0);
        setSolveRate(data.solveRate ?? 0);
        setRecentEvents(data.recentEvents || []);
      }
    } catch (err) {
      console.error('Telemetry fetch error:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchGlobalTelemetry();
    const interval = setInterval(fetchGlobalTelemetry, 5000);

    const handleUpdate = () => {
      fetchGlobalTelemetry();
    };

    socket.on('global_telemetry_update', handleUpdate);
    socket.on('leaderboard_update', handleUpdate);

    return () => {
      clearInterval(interval);
      socket.off('global_telemetry_update', handleUpdate);
      socket.off('leaderboard_update', handleUpdate);
    };
  }, []);

  return (
    <section className="w-full max-w-4xl mx-auto my-10 text-left font-mono">
      {/* Section Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-white/10 pb-3 mb-5">
        <div className="flex items-center gap-3">
          <span className="w-2.5 h-2.5 bg-[#00FF00] rounded-none animate-pulse shadow-[0_0_8px_#00FF00]"></span>
          <h2 className="text-xs sm:text-sm font-black text-white uppercase tracking-widest">
            GLOBAL ACTIVITY // REAL-TIME TELEMETRY
          </h2>
          <span className="bg-[#00FF00]/10 text-[#00FF00] text-[9px] px-2 py-0.5 border border-[#00FF00]/30 uppercase font-black">
            AUTHENTIC BROADCAST NODE
          </span>
        </div>
        <div className="flex items-center gap-4 text-[10px] text-zinc-500 uppercase font-bold">
          <span className="flex items-center gap-1.5">
            <Radio className="w-3 h-3 text-[#00FF00] animate-pulse" />
            POLLING: REAL-TIME SECURE SOCKET
          </span>
        </div>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-5">
        {/* Metric 1: Active Battles */}
        <div className="bg-[#080808] border border-white/10 p-4 relative overflow-hidden transition-all hover:border-[#00FF00]/40 group">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[10px] text-zinc-500 font-bold uppercase tracking-widest">
              ACTIVE BATTLES
            </span>
            <div className="w-7 h-7 bg-black border border-white/10 flex items-center justify-center group-hover:border-[#00FF00]/50 transition-colors">
              <Swords className="w-3.5 h-3.5 text-[#00FF00]" />
            </div>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl sm:text-4xl font-black tracking-tight text-white">
              {activeBattles}
            </span>
            <span className="text-[10px] font-bold text-[#00FF00] uppercase">
              {activeBattles > 0 ? 'LIVE DUELS' : 'STANDBY'}
            </span>
          </div>
          <div className="mt-2 text-[10px] text-zinc-500 uppercase flex items-center justify-between border-t border-white/5 pt-2">
            <span>SOCKET ROOMS</span>
            <span className="text-zinc-400 font-bold">{activeBattles} ACTIVE</span>
          </div>
        </div>

        {/* Metric 2: Online Users */}
        <div className="bg-[#080808] border border-white/10 p-4 relative overflow-hidden transition-all hover:border-[#00FF00]/40 group">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[10px] text-zinc-500 font-bold uppercase tracking-widest">
              ONLINE OPERATORS
            </span>
            <div className="w-7 h-7 bg-black border border-white/10 flex items-center justify-center group-hover:border-[#00FF00]/50 transition-colors">
              <Users className="w-3.5 h-3.5 text-[#00FF00]" />
            </div>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl sm:text-4xl font-black tracking-tight text-white">
              {onlineUsers}
            </span>
            <span className="text-[10px] font-bold text-[#00FF00] uppercase">
              CONNECTED
            </span>
          </div>
          <div className="mt-2 text-[10px] text-zinc-500 uppercase flex items-center justify-between border-t border-white/5 pt-2">
            <span>NETWORK</span>
            <span className="text-[#00FF00] font-bold">STABLE</span>
          </div>
        </div>

        {/* Metric 3: Submissions */}
        <div className="bg-[#080808] border border-white/10 p-4 relative overflow-hidden transition-all hover:border-[#00FF00]/40 group">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[10px] text-zinc-500 font-bold uppercase tracking-widest">
              EVALUATIONS / MIN
            </span>
            <div className="w-7 h-7 bg-black border border-white/10 flex items-center justify-center group-hover:border-[#00FF00]/50 transition-colors">
              <Zap className="w-3.5 h-3.5 text-[#F27D26]" />
            </div>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl sm:text-4xl font-black tracking-tight text-white">
              {submissionsPerMin}
            </span>
            <span className="text-[10px] font-bold text-[#F27D26] uppercase">
              TEST RUNS
            </span>
          </div>
          <div className="mt-2 text-[10px] text-zinc-500 uppercase flex items-center justify-between border-t border-white/5 pt-2">
            <span>GEMINI ENGINE</span>
            <span className="text-zinc-400 font-bold">READY</span>
          </div>
        </div>

        {/* Metric 4: Solve Rate */}
        <div className="bg-[#080808] border border-white/10 p-4 relative overflow-hidden transition-all hover:border-[#00FF00]/40 group">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[10px] text-zinc-500 font-bold uppercase tracking-widest">
              SYSTEM PASS RATE
            </span>
            <div className="w-7 h-7 bg-black border border-white/10 flex items-center justify-center">
              <CheckCircle2 className="w-3.5 h-3.5 text-[#00FF00]" />
            </div>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl sm:text-4xl font-black tracking-tight text-white">
              {solveRate > 0 ? `${solveRate}%` : '---'}
            </span>
            <span className="text-[10px] font-bold text-[#00FF00] uppercase">
              {solveRate > 0 ? 'ACCURATE' : 'CALIBRATING'}
            </span>
          </div>
          <div className="mt-2 text-[10px] text-zinc-500 uppercase flex items-center justify-between border-t border-white/5 pt-2">
            <span>REAL TELEMETRY</span>
            <span className="text-zinc-400 font-bold">UNMOCKED</span>
          </div>
        </div>
      </div>

      {/* Live Resolved Duels Ticker Feed */}
      <div className="bg-[#080808] border border-white/10 p-4">
        <div className="flex items-center justify-between mb-3 border-b border-white/5 pb-2">
          <div className="flex items-center gap-2 text-[10px] font-black text-zinc-400 uppercase tracking-widest">
            <Activity className="w-3.5 h-3.5 text-[#00FF00]" />
            <span>AUTHENTIC COMBAT RESOLUTION FEED</span>
          </div>
          <span className="text-[9px] text-zinc-600 uppercase font-bold">REAL COMBAT EVENTS ONLY</span>
        </div>

        <div className="space-y-2 text-[11px]">
          {recentEvents.length === 0 ? (
            <div className="py-6 text-center text-zinc-500 uppercase text-[11px] border border-dashed border-white/10 p-4">
              <p className="font-bold text-zinc-400 mb-1">AWAITING REAL COMBAT RESOLUTIONS</p>
              <p className="text-[10px] text-zinc-600">
                No simulated match events. Enter the Arena and submit your code to register real telemetry in this global broadcast feed.
              </p>
            </div>
          ) : (
            recentEvents.map((evt, idx) => (
              <motion.div
                key={evt.id}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.3 }}
                className={`flex flex-col sm:flex-row sm:items-center justify-between gap-1.5 p-2.5 border ${
                  idx === 0 
                    ? 'bg-black/80 border-[#00FF00]/30 shadow-[0_0_10px_rgba(0,255,0,0.08)]' 
                    : 'bg-black/40 border-white/5'
                }`}
              >
                <div className="flex items-center gap-2.5 flex-wrap">
                  <span className="text-zinc-600 text-[10px]">[{evt.time}]</span>
                  <span className="text-white font-black uppercase">{evt.winner}</span>
                  <span className="text-[#00FF00] text-[10px] font-bold">RESOLVED</span>
                  {evt.loser && <span className="text-zinc-400 uppercase">VS {evt.loser}</span>}
                  <span className="text-zinc-600">•</span>
                  <span className="text-zinc-300 italic">"{evt.problem}"</span>
                </div>
                <div className="flex items-center gap-3 self-end sm:self-auto">
                  <span className="text-[10px] text-zinc-500 font-bold">TESTS: {evt.tests}</span>
                  <span className="bg-[#00FF00]/10 text-[#00FF00] text-[10px] px-1.5 py-0.5 border border-[#00FF00]/30 font-black">
                    {evt.eloChange}
                  </span>
                </div>
              </motion.div>
            ))
          )}
        </div>
      </div>
    </section>
  );
}
