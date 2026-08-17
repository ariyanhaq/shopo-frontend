/**
 * @file Transactions.jsx
 * @description All financial sales transactions and payment ledger connected directly to MongoDB.
 */
import { useState, useEffect } from 'react';
import { useLanguage } from '@/context/LanguageContext';
import api from '@/services/api';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { CreditCard, Search, ArrowUpRight, ArrowDownRight, Loader2, FileText } from 'lucide-react';

export default function Transactions() {
  const { lang } = useLanguage();
  const [sales, setSales] = useState([]);
  const [expenses, setExpenses] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState('all');

  const fetchTransactions = async () => {
    try {
      const [salesRes, expRes] = await Promise.all([
        api.sales.list(),
        api.expenses.list(),
      ]);
      if (salesRes.data) setSales(salesRes.data);
      if (expRes.data) setExpenses(expRes.data);
    } catch (err) {
      console.warn('Failed to load transactions:', err.message);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchTransactions();
  }, []);

  const combined = [
    ...sales.map(s => ({
      id: s.invoice_number,
      type: 'sale',
      title: `Sale: ${s.items?.map(i => i.name).join(', ') || 'Items'}`,
      amount: s.total,
      date: s.created_at,
      method: s.payment_method || 'Cash',
      customer: s.customer_id?.name || 'Walk-in Customer',
    })),
    ...expenses.map(e => ({
      id: `EXP-${e._id.slice(-4).toUpperCase()}`,
      type: 'expense',
      title: `${e.category}: ${e.title}`,
      amount: e.amount,
      date: e.date || e.created_at,
      method: 'Cash',
      customer: 'Facility Outflow',
    }))
  ].sort((a, b) => new Date(b.date) - new Date(a.date));

  const filtered = combined.filter(tx => {
    const q = searchTerm.toLowerCase();
    const matchesSearch = tx.id.toLowerCase().includes(q) || tx.title.toLowerCase().includes(q) || tx.customer.toLowerCase().includes(q);
    const matchesType = filterType === 'all' || tx.type === filterType;
    return matchesSearch && matchesType;
  });

  return (
    <div className="space-y-6 font-sans">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-medium text-slate-900 dark:text-white tracking-tight flex items-center gap-2.5">
            <CreditCard className="w-6 h-6 text-[#00df89]" />
            <span>{lang === 'bn' ? 'সকল আর্থিক লেনদেন' : 'Financial Transactions Ledger'}</span>
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-zinc-400">
            {lang === 'bn' ? 'বিক্রয় ও খরচের লাইভ ক্যাশ ফ্লো খতিয়ান' : 'Chronological stream of retail sales invoices, dues and operational outflows'}
          </p>
        </div>
      </div>

      {/* FILTER BAR */}
      <Card className="p-4 border-slate-200/90 dark:border-zinc-800/80 dark:bg-[#121215] flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="w-full sm:w-80 relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder={lang === 'bn' ? 'ট্রানজ্যাকশন খুঁজুন...' : 'Search by ID, customer or description...'}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-4 py-2 rounded-xl bg-slate-50 dark:bg-[#09090b] border border-slate-200 dark:border-zinc-800 text-xs text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-[#00df89]"
          />
        </div>

        <div className="flex items-center gap-2">
          {['all', 'sale', 'expense'].map((t) => (
            <button
              key={t}
              onClick={() => setFilterType(t)}
              className={`px-3 py-1.5 rounded-xl text-xs font-medium uppercase transition-all ${
                filterType === t
                  ? 'bg-slate-900 text-white dark:bg-zinc-800'
                  : 'bg-slate-100 dark:bg-zinc-900 text-slate-600 dark:text-zinc-400'
              }`}
            >
              {t}
            </button>
          ))}
        </div>
      </Card>

      {/* TABLE */}
      <Card className="p-0 border-slate-200/90 dark:border-zinc-800/80 dark:bg-[#121215] overflow-hidden">
        {isLoading ? (
          <div className="p-12 text-center text-slate-400">
            <Loader2 className="w-8 h-8 animate-spin mx-auto mb-2 text-[#00df89]" />
            Loading live transactions...
          </div>
        ) : filtered.length === 0 ? (
          <div className="p-12 text-center space-y-3">
            <CreditCard className="w-10 h-10 text-slate-300 dark:text-zinc-600 mx-auto" />
            <h3 className="text-sm font-medium text-slate-800 dark:text-zinc-200">No Transactions Found</h3>
            <p className="text-xs text-slate-500 dark:text-zinc-400">Sales and expense transactions will automatically appear here.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left">
              <thead className="bg-slate-50 dark:bg-zinc-900/60 text-slate-500 border-b border-slate-200 dark:border-zinc-800">
                <tr>
                  <th className="p-3.5">Tx ID</th>
                  <th className="p-3.5">Type</th>
                  <th className="p-3.5">Description</th>
                  <th className="p-3.5">Party / Customer</th>
                  <th className="p-3.5">Date & Time</th>
                  <th className="p-3.5">Payment Method</th>
                  <th className="p-3.5 text-right">Amount (৳)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-zinc-800/80">
                {filtered.map((tx, idx) => (
                  <tr key={idx} className="hover:bg-slate-50 dark:hover:bg-zinc-900/40">
                    <td className="p-3.5 font-medium text-slate-900 dark:text-white flex items-center gap-1.5">
                      <FileText className="w-3.5 h-3.5 text-slate-400" />
                      <span>{tx.id}</span>
                    </td>
                    <td className="p-3.5">
                      <Badge
                        variant={tx.type === 'sale' ? 'default' : 'destructive'}
                        className="text-[10px] uppercase font-normal"
                      >
                        {tx.type}
                      </Badge>
                    </td>
                    <td className="p-3.5 text-slate-800 dark:text-zinc-200">{tx.title}</td>
                    <td className="p-3.5 text-slate-600 dark:text-zinc-400">{tx.customer}</td>
                    <td className="p-3.5 text-slate-500">{new Date(tx.date).toLocaleString()}</td>
                    <td className="p-3.5 capitalize text-slate-600 dark:text-zinc-300">{tx.method}</td>
                    <td className={`p-3.5 text-right font-medium ${tx.type === 'sale' ? 'text-[#00a86b] dark:text-[#00df89]' : 'text-rose-500'}`}>
                      {tx.type === 'sale' ? '+' : '-'}৳ {(tx.amount || 0).toLocaleString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>

    </div>
  );
}
