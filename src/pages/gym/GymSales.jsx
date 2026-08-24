/**
 * @file GymSales.jsx
 * @description Gym Merchandise & POS Sales History page backed by MongoDB.
 */
import { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useLanguage } from '@/context/LanguageContext';
import { useAuth } from '@/context/AuthContext';
import api from '@/services/api';
import { printSaleReceipt } from '@/utils/invoicePrinter';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import Pagination from '@/components/common/Pagination';
import {
  ShoppingCart, Plus, Search, DollarSign, Calendar, FileText,
  Printer, ArrowUpRight, CheckCircle2, Store, Loader2
} from 'lucide-react';

export default function GymSales() {
  const navigate = useNavigate();
  const { lang } = useLanguage();
  const { mongoShop } = useAuth();

  const [sales, setSales] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  const fetchSales = async () => {
    try {
      const res = await api.sales.list();
      if (res.data) {
        setSales(res.data);
      }
    } catch (err) {
      console.warn('Failed to load gym sales from DB:', err.message);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchSales();
  }, []);

  const filteredSales = useMemo(() => {
    const q = searchTerm.toLowerCase();
    return sales.filter((s) => {
      const inv = s.invoice_number ? s.invoice_number.toLowerCase() : '';
      const cust = s.customer_id?.name ? s.customer_id.name.toLowerCase() : 'walk-in customer';
      return inv.includes(q) || cust.includes(q);
    });
  }, [sales, searchTerm]);

  // Pagination State
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, pageSize]);

  const paginatedSales = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredSales.slice(start, start + pageSize);
  }, [filteredSales, currentPage, pageSize]);

  const totalSalesAmount = sales.reduce((acc, s) => acc + (s.total || 0), 0);

  return (
    <div className="space-y-6 font-sans pb-12">
      
      {/* HEADER SECTION */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-medium text-slate-900 dark:text-white tracking-tight flex items-center gap-2.5">
            <ShoppingCart className="w-6 h-6 text-[#00df89]" />
            <span>{lang === 'bn' ? 'জিম সাপ্লিমেন্ট ও পণ্য বিক্রয়' : 'Supplements & Retail Sales'}</span>
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-zinc-400">
            {lang === 'bn' ? 'কাউন্টার ক্যাশ মেমো এবং সাপ্লিমেন্ট বিক্রয় রেজিস্টার' : 'POS invoices, energy drinks and gear purchases history'}
          </p>
        </div>

        <Button
          onClick={() => navigate('/sales/new')}
          className="bg-[#00df89] hover:bg-[#00c97b] text-[#011812] font-semibold text-xs sm:text-sm h-10 px-4 gap-2"
        >
          <Plus className="w-4 h-4 stroke-[2]" />
          <span>{lang === 'bn' ? 'নতুন বিক্রয় তৈরি করুন' : 'New Sale / POS'}</span>
        </Button>
      </div>

      {/* KPI METRICS */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card className="p-4 sm:p-5 border-slate-200/90 dark:border-zinc-800/80 dark:bg-[#121215]">
          <div className="flex items-center justify-between">
            <span className="text-xs sm:text-sm font-medium text-slate-500 dark:text-zinc-400">Total Sales Revenue</span>
            <DollarSign className="w-4 h-4 text-[#00df89]" />
          </div>
          <div className="text-2xl sm:text-3xl font-bold text-slate-900 dark:text-white mt-2">
            {isLoading ? <div className="h-8 bg-slate-200 dark:bg-zinc-800 rounded animate-pulse w-24" /> : `৳ ${totalSalesAmount.toLocaleString()}`}
          </div>
          <div className="text-xs text-slate-400 mt-1">Lifetime supplement revenue</div>
        </Card>

        <Card className="p-4 sm:p-5 border-slate-200/90 dark:border-zinc-800/80 dark:bg-[#121215]">
          <div className="flex items-center justify-between">
            <span className="text-xs sm:text-sm font-medium text-slate-500 dark:text-zinc-400">Invoices Generated</span>
            <FileText className="w-4 h-4 text-blue-500" />
          </div>
          <div className="text-2xl sm:text-3xl font-bold text-slate-900 dark:text-white mt-2">
            {isLoading ? <div className="h-8 bg-slate-200 dark:bg-zinc-800 rounded animate-pulse w-16" /> : sales.length}
          </div>
          <div className="text-xs text-slate-400 mt-1">Total completed transactions</div>
        </Card>

        <Card className="p-4 sm:p-5 border-slate-200/90 dark:border-zinc-800/80 dark:bg-[#121215]">
          <div className="flex items-center justify-between">
            <span className="text-xs sm:text-sm font-medium text-slate-500 dark:text-zinc-400">Average Order</span>
            <ShoppingCart className="w-4 h-4 text-purple-500" />
          </div>
          <div className="text-2xl sm:text-3xl font-bold text-slate-900 dark:text-white mt-2">
            {isLoading ? <div className="h-8 bg-slate-200 dark:bg-zinc-800 rounded animate-pulse w-24" /> : `৳ ${sales.length > 0 ? Math.round(totalSalesAmount / sales.length).toLocaleString() : 0}`}
          </div>
          <div className="text-xs text-slate-400 mt-1">Average cart basket size</div>
        </Card>
      </div>

      {/* SEARCH */}
      <Card className="p-4 border-slate-200/90 dark:border-zinc-800/80 dark:bg-[#121215]">
        <div className="w-full sm:w-80 relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder={lang === 'bn' ? 'ইনভয়েস বা গ্রাহক খুঁজুন...' : 'Search invoice or customer...'}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-4 py-2 rounded-xl bg-slate-50 dark:bg-[#09090b] border border-slate-200 dark:border-zinc-800 text-xs text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-[#00df89]"
          />
        </div>
      </Card>

      {/* SALES TABLE */}
      <Card className="p-0 border-slate-200/90 dark:border-zinc-800/80 dark:bg-[#121215] overflow-hidden">
        {isLoading ? (
          <div className="p-12 text-center text-slate-400">
            <Loader2 className="w-8 h-8 animate-spin mx-auto mb-2 text-[#00df89]" />
            Loading sales invoices...
          </div>
        ) : filteredSales.length === 0 ? (
          <div className="p-12 text-center space-y-3">
            <ShoppingCart className="w-10 h-10 text-slate-300 dark:text-zinc-600 mx-auto" />
            <h3 className="text-sm font-medium text-slate-800 dark:text-zinc-200">No Sales Recorded Yet</h3>
            <p className="text-xs text-slate-500 dark:text-zinc-400">Record a supplement or merchandise sale to generate invoice.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left">
              <thead className="bg-slate-50 dark:bg-zinc-900/60 text-slate-500 border-b border-slate-200 dark:border-zinc-800">
                <tr>
                  <th className="p-3.5">Invoice #</th>
                  <th className="p-3.5">Customer</th>
                  <th className="p-3.5">Items</th>
                  <th className="p-3.5">Date</th>
                  <th className="p-3.5">Method</th>
                  <th className="p-3.5 text-right">Total Amount (৳)</th>
                  <th className="p-3.5 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-zinc-800/80">
                {paginatedSales.map((s) => (
                  <tr key={s._id} className="hover:bg-slate-50 dark:hover:bg-zinc-900/40">
                    <td className="p-3.5 font-medium text-slate-900 dark:text-white">{s.invoice_number}</td>
                    <td className="p-3.5 text-slate-800 dark:text-zinc-200">{s.customer_id?.name || 'Walk-in Customer'}</td>
                    <td className="p-3.5 text-slate-600 dark:text-zinc-300">
                      {s.items?.map(it => `${it.name} (${it.quantity})`).join(', ') || '1 item'}
                    </td>
                    <td className="p-3.5 text-slate-500">{new Date(s.created_at).toLocaleString()}</td>
                    <td className="p-3.5">
                      <Badge variant="default" className="text-[10px] uppercase font-normal">
                        {s.payment_method || 'Paid'}
                      </Badge>
                    </td>
                    <td className="p-3.5 text-right font-medium text-[#00a86b] dark:text-[#00df89]">
                      ৳ {(s.total || 0).toLocaleString()}
                    </td>
                    <td className="p-3.5 text-right">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => printSaleReceipt({ order: s, shop: mongoShop, lang })}
                        className="h-7 text-xs px-2 text-slate-600 dark:text-zinc-300 hover:text-[#00df89] cursor-pointer"
                        title={lang === 'bn' ? 'ক্যাশ মেমো প্রিন্ট করুন' : 'Print Cash Memo'}
                      >
                        <Printer className="w-3.5 h-3.5" />
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            {/* Pagination Controls */}
            <Pagination
              currentPage={currentPage}
              totalItems={filteredSales.length}
              pageSize={pageSize}
              pageSizeOptions={[10, 20, 50, 100]}
              onPageChange={setCurrentPage}
              onPageSizeChange={setPageSize}
            />
          </div>
        )}
      </Card>

    </div>
  );
}
