/**
 * @file GymClasses.jsx
 * @description Group fitness classes schedule (Yoga, HIIT, CrossFit, Zumba), trainer & capacity logs.
 */
import { useState } from 'react';
import { useLanguage } from '@/context/LanguageContext';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Flame, Plus, Clock, Users, Calendar, MapPin } from 'lucide-react';
import { INITIAL_CLASSES } from '@/data/gymData';

export default function GymClasses() {
  const { lang } = useLanguage();
  const [classes] = useState(INITIAL_CLASSES);

  return (
    <div className="space-y-6 font-sans">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-extrabold text-slate-900 dark:text-white flex items-center gap-2">
            <Flame className="w-6 h-6 text-amber-500" />
            <span>Group Fitness Classes</span>
          </h1>
          <p className="text-xs text-slate-500 font-normal">
            Organize Yoga, HIIT, CrossFit & Zumba sessions, max capacity & instructor assignments.
          </p>
        </div>

        <Button className="bg-[#00df89] text-[#011812] hover:bg-[#00c97b] font-bold text-xs sm:text-sm h-11 px-4 gap-2 shadow-md shadow-emerald-500/20">
          <Plus className="w-4 h-4" /> Schedule New Class
        </Button>
      </div>

      {/* CLASSES GRID */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {classes.map((cls) => (
          <Card key={cls.id} className="p-6 border border-slate-200/90 dark:border-zinc-800/80 dark:bg-[#121215] space-y-4">
            <div className="flex items-center justify-between">
              <Badge className="bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20 text-xs">
                {cls.category}
              </Badge>
              <span className="text-xs text-slate-400 font-mono flex items-center gap-1">
                <MapPin className="w-3 h-3 text-slate-400" /> {cls.room}
              </span>
            </div>

            <div>
              <h3 className="font-extrabold text-base text-slate-900 dark:text-white">{cls.name}</h3>
              <p className="text-xs text-slate-500 mt-1 flex items-center gap-1 font-medium">
                <Clock className="w-3.5 h-3.5 text-slate-400" /> {cls.time}
              </p>
            </div>

            <div className="pt-3 border-t border-slate-100 dark:border-zinc-800 space-y-2 text-xs">
              <div className="flex justify-between">
                <span className="text-slate-400">Instructor:</span>
                <span className="font-bold text-slate-800 dark:text-zinc-200">{cls.trainer}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Enrolled Members:</span>
                <span className="font-extrabold text-emerald-600 dark:text-[#00df89]">{cls.enrolled} / {cls.capacity}</span>
              </div>

              {/* Progress bar */}
              <div className="w-full bg-slate-100 dark:bg-zinc-800 h-2 rounded-full overflow-hidden">
                <div style={{ width: `${(cls.enrolled / cls.capacity) * 100}%` }} className="bg-amber-500 h-full rounded-full" />
              </div>
            </div>

            <Button variant="outline" size="sm" className="w-full text-xs font-bold dark:bg-zinc-900">
              Manage Class Attendance
            </Button>
          </Card>
        ))}
      </div>

    </div>
  );
}
