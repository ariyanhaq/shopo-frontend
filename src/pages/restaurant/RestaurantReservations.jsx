import { useState, useEffect } from 'react';
import { useLanguage } from '@/context/LanguageContext';
import { useShop } from '@/context/ShopContext';
import api from '@/services/api';
import toast from 'react-hot-toast';
import { Card, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import {
  Calendar, Plus, Search, RefreshCw, CheckCircle2, Clock,
  Users, Trash2, Edit3, X, Sparkles, UserCheck, Utensils
} from 'lucide-react';

export default function RestaurantReservations() {
  const { lang } = useLanguage();
  const { activeShop } = useShop();

  const [reservations, setReservations] = useState([]);
  const [tables, setTables] = useState([]);
  const [selectedStatus, setSelectedStatus] = useState('all');
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [isLoading, setIsLoading] = useState(true);

  // Modals
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);

  // Form State
  const [form, setForm] = useState({
    guest_name: '',
    phone: '',
    email: '',
    table_id: '',
    table_number: '',
    guest_count: 2,
    reservation_date: new Date().toISOString().split('T')[0],
    time_slot: '19:30',
    occasion: 'general',
    special_requests: '',
  });

  const loadData = async () => {
    try {
      setIsLoading(true);
      const params = {};
      if (selectedDate) params.date = selectedDate;
      if (selectedStatus !== 'all') params.status = selectedStatus;

      const [resData, tablesData] = await Promise.all([
        api.restaurant.reservations.list(params),
        api.restaurant.tables.list(),
      ]);

      if (resData?.success) setReservations(resData.data);
      if (tablesData?.success) setTables(tablesData.data);
    } catch (err) {
      console.error('Failed to load reservations:', err);
      toast.error('Failed to load reservations');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [activeShop, selectedDate, selectedStatus]);

  const handleCreateReservation = async (e) => {
    e.preventDefault();
    if (!form.guest_name.trim() || !form.phone.trim()) {
      toast.error('Guest name and phone number are required');
      return;
    }

    try {
      await api.restaurant.reservations.create(form);
      toast.success('Table reservation confirmed!');
      setIsAddModalOpen(false);
      loadData();
    } catch (err) {
      toast.error(err.message || 'Failed to create reservation');
    }
  };

  const handleUpdateStatus = async (id, status) => {
    try {
      await api.restaurant.reservations.update(id, { status });
      toast.success(`Reservation marked as ${status}!`);
      loadData();
    } catch (err) {
      toast.error('Failed to update status');
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Cancel and delete this reservation?')) return;
    try {
      await api.restaurant.reservations.delete(id);
      toast.success('Reservation deleted');
      loadData();
    } catch (err) {
      toast.error('Failed to delete');
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
          <Input
            type="date"
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
            className="h-9 text-xs font-mono bg-white dark:bg-zinc-900 w-40 rounded-xl"
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
        <div className="text-center py-20 text-xs text-slate-400">Loading reservations...</div>
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

            return (
              <Card
                key={res._id}
                className="p-4 bg-white dark:bg-zinc-900 border-slate-200/80 dark:border-zinc-800 shadow-xs rounded-2xl flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <div className="w-9 h-9 rounded-xl bg-purple-500/10 text-purple-600 flex items-center justify-center font-bold text-xs font-mono">
                        {res.time_slot}
                      </div>
                      <div>
                        <div className="font-bold text-sm text-slate-900 dark:text-white">
                          {res.guest_name}
                        </div>
                        <div className="text-[11px] text-slate-500">📞 {res.phone}</div>
                      </div>
                    </div>

                    <Badge
                      className={`capitalize text-[10px] ${
                        isConfirmed
                          ? 'bg-amber-500/15 text-amber-700 dark:text-amber-300 border-amber-500/30'
                          : isSeated
                          ? 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border-emerald-500/30'
                          : 'bg-slate-100 text-slate-600'
                      }`}
                    >
                      {res.status}
                    </Badge>
                  </div>

                  <div className="mt-3 p-2.5 bg-slate-50 dark:bg-zinc-800/40 rounded-xl space-y-1 text-xs">
                    <div className="flex items-center justify-between text-slate-600 dark:text-zinc-400">
                      <span>👥 Guests:</span>
                      <span className="font-bold text-slate-900 dark:text-white">{res.guest_count} persons</span>
                    </div>

                    {res.table_number && (
                      <div className="flex items-center justify-between text-slate-600 dark:text-zinc-400">
                        <span>🍽️ Table:</span>
                        <span className="font-bold text-orange-600 dark:text-orange-400">Table {res.table_number}</span>
                      </div>
                    )}

                    {res.occasion && res.occasion !== 'general' && (
                      <div className="flex items-center justify-between text-purple-600 dark:text-purple-400 font-semibold">
                        <span>🎉 Occasion:</span>
                        <span className="capitalize">{res.occasion.replace('_', ' ')}</span>
                      </div>
                    )}

                    {res.special_requests && (
                      <div className="text-[10px] text-slate-500 italic pt-1 border-t border-slate-200/50">
                        Note: "{res.special_requests}"
                      </div>
                    )}
                  </div>
                </div>

                {/* Status Action Buttons */}
                <div className="mt-4 pt-3 border-t border-slate-100 dark:border-zinc-800 flex items-center justify-between gap-2">
                  {isConfirmed && (
                    <button
                      onClick={() => handleUpdateStatus(res._id, 'seated')}
                      className="flex-1 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs flex items-center justify-center gap-1 cursor-pointer"
                    >
                      <UserCheck className="w-3.5 h-3.5" />
                      <span>Seat Guest</span>
                    </button>
                  )}

                  {isSeated && (
                    <button
                      onClick={() => handleUpdateStatus(res._id, 'completed')}
                      className="flex-1 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs flex items-center justify-center gap-1 cursor-pointer"
                    >
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      <span>Complete</span>
                    </button>
                  )}

                  <button
                    onClick={() => handleDelete(res._id)}
                    className="p-2 rounded-xl border border-slate-200 dark:border-zinc-800 text-slate-400 hover:text-rose-600 cursor-pointer"
                    title="Cancel"
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
          <Card className="max-w-md w-full p-6 bg-white dark:bg-[#121215] border-slate-200 dark:border-zinc-800 shadow-2xl rounded-2xl">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-zinc-800 pb-3 mb-4">
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
                  <Input
                    type="date"
                    required
                    value={form.reservation_date}
                    onChange={(e) => setForm({ ...form, reservation_date: e.target.value })}
                    className="h-9 text-xs font-mono"
                  />
                </div>

                <div>
                  <label className="font-semibold text-slate-700 dark:text-zinc-300 block mb-1">
                    Time Slot *
                  </label>
                  <Input
                    type="time"
                    required
                    value={form.time_slot}
                    onChange={(e) => setForm({ ...form, time_slot: e.target.value })}
                    className="h-9 text-xs font-mono"
                  />
                </div>

                <div>
                  <label className="font-semibold text-slate-700 dark:text-zinc-300 block mb-1">
                    Guests
                  </label>
                  <Input
                    type="number"
                    min="1"
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
                  <select
                    value={form.table_number}
                    onChange={(e) => {
                      const tbl = tables.find((t) => t.table_number === e.target.value);
                      setForm({
                        ...form,
                        table_number: e.target.value,
                        table_id: tbl?._id || '',
                      });
                    }}
                    className="w-full h-9 px-3 rounded-xl border border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 text-xs"
                  >
                    <option value="">-- Any Available Table --</option>
                    {tables.map((t) => (
                      <option key={t._id} value={t.table_number}>
                        {t.table_number} ({t.zone} - {t.capacity} seats)
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="font-semibold text-slate-700 dark:text-zinc-300 block mb-1">
                    Occasion
                  </label>
                  <select
                    value={form.occasion}
                    onChange={(e) => setForm({ ...form, occasion: e.target.value })}
                    className="w-full h-9 px-3 rounded-xl border border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 text-xs"
                  >
                    <option value="general">Casual Dining</option>
                    <option value="birthday">Birthday Party</option>
                    <option value="anniversary">Anniversary Dinner</option>
                    <option value="business">Business Meeting</option>
                    <option value="family_gathering">Family Gathering</option>
                  </select>
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

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100 dark:border-zinc-800">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="px-4 py-2 rounded-xl border border-slate-200 text-xs font-semibold cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-[#00df89] text-slate-950 text-xs font-bold shadow-xs hover:bg-[#00c578] cursor-pointer"
                >
                  Confirm Booking
                </button>
              </div>
            </form>
          </Card>
        </div>
      )}

    </div>
  );
}
