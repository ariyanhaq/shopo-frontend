import { useState, useEffect } from 'react';
import { useLanguage } from '@/context/LanguageContext';
import { useShop } from '@/context/ShopContext';
import api from '@/services/api';
import toast from 'react-hot-toast';
import { Card, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import {
  Package, Plus, Search, RefreshCw, AlertTriangle, CheckCircle2,
  Trash2, Edit3, ArrowDownToLine, DollarSign, X
} from 'lucide-react';

export default function RestaurantInventory() {
  const { lang } = useLanguage();
  const { activeShop } = useShop();

  const [rawMaterials, setRawMaterials] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(true);

  // Modals
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isRestockModalOpen, setIsRestockModalOpen] = useState(false);
  const [selectedMaterial, setSelectedMaterial] = useState(null);

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
    notes: '',
  });

  const [restockForm, setRestockForm] = useState({
    quantity: '',
    unit_cost: '',
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

  const filteredMaterials = rawMaterials.filter((m) => {
    const q = searchQuery.toLowerCase().trim();
    return !q || m.name.toLowerCase().includes(q) || (m.name_bn && m.name_bn.toLowerCase().includes(q));
  });

  const handleCreate = async (e) => {
    e.preventDefault();
    if (!form.name.trim()) return;

    try {
      await api.restaurant.rawMaterials.create(form);
      toast.success('Raw material added to pantry!');
      setIsAddModalOpen(false);
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
        notes: '',
      });
      fetchMaterials();
    } catch (err) {
      toast.error(err.message || 'Failed to add ingredient');
    }
  };

  const handleRestock = async (e) => {
    e.preventDefault();
    if (!selectedMaterial || !restockForm.quantity) return;

    try {
      await api.restaurant.rawMaterials.restock(selectedMaterial._id, restockForm);
      toast.success(`Restocked ${selectedMaterial.name}!`);
      setIsRestockModalOpen(false);
      fetchMaterials();
    } catch (err) {
      toast.error(err.message || 'Failed to restock');
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this ingredient?')) return;
    try {
      await api.restaurant.rawMaterials.delete(id);
      toast.success('Ingredient deleted');
      fetchMaterials();
    } catch (err) {
      toast.error('Failed to delete ingredient');
    }
  };

  const categories = [
    { id: 'all', label: 'All Pantry Items' },
    { id: 'meat_poultry', label: 'Meat & Poultry (মাংস)' },
    { id: 'dairy', label: 'Dairy & Cheese (দুগ্ধজাত)' },
    { id: 'produce', label: 'Vegetables & Produce (শাকসবজি)' },
    { id: 'spices_oils', label: 'Spices & Oils (তেল ও মশলা)' },
    { id: 'grains_bakery', label: 'Grains & Bakery (চাল ও আটা)' },
    { id: 'packaging', label: 'Packaging & Boxes (প্যাকেজিং)' },
  ];

  return (
    <div className="space-y-6 font-sans pb-16">
      
      {/* HEADER */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white tracking-tight flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-amber-500/10 text-amber-600 flex items-center justify-center">
              <Package className="w-4 h-4" />
            </div>
            <span>{lang === 'bn' ? 'কাঁচামাল ও রান্নাঘর প্যান্ট্রি স্টক' : 'Raw Materials & Kitchen Pantry Stock'}</span>
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-zinc-400 font-normal mt-0.5">
            {lang === 'bn'
              ? 'মাংস, চাল, মশলা, তেল ও প্যাকেজিং আইটেমগুলির রিয়েল-টাইম মজুত ট্র্যাক করুন।'
              : 'Track raw ingredient quantities, low stock threshold alerts & supplier restocks.'}
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={fetchMaterials}
            className="p-2.5 rounded-xl border border-slate-200 dark:border-zinc-800 hover:bg-slate-100 text-slate-700 dark:text-zinc-300 transition-all cursor-pointer"
          >
            <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
          </button>

          <button
            onClick={() => setIsAddModalOpen(true)}
            className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-[#00df89] hover:bg-[#00c578] text-slate-950 font-bold text-xs shadow-xs transition-all cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>{lang === 'bn' ? 'নতুন কাঁচামাল যোগ করুন' : 'Add Raw Material'}</span>
          </button>
        </div>
      </div>

      {/* FILTER TABS & SEARCH */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 border-b border-slate-200 dark:border-zinc-800 pb-3">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <Input
            placeholder="Search ingredients..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9 h-9.5 text-xs bg-white dark:bg-zinc-900 rounded-xl"
          />
        </div>

        <div className="flex items-center gap-1.5 overflow-x-auto w-full sm:w-auto pb-1 scrollbar-none">
          {categories.map((c) => (
            <button
              key={c.id}
              onClick={() => setSelectedCategory(c.id)}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all cursor-pointer ${
                selectedCategory === c.id
                  ? 'bg-slate-900 text-white dark:bg-white dark:text-slate-900 shadow-xs'
                  : 'bg-slate-100 dark:bg-zinc-800 text-slate-600 dark:text-zinc-400 hover:bg-slate-200'
              }`}
            >
              {c.label}
            </button>
          ))}
        </div>
      </div>

      {/* MATERIALS TABLE */}
      <Card className="p-0 bg-white dark:bg-zinc-900 border-slate-200/80 dark:border-zinc-800 shadow-xs rounded-2xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-slate-50 dark:bg-zinc-800/60 border-b border-slate-200 dark:border-zinc-800 text-slate-500 dark:text-zinc-400 font-semibold">
                <th className="py-3 px-4">Ingredient Name</th>
                <th className="py-3 px-4">Category</th>
                <th className="py-3 px-4">Current Stock</th>
                <th className="py-3 px-4">Unit Cost</th>
                <th className="py-3 px-4">Supplier</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-zinc-800">
              {filteredMaterials.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-slate-400 text-xs">
                    No raw materials found. Click "Add Raw Material" to get started.
                  </td>
                </tr>
              ) : (
                filteredMaterials.map((mat) => {
                  const isLow = mat.current_stock <= mat.min_stock_alert;

                  return (
                    <tr key={mat._id} className="hover:bg-slate-50 dark:hover:bg-zinc-800/40 transition-colors">
                      <td className="py-3 px-4">
                        <div className="font-bold text-slate-900 dark:text-white">
                          {lang === 'bn' && mat.name_bn ? mat.name_bn : mat.name}
                        </div>
                        {lang === 'bn' && mat.name_bn && mat.name !== mat.name_bn && (
                          <div className="text-[10px] text-slate-400">{mat.name}</div>
                        )}
                      </td>

                      <td className="py-3 px-4">
                        <Badge className="capitalize text-[10px] bg-slate-100 dark:bg-zinc-800 text-slate-700 dark:text-zinc-300">
                          {mat.category.replace('_', ' ')}
                        </Badge>
                      </td>

                      <td className="py-3 px-4">
                        <div className="flex items-center gap-1.5">
                          <span className={`font-mono font-bold text-sm ${isLow ? 'text-rose-600' : 'text-slate-900 dark:text-white'}`}>
                            {mat.current_stock} {mat.unit}
                          </span>
                          {isLow && (
                            <Badge className="bg-rose-500/15 text-rose-600 border border-rose-500/30 text-[9px] px-1.5 py-0">
                              Low Stock (&lt;{mat.min_stock_alert})
                            </Badge>
                          )}
                        </div>
                      </td>

                      <td className="py-3 px-4 font-mono font-bold">
                        ৳ {mat.unit_cost} / {mat.unit}
                      </td>

                      <td className="py-3 px-4 text-slate-600 dark:text-zinc-400">
                        {mat.supplier_name || '—'}
                      </td>

                      <td className="py-3 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => {
                              setSelectedMaterial(mat);
                              setRestockForm({ quantity: '', unit_cost: mat.unit_cost, notes: '' });
                              setIsRestockModalOpen(true);
                            }}
                            className="px-2.5 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-[11px] cursor-pointer flex items-center gap-1"
                          >
                            <ArrowDownToLine className="w-3 h-3" />
                            <span>Restock</span>
                          </button>

                          <button
                            onClick={() => handleDelete(mat._id)}
                            className="p-1.5 rounded-lg border border-slate-200 dark:border-zinc-800 text-slate-400 hover:text-rose-600 cursor-pointer"
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

      {/* MODAL 1: ADD RAW MATERIAL */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs">
          <Card className="max-w-md w-full p-6 bg-white dark:bg-[#121215] border-slate-200 dark:border-zinc-800 shadow-2xl rounded-2xl">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-zinc-800 pb-3 mb-4">
              <CardTitle className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <Package className="w-4 h-4 text-amber-500" />
                <span>Add Raw Ingredient</span>
              </CardTitle>
              <button
                onClick={() => setIsAddModalOpen(false)}
                className="text-slate-400 hover:text-white cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreate} className="space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-semibold text-slate-700 dark:text-zinc-300 block mb-1">
                    Ingredient Name *
                  </label>
                  <Input
                    required
                    placeholder="e.g. Basmati Rice"
                    value={form.name}
                    onChange={(e) => setForm({ ...form, name: e.target.value })}
                    className="h-9 text-xs"
                  />
                </div>

                <div>
                  <label className="font-semibold text-slate-700 dark:text-zinc-300 block mb-1">
                    বাংলা নাম
                  </label>
                  <Input
                    placeholder="যেমন: বাসমতি চাল"
                    value={form.name_bn}
                    onChange={(e) => setForm({ ...form, name_bn: e.target.value })}
                    className="h-9 text-xs"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="font-semibold text-slate-700 dark:text-zinc-300 block mb-1">
                    Category
                  </label>
                  <select
                    value={form.category}
                    onChange={(e) => setForm({ ...form, category: e.target.value })}
                    className="w-full h-9 px-2.5 rounded-xl border border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 text-xs"
                  >
                    <option value="meat_poultry">Meat</option>
                    <option value="dairy">Dairy</option>
                    <option value="produce">Produce</option>
                    <option value="spices_oils">Spices</option>
                    <option value="grains_bakery">Grains</option>
                    <option value="packaging">Packaging</option>
                    <option value="general">General</option>
                  </select>
                </div>

                <div>
                  <label className="font-semibold text-slate-700 dark:text-zinc-300 block mb-1">
                    Current Stock
                  </label>
                  <Input
                    type="number"
                    min="0"
                    placeholder="50"
                    value={form.current_stock}
                    onChange={(e) => setForm({ ...form, current_stock: e.target.value })}
                    className="h-9 text-xs font-mono"
                  />
                </div>

                <div>
                  <label className="font-semibold text-slate-700 dark:text-zinc-300 block mb-1">
                    Unit
                  </label>
                  <select
                    value={form.unit}
                    onChange={(e) => setForm({ ...form, unit: e.target.value })}
                    className="w-full h-9 px-2.5 rounded-xl border border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 text-xs"
                  >
                    <option value="kg">kg</option>
                    <option value="g">g</option>
                    <option value="ltr">ltr</option>
                    <option value="ml">ml</option>
                    <option value="pcs">pcs</option>
                    <option value="pack">pack</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-semibold text-slate-700 dark:text-zinc-300 block mb-1">
                    Unit Cost (৳)
                  </label>
                  <Input
                    type="number"
                    min="0"
                    placeholder="150"
                    value={form.unit_cost}
                    onChange={(e) => setForm({ ...form, unit_cost: e.target.value })}
                    className="h-9 text-xs font-mono"
                  />
                </div>

                <div>
                  <label className="font-semibold text-slate-700 dark:text-zinc-300 block mb-1">
                    Low Stock Alert Qty
                  </label>
                  <Input
                    type="number"
                    min="1"
                    value={form.min_stock_alert}
                    onChange={(e) => setForm({ ...form, min_stock_alert: e.target.value })}
                    className="h-9 text-xs font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="font-semibold text-slate-700 dark:text-zinc-300 block mb-1">
                  Supplier Name (Optional)
                </label>
                <Input
                  placeholder="e.g. Fresh Agro Farms"
                  value={form.supplier_name}
                  onChange={(e) => setForm({ ...form, supplier_name: e.target.value })}
                  className="h-9 text-xs"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100 dark:border-zinc-800">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="px-4 py-2 rounded-xl border border-slate-200 text-xs font-semibold cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-[#00df89] text-slate-950 text-xs font-bold shadow-xs hover:bg-[#00c578] cursor-pointer"
                >
                  Save Ingredient
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
                <div className="text-xs text-slate-400">
                  Current: {selectedMaterial.current_stock} {selectedMaterial.unit}
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
                  className="h-10 text-xs font-mono font-bold"
                />
              </div>

              <div>
                <label className="font-semibold text-slate-700 dark:text-zinc-300 block mb-1">
                  Purchase Unit Cost (৳ per {selectedMaterial.unit})
                </label>
                <Input
                  type="number"
                  min="0"
                  value={restockForm.unit_cost}
                  onChange={(e) => setRestockForm({ ...restockForm, unit_cost: e.target.value })}
                  className="h-9 text-xs font-mono"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100 dark:border-zinc-800">
                <button
                  type="button"
                  onClick={() => setIsRestockModalOpen(false)}
                  className="px-4 py-2 rounded-xl border border-slate-200 text-xs font-semibold cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold cursor-pointer"
                >
                  Confirm Restock
                </button>
              </div>
            </form>
          </Card>
        </div>
      )}

    </div>
  );
}
