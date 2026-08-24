/**
 * @file DashboardLayout.jsx
 * @description Layout with top navbar linking New Sale directly to /sales/new.
 */
import { useState } from 'react';
import { Outlet, Link, useLocation, useNavigate } from 'react-router-dom';
import { useShop } from '@/context/ShopContext';
import { useLanguage } from '@/context/LanguageContext';
import { useAuth } from '@/context/AuthContext';
import Sidebar from '@/components/sidebar/Sidebar';
import QuickActionModal from '@/components/dashboard/QuickActionModal';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Store, Search, Sun, Moon, Bell, ChevronDown, Check,
  LayoutDashboard, ShoppingCart, BarChart3, Settings, Plus,
  Globe
} from 'lucide-react';

export default function DashboardLayout() {
  const location = useLocation();
  const navigate = useNavigate();
  const { activeShop, theme, toggleTheme } = useShop();
  const { lang, setLang, t } = useLanguage();
  const { mongoShop } = useAuth();

  const [isQuickModalOpen, setIsQuickModalOpen] = useState(false);
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);

  const notificationsList = [
    {
      title: lang === 'bn' ? 'স্বল্প স্টকের অ্যালার্ট' : 'Low Stock Alert',
      desc: lang === 'bn' ? 'মিনিকেট চাল ২৫কেজি অবশিষ্ট মাত্র ১২ বস্তা।' : 'Miniket Rice 25kg is down to 12 bags.',
      time: '5m ago'
    },
    {
      title: lang === 'bn' ? 'নতুন বিক্রি সম্পন্ন' : 'New Sale Recorded',
      desc: lang === 'bn' ? 'ইনভয়েস #INV-2024-001 পরিশোধিত (৳৪৫,৫০০)।' : 'Invoice #INV-2024-001 paid (৳45,500).',
      time: '18m ago'
    }
  ];

  return (
    <div className={`min-h-screen bg-[#F8FAFC] dark:bg-[#09090b] text-slate-900 dark:text-zinc-100 flex font-sans ${theme === 'dark' ? 'dark' : ''}`}>
      
      {/* DESKTOP SIDEBAR */}
      <Sidebar collapsed={false} />

      {/* MAIN CONTENT WRAPPER */}
      <div className="flex-1 flex flex-col md:pl-64 min-w-0 transition-all">
        
        {/* STICKY TOP NAVBAR */}
        <header className="sticky top-0 z-30 bg-white/90 dark:bg-[#09090b]/90 backdrop-blur-md border-b border-slate-200/90 dark:border-zinc-800/80 px-4 sm:px-6 h-14 flex items-center justify-between gap-4">
          
          {/* Left Breadcrumb Navigation */}
          <div className="flex items-center gap-3">
            
            {/* Mobile Brand Icon */}
            <Link to="/dashboard" className="flex items-center gap-2 md:hidden">
              <div className="w-8 h-8 rounded-xl bg-[#00df89] text-[#011812] flex items-center justify-center font-medium shadow-xs">
                <Store className="w-4 h-4" />
              </div>
            </Link>

            {/* Breadcrumb Title */}
            <div className="flex items-center gap-2 text-slate-800 dark:text-zinc-200 font-medium text-sm sm:text-base">
              <LayoutDashboard className="w-4 h-4 text-slate-500 dark:text-zinc-400" />
              <span>{t?.dashboard?.title || 'Dashboard'}</span>
              {(mongoShop?.name || activeShop?.name) && (
                <span className="hidden sm:inline-block text-xs font-normal text-slate-400 dark:text-zinc-500">
                  / {mongoShop?.name || activeShop?.name}
                </span>
              )}
            </div>

          </div>

          {/* Center Search Input */}
          <div className="hidden lg:flex items-center gap-2 flex-1 max-w-sm mx-4 relative">
            <Search className="w-4 h-4 text-slate-400 dark:text-zinc-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder={lang === 'bn' ? 'পণ্য, বিক্রি, কাস্টমার খুঁজুন...' : 'Search products, orders, customers...'}
              className="w-full pl-9 pr-4 py-1.5 rounded-xl bg-slate-100 dark:bg-[#121215] border border-slate-200/80 dark:border-zinc-800/80 text-xs text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-zinc-500 focus:outline-none focus:ring-2 focus:ring-[#00df89] font-normal"
            />
          </div>

          {/* Right Action Items */}
          <div className="flex items-center gap-2 sm:gap-3">
            
            {/* SEGMENTED LANGUAGE TOGGLE SWITCH (EN | বাংলা) */}
            <div className="bg-slate-100 dark:bg-[#121215] p-0.5 sm:p-1 rounded-full flex items-center gap-0.5 border border-slate-200/80 dark:border-zinc-800/80">
              <button
                onClick={() => setLang('en')}
                className={`px-3 py-1 rounded-full text-xs transition-all duration-150 cursor-pointer select-none ${
                  lang === 'en'
                    ? 'bg-white dark:bg-zinc-800 text-slate-900 dark:text-white shadow-xs font-medium'
                    : 'text-slate-500 hover:text-slate-900 dark:text-zinc-400 font-normal'
                }`}
              >
                EN
              </button>
              <button
                onClick={() => setLang('bn')}
                className={`px-3 py-1 rounded-full text-xs transition-all duration-150 cursor-pointer select-none ${
                  lang === 'bn'
                    ? 'bg-white dark:bg-zinc-800 text-slate-900 dark:text-white shadow-xs font-medium'
                    : 'text-slate-500 hover:text-slate-900 dark:text-zinc-400 font-normal'
                }`}
              >
                বাংলা
              </button>
            </div>

            {/* Quick New Sale Button */}
            <Button
              variant="default"
              size="sm"
              onClick={() => navigate('/sales/new')}
              className="gap-1 bg-[#00df89] text-[#011812] font-medium hover:bg-[#00c97b]"
            >
              <Plus className="w-4 h-4 stroke-[2]" />
              <span className="hidden sm:inline">{t?.dashboard?.newSale || 'New Sale'}</span>
            </Button>

            {/* Notifications Popover */}
            <div className="relative">
              <button
                onClick={() => setIsNotificationsOpen(!isNotificationsOpen)}
                className="w-8 h-8 rounded-xl bg-slate-100 dark:bg-[#121215] text-slate-700 dark:text-zinc-300 hover:bg-slate-200 dark:hover:bg-zinc-800 flex items-center justify-center relative transition-colors border border-transparent dark:border-zinc-800/80"
              >
                <Bell className="w-4 h-4" />
                <span className="w-2 h-2 rounded-full bg-rose-500 absolute top-1.5 right-1.5" />
              </button>

              {isNotificationsOpen && (
                <>
                  <div className="fixed inset-0 z-40" onClick={() => setIsNotificationsOpen(false)} />
                  <div className="absolute right-0 top-full mt-2 z-50 w-72 rounded-2xl bg-white dark:bg-[#121215] border border-slate-200 dark:border-zinc-800 shadow-xl p-3 space-y-2">
                    <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-zinc-800">
                      <span className="font-medium text-xs text-slate-900 dark:text-white">
                        {lang === 'bn' ? 'নোটিফিকেশন' : 'Notifications'}
                      </span>
                      <span className="text-[10px] font-medium text-emerald-600 dark:text-[#00df89]">
                        {lang === 'bn' ? 'সব পড়া হয়েছে' : 'Mark all read'}
                      </span>
                    </div>
                    <div className="space-y-1">
                      {notificationsList.map((notif, i) => (
                        <div key={i} className="p-2 rounded-xl hover:bg-slate-50 dark:hover:bg-zinc-800/60 transition-colors">
                          <div className="flex items-center justify-between text-xs font-medium text-slate-800 dark:text-zinc-200">
                            <span>{notif.title}</span>
                            <span className="text-[10px] text-slate-400 dark:text-zinc-500 font-normal">{notif.time}</span>
                          </div>
                          <p className="text-[11px] text-slate-500 dark:text-zinc-400 mt-0.5 font-normal">{notif.desc}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                </>
              )}
            </div>

            {/* Light/Dark Theme Switcher */}
            <button
              onClick={toggleTheme}
              className="w-8 h-8 rounded-xl bg-slate-100 dark:bg-[#121215] text-slate-700 dark:text-zinc-300 hover:bg-slate-200 dark:hover:bg-zinc-800 flex items-center justify-center transition-colors border border-transparent dark:border-zinc-800/80"
              title="Toggle Theme"
            >
              {theme === 'dark' ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-slate-700" />}
            </button>

          </div>

        </header>

        {/* PAGE CONTENT ROUTE OUTLET - Keyed on mongoShop._id to automatically reset and reload all data on shop switch */}
        <main className="flex-1 p-4 sm:p-6 pb-24 md:pb-8">
          <Outlet key={mongoShop?._id || 'shop-root'} />
        </main>

      </div>

      {/* NATIVE MOBILE BOTTOM NAVBAR (< 768px) */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/95 dark:bg-[#121215]/95 backdrop-blur-xl border-t border-slate-200/90 dark:border-zinc-800/80 px-3 py-2 flex items-center justify-around shadow-2xl">
        <Link
          to="/dashboard"
          className={`flex flex-col items-center gap-1 p-1 rounded-xl transition-colors ${
            location.pathname === '/dashboard' ? 'text-[#00a86b] dark:text-[#00df89] font-medium' : 'text-slate-500 dark:text-zinc-400 font-normal'
          }`}
        >
          <LayoutDashboard className="w-5 h-5" />
          <span className="text-[10px] font-medium">{t?.dashboard?.title || 'Home'}</span>
        </Link>

        <Link
          to="/sales"
          className={`flex flex-col items-center gap-1 p-1 rounded-xl transition-colors ${
            location.pathname.startsWith('/sales') ? 'text-[#00a86b] dark:text-[#00df89] font-medium' : 'text-slate-500 dark:text-zinc-400 font-normal'
          }`}
        >
          <ShoppingCart className="w-5 h-5" />
          <span className="text-[10px] font-medium">{t?.dashboard?.sidebar?.sales || (lang === 'bn' ? 'বিক্রি' : 'Sales')}</span>
        </Link>

        {/* Mobile FAB -> New Sale */}
        <div className="relative -top-4">
          <button
            onClick={() => navigate('/sales/new')}
            className="w-12 h-12 rounded-full bg-[#00df89] text-[#011812] flex items-center justify-center shadow-lg shadow-emerald-500/30 active:scale-90 transition-transform font-medium"
          >
            <Plus className="w-6 h-6 stroke-[2]" />
          </button>
        </div>

        <Link
          to="/reports/analytics"
          className={`flex flex-col items-center gap-1 p-1 rounded-xl transition-colors ${
            location.pathname.startsWith('/reports') ? 'text-[#00a86b] dark:text-[#00df89] font-medium' : 'text-slate-500 dark:text-zinc-400 font-normal'
          }`}
        >
          <BarChart3 className="w-5 h-5" />
          <span className="text-[10px] font-medium">{lang === 'bn' ? 'রিপোর্ট' : 'Reports'}</span>
        </Link>

        <Link
          to="/dashboard/settings"
          className={`flex flex-col items-center gap-1 p-1 rounded-xl transition-colors ${
            location.pathname.startsWith('/dashboard/settings') ? 'text-[#00a86b] dark:text-[#00df89] font-medium' : 'text-slate-500 dark:text-zinc-400 font-normal'
          }`}
        >
          <Settings className="w-5 h-5" />
          <span className="text-[10px] font-medium">{t?.dashboard?.sidebar?.settings || 'Settings'}</span>
        </Link>
      </div>

      <QuickActionModal
        isOpen={isQuickModalOpen}
        onClose={() => setIsQuickModalOpen(false)}
        shopName={activeShop ? activeShop.name : 'Workspace'}
        title={t?.dashboard?.newSale || 'Create New Action'}
      />

    </div>
  );
}
