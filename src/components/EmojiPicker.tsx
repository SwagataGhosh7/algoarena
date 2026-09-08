import React, { useState, useEffect, useRef } from 'react';
import { Search, X, Flame, Swords, Laptop, Smile, Sparkles } from 'lucide-react';
import clsx from 'clsx';

interface EmojiPickerProps {
  onSelect: (emoji: string) => void;
  onClose: () => void;
  className?: string;
}

interface Category {
  id: string;
  name: string;
  icon: React.ReactNode;
  emojis: string[];
}

const CATEGORIES: Category[] = [
  {
    id: 'arena',
    name: 'Arena',
    icon: <Swords className="w-3.5 h-3.5" />,
    emojis: ['⚔️', '🛡️', '🏆', '👑', '💀', '🔥', '⚡', '🎯', '💥', '🦾', '🕹️', '🚀', '👾', '🎲', '🥇', '🥈', '🥉', '🎪', '💣', '🏹', '🥊', '🥋', '🤺', '🏁', '🚩']
  },
  {
    id: 'code',
    name: 'Tech & DSA',
    icon: <Laptop className="w-3.5 h-3.5" />,
    emojis: ['💻', '🖥️', '⌨️', '🧠', '🤖', '🐛', '⚡', '🔍', '📦', '☕', '🐍', '🦀', '🧩', '⚙️', '💾', '📡', '🔌', '💎', '⏳', '⏱️', '📈', '📉', '💡', '🧪']
  },
  {
    id: 'reactions',
    name: 'Reactions',
    icon: <Smile className="w-3.5 h-3.5" />,
    emojis: ['👍', '👎', '👏', '🙌', '🤝', '🫡', '🔥', '💯', '✨', '🎉', '🥳', '🚀', '😎', '🤯', '🥶', '😱', '😂', '🤣', '💀', '🤫', '🧐', '🤐', '😴', '🤩']
  },
  {
    id: 'symbols',
    name: 'Badges',
    icon: <Sparkles className="w-3.5 h-3.5" />,
    emojis: ['💚', '❤️', '💜', '💙', '🖤', '🤍', '💯', '⚠️', '❗', '❓', '⚡', '🌟', '⭐', '💫', '🛑', '🟢', '🔴', '🟡', '🟣', '🔒', '🔓', '✅', '❌', '✨']
  }
];

export const EmojiPicker: React.FC<EmojiPickerProps> = ({ onSelect, onClose, className }) => {
  const [activeTab, setActiveTab] = useState<string>('arena');
  const [search, setSearch] = useState<string>('');
  const containerRef = useRef<HTMLDivElement>(null);

  // Close on Escape or click outside
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };

    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        onClose();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    document.addEventListener('mousedown', handleClickOutside);

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [onClose]);

  const allEmojis = CATEGORIES.flatMap(c => c.emojis);
  const filteredEmojis = search.trim() 
    ? allEmojis.filter(e => e.includes(search))
    : CATEGORIES.find(c => c.id === activeTab)?.emojis || [];

  return (
    <div 
      ref={containerRef}
      id="emoji-picker-container"
      className={clsx(
        "bg-[#0a0a0a] border border-white/20 shadow-[0_10px_35px_rgba(0,0,0,0.85)] z-50 w-72 rounded-none font-mono flex flex-col select-none animate-in fade-in zoom-in-95 duration-150",
        className
      )}
    >
      {/* Header with Search */}
      <div className="p-2 border-b border-white/10 bg-[#111111] flex items-center gap-1.5">
        <div className="relative flex-1">
          <Search className="w-3.5 h-3.5 text-zinc-500 absolute left-2 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search emoji or emote..."
            className="w-full bg-black border border-white/10 pl-7 pr-6 py-1 text-xs text-white placeholder:text-zinc-600 outline-none focus:border-[#00FF00] transition-colors"
            autoFocus
          />
          {search && (
            <button
              onClick={() => setSearch('')}
              className="absolute right-2 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-white text-xs"
            >
              &times;
            </button>
          )}
        </div>
        <button
          onClick={onClose}
          className="p-1 text-zinc-400 hover:text-white hover:bg-white/10 transition-colors"
          title="Close emoji picker"
        >
          <X className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Categories Bar */}
      {!search && (
        <div className="flex border-b border-white/10 bg-[#0e0e0e]">
          {CATEGORIES.map((cat) => (
            <button
              key={cat.id}
              onClick={() => setActiveTab(cat.id)}
              className={clsx(
                "flex-1 py-1.5 flex items-center justify-center gap-1 text-[10px] font-bold uppercase transition-colors border-b-2",
                activeTab === cat.id
                  ? "border-[#00FF00] text-[#00FF00] bg-white/[0.03]"
                  : "border-transparent text-zinc-400 hover:text-zinc-200 hover:bg-white/[0.02]"
              )}
              title={cat.name}
            >
              {cat.icon}
              <span className="hidden sm:inline">{cat.name}</span>
            </button>
          ))}
        </div>
      )}

      {/* Emoji Grid */}
      <div className="p-2 max-h-48 overflow-y-auto grid grid-cols-6 gap-1 bg-[#0a0a0a]">
        {filteredEmojis.length === 0 ? (
          <div className="col-span-6 py-6 text-center text-zinc-500 text-xs">
            No emojis found
          </div>
        ) : (
          filteredEmojis.map((emoji, index) => (
            <button
              key={`${emoji}-${index}`}
              type="button"
              onClick={() => {
                onSelect(emoji);
              }}
              className="w-9 h-9 flex items-center justify-center text-lg hover:bg-[#00FF00]/15 hover:scale-125 transition-all rounded-xs cursor-pointer active:scale-95"
            >
              {emoji}
            </button>
          ))
        )}
      </div>

      {/* Footer hint */}
      <div className="px-2.5 py-1 bg-[#060606] border-t border-white/5 flex items-center justify-between text-[9px] text-zinc-500 uppercase">
        <span>CLICK TO INSERT</span>
        <span>ESC TO DISMISS</span>
      </div>
    </div>
  );
};
