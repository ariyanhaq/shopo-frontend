import { useState, useEffect } from 'react';
import { useShop } from '@/context/ShopContext';
import { useLanguage } from '@/context/LanguageContext';
import { useAuth } from '@/context/AuthContext';
import { NavLink, Link, useLocation, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import toast from 'react-hot-toast';
import CreateShopModal from '@/components/shop/CreateShopModal';
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator
} from '@/components/ui/dropdown-menu';
import {
  Store, LayoutDashboard, ShoppingCart, ShoppingBag, Package, Users, UserCheck,
  BarChart3, Settings, ChevronRight, ChevronsUpDown, ShieldCheck,
  Wallet, HelpCircle, Layers, Building2, Sparkles, FolderPlus,
  ArrowLeftRight, Dumbbell, CreditCard, Calendar, Flame, Activity,
  Wrench, DollarSign, Award, Clock, LogOut, User, PlusCircle, Crown,
  Check, FileBarChart, Utensils, LayoutGrid, Receipt, X, Menu, Sliders
} from 'lucide-react';

export default function Sidebar({ collapsed, isMobileOpen = false, onCloseMobile }) {
  const location = useLocation();
  const navigate = useNavigate();
  const { activeShop } = useShop();
  const { lang, t } = useLanguage();
  const { currentUser, mongoUser, mongoShop, userShops, switchShop, logout } = useAuth();

  const [isCreateShopOpen, setIsCreateShopOpen] = useState(false);

  // Comprehensive background scroll & gesture lock when mobile sidebar drawer is open
  useEffect(() => {
    if (!isMobileOpen) return;

    // Save initial styles
    const originalHtmlOverflow = document.documentElement.style.overflow;
    const originalBodyOverflow = document.body.style.overflow;
    const originalHtmlTouchAction = document.documentElement.style.touchAction;
    const originalBodyTouchAction = document.body.style.touchAction;

    // Apply strict overflow and gesture lock on both html and body
    document.documentElement.style.overflow = 'hidden';
    document.documentElement.style.touchAction = 'none';
    document.body.style.overflow = 'hidden';
    document.body.style.touchAction = 'none';
    document.body.classList.add('modal-open');

    // Intercept touchmove anywhere on window except inside the drawer container
    const handleTouchMove = (e) => {
      const isInsideDrawer = e.target.closest('.mobile-drawer-scrollable') || e.target.closest('aside');
      if (!isInsideDrawer) {
        if (e.cancelable) {
          e.preventDefault();
        }
      }
    };

    window.addEventListener('touchmove', handleTouchMove, { passive: false });

    return () => {
      document.documentElement.style.overflow = originalHtmlOverflow;
      document.documentElement.style.touchAction = originalHtmlTouchAction;
      document.body.style.overflow = originalBodyOverflow;
      document.body.style.touchAction = originalBodyTouchAction;
      document.body.classList.remove('modal-open');

      window.removeEventListener('touchmove', handleTouchMove);
    };
  }, [isMobileOpen]);

  const sb = t?.dashboard?.sidebar || {};

  const isGym = (mongoShop?.business_type || activeShop?.id) === 'gym';
  const isRestaurant = (mongoShop?.business_type || activeShop?.id) === 'restaurant';

  const handleSwitchShop = async (shop) => {
    if (mongoShop?._id && String(mongoShop._id) === String(shop._id)) return;
    try {
      await switchShop(shop._id);
      toast.success(
        lang === 'bn'
          ? `'${shop.name}' দোকানে সুইচ করা হয়েছে!`
          : `Switched to '${shop.name}'!`
      );
      if (onCloseMobile) onCloseMobile();
      if (shop.business_type === 'gym') {
        navigate('/gym/dashboard');
      } else if (shop.business_type === 'restaurant') {
        navigate('/restaurant/dashboard');
      } else {
        navigate('/dashboard');
      }
    } catch (err) {
      toast.error(err.message || 'Failed to switch shop.');
    }
  };

  const userRole = (mongoUser?.role || 'owner').toLowerCase();
  const isOwner = userRole === 'owner' || userRole === 'admin' || !mongoUser;
  const isManager = userRole === 'manager';
  const userPerms = Array.isArray(mongoUser?.permissions) ? mongoUser.permissions : [];

  const hasPermission = (permKey) => {
    if (!mongoUser || isOwner || isManager) return true;
    if (!permKey) return true;
    if (permKey === 'users') return isOwner || isManager;
    return userPerms.includes(permKey);
  };

  const defaultMenuSections = [
    {
      title: sb.platform || (lang === 'bn' ? 'প্রধান মেনু' : 'Platform & Sales'),
      items: [
        { label: sb.dashboard || (lang === 'bn' ? 'ড্যাশবোর্ড' : 'Dashboard'), path: '/dashboard', icon: LayoutDashboard },
        { label: lang === 'bn' ? 'বিক্রয় ও ইনভয়েস' : 'Sales & Invoices', path: '/sales', icon: ShoppingCart, hasChevron: true, perm: 'orders' },
        { label: lang === 'bn' ? 'পণ্য তালিকা (Products)' : 'Products & Catalog', path: '/products', icon: Package, hasChevron: true, perm: 'products' },
        { label: lang === 'bn' ? 'পণ্য ক্রয় (Purchases)' : 'Purchases', path: '/purchases', icon: ShoppingBag, hasChevron: true, perm: 'purchases' },
        { label: lang === 'bn' ? 'সাপ্লায়ার (Suppliers)' : 'Suppliers', path: '/suppliers', icon: Building2, hasChevron: true, perm: 'suppliers' },
        { label: lang === 'bn' ? 'কাস্টমার ও গ্রাহক' : 'Customers', path: '/customers', icon: Users, hasChevron: true, perm: 'customers' },
        { label: lang === 'bn' ? 'মেম্বারশিপ ও রিওয়ার্ড' : 'Members & Rewards', path: '/members', icon: Crown, hasChevron: true, perm: 'customers' },
        { label: lang === 'bn' ? 'কর্মচারী ও বেতন' : 'Employees & Salary', path: '/employees', icon: UserCheck, hasChevron: true, perm: 'employees' },
        { label: lang === 'bn' ? 'দোকানের খরচ (Expenses)' : 'Expenses', path: '/expenses', icon: DollarSign, hasChevron: true, perm: 'expenses' },
        { label: lang === 'bn' ? 'ব্যবহারকারী ও ডিভাইস' : 'Users & Devices', path: '/users', icon: ShieldCheck, hasChevron: true, perm: 'users' },
        { label: lang === 'bn' ? 'আর্থিক রিপোর্ট (Financial Reports)' : 'Financial Reports', path: '/financial-reports', icon: FileBarChart, hasChevron: true, perm: 'accounting' },
        { label: lang === 'bn' ? 'দোকানের সেটিংস' : 'Store Settings', path: '/settings/store', icon: Store, hasChevron: true, perm: 'settings' },
        { label: lang === 'bn' ? 'প্রোফাইল সেটিংস' : 'Profile Settings', path: '/settings/profile', icon: User, hasChevron: true }
      ]
    }
  ];

  const gymMenuSections = [
    {
      title: lang === 'bn' ? 'জিমন্যাসিয়াম ম্যানেজমেন্ট' : 'Gym Management',
      items: [
        { label: lang === 'bn' ? 'ড্যাশবোর্ড' : 'Dashboard', path: '/gym/dashboard', icon: LayoutDashboard },
        { label: lang === 'bn' ? 'বিক্রি (Sales)' : 'Sales', path: '/gym/sales', icon: ShoppingCart, perm: 'orders' },
        { label: lang === 'bn' ? 'প্রোডাক্টস (Products)' : 'Products', path: '/gym/products', icon: Package, perm: 'products' },
        { label: lang === 'bn' ? 'আর্থিক রিপোর্ট (Reports)' : 'Financial Reports', path: '/gym/accounting', icon: FileBarChart, perm: 'accounting' },
        { label: lang === 'bn' ? 'সদস্যবৃন্দ (Members)' : 'Members', path: '/gym/members', icon: Users, perm: 'customers' },
        { label: lang === 'bn' ? 'কর্মচারী ও বেতন' : 'Employees', path: '/employees', icon: UserCheck, perm: 'employees' },
        { label: lang === 'bn' ? 'ব্যবহারকারী ও ডিভাইস' : 'Users & Devices', path: '/users', icon: ShieldCheck, perm: 'users' },
        { label: lang === 'bn' ? 'উপস্থিতি (Attendance)' : 'Attendance', path: '/gym/attendance', icon: UserCheck, perm: 'employees' },
        { label: lang === 'bn' ? 'পেমেন্ট ও বিলিং' : 'Payments', path: '/gym/payments', icon: CreditCard, perm: 'payments' },
        { label: lang === 'bn' ? 'প্যাকেজ' : 'Packages', path: '/gym/packages', icon: Package, perm: 'products' },
        { label: lang === 'bn' ? 'ট্রেইনারগণ' : 'Trainers', path: '/gym/trainers', icon: Dumbbell, perm: 'employees' },
        { label: lang === 'bn' ? 'খরচ (Expenses)' : 'Expenses', path: '/expenses', icon: DollarSign, perm: 'expenses' },
        { label: lang === 'bn' ? 'সেটিং (Settings)' : 'Settings', path: '/gym/settings', icon: Settings, perm: 'settings' }
      ]
    }
  ];

  const restaurantMenuSections = [
    {
      title: lang === 'bn' ? 'রেস্তোরাঁ ম্যানেজমেন্ট' : 'Restaurant Management',
      items: [
        { label: lang === 'bn' ? 'ড্যাশবোর্ড' : 'Dashboard', path: '/restaurant/dashboard', icon: LayoutDashboard },
        { label: lang === 'bn' ? 'টেবিল ও ফ্লোর প্ল্যান' : 'Floor & Tables', path: '/restaurant/tables', icon: LayoutGrid, hasChevron: true, perm: 'orders' },
        { label: lang === 'bn' ? 'রেস্তোরাঁ পিওএস (POS)' : 'Restaurant POS', path: '/restaurant/pos', icon: ShoppingCart, hasChevron: true, perm: 'orders' },
        { label: lang === 'bn' ? 'কিচেন ডিসপ্লে (KDS)' : 'Kitchen Screen (KDS)', path: '/restaurant/kds', icon: Flame, hasChevron: true, perm: 'orders' },
        { label: lang === 'bn' ? 'খাবার মেনু ও আইটেম' : 'Food Menu', path: '/restaurant/menu', icon: Utensils, hasChevron: true, perm: 'products' },
        { label: lang === 'bn' ? 'রেসিপি ও খাদ্য খরচ' : 'Recipe BOM', path: '/restaurant/recipes', icon: Layers, hasChevron: true, perm: 'products' },
        { label: lang === 'bn' ? 'কাঁচামাল ও প্যান্ট্রি' : 'Raw Materials', path: '/restaurant/inventory', icon: Package, hasChevron: true, perm: 'products' },
        { label: lang === 'bn' ? 'টেবিল রিজার্ভেশন' : 'Table Bookings', path: '/restaurant/reservations', icon: Calendar, hasChevron: true, perm: 'customers' },
        { label: lang === 'bn' ? 'অর্ডার ও চালান ইতিহাস' : 'Restaurant Orders', path: '/restaurant/orders', icon: Receipt, hasChevron: true, perm: 'orders' },
        { label: lang === 'bn' ? 'ওয়েটার ও স্টাফ' : 'Waiters & Staff', path: '/restaurant/staff', icon: UserCheck, hasChevron: true, perm: 'employees' },
        { label: lang === 'bn' ? 'রেস্তোরাঁ রিপোর্ট' : 'Restaurant Reports', path: '/restaurant/reports', icon: FileBarChart, hasChevron: true, perm: 'accounting' },
        { label: lang === 'bn' ? 'রেস্তোরাঁ সেটিংস' : 'Restaurant Settings', path: '/restaurant/settings', icon: Settings, hasChevron: true, perm: 'settings' },
        { label: lang === 'bn' ? 'দোকানের মূল সেটিংস' : 'Store Settings', path: '/settings/store', icon: Store, hasChevron: true, perm: 'settings' },
      ]
    }
  ];

  const rawMenuSections = isGym ? gymMenuSections : isRestaurant ? restaurantMenuSections : defaultMenuSections;
  const menuSections = rawMenuSections.map((sec) => ({
    ...sec,
    items: sec.items.filter((item) => hasPermission(item.perm)),
  }));

  // Reusable Sidebar Inner Content
  const renderSidebarContent = (isMobile = false) => (
    <div className="flex flex-col h-full justify-between overflow-hidden">
      
      {/* TOP BRAND HEADER */}
      <div className={`${isMobile ? 'p-3 pb-2 drawer-safe-top' : 'p-3.5 pb-2.5'} shrink-0 w-full relative z-30 border-b border-slate-100 dark:border-zinc-800/80`}>
        <div className="flex items-center justify-between gap-2">
          <DropdownMenu className="flex-1 min-w-0">
            <DropdownMenuTrigger className="w-full block outline-none">
              <div className={`w-full flex items-center justify-between ${isMobile ? 'p-2 rounded-xl' : 'p-2.5 rounded-2xl'} bg-slate-50 dark:bg-zinc-900/60 border border-slate-200/80 dark:border-zinc-800/80 hover:border-slate-300 dark:hover:border-zinc-700 transition-all text-left min-w-0 shadow-2xs cursor-pointer`}>
                <div className={`flex items-center ${isMobile ? 'gap-2.5' : 'gap-3'} min-w-0 flex-1 overflow-hidden`}>
                  <div className={`${isMobile ? 'w-8 h-8' : 'w-9 h-9'} rounded-xl bg-[#00df89] text-[#011812] flex items-center justify-center font-bold shadow-xs shrink-0`}>
                    <Store className={`${isMobile ? 'w-4 h-4' : 'w-5 h-5'} stroke-[2.2]`} />
                  </div>
                  {(!collapsed || isMobile) && (
                    <div className="w-0 flex-1 min-w-0 overflow-hidden">
                      <div className={`font-bold ${isMobile ? 'text-xs' : 'text-sm'} text-slate-900 dark:text-white truncate block w-full`}>
                        {mongoShop?.name || activeShop?.name || 'Shopo Store'}
                      </div>
                      <div className={`${isMobile ? 'text-[10px]' : 'text-xs'} text-slate-500 dark:text-zinc-400 font-normal truncate block w-full capitalize`}>
                        {mongoShop?.business_type ? `${mongoShop.business_type} ${lang === 'bn' ? 'স্টোর' : 'Store'}` : (lang === 'bn' ? 'স্টোর ওয়ার্কস্পেস' : 'Store Workspace')}
                      </div>
                    </div>
                  )}
                </div>
                {(!collapsed || isMobile) && (
                  <ChevronsUpDown className={`${isMobile ? 'w-3.5 h-3.5' : 'w-4 h-4'} text-slate-400 shrink-0 ml-1`} />
                )}
              </div>
            </DropdownMenuTrigger>

            <DropdownMenuContent align="left" width="w-64">
              <DropdownMenuLabel className="flex items-center justify-between text-xs font-bold text-slate-500">
                <span>{lang === 'bn' ? 'আমার দোকানসমূহ' : 'My Shops & Outlets'}</span>
                <span className="text-[10px] bg-slate-100 dark:bg-zinc-800 px-1.5 py-0.5 rounded text-slate-500 font-mono">
                  {userShops?.length || 1}
                </span>
              </DropdownMenuLabel>

              {userShops && userShops.length > 0 ? (
                userShops.map((s) => {
                  const isCurrent = (mongoShop?._id && String(mongoShop._id) === String(s._id));
                  return (
                    <DropdownMenuItem
                      key={s._id}
                      onClick={() => handleSwitchShop(s)}
                      className={`flex items-center justify-between gap-2 cursor-pointer ${
                        isCurrent ? 'bg-emerald-500/10 text-[#00a86b] dark:text-[#00df89] font-bold' : ''
                      }`}
                    >
                      <div className="flex items-center gap-2 min-w-0 flex-1 truncate">
                        <Store className="w-3.5 h-3.5 shrink-0 opacity-70" />
                        <span className="truncate">{s.name}</span>
                      </div>
                      {isCurrent && <Check className="w-3.5 h-3.5 shrink-0 text-[#00df89]" />}
                    </DropdownMenuItem>
                  );
                })
              ) : (
                <DropdownMenuItem
                  className="flex items-center justify-between gap-2 bg-emerald-500/10 text-[#00a86b] dark:text-[#00df89] font-bold"
                >
                  <div className="flex items-center gap-2 min-w-0 flex-1 truncate">
                    <Store className="w-3.5 h-3.5 shrink-0 opacity-70" />
                    <span className="truncate">{mongoShop?.name || activeShop?.name || 'Shopo Store'}</span>
                  </div>
                  <Check className="w-3.5 h-3.5 shrink-0 text-[#00df89]" />
                </DropdownMenuItem>
              )}

              {isOwner && (
                <>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    onClick={() => {
                      if (onCloseMobile) onCloseMobile();
                      setIsCreateShopOpen(true);
                    }}
                    className="text-[#00a86b] dark:text-[#00df89] font-semibold cursor-pointer"
                  >
                    <PlusCircle className="w-3.5 h-3.5" />
                    <span>{lang === 'bn' ? '+ নতুন দোকান তৈরি করুন' : '+ Create New Shop'}</span>
                  </DropdownMenuItem>
                </>
              )}

              <DropdownMenuSeparator />

              {hasPermission('settings') && (
                <DropdownMenuItem onClick={() => {
                  if (onCloseMobile) onCloseMobile();
                  navigate('/settings/store');
                }}>
                  <Settings className="w-3.5 h-3.5 text-slate-400" />
                  <span>{lang === 'bn' ? 'স্টোর সেটিংস' : 'Store Settings'}</span>
                </DropdownMenuItem>
              )}

              <DropdownMenuItem onClick={() => {
                if (onCloseMobile) onCloseMobile();
                navigate(isGym ? '/gym/dashboard' : '/dashboard');
              }}>
                <LayoutDashboard className="w-3.5 h-3.5 text-slate-400" />
                <span>{lang === 'bn' ? 'ড্যাশবোর্ড ওভারভিউ' : 'Dashboard Overview'}</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          {/* Close button on mobile drawer */}
          {isMobile && (
            <button
              type="button"
              onClick={onCloseMobile}
              className="w-8 h-8 rounded-xl bg-slate-100 dark:bg-zinc-800 text-slate-500 hover:text-slate-900 dark:hover:text-white flex items-center justify-center cursor-pointer shrink-0"
              title="Close Menu"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {/* MIDDLE SECTION NAV LIST */}
      <div className={`flex-1 overflow-y-auto ${isMobile ? 'px-3 py-2 space-y-3 mobile-drawer-scrollable' : 'px-3.5 py-3 space-y-4'}`}>
        <nav className={`${isMobile ? 'space-y-3' : 'space-y-4'}`}>
          {menuSections.map((sec, sIdx) => (
            <div key={sIdx} className="space-y-1">
              {(!collapsed || isMobile) && (
                <div className={`${isMobile ? 'px-2 text-[10px] pb-1' : 'px-2.5 text-xs pb-1.5'} font-bold uppercase text-slate-400 dark:text-zinc-500 tracking-wider`}>
                  {sec.title}
                </div>
              )}

              {sec.items.map((item, iIdx) => {
                const Icon = item.icon;
                const isActive =
                  location.pathname === item.path ||
                  (item.path !== '/dashboard' && location.pathname.startsWith(item.path + '/'));

                return (
                  <div key={iIdx} className="space-y-1">
                    <NavLink
                      to={item.path}
                      onClick={() => {
                        if (isMobile && onCloseMobile) onCloseMobile();
                      }}
                      className={`flex items-center justify-between ${isMobile ? 'px-3 py-2 rounded-xl text-xs' : 'px-3.5 py-2.5 rounded-xl text-sm'} font-semibold transition-all ${
                        isActive
                          ? 'bg-[#00df89]/15 text-[#00a86b] dark:text-[#00df89] font-bold shadow-2xs border border-[#00df89]/30'
                          : 'text-slate-700 dark:text-zinc-300 hover:bg-slate-100/80 dark:hover:bg-zinc-800/60 hover:text-slate-900 dark:hover:text-white'
                      }`}
                    >
                      <div className={`flex items-center ${isMobile ? 'gap-2.5' : 'gap-3'} min-w-0`}>
                        <Icon className={`${isMobile ? 'w-4 h-4' : 'w-4.5 h-4.5'} shrink-0 ${isActive ? 'text-[#00df89]' : 'text-slate-400 dark:text-zinc-400'}`} />
                        {(!collapsed || isMobile) && <span className="truncate">{item.label}</span>}
                      </div>
                      {(!collapsed || isMobile) && item.isComingSoon ? (
                        <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-600 dark:text-amber-400 font-medium border border-amber-500/20 shrink-0">
                          {lang === 'bn' ? 'আসছে' : 'Soon'}
                        </span>
                      ) : (!collapsed || isMobile) && item.hasChevron ? (
                        <ChevronRight className={`${isMobile ? 'w-3.5 h-3.5' : 'w-4 h-4'} text-slate-400 dark:text-zinc-500 shrink-0`} />
                      ) : null}
                    </NavLink>
                  </div>
                );
              })}
            </div>
          ))}
        </nav>
      </div>

      {/* BOTTOM USER PROFILE BADGE */}
      {(!collapsed || isMobile) && (
        <div className={`${isMobile ? 'p-3' : 'p-3.5'} border-t border-slate-200/90 dark:border-zinc-800/80 shrink-0 w-full relative z-30 bg-slate-50/50 dark:bg-zinc-900/40`}>
          <DropdownMenu className="w-full">
            <DropdownMenuTrigger className="w-full block outline-none">
              <div className={`w-full flex items-center justify-between ${isMobile ? 'p-2 rounded-xl' : 'p-2.5 rounded-2xl'} bg-white dark:bg-zinc-800/80 border border-slate-200/80 dark:border-zinc-700/80 hover:border-slate-300 dark:hover:border-zinc-600 transition-all text-left min-w-0 shadow-2xs cursor-pointer`}>
                <div className={`flex items-center ${isMobile ? 'gap-2.5' : 'gap-3'} min-w-0 flex-1 overflow-hidden`}>
                  {currentUser?.photoURL || mongoUser?.avatar_url ? (
                    <img
                      src={currentUser?.photoURL || mongoUser?.avatar_url}
                      alt="User Avatar"
                      className={`${isMobile ? 'w-8 h-8' : 'w-9 h-9'} rounded-xl shrink-0 object-cover`}
                    />
                  ) : (
                    <div className={`${isMobile ? 'w-8 h-8 text-xs' : 'w-9 h-9 text-sm'} rounded-xl bg-[#00df89] text-[#011812] font-bold flex items-center justify-center shrink-0`}>
                      {(mongoUser?.name || currentUser?.displayName || currentUser?.email || 'U')[0].toUpperCase()}
                    </div>
                  )}
                  <div className="w-0 flex-1 min-w-0 overflow-hidden">
                    <div className={`font-bold ${isMobile ? 'text-xs' : 'text-sm'} text-slate-900 dark:text-white truncate block w-full`}>
                      {mongoUser?.name || currentUser?.displayName || (currentUser?.email ? currentUser.email.split('@')[0] : (lang === 'bn' ? 'ব্যবহারকারী' : 'User'))}
                    </div>
                    <div className={`${isMobile ? 'text-[10px]' : 'text-xs'} text-slate-500 dark:text-zinc-400 font-normal truncate block w-full`}>
                      {mongoUser?.role ? `${mongoUser.role.toUpperCase()} • ` : ''}{currentUser?.email || (lang === 'bn' ? 'অ্যাকাউন্ট' : 'Account')}
                    </div>
                  </div>
                </div>

                <ChevronsUpDown className={`${isMobile ? 'w-3.5 h-3.5' : 'w-4 h-4'} text-slate-400 shrink-0 ml-1`} />
              </div>
            </DropdownMenuTrigger>

            <DropdownMenuContent align="left" width="w-58" className="bottom-full mb-1.5 mt-0">
              <DropdownMenuLabel>
                {lang === 'bn' ? 'অ্যাকাউন্ট ও সেটিংস' : 'Account & Settings'}
              </DropdownMenuLabel>
              <DropdownMenuItem onClick={() => {
                if (onCloseMobile) onCloseMobile();
                navigate('/settings/profile');
              }}>
                <User className="w-3.5 h-3.5 text-slate-400" />
                <span>{lang === 'bn' ? 'প্রোফাইল সেটিংস' : 'Profile Settings'}</span>
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => {
                if (onCloseMobile) onCloseMobile();
                navigate('/settings/store');
              }}>
                <Store className="w-3.5 h-3.5 text-slate-400" />
                <span>{lang === 'bn' ? 'দোকানের সেটিংস' : 'Store Settings'}</span>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                variant="danger"
                onClick={async () => {
                  if (onCloseMobile) onCloseMobile();
                  await logout();
                  navigate('/login');
                }}
              >
                <LogOut className="w-3.5 h-3.5 mr-1.5 text-rose-500" />
                <span className="text-rose-600 dark:text-rose-400">{lang === 'bn' ? 'লগআউট করুন' : 'Sign Out'}</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      )}
    </div>
  );

  return (
    <>
      {/* 1. DESKTOP PINNED SIDEBAR (md:flex) */}
      <aside
        className={`fixed top-0 left-0 bottom-0 z-40 bg-white dark:bg-[#121215] border-r border-slate-200/90 dark:border-zinc-800/80 transition-all duration-200 hidden md:flex flex-col justify-between ${
          collapsed ? 'w-20' : 'w-64'
        }`}
      >
        {renderSidebarContent(false)}
      </aside>

      {/* 2. MOBILE SMOOTH SLIDE-OVER DRAWER (< md) */}
      <AnimatePresence>
        {isMobileOpen && (
          <div className="md:hidden fixed inset-0 z-50 flex pointer-events-auto mobile-sidebar-drawer-container">
            {/* Backdrop: Blocks all clicks/scrolls to background */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              onClick={onCloseMobile}
              className="fixed inset-0 bg-slate-950/75 backdrop-blur-xs z-40 touch-none pointer-events-auto"
            />

            {/* Slide-in Panel from Left */}
            <motion.aside
              initial={{ x: '-100%' }}
              animate={{ x: 0 }}
              exit={{ x: '-100%' }}
              transition={{ type: 'spring', damping: 28, stiffness: 300 }}
              className="relative w-68 sm:w-72 max-w-[80vw] h-full bg-white dark:bg-[#121215] border-r border-slate-200 dark:border-zinc-800 shadow-2xl z-50 flex flex-col overscroll-contain"
            >
              {renderSidebarContent(true)}
            </motion.aside>
          </div>
        )}
      </AnimatePresence>

      {/* CREATE NEW SHOP MODAL */}
      <CreateShopModal
        isOpen={isCreateShopOpen}
        onClose={() => setIsCreateShopOpen(false)}
      />
    </>
  );
}
