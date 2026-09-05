import { useNavigate } from 'react-router-dom';
import { Terminal, ArrowLeft, User, Trophy } from 'lucide-react';
import { Leaderboard } from '../components/Leaderboard';
import { useStore } from '../store';

export function LeaderboardPage() {
  const navigate = useNavigate();
  const { currentUser } = useStore();

  return (
    <div className="min-h-screen bg-[#050505] text-[#e0e0e0] font-sans selection:bg-[#00FF00]/30 flex flex-col justify-between">
      {/* Top Navbar */}
      <nav className="h-14 border-b border-[#00FF00]/30 flex items-center justify-between px-6 bg-[#0a0a0a] shrink-0">
        <div className="flex items-center gap-4">
          <button
            onClick={() => navigate('/')}
            className="flex items-center gap-2 text-zinc-400 hover:text-white font-mono text-xs uppercase cursor-pointer transition-colors"
          >
            <ArrowLeft className="w-4 h-4 text-[#00FF00]" />
            <span>RETURN TO ARENA</span>
          </button>
          <div className="h-4 w-px bg-white/10 hidden sm:block" />
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 bg-[#00FF00] flex items-center justify-center text-black font-black text-xs shadow-[0_0_12px_rgba(0,255,0,0.4)]">
              <Trophy className="w-4 h-4" />
            </div>
            <span className="text-[#00FF00] font-black text-xl tracking-tighter uppercase">
              ALGOARENA // STANDINGS
            </span>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <button 
            onClick={() => navigate(`/profile/${currentUser.name.replace(' ', '')}`)}
            className="flex items-center gap-2 bg-[#080808] border border-[#00FF00]/30 px-3 py-1.5 cursor-pointer hover:border-[#00FF00] hover:bg-[#00FF00]/10 transition-all group"
          >
            <User className="w-3.5 h-3.5 text-[#00FF00] group-hover:scale-110 transition-transform" />
            <span className="text-xs font-mono font-bold uppercase tracking-wider text-zinc-200 group-hover:text-white">
              {currentUser.name}
            </span>
          </button>
        </div>
      </nav>

      {/* Main Content */}
      <main className="flex-1 w-full max-w-6xl mx-auto px-4 sm:px-6 py-6">
        <Leaderboard />
      </main>

      {/* Footer */}
      <footer className="h-12 border-t border-white/10 flex items-center justify-between px-6 bg-[#0a0a0a] text-zinc-500 font-mono text-[10px] uppercase shrink-0">
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 bg-[#00FF00] rounded-none animate-pulse"></span>
          <span>SEASON 04 RANKING ENGINE // REAL-TIME PERSISTENCE</span>
        </div>
        <div>
          <span>ALGOARENA GLOBAL RANKED STANDINGS</span>
        </div>
      </footer>
    </div>
  );
}
