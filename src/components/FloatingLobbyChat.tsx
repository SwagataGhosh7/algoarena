import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { 
  MessageSquare, X, ChevronDown, Send, Users, Volume2, VolumeX, 
  Swords, User, RefreshCw, Terminal, Sparkles, Image as ImageIcon,
  Trash2, ZoomIn, Download, CheckCircle2, ShieldAlert,
  Smile, Lock, ArrowLeft, Search, UserPlus
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { socket } from '../socket';
import { useStore } from '../store';
import { soundManager } from '../lib/soundEffects';
import { apiUrl } from '../api';
import { LobbyChatMessage, PrivateChatMessage } from '../types';
import { useNeonTheme } from '../lib/neonThemes';
import { EmojiPicker } from './EmojiPicker';

interface InspectedUser {
  username: string;
  elo?: number;
}

interface ConversationSummary {
  otherUsername: string;
  lastMessage: string;
  lastTimestamp: number;
  unreadCount?: number;
  isOnline?: boolean;
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

// Compress and convert image file to optimized Base64 data URL
async function processImageFile(file: File, maxDimension = 1200, quality = 0.85): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        let { width, height } = img;
        if (width > maxDimension || height > maxDimension) {
          if (width > height) {
            height = Math.round((height * maxDimension) / width);
            width = maxDimension;
          } else {
            width = Math.round((width * maxDimension) / height);
            height = maxDimension;
          }
        }
        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          resolve(e.target?.result as string);
          return;
        }
        ctx.drawImage(img, 0, 0, width, height);
        const mimeType = file.type === 'image/png' ? 'image/png' : 'image/jpeg';
        resolve(canvas.toDataURL(mimeType, quality));
      };
      img.onerror = () => reject(new Error('Failed to load image'));
      img.src = e.target?.result as string;
    };
    reader.onerror = () => reject(new Error('Failed to read file'));
    reader.readAsDataURL(file);
  });
}

export function FloatingLobbyChat() {
  const navigate = useNavigate();
  const location = useLocation();
  const { palette: neonTheme } = useNeonTheme();
  const { 
    currentUser, 
    accountProfile, 
    activeLobbyCount, 
    setActiveLobbyCount,
    lobbySoundEnabled, 
    setLobbySoundEnabled,
    chatDraftText,
    setChatDraftText,
    isLobbyChatOpen,
    setLobbyChatOpen,
    activePrivateChatUser,
    openPrivateChatWithUser,
    setInspectedUserForDetails
  } = useStore();

  const [isOpen, setIsOpen] = useState(isLobbyChatOpen);
  const [activeTab, setActiveTab] = useState<'lobby' | 'private'>('lobby');
  const [messages, setMessages] = useState<LobbyChatMessage[]>([]);
  const [unreadLobbyCount, setUnreadLobbyCount] = useState(0);
  const [unreadPrivateCount, setUnreadPrivateCount] = useState(0);
  const [inputText, setInputText] = useState(chatDraftText || '');
  const [onlineCount, setOnlineCount] = useState(activeLobbyCount || 1);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [inspectedUser, setInspectedUser] = useState<InspectedUser | null>(null);

  // Private Chat state
  const [selectedPrivateUser, setSelectedPrivateUser] = useState<string | null>(activePrivateChatUser);
  const [privateMessages, setPrivateMessages] = useState<PrivateChatMessage[]>([]);
  const [conversations, setConversations] = useState<ConversationSummary[]>([]);
  const [friendsList, setFriendsList] = useState<string[]>([]);
  const [newChatHandle, setNewChatHandle] = useState('');
  const [isSearchingUser, setIsSearchingUser] = useState(false);

  // Emoji Picker state
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  
  // Image Upload state
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [imageFileName, setImageFileName] = useState<string | null>(null);
  const [isUploadingImage, setIsUploadingImage] = useState(false);
  const [isDraggingOver, setIsDraggingOver] = useState(false);
  
  // Lightbox Zoom state
  const [lightboxImage, setLightboxImage] = useState<string | null>(null);
  
  // Feedback toast (e.g., "Message unsent")
  const [toastNotification, setToastNotification] = useState<string | null>(null);

  // Real-Time Typing Indicators State
  const [lobbyTypingUsers, setLobbyTypingUsers] = useState<Record<string, number>>({});
  const [privateTypingUsers, setPrivateTypingUsers] = useState<Record<string, number>>({});
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const isTypingRef = useRef(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const chatContainerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const isOpenRef = useRef(isOpen);
  isOpenRef.current = isOpen;
  const activeTabRef = useRef(activeTab);
  activeTabRef.current = activeTab;
  const selectedPrivateUserRef = useRef(selectedPrivateUser);
  selectedPrivateUserRef.current = selectedPrivateUser;

  const currentUsername = accountProfile?.username || currentUser?.name || 'Duelist';
  const currentElo = 1200;
  const currentAvatar = accountProfile?.photoURL;

  // Prune expired typing indicators every second (inactivity timeout: 3.5s)
  useEffect(() => {
    const timer = setInterval(() => {
      const now = Date.now();
      setLobbyTypingUsers(prev => {
        const active = Object.entries(prev).filter(([_, ts]) => now - ts < 3500);
        if (active.length === Object.keys(prev).length) return prev;
        return Object.fromEntries(active);
      });

      setPrivateTypingUsers(prev => {
        const active = Object.entries(prev).filter(([_, ts]) => now - ts < 3500);
        if (active.length === Object.keys(prev).length) return prev;
        return Object.fromEntries(active);
      });
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  const showToast = (text: string) => {
    setToastNotification(text);
    setTimeout(() => {
      setToastNotification(null);
    }, 2800);
  };

  // Synchronize store's isLobbyChatOpen and activePrivateChatUser
  useEffect(() => {
    if (isLobbyChatOpen) {
      setIsOpen(true);
    }
  }, [isLobbyChatOpen]);

  useEffect(() => {
    if (activePrivateChatUser) {
      setIsOpen(true);
      setActiveTab('private');
      setSelectedPrivateUser(activePrivateChatUser);
    }
  }, [activePrivateChatUser]);

  // Scroll to bottom helper
  const scrollToBottom = (smooth = true) => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: smooth ? 'smooth' : 'auto' });
    }
  };

  // Emit typing status over socket
  const emitTypingStatus = useCallback((isTyping: boolean) => {
    if (!socket || !socket.connected) return;

    if (activeTabRef.current === 'lobby') {
      socket.emit('lobby_typing', { username: currentUsername, isTyping });
    } else if (activeTabRef.current === 'private' && selectedPrivateUserRef.current) {
      socket.emit('private_typing', {
        toUsername: selectedPrivateUserRef.current,
        fromUsername: currentUsername,
        isTyping,
      });
    }
    isTypingRef.current = isTyping;
  }, [currentUsername]);

  // Clear typing state on tab switch, user switch, or close
  useEffect(() => {
    if (isTypingRef.current) {
      emitTypingStatus(false);
    }
  }, [activeTab, selectedPrivateUser, isOpen, emitTypingStatus]);

  // Keep draft persisted in localStorage & broadcast typing activity
  const handleInputChange = (val: string) => {
    setInputText(val);
    setChatDraftText(val);

    const hasText = val.trim().length > 0;
    if (hasText) {
      if (!isTypingRef.current) {
        emitTypingStatus(true);
      }
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
      typingTimeoutRef.current = setTimeout(() => {
        emitTypingStatus(false);
      }, 2500);
    } else {
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
      if (isTypingRef.current) {
        emitTypingStatus(false);
      }
    }
  };

  // Fetch conversations summary & friends
  const fetchConversationsAndFriends = useCallback(async () => {
    if (!currentUsername) return;
    try {
      // 1. Fetch conversations
      const convRes = await fetch(apiUrl(`/api/user-conversations?username=${encodeURIComponent(currentUsername)}`));
      if (convRes.ok) {
        const data = await convRes.json();
        setConversations(data.conversations || []);
      }

      // 2. Fetch friends
      const friendsRes = await fetch(apiUrl(`/api/friends?username=${encodeURIComponent(currentUsername)}`));
      if (friendsRes.ok) {
        const fData = await friendsRes.json();
        setFriendsList(fData.friends || []);
      }
    } catch (e) {
      console.warn('Failed to fetch conversations or friends', e);
    }
  }, [currentUsername]);

  // Initial fetch for global lobby
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
        if (data.onlineCount) {
          setOnlineCount(data.onlineCount);
          setActiveLobbyCount(data.onlineCount);
        }
      })
      .catch(err => console.warn('Lobby chat initial hydration notice:', err));

    return () => {
      isMounted = false;
    };
  }, [setActiveLobbyCount]);

  // Fetch private chat history when selectedPrivateUser changes
  useEffect(() => {
    if (!selectedPrivateUser || !currentUsername) {
      setPrivateMessages([]);
      return;
    }

    fetch(apiUrl(`/api/private-chat?user1=${encodeURIComponent(currentUsername)}&user2=${encodeURIComponent(selectedPrivateUser)}`))
      .then(res => res.ok ? res.json() : null)
      .then(data => {
        if (data?.messages) {
          setPrivateMessages(data.messages);
          setTimeout(() => scrollToBottom(false), 50);
        }
      })
      .catch(e => console.warn('Failed to load private chat history', e));
  }, [selectedPrivateUser, currentUsername]);

  // Socket listener for real-time messages, unsending, and online user synchronization
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
        setActiveLobbyCount(payload.onlineCount);
      }
    };

    const handleLobbyMessage = (msg: LobbyChatMessage) => {
      setMessages(prev => {
        if (prev.some(m => m.id === msg.id)) return prev;
        return [...prev, msg].slice(-150);
      });

      if (!isOpenRef.current || activeTabRef.current !== 'lobby') {
        setUnreadLobbyCount(c => c + 1);
        if (lobbySoundEnabled && !msg.isSystem && msg.username !== currentUsername) {
          soundManager.playNotification();
        }
      } else {
        setTimeout(() => scrollToBottom(true), 50);
      }
    };

    const handleLobbyUnsent = ({ messageId }: { messageId: string }) => {
      setMessages(prev => prev.filter(m => m.id !== messageId));
    };

    const handlePrivateMessage = (msg: PrivateChatMessage) => {
      const activePartner = selectedPrivateUserRef.current;
      const from = msg.fromUsername;
      const to = msg.toUsername;
      const isFromActive = activePartner && (
        from.toLowerCase() === activePartner.toLowerCase() ||
        to.toLowerCase() === activePartner.toLowerCase()
      );

      if (isFromActive) {
        setPrivateMessages(prev => {
          if (prev.some(m => m.id === msg.id)) return prev;
          return [...prev, msg];
        });
        setTimeout(() => scrollToBottom(true), 50);
      }

      // If user is recipient and not actively looking at this chat
      if (to.toLowerCase() === currentUsername.toLowerCase()) {
        if (!isOpenRef.current || activeTabRef.current !== 'private' || !isFromActive) {
          setUnreadPrivateCount(c => c + 1);
          if (lobbySoundEnabled) {
            soundManager.playNotification();
          }
        }
      }

      // Refresh threads
      fetchConversationsAndFriends();
    };

    const handlePrivateUnsent = ({ messageId }: { messageId: string }) => {
      setPrivateMessages(prev => prev.filter(m => m.id !== messageId));
      fetchConversationsAndFriends();
    };

    const handleOnlineUsers = (data: { count?: number; activeCount?: number }) => {
      const count = data.count || data.activeCount;
      if (count !== undefined) {
        setOnlineCount(count);
        setActiveLobbyCount(count);
      }
    };

    const handleLobbyTyping = (data: { username?: string; isTyping?: boolean }) => {
      if (!data?.username) return;
      if (data.username.toLowerCase() === currentUsername.toLowerCase()) return;
      setLobbyTypingUsers(prev => {
        const next = { ...prev };
        if (data.isTyping) {
          next[data.username!] = Date.now();
        } else {
          delete next[data.username!];
        }
        return next;
      });
    };

    const handlePrivateTyping = (data: { fromUsername?: string; isTyping?: boolean }) => {
      if (!data?.fromUsername) return;
      const lower = data.fromUsername.toLowerCase();
      setPrivateTypingUsers(prev => {
        const next = { ...prev };
        if (data.isTyping) {
          next[lower] = Date.now();
        } else {
          delete next[lower];
        }
        return next;
      });
    };

    socket.on('lobby_chat_history', handleLobbyHistory);
    socket.on('lobby_chat_message', handleLobbyMessage);
    socket.on('lobby_chat_unsent', handleLobbyUnsent);
    socket.on('private_chat_message', handlePrivateMessage);
    socket.on('private_chat_unsent', handlePrivateUnsent);
    socket.on('lobby_typing', handleLobbyTyping);
    socket.on('private_typing', handlePrivateTyping);
    socket.on('online_users', handleOnlineUsers);
    socket.on('online_users_update', handleOnlineUsers);
    socket.on('lobby_operators_update', handleOnlineUsers);

    return () => {
      socket.off('lobby_chat_history', handleLobbyHistory);
      socket.off('lobby_chat_message', handleLobbyMessage);
      socket.off('lobby_chat_unsent', handleLobbyUnsent);
      socket.off('private_chat_message', handlePrivateMessage);
      socket.off('private_chat_unsent', handlePrivateUnsent);
      socket.off('lobby_typing', handleLobbyTyping);
      socket.off('private_typing', handlePrivateTyping);
      socket.off('online_users', handleOnlineUsers);
      socket.off('online_users_update', handleOnlineUsers);
      socket.off('lobby_operators_update', handleOnlineUsers);
    };
  }, [lobbySoundEnabled, currentUsername, setActiveLobbyCount, fetchConversationsAndFriends]);

  // Clear unreads when tab switches or opened
  useEffect(() => {
    if (isOpen) {
      if (activeTab === 'lobby') {
        setUnreadLobbyCount(0);
      } else {
        setUnreadPrivateCount(0);
        fetchConversationsAndFriends();
      }
      setTimeout(() => {
        scrollToBottom(false);
        inputRef.current?.focus();
      }, 80);
    }
  }, [isOpen, activeTab, fetchConversationsAndFriends]);

  // Handle Image File Selection
  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      showToast('Please select a valid image file (PNG, JPG, WebP)');
      return;
    }

    if (file.size > 8 * 1024 * 1024) {
      showToast('Image file too large (max 8MB)');
      return;
    }

    try {
      setIsUploadingImage(true);
      const dataUrl = await processImageFile(file);
      setSelectedImage(dataUrl);
      setImageFileName(file.name);
      soundManager.playClick();
    } catch (err) {
      console.error('Failed to process image:', err);
      showToast('Failed to load image preview');
    } finally {
      setIsUploadingImage(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  // Drag & drop handlers
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDraggingOver(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDraggingOver(false);
  };

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDraggingOver(false);

    const file = e.dataTransfer.files?.[0];
    if (!file || !file.type.startsWith('image/')) {
      return;
    }

    try {
      setIsUploadingImage(true);
      const dataUrl = await processImageFile(file);
      setSelectedImage(dataUrl);
      setImageFileName(file.name);
      soundManager.playClick();
    } catch (err) {
      console.error('Failed to process dropped image:', err);
    } finally {
      setIsUploadingImage(false);
    }
  };

  const handleClearSelectedImage = () => {
    setSelectedImage(null);
    setImageFileName(null);
    soundManager.playClick();
  };

  // Send Message (Handles both Global Lobby & Private Chat)
  const handleSendMessage = (textToSend?: string) => {
    const text = (textToSend !== undefined ? textToSend : inputText).trim();
    const imageToSend = selectedImage;

    if (!text && !imageToSend) return;

    soundManager.playClick();

    if (activeTab === 'lobby') {
      // Global Lobby Send
      socket.emit('send_lobby_chat', {
        text,
        imageUrl: imageToSend || undefined,
        username: currentUsername,
        elo: currentElo,
        avatar: currentAvatar,
      });
    } else {
      // Private Chat Send
      if (!selectedPrivateUser) {
        showToast('Select a user to message privately');
        return;
      }

      socket.emit('send_private_chat', {
        toUsername: selectedPrivateUser,
        text,
        imageUrl: imageToSend || undefined,
        username: currentUsername,
      });
    }

    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }
    if (isTypingRef.current) {
      emitTypingStatus(false);
    }

    if (textToSend === undefined) {
      setInputText('');
      setChatDraftText('');
    }
    setSelectedImage(null);
    setImageFileName(null);
    setShowEmojiPicker(false);

    setTimeout(() => scrollToBottom(true), 50);
  };

  // Unsend Message (Instagram style deletion)
  const handleUnsendMessage = (messageId: string) => {
    soundManager.playClick();

    if (activeTab === 'lobby') {
      socket.emit('unsend_lobby_chat', {
        messageId,
        username: currentUsername,
      });
      setMessages(prev => prev.filter(m => m.id !== messageId));
      showToast('Global transmission unsent');
    } else {
      if (!selectedPrivateUser) return;
      socket.emit('unsend_private_chat', {
        messageId,
        username: currentUsername,
        otherUsername: selectedPrivateUser,
      });
      setPrivateMessages(prev => prev.filter(m => m.id !== messageId));
      showToast('Private message unsent');
    }
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
    if (activeTab === 'lobby') {
      socket.emit('get_lobby_chat_history', () => {
        setIsRefreshing(false);
      });
    } else {
      fetchConversationsAndFriends();
      if (selectedPrivateUser) {
        socket.emit('get_private_chat_history', {
          user1: currentUsername,
          user2: selectedPrivateUser,
        });
      }
    }
    setTimeout(() => setIsRefreshing(false), 800);
  };

  const toggleOpen = () => {
    soundManager.playClick();
    const nextState = !isOpen;
    setIsOpen(nextState);
    setLobbyChatOpen(nextState);
    if (nextState) {
      if (activeTab === 'lobby') setUnreadLobbyCount(0);
      else setUnreadPrivateCount(0);
    }
  };

  const handleStartNewChat = (e: React.FormEvent) => {
    e.preventDefault();
    const clean = newChatHandle.trim();
    if (!clean) return;
    if (clean.toLowerCase() === currentUsername.toLowerCase()) {
      showToast('Cannot chat privately with yourself');
      return;
    }
    setSelectedPrivateUser(clean);
    setNewChatHandle('');
    setIsSearchingUser(false);
  };

  const handleEmojiSelect = (emoji: string) => {
    const updated = inputText + emoji;
    handleInputChange(updated);
    inputRef.current?.focus();
  };

  // Only render on homepage
  if (location.pathname !== '/') {
    return null;
  }

  const totalUnread = unreadLobbyCount + unreadPrivateCount;

  const activeLobbyTypingNames = Object.keys(lobbyTypingUsers).filter(name => {
    return Date.now() - (lobbyTypingUsers[name] || 0) < 3500;
  });

  const isSelectedPrivateUserTyping = Boolean(
    selectedPrivateUser &&
    privateTypingUsers[selectedPrivateUser.toLowerCase()] &&
    Date.now() - (privateTypingUsers[selectedPrivateUser.toLowerCase()] || 0) < 3500
  );

  return (
    <>
      {/* Lightbox Modal for Zooming Images */}
      <AnimatePresence>
        {lightboxImage && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setLightboxImage(null)}
            className="fixed inset-0 z-[100] bg-black/90 backdrop-blur-md flex items-center justify-center p-4 cursor-zoom-out select-none"
          >
            <div 
              className="relative max-w-4xl max-h-[90vh] flex flex-col items-center"
              onClick={(e) => e.stopPropagation()}
            >
              <img 
                src={lightboxImage} 
                alt="Transmission enlarged" 
                className="max-w-full max-h-[80vh] object-contain border border-white/20 shadow-[0_0_50px_rgba(0,0,0,0.9)]"
              />
              <div className="flex items-center gap-3 mt-3">
                <a
                  href={lightboxImage}
                  download="algoarena-transmission.png"
                  onClick={(e) => e.stopPropagation()}
                  className="px-3 py-1.5 bg-white/10 hover:bg-white/20 text-white font-mono text-xs flex items-center gap-1.5 transition-colors"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Download Image</span>
                </a>
                <button
                  type="button"
                  onClick={() => setLightboxImage(null)}
                  className="px-3 py-1.5 bg-white/20 hover:bg-white/30 text-white font-mono text-xs flex items-center gap-1.5 transition-colors cursor-pointer"
                >
                  <X className="w-3.5 h-3.5" />
                  <span>Close (ESC)</span>
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

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
              style={{
                borderColor: `rgba(${neonTheme.rgb}, 0.5)`,
                boxShadow: `0 0 25px rgba(0,0,0,0.8), 0 0 15px rgba(${neonTheme.rgb}, 0.25)`
              }}
              className="flex items-center gap-3 px-4 py-3 bg-[#0a0a0c]/95 hover:bg-black backdrop-blur-md border text-white transition-all cursor-pointer group"
              title="Open Lobby & Private Chat"
              aria-label="Open Lobby & Private Chat"
            >
              <div className="relative flex items-center justify-center">
                <MessageSquare className="w-5 h-5 group-hover:scale-110 transition-transform" style={{ color: neonTheme.hex }} />
                <span className="absolute -top-1 -right-1 w-2.5 h-2.5 rounded-full animate-ping opacity-75" style={{ backgroundColor: neonTheme.hex }} />
                <span className="absolute -top-1 -right-1 w-2.5 h-2.5 rounded-full border-2 border-black" style={{ backgroundColor: neonTheme.hex }} />
              </div>

              <div className="hidden sm:flex flex-col text-left">
                <span className="font-mono text-xs font-black tracking-wider uppercase leading-tight flex items-center gap-1.5" style={{ color: neonTheme.hex }}>
                  <span>COMMUNICATION MESH</span>
                </span>
                <span className="font-mono text-[10px] text-zinc-400 leading-none">
                  {onlineCount} online • Global & Private DMs
                </span>
              </div>

              {totalUnread > 0 && (
                <span 
                  className="px-2 py-0.5 font-mono text-[11px] font-black uppercase tracking-wider animate-bounce shadow-lg text-black"
                  style={{ backgroundColor: neonTheme.hex }}
                >
                  {totalUnread} NEW
                </span>
              )}
            </motion.button>
          )}
        </AnimatePresence>

        {/* Expanded Chat Window */}
        <AnimatePresence>
          {isOpen && (
            <motion.div
              id="floating-lobby-chat-window"
              initial={{ opacity: 0, scale: 0.92, y: 25, transformOrigin: 'bottom right' }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.92, y: 25 }}
              transition={{ duration: 0.2, ease: 'easeOut' }}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              style={{
                borderColor: isDraggingOver ? neonTheme.hex : `rgba(${neonTheme.rgb}, 0.4)`,
                boxShadow: `0 0 50px rgba(0,0,0,0.95), 0 0 25px rgba(${neonTheme.rgb}, 0.18)`
              }}
              className="w-[calc(100vw-2rem)] sm:w-[420px] md:w-[450px] h-[580px] max-h-[85vh] flex flex-col bg-[#0a0a0c]/98 backdrop-blur-xl border overflow-hidden font-mono text-xs relative"
            >
              {/* Drag over visual overlay indicator */}
              {isDraggingOver && (
                <div 
                  className="absolute inset-0 z-30 bg-black/85 backdrop-blur-xs border-2 border-dashed flex flex-col items-center justify-center p-6 text-center"
                  style={{ borderColor: neonTheme.hex }}
                >
                  <ImageIcon className="w-12 h-12 mb-2 animate-bounce" style={{ color: neonTheme.hex }} />
                  <p className="text-white font-bold text-sm">Drop image to attach to transmission</p>
                  <p className="text-zinc-400 text-xs mt-1">Supports PNG, JPG, GIF, WebP</p>
                </div>
              )}

              {/* Toast Notification Banner */}
              <AnimatePresence>
                {toastNotification && (
                  <motion.div
                    initial={{ opacity: 0, y: -20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20 }}
                    className="absolute top-12 left-1/2 -translate-x-1/2 z-30 px-3 py-1.5 bg-zinc-900/95 border border-white/20 shadow-lg text-[11px] text-white flex items-center gap-1.5 pointer-events-none"
                  >
                    <CheckCircle2 className="w-3.5 h-3.5" style={{ color: neonTheme.hex }} />
                    <span>{toastNotification}</span>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Top Header Bar */}
              <div className="flex items-center justify-between px-3.5 py-2.5 bg-black/95 border-b border-white/10 select-none">
                <div className="flex items-center gap-2">
                  <div className="relative flex items-center justify-center">
                    <div className="w-2.5 h-2.5 rounded-full animate-pulse" style={{ backgroundColor: neonTheme.hex }} />
                    <div className="absolute w-4 h-4 rounded-full border animate-ping" style={{ borderColor: `rgba(${neonTheme.rgb}, 0.4)` }} />
                  </div>
                  <div>
                    <div className="flex items-center gap-1.5 font-black tracking-wider text-white uppercase">
                      <Terminal className="w-3.5 h-3.5" style={{ color: neonTheme.hex }} />
                      <span>COMM MESH // {activeTab === 'lobby' ? 'GLOBAL' : (selectedPrivateUser || 'PRIVATE')}</span>
                    </div>
                    <div className="text-[10px] text-zinc-400 flex items-center gap-1.5">
                      <Users className="w-2.5 h-2.5" style={{ color: neonTheme.hex }} />
                      <span className="text-zinc-300 font-semibold">{onlineCount} duelists online</span>
                      <span className="text-zinc-600">•</span>
                      <span className="text-emerald-400 text-[9px]">Matchmaking Active</span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    onClick={handleRefresh}
                    className="p-1.5 text-zinc-400 hover:text-white hover:bg-white/5 transition-colors cursor-pointer"
                    title="Refresh channel stream"
                  >
                    <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin' : ''}`} style={isRefreshing ? { color: neonTheme.hex } : undefined} />
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      soundManager.playClick();
                      setLobbySoundEnabled(!lobbySoundEnabled);
                    }}
                    className="p-1.5 text-zinc-400 hover:text-white hover:bg-white/5 transition-colors cursor-pointer"
                    title={lobbySoundEnabled ? 'Mute audio cues' : 'Unmute audio cues'}
                  >
                    {lobbySoundEnabled ? (
                      <Volume2 className="w-3.5 h-3.5" style={{ color: neonTheme.hex }} />
                    ) : (
                      <VolumeX className="w-3.5 h-3.5 text-zinc-500" />
                    )}
                  </button>

                  <button
                    type="button"
                    onClick={toggleOpen}
                    className="p-1.5 text-zinc-400 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
                    title="Minimize window"
                  >
                    <ChevronDown className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Mode Tabs: GLOBAL LOBBY vs PRIVATE MESSAGES */}
              <div className="flex border-b border-white/10 bg-[#09090b] text-[11px] font-bold uppercase select-none">
                <button
                  type="button"
                  onClick={() => {
                    setActiveTab('lobby');
                    soundManager.playClick();
                  }}
                  className={`flex-1 py-2 px-3 flex items-center justify-center gap-1.5 border-b-2 transition-all cursor-pointer ${
                    activeTab === 'lobby'
                      ? 'border-[#00FF00] text-[#00FF00] bg-white/[0.02]'
                      : 'border-transparent text-zinc-400 hover:text-zinc-200'
                  }`}
                >
                  <Users className="w-3.5 h-3.5" />
                  <span>GLOBAL LOBBY</span>
                  {unreadLobbyCount > 0 && (
                    <span className="bg-[#00FF00] text-black text-[9px] px-1 py-0.2 font-black animate-pulse">
                      {unreadLobbyCount}
                    </span>
                  )}
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setActiveTab('private');
                    soundManager.playClick();
                  }}
                  className={`flex-1 py-2 px-3 flex items-center justify-center gap-1.5 border-b-2 transition-all cursor-pointer ${
                    activeTab === 'private'
                      ? 'border-[#00FF00] text-[#00FF00] bg-white/[0.02]'
                      : 'border-transparent text-zinc-400 hover:text-zinc-200'
                  }`}
                >
                  <Lock className="w-3.5 h-3.5" />
                  <span>PRIVATE CHAT</span>
                  {unreadPrivateCount > 0 && (
                    <span className="bg-[#00FF00] text-black text-[9px] px-1 py-0.2 font-black animate-pulse">
                      {unreadPrivateCount}
                    </span>
                  )}
                </button>
              </div>

              {/* TAB 1: GLOBAL LOBBY */}
              {activeTab === 'lobby' && (
                <>
                  {/* Channel Banner */}
                  <div 
                    className="px-3 py-1 border-b flex items-center justify-between text-[10px] text-zinc-400"
                    style={{
                      backgroundColor: `rgba(${neonTheme.rgb}, 0.04)`,
                      borderColor: `rgba(${neonTheme.rgb}, 0.12)`
                    }}
                  >
                    <span className="flex items-center gap-1 truncate" style={{ color: neonTheme.hex }}>
                      <Sparkles className="w-3 h-3 shrink-0" />
                      <span className="truncate">Transmitting to all verified duelists • Click username to inspect</span>
                    </span>
                    <span className="text-zinc-500 shrink-0 ml-2">Subnet // 01</span>
                  </div>

                  {/* Messages Feed */}
                  <div 
                    ref={chatContainerRef}
                    className="flex-1 overflow-y-auto p-3 space-y-2.5 custom-scrollbar bg-black/40"
                  >
                    {messages.length === 0 ? (
                      <div className="h-full flex flex-col items-center justify-center text-center text-zinc-500 p-6">
                        <Terminal className="w-8 h-8 text-zinc-600 mb-2 animate-pulse" />
                        <p className="text-zinc-300 font-bold">No lobby transmissions yet</p>
                        <p className="text-[11px] text-zinc-500 mt-1 max-w-[260px]">
                          Real operators only. Send a broadcast or share an image with online duelists across the arena!
                        </p>
                      </div>
                    ) : (
                      messages.map((msg) => {
                        const isSelf = msg.username.toLowerCase() === currentUsername.toLowerCase();
                        const isSystem = msg.isSystem || msg.userId === 'system';
                        const timeStr = new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

                        if (isSystem) {
                          return (
                            <div 
                              key={msg.id}
                              className="px-2.5 py-1.5 text-[11px] font-mono shadow-sm"
                              style={{
                                backgroundColor: `rgba(${neonTheme.rgb}, 0.08)`,
                                borderLeft: `2px solid ${neonTheme.hex}`,
                                color: neonTheme.hex
                              }}
                            >
                              <div className="flex items-center gap-1.5 text-[10px] text-zinc-400 font-bold uppercase mb-0.5">
                                <ShieldAlert className="w-3 h-3" style={{ color: neonTheme.hex }} />
                                <span>System Notice</span>
                                <span className="text-zinc-500 ml-auto">{timeStr}</span>
                              </div>
                              <p className="leading-relaxed text-zinc-300">{msg.text}</p>
                            </div>
                          );
                        }

                        return (
                          <div 
                            key={msg.id}
                            className={`flex flex-col group relative ${isSelf ? 'items-end' : 'items-start'}`}
                          >
                            {/* Message Header */}
                            <div className="flex items-center gap-1.5 mb-1 px-1 text-[10px]">
                              <button
                                type="button"
                                onClick={() => {
                                  if (!isSelf) {
                                    setInspectedUserForDetails(msg.username);
                                  }
                                }}
                                className={`font-bold flex items-center gap-1 transition-colors ${
                                  isSelf ? 'cursor-default' : 'text-zinc-300 hover:text-[#00FF00] cursor-pointer'
                                }`}
                                style={isSelf ? { color: neonTheme.hex } : undefined}
                                title={isSelf ? 'You' : `View ${msg.username} profile / send DM / add friend`}
                              >
                                <span className={`w-3.5 h-3.5 rounded-full bg-gradient-to-tr ${getAvatarColor(msg.username)} inline-flex items-center justify-center text-[8px] text-white font-black shrink-0`}>
                                  {msg.username.charAt(0).toUpperCase()}
                                </span>
                                <span className="truncate max-w-[120px]">{msg.username}</span>
                                {isSelf && <span className="text-zinc-500 text-[9px]">(You)</span>}
                              </button>

                              {msg.elo !== undefined && (
                                <span className="px-1 py-0.2 bg-white/5 border border-white/10 text-[9px] text-zinc-400">
                                  {msg.elo}
                                </span>
                              )}

                              <span className="text-zinc-600 text-[9px]">{timeStr}</span>

                              {/* Instagram-style Unsend Option for Sender */}
                              {isSelf && (
                                <button
                                  type="button"
                                  onClick={() => handleUnsendMessage(msg.id)}
                                  className="opacity-0 group-hover:opacity-100 hover:opacity-100 focus:opacity-100 transition-opacity p-0.5 text-zinc-500 hover:text-red-400 cursor-pointer ml-1"
                                  title="Unsend message for everyone"
                                  aria-label="Unsend message"
                                >
                                  <Trash2 className="w-3 h-3" />
                                </button>
                              )}
                            </div>

                            {/* Message Bubble */}
                            <div
                              className={`max-w-[88%] px-3 py-2 text-xs break-words leading-relaxed transition-all ${
                                isSelf
                                  ? 'text-white'
                                  : 'bg-zinc-900/90 border border-white/10 text-zinc-200 hover:border-zinc-700'
                              }`}
                              style={isSelf ? {
                                backgroundColor: `rgba(${neonTheme.rgb}, 0.15)`,
                                border: `1px solid rgba(${neonTheme.rgb}, 0.4)`,
                                boxShadow: `0 0 12px rgba(${neonTheme.rgb}, 0.1)`
                              } : undefined}
                            >
                              {msg.imageUrl && (
                                <div className="mb-2 relative group/img cursor-pointer overflow-hidden border border-white/15">
                                  <img
                                    src={msg.imageUrl}
                                    alt="Transmission visual payload"
                                    onClick={() => setLightboxImage(msg.imageUrl || null)}
                                    className="max-h-48 max-w-full object-cover hover:scale-102 transition-transform"
                                    loading="lazy"
                                  />
                                  <div 
                                    onClick={() => setLightboxImage(msg.imageUrl || null)}
                                    className="absolute inset-0 bg-black/40 opacity-0 group-hover/img:opacity-100 transition-opacity flex items-center justify-center gap-1 text-[11px] text-white font-mono font-bold"
                                  >
                                    <ZoomIn className="w-4 h-4" />
                                    <span>Zoom</span>
                                  </div>
                                </div>
                              )}

                              {msg.text && (
                                <p className="whitespace-pre-wrap">{msg.text}</p>
                              )}
                            </div>
                          </div>
                        );
                      })
                    )}
                    <div ref={messagesEndRef} />
                  </div>

                  {/* Quick Prompts Bar */}
                  <div className="px-2.5 py-1.5 bg-black/60 border-t border-white/5 flex items-center gap-1.5 overflow-x-auto no-scrollbar">
                    {QUICK_PROMPTS.map((prompt, idx) => (
                      <button
                        key={idx}
                        type="button"
                        onClick={() => handleSendMessage(prompt)}
                        className="px-2 py-0.5 bg-white/5 hover:bg-white/10 border border-white/10 text-[10px] text-zinc-300 hover:text-white whitespace-nowrap transition-all cursor-pointer shrink-0"
                      >
                        {prompt}
                      </button>
                    ))}
                  </div>
                </>
              )}

              {/* TAB 2: PRIVATE CHAT */}
              {activeTab === 'private' && (
                <div className="flex-1 flex flex-col overflow-hidden bg-black/40">
                  {selectedPrivateUser ? (
                    // ACTIVE PRIVATE CONVERSATION VIEW
                    <>
                      {/* Active Conversation Sub-header */}
                      <div className="px-3 py-2 bg-[#101012] border-b border-white/10 flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() => setSelectedPrivateUser(null)}
                            className="p-1 text-zinc-400 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
                            title="Back to conversation list"
                          >
                            <ArrowLeft className="w-3.5 h-3.5" />
                          </button>

                          <div 
                            className="flex items-center gap-2 cursor-pointer group"
                            onClick={() => setInspectedUserForDetails(selectedPrivateUser)}
                            title="Inspect user profile"
                          >
                            <span className={`w-5 h-5 rounded-full bg-gradient-to-tr ${getAvatarColor(selectedPrivateUser)} flex items-center justify-center text-[10px] text-white font-bold`}>
                              {selectedPrivateUser.charAt(0).toUpperCase()}
                            </span>
                            <div>
                              <div className="font-bold text-white group-hover:text-[#00FF00] transition-colors leading-tight flex items-center gap-1.5">
                                <span>{selectedPrivateUser}</span>
                                <span className="text-[9px] text-[#00FF00] font-mono">[PROFILE]</span>
                              </div>
                              <div className="text-[9px] text-zinc-400 leading-none">
                                {isSelectedPrivateUserTyping ? (
                                  <span className="text-[#00FF00] font-bold animate-pulse flex items-center gap-1">
                                    <span className="w-1.5 h-1.5 rounded-full bg-[#00FF00] inline-block animate-ping" />
                                    typing...
                                  </span>
                                ) : (
                                  'End-to-end combat transmission'
                                )}
                              </div>
                            </div>
                          </div>
                        </div>

                        <button
                          type="button"
                          onClick={() => setInspectedUserForDetails(selectedPrivateUser)}
                          className="px-2 py-1 bg-white/5 border border-white/15 text-zinc-300 hover:text-white text-[10px] uppercase font-bold flex items-center gap-1 cursor-pointer"
                        >
                          <User className="w-3 h-3" />
                          <span>PROFILE</span>
                        </button>
                      </div>

                      {/* Private Message Stream */}
                      <div className="flex-1 overflow-y-auto p-3 space-y-2.5 custom-scrollbar">
                        {privateMessages.length === 0 ? (
                          <div className="h-full flex flex-col items-center justify-center text-center text-zinc-500 p-6">
                            <Lock className="w-8 h-8 text-zinc-700 mb-2" />
                            <p className="text-zinc-300 font-bold uppercase text-xs">Direct Channel Initialized</p>
                            <p className="text-[11px] text-zinc-500 mt-1 max-w-[260px]">
                              Send private tactical tips, problem discussions, or direct duel links with {selectedPrivateUser}.
                            </p>
                          </div>
                        ) : (
                          privateMessages.map((pMsg) => {
                            const isSelf = pMsg.fromUsername.toLowerCase() === currentUsername.toLowerCase();
                            const timeStr = new Date(pMsg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

                            return (
                              <div 
                                key={pMsg.id}
                                className={`flex flex-col group relative ${isSelf ? 'items-end' : 'items-start'}`}
                              >
                                <div className="flex items-center gap-1.5 mb-1 px-1 text-[10px]">
                                  <span className="font-bold text-zinc-300">
                                    {isSelf ? 'You' : pMsg.fromUsername}
                                  </span>
                                  <span className="text-zinc-600 text-[9px]">{timeStr}</span>

                                  {isSelf && (
                                    <button
                                      type="button"
                                      onClick={() => handleUnsendMessage(pMsg.id)}
                                      className="opacity-0 group-hover:opacity-100 hover:opacity-100 transition-opacity p-0.5 text-zinc-500 hover:text-red-400 cursor-pointer ml-1"
                                      title="Unsend private message"
                                    >
                                      <Trash2 className="w-3 h-3" />
                                    </button>
                                  )}
                                </div>

                                <div
                                  className={`max-w-[88%] px-3 py-2 text-xs break-words leading-relaxed ${
                                    isSelf
                                      ? 'text-white'
                                      : 'bg-zinc-900 border border-white/10 text-zinc-200'
                                  }`}
                                  style={isSelf ? {
                                    backgroundColor: `rgba(${neonTheme.rgb}, 0.2)`,
                                    border: `1px solid rgba(${neonTheme.rgb}, 0.5)`
                                  } : undefined}
                                >
                                  {pMsg.imageUrl && (
                                    <div className="mb-2 relative group/img cursor-pointer overflow-hidden border border-white/15">
                                      <img
                                        src={pMsg.imageUrl}
                                        alt="Private attachment"
                                        onClick={() => setLightboxImage(pMsg.imageUrl || null)}
                                        className="max-h-48 max-w-full object-cover hover:scale-102 transition-transform"
                                        loading="lazy"
                                      />
                                      <div 
                                        onClick={() => setLightboxImage(pMsg.imageUrl || null)}
                                        className="absolute inset-0 bg-black/40 opacity-0 group-hover/img:opacity-100 transition-opacity flex items-center justify-center gap-1 text-[11px] text-white font-mono font-bold"
                                      >
                                        <ZoomIn className="w-4 h-4" />
                                        <span>Zoom</span>
                                      </div>
                                    </div>
                                  )}

                                  {pMsg.text && (
                                    <p className="whitespace-pre-wrap">{pMsg.text}</p>
                                  )}
                                </div>
                              </div>
                            );
                          })
                        )}
                        <div ref={messagesEndRef} />
                      </div>
                    </>
                  ) : (
                    // CONVERSATIONS & SQUAD DIRECTORY VIEW
                    <div className="flex-1 overflow-y-auto p-3 flex flex-col gap-4">
                      {/* Search or Start New Chat */}
                      <form onSubmit={handleStartNewChat} className="flex gap-2">
                        <input
                          type="text"
                          value={newChatHandle}
                          onChange={(e) => setNewChatHandle(e.target.value)}
                          placeholder="Type handle to message privately..."
                          className="flex-1 bg-black border border-white/15 px-3 py-2 text-xs text-white placeholder:text-zinc-600 outline-none focus:border-[#00FF00]"
                        />
                        <button
                          type="submit"
                          disabled={!newChatHandle.trim()}
                          className="px-3 py-2 bg-[#00FF00] text-black font-black uppercase text-xs hover:bg-[#00dd00] disabled:opacity-50 transition-colors cursor-pointer"
                        >
                          CHAT
                        </button>
                      </form>

                      {/* Active Threads List */}
                      <div>
                        <div className="text-[10px] uppercase font-bold text-zinc-400 mb-2 flex items-center gap-1.5">
                          <MessageSquare className="w-3 h-3 text-[#00FF00]" />
                          <span>CONVERSATION THREADS ({conversations.length})</span>
                        </div>

                        {conversations.length === 0 ? (
                          <div className="p-4 bg-black/40 border border-white/5 text-center text-zinc-500 text-xs">
                            No private threads yet. Start a chat above or pick a friend below!
                          </div>
                        ) : (
                          <div className="divide-y divide-white/5 border border-white/10 bg-[#080808]">
                            {conversations.map((c) => (
                              <div
                                key={c.otherUsername}
                                onClick={() => setSelectedPrivateUser(c.otherUsername)}
                                className="p-2.5 flex items-center justify-between hover:bg-white/[0.03] transition-colors cursor-pointer"
                              >
                                <div className="flex items-center gap-2.5 min-w-0">
                                  <span className={`w-7 h-7 rounded-full bg-gradient-to-tr ${getAvatarColor(c.otherUsername)} flex items-center justify-center text-xs text-white font-bold shrink-0`}>
                                    {c.otherUsername.charAt(0).toUpperCase()}
                                  </span>
                                  <div className="min-w-0">
                                    <div className="font-bold text-white uppercase truncate">
                                      {c.otherUsername}
                                    </div>
                                    <div className="text-[10px] text-zinc-400 truncate max-w-[200px]">
                                      {privateTypingUsers[c.otherUsername.toLowerCase()] && (Date.now() - (privateTypingUsers[c.otherUsername.toLowerCase()] || 0) < 3500) ? (
                                        <span className="text-[#00FF00] font-bold flex items-center gap-1 animate-pulse">
                                          <span className="w-1.5 h-1.5 rounded-full bg-[#00FF00] inline-block animate-ping" />
                                          typing...
                                        </span>
                                      ) : (
                                        c.lastMessage || 'Sent an attachment'
                                      )}
                                    </div>
                                  </div>
                                </div>

                                <div className="text-[9px] text-zinc-500 shrink-0">
                                  {new Date(c.lastTimestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>

                      {/* Friends Quick Chat Directory */}
                      {friendsList.length > 0 && (
                        <div>
                          <div className="text-[10px] uppercase font-bold text-zinc-400 mb-2 flex items-center gap-1.5">
                            <Users className="w-3 h-3 text-[#00FF00]" />
                            <span>FRIENDS SQUAD ({friendsList.length})</span>
                          </div>

                          <div className="divide-y divide-white/5 border border-white/10 bg-[#080808]">
                            {friendsList.map((f) => (
                              <div
                                key={f}
                                className="p-2.5 flex items-center justify-between hover:bg-white/[0.03] transition-colors"
                              >
                                <div 
                                  className="flex items-center gap-2 cursor-pointer"
                                  onClick={() => setInspectedUserForDetails(f)}
                                >
                                  <span className={`w-6 h-6 rounded-full bg-gradient-to-tr ${getAvatarColor(f)} flex items-center justify-center text-xs text-white font-bold`}>
                                    {f.charAt(0).toUpperCase()}
                                  </span>
                                  <span className="font-bold text-white uppercase text-xs">{f}</span>
                                </div>

                                <button
                                  type="button"
                                  onClick={() => setSelectedPrivateUser(f)}
                                  className="px-2 py-1 bg-[#00FF00]/10 hover:bg-[#00FF00] border border-[#00FF00]/40 text-[#00FF00] hover:text-black font-black uppercase text-[10px] transition-all cursor-pointer"
                                >
                                  MESSAGE
                                </button>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}

              {/* Selected Image Attachment Preview Bar */}
              <AnimatePresence>
                {selectedImage && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    className="px-3 py-2 bg-zinc-900 border-t border-white/10 flex items-center justify-between gap-3 overflow-hidden"
                  >
                    <div className="flex items-center gap-2.5 truncate">
                      <div className="relative w-10 h-10 border border-white/20 overflow-hidden shrink-0 bg-black">
                        <img 
                          src={selectedImage} 
                          alt="Attachment preview" 
                          className="w-full h-full object-cover" 
                        />
                      </div>
                      <div className="truncate">
                        <span className="text-[11px] font-bold text-white block truncate">
                          {imageFileName || 'Attached Image'}
                        </span>
                        <span className="text-[9px] text-[#00FF00] font-mono">
                          Ready to transmit
                        </span>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={handleClearSelectedImage}
                      className="p-1 text-zinc-400 hover:text-red-400 hover:bg-white/5 transition-colors cursor-pointer"
                      title="Remove attached image"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Emoji Picker Popover */}
              {showEmojiPicker && (
                <div className="absolute bottom-16 right-3 z-40">
                  <EmojiPicker 
                    onSelect={handleEmojiSelect}
                    onClose={() => setShowEmojiPicker(false)}
                  />
                </div>
              )}

              {/* Real-time Typing Indicators */}
              <AnimatePresence>
                {activeTab === 'lobby' && activeLobbyTypingNames.length > 0 && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    className="px-3 py-1.5 bg-black/95 border-t border-white/10 flex items-center gap-2 text-[11px] font-mono text-zinc-400 shrink-0 select-none overflow-hidden"
                  >
                    <span className="flex items-center gap-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-[#00FF00] animate-bounce [animation-delay:-0.3s]" />
                      <span className="w-1.5 h-1.5 rounded-full bg-[#00FF00] animate-bounce [animation-delay:-0.15s]" />
                      <span className="w-1.5 h-1.5 rounded-full bg-[#00FF00] animate-bounce" />
                    </span>
                    <span className="truncate">
                      {activeLobbyTypingNames.length === 1
                        ? `${activeLobbyTypingNames[0]} is typing...`
                        : activeLobbyTypingNames.length === 2
                        ? `${activeLobbyTypingNames[0]} & ${activeLobbyTypingNames[1]} are typing...`
                        : `${activeLobbyTypingNames[0]} and ${activeLobbyTypingNames.length - 1} others are typing...`}
                    </span>
                  </motion.div>
                )}

                {activeTab === 'private' && selectedPrivateUser && isSelectedPrivateUserTyping && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    className="px-3 py-1.5 bg-black/95 border-t border-white/10 flex items-center gap-2 text-[11px] font-mono text-[#00FF00] shrink-0 select-none overflow-hidden"
                  >
                    <span className="flex items-center gap-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-[#00FF00] animate-bounce [animation-delay:-0.3s]" />
                      <span className="w-1.5 h-1.5 rounded-full bg-[#00FF00] animate-bounce [animation-delay:-0.15s]" />
                      <span className="w-1.5 h-1.5 rounded-full bg-[#00FF00] animate-bounce" />
                    </span>
                    <span className="truncate font-bold">
                      @{selectedPrivateUser} is typing...
                    </span>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Message Input Bar (Rendered when in Lobby or when Private User Selected) */}
              {(activeTab === 'lobby' || (activeTab === 'private' && selectedPrivateUser)) && (
                <div className="p-2.5 bg-black border-t border-white/10 flex items-center gap-2 relative">
                  {/* Hidden File Input */}
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/png, image/jpeg, image/gif, image/webp"
                    onChange={handleFileSelect}
                    className="hidden"
                    id="lobby-chat-image-input"
                  />

                  {/* Upload Image Button */}
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={isUploadingImage}
                    className={`p-2 border transition-all flex items-center justify-center shrink-0 cursor-pointer ${
                      selectedImage
                        ? 'bg-[#00FF00]/20 text-[#00FF00] border-[#00FF00]/50'
                        : 'bg-zinc-900 text-zinc-400 hover:text-white border-white/15 hover:border-white/30'
                    }`}
                    title="Upload Image (PNG, JPG, WebP) or drag & drop"
                  >
                    <ImageIcon className="w-4 h-4" />
                  </button>

                  {/* Emoji Picker Button */}
                  <button
                    type="button"
                    onClick={() => setShowEmojiPicker(prev => !prev)}
                    className={`p-2 border transition-all flex items-center justify-center shrink-0 cursor-pointer ${
                      showEmojiPicker
                        ? 'bg-[#00FF00] text-black border-[#00FF00]'
                        : 'bg-zinc-900 text-zinc-400 hover:text-white border-white/15 hover:border-white/30'
                    }`}
                    title="Insert Emoji"
                  >
                    <Smile className="w-4 h-4" />
                  </button>

                  {/* Text Input */}
                  <div className="relative flex-1">
                    <input
                      ref={inputRef}
                      type="text"
                      value={inputText}
                      onChange={(e) => handleInputChange(e.target.value)}
                      onKeyDown={handleKeyDown}
                      placeholder={
                        selectedImage 
                          ? "Add caption..." 
                          : activeTab === 'lobby' 
                            ? "Broadcast to global lobby..." 
                            : `Message @${selectedPrivateUser} privately...`
                      }
                      maxLength={300}
                      className="w-full px-3 py-2 bg-zinc-900/90 border border-white/15 text-xs text-white placeholder:text-zinc-600 outline-none transition-all pr-12 font-mono"
                      style={{
                        borderColor: inputText.trim() ? `rgba(${neonTheme.rgb}, 0.5)` : undefined
                      }}
                    />
                    {inputText.length > 200 && (
                      <span className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[10px] text-zinc-500 pointer-events-none">
                        {300 - inputText.length}
                      </span>
                    )}
                  </div>

                  {/* Send Button */}
                  <button
                    type="button"
                    id="floating-lobby-chat-send-btn"
                    onClick={() => handleSendMessage()}
                    disabled={!inputText.trim() && !selectedImage}
                    style={(inputText.trim() || selectedImage) ? {
                      backgroundColor: neonTheme.hex,
                      color: neonTheme.contrastText,
                      boxShadow: `0 0 12px rgba(${neonTheme.rgb}, 0.4)`
                    } : undefined}
                    className={`p-2 font-bold transition-all flex items-center justify-center shrink-0 ${
                      (inputText.trim() || selectedImage)
                        ? 'cursor-pointer hover:brightness-110'
                        : 'bg-zinc-800 text-zinc-600 cursor-not-allowed'
                    }`}
                    title="Send transmission (Enter)"
                  >
                    <Send className="w-4 h-4" />
                  </button>
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </>
  );
}
