/**
 * @file AuthContext.jsx
 * @description Context API provider for Firebase Authentication state, login with email verification enforcement, registration, password recovery, and user session management.
 */
import { createContext, useContext, useState, useEffect } from 'react';
import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signInWithPopup,
  signOut,
  sendPasswordResetEmail,
  sendEmailVerification,
  verifyPasswordResetCode,
  confirmPasswordReset,
  applyActionCode,
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
    'auth/unverified-email': {
      en: 'Please verify your email address to log in. We have sent a verification link to your email.',
      bn: 'লগইন করতে অনুগ্রহ করে আপনার ইমেইল ভেরিফাই করুন। আমরা আপনার ইমেইলে ভেরিফিকেশন লিংক পাঠিয়েছি।',
    },
    'auth/expired-action-code': {
      en: 'This reset or verification link has expired. Please request a new link.',
      bn: 'এই লিংকটির মেয়াদ শেষ হয়ে গেছে। অনুগ্রহ করে নতুন লিংকের জন্য অনুরোধ করুন।',
    },
    'auth/invalid-action-code': {
      en: 'This link is invalid or has already been used.',
      bn: 'এই লিংকটি সঠিক নয় অথবা ইতিমধ্যে ব্যবহার করা হয়েছে।',
    },
    'auth/too-many-requests': {
      en: 'Too many requests. Please wait a few moments and try again.',
      bn: 'অতিরিক্ত বার চেষ্টা করা হয়েছে। অনুগ্রহ করে কিছুক্ষণ পর আবার চেষ্টা করুন।',
    },
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
  const [userShops, setUserShops] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isProfileLoading, setIsProfileLoading] = useState(false);
  const [isProfileChecked, setIsProfileChecked] = useState(false);
  const [authError, setAuthError] = useState(null);

  const setSessionShop = (shop, user = null) => {
    if (shop) {
      setMongoShop(shop);
      localStorage.setItem('shopo_has_shop', 'true');
      localStorage.setItem('shopo_active_shop_id', shop._id);
      localStorage.setItem('shopo_business_type', shop.business_type || 'grocery');
    }
    if (user) {
      setMongoUser(user);
    } else if (shop) {
      setMongoUser(prev => prev ? { ...prev, shop_id: shop._id } : { shop_id: shop._id });
    }
  };

  const syncBackendProfile = async (silent = false) => {
    if (!silent && !isProfileChecked) {
      setIsProfileLoading(true);
    }
    try {
      const res = await api.auth.getMe();
      if (res.data) {
        setMongoUser(res.data.user);
        setMongoShop(res.data.shop);
        if (Array.isArray(res.data.shops)) {
          setUserShops(res.data.shops);
        }
        if (res.data.shop?._id || res.data.user?.shop_id) {
          localStorage.setItem('shopo_has_shop', 'true');
          const activeId = res.data.shop?._id || res.data.user?.shop_id;
          if (activeId) {
            localStorage.setItem('shopo_active_shop_id', activeId);
          }
          if (res.data.shop?.business_type) {
            localStorage.setItem('shopo_business_type', res.data.shop.business_type);
          }
        }
      }
      setIsProfileChecked(true);
      return res.data;
    } catch (err) {
      console.warn('Backend profile sync skipped or unauthenticated:', err.message);
      setIsProfileChecked(true);
      return null;
    } finally {
      setIsProfileLoading(false);
    }
  };

  // Subscribe to Firebase Auth State Changes
  useEffect(() => {
    // Safety fallback: if Firebase or network takes more than 3.5s, unblock the UI so user is never stuck on spinner
    const safetyTimer = setTimeout(() => {
      setLoading(false);
      setIsProfileChecked(true);
    }, 3500);

    if (!auth) {
      clearTimeout(safetyTimer);
      setLoading(false);
      setIsProfileChecked(true);
      return;
    }

    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      clearTimeout(safetyTimer);
      setCurrentUser(user);
      if (user && user.emailVerified) {
        await syncBackendProfile();
      } else {
        setMongoUser(null);
        setMongoShop(null);
        setIsProfileChecked(true);
        if (!user) {
          localStorage.removeItem('shopo_has_shop');
          localStorage.removeItem('shopo_business_type');
        }
      }
      setLoading(false);
    });

    return () => {
      clearTimeout(safetyTimer);
      unsubscribe();
    };
  }, []);

  // Background heartbeat & window focus sync (runs 100% silently under the hood without UI loader)
  useEffect(() => {
    if (!currentUser || !currentUser.emailVerified) return;

    const handleFocus = () => {
      syncBackendProfile(true);
    };
    window.addEventListener('focus', handleFocus);

    const intervalId = setInterval(() => {
      syncBackendProfile(true);
    }, 30000);

    return () => {
      window.removeEventListener('focus', handleFocus);
      clearInterval(intervalId);
    };
  }, [currentUser]);

  /**
   * Log in with Email and Password (requires email verification)
   */
  const loginWithEmail = async (email, password) => {
    if (!auth) {
      throw { code: 'auth/unconfigured', message: 'Firebase is not configured.' };
    }
    setAuthError(null);
    try {
      const userCredential = await signInWithEmailAndPassword(auth, email.trim(), password);
      const user = userCredential.user;

      // Check if email is verified
      if (!user.emailVerified) {
        try {
          await sendEmailVerification(user);
        } catch (verErr) {
          console.warn('Auto verification email notice:', verErr.message);
        }
        const unverifiedErr = {
          code: 'auth/unverified-email',
          user,
          message: 'Please verify your email address to log in. A verification link has been sent.',
        };
        setAuthError(unverifiedErr);
        throw unverifiedErr;
      }

      return user;
    } catch (err) {
      setAuthError(err);
      throw err;
    }
  };

  /**
   * Register with Email and Password (dispatches verification email)
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

      // Automatically send verification email
      try {
        await sendEmailVerification(user);
      } catch (verErr) {
        console.warn('Registration verification email notice:', verErr.message);
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
   * Send / Resend Verification Email
   */
  const sendVerificationEmail = async (targetUser = null) => {
    const user = targetUser || auth?.currentUser;
    if (!user) {
      throw { code: 'auth/user-not-found', message: 'No active user session found to verify.' };
    }
    await sendEmailVerification(user);
  };

  /**
   * Reload current user to check if email was verified
   */
  const checkEmailVerified = async () => {
    if (!auth?.currentUser) return false;
    await auth.currentUser.reload();
    const isVerified = Boolean(auth.currentUser.emailVerified);
    if (isVerified) {
      setCurrentUser({ ...auth.currentUser });
      await syncBackendProfile();
    }
    return isVerified;
  };

  /**
   * Sign In / Sign Up with Google (inherently verified by Google)
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

  /**
   * Verify Password Reset Code from Email Link
   */
  const verifyResetCode = async (oobCode) => {
    if (!auth) {
      throw { code: 'auth/unconfigured', message: 'Firebase is not configured.' };
    }
    return await verifyPasswordResetCode(auth, oobCode);
  };

  /**
   * Confirm and update password with Reset Code
   */
  const confirmNewPassword = async (oobCode, newPassword) => {
    if (!auth) {
      throw { code: 'auth/unconfigured', message: 'Firebase is not configured.' };
    }
    await confirmPasswordReset(auth, oobCode, newPassword);
  };

  /**
   * Universal handler for email action code (verification / reset)
   */
  const applyAuthActionCode = async (oobCode) => {
    if (!auth) {
      throw { code: 'auth/unconfigured', message: 'Firebase is not configured.' };
    }
    await applyActionCode(auth, oobCode);
    if (auth.currentUser) {
      await auth.currentUser.reload();
      setCurrentUser({ ...auth.currentUser });
    }
  };

  const switchShop = async (targetShopId) => {
    setIsProfileLoading(true);
    try {
      localStorage.setItem('shopo_active_shop_id', targetShopId);
      const res = await api.shops.switch(targetShopId);
      if (res.data?.shop) {
        setMongoShop(res.data.shop);
        setMongoUser(res.data.user);
        localStorage.setItem('shopo_has_shop', 'true');
        localStorage.setItem('shopo_business_type', res.data.shop.business_type || 'grocery');
      }
      await syncBackendProfile();
      return res.data;
    } catch (err) {
      console.error('Failed to switch shop:', err);
      throw err;
    } finally {
      setIsProfileLoading(false);
    }
  };

  const createNewShop = async (shopData) => {
    setIsProfileLoading(true);
    try {
      const res = await api.shops.create(shopData);
      if (res.data?.shop) {
        const newShop = res.data.shop;
        localStorage.setItem('shopo_active_shop_id', newShop._id);
        localStorage.setItem('shopo_has_shop', 'true');
        localStorage.setItem('shopo_business_type', newShop.business_type || 'grocery');
        setMongoShop(newShop);
        if (res.data.user) setMongoUser(res.data.user);
      }
      await syncBackendProfile();
      return res.data;
    } catch (err) {
      console.error('Failed to create new shop:', err);
      throw err;
    } finally {
      setIsProfileLoading(false);
    }
  };

  const clearAuthError = () => setAuthError(null);

  const hasShop = Boolean(mongoUser?.shop_id || mongoShop?._id || localStorage.getItem('shopo_has_shop') === 'true');

  const value = {
    currentUser,
    mongoUser,
    mongoShop,
    userShops,
    hasShop,
    isAuthenticated: Boolean(currentUser),
    isEmailVerified: Boolean(currentUser?.emailVerified),
    loading,
    isProfileLoading,
    isProfileChecked,
    authError,
    clearAuthError,
    isFirebaseConfigured,
    setSessionShop,
    syncBackendProfile,
    switchShop,
    createNewShop,
    loginWithEmail,
    registerWithEmail,
    sendVerificationEmail,
    checkEmailVerified,
    loginWithGoogle,
    logout,
    resetPassword,
    verifyResetCode,
    confirmNewPassword,
    applyAuthActionCode,
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
