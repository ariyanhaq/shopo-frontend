/**
 * @file AddProduct.jsx
 * @description Dedicated Add Product page for inventory management saving directly to MongoDB with inline Category & Supplier creation.
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
import { Package, ArrowLeft, CheckCircle2, Loader2, Sparkles, Barcode, FolderPlus, Plus, Building2 } from 'lucide-react';

export default function AddProduct() {
  const navigate = useNavigate();
  const { lang } = useLanguage();
  const { activeShop } = useShop();
  const { mongoShop } = useAuth();

  const shopBusinessType = mongoShop?.business_type || activeShop?.business_type || activeShop?.id || localStorage.getItem('shopo_business_type') || '';
  const productPlaceholder = getProductPlaceholder(shopBusinessType, lang);
  const categoryPlaceholder = getCategoryPlaceholder(shopBusinessType, lang);

  const [categories, setCategories] = useState([]);
  const [suppliers, setSuppliers] = useState([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Inline Category Creator
  const [showAddCatInline, setShowAddCatInline] = useState(false);
  const [newCatName, setNewCatName] = useState('');
  const [isCreatingCat, setIsCreatingCat] = useState(false);

  // Inline Supplier Creator
  const [showAddSuppInline, setShowAddSuppInline] = useState(false);
  const [newSuppData, setNewSuppData] = useState({ name: '', phone: '', company_name: '', address: '' });
  const [isCreatingSupp, setIsCreatingSupp] = useState(false);

  const [form, setForm] = useState({
    name: '',
    image_url: '',
    category_id: '__general__',
    supplier_id: '',
    sku: '',
    barcode: '',
    cost_price: '',
    selling_price: '',
    stock_quantity: '',
    low_stock_threshold: 5,
    unit: 'pcs',
  });

  useEffect(() => {
    const loadData = async () => {
      try {
        const [catRes, suppRes] = await Promise.all([
          api.categories.list().catch(() => ({ data: [] })),
          api.suppliers.list().catch(() => ({ data: [] })),
        ]);
        if (catRes.data) setCategories(Array.isArray(catRes.data) ? catRes.data : []);
        if (suppRes.data) setSuppliers(Array.isArray(suppRes.data) ? suppRes.data : []);
      } catch (err) {
        console.warn('Could not load categories/suppliers:', err.message);
      }
    };
    loadData();
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

  const handleCreateSupplier = async (e) => {
    e?.preventDefault();
    if (!newSuppData.name.trim()) return;

    setIsCreatingSupp(true);
    try {
      const res = await api.suppliers.create(newSuppData);
      const created = res.data;
      if (created?._id) {
        setSuppliers((prev) => [created, ...prev]);
        setForm((prev) => ({ ...prev, supplier_id: created._id }));
        toast.success(lang === 'bn' ? `সাপ্লায়ার '${created.name}' তৈরি সম্পন্ন!` : `Supplier '${created.name}' created!`);
      }
      setNewSuppData({ name: '', phone: '', company_name: '', address: '' });
      setShowAddSuppInline(false);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to create supplier');
    } finally {
      setIsCreatingSupp(false);
    }
  };

  const handleDeleteCategory = async (catId, catName) => {
    try {
      await api.categories.delete(catId);
      setCategories((prev) => prev.filter((c) => c._id !== catId));
      if (form.category_id === catId) {
        setForm((prev) => ({ ...prev, category_id: '__general__' }));
      }
      toast.success(lang === 'bn' ? `ক্যাটাগরি '${catName}' মুছে ফেলা হয়েছে!` : `Category '${catName}' deleted!`);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to delete category');
    }
  };

  const handleDeleteSupplier = async (suppId, suppName) => {
    try {
      await api.suppliers.delete(suppId);
      setSuppliers((prev) => prev.filter((s) => s._id !== suppId));
      if (form.supplier_id === suppId) {
        setForm((prev) => ({ ...prev, supplier_id: '' }));
      }
      toast.success(lang === 'bn' ? `সাপ্লায়ার '${suppName}' মুছে ফেলা হয়েছে!` : `Supplier '${suppName}' deleted!`);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to delete supplier');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      const finalCatId = (form.category_id && form.category_id !== '__general__')
        ? form.category_id
        : (categories.find((c) => c.name?.toLowerCase() === 'general')?._id || undefined);

      const initialStock = parseInt(form.stock_quantity, 10) || 0;
      const costPrice = parseFloat(form.cost_price) || 0;
      const sellPrice = parseFloat(form.selling_price) || 0;

      const payload = {
        name: form.name.trim(),
        image_url: form.image_url || undefined,
        images: form.image_url ? [form.image_url] : [],
        category_id: finalCatId,
        supplier_id: form.supplier_id || undefined,
        sku: form.sku.trim() || undefined,
        barcode: form.barcode.trim() || undefined,
        cost_price: costPrice,
        selling_price: sellPrice,
        stock_quantity: initialStock,
        low_stock_threshold: parseInt(form.low_stock_threshold, 10) || 5,
        unit: form.unit || 'pcs',
      };

      const createdRes = await api.products.create(payload);

      // If initial stock > 0, log purchase ledger transaction
      if (initialStock > 0 && createdRes?.data?._id) {
        try {
          await api.purchases.create({
            supplier_id: form.supplier_id || null,
            items: [
              {
                product_id: createdRes.data._id,
                product_name: createdRes.data.name,
                quantity: initialStock,
                unit_cost: costPrice,
                selling_price: sellPrice,
              },
            ],
            paid_amount: initialStock * costPrice,
            payment_method: 'cash',
            notes: 'Initial stock recorded on product creation',
          });
        } catch (pErr) {
          console.warn('Initial stock purchase logging skipped:', pErr);
        }
      }

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
              ? 'আপনার দোকানের নতুন পণ্যের নাম, ছবি, ক্যাটাগরি, সাপ্লায়ার, মূল্য ও স্টক সংখ্যা লিখুন।'
              : 'Fill in details below to register a new item with vendor info and photos in your inventory database.'}
          </CardDescription>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 text-xs">
          
          <div className="space-y-1.5">
            <label className="block font-medium text-slate-700 dark:text-zinc-300">
              {lang === 'bn' ? 'পণ্যের নাম *' : 'Product Title / Name *'}
            </label>
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
            label={lang === 'bn' ? 'পণ্যের ছবি (ImgBB হোস্টিং)' : 'Product Photo (Hosted via ImgBB)'}
          />

          {/* Category with Inline Category Creator */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <label className="font-medium text-slate-700 dark:text-zinc-300">
                {lang === 'bn' ? 'ক্যাটাগরি' : 'Category'}
              </label>
              <button
                type="button"
                onClick={() => {
                  setShowAddCatInline(!showAddCatInline);
                  setNewCatName('');
                }}
                className="text-[11px] font-semibold text-[#00a86b] dark:text-[#00df89] hover:underline flex items-center gap-1 cursor-pointer"
              >
                <FolderPlus className="w-3.5 h-3.5" />
                <span>{showAddCatInline ? (lang === 'bn' ? 'তালিকা থেকে বেছে নিন' : 'Choose existing') : (lang === 'bn' ? '+ নতুন ক্যাটাগরি' : '+ Add New Category')}</span>
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
                  className="bg-[#00df89] hover:bg-[#00c97b] text-[#011812] font-semibold text-xs h-9 px-3.5 cursor-pointer"
                >
                  {isCreatingCat ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : (lang === 'bn' ? 'সেভ' : 'Save & Select')}
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
                    <SelectItem
                      key={c._id}
                      value={c._id}
                      onDelete={() => handleDeleteCategory(c._id, c.name)}
                      deleteTitle={lang === 'bn' ? 'ক্যাটাগরি মুছুন' : 'Delete category'}
                    >
                      {c.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          </div>

          {/* Supplier with Inline Supplier Creator */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <label className="font-medium text-slate-700 dark:text-zinc-300">
                {lang === 'bn' ? 'সাপ্লায়ার (সরবরাহকারী)' : 'Supplier (Vendor)'}
              </label>
              <button
                type="button"
                onClick={() => {
                  setShowAddSuppInline(!showAddSuppInline);
                  setNewSuppData({ name: '', phone: '', company_name: '', address: '' });
                }}
                className="text-[11px] font-semibold text-[#00a86b] dark:text-[#00df89] hover:underline flex items-center gap-1 cursor-pointer"
              >
                <Building2 className="w-3.5 h-3.5" />
                <span>{showAddSuppInline ? (lang === 'bn' ? 'তালিকা থেকে বেছে নিন' : 'Choose existing') : (lang === 'bn' ? '+ নতুন সাপ্লায়ার' : '+ Add New Supplier')}</span>
              </button>
            </div>

            {showAddSuppInline ? (
              <div className="p-3 rounded-2xl bg-emerald-500/5 border border-emerald-500/20 space-y-2.5">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  <input
                    type="text"
                    placeholder={lang === 'bn' ? 'সাপ্লায়ারের নাম *' : 'Supplier Name *'}
                    value={newSuppData.name}
                    onChange={(e) => setNewSuppData({ ...newSuppData, name: e.target.value })}
                    className="px-3 py-1.5 rounded-lg bg-white dark:bg-[#09090b] border border-slate-200 dark:border-zinc-800 text-xs text-slate-900 dark:text-white outline-none"
                  />
                  <input
                    type="text"
                    placeholder={lang === 'bn' ? 'ফোন নম্বর' : 'Phone Number'}
                    value={newSuppData.phone}
                    onChange={(e) => setNewSuppData({ ...newSuppData, phone: e.target.value })}
                    className="px-3 py-1.5 rounded-lg bg-white dark:bg-[#09090b] border border-slate-200 dark:border-zinc-800 text-xs text-slate-900 dark:text-white outline-none"
                  />
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  <input
                    type="text"
                    placeholder={lang === 'bn' ? 'প্রতিষ্ঠান / কোম্পানি' : 'Company Name'}
                    value={newSuppData.company_name}
                    onChange={(e) => setNewSuppData({ ...newSuppData, company_name: e.target.value })}
                    className="px-3 py-1.5 rounded-lg bg-white dark:bg-[#09090b] border border-slate-200 dark:border-zinc-800 text-xs text-slate-900 dark:text-white outline-none"
                  />
                  <input
                    type="text"
                    placeholder={lang === 'bn' ? 'ঠিকানা' : 'Address'}
                    value={newSuppData.address}
                    onChange={(e) => setNewSuppData({ ...newSuppData, address: e.target.value })}
                    className="px-3 py-1.5 rounded-lg bg-white dark:bg-[#09090b] border border-slate-200 dark:border-zinc-800 text-xs text-slate-900 dark:text-white outline-none"
                  />
                </div>
                <div className="flex justify-end">
                  <Button
                    type="button"
                    size="sm"
                    disabled={isCreatingSupp || !newSuppData.name.trim()}
                    onClick={handleCreateSupplier}
                    className="bg-[#00df89] hover:bg-[#00c97b] text-[#011812] font-semibold text-xs h-8 px-3.5 cursor-pointer"
                  >
                    {isCreatingSupp ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : (lang === 'bn' ? 'সেভ ও নির্বাচন' : 'Save & Select')}
                  </Button>
                </div>
              </div>
            ) : (
              <Select
                value={form.supplier_id || '__none__'}
                onValueChange={(val) => setForm({ ...form, supplier_id: val === '__none__' ? '' : val })}
              >
                <SelectTrigger className="w-full bg-slate-50 dark:bg-[#09090b]">
                  <SelectValue placeholder={lang === 'bn' ? 'সাপ্লায়ার নির্বাচন করুন (ঐচ্ছিক)' : 'Select supplier (Optional)'} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="__none__">{lang === 'bn' ? 'সাধারণ / কোনো নির্দিষ্ট নেই' : 'General / Walk-in Supplier'}</SelectItem>
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

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <div className="flex justify-between items-center">
                <label className="font-medium text-slate-700 dark:text-zinc-300">
                  {lang === 'bn' ? 'SKU কোড' : 'SKU Code'}
                </label>
                <button type="button" onClick={generateSku} className="text-[#00a86b] dark:text-[#00df89] text-[11px] font-medium flex items-center gap-1 cursor-pointer">
                  <Sparkles className="w-3 h-3" /> {lang === 'bn' ? 'স্বয়ংক্রিয় তৈরি' : 'Auto-generate'}
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
              <label className="font-medium text-slate-700 dark:text-zinc-300">
                {lang === 'bn' ? 'বারকোড / EAN (ঐচ্ছিক)' : 'Barcode / EAN (Optional)'}
              </label>
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
              <label className="font-medium text-slate-700 dark:text-zinc-300">
                {lang === 'bn' ? 'ক্রয়মূল্য (৳)' : 'Cost Price (৳)'}
              </label>
              <input
                type="number"
                placeholder="0.00"
                value={form.cost_price}
                onChange={(e) => setForm({ ...form, cost_price: e.target.value })}
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-[#09090b] border border-slate-200 dark:border-zinc-800 text-sm outline-none"
              />
            </div>

            <div className="space-y-1.5">
              <label className="font-medium text-slate-700 dark:text-zinc-300">
                {lang === 'bn' ? 'বিক্রয়মূল্য (৳) *' : 'Selling Price (৳) *'}
              </label>
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
              <label className="font-medium text-slate-700 dark:text-zinc-300">
                {lang === 'bn' ? 'প্রাথমিক স্টক' : 'Initial Stock'}
              </label>
              <input
                type="number"
                placeholder="0"
                value={form.stock_quantity}
                onChange={(e) => setForm({ ...form, stock_quantity: e.target.value })}
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-[#09090b] border border-slate-200 dark:border-zinc-800 text-sm outline-none"
              />
            </div>

            <div className="space-y-1.5">
              <label className="font-medium text-slate-700 dark:text-zinc-300">
                {lang === 'bn' ? 'সতর্কতা লেভেল' : 'Low Stock Alert Level'}
              </label>
              <input
                type="number"
                value={form.low_stock_threshold}
                onChange={(e) => setForm({ ...form, low_stock_threshold: e.target.value })}
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-[#09090b] border border-slate-200 dark:border-zinc-800 text-sm outline-none"
              />
            </div>

            <div className="space-y-1.5">
              <label className="font-medium text-slate-700 dark:text-zinc-300">
                {lang === 'bn' ? 'একক (যেমন: Pcs, Kg)' : 'Unit (e.g. Pcs, Kg, Box)'}
              </label>
              <input
                type="text"
                value={form.unit}
                onChange={(e) => setForm({ ...form, unit: e.target.value })}
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-[#09090b] border border-slate-200 dark:border-zinc-800 text-sm outline-none"
              />
            </div>
          </div>

          <div className="pt-4 flex justify-end gap-2 border-t border-slate-100 dark:border-zinc-800">
            <Button type="button" variant="outline" size="sm" onClick={() => navigate('/products')} className="cursor-pointer">
              {lang === 'bn' ? 'বাতিল' : 'Cancel'}
            </Button>
            <Button
              type="submit"
              disabled={isSubmitting}
              className="bg-[#00df89] hover:bg-[#00c97b] text-[#011812] font-semibold gap-1.5 shadow-xs cursor-pointer"
            >
              {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4" />}
              <span>{isSubmitting ? (lang === 'bn' ? 'সংরক্ষণ করা হচ্ছে...' : 'Saving to Database...') : (lang === 'bn' ? 'পণ্য সংরক্ষণ করুন' : 'Save Product')}</span>
            </Button>
          </div>

        </form>

      </Card>

    </div>
  );
}
