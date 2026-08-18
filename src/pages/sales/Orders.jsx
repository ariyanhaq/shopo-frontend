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
  Coins, Percent, Edit2, Trash2, AlertTriangle, Sparkles
} from 'lucide-react';

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
                  <th className="p-3.5">Invoice #</th>
                  <th className="p-3.5">Customer</th>
                  <th className="p-3.5">Items</th>
                  <th className="p-3.5">Discount</th>
                  <th className="p-3.5">Date & Time</th>
                  <th className="p-3.5">Payment / Due Status</th>
                  <th className="p-3.5">Net Total (৳)</th>
                  <th className="p-3.5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-zinc-800/80">
                {filteredOrders.map((order) => {
                  const isDue = (order.due_amount || 0) > 0;
                  return (
                    <tr key={order._id} className="hover:bg-slate-50 dark:hover:bg-zinc-900/40 transition-colors">
                      <td className="p-3.5 font-semibold text-slate-900 dark:text-white flex items-center gap-2">
                        <FileText className="w-3.5 h-3.5 text-slate-400" />
                        <span>{order.invoice_number}</span>
                      </td>
                      <td className="p-3.5 text-slate-800 dark:text-zinc-200 font-medium">
                        <div>{order.customer_id?.name || 'Walk-in Customer'}</div>
                        {order.customer_id?.phone && (
                          <div className="text-[10px] text-slate-400 font-mono">{order.customer_id.phone}</div>
                        )}
                      </td>
                      <td className="p-3.5 text-slate-600 dark:text-zinc-300">
                        {order.items?.map(it => `${it.name} (${it.quantity})`).join(', ') || '1 item'}
                      </td>
                      <td className="p-3.5 text-rose-500 font-medium">
                        {order.discount > 0 ? (
                          <span>- ৳ {order.discount.toLocaleString()} {order.discount_type === 'percentage' ? `(${order.discount_value}%)` : ''}</span>
                        ) : (
                          <span className="text-slate-400">None</span>
                        )}
                      </td>
                      <td className="p-3.5 text-slate-500">
                        {new Date(order.created_at).toLocaleString()}
                      </td>
                      <td className="p-3.5">
                        <div className="flex flex-col items-start gap-1">
                          <Badge
                            variant={order.payment_method?.toLowerCase() === 'due' ? 'warning' : 'secondary'}
                            className={`text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 ${
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
                              className="!bg-amber-500/15 !text-amber-500 dark:!text-amber-400 !border-amber-500/30 text-[10px] font-bold px-2 py-0.5"
                            >
                              Due: ৳{order.due_amount.toLocaleString()}
                            </Badge>
                          ) : (
                            <Badge
                              variant="default"
                              className="!bg-emerald-500/10 !text-emerald-700 dark:!text-emerald-400 !border-emerald-500/20 text-[9px] font-semibold px-2 py-0.5"
                            >
                              Paid in Full
                            </Badge>
                          )}
                        </div>
                      </td>
                      <td className="p-3.5 font-bold text-[#00a86b] dark:text-[#00df89]">
                        ৳ {(order.total || 0).toLocaleString()}
                      </td>
                      <td className="p-3.5 text-right">
                        <div className="flex items-center justify-end gap-1">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setSelectedOrder(order)}
                            className="h-7 text-xs px-2 text-slate-600 dark:text-zinc-300 hover:text-[#00df89]"
                            title="View Receipt Memo"
                          >
                            <Printer className="w-3.5 h-3.5" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleOpenEdit(order)}
                            className="h-7 text-xs px-2 text-slate-600 dark:text-zinc-300 hover:text-amber-500"
                            title="Edit Sale Details"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDeleteSale(order._id, order.invoice_number)}
                            className="h-7 text-xs px-2 text-rose-500 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40"
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
                <p className="text-xs text-slate-400 font-mono">{selectedOrder.invoice_number}</p>
              </div>
              <button onClick={() => setSelectedOrder(null)} className="text-slate-400 p-1 cursor-pointer">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-4 rounded-xl bg-slate-50 dark:bg-[#09090b] border border-slate-200 dark:border-zinc-800 space-y-3 text-xs">
              <div className="text-center pb-2 border-b border-slate-200 dark:border-zinc-800">
                <h3 className="font-bold text-sm text-slate-900 dark:text-white">{mongoShop?.name || 'Shopo Store'}</h3>
                <p className="text-[11px] text-slate-400">{new Date(selectedOrder.created_at).toLocaleString()}</p>
              </div>

              <div className="space-y-1 text-[11px]">
                <div className="flex justify-between">
                  <span className="text-slate-500">Customer:</span>
                  <span className="font-semibold text-slate-800 dark:text-zinc-200">
                    {selectedOrder.customer_id?.name || 'Walk-in Customer'}
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
                  <span className="font-semibold capitalize">{selectedOrder.payment_method}</span>
                </div>
              </div>

              {/* Items List */}
              <div className="pt-2 border-t border-slate-200 dark:border-zinc-800 space-y-1.5">
                <div className="font-semibold text-slate-700 dark:text-zinc-300 text-[11px]">Purchased Items:</div>
                {selectedOrder.items?.map((it, i) => (
                  <div key={i} className="flex justify-between text-[11px]">
                    <span className="truncate pr-2">{it.name} x {it.quantity}</span>
                    <span className="font-semibold shrink-0">৳ {(it.subtotal || it.unit_price * it.quantity).toLocaleString()}</span>
                  </div>
                ))}
              </div>

              {/* Financial Calculations Breakdown */}
              <div className="pt-2 border-t border-slate-200 dark:border-zinc-800 space-y-1 text-xs">
                <div className="flex justify-between text-slate-500">
                  <span>Subtotal:</span>
                  <span>৳ {(selectedOrder.subtotal || selectedOrder.total).toLocaleString()}</span>
                </div>
                {(selectedOrder.discount || 0) > 0 && (
                  <div className="flex justify-between text-rose-500">
                    <span>
                      Discount {selectedOrder.discount_type === 'percentage' ? `(${selectedOrder.discount_value}%)` : '(Flat)'}:
                    </span>
                    <span className="font-bold">- ৳ {selectedOrder.discount.toLocaleString()}</span>
                  </div>
                )}
                <div className="flex justify-between font-bold text-sm text-slate-900 dark:text-white pt-1 border-t border-slate-200 dark:border-zinc-800">
                  <span>Total Bill Amount:</span>
                  <span className="text-[#00a86b] dark:text-[#00df89]">৳ {(selectedOrder.total || 0).toLocaleString()}</span>
                </div>

                <div className="flex justify-between text-slate-700 dark:text-zinc-300 pt-1">
                  <span>Amount Paid:</span>
                  <span className="font-semibold text-[#00a86b] dark:text-[#00df89]">
                    ৳ {(selectedOrder.paid_amount !== undefined ? selectedOrder.paid_amount : selectedOrder.total).toLocaleString()}
                  </span>
                </div>

                {/* Due Breakdown in Detailed Memo */}
                {(selectedOrder.due_amount > 0 || (selectedOrder.customer_id?.total_due || 0) > 0) && (
                  <div className="pt-1.5 mt-1 border-t border-dashed border-slate-200 dark:border-zinc-700 space-y-0.5 text-[11px]">
                    {selectedOrder.due_amount > 0 && (
                      <div className="flex justify-between text-amber-600 font-bold">
                        <span>This Bill Due (এই মেমোর বকেয়া):</span>
                        <span>৳ {selectedOrder.due_amount.toLocaleString()}</span>
                      </div>
                    )}
                    {(selectedOrder.customer_id?.total_due || 0) > 0 && (
                      <div className="flex justify-between text-slate-500 font-medium">
                        <span>Customer Total Outstanding Due:</span>
                        <span className="text-amber-600 font-semibold">৳ {selectedOrder.customer_id.total_due.toLocaleString()}</span>
                      </div>
                    )}
                  </div>
                )}

                {/* Tendered & Change Breakdown */}
                {selectedOrder.payment_method?.toLowerCase() === 'cash' && (selectedOrder.tendered_amount || 0) > 0 && (selectedOrder.due_amount || 0) === 0 && (
                  <>
                    <div className="flex justify-between text-slate-600 dark:text-zinc-400 pt-1">
                      <span>Cash Given by Customer:</span>
                      <span className="font-semibold">৳ {selectedOrder.tendered_amount.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between text-emerald-600 dark:text-[#00df89] font-bold">
                      <span>Change Returned:</span>
                      <span>৳ {(selectedOrder.change_amount || 0).toLocaleString()}</span>
                    </div>
                  </>
                )}
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-3 border-t border-slate-100 dark:border-zinc-800">
              <Button variant="outline" size="sm" onClick={() => setSelectedOrder(null)}>
                Close
              </Button>
              <Button size="sm" onClick={() => window.print()} className="bg-[#00df89] hover:bg-[#00c97b] text-[#011812] font-semibold gap-1">
                <Printer className="w-3.5 h-3.5" /> Print Receipt
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
