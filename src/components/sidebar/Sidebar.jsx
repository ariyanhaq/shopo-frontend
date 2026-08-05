/**
 * @file Sidebar.jsx
 * @description Hishab/Shopo left sidebar with "Coming Soon" badge for POS & Retail.
 */
import { useShop } from '@/context/ShopContext';
import { useLanguage } from '@/context/LanguageContext';
import { NavLink, Link, useLocation } from 'react-router-dom';
import {
  Store, LayoutDashboard, ShoppingCart, Package, Users, UserCheck,
  BarChart3, Settings, ChevronRight, ChevronsUpDown, ShieldCheck,
  Wallet, HelpCircle, Layers, Building2, Sparkles, FolderPlus,
  ArrowLeftRight
} from 'lucide-react';

export default function Sidebar({ collapsed }) {
  const location = useLocation();
  const { activeShop } = useShop();
  const { lang, t } = useLanguage();

  const sb = t?.dashboard?.sidebar || {};

  const menuSections = [
    {
      title: sb.platform || 'Platform',
      items: [
        { label: sb.dashboard || 'Dashboard', path: '/dashboard', icon: LayoutDashboard },
        { label: sb.sales || 'Sales', path: '/sales', icon: ShoppingCart, hasChevron: true },
        { label: sb.products || 'Products', path: '/products', icon: Package, hasChevron: true },
        { label: sb.pos || 'POS & Retail', path: '/pos', icon: Store, isComingSoon: true },
        { label: sb.accounting || 'Accounting & Finance', path: '/accounting', icon: Wallet, hasChevron: true },
        { label: sb.settings || 'Settings', path: '/dashboard/settings', icon: Settings, hasChevron: true }
      ]
    }
  ];

  return (
    <aside
      className={`fixed top-0 left-0 bottom-0 z-40 bg-white dark:bg-[#121215] border-r border-slate-200/90 dark:border-zinc-800/80 transition-all duration-200 flex flex-col justify-between hidden md:flex ${
        collapsed ? 'w-20' : 'w-64'
      }`}
    >
      {/* TOP BRAND HEADER */}
      <div className="p-4 space-y-4">
        
        {/* Brand Dropdown Header */}
        <div className="flex items-center justify-between p-2.5 rounded-xl bg-slate-50 dark:bg-zinc-900/60 border border-slate-200/80 dark:border-zinc-800/80">
          <Link to="/" className="flex items-center gap-3 min-w-0">
            <div className="w-9 h-9 rounded-xl bg-[#00df89] text-[#011812] flex items-center justify-center font-medium shadow-xs shrink-0">
              <Store className="w-5 h-5 stroke-[2]" />
            </div>
            {!collapsed && (
              <div className="min-w-0">
                <div className="font-medium text-sm text-slate-900 dark:text-white truncate">
                  {activeShop ? activeShop.name : 'Shopo Enterprise'}
                </div>
                <div className="text-xs text-slate-500 dark:text-zinc-400 font-normal truncate">
                  {lang === 'bn' ? 'ওয়ার্কস্পেস ইন্টারপ্রাইজ' : 'Enterprise Workspace'}
                </div>
              </div>
            )}
          </Link>
          {!collapsed && (
            <ChevronsUpDown className="w-4 h-4 text-slate-400 shrink-0 cursor-pointer" />
          )}
        </div>

        {/* SECTION NAV LIST */}
        <nav className="space-y-4 pt-1">
          {menuSections.map((sec, sIdx) => (
            <div key={sIdx} className="space-y-1">
              {!collapsed && (
                <div className="px-2 text-xs font-medium uppercase text-slate-400 dark:text-zinc-500 tracking-wider">
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
                      className={`flex items-center justify-between px-3.5 py-2.5 rounded-xl text-sm font-medium transition-colors ${
                        isActive
                          ? 'bg-slate-100 dark:bg-zinc-800/80 text-slate-900 dark:text-white shadow-xs'
                          : 'text-slate-700 dark:text-zinc-300 hover:bg-slate-50 dark:hover:bg-zinc-800/40 hover:text-slate-900 dark:hover:text-white font-normal'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <Icon className={`w-4.5 h-4.5 shrink-0 ${isActive ? 'text-[#00df89]' : 'text-slate-500 dark:text-zinc-400'}`} />
                        {!collapsed && <span>{item.label}</span>}
                      </div>
                      {!collapsed && item.isComingSoon ? (
                        <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-600 dark:text-amber-400 font-medium border border-amber-500/20">
                          {lang === 'bn' ? 'আসছে' : 'Coming Soon'}
                        </span>
                      ) : !collapsed && item.hasChevron ? (
                        <ChevronRight className="w-4 h-4 text-slate-400 dark:text-zinc-500" />
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
      {!collapsed && (
        <div className="p-3 border-t border-slate-200/90 dark:border-zinc-800/80">
          <div className="flex items-center justify-between p-2.5 rounded-xl bg-slate-50 dark:bg-zinc-900/60 border border-slate-200/80 dark:border-zinc-800/80 cursor-pointer">
            <div className="flex items-center gap-3 min-w-0">
              <div className="w-9 h-9 rounded-full bg-emerald-500/10 text-[#00a86b] dark:text-[#00df89] font-medium text-xs flex items-center justify-center shrink-0">
                SM
              </div>
              <div className="min-w-0">
                <div className="font-medium text-sm text-slate-900 dark:text-white truncate">
                  {lang === 'bn' ? 'শিহাব মুহাম্মদ' : 'Sheehab Muhammad'}
                </div>
                <div className="text-xs text-slate-500 dark:text-zinc-400 font-normal truncate">
                  {lang === 'bn' ? 'মালিক ও ম্যানেজার' : 'Owner & Manager'}
                </div>
              </div>
            </div>
            <ChevronsUpDown className="w-4 h-4 text-slate-400 shrink-0" />
          </div>
        </div>
      )}
    </aside>
  );
}
