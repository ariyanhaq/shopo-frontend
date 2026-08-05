/**
 * @file NewSale.jsx
 * @description Interactive New Sale / Cash Memo creation page with product search, cart management, flat & % discount, payment method, and cash change calculator.
 */
import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useLanguage } from '@/context/LanguageContext';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import {
  Search, Plus, Minus, Trash2, ShoppingCart, DollarSign,
  User, Phone, CreditCard, Wallet, Smartphone, CheckCircle2,
  Printer, ArrowLeft, X, Percent, Tag, Calculator, Sparkles
} from 'lucide-react';

export default function NewSale() {
  const navigate = useNavigate();
  const { lang } = useLanguage();

  // Search & Filter State
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');

  // Sample Inventory Products List
  const availableProducts = [
    { id: 'P-101', name: 'Fresh Milk 1L (Pran)', sku: '89345001', category: 'Dairy', stock: 45, unit: 'Pcs', price: 90 },
    { id: 'P-102', name: 'Miniket Rice Premium 25kg', sku: '89345002', category: 'Grains', stock: 12, unit: 'Bags', price: 1850 },
    { id: 'P-103', name: 'Sunflower Oil 5L (Rupchanda)', sku: '89345003', category: 'Oil & Ghee', stock: 28, unit: 'Bottles', price: 890 },
    { id: 'P-104', name: 'ACI Pure Salt 1kg', sku: '89345004', category: 'Spices', stock: 120, unit: 'Pcs', price: 42 },
    { id: 'P-105', name: 'Farm Fresh Eggs (Layer)', sku: '89345005', category: 'Poultry', stock: 8, unit: 'Trays', price: 390 },
    { id: 'P-106', name: 'Teer Fortified Soyabean Oil 2L', sku: '89345006', category: 'Oil & Ghee', stock: 15, unit: 'Bottles', price: 360 },
    { id: 'P-107', name: 'Matador Pinpoint Ballpen Box', sku: '89345007', category: 'Stationery', stock: 80, unit: 'Boxes', price: 240 },
    { id: 'P-108', name: 'Bashundhara A4 Paper 80GSM', sku: '89345008', category: 'Stationery', stock: 40, unit: 'Rims', price: 380 }
  ];

  // Cart State
  const [cart, setCart] = useState([
    { id: 'P-102', name: 'Miniket Rice Premium 25kg', price: 1850, qty: 1, unit: 'Bags' }
  ]);

  // Customer Info State
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');

  // Discount State (Flat ৳ vs Percent %)
  const [discountType, setDiscountType] = useState('flat'); // 'flat' | 'percent'
  const [discountValue, setDiscountValue] = useState('');

  // Payment Method & Cash Received Calculator State
  const [paymentMethod, setPaymentMethod] = useState('Cash'); // 'Cash' | 'bKash' | 'Nagad' | 'Card'
  const [cashReceived, setCashReceived] = useState('');

  // Completed Receipt Modal State
  const [isSuccessModalOpen, setIsSuccessModalOpen] = useState(false);
  const [completedOrder, setCompletedOrder] = useState(null);

  // Categories list
  const categories = [
    { id: 'all', label: lang === 'bn' ? 'সব পণ্য' : 'All Products' },
    { id: 'Grains', label: lang === 'bn' ? 'চাল ও খাদ্য' : 'Grains' },
    { id: 'Dairy', label: lang === 'bn' ? 'দুধ ও ডেইরি' : 'Dairy' },
    { id: 'Oil & Ghee', label: lang === 'bn' ? 'তেল ও ঘি' : 'Oil & Ghee' },
    { id: 'Spices', label: lang === 'bn' ? 'মসলা ও লবণ' : 'Spices' },
    { id: 'Poultry', label: lang === 'bn' ? 'ডিম ও পোল্ট্রি' : 'Poultry' },
    { id: 'Stationery', label: lang === 'bn' ? 'স্টেশনরি' : 'Stationery' }
  ];

  // Filtered Products
  const filteredProducts = useMemo(() => {
    return availableProducts.filter(p => {
      const matchesCat = selectedCategory === 'all' || p.category === selectedCategory;
      const q = searchQuery.toLowerCase().trim();
      const matchesSearch =
        !q ||
        p.name.toLowerCase().includes(q) ||
        p.sku.toLowerCase().includes(q) ||
        p.category.toLowerCase().includes(q);
      return matchesCat && matchesSearch;
    });
  }, [searchQuery, selectedCategory]);

  // Cart Handlers
  const addToCart = (product) => {
    setCart((prev) => {
      const existing = prev.find(item => item.id === product.id);
      if (existing) {
        return prev.map(item =>
          item.id === product.id ? { ...item, qty: item.qty + 1 } : item
        );
      }
      return [...prev, { id: product.id, name: product.name, price: product.price, qty: 1, unit: product.unit }];
    });
  };

  const updateCartQty = (id, delta) => {
    setCart((prev) =>
      prev
        .map(item => {
          if (item.id === id) {
            const newQty = item.qty + delta;
            return newQty > 0 ? { ...item, qty: newQty } : null;
          }
          return item;
        })
        .filter(Boolean)
    );
  };

  const removeFromCart = (id) => {
    setCart(prev => prev.filter(item => item.id !== id));
  };

  // Subtotal Calculation
  const subtotal = useMemo(() => {
    return cart.reduce((sum, item) => sum + item.price * item.qty, 0);
  }, [cart]);

  // Discount Amount Calculation
  const discountAmount = useMemo(() => {
    const val = Number(discountValue) || 0;
    if (val <= 0) return 0;
    if (discountType === 'percent') {
      return Math.round((subtotal * Math.min(val, 100)) / 100);
    }
    return Math.min(val, subtotal);
  }, [subtotal, discountType, discountValue]);

  // Final Total Payable
  const totalPayable = useMemo(() => {
    return Math.max(0, subtotal - discountAmount);
  }, [subtotal, discountAmount]);

  // Cash Change Calculation (Return to Customer)
  const cashGivenNum = Number(cashReceived) || 0;
  const changeToReturn = useMemo(() => {
    if (paymentMethod !== 'Cash' || cashGivenNum <= 0) return 0;
    return Math.max(0, cashGivenNum - totalPayable);
  }, [paymentMethod, cashGivenNum, totalPayable]);

  // Submit Sale Handler
  const handleCompleteSale = () => {
    if (cart.length === 0) return;

    const orderData = {
      id: `INV-2024-${Math.floor(100 + Math.random() * 900)}`,
      date: new Date().toLocaleString(),
      customer: customerName.trim() || (lang === 'bn' ? 'সাধারণ কাস্টমার' : 'Walk-in Customer'),
      phone: customerPhone.trim() || 'N/A',
      items: [...cart],
      subtotal,
      discount: discountAmount,
      total: totalPayable,
      method: paymentMethod,
      cashReceived: paymentMethod === 'Cash' ? cashGivenNum : totalPayable,
      changeToReturn: paymentMethod === 'Cash' ? changeToReturn : 0
    };

    setCompletedOrder(orderData);
    setIsSuccessModalOpen(true);
  };

  return (
    <div className="space-y-6 font-sans">
      
      {/* PAGE HEADER */}
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <Button
            variant="outline"
            size="icon"
            onClick={() => navigate('/sales')}
            className="w-9 h-9 rounded-xl dark:bg-[#121215]"
            title="Back to Sales List"
          >
            <ArrowLeft className="w-4 h-4" />
          </Button>
          <div>
            <h1 className="text-xl sm:text-2xl font-medium text-slate-900 dark:text-white tracking-tight">
              {lang === 'bn' ? 'নতুন বিক্রি ও মেমো তৈরি' : 'Create New Sale & Cash Memo'}
            </h1>
            <p className="text-xs sm:text-sm text-slate-500 dark:text-zinc-400 font-normal mt-0.5">
              {lang === 'bn'
                ? 'পণ্য খুঁজুন, ডিসকাউন্ট দিন ও ক্যাশ মেমো জমা দিন।'
                : 'Search products, apply discounts, choose payment method & calculate change.'}
            </p>
          </div>
        </div>
      </div>

      {/* TWO COLUMN POS LAYOUT */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        
        {/* LEFT COLUMN: PRODUCT CATALOG SEARCH & SELECTION (7 COLS) */}
        <div className="lg:col-span-7 space-y-4">
          
          {/* Search Input & Category Pills */}
          <Card className="p-4 border border-slate-200/90 dark:border-zinc-800/80 dark:bg-[#121215] space-y-3">
            
            {/* Search Input */}
            <div className="relative">
              <Search className="w-4 h-4 text-slate-400 dark:text-zinc-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <Input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder={lang === 'bn' ? 'পণ্যের নাম, আইডি (SKU) বা ক্যাটাগরি লিখুন...' : 'Search product name, category, or SKU ID...'}
                className="pl-10 dark:bg-[#09090b]"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            {/* Category Pills */}
            <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar py-1">
              {categories.map(cat => (
                <button
                  key={cat.id}
                  onClick={() => setSelectedCategory(cat.id)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-medium transition-colors shrink-0 cursor-pointer ${
                    selectedCategory === cat.id
                      ? 'bg-[#00df89] text-[#011812] shadow-xs'
                      : 'bg-slate-100 dark:bg-[#09090b] text-slate-600 dark:text-zinc-400 hover:bg-slate-200 dark:hover:bg-zinc-800 border border-slate-200/60 dark:border-zinc-800/60 font-normal'
                  }`}
                >
                  {cat.label}
                </button>
              ))}
            </div>

          </Card>

          {/* Product Items Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {filteredProducts.map((prod) => {
              const inCartItem = cart.find(c => c.id === prod.id);

              return (
                <Card
                  key={prod.id}
                  onClick={() => addToCart(prod)}
                  className={`p-4 cursor-pointer transition-all duration-150 border flex flex-col justify-between select-none ${
                    inCartItem
                      ? 'border-[#00df89] bg-emerald-50/20 dark:bg-emerald-950/20 shadow-xs'
                      : 'border-slate-200/90 dark:border-zinc-800/80 dark:bg-[#121215] hover:border-slate-300 dark:hover:border-zinc-700'
                  }`}
                >
                  <div>
                    <div className="flex items-center justify-between mb-1.5">
                      <Badge variant="secondary" className="text-[10px] font-normal">
                        {prod.category}
                      </Badge>
                      <span className="text-[10px] text-slate-400 font-normal">SKU: {prod.sku}</span>
                    </div>

                    <h4 className="font-medium text-xs sm:text-sm text-slate-900 dark:text-white line-clamp-1">
                      {prod.name}
                    </h4>

                    <div className="text-[11px] text-slate-500 dark:text-zinc-400 font-normal mt-0.5">
                      Stock: {prod.stock} {prod.unit}
                    </div>
                  </div>

                  <div className="flex items-center justify-between pt-3 mt-3 border-t border-slate-100 dark:border-zinc-800/80">
                    <div className="font-medium text-sm text-slate-900 dark:text-white">
                      ৳ {prod.price.toLocaleString()}
                    </div>

                    <Button
                      variant={inCartItem ? 'default' : 'outline'}
                      size="sm"
                      className={`h-7 text-xs gap-1 font-medium ${
                        inCartItem
                          ? 'bg-[#00df89] text-[#011812] hover:bg-[#00c97b]'
                          : 'dark:bg-[#09090b]'
                      }`}
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>{inCartItem ? `(${inCartItem.qty})` : (lang === 'bn' ? 'যুক্ত করুন' : 'Add')}</span>
                    </Button>
                  </div>
                </Card>
              );
            })}
          </div>

          {filteredProducts.length === 0 && (
            <Card className="p-8 text-center border border-slate-200/90 dark:border-zinc-800/80 dark:bg-[#121215] text-xs text-slate-400 font-normal">
              {lang === 'bn' ? 'কোনো পণ্য পাওয়া যায়নি।' : 'No products found for this search.'}
            </Card>
          )}

        </div>

        {/* RIGHT COLUMN: CART MEMO & CHECKOUT CALCULATOR (5 COLS) */}
        <div className="lg:col-span-5 space-y-4">
          
          <Card className="p-5 border border-slate-200/90 dark:border-zinc-800/80 dark:bg-[#121215] space-y-5">
            
            {/* Header Title */}
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-zinc-800/80">
              <div className="flex items-center gap-2">
                <ShoppingCart className="w-4 h-4 text-[#00df89]" />
                <h3 className="font-medium text-sm sm:text-base text-slate-900 dark:text-white">
                  {lang === 'bn' ? 'ক্যাশ মেমো কার্ট' : 'Sale Cash Memo'}
                </h3>
              </div>
              <Badge variant="secondary" className="text-xs font-normal">
                {cart.length} {lang === 'bn' ? 'টি আইটেম' : 'Items'}
              </Badge>
            </div>

            {/* CART ITEMS LIST */}
            <div className="space-y-3 max-h-56 overflow-y-auto no-scrollbar pr-1">
              {cart.map((item) => (
                <div
                  key={item.id}
                  className="flex items-center justify-between p-3 rounded-xl bg-slate-50 dark:bg-[#09090b]/80 border border-slate-100 dark:border-zinc-800/80"
                >
                  <div className="min-w-0 flex-1 pr-2">
                    <div className="font-medium text-xs sm:text-sm text-slate-900 dark:text-white truncate">
                      {item.name}
                    </div>
                    <div className="text-[11px] text-slate-400 font-normal">
                      ৳{item.price} / {item.unit}
                    </div>
                  </div>

                  {/* Qty Counter & Actions */}
                  <div className="flex items-center gap-2 shrink-0">
                    <div className="flex items-center gap-1 bg-white dark:bg-zinc-800 border border-slate-200/80 dark:border-zinc-700/80 rounded-lg p-0.5">
                      <button
                        onClick={() => updateCartQty(item.id, -1)}
                        className="w-5 h-5 rounded flex items-center justify-center text-slate-600 dark:text-zinc-300 hover:bg-slate-100 dark:hover:bg-zinc-700"
                      >
                        <Minus className="w-3 h-3" />
                      </button>
                      <span className="w-6 text-center text-xs font-medium text-slate-900 dark:text-white">
                        {item.qty}
                      </span>
                      <button
                        onClick={() => updateCartQty(item.id, 1)}
                        className="w-5 h-5 rounded flex items-center justify-center text-slate-600 dark:text-zinc-300 hover:bg-slate-100 dark:hover:bg-zinc-700"
                      >
                        <Plus className="w-3 h-3" />
                      </button>
                    </div>

                    <div className="text-right min-w-[60px]">
                      <div className="font-medium text-xs sm:text-sm text-slate-900 dark:text-white">
                        ৳{(item.price * item.qty).toLocaleString()}
                      </div>
                    </div>

                    <button
                      onClick={() => removeFromCart(item.id)}
                      className="text-slate-400 hover:text-rose-500 p-1"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))}

              {cart.length === 0 && (
                <div className="p-6 text-center text-xs text-slate-400 font-normal">
                  {lang === 'bn' ? 'মেমো কার্ট ফাঁকা। বাঁ পাশ থেকে পণ্য যোগ করুন।' : 'Cart is empty. Click a product to add.'}
                </div>
              )}
            </div>

            {/* CUSTOMER DETAILS (OPTIONAL) */}
            <div className="pt-3 border-t border-slate-100 dark:border-zinc-800/80 space-y-2">
              <div className="text-xs font-medium text-slate-700 dark:text-zinc-300">
                {lang === 'bn' ? 'কাস্টমারের তথ্য (ঐচ্ছিক)' : 'Customer Details (Optional)'}
              </div>
              <div className="grid grid-cols-2 gap-2">
                <Input
                  type="text"
                  placeholder={lang === 'bn' ? 'কাস্টমারের নাম' : 'Customer Name'}
                  value={customerName}
                  onChange={(e) => setCustomerName(e.target.value)}
                  className="h-8 text-xs dark:bg-[#09090b]"
                />
                <Input
                  type="text"
                  placeholder={lang === 'bn' ? 'ফোন নাম্বার' : 'Phone Number'}
                  value={customerPhone}
                  onChange={(e) => setCustomerPhone(e.target.value)}
                  className="h-8 text-xs dark:bg-[#09090b]"
                />
              </div>
            </div>

            {/* DISCOUNT CALCULATOR (FLAT ৳ VS PERCENT %) */}
            <div className="pt-3 border-t border-slate-100 dark:border-zinc-800/80 space-y-2">
              <div className="flex items-center justify-between text-xs font-medium">
                <span className="text-slate-700 dark:text-zinc-300">
                  {lang === 'bn' ? 'ডিসকাউন্ট ছাড়' : 'Discount Deduction'}
                </span>
                
                {/* Segmented Flat / Percent Toggle */}
                <div className="bg-slate-100 dark:bg-[#09090b] p-0.5 rounded-lg flex items-center gap-0.5 border border-slate-200/80 dark:border-zinc-800/80">
                  <button
                    onClick={() => setDiscountType('flat')}
                    className={`px-2 py-0.5 text-[10px] font-medium rounded transition-all ${
                      discountType === 'flat'
                        ? 'bg-white dark:bg-zinc-800 text-slate-900 dark:text-white shadow-xs'
                        : 'text-slate-500 dark:text-zinc-400 font-normal'
                    }`}
                  >
                    Flat ৳
                  </button>
                  <button
                    onClick={() => setDiscountType('percent')}
                    className={`px-2 py-0.5 text-[10px] font-medium rounded transition-all ${
                      discountType === 'percent'
                        ? 'bg-white dark:bg-zinc-800 text-slate-900 dark:text-white shadow-xs'
                        : 'text-slate-500 dark:text-zinc-400 font-normal'
                    }`}
                  >
                    Percent %
                  </button>
                </div>
              </div>

              <Input
                type="number"
                placeholder={discountType === 'flat' ? '৳ 100' : '10 %'}
                value={discountValue}
                onChange={(e) => setDiscountValue(e.target.value)}
                className="h-8 text-xs dark:bg-[#09090b]"
              />
            </div>

            {/* PAYMENT METHOD SELECTOR */}
            <div className="pt-3 border-t border-slate-100 dark:border-zinc-800/80 space-y-2">
              <div className="text-xs font-medium text-slate-700 dark:text-zinc-300">
                {lang === 'bn' ? 'পেমেন্ট মাধ্যম' : 'Payment Method'}
              </div>

              <div className="grid grid-cols-4 gap-1.5">
                {['Cash', 'bKash', 'Nagad', 'Card'].map(method => (
                  <button
                    key={method}
                    onClick={() => setPaymentMethod(method)}
                    className={`py-1.5 text-xs font-medium rounded-xl border transition-all cursor-pointer ${
                      paymentMethod === method
                        ? 'border-[#00df89] bg-[#00df89]/10 text-emerald-600 dark:text-[#00df89]'
                        : 'border-slate-200/80 dark:border-zinc-800 bg-white dark:bg-[#09090b] text-slate-600 dark:text-zinc-400 font-normal'
                    }`}
                  >
                    {method}
                  </button>
                ))}
              </div>
            </div>

            {/* CASH RECEIVED & CHANGE CALCULATOR (SHOWN WHEN CASH IS SELECTED) */}
            {paymentMethod === 'Cash' && (
              <div className="p-3.5 rounded-2xl bg-emerald-500/5 dark:bg-emerald-950/20 border border-emerald-500/20 space-y-3">
                <div className="space-y-1">
                  <label className="block text-xs font-medium text-slate-800 dark:text-zinc-200">
                    {lang === 'bn' ? 'গ্রাহক কত টাকা দিয়েছেন (ক্যাশ প্রাপ্তি)' : 'Cash Given by Customer (৳)'}
                  </label>
                  <Input
                    type="number"
                    placeholder="e.g. 2000"
                    value={cashReceived}
                    onChange={(e) => setCashReceived(e.target.value)}
                    className="h-9 text-sm font-medium dark:bg-[#09090b]"
                  />
                </div>

                {cashGivenNum > 0 && (
                  <div className="flex items-center justify-between text-xs sm:text-sm pt-1 border-t border-emerald-500/20">
                    <span className="font-medium text-slate-700 dark:text-zinc-300">
                      {lang === 'bn' ? 'কাস্টমারকে ফেরতযোগ্য টাকা:' : 'Change to Return:'}
                    </span>
                    <span className="font-bold text-base text-[#00a86b] dark:text-[#00df89]">
                      ৳ {changeToReturn.toLocaleString()}
                    </span>
                  </div>
                )}
              </div>
            )}

            {/* TOTALS SUMMARY BREAKDOWN */}
            <div className="pt-3 border-t border-slate-100 dark:border-zinc-800/80 space-y-2">
              <div className="flex items-center justify-between text-xs text-slate-500 dark:text-zinc-400 font-normal">
                <span>Subtotal</span>
                <span>৳ {subtotal.toLocaleString()}</span>
              </div>

              {discountAmount > 0 && (
                <div className="flex items-center justify-between text-xs text-rose-500 font-normal">
                  <span>Discount</span>
                  <span>- ৳ {discountAmount.toLocaleString()}</span>
                </div>
              )}

              <div className="flex items-center justify-between text-base sm:text-lg font-medium text-slate-900 dark:text-white pt-2 border-t border-slate-100 dark:border-zinc-800">
                <span>{lang === 'bn' ? 'সর্বমোট প্রদেয়' : 'Total Payable'}</span>
                <span className="text-[#00a86b] dark:text-[#00df89]">
                  ৳ {totalPayable.toLocaleString()}
                </span>
              </div>
            </div>

            {/* COMPLETE SALE ACTION BUTTON */}
            <Button
              variant="default"
              disabled={cart.length === 0}
              onClick={handleCompleteSale}
              className="w-full h-11 bg-[#00df89] hover:bg-[#00c97b] text-[#011812] font-medium text-sm shadow-xs"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>{lang === 'bn' ? 'বিক্রি সম্পন্ন ও ক্যাশ মেমো প্রিন্ট' : 'Complete Sale & Print Memo'}</span>
            </Button>

          </Card>

        </div>

      </div>

      {/* COMPLETED SALE RECEIPT MODAL */}
      {isSuccessModalOpen && completedOrder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs">
          <div className="w-full max-w-md bg-white dark:bg-[#121215] rounded-2xl border border-slate-200 dark:border-zinc-800 shadow-2xl p-6 space-y-6">
            
            {/* Success Icon Header */}
            <div className="text-center space-y-2">
              <div className="w-12 h-12 rounded-full bg-[#00df89]/20 text-[#00a86b] dark:text-[#00df89] flex items-center justify-center mx-auto">
                <CheckCircle2 className="w-6 h-6" />
              </div>
              <h3 className="font-medium text-lg text-slate-900 dark:text-white">
                {lang === 'bn' ? 'বিক্রি সফলভাবে সম্পন্ন হয়েছে 🎉' : 'Sale Completed Successfully 🎉'}
              </h3>
              <div className="text-xs text-slate-400 font-normal">
                {completedOrder.id} • {completedOrder.date}
              </div>
            </div>

            {/* Order Items Breakdown */}
            <div className="space-y-2 bg-slate-50 dark:bg-[#09090b] p-3.5 rounded-xl border border-slate-100 dark:border-zinc-800">
              <div className="text-xs font-medium text-slate-500 dark:text-zinc-400 pb-1 border-b border-slate-200/60 dark:border-zinc-800">
                Customer: <span className="text-slate-900 dark:text-white font-medium">{completedOrder.customer} ({completedOrder.phone})</span>
              </div>

              <div className="space-y-1.5 pt-1">
                {completedOrder.items.map((item, idx) => (
                  <div key={idx} className="flex items-center justify-between text-xs">
                    <span className="text-slate-700 dark:text-zinc-300 font-medium">{item.name} (x{item.qty})</span>
                    <span className="text-slate-900 dark:text-white font-medium">৳{item.price * item.qty}</span>
                  </div>
                ))}
              </div>

              <div className="pt-2 border-t border-slate-200/60 dark:border-zinc-800 space-y-1 text-xs">
                <div className="flex items-center justify-between text-slate-500">
                  <span>Subtotal</span>
                  <span>৳ {completedOrder.subtotal}</span>
                </div>
                {completedOrder.discount > 0 && (
                  <div className="flex items-center justify-between text-rose-500">
                    <span>Discount</span>
                    <span>- ৳ {completedOrder.discount}</span>
                  </div>
                )}
                <div className="flex items-center justify-between font-medium text-slate-900 dark:text-white pt-1">
                  <span>Paid ({completedOrder.method})</span>
                  <span className="text-[#00a86b] dark:text-[#00df89]">৳ {completedOrder.total}</span>
                </div>
                {completedOrder.method === 'Cash' && (
                  <div className="flex items-center justify-between font-medium text-emerald-600 dark:text-[#00df89] pt-1">
                    <span>Change Returned:</span>
                    <span>৳ {completedOrder.changeToReturn}</span>
                  </div>
                )}
              </div>
            </div>

            {/* Modal Actions */}
            <div className="flex items-center gap-3">
              <Button variant="outline" onClick={() => window.print()} className="flex-1 text-xs gap-1.5 dark:bg-[#09090b]">
                <Printer className="w-3.5 h-3.5" />
                <span>Print Receipt</span>
              </Button>

              <Button
                variant="default"
                onClick={() => {
                  setIsSuccessModalOpen(false);
                  setCart([]);
                  setDiscountValue('');
                  setCashReceived('');
                }}
                className="flex-1 text-xs bg-[#00df89] hover:bg-[#00c97b] text-[#011812] font-medium"
              >
                New Sale
              </Button>
            </div>

          </div>
        </div>
      )}

    </div>
  );
}
