import { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useLanguage } from '@/context/LanguageContext';
import { useShop } from '@/context/ShopContext';
import api from '@/services/api';
import toast from 'react-hot-toast';
import { printHtmlViaIframe } from '@/utils/invoicePrinter';
import ConfirmDialog from '@/components/common/ConfirmDialog';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator
} from '@/components/ui/dropdown-menu';
import {
  Flame, Clock, CheckCircle2, ArrowLeft, RefreshCw, Volume2,
  VolumeX, ChefHat, Utensils, AlertTriangle, Maximize2, Minimize2,
  Search, MoreVertical, Edit3, Trash2, Printer, Check, X, Bell,
  RotateCcw, ShieldAlert, Sparkles, Loader2
} from 'lucide-react';

export default function RestaurantKDS() {
  const navigate = useNavigate();
  const { lang } = useLanguage();
  const { activeShop, mongoShop } = useShop();

  // Core State
  const [tickets, setTickets] = useState([]);
  const [selectedStation, setSelectedStation] = useState('all');
  const [statusFilter, setStatusFilter] = useState('cooking'); // 'cooking' | 'ready' | 'served' | 'all'
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [currentTime, setCurrentTime] = useState(Date.now());
  const [kdsActionLoading, setKdsActionLoading] = useState({});

  // Ticket Deletion & Edit Dialogs
  const [deleteDialog, setDeleteDialog] = useState({ isOpen: false, ticket: null, isLoading: false });
  const [editingTicket, setEditingTicket] = useState(null);
  const [editForm, setEditForm] = useState({
    special_instructions: '',
    waiter_name: '',
    customer_name: '',
    items: [],
  });
  const [isSavingEdit, setIsSavingEdit] = useState(false);

  // Live Timer
  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(Date.now()), 1000);
    return () => clearInterval(timer);
  }, []);

  // Fetch KDS Tickets
  const fetchTickets = async () => {
    try {
      setIsLoading(true);
      const res = await api.restaurant.kds.getTickets(selectedStation);
      if (res?.success && Array.isArray(res.data)) {
        setTickets(res.data);
      }
    } catch (err) {
      console.error('Failed to load KDS tickets:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchTickets();
    const interval = setInterval(fetchTickets, 6000); // 6s auto-sync
    return () => clearInterval(interval);
  }, [activeShop, selectedStation]);

  // Fullscreen Listener
  useEffect(() => {
    const handleFs = () => setIsFullscreen(!!document.fullscreenElement);
    document.addEventListener('fullscreenchange', handleFs);
    return () => document.removeEventListener('fullscreenchange', handleFs);
  }, []);

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch(() => {});
    } else {
      document.exitFullscreen().catch(() => {});
    }
  };

  // Sound Chime
  const playChime = () => {
    if (!soundEnabled) return;
    try {
      const ctx = new (window.AudioContext || window.webkitAudioContext)();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(659.25, ctx.currentTime); // E5
      osc.frequency.setValueAtTime(880, ctx.currentTime + 0.08); // A5
      gain.gain.setValueAtTime(0.15, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.35);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 0.35);
    } catch (e) {}
  };

  // Update Single Item Status with Loader
  const handleUpdateItemStatus = async (orderId, itemId, newStatus) => {
    const key = `item-${itemId}-${newStatus}`;
    setKdsActionLoading((prev) => ({ ...prev, [key]: true }));
    try {
      const res = await api.restaurant.kds.updateItemStatus({
        orderId,
        itemId,
        status: newStatus,
      });
      if (res?.success) {
        playChime();
        toast.success(
          lang === 'bn'
            ? `আইটেম ${newStatus === 'ready' ? 'রেডি' : newStatus === 'served' ? 'পরিবেশিত' : 'রান্না'} করা হয়েছে!`
            : `Item updated to ${newStatus}!`
        );
        await fetchTickets();
      }
    } catch (err) {
      toast.error(err.message || 'Failed to update item status');
    } finally {
      setKdsActionLoading((prev) => ({ ...prev, [key]: false }));
    }
  };

  // Batch Update Entire Order / Ticket Status with Loader
  const handleUpdateAllTicketItems = async (orderId, status) => {
    const key = `ticket-${orderId}-${status}`;
    setKdsActionLoading((prev) => ({ ...prev, [key]: true }));
    try {
      const res = await api.restaurant.kds.updateAllItemsStatus({
        orderId,
        status,
      });
      if (res?.success) {
        playChime();
        toast.success(
          lang === 'bn'
            ? `অর্ডারের খাবার ${status === 'ready' ? 'রেডি' : status === 'served' ? 'পরিবেশিত' : 'রান্নায়'} আপডেট হয়েছে!`
            : `Order marked as ${status}!`
        );
        await fetchTickets();
      }
    } catch (err) {
      toast.error(err.message || 'Failed to update ticket');
    } finally {
      setKdsActionLoading((prev) => ({ ...prev, [key]: false }));
    }
  };

  // Delete / Cancel Ticket
  const confirmDeleteTicket = async () => {
    if (!deleteDialog.ticket) return;
    setDeleteDialog((prev) => ({ ...prev, isLoading: true }));
    try {
      const res = await api.restaurant.orders.delete(deleteDialog.ticket._id);
      if (res?.success) {
        toast.success(
          lang === 'bn'
            ? `টিকিট #${deleteDialog.ticket.kot_number || deleteDialog.ticket.order_number} বাতিল করা হয়েছে!`
            : `Ticket #${deleteDialog.ticket.kot_number || deleteDialog.ticket.order_number} cancelled!`
        );
        setDeleteDialog({ isOpen: false, ticket: null, isLoading: false });
        fetchTickets();
      }
    } catch (err) {
      toast.error(err.message || 'Failed to cancel ticket');
      setDeleteDialog((prev) => ({ ...prev, isLoading: false }));
    }
  };

  // Edit Ticket Modal
  const openEditModal = (ticket) => {
    setEditingTicket(ticket);
    setEditForm({
      special_instructions: ticket.special_instructions || '',
      waiter_name: ticket.waiter_name || '',
      customer_name: ticket.customer_name || '',
      items: (ticket.items || []).map((it) => ({
        _id: it._id,
        name: it.name,
        cooking_notes: it.cooking_notes || '',
        status: it.status || 'pending',
      })),
    });
  };

  const handleSaveEdit = async (e) => {
    e.preventDefault();
    if (!editingTicket) return;
    setIsSavingEdit(true);
    try {
      const res = await api.restaurant.orders.update(editingTicket._id, editForm);
      if (res?.success) {
        toast.success(lang === 'bn' ? 'টিকিট আপডেট হয়েছে!' : 'Ticket updated successfully!');
        setEditingTicket(null);
        fetchTickets();
      }
    } catch (err) {
      toast.error(err.message || 'Failed to update ticket');
    } finally {
      setIsSavingEdit(false);
    }
  };

  // Thermal KOT Printer
  const handlePrintKot = (ticket) => {
    const shopName = mongoShop?.name || activeShop?.name || 'KITCHEN DISPLAY';
    const tableName = ticket.order_type === 'dine_in'
      ? `TABLE ${ticket.table_number || ticket.table_id?.table_number || ''} ${ticket.table_id?.name ? `(${ticket.table_id.name})` : ''}`
      : ticket.order_type.toUpperCase();

    // Only print cooking items (exclude resale goods like bottled water/soda)
    const kitchenItems = (ticket.items || []).filter(
      (it) => it.item_type !== 'resale_product' && it.kitchen_station !== 'ready_to_serve'
    );

    if (kitchenItems.length === 0) {
      toast.info(lang === 'bn' ? 'এই টিকিটে কোনো কিচেনে রান্নার খাবার নেই (সবগুলোই সরাসরি বিক্রয়যোগ্য)।' : 'No kitchen-prepared items on this ticket (all are direct resale/ready-to-serve).');
      return;
    }

    const itemsHtml = kitchenItems.map((it) => `
      <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 4px;">
        <span style="font-size: 14px; font-weight: 900; width: 26px;">${it.quantity}x</span>
        <span style="flex: 1; font-weight: 800; font-size: 13px;">${it.name} ${it.name_bn ? `(${it.name_bn})` : ''}</span>
      </div>
      ${it.modifiers && it.modifiers.length ? `<div style="font-size: 11px; padding-left: 26px; color: #444;">+ ${it.modifiers.map((m) => m.name).join(', ')}</div>` : ''}
      ${it.cooking_notes ? `<div style="font-size: 11px; padding-left: 26px; font-weight: bold; color: #c00;">⚠️ NOTE: "${it.cooking_notes}"</div>` : ''}
    `).join('');

    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <title>KOT #${ticket.kot_number || ticket.order_number}</title>
        <style>
          @page { size: 80mm auto; margin: 4mm; }
          body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, monospace; font-size: 13px; color: #000; margin: 0; padding: 4px; line-height: 1.3; }
          .text-center { text-align: center; }
          .font-bold { font-weight: bold; }
          .divider { border-top: 1px dashed #000; margin: 6px 0; }
          .title { font-size: 16px; font-weight: 900; text-transform: uppercase; }
          .kot-badge { font-size: 18px; font-weight: 900; padding: 2px 6px; border: 2px solid #000; display: inline-block; margin: 4px 0; }
          .table-badge { font-size: 15px; font-weight: 800; }
        </style>
      </head>
      <body>
        <div class="text-center">
          <div class="title">${shopName}</div>
          <div class="kot-badge">KOT: ${ticket.kot_number || ticket.order_number}</div>
          <div class="table-badge">${tableName}</div>
          <div style="font-size: 11px; margin-top: 2px;">
            Time: ${new Date(ticket.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} • Server: ${ticket.waiter_name || 'Cashier'}
          </div>
          ${ticket.customer_name ? `<div style="font-size: 11px;">Guest: ${ticket.customer_name}</div>` : ''}
        </div>
        <div class="divider"></div>
        ${ticket.special_instructions ? `<div style="padding: 4px; background: #eee; font-weight: bold; margin-bottom: 6px;">⚠️ SPECIAL: ${ticket.special_instructions}</div><div class="divider"></div>` : ''}
        <div>${itemsHtml}</div>
        <div class="divider"></div>
        <div class="text-center" style="font-size: 10px; margin-top: 4px;">*** KITCHEN SLIP ***</div>
      </body>
      </html>
    `;

    printHtmlViaIframe(html);
  };

  const stations = [
    { id: 'all', label: lang === 'bn' ? 'সকল স্টেশন' : 'All Stations' },
    { id: 'main_kitchen', label: lang === 'bn' ? 'প্রধান রান্নাঘর' : 'Main Kitchen / Curry' },
    { id: 'grill_tandoor', label: lang === 'bn' ? 'গ্রিল ও তান্দুর' : 'Grill & Tandoor' },
    { id: 'beverage_bar', label: lang === 'bn' ? 'জুস ও বার' : 'Juice & Beverage Bar' },
    { id: 'bakery_dessert', label: lang === 'bn' ? 'বেকারি ও ডেজার্ট' : 'Bakery & Dessert' },
  ];

  // Live Count Metrics
  const counts = useMemo(() => {
    let cooking = 0;
    let ready = 0;
    let served = 0;

    tickets.forEach((t) => {
      const items = (t.items || []).filter(
        (it) => it.item_type !== 'resale_product' && it.kitchen_station !== 'ready_to_serve'
      );
      if (items.length === 0) return;

      const allServed = items.every((it) => it.status === 'served');
      const allReady = items.every((it) => it.status === 'ready' || it.status === 'served');

      if (t.status === 'served' || allServed) {
        served++;
      } else if (t.status === 'ready' || allReady) {
        ready++;
      } else {
        cooking++;
      }
    });

    return { cooking, ready, served, total: tickets.length };
  }, [tickets]);

  // Filter Tickets based on 3 Clear States
  const filteredTickets = useMemo(() => {
    return tickets.filter((t) => {
      const items = (t.items || []).filter(
        (it) => it.item_type !== 'resale_product' && it.kitchen_station !== 'ready_to_serve'
      );
      if (items.length === 0) return false;

      const isTicketServed = t.status === 'served' || items.every((it) => it.status === 'served');
      const isTicketReady = !isTicketServed && (t.status === 'ready' || items.every((it) => it.status === 'ready' || it.status === 'served'));
      const isTicketCooking = !isTicketServed && !isTicketReady;

      // Status Tab filter
      if (statusFilter === 'cooking' && !isTicketCooking) return false;
      if (statusFilter === 'ready' && !isTicketReady) return false;
      if (statusFilter === 'served' && !isTicketServed) return false;

      // Search Query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchKot = (t.kot_number || '').toLowerCase().includes(q);
        const matchOrder = (t.order_number || '').toLowerCase().includes(q);
        const matchTable = (t.table_number || t.table_id?.table_number || '').toLowerCase().includes(q);
        const matchTableName = (t.table_id?.name || t.table_name || '').toLowerCase().includes(q);
        const matchCustomer = (t.customer_name || '').toLowerCase().includes(q);
        const matchWaiter = (t.waiter_name || '').toLowerCase().includes(q);
        const matchDish = items.some((it) => (it.name || '').toLowerCase().includes(q) || (it.name_bn || '').toLowerCase().includes(q));
        if (!matchKot && !matchOrder && !matchTable && !matchTableName && !matchCustomer && !matchWaiter && !matchDish) {
          return false;
        }
      }

      return true;
    });
  }, [tickets, statusFilter, searchQuery]);

  return (
    <div className="space-y-4 font-sans pb-16">
      
      {/* ---------------------------------------------------- */}
      {/* 1. CLEAN MODERN HEADER & STATUS NAVIGATION           */}
      {/* ---------------------------------------------------- */}
      <div className="bg-white dark:bg-[#121215] border border-slate-200 dark:border-zinc-800/80 rounded-2xl p-4 shadow-xs space-y-3.5">
        
        {/* Top Title & Quick Actions */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          
          <div className="flex items-center gap-3">
            <button
              onClick={() => navigate('/restaurant/dashboard')}
              className="p-2 rounded-xl border border-slate-200 dark:border-zinc-800 hover:bg-slate-50 dark:hover:bg-zinc-850 text-slate-600 dark:text-zinc-400 cursor-pointer transition-colors"
              title="Dashboard"
            >
              <ArrowLeft className="w-4 h-4" />
            </button>

            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-lg font-black text-slate-900 dark:text-white tracking-tight flex items-center gap-2">
                  <ChefHat className="w-5 h-5 text-orange-500" />
                  <span>{lang === 'bn' ? 'কিচেন ডিসপ্লে সিস্টেম (KDS)' : 'Kitchen Display System'}</span>
                </h1>
                <span className="flex items-center gap-1 text-[11px] font-bold px-2 py-0.5 rounded-full bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-[#00df89] border border-emerald-200 dark:border-emerald-900/60">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#00df89] animate-pulse" />
                  <span>Live Queue</span>
                </span>
              </div>
              <p className="text-xs text-slate-500 dark:text-zinc-400 mt-0.5">
                {lang === 'bn'
                  ? 'রান্নাঘর ও পরিবেশন মনিটর — ৩টি পরিষ্কার ধাপে অর্ডার পরিচালনা করুন।'
                  : 'Kitchen & Floor Orders — Manage dishes across 3 distinct live stages.'}
              </p>
            </div>
          </div>

          {/* Right Toolbar Controls */}
          <div className="flex items-center gap-2 flex-wrap">
            {/* Station filter */}
            <select
              value={selectedStation}
              onChange={(e) => setSelectedStation(e.target.value)}
              className="h-9 px-3 rounded-xl border border-slate-200 dark:border-zinc-800 bg-slate-50 dark:bg-zinc-900 text-xs font-semibold text-slate-800 dark:text-zinc-200 focus:outline-none cursor-pointer"
            >
              {stations.map((s) => (
                <option key={s.id} value={s.id}>{s.label}</option>
              ))}
            </select>

            {/* Sound Toggle */}
            <button
              type="button"
              onClick={() => setSoundEnabled(!soundEnabled)}
              className={`p-2 rounded-xl border transition-all cursor-pointer ${
                soundEnabled
                  ? 'border-orange-500/40 bg-orange-500/10 text-orange-600 dark:text-orange-400'
                  : 'border-slate-200 dark:border-zinc-800 bg-slate-50 dark:bg-zinc-900 text-slate-400'
              }`}
              title={soundEnabled ? 'Bell Alert Active' : 'Sound Muted'}
            >
              {soundEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
            </button>

            {/* Fullscreen Monitor */}
            <button
              type="button"
              onClick={toggleFullscreen}
              className="p-2 rounded-xl border border-slate-200 dark:border-zinc-800 bg-slate-50 dark:bg-zinc-900 hover:bg-slate-100 dark:hover:bg-zinc-800 text-slate-600 dark:text-zinc-300 cursor-pointer transition-colors"
              title="Toggle Fullscreen"
            >
              {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
            </button>

            {/* Refresh */}
            <button
              type="button"
              onClick={fetchTickets}
              className="p-2 rounded-xl border border-slate-200 dark:border-zinc-800 bg-slate-50 dark:bg-zinc-900 hover:bg-slate-100 dark:hover:bg-zinc-800 text-slate-700 dark:text-zinc-200 cursor-pointer transition-colors"
              title="Refresh"
            >
              <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
            </button>
          </div>

        </div>

        {/* Bottom Filter Navigation: 3 Distinct States */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 pt-2 border-t border-slate-100 dark:border-zinc-800/80">
          
          {/* 3 Step Tabs */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0 text-xs">
            
            {/* Stage 1: Cooking */}
            <button
              type="button"
              onClick={() => setStatusFilter('cooking')}
              className={`px-3.5 py-2 rounded-xl font-bold transition-all cursor-pointer flex items-center gap-2 ${
                statusFilter === 'cooking'
                  ? 'bg-amber-500 text-white shadow-xs'
                  : 'bg-slate-100 dark:bg-zinc-850 text-slate-700 dark:text-zinc-300 hover:bg-slate-200 dark:hover:bg-zinc-800'
              }`}
            >
              <Flame className="w-3.5 h-3.5" />
              <span>{lang === 'bn' ? 'রান্না হচ্ছে (Cooking)' : '1. Cooking'}</span>
              <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-mono font-bold ${
                statusFilter === 'cooking' ? 'bg-black/25 text-white' : 'bg-amber-500/20 text-amber-600 dark:text-amber-400'
              }`}>
                {isLoading && tickets.length === 0 ? <Skeleton className="h-2.5 w-3 inline-block rounded" /> : counts.cooking}
              </span>
            </button>

            {/* Stage 2: Ready */}
            <button
              type="button"
              onClick={() => setStatusFilter('ready')}
              className={`px-3.5 py-2 rounded-xl font-bold transition-all cursor-pointer flex items-center gap-2 ${
                statusFilter === 'ready'
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'bg-slate-100 dark:bg-zinc-850 text-slate-700 dark:text-zinc-300 hover:bg-slate-200 dark:hover:bg-zinc-800'
              }`}
            >
              <Bell className="w-3.5 h-3.5" />
              <span>{lang === 'bn' ? 'রেডি / পরিবেশন যোগ্য' : '2. Ready to Serve'}</span>
              <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-mono font-bold ${
                statusFilter === 'ready' ? 'bg-black/25 text-white' : 'bg-blue-500/20 text-blue-600 dark:text-blue-400'
              }`}>
                {isLoading && tickets.length === 0 ? <Skeleton className="h-2.5 w-3 inline-block rounded" /> : counts.ready}
              </span>
            </button>

            {/* Stage 3: Served */}
            <button
              type="button"
              onClick={() => setStatusFilter('served')}
              className={`px-3.5 py-2 rounded-xl font-bold transition-all cursor-pointer flex items-center gap-2 ${
                statusFilter === 'served'
                  ? 'bg-emerald-600 text-white shadow-xs'
                  : 'bg-slate-100 dark:bg-zinc-850 text-slate-700 dark:text-zinc-300 hover:bg-slate-200 dark:hover:bg-zinc-800'
              }`}
            >
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>{lang === 'bn' ? 'পরিবেশিত (Served)' : '3. Served'}</span>
              <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-mono font-bold ${
                statusFilter === 'served' ? 'bg-black/25 text-white' : 'bg-emerald-500/20 text-emerald-600 dark:text-[#00df89]'
              }`}>
                {isLoading && tickets.length === 0 ? <Skeleton className="h-2.5 w-3 inline-block rounded" /> : counts.served}
              </span>
            </button>

            {/* All */}
            <button
              type="button"
              onClick={() => setStatusFilter('all')}
              className={`px-3 py-2 rounded-xl font-bold transition-all cursor-pointer ${
                statusFilter === 'all'
                  ? 'bg-slate-900 dark:bg-white text-white dark:text-slate-900 shadow-xs'
                  : 'bg-slate-100 dark:bg-zinc-850 text-slate-500 dark:text-zinc-400 hover:bg-slate-200 dark:hover:bg-zinc-800'
              }`}
            >
              {lang === 'bn' ? 'সকল' : 'All'} ({counts.total})
            </button>

          </div>

          {/* Search Box */}
          <div className="relative w-full sm:w-60">
            <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder={lang === 'bn' ? 'কেওটি, টেবিল, খাবার খুঁজুন...' : 'Search KOT, Table, item...'}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full h-8.5 pl-8 pr-3 rounded-xl bg-slate-50 dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 text-xs text-slate-900 dark:text-white placeholder-slate-400 outline-none focus:ring-1 focus:ring-orange-500"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-white"
              >
                <X className="w-3 h-3" />
              </button>
            )}
          </div>

        </div>

      </div>

      {/* ---------------------------------------------------- */}
      {/* 2. TICKETS GRID                                      */}
      {/* ---------------------------------------------------- */}
      {isLoading && tickets.length === 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div key={i} className="p-4 rounded-2xl border border-slate-200/80 dark:border-zinc-800 bg-white dark:bg-zinc-900 space-y-3.5 shadow-2xs">
              <div className="flex justify-between items-center pb-2 border-b border-slate-100 dark:border-zinc-800">
                <div className="space-y-1">
                  <Skeleton className="h-5 w-24 rounded-md" />
                  <Skeleton className="h-3.5 w-16 rounded" />
                </div>
                <Skeleton className="h-6 w-14 rounded-full" />
              </div>
              <div className="space-y-2.5 py-1">
                {[1, 2, 3].map((j) => (
                  <div key={j} className="flex justify-between items-center">
                    <Skeleton className="h-4 w-32 rounded" />
                    <Skeleton className="h-4 w-8 rounded" />
                  </div>
                ))}
              </div>
              <Skeleton className="h-10 w-full rounded-xl pt-2" />
            </div>
          ))}
        </div>
      ) : filteredTickets.length === 0 ? (
        <div className="text-center py-20 bg-white dark:bg-[#121215] rounded-2xl border border-dashed border-slate-200 dark:border-zinc-800 p-8 shadow-xs">
          <ChefHat className="w-12 h-12 mx-auto text-emerald-500 mb-2 opacity-80" />
          <div className="text-base font-bold text-slate-900 dark:text-white">
            {statusFilter === 'cooking'
              ? (lang === 'bn' ? 'বর্তমানে রান্নার কোনো অর্ডার নেই 👨‍🍳' : 'No active orders cooking right now 👨‍🍳')
              : statusFilter === 'ready'
              ? (lang === 'bn' ? 'পরিবেশনের জন্য অপেক্ষমাণ কোনো খাবার নেই' : 'No orders waiting to be served')
              : (lang === 'bn' ? 'কোনো টিকিট পাওয়া যায়নি' : 'No matching tickets found')}
          </div>
          <p className="text-xs text-slate-500 dark:text-zinc-400 mt-1">
            {searchQuery ? 'Try clearing your search keyword.' : 'New orders dispatched from POS will automatically show up here.'}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {filteredTickets.map((ticket) => {
            const items = (ticket.items || []).filter(
              (it) => it.item_type !== 'resale_product' && it.kitchen_station !== 'ready_to_serve'
            );
            const isTicketServed = ticket.status === 'served' || (items.length > 0 && items.every((it) => it.status === 'served'));
            const isTicketReady = !isTicketServed && (ticket.status === 'ready' || (items.length > 0 && items.every((it) => it.status === 'ready' || it.status === 'served')));
            const isTicketCooking = !isTicketServed && !isTicketReady;

            const createdAtMs = new Date(ticket.created_at || ticket.time_seated || Date.now()).getTime();

            // Duration: live ticker while cooking, frozen at completed moment when ready or served
            let durationMs = 0;
            if (isTicketCooking) {
              durationMs = Math.max(0, currentTime - createdAtMs);
            } else {
              const finishDate = ticket.time_ready || ticket.time_served || ticket.time_completed || ticket.updated_at || ticket.created_at;
              const finishMs = new Date(finishDate).getTime();
              durationMs = Math.max(0, finishMs - createdAtMs);
            }

            const elapsedMins = Math.floor(durationMs / 60000);
            const elapsedSecs = Math.floor((durationMs % 60000) / 1000);

            const isCritical = isTicketCooking && elapsedMins >= 20;
            const isWarning = isTicketCooking && elapsedMins >= 10 && elapsedMins < 20;

            const timeTookStr = elapsedMins > 0 ? `${elapsedMins}m ${elapsedSecs}s` : `${elapsedSecs}s`;

            return (
              <Card
                key={ticket._id}
                className={`rounded-2xl border shadow-2xs bg-white dark:bg-[#121215] flex flex-col justify-between transition-all duration-150 relative ${
                  isTicketServed
                    ? 'border-slate-200 dark:border-zinc-800 opacity-80'
                    : isTicketReady
                    ? 'border-blue-500/50 dark:border-blue-500/40 ring-1 ring-blue-500/20'
                    : isCritical
                    ? 'border-rose-500/50 dark:border-rose-500/40 ring-1 ring-rose-500/20'
                    : isWarning
                    ? 'border-amber-500/50 dark:border-amber-500/40'
                    : 'border-slate-200 dark:border-zinc-800 hover:border-slate-300 dark:hover:border-zinc-700'
                }`}
              >
                <div>
                  
                  {/* Card Header Strip */}
                  <div className={`p-3 border-b rounded-t-2xl flex items-center justify-between ${
                    isTicketServed
                      ? 'bg-slate-50 dark:bg-zinc-850 border-slate-200 dark:border-zinc-800 text-slate-800 dark:text-zinc-200'
                      : isTicketReady
                      ? 'bg-blue-50 dark:bg-blue-950/40 border-blue-200 dark:border-blue-900 text-blue-950 dark:text-blue-100'
                      : isCritical
                      ? 'bg-rose-50 dark:bg-rose-950/40 border-rose-200 dark:border-rose-900 text-rose-950 dark:text-rose-100'
                      : 'bg-slate-50 dark:bg-zinc-850/80 border-slate-200 dark:border-zinc-800 text-slate-900 dark:text-white'
                  }`}>
                    <div className="flex-1 min-w-0 pr-2">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span className="font-black text-sm tracking-tight">
                          {ticket.order_type === 'dine_in'
                            ? (ticket.table_number || ticket.table_id?.table_number
                                ? `Table ${ticket.table_number || ticket.table_id?.table_number}`
                                : (ticket.table_id?.name ? `Table: ${ticket.table_id.name}` : 'Dine-In'))
                            : ticket.order_type === 'takeaway'
                            ? '📦 Takeaway / Parcel'
                            : '🛵 Delivery'}
                        </span>
                        {ticket.order_type === 'dine_in' && (ticket.table_id?.name || ticket.table_name) && (
                          <span className="text-[10px] font-semibold px-1.5 py-0.2 rounded-md bg-slate-200/70 dark:bg-zinc-800 text-slate-700 dark:text-zinc-300 truncate max-w-[120px]">
                            {ticket.table_id?.name || ticket.table_name}
                          </span>
                        )}
                      </div>
                      <div className="text-[10px] font-mono text-slate-500 dark:text-zinc-400 mt-0.5">
                        #{ticket.order_number} • KOT: {ticket.kot_number || 'KOT'}
                      </div>
                    </div>

                    {/* Timer & 3-Dots Menu */}
                    <div className="flex items-center gap-1.5 shrink-0">
                      <div className="text-right">
                        <div className={`font-mono font-bold text-xs flex items-center gap-1 justify-end ${
                          isTicketServed
                            ? 'text-emerald-600 dark:text-[#00df89]'
                            : isTicketReady
                            ? 'text-blue-600 dark:text-blue-400'
                            : isCritical
                            ? 'text-rose-600 dark:text-rose-400'
                            : isWarning
                            ? 'text-amber-600 dark:text-amber-400'
                            : 'text-slate-800 dark:text-zinc-200'
                        }`}>
                          <Clock className="w-3 h-3" />
                          <span>
                            {String(elapsedMins).padStart(2, '0')}:{String(elapsedSecs).padStart(2, '0')}
                          </span>
                        </div>
                        <div className="text-[9px] uppercase font-bold tracking-wide">
                          {isTicketServed ? (
                            <span className="text-emerald-600 dark:text-[#00df89]" title={`Cook preparation took ${timeTookStr}`}>
                              ✓ {timeTookStr}
                            </span>
                          ) : isTicketReady ? (
                            <span className="text-blue-600 dark:text-blue-400" title={`Ready in ${timeTookStr}`}>
                              🔔 Ready ({timeTookStr})
                            </span>
                          ) : isCritical ? (
                            <span className="text-rose-600 dark:text-rose-400">🚨 Overdue</span>
                          ) : isWarning ? (
                            <span className="text-amber-600 dark:text-amber-400">⏳ Cooking</span>
                          ) : (
                            <span className="text-emerald-600 dark:text-[#00df89]">⚡ Fresh</span>
                          )}
                        </div>
                      </div>

                      {/* 3-Dots Context Menu with elevated z-index */}
                      <DropdownMenu className="relative z-30">
                        <DropdownMenuTrigger className="p-1.5 rounded-lg hover:bg-slate-200 dark:hover:bg-zinc-800 text-slate-500 dark:text-zinc-400 cursor-pointer">
                          <MoreVertical className="w-4 h-4" />
                        </DropdownMenuTrigger>
                        
                        <DropdownMenuContent align="end" width="w-48" className="z-[99999] shadow-2xl">
                          <DropdownMenuItem onClick={() => openEditModal(ticket)}>
                            <Edit3 className="w-3.5 h-3.5 text-blue-500" />
                            <span>{lang === 'bn' ? 'নোট ও বিস্তারিত এডিট' : 'Edit Notes & Details'}</span>
                          </DropdownMenuItem>

                          <DropdownMenuItem onClick={() => handlePrintKot(ticket)}>
                            <Printer className="w-3.5 h-3.5 text-slate-600 dark:text-zinc-400" />
                            <span>{lang === 'bn' ? 'কেওটি স্লিপ প্রিন্ট' : 'Print KOT Slip'}</span>
                          </DropdownMenuItem>

                          <DropdownMenuSeparator />

                          <DropdownMenuItem onClick={() => handleUpdateAllTicketItems(ticket._id, 'ready')}>
                            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
                            <span>{lang === 'bn' ? 'সব রেডি চিহ্নিত করুন' : 'Mark All as Ready'}</span>
                          </DropdownMenuItem>

                          <DropdownMenuItem onClick={() => handleUpdateAllTicketItems(ticket._id, 'served')}>
                            <Utensils className="w-3.5 h-3.5 text-blue-500" />
                            <span>{lang === 'bn' ? 'সব পরিবেশিত চিহ্নিত করুন' : 'Mark All as Served'}</span>
                          </DropdownMenuItem>

                          <DropdownMenuItem onClick={() => handleUpdateAllTicketItems(ticket._id, 'cooking')}>
                            <RotateCcw className="w-3.5 h-3.5 text-amber-500" />
                            <span>{lang === 'bn' ? 'পুনরায় রান্নায় পাঠান' : 'Revert to Cooking'}</span>
                          </DropdownMenuItem>

                          <DropdownMenuSeparator />

                          <DropdownMenuItem
                            variant="danger"
                            onClick={() => setDeleteDialog({ isOpen: true, ticket, isLoading: false })}
                          >
                            <Trash2 className="w-3.5 h-3.5 text-rose-500" />
                            <span>{lang === 'bn' ? 'টিকিট বাতিল / মুছুন' : 'Cancel Ticket'}</span>
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>

                    </div>
                  </div>

                  {/* Server / Guest Notes Strip */}
                  <div className="px-3 py-1.5 bg-slate-50/50 dark:bg-zinc-900/60 border-b border-slate-100 dark:border-zinc-800 text-[11px] text-slate-500 dark:text-zinc-400 flex items-center justify-between">
                    <span className="truncate">👤 {ticket.customer_name || 'Walk-in Guest'}</span>
                    {ticket.waiter_name && <span className="truncate font-medium">🧑‍🍳 {ticket.waiter_name}</span>}
                  </div>

                  {/* Special Chef Instructions Banner */}
                  {ticket.special_instructions && (
                    <div className="px-3 py-1.5 bg-amber-50 dark:bg-amber-950/30 border-b border-amber-200/60 dark:border-amber-900/40 text-[11px] text-amber-800 dark:text-amber-300 font-bold flex items-center gap-1.5">
                      <ShieldAlert className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                      <span className="truncate">Chef Note: "{ticket.special_instructions}"</span>
                    </div>
                  )}

                  {/* Items List */}
                  <div className="p-3 space-y-2 max-h-[300px] overflow-y-auto">
                    {items.map((item) => {
                      const isItemReady = item.status === 'ready';
                      const isItemServed = item.status === 'served';

                      return (
                        <div
                          key={item._id}
                          className={`p-2.5 rounded-xl border text-xs transition-all ${
                            isItemServed
                              ? 'bg-slate-50 dark:bg-zinc-900/40 border-slate-200 dark:border-zinc-800 opacity-60'
                              : isItemReady
                              ? 'bg-emerald-50/80 dark:bg-emerald-950/30 border-emerald-300 dark:border-emerald-900/50'
                              : 'bg-white dark:bg-zinc-900 border-slate-200 dark:border-zinc-800'
                          }`}
                        >
                          <div className="flex items-start justify-between gap-2">
                            <div className="flex items-center gap-2 min-w-0 flex-1">
                              <span className="w-5 h-5 rounded-md bg-slate-900 text-white dark:bg-white dark:text-slate-900 font-bold text-xs flex items-center justify-center font-mono shrink-0">
                                {item.quantity}
                              </span>
                              <div className="min-w-0 flex-1">
                                <span className={`font-bold truncate block ${isItemServed ? 'line-through text-slate-400' : 'text-slate-900 dark:text-white'}`}>
                                  {item.name}
                                </span>
                                {item.name_bn && (
                                  <div className="text-[10px] text-slate-400 truncate">{item.name_bn}</div>
                                )}
                              </div>
                            </div>

                            {/* Item Progression Checkbox / Buttons */}
                            <div className="flex items-center gap-1 shrink-0">
                              {!isItemReady && !isItemServed && (
                                <>
                                  <button
                                    type="button"
                                    disabled={kdsActionLoading[`item-${item._id}-ready`] || kdsActionLoading[`item-${item._id}-served`]}
                                    onClick={() => handleUpdateItemStatus(ticket._id, item._id, 'ready')}
                                    className="px-2 py-1 rounded-lg bg-slate-100 dark:bg-zinc-800 hover:bg-emerald-600 hover:text-white text-slate-700 dark:text-zinc-300 font-bold text-[10px] flex items-center gap-1 cursor-pointer transition-colors border border-slate-200 dark:border-zinc-700 disabled:opacity-50"
                                    title="Mark dish ready"
                                  >
                                    {kdsActionLoading[`item-${item._id}-ready`] ? (
                                      <Loader2 className="w-3 h-3 animate-spin" />
                                    ) : (
                                      <Check className="w-3 h-3" />
                                    )}
                                    <span>Ready</span>
                                  </button>

                                  <button
                                    type="button"
                                    disabled={kdsActionLoading[`item-${item._id}-ready`] || kdsActionLoading[`item-${item._id}-served`]}
                                    onClick={() => handleUpdateItemStatus(ticket._id, item._id, 'served')}
                                    className="px-2 py-1 rounded-lg bg-blue-50 dark:bg-blue-950/40 hover:bg-blue-600 hover:text-white text-blue-600 dark:text-blue-400 font-bold text-[10px] flex items-center gap-1 cursor-pointer transition-colors border border-blue-200 dark:border-blue-800 disabled:opacity-50"
                                    title="Mark dish served directly"
                                  >
                                    {kdsActionLoading[`item-${item._id}-served`] ? (
                                      <Loader2 className="w-3 h-3 animate-spin" />
                                    ) : (
                                      <Utensils className="w-3 h-3" />
                                    )}
                                    <span>Serve</span>
                                  </button>
                                </>
                              )}
                              {isItemReady && !isItemServed && (
                                <>
                                  <span className="px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-600 dark:text-[#00df89] text-[9px] font-bold">
                                    ✓ Ready
                                  </span>
                                  <button
                                    type="button"
                                    disabled={kdsActionLoading[`item-${item._id}-served`]}
                                    onClick={() => handleUpdateItemStatus(ticket._id, item._id, 'served')}
                                    className="px-2 py-1 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-bold text-[10px] flex items-center gap-1 cursor-pointer transition-colors shadow-2xs disabled:opacity-50"
                                    title="Click to serve"
                                  >
                                    {kdsActionLoading[`item-${item._id}-served`] ? (
                                      <Loader2 className="w-3 h-3 animate-spin" />
                                    ) : (
                                      <Utensils className="w-3 h-3" />
                                    )}
                                    <span>Serve</span>
                                  </button>
                                </>
                              )}
                              {isItemServed && (
                                <span className="px-2 py-0.5 rounded-full bg-slate-100 dark:bg-zinc-800 text-slate-500 text-[9px] font-bold">
                                  ✓ Served
                                </span>
                              )}
                            </div>
                          </div>

                          {/* Modifiers */}
                          {item.modifiers && item.modifiers.length > 0 && (
                            <div className="text-[10px] font-semibold text-orange-600 dark:text-orange-400 mt-1 pl-7">
                              + {item.modifiers.map((m) => m.name).join(', ')}
                            </div>
                          )}

                          {/* Per-item Cooking Notes */}
                          {item.cooking_notes && (
                            <div className="text-[10px] text-rose-600 dark:text-rose-400 font-bold mt-1 pl-7 flex items-center gap-1">
                              <span>⚠️</span>
                              <span className="italic">"{item.cooking_notes}"</span>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Footer Action Buttons with Loaders & Quick Actions */}
                <div className="p-3 bg-slate-50/70 dark:bg-zinc-900 border-t border-slate-100 dark:border-zinc-800 flex items-center gap-2 rounded-b-2xl">
                  
                  {!isTicketServed ? (
                    <div className="flex-1 flex items-center gap-1.5">
                      {/* Quick Option 1: Ready */}
                      {!isTicketReady && (
                        <button
                          type="button"
                          disabled={kdsActionLoading[`ticket-${ticket._id}-ready`] || kdsActionLoading[`ticket-${ticket._id}-served`]}
                          onClick={() => handleUpdateAllTicketItems(ticket._id, 'ready')}
                          className="flex-1 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs flex items-center justify-center gap-1.5 cursor-pointer shadow-2xs transition-colors disabled:opacity-50"
                        >
                          {kdsActionLoading[`ticket-${ticket._id}-ready`] ? (
                            <Loader2 className="w-3.5 h-3.5 animate-spin" />
                          ) : (
                            <CheckCircle2 className="w-3.5 h-3.5" />
                          )}
                          <span>{lang === 'bn' ? 'সব রেডি' : 'Mark Ready'}</span>
                        </button>
                      )}

                      {/* Quick Option 2: Served */}
                      <button
                        type="button"
                        disabled={kdsActionLoading[`ticket-${ticket._id}-ready`] || kdsActionLoading[`ticket-${ticket._id}-served`]}
                        onClick={() => handleUpdateAllTicketItems(ticket._id, 'served')}
                        className={`flex-1 py-2.5 rounded-xl text-white font-bold text-xs flex items-center justify-center gap-1.5 cursor-pointer shadow-2xs transition-colors disabled:opacity-50 ${
                          isTicketReady
                            ? 'bg-blue-600 hover:bg-blue-700'
                            : 'bg-slate-800 hover:bg-slate-900 dark:bg-zinc-800 dark:hover:bg-zinc-700'
                        }`}
                      >
                        {kdsActionLoading[`ticket-${ticket._id}-served`] ? (
                          <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        ) : (
                          <Utensils className="w-3.5 h-3.5" />
                        )}
                        <span>{lang === 'bn' ? 'সব পরিবেশিত' : 'Mark Served'}</span>
                      </button>
                    </div>
                  ) : (
                    <div className="flex-1 flex items-center gap-1.5">
                      <div className="flex-1 py-2 rounded-xl bg-slate-100 dark:bg-zinc-800 text-slate-500 dark:text-zinc-400 font-bold text-xs flex items-center justify-center gap-1.5">
                        <Check className="w-3.5 h-3.5 text-emerald-500" />
                        <span>{lang === 'bn' ? 'পরিবেশন সম্পন্ন' : 'Delivered & Served'}</span>
                      </div>

                      <button
                        type="button"
                        disabled={kdsActionLoading[`ticket-${ticket._id}-cooking`]}
                        onClick={() => handleUpdateAllTicketItems(ticket._id, 'cooking')}
                        className="px-2.5 py-2 rounded-xl border border-slate-200 dark:border-zinc-700 hover:bg-slate-100 dark:hover:bg-zinc-800 text-amber-600 dark:text-amber-400 text-xs font-bold cursor-pointer transition-colors flex items-center gap-1 disabled:opacity-50"
                        title="Revert to Cooking"
                      >
                        {kdsActionLoading[`ticket-${ticket._id}-cooking`] ? (
                          <Loader2 className="w-3 h-3 animate-spin" />
                        ) : (
                          <RotateCcw className="w-3 h-3" />
                        )}
                        <span>{lang === 'bn' ? 'পুনরায়' : 'Revert'}</span>
                      </button>
                    </div>
                  )}

                </div>
              </Card>
            );
          })}
        </div>
      )}

      {/* ---------------------------------------------------- */}
      {/* MODAL 1: EDIT TICKET / NOTES                         */}
      {/* ---------------------------------------------------- */}
      {editingTicket && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs animate-in fade-in">
          <Card className="max-w-md w-full p-5 bg-white dark:bg-[#121215] border-slate-200 dark:border-zinc-800 shadow-2xl space-y-4 text-xs relative">
            
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-zinc-800 pb-3">
              <div>
                <h3 className="font-bold text-sm text-slate-900 dark:text-white flex items-center gap-2">
                  <Edit3 className="w-4 h-4 text-orange-500" />
                  <span>{lang === 'bn' ? 'টিকিট ও নোট এডিট' : 'Edit Ticket Details & Notes'}</span>
                </h3>
                <p className="text-[10px] text-slate-400 font-mono mt-0.5">
                  #{editingTicket.order_number} • KOT: {editingTicket.kot_number}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setEditingTicket(null)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-white cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveEdit} className="space-y-3">
              
              <div>
                <label className="block text-[11px] font-semibold text-slate-700 dark:text-zinc-300 mb-1">
                  {lang === 'bn' ? 'শেফ স্পেশাল নির্দেশনা:' : 'Chef Special Instructions:'}
                </label>
                <textarea
                  rows={2}
                  placeholder="e.g. Less spicy, Serve soup first..."
                  value={editForm.special_instructions}
                  onChange={(e) => setEditForm({ ...editForm, special_instructions: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 text-xs text-slate-900 dark:text-white outline-none focus:ring-1 focus:ring-orange-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-[11px] font-semibold text-slate-700 dark:text-zinc-300 mb-1">
                    {lang === 'bn' ? 'ওয়েটার / সার্ভার:' : 'Server / Waiter:'}
                  </label>
                  <input
                    type="text"
                    value={editForm.waiter_name}
                    onChange={(e) => setEditForm({ ...editForm, waiter_name: e.target.value })}
                    className="w-full px-2.5 py-1.5 rounded-lg bg-slate-50 dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 text-xs text-slate-900 dark:text-white outline-none focus:ring-1 focus:ring-orange-500"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-slate-700 dark:text-zinc-300 mb-1">
                    {lang === 'bn' ? 'অতিথি / কাস্টমার:' : 'Guest Name:'}
                  </label>
                  <input
                    type="text"
                    value={editForm.customer_name}
                    onChange={(e) => setEditForm({ ...editForm, customer_name: e.target.value })}
                    className="w-full px-2.5 py-1.5 rounded-lg bg-slate-50 dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 text-xs text-slate-900 dark:text-white outline-none focus:ring-1 focus:ring-orange-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-700 dark:text-zinc-300 mb-1">
                  {lang === 'bn' ? 'খাবারভিত্তিক নির্দিষ্ট নোট:' : 'Per-Dish Specific Notes:'}
                </label>
                <div className="space-y-1.5 max-h-40 overflow-y-auto pr-1">
                  {editForm.items.map((it, idx) => (
                    <div key={it._id || idx} className="p-2 rounded-xl bg-slate-50 dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 space-y-1">
                      <div className="font-semibold text-slate-800 dark:text-zinc-200 truncate">{it.name}</div>
                      <input
                        type="text"
                        placeholder="Dish note..."
                        value={it.cooking_notes}
                        onChange={(e) => {
                          const updated = [...editForm.items];
                          updated[idx] = { ...updated[idx], cooking_notes: e.target.value };
                          setEditForm({ ...editForm, items: updated });
                        }}
                        className="w-full px-2 py-1 rounded-md bg-white dark:bg-[#121215] border border-slate-200 dark:border-zinc-700 text-xs outline-none focus:ring-1 focus:ring-orange-500"
                      />
                    </div>
                  ))}
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100 dark:border-zinc-800">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setEditingTicket(null)}
                  className="cursor-pointer"
                >
                  {lang === 'bn' ? 'বাতিল' : 'Cancel'}
                </Button>
                <Button
                  type="submit"
                  size="sm"
                  disabled={isSavingEdit}
                  className="bg-orange-500 hover:bg-orange-600 text-white cursor-pointer font-bold gap-1"
                >
                  {isSavingEdit ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Check className="w-3.5 h-3.5" />}
                  <span>{lang === 'bn' ? 'সংরক্ষণ করুন' : 'Save Changes'}</span>
                </Button>
              </div>

            </form>
          </Card>
        </div>
      )}

      {/* ---------------------------------------------------- */}
      {/* MODAL 2: CONFIRM DELETE DIALOG                       */}
      {/* ---------------------------------------------------- */}
      <ConfirmDialog
        isOpen={deleteDialog.isOpen}
        title={lang === 'bn' ? 'আপনি কি এই টিকিটটি বাতিল করতে চান?' : 'Cancel Kitchen Ticket?'}
        description={
          deleteDialog.ticket
            ? (lang === 'bn'
                ? `কেওটি #${deleteDialog.ticket.kot_number || deleteDialog.ticket.order_number} (${deleteDialog.ticket.table_number ? `টেবিল ${deleteDialog.ticket.table_number}` : 'পার্সেল'}) বাতিল করা হবে।`
                : `KOT #${deleteDialog.ticket.kot_number || deleteDialog.ticket.order_number} will be cancelled.`)
            : ''
        }
        confirmText={lang === 'bn' ? 'হ্যাঁ, বাতিল করুন' : 'Yes, Cancel Ticket'}
        cancelText={lang === 'bn' ? 'না, রাখুন' : 'No, Keep'}
        variant="danger"
        isLoading={deleteDialog.isLoading}
        onConfirm={confirmDeleteTicket}
        onCancel={() => setDeleteDialog({ isOpen: false, ticket: null, isLoading: false })}
      />

    </div>
  );
}
