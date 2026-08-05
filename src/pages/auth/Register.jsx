/**
 * @file Register.jsx
 * @description Laptop screen viewport-fitted (h-screen) minimal SaaS Registration page without category dropdown.
 */
import { useState } from 'react';
import { useLanguage } from '@/context/LanguageContext';
import { Store, Eye, EyeOff, Globe } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';

export default function Register() {
  const { lang, setLang } = useLanguage();
  const navigate = useNavigate();

  const [showPassword, setShowPassword] = useState(false);
  const [formData, setFormData] = useState({
    fullName: '',
    shopName: '',
    identifier: '',
    password: ''
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    navigate('/onboarding/business-category');
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
              <rect x="50" y="160" width="200" height="40" rx="8" fill="#1e293b" />
              <rect x="70" y="120" width="60" height="40" rx="4" fill="#00df89" fillOpacity="0.2" stroke="#00df89" strokeWidth="2" />
              <rect x="150" y="100" width="80" height="60" rx="6" fill="#0f172a" />
              <rect x="158" y="108" width="64" height="44" rx="3" fill="#38bdf8" fillOpacity="0.2" />
              <path d="M110 200 C110 165, 160 165, 160 200 Z" fill="#00df89" />
              <circle cx="135" cy="145" r="20" fill="#fda4af" />
              <path d="M122 138 C130 125, 148 125, 148 138 Z" fill="#0f172a" />
              <path d="M220 50 L230 70 L250 80 L230 90 L220 110 L210 90 L190 80 L210 70 Z" fill="#00df89" opacity="0.8" />
            </svg>
          </div>
        </div>

        {/* Bottom Quote */}
        <div className="space-y-0.5 max-w-md">
          <p className="text-sm font-semibold text-slate-800 italic">
            {lang === 'bn'
              ? '"সঠিক সময়ের সিদ্ধান্তই এগিয়ে যাওয়ার মূল চাবিকাঠি।"'
              : '"The secret of getting ahead is getting started."'}
          </p>
          <div className="text-xs text-slate-500 font-medium">
            {lang === 'bn' ? '— মার্ক টোয়েন' : '— Mark Twain'}
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
            className="text-xs font-bold px-3 py-1.5 rounded-full bg-slate-100 text-slate-700 hover:bg-slate-200 transition-all flex items-center gap-1.5"
          >
            <Globe className="w-3.5 h-3.5 text-emerald-600" />
            <span>{lang === 'en' ? 'English' : 'বাংলা'}</span>
          </button>
        </div>

        {/* Center Form Area (Compact Fit) */}
        <div className="w-full max-w-md mx-auto my-auto space-y-4 py-2">
          
          {/* Centered Logo Badge */}
          <div className="text-center space-y-2">
            <div className="w-12 h-12 rounded-2xl bg-[#00df89] text-[#011812] flex items-center justify-center mx-auto shadow-md shadow-[#00df89]/20 font-bold">
              <Store className="w-6 h-6" />
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
              {lang === 'bn' ? 'ফ্রি শপ অ্যাকাউন্ট খুলুন' : 'Create your shop account'}
            </h1>
            <p className="text-xs sm:text-sm text-slate-500 font-medium leading-relaxed py-0.5">
              {lang === 'bn' ? (
                <>
                  <span className="inline-block leading-normal py-0.5 font-bold text-slate-700">১৪</span> দিনের ফ্রি ট্রায়াল শুরু করতে তথ্য দিন
                </>
              ) : (
                'Enter your details below to start your 14-day free trial'
              )}
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-3 pt-1">
            {/* Full Name & Shop Name Row */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <input
                type="text"
                required
                placeholder={lang === 'bn' ? 'আপনার নাম' : 'Full Name'}
                value={formData.fullName}
                onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#00df89]/40 focus:border-emerald-500 font-medium shadow-2xs transition-all"
              />
              <input
                type="text"
                required
                placeholder={lang === 'bn' ? 'দোকানের নাম' : 'Shop Name'}
                value={formData.shopName}
                onChange={(e) => setFormData({ ...formData, shopName: e.target.value })}
                className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#00df89]/40 focus:border-emerald-500 font-medium shadow-2xs transition-all"
              />
            </div>

            {/* Mobile / Email Input */}
            <div>
              <input
                type="text"
                required
                placeholder={lang === 'bn' ? 'মোবাইল নাম্বার বা ইমেইল' : 'email@example.com'}
                value={formData.identifier}
                onChange={(e) => setFormData({ ...formData, identifier: e.target.value })}
                className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#00df89]/40 focus:border-emerald-500 font-medium shadow-2xs transition-all"
              />
            </div>

            {/* Password Input */}
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                required
                placeholder={lang === 'bn' ? 'পাসওয়ার্ড নির্ধারণ করুন' : 'Password'}
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                className="w-full pl-4 pr-10 py-3 bg-white border border-slate-200 rounded-xl text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#00df89]/40 focus:border-emerald-500 font-medium shadow-2xs transition-all"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3.5 top-3.5 text-slate-400 hover:text-slate-600 focus:outline-none"
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>

            {/* Main Sign Up Button */}
            <button
              type="submit"
              className="w-full py-3 px-4 bg-[#00df89] hover:bg-[#00c97b] text-[#011812] font-bold rounded-xl text-sm shadow-md shadow-[#00df89]/20 transition-all transform active:scale-[0.99] mt-1"
            >
              {lang === 'bn' ? 'ফ্রি সাইন আপ করুন' : 'Sign up for free'}
            </button>
          </form>

          {/* Divider */}
          <div className="relative flex items-center justify-center py-0.5">
            <div className="border-t border-slate-200 w-full"></div>
            <span className="bg-[#FAFBFD] px-3 text-xs font-semibold text-slate-400 uppercase tracking-wider relative z-10">
              {lang === 'bn' ? 'অথবা' : 'or'}
            </span>
          </div>

          {/* Google Signup Option */}
          <button
            type="button"
            onClick={handleSubmit}
            className="w-full py-2.5 px-4 bg-white hover:bg-slate-50 border border-slate-200 text-slate-800 text-xs font-bold rounded-xl shadow-2xs flex items-center justify-center gap-2 transition-all"
          >
            <svg className="w-4 h-4" viewBox="0 0 24 24">
              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" />
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" />
            </svg>
            <span>{lang === 'bn' ? 'Google দিয়ে সাইন আপ' : 'Sign up with Google'}</span>
          </button>

          {/* Links */}
          <div className="text-center text-xs font-medium pt-0.5 text-slate-500">
            <span>{lang === 'bn' ? 'ইতিমধ্যে অ্যাকাউন্ট আছে?' : 'Already have an account?'} </span>
            <Link to="/login" className="font-bold text-slate-900 hover:underline">
              {lang === 'bn' ? 'লগইন করুন' : 'Log in'}
            </Link>
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
