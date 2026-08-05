/**
 * @file GymSettings.jsx
 * @description Gym Facility Settings matching Shopo's core Workspace Settings UI design.
 */
import { useState } from 'react';
import { useShop } from '@/context/ShopContext';
import { Card, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Sun, Moon, Check, Store, Save, Settings, Dumbbell, Bell } from 'lucide-react';

export default function GymSettings() {
  const { activeShop, theme, setTheme } = useShop();
  const [savedAlert, setSavedAlert] = useState(false);

  const [gymForm, setGymForm] = useState({
    gymName: activeShop ? activeShop.name : 'Shopo Gym & Fitness Center',
    tagline: activeShop ? activeShop.tagline : 'Membership tracking, check-ins, trainers & class schedules',
    openingHours: '06:00 AM - 11:00 PM',
    invoicePrefix: 'INV-GYM-',
    currency: 'BDT (৳)',
    enableSms: true,
    enableEmail: true
  });

  const handleSave = (e) => {
    e.preventDefault();
    setSavedAlert(true);
    setTimeout(() => setSavedAlert(false), 2000);
  };

  return (
    <div className="max-w-4xl space-y-6 font-sans">
      
      {/* Header Title */}
      <div>
        <h1 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white tracking-tight">
          Gym Facility Settings
        </h1>
        <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 font-normal mt-0.5">
          Manage your appearance, theme preferences, operating hours, and gym profile.
        </p>
      </div>

      {savedAlert && (
        <div className="p-3.5 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-700 dark:text-emerald-400 text-xs sm:text-sm font-semibold flex items-center gap-2">
          <Check className="w-4 h-4" />
          <span>Gym settings saved successfully!</span>
        </div>
      )}

      {/* THEME PREFERENCES CARD */}
      <Card className="p-6 space-y-5">
        <div>
          <CardTitle className="text-base sm:text-lg font-bold flex items-center gap-2">
            <Sun className="w-4.5 h-4.5 text-amber-500" />
            <span>Appearance & Theme Mode</span>
          </CardTitle>
          <CardDescription className="mt-1">
            Choose your preferred color theme for Shopo interface across all devices.
          </CardDescription>
        </div>

        {/* Theme Options Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          
          {/* Light Theme Card */}
          <div
            onClick={() => setTheme('light')}
            className={`p-4 rounded-xl border cursor-pointer transition-all duration-150 flex items-center justify-between ${
              theme === 'light'
                ? 'border-[#00df89] bg-emerald-50/30 dark:bg-emerald-950/20 shadow-xs'
                : 'border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 bg-white dark:bg-slate-900'
            }`}
          >
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-lg bg-amber-500/10 text-amber-600 flex items-center justify-center font-medium">
                <Sun className="w-4.5 h-4.5" />
              </div>
              <div>
                <div className="font-semibold text-sm text-slate-900 dark:text-white">Light Mode</div>
                <div className="text-xs text-slate-500 dark:text-slate-400 font-normal">Clean, crisp light background</div>
              </div>
            </div>

            {theme === 'light' && (
              <div className="w-5 h-5 rounded-full bg-[#00df89] text-[#011812] flex items-center justify-center font-bold">
                <Check className="w-3.5 h-3.5 stroke-[2.5]" />
              </div>
            )}
          </div>

          {/* Dark Theme Card */}
          <div
            onClick={() => setTheme('dark')}
            className={`p-4 rounded-xl border cursor-pointer transition-all duration-150 flex items-center justify-between ${
              theme === 'dark'
                ? 'border-[#00df89] bg-slate-900 text-white shadow-xs'
                : 'border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 bg-white dark:bg-slate-900'
            }`}
          >
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-lg bg-slate-800 text-slate-200 flex items-center justify-center font-medium">
                <Moon className="w-4.5 h-4.5" />
              </div>
              <div>
                <div className="font-semibold text-sm text-slate-900 dark:text-white">Dark Mode</div>
                <div className="text-xs text-slate-500 dark:text-slate-400 font-normal">Deep slate, high-contrast surface</div>
              </div>
            </div>

            {theme === 'dark' && (
              <div className="w-5 h-5 rounded-full bg-[#00df89] text-[#011812] flex items-center justify-center font-bold">
                <Check className="w-3.5 h-3.5 stroke-[2.5]" />
              </div>
            )}
          </div>

        </div>
      </Card>

      {/* GYM DETAILS FORM */}
      <form onSubmit={handleSave}>
        <Card className="p-6 space-y-5">
          <div>
            <CardTitle className="text-base sm:text-lg font-bold flex items-center gap-2">
              <Store className="w-4.5 h-4.5 text-[#00a86b] dark:text-[#00df89]" />
              <span>Gym Facility Profile Information</span>
            </CardTitle>
            <CardDescription className="mt-1">
              Update gym facility display details, opening hours and cash memo invoice prefixes.
            </CardDescription>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
                Gym Name
              </label>
              <Input
                type="text"
                value={gymForm.gymName}
                onChange={(e) => setGymForm({ ...gymForm, gymName: e.target.value })}
              />
            </div>

            <div className="space-y-1.5">
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
                Operating Shift Hours
              </label>
              <Input
                type="text"
                value={gymForm.openingHours}
                onChange={(e) => setGymForm({ ...gymForm, openingHours: e.target.value })}
              />
            </div>

            <div className="space-y-1.5">
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
                Cash Memo Prefix
              </label>
              <Input
                type="text"
                value={gymForm.invoicePrefix}
                onChange={(e) => setGymForm({ ...gymForm, invoicePrefix: e.target.value })}
              />
            </div>

            <div className="space-y-1.5">
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
                Operational Currency
              </label>
              <Input
                type="text"
                disabled
                value={gymForm.currency}
              />
            </div>
          </div>

          <div className="pt-2 flex justify-end">
            <Button
              type="submit"
              variant="default"
              className="px-5 bg-[#00df89] hover:bg-[#00c97b] text-[#011812] font-semibold"
            >
              <Save className="w-4 h-4" />
              <span>Save Changes</span>
            </Button>
          </div>
        </Card>
      </form>

    </div>
  );
}
