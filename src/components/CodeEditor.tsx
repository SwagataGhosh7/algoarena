import React, { useState, useRef, useEffect } from 'react';
import Editor from '@monaco-editor/react';
import { 
  ZoomIn, 
  ZoomOut, 
  Layers, 
  Sparkles, 
  ChevronDown, 
  Check, 
  RotateCcw,
  Search,
  Code2
} from 'lucide-react';
import clsx from 'clsx';
import { 
  SUPPORTED_LANGUAGES, 
  FEATURED_LANGUAGE_IDS, 
  LanguageDropdown 
} from './LanguageDropdown';
import { 
  BoilerplateControls, 
  BoilerplateNotificationBanner 
} from './BoilerplateControls';
import { AutoSaveStatusBadge, AutoSaveState } from './AutoSaveIndicator';
import { registerMonacoThemes } from '../lib/editorThemes';
import { soundManager } from '../lib/soundEffects';
import { 
  getLanguageBoilerplate, 
  isDefaultOrBoilerplateCode, 
  BoilerplateStyle 
} from '../lib/languageBoilerplates';

export interface CodeEditorProps {
  code: string;
  onChange: (value: string) => void;
  language: string;
  onLanguageChange: (language: string) => void;
  problem?: any;
  theme?: string;
  onThemeChange?: (theme: string) => void;
  fontSize?: number;
  onFontSizeChange?: (size: number) => void;
  showMinimap?: boolean;
  onToggleMinimap?: () => void;
  codeBuffers?: Record<string, string>;
  onCodeBuffersChange?: (buffers: Record<string, string>) => void;
  autoInjectBoilerplate?: boolean;
  onToggleAutoInject?: (enabled: boolean) => void;
  boilerplateStyle?: BoilerplateStyle;
  onChangeBoilerplateStyle?: (style: BoilerplateStyle) => void;
  autoSaveStatus?: AutoSaveState;
  lastSavedTimestamp?: number | null;
  onManualAutoSave?: () => void;
  readOnly?: boolean;
  disabled?: boolean;
  height?: string | number;
  className?: string;
}

export const CodeEditor: React.FC<CodeEditorProps> = ({
  code,
  onChange,
  language,
  onLanguageChange,
  problem,
  theme = 'monokai',
  onThemeChange,
  fontSize = 13,
  onFontSizeChange,
  showMinimap = false,
  onToggleMinimap,
  codeBuffers = {},
  onCodeBuffersChange,
  autoInjectBoilerplate = true,
  onToggleAutoInject,
  boilerplateStyle = 'full',
  onChangeBoilerplateStyle,
  autoSaveStatus = 'saved',
  lastSavedTimestamp,
  onManualAutoSave,
  readOnly = false,
  disabled = false,
  height = '100%',
  className = '',
}) => {
  const [internalFontSize, setInternalFontSize] = useState(fontSize);
  const [internalMinimap, setInternalMinimap] = useState(showMinimap);
  const [internalTheme, setInternalTheme] = useState(theme);
  const [boilerplateNotice, setBoilerplateNotice] = useState<{
    language: string;
    previousCode?: string;
  } | null>(null);

  const activeLangOption = SUPPORTED_LANGUAGES.find(l => l.id === language) || SUPPORTED_LANGUAGES[0];

  const handleLangChangeInternal = (newLang: string) => {
    soundManager.playClick();
    const updatedBuffers = { ...codeBuffers, [language]: code };
    if (onCodeBuffersChange) {
      onCodeBuffersChange(updatedBuffers);
    }
    onLanguageChange(newLang);

    // Auto-inject boilerplate for the selected language
    const existingCode = updatedBuffers[newLang];
    const isUntouchedOrBoilerplate = !existingCode || isDefaultOrBoilerplateCode(existingCode, newLang);

    if (autoInjectBoilerplate && isUntouchedOrBoilerplate) {
      const freshBoilerplate = getLanguageBoilerplate(newLang, problem, boilerplateStyle);
      onChange(freshBoilerplate);
      if (onCodeBuffersChange) {
        onCodeBuffersChange({ ...updatedBuffers, [newLang]: freshBoilerplate });
      }
      setBoilerplateNotice({
        language: newLang,
        previousCode: existingCode,
      });
    } else if (existingCode !== undefined && existingCode.trim().length > 0) {
      onChange(existingCode);
      setBoilerplateNotice(null);
    } else {
      const freshBoilerplate = getLanguageBoilerplate(newLang, problem, boilerplateStyle);
      onChange(freshBoilerplate);
      if (onCodeBuffersChange) {
        onCodeBuffersChange({ ...updatedBuffers, [newLang]: freshBoilerplate });
      }
    }
  };

  const handleInjectBoilerplate = (style?: BoilerplateStyle) => {
    soundManager.playClick();
    const activeStyle = style || boilerplateStyle;
    const fresh = getLanguageBoilerplate(language, problem, activeStyle);
    const prev = code;
    onChange(fresh);
    if (onCodeBuffersChange) {
      onCodeBuffersChange({ ...codeBuffers, [language]: fresh });
    }
    setBoilerplateNotice({
      language,
      previousCode: prev,
    });
  };

  const handleUndoBoilerplate = () => {
    if (!boilerplateNotice?.previousCode) return;
    soundManager.playClick();
    const prev = boilerplateNotice.previousCode;
    onChange(prev);
    if (onCodeBuffersChange) {
      onCodeBuffersChange({ ...codeBuffers, [language]: prev });
    }
    setBoilerplateNotice(null);
  };

  const handleResetTemplate = () => {
    soundManager.playClick();
    const template = getLanguageBoilerplate(language, problem, boilerplateStyle);
    onChange(template);
    if (onCodeBuffersChange) {
      onCodeBuffersChange({ ...codeBuffers, [language]: template });
    }
    setBoilerplateNotice(null);
  };

  const monacoLanguage = 
    language === 'c' ? 'c' :
    language === 'cpp' ? 'cpp' :
    language === 'java' ? 'java' :
    language === 'python' ? 'python' :
    language === 'typescript' ? 'typescript' :
    language === 'go' ? 'go' :
    language === 'rust' ? 'rust' : 'javascript';

  return (
    <div className={`flex flex-col bg-[#050505] relative overflow-hidden border border-white/10 ${className}`}>
      {/* Code Editor Header Toolbar */}
      <div className="h-11 bg-[#121212] flex items-center justify-between px-3 sm:px-4 border-b border-white/5 shrink-0 select-none">
        <div className="flex items-center gap-2.5 text-xs font-mono">
          {/* File Name & Language Indicator Dot */}
          <span className="text-[#00FF00] font-bold flex items-center gap-1.5">
            <span 
              className="w-2 h-2 rounded-full inline-block shrink-0 shadow-xs"
              style={{ backgroundColor: activeLangOption.accentColor }}
            />
            solution{activeLangOption.extension}
          </span>
          <span className="text-zinc-600 hidden sm:inline">|</span>
          <span className="text-zinc-400 text-[11px] hidden md:inline">
            LANGUAGE: <span className="text-white uppercase font-bold">{activeLangOption.name}</span>
          </span>

          {/* Auto-Save Status Badge */}
          {onManualAutoSave && (
            <AutoSaveStatusBadge
              status={autoSaveStatus}
              lastSavedTimestamp={lastSavedTimestamp}
              onManualSave={onManualAutoSave}
              disabled={disabled}
            />
          )}
        </div>

        <div className="flex items-center gap-2 sm:gap-2.5 shrink-0">
          {/* Horizontal 1-Click Language Switcher (Left to Right) */}
          <div className="flex items-center bg-black/70 border border-white/10 rounded p-0.5 gap-0.5">
            {[
              { id: 'c', label: 'C', color: '#9ca3af' },
              { id: 'cpp', label: 'C++', color: '#00599c' },
              { id: 'java', label: 'Java', color: '#ea2d2e' },
              { id: 'python', label: 'Python', color: '#387eb8' },
              { id: 'javascript', label: 'JS', color: '#f7df1e' },
              { id: 'typescript', label: 'TS', color: '#3178c6' },
            ].map(langItem => {
              const isActive = language === langItem.id;
              return (
                <button
                  key={langItem.id}
                  type="button"
                  onClick={() => handleLangChangeInternal(langItem.id)}
                  disabled={disabled}
                  className={clsx(
                    "px-2 py-1 text-[11px] font-mono font-bold rounded transition-all flex items-center gap-1.5 cursor-pointer",
                    isActive
                      ? "bg-[#00FF00]/20 text-[#00FF00] border border-[#00FF00]/50 shadow-[0_0_8px_rgba(0,255,0,0.25)]"
                      : "text-zinc-400 hover:text-white hover:bg-white/5 border border-transparent"
                  )}
                  title={`Switch language to ${langItem.label}`}
                >
                  <span 
                    className="w-1.5 h-1.5 rounded-full shrink-0"
                    style={{ backgroundColor: langItem.color }}
                  />
                  <span>{langItem.label}</span>
                </button>
              );
            })}
          </div>

          {/* Compact More Languages Dropdown */}
          <LanguageDropdown
            currentLanguage={language}
            onLanguageChange={handleLangChangeInternal}
            onResetTemplate={handleResetTemplate}
            codeBuffers={codeBuffers}
            autoInjectBoilerplate={autoInjectBoilerplate}
            onToggleAutoInject={onToggleAutoInject}
            disabled={disabled}
            compact={true}
          />

          <div className="h-4 w-px bg-white/10 hidden sm:block" />

          {/* Boilerplate Injection Controls */}
          <BoilerplateControls
            currentLanguage={language}
            autoInjectEnabled={autoInjectBoilerplate}
            onToggleAutoInject={onToggleAutoInject || (() => {})}
            boilerplateStyle={boilerplateStyle}
            onChangeStyle={onChangeBoilerplateStyle || (() => {})}
            onInjectBoilerplate={handleInjectBoilerplate}
            disabled={disabled}
          />

          {/* Font Zoom Controls */}
          <div className="hidden xl:flex items-center bg-black/60 border border-white/10 px-1 py-0.5 text-[10px] text-zinc-400">
            <button
              type="button"
              onClick={() => {
                const next = Math.max(10, (onFontSizeChange ? fontSize : internalFontSize) - 1);
                if (onFontSizeChange) onFontSizeChange(next);
                else setInternalFontSize(next);
              }}
              className="px-1 hover:text-white transition-colors"
              title="Decrease Font Size"
            >
              <ZoomOut className="w-3 h-3" />
            </button>
            <span className="px-1 font-bold text-zinc-300">
              {onFontSizeChange ? fontSize : internalFontSize}px
            </span>
            <button
              type="button"
              onClick={() => {
                const next = Math.min(22, (onFontSizeChange ? fontSize : internalFontSize) + 1);
                if (onFontSizeChange) onFontSizeChange(next);
                else setInternalFontSize(next);
              }}
              className="px-1 hover:text-white transition-colors"
              title="Increase Font Size"
            >
              <ZoomIn className="w-3 h-3" />
            </button>
          </div>

          {/* Minimap Toggle */}
          <button
            type="button"
            onClick={() => {
              if (onToggleMinimap) onToggleMinimap();
              else setInternalMinimap(prev => !prev);
            }}
            className={clsx(
              "hidden xl:flex items-center gap-1 px-2 py-1 border text-[10px] font-bold uppercase transition-colors cursor-pointer",
              (onToggleMinimap ? showMinimap : internalMinimap)
                ? "bg-[#00FF00]/15 text-[#00FF00] border-[#00FF00]/40" 
                : "bg-black/60 text-zinc-400 border-white/10 hover:text-white"
            )}
            title="Toggle Minimap"
          >
            <Layers className="w-3 h-3" />
            <span>MAP</span>
          </button>
        </div>
      </div>

      {/* Boilerplate Notification Banner with Undo */}
      {boilerplateNotice && (
        <BoilerplateNotificationBanner
          language={boilerplateNotice.language}
          onUndo={boilerplateNotice.previousCode ? handleUndoBoilerplate : undefined}
          onDismiss={() => setBoilerplateNotice(null)}
        />
      )}

      {/* Monaco Code Editor Canvas */}
      <div className="flex-1 relative bg-black/40" style={{ minHeight: typeof height === 'number' ? `${height}px` : height }}>
        <Editor
          height="100%"
          language={monacoLanguage}
          theme={onThemeChange ? theme : internalTheme}
          beforeMount={registerMonacoThemes}
          value={code}
          onChange={val => onChange(val || '')}
          options={{
            readOnly,
            fontSize: onFontSizeChange ? fontSize : internalFontSize,
            fontFamily: "'JetBrains Mono', 'Fira Code', 'Cascadia Code', monospace",
            fontLigatures: true,
            tabSize: 2,
            minimap: { enabled: onToggleMinimap ? showMinimap : internalMinimap },
            scrollBeyondLastLine: false,
            automaticLayout: true,
            padding: { top: 12, bottom: 12 },
            lineNumbers: 'on',
            renderLineHighlight: 'all',
            cursorBlinking: 'smooth',
            cursorSmoothCaretAnimation: 'on',
            smoothScrolling: true,
            wordWrap: 'on',
            bracketPairColorization: { enabled: true },
            guides: {
              bracketPairs: true,
              indentation: true,
            },
          }}
        />
      </div>
    </div>
  );
};
