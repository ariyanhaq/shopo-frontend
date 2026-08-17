/**
 * @file firebase.config.js
 * @description Firebase configuration and service initialization for Shopo app.
 * Configured with localStorage persistence to prevent IndexedDB "Database is closing/hidden" errors.
 */
import { initializeApp, getApps, getApp } from 'firebase/app';
import {
  initializeAuth,
  browserLocalPersistence,
  browserPopupRedirectResolver,
  getAuth,
  GoogleAuthProvider
} from 'firebase/auth';

export const firebaseConfig = {
  apiKey: import.meta?.env?.VITE_FIREBASE_API_KEY || "AIzaSyDZey6-KVFO6hrV8DXIh9tC-iYuCbkMoEA",
  authDomain: import.meta?.env?.VITE_FIREBASE_AUTH_DOMAIN || "shopo-f15af.firebaseapp.com",
  projectId: import.meta?.env?.VITE_FIREBASE_PROJECT_ID || "shopo-f15af",
  storageBucket: import.meta?.env?.VITE_FIREBASE_STORAGE_BUCKET || "shopo-f15af.firebasestorage.app",
  messagingSenderId: import.meta?.env?.VITE_FIREBASE_MESSAGING_SENDER_ID || "1066778958305",
  appId: import.meta?.env?.VITE_FIREBASE_APP_ID || "1:1066778958305:web:27b655251d3c9fff5cdaa0"
};

export const isFirebaseConfigured = Boolean(
  firebaseConfig.apiKey &&
  firebaseConfig.projectId
);

// Initialize Firebase App singleton
export const app = getApps().length > 0
  ? getApp()
  : initializeApp(firebaseConfig);

// Initialize Firebase Auth with localStorage persistence
// Using browserLocalPersistence avoids IndexedDB lifecycle closures completely.
let authInstance;
try {
  authInstance = initializeAuth(app, {
    persistence: browserLocalPersistence,
    popupRedirectResolver: browserPopupRedirectResolver,
  });
} catch (err) {
  // If already initialized by HMR or concurrent module load
  authInstance = getAuth(app);
}

export const auth = authInstance;

// Initialize Google Auth Provider
export const googleProvider = new GoogleAuthProvider();
googleProvider.setCustomParameters({ prompt: 'select_account' });

export default firebaseConfig;
