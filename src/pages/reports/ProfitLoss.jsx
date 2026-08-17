/**
 * @file ProfitLoss.jsx
 * @description Comprehensive Real-Time Accounting, Finance, Cashbook Ledger & Profit/Loss Management for Shopo with Dynamic Expense Categories.
 */
import { useState, useEffect, useMemo } from 'react';
import { useLanguage } from '@/context/LanguageContext';
import { useAuth } from '@/context/AuthContext';
import api from '@/services/api';
import toast from 'react-hot-toast';
import { Card, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Select,
  SelectTrigger,
  SelectContent,
  SelectItem,
  SelectValue
} from '@/components/ui/select';
import { DatePicker } from '@/components/ui/calendar';
import ConfirmDialog from '@/components/common/ConfirmDialog';
import {
  Wallet, DollarSign, TrendingUp, TrendingDown, Plus, Download,
  Calendar, FileSpreadsheet, PieChart, ArrowUpRight, ArrowDownRight,
  CheckCircle2, Clock, X, Receipt, Building, Users, CreditCard, Loader2,
  Search, Filter, Edit2, Trash2, Printer, Sparkles, AlertTriangle, ArrowUpDown,
  FolderPlus, Check
} from 'lucide-react';

const DEFAULT_EXPENSE_CATEGORIES = [
  'Rent & Shop Space',
  'Electricity & Utilities',
  'Staff Salaries & Payroll',
  'Inventory Purchases',
  'Logistics & Delivery',
  'Marketing & Advertising',
  'Equipment & Maintenance',
  'Taxes & Trade License',
  'Tea & Refreshments',
  'Miscellaneous / General'
];

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

export default function ProfitLoss() {
  const { lang, t } = useLanguage();
  const { mongoShop } = useAuth();

  const currentYear = new Date().getFullYear();
  const [dateFilter, setDateFilter] = useState('month');
  const [selectedMonth, setSelectedMonth] = useState('all');
  const [selectedYear, setSelectedYear] = useState(String(currentYear));
  const [specificDate, setSpecificDate] = useState('');
  const [transactionTypeFilter, setTransactionTypeFilter] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [statement, setStatement] = useState(null);

  // Custom Categories State
  const [customCategories, setCustomCategories] = useState(() => {
    try {
      const saved = localStorage.getItem('shopo_custom_expense_categories');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  // Inline Category Creator States
  const [isAddingNewCatInAddModal, setIsAddingNewCatInAddModal] = useState(false);
  const [newCatNameInAddModal, setNewCatNameInAddModal] = useState('');

  const [isAddingNewCatInEditModal, setIsAddingNewCatInEditModal] = useState(false);
  const [newCatNameInEditModal, setNewCatNameInEditModal] = useState('');

  // Add Expense Modal State
  const [isAddExpenseModalOpen, setIsAddExpenseModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [newExpense, setNewExpense] = useState({
    title: '',
    category: 'Electricity & Utilities',
    amount: '',
    method: 'Cash',
    date: new Date().toISOString().split('T')[0],
    description: '',
  });

  // Edit Expense Modal State
  const [isEditExpenseModalOpen, setIsEditExpenseModalOpen] = useState(false);
  const [editingExpense, setEditingExpense] = useState(null);
  const [editExpenseForm, setEditExpenseForm] = useState({
    id: '',
    title: '',
    category: 'Electricity & Utilities',
    amount: '',
    method: 'Cash',
    date: new Date().toISOString().split('T')[0],
    description: '',
  });

  // Confirm Delete Dialog State
  const [confirmDeleteDialog, setConfirmDeleteDialog] = useState({
    isOpen: false,
    id: null,
    title: '',
    amount: 0,
  });

  const fetchStatement = async () => {
    setIsLoading(true);
    try {
      const params = {};
      if (specificDate) {
        params.date = specificDate;
      } else if (selectedMonth !== 'all') {
        params.month = selectedMonth;
        params.year = selectedYear;
      } else {
        params.period = dateFilter;
      }
      const res = await api.analytics.getProfitLoss(params);
      if (res.data) {
        setStatement(res.data);
      }
    } catch (err) {
      console.warn('Failed to load P&L statement:', err.message);
      toast.error('Failed to load accounting data.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchStatement();
  }, [dateFilter, selectedMonth, selectedYear, specificDate]);

  // Combined all available categories
  const allCategories = useMemo(() => {
    const fromStatement = statement?.expenseBreakdown?.map(b => b.title) || [];
    return [...new Set([...DEFAULT_EXPENSE_CATEGORIES, ...customCategories, ...fromStatement])];
  }, [customCategories, statement]);

  // Helper to save new custom category
  const handleAddNewCategory = (catName, mode = 'add') => {
    const trimmed = catName.trim();
    if (!trimmed) {
      toast.error('Please enter a category name.');
      return;
    }

    if (!customCategories.includes(trimmed) && !DEFAULT_EXPENSE_CATEGORIES.includes(trimmed)) {
      const updated = [...customCategories, trimmed];
      setCustomCategories(updated);
      try {
        localStorage.setItem('shopo_custom_expense_categories', JSON.stringify(updated));
      } catch (err) {
        console.warn('Could not cache custom categories:', err);
      }
    }

    if (mode === 'add') {
      setNewExpense(prev => ({ ...prev, category: trimmed }));
      setIsAddingNewCatInAddModal(false);
      setNewCatNameInAddModal('');
    } else {
      setEditExpenseForm(prev => ({ ...prev, category: trimmed }));
      setIsAddingNewCatInEditModal(false);
      setNewCatNameInEditModal('');
    }

    toast.success(lang === 'bn' ? `'${trimmed}' ক্যাটাগরি যুক্ত হয়েছে!` : `Category '${trimmed}' added!`);
  };

  // Handle Add Expense
  const handleAddExpenseSubmit = async (e) => {
    e.preventDefault();
    if (!newExpense.title.trim() || !newExpense.amount) {
      toast.error('Please enter expense title and amount.');
      return;
    }

    setIsSubmitting(true);
    try {
      await api.expenses.create({
        title: newExpense.title.trim(),
        category: newExpense.category,
        amount: parseFloat(newExpense.amount) || 0,
        date: newExpense.date,
        description: `Method: ${newExpense.method}${newExpense.description ? ` | ${newExpense.description.trim()}` : ''}`,
      });

      toast.success(lang === 'bn' ? 'খরচের হিসাব সফলভাবে সংরক্ষিত হয়েছে!' : 'Expense recorded successfully!');
      setIsAddExpenseModalOpen(false);
      setNewExpense({
        title: '',
        category: newExpense.category,
        amount: '',
        method: 'Cash',
        date: new Date().toISOString().split('T')[0],
        description: '',
      });
      fetchStatement();
    } catch (err) {
      toast.error(err.message || 'Failed to record expense.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Open Edit Expense Modal
  const handleOpenEditExpense = (entry) => {
    setEditingExpense(entry);
    setEditExpenseForm({
      id: entry._id,
      title: entry.title,
      category: entry.category || 'Electricity & Utilities',
      amount: String(entry.amount),
      method: entry.method || 'Cash',
      date: entry.date || new Date().toISOString().split('T')[0],
      description: entry.description || '',
    });
    setIsAddingNewCatInEditModal(false);
    setIsEditExpenseModalOpen(true);
  };

  // Handle Submit Edit Expense
  const handleUpdateExpenseSubmit = async (e) => {
    e.preventDefault();
    if (!editExpenseForm.id || !editExpenseForm.title.trim()) return;

    setIsSubmitting(true);
    try {
      await api.expenses.update(editExpenseForm.id, {
        title: editExpenseForm.title.trim(),
        category: editExpenseForm.category,
        amount: parseFloat(editExpenseForm.amount) || 0,
        date: editExpenseForm.date,
        description: `Method: ${editExpenseForm.method}${editExpenseForm.description ? ` | ${editExpenseForm.description.trim()}` : ''}`,
      });

      toast.success(lang === 'bn' ? 'খরচের এন্ট্রি আপডেট হয়েছে!' : 'Expense entry updated successfully!');
      setIsEditExpenseModalOpen(false);
      setEditingExpense(null);
      fetchStatement();
    } catch (err) {
      toast.error(err.message || 'Failed to update expense.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Delete state
  const [isDeletingExpense, setIsDeletingExpense] = useState(false);

  // Open Delete Confirmation
  const handleDeleteExpenseRequest = (entry) => {
    setConfirmDeleteDialog({
      isOpen: true,
      id: entry._id,
      title: entry.title,
      amount: entry.amount,
    });
  };

  // Execute Delete
  const handleConfirmDeleteExpense = async () => {
    if (!confirmDeleteDialog.id) return;
    setIsDeletingExpense(true);
    try {
      await api.expenses.delete(confirmDeleteDialog.id);
      toast.success(lang === 'bn' ? 'খরচের রেকর্ড মুছে ফেলা হয়েছে!' : 'Expense entry deleted successfully!');
      setConfirmDeleteDialog({ isOpen: false, id: null, title: '', amount: 0 });
      fetchStatement();
    } catch (err) {
      toast.error(err.message || 'Failed to delete expense.');
    } finally {
      setIsDeletingExpense(false);
    }
  };

  const financialData = statement?.financialData || statement?.summary || {
    grossRevenue: 0,
    cogs: 0,
    grossProfit: 0,
    operatingExpenses: 0,
    netProfit: 0,
    profitMargin: '0.0%',
    totalSalesCount: 0,
    totalExpensesCount: 0,
  };

  const expenseBreakdown = statement?.expenseBreakdown || [];
  const cashbookEntries = statement?.cashbookEntries || [];

  // Filtered Cashbook Entries
  const filteredEntries = useMemo(() => {
    return cashbookEntries.filter((entry) => {
      const q = searchQuery.toLowerCase().trim();
      const matchesSearch =
        !q ||
        (entry.id && entry.id.toLowerCase().includes(q)) ||
        (entry.title && entry.title.toLowerCase().includes(q)) ||
        (entry.category && entry.category.toLowerCase().includes(q)) ||
        (entry.method && entry.method.toLowerCase().includes(q));

      const matchesType =
        transactionTypeFilter === 'all' ||
        (transactionTypeFilter === 'income' && entry.type === 'income') ||
        (transactionTypeFilter === 'expense' && entry.type === 'expense');

      return matchesSearch && matchesType;
    });
  }, [cashbookEntries, searchQuery, transactionTypeFilter]);

  return (
    <div className="space-y-6 font-sans pb-12">
      
      {/* ---------------------------------------------------- */}
      {/* HEADER SECTION                                       */}
      {/* ---------------------------------------------------- */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white tracking-tight flex items-center gap-2.5">
            <Wallet className="w-6 h-6 text-[#00df89]" />
            <span>{lang === 'bn' ? 'হিসাববিজ্ঞান ও লাভ-লোকসান স্টেটমেন্ট' : 'Accounting & Financial Statement'}</span>
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-zinc-400 font-normal mt-0.5">
            {lang === 'bn'
              ? 'মোট আয়, পরিচালন খরচ, কাস্টম খরচের ক্যাটাগরি ও সম্পূর্ণ ক্যাশ বুক রেজিস্টার।'
              : 'Complete financial overview with live revenue, dynamic expense categories & cashbook ledger.'}
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => window.print()}
            className="text-xs h-10 px-3.5 gap-1.5 border-slate-200 dark:border-zinc-800 font-semibold"
          >
            <Printer className="w-4 h-4 text-slate-500" />
            <span>{lang === 'bn' ? 'প্রিন্ট রিপোর্ট' : 'Print Statement'}</span>
          </Button>

          <Button
            onClick={() => {
              setIsAddingNewCatInAddModal(false);
              setIsAddExpenseModalOpen(true);
            }}
            className="gap-1.5 bg-[#00df89] hover:bg-[#00c97b] text-[#011812] font-semibold text-xs sm:text-sm h-10 px-4 shadow-xs cursor-pointer"
          >
            <Plus className="w-4 h-4 stroke-[2.5]" />
            <span>{lang === 'bn' ? 'নতুন খরচ যোগ করুন' : 'Record Expense'}</span>
          </Button>
        </div>
      </div>

      {/* ---------------------------------------------------- */}
      {/* TIME PERIOD & PRECISION FILTER TOOLBAR               */}
      {/* ---------------------------------------------------- */}
      <Card className="p-3 border-slate-200/90 dark:border-zinc-800/80 dark:bg-[#121215] shadow-xs">
        <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-3">
          
          {/* Left: Quick Period Segmented Pill Switcher */}
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

          {/* Right: Specific Month, Year & Shadcn Calendar Date Picker */}
          <div className="flex items-center gap-2 flex-wrap sm:flex-nowrap">
            
            {/* 12 Months Selector */}
            <Select
              value={selectedMonth}
              onValueChange={(val) => {
                setSelectedMonth(val);
                setSpecificDate('');
                if (val !== 'all') {
                  setDateFilter('specific_month');
                } else {
                  setDateFilter('month');
                }
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

            {/* Year Selector */}
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
                  setDateFilter('custom_date');
                } else {
                  setDateFilter('month');
                }
              }}
              placeholder={lang === 'bn' ? 'নির্দিষ্ট তারিখ' : 'Pick a date'}
              align="right"
              className={`h-9 text-xs shrink-0 ${specificDate ? 'border-[#00df89] ring-1 ring-[#00df89] bg-[#00df89]/5' : ''}`}
            />
          </div>
        </div>
      </Card>

      {/* ---------------------------------------------------- */}
      {/* FINANCIAL SUMMARY KPI CARDS (4 COLUMNS)              */}
      {/* ---------------------------------------------------- */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        
        {/* Gross Revenue */}
        <Card className="p-4 sm:p-5 border-slate-200/90 dark:border-zinc-800/80 dark:bg-[#121215]">
          <div className="flex items-center justify-between">
            <span className="text-xs sm:text-sm font-medium text-slate-500 dark:text-zinc-400">
              {lang === 'bn' ? 'মোট বিক্রয় আয়' : 'Gross Sales Revenue'}
            </span>
            <DollarSign className="w-4 h-4 text-[#00a86b] dark:text-[#00df89]" />
          </div>
          <div className="text-2xl sm:text-3xl font-bold text-[#00a86b] dark:text-[#00df89] mt-2">
            {isLoading ? <Skeleton className="h-8 w-28 my-0.5" /> : `৳ ${financialData.grossRevenue.toLocaleString()}`}
          </div>
          <div className="text-xs text-slate-500 mt-1">From invoice transactions</div>
        </Card>

        {/* Cost of Goods Sold */}
        <Card className="p-4 sm:p-5 border-slate-200/90 dark:border-zinc-800/80 dark:bg-[#121215]">
          <div className="flex items-center justify-between">
            <span className="text-xs sm:text-sm font-medium text-slate-500 dark:text-zinc-400">
              {lang === 'bn' ? 'পণ্য কেনা খরচ (COGS)' : 'Cost of Goods (COGS)'}
            </span>
            <Receipt className="w-4 h-4 text-blue-500" />
          </div>
          <div className="text-2xl sm:text-3xl font-bold text-slate-900 dark:text-white mt-2">
            {isLoading ? <Skeleton className="h-8 w-28 my-0.5" /> : `৳ ${financialData.cogs.toLocaleString()}`}
          </div>
          <div className="text-xs text-slate-500 mt-1">Direct product unit cost</div>
        </Card>

        {/* Operating Expenses */}
        <Card className="p-4 sm:p-5 border-slate-200/90 dark:border-zinc-800/80 dark:bg-[#121215]">
          <div className="flex items-center justify-between">
            <span className="text-xs sm:text-sm font-medium text-slate-500 dark:text-zinc-400">
              {lang === 'bn' ? 'পরিচালন ও দোকান খরচ' : 'Operating Expenses'}
            </span>
            <ArrowDownRight className="w-4 h-4 text-rose-500" />
          </div>
          <div className="text-2xl sm:text-3xl font-bold text-rose-500 mt-2">
            {isLoading ? <Skeleton className="h-8 w-28 my-0.5" /> : `৳ ${financialData.operatingExpenses.toLocaleString()}`}
          </div>
          <div className="text-xs text-rose-500 mt-1">Rent, bills & overheads</div>
        </Card>

        {/* Net Profit */}
        <Card className="p-4 sm:p-5 border-slate-200/90 dark:border-zinc-800/80 dark:bg-[#121215]">
          <div className="flex items-center justify-between">
            <span className="text-xs sm:text-sm font-medium text-slate-500 dark:text-zinc-400">
              {lang === 'bn' ? 'নিট লাভ / লোকসান' : 'Net Profit / Loss'}
            </span>
            {financialData.netProfit >= 0 ? (
              <TrendingUp className="w-4 h-4 text-[#00df89]" />
            ) : (
              <TrendingDown className="w-4 h-4 text-rose-500" />
            )}
          </div>
          <div className={`text-2xl sm:text-3xl font-bold mt-2 ${financialData.netProfit >= 0 ? 'text-[#00a86b] dark:text-[#00df89]' : 'text-rose-500'}`}>
            {isLoading ? <Skeleton className="h-8 w-28 my-0.5" /> : `৳ ${financialData.netProfit.toLocaleString()}`}
          </div>
          <div className="text-xs font-semibold text-slate-500 mt-1">
            {isLoading ? <Skeleton className="h-3 w-20 my-0.5" /> : `${financialData.profitMargin} Net Margin`}
          </div>
        </Card>

      </div>

      {/* ---------------------------------------------------- */}
      {/* EXPENSE CATEGORIES BREAKDOWN & SUMMARY               */}
      {/* ---------------------------------------------------- */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Expense Category Breakdown Card */}
        <Card className="p-6 space-y-4 border border-slate-200/90 dark:border-zinc-800/80 dark:bg-[#121215] lg:col-span-2">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-base font-bold text-slate-900 dark:text-white">
                {lang === 'bn' ? 'দোকানের খরচের বিভাগসমূহ' : 'Operating Expense Breakdown'}
              </CardTitle>
              <CardDescription className="text-xs font-normal">
                Category distribution of recorded expenses
              </CardDescription>
            </div>
            <Button
              size="sm"
              variant="outline"
              onClick={() => {
                setIsAddingNewCatInAddModal(false);
                setIsAddExpenseModalOpen(true);
              }}
              className="text-xs h-8 gap-1 font-semibold"
            >
              <Plus className="w-3.5 h-3.5" /> Add Expense
            </Button>
          </div>

          {isLoading ? (
            <div className="py-12 text-center text-slate-400">
              <Loader2 className="w-6 h-6 animate-spin mx-auto mb-2 text-[#00df89]" />
              Loading financial breakdown...
            </div>
          ) : expenseBreakdown.length === 0 ? (
            <div className="py-10 text-center space-y-2 border border-dashed border-slate-200 dark:border-zinc-800 rounded-xl">
              <Receipt className="w-8 h-8 text-slate-300 dark:text-zinc-600 mx-auto" />
              <p className="text-xs text-slate-400">No expenses recorded for this period.</p>
              <Button
                size="sm"
                onClick={() => {
                  setIsAddingNewCatInAddModal(false);
                  setIsAddExpenseModalOpen(true);
                }}
                className="bg-[#00df89] hover:bg-[#00c97b] text-[#011812] text-xs font-semibold"
              >
                Record First Expense
              </Button>
            </div>
          ) : (
            <div className="space-y-4 pt-1">
              {expenseBreakdown.map((item, idx) => (
                <div key={idx} className="space-y-1.5">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-semibold text-slate-800 dark:text-zinc-200">{item.title}</span>
                    <span className="font-bold text-slate-900 dark:text-white">
                      ৳ {item.amount.toLocaleString()} ({item.percentage}%)
                    </span>
                  </div>
                  <div className="w-full h-2.5 rounded-full bg-slate-100 dark:bg-zinc-800 overflow-hidden">
                    <div style={{ width: `${Math.min(100, item.percentage)}%` }} className="h-full rounded-full bg-rose-500 transition-all duration-300" />
                  </div>
                </div>
              ))}
            </div>
          )}
        </Card>

        {/* Quick Statement Card */}
        <Card className="p-6 space-y-4 border border-slate-200/90 dark:border-zinc-800/80 dark:bg-[#121215]">
          <div>
            <CardTitle className="text-base font-bold text-slate-900 dark:text-white">
              {lang === 'bn' ? 'আয় ও ব্যয়ের সামারি' : 'P&L Health Statement'}
            </CardTitle>
            <CardDescription className="text-xs font-normal">
              {lang === 'bn' ? 'চলতি সময়ের সার্বিক আর্থিক চিত্র' : 'Quick financial position summary'}
            </CardDescription>
          </div>

          <div className="space-y-3 text-xs pt-1">
            <div className="p-3 rounded-xl bg-slate-50 dark:bg-[#09090b] border border-slate-200 dark:border-zinc-800 space-y-2">
              <div className="flex justify-between text-slate-500">
                <span>{lang === 'bn' ? 'মোট ইনভয়েস সংখ্যা:' : 'Total Invoices Issued:'}</span>
                <span className="font-semibold text-slate-800 dark:text-zinc-200">{financialData.totalSalesCount || 0}</span>
              </div>
              <div className="flex justify-between text-slate-500">
                <span>{lang === 'bn' ? 'মোট খরচের এন্ট্রি:' : 'Total Expenses Logged:'}</span>
                <span className="font-semibold text-slate-800 dark:text-zinc-200">{financialData.totalExpensesCount || expenseBreakdown.length}</span>
              </div>
              <div className="flex justify-between text-slate-500 pt-1 border-t border-slate-200 dark:border-zinc-800">
                <span>{lang === 'bn' ? 'মোট লাভ (বিক্রি - ক্রয়):' : 'Gross Profit (Revenue - COGS):'}</span>
                <span className="font-bold text-slate-900 dark:text-white">৳ {(financialData.grossProfit || 0).toLocaleString()}</span>
              </div>
            </div>

            <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-[#00a86b] dark:text-[#00df89] space-y-1">
              <div className="text-[11px] font-semibold uppercase tracking-wider">{lang === 'bn' ? 'নিট ফলাফল' : 'Estimated Return'}</div>
              <div className="text-base font-bold">
                ৳ {financialData.netProfit.toLocaleString()} {lang === 'bn' ? (financialData.netProfit >= 0 ? 'নিট লাভ' : 'নিট লোকসান') : 'Net Gain'}
              </div>
              <div className="text-[11px] text-slate-500 dark:text-zinc-400">
                {lang === 'bn'
                  ? 'দোকানের সকল পরিচালন ব্যয় এবং পণ্য ক্রয় খরচ বাদ দেওয়ার পর।'
                  : 'After deducting all operating costs and product inventory purchase expenses.'}
              </div>
            </div>
          </div>
        </Card>

      </div>

      {/* ---------------------------------------------------- */}
      {/* CASHBOOK LEDGER TABLE & SEARCH                       */}
      {/* ---------------------------------------------------- */}
      <Card className="border border-slate-200/90 dark:border-zinc-800/80 dark:bg-[#121215] overflow-hidden">
        
        {/* Table Header & Controls */}
        <div className="p-4 sm:p-5 border-b border-slate-100 dark:border-zinc-800/80 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <CardTitle className="text-base font-bold text-slate-900 dark:text-white">
              {lang === 'bn' ? 'ক্যাশ বুক ও লেনদেনের খতিয়ান' : 'Cashbook & Financial Journal'}
            </CardTitle>
            <CardDescription className="text-xs font-normal">
              {lang === 'bn' ? 'আয় ও দোকান খরচের বিস্তারিত খতিয়ান তালিকা' : 'Chronological ledger of income collections and operating expenses'}
            </CardDescription>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            {/* Search */}
            <div className="relative w-48 sm:w-56">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder={lang === 'bn' ? 'খতিয়ান খুঁজুন...' : 'Search ledger...'}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-8 pr-3 py-1.5 text-xs bg-slate-50 dark:bg-[#09090b] border border-slate-200 dark:border-zinc-800 rounded-xl outline-none focus:ring-2 focus:ring-[#00df89]"
              />
            </div>

            {/* Type Filters */}
            <div className="flex bg-slate-100 dark:bg-zinc-900 p-0.5 rounded-xl text-xs">
              {[
                { id: 'all', labelEn: 'ALL', labelBn: 'সকল' },
                { id: 'income', labelEn: 'INCOME', labelBn: 'আয় (+)' },
                { id: 'expense', labelEn: 'EXPENSE', labelBn: 'ব্যয় (-)' },
              ].map((t) => (
                <button
                  key={t.id}
                  onClick={() => setTransactionTypeFilter(t.id)}
                  className={`px-2.5 py-1 rounded-lg font-semibold uppercase text-[11px] transition-all cursor-pointer ${
                    transactionTypeFilter === t.id
                      ? 'bg-white dark:bg-zinc-800 text-slate-900 dark:text-white shadow-xs'
                      : 'text-slate-500'
                  }`}
                >
                  {lang === 'bn' ? t.labelBn : t.labelEn}
                </button>
              ))}
            </div>
          </div>
        </div>

        {isLoading ? (
          <div className="p-5 space-y-3">
            {[1, 2, 3, 4, 5].map((i) => (
              <Skeleton key={i} className="h-12 w-full" />
            ))}
          </div>
        ) : filteredEntries.length === 0 ? (
          <div className="p-12 text-center text-xs text-slate-400 space-y-2">
            <Receipt className="w-8 h-8 text-slate-300 dark:text-zinc-600 mx-auto" />
            <p>{lang === 'bn' ? 'কোন লেনদেন খুঁজে পাওয়া যায়নি।' : 'No transactions matching your filter criteria.'}</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-slate-200/80 dark:border-zinc-800/80 bg-slate-50/50 dark:bg-zinc-900/50 text-slate-500 dark:text-zinc-400 font-semibold select-none">
                  <th className="p-3.5">{lang === 'bn' ? 'আইডি ও তারিখ' : 'Tx ID & Date'}</th>
                  <th className="p-3.5">{lang === 'bn' ? 'ধরণ' : 'Type'}</th>
                  <th className="p-3.5">{lang === 'bn' ? 'বিবরণ / উৎস' : 'Description / Source'}</th>
                  <th className="p-3.5">{lang === 'bn' ? 'ক্যাটাগরি' : 'Category'}</th>
                  <th className="p-3.5">{lang === 'bn' ? 'পেমেন্ট মাধ্যম' : 'Method'}</th>
                  <th className="p-3.5 text-right">{lang === 'bn' ? 'পরিমাণ (৳)' : 'Amount (৳)'}</th>
                  <th className="p-3.5 text-right">{lang === 'bn' ? 'অ্যাকশন' : 'Actions'}</th>
                </tr>
              </thead>

              <tbody className="divide-y divide-slate-100 dark:divide-zinc-800/60">
                {filteredEntries.map((entry, idx) => (
                  <tr key={idx} className="hover:bg-slate-50/60 dark:hover:bg-zinc-800/40 transition-colors">
                    
                    {/* ID & Date */}
                    <td className="p-3.5">
                      <div className="font-semibold text-slate-900 dark:text-white">{entry.id}</div>
                      <div className="text-[11px] text-slate-400 font-normal">{entry.date}</div>
                    </td>

                    {/* Type Badge */}
                    <td className="p-3.5">
                      <Badge
                        variant={entry.type === 'income' ? 'default' : 'destructive'}
                        className="text-[10px] uppercase font-semibold"
                      >
                        {entry.type === 'income' ? (lang === 'bn' ? 'আয় (+)' : 'Income (+)') : (lang === 'bn' ? 'ব্যয় (-)' : 'Expense (-)')}
                      </Badge>
                    </td>

                    {/* Description */}
                    <td className="p-3.5 font-medium text-slate-800 dark:text-zinc-200">
                      {entry.title}
                    </td>

                    {/* Category */}
                    <td className="p-3.5 text-slate-600 dark:text-zinc-400">
                      {entry.category}
                    </td>

                    {/* Payment Method */}
                    <td className="p-3.5 text-slate-600 dark:text-zinc-400">
                      <span className="capitalize">{entry.method}</span>
                    </td>

                    {/* Amount */}
                    <td className={`p-3.5 text-right font-bold ${entry.type === 'income' ? 'text-[#00a86b] dark:text-[#00df89]' : 'text-rose-500'}`}>
                      {entry.type === 'income' ? '+' : '-'} ৳ {entry.amount.toLocaleString()}
                    </td>

                    {/* Actions */}
                    <td className="p-3.5 text-right">
                      <div className="flex items-center justify-end gap-1">
                        {entry.type === 'expense' && entry._id ? (
                          <>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleOpenEditExpense(entry)}
                              className="h-7 text-xs px-2 text-slate-600 dark:text-zinc-300 hover:text-amber-500"
                              title="Edit Expense"
                            >
                              <Edit2 className="w-3.5 h-3.5" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleDeleteExpenseRequest(entry)}
                              className="h-7 text-xs px-2 text-rose-500 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40"
                              title="Delete Expense"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </Button>
                          </>
                        ) : (
                          <span className="text-[11px] text-slate-400 font-mono">Invoice</span>
                        )}
                      </div>
                    </td>

                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      {/* ---------------------------------------------------- */}
      {/* RECORD NEW EXPENSE MODAL                             */}
      {/* ---------------------------------------------------- */}
      {isAddExpenseModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs">
          <Card className="max-w-md w-full p-6 bg-white dark:bg-[#121215] border-slate-200 dark:border-zinc-800 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-zinc-800">
              <h3 className="font-bold text-base text-slate-900 dark:text-white">
                Record Business Expense
              </h3>
              <button
                onClick={() => setIsAddExpenseModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 p-1 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleAddExpenseSubmit} className="space-y-3.5 text-xs">
              <div className="space-y-1">
                <label className="block font-semibold text-slate-700 dark:text-zinc-300">
                  Expense Title / Purpose *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Shop Electricity Bill, Staff Lunch, Internet"
                  value={newExpense.title}
                  onChange={(e) => setNewExpense({ ...newExpense, title: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-[#09090b] border border-slate-200 dark:border-zinc-800 outline-none focus:ring-2 focus:ring-[#00df89]"
                />
              </div>

              {/* Category Field with Inline "+ Add New Category" Option */}
              <div className="space-y-1">
                <div className="flex items-center justify-between">
                  <label className="font-semibold text-slate-700 dark:text-zinc-300">
                    Expense Category *
                  </label>
                  {!isAddingNewCatInAddModal && (
                    <button
                      type="button"
                      onClick={() => setIsAddingNewCatInAddModal(true)}
                      className="text-[11px] font-semibold text-[#00a86b] dark:text-[#00df89] hover:underline flex items-center gap-1 cursor-pointer"
                    >
                      <Plus className="w-3 h-3" />
                      <span>{lang === 'bn' ? '+ নতুন ক্যাটাগরি যোগ করুন' : '+ Add New Category'}</span>
                    </button>
                  )}
                </div>

                {isAddingNewCatInAddModal ? (
                  <div className="p-2.5 rounded-xl bg-slate-100 dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 space-y-2">
                    <div className="flex items-center gap-1.5">
                      <FolderPlus className="w-4 h-4 text-[#00df89]" />
                      <span className="font-semibold text-[11px] text-slate-800 dark:text-zinc-200">
                        {lang === 'bn' ? 'নতুন ক্যাটাগরির নাম লিখুন' : 'Enter New Category Name'}
                      </span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <input
                        type="text"
                        autoFocus
                        placeholder="e.g. Generator Fuel, Delivery Bag, Tea"
                        value={newCatNameInAddModal}
                        onChange={(e) => setNewCatNameInAddModal(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            e.preventDefault();
                            handleAddNewCategory(newCatNameInAddModal, 'add');
                          }
                        }}
                        className="flex-1 px-2.5 py-1.5 rounded-lg bg-white dark:bg-[#121215] border border-slate-200 dark:border-zinc-800 text-xs outline-none focus:ring-1 focus:ring-[#00df89]"
                      />
                      <Button
                        type="button"
                        size="sm"
                        onClick={() => handleAddNewCategory(newCatNameInAddModal, 'add')}
                        className="h-8 px-2.5 bg-[#00df89] hover:bg-[#00c97b] text-[#011812] text-xs font-semibold"
                      >
                        Add
                      </Button>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          setIsAddingNewCatInAddModal(false);
                          setNewCatNameInAddModal('');
                        }}
                        className="h-8 px-2 text-xs"
                      >
                        Cancel
                      </Button>
                    </div>
                  </div>
                ) : (
                  <Select
                    value={newExpense.category}
                    onValueChange={(val) => {
                      if (val === '__add_new__') {
                        setIsAddingNewCatInAddModal(true);
                      } else {
                        setNewExpense({ ...newExpense, category: val });
                      }
                    }}
                  >
                    <SelectTrigger className="w-full bg-slate-50 dark:bg-[#09090b]">
                      <SelectValue placeholder="Select Category" />
                    </SelectTrigger>
                    <SelectContent>
                      {allCategories.map((cat) => (
                        <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                      ))}
                      <SelectItem value="__add_new__" className="font-bold text-[#00a86b] dark:text-[#00df89]">
                        ➕ + Add New Custom Category...
                      </SelectItem>
                    </SelectContent>
                  </Select>
                )}
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="block font-semibold text-slate-700 dark:text-zinc-300">
                    Amount (৳) *
                  </label>
                  <input
                    type="number"
                    required
                    min="0.01"
                    step="any"
                    placeholder="e.g. 2500"
                    value={newExpense.amount}
                    onChange={(e) => setNewExpense({ ...newExpense, amount: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-zinc-800 bg-slate-50 dark:bg-[#09090b] outline-none focus:ring-2 focus:ring-[#00df89]"
                  />
                </div>

                <div className="space-y-1">
                  <label className="block font-semibold text-slate-700 dark:text-zinc-300">
                    Payment Method
                  </label>
                  <Select
                    value={newExpense.method}
                    onValueChange={(val) => setNewExpense({ ...newExpense, method: val })}
                  >
                    <SelectTrigger className="w-full bg-slate-50 dark:bg-[#09090b]">
                      <SelectValue placeholder="Payment Method" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Cash">Cash</SelectItem>
                      <SelectItem value="bKash">bKash</SelectItem>
                      <SelectItem value="Nagad">Nagad</SelectItem>
                      <SelectItem value="Rocket">Rocket</SelectItem>
                      <SelectItem value="Bank Transfer">Bank Transfer</SelectItem>
                      <SelectItem value="Card">Card</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-1">
                <label className="block font-semibold text-slate-700 dark:text-zinc-300">
                  Expense Date
                </label>
                <input
                  type="date"
                  value={newExpense.date}
                  onChange={(e) => setNewExpense({ ...newExpense, date: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-zinc-800 bg-slate-50 dark:bg-[#09090b] outline-none"
                />
              </div>

              <div className="space-y-1">
                <label className="block font-semibold text-slate-700 dark:text-zinc-300">
                  Note / Remarks (Optional)
                </label>
                <input
                  type="text"
                  placeholder="e.g. Paid via manager bKash account"
                  value={newExpense.description}
                  onChange={(e) => setNewExpense({ ...newExpense, description: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-[#09090b] border border-slate-200 dark:border-zinc-800 outline-none"
                />
              </div>

              <div className="pt-3 flex justify-end gap-2 border-t border-slate-100 dark:border-zinc-800">
                <Button type="button" variant="outline" size="sm" onClick={() => setIsAddExpenseModalOpen(false)}>
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={isSubmitting}
                  size="sm"
                  className="bg-[#00df89] hover:bg-[#00c97b] text-[#011812] font-semibold"
                >
                  {isSubmitting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : 'Record Expense'}
                </Button>
              </div>
            </form>
          </Card>
        </div>
      )}

      {/* ---------------------------------------------------- */}
      {/* EDIT EXPENSE MODAL                                   */}
      {/* ---------------------------------------------------- */}
      {isEditExpenseModalOpen && editingExpense && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs">
          <Card className="max-w-md w-full p-6 bg-white dark:bg-[#121215] border-slate-200 dark:border-zinc-800 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-zinc-800">
              <h3 className="font-bold text-base text-slate-900 dark:text-white">
                Edit Expense Entry
              </h3>
              <button
                onClick={() => setIsEditExpenseModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 p-1 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleUpdateExpenseSubmit} className="space-y-3.5 text-xs">
              <div className="space-y-1">
                <label className="block font-semibold text-slate-700 dark:text-zinc-300">
                  Expense Title / Purpose *
                </label>
                <input
                  type="text"
                  required
                  value={editExpenseForm.title}
                  onChange={(e) => setEditExpenseForm({ ...editExpenseForm, title: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-[#09090b] border border-slate-200 dark:border-zinc-800 outline-none focus:ring-2 focus:ring-[#00df89]"
                />
              </div>

              {/* Category Field with Inline "+ Add New Category" Option */}
              <div className="space-y-1">
                <div className="flex items-center justify-between">
                  <label className="font-semibold text-slate-700 dark:text-zinc-300">
                    Category *
                  </label>
                  {!isAddingNewCatInEditModal && (
                    <button
                      type="button"
                      onClick={() => setIsAddingNewCatInEditModal(true)}
                      className="text-[11px] font-semibold text-[#00a86b] dark:text-[#00df89] hover:underline flex items-center gap-1 cursor-pointer"
                    >
                      <Plus className="w-3 h-3" />
                      <span>{lang === 'bn' ? '+ নতুন ক্যাটাগরি যোগ করুন' : '+ Add New Category'}</span>
                    </button>
                  )}
                </div>

                {isAddingNewCatInEditModal ? (
                  <div className="p-2.5 rounded-xl bg-slate-100 dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 space-y-2">
                    <div className="flex items-center gap-1.5">
                      <FolderPlus className="w-4 h-4 text-[#00df89]" />
                      <span className="font-semibold text-[11px] text-slate-800 dark:text-zinc-200">
                        {lang === 'bn' ? 'নতুন ক্যাটাগরির নাম লিখুন' : 'Enter New Category Name'}
                      </span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <input
                        type="text"
                        autoFocus
                        placeholder="e.g. Generator Fuel, Delivery Bag, Tea"
                        value={newCatNameInEditModal}
                        onChange={(e) => setNewCatNameInEditModal(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            e.preventDefault();
                            handleAddNewCategory(newCatNameInEditModal, 'edit');
                          }
                        }}
                        className="flex-1 px-2.5 py-1.5 rounded-lg bg-white dark:bg-[#121215] border border-slate-200 dark:border-zinc-800 text-xs outline-none focus:ring-1 focus:ring-[#00df89]"
                      />
                      <Button
                        type="button"
                        size="sm"
                        onClick={() => handleAddNewCategory(newCatNameInEditModal, 'edit')}
                        className="h-8 px-2.5 bg-[#00df89] hover:bg-[#00c97b] text-[#011812] text-xs font-semibold"
                      >
                        Add
                      </Button>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          setIsAddingNewCatInEditModal(false);
                          setNewCatNameInEditModal('');
                        }}
                        className="h-8 px-2 text-xs"
                      >
                        Cancel
                      </Button>
                    </div>
                  </div>
                ) : (
                  <Select
                    value={editExpenseForm.category}
                    onValueChange={(val) => {
                      if (val === '__add_new__') {
                        setIsAddingNewCatInEditModal(true);
                      } else {
                        setEditExpenseForm({ ...editExpenseForm, category: val });
                      }
                    }}
                  >
                    <SelectTrigger className="w-full bg-slate-50 dark:bg-[#09090b]">
                      <SelectValue placeholder="Select Category" />
                    </SelectTrigger>
                    <SelectContent>
                      {allCategories.map((cat) => (
                        <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                      ))}
                      <SelectItem value="__add_new__" className="font-bold text-[#00a86b] dark:text-[#00df89]">
                        ➕ + Add New Custom Category...
                      </SelectItem>
                    </SelectContent>
                  </Select>
                )}
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="block font-semibold text-slate-700 dark:text-zinc-300">
                    Amount (৳) *
                  </label>
                  <input
                    type="number"
                    required
                    min="0.01"
                    step="any"
                    value={editExpenseForm.amount}
                    onChange={(e) => setEditExpenseForm({ ...editExpenseForm, amount: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-zinc-800 bg-slate-50 dark:bg-[#09090b] outline-none focus:ring-2 focus:ring-[#00df89]"
                  />
                </div>

                <div className="space-y-1">
                  <label className="block font-semibold text-slate-700 dark:text-zinc-300">
                    Payment Method
                  </label>
                  <Select
                    value={editExpenseForm.method}
                    onValueChange={(val) => setEditExpenseForm({ ...editExpenseForm, method: val })}
                  >
                    <SelectTrigger className="w-full bg-slate-50 dark:bg-[#09090b]">
                      <SelectValue placeholder="Payment Method" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Cash">Cash</SelectItem>
                      <SelectItem value="bKash">bKash</SelectItem>
                      <SelectItem value="Nagad">Nagad</SelectItem>
                      <SelectItem value="Rocket">Rocket</SelectItem>
                      <SelectItem value="Bank Transfer">Bank Transfer</SelectItem>
                      <SelectItem value="Card">Card</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-1">
                <label className="block font-semibold text-slate-700 dark:text-zinc-300">
                  Date
                </label>
                <input
                  type="date"
                  value={editExpenseForm.date}
                  onChange={(e) => setEditExpenseForm({ ...editExpenseForm, date: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-zinc-800 bg-slate-50 dark:bg-[#09090b] outline-none"
                />
              </div>

              <div className="space-y-1">
                <label className="block font-semibold text-slate-700 dark:text-zinc-300">
                  Note / Remarks
                </label>
                <input
                  type="text"
                  value={editExpenseForm.description}
                  onChange={(e) => setEditExpenseForm({ ...editExpenseForm, description: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-[#09090b] border border-slate-200 dark:border-zinc-800 outline-none"
                />
              </div>

              <div className="pt-3 flex justify-end gap-2 border-t border-slate-100 dark:border-zinc-800">
                <Button type="button" variant="outline" size="sm" onClick={() => setIsEditExpenseModalOpen(false)}>
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={isSubmitting}
                  size="sm"
                  className="bg-[#00df89] hover:bg-[#00c97b] text-[#011812] font-semibold"
                >
                  {isSubmitting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : 'Save Changes'}
                </Button>
              </div>
            </form>
          </Card>
        </div>
      )}

      {/* ---------------------------------------------------- */}
      {/* CONFIRM DELETE EXPENSE MODAL                         */}
      {/* ---------------------------------------------------- */}
      <ConfirmDialog
        isOpen={confirmDeleteDialog.isOpen}
        isLoading={isDeletingExpense}
        title={lang === 'bn' ? `'${confirmDeleteDialog.title}' খরচের রেকর্ড মুছে ফেলতে চান?` : `Delete expense '${confirmDeleteDialog.title}'?`}
        description={lang === 'bn' ? `এই খরচের (৳${confirmDeleteDialog.amount.toLocaleString()}) রেকর্ডটি স্থায়ীভাবে মুছে ফেলা হবে এবং লাভ-লোকসান স্টেটমেন্ট পুনরায় হিসাব করা হবে।` : `This expense entry (৳${confirmDeleteDialog.amount.toLocaleString()}) will be permanently deleted and P&L statements will recalculate.`}
        confirmText={lang === 'bn' ? 'হ্যাঁ, মুছে ফেলুন' : 'Yes, Delete'}
        cancelText={lang === 'bn' ? 'বাতিল' : 'Cancel'}
        onConfirm={handleConfirmDeleteExpense}
        onCancel={() => setConfirmDeleteDialog({ isOpen: false, id: null, title: '', amount: 0 })}
      />

    </div>
  );
}
