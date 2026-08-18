/**
 * @file Suppliers.jsx
 * @description Comprehensive Supplier Management directory with balance tracking, inline CRUD, and purchase history.
 */
import { useState, useEffect, useMemo } from 'react';
import { useLanguage } from '@/context/LanguageContext';
import { api } from '@/services/api';
import {
  Building2, Plus, Search, Phone, Mail, MapPin,
  Edit2, Trash2, Receipt, ArrowUpDown, ChevronRight,
  TrendingUp, AlertCircle, CheckCircle2, Loader2, X,
  ShoppingBag, Calendar, DollarSign, CreditCard
} from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem
} from '@/components/ui/select';
import ConfirmDialog from '@/components/common/ConfirmDialog';
import toast from 'react-hot-toast';

export default function Suppliers() {
  const { lang } = useLanguage();

  const [suppliers, setSuppliers] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [dueFilter, setDueFilter] = useState('all');

  // Modal States
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingSupplier, setEditingSupplier] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Supplier Form
  const [formData, setFormData] = useState({
    name: '',
    company_name: '',
    phone: '',
    email: '',
    address: '',
    notes: '',
  });

  // History Drawer State
  const [historyDrawer, setHistoryDrawer] = useState({
    isOpen: false,
    supplier: null,
    purchases: [],
    isLoading: false,
  });

  // Delete Confirm Dialog
  const [deleteDialog, setDeleteDialog] = useState({
    isOpen: false,
    supplier: null,
    isDeleting: false,
  });

  // Fetch Suppliers
  const fetchSuppliers = async () => {
    setIsLoading(true);
    try {
      const res = await api.suppliers.list();
      setSuppliers(Array.isArray(res?.data) ? res.data : []);
    } catch (err) {
      console.warn('Failed to load suppliers:', err);
      toast.error(err.message || 'Failed to load suppliers');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchSuppliers();
  }, []);

  // Filter Suppliers
  const filteredSuppliers = useMemo(() => {
    const q = searchQuery.toLowerCase().trim();
    return suppliers.filter((s) => {
      // Search query
      const name = (s.name || '').toLowerCase();
      const company = (s.company_name || '').toLowerCase();
      const phone = (s.phone || '').toLowerCase();
      const email = (s.email || '').toLowerCase();
      const matchesSearch = !q || name.includes(q) || company.includes(q) || phone.includes(q) || email.includes(q);

      // Due Filter
      if (!matchesSearch) return false;
      if (dueFilter === 'due') return (s.total_due || 0) > 0;
      if (dueFilter === 'paid') return (s.total_due || 0) <= 0;
      return true;
    });
  }, [suppliers, searchQuery, dueFilter]);

  // Metrics
  const totalSuppliersCount = suppliers.length;
  const totalPurchasesAmount = suppliers.reduce((acc, s) => acc + (s.total_purchases || 0), 0);
  const totalPaidAmount = suppliers.reduce((acc, s) => acc + (s.total_paid || 0), 0);
  const totalDueAmount = suppliers.reduce((acc, s) => acc + (s.total_due || 0), 0);

  // Open Create/Edit Modal
  const handleOpenModal = (supplier = null) => {
    if (supplier) {
      setEditingSupplier(supplier);
      setFormData({
        name: supplier.name || '',
        company_name: supplier.company_name || '',
        phone: supplier.phone || '',
        email: supplier.email || '',
        address: supplier.address || '',
        notes: supplier.notes || '',
      });
    } else {
      setEditingSupplier(null);
      setFormData({
        name: '',
        company_name: '',
        phone: '',
        email: '',
        address: '',
        notes: '',
      });
    }
    setIsModalOpen(true);
  };

  // Submit Supplier Form
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.name.trim()) return;

    setIsSubmitting(true);
    try {
      if (editingSupplier) {
        await api.suppliers.update(editingSupplier._id, formData);
        toast.success(lang === 'bn' ? 'সাপ্লায়ার আপডেট সম্পন্ন হয়েছে!' : 'Supplier updated successfully!');
      } else {
        await api.suppliers.create(formData);
        toast.success(lang === 'bn' ? 'নতুন সাপ্লায়ার যুক্ত হয়েছে!' : 'Supplier added successfully!');
      }
      setIsModalOpen(false);
      fetchSuppliers();
    } catch (err) {
      toast.error(err.message || 'Failed to save supplier');
    } finally {
      setIsSubmitting(false);
    }
  };

  // View Supplier Purchase History
  const handleOpenHistory = async (supplier) => {
    setHistoryDrawer({
      isOpen: true,
      supplier,
      purchases: [],
      isLoading: true,
    });

    try {
      const res = await api.suppliers.getPurchases(supplier._id);
      setHistoryDrawer((prev) => ({
        ...prev,
        purchases: Array.isArray(res?.data) ? res.data : [],
        isLoading: false,
      }));
    } catch (err) {
      toast.error(err.message || 'Failed to fetch purchase history');
      setHistoryDrawer((prev) => ({ ...prev, isLoading: false }));
    }
  };

  // Confirm Delete
  const handleConfirmDelete = async () => {
    if (!deleteDialog.supplier) return;
    setDeleteDialog((prev) => ({ ...prev, isDeleting: true }));
    try {
      await api.suppliers.delete(deleteDialog.supplier._id);
      toast.success(lang === 'bn' ? 'সাপ্লায়ার মুছে ফেলা হয়েছে' : 'Supplier deleted successfully');
      setDeleteDialog({ isOpen: false, supplier: null, isDeleting: false });
      fetchSuppliers();
    } catch (err) {
      toast.error(err.message || 'Failed to delete supplier');
      setDeleteDialog((prev) => ({ ...prev, isDeleting: false }));
    }
  };

  return (
    <div className="space-y-6 font-sans pb-12">
      
      {/* ---------------------------------------------------- */}
      {/* TOP HEADER & ACTION ROW                              */}
      {/* ---------------------------------------------------- */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white tracking-tight flex items-center gap-2.5">
            <Building2 className="w-6 h-6 text-[#00df89]" />
            <span>{lang === 'bn' ? 'সাপ্লায়ার ও সরবরাহকারী ডিরেক্টরি' : 'Suppliers & Vendor Directory'}</span>
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-zinc-400 font-normal mt-0.5">
            {lang === 'bn'
              ? 'আপনার ব্যবসার সরবরাহকারী তালিকা, ক্রয়ের হিসাব ও বাকি ব্যালেন্স পরিচালনা করুন'
              : 'Manage vendor contacts, procurement volumes, purchase histories, and track pending dues'}
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <Button
            onClick={() => handleOpenModal()}
            className="bg-[#00df89] hover:bg-[#00c97b] text-[#011812] font-semibold text-xs sm:text-sm h-10 px-4 gap-2 shadow-xs cursor-pointer"
          >
            <Plus className="w-4 h-4 stroke-[2.5]" />
            <span>{lang === 'bn' ? 'নতুন সাপ্লায়ার যোগ করুন' : 'Add Supplier'}</span>
          </Button>
        </div>
      </div>

      {/* ---------------------------------------------------- */}
      {/* SUMMARY STAT CARDS (4 Columns)                       */}
      {/* ---------------------------------------------------- */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="p-4 sm:p-5 border-slate-200/90 dark:border-zinc-800/80 dark:bg-[#121215]">
          <div className="flex items-center justify-between">
            <span className="text-xs sm:text-sm font-medium text-slate-500 dark:text-zinc-400">
              {lang === 'bn' ? 'মোট সাপ্লায়ার সংখ্যা' : 'Total Suppliers'}
            </span>
            <Building2 className="w-4 h-4 text-slate-400" />
          </div>
          <div className="text-2xl sm:text-3xl font-bold text-slate-900 dark:text-white mt-2">
            {isLoading ? <Skeleton className="h-8 w-20 my-0.5" /> : totalSuppliersCount}
          </div>
          <div className="text-xs text-slate-500 mt-1">
            {lang === 'bn' ? 'নিবন্ধিত ভেন্ডর প্রোফাইল' : 'Registered vendors in DB'}
          </div>
        </Card>

        <Card className="p-4 sm:p-5 border-slate-200/90 dark:border-zinc-800/80 dark:bg-[#121215]">
          <div className="flex items-center justify-between">
            <span className="text-xs sm:text-sm font-medium text-slate-500 dark:text-zinc-400">
              {lang === 'bn' ? 'মোট ক্রয়ের পরিমাণ' : 'Total Purchases'}
            </span>
            <ShoppingBag className="w-4 h-4 text-blue-500" />
          </div>
          <div className="text-2xl sm:text-3xl font-bold text-slate-900 dark:text-white mt-2">
            {isLoading ? <Skeleton className="h-8 w-28 my-0.5" /> : `৳ ${totalPurchasesAmount.toLocaleString()}`}
          </div>
          <div className="text-xs text-blue-500 mt-1">
            {lang === 'bn' ? 'সর্বমোট প্রোকিউরমেন্ট ব্যয়' : 'Lifetime procurement volume'}
          </div>
        </Card>

        <Card className="p-4 sm:p-5 border-slate-200/90 dark:border-zinc-800/80 dark:bg-[#121215]">
          <div className="flex items-center justify-between">
            <span className="text-xs sm:text-sm font-medium text-slate-500 dark:text-zinc-400">
              {lang === 'bn' ? 'পরিশোধিত অর্থ' : 'Paid to Suppliers'}
            </span>
            <CheckCircle2 className="w-4 h-4 text-emerald-500" />
          </div>
          <div className="text-2xl sm:text-3xl font-bold text-[#00a86b] dark:text-[#00df89] mt-2">
            {isLoading ? <Skeleton className="h-8 w-28 my-0.5" /> : `৳ ${totalPaidAmount.toLocaleString()}`}
          </div>
          <div className="text-xs text-[#00a86b] dark:text-[#00df89] mt-1">
            {lang === 'bn' ? 'সাপ্লায়ার পরিশোধ সম্পন্ন' : 'Settled balances'}
          </div>
        </Card>

        <Card className="p-4 sm:p-5 border-slate-200/90 dark:border-zinc-800/80 dark:bg-[#121215]">
          <div className="flex items-center justify-between">
            <span className="text-xs sm:text-sm font-medium text-slate-500 dark:text-zinc-400">
              {lang === 'bn' ? 'বকেয়া / পাওনা বাকি' : 'Outstanding Due'}
            </span>
            <AlertCircle className="w-4 h-4 text-amber-500" />
          </div>
          <div className="text-2xl sm:text-3xl font-bold text-amber-500 mt-2">
            {isLoading ? <Skeleton className="h-8 w-24 my-0.5" /> : `৳ ${totalDueAmount.toLocaleString()}`}
          </div>
          <div className="text-xs text-amber-500 mt-1">
            {lang === 'bn' ? 'সাপ্লায়ারের পাওনা বকেয়া' : 'Payables pending'}
          </div>
        </Card>
      </div>

      {/* ---------------------------------------------------- */}
      {/* SEARCH & FILTER BAR                                  */}
      {/* ---------------------------------------------------- */}
      <Card className="p-4 border-slate-200/90 dark:border-zinc-800/80 dark:bg-[#121215]">
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
          <div className="w-full sm:w-80 relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder={lang === 'bn' ? 'নাম, কোম্পানি, ফোন বা ইমেইল দিয়ে খুঁজুন...' : 'Search by name, company, phone, email...'}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-2 rounded-xl bg-slate-50 dark:bg-[#09090b] border border-slate-200 dark:border-zinc-800 text-xs text-slate-900 dark:text-white placeholder:text-slate-400 outline-none focus:ring-2 focus:ring-[#00df89]"
            />
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto">
            <div className="w-48 sm:w-56">
              <Select value={dueFilter} onValueChange={setDueFilter}>
                <SelectTrigger size="sm" className="bg-slate-50 dark:bg-[#09090b] w-full">
                  <SelectValue placeholder="All Suppliers" />
                </SelectTrigger>
                <SelectContent className="min-w-[200px]">
                  <SelectItem value="all">{lang === 'bn' ? 'সকল সাপ্লায়ার' : 'All Suppliers'}</SelectItem>
                  <SelectItem value="due">{lang === 'bn' ? 'বাকি আছে (With Due)' : 'With Outstanding Due'}</SelectItem>
                  <SelectItem value="paid">{lang === 'bn' ? 'কোনো বাকি নেই (Zero Due)' : 'Zero Due / Paid'}</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>
      </Card>

      {/* ---------------------------------------------------- */}
      {/* SUPPLIERS DATA TABLE                                 */}
      {/* ---------------------------------------------------- */}
      <Card className="p-0 border-slate-200/90 dark:border-zinc-800/80 dark:bg-[#121215] overflow-hidden">
        {isLoading ? (
          <div className="p-5 space-y-3">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <Skeleton key={i} className="h-12 w-full" />
            ))}
          </div>
        ) : filteredSuppliers.length === 0 ? (
          <div className="p-12 text-center space-y-3">
            <div className="w-14 h-14 rounded-2xl bg-slate-100 dark:bg-zinc-800/80 text-slate-400 flex items-center justify-center mx-auto">
              <Building2 className="w-7 h-7" />
            </div>
            <h3 className="text-sm font-semibold text-slate-800 dark:text-zinc-200">
              {lang === 'bn' ? 'কোনো সাপ্লায়ার পাওয়া যায়নি' : 'No Suppliers Found'}
            </h3>
            <p className="text-xs text-slate-500 dark:text-zinc-400 max-w-sm mx-auto">
              {lang === 'bn'
                ? 'পণ্য ক্রয়ের সময় বা সরাসরি "+ নতুন সাপ্লায়ার" বাটনে ক্লিক করে সাপ্লায়ার যোগ করুন।'
                : 'Add a new supplier to track purchases, invoice history, and balance due.'}
            </p>
            <div className="pt-2">
              <Button
                size="sm"
                onClick={() => handleOpenModal()}
                className="bg-[#00df89] hover:bg-[#00c97b] text-[#011812] font-semibold text-xs h-9 px-4 rounded-xl cursor-pointer"
              >
                <Plus className="w-4 h-4 mr-1" />
                <span>{lang === 'bn' ? 'সাপ্লায়ার যোগ করুন' : 'Add First Supplier'}</span>
              </Button>
            </div>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left text-slate-600 dark:text-zinc-300">
              <thead className="bg-slate-50 dark:bg-zinc-900/60 border-b border-slate-200 dark:border-zinc-800 text-[11px] font-bold text-slate-400 uppercase tracking-wider select-none">
                <tr>
                  <th className="py-3.5 px-4">{lang === 'bn' ? 'সাপ্লায়ার ও প্রতিষ্ঠান' : 'Supplier & Company'}</th>
                  <th className="py-3.5 px-4">{lang === 'bn' ? 'যোগাযোগ' : 'Contact Info'}</th>
                  <th className="py-3.5 px-4">{lang === 'bn' ? 'ঠিকানা' : 'Address'}</th>
                  <th className="py-3.5 px-4">{lang === 'bn' ? 'মোট ক্রয়' : 'Total Purchases'}</th>
                  <th className="py-3.5 px-4">{lang === 'bn' ? 'বাকি স্ট্যাটাস' : 'Due Status'}</th>
                  <th className="py-3.5 px-4 text-right">{lang === 'bn' ? 'অ্যাকশন' : 'Actions'}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-zinc-800/80">
                {filteredSuppliers.map((s) => (
                  <tr key={s._id} className="hover:bg-slate-50/60 dark:hover:bg-zinc-800/40 transition-colors">
                    <td className="py-3.5 px-4">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-[#00df89] font-bold flex items-center justify-center text-sm shrink-0 uppercase border border-emerald-500/20">
                          {s.name ? s.name.charAt(0) : 'S'}
                        </div>
                        <div>
                          <p className="font-bold text-slate-900 dark:text-white">{s.name}</p>
                          {s.company_name && (
                            <p className="text-[11px] text-slate-400 font-medium">{s.company_name}</p>
                          )}
                        </div>
                      </div>
                    </td>

                    <td className="py-3.5 px-4">
                      <div className="space-y-1 text-[11px]">
                        {s.phone ? (
                          <div className="flex items-center gap-1.5 text-slate-700 dark:text-zinc-300 font-mono">
                            <Phone className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                            <span>{s.phone}</span>
                          </div>
                        ) : (
                          <span className="text-slate-400">-</span>
                        )}
                        {s.email && (
                          <div className="flex items-center gap-1.5 text-slate-400">
                            <Mail className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                            <span>{s.email}</span>
                          </div>
                        )}
                      </div>
                    </td>

                    <td className="py-3.5 px-4">
                      {s.address ? (
                        <div className="flex items-center gap-1.5 text-[11px] text-slate-600 dark:text-zinc-400 max-w-xs truncate">
                          <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                          <span className="truncate">{s.address}</span>
                        </div>
                      ) : (
                        <span className="text-slate-400">-</span>
                      )}
                    </td>

                    <td className="py-3.5 px-4 font-bold font-mono text-slate-900 dark:text-white">
                      ৳{(s.total_purchases || 0).toLocaleString()}
                    </td>

                    <td className="py-3.5 px-4">
                      {(s.total_due || 0) > 0 ? (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-amber-500/15 text-amber-500 font-bold text-[11px]">
                          <DollarSign className="w-3 h-3" />
                          <span>৳{(s.total_due).toLocaleString()} {lang === 'bn' ? 'বাকি' : 'Due'}</span>
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-emerald-500/10 text-[#00a86b] dark:text-[#00df89] font-bold text-[11px]">
                          <CheckCircle2 className="w-3 h-3" />
                          <span>{lang === 'bn' ? 'পরিশোধিত' : 'Paid'}</span>
                        </span>
                      )}
                    </td>

                    <td className="py-3.5 px-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        {/* Purchase History */}
                        <button
                          type="button"
                          onClick={() => handleOpenHistory(s)}
                          title={lang === 'bn' ? 'ক্রয় ইনভয়েস ইতিহাস' : 'Purchase Invoices History'}
                          className="w-8 h-8 rounded-lg bg-slate-100 dark:bg-zinc-800 hover:bg-slate-200 dark:hover:bg-zinc-700 text-slate-600 dark:text-zinc-300 flex items-center justify-center transition-colors cursor-pointer"
                        >
                          <Receipt className="w-3.5 h-3.5" />
                        </button>
                        {/* Edit Supplier */}
                        <button
                          type="button"
                          onClick={() => handleOpenModal(s)}
                          title={lang === 'bn' ? 'সম্পাদনা করুন' : 'Edit'}
                          className="w-8 h-8 rounded-lg bg-blue-50 dark:bg-blue-950/40 hover:bg-blue-100 dark:hover:bg-blue-900/60 text-blue-600 dark:text-blue-400 flex items-center justify-center transition-colors cursor-pointer"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        {/* Delete Supplier */}
                        <button
                          type="button"
                          onClick={() => setDeleteDialog({ isOpen: true, supplier: s, isDeleting: false })}
                          title={lang === 'bn' ? 'মুছে ফেলুন' : 'Delete'}
                          className="w-8 h-8 rounded-lg bg-rose-50 dark:bg-rose-950/40 hover:bg-rose-100 dark:hover:bg-rose-900/60 text-rose-600 dark:text-rose-400 flex items-center justify-center transition-colors cursor-pointer"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      {/* Add / Edit Supplier Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs animate-in fade-in duration-150">
          <Card className="max-w-md w-full p-6 bg-white dark:bg-[#121215] border-slate-200 dark:border-zinc-800 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-zinc-800 pb-3">
              <h2 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <Building2 className="w-5 h-5 text-[#00df89]" />
                <span>
                  {editingSupplier
                    ? (lang === 'bn' ? 'সাপ্লায়ার তথ্য সম্পাদনা' : 'Edit Supplier Details')
                    : (lang === 'bn' ? 'নতুন সাপ্লায়ার যোগ করুন' : 'Add New Supplier')}
                </span>
              </h2>
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 p-1 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-3.5 text-xs">
              <div>
                <label className="block font-bold text-slate-700 dark:text-zinc-300 mb-1">
                  {lang === 'bn' ? 'সাপ্লায়ারের নাম *' : 'Supplier Name *'}
                </label>
                <input
                  type="text"
                  required
                  placeholder={lang === 'bn' ? 'যেমন: রহিম ব্রাদার্স / করিম ট্রেডার্স' : 'e.g. Acme Supplies / John Doe'}
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-[#09090b] border border-slate-200 dark:border-zinc-800 text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-[#00df89]"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 dark:text-zinc-300 mb-1">
                  {lang === 'bn' ? 'কোম্পানি বা প্রতিষ্ঠানের নাম' : 'Company Name'}
                </label>
                <input
                  type="text"
                  placeholder={lang === 'bn' ? 'যেমন: মেসার্স আলম ডিস্ট্রিবিউটর' : 'e.g. Apex Corporation'}
                  value={formData.company_name}
                  onChange={(e) => setFormData({ ...formData, company_name: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-[#09090b] border border-slate-200 dark:border-zinc-800 text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-[#00df89]"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 dark:text-zinc-300 mb-1">
                    {lang === 'bn' ? 'মোবাইল নম্বর' : 'Phone Number'}
                  </label>
                  <input
                    type="text"
                    placeholder="017XXXXXXXX"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-[#09090b] border border-slate-200 dark:border-zinc-800 text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-[#00df89]"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 dark:text-zinc-300 mb-1">
                    {lang === 'bn' ? 'ইমেইল এড্রেস' : 'Email Address'}
                  </label>
                  <input
                    type="email"
                    placeholder="supplier@example.com"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-[#09090b] border border-slate-200 dark:border-zinc-800 text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-[#00df89]"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 dark:text-zinc-300 mb-1">
                  {lang === 'bn' ? 'ঠিকানা / গুদাম অবস্থান' : 'Address / Location'}
                </label>
                <input
                  type="text"
                  placeholder={lang === 'bn' ? 'যেমন: চকবাজার, ঢাকা' : 'e.g. Road #4, Banani, Dhaka'}
                  value={formData.address}
                  onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-[#09090b] border border-slate-200 dark:border-zinc-800 text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-[#00df89]"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 dark:text-zinc-300 mb-1">
                  {lang === 'bn' ? 'অতিরিক্ত বিবরণ / নোট' : 'Notes / Remarks'}
                </label>
                <textarea
                  rows="2"
                  placeholder={lang === 'bn' ? 'সাপ্লায়ার সম্পর্কিত কোনো তথ্য...' : 'Any optional remarks...'}
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-[#09090b] border border-slate-200 dark:border-zinc-800 text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-[#00df89]"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100 dark:border-zinc-800">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setIsModalOpen(false)}
                  className="h-9 px-4 rounded-xl cursor-pointer"
                >
                  {lang === 'bn' ? 'বাতিল' : 'Cancel'}
                </Button>
                <Button
                  type="submit"
                  disabled={isSubmitting || !formData.name.trim()}
                  className="bg-[#00df89] hover:bg-[#00c97b] text-[#011812] font-bold text-xs h-9 px-4 rounded-xl cursor-pointer disabled:opacity-50"
                >
                  {isSubmitting ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : editingSupplier ? (
                    (lang === 'bn' ? 'আপডেট করুন' : 'Save Changes')
                  ) : (
                    (lang === 'bn' ? 'যুক্ত করুন' : 'Add Supplier')
                  )}
                </Button>
              </div>
            </form>
          </Card>
        </div>
      )}

      {/* Supplier Purchase History Modal */}
      {historyDrawer.isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs animate-in fade-in duration-150">
          <Card className="max-w-2xl w-full p-6 bg-white dark:bg-[#121215] border-slate-200 dark:border-zinc-800 space-y-4 shadow-2xl max-h-[85vh] flex flex-col">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-zinc-800 pb-3 shrink-0">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-blue-500/10 text-blue-500 flex items-center justify-center">
                  <Receipt className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-base font-bold text-slate-900 dark:text-white">
                    {historyDrawer.supplier?.name} — {lang === 'bn' ? 'ক্রয় ইতিহাস' : 'Purchase Invoices'}
                  </h2>
                  <p className="text-[11px] text-slate-400 font-medium">
                    {historyDrawer.supplier?.company_name || historyDrawer.supplier?.phone || ''}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setHistoryDrawer({ isOpen: false, supplier: null, purchases: [], isLoading: false })}
                className="text-slate-400 hover:text-slate-600 p-1 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto space-y-3 pr-1 text-xs">
              {historyDrawer.isLoading ? (
                <div className="py-12 text-center space-y-2">
                  <Loader2 className="w-6 h-6 animate-spin text-[#00df89] mx-auto" />
                  <p className="text-xs text-slate-400">
                    {lang === 'bn' ? 'ক্রয় ইতিহাস লোড হচ্ছে...' : 'Loading purchases...'}
                  </p>
                </div>
              ) : historyDrawer.purchases.length === 0 ? (
                <div className="py-12 text-center text-slate-400">
                  <ShoppingBag className="w-8 h-8 mx-auto mb-2 opacity-50" />
                  <p>{lang === 'bn' ? 'এই সাপ্লায়ারের কোনো ক্রয় রেকর্ড নেই' : 'No purchase records found for this supplier.'}</p>
                </div>
              ) : (
                historyDrawer.purchases.map((p) => (
                  <div
                    key={p._id}
                    className="p-3.5 rounded-2xl bg-slate-50 dark:bg-zinc-900/60 border border-slate-200/80 dark:border-zinc-800/80 space-y-2.5"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="font-mono font-bold text-slate-900 dark:text-white">
                          #{p.purchase_number}
                        </span>
                        <span className="text-[11px] text-slate-400 flex items-center gap-1">
                          <Calendar className="w-3 h-3" />
                          {new Date(p.created_at).toLocaleDateString()}
                        </span>
                      </div>
                      <span
                        className={`px-2 py-0.5 rounded-full font-bold text-[10px] uppercase ${
                          p.payment_status === 'paid'
                            ? 'bg-emerald-500/10 text-emerald-600'
                            : p.payment_status === 'partial'
                            ? 'bg-blue-500/10 text-blue-600'
                            : 'bg-amber-500/15 text-amber-500'
                        }`}
                      >
                        {p.payment_status}
                      </span>
                    </div>

                    {/* Items Purchased List */}
                    <div className="divide-y divide-slate-200/50 dark:divide-zinc-800/50 pt-1 text-[11px]">
                      {p.items?.map((item, idx) => (
                        <div key={idx} className="py-1 flex items-center justify-between text-slate-600 dark:text-zinc-300">
                          <span className="font-medium">{item.product_name} &times; {item.quantity}</span>
                          <span className="font-mono">৳{(item.total_cost || 0).toLocaleString()}</span>
                        </div>
                      ))}
                    </div>

                    <div className="flex items-center justify-between pt-1 border-t border-slate-200 dark:border-zinc-800 font-bold text-[11px]">
                      <span className="text-slate-500">
                        {lang === 'bn' ? 'পরিশোধ:' : 'Paid:'} ৳{(p.paid_amount || 0).toLocaleString()} / {lang === 'bn' ? 'বাকি:' : 'Due:'} <span className={p.due_amount > 0 ? 'text-amber-500' : ''}>৳{(p.due_amount || 0).toLocaleString()}</span>
                      </span>
                      <span className="text-slate-900 dark:text-white font-mono">
                        {lang === 'bn' ? 'মোট:' : 'Total:'} ৳{(p.net_amount || p.total_amount || 0).toLocaleString()}
                      </span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </Card>
        </div>
      )}

      {/* Delete Confirmation */}
      <ConfirmDialog
        isOpen={deleteDialog.isOpen}
        onCancel={() => setDeleteDialog({ isOpen: false, supplier: null, isDeleting: false })}
        onConfirm={handleConfirmDelete}
        isLoading={deleteDialog.isDeleting}
        title={lang === 'bn' ? 'সাপ্লায়ার মুছে ফেলতে চান?' : 'Delete Supplier?'}
        description={
          lang === 'bn'
            ? `আপনি কি নিশ্চিত যে '${deleteDialog.supplier?.name}' সাপ্লায়ারটিকে মুছে ফেলতে চান?`
            : `Are you sure you want to delete '${deleteDialog.supplier?.name}'?`
        }
        confirmText={lang === 'bn' ? 'মুছে ফেলুন' : 'Delete'}
        variant="danger"
      />
    </div>
  );
}
