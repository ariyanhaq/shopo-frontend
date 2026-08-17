import { useState, useEffect } from 'react';
import { useLanguage } from '@/context/LanguageContext';
import api from '@/services/api';
import toast from 'react-hot-toast';
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
  UserCheck, QrCode, Search, Calendar, Clock, CheckCircle2,
  LogOut, Dumbbell, Zap, Flame, Filter, Loader2, Plus
} from 'lucide-react';

export default function GymAttendance() {
  const { lang } = useLanguage();

  const [logs, setLogs] = useState([]);
  const [members, setMembers] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedDate, setSelectedDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [searchQuery, setSearchQuery] = useState('');
  const [isCheckInModalOpen, setIsCheckInModalOpen] = useState(false);
  const [selectedMemberId, setSelectedMemberId] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const fetchAttendance = async () => {
    try {
      const [attRes, memRes] = await Promise.all([
        api.gym.attendance.list({ date: selectedDate }),
        api.gym.members.list(),
      ]);
      if (attRes.data) setLogs(attRes.data);
      if (memRes.data) {
        setMembers(memRes.data);
        if (memRes.data.length > 0 && !selectedMemberId) {
          setSelectedMemberId(memRes.data[0]._id);
        }
      }
    } catch (err) {
      console.warn('Failed to load attendance logs:', err.message);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchAttendance();
  }, [selectedDate]);

  const handleCheckIn = async (e) => {
    e?.preventDefault();
    if (!selectedMemberId) return;

    setIsSubmitting(true);
    try {
      await api.gym.attendance.checkIn({
        member_id: selectedMemberId,
        method: 'Manual',
      });
      toast.success(lang === 'bn' ? 'সদস্যের চেক-ইন সম্পন্ন হয়েছে!' : 'Athlete checked in successfully!');
      setIsCheckInModalOpen(false);
      fetchAttendance();
    } catch (err) {
      toast.error(err.message || 'Failed to check in athlete.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCheckOut = async (logId) => {
    try {
      await api.gym.attendance.checkOut(logId);
      toast.success(lang === 'bn' ? 'চেক-আউট সম্পন্ন হয়েছে!' : 'Athlete checked out successfully!');
      fetchAttendance();
    } catch (err) {
      toast.error(err.message || 'Failed to checkout athlete.');
    }
  };

  const filteredLogs = logs.filter((l) =>
    l.memberName.toLowerCase().includes(searchQuery.toLowerCase()) ||
    l.method.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const presentCount = logs.filter(l => l.status === 'Present').length;
  const completedCount = logs.filter(l => l.status === 'Completed').length;

  return (
    <div className="space-y-6 font-sans">
      
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-medium text-slate-900 dark:text-white tracking-tight flex items-center gap-2.5">
            <UserCheck className="w-6 h-6 text-[#00df89]" />
            <span>{lang === 'bn' ? 'উপস্থিতি ও চেক-ইন ডেস্ক' : 'Gym Attendance & Check-In Desk'}</span>
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-zinc-400">
            {lang === 'bn' ? 'দৈনিক সদস্য চেক-ইন ও অ্যাথলেট উপস্থিতি ট্র্যাকিং' : 'Real-time athlete check-in logs and workout durations'}
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            onClick={() => setIsCheckInModalOpen(true)}
            className="bg-[#00df89] hover:bg-[#00c97b] text-[#011812] font-medium text-xs gap-1.5 shadow-xs"
          >
            <Plus className="w-4 h-4 stroke-[2]" />
            <span>{lang === 'bn' ? 'চেক-ইন করুন' : 'Quick Check-In'}</span>
          </Button>
        </div>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card className="p-4 border-slate-200/90 dark:border-zinc-800/80 dark:bg-[#121215]">
          <div className="text-xs text-slate-500 dark:text-zinc-400">Total Check-ins ({selectedDate})</div>
          <div className="text-2xl font-medium text-slate-900 dark:text-white mt-1">{logs.length}</div>
        </Card>
        <Card className="p-4 border-slate-200/90 dark:border-zinc-800/80 dark:bg-[#121215]">
          <div className="text-xs text-emerald-600 dark:text-[#00df89]">Currently in Gym (Active)</div>
          <div className="text-2xl font-medium text-emerald-600 dark:text-[#00df89] mt-1">{presentCount}</div>
        </Card>
        <Card className="p-4 border-slate-200/90 dark:border-zinc-800/80 dark:bg-[#121215]">
          <div className="text-xs text-slate-500 dark:text-zinc-400">Workouts Completed</div>
          <div className="text-2xl font-medium text-slate-900 dark:text-white mt-1">{completedCount}</div>
        </Card>
      </div>

      {/* Filter and Date selector */}
      <Card className="p-4 border-slate-200/90 dark:border-zinc-800/80 dark:bg-[#121215] flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="w-full sm:w-80 relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder={lang === 'bn' ? 'অ্যাথলেটের নাম দিয়ে খুঁজুন...' : 'Search by athlete name...'}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-2 rounded-xl bg-slate-50 dark:bg-[#09090b] border border-slate-200 dark:border-zinc-800 text-xs text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-[#00df89]"
          />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <Calendar className="w-4 h-4 text-slate-400" />
          <input
            type="date"
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
            className="px-3 py-2 rounded-xl bg-slate-50 dark:bg-[#09090b] border border-slate-200 dark:border-zinc-800 text-xs text-slate-700 dark:text-zinc-300 outline-none"
          />
        </div>
      </Card>

      {/* Attendance Table */}
      <Card className="p-0 border-slate-200/90 dark:border-zinc-800/80 dark:bg-[#121215] overflow-hidden">
        {isLoading ? (
          <div className="p-12 text-center text-slate-400">
            <Loader2 className="w-8 h-8 animate-spin mx-auto mb-2 text-[#00df89]" />
            Loading attendance records...
          </div>
        ) : filteredLogs.length === 0 ? (
          <div className="p-12 text-center space-y-3">
            <UserCheck className="w-10 h-10 text-slate-300 dark:text-zinc-600 mx-auto" />
            <h3 className="text-sm font-medium text-slate-800 dark:text-zinc-200">No Attendance Records for {selectedDate}</h3>
            <p className="text-xs text-slate-500 dark:text-zinc-400">Use 'Quick Check-In' above to log an athlete check-in.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left">
              <thead className="bg-slate-50 dark:bg-zinc-900/60 text-slate-500 border-b border-slate-200 dark:border-zinc-800">
                <tr>
                  <th className="p-3.5">Athlete Name</th>
                  <th className="p-3.5">Check-in Time</th>
                  <th className="p-3.5">Check-out Time</th>
                  <th className="p-3.5">Method</th>
                  <th className="p-3.5">Status</th>
                  <th className="p-3.5 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-zinc-800/80">
                {filteredLogs.map((log) => (
                  <tr key={log._id} className="hover:bg-slate-50 dark:hover:bg-zinc-900/40">
                    <td className="p-3.5 font-medium text-slate-900 dark:text-white flex items-center gap-2">
                      <div className="w-7 h-7 rounded-lg bg-emerald-500/10 text-[#00a86b] dark:text-[#00df89] flex items-center justify-center font-medium text-xs">
                        {log.memberName.slice(0, 2).toUpperCase()}
                      </div>
                      <span>{log.memberName}</span>
                    </td>
                    <td className="p-3.5 text-slate-600 dark:text-zinc-300">{log.checkInTime}</td>
                    <td className="p-3.5 text-slate-600 dark:text-zinc-300">{log.checkOutTime}</td>
                    <td className="p-3.5 text-slate-500">{log.method}</td>
                    <td className="p-3.5">
                      <Badge variant={log.status === 'Present' ? 'default' : 'secondary'} className="text-[10px]">
                        {log.status}
                      </Badge>
                    </td>
                    <td className="p-3.5 text-right">
                      {log.status === 'Present' && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleCheckOut(log._id)}
                          className="h-7 text-xs text-rose-500 hover:text-rose-600 gap-1"
                        >
                          <LogOut className="w-3 h-3" /> Check Out
                        </Button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      {/* Quick Check-In Modal */}
      {isCheckInModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs">
          <Card className="max-w-md w-full p-6 bg-white dark:bg-[#121215] border-slate-200 dark:border-zinc-800 space-y-4">
            <h2 className="text-base font-medium text-slate-900 dark:text-white">Quick Athlete Check-In</h2>
            <form onSubmit={handleCheckIn} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-slate-700 dark:text-zinc-300 mb-1">Select Athlete</label>
                <Select
                  value={selectedMemberId}
                  onValueChange={setSelectedMemberId}
                >
                  <SelectTrigger className="w-full bg-slate-50 dark:bg-[#09090b]">
                    <SelectValue placeholder="Select Athlete" />
                  </SelectTrigger>
                  <SelectContent>
                    {members.map((m) => (
                      <SelectItem key={m._id} value={m._id}>
                        {m.fullName} ({m.phone})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <Button type="button" variant="outline" size="sm" onClick={() => setIsCheckInModalOpen(false)} className="text-xs">
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={isSubmitting}
                  size="sm"
                  className="bg-[#00df89] hover:bg-[#00c97b] text-[#011812] text-xs font-medium"
                >
                  {isSubmitting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : 'Confirm Check-In'}
                </Button>
              </div>
            </form>
          </Card>
        </div>
      )}

    </div>
  );
}
