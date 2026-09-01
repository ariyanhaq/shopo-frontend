import { useState } from 'react';
import { useLanguage } from '@/context/LanguageContext';
import { useShop } from '@/context/ShopContext';
import { useAuth } from '@/context/AuthContext';
import toast from 'react-hot-toast';
import { Card, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import {
  Settings, Percent, Printer, ChefHat, LayoutGrid, DollarSign,
  ShieldCheck, Save, Sparkles
} from 'lucide-react';

export default function RestaurantSettings() {
  const { lang } = useLanguage();
  const { activeShop } = useShop();
  const { mongoShop } = useAuth();

  const [form, setForm] = useState({
    service_charge_percent: 0,
    vat_percent: 0,
    default_prep_time: 15,
    enable_kot_sound: true,
    enable_table_qr_ordering: true,
    kot_printer_format: '80mm',
    kitchen_stations: ['Main Kitchen', 'Grill & Tandoor', 'Beverage Bar', 'Bakery'],
  });

  const [isSaving, setIsSaving] = useState(false);

  const handleSave = (e) => {
    e.preventDefault();
    setIsSaving(true);
    setTimeout(() => {
      setIsSaving(false);
      toast.success(lang === 'bn' ? 'রেস্তোরাঁ সেটিংস সংরক্ষিত হয়েছে!' : 'Restaurant settings updated!');
    }, 600);
  };

  return (
    <div className="max-w-4xl space-y-6 font-sans pb-16">
      
      {/* HEADER */}
      <div>
        <h1 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white tracking-tight flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-orange-500/10 text-orange-600 flex items-center justify-center">
            <Settings className="w-4 h-4" />
          </div>
          <span>{lang === 'bn' ? 'রেস্তোরাঁ ও কেওটি সেটিংস' : 'Restaurant & KOT Configurations'}</span>
        </h1>
        <p className="text-xs sm:text-sm text-slate-500 dark:text-zinc-400 font-normal mt-0.5">
          {lang === 'bn'
            ? 'সার্ভিস চার্জ %, ভ্যাট রেট, কেওটি প্রিন্টার সাইজ এবং রান্নাঘর স্টেশন কনফিগার করুন।'
            : 'Configure service charges, tax levies, KOT thermal printer sizing and kitchen stations.'}
        </p>
      </div>

      <form onSubmit={handleSave} className="space-y-5">
        
        {/* Service Charge & Tax */}
        <Card className="p-5 sm:p-6 bg-white dark:bg-zinc-900 border-slate-200/80 dark:border-zinc-800 shadow-xs rounded-2xl">
          <CardTitle className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2 mb-4">
            <Percent className="w-4 h-4 text-emerald-500" />
            <span>Service Charge & Tax Levies</span>
          </CardTitle>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-semibold text-slate-700 dark:text-zinc-300 block mb-1.5">
                Default Service Charge (%)
              </label>
              <Input
                type="number"
                min="0"
                max="30"
                value={form.service_charge_percent}
                onChange={(e) => setForm({ ...form, service_charge_percent: Number(e.target.value) })}
                className="h-10 text-xs font-mono"
              />
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-700 dark:text-zinc-300 block mb-1.5">
                Default Restaurant VAT (%)
              </label>
              <Input
                type="number"
                min="0"
                max="30"
                value={form.vat_percent}
                onChange={(e) => setForm({ ...form, vat_percent: Number(e.target.value) })}
                className="h-10 text-xs font-mono"
              />
            </div>
          </div>
        </Card>

        {/* KOT & Kitchen Screen Settings */}
        <Card className="p-5 sm:p-6 bg-white dark:bg-zinc-900 border-slate-200/80 dark:border-zinc-800 shadow-xs rounded-2xl">
          <CardTitle className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2 mb-4">
            <ChefHat className="w-4 h-4 text-orange-500" />
            <span>Kitchen Display (KDS) & KOT Printer</span>
          </CardTitle>

          <div className="space-y-3 text-xs">
            <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-zinc-800/40 border border-slate-200 dark:border-zinc-800 flex items-center justify-between">
              <div>
                <div className="font-bold text-slate-900 dark:text-white">
                  Kitchen Bell Audio Alert
                </div>
                <div className="text-[11px] text-slate-500">
                  Plays audio chime when new KOT is dispatched to the kitchen screen.
                </div>
              </div>
              <input
                type="checkbox"
                checked={form.enable_kot_sound}
                onChange={(e) => setForm({ ...form, enable_kot_sound: e.target.checked })}
                className="w-5 h-5 accent-[#00df89] rounded cursor-pointer"
              />
            </div>

            <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-zinc-800/40 border border-slate-200 dark:border-zinc-800 flex items-center justify-between">
              <div>
                <div className="font-bold text-slate-900 dark:text-white">
                  Table QR Digital Self-Ordering
                </div>
                <div className="text-[11px] text-slate-500">
                  Allows customers to view digital menu and place table orders via smartphone QR.
                </div>
              </div>
              <input
                type="checkbox"
                checked={form.enable_table_qr_ordering}
                onChange={(e) => setForm({ ...form, enable_table_qr_ordering: e.target.checked })}
                className="w-5 h-5 accent-[#00df89] rounded cursor-pointer"
              />
            </div>
          </div>
        </Card>

        <div className="flex justify-end">
          <button
            type="submit"
            disabled={isSaving}
            className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-[#00df89] hover:bg-[#00c578] text-slate-950 font-bold text-xs shadow-xs cursor-pointer"
          >
            <Save className="w-4 h-4" />
            <span>{isSaving ? 'Saving...' : 'Save Restaurant Settings'}</span>
          </button>
        </div>

      </form>

    </div>
  );
}
