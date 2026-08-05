/**
 * @file Navbar.jsx
 * @description Premium sticky navigation bar with bilingual language selector, spring animations, and smooth glassmorphism styling.
 */
import { useState, useEffect } from 'react';
import { useLanguage } from '@/context/LanguageContext';
import { Globe, Menu, X, Store, ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';

export default function Navbar() {
  const { lang, setLang, t } = useLanguage();
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <header className={`sticky top-0 z-50 transition-all duration-300 ${
      scrolled ? 'bg-white/85 backdrop-blur-xl border-b border-slate-200/80 shadow-xs' : 'bg-white/60 backdrop-blur-md border-b border-slate-100'
    }`}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 sm:h-20">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-2.5 group">
            <motion.div
              whileHover={{ scale: 1.08, rotate: 2 }}
              whileTap={{ scale: 0.95 }}
              transition={{ type: 'spring', stiffness: 400, damping: 20 }}
              className="w-10 h-10 rounded-xl bg-gradient-to-tr from-emerald-600 to-green-500 flex items-center justify-center text-white shadow-md shadow-emerald-500/20"
            >
              <Store className="w-5.5 h-5.5" />
            </motion.div>
            <div className="flex flex-col">
              <span className="font-extrabold text-xl sm:text-2xl text-slate-900 tracking-tight flex items-center gap-1">
                Shopo<span className="w-1.5 h-1.5 rounded-full bg-emerald-500 inline-block"></span>
              </span>
              <span className="text-[10px] font-semibold text-slate-400 -mt-1 tracking-wider uppercase">Shop OS</span>
            </div>
          </Link>

          {/* Desktop Nav Links */}
          <nav className="hidden md:flex items-center gap-8 text-sm font-medium text-slate-600">
            <a href="#features" className="hover:text-emerald-600 transition-colors">{t.nav.features}</a>
            <a href="#solutions" className="hover:text-emerald-600 transition-colors">{t.nav.solutions}</a>
            <a href="#how-it-works" className="hover:text-emerald-600 transition-colors">{t.nav.howItWorks}</a>
            <a href="#pricing" className="hover:text-emerald-600 transition-colors">{t.nav.pricing}</a>
            <a href="#about" className="hover:text-emerald-600 transition-colors">{t.nav.about}</a>
          </nav>

          {/* Right Actions */}
          <div className="hidden md:flex items-center gap-3">
            {/* Language Switcher Toggle */}
            <div className="flex items-center bg-slate-100/80 p-1 rounded-full border border-slate-200/60 relative">
              <motion.button
                whileHover={{ scale: 1.04 }}
                whileTap={{ scale: 0.96 }}
                onClick={() => setLang('en')}
                className={`px-3 py-1 text-xs font-semibold rounded-full transition-all ${
                  lang === 'en' ? 'bg-white text-slate-900 shadow-xs font-bold' : 'text-slate-500 hover:text-slate-900'
                }`}
              >
                EN
              </motion.button>
              <motion.button
                whileHover={{ scale: 1.04 }}
                whileTap={{ scale: 0.96 }}
                onClick={() => setLang('bn')}
                className={`px-3 py-1 text-xs font-semibold rounded-full transition-all ${
                  lang === 'bn' ? 'bg-emerald-600 text-white shadow-xs font-bold' : 'text-slate-500 hover:text-slate-900'
                }`}
              >
                বাংলা
              </motion.button>
            </div>

            <Link
              to="/login"
              className="px-4 py-2 text-sm font-semibold text-slate-700 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-colors"
            >
              {t.nav.login}
            </Link>

            <motion.div
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.97 }}
              transition={{ type: 'spring', stiffness: 400, damping: 25 }}
            >
              <Link
                to="/register"
                className="px-4.5 py-2 text-sm font-semibold text-white bg-slate-900 hover:bg-emerald-600 rounded-xl transition-all shadow-sm hover:shadow-emerald-500/25 flex items-center gap-1.5 group"
              >
                <span>{t.nav.getStarted}</span>
                <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
              </Link>
            </motion.div>
          </div>

          {/* Mobile menu button */}
          <div className="flex md:hidden items-center gap-2">
            <motion.button
              whileTap={{ scale: 0.95 }}
              onClick={() => setLang(lang === 'en' ? 'bn' : 'en')}
              className="p-2 text-xs font-bold bg-slate-100 text-slate-800 rounded-lg flex items-center gap-1"
            >
              <Globe className="w-3.5 h-3.5 text-emerald-600" />
              {lang === 'en' ? 'EN' : 'বাংলা'}
            </motion.button>
            <motion.button
              whileTap={{ scale: 0.9 }}
              onClick={() => setMobileOpen(!mobileOpen)}
              className="p-2 text-slate-700 hover:text-slate-900 rounded-lg focus:outline-none"
            >
              {mobileOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </motion.button>
          </div>
        </div>
      </div>

      {/* Mobile Drawer with AnimatePresence */}
      <AnimatePresence>
        {mobileOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
            className="md:hidden bg-white/95 backdrop-blur-xl border-b border-slate-200 px-4 pt-3 pb-6 space-y-3 overflow-hidden"
          >
            <nav className="flex flex-col space-y-2.5 text-base font-medium text-slate-700">
              <a href="#features" onClick={() => setMobileOpen(false)} className="px-3 py-2 rounded-lg hover:bg-slate-50">{t.nav.features}</a>
              <a href="#solutions" onClick={() => setMobileOpen(false)} className="px-3 py-2 rounded-lg hover:bg-slate-50">{t.nav.solutions}</a>
              <a href="#how-it-works" onClick={() => setMobileOpen(false)} className="px-3 py-2 rounded-lg hover:bg-slate-50">{t.nav.howItWorks}</a>
              <a href="#pricing" onClick={() => setMobileOpen(false)} className="px-3 py-2 rounded-lg hover:bg-slate-50">{t.nav.pricing}</a>
              <a href="#about" onClick={() => setMobileOpen(false)} className="px-3 py-2 rounded-lg hover:bg-slate-50">{t.nav.about}</a>
            </nav>
            <div className="pt-3 border-t border-slate-100 flex flex-col gap-2">
              <Link
                to="/login"
                className="w-full py-2.5 text-center text-sm font-semibold text-slate-800 bg-slate-100 rounded-xl"
              >
                {t.nav.login}
              </Link>
              <Link
                to="/register"
                className="w-full py-2.5 text-center text-sm font-semibold text-white bg-emerald-600 rounded-xl shadow-md"
              >
                {t.nav.getStarted}
              </Link>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
}
