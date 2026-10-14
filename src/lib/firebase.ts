import { initializeApp, getApps, getApp, FirebaseApp } from 'firebase/app';
import { getAuth, Auth } from 'firebase/auth';
import { getFirestore, Firestore } from 'firebase/firestore';

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyAlq6nIQl4lIAgIsGTQWlQWwYV2rzJtKss",
  authDomain: "presupuestos-3ce7c.firebaseapp.com",
  projectId: "presupuestos-3ce7c",
  storageBucket: "presupuestos-3ce7c.firebasestorage.app",
  messagingSenderId: "901000150591",
  appId: "1:901000150591:web:7cb5761a904794b8d2028a"
};

// Initialize Firebase instance with safeguard for re-initialization
export const app: FirebaseApp = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();

// Export Firebase Authentication instance
export const auth: Auth = getAuth(app);

// Export Cloud Firestore instance
export const db: Firestore = getFirestore(app);

export default app;
