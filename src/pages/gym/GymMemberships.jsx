/**
 * @file GymMemberships.jsx
 * @description Membership expiry tracking, renewals & status management backed by MongoDB.
 */
import { useState, useEffect } from 'react';
import { useLanguage } from '@/context/LanguageContext';
import api from '@/services/api';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectTrigger,
  SelectContent,
  SelectItem,
  SelectValue
} from '@/components/ui/select';
import {
  Award, Clock, AlertTriangle, ShieldCheck, RefreshCw,
  Search, CheckCircle2, Snowflake, ArrowUpRight, Loader2
} from 'lucide-react';

import RecordPaymentModal from '@/components/gym/RecordPaymentModal';

export default function GymMemberships() {
  const { lang } = useLanguage();

  const [members, setMembers] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [filterTab, setFilterTab] = useState('All');
  const [isRenewModalOpen, setIsRenewModalOpen] = useState(false);
  const [selectedMemberId, setSelectedMemberId] = useState('');

  const fetchMembers = async () => {
    try {
      const res = await api.gym.members.list();
      if (res.data) setMembers(res.data);
    } catch (err) {
      console.warn('Failed to load memberships:', err.message);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchMembers();
  }, []);

  const expiringSoon = members.filter(m => m.status === 'Expiring Soon');
  const expired = members.filter(m => m.status === 'Expired');
  const active = members.filter(m => m.status === 'Active');

  const displayedMembers =
    filterTab === 'Expiring' ? expiringSoon :
    filterTab === 'Expired' ? expired :
    filterTab === 'Active' ? active : members;

  const handleRenew = (mId) => {
    setSelectedMemberId(mId);
    setIsRenewModalOpen(true);
  };

  return (
    <div className="space-y-6 font-sans">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-medium text-slate-900 dark:text-white flex items-center gap-2.5">
            <Award className="w-6 h-6 text-[#00df89]" />
            <span>{lang === 'bn' ? 'মেম্বারশিপ ও পাস নবায়ন' : 'Membership Pass Management & Renewals'}</span>
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-zinc-400">
            {lang === 'bn' ? 'মেয়াদোত্তীর্ণ পাস নবায়ন ও স্থিতি ট্র্যাকিং' : 'Track member expiry dates, active subscriptions & process pass renewals'}
          </p>
        </div>
      </div>

      {/* KPI METRICS ROW */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card className="p-5 border-slate-200/90 dark:border-zinc-800/80 dark:bg-[#121215]">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-500">Expiring Soon</span>
            <AlertTriangle className="w-4 h-4 text-amber-500" />
          </div>
          <div className="mt-2 text-2xl font-medium text-amber-600 dark:text-amber-400">{expiringSoon.length} Members</div>
        </Card>

        <Card className="p-5 border-slate-200/90 dark:border-zinc-800/80 dark:bg-[#121215]">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-500">Expired Passes</span>
            <Clock className="w-4 h-4 text-rose-500" />
          </div>
          <div className="mt-2 text-2xl font-medium text-rose-600 dark:text-rose-400">{expired.length} Members</div>
        </Card>

        <Card className="p-5 border-slate-200/90 dark:border-zinc-800/80 dark:bg-[#121215]">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-500">Active Valid Passes</span>
            <ShieldCheck className="w-4 h-4 text-emerald-500" />
          </div>
          <div className="mt-2 text-2xl font-medium text-[#00a86b] dark:text-[#00df89]">{active.length} Members</div>
        </Card>
      </div>

      {/* FILTER DROPDOWN */}
      <div className="flex items-center justify-between gap-3">
        <div className="w-full sm:w-52">
          <Select value={filterTab} onValueChange={setFilterTab}>
            <SelectTrigger size="sm" className="bg-white dark:bg-[#121215] w-full h-9.5 rounded-xl border border-slate-200 dark:border-zinc-800 text-xs font-semibold">
              <SelectValue placeholder="All Memberships" />
            </SelectTrigger>
            <SelectContent className="min-w-[180px]">
              <SelectItem value="All">All Memberships</SelectItem>
              <SelectItem value="Active">Active Passes</SelectItem>
              <SelectItem value="Expiring">Expiring Soon</SelectItem>
              <SelectItem value="Expired">Expired Passes</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* MEMBERSHIPS LIST */}
      {isLoading ? (
        <div className="p-12 text-center text-slate-400">
          <Loader2 className="w-8 h-8 animate-spin mx-auto mb-2 text-[#00df89]" />
          Loading memberships...
        </div>
      ) : displayedMembers.length === 0 ? (
        <div className="p-12 text-center space-y-3 rounded-2xl bg-white dark:bg-[#121215] border border-slate-200 dark:border-zinc-800">
          <Award className="w-10 h-10 text-slate-300 dark:text-zinc-600 mx-auto" />
          <h3 className="text-sm font-medium text-slate-800 dark:text-zinc-200">No Memberships in this tab</h3>
          <p className="text-xs text-slate-500 dark:text-zinc-400">No passes matching the selected filter.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {displayedMembers.map((m) => (
            <Card key={m._id} className="p-5 border-slate-200/90 dark:border-zinc-800/80 dark:bg-[#121215] space-y-4">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-11 h-11 rounded-2xl bg-emerald-500/10 text-[#00a86b] dark:text-[#00df89] flex items-center justify-center font-medium text-sm">
                    {m.fullName.slice(0, 2).toUpperCase()}
                  </div>
                  <div>
                    <h3 className="font-medium text-sm text-slate-900 dark:text-white">{m.fullName}</h3>
                    <p className="text-xs text-slate-500">{m.phone} • Locker: {m.lockerNumber || 'N/A'}</p>
                    <Badge variant={m.status === 'Active' ? 'default' : 'warning'} className="mt-1 text-[10px]">
                      {m.status}
                    </Badge>
                  </div>
                </div>

                <div className="text-right">
                  <span className="text-xs font-medium text-[#00a86b] dark:text-[#00df89] block">{m.membershipPackage}</span>
                  <span className="text-[11px] text-slate-400">Expires: {m.endDate}</span>
                </div>
              </div>

              <div className="flex items-center justify-between pt-3 border-t border-slate-100 dark:border-zinc-800 text-xs">
                <span className="text-slate-500">Plan: <strong className="text-slate-900 dark:text-white">{m.membershipPackage}</strong></span>
                
                <Button size="sm" onClick={() => handleRenew(m._id)} className="h-8 text-xs bg-[#00df89] text-[#011812] hover:bg-[#00c97b] font-medium gap-1">
                  <RefreshCw className="w-3.5 h-3.5" /> Renew Pass
                </Button>
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* RENEW PAYMENT MODAL */}
      <RecordPaymentModal
        isOpen={isRenewModalOpen}
        onClose={() => setIsRenewModalOpen(false)}
        onRecordPayment={fetchMembers}
        defaultMemberId={selectedMemberId}
      />

    </div>
  );
}
