import { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useLanguage } from '@/context/LanguageContext';
import { useShop } from '@/context/ShopContext';
import api from '@/services/api';
import toast from 'react-hot-toast';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/components/ui/select';
import ConfirmDialog from '@/components/common/ConfirmDialog';
import {
  LayoutGrid, Plus, Users, ShoppingCart, ArrowLeftRight, Trash2,
  CheckCircle2, QrCode, RefreshCw, X, Utensils, Clock,
  Edit3, Search, MoreVertical, Copy, Printer, Check, Loader2, Receipt, Calendar
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator
} from '@/components/ui/dropdown-menu';

const ZONE_LABELS = {
  indoor: { en: 'Indoor Dining', bn: 'ইনডোর ডাইনিং' },
  rooftop: { en: 'Rooftop Garden', bn: 'রুফটপ গার্ডেন' },
  vip: { en: 'VIP Lounge', bn: 'ভিআইপি লাউঞ্জ' },
  terrace: { en: 'Outdoor Terrace', bn: 'আউটডোর টেরাস' },
  bar: { en: 'Bar Counter', bn: 'বার কাউন্টার' },
  patio: { en: 'Patio', bn: 'প্যাটিও' },
  outdoor: { en: 'Outdoor', bn: 'আউটডোর' }
};

export default function RestaurantTables() {
  const navigate = useNavigate();
  const { lang, formatNumber } = useLanguage();
  const { activeShop } = useShop();

  const [tables, setTables] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedZone, setSelectedZone] = useState('all');
  const [selectedStatus, setSelectedStatus] = useState('all');

  // Loading states for actions
  const [isSavingTable, setIsSavingTable] = useState(false);
  const [isUpdatingTable, setIsUpdatingTable] = useState(false);
  const [isOccupyLoading, setIsOccupyLoading] = useState(false);
  const [isTransferLoading, setIsTransferLoading] = useState(false);
  const [tableActionLoading, setTableActionLoading] = useState({});

  // Deleting Table State (Confirm Dialog)
  const [deletingTable, setDeletingTable] = useState(null);
  const [isDeletingTable, setIsDeletingTable] = useState(false);

  // Modals
  const [isAddTableOpen, setIsAddTableOpen] = useState(false);
  const [isEditTableOpen, setIsEditTableOpen] = useState(false);
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
    redirect_to_pos: true,
  });

  const [transferTargetId, setTransferTargetId] = useState('');

  // Fetch Tables
  const fetchTables = async (showRefresh = false) => {
    try {
      if (showRefresh) setIsRefreshing(true);
      else setIsLoading(true);

      const params = {};
      if (selectedZone !== 'all') params.zone = selectedZone;
      if (selectedStatus !== 'all') params.status = selectedStatus;

      const res = await api.restaurant.tables.list(params);
      if (res?.success) {
        setTables(res.data || []);
      }
    } catch (err) {
      console.error('Failed to load tables:', err);
      toast.error('Failed to load tables');
    } finally {
      setIsLoading(false);
      if (showRefresh) setIsRefreshing(false);
    }
  };

  useEffect(() => {
    fetchTables();
  }, [activeShop, selectedZone, selectedStatus]);

  // Create Table
  const handleCreateTable = async (e) => {
    e.preventDefault();
    if (!tableForm.table_number.trim()) {
      toast.error(lang === 'bn' ? 'টেবিল নম্বর দিন।' : 'Table number is required.');
      return;
    }

    setIsSavingTable(true);
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
    } finally {
      setIsSavingTable(false);
    }
  };

  // Update Table
  const handleUpdateTable = async (e) => {
    e.preventDefault();
    if (!selectedTable?._id) return;
    setIsUpdatingTable(true);
    try {
      const res = await api.restaurant.tables.update(selectedTable._id, tableForm);
      if (res?.success) {
        toast.success(lang === 'bn' ? 'টেবিল আপডেট হয়েছে!' : 'Table updated successfully!');
        setIsEditTableOpen(false);
        setSelectedTable(null);
        fetchTables();
      }
    } catch (err) {
      toast.error(err.message || 'Failed to update table');
    } finally {
      setIsUpdatingTable(false);
    }
  };

  // Open Edit Modal
  const openEditModal = (table) => {
    setSelectedTable(table);
    setTableForm({
      table_number: table.table_number,
      name: table.name || '',
      zone: table.zone || 'indoor',
      capacity: table.capacity || 4,
    });
    setIsEditTableOpen(true);
  };

  // Occupy / Seat Table
  const handleOccupy = async (e) => {
    e.preventDefault();
    if (!selectedTable) return;
    setIsOccupyLoading(true);
    try {
      const res = await api.restaurant.tables.occupy(selectedTable._id, {
        waiter_name: occupyForm.waiter_name,
        guest_count: Number(occupyForm.guest_count) || selectedTable.capacity,
      });
      if (res?.success) {
        toast.success(lang === 'bn' ? 'অতিথি বসানো হয়েছে!' : `Table ${selectedTable.table_number} seated!`);
        setIsOccupyModalOpen(false);
        fetchTables();

        if (occupyForm.redirect_to_pos) {
          navigate(`/restaurant/pos?table=${selectedTable.table_number}&tableId=${selectedTable._id}`);
        }
      }
    } catch (err) {
      toast.error(err.message || 'Failed to occupy table');
    } finally {
      setIsOccupyLoading(false);
    }
  };

  // Free / Clear Table
  const handleFreeTable = async (tableId, tableNum) => {
    const key = `free-${tableId}`;
    setTableActionLoading((prev) => ({ ...prev, [key]: true }));
    try {
      const res = await api.restaurant.tables.free(tableId);
      if (res?.success) {
        toast.success(
          lang === 'bn'
            ? `টেবিল ${tableNum || ''} প্রস্তুত ও খালি করা হয়েছে!`
            : `Table ${tableNum || ''} marked Available!`
        );
        fetchTables();
      }
    } catch (err) {
      toast.error(err.message || 'Failed to clear table');
    } finally {
      setTableActionLoading((prev) => ({ ...prev, [key]: false }));
    }
  };

  // Mark all food items on active order as Ready
  const handleMarkOrderReady = async (orderId, tableNum, tableId) => {
    if (!orderId) return;
    const key = `ready-${tableId || orderId}`;
    setTableActionLoading((prev) => ({ ...prev, [key]: true }));
    try {
      const res = await api.restaurant.kds.updateAllItemsStatus({
        orderId,
        status: 'ready',
      });
      if (res?.success) {
        toast.success(
          lang === 'bn'
            ? `টেবিল ${tableNum || ''}-এর খাবার প্রস্তুত (Ready) হিসেবে চিহ্নিত হয়েছে! 🔔`
            : `Food for Table ${tableNum || ''} marked Ready to Serve! 🔔`
        );
        fetchTables();
      }
    } catch (err) {
      toast.error(err.message || 'Failed to update ready status');
    } finally {
      setTableActionLoading((prev) => ({ ...prev, [key]: false }));
    }
  };

  // Mark all food items on active order as Served
  const handleMarkOrderServed = async (orderId, tableNum, tableId) => {
    if (!orderId) return;
    const key = `serve-${tableId || orderId}`;
    setTableActionLoading((prev) => ({ ...prev, [key]: true }));
    try {
      const res = await api.restaurant.kds.updateAllItemsStatus({
        orderId,
        status: 'served',
      });
      if (res?.success) {
        toast.success(
          lang === 'bn'
            ? `টেবিল ${tableNum || ''}-এর খাবার পরিবেশিত হিসেবে চিহ্নিত হয়েছে! 🍽️`
            : `Food for Table ${tableNum || ''} marked as Served! 🍽️`
        );
        fetchTables();
      }
    } catch (err) {
      toast.error(err.message || 'Failed to update serving status');
    } finally {
      setTableActionLoading((prev) => ({ ...prev, [key]: false }));
    }
  };

  // Transfer Table
  const handleTransfer = async (e) => {
    e.preventDefault();
    if (!selectedTable || !transferTargetId) {
      toast.error(lang === 'bn' ? 'গন্তব্য টেবিল নির্বাচন করুন' : 'Please select destination table');
      return;
    }
    setIsTransferLoading(true);
    try {
      const res = await api.restaurant.tables.transfer({
        sourceTableId: selectedTable._id,
        targetTableId: transferTargetId,
      });
      if (res?.success) {
        toast.success(res.data?.message || 'Table transferred successfully!');
        setIsTransferModalOpen(false);
        fetchTables();
      }
    } catch (err) {
      toast.error(err.message || 'Failed to transfer table');
    } finally {
      setIsTransferLoading(false);
    }
  };

  // Delete Table (Trigger Confirm Modal)
  const handleDeleteTable = (table) => {
    setDeletingTable(table);
  };

  const confirmDeleteTable = async () => {
    if (!deletingTable?._id) return;
    setIsDeletingTable(true);
    try {
      await api.restaurant.tables.delete(deletingTable._id);
      toast.success(lang === 'bn' ? 'টেবিল মুছে ফেলা হয়েছে!' : `Table ${deletingTable.table_number || ''} deleted`);
      setDeletingTable(null);
      fetchTables();
    } catch (err) {
      toast.error(err.message || 'Failed to delete table');
    } finally {
      setIsDeletingTable(false);
    }
  };

  // Stats calculation
  const stats = useMemo(() => {
    const total = tables.length;
    const available = tables.filter(t => t.status === 'available').length;
    const occupied = tables.filter(t => t.status === 'occupied').length;
    const reserved = tables.filter(t => t.status === 'reserved').length;
    const dirty = tables.filter(t => t.status === 'dirty').length;
    const totalCapacity = tables.reduce((sum, t) => sum + (Number(t.capacity) || 0), 0);
    const seatedGuests = tables
      .filter(t => t.status === 'occupied')
      .reduce((sum, t) => sum + (Number(t.current_guest_count) || Number(t.capacity) || 0), 0);

    return { total, available, occupied, reserved, dirty, totalCapacity, seatedGuests };
  }, [tables]);

  // Zone tabs
  const zones = useMemo(() => {
    const counts = { all: tables.length };
    tables.forEach(t => {
      const z = t.zone || 'indoor';
      counts[z] = (counts[z] || 0) + 1;
    });

    return [
      { id: 'all', label: lang === 'bn' ? 'সকল' : 'All Tables', count: counts.all || 0 },
      { id: 'indoor', label: lang === 'bn' ? 'ইনডোর' : 'Indoor', count: counts.indoor || 0 },
      { id: 'rooftop', label: lang === 'bn' ? 'রুফটপ' : 'Rooftop', count: counts.rooftop || 0 },
      { id: 'vip', label: lang === 'bn' ? 'ভিআইপি' : 'VIP Lounge', count: counts.vip || 0 },
      { id: 'terrace', label: lang === 'bn' ? 'টেরাস' : 'Terrace', count: counts.terrace || 0 },
      { id: 'bar', label: lang === 'bn' ? 'বার' : 'Bar Counter', count: counts.bar || 0 },
    ];
  }, [tables, lang]);

  // Filtered tables
  const filteredTables = useMemo(() => {
    return tables.filter((t) => {
      const q = searchQuery.toLowerCase().trim();
      const matchesSearch =
        !q ||
        t.table_number?.toLowerCase().includes(q) ||
        t.name?.toLowerCase().includes(q) ||
        t.waiter_name?.toLowerCase().includes(q) ||
        t.zone?.toLowerCase().includes(q);

      const matchesZone = selectedZone === 'all' || t.zone === selectedZone;
      const matchesStatus = selectedStatus === 'all' || t.status === selectedStatus;

      return matchesSearch && matchesZone && matchesStatus;
    });
  }, [tables, searchQuery, selectedZone, selectedStatus]);

  return (
    <div className="space-y-6 font-sans pb-16">
      
      {/* ---------------------------------------------------- */}
      {/* 1. HEADER & PRIMARY ACTIONS                          */}
      {/* ---------------------------------------------------- */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white tracking-tight flex items-center gap-2">
            <LayoutGrid className="w-5 h-5 text-emerald-600 dark:text-[#00df89]" />
            <span>{lang === 'bn' ? 'টেবিল ও ফ্লোর প্ল্যান' : 'Tables & Floor Plan'}</span>
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-zinc-400 mt-0.5 font-normal">
            {lang === 'bn'
              ? 'লাইভ টেবিল স্ট্যাটাস, অতিথি সিটিং ও পিওএস অর্ডার পরিচালনা করুন।'
              : 'Click any table to seat guests, open POS ticket, or manage status.'}
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={() => fetchTables(true)}
            disabled={isLoading || isRefreshing}
            className="p-2.5 rounded-xl border border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 hover:bg-slate-50 dark:hover:bg-zinc-800 text-slate-700 dark:text-zinc-300 transition-colors cursor-pointer shadow-2xs"
            title="Refresh"
          >
            <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin text-emerald-600' : ''}`} />
          </button>

          <button
            onClick={() => {
              setTableForm({ table_number: '', name: '', zone: 'indoor', capacity: 4 });
              setIsAddTableOpen(true);
            }}
            className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-[#00df89] hover:bg-[#00c578] text-[#011812] font-bold text-xs sm:text-sm shadow-xs transition-all cursor-pointer active:scale-95"
          >
            <Plus className="w-4 h-4 stroke-[2.5]" />
            <span>{lang === 'bn' ? 'নতুন টেবিল' : 'Add Table'}</span>
          </button>
        </div>
      </div>

      {/* ---------------------------------------------------- */}
      {/* 2. TOP METRIC CARDS                                  */}
      {/* ---------------------------------------------------- */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5 sm:gap-4">
        
        {/* Total Tables */}
        <div className="p-4 sm:p-5 bg-white dark:bg-zinc-900 border border-slate-200/80 dark:border-zinc-800 shadow-xs rounded-2xl">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 dark:text-zinc-400">
              {lang === 'bn' ? 'মোট টেবিল' : 'Total Tables'}
            </span>
            <div className="w-8 h-8 rounded-xl bg-blue-500/10 text-blue-600 dark:text-blue-400 flex items-center justify-center">
              <LayoutGrid className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2.5">
            {isLoading ? (
              <div className="space-y-1.5 py-0.5">
                <Skeleton className="h-7 w-24 rounded-lg" />
                <Skeleton className="h-3.5 w-20 rounded-md" />
              </div>
            ) : (
              <>
                <div className="text-xl sm:text-2xl font-bold font-mono text-slate-900 dark:text-white tracking-tight flex items-baseline gap-2">
                  <span>{formatNumber ? formatNumber(stats.total) : stats.total}</span>
                  <span className="text-xs font-semibold text-slate-500 dark:text-zinc-400 font-sans">
                    ({formatNumber ? formatNumber(stats.totalCapacity) : stats.totalCapacity} {lang === 'bn' ? 'সিট' : 'seats'})
                  </span>
                </div>
                <div className="flex items-center gap-1.5 mt-1 text-[11px] text-slate-500 dark:text-zinc-400">
                  <span className="font-semibold text-blue-600 dark:text-blue-400">
                    {zones.length - 1} {lang === 'bn' ? 'টি জোন সক্রিয়' : 'zones active'}
                  </span>
                </div>
              </>
            )}
          </div>
        </div>

        {/* Available (Free) */}
        <div className="p-4 sm:p-5 bg-white dark:bg-zinc-900 border border-slate-200/80 dark:border-zinc-800 shadow-xs rounded-2xl">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 dark:text-zinc-400">
              {lang === 'bn' ? 'খালি / প্রস্তুত' : 'Available (Free)'}
            </span>
            <div className="w-8 h-8 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-[#00df89] flex items-center justify-center">
              <CheckCircle2 className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2.5">
            {isLoading ? (
              <div className="space-y-1.5 py-0.5">
                <Skeleton className="h-7 w-24 rounded-lg" />
                <Skeleton className="h-3.5 w-28 rounded-md" />
              </div>
            ) : (
              <>
                <div className="text-xl sm:text-2xl font-bold font-mono text-emerald-600 dark:text-[#00df89] tracking-tight flex items-baseline gap-2">
                  <span>{formatNumber ? formatNumber(stats.available) : stats.available}</span>
                  <span className="text-xs font-semibold text-emerald-600 dark:text-emerald-400 font-sans">
                    ({stats.total > 0 ? Math.round((stats.available / stats.total) * 100) : 0}%)
                  </span>
                </div>
                <div className="flex items-center gap-1.5 mt-1 text-[11px] text-emerald-600 dark:text-emerald-400 font-medium">
                  <span>{lang === 'bn' ? 'অতিথি বসানোর জন্য তৈরি' : `${stats.available} free ready for walk-ins`}</span>
                </div>
              </>
            )}
          </div>
        </div>

        {/* Occupied (Dining) */}
        <div className="p-4 sm:p-5 bg-white dark:bg-zinc-900 border border-slate-200/80 dark:border-zinc-800 shadow-xs rounded-2xl">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 dark:text-zinc-400">
              {lang === 'bn' ? 'চলমান (Occupied)' : 'Occupied (Dining)'}
            </span>
            <div className="w-8 h-8 rounded-xl bg-rose-500/10 text-rose-600 dark:text-rose-400 flex items-center justify-center">
              <Users className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2.5">
            {isLoading ? (
              <div className="space-y-1.5 py-0.5">
                <Skeleton className="h-7 w-24 rounded-lg" />
                <Skeleton className="h-3.5 w-28 rounded-md" />
              </div>
            ) : (
              <>
                <div className="text-xl sm:text-2xl font-bold font-mono text-rose-600 dark:text-rose-400 tracking-tight flex items-baseline gap-2">
                  <span>{formatNumber ? formatNumber(stats.occupied) : stats.occupied}</span>
                  <span className="text-xs font-semibold text-rose-600 dark:text-rose-400 font-sans">
                    ({stats.total > 0 ? Math.round((stats.occupied / stats.total) * 100) : 0}%)
                  </span>
                </div>
                <div className="flex items-center gap-1.5 mt-1 text-[11px] text-slate-500 dark:text-zinc-400">
                  <span className="font-semibold text-rose-600 dark:text-rose-400">
                    {formatNumber ? formatNumber(stats.seatedGuests) : stats.seatedGuests} {lang === 'bn' ? 'জন বসা' : 'seated guests'}
                  </span>
                </div>
              </>
            )}
          </div>
        </div>

        {/* Reserved / Clean */}
        <div className="p-4 sm:p-5 bg-white dark:bg-zinc-900 border border-slate-200/80 dark:border-zinc-800 shadow-xs rounded-2xl">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 dark:text-zinc-400">
              {lang === 'bn' ? 'বুকড / সার্ভিস' : 'Reserved / Clean'}
            </span>
            <div className="w-8 h-8 rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center">
              <Clock className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2.5">
            {isLoading ? (
              <div className="space-y-1.5 py-0.5">
                <Skeleton className="h-7 w-24 rounded-lg" />
                <Skeleton className="h-3.5 w-28 rounded-md" />
              </div>
            ) : (
              <>
                <div className="text-xl sm:text-2xl font-bold font-mono text-amber-600 dark:text-amber-400 tracking-tight">
                  {formatNumber ? formatNumber(stats.reserved + stats.dirty) : (stats.reserved + stats.dirty)}
                </div>
                <div className="flex items-center gap-2 mt-1 text-[11px]">
                  <span className="text-amber-500 font-semibold">{stats.reserved} reserved</span>
                  <span className="text-slate-500 dark:text-zinc-400 font-semibold">{stats.dirty} dirty</span>
                </div>
              </>
            )}
          </div>
        </div>

      </div>

      {/* ---------------------------------------------------- */}
      {/* 3. CLEAN TOOLBAR: TABS & SEARCH                      */}
      {/* ---------------------------------------------------- */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white dark:bg-zinc-900 p-2 sm:p-2.5 rounded-2xl border border-slate-200/80 dark:border-zinc-800 shadow-2xs">
        
        {/* Zone Tabs */}
        <div className="flex items-center gap-1 overflow-x-auto scrollbar-none pb-0.5">
          {zones.map((z) => {
            const isSelected = selectedZone === z.id;
            return (
              <button
                key={z.id}
                onClick={() => setSelectedZone(z.id)}
                className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-colors cursor-pointer flex items-center gap-1.5 ${
                  isSelected
                    ? 'bg-slate-900 text-white dark:bg-white dark:text-slate-900 shadow-2xs'
                    : 'text-slate-600 dark:text-zinc-400 hover:bg-slate-100 dark:hover:bg-zinc-800'
                }`}
              >
                <span>{z.label}</span>
                <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-mono ${
                  isSelected
                    ? 'bg-white/20 dark:bg-black/20 text-white dark:text-slate-900'
                    : 'bg-slate-200 dark:bg-zinc-800 text-slate-600 dark:text-zinc-400'
                }`}>
                  {isLoading ? <Skeleton className="h-2.5 w-3 inline-block rounded" /> : z.count}
                </span>
              </button>
            );
          })}
        </div>

        {/* Search & Status Filter */}
        <div className="flex items-center gap-2">
          
          <div className="relative flex-1 sm:w-56">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={lang === 'bn' ? 'টেবিল খুঁজুন...' : 'Search table...'}
              className="w-full pl-8 pr-7 py-1.5 rounded-xl bg-slate-100 dark:bg-zinc-800/80 border border-transparent focus:border-slate-300 dark:focus:border-zinc-700 text-xs text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none"
            />
            {searchQuery && (
              <button onClick={() => setSearchQuery('')} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400">
                <X className="w-3 h-3" />
              </button>
            )}
          </div>

          <div className="w-36">
            <Select value={selectedStatus} onValueChange={setSelectedStatus}>
              <SelectTrigger className="h-8.5 text-xs font-semibold rounded-xl bg-slate-100 dark:bg-zinc-800/80 border-transparent text-slate-700 dark:text-zinc-300">
                <SelectValue placeholder={lang === 'bn' ? 'সকল স্ট্যাটাস' : 'All Status'} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">
                  <span>{lang === 'bn' ? 'সকল স্ট্যাটাস' : 'All Status'}</span>
                </SelectItem>
                <SelectItem value="available">
                  <div className="flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-emerald-500 shrink-0" />
                    <span>{lang === 'bn' ? 'খালি' : 'Free'}</span>
                  </div>
                </SelectItem>
                <SelectItem value="occupied">
                  <div className="flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-rose-500 shrink-0" />
                    <span>{lang === 'bn' ? 'চলমান' : 'Occupied'}</span>
                  </div>
                </SelectItem>
                <SelectItem value="reserved">
                  <div className="flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-amber-500 shrink-0" />
                    <span>{lang === 'bn' ? 'বুকড' : 'Reserved'}</span>
                  </div>
                </SelectItem>
                <SelectItem value="dirty">
                  <div className="flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-slate-400 shrink-0" />
                    <span>{lang === 'bn' ? 'পরিষ্কার প্রয়োজন' : 'Needs Clean'}</span>
                  </div>
                </SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

      </div>

      {/* ---------------------------------------------------- */}
      {/* 4. VISUAL TABLE CARDS GRID                           */}
      {/* ---------------------------------------------------- */}
      {isLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 2xl:grid-cols-5 gap-3.5">
          {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((i) => (
            <div key={i} className="p-4 rounded-2xl border border-slate-200/80 dark:border-zinc-800 bg-white dark:bg-zinc-900 space-y-3 shadow-2xs">
              <div className="flex justify-between items-center">
                <Skeleton className="h-6 w-16 rounded-md" />
                <Skeleton className="h-4 w-12 rounded-full" />
              </div>
              <div className="flex justify-between items-center pt-2">
                <Skeleton className="h-4 w-20 rounded" />
                <Skeleton className="h-4 w-14 rounded-full" />
              </div>
              <Skeleton className="h-10 w-full rounded-xl mt-3" />
            </div>
          ))}
        </div>
      ) : filteredTables.length === 0 ? (
        <div className="py-16 text-center bg-white dark:bg-zinc-900 rounded-2xl border border-dashed border-slate-200 dark:border-zinc-800 p-6">
          <LayoutGrid className="w-10 h-10 mx-auto text-slate-300 dark:text-zinc-600 mb-2" />
          <div className="text-sm font-bold text-slate-900 dark:text-white">
            {lang === 'bn' ? 'কোনো টেবিল পাওয়া যায়নি' : 'No Tables Found'}
          </div>
          <p className="text-xs text-slate-500 mt-1">
            {searchQuery ? 'Try clearing your search.' : 'Add your first table to get started.'}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 2xl:grid-cols-5 gap-3.5">
          {filteredTables.map((table) => {
            const isOccupied = table.status === 'occupied';
            const isReserved = table.status === 'reserved';
            const isDirty = table.status === 'dirty';
            const isAvailable = table.status === 'available';

            const zoneName = ZONE_LABELS[table.zone]?.[lang === 'bn' ? 'bn' : 'en'] || table.zone;
            const activeOrder = typeof table.active_order_id === 'object' && table.active_order_id ? table.active_order_id : null;
            const orderItems = activeOrder?.items || [];
            const hasActiveOrder = Boolean(activeOrder && orderItems.length > 0);
            const isOrderPaid = activeOrder?.payment_status === 'paid';
            const orderTotal = activeOrder?.total_amount || 0;
            const isFoodServed = hasActiveOrder && (activeOrder?.status === 'served' || activeOrder?.status === 'completed' || orderItems.every(it => it.status === 'served'));
            const isFoodReady = hasActiveOrder && !isFoodServed && (activeOrder?.status === 'ready' || orderItems.every(it => it.status === 'ready' || it.status === 'served'));
            const isFromReservation = Boolean(table.is_from_reservation || table.customer_name);

            return (
              <div
                key={table._id}
                className={`p-4 rounded-2xl border transition-all duration-150 relative bg-white dark:bg-zinc-900 shadow-2xs hover:shadow-md flex flex-col justify-between ${
                  isOccupied
                    ? 'border-rose-500/40 dark:border-rose-500/30'
                    : isReserved
                    ? 'border-amber-500/40 dark:border-amber-500/30'
                    : isDirty
                    ? 'border-slate-300 dark:border-zinc-700 bg-slate-50/60 dark:bg-zinc-850'
                    : 'border-emerald-500/40 dark:border-emerald-500/30 hover:border-emerald-500'
                }`}
              >
                {/* Top: Table Number & Status Pill */}
                <div>
                  <div className="flex items-start justify-between">
                    
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-lg font-black text-slate-900 dark:text-white tracking-tight">
                          {table.table_number}
                        </span>
                        <span className="text-[10px] font-semibold uppercase px-2 py-0.5 rounded-md bg-slate-100 dark:bg-zinc-800 text-slate-600 dark:text-zinc-400">
                          {zoneName}
                        </span>
                      </div>
                      {table.name ? (
                        <div className="text-[11px] text-slate-500 dark:text-zinc-400 truncate mt-0.5">
                          {table.name}
                        </div>
                      ) : null}
                    </div>

                    {/* Status Pill */}
                    <div className={`px-2 py-0.5 rounded-full text-[10px] font-bold flex items-center gap-1 ${
                      isOccupied
                        ? 'bg-rose-50 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400 border border-rose-200 dark:border-rose-900'
                        : isReserved
                        ? 'bg-amber-50 dark:bg-amber-950/40 text-amber-600 dark:text-amber-400 border border-amber-200 dark:border-amber-900'
                        : isDirty
                        ? 'bg-slate-100 dark:bg-zinc-800 text-slate-600 dark:text-zinc-400'
                        : 'bg-emerald-50 dark:bg-emerald-950/40 text-[#00a86b] dark:text-[#00df89] border border-emerald-200 dark:border-emerald-900'
                    }`}>
                      <span className={`w-1.5 h-1.5 rounded-full ${
                        isOccupied ? 'bg-rose-500' : isReserved ? 'bg-amber-500' : isDirty ? 'bg-slate-400' : 'bg-[#00df89]'
                      }`} />
                      <span>
                        {isOccupied
                          ? (lang === 'bn' ? 'চলমান' : 'Occupied')
                          : isReserved
                          ? (lang === 'bn' ? 'বুকড' : 'Reserved')
                          : isDirty
                          ? (lang === 'bn' ? 'পরিষ্কার' : 'Dirty')
                          : (lang === 'bn' ? 'খালি' : 'Available')}
                      </span>
                    </div>

                  </div>

                  {/* Middle Info: Capacity & Seated info */}
                  <div className="mt-3 py-2 px-2.5 rounded-xl bg-slate-50 dark:bg-zinc-800/50 text-xs space-y-1">
                    <div className="flex items-center justify-between text-slate-600 dark:text-zinc-400">
                      <span className="flex items-center gap-1.5">
                        <Users className="w-3.5 h-3.5 text-slate-400" />
                        <span>{lang === 'bn' ? 'আসন' : 'Capacity'}:</span>
                      </span>
                      <span className="font-bold text-slate-900 dark:text-white">
                        {table.capacity} {lang === 'bn' ? 'সিট' : 'Seats'}
                      </span>
                    </div>

                    {isOccupied && (
                      <>
                        <div className="flex items-center justify-between pt-1 border-t border-slate-200/60 dark:border-zinc-700/60 text-slate-700 dark:text-zinc-300 font-medium">
                          <span>{lang === 'bn' ? 'বসা অতিথি' : 'Seated'}:</span>
                          <span className="font-bold text-slate-900 dark:text-white">
                            {table.current_guest_count || table.capacity} guests {table.waiter_name ? `(${table.waiter_name})` : ''}
                          </span>
                        </div>

                        {/* From Reservation Banner if seated from booking */}
                        {isFromReservation && (
                          <div className="flex items-center justify-between pt-1 border-t border-slate-200/60 dark:border-zinc-700/60 text-purple-600 dark:text-purple-400 font-semibold text-[11px]">
                            <span className="flex items-center gap-1"><Calendar className="w-3 h-3 text-purple-500" /> {lang === 'bn' ? 'রিজার্ভেশন:' : 'Reservation:'}</span>
                            <span className="truncate max-w-[130px] font-bold text-slate-800 dark:text-zinc-200">{table.customer_name || 'Guest'}</span>
                          </div>
                        )}

                        {/* Bill Amount & Payment Status Pill */}
                        <div className="flex items-center justify-between pt-1 border-t border-slate-200/60 dark:border-zinc-700/60 text-xs">
                          <span className="font-medium text-slate-600 dark:text-zinc-400">
                            {lang === 'bn' ? 'মোট বিল:' : 'Bill Total:'}
                          </span>
                          <div className="flex items-center gap-1.5">
                            <span className="font-mono font-bold text-slate-900 dark:text-white">
                              ৳ {orderTotal.toLocaleString()}
                            </span>
                            {hasActiveOrder && (
                              <span
                                className={`px-1.5 py-0.2 rounded-md text-[10px] font-bold ${
                                  isOrderPaid
                                    ? 'bg-emerald-500/15 text-emerald-600 dark:text-[#00df89]'
                                    : 'bg-rose-500/15 text-rose-600 dark:text-rose-400'
                                }`}
                              >
                                {isOrderPaid ? (lang === 'bn' ? '✓ পেইড' : '✓ Paid') : (lang === 'bn' ? '⏳ আনপেইড' : '⏳ Unpaid')}
                              </span>
                            )}
                          </div>
                        </div>

                        {/* Food Serving Status */}
                        <div className="flex items-center justify-between pt-1 border-t border-slate-200/60 dark:border-zinc-700/60 text-xs">
                          <span className="font-medium text-slate-600 dark:text-zinc-400 flex items-center gap-1">
                            <span>{lang === 'bn' ? 'খাবার:' : 'Food:'}</span>
                          </span>
                          <div className="flex items-center gap-1">
                            {!hasActiveOrder ? (
                              <span className="px-2 py-0.5 rounded-md text-[10px] font-semibold bg-slate-100 dark:bg-zinc-800 text-slate-500 dark:text-zinc-400 border border-slate-200 dark:border-zinc-700">
                                {lang === 'bn' ? 'অর্ডার নেই' : 'No Order Yet'}
                              </span>
                            ) : (
                              <span
                                className={`px-1.5 py-0.2 rounded-md text-[10px] font-bold ${
                                  isFoodServed
                                    ? 'bg-emerald-500/15 text-emerald-600 dark:text-[#00df89]'
                                    : isFoodReady
                                    ? 'bg-blue-500/15 text-blue-600 dark:text-blue-400 animate-pulse'
                                    : 'bg-amber-500/15 text-amber-600 dark:text-amber-400'
                                }`}
                              >
                                {isFoodServed
                                  ? (lang === 'bn' ? '🍽️ পরিবেশিত' : '🍽️ Served')
                                  : isFoodReady
                                  ? (lang === 'bn' ? '🔔 রেডি' : '🔔 Ready')
                                  : (lang === 'bn' ? '🍳 রান্না হচ্ছে' : '🍳 Cooking')}
                              </span>
                            )}

                            {/* Quick 1-Click State Buttons */}
                            {hasActiveOrder && !isFoodServed && (
                              <div className="flex items-center gap-1 ml-1">
                                {!isFoodReady && (
                                  <button
                                    type="button"
                                    disabled={tableActionLoading[`ready-${table._id}`]}
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      handleMarkOrderReady(activeOrder._id, table.table_number, table._id);
                                    }}
                                    className="px-1.5 py-0.5 rounded-md bg-blue-50 hover:bg-blue-100 dark:bg-blue-950/50 dark:hover:bg-blue-900/60 text-blue-600 dark:text-blue-400 text-[9px] font-bold border border-blue-200 dark:border-blue-800 cursor-pointer transition-colors flex items-center gap-1 disabled:opacity-50"
                                    title="Quick mark ready"
                                  >
                                    {tableActionLoading[`ready-${table._id}`] ? (
                                      <Loader2 className="w-2.5 h-2.5 animate-spin" />
                                    ) : (
                                      <span>🔔 {lang === 'bn' ? 'রেডি' : 'Ready'}</span>
                                    )}
                                  </button>
                                )}
                                <button
                                  type="button"
                                  disabled={tableActionLoading[`serve-${table._id}`]}
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleMarkOrderServed(activeOrder._id, table.table_number, table._id);
                                  }}
                                  className="px-1.5 py-0.5 rounded-md bg-emerald-50 hover:bg-emerald-100 dark:bg-emerald-950/50 dark:hover:bg-emerald-900/60 text-emerald-600 dark:text-[#00df89] text-[9px] font-bold border border-emerald-200 dark:border-emerald-800 cursor-pointer transition-colors flex items-center gap-1 disabled:opacity-50"
                                  title="Quick mark served"
                                >
                                  {tableActionLoading[`serve-${table._id}`] ? (
                                    <Loader2 className="w-2.5 h-2.5 animate-spin" />
                                  ) : (
                                    <span>🍽️ {lang === 'bn' ? 'সার্ভ' : 'Serve'}</span>
                                  )}
                                </button>
                              </div>
                            )}
                          </div>
                        </div>
                      </>
                    )}
                  </div>
                </div>

                {/* Bottom Primary Action Button & Context Menu */}
                <div className="mt-3.5 pt-2.5 border-t border-slate-100 dark:border-zinc-800/80 flex items-center gap-2">
                  
                  {/* Available state -> Take order */}
                  {isAvailable && (
                    <button
                      onClick={() => navigate(`/restaurant/pos?table=${table.table_number}&tableId=${table._id}`)}
                      className="flex-1 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs transition-colors cursor-pointer flex items-center justify-center gap-1.5 shadow-2xs"
                    >
                      <ShoppingCart className="w-3.5 h-3.5" />
                      <span>{lang === 'bn' ? 'অর্ডার নিন' : 'Take Order'}</span>
                    </button>
                  )}

                  {/* Occupied state */}
                  {isOccupied && (
                    <>
                      {!hasActiveOrder ? (
                        <div className="flex-1 flex items-center gap-1.5">
                          <button
                            onClick={() => navigate(`/restaurant/pos?table=${table.table_number}&tableId=${table._id}`)}
                            className="flex-1 py-2 rounded-xl bg-orange-500 hover:bg-orange-600 active:scale-[0.98] text-white font-bold text-xs transition-colors cursor-pointer flex items-center justify-center gap-1.5 shadow-2xs"
                            title="Take food order for this seated table"
                          >
                            <ShoppingCart className="w-3.5 h-3.5" />
                            <span>{lang === 'bn' ? '+ খাবার অর্ডার নিন' : '+ Take Food Order'}</span>
                          </button>

                          <button
                            disabled={tableActionLoading[`free-${table._id}`]}
                            onClick={() => handleFreeTable(table._id, table.table_number)}
                            className="p-2 rounded-xl border border-slate-200 dark:border-zinc-800 text-slate-500 hover:text-rose-600 hover:bg-rose-500/10 cursor-pointer disabled:opacity-50 transition-colors"
                            title={lang === 'bn' ? 'টেবিল ছাড়ুন' : 'Free Table'}
                          >
                            {tableActionLoading[`free-${table._id}`] ? (
                              <Loader2 className="w-3.5 h-3.5 animate-spin" />
                            ) : (
                              <X className="w-3.5 h-3.5" />
                            )}
                          </button>
                        </div>
                      ) : isFoodReady ? (
                        <div className="flex-1 flex items-center gap-1.5">
                          <button
                            disabled={tableActionLoading[`serve-${table._id}`]}
                            onClick={() => {
                              const orderId = activeOrder?._id || (typeof table.active_order_id === 'string' ? table.active_order_id : '');
                              handleMarkOrderServed(orderId, table.table_number, table._id);
                            }}
                            className="flex-1 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs transition-colors cursor-pointer flex items-center justify-center gap-1.5 shadow-2xs animate-pulse disabled:opacity-50"
                            title={lang === 'bn' ? 'খাবার টেবিলে পরিবেশন করুন' : 'Mark Food as Served to Guests'}
                          >
                            {tableActionLoading[`serve-${table._id}`] ? (
                              <Loader2 className="w-3.5 h-3.5 animate-spin" />
                            ) : (
                              <Utensils className="w-3.5 h-3.5" />
                            )}
                            <span>{lang === 'bn' ? 'খাবার পরিবেশন করুন' : 'Serve Food'}</span>
                          </button>

                          <button
                            onClick={() => {
                              const orderId = activeOrder?._id || (typeof table.active_order_id === 'string' ? table.active_order_id : '');
                              navigate(`/restaurant/pos?table=${table.table_number}&tableId=${table._id}${orderId ? `&orderId=${orderId}` : ''}`);
                            }}
                            className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-slate-700 dark:text-zinc-200 font-bold text-xs transition-colors cursor-pointer flex items-center justify-center shadow-2xs"
                            title={lang === 'bn' ? 'বিল / পেমেন্ট' : 'Bill / POS'}
                          >
                            <Receipt className="w-4 h-4" />
                          </button>
                        </div>
                      ) : !isOrderPaid ? (
                        <button
                          onClick={() => {
                            const orderId = activeOrder?._id || (typeof table.active_order_id === 'string' ? table.active_order_id : '');
                            navigate(`/restaurant/pos?table=${table.table_number}&tableId=${table._id}${orderId ? `&orderId=${orderId}` : ''}`);
                          }}
                          className="flex-1 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs transition-colors cursor-pointer flex items-center justify-center gap-1.5 shadow-2xs"
                        >
                          <Receipt className="w-3.5 h-3.5" />
                          <span>
                            {lang === 'bn'
                              ? `বিল পরিশোধ (${orderTotal.toLocaleString()}৳)`
                              : `Collect Payment (৳${orderTotal.toLocaleString()})`}
                          </span>
                        </button>
                      ) : (
                        <div className="flex-1 flex items-center gap-1.5">
                          <button
                            onClick={() => {
                              const orderId = activeOrder?._id || (typeof table.active_order_id === 'string' ? table.active_order_id : '');
                              navigate(`/restaurant/pos?table=${table.table_number}&tableId=${table._id}${orderId ? `&orderId=${orderId}` : ''}`);
                            }}
                            className="flex-1 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs transition-colors cursor-pointer flex items-center justify-center gap-1 shadow-2xs"
                            title={lang === 'bn' ? 'অর্ডার যোগ / পরিবর্তন' : 'Add more items or update'}
                          >
                            <Plus className="w-3.5 h-3.5" />
                            <span>{lang === 'bn' ? 'অর্ডার যোগ' : 'Add More'}</span>
                          </button>

                          <button
                            disabled={tableActionLoading[`free-${table._id}`]}
                            onClick={() => handleFreeTable(table._id, table.table_number)}
                            className="flex-1 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs transition-colors cursor-pointer flex items-center justify-center gap-1 shadow-2xs disabled:opacity-50"
                            title={lang === 'bn' ? 'টেবিল খালি করুন' : 'Mark table ready & free'}
                          >
                            {tableActionLoading[`free-${table._id}`] ? (
                              <Loader2 className="w-3.5 h-3.5 animate-spin" />
                            ) : (
                              <CheckCircle2 className="w-3.5 h-3.5" />
                            )}
                            <span>{lang === 'bn' ? 'টেবিল ছাড়ুন' : 'Free Table'}</span>
                          </button>
                        </div>
                      )}
                    </>
                  )}

                  {isDirty && (
                    <button
                      disabled={tableActionLoading[`free-${table._id}`]}
                      onClick={() => handleFreeTable(table._id, table.table_number)}
                      className="flex-1 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs transition-colors cursor-pointer flex items-center justify-center gap-1.5 shadow-2xs disabled:opacity-50"
                    >
                      {tableActionLoading[`free-${table._id}`] ? (
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      ) : (
                        <CheckCircle2 className="w-3.5 h-3.5" />
                      )}
                      <span>{lang === 'bn' ? 'টেবিল ফ্রি করুন' : 'Mark Ready'}</span>
                    </button>
                  )}

                  {isReserved && (
                    <button
                      onClick={() => {
                        setSelectedTable(table);
                        setOccupyForm({ waiter_name: '', guest_count: table.capacity, redirect_to_pos: true });
                        setIsOccupyModalOpen(true);
                      }}
                      className="flex-1 py-2 rounded-xl bg-amber-500 hover:bg-amber-600 text-white font-bold text-xs transition-colors cursor-pointer flex items-center justify-center gap-1.5 shadow-2xs"
                    >
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      <span>{lang === 'bn' ? 'অতিথি বসান' : 'Check-In'}</span>
                    </button>
                  )}

                  {/* 3-Dots Dropdown Menu */}
                  <DropdownMenu>
                    <DropdownMenuTrigger className="p-2 rounded-xl hover:bg-slate-100 dark:hover:bg-zinc-800 text-slate-500 cursor-pointer">
                      <MoreVertical className="w-4 h-4" />
                    </DropdownMenuTrigger>
                    
                    <DropdownMenuContent align="end" width="w-48">
                      {isAvailable && (
                        <DropdownMenuItem onClick={() => {
                          setSelectedTable(table);
                          setOccupyForm({ waiter_name: '', guest_count: table.capacity, redirect_to_pos: false });
                          setIsOccupyModalOpen(true);
                        }}>
                          <Users className="w-3.5 h-3.5 text-emerald-600" />
                          <span>{lang === 'bn' ? 'শুধু অতিথি বসান' : 'Seat Guests'}</span>
                        </DropdownMenuItem>
                      )}

                      {isOccupied && (
                        <>
                          {activeOrder && !isFoodServed && !isFoodReady && (
                            <DropdownMenuItem onClick={() => handleMarkOrderReady(activeOrder._id, table.table_number, table._id)}>
                              <CheckCircle2 className="w-3.5 h-3.5 text-blue-600" />
                              <span>{lang === 'bn' ? 'খাবার রেডি চিহ্নিত করুন' : 'Mark Food as Ready'}</span>
                            </DropdownMenuItem>
                          )}

                          {activeOrder && !isFoodServed && (
                            <DropdownMenuItem onClick={() => handleMarkOrderServed(activeOrder._id, table.table_number, table._id)}>
                              <Utensils className="w-3.5 h-3.5 text-emerald-600" />
                              <span>{lang === 'bn' ? 'খাবার পরিবেশিত চিহ্নিত করুন' : 'Mark Food as Served'}</span>
                            </DropdownMenuItem>
                          )}

                          <DropdownMenuItem onClick={() => {
                            setSelectedTable(table);
                            setTransferTargetId('');
                            setIsTransferModalOpen(true);
                          }}>
                            <ArrowLeftRight className="w-3.5 h-3.5 text-blue-500" />
                            <span>{lang === 'bn' ? 'টেবিল ট্রান্সফার' : 'Transfer Table'}</span>
                          </DropdownMenuItem>

                          <DropdownMenuItem onClick={() => handleFreeTable(table._id, table.table_number)}>
                            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
                            <span>{lang === 'bn' ? 'টেবিল ফ্রি করুন' : 'Force Free Table'}</span>
                          </DropdownMenuItem>
                        </>
                      )}

                      <DropdownMenuItem onClick={() => {
                        setSelectedTable(table);
                        setIsQrModalOpen(true);
                      }}>
                        <QrCode className="w-3.5 h-3.5 text-purple-500" />
                        <span>{lang === 'bn' ? 'কিউআর কোড' : 'Table QR Code'}</span>
                      </DropdownMenuItem>

                      <DropdownMenuItem onClick={() => openEditModal(table)}>
                        <Edit3 className="w-3.5 h-3.5 text-slate-500" />
                        <span>{lang === 'bn' ? 'এডিট করুন' : 'Edit Details'}</span>
                      </DropdownMenuItem>

                      <DropdownMenuSeparator />

                      <DropdownMenuItem
                        variant="danger"
                        onClick={() => handleDeleteTable(table)}
                      >
                        <Trash2 className="w-3.5 h-3.5 text-rose-500" />
                        <span>{lang === 'bn' ? 'টেবিল মুছুন' : 'Delete Table'}</span>
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>

                </div>

              </div>
            );
          })}
        </div>
      )}

      {/* ---------------------------------------------------- */}
      {/* MODAL 1: ADD NEW TABLE                               */}
      {/* ---------------------------------------------------- */}
      {isAddTableOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs">
          <div className="max-w-md w-full p-6 bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 shadow-2xl rounded-2xl animate-in fade-in zoom-in-95 duration-100">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-zinc-800 pb-3 mb-4">
              <h2 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <Plus className="w-4 h-4 text-emerald-600" />
                <span>{lang === 'bn' ? 'নতুন টেবিল তৈরি' : 'Add New Table'}</span>
              </h2>
              <button onClick={() => setIsAddTableOpen(false)} className="text-slate-400 hover:text-slate-600 cursor-pointer">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreateTable} className="space-y-4 text-xs">
              <div>
                <label className="font-semibold text-slate-700 dark:text-zinc-300 block mb-1">
                  {lang === 'bn' ? 'টেবিল নম্বর *' : 'Table Number *'}
                </label>
                <Input
                  required
                  placeholder="e.g. T-01, Rooftop-2, VIP-1"
                  value={tableForm.table_number}
                  onChange={(e) => setTableForm({ ...tableForm, table_number: e.target.value })}
                  className="h-10 text-xs font-mono font-bold"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-semibold text-slate-700 dark:text-zinc-300 block mb-1">
                    {lang === 'bn' ? 'জোন' : 'Floor Zone'}
                  </label>
                  <select
                    value={tableForm.zone}
                    onChange={(e) => setTableForm({ ...tableForm, zone: e.target.value })}
                    className="w-full h-10 px-3 rounded-xl border border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 text-xs font-semibold text-slate-900 dark:text-white"
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
                    {lang === 'bn' ? 'আসন ক্ষমতা' : 'Seat Capacity'}
                  </label>
                  <Input
                    type="number"
                    min="1"
                    max="50"
                    required
                    value={tableForm.capacity}
                    onChange={(e) => setTableForm({ ...tableForm, capacity: Number(e.target.value) || 1 })}
                    className="h-10 text-xs font-mono font-bold"
                  />
                </div>
              </div>

              <div>
                <label className="font-semibold text-slate-700 dark:text-zinc-300 block mb-1">
                  {lang === 'bn' ? 'লেবেল / নাম (ঐচ্ছিক)' : 'Nickname (Optional)'}
                </label>
                <Input
                  placeholder="e.g. Window Corner"
                  value={tableForm.name}
                  onChange={(e) => setTableForm({ ...tableForm, name: e.target.value })}
                  className="h-10 text-xs"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100 dark:border-zinc-800">
                <button
                  type="button"
                  disabled={isSavingTable}
                  onClick={() => setIsAddTableOpen(false)}
                  className="px-4 py-2 rounded-xl border border-slate-200 dark:border-zinc-700 text-xs font-semibold cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {lang === 'bn' ? 'বাতিল' : 'Cancel'}
                </button>
                <button
                  type="submit"
                  disabled={isSavingTable}
                  className="px-4 py-2 rounded-xl bg-[#00df89] text-[#011812] text-xs font-bold shadow-xs hover:bg-[#00c578] cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed flex items-center gap-1.5"
                >
                  {isSavingTable && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                  <span>{isSavingTable ? (lang === 'bn' ? 'সংরক্ষণ হচ্ছে...' : 'Saving...') : (lang === 'bn' ? 'সংরক্ষণ করুন' : 'Save Table')}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ---------------------------------------------------- */}
      {/* MODAL 2: EDIT TABLE DETAILS                          */}
      {/* ---------------------------------------------------- */}
      {isEditTableOpen && selectedTable && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs">
          <div className="max-w-md w-full p-6 bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 shadow-2xl rounded-2xl animate-in fade-in zoom-in-95 duration-100">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-zinc-800 pb-3 mb-4">
              <h2 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <Edit3 className="w-4 h-4 text-blue-500" />
                <span>Edit Table {selectedTable.table_number}</span>
              </h2>
              <button onClick={() => setIsEditTableOpen(false)} className="text-slate-400 hover:text-slate-600 cursor-pointer">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleUpdateTable} className="space-y-4 text-xs">
              <div>
                <label className="font-semibold text-slate-700 dark:text-zinc-300 block mb-1">
                  {lang === 'bn' ? 'টেবিল নম্বর *' : 'Table Number *'}
                </label>
                <Input
                  required
                  value={tableForm.table_number}
                  onChange={(e) => setTableForm({ ...tableForm, table_number: e.target.value })}
                  className="h-10 text-xs font-mono font-bold"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-semibold text-slate-700 dark:text-zinc-300 block mb-1">
                    {lang === 'bn' ? 'জোন' : 'Floor Zone'}
                  </label>
                  <select
                    value={tableForm.zone}
                    onChange={(e) => setTableForm({ ...tableForm, zone: e.target.value })}
                    className="w-full h-10 px-3 rounded-xl border border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 text-xs font-semibold text-slate-900 dark:text-white"
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
                    {lang === 'bn' ? 'আসন ক্ষমতা' : 'Seat Capacity'}
                  </label>
                  <Input
                    type="number"
                    min="1"
                    max="50"
                    required
                    value={tableForm.capacity}
                    onChange={(e) => setTableForm({ ...tableForm, capacity: Number(e.target.value) || 1 })}
                    className="h-10 text-xs font-mono font-bold"
                  />
                </div>
              </div>

              <div>
                <label className="font-semibold text-slate-700 dark:text-zinc-300 block mb-1">
                  {lang === 'bn' ? 'লেবেল / নাম' : 'Nickname'}
                </label>
                <Input
                  value={tableForm.name}
                  onChange={(e) => setTableForm({ ...tableForm, name: e.target.value })}
                  className="h-10 text-xs"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100 dark:border-zinc-800">
                <button
                  type="button"
                  disabled={isUpdatingTable}
                  onClick={() => setIsEditTableOpen(false)}
                  className="px-4 py-2 rounded-xl border border-slate-200 dark:border-zinc-700 text-xs font-semibold cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {lang === 'bn' ? 'বাতিল' : 'Cancel'}
                </button>
                <button
                  type="submit"
                  disabled={isUpdatingTable}
                  className="px-4 py-2 rounded-xl bg-blue-600 text-white text-xs font-bold hover:bg-blue-700 cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed flex items-center gap-1.5"
                >
                  {isUpdatingTable && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                  <span>{isUpdatingTable ? (lang === 'bn' ? 'আপডেট হচ্ছে...' : 'Updating...') : (lang === 'bn' ? 'আপডেট করুন' : 'Update Table')}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ---------------------------------------------------- */}
      {/* MODAL 3: SEAT GUESTS                                 */}
      {/* ---------------------------------------------------- */}
      {isOccupyModalOpen && selectedTable && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs">
          <div className="max-w-md w-full p-6 bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 shadow-2xl rounded-2xl animate-in fade-in zoom-in-95 duration-100">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-zinc-800 pb-3 mb-4">
              <h2 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <Utensils className="w-4 h-4 text-emerald-600" />
                <span>Seat Guests — Table {selectedTable.table_number}</span>
              </h2>
              <button onClick={() => setIsOccupyModalOpen(false)} className="text-slate-400 hover:text-slate-600 cursor-pointer">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleOccupy} className="space-y-4 text-xs">
              <div>
                <label className="font-semibold text-slate-700 dark:text-zinc-300 block mb-1">
                  {lang === 'bn' ? 'অতিথি সংখ্যা' : 'Guest Count'}
                </label>
                <Input
                  type="number"
                  min="1"
                  max={selectedTable.capacity * 2}
                  required
                  value={occupyForm.guest_count}
                  onChange={(e) => setOccupyForm({ ...occupyForm, guest_count: Number(e.target.value) || 1 })}
                  className="h-10 text-xs font-mono font-bold"
                />
              </div>

              <div>
                <label className="font-semibold text-slate-700 dark:text-zinc-300 block mb-1">
                  {lang === 'bn' ? 'দায়িত্বরত ওয়েটার' : 'Assigned Waiter'}
                </label>
                <Input
                  placeholder="e.g. Rahul, Sajjad"
                  value={occupyForm.waiter_name}
                  onChange={(e) => setOccupyForm({ ...occupyForm, waiter_name: e.target.value })}
                  className="h-10 text-xs"
                />
              </div>

              <label className="flex items-center gap-2 p-2.5 rounded-xl bg-slate-50 dark:bg-zinc-800 border border-slate-200/80 dark:border-zinc-700/80 cursor-pointer">
                <input
                  type="checkbox"
                  checked={occupyForm.redirect_to_pos}
                  onChange={(e) => setOccupyForm({ ...occupyForm, redirect_to_pos: e.target.checked })}
                  className="w-4 h-4 rounded text-emerald-600"
                />
                <span className="text-xs font-medium text-slate-800 dark:text-zinc-200">
                  {lang === 'bn' ? 'সাথে সাথে পিওএস স্ক্রিন খুলুন' : 'Open POS Screen immediately for food order'}
                </span>
              </label>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100 dark:border-zinc-800">
                <button
                  type="button"
                  disabled={isOccupyLoading}
                  onClick={() => setIsOccupyModalOpen(false)}
                  className="px-4 py-2 rounded-xl border border-slate-200 dark:border-zinc-700 text-xs font-semibold cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {lang === 'bn' ? 'বাতিল' : 'Cancel'}
                </button>
                <button
                  type="submit"
                  disabled={isOccupyLoading}
                  className="px-4 py-2 rounded-xl bg-emerald-600 text-white text-xs font-bold hover:bg-emerald-700 cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed flex items-center gap-1.5"
                >
                  {isOccupyLoading && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                  <span>{isOccupyLoading ? (lang === 'bn' ? 'বসানো হচ্ছে...' : 'Seating...') : (lang === 'bn' ? 'অতিথি বসান' : 'Confirm')}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ---------------------------------------------------- */}
      {/* MODAL 4: TRANSFER TABLE                              */}
      {/* ---------------------------------------------------- */}
      {isTransferModalOpen && selectedTable && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs">
          <div className="max-w-md w-full p-6 bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 shadow-2xl rounded-2xl animate-in fade-in zoom-in-95 duration-100">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-zinc-800 pb-3 mb-4">
              <h2 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <ArrowLeftRight className="w-4 h-4 text-blue-500" />
                <span>Transfer Table {selectedTable.table_number}</span>
              </h2>
              <button onClick={() => setIsTransferModalOpen(false)} className="text-slate-400 hover:text-slate-600 cursor-pointer">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleTransfer} className="space-y-4 text-xs">
              <div>
                <label className="font-semibold text-slate-700 dark:text-zinc-300 block mb-1">
                  {lang === 'bn' ? 'গন্তব্য খালি টেবিল' : 'Destination Table'}
                </label>
                <select
                  value={transferTargetId}
                  onChange={(e) => setTransferTargetId(e.target.value)}
                  required
                  className="w-full h-10 px-3 rounded-xl border border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 text-xs font-semibold text-slate-900 dark:text-white"
                >
                  <option value="">-- {lang === 'bn' ? 'একটি খালি টেবিল বেছে নিন' : 'Select Destination Table'} --</option>
                  {tables
                    .filter((t) => t.status === 'available' && String(t._id) !== String(selectedTable._id))
                    .map((t) => (
                      <option key={t._id} value={t._id}>
                        Table {t.table_number} ({t.zone} - {t.capacity} seats)
                      </option>
                    ))}
                </select>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100 dark:border-zinc-800">
                <button
                  type="button"
                  disabled={isTransferLoading}
                  onClick={() => setIsTransferModalOpen(false)}
                  className="px-4 py-2 rounded-xl border border-slate-200 dark:border-zinc-700 text-xs font-semibold cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {lang === 'bn' ? 'বাতিল' : 'Cancel'}
                </button>
                <button
                  type="submit"
                  disabled={!transferTargetId || isTransferLoading}
                  className="px-4 py-2 rounded-xl bg-blue-600 text-white text-xs font-bold hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer flex items-center gap-1.5"
                >
                  {isTransferLoading && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                  <span>{isTransferLoading ? (lang === 'bn' ? 'ট্রান্সফার হচ্ছে...' : 'Transferring...') : (lang === 'bn' ? 'ট্রান্সফার নিশ্চিত করুন' : 'Confirm Transfer')}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ---------------------------------------------------- */}
      {/* MODAL 5: DIGITAL TABLE QR STAND                      */}
      {/* ---------------------------------------------------- */}
      {isQrModalOpen && selectedTable && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs">
          <div className="max-w-xs w-full p-6 bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 shadow-2xl rounded-2xl text-center animate-in fade-in zoom-in-95 duration-100">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-zinc-800 pb-3 mb-4">
              <span className="text-sm font-bold text-slate-900 dark:text-white">
                Table {selectedTable.table_number} QR
              </span>
              <button onClick={() => setIsQrModalOpen(false)} className="text-slate-400 hover:text-slate-600 cursor-pointer">
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-3 bg-white rounded-xl inline-block border border-slate-200 shadow-2xs mb-2">
              <img
                src={`https://api.qrserver.com/v1/create-qr-code/?size=180x180&data=${encodeURIComponent(
                  `https://shopo.com.bd/menu?table=${selectedTable.table_number}&token=${selectedTable.qr_token || 'DEFAULT'}`
                )}`}
                alt="Table QR"
                className="w-36 h-36 mx-auto"
              />
            </div>

            <div className="text-xs font-bold text-slate-900 dark:text-white">
              Scan to Order Online
            </div>
            <div className="text-[11px] text-slate-500 capitalize mt-0.5">
              {selectedTable.zone} • {selectedTable.capacity} Seats
            </div>

            <div className="mt-4 space-y-1.5">
              <button
                onClick={() => window.print()}
                className="w-full py-2 rounded-xl bg-slate-900 text-white dark:bg-white dark:text-slate-900 text-xs font-bold flex items-center justify-center gap-1.5 cursor-pointer shadow-2xs"
              >
                <Printer className="w-3.5 h-3.5" />
                <span>{lang === 'bn' ? 'প্রিন্ট করুন' : 'Print QR'}</span>
              </button>

              <button
                onClick={() => {
                  const url = `https://shopo.com.bd/menu?table=${selectedTable.table_number}&token=${selectedTable.qr_token || 'DEFAULT'}`;
                  navigator.clipboard?.writeText(url);
                  toast.success('Link copied!');
                }}
                className="w-full py-2 rounded-xl border border-slate-200 dark:border-zinc-800 text-slate-700 dark:text-zinc-300 text-xs font-medium flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <Copy className="w-3.5 h-3.5" />
                <span>Copy Link</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ---------------------------------------------------- */}
      {/* CONFIRM DELETE DIALOG                                */}
      {/* ---------------------------------------------------- */}
      <ConfirmDialog
        isOpen={Boolean(deletingTable)}
        title={lang === 'bn' ? `টেবিল ${deletingTable?.table_number || ''} মুছে ফেলতে চান?` : `Delete Table ${deletingTable?.table_number || ''}?`}
        description={lang === 'bn' ? 'এই টেবিলটি চিরতরে মুছে ফেলা হবে। এই কাজটি পুনরায় ফিরিয়ে আনা যাবে না।' : 'This table will be permanently removed from your floor plan. This action cannot be undone.'}
        confirmText={lang === 'bn' ? 'হ্যাঁ, মুছুন' : 'Yes, Delete Table'}
        cancelText={lang === 'bn' ? 'বাতিল' : 'Cancel'}
        isLoading={isDeletingTable}
        onConfirm={confirmDeleteTable}
        onCancel={() => setDeletingTable(null)}
      />

    </div>
  );
}
