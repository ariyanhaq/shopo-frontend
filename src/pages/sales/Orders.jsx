/**
 * @file Orders.jsx
 * @description Comprehensive Sales Management page with full View, Edit & Delete capabilities, Live DB sync, Discount & Cash Change tracking, Top Selling Items Pie Chart, and Rich Pagination.
 */
import { useState, useMemo, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useLanguage } from '@/context/LanguageContext';
import { useAuth } from '@/context/AuthContext';
import api from '@/services/api';
import toast from 'react-hot-toast';
import { printSaleReceipt, printDueReceipt } from '@/utils/invoicePrinter';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator
} from '@/components/ui/dropdown-menu';
import {
  Select,
  SelectTrigger,
  SelectContent,
  SelectItem,
  SelectValue
} from '@/components/ui/select';
import ConfirmDialog from '@/components/common/ConfirmDialog';
import Pagination from '@/components/common/Pagination';
import TopSellingPieChart from '@/components/sales/TopSellingPieChart';
import { useBodyScrollLock } from '@/hooks/useBodyScrollLock';
import {
  ShoppingCart, DollarSign, Plus, Search, Filter, Calendar,
  Download, Edit2, Trash2, CheckCircle2, Clock, X, Eye,
  ArrowUpDown, Receipt, CreditCard, Banknote, UserCheck,
  TrendingUp, ShieldCheck, Printer, AlertTriangle, Loader2,
  Percent, Coins, HelpCircle, Tag, FileText, ShoppingBag,
  RotateCcw, Undo2, Minus, AlertCircle, RefreshCw, Copy,
  Check, User, Phone, ChevronDown, Sparkles, MoreVertical
} from 'lucide-react';

const safeMoney = (val, fallback = 0) => {
  const n = Number(val);
  return isNaN(n) ? fallback.toLocaleString() : n.toLocaleString();
};

const safeDate = (val) => {
  if (!val) return 'N/A';
  const d = new Date(val);
  return isNaN(d.getTime()) ? String(val) : d.toLocaleString();
};

export default function Orders() {
  const navigate = useNavigate();
  const { lang, t } = useLanguage();
  const { mongoShop } = useAuth();

  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [salesOrders, setSalesOrders] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [copiedInvoice, setCopiedInvoice] = useState(null);

  // Pagination State
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  // View Receipt Modal State
  const [selectedOrder, setSelectedOrder] = useState(null);

  // Collect Due Modal State
  const [isCollectModalOpen, setIsCollectModalOpen] = useState(false);
  const [collectingOrder, setCollectingOrder] = useState(null);
  const [isCollectingDue, setIsCollectingDue] = useState(false);
  const [collectForm, setCollectForm] = useState({
    amount: '',
    payment_method: 'cash',
    note: '',
  });
  const [collectedVoucher, setCollectedVoucher] = useState(null);

  // Edit Sale Modal State
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingSale, setEditingSale] = useState(null);
  const [isUpdating, setIsUpdating] = useState(false);

  // Return & Refund Modal State
  const [isReturnModalOpen, setIsReturnModalOpen] = useState(false);
  const [returningOrder, setReturningOrder] = useState(null);
  const [returnQuantities, setReturnQuantities] = useState({});
  const [returnReason, setReturnReason] = useState('');
  const [isSubmittingReturn, setIsSubmittingReturn] = useState(false);

  useBodyScrollLock(
    Boolean(
      selectedOrder ||
      isCollectModalOpen ||
      collectedVoucher ||
      isEditModalOpen ||
      isReturnModalOpen
    )
  );

  const [editForm, setEditForm] = useState({
    id: '',
    invoice_number: '',
    payment_method: 'cash',
    discount_type: 'flat',
    discount_value: '',
    paid_amount: '',
    tendered_amount: '',
    note: '',
  });

  const fetchSales = async () => {
    setIsLoading(true);
    try {
      const res = await api.sales.list({ limit: 100 });
      const rawList = Array.isArray(res?.data)
        ? res.data
        : Array.isArray(res?.data?.docs)
        ? res.data.docs
        : [];
      setSalesOrders(rawList);
    } catch (err) {
      console.warn('Failed to load sales from DB:', err.message);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchSales();
  }, []);

  // Filtered Orders
  const filteredOrders = useMemo(() => {
    return salesOrders.filter((order) => {
      const q = searchQuery.toLowerCase().trim();
      const inv = order.invoice_number ? order.invoice_number.toLowerCase() : '';
      const cust = order.customer_id?.name ? order.customer_id.name.toLowerCase() : 'walk-in customer';
      const phone = order.customer_id?.phone ? order.customer_id.phone.toLowerCase() : '';
      const matchesSearch = !q || inv.includes(q) || cust.includes(q) || phone.includes(q);

      const matchesStatus =
        statusFilter === 'all' ||
        (statusFilter === 'paid' && order.status !== 'returned' && (order.payment_status === 'paid' || (order.due_amount || 0) === 0)) ||
        (statusFilter === 'due' && order.status !== 'returned' && (order.due_amount || 0) > 0) ||
        (statusFilter === 'returned' && (order.status === 'returned' || order.status === 'partially_returned'));

      return matchesSearch && matchesStatus;
    });
  }, [salesOrders, searchQuery, statusFilter]);

  // Reset to page 1 on filter or search changes
  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, statusFilter, pageSize]);

  // Paginated Orders Slice
  const paginatedOrders = useMemo(() => {
    const startIndex = (currentPage - 1) * pageSize;
    return filteredOrders.slice(startIndex, startIndex + pageSize);
  }, [filteredOrders, currentPage, pageSize]);

  // KPI Calculations
  const stats = useMemo(() => {
    const totalSalesCount = salesOrders.length;
    const totalRevenue = salesOrders.reduce((acc, o) => {
      if (o.status === 'cancelled') return acc;
      const net = (o.total || 0) - (o.refunded_amount || 0);
      return acc + Math.max(0, net);
    }, 0);
    const totalDue = salesOrders.reduce((acc, o) => acc + (o.due_amount || 0), 0);
    const paidCount = salesOrders.filter((o) => (o.due_amount || 0) === 0 && o.status !== 'returned').length;
    const dueCount = salesOrders.filter((o) => (o.due_amount || 0) > 0 && o.status !== 'returned').length;
    const returnedCount = salesOrders.filter((o) => o.status === 'returned' || o.status === 'partially_returned').length;
    const averageOrder = totalSalesCount > 0 ? Math.round(totalRevenue / totalSalesCount) : 0;

    return {
      totalSalesCount,
      totalRevenue,
      totalDue,
      paidCount,
      dueCount,
      returnedCount,
      averageOrder,
    };
  }, [salesOrders]);

  // Copy invoice number with feedback
  const handleCopyInvoice = (e, inv) => {
    e.stopPropagation();
    if (!inv) return;
    navigator.clipboard?.writeText(inv);
    setCopiedInvoice(inv);
    toast.success(lang === 'bn' ? `ইনভয়েস #${inv} কপি হয়েছে!` : `Invoice #${inv} copied!`);
    setTimeout(() => setCopiedInvoice(null), 2000);
  };

  // Open Collect Due Modal
  const handleOpenCollectDue = (order) => {
    setCollectingOrder(order);
    setCollectForm({
      amount: String(order.due_amount || 0),
      payment_method: 'cash',
      note: '',
    });
    setIsCollectModalOpen(true);
  };

  // Submit Collect Due Payment
  const handleSubmitCollectDue = async (e) => {
    e.preventDefault();
    if (!collectingOrder) return;

    const amountNum = parseFloat(collectForm.amount);
    if (isNaN(amountNum) || amountNum <= 0) {
      toast.error(lang === 'bn' ? 'সঠিক জমার পরিমাণ লিখুন (০ এর বেশি)।' : 'Please enter a valid payment amount greater than 0.');
      return;
    }

    setIsCollectingDue(true);
    try {
      const res = await api.sales.collectDue(collectingOrder._id, {
        amount: amountNum,
        payment_method: collectForm.payment_method,
        note: collectForm.note,
      });

      toast.success(
        lang === 'bn'
          ? `৳${amountNum.toLocaleString()} বকেয়া সফলভাবে গ্রহণ করা হয়েছে!`
          : `Collected ৳${amountNum.toLocaleString()} due payment successfully!`
      );

      setIsCollectModalOpen(false);
      
      setCollectedVoucher({
        invoice_number: collectingOrder.invoice_number,
        customer_name: collectingOrder.customer_id?.name || 'Walk-in Customer',
        customer_phone: collectingOrder.customer_id?.phone || '',
        collected_amount: amountNum,
        payment_method: collectForm.payment_method,
        remaining_sale_due: res.data?.remaining_sale_due ?? Math.max(0, collectingOrder.due_amount - amountNum),
        customer_total_due: res.data?.customer_total_due ?? 0,
        total_bill: collectingOrder.total,
        date: new Date().toLocaleString(),
        note: collectForm.note,
      });

      setCollectingOrder(null);
      fetchSales();
    } catch (err) {
      toast.error(err.message || 'Failed to collect due payment.');
    } finally {
      setIsCollectingDue(false);
    }
  };

  // Open Edit Sale Modal
  const handleOpenEdit = (order) => {
    setEditingSale(order);
    setEditForm({
      id: order._id,
      invoice_number: order.invoice_number,
      payment_method: order.payment_method || 'cash',
      discount_type: order.discount_type || 'flat',
      discount_value: order.discount_value !== undefined ? String(order.discount_value) : String(order.discount || 0),
      paid_amount: String(order.paid_amount !== undefined ? order.paid_amount : order.total),
      tendered_amount: order.tendered_amount ? String(order.tendered_amount) : '',
      note: order.note || '',
    });
    setIsEditModalOpen(true);
  };

  // Submit Edit Sale
  const handleUpdateSale = async (e) => {
    e.preventDefault();
    if (!editForm.id) return;

    setIsUpdating(true);
    try {
      const discVal = parseFloat(editForm.discount_value) || 0;
      const paid = parseFloat(editForm.paid_amount) || 0;
      const tendered = parseFloat(editForm.tendered_amount) || paid;

      await api.sales.update(editForm.id, {
        payment_method: editForm.payment_method,
        discount_type: editForm.discount_type,
        discount_value: discVal,
        paid_amount: paid,
        tendered_amount: tendered,
        note: editForm.note,
      });

      toast.success(lang === 'bn' ? 'বিক্রয় ইনভয়েস সফলভাবে আপডেট হয়েছে!' : 'Sale invoice updated successfully!');
      setIsEditModalOpen(false);
      setEditingSale(null);
      fetchSales();
    } catch (err) {
      toast.error(err.message || 'Failed to update sale invoice.');
    } finally {
      setIsUpdating(false);
    }
  };

  const getItemDocId = (val) => {
    if (!val) return '';
    if (typeof val === 'object') {
      return String(val._id || val.id || '');
    }
    return String(val);
  };

  // Open Return Modal
  const handleOpenReturn = (order) => {
    setReturningOrder(order);
    const returnedMap = {};
    if (Array.isArray(order.return_history)) {
      order.return_history.forEach((rev) => {
        (rev.items || []).forEach((rit) => {
          const prodId = getItemDocId(rit.product_id);
          const varId = getItemDocId(rit.variant_id);
          const key = `${prodId}_${varId || 'none'}`;
          returnedMap[key] = (returnedMap[key] || 0) + (rit.quantity || 0);
        });
      });
    }

    const initialQty = {};
    (order.items || []).forEach((it) => {
      const prodId = getItemDocId(it.product_id);
      const varId = getItemDocId(it.variant_id);
      const key = `${prodId}_${varId || 'none'}`;
      const alreadyReturned = returnedMap[key] || 0;
      const maxAvailable = Math.max(0, it.quantity - alreadyReturned);
      initialQty[key] = maxAvailable;
    });

    setReturnQuantities(initialQty);
    setReturnReason('');
    setIsReturnModalOpen(true);
  };

  // Return & Refund Summary Preview
  const returnSummary = useMemo(() => {
    if (!returningOrder || !Array.isArray(returningOrder.items)) {
      return { totalReturnGross: 0, netRefund: 0, pointsToDeduct: 0, pointsToRefund: 0, itemsCount: 0, dueReduction: 0, cashRefund: 0 };
    }

    const returnedMap = {};
    if (Array.isArray(returningOrder.return_history)) {
      returningOrder.return_history.forEach((rev) => {
        (rev.items || []).forEach((rit) => {
          const prodId = getItemDocId(rit.product_id);
          const varId = getItemDocId(rit.variant_id);
          const key = `${prodId}_${varId || 'none'}`;
          returnedMap[key] = (returnedMap[key] || 0) + (rit.quantity || 0);
        });
      });
    }

    let totalReturnGross = 0;
    let itemsCount = 0;

    returningOrder.items.forEach((it) => {
      const prodId = getItemDocId(it.product_id);
      const varId = getItemDocId(it.variant_id);
      const key = `${prodId}_${varId || 'none'}`;
      const qty = Number(returnQuantities[key]) || 0;
      if (qty > 0) {
        totalReturnGross += (Number(it.unit_price) || 0) * qty;
        itemsCount += qty;
      }
    });

    const discountRatio = returningOrder.subtotal > 0 ? Math.min(1, totalReturnGross / returningOrder.subtotal) : 0;
    const generalDiscountRefund = (returningOrder.discount || 0) * discountRatio;
    const tierDiscountRefund = (returningOrder.tier_discount_amount || 0) * discountRatio;
    const rewardDiscountRefund = (returningOrder.reward_discount_amount || 0) * discountRatio;

    const netRefund = Math.max(0, Math.round((totalReturnGross - generalDiscountRefund - tierDiscountRefund - rewardDiscountRefund) * 100) / 100);
    const pointsToDeduct = Math.round((returningOrder.reward_points_earned || 0) * discountRatio);
    const pointsToRefund = Math.round((returningOrder.reward_points_redeemed || 0) * discountRatio);

    let dueReduction = 0;
    let cashRefund = 0;
    const currentDue = returningOrder.due_amount || 0;

    if (currentDue > 0) {
      if (netRefund <= currentDue) {
        dueReduction = netRefund;
      } else {
        dueReduction = currentDue;
        cashRefund = netRefund - currentDue;
      }
    } else {
      cashRefund = netRefund;
    }

    return {
      totalReturnGross,
      netRefund,
      pointsToDeduct,
      pointsToRefund,
      itemsCount,
      dueReduction,
      cashRefund,
    };
  }, [returningOrder, returnQuantities]);

  // Submit Product Return
  const handleSubmitReturn = async (e) => {
    e.preventDefault();
    if (!returningOrder || returnSummary.itemsCount <= 0) {
      toast.error(lang === 'bn' ? 'অনুগ্রহ করে ফেরত দেওয়ার জন্য পণ্য নির্বাচন করুন।' : 'Please select at least 1 item to return.');
      return;
    }

    setIsSubmittingReturn(true);
    try {
      const payloadItems = returningOrder.items.map((it) => {
        const prodId = getItemDocId(it.product_id);
        const varId = getItemDocId(it.variant_id);
        const key = `${prodId}_${varId || 'none'}`;
        const qty = Number(returnQuantities[key]) || 0;
        return {
          product_id: prodId,
          name: it.name,
          variant_id: varId || undefined,
          variant_name: it.variant_name || '',
          quantity: qty,
        };
      }).filter((it) => it.quantity > 0);

      await api.sales.return(returningOrder._id, {
        items: payloadItems,
        reason: returnReason,
      });

      toast.success(
        lang === 'bn'
          ? `পণ্য ফেরত ও রিফান্ড সম্পন্ন! রিফান্ড: ৳${returnSummary.netRefund.toLocaleString()}`
          : `Return processed successfully! Refund: ৳${returnSummary.netRefund.toLocaleString()}`
      );

      setIsReturnModalOpen(false);
      setReturningOrder(null);
      fetchSales();
    } catch (err) {
      toast.error(err.message || 'Failed to process return.');
    } finally {
      setIsSubmittingReturn(false);
    }
  };

  // Delete Sale Dialog State
  const [isDeleting, setIsDeleting] = useState(false);
  const [confirmDeleteDialog, setConfirmDeleteDialog] = useState({
    isOpen: false,
    saleId: null,
    invoiceNumber: '',
  });

  const handleDeleteSale = (orderId, invoiceNumber) => {
    setConfirmDeleteDialog({
      isOpen: true,
      saleId: orderId,
      invoiceNumber,
    });
  };

  const handleConfirmDeleteSale = async () => {
    if (!confirmDeleteDialog.saleId) return;
    setIsDeleting(true);
    try {
      await api.sales.delete(confirmDeleteDialog.saleId);
      toast.success(lang === 'bn' ? `ইনভয়েস '${confirmDeleteDialog.invoiceNumber}' মুছে ফেলা হয়েছে এবং স্টক ফেরত এসেছে!` : `Invoice '${confirmDeleteDialog.invoiceNumber}' deleted & stock restored!`);
      if (selectedOrder?._id === confirmDeleteDialog.saleId) {
        setSelectedOrder(null);
      }
      setConfirmDeleteDialog({ isOpen: false, saleId: null, invoiceNumber: '' });
      fetchSales();
    } catch (err) {
      toast.error(err.message || 'Failed to delete sale invoice.');
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="space-y-6 font-sans pb-12">
      
      {/* ---------------------------------------------------- */}
      {/* HEADER SECTION                                       */}
      {/* ---------------------------------------------------- */}
      {/* TOP HEADER & ACTION ROW                              */}
      {/* ---------------------------------------------------- */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div className="min-w-0">
          <h1 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white tracking-tight flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-[#00df89]/10 text-[#00df89] flex items-center justify-center border border-[#00df89]/20 shadow-xs shrink-0">
              <ShoppingCart className="w-5 h-5 stroke-[2.2]" />
            </div>
            <span>{lang === 'bn' ? 'বিক্রয় ও ইনভয়েস হিস্ট্রি' : 'Sales History & Invoices'}</span>
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-zinc-400 font-normal mt-1">
            {lang === 'bn'
              ? 'সকল ক্যাশ মেমো, পণ্যের বিক্রয় রিপোর্ট, ডিসকাউন্ট ও বকেয়া ব্যবস্থাপনা'
              : 'Track live sales, edit transaction details, restore stock on delete, and print cash memos.'}
          </p>
        </div>

        <div className="flex items-center gap-2.5 shrink-0 flex-wrap">
          <Button
            variant="outline"
            size="sm"
            onClick={fetchSales}
            disabled={isLoading}
            className="h-10 px-3.5 border-slate-200 dark:border-zinc-800 text-slate-700 dark:text-zinc-300 hover:bg-slate-100 dark:hover:bg-zinc-800 gap-1.5 cursor-pointer shadow-xs whitespace-nowrap shrink-0"
            title="Refresh Sales"
          >
            <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin text-[#00df89]' : ''}`} />
            <span className="hidden sm:inline font-semibold">{lang === 'bn' ? 'রিফ্রেশ' : 'Refresh'}</span>
          </Button>

          <Button
            onClick={() => navigate('/sales/new')}
            className="bg-[#00df89] hover:bg-[#00c97b] text-[#011812] font-bold text-xs sm:text-sm h-10 px-4 gap-2 shadow-xs cursor-pointer whitespace-nowrap shrink-0"
          >
            <Plus className="w-4 h-4 stroke-[2.5]" />
            <span>{lang === 'bn' ? 'নতুন বিক্রি তৈরি করুন' : 'New Sale'}</span>
          </Button>
        </div>
      </div>

      {/* ---------------------------------------------------- */}
      {/* KPI STAT CARDS                                       */}
      {/* ---------------------------------------------------- */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="p-4 sm:p-5 border border-slate-200/90 dark:border-zinc-800/80 dark:bg-[#121215] shadow-xs relative overflow-hidden group hover:border-[#00df89]/30 transition-all">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 dark:text-zinc-400">
              {lang === 'bn' ? 'মোট বিক্রয়' : 'Total Invoices'}
            </span>
            <div className="w-8 h-8 rounded-xl bg-blue-500/10 text-blue-500 flex items-center justify-center border border-blue-500/20 shadow-2xs">
              <FileText className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white mt-2">
            {isLoading ? <Skeleton className="h-8 w-20 my-0.5" /> : stats.totalSalesCount}
          </div>
          <div className="text-[11px] text-slate-400 mt-1 flex items-center gap-1">
            <span>{stats.paidCount} paid</span>
            <span>•</span>
            <span className="text-amber-500 font-medium">{stats.dueCount} due</span>
          </div>
        </Card>

        <Card className="p-4 sm:p-5 border border-slate-200/90 dark:border-zinc-800/80 dark:bg-[#121215] shadow-xs relative overflow-hidden group hover:border-[#00df89]/30 transition-all">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 dark:text-zinc-400">
              {lang === 'bn' ? 'মোট সংগৃহীত আয়' : 'Total Revenue'}
            </span>
            <div className="w-8 h-8 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-[#00df89] flex items-center justify-center border border-emerald-500/20 shadow-2xs">
              <DollarSign className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl sm:text-3xl font-extrabold text-[#00a86b] dark:text-[#00df89] mt-2">
            {isLoading ? <Skeleton className="h-8 w-28 my-0.5" /> : `৳ ${stats.totalRevenue.toLocaleString()}`}
          </div>
          <div className="text-[11px] text-[#00a86b] dark:text-[#00df89] mt-1 font-medium">
            {lang === 'bn' ? 'নেট বিক্রয় মূল্য' : 'Net sales collected'}
          </div>
        </Card>

        <Card className="p-4 sm:p-5 border border-slate-200/90 dark:border-zinc-800/80 dark:bg-[#121215] shadow-xs relative overflow-hidden group hover:border-amber-500/30 transition-all">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 dark:text-zinc-400">
              {lang === 'bn' ? 'বকেয়া পাওনা' : 'Pending Customer Due'}
            </span>
            <div className="w-8 h-8 rounded-xl bg-amber-500/10 text-amber-500 flex items-center justify-center border border-amber-500/20 shadow-2xs">
              <Coins className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl sm:text-3xl font-extrabold text-amber-500 mt-2">
            {isLoading ? <Skeleton className="h-8 w-24 my-0.5" /> : `৳ ${stats.totalDue.toLocaleString()}`}
          </div>
          <div className="text-[11px] text-amber-500 mt-1 font-medium">
            {stats.dueCount} {lang === 'bn' ? 'টি মেমোতে বকেয়া' : 'unsettled invoices'}
          </div>
        </Card>

        <Card className="p-4 sm:p-5 border border-slate-200/90 dark:border-zinc-800/80 dark:bg-[#121215] shadow-xs relative overflow-hidden group hover:border-[#00df89]/30 transition-all">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 dark:text-zinc-400">
              {lang === 'bn' ? 'গড় অর্ডার সাইজ' : 'Average Order Value'}
            </span>
            <div className="w-8 h-8 rounded-xl bg-purple-500/10 text-purple-500 flex items-center justify-center border border-purple-500/20 shadow-2xs">
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white mt-2">
            {isLoading ? <Skeleton className="h-8 w-24 my-0.5" /> : `৳ ${stats.averageOrder.toLocaleString()}`}
          </div>
          <div className="text-[11px] text-slate-400 mt-1">
            {lang === 'bn' ? 'প্রতি ইনভয়েস গড়' : 'Per transaction average'}
          </div>
        </Card>
      </div>

      {/* ---------------------------------------------------- */}
      {/* FILTER & SEARCH BAR                                  */}
      {/* ---------------------------------------------------- */}
      <Card className="p-3.5 border border-slate-200/90 dark:border-zinc-800/80 dark:bg-[#121215] shadow-xs">
        <div className="flex flex-col md:flex-row items-center justify-between gap-3">
          {/* Search Input */}
          <div className="w-full md:w-96 relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder={lang === 'bn' ? 'ইনভয়েস #, কাস্টমারের নাম বা ফোন খুঁজুন...' : 'Search by invoice #, customer name or phone...'}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-8 py-2 rounded-xl bg-slate-50 dark:bg-[#09090b] border border-slate-200 dark:border-zinc-800 text-xs text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-[#00df89] transition-all"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-white p-0.5"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Status Filter Dropdown */}
          <div className="flex items-center gap-2 w-full md:w-auto">
            <div className="w-full md:w-48">
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger size="sm" className="bg-slate-50 dark:bg-[#09090b] w-full h-9.5 rounded-xl border border-slate-200 dark:border-zinc-800 text-xs font-semibold">
                  <SelectValue placeholder={lang === 'bn' ? 'সকল ইনভয়েস' : 'All Invoices'} />
                </SelectTrigger>
                <SelectContent className="min-w-[180px]">
                  <SelectItem value="all">
                    {lang === 'bn' ? 'সকল ইনভয়েস' : 'All Invoices'}
                  </SelectItem>
                  <SelectItem value="paid">
                    {lang === 'bn' ? 'পরিশোধিত' : 'Paid in Full'}
                  </SelectItem>
                  <SelectItem value="due">
                    {lang === 'bn' ? 'বকেয়া' : 'Due / Unpaid'}
                  </SelectItem>
                  <SelectItem value="returned">
                    {lang === 'bn' ? 'ফেরত' : 'Returned'}
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>
      </Card>

      {/* ---------------------------------------------------- */}
      {/* SALES ORDERS TABLE (FIRST)                           */}
      {/* ---------------------------------------------------- */}
      <Card className="p-0 border border-slate-200/90 dark:border-zinc-800/80 dark:bg-[#121215] shadow-xs overflow-hidden">
        {isLoading ? (
          <div className="p-6 space-y-3">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <Skeleton key={i} className="h-12 w-full rounded-xl" />
            ))}
          </div>
        ) : filteredOrders.length === 0 ? (
          <div className="p-12 text-center space-y-3">
            <div className="w-12 h-12 rounded-2xl bg-slate-100 dark:bg-zinc-800/70 text-slate-400 dark:text-zinc-500 flex items-center justify-center mx-auto">
              <ShoppingCart className="w-6 h-6" />
            </div>
            <h3 className="text-sm font-bold text-slate-800 dark:text-zinc-200">
              {searchQuery || statusFilter !== 'all'
                ? lang === 'bn'
                  ? 'কোন ইনভয়েস পাওয়া যায়নি'
                  : 'No Matching Sales Invoices'
                : lang === 'bn'
                ? 'এখনও কোন বিক্রয় নেই'
                : 'No Sales Recorded Yet'}
            </h3>
            <p className="text-xs text-slate-500 dark:text-zinc-400 max-w-sm mx-auto">
              {searchQuery || statusFilter !== 'all'
                ? lang === 'bn'
                  ? 'অনুগ্রহ করে সার্চ কীওয়ার্ড বা ফিল্টার পরিবর্তন করে পুনরায় চেষ্টা করুন।'
                  : 'Try adjusting your search query or status filter to see sales orders.'
                : lang === 'bn'
                ? 'কাউন্টারে নতুন বিক্রয় শুরু করুন বা চালান তৈরি করুন।'
                : 'Generate your first cash memo or sale transaction.'}
            </p>
            {searchQuery || statusFilter !== 'all' ? (
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setSearchQuery('');
                  setStatusFilter('all');
                }}
                className="text-xs font-semibold cursor-pointer"
              >
                {lang === 'bn' ? 'ফিল্টার ক্লিয়ার করুন' : 'Clear Filters'}
              </Button>
            ) : (
              <Button
                size="sm"
                onClick={() => navigate('/sales/new')}
                className="bg-[#00df89] hover:bg-[#00c97b] text-[#011812] text-xs font-bold cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5 mr-1 stroke-[2.5]" />
                <span>{lang === 'bn' ? 'নতুন বিক্রি তৈরি করুন' : 'New Sale'}</span>
              </Button>
            )}
          </div>
        ) : (
          <div>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-slate-600 dark:text-zinc-300 min-w-[1050px]">
                <thead className="bg-slate-50 dark:bg-zinc-900/60 border-b border-slate-200 dark:border-zinc-800 text-[11px] font-bold text-slate-400 dark:text-zinc-500 uppercase tracking-wider select-none">
                  <tr>
                    <th className="py-3.5 px-4 whitespace-nowrap">{lang === 'bn' ? 'ইনভয়েস ও তারিখ' : 'Invoice & Date'}</th>
                    <th className="py-3.5 px-4 whitespace-nowrap">{lang === 'bn' ? 'কাস্টমার' : 'Customer'}</th>
                    <th className="py-3.5 px-4 whitespace-nowrap">{lang === 'bn' ? 'পণ্যসমূহ' : 'Items'}</th>
                    <th className="py-3.5 px-4 whitespace-nowrap">{lang === 'bn' ? 'ডিসকাউন্ট' : 'Discount'}</th>
                    <th className="py-3.5 px-4 whitespace-nowrap">{lang === 'bn' ? 'পেমেন্ট ও স্ট্যাটাস' : 'Payment / Due Status'}</th>
                    <th className="py-3.5 px-4 whitespace-nowrap">{lang === 'bn' ? 'মোট বিল' : 'Net Total (৳)'}</th>
                    <th className="py-3.5 px-4 text-right w-[160px] min-w-[160px] whitespace-nowrap">{lang === 'bn' ? 'অ্যাকশন' : 'Actions'}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-zinc-800/80">
                  {paginatedOrders.map((order, idx) => {
                    const isDue = (order.due_amount || 0) > 0;
                    const isCopied = copiedInvoice === order.invoice_number;
                    const items = Array.isArray(order.items) ? order.items : [];
                    const isLastRows = idx >= paginatedOrders.length - 2;

                    return (
                      <tr
                        key={order._id}
                        className="hover:bg-slate-50/70 dark:hover:bg-zinc-800/40 transition-colors group"
                      >
                        {/* Invoice & Date */}
                        <td className="py-3.5 px-4 whitespace-nowrap">
                          <div className="flex items-center gap-1.5 font-mono text-xs font-bold text-slate-900 dark:text-white">
                            <span>{order.invoice_number}</span>
                            <button
                              type="button"
                              onClick={(e) => handleCopyInvoice(e, order.invoice_number)}
                              className="p-1 rounded-md text-slate-400 hover:text-slate-700 dark:hover:text-zinc-200 hover:bg-slate-100 dark:hover:bg-zinc-800 transition-colors cursor-pointer"
                              title={isCopied ? 'Copied!' : 'Copy Invoice #'}
                            >
                              {isCopied ? <Check className="w-3.5 h-3.5 text-[#00df89]" /> : <Copy className="w-3.5 h-3.5" />}
                            </button>
                          </div>
                          <div className="text-[11px] text-slate-400 mt-0.5 flex items-center gap-1">
                            <Calendar className="w-3 h-3 text-slate-400 shrink-0" />
                            <span>
                              {order.created_at || order.date
                                ? new Date(order.created_at || order.date).toLocaleDateString()
                                : 'N/A'}
                            </span>
                            <span>&middot;</span>
                            <span>
                              {order.created_at || order.date
                                ? new Date(order.created_at || order.date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                                : ''}
                            </span>
                          </div>
                        </td>

                        {/* Customer Column */}
                        <td className="py-3.5 px-4">
                          <div className="flex items-center gap-2.5">
                            <div className="w-8 h-8 rounded-xl bg-slate-100 dark:bg-zinc-800 border border-slate-200/80 dark:border-zinc-700 flex items-center justify-center text-slate-600 dark:text-zinc-300 text-xs font-bold shrink-0">
                              {order.customer_id?.name ? order.customer_id.name.charAt(0).toUpperCase() : 'W'}
                            </div>
                            <div className="min-w-0">
                              <div className="font-bold text-slate-900 dark:text-white text-xs truncate max-w-[160px]">
                                {order.customer_id?.name || (lang === 'bn' ? 'খুচরা ক্রেতা' : 'Walk-in Customer')}
                              </div>
                              {order.customer_id?.phone ? (
                                <div className="text-[11px] text-slate-400 font-mono flex items-center gap-1 mt-0.5">
                                  <Phone className="w-3 h-3 text-slate-400" />
                                  <span>{order.customer_id.phone}</span>
                                </div>
                              ) : (
                                <div className="text-[10px] text-slate-400">{lang === 'bn' ? 'খুচরা' : 'Retail'}</div>
                              )}
                            </div>
                          </div>
                        </td>

                        {/* Items Column */}
                        <td className="py-3.5 px-4">
                          {items.length === 0 ? (
                            <span className="text-slate-400 text-xs">1 item</span>
                          ) : (
                            <div className="flex flex-wrap items-center gap-1.5 max-w-xs">
                              {items.slice(0, 2).map((it, idx) => (
                                <span
                                  key={idx}
                                  className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-zinc-800 text-slate-800 dark:text-zinc-200 border border-slate-200/80 dark:border-zinc-700/80 text-[11px] font-medium max-w-[150px] truncate shadow-2xs"
                                  title={`${it.name}${it.variant_name ? ` (${it.variant_name})` : ''} × ${it.quantity}`}
                                >
                                  <span className="truncate">{it.name}</span>
                                  <span className="font-bold text-slate-900 dark:text-white shrink-0 font-mono">
                                    ({it.quantity})
                                  </span>
                                </span>
                              ))}
                              {items.length > 2 && (
                                <span
                                  className="inline-flex items-center px-2 py-1 rounded-lg bg-slate-100 dark:bg-zinc-800 text-slate-500 dark:text-zinc-400 text-[10px] font-bold border border-slate-200 dark:border-zinc-700"
                                  title={items.map((it) => `${it.name} (${it.quantity})`).join('\n')}
                                >
                                  +{items.length - 2} more
                                </span>
                              )}
                            </div>
                          )}
                        </td>

                        {/* Discount Column */}
                        <td className="py-3.5 px-4 whitespace-nowrap">
                          {Number(order.discount || 0) > 0 ? (
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/20 text-[11px] font-bold">
                              - ৳{safeMoney(order.discount)}{' '}
                              {order.discount_type === 'percentage' ? `(${order.discount_value}%)` : ''}
                            </span>
                          ) : (
                            <span className="text-slate-400 font-normal">None</span>
                          )}
                        </td>

                        {/* Payment & Due Status Column */}
                        <td className="py-3.5 px-4 whitespace-nowrap">
                          <div className="flex flex-col items-start gap-1.5">
                            <div className="flex items-center gap-1.5 flex-wrap">
                              {/* Payment Method */}
                              <span className="capitalize px-2.5 py-0.5 rounded-md bg-slate-100 dark:bg-zinc-800 text-slate-700 dark:text-zinc-300 font-bold text-[11px] uppercase tracking-wide border border-slate-200/80 dark:border-zinc-700">
                                {order.payment_method || 'cash'}
                              </span>

                              {/* Returned Badges */}
                              {order.status === 'returned' && (
                                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold bg-rose-500/15 text-rose-600 dark:text-rose-400 border border-rose-500/30">
                                  <RotateCcw className="w-3 h-3" />
                                  <span>{lang === 'bn' ? 'সম্পূর্ণ ফেরত' : 'Returned'}</span>
                                </span>
                              )}
                              {order.status === 'partially_returned' && (
                                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold bg-amber-500/15 text-amber-600 dark:text-amber-400 border border-amber-500/30">
                                  <RotateCcw className="w-3 h-3" />
                                  <span>{lang === 'bn' ? 'আংশিক ফেরত' : 'Partial'}</span>
                                </span>
                              )}
                            </div>

                            {/* Settlement Pill */}
                            {order.status === 'returned' ? (
                              <span className="text-[11px] text-rose-500 font-semibold font-mono">
                                {lang === 'bn' ? 'রিফান্ড:' : 'Refunded:'} ৳{safeMoney(order.refunded_amount || order.total)}
                              </span>
                            ) : isDue ? (
                              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/15 text-amber-600 dark:text-amber-400 border border-amber-500/30">
                                <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse" />
                                <span>Due: ৳{safeMoney(order.due_amount)}</span>
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/10 text-emerald-600 dark:text-[#00df89] border border-emerald-500/20">
                                <span className="w-1.5 h-1.5 rounded-full bg-[#00df89]" />
                                <span>Paid in Full</span>
                              </span>
                            )}
                          </div>
                        </td>

                        {/* Net Total (৳) */}
                        <td className="py-3.5 px-4 font-bold font-mono text-sm text-[#00a86b] dark:text-[#00df89] whitespace-nowrap">
                          <div className="flex flex-col">
                            <span className={order.status === 'returned' ? 'line-through text-slate-400 font-normal text-xs' : ''}>
                              ৳ {safeMoney(order.total)}
                            </span>
                            {order.status === 'partially_returned' && Number(order.refunded_amount) > 0 && (
                              <span className="text-[10px] text-rose-500 font-medium font-mono">
                                - ৳{safeMoney(order.refunded_amount)} refunded
                              </span>
                            )}
                          </div>
                        </td>

                        {/* Actions Toolbar */}
                        <td className="py-3.5 px-4 text-right whitespace-nowrap w-[160px] min-w-[160px]">
                          <div className="flex items-center justify-end gap-1.5">
                            {isDue && order.status !== 'returned' && (
                              <button
                                type="button"
                                onClick={() => handleOpenCollectDue(order)}
                                title={lang === 'bn' ? 'বকেয়া টাকা গ্রহণ করুন' : 'Collect Due Payment'}
                                className="h-8 px-2.5 rounded-lg bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold text-xs flex items-center gap-1.5 transition-colors cursor-pointer shadow-xs shrink-0"
                              >
                                <Coins className="w-3.5 h-3.5" />
                                <span>{lang === 'bn' ? 'বকেয়া' : 'Due'}</span>
                              </button>
                            )}
                            <button
                              type="button"
                              onClick={() => setSelectedOrder(order)}
                              title={lang === 'bn' ? 'মেমো বিবরণ দেখুন' : 'View Receipt Memo'}
                              className="w-8 h-8 rounded-lg bg-slate-100 dark:bg-zinc-800 hover:bg-slate-200 dark:hover:bg-zinc-700 text-slate-700 dark:text-zinc-300 flex items-center justify-center transition-colors cursor-pointer border border-slate-200/80 dark:border-zinc-700/80 shrink-0"
                            >
                              <Eye className="w-4 h-4" />
                            </button>
                            <button
                              type="button"
                              onClick={() => printSaleReceipt({ order, shop: mongoShop, lang })}
                              title={lang === 'bn' ? 'ক্যাশ মেমো প্রিন্ট করুন' : 'Print Receipt'}
                              className="w-8 h-8 rounded-lg bg-emerald-50 dark:bg-emerald-950/40 hover:bg-emerald-100 dark:hover:bg-emerald-900/60 text-emerald-600 dark:text-[#00df89] flex items-center justify-center transition-colors cursor-pointer border border-emerald-500/20 shrink-0"
                            >
                              <Printer className="w-4 h-4" />
                            </button>
                            <div className="shrink-0">
                              <DropdownMenu>
                                <DropdownMenuTrigger className="w-8 h-8 rounded-lg bg-slate-100 dark:bg-zinc-800 hover:bg-slate-200 dark:hover:bg-zinc-700 text-slate-700 dark:text-zinc-300 flex items-center justify-center transition-colors cursor-pointer border border-slate-200/80 dark:border-zinc-700/80">
                                  <MoreVertical className="w-4 h-4" />
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="right" side={isLastRows ? 'top' : 'auto'} width="w-52">
                                  <DropdownMenuLabel>
                                    {order.invoice_number}
                                  </DropdownMenuLabel>
                                  <DropdownMenuSeparator />

                                  <DropdownMenuItem onClick={() => setSelectedOrder(order)}>
                                    <Eye className="w-4 h-4" />
                                    <span>{lang === 'bn' ? 'মেমো বিবরণ দেখুন' : 'View Full Details'}</span>
                                  </DropdownMenuItem>

                                  <DropdownMenuItem onClick={() => printSaleReceipt({ order, shop: mongoShop, lang })}>
                                    <Printer className="w-4 h-4" />
                                    <span>{lang === 'bn' ? 'রশিদ প্রিন্ট করুন' : 'Print Receipt'}</span>
                                  </DropdownMenuItem>

                                  {isDue && order.status !== 'returned' && (
                                    <DropdownMenuItem onClick={() => handleOpenCollectDue(order)} variant="success">
                                      <Coins className="w-4 h-4" />
                                      <span>{lang === 'bn' ? 'বকেয়া টাকা গ্রহণ' : 'Collect Due Payment'}</span>
                                    </DropdownMenuItem>
                                  )}

                                  <DropdownMenuItem onClick={() => handleOpenEdit(order)}>
                                    <Edit2 className="w-4 h-4" />
                                    <span>{lang === 'bn' ? 'ইনভয়েস এডিট করুন' : 'Edit Sale Invoice'}</span>
                                  </DropdownMenuItem>

                                  {order.status !== 'returned' && (
                                    <DropdownMenuItem onClick={() => handleOpenReturn(order)}>
                                      <Undo2 className="w-4 h-4 text-rose-500" />
                                      <span>{lang === 'bn' ? 'পণ্য ফেরত ও রিফান্ড' : 'Return & Refund'}</span>
                                    </DropdownMenuItem>
                                  )}

                                  <DropdownMenuSeparator />

                                  <DropdownMenuItem
                                    onClick={() => handleDeleteSale(order._id, order.invoice_number)}
                                    variant="danger"
                                  >
                                    <Trash2 className="w-4 h-4" />
                                    <span>{lang === 'bn' ? 'মুছে ফেলুন ও স্টক ফেরত দিন' : 'Delete & Restore Stock'}</span>
                                  </DropdownMenuItem>
                                </DropdownMenuContent>
                              </DropdownMenu>
                            </div>

                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Pagination Controls */}
            <Pagination
              currentPage={currentPage}
              totalItems={filteredOrders.length}
              pageSize={pageSize}
              pageSizeOptions={[10, 20, 50, 100]}
              onPageChange={setCurrentPage}
              onPageSizeChange={setPageSize}
            />
          </div>
        )}
      </Card>

      {/* ---------------------------------------------------- */}
      {/* TOP SELLING PRODUCTS PIE CHART WIDGET (BELOW TABLE)  */}
      {/* ---------------------------------------------------- */}
      <TopSellingPieChart salesOrders={salesOrders} isLoading={isLoading} />

      {/* ---------------------------------------------------- */}
      {/* EDIT SALE MODAL                                      */}
      {/* ---------------------------------------------------- */}
      {isEditModalOpen && editingSale && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs">
          <Card className="max-w-md w-full p-6 bg-white dark:bg-[#121215] border border-slate-200 dark:border-zinc-800 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-zinc-800 pb-3">
              <div>
                <h2 className="text-base font-bold text-slate-900 dark:text-white">
                  {lang === 'bn' ? `বিক্রয় এডিট: ${editForm.invoice_number}` : `Edit Sale: ${editForm.invoice_number}`}
                </h2>
                <p className="text-xs text-slate-400">
                  {lang === 'bn'
                    ? 'পেমেন্ট মাধ্যম, ডিসকাউন্ট ও নগদ টাকার হিসাব আপডেট করুন'
                    : 'Update payment method, discount, cash received or notes'}
                </p>
              </div>
              <button
                onClick={() => setIsEditModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-white p-1 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleUpdateSale} className="space-y-3.5 text-xs">
              {/* Payment Method */}
              <div>
                <label className="block font-semibold mb-1 text-slate-700 dark:text-zinc-300">
                  {lang === 'bn' ? 'পেমেন্ট মাধ্যম' : 'Payment Method'}
                </label>
                <Select
                  value={editForm.payment_method}
                  onValueChange={(val) => setEditForm({ ...editForm, payment_method: val })}
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

              {/* Discount Controls */}
              <div className="p-3 rounded-xl bg-slate-50 dark:bg-[#09090b] border border-slate-200 dark:border-zinc-800 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-slate-700 dark:text-zinc-300">
                    {lang === 'bn' ? 'ডিসকাউন্ট মোড' : 'Discount Option'}
                  </span>
                  <div className="flex bg-slate-200 dark:bg-zinc-800 p-0.5 rounded-lg text-[11px]">
                    <button
                      type="button"
                      onClick={() => setEditForm({ ...editForm, discount_type: 'flat' })}
                      className={`px-2 py-0.5 rounded-md font-medium transition-all ${
                        editForm.discount_type === 'flat'
                          ? 'bg-white dark:bg-zinc-900 text-slate-900 dark:text-white shadow-xs'
                          : 'text-slate-500'
                      }`}
                    >
                      Flat (৳)
                    </button>
                    <button
                      type="button"
                      onClick={() => setEditForm({ ...editForm, discount_type: 'percentage' })}
                      className={`px-2 py-0.5 rounded-md font-medium transition-all ${
                        editForm.discount_type === 'percentage'
                          ? 'bg-white dark:bg-zinc-900 text-slate-900 dark:text-white shadow-xs'
                          : 'text-slate-500'
                      }`}
                    >
                      Percent (%)
                    </button>
                  </div>
                </div>

                <input
                  type="number"
                  placeholder={editForm.discount_type === 'flat' ? 'Discount Amount (৳)' : 'Discount (%)'}
                  value={editForm.discount_value}
                  onChange={(e) => setEditForm({ ...editForm, discount_value: e.target.value })}
                  className="w-full px-3 py-1.5 rounded-lg bg-white dark:bg-[#121215] border border-slate-200 dark:border-zinc-800 text-xs outline-none focus:ring-1 focus:ring-[#00df89]"
                />
              </div>

              {/* Paid & Tendered Amount */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold mb-1 text-slate-700 dark:text-zinc-300">
                    {lang === 'bn' ? 'পরিশোধিত (৳)' : 'Paid Amount (৳)'}
                  </label>
                  <input
                    type="number"
                    value={editForm.paid_amount}
                    onChange={(e) => setEditForm({ ...editForm, paid_amount: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-[#09090b] border border-slate-200 dark:border-zinc-800 outline-none"
                  />
                </div>
                <div>
                  <label className="block font-semibold mb-1 text-slate-700 dark:text-zinc-300">
                    {lang === 'bn' ? 'নগদ গ্রহণ (৳)' : 'Cash Given (৳)'}
                  </label>
                  <input
                    type="number"
                    value={editForm.tendered_amount}
                    onChange={(e) => setEditForm({ ...editForm, tendered_amount: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-[#09090b] border border-slate-200 dark:border-zinc-800 outline-none"
                  />
                </div>
              </div>

              {/* Notes */}
              <div>
                <label className="block font-semibold mb-1 text-slate-700 dark:text-zinc-300">
                  {lang === 'bn' ? 'নোট / মন্তব্য' : 'Note / Remarks'}
                </label>
                <input
                  type="text"
                  placeholder="e.g. Discount given by manager"
                  value={editForm.note}
                  onChange={(e) => setEditForm({ ...editForm, note: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-[#09090b] border border-slate-200 dark:border-zinc-800 outline-none"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-slate-100 dark:border-zinc-800">
                <Button type="button" variant="outline" size="sm" onClick={() => setIsEditModalOpen(false)}>
                  {lang === 'bn' ? 'বাতিল' : 'Cancel'}
                </Button>
                <Button
                  type="submit"
                  disabled={isUpdating}
                  size="sm"
                  className="bg-[#00df89] hover:bg-[#00c97b] text-[#011812] font-semibold cursor-pointer"
                >
                  {isUpdating ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : lang === 'bn' ? 'সংরক্ষণ করুন' : 'Save Changes'}
                </Button>
              </div>
            </form>
          </Card>
        </div>
      )}

      {/* ---------------------------------------------------- */}
      {/* DETAILED RECEIPT MEMO MODAL                          */}
      {/* ---------------------------------------------------- */}
      {selectedOrder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs">
          <Card className="max-w-md w-full p-6 bg-white dark:bg-[#121215] border border-slate-200 dark:border-zinc-800 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-zinc-800 pb-3">
              <div>
                <h2 className="text-base font-bold text-slate-900 dark:text-white">Cash Memo / Receipt</h2>
                <p className="text-xs text-slate-400 font-mono">{selectedOrder.invoice_number || 'N/A'}</p>
              </div>
              <button
                onClick={() => setSelectedOrder(null)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-white p-1 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-4 rounded-xl bg-slate-50 dark:bg-[#09090b] border border-slate-200 dark:border-zinc-800 space-y-3 text-xs">
              <div className="text-center pb-2 border-b border-slate-200 dark:border-zinc-800">
                <h3 className="font-bold text-sm text-slate-900 dark:text-white">{mongoShop?.name || 'Shopo Store'}</h3>
                <p className="text-[11px] text-slate-400">{safeDate(selectedOrder.created_at || selectedOrder.date)}</p>
              </div>

              <div className="space-y-1 text-[11px]">
                <div className="flex justify-between">
                  <span className="text-slate-500">Customer:</span>
                  <span className="font-semibold text-slate-800 dark:text-zinc-200">
                    {selectedOrder.customer_id?.name || selectedOrder.customer_name || (lang === 'bn' ? 'খুচরা ক্রেতা' : 'Walk-in Customer')}
                  </span>
                </div>
                {selectedOrder.customer_id?.phone && (
                  <div className="flex justify-between">
                    <span className="text-slate-500">Phone:</span>
                    <span className="font-mono text-slate-700 dark:text-zinc-300">{selectedOrder.customer_id.phone}</span>
                  </div>
                )}
                <div className="flex justify-between">
                  <span className="text-slate-500">Payment Method:</span>
                  <span className="font-semibold uppercase">{selectedOrder.payment_method || 'Cash'}</span>
                </div>
              </div>

              {/* Items List with Product Thumbnails */}
              <div className="pt-2 border-t border-slate-200 dark:border-zinc-800 space-y-1.5">
                <div className="font-semibold text-slate-700 dark:text-zinc-300 text-[11px]">
                  {lang === 'bn' ? 'ক্রয়কৃত পণ্যের তালিকা:' : 'Purchased Items:'}
                </div>
                <div className="divide-y divide-slate-100 dark:divide-zinc-800/80 bg-slate-50 dark:bg-[#09090b] rounded-xl border border-slate-200/90 dark:border-zinc-800/80 p-2 space-y-1.5 max-h-48 overflow-y-auto custom-scrollbar">
                  {Array.isArray(selectedOrder.items) && selectedOrder.items.map((it, i) => {
                    const itemImg = it?.image_url || (typeof it?.product_id === 'object' && (it.product_id?.image_url || (Array.isArray(it.product_id?.images) && it.product_id.images[0])));
                    const rawName = it?.name || it?.product_name || 'Item';
                    let itVariantName = it?.variant_name || (typeof it?.variant === 'object' ? it?.variant?.name : it?.variant) || '';
                    let itBaseName = rawName;
                    if (!itVariantName && rawName.includes('(') && rawName.includes(')')) {
                      const match = rawName.match(/^(.*?)\s*\((.*?)\)$/);
                      if (match) {
                        itBaseName = match[1].trim();
                        itVariantName = match[2].trim();
                      }
                    } else if (itVariantName && itBaseName.includes(`(${itVariantName})`)) {
                      itBaseName = itBaseName.replace(`(${itVariantName})`, '').trim();
                    }
                    const itPrice = Number(it?.unit_price || it?.price || 0);
                    const itQty = Number(it?.quantity || it?.qty || 1);
                    const itSubtotal = Number(it?.subtotal !== undefined ? it.subtotal : (itPrice * itQty));
                    return (
                      <div key={i} className="pt-1.5 first:pt-0 flex items-center justify-between gap-2.5 text-[11px]">
                        <div className="flex items-center gap-2 min-w-0">
                          {itemImg ? (
                            <img
                              src={itemImg}
                              alt={rawName}
                              className="w-8 h-8 rounded-lg object-cover bg-slate-100 dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700 shrink-0"
                              onError={(e) => {
                                e.target.onerror = null;
                                e.target.style.display = 'none';
                              }}
                            />
                          ) : (
                            <div className="w-8 h-8 rounded-lg bg-slate-100 dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700 flex items-center justify-center text-slate-400 shrink-0">
                              <ShoppingBag className="w-3.5 h-3.5" />
                            </div>
                          )}
                          <div className="min-w-0">
                            <div className="flex items-center gap-1.5 flex-wrap">
                              <span className="font-semibold text-slate-900 dark:text-zinc-100 truncate">{itBaseName}</span>
                              {itVariantName && (
                                <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-emerald-500/10 text-emerald-700 dark:text-[#00df89] border border-emerald-500/20">
                                  🎨 {itVariantName}
                                </span>
                              )}
                            </div>
                            <div className="text-[10px] text-slate-400">
                              ৳{safeMoney(itPrice)} × {itQty}
                            </div>
                          </div>
                        </div>
                        <span className="font-bold text-slate-900 dark:text-white shrink-0">
                          ৳ {safeMoney(itSubtotal)}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Financial Calculations Breakdown */}
              <div className="pt-2 border-t border-slate-200 dark:border-zinc-800 space-y-1 text-xs">
                <div className="flex justify-between text-slate-500">
                  <span>Subtotal:</span>
                  <span>৳ {safeMoney(selectedOrder.subtotal !== undefined ? selectedOrder.subtotal : selectedOrder.total)}</span>
                </div>
                {Number(selectedOrder.discount || 0) > 0 && (
                  <div className="flex justify-between text-rose-500">
                    <span>
                      Discount {selectedOrder.discount_type === 'percentage' ? `(${selectedOrder.discount_value}%)` : '(Flat)'}:
                    </span>
                    <span className="font-bold">- ৳ {safeMoney(selectedOrder.discount)}</span>
                  </div>
                )}
                <div className="flex justify-between font-bold text-sm text-slate-900 dark:text-white pt-1 border-t border-slate-200 dark:border-zinc-800">
                  <span>Total Bill Amount:</span>
                  <span className="text-[#00a86b] dark:text-[#00df89]">৳ {safeMoney(selectedOrder.total)}</span>
                </div>

                <div className="flex justify-between text-slate-700 dark:text-zinc-300 pt-1">
                  <span>Amount Paid:</span>
                  <span className="font-semibold text-[#00a86b] dark:text-[#00df89]">
                    ৳ {safeMoney(selectedOrder.paid_amount !== undefined ? selectedOrder.paid_amount : selectedOrder.total)}
                  </span>
                </div>

                {/* Due Breakdown in Detailed Memo */}
                {(Number(selectedOrder.due_amount || 0) > 0 || Number(selectedOrder.customer_id?.total_due || 0) > 0) && (
                  <div className="pt-1.5 mt-1 border-t border-dashed border-slate-200 dark:border-zinc-700 space-y-0.5 text-[11px]">
                    {Number(selectedOrder.due_amount || 0) > 0 && (
                      <div className="flex justify-between text-amber-600 font-bold">
                        <span>{lang === 'bn' ? 'এই মেমোর বকেয়া:' : 'This Bill Due:'}</span>
                        <span>৳ {safeMoney(selectedOrder.due_amount)}</span>
                      </div>
                    )}
                    {Number(selectedOrder.customer_id?.total_due || 0) > 0 && (
                      <div className="flex justify-between text-slate-500 font-medium">
                        <span>{lang === 'bn' ? 'কাস্টমারের মোট বকেয়া:' : 'Customer Total Outstanding Due:'}</span>
                        <span className="text-amber-600 font-semibold">৳ {safeMoney(selectedOrder.customer_id.total_due)}</span>
                      </div>
                    )}
                  </div>
                )}

                {/* Tendered & Change Breakdown */}
                {selectedOrder.payment_method?.toLowerCase() === 'cash' && Number(selectedOrder.tendered_amount || 0) > 0 && Number(selectedOrder.due_amount || 0) === 0 && (
                  <>
                    <div className="flex justify-between text-slate-600 dark:text-zinc-400 pt-1">
                      <span>{lang === 'bn' ? 'কাস্টমার দিয়েছেন:' : 'Cash Given by Customer:'}</span>
                      <span className="font-semibold">৳ {safeMoney(selectedOrder.tendered_amount)}</span>
                    </div>
                    <div className="flex justify-between text-emerald-600 dark:text-[#00df89] font-bold">
                      <span>{lang === 'bn' ? 'ফেরত দেওয়া হয়েছে:' : 'Change Returned:'}</span>
                      <span>৳ {safeMoney(selectedOrder.change_amount)}</span>
                    </div>
                  </>
                )}
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-3 border-t border-slate-100 dark:border-zinc-800">
              <Button variant="outline" size="sm" onClick={() => setSelectedOrder(null)}>
                {lang === 'bn' ? 'বন্ধ করুন' : 'Close'}
              </Button>
              {Number(selectedOrder.due_amount || 0) > 0 && (
                <Button
                  size="sm"
                  onClick={() => {
                    const ord = selectedOrder;
                    setSelectedOrder(null);
                    handleOpenCollectDue(ord);
                  }}
                  className="bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold gap-1 cursor-pointer"
                >
                  <Coins className="w-3.5 h-3.5" /> {lang === 'bn' ? 'বকেয়া গ্রহণ করুন' : 'Collect Due'}
                </Button>
              )}
              <Button
                size="sm"
                onClick={() => printSaleReceipt({ order: selectedOrder, shop: mongoShop, lang })}
                className="bg-[#00df89] hover:bg-[#00c97b] text-[#011812] font-semibold gap-1 cursor-pointer"
              >
                <Printer className="w-3.5 h-3.5" /> {lang === 'bn' ? 'প্রিন্ট রশিদ' : 'Print Receipt'}
              </Button>
            </div>
          </Card>
        </div>
      )}

      {/* ---------------------------------------------------- */}
      {/* COLLECT DUE PAYMENT MODAL                            */}
      {/* ---------------------------------------------------- */}
      {isCollectModalOpen && collectingOrder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs">
          <Card className="max-w-md w-full p-6 bg-white dark:bg-[#121215] border border-slate-200 dark:border-zinc-800 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-zinc-800 pb-3">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-amber-500/15 flex items-center justify-center text-amber-500">
                  <Coins className="w-4 h-4" />
                </div>
                <div>
                  <h2 className="text-base font-bold text-slate-900 dark:text-white">
                    {lang === 'bn' ? 'বকেয়া টাকা গ্রহণ করুন' : 'Collect Due Payment'}
                  </h2>
                  <p className="text-xs text-slate-400 font-mono">{collectingOrder.invoice_number}</p>
                </div>
              </div>
              <button
                onClick={() => {
                  setIsCollectModalOpen(false);
                  setCollectingOrder(null);
                }}
                className="text-slate-400 p-1 cursor-pointer hover:text-slate-700 dark:hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Customer & Bill Overview Box */}
            <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-[#09090b] border border-slate-200 dark:border-zinc-800 space-y-2 text-xs">
              <div className="flex justify-between items-center text-slate-700 dark:text-zinc-300 font-medium">
                <span>{lang === 'bn' ? 'কাস্টমার:' : 'Customer:'}</span>
                <span className="font-bold text-slate-900 dark:text-white">
                  {collectingOrder.customer_id?.name || (lang === 'bn' ? 'সাধারণ কাস্টমার' : 'Walk-in Customer')}
                </span>
              </div>
              {collectingOrder.customer_id?.phone && (
                <div className="flex justify-between items-center text-slate-500">
                  <span>{lang === 'bn' ? 'মোবাইল নম্বর:' : 'Phone:'}</span>
                  <span className="font-mono">{collectingOrder.customer_id.phone}</span>
                </div>
              )}
              <div className="grid grid-cols-3 gap-2 pt-2 border-t border-slate-200 dark:border-zinc-800 text-center">
                <div className="p-2 rounded-lg bg-white dark:bg-zinc-900 border border-slate-100 dark:border-zinc-800">
                  <div className="text-[10px] text-slate-400">{lang === 'bn' ? 'মোট বিল' : 'Total Bill'}</div>
                  <div className="font-bold text-slate-900 dark:text-white">৳ {safeMoney(collectingOrder.total)}</div>
                </div>
                <div className="p-2 rounded-lg bg-white dark:bg-zinc-900 border border-slate-100 dark:border-zinc-800">
                  <div className="text-[10px] text-slate-400">{lang === 'bn' ? 'পরিশোধিত' : 'Paid so far'}</div>
                  <div className="font-bold text-emerald-600">৳ {safeMoney(collectingOrder.paid_amount)}</div>
                </div>
                <div className="p-2 rounded-lg bg-amber-500/10 border border-amber-500/30">
                  <div className="text-[10px] text-amber-600 font-semibold">{lang === 'bn' ? 'বকেয়া' : 'Bill Due'}</div>
                  <div className="font-bold text-amber-600">৳ {safeMoney(collectingOrder.due_amount)}</div>
                </div>
              </div>
            </div>

            <form onSubmit={handleSubmitCollectDue} className="space-y-3.5 text-xs">
              {/* Payment Amount Input & Quick Chips */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label className="font-semibold text-slate-700 dark:text-zinc-300">
                    {lang === 'bn' ? 'জমার পরিমাণ (৳)' : 'Payment Amount to Collect (৳)'}
                  </label>
                  <div className="flex items-center gap-1.5 text-[10px]">
                    <button
                      type="button"
                      onClick={() => setCollectForm({ ...collectForm, amount: String(collectingOrder.due_amount) })}
                      className="px-2 py-0.5 rounded-md font-bold bg-amber-500/15 text-amber-600 border border-amber-500/30 hover:bg-amber-500/25 transition-colors cursor-pointer whitespace-nowrap"
                    >
                      {lang === 'bn' ? `সম্পূর্ণ বাকি (৳${collectingOrder.due_amount})` : `Full Due (৳${collectingOrder.due_amount})`}
                    </button>
                    <button
                      type="button"
                      onClick={() => setCollectForm({ ...collectForm, amount: String(Math.round(collectingOrder.due_amount / 2)) })}
                      className="px-2 py-0.5 rounded-md font-semibold bg-slate-100 dark:bg-zinc-800 text-slate-700 dark:text-zinc-300 hover:bg-slate-200 transition-colors cursor-pointer whitespace-nowrap"
                    >
                      50% (৳{Math.round(collectingOrder.due_amount / 2)})
                    </button>
                  </div>
                </div>

                <input
                  type="number"
                  required
                  min="1"
                  max={collectingOrder.due_amount}
                  placeholder={`e.g. ${collectingOrder.due_amount}`}
                  value={collectForm.amount}
                  onChange={(e) => setCollectForm({ ...collectForm, amount: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl bg-white dark:bg-[#09090b] border border-amber-500/40 text-sm font-bold text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-amber-500"
                />
              </div>

              {/* Payment Method Selector */}
              <div>
                <label className="block font-semibold mb-1 text-slate-700 dark:text-zinc-300">
                  {lang === 'bn' ? 'পেমেন্ট মাধ্যম' : 'Payment Method'}
                </label>
                <Select
                  value={collectForm.payment_method}
                  onValueChange={(val) => setCollectForm({ ...collectForm, payment_method: val })}
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
                  placeholder={lang === 'bn' ? 'যেমন: কাউন্টারে নগদ পরিশোধ' : 'e.g. Paid in cash at counter'}
                  value={collectForm.note}
                  onChange={(e) => setCollectForm({ ...collectForm, note: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-[#09090b] border border-slate-200 dark:border-zinc-800 outline-none"
                />
              </div>

              {/* Real-Time Balance Preview */}
              {parseFloat(collectForm.amount) > 0 && (
                <div className="p-2.5 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-between text-xs font-semibold text-amber-700 dark:text-amber-400">
                  <span>{lang === 'bn' ? 'বকেয়া অবশিষ্ট থাকবে:' : 'Remaining Bill Due after Payment:'}</span>
                  <span className="font-mono text-sm font-bold">
                    ৳ {Math.max(0, collectingOrder.due_amount - (parseFloat(collectForm.amount) || 0)).toLocaleString()}
                  </span>
                </div>
              )}

              <div className="flex justify-end gap-2 pt-2 border-t border-slate-100 dark:border-zinc-800">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setIsCollectModalOpen(false);
                    setCollectingOrder(null);
                  }}
                >
                  {lang === 'bn' ? 'বাতিল' : 'Cancel'}
                </Button>
                <Button
                  type="submit"
                  disabled={isCollectingDue}
                  size="sm"
                  className="bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold gap-1.5 shadow-sm cursor-pointer"
                >
                  {isCollectingDue ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <CheckCircle2 className="w-3.5 h-3.5" />}
                  <span>{lang === 'bn' ? 'টাকা গ্রহণ নিশ্চিত করুন' : 'Confirm Payment'}</span>
                </Button>
              </div>
            </form>
          </Card>
        </div>
      )}

      {/* ---------------------------------------------------- */}
      {/* MONEY RECEIPT / DUE PAYMENT VOUCHER MODAL             */}
      {/* ---------------------------------------------------- */}
      {collectedVoucher && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs">
          <Card className="max-w-md w-full p-6 bg-white dark:bg-[#121215] border border-slate-200 dark:border-zinc-800 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-zinc-800 pb-3">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-emerald-500/15 flex items-center justify-center text-[#00a86b] dark:text-[#00df89]">
                  <CheckCircle2 className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-base font-bold text-slate-900 dark:text-white">
                    {lang === 'bn' ? 'বকেয়া জমার রশিদ' : 'Money Receipt'}
                  </h2>
                  <p className="text-xs text-slate-400 font-mono">Ref: {collectedVoucher.invoice_number}</p>
                </div>
              </div>
              <button onClick={() => setCollectedVoucher(null)} className="text-slate-400 p-1 cursor-pointer">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-4 rounded-xl bg-slate-50 dark:bg-[#09090b] border border-slate-200 dark:border-zinc-800 space-y-3 text-xs">
              <div className="text-center pb-2 border-b border-slate-200 dark:border-zinc-800">
                <h3 className="font-bold text-sm text-slate-900 dark:text-white">{mongoShop?.name || 'Shopo Store'}</h3>
                <p className="text-[11px] text-slate-400">{collectedVoucher.date}</p>
                <Badge className="bg-emerald-500/15 text-emerald-700 dark:text-[#00df89] border-emerald-500/30 text-[10px] font-bold mt-1">
                  {lang === 'bn' ? 'টাকা জমা সম্পন্ন' : 'Payment Received'}
                </Badge>
              </div>

              <div className="space-y-1.5 text-xs">
                <div className="flex justify-between">
                  <span className="text-slate-500">{lang === 'bn' ? 'প্রদানকারী:' : 'Received From:'}</span>
                  <span className="font-semibold text-slate-900 dark:text-white">{collectedVoucher.customer_name}</span>
                </div>
                {collectedVoucher.customer_phone && (
                  <div className="flex justify-between">
                    <span className="text-slate-500">{lang === 'bn' ? 'মোবাইল নম্বর:' : 'Phone:'}</span>
                    <span className="font-mono text-slate-700 dark:text-zinc-300">{collectedVoucher.customer_phone}</span>
                  </div>
                )}
                <div className="flex justify-between">
                  <span className="text-slate-500">{lang === 'bn' ? 'পেমেন্ট মাধ্যম:' : 'Payment Method:'}</span>
                  <span className="font-semibold uppercase">{collectedVoucher.payment_method}</span>
                </div>
                {collectedVoucher.note && (
                  <div className="flex justify-between">
                    <span className="text-slate-500">{lang === 'bn' ? 'মন্তব্য:' : 'Remarks:'}</span>
                    <span className="text-slate-700 dark:text-zinc-300">{collectedVoucher.note}</span>
                  </div>
                )}

                <div className="pt-2 border-t border-slate-200 dark:border-zinc-800 space-y-1 text-xs">
                  <div className="flex justify-between items-center text-sm font-bold text-slate-900 dark:text-white pt-1">
                    <span>{lang === 'bn' ? 'গৃহীত টাকা:' : 'Amount Received:'}</span>
                    <span className="text-[#00a86b] dark:text-[#00df89] text-base">
                      ৳ {safeMoney(collectedVoucher.collected_amount)}
                    </span>
                  </div>

                  <div className="flex justify-between text-slate-600 dark:text-zinc-400 pt-1">
                    <span>{lang === 'bn' ? 'বকেয়া অবশিষ্ট:' : 'Remaining Bill Due:'}</span>
                    <span className={`font-semibold ${Number(collectedVoucher.remaining_sale_due || 0) > 0 ? 'text-amber-600 font-bold' : 'text-emerald-600'}`}>
                      ৳ {safeMoney(collectedVoucher.remaining_sale_due)}
                    </span>
                  </div>

                  {Number(collectedVoucher.customer_total_due || 0) > 0 && (
                    <div className="flex justify-between text-slate-500 text-[11px]">
                      <span>{lang === 'bn' ? 'কাস্টমারের মোট বকেয়া:' : 'Customer Total Due:'}</span>
                      <span className="font-semibold text-amber-600">৳ {safeMoney(collectedVoucher.customer_total_due)}</span>
                    </div>
                  )}
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-3 border-t border-slate-100 dark:border-zinc-800">
              <Button variant="outline" size="sm" onClick={() => setCollectedVoucher(null)}>
                {lang === 'bn' ? 'বন্ধ করুন' : 'Close'}
              </Button>
              <Button
                size="sm"
                onClick={() => printDueReceipt({ voucher: collectedVoucher, shop: mongoShop, lang })}
                className="bg-[#00df89] hover:bg-[#00c97b] text-[#011812] font-semibold gap-1 cursor-pointer"
              >
                <Printer className="w-3.5 h-3.5" /> {lang === 'bn' ? 'রশিদ প্রিন্ট করুন' : 'Print Money Receipt'}
              </Button>
            </div>
          </Card>
        </div>
      )}

      {/* ---------------------------------------------------- */}
      {/* RETURN & REFUND PRODUCT MODAL                         */}
      {/* ---------------------------------------------------- */}
      {isReturnModalOpen && returningOrder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs">
          <Card className="max-w-xl w-full p-6 bg-white dark:bg-[#121215] border border-slate-200 dark:border-zinc-800 space-y-4 shadow-2xl max-h-[90vh] overflow-y-auto custom-scrollbar">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-zinc-800 pb-3">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-rose-500/15 flex items-center justify-center text-rose-500 shrink-0">
                  <Undo2 className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                    <span>{lang === 'bn' ? 'পণ্য ফেরত ও রিফান্ড' : 'Return & Refund Sale'}</span>
                    <Badge variant="outline" className="text-[10px] font-mono border-rose-500/30 text-rose-500">
                      {returningOrder.invoice_number}
                    </Badge>
                  </h2>
                  <p className="text-xs text-slate-400">
                    {returningOrder.customer_id?.name || (lang === 'bn' ? 'খুচরা ক্রেতা' : 'Walk-in Customer')}
                    {returningOrder.customer_id?.phone ? ` • ${returningOrder.customer_id.phone}` : ''}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsReturnModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-white p-1 rounded-lg cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmitReturn} className="space-y-4 text-xs">
              {/* Items Return Table */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-slate-700 dark:text-zinc-300">
                    {lang === 'bn' ? 'ফেরত দেওয়ার পণ্য ও পরিমাণ নির্বাচন করুন:' : 'Select Items & Quantities to Return:'}
                  </span>
                  <span className="text-[11px] text-slate-400">
                    {lang === 'bn' ? 'স্টক স্বয়ংক্রিয়ভাবে ইনভেন্টরিতে জমা হবে' : 'Stock will be auto-restored to inventory'}
                  </span>
                </div>

                <div className="rounded-xl border border-slate-200 dark:border-zinc-800 divide-y divide-slate-100 dark:divide-zinc-800/80 bg-slate-50 dark:bg-[#09090b] overflow-hidden">
                  {returningOrder.items?.map((it, idx) => {
                    const prodId = getItemDocId(it.product_id);
                    const varId = getItemDocId(it.variant_id);
                    const key = `${prodId}_${varId || 'none'}`;
                    const currentQty = returnQuantities[key] || 0;

                    let alreadyReturned = 0;
                    if (Array.isArray(returningOrder.return_history)) {
                      returningOrder.return_history.forEach((rev) => {
                        (rev.items || []).forEach((rit) => {
                          const rProdId = getItemDocId(rit.product_id);
                          const rVarId = getItemDocId(rit.variant_id);
                          if (rProdId === prodId && (rVarId || 'none') === (varId || 'none')) {
                            alreadyReturned += rit.quantity || 0;
                          }
                        });
                      });
                    }
                    const maxReturnable = Math.max(0, it.quantity - alreadyReturned);

                    return (
                      <div key={idx} className="p-3 flex items-center justify-between gap-3">
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <span className="font-bold text-slate-900 dark:text-zinc-100 text-xs truncate">{it.name}</span>
                            {it.variant_name && (
                              <span className="px-1.5 py-0.2 rounded text-[10px] font-bold bg-emerald-500/10 text-emerald-700 dark:text-[#00df89] border border-emerald-500/20">
                                {it.variant_name}
                              </span>
                            )}
                          </div>
                          <div className="text-[11px] text-slate-400 mt-0.5 flex items-center gap-2">
                            <span>Unit: ৳{safeMoney(it.unit_price)}</span>
                            <span>•</span>
                            <span>Sold: {it.quantity}</span>
                            {alreadyReturned > 0 && (
                              <span className="text-amber-500 font-medium">(Prev. Returned: {alreadyReturned})</span>
                            )}
                          </div>
                        </div>

                        {/* Quantity Stepper */}
                        <div className="flex items-center gap-2 shrink-0">
                          <button
                            type="button"
                            disabled={currentQty <= 0}
                            onClick={() => setReturnQuantities((prev) => ({ ...prev, [key]: Math.max(0, currentQty - 1) }))}
                            className="w-7 h-7 rounded-lg bg-white dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700 flex items-center justify-center text-slate-700 dark:text-zinc-200 hover:bg-slate-100 disabled:opacity-30 cursor-pointer disabled:cursor-not-allowed"
                          >
                            <Minus className="w-3.5 h-3.5" />
                          </button>
                          <input
                            type="number"
                            min="0"
                            max={maxReturnable}
                            value={currentQty}
                            onChange={(e) => {
                              const val = Math.min(maxReturnable, Math.max(0, parseInt(e.target.value) || 0));
                              setReturnQuantities((prev) => ({ ...prev, [key]: val }));
                            }}
                            className="w-12 h-7 text-center font-bold font-mono rounded-lg bg-white dark:bg-[#121215] border border-slate-200 dark:border-zinc-700 text-slate-900 dark:text-white text-xs outline-none"
                          />
                          <button
                            type="button"
                            disabled={currentQty >= maxReturnable}
                            onClick={() => setReturnQuantities((prev) => ({ ...prev, [key]: Math.min(maxReturnable, currentQty + 1) }))}
                            className="w-7 h-7 rounded-lg bg-white dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700 flex items-center justify-center text-slate-700 dark:text-zinc-200 hover:bg-slate-100 disabled:opacity-30 cursor-pointer disabled:cursor-not-allowed"
                          >
                            <Plus className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Live Return Impact Summary Box */}
              <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-[#09090b] border border-slate-200 dark:border-zinc-800 space-y-2">
                <div className="font-semibold text-slate-700 dark:text-zinc-300 pb-1 border-b border-slate-200/80 dark:border-zinc-800 flex items-center justify-between">
                  <span>{lang === 'bn' ? 'রিফান্ড ও হিসাবের প্রভাব' : 'Return & Refund Breakdown'}</span>
                  <Badge variant="outline" className="text-[10px] font-medium">
                    {returnSummary.itemsCount} {lang === 'bn' ? 'টি পণ্য ফেরত' : 'items returning'}
                  </Badge>
                </div>

                <div className="space-y-1 text-xs">
                  <div className="flex justify-between text-slate-500">
                    <span>{lang === 'bn' ? 'মোট পণ্যের মূল্য:' : 'Gross Items Subtotal:'}</span>
                    <span>৳ {safeMoney(returnSummary.totalReturnGross)}</span>
                  </div>

                  {returningOrder.discount > 0 && (
                    <div className="flex justify-between text-rose-500">
                      <span>{lang === 'bn' ? 'ডিসকাউন্ট সমন্বয়:' : 'Discount Adjustment:'}</span>
                      <span>- ৳ {safeMoney(returnSummary.totalReturnGross - returnSummary.netRefund)}</span>
                    </div>
                  )}

                  <div className="flex justify-between font-bold text-sm text-slate-900 dark:text-white pt-1 border-t border-slate-200 dark:border-zinc-800">
                    <span>{lang === 'bn' ? 'মোট রিফান্ড পরিমাণ:' : 'Net Refund Amount:'}</span>
                    <span className="text-rose-600 dark:text-rose-400">৳ {safeMoney(returnSummary.netRefund)}</span>
                  </div>

                  {/* Settlement split */}
                  <div className="pt-1 text-[11px] space-y-0.5 border-t border-dashed border-slate-200 dark:border-zinc-800">
                    {returnSummary.dueReduction > 0 && (
                      <div className="flex justify-between text-amber-600 font-medium">
                        <span>{lang === 'bn' ? 'বকেয়া থেকে কর্তন:' : 'Due Deducted / Cancelled:'}</span>
                        <span>- ৳ {safeMoney(returnSummary.dueReduction)}</span>
                      </div>
                    )}
                    {returnSummary.cashRefund > 0 && (
                      <div className="flex justify-between text-slate-700 dark:text-zinc-300 font-semibold">
                        <span>{lang === 'bn' ? 'ক্যাশ/পেমেন্ট ফেরত:' : 'Cash / Payment Refund to Customer:'}</span>
                        <span>৳ {safeMoney(returnSummary.cashRefund)}</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Loyalty Points Clawback Warning */}
                {returnSummary.pointsToDeduct > 0 && (
                  <div className="mt-2 p-2.5 rounded-lg bg-amber-500/10 border border-amber-500/20 text-amber-600 dark:text-amber-400 text-xs flex items-center gap-2">
                    <Coins className="w-4 h-4 shrink-0" />
                    <span>
                      {lang === 'bn'
                        ? `কাস্টমারের অর্জিত পয়েন্ট থেকে ${returnSummary.pointsToDeduct} পয়েন্ট কর্তন হবে।`
                        : `Customer loyalty balance will be reduced by ${returnSummary.pointsToDeduct} earned pts.`}
                    </span>
                  </div>
                )}
              </div>

              {/* Reason / Note input */}
              <div>
                <label className="block font-semibold mb-1 text-slate-700 dark:text-zinc-300">
                  {lang === 'bn' ? 'ফেরতের কারণ (ঐচ্ছিক)' : 'Reason for Return (Optional)'}
                </label>
                <input
                  type="text"
                  placeholder={lang === 'bn' ? 'যেমন: নষ্ট পণ্য, সাইজ সমস্যা, ইত্যাদি' : 'e.g. Defective product, customer changed mind'}
                  value={returnReason}
                  onChange={(e) => setReturnReason(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-[#09090b] border border-slate-200 dark:border-zinc-800 text-slate-900 dark:text-white outline-none focus:border-rose-500 text-xs"
                />
              </div>

              {/* Action Buttons */}
              <div className="flex justify-end gap-2 pt-2 border-t border-slate-100 dark:border-zinc-800">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setIsReturnModalOpen(false)}
                  className="cursor-pointer"
                >
                  {lang === 'bn' ? 'বাতিল' : 'Cancel'}
                </Button>
                <Button
                  type="submit"
                  disabled={isSubmittingReturn || returnSummary.itemsCount <= 0}
                  size="sm"
                  className="bg-rose-600 hover:bg-rose-700 text-white font-semibold gap-1.5 cursor-pointer disabled:opacity-50"
                >
                  {isSubmittingReturn ? (
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <>
                      <Undo2 className="w-3.5 h-3.5" />
                      <span>{lang === 'bn' ? 'ফেরত নিশ্চিত করুন' : 'Confirm Return & Refund'}</span>
                    </>
                  )}
                </Button>
              </div>
            </form>
          </Card>
        </div>
      )}

      {/* ---------------------------------------------------- */}
      {/* CONFIRM DELETE MODAL                                 */}
      {/* ---------------------------------------------------- */}
      <ConfirmDialog
        isOpen={confirmDeleteDialog.isOpen}
        isLoading={isDeleting}
        title={lang === 'bn' ? `ইনভয়েস '${confirmDeleteDialog.invoiceNumber}' মুছে ফেলতে চান?` : `Delete invoice '${confirmDeleteDialog.invoiceNumber}'?`}
        description={lang === 'bn' ? 'এই বিক্রিটি মুছে ফেলা হবে, সংশ্লিষ্ট পণ্যগুলোর স্টক পুনরায় ইনভেন্টরিতে ফেরত আসবে এবং অর্জিত রিওয়ার্ড পয়েন্ট কাস্টমার থেকে কর্তন করা হবে।' : 'This sale will be permanently deleted: inventory stock will be restored and any reward points earned from this sale will be deducted from the customer.'}
        confirmText={lang === 'bn' ? 'হ্যাঁ, মুছে ফেলুন' : 'Yes, Delete'}
        cancelText={lang === 'bn' ? 'বাতিল' : 'Cancel'}
        onConfirm={handleConfirmDeleteSale}
        onCancel={() => setConfirmDeleteDialog({ isOpen: false, saleId: null, invoiceNumber: '' })}
      />

    </div>
  );
}
