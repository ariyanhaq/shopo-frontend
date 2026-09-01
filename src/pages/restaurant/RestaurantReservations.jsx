import { useState, useEffect } from 'react';
import { useLanguage } from '@/context/LanguageContext';
import { useShop } from '@/context/ShopContext';
import api from '@/services/api';
import toast from 'react-hot-toast';
import { Card, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/components/ui/select';
import { DatePicker } from '@/components/ui/calendar';
import ConfirmDialog from '@/components/common/ConfirmDialog';
import {
  Calendar, Plus, Search, RefreshCw, CheckCircle2, Clock,
  Users, Trash2, Edit3, X, Sparkles, UserCheck, Utensils, Loader2, Phone,
  ChefHat, Minus, ShoppingBag
} from 'lucide-react';

const TIME_SLOTS = [
  { value: '12:00', label: '12:00 PM' },
  { value: '12:30', label: '12:30 PM' },
  { value: '13:00', label: '01:00 PM' },
  { value: '13:30', label: '01:30 PM' },
  { value: '14:00', label: '02:00 PM' },
  { value: '14:30', label: '02:30 PM' },
  { value: '15:00', label: '03:00 PM' },
  { value: '18:00', label: '06:00 PM' },
  { value: '18:30', label: '06:30 PM' },
  { value: '19:00', label: '07:00 PM' },
  { value: '19:30', label: '07:30 PM' },
  { value: '20:00', label: '08:00 PM' },
  { value: '20:30', label: '08:30 PM' },
  { value: '21:00', label: '09:00 PM' },
  { value: '21:30', label: '09:30 PM' },
  { value: '22:00', label: '10:00 PM' },
  { value: '22:30', label: '10:30 PM' },
  { value: '23:00', label: '11:00 PM' },
];

export default function RestaurantReservations() {
  const { lang } = useLanguage();
  const { activeShop } = useShop();

  const [reservations, setReservations] = useState([]);
  const [tables, setTables] = useState([]);
  const [menuItems, setMenuItems] = useState([]);
  const [selectedStatus, setSelectedStatus] = useState('all');
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [isLoading, setIsLoading] = useState(true);
  const [updatingId, setUpdatingId] = useState(null);

  // Deleting State (Confirm Dialog)
  const [deletingReservation, setDeletingReservation] = useState(null);
  const [isDeletingReservation, setIsDeletingReservation] = useState(false);

  // Modals
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isSavingReservation, setIsSavingReservation] = useState(false);
  const [selectedDishToAdd, setSelectedDishToAdd] = useState('');

  // Form State
  const initialForm = {
    guest_name: '',
    phone: '',
    email: '',
    table_id: '',
    table_number: '',
    guest_count: 2,
    reservation_date: new Date().toISOString().split('T')[0],
    time_slot: '19:30',
    occasion: 'general',
    order_preference: 'decide_later', // 'decide_later' | 'preorder'
    preorder_items: [],
    special_requests: '',
  };
  const [form, setForm] = useState(initialForm);

  const loadData = async () => {
    setIsLoading(true);
    try {
      const [resData, tableData, menuData] = await Promise.all([
        api.restaurant.reservations.list({ date: selectedDate, status: selectedStatus !== 'all' ? selectedStatus : undefined }),
        api.restaurant.tables.list(),
        api.restaurant.menu.list().catch(() => ({ success: false, data: [] }))
      ]);
      if (resData?.success) setReservations(resData.data || []);
      if (tableData?.success) setTables(tableData.data || []);
      if (menuData?.success) setMenuItems(menuData.data || []);
    } catch (err) {
      console.error('Failed to load reservations:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [activeShop, selectedDate, selectedStatus]);

  const handleAddDishToPreorder = (dishId) => {
    if (!dishId) return;
    const dish = menuItems.find((m) => m._id === dishId);
    if (!dish) return;

    setForm((prev) => {
      const existing = prev.preorder_items.find((it) => it.dish_id === dish._id);
      if (existing) {
        return {
          ...prev,
          preorder_items: prev.preorder_items.map((it) =>
            it.dish_id === dish._id
              ? { ...it, quantity: it.quantity + 1, subtotal: (it.quantity + 1) * it.price }
              : it
          ),
        };
      }
      return {
        ...prev,
        preorder_items: [
          ...prev.preorder_items,
          {
            dish_id: dish._id,
            name: dish.name,
            category: dish.category || 'General',
            price: Number(dish.price) || 0,
            quantity: 1,
            subtotal: Number(dish.price) || 0,
            kitchen_station: dish.kitchen_station || 'main_kitchen',
            notes: '',
          },
        ],
      };
    });
    setSelectedDishToAdd('');
  };

  const handleUpdateDishQty = (dishId, delta) => {
    setForm((prev) => {
      const updated = prev.preorder_items
        .map((it) => {
          if (it.dish_id === dishId) {
            const newQty = it.quantity + delta;
            return newQty > 0 ? { ...it, quantity: newQty, subtotal: newQty * it.price } : null;
          }
          return it;
        })
        .filter(Boolean);
      return { ...prev, preorder_items: updated };
    });
  };

  const handleRemovePreorderDish = (dishId) => {
    setForm((prev) => ({
      ...prev,
      preorder_items: prev.preorder_items.filter((it) => it.dish_id !== dishId),
    }));
  };

  const preorderTotal = form.preorder_items.reduce((sum, it) => sum + (it.price * it.quantity), 0);

  const handleCreateReservation = async (e) => {
    e.preventDefault();
    if (!form.guest_name || !form.phone) {
      toast.error('Guest name & phone are required');
      return;
    }

    setIsSavingReservation(true);
    try {
      const payload = {
        ...form,
        order_preference: form.order_preference,
        preorder_items: form.order_preference === 'preorder' ? form.preorder_items : [],
        preorder_total: form.order_preference === 'preorder' ? preorderTotal : 0,
      };
      await api.restaurant.reservations.create(payload);
      toast.success('Reservation booked!');
      setIsAddModalOpen(false);
      setForm(initialForm);
      loadData();
    } catch (err) {
      toast.error(err.message || 'Failed to book reservation');
    } finally {
      setIsSavingReservation(false);
    }
  };
  const handleCreate = handleCreateReservation;

  const handleUpdateStatus = async (id, status) => {
    setUpdatingId(id);
    try {
      await api.restaurant.reservations.update(id, { status });
      toast.success(`Reservation marked as ${status}!`);
      await loadData();
    } catch (err) {
      toast.error(err.message || 'Failed to update status');
    } finally {
      setUpdatingId(null);
    }
  };

  const handleDelete = (res) => {
    setDeletingReservation(res);
  };

  const confirmDeleteReservation = async () => {
    if (!deletingReservation?._id) return;
    setIsDeletingReservation(true);
    try {
      await api.restaurant.reservations.delete(deletingReservation._id);
      toast.success(lang === 'bn' ? 'রিজার্ভেশন মুছে ফেলা হয়েছে' : 'Reservation deleted');
      setDeletingReservation(null);
      await loadData();
    } catch (err) {
      toast.error(err.message || 'Failed to delete');
    } finally {
      setIsDeletingReservation(false);
    }
  };

  return (
    <div className="space-y-6 font-sans pb-16">
      
      {/* HEADER */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white tracking-tight flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-purple-500/10 text-purple-600 flex items-center justify-center">
              <Calendar className="w-4 h-4" />
            </div>
            <span>{lang === 'bn' ? 'টেবিল বুকিং ও রিজার্ভেশন বুক' : 'Table Bookings & Guest Reservations'}</span>
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-zinc-400 font-normal mt-0.5">
            {lang === 'bn'
              ? 'অতিথিদের অগ্রিম টেবিল বুকিং, বিশেষ রিকোয়েস্ট এবং সিটেড চেক-ইন পরিচালনা করুন।'
              : 'Manage advance table reservations, party sizes, special occasions & guest check-ins.'}
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={loadData}
            className="p-2.5 rounded-xl border border-slate-200 dark:border-zinc-800 hover:bg-slate-100 text-slate-700 dark:text-zinc-300 transition-all cursor-pointer"
          >
            <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
          </button>

          <button
            onClick={() => setIsAddModalOpen(true)}
            className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-[#00df89] hover:bg-[#00c578] text-slate-950 font-bold text-xs shadow-xs transition-all cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>{lang === 'bn' ? 'নতুন বুকিং করুন' : 'Book Table'}</span>
          </button>
        </div>
      </div>

      {/* FILTER BAR: DATE & STATUS */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 border-b border-slate-200 dark:border-zinc-800 pb-3">
        <div className="flex items-center gap-2 w-full sm:w-auto">
          <DatePicker
            value={selectedDate}
            onChange={setSelectedDate}
            align="left"
            className="h-9 w-40"
          />

          <button
            onClick={() => setSelectedDate(new Date().toISOString().split('T')[0])}
            className="px-3 py-1.5 rounded-xl border border-slate-200 dark:border-zinc-800 text-xs font-semibold hover:bg-slate-50 dark:hover:bg-zinc-800 cursor-pointer"
          >
            Today
          </button>
        </div>

        <div className="flex items-center gap-1.5 overflow-x-auto w-full sm:w-auto pb-1 scrollbar-none">
          {['all', 'confirmed', 'seated', 'completed', 'cancelled'].map((st) => (
            <button
              key={st}
              onClick={() => setSelectedStatus(st)}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold capitalize whitespace-nowrap transition-all cursor-pointer ${
                selectedStatus === st
                  ? 'bg-slate-900 text-white dark:bg-white dark:text-slate-900 shadow-xs'
                  : 'bg-slate-100 dark:bg-zinc-800 text-slate-600 dark:text-zinc-400 hover:bg-slate-200'
              }`}
            >
              {st}
            </button>
          ))}
        </div>
      </div>

      {/* RESERVATIONS LIST */}
      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div key={i} className="p-4 rounded-2xl border border-slate-200/80 dark:border-zinc-800 bg-white dark:bg-zinc-900 space-y-3 shadow-2xs">
              <div className="flex justify-between items-center">
                <div className="flex items-center gap-2">
                  <Skeleton className="w-9 h-9 rounded-xl" />
                  <div className="space-y-1">
                    <Skeleton className="h-4 w-24 rounded" />
                    <Skeleton className="h-3 w-16 rounded" />
                  </div>
                </div>
                <Skeleton className="h-5 w-14 rounded-full" />
              </div>
              <div className="space-y-2 p-2.5 rounded-xl border border-slate-100 dark:border-zinc-800 bg-slate-50/50 dark:bg-zinc-800/20">
                <div className="flex justify-between"><Skeleton className="h-3.5 w-16 rounded" /><Skeleton className="h-3.5 w-20 rounded" /></div>
                <div className="flex justify-between"><Skeleton className="h-3.5 w-14 rounded" /><Skeleton className="h-3.5 w-16 rounded" /></div>
              </div>
            </div>
          ))}
        </div>
      ) : reservations.length === 0 ? (
        <div className="text-center py-20 bg-white dark:bg-zinc-900 rounded-2xl border border-dashed border-slate-200 dark:border-zinc-800 p-8">
          <Calendar className="w-10 h-10 mx-auto text-slate-300 dark:text-zinc-600 mb-2" />
          <div className="text-sm font-bold text-slate-900 dark:text-white">
            No Reservations for this Date
          </div>
          <p className="text-xs text-slate-500 mt-1">Click "Book Table" to create a new reservation.</p>
          <button
            onClick={() => setIsAddModalOpen(true)}
            className="mt-4 px-4 py-2 rounded-xl bg-[#00df89] text-slate-950 font-bold text-xs cursor-pointer inline-flex items-center gap-1.5"
          >
            <Plus className="w-4 h-4" />
            <span>Book New Table</span>
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {reservations.map((res) => {
            const isConfirmed = res.status === 'confirmed';
            const isSeated = res.status === 'seated';
            const isCompleted = res.status === 'completed';
            const isCancelled = res.status === 'cancelled';
            const isUpdating = updatingId === res._id;

            return (
              <Card
                key={res._id}
                className="p-4.5 bg-white dark:bg-zinc-900 border-slate-200/90 dark:border-zinc-800 shadow-2xs hover:shadow-md transition-all rounded-2xl flex flex-col justify-between"
              >
                <div className="space-y-3.5">
                  {/* Top: Time badge + Guest name + Status */}
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-2.5">
                      <div className="h-10 px-2.5 rounded-xl bg-purple-500/10 border border-purple-500/20 text-purple-600 dark:text-purple-400 flex flex-col items-center justify-center font-bold text-xs font-mono shrink-0">
                        <Clock className="w-3 h-3 text-purple-500 mb-0.5" />
                        <span>{res.time_slot}</span>
                      </div>
                      <div className="min-w-0">
                        <div className="font-bold text-sm text-slate-900 dark:text-white truncate">
                          {res.guest_name}
                        </div>
                        <div className="text-[11px] text-slate-500 dark:text-zinc-400 flex items-center gap-1 mt-0.5 font-mono">
                          <Phone className="w-3 h-3 text-slate-400 shrink-0" />
                          <span>{res.phone}</span>
                        </div>
                      </div>
                    </div>

                    <Badge
                      className={`capitalize text-[10px] font-semibold px-2 py-0.5 rounded-lg flex items-center gap-1 shrink-0 ${
                        isConfirmed
                          ? 'bg-amber-500/15 text-amber-700 dark:text-amber-300 border-amber-500/30'
                          : isSeated
                          ? 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border-emerald-500/30'
                          : isCompleted
                          ? 'bg-blue-500/15 text-blue-700 dark:text-blue-300 border-blue-500/30'
                          : 'bg-slate-100 dark:bg-zinc-800 text-slate-600 dark:text-zinc-400 border-slate-200 dark:border-zinc-700'
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
                  </div>

                  {/* Details Container */}
                  <div className="p-3 bg-slate-50/80 dark:bg-zinc-800/40 rounded-xl border border-slate-100 dark:border-zinc-800 space-y-2 text-xs">
                    <div className="flex items-center justify-between text-slate-600 dark:text-zinc-400">
                      <span className="flex items-center gap-1.5 text-slate-500 dark:text-zinc-400">
                        <Users className="w-3.5 h-3.5 text-slate-400" />
                        <span>Guests:</span>
                      </span>
                      <span className="font-bold font-mono text-slate-900 dark:text-white">
                        {res.guest_count} {res.guest_count > 1 ? 'persons' : 'person'}
                      </span>
                    </div>

                    {res.table_number && (
                      <div className="flex items-center justify-between text-slate-600 dark:text-zinc-400">
                        <span className="flex items-center gap-1.5 text-slate-500 dark:text-zinc-400">
                          <Utensils className="w-3.5 h-3.5 text-orange-500" />
                          <span>Table:</span>
                        </span>
                        <span className="font-bold text-orange-600 dark:text-orange-400 bg-orange-500/10 px-2 py-0.5 rounded-md border border-orange-500/20">
                          Table {res.table_number}
                        </span>
                      </div>
                    )}

                    {res.occasion && res.occasion !== 'general' && (
                      <div className="flex items-center justify-between">
                        <span className="flex items-center gap-1.5 text-purple-600 dark:text-purple-400 font-medium">
                          <Sparkles className="w-3.5 h-3.5" />
                          <span>Occasion:</span>
                        </span>
                        <span className="capitalize font-semibold text-purple-700 dark:text-purple-300 bg-purple-500/10 px-2 py-0.5 rounded-md border border-purple-500/20">
                          {res.occasion.replace('_', ' ')}
                        </span>
                      </div>
                    )}

                    {res.special_requests && (
                      <div className="text-[11px] text-slate-500 dark:text-zinc-400 italic pt-1.5 border-t border-slate-200/60 dark:border-zinc-700/60 flex items-start gap-1">
                        <span className="font-semibold not-italic text-slate-400 shrink-0">Note:</span>
                        <span className="line-clamp-2">"{res.special_requests}"</span>
                      </div>
                    )}

                    {/* Pre-ordered Food Items if present */}
                    {res.preorder_items && res.preorder_items.length > 0 ? (
                      <div className="pt-2 border-t border-slate-200/60 dark:border-zinc-700/60 text-xs space-y-1.5">
                        <div className="flex items-center justify-between text-slate-700 dark:text-zinc-300 font-semibold">
                          <span className="flex items-center gap-1.5 text-emerald-600 dark:text-[#00df89]">
                            <ChefHat className="w-3.5 h-3.5" />
                            <span>Pre-ordered Food ({res.preorder_items.length}):</span>
                          </span>
                          <span className="font-mono text-emerald-600 dark:text-[#00df89] font-bold">
                            ৳ {(res.preorder_total || res.preorder_items.reduce((s, it) => s + (it.price * it.quantity), 0)).toLocaleString()}
                          </span>
                        </div>
                        <div className="flex flex-wrap gap-1">
                          {res.preorder_items.map((it, idx) => (
                            <span
                              key={idx}
                              className="px-2 py-0.5 rounded-md bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border border-emerald-500/20 text-[10px] font-medium"
                            >
                              {it.name} × {it.quantity}
                            </span>
                          ))}
                        </div>
                      </div>
                    ) : (
                      <div className="flex items-center justify-between pt-1 border-t border-slate-200/60 dark:border-zinc-700/60 text-[11px] text-slate-500 dark:text-zinc-400">
                        <span className="flex items-center gap-1">
                          <Clock className="w-3 h-3 text-slate-400" />
                          <span>Food Order:</span>
                        </span>
                        <span className="italic font-medium text-slate-600 dark:text-zinc-400">Decide at Table</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Status Action Buttons with Loaders */}
                <div className="mt-4 pt-3 border-t border-slate-100 dark:border-zinc-800 flex items-center justify-between gap-2">
                  {isConfirmed && (
                    <button
                      onClick={() => handleUpdateStatus(res._id, 'seated')}
                      disabled={isUpdating}
                      className="flex-1 py-2 px-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 active:scale-[0.98] text-white font-bold text-xs flex items-center justify-center gap-1.5 transition-all shadow-xs cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed"
                    >
                      {isUpdating ? (
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      ) : (
                        <UserCheck className="w-3.5 h-3.5" />
                      )}
                      <span>{isUpdating ? 'Updating...' : 'Seat Guest'}</span>
                    </button>
                  )}

                  {isSeated && (
                    <button
                      onClick={() => handleUpdateStatus(res._id, 'completed')}
                      disabled={isUpdating}
                      className="flex-1 py-2 px-3 rounded-xl bg-blue-600 hover:bg-blue-700 active:scale-[0.98] text-white font-bold text-xs flex items-center justify-center gap-1.5 transition-all shadow-xs cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed"
                    >
                      {isUpdating ? (
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      ) : (
                        <CheckCircle2 className="w-3.5 h-3.5" />
                      )}
                      <span>{isUpdating ? 'Completing...' : 'Complete'}</span>
                    </button>
                  )}

                  <button
                    onClick={() => handleDelete(res)}
                    disabled={isUpdating}
                    className="p-2 rounded-xl border border-slate-200 dark:border-zinc-800 text-slate-400 hover:text-rose-600 hover:border-rose-300 dark:hover:border-rose-900/50 hover:bg-rose-500/10 transition-all cursor-pointer disabled:opacity-50"
                    title="Cancel & Delete"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </Card>
            );
          })}
        </div>
      )}

      {/* MODAL: ADD RESERVATION */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs">
          <Card className="max-w-lg w-full max-h-[90vh] overflow-y-auto p-6 bg-white dark:bg-[#121215] border-slate-200 dark:border-zinc-800 shadow-2xl rounded-2xl">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-zinc-800 pb-3 mb-4 sticky top-0 bg-white dark:bg-[#121215] z-10">
              <CardTitle className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <Calendar className="w-4 h-4 text-purple-500" />
                <span>Book Table Reservation</span>
              </CardTitle>
              <button
                onClick={() => setIsAddModalOpen(false)}
                className="text-slate-400 hover:text-white cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateReservation} className="space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-semibold text-slate-700 dark:text-zinc-300 block mb-1">
                    Guest Name *
                  </label>
                  <Input
                    required
                    placeholder="e.g. Mr. Rafiqul"
                    value={form.guest_name}
                    onChange={(e) => setForm({ ...form, guest_name: e.target.value })}
                    className="h-9 text-xs"
                  />
                </div>

                <div>
                  <label className="font-semibold text-slate-700 dark:text-zinc-300 block mb-1">
                    Phone Number *
                  </label>
                  <Input
                    required
                    placeholder="01712345678"
                    value={form.phone}
                    onChange={(e) => setForm({ ...form, phone: e.target.value })}
                    className="h-9 text-xs"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="font-semibold text-slate-700 dark:text-zinc-300 block mb-1">
                    Date *
                  </label>
                  <DatePicker
                    value={form.reservation_date}
                    onChange={(d) => setForm({ ...form, reservation_date: d })}
                    align="left"
                    className="w-full h-9"
                  />
                </div>

                <div>
                  <label className="font-semibold text-slate-700 dark:text-zinc-300 block mb-1">
                    Time Slot *
                  </label>
                  <Select
                    value={form.time_slot || '19:30'}
                    onValueChange={(t) => setForm({ ...form, time_slot: t })}
                  >
                    <SelectTrigger className="h-9 text-xs rounded-xl bg-white dark:bg-zinc-900 border-slate-200 dark:border-zinc-800 font-mono">
                      <div className="flex items-center gap-1.5 truncate">
                        <Clock className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                        <SelectValue placeholder="Time Slot" />
                      </div>
                    </SelectTrigger>
                    <SelectContent className="max-h-56 font-mono">
                      {TIME_SLOTS.map((slot) => (
                        <SelectItem key={slot.value} value={slot.value}>
                          {slot.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <label className="font-semibold text-slate-700 dark:text-zinc-300 block mb-1">
                    Guests *
                  </label>
                  <Input
                    type="number"
                    min="1"
                    max="50"
                    required
                    value={form.guest_count}
                    onChange={(e) => setForm({ ...form, guest_count: e.target.value })}
                    className="h-9 text-xs font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-semibold text-slate-700 dark:text-zinc-300 block mb-1">
                    Preferred Table
                  </label>
                  <Select
                    value={form.table_number || 'any'}
                    onValueChange={(val) => {
                      const tbl = tables.find((t) => t.table_number === val);
                      setForm({
                        ...form,
                        table_number: val === 'any' ? '' : val,
                        table_id: tbl?._id || '',
                      });
                    }}
                  >
                    <SelectTrigger className="h-9 text-xs rounded-xl bg-white dark:bg-zinc-900 border-slate-200 dark:border-zinc-800">
                      <SelectValue placeholder="Any Available Table" />
                    </SelectTrigger>
                    <SelectContent className="max-h-56">
                      <SelectItem value="any">Any Available Table</SelectItem>
                      {tables.map((t) => (
                        <SelectItem key={t._id} value={t.table_number}>
                          Table {t.table_number} ({t.zone} - {t.capacity} seats)
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <label className="font-semibold text-slate-700 dark:text-zinc-300 block mb-1">
                    Occasion
                  </label>
                  <Select
                    value={form.occasion || 'general'}
                    onValueChange={(val) => setForm({ ...form, occasion: val })}
                  >
                    <SelectTrigger className="h-9 text-xs rounded-xl bg-white dark:bg-zinc-900 border-slate-200 dark:border-zinc-800">
                      <SelectValue placeholder="Select Occasion" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="general">Casual Dining</SelectItem>
                      <SelectItem value="birthday">Birthday Party</SelectItem>
                      <SelectItem value="anniversary">Anniversary Dinner</SelectItem>
                      <SelectItem value="business">Business Meeting</SelectItem>
                      <SelectItem value="family_gathering">Family Gathering</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div>
                <label className="font-semibold text-slate-700 dark:text-zinc-300 block mb-1">
                  Special Requests / Cake / Window Seat Notes:
                </label>
                <Input
                  placeholder="e.g. Window side preferred, arrange high chair"
                  value={form.special_requests}
                  onChange={(e) => setForm({ ...form, special_requests: e.target.value })}
                  className="h-9 text-xs"
                />
              </div>

              {/* Food Ordering Preference Section */}
              <div className="space-y-2 pt-2 border-t border-slate-100 dark:border-zinc-800">
                <label className="font-bold text-slate-800 dark:text-zinc-200 block">
                  Food Ordering Option
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setForm({ ...form, order_preference: 'decide_later' })}
                    className={`py-2 px-3 rounded-xl border text-xs font-semibold flex items-center justify-center gap-2 cursor-pointer transition-all ${
                      form.order_preference === 'decide_later'
                        ? 'bg-slate-900 text-white dark:bg-white dark:text-slate-950 border-transparent shadow-xs'
                        : 'bg-slate-50 dark:bg-zinc-800/60 border-slate-200 dark:border-zinc-700 text-slate-600 dark:text-zinc-300 hover:bg-slate-100'
                    }`}
                  >
                    <Clock className="w-3.5 h-3.5" />
                    <span>Decide Later at Table</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setForm({ ...form, order_preference: 'preorder' })}
                    className={`py-2 px-3 rounded-xl border text-xs font-semibold flex items-center justify-center gap-2 cursor-pointer transition-all ${
                      form.order_preference === 'preorder'
                        ? 'bg-emerald-600 text-white border-emerald-600 shadow-xs'
                        : 'bg-slate-50 dark:bg-zinc-800/60 border-slate-200 dark:border-zinc-700 text-slate-600 dark:text-zinc-300 hover:bg-slate-100'
                    }`}
                  >
                    <ChefHat className="w-3.5 h-3.5" />
                    <span>Pre-order Food Now</span>
                  </button>
                </div>

                {form.order_preference === 'decide_later' ? (
                  <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-zinc-800/40 border border-slate-200/80 dark:border-zinc-800 text-[11px] text-slate-500 dark:text-zinc-400">
                    Guests will choose dishes after seating at the table. Table will be seated with <span className="font-semibold text-slate-700 dark:text-zinc-300">"No Order Placed"</span> and waitstaff can take the order anytime.
                  </div>
                ) : (
                  <div className="p-3 rounded-xl bg-emerald-500/5 border border-emerald-500/20 space-y-3">
                    <div className="flex items-center gap-2">
                      <div className="flex-1">
                        <Select
                          value={selectedDishToAdd}
                          onValueChange={(val) => {
                            setSelectedDishToAdd(val);
                            handleAddDishToPreorder(val);
                          }}
                        >
                          <SelectTrigger className="h-9 text-xs rounded-xl bg-white dark:bg-zinc-900 border-slate-200 dark:border-zinc-700">
                            <SelectValue placeholder="Select dish from menu to add..." />
                          </SelectTrigger>
                          <SelectContent className="max-h-56">
                            {menuItems.map((dish) => (
                              <SelectItem key={dish._id} value={dish._id}>
                                {dish.name} — ৳{Number(dish.price).toLocaleString()} ({dish.category || 'Main'})
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>

                    {/* Selected Preorder Items List */}
                    {form.preorder_items.length === 0 ? (
                      <div className="py-3 text-center text-[11px] text-slate-400">
                        No dishes added yet. Select dishes above to pre-order for this reservation.
                      </div>
                    ) : (
                      <div className="space-y-1.5 max-h-44 overflow-y-auto pr-1">
                        {form.preorder_items.map((item) => (
                          <div
                            key={item.dish_id}
                            className="flex items-center justify-between p-2 rounded-lg bg-white dark:bg-zinc-900 border border-slate-200/80 dark:border-zinc-800 text-xs"
                          >
                            <div className="min-w-0 flex-1 pr-2">
                              <div className="font-semibold text-slate-900 dark:text-white truncate">
                                {item.name}
                              </div>
                              <div className="text-[10px] text-slate-500 font-mono">
                                ৳{item.price} each
                              </div>
                            </div>

                            {/* Quantity Stepper */}
                            <div className="flex items-center gap-1.5">
                              <button
                                type="button"
                                onClick={() => handleUpdateDishQty(item.dish_id, -1)}
                                className="w-6 h-6 rounded-md bg-slate-100 dark:bg-zinc-800 hover:bg-slate-200 dark:hover:bg-zinc-700 flex items-center justify-center text-slate-600 dark:text-zinc-300 cursor-pointer"
                              >
                                <Minus className="w-3 h-3" />
                              </button>
                              <span className="font-mono font-bold w-5 text-center text-slate-900 dark:text-white">
                                {item.quantity}
                              </span>
                              <button
                                type="button"
                                onClick={() => handleUpdateDishQty(item.dish_id, 1)}
                                className="w-6 h-6 rounded-md bg-slate-100 dark:bg-zinc-800 hover:bg-slate-200 dark:hover:bg-zinc-700 flex items-center justify-center text-slate-600 dark:text-zinc-300 cursor-pointer"
                              >
                                <Plus className="w-3 h-3" />
                              </button>
                              <span className="font-mono font-bold text-emerald-600 dark:text-[#00df89] ml-2 w-14 text-right">
                                ৳{item.subtotal}
                              </span>
                              <button
                                type="button"
                                onClick={() => handleRemovePreorderDish(item.dish_id)}
                                className="text-slate-400 hover:text-rose-500 ml-1 p-1 cursor-pointer"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}

                    {form.preorder_items.length > 0 && (
                      <div className="flex items-center justify-between pt-2 border-t border-emerald-500/20 text-xs font-bold text-emerald-700 dark:text-emerald-300">
                        <span>Estimated Pre-order Total:</span>
                        <span className="font-mono text-sm">৳{preorderTotal.toLocaleString()}</span>
                      </div>
                    )}
                  </div>
                )}
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100 dark:border-zinc-800">
                <button
                  type="button"
                  disabled={isSavingReservation}
                  onClick={() => setIsAddModalOpen(false)}
                  className="px-4 py-2 rounded-xl border border-slate-200 text-xs font-semibold cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {lang === 'bn' ? 'বাতিল' : 'Cancel'}
                </button>
                <button
                  type="submit"
                  disabled={isSavingReservation}
                  className="px-4 py-2 rounded-xl bg-[#00df89] text-slate-950 text-xs font-bold shadow-xs hover:bg-[#00c578] cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed flex items-center gap-1.5"
                >
                  {isSavingReservation && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                  <span>
                    {isSavingReservation
                      ? (lang === 'bn' ? 'বুকিং হচ্ছে...' : 'Booking...')
                      : (lang === 'bn' ? 'বুকিং নিশ্চিত করুন' : 'Confirm Booking')}
                  </span>
                </button>
              </div>
            </form>
          </Card>
        </div>
      )}

      {/* CONFIRM DELETE DIALOG */}
      <ConfirmDialog
        isOpen={Boolean(deletingReservation)}
        title={lang === 'bn' ? `রিজার্ভেশন বাতিল ও মুছে ফেলতে চান?` : `Cancel & Delete Reservation?`}
        description={lang === 'bn' ? `${deletingReservation?.guest_name || ''}-এর জন্য বুকিংটি স্থায়ীভাবে মুছে ফেলা হবে।` : `The table booking for "${deletingReservation?.guest_name || ''}" (${deletingReservation?.guest_count || 0} guests) will be deleted.`}
        confirmText={lang === 'bn' ? 'হ্যাঁ, মুছুন' : 'Yes, Delete Booking'}
        cancelText={lang === 'bn' ? 'বাতিল' : 'Cancel'}
        isLoading={isDeletingReservation}
        onConfirm={confirmDeleteReservation}
        onCancel={() => setDeletingReservation(null)}
      />

    </div>
  );
}
