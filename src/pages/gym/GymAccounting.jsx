/**
 * @file GymAccounting.jsx
 * @description Live Gym Accounting, Profit & Loss Statement, Cash Flow Ledger & Revenue/Expense analytics computed directly from MongoDB.
 */
import { useState, useEffect } from 'react';
import { useLanguage } from '@/context/LanguageContext';
import api from '@/services/api';
import { Card, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectTrigger,
  SelectContent,
  SelectItem,
  SelectValue
} from '@/components/ui/select';
import { DatePicker } from '@/components/ui/calendar';
import {
  Wallet, DollarSign, TrendingUp, TrendingDown, Plus, Download,
  Calendar, FileSpreadsheet, ArrowUpRight, ArrowDownRight,
  CheckCircle2, Receipt, Dumbbell, ShoppingCart, UserCheck, X, Loader2
} from 'lucide-react';

import RecordExpenseModal from '@/components/gym/RecordExpenseModal';

const MONTHS = [
  { value: '0', labelEn: 'January', labelBn: 'জানুয়ারি' },
  { value: '1', labelEn: 'February', labelBn: 'ফেব্রুয়ারি' },
  { value: '2', labelEn: 'March', labelBn: 'মার্চ' },
  { value: '3', labelEn: 'April', labelBn: 'এপ্রিল' },
  { value: '4', labelEn: 'May', labelBn: 'মে' },
  { value: '5', labelEn: 'June', labelBn: 'জুন' },
  { value: '6', labelEn: 'July', labelBn: 'জুলাই' },
  { value: '7', labelEn: 'August', labelBn: 'আগস্ট' },
  { value: '8', labelEn: 'September', labelBn: 'সেপ্টেম্বর' },
  { value: '9', labelEn: 'October', labelBn: 'অক্টোবর' },
  { value: '10', labelEn: 'November', labelBn: 'নভেম্বর' },
  { value: '11', labelEn: 'December', labelBn: 'ডিসেম্বর' },
];

export default function GymAccounting() {
  const { lang } = useLanguage();

  const currentYear = new Date().getFullYear();
  const [dateFilter, setDateFilter] = useState('month');
  const [selectedMonth, setSelectedMonth] = useState('all');
  const [selectedYear, setSelectedYear] = useState(String(currentYear));
  const [specificDate, setSpecificDate] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [payments, setPayments] = useState([]);
  const [expenses, setExpenses] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchAccountingData = async () => {
    try {
      const [payRes, expRes] = await Promise.all([
        api.gym.payments.list(),
        api.expenses.list(),
      ]);
      if (payRes.data) setPayments(payRes.data);
      if (expRes.data) setExpenses(expRes.data);
    } catch (err) {
      console.warn('Failed to load gym accounting records:', err.message);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchAccountingData();
  }, []);

  // Filter payments and expenses by selected month / specific date
  const filteredPayments = payments.filter((p) => {
    const d = new Date(p.date || p.created_at);
    if (specificDate) {
      const target = new Date(specificDate);
      return d.toISOString().split('T')[0] === target.toISOString().split('T')[0];
    }
    if (selectedMonth === 'all') return true;
    return d.getMonth() === parseInt(selectedMonth, 10) && d.getFullYear() === parseInt(selectedYear, 10);
  });

  const filteredExpenses = expenses.filter((e) => {
    const d = new Date(e.date);
    if (specificDate) {
      const target = new Date(specificDate);
      return d.toISOString().split('T')[0] === target.toISOString().split('T')[0];
    }
    if (selectedMonth === 'all') return true;
    return d.getMonth() === parseInt(selectedMonth, 10) && d.getFullYear() === parseInt(selectedYear, 10);
  });

  // Aggregate financials
  const grossRevenue = filteredPayments.reduce((acc, p) => acc + (p.paid || 0), 0);
  const operatingExpenses = filteredExpenses.reduce((acc, e) => acc + (e.amount || 0), 0);
  const netProfit = grossRevenue - operatingExpenses;
  const profitMargin = grossRevenue > 0 ? ((netProfit / grossRevenue) * 100).toFixed(1) + '%' : '0.0%';

  // Build combined ledger
  const ledgerEntries = [
    ...filteredPayments.map(p => ({
      id: p.invoiceNumber,
      type: 'income',
      category: p.package_name || 'Membership Pass',
      title: `${p.memberName} — ${p.package_name}`,
      amount: p.paid,
      method: p.method,
      date: p.date,
      rawDate: new Date(p.date || p.created_at),
    })),
    ...filteredExpenses.map(e => ({
      id: `EXP-${e._id.toString().slice(-4).toUpperCase()}`,
      type: 'expense',
      category: e.category,
      title: e.title,
      amount: e.amount,
      method: 'Cash',
      date: new Date(e.date).toISOString().split('T')[0],
      rawDate: new Date(e.date),
    }))
  ].sort((a, b) => b.rawDate - a.rawDate);

  return (
    <div className="space-y-6 font-sans">
      
      {/* HEADER */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-medium text-slate-900 dark:text-white flex items-center gap-2.5">
            <Wallet className="w-6 h-6 text-[#00df89]" />
            <span>{lang === 'bn' ? 'হিসাব ও লাভ-ক্ষতির খতিয়ান' : 'Gym Accounting & Profit / Loss'}</span>
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-zinc-400">
            {lang === 'bn' ? 'আয়, ব্যয়, ক্যাশ ফ্লো লেজার ও নিট মুনাফা বিশ্লেষণ' : 'Real-time subscription collections, facility overheads & cash flow'}
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            onClick={() => setIsModalOpen(true)}
            className="bg-[#00df89] hover:bg-[#00c97b] text-[#011812] font-medium text-xs gap-1.5 shadow-xs"
          >
            <Plus className="w-4 h-4 stroke-[2]" />
            <span>{lang === 'bn' ? 'খরচ এন্ট্রি' : 'Log Expense'}</span>
          </Button>
        </div>
      </div>

      {/* ---------------------------------------------------- */}
      {/* TIME PERIOD & PRECISION FILTER TOOLBAR               */}
      {/* ---------------------------------------------------- */}
      <Card className="p-3 border-slate-200/90 dark:border-zinc-800/80 dark:bg-[#121215] shadow-xs">
        <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-3">
          <div className="flex items-center gap-2 flex-wrap">
            <div className="inline-flex items-center p-1 bg-slate-100 dark:bg-zinc-900/90 rounded-xl border border-slate-200/80 dark:border-zinc-800/80 gap-1 flex-wrap">
              {[
                { id: 'today', labelEn: 'Today', labelBn: 'আজ' },
                { id: 'week', labelEn: 'This Week', labelBn: 'এই সপ্তাহ' },
                { id: 'month', labelEn: 'This Month', labelBn: 'চলতি মাস' },
                { id: 'year', labelEn: 'This Year', labelBn: 'চলতি বছর' },
                { id: 'all', labelEn: 'All Time', labelBn: 'সর্বমোট' },
              ].map((p) => {
                const isBtnActive = dateFilter === p.id && selectedMonth === 'all' && !specificDate;
                return (
                  <button
                    key={p.id}
                    onClick={() => {
                      setDateFilter(p.id);
                      setSelectedMonth('all');
                      setSpecificDate('');
                    }}
                    className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                      isBtnActive
                        ? 'bg-white dark:bg-zinc-800 text-slate-900 dark:text-white shadow-xs font-bold'
                        : 'text-slate-600 dark:text-zinc-400 hover:text-slate-900 dark:hover:text-white'
                    }`}
                  >
                    {lang === 'bn' ? p.labelBn : p.labelEn}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Specific 12-Month & Year Dropdown + Date Picker */}
          <div className="flex items-center gap-2 flex-wrap sm:flex-nowrap">
            <Select
              value={selectedMonth}
              onValueChange={(val) => {
                setSelectedMonth(val);
                setSpecificDate('');
              }}
              className="w-36 sm:w-44 shrink-0"
            >
              <SelectTrigger size="sm" className={`h-9 text-xs rounded-xl ${selectedMonth !== 'all' && !specificDate ? 'border-[#00df89] ring-1 ring-[#00df89] bg-[#00df89]/5' : ''}`}>
                <SelectValue placeholder={lang === 'bn' ? 'সকল মাস' : 'All Months'}>
                  {selectedMonth === 'all'
                    ? (lang === 'bn' ? 'সকল মাস' : 'All Months')
                    : (MONTHS.find(m => m.value === selectedMonth)?.[lang === 'bn' ? 'labelBn' : 'labelEn'] || 'Select Month')}
                </SelectValue>
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">
                  {lang === 'bn' ? '📅 সকল মাস (All Months)' : '📅 All Months'}
                </SelectItem>
                {MONTHS.map((m) => (
                  <SelectItem key={m.value} value={m.value}>
                    {lang === 'bn' ? `${m.labelBn} (${m.labelEn})` : m.labelEn}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select
              value={selectedYear}
              onValueChange={(val) => {
                setSelectedYear(val);
                setSpecificDate('');
              }}
              className="w-22 sm:w-24 shrink-0"
            >
              <SelectTrigger size="sm" className="h-9 text-xs rounded-xl">
                <SelectValue placeholder="Year">{selectedYear}</SelectValue>
              </SelectTrigger>
              <SelectContent>
                {[currentYear, currentYear - 1, currentYear - 2].map((y) => (
                  <SelectItem key={y} value={String(y)}>
                    {y}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <div className="hidden sm:block h-5 w-px bg-slate-200 dark:border-zinc-800" />

            {/* Shadcn Popover Date Picker */}
            <DatePicker
              value={specificDate}
              onChange={(val) => {
                setSpecificDate(val);
                if (val) {
                  setSelectedMonth('all');
                }
              }}
              placeholder={lang === 'bn' ? 'নির্দিষ্ট তারিখ' : 'Pick a date'}
              align="right"
              className={`h-9 text-xs shrink-0 ${specificDate ? 'border-[#00df89] ring-1 ring-[#00df89] bg-[#00df89]/5' : ''}`}
            />
          </div>
        </div>
      </Card>

      {/* KPI METRICS */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="p-5 border-slate-200/90 dark:border-zinc-800/80 dark:bg-[#121215] space-y-1">
          <div className="text-xs text-slate-500 dark:text-zinc-400">Total Fee Collections</div>
          <div className="text-2xl font-medium text-slate-900 dark:text-white">৳ {grossRevenue.toLocaleString()}</div>
          <div className="text-[11px] text-[#00a86b] dark:text-[#00df89] font-medium">Income Streams</div>
        </Card>

        <Card className="p-5 border-slate-200/90 dark:border-zinc-800/80 dark:bg-[#121215] space-y-1">
          <div className="text-xs text-slate-500 dark:text-zinc-400">Operating Expenses</div>
          <div className="text-2xl font-medium text-rose-500">৳ {operatingExpenses.toLocaleString()}</div>
          <div className="text-[11px] text-rose-500 font-medium">Facility Outflow</div>
        </Card>

        <Card className="p-5 border-slate-200/90 dark:border-zinc-800/80 dark:bg-[#121215] space-y-1">
          <div className="text-xs text-slate-500 dark:text-zinc-400">Net Profit</div>
          <div className="text-2xl font-medium text-slate-900 dark:text-white">৳ {netProfit.toLocaleString()}</div>
          <div className="text-[11px] text-[#00a86b] dark:text-[#00df89] font-medium">Margin: {profitMargin}</div>
        </Card>

        <Card className="p-5 border-slate-200/90 dark:border-zinc-800/80 dark:bg-[#121215] space-y-1">
          <div className="text-xs text-slate-500 dark:text-zinc-400">Total Cashflow Ledger Entries</div>
          <div className="text-2xl font-medium text-slate-900 dark:text-white">{ledgerEntries.length}</div>
          <div className="text-[11px] text-slate-400 font-medium">MongoDB Records</div>
        </Card>
      </div>

      {/* COMBINED CASHBOOK LEDGER TABLE */}
      <Card className="p-6 border-slate-200/90 dark:border-zinc-800/80 dark:bg-[#121215] space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-base font-medium">
              {lang === 'bn' ? 'ক্যাশ ফ্লো ও লেনদেন খতিয়ান' : 'Cash Flow Ledger & Combined Journal'}
            </CardTitle>
            <CardDescription className="text-xs font-normal">
              {lang === 'bn' ? 'সকল আয় এবং ব্যয়ের সময়ানুক্রমিক তালিকা' : 'Chronological list of all fee receipts and operating disbursements'}
            </CardDescription>
          </div>
        </div>

        {isLoading ? (
          <div className="p-12 text-center text-slate-400">
            <Loader2 className="w-8 h-8 animate-spin mx-auto mb-2 text-[#00df89]" />
            Loading cashbook ledger...
          </div>
        ) : ledgerEntries.length === 0 ? (
          <div className="p-12 text-center space-y-3">
            <Receipt className="w-10 h-10 text-slate-300 dark:text-zinc-600 mx-auto" />
            <h3 className="text-sm font-medium text-slate-800 dark:text-zinc-200">No Journal Entries Recorded</h3>
            <p className="text-xs text-slate-500 dark:text-zinc-400">Fee collections and expense logs will automatically appear in this ledger.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left">
              <thead className="bg-slate-50 dark:bg-zinc-900/60 text-slate-500 border-b border-slate-200 dark:border-zinc-800">
                <tr>
                  <th className="p-3.5">Tx ID</th>
                  <th className="p-3.5">Type</th>
                  <th className="p-3.5">Category</th>
                  <th className="p-3.5">Particulars / Details</th>
                  <th className="p-3.5">Date</th>
                  <th className="p-3.5">Method</th>
                  <th className="p-3.5 text-right">Amount (৳)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-zinc-800/80">
                {ledgerEntries.map((tx, idx) => (
                  <tr key={idx} className="hover:bg-slate-50 dark:hover:bg-zinc-900/40">
                    <td className="p-3.5 font-medium text-slate-900 dark:text-white">{tx.id}</td>
                    <td className="p-3.5">
                      <Badge
                        variant={tx.type === 'income' ? 'default' : 'destructive'}
                        className="text-[10px] uppercase font-normal"
                      >
                        {tx.type}
                      </Badge>
                    </td>
                    <td className="p-3.5 text-slate-600 dark:text-zinc-400">{tx.category}</td>
                    <td className="p-3.5 font-medium text-slate-800 dark:text-zinc-200">{tx.title}</td>
                    <td className="p-3.5 text-slate-500">{tx.date}</td>
                    <td className="p-3.5 text-slate-500">{tx.method}</td>
                    <td className={`p-3.5 text-right font-medium ${tx.type === 'income' ? 'text-[#00a86b] dark:text-[#00df89]' : 'text-rose-500'}`}>
                      {tx.type === 'income' ? '+' : '-'}৳ {(tx.amount || 0).toLocaleString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      <RecordExpenseModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onRecordExpense={fetchAccountingData}
      />

    </div>
  );
}
