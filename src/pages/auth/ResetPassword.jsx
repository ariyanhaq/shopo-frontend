/**
 * @file ResetPassword.jsx
 * @description Password Reset page handling Firebase oobCode reset links with password validation and instant login transition.
 */
import { useState, useEffect } from 'react';
import { useLanguage } from '@/context/LanguageContext';
import { useAuth, getAuthErrorMessage } from '@/context/AuthContext';
import { Store, Lock, Eye, EyeOff, CheckCircle2, ArrowRight, ArrowLeft, ShieldCheck, Globe, AlertCircle, Loader2, KeyRound } from 'lucide-react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import toast from 'react-hot-toast';

export default function ResetPassword() {
  const { lang, setLang } = useLanguage();
  const { verifyResetCode, confirmNewPassword } = useAuth();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  const oobCode = searchParams.get('oobCode') || searchParams.get('code') || '';

  const [targetEmail, setTargetEmail] = useState('');
  const [isValidatingCode, setIsValidatingCode] = useState(true);
  const [codeError, setCodeError] = useState('');

  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [isSuccess, setIsSuccess] = useState(false);

  // Validate the reset code on component mount
  useEffect(() => {
    if (!oobCode) {
      setIsValidatingCode(false);
      setCodeError(
        lang === 'bn'
          ? 'কোন ভ্যালিড পাসওয়ার্ড রিসেট কোড পাওয়া যায়নি। অনুগ্রহ করে নতুন করে চেষ্টা করুন।'
          : 'No password reset code found in URL. Please request a new reset link.'
      );
      return;
    }

    const checkCode = async () => {
      try {
        const email = await verifyResetCode(oobCode);
        setTargetEmail(email || '');
      } catch (err) {
        console.error('Reset code validation error:', err);
        setCodeError(getAuthErrorMessage(err, lang));
      } finally {
        setIsValidatingCode(false);
      }
    };

    checkCode();
  }, [oobCode, lang]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMessage('');

    if (password.length < 6) {
      setErrorMessage(
        lang === 'bn'
          ? 'পাসওয়ার্ড কমপক্ষে ৬ অক্ষরের হতে হবে।'
          : 'Password must be at least 6 characters long.'
      );
      return;
    }

    if (password !== confirmPassword) {
      setErrorMessage(
        lang === 'bn'
          ? 'উভয় পাসওয়ার্ড হুবহু এক হতে হবে।'
          : 'Passwords do not match. Please recheck.'
      );
      return;
    }

    setIsLoading(true);
    try {
      await confirmNewPassword(oobCode, password);
      setIsSuccess(true);
      toast.success(
        lang === 'bn'
          ? 'পাসওয়ার্ড সফলভাবে পরিবর্তন করা হয়েছে!'
          : 'Password updated successfully!'
      );
    } catch (err) {
      console.error('Reset password error:', err);
      setErrorMessage(getAuthErrorMessage(err, lang));
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen grid grid-cols-1 lg:grid-cols-12 bg-[#FAFBFD]">
      
      {/* Left Panel */}
      <div className="hidden lg:flex lg:col-span-5 bg-gradient-to-br from-[#022c22] via-[#033a2d] to-[#011e17] border-r border-[#044433] text-white p-12 flex-col justify-between relative overflow-hidden">
        <div className="relative z-10 space-y-8">
          <Link to="/login" className="inline-flex items-center gap-2 text-xs font-bold text-[#00df89] hover:underline">
            <ArrowLeft className="w-4 h-4" />
            <span>{lang === 'bn' ? 'লগইনে ফিরে যান' : 'Back to Login'}</span>
          </Link>

          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#00df89] flex items-center justify-center text-[#011812] font-bold shadow-md">
              <Store className="w-6 h-6" />
            </div>
            <span className="font-extrabold text-2xl text-white tracking-tight">
              Shopo<span className="text-[#00df89]">.</span>
            </span>
          </div>
        </div>

        <div className="relative z-10 space-y-4 max-w-sm">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#00df89]/20 text-[#00df89] text-xs font-bold border border-[#00df89]/30">
            <KeyRound className="w-3.5 h-3.5" />
            <span>{lang === 'bn' ? 'নতুন পাসওয়ার্ড সেট' : 'Secure Password Reset'}</span>
          </div>
          <h4 className="text-xl font-bold text-white">
            {lang === 'bn' ? 'শক্তিশালী ও সুরক্ষিত নতুন পাসওয়ার্ড দিন' : 'Create a New Secure Password'}
          </h4>
          <p className="text-xs text-slate-300 leading-relaxed">
            {lang === 'bn'
              ? 'আপনার দোকানের নিরাপত্তা নিশ্চিত করতে একটি শক্তিশালী ও নিরাপদ পাসওয়ার্ড তৈরি করুন।'
              : 'Protect your store account with a unique and strong password.'}
          </p>
        </div>

        <div className="relative z-10 pt-6 border-t border-[#044433] flex items-center justify-between text-xs text-slate-400">
          <div className="flex items-center gap-1.5">
            <ShieldCheck className="w-4 h-4 text-[#00df89]" />
            <span>End-to-End Encrypted</span>
          </div>
        </div>
      </div>

      {/* Right Form Area */}
      <div className="lg:col-span-7 flex flex-col justify-between p-6 sm:p-12 lg:p-16 min-h-screen">
        
        {/* Top Mobile Bar & Language Toggle */}
        <div className="flex items-center justify-between pb-6">
          <div className="flex lg:hidden items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-emerald-600 flex items-center justify-center text-white font-bold">
              <Store className="w-4 h-4" />
            </div>
            <span className="font-extrabold text-xl text-slate-900">Shopo.</span>
          </div>
          
          <button
            type="button"
            onClick={() => setLang(lang === 'en' ? 'bn' : 'en')}
            className="ml-auto text-xs font-bold px-3 py-1.5 rounded-full bg-slate-100 text-slate-700 hover:bg-slate-200 transition-all flex items-center gap-1.5 cursor-pointer"
          >
            <Globe className="w-3.5 h-3.5 text-emerald-600" />
            <span>{lang === 'en' ? 'English' : 'বাংলা'}</span>
          </button>
        </div>

        {/* Center Card Area */}
        <div className="w-full max-w-md mx-auto my-auto space-y-6">
          
          {isValidatingCode ? (
            <div className="py-12 text-center space-y-3">
              <Loader2 className="w-8 h-8 animate-spin text-[#00df89] mx-auto" />
              <p className="text-xs text-slate-500 font-medium">
                {lang === 'bn' ? 'রিসেট লিংক যাচাই করা হচ্ছে...' : 'Verifying reset link...'}
              </p>
            </div>
          ) : codeError ? (
            <div className="text-center space-y-5 py-6">
              <div className="w-16 h-16 rounded-3xl bg-rose-500/10 text-rose-600 flex items-center justify-center mx-auto border border-rose-500/20 shadow-md">
                <AlertCircle className="w-8 h-8" />
              </div>
              <div className="space-y-1.5">
                <h2 className="text-xl font-bold text-slate-900">
                  {lang === 'bn' ? 'লিংকটি কার্যকর নয়' : 'Invalid or Expired Link'}
                </h2>
                <p className="text-xs text-slate-500 max-w-sm mx-auto leading-relaxed">
                  {codeError}
                </p>
              </div>
              <div className="pt-2">
                <Link
                  to="/forgot-password"
                  className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-[#00df89] hover:bg-[#00c97b] text-[#011812] font-bold text-xs transition-all shadow-md cursor-pointer"
                >
                  <KeyRound className="w-4 h-4" />
                  <span>{lang === 'bn' ? 'নতুন লিংকের জন্য আবেদন করুন' : 'Request New Reset Link'}</span>
                </Link>
              </div>
            </div>
          ) : isSuccess ? (
            <div className="text-center space-y-5 py-6 animate-in zoom-in-50 duration-300">
              <div className="w-16 h-16 rounded-3xl bg-[#00df89]/20 text-[#00a86b] dark:text-[#00df89] flex items-center justify-center mx-auto border-2 border-[#00df89] shadow-lg">
                <CheckCircle2 className="w-8 h-8" />
              </div>
              <div className="space-y-1.5">
                <h2 className="text-2xl font-bold text-slate-900">
                  {lang === 'bn' ? 'পাসওয়ার্ড সফলভাবে সেট হয়েছে!' : 'Password Reset Complete!'}
                </h2>
                <p className="text-xs text-slate-500 max-w-sm mx-auto leading-relaxed">
                  {lang === 'bn'
                    ? 'আপনার নতুন পাসওয়ার্ড দিয়ে এখন অনায়াসে লগইন করতে পারেন।'
                    : 'You can now log into your Shopo store using your new password.'}
                </p>
              </div>
              <div className="pt-2">
                <Link
                  to="/login"
                  className="w-full inline-flex items-center justify-center gap-2 py-3 px-4 rounded-xl bg-[#00df89] hover:bg-[#00c97b] text-[#011812] font-bold text-sm transition-all shadow-md shadow-[#00df89]/20 cursor-pointer"
                >
                  <span>{lang === 'bn' ? 'লগইন করুন' : 'Log In Now'}</span>
                  <ArrowRight className="w-4 h-4" />
                </Link>
              </div>
            </div>
          ) : (
            <>
              {/* Reset Form */}
              <div className="space-y-2 text-center">
                <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 text-emerald-600 flex items-center justify-center mx-auto mb-2 border border-emerald-500/20">
                  <Lock className="w-6 h-6" />
                </div>
                <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
                  {lang === 'bn' ? 'নতুন পাসওয়ার্ড দিন' : 'Set New Password'}
                </h1>
                {targetEmail && (
                  <p className="text-xs text-slate-500 font-medium">
                    {lang === 'bn' ? 'অ্যাকাউন্ট:' : 'For account:'}{' '}
                    <span className="font-bold text-slate-800 font-mono">{targetEmail}</span>
                  </p>
                )}
              </div>

              {errorMessage && (
                <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 rounded-xl text-xs font-medium flex items-start gap-2 text-left">
                  <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-rose-500" />
                  <div className="flex-1">{errorMessage}</div>
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-4 pt-2">
                {/* New Password */}
                <div className="space-y-1 text-left">
                  <label className="text-xs font-bold text-slate-700 block">
                    {lang === 'bn' ? 'নতুন পাসওয়ার্ড' : 'New Password'}
                  </label>
                  <div className="relative">
                    <input
                      type={showPassword ? 'text' : 'password'}
                      required
                      placeholder="••••••••"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="w-full pl-3 pr-10 py-2.5 rounded-xl border border-slate-200 focus:border-[#00df89] focus:ring-2 focus:ring-[#00df89]/20 outline-none text-sm transition-all bg-white"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer"
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                  <span className="text-[10px] text-slate-400">
                    {lang === 'bn' ? 'কমপক্ষে ৬ অক্ষর' : 'At least 6 characters'}
                  </span>
                </div>

                {/* Confirm Password */}
                <div className="space-y-1 text-left">
                  <label className="text-xs font-bold text-slate-700 block">
                    {lang === 'bn' ? 'পাসওয়ার্ড নিশ্চিত করুন' : 'Confirm New Password'}
                  </label>
                  <div className="relative">
                    <input
                      type={showConfirmPassword ? 'text' : 'password'}
                      required
                      placeholder="••••••••"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      className={`w-full pl-3 pr-10 py-2.5 rounded-xl border ${
                        confirmPassword && confirmPassword !== password
                          ? 'border-rose-300 focus:border-rose-500 focus:ring-rose-200'
                          : 'border-slate-200 focus:border-[#00df89] focus:ring-[#00df89]/20'
                      } outline-none text-sm transition-all bg-white`}
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer"
                    >
                      {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full py-3 px-4 rounded-xl bg-[#00df89] hover:bg-[#00c97b] text-[#011812] font-bold text-sm transition-all shadow-md shadow-[#00df89]/20 flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 mt-2"
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>{lang === 'bn' ? 'সেভ করা হচ্ছে...' : 'Saving New Password...'}</span>
                    </>
                  ) : (
                    <>
                      <span>{lang === 'bn' ? 'পাসওয়ার্ড পরিবর্তন করুন' : 'Update Password'}</span>
                      <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                </button>
              </form>
            </>
          )}

        </div>

        {/* Footer */}
        <div className="pt-6 text-center text-xs text-slate-400">
          Shopo. &copy; {new Date().getFullYear()} — {lang === 'bn' ? 'স্মার্ট বিজনেস সল্যুশন' : 'Smart Retail & Business Management'}
        </div>

      </div>

    </div>
  );
}
