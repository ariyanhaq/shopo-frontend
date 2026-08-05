/**
 * @file GymSales.jsx
 * @description Gym Merchandise & POS Sales History page (Sales overview, POS shortcut & invoice details).
 */
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useLanguage } from '@/context/LanguageContext';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import {
  ShoppingCart, Plus, Search, DollarSign, Calendar, FileText,
  Printer, ArrowUpRight, CheckCircle2, Store
} from 'lucide-react';

export default function GymSales() {
  const navigate = useNavigate();
  const { lang } = useLanguage();
  const [searchTerm, setSearchTerm] = useState('');

  const sales = [
    { id: '#INV-GYM-801', customer: 'Mahmudur Rahman', items: 'Whey Protein Isolate 1kg, Gym Shaker Bottle', amount: 5650, date: '2026-08-05 10:15 AM', method: 'bKash', status: 'Paid' },
    { id: '#INV-GYM-802', customer: 'Nusrat Jahan', items: 'Shopo Dry-Fit T-Shirt (Size M), Mineral Water 1L', amount: 885, date: '2026-08-05 11:30 AM', method: 'Card', status: 'Paid' },
    { id: '#INV-GYM-803', customer: 'Sajid Hossain', items: 'Compression Sweat Trousers, Creatine Monohydrate', amount: 3650, date: '2026-08-04 06:45 PM', method: 'Cash', status: 'Paid' },
    { id: '#INV-GYM-804', customer: 'Farhana Akter', items: 'Leather Gym Wrist Gloves, BCAA Drink', amount: 890, date: '2026-08-04 08:20 PM', method: 'Nagad', status: 'Paid' }
  ];

  const filteredSales = sales.filter(s =>
    s.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
    s.customer.toLowerCase().includes(searchTerm.toLowerCase()) ||
    s.items.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const totalSalesAmount = sales.reduce((acc, s) => acc + s.amount, 0);

  return (
    <div className="space-y-6 font-sans font-normal text-slate-800 dark:text-zinc-200">
      
      {/* HEADER SECTION */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-medium text-slate-900 dark:text-white tracking-tight">
            Merchandise & Product Sales History
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-zinc-400 font-normal mt-0.5">
            Track daily sales of supplements, water bottles, shaker bottles, gym apparel & POS memos.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            onClick={() => navigate('/sales/pos')}
            className="gap-1.5 font-medium dark:bg-[#121215]"
          >
            <Store className="w-4 h-4 text-emerald-600 dark:text-[#00df89]" />
            <span>Open Gym POS</span>
          </Button>

          <Button
            variant="default"
            onClick={() => navigate('/sales/new')}
            className="gap-1.5 bg-[#00df89] hover:bg-[#00c97b] text-[#011812] font-medium"
          >
            <Plus className="w-4 h-4 stroke-[2]" />
            <span>New Product Sale</span>
          </Button>
        </div>
      </div>

      {/* KPI METRICS */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card className="p-4 border border-slate-200/90 dark:border-zinc-800/80 dark:bg-[#121215]">
          <span className="text-xs font-normal text-slate-500 dark:text-zinc-400">Total Product Sales</span>
          <div className="mt-1 text-2xl font-normal text-emerald-600 dark:text-[#00df89]">৳ {totalSalesAmount.toLocaleString()}</div>
        </Card>

        <Card className="p-4 border border-slate-200/90 dark:border-zinc-800/80 dark:bg-[#121215]">
          <span className="text-xs font-normal text-slate-500 dark:text-zinc-400">Total Invoices Issued</span>
          <div className="mt-1 text-2xl font-normal text-slate-900 dark:text-white">{sales.length} Sales</div>
        </Card>

        <Card className="p-4 border border-slate-200/90 dark:border-zinc-800/80 dark:bg-[#121215]">
          <span className="text-xs font-normal text-slate-500 dark:text-zinc-400">Average Cart Order</span>
          <div className="mt-1 text-2xl font-normal text-blue-500">
            ৳ {Math.round(totalSalesAmount / (sales.length || 1)).toLocaleString()}
          </div>
        </Card>
      </div>

      {/* SEARCH BAR */}
      <Card className="p-4 border border-slate-200/90 dark:border-zinc-800/80 dark:bg-[#121215]">
        <div className="relative w-full max-w-md">
          <Search className="w-4 h-4 text-slate-400 dark:text-zinc-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <Input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search sales by invoice #, customer or product item..."
            className="pl-10 dark:bg-[#09090b]"
          />
        </div>
      </Card>

      {/* SALES TABLE */}
      <Card className="border border-slate-200/90 dark:border-zinc-800/80 dark:bg-[#121215] overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs sm:text-sm">
            <thead>
              <tr className="border-b border-slate-200/80 dark:border-zinc-800/80 bg-slate-50/50 dark:bg-zinc-900/50 text-slate-500 dark:text-zinc-400 font-normal">
                <th className="p-4 font-medium">Invoice #</th>
                <th className="p-4 font-medium">Customer / Athlete</th>
                <th className="p-4 font-medium">Items Purchased</th>
                <th className="p-4 font-medium">Date & Time</th>
                <th className="p-4 font-medium">Payment Method</th>
                <th className="p-4 text-right font-medium">Total Amount</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-zinc-800/60 font-normal">
              {filteredSales.map((s) => (
                <tr key={s.id} className="hover:bg-slate-50/60 dark:hover:bg-zinc-800/40 transition-colors">
                  <td className="p-4 font-mono font-medium text-emerald-600 dark:text-[#00df89]">{s.id}</td>
                  <td className="p-4 font-medium text-slate-900 dark:text-white">{s.customer}</td>
                  <td className="p-4 text-slate-600 dark:text-zinc-400 font-normal">{s.items}</td>
                  <td className="p-4 font-mono text-slate-400 text-xs">{s.date}</td>
                  <td className="p-4">
                    <span className="px-2 py-0.5 rounded-md bg-slate-100 dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 font-mono text-[11px]">
                      {s.method}
                    </span>
                  </td>
                  <td className="p-4 text-right font-medium text-slate-900 dark:text-white">৳ {s.amount.toLocaleString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

    </div>
  );
}
