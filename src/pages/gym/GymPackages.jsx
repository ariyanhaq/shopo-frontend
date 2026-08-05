/**
 * @file GymPackages.jsx
 * @description Gym membership packages CRUD, feature matrix & tier configuration.
 */
import { useState } from 'react';
import { useLanguage } from '@/context/LanguageContext';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Package, Plus, CheckCircle2, Star, Edit3, Trash2,
  Snowflake, Dumbbell, Apple, Sparkles, Check, X
} from 'lucide-react';

import AddEditPackageModal from '@/components/gym/AddEditPackageModal';
import { INITIAL_GYM_PACKAGES } from '@/data/gymData';

export default function GymPackages() {
  const { lang } = useLanguage();
  const [packages, setPackages] = useState(INITIAL_GYM_PACKAGES);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingPackage, setEditingPackage] = useState(null);

  const handleSavePackage = (pkgToSave) => {
    const exists = packages.find(p => p.id === pkgToSave.id);
    if (exists) {
      setPackages(packages.map(p => p.id === pkgToSave.id ? pkgToSave : p));
    } else {
      setPackages([...packages, pkgToSave]);
    }
  };

  const handleDelete = (id) => {
    if (confirm('Are you sure you want to delete this membership package?')) {
      setPackages(packages.filter(p => p.id !== id));
    }
  };

  return (
    <div className="space-y-6 font-sans font-normal text-slate-800 dark:text-zinc-200">
      
      {/* HEADER */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-extrabold text-slate-900 dark:text-white flex items-center gap-2">
            <Package className="w-6 h-6 text-[#00df89]" />
            <span>Membership Packages & Pricing Tiers</span>
          </h1>
          <p className="text-xs text-slate-500 font-normal">
            Configure recurring passes, durations, pricing & included personal trainer perks.
          </p>
        </div>

        <Button
          onClick={() => {
            setEditingPackage(null);
            setIsModalOpen(true);
          }}
          className="bg-[#00df89] text-[#011812] hover:bg-[#00c97b] font-medium text-xs sm:text-sm h-11 px-4 gap-2 shadow-md shadow-emerald-500/20"
        >
          <Plus className="w-4 h-4" /> Create Custom Package
        </Button>
      </div>

      {/* TOP KPI CARDS */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card className="p-4 border border-slate-200/90 dark:border-zinc-800/80 dark:bg-[#121215]">
          <span className="text-xs font-normal text-slate-500 dark:text-zinc-400">Active Pass Tiers</span>
          <div className="mt-1 text-2xl font-normal text-slate-900 dark:text-white">{packages.length} Tiers</div>
        </Card>

        <Card className="p-4 border border-slate-200/90 dark:border-zinc-800/80 dark:bg-[#121215]">
          <span className="text-xs font-normal text-slate-500 dark:text-zinc-400">Most Popular Choice</span>
          <div className="mt-1 text-base font-medium text-emerald-600 dark:text-[#00df89]">6-Month VIP Transformation</div>
        </Card>

        <Card className="p-4 border border-slate-200/90 dark:border-zinc-800/80 dark:bg-[#121215]">
          <span className="text-xs font-normal text-slate-500 dark:text-zinc-400">Avg Membership Pass Value</span>
          <div className="mt-1 text-2xl font-normal text-blue-500">
            ৳ {Math.round(packages.reduce((acc, p) => acc + p.price, 0) / (packages.length || 1)).toLocaleString()}
          </div>
        </Card>
      </div>

      {/* PACKAGES CARDS GRID */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {packages.map((pkg) => {
          const isPopular = pkg.id === 'pkg-3';

          return (
            <Card
              key={pkg.id}
              className={`p-6 border flex flex-col justify-between space-y-6 relative overflow-hidden transition-all ${
                isPopular
                  ? 'border-[#00df89] dark:bg-[#121215] shadow-lg shadow-emerald-500/10'
                  : 'border-slate-200/90 dark:border-zinc-800/80 dark:bg-[#121215]'
              }`}
            >
              {isPopular && (
                <div className="absolute top-0 right-0 bg-[#00df89] text-[#011812] text-[9px] font-bold px-3 py-1 rounded-bl-xl uppercase tracking-wider flex items-center gap-1">
                  <Sparkles className="w-3 h-3" /> Most Popular
                </div>
              )}

              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <Badge variant="outline" className="bg-emerald-500/10 text-emerald-600 dark:text-[#00df89] border-emerald-500/20 text-[10px] font-normal">
                    {pkg.duration}
                  </Badge>
                  <span className="text-[10px] text-slate-400 font-mono font-normal">{pkg.durationDays} Days Pass</span>
                </div>

                <div>
                  <h3 className="font-medium text-lg text-slate-900 dark:text-white">{pkg.name}</h3>
                  <p className="text-xs text-slate-500 mt-1 font-normal">{pkg.description}</p>
                </div>

                <div className="text-2xl font-normal text-slate-900 dark:text-white tracking-tight">
                  ৳ {pkg.price.toLocaleString()} <span className="text-xs font-normal text-slate-400">/ pass</span>
                </div>

                {/* Perk Pills */}
                <div className="flex items-center gap-1.5 flex-wrap pt-1">
                  {pkg.personalTrainer && (
                    <span className="text-[10px] px-2 py-0.5 rounded-md bg-purple-500/10 text-purple-600 dark:text-purple-300 border border-purple-500/20 flex items-center gap-1">
                      <Dumbbell className="w-3 h-3" /> Trainer Included
                    </span>
                  )}
                  {pkg.freezeAllowed && (
                    <span className="text-[10px] px-2 py-0.5 rounded-md bg-blue-500/10 text-blue-600 dark:text-blue-300 border border-blue-500/20 flex items-center gap-1">
                      <Snowflake className="w-3 h-3" /> Freeze Pass
                    </span>
                  )}
                  {pkg.dietPlan && (
                    <span className="text-[10px] px-2 py-0.5 rounded-md bg-amber-500/10 text-amber-600 dark:text-amber-300 border border-amber-500/20 flex items-center gap-1">
                      <Apple className="w-3 h-3" /> Diet Plan
                    </span>
                  )}
                </div>

                {/* Benefits List */}
                <div className="space-y-2 pt-3 border-t border-slate-100 dark:border-zinc-800/80">
                  <span className="text-[11px] font-medium text-slate-700 dark:text-zinc-300 block">Package Benefits:</span>
                  {pkg.benefits.map((b, idx) => (
                    <div key={idx} className="flex items-center gap-2 text-xs text-slate-600 dark:text-zinc-400 font-normal">
                      <CheckCircle2 className="w-3.5 h-3.5 text-[#00df89] shrink-0" />
                      <span>{b}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Action Buttons */}
              <div className="pt-4 border-t border-slate-100 dark:border-zinc-800/80 flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setEditingPackage(pkg);
                    setIsModalOpen(true);
                  }}
                  className="flex-1 text-xs font-medium dark:bg-[#09090b]"
                >
                  <Edit3 className="w-3.5 h-3.5 mr-1" /> Edit
                </Button>

                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleDelete(pkg.id)}
                  className="text-xs font-medium text-rose-500 hover:text-rose-600 dark:bg-[#09090b]"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </Button>
              </div>
            </Card>
          );
        })}
      </div>

      {/* COMPARATIVE MATRIX TABLE */}
      <Card className="p-6 border border-slate-200/90 dark:border-zinc-800/80 dark:bg-[#121215] space-y-4">
        <h2 className="text-base font-medium text-slate-900 dark:text-white">Feature Comparison Matrix</h2>

        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left">
            <thead className="bg-slate-100 dark:bg-zinc-900/80 text-slate-500 font-normal uppercase text-[10px]">
              <tr>
                <th className="p-3.5 font-medium">Package Tier</th>
                <th className="p-3.5 font-medium">Duration</th>
                <th className="p-3.5 font-medium">Pricing</th>
                <th className="p-3.5 font-medium text-center">Trainer Included</th>
                <th className="p-3.5 font-medium text-center">Freeze Allowed</th>
                <th className="p-3.5 font-medium text-center">Custom Diet Plan</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-zinc-800 text-slate-800 dark:text-zinc-200 font-normal">
              {packages.map((pkg) => (
                <tr key={pkg.id} className="hover:bg-slate-50 dark:hover:bg-zinc-900/40">
                  <td className="p-3.5 font-medium text-slate-900 dark:text-white">{pkg.name}</td>
                  <td className="p-3.5 text-slate-500 font-normal">{pkg.duration}</td>
                  <td className="p-3.5 font-medium text-emerald-600 dark:text-[#00df89]">৳ {pkg.price.toLocaleString()}</td>
                  <td className="p-3.5 text-center">
                    {pkg.personalTrainer ? <Check className="w-4 h-4 text-emerald-500 mx-auto" /> : <X className="w-4 h-4 text-slate-300 mx-auto" />}
                  </td>
                  <td className="p-3.5 text-center">
                    {pkg.freezeAllowed ? <Check className="w-4 h-4 text-emerald-500 mx-auto" /> : <X className="w-4 h-4 text-slate-300 mx-auto" />}
                  </td>
                  <td className="p-3.5 text-center">
                    {pkg.dietPlan ? <Check className="w-4 h-4 text-emerald-500 mx-auto" /> : <X className="w-4 h-4 text-slate-300 mx-auto" />}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      {/* MODAL */}
      <AddEditPackageModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSavePackage={handleSavePackage}
        initialData={editingPackage}
      />

    </div>
  );
}
