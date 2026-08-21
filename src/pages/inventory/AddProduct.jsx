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
import ConfirmDialog from '@/components/common/ConfirmDialog';
import { Package, ArrowLeft, CheckCircle2, Loader2, Sparkles, Barcode, FolderPlus, Plus, Building2, Tag, Wallet, Layers, Trash2, Sliders, Check, Boxes, HelpCircle, RefreshCw } from 'lucide-react';

export default function AddProduct() {
  const navigate = useNavigate();
  const { lang } = useLanguage();
  const { activeShop } = useShop();
  const { mongoShop } = useAuth();

  const shopBusinessType = mongoShop?.business_type || activeShop?.business_type || activeShop?.id || localStorage.getItem('shopo_business_type') || '';
  const productPlaceholder = getProductPlaceholder(shopBusinessType, lang);
  const categoryPlaceholder = getCategoryPlaceholder(shopBusinessType, lang);

  const [categories, setCategories] = useState([]);
  const [brands, setBrands] = useState([]);
  const [suppliers, setSuppliers] = useState([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Inline Category Creator
  const [showAddCatInline, setShowAddCatInline] = useState(false);
  const [newCatName, setNewCatName] = useState('');
  const [isCreatingCat, setIsCreatingCat] = useState(false);

  // Inline Brand Creator
  const [showAddBrandInline, setShowAddBrandInline] = useState(false);
  const [newBrandName, setNewBrandName] = useState('');
  const [isCreatingBrand, setIsCreatingBrand] = useState(false);

  // Inline Supplier Creator
  const [showAddSuppInline, setShowAddSuppInline] = useState(false);
  const [newSuppData, setNewSuppData] = useState({ name: '', phone: '', company_name: '', address: '' });
  const [isCreatingSupp, setIsCreatingSupp] = useState(false);

  const [form, setForm] = useState({
    name: '',
    image_url: '',
    category_id: '__general__',
    brand_id: '',
    supplier_id: '',
    sku: '',
    barcode: '',
    cost_price: '',
    selling_price: '',
    stock_quantity: '',
    payment_type: 'due',
    paid_amount: '0',
    payment_method: 'cash',
    low_stock_threshold: 5,
    unit: 'pcs',
  });

  useEffect(() => {
    const loadData = async () => {
      try {
        const [catRes, suppRes, brandRes] = await Promise.all([
          api.categories.list().catch(() => ({ data: [] })),
          api.suppliers.list().catch(() => ({ data: [] })),
          api.brands.list().catch(() => ({ data: [] })),
        ]);
        if (catRes.data) setCategories(Array.isArray(catRes.data) ? catRes.data : []);
        if (suppRes.data) setSuppliers(Array.isArray(suppRes.data) ? suppRes.data : []);
        if (brandRes.data) setBrands(Array.isArray(brandRes.data) ? brandRes.data : []);
      } catch (err) {
        console.warn('Could not load categories/suppliers/brands:', err.message);
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

  const handleCreateBrand = async (e) => {
    e?.preventDefault();
    if (!newBrandName.trim()) return;

    setIsCreatingBrand(true);
    try {
      const res = await api.brands.create({ name: newBrandName.trim() });
      const created = res.data;
      if (created?._id) {
        setBrands((prev) => [...prev, created]);
        setForm((prev) => ({ ...prev, brand_id: created._id }));
        toast.success(lang === 'bn' ? 'ব্র্যান্ড তৈরি সম্পন্ন হয়েছে!' : 'Brand created successfully!');
      }
      setNewBrandName('');
      setShowAddBrandInline(false);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to create brand');
    } finally {
      setIsCreatingBrand(false);
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

  // Confirm Delete Dialog State for Categories, Brands and Suppliers
  const [deleteOptionModal, setDeleteOptionModal] = useState({
    isOpen: false,
    type: '', // 'category' | 'brand' | 'supplier'
    id: null,
    name: '',
    isLoading: false,
  });

  const promptDeleteCategory = (catId, catName) => {
    setDeleteOptionModal({
      isOpen: true,
      type: 'category',
      id: catId,
      name: catName,
      isLoading: false,
    });
  };

  const promptDeleteBrand = (brandId, brandName) => {
    setDeleteOptionModal({
      isOpen: true,
      type: 'brand',
      id: brandId,
      name: brandName,
      isLoading: false,
    });
  };

  const promptDeleteSupplier = (suppId, suppName) => {
    setDeleteOptionModal({
      isOpen: true,
      type: 'supplier',
      id: suppId,
      name: suppName,
      isLoading: false,
    });
  };

  const handleConfirmDeleteOption = async () => {
    if (!deleteOptionModal.id) return;
    setDeleteOptionModal((prev) => ({ ...prev, isLoading: true }));
    try {
      if (deleteOptionModal.type === 'category') {
        await api.categories.delete(deleteOptionModal.id);
        setCategories((prev) => prev.filter((c) => c._id !== deleteOptionModal.id));
        if (form.category_id === deleteOptionModal.id) {
          setForm((prev) => ({ ...prev, category_id: '__general__' }));
        }
        toast.success(lang === 'bn' ? `ক্যাটাগরি '${deleteOptionModal.name}' মুছে ফেলা হয়েছে!` : `Category '${deleteOptionModal.name}' deleted!`);
      } else if (deleteOptionModal.type === 'brand') {
        await api.brands.delete(deleteOptionModal.id);
        setBrands((prev) => prev.filter((b) => b._id !== deleteOptionModal.id));
        if (form.brand_id === deleteOptionModal.id) {
          setForm((prev) => ({ ...prev, brand_id: '' }));
        }
        toast.success(lang === 'bn' ? `ব্র্যান্ড '${deleteOptionModal.name}' মুছে ফেলা হয়েছে!` : `Brand '${deleteOptionModal.name}' deleted!`);
      } else if (deleteOptionModal.type === 'supplier') {
        await api.suppliers.delete(deleteOptionModal.id);
        setSuppliers((prev) => prev.filter((s) => s._id !== deleteOptionModal.id));
        if (form.supplier_id === deleteOptionModal.id) {
          setForm((prev) => ({ ...prev, supplier_id: '' }));
        }
        toast.success(lang === 'bn' ? `সাপ্লায়ার '${deleteOptionModal.name}' মুছে ফেলা হয়েছে!` : `Supplier '${deleteOptionModal.name}' deleted!`);
      }
      setDeleteOptionModal({ isOpen: false, type: '', id: null, name: '', isLoading: false });
    } catch (err) {
      toast.error(err.message || 'Failed to delete option.');
      setDeleteOptionModal((prev) => ({ ...prev, isLoading: false }));
    }
  };

  // Product Variations State
  const [hasVariants, setHasVariants] = useState(false);
  const [variationOptions, setVariationOptions] = useState([
    { name: 'Color', values: ['Red', 'Blue', 'Black'] },
  ]);
  const [variants, setVariants] = useState([]);

  // Preset attribute suggestions
  const attributePresets = [
    { name: 'Color', values: ['Red', 'Blue', 'Black', 'White', 'Green'] },
    { name: 'Size', values: ['S', 'M', 'L', 'XL', 'XXL'] },
    { name: 'Pages / Type', values: ['100 Pages', '200 Pages', '300 Pages'] },
    { name: 'Storage / RAM', values: ['64GB', '128GB', '256GB'] },
  ];

  // Generate Cartesian Product of Attributes
  const generateCombinations = () => {
    const validOptions = variationOptions.filter((opt) => opt.name.trim() && opt.values.length > 0);
    if (validOptions.length === 0) {
      toast.error(lang === 'bn' ? 'অনুগ্রহ করে অন্তত একটি বৈশিষ্ট্য ও মান লিখুন।' : 'Please add at least one attribute and value.');
      return;
    }

    const cartesian = (arrays) => {
      return arrays.reduce((acc, curr) => {
        return acc.flatMap((a) => curr.map((b) => [...a, b]));
      }, [[]]);
    };

    const valuesArrays = validOptions.map((opt) => opt.values);
    const combinations = cartesian(valuesArrays);

    const baseCost = parseFloat(form.cost_price) || 0;
    const baseSell = parseFloat(form.selling_price) || 0;
    const baseStock = parseInt(form.stock_quantity, 10) || 0;
    const basePrefix = form.name ? form.name.slice(0, 3).toUpperCase() : 'SKU';

    const newVariants = combinations.map((combo, idx) => {
      const variantAttrs = combo.map((val, optIdx) => ({
        name: validOptions[optIdx].name,
        value: val,
      }));
      const comboName = combo.join(' / ');
      const variantSku = `${basePrefix}-${Math.floor(1000 + Math.random() * 9000)}-V${idx + 1}`;

      return {
        id: `var_${Date.now()}_${idx}`,
        name: comboName,
        attributes: variantAttrs,
        sku: variantSku,
        barcode: '',
        cost_price: baseCost,
        selling_price: baseSell,
        stock_quantity: baseStock,
        low_stock_threshold: form.low_stock_threshold || 5,
      };
    });

    setVariants(newVariants);
    toast.success(lang === 'bn' ? `${newVariants.length} টি ভ্যারিয়েশন তৈরি হয়েছে!` : `Generated ${newVariants.length} variations!`);
  };

  // Add an Attribute Group
  const handleAddAttributeGroup = (preset) => {
    if (preset) {
      if (variationOptions.some((opt) => opt.name.toLowerCase() === preset.name.toLowerCase())) {
        toast.error(lang === 'bn' ? 'এই বৈশিষ্ট্যটি ইতিমধ্যে যুক্ত আছে।' : 'Attribute already added.');
        return;
      }
      setVariationOptions([...variationOptions, { name: preset.name, values: [...preset.values] }]);
    } else {
      setVariationOptions([...variationOptions, { name: '', values: [] }]);
    }
  };

  // Remove an Attribute Group
  const handleRemoveAttributeGroup = (index) => {
    setVariationOptions(variationOptions.filter((_, i) => i !== index));
  };

  // Update Option Group Name
  const handleUpdateOptionName = (index, name) => {
    const updated = [...variationOptions];
    updated[index].name = name;
    setVariationOptions(updated);
  };

  // Update Option Group Values (comma-separated string parser)
  const handleUpdateOptionValues = (index, valStr) => {
    const updated = [...variationOptions];
    const vals = valStr
      .split(',')
      .map((v) => v.trim())
      .filter((v) => v.length > 0);
    updated[index].values = vals;
    setVariationOptions(updated);
  };

  // Add Custom Single Variant Row
  const handleAddCustomVariant = () => {
    const baseCost = parseFloat(form.cost_price) || 0;
    const baseSell = parseFloat(form.selling_price) || 0;
    const basePrefix = form.name ? form.name.slice(0, 3).toUpperCase() : 'SKU';

    const newVar = {
      id: `var_${Date.now()}`,
      name: `Variant ${variants.length + 1}`,
      attributes: [],
      sku: `${basePrefix}-${Math.floor(1000 + Math.random() * 9000)}-V${variants.length + 1}`,
      barcode: '',
      cost_price: baseCost,
      selling_price: baseSell,
      stock_quantity: 0,
      low_stock_threshold: 5,
    };
    setVariants([...variants, newVar]);
  };

  // Update Single Variant field
  const handleUpdateVariant = (index, field, value) => {
    const updated = [...variants];
    updated[index] = { ...updated[index], [field]: value };
    setVariants(updated);
  };

  // Remove Single Variant
  const handleRemoveVariant = (index) => {
    setVariants(variants.filter((_, i) => i !== index));
  };

  // Bulk Apply to All Variants
  const [bulkCost, setBulkCost] = useState('');
  const [bulkSell, setBulkSell] = useState('');
  const [bulkStock, setBulkStock] = useState('');

  const handleBulkApply = () => {
    if (variants.length === 0) return;
    const updated = variants.map((v) => ({
      ...v,
      cost_price: bulkCost !== '' ? parseFloat(bulkCost) || 0 : v.cost_price,
      selling_price: bulkSell !== '' ? parseFloat(bulkSell) || 0 : v.selling_price,
      stock_quantity: bulkStock !== '' ? parseInt(bulkStock, 10) || 0 : v.stock_quantity,
    }));
    setVariants(updated);
    toast.success(lang === 'bn' ? 'সকল ভ্যারিয়েশনে তথ্য প্রয়োগ করা হয়েছে!' : 'Applied to all variations!');
  };

  // Calculate live total stock and total cost
  const totalVariantStock = hasVariants
    ? variants.reduce((acc, v) => acc + (parseInt(v.stock_quantity, 10) || 0), 0)
    : parseInt(form.stock_quantity, 10) || 0;

  const totalProcurementCost = hasVariants
    ? variants.reduce((acc, v) => acc + (parseInt(v.stock_quantity, 10) || 0) * (parseFloat(v.cost_price) || 0), 0)
    : (parseInt(form.stock_quantity, 10) || 0) * (parseFloat(form.cost_price) || 0);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.name.trim()) return;

    if (hasVariants && variants.length === 0) {
      toast.error(lang === 'bn' ? 'অনুগ্রহ করে অন্তত একটি ভ্যারিয়েশন তৈরি করুন।' : 'Please generate or add at least one variation.');
      return;
    }

    setIsSubmitting(true);
    try {
      const finalCatId = (form.category_id && form.category_id !== '__general__')
        ? form.category_id
        : (categories.find((c) => c.name?.toLowerCase() === 'general')?._id || undefined);

      const finalBrandId = (form.brand_id && form.brand_id !== '__none__')
        ? form.brand_id
        : undefined;
      const selectedBrand = brands.find((b) => b._id === form.brand_id);

      const initialStock = totalVariantStock;
      const costPrice = parseFloat(form.cost_price) || 0;
      const sellPrice = parseFloat(form.selling_price) || 0;
      const totalCost = totalProcurementCost;

      let calculatedPaid = 0;
      if (form.supplier_id) {
        if (form.payment_type === 'due') {
          calculatedPaid = 0;
        } else if (form.payment_type === 'full') {
          calculatedPaid = totalCost;
        } else if (form.payment_type === 'partial') {
          if (form.paid_amount !== '' && form.paid_amount !== undefined) {
            const val = parseFloat(form.paid_amount);
            calculatedPaid = !isNaN(val) ? Math.min(totalCost, Math.max(0, val)) : Math.round(totalCost * 0.5);
          } else {
            calculatedPaid = Math.round(totalCost * 0.5);
          }
        } else {
          calculatedPaid = 0;
        }
      } else {
        // No supplier -> fully paid walk-in stock
        calculatedPaid = totalCost;
      }

      const formattedVariants = hasVariants
        ? variants.map((v) => ({
            name: v.name.trim(),
            attributes: v.attributes || [],
            sku: v.sku ? v.sku.trim() : undefined,
            barcode: v.barcode ? v.barcode.trim() : undefined,
            cost_price: parseFloat(v.cost_price) || costPrice,
            selling_price: parseFloat(v.selling_price) || sellPrice,
            stock_quantity: parseInt(v.stock_quantity, 10) || 0,
            low_stock_threshold: parseInt(v.low_stock_threshold, 10) || 5,
          }))
        : [];

      const payload = {
        name: form.name.trim(),
        image_url: form.image_url || undefined,
        images: form.image_url ? [form.image_url] : [],
        category_id: finalCatId,
        brand_id: finalBrandId,
        brand: selectedBrand?.name || '',
        supplier_id: form.supplier_id || undefined,
        sku: form.sku.trim() || undefined,
        barcode: form.barcode.trim() || undefined,
        cost_price: costPrice,
        selling_price: sellPrice,
        stock_quantity: initialStock,
        has_variants: hasVariants,
        variation_options: hasVariants ? variationOptions.filter((o) => o.name && o.values.length > 0) : [],
        variants: formattedVariants,
        paid_amount: calculatedPaid,
        payment_method: form.payment_method || 'cash',
        low_stock_threshold: parseInt(form.low_stock_threshold, 10) || 5,
        unit: form.unit || 'pcs',
      };

      await api.products.create(payload);

      toast.success(lang === 'bn' ? 'পণ্য সফলভাবে ইনভেন্টরিতে সংরক্ষিত হয়েছে!' : 'Product added successfully to inventory!');
      navigate('/products');
    } catch (err) {
      toast.error(err.response?.data?.message || err.message || 'Failed to add product');
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
              ? 'আপনার দোকানের নতুন পণ্যের নাম, ছবি, ক্যাটাগরি, ব্র্যান্ড, সাপ্লায়ার, মূল্য ও স্টক সংখ্যা লিখুন।'
              : 'Fill in details below to register a new item with brand, vendor info and photos in your inventory database.'}
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
                onValueChange={(val) => {
                  if (val === '__add_new_cat__') {
                    setShowAddCatInline(true);
                  } else {
                    setForm({ ...form, category_id: val });
                  }
                }}
              >
                <SelectTrigger className="w-full bg-slate-50 dark:bg-[#09090b]">
                  <SelectValue placeholder="General" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem
                    value="__add_new_cat__"
                    className="text-[#00a86b] dark:text-[#00df89] font-bold border-b border-slate-100 dark:border-zinc-800/80 mb-1"
                  >
                    + {lang === 'bn' ? 'নতুন ক্যাটাগরি তৈরি করুন...' : 'Add New Category...'}
                  </SelectItem>
                  <SelectItem value="__general__">General</SelectItem>
                  {categories.filter(c => c.name?.toLowerCase() !== 'general').map((c) => (
                    <SelectItem
                      key={c._id}
                      value={c._id}
                      onDelete={() => promptDeleteCategory(c._id, c.name)}
                      deleteTitle={lang === 'bn' ? 'ক্যাটাগরি মুছুন' : 'Delete category'}
                    >
                      {c.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          </div>

          {/* Brand with Inline Brand Creator */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <label className="font-medium text-slate-700 dark:text-zinc-300">
                {lang === 'bn' ? 'ব্র্যান্ড' : 'Brand'}
              </label>
              <button
                type="button"
                onClick={() => {
                  setShowAddBrandInline(!showAddBrandInline);
                  setNewBrandName('');
                }}
                className="text-[11px] font-semibold text-[#00a86b] dark:text-[#00df89] hover:underline flex items-center gap-1 cursor-pointer"
              >
                <Tag className="w-3.5 h-3.5" />
                <span>{showAddBrandInline ? (lang === 'bn' ? 'তালিকা থেকে বেছে নিন' : 'Choose existing') : (lang === 'bn' ? '+ নতুন ব্র্যান্ড' : '+ Add New Brand')}</span>
              </button>
            </div>

            {showAddBrandInline ? (
              <div className="flex items-center gap-2 p-2.5 rounded-xl bg-emerald-500/5 border border-emerald-500/20">
                <input
                  type="text"
                  placeholder={lang === 'bn' ? 'ব্র্যান্ডের নাম লিখুন...' : 'Enter brand name...'}
                  value={newBrandName}
                  onChange={(e) => setNewBrandName(e.target.value)}
                  className="flex-1 px-3.5 py-2 rounded-lg bg-white dark:bg-[#09090b] border border-slate-200 dark:border-zinc-800 outline-none text-xs focus:ring-1 focus:ring-[#00df89]"
                />
                <Button
                  type="button"
                  size="sm"
                  disabled={isCreatingBrand || !newBrandName.trim()}
                  onClick={handleCreateBrand}
                  className="bg-[#00df89] hover:bg-[#00c97b] text-[#011812] font-semibold text-xs h-9 px-3.5 cursor-pointer"
                >
                  {isCreatingBrand ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : (lang === 'bn' ? 'সেভ' : 'Save & Select')}
                </Button>
              </div>
            ) : (
              <Select
                value={form.brand_id || '__none__'}
                onValueChange={(val) => {
                  if (val === '__add_new_brand__') {
                    setShowAddBrandInline(true);
                  } else {
                    setForm({ ...form, brand_id: val === '__none__' ? '' : val });
                  }
                }}
              >
                <SelectTrigger className="w-full bg-slate-50 dark:bg-[#09090b]">
                  <SelectValue placeholder="Brand" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem
                    value="__add_new_brand__"
                    className="text-[#00a86b] dark:text-[#00df89] font-bold border-b border-slate-100 dark:border-zinc-800/80 mb-1"
                  >
                    + {lang === 'bn' ? 'নতুন ব্র্যান্ড তৈরি করুন...' : 'Add New Brand...'}
                  </SelectItem>
                  <SelectItem value="__none__">{lang === 'bn' ? 'কোনোটি নয় (None)' : 'None / Generic'}</SelectItem>
                  {brands.map((b) => (
                    <SelectItem
                      key={b._id}
                      value={b._id}
                      onDelete={() => promptDeleteBrand(b._id, b.name)}
                      deleteTitle={lang === 'bn' ? 'ব্র্যান্ড মুছুন' : 'Delete brand'}
                    >
                      {b.name}
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
                      onDelete={() => promptDeleteSupplier(s._id, s.name)}
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

          {/* Variation Toggle Card */}
          <div className="p-4 rounded-2xl bg-gradient-to-r from-emerald-500/10 via-teal-500/5 to-transparent border border-emerald-500/30 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-[#00df89]/20 flex items-center justify-center text-[#00a86b] dark:text-[#00df89]">
                  <Layers className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="font-bold text-slate-900 dark:text-white text-xs sm:text-sm">
                    {lang === 'bn' ? 'পণ্যের ভ্যারিয়েশন (রং, সাইজ বা ধরন)' : 'Product Variations (Colors, Sizes, Types)'}
                  </h4>
                  <p className="text-[11px] text-slate-500 dark:text-zinc-400">
                    {lang === 'bn'
                      ? 'একাধিক রং (Red, Blue) বা সাইজ (S, M, L, XL) ও আলাদা স্টক/মূল্য যোগ করতে সক্রিয় করুন।'
                      : 'Enable if this item comes in multiple colors, sizes, or variants with custom stock & prices.'}
                  </p>
                </div>
              </div>

              {/* Toggle switch */}
              <button
                type="button"
                onClick={() => {
                  const nextVal = !hasVariants;
                  setHasVariants(nextVal);
                  if (nextVal && variants.length === 0) {
                    generateCombinations();
                  }
                }}
                className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                  hasVariants ? 'bg-[#00df89]' : 'bg-slate-300 dark:bg-zinc-700'
                }`}
              >
                <span
                  className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-lg ring-0 transition duration-200 ease-in-out ${
                    hasVariants ? 'translate-x-5 bg-[#011812]' : 'translate-x-0'
                  }`}
                />
              </button>
            </div>

            {/* VARIATIONS BUILDER ACCORDION / EXPANDER */}
            {hasVariants && (
              <div className="pt-3 border-t border-emerald-500/20 space-y-4 animate-in fade-in duration-150">
                
                {/* 1. Attribute Options Definition */}
                <div className="space-y-2.5 bg-white/70 dark:bg-[#09090b]/80 p-3.5 rounded-xl border border-slate-200/80 dark:border-zinc-800">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-xs text-slate-800 dark:text-zinc-200 flex items-center gap-1.5">
                      <Sliders className="w-3.5 h-3.5 text-[#00df89]" />
                      {lang === 'bn' ? '১. ভ্যারিয়েশন বৈশিষ্ট্যসমূহ (Attributes):' : '1. Define Attributes & Values:'}
                    </span>
                    <button
                      type="button"
                      onClick={() => handleAddAttributeGroup()}
                      className="text-[11px] font-semibold text-[#00a86b] dark:text-[#00df89] hover:underline flex items-center gap-1 cursor-pointer"
                    >
                      <Plus className="w-3 h-3" />
                      {lang === 'bn' ? '+ বৈশিষ্ট্য যোগ' : '+ Add Attribute'}
                    </button>
                  </div>

                  {/* Preset Buttons */}
                  <div className="flex flex-wrap gap-1.5 items-center">
                    <span className="text-[10px] text-slate-400 font-medium">Quick suggestions:</span>
                    {attributePresets.map((preset) => (
                      <button
                        key={preset.name}
                        type="button"
                        onClick={() => handleAddAttributeGroup(preset)}
                        className="px-2 py-0.5 rounded-md bg-emerald-500/10 hover:bg-emerald-500/20 text-[#00a86b] dark:text-[#00df89] text-[10px] font-bold transition-all cursor-pointer"
                      >
                        + {preset.name}
                      </button>
                    ))}
                  </div>

                  {/* Attribute Option Rows */}
                  <div className="space-y-2 pt-1">
                    {variationOptions.map((opt, idx) => (
                      <div key={idx} className="flex items-center gap-2 bg-slate-50 dark:bg-zinc-900/60 p-2 rounded-lg border border-slate-200/60 dark:border-zinc-800">
                        <div className="w-1/3">
                          <input
                            type="text"
                            placeholder="e.g. Color or Size"
                            value={opt.name}
                            onChange={(e) => handleUpdateOptionName(idx, e.target.value)}
                            className="w-full px-2.5 py-1.5 rounded-md bg-white dark:bg-[#09090b] border border-slate-200 dark:border-zinc-800 text-xs font-semibold text-slate-900 dark:text-white outline-none"
                          />
                        </div>
                        <div className="flex-1">
                          <input
                            type="text"
                            placeholder="Values comma-separated: e.g. Red, Blue, Green"
                            value={opt.values.join(', ')}
                            onChange={(e) => handleUpdateOptionValues(idx, e.target.value)}
                            className="w-full px-2.5 py-1.5 rounded-md bg-white dark:bg-[#09090b] border border-slate-200 dark:border-zinc-800 text-xs text-slate-900 dark:text-white outline-none"
                          />
                        </div>
                        <button
                          type="button"
                          onClick={() => handleRemoveAttributeGroup(idx)}
                          className="p-1.5 text-slate-400 hover:text-rose-500 rounded-md cursor-pointer"
                          title="Remove Attribute"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    ))}
                  </div>

                  {/* Generate Button */}
                  <div className="pt-2 flex justify-end">
                    <Button
                      type="button"
                      size="sm"
                      onClick={generateCombinations}
                      className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs h-8 px-3 font-semibold gap-1.5 cursor-pointer shadow-xs"
                    >
                      <RefreshCw className="w-3.5 h-3.5" />
                      <span>{lang === 'bn' ? 'ভ্যারিয়েশন কম্বিনেশন তৈরি করুন' : 'Generate Variant Matrix'}</span>
                    </Button>
                  </div>
                </div>

                {/* 2. Bulk Fill Fast-Action Bar */}
                {variants.length > 0 && (
                  <div className="p-3 rounded-xl bg-slate-100/80 dark:bg-zinc-900/80 border border-slate-200 dark:border-zinc-800 space-y-2 text-xs">
                    <div className="flex items-center justify-between">
                      <span className="font-semibold text-slate-700 dark:text-zinc-300 flex items-center gap-1.5">
                        <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                        {lang === 'bn' ? 'বাল্ক সেট (এক ক্লিকে সবার জন্য মূল্য ও স্টক বসান):' : 'Bulk Fast Fill (Apply to all variants):'}
                      </span>
                      <button
                        type="button"
                        onClick={handleBulkApply}
                        className="px-2.5 py-1 rounded-lg bg-[#00df89] hover:bg-[#00c97b] text-[#011812] font-bold text-xs cursor-pointer shadow-xs"
                      >
                        {lang === 'bn' ? 'সবার উপর প্রয়োগ করুন' : 'Apply to All'}
                      </button>
                    </div>

                    <div className="grid grid-cols-3 gap-2">
                      <input
                        type="number"
                        placeholder="Cost (৳) for all"
                        value={bulkCost}
                        onChange={(e) => setBulkCost(e.target.value)}
                        className="px-2.5 py-1.5 rounded-lg bg-white dark:bg-[#09090b] border border-slate-200 dark:border-zinc-800 text-xs"
                      />
                      <input
                        type="number"
                        placeholder="Selling (৳) for all"
                        value={bulkSell}
                        onChange={(e) => setBulkSell(e.target.value)}
                        className="px-2.5 py-1.5 rounded-lg bg-white dark:bg-[#09090b] border border-slate-200 dark:border-zinc-800 text-xs"
                      />
                      <input
                        type="number"
                        placeholder="Stock (Pcs) for all"
                        value={bulkStock}
                        onChange={(e) => setBulkStock(e.target.value)}
                        className="px-2.5 py-1.5 rounded-lg bg-white dark:bg-[#09090b] border border-slate-200 dark:border-zinc-800 text-xs"
                      />
                    </div>
                  </div>
                )}

                {/* 3. Variants Matrix Table */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-xs text-slate-800 dark:text-zinc-200 flex items-center gap-1.5">
                      <Boxes className="w-3.5 h-3.5 text-[#00df89]" />
                      {lang === 'bn' ? `২. ভ্যারিয়েশন তালিকা (${variants.length} টি):` : `2. Variations List (${variants.length}):`}
                    </span>
                    <button
                      type="button"
                      onClick={handleAddCustomVariant}
                      className="text-[11px] font-semibold text-[#00a86b] dark:text-[#00df89] hover:underline flex items-center gap-1 cursor-pointer"
                    >
                      <Plus className="w-3 h-3" />
                      {lang === 'bn' ? '+ কাস্টম ভ্যারিয়েশন' : '+ Add Custom Variant'}
                    </button>
                  </div>

                  {variants.length === 0 ? (
                    <div className="p-6 text-center rounded-xl bg-slate-50 dark:bg-zinc-900/40 border border-dashed border-slate-200 dark:border-zinc-800 text-slate-400 text-xs">
                      {lang === 'bn' ? 'কোন ভ্যারিয়েশন তৈরি হয়নি। উপরের বাটনে ক্লিক করে কম্বিনেশন তৈরি করুন।' : 'No variations generated yet. Click "Generate Variant Matrix" above.'}
                    </div>
                  ) : (
                    <div className="overflow-x-auto rounded-xl border border-slate-200 dark:border-zinc-800">
                      <table className="w-full text-left text-xs border-collapse">
                        <thead>
                          <tr className="bg-slate-100 dark:bg-zinc-900 border-b border-slate-200 dark:border-zinc-800 text-slate-600 dark:text-zinc-400">
                            <th className="py-2 px-3 font-semibold min-w-[140px]">{lang === 'bn' ? 'ভ্যারিয়েশন নাম' : 'Variant'}</th>
                            <th className="py-2 px-2.5 font-semibold min-w-[120px]">SKU</th>
                            <th className="py-2 px-2.5 font-semibold min-w-[90px]">{lang === 'bn' ? 'ক্রয় (৳)' : 'Cost (৳)'}</th>
                            <th className="py-2 px-2.5 font-semibold min-w-[90px]">{lang === 'bn' ? 'বিক্রয় (৳)' : 'Price (৳)'}</th>
                            <th className="py-2 px-2.5 font-semibold min-w-[80px]">{lang === 'bn' ? 'স্টক (Pcs)' : 'Stock'}</th>
                            <th className="py-2 px-2 font-semibold text-center w-10"></th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 dark:divide-zinc-800/60 bg-white dark:bg-[#09090b]">
                          {variants.map((v, vIdx) => (
                            <tr key={v.id || vIdx} className="hover:bg-slate-50 dark:hover:bg-zinc-900/40 transition-colors">
                              <td className="py-2 px-3">
                                <input
                                  type="text"
                                  value={v.name}
                                  onChange={(e) => handleUpdateVariant(vIdx, 'name', e.target.value)}
                                  className="w-full px-2 py-1 rounded bg-slate-50 dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 text-xs font-semibold text-slate-900 dark:text-white outline-none"
                                />
                              </td>
                              <td className="py-2 px-2.5">
                                <input
                                  type="text"
                                  value={v.sku}
                                  onChange={(e) => handleUpdateVariant(vIdx, 'sku', e.target.value)}
                                  className="w-full px-2 py-1 rounded bg-slate-50 dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 text-xs font-mono text-slate-700 dark:text-zinc-300 outline-none"
                                />
                              </td>
                              <td className="py-2 px-2.5">
                                <input
                                  type="number"
                                  value={v.cost_price}
                                  onChange={(e) => handleUpdateVariant(vIdx, 'cost_price', e.target.value)}
                                  className="w-full px-2 py-1 rounded bg-slate-50 dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 text-xs font-mono outline-none"
                                />
                              </td>
                              <td className="py-2 px-2.5">
                                <input
                                  type="number"
                                  value={v.selling_price}
                                  onChange={(e) => handleUpdateVariant(vIdx, 'selling_price', e.target.value)}
                                  className="w-full px-2 py-1 rounded bg-slate-50 dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 text-xs font-mono font-bold text-[#00a86b] dark:text-[#00df89] outline-none"
                                />
                              </td>
                              <td className="py-2 px-2.5">
                                <input
                                  type="number"
                                  value={v.stock_quantity}
                                  onChange={(e) => handleUpdateVariant(vIdx, 'stock_quantity', e.target.value)}
                                  className="w-full px-2 py-1 rounded bg-slate-50 dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 text-xs font-mono font-bold outline-none"
                                />
                              </td>
                              <td className="py-2 px-2 text-center">
                                <button
                                  type="button"
                                  onClick={() => handleRemoveVariant(vIdx)}
                                  className="p-1 text-slate-400 hover:text-rose-500 rounded cursor-pointer"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}

                  {/* Summary Bar */}
                  <div className="p-2.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex flex-wrap items-center justify-between text-xs font-semibold">
                    <span className="text-slate-700 dark:text-zinc-300">
                      {lang === 'bn' ? 'মোট ভ্যারিয়েশন সংখ্যা:' : 'Total Variations:'}{' '}
                      <span className="font-bold text-slate-900 dark:text-white">{variants.length}</span>
                    </span>
                    <span className="text-slate-700 dark:text-zinc-300">
                      {lang === 'bn' ? 'মোট সামগ্রিক স্টক:' : 'Total Aggregate Stock:'}{' '}
                      <span className="font-bold text-emerald-600 dark:text-[#00df89]">{totalVariantStock} Pcs</span>
                    </span>
                    <span className="text-slate-700 dark:text-zinc-300">
                      {lang === 'bn' ? 'মোট ক্রয় মূল্য:' : 'Total Procurement Value:'}{' '}
                      <span className="font-bold text-emerald-600 dark:text-[#00df89]">৳ {totalProcurementCost.toLocaleString()}</span>
                    </span>
                  </div>
                </div>

              </div>
            )}
          </div>

          {/* Standard Single Stock inputs when variations are disabled */}
          {!hasVariants && (
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
          )}

          {/* Supplier Stock Purchase Payment Section in AddProduct Page */}
          {form.supplier_id && (
            <div className="p-4 rounded-2xl bg-amber-500/5 dark:bg-zinc-900/70 border border-amber-500/20 dark:border-zinc-800 space-y-3.5 animate-in fade-in duration-200">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Wallet className="w-4 h-4 text-amber-500" />
                  <span className="font-bold text-slate-800 dark:text-zinc-200 text-xs sm:text-sm">
                    {lang === 'bn' ? 'সাপ্লায়ার পেমেন্ট অপশন' : 'Supplier Payment Option'}
                  </span>
                </div>
                <span className="text-xs font-mono font-bold text-slate-700 dark:text-zinc-300">
                  {lang === 'bn' ? 'মোট ক্রয় বিল:' : 'Total Cost:'}{' '}
                  <span className="text-[#00a86b] dark:text-[#00df89]">
                    ৳{totalProcurementCost.toLocaleString()}
                  </span>
                </span>
              </div>

              {/* Payment Type Tabs: Full Paid vs Partial vs Full Due */}
              <div className="space-y-1.5">
                <label className="block font-medium text-slate-700 dark:text-zinc-300 text-xs">
                  {lang === 'bn' ? 'পেমেন্টের ধরন নির্বাচন করুন:' : 'Select Payment Option:'}
                </label>
                <div className="grid grid-cols-3 gap-2 sm:gap-3">
                  <button
                    type="button"
                    onClick={() =>
                      setForm((prev) => ({
                        ...prev,
                        payment_type: 'full',
                        paid_amount: String(totalProcurementCost),
                      }))
                    }
                    className={`py-2.5 px-2 rounded-xl text-xs font-semibold border flex flex-col items-center justify-center gap-0.5 transition-all cursor-pointer ${
                      form.payment_type === 'full'
                        ? 'bg-[#00df89]/15 text-[#00a86b] dark:text-[#00df89] border-[#00df89] shadow-xs'
                        : 'bg-white dark:bg-zinc-900 text-slate-600 dark:text-zinc-400 border-slate-200 dark:border-zinc-800 hover:border-slate-300'
                    }`}
                  >
                    <span className="font-bold">{lang === 'bn' ? 'সম্পূর্ণ পরিশোধ' : 'Full Paid'}</span>
                    <span className="text-[10px] font-normal opacity-80">(100% Paid)</span>
                  </button>

                  <button
                    type="button"
                    onClick={() =>
                      setForm((prev) => ({
                        ...prev,
                        payment_type: 'partial',
                        paid_amount: String(Math.round(totalProcurementCost / 2)),
                      }))
                    }
                    className={`py-2.5 px-2 rounded-xl text-xs font-semibold border flex flex-col items-center justify-center gap-0.5 transition-all cursor-pointer ${
                      form.payment_type === 'partial'
                        ? 'bg-amber-500/15 text-amber-600 dark:text-amber-400 border-amber-500 shadow-xs'
                        : 'bg-white dark:bg-zinc-900 text-slate-600 dark:text-zinc-400 border-slate-200 dark:border-zinc-800 hover:border-slate-300'
                    }`}
                  >
                    <span className="font-bold">{lang === 'bn' ? 'আংশিক পরিশোধ' : 'Partial Paid'}</span>
                    <span className="text-[10px] font-normal opacity-80">(Partial Due)</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setForm((prev) => ({ ...prev, payment_type: 'due', paid_amount: '0' }))}
                    className={`py-2.5 px-2 rounded-xl text-xs font-semibold border flex flex-col items-center justify-center gap-0.5 transition-all cursor-pointer ${
                      form.payment_type === 'due'
                        ? 'bg-red-500/15 text-red-600 dark:text-red-400 border-red-500 shadow-xs'
                        : 'bg-white dark:bg-zinc-900 text-slate-600 dark:text-zinc-400 border-slate-200 dark:border-zinc-800 hover:border-slate-300'
                    }`}
                  >
                    <span className="font-bold">{lang === 'bn' ? 'সম্পূর্ণ বাকি' : 'Full Due'}</span>
                    <span className="text-[10px] font-normal opacity-80">(0% Paid)</span>
                  </button>
                </div>
              </div>

              {/* Partial Input Box */}
              {form.payment_type === 'partial' && (
                <div className="p-3 rounded-xl bg-white dark:bg-[#09090b] border border-amber-500/30 space-y-2">
                  <div className="flex items-center justify-between">
                    <label className="font-medium text-slate-700 dark:text-zinc-300 text-xs">
                      {lang === 'bn' ? 'কত টাকা দিয়েছেন (৳):' : 'Amount Paid (৳):'}
                    </label>
                    <div className="flex items-center gap-1.5">
                      <button
                        type="button"
                        onClick={() => {
                          setForm((prev) => ({ ...prev, payment_type: 'partial', paid_amount: String(Math.round(totalProcurementCost * 0.5)) }));
                        }}
                        className="px-2.5 py-0.5 rounded bg-slate-100 dark:bg-zinc-800 hover:bg-amber-500/10 text-xs font-bold text-slate-700 dark:text-zinc-300 cursor-pointer"
                      >
                        50%
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setForm((prev) => ({ ...prev, payment_type: 'partial', paid_amount: String(Math.round(totalProcurementCost * 0.25)) }));
                        }}
                        className="px-2.5 py-0.5 rounded bg-slate-100 dark:bg-zinc-800 hover:bg-amber-500/10 text-xs font-bold text-slate-700 dark:text-zinc-300 cursor-pointer"
                      >
                        25%
                      </button>
                    </div>
                  </div>
                  <input
                    type="number"
                    placeholder="0.00"
                    value={form.paid_amount}
                    onChange={(e) => setForm((prev) => ({ ...prev, payment_type: 'partial', paid_amount: e.target.value }))}
                    className="w-full px-3.5 py-2 rounded-lg bg-slate-50 dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 text-sm font-mono font-bold text-slate-900 dark:text-white outline-none"
                  />
                  <div className="flex items-center justify-between text-xs pt-1">
                    <span className="text-slate-500">{lang === 'bn' ? 'সাপ্লায়ার বাকি থাকবে:' : 'Remaining Due:'}</span>
                    <span className="font-mono font-bold text-amber-600 dark:text-amber-400">
                      ৳{Math.max(
                        0,
                        totalProcurementCost - (parseFloat(form.paid_amount) || 0)
                      ).toLocaleString()}
                    </span>
                  </div>
                </div>
              )}

              {/* Due message */}
              {form.payment_type === 'due' && (
                <div className="px-3.5 py-2 rounded-xl bg-red-500/5 border border-red-500/20 text-red-600 dark:text-red-400 text-xs flex items-center justify-between">
                  <span>{lang === 'bn' ? 'সম্পূর্ণ বিল বাকি রাখা হবে' : 'Full cost will remain as supplier due'}</span>
                  <span className="font-mono font-bold">
                    ৳{totalProcurementCost.toLocaleString()}
                  </span>
                </div>
              )}

              {/* Payment Method Selector (shown if not full due) */}
              {form.payment_type !== 'due' && (
                <div className="space-y-1">
                  <label className="font-medium text-slate-700 dark:text-zinc-300 text-xs">
                    {lang === 'bn' ? 'পেমেন্ট মাধ্যম (Payment Method)' : 'Payment Method'}
                  </label>
                  <Select
                    value={form.payment_method || 'cash'}
                    onValueChange={(val) => setForm((prev) => ({ ...prev, payment_method: val }))}
                  >
                    <SelectTrigger className="w-full bg-white dark:bg-[#09090b] h-9 text-xs">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="cash">{lang === 'bn' ? 'ক্যাশ / নগদ (Cash)' : 'Cash'}</SelectItem>
                      <SelectItem value="bkash">{lang === 'bn' ? 'বিকাশ (bKash)' : 'bKash'}</SelectItem>
                      <SelectItem value="nagad">{lang === 'bn' ? 'নগদ (Nagad)' : 'Nagad'}</SelectItem>
                      <SelectItem value="rocket">{lang === 'bn' ? 'রকেট (Rocket)' : 'Rocket'}</SelectItem>
                      <SelectItem value="bank_transfer">{lang === 'bn' ? 'ব্যাংক ট্রান্সফার (Bank Transfer)' : 'Bank Transfer'}</SelectItem>
                      <SelectItem value="card">{lang === 'bn' ? 'কার্ড (Card)' : 'Card'}</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              )}
            </div>
          )}

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

      {/* Confirm Delete Category / Supplier Option Modal */}
      <ConfirmDialog
        isOpen={deleteOptionModal.isOpen}
        isLoading={deleteOptionModal.isLoading}
        title={
          deleteOptionModal.type === 'category'
            ? (lang === 'bn' ? `ক্যাটাগরি '${deleteOptionModal.name}' মুছে ফেলবেন?` : `Delete category '${deleteOptionModal.name}'?`)
            : deleteOptionModal.type === 'brand'
            ? (lang === 'bn' ? `ব্র্যান্ড '${deleteOptionModal.name}' মুছে ফেলবেন?` : `Delete brand '${deleteOptionModal.name}'?`)
            : (lang === 'bn' ? `সাপ্লায়ার '${deleteOptionModal.name}' মুছে ফেলবেন?` : `Delete supplier '${deleteOptionModal.name}'?`)
        }
        description={
          deleteOptionModal.type === 'category'
            ? (lang === 'bn' ? 'এই ক্যাটাগরিটি মুছে ফেলা হবে। পূর্বে যুক্ত পণ্যগুলো অপরিবর্তিত থাকবে।' : 'This category option will be removed from your store.')
            : deleteOptionModal.type === 'brand'
            ? (lang === 'bn' ? 'এই ব্র্যান্ড তথ্যটি মুছে ফেলা হবে।' : 'This brand option will be removed from your store.')
            : (lang === 'bn' ? 'এই সাপ্লায়ার তথ্যটি মুছে ফেলা হবে। পূর্বে করা ক্রয়ের হিসাব অক্ষুণ্ণ থাকবে।' : 'This supplier profile will be removed from your directory.')
        }
        confirmText={lang === 'bn' ? 'হ্যাঁ, মুছুন' : 'Yes, Delete'}
        cancelText={lang === 'bn' ? 'বাতিল' : 'Cancel'}
        onConfirm={handleConfirmDeleteOption}
        onCancel={() => setDeleteOptionModal({ isOpen: false, type: '', id: null, name: '', isLoading: false })}
      />

    </div>
  );
}
