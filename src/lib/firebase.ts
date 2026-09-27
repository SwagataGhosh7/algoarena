import { initializeApp, getApps, getApp } from 'firebase/app';
import { getAnalytics, isSupported } from 'firebase/analytics';
import { 
  getAuth, 
  GoogleAuthProvider, 
  GithubAuthProvider,
  signInWithPopup, 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword, 
  updateProfile,
  signOut, 
  onAuthStateChanged,
  type User as FirebaseUser
} from 'firebase/auth';

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || "AIzaSyAyXtH6siATqvJbPD_ECr__WqZiZBHTPMs",
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || "algoarena-a1d34.firebaseapp.com",
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || "algoarena-a1d34",
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || "algoarena-a1d34.firebasestorage.app",
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || "441078263666",
  appId: import.meta.env.VITE_FIREBASE_APP_ID || "1:441078263666:web:96a9742d27d9b55a03b7eb",
  measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID || "G-YDXFCV1Z4M"
};

// Initialize Firebase
export const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();
export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();
googleProvider.setCustomParameters({ prompt: 'select_account' });

export const githubProvider = new GithubAuthProvider();
githubProvider.addScope('read:user');
githubProvider.addScope('user:email');

// Initialize Analytics if supported in browser environment
if (typeof window !== 'undefined') {
  isSupported().then((supported) => {
    if (supported) {
      try {
        getAnalytics(app);
      } catch (err) {
        // Analytics non-blocking
      }
    }
  }).catch(() => {});
}

export {
  signInWithPopup,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  updateProfile,
  signOut,
  onAuthStateChanged,
  type FirebaseUser
};
