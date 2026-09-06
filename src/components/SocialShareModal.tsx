import React, { useState, useMemo } from 'react';
import { 
  Share2, 
  Copy, 
  Check, 
  X, 
  ExternalLink, 
  Twitter, 
  Linkedin, 
  MessageCircle, 
  Send, 
  Globe, 
  Terminal, 
  Sparkles, 
  Code2, 
  Trophy,
  CheckCheck,
  Flame,
  MessageSquare
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import clsx from 'clsx';
import { soundManager } from '../lib/soundEffects';

export interface SocialShareModalProps {
  isOpen: boolean;
  onClose: () => void;
  roomId: string;
  problemTitle?: string;
  difficulty?: 'easy' | 'medium' | 'hard' | string;
  roomStatus?: 'waiting' | 'active' | 'finished';
  isWinner?: boolean;
  winnerName?: string;
  myElapsedDuration?: string;
}

type ShareTemplate = 'challenge' | 'spectate' | 'results';

export const SocialShareModal: React.FC<SocialShareModalProps> = ({
  isOpen,
  onClose,
  roomId,
  problemTitle = 'Algorithmic Duel',
  difficulty = 'medium',
  roomStatus = 'waiting',
  isWinner = false,
  winnerName,
  myElapsedDuration,
}) => {
  const [copiedType, setCopiedType] = useState<'link' | 'discord' | 'markdown' | null>(null);
  const [selectedTemplate, setSelectedTemplate] = useState<ShareTemplate>(
    roomStatus === 'finished' ? 'results' : 'challenge'
  );

  const baseUrl = typeof window !== 'undefined' ? window.location.origin : 'https://algoarena.app';
  const roomUrl = `${baseUrl}/room/${roomId}`;

  // Formulated message variants
  const shareTexts = useMemo(() => {
    const cleanDiff = difficulty.toUpperCase();
    return {
      challenge: `⚔️ Duel me in AlgoArena! Can you solve "${problemTitle}" (${cleanDiff}) faster than me in real-time? Join room #${roomId}:`,
      spectate: `👀 Watch my live 1v1 algorithmic duel on AlgoArena! Problem: "${problemTitle}" (${cleanDiff}). Spectate room #${roomId}:`,
      results: isWinner 
        ? `🏆 Victorious in AlgoArena! I just won a 1v1 duel solving "${problemTitle}" in ${myElapsedDuration || 'record time'}. Think you can beat me? Challenge me:`
        : `⚡ Just completed a 1v1 algorithmic duel on AlgoArena solving "${problemTitle}" (${cleanDiff}). Join the next round:`,
    };
  }, [difficulty, problemTitle, roomId, isWinner, myElapsedDuration]);

  const activeMessage = shareTexts[selectedTemplate];

  // Copy helper
  const handleCopy = async (text: string, type: 'link' | 'discord' | 'markdown') => {
    try {
      if (navigator.clipboard && navigator.clipboard.writeText) {
        await navigator.clipboard.writeText(text);
      } else {
        const textarea = document.createElement('textarea');
        textarea.value = text;
        textarea.style.position = 'fixed';
        textarea.style.opacity = '0';
        document.body.appendChild(textarea);
        textarea.select();
        document.execCommand('copy');
        document.body.removeChild(textarea);
      }
      soundManager.playClick();
      setCopiedType(type);
      setTimeout(() => setCopiedType(null), 2200);
    } catch (err) {
      console.error('Failed to copy', err);
    }
  };

  // Discord formatted challenge text
  const discordText = `⚔️ **AlgoArena 1v1 Challenge**\nProblem: **${problemTitle}** [${difficulty.toUpperCase()}]\nRoom ID: \`#${roomId}\`\n👉 **Join Duel**: ${roomUrl}`;

  // Markdown link
  const markdownText = `[⚔️ Join AlgoArena 1v1 Duel: ${problemTitle}](${roomUrl})`;

  // Social Share Handlers
  const handleShareTwitter = () => {
    const twitterText = `${activeMessage} ${roomUrl} #AlgoArena #CompetitiveProgramming #LeetCode`;
    const url = `https://twitter.com/intent/tweet?text=${encodeURIComponent(twitterText)}`;
    window.open(url, '_blank', 'noopener,noreferrer,width=600,height=450');
    soundManager.playClick();
  };

  const handleShareWhatsApp = () => {
    const text = `${activeMessage} ${roomUrl}`;
    const url = `https://api.whatsapp.com/send?text=${encodeURIComponent(text)}`;
    window.open(url, '_blank', 'noopener,noreferrer');
    soundManager.playClick();
  };

  const handleShareTelegram = () => {
    const url = `https://t.me/share/url?url=${encodeURIComponent(roomUrl)}&text=${encodeURIComponent(activeMessage)}`;
    window.open(url, '_blank', 'noopener,noreferrer');
    soundManager.playClick();
  };

  const handleShareLinkedIn = () => {
    const url = `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(roomUrl)}`;
    window.open(url, '_blank', 'noopener,noreferrer,width=600,height=550');
    soundManager.playClick();
  };

  const handleShareReddit = () => {
    const title = `⚔️ Live 1v1 Coding Duel: ${problemTitle} (${difficulty.toUpperCase()})`;
    const url = `https://reddit.com/submit?url=${encodeURIComponent(roomUrl)}&title=${encodeURIComponent(title)}`;
    window.open(url, '_blank', 'noopener,noreferrer');
    soundManager.playClick();
  };

  const handleNativeShare = async () => {
    if (typeof navigator !== 'undefined' && navigator.share) {
      try {
        await navigator.share({
          title: `AlgoArena: ${problemTitle}`,
          text: activeMessage,
          url: roomUrl,
        });
        soundManager.playClick();
      } catch (err: any) {
        if (err.name !== 'AbortError') {
          console.error('Web share error:', err);
        }
      }
    }
  };

  const hasNativeShare = typeof navigator !== 'undefined' && !!navigator.share;

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div 
        className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm"
        id="algoarena-social-share-backdrop"
        onClick={onClose}
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 10 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 10 }}
          transition={{ duration: 0.2 }}
          onClick={(e) => e.stopPropagation()}
          className="w-full max-w-xl bg-[#090909] border border-white/15 text-white shadow-2xl overflow-hidden font-mono"
          id="algoarena-social-share-modal"
        >
          {/* Header */}
          <div className="bg-[#111111] px-5 py-3.5 border-b border-white/10 flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-7 h-7 bg-[#00FF00]/15 border border-[#00FF00]/40 flex items-center justify-center text-[#00FF00]">
                <Share2 className="w-4 h-4" />
              </div>
              <div>
                <h2 className="text-sm font-black uppercase tracking-wider text-white flex items-center gap-2">
                  <span>SHARE 1V1 DUEL</span>
                  <span className="text-[10px] px-1.5 py-0.5 bg-[#00FF00]/10 text-[#00FF00] border border-[#00FF00]/30">
                    ROOM #{roomId}
                  </span>
                </h2>
                <p className="text-[10px] text-zinc-400">
                  Invite friends, challengers, or broadcast your duel link
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={onClose}
              className="p-1.5 text-zinc-400 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
              title="Close Share Dialog (Esc)"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="p-5 space-y-5">
            {/* Match Context Card */}
            <div className="p-3 bg-black border border-white/10 flex items-center justify-between gap-3 text-xs">
              <div className="space-y-1 overflow-hidden">
                <div className="flex items-center gap-2">
                  <span className="text-[9px] uppercase font-bold text-zinc-500 tracking-wider">CHALLENGE PROBLEM:</span>
                  <span className={clsx(
                    "text-[9px] font-black uppercase px-1.5 py-0.2 border",
                    difficulty === 'hard' ? "bg-rose-500/20 text-rose-400 border-rose-500/40" :
                    difficulty === 'medium' ? "bg-[#F27D26]/20 text-[#F27D26] border-[#F27D26]/40" :
                    "bg-emerald-500/20 text-emerald-400 border-emerald-500/40"
                  )}>
                    {difficulty}
                  </span>
                </div>
                <p className="font-bold text-white truncate text-[13px]">{problemTitle}</p>
              </div>

              <div className="text-right shrink-0">
                <span className="text-[9px] text-zinc-500 block uppercase font-bold">STATUS</span>
                <span className={clsx(
                  "text-[10px] font-black uppercase tracking-wider flex items-center gap-1 justify-end",
                  roomStatus === 'active' ? "text-[#00FF00]" :
                  roomStatus === 'finished' ? "text-[#F27D26]" : "text-cyan-400"
                )}>
                  <span className={clsx(
                    "w-1.5 h-1.5 rounded-full",
                    roomStatus === 'active' ? "bg-[#00FF00] animate-pulse" :
                    roomStatus === 'finished' ? "bg-[#F27D26]" : "bg-cyan-400 animate-ping"
                  )} />
                  {roomStatus === 'active' ? 'IN DUEL' : roomStatus === 'finished' ? 'FINISHED' : 'WAITING'}
                </span>
              </div>
            </div>

            {/* Template Selector Tabs */}
            <div>
              <label className="block text-[10px] font-bold uppercase text-zinc-400 tracking-wider mb-1.5">
                SHARE MESSAGE THEME:
              </label>
              <div className="grid grid-cols-3 gap-1.5 bg-black/60 p-1 border border-white/10">
                <button
                  type="button"
                  onClick={() => setSelectedTemplate('challenge')}
                  className={clsx(
                    "py-1.5 px-2 text-[10px] font-bold uppercase tracking-wider transition-all flex items-center justify-center gap-1 cursor-pointer",
                    selectedTemplate === 'challenge'
                      ? "bg-[#00FF00]/20 text-[#00FF00] border border-[#00FF00]/40 font-black shadow-sm"
                      : "text-zinc-400 hover:text-white"
                  )}
                >
                  <Flame className="w-3 h-3" />
                  <span>Challenge 1v1</span>
                </button>

                <button
                  type="button"
                  onClick={() => setSelectedTemplate('spectate')}
                  className={clsx(
                    "py-1.5 px-2 text-[10px] font-bold uppercase tracking-wider transition-all flex items-center justify-center gap-1 cursor-pointer",
                    selectedTemplate === 'spectate'
                      ? "bg-[#00FF00]/20 text-[#00FF00] border border-[#00FF00]/40 font-black shadow-sm"
                      : "text-zinc-400 hover:text-white"
                  )}
                >
                  <Terminal className="w-3 h-3" />
                  <span>Spectator</span>
                </button>

                <button
                  type="button"
                  onClick={() => setSelectedTemplate('results')}
                  className={clsx(
                    "py-1.5 px-2 text-[10px] font-bold uppercase tracking-wider transition-all flex items-center justify-center gap-1 cursor-pointer",
                    selectedTemplate === 'results'
                      ? "bg-[#00FF00]/20 text-[#00FF00] border border-[#00FF00]/40 font-black shadow-sm"
                      : "text-zinc-400 hover:text-white"
                  )}
                >
                  <Trophy className="w-3 h-3" />
                  <span>Match Stats</span>
                </button>
              </div>
            </div>

            {/* Direct Room Link Box */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-[10px] font-bold uppercase text-zinc-400 tracking-wider">
                  DIRECT ARENA ROOM LINK:
                </label>
                {copiedType === 'link' && (
                  <span className="text-[10px] text-[#00FF00] font-black flex items-center gap-1 animate-pulse">
                    <CheckCheck className="w-3.5 h-3.5" /> COPIED TO CLIPBOARD!
                  </span>
                )}
              </div>
              <div className="flex items-stretch gap-2">
                <div className="flex-1 bg-black border border-white/15 px-3 py-2 text-xs font-mono text-zinc-300 select-all truncate flex items-center">
                  <span className="text-zinc-500 mr-2">LINK:</span>
                  <span className="text-[#00FF00] font-bold truncate">{roomUrl}</span>
                </div>
                <button
                  type="button"
                  onClick={() => handleCopy(roomUrl, 'link')}
                  className={clsx(
                    "px-4 py-2 text-xs font-bold uppercase tracking-wider flex items-center gap-1.5 transition-all cursor-pointer shrink-0",
                    copiedType === 'link'
                      ? "bg-[#00FF00] text-black shadow-[0_0_12px_rgba(0,255,0,0.4)]"
                      : "bg-white hover:bg-zinc-200 text-black font-black"
                  )}
                >
                  {copiedType === 'link' ? <Check className="w-3.5 h-3.5 stroke-[3]" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copiedType === 'link' ? 'COPIED' : 'COPY'}</span>
                </button>
              </div>
            </div>

            {/* Social Share One-Click Platforms */}
            <div>
              <label className="block text-[10px] font-bold uppercase text-zinc-400 tracking-wider mb-2">
                SHARE DIRECTLY TO SOCIAL PLATFORMS:
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {/* X / Twitter */}
                <button
                  type="button"
                  onClick={handleShareTwitter}
                  className="p-2.5 bg-black/80 hover:bg-black border border-white/10 hover:border-[#1DA1F2]/60 text-zinc-300 hover:text-white flex items-center gap-2 transition-colors cursor-pointer group"
                >
                  <div className="w-6 h-6 rounded bg-[#1DA1F2]/10 border border-[#1DA1F2]/30 flex items-center justify-center text-[#1DA1F2] group-hover:scale-105 transition-transform">
                    <Twitter className="w-3.5 h-3.5" />
                  </div>
                  <div className="text-left leading-none">
                    <span className="text-xs font-bold block">X / Twitter</span>
                    <span className="text-[9px] text-zinc-500">Post Tweet</span>
                  </div>
                </button>

                {/* WhatsApp */}
                <button
                  type="button"
                  onClick={handleShareWhatsApp}
                  className="p-2.5 bg-black/80 hover:bg-black border border-white/10 hover:border-[#25D366]/60 text-zinc-300 hover:text-white flex items-center gap-2 transition-colors cursor-pointer group"
                >
                  <div className="w-6 h-6 rounded bg-[#25D366]/10 border border-[#25D366]/30 flex items-center justify-center text-[#25D366] group-hover:scale-105 transition-transform">
                    <MessageCircle className="w-3.5 h-3.5" />
                  </div>
                  <div className="text-left leading-none">
                    <span className="text-xs font-bold block">WhatsApp</span>
                    <span className="text-[9px] text-zinc-500">Direct Chat</span>
                  </div>
                </button>

                {/* Telegram */}
                <button
                  type="button"
                  onClick={handleShareTelegram}
                  className="p-2.5 bg-black/80 hover:bg-black border border-white/10 hover:border-[#0088cc]/60 text-zinc-300 hover:text-white flex items-center gap-2 transition-colors cursor-pointer group"
                >
                  <div className="w-6 h-6 rounded bg-[#0088cc]/10 border border-[#0088cc]/30 flex items-center justify-center text-[#0088cc] group-hover:scale-105 transition-transform">
                    <Send className="w-3.5 h-3.5" />
                  </div>
                  <div className="text-left leading-none">
                    <span className="text-xs font-bold block">Telegram</span>
                    <span className="text-[9px] text-zinc-500">Broadcast</span>
                  </div>
                </button>

                {/* LinkedIn */}
                <button
                  type="button"
                  onClick={handleShareLinkedIn}
                  className="p-2.5 bg-black/80 hover:bg-black border border-white/10 hover:border-[#0A66C2]/60 text-zinc-300 hover:text-white flex items-center gap-2 transition-colors cursor-pointer group"
                >
                  <div className="w-6 h-6 rounded bg-[#0A66C2]/10 border border-[#0A66C2]/30 flex items-center justify-center text-[#0A66C2] group-hover:scale-105 transition-transform">
                    <Linkedin className="w-3.5 h-3.5" />
                  </div>
                  <div className="text-left leading-none">
                    <span className="text-xs font-bold block">LinkedIn</span>
                    <span className="text-[9px] text-zinc-500">Post Feed</span>
                  </div>
                </button>
              </div>

              {/* Extra Secondary Share Actions: Discord / Reddit / Native */}
              <div className="mt-2.5 flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  onClick={() => handleCopy(discordText, 'discord')}
                  className="px-3 py-1.5 bg-black border border-white/10 hover:border-purple-500/50 text-zinc-300 hover:text-white text-[11px] font-bold flex items-center gap-1.5 transition-colors cursor-pointer"
                  title="Copy ready-to-paste Discord rich challenge format"
                >
                  <MessageSquare className="w-3 h-3 text-purple-400" />
                  <span>{copiedType === 'discord' ? 'COPIED DISCORD TEXT!' : 'Copy for Discord'}</span>
                </button>

                <button
                  type="button"
                  onClick={handleShareReddit}
                  className="px-3 py-1.5 bg-black border border-white/10 hover:border-orange-500/50 text-zinc-300 hover:text-white text-[11px] font-bold flex items-center gap-1.5 transition-colors cursor-pointer"
                >
                  <Globe className="w-3 h-3 text-orange-400" />
                  <span>Share to Reddit</span>
                </button>

                <button
                  type="button"
                  onClick={() => handleCopy(markdownText, 'markdown')}
                  className="px-3 py-1.5 bg-black border border-white/10 hover:border-white/30 text-zinc-400 hover:text-white text-[11px] font-bold flex items-center gap-1.5 transition-colors cursor-pointer"
                >
                  <Code2 className="w-3 h-3 text-zinc-400" />
                  <span>{copiedType === 'markdown' ? 'COPIED MD LINK!' : 'Copy Markdown'}</span>
                </button>

                {hasNativeShare && (
                  <button
                    type="button"
                    onClick={handleNativeShare}
                    className="px-3 py-1.5 bg-[#00FF00]/10 border border-[#00FF00]/30 hover:bg-[#00FF00]/20 text-[#00FF00] text-[11px] font-bold flex items-center gap-1.5 transition-colors cursor-pointer ml-auto"
                  >
                    <ExternalLink className="w-3 h-3" />
                    <span>More Options...</span>
                  </button>
                )}
              </div>
            </div>

            {/* Social Post Preview Card */}
            <div className="p-3 bg-black/70 border border-white/10 text-xs font-mono">
              <div className="text-[10px] font-black uppercase text-zinc-500 tracking-wider mb-1 flex items-center gap-1.5">
                <Terminal className="w-3 h-3 text-[#00FF00]" />
                MESSAGE PREVIEW:
              </div>
              <p className="text-zinc-300 italic leading-relaxed text-[11px]">
                "{activeMessage} <span className="text-[#00FF00] underline">{roomUrl}</span>"
              </p>
            </div>
          </div>

          {/* Footer */}
          <div className="bg-[#111111] px-5 py-3 border-t border-white/10 flex items-center justify-between text-[11px] text-zinc-400">
            <span>Any player with this link can enter and challenge you in this room.</span>
            <button
              type="button"
              onClick={onClose}
              className="px-3 py-1 bg-zinc-800 hover:bg-zinc-700 text-white font-bold transition-colors cursor-pointer"
            >
              CLOSE
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};

/**
 * High-craft Social Share Trigger Button for Arena
 */
export interface SocialShareButtonProps {
  roomId: string;
  onClick: () => void;
  variant?: 'navbar' | 'lobby' | 'card' | 'victory';
  className?: string;
}

export const SocialShareButton: React.FC<SocialShareButtonProps> = ({
  roomId,
  onClick,
  variant = 'navbar',
  className,
}) => {
  if (variant === 'lobby') {
    return (
      <button
        type="button"
        onClick={onClick}
        id="arena-social-share-lobby-btn"
        className={clsx(
          "w-full py-2 bg-black border border-white/20 hover:border-[#00FF00] text-zinc-200 hover:text-[#00FF00] font-mono text-[11px] font-black uppercase tracking-wider flex items-center justify-center gap-2 transition-all cursor-pointer shadow-sm group",
          className
        )}
      >
        <Share2 className="w-3.5 h-3.5 text-[#00FF00] group-hover:scale-110 transition-transform" />
        <span>SHARE ROOM & INVITE CHALLENGERS</span>
      </button>
    );
  }

  if (variant === 'victory') {
    return (
      <button
        type="button"
        onClick={onClick}
        id="arena-social-share-victory-btn"
        className={clsx(
          "px-4 py-2 bg-[#00FF00] hover:bg-[#00CC00] text-black font-mono text-xs font-black uppercase tracking-wider flex items-center gap-2 transition-all cursor-pointer shadow-[0_0_15px_rgba(0,255,0,0.3)]",
          className
        )}
      >
        <Share2 className="w-4 h-4 stroke-[2.5]" />
        <span>SHARE VICTORY & ROOM</span>
      </button>
    );
  }

  // Navbar default variant
  return (
    <button
      type="button"
      onClick={onClick}
      id="arena-social-share-navbar-btn"
      className={clsx(
        "flex items-center gap-1.5 px-2.5 py-1.5 bg-black/60 hover:bg-black border border-white/15 hover:border-[#00FF00]/50 text-zinc-300 hover:text-[#00FF00] font-mono text-[10px] font-bold uppercase tracking-wider transition-all cursor-pointer group shrink-0",
        className
      )}
      title={`Share Room #${roomId} to social platforms or copy link`}
    >
      <Share2 className="w-3.5 h-3.5 text-[#00FF00] group-hover:rotate-12 transition-transform" />
      <span className="hidden sm:inline">SHARE DUEL</span>
    </button>
  );
};
