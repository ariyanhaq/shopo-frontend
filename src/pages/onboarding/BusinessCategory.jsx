/**
 * @file BusinessCategory.jsx
 * @description Onboarding shop type selection page featuring segmented language switcher (EN | বাংলা), scrollable grid & comfortable layout gaps.
 */
import { useState, useMemo, useRef } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useShop } from '@/context/ShopContext';
import { useLanguage } from '@/context/LanguageContext';
import { SHOP_TYPES, SHOP_CATEGORIES } from '@/data/shopTypesData';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import {
  Store, Search, Check, ArrowRight, CheckCircle2,
  ShoppingBag, PenTool, Shirt, Tv, Pill, Utensils, Coffee, Cake,
  Cookie, Smartphone, Hammer, Armchair, BookOpen, Gift, Flower2,
  Footprints, Gem, Dumbbell, Scissors, ScissorsLineDashed, Dog,
  Gamepad2, Trophy, Laptop, Sprout, Car, Boxes, Sun, Moon, X,
  ChevronLeft, ChevronRight, Sparkles
} from 'lucide-react';

const ICON_MAP = {
  ShoppingBag, PenTool, Shirt, Tv, Pill, Utensils, Coffee, Cake,
  Cookie, Sparkles, Smartphone, Hammer, Armchair, BookOpen, Gift, Flower2,
  Footprints, Gem, Dumbbell, Scissors, ScissorsLineDashed, Dog,
  Gamepad2, Trophy, Store, Laptop, Sprout, Car, Boxes
};

export default function BusinessCategory() {
  const navigate = useNavigate();
  const { lang, setLang } = useLanguage();
  const { selectedShopId, selectShopType, theme, toggleTheme } = useShop();

  const [selectedId, setSelectedId] = useState(selectedShopId || 'grocery');
  const [searchQuery, setSearchQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState('all');
  const [isLoading, setIsLoading] = useState(false);

  const categoriesRef = useRef(null);

  const handleScrollCategories = (direction) => {
    if (categoriesRef.current) {
      const distance = direction === 'left' ? -220 : 220;
      categoriesRef.current.scrollBy({ left: distance, behavior: 'smooth' });
    }
  };

  const filteredShops = useMemo(() => {
    return SHOP_TYPES.filter(shop => {
      const matchesCategory = activeCategory === 'all' || shop.category === activeCategory;
      const q = searchQuery.toLowerCase().trim();
      const shopName = lang === 'bn' && shop.nameBn ? shop.nameBn : shop.name;
      const shopDesc = lang === 'bn' && shop.descriptionBn ? shop.descriptionBn : shop.description;
      
      const matchesSearch =
        !q ||
        shopName.toLowerCase().includes(q) ||
        shopDesc.toLowerCase().includes(q) ||
        shop.features.some(f => f.toLowerCase().includes(q));
      return matchesCategory && matchesSearch;
    });
  }, [searchQuery, activeCategory, lang]);

  const selectedShop = useMemo(() => {
    return SHOP_TYPES.find(s => s.id === selectedId);
  }, [selectedId]);

  const handleContinue = (e) => {
    e.preventDefault();
    if (!selectedId) return;

    setIsLoading(true);
    selectShopType(selectedId);

    setTimeout(() => {
      navigate('/dashboard');
    }, 500);
  };

  return (
    <div className="h-screen bg-[#F8FAFC] dark:bg-[#0B0F17] text-slate-900 dark:text-slate-100 flex flex-col font-sans transition-colors duration-200 overflow-hidden relative">
      
      {/* TOP HEADER NAVBAR (FIXED AT TOP) */}
      <header className="relative z-30 border-b border-slate-200/90 dark:border-slate-800 bg-white/90 dark:bg-[#0B0F17]/90 backdrop-blur-md shrink-0">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          
          {/* Logo Brand */}
          <Link to="/" className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-[#00df89] text-[#011812] flex items-center justify-center font-bold shadow-xs">
              <Store className="w-4 h-4 stroke-[2.2]" />
            </div>
            <span className="font-semibold text-xl text-slate-900 dark:text-white tracking-tight">
              Shopo<span className="text-[#00df89]">.</span>
            </span>
          </Link>

          {/* Step Indicator */}
          <div className="hidden sm:flex items-center gap-2 text-xs font-medium text-slate-500 dark:text-slate-400">
            <span className="w-2 h-2 rounded-full bg-[#00df89]" />
            <span>
              {lang === 'bn' ? 'ধাপ ১ / ২ — পার্সোনালাইজেশন' : 'Step 1 of 2 — Personalization'}
            </span>
          </div>

          {/* Right Controls */}
          <div className="flex items-center gap-2 sm:gap-3">
            
            {/* SEGMENTED LANGUAGE TOGGLE SWITCH (EN | বাংলা) */}
            <div className="bg-slate-100 dark:bg-slate-800/80 p-0.5 sm:p-1 rounded-full flex items-center gap-0.5 border border-slate-200/80 dark:border-slate-700/80">
              <button
                onClick={() => setLang('en')}
                className={`px-3 py-1 rounded-full text-xs transition-all duration-150 cursor-pointer select-none ${
                  lang === 'en'
                    ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-xs font-medium'
                    : 'text-slate-500 hover:text-slate-900 dark:text-slate-400 font-normal'
                }`}
              >
                EN
              </button>
              <button
                onClick={() => setLang('bn')}
                className={`px-3 py-1 rounded-full text-xs transition-all duration-150 cursor-pointer select-none ${
                  lang === 'bn'
                    ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-xs font-medium'
                    : 'text-slate-500 hover:text-slate-900 dark:text-slate-400 font-normal'
                }`}
              >
                বাংলা
              </button>
            </div>

            {/* Theme Toggle */}
            <button
              onClick={toggleTheme}
              className="w-8 h-8 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 flex items-center justify-center transition-colors border border-slate-200/60 dark:border-slate-700/60"
              title="Toggle Light/Dark Theme"
            >
              {theme === 'dark' ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-slate-700" />}
            </button>

          </div>
        </div>
      </header>

      {/* MAIN CONTENT AREA (VERTICALLY SCROLLABLE WITH NO SCROLLBAR VISIBLE) */}
      <main className="flex-1 overflow-y-auto no-scrollbar w-full">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-10 pb-40 space-y-8">
          
          {/* HERO SECTION */}
          <div className="max-w-2xl mx-auto text-center space-y-2">
            <h1 className="text-2xl sm:text-3xl lg:text-4xl font-semibold text-slate-900 dark:text-white tracking-tight">
              {lang === 'bn' ? 'Shopo-তে স্বাগতম 👋' : 'Welcome to Shopo 👋'}
            </h1>
            <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 font-normal">
              {lang === 'bn'
                ? 'আপনার ব্যবসায়ের ধরন বেছে নিন যাতে আমরা আপনার জন্য উপযুক্ত ড্যাশবোর্ড তৈরি করতে পারি।'
                : 'Choose the type of business you manage so we can create the perfect dashboard for you.'}
            </p>
          </div>

          {/* SEARCH & CATEGORY FILTER SLIDER */}
          <div className="max-w-2xl mx-auto space-y-4">
            
            {/* Input Box */}
            <div className="relative">
              <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
              <Input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder={lang === 'bn' ? 'দোকান বা ব্যবসার ধরণ খুঁজুন...' : 'Search business type...'}
                className="pl-10 pr-8 font-normal h-11 text-sm rounded-2xl"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-white"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            {/* Category Filter Pills Slider */}
            <div className="relative flex items-center gap-2 w-full">
              <Button
                variant="outline"
                size="icon"
                onClick={() => handleScrollCategories('left')}
                className="h-9 w-9 shrink-0 rounded-xl"
                title="Scroll Left"
              >
                <ChevronLeft className="w-4 h-4" />
              </Button>

              <div
                ref={categoriesRef}
                className="flex-1 flex items-center gap-2 overflow-x-auto py-1 no-scrollbar scroll-smooth"
              >
                {SHOP_CATEGORIES.map(cat => {
                  const isActive = activeCategory === cat.id;
                  const categoryLabel = lang === 'bn' && cat.labelBn ? cat.labelBn : cat.label;

                  return (
                    <button
                      key={cat.id}
                      onClick={() => setActiveCategory(cat.id)}
                      className={`px-4 py-2 rounded-xl text-xs font-normal transition-colors shrink-0 ${
                        isActive
                          ? 'bg-[#00df89] text-[#011812] shadow-xs'
                          : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 border border-slate-200/80 dark:border-slate-800'
                      }`}
                    >
                      {categoryLabel}
                    </button>
                  );
                })}
              </div>

              <Button
                variant="outline"
                size="icon"
                onClick={() => handleScrollCategories('right')}
                className="h-9 w-9 shrink-0 rounded-xl"
                title="Scroll Right"
              >
                <ChevronRight className="w-4 h-4" />
              </Button>
            </div>

          </div>

          {/* SHADCN CARDS RESPONSIVE GRID WITH INCREASED GAPS */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 sm:gap-6 lg:gap-6 pt-2">
            {filteredShops.map((shop) => {
              const isSelected = selectedId === shop.id;
              const IconComponent = ICON_MAP[shop.iconName] || Store;
              const shopName = lang === 'bn' && shop.nameBn ? shop.nameBn : shop.name;
              const shopDesc = lang === 'bn' && shop.descriptionBn ? shop.descriptionBn : shop.description;
              const shopFeatures = lang === 'bn' && shop.featuresBn ? shop.featuresBn : shop.features;

              return (
                <Card
                  key={shop.id}
                  onClick={() => setSelectedId(shop.id)}
                  className={`p-5 cursor-pointer transition-all duration-150 flex flex-col justify-between select-none space-y-4 rounded-2xl ${
                    isSelected
                      ? 'border-2 border-[#00df89] bg-emerald-50/20 dark:bg-emerald-950/20 shadow-md'
                      : 'border border-slate-200/90 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 dark:bg-[#121215]'
                  }`}
                >
                  <div className="space-y-3">
                    {/* Top Row: Icon & Selected Circle */}
                    <div className="flex items-center justify-between">
                      <div
                        className={`w-10 h-10 rounded-xl flex items-center justify-center transition-colors ${
                          isSelected
                            ? 'bg-[#00df89] text-[#011812]'
                            : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300'
                        }`}
                      >
                        <IconComponent className="w-5 h-5 stroke-[2]" />
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
                    <div className="space-y-1">
                      <h3 className="font-medium text-sm sm:text-base text-slate-900 dark:text-white">
                        {shopName}
                      </h3>
                      <p className="text-xs text-slate-500 dark:text-slate-400 font-normal leading-relaxed">
                        {shopDesc}
                      </p>
                    </div>
                  </div>

                  {/* Features Badges */}
                  <div className="pt-3 border-t border-slate-100 dark:border-slate-800/80 flex flex-wrap gap-1.5">
                    {shopFeatures.slice(0, 2).map((feat, fIdx) => (
                      <Badge key={fIdx} variant="secondary" className="text-[10px] font-normal px-2 py-0.5">
                        {feat}
                      </Badge>
                    ))}
                  </div>
                </Card>
              );
            })}
          </div>

          {filteredShops.length === 0 && (
            <div className="text-center py-16 text-xs font-normal text-slate-500">
              {lang === 'bn' ? `"${searchQuery}" এর সাথে কোনো ধরণ মেলেনি।` : `No business types match "${searchQuery}".`}
            </div>
          )}

        </div>
      </main>

      {/* STICKY BOTTOM BAR (WITH PROPER Z-INDEX AND MARGIN ELEVATION) */}
      <div className="fixed bottom-0 left-0 right-0 z-40 bg-white/95 dark:bg-[#0B0F17]/95 backdrop-blur-md border-t border-slate-200/90 dark:border-slate-800 py-3.5 px-4 sm:px-8 shadow-lg">
        <div className="max-w-6xl mx-auto flex items-center justify-between gap-4">
          
          <div className="text-xs sm:text-sm font-normal text-slate-600 dark:text-slate-300">
            {lang === 'bn' ? 'নির্বাচিত: ' : 'Selected: '} 
            <span className="font-medium text-slate-900 dark:text-white">
              {selectedShop ? (lang === 'bn' && selectedShop.nameBn ? selectedShop.nameBn : selectedShop.name) : (lang === 'bn' ? 'কোনোটি নয়' : 'None')}
            </span>
          </div>

          <Button
            variant="default"
            onClick={handleContinue}
            disabled={!selectedId || isLoading}
            className="px-6 h-11 bg-[#00df89] hover:bg-[#00c97b] text-[#011812] font-medium text-sm gap-2"
          >
            {isLoading ? (
              <span>{lang === 'bn' ? 'ওয়ার্কস্পেস তৈরি হচ্ছে...' : 'Creating Workspace...'}</span>
            ) : (
              <>
                <span>{lang === 'bn' ? 'এগিয়ে যান' : 'Continue'}</span>
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </Button>

        </div>
      </div>

    </div>
  );
}
