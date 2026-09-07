import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { 
  MessageSquare, X, ChevronDown, Send, Users, Volume2, VolumeX, 
  Swords, User, RefreshCw, Terminal, Sparkles, CornerDownLeft, ShieldAlert
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { socket } from '../socket';
import { useStore } from '../store';
import { soundManager } from '../lib/soundEffects';
import { apiUrl } from '../api';
import { LobbyChatMessage } from '../types';

interface InspectedUser {
  username: string;
  elo?: number;
}

const QUICK_PROMPTS = [
  '⚔️ 1v1 duel anyone?',
  'GL HF!',
  'GG',
  'Searching for match...',
  'Nice solution! 🔥',
  'Need help with Medium DP'
];

function getAvatarColor(name: string): string {
  const colors = [
    'from-emerald-500 to-teal-700',
    'from-cyan-500 to-blue-700',
    'from-violet-500 to-purple-700',
    'from-amber-500 to-orange-700',
    'from-pink-500 to-rose-700',
    'from-lime-500 to-green-700'
  ];
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  return colors[Math.abs(hash) % colors.length];
}

export function FloatingLobbyChat() {
  const navigate = useNavigate();
  const location = useLocation();
  const { currentUser, accountProfile } = useStore();
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<LobbyChatMessage[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [inputText, setInputText] = useState('');
  const [onlineCount, setOnlineCount] = useState(1);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [inspectedUser, setInspectedUser] = useState<InspectedUser | null>(null);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const chatContainerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const isOpenRef = useRef(isOpen);
  isOpenRef.current = isOpen;

  // Lobby chat should ONLY appear on the home page (not in match arena, profile, leaderboard, etc.)
  if (location.pathname !== '/') {
    return null;
  }

  const currentUsername = accountProfile?.username || currentUser?.name || 'Player';
  const currentElo = 1200;
  const currentAvatar = accountProfile?.photoURL;

  // Scroll to bottom helper
  const scrollToBottom = (smooth = true) => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: smooth ? 'smooth' : 'auto' });
    }
  };

  // Initial fetch via REST for instant hydration
  useEffect(() => {
    let isMounted = true;
    fetch(apiUrl('/api/lobby-chat'))
      .then(res => res.json())
      .then(data => {
        if (!isMounted || !data?.messages) return;
        setMessages(prev => {
          const map = new Map<string, LobbyChatMessage>();
          prev.forEach(m => map.set(m.id, m));
          (data.messages as LobbyChatMessage[]).forEach(m => map.set(m.id, m));
          return Array.from(map.values()).sort((a, b) => a.timestamp - b.timestamp);
        });
        if (data.onlineCount) setOnlineCount(data.onlineCount);
      })
      .catch(err => console.warn('Lobby chat initial hydration notice:', err));

    return () => {
      isMounted = false;
    };
  }, []);

  // Socket listener for real-time messages and state synchronization
  useEffect(() => {
    const handleLobbyHistory = (payload: { messages: LobbyChatMessage[]; onlineCount?: number }) => {
      if (payload?.messages) {
        setMessages(prev => {
          const map = new Map<string, LobbyChatMessage>();
          prev.forEach(m => map.set(m.id, m));
          payload.messages.forEach(m => map.set(m.id, m));
          return Array.from(map.values()).sort((a, b) => a.timestamp - b.timestamp);
        });
      }
      if (payload?.onlineCount) {
        setOnlineCount(payload.onlineCount);
      }
    };

    const handleLobbyMessage = (msg: LobbyChatMessage) => {
      setMessages(prev => {
        // Prevent duplicate rendering
        if (prev.some(m => m.id === msg.id)) return prev;
        return [...prev, msg].slice(-150);
      });

      if (!isOpenRef.current) {
        setUnreadCount(c => c + 1);
        if (soundEnabled && !msg.isSystem && msg.username !== currentUsername) {
          soundManager.playNotification();
        }
      } else {
        setTimeout(() => scrollToBottom(true), 50);
      }
    };

    const handleOnlineUsers = (data: { count?: number; activeCount?: number }) => {
      const count = data.count || data.activeCount;
      if (count !== undefined) {
        setOnlineCount(count);
      }
    };

    socket.on('lobby_chat_history', handleLobbyHistory);
    socket.on('lobby_chat_message', handleLobbyMessage);
    socket.on('online_users', handleOnlineUsers);
    socket.on('lobby_operators_update', handleOnlineUsers);

    return () => {
      socket.off('lobby_chat_history', handleLobbyHistory);
      socket.off('lobby_chat_message', handleLobbyMessage);
      socket.off('online_users', handleOnlineUsers);
      socket.off('lobby_operators_update', handleOnlineUsers);
    };
  }, [soundEnabled, currentUsername]);

  // Scroll to bottom when opening chat
  useEffect(() => {
    if (isOpen) {
      setUnreadCount(0);
      setTimeout(() => {
        scrollToBottom(false);
        inputRef.current?.focus();
      }, 80);
    }
  }, [isOpen]);

  const handleSendMessage = (textToSend?: string) => {
    const text = (textToSend !== undefined ? textToSend : inputText).trim();
    if (!text) return;

    soundManager.playClick();

    socket.emit('send_lobby_chat', {
      text,
      username: currentUsername,
      elo: currentElo,
      avatar: currentAvatar,
    });

    if (textToSend === undefined) {
      setInputText('');
    }

    setTimeout(() => scrollToBottom(true), 50);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const handleRefresh = () => {
    setIsRefreshing(true);
    soundManager.playClick();
    socket.emit('get_lobby_chat_history', () => {
      setIsRefreshing(false);
    });
    setTimeout(() => setIsRefreshing(false), 800);
  };

  const toggleOpen = () => {
    soundManager.playClick();
    setIsOpen(prev => !prev);
    if (!isOpen) {
      setUnreadCount(0);
    }
  };

  const handleChallengeUser = (targetUsername: string) => {
    soundManager.playClick();
    setInspectedUser(null);
    socket.emit('send_direct_challenge', {
      targetUsername,
      difficulty: 'medium',
      topic: 'Algorithms & Data Structures',
    });
  };

  const handleViewProfile = (targetUsername: string) => {
    soundManager.playClick();
    setInspectedUser(null);
    navigate(`/profile/${encodeURIComponent(targetUsername)}`);
  };

  const handleInsertMention = (targetUsername: string) => {
    setInputText(prev => `${prev ? prev + ' ' : ''}@${targetUsername} `);
    setInspectedUser(null);
    inputRef.current?.focus();
  };

  return (
    <>
      {/* Persistent Floating Chat Trigger (Bottom-Right) */}
      <div className="fixed bottom-4 right-4 sm:bottom-6 sm:right-6 z-50 pointer-events-auto">
        <AnimatePresence>
          {!isOpen && (
            <motion.button
              id="floating-lobby-chat-toggle"
              type="button"
              initial={{ scale: 0.8, opacity: 0, y: 15 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.8, opacity: 0, y: 15 }}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={toggleOpen}
              className="flex items-center gap-3 px-4 py-3 bg-[#0a0a0c]/90 hover:bg-black backdrop-blur-md border border-[#00FF00]/50 hover:border-[#00FF00] rounded-full shadow-[0_0_25px_rgba(0,0,0,0.8),0_0_15px_rgba(0,255,0,0.25)] text-white transition-all cursor-pointer group"
              title="Open Global Lobby Chat"
              aria-label="Open Global Lobby Chat"
            >
              {/* Radar pulse & message icon */}
              <div className="relative flex items-center justify-center">
                <MessageSquare className="w-5 h-5 text-[#00FF00] group-hover:scale-110 transition-transform" />
                <span className="absolute -top-1 -right-1 w-2.5 h-2.5 rounded-full bg-[#00FF00] animate-ping opacity-75" />
                <span className="absolute -top-1 -right-1 w-2.5 h-2.5 rounded-full bg-[#00FF00] border-2 border-black" />
              </div>

              {/* Text label with live user count */}
              <div className="hidden sm:flex flex-col text-left">
                <span className="font-mono text-xs font-black tracking-wider uppercase text-[#00FF00] leading-tight flex items-center gap-1.5">
                  <span>LOBBY CHAT</span>
                </span>
                <span className="font-mono text-[10px] text-zinc-400 leading-none">
                  {onlineCount} {onlineCount === 1 ? 'duelist' : 'duelists'} online
                </span>
              </div>

              {/* Unread Message Badge */}
              {unreadCount > 0 && (
                <span className="px-2 py-0.5 rounded-full bg-[#00FF00] text-black font-mono text-[11px] font-black uppercase tracking-wider animate-bounce shadow-[0_0_10px_rgba(0,255,0,0.8)]">
                  +{unreadCount}
                </span>
              )}
            </motion.button>
          )}
        </AnimatePresence>

        {/* Expanded Global Lobby Chat Window */}
        <AnimatePresence>
          {isOpen && (
            <motion.div
              id="floating-lobby-chat-window"
              initial={{ opacity: 0, scale: 0.92, y: 25, transformOrigin: 'bottom right' }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.92, y: 25 }}
              transition={{ duration: 0.2, ease: 'easeOut' }}
              className="w-[calc(100vw-2rem)] sm:w-[390px] md:w-[420px] h-[520px] max-h-[82vh] flex flex-col bg-[#0a0a0c]/95 backdrop-blur-xl border border-[#00FF00]/40 rounded-xl shadow-[0_0_50px_rgba(0,0,0,0.9),0_0_25px_rgba(0,255,0,0.18)] overflow-hidden font-mono text-xs"
            >
              {/* Header Bar */}
              <div className="flex items-center justify-between px-3.5 py-2.5 bg-black/80 border-b border-white/10 select-none">
                <div className="flex items-center gap-2">
                  <div className="relative flex items-center justify-center">
                    <div className="w-2.5 h-2.5 rounded-full bg-[#00FF00] animate-pulse" />
                    <div className="absolute w-4 h-4 rounded-full border border-[#00FF00]/40 animate-ping" />
                  </div>
                  <div>
                    <div className="flex items-center gap-1.5 font-bold tracking-wider text-white">
                      <Terminal className="w-3.5 h-3.5 text-[#00FF00]" />
                      <span className="text-[#00FF00]">GLOBAL LOBBY</span>
                    </div>
                    <div className="text-[10px] text-zinc-400 flex items-center gap-1">
                      <Users className="w-2.5 h-2.5 text-[#00FF00]" />
                      <span>{onlineCount} duelists connected</span>
                    </div>
                  </div>
                </div>

                {/* Header Controls */}
                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    onClick={handleRefresh}
                    className="p-1.5 text-zinc-400 hover:text-[#00FF00] hover:bg-white/5 rounded transition-colors"
                    title="Refresh Chat Stream"
                  >
                    <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin text-[#00FF00]' : ''}`} />
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      soundManager.playClick();
                      setSoundEnabled(s => !s);
                    }}
                    className="p-1.5 text-zinc-400 hover:text-[#00FF00] hover:bg-white/5 rounded transition-colors"
                    title={soundEnabled ? 'Mute notification sound' : 'Unmute notification sound'}
                  >
                    {soundEnabled ? (
                      <Volume2 className="w-3.5 h-3.5 text-[#00FF00]" />
                    ) : (
                      <VolumeX className="w-3.5 h-3.5 text-zinc-500" />
                    )}
                  </button>

                  <button
                    type="button"
                    onClick={toggleOpen}
                    className="p-1.5 text-zinc-400 hover:text-white hover:bg-white/10 rounded transition-colors"
                    title="Minimize Lobby Chat"
                  >
                    <ChevronDown className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Channel Subnet Info Bar */}
              <div className="px-3 py-1 bg-[#00FF00]/5 border-b border-[#00FF00]/10 flex items-center justify-between text-[10px] text-zinc-400">
                <span className="text-[#00FF00]/80 flex items-center gap-1 truncate">
                  <Sparkles className="w-3 h-3 text-[#00FF00]" />
                  <span>Broadcasts to all online players</span>
                </span>
                <span className="text-zinc-500 shrink-0">Terminal</span>
              </div>

              {/* Messages Scroll Container */}
              <div 
                ref={chatContainerRef}
                className="flex-1 overflow-y-auto p-3 space-y-2.5 custom-scrollbar bg-black/30"
              >
                {messages.length === 0 ? (
                  <div className="h-full flex flex-col items-center justify-center text-center text-zinc-500 p-4">
                    <Terminal className="w-8 h-8 text-zinc-600 mb-2 animate-pulse" />
                    <p className="text-zinc-400 font-bold">Lobby Stream Initializing...</p>
                    <p className="text-[11px] mt-1">Send the first transmission to duelists on the grid!</p>
                  </div>
                ) : (
                  messages.map((msg) => {
                    const isSelf = msg.username === currentUsername;
                    const isSystem = msg.isSystem || msg.userId === 'system';
                    const timeStr = new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

                    if (isSystem) {
                      return (
                        <div 
                          key={msg.id}
                          className="px-2.5 py-1.5 bg-[#00FF00]/10 border-l-2 border-[#00FF00] rounded-r text-[11px] text-[#00FF00]/90 font-mono shadow-[0_0_10px_rgba(0,255,0,0.05)]"
                        >
                          <div className="flex items-center gap-1.5 text-[10px] text-zinc-400 font-bold uppercase mb-0.5">
                            <ShieldAlert className="w-3 h-3 text-[#00FF00]" />
                            <span>System Notice</span>
                            <span className="text-zinc-500 ml-auto">{timeStr}</span>
                          </div>
                          <p className="leading-relaxed">{msg.text}</p>
                        </div>
                      );
                    }

                    return (
                      <div 
                        key={msg.id}
                        className={`flex flex-col group ${isSelf ? 'items-end' : 'items-start'}`}
                      >
                        {/* Message Metadata Header */}
                        <div className="flex items-center gap-1.5 mb-1 px-1 text-[10px]">
                          <button
                            type="button"
                            onClick={() => !isSelf && setInspectedUser({ username: msg.username, elo: msg.elo })}
                            className={`font-bold flex items-center gap-1 transition-colors ${
                              isSelf ? 'text-[#00FF00]' : 'text-zinc-300 hover:text-[#00FF00] cursor-pointer'
                            }`}
                          >
                            <span className={`w-3.5 h-3.5 rounded-full bg-gradient-to-tr ${getAvatarColor(msg.username)} inline-flex items-center justify-center text-[8px] text-white font-black`}>
                              {msg.username.charAt(0).toUpperCase()}
                            </span>
                            <span>{msg.username}</span>
                            {isSelf && <span className="text-zinc-500 text-[9px]">(You)</span>}
                          </button>

                          {msg.elo !== undefined && (
                            <span className="px-1 py-0.2 bg-white/5 border border-white/10 rounded text-[9px] text-zinc-400">
                              {msg.elo}
                            </span>
                          )}

                          <span className="text-zinc-600 text-[9px]">{timeStr}</span>
                        </div>

                        {/* Message Bubble */}
                        <div
                          className={`max-w-[85%] px-3 py-2 rounded-lg text-xs break-words leading-relaxed ${
                            isSelf
                              ? 'bg-[#00FF00]/15 border border-[#00FF00]/40 text-white rounded-tr-none shadow-[0_0_12px_rgba(0,255,0,0.1)]'
                              : 'bg-zinc-900/90 border border-white/10 text-zinc-200 rounded-tl-none hover:border-zinc-700'
                          }`}
                        >
                          {msg.text}
                        </div>
                      </div>
                    );
                  })
                )}
                <div ref={messagesEndRef} />
              </div>

              {/* Inspected User Quick Action Overlay */}
              <AnimatePresence>
                {inspectedUser && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 10 }}
                    className="p-2.5 bg-black/95 border-t border-[#00FF00]/30 flex items-center justify-between gap-2 text-xs"
                  >
                    <div className="flex items-center gap-2 truncate">
                      <span className={`w-6 h-6 rounded-full bg-gradient-to-tr ${getAvatarColor(inspectedUser.username)} flex items-center justify-center text-white font-bold text-xs shrink-0`}>
                        {inspectedUser.username.charAt(0).toUpperCase()}
                      </span>
                      <div className="truncate">
                        <div className="font-bold text-white truncate">{inspectedUser.username}</div>
                        <div className="text-[10px] text-zinc-400">{inspectedUser.elo || 1200} ELO</div>
                      </div>
                    </div>

                    <div className="flex items-center gap-1.5 shrink-0">
                      <button
                        type="button"
                        onClick={() => handleChallengeUser(inspectedUser.username)}
                        className="px-2.5 py-1 bg-[#00FF00]/20 hover:bg-[#00FF00] border border-[#00FF00]/60 text-[#00FF00] hover:text-black font-bold text-[10px] uppercase rounded transition-colors flex items-center gap-1 cursor-pointer"
                        title="Challenge to 1v1 duel"
                      >
                        <Swords className="w-3 h-3" />
                        <span>Duel</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => handleViewProfile(inspectedUser.username)}
                        className="px-2 py-1 bg-white/10 hover:bg-white/20 text-white font-bold text-[10px] uppercase rounded transition-colors flex items-center gap-1 cursor-pointer"
                      >
                        <User className="w-3 h-3" />
                        <span>Profile</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => handleInsertMention(inspectedUser.username)}
                        className="px-1.5 py-1 text-zinc-400 hover:text-white rounded"
                        title="Mention user in chat"
                      >
                        @
                      </button>

                      <button
                        type="button"
                        onClick={() => setInspectedUser(null)}
                        className="p-1 text-zinc-500 hover:text-white"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Quick Prompts Bar */}
              <div className="px-2.5 py-1.5 bg-black/60 border-t border-white/5 flex items-center gap-1.5 overflow-x-auto no-scrollbar">
                {QUICK_PROMPTS.map((prompt, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => handleSendMessage(prompt)}
                    className="px-2 py-0.5 bg-white/5 hover:bg-[#00FF00]/20 border border-white/10 hover:border-[#00FF00]/50 rounded text-[10px] text-zinc-300 hover:text-[#00FF00] whitespace-nowrap transition-all cursor-pointer shrink-0"
                  >
                    {prompt}
                  </button>
                ))}
              </div>

              {/* Message Input Form */}
              <div className="p-2.5 bg-black border-t border-white/10 flex items-center gap-2">
                <div className="relative flex-1">
                  <input
                    ref={inputRef}
                    type="text"
                    value={inputText}
                    onChange={(e) => setInputText(e.target.value)}
                    onKeyDown={handleKeyDown}
                    placeholder="Broadcast to global lobby..."
                    maxLength={300}
                    className="w-full px-3 py-2 bg-zinc-900/90 border border-white/15 focus:border-[#00FF00] focus:ring-1 focus:ring-[#00FF00] rounded-lg text-xs text-white placeholder:text-zinc-600 outline-none transition-all pr-12 font-mono"
                  />
                  {inputText.length > 200 && (
                    <span className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[10px] text-zinc-500 pointer-events-none">
                      {300 - inputText.length}
                    </span>
                  )}
                </div>

                <button
                  type="button"
                  id="floating-lobby-chat-send-btn"
                  onClick={() => handleSendMessage()}
                  disabled={!inputText.trim()}
                  className={`p-2 rounded-lg font-bold transition-all flex items-center justify-center shrink-0 ${
                    inputText.trim()
                      ? 'bg-[#00FF00] text-black hover:bg-[#00DD00] shadow-[0_0_12px_rgba(0,255,0,0.4)] cursor-pointer'
                      : 'bg-zinc-800 text-zinc-600 cursor-not-allowed'
                  }`}
                  title="Send message (Enter)"
                >
                  <Send className="w-4 h-4" />
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </>
  );
}
