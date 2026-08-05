/**
 * @file LoginForm.jsx
 * @description Premium bilingual Login Form component for Shopo.
 */
import { useState } from 'react';
import { useLanguage } from '@/context/LanguageContext';
import { Mail, Lock, Eye, EyeOff, ArrowRight, CheckCircle2, Globe } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';

export default function LoginForm() {
  const { lang, setLang } = useLanguage();
  const navigate = useNavigate();

  const [showPassword, setShowPassword] = useState(false);
  const [formData, setFormData] = useState({ identifier: '', password: '', remember: true });
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = (e) => {
    e.preventDefault();
    setSubmitted(true);
    setTimeout(() => {
      navigate('/dashboard');
    }, 1000);
  };

  return (
    <div className="space-y-6">
      {/* Top Header with Language Switcher */}
      <div className="flex items-center justify-between pb-2 border-b border-slate-100">
        <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">
          {lang === 'bn' ? 'মার্চেন্ট অ্যাকাউন্ট' : 'Merchant Portal'}
        </span>
        <button
          type="button"
          onClick={() => setLang(lang === 'en' ? 'bn' : 'en')}
          className="text-xs font-bold px-2.5 py-1 rounded-full bg-slate-100 text-slate-700 hover:bg-emerald-50 hover:text-emerald-700 transition-all flex items-center gap-1"
        >
          <Globe className="w-3 h-3 text-emerald-600" />
          <span>{lang === 'en' ? 'বাংলা' : 'English'}</span>
        </button>
      </div>

      <div className="space-y-2">
        <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
          {lang === 'bn' ? 'Shopo-তে স্বাগতম' : 'Welcome back to Shopo'}
        </h2>
        <p className="text-sm text-slate-500">
          {lang === 'bn'
            ? 'আপনার শপ ড্যাশবোর্ডে প্রবেশ করতে তথ্য দিন।'
            : 'Enter your credentials to access your shop dashboard.'}
        </p>
      </div>

      {submitted && (
        <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-bold rounded-xl flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>{lang === 'bn' ? 'লগইন সফল! ড্যাশবোর্ডে রিডাইরেক্ট হচ্ছে...' : 'Login successful! Redirecting to dashboard...'}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Email/Phone */}
        <div className="space-y-1.5">
          <label className="text-xs font-bold text-slate-700">
            {lang === 'bn' ? 'মোবাইল নাম্বার অথবা ইমেইল' : 'Mobile Number or Email'}
          </label>
          <div className="relative">
            <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
            <input
              type="text"
              required
              placeholder={lang === 'bn' ? 'যেমন: 01700-000000' : 'e.g. 01700-000000 or user@shop.com'}
              value={formData.identifier}
              onChange={(e) => setFormData({ ...formData, identifier: e.target.value })}
              className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 font-medium transition-all"
            />
          </div>
        </div>

        {/* Password */}
        <div className="space-y-1.5">
          <div className="flex items-center justify-between">
            <label className="text-xs font-bold text-slate-700">
              {lang === 'bn' ? 'পাসওয়ার্ড' : 'Password'}
            </label>
            <Link
              to="/forgot-password"
              className="text-xs font-semibold text-emerald-600 hover:text-emerald-700"
            >
              {lang === 'bn' ? 'পাসওয়ার্ড ভুলে গেছেন?' : 'Forgot Password?'}
            </Link>
          </div>
          <div className="relative">
            <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
            <input
              type={showPassword ? 'text' : 'password'}
              required
              placeholder="••••••••"
              value={formData.password}
              onChange={(e) => setFormData({ ...formData, password: e.target.value })}
              className="w-full pl-10 pr-10 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 font-medium transition-all"
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-3 text-slate-400 hover:text-slate-600 focus:outline-none"
            >
              {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>
        </div>

        {/* Remember Me */}
        <div className="flex items-center justify-between pt-1">
          <label className="flex items-center gap-2 cursor-pointer text-xs font-medium text-slate-600">
            <input
              type="checkbox"
              checked={formData.remember}
              onChange={(e) => setFormData({ ...formData, remember: e.target.checked })}
              className="rounded border-slate-300 text-emerald-600 focus:ring-emerald-500 h-4 w-4"
            />
            <span>{lang === 'bn' ? 'লগইন তথ্য সংরক্ষণ করুন' : 'Remember me'}</span>
          </label>
        </div>

        {/* Primary Submit Button */}
        <button
          type="submit"
          className="w-full py-3.5 px-4 bg-gradient-to-r from-[#022c22] via-[#033a2d] to-[#011e17] text-[#00df89] hover:bg-emerald-950 font-bold rounded-xl text-sm shadow-lg shadow-[#022c22]/20 flex items-center justify-center gap-2 transition-all transform hover:scale-[1.01] active:scale-[0.99]"
        >
          <span>{lang === 'bn' ? 'শপ ড্যাশবোর্ডে লগইন করুন' : 'Sign In to Shopo'}</span>
          <ArrowRight className="w-4 h-4 text-[#00df89]" />
        </button>
      </form>

      {/* Social Login Mock */}
      <div className="space-y-4 pt-2">
        <div className="relative flex items-center justify-center">
          <div className="border-t border-slate-200 w-full"></div>
          <span className="bg-white px-3 text-[11px] font-bold text-slate-400 uppercase tracking-wider relative z-10">
            {lang === 'bn' ? 'অথবা' : 'Or continue with'}
          </span>
        </div>

        <button
          type="button"
          onClick={handleSubmit}
          className="w-full py-2.5 px-4 border border-slate-200 hover:border-slate-300 bg-white hover:bg-slate-50 text-slate-700 text-xs font-bold rounded-xl shadow-2xs flex items-center justify-center gap-2 transition-all"
        >
          <svg className="w-4 h-4" viewBox="0 0 24 24">
            <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
            <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
            <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" />
            <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" />
          </svg>
          <span>{lang === 'bn' ? 'Google দিয়ে সাইন ইন করুন' : 'Sign in with Google'}</span>
        </button>
      </div>

      {/* Redirect Footer */}
      <div className="text-center pt-2 text-xs font-medium text-slate-500">
        <span>{lang === 'bn' ? 'এখনও অ্যাকাউন্ট নেই?' : "Don't have an account?"} </span>
        <Link to="/register" className="font-bold text-emerald-600 hover:text-emerald-700">
          {lang === 'bn' ? 'ফ্রি অ্যাকাউন্ট খুলুন' : 'Sign Up Free'}
        </Link>
      </div>
    </div>
  );
}
