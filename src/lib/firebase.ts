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
  apiKey: "AIzaSyBARh-xubFf6gphvzkEdN0NafbBWWFATVA",
  authDomain: "algoarena-56cf3.firebaseapp.com",
  projectId: "algoarena-56cf3",
  storageBucket: "algoarena-56cf3.firebasestorage.app",
  messagingSenderId: "947638160148",
  appId: "1:947638160148:web:416c13f5c5b16715f8d001",
  measurementId: "G-997HESYB6M"
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
