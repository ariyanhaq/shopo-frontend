/**
 * @file Purchases.jsx
 * @description Purchases & Stock-In Ledger for tracking product acquisitions, vendor invoices, payment status, editing, deletion with stock reversal, and receipt printing.
 */
import { useState, useEffect, useMemo, useRef } from 'react';
import { useLanguage } from '@/context/LanguageContext';
import { useShop } from '@/context/ShopContext';
import { useAuth } from '@/context/AuthContext';
import { api } from '@/services/api';
import {
  ShoppingBag, Plus, Search, Calendar, DollarSign,
  Receipt, CheckCircle2, AlertCircle, Loader2, X,
  Building2, ArrowUpDown, ChevronRight, Filter, Eye,
  Printer, CreditCard, Trash2, PlusCircle, Edit2
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
import ConfirmDialog from '@/components/common/ConfirmDialog';
import toast from 'react-hot-toast';

export default function Purchases() {
  const { lang } = useLanguage();
  const { activeShop } = useShop();
  const { mongoShop } = useAuth();

  const currentShopName = mongoShop?.name || activeShop?.name || 'Shopo Store';
  const currentShopPhone = mongoShop?.phone || activeShop?.phone || '';
  const currentShopAddress = mongoShop?.address || activeShop?.address || '';

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
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingPurchase, setEditingPurchase] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedInvoice, setSelectedInvoice] = useState(null);

  // Delete State
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Print Invoice State
  const [printInvoiceData, setPrintInvoiceData] = useState(null);

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

  // Edit Purchase Form State
  const [editForm, setEditForm] = useState({
    supplier_id: '',
    supplier_name: 'General / Walk-in Supplier',
    items: [],
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

  // Handle Form Item Changes (Create)
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

  // Add Item Row (Create)
  const handleAddItemRow = () => {
    setPurchaseForm((prev) => ({
      ...prev,
      items: [
        ...prev.items,
        { product_id: '', product_name: '', quantity: 1, unit_cost: 0, selling_price: 0, total_cost: 0 }
      ]
    }));
  };

  // Remove Item Row (Create)
  const handleRemoveItemRow = (index) => {
    if (purchaseForm.items.length <= 1) return;
    setPurchaseForm((prev) => ({
      ...prev,
      items: prev.items.filter((_, i) => i !== index),
    }));
  };

  // Calculations (Create)
  const calculatedTotal = purchaseForm.items.reduce((acc, it) => acc + (Number(it.total_cost) || 0), 0);
  const calculatedDiscount = Number(purchaseForm.discount) || 0;
  const calculatedNet = Math.max(0, calculatedTotal - calculatedDiscount);
  const calculatedPaid = purchaseForm.paid_amount !== '' ? Number(purchaseForm.paid_amount) : calculatedNet;
  const calculatedDue = Math.max(0, calculatedNet - calculatedPaid);

  // Handle Form Item Changes (Edit)
  const handleEditItemChange = (index, field, value) => {
    const updated = [...editForm.items];
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
    setEditForm((prev) => ({ ...prev, items: updated }));
  };

  // Add Item Row (Edit)
  const handleAddEditItemRow = () => {
    setEditForm((prev) => ({
      ...prev,
      items: [
        ...prev.items,
        { product_id: '', product_name: '', quantity: 1, unit_cost: 0, selling_price: 0, total_cost: 0 }
      ]
    }));
  };

  // Remove Item Row (Edit)
  const handleRemoveEditItemRow = (index) => {
    if (editForm.items.length <= 1) return;
    setEditForm((prev) => ({
      ...prev,
      items: prev.items.filter((_, i) => i !== index),
    }));
  };

  // Calculations (Edit)
  const editCalculatedTotal = editForm.items.reduce((acc, it) => acc + (Number(it.total_cost) || 0), 0);
  const editCalculatedDiscount = Number(editForm.discount) || 0;
  const editCalculatedNet = Math.max(0, editCalculatedTotal - editCalculatedDiscount);
  const editCalculatedPaid = editForm.paid_amount !== '' ? Number(editForm.paid_amount) : editCalculatedNet;
  const editCalculatedDue = Math.max(0, editCalculatedNet - editCalculatedPaid);

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
        setEditForm((prev) => ({
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

  // Handle Inline Supplier Deletion
  const handleDeleteSupplier = async (suppId, suppName) => {
    try {
      await api.suppliers.delete(suppId);
      setSuppliers((prev) => prev.filter((s) => s._id !== suppId));
      if (purchaseForm.supplier_id === suppId) {
        setPurchaseForm((prev) => ({ ...prev, supplier_id: '', supplier_name: 'General / Walk-in Supplier' }));
      }
      if (editForm.supplier_id === suppId) {
        setEditForm((prev) => ({ ...prev, supplier_id: '', supplier_name: 'General / Walk-in Supplier' }));
      }
      toast.success(lang === 'bn' ? `সাপ্লায়ার '${suppName}' মুছে ফেলা হয়েছে!` : `Supplier '${suppName}' deleted!`);
    } catch (err) {
      toast.error(err.message || 'Failed to delete supplier');
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

  // Open Edit Modal
  const handleOpenEdit = (purchase) => {
    setEditingPurchase(purchase);
    setEditForm({
      supplier_id: purchase.supplier_id?._id || purchase.supplier_id || '',
      supplier_name: purchase.supplier_name || 'General / Walk-in Supplier',
      items: (purchase.items || []).map((it) => ({
        product_id: it.product_id?._id || it.product_id || '',
        product_name: it.product_name || '',
        quantity: it.quantity || 1,
        unit_cost: it.unit_cost || 0,
        selling_price: it.selling_price || 0,
        total_cost: it.total_cost || (it.quantity * it.unit_cost),
      })),
      discount: purchase.discount || 0,
      paid_amount: purchase.paid_amount !== undefined ? purchase.paid_amount : '',
      payment_method: purchase.payment_method || 'cash',
      notes: purchase.notes || '',
    });
    setIsEditModalOpen(true);
  };

  // Submit New Purchase
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

  // Submit Edit Purchase
  const handleSubmitEdit = async (e) => {
    e.preventDefault();
    if (!editingPurchase?._id) return;

    const validItems = editForm.items.filter((it) => it.product_id);
    if (validItems.length === 0) {
      toast.error(lang === 'bn' ? 'অনুগ্রহ করে অন্তত একটি পণ্য নির্বাচন করুন।' : 'Please select at least one product.');
      return;
    }

    setIsSubmitting(true);
    try {
      await api.purchases.update(editingPurchase._id, {
        supplier_id: editForm.supplier_id || null,
        supplier_name: editForm.supplier_name,
        items: validItems,
        discount: editCalculatedDiscount,
        paid_amount: editCalculatedPaid,
        payment_method: editForm.payment_method,
        notes: editForm.notes,
      });

      toast.success(lang === 'bn' ? 'ক্রয় ইনভয়েস সফলভাবে আপডেট হয়েছে!' : 'Purchase invoice updated successfully!');
      setIsEditModalOpen(false);
      setEditingPurchase(null);
      fetchPurchasesData();
    } catch (err) {
      toast.error(err.message || 'Failed to update purchase invoice');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Submit Delete Purchase
  const handleConfirmDelete = async () => {
    if (!deleteTarget?._id) return;
    setIsDeleting(true);
    try {
      await api.purchases.delete(deleteTarget._id);
      toast.success(
        lang === 'bn'
          ? `ইনভয়েস #${deleteTarget.purchase_number} মুছে ফেলা হয়েছে এবং স্টক সমন্বয় করা হয়েছে!`
          : `Purchase invoice #${deleteTarget.purchase_number} deleted & stock reversed!`
      );
      setDeleteTarget(null);
      fetchPurchasesData();
    } catch (err) {
      toast.error(err.message || 'Failed to delete purchase invoice');
    } finally {
      setIsDeleting(false);
    }
  };

  // Trigger Print Receipt
  const handlePrintReceipt = (purchase) => {
    setPrintInvoiceData(purchase);
    setTimeout(() => {
      window.print();
    }, 250);
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
              ? 'সাপ্লায়ার থেকে পণ্য ক্রয়, ইনভয়েস রেকর্ড, সম্পাদনা, মুছে ফেলা ও প্রিন্ট রসিদ'
              : 'Record supplier stock-in transactions, inventory purchases, edit, delete & print receipts'}
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
              {lang === 'bn' ? 'বকেয়া / পাওনা বাকি' : 'Total Due'}
            </p>
            <p className="text-2xl font-black text-amber-500">
              ৳{(stats.total_due || 0).toLocaleString()}
            </p>
          </div>
          <div className="w-11 h-11 rounded-2xl bg-amber-500/10 text-amber-500 flex items-center justify-center">
            <AlertCircle className="w-5 h-5" />
          </div>
        </Card>
      </div>

      {/* Filter & Search Bar */}
      <Card className="p-4 bg-white dark:bg-[#121215] border-slate-200 dark:border-zinc-800 shadow-xs">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="relative w-full sm:w-80">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder={lang === 'bn' ? 'ইনভয়েস নং, সাপ্লায়ার বা পণ্যের নাম খুঁজুন...' : 'Search invoice, supplier, item...'}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-2 rounded-xl bg-slate-50 dark:bg-[#09090b] border border-slate-200 dark:border-zinc-800 text-xs text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-[#00df89]"
            />
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto">
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-full sm:w-44 bg-slate-50 dark:bg-[#09090b]">
                <SelectValue placeholder="All Statuses" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{lang === 'bn' ? 'সব স্ট্যাটাস' : 'All Statuses'}</SelectItem>
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
                  <th className="py-3.5 px-4 text-right">{lang === 'bn' ? 'অ্যাকশন' : 'Actions'}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-zinc-800/80">
                {filteredPurchases.map((p) => (
                  <tr key={p._id} className="hover:bg-slate-50/60 dark:hover:bg-zinc-800/40 transition-colors">
                    <td className="py-3.5 px-4">
                      <div className="font-bold text-slate-900 dark:text-white font-mono text-[13px]">
                        #{p.purchase_number}
                      </div>
                      <div className="text-[11px] text-slate-400">
                        {new Date(p.created_at).toLocaleDateString()} &middot; {new Date(p.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </div>
                    </td>
                    <td className="py-3.5 px-4">
                      <div className="font-bold text-slate-900 dark:text-white">{p.supplier_name || 'General'}</div>
                      {p.supplier_phone && (
                        <div className="text-[11px] text-slate-400 font-mono">{p.supplier_phone}</div>
                      )}
                    </td>
                    <td className="py-3.5 px-4">
                      <div className="font-medium text-slate-800 dark:text-zinc-200">
                        {p.items?.length === 1
                          ? `${p.items[0].product_name} (${p.items[0].quantity} pcs)`
                          : `${p.items?.[0]?.product_name || 'Item'} + ${p.items?.length - 1} more`}
                      </div>
                      <div className="text-[10px] text-slate-400">
                        Total {p.items?.reduce((acc, it) => acc + (it.quantity || 0), 0)} units
                      </div>
                    </td>
                    <td className="py-3.5 px-4 font-bold font-mono text-slate-900 dark:text-white">
                      ৳{(p.net_amount || p.total_amount || 0).toLocaleString()}
                    </td>
                    <td className="py-3.5 px-4">
                      <div className="text-emerald-600 dark:text-[#00df89] font-medium font-mono">
                        ৳{(p.paid_amount || 0).toLocaleString()}
                      </div>
                      {(p.due_amount || 0) > 0 && (
                        <div className="text-amber-500 font-bold font-mono text-[11px]">
                          Due: ৳{(p.due_amount).toLocaleString()}
                        </div>
                      )}
                    </td>
                    <td className="py-3.5 px-4">
                      <span className="capitalize px-2 py-0.5 rounded-md bg-slate-100 dark:bg-zinc-800 font-medium text-[11px]">
                        {p.payment_method || 'cash'}
                      </span>
                    </td>
                    <td className="py-3.5 px-4">
                      <span
                        className={`inline-flex items-center px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                          p.payment_status === 'paid'
                            ? 'bg-emerald-500/10 text-emerald-600 dark:text-[#00df89]'
                            : p.payment_status === 'partial'
                            ? 'bg-blue-500/10 text-blue-600'
                            : 'bg-amber-500/15 text-amber-500'
                        }`}
                      >
                        {p.payment_status}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        {/* View Details */}
                        <button
                          type="button"
                          onClick={() => setSelectedInvoice(p)}
                          title={lang === 'bn' ? 'বিস্তারিত দেখুন' : 'View details'}
                          className="w-8 h-8 rounded-lg bg-slate-100 dark:bg-zinc-800 hover:bg-slate-200 dark:hover:bg-zinc-700 text-slate-600 dark:text-zinc-300 flex items-center justify-center transition-colors cursor-pointer"
                        >
                          <Eye className="w-3.5 h-3.5" />
                        </button>

                        {/* Edit Purchase */}
                        <button
                          type="button"
                          onClick={() => handleOpenEdit(p)}
                          title={lang === 'bn' ? 'সম্পাদনা করুন' : 'Edit purchase'}
                          className="w-8 h-8 rounded-lg bg-blue-50 dark:bg-blue-950/40 hover:bg-blue-100 dark:hover:bg-blue-900/60 text-blue-600 dark:text-blue-400 flex items-center justify-center transition-colors cursor-pointer"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>

                        {/* Print Receipt */}
                        <button
                          type="button"
                          onClick={() => handlePrintReceipt(p)}
                          title={lang === 'bn' ? 'রসিদ প্রিন্ট করুন' : 'Print receipt'}
                          className="w-8 h-8 rounded-lg bg-emerald-50 dark:bg-emerald-950/40 hover:bg-emerald-100 dark:hover:bg-emerald-900/60 text-[#00a86b] dark:text-[#00df89] flex items-center justify-center transition-colors cursor-pointer"
                        >
                          <Printer className="w-3.5 h-3.5" />
                        </button>

                        {/* Delete Purchase */}
                        <button
                          type="button"
                          onClick={() => setDeleteTarget(p)}
                          title={lang === 'bn' ? 'মুছে ফেলুন' : 'Delete purchase'}
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

      {/* ---------------------------------------------------- */}
      {/* NEW PURCHASE / STOCK IN MODAL                        */}
      {/* ---------------------------------------------------- */}
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
                        className="px-3 py-1.5 rounded-lg bg-white dark:bg-[#09090b] border border-slate-200 dark:border-zinc-800 text-xs text-slate-900 dark:text-white outline-none"
                      />
                      <input
                        type="text"
                        placeholder={lang === 'bn' ? 'ফোন নম্বর' : 'Phone Number'}
                        value={newSupplierPhone}
                        onChange={(e) => setNewSupplierPhone(e.target.value)}
                        className="px-3 py-1.5 rounded-lg bg-white dark:bg-[#09090b] border border-slate-200 dark:border-zinc-800 text-xs text-slate-900 dark:text-white outline-none"
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
                        <SelectItem
                          key={s._id}
                          value={s._id}
                          onDelete={() => handleDeleteSupplier(s._id, s.name)}
                          deleteTitle={lang === 'bn' ? 'সাপ্লায়ার মুছুন' : 'Delete supplier'}
                        >
                          {s.name} {s.company_name ? `(${s.company_name})` : ''}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              </div>

              {/* Items Section */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="font-bold text-slate-700 dark:text-zinc-300">
                    {lang === 'bn' ? 'ক্রয়কৃত পণ্যসমূহ *' : 'Purchase Line Items *'}
                  </label>
                  <button
                    type="button"
                    onClick={handleAddItemRow}
                    className="text-[11px] font-semibold text-[#00a86b] dark:text-[#00df89] hover:underline flex items-center gap-1 cursor-pointer"
                  >
                    <PlusCircle className="w-3.5 h-3.5" />
                    <span>{lang === 'bn' ? '+ আরো পণ্য যোগ করুন' : '+ Add Item Line'}</span>
                  </button>
                </div>

                <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
                  {purchaseForm.items.map((item, idx) => (
                    <div
                      key={idx}
                      className="p-2.5 rounded-xl bg-slate-50 dark:bg-zinc-900/60 border border-slate-200/80 dark:border-zinc-800/80 grid grid-cols-12 gap-2 items-center"
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

      {/* ---------------------------------------------------- */}
      {/* EDIT PURCHASE MODAL                                  */}
      {/* ---------------------------------------------------- */}
      {isEditModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs animate-in fade-in duration-150">
          <Card className="max-w-2xl w-full p-6 bg-white dark:bg-[#121215] border-slate-200 dark:border-zinc-800 space-y-4 shadow-2xl max-h-[90vh] flex flex-col">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-zinc-800 pb-3 shrink-0">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-blue-500/10 text-blue-500 flex items-center justify-center">
                  <Edit2 className="w-4 h-4" />
                </div>
                <div>
                  <h2 className="text-base font-bold text-slate-900 dark:text-white">
                    {lang === 'bn' ? 'ক্রয় ইনভয়েস সম্পাদনা' : 'Edit Purchase Invoice'}
                  </h2>
                  <p className="text-[11px] font-mono text-slate-400">
                    #{editingPurchase?.purchase_number}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsEditModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 p-1 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmitEdit} className="flex-1 overflow-y-auto space-y-4 pr-1 text-xs">
              
              {/* Supplier Selection */}
              <div>
                <label className="font-bold text-slate-700 dark:text-zinc-300 block mb-1">
                  {lang === 'bn' ? 'সাপ্লায়ার নির্বাচন' : 'Supplier'}
                </label>
                <Select
                  value={editForm.supplier_id || '__walk_in__'}
                  onValueChange={(val) => {
                    if (val === '__walk_in__') {
                      setEditForm({ ...editForm, supplier_id: '', supplier_name: 'General / Walk-in Supplier' });
                    } else {
                      const found = suppliers.find((s) => s._id === val);
                      setEditForm({
                        ...editForm,
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
                      <SelectItem
                        key={s._id}
                        value={s._id}
                        onDelete={() => handleDeleteSupplier(s._id, s.name)}
                        deleteTitle={lang === 'bn' ? 'সাপ্লায়ার মুছুন' : 'Delete supplier'}
                      >
                        {s.name} {s.company_name ? `(${s.company_name})` : ''}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Items Section */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="font-bold text-slate-700 dark:text-zinc-300">
                    {lang === 'bn' ? 'ক্রয়কৃত পণ্যসমূহ *' : 'Purchase Line Items *'}
                  </label>
                  <button
                    type="button"
                    onClick={handleAddEditItemRow}
                    className="text-[11px] font-semibold text-[#00a86b] dark:text-[#00df89] hover:underline flex items-center gap-1 cursor-pointer"
                  >
                    <PlusCircle className="w-3.5 h-3.5" />
                    <span>{lang === 'bn' ? '+ আরো পণ্য যোগ করুন' : '+ Add Item Line'}</span>
                  </button>
                </div>

                <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
                  {editForm.items.map((item, idx) => (
                    <div
                      key={idx}
                      className="p-2.5 rounded-xl bg-slate-50 dark:bg-zinc-900/60 border border-slate-200/80 dark:border-zinc-800/80 grid grid-cols-12 gap-2 items-center"
                    >
                      {/* Product Selector */}
                      <div className="col-span-12 sm:col-span-5">
                        <label className="block text-[10px] font-bold text-slate-400 mb-0.5">
                          {lang === 'bn' ? 'পণ্য' : 'Product'}
                        </label>
                        <Select
                          value={item.product_id || '__none__'}
                          onValueChange={(val) => handleEditItemChange(idx, 'product_id', val === '__none__' ? '' : val)}
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
                          onChange={(e) => handleEditItemChange(idx, 'quantity', e.target.value)}
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
                          onChange={(e) => handleEditItemChange(idx, 'unit_cost', e.target.value)}
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
                        {editForm.items.length > 1 && (
                          <button
                            type="button"
                            onClick={() => handleRemoveEditItemRow(idx)}
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
                      value={editForm.discount}
                      onChange={(e) => setEditForm({ ...editForm, discount: e.target.value })}
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
                      placeholder={`৳${editCalculatedNet}`}
                      value={editForm.paid_amount}
                      onChange={(e) => setEditForm({ ...editForm, paid_amount: e.target.value })}
                      className="w-full px-3 py-1.5 rounded-xl bg-white dark:bg-[#09090b] border border-slate-200 dark:border-zinc-800 text-xs text-slate-900 dark:text-white outline-none"
                    />
                  </div>

                  <div>
                    <label className="block font-bold text-slate-700 dark:text-zinc-300 mb-1">
                      {lang === 'bn' ? 'পেমেন্ট মাধ্যম' : 'Payment Method'}
                    </label>
                    <Select
                      value={editForm.payment_method}
                      onValueChange={(val) => setEditForm({ ...editForm, payment_method: val })}
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
                    <span className="text-slate-500">{lang === 'bn' ? 'সর্বমোট বিল:' : 'Total Amount:'} ৳{editCalculatedTotal.toLocaleString()}</span>
                    {editCalculatedDue > 0 && (
                      <span className="text-amber-500 block">
                        {lang === 'bn' ? 'সাপ্লায়ার বাকি থাকবে:' : 'Due Balance:'} ৳{editCalculatedDue.toLocaleString()}
                      </span>
                    )}
                  </div>
                  <div className="text-right">
                    <span className="text-sm font-black text-slate-900 dark:text-white font-mono">
                      {lang === 'bn' ? 'নিট বিল:' : 'Net Bill:'} ৳{editCalculatedNet.toLocaleString()}
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
                  value={editForm.notes}
                  onChange={(e) => setEditForm({ ...editForm, notes: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-[#09090b] border border-slate-200 dark:border-zinc-800 text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-[#00df89]"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100 dark:border-zinc-800 shrink-0">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setIsEditModalOpen(false)}
                  className="h-9 px-4 rounded-xl cursor-pointer"
                >
                  {lang === 'bn' ? 'বাতিল' : 'Cancel'}
                </Button>
                <Button
                  type="submit"
                  disabled={isSubmitting}
                  className="bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs h-9 px-4 rounded-xl cursor-pointer disabled:opacity-50"
                >
                  {isSubmitting ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    (lang === 'bn' ? 'আপডেট সম্পন্ন করুন' : 'Save Changes')
                  )}
                </Button>
              </div>
            </form>
          </Card>
        </div>
      )}

      {/* ---------------------------------------------------- */}
      {/* INVOICE DETAILS MODAL                                */}
      {/* ---------------------------------------------------- */}
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

            <div className="pt-2 flex items-center justify-between gap-2 border-t border-slate-100 dark:border-zinc-800">
              <Button
                type="button"
                onClick={() => handlePrintReceipt(selectedInvoice)}
                className="bg-[#00df89] hover:bg-[#00c97b] text-[#011812] font-bold text-xs h-9 px-4 rounded-xl cursor-pointer flex items-center gap-1.5"
              >
                <Printer className="w-4 h-4" />
                <span>{lang === 'bn' ? 'রসিদ প্রিন্ট করুন' : 'Print Receipt'}</span>
              </Button>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    const toEdit = selectedInvoice;
                    setSelectedInvoice(null);
                    handleOpenEdit(toEdit);
                  }}
                  className="h-9 px-3 rounded-xl cursor-pointer"
                >
                  <Edit2 className="w-3.5 h-3.5 mr-1 text-blue-500" />
                  <span>{lang === 'bn' ? 'সম্পাদনা' : 'Edit'}</span>
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setSelectedInvoice(null)}
                  className="h-9 px-4 rounded-xl cursor-pointer"
                >
                  {lang === 'bn' ? 'বন্ধ করুন' : 'Close'}
                </Button>
              </div>
            </div>
          </Card>
        </div>
      )}

      {/* Delete Confirmation Dialog */}
      <ConfirmDialog
        isOpen={!!deleteTarget}
        isLoading={isDeleting}
        title={lang === 'bn' ? 'ক্রয় ইনভয়েস মুছে ফেলবেন?' : 'Delete Purchase Invoice?'}
        description={
          lang === 'bn'
            ? `আপনি কি নিশ্চিত যে ইনভয়েস #${deleteTarget?.purchase_number} মুছে ফেলতে চান? এটি পণ্যের বিদ্যমান স্টক পূর্বাবস্থায় ফিরিয়ে নেবে এবং সাপ্লায়ার ব্যালেন্স সমন্বয় করবে।`
            : `Are you sure you want to delete purchase #${deleteTarget?.purchase_number}? This will reverse the added stock count from your inventory and adjust the supplier balance.`
        }
        confirmText={lang === 'bn' ? 'হ্যাঁ, মুছে ফেলুন' : 'Yes, Delete & Reverse Stock'}
        cancelText={lang === 'bn' ? 'বাতিল' : 'Cancel'}
        onConfirm={handleConfirmDelete}
        onCancel={() => setDeleteTarget(null)}
      />

      {/* ---------------------------------------------------- */}
      {/* PRINTABLE RECEIPT TEMPLATE (VISIBLE ONLY ON PRINT)    */}
      {/* ---------------------------------------------------- */}
      {printInvoiceData && (
        <div id="print-purchase-receipt" className="hidden print:block fixed inset-0 bg-white text-black p-8 z-[99999]">
          <style>{`
            @media print {
              body * { visibility: hidden !important; }
              #print-purchase-receipt, #print-purchase-receipt * { visibility: visible !important; }
              #print-purchase-receipt { position: absolute; left: 0; top: 0; width: 100%; height: auto; display: block !important; padding: 20px; font-family: sans-serif; }
            }
          `}</style>

          {/* Shop Header */}
          <div className="text-center border-b-2 border-black pb-4 mb-4">
            <h1 className="text-2xl font-black uppercase tracking-wider">{currentShopName}</h1>
            {currentShopAddress && <p className="text-xs text-gray-700">{currentShopAddress}</p>}
            {currentShopPhone && <p className="text-xs text-gray-700">Phone: {currentShopPhone}</p>}
            <h2 className="text-sm font-bold mt-2 uppercase tracking-widest bg-gray-200 inline-block px-3 py-1 rounded">
              Purchase Invoice & Stock Receipt
            </h2>
          </div>

          {/* Invoice & Supplier Meta */}
          <div className="grid grid-cols-2 text-xs mb-4 pb-2 border-b border-gray-300">
            <div>
              <p><span className="font-bold">Invoice No:</span> #{printInvoiceData.purchase_number}</p>
              <p><span className="font-bold">Date:</span> {new Date(printInvoiceData.created_at).toLocaleDateString()} {new Date(printInvoiceData.created_at).toLocaleTimeString()}</p>
              <p><span className="font-bold">Payment Method:</span> <span className="uppercase">{printInvoiceData.payment_method || 'Cash'}</span></p>
            </div>
            <div className="text-right">
              <p><span className="font-bold">Supplier:</span> {printInvoiceData.supplier_name}</p>
              {printInvoiceData.supplier_phone && <p><span className="font-bold">Phone:</span> {printInvoiceData.supplier_phone}</p>}
              <p><span className="font-bold">Status:</span> <span className="uppercase font-black">{printInvoiceData.payment_status}</span></p>
            </div>
          </div>

          {/* Itemized Table */}
          <table className="w-full text-xs text-left border-collapse mb-4">
            <thead>
              <tr className="border-b-2 border-black">
                <th className="py-2 text-left">SL</th>
                <th className="py-2 text-left">Product Item</th>
                <th className="py-2 text-center">Qty</th>
                <th className="py-2 text-right">Unit Rate (৳)</th>
                <th className="py-2 text-right">Total (৳)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {printInvoiceData.items?.map((it, i) => (
                <tr key={i}>
                  <td className="py-2">{i + 1}</td>
                  <td className="py-2 font-semibold">{it.product_name}</td>
                  <td className="py-2 text-center">{it.quantity}</td>
                  <td className="py-2 text-right font-mono">৳{(it.unit_cost || 0).toLocaleString()}</td>
                  <td className="py-2 text-right font-mono font-bold">৳{(it.total_cost || (it.quantity * it.unit_cost) || 0).toLocaleString()}</td>
                </tr>
              ))}
            </tbody>
          </table>

          {/* Calculation Breakdown */}
          <div className="flex justify-end mb-8">
            <div className="w-64 space-y-1.5 text-xs border-t-2 border-black pt-2">
              <div className="flex justify-between">
                <span>Subtotal Gross:</span>
                <span className="font-mono">৳{(printInvoiceData.total_amount || 0).toLocaleString()}</span>
              </div>
              {printInvoiceData.discount > 0 && (
                <div className="flex justify-between">
                  <span>Discount:</span>
                  <span className="font-mono">-৳{(printInvoiceData.discount || 0).toLocaleString()}</span>
                </div>
              )}
              <div className="flex justify-between font-black text-sm border-t border-gray-300 pt-1">
                <span>Net Payable:</span>
                <span className="font-mono">৳{(printInvoiceData.net_amount || 0).toLocaleString()}</span>
              </div>
              <div className="flex justify-between font-semibold">
                <span>Paid Amount:</span>
                <span className="font-mono">৳{(printInvoiceData.paid_amount || 0).toLocaleString()}</span>
              </div>
              {(printInvoiceData.due_amount || 0) > 0 && (
                <div className="flex justify-between font-bold text-red-600 border-t border-dashed border-gray-300 pt-1">
                  <span>Due Balance:</span>
                  <span className="font-mono">৳{(printInvoiceData.due_amount).toLocaleString()}</span>
                </div>
              )}
            </div>
          </div>

          {/* Notes if any */}
          {printInvoiceData.notes && (
            <div className="text-xs mb-8 p-2 border border-gray-200 rounded">
              <span className="font-bold">Remarks:</span> {printInvoiceData.notes}
            </div>
          )}

          {/* Signatures */}
          <div className="grid grid-cols-2 gap-8 pt-12 text-xs text-center border-t border-gray-200">
            <div>
              <div className="border-t border-black w-36 mx-auto mb-1"></div>
              <p>Supplier Signature</p>
            </div>
            <div>
              <div className="border-t border-black w-36 mx-auto mb-1"></div>
              <p>Authorized Receiver</p>
            </div>
          </div>

          {/* Footer Notice */}
          <div className="text-center text-[10px] text-gray-500 mt-8">
            <p>Thank you for partnering with us. Powered by Shopo Business Suite.</p>
          </div>
        </div>
      )}
    </div>
  );
}
