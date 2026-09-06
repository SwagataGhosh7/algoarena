import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import { socket } from '../socket';
import { useStore } from '../store';
import { RoomState, ChatMessage, EvaluationResult, RunCodeResponse, RunTestCaseResult } from '../types';
import Editor from '@monaco-editor/react';
import { 
  Play, CheckSquare, MessageSquare, ShieldAlert, ArrowLeft, Loader2, 
  Sparkles, X, Check, Trophy, Activity, Terminal, Bot, Lightbulb, 
  Code2, Flag, Zap, ChevronUp, ChevronDown, Copy, CheckCheck, Plus, 
  Clock, Cpu, AlertCircle, RefreshCw, WifiOff, GitCompare, FileCode2, Stethoscope
} from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import clsx from 'clsx';
import { motion, AnimatePresence } from 'motion/react';
import { FriendActions } from '../components/FriendActions';
import { CodeReview } from '../components/CodeReview';
import { ConnectionStatus, useConnectionStatus } from '../components/ConnectionStatus';
import { EditorThemeSelector } from '../components/EditorThemeSelector';
import { getStoredTheme, saveStoredTheme, registerMonacoThemes } from '../lib/editorThemes';
import { SoundToggle } from '../components/SoundToggle';
import { soundManager } from '../lib/soundEffects';
import { SolutionDiffViewer } from '../components/SolutionDiffViewer';
import { ExpectedSolutionsViewer } from '../components/ExpectedSolutionsViewer';
import { LineByLineAnalyzer } from '../components/LineByLineAnalyzer';
import { apiUrl } from '../api';

const STARTER_TEMPLATES: Record<string, string> = {
  javascript: `// AlgoArena JavaScript Solution
function solution(input) {
  // Write your algorithmic logic here
  return input;
}
`,
  python: `# AlgoArena Python 3.11 Solution
def solution(input_data):
    # Write your algorithmic logic here
    return input_data
`,
  cpp: `// AlgoArena C++ 20 Solution
#include <iostream>
#include <vector>
#include <string>
#include <algorithm>

using namespace std;

class Solution {
public:
    int solution(int input) {
        // Write your algorithmic logic here
        return input;
    }
};
`,
  typescript: `// AlgoArena TypeScript Solution
function solution(input: any): any {
  // Write your algorithmic logic here
  return input;
}
`,
  c: `// AlgoArena C (C17 / GCC) Solution
#include <stdio.h>
#include <stdlib.h>
#include <string.h>

int solution(int input) {
    // Write your algorithmic logic here
    return input;
}
`,
  java: `// AlgoArena Java (OpenJDK 21) Solution
import java.util.*;

public class Solution {
    public static int solution(int input) {
        // Write your algorithmic logic here
        return input;
    }
}
`,
};

export function Arena() {
  const { id: roomId } = useParams();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { currentUser } = useStore();

  const queryMode = searchParams.get('mode');
  const queryTopic = searchParams.get('topic');
  const queryDiff = searchParams.get('diff') as 'easy' | 'medium' | 'hard' | null;
  const queryLang = searchParams.get('lang');

  const isPracticeMode = queryMode === 'practice' || roomId?.startsWith('practice-');
  
  const [room, setRoom] = useState<RoomState | null>(null);
  const [chat, setChat] = useState<ChatMessage[]>([]);
  const [chatInput, setChatInput] = useState('');
  
  const [language, setLanguage] = useState(queryLang && STARTER_TEMPLATES[queryLang] ? queryLang : 'javascript');
  const [code, setCode] = useState(STARTER_TEMPLATES[queryLang && STARTER_TEMPLATES[queryLang] ? queryLang : 'javascript']);
  const [isEvaluating, setIsEvaluating] = useState(false);
  const [evalResult, setEvalResult] = useState<EvaluationResult | null>(null);
  const [isRunningCode, setIsRunningCode] = useState(false);
  const [runResults, setRunResults] = useState<RunCodeResponse | null>(null);
  const [activeConsoleTab, setActiveConsoleTab] = useState<'cases' | 'terminal' | 'submission'>('cases');
  const [selectedCaseIdx, setSelectedCaseIdx] = useState<number>(0);
  const [customInput, setCustomInput] = useState('');
  const [customExpected, setCustomExpected] = useState('');
  const [isConsoleExpanded, setIsConsoleExpanded] = useState(true);
  const [copiedConsole, setCopiedConsole] = useState(false);
  const [myProgress, setMyProgress] = useState(0);
  const [timerSeconds, setTimerSeconds] = useState(600); // 10:00 timer
  const [selectedDifficulty, setSelectedDifficulty] = useState<'easy' | 'medium' | 'hard'>(queryDiff || 'medium');
  const [selectedTopic, setSelectedTopic] = useState(queryTopic || 'Dynamic Programming');
  const [hintLoading, setHintLoading] = useState(false);
  const [recentHint, setRecentHint] = useState<string | null>(null);
  const [matchEndReason, setMatchEndReason] = useState<string | null>(null);
  const [postMatchReview, setPostMatchReview] = useState<EvaluationResult['review'] | null>(null);
  const [matchOverCodes, setMatchOverCodes] = useState<Record<string, { code: string; language: string; name: string }>>({});
  const [postMatchTab, setPostMatchTab] = useState<'summary' | 'diff' | 'expected' | 'doctor'>('summary');
  const [diffExpectedOverride, setDiffExpectedOverride] = useState<string | null>(null);
  const [isForfeiting, setIsForfeiting] = useState(false);
  const [inviteCopied, setInviteCopied] = useState(false);
  const [editorTheme, setEditorTheme] = useState<string>(getStoredTheme);

  const handleThemeChange = (newTheme: string) => {
    setEditorTheme(newTheme);
    saveStoredTheme(newTheme);
  };
  
  const { status: connectionStatus, reconnect: reconnectSocket } = useConnectionStatus();
  const chatEndRef = useRef<HTMLDivElement>(null);
  const autoSummonedRef = useRef(false);
  const prevRoomStatusRef = useRef<string | null>(null);

  useEffect(() => {
    socket.connect();
    
    socket.emit('join_room', { 
      roomId, 
      user: currentUser,
      mode: isPracticeMode ? 'practice' : 'duel',
      topic: selectedTopic,
      difficulty: selectedDifficulty,
    });

    socket.on('room_state_update', (state: RoomState) => {
      if (prevRoomStatusRef.current === 'waiting' && state.status === 'active') {
        soundManager.playMatchStart();
      }
      prevRoomStatusRef.current = state.status;
      setRoom(state);
      if (state.difficulty && (state.difficulty === 'easy' || state.difficulty === 'medium' || state.difficulty === 'hard')) {
        setSelectedDifficulty(state.difficulty);
      }
      if (state.topic) {
        setSelectedTopic(state.topic);
      }
    });

    socket.on('chat_message', (msg: ChatMessage) => {
      setChat(prev => [...prev, msg]);
      if (msg.isHint) {
        setRecentHint(msg.text.replace(/^💡\s*DSA HINT:\s*/, ''));
        setHintLoading(false);
      }
    });

    socket.on('match_started', () => {
      soundManager.playMatchStart();
      setChat(prev => [...prev, { system: true, text: 'MATCH COMMENCED // TIMER ENGAGED' }]);
      setEvalResult(null);
      setMyProgress(0);
      setRecentHint(null);
    });

    socket.on('opponent_progress', ({ progress }) => {
      // room state handles updates
    });
    
     socket.on('match_over', ({ winner, reason, reviewByUserId, codeByUserId }) => {
       if (winner && winner.id === socket.id) {
         soundManager.playMatchWon();
       }
       setMatchEndReason(reason || null);
       setPostMatchReview(reviewByUserId?.[socket.id!] || null);
       if (codeByUserId) {
         setMatchOverCodes(codeByUserId);
       }
       setChat(prev => [...prev, { system: true, text: `MATCH TERMINATED // ${winner.name} WINS` }]);
    });

    return () => {
      socket.emit('leave_room', { roomId });
      socket.off('room_state_update');
      socket.off('chat_message');
      socket.off('match_started');
      socket.off('opponent_progress');
      socket.off('match_over');
    };
  }, [roomId, currentUser, isPracticeMode, selectedTopic]);

  // Keep the latest editor contents available if the opponent finishes or the connection drops first.
  useEffect(() => {
    if (!roomId || !code) return;
    const snapshotTimer = setTimeout(() => {
      socket.emit('match_code_snapshot', { roomId, code, language, review: evalResult?.review });
    }, 350);
    return () => clearTimeout(snapshotTimer);
  }, [roomId, code, language, evalResult?.review]);

  // Auto-summon AlgoArena Bot if launched from Practice mode
  useEffect(() => {
    if (isPracticeMode && !autoSummonedRef.current && room && room.status === 'waiting') {
      const opponents = Object.values(room.users).filter(u => u.id !== socket.id);
      if (opponents.length === 0) {
        autoSummonedRef.current = true;
        socket.emit('add_bot', {
          roomId,
          difficulty: selectedDifficulty,
          botName: 'AlgoArena Bot',
          isPractice: true,
          topic: selectedTopic,
        });
      }
    }
  }, [isPracticeMode, room, roomId, selectedDifficulty, selectedTopic]);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chat]);

  // Countdown timer when active
  useEffect(() => {
    if (room?.status !== 'active') return;
    const interval = setInterval(() => {
      setTimerSeconds(prev => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => clearInterval(interval);
  }, [room?.status]);

  const formatTimer = (secs: number) => {
    const m = Math.floor(secs / 60).toString().padStart(2, '0');
    const s = (secs % 60).toString().padStart(2, '0');
    return `${m}:${s}`;
  };

  const toggleReady = () => {
    socket.emit('toggle_ready', { roomId, difficulty: selectedDifficulty });
  };

  const summonAiBot = () => {
    socket.emit('add_bot', { roomId, difficulty: selectedDifficulty });
  };

  const summonAlgoArenaBot = () => {
    socket.emit('add_bot', { 
      roomId, 
      difficulty: selectedDifficulty,
      botName: 'AlgoArena Bot',
      isPractice: true,
      topic: selectedTopic,
    });
  };

  const requestBotHint = () => {
    if (hintLoading || !room?.problem) return;
    setHintLoading(true);
    socket.emit('request_bot_hint', { roomId });
    setTimeout(() => setHintLoading(false), 4000);
  };

  const forfeitMatch = () => {
    if (room?.status !== 'active' || isForfeiting) return;
    if (window.confirm('Forfeit this match? Your opponent will be awarded the victory.')) {
      setIsForfeiting(true);
      const opponentId = Object.values(room.users).find(user => user.id !== socket.id)?.id;
      setRoom(current => current ? { ...current, status: 'finished', winner: opponentId } : current);
      socket.emit('forfeit_match', { roomId });
    }
  };

  const copyInviteLink = async () => {
    const inviteLink = `${window.location.origin}/room/${roomId}`;
    try {
      await navigator.clipboard.writeText(inviteLink);
      setInviteCopied(true);
      setTimeout(() => setInviteCopied(false), 1800);
    } catch {
      window.prompt('Copy this private match link:', inviteLink);
    }
  };

  const leaveRoom = () => {
    if (room?.status === 'active') return;
    socket.emit('leave_room', { roomId });
    navigate('/');
  };

  const handleLanguageChange = (newLang: string) => {
    setLanguage(newLang);
    const isCurrentTemplate = Object.values(STARTER_TEMPLATES).some(t => t.trim() === code.trim()) || !code.trim();
    if (isCurrentTemplate && STARTER_TEMPLATES[newLang]) {
      setCode(STARTER_TEMPLATES[newLang]);
    }
  };

  const sendChat = (e: React.FormEvent) => {
    e.preventDefault();
    if (!chatInput.trim()) return;
    socket.emit('send_chat', { roomId, text: chatInput });
    setChatInput('');
  };

  const runCode = async () => {
    if (!room?.problem || isRunningCode || isEvaluating) return;
    setIsRunningCode(true);
    setIsConsoleExpanded(true);
    setActiveConsoleTab('cases');

    const sampleCases: Array<{ id: number | string; input: string; expected: string }> = (room.problem.examples || []).map((ex, idx) => ({
      id: idx + 1,
      input: ex.input,
      expected: ex.output,
    }));

    if (customInput.trim()) {
      sampleCases.push({
        id: 'custom',
        input: customInput.trim(),
        expected: customExpected.trim(),
      });
    }

    try {
      const res = await fetch(apiUrl('/api/run-code'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          code,
          language,
          testCases: sampleCases,
        }),
      });

      const data: RunCodeResponse = await res.json();
      setRunResults(data);
      if (data.allPassed) {
        soundManager.playTestPassed();
      } else {
        soundManager.playTestFailed();
      }
    } catch (error) {
      console.error('Run code failed:', error);
      soundManager.playTestFailed();
      setRunResults({
        success: false,
        allPassed: false,
        passedCount: 0,
        totalCount: sampleCases.length,
        executionEngine: 'AlgoArena Execution Error',
        results: sampleCases.map(tc => ({
          id: tc.id,
          input: tc.input,
          expected: tc.expected,
          actual: 'Execution Error',
          passed: false,
          stdout: '',
          stderr: 'Could not connect to external code execution sandbox.',
          status: 'Runtime Error',
        })),
        error: 'Execution failed',
      });
    } finally {
      setIsRunningCode(false);
    }
  };

  const submitCode = async () => {
    if (!room?.problem || isEvaluating || isRunningCode) return;
    setIsEvaluating(true);
    setEvalResult(null);
    setIsConsoleExpanded(true);
    setActiveConsoleTab('submission');
    
    try {
      const res = await fetch(apiUrl('/api/evaluate'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          code,
          language,
          problem: room.problem
        })
      });
      
      const result: EvaluationResult = await res.json();
      setEvalResult(result);
      if (result.allPassed) {
        soundManager.playMatchWon();
      } else {
        soundManager.playTestFailed();
      }

      socket.emit('match_code_snapshot', {
        roomId,
        code,
        language,
      });
      
      const passedCount = result.testResults?.filter(t => t.passed).length || 0;
      const totalCount = result.testResults?.length || 1;
      const progress = Math.round((passedCount / totalCount) * 100);
      setMyProgress(progress);
      
      socket.emit('progress_update', { roomId, progress });
      
      if (result.allPassed) {
        const elapsedSecs = Math.max(15, 600 - timerSeconds);
        const durationMins = Math.floor(elapsedSecs / 60);
        const durationRemSecs = elapsedSecs % 60;
        const formattedDuration = `${durationMins}m ${durationRemSecs.toString().padStart(2, '0')}s`;

        socket.emit('match_won', { 
          roomId,
          problemTitle: room.problem.title,
          difficulty: room.problem.difficulty,
          language,
          duration: formattedDuration,
          passedCount,
          totalTests: totalCount,
          code,
          review: result.review,
        });
      }
      
    } catch (error) {
      console.error('Evaluation failed', error);
      soundManager.playTestFailed();
      setEvalResult({
        allPassed: false,
        feedback: 'Evaluation service error.',
        testResults: []
      });
    } finally {
      setIsEvaluating(false);
    }
  };

  // Keyboard shortcut listener: Ctrl+Enter (Run Code) and Ctrl+Shift+Enter (Submit Solution)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement | null;
      const isChatInput = target?.tagName === 'INPUT' && (target as HTMLInputElement).placeholder?.toLowerCase().includes('chat');
      if (isChatInput) return;

      if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
        e.preventDefault();
        if (e.shiftKey) {
          submitCode();
        } else {
          runCode();
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [code, language, room?.problem, isRunningCode, isEvaluating, customInput, customExpected, timerSeconds]);

  if (!room) {
    return (
      <div className="min-h-screen bg-[#050505] flex flex-col items-center justify-center text-[#00FF00] font-mono gap-3">
        <ConnectionStatus />
        <Loader2 className="w-8 h-8 animate-spin my-2 text-[#00FF00]" />
        <span className="text-xs uppercase tracking-widest font-black">CONNECTING TO ARENA NODE...</span>
      </div>
    );
  }

  const me = room.users[socket.id!];
  const opponents = Object.values(room.users).filter(u => u.id !== socket.id);
  const opponent = opponents[0];

  return (
    <div className="h-screen bg-[#050505] text-[#e0e0e0] flex flex-col font-sans overflow-hidden">
      {/* Top Navbar */}
      <nav className="h-14 border-b border-[#00FF00]/30 flex items-center justify-between px-6 bg-[#0a0a0a] shrink-0 z-10">
        <div className="flex items-center gap-4">
          <button 
            onClick={leaveRoom} 
            className="flex items-center gap-1.5 text-zinc-400 hover:text-[#00FF00] transition-colors px-2 py-1 border border-white/10 hover:border-[#00FF00]/50 font-mono text-[10px] font-bold uppercase"
            title={room.status === 'active' ? 'Forfeit the active match first' : 'Leave room'}
          >
            <ArrowLeft className="w-4 h-4" /> LEAVE ROOM
          </button>
          <div className="flex items-center gap-3">
            <span className="text-[#00FF00] font-black text-lg sm:text-xl tracking-tighter uppercase">
              ALGOARENA // MATCH
            </span>
            <span className="bg-[#00FF00]/10 text-[#00FF00] text-[10px] px-2 py-0.5 border border-[#00FF00]/30 font-mono uppercase font-bold hidden md:inline-block">
              Room: #{roomId}
            </span>
            <ConnectionStatus />
          </div>
        </div>
        
        <div className="flex items-center gap-4 sm:gap-6">
          {/* Audio Feedback Toggle */}
          <SoundToggle />

          {/* Match Timer */}
          <div className="flex items-center gap-2">
            <span className="hidden sm:inline text-[10px] text-zinc-500 font-bold uppercase tracking-widest">
              Time Remaining
            </span>
            <span className="font-mono text-[#F27D26] text-lg sm:text-xl font-bold tracking-wider">
              {formatTimer(timerSeconds)}
            </span>
          </div>

          {/* Opponent Profile status */}
          <div className="flex items-center gap-3">
            <div className="text-right">
              <p className="text-[10px] font-bold uppercase text-zinc-500 flex items-center justify-end gap-1">
                {opponent?.name === 'AlgoArena Bot' ? (
                  <>
                    <Bot className="w-3 h-3 text-[#00FF00]" />
                    <span>ALGOARENA BOT // DSA PRACTICE</span>
                  </>
                ) : opponent?.isAi ? (
                  <>
                    <Sparkles className="w-3 h-3 text-[#00FF00]" />
                    <span>GEMINI AI OPPONENT</span>
                  </>
                ) : (
                  <span>OPPONENT</span>
                )}
              </p>
              <p className="text-xs sm:text-sm font-bold text-white">
                {opponent ? opponent.name : 'AWAITING DUELIST...'} 
                <span className="text-[#F27D26] ml-1 font-mono text-xs">
                  {opponent?.name === 'AlgoArena Bot' ? '[PRACTICE BOT]' : '[Diamond III]'}
                </span>
              </p>
            </div>
            <div className={clsx(
              "w-8 h-8 border flex items-center justify-center font-mono text-xs font-bold uppercase",
              opponent?.ready ? "border-[#00FF00] bg-[#00FF00]/20 text-[#00FF00]" : "border-white/10 bg-zinc-900 text-zinc-600"
            )}>
              {opponent?.name === 'AlgoArena Bot' ? <Bot className="w-4 h-4 text-[#00FF00]" /> : opponent ? opponent.name[0] : '?'}
            </div>
            {opponent && !opponent.isAi && (
              <FriendActions username={opponent.name} compact showProfileLink />
            )}
          </div>

          {/* Ready / Status Button */}
          <div>
            {room.status === 'waiting' && (
              <button 
                onClick={toggleReady}
                className={clsx(
                  "px-5 py-2 font-black uppercase text-xs tracking-widest transition-all cursor-pointer",
                  me?.ready 
                    ? "bg-zinc-800 text-zinc-300 border border-white/20 hover:bg-zinc-700" 
                    : "bg-[#00FF00] text-black hover:bg-[#00CC00] shadow-[0_0_15px_rgba(0,255,0,0.3)]"
                )}
              >
                {me?.ready ? 'CANCEL READY' : 'HIT READY [F5]'}
              </button>
            )}
            {room.status === 'finished' && (
              <div className="px-4 py-1.5 bg-[#F27D26]/20 text-[#F27D26] border border-[#F27D26]/40 font-black text-xs uppercase tracking-widest flex items-center gap-2">
                <Trophy className="w-3.5 h-3.5" /> 
                {room.winner === socket.id ? 'VICTORIOUS' : 'DEFEATED'}
              </div>
            )}
            {room.status === 'active' && (
              <button
                type="button"
                onClick={forfeitMatch}
                disabled={isForfeiting}
                className="flex items-center gap-1.5 px-3 py-1.5 border border-red-500/50 text-red-400 hover:bg-red-500/10 font-mono text-[10px] font-black uppercase transition-colors disabled:opacity-50"
                title="Forfeit this match"
              >
                <Flag className="w-3 h-3" /> {isForfeiting ? 'ENDING...' : 'FORFEIT'}
              </button>
            )}
          </div>
        </div>
      </nav>

      {/* Real-time Connection Drop Warning Alert Banner */}
      {connectionStatus === 'Disconnected' && (
        <div 
          id="arena-connection-lost-banner"
          className="bg-rose-950/90 border-b border-rose-500/50 px-4 py-2 flex items-center justify-between text-rose-300 font-mono text-xs z-30 shadow-[0_4px_12px_rgba(244,63,94,0.2)] animate-pulse"
        >
          <div className="flex items-center gap-2">
            <WifiOff className="w-4 h-4 text-rose-400 shrink-0" />
            <span className="font-bold uppercase tracking-wider text-[11px]">
              WEBSOCKET DISCONNECTED // Real-time match telemetry paused. Attempting reconnection to room #{roomId}...
            </span>
          </div>
          <button
            type="button"
            onClick={reconnectSocket}
            className="px-3 py-1 bg-rose-500 hover:bg-rose-400 text-black font-black uppercase text-[10px] tracking-wider transition-colors cursor-pointer"
          >
            RECONNECT NOW
          </button>
        </div>
      )}

      {/* Main Content Layout (3-Column Grid) */}
      <main className="flex-1 grid grid-cols-1 lg:grid-cols-[330px_1fr_300px] overflow-hidden">
        
        {/* Left Column: Problem Panel */}
        <aside className="border-r border-white/10 bg-[#080808] flex flex-col overflow-hidden">
          <div className="h-10 bg-[#0c0c0c] border-b border-white/10 px-4 flex items-center justify-between shrink-0">
            <h2 className="text-[11px] font-black text-zinc-400 uppercase tracking-widest flex items-center gap-2">
              <CheckSquare className="w-3.5 h-3.5 text-[#00FF00]" /> PROBLEM SPECIFICATION
            </h2>
            <span className="text-[10px] font-mono text-[#00FF00] uppercase font-bold">
              {isPracticeMode ? 'DSA PRACTICE' : 'GEMINI 2.5 FLASH'}
            </span>
          </div>

          <div className="p-6 overflow-y-auto flex-1 custom-scrollbar flex flex-col gap-6">
            {room.status === 'waiting' ? (
              <div className="flex flex-col space-y-4 text-left">
                {/* Lobby Status Header */}
                <div className="flex items-center gap-3 p-3 bg-black border border-[#00FF00]/30 shadow-[0_0_15px_rgba(0,255,0,0.1)]">
                  <div className="w-10 h-10 bg-[#00FF00]/10 border border-[#00FF00]/40 flex items-center justify-center shrink-0">
                    {isPracticeMode ? (
                      <Bot className="w-5 h-5 text-[#00FF00]" />
                    ) : (
                      <Sparkles className="w-5 h-5 text-[#00FF00]" />
                    )}
                  </div>
                  <div>
                    <h3 className="font-mono text-xs uppercase font-black text-white tracking-wider flex items-center gap-1.5">
                      <span>{isPracticeMode ? 'DSA PRACTICE MATRIX' : 'ARENA LOBBY ACTIVE'}</span>
                      <span className="w-2 h-2 rounded-full bg-[#00FF00] animate-pulse" />
                    </h3>
                    <p className="text-[10px] font-mono text-zinc-400 mt-0.5">
                      {opponents.length === 0 
                        ? 'Awaiting challenger. Summon AI bot or share invite link.' 
                        : `${opponent?.name} connected. Hit Ready to commence.`}
                    </p>
                  </div>
                </div>

                {/* Actions: Bot Summon & Invite */}
                <div className="space-y-2 pt-2 border-t border-white/10">
                  {opponents.length === 0 ? (
                    <>
                      {isPracticeMode && (
                        <button
                          onClick={summonAlgoArenaBot}
                          className="w-full py-2 bg-[#00FF00] hover:bg-[#00DD00] text-black font-mono text-xs font-black uppercase tracking-wider flex items-center justify-center gap-2 transition-all cursor-pointer shadow-[0_0_15px_rgba(0,255,0,0.3)]"
                        >
                          <Bot className="w-4 h-4" />
                          PLAY WITH ALGOARENA BOT
                        </button>
                      )}

                      <button
                        onClick={summonAiBot}
                        className="w-full py-2 bg-[#00FF00]/10 border border-[#00FF00]/40 hover:bg-[#00FF00]/20 text-[#00FF00] font-mono text-[11px] font-black uppercase tracking-wider flex items-center justify-center gap-1.5 transition-all cursor-pointer"
                      >
                        <Sparkles className="w-3.5 h-3.5" />
                        SUMMON GEMINI DUEL BOT
                      </button>

                      {!isPracticeMode && (
                        <button
                          type="button"
                          onClick={copyInviteLink}
                          className="w-full py-1.5 bg-black border border-white/15 text-zinc-300 hover:border-[#00FF00] hover:text-[#00FF00] font-mono text-[10px] font-bold uppercase flex items-center justify-center gap-2 transition-colors cursor-pointer"
                        >
                          <Code2 className="w-3.5 h-3.5" />
                          {inviteCopied ? 'INVITE LINK COPIED TO CLIPBOARD' : 'COPY 1V1 INVITE LINK'}
                        </button>
                      )}
                    </>
                  ) : (
                    <div className="p-3 bg-black border border-white/15 font-mono text-xs space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-zinc-400 font-bold uppercase">OPPONENT:</span>
                        <span className="text-white font-black uppercase">{opponent?.name}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-zinc-400 font-bold uppercase">STATUS:</span>
                        <span className={clsx("font-bold uppercase", opponent?.ready ? "text-[#00FF00]" : "text-amber-400")}>
                          {opponent?.ready ? 'READY FOR DUEL' : 'NOT READY YET'}
                        </span>
                      </div>
                      <p className="text-[10px] text-zinc-500 pt-1 border-t border-white/10">
                        Both players must press <span className="text-[#00FF00] font-bold">"HIT READY [F5]"</span> in the top right to generate the problem via Gemini.
                      </p>
                    </div>
                  )}
                </div>
              </div>
            ) : room.problem ? (
              <div className="space-y-6">
                <div>
                  <h1 className="text-2xl font-black italic uppercase leading-tight mb-2 text-white">
                    {room.problem.title}
                  </h1>
                  <div className="flex gap-2 mb-4">
                    <span className={clsx(
                      "text-[10px] px-2 py-0.5 border font-mono font-bold uppercase",
                      room.problem.difficulty === 'easy' ? "bg-green-500/10 text-green-400 border-green-500/30" :
                      room.problem.difficulty === 'medium' ? "bg-amber-500/10 text-amber-400 border-amber-500/30" :
                      "bg-red-500/20 text-red-400 border-red-500/30"
                    )}>
                      {room.problem.difficulty}
                    </span>
                    <span className="text-[10px] bg-zinc-900 text-zinc-400 px-2 py-0.5 border border-white/10 font-mono font-bold uppercase">
                      COMPETITIVE
                    </span>
                  </div>
                  <div className="text-xs text-zinc-300 leading-relaxed font-sans prose prose-invert prose-p:my-2 prose-code:text-[#00FF00] prose-code:bg-black prose-code:px-1 prose-code:py-0.5 max-w-none">
                    <ReactMarkdown>{room.problem.description}</ReactMarkdown>
                  </div>
                </div>

                {/* Match Progress Section */}
                <div className="space-y-4 pt-4 border-t border-white/10">
                  <h3 className="text-[11px] font-black text-zinc-500 uppercase tracking-widest border-b border-white/10 pb-2">
                    Match Progress
                  </h3>
                  <div className="space-y-3">
                    <div>
                      <div className="flex justify-between text-[11px] font-mono font-bold mb-1">
                        <span className="text-white">YOU [SOLVER]</span>
                        <span className="text-[#00FF00]">{myProgress}%</span>
                      </div>
                      <div className="h-1.5 w-full bg-zinc-900 border border-white/5">
                        <div 
                          className="h-full bg-[#00FF00] shadow-[0_0_8px_rgba(0,255,0,0.5)] transition-all duration-300" 
                          style={{ width: `${myProgress}%` }}
                        />
                      </div>
                    </div>
                    <div>
                      <div className="flex justify-between text-[11px] font-mono font-bold mb-1 text-zinc-500">
                        <span>{opponent ? opponent.name.toUpperCase() : 'OPPONENT'}</span>
                        <span>{opponent?.progress || 0}%</span>
                      </div>
                      <div className="h-1.5 w-full bg-zinc-900 border border-white/5">
                        <div 
                          className="h-full bg-white/20 transition-all duration-300" 
                          style={{ width: `${opponent?.progress || 0}%` }}
                        />
                      </div>
                    </div>
                  </div>
                </div>

                {/* Examples */}
                <div>
                  <h3 className="text-[11px] font-black text-zinc-500 uppercase tracking-widest mb-3">
                    IO Examples
                  </h3>
                  <div className="space-y-3">
                    {room.problem.examples.map((ex, i) => (
                      <div key={i} className="bg-black border border-white/10 text-xs">
                        <div className="px-3 py-1.5 bg-[#121212] border-b border-white/10 font-mono text-[11px] text-zinc-400 font-bold uppercase">
                          Example {i + 1}
                        </div>
                        <div className="p-3 space-y-1.5 font-mono text-zinc-400">
                          <div><span className="text-zinc-600 font-bold">IN:</span> {ex.input}</div>
                          <div><span className="text-[#00FF00] font-bold">OUT:</span> {ex.output}</div>
                          {ex.explanation && (
                            <div className="mt-1.5 text-zinc-500 italic text-[11px]">
                              {ex.explanation}
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Constraints */}
                <div>
                  <h3 className="text-[11px] font-black text-zinc-500 uppercase tracking-widest mb-2">
                    Constraints
                  </h3>
                  <ul className="space-y-1 text-xs text-zinc-400 font-mono bg-black p-3 border border-white/10">
                    {room.problem.constraints.map((c, i) => (
                      <li key={i} className="flex items-start gap-2">
                        <span className="text-[#00FF00]">•</span>
                        <span>{c}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                {/* AlgoArena Bot DSA Coach / Hint Assistant */}
                <div className="border border-[#00FF00]/30 bg-[#00FF00]/5 p-3 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-black text-[#00FF00] uppercase tracking-wider flex items-center gap-1.5 font-mono">
                      <Bot className="w-3.5 h-3.5 text-[#00FF00]" />
                      ALGOARENA BOT // DSA COACH
                    </span>
                    <button
                      onClick={requestBotHint}
                      disabled={hintLoading}
                      className="px-2 py-1 bg-[#00FF00]/20 hover:bg-[#00FF00]/30 border border-[#00FF00]/40 text-[#00FF00] text-[10px] font-mono font-bold uppercase cursor-pointer disabled:opacity-50 flex items-center gap-1 transition-all"
                    >
                      {hintLoading ? (
                        <>
                          <Loader2 className="w-3 h-3 animate-spin" />
                          <span>ANALYZING...</span>
                        </>
                      ) : (
                        <>
                          <Lightbulb className="w-3 h-3" />
                          <span>GET DSA HINT</span>
                        </>
                      )}
                    </button>
                  </div>
                  {recentHint ? (
                    <div className="p-2.5 bg-black/80 border border-[#00FF00]/40 text-zinc-200 text-[11px] font-mono leading-relaxed shadow-[0_0_10px_rgba(0,255,0,0.1)]">
                      <div className="text-[#00FF00] font-bold flex items-center gap-1 mb-1">
                        <Lightbulb className="w-3 h-3" />
                        <span>HINT DISPATCH:</span>
                      </div>
                      <p className="text-zinc-300">{recentHint}</p>
                    </div>
                  ) : (
                    <p className="text-[10px] font-mono text-zinc-500 italic">
                      Need guidance on edge cases, recurrence formulas, or data structures? Click to request a targeted DSA hint from AlgoArena Bot.
                    </p>
                  )}
                </div>

                {/* Sabotage Ready Indicator */}
                <div className="mt-auto border border-[#00FF00]/20 bg-[#00FF00]/5 p-3 rounded-none">
                  <p className="text-[10px] font-black text-[#00FF00] uppercase tracking-wider mb-1">
                    SABOTAGE PERK ENGAGED
                  </p>
                  <p className="text-xs italic text-zinc-400 font-mono">
                    Passing test cases will disrupt opponent keystrokes and delta metrics.
                  </p>
                </div>
              </div>
            ) : null}
          </div>
        </aside>

        {/* Center Column: Monaco Code Editor */}
        <section className="flex flex-col bg-[#050505] relative overflow-hidden border-r border-white/10">
          {/* Editor Header */}
          <div className="h-10 bg-[#121212] flex items-center justify-between px-4 border-b border-white/5 shrink-0">
            <div className="flex items-center gap-4 text-xs font-mono">
              <span className="text-[#00FF00] font-bold">
                solution.{
                  language === 'python' ? 'py' :
                  language === 'cpp' ? 'cpp' :
                  language === 'c' ? 'c' :
                  language === 'java' ? 'java' :
                  language === 'typescript' ? 'ts' : 'js'
                }
              </span>
              <span className="text-zinc-600">|</span>
              <span className="text-zinc-500">RUNTIME_ENV</span>
            </div>
            
            <div className="flex items-center gap-2.5">
              {/* Theme Selector */}
              <EditorThemeSelector 
                currentTheme={editorTheme} 
                onSelectTheme={handleThemeChange} 
              />

              {/* Sound FX Toggle */}
              <SoundToggle compact />

              <div className="h-4 w-px bg-white/10 hidden sm:block" />

              <span className="text-[10px] text-zinc-500 uppercase font-bold tracking-tighter hidden sm:inline">
                LANGUAGE
              </span>
              <select 
                value={language}
                onChange={e => handleLanguageChange(e.target.value)}
                className="bg-[#181818] text-[#00FF00] text-xs font-mono font-bold px-2 py-1 border border-white/10 outline-none uppercase cursor-pointer hover:border-[#00FF00]/50"
              >
                <option value="javascript">JavaScript (ES6)</option>
                <option value="python">Python 3.11</option>
                <option value="cpp">C++ 20</option>
                <option value="typescript">TypeScript 5.x</option>
                <option value="c">C (GCC 17)</option>
                <option value="java">Java (OpenJDK 21)</option>
              </select>
            </div>
          </div>
          
          {/* Code Editor Body */}
          <div className="flex-1 relative bg-black/40">
            <Editor
              height="100%"
              language={
                language === 'c' ? 'c' :
                language === 'cpp' ? 'cpp' :
                language === 'java' ? 'java' :
                language === 'python' ? 'python' :
                language === 'typescript' ? 'typescript' : 'javascript'
              }
              theme={editorTheme}
              beforeMount={registerMonacoThemes}
              value={code}
              onChange={val => setCode(val || '')}
              options={{
                minimap: { enabled: false },
                fontSize: 13,
                fontFamily: "'JetBrains Mono', monospace",
                lineHeight: 22,
                padding: { top: 16 },
                scrollBeyondLastLine: false,
                readOnly: room.status !== 'active'
              }}
            />
            
            {/* Overlay if waiting */}
            {room.status === 'waiting' && (
              <div className="absolute inset-0 bg-[#050505]/90 backdrop-blur-xs flex flex-col items-center justify-center z-10 font-mono p-6 text-center">
                <Terminal className="w-8 h-8 text-[#00FF00] mb-3 animate-pulse" />
                <div className="text-white text-sm font-black uppercase tracking-widest">
                  TERMINAL LOCKED // AWAITING DUEL START
                </div>
                <div className="text-xs text-[#00FF00] uppercase mt-4 font-black tracking-wider">
                  {me?.ready ? '✓ YOU ARE READY // WAITING FOR OPPONENT' : 'HIT "HIT READY [F5]" IN TOP RIGHT TO COMMENCE'}
                </div>
              </div>
            )}
            
            {/* Victory / Defeat Overlay */}
            <AnimatePresence>
              {room.status === 'finished' && (
                <motion.div 
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="absolute inset-0 bg-[#060606]/95 backdrop-blur-md flex flex-col z-30 overflow-hidden"
                >
                  {/* Top Post-Match Navigation Header */}
                  <div className="bg-[#0f0f0f] border-b border-white/10 px-4 py-2.5 flex flex-wrap items-center justify-between gap-3 shrink-0">
                    <div className="flex items-center gap-2.5">
                      <Trophy className={clsx(
                        "w-5 h-5", 
                        room.winner === socket.id ? "text-[#00FF00] drop-shadow-[0_0_8px_rgba(0,255,0,0.5)]" : "text-zinc-500"
                      )} />
                      <span className="font-mono font-black text-sm uppercase tracking-wider text-white">
                        {room.winner === socket.id ? 'MATCH WON' : 'DEFEAT'}
                      </span>
                      <span className="text-zinc-600 text-xs font-mono">|</span>
                      <span className="text-xs font-mono font-bold text-zinc-400">
                        {room.winner === socket.id ? '+25 ELO' : '0 ELO'}
                      </span>
                    </div>

                    {/* Post-Match Tab Navigation */}
                    <div className="flex items-center bg-black/60 border border-white/10 rounded-md p-0.5">
                      <button
                        onClick={() => setPostMatchTab('summary')}
                        className={clsx(
                          "flex items-center gap-1.5 px-3 py-1.5 text-xs font-mono rounded transition-all",
                          postMatchTab === 'summary'
                            ? "bg-white/20 text-white font-bold shadow-sm"
                            : "text-zinc-400 hover:text-white"
                        )}
                      >
                        <Trophy className="w-3.5 h-3.5" />
                        <span>Summary</span>
                      </button>

                      <button
                        onClick={() => setPostMatchTab('diff')}
                        className={clsx(
                          "flex items-center gap-1.5 px-3 py-1.5 text-xs font-mono rounded transition-all",
                          postMatchTab === 'diff'
                            ? "bg-[#00FF00]/20 text-[#00FF00] font-bold border border-[#00FF00]/30 shadow-sm"
                            : "text-zinc-400 hover:text-white"
                        )}
                      >
                        <GitCompare className="w-3.5 h-3.5" />
                        <span>Show Solution Diff</span>
                      </button>

                      <button
                        onClick={() => setPostMatchTab('expected')}
                        className={clsx(
                          "flex items-center gap-1.5 px-3 py-1.5 text-xs font-mono rounded transition-all",
                          postMatchTab === 'expected'
                            ? "bg-[#00FF00]/20 text-[#00FF00] font-bold border border-[#00FF00]/30 shadow-sm"
                            : "text-zinc-400 hover:text-white"
                        )}
                      >
                        <FileCode2 className="w-3.5 h-3.5" />
                        <span>Expected Solutions</span>
                      </button>

                      <button
                        onClick={() => setPostMatchTab('doctor')}
                        className={clsx(
                          "flex items-center gap-1.5 px-3 py-1.5 text-xs font-mono rounded transition-all",
                          postMatchTab === 'doctor'
                            ? "bg-[#00FF00]/20 text-[#00FF00] font-bold border border-[#00FF00]/30 shadow-sm"
                            : "text-zinc-400 hover:text-white"
                        )}
                      >
                        <Stethoscope className="w-3.5 h-3.5" />
                        <span>Line-by-Line Fixes</span>
                      </button>
                    </div>

                    <button 
                      onClick={() => navigate('/')} 
                      className="px-4 py-1.5 bg-[#00FF00] text-black font-black uppercase text-xs tracking-wider hover:bg-[#00CC00] transition-colors rounded shadow-[0_0_10px_rgba(0,255,0,0.3)]"
                    >
                      Return to Ladder
                    </button>
                  </div>

                  {/* Body Content based on active postMatchTab */}
                  <div className="flex-1 w-full overflow-y-auto p-4 flex flex-col">
                    {postMatchTab === 'summary' && (
                      <div className="flex-1 flex flex-col items-center justify-center text-center p-4 max-w-4xl mx-auto w-full">
                        <Trophy className={clsx(
                          "w-16 h-16 mb-3", 
                          room.winner === socket.id 
                            ? "text-[#00FF00] drop-shadow-[0_0_25px_rgba(0,255,0,0.6)]" 
                            : "text-zinc-600"
                        )} />
                        <h2 className="text-4xl font-black italic uppercase tracking-tighter text-white mb-2">
                          {room.winner === socket.id ? 'MATCH WON' : 'DEFEAT'}
                        </h2>
                        <p className="text-zinc-400 font-mono text-sm mb-5 uppercase tracking-wider">
                          {matchEndReason === 'forfeit'
                            ? 'The match ended by forfeit. The remaining player receives the victory.'
                            : matchEndReason === 'disconnect'
                              ? 'The match ended because a player disconnected. The remaining player receives the victory.'
                              : room.winner === socket.id ? 'All test cases verified. ELO +25 Points.' : 'Opponent completed solution first.'}
                        </p>

                        {/* Interactive Feature Callouts */}
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 w-full mb-6 text-left">
                          <button
                            onClick={() => setPostMatchTab('diff')}
                            className="p-3 bg-black/60 hover:bg-white/10 border border-white/10 hover:border-[#00FF00]/40 rounded-lg flex flex-col items-start gap-1 transition-all group"
                          >
                            <div className="flex items-center gap-2 text-white font-mono text-xs font-bold group-hover:text-[#00FF00]">
                              <GitCompare className="w-4 h-4 text-[#00FF00]" />
                              <span>Show Solution Diff</span>
                            </div>
                            <p className="text-[11px] text-zinc-400 font-mono">
                              Compare your submission side-by-side against opponent or canonical code.
                            </p>
                          </button>

                          <button
                            onClick={() => setPostMatchTab('expected')}
                            className="p-3 bg-black/60 hover:bg-white/10 border border-white/10 hover:border-[#00FF00]/40 rounded-lg flex flex-col items-start gap-1 transition-all group"
                          >
                            <div className="flex items-center gap-2 text-white font-mono text-xs font-bold group-hover:text-[#00FF00]">
                              <FileCode2 className="w-4 h-4 text-[#00FF00]" />
                              <span>Expected Solutions</span>
                            </div>
                            <p className="text-[11px] text-zinc-400 font-mono">
                              Browse optimal reference implementations in all 8 languages.
                            </p>
                          </button>

                          <button
                            onClick={() => setPostMatchTab('doctor')}
                            className="p-3 bg-black/60 hover:bg-white/10 border border-white/10 hover:border-[#00FF00]/40 rounded-lg flex flex-col items-start gap-1 transition-all group"
                          >
                            <div className="flex items-center gap-2 text-white font-mono text-xs font-bold group-hover:text-[#00FF00]">
                              <Stethoscope className="w-4 h-4 text-[#00FF00]" />
                              <span>Line-by-Line Fixes</span>
                            </div>
                            <p className="text-[11px] text-zinc-400 font-mono">
                              Deep code doctor diagnosis and line-by-line compiler corrections.
                            </p>
                          </button>
                        </div>

                        {(postMatchReview || evalResult?.review) && (
                          <div className="w-full mb-5 text-left max-h-[35vh] overflow-y-auto">
                            <CodeReview review={(postMatchReview || evalResult?.review)!} submittedCode={code} language={language} />
                          </div>
                        )}

                        {opponent && !opponent.isAi && (
                          <div className="mb-5">
                            <FriendActions username={opponent.name} showProfileLink />
                          </div>
                        )}
                      </div>
                    )}

                    {postMatchTab === 'diff' && (
                      <div className="h-full w-full flex-1 min-h-[450px]">
                        <SolutionDiffViewer
                          userCode={code}
                          userLanguage={language}
                          userName={currentUser.name || 'Your Code'}
                          opponentCode={
                            matchOverCodes[opponent?.id || '']?.code 
                            || opponent?.submittedCode 
                            || (room?.users && opponent?.id ? room.users[opponent.id]?.submittedCode : '')
                            || ''
                          }
                          opponentLanguage={
                            matchOverCodes[opponent?.id || '']?.language 
                            || opponent?.submittedLanguage 
                            || (room?.users && opponent?.id ? room.users[opponent.id]?.submittedLanguage : '') 
                            || language
                          }
                          opponentName={opponent?.name || 'Opponent'}
                          expectedSolution={diffExpectedOverride || postMatchReview?.expectedSolution || evalResult?.review?.expectedSolution || ''}
                          theme={editorTheme}
                          onThemeChange={handleThemeChange}
                          onClose={() => setPostMatchTab('summary')}
                        />
                      </div>
                    )}

                    {postMatchTab === 'expected' && (
                      <div className="h-full w-full flex-1 min-h-[450px]">
                        <ExpectedSolutionsViewer
                          problem={room.problem}
                          userLanguage={language}
                          theme={editorTheme}
                          onCompareInDiff={(expectedCode) => {
                            setDiffExpectedOverride(expectedCode);
                            setPostMatchTab('diff');
                          }}
                        />
                      </div>
                    )}

                    {postMatchTab === 'doctor' && (
                      <div className="h-full w-full flex-1 min-h-[450px]">
                        <LineByLineAnalyzer
                          code={code}
                          language={language}
                          problem={room.problem}
                          testResults={evalResult?.testResults}
                          error={evalResult?.feedback}
                          theme={editorTheme}
                          onDiffFixedCode={(fixedCode) => {
                            setDiffExpectedOverride(fixedCode);
                            setPostMatchTab('diff');
                          }}
                        />
                      </div>
                    )}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
          
          {/* Bottom Execution Bar */}
          <div className="h-14 border-t border-white/10 flex items-center justify-between px-4 sm:px-6 bg-[#0a0a0a] shrink-0">
            <div className="flex items-center gap-3 text-xs font-mono text-zinc-500 overflow-hidden">
              <span className="text-[#00FF00] font-bold shrink-0">STATUS:</span>
              <span className="truncate">
                {isRunningCode ? (
                  <span className="text-[#00FF00] flex items-center gap-1.5">
                    <Loader2 className="w-3.5 h-3.5 animate-spin text-[#00FF00]" />
                    RUNNING ON EXTERNAL ENGINE (JUDGE0)...
                  </span>
                ) : isEvaluating ? (
                  <span className="text-amber-400 flex items-center gap-1.5">
                    <Loader2 className="w-3.5 h-3.5 animate-spin text-amber-400" />
                    EXECUTING TEST SUITE (REFEREE)...
                  </span>
                ) : runResults ? (
                  <span className={clsx("font-bold", runResults.allPassed ? "text-[#00FF00]" : "text-rose-400")}>
                    SAMPLE RUN: {runResults.passedCount}/{runResults.totalCount} PASSED {runResults.totalTimeMs ? `(${runResults.totalTimeMs}ms)` : ''}
                  </span>
                ) : (
                  'READY FOR EXECUTION'
                )}
              </span>
            </div>

            <div className="flex items-center gap-2 sm:gap-3 shrink-0">
              {/* Console Toggle Button */}
              <button
                onClick={() => setIsConsoleExpanded(prev => !prev)}
                className="px-3 py-2 bg-black hover:bg-zinc-900 border border-white/15 text-zinc-300 text-xs font-mono flex items-center gap-1.5 transition-colors cursor-pointer"
                title="Toggle Test Runner & Output Console"
              >
                <Terminal className="w-3.5 h-3.5 text-[#00FF00]" />
                <span className="hidden sm:inline text-[11px] font-bold">CONSOLE</span>
                {isConsoleExpanded ? <ChevronDown className="w-3.5 h-3.5" /> : <ChevronUp className="w-3.5 h-3.5" />}
              </button>

              {/* RUN CODE Button */}
              <button 
                onClick={runCode}
                disabled={room.status !== 'active' || isRunningCode || isEvaluating}
                className="px-4 sm:px-5 py-2 bg-[#121212] hover:bg-zinc-900 text-[#00FF00] text-xs font-mono font-bold uppercase tracking-wider border border-[#00FF00]/40 hover:border-[#00FF00] transition-all disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-2 cursor-pointer shadow-[0_0_10px_rgba(0,255,0,0.15)]"
                title="Run code against sample test cases (Ctrl + Enter)"
              >
                {isRunningCode ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin text-[#00FF00]" />
                ) : (
                  <Terminal className="w-3.5 h-3.5 text-[#00FF00]" />
                )}
                <span>RUN CODE</span>
                <kbd className="hidden md:inline text-[9px] bg-black px-1.5 py-0.5 border border-white/10 text-zinc-400 font-normal">
                  Ctrl+Enter
                </kbd>
              </button>

              {/* SUBMIT SOLUTION Button */}
              <button 
                onClick={submitCode}
                disabled={room.status !== 'active' || isEvaluating || isRunningCode}
                className="px-5 sm:px-7 py-2 bg-[#00FF00] text-black text-xs font-mono font-black uppercase tracking-wider hover:bg-[#00CC00] transition-colors shadow-[0_0_15px_rgba(0,255,0,0.3)] disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-2 cursor-pointer"
                title="Submit solution to match referee (Ctrl + Shift + Enter)"
              >
                {isEvaluating ? <Loader2 className="w-3.5 h-3.5 animate-spin text-black" /> : <Play className="w-3.5 h-3.5 fill-black" />}
                <span>SUBMIT</span>
                <kbd className="hidden lg:inline text-[9px] bg-black/20 text-black px-1.5 py-0.5 font-normal">
                  Ctrl+Shift+Enter
                </kbd>
              </button>
            </div>
          </div>

          {/* Interactive Test Runner & Console Drawer */}
          {isConsoleExpanded && (
            <div className="h-64 sm:h-72 bg-[#080808] border-t border-white/10 flex flex-col shrink-0">
              {/* Drawer Header & Tabs */}
              <div className="h-9 bg-[#111111] flex items-center justify-between px-3 shrink-0 border-b border-white/10 select-none">
                <div className="flex items-center gap-1 sm:gap-2">
                  <button
                    onClick={() => setActiveConsoleTab('cases')}
                    className={clsx(
                      "px-3 py-1.5 text-xs font-mono font-bold uppercase tracking-wider flex items-center gap-1.5 transition-colors cursor-pointer",
                      activeConsoleTab === 'cases' 
                        ? "bg-[#080808] text-[#00FF00] border-t-2 border-[#00FF00]" 
                        : "text-zinc-400 hover:text-white"
                    )}
                  >
                    <CheckSquare className="w-3.5 h-3.5" />
                    <span>TEST CASES</span>
                    {runResults && (
                      <span className={clsx(
                        "ml-1 text-[9px] px-1.5 py-0.2 border font-mono font-black",
                        runResults.allPassed 
                          ? "bg-emerald-500/20 text-[#00FF00] border-emerald-500/30" 
                          : "bg-rose-500/20 text-rose-400 border-rose-500/30"
                      )}>
                        {runResults.passedCount}/{runResults.totalCount}
                      </span>
                    )}
                  </button>

                  <button
                    onClick={() => setActiveConsoleTab('terminal')}
                    className={clsx(
                      "px-3 py-1.5 text-xs font-mono font-bold uppercase tracking-wider flex items-center gap-1.5 transition-colors cursor-pointer",
                      activeConsoleTab === 'terminal' 
                        ? "bg-[#080808] text-[#00FF00] border-t-2 border-[#00FF00]" 
                        : "text-zinc-400 hover:text-white"
                    )}
                  >
                    <Terminal className="w-3.5 h-3.5" />
                    <span>RAW OUTPUT / LOGS</span>
                    {runResults?.results.some(r => r.stderr || !r.passed) && (
                      <span className="w-1.5 h-1.5 rounded-full bg-rose-500 animate-pulse"></span>
                    )}
                  </button>

                  {evalResult && (
                    <button
                      onClick={() => setActiveConsoleTab('submission')}
                      className={clsx(
                        "px-3 py-1.5 text-xs font-mono font-bold uppercase tracking-wider flex items-center gap-1.5 transition-colors cursor-pointer",
                        activeConsoleTab === 'submission' 
                          ? "bg-[#080808] text-[#00FF00] border-t-2 border-[#00FF00]" 
                          : "text-zinc-400 hover:text-white"
                      )}
                    >
                      <Sparkles className="w-3.5 h-3.5 text-[#00FF00]" />
                      <span>REFEREE LOGS</span>
                      <span className={clsx(
                        "ml-1 text-[9px] px-1.5 py-0.2 border font-mono font-black",
                        evalResult.allPassed 
                          ? "bg-emerald-500/20 text-[#00FF00] border-emerald-500/30" 
                          : "bg-rose-500/20 text-rose-400 border-rose-500/30"
                      )}>
                        {evalResult.allPassed ? 'PASSED' : 'FAILED'}
                      </span>
                    </button>
                  )}
                </div>

                <div className="flex items-center gap-2 text-[10px] font-mono text-zinc-400">
                  <span className="hidden sm:inline-flex items-center gap-1 bg-black/60 border border-white/10 px-2 py-0.5 text-zinc-300">
                    <Cpu className="w-3 h-3 text-[#00FF00]" />
                    {runResults?.executionEngine || 'SANDBOX: JUDGE0 CE'}
                  </span>
                  <button
                    onClick={() => setIsConsoleExpanded(false)}
                    className="p-1 hover:bg-zinc-800 text-zinc-400 hover:text-white transition-colors cursor-pointer"
                    title="Collapse Console"
                  >
                    <ChevronDown className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              {/* Drawer Tab Content */}
              <div className="flex-1 overflow-y-auto p-3 sm:p-4 custom-scrollbar">
                {activeConsoleTab === 'cases' && (
                  <div className="flex flex-col h-full">
                    {/* Test Case Subtabs */}
                    <div className="flex items-center justify-between gap-2 mb-3 pb-2 border-b border-white/10">
                      <div className="flex items-center gap-1.5 overflow-x-auto">
                        {(room?.problem?.examples || []).map((_, idx) => {
                          const caseResult = runResults?.results[idx];
                          return (
                            <button
                              key={idx}
                              onClick={() => setSelectedCaseIdx(idx)}
                              className={clsx(
                                "px-3 py-1 text-xs font-mono font-bold uppercase transition-all flex items-center gap-1.5 cursor-pointer border",
                                selectedCaseIdx === idx
                                  ? "bg-zinc-800 text-white border-white/30"
                                  : "bg-black/60 text-zinc-400 border-white/10 hover:text-zinc-200 hover:bg-zinc-900"
                              )}
                            >
                              <span>Case {idx + 1}</span>
                              {caseResult ? (
                                caseResult.passed ? (
                                  <Check className="w-3 h-3 text-[#00FF00]" />
                                ) : (
                                  <X className="w-3 h-3 text-rose-400" />
                                )
                              ) : (
                                <span className="w-1.5 h-1.5 rounded-full bg-zinc-600"></span>
                              )}
                            </button>
                          );
                        })}

                        {/* Custom Case Tab */}
                        <button
                          onClick={() => setSelectedCaseIdx(-1)}
                          className={clsx(
                            "px-3 py-1 text-xs font-mono font-bold uppercase transition-all flex items-center gap-1.5 cursor-pointer border",
                            selectedCaseIdx === -1
                              ? "bg-zinc-800 text-white border-white/30"
                              : "bg-black/60 text-zinc-400 border-white/10 hover:text-zinc-200 hover:bg-zinc-900"
                          )}
                        >
                          <Plus className="w-3 h-3 text-[#00FF00]" />
                          <span>Custom Case</span>
                          {customInput.trim() && (
                            <span className="w-1.5 h-1.5 rounded-full bg-[#00FF00]"></span>
                          )}
                        </button>
                      </div>

                      {/* Active Case Telemetry */}
                      {selectedCaseIdx >= 0 && runResults?.results[selectedCaseIdx] && (
                        <div className="hidden sm:flex items-center gap-3 text-[11px] font-mono">
                          <span className={clsx(
                            "px-2 py-0.5 border font-bold uppercase",
                            runResults.results[selectedCaseIdx].passed
                              ? "bg-emerald-500/10 text-[#00FF00] border-emerald-500/30"
                              : "bg-rose-500/10 text-rose-400 border-rose-500/30"
                          )}>
                            {runResults.results[selectedCaseIdx].status}
                          </span>
                          {runResults.results[selectedCaseIdx].time && (
                            <span className="text-zinc-400 flex items-center gap-1">
                              <Clock className="w-3 h-3 text-zinc-500" />
                              {runResults.results[selectedCaseIdx].time}
                            </span>
                          )}
                          {runResults.results[selectedCaseIdx].memory && (
                            <span className="text-zinc-400 flex items-center gap-1">
                              <Cpu className="w-3 h-3 text-zinc-500" />
                              {runResults.results[selectedCaseIdx].memory} MB
                            </span>
                          )}
                        </div>
                      )}
                    </div>

                    {/* Case Details */}
                    {selectedCaseIdx === -1 ? (
                      /* Custom Test Case Input Mode */
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 font-mono text-xs">
                        <div className="space-y-1.5">
                          <label className="text-[10px] font-black text-zinc-400 uppercase tracking-wider flex items-center justify-between">
                            <span>CUSTOM STDIN / INPUT</span>
                            <span className="text-zinc-600 text-[9px]">e.g. nums = [2,7,11,15], target = 9</span>
                          </label>
                          <textarea
                            value={customInput}
                            onChange={(e) => setCustomInput(e.target.value)}
                            placeholder="Enter custom input to execute against..."
                            rows={3}
                            className="w-full bg-black border border-white/10 p-2.5 text-zinc-200 text-xs font-mono focus:border-[#00FF00] focus:outline-none resize-none"
                          />
                        </div>

                        <div className="space-y-1.5">
                          <label className="text-[10px] font-black text-zinc-400 uppercase tracking-wider flex items-center justify-between">
                            <span>EXPECTED OUTPUT (OPTIONAL)</span>
                            <span className="text-zinc-600 text-[9px]">Used for correctness check</span>
                          </label>
                          <input
                            type="text"
                            value={customExpected}
                            onChange={(e) => setCustomExpected(e.target.value)}
                            placeholder="Optional expected output to compare against..."
                            className="w-full bg-black border border-white/10 p-2.5 text-zinc-200 text-xs font-mono focus:border-[#00FF00] focus:outline-none"
                          />

                          {runResults?.results.find(r => r.id === 'custom') && (
                            <div className="mt-2 p-2 bg-black border border-white/10">
                              <div className="text-[10px] text-zinc-400 font-bold uppercase mb-1">
                                CUSTOM EXECUTION ACTUAL OUTPUT:
                              </div>
                              <div className="text-xs text-[#00FF00]">
                                {runResults.results.find(r => r.id === 'custom')?.actual}
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    ) : (
                      /* Standard Example Case View */
                      (() => {
                        const example = room?.problem?.examples[selectedCaseIdx];
                        const result = runResults?.results[selectedCaseIdx];

                        return (
                          <div className="space-y-3 font-mono text-xs">
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-2 sm:gap-3">
                              {/* Input */}
                              <div className="bg-black border border-white/10 p-2.5">
                                <div className="text-[10px] font-black text-zinc-500 uppercase tracking-wider mb-1">
                                  INPUT
                                </div>
                                <div className="text-zinc-200 font-mono text-xs break-all whitespace-pre-wrap max-h-20 overflow-y-auto">
                                  {example?.input || '-'}
                                </div>
                              </div>

                              {/* Expected Output */}
                              <div className="bg-black border border-white/10 p-2.5">
                                <div className="text-[10px] font-black text-zinc-500 uppercase tracking-wider mb-1">
                                  EXPECTED OUTPUT
                                </div>
                                <div className="text-zinc-200 font-mono text-xs break-all whitespace-pre-wrap max-h-20 overflow-y-auto">
                                  {example?.output || '-'}
                                </div>
                              </div>

                              {/* Actual Output */}
                              <div className={clsx(
                                "bg-black border p-2.5 transition-colors",
                                result 
                                  ? result.passed 
                                    ? "border-emerald-500/40 bg-emerald-950/10" 
                                    : "border-rose-500/40 bg-rose-950/10" 
                                  : "border-white/10"
                              )}>
                                <div className="flex items-center justify-between mb-1">
                                  <span className="text-[10px] font-black text-zinc-500 uppercase tracking-wider">
                                    ACTUAL OUTPUT
                                  </span>
                                  {result && (
                                    <span className={clsx(
                                      "text-[9px] font-black font-mono uppercase px-1.5 py-0.2 border",
                                      result.passed 
                                        ? "bg-emerald-500/20 text-[#00FF00] border-emerald-500/40" 
                                        : "bg-rose-500/20 text-rose-400 border-rose-500/40"
                                    )}>
                                      {result.status}
                                    </span>
                                  )}
                                </div>
                                <div className={clsx(
                                  "font-mono text-xs break-all whitespace-pre-wrap max-h-20 overflow-y-auto",
                                  result 
                                    ? result.passed 
                                      ? "text-[#00FF00]" 
                                      : "text-rose-400 font-bold" 
                                    : "text-zinc-500 italic"
                                )}>
                                  {result ? result.actual : "Click 'Run Code' or press [Ctrl+Enter] to run against this case."}
                                </div>
                              </div>
                            </div>

                            {/* Stdout / Stderr Diagnostic logs */}
                            {result && (result.stdout || result.stderr || result.compileOutput) && (
                              <div className="bg-[#050505] border border-white/10 p-2.5 space-y-1 text-[11px]">
                                {result.stdout && (
                                  <div>
                                    <div className="text-[9px] font-black text-zinc-500 uppercase tracking-wider mb-0.5">
                                      STANDARD OUTPUT (PRINT LOGS)
                                    </div>
                                    <pre className="text-zinc-300 font-mono text-[11px] whitespace-pre-wrap max-h-16 overflow-y-auto">
                                      {result.stdout}
                                    </pre>
                                  </div>
                                )}
                                {(result.stderr || result.compileOutput) && (
                                  <div className="pt-1 border-t border-white/5">
                                    <div className="text-[9px] font-black text-rose-400 uppercase tracking-wider mb-0.5">
                                      STANDARD ERROR / DIAGNOSTICS
                                    </div>
                                    <pre className="text-rose-400 font-mono text-[11px] whitespace-pre-wrap max-h-16 overflow-y-auto">
                                      {result.stderr || result.compileOutput}
                                    </pre>
                                  </div>
                                )}
                              </div>
                            )}
                          </div>
                        );
                      })()
                    )}
                  </div>
                )}

                {activeConsoleTab === 'terminal' && (
                  <div className="font-mono text-xs space-y-2 h-full flex flex-col">
                    <div className="flex items-center justify-between text-[11px] pb-2 border-b border-white/10 text-zinc-400">
                      <div className="flex items-center gap-2">
                        <span className="text-[#00FF00]">arena@external-sandbox:~$</span>
                        <span>run --lang={language}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => {
                            if (!runResults) return;
                            const text = runResults.results.map((r, i) => 
                              `Case #${i + 1} (${r.status}):\nInput: ${r.input}\nExpected: ${r.expected}\nActual: ${r.actual}\n${r.stdout ? 'Stdout:\n' + r.stdout : ''}${r.stderr ? 'Stderr:\n' + r.stderr : ''}`
                            ).join('\n\n');
                            navigator.clipboard.writeText(text);
                            setCopiedConsole(true);
                            setTimeout(() => setCopiedConsole(false), 2000);
                          }}
                          className="px-2 py-0.5 bg-black hover:bg-zinc-800 border border-white/10 text-[10px] text-zinc-300 flex items-center gap-1 cursor-pointer"
                        >
                          {copiedConsole ? <Check className="w-3 h-3 text-[#00FF00]" /> : <Copy className="w-3 h-3" />}
                          <span>{copiedConsole ? 'COPIED' : 'COPY'}</span>
                        </button>
                        <button
                          onClick={() => setRunResults(null)}
                          className="px-2 py-0.5 bg-black hover:bg-zinc-800 border border-white/10 text-[10px] text-zinc-300 cursor-pointer"
                        >
                          CLEAR
                        </button>
                      </div>
                    </div>

                    <div className="flex-1 bg-black border border-white/10 p-3 overflow-y-auto text-[11px] space-y-2">
                      <div className="text-zinc-500">
                        [AlgoArena Code Execution Service // Engine: {runResults?.executionEngine || 'Judge0 CE Sandbox'}]
                      </div>
                      {runResults ? (
                        runResults.results.map((res, i) => (
                          <div key={i} className="space-y-1 pb-2 border-b border-white/5 last:border-0">
                            <div className="flex items-center gap-2 font-bold">
                              <span className={res.passed ? "text-[#00FF00]" : "text-rose-400"}>
                                [{res.passed ? 'PASS' : 'FAIL'}] Case {i + 1}
                              </span>
                              <span className="text-zinc-500 text-[10px]">
                                {res.status} ({res.time || '0ms'})
                              </span>
                            </div>
                            <div className="text-zinc-400 text-[10px] pl-3">
                              in: {res.input}
                            </div>
                            <div className="text-zinc-400 text-[10px] pl-3">
                              exp: {res.expected}
                            </div>
                            <div className={clsx("text-[10px] pl-3", res.passed ? "text-[#00FF00]" : "text-rose-400")}>
                              out: {res.actual}
                            </div>
                            {res.stdout && (
                              <div className="text-zinc-400 text-[10px] pl-3 whitespace-pre-wrap">
                                stdout: {res.stdout.trim()}
                              </div>
                            )}
                            {res.stderr && (
                              <div className="text-rose-400 text-[10px] pl-3 whitespace-pre-wrap">
                                stderr: {res.stderr.trim()}
                              </div>
                            )}
                          </div>
                        ))
                      ) : (
                        <div className="text-zinc-600 italic">
                          No active execution output yet. Click 'Run Code' or press [Ctrl+Enter] to execute your solution.
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {activeConsoleTab === 'submission' && evalResult && (
                  <div className="space-y-3 font-mono text-xs">
                    <p className="text-zinc-300">{evalResult.feedback}</p>
                    <div className="space-y-2">
                      {evalResult.testResults?.map((test, i) => (
                        <div key={i} className="bg-black border border-white/10 p-2 text-xs font-mono">
                          <div className="flex items-center gap-2 mb-1.5">
                            {test.passed ? <Check className="w-3.5 h-3.5 text-[#00FF00]" /> : <X className="w-3.5 h-3.5 text-red-500" />}
                            <span className="font-bold text-white uppercase text-[11px]">Test Case {i + 1}</span>
                            <span className={clsx("ml-auto font-black text-[10px]", test.passed ? "text-[#00FF00]" : "text-red-500")}>
                              {test.passed ? 'PASS' : 'WRONG OUTPUT'}
                            </span>
                          </div>
                          <div className="grid grid-cols-3 gap-2 text-[10px] text-zinc-400">
                            <div><span className="text-zinc-600">INPUT:</span> {test.input}</div>
                            <div><span className="text-zinc-600">EXPECTED:</span> {test.expected}</div>
                            <div><span className="text-zinc-600">ACTUAL:</span> {test.actual}</div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
        </section>

        {/* Right Column: Test Suite & Match Telemetry / Chat */}
        <aside className="border-l border-white/10 flex flex-col bg-[#080808] overflow-hidden">
          {/* Test Suite Section */}
          <div className="p-4 border-b border-white/10 shrink-0">
            <h3 className="text-[11px] font-black text-zinc-500 uppercase tracking-widest mb-3 flex items-center justify-between">
              <span>TEST SUITE STATUS</span>
              <Activity className="w-3.5 h-3.5 text-[#00FF00]" />
            </h3>
            <div className="space-y-2 font-mono text-xs">
              {(room?.problem?.examples || []).map((_, i) => {
                const caseRes = runResults?.results[i];
                return (
                  <div key={i} className="flex items-center gap-2">
                    <div className={clsx(
                      "w-2 h-2 rounded-full",
                      caseRes 
                        ? caseRes.passed ? "bg-[#00FF00]" : "bg-rose-500"
                        : "bg-[#00FF00]"
                    )}></div>
                    <span className="text-zinc-400">Case 0{i + 1}: [Sample]</span>
                    <span className={clsx(
                      "ml-auto font-bold uppercase text-[10px]",
                      caseRes 
                        ? caseRes.passed ? "text-[#00FF00]" : "text-rose-400"
                        : "text-[#00FF00]"
                    )}>
                      {caseRes ? (caseRes.passed ? `PASSED (${caseRes.time || '10ms'})` : 'FAILED') : 'READY'}
                    </span>
                  </div>
                );
              })}
              <div className="flex items-center gap-2">
                <div className={clsx(
                  "w-2 h-2 rounded-full",
                  evalResult ? (evalResult.allPassed ? "bg-[#00FF00]" : "bg-zinc-700") : "bg-zinc-700"
                )}></div>
                <span className="text-zinc-500">Case 03: Hidden Matrix</span>
                <span className={clsx(
                  "ml-auto font-bold uppercase text-[10px]",
                  evalResult ? (evalResult.allPassed ? "text-[#00FF00]" : "text-zinc-500") : "text-zinc-600"
                )}>
                  {evalResult ? (evalResult.allPassed ? 'VERIFIED' : 'FAILED') : 'HIDDEN'}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <div className={clsx(
                  "w-2 h-2 rounded-full",
                  evalResult ? (evalResult.allPassed ? "bg-[#00FF00]" : "bg-zinc-700") : "bg-zinc-700"
                )}></div>
                <span className="text-zinc-500">Case 04: Large Array</span>
                <span className={clsx(
                  "ml-auto font-bold uppercase text-[10px]",
                  evalResult ? (evalResult.allPassed ? "text-[#00FF00]" : "text-zinc-500") : "text-zinc-600"
                )}>
                  {evalResult ? (evalResult.allPassed ? 'VERIFIED' : 'FAILED') : 'HIDDEN'}
                </span>
              </div>
            </div>
          </div>

          {/* Match Feed / Real-Time Chat */}
          <div className="flex-1 p-4 overflow-hidden flex flex-col">
            <h3 className="text-[11px] font-black text-zinc-500 uppercase tracking-widest mb-3">
              MATCH LOG & CHAT
            </h3>
            
            <div className="flex-1 font-mono text-[11px] space-y-2.5 overflow-y-auto custom-scrollbar opacity-90 pr-1">
              <div className="text-zinc-600">[00:00] SYSTEM: Match room connected.</div>
              {chat.map((msg, i) => (
                <div key={i} className={clsx(
                  msg.isHint 
                    ? "bg-[#00FF00]/10 border border-[#00FF00]/40 p-2 text-[#00FF00] rounded-none shadow-[0_0_8px_rgba(0,255,0,0.15)]" 
                    : msg.system 
                      ? "text-[#00FF00] italic text-[10px]" 
                      : "text-zinc-300"
                )}>
                  {msg.isHint ? (
                    <div>
                      <div className="flex items-center gap-1 font-black text-[10px] text-[#00FF00] uppercase mb-1">
                        <Lightbulb className="w-3 h-3" />
                        <span>DSA COACH HINT</span>
                      </div>
                      <div className="text-zinc-200 text-[10.5px] leading-relaxed whitespace-pre-wrap">
                        {msg.text.replace(/^💡\s*DSA HINT:\s*/, '')}
                      </div>
                    </div>
                  ) : !msg.system ? (
                    <div>
                      <span className={clsx(
                        "font-black mr-2 uppercase inline-flex items-center gap-1",
                        msg.user === me?.name 
                          ? "text-[#00FF00]" 
                          : msg.user === 'AlgoArena Bot' 
                            ? "text-emerald-400" 
                            : "text-[#F27D26]"
                      )}>
                        {msg.user === 'AlgoArena Bot' && <Bot className="w-3 h-3 inline" />}
                        {msg.user}:
                      </span>
                      <span>{msg.text}</span>
                    </div>
                  ) : (
                    <span>{msg.text}</span>
                  )}
                </div>
              ))}
              <div ref={chatEndRef} />
            </div>

            <form onSubmit={sendChat} className="mt-4 pt-3 border-t border-white/5">
              <div className="bg-black border border-white/10 px-3 py-2 flex items-center gap-2">
                <span className="text-[#00FF00] text-xs font-mono font-bold">&gt;</span>
                <input
                  type="text"
                  value={chatInput}
                  onChange={e => setChatInput(e.target.value)}
                  placeholder="SEND MESSAGE / REACTION..."
                  className="bg-transparent border-none text-[10px] font-mono outline-none text-zinc-300 w-full uppercase font-bold placeholder:text-zinc-600"
                />
                <button type="submit" className="text-zinc-500 hover:text-[#00FF00]">
                  <MessageSquare className="w-3.5 h-3.5" />
                </button>
              </div>
            </form>
          </div>
        </aside>
      </main>

      {/* Telemetry Footer */}
      <footer className="h-8 bg-[#050505] border-t border-white/10 flex items-center px-6 text-[10px] font-bold text-zinc-600 justify-between uppercase tracking-widest font-mono shrink-0">
        <div className="flex gap-6">
          <span>Region: US-EAST-1</span>
          <span className="hidden sm:inline">Latency: 24ms</span>
          <span className="hidden md:inline">Observers: 128</span>
        </div>
        <div>
          PROVISIONED BY GEMINI-ARENA-CORE // VERSION 1.0.4
        </div>
      </footer>
    </div>
  );
}
