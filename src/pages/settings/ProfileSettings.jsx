/**
 * @file ProfileSettings.jsx
 * @description Dedicated Personal Profile Settings page with live avatar customization, contact details, role overview, and security.
 */
import { useState, useEffect, useId } from 'react';
import { updateProfile as updateFirebaseProfile, sendPasswordResetEmail } from 'firebase/auth';
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
  Camera, RefreshCw, Layers
} from 'lucide-react';

const PRESET_AVATARS = [
  'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=200&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=200&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=200&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1522075469751-3a6694fb2f61?w=200&auto=format&fit=crop&q=80',
];

export default function ProfileSettings() {
  const { lang } = useLanguage();
  const { currentUser, mongoUser, userShops, syncBackendProfile } = useAuth();
  const [isSaving, setIsSaving] = useState(false);
  const [isSendingReset, setIsSendingReset] = useState(false);
  const avatarInputId = useId();

  const [form, setForm] = useState({
    name: '',
    email: '',
    phone: '',
    avatar_url: '',
    bio: '',
    address: '',
  });

  useEffect(() => {
    if (mongoUser || currentUser) {
      setForm({
        name: mongoUser?.name || currentUser?.displayName || '',
        email: mongoUser?.email || currentUser?.email || '',
        phone: mongoUser?.phone || '',
        avatar_url: mongoUser?.avatar_url || currentUser?.photoURL || '',
        bio: mongoUser?.bio || '',
        address: mongoUser?.address || '',
      });
    }
  }, [mongoUser, currentUser]);

  const handleAvatarFileUpload = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 2 * 1024 * 1024) {
      toast.error(lang === 'bn' ? 'ছবির সাইজ ২MB এর কম হতে হবে।' : 'Avatar image must be under 2MB.');
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      setForm(prev => ({ ...prev, avatar_url: reader.result }));
    };
    reader.readAsDataURL(file);
  };

  const handleSaveProfile = async (e) => {
    e.preventDefault();
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

      // 2. Sync Firebase Auth Profile if authenticated
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

      // 3. Sync local context
      await syncBackendProfile(true);

      toast.success(
        lang === 'bn'
          ? 'ব্যক্তিগত প্রোফাইল সফলভাবে আপডেট হয়েছে!'
          : 'Personal profile updated successfully!'
      );
    } catch (err) {
      console.error('Update profile error:', err);
      toast.error(err.message || 'Failed to update profile.');
    } finally {
      setIsSaving(false);
    }
  };

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

  const copyUid = () => {
    if (mongoUser?.firebase_uid || currentUser?.uid) {
      navigator.clipboard.writeText(mongoUser?.firebase_uid || currentUser?.uid);
      toast.success('UID copied to clipboard');
    }
  };

  return (
    <div className="max-w-4xl space-y-6 font-sans pb-16">
      
      {/* ---------------------------------------------------- */}
      {/* HEADER SECTION                                       */}
      {/* ---------------------------------------------------- */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white tracking-tight flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-blue-500/10 text-blue-500 flex items-center justify-center">
              <User className="w-4 h-4" />
            </div>
            <span>{lang === 'bn' ? 'প্রোফাইল সেটিংস' : 'Profile Settings'}</span>
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-zinc-400 font-normal mt-0.5">
            {lang === 'bn'
              ? 'আপনার নাম, প্রোফাইল ছবি, যোগাযোগের নম্বর ও নিরাপত্তা তথ্য পরিচালনা করুন।'
              : 'Manage your personal account credentials, profile photo, contact details, and security.'}
          </p>
        </div>
      </div>

      <form onSubmit={handleSaveProfile} className="space-y-6">

        {/* ---------------------------------------------------- */}
        {/* AVATAR & IDENTITY CARD                               */}
        {/* ---------------------------------------------------- */}
        <Card className="p-5 sm:p-6 bg-white dark:bg-zinc-900 border-slate-200/80 dark:border-zinc-800 shadow-xs rounded-2xl">
          <CardTitle className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2 mb-1">
            <Sparkles className="w-4 h-4 text-[#00df89]" />
            <span>{lang === 'bn' ? 'প্রোফাইল ছবি ও পরিচয়' : 'Profile Photo & Identity'}</span>
          </CardTitle>
          <CardDescription className="text-xs text-slate-500 dark:text-zinc-400 mb-6">
            {lang === 'bn'
              ? 'আপনার পছন্দের অ্যাভাটার নির্বাচন করুন অথবা নতুন ছবি আপলোড করুন।'
              : 'Choose a preset avatar or upload your custom profile picture.'}
          </CardDescription>

          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-6">
            {/* Avatar Preview */}
            <div className="relative group">
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
                className="absolute -bottom-2 -right-2 w-8 h-8 rounded-xl bg-slate-900 text-white dark:bg-white dark:text-slate-900 flex items-center justify-center cursor-pointer shadow-md hover:scale-105 transition-transform"
                title="Upload Photo"
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

            {/* Avatar Actions & Presets */}
            <div className="space-y-3 flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <span className="text-xs font-semibold text-slate-700 dark:text-zinc-300">
                  {lang === 'bn' ? 'রেডিমেড অ্যাভাটার সিলেক্ট করুন:' : 'Pick a Preset Avatar:'}
                </span>
                {form.avatar_url && (
                  <button
                    type="button"
                    onClick={() => setForm(prev => ({ ...prev, avatar_url: '' }))}
                    className="text-[11px] text-rose-500 hover:underline cursor-pointer ml-auto"
                  >
                    {lang === 'bn' ? 'ছবি রিমুভ করুন' : 'Remove Photo'}
                  </button>
                )}
              </div>

              {/* Preset Avatar Bubbles */}
              <div className="flex items-center gap-2.5 flex-wrap">
                {PRESET_AVATARS.map((url, idx) => (
                  <button
                    type="button"
                    key={idx}
                    onClick={() => setForm(prev => ({ ...prev, avatar_url: url }))}
                    className={`w-10 h-10 rounded-xl overflow-hidden border-2 transition-all cursor-pointer hover:scale-105 ${
                      form.avatar_url === url
                        ? 'border-[#00df89] ring-2 ring-[#00df89]/30 scale-105'
                        : 'border-transparent opacity-75 hover:opacity-100'
                    }`}
                  >
                    <img src={url} alt={`Preset ${idx}`} className="w-full h-full object-cover" />
                  </button>
                ))}
              </div>

              {/* Direct URL Input */}
              <div className="pt-1">
                <Input
                  value={form.avatar_url}
                  onChange={(e) => setForm({ ...form, avatar_url: e.target.value })}
                  placeholder={lang === 'bn' ? 'অথবা ছবির ডিরেক্ট ওয়েব লিংক পেস্ট করুন...' : 'Or paste a direct image URL...'}
                  className="text-xs h-9"
                />
              </div>
            </div>
          </div>
        </Card>

        {/* ---------------------------------------------------- */}
        {/* PERSONAL DETAILS CARD                                */}
        {/* ---------------------------------------------------- */}
        <Card className="p-5 sm:p-6 bg-white dark:bg-zinc-900 border-slate-200/80 dark:border-zinc-800 shadow-xs rounded-2xl">
          <CardTitle className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2 mb-1">
            <User className="w-4 h-4 text-blue-500" />
            <span>{lang === 'bn' ? 'ব্যক্তিগত তথ্য' : 'Personal Information'}</span>
          </CardTitle>
          <CardDescription className="text-xs text-slate-500 dark:text-zinc-400 mb-6">
            {lang === 'bn'
              ? 'ইনভয়েস এবং কর্মীদের তালিকায় আপনার নাম ও পদবি প্রদর্শিত হবে।'
              : 'Your full name, phone number, and designation across the system.'}
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

            {/* Email Address (Readonly with Verified Badge) */}
            <div>
              <label className="text-xs font-semibold text-slate-700 dark:text-zinc-300 block mb-1.5 flex items-center justify-between">
                <span>{lang === 'bn' ? 'ইমেইল অ্যাড্রেস' : 'Email Address'}</span>
                <span className="text-[10px] text-emerald-600 dark:text-emerald-400 flex items-center gap-1 font-medium">
                  <CheckCircle2 className="w-3 h-3" /> {lang === 'bn' ? 'ভেরিফাইড' : 'Verified'}
                </span>
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
                  className="pl-9 text-xs h-10"
                />
              </div>
            </div>

            {/* Designation / Bio */}
            <div>
              <label className="text-xs font-semibold text-slate-700 dark:text-zinc-300 block mb-1.5">
                {lang === 'bn' ? 'পদবি / পরিচয়' : 'Designation / Title'}
              </label>
              <Input
                value={form.bio}
                onChange={(e) => setForm({ ...form, bio: e.target.value })}
                placeholder={lang === 'bn' ? 'যেমন: প্রধান নির্বাহী / শপ ওনার' : 'e.g. Managing Director / Founder'}
                className="text-xs h-10"
              />
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
                  placeholder={lang === 'bn' ? 'বাসা, রোড, এলাকা, জেলা' : 'House, Street, City, Bangladesh'}
                  className="pl-9 text-xs h-10"
                />
              </div>
            </div>

          </div>
        </Card>

        {/* ---------------------------------------------------- */}
        {/* ROLE & STORE PERMISSIONS CARD                        */}
        {/* ---------------------------------------------------- */}
        <Card className="p-5 sm:p-6 bg-white dark:bg-zinc-900 border-slate-200/80 dark:border-zinc-800 shadow-xs rounded-2xl">
          <CardTitle className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2 mb-1">
            <Crown className="w-4 h-4 text-amber-500" />
            <span>{lang === 'bn' ? 'রোল ও আউটলেট অ্যাক্সেস' : 'Role & Store Access'}</span>
          </CardTitle>
          <CardDescription className="text-xs text-slate-500 dark:text-zinc-400 mb-4">
            {lang === 'bn'
              ? 'আপনার বর্তমান সিস্টেম রোল এবং লিঙ্ক করা আউটলেটসমূহ।'
              : 'Your master administrative rights and linked retail outlets.'}
          </CardDescription>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            
            {/* Role Badge Card */}
            <div className="p-4 rounded-xl bg-slate-50 dark:bg-zinc-800/50 border border-slate-200/70 dark:border-zinc-700/60 flex items-center gap-3.5">
              <div className="w-10 h-10 rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center shrink-0">
                <Crown className="w-5 h-5" />
              </div>
              <div>
                <div className="text-[11px] text-slate-500 dark:text-zinc-400 font-medium">
                  {lang === 'bn' ? 'অ্যাকাউন্ট রোল' : 'Account Role'}
                </div>
                <div className="text-sm font-bold text-slate-900 dark:text-white capitalize flex items-center gap-2">
                  <span>{mongoUser?.role || 'Store Owner'}</span>
                  <Badge variant="outline" className="text-[10px] bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20 py-0">
                    Master Admin
                  </Badge>
                </div>
              </div>
            </div>

            {/* User UID Card */}
            <div className="p-4 rounded-xl bg-slate-50 dark:bg-zinc-800/50 border border-slate-200/70 dark:border-zinc-700/60 flex items-center justify-between gap-2">
              <div className="min-w-0">
                <div className="text-[11px] text-slate-500 dark:text-zinc-400 font-medium">
                  {lang === 'bn' ? 'ইউজার আইডি (UID)' : 'User Unique ID (UID)'}
                </div>
                <div className="text-xs font-mono font-bold text-slate-900 dark:text-zinc-200 truncate">
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

          </div>

          {/* Owned Outlets List */}
          {userShops && userShops.length > 0 && (
            <div className="mt-4 pt-4 border-t border-slate-100 dark:border-zinc-800">
              <div className="text-xs font-semibold text-slate-700 dark:text-zinc-300 mb-2.5 flex items-center gap-1.5">
                <Store className="w-3.5 h-3.5 text-[#00df89]" />
                <span>{lang === 'bn' ? `আপনার মালিকানাধীন দোকানসমূহ (${userShops.length})` : `Your Registered Outlets (${userShops.length})`}</span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                {userShops.map((shop) => (
                  <div
                    key={shop._id}
                    className="p-3 rounded-xl bg-slate-50/80 dark:bg-zinc-800/40 border border-slate-200/60 dark:border-zinc-800 flex items-center justify-between"
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div className="w-7 h-7 rounded-lg bg-[#00df89]/10 text-[#00a86b] dark:text-[#00df89] flex items-center justify-center font-bold text-xs shrink-0">
                        {shop.name[0]?.toUpperCase()}
                      </div>
                      <div className="min-w-0">
                        <div className="text-xs font-bold text-slate-900 dark:text-white truncate">
                          {shop.name}
                        </div>
                        <div className="text-[10px] text-slate-500 dark:text-zinc-400 capitalize truncate">
                          {shop.business_type} • {shop.address?.city || 'Dhaka'}
                        </div>
                      </div>
                    </div>
                    <Badge variant="outline" className="text-[10px] text-slate-600 dark:text-zinc-400">
                      Active
                    </Badge>
                  </div>
                ))}
              </div>
            </div>
          )}
        </Card>

        {/* ---------------------------------------------------- */}
        {/* SECURITY & PASSWORD CARD                             */}
        {/* ---------------------------------------------------- */}
        <Card className="p-5 sm:p-6 bg-white dark:bg-zinc-900 border-slate-200/80 dark:border-zinc-800 shadow-xs rounded-2xl">
          <CardTitle className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2 mb-1">
            <Lock className="w-4 h-4 text-purple-500" />
            <span>{lang === 'bn' ? 'নিরাপত্তা ও পাসওয়ার্ড' : 'Security & Authentication'}</span>
          </CardTitle>
          <CardDescription className="text-xs text-slate-500 dark:text-zinc-400 mb-4">
            {lang === 'bn'
              ? 'আপনার অ্যাকাউন্টের পাসওয়ার্ড পরিবর্তন বা রিসেট করুন।'
              : 'Manage password credentials and account security.'}
          </CardDescription>

          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 rounded-xl bg-purple-500/5 border border-purple-500/15">
            <div>
              <div className="text-xs font-bold text-slate-900 dark:text-white">
                {lang === 'bn' ? 'পাসওয়ার্ড পরিবর্তন' : 'Change Password'}
              </div>
              <div className="text-[11px] text-slate-500 dark:text-zinc-400 font-normal mt-0.5">
                {lang === 'bn'
                  ? 'আপনার ইমেইলে একটি সুরক্ষিত পাসওয়ার্ড রিসেট লিংক পাঠানো হবে।'
                  : 'We will send a secure password reset link directly to your verified email.'}
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
                  <span>{lang === 'bn' ? 'পাঠানো হচ্ছে...' : 'Sending...'}</span>
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

        {/* ---------------------------------------------------- */}
        {/* SUBMIT BUTTON BAR                                    */}
        {/* ---------------------------------------------------- */}
        <div className="flex items-center justify-end gap-3 pt-2">
          <Button
            type="submit"
            disabled={isSaving}
            className="h-11 px-7 rounded-xl bg-[#00df89] hover:bg-[#00c578] text-[#011812] font-bold text-xs shadow-md hover:shadow-lg transition-all cursor-pointer gap-2"
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
    </div>
  );
}
