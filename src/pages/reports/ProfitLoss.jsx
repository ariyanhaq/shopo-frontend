/**
 * @file ProfitLoss.jsx
 * @description Comprehensive Real-Time Accounting, Finance, Cashbook Ledger & Profit/Loss Management for Shopo with Dynamic Expense Categories.
 */
import { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
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
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator
} from '@/components/ui/dropdown-menu';
import { DatePicker } from '@/components/ui/calendar';
import ConfirmDialog from '@/components/common/ConfirmDialog';
import Pagination from '@/components/common/Pagination';
import ReturnOrderModal from '@/components/sales/ReturnOrderModal';
import { printSaleReceipt, printExpenseVoucher } from '@/utils/invoicePrinter';
import { useBodyScrollLock } from '@/hooks/useBodyScrollLock';
import {
  Wallet, DollarSign, TrendingUp, TrendingDown, Plus, Download,
  Calendar, FileSpreadsheet, PieChart, ArrowUpRight, ArrowDownRight,
  CheckCircle2, Clock, X, Receipt, Building, Users, CreditCard, Loader2,
  Search, Filter, Edit2, Trash2, Printer, Sparkles, AlertTriangle, ArrowUpDown,
  FolderPlus, Check, Eye, Undo2, RotateCcw, FileText, Phone, ShoppingBag, Coins,
  Tag, Percent, MoreVertical, FileBarChart, ExternalLink
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
  'Stationery & Packaging',
  'Software & Subscriptions',
  'Miscellaneous & Others'
];

const MONTHS = [
  { value: '1', labelEn: 'January', labelBn: 'জানুয়ারি' },
  { value: '2', labelEn: 'February', labelBn: 'ফেব্রুয়ারি' },
  { value: '3', labelEn: 'March', labelBn: 'মার্চ' },
  { value: '4', labelEn: 'April', labelBn: 'এপ্রিল' },
  { value: '5', labelEn: 'May', labelBn: 'মে' },
  { value: '6', labelEn: 'June', labelBn: 'জুন' },
  { value: '7', labelEn: 'July', labelBn: 'জুলাই' },
  { value: '8', labelEn: 'August', labelBn: 'আগস্ট' },
  { value: '9', labelEn: 'September', labelBn: 'সেপ্টেম্বর' },
  { value: '10', labelEn: 'October', labelBn: 'অক্টোবর' },
  { value: '11', labelEn: 'November', labelBn: 'নভেম্বর' },
  { value: '12', labelEn: 'December', labelBn: 'ডিসেম্বর' },
];

const safeMoney = (val, fallback = 0) => {
  const n = parseFloat(val);
  return isNaN(n) ? fallback.toLocaleString() : n.toLocaleString();
};

export default function ProfitLoss() {
  const { lang, t } = useLanguage();
  const { mongoShop } = useAuth();

  const currentYear = new Date().getFullYear();
  const [dateFilter, setDateFilter] = useState('month');
  const [selectedMonth, setSelectedMonth] = useState(String(new Date().getMonth() + 1));
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

  // Sales Interaction States for Cashbook
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [selectedVoucher, setSelectedVoucher] = useState(null);
  const [returningSale, setReturningSale] = useState(null);

  // Edit Sale Modal State
  const [isEditSaleModalOpen, setIsEditSaleModalOpen] = useState(false);
  const [editingSale, setEditingSale] = useState(null);
  const [isUpdatingSale, setIsUpdatingSale] = useState(false);
  const [editSaleForm, setEditSaleForm] = useState({
    id: '',
    invoice_number: '',
    payment_method: 'cash',
    discount_type: 'flat',
    discount_value: '',
    paid_amount: '',
    tendered_amount: '',
    note: '',
  });

  // Delete Sale Dialog State
  const [confirmDeleteSale, setConfirmDeleteSale] = useState({
    isOpen: false,
    saleId: null,
    invoiceNumber: '',
  });
  const [isDeletingSale, setIsDeletingSale] = useState(false);

  // Confirm Delete Expense Dialog State
  const [confirmDeleteDialog, setConfirmDeleteDialog] = useState({
    isOpen: false,
    id: null,
    title: '',
    amount: 0,
  });

  useBodyScrollLock(
    Boolean(
      isAddExpenseModalOpen ||
      isEditExpenseModalOpen ||
      isEditSaleModalOpen ||
      selectedOrder ||
      selectedVoucher ||
      returningSale ||
      confirmDeleteDialog.isOpen ||
      confirmDeleteSale.isOpen
    )
  );

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
  }, [dateFilter, selectedMonth, selectedYear, specificDate, mongoShop?._id]);

  // Combined all available categories
  const allCategories = useMemo(() => {
    const fromStatement = statement?.expenseBreakdown?.map(b => b.title) || [];
    return [...new Set([...DEFAULT_EXPENSE_CATEGORIES, ...customCategories, ...fromStatement])];
  }, [customCategories, statement]);

  // Helper to save new custom category
  const handleAddNewCategory = (catName) => {
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

    setEditExpenseForm(prev => ({ ...prev, category: trimmed }));
    setIsAddingNewCatInEditModal(false);
    setNewCatNameInEditModal('');

    toast.success(lang === 'bn' ? `'${trimmed}' ক্যাটাগরি যুক্ত হয়েছে!` : `Category '${trimmed}' added!`);
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

  // Sales Edit & Delete Handlers for Cashbook
  const handleOpenEditSale = (entry) => {
    const sale = entry.fullSale || entry;
    setEditingSale(sale);
    setEditSaleForm({
      id: sale._id || entry._id,
      invoice_number: sale.invoice_number || entry.id,
      payment_method: sale.payment_method || entry.method || 'cash',
      discount_type: sale.discount_type || 'flat',
      discount_value: sale.discount_value !== undefined ? String(sale.discount_value) : '',
      paid_amount: sale.paid_amount !== undefined ? String(sale.paid_amount) : String(sale.total || entry.amount),
      tendered_amount: sale.tendered_amount !== undefined ? String(sale.tendered_amount) : '',
      note: sale.note || '',
    });
    setIsEditSaleModalOpen(true);
  };

  const handleUpdateSaleSubmit = async (e) => {
    e.preventDefault();
    if (!editSaleForm.id) return;
    setIsUpdatingSale(true);
    try {
      await api.sales.update(editSaleForm.id, {
        payment_method: editSaleForm.payment_method,
        discount_type: editSaleForm.discount_type,
        discount_value: parseFloat(editSaleForm.discount_value) || 0,
        paid_amount: parseFloat(editSaleForm.paid_amount) || 0,
        tendered_amount: parseFloat(editSaleForm.tendered_amount) || 0,
        note: editSaleForm.note,
      });
      toast.success(lang === 'bn' ? 'বিক্রয় ইনভয়েস সফলভাবে আপডেট হয়েছে!' : 'Sale invoice updated successfully!');
      setIsEditSaleModalOpen(false);
      setEditingSale(null);
      fetchStatement();
    } catch (err) {
      toast.error(err.response?.data?.message || (lang === 'bn' ? 'ইনভয়েস আপডেট করতে ব্যর্থ হয়েছে' : 'Failed to update invoice'));
    } finally {
      setIsUpdatingSale(false);
    }
  };

  const handleDeleteSaleRequest = (entry) => {
    setConfirmDeleteSale({
      isOpen: true,
      saleId: entry._id || entry.fullSale?._id,
      invoiceNumber: entry.id || entry.invoice_number || 'Sale',
    });
  };

  const handleConfirmDeleteSale = async () => {
    if (!confirmDeleteSale.saleId) return;
    setIsDeletingSale(true);
    try {
      await api.sales.delete(confirmDeleteSale.saleId);
      toast.success(lang === 'bn' ? 'বিক্রিটি মুছে ফেলা হয়েছে এবং স্টক ফেরত দেওয়া হয়েছে।' : 'Sale deleted successfully and stock restored.');
      setConfirmDeleteSale({ isOpen: false, saleId: null, invoiceNumber: '' });
      fetchStatement();
    } catch (err) {
      toast.error(err.response?.data?.message || (lang === 'bn' ? 'বিক্রি মুছতে ব্যর্থ হয়েছে' : 'Failed to delete sale'));
    } finally {
      setIsDeletingSale(false);
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
    totalInvestment: 0,
  };

  const investmentData = statement?.investment || {
    totalInvestment: financialData.totalInvestment || financialData.periodTotalInvestment || 0,
    periodTotalInvestment: financialData.periodTotalInvestment || financialData.totalInvestment || 0,
    periodPurchaseInvestment: financialData.periodPurchaseInvestment || 0,
    periodPurchasePaid: financialData.periodPurchasePaid || 0,
    periodPurchaseDue: financialData.periodPurchaseDue || 0,
    periodPurchaseCount: financialData.periodPurchaseCount || 0,
    periodOperatingExpenses: financialData.periodOperatingExpenses || 0,
    periodSalaryExpenses: financialData.periodSalaryExpenses || 0,
    lifetimeTotalInvestment: financialData.lifetimeTotalInvestment || 0,
    lifetimePurchaseInvestment: financialData.lifetimePurchaseInvestment || 0,
    lifetimeOperatingExpenses: financialData.lifetimeOperatingExpenses || 0,
    lifetimeSalaryExpenses: financialData.lifetimeSalaryExpenses || 0,
    totalStockInvestment: financialData.totalStockInvestment || 0,
    totalSupplierStockValuation: financialData.totalSupplierStockValuation || financialData.totalStockInvestment || 0,
    totalOwnStockValuation: financialData.totalOwnStockValuation || 0,
    totalStockRetailValue: financialData.totalStockRetailValue || 0,
    potentialStockProfit: financialData.potentialStockProfit || 0,
    totalStockUnits: financialData.totalStockUnits || 0,
    totalSupplierStockUnits: financialData.totalSupplierStockUnits || 0,
    totalOwnStockUnits: financialData.totalOwnStockUnits || 0,
    totalProductsCount: financialData.totalProductsCount || 0,
  };

  const expenseBreakdown = statement?.expenseBreakdown || [];
  const cashbookEntries = statement?.cashbookEntries || [];

  // Filtered Cashbook Entries
  const filteredEntries = useMemo(() => {
    return cashbookEntries.filter((entry) => {
      const q = (searchQuery || '').toLowerCase().trim();
      const matchesSearch =
        !q ||
        (entry.id && String(entry.id).toLowerCase().includes(q)) ||
        (entry.title && String(entry.title).toLowerCase().includes(q)) ||
        (entry.category && String(entry.category).toLowerCase().includes(q)) ||
        (entry.method && String(entry.method).toLowerCase().includes(q));

      const matchesType =
        transactionTypeFilter === 'all' ||
        (transactionTypeFilter === 'income' && entry.type === 'income') ||
        (transactionTypeFilter === 'expense' && entry.type === 'expense');

      return matchesSearch && matchesType;
    });
  }, [cashbookEntries, searchQuery, transactionTypeFilter]);

  // Pagination State
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, transactionTypeFilter, dateFilter, selectedMonth, selectedYear, specificDate, pageSize]);

  const paginatedEntries = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredEntries.slice(start, start + pageSize);
  }, [filteredEntries, currentPage, pageSize]);

  return (
    <div className="space-y-6 font-sans pb-12">
      
      {/* ---------------------------------------------------- */}
      {/* HEADER SECTION                                       */}
      {/* ---------------------------------------------------- */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div className="min-w-0">
          <h1 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white tracking-tight flex items-center gap-2.5">
            <FileBarChart className="w-6 h-6 text-[#00df89] shrink-0" />
            <span>{lang === 'bn' ? 'আর্থিক রিপোর্ট ও লাভ-লোকসান স্টেটমেন্ট' : 'Financial Reports & P&L Statement'}</span>
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-zinc-400 font-normal mt-0.5">
            {lang === 'bn'
              ? 'ব্যবসায়ের মোট আয়, পণ্য ক্রয় খরচ (COGS), পরিচালন ব্যয়, নিট লাভ ও আর্থিক খতিয়ান রিপোর্ট।'
              : 'Comprehensive audit of sales revenue, cost of goods sold (COGS), operating expenses, net profit, and financial ledger.'}
          </p>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <Button
            variant="outline"
            size="sm"
            onClick={() => window.print()}
            className="text-xs h-10 px-3.5 gap-1.5 border-slate-200 dark:border-zinc-800 font-semibold cursor-pointer shadow-2xs hover:bg-slate-50 dark:hover:bg-zinc-800 whitespace-nowrap shrink-0"
          >
            <Printer className="w-4 h-4 text-slate-500" />
            <span>{lang === 'bn' ? 'প্রিন্ট রিপোর্ট' : 'Print Statement'}</span>
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
      {/* FINANCIAL SUMMARY KPI CARDS (2 COLUMNS MOBILE / 5 DESKTOP) */}
      {/* ---------------------------------------------------- */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-3 sm:gap-4">
        
        {/* Total Business Investment (Purchases + Expenses + Salaries) */}
        <Card className="p-3.5 sm:p-5 border-slate-200/90 dark:border-zinc-800/80 dark:bg-[#121215] bg-gradient-to-br from-emerald-500/5 via-transparent to-transparent flex flex-col justify-between">
          <div className="flex items-center justify-between gap-1.5">
            <span className="text-[11px] sm:text-sm font-medium text-slate-500 dark:text-zinc-400 truncate">
              {lang === 'bn' ? 'সর্বমোট বিনিয়োগ' : 'Total Investment'}
            </span>
            <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg bg-emerald-500/10 dark:bg-emerald-500/20 text-[#00a86b] dark:text-[#00df89] flex items-center justify-center shrink-0">
              <Coins className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
            </div>
          </div>
          <div className="mt-2 sm:mt-3 space-y-1">
            <div className="text-lg sm:text-2xl lg:text-3xl font-bold text-slate-900 dark:text-white tracking-tight truncate font-mono">
              {isLoading ? (
                <Skeleton className="h-7 sm:h-8 w-24 my-0.5" />
              ) : (
                `৳ ${safeMoney(investmentData.totalInvestment || investmentData.periodTotalInvestment)}`
              )}
            </div>
            <div className="text-[10px] sm:text-xs text-slate-500 dark:text-zinc-400 font-medium truncate" title={lang === 'bn' ? 'পণ্য ক্রয় + পরিচালন ব্যয় + কর্মচারীদের বেতন' : 'Purchases + Operating Expenses + Salaries'}>
              {isLoading ? '...' : (
                <span>
                  {lang === 'bn' ? 'ক্রয় + খরচ + বেতন' : 'Purchases + Expenses + Salaries'}
                </span>
              )}
            </div>
          </div>
        </Card>

        {/* Gross Revenue */}
        <Card className="p-3.5 sm:p-5 border-slate-200/90 dark:border-zinc-800/80 dark:bg-[#121215] flex flex-col justify-between">
          <div className="flex items-center justify-between gap-1.5">
            <span className="text-[11px] sm:text-sm font-medium text-slate-500 dark:text-zinc-400 truncate">
              {lang === 'bn' ? 'মোট বিক্রয় আয়' : 'Gross Sales Revenue'}
            </span>
            <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg bg-emerald-500/10 dark:bg-emerald-500/20 text-[#00a86b] dark:text-[#00df89] flex items-center justify-center shrink-0">
              <DollarSign className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
            </div>
          </div>
          <div className="mt-2 sm:mt-3 space-y-1">
            <div className="text-lg sm:text-2xl lg:text-3xl font-bold text-[#00a86b] dark:text-[#00df89] tracking-tight truncate font-mono">
              {isLoading ? <Skeleton className="h-7 sm:h-8 w-24 my-0.5" /> : `৳ ${safeMoney(financialData.grossRevenue)}`}
            </div>
            <div className="text-[10px] sm:text-xs text-slate-500 dark:text-zinc-400 font-medium truncate">
              {lang === 'bn' ? 'ইনভয়েস বিক্রয় হিসাব' : 'From invoice transactions'}
            </div>
          </div>
        </Card>

        {/* Cost of Goods Sold */}
        <Card className="p-3.5 sm:p-5 border-slate-200/90 dark:border-zinc-800/80 dark:bg-[#121215] flex flex-col justify-between">
          <div className="flex items-center justify-between gap-1.5">
            <span className="text-[11px] sm:text-sm font-medium text-slate-500 dark:text-zinc-400 truncate">
              {lang === 'bn' ? 'পণ্য কেনা খরচ' : 'Cost of Goods (COGS)'}
            </span>
            <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg bg-blue-500/10 dark:bg-blue-500/20 text-blue-500 flex items-center justify-center shrink-0">
              <Receipt className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
            </div>
          </div>
          <div className="mt-2 sm:mt-3 space-y-1">
            <div className="text-lg sm:text-2xl lg:text-3xl font-bold text-slate-900 dark:text-white tracking-tight truncate font-mono">
              {isLoading ? <Skeleton className="h-7 sm:h-8 w-24 my-0.5" /> : `৳ ${safeMoney(financialData.cogs)}`}
            </div>
            <div className="text-[10px] sm:text-xs text-slate-500 dark:text-zinc-400 font-medium truncate">
              {lang === 'bn' ? 'পণ্য ক্রয় খরচ' : 'Direct product unit cost'}
            </div>
          </div>
        </Card>

        {/* Operating Expenses */}
        <Card className="p-3.5 sm:p-5 border-slate-200/90 dark:border-zinc-800/80 dark:bg-[#121215] flex flex-col justify-between">
          <div className="flex items-center justify-between gap-1.5">
            <span className="text-[11px] sm:text-sm font-medium text-slate-500 dark:text-zinc-400 truncate">
              {lang === 'bn' ? 'পরিচালন ও দোকান খরচ' : 'Operating Expenses'}
            </span>
            <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg bg-rose-500/10 dark:bg-rose-500/20 text-rose-500 flex items-center justify-center shrink-0">
              <ArrowDownRight className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
            </div>
          </div>
          <div className="mt-2 sm:mt-3 space-y-1">
            <div className="text-lg sm:text-2xl lg:text-3xl font-bold text-rose-500 tracking-tight truncate font-mono">
              {isLoading ? <Skeleton className="h-7 sm:h-8 w-24 my-0.5" /> : `৳ ${safeMoney(financialData.operatingExpenses)}`}
            </div>
            <div className="text-[10px] sm:text-xs text-rose-500 font-medium truncate">
              {lang === 'bn' ? 'দোকান ভাড়া ও বিল' : 'Rent, bills & overheads'}
            </div>
          </div>
        </Card>

        {/* Net Profit */}
        <Card className="p-3.5 sm:p-5 border-slate-200/90 dark:border-zinc-800/80 dark:bg-[#121215] col-span-2 sm:col-span-1 lg:col-span-1 flex flex-col justify-between">
          <div className="flex items-center justify-between gap-1.5">
            <span className="text-[11px] sm:text-sm font-medium text-slate-500 dark:text-zinc-400 truncate">
              {lang === 'bn' ? 'নিট লাভ / লোকসান' : 'Net Profit / Loss'}
            </span>
            <div className={`w-7 h-7 sm:w-8 sm:h-8 rounded-lg flex items-center justify-center shrink-0 ${
              financialData.netProfit >= 0 ? 'bg-emerald-500/10 dark:bg-emerald-500/20 text-[#00a86b] dark:text-[#00df89]' : 'bg-rose-500/10 dark:bg-rose-500/20 text-rose-500'
            }`}>
              {financialData.netProfit >= 0 ? (
                <TrendingUp className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
              ) : (
                <TrendingDown className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
              )}
            </div>
          </div>
          <div className="mt-2 sm:mt-3 space-y-1">
            <div className={`text-lg sm:text-2xl lg:text-3xl font-bold tracking-tight truncate font-mono ${financialData.netProfit >= 0 ? 'text-[#00a86b] dark:text-[#00df89]' : 'text-rose-500'}`}>
              {isLoading ? <Skeleton className="h-7 sm:h-8 w-24 my-0.5" /> : `৳ ${safeMoney(financialData.netProfit)}`}
            </div>
            <div className="text-[10px] sm:text-xs font-semibold text-slate-500 dark:text-zinc-400 truncate">
              {isLoading ? <Skeleton className="h-3 w-20 my-0.5" /> : `${financialData.profitMargin} ${lang === 'bn' ? 'নিট মার্জিন' : 'Net Margin'}`}
            </div>
          </div>
        </Card>

      </div>

      {/* ---------------------------------------------------- */}
      {/* EXPENSE CATEGORIES, INVESTMENT, & P&L SUMMARY        */}
      {/* ---------------------------------------------------- */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Expense Category Breakdown Card */}
        <Card className="p-6 space-y-4 border border-slate-200/90 dark:border-zinc-800/80 dark:bg-[#121215]">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-base font-bold text-slate-900 dark:text-white">
                {lang === 'bn' ? 'দোকানের খরচের বিভাগসমূহ' : 'Operating Expense Breakdown'}
              </CardTitle>
              <CardDescription className="text-xs font-normal">
                {lang === 'bn' ? 'ক্যাটাগরি অনুযায়ী খরচের পরিসংখ্যান ও অনুপাত' : 'Category distribution of operating expenses'}
              </CardDescription>
            </div>
            <Link
              to="/expenses"
              className="text-xs font-semibold text-[#00a86b] dark:text-[#00df89] hover:underline flex items-center gap-1 cursor-pointer"
            >
              <span>{lang === 'bn' ? 'খরচের তালিকা' : 'Expenses'}</span>
              <ArrowUpRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          {isLoading ? (
            <div className="py-12 text-center text-slate-400">
              <Loader2 className="w-6 h-6 animate-spin mx-auto mb-2 text-[#00df89]" />
              Loading financial breakdown...
            </div>
          ) : expenseBreakdown.length === 0 ? (
            <div className="py-10 text-center space-y-2 border border-dashed border-slate-200 dark:border-zinc-800 rounded-xl">
              <Receipt className="w-8 h-8 text-slate-300 dark:text-zinc-600 mx-auto" />
              <p className="text-xs text-slate-400">{lang === 'bn' ? 'এই সময়ের জন্য কোনো খরচের হিসাব পাওয়া যায়নি।' : 'No operating expenses recorded for this period.'}</p>
            </div>
          ) : (
            <div className="space-y-3.5 pt-1 max-h-72 overflow-y-auto pr-1">
              {expenseBreakdown.map((item, idx) => (
                <div key={idx} className="space-y-1.5">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-semibold text-slate-800 dark:text-zinc-200">{item.title}</span>
                    <span className="font-bold text-slate-900 dark:text-white font-mono">
                      ৳ {item.amount.toLocaleString()} ({item.percentage}%)
                    </span>
                  </div>
                  <div className="w-full h-2 rounded-full bg-slate-100 dark:bg-zinc-800 overflow-hidden">
                    <div style={{ width: `${Math.min(100, item.percentage)}%` }} className="h-full rounded-full bg-rose-500 transition-all duration-300" />
                  </div>
                </div>
              ))}
            </div>
          )}
        </Card>

        {/* Capital & Total Business Investment Card */}
        <Card className="p-6 space-y-4 border border-slate-200/90 dark:border-zinc-800/80 dark:bg-[#121215]">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <Coins className="w-4 h-4 text-[#00df89]" />
                <span>{lang === 'bn' ? 'সর্বমোট বিনিয়োগ ও মূলধনের হিসাব' : 'Total Investment Breakdown'}</span>
              </CardTitle>
              <CardDescription className="text-xs font-normal">
                {lang === 'bn' ? 'পণ্য ক্রয়, দোকান পরিচালনা ব্যয় ও বেতনের যোগফল' : 'Purchases, operating expenses & salaries sum'}
              </CardDescription>
            </div>
            <Link
              to="/inventory"
              className="text-xs font-semibold text-[#00a86b] dark:text-[#00df89] hover:underline flex items-center gap-1 cursor-pointer"
            >
              <span>{lang === 'bn' ? 'ইনভেন্টরি' : 'Inventory'}</span>
              <ArrowUpRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          <div className="space-y-2.5 text-xs pt-1">
            {/* 3 Investment Outflow Pillars */}
            <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-[#09090b] border border-slate-200 dark:border-zinc-800 space-y-2">
              <div className="flex justify-between text-slate-600 dark:text-zinc-400">
                <span className="flex items-center gap-1.5">
                  <ShoppingBag className="w-3.5 h-3.5 text-blue-500" />
                  <span>{lang === 'bn' ? '১. পণ্য ক্রয় ও স্টক সংগ্রহ:' : '1. Product Purchases / Stock:'}</span>
                </span>
                <span className="font-bold text-slate-900 dark:text-white font-mono">
                  ৳ {safeMoney(investmentData.periodPurchaseInvestment)}
                </span>
              </div>

              <div className="flex justify-between text-slate-600 dark:text-zinc-400">
                <span className="flex items-center gap-1.5">
                  <Receipt className="w-3.5 h-3.5 text-amber-500" />
                  <span>{lang === 'bn' ? '২. দোকান ও পরিচালন খরচ:' : '2. Operating & Shop Expenses:'}</span>
                </span>
                <span className="font-bold text-slate-900 dark:text-white font-mono">
                  ৳ {safeMoney(investmentData.periodOperatingExpenses)}
                </span>
              </div>

              <div className="flex justify-between text-slate-600 dark:text-zinc-400">
                <span className="flex items-center gap-1.5">
                  <Users className="w-3.5 h-3.5 text-purple-500" />
                  <span>{lang === 'bn' ? '৩. কর্মচারীদের বেতন ও পারিশ্রমিক:' : '3. Staff Salaries Paid:'}</span>
                </span>
                <span className="font-bold text-slate-900 dark:text-white font-mono">
                  ৳ {safeMoney(investmentData.periodSalaryExpenses)}
                </span>
              </div>

              {/* Total Sum Highlight */}
              <div className="flex justify-between items-center text-slate-900 dark:text-white pt-2 border-t border-slate-200 dark:border-zinc-800">
                <span className="font-bold text-xs">
                  {lang === 'bn' ? 'নির্বাচিত সময়ের মোট বিনিয়োগ:' : 'Period Total Investment:'}
                </span>
                <span className="font-black text-sm text-[#00a86b] dark:text-[#00df89] font-mono">
                  ৳ {safeMoney(investmentData.totalInvestment || investmentData.periodTotalInvestment)}
                </span>
              </div>
            </div>

            {/* Current Real-time Inventory Asset & Lifetime Stats */}
            <div className="p-3 rounded-xl bg-slate-50 dark:bg-[#09090b] border border-slate-200 dark:border-zinc-800 space-y-1.5 text-[11px]">
              <div className="flex justify-between text-slate-500">
                <span>{lang === 'bn' ? 'সাপ্লায়ার অবিক্রিত স্টক সম্পদ (বিনিয়োগ মূল্য):' : 'Supplier Stock Asset (Cost Investment):'}</span>
                <span className="font-semibold text-slate-800 dark:text-zinc-200 font-mono">
                  ৳ {safeMoney(investmentData.totalStockInvestment)}
                </span>
              </div>
              {Number(investmentData.totalOwnStockValuation) > 0 && (
                <div className="flex justify-between text-slate-500 text-[10px]">
                  <span className="text-purple-600 dark:text-purple-400">
                    {lang === 'bn' ? '↳ নিজস্ব পণ্য স্টক (বিনিয়োগে যুক্ত নয়):' : '↳ Own Product Stock (excluded from investment):'}
                  </span>
                  <span className="font-medium text-purple-600 dark:text-purple-400 font-mono">
                    ৳ {safeMoney(investmentData.totalOwnStockValuation)}
                  </span>
                </div>
              )}
              <div className="flex justify-between text-slate-500">
                <span>{lang === 'bn' ? 'সর্বমোট লাইফটাইম ব্যবসায়িক বিনিয়োগ:' : 'Lifetime Business Investment:'}</span>
                <span className="font-medium text-slate-600 dark:text-zinc-400 font-mono">
                  ৳ {safeMoney(investmentData.lifetimeTotalInvestment)}
                </span>
              </div>
            </div>
          </div>
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
                <span className="font-bold text-slate-900 dark:text-white font-mono">৳ {(financialData.grossProfit || 0).toLocaleString()}</span>
              </div>
            </div>

            <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-[#00a86b] dark:text-[#00df89] space-y-1">
              <div className="text-[11px] font-semibold uppercase tracking-wider">{lang === 'bn' ? 'নিট ফলাফল' : 'Estimated Return'}</div>
              <div className="text-base font-bold font-mono">
                ৳ {safeMoney(financialData.netProfit)} {lang === 'bn' ? (financialData.netProfit >= 0 ? 'নিট লাভ' : 'নিট লোকসান') : 'Net Gain'}
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

            {/* Type Filters Dropdown */}
            <div className="w-40 sm:w-44">
              <Select value={transactionTypeFilter} onValueChange={setTransactionTypeFilter}>
                <SelectTrigger size="sm" className="bg-slate-50 dark:bg-[#09090b] w-full h-9 rounded-xl border border-slate-200 dark:border-zinc-800 text-xs font-semibold">
                  <SelectValue placeholder="All Types" />
                </SelectTrigger>
                <SelectContent className="min-w-[170px]">
                  <SelectItem value="all">{lang === 'bn' ? 'সকল লেনদেন' : 'All Entries'}</SelectItem>
                  <SelectItem value="income">{lang === 'bn' ? 'আয় ও বিক্রি (+)' : 'Income / Sales (+)'}</SelectItem>
                  <SelectItem value="expense">{lang === 'bn' ? 'খরচ ও ব্যয় (-)' : 'Operating Expenses (-)'}</SelectItem>
                </SelectContent>
              </Select>
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
                  <th className="p-3.5 whitespace-nowrap">{lang === 'bn' ? 'আইডি ও তারিখ' : 'Tx ID & Date'}</th>
                  <th className="p-3.5 whitespace-nowrap">{lang === 'bn' ? 'ধরণ ও স্ট্যাটাস' : 'Type & Status'}</th>
                  <th className="p-3.5 min-w-[200px]">{lang === 'bn' ? 'বিবরণ / গ্রাহক' : 'Description / Customer'}</th>
                  <th className="p-3.5 whitespace-nowrap">{lang === 'bn' ? 'ক্যাটাগরি' : 'Category'}</th>
                  <th className="p-3.5 whitespace-nowrap">{lang === 'bn' ? 'পেমেন্ট মাধ্যম' : 'Method'}</th>
                  <th className="p-3.5 text-right whitespace-nowrap">{lang === 'bn' ? 'পরিমাণ (৳)' : 'Amount (৳)'}</th>
                  <th className="p-3.5 text-right whitespace-nowrap">{lang === 'bn' ? 'অ্যাকশন' : 'Actions'}</th>
                </tr>
              </thead>

              <tbody className="divide-y divide-slate-100 dark:divide-zinc-800/60">
                {paginatedEntries.map((entry, idx) => {
                  const isSale = entry.type === 'income';
                  const isReturned = entry.status === 'returned';
                  const isPartialReturn = entry.status === 'partially_returned';
                  const isDue = (entry.due_amount || 0) > 0;
                  const isLastRows = idx >= paginatedEntries.length - 2;

                  return (
                    <tr key={entry._id || idx} className="hover:bg-slate-50/60 dark:hover:bg-zinc-800/40 transition-colors">
                      
                      {/* ID & Date */}
                      <td className="p-3.5 whitespace-nowrap">
                        <div className="font-bold font-mono text-slate-900 dark:text-white">
                          {entry.id}
                        </div>
                        <div className="text-[11px] text-slate-400 font-normal mt-0.5">
                          {entry.date}
                        </div>
                      </td>

                      {/* Type & Return/Due Status Badge */}
                      <td className="p-3.5 whitespace-nowrap">
                        <div className="flex flex-col items-start gap-1">
                          {isSale ? (
                            <>
                              <Badge className="bg-emerald-500/15 text-emerald-700 dark:text-[#00df89] border border-emerald-500/30 text-[10px] font-bold uppercase">
                                {lang === 'bn' ? 'আয় (+)' : 'Income (+)'}
                              </Badge>
                              {isReturned ? (
                                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold bg-rose-500/15 text-rose-600 dark:text-rose-400 border border-rose-500/30">
                                  <RotateCcw className="w-3 h-3" />
                                  <span>{lang === 'bn' ? 'সম্পূর্ণ ফেরত' : 'Returned'}</span>
                                </span>
                              ) : isPartialReturn ? (
                                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold bg-amber-500/15 text-amber-600 dark:text-amber-400 border border-amber-500/30">
                                  <RotateCcw className="w-3 h-3" />
                                  <span>{lang === 'bn' ? 'আংশিক ফেরত' : 'Partial Return'}</span>
                                </span>
                              ) : isDue ? (
                                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold bg-amber-500/15 text-amber-600 dark:text-amber-400 border border-amber-500/30">
                                  <span>Due: ৳{safeMoney(entry.due_amount)}</span>
                                </span>
                              ) : (
                                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-500/10 text-emerald-600 dark:text-[#00df89] border border-emerald-500/20">
                                  <span>Paid</span>
                                </span>
                              )}
                            </>
                          ) : (
                            <Badge variant="destructive" className="text-[10px] uppercase font-bold">
                              {lang === 'bn' ? 'ব্যয় (-)' : 'Expense (-)'}
                            </Badge>
                          )}
                        </div>
                      </td>

                      {/* Description */}
                      <td className="p-3.5">
                        <div className="font-semibold text-slate-800 dark:text-zinc-200">
                          {entry.title}
                        </div>
                        {entry.customer_phone && (
                          <div className="text-[11px] text-slate-400 font-mono flex items-center gap-1 mt-0.5">
                            <Phone className="w-3 h-3 text-slate-400 shrink-0" />
                            <span>{entry.customer_phone}</span>
                          </div>
                        )}
                        {Array.isArray(entry.items) && entry.items.length > 0 && (
                          <div className="text-[11px] text-slate-500 dark:text-zinc-400 mt-1 truncate max-w-xs">
                            {entry.items.slice(0, 2).map((it) => `${it.name} (${it.quantity})`).join(', ')}
                            {entry.items.length > 2 && ` +${entry.items.length - 2} more`}
                          </div>
                        )}
                      </td>

                      {/* Category */}
                      <td className="p-3.5 text-slate-600 dark:text-zinc-400 whitespace-nowrap">
                        <span className="inline-flex items-center px-2 py-0.5 rounded-md bg-slate-100 dark:bg-zinc-800 text-slate-700 dark:text-zinc-300 font-medium text-[11px]">
                          {entry.category}
                        </span>
                      </td>

                      {/* Payment Method */}
                      <td className="p-3.5 text-slate-600 dark:text-zinc-400 whitespace-nowrap">
                        <span className="capitalize font-mono font-medium text-[11px]">{entry.method || 'Cash'}</span>
                      </td>

                      {/* Amount */}
                      <td className="p-3.5 text-right whitespace-nowrap">
                        {isSale ? (
                          <div className="flex flex-col items-end">
                            <span className={`font-bold font-mono text-xs text-[#00a86b] dark:text-[#00df89] ${isReturned ? 'line-through text-slate-400 font-normal' : ''}`}>
                              + ৳ {safeMoney(entry.amount)}
                            </span>
                            {isReturned && (
                              <span className="text-[10px] text-rose-500 font-bold font-mono">
                                Refunded: ৳{safeMoney(entry.refunded_amount || entry.amount)}
                              </span>
                            )}
                            {isPartialReturn && Number(entry.refunded_amount) > 0 && (
                              <span className="text-[10px] text-rose-500 font-medium font-mono">
                                - ৳{safeMoney(entry.refunded_amount)} refund
                              </span>
                            )}
                          </div>
                        ) : (
                          <span className="font-bold font-mono text-xs text-rose-500">
                            - ৳ {safeMoney(entry.amount)}
                          </span>
                        )}
                      </td>

                      {/* Actions: View (Eye), Print (Printer), More (MoreVertical Dropdown) */}
                      <td className="p-3.5 text-right whitespace-nowrap min-w-[130px]">
                        <div className="flex items-center justify-end gap-1.5">
                          {/* 1. VIEW BUTTON */}
                          <button
                            type="button"
                            onClick={() => {
                              if (isSale) {
                                setSelectedOrder(entry.fullSale || entry);
                              } else {
                                setSelectedVoucher(entry.fullExpense || entry);
                              }
                            }}
                            title={isSale ? (lang === 'bn' ? 'মেমো বিবরণ দেখুন' : 'View Receipt Memo') : (lang === 'bn' ? 'ভাউচার স্লিপ দেখুন' : 'View Voucher Slip')}
                            className="w-8 h-8 rounded-xl bg-slate-50 dark:bg-zinc-800/90 hover:bg-slate-100 dark:hover:bg-zinc-700 text-slate-700 dark:text-zinc-300 flex items-center justify-center transition-colors cursor-pointer border border-slate-200/90 dark:border-zinc-700/80 shadow-2xs shrink-0"
                          >
                            <Eye className="w-4 h-4" />
                          </button>

                          {/* 2. PRINT BUTTON */}
                          <button
                            type="button"
                            onClick={() => {
                              if (isSale) {
                                printSaleReceipt({ order: entry.fullSale || entry, shop: mongoShop, lang });
                              } else {
                                printExpenseVoucher({ expense: entry.fullExpense || entry, shop: mongoShop, lang });
                              }
                            }}
                            title={isSale ? (lang === 'bn' ? 'রশিদ প্রিন্ট করুন' : 'Print Receipt') : (lang === 'bn' ? 'ভাউচার প্রিন্ট করুন' : 'Print Voucher')}
                            className="w-8 h-8 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 hover:bg-emerald-100 dark:hover:bg-emerald-900/60 text-[#00a86b] dark:text-[#00df89] flex items-center justify-center transition-colors cursor-pointer border border-emerald-500/20 shadow-2xs shrink-0"
                          >
                            <Printer className="w-4 h-4" />
                          </button>

                          {/* 3. MORE OPTIONS DROPDOWN BUTTON */}
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <button
                                type="button"
                                title={lang === 'bn' ? 'আরও অপশন' : 'More Options'}
                                className="w-8 h-8 rounded-xl bg-slate-50 dark:bg-zinc-800/90 hover:bg-slate-100 dark:hover:bg-zinc-700 text-slate-700 dark:text-zinc-300 flex items-center justify-center transition-colors cursor-pointer border border-slate-200/90 dark:border-zinc-700/80 shadow-2xs shrink-0"
                              >
                                <MoreVertical className="w-4 h-4" />
                              </button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="right" side={isLastRows ? 'top' : 'auto'} width="w-52">
                              {isSale ? (
                                <>
                                  {!isReturned && (
                                    <DropdownMenuItem
                                      onClick={() => setReturningSale(entry.fullSale || entry)}
                                      className="gap-2 cursor-pointer text-xs"
                                    >
                                      <Undo2 className="w-3.5 h-3.5 text-rose-500" />
                                      <span>{lang === 'bn' ? 'পণ্য ফেরত ও রিফান্ড' : 'Return & Refund'}</span>
                                    </DropdownMenuItem>
                                  )}
                                  <DropdownMenuItem
                                    onClick={() => handleOpenEditSale(entry)}
                                    className="gap-2 cursor-pointer text-xs"
                                  >
                                    <Edit2 className="w-3.5 h-3.5 text-blue-500" />
                                    <span>{lang === 'bn' ? 'ইনভয়েস সম্পাদনা' : 'Edit Invoice'}</span>
                                  </DropdownMenuItem>
                                  <DropdownMenuSeparator />
                                  <DropdownMenuItem
                                    onClick={() => handleDeleteSaleRequest(entry)}
                                    className="gap-2 text-rose-600 dark:text-rose-400 cursor-pointer text-xs"
                                  >
                                    <Trash2 className="w-3.5 h-3.5" />
                                    <span>{lang === 'bn' ? 'মুছে ফেলুন ও স্টক ফেরত' : 'Delete & Restore'}</span>
                                  </DropdownMenuItem>
                                </>
                              ) : (
                                <>
                                  <DropdownMenuItem
                                    onClick={() => handleOpenEditExpense(entry)}
                                    className="gap-2 cursor-pointer text-xs"
                                  >
                                    <Edit2 className="w-3.5 h-3.5 text-blue-500" />
                                    <span>{lang === 'bn' ? 'খরচ সম্পাদনা' : 'Edit Expense'}</span>
                                  </DropdownMenuItem>
                                  <DropdownMenuSeparator />
                                  <DropdownMenuItem
                                    onClick={() => handleDeleteExpenseRequest(entry)}
                                    className="gap-2 text-rose-600 dark:text-rose-400 cursor-pointer text-xs"
                                  >
                                    <Trash2 className="w-3.5 h-3.5" />
                                    <span>{lang === 'bn' ? 'খরচের রেকর্ড মুছুন' : 'Delete Expense'}</span>
                                  </DropdownMenuItem>
                                </>
                              )}
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </div>
                      </td>

                    </tr>
                  );
                })}
              </tbody>
            </table>

            {/* Pagination Controls */}
            <Pagination
              currentPage={currentPage}
              totalItems={filteredEntries.length}
              pageSize={pageSize}
              pageSizeOptions={[10, 20, 50, 100]}
              onPageChange={setCurrentPage}
              onPageSizeChange={setPageSize}
            />
          </div>
        )}
      </Card>

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
      {/* RETURN ORDER & REFUND MODAL                          */}
      {/* ---------------------------------------------------- */}
      <ReturnOrderModal
        isOpen={Boolean(returningSale)}
        onClose={() => setReturningSale(null)}
        order={returningSale}
        onSuccess={() => {
          setReturningSale(null);
          fetchStatement();
        }}
      />

      {/* ---------------------------------------------------- */}
      {/* VIEW SALE RECEIPT / MEMO MODAL                       */}
      {/* ---------------------------------------------------- */}
      {selectedOrder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs">
          <Card className="max-w-md w-full p-6 bg-white dark:bg-[#121215] border border-slate-200 dark:border-zinc-800 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-zinc-800 pb-3">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-emerald-500/15 flex items-center justify-center text-[#00a86b] dark:text-[#00df89]">
                  <Receipt className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-base font-bold text-slate-900 dark:text-white">
                    {lang === 'bn' ? 'ক্যাশ মেমো ও বিক্রয় রসিদ' : 'Sale Cash Memo'}
                  </h2>
                  <p className="text-xs text-slate-400 font-mono">Invoice: {selectedOrder.invoice_number || selectedOrder.id}</p>
                </div>
              </div>
              <button
                onClick={() => setSelectedOrder(null)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-white p-1 rounded-lg cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-4 rounded-xl bg-slate-50 dark:bg-[#09090b] border border-slate-200 dark:border-zinc-800 space-y-3 text-xs">
              <div className="text-center pb-2 border-b border-slate-200 dark:border-zinc-800">
                <h3 className="font-bold text-sm text-slate-900 dark:text-white">{mongoShop?.name || 'Shopo Store'}</h3>
                <p className="text-[11px] text-slate-400">{selectedOrder.date}</p>
              </div>

              <div className="space-y-1 text-xs">
                <div className="flex justify-between">
                  <span className="text-slate-500">{lang === 'bn' ? 'ক্রেতা:' : 'Customer:'}</span>
                  <span className="font-semibold text-slate-900 dark:text-white">
                    {selectedOrder.customer_id?.name || selectedOrder.customer_name || 'Walk-in Customer'}
                  </span>
                </div>
                {(selectedOrder.customer_id?.phone || selectedOrder.customer_phone) && (
                  <div className="flex justify-between">
                    <span className="text-slate-500">{lang === 'bn' ? 'মোবাইল:' : 'Phone:'}</span>
                    <span className="font-mono text-slate-700 dark:text-zinc-300">
                      {selectedOrder.customer_id?.phone || selectedOrder.customer_phone}
                    </span>
                  </div>
                )}
                <div className="flex justify-between">
                  <span className="text-slate-500">{lang === 'bn' ? 'পেমেন্ট মাধ্যম:' : 'Payment Method:'}</span>
                  <span className="font-semibold uppercase">{selectedOrder.payment_method || selectedOrder.method || 'Cash'}</span>
                </div>
              </div>

              {/* Items List */}
              {Array.isArray(selectedOrder.items) && selectedOrder.items.length > 0 && (
                <div className="pt-2 border-t border-slate-200 dark:border-zinc-800 space-y-1.5">
                  <div className="text-[11px] font-semibold text-slate-700 dark:text-zinc-300">
                    {lang === 'bn' ? 'ক্রয়কৃত পণ্যের তালিকা:' : 'Purchased Items:'}
                  </div>
                  <div className="divide-y divide-slate-200/60 dark:divide-zinc-800/60">
                    {selectedOrder.items.map((it, idx) => (
                      <div key={idx} className="py-1 flex justify-between items-center text-[11px]">
                        <span className="text-slate-800 dark:text-zinc-200 font-medium">
                          {it.name} <span className="text-slate-400 font-mono">× {it.quantity}</span>
                        </span>
                        <span className="font-mono font-semibold text-slate-900 dark:text-white">
                          ৳ {safeMoney((it.unit_price || it.price || 0) * (it.quantity || 1))}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Financial Totals */}
              <div className="pt-2 border-t border-slate-200 dark:border-zinc-800 space-y-1 text-xs">
                <div className="flex justify-between text-slate-600 dark:text-zinc-400">
                  <span>{lang === 'bn' ? 'মোট বিল:' : 'Subtotal / Total Bill:'}</span>
                  <span className="font-bold text-slate-900 dark:text-white">৳ {safeMoney(selectedOrder.total || selectedOrder.amount)}</span>
                </div>
                {Number(selectedOrder.refunded_amount) > 0 && (
                  <div className="flex justify-between text-rose-500 font-medium">
                    <span>{lang === 'bn' ? 'ফেরত / রিফান্ড:' : 'Refunded Amount:'}</span>
                    <span>- ৳ {safeMoney(selectedOrder.refunded_amount)}</span>
                  </div>
                )}
                <div className="flex justify-between text-emerald-600 dark:text-[#00df89]">
                  <span>{lang === 'bn' ? 'পরিশোধিত:' : 'Paid:'}</span>
                  <span className="font-bold">৳ {safeMoney(selectedOrder.paid_amount || selectedOrder.total || selectedOrder.amount)}</span>
                </div>
                {Number(selectedOrder.due_amount) > 0 && (
                  <div className="flex justify-between text-amber-600 font-bold">
                    <span>{lang === 'bn' ? 'বকেয়া বাকি:' : 'Due Outstanding:'}</span>
                    <span>৳ {safeMoney(selectedOrder.due_amount)}</span>
                  </div>
                )}
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-slate-100 dark:border-zinc-800">
              <Button type="button" variant="outline" size="sm" onClick={() => setSelectedOrder(null)}>
                {lang === 'bn' ? 'বন্ধ করুন' : 'Close'}
              </Button>
              <Button
                type="button"
                size="sm"
                onClick={() => printSaleReceipt({ order: selectedOrder, shop: mongoShop, lang })}
                className="bg-[#00df89] hover:bg-[#00c97b] text-[#011812] font-semibold gap-1.5"
              >
                <Printer className="w-3.5 h-3.5" />
                <span>{lang === 'bn' ? 'প্রিন্ট রসিদ' : 'Print Receipt'}</span>
              </Button>
            </div>
          </Card>
        </div>
      )}

      {/* ---------------------------------------------------- */}
      {/* VIEW EXPENSE VOUCHER SLIP MODAL                      */}
      {/* ---------------------------------------------------- */}
      {selectedVoucher && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs">
          <Card className="max-w-md w-full p-6 bg-white dark:bg-[#121215] border border-slate-200 dark:border-zinc-800 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-zinc-800 pb-3">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-rose-500/15 flex items-center justify-center text-rose-600">
                  <FileText className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-base font-bold text-slate-900 dark:text-white">
                    {lang === 'bn' ? 'দোকান খরচ ভাউচার' : 'Expense Voucher Slip'}
                  </h2>
                  <p className="text-xs text-slate-400 font-mono">Ref: {selectedVoucher.id || `EXP-${selectedVoucher._id?.slice(-4).toUpperCase()}`}</p>
                </div>
              </div>
              <button
                onClick={() => setSelectedVoucher(null)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-white p-1 rounded-lg cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-4 rounded-xl bg-slate-50 dark:bg-[#09090b] border border-slate-200 dark:border-zinc-800 space-y-3 text-xs">
              <div className="text-center pb-2 border-b border-slate-200 dark:border-zinc-800">
                <h3 className="font-bold text-sm text-slate-900 dark:text-white">{mongoShop?.name || 'Shopo Store'}</h3>
                <p className="text-[11px] text-slate-400">{selectedVoucher.date}</p>
                <Badge variant="destructive" className="text-[10px] font-bold mt-1">
                  {selectedVoucher.category || 'General Expense'}
                </Badge>
              </div>

              <div className="space-y-1.5 text-xs">
                <div className="flex justify-between">
                  <span className="text-slate-500">{lang === 'bn' ? 'খরচের শিরোনাম:' : 'Expense Title:'}</span>
                  <span className="font-semibold text-slate-900 dark:text-white">{selectedVoucher.title}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">{lang === 'bn' ? 'পেমেন্ট মাধ্যম:' : 'Payment Method:'}</span>
                  <span className="font-semibold uppercase">{selectedVoucher.method || 'Cash'}</span>
                </div>
                {selectedVoucher.description && (
                  <div className="flex justify-between">
                    <span className="text-slate-500">{lang === 'bn' ? 'বিবরণ:' : 'Remarks:'}</span>
                    <span className="text-slate-700 dark:text-zinc-300">{selectedVoucher.description}</span>
                  </div>
                )}
                <div className="pt-2 border-t border-slate-200 dark:border-zinc-800 flex justify-between items-center text-sm font-bold text-slate-900 dark:text-white">
                  <span>{lang === 'bn' ? 'খরচের পরিমাণ:' : 'Expense Amount:'}</span>
                  <span className="text-rose-600 text-base">৳ {safeMoney(selectedVoucher.amount)}</span>
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-slate-100 dark:border-zinc-800">
              <Button type="button" variant="outline" size="sm" onClick={() => setSelectedVoucher(null)}>
                {lang === 'bn' ? 'বন্ধ করুন' : 'Close'}
              </Button>
              <Button
                type="button"
                size="sm"
                onClick={() => printExpenseVoucher({ expense: selectedVoucher, shop: mongoShop, lang })}
                className="bg-[#00df89] hover:bg-[#00c97b] text-[#011812] font-semibold gap-1.5"
              >
                <Printer className="w-3.5 h-3.5" />
                <span>{lang === 'bn' ? 'প্রিন্ট ভাউচার' : 'Print Voucher'}</span>
              </Button>
            </div>
          </Card>
        </div>
      )}

      {/* ---------------------------------------------------- */}
      {/* EDIT SALE TRANSACTION MODAL                          */}
      {/* ---------------------------------------------------- */}
      {isEditSaleModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs">
          <Card className="max-w-md w-full p-6 bg-white dark:bg-[#121215] border border-slate-200 dark:border-zinc-800 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-zinc-800 pb-3">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-blue-500/15 flex items-center justify-center text-blue-600">
                  <Edit2 className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-bold text-base text-slate-900 dark:text-white">
                    {lang === 'bn' ? 'বিক্রয় ইনভয়েস সম্পাদন' : 'Edit Sale Invoice'}
                  </h3>
                  <p className="text-xs text-slate-400 font-mono">{editSaleForm.invoice_number}</p>
                </div>
              </div>
              <button
                onClick={() => {
                  setIsEditSaleModalOpen(false);
                  setEditingSale(null);
                }}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-white p-1 rounded-lg cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleUpdateSaleSubmit} className="space-y-3.5 text-xs">
              {/* Payment Method Selector */}
              <div>
                <label className="block font-semibold mb-1 text-slate-700 dark:text-zinc-300">
                  {lang === 'bn' ? 'পেমেন্ট মাধ্যম' : 'Payment Method'}
                </label>
                <Select
                  value={editSaleForm.payment_method}
                  onValueChange={(val) => setEditSaleForm({ ...editSaleForm, payment_method: val })}
                >
                  <SelectTrigger className="w-full bg-slate-50 dark:bg-[#09090b]">
                    <SelectValue placeholder="Payment Method" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="cash">{lang === 'bn' ? 'নগদ (Cash)' : 'Cash'}</SelectItem>
                    <SelectItem value="bkash">{lang === 'bn' ? 'বিকাশ (bKash)' : 'bKash'}</SelectItem>
                    <SelectItem value="nagad">{lang === 'bn' ? 'নগদ (Nagad)' : 'Nagad'}</SelectItem>
                    <SelectItem value="rocket">{lang === 'bn' ? 'রকেট (Rocket)' : 'Rocket'}</SelectItem>
                    <SelectItem value="card">{lang === 'bn' ? 'কার্ড (Card)' : 'Card'}</SelectItem>
                    <SelectItem value="bank_transfer">{lang === 'bn' ? 'ব্যাংক ট্রান্সফার' : 'Bank Transfer'}</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Discount Inputs */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold mb-1 text-slate-700 dark:text-zinc-300">
                    {lang === 'bn' ? 'ডিসকাউন্টের ধরণ' : 'Discount Type'}
                  </label>
                  <Select
                    value={editSaleForm.discount_type}
                    onValueChange={(val) => setEditSaleForm({ ...editSaleForm, discount_type: val })}
                  >
                    <SelectTrigger className="w-full bg-slate-50 dark:bg-[#09090b]">
                      <SelectValue placeholder="Type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="flat">{lang === 'bn' ? 'নির্দিষ্ট টাকা (৳)' : 'Flat Amount (৳)'}</SelectItem>
                      <SelectItem value="percentage">{lang === 'bn' ? 'শতাংশ (%)' : 'Percentage (%)'}</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <label className="block font-semibold mb-1 text-slate-700 dark:text-zinc-300">
                    {lang === 'bn' ? 'ডিসকাউন্ট মান' : 'Discount Value'}
                  </label>
                  <input
                    type="number"
                    min="0"
                    step="any"
                    value={editSaleForm.discount_value}
                    onChange={(e) => setEditSaleForm({ ...editSaleForm, discount_value: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-[#09090b] border border-slate-200 dark:border-zinc-800 outline-none"
                    placeholder="0"
                  />
                </div>
              </div>

              {/* Paid Amount */}
              <div>
                <label className="block font-semibold mb-1 text-slate-700 dark:text-zinc-300">
                  {lang === 'bn' ? 'পরিশোধিত টাকা (৳)' : 'Paid Amount (৳)'}
                </label>
                <input
                  type="number"
                  min="0"
                  step="any"
                  value={editSaleForm.paid_amount}
                  onChange={(e) => setEditSaleForm({ ...editSaleForm, paid_amount: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-[#09090b] border border-slate-200 dark:border-zinc-800 outline-none"
                  placeholder="0.00"
                />
              </div>

              {/* Note / Remarks */}
              <div>
                <label className="block font-semibold mb-1 text-slate-700 dark:text-zinc-300">
                  {lang === 'bn' ? 'মন্তব্য / নোট' : 'Remarks / Note'}
                </label>
                <input
                  type="text"
                  value={editSaleForm.note}
                  onChange={(e) => setEditSaleForm({ ...editSaleForm, note: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-[#09090b] border border-slate-200 dark:border-zinc-800 outline-none"
                  placeholder={lang === 'bn' ? 'ইনভয়েস সংক্রান্ত বিশেষ নোট' : 'Invoice remarks...'}
                />
              </div>

              <div className="pt-3 flex justify-end gap-2 border-t border-slate-100 dark:border-zinc-800">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setIsEditSaleModalOpen(false);
                    setEditingSale(null);
                  }}
                >
                  {lang === 'bn' ? 'বাতিল' : 'Cancel'}
                </Button>
                <Button
                  type="submit"
                  disabled={isUpdatingSale}
                  size="sm"
                  className="bg-[#00df89] hover:bg-[#00c97b] text-[#011812] font-semibold"
                >
                  {isUpdatingSale ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : (lang === 'bn' ? 'সংরক্ষণ করুন' : 'Save Changes')}
                </Button>
              </div>
            </form>
          </Card>
        </div>
      )}

      {/* ---------------------------------------------------- */}
      {/* CONFIRM DELETE SALE MODAL                            */}
      {/* ---------------------------------------------------- */}
      <ConfirmDialog
        isOpen={confirmDeleteSale.isOpen}
        isLoading={isDeletingSale}
        title={lang === 'bn' ? `'${confirmDeleteSale.invoiceNumber}' ইনভয়েস মুছে ফেলতে চান?` : `Delete invoice '${confirmDeleteSale.invoiceNumber}'?`}
        description={lang === 'bn' ? 'এই বিক্রির রেকর্ডটি স্থায়ীভাবে মুছে ফেলা হবে এবং বিক্রিত পণ্যের স্টক ইনভেন্টরিতে ফেরত দেওয়া হবে।' : 'This sale will be permanently deleted and all sold items will be auto-restored back into stock inventory.'}
        confirmText={lang === 'bn' ? 'হ্যাঁ, মুছুন ও স্টক ফেরত নিন' : 'Yes, Delete & Restore'}
        cancelText={lang === 'bn' ? 'বাতিল' : 'Cancel'}
        onConfirm={handleConfirmDeleteSale}
        onCancel={() => setConfirmDeleteSale({ isOpen: false, saleId: null, invoiceNumber: '' })}
      />

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
