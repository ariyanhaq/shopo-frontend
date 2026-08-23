/**
 * @file POS.jsx
 * @description Fast-action Point of Sale (POS) Counter & Touch Terminal with Flat/Percentage Discounts and Cash Change Calculator.
 */
import { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useLanguage } from '@/context/LanguageContext';
import { useAuth } from '@/context/AuthContext';
import api from '@/services/api';
import toast from 'react-hot-toast';
import { printSaleReceipt } from '@/utils/invoicePrinter';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { VariantPickerModal } from '@/components/common';
import { useBodyScrollLock } from '@/hooks/useBodyScrollLock';
import {
  Store, Search, Plus, Minus, Trash2, CheckCircle2,
  Printer, ArrowLeft, RefreshCw, Loader2, Sparkles, Package,
  Percent, Coins, X, User, UserCheck, Phone, Layers,
  Crown, Star, Gift, Award
} from 'lucide-react';

const getTierBadgeStyle = (rawColor = '#10b981') => {
  let hex = typeof rawColor === 'string' && rawColor.trim().startsWith('#') ? rawColor.trim() : '#10b981';
  if (hex.length === 4) {
    hex = `#${hex[1]}${hex[1]}${hex[2]}${hex[2]}${hex[3]}${hex[3]}`;
  }
  return {
    backgroundColor: `${hex}18`,
    color: hex,
    borderColor: `${hex}38`,
  };
};

export default function POS() {
  const navigate = useNavigate();
  const { lang } = useLanguage();
  const { mongoShop } = useAuth();

  const [products, setProducts] = useState([]);
  const [cart, setCart] = useState([]);
  const [search, setSearch] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [customerName, setCustomerName] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('Cash');
  const [discountType, setDiscountType] = useState('flat'); // 'flat' | 'percentage'
  const [discountValue, setDiscountValue] = useState('');
  const [cashGiven, setCashGiven] = useState('');
  const [duePaidAmount, setDuePaidAmount] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isCheckingOut, setIsCheckingOut] = useState(false);
  const [receipt, setReceipt] = useState(null);

  // Membership & Reward Points State
  const [membershipConfig, setMembershipConfig] = useState(null);
  const [isApplyingTierDiscount, setIsApplyingTierDiscount] = useState(true);
  const [isRedeemingPoints, setIsRedeemingPoints] = useState(false);
  const [pointsToRedeem, setPointsToRedeem] = useState('');

  // Variant Picker Modal for products with multiple variations
  const [variantPickerProduct, setVariantPickerProduct] = useState(null);

  useBodyScrollLock(Boolean(receipt || variantPickerProduct));

  // Auto-fill & Search Customer State
  const [customerSuggestions, setCustomerSuggestions] = useState([]);
  const [showCustomerDropdown, setShowCustomerDropdown] = useState(false);
  const [matchedCustomer, setMatchedCustomer] = useState(null);
  const [isSearchingCustomer, setIsSearchingCustomer] = useState(false);

  // Fetch shop membership settings on mount
  useEffect(() => {
    api.membership.getSettings()
      .then((res) => {
        if (res?.data) setMembershipConfig(res.data);
      })
      .catch((err) => console.warn('Could not load membership config:', err));
  }, []);

  // Debounced Customer Lookup by Phone
  useEffect(() => {
    const q = customerPhone.trim();
    if (q.length < 2) {
      setCustomerSuggestions([]);
      setShowCustomerDropdown(false);
      if (!q) setMatchedCustomer(null);
      return;
    }

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

        const exact = list.find((c) => c.phone && c.phone === q);
        if (exact) {
          setMatchedCustomer(exact);
          if (!customerName.trim() || customerName === 'Walk-in Customer') {
            setCustomerName(exact.name || '');
          }
        }
      } catch (err) {
        console.warn('POS customer lookup error:', err);
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
    const previousDueAmount = cust.total_due ?? cust.totalDue ?? 0;
    if (previousDueAmount > 0) {
      toast.success(
        lang === 'bn'
          ? `'${cust.name}' সিলেক্ট করা হয়েছে (পূর্বের বকেয়া: ৳${previousDueAmount.toLocaleString()})`
          : `Selected: ${cust.name} (Previous Due: ৳${previousDueAmount.toLocaleString()})`
      );
    } else {
      toast.success(lang === 'bn' ? `'${cust.name}' সিলেক্ট করা হয়েছে` : `Selected: ${cust.name}`);
    }
  };

  const handleClearCustomer = () => {
    setMatchedCustomer(null);
    setCustomerPhone('');
    setCustomerName('');
    setShowCustomerDropdown(false);
    setCustomerSuggestions([]);
  };

  const fetchProducts = async () => {
    setIsLoading(true);
    try {
      const res = await api.products.list();
      const rawList = Array.isArray(res?.data)
        ? res.data
        : Array.isArray(res?.data?.docs)
        ? res.data.docs
        : [];
      setProducts(rawList);
    } catch (err) {
      console.warn('POS failed to load products:', err.message);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchProducts();
  }, []);

  const filtered = useMemo(() => {
    const q = search.toLowerCase().trim();
    if (!q) return products;
    return products.filter(p =>
      p.name.toLowerCase().includes(q) ||
      (p.sku && p.sku.toLowerCase().includes(q)) ||
      (p.barcode && p.barcode.toLowerCase().includes(q))
    );
  }, [products, search]);

  const addToCart = (prod) => {
    if (prod.has_variants && Array.isArray(prod.variants) && prod.variants.length > 0) {
      setVariantPickerProduct(prod);
      return;
    }
    const cartKey = String(prod._id);
    const exists = cart.find(c => c.cart_id === cartKey || c.id === cartKey);
    if (exists) {
      setCart(cart.map(c => (c.cart_id === cartKey || c.id === cartKey) ? { ...c, qty: c.qty + 1 } : c));
    } else {
      setCart([...cart, {
        cart_id: cartKey,
        id: cartKey,
        product_id: prod._id,
        name: prod.name,
        price: prod.selling_price,
        qty: 1,
        unit: prod.unit || 'pcs'
      }]);
    }
  };

  const addVariantToCart = (parentProd, variant) => {
    const parentId = parentProd._id || parentProd.id;
    const variantId = variant._id || variant.id;
    const cartKey = `${parentId}_${variantId}`;
    const exists = cart.find(c => c.cart_id === cartKey || c.id === cartKey);
    if (exists) {
      setCart(cart.map(c => (c.cart_id === cartKey || c.id === cartKey) ? { ...c, qty: c.qty + 1 } : c));
    } else {
      setCart([...cart, {
        cart_id: cartKey,
        id: cartKey,
        product_id: parentId,
        variant_id: variantId,
        variant_name: variant.name,
        name: `${parentProd.name} (${variant.name})`,
        price: variant.selling_price || parentProd.selling_price,
        qty: 1,
        unit: parentProd.unit || 'pcs',
      }]);
    }
    toast.success(lang === 'bn' ? `'${variant.name}' কার্টে যুক্ত হয়েছে!` : `Added '${variant.name}' to bill!`);
  };

  const updateVariantQty = (parentProd, variant, delta) => {
    const parentId = parentProd._id || parentProd.id;
    const variantId = variant._id || variant.id;
    const cartKey = `${parentId}_${variantId}`;
    updateQty(cartKey, delta);
  };

  const updateQty = (id, delta) => {
    setCart(cart.map(c => {
      if (c.cart_id === id || c.id === id) {
        const n = c.qty + delta;
        return n > 0 ? { ...c, qty: n } : null;
      }
      return c;
    }).filter(Boolean));
  };

  const subtotal = useMemo(() => {
    return cart.reduce((acc, c) => acc + (c.price * c.qty), 0);
  }, [cart]);

  const discountAmount = useMemo(() => {
    const val = parseFloat(discountValue) || 0;
    if (discountType === 'percentage') {
      return (subtotal * val) / 100;
    }
    return Math.min(val, subtotal);
  }, [subtotal, discountType, discountValue]);

  // Reward Points Calculations for POS
  const memberPointsAvailable = useMemo(() => {
    if (!matchedCustomer || !matchedCustomer.is_member) return 0;
    return Number(matchedCustomer.reward_points || 0);
  }, [matchedCustomer]);

  // Look up customer's tier configuration
  const matchedCustomerTier = useMemo(() => {
    if (!matchedCustomer?.is_member || !membershipConfig?.tiers) return null;
    const tName = matchedCustomer.membership_tier || 'Regular';
    return membershipConfig.tiers.find(
      (t) => t.name && t.name.toLowerCase() === tName.toLowerCase()
    ) || null;
  }, [matchedCustomer, membershipConfig]);

  const tierDiscountPercent = Number(matchedCustomerTier?.extra_discount_percent || 0);
  const hasTierDiscount = Boolean(matchedCustomer?.is_member && tierDiscountPercent > 0);
  const tierAutoDiscountAmount = useMemo(() => {
    if (!hasTierDiscount || !isApplyingTierDiscount || subtotal <= 0) return 0;
    return (subtotal * tierDiscountPercent) / 100;
  }, [hasTierDiscount, isApplyingTierDiscount, subtotal, tierDiscountPercent]);

  const tierPointRedeemRate = Number(matchedCustomerTier?.point_redeem_value || 0);
  const minPointsRequired = Number(matchedCustomerTier?.min_points_to_redeem || 0);
  const hasPointsRedeemSystem = Boolean(matchedCustomer?.is_member && tierPointRedeemRate > 0);

  const isEligibleToRedeem = Boolean(
    hasPointsRedeemSystem &&
    membershipConfig?.enabled !== false &&
    matchedCustomer?.is_member &&
    memberPointsAvailable >= minPointsRequired &&
    memberPointsAvailable > 0
  );

  const rewardDiscountAmount = useMemo(() => {
    if (!isRedeemingPoints || !isEligibleToRedeem) return 0;
    const requested = Number(pointsToRedeem) || 0;
    if (requested <= 0) return 0;
    const actualPoints = Math.min(requested, memberPointsAvailable);
    const maxDiscount = Math.max(0, subtotal - discountAmount - tierAutoDiscountAmount);
    return Math.min(actualPoints * tierPointRedeemRate, maxDiscount);
  }, [isRedeemingPoints, isEligibleToRedeem, pointsToRedeem, memberPointsAvailable, tierPointRedeemRate, subtotal, discountAmount, tierAutoDiscountAmount]);

  const totalPayable = Math.max(0, subtotal - discountAmount - tierAutoDiscountAmount - rewardDiscountAmount);

  // Projected Points Earned on this POS Order based on customer's tier
  const pointsEarnedOnSale = useMemo(() => {
    if (!membershipConfig?.enabled || !matchedCustomer?.is_member || totalPayable <= 0) return 0;
    const spendUnit = Number(matchedCustomerTier?.earn_spend_unit || 0);
    const pointsPerUnit = Number(matchedCustomerTier?.earn_points_per_unit || 0);
    if (spendUnit <= 0 || pointsPerUnit <= 0) return 0;
    return Math.floor(totalPayable / spendUnit) * pointsPerUnit;
  }, [membershipConfig, matchedCustomer, matchedCustomerTier, totalPayable]);

  // Customer Previous Due Calculation
  const previousCustomerDue = useMemo(() => {
    if (!matchedCustomer) return 0;
    return Number(matchedCustomer.total_due ?? matchedCustomer.totalDue ?? 0);
  }, [matchedCustomer]);

  // Dynamic Payment & Due Breakdown Calculations
  const { paidNow, currentBillDue, changeToReturn, totalOutstandingDue } = useMemo(() => {
    let paid = 0;
    let change = 0;
    let billDue = 0;

    if (paymentMethod === 'Due') {
      const enteredPaid = parseFloat(duePaidAmount);
      if (isNaN(enteredPaid) || enteredPaid <= 0) {
        paid = 0;
      } else {
        paid = Math.min(enteredPaid, totalPayable);
      }
      billDue = Math.max(0, totalPayable - paid);
      change = 0;
    } else if (paymentMethod === 'Cash') {
      const cashGivenNum = parseFloat(cashGiven) || 0;
      if (cashGivenNum > 0) {
        if (cashGivenNum >= totalPayable) {
          paid = totalPayable;
          change = cashGivenNum - totalPayable;
          billDue = 0;
        } else {
          paid = cashGivenNum;
          change = 0;
          billDue = totalPayable - cashGivenNum;
        }
      } else {
        paid = totalPayable;
        change = 0;
        billDue = 0;
      }
    } else {
      // bKash, Nagad, Card
      paid = totalPayable;
      change = 0;
      billDue = 0;
    }

    const totalDue = previousCustomerDue + billDue;

    return {
      paidNow: paid,
      currentBillDue: billDue,
      changeToReturn: change,
      totalOutstandingDue: totalDue,
    };
  }, [paymentMethod, duePaidAmount, cashGiven, totalPayable, previousCustomerDue]);

  const handleCheckout = async () => {
    if (cart.length === 0) return;

    if ((paymentMethod === 'Due' || currentBillDue > 0) && !customerName.trim() && !customerPhone.trim() && !matchedCustomer) {
      toast.error(
        lang === 'bn'
          ? 'বকেয়া হিসাব রাখার জন্য কাস্টমারের ফোন বা নাম প্রদান করুন।'
          : 'Please provide customer phone or name to record this due balance.'
      );
      return;
    }

    setIsCheckingOut(true);
    let serverPreviousDue = previousCustomerDue;
    let serverTotalDue = totalOutstandingDue;

    const actualPointsRedeemed = isRedeemingPoints ? (Number(pointsToRedeem) || 0) : 0;

    try {
      const res = await api.sales.create({
        customer_id: matchedCustomer?._id || undefined,
        customer_name: customerName.trim() || undefined,
        customer_phone: customerPhone.trim() || undefined,
        items: cart.map(c => ({
          product_id: c.product_id || c.id,
          variant_id: c.variant_id || undefined,
          variant_name: c.variant_name || undefined,
          quantity: c.qty
        })),
        discount_type: discountType,
        discount_value: parseFloat(discountValue) || 0,
        discount: discountAmount,
        apply_tier_discount: Boolean(isApplyingTierDiscount && hasTierDiscount),
        reward_points_redeemed: actualPointsRedeemed,
        paid_amount: paidNow,
        tendered_amount: paymentMethod === 'Cash' ? (parseFloat(cashGiven) || paidNow) : paidNow,
        change_amount: paymentMethod === 'Cash' ? changeToReturn : 0,
        payment_method: paymentMethod.toLowerCase(),
        note: 'POS Terminal Checkout',
      });

      if (res.data?.previous_due !== undefined) {
        serverPreviousDue = res.data.previous_due;
      }
      if (res.data?.total_customer_due !== undefined) {
        serverTotalDue = res.data.total_customer_due;
      }

      const inv = res.data?.invoice_number || `INV-${Date.now().toString().slice(-6)}`;
      setReceipt({
        invoice: inv,
        customerName: customerName || (matchedCustomer?.name ? matchedCustomer.name : 'Walk-in Customer'),
        customerPhone: customerPhone || (matchedCustomer?.phone || ''),
        items: [...cart],
        subtotal,
        discountType,
        discountValue: parseFloat(discountValue) || 0,
        discount: discountAmount,
        tierDiscountPercent: hasTierDiscount && isApplyingTierDiscount ? tierDiscountPercent : 0,
        tierDiscountAmount: hasTierDiscount && isApplyingTierDiscount ? tierAutoDiscountAmount : 0,
        rewardPointsEarned: pointsEarnedOnSale,
        rewardPointsRedeemed: actualPointsRedeemed,
        rewardDiscountAmount,
        isMember: Boolean(matchedCustomer?.is_member),
        memberTier: matchedCustomer?.membership_tier || 'Regular',
        total: totalPayable,
        paidAmount: paidNow,
        currentBillDue: currentBillDue,
        previousDue: serverPreviousDue,
        totalDue: serverTotalDue,
        paymentMethod,
        cashReceived: paymentMethod === 'Cash' ? (parseFloat(cashGiven) || paidNow) : paidNow,
        changeToReturn,
        date: new Date().toLocaleString(),
      });
      setCart([]);
      setDiscountValue('');
      setCashGiven('');
      setDuePaidAmount('');
      setCustomerPhone('');
      setCustomerName('');
      setMatchedCustomer(null);
      toast.success(lang === 'bn' ? `পেমেন্ট সম্পন্ন! ইনভয়েস: ${inv}` : `POS Checkout complete! Invoice: ${inv}`);
      fetchProducts();
    } catch (err) {
      toast.error(err.message || 'POS Checkout failed.');
    } finally {
      setIsCheckingOut(false);
    }
  };

  return (
    <div className="space-y-4 font-sans pb-12">
      
      {/* HEADER */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Button variant="outline" size="sm" onClick={() => navigate('/sales')} className="text-xs dark:bg-zinc-900 border-slate-200 dark:border-zinc-800">
            <ArrowLeft className="w-4 h-4 mr-1" /> Back
          </Button>
          <h1 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <Store className="w-5 h-5 text-[#00df89]" />
            <span>{lang === 'bn' ? 'পিওএস কাউন্টার টার্মিনাল' : 'POS Counter Terminal'}</span>
          </h1>
        </div>

        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={() => { setCart([]); setDiscountValue(''); setCashGiven(''); }} className="text-xs dark:bg-zinc-900 border-slate-200 dark:border-zinc-800">
            Clear
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
        
        {/* PRODUCTS TOUCH GRID */}
        <div className="lg:col-span-8 space-y-3">
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search product or scan barcode..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-4 py-2.5 rounded-xl bg-slate-50 dark:bg-[#121215] border border-slate-200 dark:border-zinc-800 text-xs text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-[#00df89]"
            />
          </div>

          {isLoading ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3.5">
              {[1, 2, 3, 4, 5, 6].map((i) => (
                <Skeleton key={i} className="h-32 w-full rounded-2xl" />
              ))}
            </div>
          ) : filtered.length === 0 ? (
            <div className="p-12 text-center rounded-2xl bg-white dark:bg-[#121215] border border-slate-200 dark:border-zinc-800 text-xs text-slate-400">
              No products found.
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3.5 max-h-[65vh] overflow-y-auto pr-1">
              {filtered.map((p) => (
                <Card
                  key={p._id}
                  onClick={() => addToCart(p)}
                  className="p-3.5 rounded-2xl border-slate-200/90 dark:border-zinc-800/80 dark:bg-[#121215] cursor-pointer hover:border-[#00df89] hover:shadow-md transition-all flex flex-col justify-between"
                >
                  <div className="space-y-2.5">
                    {/* Consistent Image Container with Fallback */}
                    <div className="w-full h-28 sm:h-32 rounded-xl overflow-hidden bg-slate-100/70 dark:bg-zinc-900/60 border border-slate-200/60 dark:border-zinc-800/60 flex items-center justify-center relative group">
                      {p.image_url ? (
                        <img
                          src={p.image_url}
                          alt={p.name}
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
                          p.image_url ? 'hidden' : 'flex'
                        }`}
                      >
                        <Package className="w-8 h-8 stroke-[1.25] text-slate-300 dark:text-zinc-600" />
                        <span className="text-[10px] font-medium text-slate-400 dark:text-zinc-500 uppercase tracking-wider">
                          {p.category_id?.name || 'General'}
                        </span>
                      </div>
                    </div>

                    <div className="space-y-1">
                      <span className="text-[11px] text-slate-400 font-mono block truncate tracking-wide">{p.sku || 'SKU'}</span>
                      <h4 className="text-sm sm:text-[15px] font-bold text-slate-900 dark:text-white line-clamp-2 leading-snug">{p.name}</h4>
                    </div>
                  </div>

                  <div className="pt-2.5 mt-3 border-t border-slate-100 dark:border-zinc-800 flex items-center justify-between gap-1">
                    <span className="text-sm sm:text-base font-bold text-[#00a86b] dark:text-[#00df89]">৳ {p.selling_price.toLocaleString()}</span>
                    {p.has_variants && Array.isArray(p.variants) && p.variants.length > 0 ? (
                      (() => {
                        const totalVarStock = p.variants.reduce((sum, v) => sum + (Number(v.stock_quantity) || 0), 0);
                        return (
                          <div className="flex items-center gap-1.5 shrink-0">
                            <span className={`text-[11px] font-semibold ${totalVarStock <= 0 ? 'text-rose-500 font-bold' : 'text-slate-500 dark:text-zinc-400'}`}>
                              {totalVarStock} {p.unit ? (p.unit === 'piece' ? 'pcs' : p.unit) : 'left'}
                            </span>
                            <span className="px-1.5 py-0.5 rounded-full text-[10px] font-bold bg-[#00df89]/15 text-[#00a86b] dark:text-[#00df89] border border-[#00df89]/30 flex items-center gap-1">
                              <Layers className="w-2.5 h-2.5" />
                              <span>{p.variants.length} Variants</span>
                            </span>
                          </div>
                        );
                      })()
                    ) : (
                      <span className={`text-xs font-semibold ${(p.stock_quantity || 0) <= 0 ? 'text-rose-500 font-bold' : 'text-slate-400 dark:text-zinc-400'}`}>
                        {p.stock_quantity || 0} {p.unit ? (p.unit === 'piece' ? 'pcs' : p.unit) : 'left'}
                      </span>
                    )}
                  </div>
                </Card>
              ))}
            </div>
          )}
        </div>

        {/* REGISTER CART */}
        <div className="lg:col-span-4 space-y-3">
          <Card className="p-4 border-slate-200/90 dark:border-zinc-800/80 dark:bg-[#121215] space-y-3 shadow-sm">
            <h3 className="text-sm font-bold text-slate-900 dark:text-white border-b border-slate-100 dark:border-zinc-800 pb-2">
              Current Bill ({cart.reduce((a, b) => a + b.qty, 0)} items)
            </h3>

            {cart.length === 0 ? (
              <div className="py-8 text-center text-slate-400 text-xs">
                Tap products on left to add to bill.
              </div>
            ) : (
              <div className="space-y-2 max-h-44 overflow-y-auto pr-1">
                {cart.map((c) => (
                  <div key={c.id} className="flex items-center justify-between text-xs bg-slate-50 dark:bg-[#09090b] p-2 rounded-xl border border-slate-100 dark:border-zinc-800">
                    <div className="flex-1 min-w-0 pr-2">
                      <div className="font-semibold truncate text-slate-900 dark:text-white">{c.name}</div>
                      <div className="text-[10px] text-slate-400">৳ {c.price} x {c.qty}</div>
                    </div>
                    <div className="flex items-center gap-1">
                      <button onClick={() => updateQty(c.id, -1)} className="w-5 h-5 flex items-center justify-center bg-white dark:bg-zinc-800 rounded cursor-pointer">
                        <Minus className="w-3 h-3" />
                      </button>
                      <span className="w-5 text-center font-bold">{c.qty}</span>
                      <button onClick={() => updateQty(c.id, 1)} className="w-5 h-5 flex items-center justify-center bg-white dark:bg-zinc-800 rounded cursor-pointer">
                        <Plus className="w-3 h-3" />
                      </button>
                    </div>
                    <div className="w-14 text-right font-bold text-slate-900 dark:text-white">
                      ৳ {(c.price * c.qty).toLocaleString()}
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* CUSTOMER INFO & RETURNING CUSTOMER AUTOCOMPLETE */}
            <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-[#09090b] border border-slate-200 dark:border-zinc-800 space-y-1.5 text-xs relative">
              <div className="flex items-center justify-between">
                <span className="font-semibold text-slate-700 dark:text-zinc-300 flex items-center gap-1">
                  <User className="w-3.5 h-3.5 text-[#00df89]" /> Customer (Optional):
                </span>
                {isSearchingCustomer ? (
                  <span className="flex items-center gap-1 text-[10px] text-slate-400">
                    <Loader2 className="w-2.5 h-2.5 animate-spin text-[#00df89]" /> Looking up...
                  </span>
                ) : matchedCustomer ? (
                  <button
                    type="button"
                    onClick={handleClearCustomer}
                    className="text-[10px] text-rose-500 hover:underline flex items-center gap-0.5 cursor-pointer"
                  >
                    <X className="w-2.5 h-2.5" /> Clear
                  </button>
                ) : null}
              </div>

              <div className="grid grid-cols-2 gap-1.5 relative">
                <div className="relative">
                  <input
                    type="tel"
                    placeholder="Phone No."
                    value={customerPhone}
                    onChange={(e) => {
                      setCustomerPhone(e.target.value);
                      setShowCustomerDropdown(true);
                    }}
                    onFocus={() => {
                      if (customerSuggestions.length > 0) setShowCustomerDropdown(true);
                    }}
                    className="w-full px-2.5 py-1.5 rounded-lg bg-white dark:bg-[#121215] border border-slate-200 dark:border-zinc-800 text-xs outline-none focus:ring-1 focus:ring-[#00df89]"
                  />
                  {matchedCustomer && (
                    <span className="absolute right-2 top-1/2 -translate-y-1/2 text-[#00a86b] dark:text-[#00df89]">
                      <CheckCircle2 className="w-3.5 h-3.5" />
                    </span>
                  )}

                  {/* AUTOCOMPLETE DROPDOWN */}
                  {showCustomerDropdown && customerSuggestions.length > 0 && (
                    <div className="absolute top-full left-0 w-[190%] mt-1 z-50 bg-white dark:bg-[#18181b] border border-slate-200 dark:border-zinc-700 rounded-xl shadow-2xl overflow-hidden max-h-52 overflow-y-auto p-1 space-y-1">
                      <div className="px-2 py-0.5 text-[9px] uppercase font-bold text-slate-400 dark:text-zinc-500 flex items-center justify-between border-b border-slate-100 dark:border-zinc-800">
                        <span>Matched Customers ({customerSuggestions.length})</span>
                        <button
                          type="button"
                          onClick={() => setShowCustomerDropdown(false)}
                          className="hover:text-slate-700 dark:hover:text-white"
                        >
                          <X className="w-2.5 h-2.5" />
                        </button>
                      </div>

                      {customerSuggestions.map((cust) => {
                        const custDue = cust.total_due ?? cust.totalDue ?? 0;
                        return (
                          <div
                            key={cust._id}
                            onClick={() => handleSelectCustomer(cust)}
                            className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-zinc-800/80 cursor-pointer transition-all flex items-center justify-between gap-1.5 text-xs"
                          >
                            <div className="min-w-0">
                              <div className="font-bold text-slate-900 dark:text-white truncate text-[11px] flex items-center gap-1">
                                <span>{cust.name}</span>
                                {custDue > 0 && (
                                  <Badge className="bg-amber-500/15 text-amber-600 dark:text-amber-400 text-[8px] font-bold px-1 py-0 border-0">
                                    Due: ৳{custDue.toLocaleString()}
                                  </Badge>
                                )}
                              </div>
                              <div className="text-[10px] text-slate-500 font-mono">
                                {cust.phone}
                              </div>
                            </div>

                            <div className="text-right shrink-0">
                              <div className="text-[10px] font-bold text-[#00a86b] dark:text-[#00df89]">
                                ৳ {(cust.totalSpent || cust.total_spent || 0).toLocaleString()}
                              </div>
                              <div className="text-[9px] text-slate-400">
                                {cust.totalOrders || cust.total_orders || 1} orders
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>

                <input
                  type="text"
                  placeholder="Customer Name"
                  value={customerName}
                  onChange={(e) => setCustomerName(e.target.value)}
                  className="w-full px-2.5 py-1.5 rounded-lg bg-white dark:bg-[#121215] border border-slate-200 dark:border-zinc-800 text-xs outline-none focus:ring-1 focus:ring-[#00df89]"
                />
              </div>

              {/* POS PREVIOUS DUE ALERT */}
              {previousCustomerDue > 0 && (
                <div className="p-2 rounded-lg bg-amber-500/10 border border-amber-500/30 flex items-center justify-between text-[11px] font-bold text-amber-700 dark:text-amber-400">
                  <span>Previous Due Balance:</span>
                  <span className="font-mono text-xs">৳ {previousCustomerDue.toLocaleString()}</span>
                </div>
              )}

              {/* VIP MEMBERSHIP & REWARD POINTS RECOGNITION */}
              {matchedCustomer?.is_member && (
                <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-zinc-900/90 border border-slate-200 dark:border-zinc-800 space-y-2 text-xs animate-in fade-in">
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2 min-w-0">
                      <div className="w-6 h-6 rounded-full bg-slate-200 dark:bg-zinc-800 text-slate-700 dark:text-zinc-200 border border-slate-300 dark:border-zinc-700 flex items-center justify-center font-bold text-[10px] shrink-0">
                        {(matchedCustomer.name || 'C')
                          .split(' ')
                          .map((n) => n[0])
                          .slice(0, 2)
                          .join('')
                          .toUpperCase()}
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center gap-1.5 font-semibold text-slate-900 dark:text-white text-[11px]">
                          <span className="truncate">{matchedCustomer.name}</span>
                          {(() => {
                            const tierColor = matchedCustomerTier?.color || '#10b981';
                            const tierBadgeStyle = getTierBadgeStyle(tierColor);

                            return (
                              <span
                                className="text-[9px] font-semibold px-1.5 py-0.2 rounded-full border transition-colors shadow-2xs"
                                style={tierBadgeStyle}
                              >
                                {matchedCustomer.membership_tier || 'Regular'}
                              </span>
                            );
                          })()}
                        </div>
                      </div>
                    </div>

                    {hasPointsRedeemSystem && (
                      <div className="text-right shrink-0">
                        <div className="text-[11px] font-bold text-slate-900 dark:text-white flex items-center justify-end gap-1 font-mono">
                          <Star className="w-2.5 h-2.5 text-amber-500 fill-amber-400" />
                          <span>{memberPointsAvailable.toLocaleString()}</span>
                          <span className="text-[9px] text-slate-400 font-normal">pts</span>
                        </div>
                        {tierPointRedeemRate > 0 && memberPointsAvailable > 0 && (
                          <span className="text-[9px] text-slate-400 font-mono">
                            ≈ ৳{(memberPointsAvailable * tierPointRedeemRate).toFixed(0)} discount
                          </span>
                        )}
                      </div>
                    )}
                  </div>

                  {/* 1. TIER PERCENTAGE DISCOUNT OPTION */}
                  {hasTierDiscount && (
                    <div className="p-2 rounded-lg bg-emerald-500/10 border border-emerald-500/20 space-y-1">
                      <div className="flex items-center justify-between">
                        <label className="flex items-center gap-1.5 cursor-pointer select-none font-semibold text-[11px] text-emerald-800 dark:text-[#00df89]">
                          <input
                            type="checkbox"
                            checked={isApplyingTierDiscount}
                            onChange={(e) => setIsApplyingTierDiscount(e.target.checked)}
                            className="w-3.5 h-3.5 text-[#00df89] rounded border-slate-300 focus:ring-[#00df89]"
                          />
                          <span>{matchedCustomerTier?.name || 'Tier'} Auto Discount ({tierDiscountPercent}%)</span>
                        </label>
                        {isApplyingTierDiscount && tierAutoDiscountAmount > 0 && (
                          <span className="text-[11px] font-bold font-mono text-emerald-700 dark:text-[#00df89]">
                            - ৳{tierAutoDiscountAmount.toFixed(2)}
                          </span>
                        )}
                      </div>
                    </div>
                  )}

                  {/* 2. REWARD POINTS REDEMPTION OPTION */}
                  {hasPointsRedeemSystem && (
                    <>
                      {isEligibleToRedeem ? (
                        <div className="p-2 rounded-lg bg-amber-500/10 border border-amber-500/20 space-y-1.5">
                          <div className="flex items-center justify-between">
                            <label className="flex items-center gap-1.5 cursor-pointer select-none font-semibold text-[11px] text-amber-800 dark:text-amber-300">
                              <input
                                type="checkbox"
                                checked={isRedeemingPoints}
                                onChange={(e) => {
                                  setIsRedeemingPoints(e.target.checked);
                                  if (e.target.checked && !pointsToRedeem) {
                                    setPointsToRedeem(String(memberPointsAvailable));
                                  }
                                }}
                                className="w-3.5 h-3.5 text-amber-500 rounded border-slate-300 focus:ring-amber-500"
                              />
                              <span>Redeem Points ({memberPointsAvailable} pts)</span>
                            </label>
                            {isRedeemingPoints && rewardDiscountAmount > 0 && (
                              <span className="text-[11px] font-bold font-mono text-amber-700 dark:text-amber-400">
                                - ৳{rewardDiscountAmount.toFixed(2)}
                              </span>
                            )}
                          </div>

                          {isRedeemingPoints && (
                            <div className="flex items-center gap-1.5">
                              <input
                                type="number"
                                min="1"
                                max={memberPointsAvailable}
                                placeholder={`Points (Max ${memberPointsAvailable})`}
                                value={pointsToRedeem}
                                onChange={(e) => setPointsToRedeem(e.target.value)}
                                className="flex-1 px-2 py-1 rounded-lg bg-white dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 text-[11px] font-mono text-slate-900 dark:text-white outline-none focus:ring-1 focus:ring-amber-500"
                              />
                              <button
                                type="button"
                                onClick={() => setPointsToRedeem(String(memberPointsAvailable))}
                                className="text-[10px] px-2 py-1 rounded-lg border border-slate-200 dark:border-zinc-800 text-slate-700 dark:text-zinc-300 hover:bg-slate-100 dark:hover:bg-zinc-800 cursor-pointer font-semibold"
                              >
                                Max
                              </button>
                            </div>
                          )}
                        </div>
                      ) : (
                        <div className="text-[10px] text-slate-400 pt-1 border-t border-slate-200/70 dark:border-zinc-800/70 flex items-center gap-1">
                          <Sparkles className="w-2.5 h-2.5 text-slate-400 shrink-0" />
                          <span>Min {minPointsRequired} pts required to redeem points discount.</span>
                        </div>
                      )}
                    </>
                  )}

                  {pointsEarnedOnSale > 0 && (
                    <div className="text-[10px] text-emerald-700 dark:text-[#00df89] font-medium flex items-center gap-1 bg-emerald-500/10 px-2 py-0.5 rounded-md border border-emerald-500/20">
                      <Sparkles className="w-2.5 h-2.5" />
                      <span>Earns +{pointsEarnedOnSale} reward points</span>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* DISCOUNT INPUT (FLAT / PERCENT) */}
            <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-[#09090b] border border-slate-200 dark:border-zinc-800 space-y-1.5 text-xs">
              <div className="flex items-center justify-between">
                <span className="font-semibold text-slate-700 dark:text-zinc-300 flex items-center gap-1">
                  <Percent className="w-3 h-3 text-[#00df89]" /> Discount:
                </span>
                <div className="flex bg-slate-200 dark:bg-zinc-800 p-0.5 rounded-md text-[10px]">
                  <button
                    type="button"
                    onClick={() => setDiscountType('flat')}
                    className={`px-1.5 py-0.5 rounded font-medium ${discountType === 'flat' ? 'bg-white dark:bg-zinc-900 text-slate-900 dark:text-white' : 'text-slate-500'}`}
                  >
                    ৳ Flat
                  </button>
                  <button
                    type="button"
                    onClick={() => setDiscountType('percentage')}
                    className={`px-1.5 py-0.5 rounded font-medium ${discountType === 'percentage' ? 'bg-white dark:bg-zinc-900 text-slate-900 dark:text-white' : 'text-slate-500'}`}
                  >
                    %
                  </button>
                </div>
              </div>
              <input
                type="number"
                placeholder={discountType === 'flat' ? 'Discount Amount (৳)' : 'Discount (%)'}
                value={discountValue}
                onChange={(e) => setDiscountValue(e.target.value)}
                className="w-full px-2.5 py-1.5 rounded-lg bg-white dark:bg-[#121215] border border-slate-200 dark:border-zinc-800 text-xs outline-none focus:ring-1 focus:ring-[#00df89]"
              />
            </div>

            {/* PAYMENT METHOD TABS */}
            <div className="space-y-1 text-xs">
              <span className="font-semibold text-slate-700 dark:text-zinc-300 text-[11px]">Payment Method:</span>
              <div className="grid grid-cols-5 gap-1 text-[11px]">
                {['Cash', 'bKash', 'Nagad', 'Card', 'Due'].map((pm) => (
                  <button
                    key={pm}
                    type="button"
                    onClick={() => setPaymentMethod(pm)}
                    className={`py-1.5 rounded-lg font-semibold border text-center transition-all cursor-pointer ${
                      paymentMethod === pm
                        ? pm === 'Due'
                          ? 'border-amber-500 bg-amber-500/15 text-amber-600 dark:text-amber-400 font-bold'
                          : 'border-[#00df89] bg-[#00df89]/10 text-slate-900 dark:text-white'
                        : 'border-slate-200 dark:border-zinc-800 text-slate-600 dark:text-zinc-400'
                    }`}
                  >
                    {pm}
                  </button>
                ))}
              </div>
            </div>

            {/* DUE PAYMENT SETTLEMENT IN POS */}
            {paymentMethod === 'Due' && (
              <div className="p-2.5 rounded-xl bg-amber-500/5 dark:bg-amber-500/10 border border-amber-500/30 space-y-1.5 text-xs">
                <div className="flex justify-between items-center">
                  <span className="font-bold text-amber-700 dark:text-amber-400 flex items-center gap-1">
                    <Coins className="w-3 h-3 text-amber-500" /> Paid Now (৳):
                  </span>
                  <button
                    type="button"
                    onClick={() => setDuePaidAmount('0')}
                    className="text-[10px] text-amber-700 dark:text-amber-400 font-semibold"
                  >
                    Full Due (৳0)
                  </button>
                </div>
                <input
                  type="number"
                  placeholder={lang === 'bn' ? '০ (সম্পূর্ণ বাকি)' : '0 (Full Due)'}
                  value={duePaidAmount}
                  onChange={(e) => setDuePaidAmount(e.target.value)}
                  className="w-full px-2.5 py-1.5 rounded-lg bg-white dark:bg-[#121215] border border-amber-500/40 text-xs font-semibold outline-none focus:ring-1 focus:ring-amber-500"
                />

                <div className="pt-1.5 border-t border-amber-500/20 space-y-0.5 text-[11px]">
                  <div className="flex justify-between text-amber-700 dark:text-amber-400 font-bold">
                    <span>This Bill Due:</span>
                    <span>৳ {currentBillDue.toLocaleString()}</span>
                  </div>
                  {previousCustomerDue > 0 && (
                    <div className="flex justify-between text-slate-500">
                      <span>Previous Customer Due:</span>
                      <span className="text-amber-600 font-semibold">৳ {previousCustomerDue.toLocaleString()}</span>
                    </div>
                  )}
                  <div className="flex justify-between font-bold text-slate-900 dark:text-white pt-1 border-t border-amber-500/30">
                    <span className="text-amber-600">Total Net Due:</span>
                    <span className="text-amber-600 font-mono text-xs">৳ {totalOutstandingDue.toLocaleString()}</span>
                  </div>
                </div>
              </div>
            )}

            {/* CASH TENDERED & CHANGE */}
            {paymentMethod === 'Cash' && (
              <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-[#09090b] border border-slate-200 dark:border-zinc-800 space-y-1.5 text-xs">
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-slate-700 dark:text-zinc-300 flex items-center gap-1">
                    <Coins className="w-3 h-3 text-[#00df89]" /> Cash Received:
                  </span>
                  <button
                    type="button"
                    onClick={() => setCashGiven(String(totalPayable))}
                    className="text-[10px] text-[#00a86b] dark:text-[#00df89] font-semibold"
                  >
                    Exact (৳{totalPayable})
                  </button>
                </div>
                <input
                  type="number"
                  placeholder="Cash handed by customer (৳)"
                  value={cashGiven}
                  onChange={(e) => setCashGiven(e.target.value)}
                  className="w-full px-2.5 py-1.5 rounded-lg bg-white dark:bg-[#121215] border border-slate-200 dark:border-zinc-800 text-xs font-semibold outline-none focus:ring-1 focus:ring-[#00df89]"
                />
                {parseFloat(cashGiven) > 0 && (
                  <div className="flex justify-between font-bold text-xs pt-1 border-t border-slate-200 dark:border-zinc-800">
                    <span className={parseFloat(cashGiven) >= totalPayable ? 'text-emerald-600 dark:text-[#00df89]' : 'text-amber-500'}>
                      {parseFloat(cashGiven) >= totalPayable ? 'Change to Return:' : 'Remaining Due:'}
                    </span>
                    <span className={parseFloat(cashGiven) >= totalPayable ? 'text-emerald-600 dark:text-[#00df89]' : 'text-amber-500'}>
                      ৳ {parseFloat(cashGiven) >= totalPayable ? changeToReturn.toLocaleString() : currentBillDue.toLocaleString()}
                    </span>
                  </div>
                )}
              </div>
            )}

            {/* TOTAL & CHECKOUT */}
            <div className="pt-2 border-t border-slate-100 dark:border-zinc-800 space-y-1.5 text-xs">
              {tierAutoDiscountAmount > 0 && (
                <div className="flex justify-between text-emerald-600 dark:text-[#00df89] font-semibold">
                  <span className="flex items-center gap-1">
                    <Sparkles className="w-3 h-3 text-[#00df89]" />
                    {matchedCustomerTier?.name || 'Tier'} Auto Discount ({tierDiscountPercent}%):
                  </span>
                  <span className="font-bold font-mono">- ৳ {tierAutoDiscountAmount.toFixed(2)}</span>
                </div>
              )}
              {rewardDiscountAmount > 0 && (
                <div className="flex justify-between text-amber-600 dark:text-amber-400 font-semibold">
                  <span className="flex items-center gap-1">
                    <Crown className="w-3 h-3 text-amber-500" />
                    Points Discount:
                  </span>
                  <span className="font-bold font-mono">- ৳ {rewardDiscountAmount.toFixed(2)}</span>
                </div>
              )}
              <div className="flex justify-between text-sm font-bold text-slate-900 dark:text-white">
                <span>Net Total:</span>
                <span className="text-[#00a86b] dark:text-[#00df89] text-base">৳ {totalPayable.toLocaleString()}</span>
              </div>
              {pointsEarnedOnSale > 0 && (
                <div className="flex justify-between text-[11px] text-emerald-600 dark:text-[#00df89] font-medium">
                  <span className="flex items-center gap-1">
                    <Sparkles className="w-3 h-3" />
                    Points to earn:
                  </span>
                  <span className="font-bold font-mono">+{pointsEarnedOnSale} pts</span>
                </div>
              )}

              <Button
                onClick={handleCheckout}
                disabled={cart.length === 0 || isCheckingOut}
                className={`w-full font-bold h-11 text-xs gap-1.5 cursor-pointer shadow-xs ${
                  paymentMethod === 'Due'
                    ? 'bg-amber-500 hover:bg-amber-600 text-slate-950'
                    : 'bg-[#00df89] hover:bg-[#00c97b] text-[#011812]'
                }`}
              >
                {isCheckingOut ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <CheckCircle2 className="w-4 h-4" />
                )}
                <span>
                  {paymentMethod === 'Due'
                    ? `Complete Due Checkout (৳${totalPayable.toLocaleString()})`
                    : `Complete Checkout (৳${totalPayable.toLocaleString()})`}
                </span>
              </Button>
            </div>
          </Card>
        </div>

      </div>

      {/* POS THERMAL RECEIPT MODAL */}
      {receipt && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs animate-in fade-in">
          <Card className="max-w-xs w-full p-5 bg-white dark:bg-[#121215] border-slate-200 dark:border-zinc-800 space-y-3 text-xs shadow-2xl relative">
            
            {/* Top Right Close Button */}
            <button
              type="button"
              onClick={() => {
                setReceipt(null);
                navigate('/sales');
              }}
              className="absolute top-3 right-3 p-1 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-zinc-200 hover:bg-slate-100 dark:hover:bg-zinc-800/80 transition-colors cursor-pointer"
              title={lang === 'bn' ? 'বন্ধ করুন ও বিক্রয় তালিকায় যান' : 'Close & Go to Sales'}
            >
              <X className="w-4 h-4" />
            </button>

            <div className="text-center border-b border-dashed border-slate-200 dark:border-zinc-700 pb-2 pt-1">
              <h3 className="font-bold text-sm text-slate-900 dark:text-white">{mongoShop?.name || 'Shopo Store'}</h3>
              <p className="text-[10px] text-slate-400 font-mono">{receipt.invoice}</p>
              <p className="text-[10px] text-slate-400">{receipt.date}</p>
              <p className="text-[10px] text-slate-500 font-semibold">{receipt.customerName} {receipt.customerPhone ? `(${receipt.customerPhone})` : ''}</p>
            </div>

            <div className="space-y-1.5 py-2 border-b border-dashed border-slate-200 dark:border-zinc-700">
              {receipt.items.map((it, idx) => (
                <div key={idx} className="flex justify-between text-[11px] items-start">
                  <div>
                    <span className="font-semibold text-slate-900 dark:text-white">{it.name}</span>
                    {it.variant_name && (
                      <span className="ml-1.5 px-1.5 py-0.5 rounded text-[10px] font-bold bg-emerald-500/10 text-emerald-700 dark:text-[#00df89] border border-emerald-500/20 inline-block">
                        🎨 {it.variant_name}
                      </span>
                    )}
                    <div className="text-[10px] text-slate-400">৳ {it.price} × {it.qty}</div>
                  </div>
                  <span className="font-semibold text-slate-900 dark:text-white">৳ {(it.price * it.qty).toLocaleString()}</span>
                </div>
              ))}
            </div>

            <div className="space-y-1 text-xs">
              <div className="flex justify-between text-slate-500">
                <span>Subtotal:</span>
                <span>৳ {receipt.subtotal.toLocaleString()}</span>
              </div>
              {receipt.discount > 0 && (
                <div className="flex justify-between text-rose-500 font-medium">
                  <span>Discount {receipt.discountType === 'percentage' ? `(${receipt.discountValue}%)` : '(Flat)'}:</span>
                  <span>- ৳ {receipt.discount.toLocaleString()}</span>
                </div>
              )}
              {receipt.tierDiscountAmount > 0 && (
                <div className="flex justify-between text-emerald-600 dark:text-[#00df89] font-semibold">
                  <span>Tier Discount ({receipt.memberTier} {receipt.tierDiscountPercent}%):</span>
                  <span className="font-bold font-mono">- ৳ {receipt.tierDiscountAmount.toFixed(2)}</span>
                </div>
              )}
              {receipt.rewardDiscountAmount > 0 && (
                <div className="flex justify-between text-amber-600 dark:text-amber-400 font-semibold">
                  <span>Points Discount ({receipt.rewardPointsRedeemed} pts):</span>
                  <span className="font-bold font-mono">- ৳ {receipt.rewardDiscountAmount.toFixed(2)}</span>
                </div>
              )}
              <div className="flex justify-between font-bold text-sm text-slate-900 dark:text-white pt-1 border-t border-slate-200 dark:border-zinc-700">
                <span>Total Bill:</span>
                <span className="text-[#00a86b] dark:text-[#00df89]">৳ {receipt.total.toLocaleString()}</span>
              </div>
              <div className="flex justify-between text-slate-700 dark:text-zinc-300">
                <span>Paid Now:</span>
                <span className="font-bold">৳ {(receipt.paidAmount ?? receipt.total).toLocaleString()}</span>
              </div>

              {(receipt.currentBillDue > 0 || receipt.previousDue > 0) && (
                <div className="pt-1.5 mt-1 border-t border-dashed border-slate-200 dark:border-zinc-700 space-y-0.5 text-[11px]">
                  {receipt.currentBillDue > 0 && (
                    <div className="flex justify-between text-amber-600 font-bold">
                      <span>This Bill Due:</span>
                      <span>৳ {receipt.currentBillDue.toLocaleString()}</span>
                    </div>
                  )}
                  {receipt.previousDue > 0 && (
                    <div className="flex justify-between text-slate-500">
                      <span>Previous Due:</span>
                      <span className="font-semibold text-amber-600">৳ {receipt.previousDue.toLocaleString()}</span>
                    </div>
                  )}
                  <div className="flex justify-between font-bold text-xs text-amber-600 dark:text-amber-400 pt-1 border-t border-slate-200 dark:border-zinc-700">
                    <span>Total Customer Due:</span>
                    <span>৳ {(receipt.totalDue ?? (receipt.previousDue + receipt.currentBillDue)).toLocaleString()}</span>
                  </div>
                </div>
              )}

              {receipt.paymentMethod?.toLowerCase() === 'cash' && receipt.currentBillDue === 0 && (
                <>
                  <div className="flex justify-between text-slate-600 dark:text-zinc-400">
                    <span>Cash Received:</span>
                    <span>৳ {receipt.cashReceived.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between text-emerald-600 dark:text-[#00df89] font-bold">
                    <span>Change Returned:</span>
                    <span>৳ {receipt.changeToReturn.toLocaleString()}</span>
                  </div>
                </>
              )}
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-slate-100 dark:border-zinc-800">
              <Button variant="outline" size="sm" onClick={() => setReceipt(null)} className="cursor-pointer font-medium">
                {lang === 'bn' ? 'নতুন বিক্রি' : 'New Sale'}
              </Button>
              <Button
                size="sm"
                onClick={() => printSaleReceipt({
                  order: {
                    invoice_number: receipt.invoice,
                    date: receipt.date,
                    customer_name: receipt.customerName,
                    customer_phone: receipt.customerPhone,
                    payment_method: receipt.paymentMethod,
                    items: receipt.items?.map(it => ({
                      name: it.name,
                      variant_name: it.variant_name,
                      sku: it.sku,
                      unit_price: it.price,
                      quantity: it.qty,
                      subtotal: (it.price * it.qty)
                    })),
                    subtotal: receipt.subtotal,
                    discount: receipt.discount,
                    tierDiscountPercent: receipt.tierDiscountPercent,
                    tierDiscountAmount: receipt.tierDiscountAmount,
                    rewardDiscountAmount: receipt.rewardDiscountAmount,
                    rewardPointsRedeemed: receipt.rewardPointsRedeemed,
                    rewardPointsEarned: receipt.rewardPointsEarned,
                    isMember: receipt.isMember,
                    memberTier: receipt.memberTier,
                    total: receipt.total,
                    paid_amount: receipt.paidAmount,
                    due_amount: receipt.currentBillDue,
                    customer_id: { total_due: receipt.totalDue },
                    tendered_amount: receipt.cashReceived,
                    change_amount: receipt.changeToReturn,
                  },
                  shop: mongoShop,
                  lang
                })}
                className="bg-[#00df89] hover:bg-[#00c97b] text-[#011812] font-semibold gap-1.5 cursor-pointer shadow-sm"
              >
                <Printer className="w-3.5 h-3.5" /> {lang === 'bn' ? 'ক্যাশ মেমো প্রিন্ট' : 'Generate Memo'}
              </Button>
            </div>
          </Card>
        </div>
      )}

      {/* ---------------------------------------------------- */}
      {/* VARIANT PICKER MODAL                                 */}
      {/* ---------------------------------------------------- */}
      <VariantPickerModal
        product={variantPickerProduct}
        isOpen={Boolean(variantPickerProduct)}
        onClose={() => setVariantPickerProduct(null)}
        onAddVariant={addVariantToCart}
        onUpdateVariantQty={updateVariantQty}
        cart={cart}
        lang={lang}
        mode="pos"
      />

    </div>
  );
}
