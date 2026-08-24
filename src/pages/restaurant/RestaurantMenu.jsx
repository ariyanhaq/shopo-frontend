import { useState, useEffect, useMemo } from 'react';
import { useLanguage } from '@/context/LanguageContext';
import { useShop } from '@/context/ShopContext';
import api from '@/services/api';
import toast from 'react-hot-toast';
import { Card, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import {
  Utensils, Plus, Search, Trash2, Edit3, CheckCircle2, X,
  Flame, Clock, DollarSign, Sparkles, RefreshCw, ChefHat
} from 'lucide-react';

export default function RestaurantMenu() {
  const { lang } = useLanguage();
  const { activeShop } = useShop();

  const [menuItems, setMenuItems] = useState([]);
  const [categories, setCategories] = useState(['all']);
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(true);

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState(null);

  // Form State
  const [form, setForm] = useState({
    name: '',
    name_bn: '',
    category: 'Main Course',
    description: '',
    price: '',
    cost_price: '',
    image_url: '',
    is_veg: false,
    is_spicy: false,
    spice_level: 1,
    preparation_time_minutes: 15,
    kitchen_station: 'main_kitchen',
    is_available: true,
    modifiers: [],
  });

  const [newModifierName, setNewModifierName] = useState('');
  const [newModifierPrice, setNewModifierPrice] = useState('');

  const fetchMenu = async () => {
    try {
      setIsLoading(true);
      const res = await api.restaurant.menu.list();
      if (res?.success) {
        setMenuItems(res.data);
        const cats = ['all', ...new Set(res.data.map((m) => m.category).filter(Boolean))];
        setCategories(cats);
      }
    } catch (err) {
      console.error('Failed to load menu:', err);
      toast.error('Failed to load food menu');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchMenu();
  }, [activeShop]);

  const filteredItems = useMemo(() => {
    return menuItems.filter((it) => {
      const matchesCat = selectedCategory === 'all' || it.category === selectedCategory;
      const q = searchQuery.toLowerCase().trim();
      const matchesSearch =
        !q ||
        it.name.toLowerCase().includes(q) ||
        (it.name_bn && it.name_bn.toLowerCase().includes(q)) ||
        it.category.toLowerCase().includes(q);
      return matchesCat && matchesSearch;
    });
  }, [menuItems, selectedCategory, searchQuery]);

  const handleOpenAddModal = () => {
    setEditingItem(null);
    setForm({
      name: '',
      name_bn: '',
      category: 'Main Course',
      description: '',
      price: '',
      cost_price: '',
      image_url: '',
      is_veg: false,
      is_spicy: false,
      spice_level: 1,
      preparation_time_minutes: 15,
      kitchen_station: 'main_kitchen',
      is_available: true,
      modifiers: [],
    });
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (item) => {
    setEditingItem(item);
    setForm({
      name: item.name || '',
      name_bn: item.name_bn || '',
      category: item.category || 'Main Course',
      description: item.description || '',
      price: item.price || '',
      cost_price: item.cost_price || '',
      image_url: item.image_url || '',
      is_veg: Boolean(item.is_veg),
      is_spicy: Boolean(item.is_spicy),
      spice_level: item.spice_level || 1,
      preparation_time_minutes: item.preparation_time_minutes || 15,
      kitchen_station: item.kitchen_station || 'main_kitchen',
      is_available: item.is_available !== false,
      modifiers: item.modifiers || [],
    });
    setIsModalOpen(true);
  };

  const handleAddModifier = () => {
    if (!newModifierName.trim()) return;
    setForm({
      ...form,
      modifiers: [
        ...form.modifiers,
        { name: newModifierName.trim(), price: Number(newModifierPrice) || 0 },
      ],
    });
    setNewModifierName('');
    setNewModifierPrice('');
  };

  const handleRemoveModifier = (index) => {
    setForm({
      ...form,
      modifiers: form.modifiers.filter((_, i) => i !== index),
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.name.trim()) {
      toast.error('Dish name is required');
      return;
    }
    if (!form.price || Number(form.price) < 0) {
      toast.error('Valid selling price is required');
      return;
    }

    try {
      if (editingItem) {
        await api.restaurant.menu.update(editingItem._id, form);
        toast.success('Dish updated successfully!');
      } else {
        await api.restaurant.menu.create(form);
        toast.success('Dish added to menu!');
      }
      setIsModalOpen(false);
      fetchMenu();
    } catch (err) {
      toast.error(err.message || 'Failed to save menu item');
    }
  };

  const handleToggleAvailability = async (item) => {
    try {
      await api.restaurant.menu.update(item._id, { is_available: !item.is_available });
      toast.success(`${item.name} is now ${!item.is_available ? 'Available' : 'Sold Out'}`);
      fetchMenu();
    } catch (err) {
      toast.error('Failed to update availability');
    }
  };

  const handleDeleteItem = async (itemId) => {
    if (!window.confirm('Are you sure you want to remove this dish from the menu?')) return;
    try {
      await api.restaurant.menu.delete(itemId);
      toast.success('Dish deleted from menu');
      fetchMenu();
    } catch (err) {
      toast.error(err.message || 'Failed to delete dish');
    }
  };

  return (
    <div className="space-y-6 font-sans pb-16">
      
      {/* HEADER */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white tracking-tight flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-orange-500/10 text-orange-600 flex items-center justify-center">
              <Utensils className="w-4 h-4" />
            </div>
            <span>{lang === 'bn' ? 'খাবার মেনু ও রেসিপি ক্যাটালগ' : 'Food Menu & Category Catalog'}</span>
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-zinc-400 font-normal mt-0.5">
            {lang === 'bn'
              ? 'খাবারের আইটেম, মূল্য, ভেজ/নন-ভেজ ট্যাগ, স্পাইসি লেভেল এবং অ্যাড-অনস পরিচালনা করুন।'
              : 'Manage restaurant dishes, pricing, dietary tags, kitchen stations & modifier add-ons.'}
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={fetchMenu}
            className="p-2.5 rounded-xl border border-slate-200 dark:border-zinc-800 hover:bg-slate-100 dark:hover:bg-zinc-800 text-slate-700 dark:text-zinc-300 transition-all cursor-pointer"
          >
            <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
          </button>

          <button
            onClick={handleOpenAddModal}
            className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-[#00df89] hover:bg-[#00c578] text-slate-950 font-bold text-xs shadow-xs transition-all cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>{lang === 'bn' ? 'নতুন খাবার যুক্ত করুন' : 'Add New Dish'}</span>
          </button>
        </div>
      </div>

      {/* SEARCH & CATEGORY PILLS */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 border-b border-slate-200 dark:border-zinc-800 pb-3">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <Input
            placeholder="Search menu by name or category..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9 h-9.5 text-xs bg-white dark:bg-zinc-900 rounded-xl"
          />
        </div>

        <div className="flex items-center gap-1.5 overflow-x-auto w-full sm:w-auto pb-1 scrollbar-none">
          {categories.map((c) => (
            <button
              key={c}
              onClick={() => setSelectedCategory(c)}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all cursor-pointer capitalize ${
                selectedCategory === c
                  ? 'bg-slate-900 text-white dark:bg-white dark:text-slate-900 shadow-xs'
                  : 'bg-slate-100 dark:bg-zinc-800 text-slate-600 dark:text-zinc-400 hover:bg-slate-200'
              }`}
            >
              {c === 'all' ? 'All Dishes' : c}
            </button>
          ))}
        </div>
      </div>

      {/* MENU ITEMS GRID */}
      {isLoading ? (
        <div className="text-center py-20 text-xs text-slate-400">Loading menu...</div>
      ) : filteredItems.length === 0 ? (
        <div className="text-center py-20 bg-white dark:bg-zinc-900 rounded-2xl border border-dashed border-slate-200 dark:border-zinc-800 p-8">
          <Utensils className="w-10 h-10 mx-auto text-slate-300 dark:text-zinc-600 mb-2" />
          <div className="text-sm font-bold text-slate-900 dark:text-white">No Dishes Found</div>
          <button
            onClick={handleOpenAddModal}
            className="mt-4 px-4 py-2 rounded-xl bg-[#00df89] text-slate-950 font-bold text-xs cursor-pointer inline-flex items-center gap-1.5"
          >
            <Plus className="w-4 h-4" />
            <span>Add First Dish</span>
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {filteredItems.map((dish) => {
            const isSoldOut = dish.is_available === false;

            return (
              <Card
                key={dish._id}
                className={`p-4 rounded-2xl border transition-all relative overflow-hidden bg-white dark:bg-zinc-900 border-slate-200/80 dark:border-zinc-800 shadow-xs hover:shadow-md flex flex-col justify-between ${
                  isSoldOut ? 'opacity-60 bg-slate-50 dark:bg-zinc-900/60' : ''
                }`}
              >
                <div>
                  <div className="flex items-start justify-between gap-2">
                    <span className="text-[10px] uppercase font-bold text-slate-400">
                      {dish.category}
                    </span>

                    <div className="flex items-center gap-1">
                      {dish.is_veg && (
                        <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-bold bg-emerald-500/10 px-1.5 py-0.5 rounded-md">
                          🌱 Veg
                        </span>
                      )}
                      {dish.is_spicy && (
                        <span className="text-[10px] text-rose-500 font-bold bg-rose-500/10 px-1.5 py-0.5 rounded-md">
                          🌶️ {dish.spice_level}x
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="font-bold text-sm text-slate-900 dark:text-white mt-1">
                    {lang === 'bn' && dish.name_bn ? dish.name_bn : dish.name}
                  </div>

                  {lang === 'bn' && dish.name_bn && dish.name !== dish.name_bn && (
                    <div className="text-[11px] text-slate-400 font-medium">
                      {dish.name}
                    </div>
                  )}

                  {dish.description && (
                    <p className="text-[11px] text-slate-500 dark:text-zinc-400 mt-1.5 line-clamp-2">
                      {dish.description}
                    </p>
                  )}

                  {dish.modifiers && dish.modifiers.length > 0 && (
                    <div className="mt-2 text-[10px] text-orange-600 dark:text-orange-400">
                      + {dish.modifiers.length} add-on options available
                    </div>
                  )}
                </div>

                <div className="mt-4 pt-3 border-t border-slate-100 dark:border-zinc-800">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="font-mono font-black text-base text-slate-900 dark:text-white">
                        ৳ {dish.price?.toLocaleString()}
                      </div>
                      {dish.cost_price > 0 && (
                        <div className="text-[10px] text-slate-400">
                          Cost: ৳{dish.cost_price}
                        </div>
                      )}
                    </div>

                    {/* Availability switch & Actions */}
                    <div className="flex items-center gap-1.5">
                      <button
                        onClick={() => handleToggleAvailability(dish)}
                        className={`px-2 py-1 rounded-lg text-[10px] font-bold cursor-pointer transition-all ${
                          isSoldOut
                            ? 'bg-rose-500/15 text-rose-600 border border-rose-500/30'
                            : 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border border-emerald-500/30'
                        }`}
                        title="Toggle availability"
                      >
                        {isSoldOut ? 'Sold Out' : 'Active'}
                      </button>

                      <button
                        onClick={() => handleOpenEditModal(dish)}
                        className="p-1.5 rounded-lg border border-slate-200 dark:border-zinc-800 hover:bg-slate-100 text-slate-600 dark:text-zinc-400 cursor-pointer"
                        title="Edit"
                      >
                        <Edit3 className="w-3.5 h-3.5" />
                      </button>

                      <button
                        onClick={() => handleDeleteItem(dish._id)}
                        className="p-1.5 rounded-lg border border-slate-200 dark:border-zinc-800 hover:bg-rose-50 hover:text-rose-600 text-slate-400 cursor-pointer"
                        title="Delete"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      )}

      {/* ---------------------------------------------------- */}
      {/* MODAL: ADD / EDIT DISH                               */}
      {/* ---------------------------------------------------- */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs">
          <Card className="max-w-xl w-full p-6 bg-white dark:bg-[#121215] border-slate-200 dark:border-zinc-800 shadow-2xl rounded-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-zinc-800 pb-3 mb-4">
              <CardTitle className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <ChefHat className="w-4 h-4 text-orange-500" />
                <span>{editingItem ? 'Edit Dish' : 'Add New Dish to Menu'}</span>
              </CardTitle>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-slate-400 hover:text-white cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-semibold text-slate-700 dark:text-zinc-300 block mb-1">
                    Dish Name (English) *
                  </label>
                  <Input
                    required
                    placeholder="e.g. Chicken Kacchi Biryani"
                    value={form.name}
                    onChange={(e) => setForm({ ...form, name: e.target.value })}
                    className="h-9.5 text-xs"
                  />
                </div>

                <div>
                  <label className="font-semibold text-slate-700 dark:text-zinc-300 block mb-1">
                    Dish Name (বাংলা)
                  </label>
                  <Input
                    placeholder="যেমন: চিকেন কাচ্চি বিরিয়ানি"
                    value={form.name_bn}
                    onChange={(e) => setForm({ ...form, name_bn: e.target.value })}
                    className="h-9.5 text-xs"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="font-semibold text-slate-700 dark:text-zinc-300 block mb-1">
                    Category
                  </label>
                  <Input
                    required
                    placeholder="e.g. Main Course"
                    value={form.category}
                    onChange={(e) => setForm({ ...form, category: e.target.value })}
                    className="h-9.5 text-xs"
                  />
                </div>

                <div>
                  <label className="font-semibold text-slate-700 dark:text-zinc-300 block mb-1">
                    Selling Price (৳) *
                  </label>
                  <Input
                    type="number"
                    min="0"
                    required
                    placeholder="450"
                    value={form.price}
                    onChange={(e) => setForm({ ...form, price: e.target.value })}
                    className="h-9.5 text-xs font-mono font-bold"
                  />
                </div>

                <div>
                  <label className="font-semibold text-slate-700 dark:text-zinc-300 block mb-1">
                    Food Cost (৳)
                  </label>
                  <Input
                    type="number"
                    min="0"
                    placeholder="200"
                    value={form.cost_price}
                    onChange={(e) => setForm({ ...form, cost_price: e.target.value })}
                    className="h-9.5 text-xs font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-semibold text-slate-700 dark:text-zinc-300 block mb-1">
                    Kitchen Station
                  </label>
                  <select
                    value={form.kitchen_station}
                    onChange={(e) => setForm({ ...form, kitchen_station: e.target.value })}
                    className="w-full h-9.5 px-3 rounded-xl border border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 text-xs font-medium"
                  >
                    <option value="main_kitchen">Main Kitchen / Curry</option>
                    <option value="grill_tandoor">Grill & Tandoor Station</option>
                    <option value="beverage_bar">Juice & Beverage Bar</option>
                    <option value="bakery_dessert">Bakery & Dessert</option>
                  </select>
                </div>

                <div>
                  <label className="font-semibold text-slate-700 dark:text-zinc-300 block mb-1">
                    Prep Time (Minutes)
                  </label>
                  <Input
                    type="number"
                    min="1"
                    value={form.preparation_time_minutes}
                    onChange={(e) => setForm({ ...form, preparation_time_minutes: e.target.value })}
                    className="h-9.5 text-xs font-mono"
                  />
                </div>
              </div>

              {/* Toggles: Veg, Spicy */}
              <div className="flex items-center gap-6 p-3 bg-slate-50 dark:bg-zinc-800/40 rounded-xl border border-slate-200/80 dark:border-zinc-800">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={form.is_veg}
                    onChange={(e) => setForm({ ...form, is_veg: e.target.checked })}
                    className="w-4 h-4 accent-emerald-500 rounded"
                  />
                  <span className="font-semibold">🌱 Vegetarian Dish</span>
                </label>

                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={form.is_spicy}
                    onChange={(e) => setForm({ ...form, is_spicy: e.target.checked })}
                    className="w-4 h-4 accent-rose-500 rounded"
                  />
                  <span className="font-semibold">🌶️ Spicy Item</span>
                </label>
              </div>

              {/* Modifiers / Add-ons Builder */}
              <div className="space-y-2 pt-2 border-t border-slate-100 dark:border-zinc-800">
                <label className="font-semibold text-slate-700 dark:text-zinc-300 block">
                  Add-on Options / Extras (e.g. Extra Cheese, Side Sauce):
                </label>

                <div className="flex items-center gap-2">
                  <Input
                    placeholder="Addon name (e.g. Extra Cheese)"
                    value={newModifierName}
                    onChange={(e) => setNewModifierName(e.target.value)}
                    className="h-8 text-xs flex-1"
                  />
                  <Input
                    type="number"
                    placeholder="Price ৳"
                    value={newModifierPrice}
                    onChange={(e) => setNewModifierPrice(e.target.value)}
                    className="h-8 text-xs w-24 font-mono"
                  />
                  <button
                    type="button"
                    onClick={handleAddModifier}
                    className="px-3 py-1.5 rounded-xl bg-orange-500 text-white font-bold text-xs cursor-pointer"
                  >
                    Add
                  </button>
                </div>

                <div className="flex flex-wrap gap-2 pt-1">
                  {form.modifiers.map((mod, i) => (
                    <span
                      key={i}
                      className="px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-zinc-800 text-xs font-semibold flex items-center gap-1.5"
                    >
                      <span>{mod.name} (+৳{mod.price})</span>
                      <button
                        type="button"
                        onClick={() => handleRemoveModifier(i)}
                        className="text-rose-500 hover:text-rose-700"
                      >
                        ×
                      </button>
                    </span>
                  ))}
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100 dark:border-zinc-800">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 rounded-xl border border-slate-200 text-xs font-semibold cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-[#00df89] text-slate-950 text-xs font-bold shadow-xs hover:bg-[#00c578] cursor-pointer"
                >
                  {editingItem ? 'Update Dish' : 'Add to Menu'}
                </button>
              </div>
            </form>
          </Card>
        </div>
      )}

    </div>
  );
}
