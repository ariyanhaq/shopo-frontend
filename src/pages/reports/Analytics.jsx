/**
 * @file Analytics.jsx
 * @description Advanced Business Analytics & Visual Trends connected directly to MongoDB.
 */
import { useState, useEffect } from 'react';
import { useLanguage } from '@/context/LanguageContext';
import api from '@/services/api';
import { Card, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  TrendingUp, BarChart3, PieChart, DollarSign, Package,
  Users, ArrowUpRight, ArrowDownRight, Loader2
} from 'lucide-react';

export default function Analytics() {
  const { lang } = useLanguage();

  const [dashboard, setDashboard] = useState(null);
  const [salesReport, setSalesReport] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        const [dashRes, repRes] = await Promise.all([
          api.analytics.getDashboard(),
          api.analytics.getSalesReport({ period: '30d' }),
        ]);
        if (dashRes.data) setDashboard(dashRes.data);
        if (repRes.data) setSalesReport(repRes.data);
      } catch (err) {
        console.warn('Failed to load analytics:', err.message);
      } finally {
        setIsLoading(false);
      }
    };
    load();
  }, []);

  const summary = dashboard?.summary || {
    totalRevenue: 0,
    totalSales: 0,
    totalProducts: 0,
    totalCustomers: 0,
    averageOrderValue: 0,
  };

  const salesBars = dashboard?.salesBars || [];

  return (
    <div className="space-y-6 font-sans">
      
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div className="min-w-0">
          <h1 className="text-xl sm:text-2xl font-medium text-slate-900 dark:text-white tracking-tight flex items-center gap-2.5">
            <TrendingUp className="w-6 h-6 text-[#00df89] shrink-0" />
            <span>{lang === 'bn' ? 'অ্যাডভান্সড বিজনেস অ্যানালিটিক্স' : 'Business Intelligence & Analytics'}</span>
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-zinc-400 mt-0.5">
            {lang === 'bn' ? 'স্টোরের আয়, বিক্রয় ট্রেন্ড ও পারফরম্যান্স বিশ্লেষণ' : 'Real-time aggregated sales trends, revenue velocities and inventory turnover'}
          </p>
        </div>
      </div>

      {/* KPI METRICS */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="p-4 border-slate-200/90 dark:border-zinc-800/80 dark:bg-[#121215]">
          <span className="text-xs text-slate-500 dark:text-zinc-400">Total Store Revenue</span>
          <div className="text-2xl font-medium text-[#00a86b] dark:text-[#00df89] mt-2">
            ৳ {summary.totalRevenue.toLocaleString()}
          </div>
        </Card>
        <Card className="p-4 border-slate-200/90 dark:border-zinc-800/80 dark:bg-[#121215]">
          <span className="text-xs text-slate-500 dark:text-zinc-400">Total Orders Settled</span>
          <div className="text-2xl font-medium text-slate-900 dark:text-white mt-2">
            {summary.totalSales}
          </div>
        </Card>
        <Card className="p-4 border-slate-200/90 dark:border-zinc-800/80 dark:bg-[#121215]">
          <span className="text-xs text-slate-500 dark:text-zinc-400">Customer Base</span>
          <div className="text-2xl font-medium text-slate-900 dark:text-white mt-2">
            {summary.totalCustomers}
          </div>
        </Card>
        <Card className="p-4 border-slate-200/90 dark:border-zinc-800/80 dark:bg-[#121215]">
          <span className="text-xs text-slate-500 dark:text-zinc-400">Average Order Size</span>
          <div className="text-2xl font-medium text-slate-900 dark:text-white mt-2">
            ৳ {summary.averageOrderValue.toLocaleString()}
          </div>
        </Card>
      </div>

      {/* 30-DAY SALES REVENUE BAR GRAPH */}
      <Card className="p-6 border-slate-200/90 dark:border-zinc-800/80 dark:bg-[#121215] space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-base font-medium">Daily Sales Revenue (Last 30 Days)</CardTitle>
            <CardDescription className="text-xs">MongoDB daily aggregated transaction trend</CardDescription>
          </div>
        </div>

        {isLoading ? (
          <div className="p-12 text-center text-slate-400">
            <Loader2 className="w-8 h-8 animate-spin mx-auto mb-2 text-[#00df89]" />
            Aggregating trends...
          </div>
        ) : (
          <div className="h-48 flex items-end gap-1 sm:gap-2 pt-6 border-b border-slate-100 dark:border-zinc-800/80">
            {salesBars.map((bar, idx) => (
              <div key={idx} className="flex-1 flex flex-col items-center gap-1 group relative h-full justify-end">
                <div
                  style={{ height: `${Math.max(bar.height, 4)}%` }}
                  className={`w-full rounded-t-sm transition-all duration-300 ${
                    bar.revenue > 0 ? 'bg-[#00df89] hover:bg-[#00c97b]' : 'bg-slate-100 dark:bg-zinc-800/60'
                  }`}
                />
                <span className="text-[9px] text-slate-400 truncate w-full text-center hidden sm:block">
                  {bar.day}
                </span>

                {/* Tooltip */}
                <div className="absolute -top-8 bg-slate-900 text-white text-[10px] py-1 px-2 rounded opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-10 whitespace-nowrap shadow-lg">
                  ৳ {bar.revenue.toLocaleString()}
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>

    </div>
  );
}
