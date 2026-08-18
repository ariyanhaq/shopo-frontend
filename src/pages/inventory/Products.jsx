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
  Sparkles, FolderPlus, ArrowUpDown, ArrowUp, ArrowDown, ImageIcon,
  Building2, ShoppingBag, Boxes, HelpCircle
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

  // Modals
  const [isActionChoiceModalOpen, setIsActionChoiceModalOpen] = useState(false);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isRestockModalOpen, setIsRestockModalOpen] = useState(false);
  const [isQuickEditPickerOpen, setIsQuickEditPickerOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (location.state?.openAddModal || new URLSearchParams(location.search).get('action') === 'add') {
      setIsActionChoiceModalOpen(true);
    }
  }, [location]);

  const [productList, setProductList] = useState([]);
  const [categories, setCategories] = useState([]);
  const [suppliers, setSuppliers] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  // Inline Category Creator State
  const [showAddCatInline, setShowAddCatInline] = useState(false);
  const [showEditCatInline, setShowEditCatInline] = useState(false);
  const [newCatName, setNewCatName] = useState('');
  const [isCreatingCat, setIsCreatingCat] = useState(false);

  // Inline Supplier Creator State
  const [showAddSuppInline, setShowAddSuppInline] = useState(false);
  const [newSuppData, setNewSuppData] = useState({ name: '', phone: '', company_name: '', address: '' });
  const [isCreatingSupp, setIsCreatingSupp] = useState(false);

  // New Product Form State
  const [newProduct, setNewProduct] = useState({
    name: '',
    image_url: '',
    category_id: '__general__',
    supplier_id: '',
    sku: '',
    barcode: '',
    stock: '',
    buyPrice: '',
    sellPrice: '',
    unit: 'Pcs',
    lowStockThreshold: 5,
  });

  // Restock / Add Stock to Existing Product Form State
  const [restockForm, setRestockForm] = useState({
    product_id: '',
    supplier_id: '',
    quantity: 1,
    unit_cost: 0,
    selling_price: 0,
    paid_amount: '',
    payment_method: 'cash',
    notes: '',
  });

  // Edit Product Form State
  const [editForm, setEditForm] = useState({
    id: '',
    name: '',
    image_url: '',
    category_id: '',
    supplier_id: '',
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
      const [prodRes, catRes, suppRes] = await Promise.all([
        api.products.list(),
        api.categories.list().catch(() => ({ data: [] })),
        api.suppliers.list().catch(() => ({ data: [] })),
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

      const fetchedSuppliers = Array.isArray(suppRes?.data) ? suppRes.data : [];
      if (suppRes?.data) {
        setSuppliers(fetchedSuppliers);
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
          supplier_id: p.supplier_id?._id || p.supplier_id || '',
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

  // Handle Inline Supplier Creation
  const handleCreateSupplier = async (forRestock = false) => {
    if (!newSuppData.name.trim()) return;
    setIsCreatingSupp(true);
    try {
      const res = await api.suppliers.create(newSuppData);
      if (res?.data) {
        setSuppliers((prev) => [res.data, ...prev]);
        if (forRestock) {
          setRestockForm((prev) => ({ ...prev, supplier_id: res.data._id }));
        } else {
          setNewProduct((prev) => ({ ...prev, supplier_id: res.data._id }));
        }
        setShowAddSuppInline(false);
        setNewSuppData({ name: '', phone: '', company_name: '', address: '' });
        toast.success(lang === 'bn' ? `সাপ্লায়ার '${res.data.name}' যুক্ত হয়েছে!` : `Supplier '${res.data.name}' created!`);
      }
    } catch (err) {
      toast.error(err.message || 'Failed to create supplier.');
    } finally {
      setIsCreatingSupp(false);
    }
  };

  // Handle Inline Category Deletion
  const handleDeleteCategory = async (catId, catName) => {
    try {
      await api.categories.delete(catId);
      setCategories((prev) => prev.filter((c) => c._id !== catId));
      if (newProduct.category_id === catId) {
        setNewProduct((prev) => ({ ...prev, category_id: '__general__' }));
      }
      if (editForm.category_id === catId) {
        setEditForm((prev) => ({ ...prev, category_id: '__general__' }));
      }
      toast.success(lang === 'bn' ? `ক্যাটাগরি '${catName}' মুছে ফেলা হয়েছে!` : `Category '${catName}' deleted!`);
    } catch (err) {
      toast.error(err.message || 'Failed to delete category.');
    }
  };

  // Handle Inline Supplier Deletion
  const handleDeleteSupplier = async (suppId, suppName) => {
    try {
      await api.suppliers.delete(suppId);
      setSuppliers((prev) => prev.filter((s) => s._id !== suppId));
      if (newProduct.supplier_id === suppId) {
        setNewProduct((prev) => ({ ...prev, supplier_id: '' }));
      }
      if (restockForm.supplier_id === suppId) {
        setRestockForm((prev) => ({ ...prev, supplier_id: '' }));
      }
      toast.success(lang === 'bn' ? `সাপ্লায়ার '${suppName}' মুছে ফেলা হয়েছে!` : `Supplier '${suppName}' deleted!`);
    } catch (err) {
      toast.error(err.message || 'Failed to delete supplier.');
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

      const initialStock = parseInt(newProduct.stock, 10) || 0;
      const costPrice = parseFloat(newProduct.buyPrice) || 0;
      const sellPrice = parseFloat(newProduct.sellPrice) || 0;

      const createdRes = await api.products.create({
        name: newProduct.name.trim(),
        image_url: newProduct.image_url || undefined,
        images: newProduct.image_url ? [newProduct.image_url] : [],
        category_id: finalCatId,
        supplier_id: newProduct.supplier_id || undefined,
        sku: newProduct.sku ? newProduct.sku.trim() : undefined,
        barcode: newProduct.barcode ? newProduct.barcode.trim() : undefined,
        cost_price: costPrice,
        selling_price: sellPrice,
        stock_quantity: initialStock,
        unit: newProduct.unit || 'Pcs',
        low_stock_threshold: parseInt(newProduct.lowStockThreshold, 10) || 5,
      });

      // If initial stock > 0, also log a purchase transaction in the Purchase ledger
      if (initialStock > 0 && createdRes?.data?._id) {
        try {
          await api.purchases.create({
            supplier_id: newProduct.supplier_id || null,
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
          console.warn('Initial stock purchase logging notice:', pErr);
        }
      }

      setIsAddModalOpen(false);
      setNewProduct({
        name: '',
        image_url: '',
        category_id: '__general__',
        supplier_id: '',
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

  // Handle Restock / Purchase Submit for Existing Product
  const handleRestockSubmit = async (e) => {
    e.preventDefault();
    if (!restockForm.product_id) {
      toast.error(lang === 'bn' ? 'অনুগ্রহ করে পণ্য নির্বাচন করুন।' : 'Please select a product.');
      return;
    }
    const qty = Number(restockForm.quantity) || 0;
    if (qty <= 0) {
      toast.error(lang === 'bn' ? 'পরিমাণ কমপক্ষে ১ হতে হবে।' : 'Quantity must be at least 1.');
      return;
    }

    setIsSubmitting(true);
    try {
      const selectedProd = productList.find((p) => p.id === restockForm.product_id);
      const unitCost = Number(restockForm.unit_cost) || 0;
      const totalCost = qty * unitCost;
      const paid = restockForm.paid_amount !== '' ? Number(restockForm.paid_amount) : totalCost;

      await api.purchases.create({
        supplier_id: restockForm.supplier_id || null,
        items: [
          {
            product_id: restockForm.product_id,
            product_name: selectedProd?.name || 'Product',
            quantity: qty,
            unit_cost: unitCost,
            selling_price: Number(restockForm.selling_price) || selectedProd?.sellPrice || 0,
            total_cost: totalCost,
          },
        ],
        paid_amount: paid,
        payment_method: restockForm.payment_method || 'cash',
        notes: restockForm.notes || '',
      });

      toast.success(lang === 'bn' ? 'পণ্য সফলভাবে রিস্টক ও ক্রয় রেকর্ড সম্পন্ন!' : 'Stock added & purchase recorded successfully!');
      setIsRestockModalOpen(false);
      setRestockForm({
        product_id: '',
        supplier_id: '',
        quantity: 1,
        unit_cost: 0,
        selling_price: 0,
        paid_amount: '',
        payment_method: 'cash',
        notes: '',
      });
      fetchDbProducts();
    } catch (err) {
      toast.error(err.message || 'Failed to record stock purchase.');
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
            onClick={() => setIsActionChoiceModalOpen(true)}
            className="bg-[#00df89] hover:bg-[#00c97b] text-[#011812] font-semibold text-xs sm:text-sm h-10 px-4 gap-2 shadow-xs cursor-pointer"
          >
            <Plus className="w-4 h-4 stroke-[2.5]" />
            <span>{lang === 'bn' ? 'নতুন পণ্য বা স্টক যোগ' : 'Add Product / Stock'}</span>
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
              <Button size="sm" onClick={() => setIsActionChoiceModalOpen(true)} className="bg-[#00df89] hover:bg-[#00c97b] text-[#011812] text-xs font-semibold cursor-pointer">
                <Plus className="w-3.5 h-3.5 mr-1" /> {lang === 'bn' ? 'প্রথম পণ্য যোগ করুন' : 'Add First Product'}
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
      {/* 1. ACTION CHOICE SELECTOR MODAL                      */}
      {/* ---------------------------------------------------- */}
      {isActionChoiceModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs animate-in fade-in duration-150">
          <Card className="max-w-md w-full p-6 bg-white dark:bg-[#121215] border-slate-200 dark:border-zinc-800 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-zinc-800 pb-3">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-emerald-500/10 text-[#00df89] flex items-center justify-center">
                  <Package className="w-4 h-4" />
                </div>
                <div>
                  <h2 className="text-base font-bold text-slate-900 dark:text-white">
                    {lang === 'bn' ? 'পণ্য অ্যাকশন বেছে নিন' : 'Choose Product Action'}
                  </h2>
                  <p className="text-[11px] text-slate-400 font-medium">
                    {lang === 'bn' ? 'আপনি কি নতুন পণ্য তৈরি, স্টক যোগ বা বিদ্যমান পণ্য আপডেট করতে চান?' : 'What action would you like to take on inventory?'}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsActionChoiceModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 p-1 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3 pt-1">
              {/* Option 1: Add New Product */}
              <button
                type="button"
                onClick={() => {
                  setIsActionChoiceModalOpen(false);
                  setIsAddModalOpen(true);
                }}
                className="w-full p-3.5 rounded-2xl bg-slate-50 dark:bg-zinc-900/60 border border-slate-200/80 dark:border-zinc-800/80 hover:border-[#00df89] dark:hover:border-[#00df89] hover:bg-emerald-50/30 dark:hover:bg-emerald-950/20 transition-all text-left flex items-start gap-3.5 cursor-pointer group"
              >
                <div className="w-10 h-10 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-[#00df89] flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
                  <Sparkles className="w-5 h-5" />
                </div>
                <div className="flex-1">
                  <div className="flex items-center justify-between">
                    <h3 className="font-bold text-sm text-slate-900 dark:text-white group-hover:text-emerald-600 dark:group-hover:text-[#00df89] transition-colors">
                      {lang === 'bn' ? '১. সম্পূর্ণ নতুন পণ্য তৈরি করুন' : '1. Add Brand New Product'}
                    </h3>
                    <ChevronRight className="w-4 h-4 text-slate-400 group-hover:translate-x-0.5 transition-transform" />
                  </div>
                  <p className="text-xs text-slate-500 dark:text-zinc-400 mt-0.5">
                    {lang === 'bn'
                      ? 'নতুন নাম, বারকোড, ক্যাটাগরি, সাপ্লায়ার ও প্রাথমিক স্টক দিয়ে ক্যাটালগে পণ্য যোগ করুন।'
                      : 'Create a new product item with pricing, barcode, category, supplier, and initial stock.'}
                  </p>
                </div>
              </button>

              {/* Option 2: Add Stock / Restock Existing Product */}
              <button
                type="button"
                onClick={() => {
                  setIsActionChoiceModalOpen(false);
                  setIsRestockModalOpen(true);
                }}
                className="w-full p-3.5 rounded-2xl bg-slate-50 dark:bg-zinc-900/60 border border-slate-200/80 dark:border-zinc-800/80 hover:border-[#00df89] dark:hover:border-[#00df89] hover:bg-emerald-50/30 dark:hover:bg-emerald-950/20 transition-all text-left flex items-start gap-3.5 cursor-pointer group"
              >
                <div className="w-10 h-10 rounded-xl bg-blue-500/10 text-blue-600 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
                  <ShoppingBag className="w-5 h-5" />
                </div>
                <div className="flex-1">
                  <div className="flex items-center justify-between">
                    <h3 className="font-bold text-sm text-slate-900 dark:text-white group-hover:text-blue-600 transition-colors">
                      {lang === 'bn' ? '২. বিদ্যমান পণ্যে স্টক যোগ / ক্রয় করুন' : '2. Add Stock / Restock Existing'}
                    </h3>
                    <ChevronRight className="w-4 h-4 text-slate-400 group-hover:translate-x-0.5 transition-transform" />
                  </div>
                  <p className="text-xs text-slate-500 dark:text-zinc-400 mt-0.5">
                    {lang === 'bn'
                      ? 'সাপ্লায়ার থেকে বিদ্যমান পণ্যের নতুন স্টক ক্রয় রেকর্ড করুন (স্বয়ংক্রিয়ভাবে স্টক ও ক্রয় খতিয়ান আপডেট হবে)।'
                      : 'Receive new batch from supplier, increase stock count, and log purchase in DB ledger.'}
                  </p>
                </div>
              </button>

              {/* Option 3: Update Existing Product */}
              <button
                type="button"
                onClick={() => {
                  setIsActionChoiceModalOpen(false);
                  setIsQuickEditPickerOpen(true);
                }}
                className="w-full p-3.5 rounded-2xl bg-slate-50 dark:bg-zinc-900/60 border border-slate-200/80 dark:border-zinc-800/80 hover:border-[#00df89] dark:hover:border-[#00df89] hover:bg-emerald-50/30 dark:hover:bg-emerald-950/20 transition-all text-left flex items-start gap-3.5 cursor-pointer group"
              >
                <div className="w-10 h-10 rounded-xl bg-amber-500/15 text-amber-500 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
                  <Edit2 className="w-5 h-5" />
                </div>
                <div className="flex-1">
                  <div className="flex items-center justify-between">
                    <h3 className="font-bold text-sm text-slate-900 dark:text-white group-hover:text-amber-500 transition-colors">
                      {lang === 'bn' ? '৩. বিদ্যমান পণ্যের বিবরণ আপডেট করুন' : '3. Quick Update Existing Product'}
                    </h3>
                    <ChevronRight className="w-4 h-4 text-slate-400 group-hover:translate-x-0.5 transition-transform" />
                  </div>
                  <p className="text-xs text-slate-500 dark:text-zinc-400 mt-0.5">
                    {lang === 'bn'
                      ? 'যেকোনো পণ্যের নাম, বিক্রয়মূল্য, ক্যাটাগরি, বারকোড বা সতর্কতা লেভেল সংশোধন করুন।'
                      : 'Search and modify details, selling prices, barcode, or category of an existing item.'}
                  </p>
                </div>
              </button>
            </div>
          </Card>
        </div>
      )}

      {/* ---------------------------------------------------- */}
      {/* 2. ADD BRAND NEW PRODUCT MODAL                       */}
      {/* ---------------------------------------------------- */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs overflow-y-auto">
          <Card className="max-w-lg w-full p-6 bg-white dark:bg-[#121215] border-slate-200 dark:border-zinc-800 space-y-4 shadow-2xl my-8">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-zinc-800 pb-3">
              <h2 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-[#00df89]" />
                <span>{lang === 'bn' ? 'নতুন পণ্য যুক্ত করুন' : 'Add New Product to Inventory'}</span>
              </h2>
              <button onClick={() => setIsAddModalOpen(false)} className="text-slate-400 p-1 cursor-pointer">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleAddProduct} className="space-y-3.5 text-xs">
              <div>
                <label className="block font-medium mb-1 text-slate-700 dark:text-zinc-300">
                  {lang === 'bn' ? 'পণ্যের নাম *' : 'Product Name *'}
                </label>
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
                label={lang === 'bn' ? 'পণ্যের ছবি (ImgBB হোস্টিং)' : 'Product Photo (Hosted via ImgBB)'}
              />

              {/* Category with Inline Creator */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block font-medium text-slate-700 dark:text-zinc-300">
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
                    <FolderPlus className="w-3 h-3" />
                    <span>{showAddCatInline ? (lang === 'bn' ? 'তালিকা থেকে বেছে নিন' : 'Choose existing') : (lang === 'bn' ? '+ নতুন ক্যাটাগরি' : '+ Add New Category')}</span>
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
                      className="bg-[#00df89] hover:bg-[#00c97b] text-[#011812] font-semibold text-xs h-8 px-3 cursor-pointer"
                    >
                      {isCreatingCat ? <Loader2 className="w-3 h-3 animate-spin" /> : (lang === 'bn' ? 'সেভ' : 'Save')}
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

              {/* Supplier with Inline Creator */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block font-medium text-slate-700 dark:text-zinc-300">
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
                    <Building2 className="w-3 h-3" />
                    <span>{showAddSuppInline ? (lang === 'bn' ? 'তালিকা থেকে বেছে নিন' : 'Choose existing') : (lang === 'bn' ? '+ নতুন সাপ্লায়ার' : '+ Add New Supplier')}</span>
                  </button>
                </div>

                {showAddSuppInline ? (
                  <div className="p-2.5 rounded-xl bg-emerald-500/5 border border-emerald-500/20 space-y-2">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      <input
                        type="text"
                        placeholder={lang === 'bn' ? 'সাপ্লায়ার নাম *' : 'Supplier Name *'}
                        value={newSuppData.name}
                        onChange={(e) => setNewSuppData({ ...newSuppData, name: e.target.value })}
                        className="px-3 py-1.5 rounded-lg bg-white dark:bg-[#09090b] border border-slate-200 dark:border-zinc-800 outline-none text-xs"
                      />
                      <input
                        type="text"
                        placeholder={lang === 'bn' ? 'ফোন নম্বর' : 'Phone'}
                        value={newSuppData.phone}
                        onChange={(e) => setNewSuppData({ ...newSuppData, phone: e.target.value })}
                        className="px-3 py-1.5 rounded-lg bg-white dark:bg-[#09090b] border border-slate-200 dark:border-zinc-800 outline-none text-xs"
                      />
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      <input
                        type="text"
                        placeholder={lang === 'bn' ? 'প্রতিষ্ঠান / কোম্পানি' : 'Company'}
                        value={newSuppData.company_name}
                        onChange={(e) => setNewSuppData({ ...newSuppData, company_name: e.target.value })}
                        className="px-3 py-1.5 rounded-lg bg-white dark:bg-[#09090b] border border-slate-200 dark:border-zinc-800 outline-none text-xs"
                      />
                      <input
                        type="text"
                        placeholder={lang === 'bn' ? 'ঠিকানা' : 'Address'}
                        value={newSuppData.address}
                        onChange={(e) => setNewSuppData({ ...newSuppData, address: e.target.value })}
                        className="px-3 py-1.5 rounded-lg bg-white dark:bg-[#09090b] border border-slate-200 dark:border-zinc-800 outline-none text-xs"
                      />
                    </div>
                    <div className="flex justify-end">
                      <Button
                        type="button"
                        size="sm"
                        disabled={isCreatingSupp || !newSuppData.name.trim()}
                        onClick={() => handleCreateSupplier(false)}
                        className="bg-[#00df89] hover:bg-[#00c97b] text-[#011812] font-semibold text-xs h-8 px-3 cursor-pointer"
                      >
                        {isCreatingSupp ? <Loader2 className="w-3 h-3 animate-spin" /> : (lang === 'bn' ? 'সেভ ও নির্বাচন' : 'Save & Select')}
                      </Button>
                    </div>
                  </div>
                ) : (
                  <Select
                    value={newProduct.supplier_id || '__none__'}
                    onValueChange={(val) => setNewProduct({ ...newProduct, supplier_id: val === '__none__' ? '' : val })}
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

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-medium mb-1 text-slate-700 dark:text-zinc-300">
                    {lang === 'bn' ? 'SKU কোড (ঐচ্ছিক)' : 'SKU (Optional)'}
                  </label>
                  <input
                    type="text"
                    placeholder="Auto-generated if empty"
                    value={newProduct.sku}
                    onChange={(e) => setNewProduct({ ...newProduct, sku: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-[#09090b] border border-slate-200 dark:border-zinc-800 outline-none"
                  />
                </div>
                <div>
                  <label className="block font-medium mb-1 text-slate-700 dark:text-zinc-300">
                    {lang === 'bn' ? 'বারকোড (ঐচ্ছিক)' : 'Barcode (Optional)'}
                  </label>
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
                  <label className="block font-medium mb-1 text-slate-700 dark:text-zinc-300">
                    {lang === 'bn' ? 'ক্রয়মূল্য (৳)' : 'Cost Price (৳)'}
                  </label>
                  <input
                    type="number"
                    value={newProduct.buyPrice}
                    onChange={(e) => setNewProduct({ ...newProduct, buyPrice: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-[#09090b] border border-slate-200 dark:border-zinc-800 outline-none"
                  />
                </div>
                <div>
                  <label className="block font-medium mb-1 text-slate-700 dark:text-zinc-300">
                    {lang === 'bn' ? 'বিক্রয়মূল্য (৳) *' : 'Selling Price (৳) *'}
                  </label>
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
                  <label className="block font-medium mb-1 text-slate-700 dark:text-zinc-300">
                    {lang === 'bn' ? 'প্রাথমিক স্টক' : 'Initial Stock'}
                  </label>
                  <input
                    type="number"
                    value={newProduct.stock}
                    onChange={(e) => setNewProduct({ ...newProduct, stock: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-[#09090b] border border-slate-200 dark:border-zinc-800 outline-none"
                  />
                </div>
                <div>
                  <label className="block font-medium mb-1 text-slate-700 dark:text-zinc-300">
                    {lang === 'bn' ? 'সতর্কতা লেভেল' : 'Low Stock Min'}
                  </label>
                  <input
                    type="number"
                    value={newProduct.lowStockThreshold}
                    onChange={(e) => setNewProduct({ ...newProduct, lowStockThreshold: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-[#09090b] border border-slate-200 dark:border-zinc-800 outline-none"
                  />
                </div>
                <div>
                  <label className="block font-medium mb-1 text-slate-700 dark:text-zinc-300">
                    {lang === 'bn' ? 'একক (Unit)' : 'Unit'}
                  </label>
                  <input
                    type="text"
                    value={newProduct.unit}
                    onChange={(e) => setNewProduct({ ...newProduct, unit: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-[#09090b] border border-slate-200 dark:border-zinc-800 outline-none"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-slate-100 dark:border-zinc-800">
                <Button type="button" variant="outline" size="sm" onClick={() => setIsAddModalOpen(false)} className="cursor-pointer">
                  {lang === 'bn' ? 'বাতিল' : 'Cancel'}
                </Button>
                <Button
                  type="submit"
                  disabled={isSubmitting}
                  size="sm"
                  className="bg-[#00df89] hover:bg-[#00c97b] text-[#011812] font-semibold cursor-pointer"
                >
                  {isSubmitting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : (lang === 'bn' ? 'পণ্য সংরক্ষণ করুন' : 'Save Product')}
                </Button>
              </div>
            </form>
          </Card>
        </div>
      )}

      {/* ---------------------------------------------------- */}
      {/* 3. RESTOCK / PURCHASE STOCK FOR EXISTING PRODUCT     */}
      {/* ---------------------------------------------------- */}
      {isRestockModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs overflow-y-auto">
          <Card className="max-w-lg w-full p-6 bg-white dark:bg-[#121215] border-slate-200 dark:border-zinc-800 space-y-4 shadow-2xl my-8">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-zinc-800 pb-3">
              <h2 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <ShoppingBag className="w-4 h-4 text-blue-500" />
                <span>{lang === 'bn' ? 'বিদ্যমান পণ্যে স্টক যোগ ও ক্রয়' : 'Restock / Purchase Stock'}</span>
              </h2>
              <button onClick={() => setIsRestockModalOpen(false)} className="text-slate-400 p-1 cursor-pointer">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleRestockSubmit} className="space-y-3.5 text-xs">
              {/* Product Selector */}
              <div>
                <label className="block font-bold text-slate-700 dark:text-zinc-300 mb-1">
                  {lang === 'bn' ? 'পণ্য নির্বাচন করুন *' : 'Select Product *'}
                </label>
                <Select
                  value={restockForm.product_id || '__none__'}
                  onValueChange={(val) => {
                    const found = productList.find(p => p.id === val);
                    setRestockForm({
                      ...restockForm,
                      product_id: val === '__none__' ? '' : val,
                      unit_cost: found ? found.buyPrice : 0,
                      selling_price: found ? found.sellPrice : 0,
                      supplier_id: found?.supplier_id || restockForm.supplier_id || '',
                    });
                  }}
                >
                  <SelectTrigger className="w-full bg-slate-50 dark:bg-[#09090b]">
                    <SelectValue placeholder={lang === 'bn' ? 'পণ্য বেছে নিন...' : 'Choose product...'} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="__none__">{lang === 'bn' ? 'পণ্য বেছে নিন...' : 'Choose product...'}</SelectItem>
                    {productList.map((p) => (
                      <SelectItem key={p.id} value={p.id}>
                        {p.name} (Stock: {p.stock} {p.unit}) — ৳{p.sellPrice}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Supplier with Inline Creator */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block font-bold text-slate-700 dark:text-zinc-300">
                    {lang === 'bn' ? 'সাপ্লায়ার (সরবরাহকারী)' : 'Supplier'}
                  </label>
                  <button
                    type="button"
                    onClick={() => {
                      setShowAddSuppInline(!showAddSuppInline);
                      setNewSuppData({ name: '', phone: '', company_name: '', address: '' });
                    }}
                    className="text-[11px] font-semibold text-[#00a86b] dark:text-[#00df89] hover:underline flex items-center gap-1 cursor-pointer"
                  >
                    <Building2 className="w-3 h-3" />
                    <span>{showAddSuppInline ? (lang === 'bn' ? 'তালিকা থেকে বেছে নিন' : 'Choose existing') : (lang === 'bn' ? '+ নতুন সাপ্লায়ার' : '+ Add New Supplier')}</span>
                  </button>
                </div>

                {showAddSuppInline ? (
                  <div className="p-2.5 rounded-xl bg-emerald-500/5 border border-emerald-500/20 space-y-2">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      <input
                        type="text"
                        placeholder={lang === 'bn' ? 'সাপ্লায়ার নাম *' : 'Supplier Name *'}
                        value={newSuppData.name}
                        onChange={(e) => setNewSuppData({ ...newSuppData, name: e.target.value })}
                        className="px-3 py-1.5 rounded-lg bg-white dark:bg-[#09090b] border border-slate-200 dark:border-zinc-800 outline-none text-xs"
                      />
                      <input
                        type="text"
                        placeholder={lang === 'bn' ? 'ফোন নম্বর' : 'Phone'}
                        value={newSuppData.phone}
                        onChange={(e) => setNewSuppData({ ...newSuppData, phone: e.target.value })}
                        className="px-3 py-1.5 rounded-lg bg-white dark:bg-[#09090b] border border-slate-200 dark:border-zinc-800 outline-none text-xs"
                      />
                    </div>
                    <div className="flex justify-end">
                      <Button
                        type="button"
                        size="sm"
                        disabled={isCreatingSupp || !newSuppData.name.trim()}
                        onClick={() => handleCreateSupplier(true)}
                        className="bg-[#00df89] hover:bg-[#00c97b] text-[#011812] font-semibold text-xs h-8 px-3 cursor-pointer"
                      >
                        {isCreatingSupp ? <Loader2 className="w-3 h-3 animate-spin" /> : (lang === 'bn' ? 'সেভ ও নির্বাচন' : 'Save & Select')}
                      </Button>
                    </div>
                  </div>
                ) : (
                  <Select
                    value={restockForm.supplier_id || '__walk_in__'}
                    onValueChange={(val) => setRestockForm({ ...restockForm, supplier_id: val === '__walk_in__' ? '' : val })}
                  >
                    <SelectTrigger className="w-full bg-slate-50 dark:bg-[#09090b]">
                      <SelectValue placeholder="General / Walk-in Supplier" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="__walk_in__">{lang === 'bn' ? 'সাধারণ সাপ্লায়ার' : 'General / Walk-in Supplier'}</SelectItem>
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

              {/* Quantity, Unit Cost, Total */}
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 dark:text-zinc-300 mb-1">
                    {lang === 'bn' ? 'নতুন স্টক পরিমাণ *' : 'Qty to Add *'}
                  </label>
                  <input
                    type="number"
                    min="1"
                    required
                    value={restockForm.quantity}
                    onChange={(e) => setRestockForm({ ...restockForm, quantity: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-[#09090b] border border-slate-200 dark:border-zinc-800 outline-none focus:ring-2 focus:ring-[#00df89]"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 dark:text-zinc-300 mb-1">
                    {lang === 'bn' ? 'প্রতি একক ক্রয়মূল্য (৳)' : 'Unit Cost (৳)'}
                  </label>
                  <input
                    type="number"
                    min="0"
                    step="any"
                    value={restockForm.unit_cost}
                    onChange={(e) => setRestockForm({ ...restockForm, unit_cost: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-[#09090b] border border-slate-200 dark:border-zinc-800 outline-none"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 dark:text-zinc-300 mb-1">
                    {lang === 'bn' ? 'বিক্রয়মূল্য (৳)' : 'Sell Price (৳)'}
                  </label>
                  <input
                    type="number"
                    min="0"
                    step="any"
                    value={restockForm.selling_price}
                    onChange={(e) => setRestockForm({ ...restockForm, selling_price: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-[#09090b] border border-slate-200 dark:border-zinc-800 outline-none"
                  />
                </div>
              </div>

              {/* Total Calculation & Payment Method */}
              <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-zinc-900/60 border border-slate-200/80 dark:border-zinc-800/80 space-y-2.5">
                <div className="flex justify-between items-center text-xs font-bold">
                  <span className="text-slate-500">{lang === 'bn' ? 'মোট ক্রয় বিল:' : 'Total Purchase Bill:'}</span>
                  <span className="text-sm text-slate-900 dark:text-white font-mono">
                    ৳{((Number(restockForm.quantity) || 0) * (Number(restockForm.unit_cost) || 0)).toLocaleString()}
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-2 pt-1 border-t border-slate-200 dark:border-zinc-800">
                  <div>
                    <label className="block text-[11px] font-medium text-slate-500 mb-1">
                      {lang === 'bn' ? 'পরিশোধিত অর্থ (ঐচ্ছিক)' : 'Paid Amount (Optional)'}
                    </label>
                    <input
                      type="number"
                      placeholder={`৳${((Number(restockForm.quantity) || 0) * (Number(restockForm.unit_cost) || 0))}`}
                      value={restockForm.paid_amount}
                      onChange={(e) => setRestockForm({ ...restockForm, paid_amount: e.target.value })}
                      className="w-full px-2.5 py-1.5 rounded-lg bg-white dark:bg-[#09090b] border border-slate-200 dark:border-zinc-800 outline-none text-xs"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-medium text-slate-500 mb-1">
                      {lang === 'bn' ? 'পেমেন্ট মাধ্যম' : 'Payment Method'}
                    </label>
                    <Select
                      value={restockForm.payment_method}
                      onValueChange={(val) => setRestockForm({ ...restockForm, payment_method: val })}
                    >
                      <SelectTrigger className="w-full h-8 text-xs bg-white dark:bg-[#09090b]">
                        <SelectValue placeholder="Cash" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="cash">{lang === 'bn' ? 'নগদ (Cash)' : 'Cash'}</SelectItem>
                        <SelectItem value="bkash">bKash</SelectItem>
                        <SelectItem value="nagad">Nagad</SelectItem>
                        <SelectItem value="rocket">Rocket</SelectItem>
                        <SelectItem value="card">{lang === 'bn' ? 'কার্ড' : 'Card'}</SelectItem>
                        <SelectItem value="due">{lang === 'bn' ? 'সম্পূর্ণ বাকি (Due)' : 'Full Due'}</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>

              <div>
                <label className="block font-medium text-slate-700 dark:text-zinc-300 mb-1">
                  {lang === 'bn' ? 'নোট বা মন্তব্য' : 'Notes / Remarks'}
                </label>
                <input
                  type="text"
                  placeholder={lang === 'bn' ? 'ঐচ্ছিক মন্তব্য...' : 'Optional purchase notes...'}
                  value={restockForm.notes}
                  onChange={(e) => setRestockForm({ ...restockForm, notes: e.target.value })}
                  className="w-full px-3 py-1.5 rounded-xl bg-slate-50 dark:bg-[#09090b] border border-slate-200 dark:border-zinc-800 outline-none"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-slate-100 dark:border-zinc-800">
                <Button type="button" variant="outline" size="sm" onClick={() => setIsRestockModalOpen(false)} className="cursor-pointer">
                  {lang === 'bn' ? 'বাতিল' : 'Cancel'}
                </Button>
                <Button
                  type="submit"
                  disabled={isSubmitting || !restockForm.product_id}
                  size="sm"
                  className="bg-[#00df89] hover:bg-[#00c97b] text-[#011812] font-semibold cursor-pointer disabled:opacity-50"
                >
                  {isSubmitting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : (lang === 'bn' ? 'স্টক ইন ও রেকর্ড সংরক্ষণ' : 'Add Stock & Save')}
                </Button>
              </div>
            </form>
          </Card>
        </div>
      )}

      {/* ---------------------------------------------------- */}
      {/* 4. QUICK UPDATE / EDIT PRODUCT PICKER MODAL          */}
      {/* ---------------------------------------------------- */}
      {isQuickEditPickerOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs animate-in fade-in duration-150">
          <Card className="max-w-md w-full p-6 bg-white dark:bg-[#121215] border-slate-200 dark:border-zinc-800 space-y-4 shadow-2xl max-h-[85vh] flex flex-col">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-zinc-800 pb-3 shrink-0">
              <h2 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <Edit2 className="w-4 h-4 text-amber-500" />
                <span>{lang === 'bn' ? 'সম্পাদনা করতে পণ্য বেছে নিন' : 'Select Product to Edit'}</span>
              </h2>
              <button onClick={() => setIsQuickEditPickerOpen(false)} className="text-slate-400 p-1 cursor-pointer">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto space-y-2 pr-1 text-xs">
              {productList.length === 0 ? (
                <p className="py-8 text-center text-slate-400">
                  {lang === 'bn' ? 'কোনো পণ্য নেই' : 'No products available.'}
                </p>
              ) : (
                productList.map((p) => (
                  <button
                    key={p.id}
                    type="button"
                    onClick={() => {
                      setIsQuickEditPickerOpen(false);
                      handleOpenEdit(p);
                    }}
                    className="w-full p-2.5 rounded-xl bg-slate-50 dark:bg-zinc-900/60 border border-slate-200/80 dark:border-zinc-800/80 hover:border-amber-500 hover:bg-amber-500/5 transition-all text-left flex items-center justify-between cursor-pointer group"
                  >
                    <div>
                      <p className="font-bold text-slate-900 dark:text-white group-hover:text-amber-500 transition-colors">
                        {p.name}
                      </p>
                      <p className="text-[11px] text-slate-400">
                        {p.category} &bull; Stock: {p.stock} {p.unit} &bull; ৳{p.sellPrice}
                      </p>
                    </div>
                    <Edit2 className="w-4 h-4 text-slate-400 group-hover:text-amber-500 group-hover:scale-110 transition-all" />
                  </button>
                ))
              )}
            </div>
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
