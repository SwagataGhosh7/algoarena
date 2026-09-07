import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Swords, 
  X, 
  ShieldAlert, 
  Check, 
  Clock, 
  User, 
  Zap, 
  Loader2, 
  AlertCircle,
  Trophy,
  Flame
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { socket } from '../socket';
import { DirectChallengePayload } from '../types';
import { soundManager } from '../lib/soundEffects';

interface DirectChallengeManagerProps {
  currentUsername: string;
  currentElo: number;
}

export function DirectChallengeManager({
  currentUsername,
  currentElo,
}: DirectChallengeManagerProps) {
  const navigate = useNavigate();

  // Incoming challenge state
  const [incomingChallenge, setIncomingChallenge] = useState<DirectChallengePayload | null>(null);
  const [incomingTimeRemaining, setIncomingTimeRemaining] = useState<number>(30);
  const [isAccepting, setIsAccepting] = useState<boolean>(false);

  // Outgoing challenge state
  const [outgoingTarget, setOutgoingTarget] = useState<{
    username: string;
    socketId?: string;
    elo?: number;
  } | null>(null);
  const [selectedDifficulty, setSelectedDifficulty] = useState<'easy' | 'medium' | 'hard'>('medium');
  const [selectedTopic, setSelectedTopic] = useState('Algorithms & Data Structures');
  const [isSending, setIsSending] = useState(false);
  const [activeOutgoingChallengeId, setActiveOutgoingChallengeId] = useState<string | null>(null);
  const [outgoingTimeRemaining, setOutgoingTimeRemaining] = useState<number>(30);
  const [statusMessage, setStatusMessage] = useState<{ type: 'error' | 'info' | 'success'; text: string } | null>(null);

  // Register user info on socket
  useEffect(() => {
    if (currentUsername) {
      socket.emit('register_user', {
        username: currentUsername,
        elo: currentElo,
      });
    }
  }, [currentUsername, currentElo]);

  // Listen for socket events
  useEffect(() => {
    const handleChallengeReceived = (payload: DirectChallengePayload) => {
      soundManager.playNotification();
      setIncomingChallenge(payload);
      const remainingSecs = Math.max(1, Math.round(((payload.expiresAt || (Date.now() + 30000)) - Date.now()) / 1000));
      setIncomingTimeRemaining(remainingSecs);
    };

    const handleChallengeExpired = (data: { challengeId: string; targetUsername?: string }) => {
      if (incomingChallenge?.challengeId === data.challengeId) {
        setIncomingChallenge(null);
      }
      if (activeOutgoingChallengeId === data.challengeId) {
        setActiveOutgoingChallengeId(null);
        setOutgoingTarget(null);
        setStatusMessage({
          type: 'info',
          text: `Challenge to ${data.targetUsername || 'opponent'} expired with no response.`,
        });
        setTimeout(() => setStatusMessage(null), 5000);
      }
    };

    const handleChallengeDeclined = (data: { challengeId: string; targetUsername: string; reason?: string }) => {
      soundManager.playTestFailed();
      if (activeOutgoingChallengeId === data.challengeId) {
        setActiveOutgoingChallengeId(null);
        setOutgoingTarget(null);
        setStatusMessage({
          type: 'error',
          text: `Player ${data.targetUsername} declined your duel invitation.`,
        });
        setTimeout(() => setStatusMessage(null), 6000);
      }
    };

    const handleChallengeCancelled = (data: { challengeId: string }) => {
      if (incomingChallenge?.challengeId === data.challengeId) {
        setIncomingChallenge(null);
        setStatusMessage({
          type: 'info',
          text: 'Challenger withdrew the duel invitation.',
        });
        setTimeout(() => setStatusMessage(null), 4000);
      }
    };

    const handleChallengeSentSuccess = (data: { challengeId: string; targetUsername: string; expiresAt: number }) => {
      setActiveOutgoingChallengeId(data.challengeId);
      setIsSending(false);
      setOutgoingTimeRemaining(30);
    };

    const handleChallengeStart = (data: { roomId: string; opponentName: string; difficulty: string; topic: string }) => {
      soundManager.playDuelStart();
      setIncomingChallenge(null);
      setActiveOutgoingChallengeId(null);
      setOutgoingTarget(null);
      navigate(`/room/${data.roomId}?diff=${data.difficulty}&topic=${encodeURIComponent(data.topic)}`);
    };

    const handleChallengeError = (data: { message: string }) => {
      setIsSending(false);
      setStatusMessage({
        type: 'error',
        text: data.message || 'Direct challenge failed',
      });
      setTimeout(() => setStatusMessage(null), 5000);
    };

    // Custom window event to trigger challenge from other components (like Leaderboard or Operators List)
    const handleGlobalTrigger = (e: CustomEvent) => {
      if (e.detail) {
        setOutgoingTarget({
          username: e.detail.username,
          socketId: e.detail.socketId,
          elo: e.detail.elo || 1200,
        });
      }
    };

    window.addEventListener('algoarena:challenge-user' as any, handleGlobalTrigger);
    socket.on('direct_challenge_received', handleChallengeReceived);
    socket.on('direct_challenge_expired', handleChallengeExpired);
    socket.on('direct_challenge_declined', handleChallengeDeclined);
    socket.on('direct_challenge_cancelled', handleChallengeCancelled);
    socket.on('direct_challenge_sent_success', handleChallengeSentSuccess);
    socket.on('direct_challenge_start', handleChallengeStart);
    socket.on('direct_challenge_error', handleChallengeError);

    return () => {
      window.removeEventListener('algoarena:challenge-user' as any, handleGlobalTrigger);
      socket.off('direct_challenge_received', handleChallengeReceived);
      socket.off('direct_challenge_expired', handleChallengeExpired);
      socket.off('direct_challenge_declined', handleChallengeDeclined);
      socket.off('direct_challenge_cancelled', handleChallengeCancelled);
      socket.off('direct_challenge_sent_success', handleChallengeSentSuccess);
      socket.off('direct_challenge_start', handleChallengeStart);
      socket.off('direct_challenge_error', handleChallengeError);
    };
  }, [incomingChallenge, activeOutgoingChallengeId, navigate]);

  // Countdown timer for incoming challenge
  useEffect(() => {
    if (!incomingChallenge) return;
    const interval = setInterval(() => {
      setIncomingTimeRemaining(prev => {
        if (prev <= 1) {
          setIncomingChallenge(null);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [incomingChallenge]);

  // Countdown timer for outgoing challenge
  useEffect(() => {
    if (!activeOutgoingChallengeId) return;
    const interval = setInterval(() => {
      setOutgoingTimeRemaining(prev => {
        if (prev <= 1) {
          setActiveOutgoingChallengeId(null);
          setOutgoingTarget(null);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [activeOutgoingChallengeId]);

  const handleAcceptIncoming = () => {
    if (!incomingChallenge || isAccepting) return;
    soundManager.playClick();
    setIsAccepting(true);
    const targetRoomId = incomingChallenge.roomId;
    const diff = incomingChallenge.difficulty || 'medium';
    const topic = incomingChallenge.topic || 'Algorithms';

    // Notify server of acceptance
    socket.emit('accept_direct_challenge', {
      challengeId: incomingChallenge.challengeId,
    });

    // Fallback direct jump guarantee: jumps straight to room within 750ms if socket start event lags
    const timer = setTimeout(() => {
      soundManager.playDuelStart();
      setIncomingChallenge(null);
      setIsAccepting(false);
      navigate(`/room/${targetRoomId}?diff=${diff}&topic=${encodeURIComponent(topic)}`);
    }, 750);

    return () => clearTimeout(timer);
  };

  const handleDeclineIncoming = () => {
    if (!incomingChallenge) return;
    soundManager.playClick();
    socket.emit('decline_direct_challenge', {
      challengeId: incomingChallenge.challengeId,
      reason: 'declined',
    });
    setIncomingChallenge(null);
  };

  const handleSendChallenge = () => {
    if (!outgoingTarget) return;
    soundManager.playClick();
    setIsSending(true);
    socket.emit('send_direct_challenge', {
      targetUsername: outgoingTarget.username,
      targetSocketId: outgoingTarget.socketId,
      difficulty: selectedDifficulty,
      topic: selectedTopic,
    });
  };

  const handleCancelOutgoing = () => {
    if (activeOutgoingChallengeId) {
      socket.emit('cancel_direct_challenge', {
        challengeId: activeOutgoingChallengeId,
      });
      setActiveOutgoingChallengeId(null);
    }
    setOutgoingTarget(null);
    setIsSending(false);
  };

  return (
    <>
      {/* Toast Notification Banner for Status Updates */}
      <AnimatePresence>
        {statusMessage && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className={`fixed top-16 right-6 z-50 p-3 font-mono text-xs flex items-center gap-2 border shadow-2xl ${
              statusMessage.type === 'error'
                ? 'bg-rose-950/90 border-rose-500 text-rose-200'
                : 'bg-emerald-950/90 border-[#00FF00] text-[#00FF00]'
            }`}
          >
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{statusMessage.text}</span>
            <button
              onClick={() => setStatusMessage(null)}
              className="ml-2 text-zinc-400 hover:text-white p-0.5"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* POPUP NOTIFICATION: Incoming Direct Challenge */}
      <AnimatePresence>
        {incomingChallenge && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md">
            <motion.div
              initial={{ scale: 0.9, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 20 }}
              className="bg-[#0a0a0a] border-2 border-[#00FF00] max-w-md w-full p-6 text-left shadow-[0_0_50px_rgba(0,255,0,0.3)] font-mono relative overflow-hidden"
            >
              {/* Pulsing Neon Ambient Header */}
              <div className="flex items-center justify-between pb-4 border-b border-[#00FF00]/40 mb-4">
                <div className="flex items-center gap-2.5">
                  <div className="w-9 h-9 bg-[#00FF00] text-black flex items-center justify-center font-black shadow-[0_0_15px_rgba(0,255,0,0.5)]">
                    <Swords className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-sm font-black text-white uppercase tracking-wider flex items-center gap-2">
                      <span>INCOMING DUEL CHALLENGE</span>
                      <span className="w-2 h-2 rounded-full bg-[#00FF00] animate-ping" />
                    </h3>
                    <p className="text-[10px] text-[#00FF00] font-bold">
                      REAL-TIME PLAYER INVITATION
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-1 bg-black border border-[#00FF00]/40 px-2 py-1 text-[#00FF00] text-xs font-black">
                  <Clock className="w-3.5 h-3.5" />
                  <span>{incomingTimeRemaining}s</span>
                </div>
              </div>

              {/* Opponent Specs Card */}
              <div className="bg-black/90 border border-white/15 p-4 mb-4 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-[#00FF00]/10 border border-[#00FF00] text-[#00FF00] flex items-center justify-center font-bold text-sm">
                      {incomingChallenge.senderUsername.slice(0, 2).toUpperCase()}
                    </div>
                    <div>
                      <div className="text-sm font-black text-white uppercase">
                        {incomingChallenge.senderUsername}
                      </div>
                      <div className="text-xs text-[#F27D26] font-bold flex items-center gap-1">
                        <Trophy className="w-3 h-3" />
                        <span>{incomingChallenge.senderElo || 1200} ELO</span>
                      </div>
                    </div>
                  </div>

                  <span className="px-2.5 py-1 bg-[#00FF00]/10 border border-[#00FF00]/40 text-[#00FF00] text-[10px] font-black uppercase">
                    LIVE LOBBY
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-2 pt-2 border-t border-white/10 text-[11px]">
                  <div>
                    <span className="text-zinc-500 uppercase text-[10px] block font-bold">DIFFICULTY</span>
                    <span className="font-bold text-white uppercase text-xs">
                      {incomingChallenge.difficulty || 'Medium'}
                    </span>
                  </div>
                  <div>
                    <span className="text-zinc-500 uppercase text-[10px] block font-bold">FOCUS TOPIC</span>
                    <span className="font-bold text-zinc-300 truncate block text-xs">
                      {incomingChallenge.topic || 'Algorithms'}
                    </span>
                  </div>
                </div>
              </div>

              {/* Progress bar countdown */}
              <div className="w-full bg-zinc-900 h-1.5 mb-5 overflow-hidden">
                <div 
                  className="bg-[#00FF00] h-full transition-all duration-1000 ease-linear shadow-[0_0_10px_rgba(0,255,0,0.5)]"
                  style={{ width: `${(incomingTimeRemaining / 30) * 100}%` }}
                />
              </div>

              {/* Action Buttons */}
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  disabled={isAccepting}
                  onClick={handleDeclineIncoming}
                  className="py-2.5 bg-black hover:bg-zinc-900 border border-white/20 text-zinc-400 hover:text-white font-bold uppercase text-xs transition-all cursor-pointer flex items-center justify-center gap-1.5 disabled:opacity-50"
                >
                  <X className="w-4 h-4" />
                  <span>DECLINE</span>
                </button>

                <button
                  type="button"
                  disabled={isAccepting}
                  onClick={handleAcceptIncoming}
                  className="py-2.5 bg-[#00FF00] hover:bg-[#00DD00] text-black font-black uppercase text-xs tracking-wider shadow-[0_0_25px_rgba(0,255,0,0.45)] transition-all cursor-pointer flex items-center justify-center gap-1.5 disabled:opacity-75"
                  title="Accept invitation and jump directly into the private duel room"
                >
                  {isAccepting ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin text-black" />
                      <span>JUMPING TO ROOM...</span>
                    </>
                  ) : (
                    <>
                      <Swords className="w-4 h-4 fill-black" />
                      <span>ACCEPT & JUMP TO ROOM</span>
                    </>
                  )}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* MODAL: Outgoing Challenge Configuration & Transmission */}
      <AnimatePresence>
        {outgoingTarget && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-[#0c0c0c] border border-[#00FF00]/60 max-w-md w-full p-6 text-left shadow-[0_0_40px_rgba(0,255,0,0.25)] font-mono relative"
            >
              {/* Header */}
              <div className="flex items-center justify-between pb-3 border-b border-white/10 mb-4">
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 bg-[#00FF00]/20 border border-[#00FF00] flex items-center justify-center text-[#00FF00]">
                    <Zap className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="text-xs font-black uppercase text-white tracking-wider">
                      DIRECT DUEL CHALLENGE
                    </h3>
                    <p className="text-[10px] text-zinc-400">
                      Transmit private duel request to active player
                    </p>
                  </div>
                </div>
                {!activeOutgoingChallengeId && (
                  <button
                    onClick={handleCancelOutgoing}
                    className="text-zinc-500 hover:text-white p-1"
                  >
                    <X className="w-4 h-4" />
                  </button>
                )}
              </div>

              {/* Target info card */}
              <div className="p-3 bg-black border border-white/15 mb-4 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-zinc-900 border border-white/20 flex items-center justify-center font-bold text-xs text-white">
                    {outgoingTarget.username.slice(0, 2).toUpperCase()}
                  </div>
                  <div>
                    <div className="text-xs font-bold text-white uppercase">
                      {outgoingTarget.username}
                    </div>
                    <div className="text-[10px] text-[#F27D26] font-bold">
                      {outgoingTarget.elo || 1200} ELO
                    </div>
                  </div>
                </div>
                <span className="text-[10px] bg-[#00FF00]/20 text-[#00FF00] px-2 py-0.5 border border-[#00FF00]/40 font-bold uppercase">
                  TARGET
                </span>
              </div>

              {/* Active waiting view */}
              {activeOutgoingChallengeId ? (
                <div className="py-6 text-center space-y-4">
                  <div className="relative w-16 h-16 mx-auto flex items-center justify-center">
                    <div className="absolute inset-0 rounded-full border-2 border-[#00FF00]/30 animate-ping" />
                    <div className="w-12 h-12 rounded-full bg-[#00FF00]/10 border border-[#00FF00] flex items-center justify-center text-[#00FF00]">
                      <Loader2 className="w-6 h-6 animate-spin text-[#00FF00]" />
                    </div>
                  </div>
                  <div>
                    <h4 className="text-xs font-black uppercase text-white tracking-wider">
                      INVITATION TRANSMITTED
                    </h4>
                    <p className="text-[11px] text-zinc-400 mt-1">
                      Awaiting response from <span className="text-white font-bold">{outgoingTarget.username}</span>...
                    </p>
                    <div className="mt-2 text-xs font-bold text-[#00FF00]">
                      Timeout in {outgoingTimeRemaining}s
                    </div>
                  </div>

                  <div className="w-full bg-zinc-900 h-1.5 overflow-hidden">
                    <div 
                      className="bg-[#00FF00] h-full transition-all duration-1000 ease-linear shadow-[0_0_8px_rgba(0,255,0,0.5)]"
                      style={{ width: `${(outgoingTimeRemaining / 30) * 100}%` }}
                    />
                  </div>

                  <button
                    type="button"
                    onClick={handleCancelOutgoing}
                    className="mt-2 px-4 py-1.5 bg-black border border-white/20 text-zinc-400 hover:text-white text-xs font-bold uppercase cursor-pointer"
                  >
                    CANCEL INVITATION
                  </button>
                </div>
              ) : (
                /* Configurator form */
                <div className="space-y-4">
                  <div>
                    <label className="text-[10px] uppercase font-bold text-zinc-400 block mb-1.5">
                      MATCH DIFFICULTY
                    </label>
                    <div className="grid grid-cols-3 gap-2">
                      {(['easy', 'medium', 'hard'] as const).map(diff => (
                        <button
                          key={diff}
                          type="button"
                          onClick={() => setSelectedDifficulty(diff)}
                          className={`py-2 text-xs font-bold uppercase transition-all cursor-pointer border ${
                            selectedDifficulty === diff
                              ? 'bg-[#00FF00]/20 border-[#00FF00] text-[#00FF00]'
                              : 'bg-black border-white/10 text-zinc-400 hover:border-white/30'
                          }`}
                        >
                          {diff}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div>
                    <label className="text-[10px] uppercase font-bold text-zinc-400 block mb-1.5">
                      FOCUS TOPIC
                    </label>
                    <select
                      value={selectedTopic}
                      onChange={e => setSelectedTopic(e.target.value)}
                      className="w-full bg-black border border-white/20 p-2 text-xs text-white uppercase outline-none focus:border-[#00FF00]"
                    >
                      <option value="Algorithms & Data Structures">All Algorithms & DSA</option>
                      <option value="Dynamic Programming">Dynamic Programming</option>
                      <option value="Graphs & BFS/DFS">Graphs & BFS/DFS</option>
                      <option value="Arrays & Strings">Arrays & Strings</option>
                      <option value="Binary Trees">Binary Trees</option>
                      <option value="Bit Manipulation">Bit Manipulation</option>
                    </select>
                  </div>

                  <div className="pt-2">
                    <button
                      type="button"
                      disabled={isSending}
                      onClick={handleSendChallenge}
                      className="w-full py-3 bg-[#00FF00] hover:bg-[#00DD00] text-black font-black uppercase text-xs tracking-wider shadow-[0_0_20px_rgba(0,255,0,0.3)] transition-all cursor-pointer flex items-center justify-center gap-2 disabled:opacity-50"
                    >
                      {isSending ? (
                        <>
                          <Loader2 className="w-4 h-4 animate-spin" />
                          <span>TRANSMITTING CHALLENGE...</span>
                        </>
                      ) : (
                        <>
                          <Swords className="w-4 h-4 fill-black" />
                          <span>TRANSMIT DUEL CHALLENGE</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>
              )}
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>
  );
}

// Global helper to trigger a direct challenge from any component
export function triggerDirectChallenge(username: string, socketId?: string, elo?: number) {
  const event = new CustomEvent('algoarena:challenge-user', {
    detail: { username, socketId, elo },
  });
  window.dispatchEvent(event);
}
