import { useState, useEffect } from 'react';
import { useLanguage } from '@/context/LanguageContext';
import api from '@/services/api';
import toast from 'react-hot-toast';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Package, Plus, CheckCircle2, Star, Edit3, Trash2,
  Dumbbell, Sparkles, Check, X, Loader2
} from 'lucide-react';

import AddEditPackageModal from '@/components/gym/AddEditPackageModal';
import ConfirmDialog from '@/components/common/ConfirmDialog';

export default function GymPackages() {
  const { lang } = useLanguage();
  const [packages, setPackages] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [editingPackage, setEditingPackage] = useState(null);
  const [confirmDeleteDialog, setConfirmDeleteDialog] = useState({
    isOpen: false,
    id: null,
    name: '',
  });

  const fetchPackages = async () => {
    try {
      const res = await api.gym.packages.list();
      if (res.data) {
        setPackages(res.data);
      }
    } catch (err) {
      console.warn('Failed to load gym packages:', err.message);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchPackages();
  }, []);

  const handleSavePackage = async (pkgData) => {
    setIsSubmitting(true);
    try {
      if (editingPackage && editingPackage._id) {
        await api.gym.packages.update(editingPackage._id, {
          name: pkgData.name,
          price: pkgData.price,
          duration: pkgData.duration,
          features: pkgData.benefits,
          popular: pkgData.popular || false,
        });
        toast.success(lang === 'bn' ? 'প্যাকেজ সফলভাবে আপডেট করা হয়েছে!' : 'Gym package updated successfully!');
      } else {
        await api.gym.packages.create({
          name: pkgData.name,
          price: pkgData.price,
          duration: pkgData.duration,
          features: pkgData.benefits,
          popular: pkgData.popular || false,
        });
        toast.success(lang === 'bn' ? 'নতুন প্যাকেজ তৈরি করা হয়েছে!' : 'Gym package created successfully!');
      }
      setIsModalOpen(false);
      fetchPackages();
    } catch (err) {
      toast.error(err.message || 'Failed to save package in database.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = (pkg) => {
    setConfirmDeleteDialog({
      isOpen: true,
      id: pkg._id,
      name: pkg.name,
    });
  };

  const handleConfirmDelete = async () => {
    if (!confirmDeleteDialog.id) return;
    setIsDeleting(true);
    try {
      await api.gym.packages.delete(confirmDeleteDialog.id);
      toast.success(lang === 'bn' ? 'প্যাকেজ মুছে ফেলা হয়েছে!' : 'Membership package deleted.');
      setConfirmDeleteDialog({ isOpen: false, id: null, name: '' });
      fetchPackages();
    } catch (err) {
      toast.error(err.message || 'Failed to delete package.');
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="space-y-6 font-sans">
      
      {/* HEADER */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-medium text-slate-900 dark:text-white flex items-center gap-2.5">
            <Package className="w-6 h-6 text-[#00df89]" />
            <span>{lang === 'bn' ? 'মেম্বারশিপ প্যাকেজ ও প্রাইসিং' : 'Membership Packages & Pricing Tiers'}</span>
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-zinc-400">
            {lang === 'bn' ? 'বিভিন্ন মেয়াদের সাবস্ক্রিপশন প্ল্যান ও ফি কনফিগারেশন' : 'Configure recurring passes, durations, pricing & included athlete perks'}
          </p>
        </div>

        <Button
          onClick={() => {
            setEditingPackage(null);
            setIsModalOpen(true);
          }}
          className="bg-[#00df89] hover:bg-[#00c97b] text-[#011812] font-medium text-xs gap-1.5 shadow-xs"
        >
          <Plus className="w-4 h-4 stroke-[2]" />
          <span>{lang === 'bn' ? 'নতুন প্যাকেজ যোগ করুন' : 'Add New Package'}</span>
        </Button>
      </div>

      {/* PACKAGES GRID */}
      {isLoading ? (
        <div className="p-12 text-center text-slate-400">
          <Loader2 className="w-8 h-8 animate-spin mx-auto mb-2 text-[#00df89]" />
          Loading packages...
        </div>
      ) : packages.length === 0 ? (
        <div className="p-12 text-center space-y-3 rounded-2xl bg-white dark:bg-[#121215] border border-slate-200 dark:border-zinc-800">
          <Package className="w-10 h-10 text-slate-300 dark:text-zinc-600 mx-auto" />
          <h3 className="text-sm font-medium text-slate-800 dark:text-zinc-200">No Packages Created Yet</h3>
          <p className="text-xs text-slate-500 dark:text-zinc-400">Create your gym pass packages to start enrolling members.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {packages.map((pkg) => (
            <Card
              key={pkg._id}
              className={`p-6 flex flex-col justify-between space-y-6 transition-all duration-200 relative overflow-hidden ${
                pkg.popular
                  ? 'border-2 border-[#00df89] shadow-lg shadow-emerald-500/10 bg-emerald-500/[0.02] dark:bg-[#00df89]/[0.02]'
                  : 'border border-slate-200/90 dark:border-zinc-800/80 dark:bg-[#121215]'
              }`}
            >
              {pkg.popular && (
                <div className="absolute top-0 right-0 bg-[#00df89] text-[#011812] px-3 py-1 text-[10px] font-bold uppercase tracking-wider rounded-bl-xl shadow-xs">
                  Most Popular Pass
                </div>
              )}

              <div className="space-y-4">
                <div>
                  <h3 className="text-lg font-medium text-slate-900 dark:text-white flex items-center gap-2">
                    <span>{pkg.name}</span>
                  </h3>
                  <div className="text-xs text-slate-500 dark:text-zinc-400 mt-1">{pkg.duration} pass</div>
                </div>

                <div className="flex items-baseline gap-1">
                  <span className="text-3xl font-medium text-slate-900 dark:text-white tracking-tight">
                    ৳ {pkg.price.toLocaleString()}
                  </span>
                  <span className="text-xs text-slate-400">/{pkg.duration}</span>
                </div>

                {/* Features Checklist */}
                <div className="space-y-2.5 pt-4 border-t border-slate-100 dark:border-zinc-800/80">
                  <div className="text-xs font-medium text-slate-700 dark:text-zinc-300">Included Perks:</div>
                  {(pkg.features || []).map((feat, fIdx) => (
                    <div key={fIdx} className="flex items-center gap-2 text-xs text-slate-600 dark:text-zinc-400">
                      <div className="w-4 h-4 rounded-full bg-emerald-500/10 text-[#00a86b] dark:text-[#00df89] flex items-center justify-center shrink-0">
                        <Check className="w-2.5 h-2.5 stroke-[3]" />
                      </div>
                      <span>{feat}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Action Buttons */}
              <div className="pt-4 border-t border-slate-100 dark:border-zinc-800/80 flex items-center justify-between gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setEditingPackage(pkg);
                    setIsModalOpen(true);
                  }}
                  className="flex-1 text-xs gap-1.5"
                >
                  <Edit3 className="w-3.5 h-3.5" /> Edit
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleDelete(pkg)}
                  className="text-rose-500 hover:text-rose-600 text-xs px-2"
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* Create / Edit Modal */}
      <AddEditPackageModal
        isOpen={isModalOpen}
        isSubmitting={isSubmitting}
        onClose={() => setIsModalOpen(false)}
        onSavePackage={handleSavePackage}
        initialData={editingPackage ? {
          name: editingPackage.name,
          price: editingPackage.price,
          duration: editingPackage.duration,
          benefits: editingPackage.features,
          popular: editingPackage.popular,
        } : null}
      />

      {/* Confirm Delete Dialog */}
      <ConfirmDialog
        isOpen={confirmDeleteDialog.isOpen}
        isLoading={isDeleting}
        title={lang === 'bn' ? `'${confirmDeleteDialog.name}' প্যাকেজ মুছে ফেলতে চান?` : `Delete package '${confirmDeleteDialog.name}'?`}
        description={lang === 'bn' ? 'এই প্যাকেজটি স্থায়ীভাবে মুছে ফেলা হবে।' : 'This membership package will be permanently deleted.'}
        confirmText={lang === 'bn' ? 'হ্যাঁ, মুছে ফেলুন' : 'Yes, Delete'}
        cancelText={lang === 'bn' ? 'বাতিল' : 'Cancel'}
        onConfirm={handleConfirmDelete}
        onCancel={() => setConfirmDeleteDialog({ isOpen: false, id: null, name: '' })}
      />

    </div>
  );
}
