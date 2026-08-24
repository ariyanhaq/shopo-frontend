/**
 * @file BusinessCategory.jsx
 * @description 2-Step Onboarding experience for /onboarding/business-data:
 *   Step 1: Select Shop Type / Business Category
 *   Step 2: Enter Shop Name & Details
 * Persists user and shop data in MongoDB Atlas with zero duplicates and redirects directly to dashboard.
 */
import { useState, useMemo, useEffect } from 'react';
import { useNavigate, Navigate, Link } from 'react-router-dom';
import { useShop } from '@/context/ShopContext';
import { useLanguage } from '@/context/LanguageContext';
import { useAuth } from '@/context/AuthContext';
import { SHOP_TYPES } from '@/data/shopTypesData';
import api from '@/services/api';
import toast from 'react-hot-toast';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import {
  Store, Search, Check, ArrowRight, ArrowLeft,
  ShoppingBag, PenTool, Shirt, Tv, Pill, Utensils, Coffee, Cake,
  Cookie, Smartphone, Hammer, Armchair, BookOpen, Gift, Flower2,
  Footprints, Gem, Dumbbell, Scissors, ScissorsLineDashed, Dog,
  Gamepad2, Trophy, Laptop, Sprout, Car, Boxes, X,
  LogOut, Building2, Phone, MapPin, Loader2
} from 'lucide-react';

const ICON_MAP = {
  ShoppingBag, PenTool, Shirt, Tv, Pill, Utensils, Coffee, Cake,
  Cookie, Smartphone, Hammer, Armchair, BookOpen, Gift, Flower2,
  Footprints, Gem, Dumbbell, Scissors, ScissorsLineDashed, Dog,
  Gamepad2, Trophy, Store, Laptop, Sprout, Car, Boxes
};

export default function BusinessCategory() {
  const navigate = useNavigate();
  const { lang, setLang } = useLanguage();
  const { selectedShopId, selectShopType } = useShop();
  const { currentUser, mongoUser, mongoShop, hasShop, setSessionShop, syncBackendProfile, logout } = useAuth();

  // Onboarding Step: 1 = Select Category, 2 = Enter Shop Name
  const [currentStep, setCurrentStep] = useState(1);

  const [selectedId, setSelectedId] = useState(selectedShopId || 'stationery');
  const [shopName, setShopName] = useState('');
  const [shopPhone, setShopPhone] = useState('');
  const [shopCity, setShopCity] = useState('Dhaka');

  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  const isGym = (mongoShop?.business_type || localStorage.getItem('shopo_business_type')) === 'gym';
  const isRestaurant = (mongoShop?.business_type || localStorage.getItem('shopo_business_type')) === 'restaurant';
  const dashboardTarget = isGym ? '/gym/dashboard' : isRestaurant ? '/restaurant/dashboard' : '/dashboard';

  // If user already has a shop in DB, strictly prevent accessing onboarding and redirect to dashboard
  useEffect(() => {
    if (hasShop) {
      navigate(dashboardTarget, { replace: true });
    }
  }, [hasShop, dashboardTarget, navigate]);

  if (hasShop) {
    return <Navigate to={dashboardTarget} replace />;
  }

  const filteredShops = useMemo(() => {
    const q = searchQuery.toLowerCase().trim();
    return SHOP_TYPES.filter(shop => {
      const sName = lang === 'bn' && shop.nameBn ? shop.nameBn : shop.name;
      const sDesc = lang === 'bn' && shop.descriptionBn ? shop.descriptionBn : shop.description;
      
      return (
        !q ||
        sName.toLowerCase().includes(q) ||
        sDesc.toLowerCase().includes(q) ||
        shop.features.some(f => f.toLowerCase().includes(q))
      );
    });
  }, [searchQuery, lang]);

  const selectedShop = useMemo(() => {
    return SHOP_TYPES.find(s => s.id === selectedId);
  }, [selectedId]);

  // Set suggested shop name when moving to Step 2
  const handleProceedToStep2 = () => {
    if (!selectedId) return;
    if (!shopName.trim()) {
      const userName = currentUser?.displayName ? `${currentUser.displayName}'s ` : '';
      const categoryTitle = selectedShop?.name || 'Store';
      setShopName(`${userName}${categoryTitle}`);
    }
    selectShopType(selectedId);
    setCurrentStep(2);
  };

  // Final Step 2 submission: persist to MongoDB Atlas and launch dashboard
  const handleCompleteSetup = async (e) => {
    if (e) e.preventDefault();
    if (!shopName.trim()) {
      setErrorMessage(lang === 'bn' ? 'দোকানের নাম আবশ্যক।' : 'Shop name is required.');
      return;
    }

    setIsLoading(true);
    setErrorMessage('');

    try {
      // 1. Create/Update Shop in MongoDB Atlas & link user.shop_id in DB
      const res = await api.shops.create({
        name: shopName.trim(),
        business_type: selectedId,
        phone: shopPhone.trim() || undefined,
        address: {
          city: shopCity.trim() || 'Dhaka',
          country: 'Bangladesh',
        },
        settings: {
          language: lang,
          currency: 'BDT',
        },
      });

      const shop = res.data?.shop || res.data;
      const user = res.data?.user || null;

      // 2. Set synchronous session shop in AuthContext
      setSessionShop(shop, user);
      selectShopType(selectedId);

      // 3. Show react-hot-toast confirmation
      toast.success(
        lang === 'bn'
          ? `"${shop?.name || shopName}" দোকান সফলভাবে তৈরি হয়েছে!`
          : `Shop "${shop?.name || shopName}" saved to database successfully!`,
        {
          duration: 4500,
        }
      );

      // 4. Sync backend profile to update all contexts
      await syncBackendProfile();

      // 5. Navigate directly to dashboard
      const target = (selectedId === 'gym' || shop?.business_type === 'gym')
        ? '/gym/dashboard'
        : (selectedId === 'restaurant' || shop?.business_type === 'restaurant')
        ? '/restaurant/dashboard'
        : '/dashboard';
      navigate(target, { replace: true });
    } catch (err) {
      console.error('Error creating shop on backend:', err);
      toast.error(
        err.message || (lang === 'bn' ? 'দোকানের ডাটা সেভ করা যায়নি।' : 'Failed to save shop to database.')
      );
      setErrorMessage(err.message || 'Failed to save shop to database. Please check your network connection.');
    } finally {
      setIsLoading(false);
    }
  };

  const SelectedIcon = selectedShop ? (ICON_MAP[selectedShop.iconName] || Store) : Store;

  return (
    <div className="min-h-screen bg-[#F8FAFC] dark:bg-[#0B0F17] text-slate-900 dark:text-slate-100 flex flex-col font-sans transition-colors duration-200 relative overflow-x-hidden">
      
      {/* TOP HEADER NAVBAR */}
      <header className="relative z-30 border-b border-slate-200/90 dark:border-slate-800 bg-white/90 dark:bg-[#0B0F17]/90 backdrop-blur-md sticky top-0">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 h-14 flex items-center justify-between">
          
          {/* Logo Brand */}
          <Link to="/" className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-[#00df89] text-[#011812] flex items-center justify-center font-bold shadow-xs">
              <Store className="w-4 h-4 stroke-[2.2]" />
            </div>
            <span className="font-semibold text-xl text-slate-900 dark:text-white tracking-tight">
              Shopo<span className="text-[#00df89]">.</span>
            </span>
          </Link>

          {/* Clean Step Indicator (No Dots) */}
          <div className="flex items-center gap-2 text-xs font-medium">
            <span className={currentStep === 1 ? 'text-slate-900 dark:text-white font-semibold' : 'text-slate-400 dark:text-slate-500'}>
              1. {lang === 'bn' ? 'ব্যবসায়ের ধরন' : 'Business Type'}
            </span>
            <span className="text-slate-300 dark:text-slate-700 font-normal">/</span>
            <span className={currentStep === 2 ? 'text-slate-900 dark:text-white font-semibold' : 'text-slate-400 dark:text-slate-500'}>
              2. {lang === 'bn' ? 'দোকানের নাম' : 'Shop Name'}
            </span>
          </div>

          {/* Right Controls: Language & User Profile */}
          <div className="flex items-center gap-3">
            {/* Language Segmented Control */}
            <div className="inline-flex p-0.5 rounded-lg bg-slate-100 dark:bg-slate-800/80 border border-slate-200/80 dark:border-slate-700/80">
              <button
                type="button"
                onClick={() => setLang('en')}
                className={`px-2.5 py-1 text-xs font-medium rounded-md transition-all ${
                  lang === 'en'
                    ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-xs'
                    : 'text-slate-500 hover:text-slate-800 dark:text-slate-400'
                }`}
              >
                EN
              </button>
              <button
                type="button"
                onClick={() => setLang('bn')}
                className={`px-2.5 py-1 text-xs font-medium rounded-md transition-all ${
                  lang === 'bn'
                    ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-xs'
                    : 'text-slate-500 hover:text-slate-800 dark:text-slate-400'
                }`}
              >
                বাংলা
              </button>
            </div>

            {/* Logout button */}
            {currentUser && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => logout()}
                className="h-8 px-2.5 text-xs text-slate-600 dark:text-slate-400 hover:text-rose-600 gap-1.5"
                title={lang === 'bn' ? 'লগ আউট' : 'Log out'}
              >
                <LogOut className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">{lang === 'bn' ? 'লগ আউট' : 'Logout'}</span>
              </Button>
            )}
          </div>

        </div>
      </header>

      {/* ========================================================================= */}
      {/* STEP 1: SELECT BUSINESS CATEGORY                                          */}
      {/* ========================================================================= */}
      {currentStep === 1 && (
        <main className="flex-1 max-w-6xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-10">
          
          {/* Hero Heading */}
          <div className="text-center max-w-2xl mx-auto space-y-2 mb-8">
            <h1 className="text-2xl sm:text-3xl font-medium tracking-tight text-slate-900 dark:text-white">
              {lang === 'bn' ? 'আপনার ব্যবসার ধরণ নির্বাচন করুন' : 'Select your business type'}
            </h1>
            <p className="text-sm text-slate-500 dark:text-slate-400 font-normal">
              {lang === 'bn' 
                ? 'Shopo আপনার ব্যবসার সাথে মানানসই ফিচার ও ড্যাশবোর্ড প্রস্তুত করবে।' 
                : 'Shopo will tailor your POS, inventory categories, and reports specifically for this store.'}
            </p>
          </div>

          {/* Search Bar */}
          <div className="max-w-md mx-auto mb-8 relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <Input
              type="text"
              placeholder={lang === 'bn' ? 'ব্যবসা খুঁজুন (যেমন: মুদি দোকান, কাপড়ের দোকান...)' : 'Search business type (e.g. Grocery, Clothing, Cafe...)'}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 pr-10 py-2 h-10 text-sm bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 rounded-xl"
            />
            {searchQuery && (
              <button 
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>

          {/* SHADCN CARDS RESPONSIVE GRID */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 mb-24 sm:mb-32">
            {filteredShops.map((shop) => {
              const isSelected = selectedId === shop.id;
              const IconComponent = ICON_MAP[shop.iconName] || Store;
              const sName = lang === 'bn' && shop.nameBn ? shop.nameBn : shop.name;
              const sDesc = lang === 'bn' && shop.descriptionBn ? shop.descriptionBn : shop.description;
              const sFeatures = lang === 'bn' && shop.featuresBn ? shop.featuresBn : shop.features;

              return (
                <Card
                  key={shop.id}
                  onClick={() => setSelectedId(shop.id)}
                  className={`p-4 cursor-pointer transition-all duration-150 flex flex-col justify-between select-none rounded-xl ${
                    isSelected
                      ? 'border-2 border-[#00df89] bg-emerald-50/20 dark:bg-emerald-950/20 shadow-sm'
                      : 'hover:border-slate-300 dark:hover:border-slate-700'
                  }`}
                >
                  <div>
                    {/* Top Row: Icon & Selected Circle */}
                    <div className="flex items-center justify-between mb-3">
                      <div
                        className={`w-9 h-9 rounded-xl flex items-center justify-center transition-colors ${
                          isSelected
                            ? 'bg-[#00df89] text-[#011812]'
                            : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300'
                        }`}
                      >
                        <IconComponent className="w-4 h-4 stroke-[2.2]" />
                      </div>

                      <div
                        className={`w-5 h-5 rounded-full flex items-center justify-center transition-colors ${
                          isSelected
                            ? 'bg-[#00df89] text-[#011812]'
                            : 'border border-slate-300 dark:border-slate-700'
                        }`}
                      >
                        {isSelected && <Check className="w-3 h-3 stroke-[3]" />}
                      </div>
                    </div>

                    {/* Title & Description */}
                    <div className="space-y-1 mb-3">
                      <h3 className="font-medium text-sm text-slate-900 dark:text-white">
                        {sName}
                      </h3>
                      <p className="text-xs text-slate-500 dark:text-slate-400 font-normal line-clamp-2 leading-relaxed">
                        {sDesc}
                      </p>
                    </div>
                  </div>

                  {/* Features Badges */}
                  <div className="pt-2 border-t border-slate-100 dark:border-slate-800 flex flex-wrap gap-1">
                    {sFeatures.slice(0, 2).map((feat, fIdx) => (
                      <Badge key={fIdx} variant="secondary" className="text-[10px] font-normal">
                        {feat}
                      </Badge>
                    ))}
                  </div>
                </Card>
              );
            })}
          </div>

          {filteredShops.length === 0 && (
            <div className="text-center py-12 text-xs font-medium text-slate-500">
              {lang === 'bn' ? `"${searchQuery}" এর সাথে কোনো ধরণ মেলেনি।` : `No business types match "${searchQuery}".`}
            </div>
          )}

          {/* STICKY BOTTOM BAR FOR STEP 1 */}
          <div className="fixed bottom-0 left-0 right-0 z-30 bg-white/95 dark:bg-[#0B0F17]/95 backdrop-blur-md border-t border-slate-200/90 dark:border-slate-800 py-3 px-4 sm:px-8">
            <div className="max-w-6xl mx-auto flex items-center justify-between gap-4">
              
              <div className="text-xs font-medium text-slate-600 dark:text-slate-300">
                {lang === 'bn' ? 'নির্বাচিত: ' : 'Selected: '} 
                <span className="font-medium text-slate-900 dark:text-white">
                  {selectedShop ? (lang === 'bn' && selectedShop.nameBn ? selectedShop.nameBn : selectedShop.name) : (lang === 'bn' ? 'কোনোটি নয়' : 'None')}
                </span>
              </div>

              <Button
                variant="default"
                onClick={handleProceedToStep2}
                disabled={!selectedId}
                className="px-6 bg-[#00df89] hover:bg-[#00c97b] text-[#011812] font-semibold text-sm shadow-sm"
              >
                <span>{lang === 'bn' ? 'পরবর্তী' : 'Next'}</span>
                <ArrowRight className="w-4 h-4 ml-1.5" />
              </Button>

            </div>
          </div>

        </main>
      )}

      {/* ========================================================================= */}
      {/* STEP 2: ENTER SHOP NAME & DETAILS                                         */}
      {/* ========================================================================= */}
      {currentStep === 2 && (
        <main className="flex-1 max-w-xl w-full mx-auto px-4 py-12 flex flex-col justify-center">
          
          <Card className="p-6 sm:p-8 bg-white dark:bg-[#121215] border border-slate-200/90 dark:border-slate-800 shadow-sm rounded-2xl">
            
            {/* Header with selected category pill */}
            <div className="mb-6">
              <button
                type="button"
                onClick={() => setCurrentStep(1)}
                className="inline-flex items-center gap-1.5 text-xs text-slate-500 hover:text-slate-900 dark:hover:text-white mb-4 transition-colors font-medium"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>{lang === 'bn' ? 'ব্যবসায়ের ধরন পরিবর্তন করুন' : 'Change business type'}</span>
              </button>

              <div className="flex items-center gap-3 p-3 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-100 dark:border-slate-800 mb-5">
                <div className="w-10 h-10 rounded-lg bg-[#00df89] text-[#011812] flex items-center justify-center font-bold">
                  <SelectedIcon className="w-5 h-5 stroke-[2.2]" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-slate-400 font-medium uppercase tracking-wider">
                      {lang === 'bn' ? 'নির্বাচিত ধরন' : 'Selected Category'}
                    </span>
                    <Badge variant="secondary" className="text-[10px]">
                      {selectedShop?.category || 'Retail'}
                    </Badge>
                  </div>
                  <h4 className="text-sm font-semibold text-slate-900 dark:text-white truncate">
                    {lang === 'bn' && selectedShop?.nameBn ? selectedShop.nameBn : selectedShop?.name}
                  </h4>
                </div>
              </div>

              <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
                {lang === 'bn' ? 'আপনার দোকানের নাম কী?' : 'What is your Shop Name?'}
              </h2>
              <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
                {lang === 'bn'
                  ? 'এই নামটি আপনার ক্যাশ মেমো, ইনভয়েস এবং ড্যাশবোর্ডে প্রদর্শিত হবে।'
                  : 'This name will be displayed on receipts, invoices, and your shop dashboard.'}
              </p>
            </div>

            {/* Error banner */}
            {errorMessage && (
              <div className="p-3 mb-5 rounded-lg bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 text-rose-600 dark:text-rose-400 text-xs font-medium">
                {errorMessage}
              </div>
            )}

            {/* Setup Form */}
            <form onSubmit={handleCompleteSetup} className="space-y-4">
              
              {/* Shop Name */}
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-slate-700 dark:text-slate-300 flex items-center justify-between">
                  <span>{lang === 'bn' ? 'দোকানের নাম' : 'Shop / Business Name'} *</span>
                </label>
                <div className="relative">
                  <Building2 className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <Input
                    type="text"
                    required
                    placeholder={lang === 'bn' ? 'যেমন: আরিয়ান সুপার স্টোর' : 'e.g. Ariyan Super Store'}
                    value={shopName}
                    onChange={(e) => setShopName(e.target.value)}
                    className="pl-10 h-11 text-sm bg-slate-50/50 dark:bg-slate-900 border-slate-200 dark:border-slate-800 focus:bg-white"
                    autoFocus
                  />
                </div>
              </div>

              {/* Optional Phone */}
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-slate-700 dark:text-slate-300">
                  {lang === 'bn' ? 'দোকানের মোবাইল নম্বর (ঐচ্ছিক)' : 'Shop Phone Number (Optional)'}
                </label>
                <div className="relative">
                  <Phone className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <Input
                    type="tel"
                    placeholder="01700000000"
                    value={shopPhone}
                    onChange={(e) => setShopPhone(e.target.value)}
                    className="pl-10 h-11 text-sm bg-slate-50/50 dark:bg-slate-900 border-slate-200 dark:border-slate-800 focus:bg-white"
                  />
                </div>
              </div>

              {/* City / Location */}
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-slate-700 dark:text-slate-300">
                  {lang === 'bn' ? 'শহর / জেলা' : 'City / Location'}
                </label>
                <div className="relative">
                  <MapPin className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <Input
                    type="text"
                    placeholder={lang === 'bn' ? 'যেমন: ঢাকা, বগুড়া, চট্টগ্রাম' : 'e.g. Dhaka, Bogura, Chattogram'}
                    value={shopCity}
                    onChange={(e) => setShopCity(e.target.value)}
                    className="pl-10 h-11 text-sm bg-slate-50/50 dark:bg-slate-900 border-slate-200 dark:border-slate-800 focus:bg-white"
                  />
                </div>
              </div>

              {/* Submit CTA */}
              <div className="pt-4 space-y-2">
                <Button
                  type="submit"
                  disabled={isLoading || !shopName.trim()}
                  className="w-full h-11 bg-[#00df89] hover:bg-[#00c97b] text-[#011812] font-semibold text-sm shadow-sm cursor-pointer"
                >
                  {isLoading ? (
                    <div className="flex items-center gap-2">
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>{lang === 'bn' ? 'দোকানের ডাটা সেভ হচ্ছে...' : 'Saving Shop to Database...'}</span>
                    </div>
                  ) : (
                    <div className="flex items-center justify-center gap-2">
                      <span>{lang === 'bn' ? 'সেটআপ সম্পন্ন করুন ও ড্যাশবোর্ডে যান' : 'Complete Setup & Launch Dashboard'}</span>
                      <ArrowRight className="w-4 h-4" />
                    </div>
                  )}
                </Button>

                <p className="text-center text-[11px] text-slate-400">
                  {lang === 'bn' ? 'পরবর্তীতে সেটিংস থেকে নাম পরিবর্তন করতে পারবেন।' : 'You can customize your shop settings anytime later.'}
                </p>
              </div>

            </form>

          </Card>

        </main>
      )}

    </div>
  );
}
