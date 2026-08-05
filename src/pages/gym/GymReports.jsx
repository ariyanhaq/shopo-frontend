/**
 * @file GymReports.jsx
 * @description Gym growth analytics, attendance reports & CSV export utility.
 */
import { useState } from 'react';
import { useLanguage } from '@/context/LanguageContext';
import { Card, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { BarChart3, Download, TrendingUp, Users, DollarSign, Calendar } from 'lucide-react';

export default function GymReports() {
  const { lang } = useLanguage();

  const handleExportCSV = () => {
    const csvContent = "data:text/csv;charset=utf-8,Month,New Members,Revenue,Expenses\nJan,28,310000,110000\nFeb,32,340000,115000\nMar,30,325000,112000\nApr,40,410000,120000\nMay,35,385000,118000";
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", "gym_performance_report_2026.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6 font-sans">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-extrabold text-slate-900 dark:text-white flex items-center gap-2">
            <BarChart3 className="w-6 h-6 text-[#00df89]" />
            <span>Gym Growth Analytics & Reports</span>
          </h1>
          <p className="text-xs text-slate-500 font-normal">
            Export monthly financial summaries, attendance logs & top active members list.
          </p>
        </div>

        <Button onClick={handleExportCSV} className="bg-[#00df89] text-[#011812] hover:bg-[#00c97b] font-bold text-xs sm:text-sm h-11 px-4 gap-2 shadow-md shadow-emerald-500/20">
          <Download className="w-4 h-4" /> Export CSV Report
        </Button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card className="p-5 border border-slate-200/90 dark:border-zinc-800/80 dark:bg-[#121215]">
          <span className="text-xs font-medium text-slate-500">Average Daily Attendance</span>
          <div className="mt-2 text-2xl font-extrabold text-slate-900 dark:text-white">64 Athletes / day</div>
        </Card>

        <Card className="p-5 border border-slate-200/90 dark:border-zinc-800/80 dark:bg-[#121215]">
          <span className="text-xs font-medium text-slate-500">Net Profit Margin</span>
          <div className="mt-2 text-2xl font-extrabold text-emerald-600 dark:text-[#00df89]">৳ 261,500 (+22%)</div>
        </Card>

        <Card className="p-5 border border-slate-200/90 dark:border-zinc-800/80 dark:bg-[#121215]">
          <span className="text-xs font-medium text-slate-500">Member Retention Rate</span>
          <div className="mt-2 text-2xl font-extrabold text-blue-500">88.4%</div>
        </Card>
      </div>

    </div>
  );
}
