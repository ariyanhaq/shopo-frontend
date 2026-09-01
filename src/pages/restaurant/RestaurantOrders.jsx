import { useState, useEffect } from 'react';
import { useLanguage } from '@/context/LanguageContext';
import { useShop } from '@/context/ShopContext';
import api from '@/services/api';
import toast from 'react-hot-toast';
import { Card, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/components/ui/select';
import { printSaleReceipt } from '@/utils/invoicePrinter';
import {
  Receipt, Search, RefreshCw, Printer, X, Eye, Edit3, DollarSign,
  Utensils, Clock, CheckCircle2, Flame, User, Phone, Check, Loader2,
  AlertCircle, ShieldCheck
} from 'lucide-react';

export default function RestaurantOrders() {
  const { lang } = useLanguage();
  const { activeShop, mongoShop } = useShop();

  const [orders, setOrders] = useState([]);
  const [selectedStatus, setSelectedStatus] = useState('all');
  const [selectedType, setSelectedType] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(true);

  // Modals state
  const [receipt, setReceipt] = useState(null);
  const [editingOrder, setEditingOrder] = useState(null);
  const [editForm, setEditForm] = useState({
    status: 'completed',
    order_type: 'dine_in',
    table_number: '',
    customer_name: '',
    customer_phone: '',
    payment_status: 'paid',
    payment_method: 'Cash',
    paid_amount: 0,
    discount_amount: 0,
    special_instructions: '',
  });
  const [isUpdating, setIsUpdating] = useState(false);

  const fetchOrders = async () => {
    try {
      setIsLoading(true);
      const params = {};
      if (selectedStatus !== 'all') params.status = selectedStatus;
      if (selectedType !== 'all') params.order_type = selectedType;

      const res = await api.restaurant.orders.list(params);
      if (res?.success) {
        setOrders(res.data.orders || []);
      }
    } catch (err) {
      console.error('Failed to load orders:', err);
      toast.error('Failed to load orders');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();
  }, [activeShop, selectedStatus, selectedType]);

  const filteredOrders = orders.filter((o) => {
    const q = searchQuery.toLowerCase().trim();
    return (
      !q ||
      o.order_number.toLowerCase().includes(q) ||
      o.customer_name.toLowerCase().includes(q) ||
      (o.table_number && o.table_number.toLowerCase().includes(q))
    );
  });

  // Open Receipt in the exact same format as Restaurant POS
  const handleOpenReceipt = (ord) => {
    const subtotal = ord.subtotal || 0;
    const vatAmount = ord.vat_amount || 0;
    const vatPercent = ord.vat_percent || 0;
    const serviceChargeAmount = ord.service_charge_amount || 0;
    const serviceChargePercent = ord.service_charge_percent || 0;
    const deliveryFee = ord.delivery_fee || 0;
    const discountAmount = ord.discount_amount || 0;
    const total = ord.total_amount || 0;
    const paidAmount = ord.paid_amount !== undefined ? ord.paid_amount : total;
    const changeToReturn = ord.change_returned || Math.max(0, paidAmount - total);

    setReceipt({
      invoice: ord.invoice_number || ord.order_number,
      kotNumber: ord.kot_number || 'KOT-1',
      date: new Date(ord.created_at).toLocaleString(),
      orderType: ord.order_type,
      tableNumber: ord.table_number || ord.table_id?.table_number || '',
      waiterName: ord.waiter_name || '',
      guestCount: ord.guest_count || 1,
      customerName: ord.customer_name || 'Walk-in Guest',
      customerPhone: ord.customer_phone || '',
      customerAddress: ord.delivery_address || '',
      paymentMethod: (ord.payment_method || 'Cash').toUpperCase() === 'CASH' ? 'Cash' : ord.payment_method || 'Cash',
      items: (ord.items || []).map((it) => ({
        name: it.name,
        name_bn: it.name_bn,
        modifiers: it.modifiers,
        cooking_notes: it.cooking_notes,
        price: it.unit_price || 0,
        qty: it.quantity || 1,
        subtotal: it.subtotal || (it.unit_price * (it.quantity || 1)),
      })),
      subtotal,
      vatPercent,
      vatAmount,
      serviceChargePercent,
      serviceChargeAmount,
      deliveryFee,
      discountAmount,
      discountType: 'flat',
      discountValue: discountAmount,
      total,
      paidAmount,
      cashReceived: paidAmount,
      changeToReturn,
    });
  };

  // Open Edit Order Modal
  const handleOpenEdit = (ord) => {
    setEditingOrder(ord);
    setEditForm({
      status: ord.status || 'completed',
      order_type: ord.order_type || 'dine_in',
      table_number: ord.table_number || ord.table_id?.table_number || '',
      customer_name: ord.customer_name || '',
      customer_phone: ord.customer_phone || '',
      payment_status: ord.payment_status || 'paid',
      payment_method: ord.payment_method || 'Cash',
      paid_amount: ord.paid_amount !== undefined ? ord.paid_amount : ord.total_amount,
      discount_amount: ord.discount_amount || 0,
      special_instructions: ord.special_instructions || '',
    });
  };

  // Save Edit Order
  const handleSaveEdit = async (e) => {
    e.preventDefault();
    if (!editingOrder) return;

    setIsUpdating(true);
    try {
      const res = await api.restaurant.orders.update(editingOrder._id, editForm);
      if (res?.success) {
        toast.success(lang === 'bn' ? 'অর্ডার সফলভাবে আপডেট করা হয়েছে!' : 'Order updated successfully!');
        setEditingOrder(null);
        fetchOrders();
      }
    } catch (err) {
      toast.error(err.message || 'Failed to update order');
    } finally {
      setIsUpdating(false);
    }
  };

  return (
    <div className="space-y-6 font-sans pb-16">
      
      {/* HEADER */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white tracking-tight flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-blue-500/10 text-blue-600 flex items-center justify-center">
              <Receipt className="w-4 h-4" />
            </div>
            <span>{lang === 'bn' ? 'রেস্তোরাঁ অর্ডার ও চালান তালিকা' : 'Restaurant Invoices & Order Logs'}</span>
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-zinc-400 font-normal mt-0.5">
            {lang === 'bn'
              ? 'ডাইন-ইন, পার্সেল ও ডেলিভারি অর্ডারের সম্পূর্ণ ইতিহাস, এডিট ও রসিদ রিপ্রিন্ট করুন।'
              : 'Complete history of Dine-in, Takeaway and Delivery orders, KOT records, invoice edits & reprints.'}
          </p>
        </div>

        <button
          onClick={fetchOrders}
          className="p-2.5 rounded-xl border border-slate-200 dark:border-zinc-800 hover:bg-slate-100 dark:hover:bg-zinc-800 text-slate-700 dark:text-zinc-300 transition-all cursor-pointer"
        >
          <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
        </button>
      </div>

      {/* FILTER BAR */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 border-b border-slate-200 dark:border-zinc-800 pb-3">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <Input
            placeholder="Search order #, customer, table..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9 h-9.5 text-xs bg-white dark:bg-zinc-900 rounded-xl"
          />
        </div>

        <div className="flex items-center gap-1.5 overflow-x-auto w-full sm:w-auto pb-1 scrollbar-none">
          {['all', 'dine_in', 'takeaway', 'delivery'].map((type) => (
            <button
              key={type}
              onClick={() => setSelectedType(type)}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold capitalize whitespace-nowrap transition-all cursor-pointer ${
                selectedType === type
                  ? 'bg-slate-900 text-white dark:bg-white dark:text-slate-900 shadow-xs'
                  : 'bg-slate-100 dark:bg-zinc-800 text-slate-600 dark:text-zinc-400 hover:bg-slate-200 dark:hover:bg-zinc-700'
              }`}
            >
              {type.replace('_', ' ')}
            </button>
          ))}
        </div>
      </div>

      {/* ORDERS TABLE */}
      <Card className="p-0 bg-white dark:bg-zinc-900 border-slate-200/80 dark:border-zinc-800 shadow-xs rounded-2xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-slate-50 dark:bg-zinc-800/60 border-b border-slate-200 dark:border-zinc-800 text-slate-500 dark:text-zinc-400 font-semibold">
                <th className="py-3 px-4">Order #</th>
                <th className="py-3 px-4">Type / Table</th>
                <th className="py-3 px-4">Customer</th>
                <th className="py-3 px-4">Dishes</th>
                <th className="py-3 px-4">Total Amount</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-zinc-800">
              {isLoading ? (
                [1, 2, 3, 4, 5, 6].map((i) => (
                  <tr key={i} className="animate-pulse">
                    <td className="py-3 px-4"><Skeleton className="h-4 w-16 rounded" /></td>
                    <td className="py-3 px-4"><Skeleton className="h-4 w-24 rounded" /></td>
                    <td className="py-3 px-4"><Skeleton className="h-4 w-28 rounded" /></td>
                    <td className="py-3 px-4"><Skeleton className="h-4 w-20 rounded" /></td>
                    <td className="py-3 px-4"><Skeleton className="h-4 w-16 rounded" /></td>
                    <td className="py-3 px-4"><Skeleton className="h-4 w-14 rounded-full" /></td>
                    <td className="py-3 px-4 text-right"><Skeleton className="h-7 w-20 rounded-lg ml-auto" /></td>
                  </tr>
                ))
              ) : filteredOrders.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-400 text-xs">
                    No orders matching your criteria.
                  </td>
                </tr>
              ) : (
                filteredOrders.map((ord) => (
                  <tr key={ord._id} className="hover:bg-slate-50 dark:hover:bg-zinc-800/40 transition-colors">
                    <td className="py-3 px-4 font-mono font-bold text-slate-900 dark:text-white">
                      #{ord.order_number}
                    </td>

                    <td className="py-3 px-4">
                      <div className="flex items-center gap-1.5">
                        <Badge className="capitalize text-[10px] bg-slate-100 dark:bg-zinc-800 text-slate-700 dark:text-zinc-300">
                          {ord.order_type.replace('_', ' ')}
                        </Badge>
                        {ord.table_number && (
                          <span className="font-bold text-orange-600 dark:text-orange-400">
                            Table {ord.table_number}
                          </span>
                        )}
                      </div>
                    </td>

                    <td className="py-3 px-4">
                      <div className="font-semibold text-slate-900 dark:text-white">{ord.customer_name}</div>
                      {ord.customer_phone && <div className="text-[10px] text-slate-400">{ord.customer_phone}</div>}
                    </td>

                    <td className="py-3 px-4 text-slate-600 dark:text-zinc-400">
                      {ord.items?.length || 0} items ({ord.items?.reduce((a, b) => a + b.quantity, 0) || 0} pcs)
                    </td>

                    <td className="py-3 px-4 font-mono font-black text-slate-900 dark:text-white">
                      ৳ {ord.total_amount?.toLocaleString()}
                    </td>

                    <td className="py-3 px-4">
                      <Badge
                        className={`capitalize text-[10px] ${
                          ord.status === 'completed'
                            ? 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border-emerald-500/30'
                            : ord.status === 'cooking'
                            ? 'bg-amber-500/15 text-amber-700 dark:text-amber-300 border-amber-500/30'
                            : ord.status === 'ready'
                            ? 'bg-blue-500/15 text-blue-700 dark:text-blue-300 border-blue-500/30'
                            : ord.status === 'served'
                            ? 'bg-purple-500/15 text-purple-700 dark:text-purple-300 border-purple-500/30'
                            : ord.status === 'cancelled'
                            ? 'bg-rose-500/15 text-rose-700 dark:text-rose-300 border-rose-500/30'
                            : 'bg-slate-100 dark:bg-zinc-800 text-slate-700 dark:text-zinc-300'
                        }`}
                      >
                        {ord.status}
                      </Badge>
                    </td>

                    <td className="py-3 px-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          type="button"
                          onClick={() => handleOpenReceipt(ord)}
                          className="px-2.5 py-1.5 rounded-lg border border-slate-200 dark:border-zinc-800 hover:bg-slate-100 dark:hover:bg-zinc-800 text-xs font-semibold text-slate-700 dark:text-zinc-300 cursor-pointer inline-flex items-center gap-1 transition-colors"
                          title="View & Print Cash Memo"
                        >
                          <Eye className="w-3.5 h-3.5" />
                          <span>View</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => handleOpenEdit(ord)}
                          className="px-2.5 py-1.5 rounded-lg bg-slate-100 dark:bg-zinc-800 hover:bg-orange-500 hover:text-white dark:hover:bg-orange-500 dark:hover:text-white text-xs font-semibold text-slate-700 dark:text-zinc-300 cursor-pointer inline-flex items-center gap-1 transition-colors border border-transparent hover:border-orange-600"
                          title="Edit Order Details & Status"
                        >
                          <Edit3 className="w-3.5 h-3.5" />
                          <span>Edit</span>
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </Card>

      {/* ---------------------------------------------------- */}
      {/* MODAL 1: POS-IDENTICAL CASH MEMO & RECEIPT VIEWER     */}
      {/* ---------------------------------------------------- */}
      {receipt && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs animate-in fade-in">
          <Card className="max-w-sm w-full p-5 bg-white dark:bg-[#121215] border-slate-200 dark:border-zinc-800 space-y-3.5 text-xs shadow-2xl relative">
            
            {/* Top Close Button */}
            <button
              type="button"
              onClick={() => setReceipt(null)}
              className="absolute top-3 right-3 p-1 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-zinc-200 hover:bg-slate-100 dark:hover:bg-zinc-800/80 transition-colors cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>

            {/* Receipt Header */}
            <div className="text-center border-b border-dashed border-slate-200 dark:border-zinc-700 pb-2.5 pt-1">
              <h3 className="font-bold text-sm text-slate-900 dark:text-white">{mongoShop?.name || activeShop?.name || 'Shopo Restaurant'}</h3>
              <p className="text-[10px] text-slate-400 font-mono mt-0.5">{receipt.invoice}</p>
              <p className="text-[10px] text-slate-400">{receipt.date}</p>
              <div className="mt-1 flex items-center justify-center gap-2">
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-orange-500/10 text-orange-600 font-bold capitalize">
                  {receipt.orderType?.replace('_', ' ')}
                </span>
                {receipt.tableNumber && (
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-slate-100 dark:bg-zinc-800 font-bold">
                    Table {receipt.tableNumber}
                  </span>
                )}
              </div>
              <p className="text-[11px] text-slate-600 dark:text-zinc-400 font-semibold mt-1">
                {receipt.customerName} {receipt.customerPhone ? `(${receipt.customerPhone})` : ''}
              </p>
            </div>

            {/* Line Items */}
            <div className="space-y-1.5 py-2 border-b border-dashed border-slate-200 dark:border-zinc-700 max-h-48 overflow-y-auto">
              {receipt.items.map((it, idx) => (
                <div key={idx} className="flex justify-between text-[11px] items-start">
                  <div>
                    <span className="font-semibold text-slate-900 dark:text-white">{it.name}</span>
                    {it.modifiers && it.modifiers.length > 0 && (
                      <div className="text-[10px] text-orange-600">
                        + {it.modifiers.map((m) => m.name).join(', ')}
                      </div>
                    )}
                    <div className="text-[10px] text-slate-400">৳ {it.price} × {it.qty}</div>
                  </div>
                  <span className="font-bold text-slate-900 dark:text-white">৳ {it.subtotal.toLocaleString()}</span>
                </div>
              ))}
            </div>

            {/* Financial Summary */}
            <div className="space-y-1 text-xs">
              <div className="flex justify-between text-slate-500">
                <span>Subtotal:</span>
                <span>৳ {receipt.subtotal.toLocaleString()}</span>
              </div>
              {receipt.discountAmount > 0 && (
                <div className="flex justify-between text-rose-500 font-medium">
                  <span>Discount:</span>
                  <span>- ৳ {receipt.discountAmount.toLocaleString()}</span>
                </div>
              )}
              <div className="flex justify-between text-slate-500">
                <span>VAT ({receipt.vatPercent}%):</span>
                <span>৳ {receipt.vatAmount.toLocaleString()}</span>
              </div>
              {receipt.serviceChargeAmount > 0 && (
                <div className="flex justify-between text-slate-500">
                  <span>Service Charge ({receipt.serviceChargePercent}%):</span>
                  <span>৳ {receipt.serviceChargeAmount.toLocaleString()}</span>
                </div>
              )}
              {receipt.deliveryFee > 0 && (
                <div className="flex justify-between text-slate-500">
                  <span>Delivery Fee:</span>
                  <span>৳ {receipt.deliveryFee.toLocaleString()}</span>
                </div>
              )}
              
              <div className="flex justify-between font-bold text-sm text-slate-900 dark:text-white pt-1.5 border-t border-slate-200 dark:border-zinc-700">
                <span>Net Total:</span>
                <span className="text-[#00a86b] dark:text-[#00df89]">৳ {receipt.total.toLocaleString()}</span>
              </div>

              <div className="flex justify-between text-slate-700 dark:text-zinc-300">
                <span>Paid ({receipt.paymentMethod}):</span>
                <span className="font-bold">৳ {receipt.paidAmount.toLocaleString()}</span>
              </div>

              {receipt.changeToReturn > 0 && (
                <div className="flex justify-between text-emerald-600 dark:text-[#00df89] font-bold">
                  <span>Change Returned:</span>
                  <span>৳ {receipt.changeToReturn.toLocaleString()}</span>
                </div>
              )}
            </div>

            {/* Print & Close Buttons */}
            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100 dark:border-zinc-800">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setReceipt(null)}
                className="cursor-pointer font-medium text-xs rounded-xl"
              >
                Close
              </Button>
              <Button
                size="sm"
                onClick={() =>
                  printSaleReceipt({
                    order: {
                      invoice_number: receipt.invoice,
                      date: receipt.date,
                      customer_name: receipt.customerName,
                      customer_phone: receipt.customerPhone,
                      payment_method: receipt.paymentMethod,
                      items: receipt.items.map((it) => ({
                        name: it.name,
                        unit_price: it.price,
                        quantity: it.qty,
                        subtotal: it.subtotal,
                      })),
                      subtotal: receipt.subtotal,
                      discount: receipt.discountAmount,
                      tax: receipt.vatAmount,
                      delivery_fee: receipt.deliveryFee,
                      total: receipt.total,
                      paid_amount: receipt.paidAmount,
                      cash_received: receipt.cashReceived,
                      change_amount: receipt.changeToReturn,
                    },
                    shop: mongoShop || activeShop,
                    lang,
                  })
                }
                className="bg-[#00df89] hover:bg-[#00c578] text-slate-950 font-bold text-xs gap-1.5 cursor-pointer shadow-xs rounded-xl"
              >
                <Printer className="w-3.5 h-3.5" />
                <span>{lang === 'bn' ? 'ক্যাশ মেমো প্রিন্ট' : 'Print Cash Memo'}</span>
              </Button>
            </div>
          </Card>
        </div>
      )}

      {/* ---------------------------------------------------- */}
      {/* MODAL 2: EDIT ORDER MODAL                            */}
      {/* ---------------------------------------------------- */}
      {editingOrder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs animate-in fade-in">
          <Card className="max-w-lg w-full p-5 sm:p-6 bg-white dark:bg-[#121215] border-slate-200 dark:border-zinc-800 shadow-2xl rounded-2xl max-h-[90vh] overflow-y-auto space-y-4">
            
            {/* Header */}
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-zinc-800 pb-3">
              <div>
                <CardTitle className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                  <Edit3 className="w-4 h-4 text-orange-500" />
                  <span>Edit Order #{editingOrder.order_number}</span>
                </CardTitle>
                <p className="text-[11px] text-slate-500 dark:text-zinc-400 mt-0.5">
                  Update order status, dining type, table, customer or payment info.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setEditingOrder(null)}
                className="text-slate-400 hover:text-slate-700 dark:hover:text-white cursor-pointer p-1 rounded-lg hover:bg-slate-100 dark:hover:bg-zinc-800 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Edit Form */}
            <form onSubmit={handleSaveEdit} className="space-y-3.5 text-xs">
              
              {/* Order Status & Order Type */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="font-semibold text-slate-700 dark:text-zinc-300 block mb-1">
                    Order Status *
                  </label>
                  <Select
                    value={editForm.status}
                    onValueChange={(val) => setEditForm({ ...editForm, status: val })}
                  >
                    <SelectTrigger className="h-9.5 text-xs rounded-xl bg-white dark:bg-zinc-900 border-slate-200 dark:border-zinc-800 font-semibold">
                      <SelectValue placeholder="Status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="completed">✓ Completed (Paid & Served)</SelectItem>
                      <SelectItem value="cooking">⏳ Cooking in Kitchen</SelectItem>
                      <SelectItem value="ready">🔔 Ready for Serving</SelectItem>
                      <SelectItem value="served">🍽️ Served to Table</SelectItem>
                      <SelectItem value="pending">📝 Pending</SelectItem>
                      <SelectItem value="cancelled">❌ Cancelled / Void</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <label className="font-semibold text-slate-700 dark:text-zinc-300 block mb-1">
                    Dining Type *
                  </label>
                  <Select
                    value={editForm.order_type}
                    onValueChange={(val) => setEditForm({ ...editForm, order_type: val })}
                  >
                    <SelectTrigger className="h-9.5 text-xs rounded-xl bg-white dark:bg-zinc-900 border-slate-200 dark:border-zinc-800 font-semibold">
                      <SelectValue placeholder="Type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="dine_in">🍽️ Dine-in</SelectItem>
                      <SelectItem value="takeaway">📦 Takeaway / Parcel</SelectItem>
                      <SelectItem value="delivery">🛵 Delivery</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Table & Customer Phone */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="font-semibold text-slate-700 dark:text-zinc-300 block mb-1">
                    Table Number / Name
                  </label>
                  <Input
                    placeholder="e.g. B-01, Table 4 (leave blank for Counter)"
                    value={editForm.table_number}
                    onChange={(e) => setEditForm({ ...editForm, table_number: e.target.value })}
                    className="h-9.5 text-xs rounded-xl bg-white dark:bg-zinc-900"
                  />
                </div>

                <div>
                  <label className="font-semibold text-slate-700 dark:text-zinc-300 block mb-1">
                    Customer Phone
                  </label>
                  <Input
                    placeholder="017XXXXXXXX"
                    value={editForm.customer_phone}
                    onChange={(e) => setEditForm({ ...editForm, customer_phone: e.target.value })}
                    className="h-9.5 text-xs rounded-xl bg-white dark:bg-zinc-900"
                  />
                </div>
              </div>

              {/* Customer Name & Payment Status */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="font-semibold text-slate-700 dark:text-zinc-300 block mb-1">
                    Customer Name
                  </label>
                  <Input
                    placeholder="Walk-in Guest"
                    value={editForm.customer_name}
                    onChange={(e) => setEditForm({ ...editForm, customer_name: e.target.value })}
                    className="h-9.5 text-xs rounded-xl bg-white dark:bg-zinc-900"
                  />
                </div>

                <div>
                  <label className="font-semibold text-slate-700 dark:text-zinc-300 block mb-1">
                    Payment Status
                  </label>
                  <Select
                    value={editForm.payment_status}
                    onValueChange={(val) => setEditForm({ ...editForm, payment_status: val })}
                  >
                    <SelectTrigger className="h-9.5 text-xs rounded-xl bg-white dark:bg-zinc-900 border-slate-200 dark:border-zinc-800 font-semibold">
                      <SelectValue placeholder="Payment Status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="paid">✓ Paid</SelectItem>
                      <SelectItem value="partially_paid">⏳ Partially Paid</SelectItem>
                      <SelectItem value="unpaid">⚠️ Unpaid / Due</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Payment Method & Paid Amount */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="font-semibold text-slate-700 dark:text-zinc-300 block mb-1">
                    Payment Method
                  </label>
                  <Select
                    value={editForm.payment_method}
                    onValueChange={(val) => setEditForm({ ...editForm, payment_method: val })}
                  >
                    <SelectTrigger className="h-9.5 text-xs rounded-xl bg-white dark:bg-zinc-900 border-slate-200 dark:border-zinc-800 font-semibold">
                      <SelectValue placeholder="Payment Method" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Cash">Cash</SelectItem>
                      <SelectItem value="bKash">bKash</SelectItem>
                      <SelectItem value="Nagad">Nagad</SelectItem>
                      <SelectItem value="Card">Card</SelectItem>
                      <SelectItem value="Bank Transfer">Bank Transfer</SelectItem>
                      <SelectItem value="Due">Due</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <label className="font-semibold text-slate-700 dark:text-zinc-300 block mb-1">
                    Paid Amount (৳)
                  </label>
                  <Input
                    type="number"
                    min="0"
                    value={editForm.paid_amount}
                    onChange={(e) => setEditForm({ ...editForm, paid_amount: e.target.value })}
                    className="h-9.5 text-xs font-mono font-bold rounded-xl bg-white dark:bg-zinc-900"
                  />
                </div>
              </div>

              {/* Special Notes / Instructions */}
              <div>
                <label className="font-semibold text-slate-700 dark:text-zinc-300 block mb-1">
                  Special Instructions / Chef Notes
                </label>
                <Input
                  placeholder="e.g. Less spicy, extra sauce side"
                  value={editForm.special_instructions}
                  onChange={(e) => setEditForm({ ...editForm, special_instructions: e.target.value })}
                  className="h-9.5 text-xs rounded-xl bg-white dark:bg-zinc-900"
                />
              </div>

              {/* Order Items Preview */}
              <div className="p-3 bg-slate-50 dark:bg-zinc-800/40 rounded-xl border border-slate-200/80 dark:border-zinc-800 space-y-1.5">
                <span className="font-bold text-slate-900 dark:text-white block">
                  Items in this order ({editingOrder.items?.length || 0}):
                </span>
                <div className="space-y-1 max-h-24 overflow-y-auto">
                  {editingOrder.items?.map((it, idx) => (
                    <div key={idx} className="flex justify-between text-[11px] text-slate-600 dark:text-zinc-300">
                      <span>{it.quantity}x {it.name}</span>
                      <span className="font-mono font-bold">৳ {it.subtotal?.toLocaleString()}</span>
                    </div>
                  ))}
                </div>
                <div className="flex justify-between text-xs font-black pt-1.5 border-t border-slate-200 dark:border-zinc-700 text-slate-900 dark:text-white">
                  <span>Total Bill:</span>
                  <span className="text-[#00a86b] dark:text-[#00df89] font-mono">৳ {editingOrder.total_amount?.toLocaleString()}</span>
                </div>
              </div>

              {/* Footer Buttons */}
              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100 dark:border-zinc-800">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setEditingOrder(null)}
                  className="cursor-pointer font-medium text-xs rounded-xl"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={isUpdating}
                  size="sm"
                  className="bg-[#00df89] hover:bg-[#00c578] text-slate-950 font-bold text-xs gap-1.5 cursor-pointer shadow-xs rounded-xl"
                >
                  {isUpdating ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Check className="w-3.5 h-3.5" />}
                  <span>{isUpdating ? 'Saving...' : 'Save Order Changes'}</span>
                </Button>
              </div>
            </form>
          </Card>
        </div>
      )}

    </div>
  );
}
