import { useState, useEffect } from 'react';
import { useLanguage } from '@/context/LanguageContext';
import api from '@/services/api';
import toast from 'react-hot-toast';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Dumbbell, Plus, Phone, Mail, Clock, Users, Edit3, Trash2,
  Search, ShieldCheck, Zap, Award, Loader2
} from 'lucide-react';

import AddTrainerModal from '@/components/gym/AddTrainerModal';

export default function GymTrainers() {
  const { lang } = useLanguage();

  const [trainers, setTrainers] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingTrainer, setEditingTrainer] = useState(null);

  const fetchTrainers = async () => {
    try {
      const res = await api.gym.trainers.list();
      if (res.data) {
        setTrainers(res.data);
      }
    } catch (err) {
      console.warn('Failed to load gym trainers:', err.message);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchTrainers();
  }, []);

  const filteredTrainers = trainers.filter((tr) => {
    return (
      tr.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (tr.specialization && tr.specialization.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (tr.phone && tr.phone.includes(searchTerm))
    );
  });

  const totalAssignedAthletes = trainers.reduce((acc, t) => acc + (t.activeClients || 0), 0);
  const totalPayroll = trainers.reduce((acc, t) => acc + (t.monthlySalary || 0), 0);

  const handleSaveTrainer = async (trData) => {
    try {
      if (editingTrainer && editingTrainer._id) {
        await api.gym.trainers.update(editingTrainer._id, {
          name: trData.name,
          phone: trData.phone,
          email: trData.email,
          specialization: trData.specialization,
          monthlySalary: trData.salary,
          status: trData.status,
        });
        toast.success(lang === 'bn' ? 'ট্রেইনার প্রোফাইল আপডেট করা হয়েছে!' : 'Trainer profile updated successfully!');
      } else {
        await api.gym.trainers.create({
          name: trData.name,
          phone: trData.phone,
          email: trData.email,
          specialization: trData.specialization,
          monthlySalary: trData.salary,
          status: trData.status,
        });
        toast.success(lang === 'bn' ? 'নতুন ট্রেইনার সফলভাবে যোগ করা হয়েছে!' : 'Trainer registered successfully!');
      }
      fetchTrainers();
    } catch (err) {
      toast.error(err.message || 'Failed to save trainer in database.');
    }
  };

  const handleDelete = async (id) => {
    if (confirm(lang === 'bn' ? 'আপনি কি এই ট্রেইনার প্রোফাইলটি মুছে ফেলতে চান?' : 'Are you sure you want to deactivate this trainer profile?')) {
      try {
        await api.gym.trainers.delete(id);
        toast.success(lang === 'bn' ? 'ট্রেইনার প্রোফাইল মুছে ফেলা হয়েছে!' : 'Trainer deactivated.');
        fetchTrainers();
      } catch (err) {
        toast.error(err.message || 'Failed to delete trainer.');
      }
    }
  };

  return (
    <div className="space-y-6 font-sans">
      
      {/* HEADER */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-medium text-slate-900 dark:text-white flex items-center gap-2.5">
            <Dumbbell className="w-6 h-6 text-[#00df89]" />
            <span>{lang === 'bn' ? 'ব্যক্তিগত ফিটনেস ট্রেইনারগণ' : 'Personal Fitness Instructors & Trainers'}</span>
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-zinc-400">
            {lang === 'bn' ? 'ট্রেইনার প্রোফাইল, মাসিক বেতন ও শিফট শিডিউলিং' : 'Certified coaches, payroll management & personal training sessions'}
          </p>
        </div>

        <Button
          onClick={() => {
            setEditingTrainer(null);
            setIsModalOpen(true);
          }}
          className="bg-[#00df89] hover:bg-[#00c97b] text-[#011812] font-medium text-xs gap-1.5 shadow-xs"
        >
          <Plus className="w-4 h-4 stroke-[2]" />
          <span>{lang === 'bn' ? 'নতুন ট্রেইনার যোগ করুন' : 'Add New Trainer'}</span>
        </Button>
      </div>

      {/* KPI METRICS */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card className="p-4 border-slate-200/90 dark:border-zinc-800/80 dark:bg-[#121215]">
          <div className="text-xs text-slate-500 dark:text-zinc-400">Certified Trainers</div>
          <div className="text-2xl font-medium text-slate-900 dark:text-white mt-1">{trainers.length}</div>
        </Card>
        <Card className="p-4 border-slate-200/90 dark:border-zinc-800/80 dark:bg-[#121215]">
          <div className="text-xs text-slate-500 dark:text-zinc-400">Total Monthly Trainer Payroll</div>
          <div className="text-2xl font-medium text-[#00a86b] dark:text-[#00df89] mt-1">৳ {totalPayroll.toLocaleString()}</div>
        </Card>
        <Card className="p-4 border-slate-200/90 dark:border-zinc-800/80 dark:bg-[#121215]">
          <div className="text-xs text-slate-500 dark:text-zinc-400">Active PT Clients Assigned</div>
          <div className="text-2xl font-medium text-slate-900 dark:text-white mt-1">{totalAssignedAthletes}</div>
        </Card>
      </div>

      {/* SEARCH BAR */}
      <Card className="p-4 border-slate-200/90 dark:border-zinc-800/80 dark:bg-[#121215]">
        <div className="w-full sm:w-80 relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder={lang === 'bn' ? 'ট্রেইনার বা বিশেষজ্ঞতা খুঁজুন...' : 'Search by name or specialization...'}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-4 py-2 rounded-xl bg-slate-50 dark:bg-[#09090b] border border-slate-200 dark:border-zinc-800 text-xs text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-[#00df89]"
          />
        </div>
      </Card>

      {/* TRAINERS GRID */}
      {isLoading ? (
        <div className="p-12 text-center text-slate-400">
          <Loader2 className="w-8 h-8 animate-spin mx-auto mb-2 text-[#00df89]" />
          Loading trainers...
        </div>
      ) : filteredTrainers.length === 0 ? (
        <div className="p-12 text-center rounded-2xl bg-white dark:bg-[#121215] border border-slate-200 dark:border-zinc-800 space-y-3">
          <Dumbbell className="w-10 h-10 text-slate-300 dark:text-zinc-600 mx-auto" />
          <h3 className="text-sm font-medium text-slate-800 dark:text-zinc-200">No Trainers Found</h3>
          <p className="text-xs text-slate-500 dark:text-zinc-400">Add coaches to assign personalized training plans to athletes.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {filteredTrainers.map((tr) => (
            <Card key={tr._id} className="p-5 border-slate-200/90 dark:border-zinc-800/80 dark:bg-[#121215] space-y-4">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 text-[#00a86b] dark:text-[#00df89] flex items-center justify-center font-medium text-base border border-emerald-500/20">
                  {tr.name.slice(0, 2).toUpperCase()}
                </div>
                <div>
                  <h3 className="text-sm font-medium text-slate-900 dark:text-white">{tr.name}</h3>
                  <div className="text-xs text-[#00a86b] dark:text-[#00df89] font-normal">{tr.specialization}</div>
                </div>
              </div>

              <div className="space-y-1.5 text-xs text-slate-600 dark:text-zinc-400 pt-2 border-t border-slate-100 dark:border-zinc-800/80">
                <div className="flex items-center gap-2">
                  <Phone className="w-3.5 h-3.5 text-slate-400" />
                  <span>{tr.phone}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Clock className="w-3.5 h-3.5 text-slate-400" />
                  <span>Monthly Salary: ৳ {(tr.monthlySalary || 0).toLocaleString()}</span>
                </div>
              </div>

              <div className="pt-2 border-t border-slate-100 dark:border-zinc-800/80 flex items-center justify-between">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setEditingTrainer(tr);
                    setIsModalOpen(true);
                  }}
                  className="text-xs gap-1"
                >
                  <Edit3 className="w-3 h-3" /> Edit
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleDelete(tr._id)}
                  className="text-rose-500 hover:text-rose-600 text-xs px-2"
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>
            </Card>
          ))}
        </div>
      )}

      <AddTrainerModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSaveTrainer={handleSaveTrainer}
        initialData={editingTrainer ? {
          name: editingTrainer.name,
          phone: editingTrainer.phone,
          email: editingTrainer.email,
          specialization: editingTrainer.specialization,
          salary: editingTrainer.monthlySalary,
          status: editingTrainer.status,
        } : null}
      />

    </div>
  );
}
