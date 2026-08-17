/**
 * @file GymMembers.jsx
 * @description Gym member directory with dual View Modes (Grid Cards & Table View), filter tabs, and fast actions backed directly by MongoDB.
 */
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useLanguage } from '@/context/LanguageContext';
import api from '@/services/api';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Select,
  SelectTrigger,
  SelectContent,
  SelectItem,
  SelectValue
} from '@/components/ui/select';
import {
  Users, Search, Filter, Plus, QrCode, Phone, Mail, ChevronRight,
  LayoutGrid, List, Dumbbell, ShieldCheck, HeartPulse, UserCheck,
  Clock, AlertTriangle, Sparkles, Activity, Loader2
} from 'lucide-react';

import AddMemberModal from '@/components/gym/AddMemberModal';

function getInitials(name) {
  if (!name) return 'GM';
  const parts = name.trim().split(' ');
  if (parts.length >= 2) {
    return (parts[0][0] + parts[1][0]).toUpperCase();
  }
  return name.slice(0, 2).toUpperCase();
}

export default function GymMembers() {
  const navigate = useNavigate();
  const { lang } = useLanguage();

  const [members, setMembers] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [genderFilter, setGenderFilter] = useState('All');
  const [goalFilter, setGoalFilter] = useState('All');
  const [viewMode, setViewMode] = useState('grid');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);

  const fetchMembers = async () => {
    try {
      const res = await api.gym.members.list();
      if (res.data) {
        setMembers(res.data);
      }
    } catch (err) {
      console.warn('Failed to load gym members from DB:', err.message);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchMembers();
  }, []);

  const filteredMembers = members.filter((m) => {
    const matchesSearch =
      m.fullName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      m.phone.includes(searchTerm) ||
      (m.lockerNumber && m.lockerNumber.toLowerCase().includes(searchTerm.toLowerCase()));
    const matchesStatus = statusFilter === 'All' || m.status === statusFilter;
    const matchesGender = genderFilter === 'All' || m.gender === genderFilter;
    const matchesGoal = goalFilter === 'All' || (m.fitnessGoal && m.fitnessGoal.includes(goalFilter));
    return matchesSearch && matchesStatus && matchesGender && matchesGoal;
  });

  const activeCount = members.filter(m => m.status === 'Active').length;
  const expiringCount = members.filter(m => m.status === 'Expiring Soon').length;
  const expiredCount = members.filter(m => m.status === 'Expired').length;

  const handleAddMemberSuccess = (newM) => {
    setMembers(prev => [newM, ...prev]);
    fetchMembers();
  };

  return (
    <div className="space-y-6 font-sans">
      
      {/* Top Header & Fast Action */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-medium text-slate-900 dark:text-white tracking-tight flex items-center gap-2.5">
            <Users className="w-6 h-6 text-[#00df89]" />
            <span>{lang === 'bn' ? 'সদস্য তালিকা ও বায়োমেট্রিক' : 'Athlete Directory & Members'}</span>
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-zinc-400 font-normal">
            {lang === 'bn' ? `মোট ${members.length} জন নিবন্ধিত সদস্যের ডেটাবেস` : `Database of ${members.length} registered gym athletes`}
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="default"
            onClick={() => setIsAddModalOpen(true)}
            className="bg-[#00df89] hover:bg-[#00c97b] text-[#011812] font-medium text-xs gap-1.5 shadow-xs"
          >
            <Plus className="w-4 h-4 stroke-[2]" />
            <span>{lang === 'bn' ? 'নতুন সদস্য যোগ করুন' : 'Add New Member'}</span>
          </Button>
        </div>
      </div>

      {/* KPI Status Strip */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div
          onClick={() => setStatusFilter('All')}
          className={`p-3.5 rounded-2xl border cursor-pointer transition-all ${
            statusFilter === 'All'
              ? 'bg-slate-900 text-white dark:bg-zinc-800 border-transparent shadow-xs'
              : 'bg-white dark:bg-[#121215] border-slate-200/90 dark:border-zinc-800/80 text-slate-700 dark:text-zinc-300'
          }`}
        >
          <div className="text-[11px] font-normal opacity-80">All Members</div>
          <div className="text-xl sm:text-2xl font-medium mt-1">
            {isLoading ? <Skeleton className="h-6 w-12 my-0.5" /> : members.length}
          </div>
        </div>

        <div
          onClick={() => setStatusFilter('Active')}
          className={`p-3.5 rounded-2xl border cursor-pointer transition-all ${
            statusFilter === 'Active'
              ? 'bg-emerald-500/15 border-emerald-500 text-[#00a86b] dark:text-[#00df89]'
              : 'bg-white dark:bg-[#121215] border-slate-200/90 dark:border-zinc-800/80 text-slate-700 dark:text-zinc-300'
          }`}
        >
          <div className="text-[11px] font-normal text-emerald-600 dark:text-[#00df89]">Active Passes</div>
          <div className="text-xl sm:text-2xl font-medium mt-1 text-emerald-600 dark:text-[#00df89]">
            {isLoading ? <Skeleton className="h-6 w-12 my-0.5" /> : activeCount}
          </div>
        </div>

        <div
          onClick={() => setStatusFilter('Expiring Soon')}
          className={`p-3.5 rounded-2xl border cursor-pointer transition-all ${
            statusFilter === 'Expiring Soon'
              ? 'bg-amber-500/15 border-amber-500 text-amber-600 dark:text-amber-400'
              : 'bg-white dark:bg-[#121215] border-slate-200/90 dark:border-zinc-800/80 text-slate-700 dark:text-zinc-300'
          }`}
        >
          <div className="text-[11px] font-normal text-amber-500">Expiring Soon</div>
          <div className="text-xl sm:text-2xl font-medium mt-1 text-amber-500">
            {isLoading ? <Skeleton className="h-6 w-12 my-0.5" /> : expiringCount}
          </div>
        </div>

        <div
          onClick={() => setStatusFilter('Expired')}
          className={`p-3.5 rounded-2xl border cursor-pointer transition-all ${
            statusFilter === 'Expired'
              ? 'bg-rose-500/15 border-rose-500 text-rose-600 dark:text-rose-400'
              : 'bg-white dark:bg-[#121215] border-slate-200/90 dark:border-zinc-800/80 text-slate-700 dark:text-zinc-300'
          }`}
        >
          <div className="text-[11px] font-normal text-rose-500">Expired Passes</div>
          <div className="text-xl sm:text-2xl font-medium mt-1 text-rose-500">
            {isLoading ? <Skeleton className="h-6 w-12 my-0.5" /> : expiredCount}
          </div>
        </div>
      </div>

      {/* Filter & Search Bar */}
      <Card className="p-4 border-slate-200/90 dark:border-zinc-800/80 dark:bg-[#121215] space-y-3">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
          
          <div className="w-full sm:w-80 relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder={lang === 'bn' ? 'সদস্যের নাম বা ফোন দিয়ে খুঁজুন...' : 'Search athlete by name or phone...'}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-4 py-2 rounded-xl bg-slate-50 dark:bg-[#09090b] border border-slate-200 dark:border-zinc-800 text-xs text-slate-900 dark:text-white placeholder:text-slate-400 outline-none focus:ring-2 focus:ring-[#00df89]"
            />
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
            <div className="w-36">
              <Select value={genderFilter} onValueChange={setGenderFilter}>
                <SelectTrigger size="sm" className="bg-slate-50 dark:bg-[#09090b]">
                  <SelectValue placeholder="All Genders" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="All">All Genders</SelectItem>
                  <SelectItem value="Male">Male</SelectItem>
                  <SelectItem value="Female">Female</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="w-40">
              <Select value={goalFilter} onValueChange={setGoalFilter}>
                <SelectTrigger size="sm" className="bg-slate-50 dark:bg-[#09090b]">
                  <SelectValue placeholder="All Goals" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="All">All Goals</SelectItem>
                  <SelectItem value="Muscle Gain">Muscle Gain</SelectItem>
                  <SelectItem value="Fat Loss">Fat Loss</SelectItem>
                  <SelectItem value="Fitness">General Fitness</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="border-l border-slate-200 dark:border-zinc-800 pl-2 flex items-center gap-1">
              <button
                onClick={() => setViewMode('grid')}
                className={`p-2 rounded-lg ${viewMode === 'grid' ? 'bg-slate-100 dark:bg-zinc-800 text-slate-900 dark:text-white' : 'text-slate-400'}`}
              >
                <LayoutGrid className="w-4 h-4" />
              </button>
              <button
                onClick={() => setViewMode('table')}
                className={`p-2 rounded-lg ${viewMode === 'table' ? 'bg-slate-100 dark:bg-zinc-800 text-slate-900 dark:text-white' : 'text-slate-400'}`}
              >
                <List className="w-4 h-4" />
              </button>
            </div>
          </div>

        </div>
      </Card>

      {/* Main Members Display */}
      {isLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <Skeleton key={i} className="h-44 w-full rounded-2xl" />
          ))}
        </div>
      ) : filteredMembers.length === 0 ? (
        <div className="p-12 text-center rounded-2xl bg-white dark:bg-[#121215] border border-slate-200/90 dark:border-zinc-800/80 space-y-3">
          <Users className="w-10 h-10 text-slate-300 dark:text-zinc-600 mx-auto" />
          <h3 className="text-sm font-medium text-slate-800 dark:text-zinc-200">No Members Found</h3>
          <p className="text-xs text-slate-500 dark:text-zinc-400">
            {searchTerm ? 'No members matched your search criteria.' : 'Start adding athletes to your gym database.'}
          </p>
          <Button size="sm" onClick={() => setIsAddModalOpen(true)} className="bg-[#00df89] hover:bg-[#00c97b] text-[#011812] text-xs font-medium">
            <Plus className="w-3.5 h-3.5 mr-1" />
            Add First Member
          </Button>
        </div>
      ) : viewMode === 'grid' ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredMembers.map((m) => (
            <Card
              key={m._id}
              onClick={() => navigate(`/gym/members/${m._id}`)}
              className="p-5 border-slate-200/90 dark:border-zinc-800/80 dark:bg-[#121215] hover:shadow-md transition-all cursor-pointer space-y-4"
            >
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-11 h-11 rounded-2xl bg-emerald-500/10 text-[#00a86b] dark:text-[#00df89] flex items-center justify-center font-medium text-sm border border-emerald-500/20">
                    {getInitials(m.fullName)}
                  </div>
                  <div>
                    <h3 className="text-sm font-medium text-slate-900 dark:text-white leading-tight">{m.fullName}</h3>
                    <p className="text-xs text-slate-500 dark:text-zinc-400">{m.phone}</p>
                  </div>
                </div>

                <Badge
                  variant={m.status === 'Active' ? 'default' : m.status === 'Expiring Soon' ? 'warning' : 'destructive'}
                  className="text-[10px] uppercase font-normal"
                >
                  {m.status}
                </Badge>
              </div>

              <div className="grid grid-cols-2 gap-2 pt-2 border-t border-slate-100 dark:border-zinc-800/80 text-xs">
                <div>
                  <span className="text-slate-400 dark:text-zinc-500 text-[11px] block">Package:</span>
                  <span className="font-medium text-slate-800 dark:text-zinc-200">{m.membershipPackage}</span>
                </div>
                <div>
                  <span className="text-slate-400 dark:text-zinc-500 text-[11px] block">Valid Until:</span>
                  <span className="font-medium text-slate-800 dark:text-zinc-200">{m.endDate}</span>
                </div>
                <div>
                  <span className="text-slate-400 dark:text-zinc-500 text-[11px] block">Goal:</span>
                  <span className="text-slate-700 dark:text-zinc-300 truncate block">{m.fitnessGoal}</span>
                </div>
                <div>
                  <span className="text-slate-400 dark:text-zinc-500 text-[11px] block">Due Amount:</span>
                  <span className={m.dueAmount > 0 ? 'text-amber-500 font-medium' : 'text-[#00a86b] dark:text-[#00df89] font-medium'}>
                    ৳ {(m.dueAmount || 0).toLocaleString()}
                  </span>
                </div>
              </div>

              <div className="pt-1 flex items-center justify-between text-xs text-slate-500 dark:text-zinc-400">
                <span>Trainer: {m.trainer || 'General'}</span>
                <span className="text-[#00a86b] dark:text-[#00df89] flex items-center gap-1 font-medium">
                  View Profile <ChevronRight className="w-3.5 h-3.5" />
                </span>
              </div>
            </Card>
          ))}
        </div>
      ) : (
        /* Table View */
        <Card className="p-0 border-slate-200/90 dark:border-zinc-800/80 dark:bg-[#121215] overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left">
              <thead className="bg-slate-50 dark:bg-zinc-900/60 text-slate-500 dark:text-zinc-400 border-b border-slate-200 dark:border-zinc-800">
                <tr>
                  <th className="p-3.5">Athlete</th>
                  <th className="p-3.5">Phone</th>
                  <th className="p-3.5">Package</th>
                  <th className="p-3.5">Status</th>
                  <th className="p-3.5">End Date</th>
                  <th className="p-3.5">Due</th>
                  <th className="p-3.5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-zinc-800/80">
                {filteredMembers.map((m) => (
                  <tr
                    key={m._id}
                    onClick={() => navigate(`/gym/members/${m._id}`)}
                    className="hover:bg-slate-50 dark:hover:bg-zinc-900/40 cursor-pointer"
                  >
                    <td className="p-3.5 font-medium text-slate-900 dark:text-white flex items-center gap-2">
                      <div className="w-7 h-7 rounded-lg bg-emerald-500/10 text-[#00a86b] dark:text-[#00df89] flex items-center justify-center font-medium text-xs">
                        {getInitials(m.fullName)}
                      </div>
                      <span>{m.fullName}</span>
                    </td>
                    <td className="p-3.5 text-slate-600 dark:text-zinc-400">{m.phone}</td>
                    <td className="p-3.5 text-slate-600 dark:text-zinc-300">{m.membershipPackage}</td>
                    <td className="p-3.5">
                      <Badge variant={m.status === 'Active' ? 'default' : 'warning'} className="text-[10px]">
                        {m.status}
                      </Badge>
                    </td>
                    <td className="p-3.5 text-slate-600 dark:text-zinc-300">{m.endDate}</td>
                    <td className="p-3.5 font-medium text-slate-800 dark:text-zinc-200">৳ {(m.dueAmount || 0).toLocaleString()}</td>
                    <td className="p-3.5 text-right">
                      <Button variant="ghost" size="sm" className="h-7 text-xs">
                        View
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      {/* Add Member Modal */}
      <AddMemberModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        onAddMember={handleAddMemberSuccess}
      />

    </div>
  );
}
