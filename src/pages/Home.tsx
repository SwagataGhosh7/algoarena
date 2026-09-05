import { useNavigate } from 'react-router-dom';
import { useStore } from '../store';
import { v4 as uuidv4 } from 'uuid';
import { Swords, User, Trophy, Zap, Terminal, Activity } from 'lucide-react';
import { motion } from 'motion/react';

export function Home() {
  const navigate = useNavigate();
  const { currentUser } = useStore();

  const handleQuickMatch = () => {
    const roomId = uuidv4().substring(0, 8);
    navigate(`/room/${roomId}`);
  };

  const handleCreatePrivate = () => {
    const roomId = uuidv4().substring(0, 8);
    navigate(`/room/${roomId}`);
  };

  return (
    <div className="min-h-screen bg-[#050505] text-[#e0e0e0] font-sans selection:bg-[#00FF00]/30 flex flex-col justify-between">
      {/* Top Navbar */}
      <nav className="h-14 border-b border-[#00FF00]/30 flex items-center justify-between px-6 bg-[#0a0a0a] shrink-0">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 bg-[#00FF00] flex items-center justify-center text-black font-black text-xs shadow-[0_0_12px_rgba(0,255,0,0.4)]">
              <Terminal className="w-4 h-4" />
            </div>
            <span className="text-[#00FF00] font-black text-xl tracking-tighter uppercase">
              ALGOARENA // LADDER
            </span>
          </div>
          <span className="hidden sm:inline-block bg-[#00FF00]/10 text-[#00FF00] text-[10px] px-2 py-0.5 border border-[#00FF00]/30 font-mono uppercase font-bold">
            Status: OPERATIONAL
          </span>
        </div>

        <div className="flex items-center gap-6">
          <div className="hidden md:flex items-center gap-2">
            <span className="text-[10px] text-zinc-500 font-bold uppercase tracking-widest">Global Status</span>
            <span className="font-mono text-[#F27D26] text-xs font-bold uppercase">1,420 LIVE DUELS</span>
          </div>
          <button 
            onClick={() => navigate(`/profile/${currentUser.name.replace(' ', '')}`)}
            className="flex items-center gap-2 bg-[#080808] border border-[#00FF00]/30 px-3 py-1.5 cursor-pointer hover:border-[#00FF00] hover:bg-[#00FF00]/10 transition-all group"
          >
            <User className="w-3.5 h-3.5 text-[#00FF00] group-hover:scale-110 transition-transform" />
            <span className="text-xs font-mono font-bold uppercase tracking-wider text-zinc-200 group-hover:text-white">
              {currentUser.name}
            </span>
            <span className="text-[10px] text-[#F27D26] font-mono font-bold">[GOLD II]</span>
          </button>
        </div>
      </nav>

      {/* Main Hero and Action Grid */}
      <main className="max-w-6xl mx-auto px-6 py-12 flex flex-col justify-center items-center text-center flex-1 w-full">
        <motion.div 
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="mb-6 flex items-center gap-2 text-[#00FF00] bg-[#00FF00]/10 border border-[#00FF00]/30 px-3 py-1 font-mono text-[11px] font-bold uppercase tracking-widest"
        >
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#00FF00] opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-[#00FF00]"></span>
          </span>
          SEASON 04 // REAL-TIME DUEL ARENA
        </motion.div>

        <motion.h1 
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.1 }}
          className="text-6xl sm:text-7xl md:text-8xl font-black italic uppercase tracking-tighter leading-none mb-6 text-white"
        >
          CODE. <span className="text-[#00FF00] drop-shadow-[0_0_25px_rgba(0,255,0,0.3)]">COMPETE.</span> CONQUER.
        </motion.h1>
        
        <motion.p 
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.2 }}
          className="text-xs sm:text-sm text-zinc-400 font-mono uppercase tracking-wider max-w-2xl mx-auto mb-14 leading-relaxed"
        >
          Real-time 1v1 developer battles with dynamic AI problem synthesis, live delta telemetry, and instant test case execution.
        </motion.p>

        <motion.div 
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.3 }}
          className="grid grid-cols-1 md:grid-cols-3 gap-5 w-full max-w-4xl"
        >
          <ActionCard 
            badge="RANKED LADDER"
            icon={<Swords className="w-6 h-6 text-[#00FF00]" />}
            title="Quick Match 1v1"
            description="Enter the matchmaking queue against an opponent with equivalent ELO rating."
            actionText="ENTER QUEUE // READY"
            onClick={handleQuickMatch}
            primary
          />
          <ActionCard 
            badge="CUSTOM LOBBY"
            icon={<Zap className="w-6 h-6 text-[#F27D26]" />}
            title="Create Private Room"
            description="Generate a custom room key, customize problem category, and challenge a friend."
            actionText="INITIALIZE ROOM"
            onClick={handleCreatePrivate}
          />
          <ActionCard 
            badge="GLOBAL RANKING"
            icon={<Trophy className="w-6 h-6 text-zinc-500" />}
            title="Global Leaderboard"
            description="Examine worldwide standings, top grandmasters, and win-streak records."
            actionText="VIEW STANDINGS"
            onClick={() => {}}
            disabled
          />
        </motion.div>
      </main>

      {/* Telemetry Footer */}
      <footer className="h-10 bg-[#050505] border-t border-white/10 flex items-center px-6 text-[10px] font-bold text-zinc-600 justify-between uppercase tracking-widest font-mono shrink-0">
        <div className="flex gap-6">
          <span className="flex items-center gap-1.5"><Activity className="w-3 h-3 text-[#00FF00]" /> Region: US-EAST-1</span>
          <span className="hidden sm:inline">Latency: 22ms</span>
          <span className="hidden md:inline">Engine: GEMINI-3.1-PRO</span>
        </div>
        <div>
          PROVISIONED BY GEMINI-ARENA-CORE // VERSION 1.0.4
        </div>
      </footer>
    </div>
  );
}

function ActionCard({ icon, badge, title, description, actionText, onClick, primary = false, disabled = false }: any) {
  return (
    <div 
      onClick={disabled ? undefined : onClick}
      className={`
        relative p-6 text-left transition-all duration-200 flex flex-col justify-between
        ${disabled ? 'opacity-40 cursor-not-allowed border border-white/5 bg-[#080808]' : 'cursor-pointer'}
        ${primary 
          ? 'border border-[#00FF00]/40 bg-[#0a0a0a] hover:border-[#00FF00] hover:shadow-[0_0_25px_rgba(0,255,0,0.2)]' 
          : 'border border-white/10 bg-[#080808] hover:border-white/30 hover:bg-[#0c0c0c]'}
      `}
    >
      <div>
        <div className="flex items-center justify-between mb-4">
          <div className="w-12 h-12 bg-black border border-white/10 flex items-center justify-center">
            {icon}
          </div>
          <span className={`text-[10px] font-mono font-bold tracking-widest uppercase px-2 py-0.5 border ${
            primary ? 'bg-[#00FF00]/10 text-[#00FF00] border-[#00FF00]/30' : 'bg-zinc-900 text-zinc-500 border-white/5'
          }`}>
            {badge}
          </span>
        </div>
        <h3 className="text-xl font-black uppercase italic tracking-tight text-white mb-2">{title}</h3>
        <p className="text-xs text-zinc-400 font-mono leading-relaxed">{description}</p>
      </div>

      <div className="mt-6 pt-4 border-t border-white/5">
        <div className={`text-[11px] font-black tracking-widest uppercase flex items-center justify-between ${
          primary ? 'text-[#00FF00]' : 'text-zinc-400'
        }`}>
          <span>{actionText}</span>
          <span className="font-mono">→</span>
        </div>
      </div>
      
      {primary && (
        <div className="absolute top-0 right-0 w-24 h-24 bg-[#00FF00]/5 blur-[40px] -z-10"></div>
      )}
    </div>
  );
}
