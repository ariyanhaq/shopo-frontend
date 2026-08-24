import { useState, useEffect } from 'react';
import { useLanguage } from '@/context/LanguageContext';
import { useShop } from '@/context/ShopContext';
import api from '@/services/api';
import toast from 'react-hot-toast';
import { Card, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import {
  Receipt, Search, RefreshCw, Printer, X, Eye, DollarSign,
  Utensils, Clock, CheckCircle2, Flame
} from 'lucide-react';

export default function RestaurantOrders() {
  const { lang } = useLanguage();
  const { activeShop } = useShop();

  const [orders, setOrders] = useState([]);
  const [selectedStatus, setSelectedStatus] = useState('all');
  const [selectedType, setSelectedType] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(true);

  // Detail Modal
  const [selectedOrder, setSelectedOrder] = useState(null);

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
              ? 'ডাইন-ইন, পার্সেল ও ডেলিভারি অর্ডারের সম্পূর্ণ ইতিহাস ও রসিদ রিপ্রিন্ট করুন।'
              : 'Complete history of Dine-in, Takeaway and Delivery orders, KOT records & invoice reprints.'}
          </p>
        </div>

        <button
          onClick={fetchOrders}
          className="p-2.5 rounded-xl border border-slate-200 dark:border-zinc-800 hover:bg-slate-100 text-slate-700 dark:text-zinc-300 transition-all cursor-pointer"
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
                  : 'bg-slate-100 dark:bg-zinc-800 text-slate-600 dark:text-zinc-400 hover:bg-slate-200'
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
              {filteredOrders.length === 0 ? (
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
                            : 'bg-blue-500/15 text-blue-700 dark:text-blue-300 border-blue-500/30'
                        }`}
                      >
                        {ord.status}
                      </Badge>
                    </td>

                    <td className="py-3 px-4 text-right">
                      <button
                        onClick={() => setSelectedOrder(ord)}
                        className="px-2.5 py-1.5 rounded-lg border border-slate-200 dark:border-zinc-800 hover:bg-slate-100 text-xs font-semibold text-slate-700 dark:text-zinc-300 cursor-pointer inline-flex items-center gap-1"
                      >
                        <Eye className="w-3.5 h-3.5" />
                        <span>View</span>
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </Card>

      {/* DETAIL MODAL */}
      {selectedOrder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs">
          <Card className="max-w-md w-full p-6 bg-white dark:bg-[#121215] border-slate-200 dark:border-zinc-800 shadow-2xl rounded-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-zinc-800 pb-3 mb-4">
              <div>
                <CardTitle className="text-base font-bold text-slate-900 dark:text-white">
                  Invoice #{selectedOrder.order_number}
                </CardTitle>
                <div className="text-xs text-slate-500">
                  {new Date(selectedOrder.created_at).toLocaleString()}
                </div>
              </div>
              <button
                onClick={() => setSelectedOrder(null)}
                className="text-slate-400 hover:text-white cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4 text-xs">
              <div className="p-3 bg-slate-50 dark:bg-zinc-800/40 rounded-xl space-y-1">
                <div className="flex justify-between">
                  <span className="text-slate-500">Order Type:</span>
                  <span className="font-bold capitalize">{selectedOrder.order_type.replace('_', ' ')}</span>
                </div>
                {selectedOrder.table_number && (
                  <div className="flex justify-between">
                    <span className="text-slate-500">Table:</span>
                    <span className="font-bold text-orange-600">Table {selectedOrder.table_number}</span>
                  </div>
                )}
                <div className="flex justify-between">
                  <span className="text-slate-500">Customer:</span>
                  <span className="font-bold">{selectedOrder.customer_name}</span>
                </div>
                {selectedOrder.waiter_name && (
                  <div className="flex justify-between">
                    <span className="text-slate-500">Waiter:</span>
                    <span className="font-bold">{selectedOrder.waiter_name}</span>
                  </div>
                )}
              </div>

              {/* Items List */}
              <div className="space-y-1.5">
                <span className="font-bold text-slate-900 dark:text-white block">Order Items:</span>
                {selectedOrder.items.map((it, idx) => (
                  <div key={idx} className="flex justify-between py-1 border-b border-dashed border-slate-200 dark:border-zinc-800">
                    <div>
                      <span className="font-bold">{it.name}</span>
                      <span className="text-slate-500 ml-1">× {it.quantity}</span>
                      {it.modifiers && it.modifiers.length > 0 && (
                        <div className="text-[10px] text-orange-600">+ {it.modifiers.map(m => m.name).join(', ')}</div>
                      )}
                    </div>
                    <span className="font-mono font-bold">৳ {it.subtotal}</span>
                  </div>
                ))}
              </div>

              {/* Summary */}
              <div className="space-y-1 pt-2 border-t border-slate-200 dark:border-zinc-800">
                <div className="flex justify-between text-slate-500">
                  <span>Subtotal:</span>
                  <span className="font-mono">৳ {selectedOrder.subtotal}</span>
                </div>
                <div className="flex justify-between text-slate-500">
                  <span>VAT:</span>
                  <span className="font-mono">৳ {selectedOrder.vat_amount}</span>
                </div>
                {selectedOrder.service_charge_amount > 0 && (
                  <div className="flex justify-between text-slate-500">
                    <span>Service Charge:</span>
                    <span className="font-mono">৳ {selectedOrder.service_charge_amount}</span>
                  </div>
                )}
                <div className="flex justify-between text-sm font-black pt-1 border-t border-slate-200 dark:border-zinc-800 text-slate-900 dark:text-white">
                  <span>Total Amount:</span>
                  <span className="text-orange-600 font-mono">৳ {selectedOrder.total_amount}</span>
                </div>
              </div>

              <div className="flex items-center gap-2 pt-3 border-t border-slate-100 dark:border-zinc-800">
                <button
                  onClick={() => window.print()}
                  className="flex-1 py-2 rounded-xl bg-slate-900 text-white dark:bg-white dark:text-slate-900 font-bold text-xs flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <Printer className="w-4 h-4" />
                  <span>Print Receipt</span>
                </button>
              </div>
            </div>
          </Card>
        </div>
      )}

    </div>
  );
}
