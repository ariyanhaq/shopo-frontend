/**
 * @file AddTrainerModal.jsx
 * @description Modal dialog for adding a new fitness trainer or editing an existing trainer profile.
 */
import { useState, useEffect } from 'react';
import { useLanguage } from '@/context/LanguageContext';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectTrigger,
  SelectContent,
  SelectItem,
  SelectValue
} from '@/components/ui/select';
import { X, Dumbbell, CheckCircle2, User, Phone, Mail, Clock, DollarSign } from 'lucide-react';
import { useBodyScrollLock } from '@/hooks/useBodyScrollLock';

export default function AddTrainerModal({ isOpen, onClose, onSaveTrainer, initialData }) {
  useBodyScrollLock(isOpen);
  const { lang } = useLanguage();

  const [formData, setFormData] = useState({
    name: '',
    photo: 'https://images.unsplash.com/photo-1567013127542-490d757e51fc?w=150&auto=format&fit=crop&q=80',
    phone: '',
    email: '',
    specialization: 'Bodybuilding & Heavy Strength',
    salary: 35000,
    workingHours: '06:00 AM - 02:00 PM',
    status: 'Active'
  });

  useEffect(() => {
    if (initialData) {
      setFormData(initialData);
    } else {
      setFormData({
        name: '',
        photo: 'https://images.unsplash.com/photo-1567013127542-490d757e51fc?w=150&auto=format&fit=crop&q=80',
        phone: '',
        email: '',
        specialization: 'Bodybuilding & Heavy Strength',
        salary: 35000,
        workingHours: '06:00 AM - 02:00 PM',
        status: 'Active'
      });
    }
  }, [initialData, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = (e) => {
    e.preventDefault();
    const trainerToSave = {
      id: initialData ? initialData.id : `tr-${Date.now()}`,
      ...formData,
      salary: parseFloat(formData.salary) || 0,
      assignedMembersCount: initialData ? initialData.assignedMembersCount : 0
    };
    onSaveTrainer(trainerToSave);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm font-sans">
      <div className="bg-white dark:bg-[#121215] border border-slate-200 dark:border-zinc-800 rounded-3xl w-full max-w-lg overflow-hidden shadow-2xl flex flex-col">
        
        {/* Header */}
        <div className="p-4 border-b border-slate-100 dark:border-zinc-800 flex items-center justify-between bg-slate-50/50 dark:bg-zinc-900/40">
          <div className="flex items-center gap-2">
            <Dumbbell className="w-5 h-5 text-[#00df89]" />
            <span className="font-medium text-base text-slate-900 dark:text-white">
              {initialData ? 'Edit Instructor Profile' : 'Add New Personal Trainer'}
            </span>
          </div>
          <button onClick={onClose} className="p-1 text-slate-400 hover:text-slate-700 dark:hover:text-white">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4 text-xs font-normal">
          <div>
            <label className="font-medium text-slate-700 dark:text-zinc-300 mb-1 block">Trainer Full Name *</label>
            <input
              type="text"
              required
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="e.g. Tanvir Ahmed"
              className="w-full px-3.5 py-2 rounded-xl bg-slate-50 dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 text-sm focus:outline-none focus:ring-2 focus:ring-[#00df89]"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="font-medium text-slate-700 dark:text-zinc-300 mb-1 block">Phone Number *</label>
              <input
                type="tel"
                required
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                placeholder="01711-000000"
                className="w-full px-3.5 py-2 rounded-xl bg-slate-50 dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 text-sm focus:outline-none focus:ring-2 focus:ring-[#00df89]"
              />
            </div>

            <div>
              <label className="font-medium text-slate-700 dark:text-zinc-300 mb-1 block">Email Address</label>
              <input
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                placeholder="trainer@shopo.bd"
                className="w-full px-3.5 py-2 rounded-xl bg-slate-50 dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 text-sm focus:outline-none focus:ring-2 focus:ring-[#00df89]"
              />
            </div>
          </div>

          <div>
            <label className="font-medium text-slate-700 dark:text-zinc-300 mb-1 block">Fitness Specialization</label>
            <Select
              value={formData.specialization}
              onValueChange={(val) => setFormData({ ...formData, specialization: val })}
            >
              <SelectTrigger className="w-full bg-slate-50 dark:bg-zinc-900">
                <SelectValue placeholder="Fitness Specialization" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Bodybuilding & Heavy Strength">Bodybuilding & Heavy Strength</SelectItem>
                <SelectItem value="Weight Loss & Pilates">Weight Loss & Pilates</SelectItem>
                <SelectItem value="HIIT & Functional Conditioning">HIIT & Functional Conditioning</SelectItem>
                <SelectItem value="Power Yoga & Flexibility">Power Yoga & Flexibility</SelectItem>
                <SelectItem value="Cardio & Endurance">Cardio & Endurance</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="font-medium text-slate-700 dark:text-zinc-300 mb-1 block">Shift Working Hours</label>
              <input
                type="text"
                value={formData.workingHours}
                onChange={(e) => setFormData({ ...formData, workingHours: e.target.value })}
                placeholder="06:00 AM - 02:00 PM"
                className="w-full px-3.5 py-2 rounded-xl bg-slate-50 dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 text-sm focus:outline-none focus:ring-2 focus:ring-[#00df89]"
              />
            </div>

            <div>
              <label className="font-medium text-slate-700 dark:text-zinc-300 mb-1 block">Monthly Salary (৳)</label>
              <input
                type="number"
                value={formData.salary}
                onChange={(e) => setFormData({ ...formData, salary: e.target.value })}
                className="w-full px-3.5 py-2 rounded-xl bg-slate-50 dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 text-sm focus:outline-none focus:ring-2 focus:ring-[#00df89]"
              />
            </div>
          </div>

          <div className="pt-3 border-t border-slate-100 dark:border-zinc-800 flex items-center justify-between">
            <Button variant="outline" type="button" onClick={onClose} className="text-xs font-medium">
              Cancel
            </Button>
            <Button type="submit" className="bg-[#00df89] text-[#011812] hover:bg-[#00c97b] font-medium text-xs px-5 gap-1.5">
              <CheckCircle2 className="w-4 h-4" /> Save Trainer Profile
            </Button>
          </div>
        </form>

      </div>
    </div>
  );
}
