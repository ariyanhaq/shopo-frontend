/**
 * @file Dashboard.jsx
 * @description Comprehensive Real-Time Dashboard connected to MongoDB Atlas with live metrics, product inventory overview, sales performance, and quick actions.
 */
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useShop } from '@/context/ShopContext';
import { useLanguage } from '@/context/LanguageContext';
import { useAuth } from '@/context/AuthContext';
import api from '@/services/api';
import { Card, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import {
  DollarSign, ShoppingCart, Users, Globe,
  Calendar, Plus, FileText, PackagePlus, AlertTriangle, CheckCircle2,
  Loader2, Sparkles, RefreshCw, Package, Tag, ArrowRight, ArrowUpRight,
  Boxes, Store
} from 'lucide-react';

import GymDashboard from '../gym/GymDashboard';
import {
  ExpiringProductsWidget,
  GymAttendanceWidget,
  KitchenQueueWidget,
  GoldRateWidget
} from '@/components/dashboard/IndustryWidgets';

export default function Dashboard() {
  const navigate = useNavigate();
  const { activeShop } = useShop();
  const { lang, t, formatNumber, formatPrice, toBn } = useLanguage();
  const { mongoShop } = useAuth();
  const [liveMetrics, setLiveMetrics] = useState(null);
  const [isLoadingMetrics, setIsLoadingMetrics] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const currentBusinessType = (mongoShop?.business_type || activeShop?.id || '').toLowerCase();
  const isGrocery = currentBusinessType === 'grocery';
  const isGym = currentBusinessType === 'gym';

  const fetchMetrics = async (showRefreshSpinner = false) => {
    if (showRefreshSpinner) setIsRefreshing(true);
    try {
      const res = await api.analytics.getDashboard();
      if (res.data) {
        setLiveMetrics(res.data);
      }
    } catch (err) {
      console.warn('Dashboard live metrics fetch error:', err.message);
    } finally {
      setIsLoadingMetrics(false);
      if (showRefreshSpinner) setIsRefreshing(false);
    }
  };

  useEffect(() => {
    fetchMetrics();
  }, []);

  if (isGym) {
    return <GymDashboard />;
  }

  const d = t?.dashboard || {};

  const monthRev = liveMetrics?.month?.revenue ?? 0;
  const monthOrders = liveMetrics?.month?.orders ?? 0;
  const totalProducts = liveMetrics?.inventory?.totalProducts ?? 0;
  const lowStock = liveMetrics?.inventory?.lowStockProducts ?? 0;
  const lowStockList = (liveMetrics?.inventory?.lowStockList ?? []).slice(0, 4);
  const recentSales = (liveMetrics?.recentSales ?? []).slice(0, 4);
  const recentProducts = (liveMetrics?.recentProducts ?? []).slice(0, 4);
  const totalCustomers = liveMetrics?.totalCustomers ?? 0;
  const salesTrend = liveMetrics?.dailySalesTrend ?? [];

  // Max daily revenue for scaling bars dynamically
  const maxRevenue = Math.max(...salesTrend.map(t => t.revenue), 1000);

  const statCardsData = [
    {
      title: d.totalRevenue || (lang === 'bn' ? 'মোট বিক্রয় আয়' : 'Total Revenue'),
      icon: DollarSign,
      value: formatPrice(monthRev),
      change: `${formatNumber(monthRev > 0 ? 100 : 0)}% ${d.vsLastMonth || (lang === 'bn' ? 'চলতি মাস' : 'this month')}`,
      isPositive: monthRev > 0
    },
    {
      title: d.totalSales || (lang === 'bn' ? 'মোট বিক্রয় অর্ডার' : 'Total Sales Orders'),
      icon: ShoppingCart,
      value: formatNumber(monthOrders),
      change: `${formatNumber(monthOrders)} ${lang === 'bn' ? 'টি অর্ডার রেকর্ড হয়েছে' : 'orders recorded'}`,
      isPositive: monthOrders > 0
    },
    {
      title: lang === 'bn' ? 'ক্যাটালগে মোট পণ্য' : 'Products in Catalog',
      icon: Package,
      value: formatNumber(totalProducts),
      change: `${formatNumber(lowStock)} ${lang === 'bn' ? 'টি পণ্যে স্বল্প স্টক' : 'Low Stock'}`,
      isPositive: lowStock === 0
    },
    {
      title: lang === 'bn' ? 'মোট নিবন্ধিত গ্রাহক' : 'Total Customers',
      icon: Users,
      value: formatNumber(totalCustomers),
      change: `${formatPrice(liveMetrics?.today?.revenue ?? 0)} ${lang === 'bn' ? 'আজকের বিক্রি' : 'today sales'}`,
      isPositive: true
    }
  ];

  return (
    <div className="space-y-6 font-sans pb-12">
      
      {/* ---------------------------------------------------- */}
      {/* TOP HEADER & LIVE REFRESH BUTTON                     */}
      {/* ---------------------------------------------------- */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white tracking-tight flex items-center gap-2.5">
            <Store className="w-6 h-6 text-[#00df89]" />
            <span>{mongoShop?.name || activeShop?.name || 'My Store'} {lang === 'bn' ? 'ড্যাশবোর্ড' : 'Overview'}</span>
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-zinc-400 font-normal">
            {lang === 'bn'
              ? 'মঙ্গোডিবি ক্লাউড থেকে রিয়েল-টাইম পণ্য, বিক্রয় এবং আয় খতিয়ান'
              : 'Real-time sales, live inventory catalog and cloud database metrics'}
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="default"
            size="sm"
            onClick={() => navigate('/sales/new')}
            className="bg-[#00df89] hover:bg-[#00c97b] text-[#011812] font-semibold text-xs gap-1.5 shadow-xs"
          >
            <Plus className="w-4 h-4 stroke-[2.5]" />
            <span>{lang === 'bn' ? 'নতুন বিক্রি / ক্যাশ মেমো' : 'New Sale / POS'}</span>
          </Button>
        </div>
      </div>

      {/* ---------------------------------------------------- */}
      {/* ---------------------------------------------------- */}
      {/* TOP STAT CARDS ROW (2 Columns on Mobile, 4 on Desktop) */}
      {/* ---------------------------------------------------- */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        {statCardsData.map((stat, idx) => {
          const Icon = stat.icon;
          return (
            <Card key={idx} className="p-3.5 sm:p-5 hover:shadow-xs transition-shadow border border-slate-200/90 dark:border-zinc-800/80 dark:bg-[#121215] flex flex-col justify-between">
              <div className="flex items-center justify-between gap-1.5">
                <span className="text-[11px] sm:text-sm font-medium text-slate-600 dark:text-zinc-400 truncate">
                  {stat.title}
                </span>
                <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg bg-slate-100 dark:bg-zinc-800/80 text-slate-500 dark:text-zinc-400 flex items-center justify-center shrink-0">
                  <Icon className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                </div>
              </div>

              <div className="mt-2.5 sm:mt-3 space-y-1">
                <div className="text-2xl sm:text-3xl font-bold text-slate-900 dark:text-white tracking-tight truncate">
                  {isLoadingMetrics ? (
                    <div className="h-8 w-24 bg-slate-200 dark:bg-zinc-800 animate-pulse rounded-md" />
                  ) : (
                    stat.value
                  )}
                </div>
                <div className="flex items-center gap-1 text-[10px] sm:text-xs font-medium truncate">
                  <span className={stat.isPositive ? 'text-[#00a86b] dark:text-[#00df89]' : 'text-amber-500'}>
                    {stat.change}
                  </span>
                </div>
              </div>
            </Card>
          );
        })}
      </div>

      {/* ---------------------------------------------------- */}
      {/* MIDDLE ROW: Sales Performance Chart + Quick Actions */}
      {/* ---------------------------------------------------- */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Sales Performance Chart (2 Columns) */}
        <Card className="lg:col-span-2 p-6 flex flex-col justify-between border border-slate-200/90 dark:border-zinc-800/80 dark:bg-[#121215]">
          <div>
            <div className="flex items-center justify-between mb-4">
              <div>
                <CardTitle className="text-base sm:text-lg font-bold">
                  {d.salesPerformance || 'Sales Performance'}
                </CardTitle>
                <CardDescription className="text-xs sm:text-sm font-normal">
                  {d.salesOverviewSub || 'Daily sales overview for this month from database'}
                </CardDescription>
              </div>

              <Button variant="outline" size="sm" className="gap-1.5 text-xs font-medium dark:bg-[#09090b]">
                <Calendar className="w-3.5 h-3.5 text-slate-400 dark:text-zinc-400" />
                <span>{lang === 'bn' ? 'এই মাস' : 'This Month'}</span>
              </Button>
            </div>

            {/* Vertical Bar Chart (Dynamic from DB) */}
            <div className="h-44 sm:h-52 flex items-end justify-between gap-1 pt-6 pb-2 border-b border-slate-100 dark:border-zinc-800/80">
              {salesTrend.length > 0 ? (
                salesTrend.map((item, bIdx) => {
                  const barHeight = item.revenue > 0 ? Math.max(12, Math.round((item.revenue / maxRevenue) * 100)) : 6;
                  return (
                    <div key={bIdx} className="flex-1 flex flex-col items-center gap-1 group h-full justify-end">
                      <div
                        style={{ height: `${barHeight}%` }}
                        className={`w-full rounded-t-sm transition-all duration-150 relative ${
                          item.revenue > 0 ? 'bg-[#00df89] hover:bg-[#00c97b]' : 'bg-slate-200 dark:bg-zinc-800/60'
                        }`}
                      >
                        {/* Tooltip on hover */}
                        <div className="opacity-0 group-hover:opacity-100 absolute -top-8 left-1/2 -translate-x-1/2 bg-slate-900 dark:bg-zinc-800 text-white text-[10px] font-normal px-1.5 py-0.5 rounded shadow-md pointer-events-none transition-opacity whitespace-nowrap z-10">
                          {lang === 'bn' ? `দিন ${item.day}: ৳${item.revenue.toLocaleString()}` : `Day ${item.day}: ৳${item.revenue.toLocaleString()}`}
                        </div>
                      </div>
                    </div>
                  );
                })
              ) : (
                <div className="w-full h-full flex items-center justify-center text-xs text-slate-400 dark:text-zinc-500">
                  {lang === 'bn' ? 'কোন বিক্রয় ডেটা পাওয়া যায়নি' : 'No sales recorded for this period'}
                </div>
              )}
            </div>
          </div>

          <div className="flex items-center justify-between pt-4 text-xs font-medium">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-[#00df89]" />
              <span className="text-slate-600 dark:text-zinc-400 font-medium">
                {d.dailySales || 'Daily Sales'}
              </span>
            </div>
            <span className="text-[#00a86b] dark:text-[#00df89] font-semibold">
              ৳ {monthRev.toLocaleString()} {lang === 'bn' ? 'চলতি মাসে সংগৃহীত' : 'accumulated this month'}
            </span>
          </div>
        </Card>

        {/* Quick Actions Panel (1 Column) */}
        <Card className="p-6 flex flex-col justify-between space-y-4 border border-slate-200/90 dark:border-zinc-800/80 dark:bg-[#121215]">
          <div>
            <CardTitle className="text-base sm:text-lg font-bold">
              {d.quickActions || 'Quick Actions'}
            </CardTitle>
            <CardDescription className="text-xs sm:text-sm font-normal mb-4">
              {d.quickActionsSub || 'Common shortcuts and management tools'}
            </CardDescription>

            <div className="space-y-2.5">
              {/* Primary Green Action */}
              <Button
                variant="default"
                onClick={() => navigate('/sales/new')}
                className="w-full justify-start h-11 text-xs sm:text-sm bg-[#00df89] hover:bg-[#00c97b] text-[#011812] font-semibold"
              >
                <Plus className="w-4 h-4 stroke-[2.5]" />
                <span>{d.newSale || 'New Sale / Cash Memo'}</span>
              </Button>

              {/* Secondary Outline Actions */}
              <Button
                variant="outline"
                onClick={() => navigate('/products', { state: { openAddModal: true } })}
                className="w-full justify-start h-11 text-xs sm:text-sm font-medium dark:bg-[#09090b]"
              >
                <PackagePlus className="w-4 h-4 text-slate-400 dark:text-zinc-400" />
                <span>{d.addProduct || 'Add New Product'}</span>
              </Button>

              <Button variant="outline" onClick={() => navigate('/sales')} className="w-full justify-start h-11 text-xs sm:text-sm font-medium dark:bg-[#09090b] cursor-pointer">
                <ShoppingCart className="w-4 h-4 text-slate-400 dark:text-zinc-400" />
                <span>{lang === 'bn' ? 'বিক্রয় ও ইনভয়েস হিস্ট্রি' : 'Sales & Invoices'}</span>
              </Button>

              <Button variant="outline" onClick={() => navigate('/customers')} className="w-full justify-start h-11 text-xs sm:text-sm font-medium dark:bg-[#09090b]">
                <Users className="w-4 h-4 text-slate-400 dark:text-zinc-400" />
                <span>{lang === 'bn' ? 'গ্রাহক ও বাকি খাতা' : 'Customers & Dues'}</span>
              </Button>
            </div>
          </div>

          <div className="pt-2 border-t border-slate-100 dark:border-zinc-800/80 text-center">
            <Button variant="link" onClick={() => navigate('/products')} className="text-xs font-medium text-slate-600 dark:text-zinc-400 hover:text-[#00a86b] dark:hover:text-[#00df89]">
              {lang === 'bn' ? 'সম্পূর্ণ ইনভেন্টরি ক্যাটালগ দেখুন' : 'View Full Inventory Catalog'} →
            </Button>
          </div>
        </Card>

      </div>

      {/* ---------------------------------------------------- */}
      {/* REAL-TIME PRODUCT INVENTORY OVERVIEW (LIVE FROM DB)  */}
      {/* ---------------------------------------------------- */}
      <Card className="p-6 space-y-4 border border-slate-200/90 dark:border-zinc-800/80 dark:bg-[#121215]">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <CardTitle className="text-base sm:text-lg font-bold flex items-center gap-2">
              <Boxes className="w-5 h-5 text-[#00df89]" />
              <span>{lang === 'bn' ? 'লাইভ পণ্য ও স্টক তালিকা' : 'Live Product Inventory & Stock'}</span>
            </CardTitle>
            <CardDescription className="text-xs sm:text-sm font-normal">
              {lang === 'bn'
                ? 'আপনার ডাটাবেজে সংরক্ষিত সর্বশেষ পণ্যসমূহ ও বর্তমান স্টক'
                : 'Latest live products added in database with real-time stock levels'}
            </CardDescription>
          </div>

          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => navigate('/products', { state: { openAddModal: true } })}
              className="text-xs font-medium dark:bg-[#09090b] gap-1.5"
            >
              <Plus className="w-3.5 h-3.5 text-[#00df89]" />
              <span>{lang === 'bn' ? 'পণ্য যোগ করুন' : 'Add Product'}</span>
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => navigate('/products')}
              className="text-xs font-medium dark:bg-[#09090b]"
            >
              {lang === 'bn' ? 'সব পণ্য' : 'View All Products'}
            </Button>
          </div>
        </div>

        {isLoadingMetrics ? (
          <div className="p-4 space-y-2">
            {[1, 2, 3, 4].map((i) => (
              <Skeleton key={i} className="h-12 w-full" />
            ))}
          </div>
        ) : recentProducts.length > 0 ? (
          <div className="overflow-x-auto -mx-6 px-6 sm:mx-0 sm:px-0">
            <table className="w-full text-xs text-left min-w-[700px]">
              <thead className="bg-slate-50 dark:bg-zinc-900/60 text-slate-500 border-b border-slate-200 dark:border-zinc-800">
                <tr>
                  <th className="p-3 whitespace-nowrap">{lang === 'bn' ? 'পণ্যের নাম' : 'Product Name'}</th>
                  <th className="p-3 whitespace-nowrap">{lang === 'bn' ? 'ক্যাটাগরি' : 'Category'}</th>
                  <th className="p-3 whitespace-nowrap">{lang === 'bn' ? 'এসকেইউ (SKU)' : 'SKU'}</th>
                  <th className="p-3 whitespace-nowrap">{lang === 'bn' ? 'বিক্রয় মূল্য' : 'Selling Price'}</th>
                  <th className="p-3 whitespace-nowrap">{lang === 'bn' ? 'স্টক সংখ্যা' : 'Stock Level'}</th>
                  <th className="p-3 whitespace-nowrap">{lang === 'bn' ? 'স্ট্যাটাস' : 'Status'}</th>
                  <th className="p-3 whitespace-nowrap text-right">{lang === 'bn' ? 'অ্যাকশন' : 'Action'}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-zinc-800/80">
                {recentProducts.map((p) => {
                  const isLow = p.stock_quantity <= (p.low_stock_threshold || 5);
                  const isOut = p.stock_quantity <= 0;
                  return (
                    <tr key={p._id} className="hover:bg-slate-50/50 dark:hover:bg-zinc-800/30 transition-colors">
                      <td className="p-3 font-semibold text-slate-900 dark:text-white flex items-center gap-2.5 whitespace-nowrap">
                        {p.image_url || (Array.isArray(p.images) && p.images[0]) ? (
                          <img
                            src={p.image_url || p.images[0]}
                            alt={p.name}
                            className="w-7 h-7 rounded-lg object-cover border border-slate-200 dark:border-zinc-800 shrink-0 shadow-2xs"
                            onError={(e) => {
                              e.target.style.display = 'none';
                            }}
                          />
                        ) : (
                          <Package className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                        )}
                        <span className="truncate max-w-[200px]">{p.name}</span>
                      </td>
                      <td className="p-3 text-slate-500 dark:text-zinc-400 whitespace-nowrap">
                        <Badge variant="secondary" className="text-[10px] whitespace-nowrap">
                          {p.category_id?.name || (lang === 'bn' ? 'সাধারণ' : 'General')}
                        </Badge>
                      </td>
                      <td className="p-3 font-mono text-[11px] text-slate-400 whitespace-nowrap">
                        {toBn(p.sku || 'N/A')}
                      </td>
                      <td className="p-3 font-semibold text-slate-900 dark:text-white whitespace-nowrap">
                        {formatPrice(p.selling_price || 0)}
                      </td>
                      <td className="p-3 text-slate-700 dark:text-zinc-300 font-medium whitespace-nowrap">
                        {formatNumber(p.stock_quantity)} {p.unit ? (lang === 'bn' && p.unit === 'pcs' ? 'টি' : p.unit) : (lang === 'bn' ? 'টি' : 'pcs')}
                      </td>
                      <td className="p-3 whitespace-nowrap">
                        <Badge
                          variant={isOut ? 'destructive' : isLow ? 'destructive' : 'default'}
                          className="text-[10px] capitalize font-normal whitespace-nowrap inline-flex items-center"
                        >
                          {isOut ? (lang === 'bn' ? 'স্টক শেষ' : 'Out of Stock') : isLow ? (lang === 'bn' ? 'স্বল্প স্টক' : 'Low Stock') : (lang === 'bn' ? 'স্টকে আছে' : 'In Stock')}
                        </Badge>
                      </td>
                      <td className="p-3 text-right whitespace-nowrap">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => navigate('/products')}
                          className="h-7 text-[11px] px-2 text-[#00a86b] dark:text-[#00df89] whitespace-nowrap"
                        >
                          {lang === 'bn' ? 'সম্পাদনা' : 'Edit'}
                        </Button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="p-10 text-center rounded-2xl bg-slate-50 dark:bg-[#09090b]/60 border border-slate-100 dark:border-zinc-800/60 space-y-3">
            <Package className="w-9 h-9 text-slate-300 dark:text-zinc-600 mx-auto" />
            <h3 className="text-sm font-semibold text-slate-800 dark:text-zinc-200">
              {lang === 'bn' ? 'কোন পণ্য যোগ করা হয়নি' : 'No Products Added Yet'}
            </h3>
            <p className="text-xs text-slate-500 dark:text-zinc-400 max-w-sm mx-auto">
              {lang === 'bn'
                ? 'আপনার দোকানের পণ্যসমূহ যোগ করুন, দাম ও স্টক নির্ধারণ করুন।'
                : 'Start populating your inventory to track stock levels, barcodes, and profit margins.'}
            </p>
            <Button
              size="sm"
              onClick={() => navigate('/products/add')}
              className="bg-[#00df89] hover:bg-[#00c97b] text-[#011812] text-xs font-semibold"
            >
              <Plus className="w-3.5 h-3.5 mr-1" />
              {lang === 'bn' ? 'প্রথম পণ্য যোগ করুন' : 'Add First Product'}
            </Button>
          </div>
        )}
      </Card>

      {/* ---------------------------------------------------- */}
      {/* BOTTOM ROW: Recent Transactions + Low Stock Alerts   */}
      {/* ---------------------------------------------------- */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Recent Transactions List (2 Columns) */}
        <Card className="lg:col-span-2 p-6 space-y-4 border border-slate-200/90 dark:border-zinc-800/80 dark:bg-[#121215]">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-base sm:text-lg font-bold">
                {lang === 'bn' ? 'সাম্প্রতিক বিক্রয় ও লেনদেন' : (d.recentTransactions || 'Recent Sales')}
              </CardTitle>
              <CardDescription className="text-xs sm:text-sm font-normal">
                {lang === 'bn' ? 'ডাটাবেজে সংরক্ষিত সর্বশেষ বিক্রয়ের রেকর্ড' : (d.recentTransSub || 'Latest live sales recorded in database')}
              </CardDescription>
            </div>
            <Button variant="outline" size="sm" onClick={() => navigate('/sales')} className="text-xs font-medium dark:bg-[#09090b]">
              {d.viewAll || 'View All'}
            </Button>
          </div>

          <div className="space-y-3">
            {isLoadingMetrics ? (
              <div className="space-y-2.5">
                {[1, 2, 3, 4].map((i) => (
                  <Skeleton key={i} className="h-16 w-full" />
                ))}
              </div>
            ) : recentSales.length > 0 ? (
              recentSales.map((s, idx) => (
                <div
                  key={idx}
                  onClick={() => navigate('/sales')}
                  className="flex items-center justify-between p-3.5 rounded-xl bg-slate-50 dark:bg-[#09090b]/80 border border-slate-100 dark:border-zinc-800/80 cursor-pointer hover:bg-slate-100 dark:hover:bg-zinc-800/40 transition-colors"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-9 h-9 rounded-xl bg-emerald-500/10 text-[#00a86b] dark:text-[#00df89] flex items-center justify-center font-medium shrink-0">
                      <ShoppingCart className="w-4 h-4" />
                    </div>
                    <div className="min-w-0">
                      <div className="font-semibold text-xs sm:text-sm text-slate-900 dark:text-white flex items-center gap-2 truncate">
                        <span>{toBn(s.invoice_number)}</span>
                        <Badge variant="default" className="uppercase text-[10px] font-normal">
                          {s.payment_method === 'cash' || !s.payment_method ? (lang === 'bn' ? 'নগদ' : 'Cash') : s.payment_method}
                        </Badge>
                      </div>
                      <div className="text-xs text-slate-500 dark:text-zinc-400 font-normal truncate">
                        {s.customer_id?.name || (lang === 'bn' ? 'সাধারণ কাস্টমার' : 'Walk-in Customer')} • {formatNumber(s.items?.length || 1)} {lang === 'bn' ? 'টি পণ্য' : 'Items'}
                      </div>
                    </div>
                  </div>

                  <div className="text-right shrink-0">
                    <div className="font-bold text-xs sm:text-sm text-slate-900 dark:text-white">{formatPrice(s.total || 0)}</div>
                    <div className="text-[10px] text-slate-400 dark:text-zinc-500 font-normal">
                      {toBn(new Date(s.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }))}
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div className="p-8 text-center rounded-xl bg-slate-50 dark:bg-[#09090b]/60 border border-slate-100 dark:border-zinc-800/60 space-y-3">
                <ShoppingCart className="w-8 h-8 text-slate-300 dark:text-zinc-600 mx-auto" />
                <div className="text-xs text-slate-500 dark:text-zinc-400">
                  {lang === 'bn' ? 'কোন সাম্প্রতিক বিক্রয় নেই। প্রথম বিক্রয় সম্পন্ন করুন।' : 'No sales recorded yet. Create your first sale to start tracking!'}
                </div>
                <Button size="sm" onClick={() => navigate('/sales/new')} className="bg-[#00df89] hover:bg-[#00c97b] text-[#011812] text-xs font-semibold">
                  <Plus className="w-3.5 h-3.5 mr-1" />
                  {lang === 'bn' ? 'নতুন বিক্রি তৈরি করুন' : 'Create First Sale'}
                </Button>
              </div>
            )}
          </div>
        </Card>

        {/* Low Stock Alerts (1 Column) */}
        <Card className="p-6 space-y-4 border border-slate-200/90 dark:border-zinc-800/80 dark:bg-[#121215]">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-base sm:text-lg font-bold">
                {d.lowStockAlerts || (lang === 'bn' ? 'স্বল্প স্টকের অ্যালার্ট' : 'Low Stock Alerts')}
              </CardTitle>
              <CardDescription className="text-xs sm:text-sm font-normal">
                {d.lowStockSub || (lang === 'bn' ? 'যে পণ্যগুলো স্টক করা প্রয়োজন' : 'Items need restocking')}
              </CardDescription>
            </div>
            <Badge variant={lowStock > 0 ? 'destructive' : 'default'} className="text-[10px] font-normal">
              {formatNumber(lowStock)} {lang === 'bn' ? 'টি পণ্য' : 'Items'}
            </Badge>
          </div>

          <div className="space-y-3">
            {isLoadingMetrics ? (
              <div className="space-y-2.5">
                {[1, 2, 3, 4].map((i) => (
                  <Skeleton key={i} className="h-14 w-full" />
                ))}
              </div>
            ) : lowStockList.length > 0 ? (
              lowStockList.map((item, idx) => (
                <div
                  key={idx}
                  className="flex items-center justify-between p-3.5 rounded-xl bg-slate-50 dark:bg-[#09090b]/80 border border-slate-100 dark:border-zinc-800/80"
                >
                  <div className="space-y-0.5 min-w-0 pr-2">
                    <div className="font-semibold text-xs sm:text-sm text-slate-900 dark:text-white flex items-center gap-1.5 truncate">
                      <AlertTriangle className="w-3.5 h-3.5 text-amber-500 shrink-0" />
                      <span className="truncate">{item.name}</span>
                    </div>
                    <div className="text-xs text-slate-500 dark:text-zinc-400 font-normal">
                      {formatNumber(item.stock_quantity)} {item.unit ? (lang === 'bn' && item.unit === 'pcs' ? 'টি' : item.unit) : (lang === 'bn' ? 'টি' : 'pcs')} ({lang === 'bn' ? 'সর্বনিম্ন' : 'min'}: {formatNumber(item.low_stock_threshold || 5)})
                    </div>
                  </div>

                  <Button variant="outline" size="sm" onClick={() => navigate('/products')} className="h-8 text-xs font-medium dark:bg-[#09090b] shrink-0">
                    {d.restock || 'Restock'}
                  </Button>
                </div>
              ))
            ) : (
              <div className="p-6 text-center rounded-xl bg-slate-50 dark:bg-[#09090b]/60 border border-slate-100 dark:border-zinc-800/60 space-y-2">
                <CheckCircle2 className="w-7 h-7 text-emerald-500 mx-auto" />
                <div className="text-xs font-semibold text-slate-800 dark:text-zinc-200">
                  {lang === 'bn' ? 'সব পণ্য পর্যাপ্ত স্টকে আছে' : 'Inventory Healthy'}
                </div>
                <div className="text-[11px] text-slate-400 dark:text-zinc-500">
                  {lang === 'bn' ? 'কোন স্বল্প স্টকের পণ্য পাওয়া যায়নি' : 'No items currently below threshold'}
                </div>
              </div>
            )}
          </div>
        </Card>

      </div>

      {/* ---------------------------------------------------- */}
      {/* INDUSTRY TAILORED WIDGETS IF ACTIVE                  */}
      {/* ---------------------------------------------------- */}
      {activeShop && activeShop.widgets && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 pt-4 border-t border-slate-200/80 dark:border-zinc-800/80">
          {isGrocery && activeShop.widgets.includes('expiring_products') && <ExpiringProductsWidget />}
          {isGym && activeShop.widgets.includes('gym_members_queue') && <GymAttendanceWidget />}
          {currentBusinessType === 'restaurant' && activeShop.widgets.includes('kitchen_live_queue') && <KitchenQueueWidget />}
          {currentBusinessType === 'jewelry' && activeShop.widgets.includes('gold_rate_ticker') && <GoldRateWidget />}
        </div>
      )}

    </div>
  );
}
