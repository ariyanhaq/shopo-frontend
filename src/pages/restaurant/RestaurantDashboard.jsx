import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useLanguage } from '@/context/LanguageContext';
import { useShop } from '@/context/ShopContext';
import api from '@/services/api';
import toast from 'react-hot-toast';
import { Card, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Utensils, LayoutGrid, ShoppingCart, Flame, Calendar, Plus, RefreshCw,
  TrendingUp, Users, Clock, ArrowUpRight, ChefHat, Receipt, AlertCircle,
  Sparkles, CheckCircle2, ChevronRight, Layers, DollarSign, Phone
} from 'lucide-react';

export default function RestaurantDashboard() {
  const navigate = useNavigate();
  const { lang } = useLanguage();
  const { activeShop } = useShop();

  const [isLoading, setIsLoading] = useState(true);
  const [data, setData] = useState(null);

  const fetchDashboard = async () => {
    try {
      setIsLoading(true);
      const res = await api.restaurant.getDashboard();
      if (res?.success) {
        setData(res.data);
      }
    } catch (err) {
      console.error('Failed to load restaurant dashboard:', err);
      toast.error(err.message || 'Failed to load restaurant metrics');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboard();
  }, [activeShop]);

  const overview = data?.overview || {
    todaySales: 0,
    todayPaid: 0,
    todayGuests: 0,
    activeOrdersCount: 0,
    pendingKdsCount: 0,
    totalOrdersCount: 0,
    avgOrderValue: 0,
    dineInCount: 0,
    takeawayCount: 0,
    deliveryCount: 0,
  };

  const tables = data?.tables || {
    total: 0,
    occupied: 0,
    available: 0,
    reserved: 0,
    billed: 0,
    dirty: 0,
    occupancyRate: 0,
    list: [],
  };

  const topDishes = data?.topDishes || [];
  const reservations = data?.todayReservations || [];
  const recentOrders = data?.recentOrders || [];

  return (
    <div className="space-y-6 font-sans pb-16">
      
      {/* ---------------------------------------------------- */}
      {/* 1. HEADER & QUICK ACTION BAR                         */}
      {/* ---------------------------------------------------- */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Badge className="bg-orange-500/15 text-orange-600 dark:text-orange-400 border border-orange-500/30 text-xs font-semibold px-2.5 py-0.5">
              <Utensils className="w-3 h-3 mr-1" />
              {lang === 'bn' ? 'রেস্তোরাঁ কমান্ড সেন্টার' : 'Restaurant Command Center'}
            </Badge>
          </div>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white tracking-tight flex items-center gap-2">
            <span>{lang === 'bn' ? 'লাইভ রেস্তোরাঁ ড্যাশবোর্ড' : 'Live Restaurant Dashboard'}</span>
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-zinc-400 font-normal">
            {lang === 'bn'
              ? 'লাইভ টেবিল অকুপ্যান্সি, কিচেন কেওটি কিউ, দৈনিক বিক্রয় ও অতিথি ফ্লো।'
              : 'Real-time floor occupancy, kitchen orders queue, daily covers & revenue flow.'}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Refresh */}
          <button
            onClick={fetchDashboard}
            disabled={isLoading}
            className="h-9 w-9 rounded-xl border border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 hover:bg-slate-50 dark:hover:bg-zinc-800/80 text-slate-600 dark:text-zinc-400 transition-colors flex items-center justify-center cursor-pointer shadow-2xs"
            title="Refresh"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin text-emerald-500' : ''}`} />
          </button>

          {/* Floor Plan */}
          <button
            onClick={() => navigate('/restaurant/tables')}
            className="h-9 px-3.5 rounded-xl border border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 hover:bg-slate-50 dark:hover:bg-zinc-800/80 text-slate-700 dark:text-zinc-200 font-semibold text-xs transition-colors cursor-pointer flex items-center gap-1.5 shadow-2xs"
          >
            <LayoutGrid className="w-3.5 h-3.5 text-blue-500" />
            <span>{lang === 'bn' ? 'ফ্লোর প্ল্যান' : 'Floor Plan'}</span>
          </button>

          {/* Kitchen Screen (KDS) */}
          <button
            onClick={() => navigate('/restaurant/kds')}
            className="h-9 px-3.5 rounded-xl border border-orange-200/80 dark:border-orange-900/50 bg-orange-50/70 hover:bg-orange-100/80 dark:bg-orange-950/30 dark:hover:bg-orange-900/50 text-orange-600 dark:text-orange-400 font-semibold text-xs transition-colors cursor-pointer flex items-center gap-1.5 shadow-2xs"
          >
            <Flame className="w-3.5 h-3.5 text-orange-500" />
            <span>{lang === 'bn' ? 'কিচেন স্ক্রিন (KDS)' : 'Kitchen Screen (KDS)'}</span>
          </button>

          {/* Primary CTA: New Order POS */}
          <button
            onClick={() => navigate('/restaurant/pos')}
            className="h-9 px-4 rounded-xl bg-[#00df89] hover:bg-[#00c97b] text-[#011812] font-bold text-xs transition-all cursor-pointer flex items-center gap-1.5 shadow-xs active:scale-95"
          >
            <ShoppingCart className="w-3.5 h-3.5 stroke-[2.2]" />
            <span>{lang === 'bn' ? 'নতুন অর্ডার (POS)' : 'New Order (POS)'}</span>
          </button>
        </div>
      </div>

      {/* ---------------------------------------------------- */}
      {/* 2. TOP METRIC CARDS                                  */}
      {/* ---------------------------------------------------- */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5 sm:gap-4">
        
        {/* Today's Food Sales */}
        <Card className="p-4 sm:p-5 bg-white dark:bg-zinc-900 border-slate-200/80 dark:border-zinc-800 shadow-xs rounded-2xl">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 dark:text-zinc-400">
              {lang === 'bn' ? 'আজকের বিক্রয়' : "Today's Food Revenue"}
            </span>
            <div className="w-8 h-8 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
              <DollarSign className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2.5">
            {isLoading ? (
              <div className="space-y-1.5 py-0.5">
                <Skeleton className="h-7 w-28 rounded-lg" />
                <Skeleton className="h-3.5 w-20 rounded-md" />
              </div>
            ) : (
              <>
                <div className="text-xl sm:text-2xl font-bold font-mono text-slate-900 dark:text-white tracking-tight">
                  ৳ {overview.todaySales.toLocaleString()}
                </div>
                <div className="flex items-center gap-1.5 mt-1 text-[11px] text-slate-500 dark:text-zinc-400">
                  <span className="font-semibold text-emerald-600 dark:text-emerald-400">
                    {overview.totalOrdersCount} {lang === 'bn' ? 'টি অর্ডার' : 'orders'}
                  </span>
                  <span>• Avg ৳{overview.avgOrderValue}</span>
                </div>
              </>
            )}
          </div>
        </Card>

        {/* Live Table Occupancy */}
        <Card className="p-4 sm:p-5 bg-white dark:bg-zinc-900 border-slate-200/80 dark:border-zinc-800 shadow-xs rounded-2xl">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 dark:text-zinc-400">
              {lang === 'bn' ? 'লাইভ টেবিল অকুপ্যান্সি' : 'Table Occupancy'}
            </span>
            <div className="w-8 h-8 rounded-xl bg-blue-500/10 text-blue-600 dark:text-blue-400 flex items-center justify-center">
              <LayoutGrid className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2.5">
            {isLoading ? (
              <div className="space-y-1.5 py-0.5">
                <Skeleton className="h-7 w-24 rounded-lg" />
                <Skeleton className="h-3.5 w-32 rounded-md" />
              </div>
            ) : (
              <>
                <div className="text-xl sm:text-2xl font-bold font-mono text-slate-900 dark:text-white tracking-tight flex items-baseline gap-2">
                  <span>{tables.occupied} / {tables.total}</span>
                  <span className="text-xs font-semibold text-blue-600 dark:text-blue-400 font-sans">
                    ({tables.occupancyRate}%)
                  </span>
                </div>
                <div className="flex items-center gap-2 mt-1 text-[11px]">
                  <span className="text-emerald-600 dark:text-emerald-400 font-semibold">{tables.available} free</span>
                  <span className="text-amber-500 font-semibold">{tables.reserved} reserved</span>
                  {tables.dirty > 0 && <span className="text-rose-500 font-semibold">{tables.dirty} dirty</span>}
                </div>
              </>
            )}
          </div>
        </Card>

        {/* Live Active Kitchen Tickets */}
        <Card className="p-4 sm:p-5 bg-white dark:bg-zinc-900 border-slate-200/80 dark:border-zinc-800 shadow-xs rounded-2xl">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 dark:text-zinc-400">
              {lang === 'bn' ? 'রান্নাঘরের লাইভ টিকিট' : 'Active Kitchen Tickets'}
            </span>
            <div className="w-8 h-8 rounded-xl bg-orange-500/10 text-orange-600 dark:text-orange-400 flex items-center justify-center">
              <Flame className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2.5">
            {isLoading ? (
              <div className="space-y-1.5 py-0.5">
                <Skeleton className="h-7 w-20 rounded-lg" />
                <Skeleton className="h-3.5 w-28 rounded-md" />
              </div>
            ) : (
              <>
                <div className="text-xl sm:text-2xl font-bold font-mono text-slate-900 dark:text-white tracking-tight flex items-baseline gap-2">
                  <span>{overview.activeOrdersCount}</span>
                  <span className="text-xs text-orange-600 dark:text-orange-400 font-semibold font-sans">
                    {overview.pendingKdsCount} {lang === 'bn' ? 'টি রান্না হচ্ছে' : 'items cooking'}
                  </span>
                </div>
                <div className="flex items-center gap-1.5 mt-1 text-[11px] text-slate-500 dark:text-zinc-400">
                  <Clock className="w-3.5 h-3.5 text-orange-500" />
                  <span>{lang === 'bn' ? 'গড় তৈরি সময়: ~১২ মিনিট' : 'Avg prep time: ~12m'}</span>
                </div>
              </>
            )}
          </div>
        </Card>

        {/* Guests & Covers Served */}
        <Card className="p-4 sm:p-5 bg-white dark:bg-zinc-900 border-slate-200/80 dark:border-zinc-800 shadow-xs rounded-2xl">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 dark:text-zinc-400">
              {lang === 'bn' ? 'আজকের অতিথি' : "Today's Guests & Covers"}
            </span>
            <div className="w-8 h-8 rounded-xl bg-purple-500/10 text-purple-600 dark:text-purple-400 flex items-center justify-center">
              <Users className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2.5">
            {isLoading ? (
              <div className="space-y-1.5 py-0.5">
                <Skeleton className="h-7 w-24 rounded-lg" />
                <Skeleton className="h-3.5 w-32 rounded-md" />
              </div>
            ) : (
              <>
                <div className="text-xl sm:text-2xl font-bold font-mono text-slate-900 dark:text-white tracking-tight">
                  {overview.todayGuests} {lang === 'bn' ? 'জন' : 'Guests'}
                </div>
                <div className="flex items-center gap-2 mt-1 text-[11px] text-slate-500 dark:text-zinc-400">
                  <span>🍽️ {overview.dineInCount} {lang === 'bn' ? 'ডাইন-ইন' : 'Dine-in'}</span>
                  <span>📦 {overview.takeawayCount} {lang === 'bn' ? 'পার্সেল' : 'Parcel'}</span>
                </div>
              </>
            )}
          </div>
        </Card>

      </div>

      {/* ---------------------------------------------------- */}
      {/* 3. LIVE FLOOR PLAN GLANCE & REAL-TIME KDS SNIPPET     */}
      {/* ---------------------------------------------------- */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        
        {/* Left 2 Cols: Floor Tables Quick Glance */}
        <Card className="lg:col-span-2 p-5 bg-white dark:bg-zinc-900 border-slate-200/80 dark:border-zinc-800 shadow-xs rounded-2xl">
          <div className="flex items-center justify-between mb-4">
            <CardTitle className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <LayoutGrid className="w-4 h-4 text-orange-500" />
              <span>{lang === 'bn' ? 'ফ্লোর টেবিল লেআউট' : 'Floor Plan Overview (Live Status)'}</span>
            </CardTitle>
            <button
              onClick={() => navigate('/restaurant/tables')}
              className="text-xs font-semibold text-orange-600 dark:text-orange-400 hover:underline flex items-center gap-1 cursor-pointer"
            >
              <span>{lang === 'bn' ? 'সম্পূর্ণ ফ্লোর দেখুন' : 'View Full Floor'}</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>

          {isLoading ? (
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
                <div key={i} className="p-3.5 rounded-xl border border-slate-100 dark:border-zinc-800 space-y-2 bg-slate-50/50 dark:bg-zinc-800/30">
                  <div className="flex justify-between">
                    <Skeleton className="h-4 w-10 rounded" />
                    <Skeleton className="h-3 w-12 rounded" />
                  </div>
                  <Skeleton className="h-5 w-full rounded" />
                  <Skeleton className="h-3 w-16 rounded" />
                </div>
              ))}
            </div>
          ) : tables.list.length === 0 ? (
            <div className="text-center py-10 text-slate-400 text-xs">
              {lang === 'bn' ? 'কোনো টেবিল সেটআপ করা নেই।' : 'No tables configured yet.'}
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {tables.list.slice(0, 8).map((tbl) => {
                const isOccupied = tbl.status === 'occupied';
                const isReserved = tbl.status === 'reserved';
                const isDirty = tbl.status === 'dirty';
                const isAvailable = tbl.status === 'available';

                return (
                  <div
                    key={tbl._id}
                    onClick={() => navigate('/restaurant/tables')}
                    className={`p-3.5 rounded-xl border transition-all cursor-pointer ${
                      isOccupied
                        ? 'bg-rose-500/10 border-rose-500/30 text-rose-900 dark:text-rose-200 hover:bg-rose-500/15'
                        : isReserved
                        ? 'bg-amber-500/10 border-amber-500/30 text-amber-900 dark:text-amber-200 hover:bg-amber-500/15'
                        : isDirty
                        ? 'bg-slate-100 dark:bg-zinc-800 border-slate-300 dark:border-zinc-700 text-slate-600 dark:text-zinc-400'
                        : 'bg-emerald-500/10 border-emerald-500/30 text-emerald-900 dark:text-emerald-200 hover:bg-emerald-500/15'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-black text-sm">{tbl.table_number}</span>
                      <span className="text-[10px] uppercase font-bold tracking-wider opacity-80">
                        {tbl.zone}
                      </span>
                    </div>

                    <div className="mt-2 text-xs font-semibold flex items-center justify-between">
                      <span>👥 {tbl.capacity} {lang === 'bn' ? 'আসন' : 'Seats'}</span>
                      <Badge
                        className={`text-[9px] px-1.5 py-0 capitalize ${
                          isOccupied
                            ? 'bg-rose-500 text-white'
                            : isReserved
                            ? 'bg-amber-500 text-white'
                            : isDirty
                            ? 'bg-slate-400 text-white'
                            : 'bg-emerald-500 text-white'
                        }`}
                      >
                        {tbl.status}
                      </Badge>
                    </div>

                    {isOccupied && tbl.waiter_name && (
                      <div className="text-[10px] text-slate-500 dark:text-zinc-400 mt-1 truncate">
                        👤 {tbl.waiter_name}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </Card>

        {/* Right Col: Top Selling Dishes & Best Sellers */}
        <Card className="p-5 bg-white dark:bg-zinc-900 border-slate-200/80 dark:border-zinc-800 shadow-xs rounded-2xl">
          <div className="flex items-center justify-between mb-4">
            <CardTitle className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <ChefHat className="w-4 h-4 text-emerald-500" />
              <span>{lang === 'bn' ? 'জনপ্রিয় খাবার' : 'Top Selling Dishes'}</span>
            </CardTitle>
            <button
              onClick={() => navigate('/restaurant/menu')}
              className="text-xs font-semibold text-emerald-600 dark:text-emerald-400 hover:underline flex items-center gap-1 cursor-pointer"
            >
              <span>{lang === 'bn' ? 'মেনু দেখুন' : 'Full Menu'}</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="space-y-3">
            {isLoading ? (
              <div className="space-y-2">
                {[1, 2, 3, 4].map((i) => (
                  <div key={i} className="flex items-center justify-between p-2.5 rounded-xl border border-slate-100 dark:border-zinc-800 bg-slate-50/50 dark:bg-zinc-800/30">
                    <div className="flex items-center gap-2">
                      <Skeleton className="w-5 h-5 rounded-full" />
                      <div className="space-y-1">
                        <Skeleton className="h-3.5 w-24 rounded" />
                        <Skeleton className="h-2.5 w-16 rounded" />
                      </div>
                    </div>
                    <div className="space-y-1 text-right">
                      <Skeleton className="h-3.5 w-12 rounded ml-auto" />
                      <Skeleton className="h-2.5 w-10 rounded ml-auto" />
                    </div>
                  </div>
                ))}
              </div>
            ) : topDishes.length === 0 ? (
              <div className="text-center py-8 text-xs text-slate-400">
                {lang === 'bn' ? 'অর্ডার শুরু হলে বেস্ট সেলার খাবার দেখা যাবে।' : 'Sales data will populate as orders flow in.'}
              </div>
            ) : (
              topDishes.map((dish, idx) => (
                <div
                  key={idx}
                  className="flex items-center justify-between p-2.5 rounded-xl bg-slate-50 dark:bg-zinc-800/50 border border-slate-100 dark:border-zinc-800"
                >
                  <div className="flex items-center gap-2.5">
                    <span className="w-5 h-5 rounded-full bg-orange-500/15 text-orange-600 dark:text-orange-400 font-bold text-[10px] flex items-center justify-center shrink-0">
                      #{idx + 1}
                    </span>
                    <div>
                      <div className="text-xs font-bold text-slate-900 dark:text-white line-clamp-1">
                        {dish._id}
                      </div>
                      <div className="text-[10px] text-slate-500 dark:text-zinc-400">
                        {dish.category || (lang === 'bn' ? 'খাবার আইটেম' : 'Food Item')}
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-xs font-bold font-mono text-slate-900 dark:text-white">
                      ৳ {dish.totalRevenue?.toLocaleString()}
                    </div>
                    <div className="text-[10px] text-emerald-600 dark:text-emerald-400 font-semibold">
                      {dish.quantity} {lang === 'bn' ? 'বিক্রিত' : 'sold'}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </Card>

      </div>

      {/* ---------------------------------------------------- */}
      {/* 4. TODAY'S RESERVATIONS & RECENT ORDERS TABLE        */}
      {/* ---------------------------------------------------- */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        
        {/* Today's Reservations */}
        <Card className="p-5 bg-white dark:bg-zinc-900 border-slate-200/80 dark:border-zinc-800 shadow-xs rounded-2xl flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <CardTitle className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-purple-500/10 border border-purple-500/20 text-purple-600 dark:text-purple-400 flex items-center justify-center">
                  <Calendar className="w-4 h-4" />
                </div>
                <div className="flex items-center gap-2">
                  <span>{lang === 'bn' ? 'আজকের টেবিল বুকিং' : "Today's Table Bookings"}</span>
                  {reservations.length > 0 && (
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-purple-100 dark:bg-purple-950/60 text-purple-700 dark:text-purple-300 border border-purple-200 dark:border-purple-800">
                      {reservations.length}
                    </span>
                  )}
                </div>
              </CardTitle>
              <button
                onClick={() => navigate('/restaurant/reservations')}
                className="text-xs font-bold text-purple-600 dark:text-purple-400 hover:text-purple-700 dark:hover:text-purple-300 flex items-center gap-1 cursor-pointer transition-colors group"
              >
                <span>{lang === 'bn' ? 'সকল বুকিং' : 'All Bookings'}</span>
                <ChevronRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
              </button>
            </div>

            <div className="space-y-2.5">
              {isLoading ? (
                <div className="space-y-2">
                  {[1, 2, 3].map((i) => (
                    <div key={i} className="flex items-center justify-between p-3 rounded-xl border border-slate-100 dark:border-zinc-800 bg-slate-50/50 dark:bg-zinc-800/30">
                      <div className="flex items-center gap-3">
                        <Skeleton className="w-9 h-9 rounded-xl" />
                        <div className="space-y-1">
                          <Skeleton className="h-3.5 w-24 rounded" />
                          <Skeleton className="h-2.5 w-36 rounded" />
                        </div>
                      </div>
                      <Skeleton className="h-5 w-16 rounded-full" />
                    </div>
                  ))}
                </div>
              ) : reservations.length === 0 ? (
                <div className="text-center py-8 text-xs text-slate-400 dark:text-zinc-500 flex flex-col items-center justify-center gap-2">
                  <div className="w-12 h-12 rounded-2xl bg-purple-500/10 text-purple-600 flex items-center justify-center">
                    <Calendar className="w-6 h-6" />
                  </div>
                  <span className="font-semibold">{lang === 'bn' ? 'আজকের জন্য কোনো বুকিং নেই।' : 'No reservations booked for today.'}</span>
                  <button
                    onClick={() => navigate('/restaurant/reservations')}
                    className="mt-1 px-3 py-1.5 rounded-xl bg-purple-600 hover:bg-purple-700 text-white font-bold text-[11px] flex items-center gap-1.5 transition-colors cursor-pointer shadow-2xs"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>{lang === 'bn' ? 'বুকিং যোগ করুন' : 'Add Booking'}</span>
                  </button>
                </div>
              ) : (
                reservations.map((res) => {
                  const isConfirmed = res.status === 'confirmed';
                  const isSeated = res.status === 'seated';
                  const isCompleted = res.status === 'completed';
                  const formattedTable = res.table_number
                    ? res.table_number.toLowerCase().startsWith('t-')
                      ? res.table_number
                      : `Table ${res.table_number}`
                    : null;

                  return (
                    <div
                      key={res._id}
                      onClick={() => navigate('/restaurant/reservations')}
                      className="flex items-center justify-between p-3.5 rounded-2xl bg-slate-50/70 hover:bg-white dark:bg-zinc-850/40 dark:hover:bg-zinc-800/80 border border-slate-200/80 hover:border-purple-300 dark:border-zinc-800 dark:hover:border-purple-800/60 shadow-2xs hover:shadow-md transition-all duration-200 cursor-pointer group gap-3"
                    >
                      <div className="flex items-center gap-3 min-w-0 flex-1">
                        {/* Time slot pill */}
                        <div className="h-10 px-2.5 rounded-xl bg-purple-500/10 border border-purple-500/20 text-purple-600 dark:text-purple-400 flex flex-col items-center justify-center font-bold text-[11px] font-mono shrink-0 group-hover:scale-105 transition-transform">
                          <Clock className="w-3 h-3 text-purple-500 mb-0.5" />
                          <span>{res.time_slot}</span>
                        </div>

                        {/* Guest details */}
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="font-bold text-xs sm:text-sm text-slate-900 dark:text-white group-hover:text-purple-600 dark:group-hover:text-purple-400 transition-colors truncate">
                              {res.guest_name}
                            </span>
                            {formattedTable && (
                              <span className="text-[10px] font-bold text-orange-600 dark:text-orange-400 bg-orange-500/10 border border-orange-500/20 px-1.5 py-0.2 rounded-md shrink-0 flex items-center gap-1">
                                <Utensils className="w-2.5 h-2.5" />
                                <span>{formattedTable}</span>
                              </span>
                            )}
                            {res.occasion && res.occasion !== 'general' && (
                              <span className="text-[10px] font-semibold text-purple-600 dark:text-purple-400 bg-purple-500/10 border border-purple-500/20 px-1.5 py-0.2 rounded-md capitalize shrink-0 flex items-center gap-0.5">
                                <Sparkles className="w-2.5 h-2.5" />
                                <span>{res.occasion.replace('_', ' ')}</span>
                              </span>
                            )}
                          </div>

                          <div className="text-[11px] text-slate-500 dark:text-zinc-400 flex items-center gap-2 mt-1 flex-wrap">
                            <span className="flex items-center gap-1 font-mono">
                              <Phone className="w-3 h-3 text-slate-400 shrink-0" />
                              <span>{res.phone}</span>
                            </span>
                            <span className="text-slate-300 dark:text-zinc-700">•</span>
                            <span className="flex items-center gap-1">
                              <Users className="w-3 h-3 text-slate-400 shrink-0" />
                              <span className="font-semibold text-slate-700 dark:text-zinc-300 font-mono">{res.guest_count}</span>
                              <span>{lang === 'bn' ? 'অতিথি' : (res.guest_count > 1 ? 'Guests' : 'Guest')}</span>
                            </span>
                            {res.preorder_items && res.preorder_items.length > 0 && (
                              <>
                                <span className="text-slate-300 dark:text-zinc-700">•</span>
                                <span className="flex items-center gap-1 text-[10px] font-semibold text-emerald-600 dark:text-[#00df89] bg-emerald-500/10 px-1.5 py-0.2 rounded-md border border-emerald-500/20">
                                  <ChefHat className="w-2.5 h-2.5" />
                                  <span>{res.preorder_items.length} pre-ordered</span>
                                </span>
                              </>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Status Badge & Arrow */}
                      <div className="flex items-center gap-2 shrink-0">
                        <Badge
                          className={`capitalize text-[10px] font-semibold px-2 py-0.5 rounded-lg flex items-center gap-1 shrink-0 ${
                            isConfirmed
                              ? 'bg-amber-500/15 text-amber-700 dark:text-amber-300 border-amber-500/30'
                              : isSeated
                              ? 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border-emerald-500/30'
                              : isCompleted
                              ? 'bg-blue-500/15 text-blue-700 dark:text-blue-300 border-blue-500/30'
                              : 'bg-slate-100 dark:bg-zinc-800 text-slate-600 dark:text-zinc-400'
                          }`}
                        >
                          <span
                            className={`w-1.5 h-1.5 rounded-full shrink-0 ${
                              isConfirmed
                                ? 'bg-amber-500'
                                : isSeated
                                ? 'bg-emerald-500'
                                : isCompleted
                                ? 'bg-blue-500'
                                : 'bg-slate-400'
                            }`}
                          />
                          <span>{res.status}</span>
                        </Badge>
                        <ChevronRight className="w-4 h-4 text-slate-300 dark:text-zinc-700 group-hover:text-purple-500 group-hover:translate-x-0.5 transition-all" />
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </Card>

        {/* Recent Restaurant Invoices */}
        <Card className="p-5 bg-white dark:bg-zinc-900 border-slate-200/80 dark:border-zinc-800 shadow-xs rounded-2xl">
          <div className="flex items-center justify-between mb-4">
            <CardTitle className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <Receipt className="w-4 h-4 text-blue-500" />
              <span>{lang === 'bn' ? 'সাম্প্রতিক রেস্তোরাঁ অর্ডার ও চালান' : 'Recent Restaurant Orders'}</span>
            </CardTitle>
            <button
              onClick={() => navigate('/restaurant/orders')}
              className="text-xs font-semibold text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1 cursor-pointer"
            >
              <span>{lang === 'bn' ? 'সকল অর্ডার' : 'All Orders'}</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="space-y-2.5">
            {isLoading ? (
              <div className="space-y-2">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="flex items-center justify-between p-3 rounded-xl border border-slate-100 dark:border-zinc-800 bg-slate-50/50 dark:bg-zinc-800/30">
                    <div className="space-y-1">
                      <Skeleton className="h-3.5 w-32 rounded" />
                      <Skeleton className="h-2.5 w-24 rounded" />
                    </div>
                    <div className="space-y-1 text-right">
                      <Skeleton className="h-3.5 w-16 rounded ml-auto" />
                      <Skeleton className="h-2.5 w-10 rounded ml-auto" />
                    </div>
                  </div>
                ))}
              </div>
            ) : recentOrders.length === 0 ? (
              <div className="text-center py-6 text-xs text-slate-400">
                {lang === 'bn' ? 'কোনো অর্ডার ইতিহাস পাওয়া যায়নি।' : 'No recent orders yet.'}
              </div>
            ) : (
              recentOrders.map((ord) => (
                <div
                  key={ord._id}
                  className="flex items-center justify-between p-3 rounded-xl bg-slate-50 dark:bg-zinc-800/40 border border-slate-200/80 dark:border-zinc-800"
                >
                  <div>
                    <div className="text-xs font-bold text-slate-900 dark:text-white flex items-center gap-2">
                      <span>#{ord.order_number}</span>
                      <span className="text-[10px] uppercase px-1.5 py-0.5 rounded-md bg-slate-200 dark:bg-zinc-700 text-slate-700 dark:text-zinc-300 font-semibold">
                        {ord.order_type.replace('_', ' ')}
                      </span>
                      {ord.table_number && (
                        <span className="text-[10px] text-orange-600 dark:text-orange-400 font-semibold">
                          Table {ord.table_number}
                        </span>
                      )}
                    </div>
                    <div className="text-[10px] text-slate-500 dark:text-zinc-400 mt-0.5">
                      {ord.customer_name} • {ord.items?.length || 0} items
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-xs font-bold font-mono text-slate-900 dark:text-white">
                      ৳ {ord.total_amount?.toLocaleString()}
                    </div>
                    <span
                      className={`text-[9px] font-semibold uppercase ${
                        ord.status === 'completed'
                          ? 'text-emerald-600 dark:text-emerald-400'
                          : ord.status === 'cooking'
                          ? 'text-amber-500'
                          : 'text-blue-500'
                      }`}
                    >
                      {ord.status}
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>
        </Card>

      </div>

    </div>
  );
}
