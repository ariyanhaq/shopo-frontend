import { useState, useEffect } from 'react';
import { useLanguage } from '@/context/LanguageContext';
import { useShop } from '@/context/ShopContext';
import api from '@/services/api';
import toast from 'react-hot-toast';
import { Card, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import {
  Users, UserCheck, Plus, RefreshCw, ChefHat, DollarSign,
  Utensils, Sparkles, Award
} from 'lucide-react';

export default function RestaurantStaff() {
  const { lang } = useLanguage();
  const { activeShop } = useShop();

  const [staff, setStaff] = useState([
    { id: 'S-1', name: 'Sajjad Hossain', role: 'Head Waiter / Captain', shift: 'Evening (4PM - 12AM)', tablesAssigned: 'T-01, T-02, VIP-1', monthlySales: '৳ 340,000', tipsEarned: '৳ 8,400', rating: '4.9 ★' },
    { id: 'S-2', name: 'Rahul Ahmed', role: 'Steward / Server', shift: 'Day (10AM - 6PM)', tablesAssigned: 'T-03, T-04', monthlySales: '৳ 210,000', tipsEarned: '৳ 5,200', rating: '4.8 ★' },
    { id: 'S-3', name: 'Chef Rafiqul Islam', role: 'Executive Head Chef', shift: 'All Shifts', tablesAssigned: 'Main Kitchen', monthlySales: '—', tipsEarned: '—', rating: '5.0 ★' },
    { id: 'S-4', name: 'Kalam Hossain', role: 'Grill & BBQ Master', shift: 'Evening (4PM - 12AM)', tablesAssigned: 'Grill Station', monthlySales: '—', tipsEarned: '—', rating: '4.9 ★' },
  ]);

  return (
    <div className="space-y-6 font-sans pb-16">
      
      {/* HEADER */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white tracking-tight flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-purple-500/10 text-purple-600 flex items-center justify-center">
              <UserCheck className="w-4 h-4" />
            </div>
            <span>{lang === 'bn' ? 'ওয়েটার ও কিচেন স্টাফ ম্যানেজমেন্ট' : 'Waiters, Stewards & Kitchen Staff'}</span>
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-zinc-400 font-normal mt-0.5">
            {lang === 'bn'
              ? 'ওয়েটারদের টেবিল অ্যাসাইনমেন্ট, টিপ কালেকশন এবং সেলস পারফরম্যান্স ট্র্যাক করুন।'
              : 'Track waiter table assignments, tip collections, shift rosters and sales attribution.'}
          </p>
        </div>
      </div>

      {/* STAFF CARDS */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {staff.map((member) => (
          <Card
            key={member.id}
            className="p-5 bg-white dark:bg-zinc-900 border-slate-200/80 dark:border-zinc-800 shadow-xs rounded-2xl flex flex-col justify-between"
          >
            <div>
              <div className="flex items-start justify-between">
                <div className="w-10 h-10 rounded-2xl bg-orange-500/10 text-orange-600 flex items-center justify-center font-bold text-sm">
                  {member.name.charAt(0)}
                </div>
                <Badge className="bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border-emerald-500/30 text-[10px]">
                  {member.rating}
                </Badge>
              </div>

              <div className="font-bold text-sm text-slate-900 dark:text-white mt-3">
                {member.name}
              </div>
              <div className="text-xs font-semibold text-orange-600 dark:text-orange-400">
                {member.role}
              </div>
              <div className="text-[11px] text-slate-500 dark:text-zinc-400 mt-1">
                Shift: {member.shift}
              </div>

              <div className="mt-3 p-2.5 bg-slate-50 dark:bg-zinc-800/40 rounded-xl space-y-1 text-xs">
                <div className="flex justify-between">
                  <span className="text-slate-500">Assignment:</span>
                  <span className="font-bold text-slate-900 dark:text-white">{member.tablesAssigned}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Sales Billed:</span>
                  <span className="font-mono font-bold">{member.monthlySales}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Tips Earned:</span>
                  <span className="font-mono font-bold text-emerald-600">{member.tipsEarned}</span>
                </div>
              </div>
            </div>

            <div className="mt-4 pt-3 border-t border-slate-100 dark:border-zinc-800 text-center">
              <span className="text-[10px] text-slate-400 font-semibold">Active On Duty</span>
            </div>
          </Card>
        ))}
      </div>

    </div>
  );
}
