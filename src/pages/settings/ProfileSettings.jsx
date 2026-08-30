/**
 * @file ProfileSettings.jsx
 * @description State-of-the-art Personal Profile & Account Settings page.
 * Features live Avatar Studio, personal bio & contact details, in-app password management,
 * linked store outlet switching, system preferences, sound toggles, and security logs.
 */
import { useState, useEffect, useMemo, useId } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  updateProfile as updateFirebaseProfile,
  updatePassword,
  reauthenticateWithCredential,
  EmailAuthProvider,
  sendPasswordResetEmail,
  sendEmailVerification,
} from 'firebase/auth';
import { motion, AnimatePresence } from 'framer-motion';
import { auth } from '@/firebase.config';
import { useAuth } from '@/context/AuthContext';
import { useLanguage } from '@/context/LanguageContext';
import api from '@/services/api';
import toast from 'react-hot-toast';
import { Card, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  User, Mail, Phone, MapPin, ShieldCheck, Crown, Key,
  Save, Loader2, Upload, Sparkles, Check, CheckCircle2,
  Building2, Calendar, Lock, AlertCircle, Copy, Store,
  Camera, RefreshCw, Layers, Eye, EyeOff, Shield,
  Volume2, VolumeX, Bell, Globe, ArrowRight, LogOut,
  ExternalLink, CheckCircle, Info, Sparkle, ShieldAlert,
  Smartphone, Hash, Briefcase, Award, Zap
} from 'lucide-react';

const PRESET_AVATARS = [
  'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=300&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=300&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=300&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=300&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=300&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1522075469751-3a6694fb2f61?w=300&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1560250097-0b93528c311a?w=300&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1580489944761-15a19d654956?w=300&auto=format&fit=crop&q=80',
];

export default function ProfileSettings() {
  const navigate = useNavigate();
  const { lang, setLang } = useLanguage();
  const {
    currentUser,
    mongoUser,
    mongoShop,
    userShops,
    switchShop,
    syncBackendProfile,
    isEmailVerified,
    sendVerificationEmail,
    logout,
  } = useAuth();

  const [activeTab, setActiveTab] = useState('profile'); // 'profile' | 'security' | 'outlets' | 'preferences'
  const [isSaving, setIsSaving] = useState(false);
  const [isSendingReset, setIsSendingReset] = useState(false);
  const [isSendingVerification, setIsSendingVerification] = useState(false);
  const [isUpdatingPassword, setIsUpdatingPassword] = useState(false);
  const avatarInputId = useId();

  // Profile Form State
  const [form, setForm] = useState({
    name: '',
    email: '',
    phone: '',
    avatar_url: '',
    bio: '',
    address: '',
    city: '',
    whatsapp: '',
  });

  // Original state tracker for unsaved changes detection
  const [originalForm, setOriginalForm] = useState(null);

  // Password change form
  const [passwordForm, setPasswordForm] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });
  const [showPassword, setShowPassword] = useState({
    current: false,
    new: false,
    confirm: false,
  });

  // Local preferences state
  const [preferences, setPreferences] = useState({
    posSound: localStorage.getItem('shopo_pos_sound') !== 'false',
    lowStockAlerts: localStorage.getItem('shopo_low_stock_alerts') !== 'false',
    autoPrintReceipt: localStorage.getItem('shopo_auto_print_receipt') === 'true',
    quickSaleMode: localStorage.getItem('shopo_quick_sale_mode') === 'true',
  });

  // Populate form with current user data
  useEffect(() => {
    if (mongoUser || currentUser) {
      const initialData = {
        name: mongoUser?.name || currentUser?.displayName || '',
        email: mongoUser?.email || currentUser?.email || '',
        phone: mongoUser?.phone || '',
        avatar_url: mongoUser?.avatar_url || currentUser?.photoURL || '',
        bio: mongoUser?.bio || '',
        address: mongoUser?.address || '',
        city: mongoUser?.city || 'Dhaka',
        whatsapp: mongoUser?.whatsapp || mongoUser?.phone || '',
      };
      setForm(initialData);
      setOriginalForm(initialData);
    }
  }, [mongoUser, currentUser]);

  // Check if form is dirty
  const isDirty = useMemo(() => {
    if (!originalForm) return false;
    return Object.keys(form).some((k) => form[k] !== originalForm[k]);
  }, [form, originalForm]);

  // Profile completion calculation
  const profileCompletion = useMemo(() => {
    let score = 0;
    if (form.name?.trim()) score += 25;
    if (form.email?.trim()) score += 25;
    if (form.phone?.trim()) score += 20;
    if (form.avatar_url?.trim()) score += 15;
    if (form.address?.trim() || form.bio?.trim()) score += 15;
    return Math.min(100, score);
  }, [form]);

  // Handle avatar file upload
  const handleAvatarFileUpload = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 2.5 * 1024 * 1024) {
      toast.error(lang === 'bn' ? 'ছবির সাইজ ২.৫MB এর কম হতে হবে।' : 'Avatar image must be under 2.5MB.');
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      setForm((prev) => ({ ...prev, avatar_url: reader.result }));
      toast.success(lang === 'bn' ? 'ছবি আপলোড হয়েছে!' : 'Avatar loaded successfully!');
    };
    reader.readAsDataURL(file);
  };

  // Generate dynamic DiceBear avatar
  const handleGenerateRandomAvatar = () => {
    const seed = Math.random().toString(36).substring(2, 9);
    const generatedUrl = `https://api.dicebear.com/7.x/bottts/svg?seed=${seed}&backgroundColor=b6e3f4,c0aede,d1d4f9,ffd5dc,ffdfbf`;
    setForm((prev) => ({ ...prev, avatar_url: generatedUrl }));
    toast.success(lang === 'bn' ? 'নতুন কার্টুন অ্যাভাটার তৈরি হয়েছে!' : 'Random avatar generated!');
  };

  // Save profile changes
  const handleSaveProfile = async (e) => {
    if (e) e.preventDefault();
    if (!form.name.trim()) {
      toast.error(lang === 'bn' ? 'আপনার নাম আবশ্যক।' : 'Your name is required.');
      return;
    }

    setIsSaving(true);
    try {
      // 1. Update Backend MongoDB Profile
      await api.auth.updateProfile({
        name: form.name.trim(),
        phone: form.phone.trim(),
        avatar_url: form.avatar_url.trim(),
        bio: form.bio.trim(),
        address: form.address.trim(),
      });

      // 2. Sync Firebase Auth Profile
      if (auth.currentUser) {
        try {
          await updateFirebaseProfile(auth.currentUser, {
            displayName: form.name.trim(),
            photoURL: form.avatar_url.trim() || null,
          });
        } catch (fbErr) {
          console.warn('Firebase profile sync error:', fbErr);
        }
      }

      // 3. Sync Context
      await syncBackendProfile(true);
      setOriginalForm({ ...form });

      toast.success(
        lang === 'bn'
          ? 'ব্যক্তিগত প্রোফাইল সফলভাবে সংরক্ষিত হয়েছে!'
          : 'Personal profile updated successfully!'
      );
    } catch (err) {
      console.error('Update profile error:', err);
      toast.error(err.message || 'Failed to update profile.');
    } finally {
      setIsSaving(false);
    }
  };

  // Direct Password Update Handler
  const handleUpdatePasswordDirect = async (e) => {
    e.preventDefault();
    if (!passwordForm.newPassword) {
      toast.error(lang === 'bn' ? 'নতুন পাসওয়ার্ড লিখুন।' : 'New password is required.');
      return;
    }
    if (passwordForm.newPassword.length < 6) {
      toast.error(lang === 'bn' ? 'পাসওয়ার্ড কমপক্ষে ৬ অক্ষরের হতে হবে।' : 'Password must be at least 6 characters.');
      return;
    }
    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      toast.error(lang === 'bn' ? 'কনফার্ম পাসওয়ার্ড মেলেনি।' : 'Passwords do not match.');
      return;
    }

    const user = auth.currentUser;
    if (!user || !user.email) {
      toast.error('No authenticated user session found.');
      return;
    }

    setIsUpdatingPassword(true);
    try {
      // If current password provided, reauthenticate
      if (passwordForm.currentPassword) {
        const credential = EmailAuthProvider.credential(user.email, passwordForm.currentPassword);
        await reauthenticateWithCredential(user, credential);
      }

      await updatePassword(user, passwordForm.newPassword);
      setPasswordForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
      toast.success(
        lang === 'bn'
          ? 'পাসওয়ার্ড সফলভাবে পরিবর্তন করা হয়েছে!'
          : 'Password updated successfully!'
      );
    } catch (err) {
      console.error('Password update error:', err);
      if (err.code === 'auth/requires-recent-login' || err.code === 'auth/wrong-password' || err.code === 'auth/invalid-credential') {
        toast.error(lang === 'bn' ? 'বর্তমান পাসওয়ার্ড ভুল অথবা রি-লগইন প্রয়োজন।' : 'Current password incorrect or re-login required.');
      } else {
        toast.error(err.message || 'Failed to update password.');
      }
    } finally {
      setIsUpdatingPassword(false);
    }
  };

  // Send Password Reset Link Email
  const handleSendPasswordReset = async () => {
    if (!form.email) {
      toast.error('No email associated with this account.');
      return;
    }

    setIsSendingReset(true);
    try {
      await sendPasswordResetEmail(auth, form.email);
      toast.success(
        lang === 'bn'
          ? `পাসওয়ার্ড রিসেট লিংক ${form.email} ঠিকানায় পাঠানো হয়েছে!`
          : `Password reset email sent to ${form.email}!`
      );
    } catch (err) {
      toast.error(err.message || 'Failed to send password reset email.');
    } finally {
      setIsSendingReset(false);
    }
  };

  // Resend Email Verification Link
  const handleResendVerification = async () => {
    setIsSendingVerification(true);
    try {
      await sendVerificationEmail();
      toast.success(
        lang === 'bn'
          ? 'ভেরিফিকেশন লিংক আপনার ইমেইলে পাঠানো হয়েছে।'
          : 'Verification email sent! Please check your inbox.'
      );
    } catch (err) {
      toast.error(err.message || 'Failed to send verification email.');
    } finally {
      setIsSendingVerification(false);
    }
  };

  // Preference Toggle Handler
  const togglePreference = (key) => {
    setPreferences((prev) => {
      const nextVal = !prev[key];
      const storageKey = `shopo_${key.replace(/([A-Z])/g, '_$1').toLowerCase()}`;
      localStorage.setItem(storageKey, String(nextVal));
      toast.success(lang === 'bn' ? 'পছন্দ সংরক্ষিত হয়েছে!' : 'Preference updated!');
      return { ...prev, [key]: nextVal };
    });
  };

  const copyUid = () => {
    const uid = mongoUser?.firebase_uid || currentUser?.uid;
    if (uid) {
      navigator.clipboard.writeText(uid);
      toast.success('UID copied to clipboard');
    }
  };

  // Password strength calculation
  const passwordStrength = useMemo(() => {
    const p = passwordForm.newPassword;
    if (!p) return { score: 0, label: '', color: 'bg-slate-200' };
    let s = 0;
    if (p.length >= 6) s += 25;
    if (p.length >= 10) s += 25;
    if (/[A-Z]/.test(p) && /[a-z]/.test(p)) s += 25;
    if (/[0-9]/.test(p) || /[^A-Za-z0-9]/.test(p)) s += 25;

    if (s <= 25) return { score: s, label: lang === 'bn' ? 'দুর্বল' : 'Weak', color: 'bg-rose-500' };
    if (s <= 50) return { score: s, label: lang === 'bn' ? 'মাঝারি' : 'Medium', color: 'bg-amber-500' };
    if (s <= 75) return { score: s, label: lang === 'bn' ? 'ভালো' : 'Good', color: 'bg-blue-500' };
    return { score: 100, label: lang === 'bn' ? 'অত্যন্ত শক্তিশালী' : 'Strong', color: 'bg-[#00df89]' };
  }, [passwordForm.newPassword, lang]);

  return (
    <div className="max-w-5xl mx-auto space-y-6 font-sans pb-24 animate-in fade-in duration-200">
      
      {/* ---------------------------------------------------- */}
      {/* HERO / PROFILE HEADER BANNER                         */}
      {/* ---------------------------------------------------- */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-slate-900 via-slate-800 to-zinc-900 border border-slate-700/60 p-6 sm:p-8 text-white shadow-xl">
        <div className="absolute top-0 right-0 -mt-8 -mr-8 w-64 h-64 bg-[#00df89]/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-1/3 -mb-12 w-64 h-64 bg-blue-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="flex items-center gap-4 sm:gap-5">
            {/* Big Glow Avatar */}
            <div className="relative shrink-0">
              <div className="w-18 h-18 sm:w-20 sm:h-20 rounded-2xl p-1 bg-gradient-to-tr from-[#00df89] to-blue-500 shadow-lg">
                {form.avatar_url ? (
                  <img
                    src={form.avatar_url}
                    alt="User Avatar"
                    className="w-full h-full object-cover rounded-xl bg-zinc-900"
                  />
                ) : (
                  <div className="w-full h-full rounded-xl bg-zinc-800 text-[#00df89] font-bold text-2xl flex items-center justify-center">
                    {(form.name || form.email || 'U')[0].toUpperCase()}
                  </div>
                )}
              </div>
              <div className="absolute -bottom-1 -right-1 w-5 h-5 rounded-full bg-[#00df89] border-2 border-slate-900 flex items-center justify-center">
                <Check className="w-3 h-3 text-slate-950 stroke-[3]" />
              </div>
            </div>

            {/* Name, Role & Email */}
            <div className="min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-white truncate">
                  {form.name || 'User Profile'}
                </h1>
                <Badge className="bg-[#00df89]/20 text-[#00df89] border-[#00df89]/30 text-[10px] font-bold uppercase tracking-wider">
                  <Crown className="w-3 h-3 mr-1" />
                  {mongoUser?.role || 'Store Owner'}
                </Badge>
              </div>

              <p className="text-xs text-slate-300 flex items-center gap-1.5 mt-1 font-mono">
                <Mail className="w-3.5 h-3.5 text-slate-400" />
                <span>{form.email}</span>
                {isEmailVerified ? (
                  <span className="text-[10px] text-[#00df89] font-semibold flex items-center gap-0.5 ml-1">
                    • Verified
                  </span>
                ) : (
                  <span className="text-[10px] text-amber-400 font-semibold flex items-center gap-0.5 ml-1">
                    • Unverified
                  </span>
                )}
              </p>

              {mongoShop && (
                <div className="text-xs text-slate-400 flex items-center gap-1.5 mt-1">
                  <Store className="w-3.5 h-3.5 text-[#00df89]" />
                  <span>{lang === 'bn' ? 'বর্তমান আউটলেট:' : 'Active Outlet:'} </span>
                  <span className="text-white font-semibold">{mongoShop.name}</span>
                </div>
              )}
            </div>
          </div>

          {/* Profile Completion Indicator */}
          <div className="bg-white/10 backdrop-blur-md rounded-2xl p-4 border border-white/10 shrink-0 min-w-[200px] flex flex-col justify-between">
            <div className="flex items-center justify-between text-xs mb-2">
              <span className="text-slate-300 font-medium">{lang === 'bn' ? 'প্রোফাইল পূর্ণতা' : 'Profile Strength'}</span>
              <span className="font-bold text-[#00df89] font-mono">{profileCompletion}%</span>
            </div>
            <div className="w-full h-2 bg-black/40 rounded-full overflow-hidden mb-2">
              <div
                className="h-full bg-gradient-to-r from-blue-500 to-[#00df89] transition-all duration-500 rounded-full"
                style={{ width: `${profileCompletion}%` }}
              />
            </div>
            <div className="text-[10px] text-slate-300">
              {profileCompletion === 100
                ? (lang === 'bn' ? 'সকল প্রয়োজনীয় তথ্য সম্পন্ন!' : 'All core info completed!')
                : (lang === 'bn' ? 'প্রোফাইল ছবি ও ফোন নম্বর যুক্ত করুন' : 'Add photo & address to reach 100%')}
            </div>
          </div>
        </div>
      </div>

      {/* ---------------------------------------------------- */}
      {/* MODERN TAB NAVIGATION                                */}
      {/* ---------------------------------------------------- */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none border-b border-slate-200 dark:border-zinc-800">
        {[
          { id: 'profile', label: lang === 'bn' ? 'ব্যক্তিগত তথ্য' : 'Personal Info', icon: User },
          { id: 'security', label: lang === 'bn' ? 'নিরাপত্তা ও পাসওয়ার্ড' : 'Security & Login', icon: Lock },
          { id: 'outlets', label: lang === 'bn' ? 'দোকান ও আউটলেট' : 'Store Outlets', icon: Store, count: userShops?.length },
          { id: 'preferences', label: lang === 'bn' ? 'পছন্দ ও সেটিংস' : 'Preferences & Sound', icon: Sparkles },
        ].map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
                isActive
                  ? 'bg-slate-900 text-white dark:bg-[#00df89] dark:text-slate-950 shadow-sm'
                  : 'text-slate-600 dark:text-zinc-400 hover:bg-slate-100 dark:hover:bg-zinc-800/60'
              }`}
            >
              <Icon className={`w-3.5 h-3.5 ${isActive ? 'text-[#00df89] dark:text-slate-950' : 'text-slate-400'}`} />
              <span>{tab.label}</span>
              {tab.count !== undefined && (
                <span className={`px-1.5 py-0.2 rounded-full text-[10px] font-mono ${isActive ? 'bg-white/20' : 'bg-slate-200 dark:bg-zinc-700'}`}>
                  {tab.count}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* ---------------------------------------------------- */}
      {/* TAB CONTENT AREAS                                    */}
      {/* ---------------------------------------------------- */}

      {/* TAB 1: PERSONAL PROFILE */}
      {activeTab === 'profile' && (
        <form onSubmit={handleSaveProfile} className="space-y-6 animate-in fade-in duration-150">
          
          {/* AVATAR STUDIO CARD */}
          <Card className="p-5 sm:p-6 bg-white dark:bg-zinc-900 border-slate-200/80 dark:border-zinc-800 shadow-xs rounded-2xl">
            <CardTitle className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2 mb-1">
              <Sparkles className="w-4 h-4 text-[#00df89]" />
              <span>{lang === 'bn' ? 'অ্যাভাটার স্টুডিও ও ছবি' : 'Avatar Studio & Profile Photo'}</span>
            </CardTitle>
            <CardDescription className="text-xs text-slate-500 dark:text-zinc-400 mb-6">
              {lang === 'bn'
                ? 'আপনার ডিভাইসের ছবি আপলোড করুন, রেডিমেড প্রিসেট সিলেক্ট করুন অথবা সরাসরি লিংক পেস্ট করুন।'
                : 'Upload your custom photo, pick an aesthetic preset avatar, or generate a dynamic 3D cartoon avatar.'}
            </CardDescription>

            <div className="flex flex-col md:flex-row items-start md:items-center gap-6">
              {/* Avatar Preview Box */}
              <div className="relative group shrink-0">
                <div className="w-24 h-24 sm:w-28 sm:h-28 rounded-2xl p-1 bg-gradient-to-tr from-[#00df89] to-blue-500 shadow-md">
                  {form.avatar_url ? (
                    <img
                      src={form.avatar_url}
                      alt="Profile"
                      className="w-full h-full object-cover rounded-xl bg-white dark:bg-zinc-800"
                    />
                  ) : (
                    <div className="w-full h-full rounded-xl bg-slate-100 dark:bg-zinc-800 text-slate-700 dark:text-zinc-200 font-bold text-3xl flex items-center justify-center">
                      {(form.name || form.email || 'U')[0].toUpperCase()}
                    </div>
                  )}
                </div>

                <label
                  htmlFor={avatarInputId}
                  className="absolute -bottom-2 -right-2 w-8 h-8 rounded-xl bg-slate-900 text-white dark:bg-white dark:text-slate-900 flex items-center justify-center cursor-pointer shadow-md hover:scale-110 transition-transform"
                  title="Upload Photo from Device"
                >
                  <Camera className="w-4 h-4" />
                </label>
                <input
                  id={avatarInputId}
                  type="file"
                  accept="image/*"
                  onChange={handleAvatarFileUpload}
                  className="hidden"
                />
              </div>

              {/* Avatar Controls & Presets */}
              <div className="space-y-3 flex-1 min-w-0">
                <div className="flex items-center justify-between gap-2 flex-wrap">
                  <span className="text-xs font-semibold text-slate-700 dark:text-zinc-300">
                    {lang === 'bn' ? 'রেডিমেড প্রিসেট অ্যাভাটার নির্বাচন করুন:' : 'Pick a Preset Avatar:'}
                  </span>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={handleGenerateRandomAvatar}
                      className="text-[11px] font-bold text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1 cursor-pointer"
                    >
                      <Sparkles className="w-3 h-3" />
                      {lang === 'bn' ? 'র‍্যান্ডম কার্টুন' : 'Random Avatar'}
                    </button>
                    {form.avatar_url && (
                      <button
                        type="button"
                        onClick={() => setForm((prev) => ({ ...prev, avatar_url: '' }))}
                        className="text-[11px] font-bold text-rose-500 hover:underline cursor-pointer ml-2"
                      >
                        {lang === 'bn' ? 'ছবি রিমুভ' : 'Remove Photo'}
                      </button>
                    )}
                  </div>
                </div>

                {/* Preset Avatar Cards */}
                <div className="flex items-center gap-2 flex-wrap">
                  {PRESET_AVATARS.map((url, idx) => (
                    <button
                      type="button"
                      key={idx}
                      onClick={() => setForm((prev) => ({ ...prev, avatar_url: url }))}
                      className={`w-9 h-9 sm:w-10 sm:h-10 rounded-xl overflow-hidden border-2 transition-all cursor-pointer hover:scale-105 ${
                        form.avatar_url === url
                          ? 'border-[#00df89] ring-2 ring-[#00df89]/30 scale-105'
                          : 'border-slate-200 dark:border-zinc-800 opacity-75 hover:opacity-100'
                      }`}
                    >
                      <img src={url} alt={`Preset ${idx}`} className="w-full h-full object-cover" />
                    </button>
                  ))}
                </div>

                {/* Direct Image URL Input */}
                <div className="pt-1">
                  <Input
                    value={form.avatar_url}
                    onChange={(e) => setForm({ ...form, avatar_url: e.target.value })}
                    placeholder={lang === 'bn' ? 'অথবা সরাসরি ছবির ওয়েব লিংক (URL) পেস্ট করুন...' : 'Or paste a direct image URL (https://...)'}
                    className="text-xs h-9"
                  />
                </div>
              </div>
            </div>
          </Card>

          {/* PERSONAL DETAILS CARD */}
          <Card className="p-5 sm:p-6 bg-white dark:bg-zinc-900 border-slate-200/80 dark:border-zinc-800 shadow-xs rounded-2xl">
            <CardTitle className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2 mb-1">
              <User className="w-4 h-4 text-blue-500" />
              <span>{lang === 'bn' ? 'ব্যক্তিগত ও যোগাযোগের তথ্য' : 'Personal & Contact Information'}</span>
            </CardTitle>
            <CardDescription className="text-xs text-slate-500 dark:text-zinc-400 mb-6">
              {lang === 'bn'
                ? 'ইনভয়েস এবং বিক্রয় স্লিপে ক্যাশিয়ার ও কতৃপক্ষের যোগাযোগের তথ্য প্রদর্শন করা হবে।'
                : 'Your identity, designation, phone number, and physical billing address across the system.'}
            </CardDescription>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              
              {/* Full Name */}
              <div>
                <label className="text-xs font-semibold text-slate-700 dark:text-zinc-300 block mb-1.5">
                  {lang === 'bn' ? 'পূর্ণ নাম' : 'Full Name'} <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <User className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <Input
                    value={form.name}
                    onChange={(e) => setForm({ ...form, name: e.target.value })}
                    placeholder={lang === 'bn' ? 'আপনার নাম লিখুন' : 'Enter your full name'}
                    className="pl-9 text-xs h-10"
                    required
                  />
                </div>
              </div>

              {/* Email Address (Readonly with Verified Status) */}
              <div>
                <label className="text-xs font-semibold text-slate-700 dark:text-zinc-300 block mb-1.5 flex items-center justify-between">
                  <span>{lang === 'bn' ? 'ইমেইল অ্যাড্রেস' : 'Email Address'}</span>
                  {isEmailVerified ? (
                    <span className="text-[10px] text-emerald-600 dark:text-emerald-400 flex items-center gap-1 font-bold">
                      <CheckCircle2 className="w-3 h-3" /> {lang === 'bn' ? 'ভেরিফাইড' : 'Verified'}
                    </span>
                  ) : (
                    <button
                      type="button"
                      onClick={handleResendVerification}
                      disabled={isSendingVerification}
                      className="text-[10px] text-amber-600 dark:text-amber-400 hover:underline flex items-center gap-1 font-bold cursor-pointer"
                    >
                      <AlertCircle className="w-3 h-3" />
                      {isSendingVerification
                        ? (lang === 'bn' ? 'পাঠানো হচ্ছে...' : 'Sending...')
                        : (lang === 'bn' ? 'ভেরিফিকেশন পাঠান' : 'Verify Email')}
                    </button>
                  )}
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <Input
                    value={form.email}
                    disabled
                    className="pl-9 text-xs h-10 bg-slate-50 dark:bg-zinc-800/60 text-slate-500 dark:text-zinc-400 cursor-not-allowed"
                  />
                </div>
              </div>

              {/* Phone Number */}
              <div>
                <label className="text-xs font-semibold text-slate-700 dark:text-zinc-300 block mb-1.5">
                  {lang === 'bn' ? 'ফোন নম্বর' : 'Phone Number'}
                </label>
                <div className="relative">
                  <Phone className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <Input
                    value={form.phone}
                    onChange={(e) => setForm({ ...form, phone: e.target.value })}
                    placeholder="017XXXXXXXX"
                    className="pl-9 text-xs h-10 font-mono"
                  />
                </div>
              </div>

              {/* WhatsApp Number */}
              <div>
                <label className="text-xs font-semibold text-slate-700 dark:text-zinc-300 block mb-1.5">
                  {lang === 'bn' ? 'হোয়াটসঅ্যাপ নম্বর' : 'WhatsApp Number'}
                </label>
                <div className="relative">
                  <Smartphone className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <Input
                    value={form.whatsapp}
                    onChange={(e) => setForm({ ...form, whatsapp: e.target.value })}
                    placeholder="017XXXXXXXX"
                    className="pl-9 text-xs h-10 font-mono"
                  />
                </div>
              </div>

              {/* Designation / Bio */}
              <div className="sm:col-span-2">
                <label className="text-xs font-semibold text-slate-700 dark:text-zinc-300 block mb-1.5 flex items-center justify-between">
                  <span>{lang === 'bn' ? 'পদবি ও পরিচিতি' : 'Designation / Short Bio'}</span>
                  <span className="text-[10px] text-slate-400 font-mono">{form.bio?.length || 0}/120</span>
                </label>
                <div className="relative">
                  <Briefcase className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <Input
                    value={form.bio}
                    maxLength={120}
                    onChange={(e) => setForm({ ...form, bio: e.target.value })}
                    placeholder={lang === 'bn' ? 'যেমন: প্রধান নির্বাহী কর্মকর্তা / প্রতিষ্ঠাতা' : 'e.g. Founder & Managing Director'}
                    className="pl-9 text-xs h-10"
                  />
                </div>
              </div>

              {/* Address */}
              <div className="sm:col-span-2">
                <label className="text-xs font-semibold text-slate-700 dark:text-zinc-300 block mb-1.5">
                  {lang === 'bn' ? 'ব্যক্তিগত ঠিকানা' : 'Personal Address'}
                </label>
                <div className="relative">
                  <MapPin className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <Input
                    value={form.address}
                    onChange={(e) => setForm({ ...form, address: e.target.value })}
                    placeholder={lang === 'bn' ? 'বাসা, রোড, এলাকা, জেলা' : 'House, Road, City, Bangladesh'}
                    className="pl-9 text-xs h-10"
                  />
                </div>
              </div>

            </div>
          </Card>

          {/* SAVE BUTTON BAR */}
          <div className="flex items-center justify-between gap-4 pt-2">
            <div className="text-xs text-slate-500 dark:text-zinc-400 flex items-center gap-1.5">
              {isDirty && (
                <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse shrink-0" />
              )}
              <span>{isDirty ? (lang === 'bn' ? 'অসংরক্ষিত পরিবর্তন রয়েছে' : 'You have unsaved changes') : (lang === 'bn' ? 'সকল পরিবর্তন সংরক্ষিত' : 'All changes saved')}</span>
            </div>

            <Button
              type="submit"
              disabled={isSaving}
              className="h-11 px-8 rounded-xl bg-[#00df89] hover:bg-[#00c578] text-[#011812] font-bold text-xs shadow-md hover:shadow-lg transition-all cursor-pointer gap-2"
            >
              {isSaving ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>{lang === 'bn' ? 'সংরক্ষণ করা হচ্ছে...' : 'Saving Changes...'}</span>
                </>
              ) : (
                <>
                  <Save className="w-4 h-4" />
                  <span>{lang === 'bn' ? 'প্রোফাইল সংরক্ষণ করুন' : 'Save Profile Changes'}</span>
                </>
              )}
            </Button>
          </div>
        </form>
      )}

      {/* TAB 2: SECURITY & PASSWORD */}
      {activeTab === 'security' && (
        <div className="space-y-6 animate-in fade-in duration-150">
          
          {/* IN-APP DIRECT PASSWORD CHANGE CARD */}
          <Card className="p-5 sm:p-6 bg-white dark:bg-zinc-900 border-slate-200/80 dark:border-zinc-800 shadow-xs rounded-2xl">
            <CardTitle className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2 mb-1">
              <Key className="w-4 h-4 text-purple-500" />
              <span>{lang === 'bn' ? 'পাসওয়ার্ড পরিবর্তন' : 'Change Password'}</span>
            </CardTitle>
            <CardDescription className="text-xs text-slate-500 dark:text-zinc-400 mb-6">
              {lang === 'bn'
                ? 'আপনার বর্তমান পাসওয়ার্ড যাচাই করে নতুন শক্তিশালী পাসওয়ার্ড সেট করুন।'
                : 'Update your account password directly. We recommend using a mix of letters, numbers, and symbols.'}
            </CardDescription>

            <form onSubmit={handleUpdatePasswordDirect} className="space-y-4 max-w-xl">
              
              {/* Current Password */}
              <div>
                <label className="text-xs font-semibold text-slate-700 dark:text-zinc-300 block mb-1.5">
                  {lang === 'bn' ? 'বর্তমান পাসওয়ার্ড' : 'Current Password'}
                </label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <Input
                    type={showPassword.current ? 'text' : 'password'}
                    value={passwordForm.currentPassword}
                    onChange={(e) => setPasswordForm({ ...passwordForm, currentPassword: e.target.value })}
                    placeholder="••••••••"
                    className="pl-9 pr-10 text-xs h-10 font-mono"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((p) => ({ ...p, current: !p.current }))}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-zinc-200 cursor-pointer"
                  >
                    {showPassword.current ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {/* New Password */}
              <div>
                <label className="text-xs font-semibold text-slate-700 dark:text-zinc-300 block mb-1.5">
                  {lang === 'bn' ? 'নতুন পাসওয়ার্ড' : 'New Password'}
                </label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <Input
                    type={showPassword.new ? 'text' : 'password'}
                    value={passwordForm.newPassword}
                    onChange={(e) => setPasswordForm({ ...passwordForm, newPassword: e.target.value })}
                    placeholder="••••••••"
                    className="pl-9 pr-10 text-xs h-10 font-mono"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((p) => ({ ...p, new: !p.new }))}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-zinc-200 cursor-pointer"
                  >
                    {showPassword.new ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>

                {/* Password Strength Bar */}
                {passwordForm.newPassword && (
                  <div className="mt-2 space-y-1">
                    <div className="flex items-center justify-between text-[11px]">
                      <span className="text-slate-500 dark:text-zinc-400">{lang === 'bn' ? 'পাসওয়ার্ড শক্তি:' : 'Strength:'}</span>
                      <span className="font-bold text-slate-800 dark:text-zinc-200">{passwordStrength.label}</span>
                    </div>
                    <div className="w-full h-1.5 bg-slate-100 dark:bg-zinc-800 rounded-full overflow-hidden">
                      <div
                        className={`h-full ${passwordStrength.color} transition-all duration-300 rounded-full`}
                        style={{ width: `${passwordStrength.score}%` }}
                      />
                    </div>
                  </div>
                )}
              </div>

              {/* Confirm Password */}
              <div>
                <label className="text-xs font-semibold text-slate-700 dark:text-zinc-300 block mb-1.5">
                  {lang === 'bn' ? 'কনফার্ম নতুন পাসওয়ার্ড' : 'Confirm New Password'}
                </label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <Input
                    type={showPassword.confirm ? 'text' : 'password'}
                    value={passwordForm.confirmPassword}
                    onChange={(e) => setPasswordForm({ ...passwordForm, confirmPassword: e.target.value })}
                    placeholder="••••••••"
                    className="pl-9 pr-10 text-xs h-10 font-mono"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((p) => ({ ...p, confirm: !p.confirm }))}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-zinc-200 cursor-pointer"
                  >
                    {showPassword.confirm ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {/* Submit Update Password */}
              <div className="pt-2">
                <Button
                  type="submit"
                  disabled={isUpdatingPassword || !passwordForm.newPassword}
                  className="h-10 px-6 rounded-xl bg-purple-600 hover:bg-purple-700 text-white font-bold text-xs shadow-md transition-all cursor-pointer gap-2"
                >
                  {isUpdatingPassword ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>{lang === 'bn' ? 'আপডেট হচ্ছে...' : 'Updating Password...'}</span>
                    </>
                  ) : (
                    <>
                      <Key className="w-4 h-4" />
                      <span>{lang === 'bn' ? 'পাসওয়ার্ড আপডেট করুন' : 'Update Password'}</span>
                    </>
                  )}
                </Button>
              </div>

            </form>
          </Card>

          {/* EMAIL RESET LINK FALLBACK CARD */}
          <Card className="p-5 sm:p-6 bg-white dark:bg-zinc-900 border-slate-200/80 dark:border-zinc-800 shadow-xs rounded-2xl">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 rounded-xl bg-purple-500/5 border border-purple-500/15">
              <div>
                <div className="text-xs font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                  <Mail className="w-4 h-4 text-purple-500" />
                  <span>{lang === 'bn' ? 'ইমেইলে পাসওয়ার্ড রিসেট লিংক' : 'Send Password Reset Link via Email'}</span>
                </div>
                <div className="text-[11px] text-slate-500 dark:text-zinc-400 font-normal mt-0.5">
                  {lang === 'bn'
                    ? `আপনার নিবন্ধিত ইমেইল (${form.email}) এ একটি পাসওয়ার্ড রিসেট লিংক পাঠানো হবে।`
                    : `We will send an encrypted one-time password reset link to ${form.email}.`}
                </div>
              </div>

              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleSendPasswordReset}
                disabled={isSendingReset}
                className="text-xs font-semibold gap-1.5 shrink-0 border-purple-500/30 text-purple-700 dark:text-purple-300 hover:bg-purple-500/10 cursor-pointer"
              >
                {isSendingReset ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    <span>{lang === 'bn' ? 'পাঠানো হচ্ছে...' : 'Sending Link...'}</span>
                  </>
                ) : (
                  <>
                    <Key className="w-3.5 h-3.5" />
                    <span>{lang === 'bn' ? 'রিসেট লিংক পাঠান' : 'Send Reset Link'}</span>
                  </>
                )}
              </Button>
            </div>
          </Card>

          {/* ACCOUNT METADATA & UID CARD */}
          <Card className="p-5 sm:p-6 bg-white dark:bg-zinc-900 border-slate-200/80 dark:border-zinc-800 shadow-xs rounded-2xl">
            <CardTitle className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2 mb-1">
              <ShieldCheck className="w-4 h-4 text-emerald-500" />
              <span>{lang === 'bn' ? 'অ্যাকাউন্ট সিকিউরিটি ও আইডি' : 'Account Security & Unique Identifier'}</span>
            </CardTitle>
            <CardDescription className="text-xs text-slate-500 dark:text-zinc-400 mb-4">
              {lang === 'bn'
                ? 'আপনার অ্যাকাউন্টের নিরাপত্তা মেটাডেটা ও পরিচয়পত্র।'
                : 'Internal authentication IDs and session security details.'}
            </CardDescription>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* User UID */}
              <div className="p-4 rounded-xl bg-slate-50 dark:bg-zinc-800/50 border border-slate-200/70 dark:border-zinc-700/60 flex items-center justify-between gap-2">
                <div className="min-w-0">
                  <div className="text-[11px] text-slate-500 dark:text-zinc-400 font-medium">
                    {lang === 'bn' ? 'ইউনিক ইউজার আইডি (UID)' : 'Firebase Unique ID (UID)'}
                  </div>
                  <div className="text-xs font-mono font-bold text-slate-900 dark:text-zinc-200 truncate mt-0.5">
                    {mongoUser?.firebase_uid || currentUser?.uid || '—'}
                  </div>
                </div>
                <button
                  type="button"
                  onClick={copyUid}
                  className="w-8 h-8 rounded-lg bg-white dark:bg-zinc-700 border border-slate-200 dark:border-zinc-600 flex items-center justify-center text-slate-600 dark:text-zinc-300 hover:text-slate-900 dark:hover:text-white transition-colors cursor-pointer shrink-0"
                  title="Copy UID"
                >
                  <Copy className="w-3.5 h-3.5" />
                </button>
              </div>

              {/* Email Verification Status */}
              <div className="p-4 rounded-xl bg-slate-50 dark:bg-zinc-800/50 border border-slate-200/70 dark:border-zinc-700/60 flex items-center justify-between gap-2">
                <div>
                  <div className="text-[11px] text-slate-500 dark:text-zinc-400 font-medium">
                    {lang === 'bn' ? 'ইমেইল ভেরিফিকেশন' : 'Email Status'}
                  </div>
                  <div className="text-xs font-bold text-slate-900 dark:text-zinc-200 flex items-center gap-1.5 mt-0.5">
                    {isEmailVerified ? (
                      <span className="text-[#00a86b] dark:text-[#00df89] flex items-center gap-1">
                        <CheckCircle2 className="w-3.5 h-3.5" /> Verified Account
                      </span>
                    ) : (
                      <span className="text-amber-500 flex items-center gap-1">
                        <AlertCircle className="w-3.5 h-3.5" /> Pending Verification
                      </span>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </Card>

        </div>
      )}

      {/* TAB 3: STORE OUTLETS & ROLES */}
      {activeTab === 'outlets' && (
        <div className="space-y-6 animate-in fade-in duration-150">
          
          {/* ROLE OVERVIEW CARD */}
          <Card className="p-5 sm:p-6 bg-white dark:bg-zinc-900 border-slate-200/80 dark:border-zinc-800 shadow-xs rounded-2xl">
            <CardTitle className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2 mb-1">
              <Crown className="w-4 h-4 text-amber-500" />
              <span>{lang === 'bn' ? 'অ্যাকাউন্ট রোল ও পারমিশন' : 'Master Account Role & Capabilities'}</span>
            </CardTitle>
            <CardDescription className="text-xs text-slate-500 dark:text-zinc-400 mb-4">
              {lang === 'bn'
                ? 'সিস্টেমে আপনার প্রশাসনিক অ্যাক্সেস ও অনুমতিসমূহ।'
                : 'Your current system role privileges and store administration authority.'}
            </CardDescription>

            <div className="p-4 rounded-2xl bg-amber-500/5 border border-amber-500/20 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="flex items-center gap-3.5">
                <div className="w-12 h-12 rounded-2xl bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center shrink-0">
                  <Crown className="w-6 h-6" />
                </div>
                <div>
                  <div className="text-sm font-bold text-slate-900 dark:text-white capitalize flex items-center gap-2">
                    <span>{mongoUser?.role || 'Store Owner'}</span>
                    <Badge className="bg-[#00df89] text-slate-950 text-[10px] font-bold">
                      Full Access
                    </Badge>
                  </div>
                  <div className="text-xs text-slate-500 dark:text-zinc-400 mt-0.5">
                    {lang === 'bn'
                      ? 'বিক্রয়, ইনভেন্টরি, হিসাব-নিকাশ, কর্মী ও শপ কনফিগারেশনের পূর্ণ নিয়ন্ত্রণ।'
                      : 'Unrestricted control over POS, inventory, accounting, employees, and store settings.'}
                  </div>
                </div>
              </div>

              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => navigate('/settings/store')}
                className="text-xs font-bold gap-1.5 shrink-0 border-amber-500/30 text-amber-700 dark:text-amber-300 hover:bg-amber-500/10 cursor-pointer"
              >
                <span>{lang === 'bn' ? 'শপ সেটিংস ওপেন করুন' : 'Store Settings'}</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Button>
            </div>
          </Card>

          {/* LINKED STORE OUTLETS GRID */}
          <Card className="p-5 sm:p-6 bg-white dark:bg-zinc-900 border-slate-200/80 dark:border-zinc-800 shadow-xs rounded-2xl">
            <div className="flex items-center justify-between gap-4 mb-4">
              <div>
                <CardTitle className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2 mb-1">
                  <Store className="w-4 h-4 text-[#00df89]" />
                  <span>{lang === 'bn' ? `আপনার নিবন্ধিত আউটলেটসমূহ (${userShops?.length || 1})` : `Registered Store Outlets (${userShops?.length || 1})`}</span>
                </CardTitle>
                <CardDescription className="text-xs text-slate-500 dark:text-zinc-400">
                  {lang === 'bn'
                    ? 'ক্লিক করে যেকোনো দোকানে তাৎক্ষণিক সুইচ করুন।'
                    : 'Click any store outlet to switch your current active session.'}
                </CardDescription>
              </div>

              <Button
                type="button"
                size="sm"
                onClick={() => navigate('/settings/store')}
                className="h-9 px-4 rounded-xl bg-slate-900 dark:bg-white text-white dark:text-slate-900 text-xs font-bold gap-1.5 cursor-pointer shadow-xs"
              >
                <Store className="w-3.5 h-3.5 text-[#00df89]" />
                <span>{lang === 'bn' ? 'শপ কনফিগারেশন' : 'Manage Store'}</span>
              </Button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {userShops && userShops.length > 0 ? (
                userShops.map((shop) => {
                  const isCurrent = mongoShop?._id && String(mongoShop._id) === String(shop._id);
                  return (
                    <div
                      key={shop._id}
                      onClick={async () => {
                        if (isCurrent) return;
                        try {
                          await switchShop(shop._id);
                          toast.success(
                            lang === 'bn'
                              ? `'${shop.name}' আউটলেটে সুইচ করা হয়েছে!`
                              : `Switched to '${shop.name}' outlet!`
                          );
                        } catch (err) {
                          toast.error(err.message || 'Failed to switch store');
                        }
                      }}
                      className={`p-4 rounded-2xl border transition-all cursor-pointer flex items-center justify-between gap-3 ${
                        isCurrent
                          ? 'bg-emerald-500/10 border-emerald-500/40 ring-2 ring-emerald-500/20'
                          : 'bg-slate-50/80 dark:bg-zinc-800/40 border-slate-200/80 dark:border-zinc-800 hover:border-slate-300 dark:hover:border-zinc-700'
                      }`}
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-bold text-sm shrink-0 ${
                          isCurrent
                            ? 'bg-[#00df89] text-slate-950 shadow-sm'
                            : 'bg-slate-200 dark:bg-zinc-700 text-slate-700 dark:text-zinc-300'
                        }`}>
                          {shop.name[0]?.toUpperCase()}
                        </div>
                        <div className="min-w-0">
                          <div className="text-xs font-bold text-slate-900 dark:text-white truncate flex items-center gap-1.5">
                            <span>{shop.name}</span>
                          </div>
                          <div className="text-[11px] text-slate-500 dark:text-zinc-400 capitalize truncate mt-0.5">
                            {shop.business_type || 'General'} • {shop.address?.city || 'Dhaka'}
                          </div>
                        </div>
                      </div>

                      <Badge
                        className={`text-[10px] font-bold shrink-0 ${
                          isCurrent
                            ? 'bg-[#00df89] text-slate-950'
                            : 'bg-slate-200/60 dark:bg-zinc-700 text-slate-600 dark:text-zinc-300 border-0'
                        }`}
                      >
                        {isCurrent ? (lang === 'bn' ? 'সক্রিয়' : 'Active Outlet') : (lang === 'bn' ? 'সুইচ করুন' : 'Switch')}
                      </Badge>
                    </div>
                  );
                })
              ) : (
                <div className="sm:col-span-2 p-6 text-center text-xs text-slate-400 border border-dashed rounded-2xl">
                  {lang === 'bn' ? 'কোনো আউটলেট পাওয়া যায়নি।' : 'No registered outlets found.'}
                </div>
              )}
            </div>
          </Card>

        </div>
      )}

      {/* TAB 4: PREFERENCES & SOUND */}
      {activeTab === 'preferences' && (
        <div className="space-y-6 animate-in fade-in duration-150">
          
          <Card className="p-5 sm:p-6 bg-white dark:bg-zinc-900 border-slate-200/80 dark:border-zinc-800 shadow-xs rounded-2xl">
            <CardTitle className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2 mb-1">
              <Globe className="w-4 h-4 text-blue-500" />
              <span>{lang === 'bn' ? 'ভাষা ও মুদ্রা পছন্দ' : 'Language & Regional Localization'}</span>
            </CardTitle>
            <CardDescription className="text-xs text-slate-500 dark:text-zinc-400 mb-6">
              {lang === 'bn'
                ? 'সিস্টেমের ভাষা ও মুদ্রা ডিসপ্লে পরিবর্তন করুন।'
                : 'Configure interface language, font rendering, and regional currency format.'}
            </CardDescription>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              
              {/* Language Switcher */}
              <div className="p-4 rounded-xl bg-slate-50 dark:bg-zinc-800/50 border border-slate-200/70 dark:border-zinc-700/60 flex items-center justify-between">
                <div>
                  <div className="text-xs font-bold text-slate-900 dark:text-white">
                    {lang === 'bn' ? 'সিস্টেমের ভাষা' : 'Display Language'}
                  </div>
                  <div className="text-[11px] text-slate-500 dark:text-zinc-400 mt-0.5">
                    {lang === 'bn' ? 'বাংলা (Bangla)' : 'English (US)'}
                  </div>
                </div>

                <div className="flex items-center gap-1 bg-white dark:bg-zinc-900 p-1 rounded-xl border border-slate-200 dark:border-zinc-700">
                  <button
                    type="button"
                    onClick={() => setLang('en')}
                    className={`px-3 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                      lang === 'en' ? 'bg-[#00df89] text-slate-950 shadow-xs' : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
                    }`}
                  >
                    EN
                  </button>
                  <button
                    type="button"
                    onClick={() => setLang('bn')}
                    className={`px-3 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                      lang === 'bn' ? 'bg-[#00df89] text-slate-950 shadow-xs' : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
                    }`}
                  >
                    বাং
                  </button>
                </div>
              </div>

              {/* Currency Display */}
              <div className="p-4 rounded-xl bg-slate-50 dark:bg-zinc-800/50 border border-slate-200/70 dark:border-zinc-700/60 flex items-center justify-between">
                <div>
                  <div className="text-xs font-bold text-slate-900 dark:text-white">
                    {lang === 'bn' ? 'ডিফল্ট মুদ্রা' : 'Currency Symbol'}
                  </div>
                  <div className="text-[11px] text-slate-500 dark:text-zinc-400 mt-0.5">
                    Bangladeshi Taka (BDT)
                  </div>
                </div>
                <Badge className="bg-[#00df89]/20 text-[#00a86b] dark:text-[#00df89] font-mono text-xs font-bold">
                  ৳ (BDT)
                </Badge>
              </div>

            </div>
          </Card>

          {/* POS & NOTIFICATION PREFERENCES */}
          <Card className="p-5 sm:p-6 bg-white dark:bg-zinc-900 border-slate-200/80 dark:border-zinc-800 shadow-xs rounded-2xl">
            <CardTitle className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2 mb-1">
              <Zap className="w-4 h-4 text-amber-500" />
              <span>{lang === 'bn' ? 'পিওএস ও অডিও নোটিফিকেশন' : 'POS Audio & Quick Actions'}</span>
            </CardTitle>
            <CardDescription className="text-xs text-slate-500 dark:text-zinc-400 mb-6">
              {lang === 'bn'
                ? 'বিক্রয়ের সময় শব্দ ও স্বয়ংক্রিয় অ্যাকশন পরিচালনা করুন।'
                : 'Fine-tune checkout sounds, automated receipt prompts, and low stock warnings.'}
            </CardDescription>

            <div className="space-y-3">
              
              {/* POS Sound Toggle */}
              <div className="p-4 rounded-xl bg-slate-50 dark:bg-zinc-800/50 border border-slate-200/70 dark:border-zinc-700/60 flex items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${preferences.posSound ? 'bg-[#00df89]/20 text-[#00a86b] dark:text-[#00df89]' : 'bg-slate-200 dark:bg-zinc-700 text-slate-500'}`}>
                    {preferences.posSound ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
                  </div>
                  <div>
                    <div className="text-xs font-bold text-slate-900 dark:text-white">
                      {lang === 'bn' ? 'বারকোড স্ক্যান ও বিক্রয়ের শব্দ' : 'POS Beep & Checkout Sound Effects'}
                    </div>
                    <div className="text-[11px] text-slate-500 dark:text-zinc-400 mt-0.5">
                      {lang === 'bn' ? 'পণ্য কার্টে যোগ বা বিক্রয় সম্পন্ন হলে সাউন্ড বাজবে' : 'Play audio feedback on barcode scan and completed transactions'}
                    </div>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => togglePreference('posSound')}
                  className={`w-12 h-6.5 rounded-full transition-colors relative cursor-pointer ${preferences.posSound ? 'bg-[#00df89]' : 'bg-slate-300 dark:bg-zinc-700'}`}
                >
                  <div className={`w-5 h-5 rounded-full bg-white shadow-md transition-transform absolute top-0.5 ${preferences.posSound ? 'right-1' : 'left-1'}`} />
                </button>
              </div>

              {/* Low Stock Alerts */}
              <div className="p-4 rounded-xl bg-slate-50 dark:bg-zinc-800/50 border border-slate-200/70 dark:border-zinc-700/60 flex items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${preferences.lowStockAlerts ? 'bg-amber-500/20 text-amber-600 dark:text-amber-400' : 'bg-slate-200 dark:bg-zinc-700 text-slate-500'}`}>
                    <Bell className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="text-xs font-bold text-slate-900 dark:text-white">
                      {lang === 'bn' ? 'স্বল্প স্টক সতর্কতা (Low Stock Alerts)' : 'Low Stock Warning Badges'}
                    </div>
                    <div className="text-[11px] text-slate-500 dark:text-zinc-400 mt-0.5">
                      {lang === 'bn' ? 'স্টক ৫ এর নিচে নামলে লাল ব্যাজ প্রদর্শন' : 'Highlight out-of-stock and low inventory items across POS and Catalog'}
                    </div>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => togglePreference('lowStockAlerts')}
                  className={`w-12 h-6.5 rounded-full transition-colors relative cursor-pointer ${preferences.lowStockAlerts ? 'bg-[#00df89]' : 'bg-slate-300 dark:bg-zinc-700'}`}
                >
                  <div className={`w-5 h-5 rounded-full bg-white shadow-md transition-transform absolute top-0.5 ${preferences.lowStockAlerts ? 'right-1' : 'left-1'}`} />
                </button>
              </div>

              {/* Auto Print Receipt */}
              <div className="p-4 rounded-xl bg-slate-50 dark:bg-zinc-800/50 border border-slate-200/70 dark:border-zinc-700/60 flex items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${preferences.autoPrintReceipt ? 'bg-blue-500/20 text-blue-600 dark:text-blue-400' : 'bg-slate-200 dark:bg-zinc-700 text-slate-500'}`}>
                    <CheckCircle className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="text-xs font-bold text-slate-900 dark:text-white">
                      {lang === 'bn' ? 'বিক্রয় শেষে অটো প্রিন্ট প্রম্পট' : 'Auto Prompt Receipt Printing'}
                    </div>
                    <div className="text-[11px] text-slate-500 dark:text-zinc-400 mt-0.5">
                      {lang === 'bn' ? 'নতুন বিক্রয় সম্পন্ন হওয়ার সাথে সাথে প্রিন্ট ডায়ালগ ওপেন হবে' : 'Immediately prompt print dialog upon cash sale completion'}
                    </div>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => togglePreference('autoPrintReceipt')}
                  className={`w-12 h-6.5 rounded-full transition-colors relative cursor-pointer ${preferences.autoPrintReceipt ? 'bg-[#00df89]' : 'bg-slate-300 dark:bg-zinc-700'}`}
                >
                  <div className={`w-5 h-5 rounded-full bg-white shadow-md transition-transform absolute top-0.5 ${preferences.autoPrintReceipt ? 'right-1' : 'left-1'}`} />
                </button>
              </div>

            </div>
          </Card>

        </div>
      )}

    </div>
  );
}
