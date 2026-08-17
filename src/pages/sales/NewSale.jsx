/**
 * @file NewSale.jsx
 * @description Real-time Point of Sale Checkout & Cash Memo Generation with Flat/Percentage Discounts, Cash Given & Change Calculator.
 */
import { useState, useMemo, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useLanguage } from '@/context/LanguageContext';
import { useAuth } from '@/context/AuthContext';
import api from '@/services/api';
import toast from 'react-hot-toast';
import { Card, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import {
  ShoppingCart, Search, Plus, Minus, Trash2, CheckCircle2,
  DollarSign, ArrowLeft, Printer, FileText, Smartphone, CreditCard,
  Banknote, X, Sparkles, User, Phone, Check, RefreshCw, AlertCircle,
  Loader2, Package, Percent, Coins, ArrowRight, Store
} from 'lucide-react';

export default function NewSale() {
  const navigate = useNavigate();
  const { lang, t } = useLanguage();
  const { mongoShop } = useAuth();

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [availableProducts, setAvailableProducts] = useState([]);
  const [isLoadingProducts, setIsLoadingProducts] = useState(true);
  const [isProcessingSale, setIsProcessingSale] = useState(false);

  // Cart State
  const [cart, setCart] = useState([]);

  // Customer & Discount Form
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [discountType, setDiscountType] = useState('flat'); // 'flat' or 'percentage'
  const [discountValue, setDiscountValue] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('Cash'); // 'Cash', 'bKash', 'Nagad', 'Card'
  const [cashGiven, setCashGiven] = useState('');

  // Post-sale Receipt Modal
  const [isSuccessModalOpen, setIsSuccessModalOpen] = useState(false);
  const [completedOrder, setCompletedOrder] = useState(null);

  // Real-time Customer Recognition & Autocomplete State
  const [matchedCustomer, setMatchedCustomer] = useState(null);
  const [customerSuggestions, setCustomerSuggestions] = useState([]);
  const [showCustomerDropdown, setShowCustomerDropdown] = useState(false);
  const [isSearchingCustomer, setIsSearchingCustomer] = useState(false);

  // Debounced Customer Lookup by Phone or Name
  useEffect(() => {
    const q = customerPhone.trim();
    if (q.length < 2) {
      setCustomerSuggestions([]);
      setShowCustomerDropdown(false);
      if (!q) setMatchedCustomer(null);
      return;
    }

    // If already matched exact phone, skip reopening dropdown
    if (matchedCustomer && matchedCustomer.phone === q) {
      return;
    }

    const timer = setTimeout(async () => {
      setIsSearchingCustomer(true);
      try {
        const res = await api.customers.list({ search: q });
        const list = Array.isArray(res?.data)
          ? res.data
          : Array.isArray(res?.data?.docs)
          ? res.data.docs
          : [];
        setCustomerSuggestions(list);
        setShowCustomerDropdown(list.length > 0);

        // Exact match auto-select
        const exact = list.find((c) => c.phone && c.phone === q);
        if (exact) {
          setMatchedCustomer(exact);
          if (!customerName.trim() || customerName === 'Walk-in Customer') {
            setCustomerName(exact.name || '');
          }
        }
      } catch (err) {
        console.warn('Customer lookup error:', err);
        setCustomerSuggestions([]);
      } finally {
        setIsSearchingCustomer(false);
      }
    }, 200);

    return () => clearTimeout(timer);
  }, [customerPhone]);

  const handleSelectCustomer = (cust) => {
    setMatchedCustomer(cust);
    setCustomerPhone(cust.phone || '');
    setCustomerName(cust.name || '');
    setShowCustomerDropdown(false);
    setCustomerSuggestions([]);
    toast.success(lang === 'bn' ? `'${cust.name}' গ্রাহক সিলেক্ট করা হয়েছে` : `Selected: ${cust.name}`);
  };

  const handleClearCustomer = () => {
    setMatchedCustomer(null);
    setCustomerPhone('');
    setCustomerName('');
    setShowCustomerDropdown(false);
    setCustomerSuggestions([]);
  };

  const fetchCatalog = async () => {
    setIsLoadingProducts(true);
    try {
      const res = await api.products.list();
      const rawList = Array.isArray(res?.data)
        ? res.data
        : Array.isArray(res?.data?.docs)
        ? res.data.docs
        : [];

      const mapped = rawList.map((p) => ({
        id: p._id,
        name: p.name,
        image_url: p.image_url || (Array.isArray(p.images) && p.images[0]) || '',
        sku: p.sku || 'N/A',
        category: p.category_id?.name || 'General',
        stock: p.stock_quantity ?? 0,
        unit: p.unit || 'Pcs',
        price: p.selling_price ?? 0,
      }));
      setAvailableProducts(mapped);
    } catch (err) {
      console.warn('Could not load live product catalog:', err.message);
    } finally {
      setIsLoadingProducts(false);
    }
  };

  useEffect(() => {
    fetchCatalog();
  }, []);

  // Filter products by search and category
  const filteredProducts = useMemo(() => {
    return availableProducts.filter((p) => {
      const matchesCategory =
        selectedCategory === 'all' ||
        p.category.toLowerCase() === selectedCategory.toLowerCase();
      const q = searchQuery.toLowerCase().trim();
      const matchesSearch =
        !q ||
        p.name.toLowerCase().includes(q) ||
        p.sku.toLowerCase().includes(q) ||
        p.category.toLowerCase().includes(q);

      return matchesCategory && matchesSearch;
    });
  }, [availableProducts, searchQuery, selectedCategory]);

  // Categories list extracted from products
  const categories = useMemo(() => {
    const set = new Set(availableProducts.map((p) => p.category));
    return ['all', ...Array.from(set)];
  }, [availableProducts]);

  // Add Item to Cart
  const handleAddToCart = (product) => {
    const existing = cart.find((item) => item.id === product.id);
    if (existing) {
      setCart(
        cart.map((item) =>
          item.id === product.id ? { ...item, qty: item.qty + 1 } : item
        )
      );
    } else {
      setCart([
        ...cart,
        {
          id: product.id,
          name: product.name,
          sku: product.sku,
          price: product.price,
          qty: 1,
          unit: product.unit,
        },
      ]);
    }
  };

  // Update Item Quantity in Cart
  const handleUpdateQty = (id, delta) => {
    setCart(
      cart
        .map((item) => {
          if (item.id === id) {
            const newQty = item.qty + delta;
            return newQty > 0 ? { ...item, qty: newQty } : null;
          }
          return item;
        })
        .filter(Boolean)
      );
  };

  // Remove Item
  const handleRemoveFromCart = (id) => {
    setCart(cart.filter((item) => item.id !== id));
  };

  // Calculations
  const subtotal = useMemo(() => {
    return cart.reduce((acc, item) => acc + item.price * item.qty, 0);
  }, [cart]);

  const discountAmount = useMemo(() => {
    const val = parseFloat(discountValue) || 0;
    if (discountType === 'percentage') {
      return (subtotal * val) / 100;
    }
    return Math.min(val, subtotal);
  }, [subtotal, discountType, discountValue]);

  const totalPayable = Math.max(0, subtotal - discountAmount);

  const cashGivenNum = parseFloat(cashGiven) || 0;
  const changeToReturn = Math.max(0, cashGivenNum - totalPayable);
  const remainingDue = Math.max(0, totalPayable - cashGivenNum);

  // Complete Sale and Save to MongoDB
  const handleCompleteSale = async () => {
    if (cart.length === 0) {
      toast.error(lang === 'bn' ? 'অনুগ্রহ করে কার্টে পণ্য যোগ করুন।' : 'Please add items to cart.');
      return;
    }

    setIsProcessingSale(true);
    let generatedInvoice = `INV-${Date.now().toString().slice(-6)}`;

    try {
      const payload = {
        items: cart.map((item) => ({
          product_id: item.id,
          quantity: item.qty,
        })),
        discount_type: discountType,
        discount_value: parseFloat(discountValue) || 0,
        discount: discountAmount,
        paid_amount: totalPayable,
        tendered_amount: paymentMethod === 'Cash' ? (cashGivenNum || totalPayable) : totalPayable,
        change_amount: paymentMethod === 'Cash' ? changeToReturn : 0,
        customer_name: customerName.trim() || undefined,
        customer_phone: customerPhone.trim() || undefined,
        payment_method: paymentMethod.toLowerCase(),
        note: customerName.trim() ? `Customer: ${customerName} (${customerPhone})` : '',
      };

      const res = await api.sales.create(payload);
      if (res.data?.invoice_number) {
        generatedInvoice = res.data.invoice_number;
      }
      toast.success(lang === 'bn' ? `বিক্রি সম্পন্ন! ইনভয়েস: ${generatedInvoice}` : `Sale completed! Invoice: ${generatedInvoice}`);
      fetchCatalog(); // Refresh live stock counts
    } catch (err) {
      toast.error(err.message || 'Failed to save sale in database.');
      setIsProcessingSale(false);
      return;
    } finally {
      setIsProcessingSale(false);
    }

    const orderData = {
      id: generatedInvoice,
      date: new Date().toLocaleString(),
      customer: customerName.trim() || (lang === 'bn' ? 'সাধারণ কাস্টমার' : 'Walk-in Customer'),
      phone: customerPhone.trim() || 'N/A',
      items: [...cart],
      subtotal,
      discountType,
      discountValue: parseFloat(discountValue) || 0,
      discount: discountAmount,
      total: totalPayable,
      method: paymentMethod,
      cashReceived: paymentMethod === 'Cash' ? (cashGivenNum || totalPayable) : totalPayable,
      changeToReturn: paymentMethod === 'Cash' ? changeToReturn : 0,
    };

    setCompletedOrder(orderData);
    setIsSuccessModalOpen(true);
  };

  const handleResetSale = () => {
    setCart([]);
    setCustomerName('');
    setCustomerPhone('');
    setDiscountValue('');
    setCashGiven('');
    setIsSuccessModalOpen(false);
    setCompletedOrder(null);
  };

  return (
    <div className="space-y-6 font-sans pb-12">
      
      {/* PAGE HEADER */}
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <Button
            variant="outline"
            size="icon"
            onClick={() => navigate('/sales')}
            className="w-9 h-9 rounded-xl dark:bg-[#121215] border-slate-200 dark:border-zinc-800"
            title="Back to Sales List"
          >
            <ArrowLeft className="w-4 h-4" />
          </Button>
          <div>
            <h1 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white tracking-tight">
              {lang === 'bn' ? 'নতুন বিক্রি ও ক্যাশ মেমো' : 'Point of Sale & Cash Memo'}
            </h1>
            <p className="text-xs sm:text-sm text-slate-500 dark:text-zinc-400 font-normal mt-0.5">
              {lang === 'bn'
                ? 'পণ্য নির্বাচন করুন, ফ্ল্যাট বা শতকরা ডিসকাউন্ট দিন এবং ক্যাশ ট্র্যাকিং করুন।'
                : 'Select items from catalog, apply flat or percentage discount, track cash tendered & change.'}
            </p>
          </div>
        </div>

        <Button
          variant="outline"
          size="sm"
          onClick={handleResetSale}
          className="text-xs dark:bg-[#121215] border-slate-200 dark:border-zinc-800"
        >
          {lang === 'bn' ? 'কার্ট খালি করুন' : 'Clear Cart'}
        </Button>
      </div>

      {/* TWO COLUMN POS LAYOUT */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        
        {/* LEFT 7 COLS: PRODUCT PICKER & SEARCH */}
        <div className="lg:col-span-7 space-y-4">
          
          {/* SEARCH AND CATEGORY BAR */}
          <Card className="p-4 border-slate-200/90 dark:border-zinc-800/80 dark:bg-[#121215] space-y-3">
            <div className="relative">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder={lang === 'bn' ? 'পণ্য বা বারকোড খুঁজুন...' : 'Search items by name, SKU or barcode...'}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-4 py-2.5 rounded-xl bg-slate-50 dark:bg-[#09090b] border border-slate-200 dark:border-zinc-800 text-xs text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-[#00df89]"
              />
            </div>

            {/* Category pills */}
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 no-scrollbar">
              {categories.map((cat) => (
                <button
                  key={cat}
                  onClick={() => setSelectedCategory(cat)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all ${
                    selectedCategory === cat
                      ? 'bg-[#00df89] text-[#011812]'
                      : 'bg-slate-100 dark:bg-zinc-900 text-slate-600 dark:text-zinc-400 hover:bg-slate-200 dark:hover:bg-zinc-800'
                  }`}
                >
                  {cat === 'all' ? (lang === 'bn' ? 'সকল পণ্য' : 'All Items') : (cat.charAt(0).toUpperCase() + cat.slice(1))}
                </button>
              ))}
            </div>
          </Card>

          {/* PRODUCTS GRID */}
          {isLoadingProducts ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3.5">
              {[1, 2, 3, 4, 5, 6].map((i) => (
                <Skeleton key={i} className="h-32 w-full rounded-2xl" />
              ))}
            </div>
          ) : filteredProducts.length === 0 ? (
            <Card className="p-12 text-center space-y-3 border-slate-200/90 dark:border-zinc-800/80 dark:bg-[#121215]">
              <Package className="w-10 h-10 text-slate-300 dark:text-zinc-600 mx-auto" />
              <h3 className="text-sm font-semibold text-slate-800 dark:text-zinc-200">No matching products found</h3>
              <p className="text-xs text-slate-500 dark:text-zinc-400">Add products to your catalog to start recording sales.</p>
            </Card>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3.5">
              {filteredProducts.map((product) => {
                const inCart = cart.find((i) => i.id === product.id);
                return (
                  <Card
                    key={product.id}
                    onClick={() => handleAddToCart(product)}
                    className={`p-3.5 rounded-2xl border cursor-pointer transition-all duration-150 relative overflow-hidden flex flex-col justify-between hover:border-[#00df89] hover:shadow-md dark:bg-[#121215] ${
                      inCart
                        ? 'border-[#00df89] bg-emerald-500/5 shadow-xs'
                        : 'border-slate-200/90 dark:border-zinc-800/80'
                    }`}
                  >
                    {inCart && (
                      <div className="absolute top-2.5 right-2.5 z-10 w-6 h-6 rounded-full bg-[#00df89] text-[#011812] flex items-center justify-center text-xs font-bold shadow-md">
                        {inCart.qty}
                      </div>
                    )}

                    <div className="space-y-2.5">
                      {/* Consistent Image Container with Fallback */}
                      <div className="w-full h-28 sm:h-32 rounded-xl overflow-hidden bg-slate-100/70 dark:bg-zinc-900/60 border border-slate-200/60 dark:border-zinc-800/60 flex items-center justify-center relative group">
                        {product.image_url ? (
                          <img
                            src={product.image_url}
                            alt={product.name}
                            className="w-full h-full object-contain p-1.5 transition-transform duration-200 group-hover:scale-105"
                            onError={(e) => {
                              e.target.style.display = 'none';
                              if (e.target.nextSibling) {
                                e.target.nextSibling.style.display = 'flex';
                              }
                            }}
                          />
                        ) : null}

                        <div
                          className={`w-full h-full flex flex-col items-center justify-center gap-1.5 text-slate-400 dark:text-zinc-600 ${
                            product.image_url ? 'hidden' : 'flex'
                          }`}
                        >
                          <Package className="w-8 h-8 stroke-[1.25] text-slate-300 dark:text-zinc-600" />
                          <span className="text-[10px] font-medium text-slate-400 dark:text-zinc-500 uppercase tracking-wider">
                            {product.category || 'Product'}
                          </span>
                        </div>
                      </div>

                      <div className="space-y-1">
                        <span className="text-[11px] text-slate-400 font-mono block truncate tracking-wide">{product.sku}</span>
                        <h4 className="text-sm sm:text-[15px] font-bold text-slate-900 dark:text-white line-clamp-2 leading-snug">
                          {product.name}
                        </h4>
                      </div>
                    </div>

                    <div className="pt-2.5 mt-3 border-t border-slate-100 dark:border-zinc-800/80 flex items-center justify-between">
                      <span className="text-sm sm:text-base font-bold text-[#00a86b] dark:text-[#00df89]">
                        ৳ {product.price.toLocaleString()}
                      </span>
                      <span className="text-xs text-slate-400 font-medium">
                        {product.stock} {product.unit} left
                      </span>
                    </div>
                  </Card>
                );
              })}
            </div>
          )}
        </div>

        {/* RIGHT 5 COLS: CART & CHECKOUT DRAWER */}
        <div className="lg:col-span-5 space-y-4">
          <Card className="p-5 border-slate-200/90 dark:border-zinc-800/80 dark:bg-[#121215] space-y-4 shadow-sm">
            
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-zinc-800/80 pb-3">
              <div className="flex items-center gap-2">
                <ShoppingCart className="w-4 h-4 text-[#00df89]" />
                <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                  {lang === 'bn' ? 'ক্যাশ মেমো কার্ট' : 'Checkout Memo'}
                </h3>
              </div>
              <Badge variant="secondary" className="text-xs font-mono font-semibold">
                {cart.reduce((a, b) => a + b.qty, 0)} items
              </Badge>
            </div>

            {/* CART ITEMS LIST */}
            {cart.length === 0 ? (
              <div className="py-8 text-center space-y-2 text-slate-400">
                <ShoppingCart className="w-8 h-8 mx-auto stroke-1" />
                <p className="text-xs font-normal">Your cart is empty. Click items on the left to add.</p>
              </div>
            ) : (
              <div className="space-y-2 max-h-52 overflow-y-auto pr-1">
                {cart.map((item) => (
                  <div
                    key={item.id}
                    className="p-2.5 rounded-xl bg-slate-50 dark:bg-[#09090b] border border-slate-100 dark:border-zinc-800 flex items-center justify-between gap-2 text-xs"
                  >
                    <div className="flex-1 min-w-0">
                      <h5 className="font-semibold text-slate-900 dark:text-white truncate">{item.name}</h5>
                      <span className="text-[11px] text-slate-400">
                        ৳ {item.price.toLocaleString()} / {item.unit}
                      </span>
                    </div>

                    <div className="flex items-center gap-1 bg-white dark:bg-zinc-800 rounded-lg p-0.5 border border-slate-200 dark:border-zinc-700">
                      <button
                        onClick={() => handleUpdateQty(item.id, -1)}
                        className="w-6 h-6 flex items-center justify-center text-slate-600 dark:text-zinc-300 hover:text-slate-900 cursor-pointer"
                      >
                        <Minus className="w-3 h-3" />
                      </button>
                      <span className="w-6 text-center font-bold">{item.qty}</span>
                      <button
                        onClick={() => handleUpdateQty(item.id, 1)}
                        className="w-6 h-6 flex items-center justify-center text-slate-600 dark:text-zinc-300 hover:text-slate-900 cursor-pointer"
                      >
                        <Plus className="w-3 h-3" />
                      </button>
                    </div>

                    <div className="w-16 text-right font-bold text-slate-900 dark:text-white">
                      ৳ {(item.price * item.qty).toLocaleString()}
                    </div>

                    <button
                      onClick={() => handleRemoveFromCart(item.id)}
                      className="p-1 text-slate-400 hover:text-rose-500 cursor-pointer"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            )}

            {/* CUSTOMER INFO & RETURNING CUSTOMER AUTOCOMPLETE */}
            <div className="pt-3 border-t border-slate-100 dark:border-zinc-800/80 space-y-2 relative">
              <div className="flex items-center justify-between text-xs font-semibold text-slate-700 dark:text-zinc-300">
                <div className="flex items-center gap-1.5">
                  <User className="w-3.5 h-3.5 text-[#00df89]" />
                  <span>{lang === 'bn' ? 'গ্রাহক / কাস্টমার তথ্য' : 'Customer Information'}</span>
                </div>
                {isSearchingCustomer ? (
                  <span className="flex items-center gap-1 text-[11px] text-slate-400">
                    <Loader2 className="w-3 h-3 animate-spin text-[#00df89]" />
                    <span>Searching database...</span>
                  </span>
                ) : matchedCustomer ? (
                  <button
                    type="button"
                    onClick={handleClearCustomer}
                    className="text-[11px] text-rose-500 hover:underline flex items-center gap-0.5 cursor-pointer font-normal"
                  >
                    <X className="w-3 h-3" /> Clear Customer
                  </button>
                ) : null}
              </div>

              <div className="grid grid-cols-2 gap-2 text-xs relative">
                {/* Phone Input with Autocomplete Dropdown */}
                <div className="relative">
                  <input
                    type="tel"
                    placeholder="Type Phone No. (e.g. 017...)"
                    value={customerPhone}
                    onChange={(e) => {
                      setCustomerPhone(e.target.value);
                      setShowCustomerDropdown(true);
                    }}
                    onFocus={() => {
                      if (customerSuggestions.length > 0) setShowCustomerDropdown(true);
                    }}
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-[#09090b] border border-slate-200 dark:border-zinc-800 outline-none focus:ring-1 focus:ring-[#00df89]"
                  />
                  {matchedCustomer && (
                    <span className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[#00a86b] dark:text-[#00df89]">
                      <CheckCircle2 className="w-4 h-4" />
                    </span>
                  )}

                  {/* AUTOCOMPLETE MATCHED CUSTOMERS DROPDOWN */}
                  {showCustomerDropdown && customerSuggestions.length > 0 && (
                    <div className="absolute top-full left-0 w-[180%] sm:w-[200%] mt-1 z-50 bg-white dark:bg-[#18181b] border border-slate-200 dark:border-zinc-700 rounded-2xl shadow-2xl overflow-hidden max-h-56 overflow-y-auto p-1.5 space-y-1 animate-in fade-in zoom-in-95 duration-100">
                      <div className="px-2.5 py-1 text-[10px] uppercase font-bold text-slate-400 dark:text-zinc-500 tracking-wider flex items-center justify-between border-b border-slate-100 dark:border-zinc-800 pb-1">
                        <span>Matched Customers ({customerSuggestions.length})</span>
                        <button
                          type="button"
                          onClick={() => setShowCustomerDropdown(false)}
                          className="hover:text-slate-700 dark:hover:text-white"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </div>

                      {customerSuggestions.map((cust) => (
                        <div
                          key={cust._id}
                          onClick={() => handleSelectCustomer(cust)}
                          className="p-2 rounded-xl hover:bg-slate-100 dark:hover:bg-zinc-800/80 cursor-pointer transition-all flex items-center justify-between gap-2 text-xs group"
                        >
                          <div className="min-w-0">
                            <div className="font-bold text-slate-900 dark:text-white truncate flex items-center gap-1.5">
                              <span>{cust.name}</span>
                              <Badge className="bg-emerald-500/15 text-[#00a86b] dark:text-[#00df89] text-[9px] font-bold px-1 py-0 border-0">
                                Loyal
                              </Badge>
                            </div>
                            <div className="text-[11px] text-slate-500 font-mono">
                              {cust.phone}
                            </div>
                          </div>

                          <div className="text-right shrink-0">
                            <div className="text-[11px] font-bold text-[#00a86b] dark:text-[#00df89]">
                              ৳ {(cust.totalSpent || cust.total_spent || 0).toLocaleString()}
                            </div>
                            <div className="text-[10px] text-slate-400">
                              {cust.totalOrders || cust.total_orders || 1} orders
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <input
                  type="text"
                  placeholder="Customer Name (Optional)"
                  value={customerName}
                  onChange={(e) => setCustomerName(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-[#09090b] border border-slate-200 dark:border-zinc-800 outline-none focus:ring-1 focus:ring-[#00df89]"
                />
              </div>
            </div>

            {/* DISCOUNT CONFIGURATION (FLAT / PERCENTAGE) */}
            <div className="p-3 rounded-xl bg-slate-50 dark:bg-[#09090b] border border-slate-200 dark:border-zinc-800 space-y-2">
              <div className="flex items-center justify-between text-xs">
                <label className="font-semibold text-slate-700 dark:text-zinc-300 flex items-center gap-1.5">
                  <Percent className="w-3.5 h-3.5 text-[#00df89]" />
                  <span>Discount Option</span>
                </label>

                {/* Flat vs Percentage Toggle */}
                <div className="flex items-center bg-slate-200 dark:bg-zinc-800 p-0.5 rounded-lg text-[11px]">
                  <button
                    type="button"
                    onClick={() => setDiscountType('flat')}
                    className={`px-2 py-0.5 rounded-md font-medium transition-all ${
                      discountType === 'flat'
                        ? 'bg-white dark:bg-zinc-900 text-slate-900 dark:text-white shadow-xs'
                        : 'text-slate-500'
                    }`}
                  >
                    Flat (৳)
                  </button>
                  <button
                    type="button"
                    onClick={() => setDiscountType('percentage')}
                    className={`px-2 py-0.5 rounded-md font-medium transition-all ${
                      discountType === 'percentage'
                        ? 'bg-white dark:bg-zinc-900 text-slate-900 dark:text-white shadow-xs'
                        : 'text-slate-500'
                    }`}
                  >
                    Percent (%)
                  </button>
                </div>
              </div>

              <div className="relative">
                <input
                  type="number"
                  placeholder={discountType === 'flat' ? 'Discount Amount (৳ e.g. 50)' : 'Discount Percentage (% e.g. 10)'}
                  value={discountValue}
                  onChange={(e) => setDiscountValue(e.target.value)}
                  className="w-full px-3 py-1.5 rounded-lg bg-white dark:bg-[#121215] border border-slate-200 dark:border-zinc-800 text-xs outline-none focus:ring-1 focus:ring-[#00df89]"
                />
                {discountAmount > 0 && (
                  <span className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[11px] font-bold text-rose-500">
                    - ৳ {discountAmount.toLocaleString()}
                  </span>
                )}
              </div>
            </div>

            {/* PAYMENT METHOD PICKER */}
            <div className="space-y-1.5 text-xs">
              <label className="text-slate-500 block font-medium">Payment Method</label>
              <div className="grid grid-cols-4 gap-1.5">
                {['Cash', 'bKash', 'Nagad', 'Card'].map((pm) => (
                  <button
                    key={pm}
                    type="button"
                    onClick={() => setPaymentMethod(pm)}
                    className={`py-2 rounded-xl font-semibold border text-center transition-all cursor-pointer ${
                      paymentMethod === pm
                        ? 'border-[#00df89] bg-[#00df89]/10 text-slate-900 dark:text-white'
                        : 'border-slate-200 dark:border-zinc-800 text-slate-600 dark:text-zinc-400'
                    }`}
                  >
                    {pm}
                  </button>
                ))}
              </div>
            </div>

            {/* CASH GIVEN & CHANGE CALCULATOR (IF CASH SELECTED) */}
            {paymentMethod === 'Cash' && (
              <div className="p-3 rounded-xl bg-slate-50 dark:bg-[#09090b] border border-slate-200 dark:border-zinc-800 space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <label className="font-semibold text-slate-700 dark:text-zinc-300 flex items-center gap-1.5">
                    <Coins className="w-3.5 h-3.5 text-[#00df89]" />
                    <span>Cash Received & Change</span>
                  </label>
                </div>

                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    placeholder="Customer Gave (৳)"
                    value={cashGiven}
                    onChange={(e) => setCashGiven(e.target.value)}
                    className="flex-1 px-3 py-1.5 rounded-lg bg-white dark:bg-[#121215] border border-slate-200 dark:border-zinc-800 text-xs font-semibold outline-none focus:ring-1 focus:ring-[#00df89]"
                  />
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => setCashGiven(String(totalPayable))}
                    className="text-[11px] h-8 px-2 dark:bg-[#121215]"
                  >
                    Exact
                  </Button>
                </div>

                {/* Quick denomination chips */}
                <div className="flex items-center gap-1.5 flex-wrap">
                  {[50, 100, 500, 1000].map((amt) => (
                    <button
                      key={amt}
                      type="button"
                      onClick={() => setCashGiven(String(amt))}
                      className="px-2 py-0.5 rounded-md bg-white dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700 text-[10px] font-semibold text-slate-700 dark:text-zinc-300 hover:border-[#00df89]"
                    >
                      ৳{amt}
                    </button>
                  ))}
                </div>

                {/* Live Change Box */}
                {cashGivenNum > 0 && (
                  <div className="pt-2 border-t border-slate-200 dark:border-zinc-800 flex items-center justify-between text-xs">
                    {cashGivenNum >= totalPayable ? (
                      <>
                        <span className="font-medium text-emerald-600 dark:text-[#00df89]">Change to Return:</span>
                        <span className="font-bold text-sm text-emerald-600 dark:text-[#00df89]">
                          ৳ {changeToReturn.toLocaleString()}
                        </span>
                      </>
                    ) : (
                      <>
                        <span className="font-medium text-amber-600">Remaining Due:</span>
                        <span className="font-bold text-sm text-amber-600">
                          ৳ {remainingDue.toLocaleString()}
                        </span>
                      </>
                    )}
                  </div>
                )}
              </div>
            )}

            {/* BILL SUMMARY */}
            <div className="pt-3 border-t border-slate-100 dark:border-zinc-800/80 space-y-1.5 text-xs">
              <div className="flex justify-between text-slate-500">
                <span>Subtotal ({cart.length} items)</span>
                <span className="font-semibold text-slate-800 dark:text-zinc-200">৳ {subtotal.toLocaleString()}</span>
              </div>
              {discountAmount > 0 && (
                <div className="flex justify-between text-rose-500">
                  <span>
                    Discount {discountType === 'percentage' ? `(${discountValue}%)` : '(Flat)'}
                  </span>
                  <span className="font-bold">- ৳ {discountAmount.toLocaleString()}</span>
                </div>
              )}
              <div className="flex justify-between items-baseline pt-2 border-t border-slate-100 dark:border-zinc-800 text-base font-bold text-slate-900 dark:text-white">
                <span>Total Payable:</span>
                <span className="text-xl text-[#00a86b] dark:text-[#00df89]">৳ {totalPayable.toLocaleString()}</span>
              </div>
            </div>

            {/* CHECKOUT BUTTON */}
            <Button
              onClick={handleCompleteSale}
              disabled={cart.length === 0 || isProcessingSale}
              className="w-full bg-[#00df89] hover:bg-[#00c97b] text-[#011812] font-bold text-sm h-11 gap-2 shadow-xs cursor-pointer"
            >
              {isProcessingSale ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4 stroke-[2.5]" />}
              <span>{isProcessingSale ? 'Processing...' : 'Complete & Generate Cash Memo'}</span>
            </Button>

          </Card>
        </div>

      </div>

      {/* COMPLETED RECEIPT MODAL */}
      {isSuccessModalOpen && completedOrder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs">
          <Card className="max-w-md w-full p-6 bg-white dark:bg-[#121215] border-slate-200 dark:border-zinc-800 space-y-4 shadow-2xl relative">
            
            {/* Top Right Close Button */}
            <button
              type="button"
              onClick={() => {
                setIsSuccessModalOpen(false);
                navigate('/sales');
              }}
              className="absolute top-4 right-4 p-1.5 rounded-xl text-slate-400 hover:text-slate-700 dark:hover:text-zinc-200 hover:bg-slate-100 dark:hover:bg-zinc-800/80 transition-colors cursor-pointer"
              title="Close & Go to Sales"
            >
              <X className="w-5 h-5" />
            </button>

            {/* Header */}
            <div className="text-center space-y-1 pt-1">
              <div className="w-12 h-12 rounded-full bg-emerald-500/10 text-[#00a86b] dark:text-[#00df89] flex items-center justify-center mx-auto">
                <CheckCircle2 className="w-6 h-6 stroke-[2.5]" />
              </div>
              <h2 className="text-lg font-bold text-slate-900 dark:text-white">Sale Completed Successfully!</h2>
              <p className="text-xs text-slate-400 font-mono">Invoice: {completedOrder.id}</p>
            </div>

            {/* Printable Receipt Content */}
            <div className="p-4 rounded-xl bg-slate-50 dark:bg-[#09090b] border border-slate-200 dark:border-zinc-800 space-y-3 text-xs">
              <div className="text-center pb-2 border-b border-slate-200 dark:border-zinc-800">
                <h3 className="font-bold text-sm text-slate-900 dark:text-white">{mongoShop?.name || 'Shopo Store'}</h3>
                <p className="text-[11px] text-slate-400">{completedOrder.date}</p>
              </div>

              <div className="space-y-1 text-[11px]">
                <div className="flex justify-between">
                  <span className="text-slate-500">Customer:</span>
                  <span className="font-semibold text-slate-800 dark:text-zinc-200">{completedOrder.customer}</span>
                </div>
                {completedOrder.phone !== 'N/A' && (
                  <div className="flex justify-between">
                    <span className="text-slate-500">Phone:</span>
                    <span className="font-mono text-slate-700 dark:text-zinc-300">{completedOrder.phone}</span>
                  </div>
                )}
                <div className="flex justify-between">
                  <span className="text-slate-500">Payment:</span>
                  <span className="font-semibold capitalize">{completedOrder.method}</span>
                </div>
              </div>

              {/* Items Table */}
              <div className="pt-2 border-t border-slate-200 dark:border-zinc-800 space-y-1.5">
                {completedOrder.items.map((item, idx) => (
                  <div key={idx} className="flex justify-between text-[11px]">
                    <span className="truncate pr-2">{item.name} x {item.qty}</span>
                    <span className="font-semibold shrink-0">৳ {(item.price * item.qty).toLocaleString()}</span>
                  </div>
                ))}
              </div>

              {/* Financial Totals */}
              <div className="pt-2 border-t border-slate-200 dark:border-zinc-800 space-y-1 text-xs">
                <div className="flex justify-between text-slate-500">
                  <span>Subtotal:</span>
                  <span>৳ {completedOrder.subtotal.toLocaleString()}</span>
                </div>
                {completedOrder.discount > 0 && (
                  <div className="flex justify-between text-rose-500">
                    <span>
                      Discount {completedOrder.discountType === 'percentage' ? `(${completedOrder.discountValue}%)` : '(Flat)'}:
                    </span>
                    <span className="font-bold">- ৳ {completedOrder.discount.toLocaleString()}</span>
                  </div>
                )}
                <div className="flex justify-between font-bold text-sm text-slate-900 dark:text-white pt-1 border-t border-slate-200 dark:border-zinc-800">
                  <span>Total Paid:</span>
                  <span className="text-[#00a86b] dark:text-[#00df89]">৳ {completedOrder.total.toLocaleString()}</span>
                </div>

                {completedOrder.method.toLowerCase() === 'cash' && (
                  <>
                    <div className="flex justify-between text-slate-600 dark:text-zinc-400 pt-1">
                      <span>Cash Received:</span>
                      <span className="font-semibold">৳ {completedOrder.cashReceived.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between text-emerald-600 dark:text-[#00df89] font-bold">
                      <span>Change Returned:</span>
                      <span>৳ {completedOrder.changeToReturn.toLocaleString()}</span>
                    </div>
                  </>
                )}
              </div>
            </div>

            {/* Modal Actions */}
            <div className="flex justify-end gap-2 pt-2 border-t border-slate-100 dark:border-zinc-800">
              <Button variant="outline" size="sm" onClick={handleResetSale}>
                New Sale
              </Button>
              <Button size="sm" onClick={() => window.print()} className="bg-[#00df89] hover:bg-[#00c97b] text-[#011812] font-semibold gap-1">
                <Printer className="w-3.5 h-3.5" /> Print Memo
              </Button>
            </div>
          </Card>
        </div>
      )}

    </div>
  );
}
