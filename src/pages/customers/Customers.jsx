/**
 * @file Customers.jsx
 * @description Comprehensive Customer CRM & Purchase History Viewer with Edit/Delete customer profiles and Edit/Delete individual purchases.
 */
import { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useLanguage } from '@/context/LanguageContext';
import { useAuth } from '@/context/AuthContext';
import api from '@/services/api';
import toast from 'react-hot-toast';
import { printDueReceipt, printCustomerStatement } from '@/utils/invoicePrinter';
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
import Pagination from '@/components/common/Pagination';
import ReturnOrderModal from '@/components/sales/ReturnOrderModal';
import { useBodyScrollLock } from '@/hooks/useBodyScrollLock';
import {
  Users, Plus, Phone, Mail, MapPin, Search, Trash2, Edit2, Loader2,
  X, DollarSign, ShoppingBag, ArrowRight, FileText, Calendar,
  CreditCard, Banknote, Printer, ChevronRight, CheckCircle2, Clock,
  Coins, Percent, Sparkles, UserCheck, AlertTriangle, Crown, Star, Award, Undo2
} from 'lucide-react';

const getTierBadgeStyle = (rawColor = '#10b981') => {
  let hex = typeof rawColor === 'string' && rawColor.trim().startsWith('#') ? rawColor.trim() : '#10b981';
  if (hex.length === 4) {
    hex = `#${hex[1]}${hex[1]}${hex[2]}${hex[2]}${hex[3]}${hex[3]}`;
  }
  return {
    backgroundColor: `${hex}18`,
    color: hex,
    borderColor: `${hex}38`,
  };
};

export default function Customers() {
  const navigate = useNavigate();
  const { lang, t } = useLanguage();
  const { mongoShop } = useAuth();

  const [customers, setCustomers] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [membershipConfig, setMembershipConfig] = useState(null);

  // Edit Customer Profile State
  const [isEditCustomerModalOpen, setIsEditCustomerModalOpen] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState(null);
  const [editCustomerForm, setEditCustomerForm] = useState({
    id: '',
    name: '',
    phone: '',
    address: '',
    is_member: false,
    membership_tier: 'Regular',
    member_code: '',
    reward_points: 0,
  });

  // Customer Details & Purchase History State
  const [selectedCustomerId, setSelectedCustomerId] = useState(null);
  const [customerHistory, setCustomerHistory] = useState(null);
  const [isLoadingHistory, setIsLoadingHistory] = useState(false);

  // Collect Customer Due State
  const [isCollectCustomerDueOpen, setIsCollectCustomerDueOpen] = useState(false);
  const [collectingCustomer, setCollectingCustomer] = useState(null);
  const [isSubmittingCustomerDue, setIsSubmittingCustomerDue] = useState(false);
  const [customerDueForm, setCustomerDueForm] = useState({
    amount: '',
    payment_method: 'cash',
    note: '',
  });
  const [customerVoucher, setCustomerVoucher] = useState(null);

  // Edit Sale / Invoice from Customer History State
  const [isEditSaleModalOpen, setIsEditSaleModalOpen] = useState(false);
  const [editingSale, setEditingSale] = useState(null);

  // Return Sale / Invoice State
  const [returningSale, setReturningSale] = useState(null);

  useBodyScrollLock(
    Boolean(
      isAddModalOpen ||
      isEditCustomerModalOpen ||
      selectedCustomerId ||
      isCollectCustomerDueOpen ||
      isEditSaleModalOpen ||
      customerVoucher ||
      returningSale
    )
  );
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

  // Confirm Dialog States & Loaders
  const [isDeletingCustomer, setIsDeletingCustomer] = useState(false);
  const [isDeletingSale, setIsDeletingSale] = useState(false);
  const [confirmCustomerDelete, setConfirmCustomerDelete] = useState({
    isOpen: false,
    customerId: null,
    customerName: '',
  });
  const [confirmSaleDelete, setConfirmSaleDelete] = useState({
    isOpen: false,
    saleId: null,
    invoiceNumber: '',
  });

  // New Customer Form State
  const [form, setForm] = useState({
    name: '',
    phone: '',
    email: '',
    address: '',
    is_member: false,
    membership_tier: 'Regular',
    member_code: '',
    reward_points: 0,
  });

  const fetchCustomers = async () => {
    setIsLoading(true);
    try {
      const res = await api.customers.list();
      const rawList = Array.isArray(res?.data)
        ? res.data
        : Array.isArray(res?.data?.docs)
        ? res.data.docs
        : [];
      setCustomers(rawList);
    } catch (err) {
      console.warn('Failed to load customers from DB:', err.message);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchCustomers();
    api.membership.getSettings()
      .then((res) => {
        if (res?.data) setMembershipConfig(res.data);
      })
      .catch((err) => console.warn('Could not load membership config:', err));
  }, []);

  // Available active tiers configured in settings
  const activeTiers = useMemo(() => {
    if (Array.isArray(membershipConfig?.tiers) && membershipConfig.tiers.length > 0) {
      return membershipConfig.tiers.map((t) => (typeof t === 'string' ? { name: t } : t));
    }
    return [{ name: 'Regular' }];
  }, [membershipConfig?.tiers]);

  // Fetch full customer purchase history
  const handleOpenCustomerHistory = async (customer) => {
    setSelectedCustomerId(customer._id);
    setIsLoadingHistory(true);
    try {
      const res = await api.customers.getHistory(customer._id);
      if (res.data) {
        setCustomerHistory(res.data);
      } else {
        setCustomerHistory({ customer, sales: [] });
      }
    } catch (err) {
      toast.error('Failed to load customer purchase history.');
    } finally {
      setIsLoadingHistory(false);
    }
  };

  // Reload history without closing modal (e.g. after edit/delete invoice or customer due payment)
  const reloadCustomerHistory = async (customerId) => {
    try {
      const res = await api.customers.getHistory(customerId);
      if (res.data) {
        setCustomerHistory(res.data);
      }
    } catch (err) {
      console.warn('Failed to reload customer purchase history:', err.message);
    }
  };

  // Close history modal
  const handleCloseHistory = () => {
    setSelectedCustomerId(null);
    setCustomerHistory(null);
  };

  // Create Customer Profile
  const handleCreateCustomer = async (e) => {
    e.preventDefault();
    if (!form.name.trim() && !form.phone.trim()) {
      toast.error(lang === 'bn' ? 'অনুগ্রহ করে নাম অথবা ফোন নম্বর দিন।' : 'Please enter customer name or phone number.');
      return;
    }

    setIsSubmitting(true);
    try {
      await api.customers.create({
        name: form.name.trim() || `Customer (${form.phone.trim()})`,
        phone: form.phone.trim(),
        email: form.email.trim() || undefined,
        address: form.address.trim() || undefined,
        is_member: Boolean(form.is_member),
        membership_tier: form.membership_tier || 'Regular',
        member_code: form.member_code?.trim() || undefined,
        reward_points: Number(form.reward_points) || 0,
      });
      toast.success(lang === 'bn' ? 'কাস্টমার সফলভাবে যুক্ত হয়েছে!' : 'Customer created successfully!');
      setIsAddModalOpen(false);
      setForm({
        name: '',
        phone: '',
        email: '',
        address: '',
        is_member: false,
        membership_tier: 'Regular',
        member_code: '',
        reward_points: 0,
      });
      fetchCustomers();
    } catch (err) {
      toast.error(err.message || 'Failed to create customer.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Open Edit Customer Modal
  const handleOpenEditCustomer = (customer, e) => {
    e?.stopPropagation();
    setEditingCustomer(customer);
    setEditCustomerForm({
      id: customer._id,
      name: customer.name || '',
      phone: customer.phone || '',
      address: customer.address || '',
      is_member: Boolean(customer.is_member),
      membership_tier: customer.membership_tier || 'Regular',
      member_code: customer.member_code || '',
      reward_points: customer.reward_points || 0,
    });
    setIsEditCustomerModalOpen(true);
  };

  // Submit Edit Customer
  const handleUpdateCustomer = async (e) => {
    e.preventDefault();
    if (!editCustomerForm.id) return;

    setIsSubmitting(true);
    try {
      await api.customers.update(editCustomerForm.id, {
        name: editCustomerForm.name.trim(),
        phone: editCustomerForm.phone.trim(),
        address: editCustomerForm.address.trim(),
        is_member: Boolean(editCustomerForm.is_member),
        membership_tier: editCustomerForm.membership_tier || 'Regular',
        member_code: editCustomerForm.member_code?.trim() || undefined,
        reward_points: Number(editCustomerForm.reward_points) || 0,
      });
      toast.success(lang === 'bn' ? 'কাস্টমার প্রোফাইল আপডেট হয়েছে!' : 'Customer profile updated!');
      setIsEditCustomerModalOpen(false);
      setEditingCustomer(null);
      fetchCustomers();
      if (selectedCustomerId === editCustomerForm.id) {
        reloadCustomerHistory(editCustomerForm.id);
      }
    } catch (err) {
      toast.error(err.message || 'Failed to update customer profile.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Delete Customer Profile Request
  const handleDeleteCustomer = (customer, e) => {
    e?.stopPropagation();
    setConfirmCustomerDelete({
      isOpen: true,
      customerId: customer._id,
      customerName: customer.name || customer.phone || 'Customer',
    });
  };

  const handleConfirmDeleteCustomer = async () => {
    if (!confirmCustomerDelete.customerId) return;
    setIsDeletingCustomer(true);
    try {
      await api.customers.delete(confirmCustomerDelete.customerId);
      toast.success(lang === 'bn' ? `'${confirmCustomerDelete.customerName}' মুছে ফেলা হয়েছে!` : `'${confirmCustomerDelete.customerName}' deleted successfully!`);
      if (selectedCustomerId === confirmCustomerDelete.customerId) {
        handleCloseHistory();
      }
      setConfirmCustomerDelete({ isOpen: false, customerId: null, customerName: '' });
      fetchCustomers();
    } catch (err) {
      toast.error(err.message || 'Failed to delete customer.');
    } finally {
      setIsDeletingCustomer(false);
    }
  };

  // Open Collect Customer Due Modal
  const handleOpenCollectCustomerDue = (cust, e) => {
    if (e) e.stopPropagation();
    setCollectingCustomer(cust);
    setCustomerDueForm({
      amount: String(cust.total_due || 0),
      payment_method: 'cash',
      note: '',
    });
    setIsCollectCustomerDueOpen(true);
  };

  // Submit Collect Customer Due
  const handleSubmitCustomerDue = async (e) => {
    e.preventDefault();
    if (!collectingCustomer) return;

    const amountNum = parseFloat(customerDueForm.amount);
    if (isNaN(amountNum) || amountNum <= 0) {
      toast.error(lang === 'bn' ? 'সঠিক জমার পরিমাণ লিখুন (০ এর বেশি)।' : 'Please enter a valid payment amount greater than 0.');
      return;
    }

    setIsSubmittingCustomerDue(true);
    try {
      const custId = collectingCustomer._id || collectingCustomer.id;
      const res = await api.customers.collectDue(custId, {
        amount: amountNum,
        payment_method: customerDueForm.payment_method,
        note: customerDueForm.note,
      });

      toast.success(
        lang === 'bn'
          ? `৳${amountNum.toLocaleString()} বকেয়া সফলভাবে গ্রহণ করা হয়েছে!`
          : `Collected ৳${amountNum.toLocaleString()} due payment successfully!`
      );

      setIsCollectCustomerDueOpen(false);

      // Open Money Receipt Voucher
      setCustomerVoucher({
        customer_name: collectingCustomer.name || 'Customer',
        customer_phone: collectingCustomer.phone || '',
        collected_amount: amountNum,
        payment_method: customerDueForm.payment_method,
        remaining_customer_due: res.data?.remaining_customer_due ?? Math.max(0, (collectingCustomer.total_due || 0) - amountNum),
        settled_sales: res.data?.settled_sales || [],
        date: new Date().toLocaleString(),
        note: customerDueForm.note,
      });

      setCollectingCustomer(null);
      fetchCustomers();
      if (selectedCustomerId) {
        handleOpenCustomerHistory({ _id: selectedCustomerId });
      }
    } catch (err) {
      toast.error(err.message || 'Failed to collect customer due payment.');
    } finally {
      setIsSubmittingCustomerDue(false);
    }
  };

  // Open Edit Sale Modal from Purchase History
  const handleOpenEditSale = (sale) => {
    setEditingSale(sale);
    setEditSaleForm({
      id: sale._id,
      invoice_number: sale.invoice_number,
      payment_method: sale.payment_method || 'cash',
      discount_type: sale.discount_type || 'flat',
      discount_value: sale.discount_value !== undefined ? String(sale.discount_value) : String(sale.discount || 0),
      paid_amount: String(sale.paid_amount !== undefined ? sale.paid_amount : sale.total),
      tendered_amount: sale.tendered_amount ? String(sale.tendered_amount) : '',
      note: sale.note || '',
    });
    setIsEditSaleModalOpen(true);
  };

  // Submit Edit Sale from Purchase History
  const handleUpdateSale = async (e) => {
    e.preventDefault();
    if (!editSaleForm.id) return;

    setIsUpdatingSale(true);
    try {
      const discVal = parseFloat(editSaleForm.discount_value) || 0;
      const paid = parseFloat(editSaleForm.paid_amount) || 0;
      const tendered = parseFloat(editSaleForm.tendered_amount) || paid;

      await api.sales.update(editSaleForm.id, {
        payment_method: editSaleForm.payment_method,
        discount_type: editSaleForm.discount_type,
        discount_value: discVal,
        paid_amount: paid,
        tendered_amount: tendered,
        note: editSaleForm.note,
      });

      toast.success(lang === 'bn' ? 'বিক্রয় বিবরণ সফলভাবে আপডেট হয়েছে!' : 'Sale invoice updated successfully!');
      setIsEditSaleModalOpen(false);
      setEditingSale(null);
      if (selectedCustomerId) {
        reloadCustomerHistory(selectedCustomerId);
      }
      fetchCustomers();
    } catch (err) {
      toast.error(err.message || 'Failed to update sale invoice.');
    } finally {
      setIsUpdatingSale(false);
    }
  };

  // Delete Sale from Purchase History Request
  const handleDeleteSale = (saleId, invoiceNumber) => {
    setConfirmSaleDelete({
      isOpen: true,
      saleId,
      invoiceNumber,
    });
  };

  const handleConfirmDeleteSale = async () => {
    if (!confirmSaleDelete.saleId) return;
    setIsDeletingSale(true);
    try {
      await api.sales.delete(confirmSaleDelete.saleId);
      toast.success(lang === 'bn' ? `ইনভয়েস '${confirmSaleDelete.invoiceNumber}' মুছে ফেলা হয়েছে এবং স্টক ফেরত এসেছে!` : `Invoice '${confirmSaleDelete.invoiceNumber}' deleted & stock restored!`);
      if (selectedCustomerId) {
        reloadCustomerHistory(selectedCustomerId);
      }
      setConfirmSaleDelete({ isOpen: false, saleId: null, invoiceNumber: '' });
      fetchCustomers();
    } catch (err) {
      toast.error(err.message || 'Failed to delete sale transaction.');
    } finally {
      setIsDeletingSale(false);
    }
  };

  const filtered = useMemo(() => {
    const q = searchTerm.toLowerCase().trim();
    if (!q) return customers;
    return customers.filter(c =>
      (c.name && c.name.toLowerCase().includes(q)) ||
      (c.phone && c.phone.toLowerCase().includes(q)) ||
      (c.address && c.address.toLowerCase().includes(q))
    );
  }, [customers, searchTerm]);

  // Pagination State
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, pageSize]);

  const paginatedCustomers = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filtered.slice(start, start + pageSize);
  }, [filtered, currentPage, pageSize]);

  const totalSpentAll = customers.reduce((acc, c) => acc + (c.total_spent || c.total_purchases || 0), 0);
  const totalDuesAll = customers.reduce((acc, c) => acc + (c.total_due || 0), 0);

  return (
    <div className="space-y-6 font-sans pb-12">
      
      {/* ---------------------------------------------------- */}
      {/* HEADER SECTION                                       */}
      {/* ---------------------------------------------------- */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div className="min-w-0">
          <h1 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white tracking-tight flex items-center gap-2.5">
            <Users className="w-6 h-6 text-[#00df89] shrink-0" />
            <span>{lang === 'bn' ? 'কাস্টমার ও গ্রাহক ডিরেক্টরি' : 'Customers & Purchase History'}</span>
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-zinc-400 font-normal mt-0.5">
            {lang === 'bn'
              ? 'সকল কাস্টমারদের তালিকা, ক্রয়ের ইতিহাস, এডিট ও ডিলিট অপশন'
              : 'Manage customer profiles, edit/delete customer data and edit/delete individual purchases.'}
          </p>
        </div>

        <div className="flex items-center gap-2.5 shrink-0">
          <Button
            onClick={() => setIsAddModalOpen(true)}
            className="bg-[#00df89] hover:bg-[#00c97b] text-[#011812] font-semibold text-xs sm:text-sm h-10 px-4 gap-2 shadow-xs cursor-pointer whitespace-nowrap shrink-0"
          >
            <Plus className="w-4 h-4 stroke-[2.5]" />
            <span>{lang === 'bn' ? 'নতুন কাস্টমার যোগ করুন' : 'Add Customer'}</span>
          </Button>
        </div>
      </div>

      {/* ---------------------------------------------------- */}
      {/* KPI METRIC CARDS                                     */}
      {/* ---------------------------------------------------- */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 sm:gap-4">
        <Card className="p-3.5 sm:p-5 border-slate-200/90 dark:border-zinc-800/80 dark:bg-[#121215] flex flex-col justify-between">
          <div className="flex items-center justify-between gap-1.5">
            <span className="text-[11px] sm:text-sm font-medium text-slate-500 dark:text-zinc-400 truncate">
              {lang === 'bn' ? 'মোট গ্রাহক' : 'Total Customers'}
            </span>
            <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg bg-slate-100 dark:bg-zinc-800/80 text-slate-500 dark:text-zinc-400 flex items-center justify-center shrink-0">
              <Users className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
            </div>
          </div>
          <div className="mt-2 sm:mt-3 space-y-1">
            <div className="text-xl sm:text-2xl lg:text-3xl font-bold text-slate-900 dark:text-white tracking-tight truncate">
              {isLoading ? <Skeleton className="h-7 sm:h-8 w-20 my-0.5" /> : customers.length}
            </div>
            <div className="text-[10px] sm:text-xs text-slate-500 dark:text-zinc-400 font-medium truncate">
              {lang === 'bn' ? 'নাম বা ফোন নম্বরসহ' : 'With name or phone'}
            </div>
          </div>
        </Card>

        <Card className="p-3.5 sm:p-5 border-slate-200/90 dark:border-zinc-800/80 dark:bg-[#121215] flex flex-col justify-between">
          <div className="flex items-center justify-between gap-1.5">
            <span className="text-[11px] sm:text-sm font-medium text-slate-500 dark:text-zinc-400 truncate">
              {lang === 'bn' ? 'মোট ক্রয় ভলিউম' : 'Lifetime Purchases'}
            </span>
            <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg bg-emerald-500/10 dark:bg-emerald-500/20 text-[#00a86b] dark:text-[#00df89] flex items-center justify-center shrink-0">
              <DollarSign className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
            </div>
          </div>
          <div className="mt-2 sm:mt-3 space-y-1">
            <div className="text-xl sm:text-2xl lg:text-3xl font-bold text-[#00a86b] dark:text-[#00df89] tracking-tight truncate">
              {isLoading ? <Skeleton className="h-7 sm:h-8 w-28 my-0.5" /> : `৳ ${totalSpentAll.toLocaleString()}`}
            </div>
            <div className="text-[10px] sm:text-xs text-[#00a86b] dark:text-[#00df89] font-medium truncate">
              {lang === 'bn' ? 'কাস্টমারদের মোট ক্রয়' : 'Total customer volume'}
            </div>
          </div>
        </Card>

        <Card className="p-3.5 sm:p-5 border-slate-200/90 dark:border-zinc-800/80 dark:bg-[#121215] col-span-2 sm:col-span-1 flex flex-col justify-between">
          <div className="flex items-center justify-between gap-1.5">
            <span className="text-[11px] sm:text-sm font-medium text-slate-500 dark:text-zinc-400 truncate">
              {lang === 'bn' ? 'মোট বাকি ব্যালেন্স' : 'Outstanding Dues'}
            </span>
            <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg bg-amber-500/10 dark:bg-amber-500/20 text-amber-500 flex items-center justify-center shrink-0">
              <DollarSign className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
            </div>
          </div>
          <div className="mt-2 sm:mt-3 space-y-1">
            <div className="text-xl sm:text-2xl lg:text-3xl font-bold text-amber-500 tracking-tight truncate">
              {isLoading ? <Skeleton className="h-7 sm:h-8 w-24 my-0.5" /> : `৳ ${totalDuesAll.toLocaleString()}`}
            </div>
            <div className="text-[10px] sm:text-xs text-amber-500 font-medium truncate">
              {lang === 'bn' ? 'পেন্ডিং বকেয়া রিসিভেবল' : 'Receivables pending'}
            </div>
          </div>
        </Card>
      </div>

      {/* ---------------------------------------------------- */}
      {/* SEARCH BAR                                           */}
      {/* ---------------------------------------------------- */}
      <Card className="p-4 border-slate-200/90 dark:border-zinc-800/80 dark:bg-[#121215]">
        <div className="w-full sm:w-80 relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder={lang === 'bn' ? 'নাম বা ফোন নম্বর খুঁজুন...' : 'Search by name or phone number...'}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-4 py-2 rounded-xl bg-slate-50 dark:bg-[#09090b] border border-slate-200 dark:border-zinc-800 text-xs text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-[#00df89]"
          />
        </div>
      </Card>

      {/* ---------------------------------------------------- */}
      {/* CUSTOMERS DIRECTORY TABLE                            */}
      {/* ---------------------------------------------------- */}
      <Card className="p-0 border-slate-200/90 dark:border-zinc-800/80 dark:bg-[#121215] overflow-hidden">
        {isLoading ? (
          <div className="p-5 space-y-3">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <Skeleton key={i} className="h-12 w-full" />
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div className="p-12 text-center space-y-3">
            <Users className="w-10 h-10 text-slate-300 dark:text-zinc-600 mx-auto" />
            <h3 className="text-sm font-semibold text-slate-800 dark:text-zinc-200">No Customers Found</h3>
            <p className="text-xs text-slate-500 dark:text-zinc-400">
              Customers who enter their phone number or name during checkout will automatically appear here.
            </p>
            <Button size="sm" onClick={() => setIsAddModalOpen(true)} className="bg-[#00df89] hover:bg-[#00c97b] text-[#011812] text-xs font-semibold">
              <Plus className="w-3.5 h-3.5 mr-1" /> Add First Customer
            </Button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left">
              <thead className="bg-slate-50 dark:bg-zinc-900/60 text-slate-500 border-b border-slate-200 dark:border-zinc-800 select-none">
                <tr>
                  <th className="p-3.5 whitespace-nowrap">Customer</th>
                  <th className="p-3.5 whitespace-nowrap">{lang === 'bn' ? 'মেম্বারশিপ ও পয়েন্ট' : 'Membership & Points'}</th>
                  <th className="p-3.5 whitespace-nowrap">Phone Number</th>
                  <th className="p-3.5 whitespace-nowrap">Total Orders</th>
                  <th className="p-3.5 whitespace-nowrap">Total Purchases (৳)</th>
                  <th className="p-3.5 whitespace-nowrap">Due Remaining (৳)</th>
                  <th className="p-3.5 whitespace-nowrap">Last Active</th>
                  <th className="p-3.5 text-right whitespace-nowrap">{lang === 'bn' ? 'অ্যাকশন' : 'Actions'}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-zinc-800/80">
                {paginatedCustomers.map((c) => {
                  const spent = c.total_spent || c.total_purchases || 0;
                  const ordersCount = c.total_orders || (spent > 0 ? 1 : 0);

                  return (
                    <tr
                      key={c._id}
                      onClick={() => handleOpenCustomerHistory(c)}
                      className="hover:bg-slate-50 dark:hover:bg-zinc-900/40 transition-colors cursor-pointer group"
                    >
                      <td className="p-3.5 font-semibold text-slate-900 dark:text-white flex items-center gap-2.5 whitespace-nowrap">
                        <div className="w-7 h-7 rounded-full bg-slate-100 dark:bg-zinc-800 text-slate-700 dark:text-zinc-200 border border-slate-200 dark:border-zinc-700 flex items-center justify-center font-bold text-xs shrink-0">
                          {(c.name || 'C')
                            .split(' ')
                            .map((n) => n[0])
                            .slice(0, 2)
                            .join('')
                            .toUpperCase()}
                        </div>
                        <div className="min-w-0">
                          <div className="flex items-center gap-1.5">
                            <span className="group-hover:text-[#00a86b] dark:group-hover:text-[#00df89] transition-colors">
                              {c.name || 'Unnamed Customer'}
                            </span>
                          </div>
                          {c.address && (
                            <span className="block text-[10px] text-slate-400 font-normal truncate max-w-xs">{c.address}</span>
                          )}
                        </div>
                      </td>

                      {/* Membership & Reward Points */}
                      <td className="p-3.5 whitespace-nowrap">
                        {c.is_member ? (() => {
                          const matchedTier = activeTiers.find(
                            (t) => (t.name || '').toLowerCase() === (c.membership_tier || '').toLowerCase()
                          );
                          const tierColor = matchedTier?.color || '#10b981';
                          const tierBadgeStyle = getTierBadgeStyle(tierColor);

                          return (
                            <div className="space-y-1">
                              <span
                                className="inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-full border transition-colors shadow-2xs"
                                style={tierBadgeStyle}
                              >
                                <Sparkles className="w-2.5 h-2.5" style={{ color: tierColor }} />
                                {c.membership_tier || 'Regular'}
                              </span>
                              <div className="text-[11px] font-mono text-slate-600 dark:text-zinc-300 flex items-center gap-1">
                                <Star className="w-3 h-3 text-amber-500 fill-amber-400" />
                                <span className="font-bold text-slate-900 dark:text-white">{(c.reward_points || 0).toLocaleString()}</span>
                                <span className="text-[10px] text-slate-400">pts</span>
                              </div>
                            </div>
                          );
                        })() : (
                          <span className="text-[11px] text-slate-400 font-normal">—</span>
                        )}
                      </td>

                      <td className="p-3.5 text-slate-700 dark:text-zinc-300 font-mono whitespace-nowrap">
                        {c.phone ? (
                          <div className="flex items-center gap-1">
                            <Phone className="w-3 h-3 text-slate-400 shrink-0" />
                            <span>{c.phone}</span>
                          </div>
                        ) : (
                          <span className="text-slate-400">No phone</span>
                        )}
                      </td>

                      <td className="p-3.5 text-slate-700 dark:text-zinc-300 font-medium whitespace-nowrap">
                        <Badge variant="secondary" className="text-[10px]">
                          {ordersCount} {ordersCount === 1 ? 'order' : 'orders'}
                        </Badge>
                      </td>

                      <td className="p-3.5 font-bold text-[#00a86b] dark:text-[#00df89] whitespace-nowrap">
                        ৳ {spent.toLocaleString()}
                      </td>

                      <td className="p-3.5 font-semibold whitespace-nowrap">
                        {(c.total_due || 0) > 0 ? (
                          <span className="text-amber-500">৳ {c.total_due.toLocaleString()}</span>
                        ) : (
                          <span className="text-slate-400">৳ 0</span>
                        )}
                      </td>

                      <td className="p-3.5 text-slate-500 text-[11px] whitespace-nowrap">
                        {c.last_order_date
                          ? new Date(c.last_order_date).toLocaleDateString()
                          : c.created_at
                          ? new Date(c.created_at).toLocaleDateString()
                          : 'Recent'}
                      </td>

                      <td className="p-3.5 text-right whitespace-nowrap">
                        <div className="flex items-center justify-end gap-1.5 flex-nowrap">
                          {(c.total_due || 0) > 0 && (
                            <button
                              type="button"
                              onClick={(e) => handleOpenCollectCustomerDue(c, e)}
                              className="h-8 px-2.5 rounded-lg bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold text-xs flex items-center gap-1.5 transition-colors cursor-pointer shadow-2xs shrink-0"
                              title="Collect Due Payment"
                            >
                              <Coins className="w-3.5 h-3.5 shrink-0" />
                              <span>{lang === 'bn' ? 'বকেয়া গ্রহণ' : 'Collect Due'}</span>
                            </button>
                          )}
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleOpenCustomerHistory(c);
                            }}
                            className="h-8 px-2.5 rounded-lg bg-emerald-50 dark:bg-emerald-950/40 hover:bg-emerald-100 dark:hover:bg-emerald-900/60 text-[#00a86b] dark:text-[#00df89] border border-emerald-500/20 text-xs font-semibold flex items-center gap-1 transition-colors cursor-pointer shadow-2xs shrink-0"
                            title="View Purchases"
                          >
                            <span>View Purchases</span>
                            <ChevronRight className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={(e) => handleOpenEditCustomer(c, e)}
                            title="Edit Customer Profile"
                            className="w-8 h-8 rounded-lg bg-blue-50 dark:bg-blue-950/40 hover:bg-blue-100 dark:hover:bg-blue-900/60 text-blue-600 dark:text-blue-400 flex items-center justify-center transition-colors cursor-pointer border border-blue-500/20 shadow-2xs shrink-0"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>
                          <button
                            type="button"
                            onClick={(e) => handleDeleteCustomer(c, e)}
                            title="Delete Customer Profile"
                            className="w-8 h-8 rounded-lg bg-rose-50 dark:bg-rose-950/40 hover:bg-rose-100 dark:hover:bg-rose-900/60 text-rose-600 dark:text-rose-400 flex items-center justify-center transition-colors cursor-pointer border border-rose-500/20 shadow-2xs shrink-0"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
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
              totalItems={filtered.length}
              pageSize={pageSize}
              pageSizeOptions={[10, 20, 50, 100]}
              onPageChange={setCurrentPage}
              onPageSizeChange={setPageSize}
            />
          </div>
        )}
      </Card>

      {/* ---------------------------------------------------- */}
      {/* CUSTOMER PURCHASE HISTORY MODAL                      */}
      {/* ---------------------------------------------------- */}
      {selectedCustomerId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs">
          <Card className="max-w-2xl w-full max-h-[90vh] flex flex-col bg-white dark:bg-[#121215] border-slate-200 dark:border-zinc-800 shadow-2xl overflow-hidden">
            
            {/* Modal Header */}
            <div className="p-5 border-b border-slate-100 dark:border-zinc-800 flex items-center justify-between shrink-0">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-[#00df89] text-[#011812] flex items-center justify-center font-bold text-sm">
                  {customerHistory?.customer?.name ? customerHistory.customer.name.slice(0, 2).toUpperCase() : 'CU'}
                </div>
                <div>
                  <h2 className="text-base font-bold text-slate-900 dark:text-white">
                    {customerHistory?.customer?.name || 'Customer Purchases'}
                  </h2>
                  <div className="flex items-center gap-3 text-xs text-slate-500 dark:text-zinc-400 mt-0.5">
                    {customerHistory?.customer?.phone && (
                      <span className="flex items-center gap-1 font-mono">
                        <Phone className="w-3 h-3 text-[#00df89]" /> {customerHistory.customer.phone}
                      </span>
                    )}
                    {customerHistory?.customer?.address && (
                      <span className="flex items-center gap-1">
                        <MapPin className="w-3 h-3 text-slate-400" /> {customerHistory.customer.address}
                      </span>
                    )}
                  </div>
                </div>
              </div>

              <button onClick={handleCloseHistory} className="text-slate-400 hover:text-slate-600 p-1 cursor-pointer">
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Content / Invoices List */}
            <div className="p-5 overflow-y-auto space-y-4 flex-1">
              {isLoadingHistory ? (
                <div className="p-12 text-center text-slate-400">
                  <Loader2 className="w-8 h-8 animate-spin mx-auto mb-2 text-[#00df89]" />
                  Loading purchase history...
                </div>
              ) : !customerHistory?.sales || customerHistory.sales.length === 0 ? (
                <div className="p-8 text-center space-y-2 border border-dashed border-slate-200 dark:border-zinc-800 rounded-xl">
                  <ShoppingBag className="w-8 h-8 text-slate-300 dark:text-zinc-600 mx-auto" />
                  <h4 className="text-xs font-semibold text-slate-700 dark:text-zinc-300">No Sales Recorded Yet</h4>
                  <p className="text-[11px] text-slate-400">When this customer purchases items, complete breakdowns will appear here.</p>
                </div>
              ) : (
                <>
                  {/* Summary Bar */}
                  <div className="grid grid-cols-3 gap-3">
                    <div className="p-3 rounded-xl bg-slate-50 dark:bg-[#09090b] border border-slate-200 dark:border-zinc-800 text-center">
                      <span className="text-[10px] text-slate-500 uppercase font-semibold">Total Orders</span>
                      <div className="text-lg font-bold text-slate-900 dark:text-white mt-0.5">
                        {customerHistory.sales.length}
                      </div>
                    </div>
                    <div className="p-3 rounded-xl bg-slate-50 dark:bg-[#09090b] border border-slate-200 dark:border-zinc-800 text-center">
                      <span className="text-[10px] text-slate-500 uppercase font-semibold">Lifetime Spent</span>
                      <div className="text-lg font-bold text-[#00a86b] dark:text-[#00df89] mt-0.5">
                        ৳ {(customerHistory.customer?.total_spent || 0).toLocaleString()}
                      </div>
                    </div>
                    <div className="p-3 rounded-xl bg-slate-50 dark:bg-[#09090b] border border-slate-200 dark:border-zinc-800 text-center relative flex flex-col justify-between">
                      <div>
                        <span className="text-[10px] text-slate-500 uppercase font-semibold">Pending Due</span>
                        <div className="text-lg font-bold text-amber-500 mt-0.5">
                          ৳ {(customerHistory.customer?.total_due || 0).toLocaleString()}
                        </div>
                      </div>
                      {(customerHistory.customer?.total_due || 0) > 0 && (
                        <Button
                          size="sm"
                          onClick={() => handleOpenCollectCustomerDue(customerHistory.customer)}
                          className="mt-1 h-6 text-[10px] bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold gap-1 cursor-pointer"
                        >
                          <Coins className="w-3 h-3" />
                          <span>{lang === 'bn' ? 'বকেয়া জমা নিন' : 'Collect Due'}</span>
                        </Button>
                      )}
                    </div>
                  </div>

                  {/* List of Invoices with Edit & Delete */}
                  <div className="space-y-3 pt-2">
                    <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500">
                      {lang === 'bn' ? `সকল ক্রয় ও লেনদেন (${customerHistory.sales.length})` : `All Purchases & Cash Transactions (${customerHistory.sales.length})`}
                    </h3>

                    {customerHistory.sales.map((sale) => (
                      <div
                        key={sale._id}
                        className="p-4 rounded-2xl bg-slate-50 dark:bg-[#09090b] border border-slate-200 dark:border-zinc-800 space-y-3.5 text-xs shadow-2xs"
                      >
                        {/* Invoice Header: Clean Multi-Level Responsive Layout */}
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 border-b border-slate-200 dark:border-zinc-800 pb-3">
                          <div className="space-y-1 min-w-0">
                            <div className="flex items-center gap-2 flex-wrap">
                              <div className="flex items-center gap-1.5 font-bold text-slate-900 dark:text-white text-xs whitespace-nowrap">
                                <FileText className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                                <span className="font-mono">{sale.invoice_number}</span>
                              </div>
                              <Badge
                                variant={sale.payment_method?.toLowerCase() === 'due' ? 'warning' : 'secondary'}
                                className={`text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 whitespace-nowrap shrink-0 ${
                                  sale.payment_method?.toLowerCase() === 'due'
                                    ? '!bg-amber-500/15 !text-amber-500 dark:!text-amber-400 !border-amber-500/30'
                                    : '!bg-slate-100 !text-slate-700 dark:!bg-zinc-800 dark:!text-zinc-300 !border-slate-200 dark:!border-zinc-700'
                                }`}
                              >
                                {sale.payment_method || 'Cash'}
                              </Badge>
                              {(sale.due_amount || 0) > 0 && (
                                <Badge
                                  variant="warning"
                                  className="!bg-amber-500/15 !text-amber-500 dark:!text-amber-400 !border-amber-500/30 text-[10px] font-bold px-2 py-0.5 whitespace-nowrap shrink-0"
                                >
                                  {lang === 'bn' ? `বকেয়া: ৳${sale.due_amount.toLocaleString()}` : `Due: ৳${sale.due_amount.toLocaleString()}`}
                                </Badge>
                              )}
                            </div>
                            <div className="text-[11px] text-slate-400 font-normal">
                              {new Date(sale.created_at).toLocaleString()}
                            </div>
                          </div>

                          <div className="flex items-center gap-1.5 shrink-0 self-end sm:self-center">
                            {(sale.due_amount || 0) > 0 && (
                              <button
                                type="button"
                                onClick={() => handleOpenCollectCustomerDue({
                                  ...customerHistory.customer,
                                  total_due: sale.due_amount,
                                })}
                                className="h-8 px-2.5 rounded-lg bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold text-xs flex items-center gap-1.5 transition-colors cursor-pointer shadow-2xs shrink-0"
                                title="Collect this bill due"
                              >
                                <Coins className="w-3.5 h-3.5 shrink-0" />
                                <span>{lang === 'bn' ? 'বকেয়া গ্রহণ' : 'Pay Due'}</span>
                              </button>
                            )}
                            <button
                              type="button"
                              onClick={() => setReturningSale(sale)}
                              className="h-8 px-2.5 rounded-lg bg-rose-50 dark:bg-rose-950/40 hover:bg-rose-100 dark:hover:bg-rose-900/60 text-rose-600 dark:text-rose-400 border border-rose-500/20 text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer shadow-2xs shrink-0"
                              title="Return items & refund"
                            >
                              <Undo2 className="w-4 h-4" />
                              <span>{lang === 'bn' ? 'রিটার্ন' : 'Return'}</span>
                            </button>
                            <button
                              type="button"
                              onClick={() => handleOpenEditSale(sale)}
                              title="Edit this sale transaction"
                              className="w-8 h-8 rounded-lg bg-blue-50 dark:bg-blue-950/40 hover:bg-blue-100 dark:hover:bg-blue-900/60 text-blue-600 dark:text-blue-400 flex items-center justify-center transition-colors cursor-pointer border border-blue-500/20 shadow-2xs shrink-0"
                            >
                              <Edit2 className="w-4 h-4" />
                            </button>
                            <button
                              type="button"
                              onClick={() => handleDeleteSale(sale._id, sale.invoice_number)}
                              title="Delete sale & restore inventory"
                              className="w-8 h-8 rounded-lg bg-rose-50 dark:bg-rose-950/40 hover:bg-rose-100 dark:hover:bg-rose-900/60 text-rose-600 dark:text-rose-400 flex items-center justify-center transition-colors cursor-pointer border border-rose-500/20 shadow-2xs shrink-0"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </div>

                        {/* Items Purchased Table with Product Thumbnails */}
                        <div className="space-y-1.5">
                          <div className="text-[11px] font-semibold text-slate-600 dark:text-zinc-400">
                            {lang === 'bn' ? 'ক্রয়কৃত পণ্যের তালিকা:' : 'Items Purchased:'}
                          </div>
                          <div className="divide-y divide-slate-100 dark:divide-zinc-800/80 bg-white dark:bg-[#121215] rounded-xl border border-slate-200/90 dark:border-zinc-800/80 p-2.5 space-y-2">
                            {sale.items?.map((it, idx) => {
                              const itemImg = it.image_url || it.product_id?.image_url || (it.product_id?.images && it.product_id.images[0]);
                              return (
                                <div key={idx} className="pt-2 first:pt-0 flex items-center justify-between gap-3 text-xs">
                                  <div className="flex items-center gap-2.5 min-w-0">
                                    {itemImg ? (
                                      <img
                                        src={itemImg}
                                        alt={it.name}
                                        className="w-10 h-10 rounded-lg object-cover bg-slate-100 dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700 shrink-0"
                                        onError={(e) => {
                                          e.target.onerror = null;
                                          e.target.style.display = 'none';
                                        }}
                                      />
                                    ) : (
                                      <div className="w-10 h-10 rounded-lg bg-slate-100 dark:bg-zinc-800/80 border border-slate-200 dark:border-zinc-700/80 flex items-center justify-center text-slate-400 shrink-0">
                                        <ShoppingBag className="w-4 h-4" />
                                      </div>
                                    )}
                                    <div className="min-w-0">
                                      <div className="font-semibold text-slate-900 dark:text-zinc-100 truncate">
                                        {it.name}
                                      </div>
                                      <div className="text-slate-400 text-[11px]">
                                        ৳{(it.unit_price || 0).toLocaleString()} × {it.quantity}
                                      </div>
                                    </div>
                                  </div>
                                  <span className="font-bold text-slate-900 dark:text-white shrink-0">
                                    ৳ {(it.subtotal || it.unit_price * it.quantity).toLocaleString()}
                                  </span>
                                </div>
                              );
                            })}
                          </div>
                        </div>

                        {/* Financial Calculation Breakdown */}
                        <div className="p-3 rounded-xl bg-slate-100/70 dark:bg-[#09090b] border border-slate-200 dark:border-zinc-800 space-y-1.5 text-xs">
                          <div className="flex justify-between text-slate-500">
                            <span>{lang === 'bn' ? 'সাবটোটাল:' : 'Subtotal:'}</span>
                            <span>৳ {(sale.subtotal || sale.total).toLocaleString()}</span>
                          </div>

                          {(sale.discount || 0) > 0 && (
                            <div className="flex justify-between text-rose-500">
                              <span>
                                {lang === 'bn' ? 'ডিসকাউন্ট' : 'Discount'} {sale.discount_type === 'percentage' ? `(${sale.discount_value}%)` : '(Flat)'}:
                              </span>
                              <span className="font-bold">- ৳ {sale.discount.toLocaleString()}</span>
                            </div>
                          )}

                          <div className="flex justify-between font-bold text-slate-900 dark:text-white pt-1 border-t border-slate-200 dark:border-zinc-800">
                            <span>{lang === 'bn' ? 'মোট বিল:' : 'Total Bill:'}</span>
                            <span className="text-sm font-bold text-slate-900 dark:text-white">৳ {(sale.total || 0).toLocaleString()}</span>
                          </div>

                          <div className="flex justify-between text-slate-600 dark:text-zinc-300 pt-0.5">
                            <span>{lang === 'bn' ? 'পরিশোধিত টাকা:' : 'Amount Paid:'}</span>
                            <span className="font-semibold text-[#00a86b] dark:text-[#00df89]">
                              ৳ {(sale.paid_amount !== undefined ? sale.paid_amount : sale.total).toLocaleString()}
                            </span>
                          </div>

                          {(sale.due_amount || 0) > 0 && (
                            <div className="flex justify-between text-amber-600 dark:text-amber-400 font-bold pt-0.5">
                              <span>{lang === 'bn' ? 'বকেয়া টাকা:' : 'Due Amount:'}</span>
                              <span>৳ {sale.due_amount.toLocaleString()}</span>
                            </div>
                          )}

                          {/* Cash Given & Change Returned */}
                          {sale.payment_method?.toLowerCase() === 'cash' && (sale.due_amount || 0) === 0 && (sale.tendered_amount || 0) > 0 && (
                            <div className="grid grid-cols-2 gap-2 pt-2 mt-1 border-t border-slate-200 dark:border-zinc-800 text-[11px]">
                              <div className="p-1.5 rounded bg-white dark:bg-zinc-900 flex items-center justify-between border border-slate-100 dark:border-zinc-800">
                                <span className="text-slate-500">{lang === 'bn' ? 'কাস্টমার দিয়েছেন:' : 'Cash Given:'}</span>
                                <span className="font-bold text-slate-900 dark:text-white">
                                  ৳ {sale.tendered_amount.toLocaleString()}
                                </span>
                              </div>
                              <div className="p-1.5 rounded bg-emerald-500/10 flex items-center justify-between text-emerald-600 dark:text-[#00df89] border border-emerald-500/20">
                                <span className="font-medium">{lang === 'bn' ? 'ফেরত:' : 'Change:'}</span>
                                <span className="font-bold">
                                  ৳ {(sale.change_amount || 0).toLocaleString()}
                                </span>
                              </div>
                            </div>
                          )}
                        </div>

                      </div>
                    ))}
                  </div>
                </>
              )}
            </div>

            {/* Modal Footer */}
            <div className="p-4 border-t border-slate-100 dark:border-zinc-800 flex justify-end gap-2 shrink-0">
              <Button variant="outline" size="sm" onClick={handleCloseHistory}>
                Close
              </Button>
              <Button
                size="sm"
                onClick={() => printCustomerStatement({
                  customer: customerHistoryModal.customer,
                  sales: customerHistoryModal.sales,
                  shop: mongoShop,
                  lang
                })}
                className="bg-[#00df89] hover:bg-[#00c97b] text-[#011812] font-semibold gap-1 cursor-pointer"
              >
                <Printer className="w-3.5 h-3.5" /> Print Statement
              </Button>
            </div>

          </Card>
        </div>
      )}

      {/* ---------------------------------------------------- */}
      {/* EDIT CUSTOMER PROFILE MODAL                          */}
      {/* ---------------------------------------------------- */}
      {isEditCustomerModalOpen && editingCustomer && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs">
          <Card className="max-w-md w-full p-6 bg-white dark:bg-[#121215] border-slate-200 dark:border-zinc-800 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-zinc-800 pb-3">
              <h2 className="text-base font-bold text-slate-900 dark:text-white">Edit Customer Profile</h2>
              <button onClick={() => setIsEditCustomerModalOpen(false)} className="text-slate-400 p-1 cursor-pointer">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleUpdateCustomer} className="space-y-3.5 text-xs">
              <div>
                <label className="block font-medium mb-1 text-slate-700 dark:text-zinc-300">Customer Name</label>
                <input
                  type="text"
                  required
                  value={editCustomerForm.name}
                  onChange={(e) => setEditCustomerForm({ ...editCustomerForm, name: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-[#09090b] border border-slate-200 dark:border-zinc-800 outline-none focus:ring-2 focus:ring-[#00df89]"
                />
              </div>

              <div>
                <label className="block font-medium mb-1 text-slate-700 dark:text-zinc-300">Phone Number *</label>
                <input
                  type="tel"
                  required
                  value={editCustomerForm.phone}
                  onChange={(e) => setEditCustomerForm({ ...editCustomerForm, phone: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-[#09090b] border border-slate-200 dark:border-zinc-800 outline-none focus:ring-2 focus:ring-[#00df89]"
                />
              </div>

              <div>
                <label className="block font-medium mb-1 text-slate-700 dark:text-zinc-300">Address</label>
                <input
                  type="text"
                  value={editCustomerForm.address}
                  onChange={(e) => setEditCustomerForm({ ...editCustomerForm, address: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-[#09090b] border border-slate-200 dark:border-zinc-800 outline-none"
                />
              </div>

              {/* Membership Toggle & Tier in Edit Modal */}
              <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-zinc-900/80 border border-slate-200 dark:border-zinc-800 space-y-3">
                <div className="flex items-center justify-between">
                  <label className="flex items-center gap-2 cursor-pointer select-none">
                    <input
                      type="checkbox"
                      checked={editCustomerForm.is_member || false}
                      onChange={(e) => setEditCustomerForm({ ...editCustomerForm, is_member: e.target.checked })}
                      className="w-4 h-4 text-[#00df89] rounded border-slate-300 focus:ring-[#00df89]"
                    />
                    <span className="font-semibold text-slate-900 dark:text-white flex items-center gap-1.5 text-xs">
                      <Sparkles className="w-3.5 h-3.5 text-[#00df89]" />
                      {lang === 'bn' ? 'মেম্বারশিপ চালু করুন (VIP Member)' : 'VIP Member / Loyalty Status'}
                    </span>
                  </label>

                  {editCustomerForm.is_member && (
                    <Badge className="bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border border-emerald-500/30 text-[10px] font-semibold px-2 py-0.5">
                      {editCustomerForm.membership_tier || activeTiers[0]?.name || 'Regular'}
                    </Badge>
                  )}
                </div>

                {editCustomerForm.is_member && (
                  <div className="space-y-2.5 pt-2 border-t border-slate-200/70 dark:border-zinc-800/70 animate-in fade-in">
                    {membershipConfig?.reward_type === 'discount' ? (
                      <div className="grid grid-cols-2 gap-2.5">
                        <div>
                          <label className="block text-[11px] font-semibold text-slate-700 dark:text-zinc-300 mb-1">
                            {lang === 'bn' ? 'মেম্বারশিপ টিয়ার' : 'Membership Tier'}
                          </label>
                          <select
                            value={editCustomerForm.membership_tier || activeTiers[0]?.name || 'Regular'}
                            onChange={(e) => setEditCustomerForm({ ...editCustomerForm, membership_tier: e.target.value })}
                            className="w-full px-2.5 py-1.5 text-xs rounded-xl bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 text-slate-900 dark:text-white"
                          >
                            {activeTiers.map((t) => (
                              <option key={t.name} value={t.name}>
                                {t.name} {t.extra_discount_percent ? `(${t.extra_discount_percent}%)` : ''}
                              </option>
                            ))}
                          </select>
                        </div>
                        <div>
                          <label className="block text-[11px] font-semibold text-slate-700 dark:text-zinc-300 mb-1">
                            {lang === 'bn' ? 'মেম্বার কার্ড কোড (ঐচ্ছিক)' : 'Member Card Code (Optional)'}
                          </label>
                          <input
                            type="text"
                            placeholder="MEM-00101"
                            value={editCustomerForm.member_code || ''}
                            onChange={(e) => setEditCustomerForm({ ...editCustomerForm, member_code: e.target.value })}
                            className="w-full px-2.5 py-1.5 text-xs rounded-xl bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 font-mono text-slate-900 dark:text-white"
                          />
                        </div>
                      </div>
                    ) : (
                      <>
                        <div className="grid grid-cols-2 gap-2.5">
                          <div>
                            <label className="block text-[11px] font-semibold text-slate-700 dark:text-zinc-300 mb-1">
                              {lang === 'bn' ? 'মেম্বারশিপ টিয়ার' : 'Membership Tier'}
                            </label>
                            <select
                              value={editCustomerForm.membership_tier || activeTiers[0]?.name || 'Regular'}
                              onChange={(e) => setEditCustomerForm({ ...editCustomerForm, membership_tier: e.target.value })}
                              className="w-full px-2.5 py-1.5 text-xs rounded-xl bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 text-slate-900 dark:text-white"
                            >
                              {activeTiers.map((t) => (
                                <option key={t.name} value={t.name}>
                                  {t.name}
                                </option>
                              ))}
                            </select>
                          </div>
                          <div>
                            <label className="block text-[11px] font-semibold text-slate-700 dark:text-zinc-300 mb-1">
                              {lang === 'bn' ? 'রিওয়ার্ড পয়েন্ট ব্যালেন্স' : 'Reward Points Balance'}
                            </label>
                            <div className="relative">
                              <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400 text-xs font-bold">⭐</span>
                              <input
                                type="number"
                                min="0"
                                value={editCustomerForm.reward_points ?? 0}
                                onChange={(e) => setEditCustomerForm({ ...editCustomerForm, reward_points: e.target.value })}
                                className="w-full pl-7 pr-2.5 py-1.5 text-xs rounded-xl bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 font-mono text-slate-900 dark:text-white"
                              />
                            </div>
                          </div>
                        </div>

                        <div>
                          <label className="block text-[11px] font-semibold text-slate-700 dark:text-zinc-300 mb-1">
                            {lang === 'bn' ? 'মেম্বার কার্ড কোড (ঐচ্ছিক)' : 'Member Card Code (Optional)'}
                          </label>
                          <input
                            type="text"
                            placeholder="MEM-00101"
                            value={editCustomerForm.member_code || ''}
                            onChange={(e) => setEditCustomerForm({ ...editCustomerForm, member_code: e.target.value })}
                            className="w-full px-2.5 py-1.5 text-xs rounded-xl bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 font-mono text-slate-900 dark:text-white"
                          />
                        </div>

                        <div className="p-2 rounded-lg bg-amber-500/10 border border-amber-500/20 text-[10px] text-amber-700 dark:text-amber-400 flex items-center justify-between">
                          <span>{lang === 'bn' ? 'সম্ভাব্য পয়েন্ট ডিসকাউন্ট মূল্য:' : 'Redeemable points value:'}</span>
                          <span className="font-bold font-mono">
                            ≈ ৳ {((Number(editCustomerForm.reward_points) || 0) * (membershipConfig?.point_redeem_value || 0.5)).toFixed(2)}
                          </span>
                        </div>
                      </>
                    )}
                  </div>
                )}
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-slate-100 dark:border-zinc-800">
                <Button type="button" variant="outline" size="sm" onClick={() => setIsEditCustomerModalOpen(false)}>
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
      {/* EDIT SALE MODAL (FROM CUSTOMER PURCHASES)             */}
      {/* ---------------------------------------------------- */}
      {isEditSaleModalOpen && editingSale && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs">
          <Card className="max-w-md w-full p-6 bg-white dark:bg-[#121215] border-slate-200 dark:border-zinc-800 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-zinc-800 pb-3">
              <div>
                <h2 className="text-base font-bold text-slate-900 dark:text-white">Edit Purchase: {editSaleForm.invoice_number}</h2>
                <p className="text-xs text-slate-400">Update payment method, discount, cash received or notes</p>
              </div>
              <button onClick={() => setIsEditSaleModalOpen(false)} className="text-slate-400 p-1 cursor-pointer">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleUpdateSale} className="space-y-3.5 text-xs">
              <div>
                <label className="block font-semibold mb-1 text-slate-700 dark:text-zinc-300">Payment Method</label>
                <Select
                  value={editSaleForm.payment_method}
                  onValueChange={(val) => setEditSaleForm({ ...editSaleForm, payment_method: val })}
                >
                  <SelectTrigger className="w-full bg-slate-50 dark:bg-[#09090b]">
                    <SelectValue placeholder="Payment Method" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="cash">Cash</SelectItem>
                    <SelectItem value="bkash">bKash</SelectItem>
                    <SelectItem value="nagad">Nagad</SelectItem>
                    <SelectItem value="rocket">Rocket</SelectItem>
                    <SelectItem value="card">Card</SelectItem>
                    <SelectItem value="bank_transfer">Bank Transfer</SelectItem>
                    <SelectItem value="due">Due / Credit</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="p-3 rounded-xl bg-slate-50 dark:bg-[#09090b] border border-slate-200 dark:border-zinc-800 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-slate-700 dark:text-zinc-300">Discount Option</span>
                  <div className="flex bg-slate-200 dark:bg-zinc-800 p-0.5 rounded-lg text-[11px]">
                    <button
                      type="button"
                      onClick={() => setEditSaleForm({ ...editSaleForm, discount_type: 'flat' })}
                      className={`px-2 py-0.5 rounded-md font-medium transition-all ${editSaleForm.discount_type === 'flat' ? 'bg-white dark:bg-zinc-900 text-slate-900 dark:text-white shadow-xs' : 'text-slate-500'}`}
                    >
                      Flat (৳)
                    </button>
                    <button
                      type="button"
                      onClick={() => setEditSaleForm({ ...editSaleForm, discount_type: 'percentage' })}
                      className={`px-2 py-0.5 rounded-md font-medium transition-all ${editSaleForm.discount_type === 'percentage' ? 'bg-white dark:bg-zinc-900 text-slate-900 dark:text-white shadow-xs' : 'text-slate-500'}`}
                    >
                      Percent (%)
                    </button>
                  </div>
                </div>

                <input
                  type="number"
                  placeholder={editSaleForm.discount_type === 'flat' ? 'Discount Amount (৳)' : 'Discount (%)'}
                  value={editSaleForm.discount_value}
                  onChange={(e) => setEditSaleForm({ ...editSaleForm, discount_value: e.target.value })}
                  className="w-full px-3 py-1.5 rounded-lg bg-white dark:bg-[#121215] border border-slate-200 dark:border-zinc-800 text-xs outline-none focus:ring-1 focus:ring-[#00df89]"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold mb-1 text-slate-700 dark:text-zinc-300">Paid Amount (৳)</label>
                  <input
                    type="number"
                    value={editSaleForm.paid_amount}
                    onChange={(e) => setEditSaleForm({ ...editSaleForm, paid_amount: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-[#09090b] border border-slate-200 dark:border-zinc-800 outline-none"
                  />
                </div>
                <div>
                  <label className="block font-semibold mb-1 text-slate-700 dark:text-zinc-300">Cash Given (৳)</label>
                  <input
                    type="number"
                    value={editSaleForm.tendered_amount}
                    onChange={(e) => setEditSaleForm({ ...editSaleForm, tendered_amount: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-[#09090b] border border-slate-200 dark:border-zinc-800 outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold mb-1 text-slate-700 dark:text-zinc-300">Note / Remarks</label>
                <input
                  type="text"
                  placeholder="e.g. Adjusted price"
                  value={editSaleForm.note}
                  onChange={(e) => setEditSaleForm({ ...editSaleForm, note: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-[#09090b] border border-slate-200 dark:border-zinc-800 outline-none"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-slate-100 dark:border-zinc-800">
                <Button type="button" variant="outline" size="sm" onClick={() => setIsEditSaleModalOpen(false)}>
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={isUpdatingSale}
                  size="sm"
                  className="bg-[#00df89] hover:bg-[#00c97b] text-[#011812] font-semibold"
                >
                  {isUpdatingSale ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : 'Save Changes'}
                </Button>
              </div>
            </form>
          </Card>
        </div>
      )}

      {/* ---------------------------------------------------- */}
      {/* CREATE CUSTOMER MODAL                                */}
      {/* ---------------------------------------------------- */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs">
          <Card className="max-w-md w-full p-6 bg-white dark:bg-[#121215] border-slate-200 dark:border-zinc-800 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-zinc-800 pb-3">
              <h2 className="text-base font-bold text-slate-900 dark:text-white">Add Customer Profile</h2>
              <button onClick={() => setIsAddModalOpen(false)} className="text-slate-400 p-1 cursor-pointer">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateCustomer} className="space-y-3.5 text-xs">
              <div>
                <label className="block font-medium mb-1 text-slate-700 dark:text-zinc-300">Customer Name</label>
                <input
                  type="text"
                  placeholder="e.g. Rafiqul Islam"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-[#09090b] border border-slate-200 dark:border-zinc-800 outline-none focus:ring-2 focus:ring-[#00df89]"
                />
              </div>

              <div>
                <label className="block font-medium mb-1 text-slate-700 dark:text-zinc-300">Phone Number *</label>
                <input
                  type="tel"
                  required
                  placeholder="e.g. 01712345678"
                  value={form.phone}
                  onChange={(e) => setForm({ ...form, phone: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-[#09090b] border border-slate-200 dark:border-zinc-800 outline-none focus:ring-2 focus:ring-[#00df89]"
                />
              </div>

              <div>
                <label className="block font-medium mb-1 text-slate-700 dark:text-zinc-300">Address (Optional)</label>
                <input
                  type="text"
                  placeholder="e.g. Dhanmondi, Dhaka"
                  value={form.address}
                  onChange={(e) => setForm({ ...form, address: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-[#09090b] border border-slate-200 dark:border-zinc-800 outline-none"
                />
              </div>

              {/* Membership Toggle & Tier in Add Modal */}
              <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-zinc-900/80 border border-slate-200 dark:border-zinc-800 space-y-3">
                <div className="flex items-center justify-between">
                  <label className="flex items-center gap-2 cursor-pointer select-none">
                    <input
                      type="checkbox"
                      checked={form.is_member || false}
                      onChange={(e) => {
                        const isMember = e.target.checked;
                        const defTier = activeTiers[0];
                        const isPercent = Number(defTier?.extra_discount_percent) > 0;
                        const defaultPoints = isMember ? (isPercent ? 0 : (defTier?.welcome_bonus_points ?? membershipConfig?.welcome_bonus_points ?? 20)) : 0;
                        setForm({
                          ...form,
                          is_member: isMember,
                          reward_points: defaultPoints,
                        });
                      }}
                      className="w-4 h-4 text-[#00df89] rounded border-slate-300 focus:ring-[#00df89]"
                    />
                    <span className="font-semibold text-slate-900 dark:text-white flex items-center gap-1.5 text-xs">
                      <Sparkles className="w-3.5 h-3.5 text-[#00df89]" />
                      {lang === 'bn' ? 'মেম্বারশিপ চালু করুন (VIP Member)' : 'VIP Member / Loyalty Status'}
                    </span>
                  </label>

                  {form.is_member && (
                    <Badge className="bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border border-emerald-500/30 text-[10px] font-semibold px-2 py-0.5">
                      {form.membership_tier || activeTiers[0]?.name || 'Regular'}
                    </Badge>
                  )}
                </div>

                {form.is_member && (() => {
                  const selectedTier = activeTiers.find((t) => t.name === (form.membership_tier || activeTiers[0]?.name)) || activeTiers[0];
                  const isPercentageTier = Number(selectedTier?.extra_discount_percent) > 0;

                  return (
                    <div className="space-y-2.5 pt-2 border-t border-slate-200/70 dark:border-zinc-800/70 animate-in fade-in">
                      <div className="grid grid-cols-2 gap-2.5">
                        <div>
                          <label className="block text-[11px] font-semibold text-slate-700 dark:text-zinc-300 mb-1">
                            {lang === 'bn' ? 'মেম্বারশিপ টিয়ার' : 'Membership Tier'}
                          </label>
                          <select
                            value={form.membership_tier || activeTiers[0]?.name || 'Regular'}
                            onChange={(e) => {
                              const val = e.target.value;
                              const tierObj = activeTiers.find((t) => t.name === val);
                              const isPercent = Number(tierObj?.extra_discount_percent) > 0;
                              setForm({
                                ...form,
                                membership_tier: val,
                                reward_points: isPercent ? 0 : (tierObj?.welcome_bonus_points !== undefined ? tierObj.welcome_bonus_points : 0),
                              });
                            }}
                            className="w-full px-2.5 py-1.5 text-xs rounded-xl bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 text-slate-900 dark:text-white"
                          >
                            {activeTiers.map((t) => (
                              <option key={t.name} value={t.name}>
                                {t.name} {t.extra_discount_percent ? `(${t.extra_discount_percent}% off)` : ''}
                              </option>
                            ))}
                          </select>
                        </div>

                        {isPercentageTier ? (
                          <div>
                            <label className="block text-[11px] font-semibold text-slate-700 dark:text-zinc-300 mb-1">
                              {lang === 'bn' ? 'মেম্বার সুবিধা' : 'Tier Benefit'}
                            </label>
                            <div className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-cyan-500/10 border border-cyan-500/20 text-cyan-700 dark:text-cyan-400 text-xs font-semibold">
                              <Percent className="w-3.5 h-3.5 text-cyan-500 shrink-0" />
                              <span>{selectedTier?.extra_discount_percent}% {lang === 'bn' ? 'অটো ডিসকাউন্ট' : 'Auto Discount'}</span>
                            </div>
                          </div>
                        ) : (
                          <div>
                            <label className="block text-[11px] font-semibold text-slate-700 dark:text-zinc-300 mb-1">
                              {lang === 'bn' ? 'স্বাগতম বোনাস পয়েন্ট' : 'Welcome Bonus Points'}
                            </label>
                            <div className="relative">
                              <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400 text-xs font-bold">🎁</span>
                              <input
                                type="number"
                                min="0"
                                value={form.reward_points ?? 20}
                                onChange={(e) => setForm({ ...form, reward_points: e.target.value })}
                                className="w-full pl-7 pr-2.5 py-1.5 text-xs rounded-xl bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 font-mono text-slate-900 dark:text-white"
                              />
                            </div>
                          </div>
                        )}
                      </div>

                      <div>
                        <label className="block text-[11px] font-semibold text-slate-700 dark:text-zinc-300 mb-1">
                          {lang === 'bn' ? 'মেম্বার কার্ড কোড (ঐচ্ছিক)' : 'Member Card Code (Optional)'}
                        </label>
                        <input
                          type="text"
                          placeholder="e.g. MEM-00101"
                          value={form.member_code || ''}
                          onChange={(e) => setForm({ ...form, member_code: e.target.value })}
                          className="w-full px-2.5 py-1.5 text-xs rounded-xl bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 font-mono text-slate-900 dark:text-white"
                        />
                      </div>

                      {isPercentageTier ? (
                        <div className="p-2 rounded-lg bg-cyan-500/10 border border-cyan-500/20 text-[10px] text-cyan-700 dark:text-cyan-400 flex items-center gap-1.5">
                          <Sparkles className="w-3.5 h-3.5 text-cyan-500 shrink-0" />
                          <span>
                            {lang === 'bn'
                              ? `${selectedTier?.name} মেম্বার প্রতিটি অর্ডারে ${selectedTier?.extra_discount_percent}% স্বয়ংক্রিয় ছাড় পাবেন।`
                              : `${selectedTier?.name} member will receive ${selectedTier?.extra_discount_percent}% automatic discount on every order.`}
                          </span>
                        </div>
                      ) : (
                        <div className="p-2 rounded-lg bg-amber-500/10 border border-amber-500/20 text-[10px] text-amber-700 dark:text-amber-400 flex items-center justify-between">
                          <span>{lang === 'bn' ? 'সম্ভাব্য পয়েন্ট ডিসকাউন্ট মূল্য:' : 'Redeemable points value:'}</span>
                          <span className="font-bold font-mono">
                            ≈ ৳ {((Number(form.reward_points) || 0) * (membershipConfig?.point_redeem_value || 0.5)).toFixed(2)}
                          </span>
                        </div>
                      )}
                    </div>
                  );
                })()}
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-slate-100 dark:border-zinc-800">
                <Button type="button" variant="outline" size="sm" onClick={() => setIsAddModalOpen(false)}>
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={isSubmitting}
                  size="sm"
                  className="bg-[#00df89] hover:bg-[#00c97b] text-[#011812] font-semibold"
                >
                  {isSubmitting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : 'Save Customer'}
                </Button>
              </div>
            </form>
          </Card>
        </div>
      )}

      {/* ---------------------------------------------------- */}
      {/* COLLECT CUSTOMER DUE PAYMENT MODAL                   */}
      {/* ---------------------------------------------------- */}
      {isCollectCustomerDueOpen && collectingCustomer && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs">
          <Card className="max-w-md w-full p-6 bg-white dark:bg-[#121215] border-slate-200 dark:border-zinc-800 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-zinc-800 pb-3">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-amber-500/15 flex items-center justify-center text-amber-500">
                  <Coins className="w-4 h-4" />
                </div>
                <div>
                  <h2 className="text-base font-bold text-slate-900 dark:text-white">
                    {lang === 'bn' ? 'কাস্টমারের বকেয়া আদায়' : 'Collect Customer Due Payment'}
                  </h2>
                  <p className="text-xs text-slate-400">{collectingCustomer.name}</p>
                </div>
              </div>
              <button
                onClick={() => {
                  setIsCollectCustomerDueOpen(false);
                  setCollectingCustomer(null);
                }}
                className="text-slate-400 p-1 cursor-pointer hover:text-slate-700 dark:hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-[#09090b] border border-slate-200 dark:border-zinc-800 space-y-2 text-xs">
              <div className="flex justify-between items-center text-slate-700 dark:text-zinc-300">
                <span>Customer Phone:</span>
                <span className="font-mono font-bold text-slate-900 dark:text-white">
                  {collectingCustomer.phone || 'No phone'}
                </span>
              </div>
              <div className="flex justify-between items-center pt-2 border-t border-slate-200 dark:border-zinc-800">
                <span className="text-slate-500 font-medium">Total Unpaid Customer Due:</span>
                <span className="font-mono text-base font-bold text-amber-500">
                  ৳ {(collectingCustomer.total_due || 0).toLocaleString()}
                </span>
              </div>
            </div>

            <form onSubmit={handleSubmitCustomerDue} className="space-y-3.5 text-xs">
              {/* Payment Amount Input & Quick Chips */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label className="font-semibold text-slate-700 dark:text-zinc-300">
                    {lang === 'bn' ? 'জমার পরিমাণ (৳)' : 'Payment Amount to Collect (৳)'}
                  </label>
                  <div className="flex items-center gap-1.5 text-[10px]">
                    <button
                      type="button"
                      onClick={() => setCustomerDueForm({ ...customerDueForm, amount: String(collectingCustomer.total_due || 0) })}
                      className="px-2 py-0.5 rounded-md font-bold bg-amber-500/15 text-amber-600 border border-amber-500/30 hover:bg-amber-500/25 transition-colors cursor-pointer"
                    >
                      Full Due (৳{(collectingCustomer.total_due || 0).toLocaleString()})
                    </button>
                    {(collectingCustomer.total_due || 0) > 1 && (
                      <button
                        type="button"
                        onClick={() => setCustomerDueForm({ ...customerDueForm, amount: String(Math.round((collectingCustomer.total_due || 0) / 2)) })}
                        className="px-2 py-0.5 rounded-md font-semibold bg-slate-100 dark:bg-zinc-800 text-slate-700 dark:text-zinc-300 hover:bg-slate-200 transition-colors cursor-pointer"
                      >
                        50% (৳{Math.round((collectingCustomer.total_due || 0) / 2).toLocaleString()})
                      </button>
                    )}
                  </div>
                </div>

                <input
                  type="number"
                  required
                  min="1"
                  placeholder={`e.g. ${collectingCustomer.total_due || 0}`}
                  value={customerDueForm.amount}
                  onChange={(e) => setCustomerDueForm({ ...customerDueForm, amount: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl bg-white dark:bg-[#09090b] border border-amber-500/40 text-sm font-bold text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-amber-500"
                />
              </div>

              {/* Payment Method Selector */}
              <div>
                <label className="block font-semibold mb-1 text-slate-700 dark:text-zinc-300">
                  {lang === 'bn' ? 'পেমেন্ট মাধ্যম' : 'Payment Method'}
                </label>
                <Select
                  value={customerDueForm.payment_method}
                  onValueChange={(val) => setCustomerDueForm({ ...customerDueForm, payment_method: val })}
                >
                  <SelectTrigger className="w-full bg-slate-50 dark:bg-[#09090b]">
                    <SelectValue placeholder={lang === 'bn' ? 'পেমেন্ট মাধ্যম নির্বাচন করুন' : 'Payment Method'} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="cash">{lang === 'bn' ? 'নগদ' : 'Cash'}</SelectItem>
                    <SelectItem value="bkash">{lang === 'bn' ? 'বিকাশ' : 'bKash'}</SelectItem>
                    <SelectItem value="nagad">{lang === 'bn' ? 'নগদ (Nagad)' : 'Nagad'}</SelectItem>
                    <SelectItem value="rocket">{lang === 'bn' ? 'রকেট' : 'Rocket'}</SelectItem>
                    <SelectItem value="card">{lang === 'bn' ? 'কার্ড' : 'Card'}</SelectItem>
                    <SelectItem value="bank_transfer">{lang === 'bn' ? 'ব্যাংক ট্রান্সফার' : 'Bank Transfer'}</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Note / Remarks */}
              <div>
                <label className="block font-semibold mb-1 text-slate-700 dark:text-zinc-300">
                  {lang === 'bn' ? 'মন্তব্য (ঐচ্ছিক)' : 'Note / Remarks (Optional)'}
                </label>
                <input
                  type="text"
                  placeholder={lang === 'bn' ? 'যেমন: বাকি টাকা পরিশোধ' : 'e.g. Cleared pending dues'}
                  value={customerDueForm.note}
                  onChange={(e) => setCustomerDueForm({ ...customerDueForm, note: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-[#09090b] border border-slate-200 dark:border-zinc-800 outline-none"
                />
              </div>

              {/* Real-Time Balance Preview */}
              {parseFloat(customerDueForm.amount) > 0 && (
                <div className="p-2.5 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-between text-xs font-semibold text-amber-700 dark:text-amber-400">
                  <span>{lang === 'bn' ? 'বকেয়া অবশিষ্ট থাকবে:' : 'Remaining Customer Due:'}</span>
                  <span className="font-mono text-sm font-bold">
                    ৳ {Math.max(0, (collectingCustomer.total_due || 0) - (parseFloat(customerDueForm.amount) || 0)).toLocaleString()}
                  </span>
                </div>
              )}

              <div className="flex justify-end gap-2 pt-2 border-t border-slate-100 dark:border-zinc-800">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setIsCollectCustomerDueOpen(false);
                    setCollectingCustomer(null);
                  }}
                >
                  {lang === 'bn' ? 'বাতিল' : 'Cancel'}
                </Button>
                <Button
                  type="submit"
                  disabled={isSubmittingCustomerDue}
                  size="sm"
                  className="bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold gap-1.5 shadow-sm"
                >
                  {isSubmittingCustomerDue ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <CheckCircle2 className="w-3.5 h-3.5" />}
                  <span>{lang === 'bn' ? 'টাকা গ্রহণ নিশ্চিত করুন' : 'Confirm Payment'}</span>
                </Button>
              </div>
            </form>
          </Card>
        </div>
      )}

      {/* ---------------------------------------------------- */}
      {/* CUSTOMER MONEY RECEIPT / DUE VOUCHER MODAL           */}
      {/* ---------------------------------------------------- */}
      {customerVoucher && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs">
          <Card className="max-w-md w-full p-6 bg-white dark:bg-[#121215] border-slate-200 dark:border-zinc-800 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-zinc-800 pb-3">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-emerald-500/15 flex items-center justify-center text-[#00a86b] dark:text-[#00df89]">
                  <CheckCircle2 className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-base font-bold text-slate-900 dark:text-white">
                    {lang === 'bn' ? 'বকেয়া জমার রশিদ' : 'Customer Money Receipt'}
                  </h2>
                  <p className="text-xs text-slate-400 font-mono">{customerVoucher.date}</p>
                </div>
              </div>
              <button onClick={() => setCustomerVoucher(null)} className="text-slate-400 p-1 cursor-pointer">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-4 rounded-xl bg-slate-50 dark:bg-[#09090b] border border-slate-200 dark:border-zinc-800 space-y-3 text-xs">
              <div className="text-center pb-2 border-b border-slate-200 dark:border-zinc-800">
                <h3 className="font-bold text-sm text-slate-900 dark:text-white">{mongoShop?.name || 'Shopo Store'}</h3>
                <p className="text-[11px] text-slate-400">{customerVoucher.date}</p>
                <Badge className="bg-emerald-500/15 text-emerald-700 dark:text-[#00df89] border-emerald-500/30 text-[10px] font-bold mt-1">
                  {lang === 'bn' ? 'টাকা জমা সম্পন্ন' : 'Customer Due Settled'}
                </Badge>
              </div>

              <div className="space-y-1.5 text-xs">
                <div className="flex justify-between">
                  <span className="text-slate-500">{lang === 'bn' ? 'কাস্টমার:' : 'Customer:'}</span>
                  <span className="font-semibold text-slate-900 dark:text-white">{customerVoucher.customer_name}</span>
                </div>
                {customerVoucher.customer_phone && (
                  <div className="flex justify-between">
                    <span className="text-slate-500">{lang === 'bn' ? 'মোবাইল নম্বর:' : 'Phone:'}</span>
                    <span className="font-mono text-slate-700 dark:text-zinc-300">{customerVoucher.customer_phone}</span>
                  </div>
                )}
                <div className="flex justify-between">
                  <span className="text-slate-500">{lang === 'bn' ? 'পেমেন্ট মাধ্যম:' : 'Payment Method:'}</span>
                  <span className="font-semibold uppercase">{customerVoucher.payment_method}</span>
                </div>
                {customerVoucher.note && (
                  <div className="flex justify-between">
                    <span className="text-slate-500">{lang === 'bn' ? 'মন্তব্য:' : 'Remarks:'}</span>
                    <span className="text-slate-700 dark:text-zinc-300">{customerVoucher.note}</span>
                  </div>
                )}

                <div className="pt-2 border-t border-slate-200 dark:border-zinc-800 space-y-1 text-xs">
                  <div className="flex justify-between items-center text-sm font-bold text-slate-900 dark:text-white pt-1">
                    <span>{lang === 'bn' ? 'গৃহীত টাকা:' : 'Amount Collected:'}</span>
                    <span className="text-[#00a86b] dark:text-[#00df89] text-base">
                      ৳ {customerVoucher.collected_amount.toLocaleString()}
                    </span>
                  </div>

                  <div className="flex justify-between text-slate-600 dark:text-zinc-400 pt-1">
                    <span>{lang === 'bn' ? 'বকেয়া অবশিষ্ট:' : 'Remaining Customer Due:'}</span>
                    <span className={`font-semibold ${customerVoucher.remaining_customer_due > 0 ? 'text-amber-500 font-bold' : 'text-emerald-600'}`}>
                      ৳ {customerVoucher.remaining_customer_due.toLocaleString()}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-3 border-t border-slate-100 dark:border-zinc-800">
              <Button variant="outline" size="sm" onClick={() => setCustomerVoucher(null)}>
                {lang === 'bn' ? 'বন্ধ করুন' : 'Close'}
              </Button>
              <Button
                size="sm"
                onClick={() => printDueReceipt({
                  voucher: {
                    invoice_number: customerVoucher.settled_sales?.map(s => s.invoice_number).filter(Boolean).join(', ') || 'Due Collection',
                    date: customerVoucher.date,
                    customer_name: customerVoucher.customer_name,
                    customer_phone: customerVoucher.customer_phone,
                    payment_method: customerVoucher.payment_method,
                    note: customerVoucher.note,
                    collected_amount: customerVoucher.collected_amount,
                    remaining_sale_due: 0,
                    customer_total_due: customerVoucher.remaining_customer_due,
                  },
                  shop: mongoShop,
                  lang
                })}
                className="bg-[#00df89] hover:bg-[#00c97b] text-[#011812] font-semibold gap-1 cursor-pointer"
              >
                <Printer className="w-3.5 h-3.5" /> {lang === 'bn' ? 'রশিদ প্রিন্ট করুন' : 'Print Receipt'}
              </Button>
            </div>
          </Card>
        </div>
      )}

      {/* ---------------------------------------------------- */}
      {/* CONFIRM DELETE CUSTOMER MODAL                        */}
      {/* ---------------------------------------------------- */}
      <ConfirmDialog
        isOpen={confirmCustomerDelete.isOpen}
        isLoading={isDeletingCustomer}
        title={lang === 'bn' ? `'${confirmCustomerDelete.customerName}' কাস্টমার প্রোফাইল মুছে ফেলতে চান?` : `Delete customer profile for '${confirmCustomerDelete.customerName}'?`}
        description={lang === 'bn' ? 'এই কাস্টমারের প্রোফাইল ও তথ্য মুছে ফেলা হবে। এই কাজটি পুনরায় ফিরিয়ে আনা যাবে না।' : 'This customer profile will be permanently deleted. This action cannot be undone.'}
        confirmText={lang === 'bn' ? 'হ্যাঁ, মুছে ফেলুন' : 'Yes, Delete'}
        cancelText={lang === 'bn' ? 'বাতিল' : 'Cancel'}
        onConfirm={handleConfirmDeleteCustomer}
        onCancel={() => setConfirmCustomerDelete({ isOpen: false, customerId: null, customerName: '' })}
      />

      {/* ---------------------------------------------------- */}
      {/* CONFIRM DELETE SALE MODAL (FROM PURCHASES)           */}
      {/* ---------------------------------------------------- */}
      <ConfirmDialog
        isOpen={confirmSaleDelete.isOpen}
        isLoading={isDeletingSale}
        title={lang === 'bn' ? `ইনভয়েস '${confirmSaleDelete.invoiceNumber}' মুছে ফেলতে চান?` : `Delete invoice '${confirmSaleDelete.invoiceNumber}'?`}
        description={lang === 'bn' ? 'এই বিক্রিটি মুছে ফেলা হবে, সংশ্লিষ্ট পণ্যগুলোর স্টক পুনরায় ইনভেন্টরিতে ফেরত আসবে এবং অর্জিত পয়েন্ট কাস্টমার থেকে কর্তন করা হবে।' : 'This transaction will be deleted, product quantities will be restored back to stock, and earned reward points will be deducted.'}
        confirmText={lang === 'bn' ? 'হ্যাঁ, মুছে ফেলুন' : 'Yes, Delete'}
        cancelText={lang === 'bn' ? 'বাতিল' : 'Cancel'}
        onConfirm={handleConfirmDeleteSale}
        onCancel={() => setConfirmSaleDelete({ isOpen: false, saleId: null, invoiceNumber: '' })}
      />

      {/* ---------------------------------------------------- */}
      {/* RETURN & REFUND PRODUCT MODAL (FROM PURCHASES)       */}
      {/* ---------------------------------------------------- */}
      <ReturnOrderModal
        isOpen={Boolean(returningSale)}
        onClose={() => setReturningSale(null)}
        order={returningSale}
        onSuccess={() => {
          fetchCustomers();
          if (selectedCustomerId) {
            reloadCustomerHistory(selectedCustomerId);
          }
        }}
      />

    </div>
  );
}
