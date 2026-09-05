import { create } from 'zustand';
import { User, RoomState } from './types';
import { v4 as uuidv4 } from 'uuid';

interface AppState {
  currentUser: Pick<User, 'id' | 'name'>;
  setCurrentUser: (name: string) => void;
}

// Generate a random username if not set
const generateName = () => {
  const adjs = ['Cyber', 'Neon', 'Quantum', 'Pixel', 'Synth'];
  const nouns = ['Ninja', 'Hacker', 'Coder', 'Runner', 'Ghost'];
  return `${adjs[Math.floor(Math.random() * adjs.length)]} ${nouns[Math.floor(Math.random() * nouns.length)]}`;
};

export const useStore = create<AppState>((set) => ({
  currentUser: {
    id: uuidv4(),
    name: generateName(),
  },
  setCurrentUser: (name) => set((state) => ({ currentUser: { ...state.currentUser, name } })),
}));
