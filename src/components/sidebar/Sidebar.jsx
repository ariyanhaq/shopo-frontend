import { useState } from 'react';
import { useShop } from '@/context/ShopContext';
import { useLanguage } from '@/context/LanguageContext';
import { useAuth } from '@/context/AuthContext';
import { NavLink, Link, useLocation, useNavigate } from 'react-router-dom';
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
  Check
} from 'lucide-react';

export default function Sidebar({ collapsed }) {
  const location = useLocation();
  const navigate = useNavigate();
  const { activeShop } = useShop();
  const { lang, t } = useLanguage();
  const { currentUser, mongoUser, mongoShop, userShops, switchShop, logout } = useAuth();

  const [isCreateShopOpen, setIsCreateShopOpen] = useState(false);

  const sb = t?.dashboard?.sidebar || {};

  const isGym = (mongoShop?.business_type || activeShop?.id) === 'gym';

  const handleSwitchShop = async (shop) => {
    if (mongoShop?._id && String(mongoShop._id) === String(shop._id)) return;
    try {
      await switchShop(shop._id);
      toast.success(
        lang === 'bn'
          ? `'${shop.name}' দোকানে সুইচ করা হয়েছে!`
          : `Switched to '${shop.name}'!`
      );
      if (shop.business_type === 'gym') {
        navigate('/gym/dashboard');
      } else {
        navigate('/dashboard');
      }
    } catch (err) {
      toast.error(err.message || 'Failed to switch shop.');
    }
  };

  const isOwner = mongoUser?.role === 'owner';
  const isManager = mongoUser?.role === 'manager';
  const userPerms = Array.isArray(mongoUser?.permissions) ? mongoUser.permissions : [];

  const hasPermission = (permKey) => {
    if (isOwner || isManager) return true;
    if (!permKey) return true;
    if (permKey === 'users') return isOwner || isManager;
    return userPerms.includes(permKey);
  };

  const defaultMenuSections = [
    {
      title: sb.platform || 'Platform',
      items: [
        { label: sb.dashboard || 'Dashboard', path: '/dashboard', icon: LayoutDashboard },
        { label: sb.sales || 'Sales', path: '/sales', icon: ShoppingCart, hasChevron: true, perm: 'orders' },
        { label: sb.pos || 'POS & Retail', path: '/pos', icon: Store, perm: 'pos' },
        { label: sb.products || 'Products', path: '/products', icon: Package, hasChevron: true, perm: 'products' },
        { label: lang === 'bn' ? 'পণ্য ক্রয় (Purchases)' : 'Purchases', path: '/purchases', icon: ShoppingBag, hasChevron: true, perm: 'purchases' },
        { label: lang === 'bn' ? 'সাপ্লায়ার (Suppliers)' : 'Suppliers', path: '/suppliers', icon: Building2, hasChevron: true, perm: 'suppliers' },
        { label: lang === 'bn' ? 'কাস্টমার ও গ্রাহক' : 'Customers', path: '/customers', icon: Users, hasChevron: true, perm: 'customers' },
        { label: lang === 'bn' ? 'মেম্বারশিপ ও রিওয়ার্ড' : 'Members & Rewards', path: '/members', icon: Crown, hasChevron: true, perm: 'customers' },
        { label: lang === 'bn' ? 'কর্মচারী ও বেতন' : 'Employees', path: '/employees', icon: UserCheck, hasChevron: true, perm: 'employees' },
        { label: lang === 'bn' ? 'দোকানের খরচ (Expenses)' : 'Expenses', path: '/expenses', icon: DollarSign, hasChevron: true, perm: 'expenses' },
        { label: lang === 'bn' ? 'ব্যবহারকারী ও রোল' : 'Users', path: '/users', icon: ShieldCheck, hasChevron: true, perm: 'users' },
        { label: sb.accounting || 'Accounting & Finance', path: '/accounting', icon: Wallet, hasChevron: true, perm: 'accounting' },
        { label: sb.settings || 'Settings', path: '/dashboard/settings', icon: Settings, hasChevron: true, perm: 'settings' }
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
        { label: lang === 'bn' ? 'হিসাব ও অর্থ (Accounting)' : 'Accounting', path: '/gym/accounting', icon: Wallet, perm: 'accounting' },
        { label: lang === 'bn' ? 'সদস্যবৃন্দ (Members)' : 'Members', path: '/gym/members', icon: Users, perm: 'customers' },
        { label: lang === 'bn' ? 'কর্মচারী ও বেতন' : 'Employees', path: '/employees', icon: UserCheck, perm: 'employees' },
        { label: lang === 'bn' ? 'ব্যবহারকারী ও রোল' : 'Users', path: '/users', icon: ShieldCheck, perm: 'users' },
        { label: lang === 'bn' ? 'উপস্থিতি (Attendance)' : 'Attendance', path: '/gym/attendance', icon: UserCheck, perm: 'employees' },
        { label: lang === 'bn' ? 'পেমেন্ট ও বিলিং' : 'Payments', path: '/gym/payments', icon: CreditCard, perm: 'payments' },
        { label: lang === 'bn' ? 'প্যাকেজ' : 'Packages', path: '/gym/packages', icon: Package, perm: 'products' },
        { label: lang === 'bn' ? 'ট্রেইনারগণ' : 'Trainers', path: '/gym/trainers', icon: Dumbbell, perm: 'employees' },
        { label: lang === 'bn' ? 'খরচ (Expenses)' : 'Expenses', path: '/expenses', icon: DollarSign, perm: 'expenses' },
        { label: lang === 'bn' ? 'সেটিং (Settings)' : 'Settings', path: '/gym/settings', icon: Settings, perm: 'settings' }
      ]
    }
  ];

  const rawMenuSections = isGym ? gymMenuSections : defaultMenuSections;
  const menuSections = rawMenuSections.map((sec) => ({
    ...sec,
    items: sec.items.filter((item) => hasPermission(item.perm)),
  }));

  return (
    <>
      <aside
        className={`fixed top-0 left-0 bottom-0 z-40 bg-white dark:bg-[#121215] border-r border-slate-200/90 dark:border-zinc-800/80 transition-all duration-200 flex flex-col justify-between hidden md:flex ${
          collapsed ? 'w-20' : 'w-64'
        }`}
      >
        {/* TOP BRAND HEADER (PINNED) */}
        <div className="p-3 pb-2 shrink-0 w-full relative z-30">
          <DropdownMenu className="w-full">
            <DropdownMenuTrigger className="w-full block outline-none">
              <div className="w-full flex items-center justify-between p-2.5 rounded-xl bg-slate-50 dark:bg-zinc-900/60 border border-slate-200/80 dark:border-zinc-800/80 hover:border-slate-300 dark:hover:border-zinc-700 transition-all text-left min-w-0">
                <div className="flex items-center gap-2.5 min-w-0 flex-1 overflow-hidden">
                  <div className="w-9 h-9 rounded-xl bg-[#00df89] text-[#011812] flex items-center justify-center font-bold shadow-xs shrink-0">
                    <Store className="w-5 h-5 stroke-[2.2]" />
                  </div>
                  {!collapsed && (
                    <div className="w-0 flex-1 min-w-0 overflow-hidden">
                      <div className="font-bold text-sm text-slate-900 dark:text-white truncate block w-full">
                        {mongoShop?.name || activeShop?.name || 'Shopo Store'}
                      </div>
                      <div className="text-[11px] text-slate-500 dark:text-zinc-400 font-normal truncate block w-full capitalize">
                        {mongoShop?.business_type ? `${mongoShop.business_type} ${lang === 'bn' ? 'স্টোর' : 'Store'}` : (lang === 'bn' ? 'স্টোর ওয়ার্কস্পেস' : 'Store Workspace')}
                      </div>
                    </div>
                  )}
                </div>
                {!collapsed && (
                  <ChevronsUpDown className="w-4 h-4 text-slate-400 shrink-0 ml-1.5" />
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
                    onClick={() => setIsCreateShopOpen(true)}
                    className="text-[#00a86b] dark:text-[#00df89] font-semibold cursor-pointer"
                  >
                    <PlusCircle className="w-3.5 h-3.5" />
                    <span>{lang === 'bn' ? '+ নতুন দোকান তৈরি করুন' : '+ Create New Shop'}</span>
                  </DropdownMenuItem>
                </>
              )}

              <DropdownMenuSeparator />

              {hasPermission('settings') && (
                <DropdownMenuItem onClick={() => navigate('/dashboard/settings')}>
                  <Settings className="w-3.5 h-3.5 text-slate-400" />
                  <span>{lang === 'bn' ? 'স্টোর সেটিংস' : 'Store Settings'}</span>
                </DropdownMenuItem>
              )}

              <DropdownMenuItem onClick={() => navigate(isGym ? '/gym/dashboard' : '/dashboard')}>
                <LayoutDashboard className="w-3.5 h-3.5 text-slate-400" />
                <span>{lang === 'bn' ? 'ড্যাশবোর্ড ওভারভিউ' : 'Dashboard Overview'}</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

      {/* MIDDLE SECTION NAV LIST (VERTICALLY SCROLLABLE WITH HIDDEN SCROLLBAR) */}
      <div className="flex-1 overflow-y-auto no-scrollbar px-3 py-2 space-y-4">
        <nav className="space-y-4">
          {menuSections.map((sec, sIdx) => (
            <div key={sIdx} className="space-y-1">
              {!collapsed && (
                <div className="px-2 text-xs font-medium uppercase text-slate-400 dark:text-zinc-500 tracking-wider pb-1">
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
                      className={`flex items-center justify-between px-3 py-2.5 rounded-xl text-sm font-medium transition-colors ${
                        isActive
                          ? 'bg-slate-100 dark:bg-zinc-800/80 text-slate-900 dark:text-white shadow-xs'
                          : 'text-slate-700 dark:text-zinc-300 hover:bg-slate-50 dark:hover:bg-zinc-800/40 hover:text-slate-900 dark:hover:text-white font-normal'
                      }`}
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <Icon className={`w-4.5 h-4.5 shrink-0 ${isActive ? 'text-[#00df89]' : 'text-slate-500 dark:text-zinc-400'}`} />
                        {!collapsed && <span className="truncate">{item.label}</span>}
                      </div>
                      {!collapsed && item.isComingSoon ? (
                        <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-600 dark:text-amber-400 font-medium border border-amber-500/20 shrink-0">
                          {lang === 'bn' ? 'আসছে' : 'Coming Soon'}
                        </span>
                      ) : !collapsed && item.hasChevron ? (
                        <ChevronRight className="w-4 h-4 text-slate-400 dark:text-zinc-500 shrink-0" />
                      ) : null}
                    </NavLink>
                  </div>
                );
              })}
            </div>
          ))}
        </nav>
      </div>

      {/* BOTTOM USER PROFILE BADGE (PINNED AT BOTTOM) */}
      {!collapsed && (
        <div className="p-3 border-t border-slate-200/90 dark:border-zinc-800/80 shrink-0 w-full relative z-30">
          <DropdownMenu className="w-full">
            <DropdownMenuTrigger className="w-full block outline-none">
              <div className="w-full flex items-center justify-between p-2.5 rounded-xl bg-slate-50 dark:bg-zinc-900/60 border border-slate-200/80 dark:border-zinc-800/80 hover:border-slate-300 dark:hover:border-zinc-700 transition-all text-left min-w-0">
                <div className="flex items-center gap-2.5 min-w-0 flex-1 overflow-hidden">
                  {currentUser?.photoURL ? (
                    <img
                      src={currentUser.photoURL}
                      alt="User Avatar"
                      className="w-9 h-9 rounded-xl shrink-0 object-cover"
                    />
                  ) : (
                    <div className="w-9 h-9 rounded-xl bg-[#00df89] text-[#011812] font-bold text-xs flex items-center justify-center shrink-0">
                      {(currentUser?.displayName || currentUser?.email || 'U')[0].toUpperCase()}
                    </div>
                  )}
                  <div className="w-0 flex-1 min-w-0 overflow-hidden">
                    <div className="font-semibold text-xs text-slate-900 dark:text-white truncate block w-full">
                      {currentUser?.displayName || (currentUser?.email ? currentUser.email.split('@')[0] : (lang === 'bn' ? 'ব্যবহারকারী' : 'User'))}
                    </div>
                    <div className="text-[10px] text-slate-500 dark:text-zinc-400 font-normal truncate block w-full">
                      {currentUser?.email || (lang === 'bn' ? 'মালিক ও ম্যানেজার' : 'Owner & Manager')}
                    </div>
                  </div>
                </div>

                <ChevronsUpDown className="w-4 h-4 text-slate-400 shrink-0 ml-1.5" />
              </div>
            </DropdownMenuTrigger>

            <DropdownMenuContent align="left" width="w-58" className="bottom-full mb-1.5 mt-0">
              <DropdownMenuLabel>
                {lang === 'bn' ? 'অ্যাকাউন্ট' : 'My Account'}
              </DropdownMenuLabel>
              <DropdownMenuItem onClick={() => navigate('/dashboard/settings')}>
                <User className="w-3.5 h-3.5 text-slate-400" />
                <span>{lang === 'bn' ? 'প্রোফাইল সেটিংস' : 'Profile Settings'}</span>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                variant="danger"
                onClick={async () => {
                  await logout();
                  navigate('/login');
                }}
              >
                <LogOut className="w-3.5 h-3.5" />
                <span>{lang === 'bn' ? 'লগআউট করুন' : 'Log out'}</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      )}
    </aside>

    {/* CREATE NEW SHOP MODAL */}
    <CreateShopModal
      isOpen={isCreateShopOpen}
      onClose={() => setIsCreateShopOpen(false)}
    />
  </>
);
}
