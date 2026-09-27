import { useState, useEffect } from 'react';
import { 
  ShieldCheck, 
  X, 
  Mail, 
  Lock, 
  AlertCircle, 
  Loader2, 
  Sparkles, 
  Terminal,
  LogIn,
  UserPlus,
  Zap,
  Copy,
  Check,
  ExternalLink,
  UserCheck,
  Globe
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  auth, 
  googleProvider, 
  signInWithPopup, 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword,
  updateProfile
} from '../lib/firebase';
import { useStore } from '../store';
import { v4 as uuidv4 } from 'uuid';

export function AuthModal() {
  const { 
    isAuthModalOpen, 
    setAuthModalOpen, 
    setAccountProfile, 
    setProfileSetupOpen,
    accountProfile,
    pendingRoomId
  } = useStore();

  const [mode, setMode] = useState<'signin' | 'register'>('signin');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isUnauthorizedDomain, setIsUnauthorizedDomain] = useState(false);
  const [copiedDomain, setCopiedDomain] = useState(false);
  const currentHostname = typeof window !== 'undefined' ? window.location.hostname : '';

  useEffect(() => {
    if (isAuthModalOpen) {
      setError(null);
      setIsUnauthorizedDomain(false);
      setCopiedDomain(false);
    }
  }, [isAuthModalOpen]);

  if (!isAuthModalOpen) return null;

  const handleCopyDomain = async () => {
    try {
      await navigator.clipboard.writeText(currentHostname);
      setCopiedDomain(true);
      setTimeout(() => setCopiedDomain(false), 2500);
    } catch {
      // Fallback
      setCopiedDomain(true);
      setTimeout(() => setCopiedDomain(false), 2500);
    }
  };

  const handleInstantDemoProfile = () => {
    const existing = accountProfile;
    const uid = existing?.uid || `user_${uuidv4().slice(0, 8)}`;
    setAccountProfile({
      uid,
      name: 'Swagata Ghosh',
      username: 'swagataghosh',
      email: 'swagataghosh538@gmail.com',
      nationality: 'India',
      region: 'Asia',
      photoURL: existing?.photoURL || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=120&h=120&q=80',
      isSetupComplete: true,
    });
    setAuthModalOpen(false);
  };

  const handleInstantGuestDuelist = () => {
    const randomCallsign = `duelist_${Math.floor(1000 + Math.random() * 9000)}`;
    const uid = `guest_${uuidv4().slice(0, 8)}`;
    setAccountProfile({
      uid,
      name: randomCallsign,
      username: randomCallsign,
      email: `${randomCallsign}@algoarena.local`,
      nationality: 'United States',
      region: 'North America',
      photoURL: '',
      isSetupComplete: false,
    });
    setAuthModalOpen(false);
    setProfileSetupOpen(true);
  };

  const handleGoogleSignIn = async () => {
    setError(null);
    setIsUnauthorizedDomain(false);
    setLoading(true);
    try {
      const result = await signInWithPopup(auth, googleProvider);
      const user = result.user;

      const existingProfile = accountProfile?.uid === user.uid ? accountProfile : null;
      const isComplete = Boolean(existingProfile?.isSetupComplete && existingProfile?.nationality && existingProfile?.region);

      const generatedUsername = existingProfile?.username || user.displayName?.toLowerCase().replace(/[^a-z0-9_]/g, '') || user.email?.split('@')[0] || `duelist_${user.uid.slice(0, 5)}`;

      setAccountProfile({
        uid: user.uid,
        name: user.displayName || existingProfile?.name || 'Algo Duelist',
        username: generatedUsername,
        email: user.email || '',
        photoURL: user.photoURL || existingProfile?.photoURL || '',
        nationality: existingProfile?.nationality || '',
        region: existingProfile?.region || '',
        isSetupComplete: isComplete,
      });

      setAuthModalOpen(false);

      if (!isComplete) {
        setProfileSetupOpen(true);
      }
    } catch (err: any) {
      const isUnauthDomain = err.code === 'auth/unauthorized-domain' || err.message?.includes('unauthorized-domain');
      if (isUnauthDomain) {
        setIsUnauthorizedDomain(true);
        setError('Firebase domain restriction: This preview domain has not yet been whitelisted in Firebase Console.');
        console.warn('[Firebase Auth] Domain not yet whitelisted in Firebase Console:', window.location.hostname);
      } else if (err.code === 'auth/popup-closed-by-user') {
        setError('Google sign-in popup was cancelled.');
      } else if (err.code === 'auth/popup-blocked') {
        setError('Popup was blocked by browser. Please allow popups or use email sign-in.');
      } else {
        console.warn('[Firebase Auth] Sign in exception:', err?.message || err);
        setError(err.message || 'Failed to authenticate via Google.');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleEmailAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsUnauthorizedDomain(false);

    if (!email || !password) {
      setError('Please provide email and password.');
      return;
    }

    if (mode === 'register' && password.length < 6) {
      setError('Password must be at least 6 characters.');
      return;
    }

    setLoading(true);
    try {
      if (mode === 'register') {
        const cred = await createUserWithEmailAndPassword(auth, email, password);
        const user = cred.user;
        if (displayName) {
          await updateProfile(user, { displayName });
        }

        const username = displayName 
          ? displayName.toLowerCase().replace(/[^a-z0-9_]/g, '') 
          : email.split('@')[0].replace(/[^a-z0-9_]/g, '');

        setAccountProfile({
          uid: user.uid,
          name: displayName || username,
          username,
          email: user.email || email,
          nationality: '',
          region: '',
          photoURL: '',
          isSetupComplete: false,
        });

        setAuthModalOpen(false);
        // Prompt for mandatory profile setup flow
        setProfileSetupOpen(true);
      } else {
        const cred = await signInWithEmailAndPassword(auth, email, password);
        const user = cred.user;
        const existingProfile = accountProfile?.uid === user.uid ? accountProfile : null;
        const isComplete = Boolean(existingProfile?.isSetupComplete && existingProfile?.nationality && existingProfile?.region);

        setAccountProfile({
          uid: user.uid,
          name: user.displayName || existingProfile?.name || email.split('@')[0],
          username: existingProfile?.username || email.split('@')[0],
          email: user.email || email,
          nationality: existingProfile?.nationality || '',
          region: existingProfile?.region || '',
          photoURL: existingProfile?.photoURL || '',
          isSetupComplete: isComplete,
        });

        setAuthModalOpen(false);
        if (!isComplete) {
          setProfileSetupOpen(true);
        }
      }
    } catch (err: any) {
      console.warn('[Firebase Auth] Email Auth notice:', err?.code || err?.message);
      if (err.code === 'auth/operation-not-allowed') {
        setError('Email/Password provider is disabled in Firebase. Use Instant Guest Duelist or enable it in Firebase Console.');
      } else if (err.code === 'auth/invalid-credential' || err.code === 'auth/wrong-password' || err.code === 'auth/user-not-found') {
        setError('Invalid email or password credential.');
      } else if (err.code === 'auth/email-already-in-use') {
        setError('This email address is already registered. Please sign in instead.');
      } else if (err.code === 'auth/weak-password') {
        setError('Password is too weak. Please use at least 6 characters.');
      } else {
        setError(err.message || 'Authentication failed. Please verify credentials.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 10 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 10 }}
        className="relative w-full max-w-md bg-[#0a0a0a] border border-[#00FF00]/40 shadow-[0_0_40px_rgba(0,255,0,0.15)] text-left overflow-hidden"
      >
        {/* Top decorative scanline bar */}
        <div className="h-1 bg-gradient-to-r from-transparent via-[#00FF00] to-transparent" />

        {/* Modal Header */}
        <div className="flex items-center justify-between p-5 border-b border-white/10 bg-zinc-950/60">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 border border-[#00FF00]/40 bg-[#00FF00]/10 flex items-center justify-center text-[#00FF00]">
              <ShieldCheck className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-sm font-black text-white uppercase tracking-wider font-mono flex items-center gap-2">
                AlgoArena
              </h2>
              <p className="text-[10px] text-zinc-400 font-mono">
                {mode === 'signin' ? 'Verify security clearance' : 'Initialize player account'}
              </p>
            </div>
          </div>
          <button
            onClick={() => setAuthModalOpen(false)}
            className="p-1.5 text-zinc-400 hover:text-white hover:bg-white/10 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Pending Match Code Invitation Notice */}
        {pendingRoomId && (
          <div className="p-3 bg-gradient-to-r from-[#00FF00]/15 via-emerald-950/30 to-black border-b border-[#00FF00]/30 flex items-center gap-2.5 shrink-0">
            <Zap className="w-4 h-4 text-[#00FF00] animate-pulse shrink-0" />
            <div className="flex-1 min-w-0">
              <div className="text-[11px] font-black text-[#00FF00] uppercase font-mono tracking-wider truncate">
                MATCH CODE INVITE: ROOM #{pendingRoomId}
              </div>
              <div className="text-[10px] text-zinc-300 font-mono">
                Authenticate with Google, Email, or Guest mode for this 1v1 duel.
              </div>
            </div>
          </div>
        )}

        <div className="p-6 space-y-4">
          {/* General Error Banner */}
          {error && !isUnauthorizedDomain && (
            <div className="p-3 bg-red-950/40 border border-red-500/50 text-red-300 text-xs flex items-start gap-2 font-mono">
              <AlertCircle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          {/* Dedicated Firebase Unauthorized Domain Card */}
          {isUnauthorizedDomain && (
            <div className="p-3.5 bg-gradient-to-b from-amber-950/60 to-black/80 border border-amber-500/60 text-zinc-200 text-xs font-mono space-y-3">
              <div className="flex items-start gap-2.5">
                <AlertCircle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                <div>
                  <div className="font-bold text-amber-300 uppercase tracking-wider text-[11px]">
                    Firebase Domain Authorization Required
                  </div>
                  <p className="text-[11px] text-zinc-300 mt-1 leading-relaxed">
                    Google OAuth blocked the sign-in popup because this cloud preview host is not in the Firebase Console authorized domains list for project <code className="text-[#00FF00] font-bold">algoarena-a1d34</code>.
                  </p>
                </div>
              </div>

              {/* Domain Copy Box */}
              <div className="bg-black/90 p-2.5 border border-white/10 flex items-center justify-between gap-2">
                <div className="flex items-center gap-1.5 min-w-0">
                  <Globe className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                  <span className="text-[11px] text-amber-200 font-mono truncate select-all">
                    {currentHostname}
                  </span>
                </div>
                <button
                  type="button"
                  onClick={handleCopyDomain}
                  className="px-2.5 py-1 bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/40 text-[10px] font-bold uppercase tracking-wider flex items-center gap-1.5 transition-colors shrink-0 cursor-pointer"
                >
                  {copiedDomain ? (
                    <>
                      <Check className="w-3 h-3 text-emerald-400" />
                      <span className="text-emerald-400">Copied!</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3 h-3" />
                      <span>Copy Hostname</span>
                    </>
                  )}
                </button>
              </div>

              {/* Step instructions */}
              <div className="text-[10px] text-zinc-400 space-y-1 bg-black/60 p-2.5 border border-white/5">
                <div className="font-bold text-zinc-300 uppercase flex items-center justify-between">
                  <span>To whitelist permanently in Firebase:</span>
                  <a 
                    href="https://console.firebase.google.com/project/algoarena-a1d34/authentication/settings" 
                    target="_blank" 
                    rel="noopener noreferrer" 
                    className="text-amber-400 hover:text-amber-300 underline flex items-center gap-1"
                  >
                    Console <ExternalLink className="w-2.5 h-2.5" />
                  </a>
                </div>
                <div className="text-zinc-400">1. Open Firebase Console → Authentication → Settings → Authorized domains.</div>
                <div className="text-zinc-400">2. Click "Add domain" and paste the copied hostname above.</div>
              </div>

              {/* Instant Play Bypass */}
              <div className="pt-1 flex flex-col sm:flex-row gap-2">
                <button
                  type="button"
                  onClick={handleInstantDemoProfile}
                  className="flex-1 py-2 px-3 bg-[#00FF00] hover:bg-[#00dd00] text-black font-black uppercase text-[10px] tracking-wider font-mono flex items-center justify-center gap-1.5 transition-all shadow-[0_0_12px_rgba(0,255,0,0.2)] cursor-pointer"
                >
                  <UserCheck className="w-3.5 h-3.5" />
                  <span>Instant Play as Swagata Ghosh</span>
                </button>

                <button
                  type="button"
                  onClick={handleInstantGuestDuelist}
                  className="py-2 px-3 bg-zinc-800 hover:bg-zinc-700 text-white border border-white/20 font-bold uppercase text-[10px] tracking-wider font-mono flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                >
                  <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                  <span>Guest Clearance</span>
                </button>
              </div>
            </div>
          )}

          {/* Quick Google Sign In */}
          <button
            type="button"
            onClick={handleGoogleSignIn}
            disabled={loading}
            className="w-full py-3 px-4 bg-white text-zinc-950 hover:bg-zinc-200 transition-all font-bold text-xs uppercase tracking-wider flex items-center justify-center gap-3 border border-white disabled:opacity-50 cursor-pointer"
          >
            <svg className="w-4 h-4" viewBox="0 0 24 24">
              <path
                fill="#4285F4"
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
              />
              <path
                fill="#34A853"
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
              />
              <path
                fill="#FBBC05"
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
              />
              <path
                fill="#EA4335"
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
              />
            </svg>
            <span>Continue with Google</span>
          </button>

          <div className="relative flex items-center justify-center my-3">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-white/10" />
            </div>
            <span className="relative px-3 bg-[#0a0a0a] text-[10px] font-mono uppercase text-zinc-500 font-bold">
              OR SECURE EMAIL KEY
            </span>
          </div>

          {/* Mode Switcher */}
          <div className="grid grid-cols-2 p-1 bg-black/60 border border-white/10">
            <button
              type="button"
              onClick={() => { setMode('signin'); setError(null); }}
              className={`py-2 text-[11px] font-mono uppercase font-bold transition-all ${
                mode === 'signin'
                  ? 'bg-[#00FF00]/20 text-[#00FF00] border border-[#00FF00]/40'
                  : 'text-zinc-500 hover:text-white'
              }`}
            >
              Sign In
            </button>
            <button
              type="button"
              onClick={() => { setMode('register'); setError(null); }}
              className={`py-2 text-[11px] font-mono uppercase font-bold transition-all ${
                mode === 'register'
                  ? 'bg-[#00FF00]/20 text-[#00FF00] border border-[#00FF00]/40'
                  : 'text-zinc-500 hover:text-white'
              }`}
            >
              Register
            </button>
          </div>

          <form onSubmit={handleEmailAuth} className="space-y-4">
            {mode === 'register' && (
              <div>
                <label className="block text-[10px] font-mono uppercase text-zinc-400 font-bold mb-1.5">
                  Full Name / Player Alias
                </label>
                <div className="relative">
                  <input
                    type="text"
                    value={displayName}
                    onChange={(e) => setDisplayName(e.target.value)}
                    placeholder="e.g. Swagata Ghosh"
                    className="w-full px-3 py-2.5 bg-black/60 border border-white/15 text-white font-mono text-xs focus:outline-none focus:border-[#00FF00] transition-colors"
                  />
                </div>
              </div>
            )}

            <div>
              <label className="block text-[10px] font-mono uppercase text-zinc-400 font-bold mb-1.5">
                Email Address
              </label>
              <div className="relative">
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="player@algoarena.com"
                  required
                  className="w-full px-3 py-2.5 bg-black/60 border border-white/15 text-white font-mono text-xs focus:outline-none focus:border-[#00FF00] transition-colors"
                />
              </div>
            </div>

            <div>
              <label className="block text-[10px] font-mono uppercase text-zinc-400 font-bold mb-1.5">
                Password
              </label>
              <div className="relative">
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                  className="w-full px-3 py-2.5 bg-black/60 border border-white/15 text-white font-mono text-xs focus:outline-none focus:border-[#00FF00] transition-colors"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 bg-[#00FF00] text-black font-black font-mono text-xs uppercase tracking-widest hover:bg-[#00dd00] transition-colors flex items-center justify-center gap-2 disabled:opacity-50 cursor-pointer"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>TRANSMITTING CREDENTIALS...</span>
                </>
              ) : mode === 'signin' ? (
                <>
                  <LogIn className="w-4 h-4" />
                  <span>AUTHENTICATE PLAYER</span>
                </>
              ) : (
                <>
                  <UserPlus className="w-4 h-4" />
                  <span>CREATE PROFILE & CONTINUE</span>
                </>
              )}
            </button>

            {/* Quick Guest Duelist Access */}
            <div className="pt-2 border-t border-white/10 flex items-center justify-between text-zinc-400 text-[11px] font-mono">
              <span className="text-zinc-500">Skip cloud sync?</span>
              <button
                type="button"
                onClick={handleInstantGuestDuelist}
                className="text-[#00FF00] hover:text-[#00dd00] hover:underline font-bold uppercase tracking-wider flex items-center gap-1 cursor-pointer"
              >
                <Zap className="w-3.5 h-3.5" />
                <span>Instant Guest Play</span>
              </button>
            </div>
          </form>
        </div>

        {/* Footer note */}
        <div className="p-4 border-t border-white/10 bg-black/40 text-[10px] font-mono text-zinc-500 flex items-center justify-between">
          <span>FIREBASE SECURE PROTOCOL // AUTH-V9</span>
          <span className="text-[#00FF00]">ENCRYPTED</span>
        </div>
      </motion.div>
    </div>
  );
}
