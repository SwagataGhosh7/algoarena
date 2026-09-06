import React, { useState, useRef, useEffect, useId } from 'react';
import { 
  ChevronDown, 
  Check, 
  RotateCcw, 
  Sparkles,
  Search,
  Code2,
  Cpu,
  FileCode,
  Terminal,
  Zap
} from 'lucide-react';
import { soundManager } from '../lib/soundEffects';

export interface LanguageOption {
  id: string;
  name: string;
  shortName: string;
  version: string;
  compiler: string;
  extension: string;
  monacoLang: string;
  accentColor: string;
  badgeBg: string;
  badgeText: string;
  badgeBorder: string;
  description: string;
  popular?: boolean;
}

export const SUPPORTED_LANGUAGES: LanguageOption[] = [
  {
    id: 'python',
    name: 'Python',
    shortName: 'Python',
    version: '3.11',
    compiler: 'CPython 3.11',
    extension: '.py',
    monacoLang: 'python',
    accentColor: '#387eb8',
    badgeBg: 'bg-[#387eb8]/15',
    badgeText: 'text-[#60a5fa]',
    badgeBorder: 'border-[#387eb8]/40',
    description: 'Concise syntax with rich standard library. Ideal for rapid DSA logic.',
    popular: true,
  },
  {
    id: 'javascript',
    name: 'JavaScript',
    shortName: 'JS',
    version: 'Node 18 (ES6+)',
    compiler: 'V8 Engine',
    extension: '.js',
    monacoLang: 'javascript',
    accentColor: '#f7df1e',
    badgeBg: 'bg-[#f7df1e]/15',
    badgeText: 'text-[#fde047]',
    badgeBorder: 'border-[#f7df1e]/40',
    description: 'High-speed event-driven execution with modern ES2022 features.',
    popular: true,
  },
  {
    id: 'cpp',
    name: 'C++',
    shortName: 'C++',
    version: 'C++20',
    compiler: 'GCC 13 (O2)',
    extension: '.cpp',
    monacoLang: 'cpp',
    accentColor: '#00599c',
    badgeBg: 'bg-[#00599c]/20',
    badgeText: 'text-[#38bdf8]',
    badgeBorder: 'border-[#00599c]/50',
    description: 'Maximum performance with STL containers and low-overhead memory.',
    popular: true,
  },
  {
    id: 'java',
    name: 'Java',
    shortName: 'Java',
    version: '21 LTS',
    compiler: 'OpenJDK 21',
    extension: '.java',
    monacoLang: 'java',
    accentColor: '#ea2d2e',
    badgeBg: 'bg-[#ea2d2e]/15',
    badgeText: 'text-[#fb7185]',
    badgeBorder: 'border-[#ea2d2e]/40',
    description: 'Strongly-typed object-oriented runtime with java.util collection suite.',
    popular: true,
  },
  {
    id: 'typescript',
    name: 'TypeScript',
    shortName: 'TS',
    version: '5.4',
    compiler: 'tsc + Node runtime',
    extension: '.ts',
    monacoLang: 'typescript',
    accentColor: '#3178c6',
    badgeBg: 'bg-[#3178c6]/15',
    badgeText: 'text-[#93c5fd]',
    badgeBorder: 'border-[#3178c6]/40',
    description: 'JavaScript with static type safety, interfaces, and generic checks.',
    popular: false,
  },
  {
    id: 'c',
    name: 'C',
    shortName: 'C',
    version: 'C17',
    compiler: 'GCC 13',
    extension: '.c',
    monacoLang: 'c',
    accentColor: '#9ca3af',
    badgeBg: 'bg-zinc-700/20',
    badgeText: 'text-zinc-300',
    badgeBorder: 'border-zinc-600/40',
    description: 'Classic bare-metal speed with manual pointer and memory management.',
    popular: false,
  },
  {
    id: 'go',
    name: 'Go',
    shortName: 'Go',
    version: '1.22',
    compiler: 'gc compiler',
    extension: '.go',
    monacoLang: 'go',
    accentColor: '#00add8',
    badgeBg: 'bg-[#00add8]/15',
    badgeText: 'text-[#67e8f9]',
    badgeBorder: 'border-[#00add8]/40',
    description: 'Fast compilation, clean formatting, and lightweight memory model.',
    popular: false,
  },
  {
    id: 'rust',
    name: 'Rust',
    shortName: 'Rust',
    version: '2021',
    compiler: 'rustc (2021 edition)',
    extension: '.rs',
    monacoLang: 'rust',
    accentColor: '#dea584',
    badgeBg: 'bg-[#dea584]/15',
    badgeText: 'text-[#fdba74]',
    badgeBorder: 'border-[#dea584]/40',
    description: 'Zero-cost abstractions with compile-time borrow checker safety.',
    popular: false,
  },
];

// Top featured languages highlighted in quick switcher
export const FEATURED_LANGUAGE_IDS = ['python', 'javascript', 'cpp', 'java'];

export interface LanguageDropdownProps {
  currentLanguage: string;
  onLanguageChange: (newLanguage: string) => void;
  onResetTemplate?: () => void;
  codeBuffers?: Record<string, string>;
  disabled?: boolean;
  compact?: boolean;
}

export const LanguageDropdown: React.FC<LanguageDropdownProps> = ({
  currentLanguage,
  onLanguageChange,
  onResetTemplate,
  codeBuffers,
  disabled = false,
  compact = false,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [focusedIndex, setFocusedIndex] = useState<number>(-1);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);
  const menuId = useId();

  const activeLang = SUPPORTED_LANGUAGES.find(l => l.id === currentLanguage) || SUPPORTED_LANGUAGES[0];

  const filteredLanguages = SUPPORTED_LANGUAGES.filter(lang => {
    const q = searchQuery.toLowerCase().trim();
    if (!q) return true;
    return (
      lang.name.toLowerCase().includes(q) ||
      lang.shortName.toLowerCase().includes(q) ||
      lang.extension.toLowerCase().includes(q) ||
      lang.version.toLowerCase().includes(q) ||
      lang.compiler.toLowerCase().includes(q)
    );
  });

  // Close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
        setSearchQuery('');
      }
    };
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen]);

  // Focus search input when dropdown opens
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => {
        searchInputRef.current?.focus();
      }, 50);
    } else {
      setFocusedIndex(-1);
    }
  }, [isOpen]);

  // Keyboard navigation
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!isOpen) {
      if (e.key === 'ArrowDown' || e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        setIsOpen(true);
        soundManager.playClick();
      }
      return;
    }

    if (e.key === 'Escape') {
      e.preventDefault();
      setIsOpen(false);
      setSearchQuery('');
      return;
    }

    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setFocusedIndex(prev => (prev < filteredLanguages.length - 1 ? prev + 1 : 0));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setFocusedIndex(prev => (prev > 0 ? prev - 1 : filteredLanguages.length - 1));
    } else if (e.key === 'Enter' && focusedIndex >= 0 && focusedIndex < filteredLanguages.length) {
      e.preventDefault();
      selectLanguage(filteredLanguages[focusedIndex].id);
    }
  };

  const selectLanguage = (langId: string) => {
    soundManager.playClick();
    onLanguageChange(langId);
    setIsOpen(false);
    setSearchQuery('');
  };

  const handleToggleOpen = () => {
    if (disabled) return;
    soundManager.playClick();
    setIsOpen(prev => !prev);
  };

  // Helper to see buffer status for a language
  const getBufferStatus = (langId: string) => {
    if (!codeBuffers || !codeBuffers[langId]) return null;
    const lines = codeBuffers[langId].trim().split('\n').length;
    return `${lines} lines`;
  };

  return (
    <div className="relative inline-flex items-center" ref={dropdownRef} onKeyDown={handleKeyDown}>
      {/* Dropdown Trigger Button */}
      <button
        id="language-dropdown-trigger"
        type="button"
        disabled={disabled}
        onClick={handleToggleOpen}
        aria-haspopup="listbox"
        aria-expanded={isOpen}
        aria-controls={menuId}
        className={`group flex items-center gap-2 px-2.5 py-1.5 rounded bg-[#121212] hover:bg-[#1a1a1a] border transition-all text-xs font-mono select-none ${
          isOpen
            ? 'border-[#00FF00] shadow-[0_0_12px_rgba(0,255,0,0.25)] text-white'
            : 'border-white/15 hover:border-white/30 text-zinc-200'
        } disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer`}
        title={`Switch Solution Programming Language (Active: ${activeLang.name} ${activeLang.version})`}
      >
        {/* Language Glowing Swatch Dot */}
        <span className="relative flex items-center justify-center shrink-0">
          <span 
            className="w-2.5 h-2.5 rounded-full"
            style={{ 
              backgroundColor: activeLang.accentColor,
              boxShadow: `0 0 6px ${activeLang.accentColor}88` 
            }}
          />
        </span>

        {/* Label and Active Language Name */}
        <div className="flex items-center gap-1.5">
          <span className="text-[10px] text-zinc-400 uppercase tracking-widest hidden sm:inline">
            LANG:
          </span>
          <span className="font-bold text-[#00FF00] tracking-wide">
            {activeLang.name}
          </span>
          <span className="text-[10px] text-zinc-400 font-mono px-1 py-0.5 rounded bg-white/5 border border-white/10 hidden md:inline">
            {activeLang.extension}
          </span>
        </div>

        {/* Dropdown Chevron */}
        <ChevronDown 
          className={`w-3.5 h-3.5 text-zinc-400 group-hover:text-white transition-transform duration-200 shrink-0 ${
            isOpen ? 'rotate-180 text-[#00FF00]' : ''
          }`} 
        />
      </button>

      {/* Popover Dropdown Menu */}
      {isOpen && (
        <div
          id={menuId}
          role="listbox"
          aria-label="Supported Programming Languages"
          className="absolute right-0 top-full mt-2 w-80 sm:w-88 bg-[#101010] border border-[#00FF00]/40 rounded-lg shadow-[0_10px_35px_rgba(0,0,0,0.85)] z-50 overflow-hidden animate-in fade-in zoom-in-95 duration-150 backdrop-blur-md"
        >
          {/* Menu Header */}
          <div className="p-3 bg-[#161616] border-b border-white/10 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Code2 className="w-4 h-4 text-[#00FF00]" />
              <span className="text-xs font-mono font-bold tracking-wider text-white uppercase">
                Solution Language
              </span>
            </div>
            <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-[#00FF00]/10 text-[#00FF00] border border-[#00FF00]/30 font-bold">
              8 RUNTIMES
            </span>
          </div>

          {/* Quick-Access Top 4 Languages Row (Python, JS, C++, Java) */}
          <div className="px-3 pt-2.5 pb-2 bg-black/40 border-b border-white/5">
            <div className="text-[10px] font-mono uppercase tracking-widest text-zinc-400 mb-1.5 flex items-center justify-between">
              <span>QUICK SWITCH:</span>
              <span className="text-zinc-400">1-CLICK</span>
            </div>
            <div className="grid grid-cols-4 gap-1.5">
              {SUPPORTED_LANGUAGES.filter(l => FEATURED_LANGUAGE_IDS.includes(l.id)).map(l => {
                const isActive = l.id === currentLanguage;
                return (
                  <button
                    key={l.id}
                    type="button"
                    onClick={() => selectLanguage(l.id)}
                    className={`px-2 py-1 text-center font-mono text-xs font-bold rounded transition-all flex items-center justify-center gap-1.5 border ${
                      isActive
                        ? 'bg-[#00FF00]/20 text-[#00FF00] border-[#00FF00]/50 shadow-[0_0_8px_rgba(0,255,0,0.2)]'
                        : 'bg-white/5 text-zinc-300 hover:text-white hover:bg-white/10 border-white/10'
                    }`}
                    title={`Switch immediately to ${l.name} (${l.version})`}
                  >
                    <span 
                      className="w-2 h-2 rounded-full shrink-0" 
                      style={{ backgroundColor: l.accentColor }} 
                    />
                    <span>{l.shortName}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Search Filter Input */}
          <div className="p-2 border-b border-white/10 bg-black/30">
            <div className="relative flex items-center">
              <Search className="w-3.5 h-3.5 text-zinc-400 absolute left-2.5 pointer-events-none" />
              <input
                ref={searchInputRef}
                type="text"
                value={searchQuery}
                onChange={e => {
                  setSearchQuery(e.target.value);
                  setFocusedIndex(0);
                }}
                placeholder="Filter languages (e.g. Python, C++, Go)..."
                className="w-full bg-[#181818] text-xs font-mono text-white pl-8 pr-3 py-1.5 rounded border border-white/10 focus:border-[#00FF00] focus:outline-none placeholder-zinc-400"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery('')}
                  className="absolute right-2 text-[10px] font-mono text-zinc-400 hover:text-white"
                >
                  CLEAR
                </button>
              )}
            </div>
          </div>

          {/* Languages List */}
          <div 
            ref={listRef}
            className="max-h-64 overflow-y-auto divide-y divide-white/5 custom-scrollbar p-1.5"
          >
            {filteredLanguages.length === 0 ? (
              <div className="py-6 text-center text-xs font-mono text-zinc-400">
                No languages match &ldquo;{searchQuery}&rdquo;
              </div>
            ) : (
              filteredLanguages.map((lang, index) => {
                const isSelected = currentLanguage === lang.id;
                const isFocused = focusedIndex === index;
                const bufferInfo = getBufferStatus(lang.id);

                return (
                  <button
                    key={lang.id}
                    role="option"
                    aria-selected={isSelected}
                    type="button"
                    onClick={() => selectLanguage(lang.id)}
                    onMouseEnter={() => setFocusedIndex(index)}
                    className={`w-full px-2.5 py-2 rounded text-left font-mono transition-all flex items-center justify-between group ${
                      isSelected
                        ? 'bg-[#00FF00]/10 border border-[#00FF00]/30 text-white'
                        : isFocused
                        ? 'bg-white/10 text-white'
                        : 'hover:bg-white/5 text-zinc-300'
                    }`}
                  >
                    <div className="flex items-start gap-2.5 min-w-0 pr-2">
                      {/* Language Accent Dot */}
                      <span 
                        className="w-2.5 h-2.5 rounded-full shrink-0 mt-1"
                        style={{ 
                          backgroundColor: lang.accentColor,
                          boxShadow: isSelected ? `0 0 8px ${lang.accentColor}` : undefined 
                        }}
                      />

                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <span className={`text-xs font-bold ${isSelected ? 'text-[#00FF00]' : 'text-white'}`}>
                            {lang.name}
                          </span>
                          <span className="text-[10px] text-zinc-400">
                            {lang.version}
                          </span>
                          {lang.popular && (
                            <span className="text-[9px] px-1 py-0.2 rounded bg-white/5 text-zinc-400 border border-white/10 uppercase">
                              POPULAR
                            </span>
                          )}
                        </div>

                        <div className="text-[11px] text-zinc-400 truncate mt-0.5">
                          {lang.compiler}
                        </div>

                        {bufferInfo && (
                          <div className="text-[10px] text-emerald-400/90 font-mono mt-0.5 flex items-center gap-1">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 inline-block animate-pulse" />
                            <span>Buffer ready ({bufferInfo})</span>
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      {/* File extension badge */}
                      <span className={`text-[10px] font-mono px-1.5 py-0.5 rounded border ${lang.badgeBg} ${lang.badgeText} ${lang.badgeBorder}`}>
                        {lang.extension}
                      </span>

                      {/* Active Indicator */}
                      {isSelected ? (
                        <div className="w-5 h-5 rounded-full bg-[#00FF00]/20 border border-[#00FF00] flex items-center justify-center">
                          <Check className="w-3 h-3 text-[#00FF00]" />
                        </div>
                      ) : (
                        <div className="w-5 h-5" />
                      )}
                    </div>
                  </button>
                );
              })
            )}
          </div>

          {/* Footer Bar: Template Reset & Buffer Info */}
          <div className="p-2.5 bg-[#141414] border-t border-white/10 flex items-center justify-between gap-2">
            {onResetTemplate && (
              <button
                type="button"
                onClick={() => {
                  soundManager.playClick();
                  onResetTemplate();
                  setIsOpen(false);
                }}
                className="flex items-center gap-1.5 px-2.5 py-1 rounded text-[11px] font-mono text-zinc-400 hover:text-white hover:bg-white/10 border border-white/10 transition-colors"
                title="Restore default starter template code for the active language"
              >
                <RotateCcw className="w-3 h-3 text-amber-400" />
                <span>Reset {activeLang.name} Template</span>
              </button>
            )}

            <span className="text-[10px] font-mono text-zinc-400 ml-auto hidden sm:inline">
              Buffers auto-cached • ESC to close
            </span>
          </div>
        </div>
      )}
    </div>
  );
};
