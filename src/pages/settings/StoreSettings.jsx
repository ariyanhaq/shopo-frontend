/**
 * @file StoreSettings.jsx
 * @description Comprehensive Store & Retail Outlet Settings page covering Branding, Address, Invoicing & POS, Inventory controls, Localization, and Schedule.
 */
import { useState, useEffect, useMemo, useId } from 'react';
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
import CashMemoDesigner from './CashMemoDesigner';
import {
  Store, Building2, Phone, Mail, Globe, MapPin,
  Save, Loader2, Sparkles, Check, CheckCircle2,
  Receipt, Printer, Percent, Barcode, Package, AlertTriangle,
  Clock, Calendar, DollarSign, Languages, FileText,
  ShoppingBag, PenTool, Shirt, Tv, Pill, Utensils, Coffee, Cake,
  Cookie, Smartphone, Hammer, Armchair, BookOpen, Gift, Flower2,
  Footprints, Gem, Dumbbell, Scissors, ScissorsLineDashed, Dog,
  Gamepad2, Trophy, Laptop, Sprout, Car, Boxes, HelpCircle,
  Sliders, ShieldAlert, Trash2, Camera
} from 'lucide-react';

const ICON_MAP = {
  ShoppingBag, PenTool, Shirt, Tv, Pill, Utensils, Coffee, Cake,
  Cookie, Smartphone, Hammer, Armchair, BookOpen, Gift, Flower2,
  Footprints, Gem, Dumbbell, Scissors, ScissorsLineDashed, Dog,
  Gamepad2, Trophy, Store, Laptop, Sprout, Car, Boxes
};

export default function StoreSettings() {
  const navigate = useNavigate();
  const { lang, setLang } = useLanguage();
  const { activeShop, selectShopType } = useShop();
  const { mongoShop, setSessionShop, syncBackendProfile } = useAuth();
  
  const [activeTab, setActiveTab] = useState('general');
  const [isSaving, setIsSaving] = useState(false);
  const [typeSearch, setTypeSearch] = useState('');
  const logoInputId = useId();

  // Cash Memo Designer Custom Config State
  const [memoConfig, setMemoConfig] = useState({
    template: 'modern',
    accent_color: '#00a86b',
    memo_title: 'CASH MEMO / INVOICE',
    memo_title_bn: 'ক্যাশ মেমো ও বিক্রয় চালান',
    header_slogan: '',
    show_logo: true,
    show_tagline: true,
    show_address: true,
    show_phone: true,
    show_email: false,
    show_website: false,
    show_bin_vat: true,
    show_invoice_time: true,
    show_cashier_name: true,
    show_customer_phone: true,
    show_customer_address: true,
    show_customer_due: true,
    show_item_sku: true,
    show_item_unit: false,
    show_item_discount: true,
    show_qr_code: true,
    qr_code_type: 'invoice',
    show_signature_line: true,
    signature_label: 'Authorized Signature',
    signature_label_bn: 'কর্তৃপক্ষের স্বাক্ষর',
    show_return_policy: true,
    return_policy_text: 'Goods once sold can only be exchanged within 7 days with valid receipt.',
    return_policy_text_bn: 'বিক্রিত পণ্য মেমোসহ ৭ দিনের মধ্যে পরিবর্তনযোগ্য।',
    footer_note: 'Thank you for shopping with us! Please come again.',
    footer_note_bn: 'আমাদের সাথে কেনাকাটা করার জন্য ধন্যবাদ! আবার আসবেন।',
    show_powered_by: true,
    paper_format: '80mm',
  });

  // Comprehensive Store Form State
  const [form, setForm] = useState({
    // General
    name: '',
    business_type: 'grocery',
    tagline: '',
    logo_url: '',
    bin_vat_number: '',
    website: '',
    phone: '',
    email: '',

    // Address
    address_line1: '',
    address_line2: '',
    city: 'Dhaka',
    state: '',
    postal_code: '',
    country: 'Bangladesh',

    // Invoicing & POS
    receipt_header: '',
    receipt_footer: 'Thank you for shopping with us! Please come again.',
    paper_format: '80mm',
    tax_rate: 0,
    tax_name: 'VAT',
    show_barcode_on_receipt: true,
    default_payment_method: 'Cash',

    // Inventory Controls
    low_stock_threshold: 5,
    allow_negative_stock: false,
    auto_generate_sku: true,

    // Localization & Schedule
    currency_symbol: '৳',
    currency: 'BDT',
    language: 'en',
    timezone: 'Asia/Dhaka',
    opening_time: '09:00',
    closing_time: '21:00',
    weekly_off_day: 'Friday',
  });

  useEffect(() => {
    if (mongoShop) {
      if (mongoShop.settings?.cash_memo_config) {
        setMemoConfig((prev) => ({
          ...prev,
          ...mongoShop.settings.cash_memo_config,
        }));
      }

      setForm({
        name: mongoShop.name || '',
        business_type: mongoShop.business_type || 'grocery',
        tagline: mongoShop.tagline || '',
        logo_url: mongoShop.logo_url || '',
        bin_vat_number: mongoShop.bin_vat_number || '',
        website: mongoShop.website || '',
        phone: mongoShop.phone || '',
        email: mongoShop.email || '',

        address_line1: mongoShop.address?.line1 || '',
        address_line2: mongoShop.address?.line2 || '',
        city: mongoShop.address?.city || 'Dhaka',
        state: mongoShop.address?.state || '',
        postal_code: mongoShop.address?.postal_code || '',
        country: mongoShop.address?.country || 'Bangladesh',

        receipt_header: mongoShop.settings?.receipt_header || '',
        receipt_footer: mongoShop.settings?.receipt_footer || 'Thank you for shopping with us! Please come again.',
        paper_format: mongoShop.settings?.paper_format || '80mm',
        tax_rate: mongoShop.settings?.tax_rate !== undefined ? mongoShop.settings.tax_rate : 0,
        tax_name: mongoShop.settings?.tax_name || 'VAT',
        show_barcode_on_receipt: mongoShop.settings?.show_barcode_on_receipt !== undefined ? mongoShop.settings.show_barcode_on_receipt : true,
        default_payment_method: mongoShop.settings?.default_payment_method || 'Cash',

        low_stock_threshold: mongoShop.settings?.low_stock_threshold !== undefined ? mongoShop.settings.low_stock_threshold : 5,
        allow_negative_stock: Boolean(mongoShop.settings?.allow_negative_stock),
        auto_generate_sku: mongoShop.settings?.auto_generate_sku !== undefined ? mongoShop.settings.auto_generate_sku : true,

        currency_symbol: mongoShop.settings?.currency_symbol || '৳',
        currency: mongoShop.settings?.currency || 'BDT',
        language: mongoShop.settings?.language || 'en',
        timezone: mongoShop.settings?.timezone || 'Asia/Dhaka',
        opening_time: mongoShop.settings?.opening_time || '09:00',
        closing_time: mongoShop.settings?.closing_time || '21:00',
        weekly_off_day: mongoShop.settings?.weekly_off_day || 'Friday',
      });
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
    return SHOP_TYPES.find(st => st.id === form.business_type) || SHOP_TYPES[0];
  }, [form.business_type]);

  const SelectedIcon = ICON_MAP[selectedTypeObj?.iconName] || Store;

  const handleLogoUpload = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 2 * 1024 * 1024) {
      toast.error(lang === 'bn' ? 'লোগোর সাইজ ২MB এর কম হতে হবে।' : 'Logo image must be under 2MB.');
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      setForm(prev => ({ ...prev, logo_url: reader.result }));
    };
    reader.readAsDataURL(file);
  };

  const handleSaveShopSettings = async (e) => {
    e.preventDefault();
    if (!form.name.trim()) {
      toast.error(lang === 'bn' ? 'দোকানের নাম আবশ্যক।' : 'Shop name is required.');
      return;
    }

    setIsSaving(true);
    try {
      const payload = {
        name: form.name.trim(),
        business_type: form.business_type,
        tagline: form.tagline.trim(),
        logo_url: form.logo_url.trim(),
        bin_vat_number: form.bin_vat_number.trim(),
        website: form.website.trim(),
        phone: form.phone.trim(),
        email: form.email.trim(),
        address: {
          line1: form.address_line1.trim(),
          line2: form.address_line2.trim(),
          city: form.city.trim() || 'Dhaka',
          state: form.state.trim(),
          postal_code: form.postal_code.trim(),
          country: form.country.trim() || 'Bangladesh',
        },
        settings: {
          currency: form.currency,
          currency_symbol: form.currency_symbol,
          language: form.language,
          timezone: form.timezone,
          tax_rate: Number(form.tax_rate) || 0,
          tax_name: form.tax_name.trim() || 'VAT',
          receipt_header: form.receipt_header.trim(),
          receipt_footer: form.receipt_footer.trim(),
          paper_format: form.paper_format,
          show_barcode_on_receipt: Boolean(form.show_barcode_on_receipt),
          allow_negative_stock: Boolean(form.allow_negative_stock),
          low_stock_threshold: Number(form.low_stock_threshold) || 5,
          auto_generate_sku: Boolean(form.auto_generate_sku),
          default_payment_method: form.default_payment_method,
          opening_time: form.opening_time,
          closing_time: form.closing_time,
          weekly_off_day: form.weekly_off_day,
          cash_memo_config: memoConfig,
        },
      };

      const res = await api.shops.update(payload);

      // Synchronously update local auth and shop context
      if (res.data) {
        setSessionShop(res.data);
      }
      selectShopType(form.business_type);
      localStorage.setItem('shopo_business_type', form.business_type);

      await syncBackendProfile(true);

      const typeLabel = lang === 'bn' && selectedTypeObj?.nameBn ? selectedTypeObj.nameBn : selectedTypeObj?.name;
      toast.success(
        lang === 'bn'
          ? `দোকানের সকল সেটিংস (${form.name}) সফলভাবে সংরক্ষিত হয়েছে!`
          : `Store settings for (${form.name}) saved successfully!`
      );

      // If business type changed to/from gym or restaurant, transition layout
      if (form.business_type === 'gym') {
        navigate('/gym/dashboard', { replace: true });
      } else if (form.business_type === 'restaurant') {
        navigate('/restaurant/dashboard', { replace: true });
      } else if (
        (mongoShop?.business_type === 'gym' || mongoShop?.business_type === 'restaurant') &&
        form.business_type !== 'gym' &&
        form.business_type !== 'restaurant'
      ) {
        navigate('/dashboard', { replace: true });
      }
    } catch (err) {
      console.error('Update shop settings error:', err);
      toast.error(err.message || 'Failed to update store settings.');
    } finally {
      setIsSaving(false);
    }
  };

  const tabs = [
    { id: 'general', labelEn: 'General & Branding', labelBn: 'সাধারণ ও ব্র্যান্ডিং', icon: Store },
    { id: 'address', labelEn: 'Address & Contact', labelBn: 'ঠিকানা ও যোগাযোগ', icon: MapPin },
    { id: 'invoicing', labelEn: 'Cash Memo & POS Invoicing', labelBn: 'ক্যাশ মেমো ও পিওএস প্রিন্টিং', icon: Receipt },
    { id: 'inventory', labelEn: 'Inventory Controls', labelBn: 'মজুত ও স্টক কন্ট্রোল', icon: Package },
    { id: 'schedule', labelEn: 'Localization & Hours', labelBn: 'লোকেশন ও সময়সূচি', icon: Clock },
    { id: 'danger', labelEn: 'Danger Zone', labelBn: 'ডেঞ্জার জোন', icon: ShieldAlert },
  ];

  return (
    <div className="max-w-6xl space-y-6 font-sans pb-16">
      
      {/* ---------------------------------------------------- */}
      {/* HEADER SECTION                                       */}
      {/* ---------------------------------------------------- */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white tracking-tight flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-[#00df89]/10 text-[#00a86b] dark:text-[#00df89] flex items-center justify-center">
              <Store className="w-4 h-4" />
            </div>
            <span>{lang === 'bn' ? 'দোকানের সেটিংস' : 'Store Settings'}</span>
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-zinc-400 font-normal mt-0.5">
            {lang === 'bn'
              ? 'দোকানের নাম, ব্যবসার ক্যাটাগরি, ইনভয়েস রসিদ, স্টক কন্ট্রোল এবং কাজের সময় পরিচালনা করুন।'
              : 'Configure your retail branding, invoice format, POS parameters, inventory rules, and business schedule.'}
          </p>
        </div>
      </div>

      {/* ---------------------------------------------------- */}
      {/* TABS NAVIGATION                                      */}
      {/* ---------------------------------------------------- */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1 border-b border-slate-200 dark:border-zinc-800 scrollbar-none">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-3.5 py-2.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all cursor-pointer ${
                isActive
                  ? 'bg-slate-900 text-white dark:bg-white dark:text-slate-900 shadow-xs'
                  : 'text-slate-600 dark:text-zinc-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-zinc-800/60'
              }`}
            >
              <Icon className="w-3.5 h-3.5" />
              <span>{lang === 'bn' ? tab.labelBn : tab.labelEn}</span>
            </button>
          );
        })}
      </div>

      <form onSubmit={handleSaveShopSettings} className="space-y-6">

        {/* ==================================================== */}
        {/* TAB 1: GENERAL & BRANDING                            */}
        {/* ==================================================== */}
        {activeTab === 'general' && (
          <div className="space-y-6 animate-in fade-in-50 duration-200">
            
            {/* Store Name & Logo Card */}
            <Card className="p-5 sm:p-6 bg-white dark:bg-zinc-900 border-slate-200/80 dark:border-zinc-800 shadow-xs rounded-2xl">
              <CardTitle className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2 mb-1">
                <Building2 className="w-4 h-4 text-[#00df89]" />
                <span>{lang === 'bn' ? 'সাধারণ পরিচিতি ও ব্র্যান্ডিং' : 'General Identity & Branding'}</span>
              </CardTitle>
              <CardDescription className="text-xs text-slate-500 dark:text-zinc-400 mb-6">
                {lang === 'bn'
                  ? 'দোকানের নাম, লোগো, স্লোগান এবং ট্যাক্স বিন নম্বর।'
                  : 'Basic store brand identity displayed on POS terminals, invoices, and customer receipts.'}
              </CardDescription>

              <div className="flex flex-col sm:flex-row items-start sm:items-center gap-6 mb-6">
                {/* Store Logo Preview */}
                <div className="relative group">
                  <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-2xl p-1 bg-slate-100 dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700 shadow-sm flex items-center justify-center overflow-hidden">
                    {form.logo_url ? (
                      <img src={form.logo_url} alt="Store Logo" className="w-full h-full object-contain rounded-xl" />
                    ) : (
                      <SelectedIcon className="w-8 h-8 text-slate-400" />
                    )}
                  </div>
                  <label
                    htmlFor={logoInputId}
                    className="absolute -bottom-2 -right-2 w-7 h-7 rounded-lg bg-slate-900 text-white dark:bg-white dark:text-slate-900 flex items-center justify-center cursor-pointer shadow hover:scale-105 transition-transform"
                    title="Upload Logo"
                  >
                    <Camera className="w-3.5 h-3.5" />
                  </label>
                  <input id={logoInputId} type="file" accept="image/*" onChange={handleLogoUpload} className="hidden" />
                </div>

                <div className="space-y-2 flex-1 min-w-0">
                  <div className="text-xs font-semibold text-slate-700 dark:text-zinc-300">
                    {lang === 'bn' ? 'দোকানের লোগো URL' : 'Store Logo Web Link'}
                  </div>
                  <Input
                    value={form.logo_url}
                    onChange={(e) => setForm({ ...form, logo_url: e.target.value })}
                    placeholder="https://example.com/logo.png"
                    className="text-xs h-9"
                  />
                  <div className="text-[11px] text-slate-400 dark:text-zinc-500">
                    {lang === 'bn' ? 'লোগোটি রসিদের প্রিন্ট হেডারে প্রদর্শিত হবে।' : 'Logo appears on POS receipts and reports.'}
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Store Name */}
                <div>
                  <label className="text-xs font-semibold text-slate-700 dark:text-zinc-300 block mb-1.5">
                    {lang === 'bn' ? 'দোকানের নাম' : 'Store Name'} <span className="text-rose-500">*</span>
                  </label>
                  <div className="relative">
                    <Store className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                    <Input
                      value={form.name}
                      onChange={(e) => setForm({ ...form, name: e.target.value })}
                      placeholder="e.g. Venom Clothing"
                      className="pl-9 text-xs h-10"
                      required
                    />
                  </div>
                </div>

                {/* Slogan / Tagline */}
                <div>
                  <label className="text-xs font-semibold text-slate-700 dark:text-zinc-300 block mb-1.5">
                    {lang === 'bn' ? 'ট্যাগলাইন / স্লোগান' : 'Tagline / Slogan'}
                  </label>
                  <Input
                    value={form.tagline}
                    onChange={(e) => setForm({ ...form, tagline: e.target.value })}
                    placeholder={lang === 'bn' ? 'সেরা মানের ফ্যাশন পোশাক' : 'Premium Quality Fashion & Wear'}
                    className="text-xs h-10"
                  />
                </div>

                {/* VAT / BIN Registration */}
                <div>
                  <label className="text-xs font-semibold text-slate-700 dark:text-zinc-300 block mb-1.5">
                    {lang === 'bn' ? 'ভ্যাট / বিন (BIN/VAT) নম্বর' : 'VAT / BIN Registration No.'}
                  </label>
                  <Input
                    value={form.bin_vat_number}
                    onChange={(e) => setForm({ ...form, bin_vat_number: e.target.value })}
                    placeholder="BIN-123456789"
                    className="text-xs h-10 font-mono"
                  />
                </div>

                {/* Website */}
                <div>
                  <label className="text-xs font-semibold text-slate-700 dark:text-zinc-300 block mb-1.5">
                    {lang === 'bn' ? 'ওয়েবসাইট' : 'Website URL'}
                  </label>
                  <div className="relative">
                    <Globe className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                    <Input
                      value={form.website}
                      onChange={(e) => setForm({ ...form, website: e.target.value })}
                      placeholder="https://myshop.com"
                      className="pl-9 text-xs h-10"
                    />
                  </div>
                </div>
              </div>
            </Card>

            {/* Business Type Category Selector */}
            <Card className="p-5 sm:p-6 bg-white dark:bg-zinc-900 border-slate-200/80 dark:border-zinc-800 shadow-xs rounded-2xl">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
                <div>
                  <CardTitle className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2 mb-1">
                    <Sliders className="w-4 h-4 text-blue-500" />
                    <span>{lang === 'bn' ? 'ব্যবসার ধরন ও ইন্ডাস্ট্রি মোড' : 'Business Type & Industry Mode'}</span>
                  </CardTitle>
                  <CardDescription className="text-xs text-slate-500 dark:text-zinc-400">
                    {lang === 'bn'
                      ? 'আপনার ব্যবসার ধরন অনুযায়ী সফটওয়্যারের ড্যাশবোর্ড ও টুলস স্বয়ংক্রিয়ভাবে পরিবর্তিত হবে।'
                      : 'Adapts POS widgets, categories, and inventory fields to your specific retail industry.'}
                  </CardDescription>
                </div>

                <div className="w-full sm:w-56">
                  <Input
                    value={typeSearch}
                    onChange={(e) => setTypeSearch(e.target.value)}
                    placeholder={lang === 'bn' ? 'ক্যাটাগরি খুঁজুন...' : 'Search industry...'}
                    className="text-xs h-8"
                  />
                </div>
              </div>

              {/* Grid of Shop Types */}
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2.5 max-h-72 overflow-y-auto pr-1">
                {filteredTypes.map((st) => {
                  const StIcon = ICON_MAP[st.iconName] || Store;
                  const isSelected = form.business_type === st.id;
                  return (
                    <button
                      type="button"
                      key={st.id}
                      onClick={() => setForm({ ...form, business_type: st.id })}
                      className={`p-3 rounded-xl border text-left flex items-start gap-2.5 transition-all cursor-pointer ${
                        isSelected
                          ? 'border-[#00df89] bg-[#00df89]/10 text-slate-900 dark:text-white ring-1 ring-[#00df89]'
                          : 'border-slate-200/80 dark:border-zinc-800 bg-slate-50/50 dark:bg-zinc-800/30 text-slate-600 dark:text-zinc-400 hover:border-slate-300 dark:hover:border-zinc-700'
                      }`}
                    >
                      <div className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 ${isSelected ? 'bg-[#00df89] text-[#011812]' : 'bg-slate-200 dark:bg-zinc-700 text-slate-600 dark:text-zinc-300'}`}>
                        <StIcon className="w-3.5 h-3.5" />
                      </div>
                      <div className="min-w-0">
                        <div className="text-xs font-bold truncate">
                          {lang === 'bn' && st.nameBn ? st.nameBn : st.name}
                        </div>
                        <div className="text-[10px] opacity-75 capitalize truncate">{st.category}</div>
                      </div>
                    </button>
                  );
                })}
              </div>
            </Card>

          </div>
        )}

        {/* ==================================================== */}
        {/* TAB 2: ADDRESS & CONTACT                             */}
        {/* ==================================================== */}
        {activeTab === 'address' && (
          <Card className="p-5 sm:p-6 bg-white dark:bg-zinc-900 border-slate-200/80 dark:border-zinc-800 shadow-xs rounded-2xl animate-in fade-in-50 duration-200">
            <CardTitle className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2 mb-1">
              <MapPin className="w-4 h-4 text-rose-500" />
              <span>{lang === 'bn' ? 'দোকানের ঠিকানা ও কন্টাক্ট ইনফো' : 'Store Address & Contact Info'}</span>
            </CardTitle>
            <CardDescription className="text-xs text-slate-500 dark:text-zinc-400 mb-6">
              {lang === 'bn'
                ? 'এই ঠিকানাটি প্রতিটি বিক্রয় মেমো এবং চালানের শীর্ষভাগে মুদ্রিত হবে।'
                : 'Physical store location and contact numbers printed on sales receipts and invoices.'}
            </CardDescription>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              
              {/* Street Line 1 */}
              <div className="sm:col-span-2">
                <label className="text-xs font-semibold text-slate-700 dark:text-zinc-300 block mb-1.5">
                  {lang === 'bn' ? 'ঠিকানা (লাইন ১)' : 'Street Address (Line 1)'}
                </label>
                <div className="relative">
                  <MapPin className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <Input
                    value={form.address_line1}
                    onChange={(e) => setForm({ ...form, address_line1: e.target.value })}
                    placeholder={lang === 'bn' ? 'দোকান নং, ফ্লোর, মার্কেটের নাম' : 'Shop No., Floor, Market/Road Name'}
                    className="pl-9 text-xs h-10"
                  />
                </div>
              </div>

              {/* Street Line 2 */}
              <div className="sm:col-span-2">
                <label className="text-xs font-semibold text-slate-700 dark:text-zinc-300 block mb-1.5">
                  {lang === 'bn' ? 'ঠিকানা (লাইন ২ - ঐচ্ছিক)' : 'Street Address (Line 2 - Optional)'}
                </label>
                <Input
                  value={form.address_line2}
                  onChange={(e) => setForm({ ...form, address_line2: e.target.value })}
                  placeholder={lang === 'bn' ? 'এলাকা / ল্যান্ডমার্ক' : 'Area / Landmark'}
                  className="text-xs h-10"
                />
              </div>

              {/* City / District */}
              <div>
                <label className="text-xs font-semibold text-slate-700 dark:text-zinc-300 block mb-1.5">
                  {lang === 'bn' ? 'শহর / জেলা' : 'City / District'} <span className="text-rose-500">*</span>
                </label>
                <Input
                  value={form.city}
                  onChange={(e) => setForm({ ...form, city: e.target.value })}
                  placeholder="Dhaka"
                  className="text-xs h-10"
                  required
                />
              </div>

              {/* Division / State */}
              <div>
                <label className="text-xs font-semibold text-slate-700 dark:text-zinc-300 block mb-1.5">
                  {lang === 'bn' ? 'বিভাগ / স্টেট' : 'Division / State'}
                </label>
                <Input
                  value={form.state}
                  onChange={(e) => setForm({ ...form, state: e.target.value })}
                  placeholder="Dhaka"
                  className="text-xs h-10"
                />
              </div>

              {/* Postal Code */}
              <div>
                <label className="text-xs font-semibold text-slate-700 dark:text-zinc-300 block mb-1.5">
                  {lang === 'bn' ? 'পোস্ট কোড' : 'Postal / ZIP Code'}
                </label>
                <Input
                  value={form.postal_code}
                  onChange={(e) => setForm({ ...form, postal_code: e.target.value })}
                  placeholder="1205"
                  className="text-xs h-10 font-mono"
                />
              </div>

              {/* Country */}
              <div>
                <label className="text-xs font-semibold text-slate-700 dark:text-zinc-300 block mb-1.5">
                  {lang === 'bn' ? 'দেশ' : 'Country'}
                </label>
                <Input
                  value={form.country}
                  onChange={(e) => setForm({ ...form, country: e.target.value })}
                  placeholder="Bangladesh"
                  className="text-xs h-10"
                />
              </div>

              {/* Store Phone */}
              <div>
                <label className="text-xs font-semibold text-slate-700 dark:text-zinc-300 block mb-1.5">
                  {lang === 'bn' ? 'দোকানের কন্টাক্ট ফোন' : 'Store Hotline / Phone'}
                </label>
                <div className="relative">
                  <Phone className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <Input
                    value={form.phone}
                    onChange={(e) => setForm({ ...form, phone: e.target.value })}
                    placeholder="017XXXXXXXX"
                    className="pl-9 text-xs h-10"
                  />
                </div>
              </div>

              {/* Store Email */}
              <div>
                <label className="text-xs font-semibold text-slate-700 dark:text-zinc-300 block mb-1.5">
                  {lang === 'bn' ? 'দোকানের অফিশিয়াল ইমেইল' : 'Store Official Email'}
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <Input
                    value={form.email}
                    onChange={(e) => setForm({ ...form, email: e.target.value })}
                    placeholder="support@myshop.com"
                    className="pl-9 text-xs h-10"
                  />
                </div>
              </div>

            </div>
          </Card>
        )}

        {/* ==================================================== */}
        {/* TAB 3: CASH MEMO & POS INVOICING STUDIO              */}
        {/* ==================================================== */}
        {activeTab === 'invoicing' && (
          <CashMemoDesigner
            memoConfig={memoConfig}
            setMemoConfig={setMemoConfig}
            shop={mongoShop}
            form={form}
            setForm={setForm}
          />
        )}

        {/* ==================================================== */}
        {/* TAB 4: INVENTORY CONTROLS                            */}
        {/* ==================================================== */}
        {activeTab === 'inventory' && (
          <Card className="p-5 sm:p-6 bg-white dark:bg-zinc-900 border-slate-200/80 dark:border-zinc-800 shadow-xs rounded-2xl animate-in fade-in-50 duration-200">
            <CardTitle className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2 mb-1">
              <Package className="w-4 h-4 text-amber-500" />
              <span>{lang === 'bn' ? 'ইনভেন্টরি ও স্টক নিয়ন্ত্রণ' : 'Inventory & Stock Rules'}</span>
            </CardTitle>
            <CardDescription className="text-xs text-slate-500 dark:text-zinc-400 mb-6">
              {lang === 'bn'
                ? 'স্বল্প স্টক সতর্কতা, নেগেটিভ বিক্রি এবং স্বয়ংক্রিয় SKU তৈরির নিয়মসমূহ।'
                : 'Configure inventory safeguards, out-of-stock behavior, and SKU auto-generation.'}
            </CardDescription>

            <div className="space-y-4">
              
              {/* Low Stock Alert Threshold */}
              <div className="p-4 rounded-xl bg-slate-50 dark:bg-zinc-800/40 border border-slate-200/80 dark:border-zinc-700/60 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <div className="text-xs font-bold text-slate-900 dark:text-white">
                    {lang === 'bn' ? 'ডিফল্ট স্বল্প স্টক এলার্ট সীমা (Low Stock Threshold)' : 'Default Low Stock Alert Threshold'}
                  </div>
                  <div className="text-[11px] text-slate-500 dark:text-zinc-400 mt-0.5">
                    {lang === 'bn' ? 'পণ্যের মজুদ এই সংখ্যার নিচে নামলে ড্যাশবোর্ডে লাল ওয়ার্নিং আসবে।' : 'Trigger alert badge when product stock falls below this quantity.'}
                  </div>
                </div>
                <div className="w-28 shrink-0">
                  <Input
                    type="number"
                    min="1"
                    max="1000"
                    value={form.low_stock_threshold}
                    onChange={(e) => setForm({ ...form, low_stock_threshold: e.target.value })}
                    className="text-xs h-10 font-mono text-center"
                  />
                </div>
              </div>

              {/* Allow Negative Stock Sales */}
              <div className="p-4 rounded-xl bg-slate-50 dark:bg-zinc-800/40 border border-slate-200/80 dark:border-zinc-700/60 flex items-center justify-between">
                <div>
                  <div className="text-xs font-bold text-slate-900 dark:text-white">
                    {lang === 'bn' ? 'নেগেটিভ স্টকে বিক্রির অনুমতি (Allow Negative Stock Sales)' : 'Allow Negative Stock Sales'}
                  </div>
                  <div className="text-[11px] text-slate-500 dark:text-zinc-400 mt-0.5">
                    {lang === 'bn' ? 'স্টক ০ থাকলেও পিওএস কাউন্টারে বিক্রি সম্পন্ন করতে পারবে।' : 'Allow cashiers to complete sales even when item quantity is zero.'}
                  </div>
                </div>
                <input
                  type="checkbox"
                  checked={form.allow_negative_stock}
                  onChange={(e) => setForm({ ...form, allow_negative_stock: e.target.checked })}
                  className="w-5 h-5 accent-[#00df89] rounded cursor-pointer"
                />
              </div>

              {/* Auto Generate SKU */}
              <div className="p-4 rounded-xl bg-slate-50 dark:bg-zinc-800/40 border border-slate-200/80 dark:border-zinc-700/60 flex items-center justify-between">
                <div>
                  <div className="text-xs font-bold text-slate-900 dark:text-white">
                    {lang === 'bn' ? 'নতুন পণ্যে স্বয়ংক্রিয় SKU তৈরি (Auto-generate SKU)' : 'Auto-Generate SKU on Product Creation'}
                  </div>
                  <div className="text-[11px] text-slate-500 dark:text-zinc-400 mt-0.5">
                    {lang === 'bn' ? 'নতুন প্রোডাক্ট যোগ করার সময় সিস্টেম স্বয়ংক্রিয় ইউনিক SKU বসাবে।' : 'Automatically generates unique product SKU codes when left blank.'}
                  </div>
                </div>
                <input
                  type="checkbox"
                  checked={form.auto_generate_sku}
                  onChange={(e) => setForm({ ...form, auto_generate_sku: e.target.checked })}
                  className="w-5 h-5 accent-[#00df89] rounded cursor-pointer"
                />
              </div>

            </div>
          </Card>
        )}

        {/* ==================================================== */}
        {/* TAB 5: LOCALIZATION & SCHEDULE                       */}
        {/* ==================================================== */}
        {activeTab === 'schedule' && (
          <Card className="p-5 sm:p-6 bg-white dark:bg-zinc-900 border-slate-200/80 dark:border-zinc-800 shadow-xs rounded-2xl animate-in fade-in-50 duration-200">
            <CardTitle className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2 mb-1">
              <Globe className="w-4 h-4 text-cyan-500" />
              <span>{lang === 'bn' ? 'কারেন্সি, ভাষা ও কাজের সময়সূচি' : 'Currency, Localization & Schedule'}</span>
            </CardTitle>
            <CardDescription className="text-xs text-slate-500 dark:text-zinc-400 mb-6">
              {lang === 'bn'
                ? 'মুদ্রার প্রতীক, সিস্টেম টাইমজোন এবং দোকানের খোলার ও বন্ধের সময়সূচি।'
                : 'Default currency display, system locale timezone, and standard business operating hours.'}
            </CardDescription>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              
              {/* Currency Symbol */}
              <div>
                <label className="text-xs font-semibold text-slate-700 dark:text-zinc-300 block mb-1.5">
                  {lang === 'bn' ? 'মুদ্রার প্রতীক (Currency Symbol)' : 'Currency Symbol'}
                </label>
                <div className="relative">
                  <DollarSign className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <Input
                    value={form.currency_symbol}
                    onChange={(e) => setForm({ ...form, currency_symbol: e.target.value })}
                    placeholder="৳"
                    className="pl-9 text-xs h-10 font-bold"
                  />
                </div>
              </div>

              {/* Currency Code */}
              <div>
                <label className="text-xs font-semibold text-slate-700 dark:text-zinc-300 block mb-1.5">
                  {lang === 'bn' ? 'মুদ্রার কোড (Currency Code)' : 'Currency Code'}
                </label>
                <select
                  value={form.currency}
                  onChange={(e) => setForm({ ...form, currency: e.target.value })}
                  className="w-full h-10 px-3 rounded-xl border border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 text-xs font-medium text-slate-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-[#00df89]"
                >
                  <option value="BDT">BDT - Bangladeshi Taka (৳)</option>
                  <option value="USD">USD - US Dollar ($)</option>
                  <option value="EUR">EUR - Euro (€)</option>
                  <option value="GBP">GBP - British Pound (£)</option>
                  <option value="INR">INR - Indian Rupee (₹)</option>
                  <option value="AED">AED - UAE Dirham</option>
                  <option value="SAR">SAR - Saudi Riyal</option>
                </select>
              </div>

              {/* System Timezone */}
              <div>
                <label className="text-xs font-semibold text-slate-700 dark:text-zinc-300 block mb-1.5">
                  {lang === 'bn' ? 'টাইমজোন (Timezone)' : 'System Timezone'}
                </label>
                <select
                  value={form.timezone}
                  onChange={(e) => setForm({ ...form, timezone: e.target.value })}
                  className="w-full h-10 px-3 rounded-xl border border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 text-xs font-medium text-slate-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-[#00df89]"
                >
                  <option value="Asia/Dhaka">Asia/Dhaka (GMT +6:00)</option>
                  <option value="Asia/Kolkata">Asia/Kolkata (GMT +5:30)</option>
                  <option value="Asia/Dubai">Asia/Dubai (GMT +4:00)</option>
                  <option value="Asia/Riyadh">Asia/Riyadh (GMT +3:00)</option>
                  <option value="Europe/London">Europe/London (GMT +0:00)</option>
                  <option value="America/New_York">America/New York (GMT -5:00)</option>
                </select>
              </div>

              {/* Weekly Off Day */}
              <div>
                <label className="text-xs font-semibold text-slate-700 dark:text-zinc-300 block mb-1.5">
                  {lang === 'bn' ? 'সাপ্তাহিক ছুটির দিন' : 'Weekly Off Day'}
                </label>
                <select
                  value={form.weekly_off_day}
                  onChange={(e) => setForm({ ...form, weekly_off_day: e.target.value })}
                  className="w-full h-10 px-3 rounded-xl border border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 text-xs font-medium text-slate-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-[#00df89]"
                >
                  <option value="Friday">Friday (শুক্রবার)</option>
                  <option value="Saturday">Saturday (শনিবার)</option>
                  <option value="Sunday">Sunday (রবিবার)</option>
                  <option value="None">No Weekly Off (সাতদিনই খোলা)</option>
                </select>
              </div>

              {/* Opening Time */}
              <div>
                <label className="text-xs font-semibold text-slate-700 dark:text-zinc-300 block mb-1.5">
                  {lang === 'bn' ? 'দোকান খোলার সময়' : 'Store Opening Time'}
                </label>
                <Input
                  type="time"
                  value={form.opening_time}
                  onChange={(e) => setForm({ ...form, opening_time: e.target.value })}
                  className="text-xs h-10 font-mono"
                />
              </div>

              {/* Closing Time */}
              <div>
                <label className="text-xs font-semibold text-slate-700 dark:text-zinc-300 block mb-1.5">
                  {lang === 'bn' ? 'দোকান বন্ধের সময়' : 'Store Closing Time'}
                </label>
                <Input
                  type="time"
                  value={form.closing_time}
                  onChange={(e) => setForm({ ...form, closing_time: e.target.value })}
                  className="text-xs h-10 font-mono"
                />
              </div>

            </div>
          </Card>
        )}

        {/* ==================================================== */}
        {/* TAB 6: DANGER ZONE                                  */}
        {/* ==================================================== */}
        {activeTab === 'danger' && (
          <Card className="p-5 sm:p-6 bg-white dark:bg-zinc-900 border-rose-500/30 dark:border-rose-900/40 shadow-xs rounded-2xl animate-in fade-in-50 duration-200">
            <CardTitle className="text-base font-bold text-rose-600 dark:text-rose-400 flex items-center gap-2 mb-1">
              <ShieldAlert className="w-4 h-4" />
              <span>{lang === 'bn' ? 'ডেঞ্জার জোন ও নিয়ন্ত্রণ' : 'Danger Zone & Store Deactivation'}</span>
            </CardTitle>
            <CardDescription className="text-xs text-slate-500 dark:text-zinc-400 mb-6">
              {lang === 'bn'
                ? 'সংবেদনশীল অ্যাকশন এবং আউটলেট সংক্রান্ত জরুরি পদক্ষেপ।'
                : 'Critical store-level operations requiring executive administrative authorization.'}
            </CardDescription>

            <div className="space-y-4">
              
              {/* Data Safeguard Notice */}
              <div className="p-4 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-start gap-3">
                <AlertTriangle className="w-5 h-5 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
                <div className="text-xs text-slate-700 dark:text-zinc-300 leading-relaxed">
                  <span className="font-bold text-slate-900 dark:text-white">
                    {lang === 'bn' ? 'স্বয়ংক্রিয় ব্যাকআপ সক্রিয়:' : 'Continuous Cloud Backup Active:'}
                  </span>{' '}
                  {lang === 'bn'
                    ? 'আপনার আউটলেটের সকল বিক্রয়, ইনভেন্টরি ও আর্থিক রেকর্ডস স্বয়ংক্রিয়ভাবে ক্লাউড ডাটাবেজে সংরক্ষিত থাকে।'
                    : 'All retail transactions, stock ledgers, and financial journal entries are safely replicated on MongoDB Atlas.'}
                </div>
              </div>

              {/* Store Switch & Outlet Info */}
              <div className="p-4 rounded-xl bg-slate-50 dark:bg-zinc-800/40 border border-slate-200/80 dark:border-zinc-700/60 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <div className="text-xs font-bold text-slate-900 dark:text-white">
                    {lang === 'bn' ? 'আউটলেট আইডি (Store ID)' : 'Store Tenant ID'}
                  </div>
                  <div className="text-xs font-mono font-bold text-slate-600 dark:text-zinc-400 mt-0.5">
                    {mongoShop?._id || '—'}
                  </div>
                </div>

                <Badge variant="outline" className="text-xs bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20">
                  Outlet Status: Operational
                </Badge>
              </div>

            </div>
          </Card>
        )}

        {/* ---------------------------------------------------- */}
        {/* SUBMIT BUTTON BAR                                    */}
        {/* ---------------------------------------------------- */}
        <div className="flex items-center justify-end gap-3 pt-2">
          <Button
            type="submit"
            disabled={isSaving}
            className="h-11 px-7 rounded-xl bg-[#00df89] hover:bg-[#00c578] text-[#011812] font-bold text-xs shadow-md hover:shadow-lg transition-all cursor-pointer gap-2"
          >
            {isSaving ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>{lang === 'bn' ? 'সংরক্ষণ করা হচ্ছে...' : 'Saving Changes...'}</span>
              </>
            ) : (
              <>
                <Save className="w-4 h-4" />
                <span>{lang === 'bn' ? 'দোকানের সেটিংস সংরক্ষণ করুন' : 'Save Store Settings'}</span>
              </>
            )}
          </Button>
        </div>

      </form>
    </div>
  );
}
