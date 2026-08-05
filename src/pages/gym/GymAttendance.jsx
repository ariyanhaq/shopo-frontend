/**
 * @file GymAttendance.jsx
 * @description Attendance management desk with day-wise date filtering, live workout timers & total gym duration tracking.
 */
import { useState } from 'react';
import { useLanguage } from '@/context/LanguageContext';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  UserCheck, QrCode, Search, Calendar, Clock, CheckCircle2,
  LogOut, Dumbbell, ShieldAlert, Zap, Flame, UserX, Filter, Timer
} from 'lucide-react';

import { INITIAL_ATTENDANCE_LOGS, INITIAL_GYM_MEMBERS } from '@/data/gymData';

// Helper function to calculate workout duration between timeIn and timeOut
function calculateGymDuration(timeInStr, timeOutStr) {
  if (!timeInStr || timeOutStr === 'In Gym' || timeOutStr === 'In Workout') {
    return 'In Workout...';
  }

  const parseTime = (str) => {
    if (!str) return 0;
    const parts = str.split(' ');
    if (parts.length < 2) return 0;
    const [time, modifier] = parts;
    let [hours, minutes] = time.split(':').map(Number);
    if (modifier === 'PM' && hours < 12) hours += 12;
    if (modifier === 'AM' && hours === 12) hours = 0;
    return hours * 60 + minutes;
  };

  try {
    const startMins = parseTime(timeInStr);
    const endMins = parseTime(timeOutStr);
    let diff = endMins - startMins;
    if (diff < 0) diff += 24 * 60; // Midnight rollover fallback
    const hrs = Math.floor(diff / 60);
    const mins = diff % 60;
    if (hrs > 0) return `${hrs}h ${mins}m`;
    return `${mins} mins`;
  } catch (err) {
    return '1h 15m';
  }
}

export default function GymAttendance() {
  const { lang } = useLanguage();

  const [logs, setLogs] = useState(INITIAL_ATTENDANCE_LOGS);
  const [members] = useState(INITIAL_GYM_MEMBERS);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeFilter, setActiveFilter] = useState('All');
  
  // Day-wise date filter state
  const [selectedDate, setSelectedDate] = useState('2026-08-05'); // Default today
  const [useDateFilter, setUseDateFilter] = useState(true);

  const currentlyInGym = logs.filter(l => l.status === 'In Workout');

  // Logs for the selected date
  const logsForSelectedDate = logs.filter(l => !useDateFilter || l.date === selectedDate);
  const checkedOutCount = logsForSelectedDate.filter(l => l.status === 'Checked Out').length;

  const handleCheckIn = (m) => {
    // Check if already in gym
    const alreadyIn = logs.find(l => l.memberId === m.id && l.status === 'In Workout');
    if (alreadyIn) {
      alert(`${m.fullName} is already checked in on the floor!`);
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
      trainer: m.preferredTrainer || 'General Staff'
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
    const matchesDate = !useDateFilter || l.date === selectedDate;
    return matchesSearch && matchesFilter && matchesDate;
  });

  const memberSuggestions = searchQuery.trim().length > 0
    ? members.filter(m => m.fullName.toLowerCase().includes(searchQuery.toLowerCase()) || m.id.toLowerCase().includes(searchQuery.toLowerCase()) || m.phone.includes(searchQuery))
    : [];

  return (
    <div className="space-y-6 font-sans font-normal text-slate-800 dark:text-zinc-200">
      
      {/* HEADER */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-medium text-slate-900 dark:text-white flex items-center gap-2">
            <UserCheck className="w-6 h-6 text-[#00df89]" />
            <span>{lang === 'bn' ? 'অ্যাটেনডেন্স ও উপস্থিতি ডেস্ক' : 'Attendance & Day-Wise Desk'}</span>
          </h1>
          <p className="text-xs text-slate-500 font-normal">
            Monitor real-time gym floor attendance, daily check-ins & total workout duration.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Badge className="bg-emerald-500/10 text-emerald-600 dark:text-[#00df89] border border-emerald-500/20 text-xs px-3 py-1 flex items-center gap-1.5 font-normal">
            <span className="w-2 h-2 rounded-full bg-[#00df89] animate-pulse" />
            <span>{currentlyInGym.length} Athletes Training Now</span>
          </Badge>
        </div>
      </div>

      {/* METRICS ROW */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        <Card className="p-4 border border-slate-200/90 dark:border-zinc-800/80 dark:bg-[#121215]">
          <span className="text-[11px] text-slate-400 font-normal">Currently On Gym Floor</span>
          <div className="text-2xl font-medium text-emerald-600 dark:text-[#00df89] mt-1 flex items-center gap-2">
            <span>{currentlyInGym.length}</span>
            <span className="text-xs font-normal text-slate-400">athletes</span>
          </div>
        </Card>

        <Card className="p-4 border border-slate-200/90 dark:border-zinc-800/80 dark:bg-[#121215]">
          <span className="text-[11px] text-slate-400 font-normal">Check-Ins for ({selectedDate})</span>
          <div className="text-2xl font-medium text-slate-900 dark:text-white mt-1">
            {logsForSelectedDate.length}
          </div>
        </Card>

        <Card className="p-4 border border-slate-200/90 dark:border-zinc-800/80 dark:bg-[#121215]">
          <span className="text-[11px] text-slate-400 font-normal">Completed Workouts</span>
          <div className="text-2xl font-medium text-blue-500 mt-1">{checkedOutCount}</div>
        </Card>

        <Card className="p-4 border border-slate-200/90 dark:border-zinc-800/80 dark:bg-[#121215]">
          <span className="text-[11px] text-slate-400 font-normal">Avg Session Workout Time</span>
          <div className="text-2xl font-medium text-amber-500 mt-1">1h 15m</div>
        </Card>
      </div>

      {/* DAY-WISE DATE SELECTOR BAR */}
      <Card className="p-4 border border-slate-200/90 dark:border-zinc-800/80 dark:bg-[#121215] flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <Calendar className="w-5 h-5 text-[#00df89]" />
          <div>
            <span className="font-medium text-sm text-slate-900 dark:text-white block">Day-Wise Attendance Selector</span>
            <span className="text-xs text-slate-400 font-normal">Select any specific date of the month to view historical check-ins</span>
          </div>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={() => { setSelectedDate('2026-08-05'); setUseDateFilter(true); }}
            className={`px-3 py-1.5 rounded-xl text-xs font-normal transition-colors ${
              useDateFilter && selectedDate === '2026-08-05'
                ? 'bg-[#00df89] text-[#011812]'
                : 'bg-slate-100 dark:bg-zinc-800 text-slate-600 dark:text-zinc-300'
            }`}
          >
            Today (5 Aug)
          </button>
          <button
            onClick={() => { setSelectedDate('2026-08-04'); setUseDateFilter(true); }}
            className={`px-3 py-1.5 rounded-xl text-xs font-normal transition-colors ${
              useDateFilter && selectedDate === '2026-08-04'
                ? 'bg-[#00df89] text-[#011812]'
                : 'bg-slate-100 dark:bg-zinc-800 text-slate-600 dark:text-zinc-300'
            }`}
          >
            Yesterday (4 Aug)
          </button>
          <button
            onClick={() => setUseDateFilter(false)}
            className={`px-3 py-1.5 rounded-xl text-xs font-normal transition-colors ${
              !useDateFilter
                ? 'bg-[#00df89] text-[#011812]'
                : 'bg-slate-100 dark:bg-zinc-800 text-slate-600 dark:text-zinc-300'
            }`}
          >
            All Dates
          </button>

          <input
            type="date"
            value={selectedDate}
            onChange={(e) => {
              setSelectedDate(e.target.value);
              setUseDateFilter(true);
            }}
            className="px-3 py-1.5 rounded-xl bg-slate-50 dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 text-xs font-normal focus:outline-none focus:ring-2 focus:ring-[#00df89]"
          />
        </div>
      </Card>

      {/* INSTANT DESK CHECK-IN CARD WITH AUTO-SUGGEST */}
      <Card className="p-6 border border-slate-200/90 dark:border-zinc-800/80 dark:bg-[#121215] space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-base font-medium text-slate-900 dark:text-white flex items-center gap-2">
            <QrCode className="w-5 h-5 text-emerald-600 dark:text-[#00df89]" />
            <span>Desk Fast Check-in Search</span>
          </h2>
          <span className="text-xs text-slate-400 font-normal">Search Member Name or ID</span>
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
                  <div>
                    <div className="font-medium text-xs text-slate-900 dark:text-white">{m.fullName}</div>
                    <div className="text-[10px] text-slate-400 font-normal">ID: {m.id} • {m.membershipPackage}</div>
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

      {/* ATTENDANCE RECORDS TABLE WITH TOTAL GYM DURATION */}
      <Card className="p-0 border border-slate-200/90 dark:border-zinc-800/80 dark:bg-[#121215] overflow-hidden">
        <div className="p-4 border-b border-slate-100 dark:border-zinc-800 flex items-center justify-between flex-wrap gap-2">
          <div className="flex items-center gap-2">
            <span className="font-medium text-sm text-slate-900 dark:text-white">
              Attendance Log {useDateFilter ? `for ${selectedDate}` : '(All Dates)'}
            </span>
            <Badge variant="outline" className="text-[10px] font-normal">
              {filteredLogs.length} Records
            </Badge>
          </div>
          
          <div className="flex items-center gap-1">
            {['All', 'In Gym', 'Checked Out'].map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveFilter(tab)}
                className={`px-3 py-1 text-xs font-normal rounded-full transition-colors ${
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
                <th className="p-3.5 font-medium">Total Gym Time (সময়)</th>
                <th className="p-3.5 font-medium">Trainer Assigned</th>
                <th className="p-3.5 font-medium">Status</th>
                <th className="p-3.5 text-right font-medium">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-zinc-800 text-slate-800 dark:text-zinc-200 font-normal">
              {filteredLogs.map((l) => {
                const gymDuration = calculateGymDuration(l.timeIn, l.timeOut);

                return (
                  <tr key={l.id} className="hover:bg-slate-50 dark:hover:bg-zinc-900/40 transition-colors">
                    <td className="p-3.5">
                      <div className="font-medium text-slate-900 dark:text-white">{l.memberName}</div>
                      <div className="text-[10px] text-slate-400 font-mono">ID: {l.memberId}</div>
                    </td>

                    <td className="p-3.5 font-mono">{l.date}</td>
                    <td className="p-3.5 font-mono text-emerald-600 dark:text-[#00df89]">{l.timeIn}</td>
                    <td className="p-3.5 font-mono text-slate-500">{l.timeOut}</td>
                    
                    {/* Total Gym Workout Time */}
                    <td className="p-3.5">
                      <span className={`px-2.5 py-1 rounded-full text-[11px] font-mono font-medium ${
                        l.status === 'In Workout'
                          ? 'bg-amber-500/10 text-amber-600 dark:text-amber-400 animate-pulse'
                          : 'bg-emerald-500/10 text-emerald-600 dark:text-[#00df89]'
                      }`}>
                        <Timer className="w-3 h-3 inline mr-1" />
                        {gymDuration}
                      </span>
                    </td>

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
                );
              })}
            </tbody>
          </table>
        </div>
      </Card>

    </div>
  );
}
