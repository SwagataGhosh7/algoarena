import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Award, Flame, Terminal, Code2, Activity, Shield } from 'lucide-react';
import { Radar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, ResponsiveContainer } from 'recharts';

const data = [
  { subject: 'Arrays/Strings', A: 120, fullMark: 150 },
  { subject: 'Dynamic Prog.', A: 98, fullMark: 150 },
  { subject: 'Graphs', A: 86, fullMark: 150 },
  { subject: 'Bit Manip.', A: 99, fullMark: 150 },
  { subject: 'Trees', A: 85, fullMark: 150 },
  { subject: 'Math/Number', A: 65, fullMark: 150 },
];

export function Profile() {
  const { username } = useParams();
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-[#050505] text-[#e0e0e0] font-sans flex flex-col justify-between selection:bg-[#00FF00]/30">
      {/* Top Navbar */}
      <nav className="h-14 border-b border-[#00FF00]/30 flex items-center justify-between px-6 bg-[#0a0a0a] shrink-0">
        <div className="flex items-center gap-4">
          <button 
            onClick={() => navigate('/')} 
            className="text-zinc-400 hover:text-[#00FF00] transition-colors flex items-center gap-2 font-mono text-xs font-bold uppercase tracking-wider"
          >
            <ArrowLeft className="w-4 h-4" /> <span>LADDER</span>
          </button>
          <span className="text-zinc-600">|</span>
          <span className="text-[#00FF00] font-black text-lg tracking-tighter uppercase">
            ALGOARENA // OPERATOR DOSSIER
          </span>
        </div>

        <div className="hidden sm:flex items-center gap-3">
          <span className="bg-[#00FF00]/10 text-[#00FF00] text-[10px] px-2.5 py-1 border border-[#00FF00]/30 font-mono uppercase font-bold">
            CLEARANCE: LEVEL 3
          </span>
        </div>
      </nav>

      {/* Main Content */}
      <div className="max-w-6xl mx-auto px-6 py-10 w-full flex-1 space-y-8">
        {/* Profile Dossier Header */}
        <header className="flex flex-col md:flex-row items-center md:items-end gap-6 p-6 bg-[#080808] border border-white/10">
          <div className="w-20 h-20 bg-black border border-[#00FF00]/40 flex items-center justify-center shadow-[0_0_25px_rgba(0,255,0,0.2)] shrink-0">
            <Code2 className="w-10 h-10 text-[#00FF00]" />
          </div>
          <div className="flex-1 text-center md:text-left">
            <div className="flex items-center justify-center md:justify-start gap-2 mb-1">
              <span className="text-[10px] font-mono text-[#00FF00] uppercase font-black tracking-widest">
                OPERATOR ID: #882-ALPHA
              </span>
            </div>
            <h1 className="text-4xl sm:text-5xl font-black italic uppercase tracking-tighter text-white mb-3">
              {username}
            </h1>
            <div className="flex flex-wrap justify-center md:justify-start gap-3">
              <Badge icon={<Award className="w-3.5 h-3.5 text-[#F27D26]" />} text="Gold II Division" />
              <Badge icon={<Flame className="w-3.5 h-3.5 text-[#00FF00]" />} text="W/L: 142 - 84 (63%)" />
              <Badge icon={<Terminal className="w-3.5 h-3.5 text-zinc-400" />} text="Global Rank: #4,092" />
              <Badge icon={<Shield className="w-3.5 h-3.5 text-purple-400" />} text="Reliability: 99.4%" />
            </div>
          </div>
        </header>

        {/* Analytics Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Skill Radar Chart */}
          <section className="bg-[#080808] border border-white/10 p-6 flex flex-col">
            <div className="flex items-center justify-between border-b border-white/10 pb-3 mb-4">
              <h2 className="text-xs font-black text-zinc-300 uppercase tracking-widest font-mono flex items-center gap-2">
                <Activity className="w-3.5 h-3.5 text-[#00FF00]" />
                COMPETENCY MATRIX // RADAR
              </h2>
              <span className="text-[10px] font-mono text-[#00FF00] font-bold uppercase">
                DSA BENCHMARK
              </span>
            </div>
            <div className="h-[280px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <RadarChart cx="50%" cy="50%" outerRadius="75%" data={data}>
                  <PolarGrid stroke="#27272a" />
                  <PolarAngleAxis dataKey="subject" tick={{ fill: '#a1a1aa', fontSize: 11, fontFamily: 'monospace' }} />
                  <PolarRadiusAxis angle={30} domain={[0, 150]} tick={false} axisLine={false} />
                  <Radar 
                    name={username} 
                    dataKey="A" 
                    stroke="#00FF00" 
                    fill="#00FF00" 
                    fillOpacity={0.25} 
                  />
                </RadarChart>
              </ResponsiveContainer>
            </div>
          </section>

          {/* Recent Match Log */}
          <section className="bg-[#080808] border border-white/10 p-6 flex flex-col">
            <div className="flex items-center justify-between border-b border-white/10 pb-3 mb-4">
              <h2 className="text-xs font-black text-zinc-300 uppercase tracking-widest font-mono">
                TELEMETRY LOGS // RECENT DUELS
              </h2>
              <span className="text-[10px] font-mono text-zinc-500 font-bold uppercase">
                LAST 4 SESSIONS
              </span>
            </div>
            <div className="flex-1 overflow-y-auto space-y-2.5 custom-scrollbar">
              {[
                { opponent: 'Synth Ninja', result: 'Victory', time: '14m 23s', lang: 'JavaScript', date: '2 hrs ago' },
                { opponent: 'Pixel Ghost', result: 'Defeat', time: '21m 05s', lang: 'Python', date: '5 hrs ago' },
                { opponent: 'Quantum Coder', result: 'Victory', time: '08m 11s', lang: 'TypeScript', date: '1 day ago' },
                { opponent: 'Cyber Runner', result: 'Victory', time: '18m 59s', lang: 'C++', date: '2 days ago' },
              ].map((match, i) => (
                <div 
                  key={i} 
                  className="bg-black p-3.5 border border-white/10 flex items-center justify-between hover:border-[#00FF00]/50 transition-colors group cursor-pointer"
                >
                  <div>
                    <div className="font-bold text-white uppercase text-xs tracking-wider group-hover:text-[#00FF00] transition-colors">
                      VS {match.opponent}
                    </div>
                    <div className="text-[10px] font-mono text-zinc-500 flex gap-3 mt-1 uppercase">
                      <span>{match.time}</span>
                      <span>•</span>
                      <span>{match.lang}</span>
                      <span>•</span>
                      <span>{match.date}</span>
                    </div>
                  </div>
                  <div className={`px-3 py-1 font-mono text-[10px] font-black uppercase tracking-widest border ${
                    match.result === 'Victory' 
                      ? 'bg-[#00FF00]/10 text-[#00FF00] border-[#00FF00]/30' 
                      : 'bg-red-500/10 text-red-400 border-red-500/30'
                  }`}>
                    {match.result}
                  </div>
                </div>
              ))}
            </div>
          </section>
        </div>
      </div>

      {/* Telemetry Footer */}
      <footer className="h-10 bg-[#050505] border-t border-white/10 flex items-center px-6 text-[10px] font-bold text-zinc-600 justify-between uppercase tracking-widest font-mono shrink-0">
        <div className="flex gap-6">
          <span>Region: US-EAST-1</span>
          <span className="hidden sm:inline">Latency: 22ms</span>
          <span className="hidden md:inline">Profile Sync: LIVE</span>
        </div>
        <div>
          PROVISIONED BY GEMINI-ARENA-CORE // VERSION 1.0.4
        </div>
      </footer>
    </div>
  );
}

function Badge({ icon, text }: { icon: React.ReactNode, text: string }) {
  return (
    <div className="flex items-center gap-2 bg-black border border-white/10 px-3 py-1.5 text-xs font-mono font-bold uppercase tracking-wider text-zinc-300">
      {icon} <span>{text}</span>
    </div>
  );
}
