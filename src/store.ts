import { create } from 'zustand';
import { User, UserProfileData } from './types';
import { v4 as uuidv4 } from 'uuid';
import { apiUrl } from './api';

export interface UserAccountProfile {
  uid: string;
  name: string;
  username: string;
  email: string;
  nationality: string;
  region: string;
  photoURL?: string;
  isSetupComplete: boolean;
}

interface AppState {
  currentUser: Pick<User, 'id' | 'name'>;
  accountProfile: UserAccountProfile | null;
  isAuthModalOpen: boolean;
  isProfileSetupOpen: boolean;
  authLoading: boolean;
  
  setCurrentUser: (name: string) => void;
  setAccountProfile: (profile: Partial<UserAccountProfile> | null) => void;
  setAuthModalOpen: (open: boolean) => void;
  setProfileSetupOpen: (open: boolean) => void;
  setAuthLoading: (loading: boolean) => void;
  saveProfileAndSync: (data: Partial<UserAccountProfile>) => Promise<void>;
  logout: () => void;
}

const STORAGE_PROFILE_KEY = 'algoarena_account_profile';

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
    
    return {
      id,
      name: savedName || 'swagatag275',
    };
  } catch {
    return {
      id: uuidv4(),
      name: 'swagatag275',
    };
  }
};

export const useStore = create<AppState>((set, get) => ({
  currentUser: getStoredUser(),
  accountProfile: loadStoredProfile(),
  isAuthModalOpen: false,
  isProfileSetupOpen: false,
  authLoading: true,

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

    const fullProfile: UserAccountProfile = {
      ...current,
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
      localStorage.removeItem(STORAGE_PROFILE_KEY);
      localStorage.removeItem('algoarena_username');
    } catch {}
    set({
      accountProfile: null,
      currentUser: {
        id: uuidv4(),
        name: 'Guest',
      },
      isProfileSetupOpen: false,
    });
  },
}));

