import React, { useState, useEffect } from 'react';
import { 
  Zap, 
  X, 
  Copy, 
  Check, 
  Users, 
  Send, 
  ArrowRight,
  ShieldAlert,
  Sparkles,
  Lock
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { v4 as uuidv4 } from 'uuid';
import { useStore } from '../store';
import { apiUrl } from '../api';
import { getSocket } from '../socket';
import clsx from 'clsx';

interface CreatePrivateRoomModalProps {
  isOpen: boolean;
  onClose: () => void;
}

interface FriendOption {
  username: string;
  isOnline: boolean;
  elo: number;
}

export const CreatePrivateRoomModal: React.FC<CreatePrivateRoomModalProps> = ({ isOpen, onClose }) => {
  const navigate = useNavigate();
  const { currentUser, accountProfile } = useStore();
  const [roomId, setRoomId] = useState<string>('');
  const [topic, setTopic] = useState<string>('Dynamic Programming & Graph Theory');
  const [difficulty, setDifficulty] = useState<'easy' | 'medium' | 'hard'>('medium');
  const [copied, setCopied] = useState<boolean>(false);
  const [friends, setFriends] = useState<FriendOption[]>([]);
  const [invitedFriends, setInvitedFriends] = useState<Record<string, boolean>>({});

  const myUsername = accountProfile?.username || currentUser?.name || 'Duelist';

  useEffect(() => {
    if (isOpen) {
      setRoomId(uuidv4().substring(0, 8));
      setCopied(false);
      setInvitedFriends({});

      // Fetch friends to allow direct invitation
      if (myUsername) {
        fetch(apiUrl(`/api/friends?username=${encodeURIComponent(myUsername)}`))
          .then(res => res.ok ? res.json() : null)
          .then(async data => {
            if (data?.friends?.length) {
              const onlineRes = await fetch(apiUrl('/api/online-status'));
              const onlineData = onlineRes.ok ? await onlineRes.json() : null;
              const onlineSet = new Set<string>((onlineData?.onlineUsernames || []).map((u: string) => u.toLowerCase()));

              const list: FriendOption[] = data.friends.map((name: string) => ({
                username: name,
                isOnline: onlineSet.has(name.toLowerCase()),
                elo: 1200,
              }));
              list.sort((a, b) => (a.isOnline === b.isOnline ? 0 : a.isOnline ? -1 : 1));
              setFriends(list);
            } else {
              setFriends([]);
            }
          })
          .catch(() => {});
      }
    }
  }, [isOpen, myUsername]);

  if (!isOpen) return null;

  const roomLink = `${window.location.origin}/room/${roomId}`;

  const handleCopyLink = () => {
    navigator.clipboard.writeText(roomLink);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  const handleInviteFriend = (friendUsername: string) => {
    const socket = getSocket();
    if (!socket || !socket.connected) return;

    const inviteText = `⚔️ Hey ${friendUsername}, I created a private 1v1 duel room for us! Topic: ${topic} (${difficulty.toUpperCase()}). Click to enter: ${roomLink}`;
    
    // Dispatch via private chat socket
    socket.emit('send_private_chat', {
      toUsername: friendUsername,
      text: inviteText,
      username: myUsername,
    });

    setInvitedFriends(prev => ({ ...prev, [friendUsername]: true }));
  };

  const handleEnterRoom = () => {
    onClose();
    navigate(`/room/${roomId}?topic=${encodeURIComponent(topic)}&difficulty=${difficulty}`);
  };

  return (
    <div 
      className="fixed inset-0 z-50 bg-black/80 backdrop-blur-xs flex items-center justify-center p-4 font-mono select-none"
      onClick={onClose}
    >
      <div 
        className="bg-[#0b0b0b] border border-white/20 w-full max-w-lg shadow-[0_20px_60px_rgba(0,0,0,0.9)] text-left relative flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-150"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Terminal Header */}
        <div className="bg-[#141414] border-b border-white/10 px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Lock className="w-4 h-4 text-[#F27D26]" />
            <span className="text-xs text-white font-bold uppercase tracking-wider">
              INITIALIZE CUSTOM PRIVATE ROOM
            </span>
          </div>
          <button 
            onClick={onClose}
            className="text-zinc-500 hover:text-white p-1 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-5 flex flex-col gap-4">
          {/* Room Key Generation */}
          <div>
            <label className="block text-[11px] uppercase tracking-wider font-bold text-zinc-400 mb-1.5">
              ROOM ACCESS CODE
            </label>
            <div className="flex gap-2">
              <input
                type="text"
                readOnly
                value={roomId}
                className="flex-1 bg-black border border-white/15 px-3 py-2 text-sm text-[#00FF00] font-black tracking-widest outline-none font-mono"
              />
              <button
                type="button"
                onClick={handleCopyLink}
                className={clsx(
                  "px-3.5 py-2 border font-black uppercase text-xs transition-all flex items-center gap-1.5 cursor-pointer",
                  copied 
                    ? "bg-[#00FF00] text-black border-[#00FF00]" 
                    : "bg-black text-white border-white/20 hover:border-white/40"
                )}
              >
                {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copied ? 'COPIED LINK' : 'COPY'}</span>
              </button>
            </div>
          </div>

          {/* Difficulty & Category */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-[10px] uppercase tracking-wider font-bold text-zinc-400 mb-1.5">
                MATCH DIFFICULTY
              </label>
              <div className="grid grid-cols-3 gap-1">
                {(['easy', 'medium', 'hard'] as const).map((diff) => (
                  <button
                    key={diff}
                    type="button"
                    onClick={() => setDifficulty(diff)}
                    className={clsx(
                      "py-1.5 text-center text-xs font-black uppercase border transition-all cursor-pointer",
                      difficulty === diff
                        ? "bg-[#F27D26] text-black border-[#F27D26]"
                        : "bg-black text-zinc-400 border-white/10 hover:border-white/30"
                    )}
                  >
                    {diff}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-[10px] uppercase tracking-wider font-bold text-zinc-400 mb-1.5">
                ALGORITHMIC TOPIC
              </label>
              <select
                value={topic}
                onChange={(e) => setTopic(e.target.value)}
                className="w-full bg-black border border-white/15 px-2.5 py-1.5 text-xs text-white outline-none focus:border-[#F27D26]"
              >
                <option value="Dynamic Programming & Graph Theory">Dynamic Programming</option>
                <option value="Graph Traversal & Shortest Path">Graph Traversal</option>
                <option value="Binary Trees & BST">Trees & BST</option>
                <option value="Sliding Window & Two Pointers">Sliding Window</option>
                <option value="Greedy Algorithms & Heaps">Greedy & Heaps</option>
                <option value="String Matching & Trie">Strings & Trie</option>
              </select>
            </div>
          </div>

          {/* Direct Friend Invitation */}
          {friends.length > 0 && (
            <div className="border border-white/10 bg-[#090909] p-3">
              <div className="flex items-center justify-between mb-2">
                <span className="text-[10px] uppercase font-bold text-zinc-400 flex items-center gap-1.5">
                  <Users className="w-3.5 h-3.5 text-[#00FF00]" />
                  INVITE SQUAD MEMBERS VIA DIRECT MESSAGE
                </span>
                <span className="text-[9px] text-zinc-500">
                  {friends.filter(f => f.isOnline).length} ONLINE
                </span>
              </div>

              <div className="max-h-32 overflow-y-auto divide-y divide-white/5 pr-1">
                {friends.map((friend) => {
                  const isInvited = invitedFriends[friend.username];
                  return (
                    <div key={friend.username} className="py-1.5 flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <span 
                          className={clsx(
                            "w-2 h-2 rounded-full", 
                            friend.isOnline ? "bg-[#00FF00] animate-pulse" : "bg-zinc-600"
                          )} 
                        />
                        <span className="text-xs font-bold uppercase text-white truncate max-w-[150px]">
                          {friend.username}
                        </span>
                      </div>

                      <button
                        type="button"
                        onClick={() => handleInviteFriend(friend.username)}
                        disabled={isInvited}
                        className={clsx(
                          "px-2.5 py-0.5 text-[10px] font-black uppercase tracking-wider border transition-all cursor-pointer",
                          isInvited
                            ? "bg-[#00FF00]/10 border-[#00FF00] text-[#00FF00]"
                            : "bg-black border-white/20 text-zinc-300 hover:text-white hover:border-[#00FF00]"
                        )}
                      >
                        {isInvited ? 'INVITED ✓' : 'SEND INVITE'}
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Action Button */}
          <div className="pt-2 border-t border-white/10 flex gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 bg-black border border-white/15 text-zinc-400 hover:text-white font-bold uppercase text-xs transition-colors cursor-pointer"
            >
              CANCEL
            </button>

            <button
              type="button"
              onClick={handleEnterRoom}
              className="flex-1 px-4 py-2.5 bg-[#F27D26] hover:bg-amber-400 text-black font-black uppercase text-xs tracking-wider flex items-center justify-center gap-2 transition-all cursor-pointer shadow-[0_0_15px_rgba(242,125,38,0.25)]"
            >
              <span>ENTER ARENA & AWAIT CHALLENGER</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
