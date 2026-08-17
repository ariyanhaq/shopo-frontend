/**
 * @file AddProduct.jsx
 * @description Dedicated Add Product page for inventory management saving directly to MongoDB with inline Category creation.
 */
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useLanguage } from '@/context/LanguageContext';
import { useShop } from '@/context/ShopContext';
import { useAuth } from '@/context/AuthContext';
import { getProductPlaceholder, getCategoryPlaceholder } from '@/lib/productPlaceholders';
import api from '@/services/api';
import toast from 'react-hot-toast';
import { Card, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectTrigger,
  SelectContent,
  SelectItem,
  SelectValue
} from '@/components/ui/select';
import ProductImageUploader from '@/components/common/ProductImageUploader';
import { Package, ArrowLeft, CheckCircle2, Loader2, Sparkles, Barcode, FolderPlus, Plus } from 'lucide-react';

export default function AddProduct() {
  const navigate = useNavigate();
  const { lang } = useLanguage();
  const { activeShop } = useShop();
  const { mongoShop } = useAuth();

  const shopBusinessType = mongoShop?.business_type || activeShop?.business_type || activeShop?.id || localStorage.getItem('shopo_business_type') || '';
  const productPlaceholder = getProductPlaceholder(shopBusinessType, lang);
  const categoryPlaceholder = getCategoryPlaceholder(shopBusinessType, lang);

  const [categories, setCategories] = useState([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Inline Category Creator
  const [showAddCatInline, setShowAddCatInline] = useState(false);
  const [newCatName, setNewCatName] = useState('');
  const [isCreatingCat, setIsCreatingCat] = useState(false);

  const [form, setForm] = useState({
    name: '',
    image_url: '',
    category_id: '__general__',
    sku: '',
    barcode: '',
    cost_price: '',
    selling_price: '',
    stock_quantity: '',
    low_stock_threshold: 5,
    unit: 'pcs',
  });

  useEffect(() => {
    const loadCats = async () => {
      try {
        const res = await api.categories.list();
        if (res.data) setCategories(Array.isArray(res.data) ? res.data : []);
      } catch (err) {
        console.warn('Could not load categories:', err.message);
      }
    };
    loadCats();
  }, []);

  const generateSku = () => {
    const prefix = form.name ? form.name.slice(0, 3).toUpperCase() : 'SKU';
    const rand = Math.floor(100000 + Math.random() * 900000);
    setForm(prev => ({ ...prev, sku: `${prefix}-${rand}` }));
  };

  const handleCreateCategory = async (e) => {
    e?.preventDefault();
    if (!newCatName.trim()) return;

    setIsCreatingCat(true);
    try {
      const res = await api.categories.create({ name: newCatName.trim() });
      const created = res.data;
      if (created?._id) {
        setCategories((prev) => [...prev, created]);
        setForm((prev) => ({ ...prev, category_id: created._id }));
        toast.success(lang === 'bn' ? 'ক্যাটাগরি তৈরি সম্পন্ন হয়েছে!' : 'Category created successfully!');
      }
      setNewCatName('');
      setShowAddCatInline(false);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to create category');
    } finally {
      setIsCreatingCat(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      const finalCatId = (form.category_id && form.category_id !== '__general__')
        ? form.category_id
        : (categories.find((c) => c.name?.toLowerCase() === 'general')?._id || undefined);

      const payload = {
        name: form.name.trim(),
        image_url: form.image_url || undefined,
        images: form.image_url ? [form.image_url] : [],
        category_id: finalCatId,
        sku: form.sku.trim() || undefined,
        barcode: form.barcode.trim() || undefined,
        cost_price: parseFloat(form.cost_price) || 0,
        selling_price: parseFloat(form.selling_price) || 0,
        stock_quantity: parseInt(form.stock_quantity, 10) || 0,
        low_stock_threshold: parseInt(form.low_stock_threshold, 10) || 5,
        unit: form.unit || 'pcs',
      };
      await api.products.create(payload);
      toast.success(lang === 'bn' ? 'পণ্য সফলভাবে ইনভেন্টরিতে সংরক্ষিত হয়েছে!' : 'Product added successfully to inventory!');
      navigate('/products');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to add product');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6 pb-12 font-sans">
      
      {/* Top Navigation */}
      <div className="flex items-center justify-between">
        <Button
          variant="outline"
          size="sm"
          onClick={() => navigate(-1)}
          className="gap-2 text-xs font-medium cursor-pointer"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>{lang === 'bn' ? 'ফিরে যান' : 'Back'}</span>
        </Button>
      </div>

      {/* Main Card */}
      <Card className="p-6 sm:p-8 border-slate-200/90 dark:border-zinc-800/80 dark:bg-[#121215] space-y-6">
        
        <div>
          <CardTitle className="text-lg sm:text-xl font-bold flex items-center gap-2">
            <Package className="w-5 h-5 text-[#00df89]" />
            <span>{lang === 'bn' ? 'নতুন পণ্য যোগ করুন' : 'Add New Product'}</span>
          </CardTitle>
          <CardDescription className="text-xs text-slate-500 dark:text-zinc-400 mt-1">
            {lang === 'bn'
              ? 'আপনার দোকানের নতুন পণ্যের নাম, ছবি, ক্যাটাগরি, মূল্য ও স্টক সংখ্যা লিখুন।'
              : 'Fill in details below to register a new item with photos in your inventory database.'}
          </CardDescription>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 text-xs">
          
          <div className="space-y-1.5">
            <label className="block font-medium text-slate-700 dark:text-zinc-300">Product Title / Name *</label>
            <input
              type="text"
              required
              placeholder={productPlaceholder}
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-[#09090b] border border-slate-200 dark:border-zinc-800 text-sm outline-none focus:ring-2 focus:ring-[#00df89]"
            />
          </div>

          {/* Product Photo via ImgBB */}
          <ProductImageUploader
            value={form.image_url}
            onChange={(url) => setForm({ ...form, image_url: url })}
            label="Product Photo (Hosted via ImgBB)"
          />

          {/* Category with Inline Category Creator */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <label className="font-medium text-slate-700 dark:text-zinc-300">Category</label>
              <button
                type="button"
                onClick={() => {
                  setShowAddCatInline(!showAddCatInline);
                  setNewCatName('');
                }}
                className="text-[11px] font-semibold text-[#00a86b] dark:text-[#00df89] hover:underline flex items-center gap-1 cursor-pointer"
              >
                <FolderPlus className="w-3.5 h-3.5" />
                <span>{showAddCatInline ? 'Choose existing' : '+ Add New Category'}</span>
              </button>
            </div>

            {showAddCatInline ? (
              <div className="flex items-center gap-2 p-2.5 rounded-xl bg-emerald-500/5 border border-emerald-500/20">
                <input
                  type="text"
                  placeholder={categoryPlaceholder}
                  value={newCatName}
                  onChange={(e) => setNewCatName(e.target.value)}
                  className="flex-1 px-3.5 py-2 rounded-lg bg-white dark:bg-[#09090b] border border-slate-200 dark:border-zinc-800 outline-none text-xs focus:ring-1 focus:ring-[#00df89]"
                />
                <Button
                  type="button"
                  size="sm"
                  disabled={isCreatingCat || !newCatName.trim()}
                  onClick={handleCreateCategory}
                  className="bg-[#00df89] hover:bg-[#00c97b] text-[#011812] font-semibold text-xs h-9 px-3.5"
                >
                  {isCreatingCat ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : 'Save & Select'}
                </Button>
              </div>
            ) : (
              <Select
                value={form.category_id || '__general__'}
                onValueChange={(val) => setForm({ ...form, category_id: val })}
              >
                <SelectTrigger className="w-full bg-slate-50 dark:bg-[#09090b]">
                  <SelectValue placeholder="General" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="__general__">General</SelectItem>
                  {categories.filter(c => c.name?.toLowerCase() !== 'general').map((c) => (
                    <SelectItem key={c._id} value={c._id}>{c.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <div className="flex justify-between items-center">
                <label className="font-medium text-slate-700 dark:text-zinc-300">SKU Code</label>
                <button type="button" onClick={generateSku} className="text-[#00a86b] dark:text-[#00df89] text-[11px] font-medium flex items-center gap-1">
                  <Sparkles className="w-3 h-3" /> Auto-generate
                </button>
              </div>
              <input
                type="text"
                placeholder="e.g. RICE-89301"
                value={form.sku}
                onChange={(e) => setForm({ ...form, sku: e.target.value })}
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-[#09090b] border border-slate-200 dark:border-zinc-800 text-sm outline-none"
              />
            </div>

            <div className="space-y-1.5">
              <label className="font-medium text-slate-700 dark:text-zinc-300">Barcode / EAN (Optional)</label>
              <input
                type="text"
                placeholder="Scan or enter barcode..."
                value={form.barcode}
                onChange={(e) => setForm({ ...form, barcode: e.target.value })}
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-[#09090b] border border-slate-200 dark:border-zinc-800 text-sm outline-none"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="font-medium text-slate-700 dark:text-zinc-300">Cost Price (৳)</label>
              <input
                type="number"
                placeholder="0.00"
                value={form.cost_price}
                onChange={(e) => setForm({ ...form, cost_price: e.target.value })}
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-[#09090b] border border-slate-200 dark:border-zinc-800 text-sm outline-none"
              />
            </div>

            <div className="space-y-1.5">
              <label className="font-medium text-slate-700 dark:text-zinc-300">Selling Price (৳) *</label>
              <input
                type="number"
                required
                placeholder="0.00"
                value={form.selling_price}
                onChange={(e) => setForm({ ...form, selling_price: e.target.value })}
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-[#09090b] border border-slate-200 dark:border-zinc-800 text-sm outline-none focus:ring-2 focus:ring-[#00df89]"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="space-y-1.5">
              <label className="font-medium text-slate-700 dark:text-zinc-300">Initial Stock</label>
              <input
                type="number"
                placeholder="0"
                value={form.stock_quantity}
                onChange={(e) => setForm({ ...form, stock_quantity: e.target.value })}
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-[#09090b] border border-slate-200 dark:border-zinc-800 text-sm outline-none"
              />
            </div>

            <div className="space-y-1.5">
              <label className="font-medium text-slate-700 dark:text-zinc-300">Low Stock Alert Level</label>
              <input
                type="number"
                value={form.low_stock_threshold}
                onChange={(e) => setForm({ ...form, low_stock_threshold: e.target.value })}
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-[#09090b] border border-slate-200 dark:border-zinc-800 text-sm outline-none"
              />
            </div>

            <div className="space-y-1.5">
              <label className="font-medium text-slate-700 dark:text-zinc-300">Unit (e.g. Pcs, Kg, Box)</label>
              <input
                type="text"
                value={form.unit}
                onChange={(e) => setForm({ ...form, unit: e.target.value })}
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-[#09090b] border border-slate-200 dark:border-zinc-800 text-sm outline-none"
              />
            </div>
          </div>

          <div className="pt-4 flex justify-end gap-2 border-t border-slate-100 dark:border-zinc-800">
            <Button type="button" variant="outline" size="sm" onClick={() => navigate('/products')}>
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={isSubmitting}
              className="bg-[#00df89] hover:bg-[#00c97b] text-[#011812] font-semibold gap-1.5 shadow-xs"
            >
              {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4" />}
              <span>{isSubmitting ? 'Saving to Database...' : 'Save Product'}</span>
            </Button>
          </div>

        </form>

      </Card>

    </div>
  );
}
