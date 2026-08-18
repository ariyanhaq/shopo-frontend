/**
 * @file VerifyEmail.jsx
 * @description Dedicated email verification screen with live polling, instant manual status check, resend countdown, and language support.
 */
import { useState, useEffect, useRef } from 'react';
import { useLanguage } from '@/context/LanguageContext';
import { useAuth, getAuthErrorMessage } from '@/context/AuthContext';
import { Store, Mail, CheckCircle2, ArrowRight, RotateCw, LogOut, Globe, AlertCircle, Loader2, Sparkles, Inbox } from 'lucide-react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import toast from 'react-hot-toast';

export default function VerifyEmail() {
  const { lang, setLang } = useLanguage();
  const { currentUser, checkEmailVerified, sendVerificationEmail, logout, syncBackendProfile } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const targetEmail = currentUser?.email || location.state?.email || 'your email';

  const [isChecking, setIsChecking] = useState(false);
  const [isResending, setIsResending] = useState(false);
  const [resendCooldown, setResendCooldown] = useState(0);
  const [errorMessage, setErrorMessage] = useState('');
  const [isVerifiedSuccess, setIsVerifiedSuccess] = useState(false);

  const pollingRef = useRef(null);

  const handleVerifiedTransition = async () => {
    setIsVerifiedSuccess(true);
    toast.success(lang === 'bn' ? 'ইমেইল সফলভাবে ভেরিফাই হয়েছে!' : 'Email successfully verified!');
    try {
      const profile = await syncBackendProfile();
      const hasShop = Boolean(profile?.shop?._id || profile?.user?.shop_id);
      const defaultDashboard = profile?.shop?.business_type === 'gym' ? '/gym/dashboard' : '/dashboard';
      setTimeout(() => {
        navigate(hasShop ? defaultDashboard : '/onboarding/business-data', { replace: true });
      }, 1200);
    } catch {
      setTimeout(() => {
        navigate('/onboarding/business-data', { replace: true });
      }, 1200);
    }
  };

  // Manual Check
  const handleCheckStatus = async () => {
    setErrorMessage('');
    setIsChecking(true);
    try {
      const verified = await checkEmailVerified();
      if (verified) {
        await handleVerifiedTransition();
      } else {
        toast.error(
          lang === 'bn'
            ? 'ইমেইল এখনও ভেরিফাই হয়নি। অনুগ্রহ করে আপনার ইনবক্স চেক করে লিংকে ক্লিক করুন।'
            : 'Email not verified yet. Please check your inbox and click the verification link.'
        );
      }
    } catch (err) {
      console.error('Email check error:', err);
      setErrorMessage(getAuthErrorMessage(err, lang));
    } finally {
      setIsChecking(false);
    }
  };

  // Resend Verification Email
  const handleResend = async () => {
    if (resendCooldown > 0) return;
    setErrorMessage('');
    setIsResending(true);
    try {
      await sendVerificationEmail();
      toast.success(
        lang === 'bn'
          ? 'নতুন ভেরিফিকেশন লিংক আপনার ইমেইলে পাঠানো হয়েছে!'
          : 'A fresh verification link has been sent to your email!'
      );
      setResendCooldown(60);
    } catch (err) {
      console.error('Resend verification error:', err);
      setErrorMessage(getAuthErrorMessage(err, lang));
    } finally {
      setIsResending(false);
    }
  };

  // Cooldown Timer
  useEffect(() => {
    if (resendCooldown <= 0) return;
    const timer = setInterval(() => {
      setResendCooldown((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => clearInterval(timer);
  }, [resendCooldown]);

  // Background Auto-Polling
  useEffect(() => {
    if (isVerifiedSuccess) return;

    pollingRef.current = setInterval(async () => {
      try {
        const verified = await checkEmailVerified();
        if (verified) {
          clearInterval(pollingRef.current);
          await handleVerifiedTransition();
        }
      } catch (e) {
        // quiet fail on background polling
      }
    }, 4000);

    return () => {
      if (pollingRef.current) clearInterval(pollingRef.current);
    };
  }, [isVerifiedSuccess]);

  const handleLogout = async () => {
    await logout();
    navigate('/login', { replace: true });
  };

  return (
    <div className="min-h-screen grid grid-cols-1 lg:grid-cols-12 bg-[#FAFBFD]">
      
      {/* Left Panel */}
      <div className="hidden lg:flex lg:col-span-5 bg-gradient-to-br from-[#022c22] via-[#033a2d] to-[#011e17] border-r border-[#044433] text-white p-12 flex-col justify-between relative overflow-hidden">
        <div className="relative z-10 space-y-8">
          <button
            type="button"
            onClick={handleLogout}
            className="inline-flex items-center gap-2 text-xs font-bold text-[#00df89] hover:underline cursor-pointer"
          >
            <LogOut className="w-4 h-4" />
            <span>{lang === 'bn' ? 'লগইন পেজে যান' : 'Back to Login'}</span>
          </button>

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
            <Sparkles className="w-3.5 h-3.5" />
            <span>{lang === 'bn' ? 'নিরাপদ অ্যাকাউন্ট সুরক্ষা' : 'Secure Email Verification'}</span>
          </div>
          <h4 className="text-xl font-bold text-white">
            {lang === 'bn' ? 'আপনার ব্যবসা শুরু করার আগে ইমেইল ভেরিফাই করুন' : 'Verify Your Email to Protect Your Store'}
          </h4>
          <p className="text-xs text-slate-300 leading-relaxed">
            {lang === 'bn'
              ? 'নিরাপত্তা নিশ্চিত করতে এবং সঠিক লেনদেন হিসাব বজায় রাখতে আপনার ইমেইল নিশ্চিত করা বাধ্যতামূলক।'
              : 'Verifying your email ensures strong security for your store data, password recovery, and invoice records.'}
          </p>
        </div>

        <div className="relative z-10 pt-6 border-t border-[#044433] flex items-center justify-between text-xs text-slate-400">
          <div className="flex items-center gap-1.5">
            <CheckCircle2 className="w-4 h-4 text-[#00df89]" />
            <span>Instant Auto-Detection</span>
          </div>
        </div>
      </div>

      {/* Right Content Area */}
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

        {/* Center Card */}
        <div className="w-full max-w-md mx-auto my-auto space-y-6 text-center">
          
          {/* Animated Mail Icon */}
          <div className="relative mx-auto w-20 h-20 flex items-center justify-center">
            {isVerifiedSuccess ? (
              <div className="w-20 h-20 rounded-3xl bg-[#00df89]/20 text-[#00a86b] dark:text-[#00df89] flex items-center justify-center border-2 border-[#00df89] shadow-lg animate-in zoom-in-50 duration-300">
                <CheckCircle2 className="w-10 h-10" />
              </div>
            ) : (
              <>
                <div className="w-20 h-20 rounded-3xl bg-emerald-500/10 text-emerald-600 flex items-center justify-center border border-emerald-500/20 shadow-lg shadow-emerald-500/10">
                  <Mail className="w-9 h-9 animate-bounce" />
                </div>
                <div className="absolute -top-1 -right-1 w-6 h-6 rounded-full bg-amber-500 text-white flex items-center justify-center text-[10px] font-bold ring-2 ring-white">
                  !
                </div>
              </>
            )}
          </div>

          {/* Heading and Description */}
          <div className="space-y-2">
            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
              {isVerifiedSuccess
                ? (lang === 'bn' ? 'ইমেইল ভেরিফিকেশন সম্পন্ন!' : 'Email Verified!')
                : (lang === 'bn' ? 'আপনার ইমেইল ভেরিফাই করুন' : 'Verify Your Email Address')}
            </h1>
            <p className="text-xs sm:text-sm text-slate-500 font-medium leading-relaxed max-w-sm mx-auto">
              {isVerifiedSuccess ? (
                lang === 'bn'
                  ? 'আপনার অ্যাকাউন্ট সফলভাবে সক্রিয় করা হয়েছে। অপেক্ষা করুন...'
                  : 'Your account is active. Redirecting to your store...'
              ) : (
                <>
                  {lang === 'bn'
                    ? 'আমরা একটি ভেরিফিকেশন লিংক পাঠিয়েছি এই ঠিকানায়:'
                    : 'We have sent a verification link to:'}{' '}
                  <span className="font-bold text-slate-900 block mt-1 font-mono text-sm sm:text-base break-all">
                    {targetEmail}
                  </span>
                </>
              )}
            </p>
          </div>

          {/* Error Message if any */}
          {errorMessage && (
            <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 rounded-xl text-xs font-medium flex items-start gap-2 text-left">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-rose-500" />
              <div className="flex-1">{errorMessage}</div>
            </div>
          )}

          {/* How to verify guide card */}
          {!isVerifiedSuccess && (
            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80 text-left space-y-2.5 text-xs text-slate-600">
              <div className="font-bold text-slate-800 flex items-center gap-1.5">
                <Inbox className="w-4 h-4 text-emerald-600" />
                <span>{lang === 'bn' ? 'ভেরিফাই করার নিয়ম:' : 'How to complete verification:'}</span>
              </div>
              <ol className="list-decimal list-inside space-y-1 text-[11px] text-slate-500 leading-normal pl-1">
                <li>{lang === 'bn' ? 'আপনার ইমেইল ইনবক্স (অথবা স্প্যাম ফোল্ডার) খুলুন।' : 'Open your email inbox (or spam folder).'}</li>
                <li>{lang === 'bn' ? 'Shopo থেকে পাঠানো ভেরিফিকেশন লিংকে ক্লিক করুন।' : 'Click the verification link from Shopo.'}</li>
                <li>{lang === 'bn' ? 'ক্লিক করার পর নিচে "ভেরিফিকেশন চেক করুন" বাটনে চাপুন।' : 'Return here and click "I Have Verified" below.'}</li>
              </ol>
            </div>
          )}

          {/* Action Buttons */}
          {!isVerifiedSuccess && (
            <div className="space-y-3 pt-2">
              <button
                type="button"
                onClick={handleCheckStatus}
                disabled={isChecking}
                className="w-full py-3 px-4 rounded-xl bg-[#00df89] hover:bg-[#00c97b] text-[#011812] font-bold text-sm transition-all shadow-md shadow-[#00df89]/20 flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
              >
                {isChecking ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>{lang === 'bn' ? 'যাচাই করা হচ্ছে...' : 'Checking Status...'}</span>
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="w-4 h-4" />
                    <span>{lang === 'bn' ? 'আমি ভেরিফাই করেছি / স্ট্যাটাস চেক' : 'I Have Verified My Email'}</span>
                  </>
                )}
              </button>

              <div className="flex items-center justify-between gap-2 pt-1 text-xs">
                <button
                  type="button"
                  onClick={handleResend}
                  disabled={isResending || resendCooldown > 0}
                  className="font-bold text-emerald-600 hover:text-emerald-700 hover:underline flex items-center gap-1.5 cursor-pointer disabled:text-slate-400 disabled:no-underline"
                >
                  <RotateCw className={`w-3.5 h-3.5 ${isResending ? 'animate-spin' : ''}`} />
                  <span>
                    {resendCooldown > 0
                      ? (lang === 'bn' ? `পুনরায় পাঠান (${resendCooldown}s)` : `Resend Link (${resendCooldown}s)`)
                      : (lang === 'bn' ? 'ইমেইল পাননি? পুনরায় পাঠান' : "Didn't receive email? Resend")}
                  </span>
                </button>

                <button
                  type="button"
                  onClick={handleLogout}
                  className="font-bold text-slate-500 hover:text-rose-600 hover:underline flex items-center gap-1 cursor-pointer"
                >
                  <LogOut className="w-3.5 h-3.5" />
                  <span>{lang === 'bn' ? 'ভিন্ন ইমেইল / লগআউট' : 'Switch Account'}</span>
                </button>
              </div>
            </div>
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
