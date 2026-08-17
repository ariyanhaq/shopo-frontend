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
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Store, Search, Plus, Minus, Trash2, CheckCircle2,
  Printer, ArrowLeft, RefreshCw, Loader2, Sparkles, Package,
  Percent, Coins, X, User, UserCheck, Phone
} from 'lucide-react';

export default function POS() {
  const navigate = useNavigate();
  const { lang } = useLanguage();
  const { mongoShop } = useAuth();

  const [products, setProducts] = useState([]);
  const [cart, setCart] = useState([]);
  const [search, setSearch] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [customerName, setCustomerName] = useState('');
  const [matchedCustomer, setMatchedCustomer] = useState(null);
  const [customerSuggestions, setCustomerSuggestions] = useState([]);
  const [showCustomerDropdown, setShowCustomerDropdown] = useState(false);
  const [isSearchingCustomer, setIsSearchingCustomer] = useState(false);
  const [discountType, setDiscountType] = useState('flat'); // 'flat' or 'percentage'
  const [discountValue, setDiscountValue] = useState('');
  const [cashGiven, setCashGiven] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isCheckingOut, setIsCheckingOut] = useState(false);
  const [receipt, setReceipt] = useState(null);

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
    toast.success(lang === 'bn' ? `'${cust.name}' সিলেক্ট করা হয়েছে` : `Selected: ${cust.name}`);
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
    const exists = cart.find(c => c.id === prod._id);
    if (exists) {
      setCart(cart.map(c => c.id === prod._id ? { ...c, qty: c.qty + 1 } : c));
    } else {
      setCart([...cart, {
        id: prod._id,
        name: prod.name,
        price: prod.selling_price,
        qty: 1,
        unit: prod.unit || 'pcs'
      }]);
    }
  };

  const updateQty = (id, delta) => {
    setCart(cart.map(c => {
      if (c.id === id) {
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

  const totalPayable = Math.max(0, subtotal - discountAmount);
  const cashGivenNum = parseFloat(cashGiven) || 0;
  const changeToReturn = Math.max(0, cashGivenNum - totalPayable);

  const handleCheckout = async () => {
    if (cart.length === 0) return;
    setIsCheckingOut(true);
    try {
      const res = await api.sales.create({
        customer_id: matchedCustomer?._id || undefined,
        customer_name: customerName.trim() || undefined,
        customer_phone: customerPhone.trim() || undefined,
        items: cart.map(c => ({ product_id: c.id, quantity: c.qty })),
        discount_type: discountType,
        discount_value: parseFloat(discountValue) || 0,
        discount: discountAmount,
        paid_amount: totalPayable,
        tendered_amount: cashGivenNum || totalPayable,
        change_amount: changeToReturn,
        payment_method: 'cash',
        note: 'POS Terminal Cash Checkout',
      });

      const inv = res.data?.invoice_number || `INV-${Date.now().toString().slice(-6)}`;
      setReceipt({
        invoice: inv,
        customerName: customerName || (matchedCustomer?.name ? matchedCustomer.name : 'Walk-in Customer'),
        customerPhone: customerPhone || '',
        items: [...cart],
        subtotal,
        discountType,
        discountValue: parseFloat(discountValue) || 0,
        discount: discountAmount,
        total: totalPayable,
        cashReceived: cashGivenNum || totalPayable,
        changeToReturn,
        date: new Date().toLocaleString(),
      });
      setCart([]);
      setDiscountValue('');
      setCashGiven('');
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

                  <div className="pt-2.5 mt-3 border-t border-slate-100 dark:border-zinc-800 flex items-center justify-between">
                    <span className="text-sm sm:text-base font-bold text-[#00a86b] dark:text-[#00df89]">৳ {p.selling_price.toLocaleString()}</span>
                    <span className="text-xs font-medium text-slate-400">{p.stock_quantity} left</span>
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

                      {customerSuggestions.map((cust) => (
                        <div
                          key={cust._id}
                          onClick={() => handleSelectCustomer(cust)}
                          className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-zinc-800/80 cursor-pointer transition-all flex items-center justify-between gap-1.5 text-xs"
                        >
                          <div className="min-w-0">
                            <div className="font-bold text-slate-900 dark:text-white truncate text-[11px]">
                              {cust.name}
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
                      ))}
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

            {/* CASH TENDERED & CHANGE */}
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
              {cashGivenNum > 0 && (
                <div className="flex justify-between font-bold text-xs pt-1 border-t border-slate-200 dark:border-zinc-800">
                  <span className={cashGivenNum >= totalPayable ? 'text-emerald-600 dark:text-[#00df89]' : 'text-amber-500'}>
                    {cashGivenNum >= totalPayable ? 'Change to Return:' : 'Due:'}
                  </span>
                  <span className={cashGivenNum >= totalPayable ? 'text-emerald-600 dark:text-[#00df89]' : 'text-amber-500'}>
                    ৳ {cashGivenNum >= totalPayable ? changeToReturn.toLocaleString() : (totalPayable - cashGivenNum).toLocaleString()}
                  </span>
                </div>
              )}
            </div>

            {/* TOTAL & CHECKOUT */}
            <div className="pt-2 border-t border-slate-100 dark:border-zinc-800 space-y-2">
              <div className="flex justify-between text-sm font-bold text-slate-900 dark:text-white">
                <span>Net Total:</span>
                <span className="text-[#00a86b] dark:text-[#00df89] text-base">৳ {totalPayable.toLocaleString()}</span>
              </div>

              <Button
                onClick={handleCheckout}
                disabled={cart.length === 0 || isCheckingOut}
                className="w-full bg-[#00df89] hover:bg-[#00c97b] text-[#011812] font-bold h-11 text-xs gap-1.5 cursor-pointer shadow-xs"
              >
                {isCheckingOut ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4" />}
                <span>Cash Checkout (৳{totalPayable.toLocaleString()})</span>
              </Button>
            </div>
          </Card>
        </div>

      </div>

      {/* POS THERMAL RECEIPT MODAL */}
      {receipt && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs">
          <Card className="max-w-xs w-full p-5 bg-white dark:bg-[#121215] border-slate-200 dark:border-zinc-800 space-y-3 text-xs shadow-2xl relative">
            
            {/* Top Right Close Button */}
            <button
              type="button"
              onClick={() => {
                setReceipt(null);
                navigate('/sales');
              }}
              className="absolute top-3 right-3 p-1 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-zinc-200 hover:bg-slate-100 dark:hover:bg-zinc-800/80 transition-colors cursor-pointer"
              title="Close & Go to Sales"
            >
              <X className="w-4 h-4" />
            </button>

            <div className="text-center border-b border-dashed border-slate-200 dark:border-zinc-700 pb-2 pt-1">
              <h3 className="font-bold text-sm text-slate-900 dark:text-white">{mongoShop?.name || 'Shopo Store'}</h3>
              <p className="text-[10px] text-slate-400 font-mono">{receipt.invoice}</p>
              <p className="text-[10px] text-slate-400">{receipt.date}</p>
            </div>

            <div className="space-y-1.5 py-2 border-b border-dashed border-slate-200 dark:border-zinc-700">
              {receipt.items.map((it, idx) => (
                <div key={idx} className="flex justify-between text-[11px]">
                  <span>{it.name} x{it.qty}</span>
                  <span className="font-semibold">৳ {(it.price * it.qty).toLocaleString()}</span>
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
              <div className="flex justify-between font-bold text-sm text-slate-900 dark:text-white pt-1 border-t border-slate-200 dark:border-zinc-700">
                <span>Net Paid:</span>
                <span className="text-[#00a86b] dark:text-[#00df89]">৳ {receipt.total.toLocaleString()}</span>
              </div>
              <div className="flex justify-between text-slate-600 dark:text-zinc-400">
                <span>Cash Received:</span>
                <span>৳ {receipt.cashReceived.toLocaleString()}</span>
              </div>
              <div className="flex justify-between text-emerald-600 dark:text-[#00df89] font-bold">
                <span>Change Returned:</span>
                <span>৳ {receipt.changeToReturn.toLocaleString()}</span>
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-slate-100 dark:border-zinc-800">
              <Button variant="outline" size="sm" onClick={() => setReceipt(null)}>Close</Button>
              <Button size="sm" onClick={() => window.print()} className="bg-[#00df89] hover:bg-[#00c97b] text-[#011812] font-semibold gap-1">
                <Printer className="w-3.5 h-3.5" /> Print
              </Button>
            </div>
          </Card>
        </div>
      )}

    </div>
  );
}
