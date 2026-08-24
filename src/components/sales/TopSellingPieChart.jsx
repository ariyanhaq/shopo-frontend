/**
 * @file TopSellingPieChart.jsx
 * @description Beautiful Shadcn Recharts Donut Chart for Top Selling Products with Metric Switcher & Product Performance Leaderboard.
 */
import React, { useState, useMemo } from 'react';
import { useLanguage } from '@/context/LanguageContext';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  ResponsiveContainer
} from 'recharts';
import {
  PieChart as PieChartIcon,
  Package,
  DollarSign,
  Sparkles,
  Award,
  ShoppingBag,
  TrendingUp
} from 'lucide-react';

const CHART_PALETTE = [
  '#00df89', // Emerald (Theme Primary)
  '#3b82f6', // Bright Blue
  '#a855f7', // Purple
  '#f59e0b', // Warm Amber
  '#f43f5e', // Rose Coral
  '#06b6d4', // Teal Cyan
  '#94a3b8', // Slate / Others
];

// Custom Tooltip for Recharts
function CustomTooltip({ active, payload, metric, lang }) {
  if (!active || !payload || !payload.length) return null;
  const data = payload[0].payload;

  return (
    <div className="rounded-xl border border-slate-200/90 dark:border-zinc-800 bg-white/95 dark:bg-[#18181b]/95 backdrop-blur-md p-3 shadow-xl text-xs space-y-1.5 z-50">
      <div className="flex items-center gap-2">
        <span
          className="w-2.5 h-2.5 rounded-full shrink-0"
          style={{ backgroundColor: data.color }}
        />
        <span className="font-bold text-slate-900 dark:text-white truncate max-w-[180px]">
          {data.name}
        </span>
      </div>
      <div className="flex items-center justify-between gap-4 pt-1 border-t border-slate-100 dark:border-zinc-800 text-[11px]">
        <span className="text-slate-500 dark:text-zinc-400">
          {metric === 'quantity'
            ? lang === 'bn' ? 'বিক্রির সংখ্যা:' : 'Units Sold:'
            : lang === 'bn' ? 'মোট বিক্রয় আয়:' : 'Total Sales:'}
        </span>
        <span className="font-bold font-mono text-slate-900 dark:text-white">
          {metric === 'quantity'
            ? `${data.quantity.toLocaleString()} pcs`
            : `৳ ${data.revenue.toLocaleString()}`}
        </span>
      </div>
      <div className="flex items-center justify-between gap-4 text-[11px]">
        <span className="text-slate-500 dark:text-zinc-400">
          {lang === 'bn' ? 'বিক্রয়ের হিস্যা:' : 'Market Share:'}
        </span>
        <span
          className="font-bold px-1.5 py-0.2 rounded-md"
          style={{
            backgroundColor: `${data.color}20`,
            color: data.color,
          }}
        >
          {data.percentage.toFixed(1)}%
        </span>
      </div>
    </div>
  );
}

export default function TopSellingPieChart({ salesOrders = [], isLoading = false }) {
  const { lang } = useLanguage();
  const [metric, setMetric] = useState('quantity'); // 'quantity' | 'revenue'
  const [activeIndex, setActiveIndex] = useState(null);

  // Aggregate items across all sales orders
  const chartData = useMemo(() => {
    if (!Array.isArray(salesOrders) || salesOrders.length === 0) {
      return { items: [], totalQuantity: 0, totalRevenue: 0, topProduct: null };
    }

    const itemMap = new Map();
    let totalQty = 0;
    let totalRev = 0;

    salesOrders.forEach((sale) => {
      if (sale.status === 'cancelled') return;

      const items = Array.isArray(sale.items) ? sale.items : [];
      items.forEach((it) => {
        const name = it.name || 'Unnamed Product';
        const qty = Number(it.quantity) || 0;
        const unitPrice = Number(it.unit_price) || 0;
        const itemTotal = Number(it.total) || qty * unitPrice;

        if (qty <= 0) return;

        totalQty += qty;
        totalRev += itemTotal;

        if (!itemMap.has(name)) {
          itemMap.set(name, {
            name,
            quantity: 0,
            revenue: 0,
          });
        }

        const entry = itemMap.get(name);
        entry.quantity += qty;
        entry.revenue += itemTotal;
      });
    });

    const rawList = Array.from(itemMap.values());
    rawList.sort((a, b) => (metric === 'quantity' ? b.quantity - a.quantity : b.revenue - a.revenue));

    const topProduct = rawList[0] || null;
    const topItems = rawList.slice(0, 5);
    const others = rawList.slice(5);

    if (others.length > 0) {
      const othersQty = others.reduce((sum, it) => sum + it.quantity, 0);
      const othersRev = others.reduce((sum, it) => sum + it.revenue, 0);
      topItems.push({
        name: lang === 'bn' ? 'অন্যান্য পণ্য' : 'Other Products',
        quantity: othersQty,
        revenue: othersRev,
        isOther: true,
      });
    }

    const activeTotal = metric === 'quantity' ? totalQty : totalRev;

    const formattedItems = topItems.map((item, index) => {
      const val = metric === 'quantity' ? item.quantity : item.revenue;
      const percentage = activeTotal > 0 ? (val / activeTotal) * 100 : 0;

      return {
        ...item,
        value: val,
        percentage,
        color: CHART_PALETTE[index % CHART_PALETTE.length],
      };
    });

    return {
      items: formattedItems,
      totalQuantity: totalQty,
      totalRevenue: totalRev,
      topProduct,
    };
  }, [salesOrders, metric, lang]);

  const activeItem = activeIndex !== null ? chartData.items[activeIndex] : null;

  return (
    <Card className="border border-slate-200/90 dark:border-zinc-800/80 dark:bg-[#121215] shadow-xs overflow-hidden">
      {/* Header */}
      <div className="p-5 pb-4 border-b border-slate-100 dark:border-zinc-800/80 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-[#00df89]/10 text-[#00a86b] dark:text-[#00df89] flex items-center justify-center font-bold shrink-0 border border-[#00df89]/20 shadow-xs">
            <PieChartIcon className="w-5 h-5" />
          </div>
          <div>
            <CardTitle className="text-base sm:text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <span>{lang === 'bn' ? 'সর্বাধিক বিক্রিত পণ্যের অ্যানালিটিক্স' : 'Top Selling Products Analytics'}</span>
            </CardTitle>
            <CardDescription className="text-xs text-slate-500 dark:text-zinc-400 mt-0.5">
              {lang === 'bn'
                ? 'আইটেম অনুযায়ী বিক্রির পরিমাণ ও আয়ের হিস্যা'
                : 'Real-time sales distribution, volume, and performance'}
            </CardDescription>
          </div>
        </div>

        {/* Metric Selector Buttons */}
        <div className="flex items-center bg-slate-100 dark:bg-zinc-900 p-1 rounded-xl border border-slate-200/80 dark:border-zinc-800 self-start sm:self-auto shrink-0">
          <button
            type="button"
            onClick={() => setMetric('quantity')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs transition-all cursor-pointer ${
              metric === 'quantity'
                ? 'bg-[#00df89] text-[#011812] font-bold shadow-xs'
                : 'text-slate-600 dark:text-zinc-400 hover:text-slate-900 dark:hover:text-white font-medium'
            }`}
          >
            <Package className="w-3.5 h-3.5" />
            <span>{lang === 'bn' ? 'পরিমাণ (Quantity)' : 'By Quantity'}</span>
          </button>
          <button
            type="button"
            onClick={() => setMetric('revenue')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs transition-all cursor-pointer ${
              metric === 'revenue'
                ? 'bg-[#00df89] text-[#011812] font-bold shadow-xs'
                : 'text-slate-600 dark:text-zinc-400 hover:text-slate-900 dark:hover:text-white font-medium'
            }`}
          >
            <DollarSign className="w-3.5 h-3.5" />
            <span>{lang === 'bn' ? 'আয় (Revenue ৳)' : 'By Revenue'}</span>
          </button>
        </div>
      </div>

      <CardContent className="p-5 sm:p-6">
        {isLoading ? (
          <div className="h-64 flex items-center justify-center">
            <div className="flex flex-col items-center gap-2 text-slate-400">
              <div className="w-8 h-8 rounded-full border-2 border-[#00df89] border-t-transparent animate-spin" />
              <span className="text-xs">{lang === 'bn' ? 'লোড হচ্ছে...' : 'Loading chart data...'}</span>
            </div>
          </div>
        ) : chartData.items.length === 0 ? (
          <div className="h-56 flex flex-col items-center justify-center text-center p-6 bg-slate-50/50 dark:bg-zinc-900/30 rounded-2xl border border-dashed border-slate-200 dark:border-zinc-800">
            <ShoppingBag className="w-10 h-10 text-slate-300 dark:text-zinc-600 mb-2" />
            <p className="text-sm font-semibold text-slate-800 dark:text-zinc-200">
              {lang === 'bn' ? 'কোন বিক্রয় পণ্য ডাটা পাওয়া যায়নি' : 'No Sales Item Data Yet'}
            </p>
            <p className="text-xs text-slate-400 max-w-sm mt-1">
              {lang === 'bn'
                ? 'ইনভয়েস তৈরি করলে সর্বাধিক বিক্রিত পণ্যের পাই চার্ট এখানে প্রদর্শিত হবে।'
                : 'Create sales orders to automatically populate top-selling products and revenue graphs.'}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
            
            {/* Recharts Donut Chart Container (5 cols) */}
            <div className="lg:col-span-5 flex flex-col items-center justify-center relative">
              <div className="relative w-64 h-64 sm:w-72 sm:h-72">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Tooltip content={<CustomTooltip metric={metric} lang={lang} />} />
                    <Pie
                      data={chartData.items}
                      cx="50%"
                      cy="50%"
                      innerRadius={72}
                      outerRadius={105}
                      paddingAngle={4}
                      cornerRadius={6}
                      dataKey="value"
                      onMouseEnter={(_, index) => setActiveIndex(index)}
                      onMouseLeave={() => setActiveIndex(null)}
                    >
                      {chartData.items.map((entry, index) => (
                        <Cell
                          key={`cell-${index}`}
                          fill={entry.color}
                          stroke="transparent"
                          className="transition-all duration-200 cursor-pointer outline-none"
                          style={{
                            filter: activeIndex === index ? `drop-shadow(0 4px 12px ${entry.color}80)` : 'none',
                            opacity: activeIndex === null || activeIndex === index ? 1 : 0.45,
                          }}
                        />
                      ))}
                    </Pie>
                  </PieChart>
                </ResponsiveContainer>

                {/* Center Summary Label */}
                <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none text-center px-4">
                  {activeItem ? (
                    <>
                      <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-400 dark:text-zinc-500 truncate max-w-[130px]">
                        {activeItem.name}
                      </span>
                      <span className="text-lg sm:text-xl font-extrabold text-slate-900 dark:text-white leading-tight mt-0.5">
                        {metric === 'quantity'
                          ? `${activeItem.quantity.toLocaleString()} pcs`
                          : `৳ ${activeItem.revenue.toLocaleString()}`}
                      </span>
                      <span
                        className="text-xs font-bold mt-1 px-2 py-0.5 rounded-full border"
                        style={{
                          backgroundColor: `${activeItem.color}15`,
                          borderColor: `${activeItem.color}35`,
                          color: activeItem.color,
                        }}
                      >
                        {activeItem.percentage.toFixed(1)}% {lang === 'bn' ? 'অংশ' : 'share'}
                      </span>
                    </>
                  ) : (
                    <>
                      <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-400 dark:text-zinc-500">
                        {metric === 'quantity'
                          ? lang === 'bn' ? 'মোট বিক্রিত ইউনিট' : 'Total Units Sold'
                          : lang === 'bn' ? 'মোট বিক্রয় আয়' : 'Total Sales Revenue'}
                      </span>
                      <span className="text-lg sm:text-xl font-extrabold text-slate-900 dark:text-white leading-tight mt-0.5">
                        {metric === 'quantity'
                          ? `${chartData.totalQuantity.toLocaleString()} pcs`
                          : `৳ ${chartData.totalRevenue.toLocaleString()}`}
                      </span>
                      <div className="flex items-center gap-1 text-[11px] text-[#00a86b] dark:text-[#00df89] font-semibold mt-1">
                        <Award className="w-3.5 h-3.5" />
                        <span>{chartData.items.length} {lang === 'bn' ? 'টি পণ্য' : 'Top Items'}</span>
                      </div>
                    </>
                  )}
                </div>
              </div>

              <div className="text-[11px] text-slate-400 dark:text-zinc-500 mt-2 flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-[#00df89]" />
                <span>{lang === 'bn' ? 'চার্টের স্লাইসে হোভার করুন' : 'Hover on slices to inspect item details'}</span>
              </div>
            </div>

            {/* Product Leaderboard List (7 cols) */}
            <div className="lg:col-span-7 space-y-2.5">
              <div className="text-xs font-bold uppercase tracking-wider text-slate-400 dark:text-zinc-500 flex items-center justify-between pb-1">
                <span>{lang === 'bn' ? 'পণ্য ও পারফরম্যান্স' : 'Product Performance'}</span>
                <span>{metric === 'quantity' ? (lang === 'bn' ? 'বিক্রি' : 'Units Sold') : (lang === 'bn' ? 'আয়' : 'Revenue')}</span>
              </div>

              {chartData.items.map((item, index) => {
                const isHovered = activeIndex === index;
                return (
                  <div
                    key={index}
                    onMouseEnter={() => setActiveIndex(index)}
                    onMouseLeave={() => setActiveIndex(null)}
                    className={`p-3 rounded-xl border transition-all duration-150 cursor-pointer ${
                      isHovered
                        ? 'bg-slate-100 dark:bg-zinc-800/90 border-slate-300 dark:border-zinc-600 shadow-xs translate-x-1'
                        : 'bg-slate-50/70 dark:bg-zinc-900/50 border-slate-200/80 dark:border-zinc-800/70 hover:bg-slate-100/60 dark:hover:bg-zinc-900/80'
                    }`}
                  >
                    <div className="flex items-center justify-between gap-3 mb-2">
                      <div className="flex items-center gap-2.5 min-w-0">
                        <span
                          className="w-6 h-6 rounded-lg flex items-center justify-center text-xs font-bold shrink-0 border"
                          style={{
                            backgroundColor: `${item.color}20`,
                            borderColor: `${item.color}40`,
                            color: item.color,
                          }}
                        >
                          #{index + 1}
                        </span>
                        <div className="min-w-0">
                          <div className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white truncate">
                            {item.name}
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-2.5 shrink-0">
                        <div className="text-right">
                          <div className="text-xs sm:text-sm font-extrabold text-slate-900 dark:text-white font-mono">
                            {metric === 'quantity'
                              ? `${item.quantity.toLocaleString()} pcs`
                              : `৳ ${item.revenue.toLocaleString()}`}
                          </div>
                          {metric === 'quantity' && (
                            <div className="text-[10px] text-slate-400 font-mono">
                              ৳ {item.revenue.toLocaleString()}
                            </div>
                          )}
                        </div>

                        <span
                          className="text-xs font-bold px-2 py-0.5 rounded-lg border shrink-0"
                          style={{
                            backgroundColor: `${item.color}15`,
                            borderColor: `${item.color}35`,
                            color: item.color,
                          }}
                        >
                          {item.percentage.toFixed(1)}%
                        </span>
                      </div>
                    </div>

                    {/* Progress Bar */}
                    <div className="w-full bg-slate-200/80 dark:bg-zinc-800 h-1.5 rounded-full overflow-hidden">
                      <div
                        className="h-full rounded-full transition-all duration-300"
                        style={{
                          width: `${Math.max(item.percentage, 2)}%`,
                          backgroundColor: item.color,
                        }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>

          </div>
        )}
      </CardContent>
    </Card>
  );
}
