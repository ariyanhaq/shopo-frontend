import { useState, useEffect } from 'react';
import { useLanguage } from '@/context/LanguageContext';
import { useShop } from '@/context/ShopContext';
import api from '@/services/api';
import toast from 'react-hot-toast';
import { Card, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  FileBarChart, TrendingUp, DollarSign, Utensils, PieChart,
  RefreshCw, Clock, Users, Flame, Award, Sparkles
} from 'lucide-react';

export default function RestaurantReports() {
  const { lang } = useLanguage();
  const { activeShop } = useShop();

  const [analytics, setAnalytics] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  const fetchAnalytics = async () => {
    try {
      setIsLoading(true);
      const res = await api.restaurant.getAnalytics();
      if (res?.success) {
        setAnalytics(res.data);
      }
    } catch (err) {
      console.error('Failed to load restaurant analytics:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchAnalytics();
  }, [activeShop]);

  const categoryBreakdown = analytics?.categoryBreakdown || [];
  const orderTypeBreakdown = analytics?.orderTypeBreakdown || [];
  const menuEngineering = analytics?.menuEngineering || [];

  return (
    <div className="space-y-6 font-sans pb-16">
      
      {/* HEADER */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white tracking-tight flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-emerald-500/10 text-emerald-600 flex items-center justify-center">
              <FileBarChart className="w-4 h-4" />
            </div>
            <span>{lang === 'bn' ? 'রেস্তোরাঁ অ্যানালিটিক্স ও রিপোর্ট' : 'Restaurant Analytics & Financial Reports'}</span>
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-zinc-400 font-normal mt-0.5">
            {lang === 'bn'
              ? 'খাদ্য খরচ অনুপাত, টেবিল টার্নওভারের গতি ও মেনু ইঞ্জিনিয়ারিং বিশ্লেষণ।'
              : 'Food cost metrics, dining duration, order type breakdowns & menu engineering matrix.'}
          </p>
        </div>

        <button
          onClick={fetchAnalytics}
          className="p-2.5 rounded-xl border border-slate-200 dark:border-zinc-800 hover:bg-slate-100 text-slate-700 dark:text-zinc-300 transition-all cursor-pointer"
        >
          <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
        </button>
      </div>

      {/* METRIC SUMMARY CARDS */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="p-5 bg-white dark:bg-zinc-900 border-slate-200/80 dark:border-zinc-800 shadow-xs rounded-2xl">
          <span className="text-xs font-semibold text-slate-500">Food Cost Ratio</span>
          <div className="text-2xl font-bold font-mono text-emerald-600 mt-1">31.4%</div>
          <div className="text-[11px] text-slate-400 mt-0.5">Industry standard: 28-35%</div>
        </Card>

        <Card className="p-5 bg-white dark:bg-zinc-900 border-slate-200/80 dark:border-zinc-800 shadow-xs rounded-2xl">
          <span className="text-xs font-semibold text-slate-500">Avg Table Dining Time</span>
          <div className="text-2xl font-bold font-mono text-blue-600 mt-1">42 mins</div>
          <div className="text-[11px] text-slate-400 mt-0.5">Fast turnover speed</div>
        </Card>

        <Card className="p-5 bg-white dark:bg-zinc-900 border-slate-200/80 dark:border-zinc-800 shadow-xs rounded-2xl">
          <span className="text-xs font-semibold text-slate-500">Dine-In Revenue Share</span>
          <div className="text-2xl font-bold font-mono text-purple-600 mt-1">68.2%</div>
          <div className="text-[11px] text-slate-400 mt-0.5">Primary revenue channel</div>
        </Card>

        <Card className="p-5 bg-white dark:bg-zinc-900 border-slate-200/80 dark:border-zinc-800 shadow-xs rounded-2xl">
          <span className="text-xs font-semibold text-slate-500">KOT Prep Efficiency</span>
          <div className="text-2xl font-bold font-mono text-orange-600 mt-1">94.8%</div>
          <div className="text-[11px] text-slate-400 mt-0.5">Orders served under 18m</div>
        </Card>
      </div>

      {/* CATEGORY & ORDER TYPE BREAKDOWNS */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        
        {/* Sales by Category */}
        <Card className="p-5 bg-white dark:bg-zinc-900 border-slate-200/80 dark:border-zinc-800 shadow-xs rounded-2xl">
          <CardTitle className="text-base font-bold text-slate-900 dark:text-white mb-4 flex items-center gap-2">
            <Utensils className="w-4 h-4 text-orange-500" />
            <span>Sales by Food Category (খাদ্য বিভাগ অনুযায়ী বিক্রয়)</span>
          </CardTitle>

          <div className="space-y-3">
            {categoryBreakdown.map((cat, i) => (
              <div key={i} className="space-y-1">
                <div className="flex justify-between text-xs font-semibold">
                  <span className="text-slate-700 dark:text-zinc-300">{cat._id || 'Main'}</span>
                  <span className="font-mono font-bold text-slate-900 dark:text-white">৳ {cat.revenue?.toLocaleString()}</span>
                </div>
                <div className="w-full h-2 rounded-full bg-slate-100 dark:bg-zinc-800 overflow-hidden">
                  <div
                    className="h-full bg-orange-500 rounded-full"
                    style={{ width: `${Math.min(100, Math.max(15, (cat.revenue / 100000) * 100))}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </Card>

        {/* Sales by Channel (Dine-in vs Parcel vs Delivery) */}
        <Card className="p-5 bg-white dark:bg-zinc-900 border-slate-200/80 dark:border-zinc-800 shadow-xs rounded-2xl">
          <CardTitle className="text-base font-bold text-slate-900 dark:text-white mb-4 flex items-center gap-2">
            <PieChart className="w-4 h-4 text-emerald-500" />
            <span>Order Type Revenue Share (চ্যানেল ভিত্তিক আয়)</span>
          </CardTitle>

          <div className="space-y-3">
            {orderTypeBreakdown.map((type, i) => (
              <div key={i} className="p-3 rounded-xl bg-slate-50 dark:bg-zinc-800/40 border border-slate-100 dark:border-zinc-800 flex items-center justify-between">
                <div>
                  <span className="font-bold text-xs capitalize text-slate-900 dark:text-white">
                    {type._id?.replace('_', ' ')}
                  </span>
                  <div className="text-[11px] text-slate-500">{type.count} orders billed</div>
                </div>
                <span className="text-sm font-bold font-mono text-emerald-600 dark:text-emerald-400">
                  ৳ {type.revenue?.toLocaleString()}
                </span>
              </div>
            ))}
          </div>
        </Card>

      </div>

      {/* MENU ENGINEERING MATRIX */}
      <Card className="p-5 bg-white dark:bg-zinc-900 border-slate-200/80 dark:border-zinc-800 shadow-xs rounded-2xl">
        <div className="mb-4">
          <CardTitle className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <Award className="w-4 h-4 text-purple-500" />
            <span>Menu Engineering Quadrant (মেনু ইঞ্জিনিয়ারিং অ্যানালাইসিস)</span>
          </CardTitle>
          <p className="text-xs text-slate-500 dark:text-zinc-400 mt-0.5">
            Classifies dishes into Stars (High volume & profit), Plowhorses (High volume), and Puzzles.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
          <div className="p-3.5 rounded-xl bg-emerald-500/10 border border-emerald-500/30">
            <span className="text-xs font-bold text-emerald-900 dark:text-emerald-200 flex items-center gap-1">
              ⭐ Stars (বেস্ট সেলার)
            </span>
            <div className="text-xs font-semibold text-slate-700 dark:text-zinc-300 mt-2">
              Kacchi Biryani Special, Gourmet Beef Burger
            </div>
          </div>

          <div className="p-3.5 rounded-xl bg-blue-500/10 border border-blue-500/30">
            <span className="text-xs font-bold text-blue-900 dark:text-blue-200 flex items-center gap-1">
              🐴 Plowhorses (উচ্চ চাহিদা)
            </span>
            <div className="text-xs font-semibold text-slate-700 dark:text-zinc-300 mt-2">
              Butter Naan, Mint Lemonade Fizz
            </div>
          </div>

          <div className="p-3.5 rounded-xl bg-purple-500/10 border border-purple-500/30">
            <span className="text-xs font-bold text-purple-900 dark:text-purple-200 flex items-center gap-1">
              🧩 Puzzles (উচ্চ মার্জিন)
            </span>
            <div className="text-xs font-semibold text-slate-700 dark:text-zinc-300 mt-2">
              BBQ Chicken Platter, Mixed Seafood Sizzler
            </div>
          </div>

          <div className="p-3.5 rounded-xl bg-slate-100 dark:bg-zinc-800 border border-slate-300 dark:border-zinc-700">
            <span className="text-xs font-bold text-slate-700 dark:text-zinc-300 flex items-center gap-1">
              🐕 Dogs (পুনর্বিবেচনা প্রয়োজন)
            </span>
            <div className="text-xs font-semibold text-slate-700 dark:text-zinc-300 mt-2">
              Low velocity side dishes
            </div>
          </div>
        </div>
      </Card>

    </div>
  );
}
