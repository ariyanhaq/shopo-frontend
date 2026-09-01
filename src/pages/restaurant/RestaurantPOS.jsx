import { useState, useEffect, useMemo, useRef } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { useLanguage } from '@/context/LanguageContext';
import { useShop } from '@/context/ShopContext';
import { useAuth } from '@/context/AuthContext';
import api from '@/services/api';
import toast from 'react-hot-toast';
import { printSaleReceipt } from '@/utils/invoicePrinter';
import { Card, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/components/ui/select';
import { useBodyScrollLock } from '@/hooks/useBodyScrollLock';
import {
  Utensils, ShoppingCart, Flame, Search, Plus, Minus, Trash2,
  CheckCircle2, Printer, ArrowLeft, Users, DollarSign, X,
  Percent, Sparkles, CreditCard, Clock, Coffee, ShieldAlert, Split,
  User, UserCheck, Phone, MapPin, Receipt, Crown, Star, Gift,
  Award, Check, Loader2, Banknote, RefreshCw, ChefHat, Eye, Coins,
  Package, Bike
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

export default function RestaurantPOS() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { lang } = useLanguage();
  const { activeShop } = useShop();
  const { mongoShop } = useAuth();

  const preselectedTable = searchParams.get('table') || '';
  const preselectedTableId = searchParams.get('tableId') || '';
  const preselectedOrderId = searchParams.get('orderId') || '';

  // Order Type & Table Selection
  const [orderType, setOrderType] = useState('dine_in'); // 'dine_in' | 'takeaway' | 'delivery'
  const [selectedTableId, setSelectedTableId] = useState(preselectedTableId);
  const [selectedTableNumber, setSelectedTableNumber] = useState(preselectedTable);
  const [guestCount, setGuestCount] = useState(2);
  const [waiterName, setWaiterName] = useState('');
  const [activeTabOrder, setActiveTabOrder] = useState(null);
  const [isLoadingActiveTab, setIsLoadingActiveTab] = useState(false);
  const loadedOrderIdRef = useRef(null);

  // Customer CRM & Search
  const [customerPhone, setCustomerPhone] = useState('');
  const [customerName, setCustomerName] = useState('');
  const [deliveryAddress, setDeliveryAddress] = useState('');
  const [customerSuggestions, setCustomerSuggestions] = useState([]);
  const [showCustomerDropdown, setShowCustomerDropdown] = useState(false);
  const [matchedCustomer, setMatchedCustomer] = useState(null);
  const [isSearchingCustomer, setIsSearchingCustomer] = useState(false);

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
  const [vatPercent, setVatPercent] = useState(0);
  const [discountType, setDiscountType] = useState('flat'); // 'flat' | 'percentage'
  const [discountValue, setDiscountValue] = useState('');
  const [tipAmount, setTipAmount] = useState(0);
  const [deliveryFee, setDeliveryFee] = useState(0);

  // Payment & Checkout
  const [paymentMethod, setPaymentMethod] = useState('Cash'); // 'Cash' | 'bKash' | 'Nagad' | 'Card' | 'Due'
  const [tenderedAmount, setTenderedAmount] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [receipt, setReceipt] = useState(null);

  // Item Modifier Modal
  const [isModifierModalOpen, setIsModifierModalOpen] = useState(false);
  const [activeDish, setActiveDish] = useState(null);
  const [selectedModifiers, setSelectedModifiers] = useState([]);
  const [cookingNotes, setCookingNotes] = useState('');
  const [selectedCourse, setSelectedCourse] = useState('main');

  // Edit / Cooking Notes Modal
  const [isNotesModalOpen, setIsNotesModalOpen] = useState(false);
  const [editingItemIndex, setEditingItemIndex] = useState(null);
  const [tempNotes, setTempNotes] = useState('');

  // Split Bill Modal
  const [isSplitBillOpen, setIsSplitBillOpen] = useState(false);
  const [splitCount, setSplitCount] = useState(2);

  useBodyScrollLock(Boolean(receipt || isModifierModalOpen || isSplitBillOpen || isNotesModalOpen));

  // Initial Fetch: Tables & Menu
  useEffect(() => {
    const loadData = async () => {
      try {
        setIsLoadingMenu(true);
        const [tablesRes, menuRes] = await Promise.all([
          api.restaurant.tables.list(),
          api.restaurant.menu.list(),
        ]);
        if (tablesRes?.success) setTables(tablesRes.data || []);
        if (menuRes?.success) {
          const items = menuRes.data || [];
          setMenuItems(items);
          const uniqueCats = ['all', ...new Set(items.map((i) => i.category).filter(Boolean))];
          setCategories(uniqueCats);
        }
      } catch (err) {
        console.error('Failed to load restaurant POS catalog:', err);
        toast.error('Failed to load menu catalog');
      } finally {
        setIsLoadingMenu(false);
      }
    };
    loadData();
  }, [activeShop]);

  // Debounced Customer Lookup by Phone OR Name
  useEffect(() => {
    const qPhone = customerPhone.trim();
    const qName = customerName.trim();
    const q = qPhone || (qName && qName !== 'Walk-in Guest' && qName !== 'Walk-in Customer' ? qName : '');

    if (q.length < 2) {
      setCustomerSuggestions([]);
      setShowCustomerDropdown(false);
      if (!qPhone && !qName) {
        setMatchedCustomer(null);
      }
      return;
    }

    if (matchedCustomer && (matchedCustomer.phone === qPhone || matchedCustomer.name === qName)) {
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

        const exact = list.find(
          (c) => (qPhone && c.phone === qPhone) || (qName && c.name?.toLowerCase() === qName.toLowerCase())
        );
        if (exact) {
          setMatchedCustomer(exact);
          if (!customerName.trim() && exact.name) {
            setCustomerName(exact.name);
          }
          if (!customerPhone.trim() && exact.phone) {
            setCustomerPhone(exact.phone);
          }
          if (exact.address) setDeliveryAddress(exact.address);
        }
      } catch (err) {
        console.warn('Customer lookup error:', err);
      } finally {
        setIsSearchingCustomer(false);
      }
    }, 250);

    return () => clearTimeout(timer);
  }, [customerPhone, customerName]);

  // Detect and fetch active running tab for the selected table
  useEffect(() => {
    if (orderType !== 'dine_in' || !selectedTableNumber) {
      setActiveTabOrder(null);
      loadedOrderIdRef.current = null;
      return;
    }

    const currentTable = tables.find((t) => t.table_number === selectedTableNumber);
    const orderIdToFetch = preselectedOrderId || (currentTable?.active_order_id?._id || currentTable?.active_order_id);

    if (orderIdToFetch) {
      const orderIdStr = String(orderIdToFetch);
      if (loadedOrderIdRef.current === orderIdStr) {
        return; // Already loaded this exact order tab, avoid duplicate re-fetching
      }

      setIsLoadingActiveTab(true);
      api.restaurant.orders.getById(orderIdStr)
        .then((res) => {
          if (res?.success && res.data) {
            loadedOrderIdRef.current = orderIdStr;
            setActiveTabOrder(res.data);
            handleLoadActiveTab(res.data);
          } else {
            setActiveTabOrder(null);
            loadedOrderIdRef.current = null;
          }
        })
        .catch(() => {
          setActiveTabOrder(null);
          loadedOrderIdRef.current = null;
        })
        .finally(() => setIsLoadingActiveTab(false));
    } else {
      setActiveTabOrder(null);
      loadedOrderIdRef.current = null;
    }
  }, [selectedTableNumber, tables, preselectedOrderId, orderType]);

  // Load active table tab into POS cart for billing & payment collection
  const handleLoadActiveTab = (order) => {
    if (!order) return;
    const items = (order.items || []).map((it) => ({
      _id: it.menu_item_id || it._id,
      name: it.name,
      name_bn: it.name_bn,
      category: it.category,
      unit_price: it.unit_price,
      quantity: it.quantity,
      modifiers: it.modifiers || [],
      cooking_notes: it.cooking_notes || '',
      course: it.course || 'main',
    }));

    setCart(items);
    setCustomerName(order.customer_name && order.customer_name !== 'Walk-in Guest' ? order.customer_name : '');
    setCustomerPhone(order.customer_phone || '');
    setWaiterName(order.waiter_name || '');
    setGuestCount(order.guest_count || 2);
    setVatPercent(order.vat_percent !== undefined ? order.vat_percent : 0);
    setServiceChargePercent(order.service_charge_percent || 0);
    setDiscountValue(order.discount_amount ? String(order.discount_amount) : '');
    setDiscountType('flat');
    toast.success(
      lang === 'bn' ? `টেবিল ${order.table_number}-এর বিল লোড হয়েছে!` : `Loaded Table ${order.table_number} running bill into POS!`,
      { id: 'table-tab-load' }
    );
  };

  const selectCustomer = (cust) => {
    setMatchedCustomer(cust);
    setCustomerPhone(cust.phone || '');
    setCustomerName(cust.name || '');
    if (cust.address) setDeliveryAddress(cust.address);
    setShowCustomerDropdown(false);
    setCustomerSuggestions([]);
    const previousDueAmount = cust.balance ?? cust.total_due ?? cust.totalDue ?? 0;
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

  const clearCustomer = () => {
    setMatchedCustomer(null);
    setCustomerPhone('');
    setCustomerName('');
    setDeliveryAddress('');
    setShowCustomerDropdown(false);
    setCustomerSuggestions([]);
  };

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
          item_type: dish.item_type || (dish.category === 'Bottled Water & Soda' ? 'resale_product' : 'prepared_dish'),
          unit_price: Number(dish.price),
          image_url: dish.image_url,
          quantity: 1,
          modifiers,
          cooking_notes: notes,
          course,
          kitchen_station: dish.kitchen_station || (dish.item_type === 'resale_product' ? 'ready_to_serve' : 'main_kitchen'),
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

  // Discount Calculation
  const discountAmount = useMemo(() => {
    const val = Number(discountValue) || 0;
    if (val <= 0) return 0;
    if (discountType === 'percentage') {
      const pct = Math.min(100, Math.max(0, val));
      return Math.round((subtotal * pct) / 100);
    }
    return Math.min(subtotal, val);
  }, [subtotal, discountType, discountValue]);

  const vatAmount = Math.round((subtotal * vatPercent) / 100);
  const serviceChargeAmount = Math.round((subtotal * serviceChargePercent) / 100);
  const grandTotal = Math.max(
    0,
    subtotal + vatAmount + serviceChargeAmount + Number(deliveryFee || 0) - Number(discountAmount || 0) + Number(tipAmount || 0)
  );

  const changeToReturn = useMemo(() => {
    const tendered = Number(tenderedAmount) || 0;
    return Math.max(0, tendered - grandTotal);
  }, [tenderedAmount, grandTotal]);

  // Helper to count how many of a specific dish are in the cart
  const getDishCountInCart = (dishId) => {
    return cart.filter((c) => c._id === dishId).reduce((sum, c) => sum + c.quantity, 0);
  };

  // Filter items that require kitchen cooking (excluding direct resale goods like water/drinks)
  const kitchenCartItems = useMemo(() => {
    return cart.filter((it) => it.item_type !== 'resale_product');
  }, [cart]);

  // Calculate only newly added dishes or quantity increments compared to activeTabOrder
  const newDishes = useMemo(() => {
    if (!activeTabOrder) return [];
    const originalItems = activeTabOrder.items || [];

    const additional = [];
    cart.forEach((cartItem) => {
      // Direct resale items (bottled water/drinks) don't need kitchen cooking tickets
      if (cartItem.item_type === 'resale_product') return;

      // Find if this item existed in activeTabOrder
      const orig = originalItems.find((o) => {
        const matchId = String(o.menu_item_id || o._id) === String(cartItem._id);
        const matchModifiers = JSON.stringify(o.modifiers || []) === JSON.stringify(cartItem.modifiers || []);
        const matchNotes = (o.cooking_notes || '') === (cartItem.cooking_notes || '');
        return matchId && matchModifiers && matchNotes;
      });

      if (!orig) {
        // Entirely new dish added to cart
        additional.push({ ...cartItem });
      } else if (cartItem.quantity > orig.quantity) {
        // Quantity increased on existing dish
        additional.push({
          ...cartItem,
          quantity: cartItem.quantity - orig.quantity,
        });
      }
    });

    return additional;
  }, [cart, activeTabOrder]);

  // Append only new dishes to active table order in kitchen
  const handleSendAdditionalDishesToKitchen = async () => {
    if (!activeTabOrder?._id) return;
    if (newDishes.length === 0) {
      toast.error(lang === 'bn' ? 'কোনো নতুন রান্না করার খাবার যোগ করা হয়নি' : 'No new kitchen-prepared dishes to send');
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await api.restaurant.orders.appendItems(activeTabOrder._id, {
        items: newDishes,
      });
      if (res?.success) {
        const addedCount = newDishes.reduce((s, d) => s + d.quantity, 0);
        toast.success(
          lang === 'bn'
            ? `অতিরিক্ত ${addedCount}টি খাবার কিচেনে পাঠানো হয়েছে! 🍳`
            : `Sent ${addedCount} additional dishes to kitchen! 🍳`
        );
        if (res.data) {
          setActiveTabOrder(res.data);
          handleLoadActiveTab(res.data);
        }
      }
    } catch (err) {
      toast.error(err.message || 'Failed to send additional dishes to kitchen');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Dispatch KOT to Kitchen & Save
  const handleDispatchKOT = async () => {
    if (cart.length === 0) {
      toast.error('Please add food items to cart');
      return;
    }
    if (!selectedTableNumber) {
      toast.error(lang === 'bn' ? 'কেওটি পাঠাতে টেবিল নির্বাচন করুন' : 'Please select a table to dispatch KOT');
      return;
    }
    if (kitchenCartItems.length === 0) {
      toast.error(
        lang === 'bn'
          ? 'কার্টের সব পণ্যই সরাসরি বিক্রয়যোগ্য (পানি/ড্রিংকস), কিচেন কেওটির প্রয়োজন নেই। সরাসরি চেকআউট করুন।'
          : 'Cart only contains ready-to-serve resale items (water/drinks) which do not need kitchen cooking. Please use Checkout.'
      );
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
        customer_id: matchedCustomer?._id || null,
        customer_name: customerName.trim() || 'Walk-in Guest',
        customer_phone: customerPhone.trim(),
        delivery_address: deliveryAddress,
        vat_percent: vatPercent,
        service_charge_percent: serviceChargePercent,
        delivery_fee: Number(deliveryFee) || 0,
        discount_amount: discountAmount,
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

  // Settle Bill & Complete with Cash Memo Receipt
  const handleCompleteBill = async () => {
    if (cart.length === 0) {
      toast.error('Cart is empty');
      return;
    }

    setIsSubmitting(true);
    try {
      const paid = paymentMethod === 'Due' ? 0 : Number(tenderedAmount) || grandTotal;
      let res;

      if (activeTabOrder?._id) {
        // Settle existing running tab
        res = await api.restaurant.orders.complete(activeTabOrder._id, {
          paid_amount: paid,
          payment_method: paymentMethod.toLowerCase(),
        });
      } else {
        // Create new paid order (Quick Checkout / Settle on the spot)
        const payload = {
          order_type: orderType,
          status: 'completed',
          table_id: selectedTableId || null,
          table_number: selectedTableNumber || '',
          guest_count: guestCount || 1,
          waiter_name: waiterName || '',
          customer_id: matchedCustomer?._id || null,
          customer_name: customerName.trim() || 'Walk-in Guest',
          customer_phone: customerPhone.trim(),
          delivery_address: deliveryAddress,
          vat_percent: vatPercent,
          service_charge_percent: serviceChargePercent,
          delivery_fee: Number(deliveryFee) || 0,
          discount_amount: discountAmount,
          tip_amount: Number(tipAmount) || 0,
          paid_amount: paid,
          payment_method: paymentMethod.toLowerCase(),
          items: cart,
        };
        res = await api.restaurant.orders.create(payload);
      }

      if (res?.success) {
        toast.success(`Bill Paid & Completed! Total: ৳${grandTotal.toLocaleString()}`);
        
        // Build receipt object for thermal Cash Memo modal
        const invoiceNum = res.data?.invoice_number || res.data?.order_number || `REST-${Date.now().toString().slice(-6)}`;
        setReceipt({
          invoice: invoiceNum,
          kotNumber: res.data?.kot_number || 'KOT-1',
          date: new Date().toLocaleString(),
          orderType,
          tableNumber: selectedTableNumber,
          waiterName,
          guestCount,
          customerName: customerName || 'Walk-in Guest',
          customerPhone: customerPhone || '',
          customerAddress: deliveryAddress || '',
          paymentMethod,
          items: cart.map((it) => ({
            name: it.name,
            name_bn: it.name_bn,
            modifiers: it.modifiers,
            cooking_notes: it.cooking_notes,
            price: it.unit_price,
            qty: it.quantity,
            subtotal: (it.unit_price + (it.modifiers || []).reduce((acc, m) => acc + Number(m.price || 0), 0)) * it.quantity,
          })),
          subtotal,
          vatPercent,
          vatAmount,
          serviceChargePercent,
          serviceChargeAmount,
          discountAmount,
          deliveryFee,
          tipAmount,
          total: grandTotal,
          paidAmount: paid,
          changeDue: paymentMethod === 'Cash' ? changeToReturn : 0,
          remainingDue: paymentMethod === 'Due' ? grandTotal : 0,
        });

        // Reset Cart and Active Tab
        setCart([]);
        setDiscountValue('');
        setTenderedAmount('');
        setActiveTabOrder(null);
      }
    } catch (err) {
      toast.error(err.message || 'Failed to complete bill');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-4 font-sans pb-16">
      
      {/* ---------------------------------------------------- */}
      {/* 1. TOP HEADER & ORDER TYPE CONTROLS                  */}
      {/* ---------------------------------------------------- */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white dark:bg-zinc-900 p-3.5 rounded-2xl border border-slate-200/80 dark:border-zinc-800 shadow-xs">
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate('/restaurant/dashboard')}
            className="p-2 rounded-xl border border-slate-200 dark:border-zinc-800 hover:bg-slate-100 dark:hover:bg-zinc-800 text-slate-600 dark:text-zinc-400 cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
          <div>
            <h1 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white tracking-tight flex items-center gap-2">
              <Utensils className="w-4 h-4 text-orange-500" />
              <span>{lang === 'bn' ? 'রেস্তোরাঁ পিওএস ও ক্যাশ মেমো টার্মিনাল' : 'Restaurant POS & Cash Memo Terminal'}</span>
            </h1>
          </div>
        </div>

        {/* Order Type Toggle Switch */}
        <div className="flex items-center gap-1 bg-slate-100 dark:bg-zinc-800/80 p-1 rounded-xl">
          <button
            onClick={() => setOrderType('dine_in')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
              orderType === 'dine_in'
                ? 'bg-orange-500 text-white shadow-xs'
                : 'text-slate-600 dark:text-zinc-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <Utensils className="w-3.5 h-3.5" />
            <span>{lang === 'bn' ? 'ডাইন-ইন' : 'Dine-in'}</span>
          </button>

          <button
            onClick={() => setOrderType('takeaway')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
              orderType === 'takeaway'
                ? 'bg-blue-600 text-white shadow-xs'
                : 'text-slate-600 dark:text-zinc-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <Package className="w-3.5 h-3.5" />
            <span>{lang === 'bn' ? 'পার্সেল' : 'Takeaway'}</span>
          </button>

          <button
            onClick={() => setOrderType('delivery')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
              orderType === 'delivery'
                ? 'bg-emerald-600 text-white shadow-xs'
                : 'text-slate-600 dark:text-zinc-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <Bike className="w-3.5 h-3.5" />
            <span>{lang === 'bn' ? 'ডেলিভারি' : 'Delivery'}</span>
          </button>
        </div>
      </div>

      {/* ---------------------------------------------------- */}
      {/* 2. DINE-IN TABLE SELECTION STRIP                     */}
      {/* ---------------------------------------------------- */}
      {orderType === 'dine_in' && (
        <div className="p-3 bg-white dark:bg-zinc-900 border border-slate-200/90 dark:border-zinc-800 shadow-2xs rounded-2xl flex flex-wrap items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2.5">
            <span className="font-bold text-slate-800 dark:text-zinc-200 flex items-center gap-1.5 shrink-0">
              <Utensils className="w-4 h-4 text-orange-500" />
              <span>{lang === 'bn' ? 'টেবিল নির্বাচন:' : 'Select Table:'}</span>
            </span>

            <div className="w-56 sm:w-64">
              <Select
                value={selectedTableNumber}
                onValueChange={(val) => {
                  const tbl = tables.find((t) => t.table_number === val);
                  setSelectedTableNumber(val);
                  setSelectedTableId(tbl?._id || '');
                }}
              >
                <SelectTrigger className="h-8.5 text-xs font-semibold rounded-xl bg-slate-50 dark:bg-zinc-800/80 border-slate-200 dark:border-zinc-700 text-slate-900 dark:text-white">
                  <SelectValue placeholder={lang === 'bn' ? '-- টেবিল বেছে নিন --' : 'Select Table'} />
                </SelectTrigger>
                <SelectContent className="max-h-60">
                  {tables.map((t) => (
                    <SelectItem key={t._id} value={t.table_number}>
                      <div className="flex items-center justify-between w-full gap-2 text-xs font-medium">
                        <div className="flex items-center gap-2">
                          <span
                            className={`w-2 h-2 rounded-full shrink-0 ${
                              t.status === 'occupied'
                                ? 'bg-rose-500'
                                : t.status === 'reserved'
                                ? 'bg-amber-500'
                                : 'bg-emerald-500'
                            }`}
                          />
                          <span className="font-bold text-slate-900 dark:text-white">Table {t.table_number}</span>
                          <span className="text-[10px] text-slate-400 uppercase font-semibold">({t.zone})</span>
                        </div>
                        <span className="text-[11px] text-slate-500 dark:text-zinc-400 flex items-center gap-1 font-sans">
                          <Users className="w-3 h-3 text-slate-400" />
                          {t.capacity}
                        </span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1.5 bg-slate-50 dark:bg-zinc-800/60 px-2.5 py-1 rounded-xl border border-slate-200/80 dark:border-zinc-700/80">
              <Users className="w-3.5 h-3.5 text-slate-500 dark:text-zinc-400" />
              <span className="font-semibold text-slate-600 dark:text-zinc-400">{lang === 'bn' ? 'অতিথি:' : 'Guests:'}</span>
              <input
                type="number"
                min="1"
                max="50"
                value={guestCount}
                onChange={(e) => setGuestCount(e.target.value)}
                className="w-10 h-6 text-center rounded-lg bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-700 font-mono font-bold text-xs text-slate-900 dark:text-white outline-none focus:ring-1 focus:ring-[#00df89]"
              />
            </div>

            <div className="flex items-center gap-1.5 bg-slate-50 dark:bg-zinc-800/60 px-2.5 py-1 rounded-xl border border-slate-200/80 dark:border-zinc-700/80">
              <UserCheck className="w-3.5 h-3.5 text-slate-500 dark:text-zinc-400" />
              <span className="font-semibold text-slate-600 dark:text-zinc-400">{lang === 'bn' ? 'ওয়েটার:' : 'Server:'}</span>
              <input
                type="text"
                placeholder={lang === 'bn' ? 'ওয়েটারের নাম' : 'Waiter name'}
                value={waiterName}
                onChange={(e) => setWaiterName(e.target.value)}
                className="w-28 h-6 px-2 rounded-lg bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-700 text-xs text-slate-900 dark:text-white placeholder:text-slate-400 outline-none focus:ring-1 focus:ring-[#00df89]"
              />
            </div>
          </div>
        </div>
      )}

      {/* ---------------------------------------------------- */}
      {/* 3. MAIN TERMINAL GRID (LEFT: MENU | RIGHT: BILLING)  */}
      {/* ---------------------------------------------------- */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
        
        {/* LEFT COLUMN: FOOD MENU CATALOG WITH BIGGER BOXES */}
        <div className="lg:col-span-7 xl:col-span-7 space-y-3.5">
          
          {/* Search & Category Filter Pills */}
          <div className="space-y-2.5">
            <div className="relative w-full">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder={lang === 'bn' ? 'খাবারের নাম বা কোড দিয়ে খুঁজুন...' : 'Search dish name, biryani, burgers, pasta, drinks...'}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-white dark:bg-zinc-900 border border-slate-200/90 dark:border-zinc-800 text-xs text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-orange-500 shadow-2xs"
              />
            </div>

            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
              {categories.map((c) => (
                <button
                  key={c}
                  onClick={() => setSelectedCategory(c)}
                  className={`px-3.5 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-all cursor-pointer capitalize ${
                    selectedCategory === c
                      ? 'bg-slate-900 text-white dark:bg-white dark:text-slate-900 shadow-xs'
                      : 'bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 text-slate-600 dark:text-zinc-400 hover:bg-slate-50 dark:hover:bg-zinc-800'
                  }`}
                >
                  {c === 'all' ? (lang === 'bn' ? 'সব খাবার' : 'All Dishes') : c}
                </button>
              ))}
            </div>
          </div>

          {/* Dishes Food Grid (Bigger, Comfortable Touch Cards) */}
          {isLoadingMenu ? (
            <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 gap-3.5">
              {[1, 2, 3, 4, 5, 6].map((i) => (
                <Skeleton key={i} className="h-44 w-full rounded-2xl" />
              ))}
            </div>
          ) : filteredMenu.length === 0 ? (
            <div className="p-12 text-center rounded-2xl bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 text-xs text-slate-400">
              <Utensils className="w-8 h-8 mx-auto mb-2 opacity-40 text-slate-400" />
              <span>{lang === 'bn' ? 'কোনো খাবার পাওয়া যায়নি।' : 'No matching dishes found in menu.'}</span>
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 gap-3.5 max-h-[calc(100vh-280px)] overflow-y-auto pr-1">
              {filteredMenu.map((dish) => {
                const countInCart = getDishCountInCart(dish._id);
                const hasModifiers = dish.modifiers && dish.modifiers.length > 0;

                return (
                  <Card
                    key={dish._id}
                    onClick={() => handleOpenModifierModal(dish)}
                    className="p-4 bg-white dark:bg-zinc-900 border border-slate-200/90 dark:border-zinc-800 hover:border-orange-500/60 hover:shadow-md rounded-2xl transition-all cursor-pointer flex flex-col justify-between group relative overflow-hidden min-h-[160px]"
                  >
                    {/* Active in-cart count badge */}
                    {countInCart > 0 && (
                      <div className="absolute top-2.5 right-2.5 z-10 px-2 py-0.5 rounded-full bg-orange-500 text-white text-[10px] font-bold shadow-xs flex items-center gap-1">
                        <span>{countInCart}</span>
                        <span className="text-[8px] font-normal">{lang === 'bn' ? 'কার্টে' : 'in cart'}</span>
                      </div>
                    )}

                    <div>
                      {/* Top Badges */}
                      <div className="flex items-center gap-1.5 flex-wrap mb-2">
                        <span className="text-[10px] uppercase font-bold text-slate-400 dark:text-zinc-500 tracking-wider">
                          {dish.category}
                        </span>
                        {dish.item_type === 'resale_product' && (
                          <span className="text-[9px] px-1.5 py-0.5 rounded bg-blue-500/10 text-blue-600 dark:text-blue-400 font-bold">
                            📦 Resale
                          </span>
                        )}
                        {dish.is_veg && dish.item_type !== 'resale_product' && (
                          <span className="text-[9px] px-1.5 py-0.5 rounded bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 font-bold">
                            🌱 Veg
                          </span>
                        )}
                        {dish.is_spicy && (
                          <span className="text-[9px] px-1.5 py-0.5 rounded bg-rose-500/10 text-rose-600 dark:text-rose-400 font-bold">
                            🌶️ {dish.spice_level ? `${dish.spice_level}x` : ''}
                          </span>
                        )}
                      </div>

                      {/* Food Titles */}
                      <h3 className="font-bold text-sm sm:text-[15px] text-slate-900 dark:text-white line-clamp-1 group-hover:text-orange-600 dark:group-hover:text-orange-400 transition-colors">
                        {dish.name}
                      </h3>
                      {dish.name_bn && (
                        <p className="text-[11px] text-slate-500 dark:text-zinc-400 font-normal line-clamp-1 mt-0.5">
                          {dish.name_bn}
                        </p>
                      )}

                      {/* Prep time info */}
                      {dish.preparation_time_minutes && (
                        <div className="flex items-center gap-1 text-[10px] text-slate-400 dark:text-zinc-500 mt-1.5">
                          <Clock className="w-3 h-3 text-slate-400" />
                          <span>~{dish.preparation_time_minutes} mins prep</span>
                        </div>
                      )}
                    </div>

                    {/* Bottom Row: Price & Touch Add Button */}
                    <div className="mt-3.5 pt-2.5 border-t border-slate-100 dark:border-zinc-800 flex items-center justify-between">
                      <div>
                        <span className="text-xs text-slate-400 font-medium">{lang === 'bn' ? 'মূল্য:' : 'Price:'} </span>
                        <span className="font-bold font-mono text-base text-slate-900 dark:text-white">
                          ৳ {dish.price?.toLocaleString()}
                        </span>
                      </div>

                      <button
                        type="button"
                        className="px-2.5 py-1.5 rounded-xl bg-orange-500/10 text-orange-600 dark:text-orange-400 font-bold text-xs flex items-center gap-1 group-hover:bg-orange-500 group-hover:text-white transition-all shadow-2xs cursor-pointer"
                      >
                        <Plus className="w-3.5 h-3.5 stroke-[2.5]" />
                        <span>{hasModifiers ? (lang === 'bn' ? 'কাস্টমাইজ' : 'Add +') : (lang === 'bn' ? 'যোগ' : 'Add')}</span>
                      </button>
                    </div>
                  </Card>
                );
              })}
            </div>
          )}
        </div>

        {/* RIGHT: REGISTER CART & BILLING (MATCHING STANDARD POS LAYOUT) */}
        <div className="lg:col-span-5 xl:col-span-5 space-y-3">
          <Card className="p-4 border-slate-200/90 dark:border-zinc-800/80 dark:bg-[#121215] space-y-3 shadow-sm rounded-2xl">
            
            {/* Header: Current Bill */}
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-zinc-800 pb-2">
              <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <ShoppingCart className="w-4 h-4 text-[#00df89]" />
                <span>
                  {selectedTableNumber
                    ? (lang === 'bn' ? `টেবিল ${selectedTableNumber}-এর বিল` : `Table ${selectedTableNumber} Bill`)
                    : (lang === 'bn' ? `চলমান বিল (${cart.reduce((a, b) => a + b.quantity, 0)} টি আইটেম)` : `Current Bill (${cart.reduce((a, b) => a + b.quantity, 0)} items)`)}
                </span>
              </h3>

              {cart.length > 0 && (
                <button
                  type="button"
                  onClick={() => {
                    setCart([]);
                    setDiscountValue('');
                    setTenderedAmount('');
                    setActiveTabOrder(null);
                  }}
                  className="text-xs text-rose-500 hover:text-rose-700 font-semibold cursor-pointer"
                >
                  {lang === 'bn' ? 'মুছুন' : 'Clear'}
                </button>
              )}
            </div>

            {/* Cart Items List */}
            {isLoadingActiveTab ? (
              <div className="space-y-2 py-2">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="flex items-center justify-between p-2.5 rounded-xl border border-slate-100 dark:border-zinc-800 bg-slate-50/50 dark:bg-zinc-800/20">
                    <div className="space-y-1 flex-1">
                      <Skeleton className="h-4 w-32 rounded" />
                      <Skeleton className="h-3 w-20 rounded" />
                    </div>
                    <Skeleton className="h-6 w-16 rounded-lg ml-2" />
                  </div>
                ))}
              </div>
            ) : cart.length === 0 ? (
              <div className="py-8 text-center text-slate-400 text-xs border border-dashed border-slate-200 dark:border-zinc-800 rounded-xl">
                <Utensils className="w-7 h-7 mx-auto mb-1.5 opacity-40 text-slate-400" />
                <span>{lang === 'bn' ? 'খাবারে ট্যাপ করে বিলে যোগ করুন।' : 'Tap food items on left to add to bill.'}</span>
              </div>
            ) : (
              <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                {cart.map((item, idx) => {
                  const modSum = (item.modifiers || []).reduce((acc, m) => acc + Number(m.price || 0), 0);
                  const itemTotal = (item.unit_price + modSum) * item.quantity;

                  return (
                    <div
                      key={idx}
                      className="flex items-center justify-between text-xs p-2 rounded-xl border bg-slate-50 dark:bg-[#09090b] border-slate-100 dark:border-zinc-800"
                    >
                      <div className="flex-1 min-w-0 pr-2">
                        <div className="font-semibold truncate text-slate-900 dark:text-white flex items-center gap-1">
                          <span>{lang === 'bn' && item.name_bn ? item.name_bn : item.name}</span>
                        </div>
                        {item.modifiers && item.modifiers.length > 0 && (
                          <div className="text-[10px] text-orange-600 dark:text-orange-400 truncate">
                            +{item.modifiers.map((m) => m.name).join(', ')}
                          </div>
                        )}
                        <div className="text-[10px] text-slate-400">
                          ৳ {item.unit_price + modSum} × {item.quantity}
                        </div>
                      </div>

                      {/* Quantity Input Box with +/- buttons */}
                      <div className="flex items-center gap-0.5 bg-white dark:bg-zinc-800 rounded-lg p-0.5 border border-slate-200 dark:border-zinc-700">
                        <button
                          type="button"
                          onClick={() => {
                            const updated = [...cart];
                            if (updated[idx].quantity > 1) {
                              updated[idx].quantity -= 1;
                              setCart(updated);
                            } else {
                              setCart(cart.filter((_, i) => i !== idx));
                            }
                          }}
                          className="w-5 h-5 flex items-center justify-center text-slate-600 dark:text-zinc-300 hover:text-slate-900 dark:hover:text-white rounded hover:bg-slate-100 dark:hover:bg-zinc-700 cursor-pointer"
                        >
                          <Minus className="w-2.5 h-2.5" />
                        </button>

                        <input
                          type="number"
                          min="1"
                          value={item.quantity}
                          onChange={(e) => {
                            const val = Math.max(1, parseInt(e.target.value, 10) || 1);
                            const updated = [...cart];
                            updated[idx].quantity = val;
                            setCart(updated);
                          }}
                          className="w-8 text-center font-bold font-mono text-xs bg-transparent border-0 outline-none text-slate-900 dark:text-white p-0 focus:ring-1 focus:ring-[#00df89] rounded"
                        />

                        <button
                          type="button"
                          onClick={() => {
                            const updated = [...cart];
                            updated[idx].quantity += 1;
                            setCart(updated);
                          }}
                          className="w-5 h-5 flex items-center justify-center text-slate-600 dark:text-zinc-300 hover:text-slate-900 dark:hover:text-white rounded hover:bg-slate-100 dark:hover:bg-zinc-700 cursor-pointer"
                        >
                          <Plus className="w-2.5 h-2.5" />
                        </button>
                      </div>

                      <div className="w-14 text-right font-bold text-slate-900 dark:text-white font-mono">
                        ৳ {itemTotal.toLocaleString()}
                      </div>

                      <button
                        type="button"
                        onClick={() => setCart(cart.filter((_, i) => i !== idx))}
                        className="ml-1 text-slate-400 hover:text-rose-500 p-0.5 cursor-pointer"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  );
                })}
              </div>
            )}

            {/* CUSTOMER INFO CARD (MATCHING STANDARD POS) */}
            <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-[#09090b] border border-slate-200 dark:border-zinc-800 space-y-1.5 text-xs relative">
              <div className="flex items-center justify-between">
                <span className="font-semibold text-slate-700 dark:text-zinc-300 flex items-center gap-1">
                  <User className="w-3.5 h-3.5 text-[#00df89]" />
                  <span>{lang === 'bn' ? 'গ্রাহকের তথ্য (ঐচ্ছিক):' : 'Customer (Optional):'}</span>
                </span>
                {isSearchingCustomer ? (
                  <span className="flex items-center gap-1 text-[10px] text-slate-400">
                    <Loader2 className="w-2.5 h-2.5 animate-spin text-[#00df89]" /> Looking up...
                  </span>
                ) : (matchedCustomer || customerPhone || customerName) ? (
                  <button
                    type="button"
                    onClick={clearCustomer}
                    className="text-[10px] text-rose-500 hover:underline flex items-center gap-0.5 cursor-pointer"
                  >
                    <X className="w-2.5 h-2.5" /> Clear
                  </button>
                ) : null}
              </div>

              <div className="grid grid-cols-2 gap-1.5 relative">
                {/* Phone Input */}
                <div className="relative">
                  <input
                    type="tel"
                    placeholder={lang === 'bn' ? 'ফোন নম্বর' : 'Phone No.'}
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
                </div>

                {/* Name Input */}
                <div className="relative">
                  <input
                    type="text"
                    placeholder={lang === 'bn' ? 'গ্রাহকের নাম (ঐচ্ছিক)' : 'Customer Name (Optional)'}
                    value={customerName}
                    onChange={(e) => {
                      setCustomerName(e.target.value);
                      setShowCustomerDropdown(true);
                    }}
                    onFocus={() => {
                      if (customerSuggestions.length > 0) setShowCustomerDropdown(true);
                    }}
                    className="w-full px-2.5 py-1.5 rounded-lg bg-white dark:bg-[#121215] border border-slate-200 dark:border-zinc-800 text-xs outline-none focus:ring-1 focus:ring-[#00df89]"
                  />
                </div>

                {/* Customer Autocomplete Dropdown (Full Card Width) */}
                {showCustomerDropdown && customerSuggestions.length > 0 && (
                  <div className="absolute top-full left-0 right-0 w-full mt-1 z-50 bg-white dark:bg-[#18181b] border border-slate-200 dark:border-zinc-700 rounded-xl shadow-2xl overflow-hidden max-h-52 overflow-y-auto p-1 space-y-1">
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
                      const custDue = cust.balance ?? cust.total_due ?? cust.totalDue ?? 0;
                      return (
                        <div
                          key={cust._id}
                          onClick={() => selectCustomer(cust)}
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
                              {cust.phone || 'No phone'}
                            </div>
                          </div>

                          <div className="text-right shrink-0">
                            {cust.total_purchases ? (
                              <div className="text-[10px] font-bold text-[#00a86b] dark:text-[#00df89]">
                                ৳ {Number(cust.total_purchases).toLocaleString()}
                              </div>
                            ) : null}
                            {cust.membership_tier && (
                              <span
                                className="text-[9px] px-1.5 py-0.2 rounded-full font-bold border block mt-0.5"
                                style={getTierBadgeStyle(typeof cust.membership_tier === 'object' ? cust.membership_tier.badge_color || '#10b981' : '#10b981')}
                              >
                                ★ {typeof cust.membership_tier === 'object' ? cust.membership_tier.name : cust.membership_tier}
                              </span>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Delivery Address Input if Delivery */}
              {orderType === 'delivery' && (
                <input
                  type="text"
                  placeholder={lang === 'bn' ? 'ডেলিভারির পূর্ণ ঠিকানা...' : 'Delivery address...'}
                  value={deliveryAddress}
                  onChange={(e) => setDeliveryAddress(e.target.value)}
                  className="w-full px-2.5 py-1.5 rounded-lg bg-white dark:bg-[#121215] border border-slate-200 dark:border-zinc-800 text-xs outline-none focus:ring-1 focus:ring-[#00df89]"
                />
              )}

              {/* Matched Customer Info / Due Alert */}
              {matchedCustomer && (
                <div className="pt-1 border-t border-slate-200 dark:border-zinc-800 flex items-center justify-between text-[11px]">
                  <div className="flex items-center gap-1 text-emerald-600 dark:text-[#00df89] font-medium">
                    <CheckCircle2 className="w-3 h-3" />
                    <span>{matchedCustomer.name}</span>
                    {matchedCustomer.phone && <span className="text-slate-400 font-mono">({matchedCustomer.phone})</span>}
                  </div>
                  {((matchedCustomer.balance || matchedCustomer.total_due || 0) > 0) ? (
                    <span className="text-rose-600 font-bold text-[10px]">
                      Due: ৳{(matchedCustomer.balance || matchedCustomer.total_due).toLocaleString()}
                    </span>
                  ) : matchedCustomer.loyalty_points > 0 ? (
                    <span className="font-mono text-amber-600 font-bold flex items-center gap-1 text-[10px]">
                      <Sparkles className="w-2.5 h-2.5" />
                      {matchedCustomer.loyalty_points} pts
                    </span>
                  ) : null}
                </div>
              )}
            </div>

            {/* DISCOUNT CARD (MATCHING STANDARD POS) */}
            <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-[#09090b] border border-slate-200 dark:border-zinc-800 space-y-2 text-xs">
              <div className="flex items-center justify-between">
                <span className="font-semibold text-slate-700 dark:text-zinc-300 flex items-center gap-1">
                  <Percent className="w-3 h-3 text-[#00df89]" />
                  <span>{lang === 'bn' ? 'ছাড় (Discount):' : 'Discount:'}</span>
                </span>
                <div className="flex bg-slate-200 dark:bg-zinc-800 p-0.5 rounded-md text-[10px]">
                  <button
                    type="button"
                    onClick={() => setDiscountType('flat')}
                    className={`px-1.5 py-0.5 rounded font-medium cursor-pointer ${
                      discountType === 'flat'
                        ? 'bg-white dark:bg-zinc-900 text-slate-900 dark:text-white shadow-2xs'
                        : 'text-slate-500'
                    }`}
                  >
                    ৳ Flat
                  </button>
                  <button
                    type="button"
                    onClick={() => setDiscountType('percentage')}
                    className={`px-1.5 py-0.5 rounded font-medium cursor-pointer ${
                      discountType === 'percentage'
                        ? 'bg-white dark:bg-zinc-900 text-slate-900 dark:text-white shadow-2xs'
                        : 'text-slate-500'
                    }`}
                  >
                    %
                  </button>
                </div>
              </div>

              <div className="relative">
                <input
                  type="number"
                  placeholder={discountType === 'flat' ? 'Discount Amount (৳)' : 'Discount (%)'}
                  value={discountValue}
                  onChange={(e) => setDiscountValue(e.target.value)}
                  className="w-full px-2.5 py-1.5 rounded-lg bg-white dark:bg-[#121215] border border-slate-200 dark:border-zinc-800 text-xs outline-none focus:ring-1 focus:ring-[#00df89]"
                />
                {discountAmount > 0 && (
                  <span className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[10px] font-bold text-rose-500">
                    - ৳ {discountAmount.toLocaleString()}
                  </span>
                )}
              </div>
            </div>

            {/* VAT & TAXES CARD (MATCHING STANDARD POS) */}
            <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-[#09090b] border border-slate-200 dark:border-zinc-800 space-y-1.5 text-xs">
              <div className="flex justify-between text-slate-600 dark:text-zinc-400">
                <span>{lang === 'bn' ? 'সাবটোটাল:' : 'Subtotal:'}</span>
                <span className="font-mono font-bold text-slate-900 dark:text-white">৳ {subtotal.toLocaleString()}</span>
              </div>

              {discountAmount > 0 && (
                <div className="flex justify-between text-rose-600 dark:text-rose-400 font-semibold">
                  <span>{lang === 'bn' ? 'ছাড় কর্তন:' : 'Discount Applied:'}</span>
                  <span className="font-mono">- ৳ {discountAmount.toLocaleString()}</span>
                </div>
              )}

              {/* VAT Row with Input */}
              <div className="flex items-center justify-between text-slate-600 dark:text-zinc-400 pt-1 border-t border-slate-200/60 dark:border-zinc-800">
                <div className="flex items-center gap-1.5">
                  <span>VAT / Tax:</span>
                  <div className="flex items-center rounded-md bg-white dark:bg-[#121215] px-1.5 py-0.5 border border-slate-200 dark:border-zinc-700">
                    <input
                      type="number"
                      min="0"
                      max="100"
                      step="any"
                      value={vatPercent}
                      onChange={(e) => {
                        const val = e.target.value === '' ? '' : Math.max(0, parseFloat(e.target.value) || 0);
                        setVatPercent(val);
                      }}
                      className="w-9 text-center font-mono font-bold text-xs bg-transparent border-0 outline-none text-slate-900 dark:text-white"
                    />
                    <span className="text-[10px] font-bold text-slate-400">%</span>
                  </div>
                </div>
                <span className="font-mono font-bold text-slate-900 dark:text-white">
                  ৳ {vatAmount.toLocaleString()}
                </span>
              </div>

              {/* Service Charge */}
              <div className="flex items-center justify-between text-slate-600 dark:text-zinc-400 pt-1 border-t border-slate-200/60 dark:border-zinc-800">
                <div className="flex items-center gap-1.5">
                  <span>{lang === 'bn' ? 'সার্ভিস চার্জ:' : 'Service Charge:'}</span>
                  <div className="flex items-center rounded-md bg-white dark:bg-[#121215] px-1.5 py-0.5 border border-slate-200 dark:border-zinc-700">
                    <input
                      type="number"
                      min="0"
                      max="100"
                      step="any"
                      value={serviceChargePercent}
                      onChange={(e) => {
                        const val = e.target.value === '' ? 0 : Math.max(0, parseFloat(e.target.value) || 0);
                        setServiceChargePercent(val);
                      }}
                      className="w-8 text-center font-mono font-bold text-xs bg-transparent border-0 outline-none text-slate-900 dark:text-white"
                    />
                    <span className="text-[10px] font-bold text-slate-400">%</span>
                  </div>
                </div>
                <span className="font-mono">৳ {serviceChargeAmount.toLocaleString()}</span>
              </div>

              {orderType === 'delivery' && (
                <div className="flex justify-between text-slate-600 dark:text-zinc-400 pt-1 border-t border-slate-200/60 dark:border-zinc-800">
                  <span>{lang === 'bn' ? 'ডেলিভারি ফি:' : 'Delivery Fee:'}</span>
                  <input
                    type="number"
                    min="0"
                    value={deliveryFee}
                    onChange={(e) => setDeliveryFee(Number(e.target.value) || 0)}
                    className="w-14 h-5 text-right font-mono text-xs border rounded bg-white dark:bg-[#121215] px-1"
                  />
                </div>
              )}
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
                          : 'border-[#00df89] bg-[#00df89]/10 text-slate-900 dark:text-white font-bold'
                        : 'border-slate-200 dark:border-zinc-800 text-slate-600 dark:text-zinc-400 hover:bg-slate-100 dark:hover:bg-zinc-800'
                    }`}
                  >
                    {pm}
                  </button>
                ))}
              </div>
            </div>

            {/* CASH TENDERED & CHANGE (MATCHING STANDARD POS) */}
            {paymentMethod === 'Cash' && (
              <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-[#09090b] border border-slate-200 dark:border-zinc-800 space-y-1.5 text-xs">
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-slate-700 dark:text-zinc-300 flex items-center gap-1">
                    <Coins className="w-3 h-3 text-[#00df89]" /> Cash Received:
                  </span>
                  <button
                    type="button"
                    onClick={() => setTenderedAmount(String(grandTotal))}
                    className="text-[10px] text-[#00a86b] dark:text-[#00df89] font-semibold cursor-pointer"
                  >
                    Exact (৳{grandTotal.toLocaleString()})
                  </button>
                </div>
                <input
                  type="number"
                  placeholder="Cash handed by customer (৳)"
                  value={tenderedAmount}
                  onChange={(e) => setTenderedAmount(e.target.value)}
                  className="w-full px-2.5 py-1.5 rounded-lg bg-white dark:bg-[#121215] border border-slate-200 dark:border-zinc-800 text-xs font-semibold outline-none focus:ring-1 focus:ring-[#00df89]"
                />
                {parseFloat(tenderedAmount) > 0 && (
                  <div className="flex justify-between font-bold text-xs pt-1 border-t border-slate-200 dark:border-zinc-800">
                    <span className={parseFloat(tenderedAmount) >= grandTotal ? 'text-emerald-600 dark:text-[#00df89]' : 'text-amber-500'}>
                      {parseFloat(tenderedAmount) >= grandTotal ? 'Change to Return:' : 'Remaining Due:'}
                    </span>
                    <span className={parseFloat(tenderedAmount) >= grandTotal ? 'text-emerald-600 dark:text-[#00df89]' : 'text-amber-500'}>
                      ৳ {parseFloat(tenderedAmount) >= grandTotal ? changeToReturn.toLocaleString() : (grandTotal - parseFloat(tenderedAmount)).toLocaleString()}
                    </span>
                  </div>
                )}
              </div>
            )}

            {/* DUE CHECKOUT BOX (MATCHING STANDARD POS) */}
            {paymentMethod === 'Due' && (
              <div className="p-2.5 rounded-xl bg-amber-500/5 dark:bg-amber-500/10 border border-amber-500/30 space-y-1.5 text-xs">
                <div className="flex justify-between items-center text-amber-700 dark:text-amber-400 font-bold">
                  <span>This Bill Due:</span>
                  <span className="font-mono">৳ {grandTotal.toLocaleString()}</span>
                </div>
                <p className="text-[10px] text-slate-500 dark:text-zinc-400">
                  This order will be added to the customer's outstanding credit ledger.
                </p>
              </div>
            )}

            {/* TOTAL & CHECKOUT FOOTER */}
            <div className="pt-2 border-t border-slate-100 dark:border-zinc-800 space-y-2 text-xs">
              <div className="flex justify-between text-sm font-bold text-slate-900 dark:text-white">
                <span>Net Total:</span>
                <span className="text-[#00a86b] dark:text-[#00df89] text-base font-mono">
                  ৳ {grandTotal.toLocaleString()}
                </span>
              </div>

              {/* Settle Action Buttons */}
              {activeTabOrder && activeTabOrder.payment_status === 'paid' ? (
                <div className="space-y-2">
                  <div className="p-2.5 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-800 dark:text-emerald-300 text-xs flex items-center justify-between">
                    <span className="font-bold flex items-center gap-1.5">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-[#00df89]" />
                      <span>{lang === 'bn' ? 'বিল পরিশোধ সম্পন্ন হয়েছে' : 'Bill Already Paid'}</span>
                    </span>
                    <span className="font-mono font-bold">৳ {activeTabOrder.total_amount?.toLocaleString()}</span>
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <Button
                      type="button"
                      onClick={() =>
                        printSaleReceipt({
                          order: {
                            invoice_number: activeTabOrder.order_number || activeTabOrder.kot_number,
                            date: new Date(activeTabOrder.created_at).toLocaleString(),
                            customer_name: activeTabOrder.customer_name,
                            customer_phone: activeTabOrder.customer_phone,
                            payment_method: activeTabOrder.payment_method || 'cash',
                            items: (activeTabOrder.items || []).map((it) => ({
                              name: it.name,
                              unit_price: it.unit_price,
                              quantity: it.quantity,
                              subtotal: it.subtotal,
                            })),
                            subtotal: activeTabOrder.subtotal,
                            vat_percent: activeTabOrder.vat_percent,
                            vat_amount: activeTabOrder.vat_amount,
                            service_charge_percent: activeTabOrder.service_charge_percent,
                            service_charge_amount: activeTabOrder.service_charge_amount,
                            discount_amount: activeTabOrder.discount_amount,
                            total_amount: activeTabOrder.total_amount,
                            paid_amount: activeTabOrder.paid_amount,
                          },
                          shop: mongoShop,
                          lang,
                        })
                      }
                      variant="outline"
                      className="w-full font-bold h-11 text-xs gap-1.5 cursor-pointer shadow-xs border-slate-200 dark:border-zinc-700 rounded-xl"
                    >
                      <Printer className="w-4 h-4" />
                      <span>{lang === 'bn' ? 'রসিদ রিপ্রিন্ট' : 'Re-print Receipt'}</span>
                    </Button>

                    <Button
                      type="button"
                      onClick={async () => {
                        if (selectedTableId) {
                          await api.restaurant.tables.free(selectedTableId);
                          toast.success(lang === 'bn' ? 'টেবিল ফ্রি করা হয়েছে!' : 'Table marked ready & free!');
                          setActiveTabOrder(null);
                          setCart([]);
                          navigate('/restaurant/tables');
                        }
                      }}
                      className="w-full font-bold h-11 text-xs gap-1.5 cursor-pointer shadow-xs bg-[#00df89] hover:bg-[#00c97b] text-[#011812] rounded-xl"
                    >
                      <CheckCircle2 className="w-4 h-4" />
                      <span>{lang === 'bn' ? 'টেবিল ফ্রি করুন' : 'Free Table'}</span>
                    </Button>
                  </div>
                </div>
              ) : activeTabOrder ? (
                /* Unpaid Tab Settlement Action */
                <div className="space-y-1.5">
                  <Button
                    type="button"
                    disabled={cart.length === 0 || isSubmitting}
                    onClick={handleCompleteBill}
                    className={`w-full font-bold h-11 text-xs gap-1.5 cursor-pointer shadow-xs rounded-xl ${
                      paymentMethod === 'Due'
                        ? 'bg-amber-500 hover:bg-amber-600 text-slate-950'
                        : 'bg-[#00df89] hover:bg-[#00c97b] text-[#011812]'
                    }`}
                  >
                    {isSubmitting ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <CheckCircle2 className="w-4 h-4" />
                    )}
                    <span>
                      {paymentMethod === 'Due'
                        ? `Complete Due (৳${grandTotal.toLocaleString()})`
                        : (lang === 'bn' ? `টাকা গ্রহণ ও রসিদ প্রিন্ট (৳${grandTotal.toLocaleString()})` : `Collect Payment & Print (৳${grandTotal.toLocaleString()})`)}
                    </span>
                  </Button>

                  {/* ONLY show when newly added dishes exist on this table's running tab */}
                  {newDishes.length > 0 && (
                    <button
                      type="button"
                      disabled={isSubmitting}
                      onClick={handleSendAdditionalDishesToKitchen}
                      className="w-full py-2 px-3 rounded-xl bg-orange-50 hover:bg-orange-100 dark:bg-orange-950/40 dark:hover:bg-orange-900/60 border border-orange-200 dark:border-orange-900/60 text-xs font-bold text-orange-600 dark:text-orange-400 transition-colors text-center cursor-pointer flex items-center justify-center gap-1.5 shadow-2xs animate-in fade-in"
                    >
                      {isSubmitting ? (
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      ) : (
                        <Flame className="w-3.5 h-3.5" />
                      )}
                      <span>
                        {lang === 'bn'
                          ? `অতিরিক্ত ${newDishes.reduce((s, d) => s + d.quantity, 0)}টি খাবার কিচেনে পাঠান`
                          : `Send Additional Dishes to Kitchen (${newDishes.reduce((s, d) => s + d.quantity, 0)})`}
                      </span>
                    </button>
                  )}
                </div>
              ) : !selectedTableNumber ? (
                /* QUICK BILLING (NO TABLE SELECTED -> NO KOT OPTION, FAST FULL-WIDTH CHECKOUT) */
                <div>
                  <Button
                    type="button"
                    disabled={cart.length === 0 || isSubmitting}
                    onClick={handleCompleteBill}
                    className={`w-full font-bold h-11 text-xs gap-1.5 cursor-pointer shadow-xs rounded-xl ${
                      paymentMethod === 'Due'
                        ? 'bg-amber-500 hover:bg-amber-600 text-slate-950'
                        : 'bg-[#00df89] hover:bg-[#00c97b] text-[#011812]'
                    }`}
                  >
                    {isSubmitting ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <CheckCircle2 className="w-4 h-4" />
                    )}
                    <span>
                      {paymentMethod === 'Due'
                        ? `Complete Due (৳${grandTotal.toLocaleString()})`
                        : (lang === 'bn' ? `টাকা গ্রহণ ও দ্রুত বিল সম্পন্ন (৳${grandTotal.toLocaleString()})` : `Quick Checkout (৳${grandTotal.toLocaleString()})`)}
                    </span>
                  </Button>
                </div>
              ) : (
                /* TABLE SELECTED -> OPTION TO DISPATCH KOT OR SETTLE */
                <div className="grid grid-cols-2 gap-2">
                  <Button
                    type="button"
                    disabled={cart.length === 0 || isSubmitting || kitchenCartItems.length === 0}
                    onClick={handleDispatchKOT}
                    variant="outline"
                    className="w-full font-bold h-11 text-xs gap-1.5 cursor-pointer shadow-xs border-orange-300 dark:border-orange-900/50 text-orange-600 hover:bg-orange-50 dark:hover:bg-orange-950/30 rounded-xl disabled:opacity-50"
                    title={kitchenCartItems.length === 0 && cart.length > 0 ? 'Resale products do not need kitchen KOT' : ''}
                  >
                    {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Flame className="w-4 h-4" />}
                    <span>{lang === 'bn' ? 'শুধু কেওটি' : 'Send KOT Only'}</span>
                  </Button>

                  <Button
                    type="button"
                    disabled={cart.length === 0 || isSubmitting}
                    onClick={handleCompleteBill}
                    className={`w-full font-bold h-11 text-xs gap-1.5 cursor-pointer shadow-xs rounded-xl ${
                      paymentMethod === 'Due'
                        ? 'bg-amber-500 hover:bg-amber-600 text-slate-950'
                        : 'bg-[#00df89] hover:bg-[#00c97b] text-[#011812]'
                    }`}
                  >
                    {isSubmitting ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <CheckCircle2 className="w-4 h-4" />
                    )}
                    <span>
                      {paymentMethod === 'Due'
                        ? `Complete Due (৳${grandTotal.toLocaleString()})`
                        : `Checkout (৳${grandTotal.toLocaleString()})`}
                    </span>
                  </Button>
                </div>
              )}

              <button
                type="button"
                onClick={() => setIsSplitBillOpen(true)}
                className="w-full py-1 text-[11px] font-semibold text-slate-500 hover:text-slate-800 dark:hover:text-white text-center flex items-center justify-center gap-1 cursor-pointer"
              >
                <Split className="w-3.5 h-3.5" />
                <span>{lang === 'bn' ? 'স্প্লিট বিল ক্যালকুলেটর' : 'Split Bill Calculator'}</span>
              </button>
            </div>

          </Card>
        </div>

      </div>

      {/* ---------------------------------------------------- */}
      {/* MODAL 1: MODIFIER / ADD-ON PICKER                    */}
      {/* ---------------------------------------------------- */}
      {isModifierModalOpen && activeDish && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs animate-in fade-in">
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
                          className="flex items-center justify-between p-2.5 rounded-xl border border-slate-200 dark:border-zinc-800 hover:bg-slate-50 dark:hover:bg-zinc-800/60 cursor-pointer"
                        >
                          <span className="font-semibold text-slate-800 dark:text-zinc-200">{mod.name}</span>
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
      {/* MODAL 2: CASH MEMO & POS RECEIPT VIEWER              */}
      {/* ---------------------------------------------------- */}
      {receipt && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs animate-in fade-in">
          <Card className="max-w-sm w-full p-5 bg-white dark:bg-[#121215] border-slate-200 dark:border-zinc-800 space-y-3.5 text-xs shadow-2xl relative">
            
            {/* Top Close Button */}
            <button
              type="button"
              onClick={() => setReceipt(null)}
              className="absolute top-3 right-3 p-1 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-zinc-200 hover:bg-slate-100 dark:hover:bg-zinc-800/80 transition-colors cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>

            {/* Receipt Header */}
            <div className="text-center border-b border-dashed border-slate-200 dark:border-zinc-700 pb-2.5 pt-1">
              <h3 className="font-bold text-sm text-slate-900 dark:text-white">{mongoShop?.name || 'Shopo Restaurant'}</h3>
              <p className="text-[10px] text-slate-400 font-mono mt-0.5">{receipt.invoice}</p>
              <p className="text-[10px] text-slate-400">{receipt.date}</p>
              <div className="mt-1 flex items-center justify-center gap-2">
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-orange-500/10 text-orange-600 font-bold capitalize">
                  {receipt.orderType?.replace('_', ' ')}
                </span>
                {receipt.tableNumber && (
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-slate-100 dark:bg-zinc-800 font-bold">
                    Table {receipt.tableNumber}
                  </span>
                )}
              </div>
              <p className="text-[11px] text-slate-600 dark:text-zinc-400 font-semibold mt-1">
                {receipt.customerName} {receipt.customerPhone ? `(${receipt.customerPhone})` : ''}
              </p>
            </div>

            {/* Line Items */}
            <div className="space-y-1.5 py-2 border-b border-dashed border-slate-200 dark:border-zinc-700 max-h-48 overflow-y-auto">
              {receipt.items.map((it, idx) => (
                <div key={idx} className="flex justify-between text-[11px] items-start">
                  <div>
                    <span className="font-semibold text-slate-900 dark:text-white">{it.name}</span>
                    {it.modifiers && it.modifiers.length > 0 && (
                      <div className="text-[10px] text-orange-600">
                        + {it.modifiers.map((m) => m.name).join(', ')}
                      </div>
                    )}
                    <div className="text-[10px] text-slate-400">৳ {it.price} × {it.qty}</div>
                  </div>
                  <span className="font-bold text-slate-900 dark:text-white">৳ {it.subtotal.toLocaleString()}</span>
                </div>
              ))}
            </div>

            {/* Financial Summary */}
            <div className="space-y-1 text-xs">
              <div className="flex justify-between text-slate-500">
                <span>Subtotal:</span>
                <span>৳ {receipt.subtotal.toLocaleString()}</span>
              </div>
              {receipt.discountAmount > 0 && (
                <div className="flex justify-between text-rose-500 font-medium">
                  <span>Discount {receipt.discountType === 'percentage' ? `(${receipt.discountValue}%)` : '(Flat)'}:</span>
                  <span>- ৳ {receipt.discountAmount.toLocaleString()}</span>
                </div>
              )}
              <div className="flex justify-between text-slate-500">
                <span>VAT ({receipt.vatPercent}%):</span>
                <span>৳ {receipt.vatAmount.toLocaleString()}</span>
              </div>
              {receipt.serviceChargeAmount > 0 && (
                <div className="flex justify-between text-slate-500">
                  <span>Service Charge ({receipt.serviceChargePercent}%):</span>
                  <span>৳ {receipt.serviceChargeAmount.toLocaleString()}</span>
                </div>
              )}
              {receipt.deliveryFee > 0 && (
                <div className="flex justify-between text-slate-500">
                  <span>Delivery Fee:</span>
                  <span>৳ {receipt.deliveryFee.toLocaleString()}</span>
                </div>
              )}
              
              <div className="flex justify-between font-bold text-sm text-slate-900 dark:text-white pt-1.5 border-t border-slate-200 dark:border-zinc-700">
                <span>Net Total:</span>
                <span className="text-[#00a86b] dark:text-[#00df89]">৳ {receipt.total.toLocaleString()}</span>
              </div>

              <div className="flex justify-between text-slate-700 dark:text-zinc-300">
                <span>Paid ({receipt.paymentMethod}):</span>
                <span className="font-bold">৳ {receipt.paidAmount.toLocaleString()}</span>
              </div>

              {receipt.changeToReturn > 0 && (
                <div className="flex justify-between text-emerald-600 dark:text-[#00df89] font-bold">
                  <span>Change Returned:</span>
                  <span>৳ {receipt.changeToReturn.toLocaleString()}</span>
                </div>
              )}
            </div>

            {/* Print & New Sale Buttons */}
            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100 dark:border-zinc-800">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setReceipt(null)}
                className="cursor-pointer font-medium text-xs"
              >
                {lang === 'bn' ? 'নতুন অর্ডার' : 'New Order'}
              </Button>
              <Button
                size="sm"
                onClick={() =>
                  printSaleReceipt({
                    order: {
                      invoice_number: receipt.invoice,
                      date: receipt.date,
                      customer_name: receipt.customerName,
                      customer_phone: receipt.customerPhone,
                      payment_method: receipt.paymentMethod,
                      items: receipt.items.map((it) => ({
                        name: it.name,
                        unit_price: it.price,
                        quantity: it.qty,
                        subtotal: it.subtotal,
                      })),
                      subtotal: receipt.subtotal,
                      discount: receipt.discountAmount,
                      tax: receipt.vatAmount,
                      delivery_fee: receipt.deliveryFee,
                      total: receipt.total,
                      paid_amount: receipt.paidAmount,
                      cash_received: receipt.cashReceived,
                      change_amount: receipt.changeToReturn,
                    },
                    shop: mongoShop || activeShop,
                    lang,
                  })
                }
                className="bg-[#00df89] hover:bg-[#00c578] text-slate-950 font-bold text-xs gap-1.5 cursor-pointer shadow-xs"
              >
                <Printer className="w-3.5 h-3.5" />
                <span>{lang === 'bn' ? 'ক্যাশ মেমো প্রিন্ট' : 'Print Cash Memo'}</span>
              </Button>
            </div>
          </Card>
        </div>
      )}

      {/* ---------------------------------------------------- */}
      {/* MODAL 3: SPLIT BILL CALCULATOR                       */}
      {/* ---------------------------------------------------- */}
      {isSplitBillOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs animate-in fade-in">
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
                className="w-full py-2 rounded-xl bg-slate-900 text-white dark:bg-white dark:text-slate-900 font-bold text-xs cursor-pointer"
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
