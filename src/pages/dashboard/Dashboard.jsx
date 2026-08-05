/**
 * @file Dashboard.jsx
 * @description Dashboard layout using pitch dark canvas #09090b & sleek charcoal #121215 dark mode palette with New Sale link.
 */
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useShop } from '@/context/ShopContext';
import { useLanguage } from '@/context/LanguageContext';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  ExpiringProductsWidget,
  GymAttendanceWidget,
  KitchenQueueWidget,
  GoldRateWidget,
  ClothingVariantsWidget
} from '@/components/dashboard/IndustryWidgets';
import {
  TrendingUp, TrendingDown, DollarSign, ShoppingCart, Users, Globe,
  Calendar, Plus, FileText, PackagePlus, AlertTriangle, ArrowRight
} from 'lucide-react';

export default function Dashboard() {
  const navigate = useNavigate();
  const { activeShop } = useShop();
  const { lang, t } = useLanguage();
  const [selectedPeriod, setSelectedPeriod] = useState('This Month');

  const d = t?.dashboard || {};

  // Daily sales bar heights
  const salesBars = [
    35, 42, 38, 50, 48, 55, 60, 52, 58, 62,
    70, 68, 75, 72, 80, 85, 78, 90, 88, 95,
    100, 92, 105, 110, 115, 108, 125, 130, 128, 140
  ];

  const statCardsData = [
    { title: d.totalRevenue || 'Total Revenue', icon: DollarSign, value: '৳ ১,২৪৫,৮৯০', valueEn: '৳ 1,245,890', change: `+12.8% ${d.vsLastMonth || 'vs last month'}`, isPositive: true },
    { title: d.totalSales || 'Total Sales', icon: ShoppingCart, value: '১,৩৪২', valueEn: '1,342', change: `+6.2% ${d.vsLastMonth || 'vs last month'}`, isPositive: true },
    { title: d.activeCustomers || 'Active Customers', icon: Users, value: '২,৪৫৬', valueEn: '2,456', change: `+15.3% ${d.vsLastMonth || 'vs last month'}`, isPositive: true },
    { title: d.totalOrders || 'Total Orders', icon: Globe, value: '৩,৮৯১', valueEn: '3,891', change: `-2.1% ${d.vsLastMonth || 'vs last month'}`, isPositive: false }
  ];

  const recentTransactions = [
    { id: '#INV-2024-001', status: d.paid || 'paid', customer: lang === 'bn' ? 'তানভীর রহমান' : 'Tanvir Rahman', items: lang === 'bn' ? '৩টি পণ্য' : '3 Items', amount: '৳ ৪৫,৫০০', time: lang === 'bn' ? '১০ মি আগে' : '10m ago' },
    { id: '#INV-2024-002', status: d.paid || 'paid', customer: lang === 'bn' ? 'করিম ট্রেডার্স' : 'Karim Traders', items: lang === 'bn' ? '১২টি পণ্য' : '12 Items', amount: '৳ ১২৮,৪০০', time: lang === 'bn' ? '৪৫ মি আগে' : '45m ago' },
    { id: '#INV-2024-003', status: d.pending || 'pending', customer: lang === 'bn' ? 'সাবরিনা ফ্যাশন' : 'Sabrina Fashion', items: lang === 'bn' ? '১টি পণ্য' : '1 Item', amount: '৳ ১৪,২০০', time: lang === 'bn' ? '২ ঘণ্টা আগে' : '2h ago' }
  ];

  const lowStockAlerts = [
    { name: lang === 'bn' ? 'মিনিকেট চাল ২৫কেজি' : 'Miniket Rice 25kg', stock: lang === 'bn' ? '৫ / ১০ সর্বনিম্ন' : '5 / 10 min', category: 'Grains', status: 'Low' },
    { name: lang === 'bn' ? 'সানফ্লাওয়ার তেল ৫লিটার' : 'Sunflower Oil 5L', stock: lang === 'bn' ? '২ / ৮ সর্বনিম্ন' : '2 / 8 min', category: 'Oil', status: 'Critical' },
    { name: lang === 'bn' ? 'নাপা এক্সট্রা ৫০০মিগ্রা' : 'Napa Extra 500mg', stock: lang === 'bn' ? '১৮ / ৫০ সর্বনিম্ন' : '18 / 50 min', category: 'Medicine', status: 'Low' }
  ];

  return (
    <div className="space-y-6 font-sans">
      
      {/* ---------------------------------------------------- */}
      {/* TOP STAT CARDS ROW (4 Columns)                       */}
      {/* ---------------------------------------------------- */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {statCardsData.map((stat, idx) => {
          const Icon = stat.icon;
          return (
            <Card key={idx} className="p-5 hover:shadow-xs transition-shadow border border-slate-200/90 dark:border-zinc-800/80 dark:bg-[#121215]">
              <div className="flex items-center justify-between">
                <span className="text-xs sm:text-sm font-medium text-slate-600 dark:text-zinc-400">
                  {stat.title}
                </span>
                <div className="w-8 h-8 rounded-lg bg-slate-100 dark:bg-zinc-800/80 text-slate-500 dark:text-zinc-400 flex items-center justify-center">
                  <Icon className="w-4 h-4" />
                </div>
              </div>

              <div className="mt-3 space-y-1">
                <div className="text-2xl sm:text-3xl font-medium text-slate-900 dark:text-white tracking-tight">
                  {lang === 'bn' ? stat.value : stat.valueEn}
                </div>
                <div className="flex items-center gap-1 text-xs font-medium">
                  <span className={stat.isPositive ? 'text-[#00a86b] dark:text-[#00df89]' : 'text-rose-500'}>
                    {stat.isPositive ? '↑' : '↓'} {stat.change}
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
                <CardTitle className="text-base sm:text-lg font-medium">
                  {d.salesPerformance || 'Sales Performance'}
                </CardTitle>
                <CardDescription className="text-xs sm:text-sm font-normal">
                  {d.salesOverviewSub || 'Daily sales overview for this month'}
                </CardDescription>
              </div>

              <Button variant="outline" size="sm" className="gap-1.5 text-xs font-medium dark:bg-[#09090b]">
                <Calendar className="w-3.5 h-3.5 text-slate-400 dark:text-zinc-400" />
                <span>{lang === 'bn' ? 'এই মাস' : selectedPeriod}</span>
              </Button>
            </div>

            {/* Vertical Bar Chart */}
            <div className="h-44 sm:h-52 flex items-end justify-between gap-1 sm:gap-1.5 pt-6 pb-2 border-b border-slate-100 dark:border-zinc-800/80">
              {salesBars.map((val, bIdx) => (
                <div key={bIdx} className="flex-1 flex flex-col items-center gap-1 group h-full justify-end">
                  <div
                    style={{ height: `${(val / 140) * 100}%` }}
                    className="w-full rounded-t-sm bg-[#00df89] hover:bg-[#00c97b] transition-all duration-150 relative"
                  >
                    {/* Tooltip on hover */}
                    <div className="opacity-0 group-hover:opacity-100 absolute -top-8 left-1/2 -translate-x-1/2 bg-slate-900 dark:bg-zinc-800 text-white text-[10px] font-normal px-1.5 py-0.5 rounded shadow-md pointer-events-none transition-opacity">
                      {lang === 'bn' ? `দিন ${bIdx + 1}: ৳${val * 100}` : `Day ${bIdx + 1}: ৳${val * 100}`}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="flex items-center justify-between pt-4 text-xs font-medium">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-[#00df89]" />
              <span className="text-slate-600 dark:text-zinc-400 font-medium">
                {d.dailySales || 'Daily Sales'}
              </span>
            </div>
            <span className="text-[#00a86b] dark:text-[#00df89] font-medium">
              +18% {d.fromLastMonth || 'from last month'}
            </span>
          </div>
        </Card>

        {/* Quick Actions Panel (1 Column) */}
        <Card className="p-6 flex flex-col justify-between space-y-4 border border-slate-200/90 dark:border-zinc-800/80 dark:bg-[#121215]">
          <div>
            <CardTitle className="text-base sm:text-lg font-medium">
              {d.quickActions || 'Quick Actions'}
            </CardTitle>
            <CardDescription className="text-xs sm:text-sm font-normal mb-4">
              {d.quickActionsSub || 'Common tasks and shortcuts'}
            </CardDescription>

            <div className="space-y-2.5">
              {/* Primary Green Action */}
              <Button
                variant="default"
                onClick={() => navigate('/sales/new')}
                className="w-full justify-start h-11 text-xs sm:text-sm bg-[#00df89] hover:bg-[#00c97b] text-[#011812] font-medium"
              >
                <Plus className="w-4 h-4 stroke-[2]" />
                <span>{d.newSale || 'New Sale'}</span>
              </Button>

              {/* Secondary Outline Actions */}
              <Button variant="outline" onClick={() => navigate('/products')} className="w-full justify-start h-11 text-xs sm:text-sm font-medium dark:bg-[#09090b]">
                <PackagePlus className="w-4 h-4 text-slate-400 dark:text-zinc-400" />
                <span>{d.addProduct || 'Add Product'}</span>
              </Button>

              <Button variant="outline" onClick={() => navigate('/sales')} className="w-full justify-start h-11 text-xs sm:text-sm font-medium dark:bg-[#09090b]">
                <FileText className="w-4 h-4 text-slate-400 dark:text-zinc-400" />
                <span>{d.newInvoice || 'Sales History'}</span>
              </Button>
            </div>
          </div>

          <div className="pt-2 border-t border-slate-100 dark:border-zinc-800/80 text-center">
            <Button variant="link" onClick={() => navigate('/sales/new')} className="text-xs font-medium text-slate-600 dark:text-zinc-400 hover:text-[#00a86b] dark:hover:text-[#00df89]">
              {d.viewAllActions || 'View All Actions'} →
            </Button>
          </div>
        </Card>

      </div>

      {/* ---------------------------------------------------- */}
      {/* BOTTOM ROW: Recent Transactions + Low Stock Alerts   */}
      {/* ---------------------------------------------------- */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Recent Transactions List (2 Columns) */}
        <Card className="lg:col-span-2 p-6 space-y-4 border border-slate-200/90 dark:border-zinc-800/80 dark:bg-[#121215]">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-base sm:text-lg font-medium">
                {d.recentTransactions || 'Recent Transactions'}
              </CardTitle>
              <CardDescription className="text-xs sm:text-sm font-normal">
                {d.recentTransSub || 'Latest sales and purchases'}
              </CardDescription>
            </div>
            <Button variant="outline" size="sm" onClick={() => navigate('/sales')} className="text-xs font-medium dark:bg-[#09090b]">
              {d.viewAll || 'View All'}
            </Button>
          </div>

          <div className="space-y-3">
            {recentTransactions.map((tx, idx) => (
              <div
                key={idx}
                className="flex items-center justify-between p-3.5 rounded-xl bg-slate-50 dark:bg-[#09090b]/80 border border-slate-100 dark:border-zinc-800/80"
              >
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-emerald-500/10 text-[#00a86b] dark:text-[#00df89] flex items-center justify-center font-medium">
                    <ShoppingCart className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="font-medium text-xs sm:text-sm text-slate-900 dark:text-white flex items-center gap-2">
                      <span>{tx.id}</span>
                      <Badge variant={tx.status === d.paid || tx.status === 'paid' ? 'default' : 'warning'} className="uppercase text-[10px] font-normal">
                        {tx.status}
                      </Badge>
                    </div>
                    <div className="text-xs text-slate-500 dark:text-zinc-400 font-normal">{tx.customer} • {tx.items}</div>
                  </div>
                </div>

                <div className="text-right">
                  <div className="font-medium text-xs sm:text-sm text-slate-900 dark:text-white">{tx.amount}</div>
                  <div className="text-[10px] text-slate-400 dark:text-zinc-500 font-normal">{tx.time}</div>
                </div>
              </div>
            ))}
          </div>
        </Card>

        {/* Low Stock Alerts (1 Column) */}
        <Card className="p-6 space-y-4 border border-slate-200/90 dark:border-zinc-800/80 dark:bg-[#121215]">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-base sm:text-lg font-medium">
                {d.lowStockAlerts || 'Low Stock Alerts'}
              </CardTitle>
              <CardDescription className="text-xs sm:text-sm font-normal">
                {d.lowStockSub || 'Items need restocking'}
              </CardDescription>
            </div>
            <Badge variant="destructive" className="text-[10px] font-normal">
              {lang === 'bn' ? '৪টি পণ্য' : '4 Items'}
            </Badge>
          </div>

          <div className="space-y-3">
            {lowStockAlerts.map((item, idx) => (
              <div
                key={idx}
                className="flex items-center justify-between p-3.5 rounded-xl bg-slate-50 dark:bg-[#09090b]/80 border border-slate-100 dark:border-zinc-800/80"
              >
                <div className="space-y-0.5">
                  <div className="font-medium text-xs sm:text-sm text-slate-900 dark:text-white flex items-center gap-1.5">
                    <AlertTriangle className="w-3.5 h-3.5 text-amber-500 shrink-0" />
                    <span>{item.name}</span>
                  </div>
                  <div className="text-xs text-slate-500 dark:text-zinc-400 font-normal">{item.stock}</div>
                </div>

                <Button variant="outline" size="sm" onClick={() => navigate('/products')} className="h-8 text-xs font-medium dark:bg-[#09090b]">
                  {d.restock || 'Restock'}
                </Button>
              </div>
            ))}
          </div>
        </Card>

      </div>

      {/* ---------------------------------------------------- */}
      {/* INDUSTRY TAILORED WIDGETS IF ACTIVE                  */}
      {/* ---------------------------------------------------- */}
      {activeShop && activeShop.widgets && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 pt-4 border-t border-slate-200/80 dark:border-zinc-800/80">
          {activeShop.widgets.includes('expiring_products') && <ExpiringProductsWidget />}
          {activeShop.widgets.includes('gym_members_queue') && <GymAttendanceWidget />}
          {activeShop.widgets.includes('kitchen_live_queue') && <KitchenQueueWidget />}
          {activeShop.widgets.includes('gold_rate_ticker') && <GoldRateWidget />}
          {activeShop.widgets.includes('clothing_variants') && <ClothingVariantsWidget />}
        </div>
      )}

    </div>
  );
}
