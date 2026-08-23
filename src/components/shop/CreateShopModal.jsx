/**
 * @file CreateShopModal.jsx
 * @description In-app interactive modal allowing users to create a new shop tenant, select business type, and immediately switch active workspaces.
 */
import { useState } from 'react';
import { useLanguage } from '@/context/LanguageContext';
import { useAuth } from '@/context/AuthContext';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useBodyScrollLock } from '@/hooks/useBodyScrollLock';
import {
  Store, ShoppingBag, Shirt, Tv, Pill, Utensils,
  Dumbbell, PenTool, X, Loader2, Check, ArrowRight,
  Sparkles, Building2, Phone, MapPin
} from 'lucide-react';

const POPULAR_SHOP_TYPES = [
  {
    id: 'grocery',
    nameEn: 'Grocery Store / Super Shop',
    nameBn: 'মুদি দোকান ও সুপার শপ',
    icon: ShoppingBag,
    color: 'bg-emerald-500/10 text-[#00a86b] dark:text-[#00df89] border-emerald-500/30',
  },
  {
    id: 'clothing',
    nameEn: 'Clothing & Fashion Store',
    nameBn: 'পোশাক ও ফ্যাশন শপ',
    icon: Shirt,
    color: 'bg-pink-500/10 text-pink-600 border-pink-500/30',
  },
  {
    id: 'pharmacy',
    nameEn: 'Pharmacy & Healthcare',
    nameBn: 'ফার্মেসি ও ঔষধের দোকান',
    icon: Pill,
    color: 'bg-cyan-500/10 text-cyan-600 border-cyan-500/30',
  },
  {
    id: 'restaurant',
    nameEn: 'Restaurant & Cafe',
    nameBn: 'রেস্টুরেন্ট ও ক্যাফে',
    icon: Utensils,
    color: 'bg-amber-500/10 text-amber-600 border-amber-500/30',
  },
  {
    id: 'gym',
    nameEn: 'Gym & Fitness Center',
    nameBn: 'জিম ও ফিটনেস সেন্টার',
    icon: Dumbbell,
    color: 'bg-orange-500/10 text-orange-600 border-orange-500/30',
  },
  {
    id: 'electronics',
    nameEn: 'Electronics & Gadgets',
    nameBn: 'ইলেকট্রনিক্স ও গ্যাজেট',
    icon: Tv,
    color: 'bg-purple-500/10 text-purple-600 border-purple-500/30',
  },
  {
    id: 'stationery',
    nameEn: 'Stationery & Books',
    nameBn: 'স্টেশনরি ও বইয়ের দোকান',
    icon: PenTool,
    color: 'bg-blue-500/10 text-blue-600 border-blue-500/30',
  },
  {
    id: 'general',
    nameEn: 'General Retail Store',
    nameBn: 'সাধারণ খুচরা ব্যবসা',
    icon: Store,
    color: 'bg-slate-500/10 text-slate-700 dark:text-zinc-300 border-slate-500/30',
  },
];

export default function CreateShopModal({ isOpen, onClose }) {
  const { lang } = useLanguage();
  const { createNewShop, currentUser } = useAuth();
  const navigate = useNavigate();

  useBodyScrollLock(isOpen);

  const [selectedType, setSelectedType] = useState('grocery');
  const [shopName, setShopName] = useState('');
  const [phone, setPhone] = useState(currentUser?.phoneNumber || '');
  const [city, setCity] = useState('Dhaka');
  const [address, setAddress] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!shopName.trim()) {
      toast.error(lang === 'bn' ? 'দোকানের নাম লিখুন।' : 'Please enter your shop name.');
      return;
    }

    setIsSubmitting(true);
    try {
      const createdShop = await createNewShop({
        name: shopName.trim(),
        business_type: selectedType,
        phone: phone.trim(),
        address: {
          line1: address.trim(),
          city: city.trim(),
          country: 'Bangladesh',
        },
        settings: {
          currency: 'BDT',
          language: lang,
        },
      });

      toast.success(
        lang === 'bn'
          ? `'${shopName}' দোকান সফলভাবে তৈরি হয়েছে এবং চালু করা হয়েছে!`
          : `Shop '${shopName}' created and activated successfully!`
      );

      onClose();

      // Navigate to corresponding dashboard
      if (selectedType === 'gym') {
        navigate('/gym/dashboard');
      } else {
        navigate('/dashboard');
      }
    } catch (err) {
      toast.error(err.message || 'Failed to create new shop.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs">
      <Card className="max-w-xl w-full p-6 bg-white dark:bg-[#121215] border-slate-200 dark:border-zinc-800 space-y-4 shadow-2xl max-h-[90vh] overflow-y-auto font-sans">
        
        {/* Modal Header */}
        <div className="flex items-center justify-between border-b border-slate-100 dark:border-zinc-800 pb-3">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-[#00df89] text-[#011812] flex items-center justify-center font-bold">
              <Store className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900 dark:text-white">
                {lang === 'bn' ? 'নতুন দোকান তৈরি করুন' : 'Create New Shop / Branch'}
              </h2>
              <p className="text-xs text-slate-500 dark:text-zinc-400">
                {lang === 'bn'
                  ? 'আপনার নতুন ব্যবসার ধরণ ও তথ্য দিন'
                  : 'Set up a new business workspace to switch between your shops anytime.'}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 dark:hover:text-white p-1 rounded-lg cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 text-xs">
          
          {/* Business Type Selector */}
          <div>
            <label className="block font-semibold mb-2 text-slate-700 dark:text-zinc-300">
              {lang === 'bn' ? '১. ব্যবসার ধরণ নির্বাচন করুন *' : '1. Select Business / Shop Type *'}
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {POPULAR_SHOP_TYPES.map((type) => {
                const Icon = type.icon;
                const isSelected = selectedType === type.id;
                return (
                  <button
                    key={type.id}
                    type="button"
                    onClick={() => setSelectedType(type.id)}
                    className={`p-2.5 rounded-xl border text-left flex flex-col justify-between transition-all cursor-pointer relative ${
                      isSelected
                        ? 'border-[#00df89] bg-[#00df89]/10 ring-2 ring-[#00df89]/30'
                        : 'border-slate-200 dark:border-zinc-800 hover:border-slate-300 dark:hover:border-zinc-700 bg-slate-50/50 dark:bg-zinc-900/40'
                    }`}
                  >
                    {isSelected && (
                      <div className="absolute top-1.5 right-1.5 w-4 h-4 rounded-full bg-[#00df89] text-[#011812] flex items-center justify-center text-[10px]">
                        <Check className="w-3 h-3 stroke-[3]" />
                      </div>
                    )}
                    <div className={`w-7 h-7 rounded-lg flex items-center justify-center mb-2 ${type.color}`}>
                      <Icon className="w-3.5 h-3.5" />
                    </div>
                    <div className="font-bold text-[11px] text-slate-900 dark:text-white line-clamp-1">
                      {lang === 'bn' ? type.nameBn : type.nameEn}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Shop Details */}
          <div className="space-y-3 pt-2">
            <label className="block font-semibold text-slate-700 dark:text-zinc-300">
              {lang === 'bn' ? '২. দোকানের নাম ও তথ্য *' : '2. Shop Name & Details *'}
            </label>

            <div>
              <label className="block text-slate-600 dark:text-zinc-400 mb-1 text-[11px]">
                {lang === 'bn' ? 'দোকানের নাম *' : 'Shop / Store Name *'}
              </label>
              <input
                type="text"
                required
                placeholder={lang === 'bn' ? 'যেমন: গ্রীন মার্ট ধানমন্ডি' : 'e.g. Green Mart Dhanmondi, FitPro Gym'}
                value={shopName}
                onChange={(e) => setShopName(e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-[#09090b] border border-slate-200 dark:border-zinc-800 text-xs text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-[#00df89]"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-slate-600 dark:text-zinc-400 mb-1 text-[11px]">
                  {lang === 'bn' ? 'মোবাইল নম্বর' : 'Phone Number'}
                </label>
                <input
                  type="tel"
                  placeholder="01800-000000"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-[#09090b] border border-slate-200 dark:border-zinc-800 text-xs text-slate-900 dark:text-white outline-none font-mono"
                />
              </div>

              <div>
                <label className="block text-slate-600 dark:text-zinc-400 mb-1 text-[11px]">
                  {lang === 'bn' ? 'শহর / জেলা' : 'City / District'}
                </label>
                <input
                  type="text"
                  placeholder="Dhaka, Chittagong, Sylhet..."
                  value={city}
                  onChange={(e) => setCity(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-[#09090b] border border-slate-200 dark:border-zinc-800 text-xs text-slate-900 dark:text-white outline-none"
                />
              </div>
            </div>

            <div>
              <label className="block text-slate-600 dark:text-zinc-400 mb-1 text-[11px]">
                {lang === 'bn' ? 'ঠিকানা / ব্রাঞ্চ লোকেশন' : 'Address / Branch Location (Optional)'}
              </label>
              <input
                type="text"
                placeholder={lang === 'bn' ? 'যেমন: রোড #৭, ধানমন্ডি' : 'e.g. Road #7, Dhanmondi'}
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-[#09090b] border border-slate-200 dark:border-zinc-800 text-xs text-slate-900 dark:text-white outline-none"
              />
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex justify-end gap-2 pt-3 border-t border-slate-100 dark:border-zinc-800">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={onClose}
              className="cursor-pointer"
            >
              {lang === 'bn' ? 'বাতিল' : 'Cancel'}
            </Button>
            <Button
              type="submit"
              disabled={isSubmitting}
              size="sm"
              className="bg-[#00df89] hover:bg-[#00c97b] text-[#011812] font-semibold gap-1.5 cursor-pointer"
            >
              {isSubmitting ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <>
                  <span>{lang === 'bn' ? 'দোকান তৈরি করুন' : 'Create & Launch Shop'}</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </>
              )}
            </Button>
          </div>
        </form>
      </Card>
    </div>
  );
}
