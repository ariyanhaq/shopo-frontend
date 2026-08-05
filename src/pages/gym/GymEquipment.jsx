/**
 * @file GymEquipment.jsx
 * @description Gym equipment inventory, machinery maintenance schedules & status monitoring.
 */
import { useState } from 'react';
import { useLanguage } from '@/context/LanguageContext';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Wrench, Plus, AlertTriangle, CheckCircle2, ShieldCheck } from 'lucide-react';
import { INITIAL_EQUIPMENT } from '@/data/gymData';

export default function GymEquipment() {
  const { lang } = useLanguage();
  const [equipment] = useState(INITIAL_EQUIPMENT);

  return (
    <div className="space-y-6 font-sans">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-extrabold text-slate-900 dark:text-white flex items-center gap-2">
            <Wrench className="w-6 h-6 text-[#00df89]" />
            <span>Equipment & Machinery Maintenance</span>
          </h1>
          <p className="text-xs text-slate-500 font-normal">
            Track treadmill conditions, squat racks, dumbbells, cable machines & service reminders.
          </p>
        </div>

        <Button className="bg-[#00df89] text-[#011812] hover:bg-[#00c97b] font-bold text-xs sm:text-sm h-11 px-4 gap-2 shadow-md shadow-emerald-500/20">
          <Plus className="w-4 h-4" /> Add Equipment Item
        </Button>
      </div>

      {/* TABLE */}
      <Card className="p-0 border border-slate-200/90 dark:border-zinc-800/80 dark:bg-[#121215] overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left">
            <thead className="bg-slate-100 dark:bg-zinc-900/80 text-slate-500 font-semibold uppercase text-[10px]">
              <tr>
                <th className="p-3.5">Equipment Name</th>
                <th className="p-3.5">Category</th>
                <th className="p-3.5">Purchase Date</th>
                <th className="p-3.5">Next Maintenance</th>
                <th className="p-3.5">Warranty</th>
                <th className="p-3.5 text-right">Condition Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-zinc-800 text-slate-800 dark:text-zinc-200 font-medium">
              {equipment.map((eq) => (
                <tr key={eq.id} className="hover:bg-slate-50 dark:hover:bg-zinc-900/40">
                  <td className="p-3.5 font-bold text-slate-900 dark:text-white">{eq.name}</td>
                  <td className="p-3.5 text-slate-500">{eq.category}</td>
                  <td className="p-3.5 font-mono">{eq.purchaseDate}</td>
                  <td className="p-3.5 font-mono text-emerald-600 dark:text-[#00df89]">{eq.maintenanceDate}</td>
                  <td className="p-3.5 font-mono">{eq.warranty}</td>
                  <td className="p-3.5 text-right">
                    <Badge variant={eq.condition === 'Available' ? 'default' : 'warning'} className="text-[10px]">
                      {eq.condition}
                    </Badge>
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
