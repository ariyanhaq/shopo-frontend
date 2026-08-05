/**
 * @file POS.jsx
 * @description Point of Sale (POS) & Retail Counter Coming Soon page for Shopo.
 */
import { Link } from 'react-router-dom';
import { useLanguage } from '@/context/LanguageContext';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Store, Sparkles, ArrowLeft, Clock, Zap, ShieldCheck, Printer, Barcode } from 'lucide-react';

export default function POS() {
  const { lang } = useLanguage();

  return (
    <div className="min-h-[75vh] flex items-center justify-center p-4 font-sans">
      <Card className="max-w-xl w-full p-8 sm:p-10 text-center space-y-6 border border-slate-200/90 dark:border-zinc-800/80 dark:bg-[#121215] shadow-xl relative overflow-hidden">
        
        {/* Glow decoration background */}
        <div className="absolute -top-24 -left-24 w-48 h-48 bg-[#00df89]/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-24 -right-24 w-48 h-48 bg-[#00df89]/10 rounded-full blur-3xl pointer-events-none" />

        {/* Top Icon & Badge */}
        <div className="space-y-3">
          <div className="w-16 h-16 rounded-2xl bg-emerald-500/10 text-[#00a86b] dark:text-[#00df89] flex items-center justify-center mx-auto border border-emerald-500/20 shadow-xs">
            <Store className="w-8 h-8 stroke-[2]" />
          </div>

          <Badge variant="outline" className="px-3 py-1 text-xs font-medium border-amber-500/30 bg-amber-500/10 text-amber-600 dark:text-amber-400">
            <Clock className="w-3 h-3 mr-1.5" />
            <span>{lang === 'bn' ? 'খুব শীঘ্রই আসছে' : 'Coming Soon'}</span>
          </Badge>
        </div>

        {/* Title & Description */}
        <div className="space-y-2 max-w-md mx-auto">
          <h2 className="text-xl sm:text-2xl font-medium text-slate-900 dark:text-white tracking-tight">
            {lang === 'bn' ? 'পিওএস ও খুচরা কাউন্টার বিলিং' : 'POS & Retail Counter Mode'}
          </h2>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-zinc-400 font-normal leading-relaxed">
            {lang === 'bn'
              ? 'আমরা একটি দ্রুততম এবং অফলাইন বারকোড স্ক্যানিং, মেমো প্রিন্টিং ও টাচ স্ক্রিন ক্যাশ কাউন্টার তৈরি করছি।'
              : 'We are crafting a supercharged Point of Sale counter interface with offline barcode scanning, thermal receipt printing, and touch billing.'}
          </p>
        </div>

        {/* Feature Highlights Grid */}
        <div className="grid grid-cols-3 gap-3 pt-2">
          <div className="p-3 rounded-xl bg-slate-50 dark:bg-[#09090b]/80 border border-slate-100 dark:border-zinc-800/80 space-y-1">
            <Barcode className="w-4 h-4 text-emerald-500 mx-auto" />
            <div className="text-[11px] font-medium text-slate-800 dark:text-zinc-200">
              {lang === 'bn' ? 'বারকোড স্ক্যান' : 'Barcode Scan'}
            </div>
          </div>

          <div className="p-3 rounded-xl bg-slate-50 dark:bg-[#09090b]/80 border border-slate-100 dark:border-zinc-800/80 space-y-1">
            <Printer className="w-4 h-4 text-blue-500 mx-auto" />
            <div className="text-[11px] font-medium text-slate-800 dark:text-zinc-200">
              {lang === 'bn' ? 'থার্মাল প্রিন্ট' : 'Thermal Print'}
            </div>
          </div>

          <div className="p-3 rounded-xl bg-slate-50 dark:bg-[#09090b]/80 border border-slate-100 dark:border-zinc-800/80 space-y-1">
            <Zap className="w-4 h-4 text-amber-500 mx-auto" />
            <div className="text-[11px] font-medium text-slate-800 dark:text-zinc-200">
              {lang === 'bn' ? 'দ্রুত বিলিং' : 'Fast Checkout'}
            </div>
          </div>
        </div>

        {/* Return Button */}
        <div className="pt-2">
          <Link to="/dashboard">
            <Button variant="default" className="bg-[#00df89] hover:bg-[#00c97b] text-[#011812] font-medium gap-2">
              <ArrowLeft className="w-4 h-4" />
              <span>{lang === 'bn' ? 'ড্যাশবোর্ডে ফিরে যান' : 'Back to Dashboard'}</span>
            </Button>
          </Link>
        </div>

      </Card>
    </div>
  );
}
