/**
 * @file GymWorkouts.jsx
 * @description Workout routines, exercise templates (sets/reps/rest time) & member assignment.
 */
import { useState } from 'react';
import { useLanguage } from '@/context/LanguageContext';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Activity, Plus, Dumbbell, Clock, Flame, CheckCircle2 } from 'lucide-react';
import { INITIAL_WORKOUT_TEMPLATES } from '@/data/gymData';

export default function GymWorkouts() {
  const { lang } = useLanguage();
  const [workouts] = useState(INITIAL_WORKOUT_TEMPLATES);

  return (
    <div className="space-y-6 font-sans">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-extrabold text-slate-900 dark:text-white flex items-center gap-2">
            <Activity className="w-6 h-6 text-[#00df89]" />
            <span>Workout Plans & Routines</span>
          </h1>
          <p className="text-xs text-slate-500 font-normal">
            Build exercise templates, sets, reps & assign customized workout cards to members.
          </p>
        </div>

        <Button className="bg-[#00df89] text-[#011812] hover:bg-[#00c97b] font-bold text-xs sm:text-sm h-11 px-4 gap-2 shadow-md shadow-emerald-500/20">
          <Plus className="w-4 h-4" /> Create Workout Template
        </Button>
      </div>

      {/* WORKOUT TEMPLATES LIST */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {workouts.map((wt) => (
          <Card key={wt.id} className="p-6 border border-slate-200/90 dark:border-zinc-800/80 dark:bg-[#121215] space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-extrabold text-base text-slate-900 dark:text-white">{wt.title}</h3>
                <p className="text-xs text-slate-500 font-medium">Goal: <span className="font-bold text-emerald-600 dark:text-[#00df89]">{wt.goal}</span></p>
              </div>
              <Badge className="bg-emerald-500/10 text-emerald-600 dark:text-[#00df89] text-xs">
                {wt.difficulty}
              </Badge>
            </div>

            <div className="border border-slate-100 dark:border-zinc-800 rounded-2xl overflow-hidden">
              <table className="w-full text-xs text-left">
                <thead className="bg-slate-100 dark:bg-zinc-900 text-slate-500 font-semibold uppercase text-[10px]">
                  <tr>
                    <th className="p-2.5">Exercise Name</th>
                    <th className="p-2.5">Sets</th>
                    <th className="p-2.5">Reps</th>
                    <th className="p-2.5">Rest</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-zinc-800 text-slate-800 dark:text-zinc-200 font-medium">
                  {wt.exercises.map((ex, idx) => (
                    <tr key={idx}>
                      <td className="p-2.5 font-bold">{ex.name}</td>
                      <td className="p-2.5 font-mono">{ex.sets}</td>
                      <td className="p-2.5 font-mono">{ex.reps}</td>
                      <td className="p-2.5 text-slate-400 font-mono">{ex.rest}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="pt-2 flex justify-end">
              <Button variant="outline" size="sm" className="text-xs font-bold dark:bg-zinc-900">
                Assign to Member →
              </Button>
            </div>
          </Card>
        ))}
      </div>

    </div>
  );
}
