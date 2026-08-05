/**
 * @file GymAttendance.jsx
 * @description Attendance management system with live gym floor status, desk check-in, check-out & visit logs.
 */
import { useState } from 'react';
import { useLanguage } from '@/context/LanguageContext';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  UserCheck, QrCode, Search, Calendar, Clock, CheckCircle2,
  LogOut, Dumbbell, ShieldAlert, Zap, Flame, UserX
} from 'lucide-react';

import { INITIAL_ATTENDANCE_LOGS, INITIAL_GYM_MEMBERS } from '@/data/gymData';

export default function GymAttendance() {
  const { lang } = useLanguage();

  const [logs, setLogs] = useState(INITIAL_ATTENDANCE_LOGS);
  const [members] = useState(INITIAL_GYM_MEMBERS);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeFilter, setActiveFilter] = useState('All');

  const currentlyInGym = logs.filter(l => l.status === 'In Workout');
  const todayCount = logs.filter(l => l.date === '2026-08-05').length;

  const handleCheckIn = (m) => {
    // Check if already in gym
    const alreadyIn = logs.find(l => l.memberId === m.id && l.status === 'In Workout');
    if (alreadyIn) {
      alert(`${m.fullName} is already checked in!`);
      return;
    }

    const newLog = {
      id: `att-${Date.now()}`,
      memberId: m.id,
      memberName: m.fullName,
      timeIn: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      timeOut: 'In Gym',
      date: new Date().toISOString().split('T')[0],
      status: 'In Workout',
      trainer: m.preferredTrainer
    };
    setLogs([newLog, ...logs]);
    setSearchQuery('');
  };

  const handleCheckOut = (logId) => {
    setLogs(logs.map(l => {
      if (l.id === logId) {
        return {
          ...l,
          timeOut: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          status: 'Checked Out'
        };
      }
      return l;
    }));
  };

  const filteredLogs = logs.filter(l => {
    const matchesSearch =
      l.memberName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      l.memberId.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesFilter =
      activeFilter === 'All' ||
      (activeFilter === 'In Gym' && l.status === 'In Workout') ||
      (activeFilter === 'Checked Out' && l.status === 'Checked Out');
    return matchesSearch && matchesFilter;
  });

  const memberSuggestions = searchQuery.trim().length > 0
    ? members.filter(m => m.fullName.toLowerCase().includes(searchQuery.toLowerCase()) || m.id.toLowerCase().includes(searchQuery.toLowerCase()) || m.phone.includes(searchQuery))
    : [];

  return (
    <div className="space-y-6 font-sans">
      
      {/* HEADER */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-extrabold text-slate-900 dark:text-white flex items-center gap-2">
            <UserCheck className="w-6 h-6 text-[#00df89]" />
            <span>Attendance & Check-In Desk</span>
          </h1>
          <p className="text-xs text-slate-500 font-normal">
            Monitor real-time gym floor attendance, active workouts & visit logs.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Badge className="bg-emerald-500/10 text-emerald-600 dark:text-[#00df89] border border-emerald-500/20 text-xs px-3 py-1 flex items-center gap-1.5 font-medium">
            <span className="w-2 h-2 rounded-full bg-[#00df89] animate-pulse" />
            <span>{currentlyInGym.length} Athletes Training Now</span>
          </Badge>
        </div>
      </div>

      {/* METRICS ROW */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        <Card className="p-4 border border-slate-200/90 dark:border-zinc-800/80 dark:bg-[#121215]">
          <span className="text-[11px] text-slate-400 font-normal">Currently In Gym</span>
          <div className="text-2xl font-medium text-emerald-600 dark:text-[#00df89] mt-1 flex items-center gap-2">
            <span>{currentlyInGym.length}</span>
            <span className="text-xs font-normal text-slate-400">on floor</span>
          </div>
        </Card>

        <Card className="p-4 border border-slate-200/90 dark:border-zinc-800/80 dark:bg-[#121215]">
          <span className="text-[11px] text-slate-400 font-normal">Today's Total Check-Ins</span>
          <div className="text-2xl font-medium text-slate-900 dark:text-white mt-1">{todayCount}</div>
        </Card>

        <Card className="p-4 border border-slate-200/90 dark:border-zinc-800/80 dark:bg-[#121215]">
          <span className="text-[11px] text-slate-400 font-normal">Peak Workout Hours</span>
          <div className="text-sm font-medium text-amber-500 mt-2">05:00 PM - 08:30 PM</div>
        </Card>

        <Card className="p-4 border border-slate-200/90 dark:border-zinc-800/80 dark:bg-[#121215]">
          <span className="text-[11px] text-slate-400 font-normal">Avg Session Duration</span>
          <div className="text-2xl font-medium text-blue-500 mt-1">68 mins</div>
        </Card>
      </div>

      {/* INSTANT DESK CHECK-IN CARD WITH AUTO-SUGGEST */}
      <Card className="p-6 border border-slate-200/90 dark:border-zinc-800/80 dark:bg-[#121215] space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-base font-medium text-slate-900 dark:text-white flex items-center gap-2">
            <QrCode className="w-5 h-5 text-emerald-600 dark:text-[#00df89]" />
            <span>Desk Fast Check-in Search</span>
          </h2>
          <span className="text-xs text-slate-400 font-normal">Type Member ID, Name or Phone</span>
        </div>

        <div className="relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search member e.g. Mahmudur Rahman or GM-1001..."
            className="w-full pl-10 pr-4 py-3 rounded-2xl bg-slate-50 dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 text-sm focus:outline-none focus:ring-2 focus:ring-[#00df89] font-normal"
          />

          {/* Auto-suggest dropdown */}
          {memberSuggestions.length > 0 && (
            <div className="absolute top-full left-0 right-0 mt-2 z-20 bg-white dark:bg-[#121215] border border-slate-200 dark:border-zinc-800 rounded-2xl shadow-xl p-2 space-y-1">
              {memberSuggestions.map((m) => (
                <div
                  key={m.id}
                  onClick={() => handleCheckIn(m)}
                  className="p-3 rounded-xl hover:bg-slate-50 dark:hover:bg-zinc-900 flex items-center justify-between cursor-pointer transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <img src={m.photo} alt={m.fullName} className="w-8 h-8 rounded-full object-cover border" />
                    <div>
                      <div className="font-medium text-xs text-slate-900 dark:text-white">{m.fullName}</div>
                      <div className="text-[10px] text-slate-400 font-normal">ID: {m.id} • {m.membershipPackage}</div>
                    </div>
                  </div>

                  <Button size="sm" className="bg-[#00df89] text-[#011812] hover:bg-[#00c97b] font-medium text-xs h-8 gap-1">
                    <Zap className="w-3.5 h-3.5" /> Check In
                  </Button>
                </div>
              ))}
            </div>
          )}
        </div>
      </Card>

      {/* CURRENTLY TRAINING IN GYM NOW (FLOOR VIEW CARDS) */}
      {currentlyInGym.length > 0 && (
        <div className="space-y-3">
          <h2 className="text-base font-medium text-slate-900 dark:text-white flex items-center gap-2">
            <Flame className="w-5 h-5 text-emerald-600 dark:text-[#00df89]" />
            <span>Currently Training on Gym Floor ({currentlyInGym.length})</span>
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {currentlyInGym.map((l) => (
              <Card key={l.id} className="p-4 border border-slate-200/90 dark:border-zinc-800/80 dark:bg-[#121215] flex items-center justify-between gap-3">
                <div className="flex items-center gap-3 min-w-0 flex-1">
                  <div className="w-10 h-10 rounded-2xl bg-emerald-500/10 text-emerald-600 dark:text-[#00df89] flex items-center justify-center font-medium text-xs shrink-0">
                    {l.memberName.charAt(0)}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="font-medium text-sm text-slate-900 dark:text-white truncate">{l.memberName}</div>
                    <div className="text-[11px] text-slate-400 font-normal truncate">In at {l.timeIn} • Trainer: {l.trainer}</div>
                  </div>
                </div>

                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleCheckOut(l.id)}
                  className="h-8 text-xs font-medium text-rose-500 border-rose-500/20 dark:bg-zinc-900 gap-1 shrink-0 whitespace-nowrap"
                >
                  <LogOut className="w-3.5 h-3.5" /> Check Out
                </Button>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* ATTENDANCE RECORDS TABLE */}
      <Card className="p-0 border border-slate-200/90 dark:border-zinc-800/80 dark:bg-[#121215] overflow-hidden">
        <div className="p-4 border-b border-slate-100 dark:border-zinc-800 flex items-center justify-between flex-wrap gap-2">
          <span className="font-medium text-sm text-slate-900 dark:text-white">Attendance Log History</span>
          
          <div className="flex items-center gap-1">
            {['All', 'In Gym', 'Checked Out'].map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveFilter(tab)}
                className={`px-3 py-1 text-xs font-medium rounded-full transition-colors ${
                  activeFilter === tab
                    ? 'bg-[#00df89] text-[#011812]'
                    : 'bg-slate-100 dark:bg-zinc-800 text-slate-500 dark:text-zinc-400'
                }`}
              >
                {tab}
              </button>
            ))}
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left">
            <thead className="bg-slate-100 dark:bg-zinc-900/80 text-slate-500 font-normal uppercase text-[10px]">
              <tr>
                <th className="p-3.5 font-medium">Athlete Member</th>
                <th className="p-3.5 font-medium">Date</th>
                <th className="p-3.5 font-medium">Time In</th>
                <th className="p-3.5 font-medium">Time Out</th>
                <th className="p-3.5 font-medium">Trainer Assigned</th>
                <th className="p-3.5 font-medium">Status</th>
                <th className="p-3.5 text-right font-medium">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-zinc-800 text-slate-800 dark:text-zinc-200 font-normal">
              {filteredLogs.map((l) => (
                <tr key={l.id} className="hover:bg-slate-50 dark:hover:bg-zinc-900/40 transition-colors">
                  <td className="p-3.5">
                    <div className="font-medium text-slate-900 dark:text-white">{l.memberName}</div>
                    <div className="text-[10px] text-slate-400 font-mono">ID: {l.memberId}</div>
                  </td>

                  <td className="p-3.5 font-mono">{l.date}</td>
                  <td className="p-3.5 font-mono text-emerald-600 dark:text-[#00df89]">{l.timeIn}</td>
                  <td className="p-3.5 font-mono text-slate-500">{l.timeOut}</td>
                  <td className="p-3.5 text-slate-600 dark:text-zinc-300 font-normal">{l.trainer}</td>

                  <td className="p-3.5">
                    <Badge variant={l.status === 'In Workout' ? 'default' : 'secondary'} className="text-[10px] font-normal">
                      {l.status}
                    </Badge>
                  </td>

                  <td className="p-3.5 text-right">
                    {l.status === 'In Workout' && (
                      <Button variant="outline" size="sm" onClick={() => handleCheckOut(l.id)} className="h-8 text-xs text-rose-500 border-rose-500/20 gap-1 dark:bg-zinc-900 font-medium shrink-0 whitespace-nowrap">
                        <LogOut className="w-3.5 h-3.5" /> Check Out
                      </Button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

    </div>
  );
}
