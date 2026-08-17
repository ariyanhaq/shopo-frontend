/**
 * @file GymReports.jsx
 * @description Gym growth analytics, attendance reports & CSV export utility backed by MongoDB.
 */
import { useState, useEffect } from 'react';
import { useLanguage } from '@/context/LanguageContext';
import api from '@/services/api';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { BarChart3, Download, Users, DollarSign, Calendar, Loader2 } from 'lucide-react';

export default function GymReports() {
  const { lang } = useLanguage();
  const [gymSummary, setGymSummary] = useState(null);
  const [payments, setPayments] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        const [dashRes, payRes] = await Promise.all([
          api.gym.getDashboard(),
          api.gym.payments.list(),
        ]);
        if (dashRes.data) setGymSummary(dashRes.data);
        if (payRes.data) setPayments(payRes.data);
      } catch (err) {
        console.warn('Failed to load gym reports data:', err.message);
      } finally {
        setIsLoading(false);
      }
    };
    load();
  }, []);

  const handleExportCSV = () => {
    if (payments.length === 0) {
      alert('No payment records to export.');
      return;
    }
    const headers = 'Invoice Number,Athlete Name,Package,Date,Paid (BDT),Due (BDT),Payment Method,Status\n';
    const rows = payments.map(p =>
      `"${p.invoiceNumber}","${p.memberName}","${p.package_name}","${p.date}",${p.paid},${p.due},"${p.method}","${p.status}"`
    ).join('\n');

    const csvContent = 'data:text/csv;charset=utf-8,' + encodeURIComponent(headers + rows);
    const link = document.createElement('a');
    link.setAttribute('href', csvContent);
    link.setAttribute('download', `gym_payments_report_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const metrics = gymSummary?.metrics || {
    totalMembers: 0,
    activeMembers: 0,
    monthlyRevenue: 0,
    todayCheckins: 0,
    activeRate: 0,
  };

  return (
    <div className="space-y-6 font-sans">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-medium text-slate-900 dark:text-white flex items-center gap-2.5">
            <BarChart3 className="w-6 h-6 text-[#00df89]" />
            <span>{lang === 'bn' ? 'জিম অ্যানালিটিক্স ও রিপোর্ট' : 'Gym Growth Analytics & Reports'}</span>
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-zinc-400 font-normal">
            {lang === 'bn' ? 'আর্থিক বিবরণী ডাউনলোড ও সদস্য উপস্থিতির রিপোর্ট' : 'Export monthly financial summaries, attendance logs & active athlete reports'}
          </p>
        </div>

        <Button
          onClick={handleExportCSV}
          className="bg-[#00df89] hover:bg-[#00c97b] text-[#011812] font-medium text-xs gap-1.5 shadow-xs"
        >
          <Download className="w-4 h-4 stroke-[2]" />
          <span>{lang === 'bn' ? 'সিএসভি রিপোর্ট ডাউনলোড' : 'Export CSV Report'}</span>
        </Button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card className="p-5 border-slate-200/90 dark:border-zinc-800/80 dark:bg-[#121215]">
          <span className="text-xs font-medium text-slate-500">Total Registered Athletes</span>
          <div className="mt-2 text-2xl font-medium text-slate-900 dark:text-white">{metrics.totalMembers} Members</div>
        </Card>

        <Card className="p-5 border-slate-200/90 dark:border-zinc-800/80 dark:bg-[#121215]">
          <span className="text-xs font-medium text-slate-500">Monthly Fee Revenue</span>
          <div className="mt-2 text-2xl font-medium text-[#00a86b] dark:text-[#00df89]">৳ {metrics.monthlyRevenue.toLocaleString()}</div>
        </Card>

        <Card className="p-5 border-slate-200/90 dark:border-zinc-800/80 dark:bg-[#121215]">
          <span className="text-xs font-medium text-slate-500">Member Retention / Active Rate</span>
          <div className="mt-2 text-2xl font-medium text-blue-500">{metrics.activeRate}%</div>
        </Card>
      </div>

    </div>
  );
}
