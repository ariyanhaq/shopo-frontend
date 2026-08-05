/**
 * @file GymTrainers.jsx
 * @description Personal trainers directory, shift schedules, payroll & athlete assignments.
 */
import { useState } from 'react';
import { useLanguage } from '@/context/LanguageContext';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Dumbbell, Plus, Phone, Mail, Clock, Users, Edit3, Trash2,
  Search, ShieldCheck, Zap, Award
} from 'lucide-react';

import AddTrainerModal from '@/components/gym/AddTrainerModal';
import { INITIAL_GYM_TRAINERS } from '@/data/gymData';

export default function GymTrainers() {
  const { lang } = useLanguage();

  const [trainers, setTrainers] = useState(INITIAL_GYM_TRAINERS);
  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingTrainer, setEditingTrainer] = useState(null);

  const filteredTrainers = trainers.filter((tr) => {
    return (
      tr.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      tr.specialization.toLowerCase().includes(searchTerm.toLowerCase()) ||
      tr.phone.includes(searchTerm)
    );
  });

  const totalAssignedAthletes = trainers.reduce((acc, t) => acc + t.assignedMembersCount, 0);
  const totalPayroll = trainers.reduce((acc, t) => acc + t.salary, 0);

  const handleSaveTrainer = (trainerToSave) => {
    const exists = trainers.find(t => t.id === trainerToSave.id);
    if (exists) {
      setTrainers(trainers.map(t => t.id === trainerToSave.id ? trainerToSave : t));
    } else {
      setTrainers([...trainers, trainerToSave]);
    }
  };

  const handleDelete = (id) => {
    if (confirm('Are you sure you want to delete this trainer profile?')) {
      setTrainers(trainers.filter(t => t.id !== id));
    }
  };

  return (
    <div className="space-y-6 font-sans font-normal text-slate-800 dark:text-zinc-200">
      
      {/* HEADER */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-extrabold text-slate-900 dark:text-white flex items-center gap-2">
            <Dumbbell className="w-6 h-6 text-[#00df89]" />
            <span>Personal Fitness Trainers</span>
          </h1>
          <p className="text-xs text-slate-500 font-normal">
            Manage fitness instructors, specializations, shift schedules & member assignments.
          </p>
        </div>

        <Button
          onClick={() => {
            setEditingTrainer(null);
            setIsModalOpen(true);
          }}
          className="bg-[#00df89] text-[#011812] hover:bg-[#00c97b] font-medium text-xs sm:text-sm h-11 px-4 gap-2 shadow-md shadow-emerald-500/20"
        >
          <Plus className="w-4 h-4" /> Add New Trainer
        </Button>
      </div>

      {/* TOP KPI CARDS */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card className="p-4 border border-slate-200/90 dark:border-zinc-800/80 dark:bg-[#121215]">
          <span className="text-xs font-normal text-slate-500 dark:text-zinc-400">Total Fitness Instructors</span>
          <div className="mt-1 text-2xl font-normal text-slate-900 dark:text-white">{trainers.length} Instructors</div>
        </Card>

        <Card className="p-4 border border-slate-200/90 dark:border-zinc-800/80 dark:bg-[#121215]">
          <span className="text-xs font-normal text-slate-500 dark:text-zinc-400">Total Assigned Athletes</span>
          <div className="mt-1 text-2xl font-normal text-emerald-600 dark:text-[#00df89]">{totalAssignedAthletes} Athletes</div>
        </Card>

        <Card className="p-4 border border-slate-200/90 dark:border-zinc-800/80 dark:bg-[#121215]">
          <span className="text-xs font-normal text-slate-500 dark:text-zinc-400">Monthly Trainer Payroll</span>
          <div className="mt-1 text-2xl font-normal text-blue-500">৳ {totalPayroll.toLocaleString()}</div>
        </Card>
      </div>

      {/* SEARCH BAR */}
      <Card className="p-4 border border-slate-200/90 dark:border-zinc-800/80 dark:bg-[#121215]">
        <div className="relative w-full max-w-md">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search instructor by name or specialization..."
            className="w-full pl-10 pr-4 py-2 rounded-xl bg-slate-50 dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 text-xs focus:outline-none focus:ring-2 focus:ring-[#00df89] font-normal"
          />
        </div>
      </Card>

      {/* TRAINERS GRID */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {filteredTrainers.map((tr) => (
          <Card
            key={tr.id}
            className="p-6 border border-slate-200/90 dark:border-zinc-800/80 dark:bg-[#121215] space-y-4 flex flex-col justify-between hover:border-[#00df89]/60 transition-all group"
          >
            <div className="space-y-4 flex flex-col items-center text-center">
              <div className="relative">
                <img src={tr.photo} alt={tr.name} className="w-20 h-20 rounded-full object-cover border-4 border-[#00df89] shadow-md" />
                <span className="w-3.5 h-3.5 rounded-full bg-[#00df89] absolute bottom-1 right-1 border-2 border-white dark:border-[#121215]" />
              </div>

              <div>
                <h3 className="font-medium text-base text-slate-900 dark:text-white group-hover:text-[#00df89] transition-colors">{tr.name}</h3>
                <Badge variant="outline" className="mt-1 bg-emerald-500/10 text-emerald-600 dark:text-[#00df89] border-emerald-500/20 text-[10px] font-normal">
                  {tr.specialization}
                </Badge>
              </div>

              {/* Quick Contact Buttons */}
              <div className="flex items-center gap-2 pt-1 text-xs">
                <a href={`tel:${tr.phone}`} className="p-2 rounded-xl bg-slate-100 dark:bg-zinc-900 text-slate-600 dark:text-zinc-300 hover:text-[#00df89] transition-colors">
                  <Phone className="w-4 h-4" />
                </a>
                <a href={`mailto:${tr.email}`} className="p-2 rounded-xl bg-slate-100 dark:bg-zinc-900 text-slate-600 dark:text-zinc-300 hover:text-[#00df89] transition-colors">
                  <Mail className="w-4 h-4" />
                </a>
              </div>

              {/* Metrics Box */}
              <div className="w-full grid grid-cols-2 gap-2 text-xs pt-3 border-t border-slate-100 dark:border-zinc-800/80 text-left">
                <div className="p-2 rounded-xl bg-slate-50 dark:bg-zinc-900/60 border border-slate-100 dark:border-zinc-800/80">
                  <span className="text-[10px] text-slate-400 block font-normal">Shift Hours:</span>
                  <span className="font-medium text-slate-800 dark:text-zinc-200">{tr.workingHours}</span>
                </div>

                <div className="p-2 rounded-xl bg-slate-50 dark:bg-zinc-900/60 border border-slate-100 dark:border-zinc-800/80">
                  <span className="text-[10px] text-slate-400 block font-normal">Assigned Members:</span>
                  <span className="font-medium text-emerald-600 dark:text-[#00df89]">{tr.assignedMembersCount} Athletes</span>
                </div>

                <div className="p-2 rounded-xl bg-slate-50 dark:bg-zinc-900/60 border border-slate-100 dark:border-zinc-800/80 col-span-2 flex items-center justify-between">
                  <span className="text-[10px] text-slate-400 font-normal">Monthly Salary:</span>
                  <span className="font-medium text-slate-900 dark:text-white">৳ {tr.salary.toLocaleString()}</span>
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="pt-3 border-t border-slate-100 dark:border-zinc-800/80 flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setEditingTrainer(tr);
                  setIsModalOpen(true);
                }}
                className="flex-1 text-xs font-medium dark:bg-[#09090b]"
              >
                <Edit3 className="w-3.5 h-3.5 mr-1" /> Edit Profile
              </Button>

              <Button
                variant="outline"
                size="sm"
                onClick={() => handleDelete(tr.id)}
                className="text-xs font-medium text-rose-500 hover:text-rose-600 dark:bg-[#09090b]"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </Button>
            </div>
          </Card>
        ))}
      </div>

      {/* MODAL */}
      <AddTrainerModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSaveTrainer={handleSaveTrainer}
        initialData={editingTrainer}
      />

    </div>
  );
}
