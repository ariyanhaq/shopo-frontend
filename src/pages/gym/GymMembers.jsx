/**
 * @file GymMembers.jsx
 * @description Gym member directory with dual View Modes (Grid Cards & Table View), filter tabs, and fast actions without member images.
 */
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useLanguage } from '@/context/LanguageContext';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Users, Search, Filter, Plus, QrCode, Phone, Mail, ChevronRight,
  LayoutGrid, List, Dumbbell, ShieldCheck, HeartPulse, UserCheck,
  Clock, AlertTriangle, Sparkles, Activity
} from 'lucide-react';

import AddMemberModal from '@/components/gym/AddMemberModal';
import { INITIAL_GYM_MEMBERS } from '@/data/gymData';

// Helper to derive initials from member name (e.g. "Mahmudur Rahman" -> "MR")
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

  const [members, setMembers] = useState(INITIAL_GYM_MEMBERS);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [genderFilter, setGenderFilter] = useState('All');
  const [goalFilter, setGoalFilter] = useState('All');
  const [viewMode, setViewMode] = useState('grid'); // 'grid' | 'table'

  const [isAddModalOpen, setIsAddModalOpen] = useState(false);

  const filteredMembers = members.filter((m) => {
    const matchesSearch =
      m.fullName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      m.phone.includes(searchTerm) ||
      m.id.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'All' || m.status === statusFilter;
    const matchesGender = genderFilter === 'All' || m.gender === genderFilter;
    const matchesGoal = goalFilter === 'All' || m.fitnessGoal.includes(goalFilter);
    return matchesSearch && matchesStatus && matchesGender && matchesGoal;
  });

  const activeCount = members.filter(m => m.status === 'Active').length;
  const expiringCount = members.filter(m => m.status === 'Expiring Soon').length;
  const expiredCount = members.filter(m => m.status === 'Expired').length;

  const handleAddMember = (newM) => {
    setMembers([newM, ...members]);
  };

  return (
    <div className="space-y-6 font-sans font-normal text-slate-800 dark:text-zinc-200">
      
      {/* HEADER SECTION */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-extrabold text-slate-900 dark:text-white flex items-center gap-2">
            <Users className="w-6 h-6 text-[#00df89]" />
            <span>Gym Members Directory</span>
          </h1>
          <p className="text-xs text-slate-500 font-normal">
            Manage athlete profiles, body measurements, medical notes & membership validity.
          </p>
        </div>

        <Button
          onClick={() => setIsAddModalOpen(true)}
          className="bg-[#00df89] text-[#011812] hover:bg-[#00c97b] font-medium text-xs sm:text-sm h-11 px-4 gap-2 shadow-md shadow-emerald-500/20 whitespace-nowrap shrink-0"
        >
          <Plus className="w-4 h-4" /> Add New Member
        </Button>
      </div>

      {/* QUICK STATS METRICS ROW */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <Card className="p-4 border border-slate-200/90 dark:border-zinc-800/80 dark:bg-[#121215]">
          <span className="text-[11px] font-normal text-slate-400 block">Total Members</span>
          <span className="text-xl font-normal text-slate-900 dark:text-white mt-1 block">{members.length}</span>
        </Card>

        <Card className="p-4 border border-slate-200/90 dark:border-zinc-800/80 dark:bg-[#121215]">
          <span className="text-[11px] font-normal text-slate-400 block">Active Passes</span>
          <span className="text-xl font-normal text-emerald-600 dark:text-[#00df89] mt-1 block">{activeCount}</span>
        </Card>

        <Card className="p-4 border border-slate-200/90 dark:border-zinc-800/80 dark:bg-[#121215]">
          <span className="text-[11px] font-normal text-slate-400 block">Expiring Soon</span>
          <span className="text-xl font-normal text-amber-500 mt-1 block">{expiringCount}</span>
        </Card>

        <Card className="p-4 border border-slate-200/90 dark:border-zinc-800/80 dark:bg-[#121215]">
          <span className="text-[11px] font-normal text-slate-400 block">Expired Passes</span>
          <span className="text-xl font-normal text-rose-500 mt-1 block">{expiredCount}</span>
        </Card>
      </div>

      {/* SEARCH, FILTER & VIEW MODE TOGGLE BAR */}
      <Card className="p-4 border border-slate-200/90 dark:border-zinc-800/80 dark:bg-[#121215] space-y-3">
        <div className="flex flex-col lg:flex-row items-center justify-between gap-3">
          
          {/* Search Input */}
          <div className="relative w-full lg:max-w-md">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search by name, phone or ID (e.g. GM-1001)..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 rounded-xl bg-slate-50 dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 text-xs focus:outline-none focus:ring-2 focus:ring-[#00df89] font-normal"
            />
          </div>

          {/* Filters & View Toggle */}
          <div className="flex items-center gap-2 w-full lg:w-auto flex-wrap justify-between lg:justify-end">
            
            {/* Status Selector */}
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-3 py-2 rounded-xl bg-slate-50 dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 text-xs focus:outline-none focus:ring-2 focus:ring-[#00df89] font-normal"
            >
              <option value="All">All Statuses</option>
              <option value="Active">Active</option>
              <option value="Expiring Soon">Expiring Soon</option>
              <option value="Expired">Expired</option>
              <option value="Frozen">Frozen</option>
            </select>

            {/* Gender Selector */}
            <select
              value={genderFilter}
              onChange={(e) => setGenderFilter(e.target.value)}
              className="px-3 py-2 rounded-xl bg-slate-50 dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 text-xs focus:outline-none focus:ring-2 focus:ring-[#00df89] font-normal"
            >
              <option value="All">All Genders</option>
              <option value="Male">Male</option>
              <option value="Female">Female</option>
            </select>

            {/* View Mode Toggle (Grid | Table) */}
            <div className="bg-slate-100 dark:bg-zinc-900 p-1 rounded-xl flex items-center gap-1 border border-slate-200/80 dark:border-zinc-800">
              <button
                onClick={() => setViewMode('grid')}
                className={`p-1.5 rounded-lg transition-all ${
                  viewMode === 'grid'
                    ? 'bg-white dark:bg-zinc-800 text-slate-900 dark:text-white shadow-xs'
                    : 'text-slate-400 hover:text-slate-700 dark:hover:text-white'
                }`}
                title="Grid Card View"
              >
                <LayoutGrid className="w-4 h-4" />
              </button>
              <button
                onClick={() => setViewMode('table')}
                className={`p-1.5 rounded-lg transition-all ${
                  viewMode === 'table'
                    ? 'bg-white dark:bg-zinc-800 text-slate-900 dark:text-white shadow-xs'
                    : 'text-slate-400 hover:text-slate-700 dark:hover:text-white'
                }`}
                title="Table View"
              >
                <List className="w-4 h-4" />
              </button>
            </div>

          </div>

        </div>
      </Card>

      {/* GRID CARD VIEW */}
      {viewMode === 'grid' && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredMembers.map((m) => {
            const initials = getInitials(m.fullName);

            return (
              <Card
                key={m.id}
                onClick={() => navigate(`/gym/members/${m.id}`)}
                className="p-5 border border-slate-200/90 dark:border-zinc-800/80 dark:bg-[#121215] hover:border-[#00df89]/60 transition-all duration-150 cursor-pointer space-y-4 relative group flex flex-col justify-between"
              >
                <div className="space-y-3">
                  
                  {/* Header row */}
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3 min-w-0 flex-1 pr-2">
                      {/* Initials Avatar Badge instead of image */}
                      <div className="relative shrink-0">
                        <div className="w-11 h-11 rounded-2xl bg-emerald-500/10 dark:bg-[#00df89]/10 text-emerald-600 dark:text-[#00df89] border border-emerald-500/20 font-medium text-sm flex items-center justify-center">
                          {initials}
                        </div>
                        <span className={`w-3 h-3 rounded-full absolute -bottom-0.5 -right-0.5 border-2 border-white dark:border-[#121215] ${
                          m.status === 'Active' ? 'bg-[#00df89]' : m.status === 'Expiring Soon' ? 'bg-amber-500' : 'bg-rose-500'
                        }`} />
                      </div>

                      <div className="min-w-0 flex-1">
                        <h3 className="font-medium text-sm text-slate-900 dark:text-white group-hover:text-[#00df89] transition-colors truncate">{m.fullName}</h3>
                        <p className="text-xs text-slate-500 font-normal truncate">{m.phone} • {m.id}</p>
                      </div>
                    </div>

                    <Badge variant={m.status === 'Active' ? 'default' : m.status === 'Expiring Soon' ? 'warning' : 'destructive'} className="text-[10px] font-normal shrink-0">
                      {m.status}
                    </Badge>
                  </div>

                  {/* Package & Goal pill */}
                  <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-zinc-900/60 border border-slate-100 dark:border-zinc-800/80 text-xs space-y-1">
                    <div className="flex items-center justify-between text-slate-700 dark:text-zinc-300">
                      <span className="font-medium">{m.membershipPackage}</span>
                      <span className="text-[10px] font-mono text-emerald-600 dark:text-[#00df89]">{m.remainingDays}d left</span>
                    </div>
                    <div className="text-[11px] text-slate-400 font-normal flex items-center justify-between">
                      <span>Goal: {m.fitnessGoal}</span>
                      <span>Trainer: {m.preferredTrainer}</span>
                    </div>
                  </div>

                  {/* Micro Stats Row */}
                  <div className="grid grid-cols-3 gap-2 text-center text-xs pt-1">
                    <div className="p-2 rounded-lg bg-slate-100/60 dark:bg-zinc-900">
                      <span className="text-[10px] text-slate-400 block">BMI</span>
                      <span className="font-medium text-emerald-600 dark:text-[#00df89]">{m.bmi}</span>
                    </div>
                    <div className="p-2 rounded-lg bg-slate-100/60 dark:bg-zinc-900">
                      <span className="text-[10px] text-slate-400 block">Weight</span>
                      <span className="font-medium text-slate-800 dark:text-zinc-200">{m.weight}</span>
                    </div>
                    <div className="p-2 rounded-lg bg-slate-100/60 dark:bg-zinc-900">
                      <span className="text-[10px] text-slate-400 block">Locker</span>
                      <span className="font-medium text-slate-800 dark:text-zinc-200">{m.lockerNumber}</span>
                    </div>
                  </div>

                </div>

                {/* Card Footer */}
                <div className="pt-3 border-t border-slate-100 dark:border-zinc-800/80 flex items-center justify-between text-xs">
                  <span className="text-[11px] text-slate-400 font-normal">Last visit: {m.lastVisit}</span>
                  <span className="text-xs font-medium text-[#00df89] flex items-center gap-1 group-hover:translate-x-1 transition-transform">
                    View Profile →
                  </span>
                </div>
              </Card>
            );
          })}
        </div>
      )}

      {/* TABLE VIEW */}
      {viewMode === 'table' && (
        <Card className="p-0 border border-slate-200/90 dark:border-zinc-800/80 dark:bg-[#121215] overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left">
              <thead className="bg-slate-100 dark:bg-zinc-900/80 text-slate-500 font-normal uppercase text-[10px]">
                <tr>
                  <th className="p-3.5 font-medium">Athlete Member</th>
                  <th className="p-3.5 font-medium">Package</th>
                  <th className="p-3.5 font-medium">Trainer</th>
                  <th className="p-3.5 font-medium">BMI / Weight</th>
                  <th className="p-3.5 font-medium">Expiry Date</th>
                  <th className="p-3.5 font-medium">Status</th>
                  <th className="p-3.5 text-right font-medium">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-zinc-800 text-slate-800 dark:text-zinc-200 font-normal">
                {filteredMembers.map((m) => {
                  const initials = getInitials(m.fullName);

                  return (
                    <tr
                      key={m.id}
                      className="hover:bg-slate-50 dark:hover:bg-zinc-900/40 cursor-pointer transition-colors"
                      onClick={() => navigate(`/gym/members/${m.id}`)}
                    >
                      <td className="p-3.5 flex items-center gap-3">
                        {/* Clean Initials avatar badge */}
                        <div className="w-9 h-9 rounded-xl bg-emerald-500/10 dark:bg-[#00df89]/10 text-emerald-600 dark:text-[#00df89] border border-emerald-500/20 font-medium text-xs flex items-center justify-center shrink-0">
                          {initials}
                        </div>
                        <div>
                          <div className="font-medium text-slate-900 dark:text-white flex items-center gap-2">
                            <span>{m.fullName}</span>
                            <span className="text-[10px] font-mono text-slate-400">({m.id})</span>
                          </div>
                          <div className="text-[11px] text-slate-400 font-normal">{m.phone} • {m.gender}</div>
                        </div>
                      </td>

                      <td className="p-3.5">
                        <span className="font-medium">{m.membershipPackage}</span>
                        <div className="text-[10px] text-slate-400 font-normal">{m.joiningDate}</div>
                      </td>

                      <td className="p-3.5 text-slate-600 dark:text-zinc-300 font-normal">
                        {m.preferredTrainer}
                      </td>

                      <td className="p-3.5">
                        <span className="font-medium text-emerald-600 dark:text-[#00df89]">{m.bmi} BMI</span>
                        <div className="text-[10px] text-slate-400 font-normal">{m.weight} • {m.height}</div>
                      </td>

                      <td className="p-3.5 font-mono">
                        <div>{m.endDate}</div>
                        <div className="text-[10px] text-slate-400 font-normal">{m.remainingDays} days left</div>
                      </td>

                      <td className="p-3.5">
                        <Badge variant={m.status === 'Active' ? 'default' : m.status === 'Expiring Soon' ? 'warning' : 'destructive'} className="text-[10px] font-normal">
                          {m.status}
                        </Badge>
                      </td>

                      <td className="p-3.5 text-right space-x-1" onClick={(e) => e.stopPropagation()}>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => navigate(`/gym/members/${m.id}`)}
                          className="h-8 text-xs font-medium dark:bg-zinc-900 shrink-0 whitespace-nowrap"
                        >
                          Profile
                        </Button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      {/* EMPTY STATE */}
      {filteredMembers.length === 0 && (
        <div className="text-center py-12 bg-white dark:bg-[#121215] rounded-3xl border border-slate-200 dark:border-zinc-800 p-8 space-y-3">
          <Users className="w-10 h-10 text-slate-400 mx-auto" />
          <h3 className="text-base font-medium text-slate-900 dark:text-white">No Gym Members Found</h3>
          <p className="text-xs text-slate-500 max-w-sm mx-auto">
            No athlete members match your search criteria. Try clearing search filters or add a new member.
          </p>
        </div>
      )}

      <AddMemberModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        onAddMember={handleAddMember}
      />

    </div>
  );
}
