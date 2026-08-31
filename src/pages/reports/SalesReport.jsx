/**
 * @file SalesReport.jsx
 * @description Comprehensive Sales Reports, Invoices & CSV Export connected directly to MongoDB.
 */
import { useState, useEffect } from 'react';
import { useLanguage } from '@/context/LanguageContext';
import api from '@/services/api';
import { Card, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  BarChart3, Download, Calendar, DollarSign, ShoppingCart,
  CreditCard, Search, FileText, Loader2, ArrowUpRight
} from 'lucide-react';

export default function SalesReport() {
  const { lang } = useLanguage();

  const [period, setPeriod] = useState('30d');
  const [report, setReport] = useState(null);
  const [sales, setSales] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchReport = async () => {
    setIsLoading(true);
    try {
      const [repRes, salesRes] = await Promise.all([
        api.analytics.getSalesReport({ period }),
        api.sales.list(),
      ]);
      if (repRes.data) setReport(repRes.data);
      if (salesRes.data) setSales(salesRes.data);
    } catch (err) {
      console.warn('Failed to load sales report:', err.message);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchReport();
  }, [period]);

  const handleExportCSV = () => {
    if (sales.length === 0) {
      alert('No sales data to export.');
      return;
    }
    const headers = 'Invoice Number,Date,Customer,Payment Method,Total (BDT),Items Count\n';
    const rows = sales.map(s =>
      `"${s.invoice_number}","${new Date(s.created_at).toISOString()}","${s.customer_id?.name || 'Walk-in'}","${s.payment_method}",${s.total},${s.items?.length || 1}`
    ).join('\n');

    const csv = 'data:text/csv;charset=utf-8,' + encodeURIComponent(headers + rows);
    const link = document.createElement('a');
    link.setAttribute('href', csv);
    link.setAttribute('download', `sales_report_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const summary = report?.summary || {
    totalRevenue: 0,
    totalSales: 0,
    averageTicket: 0,
    totalItemsSold: 0,
  };

  const topProducts = report?.topProducts || [];

  return (
    <div className="space-y-6 font-sans">
      
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div className="min-w-0">
          <h1 className="text-xl sm:text-2xl font-medium text-slate-900 dark:text-white tracking-tight flex items-center gap-2.5">
            <BarChart3 className="w-6 h-6 text-[#00df89] shrink-0" />
            <span>{lang === 'bn' ? 'বিক্রয় রিপোর্ট ও এনালিটিক্স' : 'Sales Reports & Analytics'}</span>
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-zinc-400 mt-0.5">
            {lang === 'bn' ? 'দৈনিক ও মাসিক বিক্রয়ের লাইভ রিপোর্ট ও এক্সপোর্ট' : 'Detailed breakdown of retail revenue, volume, and top-selling SKUs'}
          </p>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <Button
            onClick={handleExportCSV}
            className="bg-[#00df89] hover:bg-[#00c97b] text-[#011812] font-medium text-xs sm:text-sm h-10 px-4 gap-1.5 shadow-xs whitespace-nowrap shrink-0 cursor-pointer"
          >
            <Download className="w-4 h-4 stroke-[2]" />
            <span>{lang === 'bn' ? 'সিএসভি ডাউনলোড' : 'Export CSV'}</span>
          </Button>
        </div>
      </div>

      {/* KPI METRICS */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="p-4 border-slate-200/90 dark:border-zinc-800/80 dark:bg-[#121215]">
          <span className="text-xs text-slate-500 dark:text-zinc-400">Period Gross Revenue</span>
          <div className="text-2xl font-medium text-[#00a86b] dark:text-[#00df89] mt-2">
            ৳ {summary.totalRevenue.toLocaleString()}
          </div>
        </Card>
        <Card className="p-4 border-slate-200/90 dark:border-zinc-800/80 dark:bg-[#121215]">
          <span className="text-xs text-slate-500 dark:text-zinc-400">Orders Processed</span>
          <div className="text-2xl font-medium text-slate-900 dark:text-white mt-2">
            {summary.totalSales}
          </div>
        </Card>
        <Card className="p-4 border-slate-200/90 dark:border-zinc-800/80 dark:bg-[#121215]">
          <span className="text-xs text-slate-500 dark:text-zinc-400">Avg Order Value</span>
          <div className="text-2xl font-medium text-slate-900 dark:text-white mt-2">
            ৳ {summary.averageTicket.toLocaleString()}
          </div>
        </Card>
        <Card className="p-4 border-slate-200/90 dark:border-zinc-800/80 dark:bg-[#121215]">
          <span className="text-xs text-slate-500 dark:text-zinc-400">Total Units Sold</span>
          <div className="text-2xl font-medium text-slate-900 dark:text-white mt-2">
            {summary.totalItemsSold}
          </div>
        </Card>
      </div>

      {/* TOP PRODUCTS & RECENT SALES */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* TOP SELLING PRODUCTS */}
        <Card className="p-5 border-slate-200/90 dark:border-zinc-800/80 dark:bg-[#121215] space-y-4">
          <CardTitle className="text-base font-medium">Top Selling Products</CardTitle>
          {isLoading ? (
            <div className="p-8 text-center text-slate-400">
              <Loader2 className="w-6 h-6 animate-spin mx-auto mb-2 text-[#00df89]" />
              Loading top products...
            </div>
          ) : topProducts.length === 0 ? (
            <div className="p-8 text-center text-xs text-slate-400">No items sold in this period.</div>
          ) : (
            <div className="space-y-3">
              {topProducts.map((tp, idx) => (
                <div key={idx} className="flex items-center justify-between text-xs pb-2 border-b border-slate-100 dark:border-zinc-800/80 last:border-0">
                  <div className="flex items-center gap-2">
                    <span className="w-5 h-5 rounded-full bg-slate-100 dark:bg-zinc-800 text-slate-600 dark:text-zinc-300 flex items-center justify-center font-medium text-[10px]">
                      {idx + 1}
                    </span>
                    <span className="font-medium text-slate-900 dark:text-white">{tp.name}</span>
                  </div>
                  <div className="text-right">
                    <div className="font-medium text-[#00a86b] dark:text-[#00df89]">৳ {tp.revenue.toLocaleString()}</div>
                    <div className="text-[10px] text-slate-400">{tp.quantity} units sold</div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </Card>

        {/* RECENT INVOICES SUMMARY */}
        <Card className="p-5 border-slate-200/90 dark:border-zinc-800/80 dark:bg-[#121215] space-y-4">
          <CardTitle className="text-base font-medium">Recent Invoices Generated</CardTitle>
          {sales.length === 0 ? (
            <div className="p-8 text-center text-xs text-slate-400">No invoices recorded yet.</div>
          ) : (
            <div className="space-y-3">
              {sales.slice(0, 5).map((s) => (
                <div key={s._id} className="flex items-center justify-between text-xs pb-2 border-b border-slate-100 dark:border-zinc-800/80 last:border-0">
                  <div>
                    <div className="font-medium text-slate-900 dark:text-white">{s.invoice_number}</div>
                    <div className="text-[10px] text-slate-400">{new Date(s.created_at).toLocaleString()}</div>
                  </div>
                  <div className="text-right">
                    <div className="font-medium text-[#00a86b] dark:text-[#00df89]">৳ {(s.total || 0).toLocaleString()}</div>
                    <Badge variant="default" className="text-[10px] uppercase font-normal">{s.payment_method}</Badge>
                  </div>
                </div>
              ))}
            </div>
          )}
        </Card>

      </div>

    </div>
  );
}
