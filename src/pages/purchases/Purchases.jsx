/**
 * @file Purchases.jsx
 * @description Purchases & Stock-In Ledger for tracking product acquisitions, vendor invoices, payment status, and stock increases.
 */
import { useState, useEffect, useMemo } from 'react';
import { useLanguage } from '@/context/LanguageContext';
import { api } from '@/services/api';
import {
  ShoppingBag, Plus, Search, Calendar, DollarSign,
  Receipt, CheckCircle2, AlertCircle, Loader2, X,
  Building2, ArrowUpDown, ChevronRight, Filter, Eye,
  Printer, CreditCard, Trash2, PlusCircle
} from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem
} from '@/components/ui/select';
import toast from 'react-hot-toast';

export default function Purchases() {
  const { lang } = useLanguage();

  const [purchases, setPurchases] = useState([]);
  const [suppliers, setSuppliers] = useState([]);
  const [products, setProducts] = useState([]);
  const [stats, setStats] = useState({ total_purchases: 0, total_amount: 0, total_paid: 0, total_due: 0 });
  const [isLoading, setIsLoading] = useState(true);

  // Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  // Modal States
  const [isPurchaseModalOpen, setIsPurchaseModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedInvoice, setSelectedInvoice] = useState(null);

  // Inline Supplier State inside Purchase Modal
  const [showInlineSupplier, setShowInlineSupplier] = useState(false);
  const [newSupplierName, setNewSupplierName] = useState('');
  const [newSupplierPhone, setNewSupplierPhone] = useState('');
  const [isCreatingSupplier, setIsCreatingSupplier] = useState(false);

  // Purchase Form State
  const [purchaseForm, setPurchaseForm] = useState({
    supplier_id: '',
    supplier_name: 'General / Walk-in Supplier',
    items: [
      { product_id: '', product_name: '', quantity: 1, unit_cost: 0, selling_price: 0, total_cost: 0 }
    ],
    discount: 0,
    paid_amount: '',
    payment_method: 'cash',
    notes: '',
  });

  // Fetch Purchases & References
  const fetchPurchasesData = async () => {
    setIsLoading(true);
    try {
      const [purchRes, statsRes, suppRes, prodRes] = await Promise.all([
        api.purchases.list(),
        api.purchases.getStats().catch(() => ({ data: {} })),
        api.suppliers.list().catch(() => ({ data: [] })),
        api.products.list().catch(() => ({ data: [] })),
      ]);

      setPurchases(Array.isArray(purchRes?.data) ? purchRes.data : []);
      if (statsRes?.data) {
        setStats(statsRes.data);
      }
      setSuppliers(Array.isArray(suppRes?.data) ? suppRes.data : []);

      const rawProds = Array.isArray(prodRes?.data)
        ? prodRes.data
        : Array.isArray(prodRes?.data?.docs)
        ? prodRes.data.docs
        : [];
      setProducts(rawProds);
    } catch (err) {
      console.warn('Failed to load purchases:', err);
      toast.error(err.message || 'Failed to load purchase records');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchPurchasesData();
  }, []);

  // Filter Purchases
  const filteredPurchases = useMemo(() => {
    return purchases.filter((p) => {
      const matchesStatus = statusFilter === 'all' || p.payment_status === statusFilter;
      const q = searchQuery.toLowerCase().trim();
      const matchesSearch =
        !q ||
        (p.purchase_number || '').toLowerCase().includes(q) ||
        (p.supplier_name || '').toLowerCase().includes(q) ||
        (p.items || []).some((item) => (item.product_name || '').toLowerCase().includes(q));
      return matchesStatus && matchesSearch;
    });
  }, [purchases, statusFilter, searchQuery]);

  // Handle Form Item Changes
  const handleItemChange = (index, field, value) => {
    const updated = [...purchaseForm.items];
    const item = { ...updated[index], [field]: value };

    if (field === 'product_id') {
      const found = products.find((p) => p._id === value);
      if (found) {
        item.product_name = found.name;
        item.unit_cost = found.cost_price || 0;
        item.selling_price = found.selling_price || 0;
        item.total_cost = (item.quantity || 1) * (found.cost_price || 0);
      }
    } else if (field === 'quantity' || field === 'unit_cost') {
      const q = field === 'quantity' ? Number(value) || 0 : Number(item.quantity) || 0;
      const c = field === 'unit_cost' ? Number(value) || 0 : Number(item.unit_cost) || 0;
      item.total_cost = q * c;
    }

    updated[index] = item;
    setPurchaseForm((prev) => ({ ...prev, items: updated }));
  };

  // Add Item Row
  const handleAddItemRow = () => {
    setPurchaseForm((prev) => ({
      ...prev,
      items: [
        ...prev.items,
        { product_id: '', product_name: '', quantity: 1, unit_cost: 0, selling_price: 0, total_cost: 0 }
      ]
    }));
  };

  // Remove Item Row
  const handleRemoveItemRow = (index) => {
    if (purchaseForm.items.length <= 1) return;
    setPurchaseForm((prev) => ({
      ...prev,
      items: prev.items.filter((_, i) => i !== index),
    }));
  };

  // Calculations
  const calculatedTotal = purchaseForm.items.reduce((acc, it) => acc + (Number(it.total_cost) || 0), 0);
  const calculatedDiscount = Number(purchaseForm.discount) || 0;
  const calculatedNet = Math.max(0, calculatedTotal - calculatedDiscount);
  const calculatedPaid = purchaseForm.paid_amount !== '' ? Number(purchaseForm.paid_amount) : calculatedNet;
  const calculatedDue = Math.max(0, calculatedNet - calculatedPaid);

  // Handle Inline Supplier Creation
  const handleCreateSupplierInline = async () => {
    if (!newSupplierName.trim()) return;
    setIsCreatingSupplier(true);
    try {
      const res = await api.suppliers.create({
        name: newSupplierName.trim(),
        phone: newSupplierPhone.trim(),
      });
      if (res?.data) {
        setSuppliers((prev) => [res.data, ...prev]);
        setPurchaseForm((prev) => ({
          ...prev,
          supplier_id: res.data._id,
          supplier_name: res.data.name,
        }));
        setShowInlineSupplier(false);
        setNewSupplierName('');
        setNewSupplierPhone('');
        toast.success(lang === 'bn' ? `সাপ্লায়ার '${res.data.name}' যুক্ত হয়েছে!` : `Supplier '${res.data.name}' created!`);
      }
    } catch (err) {
      toast.error(err.message || 'Failed to create supplier');
    } finally {
      setIsCreatingSupplier(false);
    }
  };

  // Open New Purchase Modal
  const handleOpenNewPurchase = () => {
    setPurchaseForm({
      supplier_id: '',
      supplier_name: 'General / Walk-in Supplier',
      items: [
        { product_id: products[0]?._id || '', product_name: products[0]?.name || '', quantity: 1, unit_cost: products[0]?.cost_price || 0, selling_price: products[0]?.selling_price || 0, total_cost: products[0]?.cost_price || 0 }
      ],
      discount: 0,
      paid_amount: '',
      payment_method: 'cash',
      notes: '',
    });
    setIsPurchaseModalOpen(true);
  };

  // Submit Purchase
  const handleSubmitPurchase = async (e) => {
    e.preventDefault();

    const validItems = purchaseForm.items.filter((it) => it.product_id);
    if (validItems.length === 0) {
      toast.error(lang === 'bn' ? 'অনুগ্রহ করে অন্তত একটি পণ্য নির্বাচন করুন।' : 'Please select at least one product.');
      return;
    }

    setIsSubmitting(true);
    try {
      await api.purchases.create({
        supplier_id: purchaseForm.supplier_id || null,
        supplier_name: purchaseForm.supplier_name,
        items: validItems,
        discount: calculatedDiscount,
        paid_amount: calculatedPaid,
        payment_method: purchaseForm.payment_method,
        notes: purchaseForm.notes,
      });

      toast.success(lang === 'bn' ? 'পণ্য সফলভাবে ক্রয় ও স্টক যোগ হয়েছে!' : 'Purchase recorded & inventory stock updated!');
      setIsPurchaseModalOpen(false);
      fetchPurchasesData();
    } catch (err) {
      toast.error(err.message || 'Failed to record purchase');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight flex items-center gap-2.5">
            <ShoppingBag className="w-7 h-7 text-[#00df89]" />
            <span>{lang === 'bn' ? 'পণ্য ক্রয় ও স্টক ইন' : 'Purchases & Stock In'}</span>
          </h1>
          <p className="text-xs text-slate-500 dark:text-zinc-400 mt-1">
            {lang === 'bn'
              ? 'সাপ্লায়ার থেকে পণ্য ক্রয়, ইনভয়েস রেকর্ড ও ইনভেন্টরি স্টক বৃদ্ধি করুন'
              : 'Record supplier stock-in transactions, inventory purchases, and cost ledgers'}
          </p>
        </div>

        <Button
          onClick={handleOpenNewPurchase}
          className="bg-[#00df89] hover:bg-[#00c97b] text-[#011812] font-bold text-xs shadow-md shadow-[#00df89]/20 flex items-center gap-2 h-10 px-4 rounded-xl cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>{lang === 'bn' ? '+ নতুন পণ্য ক্রয় / স্টক ইন' : '+ New Purchase / Stock In'}</span>
        </Button>
      </div>

      {/* Metrics Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        <Card className="p-4 bg-white dark:bg-[#121215] border-slate-200 dark:border-zinc-800 flex items-center justify-between shadow-xs">
          <div className="space-y-1">
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
              {lang === 'bn' ? 'মোট ক্রয় ইনভয়েস' : 'Total Invoices'}
            </p>
            <p className="text-2xl font-black text-slate-900 dark:text-white">{stats.total_purchases || purchases.length}</p>
          </div>
          <div className="w-11 h-11 rounded-2xl bg-emerald-500/10 text-[#00a86b] dark:text-[#00df89] flex items-center justify-center">
            <Receipt className="w-5 h-5" />
          </div>
        </Card>

        <Card className="p-4 bg-white dark:bg-[#121215] border-slate-200 dark:border-zinc-800 flex items-center justify-between shadow-xs">
          <div className="space-y-1">
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
              {lang === 'bn' ? 'মোট ব্যয় (Spend)' : 'Total Spend'}
            </p>
            <p className="text-2xl font-black text-slate-900 dark:text-white">
              ৳{(stats.total_amount || 0).toLocaleString()}
            </p>
          </div>
          <div className="w-11 h-11 rounded-2xl bg-blue-500/10 text-blue-500 flex items-center justify-center">
            <ShoppingBag className="w-5 h-5" />
          </div>
        </Card>

        <Card className="p-4 bg-white dark:bg-[#121215] border-slate-200 dark:border-zinc-800 flex items-center justify-between shadow-xs">
          <div className="space-y-1">
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
              {lang === 'bn' ? 'পরিশোধিত অর্থ' : 'Paid Amount'}
            </p>
            <p className="text-2xl font-black text-emerald-600 dark:text-[#00df89]">
              ৳{(stats.total_paid || 0).toLocaleString()}
            </p>
          </div>
          <div className="w-11 h-11 rounded-2xl bg-emerald-500/10 text-[#00a86b] dark:text-[#00df89] flex items-center justify-center">
            <CheckCircle2 className="w-5 h-5" />
          </div>
        </Card>

        <Card className="p-4 bg-white dark:bg-[#121215] border-slate-200 dark:border-zinc-800 flex items-center justify-between shadow-xs">
          <div className="space-y-1">
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
              {lang === 'bn' ? 'মোট বাকি (Due)' : 'Outstanding Due'}
            </p>
            <p className={`text-2xl font-black ${(stats.total_due || 0) > 0 ? 'text-amber-500' : 'text-slate-900 dark:text-white'}`}>
              ৳{(stats.total_due || 0).toLocaleString()}
            </p>
          </div>
          <div className="w-11 h-11 rounded-2xl bg-amber-500/15 text-amber-500 flex items-center justify-center">
            <DollarSign className="w-5 h-5" />
          </div>
        </Card>
      </div>

      {/* Filter and Search Bar */}
      <Card className="p-3.5 bg-white dark:bg-[#121215] border-slate-200 dark:border-zinc-800 flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="relative flex-1 w-full">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder={lang === 'bn' ? 'ইনভয়েস নং, সাপ্লায়ার বা পণ্যের নাম দিয়ে খুঁজুন...' : 'Search by invoice #, supplier or product...'}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-2 bg-slate-50 dark:bg-[#09090b] border border-slate-200 dark:border-zinc-800 rounded-xl text-xs text-slate-900 dark:text-zinc-100 outline-none focus:ring-2 focus:ring-[#00df89]/30"
          />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <div className="w-full sm:w-44">
            <Select value={statusFilter} onValueChange={(val) => setStatusFilter(val)}>
              <SelectTrigger className="w-full bg-slate-50 dark:bg-[#09090b]">
                <SelectValue placeholder={lang === 'bn' ? 'সকল স্ট্যাটাস' : 'All Statuses'} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{lang === 'bn' ? 'সকল স্ট্যাটাস' : 'All Statuses'}</SelectItem>
                <SelectItem value="paid">{lang === 'bn' ? 'পরিশোধিত (Paid)' : 'Paid'}</SelectItem>
                <SelectItem value="partial">{lang === 'bn' ? 'আংশিক বাকি (Partial)' : 'Partial'}</SelectItem>
                <SelectItem value="due">{lang === 'bn' ? 'বাকি (Due)' : 'Due'}</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </Card>

      {/* Purchases Table */}
      <Card className="bg-white dark:bg-[#121215] border-slate-200 dark:border-zinc-800 overflow-hidden shadow-xs">
        {isLoading ? (
          <div className="py-16 text-center space-y-3">
            <Loader2 className="w-8 h-8 animate-spin text-[#00df89] mx-auto" />
            <p className="text-xs text-slate-400 font-medium">
              {lang === 'bn' ? 'ক্রয় তথ্য লোড হচ্ছে...' : 'Loading purchases...'}
            </p>
          </div>
        ) : filteredPurchases.length === 0 ? (
          <div className="py-16 text-center space-y-3">
            <div className="w-14 h-14 rounded-2xl bg-slate-100 dark:bg-zinc-800/80 text-slate-400 flex items-center justify-center mx-auto">
              <ShoppingBag className="w-7 h-7" />
            </div>
            <p className="text-sm font-bold text-slate-700 dark:text-zinc-300">
              {lang === 'bn' ? 'কোনো ক্রয় রেকর্ড পাওয়া যায়নি' : 'No purchase records found'}
            </p>
            <p className="text-xs text-slate-400 max-w-sm mx-auto">
              {lang === 'bn'
                ? 'সাপ্লায়ার থেকে নতুন স্টক আনতে বা ক্রয় রেকর্ড করতে "+ নতুন পণ্য ক্রয়" বাটনে চাপুন।'
                : 'Click "+ New Purchase / Stock In" to add fresh inventory from a supplier.'}
            </p>
            <div className="pt-2">
              <Button
                size="sm"
                onClick={handleOpenNewPurchase}
                className="bg-[#00df89] hover:bg-[#00c97b] text-[#011812] font-semibold text-xs h-9 px-4 rounded-xl cursor-pointer"
              >
                <Plus className="w-4 h-4 mr-1" />
                <span>{lang === 'bn' ? 'প্রথম স্টক ইন করুন' : 'Record First Purchase'}</span>
              </Button>
            </div>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-600 dark:text-zinc-300">
              <thead className="bg-slate-50 dark:bg-zinc-900/60 border-b border-slate-200 dark:border-zinc-800 text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                <tr>
                  <th className="py-3.5 px-4">{lang === 'bn' ? 'ইনভয়েস ও তারিখ' : 'Invoice & Date'}</th>
                  <th className="py-3.5 px-4">{lang === 'bn' ? 'সাপ্লায়ার' : 'Supplier'}</th>
                  <th className="py-3.5 px-4">{lang === 'bn' ? 'পণ্যসমূহ' : 'Items'}</th>
                  <th className="py-3.5 px-4">{lang === 'bn' ? 'মোট বিল' : 'Total Cost'}</th>
                  <th className="py-3.5 px-4">{lang === 'bn' ? 'পরিশোধ / বাকি' : 'Paid / Due'}</th>
                  <th className="py-3.5 px-4">{lang === 'bn' ? 'পেমেন্ট মাধ্যম' : 'Payment'}</th>
                  <th className="py-3.5 px-4">{lang === 'bn' ? 'স্ট্যাটাস' : 'Status'}</th>
                  <th className="py-3.5 px-4 text-right">{lang === 'bn' ? 'ইনভয়েস' : 'View'}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-zinc-800/80">
                {filteredPurchases.map((p) => (
                  <tr key={p._id} className="hover:bg-slate-50/60 dark:hover:bg-zinc-800/40 transition-colors">
                    <td className="py-3.5 px-4">
                      <div className="space-y-0.5">
                        <p className="font-mono font-bold text-slate-900 dark:text-white">
                          #{p.purchase_number}
                        </p>
                        <p className="text-[11px] text-slate-400 flex items-center gap-1">
                          <Calendar className="w-3 h-3" />
                          {new Date(p.created_at).toLocaleDateString()}
                        </p>
                      </div>
                    </td>

                    <td className="py-3.5 px-4">
                      <div className="flex items-center gap-2">
                        <div className="w-7 h-7 rounded-lg bg-emerald-500/10 text-emerald-600 font-bold flex items-center justify-center text-xs shrink-0">
                          <Building2 className="w-3.5 h-3.5" />
                        </div>
                        <div>
                          <p className="font-bold text-slate-900 dark:text-white">{p.supplier_name}</p>
                          {p.supplier_phone && (
                            <p className="text-[11px] text-slate-400 font-mono">{p.supplier_phone}</p>
                          )}
                        </div>
                      </div>
                    </td>

                    <td className="py-3.5 px-4">
                      <div className="max-w-xs truncate text-[11px] text-slate-700 dark:text-zinc-300">
                        {p.items?.map((it) => `${it.product_name} (${it.quantity})`).join(', ') || '-'}
                      </div>
                    </td>

                    <td className="py-3.5 px-4 font-bold text-slate-900 dark:text-white font-mono">
                      ৳{(p.net_amount || p.total_amount || 0).toLocaleString()}
                    </td>

                    <td className="py-3.5 px-4 font-mono text-[11px]">
                      <span className="text-slate-500">৳{(p.paid_amount || 0).toLocaleString()}</span>
                      {(p.due_amount || 0) > 0 && (
                        <span className="text-amber-500 font-bold block">
                          Due: ৳{(p.due_amount).toLocaleString()}
                        </span>
                      )}
                    </td>

                    <td className="py-3.5 px-4">
                      <span className="px-2 py-0.5 rounded-md bg-slate-100 dark:bg-zinc-800 font-bold text-[10px] uppercase text-slate-600 dark:text-zinc-300">
                        {p.payment_method}
                      </span>
                    </td>

                    <td className="py-3.5 px-4">
                      <span
                        className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full font-bold text-[10px] uppercase ${
                          p.payment_status === 'paid'
                            ? 'bg-emerald-500/10 text-[#00a86b] dark:text-[#00df89]'
                            : p.payment_status === 'partial'
                            ? 'bg-blue-500/10 text-blue-600'
                            : 'bg-amber-500/15 text-amber-500'
                        }`}
                      >
                        {p.payment_status}
                      </span>
                    </td>

                    <td className="py-3.5 px-4 text-right">
                      <button
                        onClick={() => setSelectedInvoice(p)}
                        className="p-1.5 rounded-lg text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-950/40 transition-colors cursor-pointer"
                        title={lang === 'bn' ? 'ইনভয়েস ভিউ' : 'View Invoice'}
                      >
                        <Eye className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      {/* New Purchase / Stock In Modal */}
      {isPurchaseModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs animate-in fade-in duration-150">
          <Card className="max-w-2xl w-full p-6 bg-white dark:bg-[#121215] border-slate-200 dark:border-zinc-800 space-y-4 shadow-2xl max-h-[90vh] flex flex-col">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-zinc-800 pb-3 shrink-0">
              <h2 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <ShoppingBag className="w-5 h-5 text-[#00df89]" />
                <span>{lang === 'bn' ? 'নতুন পণ্য ক্রয় ও স্টক ইন' : 'New Purchase / Stock In'}</span>
              </h2>
              <button
                type="button"
                onClick={() => setIsPurchaseModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 p-1 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmitPurchase} className="flex-1 overflow-y-auto space-y-4 pr-1 text-xs">
              
              {/* Supplier Selection with Inline Supplier Creator */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="font-bold text-slate-700 dark:text-zinc-300">
                    {lang === 'bn' ? 'সাপ্লায়ার নির্বাচন' : 'Supplier'}
                  </label>
                  <button
                    type="button"
                    onClick={() => setShowInlineSupplier(!showInlineSupplier)}
                    className="text-[11px] font-semibold text-[#00a86b] dark:text-[#00df89] hover:underline flex items-center gap-1 cursor-pointer"
                  >
                    <Plus className="w-3 h-3" />
                    <span>{showInlineSupplier ? (lang === 'bn' ? 'তালিকা থেকে বেছে নিন' : 'Choose existing') : (lang === 'bn' ? '+ নতুন সাপ্লায়ার' : '+ Add New Supplier')}</span>
                  </button>
                </div>

                {showInlineSupplier ? (
                  <div className="p-3 rounded-2xl bg-emerald-500/5 border border-emerald-500/20 space-y-2">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      <input
                        type="text"
                        placeholder={lang === 'bn' ? 'সাপ্লায়ারের নাম *' : 'Supplier Name *'}
                        value={newSupplierName}
                        onChange={(e) => setNewSupplierName(e.target.value)}
                        className="px-3 py-1.5 rounded-lg bg-white dark:bg-[#09090b] border border-slate-200 dark:border-zinc-800 text-xs text-slate-900 dark:text-white outline-none focus:ring-1 focus:ring-[#00df89]"
                      />
                      <input
                        type="text"
                        placeholder={lang === 'bn' ? 'মোবাইল নম্বর' : 'Phone Number'}
                        value={newSupplierPhone}
                        onChange={(e) => setNewSupplierPhone(e.target.value)}
                        className="px-3 py-1.5 rounded-lg bg-white dark:bg-[#09090b] border border-slate-200 dark:border-zinc-800 text-xs text-slate-900 dark:text-white outline-none focus:ring-1 focus:ring-[#00df89]"
                      />
                    </div>
                    <div className="flex justify-end">
                      <Button
                        type="button"
                        size="sm"
                        disabled={isCreatingSupplier || !newSupplierName.trim()}
                        onClick={handleCreateSupplierInline}
                        className="bg-[#00df89] hover:bg-[#00c97b] text-[#011812] font-semibold text-xs h-8 px-3"
                      >
                        {isCreatingSupplier ? <Loader2 className="w-3 h-3 animate-spin" /> : (lang === 'bn' ? 'সেভ ও সিলেক্ট' : 'Save & Select')}
                      </Button>
                    </div>
                  </div>
                ) : (
                  <Select
                    value={purchaseForm.supplier_id || '__walk_in__'}
                    onValueChange={(val) => {
                      if (val === '__walk_in__') {
                        setPurchaseForm({ ...purchaseForm, supplier_id: '', supplier_name: 'General / Walk-in Supplier' });
                      } else {
                        const found = suppliers.find((s) => s._id === val);
                        setPurchaseForm({
                          ...purchaseForm,
                          supplier_id: val,
                          supplier_name: found ? found.name : '',
                        });
                      }
                    }}
                  >
                    <SelectTrigger className="w-full bg-slate-50 dark:bg-[#09090b]">
                      <SelectValue placeholder="General / Walk-in Supplier" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="__walk_in__">General / Walk-in Supplier</SelectItem>
                      {suppliers.map((s) => (
                        <SelectItem key={s._id} value={s._id}>
                          {s.name} {s.company_name ? `(${s.company_name})` : ''} {s.phone ? `— ${s.phone}` : ''}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              </div>

              {/* Items Table */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="font-bold text-slate-700 dark:text-zinc-300">
                    {lang === 'bn' ? 'ক্রয়কৃত পণ্যের তালিকা *' : 'Purchased Products *'}
                  </label>
                  <button
                    type="button"
                    onClick={handleAddItemRow}
                    className="text-[11px] font-semibold text-[#00a86b] dark:text-[#00df89] hover:underline flex items-center gap-1 cursor-pointer"
                  >
                    <PlusCircle className="w-3.5 h-3.5" />
                    <span>{lang === 'bn' ? '+ আরেকটি পণ্য যোগ করুন' : '+ Add Item Row'}</span>
                  </button>
                </div>

                <div className="space-y-2">
                  {purchaseForm.items.map((item, idx) => (
                    <div
                      key={idx}
                      className="p-3 rounded-2xl bg-slate-50 dark:bg-zinc-900/60 border border-slate-200/80 dark:border-zinc-800/80 grid grid-cols-12 gap-2 items-center"
                    >
                      {/* Product Selector */}
                      <div className="col-span-12 sm:col-span-5">
                        <label className="block text-[10px] font-bold text-slate-400 mb-0.5">
                          {lang === 'bn' ? 'পণ্য' : 'Product'}
                        </label>
                        <Select
                          value={item.product_id || '__none__'}
                          onValueChange={(val) => handleItemChange(idx, 'product_id', val === '__none__' ? '' : val)}
                        >
                          <SelectTrigger className="w-full h-8 text-xs bg-white dark:bg-[#09090b]">
                            <SelectValue placeholder={lang === 'bn' ? 'পণ্য বেছে নিন...' : 'Select product...'} />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="__none__">{lang === 'bn' ? 'পণ্য বেছে নিন...' : 'Select product...'}</SelectItem>
                            {products.map((prod) => (
                              <SelectItem key={prod._id} value={prod._id}>
                                {prod.name} (Stock: {prod.stock_quantity || 0})
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>

                      {/* Quantity */}
                      <div className="col-span-4 sm:col-span-2">
                        <label className="block text-[10px] font-bold text-slate-400 mb-0.5">
                          {lang === 'bn' ? 'পরিমাণ' : 'Qty'}
                        </label>
                        <input
                          type="number"
                          min="1"
                          required
                          value={item.quantity}
                          onChange={(e) => handleItemChange(idx, 'quantity', e.target.value)}
                          className="w-full px-2.5 py-1 h-8 rounded-lg bg-white dark:bg-[#09090b] border border-slate-200 dark:border-zinc-800 text-xs text-slate-900 dark:text-white outline-none focus:ring-1 focus:ring-[#00df89]"
                        />
                      </div>

                      {/* Unit Cost */}
                      <div className="col-span-4 sm:col-span-2">
                        <label className="block text-[10px] font-bold text-slate-400 mb-0.5">
                          {lang === 'bn' ? 'ক্রয়মূল্য (৳)' : 'Unit Cost (৳)'}
                        </label>
                        <input
                          type="number"
                          min="0"
                          step="any"
                          required
                          value={item.unit_cost}
                          onChange={(e) => handleItemChange(idx, 'unit_cost', e.target.value)}
                          className="w-full px-2.5 py-1 h-8 rounded-lg bg-white dark:bg-[#09090b] border border-slate-200 dark:border-zinc-800 text-xs text-slate-900 dark:text-white outline-none focus:ring-1 focus:ring-[#00df89]"
                        />
                      </div>

                      {/* Total */}
                      <div className="col-span-3 sm:col-span-2">
                        <label className="block text-[10px] font-bold text-slate-400 mb-0.5">
                          {lang === 'bn' ? 'মোট' : 'Total'}
                        </label>
                        <div className="h-8 flex items-center font-bold text-slate-900 dark:text-white font-mono text-xs">
                          ৳{(item.total_cost || 0).toLocaleString()}
                        </div>
                      </div>

                      {/* Delete Row */}
                      <div className="col-span-1 flex items-center justify-end pt-3 sm:pt-0">
                        {purchaseForm.items.length > 1 && (
                          <button
                            type="button"
                            onClick={() => handleRemoveItemRow(idx)}
                            className="text-slate-400 hover:text-rose-500 p-1 cursor-pointer"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Totals & Payment Breakdown */}
              <div className="p-4 rounded-2xl bg-slate-50 dark:bg-zinc-900/60 border border-slate-200/80 dark:border-zinc-800/80 space-y-3">
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="block font-bold text-slate-700 dark:text-zinc-300 mb-1">
                      {lang === 'bn' ? 'ছাড় / ডিসকাউন্ট (৳)' : 'Discount (৳)'}
                    </label>
                    <input
                      type="number"
                      min="0"
                      value={purchaseForm.discount}
                      onChange={(e) => setPurchaseForm({ ...purchaseForm, discount: e.target.value })}
                      className="w-full px-3 py-1.5 rounded-xl bg-white dark:bg-[#09090b] border border-slate-200 dark:border-zinc-800 text-xs text-slate-900 dark:text-white outline-none"
                    />
                  </div>

                  <div>
                    <label className="block font-bold text-slate-700 dark:text-zinc-300 mb-1">
                      {lang === 'bn' ? 'পরিশোধিত অর্থ (৳)' : 'Paid Amount (৳)'}
                    </label>
                    <input
                      type="number"
                      min="0"
                      placeholder={`৳${calculatedNet}`}
                      value={purchaseForm.paid_amount}
                      onChange={(e) => setPurchaseForm({ ...purchaseForm, paid_amount: e.target.value })}
                      className="w-full px-3 py-1.5 rounded-xl bg-white dark:bg-[#09090b] border border-slate-200 dark:border-zinc-800 text-xs text-slate-900 dark:text-white outline-none"
                    />
                  </div>

                  <div>
                    <label className="block font-bold text-slate-700 dark:text-zinc-300 mb-1">
                      {lang === 'bn' ? 'পেমেন্ট মাধ্যম' : 'Payment Method'}
                    </label>
                    <Select
                      value={purchaseForm.payment_method}
                      onValueChange={(val) => setPurchaseForm({ ...purchaseForm, payment_method: val })}
                    >
                      <SelectTrigger className="w-full bg-white dark:bg-[#09090b]">
                        <SelectValue placeholder="Cash" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="cash">{lang === 'bn' ? 'নগদ (Cash)' : 'Cash'}</SelectItem>
                        <SelectItem value="bkash">bKash</SelectItem>
                        <SelectItem value="nagad">Nagad</SelectItem>
                        <SelectItem value="rocket">Rocket</SelectItem>
                        <SelectItem value="card">{lang === 'bn' ? 'কার্ড (Card)' : 'Card'}</SelectItem>
                        <SelectItem value="bank_transfer">{lang === 'bn' ? 'ব্যাংক ট্রান্সফার' : 'Bank Transfer'}</SelectItem>
                        <SelectItem value="due">{lang === 'bn' ? 'সম্পূর্ণ বাকি (Due)' : 'Full Due'}</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="flex items-center justify-between pt-2 border-t border-slate-200 dark:border-zinc-800 text-xs font-bold">
                  <div className="space-y-0.5">
                    <span className="text-slate-500">{lang === 'bn' ? 'সর্বমোট বিল:' : 'Total Amount:'} ৳{calculatedTotal.toLocaleString()}</span>
                    {calculatedDue > 0 && (
                      <span className="text-amber-500 block">
                        {lang === 'bn' ? 'সাপ্লায়ার বাকি থাকবে:' : 'Due Balance:'} ৳{calculatedDue.toLocaleString()}
                      </span>
                    )}
                  </div>
                  <div className="text-right">
                    <span className="text-sm font-black text-slate-900 dark:text-white font-mono">
                      {lang === 'bn' ? 'নিট বিল:' : 'Net Bill:'} ৳{calculatedNet.toLocaleString()}
                    </span>
                  </div>
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 dark:text-zinc-300 mb-1">
                  {lang === 'bn' ? 'মন্তব্য বা অতিরিক্ত নোট' : 'Notes / Remarks'}
                </label>
                <textarea
                  rows="2"
                  placeholder={lang === 'bn' ? 'ক্রয় সংক্রান্ত কোনো মন্তব্য...' : 'Any optional remarks...'}
                  value={purchaseForm.notes}
                  onChange={(e) => setPurchaseForm({ ...purchaseForm, notes: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-[#09090b] border border-slate-200 dark:border-zinc-800 text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-[#00df89]"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100 dark:border-zinc-800 shrink-0">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setIsPurchaseModalOpen(false)}
                  className="h-9 px-4 rounded-xl cursor-pointer"
                >
                  {lang === 'bn' ? 'বাতিল' : 'Cancel'}
                </Button>
                <Button
                  type="submit"
                  disabled={isSubmitting}
                  className="bg-[#00df89] hover:bg-[#00c97b] text-[#011812] font-bold text-xs h-9 px-4 rounded-xl cursor-pointer disabled:opacity-50"
                >
                  {isSubmitting ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    (lang === 'bn' ? 'ক্রয় রেকর্ড ও স্টক ইন' : 'Save Purchase & Stock In')
                  )}
                </Button>
              </div>
            </form>
          </Card>
        </div>
      )}

      {/* Invoice Details Modal */}
      {selectedInvoice && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs animate-in fade-in duration-150">
          <Card className="max-w-lg w-full p-6 bg-white dark:bg-[#121215] border-slate-200 dark:border-zinc-800 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-zinc-800 pb-3">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-emerald-500/10 text-emerald-600 flex items-center justify-center">
                  <Receipt className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-base font-bold text-slate-900 dark:text-white">
                    {lang === 'bn' ? 'ক্রয় ইনভয়েস বিবরণ' : 'Purchase Invoice Details'}
                  </h2>
                  <p className="text-[11px] font-mono text-slate-400 font-bold">
                    #{selectedInvoice.purchase_number}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setSelectedInvoice(null)}
                className="text-slate-400 hover:text-slate-600 p-1 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div className="p-3 rounded-2xl bg-slate-50 dark:bg-zinc-900/60 border border-slate-200/80 dark:border-zinc-800/80 flex items-center justify-between">
                <div>
                  <p className="font-bold text-slate-900 dark:text-white">{selectedInvoice.supplier_name}</p>
                  {selectedInvoice.supplier_phone && (
                    <p className="text-[11px] text-slate-400 font-mono">{selectedInvoice.supplier_phone}</p>
                  )}
                </div>
                <div className="text-right">
                  <span className="text-[11px] text-slate-400 block">
                    {new Date(selectedInvoice.created_at).toLocaleDateString()}
                  </span>
                  <span
                    className={`px-2 py-0.5 rounded-full font-bold text-[10px] uppercase ${
                      selectedInvoice.payment_status === 'paid'
                        ? 'bg-emerald-500/10 text-emerald-600'
                        : selectedInvoice.payment_status === 'partial'
                        ? 'bg-blue-500/10 text-blue-600'
                        : 'bg-amber-500/15 text-amber-500'
                    }`}
                  >
                    {selectedInvoice.payment_status}
                  </span>
                </div>
              </div>

              {/* Items List */}
              <div className="space-y-1.5">
                <p className="font-bold text-slate-700 dark:text-zinc-300">
                  {lang === 'bn' ? 'পণ্য বিবরণী' : 'Item Breakdown'}
                </p>
                <div className="divide-y divide-slate-100 dark:divide-zinc-800 border border-slate-200/80 dark:border-zinc-800 rounded-2xl p-2.5 bg-white dark:bg-[#09090b]">
                  {selectedInvoice.items?.map((it, idx) => (
                    <div key={idx} className="py-2 flex items-center justify-between text-xs">
                      <div>
                        <p className="font-bold text-slate-900 dark:text-white">{it.product_name}</p>
                        <p className="text-[11px] text-slate-400">
                          {it.quantity} &times; ৳{(it.unit_cost || 0).toLocaleString()}
                        </p>
                      </div>
                      <p className="font-bold font-mono text-slate-900 dark:text-white">
                        ৳{(it.total_cost || 0).toLocaleString()}
                      </p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Totals Breakdown */}
              <div className="p-3 rounded-2xl bg-slate-50 dark:bg-zinc-900/60 border border-slate-200/80 dark:border-zinc-800/80 space-y-1.5 text-xs">
                <div className="flex justify-between text-slate-500">
                  <span>{lang === 'bn' ? 'মোট বিল:' : 'Total Amount:'}</span>
                  <span className="font-mono">৳{(selectedInvoice.total_amount || 0).toLocaleString()}</span>
                </div>
                {selectedInvoice.discount > 0 && (
                  <div className="flex justify-between text-slate-500">
                    <span>{lang === 'bn' ? 'ডিসকাউন্ট:' : 'Discount:'}</span>
                    <span className="font-mono">-৳{(selectedInvoice.discount || 0).toLocaleString()}</span>
                  </div>
                )}
                <div className="flex justify-between font-bold text-slate-900 dark:text-white pt-1 border-t border-slate-200 dark:border-zinc-800">
                  <span>{lang === 'bn' ? 'নিট বিল:' : 'Net Bill:'}</span>
                  <span className="font-mono text-sm">৳{(selectedInvoice.net_amount || 0).toLocaleString()}</span>
                </div>
                <div className="flex justify-between text-emerald-600 font-medium pt-1">
                  <span>{lang === 'bn' ? 'পরিশোধ:' : 'Paid:'}</span>
                  <span className="font-mono">৳{(selectedInvoice.paid_amount || 0).toLocaleString()}</span>
                </div>
                {(selectedInvoice.due_amount || 0) > 0 && (
                  <div className="flex justify-between text-amber-500 font-bold">
                    <span>{lang === 'bn' ? 'বাকি ব্যালেন্স:' : 'Due Balance:'}</span>
                    <span className="font-mono">৳{(selectedInvoice.due_amount).toLocaleString()}</span>
                  </div>
                )}
              </div>
            </div>

            <div className="pt-2 flex justify-end">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setSelectedInvoice(null)}
                className="h-9 px-4 rounded-xl cursor-pointer"
              >
                {lang === 'bn' ? 'বন্ধ করুন' : 'Close'}
              </Button>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
}
