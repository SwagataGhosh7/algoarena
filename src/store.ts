import { create } from 'zustand';
import { User, UserProfileData } from './types';
import { v4 as uuidv4 } from 'uuid';
import { apiUrl } from './api';
import { auth, onAuthStateChanged, signOut, type FirebaseUser } from './lib/firebase';

export interface UserAccountProfile {
  uid: string;
  name: string;
  username: string;
  email: string;
  nationality: string;
  region: string;
  photoURL?: string;
  neonPalette?: string;
  isSetupComplete: boolean;
}

interface AppState {
  currentUser: Pick<User, 'id' | 'name'>;
  accountProfile: UserAccountProfile | null;
  firebaseUser: FirebaseUser | null;
  pendingRoomId: string | null;
  isAuthModalOpen: boolean;
  isProfileSetupOpen: boolean;
  authLoading: boolean;
  activeLobbyCount: number;
  lobbySoundEnabled: boolean;
  chatDraftText: string;
  isFriendsModalOpen: boolean;
  isLobbyChatOpen: boolean;
  activePrivateChatUser: string | null;
  inspectedUserForDetails: string | null;
  
  setCurrentUser: (name: string) => void;
  setPendingRoomId: (roomId: string | null) => void;
  setAccountProfile: (profile: Partial<UserAccountProfile> | null) => void;
  setAuthModalOpen: (open: boolean) => void;
  setProfileSetupOpen: (open: boolean) => void;
  setAuthLoading: (loading: boolean) => void;
  setActiveLobbyCount: (count: number) => void;
  setLobbySoundEnabled: (enabled: boolean) => void;
  setChatDraftText: (draft: string) => void;
  setFriendsModalOpen: (open: boolean) => void;
  setLobbyChatOpen: (open: boolean) => void;
  setActivePrivateChatUser: (user: string | null) => void;
  openPrivateChatWithUser: (username: string) => void;
  setInspectedUserForDetails: (username: string | null) => void;
  saveProfileAndSync: (data: Partial<UserAccountProfile>) => Promise<void>;
  logout: () => void;
}

const STORAGE_PROFILE_KEY = 'algoarena_account_profile';
const STORAGE_PENDING_ROOM_KEY = 'algoarena_pending_room';
const STORAGE_LOBBY_COUNT_KEY = 'algoarena_lobby_active_count';
const STORAGE_LOBBY_SOUND_KEY = 'algoarena_lobby_sound_enabled';
const STORAGE_CHAT_DRAFT_KEY = 'algoarena_lobby_chat_draft';

const loadStoredProfile = (): UserAccountProfile | null => {
  try {
    const raw = localStorage.getItem(STORAGE_PROFILE_KEY);
    if (raw) {
      return JSON.parse(raw);
    }
  } catch (e) {
    console.error('Failed to parse account profile from storage', e);
  }
  return null;
};

const loadStoredLobbyCount = (): number => {
  try {
    const raw = localStorage.getItem(STORAGE_LOBBY_COUNT_KEY);
    if (raw) {
      const parsed = parseInt(raw, 10);
      if (!isNaN(parsed) && parsed >= 1) return parsed;
    }
  } catch {}
  return 1;
};

const loadStoredLobbySound = (): boolean => {
  try {
    const raw = localStorage.getItem(STORAGE_LOBBY_SOUND_KEY);
    if (raw !== null) {
      return raw === 'true';
    }
  } catch {}
  return true;
};

const loadStoredChatDraft = (): string => {
  try {
    return localStorage.getItem(STORAGE_CHAT_DRAFT_KEY) || '';
  } catch {}
  return '';
};

const getStoredUser = () => {
  try {
    const storedProfile = loadStoredProfile();
    if (storedProfile?.username) {
      return {
        id: storedProfile.uid || uuidv4(),
        name: storedProfile.username,
      };
    }

    const savedName = localStorage.getItem('algoarena_username');
    const savedId = localStorage.getItem('algoarena_userid');
    const id = savedId || uuidv4();
    if (!savedId) localStorage.setItem('algoarena_userid', id);
    const defaultName = savedName || `Duelist_${id.substring(0, 4)}`;
    if (!savedName) localStorage.setItem('algoarena_username', defaultName);
    
    return {
      id,
      name: defaultName,
    };
  } catch {
    const fallbackId = uuidv4();
    return {
      id: fallbackId,
      name: `Duelist_${fallbackId.substring(0, 4)}`,
    };
  }
};

const getInitialPendingRoom = (): string | null => {
  try {
    // Check URL parameters first (?join=... or /room/...)
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      const joinParam = params.get('join') || params.get('room');
      if (joinParam) return joinParam;
      
      const match = window.location.pathname.match(/\/(?:room|arena)\/([^/?#]+)/);
      if (match && match[1]) return match[1];

      return localStorage.getItem(STORAGE_PENDING_ROOM_KEY);
    }
  } catch {}
  return null;
};

export const useStore = create<AppState>((set, get) => ({
  currentUser: getStoredUser(),
  accountProfile: loadStoredProfile(),
  firebaseUser: null,
  pendingRoomId: getInitialPendingRoom(),
  isAuthModalOpen: false,
  isProfileSetupOpen: false,
  authLoading: true,
  activeLobbyCount: loadStoredLobbyCount(),
  lobbySoundEnabled: loadStoredLobbySound(),
  chatDraftText: loadStoredChatDraft(),
  isFriendsModalOpen: false,
  isLobbyChatOpen: false,
  activePrivateChatUser: null,
  inspectedUserForDetails: null,

  setFriendsModalOpen: (open: boolean) => set({ isFriendsModalOpen: open }),
  setLobbyChatOpen: (open: boolean) => set({ isLobbyChatOpen: open }),
  setActivePrivateChatUser: (user: string | null) => set({ activePrivateChatUser: user }),
  openPrivateChatWithUser: (username: string) => {
    set({ 
      activePrivateChatUser: username,
      isLobbyChatOpen: true 
    });
  },
  setInspectedUserForDetails: (username: string | null) => set({ inspectedUserForDetails: username }),

  setActiveLobbyCount: (count: number) => {
    try {
      localStorage.setItem(STORAGE_LOBBY_COUNT_KEY, String(count));
    } catch {}
    set({ activeLobbyCount: count });
  },

  setLobbySoundEnabled: (enabled: boolean) => {
    try {
      localStorage.setItem(STORAGE_LOBBY_SOUND_KEY, String(enabled));
    } catch {}
    set({ lobbySoundEnabled: enabled });
  },

  setChatDraftText: (draft: string) => {
    try {
      if (draft) {
        localStorage.setItem(STORAGE_CHAT_DRAFT_KEY, draft);
      } else {
        localStorage.removeItem(STORAGE_CHAT_DRAFT_KEY);
      }
    } catch {}
    set({ chatDraftText: draft });
  },

  setPendingRoomId: (roomId: string | null) => {
    try {
      if (roomId) {
        localStorage.setItem(STORAGE_PENDING_ROOM_KEY, roomId);
      } else {
        localStorage.removeItem(STORAGE_PENDING_ROOM_KEY);
      }
    } catch {}
    set({ pendingRoomId: roomId });
  },

  setCurrentUser: (name: string) => {
    try {
      localStorage.setItem('algoarena_username', name);
    } catch {
      // ignore
    }
    set((state) => ({ currentUser: { ...state.currentUser, name } }));
  },

  setAccountProfile: (profile) => {
    if (profile === null) {
      try {
        localStorage.removeItem(STORAGE_PROFILE_KEY);
      } catch {}
      set({ accountProfile: null });
      return;
    }

    const current = get().accountProfile || {
      uid: uuidv4(),
      name: '',
      username: '',
      email: '',
      nationality: 'United States',
      region: 'North America',
      photoURL: '',
      isSetupComplete: false,
    };

    const updated: UserAccountProfile = {
      ...current,
      ...profile,
    };

    try {
      localStorage.setItem(STORAGE_PROFILE_KEY, JSON.stringify(updated));
      if (updated.username) {
        localStorage.setItem('algoarena_username', updated.username);
      }
    } catch {}

    set({ 
      accountProfile: updated,
      currentUser: {
        id: updated.uid,
        name: updated.username || updated.name || 'Operator',
      }
    });
  },

  setAuthModalOpen: (open: boolean) => set({ isAuthModalOpen: open }),
  setProfileSetupOpen: (open: boolean) => set({ isProfileSetupOpen: open }),
  setAuthLoading: (loading: boolean) => set({ authLoading: loading }),

  saveProfileAndSync: async (data: Partial<UserAccountProfile>) => {
    const current = get().accountProfile;
    const fbUser = get().firebaseUser || auth.currentUser;
    const resolvedUid = current?.uid || fbUser?.uid;

    if (!resolvedUid) {
      throw new Error('Firebase authentication required before initializing profile.');
    }

    const fullProfile: UserAccountProfile = {
      uid: resolvedUid,
      name: current?.name || fbUser?.displayName || data.name || '',
      username: data.username || current?.username || '',
      email: current?.email || fbUser?.email || data.email || '',
      nationality: data.nationality || current?.nationality || 'United States',
      region: data.region || current?.region || 'North America',
      photoURL: data.photoURL || current?.photoURL || fbUser?.photoURL || '',
      ...data,
      isSetupComplete: true,
    };

    try {
      localStorage.setItem(STORAGE_PROFILE_KEY, JSON.stringify(fullProfile));
      localStorage.setItem('algoarena_username', fullProfile.username);
    } catch {}

    set({
      accountProfile: fullProfile,
      currentUser: {
        id: fullProfile.uid,
        name: fullProfile.username,
      },
      isProfileSetupOpen: false,
    });

    // Sync with backend API
    try {
      await fetch(apiUrl('/api/user-profile/save'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(fullProfile),
      });
    } catch (e) {
      console.warn('Backend profile sync failed:', e);
    }
  },

  logout: () => {
    try {
      signOut(auth).catch(() => {});
      localStorage.removeItem(STORAGE_PROFILE_KEY);
      localStorage.removeItem('algoarena_username');
    } catch {}
    set({
      firebaseUser: null,
      accountProfile: null,
      currentUser: {
        id: uuidv4(),
        name: 'Guest',
      },
      isProfileSetupOpen: false,
    });
  },
}));

// Initialize Firebase auth observer
if (typeof window !== 'undefined') {
  onAuthStateChanged(auth, (fbUser) => {
    if (fbUser) {
      const stored = loadStoredProfile();
      if (stored && stored.uid === fbUser.uid && stored.isSetupComplete) {
        useStore.setState({
          firebaseUser: fbUser,
          accountProfile: stored,
          currentUser: {
            id: fbUser.uid,
            name: stored.username || stored.name || fbUser.displayName || 'Duelist',
          },
          authLoading: false,
        });
      } else {
        const generatedUsername = fbUser.displayName?.toLowerCase().replace(/[^a-z0-9_]/g, '') || fbUser.email?.split('@')[0] || `duelist_${fbUser.uid.slice(0, 5)}`;
        const partialProfile: UserAccountProfile = {
          uid: fbUser.uid,
          name: fbUser.displayName || fbUser.email?.split('@')[0] || 'Duelist',
          username: stored?.username || generatedUsername,
          email: fbUser.email || '',
          nationality: stored?.nationality || '',
          region: stored?.region || '',
          photoURL: fbUser.photoURL || stored?.photoURL || '',
          isSetupComplete: Boolean(stored?.isSetupComplete && stored?.nationality && stored?.region),
        };
        useStore.setState({
          firebaseUser: fbUser,
          accountProfile: partialProfile,
          currentUser: {
            id: fbUser.uid,
            name: partialProfile.username,
          },
          authLoading: false,
        });
      }
    } else {
      useStore.setState({
        firebaseUser: null,
        accountProfile: null,
        currentUser: {
          id: uuidv4(),
          name: 'Guest',
        },
        authLoading: false,
      });
    }
  });
}

