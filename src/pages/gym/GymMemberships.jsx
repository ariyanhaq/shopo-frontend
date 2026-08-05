/**
 * @file GymMemberships.jsx
 * @description Membership expiry tracking, renewals, upgrades, downgrades & freeze management.
 */
import { useState } from 'react';
import { useLanguage } from '@/context/LanguageContext';
import { Card, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Award, Clock, AlertTriangle, ShieldCheck, RefreshCw, Flame,
  Search, CheckCircle2, Snowflake, ArrowUpRight
} from 'lucide-react';

import { INITIAL_GYM_MEMBERS } from '@/data/gymData';

export default function GymMemberships() {
  const { lang } = useLanguage();

  const [members, setMembers] = useState(INITIAL_GYM_MEMBERS);
  const [filterTab, setFilterTab] = useState('All');

  const expiringSoon = members.filter(m => m.status === 'Expiring Soon');
  const expired = members.filter(m => m.status === 'Expired');
  const active = members.filter(m => m.status === 'Active');

  const displayedMembers =
    filterTab === 'Expiring' ? expiringSoon :
    filterTab === 'Expired' ? expired :
    filterTab === 'Active' ? active : members;

  const handleRenew = (mId) => {
    setMembers(members.map(m => {
      if (m.id === mId) {
        return { ...m, status: 'Active', remainingDays: 30, endDate: '2026-09-05' };
      }
      return m;
    }));
    alert('Membership renewed for 30 days!');
  };

  const handleFreeze = (mId) => {
    setMembers(members.map(m => {
      if (m.id === mId) {
        return { ...m, status: 'Frozen' };
      }
      return m;
    }));
    alert('Membership frozen successfully!');
  };

  return (
    <div className="space-y-6 font-sans">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-extrabold text-slate-900 dark:text-white flex items-center gap-2">
            <Award className="w-6 h-6 text-[#00df89]" />
            <span>Membership Management & Renewals</span>
          </h1>
          <p className="text-xs text-slate-500 font-normal">
            Track member expiry dates, freeze accounts, upgrade plans & process quick renewals.
          </p>
        </div>
      </div>

      {/* KPI METRICS ROW */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card className="p-5 border border-slate-200/90 dark:border-zinc-800/80 dark:bg-[#121215]">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-500">Expiring in 7 Days</span>
            <AlertTriangle className="w-4 h-4 text-amber-500" />
          </div>
          <div className="mt-2 text-2xl font-extrabold text-amber-600 dark:text-amber-400">{expiringSoon.length} Members</div>
        </Card>

        <Card className="p-5 border border-slate-200/90 dark:border-zinc-800/80 dark:bg-[#121215]">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-500">Expired Memberships</span>
            <Clock className="w-4 h-4 text-rose-500" />
          </div>
          <div className="mt-2 text-2xl font-extrabold text-rose-600 dark:text-rose-400">{expired.length} Members</div>
        </Card>

        <Card className="p-5 border border-slate-200/90 dark:border-zinc-800/80 dark:bg-[#121215]">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-500">Active Valid Passes</span>
            <ShieldCheck className="w-4 h-4 text-emerald-500" />
          </div>
          <div className="mt-2 text-2xl font-extrabold text-emerald-600 dark:text-[#00df89]">{active.length} Members</div>
        </Card>
      </div>

      {/* FILTER TABS */}
      <div className="flex items-center gap-2 border-b border-slate-200 dark:border-zinc-800 pb-2">
        {['All', 'Expiring', 'Expired', 'Active'].map((tab) => (
          <button
            key={tab}
            onClick={() => setFilterTab(tab)}
            className={`px-4 py-1.5 text-xs font-bold rounded-full transition-colors ${
              filterTab === tab
                ? 'bg-[#00df89] text-[#011812]'
                : 'bg-slate-100 dark:bg-zinc-800 text-slate-600 dark:text-zinc-300'
            }`}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* MEMBERSHIPS LIST */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {displayedMembers.map((m) => (
          <Card key={m.id} className="p-5 border border-slate-200/90 dark:border-zinc-800/80 dark:bg-[#121215] space-y-4">
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-3">
                <img src={m.photo} alt={m.fullName} className="w-12 h-12 rounded-full object-cover border" />
                <div>
                  <h3 className="font-bold text-sm text-slate-900 dark:text-white">{m.fullName}</h3>
                  <p className="text-xs text-slate-500">{m.phone} • Locker: {m.lockerNumber}</p>
                  <Badge variant={m.status === 'Active' ? 'default' : m.status === 'Expiring Soon' ? 'warning' : 'destructive'} className="mt-1 text-[10px]">
                    {m.status}
                  </Badge>
                </div>
              </div>

              <div className="text-right">
                <span className="text-xs font-extrabold text-emerald-600 dark:text-[#00df89] block">{m.membershipPackage}</span>
                <span className="text-[11px] text-slate-400 font-mono">Expires: {m.endDate}</span>
              </div>
            </div>

            <div className="flex items-center justify-between pt-3 border-t border-slate-100 dark:border-zinc-800 text-xs">
              <span className="text-slate-500">Remaining Days: <strong className="text-slate-900 dark:text-white">{m.remainingDays}d</strong></span>
              
              <div className="flex items-center gap-2">
                <Button variant="outline" size="sm" onClick={() => handleFreeze(m.id)} className="h-8 text-xs dark:bg-zinc-900 gap-1">
                  <Snowflake className="w-3.5 h-3.5 text-blue-400" /> Freeze
                </Button>

                <Button size="sm" onClick={() => handleRenew(m.id)} className="h-8 text-xs bg-[#00df89] text-[#011812] hover:bg-[#00c97b] font-bold gap-1">
                  <RefreshCw className="w-3.5 h-3.5" /> Renew Pass
                </Button>
              </div>
            </div>
          </Card>
        ))}
      </div>

    </div>
  );
}
