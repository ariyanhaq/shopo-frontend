/**
 * @file Products.jsx
 * @description Comprehensive Products catalog & Inventory management with Live DB sync, Category-wise sorting, Category filters, Edit product modal, and Inline Category creation.
 */
import { useState, useMemo, useEffect, useRef } from 'react';
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
import Pagination from '@/components/common/Pagination';
import { BarcodeLabelModal } from '@/components/inventory/BarcodeLabelModal';
import { generateUniqueBarcode } from '@/utils/barcodePrinter';
import { useBodyScrollLock } from '@/hooks/useBodyScrollLock';
import {
  Package, PackagePlus, DollarSign, Plus, Search, Filter, AlertTriangle,
  Download, Edit2, Trash2, CheckCircle2, Clock, X, Barcode,
  Layers, ArrowUpRight, ShieldCheck, Tag, ChevronRight, Loader2,
  Sparkles, FolderPlus, ArrowUpDown, ArrowUp, ArrowDown, ImageIcon,
  Building2, ShoppingBag, Boxes, HelpCircle, Wallet, Sliders, SlidersHorizontal,
  Printer, RefreshCw
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
  const [isBarcodeModalOpen, setIsBarcodeModalOpen] = useState(false);
  const [barcodeModalProducts, setBarcodeModalProducts] = useState([]);
  const [editingProduct, setEditingProduct] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useBodyScrollLock(
    Boolean(
      isActionChoiceModalOpen ||
      isAddModalOpen ||
      isRestockModalOpen ||
      isQuickEditPickerOpen ||
      isEditModalOpen ||
      isBarcodeModalOpen
    )
  );

  useEffect(() => {
    if (location.state?.openAddModal || new URLSearchParams(location.search).get('action') === 'add') {
      setIsActionChoiceModalOpen(true);
    }
  }, [location]);

  const [productList, setProductList] = useState([]);
  const [categories, setCategories] = useState([]);
  const [brands, setBrands] = useState([]);
  const [suppliers, setSuppliers] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  // Inline Category Creator State
  const [showAddCatInline, setShowAddCatInline] = useState(false);
  const [showEditCatInline, setShowEditCatInline] = useState(false);
  const [newCatName, setNewCatName] = useState('');
  const [isCreatingCat, setIsCreatingCat] = useState(false);

  // Inline Brand Creator State
  const [showAddBrandInline, setShowAddBrandInline] = useState(false);
  const [showEditBrandInline, setShowEditBrandInline] = useState(false);
  const [newBrandName, setNewBrandName] = useState('');
  const [isCreatingBrand, setIsCreatingBrand] = useState(false);

  // Inline Supplier Creator State
  const [showAddSuppInline, setShowAddSuppInline] = useState(false);
  const [showEditSuppInline, setShowEditSuppInline] = useState(false);
  const [newSuppData, setNewSuppData] = useState({ name: '', phone: '', company_name: '', address: '' });
  const [isCreatingSupp, setIsCreatingSupp] = useState(false);
  const newAttrEndRef = useRef(null);

  // New Product Form State
  const [newProduct, setNewProduct] = useState({
    name: '',
    image_url: '',
    category_id: '__general__',
    brand_id: '',
    supplier_id: '',
    sku: '',
    barcode: generateUniqueBarcode('20'),
    stock: '',
    buyPrice: '',
    sellPrice: '',
    payment_type: 'due',
    paid_amount: '0',
    payment_method: 'cash',
    unit: 'Pcs',
    lowStockThreshold: 5,
    has_variants: false,
    variation_options: [],
    variants: [],
  });

  // Preset attribute suggestions
  const attributePresets = [
    { name: 'Color', values: ['Red', 'Blue', 'Black', 'White', 'Green'] },
    { name: 'Size', values: ['S', 'M', 'L', 'XL', 'XXL'] },
    { name: 'Pages / Type', values: ['100 Pages', '200 Pages', '300 Pages'] },
    { name: 'Storage / RAM', values: ['64GB', '128GB', '256GB'] },
  ];

  // Generate Combinations for Add Product
  const generateNewProductCombinations = () => {
    const validOptions = (newProduct.variation_options || []).filter((opt) => opt.name.trim() && opt.values.length > 0);
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

    const baseCost = newProduct.buyPrice !== '' ? (parseFloat(newProduct.buyPrice) || 0) : 0;
    const baseSell = newProduct.sellPrice !== '' ? (parseFloat(newProduct.sellPrice) || 0) : 0;
    const totalStock = parseInt(newProduct.stock, 10) || 0;
    const count = combinations.length;
    const perVariant = count > 0 ? Math.floor(totalStock / count) : 0;
    const remainder = count > 0 ? (totalStock % count) : 0;
    const alertLevel = parseInt(newProduct.lowStockThreshold, 10) || 5;
    const basePrefix = newProduct.name ? newProduct.name.slice(0, 3).toUpperCase() : 'SKU';

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
        barcode: generateUniqueBarcode('21'),
        cost_price: baseCost,
        selling_price: baseSell,
        stock_quantity: perVariant + (idx < remainder ? 1 : 0),
        low_stock_threshold: alertLevel,
      };
    });

    setNewProduct(prev => ({ ...prev, variants: newVariants }));
    toast.success(lang === 'bn' ? `${newVariants.length} টি ভ্যারিয়েশন তৈরি হয়েছে!` : `Generated ${newVariants.length} variations!`);
  };

  const handleAddNewProductAttrGroup = (preset) => {
    if (preset) {
      setNewProduct(prev => ({
        ...prev,
        variation_options: [...(prev.variation_options || []), { name: preset.name, values: [] }]
      }));
    } else {
      setNewProduct(prev => ({
        ...prev,
        variation_options: [...(prev.variation_options || []), { name: '', values: [] }]
      }));
    }

    // Scroll down to the newly added attribute smoothly
    setTimeout(() => {
      if (newAttrEndRef.current) {
        newAttrEndRef.current.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
      }
    }, 80);
  };

  const handleRemoveNewProductAttrGroup = (index) => {
    setNewProduct(prev => ({
      ...prev,
      variation_options: (prev.variation_options || []).filter((_, i) => i !== index)
    }));
  };

  const handleAddNewProductOptionValue = (optIndex, val) => {
    if (!val || !val.trim()) return;
    const upperVal = String(val).trim().toUpperCase();
    setNewProduct(prev => {
      const updated = [...(prev.variation_options || [])];
      if (updated[optIndex] && !updated[optIndex].values.includes(upperVal)) {
        updated[optIndex] = {
          ...updated[optIndex],
          values: [...updated[optIndex].values, upperVal],
        };
      }
      return { ...prev, variation_options: updated };
    });
  };

  const handleRemoveNewProductOptionValue = (optIndex, valIndex) => {
    setNewProduct(prev => {
      const updated = [...(prev.variation_options || [])];
      updated[optIndex].values = updated[optIndex].values.filter((_, i) => i !== valIndex);
      return { ...prev, variation_options: updated };
    });
  };

  const handleUpdateNewProductVariant = (vIdx, field, value) => {
    setNewProduct(prev => {
      const updated = [...(prev.variants || [])];
      updated[vIdx] = { ...updated[vIdx], [field]: value };
      let nextStock = prev.stock;
      if (field === 'stock_quantity') {
        const total = updated.reduce((sum, v) => sum + (parseInt(v.stock_quantity, 10) || 0), 0);
        nextStock = total.toString();
      }
      return { ...prev, variants: updated, stock: nextStock };
    });
  };

  const handleRemoveNewProductVariant = (vIdx) => {
    setNewProduct(prev => {
      const updated = (prev.variants || []).filter((_, i) => i !== vIdx);
      const total = updated.reduce((sum, v) => sum + (parseInt(v.stock_quantity, 10) || 0), 0);
      return {
        ...prev,
        variants: updated,
        stock: prev.has_variants && updated.length > 0 ? total.toString() : prev.stock,
      };
    });
  };

  const handleBulkFillNewProductVariants = (field, value) => {
    setNewProduct(prev => {
      const updated = (prev.variants || []).map(v => ({ ...v, [field]: value }));
      let nextStock = prev.stock;
      if (field === 'stock_quantity') {
        const total = updated.reduce((sum, v) => sum + (parseInt(v.stock_quantity, 10) || 0), 0);
        nextStock = total.toString();
      }
      return { ...prev, variants: updated, stock: nextStock };
    });
    toast.success(lang === 'bn' ? 'সকল ভ্যারিয়েশনে প্রয়োগ করা হয়েছে' : 'Applied to all variations');
  };

  const handleNewProductBuyPriceChange = (val) => {
    setNewProduct(prev => {
      const parsed = parseFloat(val) || 0;
      const updatedVariants = prev.has_variants && Array.isArray(prev.variants)
        ? prev.variants.map(v => ({ ...v, cost_price: val === '' ? '' : parsed }))
        : prev.variants;
      return {
        ...prev,
        buyPrice: val,
        variants: updatedVariants,
      };
    });
  };

  const handleNewProductSellPriceChange = (val) => {
    setNewProduct(prev => {
      const parsed = parseFloat(val) || 0;
      const updatedVariants = prev.has_variants && Array.isArray(prev.variants)
        ? prev.variants.map(v => ({ ...v, selling_price: val === '' ? '' : parsed }))
        : prev.variants;
      return {
        ...prev,
        sellPrice: val,
        variants: updatedVariants,
      };
    });
  };

  const handleNewProductStockChange = (val) => {
    setNewProduct(prev => {
      const totalStock = parseInt(val, 10) || 0;
      let updatedVariants = prev.variants;
      if (prev.has_variants && Array.isArray(prev.variants) && prev.variants.length > 0) {
        const count = prev.variants.length;
        const perVariant = Math.floor(totalStock / count);
        const remainder = totalStock % count;
        updatedVariants = prev.variants.map((v, idx) => ({
          ...v,
          stock_quantity: val === '' ? '' : (perVariant + (idx < remainder ? 1 : 0)),
        }));
      }
      return {
        ...prev,
        stock: val,
        variants: updatedVariants,
      };
    });
  };

  const handleNewProductLowStockChange = (val) => {
    setNewProduct(prev => {
      const alertVal = parseInt(val, 10) || 0;
      const updatedVariants = prev.has_variants && Array.isArray(prev.variants)
        ? prev.variants.map(v => ({ ...v, low_stock_threshold: val === '' ? '' : alertVal }))
        : prev.variants;
      return {
        ...prev,
        lowStockThreshold: val,
        variants: updatedVariants,
      };
    });
  };

  const handleEditProductBuyPriceChange = (val) => {
    setEditForm(prev => {
      const parsed = parseFloat(val) || 0;
      const updatedVariants = prev.has_variants && Array.isArray(prev.variants)
        ? prev.variants.map(v => ({ ...v, cost_price: val === '' ? '' : parsed }))
        : prev.variants;
      return {
        ...prev,
        buyPrice: val,
        variants: updatedVariants,
      };
    });
  };

  const handleEditProductSellPriceChange = (val) => {
    setEditForm(prev => {
      const parsed = parseFloat(val) || 0;
      const updatedVariants = prev.has_variants && Array.isArray(prev.variants)
        ? prev.variants.map(v => ({ ...v, selling_price: val === '' ? '' : parsed }))
        : prev.variants;
      return {
        ...prev,
        sellPrice: val,
        variants: updatedVariants,
      };
    });
  };

  const handleEditProductStockChange = (val) => {
    setEditForm(prev => {
      const totalStock = parseInt(val, 10) || 0;
      let updatedVariants = prev.variants;
      if (prev.has_variants && Array.isArray(prev.variants) && prev.variants.length > 0) {
        const count = prev.variants.length;
        const perVariant = Math.floor(totalStock / count);
        const remainder = totalStock % count;
        updatedVariants = prev.variants.map((v, idx) => ({
          ...v,
          stock_quantity: val === '' ? '' : (perVariant + (idx < remainder ? 1 : 0)),
        }));
      }
      return {
        ...prev,
        stock: val,
        variants: updatedVariants,
      };
    });
  };

  const handleEditProductLowStockChange = (val) => {
    setEditForm(prev => {
      const alertVal = parseInt(val, 10) || 0;
      const updatedVariants = prev.has_variants && Array.isArray(prev.variants)
        ? prev.variants.map(v => ({ ...v, low_stock_threshold: val === '' ? '' : alertVal }))
        : prev.variants;
      return {
        ...prev,
        lowStockThreshold: val,
        variants: updatedVariants,
      };
    });
  };

  // Restock / Add Stock to Existing Product Form State
  const [restockForm, setRestockForm] = useState({
    product_id: '',
    variant_id: '',
    variant_name: '',
    restock_mode: 'matrix', // 'matrix' (all variants table) or 'single'
    variant_items: [], // [{ variant_id, variant_name, current_stock, quantity, unit_cost, selling_price }]
    supplier_id: '',
    quantity: 1,
    unit_cost: 0,
    selling_price: 0,
    paid_amount: '',
    payment_method: 'cash',
    notes: '',
  });

  // Fast Bulk Fill for Restock Variants Matrix
  const [restockBulkCost, setRestockBulkCost] = useState('');
  const [restockBulkQty, setRestockBulkQty] = useState('');
  const [showAddNewVariantInRestock, setShowAddNewVariantInRestock] = useState(false);
  const [newRestockVariantName, setNewRestockVariantName] = useState('');
  const [newRestockVariantCost, setNewRestockVariantCost] = useState('');
  const [newRestockVariantSell, setNewRestockVariantSell] = useState('');
  const [newRestockVariantQty, setNewRestockVariantQty] = useState('10');

  const applyRestockBulkField = (field, value) => {
    const num = parseFloat(value);
    if (isNaN(num)) return;
    setRestockForm((prev) => ({
      ...prev,
      variant_items: prev.variant_items.map((item) => ({
        ...item,
        [field]: num,
      })),
    }));
    toast.success(lang === 'bn' ? 'সকল ভ্যারিয়েশনে প্রয়োগ করা হয়েছে' : 'Applied to all variations');
  };

  const handleAddNewVariantToRestock = () => {
    if (!newRestockVariantName.trim()) {
      toast.error(lang === 'bn' ? 'ভ্যারিয়েশনের নাম লিখুন।' : 'Please enter variant name.');
      return;
    }
    const selectedProd = productList.find((p) => p.id === restockForm.product_id);
    const cost = parseFloat(newRestockVariantCost) || (selectedProd ? selectedProd.buyPrice : 0);
    const sell = parseFloat(newRestockVariantSell) || (selectedProd ? selectedProd.sellPrice : 0);
    const qty = parseInt(newRestockVariantQty, 10) || 1;

    setRestockForm((prev) => ({
      ...prev,
      variant_items: [
        ...prev.variant_items,
        {
          variant_id: '',
          variant_name: newRestockVariantName.trim(),
          current_stock: 0,
          quantity: qty,
          unit_cost: cost,
          selling_price: sell,
        },
      ],
    }));

    setNewRestockVariantName('');
    setNewRestockVariantCost('');
    setNewRestockVariantSell('');
    setShowAddNewVariantInRestock(false);
    toast.success(lang === 'bn' ? 'নতুন ভ্যারিয়েশন রিস্টক তালিকায় যোগ হয়েছে!' : 'New variation added to restock list!');
  };

  // Edit Product Form State
  const [editForm, setEditForm] = useState({
    id: '',
    name: '',
    image_url: '',
    category_id: '',
    brand_id: '',
    supplier_id: '',
    sku: '',
    barcode: '',
    stock: '',
    buyPrice: '',
    sellPrice: '',
    unit: 'Pcs',
    lowStockThreshold: 5,
    has_variants: false,
    variation_options: [],
    variants: [],
  });

  // Selected Product for quick variant viewing modal
  const [selectedVariantProduct, setSelectedVariantProduct] = useState(null);

  const fetchDbProducts = async () => {
    setIsLoading(true);
    try {
      const [prodRes, catRes, suppRes, brandRes] = await Promise.all([
        api.products.list(),
        api.categories.list().catch(() => ({ data: [] })),
        api.suppliers.list().catch(() => ({ data: [] })),
        api.brands.list().catch(() => ({ data: [] })),
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

      const fetchedBrands = Array.isArray(brandRes?.data) ? brandRes.data : [];
      if (brandRes?.data) {
        setBrands(fetchedBrands);
      }

      const mapped = rawList.map((p) => {
        const catObj = typeof p.category_id === 'object' ? p.category_id : null;
        const catId = catObj?._id || p.category_id || '';
        const matchingCat = fetchedCategories.find((c) => String(c._id) === String(catId));
        const catName =
          catObj?.name ||
          matchingCat?.name ||
          (typeof p.category_id === 'string' && p.category_id.length !== 24 ? p.category_id : 'General');

        const brandObj = typeof p.brand_id === 'object' ? p.brand_id : null;
        const brandId = brandObj?._id || p.brand_id || '';
        const matchingBrand = fetchedBrands.find((b) => String(b._id) === String(brandId));
        const brandName = brandObj?.name || matchingBrand?.name || p.brand || '';

        const hasVars = Boolean(p.has_variants) && Array.isArray(p.variants) && p.variants.length > 0;
        const trueStock = hasVars ? p.variants.reduce((sum, v) => sum + (Number(v.stock_quantity) || 0), 0) : (p.stock_quantity ?? 0);

        return {
          id: p._id || p.id,
          _id: p._id || p.id,
          name: p.name,
          image_url: p.image_url || (Array.isArray(p.images) && p.images[0]) || '',
          sku: p.sku || 'N/A',
          barcode: p.barcode || '',
          category_id: matchingCat ? matchingCat._id : (catId || '__general__'),
          supplier_id: p.supplier_id?._id || p.supplier_id || '',
          category: catName,
          brand_id: matchingBrand ? matchingBrand._id : brandId,
          brand: brandName,
          stock: trueStock,
          unit: p.unit || 'Pcs',
          buyPrice: p.cost_price ?? 0,
          sellPrice: p.selling_price ?? 0,
          lowStockThreshold: p.low_stock_threshold ?? 5,
          has_variants: Boolean(p.has_variants),
          variation_options: Array.isArray(p.variation_options) ? p.variation_options : [],
          variants: Array.isArray(p.variants) ? p.variants : [],
          status: trueStock <= 0 ? 'out_of_stock' : trueStock <= (p.low_stock_threshold || 5) ? 'low_stock' : 'in_stock',
          purchase_info: p.purchase_info || null,
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

  // Pagination State
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, categoryFilter, stockStatusFilter, sortBy, pageSize]);

  const paginatedProducts = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredProducts.slice(start, start + pageSize);
  }, [filteredProducts, currentPage, pageSize]);

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

  // Handle Inline Brand Creation
  const handleCreateBrand = async (forEdit = false) => {
    if (!newBrandName.trim()) return;
    setIsCreatingBrand(true);
    try {
      const res = await api.brands.create({ name: newBrandName.trim() });
      if (res.data) {
        setBrands((prev) => [...prev, res.data]);
        if (forEdit) {
          setEditForm((prev) => ({ ...prev, brand_id: res.data._id }));
          setShowEditBrandInline(false);
        } else {
          setNewProduct((prev) => ({ ...prev, brand_id: res.data._id }));
          setShowAddBrandInline(false);
        }
        toast.success(lang === 'bn' ? `ব্র্যান্ড '${res.data.name}' যুক্ত হয়েছে!` : `Brand '${res.data.name}' created!`);
        setNewBrandName('');
      }
    } catch (err) {
      toast.error(err.message || 'Failed to create brand.');
    } finally {
      setIsCreatingBrand(false);
    }
  };

  // Handle Inline Supplier Creation
  const handleCreateSupplier = async (target = 'create') => {
    if (!newSuppData.name.trim()) return;
    setIsCreatingSupp(true);
    try {
      const res = await api.suppliers.create(newSuppData);
      if (res?.data) {
        setSuppliers((prev) => [res.data, ...prev]);
        if (target === 'restock' || target === true) {
          setRestockForm((prev) => ({ ...prev, supplier_id: res.data._id }));
        } else if (target === 'edit') {
          setEditForm((prev) => ({ ...prev, supplier_id: res.data._id }));
          setShowEditSuppInline(false);
        } else {
          setNewProduct((prev) => ({ ...prev, supplier_id: res.data._id }));
          setShowAddSuppInline(false);
        }
        setNewSuppData({ name: '', phone: '', company_name: '', address: '' });
        toast.success(lang === 'bn' ? `সাপ্লায়ার '${res.data.name}' যুক্ত হয়েছে!` : `Supplier '${res.data.name}' created!`);
      }
    } catch (err) {
      toast.error(err.message || 'Failed to create supplier.');
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
        if (newProduct.category_id === deleteOptionModal.id) {
          setNewProduct((prev) => ({ ...prev, category_id: '__general__' }));
        }
        if (editForm.category_id === deleteOptionModal.id) {
          setEditForm((prev) => ({ ...prev, category_id: '__general__' }));
        }
        toast.success(lang === 'bn' ? `ক্যাটাগরি '${deleteOptionModal.name}' মুছে ফেলা হয়েছে!` : `Category '${deleteOptionModal.name}' deleted!`);
      } else if (deleteOptionModal.type === 'brand') {
        await api.brands.delete(deleteOptionModal.id);
        setBrands((prev) => prev.filter((b) => b._id !== deleteOptionModal.id));
        if (newProduct.brand_id === deleteOptionModal.id) {
          setNewProduct((prev) => ({ ...prev, brand_id: '' }));
        }
        if (editForm.brand_id === deleteOptionModal.id) {
          setEditForm((prev) => ({ ...prev, brand_id: '' }));
        }
        toast.success(lang === 'bn' ? `ব্র্যান্ড '${deleteOptionModal.name}' মুছে ফেলা হয়েছে!` : `Brand '${deleteOptionModal.name}' deleted!`);
      } else if (deleteOptionModal.type === 'supplier') {
        await api.suppliers.delete(deleteOptionModal.id);
        setSuppliers((prev) => prev.filter((s) => s._id !== deleteOptionModal.id));
        if (newProduct.supplier_id === deleteOptionModal.id) {
          setNewProduct((prev) => ({ ...prev, supplier_id: '' }));
        }
        if (restockForm.supplier_id === deleteOptionModal.id) {
          setRestockForm((prev) => ({ ...prev, supplier_id: '' }));
        }
        toast.success(lang === 'bn' ? `সাপ্লায়ার '${deleteOptionModal.name}' মুছে ফেলা হয়েছে!` : `Supplier '${deleteOptionModal.name}' deleted!`);
      }
      setDeleteOptionModal({ isOpen: false, type: '', id: null, name: '', isLoading: false });
    } catch (err) {
      toast.error(err.message || 'Failed to delete option.');
      setDeleteOptionModal((prev) => ({ ...prev, isLoading: false }));
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

      const finalBrandId = (newProduct.brand_id && newProduct.brand_id !== '__none__')
        ? newProduct.brand_id
        : undefined;
      const selectedBrand = brands.find((b) => b._id === newProduct.brand_id);

      const hasVars = Boolean(newProduct.has_variants);
      const costPrice = parseFloat(newProduct.buyPrice) || 0;
      const sellPrice = parseFloat(newProduct.sellPrice) || 0;

      const initialStock = hasVars
        ? (newProduct.variants || []).reduce((sum, v) => sum + (parseInt(v.stock_quantity, 10) || 0), 0)
        : (parseInt(newProduct.stock, 10) || 0);

      const totalCost = hasVars
        ? (newProduct.variants || []).reduce((sum, v) => sum + (parseInt(v.stock_quantity, 10) || 0) * (parseFloat(v.cost_price) || costPrice), 0)
        : (initialStock * costPrice);

      let calculatedPaid = 0;
      if (newProduct.supplier_id) {
        if (newProduct.payment_type === 'due') {
          calculatedPaid = 0;
        } else if (newProduct.payment_type === 'full') {
          calculatedPaid = totalCost;
        } else if (newProduct.payment_type === 'partial') {
          if (newProduct.paid_amount !== '' && newProduct.paid_amount !== undefined) {
            const val = parseFloat(newProduct.paid_amount);
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

      const res = await api.products.create({
        name: newProduct.name.trim(),
        image_url: newProduct.image_url || undefined,
        images: newProduct.image_url ? [newProduct.image_url] : [],
        category_id: finalCatId,
        brand_id: finalBrandId,
        brand: selectedBrand?.name || '',
        supplier_id: newProduct.supplier_id || undefined,
        sku: newProduct.sku ? newProduct.sku.trim() : undefined,
        barcode: newProduct.barcode ? newProduct.barcode.trim() : undefined,
        cost_price: costPrice,
        selling_price: sellPrice,
        stock_quantity: initialStock,
        paid_amount: calculatedPaid,
        payment_method: newProduct.payment_method || 'cash',
        unit: newProduct.unit || 'Pcs',
        low_stock_threshold: parseInt(newProduct.lowStockThreshold, 10) || 5,
        has_variants: hasVars,
        variation_options: hasVars ? (newProduct.variation_options || []) : [],
        variants: hasVars
          ? (newProduct.variants || []).map((v) => ({
              name: v.name,
              attributes: v.attributes || [],
              sku: v.sku ? v.sku.trim() : undefined,
              barcode: v.barcode ? v.barcode.trim() : undefined,
              cost_price: parseFloat(v.cost_price) || costPrice,
              selling_price: parseFloat(v.selling_price) || sellPrice,
              stock_quantity: parseInt(v.stock_quantity, 10) || 0,
              low_stock_threshold: parseInt(v.low_stock_threshold, 10) || 5,
            }))
          : [],
      });

      const createdProd = res?.data || res;

      // Prepare item for 1-click label printing
      const itemToPrint = {
        id: createdProd?._id || createdProd?.id || String(Date.now()),
        name: newProduct.name.trim(),
        has_variants: hasVars,
        barcode: newProduct.barcode || createdProd?.barcode,
        selling_price: sellPrice,
        sellPrice: sellPrice,
        stock: initialStock,
        unit: newProduct.unit || 'Pcs',
        variants: hasVars
          ? (newProduct.variants || []).map((v, i) => ({
              _id: (createdProd?.variants && createdProd.variants[i]?._id) || `var_${i}`,
              name: v.name,
              barcode: v.barcode || (createdProd?.variants && createdProd.variants[i]?.barcode) || generateUniqueBarcode('21'),
              selling_price: parseFloat(v.selling_price) || sellPrice,
              stock_quantity: parseInt(v.stock_quantity, 10) || 0,
            }))
          : [],
      };

      setIsAddModalOpen(false);
      setNewProduct({
        name: '',
        image_url: '',
        category_id: '__general__',
        brand_id: '',
        supplier_id: '',
        sku: '',
        barcode: generateUniqueBarcode('20'),
        stock: '',
        buyPrice: '',
        sellPrice: '',
        payment_type: 'due',
        paid_amount: '0',
        payment_method: 'cash',
        unit: 'Pcs',
        lowStockThreshold: 5,
        has_variants: false,
        variation_options: [],
        variants: [],
      });

      fetchDbProducts();

      toast.success(
        (t) => (
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="font-bold text-xs">{lang === 'bn' ? 'পণ্য ও বারকোড তৈরি সম্পন্ন!' : 'Product & Barcode created!'}</p>
              <p className="text-[11px] text-slate-500">{lang === 'bn' ? 'বারকোড লেবেল প্রিন্ট করতে চান?' : 'Print barcode stickers now?'}</p>
            </div>
            <Button
              size="sm"
              onClick={() => {
                toast.dismiss(t.id);
                setBarcodeModalProducts([itemToPrint]);
                setIsBarcodeModalOpen(true);
              }}
              className="bg-[#00df89] hover:bg-[#00c97b] text-[#011812] text-xs font-bold h-7 px-2.5 cursor-pointer shrink-0"
            >
              <Printer className="w-3.5 h-3.5 mr-1" />
              {lang === 'bn' ? 'প্রিন্ট' : 'Print'}
            </Button>
          </div>
        ),
        { duration: 6000 }
      );
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

    const selectedProd = productList.find((p) => p.id === restockForm.product_id);
    let purchaseItems = [];

    if (
      selectedProd?.has_variants &&
      restockForm.restock_mode === 'matrix' &&
      Array.isArray(restockForm.variant_items) &&
      restockForm.variant_items.length > 0
    ) {
      const activeVariants = restockForm.variant_items.filter((v) => Number(v.quantity) > 0);
      if (activeVariants.length === 0) {
        toast.error(lang === 'bn' ? 'কমপক্ষে একটি ভ্যারিয়েশনের জন্য পরিমাণ লিখুন।' : 'Please enter restock quantity for at least one variation.');
        return;
      }
      purchaseItems = activeVariants.map((v) => ({
        product_id: restockForm.product_id,
        variant_id: v.variant_id || undefined,
        variant_name: v.variant_name,
        product_name: `${selectedProd.name} (${v.variant_name})`,
        quantity: Number(v.quantity),
        unit_cost: Number(v.unit_cost) || 0,
        selling_price: Number(v.selling_price) || Number(selectedProd.sellPrice) || 0,
        total_cost: Number(v.quantity) * (Number(v.unit_cost) || 0),
      }));
    } else {
      const qty = Number(restockForm.quantity) || 0;
      if (qty <= 0) {
        toast.error(lang === 'bn' ? 'পরিমাণ কমপক্ষে ১ হতে باشد।' : 'Quantity must be at least 1.');
        return;
      }
      const unitCost = Number(restockForm.unit_cost) || 0;
      const totalCost = qty * unitCost;
      purchaseItems = [
        {
          product_id: restockForm.product_id,
          variant_id: restockForm.variant_id || undefined,
          variant_name: restockForm.variant_name || undefined,
          product_name: restockForm.variant_name ? `${selectedProd?.name} (${restockForm.variant_name})` : (selectedProd?.name || 'Product'),
          quantity: qty,
          unit_cost: unitCost,
          selling_price: Number(restockForm.selling_price) || selectedProd?.sellPrice || 0,
          total_cost: totalCost,
        },
      ];
    }

    const totalCost = purchaseItems.reduce((sum, it) => sum + it.total_cost, 0);
    const paid = restockForm.paid_amount !== '' ? Number(restockForm.paid_amount) : totalCost;

    setIsSubmitting(true);
    try {
      await api.purchases.create({
        supplier_id: restockForm.supplier_id || null,
        items: purchaseItems,
        paid_amount: paid,
        payment_method: restockForm.payment_method || 'cash',
        notes: restockForm.notes || '',
      });

      // Prepare restocked items for 1-click printing
      const restockedPrintItems = purchaseItems.map((pIt) => ({
        id: pIt.variant_id ? `${pIt.product_id}_${pIt.variant_id}` : `${pIt.product_id}`,
        productId: pIt.product_id,
        variantId: pIt.variant_id || null,
        name: selectedProd?.name || 'Product',
        variant_name: pIt.variant_name || '',
        barcode: selectedProd?.has_variants && pIt.variant_id
          ? (selectedProd.variants?.find((vr) => String(vr._id || vr.id) === String(pIt.variant_id))?.barcode || selectedProd.barcode)
          : selectedProd?.barcode,
        selling_price: pIt.selling_price || selectedProd?.sellPrice || 0,
        unit: selectedProd?.unit || 'pcs',
        stock: pIt.quantity,
        copies: pIt.quantity, // pre-fill copies to exact restocked qty!
      }));

      setIsRestockModalOpen(false);
      setRestockForm({
        product_id: '',
        variant_id: '',
        variant_name: '',
        restock_mode: 'matrix',
        variant_items: [],
        supplier_id: '',
        quantity: 1,
        unit_cost: 0,
        selling_price: 0,
        paid_amount: '',
        payment_method: 'cash',
        notes: '',
      });
      fetchDbProducts();

      toast.success(
        (t) => (
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="font-bold text-xs">{lang === 'bn' ? 'স্টক ও ক্রয় রেকর্ড সম্পন্ন!' : 'Stock restocked successfully!'}</p>
              <p className="text-[11px] text-slate-500">{lang === 'bn' ? 'নতুন স্টকের লেবেল প্রিন্ট করুন' : 'Print labels for new stock?'}</p>
            </div>
            <Button
              size="sm"
              onClick={() => {
                toast.dismiss(t.id);
                setBarcodeModalProducts(restockedPrintItems);
                setIsBarcodeModalOpen(true);
              }}
              className="bg-[#00df89] hover:bg-[#00c97b] text-[#011812] text-xs font-bold h-7 px-2.5 cursor-pointer shrink-0"
            >
              <Printer className="w-3.5 h-3.5 mr-1" />
              {lang === 'bn' ? 'প্রিন্ট' : 'Print'}
            </Button>
          </div>
        ),
        { duration: 6000 }
      );
    } catch (err) {
      toast.error(err.message || 'Failed to record purchase restock.');
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

    let brandId = product.brand_id;
    if (brandId && typeof brandId === 'object') {
      brandId = brandId._id;
    }
    const matchingBrand = brands.find(
      (b) => String(b._id) === String(brandId) || b.name?.toLowerCase() === (product.brand || '').toLowerCase()
    );
    const resolvedBrandId = matchingBrand ? matchingBrand._id : (brandId || '');

    let suppId = product.supplier_id || product.raw?.supplier_id;
    if (suppId && typeof suppId === 'object') {
      suppId = suppId._id;
    }
    const matchingSupp = suppliers.find((s) => String(s._id) === String(suppId));
    const resolvedSuppId = matchingSupp ? matchingSupp._id : (suppId || '');

    const purchaseInfo = product.purchase_info || null;
    const initialStock = Number(product.stock) || 0;
    const initialBuyPrice = Number(product.buyPrice) || 0;
    const initialTotalCost = initialStock * initialBuyPrice;

    let alreadyPaid = 0;
    let initialDue = 0;

    if (purchaseInfo) {
      initialDue = Number(purchaseInfo.due_amount || 0);
      alreadyPaid = initialDue === 0
        ? (initialTotalCost > 0 ? initialTotalCost : Number(purchaseInfo.paid_amount || 0))
        : Math.max(0, initialTotalCost - initialDue);
    } else {
      alreadyPaid = resolvedSuppId ? 0 : initialTotalCost;
      initialDue = resolvedSuppId ? initialTotalCost : 0;
    }

    setEditForm({
      id: product.id,
      name: product.name,
      image_url: product.image_url || '',
      category_id: resolvedCatId,
      brand_id: resolvedBrandId,
      supplier_id: resolvedSuppId,
      sku: product.sku !== 'N/A' ? product.sku : '',
      barcode: product.barcode || '',
      stock: product.stock,
      buyPrice: product.buyPrice,
      sellPrice: product.sellPrice,
      initial_stock: initialStock,
      initial_buy_price: initialBuyPrice,
      already_paid: alreadyPaid,
      initial_due: initialDue,
      payment_type: 'keep_existing',
      extra_payment_type: initialDue === 0 ? 'extra_full' : 'extra_due',
      extra_paid_amount: '',
      paid_amount: String(alreadyPaid),
      payment_method: purchaseInfo?.payment_method || 'cash',
      unit: product.unit || 'Pcs',
      lowStockThreshold: product.lowStockThreshold || 5,
      has_variants: Boolean(product.has_variants),
      variation_options: Array.isArray(product.variation_options) ? product.variation_options : [],
      variants: Array.isArray(product.variants) ? JSON.parse(JSON.stringify(product.variants)) : [],
    });
    setShowEditSuppInline(false);
    setIsEditModalOpen(true);
  };

  // Handle Update Product Submit
  const handleUpdateProduct = async (e) => {
    e.preventDefault();
    if (!editForm.name || !editForm.sellPrice) return;

    const finalCatId = (editForm.category_id && editForm.category_id !== '__general__')
      ? editForm.category_id
      : (categories.find((c) => c.name?.toLowerCase() === 'general')?._id || null);

    const finalBrandId = (editForm.brand_id && editForm.brand_id !== '__none__')
      ? editForm.brand_id
      : null;

    const finalSupplierId = (editForm.supplier_id && editForm.supplier_id !== '__none__')
      ? editForm.supplier_id
      : null;

    const selectedBrand = brands.find((b) => b._id === editForm.brand_id);

    const hasVars = Boolean(editForm.has_variants);
    const initialStock = hasVars
      ? editForm.variants.reduce((sum, v) => sum + (parseInt(v.stock_quantity, 10) || 0), 0)
      : (parseInt(editForm.stock, 10) || 0);

    const costPrice = parseFloat(editForm.buyPrice) || 0;
    const newTotalCost = hasVars
      ? editForm.variants.reduce((sum, v) => sum + (parseInt(v.stock_quantity, 10) || 0) * (parseFloat(v.cost_price) || costPrice), 0)
      : (initialStock * costPrice);

    const prevTotalCost = (editForm.initial_stock || 0) * (editForm.initial_buy_price || 0);
    const costDiff = newTotalCost - prevTotalCost;
    const alreadyPaid = Number(editForm.already_paid) || 0;

    let calculatedPaid = newTotalCost;
    if (finalSupplierId) {
      if (costDiff > 0) {
        // Stock / Cost was INCREASED: evaluate extra payment choices
        if (editForm.extra_payment_type === 'extra_full') {
          calculatedPaid = Math.min(newTotalCost, alreadyPaid + costDiff);
        } else if (editForm.extra_payment_type === 'extra_partial') {
          const extraVal = parseFloat(editForm.extra_paid_amount);
          const extraPaid = !isNaN(extraVal) ? Math.min(costDiff, Math.max(0, extraVal)) : Math.round(costDiff * 0.5);
          calculatedPaid = Math.min(newTotalCost, alreadyPaid + extraPaid);
        } else if (editForm.extra_payment_type === 'clear_all') {
          calculatedPaid = newTotalCost;
        } else if (editForm.extra_payment_type === 'extra_due') {
          calculatedPaid = Math.min(newTotalCost, alreadyPaid);
        } else {
          calculatedPaid = Math.min(newTotalCost, alreadyPaid);
        }
      } else {
        // Stock / Cost was UNCHANGED or REDUCED
        if (editForm.payment_type === 'due') {
          calculatedPaid = 0;
        } else if (editForm.payment_type === 'full' || editForm.payment_type === 'pay_full') {
          calculatedPaid = newTotalCost;
        } else if (editForm.payment_type === 'partial') {
          const val = parseFloat(editForm.paid_amount);
          calculatedPaid = !isNaN(val) ? Math.min(newTotalCost, Math.max(0, val)) : Math.min(newTotalCost, alreadyPaid);
        } else {
          calculatedPaid = Math.min(newTotalCost, alreadyPaid);
        }
      }
    } else {
      calculatedPaid = newTotalCost;
    }

    const formattedVariants = hasVars
      ? editForm.variants.map((v) => ({
          _id: v._id,
          name: v.name.trim(),
          attributes: v.attributes || [],
          sku: v.sku ? v.sku.trim() : undefined,
          barcode: v.barcode ? v.barcode.trim() : undefined,
          cost_price: parseFloat(v.cost_price) || costPrice,
          selling_price: parseFloat(v.selling_price) || parseFloat(editForm.sellPrice) || 0,
          stock_quantity: parseInt(v.stock_quantity, 10) || 0,
          low_stock_threshold: parseInt(v.low_stock_threshold, 10) || 5,
        }))
      : [];

    setIsSubmitting(true);
    try {
      await api.products.update(editForm.id, {
        name: editForm.name.trim(),
        image_url: editForm.image_url || '',
        images: editForm.image_url ? [editForm.image_url] : [],
        category_id: finalCatId,
        brand_id: finalBrandId,
        brand: selectedBrand?.name || '',
        supplier_id: finalSupplierId,
        sku: editForm.sku ? editForm.sku.trim() : undefined,
        barcode: editForm.barcode ? editForm.barcode.trim() : undefined,
        cost_price: costPrice,
        selling_price: parseFloat(editForm.sellPrice) || 0,
        stock_quantity: initialStock,
        has_variants: hasVars,
        variation_options: hasVars ? editForm.variation_options : [],
        variants: formattedVariants,
        paid_amount: calculatedPaid,
        payment_method: editForm.payment_method || 'cash',
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

        <div className="flex items-center gap-2.5 flex-wrap">
          <Button
            type="button"
            variant="outline"
            onClick={() => {
              setBarcodeModalProducts(productList);
              setIsBarcodeModalOpen(true);
            }}
            className="text-xs sm:text-sm h-10 px-3.5 gap-2 cursor-pointer border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 shadow-2xs hover:border-[#00df89]"
          >
            <Printer className="w-4 h-4 text-[#00df89]" />
            <span>{lang === 'bn' ? 'বারকোড লেবেল প্রিন্ট' : 'Print Barcode Labels'}</span>
          </Button>

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

          <div className="flex flex-wrap items-center gap-2.5">
            
            {/* Category Filter Dropdown */}
            <div className="w-56 sm:w-64 min-w-[200px]">
              <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                <SelectTrigger size="sm" className="bg-slate-50 dark:bg-[#09090b] w-full">
                  <SelectValue placeholder="All Categories" />
                </SelectTrigger>
                <SelectContent className="min-w-[220px]">
                  <SelectItem value="all">All Categories</SelectItem>
                  {uniqueCategories.map((cat, idx) => (
                    <SelectItem key={idx} value={cat}>{cat}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Sort Order Dropdown */}
            <div className="w-48 sm:w-52 min-w-[180px]">
              <Select value={sortBy} onValueChange={setSortBy}>
                <SelectTrigger size="sm" className="bg-slate-50 dark:bg-[#09090b] w-full">
                  <SelectValue placeholder="Sort By" />
                </SelectTrigger>
                <SelectContent className="min-w-[200px]">
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
            <div className="w-44 sm:w-48 min-w-[160px]">
              <Select value={stockStatusFilter} onValueChange={setStockStatusFilter}>
                <SelectTrigger size="sm" className="bg-slate-50 dark:bg-[#09090b] w-full">
                  <SelectValue placeholder="Stock Status" />
                </SelectTrigger>
                <SelectContent className="min-w-[180px]">
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
                {paginatedProducts.map((p) => (
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
                      <div className="flex items-center gap-2 flex-wrap">
                        <span>{p.name}</span>
                        {p.has_variants && Array.isArray(p.variants) && p.variants.length > 0 && (
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              setSelectedVariantProduct(p);
                            }}
                            className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-[#00df89]/15 text-[#00a86b] dark:text-[#00df89] border border-[#00df89]/30 hover:bg-[#00df89]/25 flex items-center gap-1 cursor-pointer transition-all"
                            title="Click to view all variations"
                          >
                            <Layers className="w-3 h-3" />
                            <span>{p.variants.length} {lang === 'bn' ? 'ভ্যারিয়েশন' : 'Variants'}</span>
                          </button>
                        )}
                      </div>
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
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          type="button"
                          onClick={() => {
                            setBarcodeModalProducts([p]);
                            setIsBarcodeModalOpen(true);
                          }}
                          className="w-8 h-8 rounded-lg bg-slate-100 dark:bg-zinc-800 hover:bg-slate-200 dark:hover:bg-zinc-700 text-slate-700 dark:text-zinc-300 flex items-center justify-center transition-colors cursor-pointer border border-slate-200/80 dark:border-zinc-700/80 shadow-2xs shrink-0"
                          title={lang === 'bn' ? 'বারকোড লেবেল প্রিন্ট করুন' : 'Print Barcode Label'}
                        >
                          <Barcode className="w-4 h-4" />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleOpenEdit(p)}
                          title={lang === 'bn' ? 'সম্পাদনা করুন' : 'Edit Product'}
                          className="w-8 h-8 rounded-lg bg-blue-50 dark:bg-blue-950/40 hover:bg-blue-100 dark:hover:bg-blue-900/60 text-blue-600 dark:text-blue-400 flex items-center justify-center transition-colors cursor-pointer border border-blue-500/20 shadow-2xs shrink-0"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setConfirmDeleteDialog({
                              isOpen: true,
                              productId: p.id,
                              productName: p.name,
                            });
                          }}
                          title={lang === 'bn' ? 'মুছে ফেলুন' : 'Delete Product'}
                          className="w-8 h-8 rounded-lg bg-rose-50 dark:bg-rose-950/40 hover:bg-rose-100 dark:hover:bg-rose-900/60 text-rose-600 dark:text-rose-400 flex items-center justify-center transition-colors cursor-pointer border border-rose-500/20 shadow-2xs shrink-0"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            {/* Pagination Controls */}
            <Pagination
              currentPage={currentPage}
              totalItems={filteredProducts.length}
              pageSize={pageSize}
              pageSizeOptions={[10, 20, 50, 100]}
              onPageChange={setCurrentPage}
              onPageSizeChange={setPageSize}
            />
          </div>
        )}
      </Card>

      {/* ---------------------------------------------------- */}
      {/* 1. ACTION CHOICE SELECTOR MODAL                      */}
      {/* ---------------------------------------------------- */}
      {isActionChoiceModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-md animate-in fade-in duration-150">
          <div className="max-w-[370px] w-full bg-white dark:bg-[#121215] border border-slate-200 dark:border-zinc-800/90 rounded-3xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-150 flex flex-col">
            {/* Header */}
            <div className="flex items-center justify-between px-6 pt-6 pb-4 border-b border-slate-100 dark:border-zinc-800/70">
              <div>
                <h2 className="text-base font-bold text-slate-900 dark:text-white tracking-tight">
                  {lang === 'bn' ? 'ইনভেন্টরি অ্যাকশন' : 'Inventory Actions'}
                </h2>
                <p className="text-xs text-slate-500 dark:text-zinc-400 mt-1">
                  {lang === 'bn' ? 'স্টক পরিচালনা বা নতুন পণ্য যুক্ত করুন' : 'Select an action to update stock or catalog'}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setIsActionChoiceModalOpen(false)}
                className="w-8 h-8 rounded-full flex items-center justify-center text-slate-400 hover:text-slate-700 dark:hover:text-zinc-200 hover:bg-slate-100 dark:hover:bg-zinc-800 transition-colors cursor-pointer shrink-0 ml-2"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Menu List */}
            <div className="p-3.5 space-y-2">
              {/* Option 1: Create New Product */}
              <button
                type="button"
                onClick={() => {
                  setIsActionChoiceModalOpen(false);
                  setIsAddModalOpen(true);
                }}
                className="w-full p-4 rounded-2xl bg-slate-50/70 dark:bg-zinc-900/40 border border-slate-200/60 dark:border-zinc-800/60 hover:border-[#00df89]/60 dark:hover:border-[#00df89]/60 hover:bg-slate-50 dark:hover:bg-zinc-800/60 hover:shadow-xs transition-all text-left flex items-start gap-3.5 group cursor-pointer"
              >
                <div className="w-10 h-10 rounded-xl bg-[#00df89]/10 text-[#00a86b] dark:text-[#00df89] border border-[#00df89]/20 flex items-center justify-center shrink-0 group-hover:scale-105 group-hover:bg-[#00df89] group-hover:text-[#011812] transition-all mt-0.5">
                  <PackagePlus className="w-5 h-5" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <span className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white group-hover:text-[#00a86b] dark:group-hover:text-[#00df89] transition-colors">
                      {lang === 'bn' ? 'নতুন পণ্য তৈরি' : 'Create New Product'}
                    </span>
                    <ChevronRight className="w-4 h-4 text-slate-400 group-hover:text-[#00df89] group-hover:translate-x-0.5 transition-all shrink-0 ml-1" />
                  </div>
                  <p className="text-[11px] text-slate-500 dark:text-zinc-400 mt-1 leading-relaxed">
                    {lang === 'bn' ? 'একক পণ্য বা কালার ও সাইজ ভ্যারিয়েশন সহ পণ্য যোগ করুন' : 'Add standalone item or multi-variant catalog product'}
                  </p>
                </div>
              </button>

              {/* Option 2: Restock Stock */}
              <button
                type="button"
                onClick={() => {
                  setIsActionChoiceModalOpen(false);
                  setIsRestockModalOpen(true);
                }}
                className="w-full p-4 rounded-2xl bg-slate-50/70 dark:bg-zinc-900/40 border border-slate-200/60 dark:border-zinc-800/60 hover:border-blue-500/60 dark:hover:border-blue-500/60 hover:bg-slate-50 dark:hover:bg-zinc-800/60 hover:shadow-xs transition-all text-left flex items-start gap-3.5 group cursor-pointer"
              >
                <div className="w-10 h-10 rounded-xl bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20 flex items-center justify-center shrink-0 group-hover:scale-105 group-hover:bg-blue-500 group-hover:text-white transition-all mt-0.5">
                  <Boxes className="w-5 h-5" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <span className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                      {lang === 'bn' ? 'স্টক রিস্টক / ক্রয়' : 'Restock / Purchase Stock'}
                    </span>
                    <ChevronRight className="w-4 h-4 text-slate-400 group-hover:text-blue-500 group-hover:translate-x-0.5 transition-all shrink-0 ml-1" />
                  </div>
                  <p className="text-[11px] text-slate-500 dark:text-zinc-400 mt-1 leading-relaxed">
                    {lang === 'bn' ? 'সাপ্লায়ার থেকে স্টক গ্রহণ ও ক্রয় খতিয়ানে যোগ করুন' : 'Receive batch from supplier and log purchase invoice'}
                  </p>
                </div>
              </button>

              {/* Option 3: Quick Edit */}
              <button
                type="button"
                onClick={() => {
                  setIsActionChoiceModalOpen(false);
                  setIsQuickEditPickerOpen(true);
                }}
                className="w-full p-4 rounded-2xl bg-slate-50/70 dark:bg-zinc-900/40 border border-slate-200/60 dark:border-zinc-800/60 hover:border-amber-500/60 dark:hover:border-amber-500/60 hover:bg-slate-50 dark:hover:bg-zinc-800/60 hover:shadow-xs transition-all text-left flex items-start gap-3.5 group cursor-pointer"
              >
                <div className="w-10 h-10 rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20 flex items-center justify-center shrink-0 group-hover:scale-105 group-hover:bg-amber-500 group-hover:text-white transition-all mt-0.5">
                  <SlidersHorizontal className="w-5 h-5" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <span className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white group-hover:text-amber-600 dark:group-hover:text-amber-400 transition-colors">
                      {lang === 'bn' ? 'পণ্যের বিবরণ এডিট' : 'Edit Existing Product'}
                    </span>
                    <ChevronRight className="w-4 h-4 text-slate-400 group-hover:text-amber-500 group-hover:translate-x-0.5 transition-all shrink-0 ml-1" />
                  </div>
                  <p className="text-[11px] text-slate-500 dark:text-zinc-400 mt-1 leading-relaxed">
                    {lang === 'bn' ? 'নাম, বিক্রয়মূল্য, বারকোড বা সতর্কতা লেভেল পরিবর্তন করুন' : 'Update prices, barcodes, categories or thresholds'}
                  </p>
                </div>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ---------------------------------------------------- */}
      {/* 2. ADD BRAND NEW PRODUCT MODAL                       */}
      {/* ---------------------------------------------------- */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/75 backdrop-blur-md animate-in fade-in duration-200">
          <div className="max-w-lg w-full max-h-[90vh] bg-white dark:bg-[#121215] border border-slate-200/90 dark:border-zinc-800 shadow-2xl rounded-3xl overflow-hidden flex flex-col animate-in zoom-in-95 duration-150">
            {/* Modal Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 dark:border-zinc-800/80 bg-slate-50/60 dark:bg-zinc-900/40 shrink-0">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-emerald-500/10 text-[#00a86b] dark:text-[#00df89] border border-emerald-500/20 flex items-center justify-center shrink-0 shadow-xs">
                  <PackagePlus className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-base font-bold text-slate-900 dark:text-white tracking-tight">
                    {lang === 'bn' ? 'নতুন পণ্য যুক্ত করুন' : 'Create New Product'}
                  </h2>
                  <p className="text-xs text-slate-500 dark:text-zinc-400">
                    {lang === 'bn' ? 'ক্যাটালগে পণ্যের বিবরণ ও স্টক সংরক্ষণ করুন' : 'Add product details, pricing & stock'}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsAddModalOpen(false)}
                className="w-8 h-8 rounded-xl flex items-center justify-center text-slate-400 hover:text-slate-700 dark:hover:text-zinc-200 hover:bg-slate-100 dark:hover:bg-zinc-800 transition-colors cursor-pointer"
              >
                <X className="w-4.5 h-4.5" />
              </button>
            </div>

            {/* Modal Body Form */}
            <form onSubmit={handleAddProduct} className="flex-1 overflow-y-auto custom-scrollbar p-6 space-y-4.5 text-sm">
              
              {/* Product Name */}
              <div>
                <label className="block font-bold text-[13px] mb-1.5 text-slate-800 dark:text-zinc-200">
                  {lang === 'bn' ? 'পণ্যের নাম *' : 'Product Name *'}
                </label>
                <input
                  type="text"
                  required
                  placeholder={productPlaceholder}
                  value={newProduct.name}
                  onChange={(e) => setNewProduct({ ...newProduct, name: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-[#09090b] border border-slate-200 dark:border-zinc-800 text-slate-900 dark:text-white font-medium outline-none focus:ring-2 focus:ring-[#00df89] text-sm placeholder:text-slate-400"
                />
              </div>

              {/* Category & Brand (Side by Side) */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                {/* Category */}
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="font-bold text-[13px] text-slate-800 dark:text-zinc-200">
                      {lang === 'bn' ? 'ক্যাটাগরি' : 'Category'}
                    </label>
                    <button
                      type="button"
                      onClick={() => {
                        setShowAddCatInline(!showAddCatInline);
                        setNewCatName('');
                      }}
                      className="text-xs font-bold text-[#00a86b] dark:text-[#00df89] hover:underline flex items-center gap-0.5 cursor-pointer"
                    >
                      <FolderPlus className="w-3 h-3" />
                      <span>{showAddCatInline ? (lang === 'bn' ? 'বাতিল' : 'Cancel') : (lang === 'bn' ? '+ নতুন' : '+ New')}</span>
                    </button>
                  </div>

                  {showAddCatInline ? (
                    <div className="flex items-center gap-1.5 p-1.5 rounded-xl bg-emerald-500/5 border border-emerald-500/20">
                      <input
                        type="text"
                        placeholder={categoryPlaceholder}
                        value={newCatName}
                        onChange={(e) => setNewCatName(e.target.value)}
                        className="flex-1 px-3 py-1.5 rounded-lg bg-white dark:bg-[#09090b] border border-slate-200 dark:border-zinc-800 outline-none text-sm focus:ring-1 focus:ring-[#00df89]"
                      />
                      <Button
                        type="button"
                        size="sm"
                        disabled={isCreatingCat || !newCatName.trim()}
                        onClick={() => handleCreateCategory(false)}
                        className="bg-[#00df89] hover:bg-[#00c97b] text-[#011812] font-bold text-xs h-7 px-2.5 cursor-pointer"
                      >
                        {isCreatingCat ? <Loader2 className="w-3 h-3 animate-spin" /> : (lang === 'bn' ? 'সেভ' : 'Save')}
                      </Button>
                    </div>
                  ) : (
                    <Select
                      value={newProduct.category_id || '__general__'}
                      onValueChange={(val) => {
                        if (val === '__add_new_cat__') {
                          setShowAddCatInline(true);
                        } else {
                          setNewProduct({ ...newProduct, category_id: val });
                        }
                      }}
                    >
                      <SelectTrigger className="w-full bg-slate-50 dark:bg-[#09090b] h-10 text-sm font-medium rounded-xl">
                        <SelectValue placeholder="General" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem
                          value="__add_new_cat__"
                          className="text-[#00a86b] dark:text-[#00df89] font-bold border-b border-slate-100 dark:border-zinc-800/80 mb-1"
                        >
                          + {lang === 'bn' ? 'নতুন ক্যাটাগরি তৈরি...' : 'Add New Category...'}
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

                {/* Brand */}
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="font-bold text-[13px] text-slate-800 dark:text-zinc-200">
                      {lang === 'bn' ? 'ব্র্যান্ড' : 'Brand'}
                    </label>
                    <button
                      type="button"
                      onClick={() => {
                        setShowAddBrandInline(!showAddBrandInline);
                        setNewBrandName('');
                      }}
                      className="text-xs font-bold text-[#00a86b] dark:text-[#00df89] hover:underline flex items-center gap-0.5 cursor-pointer"
                    >
                      <Tag className="w-3 h-3" />
                      <span>{showAddBrandInline ? (lang === 'bn' ? 'বাতিল' : 'Cancel') : (lang === 'bn' ? '+ নতুন' : '+ New')}</span>
                    </button>
                  </div>

                  {showAddBrandInline ? (
                    <div className="flex items-center gap-1.5 p-1.5 rounded-xl bg-emerald-500/5 border border-emerald-500/20">
                      <input
                        type="text"
                        placeholder={lang === 'bn' ? 'ব্র্যান্ডের নাম...' : 'Brand name...'}
                        value={newBrandName}
                        onChange={(e) => setNewBrandName(e.target.value)}
                        className="flex-1 px-3 py-1.5 rounded-lg bg-white dark:bg-[#09090b] border border-slate-200 dark:border-zinc-800 outline-none text-sm focus:ring-1 focus:ring-[#00df89]"
                      />
                      <Button
                        type="button"
                        size="sm"
                        disabled={isCreatingBrand || !newBrandName.trim()}
                        onClick={() => handleCreateBrand(false)}
                        className="bg-[#00df89] hover:bg-[#00c97b] text-[#011812] font-bold text-xs h-7 px-2.5 cursor-pointer"
                      >
                        {isCreatingBrand ? <Loader2 className="w-3 h-3 animate-spin" /> : (lang === 'bn' ? 'সেভ' : 'Save')}
                      </Button>
                    </div>
                  ) : (
                    <Select
                      value={newProduct.brand_id || '__none__'}
                      onValueChange={(val) => {
                        if (val === '__add_new_brand__') {
                          setShowAddBrandInline(true);
                        } else {
                          setNewProduct({ ...newProduct, brand_id: val === '__none__' ? '' : val });
                        }
                      }}
                    >
                      <SelectTrigger className="w-full bg-slate-50 dark:bg-[#09090b] h-10 text-sm font-medium rounded-xl">
                        <SelectValue placeholder="Brand" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem
                          value="__add_new_brand__"
                          className="text-[#00a86b] dark:text-[#00df89] font-bold border-b border-slate-100 dark:border-zinc-800/80 mb-1"
                        >
                          + {lang === 'bn' ? 'নতুন ব্র্যান্ড তৈরি...' : 'Add New Brand...'}
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
              </div>

              {/* Supplier */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="font-bold text-[13px] text-slate-800 dark:text-zinc-200">
                    {lang === 'bn' ? 'সাপ্লায়ার (সরবরাহকারী)' : 'Supplier (Vendor)'}
                  </label>
                  <button
                    type="button"
                    onClick={() => {
                      setShowAddSuppInline(!showAddSuppInline);
                      setNewSuppData({ name: '', phone: '', company_name: '', address: '' });
                    }}
                    className="text-xs font-bold text-[#00a86b] dark:text-[#00df89] hover:underline flex items-center gap-0.5 cursor-pointer"
                  >
                    <Building2 className="w-3 h-3" />
                    <span>{showAddSuppInline ? (lang === 'bn' ? 'বাতিল' : 'Cancel') : (lang === 'bn' ? '+ নতুন সাপ্লায়ার' : '+ New Supplier')}</span>
                  </button>
                </div>

                {showAddSuppInline ? (
                  <div className="p-3 rounded-2xl bg-emerald-500/5 border border-emerald-500/20 space-y-2">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      <input
                        type="text"
                        placeholder={lang === 'bn' ? 'সাপ্লায়ার নাম *' : 'Supplier Name *'}
                        value={newSuppData.name}
                        onChange={(e) => setNewSuppData({ ...newSuppData, name: e.target.value })}
                        className="px-3 py-1.5 rounded-lg bg-white dark:bg-[#09090b] border border-slate-200 dark:border-zinc-800 outline-none text-sm"
                      />
                      <input
                        type="text"
                        placeholder={lang === 'bn' ? 'ফোন নম্বর' : 'Phone'}
                        value={newSuppData.phone}
                        onChange={(e) => setNewSuppData({ ...newSuppData, phone: e.target.value })}
                        className="px-3 py-1.5 rounded-lg bg-white dark:bg-[#09090b] border border-slate-200 dark:border-zinc-800 outline-none text-sm"
                      />
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      <input
                        type="text"
                        placeholder={lang === 'bn' ? 'প্রতিষ্ঠান / কোম্পানি' : 'Company'}
                        value={newSuppData.company_name}
                        onChange={(e) => setNewSuppData({ ...newSuppData, company_name: e.target.value })}
                        className="px-3 py-1.5 rounded-lg bg-white dark:bg-[#09090b] border border-slate-200 dark:border-zinc-800 outline-none text-sm"
                      />
                      <input
                        type="text"
                        placeholder={lang === 'bn' ? 'ঠিকানা' : 'Address'}
                        value={newSuppData.address}
                        onChange={(e) => setNewSuppData({ ...newSuppData, address: e.target.value })}
                        className="px-3 py-1.5 rounded-lg bg-white dark:bg-[#09090b] border border-slate-200 dark:border-zinc-800 outline-none text-sm"
                      />
                    </div>
                    <div className="flex justify-end">
                      <Button
                        type="button"
                        size="sm"
                        disabled={isCreatingSupp || !newSuppData.name.trim()}
                        onClick={() => handleCreateSupplier(false)}
                        className="bg-[#00df89] hover:bg-[#00c97b] text-[#011812] font-bold text-xs h-7 px-3 cursor-pointer"
                      >
                        {isCreatingSupp ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : (lang === 'bn' ? 'সেভ ও নির্বাচন' : 'Save & Select')}
                      </Button>
                    </div>
                  </div>
                ) : (
                  <Select
                    value={newProduct.supplier_id || '__none__'}
                    onValueChange={(val) => setNewProduct({ ...newProduct, supplier_id: val === '__none__' ? '' : val })}
                  >
                    <SelectTrigger className="w-full bg-slate-50 dark:bg-[#09090b] h-10 text-sm font-medium rounded-xl">
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

              {/* Pricing & Margins (Grid 2 Cols) */}
              <div className="grid grid-cols-2 gap-3.5">
                <div>
                  <label className="block font-bold mb-1.5 text-slate-800 dark:text-zinc-200 text-[13px]">
                    {lang === 'bn' ? 'ক্রয়মূল্য (৳)' : 'Cost Price (৳)'}
                  </label>
                  <input
                    type="number"
                    placeholder="0"
                    value={newProduct.buyPrice}
                    onChange={(e) => handleNewProductBuyPriceChange(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-[#09090b] border border-slate-200 dark:border-zinc-800 outline-none text-sm font-semibold focus:ring-1 focus:ring-[#00df89]"
                  />
                </div>
                <div>
                  <label className="block font-bold mb-1.5 text-slate-900 dark:text-white text-[13px]">
                    {lang === 'bn' ? 'বিক্রয়মূল্য (৳) *' : 'Selling Price (৳) *'}
                  </label>
                  <input
                    type="number"
                    required
                    placeholder="0"
                    value={newProduct.sellPrice}
                    onChange={(e) => handleNewProductSellPriceChange(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-[#09090b] border border-emerald-500/50 dark:border-[#00df89]/50 outline-none text-sm font-bold text-emerald-600 dark:text-[#00df89] focus:ring-2 focus:ring-[#00df89]"
                  />
                </div>
              </div>

              {/* Barcode & SKU (Grid 2 Cols) */}
              <div className="grid grid-cols-2 gap-3.5">
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="font-bold text-slate-800 dark:text-zinc-200 text-[13px]">
                      {lang === 'bn' ? 'বারকোড *' : 'Barcode *'}
                    </label>
                    <button
                      type="button"
                      onClick={() => setNewProduct({ ...newProduct, barcode: generateUniqueBarcode('20') })}
                      className="text-xs font-bold text-[#00a86b] dark:text-[#00df89] hover:underline flex items-center gap-0.5 cursor-pointer"
                    >
                      <Sparkles className="w-3 h-3" />
                      <span>{lang === 'bn' ? 'অটো' : 'Auto'}</span>
                    </button>
                  </div>
                  <input
                    type="text"
                    placeholder="Barcode"
                    value={newProduct.barcode}
                    onChange={(e) => setNewProduct({ ...newProduct, barcode: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-[#09090b] border border-slate-200 dark:border-zinc-800 outline-none text-sm font-semibold focus:ring-1 focus:ring-[#00df89]"
                  />
                </div>
                <div>
                  <label className="block font-bold mb-1.5 text-slate-800 dark:text-zinc-200 text-[13px]">
                    {lang === 'bn' ? 'SKU কোড (ঐচ্ছিক)' : 'SKU (Optional)'}
                  </label>
                  <input
                    type="text"
                    placeholder="Auto-generated"
                    value={newProduct.sku}
                    onChange={(e) => setNewProduct({ ...newProduct, sku: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-[#09090b] border border-slate-200 dark:border-zinc-800 outline-none text-sm font-semibold focus:ring-1 focus:ring-[#00df89]"
                  />
                </div>
              </div>

              {/* Product Stock, Alert & Unit (Grid 3 Cols - Always Visible) */}
              <div className="grid grid-cols-3 gap-3 p-3.5 rounded-2xl bg-slate-50/70 dark:bg-zinc-900/40 border border-slate-200/70 dark:border-zinc-800/70">
                <div>
                  <label className="block font-semibold mb-1 text-slate-600 dark:text-zinc-400 text-xs">
                    {lang === 'bn' ? 'প্রাথমিক স্টক' : 'Initial Stock'}
                  </label>
                  <input
                    type="number"
                    placeholder="0"
                    value={newProduct.stock}
                    onChange={(e) => handleNewProductStockChange(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-white dark:bg-[#09090b] border border-slate-200 dark:border-zinc-800 outline-none text-sm font-bold text-slate-900 dark:text-white"
                  />
                </div>
                <div>
                  <label className="block font-semibold mb-1 text-slate-600 dark:text-zinc-400 text-xs">
                    {lang === 'bn' ? 'সতর্কতা লেভেল' : 'Min Alert'}
                  </label>
                  <input
                    type="number"
                    placeholder="5"
                    value={newProduct.lowStockThreshold}
                    onChange={(e) => handleNewProductLowStockChange(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-white dark:bg-[#09090b] border border-slate-200 dark:border-zinc-800 outline-none text-sm font-semibold text-slate-900 dark:text-white"
                  />
                </div>
                <div>
                  <label className="block font-semibold mb-1 text-slate-600 dark:text-zinc-400 text-xs">
                    {lang === 'bn' ? 'একক' : 'Unit'}
                  </label>
                  <input
                    type="text"
                    placeholder="Pcs"
                    value={newProduct.unit}
                    onChange={(e) => setNewProduct({ ...newProduct, unit: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-white dark:bg-[#09090b] border border-slate-200 dark:border-zinc-800 outline-none text-sm font-medium text-slate-900 dark:text-white"
                  />
                </div>
              </div>

              {/* Product Photo via ImgBB */}
              <ProductImageUploader
                value={newProduct.image_url}
                onChange={(url) => setNewProduct({ ...newProduct, image_url: url })}
                label={lang === 'bn' ? 'পণ্যের ছবি (ImgBB হোস্টিং)' : 'Product Photo (Hosted via ImgBB)'}
              />

              {/* VARIATIONS SECTION */}
              <div className="pt-2 border-t border-slate-100 dark:border-zinc-800/80 space-y-3.5">
                {/* Toggle Banner */}
                <div className="flex items-center justify-between p-3.5 rounded-2xl bg-slate-50/70 dark:bg-zinc-900/40 border border-slate-200/80 dark:border-zinc-800/80">
                  <div className="flex items-center gap-3">
                    <div className={`w-9 h-9 rounded-xl flex items-center justify-center transition-all ${
                      newProduct.has_variants
                        ? 'bg-[#00df89] text-[#011812] shadow-xs'
                        : 'bg-slate-200/80 dark:bg-zinc-800 text-slate-500'
                    }`}>
                      <Layers className="w-5 h-5" />
                    </div>
                    <div>
                      <span className="font-bold text-sm text-slate-900 dark:text-zinc-100 block">
                        {lang === 'bn' ? 'পণ্যের ভ্যারিয়েশন (রং, সাইজ ইত্যাদি)' : 'Product Variations'}
                      </span>
                      <span className="text-xs text-slate-500 dark:text-zinc-400 block mt-0.5">
                        {lang === 'bn' ? 'আলাদা সাইজ, কালার বা বৈশিষ্ট্যের স্টক' : 'Multi-variant sizes, colors or types'}
                      </span>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => {
                      const nextVal = !newProduct.has_variants;
                      setNewProduct(prev => ({
                        ...prev,
                        has_variants: nextVal,
                      }));
                    }}
                    className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out ${
                      newProduct.has_variants ? 'bg-[#00df89]' : 'bg-slate-300 dark:bg-zinc-700'
                    }`}
                  >
                    <span
                      className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-xs transition duration-200 ease-in-out ${
                        newProduct.has_variants ? 'translate-x-5 bg-[#011812]' : 'translate-x-0'
                      }`}
                    />
                  </button>
                </div>

                {/* If Variations Enabled */}
                {newProduct.has_variants && (
                  <div className="space-y-3 pt-1 animate-in fade-in duration-150">
                    {/* Step 1: Attribute & Option Builder */}
                    <div className="p-3.5 rounded-2xl bg-white dark:bg-[#09090b] border border-slate-200 dark:border-zinc-800 space-y-3">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-1.5">
                          <Sliders className="w-4 h-4 text-[#00df89]" />
                          <span className="font-bold text-xs text-slate-800 dark:text-zinc-200">
                            {lang === 'bn' ? 'বৈশিষ্ট্য ও অপশনসমূহ:' : 'Attributes & Option Values:'}
                          </span>
                        </div>
                        <button
                          type="button"
                          onClick={() => handleAddNewProductAttrGroup()}
                          className="text-xs font-bold text-[#00a86b] dark:text-[#00df89] hover:underline flex items-center gap-0.5 cursor-pointer"
                        >
                          <Plus className="w-3 h-3" />
                          <span>{lang === 'bn' ? '+ বৈশিষ্ট্য যোগ' : '+ Add Attribute'}</span>
                        </button>
                      </div>

                      {/* Quick Preset Buttons */}
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span className="text-xs text-slate-400 font-semibold">Presets:</span>
                        {attributePresets.map((preset) => (
                          <button
                            key={preset.name}
                            type="button"
                            onClick={() => handleAddNewProductAttrGroup(preset)}
                            className="px-2.5 py-1 rounded-xl text-xs font-semibold bg-slate-100 dark:bg-zinc-800/80 hover:bg-[#00df89]/15 hover:text-[#00a86b] dark:hover:text-[#00df89] text-slate-700 dark:text-zinc-300 border border-slate-200/60 dark:border-zinc-700/60 transition-colors cursor-pointer"
                          >
                            + {preset.name}
                          </button>
                        ))}
                      </div>

                      {/* Empty State vs Attribute Item Inputs */}
                      {(newProduct.variation_options || []).length === 0 ? (
                        <div className="py-4 px-3 text-center border border-dashed border-slate-200 dark:border-zinc-800 rounded-2xl space-y-1 bg-slate-50/50 dark:bg-zinc-900/30">
                          <p className="text-xs text-slate-500 dark:text-zinc-400">
                            {lang === 'bn' ? 'কোনো বৈশিষ্ট্য যোগ করা হয়নি। উপরের প্রিসেট বা বাটনে চাপুন।' : 'No attributes added yet. Click a preset or Add Attribute.'}
                          </p>
                        </div>
                      ) : (
                        <div className="space-y-2.5">
                          {newProduct.variation_options.map((opt, optIdx) => (
                            <div
                              key={optIdx}
                              ref={optIdx === newProduct.variation_options.length - 1 ? newAttrEndRef : null}
                              className="p-3 rounded-2xl bg-slate-50 dark:bg-zinc-900/60 border border-slate-200/70 dark:border-zinc-800 space-y-2 text-sm"
                            >
                              <div className="flex items-center justify-between gap-2">
                                <input
                                  type="text"
                                  placeholder={lang === 'bn' ? 'বৈশিষ্ট্যের নাম (যেমন: Size)' : 'Attribute Name (e.g. Size, Color)'}
                                  value={opt.name}
                                  onChange={(e) => {
                                    const updated = [...(newProduct.variation_options || [])];
                                    updated[optIdx] = { ...updated[optIdx], name: e.target.value };
                                    setNewProduct({ ...newProduct, variation_options: updated });
                                  }}
                                  className="px-3 py-1.5 rounded-xl bg-white dark:bg-[#09090b] border border-slate-200 dark:border-zinc-800 text-sm font-bold w-48 outline-none focus:ring-1 focus:ring-[#00df89]"
                                />
                                <button
                                  type="button"
                                  onClick={() => handleRemoveNewProductAttrGroup(optIdx)}
                                  className="p-1.5 text-slate-400 hover:text-rose-500 rounded-lg cursor-pointer"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </button>
                              </div>

                              {/* Tags Input */}
                              <div className="space-y-2">
                                {opt.values.length > 0 && (
                                  <div className="flex flex-wrap items-center gap-1.5 min-h-6">
                                    {opt.values.map((val, valIdx) => (
                                      <span
                                        key={valIdx}
                                        className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-bold bg-[#00df89]/15 text-[#00a86b] dark:text-[#00df89] border border-[#00df89]/30 uppercase"
                                      >
                                        {val}
                                        <button
                                          type="button"
                                          onClick={() => handleRemoveNewProductOptionValue(optIdx, valIdx)}
                                          className="hover:text-rose-500 cursor-pointer ml-0.5"
                                        >
                                          <X className="w-3 h-3" />
                                        </button>
                                      </span>
                                    ))}
                                  </div>
                                )}
                                <input
                                  type="text"
                                  placeholder={lang === 'bn' ? 'মান লিখে Enter চাপুন (যেমন: RED, BLUE, L)...' : 'Type value and press Enter...'}
                                  onKeyDown={(e) => {
                                    if (e.key === 'Enter' || e.key === ',') {
                                      e.preventDefault();
                                      handleAddNewProductOptionValue(optIdx, e.currentTarget.value);
                                      e.currentTarget.value = '';
                                    }
                                  }}
                                  className="w-full px-3 py-2 rounded-xl bg-white dark:bg-[#09090b] border border-slate-200 dark:border-zinc-800 text-sm uppercase placeholder:normal-case outline-none focus:ring-1 focus:ring-[#00df89]"
                                />
                              </div>
                            </div>
                          ))}
                          <div ref={newAttrEndRef} className="h-0" />
                        </div>
                      )}

                      {(newProduct.variation_options || []).length > 0 && (
                        <Button
                          type="button"
                          onClick={generateNewProductCombinations}
                          className="w-full bg-[#00df89] hover:bg-[#00c97b] text-[#011812] text-sm font-bold py-2 h-10 rounded-xl cursor-pointer shadow-xs gap-2"
                        >
                          <Boxes className="w-4 h-4" />
                          <span>{lang === 'bn' ? 'ভ্যারিয়েশন কম্বিনেশন তৈরি করুন' : 'Generate Variants Matrix'}</span>
                        </Button>
                      )}
                    </div>

                    {/* Step 2: Variants Matrix List */}
                    {(newProduct.variants || []).length > 0 && (
                      <div className="space-y-2.5">
                        {/* Variants List Items */}
                        <div className="space-y-2 max-h-60 overflow-y-auto custom-scrollbar pr-1">
                          {newProduct.variants.map((v, vIdx) => (
                            <div key={v.id || vIdx} className="p-3 rounded-2xl bg-white dark:bg-[#09090b] border border-slate-200 dark:border-zinc-800 space-y-2 text-sm shadow-2xs">
                              {/* Row 1: Variant Title, SKU, Barcode, Delete */}
                              <div className="flex items-center justify-between gap-2">
                                <span className="font-bold text-slate-900 dark:text-zinc-100 text-sm truncate max-w-[140px]">
                                  {v.name}
                                </span>
                                
                                <div className="flex items-center gap-1.5">
                                  <div className="flex items-center px-2 py-1 rounded-lg bg-slate-50 dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800">
                                    <input
                                      type="text"
                                      placeholder="Barcode"
                                      value={v.barcode || ''}
                                      onChange={(e) => handleUpdateNewProductVariant(vIdx, 'barcode', e.target.value)}
                                      className="w-28 bg-transparent outline-none text-xs font-semibold"
                                    />
                                    <button
                                      type="button"
                                      onClick={() => handleUpdateNewProductVariant(vIdx, 'barcode', generateUniqueBarcode('21'))}
                                      title="Auto generate barcode"
                                      className="text-slate-400 hover:text-[#00df89] cursor-pointer ml-0.5"
                                    >
                                      <Sparkles className="w-3.5 h-3.5" />
                                    </button>
                                  </div>

                                  <button
                                    type="button"
                                    onClick={() => handleRemoveNewProductVariant(vIdx)}
                                    className="p-1.5 text-slate-400 hover:text-rose-500 rounded-lg cursor-pointer"
                                  >
                                    <Trash2 className="w-4 h-4" />
                                  </button>
                                </div>
                              </div>

                              {/* Row 2: Cost Price, Selling Price, Stock Qty */}
                              <div className="grid grid-cols-3 gap-2.5">
                                <div>
                                  <label className="text-xs font-semibold text-slate-500 dark:text-zinc-400 mb-0.5 block">Cost (৳)</label>
                                  <input
                                    type="number"
                                    value={v.cost_price}
                                    onChange={(e) => handleUpdateNewProductVariant(vIdx, 'cost_price', e.target.value)}
                                    className="w-full px-2.5 py-1.5 rounded-lg bg-slate-50 dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 text-xs font-semibold"
                                  />
                                </div>
                                <div>
                                  <label className="text-xs font-semibold text-slate-500 dark:text-zinc-400 mb-0.5 block">Selling (৳)</label>
                                  <input
                                    type="number"
                                    value={v.selling_price}
                                    onChange={(e) => handleUpdateNewProductVariant(vIdx, 'selling_price', e.target.value)}
                                    className="w-full px-2.5 py-1.5 rounded-lg bg-slate-50 dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 text-xs font-bold text-[#00a86b] dark:text-[#00df89]"
                                  />
                                </div>
                                <div>
                                  <label className="text-xs font-semibold text-slate-500 dark:text-zinc-400 mb-0.5 block">Stock (Qty)</label>
                                  <input
                                    type="number"
                                    value={v.stock_quantity}
                                    onChange={(e) => handleUpdateNewProductVariant(vIdx, 'stock_quantity', e.target.value)}
                                    className="w-full px-2.5 py-1.5 rounded-lg bg-slate-50 dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 text-xs font-bold"
                                  />
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>

                        {/* Combined stock summary */}
                        <div className="p-3 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-between text-sm font-bold">
                          <span className="text-slate-800 dark:text-zinc-200">
                            {lang === 'bn' ? 'মোট সামগ্রিক স্টক:' : 'Total Combined Stock:'}
                          </span>
                          <span className="text-emerald-600 dark:text-[#00df89]">
                            {newProduct.variants.reduce((sum, v) => sum + (parseInt(v.stock_quantity, 10) || 0), 0)} Pcs
                          </span>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* SUPPLIER PAYMENT SETTLEMENT (Only if supplier selected) */}
              {newProduct.supplier_id && (() => {
                const hasVars = Boolean(newProduct.has_variants);
                const curStock = hasVars
                  ? (newProduct.variants || []).reduce((sum, v) => sum + (parseInt(v.stock_quantity, 10) || 0), 0)
                  : (parseInt(newProduct.stock, 10) || 0);
                const curCost = parseFloat(newProduct.buyPrice) || 0;
                const totalCost = hasVars
                  ? (newProduct.variants || []).reduce((sum, v) => sum + (parseInt(v.stock_quantity, 10) || 0) * (parseFloat(v.cost_price) || curCost), 0)
                  : (curStock * curCost);

                return (
                  <div className="p-4 rounded-2xl bg-amber-500/5 dark:bg-zinc-900/70 border border-amber-500/20 dark:border-zinc-800 space-y-3.5 animate-in fade-in duration-200">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Wallet className="w-4 h-4 text-amber-500" />
                        <span className="font-bold text-slate-900 dark:text-zinc-100 text-sm">
                          {lang === 'bn' ? 'সাপ্লায়ার পেমেন্ট সেটেলমেন্ট' : 'Supplier Settlement'}
                        </span>
                      </div>
                      <span className="text-xs font-bold text-slate-700 dark:text-zinc-300">
                        {lang === 'bn' ? 'মোট বিল:' : 'Total Cost:'}{' '}
                        <span className="text-[#00a86b] dark:text-[#00df89] text-sm">
                          ৳{totalCost.toLocaleString()}
                        </span>
                      </span>
                    </div>

                    {/* Payment Type Tabs */}
                    <div className="space-y-1">
                      <div className="grid grid-cols-3 gap-2">
                        <button
                          type="button"
                          onClick={() =>
                            setNewProduct((prev) => ({
                              ...prev,
                              payment_type: 'full',
                              paid_amount: String(totalCost),
                            }))
                          }
                          className={`py-2 px-1 rounded-xl text-xs font-bold border flex flex-col items-center justify-center transition-all cursor-pointer ${
                            newProduct.payment_type === 'full'
                              ? 'bg-[#00df89]/15 text-[#00a86b] dark:text-[#00df89] border-[#00df89] shadow-xs'
                              : 'bg-white dark:bg-zinc-900 text-slate-600 dark:text-zinc-400 border-slate-200 dark:border-zinc-800'
                          }`}
                        >
                          <span>{lang === 'bn' ? 'সম্পূর্ণ পরিশোধ' : 'Full Paid'}</span>
                          <span className="text-[10px] font-normal opacity-80">(100%)</span>
                        </button>

                        <button
                          type="button"
                          onClick={() =>
                            setNewProduct((prev) => ({
                              ...prev,
                              payment_type: 'partial',
                              paid_amount: String(Math.round(totalCost * 0.5)),
                            }))
                          }
                          className={`py-2 px-1 rounded-xl text-xs font-bold border flex flex-col items-center justify-center transition-all cursor-pointer ${
                            newProduct.payment_type === 'partial'
                              ? 'bg-amber-500/15 text-amber-600 dark:text-amber-400 border-amber-500 shadow-xs'
                              : 'bg-white dark:bg-zinc-900 text-slate-600 dark:text-zinc-400 border-slate-200 dark:border-zinc-800'
                          }`}
                        >
                          <span>{lang === 'bn' ? 'আংশিক পরিশোধ' : 'Partial Paid'}</span>
                          <span className="text-[10px] font-normal opacity-80">(Partial)</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => setNewProduct((prev) => ({ ...prev, payment_type: 'due', paid_amount: '0' }))}
                          className={`py-2 px-1 rounded-xl text-xs font-bold border flex flex-col items-center justify-center transition-all cursor-pointer ${
                            newProduct.payment_type === 'due'
                              ? 'bg-red-500/15 text-red-600 dark:text-red-400 border-red-500 shadow-xs'
                              : 'bg-white dark:bg-zinc-900 text-slate-600 dark:text-zinc-400 border-slate-200 dark:border-zinc-800'
                          }`}
                        >
                          <span>{lang === 'bn' ? 'সম্পূর্ণ বাকি' : 'Full Due'}</span>
                          <span className="text-[10px] font-normal opacity-80">(0%)</span>
                        </button>
                      </div>
                    </div>

                    {/* Partial Input Box */}
                    {newProduct.payment_type === 'partial' && (
                      <div className="p-3 rounded-xl bg-white dark:bg-[#09090b] border border-amber-500/30 space-y-2">
                        <div className="flex items-center justify-between">
                          <label className="font-bold text-slate-700 dark:text-zinc-300 text-xs">
                            {lang === 'bn' ? 'পরিশোধিত অর্থ (৳):' : 'Amount Paid (৳):'}
                          </label>
                          <div className="flex items-center gap-1.5">
                            <button
                              type="button"
                              onClick={() => {
                                setNewProduct((prev) => ({ ...prev, payment_type: 'partial', paid_amount: String(Math.round(totalCost * 0.5)) }));
                              }}
                              className="px-2 py-0.5 rounded-lg bg-slate-100 dark:bg-zinc-800 text-xs font-bold text-slate-700 dark:text-zinc-300 cursor-pointer"
                            >
                              50%
                            </button>
                            <button
                              type="button"
                              onClick={() => {
                                setNewProduct((prev) => ({ ...prev, payment_type: 'partial', paid_amount: String(Math.round(totalCost * 0.25)) }));
                              }}
                              className="px-2 py-0.5 rounded-lg bg-slate-100 dark:bg-zinc-800 text-xs font-bold text-slate-700 dark:text-zinc-300 cursor-pointer"
                            >
                              25%
                            </button>
                          </div>
                        </div>
                        <input
                          type="number"
                          placeholder="0.00"
                          value={newProduct.paid_amount}
                          onChange={(e) => setNewProduct((prev) => ({ ...prev, payment_type: 'partial', paid_amount: e.target.value }))}
                          className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 text-sm font-bold text-slate-900 dark:text-white outline-none focus:ring-1 focus:ring-amber-500"
                        />
                        <div className="flex items-center justify-between text-xs">
                          <span className="text-slate-500">{lang === 'bn' ? 'সাপ্লায়ার বাকি থাকবে:' : 'Remaining Due:'}</span>
                          <span className="font-bold text-amber-600 dark:text-amber-400">
                            ৳{Math.max(0, totalCost - (parseFloat(newProduct.paid_amount) || 0)).toLocaleString()}
                          </span>
                        </div>
                      </div>
                    )}

                    {/* Due message */}
                    {newProduct.payment_type === 'due' && (
                      <div className="px-3.5 py-2 rounded-xl bg-red-500/5 border border-red-500/20 text-red-600 dark:text-red-400 text-xs flex items-center justify-between font-medium">
                        <span>{lang === 'bn' ? 'সম্পূর্ণ বিল বাকি রাখা হবে' : 'Full cost will be recorded as supplier due'}</span>
                        <span className="font-bold text-sm">
                          ৳{totalCost.toLocaleString()}
                        </span>
                      </div>
                    )}

                    {/* Payment Method Selector */}
                    {newProduct.payment_type !== 'due' && (
                      <div className="space-y-1.5">
                        <label className="font-bold text-slate-700 dark:text-zinc-300 text-xs">
                          {lang === 'bn' ? 'পেমেন্ট মাধ্যম' : 'Payment Method'}
                        </label>
                        <Select
                          value={newProduct.payment_method || 'cash'}
                          onValueChange={(val) => setNewProduct((prev) => ({ ...prev, payment_method: val }))}
                        >
                          <SelectTrigger className="w-full bg-white dark:bg-[#09090b] h-9 text-xs font-medium rounded-xl">
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
                );
              })()}

              {/* MODAL FOOTER BUTTONS */}
              <div className="flex items-center justify-between pt-4 border-t border-slate-100 dark:border-zinc-800 shrink-0">
                <span className="text-xs text-slate-400">
                  {lang === 'bn' ? '* চিহ্নিত ঘর আবশ্যক' : '* Required fields'}
                </span>
                <div className="flex items-center gap-2.5">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setIsAddModalOpen(false)}
                    className="h-10 px-4 rounded-xl cursor-pointer text-sm font-semibold"
                  >
                    {lang === 'bn' ? 'বাতিল' : 'Cancel'}
                  </Button>
                  <Button
                    type="submit"
                    disabled={isSubmitting}
                    className="bg-[#00df89] hover:bg-[#00c97b] text-[#011812] font-bold text-sm h-10 px-5 rounded-xl cursor-pointer shadow-xs gap-2"
                  >
                    {isSubmitting ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <>
                        <CheckCircle2 className="w-4 h-4" />
                        <span>{lang === 'bn' ? 'পণ্য সংরক্ষণ করুন' : 'Save Product'}</span>
                      </>
                    )}
                  </Button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ---------------------------------------------------- */}
      {/* 3. RESTOCK / PURCHASE STOCK FOR EXISTING PRODUCT     */}
      {/* ---------------------------------------------------- */}
      {isRestockModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs">
          <Card className="max-w-2xl w-full p-6 bg-white dark:bg-[#121215] border-slate-200 dark:border-zinc-800 shadow-2xl max-h-[90vh] flex flex-col">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-zinc-800 pb-3 shrink-0">
              <h2 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <ShoppingBag className="w-4 h-4 text-blue-500" />
                <span>{lang === 'bn' ? 'বিদ্যমান পণ্যে স্টক যোগ ও ক্রয়' : 'Restock / Purchase Stock'}</span>
              </h2>
              <button onClick={() => setIsRestockModalOpen(false)} className="text-slate-400 p-1 cursor-pointer">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleRestockSubmit} className="flex-1 overflow-y-auto custom-scrollbar pr-2 space-y-3.5 text-xs py-1">
              {/* Product Selector */}
              <div>
                <label className="block font-bold text-slate-700 dark:text-zinc-300 mb-1">
                  {lang === 'bn' ? 'পণ্য নির্বাচন করুন *' : 'Select Product *'}
                </label>
                <Select
                  value={restockForm.product_id || '__none__'}
                  onValueChange={(val) => {
                    const found = productList.find(p => p.id === val);
                    const firstVariant = found?.has_variants && found.variants?.[0] ? found.variants[0] : null;
                    const vItems = (found?.has_variants && Array.isArray(found.variants))
                      ? found.variants.map((v) => ({
                          variant_id: v._id || v.id,
                          variant_name: v.name,
                          current_stock: Number(v.stock_quantity) || 0,
                          quantity: 0,
                          unit_cost: Number(v.cost_price) || Number(found.buyPrice) || 0,
                          selling_price: Number(v.selling_price) || Number(found.sellPrice) || 0,
                        }))
                      : [];

                    setRestockForm({
                      ...restockForm,
                      product_id: val === '__none__' ? '' : val,
                      variant_id: firstVariant ? (firstVariant._id || firstVariant.id) : '',
                      variant_name: firstVariant ? firstVariant.name : '',
                      restock_mode: vItems.length > 0 ? 'matrix' : 'single',
                      variant_items: vItems,
                      unit_cost: firstVariant ? (firstVariant.cost_price || found.buyPrice) : (found ? found.buyPrice : 0),
                      selling_price: firstVariant ? (firstVariant.selling_price || found.sellPrice) : (found ? found.sellPrice : 0),
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
                        {p.name} {p.has_variants ? `(${p.variants?.length || 0} Variants)` : `(Stock: ${p.stock} ${p.unit})`} — ৳{p.sellPrice}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* VARIATION RESTOCK MATRIX / SELECTOR (if product has variants) */}
              {(() => {
                const sel = productList.find((p) => p.id === restockForm.product_id);
                if (!sel || !sel.has_variants || !Array.isArray(sel.variants) || sel.variants.length === 0) {
                  return null;
                }

                return (
                  <div className="p-3.5 rounded-2xl bg-emerald-500/5 border border-emerald-500/20 space-y-3 animate-in fade-in duration-150">
                    <div className="flex items-center justify-between flex-wrap gap-2">
                      <div className="flex items-center gap-1.5 font-bold text-slate-900 dark:text-white">
                        <Layers className="w-4 h-4 text-[#00df89]" />
                        <span>{lang === 'bn' ? 'ভ্যারিয়েশন স্টক ও ক্রয় ব্যবস্থাপনা' : 'Variation Restock Management'}</span>
                        <span className="px-2 py-0.5 rounded-full text-[10px] bg-emerald-500/10 text-emerald-700 dark:text-[#00df89] border border-emerald-500/20 font-mono">
                          {sel.variants.length} {lang === 'bn' ? 'টি প্রকারভেদ' : 'variants'}
                        </span>
                      </div>

                      {/* Mode Toggle */}
                      <div className="flex items-center bg-slate-200 dark:bg-zinc-800 p-0.5 rounded-lg text-[11px]">
                        <button
                          type="button"
                          onClick={() => setRestockForm((prev) => ({ ...prev, restock_mode: 'matrix' }))}
                          className={`px-2.5 py-1 rounded-md font-semibold transition-all cursor-pointer ${
                            restockForm.restock_mode === 'matrix'
                              ? 'bg-white dark:bg-zinc-900 text-[#00a86b] dark:text-[#00df89] shadow-xs'
                              : 'text-slate-600 dark:text-zinc-400'
                          }`}
                        >
                          {lang === 'bn' ? 'সকল ভ্যারিয়েশন টেবিল' : 'All Variants Table'}
                        </button>
                        <button
                          type="button"
                          onClick={() => setRestockForm((prev) => ({ ...prev, restock_mode: 'single' }))}
                          className={`px-2.5 py-1 rounded-md font-semibold transition-all cursor-pointer ${
                            restockForm.restock_mode === 'single'
                              ? 'bg-white dark:bg-zinc-900 text-[#00a86b] dark:text-[#00df89] shadow-xs'
                              : 'text-slate-600 dark:text-zinc-400'
                          }`}
                        >
                          {lang === 'bn' ? 'নির্দিষ্ট একটি ভ্যারিয়েশন' : 'Single Variant'}
                        </button>
                      </div>
                    </div>

                    {restockForm.restock_mode === 'matrix' ? (
                      <div className="space-y-2.5">
                        {/* Bulk Fast Fill Controls */}
                        <div className="p-2 rounded-xl bg-white dark:bg-[#09090b] border border-slate-200 dark:border-zinc-800 flex items-center justify-between flex-wrap gap-2">
                          <span className="text-[11px] font-bold text-slate-500 flex items-center gap-1">
                            <Sparkles className="w-3 h-3 text-[#00df89]" />
                            {lang === 'bn' ? 'একসাথে মান সেট করুন:' : 'Bulk Fast Fill:'}
                          </span>
                          <div className="flex items-center gap-2 flex-wrap">
                            <div className="flex items-center gap-1">
                              <input
                                type="number"
                                placeholder={lang === 'bn' ? 'সবার জন্য পরিমাণ' : 'Qty for all'}
                                value={restockBulkQty}
                                onChange={(e) => setRestockBulkQty(e.target.value)}
                                className="w-24 px-2 py-1 rounded-md border border-slate-200 dark:border-zinc-800 text-[11px] bg-slate-50 dark:bg-zinc-900 outline-none"
                              />
                              <Button
                                type="button"
                                size="sm"
                                variant="outline"
                                onClick={() => applyRestockBulkField('quantity', restockBulkQty)}
                                className="h-7 px-2 text-[10px] font-semibold cursor-pointer"
                              >
                                {lang === 'bn' ? 'সেট' : 'Set'}
                              </Button>
                            </div>
                            <div className="flex items-center gap-1">
                              <input
                                type="number"
                                placeholder={lang === 'bn' ? 'সবার ক্রয়মূল্য ৳' : 'Cost for all ৳'}
                                value={restockBulkCost}
                                onChange={(e) => setRestockBulkCost(e.target.value)}
                                className="w-24 px-2 py-1 rounded-md border border-slate-200 dark:border-zinc-800 text-[11px] bg-slate-50 dark:bg-zinc-900 outline-none"
                              />
                              <Button
                                type="button"
                                size="sm"
                                variant="outline"
                                onClick={() => applyRestockBulkField('unit_cost', restockBulkCost)}
                                className="h-7 px-2 text-[10px] font-semibold cursor-pointer"
                              >
                                {lang === 'bn' ? 'সেট' : 'Set'}
                              </Button>
                            </div>
                          </div>
                        </div>

                        {/* Variants Matrix Table */}
                        <div className="overflow-x-auto rounded-xl border border-slate-200 dark:border-zinc-800 bg-white dark:bg-[#09090b]">
                          <table className="w-full text-left text-xs">
                            <thead className="bg-slate-100 dark:bg-zinc-900/80 text-slate-600 dark:text-zinc-400 font-semibold border-b border-slate-200 dark:border-zinc-800 text-[11px]">
                              <tr>
                                <th className="p-2.5">{lang === 'bn' ? 'ভ্যারিয়েশন' : 'Variation'}</th>
                                <th className="p-2.5">{lang === 'bn' ? 'বর্তমান স্টক' : 'Current Stock'}</th>
                                <th className="p-2.5 w-28">{lang === 'bn' ? '+ নতুন পরিমাণ' : '+ Qty to Add'}</th>
                                <th className="p-2.5 w-28">{lang === 'bn' ? 'একক ক্রয়মূল্য (৳)' : 'Unit Cost (৳)'}</th>
                                <th className="p-2.5 w-28">{lang === 'bn' ? 'বিক্রয়মূল্য (৳)' : 'Sell Price (৳)'}</th>
                                <th className="p-2.5 text-right">{lang === 'bn' ? 'মোট (৳)' : 'Total (৳)'}</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100 dark:divide-zinc-800/80">
                              {restockForm.variant_items.map((vItem, vIdx) => {
                                const lineTotal = (Number(vItem.quantity) || 0) * (Number(vItem.unit_cost) || 0);
                                return (
                                  <tr key={vIdx} className="hover:bg-slate-50/80 dark:hover:bg-zinc-900/40 transition-colors">
                                    <td className="p-2.5 font-bold text-slate-900 dark:text-zinc-100">
                                      <div className="flex items-center gap-1.5">
                                        <span className="w-2 h-2 rounded-full bg-[#00df89]" />
                                        <span>{vItem.variant_name}</span>
                                      </div>
                                    </td>
                                    <td className="p-2.5">
                                      <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-slate-100 dark:bg-zinc-800 text-slate-600 dark:text-zinc-300">
                                        {vItem.current_stock} {sel.unit || 'pcs'}
                                      </span>
                                    </td>
                                    <td className="p-2">
                                      <input
                                        type="number"
                                        min="0"
                                        value={vItem.quantity}
                                        onChange={(e) => {
                                          const val = e.target.value;
                                          setRestockForm((prev) => ({
                                            ...prev,
                                            variant_items: prev.variant_items.map((it, i) =>
                                              i === vIdx ? { ...it, quantity: val === '' ? '' : Math.max(0, parseInt(val, 10) || 0) } : it
                                            ),
                                          }));
                                        }}
                                        className="w-full px-2 py-1 h-7 rounded-lg bg-emerald-50/50 dark:bg-emerald-950/20 border border-emerald-500/30 text-emerald-900 dark:text-emerald-300 font-bold outline-none text-xs text-center"
                                      />
                                    </td>
                                    <td className="p-2">
                                      <input
                                        type="number"
                                        min="0"
                                        step="any"
                                        value={vItem.unit_cost}
                                        onChange={(e) => {
                                          const val = e.target.value;
                                          setRestockForm((prev) => ({
                                            ...prev,
                                            variant_items: prev.variant_items.map((it, i) =>
                                              i === vIdx ? { ...it, unit_cost: val === '' ? '' : parseFloat(val) || 0 } : it
                                            ),
                                          }));
                                        }}
                                        className="w-full px-2 py-1 h-7 rounded-lg bg-slate-50 dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 outline-none text-xs"
                                      />
                                    </td>
                                    <td className="p-2">
                                      <input
                                        type="number"
                                        min="0"
                                        step="any"
                                        value={vItem.selling_price}
                                        onChange={(e) => {
                                          const val = e.target.value;
                                          setRestockForm((prev) => ({
                                            ...prev,
                                            variant_items: prev.variant_items.map((it, i) =>
                                              i === vIdx ? { ...it, selling_price: val === '' ? '' : parseFloat(val) || 0 } : it
                                            ),
                                          }));
                                        }}
                                        className="w-full px-2 py-1 h-7 rounded-lg bg-slate-50 dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 outline-none text-xs"
                                      />
                                    </td>
                                    <td className="p-2.5 text-right font-mono font-bold text-slate-900 dark:text-white">
                                      ৳{lineTotal.toLocaleString()}
                                    </td>
                                  </tr>
                                );
                              })}
                            </tbody>
                          </table>
                        </div>

                        {/* Add New Variant to this Product on the fly */}
                        <div className="pt-1">
                          {showAddNewVariantInRestock ? (
                            <div className="p-3 rounded-xl bg-white dark:bg-[#09090b] border border-emerald-500/30 space-y-2.5 animate-in fade-in duration-150">
                              <div className="font-bold text-xs text-slate-900 dark:text-white flex items-center justify-between">
                                <span>{lang === 'bn' ? '+ নতুন ভ্যারিয়েশন যোগ করুন' : '+ Add New Variation to Product'}</span>
                                <button
                                  type="button"
                                  onClick={() => setShowAddNewVariantInRestock(false)}
                                  className="text-slate-400 hover:text-slate-600"
                                >
                                  <X className="w-4 h-4" />
                                </button>
                              </div>
                              <div className="grid grid-cols-1 sm:grid-cols-4 gap-2">
                                <div>
                                  <label className="block text-[10px] text-slate-400 mb-0.5">{lang === 'bn' ? 'নাম / রং / সাইজ *' : 'Name / Color / Size *'}</label>
                                  <input
                                    type="text"
                                    placeholder="e.g. Yellow, XXL"
                                    value={newRestockVariantName}
                                    onChange={(e) => setNewRestockVariantName(e.target.value)}
                                    className="w-full px-2.5 py-1.5 rounded-lg bg-slate-50 dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 outline-none text-xs"
                                  />
                                </div>
                                <div>
                                  <label className="block text-[10px] text-slate-400 mb-0.5">{lang === 'bn' ? '+ রিস্টক পরিমাণ' : '+ Restock Qty'}</label>
                                  <input
                                    type="number"
                                    min="1"
                                    value={newRestockVariantQty}
                                    onChange={(e) => setNewRestockVariantQty(e.target.value)}
                                    className="w-full px-2.5 py-1.5 rounded-lg bg-slate-50 dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 outline-none text-xs"
                                  />
                                </div>
                                <div>
                                  <label className="block text-[10px] text-slate-400 mb-0.5">{lang === 'bn' ? 'ক্রয়মূল্য ৳' : 'Unit Cost ৳'}</label>
                                  <input
                                    type="number"
                                    placeholder={`৳${sel.buyPrice}`}
                                    value={newRestockVariantCost}
                                    onChange={(e) => setNewRestockVariantCost(e.target.value)}
                                    className="w-full px-2.5 py-1.5 rounded-lg bg-slate-50 dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 outline-none text-xs"
                                  />
                                </div>
                                <div>
                                  <label className="block text-[10px] text-slate-400 mb-0.5">{lang === 'bn' ? 'বিক্রয়মূল্য ৳' : 'Sell Price ৳'}</label>
                                  <input
                                    type="number"
                                    placeholder={`৳${sel.sellPrice}`}
                                    value={newRestockVariantSell}
                                    onChange={(e) => setNewRestockVariantSell(e.target.value)}
                                    className="w-full px-2.5 py-1.5 rounded-lg bg-slate-50 dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 outline-none text-xs"
                                  />
                                </div>
                              </div>
                              <div className="flex justify-end gap-2 pt-1">
                                <Button
                                  type="button"
                                  variant="outline"
                                  size="sm"
                                  onClick={() => setShowAddNewVariantInRestock(false)}
                                  className="h-7 text-xs"
                                >
                                  {lang === 'bn' ? 'বাতিল' : 'Cancel'}
                                </Button>
                                <Button
                                  type="button"
                                  size="sm"
                                  onClick={handleAddNewVariantToRestock}
                                  className="h-7 text-xs bg-[#00df89] hover:bg-[#00c97b] text-[#011812] font-semibold"
                                >
                                  {lang === 'bn' ? 'যোগ করুন' : 'Add to List'}
                                </Button>
                              </div>
                            </div>
                          ) : (
                            <button
                              type="button"
                              onClick={() => {
                                setShowAddNewVariantInRestock(true);
                                setNewRestockVariantCost(String(sel.buyPrice || ''));
                                setNewRestockVariantSell(String(sel.sellPrice || ''));
                              }}
                              className="text-xs font-semibold text-[#00a86b] dark:text-[#00df89] hover:underline flex items-center gap-1 cursor-pointer"
                            >
                              <Plus className="w-3.5 h-3.5" />
                              <span>{lang === 'bn' ? '+ এই পণ্যে নতুন একটি ভ্যারিয়েশন যোগ করে রিস্টক করুন' : '+ Add New Variation to this Product & Restock'}</span>
                            </button>
                          )}
                        </div>
                      </div>
                    ) : (
                      /* Single Variant Selector Mode */
                      <div className="space-y-3">
                        <div>
                          <label className="block font-bold text-slate-800 dark:text-zinc-200 mb-1">
                            {lang === 'bn' ? 'নির্দিষ্ট ভ্যারিয়েশন নির্বাচন করুন *' : 'Select Product Variation *'}
                          </label>
                          <Select
                            value={restockForm.variant_id || '__none__'}
                            onValueChange={(val) => {
                              const v = sel.variants.find((vr) => String(vr._id || vr.id) === String(val));
                              setRestockForm({
                                ...restockForm,
                                variant_id: val === '__none__' ? '' : val,
                                variant_name: v ? v.name : '',
                                unit_cost: v ? (v.cost_price || sel.buyPrice) : sel.buyPrice,
                                selling_price: v ? (v.selling_price || sel.sellPrice) : sel.sellPrice,
                              });
                            }}
                          >
                            <SelectTrigger className="w-full bg-white dark:bg-[#09090b]">
                              <SelectValue placeholder={lang === 'bn' ? 'ভ্যারিয়েশন নির্বাচন করুন...' : 'Select variation...'} />
                            </SelectTrigger>
                            <SelectContent>
                              {sel.variants.map((v) => (
                                <SelectItem key={v._id || v.id} value={v._id || v.id}>
                                  {v.name} (Stock: {v.stock_quantity || 0} {sel.unit}) — ৳{v.selling_price || sel.sellPrice}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>

                        {/* Single Variant Inputs */}
                        <div className="grid grid-cols-3 gap-3">
                          <div>
                            <label className="block font-bold text-slate-700 dark:text-zinc-300 mb-1">
                              {lang === 'bn' ? 'নতুন স্টক পরিমাণ *' : 'Qty to Add *'}
                            </label>
                            <input
                              type="number"
                              min="1"
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
                      </div>
                    )}
                  </div>
                );
              })()}

              {/* Standard inputs if selected product has NO variants */}
              {(() => {
                const sel = productList.find((p) => p.id === restockForm.product_id);
                if (sel && (!sel.has_variants || !Array.isArray(sel.variants) || sel.variants.length === 0)) {
                  return (
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
                  );
                }
                return null;
              })()}

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

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-100 dark:border-zinc-800 shrink-0">
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

            <div className="flex-1 overflow-y-auto custom-scrollbar space-y-2 pr-2 text-xs">
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
          <Card className="max-w-lg w-full p-6 bg-white dark:bg-[#121215] border-slate-200 dark:border-zinc-800 shadow-2xl max-h-[90vh] flex flex-col">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-zinc-800 pb-3 shrink-0">
              <h2 className="text-base font-bold text-slate-900 dark:text-white">Edit Product Details</h2>
              <button onClick={() => setIsEditModalOpen(false)} className="text-slate-400 p-1 cursor-pointer">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleUpdateProduct} className="flex-1 overflow-y-auto custom-scrollbar pr-2 space-y-3.5 text-xs py-1">
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
                    onValueChange={(val) => {
                      if (val === '__add_new_cat__') {
                        setShowEditCatInline(true);
                      } else {
                        setEditForm({ ...editForm, category_id: val });
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

              {/* Brand with Inline Creator */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block font-medium text-slate-700 dark:text-zinc-300">
                    {lang === 'bn' ? 'ব্র্যান্ড' : 'Brand'}
                  </label>
                  <button
                    type="button"
                    onClick={() => {
                      setShowEditBrandInline(!showEditBrandInline);
                      setNewBrandName('');
                    }}
                    className="text-[11px] font-semibold text-[#00a86b] dark:text-[#00df89] hover:underline flex items-center gap-1 cursor-pointer"
                  >
                    <Tag className="w-3 h-3" />
                    <span>{showEditBrandInline ? (lang === 'bn' ? 'তালিকা থেকে বেছে নিন' : 'Choose existing') : (lang === 'bn' ? '+ নতুন ব্র্যান্ড' : '+ Add New Brand')}</span>
                  </button>
                </div>

                {showEditBrandInline ? (
                  <div className="flex items-center gap-2 p-2 rounded-xl bg-emerald-500/5 border border-emerald-500/20">
                    <input
                      type="text"
                      placeholder={lang === 'bn' ? 'ব্র্যান্ডের নাম লিখুন...' : 'Enter brand name...'}
                      value={newBrandName}
                      onChange={(e) => setNewBrandName(e.target.value)}
                      className="flex-1 px-3 py-1.5 rounded-lg bg-white dark:bg-[#09090b] border border-slate-200 dark:border-zinc-800 outline-none text-xs focus:ring-1 focus:ring-[#00df89]"
                    />
                    <Button
                      type="button"
                      size="sm"
                      disabled={isCreatingBrand || !newBrandName.trim()}
                      onClick={() => handleCreateBrand(true)}
                      className="bg-[#00df89] hover:bg-[#00c97b] text-[#011812] font-semibold text-xs h-8 px-3 cursor-pointer"
                    >
                      {isCreatingBrand ? <Loader2 className="w-3 h-3 animate-spin" /> : (lang === 'bn' ? 'সেভ' : 'Save')}
                    </Button>
                  </div>
                ) : (
                  <Select
                    value={editForm.brand_id || '__none__'}
                    onValueChange={(val) => {
                      if (val === '__add_new_brand__') {
                        setShowEditBrandInline(true);
                      } else {
                        setEditForm({ ...editForm, brand_id: val === '__none__' ? '' : val });
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

              {/* Supplier with Inline Creator inside Edit Modal */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block font-medium text-slate-700 dark:text-zinc-300">
                    {lang === 'bn' ? 'সাপ্লায়ার (সরবরাহকারী)' : 'Supplier (Vendor)'}
                  </label>
                  <button
                    type="button"
                    onClick={() => {
                      setShowEditSuppInline(!showEditSuppInline);
                      setNewSuppData({ name: '', phone: '', company_name: '', address: '' });
                    }}
                    className="text-[11px] font-semibold text-[#00a86b] dark:text-[#00df89] hover:underline flex items-center gap-1 cursor-pointer"
                  >
                    <Building2 className="w-3 h-3" />
                    <span>{showEditSuppInline ? (lang === 'bn' ? 'তালিকা থেকে বেছে নিন' : 'Choose existing') : (lang === 'bn' ? '+ নতুন সাপ্লায়ার' : '+ Add New Supplier')}</span>
                  </button>
                </div>

                {showEditSuppInline ? (
                  <div className="p-3 rounded-2xl bg-emerald-500/5 border border-emerald-500/20 space-y-2">
                    <div className="grid grid-cols-2 gap-2">
                      <input
                        type="text"
                        placeholder={lang === 'bn' ? 'সাপ্লায়ারের নাম *' : 'Supplier Name *'}
                        value={newSuppData.name}
                        onChange={(e) => setNewSuppData({ ...newSuppData, name: e.target.value })}
                        className="px-3 py-1.5 rounded-lg bg-white dark:bg-[#09090b] border border-slate-200 dark:border-zinc-800 text-xs outline-none"
                      />
                      <input
                        type="text"
                        placeholder={lang === 'bn' ? 'ফোন নম্বর' : 'Phone Number'}
                        value={newSuppData.phone}
                        onChange={(e) => setNewSuppData({ ...newSuppData, phone: e.target.value })}
                        className="px-3 py-1.5 rounded-lg bg-white dark:bg-[#09090b] border border-slate-200 dark:border-zinc-800 text-xs outline-none"
                      />
                    </div>
                    <div className="flex justify-end">
                      <Button
                        type="button"
                        size="sm"
                        disabled={isCreatingSupp || !newSuppData.name.trim()}
                        onClick={() => handleCreateSupplier('edit')}
                        className="bg-[#00df89] hover:bg-[#00c97b] text-[#011812] font-semibold text-xs h-8 px-3 cursor-pointer"
                      >
                        {isCreatingSupp ? <Loader2 className="w-3 h-3 animate-spin" /> : (lang === 'bn' ? 'সেভ' : 'Save')}
                      </Button>
                    </div>
                  </div>
                ) : (
                  <Select
                    value={editForm.supplier_id || '__none__'}
                    onValueChange={(val) => setEditForm({ ...editForm, supplier_id: val === '__none__' ? '' : val })}
                  >
                    <SelectTrigger className="w-full bg-slate-50 dark:bg-[#09090b]">
                      <SelectValue placeholder={lang === 'bn' ? 'সাধারণ / কোনো নির্দিষ্ট নেই' : 'General / Walk-in Supplier'} />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="__none__">{lang === 'bn' ? 'সাধারণ / কোনো নির্দিষ্ট নেই' : 'General / Walk-in Supplier'}</SelectItem>
                      {suppliers.map((s) => (
                        <SelectItem key={s._id} value={s._id}>
                          {s.name} {s.company_name ? `(${s.company_name})` : ''}
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
                    onChange={(e) => handleEditProductBuyPriceChange(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-[#09090b] border border-slate-200 dark:border-zinc-800 outline-none"
                  />
                </div>
                <div>
                  <label className="block font-medium mb-1 text-slate-700 dark:text-zinc-300">Selling Price (৳) *</label>
                  <input
                    type="number"
                    required
                    value={editForm.sellPrice}
                    onChange={(e) => handleEditProductSellPriceChange(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-[#09090b] border border-slate-200 dark:border-zinc-800 outline-none focus:ring-2 focus:ring-[#00df89]"
                  />
                </div>
              </div>

              {/* Product Variations Toggle in Edit Modal */}
              <div className="p-3.5 rounded-2xl bg-gradient-to-r from-emerald-500/10 via-teal-500/5 to-transparent border border-emerald-500/30 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Layers className="w-4 h-4 text-[#00df89]" />
                    <div>
                      <h4 className="font-bold text-slate-900 dark:text-white text-xs">
                        {lang === 'bn' ? 'পণ্যের ভ্যারিয়েশন (রং, সাইজ ইত্যাদি)' : 'Product Variations'}
                      </h4>
                      <p className="text-[10px] text-slate-500">
                        {lang === 'bn' ? 'আলাদা রং বা সাইজ অনুযায়ী কাস্টম স্টক ও মূল্য' : 'Custom stock & prices per color/size'}
                      </p>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => {
                      const next = !editForm.has_variants;
                      let newVars = editForm.variants || [];
                      if (next && newVars.length === 0) {
                        newVars = [
                          {
                            name: 'Standard',
                            attributes: [],
                            sku: editForm.sku || `SKU-${Math.floor(1000 + Math.random() * 9000)}`,
                            cost_price: parseFloat(editForm.buyPrice) || 0,
                            selling_price: parseFloat(editForm.sellPrice) || 0,
                            stock_quantity: parseInt(editForm.stock, 10) || 0,
                            low_stock_threshold: parseInt(editForm.lowStockThreshold, 10) || 5,
                          }
                        ];
                      }
                      setEditForm({ ...editForm, has_variants: next, variants: newVars });
                    }}
                    className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out ${
                      editForm.has_variants ? 'bg-[#00df89]' : 'bg-slate-300 dark:bg-zinc-700'
                    }`}
                  >
                    <span
                      className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow-md ring-0 transition duration-200 ease-in-out ${
                        editForm.has_variants ? 'translate-x-4 bg-[#011812]' : 'translate-x-0'
                      }`}
                    />
                  </button>
                </div>

                {/* If Variations Enabled in Edit Modal */}
                {editForm.has_variants && (
                  <div className="space-y-2.5 pt-2 border-t border-slate-100 dark:border-zinc-800/80">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-[11px] text-slate-800 dark:text-zinc-200 flex items-center gap-1.5">
                        <Boxes className="w-3.5 h-3.5 text-[#00df89]" />
                        {lang === 'bn' ? `ভ্যারিয়েশনসমূহ (${editForm.variants.length} টি):` : `Variants List (${editForm.variants.length}):`}
                      </span>
                      <button
                        type="button"
                        onClick={() => {
                          const baseCost = parseFloat(editForm.buyPrice) || 0;
                          const baseSell = parseFloat(editForm.sellPrice) || 0;
                          const newVar = {
                            name: `Variant ${editForm.variants.length + 1}`,
                            attributes: [],
                            sku: `SKU-${Math.floor(1000 + Math.random() * 9000)}-V${editForm.variants.length + 1}`,
                            barcode: generateUniqueBarcode('21'),
                            cost_price: baseCost,
                            selling_price: baseSell,
                            stock_quantity: 0,
                            low_stock_threshold: 5,
                          };
                          setEditForm({ ...editForm, variants: [...editForm.variants, newVar] });
                        }}
                        className="text-[10px] font-bold text-[#00a86b] dark:text-[#00df89] hover:underline flex items-center gap-0.5 cursor-pointer"
                      >
                        <Plus className="w-2.5 h-2.5" />
                        {lang === 'bn' ? '+ নতুন ভ্যারিয়েশন' : '+ Add Variant'}
                      </button>
                    </div>

                    <div className="space-y-1.5 max-h-52 overflow-y-auto custom-scrollbar pr-1">
                      {editForm.variants.map((v, vIdx) => (
                        <div key={v._id || vIdx} className="p-2.5 rounded-xl bg-white dark:bg-[#09090b] border border-slate-200 dark:border-zinc-800 space-y-1.5 text-xs shadow-2xs">
                          <div className="flex items-center justify-between gap-1.5">
                            <input
                              type="text"
                              placeholder="Variant Name (e.g. Red / XL)"
                              value={v.name}
                              onChange={(e) => {
                                const updated = [...editForm.variants];
                                updated[vIdx] = { ...updated[vIdx], name: e.target.value };
                                setEditForm({ ...editForm, variants: updated });
                              }}
                              className="flex-1 px-2 py-1 rounded-lg bg-slate-50 dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 text-xs font-bold"
                            />
                            
                            <div className="flex items-center gap-1">
                              <div className="flex items-center px-1.5 py-0.5 rounded-md bg-slate-50 dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800">
                                <input
                                  type="text"
                                  placeholder="Barcode"
                                  value={v.barcode || ''}
                                  onChange={(e) => {
                                    const updated = [...editForm.variants];
                                    updated[vIdx] = { ...updated[vIdx], barcode: e.target.value };
                                    setEditForm({ ...editForm, variants: updated });
                                  }}
                                  className="w-24 bg-transparent outline-none font-mono text-[11px]"
                                />
                                <button
                                  type="button"
                                  onClick={() => {
                                    const updated = [...editForm.variants];
                                    updated[vIdx] = { ...updated[vIdx], barcode: generateUniqueBarcode('21') };
                                    setEditForm({ ...editForm, variants: updated });
                                  }}
                                  title="Auto generate barcode"
                                  className="text-slate-400 hover:text-[#00df89] cursor-pointer ml-0.5"
                                >
                                  <Sparkles className="w-3 h-3" />
                                </button>
                              </div>

                              <button
                                type="button"
                                onClick={() => {
                                  const updated = editForm.variants.filter((_, i) => i !== vIdx);
                                  setEditForm({ ...editForm, variants: updated });
                                }}
                                className="p-1 text-slate-400 hover:text-rose-500 rounded cursor-pointer"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </div>

                          <div className="grid grid-cols-3 gap-2">
                            <div>
                              <label className="text-[10px] text-slate-500 dark:text-zinc-400">Cost (৳)</label>
                              <input
                                type="number"
                                value={v.cost_price}
                                onChange={(e) => {
                                  const updated = [...editForm.variants];
                                  updated[vIdx] = { ...updated[vIdx], cost_price: e.target.value };
                                  setEditForm({ ...editForm, variants: updated });
                                }}
                                className="w-full px-2 py-1 rounded-lg bg-slate-50 dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 text-xs font-mono"
                              />
                            </div>
                            <div>
                              <label className="text-[10px] text-slate-500 dark:text-zinc-400">Selling (৳)</label>
                              <input
                                type="number"
                                value={v.selling_price}
                                onChange={(e) => {
                                  const updated = [...editForm.variants];
                                  updated[vIdx] = { ...updated[vIdx], selling_price: e.target.value };
                                  setEditForm({ ...editForm, variants: updated });
                                }}
                                className="w-full px-2 py-1 rounded-lg bg-slate-50 dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 text-xs font-mono font-bold text-[#00a86b] dark:text-[#00df89]"
                              />
                            </div>
                            <div>
                              <label className="text-[10px] text-slate-500 dark:text-zinc-400">Stock (Qty)</label>
                              <input
                                type="number"
                                value={v.stock_quantity}
                                onChange={(e) => {
                                  const updated = [...editForm.variants];
                                  updated[vIdx] = { ...updated[vIdx], stock_quantity: e.target.value };
                                  setEditForm({ ...editForm, variants: updated });
                                }}
                                className="w-full px-2 py-1 rounded-lg bg-slate-50 dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 text-xs font-mono font-bold"
                              />
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>

                    <div className="p-2.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-between text-xs font-bold">
                      <span className="text-slate-700 dark:text-zinc-300">
                        {lang === 'bn' ? 'মোট সামগ্রিক স্টক:' : 'Total Combined Stock:'}
                      </span>
                      <span className="text-emerald-600 dark:text-[#00df89]">
                        {editForm.variants.reduce((sum, v) => sum + (parseInt(v.stock_quantity, 10) || 0), 0)} Pcs
                      </span>
                    </div>
                  </div>
                )}
              </div>

              {/* Stock inputs - Always Visible */}
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block font-medium mb-1 text-slate-700 dark:text-zinc-300">Stock Quantity</label>
                  <input
                    type="number"
                    value={editForm.stock}
                    onChange={(e) => handleEditProductStockChange(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-[#09090b] border border-slate-200 dark:border-zinc-800 outline-none font-bold"
                  />
                </div>
                <div>
                  <label className="block font-medium mb-1 text-slate-700 dark:text-zinc-300">Low Stock Min</label>
                  <input
                    type="number"
                    value={editForm.lowStockThreshold}
                    onChange={(e) => handleEditProductLowStockChange(e.target.value)}
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

              {/* Supplier Stock Purchase Payment Section in Edit Modal */}
              {editForm.supplier_id && (() => {
                const hasVars = Boolean(editForm.has_variants);
                const curStock = hasVars
                  ? editForm.variants.reduce((sum, v) => sum + (parseInt(v.stock_quantity, 10) || 0), 0)
                  : (parseInt(editForm.stock, 10) || 0);
                const curCost = parseFloat(editForm.buyPrice) || 0;
                const newTotalCost = hasVars
                  ? editForm.variants.reduce((sum, v) => sum + (parseInt(v.stock_quantity, 10) || 0) * (parseFloat(v.cost_price) || curCost), 0)
                  : (curStock * curCost);
                const prevStock = editForm.initial_stock || 0;
                const prevCost = editForm.initial_buy_price || 0;
                const prevTotalCost = prevStock * prevCost;
                const stockDiff = curStock - prevStock;
                const costDiff = newTotalCost - prevTotalCost;
                const alreadyPaid = Number(editForm.already_paid) || 0;
                const prevDue = Math.max(0, prevTotalCost - alreadyPaid);
                const isOriginallyFullyPaid = prevTotalCost > 0 && alreadyPaid >= prevTotalCost;

                // Compute effective total paid & live remaining due
                let effectiveTotalPaid = alreadyPaid;
                let effectiveExtraPaid = 0;

                if (costDiff > 0) {
                  const extraType = editForm.extra_payment_type || 'extra_full';
                  if (extraType === 'extra_full') {
                    effectiveExtraPaid = costDiff;
                    effectiveTotalPaid = Math.min(newTotalCost, alreadyPaid + costDiff);
                  } else if (extraType === 'extra_partial') {
                    const parsedExtra = parseFloat(editForm.extra_paid_amount);
                    effectiveExtraPaid = !isNaN(parsedExtra)
                      ? Math.min(costDiff, Math.max(0, parsedExtra))
                      : Math.round(costDiff * 0.5);
                    effectiveTotalPaid = Math.min(newTotalCost, alreadyPaid + effectiveExtraPaid);
                  } else if (extraType === 'clear_all') {
                    effectiveExtraPaid = costDiff;
                    effectiveTotalPaid = newTotalCost;
                  } else {
                    // extra_due
                    effectiveExtraPaid = 0;
                    effectiveTotalPaid = Math.min(newTotalCost, alreadyPaid);
                  }
                } else if (costDiff < 0) {
                  // Stock / Cost was REDUCED
                  if (editForm.payment_type === 'due') {
                    effectiveTotalPaid = 0;
                  } else if (editForm.payment_type === 'full' || editForm.payment_type === 'pay_full') {
                    effectiveTotalPaid = newTotalCost;
                  } else if (editForm.payment_type === 'partial') {
                    const parsed = parseFloat(editForm.paid_amount);
                    effectiveTotalPaid = !isNaN(parsed)
                      ? Math.min(newTotalCost, Math.max(0, parsed))
                      : Math.min(newTotalCost, alreadyPaid);
                  } else {
                    // keep_existing: capped at newTotalCost
                    effectiveTotalPaid = Math.min(newTotalCost, alreadyPaid);
                  }
                } else {
                  // Stock / Cost was UNCHANGED
                  if (editForm.payment_type === 'due') {
                    effectiveTotalPaid = 0;
                  } else if (editForm.payment_type === 'full' || editForm.payment_type === 'pay_full') {
                    effectiveTotalPaid = newTotalCost;
                  } else if (editForm.payment_type === 'partial') {
                    const parsed = parseFloat(editForm.paid_amount);
                    effectiveTotalPaid = !isNaN(parsed)
                      ? Math.min(newTotalCost, Math.max(0, parsed))
                      : Math.min(newTotalCost, alreadyPaid);
                  } else {
                    effectiveTotalPaid = Math.min(newTotalCost, alreadyPaid);
                  }
                }

                const liveRemainingDue = Math.max(0, newTotalCost - effectiveTotalPaid);

                return (
                  <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-zinc-900/60 border border-slate-200/80 dark:border-zinc-800/80 space-y-3 animate-in fade-in duration-200">
                    {/* Header */}
                    <div className="flex items-center justify-between pb-2 border-b border-slate-200/60 dark:border-zinc-800">
                      <div className="flex items-center gap-1.5">
                        <Wallet className="w-3.5 h-3.5 text-[#00a86b] dark:text-[#00df89]" />
                        <span className="font-bold text-slate-800 dark:text-zinc-200 text-xs">
                          {lang === 'bn' ? 'সাপ্লায়ার পেমেন্ট ও বাকি সমন্বয়' : 'Supplier Payment & Reconciliation'}
                        </span>
                      </div>
                      <span className="text-xs font-mono font-bold text-slate-700 dark:text-zinc-300">
                        {lang === 'bn' ? 'মোট বিল:' : 'Total Cost:'}{' '}
                        <span className="text-[#00a86b] dark:text-[#00df89]">৳{newTotalCost.toLocaleString()}</span>
                      </span>
                    </div>

                    {/* Compact Metrics Strip */}
                    <div className="grid grid-cols-3 gap-2 p-2.5 rounded-xl bg-white dark:bg-[#09090b] border border-slate-200/80 dark:border-zinc-800 text-xs">
                      <div>
                        <div className="text-[10px] text-slate-400 font-medium">{lang === 'bn' ? 'পূর্বের স্টক' : 'Initial Stock'}</div>
                        <div className="font-semibold text-slate-800 dark:text-zinc-200 mt-0.5">
                          {prevStock} {editForm.unit} <span className="text-[10px] text-slate-400 font-mono font-normal">(@ ৳{prevCost})</span>
                        </div>
                      </div>
                      <div>
                        <div className="text-[10px] text-slate-400 font-medium">{lang === 'bn' ? 'পূর্বে পরিশোধিত' : 'Already Paid'}</div>
                        <div className="font-mono font-semibold text-emerald-600 dark:text-[#00df89] mt-0.5">
                          ৳{alreadyPaid.toLocaleString()}
                        </div>
                      </div>
                      <div>
                        <div className="text-[10px] text-slate-400 font-medium">{lang === 'bn' ? 'পূর্বের বাকি' : 'Previous Due'}</div>
                        <div className={`font-mono font-semibold mt-0.5 ${prevDue > 0 ? 'text-amber-500' : 'text-slate-500 dark:text-zinc-400'}`}>
                          ৳{prevDue.toLocaleString()}
                        </div>
                      </div>
                    </div>

                    {/* CASE 1: Stock was INCREASED (costDiff > 0) */}
                    {costDiff > 0 && (
                      <div className="space-y-2">
                        <div className="flex items-center justify-between text-xs">
                          <span className="font-medium text-slate-700 dark:text-zinc-300 text-[11px]">
                            {lang === 'bn' ? 'অতিরিক্ত খরচ সমন্বয়:' : 'Extra Stock Payment:'}
                          </span>
                          <span className="font-mono font-bold text-blue-600 dark:text-blue-400 bg-blue-500/10 px-2 py-0.5 rounded-md text-[11px]">
                            +{stockDiff} {editForm.unit} (+৳{costDiff.toLocaleString()})
                          </span>
                        </div>

                        {/* 4 Clean Segmented Button Tabs - Brand Uniform Styling */}
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5">
                          <button
                            type="button"
                            onClick={() => setEditForm((prev) => ({ ...prev, extra_payment_type: 'extra_full' }))}
                            className={`py-2 px-2 rounded-xl text-xs font-medium border flex flex-col items-center justify-center gap-0.5 transition-all cursor-pointer ${
                              (editForm.extra_payment_type || 'extra_full') === 'extra_full'
                                ? 'bg-[#00df89]/15 text-[#00a86b] dark:text-[#00df89] border-[#00df89] font-bold shadow-xs'
                                : 'bg-white dark:bg-[#09090b] text-slate-600 dark:text-zinc-400 border-slate-200 dark:border-zinc-800 hover:border-slate-300'
                            }`}
                          >
                            <span>{lang === 'bn' ? 'অতিরিক্ত পরিশোধ' : 'Pay Extra Full'}</span>
                            <span className="text-[10px] font-mono font-normal opacity-80">+৳{costDiff.toLocaleString()}</span>
                          </button>

                          <button
                            type="button"
                            onClick={() =>
                              setEditForm((prev) => ({
                                ...prev,
                                extra_payment_type: 'extra_partial',
                                extra_paid_amount: prev.extra_paid_amount || String(Math.round(costDiff * 0.5)),
                              }))
                            }
                            className={`py-2 px-2 rounded-xl text-xs font-medium border flex flex-col items-center justify-center gap-0.5 transition-all cursor-pointer ${
                              editForm.extra_payment_type === 'extra_partial'
                                ? 'bg-[#00df89]/15 text-[#00a86b] dark:text-[#00df89] border-[#00df89] font-bold shadow-xs'
                                : 'bg-white dark:bg-[#09090b] text-slate-600 dark:text-zinc-400 border-slate-200 dark:border-zinc-800 hover:border-slate-300'
                            }`}
                          >
                            <span>{lang === 'bn' ? 'অতিরিক্ত আংশিক' : 'Pay Extra Partial'}</span>
                            <span className="text-[10px] font-mono font-normal opacity-80">{lang === 'bn' ? 'কাস্টম' : 'Custom'}</span>
                          </button>

                          <button
                            type="button"
                            onClick={() => setEditForm((prev) => ({ ...prev, extra_payment_type: 'extra_due' }))}
                            className={`py-2 px-2 rounded-xl text-xs font-medium border flex flex-col items-center justify-center gap-0.5 transition-all cursor-pointer ${
                              editForm.extra_payment_type === 'extra_due'
                                ? 'bg-[#00df89]/15 text-[#00a86b] dark:text-[#00df89] border-[#00df89] font-bold shadow-xs'
                                : 'bg-white dark:bg-[#09090b] text-slate-600 dark:text-zinc-400 border-slate-200 dark:border-zinc-800 hover:border-slate-300'
                            }`}
                          >
                            <span>{lang === 'bn' ? 'অতিরিক্ত বাকি' : 'Add to Due'}</span>
                            <span className="text-[10px] font-mono font-normal opacity-80">+৳0</span>
                          </button>

                          <button
                            type="button"
                            onClick={() => setEditForm((prev) => ({ ...prev, extra_payment_type: 'clear_all' }))}
                            className={`py-2 px-2 rounded-xl text-xs font-medium border flex flex-col items-center justify-center gap-0.5 transition-all cursor-pointer ${
                              editForm.extra_payment_type === 'clear_all'
                                ? 'bg-[#00df89]/15 text-[#00a86b] dark:text-[#00df89] border-[#00df89] font-bold shadow-xs'
                                : 'bg-white dark:bg-[#09090b] text-slate-600 dark:text-zinc-400 border-slate-200 dark:border-zinc-800 hover:border-slate-300'
                            }`}
                          >
                            <span>{lang === 'bn' ? 'সব পরিশোধ' : 'Settle All'}</span>
                            <span className="text-[10px] font-mono font-normal opacity-80">৳{newTotalCost.toLocaleString()}</span>
                          </button>
                        </div>

                        {/* Extra Partial Custom Input Box */}
                        {editForm.extra_payment_type === 'extra_partial' && (
                          <div className="p-2.5 rounded-xl bg-white dark:bg-[#09090b] border border-slate-200 dark:border-zinc-800 space-y-1.5 animate-in fade-in duration-150">
                            <div className="flex items-center justify-between text-xs">
                              <span className="text-slate-600 dark:text-zinc-400 text-[11px]">
                                {lang === 'bn' ? `অতিরিক্ত +৳${costDiff.toLocaleString()} থেকে পরিশোধ (৳):` : `Amount to pay from extra +৳${costDiff.toLocaleString()} (৳):`}
                              </span>
                              <div className="flex items-center gap-1">
                                {[0.25, 0.5, 0.75, 1].map((ratio) => {
                                  const val = Math.round(costDiff * ratio);
                                  return (
                                    <button
                                      key={ratio}
                                      type="button"
                                      onClick={() => setEditForm((prev) => ({ ...prev, extra_paid_amount: String(val) }))}
                                      className="px-1.5 py-0.5 rounded text-[10px] font-semibold bg-slate-100 dark:bg-zinc-800 hover:bg-[#00df89]/15 hover:text-[#00a86b] dark:hover:text-[#00df89] text-slate-600 dark:text-zinc-400 cursor-pointer transition-colors"
                                    >
                                      {ratio * 100}%
                                    </button>
                                  );
                                })}
                              </div>
                            </div>
                            <input
                              type="number"
                              placeholder="0.00"
                              value={editForm.extra_paid_amount}
                              onChange={(e) => setEditForm((prev) => ({ ...prev, extra_paid_amount: e.target.value }))}
                              className="w-full px-3 py-1.5 rounded-lg bg-slate-50 dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 text-xs font-mono font-bold text-slate-900 dark:text-white outline-none focus:ring-1 focus:ring-[#00df89]"
                            />
                          </div>
                        )}
                      </div>
                    )}

                    {/* CASE 2: Stock was REDUCED (costDiff < 0) */}
                    {costDiff < 0 && (
                      <div className="space-y-2">
                        <div className="flex items-center justify-between text-xs">
                          <span className="font-medium text-slate-700 dark:text-zinc-300 text-[11px]">
                            {lang === 'bn' ? 'স্টক ও খরচ হ্রাস:' : 'Stock & Bill Reduction:'}
                          </span>
                          <span className="font-mono font-bold text-amber-600 dark:text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded-md text-[11px]">
                            {stockDiff} {editForm.unit} (-৳{Math.abs(costDiff).toLocaleString()})
                          </span>
                        </div>

                        {/* Status Note */}
                        {alreadyPaid >= newTotalCost ? (
                          <div className="p-2 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-700 dark:text-emerald-300 text-[11px] flex items-center gap-1.5">
                            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                            <span>
                              {lang === 'bn'
                                ? `স্টক কমানোয় মোট বিল কমে ৳${newTotalCost.toLocaleString()} হয়েছে এবং পূর্বের পেমেন্টেই তা সম্পূর্ণ পরিশোধিত (৳০ বাকি)।`
                                : `Stock reduced. The new total bill of ৳${newTotalCost.toLocaleString()} is fully covered by previous payment (৳0 due).`}
                            </span>
                          </div>
                        ) : (
                          <div className="p-2 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-700 dark:text-amber-300 text-[11px] flex items-center gap-1.5">
                            <AlertTriangle className="w-3.5 h-3.5 text-amber-500 shrink-0" />
                            <span>
                              {lang === 'bn'
                                ? `স্টক কমানোয় বকেয়া ৳${prevDue.toLocaleString()} থেকে কমে ৳${Math.max(0, newTotalCost - alreadyPaid).toLocaleString()} হয়েছে।`
                                : `Stock reduced. Outstanding due automatically decreased from ৳${prevDue.toLocaleString()} → ৳${Math.max(0, newTotalCost - alreadyPaid).toLocaleString()}.`}
                            </span>
                          </div>
                        )}

                        {/* Segmented Buttons for Reduced Stock */}
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5">
                          <button
                            type="button"
                            onClick={() =>
                              setEditForm((prev) => ({
                                ...prev,
                                payment_type: 'keep_existing',
                                paid_amount: String(Math.min(newTotalCost, alreadyPaid)),
                              }))
                            }
                            className={`py-2 px-1 rounded-xl text-xs font-medium border flex flex-col items-center justify-center gap-0.5 transition-all cursor-pointer ${
                              (editForm.payment_type || 'keep_existing') === 'keep_existing'
                                ? 'bg-[#00df89]/15 text-[#00a86b] dark:text-[#00df89] border-[#00df89] font-bold shadow-xs'
                                : 'bg-white dark:bg-[#09090b] text-slate-600 dark:text-zinc-400 border-slate-200 dark:border-zinc-800 hover:border-slate-300'
                            }`}
                          >
                            <span>{alreadyPaid >= newTotalCost ? (lang === 'bn' ? 'পরিশোধ বহাল' : 'Keep Paid') : (lang === 'bn' ? 'পূর্বের পরিশোধ বহাল' : 'Keep Paid')}</span>
                            <span className="text-[10px] font-mono font-normal opacity-80">
                              ৳{Math.min(newTotalCost, alreadyPaid).toLocaleString()}
                            </span>
                          </button>

                          <button
                            type="button"
                            onClick={() =>
                              setEditForm((prev) => ({
                                ...prev,
                                payment_type: 'full',
                                paid_amount: String(newTotalCost),
                              }))
                            }
                            className={`py-2 px-1 rounded-xl text-xs font-medium border flex flex-col items-center justify-center gap-0.5 transition-all cursor-pointer ${
                              editForm.payment_type === 'full'
                                ? 'bg-[#00df89]/15 text-[#00a86b] dark:text-[#00df89] border-[#00df89] font-bold shadow-xs'
                                : 'bg-white dark:bg-[#09090b] text-slate-600 dark:text-zinc-400 border-slate-200 dark:border-zinc-800 hover:border-slate-300'
                            }`}
                          >
                            <span>{lang === 'bn' ? 'সম্পূর্ণ পরিশোধ' : 'Pay Full'}</span>
                            <span className="text-[10px] font-mono font-normal opacity-80">100% (৳{newTotalCost.toLocaleString()})</span>
                          </button>

                          <button
                            type="button"
                            onClick={() =>
                              setEditForm((prev) => ({
                                ...prev,
                                payment_type: 'partial',
                                paid_amount: prev.paid_amount || String(Math.round(newTotalCost * 0.5)),
                              }))
                            }
                            className={`py-2 px-1 rounded-xl text-xs font-medium border flex flex-col items-center justify-center gap-0.5 transition-all cursor-pointer ${
                              editForm.payment_type === 'partial'
                                ? 'bg-[#00df89]/15 text-[#00a86b] dark:text-[#00df89] border-[#00df89] font-bold shadow-xs'
                                : 'bg-white dark:bg-[#09090b] text-slate-600 dark:text-zinc-400 border-slate-200 dark:border-zinc-800 hover:border-slate-300'
                            }`}
                          >
                            <span>{lang === 'bn' ? 'আংশিক' : 'Partial'}</span>
                            <span className="text-[10px] font-mono font-normal opacity-80">{lang === 'bn' ? 'কাস্টম' : 'Custom'}</span>
                          </button>

                          <button
                            type="button"
                            onClick={() =>
                              setEditForm((prev) => ({
                                ...prev,
                                payment_type: 'due',
                                paid_amount: '0',
                              }))
                            }
                            className={`py-2 px-1 rounded-xl text-xs font-medium border flex flex-col items-center justify-center gap-0.5 transition-all cursor-pointer ${
                              editForm.payment_type === 'due'
                                ? 'bg-red-500/15 text-red-600 dark:text-red-400 border-red-500 font-bold shadow-xs'
                                : 'bg-white dark:bg-[#09090b] text-slate-600 dark:text-zinc-400 border-slate-200 dark:border-zinc-800 hover:border-slate-300'
                            }`}
                          >
                            <span>{lang === 'bn' ? 'সম্পূর্ণ বাকি' : 'Full Due'}</span>
                            <span className="text-[10px] font-mono font-normal opacity-80">0%</span>
                          </button>
                        </div>

                        {/* Partial custom input when reduced */}
                        {editForm.payment_type === 'partial' && (
                          <div className="p-2.5 rounded-xl bg-white dark:bg-[#09090b] border border-slate-200 dark:border-zinc-800 space-y-1.5 animate-in fade-in duration-150">
                            <label className="text-slate-600 dark:text-zinc-400 text-[11px]">
                              {lang === 'bn' ? 'মোট কত টাকা পরিশোধ রাখবেন (৳):' : 'Total Paid Amount to Record (৳):'}
                            </label>
                            <input
                              type="number"
                              placeholder="0.00"
                              value={editForm.paid_amount}
                              onChange={(e) => setEditForm((prev) => ({ ...prev, payment_type: 'partial', paid_amount: e.target.value }))}
                              className="w-full px-3 py-1.5 rounded-lg bg-slate-50 dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 text-xs font-mono font-bold text-slate-900 dark:text-white outline-none focus:ring-1 focus:ring-[#00df89]"
                            />
                          </div>
                        )}
                      </div>
                    )}

                    {/* CASE 3: Stock was UNCHANGED (costDiff === 0) */}
                    {costDiff === 0 && (
                      <div className="space-y-1.5">
                        <label className="block font-medium text-slate-700 dark:text-zinc-300 text-[11px]">
                          {lang === 'bn' ? 'পেমেন্ট সমন্বয়:' : 'Payment Option:'}
                        </label>
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5">
                          <button
                            type="button"
                            onClick={() =>
                              setEditForm((prev) => ({
                                ...prev,
                                payment_type: 'keep_existing',
                                paid_amount: String(alreadyPaid),
                              }))
                            }
                            className={`py-2 px-1 rounded-xl text-xs font-medium border flex flex-col items-center justify-center gap-0.5 transition-all cursor-pointer ${
                              (editForm.payment_type || 'keep_existing') === 'keep_existing'
                                ? 'bg-[#00df89]/15 text-[#00a86b] dark:text-[#00df89] border-[#00df89] font-bold shadow-xs'
                                : 'bg-white dark:bg-[#09090b] text-slate-600 dark:text-zinc-400 border-slate-200 dark:border-zinc-800 hover:border-slate-300'
                            }`}
                          >
                            <span>{isOriginallyFullyPaid ? (lang === 'bn' ? 'পরিশোধিত' : 'Keep Paid') : (lang === 'bn' ? 'বাকি বহাল' : 'Keep Due')}</span>
                            <span className="text-[10px] font-mono font-normal opacity-80">৳{alreadyPaid.toLocaleString()}</span>
                          </button>

                          <button
                            type="button"
                            onClick={() =>
                              setEditForm((prev) => ({
                                ...prev,
                                payment_type: 'full',
                                paid_amount: String(newTotalCost),
                              }))
                            }
                            className={`py-2 px-1 rounded-xl text-xs font-medium border flex flex-col items-center justify-center gap-0.5 transition-all cursor-pointer ${
                              editForm.payment_type === 'full'
                                ? 'bg-[#00df89]/15 text-[#00a86b] dark:text-[#00df89] border-[#00df89] font-bold shadow-xs'
                                : 'bg-white dark:bg-[#09090b] text-slate-600 dark:text-zinc-400 border-slate-200 dark:border-zinc-800 hover:border-slate-300'
                            }`}
                          >
                            <span>{lang === 'bn' ? 'সম্পূর্ণ পরিশোধ' : 'Pay Full'}</span>
                            <span className="text-[10px] font-mono font-normal opacity-80">100% (৳{newTotalCost.toLocaleString()})</span>
                          </button>

                          <button
                            type="button"
                            onClick={() =>
                              setEditForm((prev) => ({
                                ...prev,
                                payment_type: 'partial',
                                paid_amount: prev.paid_amount || String(Math.round(newTotalCost * 0.5)),
                              }))
                            }
                            className={`py-2 px-1 rounded-xl text-xs font-medium border flex flex-col items-center justify-center gap-0.5 transition-all cursor-pointer ${
                              editForm.payment_type === 'partial'
                                ? 'bg-[#00df89]/15 text-[#00a86b] dark:text-[#00df89] border-[#00df89] font-bold shadow-xs'
                                : 'bg-white dark:bg-[#09090b] text-slate-600 dark:text-zinc-400 border-slate-200 dark:border-zinc-800 hover:border-slate-300'
                            }`}
                          >
                            <span>{lang === 'bn' ? 'আংশিক' : 'Partial'}</span>
                            <span className="text-[10px] font-mono font-normal opacity-80">{lang === 'bn' ? 'কাস্টম' : 'Custom'}</span>
                          </button>

                          <button
                            type="button"
                            onClick={() =>
                              setEditForm((prev) => ({
                                ...prev,
                                payment_type: 'due',
                                paid_amount: '0',
                              }))
                            }
                            className={`py-2 px-1 rounded-xl text-xs font-medium border flex flex-col items-center justify-center gap-0.5 transition-all cursor-pointer ${
                              editForm.payment_type === 'due'
                                ? 'bg-red-500/15 text-red-600 dark:text-red-400 border-red-500 font-bold shadow-xs'
                                : 'bg-white dark:bg-[#09090b] text-slate-600 dark:text-zinc-400 border-slate-200 dark:border-zinc-800 hover:border-slate-300'
                            }`}
                          >
                            <span>{lang === 'bn' ? 'সম্পূর্ণ বাকি' : 'Full Due'}</span>
                            <span className="text-[10px] font-mono font-normal opacity-80">0%</span>
                          </button>
                        </div>

                        {/* Partial custom input when unchanged */}
                        {editForm.payment_type === 'partial' && (
                          <div className="p-2.5 rounded-xl bg-white dark:bg-[#09090b] border border-slate-200 dark:border-zinc-800 space-y-1.5 animate-in fade-in duration-150">
                            <label className="text-slate-600 dark:text-zinc-400 text-[11px]">
                              {lang === 'bn' ? 'মোট কত টাকা পরিশোধ করবেন (৳):' : 'Total Paid Amount (৳):'}
                            </label>
                            <input
                              type="number"
                              placeholder="0.00"
                              value={editForm.paid_amount}
                              onChange={(e) => setEditForm((prev) => ({ ...prev, payment_type: 'partial', paid_amount: e.target.value }))}
                              className="w-full px-3 py-1.5 rounded-lg bg-slate-50 dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 text-xs font-mono font-bold text-slate-900 dark:text-white outline-none focus:ring-1 focus:ring-[#00df89]"
                            />
                          </div>
                        )}
                      </div>
                    )}

                    {/* Final Reconciliation Receipt / Summary Banner */}
                    <div className="p-2.5 rounded-xl bg-white dark:bg-[#09090b] border border-slate-200/80 dark:border-zinc-800 flex items-center justify-between text-xs">
                      <div className="flex items-center gap-1.5">
                        <span className="text-slate-500 dark:text-zinc-400 text-[11px]">{lang === 'bn' ? 'মোট পরিশোধ:' : 'Total Paid:'}</span>
                        <span className="font-mono font-bold text-[#00a86b] dark:text-[#00df89]">৳{effectiveTotalPaid.toLocaleString()}</span>
                      </div>

                      <div className="flex items-center gap-1.5">
                        <span className="text-slate-500 dark:text-zinc-400 text-[11px]">{lang === 'bn' ? 'সাপ্লায়ার বাকি:' : 'Supplier Due:'}</span>
                        <span className={`font-mono font-bold ${liveRemainingDue > 0 ? 'text-amber-500' : 'text-slate-500 dark:text-zinc-400'}`}>
                          ৳{liveRemainingDue.toLocaleString()}
                        </span>
                      </div>
                    </div>

                    {/* Payment Method Selector */}
                    {effectiveTotalPaid > 0 && (
                      <div className="space-y-1">
                        <label className="block text-[11px] font-medium text-slate-700 dark:text-zinc-300">
                          {lang === 'bn' ? 'পেমেন্ট মাধ্যম' : 'Payment Method'}
                        </label>
                        <Select
                          value={editForm.payment_method || 'cash'}
                          onValueChange={(val) => setEditForm((prev) => ({ ...prev, payment_method: val }))}
                        >
                          <SelectTrigger className="w-full h-8 text-xs bg-white dark:bg-[#09090b] border-slate-200 dark:border-zinc-800">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent className="dark:bg-zinc-900 dark:border-zinc-800">
                            <SelectItem value="cash">{lang === 'bn' ? 'নগদ (Cash)' : 'Cash'}</SelectItem>
                            <SelectItem value="bkash">bKash</SelectItem>
                            <SelectItem value="nagad">Nagad</SelectItem>
                            <SelectItem value="rocket">Rocket</SelectItem>
                            <SelectItem value="bank">{lang === 'bn' ? 'ব্যাংক ট্রান্সফার' : 'Bank Transfer'}</SelectItem>
                            <SelectItem value="card">{lang === 'bn' ? 'কার্ড' : 'Card'}</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    )}
                  </div>
                );
              })()}

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-100 dark:border-zinc-800 shrink-0">
                <Button type="button" variant="outline" size="sm" onClick={() => setIsEditModalOpen(false)} className="cursor-pointer">
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={isSubmitting}
                  size="sm"
                  className="bg-[#00df89] hover:bg-[#00c97b] text-[#011812] font-semibold cursor-pointer"
                >
                  {isSubmitting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : 'Update Product'}
                </Button>
              </div>
            </form>
          </Card>
        </div>
      )}

      {/* ---------------------------------------------------- */}
      {/* CONFIRM DELETE PRODUCT MODAL                         */}
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

      {/* ---------------------------------------------------- */}
      {/* CONFIRM DELETE CATEGORY / BRAND / SUPPLIER OPTION MODAL */}
      {/* ---------------------------------------------------- */}
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

      {/* ---------------------------------------------------- */}
      {/* QUICK VIEW PRODUCT VARIATIONS MODAL                  */}
      {/* ---------------------------------------------------- */}
      {selectedVariantProduct && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs animate-in fade-in duration-150">
          <Card className="max-w-xl w-full p-6 bg-white dark:bg-[#121215] border-slate-200 dark:border-zinc-800 shadow-2xl max-h-[85vh] flex flex-col space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-zinc-800 pb-3">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-emerald-500/10 text-[#00df89] flex items-center justify-center">
                  <Layers className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-bold text-sm text-slate-900 dark:text-white">
                    {selectedVariantProduct.name} — {lang === 'bn' ? 'ভ্যারিয়েশন তালিকা' : 'Variants Breakdown'}
                  </h3>
                  <p className="text-xs text-slate-400">
                    {lang === 'bn' ? 'মোট ভ্যারিয়েশন:' : 'Total Variations:'} {selectedVariantProduct.variants?.length || 0} | {lang === 'bn' ? 'মোট স্টক:' : 'Aggregate Stock:'} {selectedVariantProduct.stock} {selectedVariantProduct.unit}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setSelectedVariantProduct(null)}
                className="text-slate-400 hover:text-slate-600 p-1 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="overflow-x-auto rounded-xl border border-slate-200 dark:border-zinc-800 flex-1">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-slate-100 dark:bg-zinc-900 border-b border-slate-200 dark:border-zinc-800 text-slate-600 dark:text-zinc-400">
                    <th className="py-2.5 px-3 font-semibold">{lang === 'bn' ? 'ভ্যারিয়েশন' : 'Variant'}</th>
                    <th className="py-2.5 px-3 font-semibold">SKU</th>
                    <th className="py-2.5 px-3 font-semibold">{lang === 'bn' ? 'ক্রয় (৳)' : 'Cost (৳)'}</th>
                    <th className="py-2.5 px-3 font-semibold">{lang === 'bn' ? 'বিক্রয় (৳)' : 'Price (৳)'}</th>
                    <th className="py-2.5 px-3 font-semibold">{lang === 'bn' ? 'স্টক' : 'Stock'}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-zinc-800/60 bg-white dark:bg-[#09090b]">
                  {selectedVariantProduct.variants?.map((v) => (
                    <tr key={v._id} className="hover:bg-slate-50 dark:hover:bg-zinc-900/40">
                      <td className="py-2.5 px-3 font-bold text-slate-900 dark:text-white">
                        {v.name}
                      </td>
                      <td className="py-2.5 px-3 font-mono text-slate-500">
                        {v.sku || selectedVariantProduct.sku || 'N/A'}
                      </td>
                      <td className="py-2.5 px-3 font-mono text-slate-600 dark:text-zinc-400">
                        ৳ {(v.cost_price ?? selectedVariantProduct.buyPrice).toLocaleString()}
                      </td>
                      <td className="py-2.5 px-3 font-mono font-bold text-[#00a86b] dark:text-[#00df89]">
                        ৳ {(v.selling_price ?? selectedVariantProduct.sellPrice).toLocaleString()}
                      </td>
                      <td className="py-2.5 px-3">
                        <Badge
                          variant={v.stock_quantity <= 0 ? 'destructive' : v.stock_quantity <= (v.low_stock_threshold || 5) ? 'warning' : 'default'}
                          className="font-mono text-[10px]"
                        >
                          {v.stock_quantity} {selectedVariantProduct.unit}
                        </Badge>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="flex justify-between items-center pt-2 flex-wrap gap-2">
              <div className="flex items-center gap-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    const p = selectedVariantProduct;
                    setSelectedVariantProduct(null);
                    setBarcodeModalProducts([p]);
                    setIsBarcodeModalOpen(true);
                  }}
                  className="text-xs gap-1.5 cursor-pointer border-emerald-500/30 text-[#00a86b] dark:text-[#00df89] hover:bg-emerald-500/10"
                >
                  <Printer className="w-3.5 h-3.5" />
                  <span>{lang === 'bn' ? 'বারকোড লেবেল প্রিন্ট' : 'Print Barcode Labels'}</span>
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    const p = selectedVariantProduct;
                    setSelectedVariantProduct(null);
                    handleOpenEdit(p);
                  }}
                  className="text-xs gap-1.5 cursor-pointer"
                >
                  <Edit2 className="w-3.5 h-3.5" />
                  <span>{lang === 'bn' ? 'ভ্যারিয়েশন এডিট' : 'Edit Variations'}</span>
                </Button>
              </div>
              <Button
                type="button"
                size="sm"
                onClick={() => setSelectedVariantProduct(null)}
                className="bg-[#00df89] hover:bg-[#00c97b] text-[#011812] text-xs font-semibold cursor-pointer"
              >
                {lang === 'bn' ? 'বন্ধ করুন' : 'Close'}
              </Button>
            </div>
          </Card>
        </div>
      )}

      {/* ---------------------------------------------------- */}
      {/* 6. BARCODE & PRODUCT LABEL PRINT STUDIO MODAL        */}
      {/* ---------------------------------------------------- */}
      <BarcodeLabelModal
        isOpen={isBarcodeModalOpen}
        onClose={() => {
          setIsBarcodeModalOpen(false);
          setBarcodeModalProducts([]);
        }}
        initialProducts={barcodeModalProducts}
        allProducts={productList}
        shopInfo={mongoShop || activeShop || { name: 'Shopo Store' }}
        lang={lang}
      />

    </div>
  );
}
