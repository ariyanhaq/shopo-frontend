/**
 * @file GymClasses.jsx
 * @description Group fitness classes schedule (Yoga, HIIT, CrossFit, Zumba) backed by MongoDB.
 */
import { useState, useEffect } from 'react';
import { useLanguage } from '@/context/LanguageContext';
import api from '@/services/api';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Flame, Plus, Clock, Users, Calendar, MapPin, Loader2, X } from 'lucide-react';

export default function GymClasses() {
  const { lang } = useLanguage();
  const [classes, setClasses] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newClass, setNewClass] = useState({
    name: '',
    trainer: 'Lead Trainer',
    schedule: 'Mon, Wed, Fri',
    time: '07:00 AM - 08:00 AM',
    capacity: 20,
    room: 'Studio A',
  });

  const fetchClasses = async () => {
    try {
      const res = await api.gym.classes.list();
      if (res.data) setClasses(res.data);
    } catch (err) {
      console.warn('Failed to load gym classes:', err.message);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchClasses();
  }, []);

  const handleCreateClass = async (e) => {
    e.preventDefault();
    if (!newClass.name) return;
    try {
      await api.gym.classes.create(newClass);
      setIsModalOpen(false);
      setNewClass({
        name: '',
        trainer: 'Lead Trainer',
        schedule: 'Mon, Wed, Fri',
        time: '07:00 AM - 08:00 AM',
        capacity: 20,
        room: 'Studio A',
      });
      fetchClasses();
    } catch (err) {
      alert(err.message || 'Failed to create class.');
    }
  };

  return (
    <div className="space-y-6 font-sans">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-medium text-slate-900 dark:text-white flex items-center gap-2.5">
            <Flame className="w-6 h-6 text-amber-500" />
            <span>{lang === 'bn' ? 'গ্রুপ ফিটনেস ক্লাস' : 'Group Fitness Sessions & Classes'}</span>
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-zinc-400">
            {lang === 'bn' ? 'ইয়োগা, হাইট, ক্রসফিট ও জুম্বা সেশন শিডিউলিং' : 'Organize Yoga, HIIT, CrossFit & Zumba sessions, max capacity & instructors'}
          </p>
        </div>

        <Button
          onClick={() => setIsModalOpen(true)}
          className="bg-[#00df89] hover:bg-[#00c97b] text-[#011812] font-medium text-xs gap-1.5 shadow-xs"
        >
          <Plus className="w-4 h-4 stroke-[2]" />
          <span>{lang === 'bn' ? 'নতুন ক্লাস শিডিউল করুন' : 'Schedule New Class'}</span>
        </Button>
      </div>

      {/* CLASSES GRID */}
      {isLoading ? (
        <div className="p-12 text-center text-slate-400">
          <Loader2 className="w-8 h-8 animate-spin mx-auto mb-2 text-[#00df89]" />
          Loading classes...
        </div>
      ) : classes.length === 0 ? (
        <div className="p-12 text-center rounded-2xl bg-white dark:bg-[#121215] border border-slate-200 dark:border-zinc-800 space-y-3">
          <Flame className="w-10 h-10 text-slate-300 dark:text-zinc-600 mx-auto" />
          <h3 className="text-sm font-medium text-slate-800 dark:text-zinc-200">No Group Classes Scheduled</h3>
          <p className="text-xs text-slate-500 dark:text-zinc-400">Add workout sessions like Yoga or CrossFit to your calendar.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {classes.map((cls) => (
            <Card key={cls._id} className="p-6 border border-slate-200/90 dark:border-zinc-800/80 dark:bg-[#121215] space-y-4">
              <div className="flex items-center justify-between">
                <Badge className="bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20 text-xs">
                  {cls.schedule || 'Weekly'}
                </Badge>
                <span className="text-xs text-slate-400 flex items-center gap-1">
                  <MapPin className="w-3 h-3 text-slate-400" /> {cls.room}
                </span>
              </div>

              <div>
                <h3 className="font-medium text-base text-slate-900 dark:text-white">{cls.name}</h3>
                <p className="text-xs text-slate-500 mt-1 flex items-center gap-1 font-normal">
                  <Clock className="w-3.5 h-3.5 text-slate-400" /> {cls.time}
                </p>
              </div>

              <div className="pt-3 border-t border-slate-100 dark:border-zinc-800 space-y-2 text-xs">
                <div className="flex justify-between">
                  <span className="text-slate-400">Instructor:</span>
                  <span className="font-medium text-slate-800 dark:text-zinc-200">{cls.trainer}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Capacity:</span>
                  <span className="font-medium text-[#00a86b] dark:text-[#00df89]">{cls.capacity || 20} Athletes</span>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* CREATE MODAL */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs">
          <Card className="max-w-md w-full p-6 bg-white dark:bg-[#121215] border-slate-200 dark:border-zinc-800 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-zinc-800 pb-3">
              <h2 className="text-base font-medium text-slate-900 dark:text-white">Schedule Fitness Class</h2>
              <button onClick={() => setIsModalOpen(false)} className="text-slate-400 p-1">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateClass} className="space-y-3.5 text-xs">
              <div>
                <label className="block font-medium mb-1">Class Title *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Morning Power Yoga"
                  value={newClass.name}
                  onChange={(e) => setNewClass({ ...newClass, name: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-[#09090b] border border-slate-200 dark:border-zinc-800 outline-none focus:ring-2 focus:ring-[#00df89]"
                />
              </div>

              <div>
                <label className="block font-medium mb-1">Time & Days</label>
                <input
                  type="text"
                  value={newClass.time}
                  onChange={(e) => setNewClass({ ...newClass, time: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-[#09090b] border border-slate-200 dark:border-zinc-800 outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-medium mb-1">Max Capacity</label>
                  <input
                    type="number"
                    value={newClass.capacity}
                    onChange={(e) => setNewClass({ ...newClass, capacity: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-[#09090b] border border-slate-200 dark:border-zinc-800 outline-none"
                  />
                </div>
                <div>
                  <label className="block font-medium mb-1">Studio Room</label>
                  <input
                    type="text"
                    value={newClass.room}
                    onChange={(e) => setNewClass({ ...newClass, room: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-[#09090b] border border-slate-200 dark:border-zinc-800 outline-none"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <Button type="button" variant="outline" size="sm" onClick={() => setIsModalOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit" size="sm" className="bg-[#00df89] hover:bg-[#00c97b] text-[#011812] font-medium">
                  Save Class
                </Button>
              </div>
            </form>
          </Card>
        </div>
      )}

    </div>
  );
}
