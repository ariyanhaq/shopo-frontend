/**
 * @file HeroDashboardMockup.jsx
 * @description Fully interactive, responsive, bilingual SaaS dashboard preview mockup for Shopo landing page.
 * All tabs, POS cart interactions, restock actions, due payments, and payroll work in real-time.
 */
import { useState } from 'react';
import { useLanguage } from '@/context/LanguageContext';
import { motion, AnimatePresence } from 'framer-motion';
import {
  BarChart3, Package, TrendingUp, Users, UserCheck, Search, Bell, AlertTriangle,
  Lock, Plus, Minus, Trash2, CheckCircle2, ShoppingCart, Printer, ShieldCheck,
  Check, CreditCard, DollarSign, ArrowRight
} from 'lucide-react';

function formatNum(val, lang) {
  if (val === undefined || val === null || val === '') return '';
  if (lang !== 'bn') return val.toString();
  const bnDigits = ['০', '১', '২', '৩', '৪', '৫', '৬', '৭', '৮', '৯'];
  return val.toString().replace(/\d/g, (d) => bnDigits[d]);
}

export default function HeroDashboardMockup() {
  const { lang } = useLanguage();
  const isBn = lang === 'bn';

  const [activeTab, setActiveTab] = useState('dashboard'); // 'dashboard' | 'inventory' | 'sales' | 'customers' | 'employees'
  const [searchQuery, setSearchQuery] = useState('');

  // Interactive POS Cart State
  const [cart, setCart] = useState([
    { id: 1, name: isBn ? 'মিনিকোট চাল ২৫ কেজী' : 'Minikhet Rice 25kg', price: 1850, qty: 1 },
    { id: 2, name: isBn ? 'তীর সরিষার তেল ৫ লিটার' : 'Teer Mustard Oil 5L', price: 1150, qty: 2 }
  ]);
  const [saleCompleted, setSaleCompleted] = useState(false);

  // Interactive Inventory Restock State
  const [restocked, setRestocked] = useState(false);

  // Interactive Customer Dues State
  const [customersList, setCustomersList] = useState([
    { id: 1, name: isBn ? 'কামাল হোসেন' : 'Kamal Hossain', phone: '01711-889900', orders: 18, spent: 34500, due: 0 },
    { id: 2, name: isBn ? 'সাকিব আহমেদ' : 'Sakib Ahmed', phone: '01812-334455', orders: 7, spent: 12800, due: 1500 },
    { id: 3, name: isBn ? 'নুসরাত জাহান' : 'Nusrat Jahan', phone: '01915-667788', orders: 24, spent: 52000, due: 0 },
    { id: 4, name: isBn ? 'রাহাত চৌধুরী' : 'Rahat Chowdhury', phone: '01611-223344', orders: 5, spent: 8200, due: 850 }
  ]);

  // Interactive Employees Payroll State
  const [employeesList, setEmployeesList] = useState([
    { id: 1, name: isBn ? 'রফিকুল ইসলাম' : 'Rafiqul Islam', role: isBn ? 'সিনিয়র সেলসম্যান' : 'Senior Salesman', salary: 18000, status: isBn ? 'উপস্থিত' : 'Present', paid: false },
    { id: 2, name: isBn ? 'সুমাইয়া আক্তার' : 'Sumaiya Akter', role: isBn ? 'ক্যাশিয়ার ও ক্যাশ কাউন্টার' : 'Cashier & POS', salary: 20000, status: isBn ? 'উপস্থিত' : 'Present', paid: true },
    { id: 3, name: isBn ? 'আনিকা তাবাসসুম' : 'Anika Tabassum', role: isBn ? 'ইনভেন্টরি স্পেশালিস্ট' : 'Inventory Specialist', salary: 16500, status: isBn ? 'ছুটিতে' : 'On Leave', paid: false }
  ]);

  // Nav Items definition
  const navItems = [
    { id: 'dashboard', label: isBn ? 'ড্যাশবোর্ড' : 'Dashboard', icon: <BarChart3 className="w-4 h-4" /> },
    { id: 'inventory', label: isBn ? 'ইনভেন্টরি' : 'Inventory', icon: <Package className="w-4 h-4" /> },
    { id: 'sales', label: isBn ? 'বিক্রি (POS)' : 'Sales (POS)', icon: <TrendingUp className="w-4 h-4" />, badge: 'POS' },
    { id: 'customers', label: isBn ? 'কাস্টমার' : 'Customers', icon: <Users className="w-4 h-4" /> },
    { id: 'employees', label: isBn ? 'কর্মচারী' : 'Employees', icon: <UserCheck className="w-4 h-4" /> }
  ];

  // Dynamic Inventory Items
  const inventoryItems = [
    { id: 'SK-1001', name: isBn ? 'মিনিকোট চাল ২৫ কেজী' : 'Minikhet Rice 25kg', cat: isBn ? 'গ্রোসারী' : 'Grocery', stock: restocked ? 25 : 2, price: 1850, status: restocked ? (isBn ? 'স্টক আছে' : 'In Stock') : (isBn ? 'স্টক অ্যালার্ট' : 'Low Stock') },
    { id: 'SK-1002', name: isBn ? 'তীর সরিষার তেল ৫ লিটার' : 'Teer Mustard Oil 5L', cat: isBn ? 'গ্রোসারী' : 'Grocery', stock: 45, price: 1150, status: isBn ? 'স্টক আছে' : 'In Stock' },
    { id: 'SK-2001', name: isBn ? 'কটন ফর্মাল শার্ট XL' : 'Cotton Formal Shirt XL', cat: isBn ? 'পোশাক' : 'Clothing', stock: 18, price: 1450, status: isBn ? 'স্টক আছে' : 'In Stock' },
    { id: 'SK-3001', name: isBn ? 'ওয়ালটন এলইড বাল্ব 12W' : 'Walton LED Bulb 12W', cat: isBn ? 'ইলেকট্রনিক্স' : 'Electronics', stock: 0, price: 320, status: isBn ? 'স্টক শেষ' : 'Out of Stock' },
    { id: 'SK-1003', name: isBn ? 'রাধুনী মিক্স মসলা ২০০ গ্রাম' : 'Radhuni Spices Mix 200g', cat: isBn ? 'গ্রোসারী' : 'Grocery', stock: 120, price: 180, status: isBn ? 'স্টক আছে' : 'In Stock' }
  ];

  // POS Available Products
  const posProducts = [
    { id: 1, name: isBn ? 'মিনিকোট চাল ২৫ কেজী' : 'Minikhet Rice 25kg', price: 1850 },
    { id: 2, name: isBn ? 'তীর সরিষার তেল ৫ লিটার' : 'Teer Mustard Oil 5L', price: 1150 },
    { id: 3, name: isBn ? 'কটন ফর্মাল শার্ট XL' : 'Cotton Formal Shirt XL', price: 1450 },
    { id: 4, name: isBn ? 'ওয়ালটন এলইড বাল্ব 12W' : 'Walton LED Bulb 12W', price: 320 },
    { id: 5, name: isBn ? 'রাধুনী মিক্স মসলা' : 'Radhuni Spices Mix', price: 180 },
    { id: 6, name: isBn ? 'লাইফবয় সাবান ১০০ গ্রাম' : 'Lifebuoy Soap 100g', price: 65 }
  ];

  // Cart Helper Logic
  const addToCart = (prod) => {
    setSaleCompleted(false);
    setCart((prev) => {
      const exists = prev.find((item) => item.id === prod.id);
      if (exists) {
        return prev.map((item) => item.id === prod.id ? { ...item, qty: item.qty + 1 } : item);
      }
      return [...prev, { ...prod, qty: 1 }];
    });
  };

  const updateQty = (id, delta) => {
    setCart((prev) =>
      prev.map((item) => {
        if (item.id === id) {
          const newQty = item.qty + delta;
          return newQty > 0 ? { ...item, qty: newQty } : item;
        }
        return item;
      })
    );
  };

  const removeFromCart = (id) => {
    setCart((prev) => prev.filter((item) => item.id !== id));
  };

  const clearCustomerDue = (id) => {
    setCustomersList((prev) => prev.map((c) => c.id === id ? { ...c, due: 0 } : c));
  };

  const payEmployeeSalary = (id) => {
    setEmployeesList((prev) => prev.map((e) => e.id === id ? { ...e, paid: true } : e));
  };

  const subtotal = cart.reduce((acc, item) => acc + item.price * item.qty, 0);
  const tax = Math.round(subtotal * 0.05);
  const total = subtotal + tax;

  // Filter items by search
  const filteredInventory = inventoryItems.filter((i) =>
    i.name.toLowerCase().includes(searchQuery.toLowerCase()) || i.id.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="w-full max-w-full overflow-x-auto rounded-2xl sm:rounded-3xl border border-slate-200/80 bg-white shadow-2xl shadow-slate-900/10 text-left font-sans">
      <div className="min-w-[320px] sm:min-w-0 w-full">
      
      {/* Top Browser Bar */}
      <div className="bg-slate-100/90 px-3 sm:px-4 py-2.5 border-b border-slate-200/80 flex items-center justify-between overflow-hidden">
        <div className="flex items-center gap-1.5 shrink-0">
          <div className="w-2.5 h-2.5 sm:w-3 sm:h-3 rounded-full bg-rose-400"></div>
          <div className="w-2.5 h-2.5 sm:w-3 sm:h-3 rounded-full bg-amber-400"></div>
          <div className="w-2.5 h-2.5 sm:w-3 sm:h-3 rounded-full bg-emerald-400"></div>
        </div>
        <div className="px-2.5 sm:px-4 py-1 rounded-md bg-white border border-slate-200/60 text-[10px] sm:text-xs text-slate-500 font-mono flex items-center gap-1.5 shadow-2xs truncate max-w-[130px] xs:max-w-[180px] sm:max-w-none shrink">
          <Lock className="w-3 h-3 text-emerald-600 shrink-0" />
          <span className="truncate">https://shopo.app/dashboard</span>
        </div>
        <div className="text-xs font-semibold text-slate-400 hidden sm:block shrink-0">Shopo OS v2.4</div>
      </div>

      {/* Mobile Horizontal Navigation Tabs (Visible on screens < lg) */}
      <div className="lg:hidden bg-slate-50 p-2 border-b border-slate-200 flex items-center gap-1 overflow-x-auto no-scrollbar w-full">
        {navItems.map((item) => (
          <button
            key={item.id}
            onClick={() => setActiveTab(item.id)}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold shrink-0 flex items-center gap-1.5 transition-all ${
              activeTab === item.id
                ? 'bg-emerald-600 text-white shadow-xs'
                : 'bg-white text-slate-600 border border-slate-200/60'
            }`}
          >
            {item.icon}
            <span>{item.label}</span>
          </button>
        ))}
      </div>

      {/* Main Inner Container */}
      <div className="grid grid-cols-1 lg:grid-cols-12 bg-slate-50/50 p-2.5 sm:p-6 gap-3 sm:gap-6 min-h-[450px] w-full overflow-hidden">
        
        {/* Desktop Sidebar (Visible on screens >= lg) */}
        <div className="hidden lg:block lg:col-span-3 bg-white p-4 rounded-xl border border-slate-200/60 space-y-6">
          <div className="flex items-center gap-2.5 pb-4 border-b border-slate-100">
            <div className="w-8 h-8 rounded-lg bg-emerald-600 flex items-center justify-center text-white font-bold text-sm shadow-xs">
              R
            </div>
            <div className="truncate">
              <h5 className="text-xs font-bold text-slate-900 truncate">
                {isBn ? 'রহমান স্টোর, ঢাকা' : 'Rahman Store, Dhaka'}
              </h5>
              <span className="text-[10px] text-emerald-600 font-semibold bg-emerald-50 px-1.5 py-0.5 rounded">
                {isBn ? 'প্রো মার্চেন্ট' : 'Pro Merchant'}
              </span>
            </div>
          </div>

          <div className="space-y-1">
            {navItems.map((item) => (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                className={`w-full text-left px-3 py-2.5 rounded-lg text-xs font-bold flex items-center justify-between transition-all ${
                  activeTab === item.id
                    ? 'bg-emerald-50 text-emerald-700 shadow-2xs border border-emerald-200/60'
                    : 'text-slate-600 hover:bg-slate-50'
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <span className={activeTab === item.id ? 'text-emerald-600' : 'text-slate-400'}>{item.icon}</span>
                  <span>{item.label}</span>
                </div>
                {item.badge && (
                  <span className="px-1.5 py-0.5 text-[9px] bg-blue-100 text-blue-700 rounded font-bold">{item.badge}</span>
                )}
              </button>
            ))}
          </div>
        </div>

        {/* Dynamic Main Body Content */}
        <div className="lg:col-span-9 space-y-3 sm:space-y-6 w-full min-w-0 max-w-full overflow-hidden">
          
          {/* Search Header Bar inside Demo Mockup */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 bg-white p-2.5 sm:p-3.5 rounded-xl border border-slate-200/60 w-full overflow-hidden">
            <div className="relative w-full sm:w-64 min-w-0">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
              <input
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder={isBn ? 'পণ্য, বিক্রি বা কাস্টমার খুঁজুন...' : 'Search products, orders, customers...'}
                className="w-full pl-9 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg text-slate-700 focus:outline-none focus:border-emerald-500 truncate"
              />
            </div>
            <div className="flex items-center gap-2 sm:gap-3 justify-between sm:justify-end w-full sm:w-auto">
              <div className="relative p-1.5 text-slate-500 bg-slate-50 rounded-lg border border-slate-200/60 shrink-0">
                <Bell className="w-4 h-4 text-slate-600" />
                <span className="absolute top-1 right-1 w-2 h-2 rounded-full bg-rose-500 animate-pulse"></span>
              </div>
              <div className="text-[11px] sm:text-xs font-bold text-slate-800 bg-emerald-50 text-emerald-800 px-2.5 sm:px-3 py-1.5 rounded-lg border border-emerald-200 truncate">
                {isBn ? 'আজকের মোট: ৳২৪,৫০০' : "Today: ৳24,500"}
              </div>
            </div>
          </div>

          {/* VIEW 1: DASHBOARD VIEW */}
          {activeTab === 'dashboard' && (
            <div className="space-y-3 sm:space-y-6 w-full min-w-0">
              
              {/* 4 Stat Cards */}
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-2 sm:gap-4 w-full">
                <div className="bg-white p-2.5 sm:p-4 rounded-xl sm:rounded-2xl border border-slate-200/80 shadow-2xs space-y-1 overflow-hidden min-w-0">
                  <div className="text-[10px] sm:text-xs font-semibold text-slate-400 truncate">{isBn ? 'মোট আয়' : 'Total Revenue'}</div>
                  <div className="text-sm xs:text-base sm:text-2xl font-extrabold text-slate-900 truncate">৳{formatNum('1,24,580', lang)}</div>
                  <div className="text-[9px] sm:text-xs text-emerald-600 font-bold flex items-center gap-0.5 truncate">
                    <TrendingUp className="w-3 h-3 shrink-0" />
                    <span className="truncate">+14.5% vs last mo</span>
                  </div>
                </div>

                <div className="bg-white p-2.5 sm:p-4 rounded-xl sm:rounded-2xl border border-slate-200/80 shadow-2xs space-y-1 overflow-hidden min-w-0">
                  <div className="text-[10px] sm:text-xs font-semibold text-slate-400 truncate">{isBn ? 'আজকের বিক্রি' : 'Today Sales'}</div>
                  <div className="text-sm xs:text-base sm:text-2xl font-extrabold text-slate-900 truncate">{formatNum(142, lang)} {isBn ? 'টি' : 'Orders'}</div>
                  <div className="text-[9px] sm:text-xs text-blue-600 font-bold truncate">142 Completed</div>
                </div>

                <div className="bg-white p-2.5 sm:p-4 rounded-xl sm:rounded-2xl border border-slate-200/80 shadow-2xs space-y-1 overflow-hidden min-w-0">
                  <div className="text-[10px] sm:text-xs font-semibold text-slate-400 truncate">{isBn ? 'সক্রিয় গ্রাহক' : 'Active Customers'}</div>
                  <div className="text-sm xs:text-base sm:text-2xl font-extrabold text-slate-900 truncate">{formatNum(845, lang)} {isBn ? 'জন' : 'Users'}</div>
                  <div className="text-[9px] sm:text-xs text-emerald-600 font-bold truncate">+28 new this week</div>
                </div>

                <div className="bg-white p-2.5 sm:p-4 rounded-xl sm:rounded-2xl border border-rose-200 bg-rose-50/20 shadow-2xs space-y-1 overflow-hidden min-w-0">
                  <div className="text-[10px] sm:text-xs font-bold text-rose-600 flex items-center gap-1 truncate">
                    <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
                    <span className="truncate">{isBn ? 'স্বল্প স্টকের অ্যালার্ট' : 'Low Stock Alert'}</span>
                  </div>
                  <div className="text-sm xs:text-base sm:text-2xl font-extrabold text-rose-700 truncate">
                    {restocked ? formatNum(2, lang) : formatNum(3, lang)} {isBn ? 'টি আইটেম' : 'Items'}
                  </div>
                  <div className="text-[9px] sm:text-xs text-rose-600 font-semibold truncate">
                    {restocked ? (isBn ? 'স্টক আপডেট সম্পন্ন' : 'Restocked') : (isBn ? 'অবিলম্বে স্টক বাড়ান' : 'Action needed')}
                  </div>
                </div>
              </div>

              {/* Chart Graphics & Low Stock Interactive Restock */}
              <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
                <div className="md:col-span-8 bg-white p-4 rounded-2xl border border-slate-200/80 space-y-3">
                  <div className="flex items-center justify-between">
                    <h6 className="text-xs sm:text-sm font-bold text-slate-800">
                      {isBn ? 'সাপ্তাহিক সেলস এনালাইটিক্স' : 'Weekly Revenue Analytics'}
                    </h6>
                    <span className="text-[10px] bg-slate-100 text-slate-600 px-2 py-0.5 rounded-md font-semibold">
                      {isBn ? 'গত ৭ দিন' : 'Last 7 Days'}
                    </span>
                  </div>
                  <div className="h-32 flex items-end justify-between gap-2 pt-4">
                    {[40, 65, 45, 80, 55, 90, 75].map((h, idx) => (
                      <div key={idx} className="flex-1 flex flex-col items-center gap-1">
                        <div
                          style={{ height: `${h}%` }}
                          className={`w-full rounded-t-md transition-all ${
                            idx === 5 ? 'bg-emerald-500' : 'bg-slate-200 hover:bg-slate-300'
                          }`}
                        ></div>
                        <span className="text-[9px] sm:text-[10px] text-slate-400 font-mono">
                          {['Sat', 'Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri'][idx]}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="md:col-span-4 bg-white p-4 rounded-2xl border border-slate-200/80 flex flex-col justify-between space-y-3">
                  <div>
                    <div className="flex items-center gap-1.5 text-xs sm:text-sm font-bold text-rose-700">
                      <AlertTriangle className="w-4 h-4 text-rose-500" />
                      <span>{isBn ? 'স্টক শেষ অ্যালার্ট' : 'Low Stock Restock'}</span>
                    </div>
                    <p className="text-xs sm:text-sm text-slate-700 mt-2 font-medium">
                      {restocked
                        ? (isBn ? 'মিনিকোট চাল ২৫ কেজী (২৫ টি মজুদ)' : 'Minikhet Rice 25kg (25 units in stock)')
                        : (isBn ? 'মিনিকোট চাল ২৫ কেজী (২ টি বাকি)' : 'Minikhet Rice 25kg (2 units left)')}
                    </p>
                  </div>
                  <button
                    onClick={() => setRestocked(!restocked)}
                    className={`w-full py-2.5 sm:py-3 text-xs sm:text-sm font-bold rounded-xl transition-all ${
                      restocked
                        ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                        : 'bg-rose-600 hover:bg-rose-700 text-white shadow-md shadow-rose-500/20'
                    }`}
                  >
                    {restocked ? (isBn ? '✓ স্টক বাড়ানো হয়েছে' : '✓ Restocked (Click to Reset)') : (isBn ? 'স্টক বাড়ান (Restock Now)' : 'Restock Now')}
                  </button>
                </div>
              </div>

              {/* Recent Sales Table */}
              <div className="bg-white p-4 rounded-xl border border-slate-200/60 space-y-3">
                <div className="flex items-center justify-between">
                  <h6 className="text-xs font-bold text-slate-800">{isBn ? 'সাম্প্রতিক ক্যাশ মেমো বিক্রয় তালিকা' : 'Recent Sales Invoices'}</h6>
                  <span onClick={() => setActiveTab('sales')} className="text-[11px] text-emerald-600 font-semibold cursor-pointer hover:underline">
                    {isBn ? 'সব দেখুন' : 'View All POS'}
                  </span>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs min-w-[400px]">
                    <thead>
                      <tr className="border-b border-slate-100 text-slate-400 font-semibold">
                        <th className="py-2">{isBn ? 'কাস্টমার' : 'Customer'}</th>
                        <th className="py-2">{isBn ? 'আইটেম' : 'Item'}</th>
                        <th className="py-2">{isBn ? 'মূল্য' : 'Amount'}</th>
                        <th className="py-2">{isBn ? 'স্ট্যাটাস' : 'Status'}</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-50 text-slate-700 font-medium">
                      <tr>
                        <td className="py-2.5">{isBn ? 'কামাল হোসেন' : 'Kamal Hossain'}</td>
                        <td>{isBn ? 'ল্যাপটপ চার্জার 65W' : 'Laptop Charger 65W'}</td>
                        <td className="font-bold text-slate-900">৳{formatNum('2,200', lang)}</td>
                        <td>
                          <span className="px-2 py-0.5 rounded-full text-[10px] bg-emerald-100 text-emerald-800 font-bold">
                            {isBn ? 'পরিশোধিত' : 'Paid'}
                          </span>
                        </td>
                      </tr>
                      <tr>
                        <td className="py-2.5">{isBn ? 'সাকিব আহমেদ' : 'Sakib Ahmed'}</td>
                        <td>{isBn ? 'রাইস কুকার ৩ লিটার' : 'Rice Cooker 3L'}</td>
                        <td className="font-bold text-slate-900">৳{formatNum('4,500', lang)}</td>
                        <td>
                          <span className="px-2 py-0.5 rounded-full text-[10px] bg-amber-100 text-amber-800 font-bold">
                            {isBn ? 'বকেয়া' : 'Pending'}
                          </span>
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>

            </div>
          )}

          {/* VIEW 2: INVENTORY VIEW */}
          {activeTab === 'inventory' && (
            <div className="bg-white p-4 rounded-xl border border-slate-200/60 space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-slate-100">
                <div>
                  <h5 className="text-sm font-bold text-slate-900">
                    {isBn ? 'পণ্য ইনভেন্টরি ক্যাটালগ' : 'Product Inventory Catalog'}
                  </h5>
                  <p className="text-xs text-slate-400">
                    {isBn ? 'স্টক সংখ্যা ও পন্যের মূল্য পরিচালনা করুন' : 'Manage stock levels and item pricing'}
                  </p>
                </div>
                <button
                  onClick={() => alert(isBn ? 'পণ্য যোগ ইন্টারফেস উন্মুক্ত!' : 'Add product modal opened!')}
                  className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold flex items-center gap-1.5 w-fit"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>{isBn ? 'নতুন পণ্য যোগ করুন' : 'Add Product'}</span>
                </button>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs min-w-[550px]">
                  <thead>
                    <tr className="border-b border-slate-200 text-slate-400 font-semibold">
                      <th className="py-2.5">{isBn ? 'কোড' : 'SKU Code'}</th>
                      <th className="py-2.5">{isBn ? 'পণ্যের নাম' : 'Product Name'}</th>
                      <th className="py-2.5">{isBn ? 'ক্যাটাগরি' : 'Category'}</th>
                      <th className="py-2.5">{isBn ? 'মজুদ পরিমাণ' : 'Stock Qty'}</th>
                      <th className="py-2.5">{isBn ? 'বিক্রয় মূল্য' : 'Price'}</th>
                      <th className="py-2.5">{isBn ? 'স্ট্যাটাস' : 'Status'}</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-slate-700 font-medium">
                    {filteredInventory.map((item) => (
                      <tr key={item.id} className="hover:bg-slate-50">
                        <td className="py-3 font-mono text-slate-400">{item.id}</td>
                        <td className="font-bold text-slate-900">{item.name}</td>
                        <td><span className="px-2 py-0.5 rounded bg-slate-100 text-slate-600 text-[10px]">{item.cat}</span></td>
                        <td>{formatNum(item.stock, lang)}</td>
                        <td className="font-bold">৳{formatNum(item.price, lang)}</td>
                        <td>
                          <span
                            className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                              item.stock === 0
                                ? 'bg-rose-100 text-rose-800'
                                : item.stock <= 5
                                ? 'bg-amber-100 text-amber-800'
                                : 'bg-emerald-100 text-emerald-800'
                            }`}
                          >
                            {item.status}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* VIEW 3: SALES (POS) VIEW */}
          {activeTab === 'sales' && (
            <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
              
              {/* Product Select Grid (7 cols) */}
              <div className="md:col-span-7 bg-white p-4 rounded-xl border border-slate-200/60 space-y-3">
                <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                  <h6 className="text-xs font-bold text-slate-900">
                    {isBn ? 'কাউন্টার পিওএস (POS) প্রডাক্ট বেছে নিন' : 'Select Counter Products'}
                  </h6>
                  <span className="text-[10px] text-emerald-600 font-bold">Tap item to add</span>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
                  {posProducts.map((prod) => (
                    <button
                      key={prod.id}
                      onClick={() => addToCart(prod)}
                      className="p-3 rounded-lg border border-slate-200 bg-slate-50/50 hover:bg-emerald-50 hover:border-emerald-300 text-left transition-all flex flex-col justify-between h-24 group shadow-2xs"
                    >
                      <span className="text-xs font-bold text-slate-800 line-clamp-2 group-hover:text-emerald-700">
                        {prod.name}
                      </span>
                      <span className="text-xs font-extrabold text-emerald-600">
                        ৳{formatNum(prod.price, lang)}
                      </span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Cart Counter Sidebar (5 cols) */}
              <div className="md:col-span-5 bg-white p-4 rounded-xl border border-slate-200/60 flex flex-col justify-between space-y-3">
                <div>
                  <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                    <div className="flex items-center gap-1.5 text-xs font-bold text-slate-900">
                      <ShoppingCart className="w-4 h-4 text-emerald-600" />
                      <span>{isBn ? 'ক্যাশ মেমো কার্ট' : 'POS Cash Cart'}</span>
                    </div>
                    <span className="text-[10px] bg-slate-100 text-slate-600 px-2 py-0.5 rounded font-bold">
                      {formatNum(cart.length, lang)} Items
                    </span>
                  </div>

                  {/* Cart Item List */}
                  {cart.length === 0 ? (
                    <div className="py-8 text-center text-xs text-slate-400">Cart is empty</div>
                  ) : (
                    <div className="divide-y divide-slate-100 max-h-48 overflow-y-auto pt-2">
                      {cart.map((item) => (
                        <div key={item.id} className="py-2 flex items-center justify-between text-xs">
                          <div className="truncate max-w-[120px]">
                            <div className="font-bold text-slate-800 truncate">{item.name}</div>
                            <div className="text-[10px] text-slate-400">৳{formatNum(item.price, lang)}</div>
                          </div>

                          <div className="flex items-center gap-1.5">
                            <button onClick={() => updateQty(item.id, -1)} className="p-1 bg-slate-100 hover:bg-slate-200 rounded">
                              <Minus className="w-3 h-3 text-slate-600" />
                            </button>
                            <span className="font-bold px-1">{formatNum(item.qty, lang)}</span>
                            <button onClick={() => updateQty(item.id, 1)} className="p-1 bg-slate-100 hover:bg-slate-200 rounded">
                              <Plus className="w-3 h-3 text-slate-600" />
                            </button>
                            <button onClick={() => removeFromCart(item.id)} className="p-1 text-rose-500 hover:bg-rose-50 rounded ml-1">
                              <Trash2 className="w-3 h-3" />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Total & Checkout */}
                <div className="pt-3 border-t border-slate-100 space-y-2">
                  <div className="flex justify-between text-xs text-slate-500">
                    <span>{isBn ? 'সাবটোটাল' : 'Subtotal'}</span>
                    <span className="font-bold text-slate-800">৳{formatNum(subtotal, lang)}</span>
                  </div>
                  <div className="flex justify-between text-xs text-slate-500">
                    <span>{isBn ? 'ভ্যাট (৫%)' : 'VAT (5%)'}</span>
                    <span className="font-bold text-slate-800">৳{formatNum(tax, lang)}</span>
                  </div>
                  <div className="flex justify-between text-sm font-extrabold text-slate-900 pt-1 border-t border-slate-100">
                    <span>{isBn ? 'সর্বমোট' : 'Total Amount'}</span>
                    <span className="text-emerald-600">৳{formatNum(total, lang)}</span>
                  </div>

                  {saleCompleted ? (
                    <div className="p-2.5 bg-emerald-100 text-emerald-800 text-xs font-bold rounded-lg text-center flex items-center justify-center gap-1.5">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                      <span>{isBn ? 'বিক্রি সফল ও প্রিন্ট সম্পন্ন!' : 'Sale Completed & Printed!'}</span>
                    </div>
                  ) : (
                    <button
                      onClick={() => setSaleCompleted(true)}
                      disabled={cart.length === 0}
                      className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white rounded-lg text-xs font-bold shadow-xs flex items-center justify-center gap-1.5 transition-all"
                    >
                      <Printer className="w-4 h-4" />
                      <span>{isBn ? 'বিক্রি সম্পন্ন ও ক্যাশ মেমো প্রিন্ট' : 'Complete Sale & Print Memo'}</span>
                    </button>
                  )}
                </div>
              </div>

            </div>
          )}

          {/* VIEW 4: CUSTOMERS VIEW */}
          {activeTab === 'customers' && (
            <div className="bg-white p-4 rounded-xl border border-slate-200/60 space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-slate-100">
                <div>
                  <h5 className="text-sm font-bold text-slate-900">
                    {isBn ? 'কাস্টমার ও বাকির খাতা (Bakeya Due)' : 'Customer & Due Records'}
                  </h5>
                  <p className="text-xs text-slate-400">
                    {isBn ? 'কাস্টমারের ফোন নাম্বার ও বাকির হিসাব রাখুন' : 'Track customer purchase history and due payments'}
                  </p>
                </div>
                <button
                  onClick={() => alert(isBn ? 'কাস্টমার যোগ ইন্টারফেস' : 'Add Customer Modal')}
                  className="px-3 py-1.5 bg-emerald-600 text-white rounded-lg text-xs font-bold flex items-center gap-1.5 w-fit"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>{isBn ? 'নতুন কাস্টমার' : 'Add Customer'}</span>
                </button>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs min-w-[500px]">
                  <thead>
                    <tr className="border-b border-slate-200 text-slate-400 font-semibold">
                      <th className="py-2.5">{isBn ? 'কাস্টমারের নাম' : 'Customer Name'}</th>
                      <th className="py-2.5">{isBn ? 'ফোন নাম্বার' : 'Phone'}</th>
                      <th className="py-2.5">{isBn ? 'মোট ক্রয়' : 'Orders'}</th>
                      <th className="py-2.5">{isBn ? 'মোট ট্রানজেকশন' : 'Total Spent'}</th>
                      <th className="py-2.5">{isBn ? 'বাকির পরিমাণ' : 'Due Amount'}</th>
                      <th className="py-2.5">{isBn ? 'অ্যাকশন' : 'Action'}</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-slate-700 font-medium">
                    {customersList.map((cust) => (
                      <tr key={cust.id} className="hover:bg-slate-50">
                        <td className="py-3 font-bold text-slate-900">{cust.name}</td>
                        <td className="font-mono text-slate-500">{cust.phone}</td>
                        <td>{formatNum(cust.orders, lang)} {isBn ? 'টি' : 'orders'}</td>
                        <td className="font-bold">৳{formatNum(cust.spent, lang)}</td>
                        <td>
                          {cust.due > 0 ? (
                            <span className="px-2 py-0.5 rounded-full text-[10px] bg-rose-100 text-rose-800 font-bold">
                              {isBn ? `বকেয়া: ৳${formatNum(cust.due, lang)}` : `Due: ৳${cust.due}`}
                            </span>
                          ) : (
                            <span className="px-2 py-0.5 rounded-full text-[10px] bg-emerald-100 text-emerald-800 font-bold">
                              {isBn ? 'পরিশোধিত' : 'Clear (No Due)'}
                            </span>
                          )}
                        </td>
                        <td>
                          {cust.due > 0 ? (
                            <button
                              onClick={() => clearCustomerDue(cust.id)}
                              className="px-2 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded text-[10px] font-bold"
                            >
                              {isBn ? 'বাকি আদায়' : 'Clear Due'}
                            </button>
                          ) : (
                            <span className="text-[10px] text-slate-400 font-semibold">✓ Paid</span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* VIEW 5: EMPLOYEES VIEW */}
          {activeTab === 'employees' && (
            <div className="bg-white p-4 rounded-xl border border-slate-200/60 space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-slate-100">
                <div>
                  <h5 className="text-sm font-bold text-slate-900">
                    {isBn ? 'এমপ্লয়ি ও বেতনের তালিকা' : 'Employee & Salary Directory'}
                  </h5>
                  <p className="text-xs text-slate-400">
                    {isBn ? 'স্টাফদের উপস্থিতি ও মাসিক বেতনের হিসাব' : 'Manage employee payroll and attendance status'}
                  </p>
                </div>
                <button
                  onClick={() => alert(isBn ? 'কর্মচারী যোগ ইন্টারফেস' : 'Add Employee Modal')}
                  className="px-3 py-1.5 bg-emerald-600 text-white rounded-lg text-xs font-bold flex items-center gap-1.5 w-fit"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>{isBn ? 'নতুন কর্মচারী' : 'Add Employee'}</span>
                </button>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs min-w-[500px]">
                  <thead>
                    <tr className="border-b border-slate-200 text-slate-400 font-semibold">
                      <th className="py-2.5">{isBn ? 'কর্মচারীর নাম' : 'Employee Name'}</th>
                      <th className="py-2.5">{isBn ? 'পদবী' : 'Role'}</th>
                      <th className="py-2.5">{isBn ? 'মাসিক বেতন' : 'Monthly Salary'}</th>
                      <th className="py-2.5">{isBn ? 'আজকের উপস্থিতি' : 'Attendance'}</th>
                      <th className="py-2.5">{isBn ? 'অ্যাকশন' : 'Action'}</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-slate-700 font-medium">
                    {employeesList.map((emp) => (
                      <tr key={emp.id} className="hover:bg-slate-50">
                        <td className="py-3 font-bold text-slate-900">{emp.name}</td>
                        <td><span className="px-2 py-0.5 rounded bg-slate-100 text-slate-700 text-[10px]">{emp.role}</span></td>
                        <td className="font-bold">৳{formatNum(emp.salary, lang)}</td>
                        <td>
                          <span
                            className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                              emp.status === 'Present' || emp.status === 'উপস্থিত'
                                ? 'bg-emerald-100 text-emerald-800'
                                : 'bg-amber-100 text-amber-800'
                            }`}
                          >
                            {emp.status}
                          </span>
                        </td>
                        <td>
                          {emp.paid ? (
                            <span className="px-2 py-1 bg-emerald-100 text-emerald-800 rounded text-[10px] font-bold">
                              ✓ {isBn ? 'পরিশোধিত' : 'Paid'}
                            </span>
                          ) : (
                            <button
                              onClick={() => payEmployeeSalary(emp.id)}
                              className="px-2.5 py-1 bg-slate-900 hover:bg-emerald-600 text-white rounded text-[10px] font-bold transition-colors"
                            >
                              {isBn ? 'বেতন প্রদান' : 'Pay Salary'}
                            </button>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

        </div>

      </div>

      </div>
    </div>
  );
}
