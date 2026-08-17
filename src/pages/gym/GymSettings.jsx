/**
 * @file GymSettings.jsx
 * @description Gym Facility Settings connected to MongoDB shop profile with full Business Type switching capability.
 */
import { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useShop } from '@/context/ShopContext';
import { useAuth } from '@/context/AuthContext';
import { useLanguage } from '@/context/LanguageContext';
import { SHOP_TYPES } from '@/data/shopTypesData';
import api from '@/services/api';
import toast from 'react-hot-toast';
import { Card, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  Sun, Moon, Check, Store, Save, Loader2,
  Phone, MapPin, Building2, Search, Dumbbell,
  ShoppingBag, PenTool, Shirt, Tv, Pill, Utensils, Coffee, Cake,
  Cookie, Smartphone, Hammer, Armchair, BookOpen, Gift, Flower2,
  Footprints, Gem, Scissors, ScissorsLineDashed, Dog,
  Gamepad2, Trophy, Laptop, Sprout, Car, Boxes
} from 'lucide-react';

const ICON_MAP = {
  ShoppingBag, PenTool, Shirt, Tv, Pill, Utensils, Coffee, Cake,
  Cookie, Smartphone, Hammer, Armchair, BookOpen, Gift, Flower2,
  Footprints, Gem, Dumbbell, Scissors, ScissorsLineDashed, Dog,
  Gamepad2, Trophy, Store, Laptop, Sprout, Car, Boxes
};

export default function GymSettings() {
  const navigate = useNavigate();
  const { lang } = useLanguage();
  const { activeShop, theme, setTheme, selectShopType } = useShop();
  const { mongoShop, setSessionShop, syncBackendProfile } = useAuth();
  const [isSaving, setIsSaving] = useState(false);
  const [typeSearch, setTypeSearch] = useState('');

  const [gymForm, setGymForm] = useState({
    name: mongoShop?.name || activeShop?.name || 'Shopo Gym & Fitness Center',
    business_type: mongoShop?.business_type || 'gym',
    phone: mongoShop?.phone || '',
    address_line1: mongoShop?.address?.line1 || '',
    city: mongoShop?.address?.city || 'Dhaka',
    openingHours: '06:00 AM - 11:00 PM',
    currency: 'BDT (৳)',
  });

  useEffect(() => {
    if (mongoShop) {
      setGymForm(prev => ({
        ...prev,
        name: mongoShop.name || prev.name,
        business_type: mongoShop.business_type || 'gym',
        phone: mongoShop.phone !== undefined ? mongoShop.phone : prev.phone,
        address_line1: mongoShop.address?.line1 !== undefined ? mongoShop.address.line1 : prev.address_line1,
        city: mongoShop.address?.city || prev.city,
      }));
    }
  }, [mongoShop]);

  const filteredTypes = useMemo(() => {
    const q = typeSearch.toLowerCase().trim();
    return SHOP_TYPES.filter(st => {
      const sName = lang === 'bn' && st.nameBn ? st.nameBn : st.name;
      return !q || sName.toLowerCase().includes(q) || st.id.includes(q) || st.category.includes(q);
    });
  }, [typeSearch, lang]);

  const selectedTypeObj = useMemo(() => {
    return SHOP_TYPES.find(st => st.id === gymForm.business_type) || SHOP_TYPES[0];
  }, [gymForm.business_type]);

  const SelectedIcon = ICON_MAP[selectedTypeObj?.iconName] || Dumbbell;

  const handleSave = async (e) => {
    e.preventDefault();
    if (!gymForm.name.trim()) {
      toast.error(lang === 'bn' ? 'দোকানের নাম আবশ্যক।' : 'Business name is required.');
      return;
    }

    setIsSaving(true);
    try {
      const res = await api.shops.update({
        name: gymForm.name.trim(),
        business_type: gymForm.business_type,
        phone: gymForm.phone.trim(),
        address: {
          line1: gymForm.address_line1.trim(),
          city: gymForm.city.trim() || 'Dhaka',
          country: 'Bangladesh',
        },
      });

      const updatedShop = res.data || {
        ...mongoShop,
        name: gymForm.name.trim(),
        business_type: gymForm.business_type,
        phone: gymForm.phone.trim(),
        address: {
          line1: gymForm.address_line1.trim(),
          city: gymForm.city.trim() || 'Dhaka',
          country: 'Bangladesh',
        },
      };

      // 1. Synchronously update session in AuthContext & ShopContext
      setSessionShop(updatedShop);
      selectShopType(gymForm.business_type);
      localStorage.setItem('shopo_business_type', gymForm.business_type);

      // 2. Sync backend profile
      await syncBackendProfile();

      const typeLabel = lang === 'bn' && selectedTypeObj?.nameBn ? selectedTypeObj.nameBn : selectedTypeObj?.name;
      toast.success(
        lang === 'bn'
          ? `ব্যবসার তথ্য ও ধরন (${typeLabel}) সফলভাবে আপডেট হয়েছে!`
          : `Business details & type (${typeLabel}) saved successfully!`,
        { duration: 4000 }
      );

      // 3. Transition to tailored dashboard if changed from gym to retail
      if (gymForm.business_type !== 'gym') {
        navigate('/dashboard', { replace: true });
      }
    } catch (err) {
      toast.error(err.message || 'Failed to update settings in database.');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="max-w-4xl space-y-6 font-sans pb-12">
      
      {/* Header Title */}
      <div>
        <h1 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white tracking-tight">
          {lang === 'bn' ? 'জিম ও ফ্যাসিলিটি সেটিংস' : 'Gym Facility & Workspace Settings'}
        </h1>
        <p className="text-xs sm:text-sm text-slate-500 dark:text-zinc-400 font-normal mt-0.5">
          {lang === 'bn'
            ? 'জিমের নাম, ব্যবসার ক্যাটাগরি, শিফট আওয়ার্স ও থিম পরিবর্তন করুন।'
            : 'Manage appearance, business type category, operating hours, and profile in database.'}
        </p>
      </div>

      {/* THEME PREFERENCES CARD */}
      <Card className="p-6 space-y-5 border-slate-200/90 dark:border-zinc-800/80 dark:bg-[#121215]">
        <div>
          <CardTitle className="text-base sm:text-lg font-bold flex items-center gap-2">
            <Sun className="w-4.5 h-4.5 text-amber-500" />
            <span>{lang === 'bn' ? 'অ্যাপিয়ারেন্স ও থিম মোড' : 'Appearance & Theme Mode'}</span>
          </CardTitle>
          <CardDescription className="mt-1">
            {lang === 'bn'
              ? 'আপনার ইন্টারফেসের জন্য পছন্দের কালার থিম নির্বাচন করুন।'
              : 'Choose your preferred color theme for the Shopo interface.'}
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
                : 'border-slate-200 dark:border-zinc-800 hover:border-slate-300 dark:hover:border-zinc-700 bg-white dark:bg-[#09090b]'
            }`}
          >
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-lg bg-amber-500/10 text-amber-600 flex items-center justify-center font-medium">
                <Sun className="w-4.5 h-4.5" />
              </div>
              <div>
                <div className="font-medium text-sm text-slate-900 dark:text-white">Light Mode</div>
                <div className="text-xs text-slate-500 dark:text-zinc-400 font-normal">Clean, crisp light background</div>
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
                ? 'border-[#00df89] bg-zinc-900 text-white shadow-xs'
                : 'border-slate-200 dark:border-zinc-800 hover:border-slate-300 dark:hover:border-zinc-700 bg-white dark:bg-[#09090b]'
            }`}
          >
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-lg bg-zinc-800 text-zinc-200 flex items-center justify-center font-medium">
                <Moon className="w-4.5 h-4.5" />
              </div>
              <div>
                <div className="font-medium text-sm text-slate-900 dark:text-white">Dark Mode</div>
                <div className="text-xs text-slate-500 dark:text-zinc-400 font-normal">Deep slate, high-contrast surface</div>
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

      {/* GYM DETAILS & BUSINESS TYPE FORM */}
      <form onSubmit={handleSave}>
        <Card className="p-6 space-y-6 border-slate-200/90 dark:border-zinc-800/80 dark:bg-[#121215]">
          <div>
            <CardTitle className="text-base sm:text-lg font-bold flex items-center gap-2">
              <Store className="w-4.5 h-4.5 text-[#00a86b] dark:text-[#00df89]" />
              <span>{lang === 'bn' ? 'ব্যবসার ধরন ও প্রোফাইল' : 'Business Type & Facility Profile'}</span>
            </CardTitle>
            <CardDescription className="mt-1">
              {lang === 'bn'
                ? 'ব্যবসার ধরন পরিবর্তন করলে স্বয়ংক্রিয়ভাবে সেই ধরণের উপযোগী ড্যাশবোর্ড ও ফিচার লোড হবে।'
                : 'Update facility display details, business type category, and operating hours in MongoDB.'}
            </CardDescription>
          </div>

          {/* Current Active Type Badge */}
          <div className="flex items-center gap-3 p-3.5 rounded-xl bg-slate-50 dark:bg-[#09090b] border border-slate-200/80 dark:border-zinc-800/80">
            <div className="w-10 h-10 rounded-xl bg-[#00df89] text-[#011812] flex items-center justify-center font-bold shrink-0">
              <SelectedIcon className="w-5 h-5 stroke-[2.2]" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <span className="text-xs text-slate-400 font-medium uppercase tracking-wider">
                  {lang === 'bn' ? 'বর্তমান ধরন' : 'Active Type'}
                </span>
                <Badge variant="secondary" className="text-[10px] capitalize">
                  {selectedTypeObj?.category || 'Services'}
                </Badge>
              </div>
              <h4 className="text-sm font-semibold text-slate-900 dark:text-white truncate">
                {lang === 'bn' && selectedTypeObj?.nameBn ? selectedTypeObj.nameBn : selectedTypeObj?.name}
              </h4>
            </div>
          </div>

          {/* Business Type Selector Grid */}
          <div className="space-y-2">
            <label className="block text-xs font-medium text-slate-700 dark:text-zinc-300">
              {lang === 'bn' ? 'ব্যবসার ধরন পরিবর্তন করুন (ক্লিক করে নির্বাচন করুন)' : 'Select New Business Type'}
            </label>

            {/* Quick search inside types */}
            <div className="relative mb-2">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder={lang === 'bn' ? 'ধরণ খুঁজুন (যেমন: মুদি, জিম, রেস্তোরাঁ, ফার্মেসি...)' : 'Search type (e.g. Grocery, Gym, Cafe, Pharmacy...)'}
                value={typeSearch}
                onChange={(e) => setTypeSearch(e.target.value)}
                className="w-full pl-8 pr-3 py-1.5 text-xs bg-slate-50 dark:bg-[#09090b] border border-slate-200 dark:border-zinc-800 rounded-lg text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-1 focus:ring-[#00df89]"
              />
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2.5 max-h-56 overflow-y-auto p-1 border border-slate-200 dark:border-zinc-800 rounded-xl bg-slate-50/50 dark:bg-[#09090b]/50">
              {filteredTypes.map((st) => {
                const isSelected = gymForm.business_type === st.id;
                const IconComponent = ICON_MAP[st.iconName] || Store;
                const stName = lang === 'bn' && st.nameBn ? st.nameBn : st.name;

                return (
                  <button
                    key={st.id}
                    type="button"
                    onClick={() => setGymForm(prev => ({ ...prev, business_type: st.id }))}
                    className={`p-2.5 rounded-lg border text-left flex items-center gap-2.5 transition-all cursor-pointer ${
                      isSelected
                        ? 'border-[#00df89] bg-emerald-500/10 dark:bg-emerald-950/30 text-slate-900 dark:text-white font-medium shadow-xs'
                        : 'border-slate-200/80 dark:border-zinc-800/80 hover:border-slate-300 dark:hover:border-zinc-700 bg-white dark:bg-[#121215] text-slate-700 dark:text-zinc-300'
                    }`}
                  >
                    <div className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 ${isSelected ? 'bg-[#00df89] text-[#011812]' : 'bg-slate-100 dark:bg-zinc-800 text-slate-600 dark:text-zinc-400'}`}>
                      <IconComponent className="w-3.5 h-3.5 stroke-[2]" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="text-xs truncate font-medium">{stName}</div>
                    </div>
                    {isSelected && <Check className="w-3.5 h-3.5 text-[#00df89] shrink-0 stroke-[3]" />}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Form Inputs Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
            <div className="space-y-1.5">
              <label className="block text-xs font-medium text-slate-700 dark:text-zinc-300">
                {lang === 'bn' ? 'ব্যবসার নাম *' : 'Facility / Business Name *'}
              </label>
              <div className="relative">
                <Building2 className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <Input
                  type="text"
                  required
                  value={gymForm.name}
                  onChange={(e) => setGymForm({ ...gymForm, name: e.target.value })}
                  className="pl-9"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="block text-xs font-medium text-slate-700 dark:text-zinc-300">
                {lang === 'bn' ? 'মোবাইল নম্বর' : 'Phone Number'}
              </label>
              <div className="relative">
                <Phone className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <Input
                  type="tel"
                  placeholder="01700000000"
                  value={gymForm.phone}
                  onChange={(e) => setGymForm({ ...gymForm, phone: e.target.value })}
                  className="pl-9"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="block text-xs font-medium text-slate-700 dark:text-zinc-300">
                {lang === 'bn' ? 'শহর / জেলা' : 'City / District'}
              </label>
              <div className="relative">
                <MapPin className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <Input
                  type="text"
                  placeholder="Dhaka, Bogura..."
                  value={gymForm.city}
                  onChange={(e) => setGymForm({ ...gymForm, city: e.target.value })}
                  className="pl-9"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="block text-xs font-medium text-slate-700 dark:text-zinc-300">
                {lang === 'bn' ? 'রাস্তা / এরিয়া / ঠিকানা' : 'Address / Area / Street'}
              </label>
              <div className="relative">
                <MapPin className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <Input
                  type="text"
                  placeholder="e.g. House #12, Road #4, Dhanmondi"
                  value={gymForm.address_line1}
                  onChange={(e) => setGymForm({ ...gymForm, address_line1: e.target.value })}
                  className="pl-9"
                />
              </div>
            </div>

            <div className="space-y-1.5 sm:col-span-2">
              <label className="block text-xs font-medium text-slate-700 dark:text-zinc-300">
                {lang === 'bn' ? 'অপারেটিং শিফট' : 'Operating Shift Hours'}
              </label>
              <Input
                type="text"
                value={gymForm.openingHours}
                onChange={(e) => setGymForm({ ...gymForm, openingHours: e.target.value })}
              />
            </div>
          </div>

          <div className="pt-4 flex justify-end border-t border-slate-100 dark:border-zinc-800">
            <Button
              type="submit"
              disabled={isSaving}
              variant="default"
              className="px-6 bg-[#00df89] hover:bg-[#00c97b] text-[#011812] font-semibold text-sm cursor-pointer shadow-sm"
            >
              {isSaving ? (
                <div className="flex items-center gap-2">
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>{lang === 'bn' ? 'সেভ হচ্ছে...' : 'Saving Changes...'}</span>
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <Save className="w-4 h-4" />
                  <span>{lang === 'bn' ? 'সেটিংস আপডেট করুন' : 'Save Changes'}</span>
                </div>
              )}
            </Button>
          </div>
        </Card>
      </form>

    </div>
  );
}
