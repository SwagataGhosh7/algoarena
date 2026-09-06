import { initializeApp, getApps, getApp } from 'firebase/app';
import { getAnalytics, isSupported } from 'firebase/analytics';
import { 
  getAuth, 
  GoogleAuthProvider, 
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
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || "AIzaSyBARh-xubFf6gphvzkEdN0NafbBWWFATVA",
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || "algoarena-56cf3.firebaseapp.com",
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || "algoarena-56cf3",
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || "algoarena-56cf3.firebasestorage.app",
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || "947638160148",
  appId: import.meta.env.VITE_FIREBASE_APP_ID || "1:947638160148:web:416c13f5c5b16715f8d001",
  measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID || "G-997HESYB6M"
};

// Initialize Firebase
export const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();
export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();
googleProvider.setCustomParameters({ prompt: 'select_account' });

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
