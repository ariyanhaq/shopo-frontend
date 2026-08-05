/**
 * @file Footer.jsx
 * @description Premium SaaS footer component using the app's default dark green gradient styling.
 */
import { useLanguage } from '@/context/LanguageContext';
import { Store, ShieldCheck, Heart } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function Footer() {
  const { t } = useLanguage();

  return (
    <footer className="bg-gradient-to-b from-[#022c22] via-[#01221a] to-[#011812] text-slate-300 pt-16 pb-12 border-t border-[#044433] relative overflow-hidden">
      {/* Background ambient lighting */}
      <div className="absolute top-0 left-1/4 w-96 h-96 bg-[#00df89]/5 rounded-full blur-3xl pointer-events-none"></div>
      <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-[#00df89]/5 rounded-full blur-3xl pointer-events-none"></div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="grid grid-cols-1 md:grid-cols-5 gap-10 pb-12 border-b border-[#044433]">
          
          {/* Brand Info */}
          <div className="md:col-span-2 space-y-4">
            <Link to="/" className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-[#00df89] flex items-center justify-center text-[#011812] font-bold shadow-md shadow-[#00df89]/20">
                <Store className="w-5 h-5" />
              </div>
              <span className="font-extrabold text-2xl text-white tracking-tight">
                Shopo<span className="text-[#00df89]">.</span>
              </span>
            </Link>
            <p className="text-sm text-slate-300 max-w-sm leading-relaxed">
              {t.footer.desc}
            </p>
            <div className="flex items-center gap-2 text-xs text-slate-400 pt-2">
              <ShieldCheck className="w-4 h-4 text-[#00df89]" />
              <span>Bank-grade 256-bit SSL encryption & daily backups.</span>
            </div>
          </div>

          {/* Column 1: Product */}
          <div className="space-y-3">
            <h4 className="text-xs font-bold text-slate-200 uppercase tracking-wider">{t.footer.productHeader}</h4>
            <ul className="space-y-2 text-sm text-slate-400">
              <li><a href="#features" className="hover:text-[#00df89] transition-colors">{t.nav.features}</a></li>
              <li><a href="#solutions" className="hover:text-[#00df89] transition-colors">{t.nav.solutions}</a></li>
              <li><a href="#pricing" className="hover:text-[#00df89] transition-colors">{t.nav.pricing}</a></li>
              <li><a href="#how-it-works" className="hover:text-[#00df89] transition-colors">{t.nav.howItWorks}</a></li>
            </ul>
          </div>

          {/* Column 2: Company */}
          <div className="space-y-3">
            <h4 className="text-xs font-bold text-slate-200 uppercase tracking-wider">{t.footer.companyHeader}</h4>
            <ul className="space-y-2 text-sm text-slate-400">
              <li><a href="#about" className="hover:text-[#00df89] transition-colors">{t.nav.about}</a></li>
              <li><a href="#trust" className="hover:text-[#00df89] transition-colors">Why Shopo</a></li>
              <li><Link to="/login" className="hover:text-[#00df89] transition-colors">{t.nav.login}</Link></li>
              <li><Link to="/register" className="hover:text-[#00df89] transition-colors">{t.nav.getStarted}</Link></li>
            </ul>
          </div>

          {/* Column 3: Legal */}
          <div className="space-y-3">
            <h4 className="text-xs font-bold text-slate-200 uppercase tracking-wider">{t.footer.legalHeader}</h4>
            <ul className="space-y-2 text-sm text-slate-400">
              <li><a href="#" className="hover:text-[#00df89] transition-colors">{t.footer.privacy}</a></li>
              <li><a href="#" className="hover:text-[#00df89] transition-colors">{t.footer.terms}</a></li>
              <li><a href="#" className="hover:text-[#00df89] transition-colors">{t.footer.contact}</a></li>
            </ul>
          </div>
        </div>

        {/* Bottom copyright */}
        <div className="pt-8 flex flex-col sm:flex-row items-center justify-between text-xs text-slate-400 gap-4">
          <p>© {new Date().getFullYear()} {t.footer.rights}</p>
          <div className="flex items-center gap-1">
            <span>Made with</span>
            <Heart className="w-3.5 h-3.5 text-rose-500 fill-rose-500 inline" />
            <span>for Bangladeshi Businesses</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
