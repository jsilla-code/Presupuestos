import { initializeApp, getApps, getApp, FirebaseApp } from 'firebase/app';
import { getAuth, Auth, browserLocalPersistence, setPersistence } from 'firebase/auth';
import { getFirestore, Firestore } from 'firebase/firestore';

// Your web app's Firebase configuration with env var fallback support
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || "AIzaSyAlq6nIQl4lIAgIsGTQWlQWwYV2rzJtKss",
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || "presupuestos-3ce7c.firebaseapp.com",
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || "presupuestos-3ce7c",
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || "presupuestos-3ce7c.firebasestorage.app",
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || "901000150591",
  appId: import.meta.env.VITE_FIREBASE_APP_ID || "1:901000150591:web:7cb5761a904794b8d2028a"
};

// Initialize Firebase instance with safeguard for re-initialization
export const app: FirebaseApp = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();

// Export Firebase Authentication instance
export const auth: Auth = getAuth(app);

// Use device language for localized auth dialogs
auth.useDeviceLanguage();

// Ensure local persistence for cross-session longevity
setPersistence(auth, browserLocalPersistence).catch((err) => {
  console.warn('[PresuFollow Auth] Advertencia al configurar persistencia local:', err);
});

// Export Cloud Firestore instance
export const db: Firestore = getFirestore(app);

export default app;
