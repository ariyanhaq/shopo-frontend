/**
 * @file AddEditPackageModal.jsx
 * @description Modal dialog for creating or editing gym membership package tiers.
 */
import { useState, useEffect } from 'react';
import { useLanguage } from '@/context/LanguageContext';
import { Button } from '@/components/ui/button';
import { X, Package, Plus, CheckCircle2, Dumbbell } from 'lucide-react';

export default function AddEditPackageModal({ isOpen, onClose, onSavePackage, initialData }) {
  const { lang } = useLanguage();

  const [formData, setFormData] = useState({
    name: '',
    price: 3000,
    duration: '1 Month',
    durationDays: 30,
    benefits: 'Full Gym Access\nLocker Room\nFree Shaker Bottle',
    description: '',
    status: 'Active',
    freezeAllowed: true,
    personalTrainer: false,
    dietPlan: false
  });

  useEffect(() => {
    if (initialData) {
      setFormData({
        ...initialData,
        benefits: Array.isArray(initialData.benefits) ? initialData.benefits.join('\n') : initialData.benefits
      });
    } else {
      setFormData({
        name: '',
        price: 3000,
        duration: '1 Month',
        durationDays: 30,
        benefits: 'Full Gym Access\nLocker Room\nFree Shaker Bottle',
        description: 'Standard gym pass for workout enthusiasts.',
        status: 'Active',
        freezeAllowed: true,
        personalTrainer: false,
        dietPlan: false
      });
    }
  }, [initialData, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = (e) => {
    e.preventDefault();
    const benefitsList = formData.benefits.split('\n').filter(b => b.trim().length > 0);

    const pkgToSave = {
      id: initialData ? initialData.id : `pkg-${Date.now()}`,
      ...formData,
      price: parseFloat(formData.price),
      durationDays: parseInt(formData.durationDays, 10),
      benefits: benefitsList
    };

    onSavePackage(pkgToSave);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm font-sans">
      <div className="bg-white dark:bg-[#121215] border border-slate-200 dark:border-zinc-800 rounded-3xl w-full max-w-lg overflow-hidden shadow-2xl flex flex-col">
        
        {/* Header */}
        <div className="p-4 border-b border-slate-100 dark:border-zinc-800 flex items-center justify-between bg-slate-50/50 dark:bg-zinc-900/40">
          <div className="flex items-center gap-2">
            <Package className="w-5 h-5 text-[#00df89]" />
            <span className="font-medium text-base text-slate-900 dark:text-white">
              {initialData ? 'Edit Package Tier' : 'Create Custom Gym Package'}
            </span>
          </div>
          <button onClick={onClose} className="p-1 text-slate-400 hover:text-slate-700 dark:hover:text-white">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4 text-xs font-normal">
          <div>
            <label className="font-medium text-slate-700 dark:text-zinc-300 mb-1 block">Package Name</label>
            <input
              type="text"
              required
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="e.g. 3-Month Summer Pass"
              className="w-full px-3.5 py-2 rounded-xl bg-slate-50 dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 text-sm focus:outline-none focus:ring-2 focus:ring-[#00df89]"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="font-medium text-slate-700 dark:text-zinc-300 mb-1 block">Price Fee (৳)</label>
              <input
                type="number"
                required
                value={formData.price}
                onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                className="w-full px-3.5 py-2 rounded-xl bg-slate-50 dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 text-sm focus:outline-none focus:ring-2 focus:ring-[#00df89]"
              />
            </div>

            <div>
              <label className="font-medium text-slate-700 dark:text-zinc-300 mb-1 block">Duration (Days)</label>
              <input
                type="number"
                required
                value={formData.durationDays}
                onChange={(e) => {
                  const d = parseInt(e.target.value, 10) || 30;
                  setFormData({
                    ...formData,
                    durationDays: d,
                    duration: d >= 365 ? '1 Year' : d >= 180 ? '6 Months' : d >= 90 ? '3 Months' : '1 Month'
                  });
                }}
                className="w-full px-3.5 py-2 rounded-xl bg-slate-50 dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 text-sm focus:outline-none focus:ring-2 focus:ring-[#00df89]"
              />
            </div>
          </div>

          <div>
            <label className="font-medium text-slate-700 dark:text-zinc-300 mb-1 block">Short Description</label>
            <input
              type="text"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="Tagline describing benefits..."
              className="w-full px-3.5 py-2 rounded-xl bg-slate-50 dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 text-sm focus:outline-none focus:ring-2 focus:ring-[#00df89]"
            />
          </div>

          <div>
            <label className="font-medium text-slate-700 dark:text-zinc-300 mb-1 block">Package Features (1 per line)</label>
            <textarea
              rows={3}
              value={formData.benefits}
              onChange={(e) => setFormData({ ...formData, benefits: e.target.value })}
              className="w-full px-3.5 py-2 rounded-xl bg-slate-50 dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 text-sm focus:outline-none focus:ring-2 focus:ring-[#00df89]"
            />
          </div>

          {/* Toggle Switches */}
          <div className="grid grid-cols-3 gap-2 pt-2 border-t border-slate-100 dark:border-zinc-800">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={formData.personalTrainer}
                onChange={(e) => setFormData({ ...formData, personalTrainer: e.target.checked })}
                className="rounded text-[#00df89] focus:ring-[#00df89]"
              />
              <span>Trainer Included</span>
            </label>

            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={formData.freezeAllowed}
                onChange={(e) => setFormData({ ...formData, freezeAllowed: e.target.checked })}
                className="rounded text-[#00df89] focus:ring-[#00df89]"
              />
              <span>Freeze Allowed</span>
            </label>

            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={formData.dietPlan}
                onChange={(e) => setFormData({ ...formData, dietPlan: e.target.checked })}
                className="rounded text-[#00df89] focus:ring-[#00df89]"
              />
              <span>Diet Plan</span>
            </label>
          </div>

          <div className="pt-3 border-t border-slate-100 dark:border-zinc-800 flex items-center justify-between">
            <Button variant="outline" type="button" onClick={onClose} className="text-xs font-medium">
              Cancel
            </Button>
            <Button type="submit" className="bg-[#00df89] text-[#011812] hover:bg-[#00c97b] font-medium text-xs px-5 gap-1.5">
              <CheckCircle2 className="w-4 h-4" /> Save Package Pass
            </Button>
          </div>
        </form>

      </div>
    </div>
  );
}
