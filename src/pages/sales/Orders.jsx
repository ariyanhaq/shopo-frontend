/**
 * @file Orders.jsx
 * @description Comprehensive, clean Sales Management page for Shopo supporting English & Bangla with New Sale navigation.
 */
import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useLanguage } from '@/context/LanguageContext';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import {
  ShoppingCart, DollarSign, Plus, Search, Filter, Calendar,
  FileText, Download, Printer, Eye, CheckCircle2, Clock, X,
  ArrowUpRight, CreditCard, Wallet, Smartphone, ShieldCheck, ChevronRight
} from 'lucide-react';

export default function Orders() {
  const navigate = useNavigate();
  const { lang, t } = useLanguage();

  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [isReceiptModalOpen, setIsReceiptModalOpen] = useState(false);

  // Sample sales orders dataset
  const salesOrders = [
    {
      id: 'INV-2024-001',
      date: '2026-08-03 11:24 AM',
      customer: 'Tanvir Rahman',
      phone: '+880 1712-345678',
      items: [
        { name: 'Miniket Rice 25kg', qty: 2, price: 1850 },
        { name: 'Sunflower Oil 5L', qty: 1, price: 890 }
      ],
      method: 'bKash',
      status: 'paid',
      subtotal: 4590,
      discount: 90,
      total: 4500
    },
    {
      id: 'INV-2024-002',
      date: '2026-08-03 10:45 AM',
      customer: 'Karim Traders',
      phone: '+880 1819-876543',
      items: [
        { name: 'Bashundhara A4 Paper (Rim)', qty: 10, price: 380 },
        { name: 'Matador Pen Box', qty: 5, price: 240 }
      ],
      method: 'Cash',
      status: 'paid',
      subtotal: 5000,
      discount: 0,
      total: 5000
    },
    {
      id: 'INV-2024-003',
      date: '2026-08-03 09:15 AM',
      customer: 'Sabrina Fashion',
      phone: '+880 1911-223344',
      items: [
        { name: 'Ladies Jamdani Saree', qty: 1, price: 4500 }
      ],
      method: 'Nagad',
      status: 'pending',
      subtotal: 4500,
      discount: 300,
      total: 4200
    },
    {
      id: 'INV-2024-004',
      date: '2026-08-02 04:30 PM',
      customer: 'Rahim Electronics',
      phone: '+880 1612-998877',
      items: [
        { name: 'Walton Refrigerator 220L', qty: 1, price: 32500 }
      ],
      method: 'Card',
      status: 'paid',
      subtotal: 32500,
      discount: 500,
      total: 32000
    },
    {
      id: 'INV-2024-005',
      date: '2026-08-02 02:10 PM',
      customer: 'Walk-in Customer',
      phone: 'N/A',
      items: [
        { name: 'ACI Pure Salt 1kg', qty: 5, price: 42 },
        { name: 'Fresh Milk 1L', qty: 2, price: 90 }
      ],
      method: 'Cash',
      status: 'paid',
      subtotal: 390,
      discount: 0,
      total: 390
    }
  ];

  // Filtered orders list
  const filteredOrders = useMemo(() => {
    return salesOrders.filter(order => {
      const matchesStatus = statusFilter === 'all' || order.status === statusFilter;
      const q = searchQuery.toLowerCase().trim();
      const matchesSearch =
        !q ||
        order.id.toLowerCase().includes(q) ||
        order.customer.toLowerCase().includes(q) ||
        order.phone.includes(q);
      return matchesStatus && matchesSearch;
    });
  }, [searchQuery, statusFilter]);

  const handleOpenReceipt = (order) => {
    setSelectedOrder(order);
    setIsReceiptModalOpen(true);
  };

  return (
    <div className="space-y-6 font-sans">
      
      {/* HEADER SECTION */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-medium text-slate-900 dark:text-white tracking-tight">
            {lang === 'bn' ? 'বিক্রয় অ্যাকাউন্টস ও অর্ডারস' : 'Sales Orders & Invoices'}
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-zinc-400 font-normal mt-0.5">
            {lang === 'bn'
              ? 'আপনার দোকানের সকল বিক্রি, ক্যাশ মেমো ও পেমেন্ট রসিদ ম্যানেজ করুন।'
              : 'Track daily sales revenue, cash memos, customer invoices & payment status.'}
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" className="gap-1.5 text-xs font-medium dark:bg-[#121215]">
            <Download className="w-3.5 h-3.5" />
            <span>{lang === 'bn' ? 'রিপোর্ট নামান' : 'Export Sales'}</span>
          </Button>

          <Button
            variant="default"
            size="sm"
            onClick={() => navigate('/sales/new')}
            className="gap-1.5 bg-[#00df89] hover:bg-[#00c97b] text-[#011812] font-medium"
          >
            <Plus className="w-4 h-4 stroke-[2]" />
            <span>{lang === 'bn' ? 'নতুন বিক্রি' : 'New Sale'}</span>
          </Button>
        </div>
      </div>

      {/* SALES SUMMARY KPI CARDS (4 COLUMNS) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="p-5 border border-slate-200/90 dark:border-zinc-800/80 dark:bg-[#121215]">
          <div className="flex items-center justify-between">
            <span className="text-xs sm:text-sm font-medium text-slate-500 dark:text-zinc-400">
              {lang === 'bn' ? 'মোট বিক্রি আয়' : 'Total Revenue'}
            </span>
            <div className="w-8 h-8 rounded-lg bg-emerald-500/10 text-[#00a86b] dark:text-[#00df89] flex items-center justify-center">
              <DollarSign className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 space-y-1">
            <div className="text-2xl font-medium text-slate-900 dark:text-white">
              {lang === 'bn' ? '৳ ৪৬,০৮০' : '৳ 46,080'}
            </div>
            <div className="text-xs text-[#00a86b] dark:text-[#00df89] font-medium">
              +12.4% {lang === 'bn' ? 'গত মাস থেকে' : 'from last month'}
            </div>
          </div>
        </Card>

        <Card className="p-5 border border-slate-200/90 dark:border-zinc-800/80 dark:bg-[#121215]">
          <div className="flex items-center justify-between">
            <span className="text-xs sm:text-sm font-medium text-slate-500 dark:text-zinc-400">
              {lang === 'bn' ? 'মোট ইনভয়েস সংখ্যা' : 'Total Orders'}
            </span>
            <div className="w-8 h-8 rounded-lg bg-blue-500/10 text-blue-600 dark:text-blue-400 flex items-center justify-center">
              <ShoppingCart className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 space-y-1">
            <div className="text-2xl font-medium text-slate-900 dark:text-white">
              {lang === 'bn' ? '৫টি মেমো' : '5 Invoices'}
            </div>
            <div className="text-xs text-[#00a86b] dark:text-[#00df89] font-medium">
              +8.1% {lang === 'bn' ? 'নতুন বিক্রি' : 'new orders'}
            </div>
          </div>
        </Card>

        <Card className="p-5 border border-slate-200/90 dark:border-zinc-800/80 dark:bg-[#121215]">
          <div className="flex items-center justify-between">
            <span className="text-xs sm:text-sm font-medium text-slate-500 dark:text-zinc-400">
              {lang === 'bn' ? 'গড় অর্ডার মূল্য' : 'Avg Order Value'}
            </span>
            <div className="w-8 h-8 rounded-lg bg-purple-500/10 text-purple-600 dark:text-purple-400 flex items-center justify-center">
              <Wallet className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 space-y-1">
            <div className="text-2xl font-medium text-slate-900 dark:text-white">
              {lang === 'bn' ? '৳ ৯,২১৬' : '৳ 9,216'}
            </div>
            <div className="text-xs text-slate-500 dark:text-zinc-400 font-normal">
              {lang === 'bn' ? 'প্রতি বিক্রির গড়' : 'Per transaction average'}
            </div>
          </div>
        </Card>

        <Card className="p-5 border border-slate-200/90 dark:border-zinc-800/80 dark:bg-[#121215]">
          <div className="flex items-center justify-between">
            <span className="text-xs sm:text-sm font-medium text-slate-500 dark:text-zinc-400">
              {lang === 'bn' ? 'পরিশোধিত বনাম বকেয়া' : 'Paid vs Pending'}
            </span>
            <div className="w-8 h-8 rounded-lg bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center">
              <Clock className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 space-y-1">
            <div className="text-2xl font-medium text-slate-900 dark:text-white flex items-center gap-2">
              <span>4</span>
              <span className="text-xs font-normal text-slate-400">/ 1 Pending</span>
            </div>
            <div className="text-xs text-amber-600 dark:text-amber-400 font-medium">
              ৳ ৪,২০০ {lang === 'bn' ? 'বকেয়া বাকি' : 'Pending payment'}
            </div>
          </div>
        </Card>
      </div>

      {/* FILTER & SEARCH CONTROL BAR */}
      <Card className="p-4 border border-slate-200/90 dark:border-zinc-800/80 dark:bg-[#121215] space-y-3 sm:space-y-0 sm:flex sm:items-center sm:justify-between gap-4">
        
        {/* Search Bar */}
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 text-slate-400 dark:text-zinc-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <Input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder={lang === 'bn' ? 'ইনভয়েস #, কাস্টমারের নাম বা ফোন নাম্বার খুঁজুন...' : 'Search Invoice #, customer name or phone...'}
            className="pl-10 dark:bg-[#09090b]"
          />
        </div>

        {/* Status Filter Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar">
          {[
            { id: 'all', label: lang === 'bn' ? 'সব মেমো' : 'All Orders' },
            { id: 'paid', label: lang === 'bn' ? 'পরিশোধিত' : 'Paid' },
            { id: 'pending', label: lang === 'bn' ? 'বকেয়া' : 'Pending' }
          ].map((st) => (
            <button
              key={st.id}
              onClick={() => setStatusFilter(st.id)}
              className={`px-3 py-1.5 rounded-xl text-xs font-medium transition-colors shrink-0 cursor-pointer ${
                statusFilter === st.id
                  ? 'bg-slate-900 text-white dark:bg-white dark:text-slate-900 shadow-xs'
                  : 'bg-slate-100 dark:bg-[#09090b] text-slate-600 dark:text-zinc-400 hover:bg-slate-200 dark:hover:bg-zinc-800'
              }`}
            >
              {st.label}
            </button>
          ))}
        </div>

      </Card>

      {/* SALES ORDERS TABLE */}
      <Card className="border border-slate-200/90 dark:border-zinc-800/80 dark:bg-[#121215] overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs sm:text-sm">
            <thead>
              <tr className="border-b border-slate-200/80 dark:border-zinc-800/80 bg-slate-50/50 dark:bg-zinc-900/50 text-slate-500 dark:text-zinc-400 font-medium">
                <th className="p-4">{lang === 'bn' ? 'ইনভয়েস #' : 'Invoice #'}</th>
                <th className="p-4">{lang === 'bn' ? 'তারিখ ও সময়' : 'Date & Time'}</th>
                <th className="p-4">{lang === 'bn' ? 'কাস্টমার' : 'Customer'}</th>
                <th className="p-4">{lang === 'bn' ? 'পেমেন্ট মাধ্যম' : 'Payment Method'}</th>
                <th className="p-4 text-right">{lang === 'bn' ? 'মোট টাকা' : 'Total Amount'}</th>
                <th className="p-4 text-center">{lang === 'bn' ? 'স্ট্যাটাস' : 'Status'}</th>
                <th className="p-4 text-right">{lang === 'bn' ? 'অ্যাকশন' : 'Actions'}</th>
              </tr>
            </thead>

            <tbody className="divide-y divide-slate-100 dark:divide-zinc-800/60">
              {filteredOrders.map((order) => (
                <tr
                  key={order.id}
                  className="hover:bg-slate-50/60 dark:hover:bg-zinc-800/40 transition-colors"
                >
                  <td className="p-4 font-medium text-slate-900 dark:text-white">
                    {order.id}
                  </td>
                  <td className="p-4 text-slate-500 dark:text-zinc-400 font-normal">
                    {order.date}
                  </td>
                  <td className="p-4">
                    <div className="font-medium text-slate-900 dark:text-white">{order.customer}</div>
                    <div className="text-[11px] text-slate-400 font-normal">{order.phone}</div>
                  </td>
                  <td className="p-4 text-slate-700 dark:text-zinc-300 font-normal">
                    {order.method}
                  </td>
                  <td className="p-4 text-right font-medium text-slate-900 dark:text-white">
                    ৳ {order.total.toLocaleString()}
                  </td>
                  <td className="p-4 text-center">
                    <Badge variant={order.status === 'paid' ? 'default' : 'warning'} className="uppercase text-[10px] font-normal">
                      {order.status === 'paid' ? (lang === 'bn' ? 'পরিশোধিত' : 'paid') : (lang === 'bn' ? 'বকেয়া' : 'pending')}
                    </Badge>
                  </td>
                  <td className="p-4 text-right">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleOpenReceipt(order)}
                      className="h-7 text-xs gap-1 font-medium dark:bg-[#09090b]"
                    >
                      <Eye className="w-3.5 h-3.5" />
                      <span>{lang === 'bn' ? 'রসিদ' : 'Receipt'}</span>
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {filteredOrders.length === 0 && (
          <div className="p-8 text-center text-xs sm:text-sm text-slate-400 font-normal">
            {lang === 'bn' ? 'কোনো সেলস মেমো পাওয়া যায়নি।' : 'No sales records match your search filter.'}
          </div>
        )}
      </Card>

      {/* CASH MEMO RECEIPT MODAL */}
      {isReceiptModalOpen && selectedOrder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs">
          <div className="w-full max-w-md bg-white dark:bg-[#121215] rounded-2xl border border-slate-200 dark:border-zinc-800 shadow-2xl p-6 space-y-6">
            
            {/* Receipt Modal Header */}
            <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-zinc-800/80">
              <div>
                <h3 className="font-medium text-base text-slate-900 dark:text-white">
                  {lang === 'bn' ? 'ডিজিটাল ক্যাশ মেমো' : 'Digital Cash Memo'}
                </h3>
                <div className="text-xs text-slate-400 font-normal">{selectedOrder.id} • {selectedOrder.date}</div>
              </div>

              <button
                onClick={() => setIsReceiptModalOpen(false)}
                className="w-7 h-7 rounded-lg bg-slate-100 dark:bg-zinc-800 text-slate-500 hover:text-slate-900 dark:hover:text-white flex items-center justify-center"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Receipt Items Breakdown */}
            <div className="space-y-3">
              <div className="text-xs font-medium text-slate-500 dark:text-zinc-400 uppercase tracking-wider">
                {lang === 'bn' ? 'পণ্যের তালিকা' : 'Purchased Items'}
              </div>

              <div className="space-y-2 border-b border-slate-100 dark:border-zinc-800/80 pb-3">
                {selectedOrder.items.map((item, idx) => (
                  <div key={idx} className="flex items-center justify-between text-xs sm:text-sm">
                    <div>
                      <div className="font-medium text-slate-800 dark:text-zinc-200">{item.name}</div>
                      <div className="text-[11px] text-slate-400 font-normal">{item.qty} x ৳{item.price}</div>
                    </div>
                    <div className="font-medium text-slate-900 dark:text-white">
                      ৳ {item.qty * item.price}
                    </div>
                  </div>
                ))}
              </div>

              {/* Totals Calculation */}
              <div className="space-y-1.5 text-xs sm:text-sm pt-1">
                <div className="flex items-center justify-between text-slate-500 dark:text-zinc-400">
                  <span>Subtotal</span>
                  <span>৳ {selectedOrder.subtotal}</span>
                </div>
                {selectedOrder.discount > 0 && (
                  <div className="flex items-center justify-between text-rose-500 font-normal">
                    <span>Discount</span>
                    <span>-৳ {selectedOrder.discount}</span>
                  </div>
                )}
                <div className="flex items-center justify-between text-sm font-medium text-slate-900 dark:text-white pt-2 border-t border-slate-100 dark:border-zinc-800">
                  <span>Total Amount Paid ({selectedOrder.method})</span>
                  <span className="text-[#00a86b] dark:text-[#00df89]">৳ {selectedOrder.total}</span>
                </div>
              </div>
            </div>

            {/* Modal Actions */}
            <div className="flex items-center gap-3 pt-2">
              <Button variant="outline" className="flex-1 text-xs gap-1.5 dark:bg-[#09090b]">
                <Printer className="w-3.5 h-3.5" />
                <span>Print Memo</span>
              </Button>

              <Button variant="default" onClick={() => setIsReceiptModalOpen(false)} className="flex-1 text-xs bg-[#00df89] hover:bg-[#00c97b] text-[#011812] font-medium">
                Done
              </Button>
            </div>

          </div>
        </div>
      )}

    </div>
  );
}
