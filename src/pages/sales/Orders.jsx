/**
 * @file Orders.jsx
 * @description Comprehensive Sales Management page with full View, Edit & Delete capabilities, Live DB sync, Discount & Cash Change tracking.
 */
import { useState, useMemo, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useLanguage } from '@/context/LanguageContext';
import { useAuth } from '@/context/AuthContext';
import api from '@/services/api';
import toast from 'react-hot-toast';
import { printSaleReceipt, printDueReceipt } from '@/utils/invoicePrinter';
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
import ConfirmDialog from '@/components/common/ConfirmDialog';
import {
  ShoppingCart, DollarSign, Plus, Search, Filter, Calendar,
  FileText, Printer, CheckCircle2, Clock, X, Loader2, Tag,
  Coins, Percent, Edit2, Trash2, AlertTriangle, Sparkles, Eye, ShoppingBag
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
      const res = await api.sales.list();
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

  const filteredOrders = useMemo(() => {
    return salesOrders.filter((order) => {
      const q = searchQuery.toLowerCase().trim();
      const inv = order.invoice_number ? order.invoice_number.toLowerCase() : '';
      const cust = order.customer_id?.name ? order.customer_id.name.toLowerCase() : 'walk-in customer';
      const matchesSearch = !q || inv.includes(q) || cust.includes(q);

      const matchesStatus =
        statusFilter === 'all' ||
        (statusFilter === 'paid' && (order.payment_status === 'paid' || (order.due_amount || 0) === 0)) ||
        (statusFilter === 'due' && (order.due_amount || 0) > 0);

      return matchesSearch && matchesStatus;
    });
  }, [salesOrders, searchQuery, statusFilter]);

  const totalRevenue = salesOrders.reduce((acc, o) => acc + (o.total || 0), 0);
  const totalDue = salesOrders.reduce((acc, o) => acc + (o.due_amount || 0), 0);

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
      
      // Open Money Receipt Voucher Modal
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

  // Confirm Delete Dialog State
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
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white tracking-tight flex items-center gap-2.5">
            <ShoppingCart className="w-6 h-6 text-[#00df89]" />
            <span>{lang === 'bn' ? 'বিক্রয় ও ইনভয়েস হিস্ট্রি' : 'Sales History & Invoices'}</span>
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-zinc-400 font-normal mt-0.5">
            {lang === 'bn'
              ? 'সকল ক্যাশ মেমো, ডিসকাউন্ট, ক্যাশ হিসাব এবং এডিট ও ডিলিট অপশন'
              : 'Track live sales, edit transaction details, restore stock on delete, and print cash memos.'}
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            onClick={() => navigate('/sales/new')}
            className="bg-[#00df89] hover:bg-[#00c97b] text-[#011812] font-semibold text-xs sm:text-sm h-10 px-4 gap-2 shadow-xs cursor-pointer"
          >
            <Plus className="w-4 h-4 stroke-[2.5]" />
            <span>{lang === 'bn' ? 'নতুন বিক্রি তৈরি করুন' : 'New Sale / POS'}</span>
          </Button>
        </div>
      </div>

      {/* ---------------------------------------------------- */}
      {/* KPI STAT CARDS                                       */}
      {/* ---------------------------------------------------- */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="p-4 sm:p-5 border-slate-200/90 dark:border-zinc-800/80 dark:bg-[#121215]">
          <span className="text-xs sm:text-sm font-medium text-slate-500 dark:text-zinc-400">Total Sales Recorded</span>
          <div className="text-2xl sm:text-3xl font-bold text-slate-900 dark:text-white mt-2">
            {isLoading ? <Skeleton className="h-8 w-20 my-0.5" /> : salesOrders.length}
          </div>
          <div className="text-xs text-slate-500 mt-1">Invoices issued</div>
        </Card>

        <Card className="p-4 sm:p-5 border-slate-200/90 dark:border-zinc-800/80 dark:bg-[#121215]">
          <span className="text-xs sm:text-sm font-medium text-slate-500 dark:text-zinc-400">Total Revenue Collected</span>
          <div className="text-2xl sm:text-3xl font-bold text-[#00a86b] dark:text-[#00df89] mt-2">
            {isLoading ? <Skeleton className="h-8 w-28 my-0.5" /> : `৳ ${totalRevenue.toLocaleString()}`}
          </div>
          <div className="text-xs text-[#00a86b] dark:text-[#00df89] mt-1">Gross sales</div>
        </Card>

        <Card className="p-4 sm:p-5 border-slate-200/90 dark:border-zinc-800/80 dark:bg-[#121215]">
          <span className="text-xs sm:text-sm font-medium text-slate-500 dark:text-zinc-400">Total Customer Due</span>
          <div className="text-2xl sm:text-3xl font-bold text-amber-500 mt-2">
            {isLoading ? <Skeleton className="h-8 w-24 my-0.5" /> : `৳ ${totalDue.toLocaleString()}`}
          </div>
          <div className="text-xs text-amber-500 mt-1">Pending payments</div>
        </Card>

        <Card className="p-4 sm:p-5 border-slate-200/90 dark:border-zinc-800/80 dark:bg-[#121215]">
          <span className="text-xs sm:text-sm font-medium text-slate-500 dark:text-zinc-400">Average Order Size</span>
          <div className="text-2xl sm:text-3xl font-bold text-slate-900 dark:text-white mt-2">
            {isLoading ? <Skeleton className="h-8 w-24 my-0.5" /> : `৳ ${salesOrders.length > 0 ? Math.round(totalRevenue / salesOrders.length).toLocaleString() : 0}`}
          </div>
          <div className="text-xs text-slate-500 mt-1">Per invoice</div>
        </Card>
      </div>

      {/* ---------------------------------------------------- */}
      {/* FILTER & SEARCH                                      */}
      {/* ---------------------------------------------------- */}
      <Card className="p-4 border-slate-200/90 dark:border-zinc-800/80 dark:bg-[#121215]">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="w-full sm:w-80 relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder={lang === 'bn' ? 'ইনভয়েস বা কাস্টমার খুঁজুন...' : 'Search by invoice # or customer...'}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-2 rounded-xl bg-slate-50 dark:bg-[#09090b] border border-slate-200 dark:border-zinc-800 text-xs text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-[#00df89]"
            />
          </div>

          <div className="flex items-center gap-2">
            {['all', 'paid', 'due'].map((st) => (
              <button
                key={st}
                onClick={() => setStatusFilter(st)}
                className={`px-3 py-1.5 rounded-xl text-xs font-semibold uppercase transition-all cursor-pointer ${
                  statusFilter === st
                    ? 'bg-slate-900 text-white dark:bg-zinc-800'
                    : 'bg-slate-100 dark:bg-zinc-900 text-slate-600 dark:text-zinc-400'
                }`}
              >
                {st}
              </button>
            ))}
          </div>
        </div>
      </Card>

      {/* ---------------------------------------------------- */}
      {/* SALES ORDERS TABLE                                   */}
      {/* ---------------------------------------------------- */}
      <Card className="p-0 border-slate-200/90 dark:border-zinc-800/80 dark:bg-[#121215] overflow-hidden">
        {isLoading ? (
          <div className="p-5 space-y-3">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <Skeleton key={i} className="h-12 w-full" />
            ))}
          </div>
        ) : filteredOrders.length === 0 ? (
          <div className="p-12 text-center space-y-3">
            <ShoppingCart className="w-10 h-10 text-slate-300 dark:text-zinc-600 mx-auto" />
            <h3 className="text-sm font-semibold text-slate-800 dark:text-zinc-200">No Sales Orders Found</h3>
            <p className="text-xs text-slate-500 dark:text-zinc-400">Generate your first cash memo or sale transaction.</p>
            <Button size="sm" onClick={() => navigate('/sales/new')} className="bg-[#00df89] hover:bg-[#00c97b] text-[#011812] text-xs font-semibold">
              <Plus className="w-3.5 h-3.5 mr-1" /> New Sale
            </Button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left">
              <thead className="bg-slate-50 dark:bg-zinc-900/60 text-slate-500 border-b border-slate-200 dark:border-zinc-800">
                <tr>
                  <th className="p-3.5 whitespace-nowrap">Invoice #</th>
                  <th className="p-3.5 whitespace-nowrap">Customer</th>
                  <th className="p-3.5 whitespace-nowrap">Items</th>
                  <th className="p-3.5 whitespace-nowrap">Discount</th>
                  <th className="p-3.5 whitespace-nowrap">Date & Time</th>
                  <th className="p-3.5 whitespace-nowrap">Payment / Due Status</th>
                  <th className="p-3.5 whitespace-nowrap">Net Total (৳)</th>
                  <th className="p-3.5 text-right whitespace-nowrap">{lang === 'bn' ? 'অ্যাকশন' : 'Actions'}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-zinc-800/80">
                {filteredOrders.map((order) => {
                  const isDue = (order.due_amount || 0) > 0;
                  return (
                    <tr key={order._id} className="hover:bg-slate-50 dark:hover:bg-zinc-900/40 transition-colors">
                      <td className="p-3.5 font-semibold text-slate-900 dark:text-white flex items-center gap-2 whitespace-nowrap">
                        <FileText className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                        <span>{order.invoice_number}</span>
                      </td>
                      <td className="p-3.5 text-slate-800 dark:text-zinc-200 font-medium">
                        <div className="whitespace-nowrap">{order.customer_id?.name || 'Walk-in Customer'}</div>
                        {order.customer_id?.phone && (
                          <div className="text-[10px] text-slate-400 font-mono">{order.customer_id.phone}</div>
                        )}
                      </td>
                      <td className="p-3.5 text-slate-600 dark:text-zinc-300">
                        {order.items?.map(it => `${it.name} (${it.quantity})`).join(', ') || '1 item'}
                      </td>
                      <td className="p-3.5 text-rose-500 font-medium whitespace-nowrap">
                        {Number(order.discount || 0) > 0 ? (
                          <span>- ৳ {safeMoney(order.discount)} {order.discount_type === 'percentage' ? `(${order.discount_value}%)` : ''}</span>
                        ) : (
                          <span className="text-slate-400">None</span>
                        )}
                      </td>
                      <td className="p-3.5 text-slate-500 whitespace-nowrap">
                        {safeDate(order.created_at || order.date)}
                      </td>
                      <td className="p-3.5 whitespace-nowrap">
                        <div className="flex flex-col items-start gap-1">
                          <Badge
                            variant={order.payment_method?.toLowerCase() === 'due' ? 'warning' : 'secondary'}
                            className={`text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 whitespace-nowrap ${
                              order.payment_method?.toLowerCase() === 'due'
                                ? '!bg-amber-500/15 !text-amber-500 dark:!text-amber-400 !border-amber-500/30'
                                : '!bg-slate-100 !text-slate-700 dark:!bg-zinc-800 dark:!text-zinc-300 !border-slate-200 dark:!border-zinc-700'
                            }`}
                          >
                            {order.payment_method || 'Cash'}
                          </Badge>
                          {isDue ? (
                            <Badge
                              variant="warning"
                              className="!bg-amber-500/15 !text-amber-500 dark:!text-amber-400 !border-amber-500/30 text-[10px] font-bold px-2 py-0.5 whitespace-nowrap"
                            >
                              Due: ৳{safeMoney(order.due_amount)}
                            </Badge>
                          ) : (
                            <Badge
                              variant="default"
                              className="!bg-emerald-500/10 !text-emerald-700 dark:!text-emerald-400 !border-emerald-500/20 text-[9px] font-semibold px-2 py-0.5 whitespace-nowrap"
                            >
                              Paid in Full
                            </Badge>
                          )}
                        </div>
                      </td>
                      <td className="p-3.5 font-bold text-[#00a86b] dark:text-[#00df89] whitespace-nowrap">
                        ৳ {safeMoney(order.total)}
                      </td>
                      <td className="p-3.5 text-right whitespace-nowrap">
                        <div className="flex items-center justify-end gap-1 flex-nowrap">
                          {isDue && (
                            <Button
                              size="sm"
                              onClick={() => handleOpenCollectDue(order)}
                              className="h-7 text-xs px-2.5 bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold gap-1.5 shadow-2xs cursor-pointer mr-1 whitespace-nowrap shrink-0 inline-flex items-center"
                              title="Collect Due Payment"
                            >
                              <Coins className="w-3.5 h-3.5 shrink-0" />
                              <span className="whitespace-nowrap">{lang === 'bn' ? 'বকেয়া গ্রহণ' : 'Collect Due'}</span>
                            </Button>
                          )}
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setSelectedOrder(order)}
                            className="h-7 text-xs px-2 text-slate-600 dark:text-zinc-300 hover:text-blue-500 shrink-0 cursor-pointer"
                            title={lang === 'bn' ? 'মেমো বিবরণ দেখুন' : 'View Receipt Memo'}
                          >
                            <Eye className="w-3.5 h-3.5" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => printSaleReceipt({ order, shop: mongoShop, lang })}
                            className="h-7 text-xs px-2 text-slate-600 dark:text-zinc-300 hover:text-[#00df89] shrink-0 cursor-pointer"
                            title={lang === 'bn' ? 'ক্যাশ মেমো প্রিন্ট করুন' : 'Print Receipt Memo'}
                          >
                            <Printer className="w-3.5 h-3.5" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleOpenEdit(order)}
                            className="h-7 text-xs px-2 text-slate-600 dark:text-zinc-300 hover:text-amber-500 shrink-0"
                            title="Edit Sale Details"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDeleteSale(order._id, order.invoice_number)}
                            className="h-7 text-xs px-2 text-rose-500 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 shrink-0"
                            title="Delete Sale & Restore Stock"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      {/* ---------------------------------------------------- */}
      {/* EDIT SALE MODAL                                      */}
      {/* ---------------------------------------------------- */}
      {isEditModalOpen && editingSale && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs">
          <Card className="max-w-md w-full p-6 bg-white dark:bg-[#121215] border-slate-200 dark:border-zinc-800 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-zinc-800 pb-3">
              <div>
                <h2 className="text-base font-bold text-slate-900 dark:text-white">Edit Sale: {editForm.invoice_number}</h2>
                <p className="text-xs text-slate-400">Update payment method, discount, cash received or notes</p>
              </div>
              <button onClick={() => setIsEditModalOpen(false)} className="text-slate-400 p-1 cursor-pointer">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleUpdateSale} className="space-y-3.5 text-xs">
              {/* Payment Method */}
              <div>
                <label className="block font-semibold mb-1 text-slate-700 dark:text-zinc-300">Payment Method</label>
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
                  <span className="font-semibold text-slate-700 dark:text-zinc-300">Discount Option</span>
                  <div className="flex bg-slate-200 dark:bg-zinc-800 p-0.5 rounded-lg text-[11px]">
                    <button
                      type="button"
                      onClick={() => setEditForm({ ...editForm, discount_type: 'flat' })}
                      className={`px-2 py-0.5 rounded-md font-medium transition-all ${editForm.discount_type === 'flat' ? 'bg-white dark:bg-zinc-900 text-slate-900 dark:text-white shadow-xs' : 'text-slate-500'}`}
                    >
                      Flat (৳)
                    </button>
                    <button
                      type="button"
                      onClick={() => setEditForm({ ...editForm, discount_type: 'percentage' })}
                      className={`px-2 py-0.5 rounded-md font-medium transition-all ${editForm.discount_type === 'percentage' ? 'bg-white dark:bg-zinc-900 text-slate-900 dark:text-white shadow-xs' : 'text-slate-500'}`}
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
                  <label className="block font-semibold mb-1 text-slate-700 dark:text-zinc-300">Paid Amount (৳)</label>
                  <input
                    type="number"
                    value={editForm.paid_amount}
                    onChange={(e) => setEditForm({ ...editForm, paid_amount: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-[#09090b] border border-slate-200 dark:border-zinc-800 outline-none"
                  />
                </div>
                <div>
                  <label className="block font-semibold mb-1 text-slate-700 dark:text-zinc-300">Cash Given (৳)</label>
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
                <label className="block font-semibold mb-1 text-slate-700 dark:text-zinc-300">Note / Remarks</label>
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
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={isUpdating}
                  size="sm"
                  className="bg-[#00df89] hover:bg-[#00c97b] text-[#011812] font-semibold"
                >
                  {isUpdating ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : 'Save Changes'}
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
          <Card className="max-w-md w-full p-6 bg-white dark:bg-[#121215] border-slate-200 dark:border-zinc-800 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-zinc-800 pb-3">
              <div>
                <h2 className="text-base font-bold text-slate-900 dark:text-white">Cash Memo / Receipt</h2>
                <p className="text-xs text-slate-400 font-mono">{selectedOrder.invoice_number || 'N/A'}</p>
              </div>
              <button onClick={() => setSelectedOrder(null)} className="text-slate-400 hover:text-slate-600 dark:hover:text-white p-1 cursor-pointer">
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
                    const itName = it?.name || it?.product_name || 'Item';
                    const itPrice = Number(it?.unit_price || it?.price || 0);
                    const itQty = Number(it?.quantity || it?.qty || 1);
                    const itSubtotal = Number(it?.subtotal !== undefined ? it.subtotal : (itPrice * itQty));
                    return (
                      <div key={i} className="pt-1.5 first:pt-0 flex items-center justify-between gap-2.5 text-[11px]">
                        <div className="flex items-center gap-2 min-w-0">
                          {itemImg ? (
                            <img
                              src={itemImg}
                              alt={itName}
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
                            <div className="font-semibold text-slate-900 dark:text-zinc-100 truncate">{itName}</div>
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
          <Card className="max-w-md w-full p-6 bg-white dark:bg-[#121215] border-slate-200 dark:border-zinc-800 space-y-4 shadow-2xl">
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
                  className="bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold gap-1.5 shadow-sm"
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
          <Card className="max-w-md w-full p-6 bg-white dark:bg-[#121215] border-slate-200 dark:border-zinc-800 space-y-4 shadow-2xl">
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
      {/* CONFIRM DELETE MODAL                                 */}
      {/* ---------------------------------------------------- */}
      <ConfirmDialog
        isOpen={confirmDeleteDialog.isOpen}
        isLoading={isDeleting}
        title={lang === 'bn' ? `ইনভয়েস '${confirmDeleteDialog.invoiceNumber}' মুছে ফেলতে চান?` : `Delete invoice '${confirmDeleteDialog.invoiceNumber}'?`}
        description={lang === 'bn' ? 'এই বিক্রিটি মুছে ফেলা হবে এবং সংশ্লিষ্ট পণ্যগুলোর স্টক পুনরায় ইনভেন্টরিতে ফেরত আসবে।' : 'This sale will be permanently deleted and all product stock will be restored back to your inventory.'}
        confirmText={lang === 'bn' ? 'হ্যাঁ, মুছে ফেলুন' : 'Yes, Delete'}
        cancelText={lang === 'bn' ? 'বাতিল' : 'Cancel'}
        onConfirm={handleConfirmDeleteSale}
        onCancel={() => setConfirmDeleteDialog({ isOpen: false, saleId: null, invoiceNumber: '' })}
      />

    </div>
  );
}
