/**
 * @file GymAccounting.jsx
 * @description Gym Accounting, Profit & Loss Statement, Cash Flow Ledger & Revenue/Expense analytics.
 */
import { useState } from 'react';
import { useLanguage } from '@/context/LanguageContext';
import { Card, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import {
  Wallet, DollarSign, TrendingUp, TrendingDown, Plus, Download,
  Calendar, FileSpreadsheet, ArrowUpRight, ArrowDownRight,
  CheckCircle2, Receipt, Dumbbell, ShoppingCart, UserCheck, X
} from 'lucide-react';

export default function GymAccounting() {
  const { lang } = useLanguage();

  const [dateFilter, setDateFilter] = useState('month');
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Financial Summary Numbers
  const financialData = {
    grossRevenue: 148500,
    operatingExpenses: 42000,
    netProfit: 106500,
    profitMargin: '71.7%'
  };

  // Revenue Streams for Gym
  const revenueStreams = [
    { title: 'Membership Passes & Renewals', amount: 95000, percentage: 64.0 },
    { title: 'Personal Trainer Session Fees', amount: 38500, percentage: 25.9 },
    { title: 'Supplements & Merchandise Sales', amount: 15000, percentage: 10.1 }
  ];

  // Operating Expenses Breakdown for Gym
  const expenseBreakdown = [
    { title: 'Gym Facility Rent', amount: 25000, percentage: 59.5 },
    { title: 'Trainer & Staff Payroll', amount: 10000, percentage: 23.8 },
    { title: 'AC & Electricity Utilities', amount: 5000, percentage: 11.9 },
    { title: 'Treadmill & Weight Servicing', amount: 2000, percentage: 4.8 }
  ];

  // Ledger Cashbook Entries
  const [ledgerEntries, setLedgerEntries] = useState([
    { id: 'TX-GYM-901', type: 'income', category: 'Membership Pass', title: '6-Month VIP Pass — Mahmudur Rahman', amount: 15000, method: 'bKash', date: '2026-08-05' },
    { id: 'TX-GYM-902', type: 'income', category: 'Supplements Sale', title: 'Whey Protein 1kg + Shaker Bottle Sale', amount: 5650, method: 'bKash', date: '2026-08-05' },
    { id: 'TX-GYM-903', type: 'expense', category: 'Facility Rent', title: 'Monthly Gym Floor Premises Rent', amount: 25000, method: 'Bank Transfer', date: '2026-08-01' },
    { id: 'TX-GYM-904', type: 'expense', category: 'Trainer Salary', title: 'Personal Trainer Advance Payout (Tanvir)', amount: 10000, method: 'Cash', date: '2026-08-02' },
    { id: 'TX-GYM-905', type: 'income', category: 'Personal Trainer', title: 'PT Coaching Sessions — Sabrina Islam', amount: 8000, method: 'Cash', date: '2026-08-04' },
    { id: 'TX-GYM-906', type: 'expense', category: 'Utilities', title: 'DESCO AC Electricity Bill', amount: 5000, method: 'bKash', date: '2026-08-01' }
  ]);

  const [newEntry, setNewEntry] = useState({
    title: '',
    type: 'income',
    category: 'Membership Pass',
    amount: '',
    method: 'bKash',
    date: new Date().toISOString().split('T')[0]
  });

  const handleAddSubmit = (e) => {
    e.preventDefault();
    if (!newEntry.title || !newEntry.amount) return;

    const created = {
      id: `TX-GYM-${900 + ledgerEntries.length + 1}`,
      ...newEntry,
      amount: Number(newEntry.amount) || 0
    };

    setLedgerEntries([created, ...ledgerEntries]);
    setIsModalOpen(false);
    setNewEntry({ title: '', type: 'income', category: 'Membership Pass', amount: '', method: 'bKash', date: new Date().toISOString().split('T')[0] });
  };

  return (
    <div className="space-y-6 font-sans font-normal text-slate-800 dark:text-zinc-200">
      
      {/* HEADER SECTION */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-extrabold text-slate-900 dark:text-white flex items-center gap-2">
            <Wallet className="w-6 h-6 text-[#00df89]" />
            <span>Accounting & Profit / Loss Statement</span>
          </h1>
          <p className="text-xs text-slate-500 font-normal">
            Track gross membership revenue, merchandise sales, trainer payouts, facility rent & net profit.
          </p>
        </div>

        <div className="flex items-center gap-2">
          {/* Time Filter Pills */}
          <div className="bg-slate-100 dark:bg-[#121215] p-1 rounded-xl flex items-center gap-1 border border-slate-200/80 dark:border-zinc-800">
            {[
              { id: 'month', label: 'This Month' },
              { id: 'quarter', label: 'Quarterly' },
              { id: 'year', label: 'Yearly' }
            ].map(tf => (
              <button
                key={tf.id}
                onClick={() => setDateFilter(tf.id)}
                className={`px-3 py-1 rounded-lg text-xs font-medium transition-colors cursor-pointer ${
                  dateFilter === tf.id
                    ? 'bg-white dark:bg-zinc-800 text-slate-900 dark:text-white shadow-xs'
                    : 'text-slate-500 hover:text-slate-900 dark:text-zinc-400 font-normal'
                }`}
              >
                {tf.label}
              </button>
            ))}
          </div>

          <Button
            onClick={() => setIsModalOpen(true)}
            className="bg-[#00df89] text-[#011812] hover:bg-[#00c97b] font-medium text-xs sm:text-sm h-10 px-4 gap-2 shadow-md shadow-emerald-500/20 whitespace-nowrap shrink-0"
          >
            <Plus className="w-4 h-4" /> Log Entry
          </Button>
        </div>
      </div>

      {/* FINANCIAL SUMMARY KPI CARDS (4 COLUMNS) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Gross Revenue */}
        <Card className="p-5 border border-slate-200/90 dark:border-zinc-800/80 dark:bg-[#121215]">
          <div className="flex items-center justify-between">
            <span className="text-xs sm:text-sm font-normal text-slate-500 dark:text-zinc-400">
              Total Gross Revenue
            </span>
            <div className="w-8 h-8 rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-[#00df89] flex items-center justify-center">
              <DollarSign className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 space-y-1">
            <div className="text-2xl font-normal text-slate-900 dark:text-white">
              ৳ {financialData.grossRevenue.toLocaleString()}
            </div>
            <div className="text-xs text-emerald-600 dark:text-[#00df89] font-normal flex items-center gap-1">
              <ArrowUpRight className="w-3.5 h-3.5" />
              <span>+18.4% vs last month</span>
            </div>
          </div>
        </Card>

        {/* Operating Expenses */}
        <Card className="p-5 border border-slate-200/90 dark:border-zinc-800/80 dark:bg-[#121215]">
          <div className="flex items-center justify-between">
            <span className="text-xs sm:text-sm font-normal text-slate-500 dark:text-zinc-400">
              Facility Expenses
            </span>
            <div className="w-8 h-8 rounded-lg bg-rose-500/10 text-rose-500 flex items-center justify-center">
              <ArrowDownRight className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 space-y-1">
            <div className="text-2xl font-normal text-rose-500">
              ৳ {financialData.operatingExpenses.toLocaleString()}
            </div>
            <div className="text-xs text-slate-500 dark:text-zinc-400 font-normal">
              28.2% of gross earnings
            </div>
          </div>
        </Card>

        {/* Net Profit */}
        <Card className="p-5 border border-slate-200/90 dark:border-zinc-800/80 dark:bg-[#121215]">
          <div className="flex items-center justify-between">
            <span className="text-xs sm:text-sm font-normal text-slate-500 dark:text-zinc-400">
              Net Gym Profit
            </span>
            <div className="w-8 h-8 rounded-lg bg-[#00df89]/20 text-emerald-600 dark:text-[#00df89] flex items-center justify-center">
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 space-y-1">
            <div className="text-2xl font-normal text-emerald-600 dark:text-[#00df89]">
              ৳ {financialData.netProfit.toLocaleString()}
            </div>
            <div className="text-xs text-emerald-600 dark:text-[#00df89] font-normal">
              High profit margin
            </div>
          </div>
        </Card>

        {/* Profit Margin */}
        <Card className="p-5 border border-slate-200/90 dark:border-zinc-800/80 dark:bg-[#121215]">
          <div className="flex items-center justify-between">
            <span className="text-xs sm:text-sm font-normal text-slate-500 dark:text-zinc-400">
              Profit Margin %
            </span>
            <div className="w-8 h-8 rounded-lg bg-purple-500/10 text-purple-500 flex items-center justify-center">
              <Receipt className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 space-y-1">
            <div className="text-2xl font-normal text-purple-500">
              {financialData.profitMargin}
            </div>
            <div className="text-xs text-purple-500 font-normal">
              Healthy return
            </div>
          </div>
        </Card>
      </div>

      {/* REVENUE BREAKDOWN VS EXPENSE BREAKDOWN (2 COLUMNS) */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Revenue Streams Card */}
        <Card className="p-6 space-y-4 border border-slate-200/90 dark:border-zinc-800/80 dark:bg-[#121215]">
          <div>
            <CardTitle className="text-base sm:text-lg font-medium text-slate-900 dark:text-white">
              Revenue Streams Breakdown
            </CardTitle>
            <CardDescription className="text-xs sm:text-sm font-normal">
              Income distribution from Passes, PT Sessions & Merchandise
            </CardDescription>
          </div>

          <div className="space-y-4 pt-1">
            {revenueStreams.map((item, idx) => (
              <div key={idx} className="space-y-1.5">
                <div className="flex items-center justify-between text-xs sm:text-sm">
                  <span className="font-medium text-slate-800 dark:text-zinc-200">{item.title}</span>
                  <span className="font-medium text-slate-900 dark:text-white">৳ {item.amount.toLocaleString()} ({item.percentage}%)</span>
                </div>
                <div className="w-full h-2 rounded-full bg-slate-100 dark:bg-zinc-800 overflow-hidden">
                  <div style={{ width: `${item.percentage}%` }} className="h-full rounded-full bg-[#00df89]" />
                </div>
              </div>
            ))}
          </div>
        </Card>

        {/* Expense Category Breakdown Card */}
        <Card className="p-6 space-y-4 border border-slate-200/90 dark:border-zinc-800/80 dark:bg-[#121215]">
          <div>
            <CardTitle className="text-base sm:text-lg font-medium text-slate-900 dark:text-white">
              Operating Expense Breakdown
            </CardTitle>
            <CardDescription className="text-xs sm:text-sm font-normal">
              Facility rent, trainer payroll, utility bills & maintenance
            </CardDescription>
          </div>

          <div className="space-y-4 pt-1">
            {expenseBreakdown.map((item, idx) => (
              <div key={idx} className="space-y-1.5">
                <div className="flex items-center justify-between text-xs sm:text-sm">
                  <span className="font-medium text-slate-800 dark:text-zinc-200">{item.title}</span>
                  <span className="font-medium text-slate-900 dark:text-white">৳ {item.amount.toLocaleString()} ({item.percentage}%)</span>
                </div>
                <div className="w-full h-2 rounded-full bg-slate-100 dark:bg-zinc-800 overflow-hidden">
                  <div style={{ width: `${item.percentage}%` }} className="h-full rounded-full bg-rose-500" />
                </div>
              </div>
            ))}
          </div>
        </Card>

      </div>

      {/* FINANCIAL LEDGER TABLE */}
      <Card className="border border-slate-200/90 dark:border-zinc-800/80 dark:bg-[#121215] overflow-hidden">
        <div className="p-4 sm:p-5 border-b border-slate-100 dark:border-zinc-800/80 flex items-center justify-between">
          <div>
            <CardTitle className="text-base sm:text-lg font-medium text-slate-900 dark:text-white">
              Cashbook & Transaction Journal
            </CardTitle>
            <CardDescription className="text-xs sm:text-sm font-normal">
              Combined ledger of income collections and facility expenses
            </CardDescription>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs sm:text-sm">
            <thead>
              <tr className="border-b border-slate-200/80 dark:border-zinc-800/80 bg-slate-50/50 dark:bg-zinc-900/50 text-slate-500 dark:text-zinc-400 font-normal">
                <th className="p-4 font-medium">Transaction ID & Date</th>
                <th className="p-4 font-medium">Description</th>
                <th className="p-4 font-medium">Category</th>
                <th className="p-4 font-medium">Payment Method</th>
                <th className="p-4 text-right font-medium">Net Amount</th>
              </tr>
            </thead>

            <tbody className="divide-y divide-slate-100 dark:divide-zinc-800/60 font-normal">
              {ledgerEntries.map((entry) => (
                <tr key={entry.id} className="hover:bg-slate-50/60 dark:hover:bg-zinc-800/40 transition-colors">
                  <td className="p-4">
                    <div className="font-mono font-medium text-slate-900 dark:text-white">{entry.id}</div>
                    <div className="text-[11px] text-slate-400 font-mono">{entry.date}</div>
                  </td>
                  <td className="p-4 font-medium text-slate-800 dark:text-zinc-200">
                    {entry.title}
                  </td>
                  <td className="p-4 text-slate-600 dark:text-zinc-400 font-normal">
                    {entry.category}
                  </td>
                  <td className="p-4 text-slate-600 dark:text-zinc-400 font-normal">
                    <span className="px-2 py-0.5 rounded-md bg-slate-100 dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 font-mono text-[11px]">
                      {entry.method}
                    </span>
                  </td>
                  <td className={`p-4 text-right font-medium ${entry.type === 'income' ? 'text-[#00a86b] dark:text-[#00df89]' : 'text-rose-500'}`}>
                    {entry.type === 'income' ? '+' : '-'}৳ {entry.amount.toLocaleString()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      {/* LOG ENTRY MODAL */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs font-sans">
          <div className="w-full max-w-md bg-white dark:bg-[#121215] rounded-2xl border border-slate-200 dark:border-zinc-800 shadow-2xl p-6 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-zinc-800/80">
              <h3 className="font-medium text-base text-slate-900 dark:text-white">
                Log Accounting Transaction
              </h3>
              <button onClick={() => setIsModalOpen(false)} className="w-7 h-7 rounded-lg bg-slate-100 dark:bg-zinc-800 text-slate-500 hover:text-slate-900 dark:hover:text-white flex items-center justify-center">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleAddSubmit} className="space-y-3.5 text-xs font-normal">
              <div>
                <label className="block font-medium text-slate-700 dark:text-zinc-300 mb-1">Transaction Type</label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setNewEntry({ ...newEntry, type: 'income', category: 'Membership Pass' })}
                    className={`py-2 rounded-xl text-xs font-medium border ${
                      newEntry.type === 'income'
                        ? 'bg-emerald-500/10 border-emerald-500 text-emerald-600 dark:text-[#00df89]'
                        : 'border-slate-200 dark:border-zinc-800 text-slate-500'
                    }`}
                  >
                    + Revenue (Income)
                  </button>
                  <button
                    type="button"
                    onClick={() => setNewEntry({ ...newEntry, type: 'expense', category: 'Facility Rent' })}
                    className={`py-2 rounded-xl text-xs font-medium border ${
                      newEntry.type === 'expense'
                        ? 'bg-rose-500/10 border-rose-500 text-rose-500'
                        : 'border-slate-200 dark:border-zinc-800 text-slate-500'
                    }`}
                  >
                    - Expense (Outflow)
                  </button>
                </div>
              </div>

              <div>
                <label className="block font-medium text-slate-700 dark:text-zinc-300 mb-1">Title / Note</label>
                <Input
                  type="text"
                  required
                  placeholder="e.g. 6-Month Pass Payment or AC Maintenance"
                  value={newEntry.title}
                  onChange={(e) => setNewEntry({ ...newEntry, title: e.target.value })}
                  className="dark:bg-[#09090b]"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-medium text-slate-700 dark:text-zinc-300 mb-1">Amount (৳)</label>
                  <Input
                    type="number"
                    required
                    placeholder="3000"
                    value={newEntry.amount}
                    onChange={(e) => setNewEntry({ ...newEntry, amount: e.target.value })}
                    className="dark:bg-[#09090b]"
                  />
                </div>

                <div>
                  <label className="block font-medium text-slate-700 dark:text-zinc-300 mb-1">Method</label>
                  <select
                    value={newEntry.method}
                    onChange={(e) => setNewEntry({ ...newEntry, method: e.target.value })}
                    className="w-full h-10 rounded-xl border border-slate-200 dark:border-zinc-800 bg-white dark:bg-[#09090b] px-3 text-xs font-normal text-slate-900 dark:text-white"
                  >
                    <option value="bKash">bKash</option>
                    <option value="Cash">Cash</option>
                    <option value="Card">Card</option>
                    <option value="Nagad">Nagad</option>
                    <option value="Bank Transfer">Bank Transfer</option>
                  </select>
                </div>
              </div>

              <div className="pt-3 flex justify-end gap-2">
                <Button type="button" variant="outline" onClick={() => setIsModalOpen(false)} className="dark:bg-[#09090b]">
                  Cancel
                </Button>
                <Button type="submit" variant="default" className="bg-[#00df89] hover:bg-[#00c97b] text-[#011812] font-medium">
                  Save Entry
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
