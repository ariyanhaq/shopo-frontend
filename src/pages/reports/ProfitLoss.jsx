/**
 * @file ProfitLoss.jsx
 * @description Comprehensive, clean Accounting & Profit/Loss financial management page for Shopo.
 */
import { useState, useMemo } from 'react';
import { useLanguage } from '@/context/LanguageContext';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import {
  Wallet, DollarSign, TrendingUp, TrendingDown, Plus, Download,
  Calendar, FileSpreadsheet, PieChart, ArrowUpRight, ArrowDownRight,
  CheckCircle2, Clock, X, Receipt, Building, Users, CreditCard
} from 'lucide-react';

export default function ProfitLoss() {
  const { lang, t } = useLanguage();

  const [dateFilter, setDateFilter] = useState('month');
  const [isExpenseModalOpen, setIsExpenseModalOpen] = useState(false);

  // New Expense Form State
  const [newExpense, setNewExpense] = useState({
    title: '',
    category: 'Rent & Utilities',
    amount: '',
    method: 'Cash',
    date: new Date().toISOString().split('T')[0],
    note: ''
  });

  // Financial Summary Numbers
  const financialData = {
    grossRevenue: 1845000,
    cogs: 1220000,
    operatingExpenses: 145000,
    netProfit: 480000,
    profitMargin: '26.0%'
  };

  // Revenue Streams
  const revenueStreams = [
    { title: lang === 'bn' ? 'কাউন্টার পিওএস বিক্রি' : 'Retail Counter POS Sales', amount: 1250000, percentage: 67.7 },
    { title: lang === 'bn' ? 'অনলাইন ও হোয়াটসঅ্যাপ অর্ডার' : 'Online & WhatsApp Sales', amount: 380000, percentage: 20.6 },
    { title: lang === 'bn' ? 'পাইকারি ওয়াটার সাপ্লাই' : 'Wholesale Supply Sales', amount: 215000, percentage: 11.7 }
  ];

  // Operating Expenses Breakdown
  const expenseBreakdown = [
    { title: lang === 'bn' ? 'দোকান ভাড়া ও বিদ্যুৎ বিল' : 'Shop Rent & Utilities', amount: 65000, percentage: 44.8 },
    { title: lang === 'bn' ? 'কর্মচারীদের বেতন ও বোনাস' : 'Staff Salaries & Wages', amount: 55000, percentage: 37.9 },
    { title: lang === 'bn' ? 'প্যাকেজিং ও ডেলিভারি খরচ' : 'Packaging & Delivery', amount: 15000, percentage: 10.3 },
    { title: lang === 'bn' ? 'ব্যাংক চার্জ ও অন্যান্য' : 'Bank Charges & Misc', amount: 10000, percentage: 7.0 }
  ];

  // Ledger Cashbook Entries
  const [cashbookEntries, setCashbookEntries] = useState([
    { id: 'TX-901', type: 'expense', category: 'Rent & Utilities', title: 'Monthly Shop Rent (Dhanmondi)', amount: 45000, method: 'Bank Transfer', date: '2026-08-01' },
    { id: 'TX-902', type: 'income', category: 'POS Sales', title: 'Daily Counter POS Sales Collection', amount: 48250, method: 'Cash & bKash', date: '2026-08-03' },
    { id: 'TX-903', type: 'expense', category: 'Salaries', title: 'Staff Weekly Salary (Suhag & Rahim)', amount: 12000, method: 'Cash', date: '2026-08-02' },
    { id: 'TX-904', type: 'expense', category: 'Utilities', title: 'DESCO Electricity Bill', amount: 8400, method: 'bKash', date: '2026-08-01' }
  ]);

  const handleAddExpenseSubmit = (e) => {
    e.preventDefault();
    if (!newExpense.title || !newExpense.amount) return;

    const created = {
      id: `TX-${900 + cashbookEntries.length + 1}`,
      type: 'expense',
      category: newExpense.category,
      title: newExpense.title,
      amount: Number(newExpense.amount) || 0,
      method: newExpense.method,
      date: newExpense.date
    };

    setCashbookEntries([created, ...cashbookEntries]);
    setIsExpenseModalOpen(false);
    setNewExpense({ title: '', category: 'Rent & Utilities', amount: '', method: 'Cash', date: new Date().toISOString().split('T')[0], note: '' });
  };

  return (
    <div className="space-y-6 font-sans">
      
      {/* HEADER SECTION */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-medium text-slate-900 dark:text-white tracking-tight">
            {lang === 'bn' ? 'হিসাব ও লাভ-লোকসান স্টেটমেন্ট' : 'Accounting & Profit & Loss'}
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-zinc-400 font-normal mt-0.5">
            {lang === 'bn'
              ? 'আপনার দোকানের মোট আয়, বিক্রয় খরচ, পরিচালন খরচ ও নিখুঁত লাভ-লোকসানের হিসাব রাখুন।'
              : 'Track gross revenue, cost of goods sold, operating expenses & net profit margin.'}
          </p>
        </div>

        <div className="flex items-center gap-2">
          {/* Time Filter Pills */}
          <div className="bg-slate-100 dark:bg-[#121215] p-1 rounded-xl flex items-center gap-1 border border-slate-200/80 dark:border-zinc-800/80">
            {[
              { id: 'month', label: lang === 'bn' ? 'এই মাস' : 'This Month' },
              { id: 'quarter', label: lang === 'bn' ? 'ত্রৈমাসিক' : 'Quarter' },
              { id: 'year', label: lang === 'bn' ? 'বার্ষিক' : 'Year' }
            ].map(tf => (
              <button
                key={tf.id}
                onClick={() => setDateFilter(tf.id)}
                className={`px-2.5 py-1 rounded-lg text-xs font-medium transition-colors cursor-pointer ${
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
            variant="default"
            size="sm"
            onClick={() => setIsExpenseModalOpen(true)}
            className="gap-1.5 bg-[#00df89] hover:bg-[#00c97b] text-[#011812] font-medium"
          >
            <Plus className="w-4 h-4 stroke-[2]" />
            <span>{lang === 'bn' ? 'নতুন খরচ' : 'Add Expense'}</span>
          </Button>
        </div>
      </div>

      {/* FINANCIAL SUMMARY KPI CARDS (4 COLUMNS) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Gross Revenue */}
        <Card className="p-5 border border-slate-200/90 dark:border-zinc-800/80 dark:bg-[#121215]">
          <div className="flex items-center justify-between">
            <span className="text-xs sm:text-sm font-medium text-slate-500 dark:text-zinc-400">
              {lang === 'bn' ? 'মোট মোট বিক্রি আয়' : 'Gross Revenue'}
            </span>
            <div className="w-8 h-8 rounded-lg bg-emerald-500/10 text-[#00a86b] dark:text-[#00df89] flex items-center justify-center">
              <DollarSign className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 space-y-1">
            <div className="text-2xl font-medium text-slate-900 dark:text-white">
              ৳ {financialData.grossRevenue.toLocaleString()}
            </div>
            <div className="text-xs text-[#00a86b] dark:text-[#00df89] font-medium flex items-center gap-1">
              <ArrowUpRight className="w-3.5 h-3.5" />
              <span>+14.2% {lang === 'bn' ? 'গত মাস থেকে' : 'vs last month'}</span>
            </div>
          </div>
        </Card>

        {/* Cost of Goods Sold */}
        <Card className="p-5 border border-slate-200/90 dark:border-zinc-800/80 dark:bg-[#121215]">
          <div className="flex items-center justify-between">
            <span className="text-xs sm:text-sm font-medium text-slate-500 dark:text-zinc-400">
              {lang === 'bn' ? 'পণ্য ক্রয়ের খরচ (COGS)' : 'Cost of Goods (COGS)'}
            </span>
            <div className="w-8 h-8 rounded-lg bg-blue-500/10 text-blue-600 dark:text-blue-400 flex items-center justify-center">
              <Receipt className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 space-y-1">
            <div className="text-2xl font-medium text-slate-900 dark:text-white">
              ৳ {financialData.cogs.toLocaleString()}
            </div>
            <div className="text-xs text-slate-500 dark:text-zinc-400 font-normal">
              66.1% {lang === 'bn' ? 'আয়ের অংশ' : 'of gross revenue'}
            </div>
          </div>
        </Card>

        {/* Operating Expenses */}
        <Card className="p-5 border border-slate-200/90 dark:border-zinc-800/80 dark:bg-[#121215]">
          <div className="flex items-center justify-between">
            <span className="text-xs sm:text-sm font-medium text-slate-500 dark:text-zinc-400">
              {lang === 'bn' ? 'পরিচালন ও দোকান খরচ' : 'Operating Expenses'}
            </span>
            <div className="w-8 h-8 rounded-lg bg-rose-500/10 text-rose-600 dark:text-rose-400 flex items-center justify-center">
              <ArrowDownRight className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 space-y-1">
            <div className="text-2xl font-medium text-slate-900 dark:text-white">
              ৳ {financialData.operatingExpenses.toLocaleString()}
            </div>
            <div className="text-xs text-rose-500 font-medium">
              -3.2% {lang === 'bn' ? 'কম খরচ' : 'savings achieved'}
            </div>
          </div>
        </Card>

        {/* Net Profit */}
        <Card className="p-5 border border-slate-200/90 dark:border-zinc-800/80 dark:bg-[#121215]">
          <div className="flex items-center justify-between">
            <span className="text-xs sm:text-sm font-medium text-slate-500 dark:text-zinc-400">
              {lang === 'bn' ? 'নিট লাভ (Net Profit)' : 'Net Profit'}
            </span>
            <div className="w-8 h-8 rounded-lg bg-[#00df89]/20 text-[#00a86b] dark:text-[#00df89] flex items-center justify-center">
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 space-y-1">
            <div className="text-2xl font-medium text-slate-900 dark:text-white">
              ৳ {financialData.netProfit.toLocaleString()}
            </div>
            <div className="text-xs text-[#00a86b] dark:text-[#00df89] font-medium">
              {financialData.profitMargin} {lang === 'bn' ? 'নিট প্রফিট মার্জিন' : 'profit margin'}
            </div>
          </div>
        </Card>
      </div>

      {/* REVENUE BREAKDOWN VS EXPENSE BREAKDOWN (2 COLUMNS) */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Revenue Streams Card */}
        <Card className="p-6 space-y-4 border border-slate-200/90 dark:border-zinc-800/80 dark:bg-[#121215]">
          <div>
            <CardTitle className="text-base sm:text-lg font-medium">
              {lang === 'bn' ? 'বিক্রয় ও আয়ের উৎসসমূহ' : 'Revenue Streams Breakdown'}
            </CardTitle>
            <CardDescription className="text-xs sm:text-sm font-normal">
              {lang === 'bn' ? 'বিভিন্ন মাধ্যমে সম্পন্ন বিক্রয়ের ভাগ' : 'Sales channels contribution to total income'}
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
            <CardTitle className="text-base sm:text-lg font-medium">
              {lang === 'bn' ? 'দোকানের খরচের বিবরণ' : 'Operating Expense Categories'}
            </CardTitle>
            <CardDescription className="text-xs sm:text-sm font-normal">
              {lang === 'bn' ? 'ভাড়া, বিদ্যুৎ ও কর্মচারীদের বেতন' : 'Monthly utility, rent, and staff salary logs'}
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

      {/* CASHBOOK LEDGER TABLE */}
      <Card className="border border-slate-200/90 dark:border-zinc-800/80 dark:bg-[#121215] overflow-hidden">
        <div className="p-4 sm:p-5 border-b border-slate-100 dark:border-zinc-800/80 flex items-center justify-between">
          <div>
            <CardTitle className="text-base sm:text-lg font-medium">
              {lang === 'bn' ? 'ক্যাশ বুক ও লেনদেনের রেজিস্টার' : 'Cashbook & Expense Ledger'}
            </CardTitle>
            <CardDescription className="text-xs sm:text-sm font-normal">
              {lang === 'bn' ? 'সকল ইনকাম ও আউটগোয়িং খরচের তালিকা' : 'Recent income collections and shop expense entries'}
            </CardDescription>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs sm:text-sm">
            <thead>
              <tr className="border-b border-slate-200/80 dark:border-zinc-800/80 bg-slate-50/50 dark:bg-zinc-900/50 text-slate-500 dark:text-zinc-400 font-medium">
                <th className="p-4">{lang === 'bn' ? 'আইডি ও তারিখ' : 'Entry ID & Date'}</th>
                <th className="p-4">{lang === 'bn' ? 'বিবরণ' : 'Description'}</th>
                <th className="p-4">{lang === 'bn' ? 'ক্যাটাগরি' : 'Category'}</th>
                <th className="p-4">{lang === 'bn' ? 'মাধ্যম' : 'Payment Method'}</th>
                <th className="p-4 text-right">{lang === 'bn' ? 'টাকার পরিমাণ' : 'Amount'}</th>
              </tr>
            </thead>

            <tbody className="divide-y divide-slate-100 dark:divide-zinc-800/60">
              {cashbookEntries.map((entry) => (
                <tr key={entry.id} className="hover:bg-slate-50/60 dark:hover:bg-zinc-800/40 transition-colors">
                  <td className="p-4">
                    <div className="font-medium text-slate-900 dark:text-white">{entry.id}</div>
                    <div className="text-[11px] text-slate-400 font-normal">{entry.date}</div>
                  </td>
                  <td className="p-4 font-medium text-slate-800 dark:text-zinc-200">
                    {entry.title}
                  </td>
                  <td className="p-4 text-slate-600 dark:text-zinc-400 font-normal">
                    {entry.category}
                  </td>
                  <td className="p-4 text-slate-600 dark:text-zinc-400 font-normal">
                    {entry.method}
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

      {/* ADD EXPENSE MODAL */}
      {isExpenseModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs">
          <div className="w-full max-w-md bg-white dark:bg-[#121215] rounded-2xl border border-slate-200 dark:border-zinc-800 shadow-2xl p-6 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-zinc-800/80">
              <h3 className="font-medium text-base text-slate-900 dark:text-white">
                {lang === 'bn' ? 'নতুন খরচ প্রবেশ করুন' : 'Record Business Expense'}
              </h3>
              <button
                onClick={() => setIsExpenseModalOpen(false)}
                className="w-7 h-7 rounded-lg bg-slate-100 dark:bg-zinc-800 text-slate-500 hover:text-slate-900 dark:hover:text-white flex items-center justify-center"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleAddExpenseSubmit} className="space-y-3.5">
              <div className="space-y-1.5">
                <label className="block text-xs font-medium text-slate-700 dark:text-zinc-300">
                  {lang === 'bn' ? 'খরচের বিবরণ' : 'Expense Title'}
                </label>
                <Input
                  type="text"
                  required
                  placeholder="e.g. Shop Electricity Bill"
                  value={newExpense.title}
                  onChange={(e) => setNewExpense({ ...newExpense, title: e.target.value })}
                  className="dark:bg-[#09090b]"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <label className="block text-xs font-medium text-slate-700 dark:text-zinc-300">
                    {lang === 'bn' ? 'ক্যাটাগরি' : 'Category'}
                  </label>
                  <select
                    value={newExpense.category}
                    onChange={(e) => setNewExpense({ ...newExpense, category: e.target.value })}
                    className="w-full h-10 rounded-xl border border-slate-200 dark:border-zinc-800 bg-white dark:bg-[#09090b] px-3 text-xs font-normal text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#00df89]"
                  >
                    <option value="Rent & Utilities">Rent & Utilities</option>
                    <option value="Salaries">Staff Salaries</option>
                    <option value="Packaging">Packaging & Delivery</option>
                    <option value="Marketing">Marketing & Promo</option>
                    <option value="Misc">Miscellaneous</option>
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label className="block text-xs font-medium text-slate-700 dark:text-zinc-300">
                    {lang === 'bn' ? 'টাকার পরিমাণ (৳)' : 'Amount (৳)'}
                  </label>
                  <Input
                    type="number"
                    required
                    placeholder="5000"
                    value={newExpense.amount}
                    onChange={(e) => setNewExpense({ ...newExpense, amount: e.target.value })}
                    className="dark:bg-[#09090b]"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <label className="block text-xs font-medium text-slate-700 dark:text-zinc-300">
                    {lang === 'bn' ? 'পেমেন্ট মাধ্যম' : 'Payment Method'}
                  </label>
                  <select
                    value={newExpense.method}
                    onChange={(e) => setNewExpense({ ...newExpense, method: e.target.value })}
                    className="w-full h-10 rounded-xl border border-slate-200 dark:border-zinc-800 bg-white dark:bg-[#09090b] px-3 text-xs font-normal text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#00df89]"
                  >
                    <option value="Cash">Cash</option>
                    <option value="bKash">bKash</option>
                    <option value="Nagad">Nagad</option>
                    <option value="Bank Transfer">Bank Transfer</option>
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label className="block text-xs font-medium text-slate-700 dark:text-zinc-300">
                    {lang === 'bn' ? 'তারিখ' : 'Date'}
                  </label>
                  <Input
                    type="date"
                    value={newExpense.date}
                    onChange={(e) => setNewExpense({ ...newExpense, date: e.target.value })}
                    className="dark:bg-[#09090b]"
                  />
                </div>
              </div>

              <div className="pt-3 flex justify-end gap-2">
                <Button type="button" variant="outline" onClick={() => setIsExpenseModalOpen(false)} className="dark:bg-[#09090b]">
                  Cancel
                </Button>
                <Button type="submit" variant="default" className="bg-[#00df89] hover:bg-[#00c97b] text-[#011812] font-medium">
                  Save Expense
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
