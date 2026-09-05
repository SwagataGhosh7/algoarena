import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import { socket } from '../socket';
import { useStore } from '../store';
import { RoomState, ChatMessage, EvaluationResult } from '../types';
import Editor from '@monaco-editor/react';
import { Play, CheckSquare, MessageSquare, ShieldAlert, ArrowLeft, Loader2, Sparkles, X, Check, Trophy, Activity, Terminal, Bot, Lightbulb, Code2, Flag } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import clsx from 'clsx';
import { motion, AnimatePresence } from 'motion/react';
import { FriendActions } from '../components/FriendActions';
import { CodeReview } from '../components/CodeReview';

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
  const [myProgress, setMyProgress] = useState(0);
  const [timerSeconds, setTimerSeconds] = useState(600); // 10:00 timer
  const [selectedDifficulty, setSelectedDifficulty] = useState<'easy' | 'medium' | 'hard'>(queryDiff || 'medium');
  const [selectedTopic, setSelectedTopic] = useState(queryTopic || 'Dynamic Programming');
  const [hintLoading, setHintLoading] = useState(false);
  const [recentHint, setRecentHint] = useState<string | null>(null);
  const [matchEndReason, setMatchEndReason] = useState<string | null>(null);
  const [postMatchReview, setPostMatchReview] = useState<EvaluationResult['review'] | null>(null);
  const [isForfeiting, setIsForfeiting] = useState(false);
  const [inviteCopied, setInviteCopied] = useState(false);
  
  const chatEndRef = useRef<HTMLDivElement>(null);
  const autoSummonedRef = useRef(false);

  useEffect(() => {
    socket.connect();
    
    socket.emit('join_room', { 
      roomId, 
      user: currentUser,
      mode: isPracticeMode ? 'practice' : 'duel',
      topic: selectedTopic,
    });

    socket.on('room_state_update', (state: RoomState) => {
      setRoom(state);
    });

    socket.on('chat_message', (msg: ChatMessage) => {
      setChat(prev => [...prev, msg]);
      if (msg.isHint) {
        setRecentHint(msg.text.replace(/^💡\s*DSA HINT:\s*/, ''));
        setHintLoading(false);
      }
    });

    socket.on('match_started', () => {
      setChat(prev => [...prev, { system: true, text: 'MATCH COMMENCED // TIMER ENGAGED' }]);
      setEvalResult(null);
      setMyProgress(0);
      setRecentHint(null);
    });

    socket.on('opponent_progress', ({ progress }) => {
      // room state handles updates
    });
    
     socket.on('match_over', ({ winner, reason, reviewByUserId }) => {
       setMatchEndReason(reason || null);
       setPostMatchReview(reviewByUserId?.[socket.id!] || null);
       setChat(prev => [...prev, { system: true, text: `MATCH TERMINATED // ${winner.name} WINS` }]);
    });

    return () => {
      socket.off('room_state_update');
      socket.off('chat_message');
      socket.off('match_started');
      socket.off('opponent_progress');
      socket.off('match_over');
      socket.disconnect();
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

  const submitCode = async () => {
    if (!room?.problem) return;
    setIsEvaluating(true);
    setEvalResult(null);
    
    try {
      const res = await fetch('/api/evaluate', {
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
      setEvalResult({
        allPassed: false,
        feedback: 'Evaluation service error.',
        testResults: []
      });
    } finally {
      setIsEvaluating(false);
    }
  };

  if (!room) {
    return (
      <div className="min-h-screen bg-[#050505] flex flex-col items-center justify-center text-[#00FF00] font-mono">
        <Loader2 className="w-8 h-8 animate-spin mb-3" />
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
            <span className="bg-[#00FF00]/10 text-[#00FF00] text-[10px] px-2 py-0.5 border border-[#00FF00]/30 font-mono uppercase font-bold">
              Room: #{roomId}
            </span>
          </div>
        </div>
        
        <div className="flex items-center gap-6 sm:gap-8">
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
              <div className="h-full flex flex-col items-center justify-center text-center text-zinc-500 space-y-4 my-auto p-4">
                <div className="w-14 h-14 bg-black border border-[#00FF00]/30 flex items-center justify-center shadow-[0_0_20px_rgba(0,255,0,0.15)]">
                  {isPracticeMode ? (
                    <Bot className="w-7 h-7 text-[#00FF00]" />
                  ) : (
                    <Sparkles className="w-7 h-7 text-[#00FF00]" />
                  )}
                </div>
                <div>
                  <p className="font-mono text-xs uppercase font-bold text-zinc-200">
                    {isPracticeMode ? 'DSA PRACTICE ARENA ACTIVE' : 'ARENA LOBBY ACTIVE'}
                  </p>
                  <p className="text-[11px] font-mono text-zinc-400 mt-1 max-w-[240px] leading-relaxed">
                    {opponents.length === 0 
                      ? 'No challenger detected. Engage AlgoArena Bot for interactive DSA drills with real-time hints, or summon a Gemini duel bot.'
                      : `${opponent?.name} connected. Ready up to initialize algorithmic test cases.`}
                  </p>
                {room.status === 'waiting' && !isPracticeMode && (
                  <button
                    type="button"
                    onClick={copyInviteLink}
                    className="w-full max-w-[260px] py-2 bg-[#00FF00]/10 border border-[#00FF00]/50 text-[#00FF00] hover:bg-[#00FF00]/20 font-mono text-[11px] font-black uppercase flex items-center justify-center gap-2 transition-colors"
                  >
                    <Code2 className="w-3.5 h-3.5" />
                    {inviteCopied ? 'INVITE LINK COPIED' : 'COPY 1V1 INVITE LINK'}
                  </button>
                )}
                </div>

                {/* AI & Bot Summon Controls */}
                {opponents.length === 0 && (
                  <div className="w-full max-w-[260px] pt-2 space-y-3">
                    <button
                      onClick={summonAlgoArenaBot}
                      className="w-full py-2.5 bg-[#00FF00] hover:bg-[#00DD00] text-black font-mono text-xs font-black uppercase tracking-wider flex items-center justify-center gap-2 transition-all cursor-pointer shadow-[0_0_15px_rgba(0,255,0,0.3)]"
                    >
                      <Bot className="w-4 h-4" />
                      PLAY WITH ALGOARENA BOT
                    </button>

                    <button
                      onClick={summonAiBot}
                      className="w-full py-2 bg-[#00FF00]/10 border border-[#00FF00]/40 hover:bg-[#00FF00]/20 text-[#00FF00] font-mono text-[11px] font-black uppercase tracking-wider flex items-center justify-center gap-1.5 transition-all cursor-pointer"
                    >
                      <Sparkles className="w-3.5 h-3.5" />
                      SUMMON GEMINI DUEL BOT
                    </button>

                    <div className="space-y-2 pt-1 border-t border-white/10 text-left">
                      <div className="flex items-center justify-between font-mono text-[10px]">
                        <span className="text-zinc-500">DSA TOPIC:</span>
                        <select
                          value={selectedTopic}
                          onChange={e => setSelectedTopic(e.target.value)}
                          className="bg-black text-[#00FF00] border border-white/10 px-2 py-0.5 text-[10px] font-mono uppercase outline-none"
                        >
                          <option value="Arrays & Strings">Arrays & Strings</option>
                          <option value="Dynamic Programming">Dynamic Programming</option>
                          <option value="Trees & Graphs">Trees & Graphs</option>
                          <option value="Backtracking">Backtracking</option>
                          <option value="Binary Search">Binary Search</option>
                          <option value="Greedy Algorithms">Greedy Algorithms</option>
                        </select>
                      </div>

                      <div className="flex items-center justify-between font-mono text-[10px]">
                        <span className="text-zinc-500">DIFFICULTY:</span>
                        <div className="flex gap-1">
                          {(['easy', 'medium', 'hard'] as const).map(diff => (
                            <button
                              key={diff}
                              onClick={() => setSelectedDifficulty(diff)}
                              className={clsx(
                                "px-2 py-0.5 border uppercase font-bold cursor-pointer transition-colors text-[10px]",
                                selectedDifficulty === diff 
                                  ? "bg-[#00FF00] text-black border-[#00FF00]" 
                                  : "bg-black text-zinc-400 border-white/10 hover:border-white/30"
                              )}
                            >
                              {diff}
                            </button>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                )}
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
            
            <div className="flex items-center gap-3">
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
              theme="vs-dark"
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
              <div className="absolute inset-0 bg-[#050505]/85 backdrop-blur-xs flex flex-col items-center justify-center z-10 font-mono">
                <Terminal className="w-8 h-8 text-[#00FF00] mb-3 animate-pulse" />
                <div className="text-white text-sm font-black uppercase tracking-widest">
                  TERMINAL LOCKED // AWAITING DUEL START
                </div>
                <div className="text-xs text-zinc-500 uppercase mt-1">
                  Hit Ready Up to prompt matching
                </div>
              </div>
            )}
            
            {/* Victory / Defeat Overlay */}
            <AnimatePresence>
              {room.status === 'finished' && (
                <motion.div 
                  initial={{ opacity: 0, scale: 0.96 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0 }}
                  className="absolute inset-0 bg-black/90 backdrop-blur-md flex flex-col items-center justify-center z-20 p-6 text-center"
                >
                  <Trophy className={clsx(
                    "w-20 h-20 mb-4", 
                    room.winner === socket.id 
                      ? "text-[#00FF00] drop-shadow-[0_0_25px_rgba(0,255,0,0.6)]" 
                      : "text-zinc-600"
                  )} />
                  <h2 className="text-5xl font-black italic uppercase tracking-tighter text-white mb-2">
                    {room.winner === socket.id ? 'MATCH WON' : 'DEFEAT'}
                  </h2>
                  <p className="text-zinc-400 font-mono text-sm mb-6 uppercase tracking-wider">
                    {matchEndReason === 'forfeit'
                      ? 'The match ended by forfeit. The remaining player receives the victory.'
                      : matchEndReason === 'disconnect'
                        ? 'The match ended because a player disconnected. The remaining player receives the victory.'
                        : room.winner === socket.id ? 'All test cases verified. ELO +25 Points.' : 'Opponent completed solution first.'}
                  </p>
                  {(postMatchReview || evalResult?.review) && (
                    <div className="w-full max-w-3xl mb-5 text-left max-h-[42vh] overflow-y-auto">
                      <CodeReview review={(postMatchReview || evalResult?.review)!} submittedCode={code} language={language} />
                    </div>
                  )}
                  {opponent && !opponent.isAi && (
                    <div className="mb-5">
                      <FriendActions username={opponent.name} showProfileLink />
                    </div>
                  )}
                  <button 
                    onClick={() => navigate('/')} 
                    className="px-8 py-3 bg-[#00FF00] text-black font-black uppercase text-xs tracking-widest hover:bg-[#00CC00] transition-colors shadow-[0_0_15px_rgba(0,255,0,0.3)]"
                  >
                    RETURN TO LADDER
                  </button>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
          
          {/* Bottom Execution Bar */}
          <div className="h-14 border-t border-white/10 flex items-center justify-between px-6 bg-[#0a0a0a] shrink-0">
            <div className="flex items-center gap-3 text-xs font-mono text-zinc-500">
              <span className="text-[#00FF00] font-bold">STATUS:</span>
              <span>{isEvaluating ? 'EXECUTING TEST SUITE...' : 'READY FOR EVALUATION'}</span>
            </div>
            <div className="flex items-center gap-3">
              <button 
                onClick={submitCode}
                disabled={room.status !== 'active' || isEvaluating}
                className="px-6 py-2 bg-zinc-800 text-white text-xs font-black uppercase tracking-widest border border-white/10 hover:bg-zinc-700 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
              >
                RUN LOCAL TESTS
              </button>
              <button 
                onClick={submitCode}
                disabled={room.status !== 'active' || isEvaluating}
                className="px-8 py-2 bg-[#00FF00] text-black text-xs font-black uppercase tracking-widest hover:bg-[#00CC00] transition-colors shadow-[0_0_15px_rgba(0,255,0,0.3)] disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-2"
              >
                {isEvaluating ? <Loader2 className="w-3.5 h-3.5 animate-spin text-black" /> : <Play className="w-3.5 h-3.5 fill-black" />}
                SUBMIT SOLUTION
              </button>
            </div>
          </div>

          {/* Test Evaluation Results Panel */}
          {evalResult && (
            <div className="h-44 bg-[#080808] border-t border-white/10 flex flex-col shrink-0">
              <div className="h-9 bg-[#121212] flex items-center px-4 shrink-0 gap-2 border-b border-white/10">
                <Sparkles className="w-3.5 h-3.5 text-[#00FF00]" />
                <span className="text-[11px] font-black text-zinc-300 uppercase tracking-widest font-mono">
                  GEMINI EVALUATION LOGS
                </span>
                {evalResult.allPassed ? (
                   <span className="ml-auto text-[10px] font-black font-mono bg-green-500/20 text-[#00FF00] px-2 py-0.5 border border-green-500/30 uppercase">
                     ALL TESTS PASSED
                   </span>
                ) : (
                   <span className="ml-auto text-[10px] font-black font-mono bg-red-500/20 text-red-400 px-2 py-0.5 border border-red-500/30 uppercase">
                     TESTS FAILED
                   </span>
                )}
              </div>
              <div className="flex-1 overflow-y-auto p-4 custom-scrollbar">
                <p className="text-xs font-mono text-zinc-300 mb-3">{evalResult.feedback}</p>
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
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-[#00FF00]"></div>
                <span className="text-zinc-400">Case 01: [Primary Input]</span>
                <span className="ml-auto text-[#00FF00] font-bold">READY</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-[#00FF00]"></div>
                <span className="text-zinc-400">Case 02: [Boundary Edge]</span>
                <span className="ml-auto text-[#00FF00] font-bold">READY</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-zinc-700"></div>
                <span className="text-zinc-500">Case 03: Hidden Matrix</span>
                <span className="ml-auto text-zinc-600 font-bold uppercase">HIDDEN</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-zinc-700"></div>
                <span className="text-zinc-500">Case 04: Large Array</span>
                <span className="ml-auto text-zinc-600 font-bold uppercase">HIDDEN</span>
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
