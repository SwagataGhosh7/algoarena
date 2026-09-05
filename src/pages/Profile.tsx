import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  ArrowLeft, 
  Award, 
  Flame, 
  Terminal, 
  Code2, 
  Shield, 
  Zap, 
  Target, 
  Cpu, 
  TrendingUp,
  Sparkles,
  Loader2,
  RefreshCw,
  CheckCircle2,
  Swords,
  Trophy,
  User,
  Globe2,
  MapPin,
  Camera,
  Edit3,
  PlayCircle
} from 'lucide-react';
import { CompetencyRadar } from '../components/CompetencyRadar';
import { MatchHistory } from '../components/MatchHistory';
import { CodePlayback } from '../components/CodePlayback';
import { FriendActions } from '../components/FriendActions';
import { CodeReview } from '../components/CodeReview';
import { useStore } from '../store';
import { UserProfileData, MatchRecord } from '../types';

export function Profile() {
  const { username } = useParams<{ username: string }>();
  const navigate = useNavigate();
  const { accountProfile, setProfileSetupOpen, saveProfileAndSync, currentUser } = useStore();

  const operatorName = username || accountProfile?.username || currentUser.name || 'Operator';
  const isSelf = Boolean(
    accountProfile && 
    (accountProfile.username.toLowerCase() === operatorName.toLowerCase() ||
     currentUser.name.toLowerCase() === operatorName.toLowerCase())
  );

  const [profile, setProfile] = useState<UserProfileData | null>(null);
  const [loading, setLoading] = useState(true);
  const [isAuditing, setIsAuditing] = useState(false);
  const [auditSuccess, setAuditSuccess] = useState(false);
  const [selectedPlaybackMatch, setSelectedPlaybackMatch] = useState<MatchRecord | null>(null);
  const [avatarUploading, setAvatarUploading] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const playbackSectionRef = useRef<HTMLDivElement>(null);

  // Fetch real profile data from server API
  const fetchProfile = async () => {
    try {
      setLoading(true);
      const res = await fetch(`/api/user-profile/${encodeURIComponent(operatorName)}`);
      if (res.ok) {
        const data: UserProfileData = await res.json();
        
        // Merge with local accountProfile if viewing self
        if (isSelf && accountProfile) {
          data.name = accountProfile.name || data.name;
          data.nationality = accountProfile.nationality || data.nationality;
          data.region = accountProfile.region || data.region;
          data.photoURL = accountProfile.photoURL || data.photoURL;
        }

        setProfile(data);

        if (data.matches && data.matches.length > 0 && !selectedPlaybackMatch) {
          setSelectedPlaybackMatch(data.matches[0]);
        }
      }
    } catch (err) {
      console.error('Failed to load user profile:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProfile();
  }, [operatorName, accountProfile?.photoURL, accountProfile?.nationality, accountProfile?.region]);

  // Request Gemini AI Deep Dossier Audit
  const handleGeminiAudit = async () => {
    if (!profile || isAuditing) return;
    try {
      setIsAuditing(true);
      setAuditSuccess(false);
      const res = await fetch('/api/analyze-dossier', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: profile.username }),
      });

      if (res.ok) {
        const updated = await res.json();
        setProfile(updated);
        setAuditSuccess(true);
        setTimeout(() => setAuditSuccess(false), 4000);
      }
    } catch (err) {
      console.error('Failed to run Gemini audit:', err);
    } finally {
      setIsAuditing(false);
    }
  };

  // Quick avatar update directly in Profile Dashboard
  const handleAvatarFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 2 * 1024 * 1024) {
      alert('Avatar image size must be under 2MB.');
      return;
    }

    setAvatarUploading(true);
    const reader = new FileReader();
    reader.onloadend = async () => {
      const base64 = reader.result as string;
      try {
        await saveProfileAndSync({ photoURL: base64 });
        if (profile) {
          setProfile({ ...profile, photoURL: base64 });
        }
      } catch (err) {
        console.error('Failed to update avatar photo:', err);
      } finally {
        setAvatarUploading(false);
      }
    };
    reader.readAsDataURL(file);
  };

  const handleSelectPlayback = (match: MatchRecord) => {
    setSelectedPlaybackMatch(match);
    playbackSectionRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const loadBenchmarkSamplePlayback = () => {
    const benchmarkMatch: MatchRecord = {
      id: 'MT-BENCHMARK',
      opponent: 'AlgoArena Bot [Mentor]',
      opponentRank: 'Grandmaster II',
      outcome: 'Victory',
      problem: 'Dynamic Island Count & Matrix Traversal',
      difficulty: 'Medium',
      duration: '11m 45s',
      language: 'TypeScript',
      eloChange: 28,
      testScore: '5/5 (100%)',
      date: 'Today',
      timestamp: '14:20:00',
    };
    setSelectedPlaybackMatch(benchmarkMatch);
    playbackSectionRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  if (loading || !profile) {
    return (
      <div className="min-h-screen bg-[#050505] text-[#00FF00] font-mono flex flex-col items-center justify-center space-y-3">
        <Loader2 className="w-8 h-8 animate-spin" />
        <span className="text-xs uppercase tracking-widest font-black">
          ACCESSING OPERATOR DOSSIER // RE-INDEXING TELEMETRY...
        </span>
      </div>
    );
  }

  const winRate = profile.totalDuels > 0 
    ? Math.round((profile.wins / profile.totalDuels) * 100) 
    : 0;

  const currentPhoto = profile.photoURL || accountProfile?.photoURL;
  const currentNationality = profile.nationality || accountProfile?.nationality || 'Global';
  const currentRegion = profile.region || accountProfile?.region || 'Global Matrix';
  const currentFullName = profile.name || accountProfile?.name || profile.username;

  return (
    <div className="min-h-screen bg-[#050505] text-[#e0e0e0] font-sans flex flex-col justify-between selection:bg-[#00FF00]/30">
      {/* Top Navbar */}
      <nav className="h-14 border-b border-[#00FF00]/30 flex items-center justify-between px-6 bg-[#0a0a0a] shrink-0 font-mono">
        <div className="flex items-center gap-4">
          <button 
            onClick={() => navigate('/')} 
            className="text-zinc-400 hover:text-[#00FF00] transition-colors flex items-center gap-2 text-xs font-bold uppercase tracking-wider cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4" /> <span>ARENA</span>
          </button>
          <button 
            onClick={() => navigate('/leaderboard')} 
            className="text-zinc-400 hover:text-[#00FF00] transition-colors flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider cursor-pointer"
          >
            <Trophy className="w-3.5 h-3.5 text-[#00FF00]" /> <span>LEADERBOARD</span>
          </button>
          <span className="text-zinc-600">|</span>
          <span className="text-[#00FF00] font-black text-lg tracking-tighter uppercase">
            ALGOARENA // OPERATOR DOSSIER
          </span>
        </div>

        <div className="flex items-center gap-3">
          {isSelf && (
            <button
              onClick={() => setProfileSetupOpen(true)}
              className="px-3 py-1.5 bg-white/5 border border-white/20 text-zinc-300 hover:text-white hover:border-[#00FF00] text-xs font-bold uppercase flex items-center gap-1.5 transition-all"
            >
              <Edit3 className="w-3.5 h-3.5 text-[#00FF00]" />
              <span>EDIT PROFILE</span>
            </button>
          )}

          {!isSelf && (
            <FriendActions username={profile.username} />
          )}

          <button
            onClick={() => navigate('/room/arena-quick')}
            className="hidden sm:flex items-center gap-2 px-3 py-1.5 bg-[#00FF00]/10 border border-[#00FF00]/40 text-[#00FF00] hover:bg-[#00FF00]/20 text-xs font-bold uppercase tracking-wider transition-all cursor-pointer"
          >
            <Swords className="w-3.5 h-3.5" />
            ENTER ARENA DUEL
          </button>
        </div>
      </nav>

      {/* Main Content */}
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8 w-full flex-1 space-y-8">
        {/* Profile Dossier Header */}
        <header className="flex flex-col md:flex-row items-center md:items-end justify-between gap-6 p-6 bg-[#080808] border border-white/10 relative overflow-hidden font-mono">
          <div className="flex flex-col sm:flex-row items-center sm:items-end gap-6 w-full md:w-auto">
            {/* Operator Avatar with Upload Trigger */}
            <div className="relative group shrink-0">
              <div className="w-24 h-24 bg-black border border-[#00FF00]/50 flex items-center justify-center shadow-[0_0_25px_rgba(0,255,0,0.2)] overflow-hidden">
                {currentPhoto ? (
                  <img
                    src={currentPhoto}
                    alt={profile.username}
                    referrerPolicy="no-referrer"
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="flex flex-col items-center justify-center text-zinc-500">
                    <User className="w-10 h-10 text-[#00FF00]" />
                  </div>
                )}
              </div>

              {/* Upload or Update Photo button in dashboard */}
              {isSelf && (
                <>
                  <input
                    type="file"
                    ref={fileInputRef}
                    onChange={handleAvatarFile}
                    accept="image/*"
                    className="hidden"
                  />
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={avatarUploading}
                    className="absolute -bottom-2 -right-2 p-1.5 bg-black border border-[#00FF00] text-[#00FF00] hover:bg-[#00FF00] hover:text-black transition-colors shadow-[0_0_10px_rgba(0,255,0,0.4)] cursor-pointer"
                    title="Change Profile Picture"
                  >
                    {avatarUploading ? (
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    ) : (
                      <Camera className="w-3.5 h-3.5" />
                    )}
                  </button>
                </>
              )}
            </div>

            <div className="flex-1 text-center sm:text-left">
              <div className="flex items-center justify-center sm:justify-start gap-2 mb-1 flex-wrap">
                <span className="text-[10px] text-[#00FF00] uppercase font-black tracking-widest">
                  OPERATOR ID: #{profile.username.toUpperCase()}
                </span>
                <span className="text-[10px] bg-zinc-900 border border-white/10 text-zinc-400 px-1.5 py-0.2">
                  AUTHENTICATED
                </span>
                {isSelf && (
                  <span className="text-[10px] bg-[#00FF00]/10 border border-[#00FF00]/30 text-[#00FF00] px-1.5 py-0.2 font-bold">
                    MY ACCOUNT
                  </span>
                )}
              </div>

              <div className="flex items-baseline justify-center sm:justify-start gap-3 mb-1">
                <h1 className="text-3xl sm:text-4xl font-black italic uppercase tracking-tighter text-white">
                  {currentFullName}
                </h1>
                <span className="text-zinc-500 text-sm font-mono font-bold">
                  @{profile.username}
                </span>
              </div>

              {/* Location & Region Badge */}
              <div className="flex items-center justify-center sm:justify-start gap-3 text-xs text-zinc-400 mb-3">
                <span className="flex items-center gap-1">
                  <Globe2 className="w-3.5 h-3.5 text-[#00FF00]" />
                  <span>{currentNationality}</span>
                </span>
                <span>•</span>
                <span className="flex items-center gap-1">
                  <MapPin className="w-3.5 h-3.5 text-[#F27D26]" />
                  <span>Region: {currentRegion}</span>
                </span>
              </div>

              <div className="flex flex-wrap justify-center sm:justify-start gap-2">
                <Badge icon={<Award className="w-3.5 h-3.5 text-[#F27D26]" />} text={`${profile.rankTitle} (${profile.elo} ELO)`} />
                <Badge icon={<Flame className="w-3.5 h-3.5 text-[#00FF00]" />} text={`W/L: ${profile.wins} - ${profile.losses} (${winRate}%)`} />
                <Badge icon={<Terminal className="w-3.5 h-3.5 text-zinc-400" />} text={`Streak: ${profile.streak} Wins`} />
                <Badge icon={<Shield className="w-3.5 h-3.5 text-purple-400" />} text={`Accuracy: ${profile.testAccuracy}%`} />
              </div>
            </div>
          </div>

          {/* Gemini Audit Action */}
          <div className="flex flex-col items-center md:items-end gap-2 shrink-0">
            <button
              onClick={handleGeminiAudit}
              disabled={isAuditing}
              className="px-4 py-2 bg-gradient-to-r from-[#00FF00]/20 to-[#00FF00]/10 border border-[#00FF00] hover:bg-[#00FF00]/30 text-[#00FF00] font-mono text-xs font-black uppercase tracking-wider flex items-center gap-2 transition-all shadow-[0_0_15px_rgba(0,255,0,0.15)] cursor-pointer disabled:opacity-50"
            >
              {isAuditing ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin text-[#00FF00]" />
                  <span>GEMINI AUDITING...</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4 text-[#00FF00]" />
                  <span>RUN GEMINI TACTICAL AUDIT</span>
                </>
              )}
            </button>
            {auditSuccess && (
              <span className="text-[10px] font-mono text-[#00FF00] flex items-center gap-1">
                <CheckCircle2 className="w-3 h-3" /> DOSSIER RE-EVALUATED BY GEMINI
              </span>
            )}
            <span className="text-[10px] font-mono text-zinc-500">
              Audited: {profile.aiAssessment?.lastAudited || 'Real-Time'}
            </span>
          </div>
        </header>

        {/* Gemini Tactical Assessment Panel */}
        {profile.aiAssessment && (
          <section className="bg-black border border-[#00FF00]/40 p-5 relative overflow-hidden font-mono">
            <div className="absolute top-0 right-0 px-3 py-1 bg-[#00FF00]/10 border-b border-l border-[#00FF00]/30 text-[9px] text-[#00FF00] font-bold uppercase tracking-widest flex items-center gap-1.5">
              <Sparkles className="w-3 h-3" /> GEMINI 2.5 FLASH TACTICAL ANALYSIS
            </div>
            <div className="space-y-3">
              <div className="flex items-center gap-2 text-xs font-black text-white uppercase tracking-wider">
                <Terminal className="w-4 h-4 text-[#00FF00]" />
                <span>AI Algorithmic Critique & Assessment</span>
              </div>
              <p className="text-xs text-zinc-300 leading-relaxed max-w-4xl">
                "{profile.aiAssessment.tacticalCritique}"
              </p>
              <div className="pt-2 border-t border-white/10 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-[11px]">
                <div className="flex items-center gap-2">
                  <span className="text-zinc-500 font-bold uppercase">STRATEGIC FOCUS:</span>
                  <span className="text-[#F27D26] font-bold uppercase">{profile.aiAssessment.focusRecommendation}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-zinc-500 font-bold uppercase">PROVISION STATUS:</span>
                  <span className="text-[#00FF00] font-bold">SYNCHRONIZED WITH GEMINI API</span>
                </div>
              </div>
            </div>
          </section>
        )}

        {/* CODE PLAYBACK SECTION (Mandated User Feature) */}
        <section ref={playbackSectionRef} className="w-full space-y-3 font-mono">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-white/10 pb-3">
            <div className="flex items-center gap-2.5">
              <Code2 className="w-4 h-4 text-[#00FF00]" />
              <h2 className="text-xs sm:text-sm font-black text-white uppercase tracking-widest">
                CODE PLAYBACK // LINE-BY-LINE COMBAT TELEMETRY
              </h2>
              <span className="bg-[#00FF00]/10 text-[#00FF00] text-[9px] px-2 py-0.5 border border-[#00FF00]/30 font-bold uppercase">
                SPEED & EFFICIENCY METRICS
              </span>
            </div>

            {/* Quick Match Selector for Code Playback */}
            <div className="flex items-center gap-2 flex-wrap">
              {profile.matches.length > 0 ? (
                <div className="flex items-center gap-1.5 text-[10px]">
                  <span className="text-zinc-500 uppercase font-bold">Select Match:</span>
                  <select
                    value={selectedPlaybackMatch?.id || ''}
                    onChange={(e) => {
                      const found = profile.matches.find((m) => m.id === e.target.value);
                      if (found) setSelectedPlaybackMatch(found);
                    }}
                    className="px-2 py-1 bg-black border border-white/20 text-white font-mono text-[11px] focus:outline-none focus:border-[#00FF00] cursor-pointer"
                  >
                    {profile.matches.map((m) => (
                      <option key={m.id} value={m.id} className="bg-zinc-950">
                        {m.id} - {m.problem} ({m.outcome})
                      </option>
                    ))}
                  </select>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={loadBenchmarkSamplePlayback}
                  className="px-2.5 py-1 bg-white/5 border border-white/20 hover:border-[#00FF00] text-zinc-300 hover:text-[#00FF00] text-[10px] font-bold uppercase flex items-center gap-1.5 transition-colors"
                >
                  <PlayCircle className="w-3.5 h-3.5 text-[#00FF00]" />
                  <span>LOAD BENCHMARK REPLAY DEMO</span>
                </button>
              )}
            </div>
          </div>

          {/* Interactive Code Playback Component */}
          <CodePlayback match={selectedPlaybackMatch} />
          {selectedPlaybackMatch?.review && (
            <CodeReview
              review={selectedPlaybackMatch.review}
              submittedCode={selectedPlaybackMatch.playback?.finalCode}
              language={selectedPlaybackMatch.language}
            />
          )}
        </section>

        {/* Analytics Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Skill Radar Chart */}
          <section className="lg:col-span-7 bg-[#080808] border border-white/10 p-6 flex flex-col">
            <CompetencyRadar username={profile.username} data={profile.competencies} />
          </section>

          {/* Combat Statistics Matrix */}
          <section className="lg:col-span-5 bg-[#080808] border border-white/10 p-6 flex flex-col justify-between font-mono">
            <div>
              <div className="flex items-center justify-between border-b border-white/10 pb-3 mb-4">
                <h2 className="text-xs font-black text-zinc-300 uppercase tracking-widest flex items-center gap-2">
                  <Cpu className="w-3.5 h-3.5 text-[#00FF00]" />
                  COMBAT TELEMETRY // REAL STATS
                </h2>
                <span className="text-[10px] text-[#F27D26] font-bold uppercase">
                  RANK: {profile.rankTitle}
                </span>
              </div>

              {/* KPI Matrix */}
              <div className="grid grid-cols-2 gap-3 mb-4">
                <div className="bg-black p-3 border border-white/10">
                  <div className="text-[9px] text-zinc-500 uppercase font-bold flex items-center gap-1 mb-1">
                    <TrendingUp className="w-3 h-3 text-[#00FF00]" /> PEAK ELO
                  </div>
                  <div className="text-2xl font-black text-white">{profile.peakElo}</div>
                  <div className="text-[9px] text-[#00FF00] mt-0.5 font-bold">CURRENT: {profile.elo}</div>
                </div>

                <div className="bg-black p-3 border border-white/10">
                  <div className="text-[9px] text-zinc-500 uppercase font-bold flex items-center gap-1 mb-1">
                    <Zap className="w-3 h-3 text-[#F27D26]" /> STREAK RECORD
                  </div>
                  <div className="text-2xl font-black text-white">{profile.streak} WINS</div>
                  <div className="text-[9px] text-zinc-400 mt-0.5">CURRENT DUEL STREAK</div>
                </div>

                <div className="bg-black p-3 border border-white/10">
                  <div className="text-[9px] text-zinc-500 uppercase font-bold flex items-center gap-1 mb-1">
                    <Target className="w-3 h-3 text-[#00FF00]" /> TEST ACCURACY
                  </div>
                  <div className="text-2xl font-black text-white">{profile.testAccuracy}%</div>
                  <div className="text-[9px] text-zinc-400 mt-0.5">ACROSS ALL SUITES</div>
                </div>

                <div className="bg-black p-3 border border-white/10">
                  <div className="text-[9px] text-zinc-500 uppercase font-bold flex items-center gap-1 mb-1">
                    <Terminal className="w-3 h-3 text-purple-400" /> TOTAL DUELS
                  </div>
                  <div className="text-2xl font-black text-white">{profile.totalDuels}</div>
                  <div className="text-[9px] text-zinc-400 mt-0.5">{profile.wins} W / {profile.losses} L</div>
                </div>
              </div>

              {/* Preferred Languages Spectrum */}
              <div className="mb-4">
                <div className="flex items-center justify-between text-[10px] text-zinc-400 font-bold uppercase mb-1.5">
                  <span>COMPILER AFFINITY</span>
                  <span className="text-[#00FF00]">TOP: {profile.preferredLanguages?.[0]?.language || 'TypeScript'}</span>
                </div>
                <div className="h-2 w-full bg-black border border-white/10 flex overflow-hidden">
                  {(profile.preferredLanguages || []).map((lang, idx) => (
                    <div 
                      key={idx}
                      className="h-full" 
                      style={{ width: `${lang.percentage}%`, backgroundColor: lang.color }} 
                      title={`${lang.language} ${lang.percentage}%`} 
                    />
                  ))}
                </div>
                <div className="flex flex-wrap items-center justify-between text-[9px] text-zinc-500 mt-1 uppercase gap-2">
                  {(profile.preferredLanguages || []).map((lang, idx) => (
                    <span key={idx} className="flex items-center gap-1">
                      <span className="w-1.5 h-1.5" style={{ backgroundColor: lang.color }} /> {lang.language} ({lang.percentage}%)
                    </span>
                  ))}
                </div>
              </div>
            </div>

            {/* Combat Accolades */}
            <div className="border-t border-white/10 pt-3">
              <span className="text-[10px] text-zinc-500 font-bold uppercase block mb-2">EARNED COMBAT HONORS</span>
              <div className="flex flex-wrap gap-1.5">
                {(profile.honors || []).map((honor, idx) => (
                  <span key={idx} className="px-2 py-0.5 bg-black border border-white/10 text-[9px] text-zinc-300 font-bold uppercase tracking-wider">
                    {honor}
                  </span>
                ))}
              </div>
            </div>
          </section>
        </div>

        {/* Full Match History Data-Grid Section */}
        <section className="w-full">
          <MatchHistory 
            matches={profile.matches} 
            username={profile.username}
            onSelectPlayback={handleSelectPlayback}
          />
        </section>
      </div>

      {/* Telemetry Footer */}
      <footer className="h-10 bg-[#050505] border-t border-white/10 flex items-center px-6 text-[10px] font-bold text-zinc-600 justify-between uppercase tracking-widest font-mono shrink-0">
        <div className="flex gap-6">
          <span>Model: GEMINI-2.5-FLASH</span>
          <span className="hidden sm:inline">Telemetry: AUTHENTIC LIVE PERSISTENCE</span>
          <span className="hidden md:inline">Profile Sync: 100% ONLINE</span>
        </div>
        <div>
          PROVISIONED BY GEMINI-ARENA-CORE // PROTOCOL V2.4
        </div>
      </footer>
    </div>
  );
}

function Badge({ icon, text }: { icon: React.ReactNode; text: string }) {
  return (
    <div className="flex items-center gap-2 bg-black border border-white/10 px-3 py-1.5 text-xs font-mono font-bold uppercase tracking-wider text-zinc-300">
      {icon} <span>{text}</span>
    </div>
  );
}
