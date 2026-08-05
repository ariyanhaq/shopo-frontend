/**
 * @file ForgotPassword.jsx
 * @description Premium Forgot Password page component for Shopo.
 */
import { useState } from 'react';
import { useLanguage } from '@/context/LanguageContext';
import { Store, Mail, ArrowRight, ArrowLeft, CheckCircle2, ShieldCheck, Globe } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function ForgotPassword() {
  const { lang, setLang } = useLanguage();
  const [identifier, setIdentifier] = useState('');
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = (e) => {
    e.preventDefault();
    setSubmitted(true);
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
          <h4 className="text-xl font-bold text-white">
            {lang === 'bn' ? 'পাসওয়ার্ড রিকভারি সাপোর্ট' : 'Password Recovery Support'}
          </h4>
          <p className="text-xs text-slate-300 leading-relaxed">
            {lang === 'bn'
              ? 'আপনার নিবন্ধিত মোবাইল নম্বর বা ইমেইলে পাসওয়ার্ড রিসেট লিংক বা পিন পাঠানো হবে।'
              : 'We will send an instant password reset link or OTP to your registered contact.'}
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
              className="text-xs font-bold px-2.5 py-1 rounded-full bg-slate-100 text-slate-700 hover:bg-emerald-50 transition-all flex items-center gap-1"
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
                ? 'আপনার রেজিস্টার্ড ফোন নম্বর বা ইমেইল লিখুন।'
                : 'Enter your registered phone number or email address below.'}
            </p>
          </div>

          {submitted ? (
            <div className="p-4 bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-bold rounded-2xl space-y-2">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
                <span>{lang === 'bn' ? 'রিসেট নির্দেশাবলী পাঠানো হয়েছে!' : 'Reset instructions sent!'}</span>
              </div>
              <p className="font-normal text-slate-600 leading-relaxed">
                {lang === 'bn'
                  ? 'আমরা আপনার তথ্যে পাসওয়ার্ড রিসেট লিংক পাঠিয়েছি। ইনবক্স বা এসএমএস চেক করুন।'
                  : 'We have dispatched a password reset link to your contact address.'}
              </p>
              <div className="pt-2">
                <Link to="/login" className="text-xs font-bold text-emerald-700 underline">
                  {lang === 'bn' ? 'লগইন পেজে যান' : 'Return to login'}
                </Link>
              </div>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700">
                  {lang === 'bn' ? 'মোবাইল নম্বর অথবা ইমেইল' : 'Mobile Number or Email'}
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                  <input
                    type="text"
                    required
                    placeholder={lang === 'bn' ? 'যেমন: 01700-000000' : '01700-000000 or email@shop.com'}
                    value={identifier}
                    onChange={(e) => setIdentifier(e.target.value)}
                    className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20 font-medium transition-all"
                  />
                </div>
              </div>

              <button
                type="submit"
                className="w-full py-3.5 px-4 bg-gradient-to-r from-[#022c22] via-[#033a2d] to-[#011e17] text-[#00df89] hover:bg-emerald-950 font-bold rounded-xl text-sm shadow-lg shadow-[#022c22]/20 flex items-center justify-center gap-2 transition-all"
              >
                <span>{lang === 'bn' ? 'রিসেট লিংক পাঠান' : 'Send Reset Link'}</span>
                <ArrowRight className="w-4 h-4 text-[#00df89]" />
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
