import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useLanguage } from '@/context/LanguageContext';
import { useShop } from '@/context/ShopContext';
import api from '@/services/api';
import toast from 'react-hot-toast';
import { Card, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Flame, Clock, CheckCircle2, ArrowLeft, RefreshCw, Volume2,
  VolumeX, ChefHat, Utensils, AlertTriangle, Play, Sparkles
} from 'lucide-react';

export default function RestaurantKDS() {
  const navigate = useNavigate();
  const { lang } = useLanguage();
  const { activeShop } = useShop();

  const [tickets, setTickets] = useState([]);
  const [selectedStation, setSelectedStation] = useState('all');
  const [isLoading, setIsLoading] = useState(true);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [currentTime, setCurrentTime] = useState(Date.now());

  // Ticker timer for live stopwatches
  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(Date.now()), 1000);
    return () => clearInterval(timer);
  }, []);

  const fetchTickets = async () => {
    try {
      setIsLoading(true);
      const res = await api.restaurant.kds.getTickets(selectedStation);
      if (res?.success) {
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
    const interval = setInterval(fetchTickets, 10000); // 10s auto-refresh
    return () => clearInterval(interval);
  }, [activeShop, selectedStation]);

  const handleUpdateItemStatus = async (orderId, itemId, newStatus) => {
    try {
      const res = await api.restaurant.kds.updateItemStatus({
        orderId,
        itemId,
        status: newStatus,
      });
      if (res?.success) {
        toast.success(`Item marked as ${newStatus}!`);
        fetchTickets();
      }
    } catch (err) {
      toast.error(err.message || 'Failed to update status');
    }
  };

  const stations = [
    { id: 'all', label: lang === 'bn' ? 'সকল স্টেশন' : 'All Kitchen Stations' },
    { id: 'main_kitchen', label: lang === 'bn' ? 'প্রধান রান্নাঘর' : 'Main Kitchen / Curry' },
    { id: 'grill_tandoor', label: lang === 'bn' ? 'গ্রিল ও তান্দুর' : 'Grill & Tandoor' },
    { id: 'beverage_bar', label: lang === 'bn' ? 'জুস ও বার' : 'Juice & Beverage Bar' },
    { id: 'bakery_dessert', label: lang === 'bn' ? 'বেকারি ও ডেজার্ট' : 'Bakery & Dessert' },
  ];

  return (
    <div className="space-y-4 font-sans pb-16">
      
      {/* HEADER & CONTROLS */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-zinc-950 text-white p-4 rounded-2xl border border-zinc-800 shadow-lg">
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate('/restaurant/dashboard')}
            className="p-2 rounded-xl border border-zinc-800 hover:bg-zinc-900 text-zinc-400 hover:text-white cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
          <div>
            <h1 className="text-lg font-black tracking-tight flex items-center gap-2 text-white">
              <Flame className="w-5 h-5 text-orange-500 animate-pulse" />
              <span>Live Kitchen Display System (KDS)</span>
            </h1>
            <p className="text-xs text-zinc-400">
              Active chef tickets with live prep duration stopwatches.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* Station selector */}
          <select
            value={selectedStation}
            onChange={(e) => setSelectedStation(e.target.value)}
            className="h-9 px-3 rounded-xl border border-zinc-800 bg-zinc-900 text-xs font-semibold text-white focus:outline-none"
          >
            {stations.map((s) => (
              <option key={s.id} value={s.id}>{s.label}</option>
            ))}
          </select>

          {/* Sound Toggle */}
          <button
            onClick={() => setSoundEnabled(!soundEnabled)}
            className={`p-2 rounded-xl border border-zinc-800 transition-all cursor-pointer ${
              soundEnabled ? 'bg-orange-500/20 text-orange-400' : 'bg-zinc-900 text-zinc-500'
            }`}
            title="Toggle Bell Sound"
          >
            {soundEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
          </button>

          {/* Refresh */}
          <button
            onClick={fetchTickets}
            className="p-2 rounded-xl border border-zinc-800 bg-zinc-900 hover:bg-zinc-800 text-white cursor-pointer"
            title="Refresh"
          >
            <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* TICKETS GRID */}
      {isLoading && tickets.length === 0 ? (
        <div className="text-center py-20 text-xs text-slate-400">Loading kitchen tickets...</div>
      ) : tickets.length === 0 ? (
        <div className="text-center py-24 bg-white dark:bg-zinc-900 rounded-2xl border border-dashed border-slate-200 dark:border-zinc-800 p-8">
          <ChefHat className="w-12 h-12 mx-auto text-emerald-500 mb-2 opacity-80" />
          <div className="text-base font-bold text-slate-900 dark:text-white">
            All Caught Up! Kitchen is Clear 👨‍🍳
          </div>
          <p className="text-xs text-slate-500 mt-1">
            No active orders waiting in this station queue right now.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {tickets.map((ticket) => {
            const createdAtMs = new Date(ticket.created_at).getTime();
            const elapsedMins = Math.floor((currentTime - createdAtMs) / 60000);
            const elapsedSecs = Math.floor(((currentTime - createdAtMs) % 60000) / 1000);

            // Color status based on minutes elapsed
            const isCritical = elapsedMins >= 20;
            const isWarning = elapsedMins >= 10 && elapsedMins < 20;

            const borderColor = isCritical
              ? 'border-rose-500 ring-1 ring-rose-500/50'
              : isWarning
              ? 'border-amber-500 ring-1 ring-amber-500/50'
              : 'border-emerald-500/60';

            const headerBg = isCritical
              ? 'bg-rose-500 text-white'
              : isWarning
              ? 'bg-amber-500 text-white'
              : 'bg-emerald-600 text-white';

            return (
              <Card
                key={ticket._id}
                className={`rounded-2xl border shadow-md overflow-hidden bg-white dark:bg-[#121215] flex flex-col justify-between ${borderColor}`}
              >
                <div>
                  {/* Ticket Header */}
                  <div className={`p-3 ${headerBg} flex items-center justify-between`}>
                    <div>
                      <div className="font-black text-sm uppercase tracking-wide">
                        {ticket.order_type === 'dine_in'
                          ? `Table ${ticket.table_number || 'Dine-In'}`
                          : ticket.order_type === 'takeaway'
                          ? '📦 Parcel'
                          : '🛵 Delivery'}
                      </div>
                      <div className="text-[10px] opacity-90">
                        #{ticket.order_number} • KOT: {ticket.kot_number || 'KOT'}
                      </div>
                    </div>

                    {/* Elapsed Timer Stopwatch */}
                    <div className="text-right">
                      <div className="font-mono font-black text-base flex items-center gap-1 justify-end">
                        <Clock className="w-3.5 h-3.5" />
                        <span>
                          {String(elapsedMins).padStart(2, '0')}:{String(elapsedSecs).padStart(2, '0')}
                        </span>
                      </div>
                      <div className="text-[9px] uppercase font-bold tracking-wider">
                        {isCritical ? '🚨 Overdue' : isWarning ? '⏳ In Progress' : '⚡ Fresh'}
                      </div>
                    </div>
                  </div>

                  {/* Server / Guest Notes */}
                  <div className="px-3 py-1.5 bg-slate-50 dark:bg-zinc-800/60 border-b border-slate-100 dark:border-zinc-800 text-[11px] text-slate-600 dark:text-zinc-400 flex items-center justify-between">
                    <span>👤 {ticket.customer_name || 'Guest'}</span>
                    {ticket.waiter_name && <span>Server: {ticket.waiter_name}</span>}
                  </div>

                  {/* Items List */}
                  <div className="p-3 space-y-2 max-h-[300px] overflow-y-auto">
                    {ticket.items.map((item) => {
                      const isCooking = item.status === 'cooking';
                      const isReady = item.status === 'ready';
                      const isServed = item.status === 'served';

                      return (
                        <div
                          key={item._id}
                          className={`p-2 rounded-xl border text-xs transition-all ${
                            isReady || isServed
                              ? 'bg-emerald-500/10 border-emerald-500/30 opacity-70'
                              : isCooking
                              ? 'bg-amber-500/10 border-amber-500/30'
                              : 'bg-slate-50 dark:bg-zinc-800/40 border-slate-200 dark:border-zinc-800'
                          }`}
                        >
                          <div className="flex items-start justify-between gap-1">
                            <div className="flex items-center gap-2">
                              <span className="w-5 h-5 rounded-md bg-slate-900 text-white dark:bg-white dark:text-slate-900 font-bold text-xs flex items-center justify-center font-mono">
                                {item.quantity}
                              </span>
                              <div>
                                <span className={`font-bold ${isReady || isServed ? 'line-through text-slate-400' : 'text-slate-900 dark:text-white'}`}>
                                  {item.name}
                                </span>
                                {item.name_bn && (
                                  <div className="text-[10px] text-slate-400">{item.name_bn}</div>
                                )}
                              </div>
                            </div>

                            {/* Status Buttons */}
                            <div className="flex items-center gap-1">
                              {!isReady && !isServed && (
                                <button
                                  onClick={() => handleUpdateItemStatus(ticket._id, item._id, 'ready')}
                                  className="px-2 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-[10px] flex items-center gap-1 cursor-pointer"
                                >
                                  <CheckCircle2 className="w-3 h-3" />
                                  <span>Ready</span>
                                </button>
                              )}
                              {isReady && !isServed && (
                                <button
                                  onClick={() => handleUpdateItemStatus(ticket._id, item._id, 'served')}
                                  className="px-2 py-1 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-bold text-[10px] cursor-pointer"
                                >
                                  Served
                                </button>
                              )}
                              {isServed && (
                                <Badge className="bg-emerald-500 text-white text-[9px]">Served</Badge>
                              )}
                            </div>
                          </div>

                          {/* Modifiers & Notes */}
                          {item.modifiers && item.modifiers.length > 0 && (
                            <div className="text-[10px] font-semibold text-orange-600 dark:text-orange-400 mt-1 pl-7">
                              + {item.modifiers.map((m) => m.name).join(', ')}
                            </div>
                          )}

                          {item.cooking_notes && (
                            <div className="text-[10px] text-rose-600 dark:text-rose-400 font-bold mt-1 pl-7 flex items-center gap-1">
                              <span>⚠️ Note:</span>
                              <span className="italic">"{item.cooking_notes}"</span>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Footer Quick Complete */}
                <div className="p-3 bg-slate-50 dark:bg-zinc-900 border-t border-slate-100 dark:border-zinc-800">
                  <button
                    onClick={() => {
                      ticket.items.forEach((it) => {
                        if (it.status !== 'ready' && it.status !== 'served') {
                          handleUpdateItemStatus(ticket._id, it._id, 'ready');
                        }
                      });
                    }}
                    className="w-full py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs flex items-center justify-center gap-1.5 cursor-pointer"
                  >
                    <CheckCircle2 className="w-4 h-4" />
                    <span>Mark All Dishes Ready</span>
                  </button>
                </div>
              </Card>
            );
          })}
        </div>
      )}

    </div>
  );
}
