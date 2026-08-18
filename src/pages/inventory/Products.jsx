/**
 * @file Products.jsx
 * @description Comprehensive Products catalog & Inventory management with Live DB sync, Category-wise sorting, Category filters, Edit product modal, and Inline Category creation.
 */
import { useState, useMemo, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { useShop } from '@/context/ShopContext';
import { useLanguage } from '@/context/LanguageContext';
import { useAuth } from '@/context/AuthContext';
import { getProductPlaceholder, getCategoryPlaceholder } from '@/lib/productPlaceholders';
import api from '@/services/api';
import toast from 'react-hot-toast';
import { Card, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Select,
  SelectTrigger,
  SelectContent,
  SelectItem,
  SelectValue
} from '@/components/ui/select';
import ConfirmDialog from '@/components/common/ConfirmDialog';
import ProductImageUploader from '@/components/common/ProductImageUploader';
import {
  Package, DollarSign, Plus, Search, Filter, AlertTriangle,
  Download, Edit2, Trash2, CheckCircle2, Clock, X, Barcode,
  Layers, ArrowUpRight, ShieldCheck, Tag, ChevronRight, Loader2,
  Sparkles, FolderPlus, ArrowUpDown, ArrowUp, ArrowDown, ImageIcon
} from 'lucide-react';

export default function Products() {
  const location = useLocation();
  const { activeShop } = useShop();
  const { lang, t } = useLanguage();
  const { mongoShop } = useAuth();

  const shopBusinessType = mongoShop?.business_type || activeShop?.business_type || activeShop?.id || localStorage.getItem('shopo_business_type') || '';
  const productPlaceholder = getProductPlaceholder(shopBusinessType, lang);
  const categoryPlaceholder = getCategoryPlaceholder(shopBusinessType, lang);

  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [stockStatusFilter, setStockStatusFilter] = useState('all');
  const [sortBy, setSortBy] = useState('category_asc');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);

  useEffect(() => {
    if (location.state?.openAddModal || new URLSearchParams(location.search).get('action') === 'add') {
      setIsAddModalOpen(true);
    }
  }, [location]);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [productList, setProductList] = useState([]);
  const [categories, setCategories] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  // Inline Category Creator State
  const [showAddCatInline, setShowAddCatInline] = useState(false);
  const [showEditCatInline, setShowEditCatInline] = useState(false);
  const [newCatName, setNewCatName] = useState('');
  const [isCreatingCat, setIsCreatingCat] = useState(false);

  // New Product Form State
  const [newProduct, setNewProduct] = useState({
    name: '',
    image_url: '',
    category_id: '__general__',
    sku: '',
    barcode: '',
    stock: '',
    buyPrice: '',
    sellPrice: '',
    unit: 'Pcs',
    lowStockThreshold: 5,
  });

  // Edit Product Form State
  const [editForm, setEditForm] = useState({
    id: '',
    name: '',
    image_url: '',
    category_id: '',
    sku: '',
    barcode: '',
    stock: '',
    buyPrice: '',
    sellPrice: '',
    unit: 'Pcs',
    lowStockThreshold: 5,
  });

  const fetchDbProducts = async () => {
    setIsLoading(true);
    try {
      const [prodRes, catRes] = await Promise.all([
        api.products.list(),
        api.categories.list().catch(() => ({ data: [] })),
      ]);
      const rawList = Array.isArray(prodRes?.data)
        ? prodRes.data
        : Array.isArray(prodRes?.data?.docs)
        ? prodRes.data.docs
        : [];

      const fetchedCategories = Array.isArray(catRes?.data) ? catRes.data : [];
      if (catRes?.data) {
        setCategories(fetchedCategories);
      }

      const mapped = rawList.map((p) => {
        const catObj = typeof p.category_id === 'object' ? p.category_id : null;
        const catId = catObj?._id || p.category_id || '';
        const matchingCat = fetchedCategories.find((c) => String(c._id) === String(catId));
        const catName =
          catObj?.name ||
          matchingCat?.name ||
          (typeof p.category_id === 'string' && p.category_id.length !== 24 ? p.category_id : 'General');

        return {
          id: p._id,
          name: p.name,
          image_url: p.image_url || (Array.isArray(p.images) && p.images[0]) || '',
          sku: p.sku || 'N/A',
          barcode: p.barcode || '',
          category_id: matchingCat ? matchingCat._id : (catId || '__general__'),
          category: catName,
          stock: p.stock_quantity ?? 0,
          unit: p.unit || 'Pcs',
          buyPrice: p.cost_price ?? 0,
          sellPrice: p.selling_price ?? 0,
          lowStockThreshold: p.low_stock_threshold ?? 5,
          status: p.stock_quantity <= 0 ? 'out_of_stock' : p.stock_quantity <= (p.low_stock_threshold || 5) ? 'low_stock' : 'in_stock',
          created_at: p.created_at || '',
        };
      });
      setProductList(mapped);
    } catch (err) {
      console.warn('Could not fetch DB products:', err.message);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchDbProducts();
  }, []);

  // Filter and Sort products
  const filteredProducts = useMemo(() => {
    const list = productList.filter(prod => {
      const matchesCategory = categoryFilter === 'all' || prod.category.toLowerCase() === categoryFilter.toLowerCase();
      const matchesStatus = stockStatusFilter === 'all' || prod.status === stockStatusFilter;
      const matchesSearch = !searchQuery.trim() || 
        prod.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        prod.sku.toLowerCase().includes(searchQuery.toLowerCase()) ||
        prod.barcode.toLowerCase().includes(searchQuery.toLowerCase());
      return matchesCategory && matchesStatus && matchesSearch;
    });

    return list.sort((a, b) => {
      if (sortBy === 'name_asc') {
        return a.name.localeCompare(b.name);
      }
      if (sortBy === 'name_desc') {
        return b.name.localeCompare(a.name);
      }
      if (sortBy === 'category_asc') {
        return a.category.localeCompare(b.category);
      }
      if (sortBy === 'category_desc') {
        return b.category.localeCompare(a.category);
      }
      if (sortBy === 'price_asc') {
        return a.sellPrice - b.sellPrice;
      }
      if (sortBy === 'price_desc') {
        return b.sellPrice - a.sellPrice;
      }
      if (sortBy === 'stock_asc') {
        return a.stock - b.stock;
      }
      if (sortBy === 'stock_desc') {
        return b.stock - a.stock;
      }
      if (sortBy === 'newest') {
        return new Date(b.created_at) - new Date(a.created_at);
      }
      return 0;
    });
  }, [productList, searchQuery, categoryFilter, stockStatusFilter, sortBy]);

  // Toggle Category Header Sort
  const toggleCategorySort = () => {
    if (sortBy === 'category_asc') {
      setSortBy('category_desc');
    } else {
      setSortBy('category_asc');
    }
  };

  // Inventory Summary Metrics
  const totalProductsCount = productList.length;
  const inStockCount = productList.filter(p => p.status === 'in_stock').length;
  const lowStockCount = productList.filter(p => p.status === 'low_stock').length;
  const outOfStockCount = productList.filter(p => p.status === 'out_of_stock').length;
  const totalStockValue = productList.reduce((acc, p) => acc + (p.stock * p.buyPrice), 0);

  // Unique list of categories in inventory
  const uniqueCategories = useMemo(() => {
    const set = new Set(productList.map(p => p.category));
    return Array.from(set);
  }, [productList]);

  // Handle Inline Category Creation
  const handleCreateCategory = async (forEdit = false) => {
    if (!newCatName.trim()) return;
    setIsCreatingCat(true);
    try {
      const res = await api.categories.create({ name: newCatName.trim() });
      if (res.data) {
        setCategories(prev => [...prev, res.data]);
        if (forEdit) {
          setEditForm(prev => ({ ...prev, category_id: res.data._id }));
          setShowEditCatInline(false);
        } else {
          setNewProduct(prev => ({ ...prev, category_id: res.data._id }));
          setShowAddCatInline(false);
        }
        toast.success(lang === 'bn' ? `ক্যাটাগরি '${res.data.name}' যুক্ত হয়েছে!` : `Category '${res.data.name}' created!`);
        setNewCatName('');
      }
    } catch (err) {
      toast.error(err.message || 'Failed to create category.');
    } finally {
      setIsCreatingCat(false);
    }
  };

  // Handle Add Product Submit
  const handleAddProduct = async (e) => {
    e.preventDefault();
    if (!newProduct.name || !newProduct.sellPrice) return;

    setIsSubmitting(true);
    try {
      const finalCatId = (newProduct.category_id && newProduct.category_id !== '__general__')
        ? newProduct.category_id
        : (categories.find((c) => c.name?.toLowerCase() === 'general')?._id || undefined);

      await api.products.create({
        name: newProduct.name.trim(),
        image_url: newProduct.image_url || undefined,
        images: newProduct.image_url ? [newProduct.image_url] : [],
        category_id: finalCatId,
        sku: newProduct.sku ? newProduct.sku.trim() : undefined,
        barcode: newProduct.barcode ? newProduct.barcode.trim() : undefined,
        cost_price: parseFloat(newProduct.buyPrice) || 0,
        selling_price: parseFloat(newProduct.sellPrice) || 0,
        stock_quantity: parseInt(newProduct.stock, 10) || 0,
        unit: newProduct.unit || 'Pcs',
        low_stock_threshold: parseInt(newProduct.lowStockThreshold, 10) || 5,
      });

      setIsAddModalOpen(false);
      setNewProduct({
        name: '',
        image_url: '',
        category_id: '__general__',
        sku: '',
        barcode: '',
        stock: '',
        buyPrice: '',
        sellPrice: '',
        unit: 'Pcs',
        lowStockThreshold: 5,
      });
      toast.success(lang === 'bn' ? 'পণ্য সফলভাবে যুক্ত হয়েছে!' : 'Product added successfully!');
      fetchDbProducts();
    } catch (err) {
      toast.error(err.message || 'Failed to save product in database.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Open Edit Modal
  const handleOpenEdit = (product) => {
    setEditingProduct(product);
    let catId = product.category_id;
    if (catId && typeof catId === 'object') {
      catId = catId._id;
    }
    const matchingCat = categories.find(
      (c) => String(c._id) === String(catId) || c.name?.toLowerCase() === (product.category || '').toLowerCase()
    );
    const resolvedCatId = matchingCat
      ? matchingCat._id
      : (catId && catId !== '__general__' && categories.some((c) => String(c._id) === String(catId)) ? catId : '__general__');

    setEditForm({
      id: product.id,
      name: product.name,
      image_url: product.image_url || '',
      category_id: resolvedCatId,
      sku: product.sku !== 'N/A' ? product.sku : '',
      barcode: product.barcode || '',
      stock: product.stock,
      buyPrice: product.buyPrice,
      sellPrice: product.sellPrice,
      unit: product.unit || 'Pcs',
      lowStockThreshold: product.lowStockThreshold || 5,
    });
    setIsEditModalOpen(true);
  };

  // Handle Update Product Submit
  const handleUpdateProduct = async (e) => {
    e.preventDefault();
    if (!editForm.name || !editForm.sellPrice) return;

    setIsSubmitting(true);
    try {
      await api.products.update(editForm.id, {
        name: editForm.name.trim(),
        image_url: editForm.image_url || '',
        images: editForm.image_url ? [editForm.image_url] : [],
        category_id: editForm.category_id || null,
        sku: editForm.sku ? editForm.sku.trim() : undefined,
        barcode: editForm.barcode ? editForm.barcode.trim() : undefined,
        cost_price: parseFloat(editForm.buyPrice) || 0,
        selling_price: parseFloat(editForm.sellPrice) || 0,
        stock_quantity: parseInt(editForm.stock, 10) || 0,
        unit: editForm.unit || 'Pcs',
        low_stock_threshold: parseInt(editForm.lowStockThreshold, 10) || 5,
      });

      setIsEditModalOpen(false);
      setEditingProduct(null);
      toast.success(lang === 'bn' ? 'পণ্য সফলভাবে আপডেট করা হয়েছে!' : 'Product updated successfully!');
      fetchDbProducts();
    } catch (err) {
      toast.error(err.message || 'Failed to update product.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Confirm Delete Dialog State
  const [isDeleting, setIsDeleting] = useState(false);
  const [confirmDeleteDialog, setConfirmDeleteDialog] = useState({
    isOpen: false,
    productId: null,
    productName: '',
  });

  const handleDeleteProduct = (product) => {
    setConfirmDeleteDialog({
      isOpen: true,
      productId: product.id,
      productName: product.name,
    });
  };

  const handleConfirmDeleteProduct = async () => {
    if (!confirmDeleteDialog.productId) return;
    setIsDeleting(true);
    try {
      await api.products.delete(confirmDeleteDialog.productId);
      toast.success(lang === 'bn' ? `'${confirmDeleteDialog.productName}' মুছে ফেলা হয়েছে!` : `'${confirmDeleteDialog.productName}' deleted successfully!`);
      setConfirmDeleteDialog({ isOpen: false, productId: null, productName: '' });
      fetchDbProducts();
    } catch (err) {
      toast.error(err.message || 'Failed to delete product from database.');
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="space-y-6 font-sans pb-12">
      
      {/* ---------------------------------------------------- */}
      {/* TOP HEADER & ACTION ROW                              */}
      {/* ---------------------------------------------------- */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white tracking-tight flex items-center gap-2.5">
            <Package className="w-6 h-6 text-[#00df89]" />
            <span>{lang === 'bn' ? 'পণ্য ও ইনভেন্টরি ক্যাটালগ' : 'Products & Inventory Catalog'}</span>
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-zinc-400 font-normal mt-0.5">
            {lang === 'bn' ? 'সকল পণ্যের তালিকা, ক্যাটাগরি অনুসারে সাজানো, স্টক কাউন্ট ও মূল্য' : 'Manage your catalog with category sorting, real-time stock levels & barcode SKUs'}
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <Button
            onClick={() => setIsAddModalOpen(true)}
            className="bg-[#00df89] hover:bg-[#00c97b] text-[#011812] font-semibold text-xs sm:text-sm h-10 px-4 gap-2 shadow-xs cursor-pointer"
          >
            <Plus className="w-4 h-4 stroke-[2.5]" />
            <span>{lang === 'bn' ? 'নতুন পণ্য যোগ করুন' : 'Add Product'}</span>
          </Button>
        </div>
      </div>

      {/* ---------------------------------------------------- */}
      {/* SUMMARY STAT CARDS (4 Columns)                       */}
      {/* ---------------------------------------------------- */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="p-4 sm:p-5 border-slate-200/90 dark:border-zinc-800/80 dark:bg-[#121215]">
          <div className="flex items-center justify-between">
            <span className="text-xs sm:text-sm font-medium text-slate-500 dark:text-zinc-400">
              {lang === 'bn' ? 'মোট পণ্য সংখ্যা' : 'Total Products'}
            </span>
            <Package className="w-4 h-4 text-slate-400" />
          </div>
          <div className="text-2xl sm:text-3xl font-bold text-slate-900 dark:text-white mt-2">
            {isLoading ? <Skeleton className="h-8 w-20 my-0.5" /> : totalProductsCount}
          </div>
          <div className="text-xs text-slate-500 mt-1">
            {lang === 'bn' ? 'ডাটাবেজে সংরক্ষিত SKU' : 'Catalog SKUs in DB'}
          </div>
        </Card>

        <Card className="p-4 sm:p-5 border-slate-200/90 dark:border-zinc-800/80 dark:bg-[#121215]">
          <div className="flex items-center justify-between">
            <span className="text-xs sm:text-sm font-medium text-slate-500 dark:text-zinc-400">
              {lang === 'bn' ? 'পর্যাপ্ত স্টকে আছে' : 'In Stock'}
            </span>
            <CheckCircle2 className="w-4 h-4 text-emerald-500" />
          </div>
          <div className="text-2xl sm:text-3xl font-bold text-[#00a86b] dark:text-[#00df89] mt-2">
            {isLoading ? <Skeleton className="h-8 w-20 my-0.5" /> : inStockCount}
          </div>
          <div className="text-xs text-[#00a86b] dark:text-[#00df89] mt-1">
            {lang === 'bn' ? 'পর্যাপ্ত ইনভেন্টরি' : 'Healthy inventory'}
          </div>
        </Card>

        <Card className="p-4 sm:p-5 border-slate-200/90 dark:border-zinc-800/80 dark:bg-[#121215]">
          <div className="flex items-center justify-between">
            <span className="text-xs sm:text-sm font-medium text-slate-500 dark:text-zinc-400">
              {lang === 'bn' ? 'স্বল্প স্টক অ্যালার্ট' : 'Low Stock Alert'}
            </span>
            <AlertTriangle className="w-4 h-4 text-amber-500" />
          </div>
          <div className="text-2xl sm:text-3xl font-bold text-amber-500 mt-2">
            {isLoading ? <Skeleton className="h-8 w-16 my-0.5" /> : lowStockCount}
          </div>
          <div className="text-xs text-amber-500 mt-1">
            {lang === 'bn' ? 'পুনরায় স্টক করা প্রয়োজন' : 'Needs restock'}
          </div>
        </Card>

        <Card className="p-4 sm:p-5 border-slate-200/90 dark:border-zinc-800/80 dark:bg-[#121215]">
          <div className="flex items-center justify-between">
            <span className="text-xs sm:text-sm font-medium text-slate-500 dark:text-zinc-400">
              {lang === 'bn' ? 'মোট ইনভেন্টরি মূল্য' : 'Stock Valuation'}
            </span>
            <DollarSign className="w-4 h-4 text-slate-400" />
          </div>
          <div className="text-2xl sm:text-3xl font-bold text-slate-900 dark:text-white mt-2">
            {isLoading ? <Skeleton className="h-8 w-28 my-0.5" /> : `৳ ${totalStockValue.toLocaleString()}`}
          </div>
          <div className="text-xs text-slate-500 mt-1">
            {lang === 'bn' ? 'ক্রয়মূল্য অনুযায়ী' : 'At purchase cost'}
          </div>
        </Card>
      </div>

      {/* ---------------------------------------------------- */}
      {/* FILTER, CATEGORY SELECTION & SORTING BAR             */}
      {/* ---------------------------------------------------- */}
      <Card className="p-4 border-slate-200/90 dark:border-zinc-800/80 dark:bg-[#121215]">
        <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-3">
          
          {/* Search Input */}
          <div className="w-full lg:w-72 relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder={lang === 'bn' ? 'পণ্য, SKU বা ক্যাটাগরি খুঁজুন...' : 'Search products, SKU or category...'}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-2 rounded-xl bg-slate-50 dark:bg-[#09090b] border border-slate-200 dark:border-zinc-800 text-xs text-slate-900 dark:text-white placeholder:text-slate-400 outline-none focus:ring-2 focus:ring-[#00df89]"
            />
          </div>

          <div className="flex flex-wrap items-center gap-2">
            
            {/* Category Filter Dropdown */}
            <div className="w-44">
              <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                <SelectTrigger size="sm" className="bg-slate-50 dark:bg-[#09090b]">
                  <SelectValue placeholder="All Categories" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Categories</SelectItem>
                  {uniqueCategories.map((cat, idx) => (
                    <SelectItem key={idx} value={cat}>{cat}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Sort Order Dropdown */}
            <div className="w-44">
              <Select value={sortBy} onValueChange={setSortBy}>
                <SelectTrigger size="sm" className="bg-slate-50 dark:bg-[#09090b]">
                  <SelectValue placeholder="Sort By" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="category_asc">Category (A → Z)</SelectItem>
                  <SelectItem value="category_desc">Category (Z → A)</SelectItem>
                  <SelectItem value="name_asc">Product Name (A → Z)</SelectItem>
                  <SelectItem value="price_asc">Price: Low to High</SelectItem>
                  <SelectItem value="price_desc">Price: High to Low</SelectItem>
                  <SelectItem value="stock_asc">Stock: Low to High</SelectItem>
                  <SelectItem value="stock_desc">Stock: High to Low</SelectItem>
                  <SelectItem value="newest">Recently Added</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Stock Status Filter */}
            <div className="w-40">
              <Select value={stockStatusFilter} onValueChange={setStockStatusFilter}>
                <SelectTrigger size="sm" className="bg-slate-50 dark:bg-[#09090b]">
                  <SelectValue placeholder="Stock Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Stock Status</SelectItem>
                  <SelectItem value="in_stock">In Stock</SelectItem>
                  <SelectItem value="low_stock">Low Stock</SelectItem>
                  <SelectItem value="out_of_stock">Out of Stock</SelectItem>
                </SelectContent>
              </Select>
            </div>

          </div>
        </div>
      </Card>

      {/* ---------------------------------------------------- */}
      {/* PRODUCTS DATA TABLE                                  */}
      {/* ---------------------------------------------------- */}
      <Card className="p-0 border-slate-200/90 dark:border-zinc-800/80 dark:bg-[#121215] overflow-hidden">
        {isLoading ? (
          <div className="p-5 space-y-3">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <Skeleton key={i} className="h-12 w-full" />
            ))}
          </div>
        ) : filteredProducts.length === 0 ? (
          <div className="p-12 text-center space-y-3">
            <Package className="w-10 h-10 text-slate-300 dark:text-zinc-600 mx-auto" />
            <h3 className="text-sm font-semibold text-slate-800 dark:text-zinc-200">No Products Found</h3>
            <p className="text-xs text-slate-500 dark:text-zinc-400">
              {categoryFilter !== 'all' ? `No products found under '${categoryFilter}' category.` : 'Add products to your catalog to start recording sales.'}
            </p>
            {categoryFilter !== 'all' ? (
              <Button size="sm" variant="outline" onClick={() => setCategoryFilter('all')} className="text-xs">
                Clear Category Filter
              </Button>
            ) : (
              <Button size="sm" onClick={() => setIsAddModalOpen(true)} className="bg-[#00df89] hover:bg-[#00c97b] text-[#011812] text-xs font-semibold">
                <Plus className="w-3.5 h-3.5 mr-1" /> Add First Product
              </Button>
            )}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left">
              <thead className="bg-slate-50 dark:bg-zinc-900/60 text-slate-500 border-b border-slate-200 dark:border-zinc-800 select-none">
                <tr>
                  <th className="p-3.5">Product Name</th>
                  <th className="p-3.5">SKU</th>
                  
                  {/* Clickable Category Sort Header */}
                  <th
                    onClick={toggleCategorySort}
                    className="p-3.5 cursor-pointer hover:text-slate-900 dark:hover:text-white transition-colors"
                  >
                    <div className="flex items-center gap-1">
                      <span>Category</span>
                      {sortBy === 'category_asc' ? (
                        <ArrowUp className="w-3.5 h-3.5 text-[#00df89]" />
                      ) : sortBy === 'category_desc' ? (
                        <ArrowDown className="w-3.5 h-3.5 text-[#00df89]" />
                      ) : (
                        <ArrowUpDown className="w-3 h-3 text-slate-400 opacity-60" />
                      )}
                    </div>
                  </th>

                  <th className="p-3.5">Stock Level</th>
                  <th className="p-3.5">Cost Price</th>
                  <th className="p-3.5">Selling Price</th>
                  <th className="p-3.5">Status</th>
                  <th className="p-3.5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-zinc-800/80">
                {filteredProducts.map((p) => (
                  <tr key={p.id} className="hover:bg-slate-50 dark:hover:bg-zinc-900/40 transition-colors">
                    <td className="p-3.5 font-semibold text-slate-900 dark:text-white flex items-center gap-2.5">
                      {p.image_url ? (
                        <img
                          src={p.image_url}
                          alt={p.name}
                          className="w-8 h-8 rounded-lg object-cover border border-slate-200 dark:border-zinc-800 shrink-0 shadow-2xs"
                          onError={(e) => {
                            e.target.style.display = 'none';
                          }}
                        />
                      ) : (
                        <div className="w-8 h-8 rounded-lg bg-emerald-500/10 text-[#00a86b] dark:text-[#00df89] flex items-center justify-center font-medium text-xs shrink-0">
                          <Package className="w-4 h-4" />
                        </div>
                      )}
                      <span>{p.name}</span>
                    </td>
                    <td className="p-3.5 font-mono text-[11px] text-slate-500">{p.sku}</td>
                    <td className="p-3.5 text-slate-600 dark:text-zinc-300">
                      <Badge variant="secondary" className="text-[10px]">
                        {p.category}
                      </Badge>
                    </td>
                    <td className="p-3.5 font-semibold text-slate-800 dark:text-zinc-200">
                      {p.stock} {p.unit}
                    </td>
                    <td className="p-3.5 text-slate-600 dark:text-zinc-400">৳ {p.buyPrice.toLocaleString()}</td>
                    <td className="p-3.5 font-semibold text-[#00a86b] dark:text-[#00df89]">৳ {p.sellPrice.toLocaleString()}</td>
                    <td className="p-3.5">
                      <Badge
                        variant={p.status === 'in_stock' ? 'default' : p.status === 'low_stock' ? 'warning' : 'destructive'}
                        className="text-[10px] uppercase font-normal"
                      >
                        {p.status.replace('_', ' ')}
                      </Badge>
                    </td>
                    <td className="p-3.5 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleOpenEdit(p)}
                          className="h-7 text-xs px-2 text-slate-600 dark:text-zinc-300 hover:text-[#00df89]"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            setConfirmDeleteDialog({
                              isOpen: true,
                              productId: p.id,
                              productName: p.name,
                            });
                          }}
                          className="h-7 text-xs px-2 text-rose-500 hover:bg-rose-500/10"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </Button>
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
      {/* ADD PRODUCT MODAL                                    */}
      {/* ---------------------------------------------------- */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs overflow-y-auto">
          <Card className="max-w-lg w-full p-6 bg-white dark:bg-[#121215] border-slate-200 dark:border-zinc-800 space-y-4 shadow-2xl my-8">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-zinc-800 pb-3">
              <h2 className="text-base font-bold text-slate-900 dark:text-white">Add New Product to Inventory</h2>
              <button onClick={() => setIsAddModalOpen(false)} className="text-slate-400 p-1">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleAddProduct} className="space-y-3.5 text-xs">
              <div>
                <label className="block font-medium mb-1 text-slate-700 dark:text-zinc-300">Product Name *</label>
                <input
                  type="text"
                  required
                  placeholder={productPlaceholder}
                  value={newProduct.name}
                  onChange={(e) => setNewProduct({ ...newProduct, name: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-[#09090b] border border-slate-200 dark:border-zinc-800 outline-none focus:ring-2 focus:ring-[#00df89]"
                />
              </div>

              {/* Product Photo via ImgBB */}
              <ProductImageUploader
                value={newProduct.image_url}
                onChange={(url) => setNewProduct({ ...newProduct, image_url: url })}
                label="Product Photo (Hosted via ImgBB)"
              />

              {/* Category with Inline Creator */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block font-medium text-slate-700 dark:text-zinc-300">Category</label>
                  <button
                    type="button"
                    onClick={() => {
                      setShowAddCatInline(!showAddCatInline);
                      setNewCatName('');
                    }}
                    className="text-[11px] font-semibold text-[#00a86b] dark:text-[#00df89] hover:underline flex items-center gap-1 cursor-pointer"
                  >
                    <FolderPlus className="w-3 h-3" />
                    <span>{showAddCatInline ? 'Choose existing' : '+ Add New Category'}</span>
                  </button>
                </div>

                {showAddCatInline ? (
                  <div className="flex items-center gap-2 p-2 rounded-xl bg-emerald-500/5 border border-emerald-500/20">
                    <input
                      type="text"
                      placeholder={categoryPlaceholder}
                      value={newCatName}
                      onChange={(e) => setNewCatName(e.target.value)}
                      className="flex-1 px-3 py-1.5 rounded-lg bg-white dark:bg-[#09090b] border border-slate-200 dark:border-zinc-800 outline-none text-xs focus:ring-1 focus:ring-[#00df89]"
                    />
                    <Button
                      type="button"
                      size="sm"
                      disabled={isCreatingCat || !newCatName.trim()}
                      onClick={() => handleCreateCategory(false)}
                      className="bg-[#00df89] hover:bg-[#00c97b] text-[#011812] font-semibold text-xs h-8 px-3"
                    >
                      {isCreatingCat ? <Loader2 className="w-3 h-3 animate-spin" /> : 'Save & Select'}
                    </Button>
                  </div>
                ) : (
                  <Select
                    value={newProduct.category_id || '__general__'}
                    onValueChange={(val) => setNewProduct({ ...newProduct, category_id: val })}
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

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-medium mb-1 text-slate-700 dark:text-zinc-300">SKU (Optional)</label>
                  <input
                    type="text"
                    placeholder="Auto-generated if empty"
                    value={newProduct.sku}
                    onChange={(e) => setNewProduct({ ...newProduct, sku: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-[#09090b] border border-slate-200 dark:border-zinc-800 outline-none"
                  />
                </div>
                <div>
                  <label className="block font-medium mb-1 text-slate-700 dark:text-zinc-300">Barcode (Optional)</label>
                  <input
                    type="text"
                    placeholder="Scan or enter barcode"
                    value={newProduct.barcode}
                    onChange={(e) => setNewProduct({ ...newProduct, barcode: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-[#09090b] border border-slate-200 dark:border-zinc-800 outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-medium mb-1 text-slate-700 dark:text-zinc-300">Cost Price (৳)</label>
                  <input
                    type="number"
                    value={newProduct.buyPrice}
                    onChange={(e) => setNewProduct({ ...newProduct, buyPrice: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-[#09090b] border border-slate-200 dark:border-zinc-800 outline-none"
                  />
                </div>
                <div>
                  <label className="block font-medium mb-1 text-slate-700 dark:text-zinc-300">Selling Price (৳) *</label>
                  <input
                    type="number"
                    required
                    value={newProduct.sellPrice}
                    onChange={(e) => setNewProduct({ ...newProduct, sellPrice: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-[#09090b] border border-slate-200 dark:border-zinc-800 outline-none focus:ring-2 focus:ring-[#00df89]"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block font-medium mb-1 text-slate-700 dark:text-zinc-300">Stock Qty</label>
                  <input
                    type="number"
                    value={newProduct.stock}
                    onChange={(e) => setNewProduct({ ...newProduct, stock: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-[#09090b] border border-slate-200 dark:border-zinc-800 outline-none"
                  />
                </div>
                <div>
                  <label className="block font-medium mb-1 text-slate-700 dark:text-zinc-300">Low Stock Min</label>
                  <input
                    type="number"
                    value={newProduct.lowStockThreshold}
                    onChange={(e) => setNewProduct({ ...newProduct, lowStockThreshold: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-[#09090b] border border-slate-200 dark:border-zinc-800 outline-none"
                  />
                </div>
                <div>
                  <label className="block font-medium mb-1 text-slate-700 dark:text-zinc-300">Unit</label>
                  <input
                    type="text"
                    value={newProduct.unit}
                    onChange={(e) => setNewProduct({ ...newProduct, unit: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-[#09090b] border border-slate-200 dark:border-zinc-800 outline-none"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-slate-100 dark:border-zinc-800">
                <Button type="button" variant="outline" size="sm" onClick={() => setIsAddModalOpen(false)}>
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={isSubmitting}
                  size="sm"
                  className="bg-[#00df89] hover:bg-[#00c97b] text-[#011812] font-semibold"
                >
                  {isSubmitting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : 'Save Product'}
                </Button>
              </div>
            </form>
          </Card>
        </div>
      )}

      {/* ---------------------------------------------------- */}
      {/* EDIT PRODUCT MODAL                                   */}
      {/* ---------------------------------------------------- */}
      {isEditModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs">
          <Card className="max-w-lg w-full p-6 bg-white dark:bg-[#121215] border-slate-200 dark:border-zinc-800 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-zinc-800 pb-3">
              <h2 className="text-base font-bold text-slate-900 dark:text-white">Edit Product Details</h2>
              <button onClick={() => setIsEditModalOpen(false)} className="text-slate-400 p-1">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleUpdateProduct} className="space-y-3.5 text-xs">
              <div>
                <label className="block font-medium mb-1 text-slate-700 dark:text-zinc-300">Product Name *</label>
                <input
                  type="text"
                  required
                  value={editForm.name}
                  onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-[#09090b] border border-slate-200 dark:border-zinc-800 outline-none focus:ring-2 focus:ring-[#00df89]"
                />
              </div>

              {/* Product Photo via ImgBB */}
              <ProductImageUploader
                value={editForm.image_url}
                onChange={(url) => setEditForm({ ...editForm, image_url: url })}
                label="Product Photo (Hosted via ImgBB)"
              />

              {/* Category with Inline Creator in Edit Modal */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block font-medium text-slate-700 dark:text-zinc-300">Category</label>
                  <button
                    type="button"
                    onClick={() => {
                      setShowEditCatInline(!showEditCatInline);
                      setNewCatName('');
                    }}
                    className="text-[11px] font-semibold text-[#00a86b] dark:text-[#00df89] hover:underline flex items-center gap-1 cursor-pointer"
                  >
                    <FolderPlus className="w-3 h-3" />
                    <span>{showEditCatInline ? 'Choose existing' : '+ Add New Category'}</span>
                  </button>
                </div>

                {showEditCatInline ? (
                  <div className="flex items-center gap-2 p-2 rounded-xl bg-emerald-500/5 border border-emerald-500/20">
                    <input
                      type="text"
                      placeholder={categoryPlaceholder}
                      value={newCatName}
                      onChange={(e) => setNewCatName(e.target.value)}
                      className="flex-1 px-3 py-1.5 rounded-lg bg-white dark:bg-[#09090b] border border-slate-200 dark:border-zinc-800 outline-none text-xs focus:ring-1 focus:ring-[#00df89]"
                    />
                    <Button
                      type="button"
                      size="sm"
                      disabled={isCreatingCat || !newCatName.trim()}
                      onClick={() => handleCreateCategory(true)}
                      className="bg-[#00df89] hover:bg-[#00c97b] text-[#011812] font-semibold text-xs h-8 px-3"
                    >
                      {isCreatingCat ? <Loader2 className="w-3 h-3 animate-spin" /> : 'Save & Select'}
                    </Button>
                  </div>
                ) : (
                  <Select
                    value={editForm.category_id || '__general__'}
                    onValueChange={(val) => setEditForm({ ...editForm, category_id: val })}
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

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-medium mb-1 text-slate-700 dark:text-zinc-300">SKU Code</label>
                  <input
                    type="text"
                    value={editForm.sku}
                    onChange={(e) => setEditForm({ ...editForm, sku: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-[#09090b] border border-slate-200 dark:border-zinc-800 outline-none"
                  />
                </div>
                <div>
                  <label className="block font-medium mb-1 text-slate-700 dark:text-zinc-300">Barcode</label>
                  <input
                    type="text"
                    value={editForm.barcode}
                    onChange={(e) => setEditForm({ ...editForm, barcode: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-[#09090b] border border-slate-200 dark:border-zinc-800 outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-medium mb-1 text-slate-700 dark:text-zinc-300">Cost Price (৳)</label>
                  <input
                    type="number"
                    value={editForm.buyPrice}
                    onChange={(e) => setEditForm({ ...editForm, buyPrice: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-[#09090b] border border-slate-200 dark:border-zinc-800 outline-none"
                  />
                </div>
                <div>
                  <label className="block font-medium mb-1 text-slate-700 dark:text-zinc-300">Selling Price (৳) *</label>
                  <input
                    type="number"
                    required
                    value={editForm.sellPrice}
                    onChange={(e) => setEditForm({ ...editForm, sellPrice: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-[#09090b] border border-slate-200 dark:border-zinc-800 outline-none focus:ring-2 focus:ring-[#00df89]"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block font-medium mb-1 text-slate-700 dark:text-zinc-300">Stock Quantity</label>
                  <input
                    type="number"
                    value={editForm.stock}
                    onChange={(e) => setEditForm({ ...editForm, stock: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-[#09090b] border border-slate-200 dark:border-zinc-800 outline-none"
                  />
                </div>
                <div>
                  <label className="block font-medium mb-1 text-slate-700 dark:text-zinc-300">Low Stock Min</label>
                  <input
                    type="number"
                    value={editForm.lowStockThreshold}
                    onChange={(e) => setEditForm({ ...editForm, lowStockThreshold: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-[#09090b] border border-slate-200 dark:border-zinc-800 outline-none"
                  />
                </div>
                <div>
                  <label className="block font-medium mb-1 text-slate-700 dark:text-zinc-300">Unit</label>
                  <input
                    type="text"
                    value={editForm.unit}
                    onChange={(e) => setEditForm({ ...editForm, unit: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-[#09090b] border border-slate-200 dark:border-zinc-800 outline-none"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-slate-100 dark:border-zinc-800">
                <Button type="button" variant="outline" size="sm" onClick={() => setIsEditModalOpen(false)}>
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={isSubmitting}
                  size="sm"
                  className="bg-[#00df89] hover:bg-[#00c97b] text-[#011812] font-semibold"
                >
                  {isSubmitting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : 'Update Product'}
                </Button>
              </div>
            </form>
          </Card>
        </div>
      )}

      {/* ---------------------------------------------------- */}
      {/* CONFIRM DELETE MODAL                                 */}
      {/* ---------------------------------------------------- */}
      <ConfirmDialog
        isOpen={confirmDeleteDialog.isOpen}
        isLoading={isDeleting}
        title={lang === 'bn' ? `'${confirmDeleteDialog.productName}' মুছে ফেলতে চান?` : `Delete '${confirmDeleteDialog.productName}'?`}
        description={lang === 'bn' ? 'এই পণ্যটি ক্যাটালগ থেকে মুছে ফেলা হবে। এই কাজটি পুনরায় ফিরিয়ে আনা যাবে না।' : 'This product will be permanently removed from your catalog. This action cannot be undone.'}
        confirmText={lang === 'bn' ? 'হ্যাঁ, মুছে ফেলুন' : 'Yes, Delete'}
        cancelText={lang === 'bn' ? 'বাতিল' : 'Cancel'}
        onConfirm={handleConfirmDeleteProduct}
        onCancel={() => setConfirmDeleteDialog({ isOpen: false, productId: null, productName: '' })}
      />

    </div>
  );
}
