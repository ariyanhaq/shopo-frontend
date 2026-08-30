/**
 * @file DashboardLayout.jsx
 * @description Layout with top navbar, desktop sidebar, smooth mobile slide-in drawer,
 * and bottom navigation with Financial Reports and dynamic Sidebar Drawer trigger.
 */
import { useState, useMemo } from 'react';
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
  Globe, FileBarChart, Menu, Sliders, User, Sparkles, Package,
  ShoppingBag, Building2, Users, Crown, UserCheck, DollarSign,
  ShieldCheck, LayoutGrid, Flame, Layers
} from 'lucide-react';

export default function DashboardLayout() {
  const location = useLocation();
  const navigate = useNavigate();
  const { activeShop, theme, toggleTheme } = useShop();
  const { lang, setLang, t } = useLanguage();
  const { mongoShop } = useAuth();

  const [isMobileDrawerOpen, setIsMobileDrawerOpen] = useState(false);
  const [isQuickModalOpen, setIsQuickModalOpen] = useState(false);
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);

  const isGym = (mongoShop?.business_type || activeShop?.id) === 'gym';
  const isRestaurant = (mongoShop?.business_type || activeShop?.id) === 'restaurant';

  // Dynamic Route Title & Icon Resolution
  const pageInfo = useMemo(() => {
    const p = location.pathname;

    if (p === '/dashboard' || p === '/gym/dashboard' || p === '/restaurant/dashboard') {
      return { title: lang === 'bn' ? 'ড্যাশবোর্ড' : 'Dashboard', icon: LayoutDashboard };
    }
    if (p.startsWith('/sales/new')) {
      return { title: lang === 'bn' ? 'নতুন বিক্রয়' : 'New Sale', icon: Plus };
    }
    if (p.startsWith('/sales/pos') || p.startsWith('/restaurant/pos')) {
      return { title: lang === 'bn' ? 'পিওএস' : 'POS', icon: ShoppingCart };
    }
    if (p.startsWith('/sales') || p.startsWith('/gym/sales') || p.startsWith('/restaurant/orders')) {
      return { title: lang === 'bn' ? 'বিক্রয়' : 'Sales', icon: ShoppingCart };
    }
    if (p.startsWith('/products/new')) {
      return { title: lang === 'bn' ? 'নতুন পণ্য যোগ' : 'Add Product', icon: Package };
    }
    if (p.startsWith('/products') || p.startsWith('/gym/products') || p.startsWith('/restaurant/menu')) {
      return { title: lang === 'bn' ? 'পণ্য' : 'Products', icon: Package };
    }
    if (p.startsWith('/purchases')) {
      return { title: lang === 'bn' ? 'পণ্য ক্রয়' : 'Purchases', icon: ShoppingBag };
    }
    if (p.startsWith('/suppliers')) {
      return { title: lang === 'bn' ? 'সাপ্লায়ার' : 'Suppliers', icon: Building2 };
    }
    if (p.startsWith('/customers')) {
      return { title: lang === 'bn' ? 'কাস্টমার' : 'Customers', icon: Users };
    }
    if (p.startsWith('/members') || p.startsWith('/gym/members')) {
      return { title: lang === 'bn' ? 'মেম্বারশিপ' : 'Members', icon: Crown };
    }
    if (p.startsWith('/employees')) {
      return { title: lang === 'bn' ? 'কর্মচারী ও বেতন' : 'Employees', icon: UserCheck };
    }
    if (p.startsWith('/expenses')) {
      return { title: lang === 'bn' ? 'দোকানের খরচ' : 'Expenses', icon: DollarSign };
    }
    if (p.startsWith('/financial-reports') || p.startsWith('/reports') || p.startsWith('/gym/accounting') || p.startsWith('/restaurant/reports')) {
      return { title: lang === 'bn' ? 'আর্থিক হিসাব' : 'Finance', icon: FileBarChart };
    }
    if (p.startsWith('/users')) {
      return { title: lang === 'bn' ? 'ব্যবহারকারী ও ডিভাইস' : 'Users & Devices', icon: ShieldCheck };
    }
    if (p.startsWith('/settings/store') || p.startsWith('/dashboard/settings') || p.startsWith('/gym/settings') || p.startsWith('/restaurant/settings')) {
      return { title: lang === 'bn' ? 'দোকানের সেটিংস' : 'Store Settings', icon: Store };
    }
    if (p.startsWith('/settings/profile')) {
      return { title: lang === 'bn' ? 'প্রোফাইল সেটিংস' : 'Profile Settings', icon: User };
    }
    if (p.startsWith('/restaurant/tables')) {
      return { title: lang === 'bn' ? 'টেবিল ও ফ্লোর' : 'Tables & Floor', icon: LayoutGrid };
    }
    if (p.startsWith('/restaurant/kds')) {
      return { title: lang === 'bn' ? 'কিচেন ডিসপ্লে' : 'Kitchen Screen', icon: Flame };
    }
    if (p.startsWith('/restaurant/recipes')) {
      return { title: lang === 'bn' ? 'রেসিপি ও হিসাব' : 'Recipe BOM', icon: Layers };
    }

    return { title: lang === 'bn' ? 'ড্যাশবোর্ড' : 'Dashboard', icon: LayoutDashboard };
  }, [location.pathname, lang]);

  const PageIcon = pageInfo.icon;

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
      
      {/* SIDEBAR (DESKTOP PINNED + MOBILE SLIDE-OVER DRAWER) */}
      <Sidebar
        collapsed={false}
        isMobileOpen={isMobileDrawerOpen}
        onCloseMobile={() => setIsMobileDrawerOpen(false)}
      />

      {/* MAIN CONTENT WRAPPER */}
      <div className="flex-1 flex flex-col md:pl-64 min-w-0 transition-all">
        
        {/* STICKY TOP NAVBAR WITH SAFE AREA INSET SUPPORT */}
        <header className="sticky top-0 z-30 bg-white/90 dark:bg-[#09090b]/90 backdrop-blur-md border-b border-slate-200/90 dark:border-zinc-800/80 px-4 sm:px-6 header-safe-top pb-3 md:py-0 h-auto md:h-14 flex items-center justify-between gap-2.5 sm:gap-4">
          
          {/* Left Breadcrumb Navigation & Mobile Menu Button */}
          <div className="flex items-center gap-3">
            
            {/* Mobile Hamburger Drawer Trigger */}
            <button
              type="button"
              onClick={() => setIsMobileDrawerOpen(true)}
              className="w-8 h-8 rounded-xl bg-[#00df89] text-[#011812] flex items-center justify-center font-medium shadow-xs md:hidden cursor-pointer active:scale-95 transition-transform"
              title={lang === 'bn' ? 'মেনু খুলুন' : 'Open Sidebar Menu'}
            >
              <Menu className="w-4.5 h-4.5" />
            </button>

            {/* Dynamic Breadcrumb Title */}
            <div className="flex items-center gap-2 text-slate-800 dark:text-zinc-200 font-bold text-sm sm:text-base">
              <PageIcon className="w-4 h-4 text-[#00df89] hidden sm:inline shrink-0" />
              <span>{pageInfo.title}</span>
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
              onClick={() => navigate(isGym ? '/gym/sales' : isRestaurant ? '/restaurant/pos' : '/sales/new')}
              className="gap-1 bg-[#00df89] text-[#011812] font-medium hover:bg-[#00c97b] cursor-pointer"
            >
              <Plus className="w-4 h-4 stroke-[2]" />
              <span className="hidden sm:inline">{t?.dashboard?.newSale || 'New Sale'}</span>
            </Button>

            {/* Notifications Popover */}
            <div className="relative">
              <button
                onClick={() => setIsNotificationsOpen(!isNotificationsOpen)}
                className="w-8 h-8 rounded-xl bg-slate-100 dark:bg-[#121215] text-slate-700 dark:text-zinc-300 hover:bg-slate-200 dark:hover:bg-zinc-800 flex items-center justify-center relative transition-colors border border-transparent dark:border-zinc-800/80 cursor-pointer"
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
              className="w-8 h-8 rounded-xl bg-slate-100 dark:bg-[#121215] text-slate-700 dark:text-zinc-300 hover:bg-slate-200 dark:hover:bg-zinc-800 flex items-center justify-center transition-colors border border-transparent dark:border-zinc-800/80 cursor-pointer"
              title="Toggle Theme"
            >
              {theme === 'dark' ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-slate-700" />}
            </button>

          </div>

        </header>

        {/* PAGE CONTENT ROUTE OUTLET - Keyed on mongoShop._id to automatically reset and reload all data on shop switch */}
        <main className="flex-1 p-4 sm:p-6 pb-28 md:pb-8">
          <Outlet key={mongoShop?._id || 'shop-root'} />
        </main>

      </div>

      {/* ---------------------------------------------------- */}
      {/* NATIVE MOBILE BOTTOM NAVBAR (< 768px)                */}
      {/* ---------------------------------------------------- */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/95 dark:bg-[#121215]/95 backdrop-blur-xl border-t border-slate-200/90 dark:border-zinc-800/80 px-2 pt-2.5 bottom-nav-safe sm:pb-2 flex items-center justify-around shadow-2xl">
        
        {/* 1. Dashboard */}
        <Link
          to={isGym ? '/gym/dashboard' : isRestaurant ? '/restaurant/dashboard' : '/dashboard'}
          className={`flex flex-col items-center gap-1 p-1 rounded-xl transition-colors ${
            location.pathname === '/dashboard' || location.pathname === '/gym/dashboard' || location.pathname === '/restaurant/dashboard'
              ? 'text-[#00a86b] dark:text-[#00df89] font-bold'
              : 'text-slate-500 dark:text-zinc-400 font-normal'
          }`}
        >
          <LayoutDashboard className="w-5 h-5" />
          <span className="text-[10px] font-medium">{t?.dashboard?.title || (lang === 'bn' ? 'হোম' : 'Home')}</span>
        </Link>

        {/* 2. Sales */}
        <Link
          to={isGym ? '/gym/sales' : isRestaurant ? '/restaurant/orders' : '/sales'}
          className={`flex flex-col items-center gap-1 p-1 rounded-xl transition-colors ${
            location.pathname.startsWith('/sales') || location.pathname.startsWith('/gym/sales') || location.pathname.startsWith('/restaurant/orders')
              ? 'text-[#00a86b] dark:text-[#00df89] font-bold'
              : 'text-slate-500 dark:text-zinc-400 font-normal'
          }`}
        >
          <ShoppingCart className="w-5 h-5" />
          <span className="text-[10px] font-medium">{lang === 'bn' ? 'বিক্রয়' : 'Sales'}</span>
        </Link>

        {/* 3. Mobile FAB Center Button -> New Sale */}
        <div className="relative -top-4">
          <button
            type="button"
            onClick={() => navigate(isGym ? '/gym/sales' : isRestaurant ? '/restaurant/pos' : '/sales/new')}
            title={lang === 'bn' ? 'নতুন বিক্রয়' : 'New Sale'}
            className="w-12 h-12 rounded-full bg-[#00df89] text-[#011812] flex items-center justify-center shadow-lg shadow-emerald-500/30 active:scale-90 transition-transform font-bold cursor-pointer"
          >
            <Plus className="w-6 h-6 stroke-[2.5]" />
          </button>
        </div>

        {/* 4. Products (Product First) */}
        <Link
          to={isGym ? '/gym/products' : isRestaurant ? '/restaurant/menu' : '/products'}
          className={`flex flex-col items-center gap-1 p-1 rounded-xl transition-colors ${
            location.pathname.startsWith('/products') || location.pathname.startsWith('/gym/products') || location.pathname.startsWith('/restaurant/menu')
              ? 'text-[#00a86b] dark:text-[#00df89] font-bold'
              : 'text-slate-500 dark:text-zinc-400 font-normal'
          }`}
        >
          <Package className="w-5 h-5" />
          <span className="text-[10px] font-medium">{lang === 'bn' ? 'পণ্য' : 'Products'}</span>
        </Link>

        {/* 5. Finance / Financial Reports (Then Finance) */}
        <Link
          to={isGym ? '/gym/accounting' : isRestaurant ? '/restaurant/reports' : '/financial-reports'}
          className={`flex flex-col items-center gap-1 p-1 rounded-xl transition-colors ${
            location.pathname.startsWith('/financial-reports') || location.pathname.startsWith('/gym/accounting') || location.pathname.startsWith('/restaurant/reports')
              ? 'text-[#00a86b] dark:text-[#00df89] font-bold'
              : 'text-slate-500 dark:text-zinc-400 font-normal'
          }`}
        >
          <FileBarChart className="w-5 h-5" />
          <span className="text-[10px] font-medium">{lang === 'bn' ? 'আর্থিক হিসাব' : 'Finance'}</span>
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
