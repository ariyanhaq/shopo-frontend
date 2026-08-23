/**
 * @file Expenses.jsx
 * @description Comprehensive Business Expense Tracker & Operating Cost Ledger with live KPI stats, category breakdown visualizer, and voucher printing.
 */
import { useState, useMemo, useEffect } from 'react';
import { useLanguage } from '@/context/LanguageContext';
import { useAuth } from '@/context/AuthContext';
import api from '@/services/api';
import toast from 'react-hot-toast';
import { Card } from '@/components/ui/card';
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
import ConfirmDialog from '@/components/common/ConfirmDialog';
import { useBodyScrollLock } from '@/hooks/useBodyScrollLock';
import {
  DollarSign, Plus, Search, Calendar, Trash2, Edit2,
  Loader2, X, CheckCircle2, TrendingDown, Receipt, CreditCard,
  Banknote, Sparkles, AlertCircle, FileText, Printer, ArrowUpDown,
  Building, Zap, Truck, Megaphone, Coffee, Wrench, Globe, Tag
} from 'lucide-react';

const EXPENSE_CATEGORIES = [
  { id: 'Salary', labelBn: 'কর্মচারীর বেতন (Salary)', labelEn: 'Staff Salary' },
  { id: 'Rent', labelBn: 'দোকান ভাড়া', labelEn: 'Shop Rent' },
  { id: 'Utilities', labelBn: 'বিদ্যুৎ ও গ্যাস', labelEn: 'Utilities' },
  { id: 'Logistics', labelBn: 'পণ্য পরিবহন', labelEn: 'Logistics' },
  { id: 'Marketing', labelBn: 'বিজ্ঞাপন ও প্রচার', labelEn: 'Marketing' },
  { id: 'Entertainment', labelBn: 'নাস্তা ও আপ্যায়ন', labelEn: 'Tea & Snacks' },
  { id: 'Maintenance', labelBn: 'দোকান মেরামত', labelEn: 'Maintenance' },
  { id: 'Internet', labelBn: 'ইন্টারনেট ও বিল', labelEn: 'Internet' },
  { id: 'General', labelBn: 'বিবিধ খরচ', labelEn: 'Miscellaneous' },
];

const PAYMENT_METHODS = ['Cash', 'bKash', 'Nagad', 'Rocket', 'Bank Transfer', 'Card'];

const safeMoney = (val, fallback = 0) => {
  const n = Number(val);
  return isNaN(n) ? fallback.toLocaleString() : n.toLocaleString();
};

const safeDate = (val) => {
  if (!val) return 'N/A';
  const d = new Date(val);
  return isNaN(d.getTime()) ? String(val) : d.toLocaleDateString();
};

export default function Expenses() {
  const { lang } = useLanguage();
  const { mongoShop } = useAuth();

  const [expenses, setExpenses] = useState([]);
  const [stats, setStats] = useState({
    total_this_month: 0,
    total_today: 0,
    top_category: 'None',
    total_entries: 0,
  });
  const [isLoading, setIsLoading] = useState(true);

  // Search & Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');

  // Modal States
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingExpense, setEditingExpense] = useState(null);
  const [selectedVoucher, setSelectedVoucher] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Delete Confirm
  const [confirmDelete, setConfirmDelete] = useState({
    isOpen: false,
    expenseId: null,
    title: '',
  });
  const [isDeleting, setIsDeleting] = useState(false);

  useBodyScrollLock(
    Boolean(
      isCreateModalOpen ||
      isEditModalOpen ||
      selectedVoucher ||
      confirmDelete.isOpen
    )
  );

  const [form, setForm] = useState({
    title: '',
    category: 'General',
    amount: '',
    payment_method: 'Cash',
    reference_no: '',
    date: new Date().toISOString().split('T')[0],
    description: '',
  });

  const fetchExpenses = async () => {
    setIsLoading(true);
    try {
      const res = await api.expenses.list({ limit: 100 });
      const docs = Array.isArray(res?.data)
        ? res.data
        : Array.isArray(res?.data?.docs)
        ? res.data.docs
        : [];
      setExpenses(docs);

      if (res?.stats) {
        setStats(res.stats);
      } else {
        const now = new Date();
        const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

        const totalThisMonth = docs
          .filter((e) => new Date(e.date) >= startOfMonth)
          .reduce((sum, e) => sum + (Number(e.amount) || 0), 0);

        const totalToday = docs
          .filter((e) => new Date(e.date) >= startOfToday)
          .reduce((sum, e) => sum + (Number(e.amount) || 0), 0);

        setStats({
          total_this_month: totalThisMonth,
          total_today: totalToday,
          top_category: docs.length > 0 ? docs[0].category : 'General',
          total_entries: docs.length,
        });
      }
    } catch (err) {
      console.warn('Failed to load expenses:', err.message);
      toast.error('Failed to load expenses.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchExpenses();
  }, []);

  const handleOpenCreate = () => {
    setForm({
      title: '',
      category: 'General',
      amount: '',
      payment_method: 'Cash',
      reference_no: `EXP-${Date.now().toString().slice(-6)}`,
      date: new Date().toISOString().split('T')[0],
      description: '',
    });
    setIsCreateModalOpen(true);
  };

  const handleOpenEdit = (expense) => {
    setEditingExpense(expense);
    setForm({
      title: expense.title || '',
      category: expense.category || 'General',
      amount: String(expense.amount || ''),
      payment_method: expense.payment_method || 'Cash',
      reference_no: expense.reference_no || '',
      date: expense.date ? new Date(expense.date).toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
      description: expense.description || '',
    });
    setIsEditModalOpen(true);
  };

  const handleSubmitCreate = async (e) => {
    e.preventDefault();
    if (!form.title.trim() || !form.amount) {
      toast.error(lang === 'bn' ? 'অনুগ্রহ করে শিরোনাম ও টাকার পরিমাণ লিখুন।' : 'Please enter title and amount.');
      return;
    }

    setIsSubmitting(true);
    try {
      await api.expenses.create({
        ...form,
        amount: parseFloat(form.amount) || 0,
      });

      toast.success(lang === 'bn' ? 'খরচের ভাউচার যুক্ত হয়েছে!' : 'Expense recorded successfully!');
      setIsCreateModalOpen(false);
      fetchExpenses();
    } catch (err) {
      toast.error(err.message || 'Failed to record expense.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSubmitEdit = async (e) => {
    e.preventDefault();
    if (!editingExpense || !form.title.trim() || !form.amount) return;

    setIsSubmitting(true);
    try {
      await api.expenses.update(editingExpense._id, {
        ...form,
        amount: parseFloat(form.amount) || 0,
      });

      toast.success(lang === 'bn' ? 'খরচের তথ্য আপডেট করা হয়েছে!' : 'Expense updated successfully!');
      setIsEditModalOpen(false);
      setEditingExpense(null);
      fetchExpenses();
    } catch (err) {
      toast.error(err.message || 'Failed to update expense.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteExpense = (expenseId, title) => {
    setConfirmDelete({
      isOpen: true,
      expenseId,
      title,
    });
  };

  const handleConfirmDelete = async () => {
    if (!confirmDelete.expenseId) return;
    setIsDeleting(true);
    try {
      await api.expenses.delete(confirmDelete.expenseId);
      toast.success(lang === 'bn' ? 'খরচের এন্ট্রি মুছে ফেলা হয়েছে!' : 'Expense entry deleted.');
      setConfirmDelete({ isOpen: false, expenseId: null, title: '' });
      fetchExpenses();
    } catch (err) {
      toast.error(err.message || 'Failed to delete expense.');
    } finally {
      setIsDeleting(false);
    }
  };

  const filteredExpenses = useMemo(() => {
    return expenses.filter((e) => {
      const q = searchQuery.toLowerCase().trim();
      const matchesSearch =
        !q ||
        (e.title && e.title.toLowerCase().includes(q)) ||
        (e.category && e.category.toLowerCase().includes(q)) ||
        (e.reference_no && e.reference_no.toLowerCase().includes(q)) ||
        (e.description && e.description.toLowerCase().includes(q));

      const matchesCategory =
        categoryFilter === 'all' || e.category?.toLowerCase() === categoryFilter.toLowerCase();

      return matchesSearch && matchesCategory;
    });
  }, [expenses, searchQuery, categoryFilter]);

  return (
    <div className="space-y-6 font-sans pb-12">
      
      {/* ---------------------------------------------------- */}
      {/* HEADER SECTION                                       */}
      {/* ---------------------------------------------------- */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white tracking-tight flex items-center gap-2.5">
            <DollarSign className="w-6 h-6 text-[#00df89]" />
            <span>{lang === 'bn' ? 'দোকানের খরচ ও ব্যয়' : 'Business Expenses'}</span>
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-zinc-400 font-normal mt-0.5">
            {lang === 'bn'
              ? 'দোকান ভাড়া, বিদ্যুৎ বিল, পরিবহন, আপ্যায়ন ও অন্যান্য পরিচালন খরচের হিসাব'
              : 'Track store rent, electricity, utility bills, logistics, tea and all operational costs.'}
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            onClick={handleOpenCreate}
            className="bg-[#00df89] hover:bg-[#00c97b] text-[#011812] font-semibold text-xs sm:text-sm h-10 px-4 gap-2 shadow-xs cursor-pointer"
          >
            <Plus className="w-4 h-4 stroke-[2.5]" />
            <span>{lang === 'bn' ? 'নতুন খরচ লিখুন' : 'Record Expense'}</span>
          </Button>
        </div>
      </div>

      {/* ---------------------------------------------------- */}
      {/* KPI STAT CARDS                                       */}
      {/* ---------------------------------------------------- */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="p-4 sm:p-5 border-slate-200/90 dark:border-zinc-800/80 dark:bg-[#121215]">
          <span className="text-xs sm:text-sm font-medium text-slate-500 dark:text-zinc-400">Total Expenses This Month</span>
          <div className="text-2xl sm:text-3xl font-bold text-rose-600 dark:text-rose-400 mt-2">
            {isLoading ? <Skeleton className="h-8 w-28 my-0.5" /> : `৳ ${safeMoney(stats.total_this_month)}`}
          </div>
          <div className="text-xs text-slate-500 mt-1">{new Date().toLocaleString('default', { month: 'long' })} expenditure</div>
        </Card>

        <Card className="p-4 sm:p-5 border-slate-200/90 dark:border-zinc-800/80 dark:bg-[#121215]">
          <span className="text-xs sm:text-sm font-medium text-slate-500 dark:text-zinc-400">Today's Total Expenses</span>
          <div className="text-2xl sm:text-3xl font-bold text-amber-500 mt-2">
            {isLoading ? <Skeleton className="h-8 w-24 my-0.5" /> : `৳ ${safeMoney(stats.total_today)}`}
          </div>
          <div className="text-xs text-amber-500 mt-1">Today's cash-out</div>
        </Card>

        <Card className="p-4 sm:p-5 border-slate-200/90 dark:border-zinc-800/80 dark:bg-[#121215]">
          <span className="text-xs sm:text-sm font-medium text-slate-500 dark:text-zinc-400">Top Spending Sector</span>
          <div className="text-2xl sm:text-3xl font-bold text-slate-900 dark:text-white mt-2 truncate">
            {isLoading ? <Skeleton className="h-8 w-24 my-0.5" /> : (stats.top_category || 'General')}
          </div>
          <div className="text-xs text-slate-500 mt-1">Highest spend category</div>
        </Card>

        <Card className="p-4 sm:p-5 border-slate-200/90 dark:border-zinc-800/80 dark:bg-[#121215]">
          <span className="text-xs sm:text-sm font-medium text-slate-500 dark:text-zinc-400">Total Expense Records</span>
          <div className="text-2xl sm:text-3xl font-bold text-slate-900 dark:text-white mt-2">
            {isLoading ? <Skeleton className="h-8 w-20 my-0.5" /> : expenses.length}
          </div>
          <div className="text-xs text-slate-500 mt-1">Recorded entries</div>
        </Card>
      </div>

      {/* ---------------------------------------------------- */}
      {/* FILTER & SEARCH BAR                                  */}
      {/* ---------------------------------------------------- */}
      <Card className="p-4 border-slate-200/90 dark:border-zinc-800/80 dark:bg-[#121215]">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="w-full sm:w-80 relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder={lang === 'bn' ? 'খরচের শিরোনাম, খাত বা ভাউচার খুঁজুন...' : 'Search by title, category, ref...'}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-2 rounded-xl bg-slate-50 dark:bg-[#09090b] border border-slate-200 dark:border-zinc-800 text-xs text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-[#00df89]"
            />
          </div>

          <div className="flex items-center gap-1.5 overflow-x-auto w-full sm:w-auto pb-1 sm:pb-0">
            {['all', 'Salary', 'Rent', 'Utilities', 'Logistics', 'Marketing', 'Entertainment', 'General'].map((cat) => (
              <button
                key={cat}
                onClick={() => setCategoryFilter(cat)}
                className={`px-3 py-1.5 rounded-xl text-xs font-semibold uppercase transition-all cursor-pointer whitespace-nowrap shrink-0 ${
                  categoryFilter.toLowerCase() === cat.toLowerCase()
                    ? 'bg-slate-900 text-white dark:bg-zinc-800'
                    : 'bg-slate-100 dark:bg-zinc-900 text-slate-600 dark:text-zinc-400'
                }`}
              >
                {cat === 'Salary' ? (lang === 'bn' ? 'বেতন' : 'Salary') : cat}
              </button>
            ))}
          </div>
        </div>
      </Card>

      {/* ---------------------------------------------------- */}
      {/* EXPENSES DATA TABLE                                  */}
      {/* ---------------------------------------------------- */}
      <Card className="p-0 border-slate-200/90 dark:border-zinc-800/80 dark:bg-[#121215] overflow-hidden">
        {isLoading ? (
          <div className="p-5 space-y-3">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <Skeleton key={i} className="h-12 w-full" />
            ))}
          </div>
        ) : filteredExpenses.length === 0 ? (
          <div className="p-12 text-center space-y-3">
            <DollarSign className="w-10 h-10 text-slate-300 dark:text-zinc-600 mx-auto" />
            <h3 className="text-sm font-semibold text-slate-800 dark:text-zinc-200">
              {lang === 'bn' ? 'কোনো খরচের এন্ট্রি পাওয়া যায়নি' : 'No Expense Records Found'}
            </h3>
            <p className="text-xs text-slate-500 dark:text-zinc-400">
              {lang === 'bn' ? 'নতুন খরচ যোগ করতে উপরের বাটনে ক্লিক করুন।' : 'Record your store utility bills, rent, and operational costs.'}
            </p>
            <Button size="sm" onClick={handleOpenCreate} className="bg-[#00df89] hover:bg-[#00c97b] text-[#011812] text-xs font-semibold">
              <Plus className="w-3.5 h-3.5 mr-1" />
              {lang === 'bn' ? 'নতুন খরচ লিখুন' : 'Record Expense'}
            </Button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-200/90 dark:border-zinc-800/80 bg-slate-50 dark:bg-[#09090b] text-slate-500 dark:text-zinc-400 font-medium">
                  <th className="p-3.5 pl-4 sm:pl-6 text-xs font-semibold">{lang === 'bn' ? 'তারিখ ও ভাউচার' : 'Date & Voucher'}</th>
                  <th className="p-3.5 text-xs font-semibold">{lang === 'bn' ? 'খরচের শিরোনাম ও খাত' : 'Expense Title & Category'}</th>
                  <th className="p-3.5 text-xs font-semibold">{lang === 'bn' ? 'পেমেন্ট মাধ্যম' : 'Payment Method'}</th>
                  <th className="p-3.5 text-xs font-semibold">{lang === 'bn' ? 'বিবরণ / নোট' : 'Remarks'}</th>
                  <th className="p-3.5 text-xs font-semibold text-right">{lang === 'bn' ? 'টাকার পরিমাণ' : 'Amount'}</th>
                  <th className="p-3.5 pr-4 sm:pr-6 text-xs font-semibold text-right">{lang === 'bn' ? 'অ্যাকশন' : 'Actions'}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-zinc-800/80">
                {filteredExpenses.map((exp) => (
                  <tr key={exp._id} className="hover:bg-slate-50/70 dark:hover:bg-zinc-900/40 transition-colors">
                    <td className="p-3.5 pl-4 sm:pl-6 whitespace-nowrap text-xs">
                      <div className="font-bold text-slate-900 dark:text-white">
                        {safeDate(exp.date)}
                      </div>
                      <div className="text-[10px] text-slate-400 font-mono mt-0.5">
                        {exp.reference_no || 'EXP-0000'}
                      </div>
                    </td>

                    <td className="p-3.5 whitespace-nowrap text-xs">
                      <div className="font-bold text-slate-900 dark:text-zinc-100">
                        {exp.title}
                      </div>
                      <div className="text-[11px] text-amber-600 dark:text-amber-400 font-medium mt-0.5">
                        {exp.category || 'General'}
                      </div>
                    </td>

                    <td className="p-3.5 whitespace-nowrap text-xs">
                      <Badge
                        variant="secondary"
                        className="text-[10px] font-semibold bg-slate-100 dark:bg-zinc-800 text-slate-700 dark:text-zinc-300 uppercase"
                      >
                        {exp.payment_method || 'Cash'}
                      </Badge>
                    </td>

                    <td className="p-3.5 text-xs text-slate-500 max-w-xs truncate">
                      {exp.description || <span className="text-slate-400 italic">None</span>}
                    </td>

                    <td className="p-3.5 text-right font-bold text-rose-600 dark:text-rose-400 font-mono text-xs whitespace-nowrap">
                      - ৳ {safeMoney(exp.amount)}
                    </td>

                    <td className="p-3.5 pr-4 sm:pr-6 text-right whitespace-nowrap">
                      <div className="flex items-center justify-end gap-1.5">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setSelectedVoucher(exp)}
                          className="h-7 text-xs px-2.5 text-[#00a86b] dark:text-[#00df89] hover:bg-emerald-500/10 gap-1 font-semibold cursor-pointer"
                          title="View Voucher"
                        >
                          <FileText className="w-3.5 h-3.5" />
                          <span>{lang === 'bn' ? 'ভাউচার' : 'Voucher'}</span>
                        </Button>

                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleOpenEdit(exp)}
                          className="h-7 w-7 p-0 text-slate-500 hover:text-slate-900 dark:hover:text-white cursor-pointer"
                          title="Edit Expense"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </Button>

                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDeleteExpense(exp._id, exp.title)}
                          className="h-7 w-7 p-0 text-rose-500 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 cursor-pointer"
                          title="Delete Expense"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </Button>
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
      {/* RECORD / EDIT EXPENSE MODAL                          */}
      {/* ---------------------------------------------------- */}
      {(isCreateModalOpen || isEditModalOpen) && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs">
          <Card className="max-w-lg w-full p-6 bg-white dark:bg-[#121215] border-slate-200 dark:border-zinc-800 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-zinc-800 pb-3">
              <h2 className="text-base font-bold text-slate-900 dark:text-white">
                {isEditModalOpen
                  ? (lang === 'bn' ? 'খরচের তথ্য সম্পাদন' : 'Edit Expense Details')
                  : (lang === 'bn' ? 'নতুন খরচ লিখুন' : 'Record Business Expense')}
              </h2>
              <button
                onClick={() => {
                  setIsCreateModalOpen(false);
                  setIsEditModalOpen(false);
                }}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-white p-1 rounded-lg cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={isEditModalOpen ? handleSubmitEdit : handleSubmitCreate} className="space-y-3.5 text-xs">
              <div>
                <label className="block font-medium mb-1 text-slate-700 dark:text-zinc-300">
                  {lang === 'bn' ? 'খরচের বিবরণ / শিরোনাম *' : 'Expense Title / Description *'}
                </label>
                <input
                  type="text"
                  required
                  placeholder={lang === 'bn' ? 'যেমন: দোকান ভাড়া (মে মাস) বা বিদ্যুৎ বিল' : 'e.g. Shop Rent for May, Electricity Bill'}
                  value={form.title}
                  onChange={(e) => setForm({ ...form, title: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-[#09090b] border border-slate-200 dark:border-zinc-800 outline-none focus:ring-2 focus:ring-[#00df89] text-xs"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-medium mb-1 text-slate-700 dark:text-zinc-300">
                    {lang === 'bn' ? 'খরচের খাত (Category) *' : 'Expense Category *'}
                  </label>
                  <Select
                    value={form.category}
                    onValueChange={(val) => setForm({ ...form, category: val })}
                  >
                    <SelectTrigger className="h-9 text-xs bg-slate-50 dark:bg-[#09090b] border-slate-200 dark:border-zinc-800">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {EXPENSE_CATEGORIES.map((c) => (
                        <SelectItem key={c.id} value={c.id}>
                          {lang === 'bn' ? c.labelBn : c.labelEn}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <label className="block font-medium mb-1 text-slate-700 dark:text-zinc-300">
                    {lang === 'bn' ? 'টাকার পরিমাণ (৳) *' : 'Amount (৳) *'}
                  </label>
                  <input
                    type="number"
                    min="1"
                    step="any"
                    required
                    placeholder="0.00"
                    value={form.amount}
                    onChange={(e) => setForm({ ...form, amount: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-[#09090b] border border-slate-200 dark:border-zinc-800 outline-none font-mono text-xs"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block font-medium mb-1 text-slate-700 dark:text-zinc-300">
                    {lang === 'bn' ? 'পেমেন্ট মাধ্যম' : 'Payment Method'}
                  </label>
                  <Select
                    value={form.payment_method}
                    onValueChange={(val) => setForm({ ...form, payment_method: val })}
                  >
                    <SelectTrigger className="h-9 text-xs bg-slate-50 dark:bg-[#09090b] border-slate-200 dark:border-zinc-800">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {PAYMENT_METHODS.map((m) => (
                        <SelectItem key={m} value={m}>
                          {m}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <label className="block font-medium mb-1 text-slate-700 dark:text-zinc-300">
                    {lang === 'bn' ? 'ভাউচার / রেফারেন্স নং' : 'Voucher / Ref No'}
                  </label>
                  <input
                    type="text"
                    placeholder="EXP-1002"
                    value={form.reference_no}
                    onChange={(e) => setForm({ ...form, reference_no: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-[#09090b] border border-slate-200 dark:border-zinc-800 outline-none font-mono text-xs"
                  />
                </div>

                <div>
                  <label className="block font-medium mb-1 text-slate-700 dark:text-zinc-300">
                    {lang === 'bn' ? 'তারিখ' : 'Date'}
                  </label>
                  <input
                    type="date"
                    value={form.date}
                    onChange={(e) => setForm({ ...form, date: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-[#09090b] border border-slate-200 dark:border-zinc-800 outline-none text-xs"
                  />
                </div>
              </div>

              <div>
                <label className="block font-medium mb-1 text-slate-700 dark:text-zinc-300">
                  {lang === 'bn' ? 'মন্তব্য (ঐচ্ছিক)' : 'Remarks / Note'}
                </label>
                <input
                  type="text"
                  placeholder="e.g. Paid directly by manager"
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-[#09090b] border border-slate-200 dark:border-zinc-800 outline-none text-xs"
                />
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-100 dark:border-zinc-800">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setIsCreateModalOpen(false);
                    setIsEditModalOpen(false);
                  }}
                  className="cursor-pointer"
                >
                  {lang === 'bn' ? 'বাতিল' : 'Cancel'}
                </Button>
                <Button
                  type="submit"
                  disabled={isSubmitting}
                  size="sm"
                  className="bg-[#00df89] hover:bg-[#00c97b] text-[#011812] font-semibold cursor-pointer"
                >
                  {isSubmitting ? (
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  ) : isEditModalOpen ? (
                    lang === 'bn' ? 'আপডেট করুন' : 'Save Changes'
                  ) : (
                    lang === 'bn' ? 'খরচ নিশ্চিত করুন' : 'Confirm Expense'
                  )}
                </Button>
              </div>
            </form>
          </Card>
        </div>
      )}

      {/* ---------------------------------------------------- */}
      {/* EXPENSE VOUCHER / SLIP VIEW MODAL                    */}
      {/* ---------------------------------------------------- */}
      {selectedVoucher && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs">
          <Card className="max-w-md w-full p-6 bg-white dark:bg-[#121215] border-slate-200 dark:border-zinc-800 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-zinc-800 pb-3">
              <div>
                <h2 className="text-base font-bold text-slate-900 dark:text-white">
                  {lang === 'bn' ? 'খরচের ডেবিট ভাউচার' : 'Expense Debit Voucher'}
                </h2>
                <p className="text-xs text-slate-400 font-mono">{selectedVoucher.reference_no || 'EXP-0000'}</p>
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
                <p className="text-[11px] text-slate-400">{safeDate(selectedVoucher.date)}</p>
                <Badge className="bg-rose-500/15 text-rose-600 dark:text-rose-400 border-rose-500/30 text-[10px] font-bold mt-1">
                  DEBIT VOUCHER
                </Badge>
              </div>

              <div className="space-y-1.5 text-xs">
                <div className="flex justify-between">
                  <span className="text-slate-500">{lang === 'bn' ? 'খরচের শিরোনাম:' : 'Expense Title:'}</span>
                  <span className="font-bold text-slate-900 dark:text-white">{selectedVoucher.title}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">{lang === 'bn' ? 'ব্যয়ের খাত:' : 'Category:'}</span>
                  <span className="font-semibold text-amber-600">{selectedVoucher.category}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">{lang === 'bn' ? 'পেমেন্ট মাধ্যম:' : 'Payment Method:'}</span>
                  <span className="font-semibold uppercase">{selectedVoucher.payment_method || 'Cash'}</span>
                </div>
                {selectedVoucher.description && (
                  <div className="flex justify-between">
                    <span className="text-slate-500">{lang === 'bn' ? 'বিবরণ / নোট:' : 'Remarks:'}</span>
                    <span className="text-slate-700 dark:text-zinc-300">{selectedVoucher.description}</span>
                  </div>
                )}

                <div className="pt-2 border-t border-slate-200 dark:border-zinc-800 flex justify-between items-center text-sm font-bold text-slate-900 dark:text-white">
                  <span>{lang === 'bn' ? 'পরিশোধিত টাকার পরিমাণ:' : 'Total Amount Paid:'}</span>
                  <span className="text-rose-600 dark:text-rose-400 font-mono text-base">
                    - ৳ {safeMoney(selectedVoucher.amount)}
                  </span>
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-3 border-t border-slate-100 dark:border-zinc-800">
              <Button variant="outline" size="sm" onClick={() => setSelectedVoucher(null)} className="cursor-pointer">
                {lang === 'bn' ? 'বন্ধ করুন' : 'Close'}
              </Button>
              <Button
                size="sm"
                onClick={() => window.print()}
                className="bg-[#00df89] hover:bg-[#00c97b] text-[#011812] font-semibold gap-1 cursor-pointer"
              >
                <Printer className="w-3.5 h-3.5" /> {lang === 'bn' ? 'ভাউচার প্রিন্ট' : 'Print Voucher'}
              </Button>
            </div>
          </Card>
        </div>
      )}

      {/* ---------------------------------------------------- */}
      {/* CONFIRM DELETE DIALOG                                */}
      {/* ---------------------------------------------------- */}
      <ConfirmDialog
        isOpen={confirmDelete.isOpen}
        isLoading={isDeleting}
        title={lang === 'bn' ? `'${confirmDelete.title}' খরচের হিসাব মুছে ফেলতে চান?` : `Delete expense '${confirmDelete.title}'?`}
        description={lang === 'bn' ? 'এই খরচের ভাউচারটি স্থায়ীভাবে মুছে ফেলা হবে।' : 'This expense transaction will be permanently removed from your accounting ledger.'}
        confirmText={lang === 'bn' ? 'হ্যাঁ, মুছে ফেলুন' : 'Yes, Delete'}
        cancelText={lang === 'bn' ? 'বাতিল' : 'Cancel'}
        onConfirm={handleConfirmDelete}
        onCancel={() => setConfirmDelete({ isOpen: false, expenseId: null, title: '' })}
      />

    </div>
  );
}
