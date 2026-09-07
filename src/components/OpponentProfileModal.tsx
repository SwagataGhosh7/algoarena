import { useEffect, useState } from 'react';
import { 
  X, 
  Trophy, 
  Swords, 
  Flame, 
  Target, 
  Zap, 
  UserPlus, 
  Users, 
  Clock3, 
  ExternalLink, 
  Loader2, 
  Bot, 
  Sparkles, 
  Code2, 
  ShieldCheck,
  Check,
  Award
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { UserProfileData } from '../types';
import { apiUrl } from '../api';
import { soundManager } from '../lib/soundEffects';
import { useStore } from '../store';

interface OpponentProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  opponentName: string | null;
  opponentElo?: number;
  isBot?: boolean;
}

type FriendStatus = 'none' | 'pending' | 'incoming' | 'friends' | 'self';

export function OpponentProfileModal({
  isOpen,
  onClose,
  opponentName,
  opponentElo,
  isBot = false,
}: OpponentProfileModalProps) {
  const { accountProfile, currentUser, setAuthModalOpen } = useStore();
  const viewerName = accountProfile?.username || currentUser.name;

  const [profile, setProfile] = useState<UserProfileData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [friendStatus, setFriendStatus] = useState<FriendStatus>('none');
  const [friendLoading, setFriendLoading] = useState(false);

  const cleanName = opponentName?.trim() || '';
  const isActualBot = isBot || cleanName === 'AlgoArena Bot' || cleanName.toLowerCase().includes('bot');
  const isSelf = Boolean(
    viewerName && 
    cleanName && 
    viewerName.toLowerCase() === cleanName.toLowerCase()
  );

  // Fetch real profile and friend status whenever opponent changes
  useEffect(() => {
    if (!isOpen || !cleanName) return;

    if (isActualBot) {
      // Provide synthesized bot profile
      setProfile({
        username: cleanName,
        name: cleanName,
        elo: opponentElo || (cleanName.includes('Ronin') ? 2100 : 2450),
        rankTitle: opponentElo ? `${opponentElo} ELO` : '2450 ELO [Grandmaster]',
        peakElo: 2500,
        wins: 1420,
        losses: 215,
        streak: 12,
        testAccuracy: 98,
        totalDuels: 1635,
        preferredLanguages: [
          { language: 'C++', percentage: 45, color: '#f59e0b' },
          { language: 'TypeScript', percentage: 35, color: '#00FF00' },
          { language: 'Python', percentage: 20, color: '#3b82f6' },
        ],
        honors: ['AUTONOMOUS SENTINEL', 'ALGORITHMIC SPAR MENTOR', 'PERFECT SUITE EXECUTION'],
        competencies: [
          { subject: 'Arrays', score: 145, fullMark: 150, solvedCount: 42, winRate: 92 },
          { subject: 'Graphs', score: 140, fullMark: 150, solvedCount: 38, winRate: 89 },
          { subject: 'Dynamic Prog.', score: 138, fullMark: 150, solvedCount: 35, winRate: 88 },
          { subject: 'Trees', score: 146, fullMark: 150, solvedCount: 40, winRate: 94 },
          { subject: 'Bit Manip.', score: 135, fullMark: 150, solvedCount: 29, winRate: 85 },
          { subject: 'Math & Number', score: 142, fullMark: 150, solvedCount: 34, winRate: 90 },
        ],
        matches: [],
        aiAssessment: {
          tacticalCritique: 'Autonomous sparring agent utilizing optimized Big-O analysis and zero-allocation tree recursion.',
          focusRecommendation: 'Calibrated to assist human players in mastering competitive interview algorithms.',
          lastAudited: new Date().toLocaleDateString(),
        },
        friends: [],
        incomingFriendRequests: [],
        outgoingFriendRequests: [],
      });
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    // Fetch user profile from API
    fetch(apiUrl(`/api/user-profile/${encodeURIComponent(cleanName)}`))
      .then(async (res) => {
        if (!res.ok) throw new Error('User profile unavailable');
        return res.json();
      })
      .then((data: UserProfileData) => {
        setProfile(data);
      })
      .catch((err) => {
        console.warn('Could not load full profile, creating baseline viewer:', err);
        // Fallback display if profile endpoint fails
        setProfile({
          username: cleanName,
          name: cleanName,
          elo: opponentElo || 1200,
          rankTitle: `${opponentElo || 1200} ELO`,
          peakElo: opponentElo || 1200,
          wins: 0,
          losses: 0,
          streak: 0,
          testAccuracy: 85,
          totalDuels: 1,
          preferredLanguages: [{ language: 'TypeScript', percentage: 100, color: '#00FF00' }],
          honors: ['ARENA DUELIST'],
          competencies: [],
          matches: [],
          friends: [],
          incomingFriendRequests: [],
          outgoingFriendRequests: [],
        });
      })
      .finally(() => setLoading(false));

    // Fetch friend status
    if (viewerName && !isSelf) {
      fetch(apiUrl(`/api/friends?username=${encodeURIComponent(cleanName)}&viewer=${encodeURIComponent(viewerName)}`))
        .then((res) => (res.ok ? res.json() : null))
        .then((data) => {
          if (data?.status) setFriendStatus(data.status);
        })
        .catch(() => {});
    }
  }, [isOpen, cleanName, viewerName, isActualBot, opponentElo, isSelf]);

  const handleSendFriendRequest = async () => {
    if (!viewerName) {
      setAuthModalOpen(true);
      return;
    }
    soundManager.playClick();
    setFriendLoading(true);
    try {
      const res = await fetch(apiUrl('/api/friends/request'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ from: viewerName, to: cleanName }),
      });
      if (res.ok) {
        soundManager.playNotification();
        setFriendStatus('pending');
      }
    } catch (e) {
      console.warn('Friend request failed', e);
    } finally {
      setFriendLoading(false);
    }
  };

  const handleRespondFriend = async (accept: boolean) => {
    if (!viewerName) return;
    soundManager.playClick();
    setFriendLoading(true);
    try {
      const res = await fetch(apiUrl('/api/friends/respond'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: viewerName, requester: cleanName, accept }),
      });
      if (res.ok) {
        soundManager.playNotification();
        setFriendStatus(accept ? 'friends' : 'none');
      }
    } catch (e) {
      console.warn('Friend response failed', e);
    } finally {
      setFriendLoading(false);
    }
  };

  if (!isOpen || !opponentName) return null;

  const winRate = profile && profile.totalDuels > 0 
    ? Math.round((profile.wins / profile.totalDuels) * 100) 
    : 50;

  return (
    <AnimatePresence>
      <div 
        id="opponent-profile-modal-backdrop"
        className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-sm"
        onClick={(e) => {
          if (e.target === e.currentTarget) onClose();
        }}
      >
        <motion.div
          id="opponent-profile-modal-card"
          initial={{ opacity: 0, scale: 0.94, y: 15 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.94, y: 15 }}
          transition={{ duration: 0.2 }}
          className="bg-[#0b0b0b] border border-[#00FF00]/40 w-full max-w-xl max-h-[90vh] flex flex-col shadow-[0_0_50px_rgba(0,255,0,0.2)] font-mono overflow-hidden relative"
        >
          {/* Top Neon Accent Bar */}
          <div className="h-1 bg-gradient-to-r from-[#00FF00] via-[#F27D26] to-[#00FF00]" />

          {/* Modal Header */}
          <div className="p-4 bg-black/90 border-b border-white/10 flex items-center justify-between gap-3 shrink-0">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 bg-[#00FF00]/20 border border-[#00FF00] text-[#00FF00] flex items-center justify-center font-black text-sm">
                {isActualBot ? <Bot className="w-5 h-5" /> : cleanName.slice(0, 2).toUpperCase()}
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-sm sm:text-base font-black text-white uppercase tracking-wider">
                    {cleanName}
                  </h2>
                  {isActualBot ? (
                    <span className="px-1.5 py-0.5 bg-[#00FF00]/15 text-[#00FF00] border border-[#00FF00]/40 text-[9px] font-black uppercase">
                      AI MENTOR
                    </span>
                  ) : (
                    <span className="px-1.5 py-0.5 bg-amber-500/15 text-amber-400 border border-amber-500/40 text-[9px] font-black uppercase">
                      1V1 DUELIST
                    </span>
                  )}
                </div>
                <p className="text-[10px] text-zinc-400">
                  {profile?.rankTitle || `${opponentElo || 1200} ELO`} • ACTIVE ARENA OPPONENT
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={onClose}
              className="p-1.5 text-zinc-400 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
              title="Close profile dialog"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Body Content */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4 custom-scrollbar">
            {loading ? (
              <div className="py-16 flex flex-col items-center justify-center gap-3 text-zinc-500">
                <Loader2 className="w-8 h-8 text-[#00FF00] animate-spin" />
                <span className="text-xs uppercase tracking-wider font-bold">
                  DECRYPTING PLAYER PROFILE...
                </span>
              </div>
            ) : (
              <>
                {/* Action Banner: Friend Status & Actions */}
                {!isActualBot && !isSelf && (
                  <div className="p-3 bg-black/60 border border-white/10 flex flex-wrap items-center justify-between gap-2.5">
                    <div className="flex items-center gap-2">
                      {friendStatus === 'friends' ? (
                        <span className="flex items-center gap-1.5 text-[#00FF00] text-xs font-bold uppercase">
                          <Check className="w-4 h-4" /> YOU ARE FRIENDS
                        </span>
                      ) : friendStatus === 'pending' ? (
                        <span className="flex items-center gap-1.5 text-amber-400 text-xs font-bold uppercase">
                          <Clock3 className="w-4 h-4" /> FRIEND REQUEST PENDING
                        </span>
                      ) : friendStatus === 'incoming' ? (
                        <span className="flex items-center gap-1.5 text-[#00FF00] text-xs font-bold uppercase">
                          <UserPlus className="w-4 h-4" /> INCOMING FRIEND REQUEST
                        </span>
                      ) : (
                        <span className="text-zinc-400 text-xs font-bold uppercase">
                          CONNECT AS ALLY
                        </span>
                      )}
                    </div>

                    <div className="flex items-center gap-2">
                      {friendStatus === 'incoming' ? (
                        <>
                          <button
                            type="button"
                            disabled={friendLoading}
                            onClick={() => handleRespondFriend(true)}
                            className="px-3 py-1.5 bg-[#00FF00] text-black font-black uppercase text-[10px] tracking-wider hover:bg-[#00DD00] transition-colors cursor-pointer disabled:opacity-50"
                          >
                            ACCEPT
                          </button>
                          <button
                            type="button"
                            disabled={friendLoading}
                            onClick={() => handleRespondFriend(false)}
                            className="px-2.5 py-1.5 bg-black border border-white/20 text-zinc-400 hover:text-white font-bold uppercase text-[10px] transition-colors cursor-pointer"
                          >
                            DECLINE
                          </button>
                        </>
                      ) : friendStatus === 'friends' ? (
                        <span className="px-2.5 py-1 bg-[#00FF00]/10 border border-[#00FF00]/40 text-[#00FF00] text-[10px] font-black uppercase flex items-center gap-1">
                          <Users className="w-3 h-3" /> CONNECTED
                        </span>
                      ) : friendStatus === 'pending' ? (
                        <span className="px-2.5 py-1 bg-zinc-800 text-zinc-300 text-[10px] font-bold uppercase">
                          REQUEST SENT
                        </span>
                      ) : (
                        <button
                          type="button"
                          disabled={friendLoading}
                          onClick={handleSendFriendRequest}
                          className="px-3.5 py-1.5 bg-[#00FF00] hover:bg-[#00DD00] text-black font-black uppercase text-[10px] tracking-wider flex items-center gap-1.5 transition-all shadow-[0_0_12px_rgba(0,255,0,0.3)] cursor-pointer disabled:opacity-50"
                        >
                          <UserPlus className="w-3.5 h-3.5" />
                          <span>SEND FRIEND REQUEST</span>
                        </button>
                      )}

                      <a
                        href={`/profile/${encodeURIComponent(cleanName)}`}
                        target="_blank"
                        rel="noreferrer"
                        className="px-2.5 py-1.5 bg-black hover:bg-zinc-800 border border-white/20 text-zinc-300 hover:text-white text-[10px] font-bold uppercase flex items-center gap-1 transition-colors"
                        title="Open full profile dossier in new browser tab"
                      >
                        <span>FULL DOSSIER</span>
                        <ExternalLink className="w-3 h-3" />
                      </a>
                    </div>
                  </div>
                )}

                {/* Combat Metrics Grid */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  <div className="bg-black/60 border border-white/10 p-2.5">
                    <div className="flex items-center gap-1.5 text-zinc-400 text-[10px] uppercase font-bold mb-1">
                      <Trophy className="w-3.5 h-3.5 text-[#F27D26]" />
                      <span>ELO RATING</span>
                    </div>
                    <div className="text-lg font-black text-white">
                      {profile?.elo || opponentElo || 1200}
                    </div>
                    <span className="text-[9px] text-zinc-500 uppercase">
                      PEAK: {profile?.peakElo || profile?.elo || 1200}
                    </span>
                  </div>

                  <div className="bg-black/60 border border-white/10 p-2.5">
                    <div className="flex items-center gap-1.5 text-zinc-400 text-[10px] uppercase font-bold mb-1">
                      <Swords className="w-3.5 h-3.5 text-[#00FF00]" />
                      <span>WIN RATE</span>
                    </div>
                    <div className="text-lg font-black text-[#00FF00]">
                      {winRate}%
                    </div>
                    <span className="text-[9px] text-zinc-500 uppercase">
                      {profile?.wins || 0}W / {profile?.losses || 0}L
                    </span>
                  </div>

                  <div className="bg-black/60 border border-white/10 p-2.5">
                    <div className="flex items-center gap-1.5 text-zinc-400 text-[10px] uppercase font-bold mb-1">
                      <Flame className="w-3.5 h-3.5 text-amber-400" />
                      <span>STREAK</span>
                    </div>
                    <div className="text-lg font-black text-amber-400">
                      {profile?.streak || 0} 🔥
                    </div>
                    <span className="text-[9px] text-zinc-500 uppercase">
                      {profile?.totalDuels || 0} DUELS
                    </span>
                  </div>

                  <div className="bg-black/60 border border-white/10 p-2.5">
                    <div className="flex items-center gap-1.5 text-zinc-400 text-[10px] uppercase font-bold mb-1">
                      <Target className="w-3.5 h-3.5 text-emerald-400" />
                      <span>TEST ACCURACY</span>
                    </div>
                    <div className="text-lg font-black text-emerald-400">
                      {profile?.testAccuracy || 85}%
                    </div>
                    <span className="text-[9px] text-zinc-500 uppercase">
                      SUITE VERIFICATION
                    </span>
                  </div>
                </div>

                {/* Preferred Languages Breakdown */}
                {profile?.preferredLanguages && profile.preferredLanguages.length > 0 && (
                  <div className="bg-black/60 border border-white/10 p-3 space-y-2">
                    <div className="text-[10px] text-zinc-400 font-bold uppercase tracking-wider flex items-center justify-between">
                      <span className="flex items-center gap-1.5">
                        <Code2 className="w-3.5 h-3.5 text-[#00FF00]" />
                        PRIMARY PROGRAMMING LANGUAGES
                      </span>
                      <span className="text-[9px] text-zinc-500">USAGE TELEMETRY</span>
                    </div>

                    <div className="space-y-1.5 pt-1">
                      {profile.preferredLanguages.map((lang, idx) => (
                        <div key={idx} className="space-y-0.5">
                          <div className="flex items-center justify-between text-xs">
                            <span className="text-white font-bold">{lang.language}</span>
                            <span className="text-zinc-400 text-[11px] font-bold">{lang.percentage}%</span>
                          </div>
                          <div className="h-1.5 bg-zinc-900 overflow-hidden w-full">
                            <div
                              className="h-full"
                              style={{ 
                                width: `${lang.percentage}%`,
                                backgroundColor: lang.color || '#00FF00'
                              }}
                            />
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Algorithmic Competencies */}
                {profile?.competencies && profile.competencies.length > 0 && (
                  <div className="bg-black/60 border border-white/10 p-3 space-y-2">
                    <div className="text-[10px] text-zinc-400 font-bold uppercase tracking-wider flex items-center justify-between">
                      <span className="flex items-center gap-1.5">
                        <Zap className="w-3.5 h-3.5 text-amber-400" />
                        ALGORITHMIC COMPETENCIES
                      </span>
                      <span className="text-[9px] text-zinc-500">MASTERY BENCHMARK</span>
                    </div>

                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 pt-1">
                      {profile.competencies.map((comp, i) => (
                        <div key={i} className="p-2 bg-black/80 border border-white/5 space-y-1">
                          <div className="flex items-center justify-between text-[11px]">
                            <span className="font-bold text-zinc-300 truncate">{comp.subject}</span>
                            <span className="text-[10px] text-[#00FF00] font-black">{comp.score}</span>
                          </div>
                          <div className="h-1 bg-zinc-900 overflow-hidden">
                            <div 
                              className="h-full bg-[#00FF00]" 
                              style={{ width: `${Math.min(100, (comp.score / comp.fullMark) * 100)}%` }} 
                            />
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Honors & Accolades */}
                {profile?.honors && profile.honors.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 pt-1">
                    {profile.honors.map((honor, i) => (
                      <span
                        key={i}
                        className="px-2 py-0.5 bg-white/5 border border-white/10 text-zinc-300 text-[10px] font-bold uppercase flex items-center gap-1"
                      >
                        <Award className="w-3 h-3 text-[#F27D26]" />
                        {honor}
                      </span>
                    ))}
                  </div>
                )}

                {/* AI Assessment / Critique */}
                {profile?.aiAssessment && (
                  <div className="bg-[#00FF00]/5 border border-[#00FF00]/30 p-3 text-xs space-y-1.5">
                    <div className="flex items-center gap-1.5 text-[#00FF00] font-black text-[10px] uppercase">
                      <Sparkles className="w-3.5 h-3.5" />
                      <span>GEMINI TACTICAL ASSESSMENT</span>
                    </div>
                    <p className="text-zinc-300 text-[11px] leading-relaxed">
                      "{profile.aiAssessment.tacticalCritique}"
                    </p>
                  </div>
                )}
              </>
            )}
          </div>

          {/* Footer Controls */}
          <div className="p-3 bg-black/90 border-t border-white/10 flex items-center justify-between text-xs shrink-0">
            <span className="text-zinc-500 text-[10px] uppercase">
              ALGOARENA // LIVE DUEL TELEMETRY
            </span>
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-1.5 bg-zinc-800 hover:bg-zinc-700 text-white font-bold uppercase text-[10px] tracking-wider transition-colors cursor-pointer"
            >
              CLOSE DOSSIER
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
