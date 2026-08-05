/**
 * @file RegisterForm.jsx
 * @description Premium bilingual Registration Form component for Shopo.
 */
import { useState } from 'react';
import { useLanguage } from '@/context/LanguageContext';
import { User, Store, Mail, Lock, Eye, EyeOff, ArrowRight, CheckCircle2, Globe, Building2 } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';

export default function RegisterForm() {
  const { lang, setLang } = useLanguage();
  const navigate = useNavigate();

  const [showPassword, setShowPassword] = useState(false);
  const [formData, setFormData] = useState({
    fullName: '',
    shopName: '',
    identifier: '',
    category: 'grocery',
    password: '',
    terms: true
  });
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
          {lang === 'bn' ? 'ফ্রি সাইন আপ' : 'Merchant Registration'}
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
          {lang === 'bn' ? '১৪ দিনের ফ্রি ট্রায়াল শুরু করুন' : 'Start your 14-day free trial'}
        </h2>
        <p className="text-sm text-slate-500">
          {lang === 'bn'
            ? 'কোনো ক্রেডিট কার্ড লাগবে না। ২ মিনিটে আপনার শপ রেজিস্ট্রেশন সম্পন্ন করুন।'
            : 'No credit card required. Set up your shop operations in 2 minutes.'}
        </p>
      </div>

      {submitted && (
        <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-bold rounded-xl flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>{lang === 'bn' ? 'অ্যালাউন্ট সফলভাবে তৈরি হয়েছে! ড্যাশবোর্ডে রিডাইরেক্ট হচ্ছে...' : 'Account created successfully! Redirecting...'}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Full Name */}
        <div className="space-y-1.5">
          <label className="text-xs font-bold text-slate-700">
            {lang === 'bn' ? 'আপনার পূর্ণ নাম' : 'Full Name'}
          </label>
          <div className="relative">
            <User className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
            <input
              type="text"
              required
              placeholder={lang === 'bn' ? 'যেমন: কামাল হোসেন' : 'e.g. Kamal Hossain'}
              value={formData.fullName}
              onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
              className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 font-medium transition-all"
            />
          </div>
        </div>

        {/* Shop Name & Category Row */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-700">
              {lang === 'bn' ? 'দোকানের নাম' : 'Shop / Business Name'}
            </label>
            <div className="relative">
              <Store className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
              <input
                type="text"
                required
                placeholder={lang === 'bn' ? 'যেমন: রহমান স্টোর' : 'e.g. Rahman Store'}
                value={formData.shopName}
                onChange={(e) => setFormData({ ...formData, shopName: e.target.value })}
                className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 font-medium transition-all"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-700">
              {lang === 'bn' ? 'ব্যবসার ক্যাটাগরি' : 'Business Category'}
            </label>
            <div className="relative">
              <Building2 className="w-4 h-4 text-slate-400 absolute left-3.5 top-3 pointer-events-none" />
              <select
                value={formData.category}
                onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 font-medium transition-all appearance-none cursor-pointer"
              >
                <option value="grocery">{lang === 'bn' ? 'মুদি দোকান' : 'Grocery Shop'}</option>
                <option value="clothing">{lang === 'bn' ? 'পোশাকের দোকান' : 'Clothing Store'}</option>
                <option value="restaurant">{lang === 'bn' ? 'রেস্তোরাঁ ও ক্যাফে' : 'Restaurant & Cafe'}</option>
                <option value="electronics">{lang === 'bn' ? 'ইলেকট্রনিক্স শপ' : 'Electronics Shop'}</option>
                <option value="gym">{lang === 'bn' ? 'জিমে ও ফিটনেস' : 'Gym & Fitness'}</option>
                <option value="stationery">{lang === 'bn' ? 'লাইব্রেরি ও স্টেশনারি' : 'Stationery Shop'}</option>
              </select>
            </div>
          </div>
        </div>

        {/* Mobile Number / Email */}
        <div className="space-y-1.5">
          <label className="text-xs font-bold text-slate-700">
            {lang === 'bn' ? 'মোবাইল নাম্বার অথবা ইমেইল' : 'Mobile Number or Email'}
          </label>
          <div className="relative">
            <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
            <input
              type="text"
              required
              placeholder={lang === 'bn' ? 'যেমন: 01700-000000' : '01700-000000 or email@shop.com'}
              value={formData.identifier}
              onChange={(e) => setFormData({ ...formData, identifier: e.target.value })}
              className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 font-medium transition-all"
            />
          </div>
        </div>

        {/* Password */}
        <div className="space-y-1.5">
          <label className="text-xs font-bold text-slate-700">
            {lang === 'bn' ? 'পাসওয়ার্ড সেট করুন' : 'Set Password'}
          </label>
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

        {/* Terms Agreement */}
        <div className="flex items-center gap-2 pt-1">
          <input
            type="checkbox"
            required
            checked={formData.terms}
            onChange={(e) => setFormData({ ...formData, terms: e.target.checked })}
            className="rounded border-slate-300 text-emerald-600 focus:ring-emerald-500 h-4 w-4"
          />
          <span className="text-xs text-slate-600">
            {lang === 'bn' ? (
              <>আমি Shopo-র <a href="#" className="text-emerald-600 underline">শর্তাবলী</a> ও <a href="#" className="text-emerald-600 underline">প্রাইভেসি পলিসিতে</a> সম্মত।</>
            ) : (
              <>I agree to Shopo's <a href="#" className="text-emerald-600 underline">Terms of Service</a> and <a href="#" className="text-emerald-600 underline">Privacy Policy</a>.</>
            )}
          </span>
        </div>

        {/* Primary Submit Button */}
        <button
          type="submit"
          className="w-full py-3.5 px-4 bg-gradient-to-r from-[#022c22] via-[#033a2d] to-[#011e17] text-[#00df89] hover:bg-emerald-950 font-bold rounded-xl text-sm shadow-lg shadow-[#022c22]/20 flex items-center justify-center gap-2 transition-all transform hover:scale-[1.01] active:scale-[0.99]"
        >
          <span>{lang === 'bn' ? 'ফ্রি শপ অ্যাকাউন্ট খুলুন' : 'Create Your Shop Account'}</span>
          <ArrowRight className="w-4 h-4 text-[#00df89]" />
        </button>
      </form>

      {/* Redirect Footer */}
      <div className="text-center pt-2 text-xs font-medium text-slate-500">
        <span>{lang === 'bn' ? 'ইতিমধ্যে অ্যাকাউন্ট আছে?' : 'Already have an account?'} </span>
        <Link to="/login" className="font-bold text-emerald-600 hover:text-emerald-700">
          {lang === 'bn' ? 'লগইন করুন' : 'Log In'}
        </Link>
      </div>
    </div>
  );
}
