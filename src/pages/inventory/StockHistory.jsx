/**
 * @file StockHistory.jsx
 * @description Inventory movements, stock adjustments & audit ledger connected to MongoDB.
 */
import { useState, useEffect, useMemo } from 'react';
import { useLanguage } from '@/context/LanguageContext';
import api from '@/services/api';
import { Card, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import Pagination from '@/components/common/Pagination';
import { Layers, Search, ArrowUpRight, ArrowDownRight, RefreshCw, Loader2 } from 'lucide-react';

export default function StockHistory() {
  const { lang } = useLanguage();
  const [transactions, setTransactions] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  const fetchTransactions = async () => {
    try {
      const res = await api.inventory.getTransactions();
      if (res.data) {
        setTransactions(res.data);
      }
    } catch (err) {
      console.warn('Failed to load inventory transactions:', err.message);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchTransactions();
  }, []);

  const filtered = useMemo(() => {
    const q = searchTerm.toLowerCase();
    return transactions.filter((t) => {
      const prod = t.product_id?.name ? t.product_id.name.toLowerCase() : '';
      const note = t.note ? t.note.toLowerCase() : '';
      return prod.includes(q) || note.includes(q) || t.type.toLowerCase().includes(q);
    });
  }, [transactions, searchTerm]);

  // Pagination State
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, pageSize]);

  const paginatedTransactions = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filtered.slice(start, start + pageSize);
  }, [filtered, currentPage, pageSize]);

  return (
    <div className="space-y-6 font-sans pb-12">
      
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div className="min-w-0">
          <h1 className="text-xl sm:text-2xl font-medium text-slate-900 dark:text-white tracking-tight flex items-center gap-2.5">
            <Layers className="w-6 h-6 text-[#00df89] shrink-0" />
            <span>{lang === 'bn' ? 'স্টক অডিট ও মুভমেন্ট হিস্ট্রি' : 'Stock Movements & Audit History'}</span>
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-zinc-400 mt-0.5">
            {lang === 'bn' ? 'প্রতিটি বিক্রয়, অ্যাডজাস্টমেন্ট ও রিস্টকের বিস্তারিত হিসাব' : 'Automatic inventory ledger recording every sale, restock, and manual adjustment'}
          </p>
        </div>
      </div>

      {/* SEARCH */}
      <Card className="p-4 border-slate-200/90 dark:border-zinc-800/80 dark:bg-[#121215]">
        <div className="w-full sm:w-80 relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder={lang === 'bn' ? 'পণ্য বা নোট দিয়ে খুঁজুন...' : 'Search by product name or note...'}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-4 py-2 rounded-xl bg-slate-50 dark:bg-[#09090b] border border-slate-200 dark:border-zinc-800 text-xs text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-[#00df89]"
          />
        </div>
      </Card>

      {/* TRANSACTIONS TABLE */}
      <Card className="p-0 border-slate-200/90 dark:border-zinc-800/80 dark:bg-[#121215] overflow-hidden">
        {isLoading ? (
          <div className="p-12 text-center text-slate-400">
            <Loader2 className="w-8 h-8 animate-spin mx-auto mb-2 text-[#00df89]" />
            Loading stock history...
          </div>
        ) : filtered.length === 0 ? (
          <div className="p-12 text-center space-y-3">
            <Layers className="w-10 h-10 text-slate-300 dark:text-zinc-600 mx-auto" />
            <h3 className="text-sm font-medium text-slate-800 dark:text-zinc-200">No Stock Transactions Logged</h3>
            <p className="text-xs text-slate-500 dark:text-zinc-400">Inventory transactions are recorded automatically on every sale or stock update.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left">
              <thead className="bg-slate-50 dark:bg-zinc-900/60 text-slate-500 border-b border-slate-200 dark:border-zinc-800">
                <tr>
                  <th className="p-3.5">Date & Time</th>
                  <th className="p-3.5">Product</th>
                  <th className="p-3.5">Action Type</th>
                  <th className="p-3.5">Qty Changed</th>
                  <th className="p-3.5">Previous Stock</th>
                  <th className="p-3.5">New Stock</th>
                  <th className="p-3.5">Reference / Note</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-zinc-800/80">
                {paginatedTransactions.map((tx) => (
                  <tr key={tx._id} className="hover:bg-slate-50 dark:hover:bg-zinc-900/40">
                    <td className="p-3.5 text-slate-500">{new Date(tx.created_at).toLocaleString()}</td>
                    <td className="p-3.5 font-medium text-slate-900 dark:text-white">
                      {tx.product_id?.name || 'Product'}
                    </td>
                    <td className="p-3.5">
                      <Badge
                        variant={tx.type === 'sale' ? 'destructive' : tx.type === 'purchase' ? 'default' : 'secondary'}
                        className="text-[10px] uppercase font-normal"
                      >
                        {tx.type.replace('_', ' ')}
                      </Badge>
                    </td>
                    <td className={`p-3.5 font-medium ${tx.quantity < 0 ? 'text-rose-500' : 'text-[#00a86b] dark:text-[#00df89]'}`}>
                      {tx.quantity > 0 ? `+${tx.quantity}` : tx.quantity}
                    </td>
                    <td className="p-3.5 text-slate-600 dark:text-zinc-400">{tx.previous_stock}</td>
                    <td className="p-3.5 font-medium text-slate-900 dark:text-white">{tx.new_stock}</td>
                    <td className="p-3.5 text-slate-500">{tx.note || tx.reference_type || '-'}</td>
                  </tr>
                ))}
              </tbody>
            </table>

            {/* Pagination Controls */}
            <Pagination
              currentPage={currentPage}
              totalItems={filtered.length}
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
