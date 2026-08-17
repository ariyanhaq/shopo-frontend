/**
 * @file Login.jsx
 * @description Viewport-fitted minimal SaaS Login page integrated with Firebase Authentication (Email/Password & Google).
 */
import { useState } from 'react';
import { useLanguage } from '@/context/LanguageContext';
import { useAuth, getAuthErrorMessage } from '@/context/AuthContext';
import { Store, Eye, EyeOff, Globe, AlertCircle, Loader2 } from 'lucide-react';
import { Link, useNavigate, useLocation } from 'react-router-dom';

export default function Login() {
  const { lang, setLang } = useLanguage();
  const { loginWithEmail, loginWithGoogle, isFirebaseConfigured, syncBackendProfile } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const [showPassword, setShowPassword] = useState(false);
  const [formData, setFormData] = useState({ email: '', password: '', remember: true });
  const [isLoading, setIsLoading] = useState(false);
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  const navigateAfterAuth = (profile) => {
    const hasShop = Boolean(profile?.shop?._id || profile?.user?.shop_id);
    const defaultDashboard = profile?.shop?.business_type === 'gym' ? '/gym/dashboard' : '/dashboard';
    const target = hasShop ? (location.state?.from?.pathname?.startsWith('/onboarding') ? defaultDashboard : (location.state?.from?.pathname || defaultDashboard)) : '/onboarding/business-data';
    navigate(target, { replace: true });
  };

  const handleEmailSubmit = async (e) => {
    e.preventDefault();
    setErrorMessage('');
    setIsLoading(true);

    try {
      await loginWithEmail(formData.email, formData.password);
      const profile = await syncBackendProfile();
      navigateAfterAuth(profile);
    } catch (err) {
      console.error('Login email error:', err);
      setErrorMessage(getAuthErrorMessage(err, lang));
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleSubmit = async () => {
    setErrorMessage('');
    setIsGoogleLoading(true);

    try {
      await loginWithGoogle();
      const profile = await syncBackendProfile();
      navigateAfterAuth(profile);
    } catch (err) {
      console.error('Login Google error:', err);
      setErrorMessage(getAuthErrorMessage(err, lang));
    } finally {
      setIsGoogleLoading(false);
    }
  };

  return (
    <div className="h-screen max-h-screen overflow-hidden grid grid-cols-1 lg:grid-cols-2 bg-[#FAFBFD] text-slate-800">
      
      {/* LEFT PANEL (Desktop Only - h-screen fit) */}
      <div className="hidden lg:flex flex-col justify-between p-8 lg:p-10 bg-slate-100/70 border-r border-slate-200/80 relative overflow-hidden h-screen">
        
        {/* Top Logo */}
        <Link to="/" className="flex items-center gap-2.5 w-fit">
          <div className="w-9 h-9 rounded-xl bg-[#00df89] text-[#011812] flex items-center justify-center font-extrabold shadow-sm">
            <Store className="w-5 h-5" />
          </div>
          <span className="font-extrabold text-2xl text-slate-900 tracking-tight">
            Shopo<span className="text-[#00df89]">.</span>
          </span>
        </Link>

        {/* Vector SVG Illustration */}
        <div className="my-auto py-4 flex flex-col items-center justify-center">
          <div className="relative w-64 h-56 flex items-center justify-center">
            <svg className="w-full h-full text-emerald-600" viewBox="0 0 300 250" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M70 190 H230 L240 205 H60 L70 190 Z" fill="#0f172a" />
              <rect x="85" y="110" width="130" height="80" rx="6" fill="#1e293b" />
              <rect x="92" y="117" width="116" height="66" rx="3" fill="#00df89" fillOpacity="0.15" />
              <path d="M120 200 C120 160, 180 160, 180 200 Z" fill="#00df89" />
              <circle cx="150" cy="140" r="22" fill="#fda4af" />
              <path d="M135 130 C145 115, 165 115, 165 130 C155 125, 140 125, 135 130 Z" fill="#0f172a" />
              <g transform="translate(30, 80)">
                <circle cx="24" cy="24" r="24" fill="#0f172a" />
                <path d="M24 24 L48 24 A24 24 0 0 0 24 0 Z" fill="#00df89" />
                <path d="M24 24 L24 48 A24 24 0 0 0 48 24 Z" fill="#38bdf8" />
              </g>
              <g transform="translate(210, 60)">
                <rect width="50" height="65" rx="6" fill="#ffffff" stroke="#e2e8f0" strokeWidth="2" />
                <line x1="10" y1="15" x2="40" y2="15" stroke="#00df89" strokeWidth="3" strokeLinecap="round" />
                <line x1="10" y1="28" x2="35" y2="28" stroke="#cbd5e1" strokeWidth="2" strokeLinecap="round" />
                <line x1="10" y1="38" x2="30" y2="38" stroke="#cbd5e1" strokeWidth="2" strokeLinecap="round" />
              </g>
            </svg>
          </div>
        </div>

        {/* Bottom Quote */}
        <div className="space-y-0.5 max-w-md">
          <p className="text-sm font-semibold text-slate-800 italic">
            {lang === 'bn'
              ? '"সহজ হিসাব ও সঠিক ব্যবস্থাপনাই সাফল্যের মূল চাবিকাঠি।"'
              : '"Simplicity is the soul of efficiency."'}
          </p>
          <div className="text-xs text-slate-500 font-medium">
            {lang === 'bn' ? '— অস্টিন ফ্রিম্যান' : '— Austin Freeman'}
          </div>
        </div>
      </div>

      {/* RIGHT PANEL (Form Container - h-screen fit without scrolling) */}
      <div className="flex flex-col justify-between p-6 sm:p-8 lg:p-10 h-screen overflow-y-auto lg:overflow-hidden">
        
        {/* Top Navbar Header */}
        <div className="flex items-center justify-between shrink-0">
          <Link to="/" className="flex items-center gap-2 lg:hidden">
            <div className="w-8 h-8 rounded-xl bg-[#00df89] text-[#011812] flex items-center justify-center font-bold">
              <Store className="w-4 h-4" />
            </div>
            <span className="font-extrabold text-xl text-slate-900">Shopo.</span>
          </Link>
          <div className="hidden lg:block"></div>

          {/* Language Selector Toggle */}
          <button
            type="button"
            onClick={() => setLang(lang === 'en' ? 'bn' : 'en')}
            className="text-xs font-bold px-3 py-1.5 rounded-full bg-slate-100 text-slate-700 hover:bg-slate-200 transition-all flex items-center gap-1.5 cursor-pointer"
          >
            <Globe className="w-3.5 h-3.5 text-emerald-600" />
            <span>{lang === 'en' ? 'English' : 'বাংলা'}</span>
          </button>
        </div>

        {/* Center Form Area */}
        <div className="w-full max-w-md mx-auto my-auto space-y-4 py-2">
          
          {/* Centered Logo Badge */}
          <div className="text-center space-y-1.5">
            <div className="w-12 h-12 rounded-2xl bg-[#00df89] text-[#011812] flex items-center justify-center mx-auto shadow-md shadow-[#00df89]/20 font-bold">
              <Store className="w-6 h-6" />
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
              {lang === 'bn' ? 'অ্যাকাউন্টে লগইন করুন' : 'Log in to your account'}
            </h1>
            <p className="text-xs sm:text-sm text-slate-500 font-medium leading-relaxed py-0.5">
              {lang === 'bn'
                ? 'লগইন করতে নিচে ইমেইল ও পাসওয়ার্ড দিন'
                : 'Enter your email and password below to log in'}
            </p>
          </div>

          {/* Error Banner */}
          {errorMessage && (
            <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 rounded-xl text-xs font-medium flex items-start gap-2 animate-in fade-in duration-200">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-rose-500" />
              <div className="flex-1">{errorMessage}</div>
            </div>
          )}

          {/* Firebase Setup Notice (if keys not yet supplied) */}
          {!isFirebaseConfigured && (
            <div className="p-3 bg-amber-50 border border-amber-200 text-amber-800 rounded-xl text-xs font-medium space-y-1">
              <div className="font-bold flex items-center gap-1.5">
                <span>⚠️ Firebase configuration required</span>
              </div>
              <p className="text-[11px] text-amber-700 leading-normal">
                {lang === 'bn'
                  ? 'অনুগ্রহ করে shopo-frontend/.env ফাইলে আপনার Firebase API Key যুক্ত করুন।'
                  : 'Add your Firebase API keys to shopo-frontend/.env to enable live authentication.'}
              </p>
            </div>
          )}

          <form onSubmit={handleEmailSubmit} className="space-y-3 pt-1">
            {/* Email Input */}
            <div>
              <input
                type="email"
                required
                disabled={isLoading || isGoogleLoading}
                placeholder={lang === 'bn' ? 'ইমেইল এড্রেস (যেমন: user@example.com)' : 'name@company.com'}
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                className="w-full px-4 py-2.5 sm:py-3 bg-white border border-slate-200 rounded-xl text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#00df89]/40 focus:border-emerald-500 font-medium shadow-2xs transition-all disabled:opacity-60"
              />
            </div>

            {/* Password Input */}
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                required
                disabled={isLoading || isGoogleLoading}
                placeholder={lang === 'bn' ? 'পাসওয়ার্ড' : 'Password'}
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                className="w-full pl-4 pr-10 py-2.5 sm:py-3 bg-white border border-slate-200 rounded-xl text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#00df89]/40 focus:border-emerald-500 font-medium shadow-2xs transition-all disabled:opacity-60"
              />
              <button
                type="button"
                tabIndex={-1}
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3.5 top-3 text-slate-400 hover:text-slate-600 focus:outline-none cursor-pointer"
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>

            {/* Remember Me */}
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="remember"
                checked={formData.remember}
                onChange={(e) => setFormData({ ...formData, remember: e.target.checked })}
                className="rounded border-slate-300 text-emerald-600 focus:ring-emerald-500 h-4 w-4 cursor-pointer"
              />
              <label htmlFor="remember" className="text-xs font-semibold text-slate-700 cursor-pointer">
                {lang === 'bn' ? 'মনে রাখুন' : 'Remember me'}
              </label>
            </div>

            {/* Main Log In Button */}
            <button
              type="submit"
              disabled={isLoading || isGoogleLoading}
              className="w-full py-2.5 sm:py-3 px-4 bg-[#00df89] hover:bg-[#00c97b] text-[#011812] font-bold rounded-xl text-sm shadow-md shadow-[#00df89]/20 transition-all transform active:scale-[0.99] disabled:opacity-60 flex items-center justify-center gap-2 cursor-pointer"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>{lang === 'bn' ? 'লগইন হচ্ছে...' : 'Logging in...'}</span>
                </>
              ) : (
                <span>{lang === 'bn' ? 'লগইন করুন' : 'Log in'}</span>
              )}
            </button>
          </form>

          {/* Divider */}
          <div className="relative flex items-center justify-center py-0.5">
            <div className="border-t border-slate-200 w-full"></div>
            <span className="bg-[#FAFBFD] px-3 text-xs font-semibold text-slate-400 uppercase tracking-wider relative z-10">
              {lang === 'bn' ? 'অথবা' : 'or'}
            </span>
          </div>

          {/* Google Login Option */}
          <button
            type="button"
            onClick={handleGoogleSubmit}
            disabled={isLoading || isGoogleLoading}
            className="w-full py-2.5 px-4 bg-white hover:bg-slate-50 border border-slate-200 text-slate-800 text-xs font-bold rounded-xl shadow-2xs flex items-center justify-center gap-2.5 transition-all disabled:opacity-60 cursor-pointer"
          >
            {isGoogleLoading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin text-slate-600" />
                <span>{lang === 'bn' ? 'গুগলে কানেক্ট হচ্ছে...' : 'Connecting to Google...'}</span>
              </>
            ) : (
              <>
                <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24">
                  <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                  <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                  <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" />
                  <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" />
                </svg>
                <span>{lang === 'bn' ? 'Google (Gmail) দিয়ে লগইন' : 'Continue with Google'}</span>
              </>
            )}
          </button>

          {/* Links */}
          <div className="text-center space-y-1.5 text-xs font-medium pt-1">
            <div>
              <Link to="/forgot-password" className="text-emerald-600 font-semibold hover:underline">
                {lang === 'bn' ? 'পাসওয়ার্ড ভুলে গেছেন?' : 'Forgot password?'}
              </Link>
            </div>
            <div className="text-slate-500">
              <span>{lang === 'bn' ? 'অ্যাকাউন্ট নেই?' : "Don't have an account?"} </span>
              <Link to="/register" className="font-bold text-slate-900 hover:underline">
                {lang === 'bn' ? 'রেজিস্ট্রেশন করুন' : 'Sign up'}
              </Link>
            </div>
          </div>

        </div>

        {/* Footer */}
        <div className="text-center text-[11px] text-slate-400 shrink-0">
          © {new Date().getFullYear()} Shopo. All rights reserved.
        </div>

      </div>

    </div>
  );
}
