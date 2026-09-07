import { useState } from 'react';
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
  Zap
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

  if (!isAuthModalOpen) return null;

  const handleGoogleSignIn = async () => {
    setError(null);
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
      console.error('Google Sign In error:', err);
      if (err.code === 'auth/popup-closed-by-user') {
        setError('Google sign-in popup was cancelled.');
      } else if (err.code === 'auth/popup-blocked') {
        setError('Popup was blocked by browser. Please allow popups or use email sign-in.');
      } else {
        setError(err.message || 'Failed to authenticate via Google.');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleEmailAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

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
      console.error('Email Auth error:', err);
      if (err.code === 'auth/invalid-credential' || err.code === 'auth/wrong-password' || err.code === 'auth/user-not-found') {
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
                ALGOARENA // AUTH MATRIX
              </h2>
              <p className="text-[10px] text-zinc-400 font-mono">
                {mode === 'signin' ? 'Verify security clearance' : 'Initialize operator account'}
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
                Authenticate with Google or Email to verify credentials for this 1v1 duel.
              </div>
            </div>
          </div>
        )}

        <div className="p-6 space-y-5">
          {error && (
            <div className="p-3 bg-red-950/40 border border-red-500/50 text-red-300 text-xs flex items-start gap-2 font-mono">
              <AlertCircle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          {/* Quick Google Sign In */}
          <button
            type="button"
            onClick={handleGoogleSignIn}
            disabled={loading}
            className="w-full py-3 px-4 bg-white text-zinc-950 hover:bg-zinc-200 transition-all font-bold text-xs uppercase tracking-wider flex items-center justify-center gap-3 border border-white disabled:opacity-50"
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

          <div className="relative flex items-center justify-center my-4">
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
                  Full Name / Operator Alias
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
                  placeholder="operator@algoarena.com"
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
              className="w-full py-3 bg-[#00FF00] text-black font-black font-mono text-xs uppercase tracking-widest hover:bg-[#00dd00] transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>TRANSMITTING CREDENTIALS...</span>
                </>
              ) : mode === 'signin' ? (
                <>
                  <LogIn className="w-4 h-4" />
                  <span>AUTHENTICATE OPERATOR</span>
                </>
              ) : (
                <>
                  <UserPlus className="w-4 h-4" />
                  <span>CREATE PROFILE & CONTINUE</span>
                </>
              )}
            </button>
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
