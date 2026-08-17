/**
 * @file AuthContext.jsx
 * @description Context API provider for Firebase Authentication state, login, registration, and user session management.
 */
import { createContext, useContext, useState, useEffect } from 'react';
import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signInWithPopup,
  signOut,
  sendPasswordResetEmail,
  updateProfile,
  onAuthStateChanged,
} from 'firebase/auth';
import { auth, googleProvider, isFirebaseConfigured } from '@/firebase.config';
import api from '@/services/api';

export const AuthContext = createContext(null);

export function getAuthErrorMessage(error, lang = 'en') {
  if (!error) return '';
  const code = error.code || '';

  const messages = {
    'auth/invalid-credential': {
      en: 'Incorrect email or password. Please try again.',
      bn: 'ভুল ইমেইল অথবা পাসওয়ার্ড। আবার চেষ্টা করুন।',
    },
    'auth/user-not-found': {
      en: 'No account found with this email address.',
      bn: 'এই ইমেইল দিয়ে কোনো অ্যাকাউন্ট খুঁজে পাওয়া যায়নি।',
    },
    'auth/wrong-password': {
      en: 'Incorrect password. Please try again.',
      bn: 'পাসওয়ার্ড সঠিক নয়। আবার চেষ্টা করুন।',
    },
    'auth/email-already-in-use': {
      en: 'This email is already registered. Please login instead.',
      bn: 'এই ইমেইলটি ইতিমধ্যে নিবন্ধিত রয়েছে। অনুগ্রহ করে লগইন করুন।',
    },
    'auth/weak-password': {
      en: 'Password should be at least 6 characters long.',
      bn: 'পাসওয়ার্ড কমপক্ষে ৬ অক্ষরের হতে হবে।',
    },
    'auth/invalid-email': {
      en: 'Please provide a valid email address.',
      bn: 'অনুগ্রহ করে একটি সঠিক ইমেইল ঠিকানা প্রদান করুন।',
    },
    'auth/popup-closed-by-user': {
      en: 'Google sign-in popup was closed before completion.',
      bn: 'সাইন-ইন সম্পন্ন হওয়ার আগেই পপআপ উইন্ডো বন্ধ করা হয়েছে।',
    },
    'auth/popup-blocked': {
      en: 'Popup was blocked by your browser. Please allow popups for this site.',
      bn: 'ব্রাউজার পপআপ ব্লক করেছে। অনুগ্রহ করে পপআপ অনুমোদন করুন।',
    },
    'auth/network-request-failed': {
      en: 'Network error. Please check your internet connection.',
      bn: 'নেটওয়ার্ক সমস্যা। আপনার ইন্টারনেট সংযোগ পরীক্ষা করুন।',
    },
    'auth/configuration-not-found': {
      en: 'Firebase Authentication is not activated in your project yet. Please go to Firebase Console > Authentication > Click "Get Started" and enable Email/Password & Google.',
      bn: 'ফায়ারবেস কনসোলে অথেনটিকেশন সক্রিয় করা হয়নি। Firebase Console > Authentication এ গিয়ে "Get Started" এ ক্লিক করে Email/Password ও Google সক্রিয় করুন।',
    },
    'auth/operation-not-allowed': {
      en: 'This sign-in method is disabled in your Firebase project. Please enable Email/Password and Google in Firebase Console > Authentication > Sign-in method.',
      bn: 'এই সাইন-ইন পদ্ধতি ফায়ারবেস কনসোলে বন্ধ আছে। Firebase Console > Authentication > Sign-in method থেকে Email/Password এবং Google সক্রিয় করুন।',
    },
    'auth/unauthorized-domain': {
      en: 'This domain (localhost) is not authorized in Firebase Console > Authentication > Settings > Authorized domains.',
      bn: 'এই ডোমেইনটি (localhost) ফায়ারবেস কনসোলে অনুমোদিত নয়। Authentication > Settings > Authorized domains চেক করুন।',
    },
    'auth/unconfigured': {
      en: 'Firebase is not configured. Please add your VITE_FIREBASE_API_KEY in .env.',
      bn: 'ফায়ারবেস কনফিগার করা নেই। অনুগ্রহ করে .env ফাইলে VITE_FIREBASE_API_KEY যুক্ত করুন।',
    },
  };

  if (messages[code]) {
    return messages[code][lang] || messages[code].en;
  }

  return error.message || (lang === 'bn' ? 'একটি ত্রুটি ঘটেছে।' : 'An authentication error occurred.');
}

export function AuthProvider({ children }) {
  const [currentUser, setCurrentUser] = useState(null);
  const [mongoUser, setMongoUser] = useState(null);
  const [mongoShop, setMongoShop] = useState(null);
  const [loading, setLoading] = useState(true);
  const [authError, setAuthError] = useState(null);

  const setSessionShop = (shop, user = null) => {
    if (shop) {
      setMongoShop(shop);
      localStorage.setItem('shopo_has_shop', 'true');
      localStorage.setItem('shopo_business_type', shop.business_type || 'grocery');
    }
    if (user) {
      setMongoUser(user);
    } else if (shop) {
      setMongoUser(prev => prev ? { ...prev, shop_id: shop._id } : { shop_id: shop._id });
    }
  };

  const syncBackendProfile = async () => {
    try {
      const res = await api.auth.getMe();
      if (res.data) {
        setMongoUser(res.data.user);
        setMongoShop(res.data.shop);
        if (res.data.shop?._id || res.data.user?.shop_id) {
          localStorage.setItem('shopo_has_shop', 'true');
          if (res.data.shop?.business_type) {
            localStorage.setItem('shopo_business_type', res.data.shop.business_type);
          }
        }
      }
      return res.data;
    } catch (err) {
      console.warn('Backend profile sync skipped or unauthenticated:', err.message);
      return null;
    }
  };

  // Subscribe to Firebase Auth State Changes
  useEffect(() => {
    if (!auth) {
      setLoading(false);
      return;
    }

    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      setCurrentUser(user);
      if (user) {
        await syncBackendProfile();
      } else {
        setMongoUser(null);
        setMongoShop(null);
        localStorage.removeItem('shopo_has_shop');
        localStorage.removeItem('shopo_business_type');
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  /**
   * Log in with Email and Password
   */
  const loginWithEmail = async (email, password) => {
    if (!auth) {
      throw { code: 'auth/unconfigured', message: 'Firebase is not configured.' };
    }
    setAuthError(null);
    try {
      const userCredential = await signInWithEmailAndPassword(auth, email.trim(), password);
      return userCredential.user;
    } catch (err) {
      setAuthError(err);
      throw err;
    }
  };

  /**
   * Register with Email and Password
   */
  const registerWithEmail = async (email, password, { fullName = '', shopName = '' } = {}) => {
    if (!auth) {
      throw { code: 'auth/unconfigured', message: 'Firebase is not configured.' };
    }
    setAuthError(null);
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email.trim(), password);
      const user = userCredential.user;

      if (fullName.trim()) {
        await updateProfile(user, { displayName: fullName.trim() });
      }

      if (shopName.trim()) {
        localStorage.setItem(`shopo_shop_name_${user.uid}`, shopName.trim());
      }

      // Update state
      setCurrentUser({ ...user, displayName: fullName.trim() || user.displayName });
      return user;
    } catch (err) {
      setAuthError(err);
      throw err;
    }
  };

  /**
   * Sign In / Sign Up with Google (Gmail)
   */
  const loginWithGoogle = async () => {
    if (!auth) {
      throw { code: 'auth/unconfigured', message: 'Firebase is not configured.' };
    }
    setAuthError(null);
    try {
      const result = await signInWithPopup(auth, googleProvider);
      return result.user;
    } catch (err) {
      setAuthError(err);
      throw err;
    }
  };

  /**
   * Log Out
   */
  const logout = async () => {
    if (!auth) {
      setCurrentUser(null);
      setMongoUser(null);
      setMongoShop(null);
      localStorage.removeItem('shopo_has_shop');
      localStorage.removeItem('shopo_business_type');
      return;
    }
    try {
      await signOut(auth);
      setCurrentUser(null);
      setMongoUser(null);
      setMongoShop(null);
      localStorage.removeItem('shopo_has_shop');
      localStorage.removeItem('shopo_business_type');
    } catch (err) {
      setAuthError(err);
      throw err;
    }
  };

  /**
   * Send Password Reset Email
   */
  const resetPassword = async (email) => {
    if (!auth) {
      throw { code: 'auth/unconfigured', message: 'Firebase is not configured.' };
    }
    setAuthError(null);
    try {
      await sendPasswordResetEmail(auth, email.trim());
    } catch (err) {
      setAuthError(err);
      throw err;
    }
  };

  const clearAuthError = () => setAuthError(null);

  const hasShop = Boolean(mongoUser?.shop_id || mongoShop?._id || localStorage.getItem('shopo_has_shop') === 'true');

  const value = {
    currentUser,
    mongoUser,
    mongoShop,
    hasShop,
    isAuthenticated: Boolean(currentUser),
    loading,
    authError,
    clearAuthError,
    isFirebaseConfigured,
    setSessionShop,
    syncBackendProfile,
    loginWithEmail,
    registerWithEmail,
    loginWithGoogle,
    logout,
    resetPassword,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
