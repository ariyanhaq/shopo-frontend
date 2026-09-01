import { useState, useEffect, useMemo } from 'react';
import { useLanguage } from '@/context/LanguageContext';
import { useShop } from '@/context/ShopContext';
import api from '@/services/api';
import toast from 'react-hot-toast';
import { Card, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/components/ui/select';
import ConfirmDialog from '@/components/common/ConfirmDialog';
import {
  Package, Plus, Search, RefreshCw, AlertTriangle, CheckCircle2,
  Trash2, Edit3, ArrowDownToLine, DollarSign, X, Loader2,
  TrendingDown, Layers, ShieldCheck, Phone, Sparkles
} from 'lucide-react';

const CATEGORY_STYLES = {
  meat_poultry: 'bg-rose-50 dark:bg-rose-950/30 text-rose-700 dark:text-rose-400 border-rose-200 dark:border-rose-900/50',
  dairy: 'bg-sky-50 dark:bg-sky-950/30 text-sky-700 dark:text-sky-400 border-sky-200 dark:border-sky-900/50',
  produce: 'bg-emerald-50 dark:bg-emerald-950/30 text-emerald-700 dark:text-emerald-400 border-emerald-200 dark:border-emerald-900/50',
  spices_oils: 'bg-amber-50 dark:bg-amber-950/30 text-amber-700 dark:text-amber-400 border-amber-200 dark:border-amber-900/50',
  grains_bakery: 'bg-purple-50 dark:bg-purple-950/30 text-purple-700 dark:text-purple-400 border-purple-200 dark:border-purple-900/50',
  packaging: 'bg-indigo-50 dark:bg-indigo-950/30 text-indigo-700 dark:text-indigo-400 border-indigo-200 dark:border-indigo-900/50',
  general: 'bg-slate-100 dark:bg-zinc-800 text-slate-700 dark:text-zinc-300 border-slate-200 dark:border-zinc-700',
};

const CATEGORIES = [
  { id: 'all', label: 'All Pantry Items', labelBn: 'সকল কাঁচামাল' },
  { id: 'meat_poultry', label: 'Meat & Poultry', labelBn: 'মাংস ও পোল্ট্রি' },
  { id: 'dairy', label: 'Dairy & Cheese', labelBn: 'দুগ্ধজাত ও পনির' },
  { id: 'produce', label: 'Vegetables & Produce', labelBn: 'শাকসবজি' },
  { id: 'spices_oils', label: 'Spices & Oils', labelBn: 'তেল ও মশলা' },
  { id: 'grains_bakery', label: 'Grains & Bakery', labelBn: 'চাল ও বেকারি' },
  { id: 'packaging', label: 'Packaging & Boxes', labelBn: 'প্যাকেজিং' },
];

export default function RestaurantInventory() {
  const { lang } = useLanguage();
  const { activeShop } = useShop();

  const [rawMaterials, setRawMaterials] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(true);

  // Deleting State (Confirm Dialog)
  const [deletingMaterial, setDeletingMaterial] = useState(null);
  const [isDeletingMaterial, setIsDeletingMaterial] = useState(false);

  // Add / Edit Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingMaterial, setEditingMaterial] = useState(null);
  const [isSavingMaterial, setIsSavingMaterial] = useState(false);

  // Restock Modal State
  const [isRestockModalOpen, setIsRestockModalOpen] = useState(false);
  const [selectedMaterial, setSelectedMaterial] = useState(null);
  const [isRestockingMaterial, setIsRestockingMaterial] = useState(false);

  // Form State
  const [form, setForm] = useState({
    name: '',
    name_bn: '',
    category: 'general',
    current_stock: '',
    unit: 'kg',
    unit_cost: '',
    min_stock_alert: 5,
    supplier_name: '',
    supplier_phone: '',
    payment_method: 'Cash',
    notes: '',
  });

  const [restockForm, setRestockForm] = useState({
    quantity: '',
    unit_cost: '',
    payment_method: 'Cash',
    notes: '',
  });

  const fetchMaterials = async () => {
    try {
      setIsLoading(true);
      const params = {};
      if (selectedCategory !== 'all') params.category = selectedCategory;

      const res = await api.restaurant.rawMaterials.list(params);
      if (res?.success) {
        setRawMaterials(res.data);
      }
    } catch (err) {
      console.error('Failed to load raw materials:', err);
      toast.error('Failed to load raw materials inventory');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchMaterials();
  }, [activeShop, selectedCategory]);

  const filteredMaterials = useMemo(() => {
    return rawMaterials.filter((m) => {
      const q = searchQuery.toLowerCase().trim();
      return (
        !q ||
        m.name.toLowerCase().includes(q) ||
        (m.name_bn && m.name_bn.toLowerCase().includes(q)) ||
        (m.supplier_name && m.supplier_name.toLowerCase().includes(q))
      );
    });
  }, [rawMaterials, searchQuery]);

  // Executive Stats Calculation
  const stats = useMemo(() => {
    const totalItems = rawMaterials.length;
    const lowStockItems = rawMaterials.filter((m) => Number(m.current_stock) <= Number(m.min_stock_alert)).length;
    const totalValuation = rawMaterials.reduce((acc, m) => {
      const stock = Math.max(0, Number(m.current_stock || 0));
      const cost = Number(m.unit_cost || 0);
      return acc + stock * cost;
    }, 0);
    const healthyPercentage = totalItems > 0 ? Math.round(((totalItems - lowStockItems) / totalItems) * 100) : 100;

    return { totalItems, lowStockItems, totalValuation, healthyPercentage };
  }, [rawMaterials]);

  // Open Add Modal
  const handleOpenAddModal = () => {
    setEditingMaterial(null);
    setForm({
      name: '',
      name_bn: '',
      category: 'general',
      current_stock: '',
      unit: 'kg',
      unit_cost: '',
      min_stock_alert: 5,
      supplier_name: '',
      supplier_phone: '',
      payment_method: 'Cash',
      notes: '',
    });
    setIsModalOpen(true);
  };

  // Open Edit Modal
  const handleOpenEditModal = (mat) => {
    setEditingMaterial(mat);
    setForm({
      name: mat.name || '',
      name_bn: mat.name_bn || '',
      category: mat.category || 'general',
      current_stock: mat.current_stock !== undefined ? mat.current_stock : '',
      unit: mat.unit || 'kg',
      unit_cost: mat.unit_cost !== undefined ? mat.unit_cost : '',
      min_stock_alert: mat.min_stock_alert !== undefined ? mat.min_stock_alert : 5,
      supplier_name: mat.supplier_name || '',
      supplier_phone: mat.supplier_phone || '',
      payment_method: 'Cash',
      notes: mat.notes || '',
    });
    setIsModalOpen(true);
  };

  // Submit Add or Edit
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.name.trim()) {
      toast.error('Ingredient name is required');
      return;
    }

    setIsSavingMaterial(true);
    try {
      if (editingMaterial) {
        await api.restaurant.rawMaterials.update(editingMaterial._id, form);
        toast.success(`Updated "${form.name}"!`);
      } else {
        await api.restaurant.rawMaterials.create(form);
        toast.success(`Added "${form.name}" to pantry!`);
      }
      setIsModalOpen(false);
      fetchMaterials();
    } catch (err) {
      toast.error(err.message || 'Failed to save ingredient');
    } finally {
      setIsSavingMaterial(false);
    }
  };

  // Restock Handler
  const handleOpenRestockModal = (mat) => {
    setSelectedMaterial(mat);
    setRestockForm({
      quantity: '',
      unit_cost: mat.unit_cost !== undefined ? mat.unit_cost : '',
      payment_method: 'Cash',
      notes: '',
    });
    setIsRestockModalOpen(true);
  };

  const handleRestock = async (e) => {
    e.preventDefault();
    if (!selectedMaterial || !restockForm.quantity || Number(restockForm.quantity) <= 0) {
      toast.error('Please enter a valid restock quantity');
      return;
    }

    setIsRestockingMaterial(true);
    try {
      await api.restaurant.rawMaterials.restock(selectedMaterial._id, restockForm);
      toast.success(`Restocked ${restockForm.quantity} ${selectedMaterial.unit} of ${selectedMaterial.name}!`);
      setIsRestockModalOpen(false);
      fetchMaterials();
    } catch (err) {
      toast.error(err.message || 'Failed to restock ingredient');
    } finally {
      setIsRestockingMaterial(false);
    }
  };

  const handleDelete = (mat) => {
    setDeletingMaterial(mat);
  };

  const confirmDeleteMaterial = async () => {
    if (!deletingMaterial?._id) return;
    setIsDeletingMaterial(true);
    try {
      await api.restaurant.rawMaterials.delete(deletingMaterial._id);
      toast.success(lang === 'bn' ? 'উপকরণ মুছে ফেলা হয়েছে' : 'Ingredient deleted');
      setDeletingMaterial(null);
      fetchMaterials();
    } catch (err) {
      toast.error('Failed to delete ingredient');
    } finally {
      setIsDeletingMaterial(false);
    }
  };

  return (
    <div className="space-y-6 font-sans pb-16">
      
      {/* HEADER */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white tracking-tight flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-orange-500/10 dark:bg-orange-500/20 text-orange-600 dark:text-orange-400 flex items-center justify-center shadow-xs">
              <Package className="w-5 h-5" />
            </div>
            <span>{lang === 'bn' ? 'কাঁচামাল ও রান্নাঘর প্যান্ট্রি স্টক' : 'Raw Materials & Kitchen Pantry Stock'}</span>
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-zinc-400 font-normal mt-1">
            {lang === 'bn'
              ? 'মাংস, চাল, মশলা, তেল ও প্যাকেজিং উপাদানের লাইভ স্টক ও খরচের হিসাব।'
              : 'Real-time ingredient levels, low-stock threshold alerts & automated expense tracking.'}
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={fetchMaterials}
            title="Refresh Inventory"
            className="p-2.5 rounded-xl border border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 hover:bg-slate-100 dark:hover:bg-zinc-800 text-slate-700 dark:text-zinc-300 transition-all cursor-pointer shadow-2xs"
          >
            <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin text-orange-500' : ''}`} />
          </button>

          <button
            onClick={handleOpenAddModal}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#00df89] hover:bg-[#00c578] text-slate-950 font-bold text-xs shadow-xs hover:shadow-md transition-all cursor-pointer active:scale-95"
          >
            <Plus className="w-4 h-4" />
            <span>{lang === 'bn' ? 'নতুন কাঁচামাল যোগ করুন' : 'Add Raw Material'}</span>
          </button>
        </div>
      </div>

      {/* KPI METRIC CARDS */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5">
        <Card className="p-4 bg-white dark:bg-[#121215] border-slate-200/80 dark:border-zinc-800 rounded-2xl shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 dark:text-zinc-400">
              {lang === 'bn' ? 'মোট কাঁচামাল' : 'Total Items'}
            </span>
            <div className="w-7 h-7 rounded-lg bg-blue-500/10 text-blue-600 flex items-center justify-center">
              <Layers className="w-3.5 h-3.5" />
            </div>
          </div>
          <div className="mt-2 text-2xl font-black text-slate-900 dark:text-white font-mono">
            {stats.totalItems}
          </div>
          <div className="mt-1 text-[11px] text-slate-400">
            {rawMaterials.length > 0 ? `${new Set(rawMaterials.map(r => r.category)).size} Categories` : 'No items yet'}
          </div>
        </Card>

        <Card className="p-4 bg-white dark:bg-[#121215] border-slate-200/80 dark:border-zinc-800 rounded-2xl shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 dark:text-zinc-400">
              {lang === 'bn' ? 'কম স্টক অ্যালার্ট' : 'Low Stock Alerts'}
            </span>
            <div className={`w-7 h-7 rounded-lg flex items-center justify-center ${stats.lowStockItems > 0 ? 'bg-rose-500/15 text-rose-600' : 'bg-emerald-500/15 text-emerald-600'}`}>
              <AlertTriangle className="w-3.5 h-3.5" />
            </div>
          </div>
          <div className={`mt-2 text-2xl font-black font-mono ${stats.lowStockItems > 0 ? 'text-rose-600 dark:text-rose-400' : 'text-slate-900 dark:text-white'}`}>
            {stats.lowStockItems}
          </div>
          <div className="mt-1 text-[11px] text-slate-400">
            {stats.lowStockItems > 0 ? 'Needs immediate restock' : 'All stocks sufficient'}
          </div>
        </Card>

        <Card className="p-4 bg-white dark:bg-[#121215] border-slate-200/80 dark:border-zinc-800 rounded-2xl shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 dark:text-zinc-400">
              {lang === 'bn' ? 'প্যান্ট্রি স্টক ভ্যালু' : 'Pantry Valuation'}
            </span>
            <div className="w-7 h-7 rounded-lg bg-emerald-500/10 text-emerald-600 flex items-center justify-center">
              <DollarSign className="w-3.5 h-3.5" />
            </div>
          </div>
          <div className="mt-2 text-2xl font-black text-emerald-600 dark:text-[#00df89] font-mono">
            ৳ {Math.round(stats.totalValuation).toLocaleString()}
          </div>
          <div className="mt-1 text-[11px] text-slate-400">
            Current holding valuation
          </div>
        </Card>

        <Card className="p-4 bg-white dark:bg-[#121215] border-slate-200/80 dark:border-zinc-800 rounded-2xl shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 dark:text-zinc-400">
              {lang === 'bn' ? 'স্টক হেলথ' : 'Stock Health'}
            </span>
            <div className="w-7 h-7 rounded-lg bg-purple-500/10 text-purple-600 flex items-center justify-center">
              <ShieldCheck className="w-3.5 h-3.5" />
            </div>
          </div>
          <div className="mt-2 text-2xl font-black text-slate-900 dark:text-white font-mono">
            {stats.healthyPercentage}%
          </div>
          <div className="mt-1 text-[11px] text-slate-400">
            {stats.totalItems - stats.lowStockItems} of {stats.totalItems} healthy
          </div>
        </Card>
      </div>

      {/* FILTER TABS & SEARCH */}
      <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3 pt-2">
        <div className="relative w-full md:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <Input
            placeholder={lang === 'bn' ? 'কাঁচামাল খুঁজুন...' : 'Search raw materials...'}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9 pr-8 h-9.5 text-xs bg-white dark:bg-zinc-900 rounded-xl border-slate-200 dark:border-zinc-800 shadow-2xs"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-white"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
          {CATEGORIES.map((c) => {
            const isSelected = selectedCategory === c.id;
            const count = c.id === 'all'
              ? rawMaterials.length
              : rawMaterials.filter(m => m.category === c.id).length;

            return (
              <button
                key={c.id}
                onClick={() => setSelectedCategory(c.id)}
                className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all cursor-pointer flex items-center gap-1.5 shadow-2xs ${
                  isSelected
                    ? 'bg-slate-900 text-white dark:bg-white dark:text-slate-950 font-bold shadow-xs'
                    : 'bg-white dark:bg-zinc-900 border border-slate-200/80 dark:border-zinc-800 text-slate-600 dark:text-zinc-400 hover:bg-slate-100 dark:hover:bg-zinc-800'
                }`}
              >
                <span>{lang === 'bn' ? c.labelBn : c.label}</span>
                {count > 0 && (
                  <span className={`px-1.5 py-0.2 text-[10px] font-mono rounded-full ${isSelected ? 'bg-white/20 dark:bg-black/20 text-white dark:text-slate-900' : 'bg-slate-100 dark:bg-zinc-800 text-slate-500'}`}>
                    {count}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* MATERIALS TABLE */}
      <Card className="p-0 bg-white dark:bg-[#121215] border-slate-200/80 dark:border-zinc-800 shadow-xs rounded-2xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-slate-50/80 dark:bg-zinc-850/60 border-b border-slate-200 dark:border-zinc-800 text-slate-500 dark:text-zinc-400 font-bold uppercase tracking-wider text-[10px]">
                <th className="py-3 px-4">Ingredient Name</th>
                <th className="py-3 px-4">Category</th>
                <th className="py-3 px-4">Current Stock</th>
                <th className="py-3 px-4">Purchase Unit Cost</th>
                <th className="py-3 px-4">Supplier</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-zinc-800/80">
              {isLoading ? (
                [1, 2, 3, 4, 5, 6].map((i) => (
                  <tr key={i} className="animate-pulse">
                    <td className="py-3 px-4"><Skeleton className="h-4 w-36 rounded" /></td>
                    <td className="py-3 px-4"><Skeleton className="h-5 w-20 rounded-full" /></td>
                    <td className="py-3 px-4"><Skeleton className="h-4 w-24 rounded" /></td>
                    <td className="py-3 px-4"><Skeleton className="h-4 w-20 rounded" /></td>
                    <td className="py-3 px-4"><Skeleton className="h-4 w-28 rounded" /></td>
                    <td className="py-3 px-4 text-right"><Skeleton className="h-7 w-28 rounded-lg ml-auto" /></td>
                  </tr>
                ))
              ) : filteredMaterials.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-16 text-center text-slate-400 text-xs">
                    <div className="flex flex-col items-center justify-center gap-2">
                      <Package className="w-8 h-8 text-slate-300 dark:text-zinc-600" />
                      <p className="font-semibold text-slate-600 dark:text-zinc-400">No raw materials found</p>
                      <p className="text-[11px] text-slate-400">Click "Add Raw Material" to record ingredients in your pantry.</p>
                    </div>
                  </td>
                </tr>
              ) : (
                filteredMaterials.map((mat) => {
                  const stockNum = Number(mat.current_stock || 0);
                  const isLow = stockNum <= Number(mat.min_stock_alert);
                  const isNegative = stockNum < 0;
                  const categoryStyle = CATEGORY_STYLES[mat.category] || CATEGORY_STYLES.general;

                  return (
                    <tr key={mat._id} className="hover:bg-slate-50/60 dark:hover:bg-zinc-850/40 transition-colors">
                      <td className="py-3.5 px-4">
                        <div className="font-bold text-slate-900 dark:text-white text-xs">
                          {lang === 'bn' && mat.name_bn ? mat.name_bn : mat.name}
                        </div>
                        {lang === 'bn' && mat.name_bn && mat.name !== mat.name_bn ? (
                          <div className="text-[10px] text-slate-400">{mat.name}</div>
                        ) : mat.notes ? (
                          <div className="text-[10px] text-slate-400 truncate max-w-[200px]">{mat.notes}</div>
                        ) : null}
                      </td>

                      <td className="py-3.5 px-4">
                        <Badge className={`capitalize text-[10px] font-semibold border px-2 py-0.5 shadow-2xs ${categoryStyle}`}>
                          {mat.category.replace('_', ' ')}
                        </Badge>
                      </td>

                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-2">
                          <span className={`font-mono font-bold text-xs ${
                            isNegative
                              ? 'text-rose-600 dark:text-rose-400'
                              : isLow
                              ? 'text-amber-600 dark:text-amber-400'
                              : 'text-slate-900 dark:text-white'
                          }`}>
                            {mat.current_stock} {mat.unit}
                          </span>

                          {isNegative ? (
                            <Badge className="bg-rose-500/15 text-rose-600 dark:text-rose-400 border border-rose-500/30 text-[9px] px-1.5 py-0">
                              <AlertTriangle className="w-2.5 h-2.5 mr-0.5 inline" /> Negative Stock
                            </Badge>
                          ) : isLow ? (
                            <Badge className="bg-amber-500/15 text-amber-600 dark:text-amber-400 border border-amber-500/30 text-[9px] px-1.5 py-0">
                              Low Stock (&lt;{mat.min_stock_alert})
                            </Badge>
                          ) : (
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" title="In Stock" />
                          )}
                        </div>
                      </td>

                      <td className="py-3.5 px-4 font-mono font-bold text-slate-800 dark:text-zinc-200">
                        ৳ {mat.unit_cost} <span className="text-slate-400 text-[10px] font-normal">/ {mat.unit}</span>
                      </td>

                      <td className="py-3.5 px-4 text-slate-600 dark:text-zinc-400">
                        {mat.supplier_name ? (
                          <div>
                            <span className="font-semibold text-slate-800 dark:text-zinc-200">{mat.supplier_name}</span>
                            {mat.supplier_phone && (
                              <div className="text-[10px] text-slate-400 flex items-center gap-1">
                                <Phone className="w-2.5 h-2.5" />
                                <span>{mat.supplier_phone}</span>
                              </div>
                            )}
                          </div>
                        ) : (
                          <span className="text-slate-400">—</span>
                        )}
                      </td>

                      <td className="py-3.5 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          {/* RESTOCK BUTTON */}
                          <button
                            onClick={() => handleOpenRestockModal(mat)}
                            className="px-2.5 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-[11px] cursor-pointer flex items-center gap-1 shadow-2xs active:scale-95 transition-all"
                            title="Restock Ingredient"
                          >
                            <ArrowDownToLine className="w-3 h-3" />
                            <span>{lang === 'bn' ? 'রিস্টক' : 'Restock'}</span>
                          </button>

                          {/* EDIT BUTTON */}
                          <button
                            onClick={() => handleOpenEditModal(mat)}
                            className="p-1.5 rounded-xl border border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 text-slate-600 dark:text-zinc-300 hover:bg-slate-100 dark:hover:bg-zinc-800 hover:text-blue-600 dark:hover:text-blue-400 cursor-pointer shadow-2xs transition-colors"
                            title="Edit Ingredient"
                          >
                            <Edit3 className="w-3.5 h-3.5" />
                          </button>

                          {/* DELETE BUTTON */}
                          <button
                            onClick={() => handleDelete(mat)}
                            className="p-1.5 rounded-xl border border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/30 hover:border-rose-200 dark:hover:border-rose-900/50 cursor-pointer shadow-2xs transition-colors"
                            title="Delete Ingredient"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </Card>

      {/* MODAL 1: ADD / EDIT RAW MATERIAL */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs">
          <Card className="max-w-lg w-full p-6 bg-white dark:bg-[#121215] border-slate-200 dark:border-zinc-800 shadow-2xl rounded-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-zinc-800 pb-3 mb-4">
              <CardTitle className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <Package className="w-4 h-4 text-orange-500" />
                <span>
                  {editingMaterial
                    ? (lang === 'bn' ? `সম্পাদনা: ${editingMaterial.name}` : `Edit Raw Material: ${editingMaterial.name}`)
                    : (lang === 'bn' ? 'নতুন কাঁচামাল যোগ করুন' : 'Add Raw Material to Pantry')}
                </span>
              </CardTitle>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-slate-400 hover:text-white cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="font-semibold text-slate-700 dark:text-zinc-300 block mb-1">
                    {lang === 'bn' ? 'উপকরণের নাম (English) *' : 'Ingredient Name (English) *'}
                  </label>
                  <Input
                    required
                    placeholder="e.g. Mozzarella Cheese"
                    value={form.name}
                    onChange={(e) => setForm({ ...form, name: e.target.value })}
                    className="h-9.5 text-xs rounded-xl"
                  />
                </div>

                <div>
                  <label className="font-semibold text-slate-700 dark:text-zinc-300 block mb-1">
                    {lang === 'bn' ? 'উপকরণের নাম (বাংলা)' : 'Ingredient Name (বাংলা)'}
                  </label>
                  <Input
                    placeholder="যেমন: মোজারেলা চিজ"
                    value={form.name_bn}
                    onChange={(e) => setForm({ ...form, name_bn: e.target.value })}
                    className="h-9.5 text-xs rounded-xl"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="font-semibold text-slate-700 dark:text-zinc-300 block mb-1">
                    Category
                  </label>
                  <Select
                    value={form.category}
                    onValueChange={(val) => setForm({ ...form, category: val })}
                  >
                    <SelectTrigger className="h-9.5 text-xs rounded-xl bg-white dark:bg-zinc-900 border-slate-200 dark:border-zinc-800">
                      <SelectValue placeholder="Category" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="meat_poultry">Meat & Poultry</SelectItem>
                      <SelectItem value="dairy">Dairy & Cheese</SelectItem>
                      <SelectItem value="produce">Vegetables & Produce</SelectItem>
                      <SelectItem value="spices_oils">Spices & Oils</SelectItem>
                      <SelectItem value="grains_bakery">Grains & Bakery</SelectItem>
                      <SelectItem value="packaging">Packaging & Boxes</SelectItem>
                      <SelectItem value="general">General Pantry</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <label className="font-semibold text-slate-700 dark:text-zinc-300 block mb-1">
                    Current Stock
                  </label>
                  <Input
                    type="number"
                    step="any"
                    placeholder="50"
                    value={form.current_stock}
                    onChange={(e) => setForm({ ...form, current_stock: e.target.value })}
                    className="h-9.5 text-xs font-mono font-bold rounded-xl"
                  />
                </div>

                <div>
                  <label className="font-semibold text-slate-700 dark:text-zinc-300 block mb-1">
                    Unit
                  </label>
                  <Select
                    value={form.unit}
                    onValueChange={(val) => setForm({ ...form, unit: val })}
                  >
                    <SelectTrigger className="h-9.5 text-xs rounded-xl bg-white dark:bg-zinc-900 border-slate-200 dark:border-zinc-800">
                      <SelectValue placeholder="Unit" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="kg">kg (Kilogram)</SelectItem>
                      <SelectItem value="g">g (Gram)</SelectItem>
                      <SelectItem value="ltr">ltr (Liter)</SelectItem>
                      <SelectItem value="ml">ml (Milliliter)</SelectItem>
                      <SelectItem value="pcs">pcs (Pieces)</SelectItem>
                      <SelectItem value="pack">pack (Packets)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-semibold text-slate-700 dark:text-zinc-300 block mb-1">
                    Purchase Unit Cost (৳)
                  </label>
                  <Input
                    type="number"
                    min="0"
                    step="any"
                    placeholder="e.g. 950"
                    value={form.unit_cost}
                    onChange={(e) => setForm({ ...form, unit_cost: e.target.value })}
                    className="h-9.5 text-xs font-mono font-bold rounded-xl"
                  />
                </div>

                <div>
                  <label className="font-semibold text-slate-700 dark:text-zinc-300 block mb-1">
                    Low Stock Alert Threshold
                  </label>
                  <Input
                    type="number"
                    min="1"
                    step="any"
                    value={form.min_stock_alert}
                    onChange={(e) => setForm({ ...form, min_stock_alert: e.target.value })}
                    className="h-9.5 text-xs font-mono rounded-xl"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="font-semibold text-slate-700 dark:text-zinc-300 block mb-1">
                    Supplier Name (Optional)
                  </label>
                  <Input
                    placeholder="e.g. Fresh Dairy Farms"
                    value={form.supplier_name}
                    onChange={(e) => setForm({ ...form, supplier_name: e.target.value })}
                    className="h-9.5 text-xs rounded-xl"
                  />
                </div>

                <div>
                  <label className="font-semibold text-slate-700 dark:text-zinc-300 block mb-1">
                    Supplier Phone (Optional)
                  </label>
                  <Input
                    placeholder="e.g. 01711223344"
                    value={form.supplier_phone}
                    onChange={(e) => setForm({ ...form, supplier_phone: e.target.value })}
                    className="h-9.5 text-xs rounded-xl"
                  />
                </div>
              </div>

              <div>
                <label className="font-semibold text-slate-700 dark:text-zinc-300 block mb-1">
                  Notes / Storage Location (Optional)
                </label>
                <Input
                  placeholder="e.g. Stored in Walk-in Chiller #2"
                  value={form.notes}
                  onChange={(e) => setForm({ ...form, notes: e.target.value })}
                  className="h-9.5 text-xs rounded-xl"
                />
              </div>

              {/* Expense Note on New Material Creation */}
              {!editingMaterial && Number(form.current_stock || 0) > 0 && Number(form.unit_cost || 0) > 0 && (
                <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-slate-900 dark:text-white space-y-1">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-slate-600 dark:text-zinc-400 font-medium">Initial Purchase Expense:</span>
                    <span className="font-mono font-black text-emerald-600 dark:text-[#00df89] text-sm">
                      ৳ {(Number(form.current_stock || 0) * Number(form.unit_cost || 0)).toLocaleString()}
                    </span>
                  </div>
                  <div className="text-[10px] text-emerald-700 dark:text-emerald-400 flex items-center gap-1 font-medium">
                    <CheckCircle2 className="w-3 h-3 shrink-0" />
                    <span>Automatically calculated and recorded in Business Expenses</span>
                  </div>
                </div>
              )}

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100 dark:border-zinc-800">
                <button
                  type="button"
                  disabled={isSavingMaterial}
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 rounded-xl border border-slate-200 dark:border-zinc-800 text-xs font-semibold cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed hover:bg-slate-100 dark:hover:bg-zinc-800"
                >
                  {lang === 'bn' ? 'বাতিল' : 'Cancel'}
                </button>
                <button
                  type="submit"
                  disabled={isSavingMaterial}
                  className="px-4 py-2 rounded-xl bg-[#00df89] text-slate-950 text-xs font-bold shadow-xs hover:bg-[#00c578] cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed flex items-center gap-1.5"
                >
                  {isSavingMaterial && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                  <span>
                    {isSavingMaterial
                      ? (lang === 'bn' ? 'সংরক্ষণ হচ্ছে...' : 'Saving...')
                      : editingMaterial
                      ? (lang === 'bn' ? 'আপডেট করুন' : 'Update Ingredient')
                      : (lang === 'bn' ? 'সংরক্ষণ করুন' : 'Save Ingredient')}
                  </span>
                </button>
              </div>
            </form>
          </Card>
        </div>
      )}

      {/* MODAL 2: RESTOCK INGREDIENT */}
      {isRestockModalOpen && selectedMaterial && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs">
          <Card className="max-w-sm w-full p-6 bg-white dark:bg-[#121215] border-slate-200 dark:border-zinc-800 shadow-2xl rounded-2xl">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-zinc-800 pb-3 mb-4">
              <div>
                <CardTitle className="text-base font-bold text-slate-900 dark:text-white">
                  Restock {selectedMaterial.name}
                </CardTitle>
                <div className="text-xs text-slate-400 mt-0.5">
                  Current Stock: <span className="font-mono font-bold text-slate-700 dark:text-zinc-200">{selectedMaterial.current_stock} {selectedMaterial.unit}</span>
                </div>
              </div>
              <button
                onClick={() => setIsRestockModalOpen(false)}
                className="text-slate-400 hover:text-white cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleRestock} className="space-y-4 text-xs">
              <div>
                <label className="font-semibold text-slate-700 dark:text-zinc-300 block mb-1">
                  Quantity to Add ({selectedMaterial.unit}) *
                </label>
                <Input
                  type="number"
                  required
                  min="0.1"
                  step="any"
                  placeholder="e.g. 20"
                  value={restockForm.quantity}
                  onChange={(e) => setRestockForm({ ...restockForm, quantity: e.target.value })}
                  className="h-10 text-xs font-mono font-bold rounded-xl"
                />
              </div>

              <div>
                <label className="font-semibold text-slate-700 dark:text-zinc-300 block mb-1">
                  Purchase Unit Cost (৳ per {selectedMaterial.unit})
                </label>
                <Input
                  type="number"
                  min="0"
                  step="any"
                  placeholder={`Default: ৳${selectedMaterial.unit_cost || 0}`}
                  value={restockForm.unit_cost}
                  onChange={(e) => setRestockForm({ ...restockForm, unit_cost: e.target.value })}
                  className="h-9.5 text-xs font-mono rounded-xl"
                />
              </div>

              <div>
                <label className="font-semibold text-slate-700 dark:text-zinc-300 block mb-1">
                  Payment Method
                </label>
                <Select
                  value={restockForm.payment_method}
                  onValueChange={(val) => setRestockForm({ ...restockForm, payment_method: val })}
                >
                  <SelectTrigger className="h-9.5 text-xs rounded-xl bg-white dark:bg-zinc-900 border-slate-200 dark:border-zinc-800">
                    <SelectValue placeholder="Payment Method" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Cash">Cash</SelectItem>
                    <SelectItem value="bKash">bKash</SelectItem>
                    <SelectItem value="Nagad">Nagad</SelectItem>
                    <SelectItem value="Rocket">Rocket</SelectItem>
                    <SelectItem value="Bank Transfer">Bank Transfer</SelectItem>
                    <SelectItem value="Card">Card</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Live Expense Calculation Banner */}
              {Number(restockForm.quantity || 0) > 0 && (
                <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-slate-900 dark:text-white space-y-1">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-slate-600 dark:text-zinc-400 font-medium">Total Purchase Amount:</span>
                    <span className="font-mono font-black text-emerald-600 dark:text-[#00df89] text-sm">
                      ৳ {(
                        Number(restockForm.quantity || 0) *
                        (restockForm.unit_cost !== '' ? Number(restockForm.unit_cost) : Number(selectedMaterial.unit_cost || 0))
                      ).toLocaleString()}
                    </span>
                  </div>
                  <div className="text-[10px] text-emerald-700 dark:text-emerald-400 flex items-center gap-1 font-medium">
                    <CheckCircle2 className="w-3 h-3 shrink-0" />
                    <span>Automatically recorded in Business Expenses</span>
                  </div>
                </div>
              )}

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100 dark:border-zinc-800">
                <button
                  type="button"
                  disabled={isRestockingMaterial}
                  onClick={() => setIsRestockModalOpen(false)}
                  className="px-4 py-2 rounded-xl border border-slate-200 dark:border-zinc-800 text-xs font-semibold cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed hover:bg-slate-100 dark:hover:bg-zinc-800"
                >
                  {lang === 'bn' ? 'বাতিল' : 'Cancel'}
                </button>
                <button
                  type="submit"
                  disabled={isRestockingMaterial}
                  className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed flex items-center gap-1.5 shadow-xs"
                >
                  {isRestockingMaterial && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                  <span>
                    {isRestockingMaterial
                      ? (lang === 'bn' ? 'যুক্ত হচ্ছে...' : 'Restocking...')
                      : (lang === 'bn' ? 'রিস্টক নিশ্চিত করুন' : 'Confirm Restock')}
                  </span>
                </button>
              </div>
            </form>
          </Card>
        </div>
      )}

      {/* CONFIRM DELETE DIALOG */}
      <ConfirmDialog
        isOpen={Boolean(deletingMaterial)}
        title={lang === 'bn' ? `"${deletingMaterial?.name || ''}" উপকরণটি মুছে ফেলতে চান?` : `Delete "${deletingMaterial?.name || ''}"?`}
        description={lang === 'bn' ? 'এই উপকরণটি প্যান্ট্রি ইনভেন্টরি থেকে স্থায়ীভাবে মুছে ফেলা হবে।' : 'This ingredient will be permanently removed from your raw material inventory.'}
        confirmText={lang === 'bn' ? 'হ্যাঁ, মুছুন' : 'Yes, Delete Ingredient'}
        cancelText={lang === 'bn' ? 'বাতিল' : 'Cancel'}
        isLoading={isDeletingMaterial}
        onConfirm={confirmDeleteMaterial}
        onClose={() => setDeletingMaterial(null)}
      />

    </div>
  );
}
