import { useState, useEffect, useRef } from 'react';
import { 
  User, 
  AtSign, 
  Mail, 
  Globe2, 
  MapPin, 
  Camera, 
  Sparkles, 
  Check, 
  AlertCircle, 
  Loader2,
  X,
  Upload,
  Image as ImageIcon
} from 'lucide-react';
import { motion } from 'motion/react';
import { useStore } from '../store';

const COUNTRIES = [
  { code: 'US', name: 'United States', flag: '🇺🇸' },
  { code: 'IN', name: 'India', flag: '🇮🇳' },
  { code: 'GB', name: 'United Kingdom', flag: '🇬🇧' },
  { code: 'CA', name: 'Canada', flag: '🇨🇦' },
  { code: 'DE', name: 'Germany', flag: '🇩🇪' },
  { code: 'JP', name: 'Japan', flag: '🇯🇵' },
  { code: 'KR', name: 'South Korea', flag: '🇰🇷' },
  { code: 'FR', name: 'France', flag: '🇫🇷' },
  { code: 'BR', name: 'Brazil', flag: '🇧🇷' },
  { code: 'AU', name: 'Australia', flag: '🇦🇺' },
  { code: 'SG', name: 'Singapore', flag: '🇸🇬' },
  { code: 'NL', name: 'Netherlands', flag: '🇳🇱' },
  { code: 'SE', name: 'Sweden', flag: '🇸🇪' },
  { code: 'CH', name: 'Switzerland', flag: '🇨🇭' },
  { code: 'PL', name: 'Poland', flag: '🇵🇱' },
  { code: 'UA', name: 'Ukraine', flag: '🇺🇦' },
  { code: 'VN', name: 'Vietnam', flag: '🇻🇳' },
  { code: 'NG', name: 'Nigeria', flag: '🇳🇬' },
  { code: 'EG', name: 'Egypt', flag: '🇪🇬' },
  { code: 'ID', name: 'Indonesia', flag: '🇮🇩' },
];

const REGIONS = [
  { id: 'Asia', label: 'Asia' },
  { id: 'Europe', label: 'Europe' },
  { id: 'North America', label: 'North America' },
  { id: 'South America', label: 'South America' },
  { id: 'Middle East & Africa', label: 'Middle East & Africa' },
  { id: 'Oceania', label: 'Oceania' },
];

export function ProfileSetupModal() {
  const { 
    isProfileSetupOpen, 
    setProfileSetupOpen, 
    accountProfile, 
    saveProfileAndSync 
  } = useStore();

  const [name, setName] = useState('');
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [nationality, setNationality] = useState('United States');
  const [region, setRegion] = useState('North America');
  const [photoURL, setPhotoURL] = useState('');
  const [previewURL, setPreviewURL] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (accountProfile) {
      setName(accountProfile.name || '');
      setUsername(accountProfile.username || '');
      setEmail(accountProfile.email || '');
      setNationality(accountProfile.nationality || 'United States');
      setRegion(accountProfile.region || 'North America');
      setPhotoURL(accountProfile.photoURL || '');
      setPreviewURL(accountProfile.photoURL || '');
    }
  }, [accountProfile, isProfileSetupOpen]);

  if (!isProfileSetupOpen) return null;

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 2 * 1024 * 1024) {
      setError('Image file size must be under 2MB.');
      return;
    }

    const reader = new FileReader();
    reader.onloadend = () => {
      const base64 = reader.result as string;
      setPreviewURL(base64);
      setPhotoURL(base64);
    };
    reader.readAsDataURL(file);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const cleanName = name.trim();
    const cleanUsername = username.trim().toLowerCase().replace(/[^a-z0-9_]/g, '');

    if (!cleanName) {
      setError('Please provide your operator full name or alias.');
      return;
    }

    if (!cleanUsername || cleanUsername.length < 3) {
      setError('Username must be at least 3 characters (letters, numbers, underscores).');
      return;
    }

    if (!nationality) {
      setError('Please select your nationality.');
      return;
    }

    if (!region) {
      setError('Please select your competition region.');
      return;
    }

    setSaving(true);
    try {
      await saveProfileAndSync({
        name: cleanName,
        username: cleanUsername,
        email: email.trim(),
        nationality,
        region,
        photoURL: photoURL || previewURL || '',
      });
      setProfileSetupOpen(false);
    } catch (err: any) {
      console.error('Failed to save profile setup:', err);
      setError(err.message || 'Failed to save profile. Please retry.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md overflow-y-auto">
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 15 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 15 }}
        className="relative w-full max-w-lg bg-[#0a0a0a] border border-[#00FF00]/50 shadow-[0_0_50px_rgba(0,255,0,0.2)] text-left my-8"
      >
        {/* Top green accent */}
        <div className="h-1 bg-gradient-to-r from-[#00FF00] via-[#39ff14] to-[#00FF00]" />

        {/* Modal Header */}
        <div className="flex items-center justify-between p-5 border-b border-white/10 bg-zinc-950/80">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 border border-[#00FF00]/40 bg-[#00FF00]/10 flex items-center justify-center text-[#00FF00]">
              <User className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-sm font-black text-white uppercase tracking-wider font-mono flex items-center gap-2">
                PROFILE INITIALIZATION PROTOCOL
              </h2>
              <p className="text-[10px] text-zinc-400 font-mono">
                Configure competitive identity & global region
              </p>
            </div>
          </div>
          {accountProfile?.isSetupComplete && (
            <button
              onClick={() => setProfileSetupOpen(false)}
              className="p-1.5 text-zinc-400 hover:text-white hover:bg-white/10 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Form Content */}
        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          {error && (
            <div className="p-3 bg-red-950/40 border border-red-500/50 text-red-300 text-xs flex items-start gap-2 font-mono">
              <AlertCircle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          {/* Profile Picture (Optional) */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-[10px] font-mono uppercase text-zinc-300 font-bold flex items-center gap-1.5">
                <Camera className="w-3.5 h-3.5 text-[#00FF00]" />
                Profile Picture
              </label>
            </div>

            <div className="flex items-center gap-4 p-3 bg-black/60 border border-white/10">
              <div className="relative w-16 h-16 rounded-none border border-[#00FF00]/40 bg-zinc-900 overflow-hidden shrink-0 flex items-center justify-center">
                {previewURL ? (
                  <img
                    src={previewURL}
                    alt="Avatar Preview"
                    referrerPolicy="no-referrer"
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <User className="w-8 h-8 text-zinc-600" />
                )}
              </div>

              <div className="flex-1 space-y-2">
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleFileUpload}
                  accept="image/*"
                  className="hidden"
                />
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="px-3 py-1.5 bg-white/5 hover:bg-white/15 border border-white/20 text-white font-mono text-[11px] font-bold flex items-center gap-1.5 transition-colors"
                  >
                    <Upload className="w-3 h-3 text-[#00FF00]" />
                    Upload Image
                  </button>
                  {previewURL && (
                    <button
                      type="button"
                      onClick={() => { setPreviewURL(''); setPhotoURL(''); }}
                      className="px-2 py-1.5 text-zinc-500 hover:text-red-400 text-[10px] font-mono transition-colors"
                    >
                      Remove
                    </button>
                  )}
                </div>

              </div>
            </div>
          </div>

          {/* Name & Username Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-[10px] font-mono uppercase text-zinc-400 font-bold mb-1.5">
                Full Name <span className="text-[#00FF00]">*</span>
              </label>
              <div className="relative">
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Swagata Ghosh"
                  required
                  className="w-full px-3 py-2 bg-black/60 border border-white/15 text-white font-mono text-xs focus:outline-none focus:border-[#00FF00] transition-colors"
                />
              </div>
            </div>

            <div>
              <label className="block text-[10px] font-mono uppercase text-zinc-400 font-bold mb-1.5">
                Competitive Username <span className="text-[#00FF00]">*</span>
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-2.5 flex items-center pointer-events-none text-zinc-500 text-xs">
                  @
                </div>
                <input
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, ''))}
                  placeholder="swagatag275"
                  required
                  className="w-full pl-7 pr-3 py-2 bg-black/60 border border-white/15 text-white font-mono text-xs focus:outline-none focus:border-[#00FF00] transition-colors"
                />
              </div>
            </div>
          </div>

          {/* Email Address */}
          <div>
            <label className="block text-[10px] font-mono uppercase text-zinc-400 font-bold mb-1.5">
              Account Email <span className="text-[#00FF00]">*</span>
            </label>
            <div className="relative">
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="operator@algoarena.com"
                required
                className="w-full px-3 py-2 bg-black/60 border border-white/15 text-white font-mono text-xs focus:outline-none focus:border-[#00FF00] transition-colors"
              />
            </div>
          </div>

          {/* Nationality & Region */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-[10px] font-mono uppercase text-zinc-400 font-bold mb-1.5 flex items-center gap-1">
                <Globe2 className="w-3.5 h-3.5 text-[#00FF00]" />
                Nationality <span className="text-[#00FF00]">*</span>
              </label>
              <select
                value={nationality}
                onChange={(e) => setNationality(e.target.value)}
                className="w-full px-3 py-2 bg-black/80 border border-white/15 text-white font-mono text-xs focus:outline-none focus:border-[#00FF00] transition-colors cursor-pointer"
              >
                {COUNTRIES.map((c) => (
                  <option key={c.code} value={c.name} className="bg-zinc-950 text-white">
                    {c.flag} {c.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-[10px] font-mono uppercase text-zinc-400 font-bold mb-1.5 flex items-center gap-1">
                <MapPin className="w-3.5 h-3.5 text-[#00FF00]" />
                Region <span className="text-[#00FF00]">*</span>
              </label>
              <select
                value={region}
                onChange={(e) => setRegion(e.target.value)}
                className="w-full px-3 py-2 bg-black/80 border border-white/15 text-white font-mono text-xs focus:outline-none focus:border-[#00FF00] transition-colors cursor-pointer"
              >
                {REGIONS.map((r) => (
                  <option key={r.id} value={r.id} className="bg-zinc-950 text-white">
                    {r.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Action buttons */}
          <div className="pt-2">
            <button
              type="submit"
              disabled={saving}
              className="w-full py-3 bg-[#00FF00] text-black font-black font-mono text-xs uppercase tracking-widest hover:bg-[#00dd00] transition-colors flex items-center justify-center gap-2 disabled:opacity-50 shadow-[0_0_20px_rgba(0,255,0,0.3)]"
            >
              {saving ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>INITIALIZING OPERATOR PROFILE...</span>
                </>
              ) : (
                <>
                  <Check className="w-4 h-4 stroke-[3]" />
                  <span>CONFIRM PROFILE & ENTER ARENA</span>
                </>
              )}
            </button>
          </div>
        </form>
      </motion.div>
    </div>
  );
}
