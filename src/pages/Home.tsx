import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useStore } from '../store';
import { v4 as uuidv4 } from 'uuid';
import { 
  Swords, 
  User, 
  Trophy, 
  Zap, 
  Terminal, 
  Activity, 
  Bot, 
  Sparkles, 
  X, 
  ChevronRight, 
  Code2, 
  Radio,
  LogIn,
  LogOut,
  ShieldCheck,
  Edit3
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { GlobalActivity } from '../components/GlobalActivity';
import { Leaderboard } from '../components/Leaderboard';
import { LobbyOperatorsList } from '../components/LobbyOperatorsList';
import { ConnectionStatus } from '../components/ConnectionStatus';
import { SoundToggle } from '../components/SoundToggle';

export function Home() {
  const navigate = useNavigate();
  const { 
    currentUser, 
    accountProfile, 
    setAuthModalOpen, 
    logout, 
    setProfileSetupOpen 
  } = useStore();
  const [showPracticeModal, setShowPracticeModal] = useState(false);
  const [practiceTopic, setPracticeTopic] = useState('Dynamic Programming');
  const [practiceDiff, setPracticeDiff] = useState<'easy' | 'medium' | 'hard'>('medium');
  const [practiceLang, setPracticeLang] = useState('c');
  const [activeFeedTab, setActiveFeedTab] = useState<'leaderboard' | 'telemetry' | 'operators'>('leaderboard');

  const handleQuickMatch = () => {
    const roomId = uuidv4().substring(0, 8);
    navigate(`/room/${roomId}`);
  };

  const handleCreatePrivate = () => {
    const roomId = uuidv4().substring(0, 8);
    navigate(`/room/${roomId}`);
  };

  const startPracticeDuel = () => {
    const roomId = `practice-${uuidv4().substring(0, 6)}`;
    navigate(`/room/${roomId}?mode=practice&bot=algoarena&topic=${encodeURIComponent(practiceTopic)}&diff=${practiceDiff}&lang=${practiceLang}`);
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
          <ConnectionStatus />
          <SoundToggle />
        </div>

        <div className="flex items-center gap-3">
          <button 
            onClick={() => {
              setActiveFeedTab('leaderboard');
              const el = document.getElementById('rankings-feed');
              if (el) el.scrollIntoView({ behavior: 'smooth' });
            }}
            className="flex items-center gap-1.5 bg-[#080808] border border-white/15 hover:border-[#00FF00] px-3 py-1.5 cursor-pointer transition-all group font-mono text-xs font-bold uppercase text-zinc-300 hover:text-white"
          >
            <Trophy className="w-3.5 h-3.5 text-[#00FF00] group-hover:scale-110 transition-transform" />
            <span className="hidden sm:inline">LEADERBOARD</span>
          </button>

          {accountProfile ? (
            <div className="flex items-center gap-2">
              <button 
                onClick={() => navigate(`/profile/${accountProfile?.username || currentUser.name.replace(' ', '')}`)}
                className="flex items-center gap-2 bg-[#080808] border border-[#00FF00]/40 px-3 py-1.5 cursor-pointer hover:border-[#00FF00] hover:bg-[#00FF00]/10 transition-all group font-mono text-xs"
              >
                {accountProfile?.photoURL ? (
                  <img
                    src={accountProfile.photoURL}
                    alt={accountProfile.username}
                    referrerPolicy="no-referrer"
                    className="w-4 h-4 rounded-none object-cover border border-[#00FF00]"
                  />
                ) : (
                  <User className="w-3.5 h-3.5 text-[#00FF00] group-hover:scale-110 transition-transform" />
                )}
                <span className="font-bold uppercase tracking-wider text-zinc-200 group-hover:text-white">
                  {accountProfile?.username || currentUser.name}
                </span>
                {accountProfile?.nationality && (
                  <span className="text-[10px] text-zinc-500 font-mono hidden md:inline">
                    [{accountProfile.nationality}]
                  </span>
                )}
              </button>

              <button
                onClick={() => setProfileSetupOpen(true)}
                title="Edit Profile Settings"
                className="p-1.5 bg-black border border-white/15 hover:border-[#00FF00] text-zinc-400 hover:text-[#00FF00] transition-colors cursor-pointer"
              >
                <Edit3 className="w-3.5 h-3.5" />
              </button>

              <button
                onClick={() => logout()}
                title="Sign Out"
                className="p-1.5 bg-black border border-white/15 hover:border-red-500 text-zinc-400 hover:text-red-400 transition-colors cursor-pointer"
              >
                <LogOut className="w-3.5 h-3.5" />
              </button>
            </div>
          ) : (
            <button
              onClick={() => setAuthModalOpen(true)}
              className="flex items-center gap-2 px-3 py-1.5 bg-[#00FF00] text-black font-mono text-xs font-black uppercase tracking-wider hover:bg-[#00dd00] shadow-[0_0_12px_rgba(0,255,0,0.3)] transition-all cursor-pointer"
            >
              <LogIn className="w-3.5 h-3.5" />
              <span>SIGN IN // AUTH</span>
            </button>
          )}
        </div>
      </nav>

      {/* Main Hero and Action Grid */}
      <main className="max-w-6xl mx-auto px-6 py-12 flex flex-col justify-center items-center text-center flex-1 w-full">
        {accountProfile && !accountProfile.isSetupComplete && (
          <div className="mb-6 p-3 bg-black border border-[#F27D26] text-[#F27D26] font-mono text-xs flex flex-col sm:flex-row items-center justify-between gap-3 max-w-xl w-full shadow-[0_0_15px_rgba(242,125,38,0.15)]">
            <div className="flex items-center gap-2 text-left">
              <ShieldCheck className="w-4 h-4 text-[#F27D26] shrink-0" />
              <span>PROFILE SETUP REQUIRED: Name, handle, nationality & region</span>
            </div>
            <button
              onClick={() => setProfileSetupOpen(true)}
              className="px-3 py-1 bg-[#F27D26] text-black font-black uppercase text-[10px] hover:bg-amber-400 whitespace-nowrap cursor-pointer"
            >
              COMPLETE SETUP
            </button>
          </div>
        )}

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
          className="text-xs sm:text-sm text-zinc-400 font-mono uppercase tracking-wider max-w-2xl mx-auto mb-12 leading-relaxed"
        >
          Real-time competitive programming arena with AI problem synthesis, instant test execution, and dedicated DSA sparring with AlgoArena Bot.
        </motion.p>

        <motion.div 
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.3 }}
          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 w-full max-w-6xl"
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
            badge="SPECIAL FEATURE"
            icon={<Bot className="w-6 h-6 text-[#00FF00]" />}
            title="Practice vs AlgoArena Bot"
            description="Master algorithmic topics against our dedicated AI sparring bot with live DSA hints and instant test evaluation."
            actionText="PLAY BOT PRACTICE"
            onClick={() => setShowPracticeModal(true)}
            accent
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
            icon={<Trophy className="w-6 h-6 text-[#00FF00]" />}
            title="Global Leaderboard"
            description="Examine worldwide standings, top grandmasters, and win-streak records."
            actionText="VIEW STANDINGS"
            onClick={() => {
              setActiveFeedTab('leaderboard');
              const el = document.getElementById('rankings-feed');
              if (el) el.scrollIntoView({ behavior: 'smooth' });
            }}
            accent
          />
        </motion.div>

        {/* Dynamic Section: Leaderboard / Global Activity Switcher */}
        <motion.div
          id="rankings-feed"
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.4 }}
          className="w-full mt-14 scroll-mt-20"
        >
          {/* Section View Switcher Tabs */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-white/10 pb-3 mb-6 font-mono">
            <div className="flex flex-wrap items-center gap-2">
              <button
                onClick={() => setActiveFeedTab('leaderboard')}
                className={`flex items-center gap-2 px-4 py-2 text-xs font-bold uppercase transition-all cursor-pointer border ${
                  activeFeedTab === 'leaderboard'
                    ? 'bg-[#00FF00] text-black border-[#00FF00] shadow-[0_0_12px_rgba(0,255,0,0.3)]'
                    : 'bg-[#0c0c0c] text-zinc-400 border-white/10 hover:border-white/30 hover:text-white'
                }`}
              >
                <Trophy className="w-3.5 h-3.5" />
                <span>GLOBAL LEADERBOARD [STANDINGS]</span>
              </button>

              <button
                onClick={() => setActiveFeedTab('telemetry')}
                className={`flex items-center gap-2 px-4 py-2 text-xs font-bold uppercase transition-all cursor-pointer border ${
                  activeFeedTab === 'telemetry'
                    ? 'bg-[#00FF00] text-black border-[#00FF00] shadow-[0_0_12px_rgba(0,255,0,0.3)]'
                    : 'bg-[#0c0c0c] text-zinc-400 border-white/10 hover:border-white/30 hover:text-white'
                }`}
              >
                <Radio className="w-3.5 h-3.5" />
                <span>LIVE TELEMETRY [MATCH FEED]</span>
              </button>

              <button
                onClick={() => setActiveFeedTab('operators')}
                className={`flex items-center gap-2 px-4 py-2 text-xs font-bold uppercase transition-all cursor-pointer border ${
                  activeFeedTab === 'operators'
                    ? 'bg-[#00FF00] text-black border-[#00FF00] shadow-[0_0_12px_rgba(0,255,0,0.3)]'
                    : 'bg-[#0c0c0c] text-zinc-400 border-white/10 hover:border-white/30 hover:text-white'
                }`}
              >
                <Swords className="w-3.5 h-3.5" />
                <span>ACTIVE OPERATORS [DIRECT DUEL]</span>
              </button>
            </div>

            <div className="hidden sm:flex items-center gap-2 text-[10px] text-zinc-500 uppercase font-bold">
              <span className="w-2 h-2 rounded-full bg-[#00FF00] animate-pulse"></span>
              <span>NODE: US-EAST // 24/7 BROADCAST</span>
            </div>
          </div>

          {/* Active View */}
          {activeFeedTab === 'leaderboard' ? (
            <Leaderboard embedded />
          ) : activeFeedTab === 'telemetry' ? (
            <GlobalActivity />
          ) : (
            <LobbyOperatorsList currentUsername={accountProfile?.username || currentUser.name} />
          )}
        </motion.div>
      </main>

      {/* AlgoArena Bot Practice Configuration Modal */}
      <AnimatePresence>
        {showPracticeModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-[#0c0c0c] border border-[#00FF00]/50 max-w-lg w-full p-6 text-left shadow-[0_0_40px_rgba(0,255,0,0.2)] font-mono relative"
            >
              <div className="flex items-center justify-between pb-4 border-b border-white/10 mb-5">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 bg-[#00FF00]/20 border border-[#00FF00] flex items-center justify-center text-[#00FF00]">
                    <Bot className="w-4 h-4" />
                  </div>
                  <div>
                    <h2 className="text-sm font-black uppercase text-white tracking-wider">PRACTICE VS ALGOARENA BOT</h2>
                    <p className="text-[10px] text-[#00FF00] font-bold">SOLO DSA SPARRING MATRIX // REAL-TIME AI MENTOR</p>
                  </div>
                </div>
                <button 
                  onClick={() => setShowPracticeModal(false)}
                  className="text-zinc-500 hover:text-white p-1"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="space-y-4 text-xs">
                {/* Topic Selector */}
                <div>
                  <label className="text-[10px] uppercase font-bold text-zinc-400 block mb-1.5 flex items-center justify-between">
                    <span>SELECT DSA FOCUS TOPIC</span>
                    <span className="text-[#00FF00]">{practiceTopic}</span>
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    {[
                      'Dynamic Programming',
                      'Graphs & BFS/DFS',
                      'Arrays & Strings',
                      'Binary Trees',
                      'Bit Manipulation',
                      'Random DSA Topic'
                    ].map(topic => (
                      <button
                        key={topic}
                        type="button"
                        onClick={() => setPracticeTopic(topic)}
                        className={`p-2 border text-[11px] font-bold text-left transition-all cursor-pointer ${
                          practiceTopic === topic 
                            ? 'bg-[#00FF00]/20 border-[#00FF00] text-[#00FF00]' 
                            : 'bg-black border-white/10 text-zinc-400 hover:border-white/30'
                        }`}
                      >
                        {topic}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Difficulty Selector */}
                <div>
                  <label className="text-[10px] uppercase font-bold text-zinc-400 block mb-1.5">
                    BOT COMBAT INTENSITY / DIFFICULTY
                  </label>
                  <div className="grid grid-cols-3 gap-2">
                    {[
                      { id: 'easy', label: 'NOVICE', desc: 'Relaxed Pace (Easy)' },
                      { id: 'medium', label: 'ADEPT', desc: 'Balanced Duel (Med)' },
                      { id: 'hard', label: 'GRANDMASTER', desc: 'Sprint Pace (Hard)' },
                    ].map(d => (
                      <button
                        key={d.id}
                        type="button"
                        onClick={() => setPracticeDiff(d.id as any)}
                        className={`p-2 border text-center transition-all cursor-pointer ${
                          practiceDiff === d.id 
                            ? 'bg-[#00FF00]/20 border-[#00FF00] text-[#00FF00]' 
                            : 'bg-black border-white/10 text-zinc-400 hover:border-white/30'
                        }`}
                      >
                        <div className="font-bold text-[11px]">{d.label}</div>
                        <div className="text-[9px] text-zinc-500">{d.desc}</div>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Editor Language Selector */}
                <div>
                  <label className="text-[10px] uppercase font-bold text-zinc-400 block mb-1.5 flex items-center gap-1.5">
                    <Code2 className="w-3.5 h-3.5 text-[#00FF00]" />
                    <span>PRE-LOAD EDITOR LANGUAGE (NEW: C & JAVA AVAILABLE)</span>
                  </label>
                  <div className="grid grid-cols-3 gap-2">
                    {[
                      { id: 'c', label: 'C (C17 / GCC)' },
                      { id: 'java', label: 'Java 21' },
                      { id: 'cpp', label: 'C++ 20' },
                      { id: 'python', label: 'Python 3.11' },
                      { id: 'javascript', label: 'JavaScript' },
                      { id: 'typescript', label: 'TypeScript' },
                    ].map(lang => (
                      <button
                        key={lang.id}
                        type="button"
                        onClick={() => setPracticeLang(lang.id)}
                        className={`py-1.5 px-2 border text-center text-[10px] font-bold transition-all cursor-pointer ${
                          practiceLang === lang.id
                            ? 'bg-[#00FF00] text-black border-[#00FF00]'
                            : 'bg-black text-zinc-400 border-white/10 hover:border-white/30'
                        }`}
                      >
                        {lang.label}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="p-3 bg-black border border-white/10 text-[10px] text-zinc-400 flex items-start gap-2 leading-relaxed">
                  <Sparkles className="w-4 h-4 text-[#00FF00] shrink-0 mt-0.5" />
                  <span>
                    In Practice Mode, you can request <strong>AI Algorithmic Hints</strong> from AlgoArena Bot at any point during your problem-solving session without penalty.
                  </span>
                </div>
              </div>

              <div className="mt-6 flex items-center justify-end gap-3 pt-4 border-t border-white/10">
                <button
                  onClick={() => setShowPracticeModal(false)}
                  className="px-4 py-2 border border-white/10 text-zinc-400 hover:text-white uppercase text-[11px] font-bold cursor-pointer"
                >
                  CANCEL
                </button>
                <button
                  onClick={startPracticeDuel}
                  className="px-6 py-2 bg-[#00FF00] hover:bg-[#00DD00] text-black font-black uppercase text-xs tracking-wider flex items-center gap-2 shadow-[0_0_20px_rgba(0,255,0,0.3)] cursor-pointer"
                >
                  <span>LAUNCH PRACTICE MATCH</span>
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Telemetry Footer */}
      <footer className="h-10 bg-[#050505] border-t border-white/10 flex items-center px-6 text-[10px] font-bold text-zinc-600 justify-between uppercase tracking-widest font-mono shrink-0">
        <div className="flex gap-6">
          <span className="flex items-center gap-1.5"><Activity className="w-3 h-3 text-[#00FF00]" /> Region: US-EAST-1</span>
          <span className="hidden sm:inline">Latency: 22ms</span>
          <span className="hidden md:inline">Bot Engine: ALGOARENA-DSA-V2</span>
        </div>
        <div>
          PROVISIONED BY GEMINI-ARENA-CORE // VERSION 1.0.4
        </div>
      </footer>
    </div>
  );
}

function ActionCard({ icon, badge, title, description, actionText, onClick, primary = false, accent = false, disabled = false, children }: any) {
  return (
    <div 
      onClick={disabled ? undefined : onClick}
      className={`
        relative p-6 text-left transition-all duration-200 flex flex-col justify-between
        ${disabled ? 'opacity-40 cursor-not-allowed border border-white/5 bg-[#080808]' : 'cursor-pointer'}
        ${primary 
          ? 'border border-[#00FF00]/40 bg-[#0a0a0a] hover:border-[#00FF00] hover:shadow-[0_0_25px_rgba(0,255,0,0.2)]' 
          : accent
          ? 'border border-[#00FF00]/60 bg-[#0a0f0a] hover:border-[#00FF00] hover:shadow-[0_0_30px_rgba(0,255,0,0.25)]'
          : 'border border-white/10 bg-[#080808] hover:border-white/30 hover:bg-[#0c0c0c]'}
      `}
    >
      <div>
        <div className="flex items-center justify-between mb-4">
          <div className="w-12 h-12 bg-black border border-white/10 flex items-center justify-center">
            {icon}
          </div>
          <span className={`text-[10px] font-mono font-bold tracking-widest uppercase px-2 py-0.5 border ${
            primary || accent ? 'bg-[#00FF00]/10 text-[#00FF00] border-[#00FF00]/30' : 'bg-zinc-900 text-zinc-500 border-white/5'
          }`}>
            {badge}
          </span>
        </div>
        <h3 className="text-xl font-black uppercase italic tracking-tight text-white mb-2">{title}</h3>
        <p className="text-xs text-zinc-400 font-mono leading-relaxed">{description}</p>
        {children}
      </div>

      <div className="mt-6 pt-4 border-t border-white/5">
        <div className={`text-[11px] font-black tracking-widest uppercase flex items-center justify-between ${
          primary || accent ? 'text-[#00FF00]' : 'text-zinc-400'
        }`}>
          <span>{actionText}</span>
          <span className="font-mono">→</span>
        </div>
      </div>
      
      {(primary || accent) && (
        <div className="absolute top-0 right-0 w-24 h-24 bg-[#00FF00]/5 blur-[40px] -z-10"></div>
      )}
    </div>
  );
}
