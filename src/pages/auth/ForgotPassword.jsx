/**
 * @file ForgotPassword.jsx
 * @description Forgot Password page integrated with Firebase sendPasswordResetEmail.
 */
import { useState } from 'react';
import { useLanguage } from '@/context/LanguageContext';
import { useAuth, getAuthErrorMessage } from '@/context/AuthContext';
import { Store, Mail, ArrowRight, ArrowLeft, CheckCircle2, ShieldCheck, Globe, AlertCircle, Loader2 } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function ForgotPassword() {
  const { lang, setLang } = useLanguage();
  const { resetPassword } = useAuth();
  const [email, setEmail] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  const [resendCooldown, setResendCooldown] = useState(0);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email.trim()) return;
    setErrorMessage('');
    setIsLoading(true);

    try {
      await resetPassword(email);
      setSubmitted(true);
      setResendCooldown(60);
    } catch (err) {
      setErrorMessage(getAuthErrorMessage(err, lang));
    } finally {
      setIsLoading(false);
    }
  };

  const handleResend = async () => {
    if (resendCooldown > 0 || !email.trim()) return;
    setErrorMessage('');
    setIsLoading(true);
    try {
      await resetPassword(email);
      setResendCooldown(60);
    } catch (err) {
      setErrorMessage(getAuthErrorMessage(err, lang));
    } finally {
      setIsLoading(false);
    }
  };

  // Cooldown effect
  useEffect(() => {
    if (resendCooldown <= 0) return;
    const timer = setInterval(() => {
      setResendCooldown((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => clearInterval(timer);
  }, [resendCooldown]);

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
          <h4 className="text-xl font-bold text-white">
            {lang === 'bn' ? 'পাসওয়ার্ড রিকভারি সাপোর্ট' : 'Password Recovery Support'}
          </h4>
          <p className="text-xs text-slate-300 leading-relaxed">
            {lang === 'bn'
              ? 'আপনার নিবন্ধিত ইমেইলে তাৎক্ষণিক পাসওয়ার্ড রিসেট লিংক পাঠানো হবে।'
              : 'We will send an instant password reset link to your registered email address.'}
          </p>
        </div>

        <div className="relative z-10 pt-6 border-t border-[#044433] flex items-center justify-between text-xs text-slate-400">
          <div className="flex items-center gap-1.5">
            <ShieldCheck className="w-4 h-4 text-[#00df89]" />
            <span>Secure Verification</span>
          </div>
        </div>
      </div>

      {/* Right Form Area */}
      <div className="lg:col-span-7 flex flex-col justify-between p-6 sm:p-12 lg:p-16 min-h-screen">
        <div className="flex lg:hidden items-center justify-between pb-6">
          <Link to="/" className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-emerald-600 flex items-center justify-center text-white font-bold">
              <Store className="w-4 h-4" />
            </div>
            <span className="font-extrabold text-xl text-slate-900">Shopo.</span>
          </Link>
          <Link to="/login" className="text-xs font-bold text-emerald-600 hover:underline">
            {lang === 'bn' ? 'লগইন' : 'Login'}
          </Link>
        </div>

        <div className="w-full max-w-md mx-auto my-auto space-y-6">
          <div className="flex items-center justify-between pb-2 border-b border-slate-100">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">
              {lang === 'bn' ? 'পাসওয়ার্ড রিসেট' : 'Account Recovery'}
            </span>
            <button
              type="button"
              onClick={() => setLang(lang === 'en' ? 'bn' : 'en')}
              className="text-xs font-bold px-2.5 py-1 rounded-full bg-slate-100 text-slate-700 hover:bg-emerald-50 transition-all flex items-center gap-1 cursor-pointer"
            >
              <Globe className="w-3 h-3 text-emerald-600" />
              <span>{lang === 'en' ? 'English' : 'বাংলা'}</span>
            </button>
          </div>

          <div className="space-y-2">
            <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
              {lang === 'bn' ? 'পাসওয়ার্ড রিসেট করুন' : 'Reset your password'}
            </h2>
            <p className="text-sm text-slate-500">
              {lang === 'bn'
                ? 'আপনার রেজিস্টার্ড ইমেইল এড্রেস লিখুন।'
                : 'Enter your registered email address below.'}
            </p>
          </div>

          {errorMessage && (
            <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 rounded-xl text-xs font-medium flex items-start gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-rose-500" />
              <div className="flex-1">{errorMessage}</div>
            </div>
          )}

          {submitted ? (
            <div className="p-5 bg-emerald-50/80 border border-emerald-200 text-emerald-900 text-xs font-bold rounded-2xl space-y-3 animate-in zoom-in-50 duration-200">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
                <span className="text-sm">{lang === 'bn' ? 'রিসেট নির্দেশাবলী পাঠানো হয়েছে!' : 'Reset Link Dispatched!'}</span>
              </div>
              <p className="font-normal text-slate-600 leading-relaxed">
                {lang === 'bn' ? (
                  <>
                    আমরা <span className="font-bold text-slate-800">{email}</span> ঠিকানায় পাসওয়ার্ড রিসেট লিংক পাঠিয়েছি। আপনার ইনবক্স বা স্প্যাম ফোল্ডার চেক করে লিংকে ক্লিক করুন।
                  </>
                ) : (
                  <>
                    We sent a password reset link to <span className="font-bold text-slate-800">{email}</span>. Please check your inbox or spam folder and click the link.
                  </>
                )}
              </p>
              <div className="pt-2 flex items-center justify-between gap-3 border-t border-emerald-200/60">
                <button
                  type="button"
                  onClick={handleResend}
                  disabled={isLoading || resendCooldown > 0}
                  className="text-xs font-bold text-emerald-700 hover:underline cursor-pointer disabled:text-slate-400 disabled:no-underline"
                >
                  {resendCooldown > 0
                    ? (lang === 'bn' ? `পুনরায় পাঠান (${resendCooldown}s)` : `Resend (${resendCooldown}s)`)
                    : (lang === 'bn' ? 'লিংক পাননি? আবার পাঠান' : "Didn't receive? Resend")}
                </button>

                <button
                  type="button"
                  onClick={() => setSubmitted(false)}
                  className="text-xs font-bold text-slate-500 hover:text-slate-700 hover:underline cursor-pointer"
                >
                  {lang === 'bn' ? 'ভিন্ন ইমেইল ব্যবহার করুন' : 'Change Email'}
                </button>
              </div>

              <div className="pt-2">
                <Link
                  to="/login"
                  className="w-full inline-flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl bg-[#00df89] hover:bg-[#00c97b] text-[#011812] font-bold text-xs shadow-sm cursor-pointer"
                >
                  <span>{lang === 'bn' ? 'লগইন পেজে ফিরে যান' : 'Return to Login'}</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </div>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700">
                  {lang === 'bn' ? 'ইমেইল এড্রেস' : 'Email Address'}
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                  <input
                    type="email"
                    required
                    disabled={isLoading}
                    placeholder={lang === 'bn' ? 'যেমন: user@example.com' : 'email@example.com'}
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20 font-medium transition-all"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="w-full py-3.5 px-4 bg-gradient-to-r from-[#022c22] via-[#033a2d] to-[#011e17] text-[#00df89] hover:bg-emerald-950 font-bold rounded-xl text-sm shadow-lg shadow-[#022c22]/20 flex items-center justify-center gap-2 transition-all cursor-pointer disabled:opacity-60"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin text-[#00df89]" />
                    <span>{lang === 'bn' ? 'পাঠানো হচ্ছে...' : 'Sending link...'}</span>
                  </>
                ) : (
                  <>
                    <span>{lang === 'bn' ? 'রিসেট লিংক পাঠান' : 'Send Reset Link'}</span>
                    <ArrowRight className="w-4 h-4 text-[#00df89]" />
                  </>
                )}
              </button>
            </form>
          )}
        </div>

        <div className="text-center text-xs text-slate-400 pt-6">
          © {new Date().getFullYear()} Shopo. All rights reserved.
        </div>
      </div>

    </div>
  );
}
