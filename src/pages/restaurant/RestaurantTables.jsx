import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useLanguage } from '@/context/LanguageContext';
import { useShop } from '@/context/ShopContext';
import api from '@/services/api';
import toast from 'react-hot-toast';
import { Card, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import {
  LayoutGrid, Plus, Users, ShoppingCart, ArrowLeftRight, Trash2,
  CheckCircle2, Sparkles, QrCode, RefreshCw, X, Utensils, Clock,
  DollarSign, Edit3, ShieldAlert
} from 'lucide-react';

export default function RestaurantTables() {
  const navigate = useNavigate();
  const { lang } = useLanguage();
  const { activeShop } = useShop();

  const [tables, setTables] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedZone, setSelectedZone] = useState('all');
  const [selectedStatus, setSelectedStatus] = useState('all');

  // Modals
  const [isAddTableOpen, setIsAddTableOpen] = useState(false);
  const [isOccupyModalOpen, setIsOccupyModalOpen] = useState(false);
  const [isTransferModalOpen, setIsTransferModalOpen] = useState(false);
  const [isQrModalOpen, setIsQrModalOpen] = useState(false);
  const [selectedTable, setSelectedTable] = useState(null);

  // Forms
  const [tableForm, setTableForm] = useState({
    table_number: '',
    name: '',
    zone: 'indoor',
    capacity: 4,
  });

  const [occupyForm, setOccupyForm] = useState({
    waiter_name: '',
    guest_count: 2,
  });

  const [transferTargetId, setTransferTargetId] = useState('');

  const fetchTables = async () => {
    try {
      setIsLoading(true);
      const params = {};
      if (selectedZone !== 'all') params.zone = selectedZone;
      if (selectedStatus !== 'all') params.status = selectedStatus;

      const res = await api.restaurant.tables.list(params);
      if (res?.success) {
        setTables(res.data);
      }
    } catch (err) {
      console.error('Failed to load tables:', err);
      toast.error('Failed to load tables');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchTables();
  }, [activeShop, selectedZone, selectedStatus]);

  const handleCreateTable = async (e) => {
    e.preventDefault();
    if (!tableForm.table_number.trim()) {
      toast.error(lang === 'bn' ? 'টেবিল নম্বর দিন।' : 'Table number is required.');
      return;
    }

    try {
      const res = await api.restaurant.tables.create(tableForm);
      if (res?.success) {
        toast.success(lang === 'bn' ? 'টেবিল তৈরি হয়েছে!' : 'Table created successfully!');
        setIsAddTableOpen(false);
        setTableForm({ table_number: '', name: '', zone: 'indoor', capacity: 4 });
        fetchTables();
      }
    } catch (err) {
      toast.error(err.message || 'Failed to create table');
    }
  };

  const handleOccupy = async (e) => {
    e.preventDefault();
    if (!selectedTable) return;
    try {
      const res = await api.restaurant.tables.occupy(selectedTable._id, occupyForm);
      if (res?.success) {
        toast.success(lang === 'bn' ? 'টেবিল বুকড ও অতিথি বসানো হয়েছে!' : 'Table occupied successfully!');
        setIsOccupyModalOpen(false);
        fetchTables();
      }
    } catch (err) {
      toast.error(err.message || 'Failed to occupy table');
    }
  };

  const handleFreeTable = async (tableId) => {
    try {
      const res = await api.restaurant.tables.free(tableId);
      if (res?.success) {
        toast.success(lang === 'bn' ? 'টেবিল ফ্রি ও পরিষ্কার করা হয়েছে!' : 'Table cleared & available!');
        fetchTables();
      }
    } catch (err) {
      toast.error(err.message || 'Failed to clear table');
    }
  };

  const handleTransfer = async (e) => {
    e.preventDefault();
    if (!selectedTable || !transferTargetId) {
      toast.error('Please select destination table');
      return;
    }
    try {
      const res = await api.restaurant.tables.transfer({
        sourceTableId: selectedTable._id,
        targetTableId: transferTargetId,
      });
      if (res?.success) {
        toast.success(res.data.message || 'Table transferred!');
        setIsTransferModalOpen(false);
        fetchTables();
      }
    } catch (err) {
      toast.error(err.message || 'Failed to transfer table');
    }
  };

  const handleDeleteTable = async (tableId) => {
    if (!window.confirm('Are you sure you want to delete this table?')) return;
    try {
      await api.restaurant.tables.delete(tableId);
      toast.success('Table deleted');
      fetchTables();
    } catch (err) {
      toast.error(err.message || 'Failed to delete table');
    }
  };

  const zones = [
    { id: 'all', label: lang === 'bn' ? 'সকল জোন' : 'All Zones' },
    { id: 'indoor', label: lang === 'bn' ? 'ডাইনিং' : 'Indoor Dining' },
    { id: 'rooftop', label: lang === 'bn' ? 'রুফটপ গার্ডেন' : 'Rooftop Garden' },
    { id: 'vip', label: lang === 'bn' ? 'ভিআইপি লাউঞ্জ' : 'VIP Lounge' },
    { id: 'terrace', label: lang === 'bn' ? 'আউটডোর টেরাস' : 'Outdoor Terrace' },
    { id: 'bar', label: lang === 'bn' ? 'বার কাউন্টার' : 'Bar Counter' },
  ];

  const statuses = [
    { id: 'all', label: lang === 'bn' ? 'সকল স্ট্যাটাস' : 'All Statuses' },
    { id: 'available', label: lang === 'bn' ? '🟢 খালি / ফ্রি' : '🟢 Free / Available' },
    { id: 'occupied', label: lang === 'bn' ? '🔴 চলমান' : '🔴 Occupied' },
    { id: 'reserved', label: lang === 'bn' ? '🟡 বুকড' : '🟡 Reserved' },
    { id: 'dirty', label: lang === 'bn' ? '🧹 পরিষ্কার প্রয়োজন' : '🧹 Dirty / Needs Cleaning' },
  ];

  return (
    <div className="space-y-6 font-sans pb-16">
      
      {/* HEADER */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white tracking-tight flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-blue-500/10 text-blue-600 flex items-center justify-center">
              <LayoutGrid className="w-4 h-4" />
            </div>
            <span>{lang === 'bn' ? 'টেবিল ও ফ্লোর প্ল্যান ম্যানেজমেন্ট' : 'Floor Plan & Table Management'}</span>
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-zinc-400 font-normal mt-0.5">
            {lang === 'bn'
              ? 'লাইভ টেবিল অকুপ্যান্সি পরিচালনা করুন, অতিথি বসান, অর্ডার ট্রান্সফার ও কিউআর মেনু জেনারেট করুন।'
              : 'Manage live visual table seating, running orders, table transfers and QR digital ordering.'}
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={fetchTables}
            className="p-2.5 rounded-xl border border-slate-200 dark:border-zinc-800 hover:bg-slate-100 dark:hover:bg-zinc-800 text-slate-700 dark:text-zinc-300 transition-all cursor-pointer"
          >
            <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
          </button>

          <button
            onClick={() => setIsAddTableOpen(true)}
            className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-[#00df89] hover:bg-[#00c578] text-slate-950 font-bold text-xs shadow-xs transition-all cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>{lang === 'bn' ? 'নতুন টেবিল যুক্ত করুন' : 'Add New Table'}</span>
          </button>
        </div>
      </div>

      {/* ZONE & STATUS FILTER PILLS */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-200 dark:border-zinc-800 pb-3">
        {/* Zones */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
          {zones.map((z) => (
            <button
              key={z.id}
              onClick={() => setSelectedZone(z.id)}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all cursor-pointer ${
                selectedZone === z.id
                  ? 'bg-slate-900 text-white dark:bg-white dark:text-slate-900 shadow-xs'
                  : 'bg-slate-100 dark:bg-zinc-800 text-slate-600 dark:text-zinc-400 hover:bg-slate-200 dark:hover:bg-zinc-700'
              }`}
            >
              {z.label}
            </button>
          ))}
        </div>

        {/* Status Dropdown */}
        <div className="flex items-center gap-2">
          <select
            value={selectedStatus}
            onChange={(e) => setSelectedStatus(e.target.value)}
            className="h-8 px-2.5 rounded-lg border border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 text-xs font-medium text-slate-900 dark:text-white"
          >
            {statuses.map((s) => (
              <option key={s.id} value={s.id}>{s.label}</option>
            ))}
          </select>
        </div>
      </div>

      {/* TABLES GRID */}
      {isLoading ? (
        <div className="text-center py-20 text-xs text-slate-400">
          <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2 text-[#00df89]" />
          Loading floor plan...
        </div>
      ) : tables.length === 0 ? (
        <div className="text-center py-20 bg-white dark:bg-zinc-900 rounded-2xl border border-dashed border-slate-200 dark:border-zinc-800 p-8">
          <LayoutGrid className="w-10 h-10 mx-auto text-slate-300 dark:text-zinc-600 mb-2" />
          <div className="text-sm font-bold text-slate-900 dark:text-white">
            {lang === 'bn' ? 'কোনো টেবিল পাওয়া যায়নি' : 'No Tables Configured'}
          </div>
          <p className="text-xs text-slate-500 mt-1 max-w-xs mx-auto">
            {lang === 'bn' ? 'ফ্লোর শুরু করতে নতুন টেবিল যোগ করুন।' : 'Add your first restaurant table to set up your floor plan.'}
          </p>
          <button
            onClick={() => setIsAddTableOpen(true)}
            className="mt-4 px-4 py-2 rounded-xl bg-[#00df89] text-slate-950 font-bold text-xs cursor-pointer inline-flex items-center gap-1.5"
          >
            <Plus className="w-4 h-4" />
            <span>{lang === 'bn' ? 'টেবিল যোগ করুন' : 'Add First Table'}</span>
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {tables.map((table) => {
            const isOccupied = table.status === 'occupied';
            const isReserved = table.status === 'reserved';
            const isDirty = table.status === 'dirty';
            const isAvailable = table.status === 'available';

            return (
              <Card
                key={table._id}
                className={`p-4 rounded-2xl border transition-all relative overflow-hidden shadow-xs hover:shadow-md ${
                  isOccupied
                    ? 'bg-rose-500/5 border-rose-500/30'
                    : isReserved
                    ? 'bg-amber-500/5 border-amber-500/30'
                    : isDirty
                    ? 'bg-slate-100 dark:bg-zinc-800/80 border-slate-300 dark:border-zinc-700'
                    : 'bg-emerald-500/5 border-emerald-500/30'
                }`}
              >
                {/* Status top ribbon */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="font-black text-lg text-slate-900 dark:text-white">
                      {table.table_number}
                    </span>
                    <span className="text-[10px] uppercase font-bold px-2 py-0.5 rounded-md bg-slate-200 dark:bg-zinc-800 text-slate-700 dark:text-zinc-300">
                      {table.zone}
                    </span>
                  </div>

                  <Badge
                    className={`text-[10px] font-bold uppercase ${
                      isOccupied
                        ? 'bg-rose-500 text-white'
                        : isReserved
                        ? 'bg-amber-500 text-white'
                        : isDirty
                        ? 'bg-slate-500 text-white'
                        : 'bg-emerald-500 text-white'
                    }`}
                  >
                    {table.status}
                  </Badge>
                </div>

                {/* Table details */}
                <div className="mt-3 space-y-1.5 text-xs text-slate-600 dark:text-zinc-400">
                  <div className="flex items-center justify-between font-semibold">
                    <span>👥 Capacity:</span>
                    <span className="text-slate-900 dark:text-white">{table.capacity} Seats</span>
                  </div>

                  {isOccupied && (
                    <>
                      <div className="flex items-center justify-between">
                        <span>👤 Seated Guests:</span>
                        <span className="font-bold text-rose-600 dark:text-rose-400">
                          {table.current_guest_count || table.capacity} guests
                        </span>
                      </div>
                      {table.waiter_name && (
                        <div className="flex items-center justify-between">
                          <span>🧑‍🍳 Waiter:</span>
                          <span className="font-medium text-slate-900 dark:text-white">{table.waiter_name}</span>
                        </div>
                      )}
                    </>
                  )}
                </div>

                {/* Action Buttons Footer */}
                <div className="mt-4 pt-3 border-t border-slate-200/70 dark:border-zinc-800/70 grid grid-cols-2 gap-2">
                  {isAvailable && (
                    <>
                      <button
                        onClick={() => {
                          setSelectedTable(table);
                          setOccupyForm({ waiter_name: '', guest_count: table.capacity });
                          setIsOccupyModalOpen(true);
                        }}
                        className="px-2.5 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-[11px] font-bold cursor-pointer text-center"
                      >
                        {lang === 'bn' ? 'অতিথি বসান' : 'Seat Guests'}
                      </button>
                      <button
                        onClick={() => navigate(`/restaurant/pos?table=${table.table_number}&tableId=${table._id}`)}
                        className="px-2.5 py-1.5 rounded-xl bg-[#00df89] hover:bg-[#00c578] text-slate-950 text-[11px] font-bold cursor-pointer text-center flex items-center justify-center gap-1"
                      >
                        <ShoppingCart className="w-3 h-3" />
                        <span>{lang === 'bn' ? 'পিওএস অর্ডার' : 'POS Order'}</span>
                      </button>
                    </>
                  )}

                  {isOccupied && (
                    <>
                      <button
                        onClick={() => navigate(`/restaurant/pos?table=${table.table_number}&tableId=${table._id}`)}
                        className="px-2.5 py-1.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-[11px] font-bold cursor-pointer text-center flex items-center justify-center gap-1"
                      >
                        <ShoppingCart className="w-3 h-3" />
                        <span>{lang === 'bn' ? 'অর্ডার দেখুন / বিল' : 'View Order'}</span>
                      </button>
                      <button
                        onClick={() => {
                          setSelectedTable(table);
                          setIsTransferModalOpen(true);
                        }}
                        className="px-2.5 py-1.5 rounded-xl border border-slate-300 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-slate-800 dark:text-white text-[11px] font-bold cursor-pointer text-center flex items-center justify-center gap-1"
                      >
                        <ArrowLeftRight className="w-3 h-3 text-blue-500" />
                        <span>Transfer</span>
                      </button>
                    </>
                  )}

                  {isDirty && (
                    <button
                      onClick={() => handleFreeTable(table._id)}
                      className="col-span-2 px-2.5 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-[11px] font-bold cursor-pointer text-center flex items-center justify-center gap-1.5"
                    >
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      <span>{lang === 'bn' ? 'টেবিল পরিষ্কার শেষ (ফ্রি করুন)' : 'Mark Table Cleaned'}</span>
                    </button>
                  )}

                  {isReserved && (
                    <button
                      onClick={() => {
                        setSelectedTable(table);
                        setOccupyForm({ waiter_name: '', guest_count: table.capacity });
                        setIsOccupyModalOpen(true);
                      }}
                      className="col-span-2 px-2.5 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-white text-[11px] font-bold cursor-pointer text-center"
                    >
                      {lang === 'bn' ? 'রিজার্ভড অতিথি চেক-ইন' : 'Seat Reserved Guests'}
                    </button>
                  )}
                </div>

                {/* Micro Actions */}
                <div className="flex items-center justify-between mt-2 pt-1 text-[10px] text-slate-400">
                  <button
                    onClick={() => {
                      setSelectedTable(table);
                      setIsQrModalOpen(true);
                    }}
                    className="hover:text-blue-500 flex items-center gap-1 cursor-pointer"
                  >
                    <QrCode className="w-3 h-3" />
                    <span>Table QR</span>
                  </button>

                  <button
                    onClick={() => handleDeleteTable(table._id)}
                    className="hover:text-rose-500 cursor-pointer"
                    title="Delete"
                  >
                    <Trash2 className="w-3 h-3" />
                  </button>
                </div>
              </Card>
            );
          })}
        </div>
      )}

      {/* ---------------------------------------------------- */}
      {/* MODAL 1: ADD NEW TABLE                               */}
      {/* ---------------------------------------------------- */}
      {isAddTableOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs">
          <Card className="max-w-md w-full p-6 bg-white dark:bg-[#121215] border-slate-200 dark:border-zinc-800 shadow-2xl rounded-2xl">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-zinc-800 pb-3 mb-4">
              <CardTitle className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <Plus className="w-4 h-4 text-emerald-500" />
                <span>{lang === 'bn' ? 'নতুন টেবিল যুক্ত করুন' : 'Add New Restaurant Table'}</span>
              </CardTitle>
              <button
                onClick={() => setIsAddTableOpen(false)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-white cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateTable} className="space-y-4 text-xs">
              <div>
                <label className="font-semibold text-slate-700 dark:text-zinc-300 block mb-1">
                  {lang === 'bn' ? 'টেবিল নম্বর / কোড *' : 'Table Number / Identifier *'}
                </label>
                <Input
                  required
                  placeholder="e.g. T-05 or Rooftop-2"
                  value={tableForm.table_number}
                  onChange={(e) => setTableForm({ ...tableForm, table_number: e.target.value })}
                  className="h-10 text-xs font-mono"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-semibold text-slate-700 dark:text-zinc-300 block mb-1">
                    {lang === 'bn' ? 'ফ্লোর জোন' : 'Floor Zone'}
                  </label>
                  <select
                    value={tableForm.zone}
                    onChange={(e) => setTableForm({ ...tableForm, zone: e.target.value })}
                    className="w-full h-10 px-3 rounded-xl border border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 text-xs font-medium text-slate-900 dark:text-white"
                  >
                    <option value="indoor">Indoor Dining</option>
                    <option value="rooftop">Rooftop Garden</option>
                    <option value="vip">VIP Lounge</option>
                    <option value="terrace">Outdoor Terrace</option>
                    <option value="bar">Bar Counter</option>
                    <option value="patio">Patio</option>
                  </select>
                </div>

                <div>
                  <label className="font-semibold text-slate-700 dark:text-zinc-300 block mb-1">
                    {lang === 'bn' ? 'আসন সংখ্যা (Capacity)' : 'Seat Capacity'}
                  </label>
                  <Input
                    type="number"
                    min="1"
                    max="50"
                    required
                    value={tableForm.capacity}
                    onChange={(e) => setTableForm({ ...tableForm, capacity: e.target.value })}
                    className="h-10 text-xs font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="font-semibold text-slate-700 dark:text-zinc-300 block mb-1">
                  {lang === 'bn' ? 'টেবিলের নাম / বর্ণনা (ঐচ্ছিক)' : 'Table Nickname / Label (Optional)'}
                </label>
                <Input
                  placeholder="e.g. Corner Window Table"
                  value={tableForm.name}
                  onChange={(e) => setTableForm({ ...tableForm, name: e.target.value })}
                  className="h-10 text-xs"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100 dark:border-zinc-800">
                <button
                  type="button"
                  onClick={() => setIsAddTableOpen(false)}
                  className="px-4 py-2 rounded-xl border border-slate-200 dark:border-zinc-700 text-xs font-semibold text-slate-600 dark:text-zinc-400 hover:bg-slate-50 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-[#00df89] text-slate-950 text-xs font-bold shadow-xs hover:bg-[#00c578] cursor-pointer"
                >
                  {lang === 'bn' ? 'টেবিল সংরক্ষণ করুন' : 'Save Table'}
                </button>
              </div>
            </form>
          </Card>
        </div>
      )}

      {/* ---------------------------------------------------- */}
      {/* MODAL 2: SEAT GUESTS / OCCUPY TABLE                  */}
      {/* ---------------------------------------------------- */}
      {isOccupyModalOpen && selectedTable && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs">
          <Card className="max-w-md w-full p-6 bg-white dark:bg-[#121215] border-slate-200 dark:border-zinc-800 shadow-2xl rounded-2xl">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-zinc-800 pb-3 mb-4">
              <CardTitle className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <Utensils className="w-4 h-4 text-emerald-500" />
                <span>Seat Guests — Table {selectedTable.table_number}</span>
              </CardTitle>
              <button
                onClick={() => setIsOccupyModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-white cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleOccupy} className="space-y-4 text-xs">
              <div>
                <label className="font-semibold text-slate-700 dark:text-zinc-300 block mb-1">
                  {lang === 'bn' ? 'অতিথি সংখ্যা (Guest Count)' : 'Number of Guests'}
                </label>
                <Input
                  type="number"
                  min="1"
                  max={selectedTable.capacity * 2}
                  required
                  value={occupyForm.guest_count}
                  onChange={(e) => setOccupyForm({ ...occupyForm, guest_count: e.target.value })}
                  className="h-10 text-xs font-mono"
                />
              </div>

              <div>
                <label className="font-semibold text-slate-700 dark:text-zinc-300 block mb-1">
                  {lang === 'bn' ? 'দায়িত্বরত ওয়েটার / স্টুয়ার্ড' : 'Assigned Waiter / Server'}
                </label>
                <Input
                  placeholder="e.g. Rahul / Sajjad"
                  value={occupyForm.waiter_name}
                  onChange={(e) => setOccupyForm({ ...occupyForm, waiter_name: e.target.value })}
                  className="h-10 text-xs"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100 dark:border-zinc-800">
                <button
                  type="button"
                  onClick={() => setIsOccupyModalOpen(false)}
                  className="px-4 py-2 rounded-xl border border-slate-200 dark:border-zinc-700 text-xs font-semibold cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-emerald-600 text-white text-xs font-bold hover:bg-emerald-700 cursor-pointer"
                >
                  {lang === 'bn' ? 'টেবিল বুক করুন' : 'Confirm Seating'}
                </button>
              </div>
            </form>
          </Card>
        </div>
      )}

      {/* ---------------------------------------------------- */}
      {/* MODAL 3: TRANSFER TABLE                              */}
      {/* ---------------------------------------------------- */}
      {isTransferModalOpen && selectedTable && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs">
          <Card className="max-w-md w-full p-6 bg-white dark:bg-[#121215] border-slate-200 dark:border-zinc-800 shadow-2xl rounded-2xl">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-zinc-800 pb-3 mb-4">
              <CardTitle className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <ArrowLeftRight className="w-4 h-4 text-blue-500" />
                <span>Transfer Table {selectedTable.table_number}</span>
              </CardTitle>
              <button
                onClick={() => setIsTransferModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-white cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleTransfer} className="space-y-4 text-xs">
              <div>
                <label className="font-semibold text-slate-700 dark:text-zinc-300 block mb-1">
                  {lang === 'bn' ? 'গন্তব্য খালি টেবিল নির্বাচন করুন' : 'Select Destination Free Table'}
                </label>
                <select
                  value={transferTargetId}
                  onChange={(e) => setTransferTargetId(e.target.value)}
                  required
                  className="w-full h-10 px-3 rounded-xl border border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 text-xs font-medium text-slate-900 dark:text-white"
                >
                  <option value="">-- Select Free Table --</option>
                  {tables
                    .filter((t) => t.status === 'available' && String(t._id) !== String(selectedTable._id))
                    .map((t) => (
                      <option key={t._id} value={t._id}>
                        {t.table_number} ({t.zone} - {t.capacity} seats)
                      </option>
                    ))}
                </select>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100 dark:border-zinc-800">
                <button
                  type="button"
                  onClick={() => setIsTransferModalOpen(false)}
                  className="px-4 py-2 rounded-xl border border-slate-200 dark:border-zinc-700 text-xs font-semibold cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-blue-600 text-white text-xs font-bold hover:bg-blue-700 cursor-pointer"
                >
                  Transfer Running Order
                </button>
              </div>
            </form>
          </Card>
        </div>
      )}

      {/* ---------------------------------------------------- */}
      {/* MODAL 4: TABLE DIGITAL QR CODE                       */}
      {/* ---------------------------------------------------- */}
      {isQrModalOpen && selectedTable && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs">
          <Card className="max-w-sm w-full p-6 bg-white dark:bg-[#121215] border-slate-200 dark:border-zinc-800 shadow-2xl rounded-2xl text-center">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-zinc-800 pb-3 mb-4">
              <span className="text-sm font-bold text-slate-900 dark:text-white">
                Digital QR — Table {selectedTable.table_number}
              </span>
              <button
                onClick={() => setIsQrModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-white cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-4 bg-white rounded-2xl inline-block border border-slate-200 shadow-xs mb-3">
              <img
                src={`https://api.qrserver.com/v1/create-qr-code/?size=180x180&data=${encodeURIComponent(
                  `https://shopo.com.bd/menu?table=${selectedTable.table_number}&token=${selectedTable.qr_token || 'DEF'}`
                )}`}
                alt="Table QR"
                className="w-40 h-40 mx-auto"
              />
            </div>

            <div className="text-xs font-bold text-slate-900 dark:text-white">
              Scan to View Menu & Order Online
            </div>
            <div className="text-[11px] text-slate-500 mt-0.5">
              Zone: {selectedTable.zone} • Capacity: {selectedTable.capacity} Seats
            </div>

            <button
              onClick={() => window.print()}
              className="mt-4 w-full py-2.5 rounded-xl bg-slate-900 text-white dark:bg-white dark:text-slate-900 text-xs font-bold cursor-pointer"
            >
              Print Table QR Stand
            </button>
          </Card>
        </div>
      )}

    </div>
  );
}
