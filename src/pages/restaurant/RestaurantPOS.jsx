import { useState, useEffect, useMemo } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { useLanguage } from '@/context/LanguageContext';
import { useShop } from '@/context/ShopContext';
import { useAuth } from '@/context/AuthContext';
import api from '@/services/api';
import toast from 'react-hot-toast';
import { Card, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import {
  Utensils, ShoppingCart, Flame, Search, Plus, Minus, Trash2,
  CheckCircle2, Printer, ArrowLeft, Users, DollarSign, X,
  Percent, Sparkles, CreditCard, Clock, Coffee, ShieldAlert, Split
} from 'lucide-react';

export default function RestaurantPOS() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { lang } = useLanguage();
  const { activeShop } = useShop();
  const { mongoShop } = useAuth();

  const preselectedTable = searchParams.get('table') || '';
  const preselectedTableId = searchParams.get('tableId') || '';

  // Order Type & Table Selection
  const [orderType, setOrderType] = useState('dine_in'); // 'dine_in' | 'takeaway' | 'delivery'
  const [selectedTableId, setSelectedTableId] = useState(preselectedTableId);
  const [selectedTableNumber, setSelectedTableNumber] = useState(preselectedTable);
  const [guestCount, setGuestCount] = useState(2);
  const [waiterName, setWaiterName] = useState('');
  const [customerName, setCustomerName] = useState('Walk-in Guest');
  const [customerPhone, setCustomerPhone] = useState('');
  const [deliveryAddress, setDeliveryAddress] = useState('');

  // Tables & Menu State
  const [tables, setTables] = useState([]);
  const [menuItems, setMenuItems] = useState([]);
  const [categories, setCategories] = useState(['all']);
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoadingMenu, setIsLoadingMenu] = useState(true);

  // Cart / Order Items
  const [cart, setCart] = useState([]);
  const [serviceChargePercent, setServiceChargePercent] = useState(0);
  const [vatPercent, setVatPercent] = useState(5);
  const [discountAmount, setDiscountAmount] = useState(0);
  const [tipAmount, setTipAmount] = useState(0);
  const [deliveryFee, setDeliveryFee] = useState(0);

  // Item Modifier Modal
  const [isModifierModalOpen, setIsModifierModalOpen] = useState(false);
  const [activeDish, setActiveDish] = useState(null);
  const [selectedModifiers, setSelectedModifiers] = useState([]);
  const [cookingNotes, setCookingNotes] = useState('');
  const [selectedCourse, setSelectedCourse] = useState('main');

  // Checkout / Payment Modal
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState('cash');
  const [tenderedAmount, setTenderedAmount] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Split Bill Modal
  const [isSplitBillOpen, setIsSplitBillOpen] = useState(false);
  const [splitCount, setSplitCount] = useState(2);

  // Load Menu Items & Tables
  useEffect(() => {
    const loadData = async () => {
      try {
        setIsLoadingMenu(true);
        const [menuRes, tablesRes] = await Promise.all([
          api.restaurant.menu.list(),
          api.restaurant.tables.list(),
        ]);

        if (menuRes?.success) {
          setMenuItems(menuRes.data);
          const cats = ['all', ...new Set(menuRes.data.map((m) => m.category).filter(Boolean))];
          setCategories(cats);
        }

        if (tablesRes?.success) {
          setTables(tablesRes.data);
        }
      } catch (err) {
        console.error('Failed to load POS data:', err);
        toast.error('Failed to load menu items');
      } finally {
        setIsLoadingMenu(false);
      }
    };
    loadData();
  }, [activeShop]);

  // Filtered Menu
  const filteredMenu = useMemo(() => {
    return menuItems.filter((item) => {
      const matchesCategory = selectedCategory === 'all' || item.category === selectedCategory;
      const q = searchQuery.toLowerCase().trim();
      const matchesSearch =
        !q ||
        item.name.toLowerCase().includes(q) ||
        (item.name_bn && item.name_bn.toLowerCase().includes(q)) ||
        item.category.toLowerCase().includes(q);
      return matchesCategory && matchesSearch && item.is_available !== false;
    });
  }, [menuItems, selectedCategory, searchQuery]);

  // Add Item to Cart
  const handleOpenModifierModal = (dish) => {
    if (dish.modifiers && dish.modifiers.length > 0) {
      setActiveDish(dish);
      setSelectedModifiers([]);
      setCookingNotes('');
      setSelectedCourse('main');
      setIsModifierModalOpen(true);
    } else {
      quickAddToCart(dish, [], '', 'main');
    }
  };

  const quickAddToCart = (dish, modifiers = [], notes = '', course = 'main') => {
    const existingIndex = cart.findIndex(
      (c) =>
        c._id === dish._id &&
        c.cooking_notes === notes &&
        c.course === course &&
        JSON.stringify(c.modifiers) === JSON.stringify(modifiers)
    );

    if (existingIndex > -1) {
      const updated = [...cart];
      updated[existingIndex].quantity += 1;
      setCart(updated);
    } else {
      setCart([
        ...cart,
        {
          _id: dish._id,
          name: dish.name,
          name_bn: dish.name_bn,
          category: dish.category,
          unit_price: Number(dish.price),
          quantity: 1,
          modifiers,
          cooking_notes: notes,
          course,
          kitchen_station: dish.kitchen_station || 'main_kitchen',
        },
      ]);
    }
    toast.success(`Added ${dish.name}`);
  };

  const handleConfirmModifier = () => {
    if (!activeDish) return;
    quickAddToCart(activeDish, selectedModifiers, cookingNotes, selectedCourse);
    setIsModifierModalOpen(false);
  };

  // Cart Calculations
  const subtotal = useMemo(() => {
    return cart.reduce((sum, it) => {
      const modSum = (it.modifiers || []).reduce((acc, m) => acc + Number(m.price || 0), 0);
      return sum + (it.unit_price + modSum) * it.quantity;
    }, 0);
  }, [cart]);

  const vatAmount = Math.round((subtotal * vatPercent) / 100);
  const serviceChargeAmount = Math.round((subtotal * serviceChargePercent) / 100);
  const grandTotal = Math.max(
    0,
    subtotal + vatAmount + serviceChargeAmount + Number(deliveryFee || 0) - Number(discountAmount || 0) + Number(tipAmount || 0)
  );

  // Dispatch KOT to Kitchen & Save
  const handleDispatchKOT = async () => {
    if (cart.length === 0) {
      toast.error('Please add food items to cart');
      return;
    }
    if (orderType === 'dine_in' && !selectedTableNumber) {
      toast.error('Please select a dine-in table');
      return;
    }

    setIsSubmitting(true);
    try {
      const payload = {
        order_type: orderType,
        table_id: selectedTableId || null,
        table_number: selectedTableNumber,
        guest_count: guestCount,
        waiter_name: waiterName,
        customer_name: customerName,
        customer_phone: customerPhone,
        delivery_address: deliveryAddress,
        vat_percent: vatPercent,
        service_charge_percent: serviceChargePercent,
        delivery_fee: Number(deliveryFee) || 0,
        discount_amount: Number(discountAmount) || 0,
        tip_amount: Number(tipAmount) || 0,
        items: cart,
      };

      const res = await api.restaurant.orders.create(payload);
      if (res?.success) {
        toast.success(`KOT #${res.data.kot_number || 'KOT'} sent to kitchen! 🍳`);
        setCart([]);
        navigate('/restaurant/kds');
      }
    } catch (err) {
      toast.error(err.message || 'Failed to dispatch KOT');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Settle Bill & Complete
  const handleCompleteBill = async (e) => {
    e.preventDefault();
    if (cart.length === 0) return;

    setIsSubmitting(true);
    try {
      const payload = {
        order_type: orderType,
        table_id: selectedTableId || null,
        table_number: selectedTableNumber,
        guest_count: guestCount,
        waiter_name: waiterName,
        customer_name: customerName,
        customer_phone: customerPhone,
        delivery_address: deliveryAddress,
        vat_percent: vatPercent,
        service_charge_percent: serviceChargePercent,
        delivery_fee: Number(deliveryFee) || 0,
        discount_amount: Number(discountAmount) || 0,
        tip_amount: Number(tipAmount) || 0,
        paid_amount: Number(tenderedAmount) || grandTotal,
        payment_method: paymentMethod,
        items: cart,
      };

      const res = await api.restaurant.orders.create(payload);
      if (res?.success) {
        toast.success(`Bill Paid & Completed! Total: ৳${grandTotal.toLocaleString()}`);
        setIsPaymentModalOpen(false);
        setCart([]);
        navigate('/restaurant/tables');
      }
    } catch (err) {
      toast.error(err.message || 'Failed to complete checkout');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-4 font-sans pb-16">
      
      {/* HEADER & ORDER TYPE TABS */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white dark:bg-zinc-900 p-3.5 rounded-2xl border border-slate-200/80 dark:border-zinc-800 shadow-xs">
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate('/restaurant/dashboard')}
            className="p-2 rounded-xl border border-slate-200 dark:border-zinc-800 hover:bg-slate-100 dark:hover:bg-zinc-800 text-slate-600 dark:text-zinc-400 cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
          <div>
            <h1 className="text-base font-bold text-slate-900 dark:text-white tracking-tight flex items-center gap-1.5">
              <span>{lang === 'bn' ? 'রেস্তোরাঁ পিওএস ও কেওটি কাউন্টার' : 'Restaurant POS & KOT Terminal'}</span>
            </h1>
          </div>
        </div>

        {/* Order Types */}
        <div className="flex items-center gap-1 bg-slate-100 dark:bg-zinc-800 p-1 rounded-xl">
          <button
            onClick={() => setOrderType('dine_in')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              orderType === 'dine_in'
                ? 'bg-orange-500 text-white shadow-xs'
                : 'text-slate-600 dark:text-zinc-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            🍽️ {lang === 'bn' ? 'ডাইন-ইন' : 'Dine-in'}
          </button>

          <button
            onClick={() => setOrderType('takeaway')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              orderType === 'takeaway'
                ? 'bg-blue-600 text-white shadow-xs'
                : 'text-slate-600 dark:text-zinc-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            📦 {lang === 'bn' ? 'পার্সেল' : 'Takeaway'}
          </button>

          <button
            onClick={() => setOrderType('delivery')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              orderType === 'delivery'
                ? 'bg-emerald-600 text-white shadow-xs'
                : 'text-slate-600 dark:text-zinc-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            🛵 {lang === 'bn' ? 'ডেলিভারি' : 'Delivery'}
          </button>
        </div>
      </div>

      {/* DINE-IN TABLE SELECTOR STRIP */}
      {orderType === 'dine_in' && (
        <div className="p-3 bg-orange-500/10 border border-orange-500/20 rounded-2xl flex flex-wrap items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-3">
            <span className="font-bold text-orange-950 dark:text-orange-200 flex items-center gap-1.5">
              <Utensils className="w-4 h-4 text-orange-600" />
              <span>{lang === 'bn' ? 'টেবিল নির্বাচন:' : 'Select Table:'}</span>
            </span>

            <select
              value={selectedTableNumber}
              onChange={(e) => {
                const tbl = tables.find((t) => t.table_number === e.target.value);
                setSelectedTableNumber(e.target.value);
                setSelectedTableId(tbl?._id || '');
              }}
              className="h-8 px-3 rounded-lg border border-orange-300 dark:border-orange-900/60 bg-white dark:bg-zinc-900 text-xs font-bold text-orange-600 dark:text-orange-400"
            >
              <option value="">{lang === 'bn' ? '-- টেবিল বেছে নিন --' : '-- Choose Floor Table --'}</option>
              {tables.map((t) => (
                <option key={t._id} value={t.table_number}>
                  {t.table_number} ({t.zone} - {t.capacity} {lang === 'bn' ? 'আসন' : 'seats'}) {t.status === 'occupied' ? '🔴' : '🟢'}
                </option>
              ))}
            </select>
          </div>

          <div className="flex items-center gap-4">
            <div className="flex items-center gap-1.5">
              <span className="font-semibold text-slate-700 dark:text-zinc-300">👥 {lang === 'bn' ? 'অতিথি:' : 'Guests:'}</span>
              <input
                type="number"
                min="1"
                max="30"
                value={guestCount}
                onChange={(e) => setGuestCount(e.target.value)}
                className="w-12 h-7 text-center rounded-md border border-orange-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 font-mono"
              />
            </div>

            <div className="flex items-center gap-1.5">
              <span className="font-semibold text-slate-700 dark:text-zinc-300">🧑‍🍳 {lang === 'bn' ? 'ওয়েটার:' : 'Server:'}</span>
              <input
                type="text"
                placeholder={lang === 'bn' ? 'ওয়েটারের নাম' : 'Waiter name'}
                value={waiterName}
                onChange={(e) => setWaiterName(e.target.value)}
                className="w-28 h-7 px-2 rounded-md border border-orange-200 dark:border-zinc-800 bg-white dark:bg-zinc-900"
              />
            </div>
          </div>
        </div>
      )}

      {/* DELIVERY DETAILS STRIP */}
      {orderType === 'delivery' && (
        <div className="p-3 bg-emerald-500/10 border border-emerald-500/20 rounded-2xl grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
          <Input
            placeholder={lang === 'bn' ? 'গ্রাহকের নাম' : 'Customer Name'}
            value={customerName}
            onChange={(e) => setCustomerName(e.target.value)}
            className="h-8 text-xs bg-white dark:bg-zinc-900"
          />
          <Input
            placeholder={lang === 'bn' ? 'মোবাইল নম্বর' : 'Phone Number'}
            value={customerPhone}
            onChange={(e) => setCustomerPhone(e.target.value)}
            className="h-8 text-xs bg-white dark:bg-zinc-900"
          />
          <Input
            placeholder={lang === 'bn' ? 'ডেলিভারির ঠিকানা' : 'Delivery Address'}
            value={deliveryAddress}
            onChange={(e) => setDeliveryAddress(e.target.value)}
            className="h-8 text-xs bg-white dark:bg-zinc-900"
          />
        </div>
      )}

      {/* MAIN POS VIEW: MENU (LEFT 7 COLS) + RUNNING CART (RIGHT 5 COLS) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
        
        {/* LEFT: FOOD MENU CATALOG */}
        <div className="lg:col-span-7 xl:col-span-8 space-y-3">
          
          {/* Search & Category Tabs */}
          <div className="flex flex-col sm:flex-row items-center gap-2">
            <div className="relative flex-1 w-full">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <Input
                placeholder={lang === 'bn' ? 'খাবারের নাম দিয়ে খুঁজুন...' : 'Search dish name, biryani, burger...'}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9 h-9.5 text-xs bg-white dark:bg-zinc-900 rounded-xl"
              />
            </div>

            <div className="flex items-center gap-1 overflow-x-auto w-full sm:w-auto pb-1 scrollbar-none">
              {categories.map((c) => (
                <button
                  key={c}
                  onClick={() => setSelectedCategory(c)}
                  className={`px-3 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-all cursor-pointer capitalize ${
                    selectedCategory === c
                      ? 'bg-slate-900 text-white dark:bg-white dark:text-slate-900 shadow-xs'
                      : 'bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 text-slate-600 dark:text-zinc-400 hover:bg-slate-50'
                  }`}
                >
                  {c === 'all' ? 'All Dishes' : c}
                </button>
              ))}
            </div>
          </div>

          {/* Dishes Food Grid */}
          {isLoadingMenu ? (
            <div className="text-center py-20 text-xs text-slate-400">Loading menu...</div>
          ) : filteredMenu.length === 0 ? (
            <div className="text-center py-16 bg-white dark:bg-zinc-900 rounded-2xl border border-slate-200 dark:border-zinc-800 text-xs text-slate-400">
              No matching dishes found.
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-4 gap-3">
              {filteredMenu.map((dish) => (
                <div
                  key={dish._id}
                  onClick={() => handleOpenModifierModal(dish)}
                  className="p-3 bg-white dark:bg-zinc-900 border border-slate-200/80 dark:border-zinc-800 hover:border-orange-500/50 hover:shadow-md rounded-2xl transition-all cursor-pointer flex flex-col justify-between group"
                >
                  <div>
                    <div className="flex items-start justify-between gap-1">
                      <span className="text-[10px] uppercase font-bold text-slate-400">
                        {dish.category}
                      </span>
                      {dish.is_spicy && (
                        <span className="text-[10px] text-rose-500 font-bold" title="Spicy">
                          🌶️ {dish.spice_level > 1 ? `${dish.spice_level}x` : ''}
                        </span>
                      )}
                      {dish.is_veg && (
                        <span className="text-[10px] text-emerald-500 font-bold" title="Vegetarian">
                          🌱 Veg
                        </span>
                      )}
                    </div>

                    <div className="font-bold text-xs text-slate-900 dark:text-white mt-1 group-hover:text-orange-500 transition-colors line-clamp-1">
                      {lang === 'bn' && dish.name_bn ? dish.name_bn : dish.name}
                    </div>

                    {lang === 'bn' && dish.name_bn && dish.name !== dish.name_bn && (
                      <div className="text-[10px] text-slate-400 line-clamp-1">
                        {dish.name}
                      </div>
                    )}
                  </div>

                  <div className="mt-3 pt-2 border-t border-slate-100 dark:border-zinc-800/80 flex items-center justify-between">
                    <span className="font-bold font-mono text-sm text-slate-900 dark:text-white">
                      ৳ {dish.price?.toLocaleString()}
                    </span>
                    <button className="w-6 h-6 rounded-lg bg-orange-500/10 text-orange-600 dark:text-orange-400 flex items-center justify-center font-bold text-xs group-hover:bg-orange-500 group-hover:text-white transition-all">
                      <Plus className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* RIGHT: RUNNING ORDER / CART SUMMARY */}
        <Card className="lg:col-span-5 xl:col-span-4 p-4 bg-white dark:bg-zinc-900 border-slate-200/80 dark:border-zinc-800 shadow-sm rounded-2xl flex flex-col justify-between">
          <div>
            {/* Header */}
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-zinc-800 pb-3 mb-3">
              <CardTitle className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <ShoppingCart className="w-4 h-4 text-orange-500" />
                <span>{lang === 'bn' ? `চলমান অর্ডার (${cart.reduce((a, b) => a + b.quantity, 0)})` : `Running Order (${cart.reduce((a, b) => a + b.quantity, 0)})`}</span>
              </CardTitle>

              {cart.length > 0 && (
                <button
                  onClick={() => setCart([])}
                  className="text-[10px] text-rose-500 hover:underline font-semibold cursor-pointer"
                >
                  {lang === 'bn' ? 'সব মুছুন' : 'Clear All'}
                </button>
              )}
            </div>

            {/* Cart Items List */}
            <div className="space-y-2.5 max-h-[360px] overflow-y-auto pr-1">
              {cart.length === 0 ? (
                <div className="text-center py-16 text-xs text-slate-400">
                  <Utensils className="w-8 h-8 mx-auto text-slate-300 dark:text-zinc-600 mb-2 opacity-50" />
                  {lang === 'bn' ? 'অর্ডার খালি। খাবারে ক্লিক করে যোগ করুন।' : 'Cart is empty. Click any dish to add.'}
                </div>
              ) : (
                cart.map((item, idx) => {
                  const modSum = (item.modifiers || []).reduce((acc, m) => acc + Number(m.price || 0), 0);
                  const itemTotal = (item.unit_price + modSum) * item.quantity;

                  return (
                    <div
                      key={idx}
                      className="p-2.5 rounded-xl bg-slate-50 dark:bg-zinc-800/40 border border-slate-100 dark:border-zinc-800 text-xs"
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-slate-900 dark:text-white line-clamp-1">
                          {lang === 'bn' && item.name_bn ? item.name_bn : item.name}
                        </span>
                        <span className="font-bold font-mono text-slate-900 dark:text-white">
                          ৳ {itemTotal.toLocaleString()}
                        </span>
                      </div>

                      {item.modifiers && item.modifiers.length > 0 && (
                        <div className="text-[10px] text-orange-600 dark:text-orange-400 mt-0.5">
                          + {item.modifiers.map((m) => m.name).join(', ')}
                        </div>
                      )}

                      {item.cooking_notes && (
                        <div className="text-[10px] text-slate-500 italic mt-0.5">
                          Note: "{item.cooking_notes}"
                        </div>
                      )}

                      {/* Quantity buttons */}
                      <div className="flex items-center justify-between mt-2 pt-1 border-t border-slate-200/50 dark:border-zinc-800/50">
                        <span className="text-[10px] text-slate-400 uppercase font-bold">
                          {item.course}
                        </span>

                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => {
                              const updated = [...cart];
                              if (updated[idx].quantity > 1) {
                                updated[idx].quantity -= 1;
                                setCart(updated);
                              } else {
                                setCart(cart.filter((_, i) => i !== idx));
                              }
                            }}
                            className="w-5 h-5 rounded-md bg-slate-200 dark:bg-zinc-700 text-slate-700 dark:text-white flex items-center justify-center font-bold"
                          >
                            <Minus className="w-3 h-3" />
                          </button>

                          <span className="font-bold font-mono text-xs w-4 text-center">
                            {item.quantity}
                          </span>

                          <button
                            onClick={() => {
                              const updated = [...cart];
                              updated[idx].quantity += 1;
                              setCart(updated);
                            }}
                            className="w-5 h-5 rounded-md bg-slate-200 dark:bg-zinc-700 text-slate-700 dark:text-white flex items-center justify-center font-bold"
                          >
                            <Plus className="w-3 h-3" />
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>

          {/* Calculations & Action Buttons */}
          <div className="mt-4 pt-3 border-t border-slate-200 dark:border-zinc-800 space-y-2 text-xs">
            <div className="flex items-center justify-between text-slate-600 dark:text-zinc-400">
              <span>{lang === 'bn' ? 'সাবটোটাল:' : 'Subtotal:'}</span>
              <span className="font-mono font-bold text-slate-900 dark:text-white">
                ৳ {subtotal.toLocaleString()}
              </span>
            </div>

            <div className="flex items-center justify-between text-slate-600 dark:text-zinc-400">
              <span>VAT ({vatPercent}%):</span>
              <span className="font-mono">৳ {vatAmount.toLocaleString()}</span>
            </div>

            {serviceChargePercent > 0 && (
              <div className="flex items-center justify-between text-slate-600 dark:text-zinc-400">
                <span>{lang === 'bn' ? 'সার্ভিস চার্জ' : 'Service Charge'} ({serviceChargePercent}%):</span>
                <span className="font-mono">৳ {serviceChargeAmount.toLocaleString()}</span>
              </div>
            )}

            <div className="flex items-center justify-between text-base font-black text-slate-900 dark:text-white pt-2 border-t border-slate-200 dark:border-zinc-800">
              <span>{lang === 'bn' ? 'মোট প্রদেয়:' : 'Net Payable:'}</span>
              <span className="text-orange-600 dark:text-orange-400 font-mono">
                ৳ {grandTotal.toLocaleString()}
              </span>
            </div>

            {/* Action Buttons */}
            <div className="grid grid-cols-2 gap-2 pt-2">
              <button
                disabled={cart.length === 0 || isSubmitting}
                onClick={handleDispatchKOT}
                className="w-full py-2.5 rounded-xl bg-orange-500 hover:bg-orange-600 text-white font-bold text-xs shadow-xs transition-all cursor-pointer flex items-center justify-center gap-1.5 disabled:opacity-50"
              >
                <Flame className="w-4 h-4" />
                <span>{lang === 'bn' ? 'কেওটি পাঠান' : 'Send KOT'}</span>
              </button>

              <button
                disabled={cart.length === 0 || isSubmitting}
                onClick={() => {
                  setTenderedAmount(grandTotal);
                  setIsPaymentModalOpen(true);
                }}
                className="w-full py-2.5 rounded-xl bg-[#00df89] hover:bg-[#00c578] text-slate-950 font-bold text-xs shadow-xs transition-all cursor-pointer flex items-center justify-center gap-1.5 disabled:opacity-50"
              >
                <DollarSign className="w-4 h-4" />
                <span>{lang === 'bn' ? 'বিল পরিশোধ' : 'Settle & Pay'}</span>
              </button>
            </div>

            <button
              onClick={() => setIsSplitBillOpen(true)}
              className="w-full py-1.5 text-[11px] font-semibold text-slate-500 hover:text-slate-800 dark:hover:text-white text-center flex items-center justify-center gap-1 cursor-pointer"
            >
              <Split className="w-3.5 h-3.5" />
              <span>{lang === 'bn' ? 'স্প্লিট বিল ক্যালকুলেটর' : 'Split Bill Calculator'}</span>
            </button>
          </div>
        </Card>

      </div>

      {/* ---------------------------------------------------- */}
      {/* MODAL 1: MODIFIER / ADD-ON PICKER                    */}
      {/* ---------------------------------------------------- */}
      {isModifierModalOpen && activeDish && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs">
          <Card className="max-w-md w-full p-6 bg-white dark:bg-[#121215] border-slate-200 dark:border-zinc-800 shadow-2xl rounded-2xl">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-zinc-800 pb-3 mb-4">
              <div>
                <CardTitle className="text-base font-bold text-slate-900 dark:text-white">
                  {lang === 'bn' && activeDish.name_bn ? activeDish.name_bn : activeDish.name}
                </CardTitle>
                <div className="text-xs font-mono font-bold text-orange-600 mt-0.5">
                  {lang === 'bn' ? 'মূল মূল্য:' : 'Base Price:'} ৳ {activeDish.price}
                </div>
              </div>
              <button
                onClick={() => setIsModifierModalOpen(false)}
                className="text-slate-400 hover:text-white cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4 text-xs">
              {/* Modifiers / Add-ons */}
              {activeDish.modifiers && activeDish.modifiers.length > 0 && (
                <div>
                  <label className="font-semibold text-slate-700 dark:text-zinc-300 block mb-1.5">
                    {lang === 'bn' ? 'অতিরিক্ত আইটেম / অ্যাড-অনস নির্বাচন করুন:' : 'Select Add-ons / Extras:'}
                  </label>
                  <div className="space-y-1.5">
                    {activeDish.modifiers.map((mod, i) => {
                      const isChecked = selectedModifiers.some((m) => m.name === mod.name);
                      return (
                        <label
                          key={i}
                          className="flex items-center justify-between p-2 rounded-xl border border-slate-200 dark:border-zinc-800 hover:bg-slate-50 dark:hover:bg-zinc-800/60 cursor-pointer"
                        >
                          <span className="font-medium">{mod.name}</span>
                          <div className="flex items-center gap-2">
                            <span className="font-mono font-bold text-emerald-600">+ ৳{mod.price}</span>
                            <input
                              type="checkbox"
                              checked={isChecked}
                              onChange={(e) => {
                                if (e.target.checked) {
                                  setSelectedModifiers([...selectedModifiers, mod]);
                                } else {
                                  setSelectedModifiers(selectedModifiers.filter((m) => m.name !== mod.name));
                                }
                              }}
                              className="w-4 h-4 accent-[#00df89] rounded"
                            />
                          </div>
                        </label>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Course Selection */}
              <div>
                <label className="font-semibold text-slate-700 dark:text-zinc-300 block mb-1">
                  {lang === 'bn' ? 'সার্ভিং কোর্স:' : 'Serving Course:'}
                </label>
                <select
                  value={selectedCourse}
                  onChange={(e) => setSelectedCourse(e.target.value)}
                  className="w-full h-9 px-3 rounded-xl border border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 text-xs font-medium"
                >
                  <option value="starter">{lang === 'bn' ? 'স্টার্টার / অ্যাপেটাইজার' : 'Appetizer / Starter'}</option>
                  <option value="main">{lang === 'bn' ? 'মূল খাবার' : 'Main Course'}</option>
                  <option value="dessert">{lang === 'bn' ? 'ডেজার্ট / মিষ্টি' : 'Dessert'}</option>
                  <option value="beverage">{lang === 'bn' ? 'পানীয়' : 'Drink & Beverage'}</option>
                </select>
              </div>

              {/* Cooking Notes */}
              <div>
                <label className="font-semibold text-slate-700 dark:text-zinc-300 block mb-1">
                  {lang === 'bn' ? 'কিচেন / রাঁধুনীর জন্য বিশেষ নোট:' : 'Special Kitchen / Chef Instructions:'}
                </label>
                <Input
                  placeholder={lang === 'bn' ? 'যেমন: কম ঝাল, পেঁয়াজ ছাড়া...' : 'e.g. Less spicy, no onion, well done...'}
                  value={cookingNotes}
                  onChange={(e) => setCookingNotes(e.target.value)}
                  className="h-9 text-xs"
                />
              </div>

              {/* Submit */}
              <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100 dark:border-zinc-800">
                <button
                  type="button"
                  onClick={() => setIsModifierModalOpen(false)}
                  className="px-4 py-2 rounded-xl border border-slate-200 text-xs font-semibold cursor-pointer"
                >
                  {lang === 'bn' ? 'বাতিল' : 'Cancel'}
                </button>
                <button
                  type="button"
                  onClick={handleConfirmModifier}
                  className="px-4 py-2 rounded-xl bg-orange-500 hover:bg-orange-600 text-white font-bold text-xs cursor-pointer"
                >
                  {lang === 'bn' ? 'কার্টে যোগ করুন' : 'Add to Cart'}
                </button>
              </div>
            </div>
          </Card>
        </div>
      )}

      {/* ---------------------------------------------------- */}
      {/* MODAL 2: SETTLE PAYMENT & CHECKOUT                   */}
      {/* ---------------------------------------------------- */}
      {isPaymentModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs">
          <Card className="max-w-md w-full p-6 bg-white dark:bg-[#121215] border-slate-200 dark:border-zinc-800 shadow-2xl rounded-2xl">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-zinc-800 pb-3 mb-4">
              <CardTitle className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <DollarSign className="w-4 h-4 text-emerald-500" />
                <span>{lang === 'bn' ? 'বিল পরিশোধ ও নিষ্পত্তি' : 'Settle Bill Payment'}</span>
              </CardTitle>
              <button
                onClick={() => setIsPaymentModalOpen(false)}
                className="text-slate-400 hover:text-white cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCompleteBill} className="space-y-4 text-xs">
              <div className="p-3 bg-emerald-500/10 border border-emerald-500/20 rounded-xl text-center">
                <span className="text-xs font-semibold text-slate-600 dark:text-zinc-400">{lang === 'bn' ? 'মোট প্রদেয়:' : 'Total Payable:'}</span>
                <div className="text-2xl font-bold font-mono text-emerald-600 dark:text-emerald-400">
                  ৳ {grandTotal.toLocaleString()}
                </div>
              </div>

              <div>
                <label className="font-semibold text-slate-700 dark:text-zinc-300 block mb-1">
                  {lang === 'bn' ? 'পেমেন্ট মাধ্যম:' : 'Payment Method:'}
                </label>
                <select
                  value={paymentMethod}
                  onChange={(e) => setPaymentMethod(e.target.value)}
                  className="w-full h-10 px-3 rounded-xl border border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 font-bold"
                >
                  <option value="cash">{lang === 'bn' ? 'নগদ ক্যাশ' : 'Cash'}</option>
                  <option value="bkash">bKash</option>
                  <option value="nagad">Nagad</option>
                  <option value="card">{lang === 'bn' ? 'কার্ড' : 'Credit/Debit Card'}</option>
                </select>
              </div>

              <div>
                <label className="font-semibold text-slate-700 dark:text-zinc-300 block mb-1">
                  {lang === 'bn' ? 'গৃহীত ক্যাশ / টেন্ডারড পরিমাণ:' : 'Cash Received / Tendered Amount:'}
                </label>
                <Input
                  type="number"
                  required
                  value={tenderedAmount}
                  onChange={(e) => setTenderedAmount(e.target.value)}
                  className="h-10 text-xs font-mono font-bold text-base"
                />
              </div>

              {Number(tenderedAmount) > grandTotal && (
                <div className="p-2.5 bg-blue-500/10 text-blue-600 dark:text-blue-400 rounded-xl font-bold flex items-center justify-between">
                  <span>{lang === 'bn' ? 'ফেরতযোগ্য টাকা:' : 'Change to Return:'}</span>
                  <span className="font-mono text-sm">
                    ৳ {(Number(tenderedAmount) - grandTotal).toLocaleString()}
                  </span>
                </div>
              )}

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100 dark:border-zinc-800">
                <button
                  type="button"
                  onClick={() => setIsPaymentModalOpen(false)}
                  className="px-4 py-2 rounded-xl border border-slate-200 text-xs font-semibold cursor-pointer"
                >
                  {lang === 'bn' ? 'বাতিল' : 'Cancel'}
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-4 py-2 rounded-xl bg-[#00df89] text-slate-950 text-xs font-bold hover:bg-[#00c578] cursor-pointer"
                >
                  {lang === 'bn' ? 'অর্ডার সম্পন্ন করুন' : 'Confirm & Complete Order'}
                </button>
              </div>
            </form>
          </Card>
        </div>
      )}

      {/* ---------------------------------------------------- */}
      {/* MODAL 3: SPLIT BILL CALCULATOR                       */}
      {/* ---------------------------------------------------- */}
      {isSplitBillOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs">
          <Card className="max-w-xs w-full p-6 bg-white dark:bg-[#121215] border-slate-200 dark:border-zinc-800 shadow-2xl rounded-2xl text-center">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-zinc-800 pb-3 mb-4">
              <span className="text-sm font-bold text-slate-900 dark:text-white">Split Bill Calculator</span>
              <button
                onClick={() => setIsSplitBillOpen(false)}
                className="text-slate-400 hover:text-white cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4 text-xs">
              <div>
                <label className="font-semibold text-slate-700 dark:text-zinc-300 block mb-1">
                  Split between how many guests?
                </label>
                <div className="flex items-center justify-center gap-3">
                  <button
                    onClick={() => setSplitCount(Math.max(2, splitCount - 1))}
                    className="w-8 h-8 rounded-xl border border-slate-300 font-bold"
                  >
                    -
                  </button>
                  <span className="font-mono text-lg font-bold w-10">{splitCount}</span>
                  <button
                    onClick={() => setSplitCount(splitCount + 1)}
                    className="w-8 h-8 rounded-xl border border-slate-300 font-bold"
                  >
                    +
                  </button>
                </div>
              </div>

              <div className="p-3 bg-purple-500/10 text-purple-700 dark:text-purple-300 rounded-xl">
                <span className="text-[11px] font-semibold">Each Person Pays:</span>
                <div className="text-xl font-bold font-mono mt-1">
                  ৳ {Math.ceil(grandTotal / splitCount).toLocaleString()}
                </div>
              </div>

              <button
                onClick={() => setIsSplitBillOpen(false)}
                className="w-full py-2 rounded-xl bg-slate-900 text-white dark:bg-white dark:text-slate-900 font-bold text-xs"
              >
                Done
              </button>
            </div>
          </Card>
        </div>
      )}

    </div>
  );
}
