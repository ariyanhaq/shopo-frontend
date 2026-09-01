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
import ProductImageUploader from '@/components/common/ProductImageUploader';
import {
  Utensils, Plus, Search, Trash2, Edit3, CheckCircle2, X,
  Flame, Clock, DollarSign, Sparkles, RefreshCw, ChefHat, Loader2, Leaf, Image as ImageIcon,
  BookOpen, Percent, ChevronDown, Package, Droplets, TrendingUp, Coins, Info
} from 'lucide-react';

const DEFAULT_CATEGORIES = [
  'Main Course',
  'Bottled Water & Soda',
  'Beverages & Juice',
  'Packaged Beverages',
  'Appetizers',
  'Biryani & Rice',
  'Fast Food & Burger',
  'Curry & Gravy',
  'Bakery & Dessert',
  'Desserts & Ice Cream',
  'Breakfast & Snacks',
  'Soup & Salad',
  'Breads & Naan',
];

export default function RestaurantMenu() {
  const { lang } = useLanguage();
  const { activeShop } = useShop();

  const [menuItems, setMenuItems] = useState([]);
  const [rawMaterials, setRawMaterials] = useState([]);
  const [categories, setCategories] = useState(['all']);
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(true);

  // Deleting State (Confirm Dialog)
  const [deletingDish, setDeletingDish] = useState(null);
  const [isDeletingDish, setIsDeletingDish] = useState(false);

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSavingDish, setIsSavingDish] = useState(false);
  const [editingItem, setEditingItem] = useState(null);

  // Category State
  const [customCategories, setCustomCategories] = useState([]);
  const [isAddingNewCategory, setIsAddingNewCategory] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState('');

  // Form State
  const [form, setForm] = useState({
    name: '',
    name_bn: '',
    category: 'Main Course',
    description: '',
    item_type: 'prepared_dish', // 'prepared_dish' | 'resale_product'
    supplier_name: '',
    price: '',
    cost_price: 0,
    image_url: '',
    is_veg: false,
    is_spicy: false,
    spice_level: 1,
    preparation_time_minutes: 15,
    kitchen_station: 'main_kitchen',
    is_available: true,
    modifiers: [],
    recipe_ingredients: [],
  });

  const [newModifierName, setNewModifierName] = useState('');
  const [newModifierPrice, setNewModifierPrice] = useState('');

  // Recipe Builder State (Inside Modal)
  const [selectedRecipeRawId, setSelectedRecipeRawId] = useState('');
  const [recipeIngredientQty, setRecipeIngredientQty] = useState('');
  const [recipeIngredientUnit, setRecipeIngredientUnit] = useState('g');

  const totalRecipeCost = useMemo(() => {
    return (form.recipe_ingredients || []).reduce(
      (sum, ing) => sum + Number(ing.unit_cost || 0),
      0
    );
  }, [form.recipe_ingredients]);

  const effectiveCostPrice = useMemo(() => {
    if (form.item_type === 'resale_product') {
      return Number(form.cost_price) || 0;
    }
    return totalRecipeCost > 0 ? totalRecipeCost : (Number(form.cost_price) || 0);
  }, [form.item_type, form.cost_price, totalRecipeCost]);

  const grossProfit = useMemo(() => {
    const price = Number(form.price) || 0;
    return Math.max(0, price - effectiveCostPrice);
  }, [form.price, effectiveCostPrice]);

  const marginPercent = useMemo(() => {
    const price = Number(form.price) || 0;
    return price > 0 ? Math.round(((price - effectiveCostPrice) / price) * 100) : 0;
  }, [form.price, effectiveCostPrice]);

  const handleAddRecipeIngredient = () => {
    if (!selectedRecipeRawId || !recipeIngredientQty || Number(recipeIngredientQty) <= 0) {
      toast.error('Please select an ingredient and enter a valid quantity');
      return;
    }

    const raw = rawMaterials.find((r) => r._id === selectedRecipeRawId);
    if (!raw) return;

    const qty = Number(recipeIngredientQty);
    const unitCost = Number(raw.unit_cost || 0);
    let calculatedCost = 0;

    if (raw.unit === 'kg' && recipeIngredientUnit === 'g') {
      calculatedCost = (unitCost / 1000) * qty;
    } else if (raw.unit === 'g' && recipeIngredientUnit === 'kg') {
      calculatedCost = unitCost * 1000 * qty;
    } else if (raw.unit === 'ltr' && recipeIngredientUnit === 'ml') {
      calculatedCost = (unitCost / 1000) * qty;
    } else if (raw.unit === 'ml' && recipeIngredientUnit === 'ltr') {
      calculatedCost = unitCost * 1000 * qty;
    } else {
      calculatedCost = unitCost * qty;
    }

    const roundedCost = Math.round(calculatedCost * 100) / 100;

    setForm((prev) => ({
      ...prev,
      recipe_ingredients: [
        ...(prev.recipe_ingredients || []),
        {
          raw_material_id: raw._id,
          name: raw.name,
          quantity: qty,
          unit: recipeIngredientUnit || raw.unit,
          unit_cost: roundedCost,
        },
      ],
    }));

    setSelectedRecipeRawId('');
    setRecipeIngredientQty('');
  };

  const handleRemoveRecipeIngredient = (index) => {
    setForm((prev) => ({
      ...prev,
      recipe_ingredients: (prev.recipe_ingredients || []).filter((_, i) => i !== index),
    }));
  };

  const allCategoryOptions = useMemo(() => {
    const existing = menuItems.map((m) => m.category).filter(Boolean);
    return Array.from(new Set([...DEFAULT_CATEGORIES, ...existing, ...customCategories]));
  }, [menuItems, customCategories]);

  const handleAddNewCategory = () => {
    const trimmed = newCategoryName.trim();
    if (!trimmed) {
      toast.error('Please enter a category name');
      return;
    }
    if (!allCategoryOptions.includes(trimmed)) {
      setCustomCategories((prev) => [...prev, trimmed]);
    }
    setForm((prev) => ({ ...prev, category: trimmed }));
    setNewCategoryName('');
    setIsAddingNewCategory(false);
    toast.success(`Category "${trimmed}" selected!`);
  };

  const fetchMenu = async () => {
    try {
      setIsLoading(true);
      const [menuRes, rawRes] = await Promise.all([
        api.restaurant.menu.list(),
        api.restaurant.rawMaterials.list(),
      ]);
      if (menuRes?.success) {
        setMenuItems(menuRes.data);
        const cats = ['all', ...new Set(menuRes.data.map((m) => m.category).filter(Boolean))];
        setCategories(cats);
      }
      if (rawRes?.success) {
        setRawMaterials(rawRes.data);
      }
    } catch (err) {
      console.error('Failed to load menu data:', err);
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

  const handleOpenAddModal = (presetType = 'prepared_dish') => {
    setEditingItem(null);
    setForm({
      name: '',
      name_bn: '',
      category: presetType === 'resale_product' ? 'Bottled Water & Soda' : 'Main Course',
      description: '',
      item_type: presetType,
      supplier_name: '',
      price: '',
      cost_price: '',
      purchase_quantity: 1,
      payment_method: 'Cash',
      image_url: '',
      is_veg: presetType === 'resale_product',
      is_spicy: false,
      spice_level: 1,
      preparation_time_minutes: presetType === 'resale_product' ? 1 : 15,
      kitchen_station: presetType === 'resale_product' ? 'beverage_bar' : 'main_kitchen',
      is_available: true,
      modifiers: [],
      recipe_ingredients: [],
    });
    setSelectedRecipeRawId('');
    setRecipeIngredientQty('');
    setRecipeIngredientUnit('g');
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (item) => {
    setEditingItem(item);
    setForm({
      name: item.name || '',
      name_bn: item.name_bn || '',
      category: item.category || (item.item_type === 'resale_product' ? 'Bottled Water & Soda' : 'Main Course'),
      description: item.description || '',
      item_type: item.item_type || 'prepared_dish',
      supplier_name: item.supplier_name || '',
      price: item.price || '',
      cost_price: item.cost_price !== undefined ? item.cost_price : '',
      purchase_quantity: 1,
      payment_method: 'Cash',
      image_url: item.image_url || '',
      is_veg: Boolean(item.is_veg),
      is_spicy: Boolean(item.is_spicy),
      spice_level: item.spice_level || 1,
      preparation_time_minutes: item.preparation_time_minutes || (item.item_type === 'resale_product' ? 1 : 15),
      kitchen_station: item.kitchen_station || (item.item_type === 'resale_product' ? 'beverage_bar' : 'main_kitchen'),
      is_available: item.is_available !== false,
      modifiers: item.modifiers || [],
      recipe_ingredients: item.recipe_ingredients || [],
    });
    setSelectedRecipeRawId('');
    setRecipeIngredientQty('');
    setRecipeIngredientUnit('g');
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
      toast.error('Dish / product name is required');
      return;
    }
    if (!form.price || Number(form.price) < 0) {
      toast.error('Valid selling price is required');
      return;
    }

    setIsSavingDish(true);
    const finalCostPrice = form.item_type === 'resale_product'
      ? (Number(form.cost_price) || 0)
      : (totalRecipeCost > 0 ? totalRecipeCost : (Number(form.cost_price) || 0));

    const payload = {
      ...form,
      cost_price: finalCostPrice,
      purchase_quantity: Number(form.purchase_quantity || 1),
      payment_method: form.payment_method || 'Cash',
      recipe_ingredients: form.item_type === 'resale_product' ? [] : (form.recipe_ingredients || []),
    };

    try {
      if (editingItem) {
        await api.restaurant.menu.update(editingItem._id, payload);
        toast.success(form.item_type === 'resale_product' ? 'Product updated successfully!' : 'Dish updated successfully!');
      } else {
        await api.restaurant.menu.create(payload);
        if (form.item_type === 'resale_product' && finalCostPrice > 0) {
          const totalExp = finalCostPrice * Math.max(1, Number(form.purchase_quantity || 1));
          toast.success(`Resale product added! Recorded ৳${totalExp.toLocaleString()} under Expenses & P&L.`);
        } else {
          toast.success(form.item_type === 'resale_product' ? 'Resale product added to menu!' : 'Dish added to menu!');
        }
      }
      setIsModalOpen(false);
      fetchMenu();
    } catch (err) {
      toast.error(err.message || 'Failed to save menu item');
    } finally {
      setIsSavingDish(false);
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

  const handleDeleteItem = (dish) => {
    setDeletingDish(dish);
  };

  const confirmDeleteDish = async () => {
    if (!deletingDish?._id) return;
    setIsDeletingDish(true);
    try {
      await api.restaurant.menu.delete(deletingDish._id);
      toast.success(lang === 'bn' ? 'মেনু আইটেম মুছে ফেলা হয়েছে' : 'Dish deleted from menu');
      setDeletingDish(null);
      fetchMenu();
    } catch (err) {
      toast.error(err.message || 'Failed to delete dish');
    } finally {
      setIsDeletingDish(false);
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
            title="Refresh menu"
          >
            <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
          </button>

          <button
            onClick={() => handleOpenAddModal('resale_product')}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-blue-500/10 hover:bg-blue-500/20 text-blue-600 dark:text-blue-400 border border-blue-500/20 font-bold text-xs transition-all cursor-pointer shadow-2xs"
          >
            <Package className="w-3.5 h-3.5" />
            <span>{lang === 'bn' ? '+ সাপ্লায়ার পণ্য (পানি/ড্রিংকস)' : '+ Add Resale Item (Water/Drinks)'}</span>
          </button>

          <button
            onClick={() => handleOpenAddModal('prepared_dish')}
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
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
            <div key={i} className="p-4 rounded-2xl border border-slate-200/80 dark:border-zinc-800 bg-white dark:bg-zinc-900 space-y-3 shadow-2xs">
              <div className="flex justify-between items-center">
                <Skeleton className="h-3.5 w-16 rounded" />
                <Skeleton className="h-4 w-12 rounded" />
              </div>
              <div className="space-y-1 py-1">
                <Skeleton className="h-5 w-32 rounded-md" />
                <Skeleton className="h-3.5 w-24 rounded" />
              </div>
              <div className="flex justify-between items-center pt-2 border-t border-slate-100 dark:border-zinc-800">
                <Skeleton className="h-5 w-16 rounded" />
                <Skeleton className="h-8 w-16 rounded-xl" />
              </div>
            </div>
          ))}
        </div>
      ) : filteredItems.length === 0 ? (
        <div className="text-center py-20 bg-white dark:bg-zinc-900 rounded-2xl border border-dashed border-slate-200 dark:border-zinc-800 p-8">
          <Utensils className="w-10 h-10 mx-auto text-slate-300 dark:text-zinc-600 mb-2" />
          <div className="text-sm font-bold text-slate-900 dark:text-white">No Items Found</div>
          <div className="flex items-center justify-center gap-2 mt-4">
            <button
              onClick={() => handleOpenAddModal('prepared_dish')}
              className="px-4 py-2 rounded-xl bg-[#00df89] text-slate-950 font-bold text-xs cursor-pointer inline-flex items-center gap-1.5"
            >
              <Plus className="w-4 h-4" />
              <span>Add First Dish</span>
            </button>
            <button
              onClick={() => handleOpenAddModal('resale_product')}
              className="px-4 py-2 rounded-xl bg-blue-500/10 text-blue-600 dark:text-blue-400 font-bold text-xs cursor-pointer inline-flex items-center gap-1.5 border border-blue-500/20"
            >
              <Package className="w-4 h-4" />
              <span>Add Water / Resale Product</span>
            </button>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {filteredItems.map((dish) => {
            const isSoldOut = dish.is_available === false;
            const isResale = dish.item_type === 'resale_product';
            const dishMargin = dish.price > 0 && dish.cost_price > 0
              ? Math.round(((dish.price - dish.cost_price) / dish.price) * 100)
              : null;

            return (
              <Card
                key={dish._id}
                className={`rounded-2xl border transition-all relative overflow-hidden bg-white dark:bg-zinc-900 border-slate-200/80 dark:border-zinc-800 shadow-xs hover:shadow-md flex flex-col justify-between group ${
                  isSoldOut ? 'opacity-60 bg-slate-50 dark:bg-zinc-900/60' : ''
                }`}
              >
                <div>
                  {/* Dish Image (ImgBB) */}
                  {dish.image_url ? (
                    <div className="w-full h-36 overflow-hidden bg-slate-100 dark:bg-zinc-800 border-b border-slate-100 dark:border-zinc-800 relative">
                      <img
                        src={dish.image_url}
                        alt={dish.name}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                        onError={(e) => { e.target.style.display = 'none'; }}
                      />
                      <div className="absolute top-2.5 left-2.5 flex items-center gap-1">
                        <span className="text-[10px] uppercase font-bold text-slate-800 dark:text-zinc-200 bg-white/90 dark:bg-zinc-900/90 backdrop-blur-xs px-2 py-0.5 rounded-md shadow-2xs border border-slate-200/50 dark:border-zinc-700/50">
                          {dish.category}
                        </span>
                        {isResale && (
                          <span className="text-[10px] font-bold text-blue-600 dark:text-blue-400 bg-blue-500/90 text-white backdrop-blur-xs px-1.5 py-0.5 rounded-md shadow-2xs flex items-center gap-0.5">
                            <Package className="w-2.5 h-2.5" />
                            <span>Resale</span>
                          </span>
                        )}
                      </div>
                    </div>
                  ) : null}

                  <div className="p-4 pb-0">
                    {!dish.image_url && (
                      <div className="flex items-start justify-between gap-2 mb-1.5">
                        <div className="flex items-center gap-1">
                          <span className="text-[10px] uppercase font-bold text-slate-400 dark:text-zinc-500">
                            {dish.category}
                          </span>
                          {isResale && (
                            <span className="text-[9px] font-bold text-blue-600 dark:text-blue-400 bg-blue-500/10 px-1.5 py-0.2 rounded-md flex items-center gap-0.5">
                              <Package className="w-2.5 h-2.5" />
                              <span>Resale</span>
                            </span>
                          )}
                        </div>

                        <div className="flex items-center gap-1">
                          {dish.is_veg && (
                            <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-bold bg-emerald-500/10 px-1.5 py-0.5 rounded-md flex items-center gap-1">
                              <Leaf className="w-2.5 h-2.5" />
                              <span>Veg</span>
                            </span>
                          )}
                          {dish.is_spicy && (
                            <span className="text-[10px] text-rose-500 font-bold bg-rose-500/10 px-1.5 py-0.5 rounded-md flex items-center gap-1">
                              <Flame className="w-2.5 h-2.5" />
                              <span>{dish.spice_level}x</span>
                            </span>
                          )}
                        </div>
                      </div>
                    )}

                    {dish.image_url && (
                      <div className="flex items-center gap-1 mb-1.5">
                        {dish.is_veg && (
                          <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-bold bg-emerald-500/10 px-1.5 py-0.5 rounded-md flex items-center gap-1">
                            <Leaf className="w-2.5 h-2.5" />
                            <span>Veg</span>
                          </span>
                        )}
                        {dish.is_spicy && (
                          <span className="text-[10px] text-rose-500 font-bold bg-rose-500/10 px-1.5 py-0.5 rounded-md flex items-center gap-1">
                            <Flame className="w-2.5 h-2.5" />
                            <span>{dish.spice_level}x</span>
                          </span>
                        )}
                      </div>
                    )}

                    <div className="font-bold text-sm text-slate-900 dark:text-white flex items-center justify-between gap-1">
                      <span>{lang === 'bn' && dish.name_bn ? dish.name_bn : dish.name}</span>
                    </div>

                    {lang === 'bn' && dish.name_bn && dish.name !== dish.name_bn && (
                      <div className="text-[11px] text-slate-400 font-medium">
                        {dish.name}
                      </div>
                    )}

                    {dish.supplier_name && (
                      <div className="text-[10px] font-semibold text-blue-600 dark:text-blue-400 mt-0.5 flex items-center gap-1">
                        <span>Brand / Supplier: {dish.supplier_name}</span>
                      </div>
                    )}

                    {dish.description && (
                      <p className="text-[11px] text-slate-500 dark:text-zinc-400 mt-1 line-clamp-2">
                        {dish.description}
                      </p>
                    )}

                    {dish.modifiers && dish.modifiers.length > 0 && (
                      <div className="mt-2 text-[10px] font-semibold text-orange-600 dark:text-orange-400 flex items-center gap-1">
                        <Sparkles className="w-2.5 h-2.5 inline" />
                        <span>+{dish.modifiers.length} add-on options</span>
                      </div>
                    )}
                  </div>
                </div>

                <div className="p-4 pt-3 mt-3 border-t border-slate-100 dark:border-zinc-800">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="font-mono font-black text-base text-slate-900 dark:text-white">
                        ৳ {dish.price?.toLocaleString()}
                      </div>
                      <div className="flex items-center gap-1.5">
                        {dish.cost_price > 0 && (
                          <span className="text-[10px] text-slate-400 font-mono">
                            Cost: ৳{dish.cost_price}
                          </span>
                        )}
                        {dishMargin !== null && (
                          <span className={`text-[9px] font-bold px-1 rounded ${
                            dishMargin >= 50 ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400' : 'bg-slate-100 dark:bg-zinc-800 text-slate-600 dark:text-zinc-400'
                          }`}>
                            {dishMargin}% margin
                          </span>
                        )}
                      </div>
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
                        className="p-1.5 rounded-lg border border-slate-200 dark:border-zinc-800 hover:bg-slate-100 text-slate-600 dark:text-zinc-400 cursor-pointer transition-colors"
                        title="Edit"
                      >
                        <Edit3 className="w-3.5 h-3.5" />
                      </button>

                      <button
                        onClick={() => handleDeleteItem(dish)}
                        className="p-1.5 rounded-lg border border-slate-200 dark:border-zinc-800 hover:bg-rose-50 hover:text-rose-600 text-slate-400 cursor-pointer transition-colors"
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
      {/* MODAL: ADD / EDIT DISH OR RESALE PRODUCT              */}
      {/* ---------------------------------------------------- */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs">
          <Card className="max-w-xl w-full p-6 bg-white dark:bg-[#121215] border-slate-200 dark:border-zinc-800 shadow-2xl rounded-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-zinc-800 pb-3 mb-4">
              <CardTitle className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                {form.item_type === 'resale_product' ? (
                  <Package className="w-4 h-4 text-blue-500" />
                ) : (
                  <ChefHat className="w-4 h-4 text-orange-500" />
                )}
                <span>
                  {editingItem
                    ? (form.item_type === 'resale_product' ? 'Edit Resale Product' : 'Edit Dish')
                    : (form.item_type === 'resale_product' ? 'Add Supplier Resale Product' : 'Add New Dish to Menu')}
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
              {/* SOURCING TYPE SEGMENTED TOGGLE */}
              <div className="p-1 bg-slate-100 dark:bg-zinc-850 rounded-2xl flex items-center gap-1 border border-slate-200/80 dark:border-zinc-800">
                <button
                  type="button"
                  onClick={() => {
                    setForm(prev => ({
                      ...prev,
                      item_type: 'prepared_dish',
                      category: prev.category === 'Bottled Water & Soda' ? 'Main Course' : prev.category,
                      kitchen_station: prev.kitchen_station === 'beverage_bar' && prev.category !== 'Beverages & Juice' ? 'main_kitchen' : prev.kitchen_station,
                      preparation_time_minutes: prev.preparation_time_minutes === 1 ? 15 : prev.preparation_time_minutes
                    }));
                  }}
                  className={`flex-1 py-2 px-3 rounded-xl font-bold text-xs flex items-center justify-center gap-2 transition-all cursor-pointer ${
                    form.item_type !== 'resale_product'
                      ? 'bg-white dark:bg-zinc-900 text-slate-900 dark:text-white shadow-xs border border-slate-200/80 dark:border-zinc-700'
                      : 'text-slate-500 dark:text-zinc-400 hover:text-slate-800 dark:hover:text-zinc-200'
                  }`}
                >
                  <ChefHat className="w-3.5 h-3.5 text-orange-500" />
                  <span>{lang === 'bn' ? '🍳 কিচেন খাবার (রেসিপি BOM)' : '🍳 Kitchen Dish (Recipe BOM)'}</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setForm(prev => ({
                      ...prev,
                      item_type: 'resale_product',
                      category: prev.category === 'Main Course' ? 'Bottled Water & Soda' : prev.category,
                      kitchen_station: 'beverage_bar',
                      preparation_time_minutes: 1
                    }));
                  }}
                  className={`flex-1 py-2 px-3 rounded-xl font-bold text-xs flex items-center justify-center gap-2 transition-all cursor-pointer ${
                    form.item_type === 'resale_product'
                      ? 'bg-white dark:bg-zinc-900 text-slate-900 dark:text-white shadow-xs border border-slate-200/80 dark:border-zinc-700'
                      : 'text-slate-500 dark:text-zinc-400 hover:text-slate-800 dark:hover:text-zinc-200'
                  }`}
                >
                  <Package className="w-3.5 h-3.5 text-blue-500" />
                  <span>{lang === 'bn' ? '📦 সাপ্লায়ার পণ্য (পানি/ড্রিংকস)' : '📦 Supplier Resale (Water/Drinks)'}</span>
                </button>
              </div>

              {/* Dish Image Uploader (ImgBB) - Single Clean File Upload */}
              <ProductImageUploader
                label={lang === 'bn' ? (form.item_type === 'resale_product' ? 'পণ্যের ছবি (ImgBB আপলোড)' : 'খাবারের ছবি (ImgBB আপলোড)') : (form.item_type === 'resale_product' ? 'Product Photo (ImgBB Upload)' : 'Dish Photo (ImgBB Upload)')}
                value={form.image_url}
                allowUrlPaste={false}
                onChange={(url) => setForm({ ...form, image_url: url })}
              />

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="font-semibold text-slate-700 dark:text-zinc-300 block mb-1">
                    {lang === 'bn' ? (form.item_type === 'resale_product' ? 'পণ্যের নাম (English) *' : 'খাবারের নাম (English) *') : (form.item_type === 'resale_product' ? 'Product / Item Name (English) *' : 'Dish Name (English) *')}
                  </label>
                  <Input
                    required
                    placeholder={form.item_type === 'resale_product' ? 'e.g. Mineral Water 500ml / Coca-Cola 250ml' : 'e.g. Chicken Kacchi Biryani'}
                    value={form.name}
                    onChange={(e) => setForm({ ...form, name: e.target.value })}
                    className="h-9.5 text-xs rounded-xl"
                  />
                </div>

                <div>
                  <label className="font-semibold text-slate-700 dark:text-zinc-300 block mb-1">
                    {lang === 'bn' ? 'নাম (বাংলা)' : 'Name (বাংলা)'}
                  </label>
                  <Input
                    placeholder={form.item_type === 'resale_product' ? 'যেমন: মিনারেল ওয়াটার ৫০০ মি.লি.' : 'যেমন: চিকেন কাচ্চি বিরিয়ানি'}
                    value={form.name_bn}
                    onChange={(e) => setForm({ ...form, name_bn: e.target.value })}
                    className="h-9.5 text-xs rounded-xl"
                  />
                </div>
              </div>

              {/* Category Dropdown & Add Category Option */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="font-semibold text-slate-700 dark:text-zinc-300 block">
                    {lang === 'bn' ? 'ক্যাটাগরি *' : 'Category *'}
                  </label>
                  {!isAddingNewCategory && (
                    <button
                      type="button"
                      onClick={() => setIsAddingNewCategory(true)}
                      className="text-xs font-bold text-orange-600 dark:text-orange-400 hover:underline flex items-center gap-1 cursor-pointer"
                    >
                      <Plus className="w-3 h-3" />
                      <span>{lang === 'bn' ? '+ নতুন ক্যাটাগরি' : '+ Add New Category'}</span>
                    </button>
                  )}
                </div>

                {isAddingNewCategory ? (
                  <div className="flex items-center gap-2">
                    <input
                      type="text"
                      autoFocus
                      placeholder={lang === 'bn' ? 'নতুন ক্যাটাগরির নাম লিখুন...' : 'Type new category name...'}
                      value={newCategoryName}
                      onChange={(e) => setNewCategoryName(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          handleAddNewCategory();
                        } else if (e.key === 'Escape') {
                          setIsAddingNewCategory(false);
                        }
                      }}
                      className="flex-1 h-9.5 px-3 rounded-xl border border-orange-500 bg-white dark:bg-zinc-900 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-orange-500 text-slate-900 dark:text-white"
                    />
                    <button
                      type="button"
                      onClick={handleAddNewCategory}
                      className="h-9.5 px-3 rounded-xl bg-orange-500 hover:bg-orange-600 text-white font-bold text-xs shrink-0 cursor-pointer flex items-center gap-1 transition-colors"
                    >
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      <span>{lang === 'bn' ? 'সংরক্ষণ' : 'Save'}</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setIsAddingNewCategory(false);
                        setNewCategoryName('');
                      }}
                      className="h-9.5 px-2.5 rounded-xl border border-slate-200 dark:border-zinc-800 text-slate-500 hover:bg-slate-100 dark:hover:bg-zinc-800 text-xs font-semibold shrink-0 cursor-pointer"
                    >
                      {lang === 'bn' ? 'বাতিল' : 'Cancel'}
                    </button>
                  </div>
                ) : (
                  <Select
                    value={form.category}
                    onValueChange={(val) => {
                      if (val === '__add_new__') {
                        setIsAddingNewCategory(true);
                      } else {
                        setForm({ ...form, category: val });
                      }
                    }}
                  >
                    <SelectTrigger className="h-9.5 text-xs rounded-xl bg-white dark:bg-zinc-900 border-slate-200 dark:border-zinc-800 font-semibold">
                      <SelectValue placeholder="Select Category" />
                    </SelectTrigger>
                    <SelectContent className="max-h-60 overflow-y-auto">
                      {allCategoryOptions.map((cat) => (
                        <SelectItem key={cat} value={cat}>
                          {cat}
                        </SelectItem>
                      ))}
                      <SelectItem
                        value="__add_new__"
                        className="font-bold text-orange-600 dark:text-orange-400 bg-orange-500/10 dark:bg-orange-950/30 cursor-pointer mt-1"
                      >
                        + {lang === 'bn' ? 'নতুন ক্যাটাগরি তৈরি করুন...' : 'Create New Category...'}
                      </SelectItem>
                    </SelectContent>
                  </Select>
                )}
              </div>

              {/* ---------------------------------------------------- */}
              {/* RESALE PRODUCT SPECIFIC PRICING & SUPPLIER FIELDS    */}
              {/* ---------------------------------------------------- */}
              {form.item_type === 'resale_product' ? (
                <div className="space-y-3">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="font-semibold text-slate-700 dark:text-zinc-300 block mb-1">
                        {lang === 'bn' ? 'সাপ্লায়ার ক্রয় মূল্য (৳) *' : 'Supplier Cost / Buying Price (৳) *'}
                      </label>
                      <Input
                        type="number"
                        min="0"
                        placeholder="15"
                        value={form.cost_price}
                        onChange={(e) => setForm({ ...form, cost_price: e.target.value })}
                        className="h-9.5 text-xs font-mono font-bold rounded-xl"
                      />
                      <span className="text-[10px] text-slate-400 mt-0.5 block">
                        {lang === 'bn' ? 'প্রতি ইউনিটের ক্রয় মূল্য' : 'Purchase cost per unit from vendor'}
                      </span>
                    </div>

                    <div>
                      <label className="font-semibold text-slate-700 dark:text-zinc-300 block mb-1">
                        {lang === 'bn' ? 'বিক্রয় মূল্য (৳) *' : 'Selling Price (৳) *'}
                      </label>
                      <Input
                        type="number"
                        min="0"
                        required
                        placeholder="35"
                        value={form.price}
                        onChange={(e) => setForm({ ...form, price: e.target.value })}
                        className="h-9.5 text-xs font-mono font-bold rounded-xl"
                      />
                      <span className="text-[10px] text-slate-400 mt-0.5 block">
                        {lang === 'bn' ? 'কাস্টমারকে যে মূল্যে বিক্রি করা হবে' : 'Menu selling price to guest'}
                      </span>
                    </div>
                  </div>

                  {!editingItem && (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-2.5 rounded-xl bg-amber-500/5 dark:bg-amber-950/20 border border-amber-500/20">
                      <div>
                        <label className="font-semibold text-amber-900 dark:text-amber-200 block mb-1">
                          {lang === 'bn' ? 'প্রাথমিক ক্রয় পরিমাণ (সংখ্যা)' : 'Initial Purchased Quantity (Units)'}
                        </label>
                        <Input
                          type="number"
                          min="1"
                          placeholder="24"
                          value={form.purchase_quantity}
                          onChange={(e) => setForm({ ...form, purchase_quantity: e.target.value })}
                          className="h-9 text-xs font-mono font-bold rounded-xl bg-white dark:bg-zinc-900"
                        />
                        <span className="text-[10px] text-amber-700/80 dark:text-amber-400 mt-0.5 block">
                          {lang === 'bn' ? 'মোট ক্রয় খরচ হিসেবে খরচের তালিকায় যুক্ত হবে' : 'Total purchase cost will be added to Expenses'}
                        </span>
                      </div>

                      <div>
                        <label className="font-semibold text-amber-900 dark:text-amber-200 block mb-1">
                          {lang === 'bn' ? 'পেমেন্ট মাধ্যম (খরচ পরিশোধ)' : 'Expense Payment Method'}
                        </label>
                        <Select
                          value={form.payment_method || 'Cash'}
                          onValueChange={(val) => setForm({ ...form, payment_method: val })}
                        >
                          <SelectTrigger className="h-9 text-xs rounded-xl bg-white dark:bg-zinc-900 border-slate-200 dark:border-zinc-800">
                            <SelectValue placeholder="Payment Method" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="Cash">Cash</SelectItem>
                            <SelectItem value="bKash">bKash</SelectItem>
                            <SelectItem value="Nagad">Nagad</SelectItem>
                            <SelectItem value="Card">Card</SelectItem>
                            <SelectItem value="Bank Transfer">Bank Transfer</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                  )}

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="font-semibold text-slate-700 dark:text-zinc-300 block mb-1">
                        {lang === 'bn' ? 'সাপ্লায়ার / ব্র্যান্ড নাম (ঐচ্ছিক)' : 'Supplier / Brand Name (Optional)'}
                      </label>
                      <Input
                        placeholder="e.g. Mum / Kinley / Pran / Coca-Cola"
                        value={form.supplier_name}
                        onChange={(e) => setForm({ ...form, supplier_name: e.target.value })}
                        className="h-9.5 text-xs rounded-xl"
                      />
                    </div>

                    <div>
                      <label className="font-semibold text-slate-700 dark:text-zinc-300 block mb-1">
                        {lang === 'bn' ? 'বিবরণ (ঐচ্ছিক)' : 'Description / Notes'}
                      </label>
                      <Input
                        placeholder="e.g. Chilled mineral water bottle"
                        value={form.description}
                        onChange={(e) => setForm({ ...form, description: e.target.value })}
                        className="h-9.5 text-xs rounded-xl"
                      />
                    </div>
                  </div>

                  {/* Resale Live Profit Margin & Expense Summary Card */}
                  <div className="p-3.5 rounded-2xl bg-blue-500/5 dark:bg-blue-550/10 border border-blue-500/20 space-y-2">
                    <div className="flex items-center justify-between text-xs font-bold text-blue-900 dark:text-blue-200">
                      <span className="flex items-center gap-1.5">
                        <TrendingUp className="w-3.5 h-3.5 text-blue-500" />
                        <span>{lang === 'bn' ? 'সরাসরি রিসেল লাভ ও মার্জিন বিশ্লেষণ:' : 'Direct Resale Profit Margin & Expense Impact:'}</span>
                      </span>
                      {Number(form.price) > 0 && marginPercent >= 40 && (
                        <span className="text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 border border-emerald-500/30">
                          🔥 High Margin
                        </span>
                      )}
                    </div>

                    <div className="grid grid-cols-3 gap-2 pt-1">
                      <div className="p-2 rounded-xl bg-white dark:bg-zinc-900 border border-slate-200/80 dark:border-zinc-800">
                        <span className="text-[10px] text-slate-400 block font-medium">
                          {lang === 'bn' ? 'ইউনিট ক্রয় খরচ' : 'Unit Cost:'}
                        </span>
                        <span className="font-mono font-bold text-xs text-slate-700 dark:text-zinc-300">
                          ৳ {Number(form.cost_price || 0).toLocaleString()}
                        </span>
                      </div>

                      <div className="p-2 rounded-xl bg-white dark:bg-zinc-900 border border-slate-200/80 dark:border-zinc-800">
                        <span className="text-[10px] text-slate-400 block font-medium">
                          {lang === 'bn' ? 'বিক্রয় মূল্য' : 'Selling Price:'}
                        </span>
                        <span className="font-mono font-bold text-xs text-slate-900 dark:text-white">
                          ৳ {Number(form.price || 0).toLocaleString()}
                        </span>
                      </div>

                      <div className="p-2 rounded-xl bg-emerald-500/10 dark:bg-emerald-500/20 border border-emerald-500/30">
                        <span className="text-[10px] text-emerald-700 dark:text-emerald-300 block font-medium">
                          {lang === 'bn' ? 'ইউনিট লাভ' : 'Net Unit Gain:'}
                        </span>
                        <span className="font-mono font-black text-xs text-emerald-600 dark:text-[#00df89]">
                          +৳ {grossProfit.toLocaleString()} ({marginPercent}%)
                        </span>
                      </div>
                    </div>

                    {Number(form.cost_price) > 0 && (
                      <div className="p-2 rounded-xl bg-white dark:bg-zinc-900 border border-slate-200/80 dark:border-zinc-800 flex items-center justify-between text-xs">
                        <span className="text-[11px] text-slate-600 dark:text-zinc-400 font-medium">
                          {lang === 'bn' ? 'মোট প্রাথমিক খরচ হিসেবে যুক্ত হবে:' : 'Total Purchase Added to Expenses:'}
                        </span>
                        <span className="font-mono font-black text-xs text-rose-600 dark:text-rose-400">
                          ৳ {(Number(form.cost_price || 0) * Math.max(1, Number(form.purchase_quantity || 1))).toLocaleString()}
                        </span>
                      </div>
                    )}

                    <div className="text-[10px] text-slate-500 dark:text-zinc-400 flex items-center gap-1.5 pt-0.5">
                      <Info className="w-3 h-3 text-blue-500 shrink-0" />
                      <span>
                        {lang === 'bn'
                          ? 'পণ্যটি যুক্ত করার সাথে সাথেই এই ক্রয় খরচটি খরচের খাতা (Expenses & Cashbook) এবং লাভ-ক্ষতি স্টেটমেন্টে স্বয়ংক্রিয়ভাবে লিপিবদ্ধ হবে।'
                          : 'This purchase cost will automatically be recorded under Expenses, Cashbook & Financial P&L Statement.'}
                      </span>
                    </div>
                  </div>
                </div>
              ) : (
                /* ---------------------------------------------------- */
                /* KITCHEN PREPARED DISH FIELDS                         */
                /* ---------------------------------------------------- */
                <div className="space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="font-semibold text-slate-700 dark:text-zinc-300 block mb-1">
                        {lang === 'bn' ? 'বিক্রয় মূল্য (৳) *' : 'Selling Price (৳) *'}
                      </label>
                      <Input
                        type="number"
                        min="0"
                        required
                        placeholder="450"
                        value={form.price}
                        onChange={(e) => setForm({ ...form, price: e.target.value })}
                        className="h-9.5 text-xs font-mono font-bold rounded-xl"
                      />
                    </div>

                    <div>
                      <label className="font-semibold text-slate-700 dark:text-zinc-300 block mb-1">
                        {lang === 'bn' ? 'রান্নার সময় (মিনিট)' : 'Prep Time (Mins)'}
                      </label>
                      <Input
                        type="number"
                        min="1"
                        value={form.preparation_time_minutes}
                        onChange={(e) => setForm({ ...form, preparation_time_minutes: e.target.value })}
                        className="h-9.5 text-xs font-mono rounded-xl"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="font-semibold text-slate-700 dark:text-zinc-300 block mb-1">
                        {lang === 'bn' ? 'কিচেন স্টেশন' : 'Kitchen Station'}
                      </label>
                      <Select
                        value={form.kitchen_station}
                        onValueChange={(val) => setForm({ ...form, kitchen_station: val })}
                      >
                        <SelectTrigger className="h-9.5 text-xs rounded-xl bg-white dark:bg-zinc-900 border-slate-200 dark:border-zinc-800">
                          <SelectValue placeholder="Select Station" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="main_kitchen">Main Kitchen / Curry</SelectItem>
                          <SelectItem value="grill_tandoor">Grill & Tandoor Station</SelectItem>
                          <SelectItem value="beverage_bar">Juice & Beverage Bar</SelectItem>
                          <SelectItem value="bakery_dessert">Bakery & Dessert</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div>
                      <label className="font-semibold text-slate-700 dark:text-zinc-300 block mb-1">
                        {lang === 'bn' ? 'বিবরণ (ঐচ্ছিক)' : 'Description / Notes'}
                      </label>
                      <Input
                        placeholder="e.g. Served with mint chutney & salad"
                        value={form.description}
                        onChange={(e) => setForm({ ...form, description: e.target.value })}
                        className="h-9.5 text-xs rounded-xl"
                      />
                    </div>
                  </div>

                  {/* Dietary tags for Prepared Dishes */}
                  <div className="flex items-center gap-4 pt-1">
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={form.is_veg}
                        onChange={(e) => setForm({ ...form, is_veg: e.target.checked })}
                        className="rounded accent-emerald-500"
                      />
                      <span className="text-xs font-semibold text-slate-700 dark:text-zinc-300 flex items-center gap-1">
                        <Leaf className="w-3.5 h-3.5 text-emerald-500" />
                        <span>{lang === 'bn' ? 'ভেজ খাবার (Vegetarian)' : 'Vegetarian'}</span>
                      </span>
                    </label>

                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={form.is_spicy}
                        onChange={(e) => setForm({ ...form, is_spicy: e.target.checked })}
                        className="rounded accent-rose-500"
                      />
                      <span className="text-xs font-semibold text-slate-700 dark:text-zinc-300 flex items-center gap-1">
                        <Flame className="w-3.5 h-3.5 text-rose-500" />
                        <span>{lang === 'bn' ? 'ঝাল (Spicy)' : 'Spicy'}</span>
                      </span>
                    </label>
                  </div>

                  {/* Recipe Ingredients (BOM) & Estimated Food Cost Calculator */}
                  <div className="space-y-3 pt-3 border-t border-slate-100 dark:border-zinc-800">
                    <div className="flex items-center justify-between">
                      <label className="font-bold text-slate-800 dark:text-zinc-200 flex items-center gap-1.5 text-xs">
                        <BookOpen className="w-4 h-4 text-orange-500" />
                        <span>{lang === 'bn' ? 'রেসিপি উপকরণ ও খাদ্য খরচ (BOM):' : 'Recipe Ingredients & Food Cost (BOM):'}</span>
                      </label>
                      <span className="text-[10px] font-semibold text-slate-400">
                        {form.recipe_ingredients?.length || 0} {lang === 'bn' ? 'উপাদান যুক্ত' : 'ingredients'}
                      </span>
                    </div>

                    {/* Live Food Cost & Margin KPI Summary */}
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 p-3 rounded-2xl bg-slate-50 dark:bg-zinc-850/60 border border-slate-200/80 dark:border-zinc-800 shadow-2xs">
                      <div>
                        <span className="text-[10px] text-slate-500 dark:text-zinc-400 font-medium block">
                          {lang === 'bn' ? 'আনুমানিক খাদ্য খরচ (BOM)' : 'Estimated Food Cost:'}
                        </span>
                        <span className="font-mono font-black text-sm text-orange-600 dark:text-orange-400">
                          ৳ {totalRecipeCost.toLocaleString()}
                        </span>
                      </div>

                      <div>
                        <span className="text-[10px] text-slate-500 dark:text-zinc-400 font-medium block">
                          {lang === 'bn' ? 'বিক্রয় মূল্য' : 'Selling Price:'}
                        </span>
                        <span className="font-mono font-bold text-sm text-slate-900 dark:text-white">
                          ৳ {Number(form.price || 0).toLocaleString()}
                        </span>
                      </div>

                      <div className="col-span-2 sm:col-span-1">
                        <span className="text-[10px] text-slate-500 dark:text-zinc-400 font-medium block">
                          {lang === 'bn' ? 'সম্ভাব্য লাভ / মার্জিন' : 'Est. Profit Margin:'}
                        </span>
                        <div className="flex items-center gap-1.5 mt-0.5">
                          <span className={`font-mono font-black text-sm ${grossProfit >= 0 ? 'text-emerald-600 dark:text-[#00df89]' : 'text-rose-600'}`}>
                            ৳ {grossProfit.toLocaleString()}
                          </span>
                          {Number(form.price) > 0 && (
                            <span className={`px-1.5 py-0.2 text-[10px] font-bold rounded-full ${
                              marginPercent >= 50
                                ? 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400'
                                : marginPercent >= 20
                                ? 'bg-amber-500/15 text-amber-600 dark:text-amber-400'
                                : 'bg-rose-500/15 text-rose-600'
                            }`}>
                              {marginPercent}%
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Add Ingredient to Recipe Row */}
                    <div className="grid grid-cols-1 sm:grid-cols-[1fr_80px_85px_auto] gap-2 items-center">
                      <Select
                        value={selectedRecipeRawId}
                        onValueChange={(val) => {
                          setSelectedRecipeRawId(val);
                          const raw = rawMaterials.find(r => r._id === val);
                          if (raw) {
                            if (raw.unit === 'kg') setRecipeIngredientUnit('g');
                            else if (raw.unit === 'ltr') setRecipeIngredientUnit('ml');
                            else setRecipeIngredientUnit(raw.unit);
                          }
                        }}
                      >
                        <SelectTrigger className="h-9.5 text-xs rounded-xl bg-white dark:bg-zinc-900 border-slate-200 dark:border-zinc-800">
                          <SelectValue placeholder={lang === 'bn' ? 'প্যান্ট্রি থেকে উপকরণ বেছে নিন...' : 'Select ingredient from pantry...'} />
                        </SelectTrigger>
                        <SelectContent className="max-h-56 overflow-y-auto">
                          {rawMaterials.length === 0 ? (
                            <div className="p-2 text-center text-slate-400 text-xs">
                              {lang === 'bn' ? 'কোনো কাঁচামাল পাওয়া যায়নি' : 'No raw materials found in pantry'}
                            </div>
                          ) : (
                            rawMaterials.map((raw) => (
                              <SelectItem key={raw._id} value={raw._id}>
                                {raw.name} (৳{raw.unit_cost}/{raw.unit})
                              </SelectItem>
                            ))
                          )}
                        </SelectContent>
                      </Select>

                      <input
                        type="number"
                        min="0.01"
                        step="any"
                        placeholder="Qty"
                        value={recipeIngredientQty}
                        onChange={(e) => setRecipeIngredientQty(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            e.preventDefault();
                            handleAddRecipeIngredient();
                          }
                        }}
                        className="w-full h-9.5 px-2.5 rounded-xl border border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 text-xs font-mono font-bold focus:outline-none focus:ring-2 focus:ring-orange-500 text-slate-900 dark:text-white"
                      />

                      {/* Shadcn Unit Dropdown */}
                      <Select
                        value={recipeIngredientUnit}
                        onValueChange={(val) => setRecipeIngredientUnit(val)}
                      >
                        <SelectTrigger className="h-9.5 px-2 text-xs rounded-xl bg-white dark:bg-zinc-900 border-slate-200 dark:border-zinc-800 font-mono font-bold">
                          <SelectValue placeholder="Unit" />
                        </SelectTrigger>
                        <SelectContent align="right" className="min-w-[85px] w-24 max-h-48">
                          <SelectItem value="g">g</SelectItem>
                          <SelectItem value="kg">kg</SelectItem>
                          <SelectItem value="ml">ml</SelectItem>
                          <SelectItem value="ltr">ltr</SelectItem>
                          <SelectItem value="pcs">pcs</SelectItem>
                          <SelectItem value="pack">pack</SelectItem>
                          <SelectItem value="portion">portion</SelectItem>
                        </SelectContent>
                      </Select>

                      <button
                        type="button"
                        onClick={handleAddRecipeIngredient}
                        className="h-9.5 px-3.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shrink-0 cursor-pointer flex items-center gap-1 transition-colors whitespace-nowrap shadow-2xs"
                      >
                        <Plus className="w-3.5 h-3.5" />
                        <span>{lang === 'bn' ? 'যোগ' : 'Add'}</span>
                      </button>
                    </div>

                    {/* Current Recipe Ingredients List */}
                    {form.recipe_ingredients && form.recipe_ingredients.length > 0 ? (
                      <div className="space-y-1.5 max-h-44 overflow-y-auto pr-1">
                        {form.recipe_ingredients.map((ing, idx) => (
                          <div
                            key={idx}
                            className="flex items-center justify-between p-2.5 rounded-xl bg-white dark:bg-zinc-900 border border-slate-200/80 dark:border-zinc-800 text-xs shadow-2xs"
                          >
                            <div className="flex items-center gap-2">
                              <span className="w-1.5 h-1.5 rounded-full bg-orange-500" />
                              <span className="font-semibold text-slate-900 dark:text-white">{ing.name}</span>
                              <span className="text-slate-400 font-mono text-[11px]">({ing.quantity} {ing.unit})</span>
                            </div>

                            <div className="flex items-center gap-3">
                              <span className="font-mono font-bold text-orange-600 dark:text-orange-400">
                                ৳ {ing.unit_cost}
                              </span>
                              <button
                                type="button"
                                onClick={() => handleRemoveRecipeIngredient(idx)}
                                className="text-slate-400 hover:text-rose-500 p-1 cursor-pointer transition-colors"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-[11px] text-slate-400 italic">
                        {lang === 'bn' ? 'কোনো রেসিপি উপাদান এখনো যোগ করা হয়নি। উপরে উপকরণ বেছে নিয়ে যোগ করুন।' : 'No recipe ingredients added yet. Select raw materials from your pantry above to calculate food cost.'}
                      </p>
                    )}
                  </div>
                </div>
              )}

              {/* Modifiers / Add-ons Builder (CSS Grid Layout) */}
              <div className="space-y-2 pt-2 border-t border-slate-100 dark:border-zinc-800">
                <label className="font-semibold text-slate-700 dark:text-zinc-300 block">
                  {lang === 'bn' ? 'অতিরিক্ত অ্যাড-অন (যেমন: অতিরিক্ত চিজ, স্পেশাল সস):' : 'Add-on Options / Extras (e.g. Extra Cheese, Side Sauce):'}
                </label>

                <div className="grid grid-cols-[1fr_120px_auto] gap-2 items-center">
                  <input
                    type="text"
                    placeholder={lang === 'bn' ? 'অ্যাড-অনের নাম (যেমন: Extra Cheese)' : 'Add-on name (e.g. Extra Cheese)'}
                    value={newModifierName}
                    onChange={(e) => setNewModifierName(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        handleAddModifier();
                      }
                    }}
                    className="w-full h-9.5 px-3 rounded-xl border border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-[#00df89] text-slate-900 dark:text-white"
                  />
                  <input
                    type="number"
                    min="0"
                    placeholder="Price ৳"
                    value={newModifierPrice}
                    onChange={(e) => setNewModifierPrice(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        handleAddModifier();
                      }
                    }}
                    className="w-full h-9.5 px-3 rounded-xl border border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 text-xs font-mono font-bold focus:outline-none focus:ring-2 focus:ring-[#00df89] text-slate-900 dark:text-white"
                  />
                  <button
                    type="button"
                    onClick={handleAddModifier}
                    className="h-9.5 px-3.5 rounded-xl bg-orange-500 hover:bg-orange-600 text-white font-bold text-xs shrink-0 cursor-pointer flex items-center gap-1 transition-colors whitespace-nowrap"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>{lang === 'bn' ? 'যোগ করুন' : 'Add'}</span>
                  </button>
                </div>

                {form.modifiers && form.modifiers.length > 0 && (
                  <div className="flex flex-wrap gap-2 pt-1.5">
                    {form.modifiers.map((mod, i) => (
                      <span
                        key={i}
                        className="px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-zinc-800 border border-slate-200/80 dark:border-zinc-700 text-xs font-semibold flex items-center gap-2 shadow-2xs"
                      >
                        <span className="text-slate-800 dark:text-zinc-200">{mod.name}</span>
                        <span className="text-orange-600 dark:text-orange-400 font-mono font-bold">+৳{mod.price}</span>
                        <button
                          type="button"
                          onClick={() => handleRemoveModifier(i)}
                          className="text-slate-400 hover:text-rose-500 transition-colors cursor-pointer"
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                      </span>
                    ))}
                  </div>
                )}
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100 dark:border-zinc-800">
                <button
                  type="button"
                  disabled={isSavingDish}
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 rounded-xl border border-slate-200 text-xs font-semibold cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {lang === 'bn' ? 'বাতিল' : 'Cancel'}
                </button>
                <button
                  type="submit"
                  disabled={isSavingDish}
                  className="px-4 py-2 rounded-xl bg-[#00df89] text-slate-950 text-xs font-bold shadow-xs hover:bg-[#00c578] cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed flex items-center gap-1.5"
                >
                  {isSavingDish && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                  <span>
                    {isSavingDish
                      ? (lang === 'bn' ? 'সংরক্ষণ হচ্ছে...' : 'Saving...')
                      : (editingItem ? (lang === 'bn' ? 'আপডেট করুন' : 'Update Dish') : (lang === 'bn' ? 'মেনুতে যোগ করুন' : 'Add to Menu'))}
                  </span>
                </button>
              </div>
            </form>
          </Card>
        </div>
      )}

      {/* CONFIRM DELETE DIALOG */}
      <ConfirmDialog
        isOpen={Boolean(deletingDish)}
        title={lang === 'bn' ? `"${deletingDish?.name || ''}" খাবারটি মেনু থেকে মুছে ফেলতে চান?` : `Remove "${deletingDish?.name || ''}" from menu?`}
        description={lang === 'bn' ? 'এই মেনু আইটেমটি স্থায়ীভাবে মুছে ফেলা হবে।' : 'This menu item will be permanently removed from your catalog and POS system.'}
        confirmText={lang === 'bn' ? 'হ্যাঁ, মুছুন' : 'Yes, Delete Dish'}
        cancelText={lang === 'bn' ? 'বাতিল' : 'Cancel'}
        isLoading={isDeletingDish}
        onConfirm={confirmDeleteDish}
        onCancel={() => setDeletingDish(null)}
      />

    </div>
  );
}
