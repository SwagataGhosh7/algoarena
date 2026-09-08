import React, { useEffect, useState } from 'react';
import { 
  X, 
  MessageSquare, 
  Swords, 
  Trophy, 
  Flame, 
  ShieldCheck, 
  ExternalLink,
  RefreshCw,
  UserCheck,
  UserPlus
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useStore } from '../store';
import { apiUrl } from '../api';
import { getSocket } from '../socket';
import { FriendActions } from './FriendActions';
import clsx from 'clsx';

interface UserProfileDetailsModalProps {
  username: string | null;
  onClose: () => void;
}

interface ProfileDetails {
  username: string;
  name?: string;
  elo: number;
  rank?: string;
  totalDuels: number;
  wins: number;
  losses: number;
  winRate: number;
  streak: number;
  bestStreak?: number;
  nationality?: string;
  region?: string;
  photoURL?: string;
  badges?: string[];
  favoriteLanguage?: string;
}

export const UserProfileDetailsModal: React.FC<UserProfileDetailsModalProps> = ({ username, onClose }) => {
  const navigate = useNavigate();
  const { 
    currentUser, 
    accountProfile, 
    openPrivateChatWithUser,
    setAuthModalOpen 
  } = useStore();
  const [profile, setProfile] = useState<ProfileDetails | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isOnline, setIsOnline] = useState<boolean>(false);
  const [challengeSent, setChallengeSent] = useState<boolean>(false);

  const isCurrentSelf = Boolean(
    username && (
      (accountProfile?.username && accountProfile.username.toLowerCase() === username.toLowerCase()) ||
      (currentUser?.name && currentUser.name.toLowerCase() === username.toLowerCase())
    )
  );

  useEffect(() => {
    if (!username) {
      setProfile(null);
      return;
    }

    setIsLoading(true);
    setChallengeSent(false);

    // Check online status
    fetch(apiUrl('/api/online-status'))
      .then(res => res.ok ? res.json() : null)
      .then(data => {
        if (data?.onlineUsernames) {
          setIsOnline(data.onlineUsernames.includes(username.toLowerCase()));
        }
      })
      .catch(() => {});

    // Fetch user profile details
    fetch(apiUrl(`/api/user-profile/${encodeURIComponent(username)}`))
      .then(res => res.ok ? res.json() : null)
      .then(data => {
        if (data) {
          const total = data.totalDuels || ((data.wins || 0) + (data.losses || 0)) || 0;
          const wr = total > 0 ? Math.round(((data.wins || 0) / total) * 100) : 0;
          setProfile({
            username: data.username || username,
            name: data.name,
            elo: data.elo || 1200,
            rank: data.rank || (data.elo >= 2200 ? 'Grandmaster' : data.elo >= 1800 ? 'Master' : data.elo >= 1500 ? 'Diamond' : 'Challenger'),
            totalDuels: total,
            wins: data.wins || 0,
            losses: data.losses || 0,
            winRate: wr,
            streak: data.streak || 0,
            bestStreak: data.bestStreak || data.streak || 0,
            nationality: data.nationality || 'GLOBAL',
            region: data.region || 'US-EAST',
            photoURL: data.photoURL,
            badges: data.badges || ['OPERATOR_GRID_ALPHA'],
            favoriteLanguage: data.favoriteLanguage || 'TypeScript'
          });
        } else {
          // Fallback minimal profile
          setProfile({
            username,
            elo: 1250,
            rank: 'Challenger',
            totalDuels: 5,
            wins: 3,
            losses: 2,
            winRate: 60,
            streak: 1,
            nationality: 'GLOBAL',
            region: 'GLOBAL',
            favoriteLanguage: 'TypeScript',
            badges: ['GRID_WARRIOR']
          });
        }
      })
      .catch(() => {
        setProfile({
          username,
          elo: 1200,
          rank: 'Duelist',
          totalDuels: 0,
          wins: 0,
          losses: 0,
          winRate: 0,
          streak: 0,
          nationality: 'GLOBAL',
          region: 'GLOBAL',
          favoriteLanguage: 'JavaScript',
        });
      })
      .finally(() => {
        setIsLoading(false);
      });
  }, [username]);

  if (!username) return null;

  const handleStartPrivateChat = () => {
    openPrivateChatWithUser(username);
    onClose();
  };

  const handleSendChallenge = () => {
    const socket = getSocket();
    if (!socket || !socket.connected) return;

    socket.emit('send_direct_challenge', {
      targetUsername: username,
      difficulty: 'medium',
      topic: 'Algorithms & Data Structures'
    });

    setChallengeSent(true);
    setTimeout(() => setChallengeSent(false), 5000);
  };

  const handleViewFullProfile = () => {
    navigate(`/profile/${encodeURIComponent(username)}`);
    onClose();
  };

  return (
    <div 
      className="fixed inset-0 z-50 bg-black/80 backdrop-blur-xs flex items-center justify-center p-4 font-mono select-none"
      onClick={onClose}
    >
      <div 
        className="bg-[#0b0b0b] border border-white/20 w-full max-w-md shadow-[0_15px_50px_rgba(0,0,0,0.9)] text-left relative overflow-hidden animate-in fade-in zoom-in-95 duration-150"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Terminal Header Bar */}
        <div className="bg-[#141414] border-b border-white/10 px-4 py-2.5 flex items-center justify-between">
          <div className="flex items-center gap-2 text-xs text-zinc-300 font-bold uppercase tracking-wider">
            <span className="w-2 h-2 rounded-full bg-[#00FF00] animate-pulse" />
            <span>OPERATOR DOSSIER // {username}</span>
          </div>
          <button 
            onClick={onClose}
            className="text-zinc-500 hover:text-white transition-colors p-1"
            title="Close dossier"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {isLoading ? (
          <div className="py-20 flex flex-col items-center justify-center gap-3 text-zinc-500">
            <RefreshCw className="w-6 h-6 animate-spin text-[#00FF00]" />
            <span className="text-xs uppercase tracking-widest text-zinc-400">RETRIEVING AGENT METRICS...</span>
          </div>
        ) : profile ? (
          <div className="p-5 flex flex-col gap-5">
            {/* User Hero Banner */}
            <div className="flex items-start gap-4">
              <div className="relative">
                <div className="w-16 h-16 bg-[#161616] border border-white/20 flex items-center justify-center text-xl font-bold uppercase text-[#00FF00] shadow-[0_0_15px_rgba(0,255,0,0.15)] overflow-hidden">
                  {profile.photoURL ? (
                    <img 
                      src={profile.photoURL} 
                      alt={profile.username} 
                      referrerPolicy="no-referrer"
                      className="w-full h-full object-cover" 
                    />
                  ) : (
                    profile.username.slice(0, 2)
                  )}
                </div>
                {/* Live Online Badge */}
                <div 
                  className={clsx(
                    "absolute -bottom-1 -right-1 px-1.5 py-0.5 text-[8px] font-black uppercase border tracking-widest",
                    isOnline 
                      ? "bg-[#00FF00] text-black border-black shadow-[0_0_8px_rgba(0,255,0,0.5)]" 
                      : "bg-zinc-800 text-zinc-400 border-zinc-700"
                  )}
                >
                  {isOnline ? 'ONLINE' : 'IDLE'}
                </div>
              </div>

              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <h3 className="text-lg font-black uppercase tracking-tight text-white truncate">
                    {profile.username}
                  </h3>
                  {profile.nationality && (
                    <span className="text-[10px] bg-zinc-900 border border-white/10 px-1.5 py-0.5 text-zinc-400 font-bold uppercase">
                      {profile.nationality}
                    </span>
                  )}
                </div>

                <div className="text-xs text-zinc-400 mt-1 flex items-center gap-2">
                  <span className="text-[#00FF00] font-bold">{profile.elo} ELO</span>
                  <span className="text-zinc-600">•</span>
                  <span className="text-zinc-300 font-bold uppercase">{profile.rank}</span>
                </div>

                {/* Friend Status Component */}
                {!isCurrentSelf && (
                  <div className="mt-2.5">
                    <FriendActions username={profile.username} showProfileLink={false} />
                  </div>
                )}
              </div>
            </div>

            {/* Performance Metric Grid */}
            <div className="grid grid-cols-4 gap-2 bg-[#101010] p-3 border border-white/10 text-center">
              <div>
                <div className="text-[9px] uppercase tracking-wider text-zinc-500 font-bold">RECORD</div>
                <div className="text-xs font-bold text-white mt-0.5">
                  <span className="text-[#00FF00]">{profile.wins}W</span>
                  <span className="text-zinc-600 mx-0.5">-</span>
                  <span className="text-zinc-400">{profile.losses}L</span>
                </div>
              </div>

              <div>
                <div className="text-[9px] uppercase tracking-wider text-zinc-500 font-bold">WIN RATE</div>
                <div className="text-xs font-bold text-zinc-200 mt-0.5">
                  {profile.winRate}%
                </div>
              </div>

              <div>
                <div className="text-[9px] uppercase tracking-wider text-zinc-500 font-bold">STREAK</div>
                <div className="text-xs font-bold text-[#F27D26] mt-0.5 flex items-center justify-center gap-0.5">
                  <Flame className="w-3 h-3" />
                  <span>{profile.streak}</span>
                </div>
              </div>

              <div>
                <div className="text-[9px] uppercase tracking-wider text-zinc-500 font-bold">LANGUAGE</div>
                <div className="text-xs font-bold text-zinc-300 mt-0.5 uppercase truncate">
                  {profile.favoriteLanguage}
                </div>
              </div>
            </div>

            {/* Notification if challenge sent */}
            {challengeSent && (
              <div className="p-2 bg-[#00FF00]/10 border border-[#00FF00] text-[#00FF00] text-xs font-bold uppercase text-center animate-pulse">
                ⚔️ DIRECT DUEL CHALLENGE DISPATCHED TO {profile.username}!
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex flex-col gap-2 pt-2 border-t border-white/10">
              {!isCurrentSelf && (
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={handleStartPrivateChat}
                    className="flex items-center justify-center gap-2 py-2 px-3 bg-[#00FF00] text-black font-black uppercase text-xs hover:bg-[#00dd00] transition-colors cursor-pointer shadow-[0_0_12px_rgba(0,255,0,0.3)]"
                  >
                    <MessageSquare className="w-3.5 h-3.5" />
                    <span>PRIVATE CHAT</span>
                  </button>

                  <button
                    type="button"
                    onClick={handleSendChallenge}
                    disabled={challengeSent}
                    className="flex items-center justify-center gap-2 py-2 px-3 bg-black border border-[#F27D26] text-[#F27D26] hover:bg-[#F27D26] hover:text-black font-black uppercase text-xs transition-colors cursor-pointer disabled:opacity-50"
                  >
                    <Swords className="w-3.5 h-3.5" />
                    <span>{challengeSent ? 'CHALLENGE SENT' : '1V1 DUEL'}</span>
                  </button>
                </div>
              )}

              <button
                type="button"
                onClick={handleViewFullProfile}
                className="w-full flex items-center justify-center gap-2 py-2 px-3 bg-black border border-white/15 text-zinc-300 hover:text-white hover:border-white/30 font-bold uppercase text-xs transition-colors cursor-pointer"
              >
                <ExternalLink className="w-3.5 h-3.5" />
                <span>VIEW COMPLETE DOSSIER</span>
              </button>
            </div>
          </div>
        ) : null}
      </div>
    </div>
  );
};
