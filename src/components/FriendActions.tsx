import { useEffect, useState } from 'react';
import { Check, Clock3, UserPlus, Users, X } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useStore } from '../store';
import { apiUrl } from '../api';

type FriendStatus = 'none' | 'pending' | 'incoming' | 'friends' | 'self';

interface FriendActionsProps {
  username?: string;
  compact?: boolean;
  showProfileLink?: boolean;
}

export function FriendActions({ username, compact = false, showProfileLink = true }: FriendActionsProps) {
  const navigate = useNavigate();
  const { accountProfile, setAuthModalOpen } = useStore();
  const viewer = accountProfile?.username;
  const [status, setStatus] = useState<FriendStatus>('none');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!username || !viewer || username.toLowerCase() === viewer.toLowerCase()) {
      setStatus(username && viewer && username.toLowerCase() === viewer.toLowerCase() ? 'self' : 'none');
      return;
    }

    let cancelled = false;
    fetch(apiUrl(`/api/friends?username=${encodeURIComponent(username)}&viewer=${encodeURIComponent(viewer)}`))
      .then(res => res.ok ? res.json() : null)
      .then(data => {
        if (!cancelled && data?.status) setStatus(data.status);
      })
      .catch(() => {});
    return () => { cancelled = true; };
  }, [username, viewer]);

  if (!username || username === 'AlgoArena Bot' || username.toLowerCase().includes('bot')) return null;

  const sendRequest = async () => {
    if (!viewer) {
      setAuthModalOpen(true);
      return;
    }
    setLoading(true);
    try {
      const res = await fetch(apiUrl('/api/friends/request'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ from: viewer, to: username }),
      });
      if (res.ok) setStatus('pending');
    } finally {
      setLoading(false);
    }
  };

  const respond = async (accept: boolean) => {
    if (!viewer) return;
    setLoading(true);
    try {
      const res = await fetch(apiUrl('/api/friends/respond'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: viewer, requester: username, accept }),
      });
      if (res.ok) setStatus(accept ? 'friends' : 'none');
    } finally {
      setLoading(false);
    }
  };

  const profileButton = showProfileLink && (
    <button
      type="button"
      onClick={() => navigate(`/profile/${encodeURIComponent(username)}`)}
      className="text-zinc-400 hover:text-white transition-colors"
      title={`Inspect ${username}'s profile`}
    >
      {compact ? 'INSPECT' : 'INSPECT PROFILE'}
    </button>
  );

  if (status === 'self') return profileButton;
  if (status === 'friends') {
    return (
      <div className="flex items-center gap-2 text-[#00FF00] font-mono text-[10px] uppercase font-bold">
        <Users className="w-3.5 h-3.5" /> FRIENDS
        {profileButton}
      </div>
    );
  }
  if (status === 'pending') {
    return (
      <div className="flex items-center gap-2 text-zinc-400 font-mono text-[10px] uppercase font-bold">
        <Clock3 className="w-3.5 h-3.5" /> REQUEST SENT
        {profileButton}
      </div>
    );
  }
  if (status === 'incoming') {
    return (
      <div className="flex items-center gap-1.5">
        <button type="button" disabled={loading} onClick={() => respond(true)} className="flex items-center gap-1 px-2 py-1 bg-[#00FF00] text-black font-mono text-[10px] font-black uppercase disabled:opacity-50">
          <Check className="w-3 h-3" /> ACCEPT
        </button>
        <button type="button" disabled={loading} onClick={() => respond(false)} className="p-1 text-zinc-500 hover:text-red-400 disabled:opacity-50" title="Decline friend request">
          <X className="w-3.5 h-3.5" />
        </button>
        {profileButton}
      </div>
    );
  }

  return (
    <div className="flex items-center gap-2">
      <button
        type="button"
        disabled={loading}
        onClick={sendRequest}
        className="flex items-center gap-1.5 px-2.5 py-1 bg-[#00FF00]/10 border border-[#00FF00]/50 text-[#00FF00] hover:bg-[#00FF00]/20 font-mono text-[10px] font-black uppercase disabled:opacity-50"
      >
        <UserPlus className="w-3 h-3" /> {loading ? 'SENDING...' : 'ADD FRIEND'}
      </button>
      {profileButton}
    </div>
  );
}
