import React, { useState, useEffect, useCallback } from 'react';
import { 
  Users, 
  UserPlus, 
  MessageSquare, 
  Swords, 
  Check, 
  X, 
  Clock3, 
  Trash2, 
  ExternalLink,
  Search,
  RefreshCw,
  UserCheck
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useStore } from '../store';
import { apiUrl } from '../api';
import { getSocket } from '../socket';
import clsx from 'clsx';

interface FriendData {
  username: string;
  elo: number;
  isOnline: boolean;
  photoURL?: string;
  nationality?: string;
}

export const FriendsModal: React.FC = () => {
  const navigate = useNavigate();
  const { 
    currentUser, 
    accountProfile, 
    isFriendsModalOpen, 
    setFriendsModalOpen,
    openPrivateChatWithUser,
    setAuthModalOpen,
    setInspectedUserForDetails
  } = useStore();

  const [activeTab, setActiveTab] = useState<'friends' | 'incoming' | 'pending' | 'add'>('friends');
  const [friendsList, setFriendsList] = useState<FriendData[]>([]);
  const [incomingRequests, setIncomingRequests] = useState<string[]>([]);
  const [outgoingRequests, setOutgoingRequests] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [addHandle, setAddHandle] = useState<string>('');
  const [addMessage, setAddMessage] = useState<{ text: string; type: 'success' | 'error' } | null>(null);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [searchFilter, setSearchFilter] = useState<string>('');

  const myUsername = accountProfile?.username || currentUser?.name;

  const fetchFriends = useCallback(async () => {
    if (!myUsername) return;
    setIsLoading(true);

    try {
      // 1. Fetch online users
      const onlineRes = await fetch(apiUrl('/api/online-status'));
      const onlineData = onlineRes.ok ? await onlineRes.json() : null;
      const onlineSet = new Set<string>((onlineData?.onlineUsernames || []).map((u: string) => u.toLowerCase()));

      // 2. Fetch friends graph
      const res = await fetch(apiUrl(`/api/friends?username=${encodeURIComponent(myUsername)}`));
      if (!res.ok) return;
      const data = await res.json();

      setIncomingRequests(data.incomingFriendRequests || []);
      setOutgoingRequests(data.outgoingFriendRequests || []);

      const friendNames: string[] = data.friends || [];
      // Fetch details for each friend in parallel
      const detailedFriends = await Promise.all(
        friendNames.map(async (name): Promise<FriendData> => {
          try {
            const pRes = await fetch(apiUrl(`/api/user-profile/${encodeURIComponent(name)}`));
            const pData = pRes.ok ? await pRes.json() : null;
            return {
              username: name,
              elo: pData?.elo || 1200,
              isOnline: onlineSet.has(name.toLowerCase()),
              photoURL: pData?.photoURL,
              nationality: pData?.nationality,
            };
          } catch {
            return {
              username: name,
              elo: 1200,
              isOnline: onlineSet.has(name.toLowerCase()),
            };
          }
        })
      );

      // Sort: online first, then by ELO descending
      detailedFriends.sort((a, b) => {
        if (a.isOnline === b.isOnline) {
          return b.elo - a.elo;
        }
        return a.isOnline ? -1 : 1;
      });

      setFriendsList(detailedFriends);
    } catch (e) {
      console.error('Failed to load friends', e);
    } finally {
      setIsLoading(false);
    }
  }, [myUsername]);

  useEffect(() => {
    if (isFriendsModalOpen) {
      fetchFriends();
    }
  }, [isFriendsModalOpen, fetchFriends]);

  // Real-time friend update listener
  useEffect(() => {
    const socket = getSocket();
    if (!socket) return;

    const handleFriendUpdate = () => {
      if (isFriendsModalOpen) {
        fetchFriends();
      }
    };

    socket.on('friend_update', handleFriendUpdate);
    return () => {
      socket.off('friend_update', handleFriendUpdate);
    };
  }, [isFriendsModalOpen, fetchFriends]);

  if (!isFriendsModalOpen) return null;

  const handleSendFriendRequest = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanTarget = addHandle.trim();
    if (!cleanTarget) return;

    if (!myUsername) {
      setAuthModalOpen(true);
      return;
    }

    if (cleanTarget.toLowerCase() === myUsername.toLowerCase()) {
      setAddMessage({ text: 'You cannot send a friend request to yourself.', type: 'error' });
      return;
    }

    setIsSubmitting(true);
    setAddMessage(null);

    try {
      const res = await fetch(apiUrl('/api/friends/request'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ from: myUsername, to: cleanTarget }),
      });
      const data = await res.json();
      if (res.ok) {
        if (data.status === 'friends') {
          setAddMessage({ text: `You are already friends with ${cleanTarget}!`, type: 'success' });
        } else {
          setAddMessage({ text: `Friend request dispatched to ${cleanTarget}!`, type: 'success' });
        }
        setAddHandle('');
        fetchFriends();
      } else {
        setAddMessage({ text: data.error || 'Failed to dispatch friend request', type: 'error' });
      }
    } catch {
      setAddMessage({ text: 'Network protocol error dispatching request', type: 'error' });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleRespond = async (requesterName: string, accept: boolean) => {
    if (!myUsername) return;
    try {
      await fetch(apiUrl('/api/friends/respond'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: myUsername, requester: requesterName, accept }),
      });
      fetchFriends();
    } catch (e) {
      console.error('Failed to respond to friend request', e);
    }
  };

  const handleRemoveFriend = async (friendName: string) => {
    if (!myUsername) return;
    if (!window.confirm(`Are you sure you want to remove ${friendName} from your friends list?`)) return;

    try {
      await fetch(apiUrl('/api/friends/remove'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: myUsername, friend: friendName }),
      });
      fetchFriends();
    } catch (e) {
      console.error('Failed to remove friend', e);
    }
  };

  const handleStartPrivateMessage = (friendUsername: string) => {
    openPrivateChatWithUser(friendUsername);
    setFriendsModalOpen(false);
  };

  const handleDirectDuel = (friendUsername: string) => {
    const socket = getSocket();
    if (socket && socket.connected) {
      socket.emit('send_direct_challenge', {
        targetUsername: friendUsername,
        difficulty: 'medium',
        topic: 'Algorithms & Data Structures',
      });
      setFriendsModalOpen(false);
    }
  };

  const filteredFriends = friendsList.filter(f => 
    f.username.toLowerCase().includes(searchFilter.toLowerCase())
  );

  return (
    <div 
      className="fixed inset-0 z-50 bg-black/80 backdrop-blur-xs flex items-center justify-center p-4 font-mono select-none"
      onClick={() => setFriendsModalOpen(false)}
    >
      <div 
        className="bg-[#0c0c0c] border border-white/20 w-full max-w-xl shadow-[0_20px_60px_rgba(0,0,0,0.9)] text-left relative flex flex-col max-h-[85vh] overflow-hidden animate-in fade-in zoom-in-95 duration-150"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Terminal Header Bar */}
        <div className="bg-[#141414] border-b border-white/10 px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <Users className="w-4 h-4 text-[#00FF00]" />
            <span className="text-xs text-white font-bold uppercase tracking-wider">
              FRIEND NETWORK // {myUsername || 'AGENT'}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={fetchFriends}
              className="text-zinc-400 hover:text-white p-1 hover:bg-white/5 transition-colors"
              title="Refresh friends status"
            >
              <RefreshCw className={clsx("w-3.5 h-3.5", isLoading && "animate-spin text-[#00FF00]")} />
            </button>
            <button 
              onClick={() => setFriendsModalOpen(false)}
              className="text-zinc-500 hover:text-white p-1 hover:bg-white/5 transition-colors"
              title="Close network"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="flex border-b border-white/10 bg-[#0a0a0a] text-xs">
          <button
            onClick={() => setActiveTab('friends')}
            className={clsx(
              "flex-1 py-2.5 px-3 font-bold uppercase transition-all flex items-center justify-center gap-1.5 border-b-2 cursor-pointer",
              activeTab === 'friends'
                ? "border-[#00FF00] text-[#00FF00] bg-white/[0.03]"
                : "border-transparent text-zinc-400 hover:text-zinc-200"
            )}
          >
            <span>FRIENDS</span>
            <span className="bg-zinc-800 text-zinc-300 text-[10px] px-1.5 py-0.2 rounded-none font-black">
              {friendsList.length}
            </span>
          </button>

          <button
            onClick={() => setActiveTab('incoming')}
            className={clsx(
              "flex-1 py-2.5 px-3 font-bold uppercase transition-all flex items-center justify-center gap-1.5 border-b-2 cursor-pointer",
              activeTab === 'incoming'
                ? "border-[#00FF00] text-[#00FF00] bg-white/[0.03]"
                : "border-transparent text-zinc-400 hover:text-zinc-200"
            )}
          >
            <span>REQUESTS</span>
            {incomingRequests.length > 0 && (
              <span className="bg-[#00FF00] text-black text-[10px] px-1.5 py-0.2 rounded-none font-black animate-pulse">
                {incomingRequests.length}
              </span>
            )}
          </button>

          <button
            onClick={() => setActiveTab('pending')}
            className={clsx(
              "flex-1 py-2.5 px-3 font-bold uppercase transition-all flex items-center justify-center gap-1.5 border-b-2 cursor-pointer",
              activeTab === 'pending'
                ? "border-[#00FF00] text-[#00FF00] bg-white/[0.03]"
                : "border-transparent text-zinc-400 hover:text-zinc-200"
            )}
          >
            <span>PENDING</span>
            {outgoingRequests.length > 0 && (
              <span className="bg-zinc-800 text-zinc-300 text-[10px] px-1.5 py-0.2 rounded-none font-black">
                {outgoingRequests.length}
              </span>
            )}
          </button>

          <button
            onClick={() => setActiveTab('add')}
            className={clsx(
              "flex-1 py-2.5 px-3 font-bold uppercase transition-all flex items-center justify-center gap-1.5 border-b-2 cursor-pointer",
              activeTab === 'add'
                ? "border-[#00FF00] text-[#00FF00] bg-white/[0.03]"
                : "border-transparent text-zinc-400 hover:text-zinc-200"
            )}
          >
            <UserPlus className="w-3.5 h-3.5" />
            <span>ADD FRIEND</span>
          </button>
        </div>

        {/* Tab Content */}
        <div className="p-4 flex-1 overflow-y-auto">
          {/* TAB: FRIENDS LIST */}
          {activeTab === 'friends' && (
            <div className="flex flex-col gap-3">
              {friendsList.length > 3 && (
                <div className="relative mb-1">
                  <Search className="w-3.5 h-3.5 text-zinc-500 absolute left-2.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={searchFilter}
                    onChange={(e) => setSearchFilter(e.target.value)}
                    placeholder="Filter friends by name..."
                    className="w-full bg-black border border-white/10 pl-8 pr-3 py-1.5 text-xs text-white placeholder:text-zinc-600 outline-none focus:border-[#00FF00]"
                  />
                </div>
              )}

              {isLoading && friendsList.length === 0 ? (
                <div className="py-12 flex flex-col items-center justify-center gap-2 text-zinc-500">
                  <RefreshCw className="w-5 h-5 animate-spin text-[#00FF00]" />
                  <span className="text-xs uppercase tracking-wider">SYNCING FRIEND PROTOCOL...</span>
                </div>
              ) : filteredFriends.length === 0 ? (
                <div className="py-12 text-center text-zinc-500 flex flex-col items-center gap-2">
                  <Users className="w-8 h-8 text-zinc-700" />
                  <p className="text-xs uppercase font-bold text-zinc-400">
                    {searchFilter ? 'NO FRIENDS MATCH FILTER' : 'NO FRIENDS CONNECTED YET'}
                  </p>
                  <p className="text-[11px] text-zinc-600 max-w-xs">
                    Challenge operators in the Global Lobby or use the 'ADD FRIEND' tab to build your duelist squad.
                  </p>
                  <button
                    onClick={() => setActiveTab('add')}
                    className="mt-2 px-3 py-1.5 bg-[#00FF00]/10 border border-[#00FF00]/40 text-[#00FF00] hover:bg-[#00FF00] hover:text-black font-black uppercase text-xs transition-all cursor-pointer"
                  >
                    + ADD FIRST FRIEND
                  </button>
                </div>
              ) : (
                <div className="divide-y divide-white/5 border border-white/10 bg-[#080808]">
                  {filteredFriends.map((friend) => (
                    <div 
                      key={friend.username}
                      className="p-3 flex items-center justify-between gap-3 hover:bg-white/[0.02] transition-colors"
                    >
                      <div 
                        className="flex items-center gap-3 cursor-pointer group flex-1 min-w-0"
                        onClick={() => setInspectedUserForDetails(friend.username)}
                      >
                        <div className="relative shrink-0">
                          <div className="w-9 h-9 bg-zinc-900 border border-white/10 flex items-center justify-center font-bold text-xs uppercase text-[#00FF00] overflow-hidden">
                            {friend.photoURL ? (
                              <img 
                                src={friend.photoURL} 
                                alt={friend.username} 
                                referrerPolicy="no-referrer"
                                className="w-full h-full object-cover" 
                              />
                            ) : (
                              friend.username.slice(0, 2)
                            )}
                          </div>
                          <span 
                            className={clsx(
                              "absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full border border-black",
                              friend.isOnline ? "bg-[#00FF00] animate-pulse" : "bg-zinc-600"
                            )}
                            title={friend.isOnline ? 'Online' : 'Offline'}
                          />
                        </div>

                        <div className="min-w-0">
                          <div className="flex items-center gap-1.5">
                            <span className="text-xs font-black uppercase text-white group-hover:text-[#00FF00] transition-colors truncate">
                              {friend.username}
                            </span>
                            {friend.nationality && (
                              <span className="text-[9px] bg-black border border-white/10 px-1 py-0.2 text-zinc-500 font-bold uppercase">
                                {friend.nationality}
                              </span>
                            )}
                          </div>
                          <div className="text-[10px] text-zinc-400 mt-0.5 flex items-center gap-2">
                            <span className="text-[#00FF00] font-bold">{friend.elo} ELO</span>
                            <span className="text-zinc-600">•</span>
                            <span className={friend.isOnline ? "text-[#00FF00]" : "text-zinc-500"}>
                              {friend.isOnline ? 'ONLINE' : 'OFFLINE'}
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Action buttons */}
                      <div className="flex items-center gap-1.5 shrink-0">
                        <button
                          type="button"
                          onClick={() => handleStartPrivateMessage(friend.username)}
                          className="px-2.5 py-1 bg-[#00FF00]/10 hover:bg-[#00FF00] border border-[#00FF00]/40 text-[#00FF00] hover:text-black font-black uppercase text-[10px] flex items-center gap-1 transition-all cursor-pointer"
                          title={`Send private message to ${friend.username}`}
                        >
                          <MessageSquare className="w-3 h-3" />
                          <span className="hidden sm:inline">MESSAGE</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => handleDirectDuel(friend.username)}
                          className="px-2 py-1 bg-black hover:bg-[#F27D26] border border-[#F27D26]/40 text-[#F27D26] hover:text-black font-black uppercase text-[10px] flex items-center gap-1 transition-all cursor-pointer"
                          title={`Direct 1v1 challenge ${friend.username}`}
                        >
                          <Swords className="w-3 h-3" />
                          <span className="hidden sm:inline">1V1</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => handleRemoveFriend(friend.username)}
                          className="p-1 text-zinc-600 hover:text-red-400 transition-colors"
                          title={`Remove ${friend.username} from friends`}
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* TAB: INCOMING REQUESTS */}
          {activeTab === 'incoming' && (
            <div className="flex flex-col gap-2">
              {incomingRequests.length === 0 ? (
                <div className="py-12 text-center text-zinc-500 flex flex-col items-center gap-2">
                  <UserCheck className="w-8 h-8 text-zinc-700" />
                  <p className="text-xs uppercase font-bold text-zinc-400">NO INCOMING FRIEND REQUESTS</p>
                  <p className="text-[11px] text-zinc-600">
                    When other duelists send you friend requests, they will appear here for instant acceptance.
                  </p>
                </div>
              ) : (
                <div className="divide-y divide-white/5 border border-white/10 bg-[#080808]">
                  {incomingRequests.map((requester) => (
                    <div key={requester} className="p-3 flex items-center justify-between gap-3">
                      <div 
                        className="flex items-center gap-2.5 cursor-pointer"
                        onClick={() => setInspectedUserForDetails(requester)}
                      >
                        <div className="w-8 h-8 bg-zinc-900 border border-white/10 flex items-center justify-center font-bold text-xs uppercase text-[#00FF00]">
                          {requester.slice(0, 2)}
                        </div>
                        <div>
                          <div className="text-xs font-bold text-white uppercase">{requester}</div>
                          <div className="text-[10px] text-zinc-500">Wants to add you as a friend</div>
                        </div>
                      </div>

                      <div className="flex items-center gap-1.5">
                        <button
                          type="button"
                          onClick={() => handleRespond(requester, true)}
                          className="px-3 py-1 bg-[#00FF00] text-black font-black uppercase text-xs flex items-center gap-1 hover:bg-[#00dd00] transition-colors cursor-pointer"
                        >
                          <Check className="w-3.5 h-3.5" />
                          <span>ACCEPT</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => handleRespond(requester, false)}
                          className="px-2.5 py-1 bg-black border border-white/15 text-zinc-400 hover:text-red-400 hover:border-red-500/50 font-bold uppercase text-xs transition-colors cursor-pointer"
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* TAB: PENDING OUTGOING */}
          {activeTab === 'pending' && (
            <div className="flex flex-col gap-2">
              {outgoingRequests.length === 0 ? (
                <div className="py-12 text-center text-zinc-500 flex flex-col items-center gap-2">
                  <Clock3 className="w-8 h-8 text-zinc-700" />
                  <p className="text-xs uppercase font-bold text-zinc-400">NO PENDING OUTGOING REQUESTS</p>
                  <p className="text-[11px] text-zinc-600">
                    Requests you send to other duelists will be tracked here until accepted.
                  </p>
                </div>
              ) : (
                <div className="divide-y divide-white/5 border border-white/10 bg-[#080808]">
                  {outgoingRequests.map((target) => (
                    <div key={target} className="p-3 flex items-center justify-between gap-3">
                      <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 bg-zinc-900 border border-white/10 flex items-center justify-center font-bold text-xs uppercase text-zinc-400">
                          {target.slice(0, 2)}
                        </div>
                        <div>
                          <div className="text-xs font-bold text-white uppercase">{target}</div>
                          <div className="text-[10px] text-zinc-500 flex items-center gap-1">
                            <Clock3 className="w-3 h-3 text-zinc-500" />
                            <span>Awaiting response...</span>
                          </div>
                        </div>
                      </div>

                      <button
                        type="button"
                        onClick={() => handleRespond(target, false)}
                        className="px-2.5 py-1 bg-black border border-white/10 text-zinc-400 hover:text-white font-bold uppercase text-[10px] transition-colors"
                      >
                        CANCEL
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* TAB: ADD FRIEND */}
          {activeTab === 'add' && (
            <form onSubmit={handleSendFriendRequest} className="flex flex-col gap-4 py-2">
              <div>
                <label className="block text-xs uppercase font-bold text-zinc-300 mb-1.5">
                  ENTER DUELIST HANDLE OR USERNAME
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={addHandle}
                    onChange={(e) => setAddHandle(e.target.value)}
                    placeholder="e.g. CyberRonin_99, NullPointerQueen"
                    className="flex-1 bg-black border border-white/20 px-3 py-2 text-xs text-white placeholder:text-zinc-600 outline-none focus:border-[#00FF00] transition-colors"
                    autoFocus
                  />
                  <button
                    type="submit"
                    disabled={isSubmitting || !addHandle.trim()}
                    className="px-4 py-2 bg-[#00FF00] text-black font-black uppercase text-xs hover:bg-[#00dd00] disabled:opacity-50 transition-all cursor-pointer flex items-center gap-1.5"
                  >
                    <UserPlus className="w-3.5 h-3.5" />
                    <span>{isSubmitting ? 'SENDING...' : 'DISPATCH REQUEST'}</span>
                  </button>
                </div>
              </div>

              {addMessage && (
                <div 
                  className={clsx(
                    "p-2.5 text-xs font-bold uppercase border",
                    addMessage.type === 'success' 
                      ? "bg-[#00FF00]/10 border-[#00FF00] text-[#00FF00]" 
                      : "bg-red-500/10 border-red-500/50 text-red-400"
                  )}
                >
                  {addMessage.text}
                </div>
              )}

              <div className="bg-[#090909] border border-white/10 p-3 text-[11px] text-zinc-400 leading-relaxed">
                <span className="text-[#00FF00] font-bold">PRO-TIP:</span> You can also click on any operator's handle directly in the Global Lobby Chat, Arena Post-Match Summary, or Global Leaderboard to view their dossier and click <span className="text-white font-bold">"ADD FRIEND"</span> with a single tap.
              </div>
            </form>
          )}
        </div>

        {/* Footer info */}
        <div className="bg-[#0a0a0a] border-t border-white/10 px-4 py-2 flex items-center justify-between text-[10px] text-zinc-500 uppercase">
          <span>ALGOARENA SOCIAL MESH</span>
          <span>{friendsList.filter(f => f.isOnline).length} ONLINE NOW</span>
        </div>
      </div>
    </div>
  );
};
