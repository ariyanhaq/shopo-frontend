/**
 * @file IndustryWidgets.jsx
 * @description Specialized business widgets tailored per shop type (Grocery, Gym, Restaurant, Clothing, Stationery, Mobile, Jewelry, Wholesale).
 */
import { useState } from 'react';
import { motion } from 'framer-motion';
import {
  AlertTriangle, Clock, ShieldCheck, CheckCircle2, TrendingUp,
  ChefHat, UserCheck, RefreshCw, Layers, Sparkles, QrCode,
  Tag, Calendar, Plus, Truck, ArrowUpRight, Scale, Barcode
} from 'lucide-react';

export function ExpiringProductsWidget({ onAction }) {
  const expiringItems = [
    { name: 'Fresh Milk 1L (Pran)', batch: 'BT-902', daysLeft: 3, stock: '45 Pcs', status: 'critical' },
    { name: 'Farm Fresh Eggs (Tray)', batch: 'BT-881', daysLeft: 5, stock: '8 Trays', status: 'critical' },
    { name: 'Seclo 20mg Strips', batch: 'BT-441', daysLeft: 14, stock: '18 Strips', status: 'warning' },
    { name: 'Greek Yogurt 500g', batch: 'BT-332', daysLeft: 18, stock: '12 Pcs', status: 'warning' }
  ];

  return (
    <div className="bg-white dark:bg-slate-900 rounded-2xl p-5 border border-slate-200/90 dark:border-slate-800 shadow-sm flex flex-col justify-between">
      <div>
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-rose-500/10 text-rose-600 flex items-center justify-center font-bold">
              <AlertTriangle className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-extrabold text-slate-900 dark:text-white text-base">Expiring Products & Low Stock</h3>
              <p className="text-xs text-slate-500 font-medium">Perishable items requiring discount or return</p>
            </div>
          </div>
          <span className="text-xs font-bold px-2.5 py-1 rounded-full bg-rose-500/10 text-rose-600 border border-rose-500/20">
            4 Alerts
          </span>
        </div>

        <div className="space-y-3">
          {expiringItems.map((item, idx) => (
            <div
              key={idx}
              className="flex items-center justify-between p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800"
            >
              <div className="space-y-0.5">
                <div className="font-bold text-sm text-slate-900 dark:text-white flex items-center gap-2">
                  <span>{item.name}</span>
                  <span className="text-[10px] font-mono text-slate-400">({item.batch})</span>
                </div>
                <div className="text-xs text-slate-500 font-medium">
                  Current Stock: <span className="font-semibold text-slate-700 dark:text-slate-300">{item.stock}</span>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <span className={`text-xs font-extrabold px-2.5 py-1 rounded-lg ${
                  item.status === 'critical'
                    ? 'bg-rose-100 dark:bg-rose-950/60 text-rose-700 dark:text-rose-400'
                    : 'bg-amber-100 dark:bg-amber-950/60 text-amber-700 dark:text-amber-400'
                }`}>
                  {item.daysLeft}d left
                </span>
                <button
                  onClick={() => onAction && onAction('Reorder Expiring Stock')}
                  className="text-xs font-bold px-2.5 py-1 rounded-lg bg-slate-200 dark:bg-slate-700 text-slate-800 dark:text-slate-200 hover:bg-slate-300 dark:hover:bg-slate-600 transition-colors"
                >
                  Action
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export function GymAttendanceWidget({ onAction }) {
  const members = [
    { name: 'Tanvir Hossain', plan: '6-Month VIP', time: '10 mins ago', status: 'Checked In', trainer: 'Rocky' },
    { name: 'Sabrina Rahman', plan: '1-Month Std', time: '25 mins ago', status: 'Expiring Soon', trainer: 'Sarah' },
    { name: 'Arif Chowdhury', plan: '1-Year Platinum', time: '40 mins ago', status: 'Checked In', trainer: 'Rocky' }
  ];

  return (
    <div className="bg-white dark:bg-slate-900 rounded-2xl p-5 border border-slate-200/90 dark:border-slate-800 shadow-sm">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl bg-red-500/10 text-red-600 flex items-center justify-center font-bold">
            <UserCheck className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-extrabold text-slate-900 dark:text-white text-base">Athlete Check-in Log</h3>
            <p className="text-xs text-slate-500 font-medium">Real-time attendance & trainer assignment</p>
          </div>
        </div>
        <button
          onClick={() => onAction && onAction('Quick Member Check-in')}
          className="text-xs font-bold px-3 py-1.5 rounded-xl bg-[#00df89] text-[#011812] hover:bg-[#00c97b] transition-all flex items-center gap-1 shadow-sm"
        >
          <QrCode className="w-3.5 h-3.5" />
          <span>Check In</span>
        </button>
      </div>

      <div className="space-y-3">
        {members.map((mem, idx) => (
          <div key={idx} className="flex items-center justify-between p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60">
            <div className="space-y-0.5">
              <div className="font-bold text-sm text-slate-900 dark:text-white">{mem.name}</div>
              <div className="text-xs text-slate-500 font-medium">
                {mem.plan} • Trainer: <span className="text-slate-700 dark:text-slate-300 font-semibold">{mem.trainer}</span>
              </div>
            </div>
            <div className="text-right">
              <span className={`text-[11px] font-extrabold px-2 py-0.5 rounded-md ${
                mem.status === 'Expiring Soon'
                  ? 'bg-amber-100 text-amber-700 dark:bg-amber-950/60 dark:text-amber-300'
                  : 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300'
              }`}>
                {mem.status}
              </span>
              <div className="text-[10px] text-slate-400 font-medium mt-1">{mem.time}</div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export function KitchenQueueWidget({ onAction }) {
  const orders = [
    { id: '#ORD-882', table: 'Table 4', items: 'Kacchi Biryani x2, Borhani x2', elapsed: '8 mins', status: 'Preparing' },
    { id: '#ORD-883', table: 'Table 9', items: 'Butter Chicken, Garlic Naan x4', elapsed: '12 mins', status: 'Ready' },
    { id: '#ORD-884', table: 'Takeaway', items: 'Beef Tehari x3', elapsed: '3 mins', status: 'Pending' }
  ];

  return (
    <div className="bg-white dark:bg-slate-900 rounded-2xl p-5 border border-slate-200/90 dark:border-slate-800 shadow-sm">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl bg-amber-500/10 text-amber-600 flex items-center justify-center font-bold">
            <ChefHat className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-extrabold text-slate-900 dark:text-white text-base">Live Kitchen Display (KDS)</h3>
            <p className="text-xs text-slate-500 font-medium">Orders queue & table fulfillment</p>
          </div>
        </div>
        <button
          onClick={() => onAction && onAction('New Dine-in Order')}
          className="text-xs font-bold px-3 py-1.5 rounded-xl bg-amber-500 text-white hover:bg-amber-600 transition-all flex items-center gap-1"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>New Order</span>
        </button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        {orders.map((ord, idx) => (
          <div key={idx} className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/70 border border-slate-200/80 dark:border-slate-800 space-y-2">
            <div className="flex items-center justify-between">
              <span className="font-extrabold text-xs text-slate-900 dark:text-white">{ord.id}</span>
              <span className={`text-[10px] font-extrabold px-2 py-0.5 rounded-md ${
                ord.status === 'Ready'
                  ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300'
                  : ord.status === 'Preparing'
                  ? 'bg-amber-100 text-amber-700 dark:bg-amber-950/60 dark:text-amber-300'
                  : 'bg-slate-200 text-slate-700 dark:bg-slate-700 dark:text-slate-300'
              }`}>
                {ord.status}
              </span>
            </div>
            <div className="text-xs font-bold text-slate-800 dark:text-slate-200">{ord.table}</div>
            <div className="text-xs text-slate-500 font-medium line-clamp-2">{ord.items}</div>
            <div className="text-[10px] text-slate-400 font-mono flex items-center gap-1">
              <Clock className="w-3 h-3" />
              <span>{ord.elapsed} ago</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export function GoldRateWidget() {
  return (
    <div className="bg-gradient-to-r from-amber-500/10 via-amber-500/5 to-yellow-500/10 dark:from-amber-950/40 dark:to-slate-900 rounded-2xl p-5 border border-amber-300/40 dark:border-amber-700/40 shadow-sm flex flex-col justify-between">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <Sparkles className="w-5 h-5 text-amber-600" />
          <span className="font-extrabold text-slate-900 dark:text-white text-base">Live Daily Gold Rate Ticker</span>
        </div>
        <span className="text-xs font-extrabold text-emerald-600 bg-emerald-100 dark:bg-emerald-950/60 px-2.5 py-1 rounded-full">
          +৳ 1,200 today
        </span>
      </div>

      <div className="grid grid-cols-3 gap-3 text-center my-2">
        <div className="bg-white/80 dark:bg-slate-900/80 p-3 rounded-xl border border-amber-200/50 dark:border-amber-900/50">
          <div className="text-xs text-slate-500 font-bold uppercase">22 Karat (22K)</div>
          <div className="text-base font-extrabold text-amber-700 dark:text-amber-400 mt-0.5">৳ 118,500</div>
          <div className="text-[10px] text-slate-400 font-medium">per Bhori (11.66g)</div>
        </div>
        <div className="bg-white/80 dark:bg-slate-900/80 p-3 rounded-xl border border-amber-200/50 dark:border-amber-900/50">
          <div className="text-xs text-slate-500 font-bold uppercase">21 Karat (21K)</div>
          <div className="text-base font-extrabold text-amber-700 dark:text-amber-400 mt-0.5">৳ 113,100</div>
          <div className="text-[10px] text-slate-400 font-medium">per Bhori (11.66g)</div>
        </div>
        <div className="bg-white/80 dark:bg-slate-900/80 p-3 rounded-xl border border-amber-200/50 dark:border-amber-900/50">
          <div className="text-xs text-slate-500 font-bold uppercase">18 Karat (18K)</div>
          <div className="text-base font-extrabold text-amber-700 dark:text-amber-400 mt-0.5">৳ 96,900</div>
          <div className="text-[10px] text-slate-400 font-medium">per Bhori (11.66g)</div>
        </div>
      </div>
    </div>
  );
}

export function ClothingVariantsWidget() {
  return (
    <div className="bg-white dark:bg-slate-900 rounded-2xl p-5 border border-slate-200/90 dark:border-slate-800 shadow-sm">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-extrabold text-slate-900 dark:text-white text-base">Size & Color Stock Breakdown</h3>
        <span className="text-xs font-bold text-indigo-600 bg-indigo-50 dark:bg-indigo-950/60 px-2.5 py-1 rounded-full">
          Summer Line 2026
        </span>
      </div>

      <div className="space-y-3">
        <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 space-y-2">
          <div className="flex items-center justify-between">
            <span className="font-bold text-sm text-slate-900 dark:text-white">Premium Cotton Polo Shirt</span>
            <span className="text-xs font-extrabold text-emerald-600">120 Pcs Total</span>
          </div>
          <div className="flex items-center gap-2 flex-wrap text-xs">
            <span className="px-2 py-0.5 rounded bg-slate-200 dark:bg-slate-700 font-mono">Size S: 24</span>
            <span className="px-2 py-0.5 rounded bg-slate-200 dark:bg-slate-700 font-mono">Size M: 45</span>
            <span className="px-2 py-0.5 rounded bg-slate-200 dark:bg-slate-700 font-mono">Size L: 35</span>
            <span className="px-2 py-0.5 rounded bg-slate-200 dark:bg-slate-700 font-mono">Size XL: 16</span>
          </div>
        </div>
      </div>
    </div>
  );
}
