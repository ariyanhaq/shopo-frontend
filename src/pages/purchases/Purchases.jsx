/**
 * @file Purchases.jsx
 * @description Purchases & Stock-In Ledger for tracking product acquisitions, vendor invoices, payment status, editing, deletion with stock reversal, and receipt printing.
 */
import { useState, useEffect, useMemo, useRef } from 'react';
import { useLanguage } from '@/context/LanguageContext';
import { useShop } from '@/context/ShopContext';
import { useAuth } from '@/context/AuthContext';
import { api } from '@/services/api';
import { printPurchaseReceipt } from '@/utils/invoicePrinter';
import {
  ShoppingBag, Plus, Search, Calendar, DollarSign,
  Receipt, CheckCircle2, AlertCircle, Loader2, X,
  Building2, ArrowUpDown, ChevronRight, Filter, Eye,
  Printer, CreditCard, Trash2, PlusCircle, Edit2, Wallet,
  Layers, Boxes, Sliders, Sparkles, Barcode
} from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem
} from '@/components/ui/select';
import ConfirmDialog from '@/components/common/ConfirmDialog';
import { BarcodeLabelModal } from '@/components/inventory/BarcodeLabelModal';
import { generateUniqueBarcode } from '@/utils/barcodePrinter';
import toast from 'react-hot-toast';

export default function Purchases() {
  const { lang } = useLanguage();
  const { activeShop } = useShop();
  const { mongoShop } = useAuth();

  const currentShopName = mongoShop?.name || activeShop?.name || 'Shopo Store';
  const currentShopPhone = mongoShop?.phone || activeShop?.phone || '';
  const currentShopAddress = mongoShop?.address || activeShop?.address || '';

  const [purchases, setPurchases] = useState([]);
  const [suppliers, setSuppliers] = useState([]);
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [brands, setBrands] = useState([]);
  const [stats, setStats] = useState({ total_purchases: 0, total_amount: 0, total_paid: 0, total_due: 0 });
  const [isLoading, setIsLoading] = useState(true);

  // Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  // Modal States
  const [isPurchaseModalOpen, setIsPurchaseModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingPurchase, setEditingPurchase] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedInvoice, setSelectedInvoice] = useState(null);
  const [isBarcodeModalOpen, setIsBarcodeModalOpen] = useState(false);
  const [barcodeModalProducts, setBarcodeModalProducts] = useState([]);

  // Pay Due Modal State
  const [payDueModal, setPayDueModal] = useState({
    isOpen: false,
    supplier: null,
    purchase: null,
    amount: '',
    payment_method: 'cash',
    notes: '',
    isSubmitting: false,
  });

  // Quick Add Product Modal State
  const [quickProductModal, setQuickProductModal] = useState({
    isOpen: false,
    rowIndex: null,
    mode: 'create', // 'create' | 'edit'
    name: '',
    barcode: generateUniqueBarcode('20'),
    cost_price: '',
    selling_price: '',
    unit: 'piece',
    category_id: '',
    brand_id: '',
    isSubmitting: false,
    has_variants: false,
    variation_options: [
      { name: 'Color', values: ['Red', 'Blue', 'Black'] },
    ],
    variants: [],
  });

  // Confirm Delete Dialog State for Products in dropdowns
  const [deleteProductModal, setDeleteProductModal] = useState({
    isOpen: false,
    id: null,
    name: '',
    isLoading: false,
  });

  // Inline Category State inside Quick Product Modal
  const [showAddCatInline, setShowAddCatInline] = useState(false);
  const [newCatName, setNewCatName] = useState('');
  const [isCreatingCat, setIsCreatingCat] = useState(false);

  // Confirm Delete Dialog State for Categories in dropdowns
  const [deleteCategoryModal, setDeleteCategoryModal] = useState({
    isOpen: false,
    id: null,
    name: '',
    isLoading: false,
  });

  // Inline Brand State inside Quick Product Modal
  const [showAddBrandInline, setShowAddBrandInline] = useState(false);
  const [newBrandName, setNewBrandName] = useState('');
  const [isCreatingBrand, setIsCreatingBrand] = useState(false);

  // Confirm Delete Dialog State for Brands in dropdowns
  const [deleteBrandModal, setDeleteBrandModal] = useState({
    isOpen: false,
    id: null,
    name: '',
    isLoading: false,
  });

  // Delete State
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Inline Supplier State inside Purchase Modal
  const [showInlineSupplier, setShowInlineSupplier] = useState(false);
  const [newSupplierName, setNewSupplierName] = useState('');
  const [newSupplierPhone, setNewSupplierPhone] = useState('');
  const [isCreatingSupplier, setIsCreatingSupplier] = useState(false);

  // Purchase Form State
  const [purchaseForm, setPurchaseForm] = useState({
    supplier_id: '',
    supplier_name: 'General / Walk-in Supplier',
    items: [
      { product_id: '', product_name: '', quantity: 1, unit_cost: 0, selling_price: 0, total_cost: 0 }
    ],
    discount: 0,
    paid_amount: '',
    payment_method: 'cash',
    notes: '',
  });

  // Edit Purchase Form State
  const [editForm, setEditForm] = useState({
    supplier_id: '',
    supplier_name: 'General / Walk-in Supplier',
    items: [],
    discount: 0,
    paid_amount: '',
    payment_method: 'cash',
    notes: '',
  });

  // Fetch Purchases & References
  const fetchPurchasesData = async () => {
    setIsLoading(true);
    try {
      const [purchRes, statsRes, suppRes, prodRes, catRes, brandRes] = await Promise.all([
        api.purchases.list(),
        api.purchases.getStats().catch(() => ({ data: {} })),
        api.suppliers.list().catch(() => ({ data: [] })),
        api.products.list().catch(() => ({ data: [] })),
        api.categories.list().catch(() => ({ data: [] })),
        api.brands.list().catch(() => ({ data: [] })),
      ]);

      setPurchases(Array.isArray(purchRes?.data) ? purchRes.data : []);
      if (statsRes?.data) {
        setStats(statsRes.data);
      }
      setSuppliers(Array.isArray(suppRes?.data) ? suppRes.data : []);
      setCategories(Array.isArray(catRes?.data) ? catRes.data : []);
      setBrands(Array.isArray(brandRes?.data) ? brandRes.data : []);

      const rawProds = Array.isArray(prodRes?.data)
        ? prodRes.data
        : Array.isArray(prodRes?.data?.docs)
        ? prodRes.data.docs
        : [];
      setProducts(rawProds);
    } catch (err) {
      console.warn('Failed to load purchases:', err);
      toast.error(err.message || 'Failed to load purchase records');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchPurchasesData();
  }, []);

  // Open Pay Due Modal for an invoice
  const handleOpenPayDue = (purchase) => {
    let supp = null;
    if (purchase.supplier_id && typeof purchase.supplier_id === 'object') {
      supp = purchase.supplier_id;
    } else if (purchase.supplier_id) {
      supp = suppliers.find((s) => String(s._id) === String(purchase.supplier_id));
    }
    if (!supp) {
      supp = {
        _id: purchase.supplier_id || null,
        name: purchase.supplier_name || 'Supplier',
        company_name: '',
        total_due: purchase.due_amount || 0,
      };
    }

    setPayDueModal({
      isOpen: true,
      supplier: supp,
      purchase,
      amount: String(purchase.due_amount || 0),
      payment_method: 'cash',
      notes: '',
      isSubmitting: false,
    });
  };

  // Submit Due Payment
  const handleSubmitPayDue = async (e) => {
    e.preventDefault();
    if (!payDueModal.supplier?._id) {
      toast.error(lang === 'bn' ? 'সাপ্লায়ার তথ্য পাওয়া যায়নি' : 'Supplier information not found');
      return;
    }

    const amountNum = Number(payDueModal.amount);
    if (isNaN(amountNum) || amountNum <= 0) {
      toast.error(lang === 'bn' ? 'সঠিক পেমেন্টের পরিমাণ লিখুন' : 'Please enter a valid payment amount');
      return;
    }

    setPayDueModal((prev) => ({ ...prev, isSubmitting: true }));
    try {
      await api.suppliers.payDue(payDueModal.supplier._id, {
        amount: amountNum,
        payment_method: payDueModal.payment_method,
        notes: payDueModal.notes,
        purchase_id: payDueModal.purchase?._id || undefined,
      });

      toast.success(
        lang === 'bn'
          ? `৳${amountNum.toLocaleString()} বাকি পরিশোধ সফল হয়েছে!`
          : `Due payment of ৳${amountNum.toLocaleString()} recorded successfully!`
      );

      setPayDueModal({
        isOpen: false,
        supplier: null,
        purchase: null,
        amount: '',
        payment_method: 'cash',
        notes: '',
        isSubmitting: false,
      });

      if (selectedInvoice && payDueModal.purchase?._id === selectedInvoice._id) {
        setSelectedInvoice(null);
      }

      fetchPurchasesData();
    } catch (err) {
      toast.error(err.message || 'Failed to record due payment');
    } finally {
      setPayDueModal((prev) => ({ ...prev, isSubmitting: false }));
    }
  };

  // Filter Purchases
  const filteredPurchases = useMemo(() => {
    return purchases.filter((p) => {
      const matchesStatus = statusFilter === 'all' || p.payment_status === statusFilter;
      const q = searchQuery.toLowerCase().trim();
      const matchesSearch =
        !q ||
        (p.purchase_number || '').toLowerCase().includes(q) ||
        (p.supplier_name || '').toLowerCase().includes(q) ||
        (p.items || []).some((item) => (item.product_name || '').toLowerCase().includes(q));
      return matchesStatus && matchesSearch;
    });
  }, [purchases, statusFilter, searchQuery]);

  // Preset attribute suggestions for Quick Product Modal
  const attributePresets = [
    { name: 'Color', values: ['Red', 'Blue', 'Black', 'White', 'Green'] },
    { name: 'Size', values: ['S', 'M', 'L', 'XL', 'XXL'] },
    { name: 'Pages / Type', values: ['100 Pages', '200 Pages', '300 Pages'] },
    { name: 'Storage / RAM', values: ['64GB', '128GB', '256GB'] },
  ];

  // Open Quick Add Product Modal
  const handleOpenQuickAddProduct = (rowIndex, mode = 'create') => {
    setQuickProductModal({
      isOpen: true,
      rowIndex,
      mode,
      name: '',
      cost_price: '',
      selling_price: '',
      unit: 'piece',
      category_id: '',
      brand_id: '',
      isSubmitting: false,
      has_variants: false,
      variation_options: [
        { name: 'Color', values: ['Red', 'Blue', 'Black'] },
      ],
      variants: [],
    });
  };

  // Generate Cartesian Combinations for Quick Product Modal
  const generateQuickProductCombinations = () => {
    const validOptions = (quickProductModal.variation_options || []).filter((opt) => opt.name.trim() && opt.values.length > 0);
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

    const baseCost = parseFloat(quickProductModal.cost_price) || 0;
    const baseSell = parseFloat(quickProductModal.selling_price) || baseCost;
    const basePrefix = quickProductModal.name ? quickProductModal.name.slice(0, 3).toUpperCase() : 'SKU';

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
        stock_quantity: 0,
        low_stock_threshold: 5,
      };
    });

    setQuickProductModal((prev) => ({ ...prev, variants: newVariants }));
    toast.success(lang === 'bn' ? `${newVariants.length} টি ভ্যারিয়েশন তৈরি হয়েছে!` : `Generated ${newVariants.length} variations!`);
  };

  const handleAddQuickProductAttrGroup = (preset) => {
    if (preset) {
      setQuickProductModal(prev => ({
        ...prev,
        variation_options: [...(prev.variation_options || []), { name: preset.name, values: [...preset.values] }]
      }));
    } else {
      setQuickProductModal(prev => ({
        ...prev,
        variation_options: [...(prev.variation_options || []), { name: `Attribute ${(prev.variation_options?.length || 0) + 1}`, values: [] }]
      }));
    }
  };

  const handleRemoveQuickProductAttrGroup = (index) => {
    setQuickProductModal(prev => ({
      ...prev,
      variation_options: (prev.variation_options || []).filter((_, i) => i !== index)
    }));
  };

  const handleAddQuickProductOptionValue = (optIndex, val) => {
    if (!val || !val.trim()) return;
    setQuickProductModal(prev => {
      const updated = [...(prev.variation_options || [])];
      if (!updated[optIndex].values.includes(val.trim())) {
        updated[optIndex].values.push(val.trim());
      }
      return { ...prev, variation_options: updated };
    });
  };

  const handleRemoveQuickProductOptionValue = (optIndex, valIndex) => {
    setQuickProductModal(prev => {
      const updated = [...(prev.variation_options || [])];
      updated[optIndex].values = updated[optIndex].values.filter((_, i) => i !== valIndex);
      return { ...prev, variation_options: updated };
    });
  };

  const handleUpdateQuickProductVariant = (vIdx, field, value) => {
    setQuickProductModal(prev => {
      const updated = [...(prev.variants || [])];
      updated[vIdx] = { ...updated[vIdx], [field]: value };
      return { ...prev, variants: updated };
    });
  };

  const handleRemoveQuickProductVariant = (vIdx) => {
    setQuickProductModal(prev => ({
      ...prev,
      variants: (prev.variants || []).filter((_, i) => i !== vIdx)
    }));
  };

  const handleBulkFillQuickProductVariants = (field, value) => {
    setQuickProductModal(prev => {
      const updated = (prev.variants || []).map(v => ({ ...v, [field]: value }));
      return { ...prev, variants: updated };
    });
    toast.success(lang === 'bn' ? 'সকল ভ্যারিয়েশনে প্রয়োগ করা হয়েছে' : 'Applied to all variations');
  };

  // Add all variants of a product to purchase form
  const handleAddAllVariantsToPurchase = (productId, mode = 'create') => {
    const product = products.find((p) => String(p._id) === String(productId));
    if (!product || !product.has_variants || !Array.isArray(product.variants) || product.variants.length === 0) return;

    const newItems = product.variants.map((v) => ({
      product_id: product._id,
      variant_id: v._id,
      variant_name: v.name,
      product_name: product.name,
      quantity: 1,
      unit_cost: v.cost_price || product.cost_price || 0,
      selling_price: v.selling_price || product.selling_price || 0,
      total_cost: (v.cost_price || product.cost_price || 0) * 1,
    }));

    if (mode === 'create') {
      setPurchaseForm((prev) => {
        const filtered = prev.items.filter((it) => it.product_id);
        return {
          ...prev,
          items: filtered.length > 0 ? [...filtered, ...newItems] : newItems,
        };
      });
      toast.success(lang === 'bn' ? `${product.variants.length} টি ভ্যারিয়েশন যুক্ত হয়েছে!` : `Added all ${product.variants.length} variations!`);
    } else {
      setEditForm((prev) => {
        const filtered = prev.items.filter((it) => it.product_id);
        return {
          ...prev,
          items: filtered.length > 0 ? [...filtered, ...newItems] : newItems,
        };
      });
      toast.success(lang === 'bn' ? `${product.variants.length} টি ভ্যারিয়েশন যুক্ত হয়েছে!` : `Added all ${product.variants.length} variations!`);
    }
  };

  // Submit Quick Add Product
  const handleCreateQuickProduct = async (e) => {
    e.preventDefault();
    if (!quickProductModal.name.trim()) {
      toast.error(lang === 'bn' ? 'পণ্যের নাম লিখুন' : 'Product name is required');
      return;
    }

    const cost = parseFloat(quickProductModal.cost_price) || 0;
    const sell = parseFloat(quickProductModal.selling_price) || cost;
    const selectedBrand = brands.find((b) => b._id === quickProductModal.brand_id);
    const hasVars = Boolean(quickProductModal.has_variants);

    setQuickProductModal((prev) => ({ ...prev, isSubmitting: true }));
    try {
      const res = await api.products.create({
        name: quickProductModal.name.trim(),
        cost_price: cost,
        selling_price: sell,
        unit: quickProductModal.unit || 'piece',
        category_id: quickProductModal.category_id || undefined,
        brand_id: quickProductModal.brand_id || undefined,
        brand: selectedBrand?.name || '',
        stock_quantity: 0,
        has_variants: hasVars,
        variation_options: hasVars ? (quickProductModal.variation_options || []) : [],
        variants: hasVars
          ? (quickProductModal.variants || []).map((v) => ({
              name: v.name,
              attributes: v.attributes || [],
              sku: v.sku ? v.sku.trim() : undefined,
              barcode: v.barcode ? v.barcode.trim() : undefined,
              cost_price: parseFloat(v.cost_price) || cost,
              selling_price: parseFloat(v.selling_price) || sell,
              stock_quantity: 0,
              low_stock_threshold: 5,
            }))
          : [],
      });

      const newProd = res?.data;
      toast.success(lang === 'bn' ? 'নতুন পণ্য সফলভাবে তৈরি হয়েছে!' : 'New product created successfully!');

      // Refresh products list
      const prodRes = await api.products.list().catch(() => ({ data: [] }));
      const rawProds = Array.isArray(prodRes?.data)
        ? prodRes.data
        : Array.isArray(prodRes?.data?.docs)
        ? prodRes.data.docs
        : [];
      setProducts(rawProds);

      // Automatically select in the row
      const targetId = newProd?._id || newProd?.id;
      if (targetId && quickProductModal.rowIndex !== null) {
        if (hasVars && Array.isArray(newProd.variants) && newProd.variants.length > 0) {
          const variantRows = newProd.variants.map((v) => ({
            product_id: targetId,
            variant_id: v._id,
            variant_name: v.name,
            product_name: newProd.name,
            quantity: 1,
            unit_cost: v.cost_price || cost,
            selling_price: v.selling_price || sell,
            total_cost: (v.cost_price || cost) * 1,
          }));

          if (quickProductModal.mode === 'create') {
            setPurchaseForm((prev) => {
              const updated = [...prev.items];
              updated.splice(quickProductModal.rowIndex, 1, ...variantRows);
              return { ...prev, items: updated };
            });
          } else {
            setEditForm((prev) => {
              const updated = [...prev.items];
              updated.splice(quickProductModal.rowIndex, 1, ...variantRows);
              return { ...prev, items: updated };
            });
          }
        } else {
          if (quickProductModal.mode === 'create') {
            const updated = [...purchaseForm.items];
            const itm = { ...updated[quickProductModal.rowIndex] };
            itm.product_id = targetId;
            itm.product_name = newProd.name;
            itm.variant_id = '';
            itm.variant_name = '';
            itm.unit_cost = cost;
            itm.selling_price = sell;
            itm.total_cost = (itm.quantity || 1) * cost;
            updated[quickProductModal.rowIndex] = itm;
            setPurchaseForm((prev) => ({ ...prev, items: updated }));
          } else {
            const updated = [...editForm.items];
            const itm = { ...updated[quickProductModal.rowIndex] };
            itm.product_id = targetId;
            itm.product_name = newProd.name;
            itm.variant_id = '';
            itm.variant_name = '';
            itm.unit_cost = cost;
            itm.selling_price = sell;
            itm.total_cost = (itm.quantity || 1) * cost;
            updated[quickProductModal.rowIndex] = itm;
            setEditForm((prev) => ({ ...prev, items: updated }));
          }
        }
      }

      setQuickProductModal((prev) => ({ ...prev, isOpen: false, isSubmitting: false }));
    } catch (err) {
      toast.error(err.message || 'Failed to create product');
      setQuickProductModal((prev) => ({ ...prev, isSubmitting: false }));
    }
  };

  // Product Delete Prompt from Select Options
  const promptDeleteProduct = (prodId, prodName) => {
    setDeleteProductModal({
      isOpen: true,
      id: prodId,
      name: prodName,
      isLoading: false,
    });
  };

  const handleConfirmDeleteProduct = async () => {
    if (!deleteProductModal.id) return;
    setDeleteProductModal((prev) => ({ ...prev, isLoading: true }));
    try {
      await api.products.delete(deleteProductModal.id);
      setProducts((prev) => prev.filter((p) => p._id !== deleteProductModal.id));
      toast.success(lang === 'bn' ? `পণ্য '${deleteProductModal.name}' মুছে ফেলা হয়েছে!` : `Product '${deleteProductModal.name}' deleted!`);
      setDeleteProductModal({ isOpen: false, id: null, name: '', isLoading: false });
    } catch (err) {
      toast.error(err.message || 'Failed to delete product');
      setDeleteProductModal((prev) => ({ ...prev, isLoading: false }));
    }
  };

  // Inline Category Creation in Quick Product Modal
  const handleCreateCategory = async (e) => {
    e?.preventDefault();
    if (!newCatName.trim()) return;

    setIsCreatingCat(true);
    try {
      const res = await api.categories.create({ name: newCatName.trim() });
      const created = res?.data;
      if (created?._id) {
        setCategories((prev) => [...prev, created]);
        setQuickProductModal((prev) => ({ ...prev, category_id: created._id }));
        toast.success(lang === 'bn' ? 'ক্যাটাগরি তৈরি সম্পন্ন হয়েছে!' : 'Category created successfully!');
      }
      setNewCatName('');
      setShowAddCatInline(false);
    } catch (err) {
      toast.error(err.response?.data?.message || err.message || 'Failed to create category');
    } finally {
      setIsCreatingCat(false);
    }
  };

  // Category Delete Prompt from Select Options
  const promptDeleteCategory = (catId, catName) => {
    setDeleteCategoryModal({
      isOpen: true,
      id: catId,
      name: catName,
      isLoading: false,
    });
  };

  const handleConfirmDeleteCategory = async () => {
    if (!deleteCategoryModal.id) return;
    setDeleteCategoryModal((prev) => ({ ...prev, isLoading: true }));
    try {
      await api.categories.delete(deleteCategoryModal.id);
      setCategories((prev) => prev.filter((c) => c._id !== deleteCategoryModal.id));
      if (quickProductModal.category_id === deleteCategoryModal.id) {
        setQuickProductModal((prev) => ({ ...prev, category_id: '' }));
      }
      toast.success(lang === 'bn' ? `ক্যাটাগরি '${deleteCategoryModal.name}' মুছে ফেলা হয়েছে!` : `Category '${deleteCategoryModal.name}' deleted!`);
      setDeleteCategoryModal({ isOpen: false, id: null, name: '', isLoading: false });
    } catch (err) {
      toast.error(err.message || 'Failed to delete category');
      setDeleteCategoryModal((prev) => ({ ...prev, isLoading: false }));
    }
  };

  // Inline Brand Creation in Quick Product Modal
  const handleCreateBrand = async (e) => {
    e?.preventDefault();
    if (!newBrandName.trim()) return;

    setIsCreatingBrand(true);
    try {
      const res = await api.brands.create({ name: newBrandName.trim() });
      const created = res?.data;
      if (created?._id) {
        setBrands((prev) => [...prev, created]);
        setQuickProductModal((prev) => ({ ...prev, brand_id: created._id }));
        toast.success(lang === 'bn' ? 'ব্র্যান্ড তৈরি সম্পন্ন হয়েছে!' : 'Brand created successfully!');
      }
      setNewBrandName('');
      setShowAddBrandInline(false);
    } catch (err) {
      toast.error(err.response?.data?.message || err.message || 'Failed to create brand');
    } finally {
      setIsCreatingBrand(false);
    }
  };

  // Brand Delete Prompt from Select Options
  const promptDeleteBrand = (brandId, brandName) => {
    setDeleteBrandModal({
      isOpen: true,
      id: brandId,
      name: brandName,
      isLoading: false,
    });
  };

  const handleConfirmDeleteBrand = async () => {
    if (!deleteBrandModal.id) return;
    setDeleteBrandModal((prev) => ({ ...prev, isLoading: true }));
    try {
      await api.brands.delete(deleteBrandModal.id);
      setBrands((prev) => prev.filter((b) => b._id !== deleteBrandModal.id));
      if (quickProductModal.brand_id === deleteBrandModal.id) {
        setQuickProductModal((prev) => ({ ...prev, brand_id: '' }));
      }
      toast.success(lang === 'bn' ? `ব্র্যান্ড '${deleteBrandModal.name}' মুছে ফেলা হয়েছে!` : `Brand '${deleteBrandModal.name}' deleted!`);
      setDeleteBrandModal({ isOpen: false, id: null, name: '', isLoading: false });
    } catch (err) {
      toast.error(err.message || 'Failed to delete brand');
      setDeleteBrandModal((prev) => ({ ...prev, isLoading: false }));
    }
  };
  // Handle Form Item Changes (Create)
  const handleItemChange = (index, field, value) => {
    if (field === 'product_id' && value === '__add_new__') {
      handleOpenQuickAddProduct(index, 'create');
      return;
    }

    const updated = [...purchaseForm.items];
    const item = { ...updated[index], [field]: value };

    if (field === 'product_id') {
      const found = products.find((p) => String(p._id) === String(value));
      if (found) {
        item.product_name = found.name;
        const firstVariant = found.has_variants && Array.isArray(found.variants) && found.variants.length > 0
          ? found.variants[0]
          : null;
        item.variant_id = firstVariant ? firstVariant._id : '';
        item.variant_name = firstVariant ? firstVariant.name : '';
        item.unit_cost = firstVariant ? (firstVariant.cost_price || found.cost_price || 0) : (found.cost_price || 0);
        item.selling_price = firstVariant ? (firstVariant.selling_price || found.selling_price || 0) : (found.selling_price || 0);
        item.total_cost = (item.quantity || 1) * item.unit_cost;
      } else {
        item.product_name = '';
        item.variant_id = '';
        item.variant_name = '';
        item.unit_cost = 0;
        item.selling_price = 0;
        item.total_cost = 0;
      }
    } else if (field === 'variant_id') {
      const found = products.find((p) => String(p._id) === String(item.product_id));
      if (found && Array.isArray(found.variants)) {
        const v = found.variants.find((vr) => String(vr._id) === String(value));
        if (v) {
          item.variant_id = v._id;
          item.variant_name = v.name;
          item.unit_cost = v.cost_price || found.cost_price || 0;
          item.selling_price = v.selling_price || found.selling_price || 0;
          item.total_cost = (item.quantity || 1) * item.unit_cost;
        } else {
          item.variant_id = '';
          item.variant_name = '';
        }
      }
    } else if (field === 'quantity' || field === 'unit_cost') {
      const q = field === 'quantity' ? Number(value) || 0 : Number(item.quantity) || 0;
      const c = field === 'unit_cost' ? Number(value) || 0 : Number(item.unit_cost) || 0;
      item.total_cost = q * c;
    }

    updated[index] = item;
    setPurchaseForm((prev) => ({ ...prev, items: updated }));
  };

  // Add Item Row (Create)
  const handleAddItemRow = () => {
    setPurchaseForm((prev) => ({
      ...prev,
      items: [
        ...prev.items,
        { product_id: '', variant_id: '', variant_name: '', product_name: '', quantity: 1, unit_cost: 0, selling_price: 0, total_cost: 0 }
      ]
    }));
  };

  // Remove Item Row (Create)
  const handleRemoveItemRow = (index) => {
    if (purchaseForm.items.length <= 1) return;
    setPurchaseForm((prev) => ({
      ...prev,
      items: prev.items.filter((_, i) => i !== index),
    }));
  };

  // Calculations (Create)
  const calculatedTotal = purchaseForm.items.reduce((acc, it) => acc + (Number(it.total_cost) || 0), 0);
  const calculatedDiscount = Number(purchaseForm.discount) || 0;
  const calculatedNet = Math.max(0, calculatedTotal - calculatedDiscount);
  const calculatedPaid = purchaseForm.paid_amount !== '' ? Number(purchaseForm.paid_amount) : calculatedNet;
  const calculatedDue = Math.max(0, calculatedNet - calculatedPaid);

  // Live calculated summary metrics from purchases array
  const liveTotalAmount = useMemo(() => {
    return purchases.reduce((acc, p) => acc + (p.net_amount !== undefined ? p.net_amount : (p.total_amount || 0)), 0);
  }, [purchases]);

  const livePaidAmount = useMemo(() => {
    return purchases.reduce((acc, p) => acc + (p.paid_amount || 0), 0);
  }, [purchases]);

  const liveDueAmount = useMemo(() => {
    return purchases.reduce((acc, p) => acc + (p.due_amount || 0), 0);
  }, [purchases]);

  const summaryTotalProcurement = stats.total_amount !== undefined && stats.total_amount > 0 ? stats.total_amount : liveTotalAmount;
  const summaryPaidAmount = stats.total_paid !== undefined && stats.total_paid > 0 ? stats.total_paid : livePaidAmount;
  const summaryTotalDue = stats.total_due !== undefined && stats.total_due > 0 ? stats.total_due : liveDueAmount;
  const summaryTotalInvoices = stats.total_purchases !== undefined && stats.total_purchases > 0 ? stats.total_purchases : purchases.length;

  // Handle Form Item Changes (Edit)
  const handleEditItemChange = (index, field, value) => {
    if (field === 'product_id' && value === '__add_new__') {
      handleOpenQuickAddProduct(index, 'edit');
      return;
    }

    const updated = [...editForm.items];
    const item = { ...updated[index], [field]: value };

    if (field === 'product_id') {
      const found = products.find((p) => String(p._id) === String(value));
      if (found) {
        item.product_name = found.name;
        const firstVariant = found.has_variants && Array.isArray(found.variants) && found.variants.length > 0
          ? found.variants[0]
          : null;
        item.variant_id = firstVariant ? firstVariant._id : '';
        item.variant_name = firstVariant ? firstVariant.name : '';
        item.unit_cost = firstVariant ? (firstVariant.cost_price || found.cost_price || 0) : (found.cost_price || 0);
        item.selling_price = firstVariant ? (firstVariant.selling_price || found.selling_price || 0) : (found.selling_price || 0);
        item.total_cost = (item.quantity || 1) * item.unit_cost;
      } else {
        item.product_name = '';
        item.variant_id = '';
        item.variant_name = '';
        item.unit_cost = 0;
        item.selling_price = 0;
        item.total_cost = 0;
      }
    } else if (field === 'variant_id') {
      const found = products.find((p) => String(p._id) === String(item.product_id));
      if (found && Array.isArray(found.variants)) {
        const v = found.variants.find((vr) => String(vr._id) === String(value));
        if (v) {
          item.variant_id = v._id;
          item.variant_name = v.name;
          item.unit_cost = v.cost_price || found.cost_price || 0;
          item.selling_price = v.selling_price || found.selling_price || 0;
          item.total_cost = (item.quantity || 1) * item.unit_cost;
        } else {
          item.variant_id = '';
          item.variant_name = '';
        }
      }
    } else if (field === 'quantity' || field === 'unit_cost') {
      const q = field === 'quantity' ? Number(value) || 0 : Number(item.quantity) || 0;
      const c = field === 'unit_cost' ? Number(value) || 0 : Number(item.unit_cost) || 0;
      item.total_cost = q * c;
    }

    updated[index] = item;
    setEditForm((prev) => ({ ...prev, items: updated }));
  };

  // Add Item Row (Edit)
  const handleAddEditItemRow = () => {
    setEditForm((prev) => ({
      ...prev,
      items: [
        ...prev.items,
        { product_id: '', product_name: '', quantity: 1, unit_cost: 0, selling_price: 0, total_cost: 0 }
      ]
    }));
  };

  // Remove Item Row (Edit)
  const handleRemoveEditItemRow = (index) => {
    if (editForm.items.length <= 1) return;
    setEditForm((prev) => ({
      ...prev,
      items: prev.items.filter((_, i) => i !== index),
    }));
  };

  // Calculations (Edit)
  const editCalculatedTotal = editForm.items.reduce((acc, it) => acc + (Number(it.total_cost) || 0), 0);
  const editCalculatedDiscount = Number(editForm.discount) || 0;
  const editCalculatedNet = Math.max(0, editCalculatedTotal - editCalculatedDiscount);
  const editCalculatedPaid = editForm.paid_amount !== '' ? Number(editForm.paid_amount) : editCalculatedNet;
  const editCalculatedDue = Math.max(0, editCalculatedNet - editCalculatedPaid);

  // Handle Inline Supplier Creation
  const handleCreateSupplierInline = async () => {
    if (!newSupplierName.trim()) return;
    setIsCreatingSupplier(true);
    try {
      const res = await api.suppliers.create({
        name: newSupplierName.trim(),
        phone: newSupplierPhone.trim(),
      });
      if (res?.data) {
        setSuppliers((prev) => [res.data, ...prev]);
        setPurchaseForm((prev) => ({
          ...prev,
          supplier_id: res.data._id,
          supplier_name: res.data.name,
        }));
        setEditForm((prev) => ({
          ...prev,
          supplier_id: res.data._id,
          supplier_name: res.data.name,
        }));
        setShowInlineSupplier(false);
        setNewSupplierName('');
        setNewSupplierPhone('');
        toast.success(lang === 'bn' ? `সাপ্লায়ার '${res.data.name}' যুক্ত হয়েছে!` : `Supplier '${res.data.name}' created!`);
      }
    } catch (err) {
      toast.error(err.message || 'Failed to create supplier');
    } finally {
      setIsCreatingSupplier(false);
    }
  };

  // Confirm Delete Dialog State for Suppliers in dropdowns
  const [deleteSupplierModal, setDeleteSupplierModal] = useState({
    isOpen: false,
    id: null,
    name: '',
    isLoading: false,
  });

  const promptDeleteSupplier = (suppId, suppName) => {
    setDeleteSupplierModal({
      isOpen: true,
      id: suppId,
      name: suppName,
      isLoading: false,
    });
  };

  const handleConfirmDeleteSupplier = async () => {
    if (!deleteSupplierModal.id) return;
    setDeleteSupplierModal((prev) => ({ ...prev, isLoading: true }));
    try {
      await api.suppliers.delete(deleteSupplierModal.id);
      setSuppliers((prev) => prev.filter((s) => s._id !== deleteSupplierModal.id));
      if (purchaseForm.supplier_id === deleteSupplierModal.id) {
        setPurchaseForm((prev) => ({ ...prev, supplier_id: '', supplier_name: 'General / Walk-in Supplier' }));
      }
      if (editForm.supplier_id === deleteSupplierModal.id) {
        setEditForm((prev) => ({ ...prev, supplier_id: '', supplier_name: 'General / Walk-in Supplier' }));
      }
      toast.success(lang === 'bn' ? `সাপ্লায়ার '${deleteSupplierModal.name}' মুছে ফেলা হয়েছে!` : `Supplier '${deleteSupplierModal.name}' deleted!`);
      setDeleteSupplierModal({ isOpen: false, id: null, name: '', isLoading: false });
    } catch (err) {
      toast.error(err.message || 'Failed to delete supplier');
      setDeleteSupplierModal((prev) => ({ ...prev, isLoading: false }));
    }
  };

  // Open New Purchase Modal
  const handleOpenNewPurchase = () => {
    setPurchaseForm({
      supplier_id: '',
      supplier_name: 'General / Walk-in Supplier',
      items: [
        { product_id: products[0]?._id || '', product_name: products[0]?.name || '', quantity: 1, unit_cost: products[0]?.cost_price || 0, selling_price: products[0]?.selling_price || 0, total_cost: products[0]?.cost_price || 0 }
      ],
      discount: 0,
      paid_amount: '',
      payment_method: 'cash',
      notes: '',
    });
    setIsPurchaseModalOpen(true);
  };

  // Open Edit Modal
  const handleOpenEdit = (purchase) => {
    setEditingPurchase(purchase);
    setEditForm({
      supplier_id: purchase.supplier_id?._id || purchase.supplier_id || '',
      supplier_name: purchase.supplier_name || 'General / Walk-in Supplier',
      items: (purchase.items || []).map((it) => ({
        product_id: it.product_id?._id || it.product_id || '',
        product_name: it.product_name || '',
        quantity: it.quantity || 1,
        unit_cost: it.unit_cost || 0,
        selling_price: it.selling_price || 0,
        total_cost: it.total_cost || (it.quantity * it.unit_cost),
      })),
      discount: purchase.discount || 0,
      paid_amount: purchase.paid_amount !== undefined ? purchase.paid_amount : '',
      payment_method: purchase.payment_method || 'cash',
      notes: purchase.notes || '',
    });
    setIsEditModalOpen(true);
  };

  // Submit New Purchase
  const handleSubmitPurchase = async (e) => {
    e.preventDefault();

    const validItems = purchaseForm.items.filter((it) => it.product_id);
    if (validItems.length === 0) {
      toast.error(lang === 'bn' ? 'অনুগ্রহ করে অন্তত একটি পণ্য নির্বাচন করুন।' : 'Please select at least one product.');
      return;
    }

    setIsSubmitting(true);
    try {
      await api.purchases.create({
        supplier_id: purchaseForm.supplier_id || null,
        supplier_name: purchaseForm.supplier_name,
        items: validItems,
        discount: calculatedDiscount,
        paid_amount: calculatedPaid,
        payment_method: purchaseForm.payment_method,
        notes: purchaseForm.notes,
      });

      // Prepare purchased items for instant 1-click barcode printing
      const purchasedPrintItems = validItems.map((it) => {
        const prod = products.find((p) => String(p._id || p.id) === String(it.product_id));
        let variantBarcode = '';
        if (prod?.has_variants && Array.isArray(prod.variants)) {
          const v = prod.variants.find((vr) => String(vr._id || vr.id) === String(it.variant_id) || vr.name === it.variant_name);
          variantBarcode = v?.barcode || v?.sku;
        }
        return {
          id: it.variant_id ? `${it.product_id}_${it.variant_id}` : `${it.product_id}`,
          productId: it.product_id,
          variantId: it.variant_id || null,
          name: it.product_name ? it.product_name.replace(/\s*\([^)]*\)/g, '') : (prod?.name || 'Product'),
          variant_name: it.variant_name || '',
          barcode: variantBarcode || it.barcode || prod?.barcode || prod?.sku || generateUniqueBarcode('20'),
          selling_price: it.selling_price || prod?.selling_price || 0,
          unit: prod?.unit || 'pcs',
          stock: it.quantity,
          copies: Math.max(1, parseInt(it.quantity, 10) || 1),
        };
      });

      setIsPurchaseModalOpen(false);
      fetchPurchasesData();

      toast.success(
        (t) => (
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="font-bold text-xs">{lang === 'bn' ? 'পণ্য ক্রয় ও স্টক যোগ সম্পন্ন!' : 'Purchase recorded successfully!'}</p>
              <p className="text-[11px] text-slate-500">{lang === 'bn' ? 'ক্রয়কৃত স্টকের বারকোড স্টিকার প্রিন্ট করুন' : 'Print barcode stickers for this batch?'}</p>
            </div>
            <Button
              size="sm"
              onClick={() => {
                toast.dismiss(t.id);
                setBarcodeModalProducts(purchasedPrintItems);
                setIsBarcodeModalOpen(true);
              }}
              className="bg-[#00df89] hover:bg-[#00c97b] text-[#011812] text-xs font-bold h-7 px-2.5 cursor-pointer shrink-0"
            >
              <Printer className="w-3.5 h-3.5 mr-1" />
              {lang === 'bn' ? 'প্রিন্ট' : 'Print'}
            </Button>
          </div>
        ),
        { duration: 7000 }
      );
    } catch (err) {
      toast.error(err.message || 'Failed to record purchase');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Submit Edit Purchase
  const handleSubmitEdit = async (e) => {
    e.preventDefault();
    if (!editingPurchase?._id) return;

    const validItems = editForm.items.filter((it) => it.product_id);
    if (validItems.length === 0) {
      toast.error(lang === 'bn' ? 'অনুগ্রহ করে অন্তত একটি পণ্য নির্বাচন করুন।' : 'Please select at least one product.');
      return;
    }

    setIsSubmitting(true);
    try {
      await api.purchases.update(editingPurchase._id, {
        supplier_id: editForm.supplier_id || null,
        supplier_name: editForm.supplier_name,
        items: validItems,
        discount: editCalculatedDiscount,
        paid_amount: editCalculatedPaid,
        payment_method: editForm.payment_method,
        notes: editForm.notes,
      });

      toast.success(lang === 'bn' ? 'ক্রয় ইনভয়েস সফলভাবে আপডেট হয়েছে!' : 'Purchase invoice updated successfully!');
      setIsEditModalOpen(false);
      setEditingPurchase(null);
      fetchPurchasesData();
    } catch (err) {
      toast.error(err.message || 'Failed to update purchase invoice');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Submit Delete Purchase
  const handleConfirmDelete = async () => {
    if (!deleteTarget?._id) return;
    setIsDeleting(true);
    try {
      await api.purchases.delete(deleteTarget._id);
      toast.success(
        lang === 'bn'
          ? `ইনভয়েস #${deleteTarget.purchase_number} মুছে ফেলা হয়েছে এবং স্টক সমন্বয় করা হয়েছে!`
          : `Purchase invoice #${deleteTarget.purchase_number} deleted & stock reversed!`
      );
      setDeleteTarget(null);
      fetchPurchasesData();
    } catch (err) {
      toast.error(err.message || 'Failed to delete purchase invoice');
    } finally {
      setIsDeleting(false);
    }
  };

  // Trigger Print Receipt
  const handlePrintReceipt = (purchase) => {
    if (!purchase) return;
    printPurchaseReceipt({ purchase, shop: mongoShop, lang });
  };

  // Trigger Print Barcode Labels for a Purchase
  const handlePrintPurchaseLabels = (purchase) => {
    if (!purchase?.items || purchase.items.length === 0) {
      toast.error(lang === 'bn' ? 'ইনভয়েসে কোনো পণ্য নেই' : 'No items found in this purchase');
      return;
    }
    const items = purchase.items.map((it) => {
      const prod = products.find((p) => String(p._id || p.id) === String(it.product_id));
      let variantBarcode = '';
      if (prod?.has_variants && Array.isArray(prod.variants)) {
        const v = prod.variants.find((vr) => String(vr._id || vr.id) === String(it.variant_id) || vr.name === it.variant_name);
        variantBarcode = v?.barcode || v?.sku;
      }
      return {
        id: it.variant_id ? `${it.product_id}_${it.variant_id}` : `${it.product_id}`,
        productId: it.product_id,
        variantId: it.variant_id || null,
        name: it.product_name ? it.product_name.replace(/\s*\([^)]*\)/g, '') : (prod?.name || 'Product'),
        variant_name: it.variant_name || '',
        barcode: variantBarcode || it.barcode || prod?.barcode || prod?.sku || String(it.product_id || '').slice(-8).toUpperCase(),
        selling_price: it.selling_price || prod?.selling_price || 0,
        unit: prod?.unit || 'pcs',
        stock: it.quantity,
        copies: Math.max(1, parseInt(it.quantity, 10) || 1),
      };
    });
    setBarcodeModalProducts(items);
    setIsBarcodeModalOpen(true);
  };

  return (
    <div className="space-y-6 font-sans pb-12">
      
      {/* ---------------------------------------------------- */}
      {/* TOP HEADER & ACTION ROW                              */}
      {/* ---------------------------------------------------- */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white tracking-tight flex items-center gap-2.5">
            <ShoppingBag className="w-6 h-6 text-[#00df89]" />
            <span>{lang === 'bn' ? 'পণ্য ক্রয় ও স্টক ইন খতিয়ান' : 'Purchases & Stock-In Ledger'}</span>
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-zinc-400 font-normal mt-0.5">
            {lang === 'bn'
              ? 'সাপ্লায়ার থেকে পণ্য ক্রয়, ইনভয়েস রেকর্ড, সম্পাদনা, স্টক সমন্বয় ও প্রিন্ট রসিদ'
              : 'Record supplier stock-in transactions, inventory purchases, edit, delete & print receipts'}
          </p>
        </div>

        <div className="flex items-center gap-2.5 flex-wrap">
          <Button
            type="button"
            variant="outline"
            onClick={() => {
              setBarcodeModalProducts(products);
              setIsBarcodeModalOpen(true);
            }}
            className="text-xs sm:text-sm h-10 px-3.5 gap-2 cursor-pointer border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 shadow-2xs hover:border-[#00df89]"
          >
            <Printer className="w-4 h-4 text-[#00df89]" />
            <span>{lang === 'bn' ? 'বারকোড লেবেল প্রিন্ট' : 'Print Barcode Labels'}</span>
          </Button>

          <Button
            onClick={handleOpenNewPurchase}
            className="bg-[#00df89] hover:bg-[#00c97b] text-[#011812] font-semibold text-xs sm:text-sm h-10 px-4 gap-2 shadow-xs cursor-pointer"
          >
            <Plus className="w-4 h-4 stroke-[2.5]" />
            <span>{lang === 'bn' ? 'নতুন স্টক ক্রয় করুন' : 'New Purchase / Stock In'}</span>
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
              {lang === 'bn' ? 'মোট ক্রয় ইনভয়েস' : 'Total Invoices'}
            </span>
            <Receipt className="w-4 h-4 text-slate-400" />
          </div>
          <div className="text-2xl sm:text-3xl font-bold text-slate-900 dark:text-white mt-2">
            {isLoading ? <Skeleton className="h-8 w-20 my-0.5" /> : summaryTotalInvoices}
          </div>
          <div className="text-xs text-slate-500 mt-1">
            {lang === 'bn' ? 'ডাটাবেজে সংরক্ষিত রেকর্ড' : 'Recorded procurement batches'}
          </div>
        </Card>

        <Card className="p-4 sm:p-5 border-slate-200/90 dark:border-zinc-800/80 dark:bg-[#121215]">
          <div className="flex items-center justify-between">
            <span className="text-xs sm:text-sm font-medium text-slate-500 dark:text-zinc-400">
              {lang === 'bn' ? 'মোট ব্যয় (Spend)' : 'Total Procurement'}
            </span>
            <ShoppingBag className="w-4 h-4 text-blue-500" />
          </div>
          <div className="text-2xl sm:text-3xl font-bold text-slate-900 dark:text-white mt-2">
            {isLoading ? <Skeleton className="h-8 w-28 my-0.5" /> : `৳ ${summaryTotalProcurement.toLocaleString()}`}
          </div>
          <div className="text-xs text-blue-500 mt-1">
            {lang === 'bn' ? 'মোট স্টক ইন বিল' : 'Gross invoice volume'}
          </div>
        </Card>

        <Card className="p-4 sm:p-5 border-slate-200/90 dark:border-zinc-800/80 dark:bg-[#121215]">
          <div className="flex items-center justify-between">
            <span className="text-xs sm:text-sm font-medium text-slate-500 dark:text-zinc-400">
              {lang === 'bn' ? 'পরিশোধিত অর্থ' : 'Paid Amount'}
            </span>
            <CheckCircle2 className="w-4 h-4 text-emerald-500" />
          </div>
          <div className="text-2xl sm:text-3xl font-bold text-[#00a86b] dark:text-[#00df89] mt-2">
            {isLoading ? <Skeleton className="h-8 w-28 my-0.5" /> : `৳ ${summaryPaidAmount.toLocaleString()}`}
          </div>
          <div className="text-xs text-[#00a86b] dark:text-[#00df89] mt-1">
            {lang === 'bn' ? 'নগদ ও অনলাইন পরিশোধ' : 'Cash & settled payments'}
          </div>
        </Card>

        <Card className="p-4 sm:p-5 border-slate-200/90 dark:border-zinc-800/80 dark:bg-[#121215]">
          <div className="flex items-center justify-between">
            <span className="text-xs sm:text-sm font-medium text-slate-500 dark:text-zinc-400">
              {lang === 'bn' ? 'বকেয়া / পাওনা বাকি' : 'Outstanding Due'}
            </span>
            <AlertCircle className="w-4 h-4 text-amber-500" />
          </div>
          <div className="text-2xl sm:text-3xl font-bold text-amber-500 mt-2">
            {isLoading ? <Skeleton className="h-8 w-24 my-0.5" /> : `৳ ${summaryTotalDue.toLocaleString()}`}
          </div>
          <div className="text-xs text-amber-500 mt-1">
            {lang === 'bn' ? 'সাপ্লায়ারের পাওনা বকেয়া' : 'Payables pending'}
          </div>
        </Card>
      </div>

      {/* ---------------------------------------------------- */}
      {/* FILTER & SEARCH BAR                                  */}
      {/* ---------------------------------------------------- */}
      <Card className="p-4 border-slate-200/90 dark:border-zinc-800/80 dark:bg-[#121215]">
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
          <div className="w-full sm:w-80 relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder={lang === 'bn' ? 'ইনভয়েস নং, সাপ্লায়ার বা পণ্যের নাম খুঁজুন...' : 'Search invoice, supplier, item...'}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-2 rounded-xl bg-slate-50 dark:bg-[#09090b] border border-slate-200 dark:border-zinc-800 text-xs text-slate-900 dark:text-white placeholder:text-slate-400 outline-none focus:ring-2 focus:ring-[#00df89]"
            />
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto">
            <div className="w-48 sm:w-56">
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger size="sm" className="bg-slate-50 dark:bg-[#09090b] w-full">
                  <SelectValue placeholder="All Statuses" />
                </SelectTrigger>
                <SelectContent className="min-w-[200px]">
                  <SelectItem value="all">{lang === 'bn' ? 'সব স্ট্যাটাস' : 'All Statuses'}</SelectItem>
                  <SelectItem value="paid">{lang === 'bn' ? 'পরিশোধিত (Paid)' : 'Paid'}</SelectItem>
                  <SelectItem value="partial">{lang === 'bn' ? 'আংশিক বাকি (Partial)' : 'Partial'}</SelectItem>
                  <SelectItem value="due">{lang === 'bn' ? 'বাকি (Due)' : 'Due'}</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>
      </Card>

      {/* ---------------------------------------------------- */}
      {/* PURCHASES DATA TABLE                                 */}
      {/* ---------------------------------------------------- */}
      <Card className="p-0 border-slate-200/90 dark:border-zinc-800/80 dark:bg-[#121215] overflow-hidden">
        {isLoading ? (
          <div className="p-5 space-y-3">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <Skeleton key={i} className="h-12 w-full" />
            ))}
          </div>
        ) : filteredPurchases.length === 0 ? (
          <div className="p-12 text-center space-y-3">
            <div className="w-14 h-14 rounded-2xl bg-slate-100 dark:bg-zinc-800/80 text-slate-400 flex items-center justify-center mx-auto">
              <ShoppingBag className="w-7 h-7" />
            </div>
            <h3 className="text-sm font-semibold text-slate-800 dark:text-zinc-200">
              {lang === 'bn' ? 'কোনো ক্রয় রেকর্ড পাওয়া যায়নি' : 'No Purchase Records Found'}
            </h3>
            <p className="text-xs text-slate-500 dark:text-zinc-400 max-w-sm mx-auto">
              {lang === 'bn'
                ? 'সাপ্লায়ার থেকে নতুন স্টক আনতে বা ক্রয় রেকর্ড করতে "+ নতুন স্টক ক্রয় করুন" বাটনে চাপুন।'
                : 'Click "+ New Purchase / Stock In" to add fresh inventory from a supplier.'}
            </p>
            <div className="pt-2">
              <Button
                size="sm"
                onClick={handleOpenNewPurchase}
                className="bg-[#00df89] hover:bg-[#00c97b] text-[#011812] font-semibold text-xs h-9 px-4 rounded-xl cursor-pointer"
              >
                <Plus className="w-4 h-4 mr-1" />
                <span>{lang === 'bn' ? 'প্রথম স্টক ইন করুন' : 'Record First Purchase'}</span>
              </Button>
            </div>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-600 dark:text-zinc-300">
              <thead className="bg-slate-50 dark:bg-zinc-900/60 border-b border-slate-200 dark:border-zinc-800 text-[11px] font-bold text-slate-400 uppercase tracking-wider select-none">
                <tr>
                  <th className="py-3.5 px-4">{lang === 'bn' ? 'ইনভয়েস ও তারিখ' : 'Invoice & Date'}</th>
                  <th className="py-3.5 px-4">{lang === 'bn' ? 'সাপ্লায়ার' : 'Supplier'}</th>
                  <th className="py-3.5 px-4">{lang === 'bn' ? 'পণ্যসমূহ' : 'Items'}</th>
                  <th className="py-3.5 px-4">{lang === 'bn' ? 'মোট বিল' : 'Total Cost'}</th>
                  <th className="py-3.5 px-4">{lang === 'bn' ? 'পরিশোধ / বাকি' : 'Paid / Due'}</th>
                  <th className="py-3.5 px-4">{lang === 'bn' ? 'পেমেন্ট মাধ্যম' : 'Payment'}</th>
                  <th className="py-3.5 px-4">{lang === 'bn' ? 'স্ট্যাটাস' : 'Status'}</th>
                  <th className="py-3.5 px-4 text-right">{lang === 'bn' ? 'অ্যাকশন' : 'Actions'}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-zinc-800/80">
                {filteredPurchases.map((p) => (
                  <tr key={p._id} className="hover:bg-slate-50/60 dark:hover:bg-zinc-800/40 transition-colors">
                    <td className="py-3.5 px-4">
                      <div className="font-bold text-slate-900 dark:text-white font-mono text-[13px]">
                        #{p.purchase_number}
                      </div>
                      <div className="text-[11px] text-slate-400">
                        {new Date(p.created_at).toLocaleDateString()} &middot; {new Date(p.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </div>
                    </td>
                    <td className="py-3.5 px-4">
                      <div className="font-bold text-slate-900 dark:text-white">{p.supplier_name || 'General'}</div>
                      {p.supplier_phone && (
                        <div className="text-[11px] text-slate-400 font-mono">{p.supplier_phone}</div>
                      )}
                    </td>
                    <td className="py-3.5 px-4">
                      <div className="font-medium text-slate-800 dark:text-zinc-200">
                        {p.items?.length === 1
                          ? `${p.items[0].product_name} (${p.items[0].quantity} pcs)`
                          : `${p.items?.[0]?.product_name || 'Item'} + ${p.items?.length - 1} more`}
                      </div>
                      <div className="text-[10px] text-slate-400">
                        Total {p.items?.reduce((acc, it) => acc + (it.quantity || 0), 0)} units
                      </div>
                    </td>
                    <td className="py-3.5 px-4 font-bold font-mono text-slate-900 dark:text-white">
                      ৳{(p.net_amount || p.total_amount || 0).toLocaleString()}
                    </td>
                    <td className="py-3.5 px-4">
                      <div className="text-emerald-600 dark:text-[#00df89] font-medium font-mono">
                        ৳{(p.paid_amount || 0).toLocaleString()}
                      </div>
                      {(p.due_amount || 0) > 0 && (
                        <div className="text-amber-500 font-bold font-mono text-[11px]">
                          Due: ৳{(p.due_amount).toLocaleString()}
                        </div>
                      )}
                    </td>
                    <td className="py-3.5 px-4">
                      <span className="capitalize px-2 py-0.5 rounded-md bg-slate-100 dark:bg-zinc-800 font-medium text-[11px]">
                        {p.payment_method || 'cash'}
                      </span>
                    </td>
                    <td className="py-3.5 px-4">
                      <span
                        className={`inline-flex items-center px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                          p.payment_status === 'paid'
                            ? 'bg-emerald-500/10 text-emerald-600 dark:text-[#00df89]'
                            : p.payment_status === 'partial'
                            ? 'bg-blue-500/10 text-blue-600'
                            : 'bg-amber-500/15 text-amber-500'
                        }`}
                      >
                        {p.payment_status}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        {/* Pay Due Button */}
                        {(p.due_amount || 0) > 0 && p.supplier_id && (
                          <button
                            type="button"
                            onClick={() => handleOpenPayDue(p)}
                            title={lang === 'bn' ? 'বাকি পরিশোধ করুন' : 'Pay Due Balance'}
                            className="w-8 h-8 rounded-lg bg-amber-50 dark:bg-amber-950/40 hover:bg-amber-100 dark:hover:bg-amber-900/60 text-amber-600 dark:text-amber-400 flex items-center justify-center transition-colors cursor-pointer border border-amber-500/20 shadow-xs"
                          >
                            <Wallet className="w-3.5 h-3.5" />
                          </button>
                        )}

                        {/* View Details */}
                        <button
                          type="button"
                          onClick={() => setSelectedInvoice(p)}
                          title={lang === 'bn' ? 'বিস্তারিত দেখুন' : 'View details'}
                          className="w-8 h-8 rounded-lg bg-slate-100 dark:bg-zinc-800 hover:bg-slate-200 dark:hover:bg-zinc-700 text-slate-600 dark:text-zinc-300 flex items-center justify-center transition-colors cursor-pointer"
                        >
                          <Eye className="w-3.5 h-3.5" />
                        </button>

                        {/* Edit Purchase */}
                        <button
                          type="button"
                          onClick={() => handleOpenEdit(p)}
                          title={lang === 'bn' ? 'সম্পাদনা করুন' : 'Edit purchase'}
                          className="w-8 h-8 rounded-lg bg-blue-50 dark:bg-blue-950/40 hover:bg-blue-100 dark:hover:bg-blue-900/60 text-blue-600 dark:text-blue-400 flex items-center justify-center transition-colors cursor-pointer"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>

                        {/* Print Barcode Labels */}
                        <button
                          type="button"
                          onClick={() => handlePrintPurchaseLabels(p)}
                          title={lang === 'bn' ? 'বারকোড লেবেল প্রিন্ট করুন' : 'Print Barcode Labels for this purchase'}
                          className="w-8 h-8 rounded-lg bg-purple-50 dark:bg-purple-950/40 hover:bg-purple-100 dark:hover:bg-purple-900/60 text-purple-600 dark:text-purple-400 flex items-center justify-center transition-colors cursor-pointer border border-purple-500/20"
                        >
                          <Barcode className="w-3.5 h-3.5" />
                        </button>

                        {/* Print Receipt */}
                        <button
                          type="button"
                          onClick={() => handlePrintReceipt(p)}
                          title={lang === 'bn' ? 'রসিদ প্রিন্ট করুন' : 'Print receipt'}
                          className="w-8 h-8 rounded-lg bg-emerald-50 dark:bg-emerald-950/40 hover:bg-emerald-100 dark:hover:bg-emerald-900/60 text-[#00a86b] dark:text-[#00df89] flex items-center justify-center transition-colors cursor-pointer"
                        >
                          <Printer className="w-3.5 h-3.5" />
                        </button>

                        {/* Delete Purchase */}
                        <button
                          type="button"
                          onClick={() => setDeleteTarget(p)}
                          title={lang === 'bn' ? 'মুছে ফেলুন' : 'Delete purchase'}
                          className="w-8 h-8 rounded-lg bg-rose-50 dark:bg-rose-950/40 hover:bg-rose-100 dark:hover:bg-rose-900/60 text-rose-600 dark:text-rose-400 flex items-center justify-center transition-colors cursor-pointer"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
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
      {/* NEW PURCHASE / STOCK IN MODAL                        */}
      {/* ---------------------------------------------------- */}
      {isPurchaseModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs animate-in fade-in duration-150">
          <Card className="max-w-2xl w-full p-6 bg-white dark:bg-[#121215] border-slate-200 dark:border-zinc-800 space-y-4 shadow-2xl max-h-[90vh] flex flex-col">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-zinc-800 pb-3 shrink-0">
              <h2 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <ShoppingBag className="w-5 h-5 text-[#00df89]" />
                <span>{lang === 'bn' ? 'নতুন পণ্য ক্রয় ও স্টক ইন' : 'New Purchase / Stock In'}</span>
              </h2>
              <button
                type="button"
                onClick={() => setIsPurchaseModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 p-1 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmitPurchase} className="flex-1 overflow-y-auto space-y-4 pr-1 text-xs">
              
              {/* Supplier Selection with Inline Supplier Creator */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="font-bold text-slate-700 dark:text-zinc-300">
                    {lang === 'bn' ? 'সাপ্লায়ার নির্বাচন' : 'Supplier'}
                  </label>
                  <button
                    type="button"
                    onClick={() => setShowInlineSupplier(!showInlineSupplier)}
                    className="text-[11px] font-semibold text-[#00a86b] dark:text-[#00df89] hover:underline flex items-center gap-1 cursor-pointer"
                  >
                    <Plus className="w-3 h-3" />
                    <span>{showInlineSupplier ? (lang === 'bn' ? 'তালিকা থেকে বেছে নিন' : 'Choose existing') : (lang === 'bn' ? '+ নতুন সাপ্লায়ার' : '+ Add New Supplier')}</span>
                  </button>
                </div>

                {showInlineSupplier ? (
                  <div className="p-3 rounded-2xl bg-emerald-500/5 border border-emerald-500/20 space-y-2">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      <input
                        type="text"
                        placeholder={lang === 'bn' ? 'সাপ্লায়ারের নাম *' : 'Supplier Name *'}
                        value={newSupplierName}
                        onChange={(e) => setNewSupplierName(e.target.value)}
                        className="px-3 py-1.5 rounded-lg bg-white dark:bg-[#09090b] border border-slate-200 dark:border-zinc-800 text-xs text-slate-900 dark:text-white outline-none"
                      />
                      <input
                        type="text"
                        placeholder={lang === 'bn' ? 'ফোন নম্বর' : 'Phone Number'}
                        value={newSupplierPhone}
                        onChange={(e) => setNewSupplierPhone(e.target.value)}
                        className="px-3 py-1.5 rounded-lg bg-white dark:bg-[#09090b] border border-slate-200 dark:border-zinc-800 text-xs text-slate-900 dark:text-white outline-none"
                      />
                    </div>
                    <div className="flex justify-end">
                      <Button
                        type="button"
                        size="sm"
                        disabled={isCreatingSupplier || !newSupplierName.trim()}
                        onClick={handleCreateSupplierInline}
                        className="bg-[#00df89] hover:bg-[#00c97b] text-[#011812] font-semibold text-xs h-8 px-3"
                      >
                        {isCreatingSupplier ? <Loader2 className="w-3 h-3 animate-spin" /> : (lang === 'bn' ? 'সেভ ও সিলেক্ট' : 'Save & Select')}
                      </Button>
                    </div>
                  </div>
                ) : (
                  <Select
                    value={purchaseForm.supplier_id || '__walk_in__'}
                    onValueChange={(val) => {
                      if (val === '__walk_in__') {
                        setPurchaseForm({ ...purchaseForm, supplier_id: '', supplier_name: 'General / Walk-in Supplier' });
                      } else {
                        const found = suppliers.find((s) => s._id === val);
                        setPurchaseForm({
                          ...purchaseForm,
                          supplier_id: val,
                          supplier_name: found ? found.name : '',
                        });
                      }
                    }}
                  >
                    <SelectTrigger className="w-full bg-slate-50 dark:bg-[#09090b]">
                      <SelectValue placeholder="General / Walk-in Supplier" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="__walk_in__">General / Walk-in Supplier</SelectItem>
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

              {/* Items Section */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="font-bold text-slate-700 dark:text-zinc-300">
                    {lang === 'bn' ? 'ক্রয়কৃত পণ্যসমূহ *' : 'Purchase Line Items *'}
                  </label>
                  <button
                    type="button"
                    onClick={handleAddItemRow}
                    className="text-[11px] font-semibold text-[#00a86b] dark:text-[#00df89] hover:underline flex items-center gap-1 cursor-pointer"
                  >
                    <PlusCircle className="w-3.5 h-3.5" />
                    <span>{lang === 'bn' ? '+ আরো পণ্য যোগ করুন' : '+ Add Item Line'}</span>
                  </button>
                </div>

                <div className="space-y-2.5 overflow-visible">
                  {purchaseForm.items.map((item, idx) => (
                    <div
                      key={idx}
                      className="p-2.5 rounded-xl bg-slate-50 dark:bg-zinc-900/60 border border-slate-200/80 dark:border-zinc-800/80 grid grid-cols-12 gap-2 items-center relative overflow-visible"
                    >
                      {/* Product Selector */}
                      <div className="col-span-12 sm:col-span-5">
                        <div className="flex items-center justify-between mb-0.5">
                          <label className="block text-[10px] font-bold text-slate-400">
                            {lang === 'bn' ? 'পণ্য' : 'Product'}
                          </label>
                          <button
                            type="button"
                            onClick={() => handleOpenQuickAddProduct(idx, 'create')}
                            className="text-[10px] font-semibold text-[#00a86b] dark:text-[#00df89] hover:underline flex items-center gap-0.5 cursor-pointer"
                          >
                            <Plus className="w-2.5 h-2.5" />
                            <span>{lang === 'bn' ? '+ নতুন পণ্য' : '+ New Product'}</span>
                          </button>
                        </div>
                        <Select
                          value={item.product_id || '__none__'}
                          onValueChange={(val) => handleItemChange(idx, 'product_id', val === '__none__' ? '' : val)}
                        >
                          <SelectTrigger className="w-full h-8 text-xs bg-white dark:bg-[#09090b]">
                            <SelectValue placeholder={lang === 'bn' ? 'পণ্য বেছে নিন...' : 'Select product...'} />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem
                              value="__add_new__"
                              className="text-[#00a86b] dark:text-[#00df89] font-bold border-b border-slate-100 dark:border-zinc-800/80 mb-1"
                            >
                              + {lang === 'bn' ? 'নতুন পণ্য তৈরি করুন...' : 'Add New Product...'}
                            </SelectItem>
                            <SelectItem value="__none__">{lang === 'bn' ? 'পণ্য বেছে নিন...' : 'Select product...'}</SelectItem>
                            {products.map((prod) => (
                              <SelectItem
                                key={prod._id}
                                value={prod._id}
                                onDelete={() => promptDeleteProduct(prod._id, prod.name)}
                                deleteTitle={lang === 'bn' ? 'পণ্য মুছুন' : 'Delete product'}
                              >
                                {prod.name} {prod.has_variants ? `(${prod.variants?.length || 0} Variants)` : `(Stock: ${prod.stock_quantity || 0})`}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>

                        {/* Variant selector dropdown if product has variants */}
                        {(() => {
                          const p = products.find((pr) => String(pr._id) === String(item.product_id));
                          if (p && p.has_variants && Array.isArray(p.variants) && p.variants.length > 0) {
                            return (
                              <div className="mt-1.5 space-y-1">
                                <div className="flex items-center justify-between">
                                  <span className="text-[10px] font-bold text-emerald-700 dark:text-[#00df89] flex items-center gap-1">
                                    <Layers className="w-3 h-3" />
                                    {lang === 'bn' ? 'ভ্যারিয়েশন:' : 'Variation:'}
                                  </span>
                                  {p.variants.length > 1 && (
                                    <button
                                      type="button"
                                      onClick={() => handleAddAllVariantsToPurchase(p._id, 'create')}
                                      className="text-[10px] font-bold text-[#00a86b] dark:text-[#00df89] hover:underline flex items-center gap-0.5 cursor-pointer"
                                    >
                                      <Plus className="w-2.5 h-2.5" />
                                      {lang === 'bn' ? `সবগুলো (${p.variants.length}) যোগ করুন` : `+ Add all (${p.variants.length})`}
                                    </button>
                                  )}
                                </div>
                                <Select
                                  value={item.variant_id || '__none__'}
                                  onValueChange={(val) => {
                                    if (val === '__add_new_variant__') {
                                      const newName = window.prompt(lang === 'bn' ? 'নতুন ভ্যারিয়েশনের নাম লিখুন (যেমন: Red, XL, 100ml):' : 'Enter new variation name (e.g. Red, XL, 100ml):');
                                      if (newName && newName.trim()) {
                                        const trimmed = newName.trim();
                                        const updated = [...purchaseForm.items];
                                        updated[idx] = {
                                          ...updated[idx],
                                          variant_id: '',
                                          variant_name: trimmed,
                                          product_name: `${p.name} (${trimmed})`,
                                        };
                                        setPurchaseForm((prev) => ({ ...prev, items: updated }));
                                        toast.success(lang === 'bn' ? `নতুন ভ্যারিয়েশন "${trimmed}" যোগ হয়েছে!` : `New variation "${trimmed}" added!`);
                                      }
                                      return;
                                    }
                                    handleItemChange(idx, 'variant_id', val === '__none__' ? '' : val);
                                  }}
                                >
                                  <SelectTrigger className="w-full h-7 text-[11px] bg-emerald-500/10 border-emerald-500/30 text-emerald-800 dark:text-emerald-300 font-semibold">
                                    <SelectValue placeholder={lang === 'bn' ? 'ভ্যারিয়েশন বাছুন...' : 'Choose variant...'} />
                                  </SelectTrigger>
                                  <SelectContent>
                                    <SelectItem value="__none__">{lang === 'bn' ? 'মূল পণ্য' : 'Base Product'}</SelectItem>
                                    {p.variants.map((v) => (
                                      <SelectItem key={v._id || v.id} value={v._id || v.id}>
                                        {v.name} (Stock: {v.stock_quantity || 0}) — ৳{v.cost_price || p.cost_price}
                                      </SelectItem>
                                    ))}
                                    <SelectItem value="__add_new_variant__" className="text-emerald-600 dark:text-emerald-400 font-bold">
                                      {lang === 'bn' ? '+ নতুন ভ্যারিয়েশন তৈরি করুন' : '+ Create New Variation'}
                                    </SelectItem>
                                  </SelectContent>
                                </Select>
                              </div>
                            );
                          }
                          return null;
                        })()}
                      </div>

                      {/* Quantity */}
                      <div className="col-span-4 sm:col-span-2">
                        <label className="block text-[10px] font-bold text-slate-400 mb-0.5">
                          {lang === 'bn' ? 'পরিমাণ' : 'Qty'}
                        </label>
                        <input
                          type="number"
                          min="1"
                          required
                          value={item.quantity}
                          onChange={(e) => handleItemChange(idx, 'quantity', e.target.value)}
                          className="w-full px-2.5 py-1 h-8 rounded-lg bg-white dark:bg-[#09090b] border border-slate-200 dark:border-zinc-800 text-xs text-slate-900 dark:text-white outline-none focus:ring-1 focus:ring-[#00df89]"
                        />
                      </div>

                      {/* Unit Cost */}
                      <div className="col-span-4 sm:col-span-2">
                        <label className="block text-[10px] font-bold text-slate-400 mb-0.5">
                          {lang === 'bn' ? 'ক্রয়মূল্য (৳)' : 'Unit Cost (৳)'}
                        </label>
                        <input
                          type="number"
                          min="0"
                          step="any"
                          required
                          value={item.unit_cost}
                          onChange={(e) => handleItemChange(idx, 'unit_cost', e.target.value)}
                          className="w-full px-2.5 py-1 h-8 rounded-lg bg-white dark:bg-[#09090b] border border-slate-200 dark:border-zinc-800 text-xs text-slate-900 dark:text-white outline-none focus:ring-1 focus:ring-[#00df89]"
                        />
                      </div>

                      {/* Total */}
                      <div className="col-span-3 sm:col-span-2">
                        <label className="block text-[10px] font-bold text-slate-400 mb-0.5">
                          {lang === 'bn' ? 'মোট' : 'Total'}
                        </label>
                        <div className="h-8 flex items-center font-bold text-slate-900 dark:text-white font-mono text-xs">
                          ৳{(item.total_cost || 0).toLocaleString()}
                        </div>
                      </div>

                      {/* Delete Row */}
                      <div className="col-span-1 flex items-center justify-end pt-3 sm:pt-0">
                        {purchaseForm.items.length > 1 && (
                          <button
                            type="button"
                            onClick={() => handleRemoveItemRow(idx)}
                            className="text-slate-400 hover:text-rose-500 p-1 cursor-pointer"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Totals & Payment Breakdown */}
              <div className="p-4 rounded-2xl bg-slate-50 dark:bg-zinc-900/60 border border-slate-200/80 dark:border-zinc-800/80 space-y-3">
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="block font-bold text-slate-700 dark:text-zinc-300 mb-1">
                      {lang === 'bn' ? 'ছাড় / ডিসকাউন্ট (৳)' : 'Discount (৳)'}
                    </label>
                    <input
                      type="number"
                      min="0"
                      value={purchaseForm.discount}
                      onChange={(e) => setPurchaseForm({ ...purchaseForm, discount: e.target.value })}
                      className="w-full px-3 py-1.5 rounded-xl bg-white dark:bg-[#09090b] border border-slate-200 dark:border-zinc-800 text-xs text-slate-900 dark:text-white outline-none"
                    />
                  </div>

                  <div>
                    <label className="block font-bold text-slate-700 dark:text-zinc-300 mb-1">
                      {lang === 'bn' ? 'পরিশোধিত অর্থ (৳)' : 'Paid Amount (৳)'}
                    </label>
                    <input
                      type="number"
                      min="0"
                      placeholder={`৳${calculatedNet}`}
                      value={purchaseForm.paid_amount}
                      onChange={(e) => setPurchaseForm({ ...purchaseForm, paid_amount: e.target.value })}
                      className="w-full px-3 py-1.5 rounded-xl bg-white dark:bg-[#09090b] border border-slate-200 dark:border-zinc-800 text-xs text-slate-900 dark:text-white outline-none"
                    />
                  </div>

                  <div>
                    <label className="block font-bold text-slate-700 dark:text-zinc-300 mb-1">
                      {lang === 'bn' ? 'পেমেন্ট মাধ্যম' : 'Payment Method'}
                    </label>
                    <Select
                      value={purchaseForm.payment_method}
                      onValueChange={(val) => setPurchaseForm({ ...purchaseForm, payment_method: val })}
                    >
                      <SelectTrigger className="w-full bg-white dark:bg-[#09090b]">
                        <SelectValue placeholder="Cash" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="cash">{lang === 'bn' ? 'নগদ (Cash)' : 'Cash'}</SelectItem>
                        <SelectItem value="bkash">bKash</SelectItem>
                        <SelectItem value="nagad">Nagad</SelectItem>
                        <SelectItem value="rocket">Rocket</SelectItem>
                        <SelectItem value="card">{lang === 'bn' ? 'কার্ড (Card)' : 'Card'}</SelectItem>
                        <SelectItem value="bank_transfer">{lang === 'bn' ? 'ব্যাংক ট্রান্সফার' : 'Bank Transfer'}</SelectItem>
                        <SelectItem value="due">{lang === 'bn' ? 'সম্পূর্ণ বাকি (Due)' : 'Full Due'}</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="flex items-center justify-between pt-2 border-t border-slate-200 dark:border-zinc-800 text-xs font-bold">
                  <div className="space-y-0.5">
                    <span className="text-slate-500">{lang === 'bn' ? 'সর্বমোট বিল:' : 'Total Amount:'} ৳{calculatedTotal.toLocaleString()}</span>
                    {calculatedDue > 0 && (
                      <span className="text-amber-500 block">
                        {lang === 'bn' ? 'সাপ্লায়ার বাকি থাকবে:' : 'Due Balance:'} ৳{calculatedDue.toLocaleString()}
                      </span>
                    )}
                  </div>
                  <div className="text-right">
                    <span className="text-sm font-black text-slate-900 dark:text-white font-mono">
                      {lang === 'bn' ? 'নিট বিল:' : 'Net Bill:'} ৳{calculatedNet.toLocaleString()}
                    </span>
                  </div>
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 dark:text-zinc-300 mb-1">
                  {lang === 'bn' ? 'মন্তব্য বা অতিরিক্ত নোট' : 'Notes / Remarks'}
                </label>
                <textarea
                  rows="2"
                  placeholder={lang === 'bn' ? 'ক্রয় সংক্রান্ত কোনো মন্তব্য...' : 'Any optional remarks...'}
                  value={purchaseForm.notes}
                  onChange={(e) => setPurchaseForm({ ...purchaseForm, notes: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-[#09090b] border border-slate-200 dark:border-zinc-800 text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-[#00df89]"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100 dark:border-zinc-800 shrink-0">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setIsPurchaseModalOpen(false)}
                  className="h-9 px-4 rounded-xl cursor-pointer"
                >
                  {lang === 'bn' ? 'বাতিল' : 'Cancel'}
                </Button>
                <Button
                  type="submit"
                  disabled={isSubmitting}
                  className="bg-[#00df89] hover:bg-[#00c97b] text-[#011812] font-bold text-xs h-9 px-4 rounded-xl cursor-pointer disabled:opacity-50"
                >
                  {isSubmitting ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    (lang === 'bn' ? 'ক্রয় রেকর্ড ও স্টক ইন' : 'Save Purchase & Stock In')
                  )}
                </Button>
              </div>
            </form>
          </Card>
        </div>
      )}

      {/* ---------------------------------------------------- */}
      {/* EDIT PURCHASE MODAL                                  */}
      {/* ---------------------------------------------------- */}
      {isEditModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs animate-in fade-in duration-150">
          <Card className="max-w-2xl w-full p-6 bg-white dark:bg-[#121215] border-slate-200 dark:border-zinc-800 space-y-4 shadow-2xl max-h-[90vh] flex flex-col">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-zinc-800 pb-3 shrink-0">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-blue-500/10 text-blue-500 flex items-center justify-center">
                  <Edit2 className="w-4 h-4" />
                </div>
                <div>
                  <h2 className="text-base font-bold text-slate-900 dark:text-white">
                    {lang === 'bn' ? 'ক্রয় ইনভয়েস সম্পাদনা' : 'Edit Purchase Invoice'}
                  </h2>
                  <p className="text-[11px] font-mono text-slate-400">
                    #{editingPurchase?.purchase_number}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsEditModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 p-1 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmitEdit} className="flex-1 overflow-y-auto space-y-4 pr-1 text-xs">
              
              {/* Supplier Selection */}
              <div>
                <label className="font-bold text-slate-700 dark:text-zinc-300 block mb-1">
                  {lang === 'bn' ? 'সাপ্লায়ার নির্বাচন' : 'Supplier'}
                </label>
                <Select
                  value={editForm.supplier_id || '__walk_in__'}
                  onValueChange={(val) => {
                    if (val === '__walk_in__') {
                      setEditForm({ ...editForm, supplier_id: '', supplier_name: 'General / Walk-in Supplier' });
                    } else {
                      const found = suppliers.find((s) => s._id === val);
                      setEditForm({
                        ...editForm,
                        supplier_id: val,
                        supplier_name: found ? found.name : '',
                      });
                    }
                  }}
                >
                  <SelectTrigger className="w-full bg-slate-50 dark:bg-[#09090b]">
                    <SelectValue placeholder="General / Walk-in Supplier" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="__walk_in__">General / Walk-in Supplier</SelectItem>
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
              </div>

              {/* Items Section */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="font-bold text-slate-700 dark:text-zinc-300">
                    {lang === 'bn' ? 'ক্রয়কৃত পণ্যসমূহ *' : 'Purchase Line Items *'}
                  </label>
                  <button
                    type="button"
                    onClick={handleAddEditItemRow}
                    className="text-[11px] font-semibold text-[#00a86b] dark:text-[#00df89] hover:underline flex items-center gap-1 cursor-pointer"
                  >
                    <PlusCircle className="w-3.5 h-3.5" />
                    <span>{lang === 'bn' ? '+ আরো পণ্য যোগ করুন' : '+ Add Item Line'}</span>
                  </button>
                </div>

                <div className="space-y-2.5 overflow-visible">
                  {editForm.items.map((item, idx) => (
                    <div
                      key={idx}
                      className="p-2.5 rounded-xl bg-slate-50 dark:bg-zinc-900/60 border border-slate-200/80 dark:border-zinc-800/80 grid grid-cols-12 gap-2 items-center relative overflow-visible"
                    >
                      {/* Product Selector */}
                      <div className="col-span-12 sm:col-span-5">
                        <div className="flex items-center justify-between mb-0.5">
                          <label className="block text-[10px] font-bold text-slate-400">
                            {lang === 'bn' ? 'পণ্য' : 'Product'}
                          </label>
                          <button
                            type="button"
                            onClick={() => handleOpenQuickAddProduct(idx, 'edit')}
                            className="text-[10px] font-semibold text-[#00a86b] dark:text-[#00df89] hover:underline flex items-center gap-0.5 cursor-pointer"
                          >
                            <Plus className="w-2.5 h-2.5" />
                            <span>{lang === 'bn' ? '+ নতুন পণ্য' : '+ New Product'}</span>
                          </button>
                        </div>
                        <Select
                          value={item.product_id || '__none__'}
                          onValueChange={(val) => handleEditItemChange(idx, 'product_id', val === '__none__' ? '' : val)}
                        >
                          <SelectTrigger className="w-full h-8 text-xs bg-white dark:bg-[#09090b]">
                            <SelectValue placeholder={lang === 'bn' ? 'পণ্য বেছে নিন...' : 'Select product...'} />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem
                              value="__add_new__"
                              className="text-[#00a86b] dark:text-[#00df89] font-bold border-b border-slate-100 dark:border-zinc-800/80 mb-1"
                            >
                              + {lang === 'bn' ? 'নতুন পণ্য তৈরি করুন...' : 'Add New Product...'}
                            </SelectItem>
                            <SelectItem value="__none__">{lang === 'bn' ? 'পণ্য বেছে নিন...' : 'Select product...'}</SelectItem>
                            {products.map((prod) => (
                              <SelectItem
                                key={prod._id}
                                value={prod._id}
                                onDelete={() => promptDeleteProduct(prod._id, prod.name)}
                                deleteTitle={lang === 'bn' ? 'পণ্য মুছুন' : 'Delete product'}
                              >
                                {prod.name} {prod.has_variants ? `(${prod.variants?.length || 0} Variants)` : `(Stock: ${prod.stock_quantity || 0})`}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>

                        {/* Variant selector dropdown if product has variants */}
                        {(() => {
                          const p = products.find((pr) => String(pr._id) === String(item.product_id));
                          if (p && p.has_variants && Array.isArray(p.variants) && p.variants.length > 0) {
                            return (
                              <div className="mt-1.5 space-y-1">
                                <div className="flex items-center justify-between">
                                  <span className="text-[10px] font-bold text-emerald-700 dark:text-[#00df89] flex items-center gap-1">
                                    <Layers className="w-3 h-3" />
                                    {lang === 'bn' ? 'ভ্যারিয়েশন:' : 'Variation:'}
                                  </span>
                                  {p.variants.length > 1 && (
                                    <button
                                      type="button"
                                      onClick={() => handleAddAllVariantsToPurchase(p._id, 'edit')}
                                      className="text-[10px] font-bold text-[#00a86b] dark:text-[#00df89] hover:underline flex items-center gap-0.5 cursor-pointer"
                                    >
                                      <Plus className="w-2.5 h-2.5" />
                                      {lang === 'bn' ? `সবগুলো (${p.variants.length}) যোগ করুন` : `+ Add all (${p.variants.length})`}
                                    </button>
                                  )}
                                </div>
                                <Select
                                  value={item.variant_id || '__none__'}
                                  onValueChange={(val) => {
                                    if (val === '__add_new_variant__') {
                                      const newName = window.prompt(lang === 'bn' ? 'নতুন ভ্যারিয়েশনের নাম লিখুন (যেমন: Red, XL, 100ml):' : 'Enter new variation name (e.g. Red, XL, 100ml):');
                                      if (newName && newName.trim()) {
                                        const trimmed = newName.trim();
                                        const updated = [...editForm.items];
                                        updated[idx] = {
                                          ...updated[idx],
                                          variant_id: '',
                                          variant_name: trimmed,
                                          product_name: `${p.name} (${trimmed})`,
                                        };
                                        setEditForm((prev) => ({ ...prev, items: updated }));
                                        toast.success(lang === 'bn' ? `নতুন ভ্যারিয়েশন "${trimmed}" যোগ হয়েছে!` : `New variation "${trimmed}" added!`);
                                      }
                                      return;
                                    }
                                    handleEditItemChange(idx, 'variant_id', val === '__none__' ? '' : val);
                                  }}
                                >
                                  <SelectTrigger className="w-full h-7 text-[11px] bg-emerald-500/10 border-emerald-500/30 text-emerald-800 dark:text-emerald-300 font-semibold">
                                    <SelectValue placeholder={lang === 'bn' ? 'ভ্যারিয়েশন বাছুন...' : 'Choose variant...'} />
                                  </SelectTrigger>
                                  <SelectContent>
                                    <SelectItem value="__none__">{lang === 'bn' ? 'মূল পণ্য' : 'Base Product'}</SelectItem>
                                    {p.variants.map((v) => (
                                      <SelectItem key={v._id || v.id} value={v._id || v.id}>
                                        {v.name} (Stock: {v.stock_quantity || 0}) — ৳{v.cost_price || p.cost_price}
                                      </SelectItem>
                                    ))}
                                    <SelectItem value="__add_new_variant__" className="text-emerald-600 dark:text-emerald-400 font-bold">
                                      {lang === 'bn' ? '+ নতুন ভ্যারিয়েশন তৈরি করুন' : '+ Create New Variation'}
                                    </SelectItem>
                                  </SelectContent>
                                </Select>
                              </div>
                            );
                          }
                          return null;
                        })()}
                      </div>

                      {/* Quantity */}
                      <div className="col-span-4 sm:col-span-2">
                        <label className="block text-[10px] font-bold text-slate-400 mb-0.5">
                          {lang === 'bn' ? 'পরিমাণ' : 'Qty'}
                        </label>
                        <input
                          type="number"
                          min="1"
                          required
                          value={item.quantity}
                          onChange={(e) => handleEditItemChange(idx, 'quantity', e.target.value)}
                          className="w-full px-2.5 py-1 h-8 rounded-lg bg-white dark:bg-[#09090b] border border-slate-200 dark:border-zinc-800 text-xs text-slate-900 dark:text-white outline-none focus:ring-1 focus:ring-[#00df89]"
                        />
                      </div>

                      {/* Unit Cost */}
                      <div className="col-span-4 sm:col-span-2">
                        <label className="block text-[10px] font-bold text-slate-400 mb-0.5">
                          {lang === 'bn' ? 'ক্রয়মূল্য (৳)' : 'Unit Cost (৳)'}
                        </label>
                        <input
                          type="number"
                          min="0"
                          step="any"
                          required
                          value={item.unit_cost}
                          onChange={(e) => handleEditItemChange(idx, 'unit_cost', e.target.value)}
                          className="w-full px-2.5 py-1 h-8 rounded-lg bg-white dark:bg-[#09090b] border border-slate-200 dark:border-zinc-800 text-xs text-slate-900 dark:text-white outline-none focus:ring-1 focus:ring-[#00df89]"
                        />
                      </div>

                      {/* Total */}
                      <div className="col-span-3 sm:col-span-2">
                        <label className="block text-[10px] font-bold text-slate-400 mb-0.5">
                          {lang === 'bn' ? 'মোট' : 'Total'}
                        </label>
                        <div className="h-8 flex items-center font-bold text-slate-900 dark:text-white font-mono text-xs">
                          ৳{(item.total_cost || 0).toLocaleString()}
                        </div>
                      </div>

                      {/* Delete Row */}
                      <div className="col-span-1 flex items-center justify-end pt-3 sm:pt-0">
                        {editForm.items.length > 1 && (
                          <button
                            type="button"
                            onClick={() => handleRemoveEditItemRow(idx)}
                            className="text-slate-400 hover:text-rose-500 p-1 cursor-pointer"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Totals & Payment Breakdown */}
              <div className="p-4 rounded-2xl bg-slate-50 dark:bg-zinc-900/60 border border-slate-200/80 dark:border-zinc-800/80 space-y-3">
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="block font-bold text-slate-700 dark:text-zinc-300 mb-1">
                      {lang === 'bn' ? 'ছাড় / ডিসকাউন্ট (৳)' : 'Discount (৳)'}
                    </label>
                    <input
                      type="number"
                      min="0"
                      value={editForm.discount}
                      onChange={(e) => setEditForm({ ...editForm, discount: e.target.value })}
                      className="w-full px-3 py-1.5 rounded-xl bg-white dark:bg-[#09090b] border border-slate-200 dark:border-zinc-800 text-xs text-slate-900 dark:text-white outline-none"
                    />
                  </div>

                  <div>
                    <label className="block font-bold text-slate-700 dark:text-zinc-300 mb-1">
                      {lang === 'bn' ? 'পরিশোধিত অর্থ (৳)' : 'Paid Amount (৳)'}
                    </label>
                    <input
                      type="number"
                      min="0"
                      placeholder={`৳${editCalculatedNet}`}
                      value={editForm.paid_amount}
                      onChange={(e) => setEditForm({ ...editForm, paid_amount: e.target.value })}
                      className="w-full px-3 py-1.5 rounded-xl bg-white dark:bg-[#09090b] border border-slate-200 dark:border-zinc-800 text-xs text-slate-900 dark:text-white outline-none"
                    />
                  </div>

                  <div>
                    <label className="block font-bold text-slate-700 dark:text-zinc-300 mb-1">
                      {lang === 'bn' ? 'পেমেন্ট মাধ্যম' : 'Payment Method'}
                    </label>
                    <Select
                      value={editForm.payment_method}
                      onValueChange={(val) => setEditForm({ ...editForm, payment_method: val })}
                    >
                      <SelectTrigger className="w-full bg-white dark:bg-[#09090b]">
                        <SelectValue placeholder="Cash" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="cash">{lang === 'bn' ? 'নগদ (Cash)' : 'Cash'}</SelectItem>
                        <SelectItem value="bkash">bKash</SelectItem>
                        <SelectItem value="nagad">Nagad</SelectItem>
                        <SelectItem value="rocket">Rocket</SelectItem>
                        <SelectItem value="card">{lang === 'bn' ? 'কার্ড (Card)' : 'Card'}</SelectItem>
                        <SelectItem value="bank_transfer">{lang === 'bn' ? 'ব্যাংক ট্রান্সফার' : 'Bank Transfer'}</SelectItem>
                        <SelectItem value="due">{lang === 'bn' ? 'সম্পূর্ণ বাকি (Due)' : 'Full Due'}</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="flex items-center justify-between pt-2 border-t border-slate-200 dark:border-zinc-800 text-xs font-bold">
                  <div className="space-y-0.5">
                    <span className="text-slate-500">{lang === 'bn' ? 'সর্বমোট বিল:' : 'Total Amount:'} ৳{editCalculatedTotal.toLocaleString()}</span>
                    {editCalculatedDue > 0 && (
                      <span className="text-amber-500 block">
                        {lang === 'bn' ? 'সাপ্লায়ার বাকি থাকবে:' : 'Due Balance:'} ৳{editCalculatedDue.toLocaleString()}
                      </span>
                    )}
                  </div>
                  <div className="text-right">
                    <span className="text-sm font-black text-slate-900 dark:text-white font-mono">
                      {lang === 'bn' ? 'নিট বিল:' : 'Net Bill:'} ৳{editCalculatedNet.toLocaleString()}
                    </span>
                  </div>
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 dark:text-zinc-300 mb-1">
                  {lang === 'bn' ? 'মন্তব্য বা অতিরিক্ত নোট' : 'Notes / Remarks'}
                </label>
                <textarea
                  rows="2"
                  placeholder={lang === 'bn' ? 'ক্রয় সংক্রান্ত কোনো মন্তব্য...' : 'Any optional remarks...'}
                  value={editForm.notes}
                  onChange={(e) => setEditForm({ ...editForm, notes: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-[#09090b] border border-slate-200 dark:border-zinc-800 text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-[#00df89]"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100 dark:border-zinc-800 shrink-0">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setIsEditModalOpen(false)}
                  className="h-9 px-4 rounded-xl cursor-pointer"
                >
                  {lang === 'bn' ? 'বাতিল' : 'Cancel'}
                </Button>
                <Button
                  type="submit"
                  disabled={isSubmitting}
                  className="bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs h-9 px-4 rounded-xl cursor-pointer disabled:opacity-50"
                >
                  {isSubmitting ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    (lang === 'bn' ? 'আপডেট সম্পন্ন করুন' : 'Save Changes')
                  )}
                </Button>
              </div>
            </form>
          </Card>
        </div>
      )}

      {/* ---------------------------------------------------- */}
      {/* INVOICE DETAILS MODAL                                */}
      {/* ---------------------------------------------------- */}
      {selectedInvoice && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs animate-in fade-in duration-150">
          <Card className="max-w-lg w-full p-6 bg-white dark:bg-[#121215] border-slate-200 dark:border-zinc-800 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-zinc-800 pb-3">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-emerald-500/10 text-emerald-600 flex items-center justify-center">
                  <Receipt className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-base font-bold text-slate-900 dark:text-white">
                    {lang === 'bn' ? 'ক্রয় ইনভয়েস বিবরণ' : 'Purchase Invoice Details'}
                  </h2>
                  <p className="text-[11px] font-mono text-slate-400 font-bold">
                    #{selectedInvoice.purchase_number}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setSelectedInvoice(null)}
                className="text-slate-400 hover:text-slate-600 p-1 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div className="p-3 rounded-2xl bg-slate-50 dark:bg-zinc-900/60 border border-slate-200/80 dark:border-zinc-800/80 flex items-center justify-between">
                <div>
                  <p className="font-bold text-slate-900 dark:text-white">{selectedInvoice.supplier_name}</p>
                  {selectedInvoice.supplier_phone && (
                    <p className="text-[11px] text-slate-400 font-mono">{selectedInvoice.supplier_phone}</p>
                  )}
                </div>
                <div className="text-right">
                  <span className="text-[11px] text-slate-400 block">
                    {new Date(selectedInvoice.created_at).toLocaleDateString()}
                  </span>
                  <span
                    className={`px-2 py-0.5 rounded-full font-bold text-[10px] uppercase ${
                      selectedInvoice.payment_status === 'paid'
                        ? 'bg-emerald-500/10 text-emerald-600'
                        : selectedInvoice.payment_status === 'partial'
                        ? 'bg-blue-500/10 text-blue-600'
                        : 'bg-amber-500/15 text-amber-500'
                    }`}
                  >
                    {selectedInvoice.payment_status}
                  </span>
                </div>
              </div>

              {/* Items List */}
              <div className="space-y-1.5">
                <p className="font-bold text-slate-700 dark:text-zinc-300">
                  {lang === 'bn' ? 'পণ্য বিবরণী' : 'Item Breakdown'}
                </p>
                <div className="divide-y divide-slate-100 dark:divide-zinc-800 border border-slate-200/80 dark:border-zinc-800 rounded-2xl p-2.5 bg-white dark:bg-[#09090b]">
                  {selectedInvoice.items?.map((it, idx) => (
                    <div key={idx} className="py-2 flex items-center justify-between text-xs">
                      <div>
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <p className="font-bold text-slate-900 dark:text-white">{it.product_name}</p>
                          {it.variant_name && (
                            <span className="px-1.5 py-0.5 rounded-md text-[10px] font-bold bg-emerald-500/10 text-emerald-700 dark:text-[#00df89] border border-emerald-500/20">
                              🎨 {it.variant_name}
                            </span>
                          )}
                        </div>
                        <p className="text-[11px] text-slate-400">
                          {it.quantity} &times; ৳{(it.unit_cost || 0).toLocaleString()}
                        </p>
                      </div>
                      <p className="font-bold font-mono text-slate-900 dark:text-white">
                        ৳{(it.total_cost || 0).toLocaleString()}
                      </p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Totals Breakdown */}
              <div className="p-3 rounded-2xl bg-slate-50 dark:bg-zinc-900/60 border border-slate-200/80 dark:border-zinc-800/80 space-y-1.5 text-xs">
                <div className="flex justify-between text-slate-500">
                  <span>{lang === 'bn' ? 'মোট বিল:' : 'Total Amount:'}</span>
                  <span className="font-mono">৳{(selectedInvoice.total_amount || 0).toLocaleString()}</span>
                </div>
                {selectedInvoice.discount > 0 && (
                  <div className="flex justify-between text-slate-500">
                    <span>{lang === 'bn' ? 'ডিসকাউন্ট:' : 'Discount:'}</span>
                    <span className="font-mono">-৳{(selectedInvoice.discount || 0).toLocaleString()}</span>
                  </div>
                )}
                <div className="flex justify-between font-bold text-slate-900 dark:text-white pt-1 border-t border-slate-200 dark:border-zinc-800">
                  <span>{lang === 'bn' ? 'নিট বিল:' : 'Net Bill:'}</span>
                  <span className="font-mono text-sm">৳{(selectedInvoice.net_amount || 0).toLocaleString()}</span>
                </div>
                <div className="flex justify-between text-emerald-600 font-medium pt-1">
                  <span>{lang === 'bn' ? 'পরিশোধ:' : 'Paid:'}</span>
                  <span className="font-mono">৳{(selectedInvoice.paid_amount || 0).toLocaleString()}</span>
                </div>
                {(selectedInvoice.due_amount || 0) > 0 && (
                  <div className="flex justify-between text-amber-500 font-bold">
                    <span>{lang === 'bn' ? 'বাকি ব্যালেন্স:' : 'Due Balance:'}</span>
                    <span className="font-mono">৳{(selectedInvoice.due_amount).toLocaleString()}</span>
                  </div>
                )}
              </div>
            </div>

            <div className="pt-2 flex items-center justify-between gap-2 border-t border-slate-100 dark:border-zinc-800">
              <div className="flex items-center gap-2">
                <Button
                  type="button"
                  onClick={() => handlePrintReceipt(selectedInvoice)}
                  className="bg-[#00df89] hover:bg-[#00c97b] text-[#011812] font-bold text-xs h-9 px-4 rounded-xl cursor-pointer flex items-center gap-1.5"
                >
                  <Printer className="w-4 h-4" />
                  <span>{lang === 'bn' ? 'রসিদ প্রিন্ট করুন' : 'Print Receipt'}</span>
                </Button>
                {(selectedInvoice.due_amount || 0) > 0 && selectedInvoice.supplier_id && (
                  <Button
                    type="button"
                    onClick={() => handleOpenPayDue(selectedInvoice)}
                    className="bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold text-xs h-9 px-3.5 rounded-xl cursor-pointer flex items-center gap-1.5 shadow-xs"
                  >
                    <Wallet className="w-3.5 h-3.5" />
                    <span>{lang === 'bn' ? 'বাকি পরিশোধ' : 'Pay Due'}</span>
                  </Button>
                )}
              </div>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    const toEdit = selectedInvoice;
                    setSelectedInvoice(null);
                    handleOpenEdit(toEdit);
                  }}
                  className="h-9 px-3 rounded-xl cursor-pointer"
                >
                  <Edit2 className="w-3.5 h-3.5 mr-1 text-blue-500" />
                  <span>{lang === 'bn' ? 'সম্পাদনা' : 'Edit'}</span>
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setSelectedInvoice(null)}
                  className="h-9 px-4 rounded-xl cursor-pointer"
                >
                  {lang === 'bn' ? 'বন্ধ করুন' : 'Close'}
                </Button>
              </div>
            </div>
          </Card>
        </div>
      )}

      {/* Delete Confirmation Dialog */}
      <ConfirmDialog
        isOpen={!!deleteTarget}
        isLoading={isDeleting}
        title={lang === 'bn' ? 'ক্রয় ইনভয়েস মুছে ফেলবেন?' : 'Delete Purchase Invoice?'}
        description={
          lang === 'bn'
            ? `আপনি কি নিশ্চিত যে ইনভয়েস #${deleteTarget?.purchase_number} মুছে ফেলতে চান? এটি পণ্যের বিদ্যমান স্টক পূর্বাবস্থায় ফিরিয়ে নেবে এবং সাপ্লায়ার ব্যালেন্স সমন্বয় করবে।`
            : `Are you sure you want to delete purchase #${deleteTarget?.purchase_number}? This will reverse the added stock count from your inventory and adjust the supplier balance.`
        }
        confirmText={lang === 'bn' ? 'হ্যাঁ, মুছে ফেলুন' : 'Yes, Delete & Reverse Stock'}
        cancelText={lang === 'bn' ? 'বাতিল' : 'Cancel'}
        onConfirm={handleConfirmDelete}
        onCancel={() => setDeleteTarget(null)}
      />

      {/* Delete Supplier Confirmation Dialog */}
      <ConfirmDialog
        isOpen={deleteSupplierModal.isOpen}
        isLoading={deleteSupplierModal.isLoading}
        title={lang === 'bn' ? `সাপ্লায়ার '${deleteSupplierModal.name}' মুছে ফেলবেন?` : `Delete supplier '${deleteSupplierModal.name}'?`}
        description={lang === 'bn' ? 'এই সাপ্লায়ার তথ্যটি মুছে ফেলা হবে। পূর্বে করা ক্রয়ের হিসাব অক্ষুণ্ণ থাকবে।' : 'This supplier profile will be removed from your directory. Past purchase records will remain intact.'}
        confirmText={lang === 'bn' ? 'হ্যাঁ, মুছুন' : 'Yes, Delete'}
        cancelText={lang === 'bn' ? 'বাতিল' : 'Cancel'}
        onConfirm={handleConfirmDeleteSupplier}
        onCancel={() => setDeleteSupplierModal({ isOpen: false, id: null, name: '', isLoading: false })}
      />

      {/* Quick Add Product Modal */}
      {quickProductModal.isOpen && (
        <div className="fixed inset-0 z-[100000] flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs animate-in fade-in duration-150">
          <Card className="max-w-lg w-full p-6 bg-white dark:bg-[#121215] border-slate-200 dark:border-zinc-800 shadow-2xl max-h-[90vh] flex flex-col">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-zinc-800 pb-3 shrink-0">
              <h2 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <PlusCircle className="w-5 h-5 text-[#00df89]" />
                <span>{lang === 'bn' ? 'নতুন পণ্য তৈরি করুন' : 'Add New Product'}</span>
              </h2>
              <button
                type="button"
                onClick={() => setQuickProductModal((prev) => ({ ...prev, isOpen: false }))}
                className="text-slate-400 hover:text-slate-600 p-1 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateQuickProduct} className="flex-1 overflow-y-auto custom-scrollbar pr-1 space-y-3.5 text-xs py-1">
              {/* Product Name */}
              <div>
                <label className="block font-bold text-slate-700 dark:text-zinc-300 mb-1">
                  {lang === 'bn' ? 'পণ্যের নাম *' : 'Product Name *'}
                </label>
                <input
                  type="text"
                  required
                  placeholder={lang === 'bn' ? 'যেমন: কলম, খাতা, টি-শার্ট...' : 'e.g. Notebook, T-Shirt, Coffee Mug...'}
                  value={quickProductModal.name}
                  onChange={(e) => setQuickProductModal((prev) => ({ ...prev, name: e.target.value }))}
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-[#09090b] border border-slate-200 dark:border-zinc-800 text-xs text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-[#00df89]"
                />
              </div>

              {/* Category & Brand Row (2 Columns) */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {/* Category */}
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="block font-bold text-slate-700 dark:text-zinc-300">
                      {lang === 'bn' ? 'ক্যাটাগরি' : 'Category'}
                    </label>
                    <button
                      type="button"
                      onClick={() => setShowAddCatInline(!showAddCatInline)}
                      className="text-[10px] font-semibold text-[#00a86b] dark:text-[#00df89] hover:underline flex items-center gap-0.5 cursor-pointer"
                    >
                      {showAddCatInline ? (
                        <span>{lang === 'bn' ? 'তালিকা' : 'List'}</span>
                      ) : (
                        <>
                          <Plus className="w-2.5 h-2.5" />
                          <span>{lang === 'bn' ? '+ নতুন' : '+ New'}</span>
                        </>
                      )}
                    </button>
                  </div>

                  {showAddCatInline ? (
                    <div className="flex items-center gap-1.5 p-1.5 rounded-xl bg-emerald-500/5 border border-emerald-500/20 w-full">
                      <input
                        type="text"
                        placeholder={lang === 'bn' ? 'ক্যাটাগরি...' : 'Category name...'}
                        value={newCatName}
                        onChange={(e) => setNewCatName(e.target.value)}
                        className="flex-1 min-w-0 px-2.5 py-1 rounded-lg bg-white dark:bg-[#09090b] border border-slate-200 dark:border-zinc-800 outline-none text-xs text-slate-900 dark:text-white focus:ring-1 focus:ring-[#00df89]"
                      />
                      <Button
                        type="button"
                        size="sm"
                        disabled={isCreatingCat || !newCatName.trim()}
                        onClick={handleCreateCategory}
                        className="bg-[#00df89] hover:bg-[#00c97b] text-[#011812] font-semibold text-[11px] h-7 px-2.5 shrink-0 cursor-pointer"
                      >
                        {isCreatingCat ? <Loader2 className="w-3 h-3 animate-spin" /> : (lang === 'bn' ? 'সেভ' : 'Save')}
                      </Button>
                      <button
                        type="button"
                        onClick={() => setShowAddCatInline(false)}
                        className="p-1 text-slate-400 hover:text-slate-600 dark:hover:text-zinc-200 shrink-0 cursor-pointer"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ) : (
                    <Select
                      value={quickProductModal.category_id || '__none__'}
                      onValueChange={(val) => {
                        if (val === '__add_new_cat__') {
                          setShowAddCatInline(true);
                        } else {
                          setQuickProductModal((prev) => ({ ...prev, category_id: val === '__none__' ? '' : val }));
                        }
                      }}
                    >
                      <SelectTrigger className="w-full bg-slate-50 dark:bg-[#09090b]">
                        <SelectValue placeholder="Category" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem
                          value="__add_new_cat__"
                          className="text-[#00a86b] dark:text-[#00df89] font-bold border-b border-slate-100 dark:border-zinc-800/80 mb-1"
                        >
                          + {lang === 'bn' ? 'নতুন ক্যাটাগরি তৈরি করুন...' : 'Add New Category...'}
                        </SelectItem>
                        <SelectItem value="__none__">{lang === 'bn' ? 'সাধারণ (General / None)' : 'General / None'}</SelectItem>
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
                  <div className="flex items-center justify-between mb-1">
                    <label className="block font-bold text-slate-700 dark:text-zinc-300">
                      {lang === 'bn' ? 'ব্র্যান্ড' : 'Brand'}
                    </label>
                    <button
                      type="button"
                      onClick={() => setShowAddBrandInline(!showAddBrandInline)}
                      className="text-[10px] font-semibold text-[#00a86b] dark:text-[#00df89] hover:underline flex items-center gap-0.5 cursor-pointer"
                    >
                      {showAddBrandInline ? (
                        <span>{lang === 'bn' ? 'তালিকা' : 'List'}</span>
                      ) : (
                        <>
                          <Plus className="w-2.5 h-2.5" />
                          <span>{lang === 'bn' ? '+ নতুন' : '+ New'}</span>
                        </>
                      )}
                    </button>
                  </div>

                  {showAddBrandInline ? (
                    <div className="flex items-center gap-1.5 p-1.5 rounded-xl bg-emerald-500/5 border border-emerald-500/20 w-full">
                      <input
                        type="text"
                        placeholder={lang === 'bn' ? 'ব্র্যান্ড...' : 'Brand name...'}
                        value={newBrandName}
                        onChange={(e) => setNewBrandName(e.target.value)}
                        className="flex-1 min-w-0 px-2.5 py-1 rounded-lg bg-white dark:bg-[#09090b] border border-slate-200 dark:border-zinc-800 outline-none text-xs text-slate-900 dark:text-white focus:ring-1 focus:ring-[#00df89]"
                      />
                      <Button
                        type="button"
                        size="sm"
                        disabled={isCreatingBrand || !newBrandName.trim()}
                        onClick={handleCreateBrand}
                        className="bg-[#00df89] hover:bg-[#00c97b] text-[#011812] font-semibold text-[11px] h-7 px-2.5 shrink-0 cursor-pointer"
                      >
                        {isCreatingBrand ? <Loader2 className="w-3 h-3 animate-spin" /> : (lang === 'bn' ? 'সেভ' : 'Save')}
                      </Button>
                      <button
                        type="button"
                        onClick={() => setShowAddBrandInline(false)}
                        className="p-1 text-slate-400 hover:text-slate-600 dark:hover:text-zinc-200 shrink-0 cursor-pointer"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ) : (
                    <Select
                      value={quickProductModal.brand_id || '__none__'}
                      onValueChange={(val) => {
                        if (val === '__add_new_brand__') {
                          setShowAddBrandInline(true);
                        } else {
                          setQuickProductModal((prev) => ({ ...prev, brand_id: val === '__none__' ? '' : val }));
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
              </div>

              {/* Pricing & Unit Row (3 columns) */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 dark:text-zinc-300 mb-1">
                    {lang === 'bn' ? 'ক্রয়মূল্য (৳)' : 'Cost Price (৳)'}
                  </label>
                  <input
                    type="number"
                    min="0"
                    step="any"
                    placeholder="0.00"
                    value={quickProductModal.cost_price}
                    onChange={(e) => setQuickProductModal((prev) => ({ ...prev, cost_price: e.target.value }))}
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-[#09090b] border border-slate-200 dark:border-zinc-800 text-xs text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-[#00df89]"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 dark:text-zinc-300 mb-1">
                    {lang === 'bn' ? 'বিক্রয়মূল্য (৳)' : 'Selling Price (৳)'}
                  </label>
                  <input
                    type="number"
                    min="0"
                    step="any"
                    placeholder="0.00"
                    value={quickProductModal.selling_price}
                    onChange={(e) => setQuickProductModal((prev) => ({ ...prev, selling_price: e.target.value }))}
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-[#09090b] border border-slate-200 dark:border-zinc-800 text-xs text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-[#00df89]"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 dark:text-zinc-300 mb-1">
                    {lang === 'bn' ? 'একক (Unit)' : 'Unit'}
                  </label>
                  <Select
                    value={quickProductModal.unit}
                    onValueChange={(val) => setQuickProductModal((prev) => ({ ...prev, unit: val }))}
                  >
                    <SelectTrigger className="w-full bg-slate-50 dark:bg-[#09090b]">
                      <SelectValue placeholder="Unit" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="piece">{lang === 'bn' ? 'পিস (piece)' : 'Piece (pcs)'}</SelectItem>
                      <SelectItem value="kg">{lang === 'bn' ? 'কেজি (kg)' : 'Kilogram (kg)'}</SelectItem>
                      <SelectItem value="liter">{lang === 'bn' ? 'লিটার (liter)' : 'Liter (L)'}</SelectItem>
                      <SelectItem value="box">{lang === 'bn' ? 'বক্স (box)' : 'Box'}</SelectItem>
                      <SelectItem value="packet">{lang === 'bn' ? 'প্যাকেট (packet)' : 'Packet'}</SelectItem>
                      <SelectItem value="meter">{lang === 'bn' ? 'মিটার (meter)' : 'Meter (m)'}</SelectItem>
                      <SelectItem value="pair">{lang === 'bn' ? 'জোড়া (pair)' : 'Pair'}</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Product Variations Toggle in Quick Add Modal */}
              <div className="p-3 rounded-2xl bg-gradient-to-r from-emerald-500/10 via-teal-500/5 to-transparent border border-emerald-500/30 space-y-2.5">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Layers className="w-4 h-4 text-[#00df89]" />
                    <div>
                      <h4 className="font-bold text-slate-900 dark:text-white text-xs">
                        {lang === 'bn' ? 'পণ্যের ভ্যারিয়েশন (রং, সাইজ ইত্যাদি)' : 'Product Variations'}
                      </h4>
                      <p className="text-[10px] text-slate-500">
                        {lang === 'bn' ? 'আলাদা রং বা সাইজ অনুযায়ী কাস্টম মূল্য' : 'Custom pricing per color/size'}
                      </p>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => {
                      const nextVal = !quickProductModal.has_variants;
                      setQuickProductModal((prev) => ({
                        ...prev,
                        has_variants: nextVal,
                      }));
                      if (nextVal && (quickProductModal.variants || []).length === 0) {
                        generateQuickProductCombinations();
                      }
                    }}
                    className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out ${
                      quickProductModal.has_variants ? 'bg-[#00df89]' : 'bg-slate-300 dark:bg-zinc-700'
                    }`}
                  >
                    <span
                      className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow-md ring-0 transition duration-200 ease-in-out ${
                        quickProductModal.has_variants ? 'translate-x-4 bg-[#011812]' : 'translate-x-0'
                      }`}
                    />
                  </button>
                </div>

                {/* If Variations Enabled */}
                {quickProductModal.has_variants && (
                  <div className="space-y-2.5 pt-2 border-t border-emerald-500/20">
                    {/* Attributes Definition */}
                    <div className="space-y-2 bg-white/70 dark:bg-[#09090b]/80 p-2.5 rounded-xl border border-slate-200/80 dark:border-zinc-800">
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-[11px] text-slate-800 dark:text-zinc-200 flex items-center gap-1">
                          <Sliders className="w-3 h-3 text-[#00df89]" />
                          {lang === 'bn' ? '১. বৈশিষ্ট্যসমূহ (Attributes):' : '1. Attributes & Values:'}
                        </span>
                        <button
                          type="button"
                          onClick={() => handleAddQuickProductAttrGroup()}
                          className="text-[10px] font-bold text-[#00a86b] dark:text-[#00df89] hover:underline flex items-center gap-0.5 cursor-pointer"
                        >
                          <Plus className="w-2.5 h-2.5" />
                          {lang === 'bn' ? '+ বৈশিষ্ট্য যোগ' : '+ Add Attribute'}
                        </button>
                      </div>

                      {/* Attribute Presets */}
                      <div className="flex items-center gap-1 flex-wrap">
                        <span className="text-[10px] text-slate-400">Presets:</span>
                        {attributePresets.map((preset) => (
                          <button
                            key={preset.name}
                            type="button"
                            onClick={() => handleAddQuickProductAttrGroup(preset)}
                            className="px-2 py-0.5 rounded-md text-[10px] font-medium bg-slate-100 dark:bg-zinc-800 hover:bg-emerald-500/15 hover:text-emerald-600 dark:hover:text-[#00df89] border border-slate-200/60 dark:border-zinc-700 transition-colors cursor-pointer"
                          >
                            + {preset.name}
                          </button>
                        ))}
                      </div>

                      {/* Attribute Rows */}
                      <div className="space-y-1.5">
                        {(quickProductModal.variation_options || []).map((opt, optIdx) => (
                          <div key={optIdx} className="p-2 rounded-lg bg-slate-50 dark:bg-zinc-900 border border-slate-200/60 dark:border-zinc-800 space-y-1 text-xs">
                            <div className="flex items-center justify-between gap-2">
                              <input
                                type="text"
                                placeholder="Attribute Name"
                                value={opt.name}
                                onChange={(e) => {
                                  const updated = [...(quickProductModal.variation_options || [])];
                                  updated[optIdx] = { ...updated[optIdx], name: e.target.value };
                                  setQuickProductModal({ ...quickProductModal, variation_options: updated });
                                }}
                                className="px-2 py-0.5 rounded bg-white dark:bg-[#09090b] border border-slate-200 dark:border-zinc-800 text-xs font-semibold w-32 outline-none"
                              />
                              <button
                                type="button"
                                onClick={() => handleRemoveQuickProductAttrGroup(optIdx)}
                                className="p-1 text-slate-400 hover:text-rose-500 rounded cursor-pointer"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>

                            {/* Tags Input */}
                            <div className="space-y-1">
                              <div className="flex flex-wrap items-center gap-1 min-h-5">
                                {opt.values.map((val, valIdx) => (
                                  <span
                                    key={valIdx}
                                    className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full text-[10px] font-medium bg-[#00df89]/15 text-[#00a86b] dark:text-[#00df89] border border-[#00df89]/30"
                                  >
                                    {val}
                                    <button
                                      type="button"
                                      onClick={() => handleRemoveQuickProductOptionValue(optIdx, valIdx)}
                                      className="hover:text-rose-500 cursor-pointer"
                                    >
                                      <X className="w-2.5 h-2.5" />
                                    </button>
                                  </span>
                                ))}
                              </div>
                              <input
                                type="text"
                                placeholder={lang === 'bn' ? 'মান লিখে Enter চাপুন (e.g. Red, Blue, XL)...' : 'Type value and press Enter...'}
                                onKeyDown={(e) => {
                                  if (e.key === 'Enter' || e.key === ',') {
                                    e.preventDefault();
                                    handleAddQuickProductOptionValue(optIdx, e.currentTarget.value);
                                    e.currentTarget.value = '';
                                  }
                                }}
                                className="w-full px-2 py-1 rounded bg-white dark:bg-[#09090b] border border-slate-200 dark:border-zinc-800 text-xs outline-none focus:ring-1 focus:ring-[#00df89]"
                              />
                            </div>
                          </div>
                        ))}
                      </div>

                      <Button
                        type="button"
                        onClick={generateQuickProductCombinations}
                        className="w-full bg-[#00df89] hover:bg-[#00c97b] text-[#011812] text-xs font-bold py-1 h-7 cursor-pointer shadow-xs gap-1"
                      >
                        <Boxes className="w-3.5 h-3.5" />
                        <span>{lang === 'bn' ? 'ভ্যারিয়েশন কম্বিনেশন তৈরি করুন' : 'Generate Variants Matrix'}</span>
                      </Button>
                    </div>

                    {/* 2. Variants Matrix Table */}
                    {(quickProductModal.variants || []).length > 0 && (
                      <div className="space-y-1.5">
                        {/* Bulk Fast Fill */}
                        <div className="p-2 rounded-xl bg-slate-100 dark:bg-zinc-900/90 border border-slate-200 dark:border-zinc-800 space-y-1">
                          <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">
                            {lang === 'bn' ? 'সবগুলোতে একসাথে মূল্য বসান:' : 'Fast Bulk Fill Prices:'}
                          </span>
                          <div className="grid grid-cols-2 gap-2">
                            <input
                              type="number"
                              placeholder="Cost Price (৳)"
                              onBlur={(e) => {
                                if (e.target.value) handleBulkFillQuickProductVariants('cost_price', parseFloat(e.target.value) || 0);
                              }}
                              className="px-2 py-1 rounded bg-white dark:bg-[#09090b] border border-slate-200 dark:border-zinc-800 text-xs font-mono"
                            />
                            <input
                              type="number"
                              placeholder="Selling Price (৳)"
                              onBlur={(e) => {
                                if (e.target.value) handleBulkFillQuickProductVariants('selling_price', parseFloat(e.target.value) || 0);
                              }}
                              className="px-2 py-1 rounded bg-white dark:bg-[#09090b] border border-slate-200 dark:border-zinc-800 text-xs font-mono"
                            />
                          </div>
                        </div>

                        {/* Variants List */}
                        <div className="space-y-1 max-h-40 overflow-y-auto custom-scrollbar pr-1">
                          {quickProductModal.variants.map((v, vIdx) => (
                            <div key={v.id || vIdx} className="p-2 rounded-xl bg-white dark:bg-[#09090b] border border-slate-200 dark:border-zinc-800 space-y-1 text-xs">
                              <div className="flex items-center gap-2">
                                <input
                                  type="text"
                                  placeholder="Variant Name"
                                  value={v.name}
                                  onChange={(e) => handleUpdateQuickProductVariant(vIdx, 'name', e.target.value)}
                                  className="flex-1 px-2 py-1 rounded bg-slate-50 dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 text-xs font-semibold"
                                />
                                <input
                                  type="text"
                                  placeholder="SKU"
                                  value={v.sku || ''}
                                  onChange={(e) => handleUpdateQuickProductVariant(vIdx, 'sku', e.target.value)}
                                  className="w-24 px-2 py-1 rounded bg-slate-50 dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 text-xs font-mono"
                                />
                                <button
                                  type="button"
                                  onClick={() => handleRemoveQuickProductVariant(vIdx)}
                                  className="p-1 text-slate-400 hover:text-rose-500 rounded cursor-pointer"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              </div>
                              <div className="grid grid-cols-2 gap-2">
                                <div>
                                  <label className="text-[10px] text-slate-500">Cost (৳)</label>
                                  <input
                                    type="number"
                                    value={v.cost_price}
                                    onChange={(e) => handleUpdateQuickProductVariant(vIdx, 'cost_price', e.target.value)}
                                    className="w-full px-2 py-1 rounded bg-slate-50 dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 text-xs font-mono"
                                  />
                                </div>
                                <div>
                                  <label className="text-[10px] text-slate-500">Selling (৳)</label>
                                  <input
                                    type="number"
                                    value={v.selling_price}
                                    onChange={(e) => handleUpdateQuickProductVariant(vIdx, 'selling_price', e.target.value)}
                                    className="w-full px-2 py-1 rounded bg-slate-50 dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 text-xs font-mono font-bold text-[#00a86b] dark:text-[#00df89]"
                                  />
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Action Buttons */}
              <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-slate-100 dark:border-zinc-800 shrink-0">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  disabled={quickProductModal.isSubmitting}
                  onClick={() => setQuickProductModal((prev) => ({ ...prev, isOpen: false }))}
                  className="cursor-pointer"
                >
                  {lang === 'bn' ? 'বাতিল' : 'Cancel'}
                </Button>

                <Button
                  type="submit"
                  size="sm"
                  disabled={quickProductModal.isSubmitting}
                  className="bg-[#00df89] hover:bg-[#00c97b] text-[#011812] font-semibold cursor-pointer"
                >
                  {quickProductModal.isSubmitting ? (
                    <span className="flex items-center gap-1.5">
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      {lang === 'bn' ? 'তৈরি হচ্ছে...' : 'Creating...'}
                    </span>
                  ) : (
                    <span>{lang === 'bn' ? 'পণ্য তৈরি করুন' : 'Create Product'}</span>
                  )}
                </Button>
              </div>
            </form>
          </Card>
        </div>
      )}

      {/* Delete Product Confirmation Dialog */}
      <ConfirmDialog
        isOpen={deleteProductModal.isOpen}
        isLoading={deleteProductModal.isLoading}
        title={lang === 'bn' ? `পণ্য '${deleteProductModal.name}' মুছে ফেলবেন?` : `Delete product '${deleteProductModal.name}'?`}
        description={lang === 'bn' ? 'এই পণ্যটি ক্যাটালগ থেকে মুছে ফেলা হবে। পূর্বে করা ক্রয়ের হিসাব অক্ষুণ্ণ থাকবে।' : 'This product will be removed from your catalog. Past purchase records will remain intact.'}
        confirmText={lang === 'bn' ? 'হ্যাঁ, মুছুন' : 'Yes, Delete'}
        cancelText={lang === 'bn' ? 'বাতিল' : 'Cancel'}
        onConfirm={handleConfirmDeleteProduct}
        onCancel={() => setDeleteProductModal({ isOpen: false, id: null, name: '', isLoading: false })}
      />

      {/* Delete Category Confirmation Dialog */}
      <ConfirmDialog
        isOpen={deleteCategoryModal.isOpen}
        isLoading={deleteCategoryModal.isLoading}
        title={lang === 'bn' ? `ক্যাটাগরি '${deleteCategoryModal.name}' মুছে ফেলবেন?` : `Delete category '${deleteCategoryModal.name}'?`}
        description={lang === 'bn' ? 'এই ক্যাটাগরি তথ্যটি মুছে ফেলা হবে।' : 'This category will be removed.'}
        confirmText={lang === 'bn' ? 'হ্যাঁ, মুছুন' : 'Yes, Delete'}
        cancelText={lang === 'bn' ? 'বাতিল' : 'Cancel'}
        onConfirm={handleConfirmDeleteCategory}
        onCancel={() => setDeleteCategoryModal({ isOpen: false, id: null, name: '', isLoading: false })}
      />

      {/* Delete Brand Confirmation Dialog */}
      <ConfirmDialog
        isOpen={deleteBrandModal.isOpen}
        isLoading={deleteBrandModal.isLoading}
        title={lang === 'bn' ? `ব্র্যান্ড '${deleteBrandModal.name}' মুছে ফেলবেন?` : `Delete brand '${deleteBrandModal.name}'?`}
        description={lang === 'bn' ? 'এই ব্র্যান্ড তথ্যটি মুছে ফেলা হবে।' : 'This brand will be removed.'}
        confirmText={lang === 'bn' ? 'হ্যাঁ, মুছুন' : 'Yes, Delete'}
        cancelText={lang === 'bn' ? 'বাতিল' : 'Cancel'}
        onConfirm={handleConfirmDeleteBrand}
        onCancel={() => setDeleteBrandModal({ isOpen: false, id: null, name: '', isLoading: false })}
      />

      {/* Pay Due Modal */}
      {payDueModal.isOpen && payDueModal.supplier && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs animate-in fade-in duration-150">
          <Card className="max-w-md w-full p-6 bg-white dark:bg-[#121215] border-slate-200 dark:border-zinc-800 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-zinc-800 pb-3">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-amber-500/10 text-amber-500 flex items-center justify-center">
                  <Wallet className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-base font-bold text-slate-900 dark:text-white">
                    {lang === 'bn' ? 'সাপ্লায়ার বাকি পরিশোধ' : 'Pay Supplier Due'}
                  </h2>
                  <p className="text-[11px] text-slate-400 font-medium">
                    {payDueModal.supplier.name} {payDueModal.supplier.company_name ? `(${payDueModal.supplier.company_name})` : ''}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() =>
                  setPayDueModal({
                    isOpen: false,
                    supplier: null,
                    purchase: null,
                    amount: '',
                    payment_method: 'cash',
                    notes: '',
                    isSubmitting: false,
                  })
                }
                className="text-slate-400 hover:text-slate-600 p-1 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Target Info & Due Banner */}
            <div className="p-3.5 rounded-2xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-between">
              <div>
                <span className="text-[11px] font-bold text-amber-600 dark:text-amber-400 block uppercase tracking-wider">
                  {payDueModal.purchase
                    ? (lang === 'bn'
                        ? `ইনভয়েস #${payDueModal.purchase.purchase_number} বাকি`
                        : `Invoice #${payDueModal.purchase.purchase_number} Due`)
                    : (lang === 'bn' ? 'সর্বমোট বকেয়া পাওনা' : 'Total Outstanding Due')}
                </span>
                <span className="text-xl font-bold font-mono text-amber-600 dark:text-amber-400">
                  ৳{(payDueModal.purchase ? payDueModal.purchase.due_amount : (payDueModal.supplier.total_due || 0)).toLocaleString()}
                </span>
              </div>
              <DollarSign className="w-8 h-8 text-amber-500/40" />
            </div>

            <form onSubmit={handleSubmitPayDue} className="space-y-3.5 text-xs">
              {/* Amount Input */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="font-bold text-slate-700 dark:text-zinc-300">
                    {lang === 'bn' ? 'পরিশোধের পরিমাণ (৳) *' : 'Payment Amount (৳) *'}
                  </label>
                  {/* Quick Preset Buttons */}
                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      onClick={() => {
                        const targetDue = payDueModal.purchase
                          ? payDueModal.purchase.due_amount
                          : (payDueModal.supplier.total_due || 0);
                        setPayDueModal((prev) => ({ ...prev, amount: String(targetDue) }));
                      }}
                      className="px-2 py-0.5 rounded-md bg-slate-100 dark:bg-zinc-800 hover:bg-emerald-500/10 hover:text-[#00a86b] dark:hover:text-[#00df89] text-[10px] font-bold text-slate-600 dark:text-zinc-300 transition-colors cursor-pointer"
                    >
                      {lang === 'bn' ? 'সম্পূর্ণ (100%)' : 'Full Due'}
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        const targetDue = payDueModal.purchase
                          ? payDueModal.purchase.due_amount
                          : (payDueModal.supplier.total_due || 0);
                        setPayDueModal((prev) => ({ ...prev, amount: String(Math.round(targetDue / 2)) }));
                      }}
                      className="px-2 py-0.5 rounded-md bg-slate-100 dark:bg-zinc-800 hover:bg-blue-500/10 hover:text-blue-600 text-[10px] font-bold text-slate-600 dark:text-zinc-300 transition-colors cursor-pointer"
                    >
                      50%
                    </button>
                  </div>
                </div>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 font-bold text-slate-400">৳</span>
                  <input
                    type="number"
                    required
                    min="1"
                    step="any"
                    placeholder="0.00"
                    value={payDueModal.amount}
                    onChange={(e) => setPayDueModal({ ...payDueModal, amount: e.target.value })}
                    className="w-full pl-8 pr-4 py-2.5 rounded-xl bg-slate-50 dark:bg-[#09090b] border border-slate-200 dark:border-zinc-800 text-slate-900 dark:text-white font-mono font-bold text-sm outline-none focus:ring-2 focus:ring-[#00df89]"
                  />
                </div>

                {/* Remaining Due Preview */}
                {Number(payDueModal.amount) > 0 && (
                  <div className="mt-1.5 flex items-center justify-between text-[11px] text-slate-500">
                    <span>{lang === 'bn' ? 'পরিশোধের পর বাকি থাকবে:' : 'Remaining due after payment:'}</span>
                    <span className="font-mono font-bold text-slate-800 dark:text-zinc-200">
                      ৳{Math.max(
                        0,
                        (payDueModal.purchase
                          ? payDueModal.purchase.due_amount
                          : (payDueModal.supplier.total_due || 0)) - Number(payDueModal.amount)
                      ).toLocaleString()}
                    </span>
                  </div>
                )}
              </div>

              {/* Payment Method */}
              <div>
                <label className="block font-bold text-slate-700 dark:text-zinc-300 mb-1">
                  {lang === 'bn' ? 'পেমেন্ট মাধ্যম *' : 'Payment Method *'}
                </label>
                <Select
                  value={payDueModal.payment_method}
                  onValueChange={(val) => setPayDueModal({ ...payDueModal, payment_method: val })}
                >
                  <SelectTrigger className="w-full bg-slate-50 dark:bg-[#09090b]">
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

              {/* Notes / Reference */}
              <div>
                <label className="block font-bold text-slate-700 dark:text-zinc-300 mb-1">
                  {lang === 'bn' ? 'নোট / ট্রানজেকশন রেফারেন্স (ঐচ্ছিক)' : 'Notes / Reference (Optional)'}
                </label>
                <input
                  type="text"
                  placeholder={lang === 'bn' ? 'যেমন: TrxID / চেক নম্বর / ব্যাংক স্লিপ...' : 'e.g. TrxID / Cheque # / Slip #...'}
                  value={payDueModal.notes}
                  onChange={(e) => setPayDueModal({ ...payDueModal, notes: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-[#09090b] border border-slate-200 dark:border-zinc-800 text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-[#00df89]"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100 dark:border-zinc-800">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() =>
                    setPayDueModal({
                      isOpen: false,
                      supplier: null,
                      purchase: null,
                      amount: '',
                      payment_method: 'cash',
                      notes: '',
                      isSubmitting: false,
                    })
                  }
                  className="h-9 px-4 rounded-xl cursor-pointer"
                >
                  {lang === 'bn' ? 'বাতিল' : 'Cancel'}
                </Button>
                <Button
                  type="submit"
                  disabled={payDueModal.isSubmitting || !payDueModal.amount || Number(payDueModal.amount) <= 0}
                  className="bg-[#00df89] hover:bg-[#00c97b] text-[#011812] font-bold text-xs h-9 px-4 rounded-xl cursor-pointer disabled:opacity-50"
                >
                  {payDueModal.isSubmitting ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    (lang === 'bn' ? 'পেমেন্ট নিশ্চিত করুন' : 'Confirm Payment')
                  )}
                </Button>
              </div>
            </form>
          </Card>
        </div>
      )}

      {/* Barcode & Product Label Printing Studio */}
      <BarcodeLabelModal
        isOpen={isBarcodeModalOpen}
        onClose={() => {
          setIsBarcodeModalOpen(false);
          setBarcodeModalProducts([]);
        }}
        initialProducts={barcodeModalProducts}
        allProducts={products}
        shopInfo={mongoShop || activeShop || { name: 'Shopo Store' }}
        lang={lang}
      />
    </div>
  );
}
