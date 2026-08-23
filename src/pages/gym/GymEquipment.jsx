/**
 * @file GymEquipment.jsx
 * @description Gym equipment inventory, machinery maintenance schedules & status monitoring backed by MongoDB.
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
import { Wrench, Plus, AlertTriangle, CheckCircle2, Loader2, X } from 'lucide-react';
import { useBodyScrollLock } from '@/hooks/useBodyScrollLock';

export default function GymEquipment() {
  const { lang } = useLanguage();
  const [equipment, setEquipment] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);

  useBodyScrollLock(isModalOpen);
  const [newEq, setNewEq] = useState({
    name: '',
    category: 'Cardio',
    quantity: 1,
    condition: 'Excellent',
    maintenanceStatus: 'Operational',
  });

  const fetchEquipment = async () => {
    try {
      const res = await api.gym.equipment.list();
      if (res.data) setEquipment(res.data);
    } catch (err) {
      console.warn('Failed to load gym equipment:', err.message);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchEquipment();
  }, []);

  const handleCreateEquipment = async (e) => {
    e.preventDefault();
    if (!newEq.name) return;
    try {
      await api.gym.equipment.create(newEq);
      setIsModalOpen(false);
      setNewEq({
        name: '',
        category: 'Cardio',
        quantity: 1,
        condition: 'Excellent',
        maintenanceStatus: 'Operational',
      });
      fetchEquipment();
    } catch (err) {
      alert(err.message || 'Failed to add equipment.');
    }
  };

  return (
    <div className="space-y-6 font-sans">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-medium text-slate-900 dark:text-white flex items-center gap-2.5">
            <Wrench className="w-6 h-6 text-[#00df89]" />
            <span>{lang === 'bn' ? 'যন্ত্রপাতি ও ইকুইপমেন্ট মেনটেইন্যান্স' : 'Equipment & Machinery Inventory'}</span>
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-zinc-400">
            {lang === 'bn' ? 'ট্রেডমিল, ডাম্বেল ও মেশিনের স্বাস্থ্য ও সার্ভিসিং তালিকা' : 'Track treadmill conditions, dumbbells, weight racks & maintenance logs'}
          </p>
        </div>

        <Button
          onClick={() => setIsModalOpen(true)}
          className="bg-[#00df89] hover:bg-[#00c97b] text-[#011812] font-medium text-xs gap-1.5 shadow-xs"
        >
          <Plus className="w-4 h-4 stroke-[2]" />
          <span>{lang === 'bn' ? 'ইকুইপমেন্ট যোগ করুন' : 'Add Equipment Item'}</span>
        </Button>
      </div>

      {/* TABLE */}
      <Card className="p-0 border-slate-200/90 dark:border-zinc-800/80 dark:bg-[#121215] overflow-hidden">
        {isLoading ? (
          <div className="p-12 text-center text-slate-400">
            <Loader2 className="w-8 h-8 animate-spin mx-auto mb-2 text-[#00df89]" />
            Loading equipment records...
          </div>
        ) : equipment.length === 0 ? (
          <div className="p-12 text-center space-y-3">
            <Wrench className="w-10 h-10 text-slate-300 dark:text-zinc-600 mx-auto" />
            <h3 className="text-sm font-medium text-slate-800 dark:text-zinc-200">No Equipment Listed Yet</h3>
            <p className="text-xs text-slate-500 dark:text-zinc-400">Record gym machinery and maintenance schedules.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left">
              <thead className="bg-slate-50 dark:bg-zinc-900/60 text-slate-500 border-b border-slate-200 dark:border-zinc-800">
                <tr>
                  <th className="p-3.5">Equipment Name</th>
                  <th className="p-3.5">Category</th>
                  <th className="p-3.5">Quantity</th>
                  <th className="p-3.5">Maintenance Status</th>
                  <th className="p-3.5 text-right">Condition Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-zinc-800/80">
                {equipment.map((eq) => (
                  <tr key={eq._id} className="hover:bg-slate-50 dark:hover:bg-zinc-900/40">
                    <td className="p-3.5 font-medium text-slate-900 dark:text-white">{eq.name}</td>
                    <td className="p-3.5 text-slate-500">{eq.category}</td>
                    <td className="p-3.5 text-slate-700 dark:text-zinc-300">{eq.quantity || 1} units</td>
                    <td className="p-3.5 font-medium text-[#00a86b] dark:text-[#00df89]">{eq.maintenanceStatus || 'Operational'}</td>
                    <td className="p-3.5 text-right">
                      <Badge variant="default" className="text-[10px]">
                        {eq.condition || 'Good'}
                      </Badge>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      {/* CREATE MODAL */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs">
          <Card className="max-w-md w-full p-6 bg-white dark:bg-[#121215] border-slate-200 dark:border-zinc-800 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-zinc-800 pb-3">
              <h2 className="text-base font-medium text-slate-900 dark:text-white">Add Equipment Item</h2>
              <button onClick={() => setIsModalOpen(false)} className="text-slate-400 p-1">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateEquipment} className="space-y-3.5 text-xs">
              <div>
                <label className="block font-medium mb-1">Equipment Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Commercial Treadmill Pro 500"
                  value={newEq.name}
                  onChange={(e) => setNewEq({ ...newEq, name: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-[#09090b] border border-slate-200 dark:border-zinc-800 outline-none focus:ring-2 focus:ring-[#00df89]"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-medium mb-1">Category</label>
                  <Select
                    value={newEq.category}
                    onValueChange={(val) => setNewEq({ ...newEq, category: val })}
                  >
                    <SelectTrigger className="w-full bg-slate-50 dark:bg-[#09090b]">
                      <SelectValue placeholder="Category" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Cardio">Cardio</SelectItem>
                      <SelectItem value="Strength">Strength / Weights</SelectItem>
                      <SelectItem value="Free Weights">Free Weights</SelectItem>
                      <SelectItem value="Cables">Cables & Pulleys</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <label className="block font-medium mb-1">Quantity</label>
                  <input
                    type="number"
                    value={newEq.quantity}
                    onChange={(e) => setNewEq({ ...newEq, quantity: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-[#09090b] border border-slate-200 dark:border-zinc-800 outline-none"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <Button type="button" variant="outline" size="sm" onClick={() => setIsModalOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit" size="sm" className="bg-[#00df89] hover:bg-[#00c97b] text-[#011812] font-medium">
                  Save Equipment
                </Button>
              </div>
            </form>
          </Card>
        </div>
      )}

    </div>
  );
}
