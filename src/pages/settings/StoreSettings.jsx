/**
 * @file StoreSettings.jsx
 * @description Comprehensive Store & Retail Outlet Settings page covering Branding,
 * Address & Location, Invoicing & POS Cash Memo Designer, Inventory controls,
 * Localization, Operating Hours, and Danger Zone with Store Deletion.
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
  Sliders, ShieldAlert, Trash2, Camera, AlertCircle, ArrowRight,
  ExternalLink, Search, RefreshCw, Layers, ShieldCheck, X
} from 'lucide-react';

const ICON_MAP = {
  ShoppingBag, PenTool, Shirt, Tv, Pill, Utensils, Coffee, Cake,
  Cookie, Smartphone, Hammer, Armchair, BookOpen, Gift, Flower2,
  Footprints, Gem, Dumbbell, Scissors, ScissorsLineDashed, Dog,
  Gamepad2, Trophy, Store, Laptop, Sprout, Car, Boxes
};

const BANGLADESH_CITIES = [
  'Dhaka', 'Chittagong', 'Sylhet', 'Rajshahi', 'Khulna',
  'Barisal', 'Rangpur', 'Mymensingh', 'Comilla', 'Gazipur', 'Narayanganj'
];

export default function StoreSettings() {
  const navigate = useNavigate();
  const { lang, setLang } = useLanguage();
  const { activeShop, selectShopType } = useShop();
  const { mongoShop, userShops, switchShop, setSessionShop, syncBackendProfile } = useAuth();
  
  const [activeTab, setActiveTab] = useState('general'); // 'general' | 'address' | 'invoicing' | 'inventory' | 'schedule' | 'danger'
  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [deleteConfirmText, setDeleteConfirmText] = useState('');
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

  const [originalForm, setOriginalForm] = useState(null);

  useEffect(() => {
    if (mongoShop) {
      if (mongoShop.settings?.cash_memo_config) {
        setMemoConfig((prev) => ({
          ...prev,
          ...mongoShop.settings.cash_memo_config,
        }));
      }

      const initialData = {
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
      };

      setForm(initialData);
      setOriginalForm(initialData);
    }
  }, [mongoShop]);

  // Dirty state tracker
  const isDirty = useMemo(() => {
    if (!originalForm) return false;
    return Object.keys(form).some((k) => form[k] !== originalForm[k]);
  }, [form, originalForm]);

  const filteredTypes = useMemo(() => {
    const q = typeSearch.toLowerCase().trim();
    return SHOP_TYPES.filter((st) => {
      const sName = lang === 'bn' && st.nameBn ? st.nameBn : st.name;
      return !q || sName.toLowerCase().includes(q) || st.id.includes(q) || st.category.includes(q);
    });
  }, [typeSearch, lang]);

  const selectedTypeObj = useMemo(() => {
    return SHOP_TYPES.find((st) => st.id === form.business_type) || SHOP_TYPES[0];
  }, [form.business_type]);

  const SelectedIcon = ICON_MAP[selectedTypeObj?.iconName] || Store;

  const handleLogoUpload = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 2.5 * 1024 * 1024) {
      toast.error(lang === 'bn' ? 'লোগোর সাইজ ২.৫MB এর কম হতে হবে।' : 'Logo image must be under 2.5MB.');
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      setForm((prev) => ({ ...prev, logo_url: reader.result }));
      toast.success(lang === 'bn' ? 'লোগো প্রিভিউ তৈরি হয়েছে!' : 'Logo preview updated!');
    };
    reader.readAsDataURL(file);
  };

  // Save Shop Settings Handler
  const handleSaveShopSettings = async (e) => {
    if (e) e.preventDefault();
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

      if (res.data) {
        setSessionShop(res.data);
      }
      selectShopType(form.business_type);
      localStorage.setItem('shopo_business_type', form.business_type);

      await syncBackendProfile(true);
      setOriginalForm({ ...form });

      toast.success(
        lang === 'bn'
          ? `দোকানের সকল সেটিংস (${form.name}) সফলভাবে সংরক্ষিত হয়েছে!`
          : `Store settings for (${form.name}) saved successfully!`
      );

      // Handle gym/restaurant UI redirection if type switched
      if (form.business_type === 'gym') {
        navigate('/gym/dashboard', { replace: true });
      } else if (form.business_type === 'restaurant') {
        navigate('/restaurant/dashboard', { replace: true });
      }
    } catch (err) {
      console.error('Update shop settings error:', err);
      toast.error(err.message || 'Failed to update store settings.');
    } finally {
      setIsSaving(false);
    }
  };

  // Delete Shop Handler
  const handleDeleteShop = async () => {
    if (deleteConfirmText.trim().toLowerCase() !== form.name.trim().toLowerCase()) {
      toast.error(lang === 'bn' ? 'দোকানের নামটি সঠিকভাবে টাইপ করুন।' : 'Please type the exact store name to confirm.');
      return;
    }

    if (!mongoShop?._id) {
      toast.error('No active shop found to delete.');
      return;
    }

    setIsDeleting(true);
    try {
      const res = await api.shops.delete(mongoShop._id);
      setIsDeleteModalOpen(false);
      setDeleteConfirmText('');

      toast.success(
        lang === 'bn'
          ? `'${form.name}' দোকান সফলভাবে ডিলিট করা হয়েছে!`
          : `Store '${form.name}' deleted successfully!`
      );

      // Sync backend profile
      await syncBackendProfile(true);

      // If user has other remaining shops, switch to next one
      if (res.data?.nextActiveShop) {
        await switchShop(res.data.nextActiveShop._id);
        navigate('/dashboard', { replace: true });
      } else {
        localStorage.removeItem('shopo_active_shop_id');
        localStorage.removeItem('shopo_has_shop');
        navigate('/onboarding', { replace: true });
      }
    } catch (err) {
      console.error('Delete shop error:', err);
      toast.error(err.message || 'Failed to delete store.');
    } finally {
      setIsDeleting(false);
    }
  };

  const tabs = [
    { id: 'general', labelEn: 'General & Branding', labelBn: 'সাধারণ ও ব্র্যান্ডিং', icon: Store },
    { id: 'address', labelEn: 'Address & Location', labelBn: 'ঠিকানা ও লোকেশন', icon: MapPin },
    { id: 'invoicing', labelEn: 'Cash Memo & POS', labelBn: 'ক্যাশ মেমো ও প্রিন্টিং', icon: Receipt },
    { id: 'inventory', labelEn: 'Inventory Controls', labelBn: 'মজুত ও স্টক কন্ট্রোল', icon: Package },
    { id: 'schedule', labelEn: 'Localization & Hours', labelBn: 'লোকেশন ও সময়সূচি', icon: Clock },
    { id: 'danger', labelEn: 'Danger Zone & Delete', labelBn: 'ডেঞ্জার জোন ও ডিলিট', icon: ShieldAlert },
  ];

  return (
    <div className="max-w-6xl mx-auto space-y-6 font-sans pb-24 animate-in fade-in duration-200">
      
      {/* ---------------------------------------------------- */}
      {/* STORE HERO BANNER                                    */}
      {/* ---------------------------------------------------- */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-slate-900 via-zinc-900 to-slate-950 border border-slate-700/60 p-6 sm:p-8 text-white shadow-xl">
        <div className="absolute top-0 right-0 -mt-8 -mr-8 w-64 h-64 bg-[#00df89]/15 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-1/4 -mb-12 w-64 h-64 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="flex items-center gap-4 sm:gap-5">
            {/* Store Logo with Category Badge */}
            <div className="relative shrink-0">
              <div className="w-18 h-18 sm:w-20 sm:h-20 rounded-2xl p-1 bg-gradient-to-tr from-[#00df89] to-emerald-400 shadow-lg flex items-center justify-center bg-zinc-900">
                {form.logo_url ? (
                  <img
                    src={form.logo_url}
                    alt="Store Logo"
                    className="w-full h-full object-contain rounded-xl bg-zinc-900 p-1"
                  />
                ) : (
                  <SelectedIcon className="w-8 h-8 text-slate-950" />
                )}
              </div>
              <div className="absolute -bottom-1 -right-1 w-5 h-5 rounded-full bg-[#00df89] border-2 border-slate-900 flex items-center justify-center" title="Verified Outlet">
                <Check className="w-3 h-3 text-slate-950 stroke-[3]" />
              </div>
            </div>

            {/* Store Title & Type */}
            <div className="min-w-0">
              <div className="flex items-center gap-2.5 flex-wrap">
                <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-white truncate">
                  {form.name || (lang === 'bn' ? 'দোকানের নাম' : 'Store Name')}
                </h1>
                <Badge className="bg-[#00df89] text-slate-950 text-[10px] font-bold uppercase tracking-wider">
                  <SelectedIcon className="w-3 h-3 mr-1" />
                  {lang === 'bn' && selectedTypeObj?.nameBn ? selectedTypeObj.nameBn : selectedTypeObj?.name}
                </Badge>
              </div>

              <p className="text-xs text-slate-300 flex items-center gap-2 mt-1">
                <MapPin className="w-3.5 h-3.5 text-[#00df89] shrink-0" />
                <span className="truncate">{form.city || 'Dhaka'}, {form.country || 'Bangladesh'}</span>
                {form.bin_vat_number && (
                  <span className="text-slate-400 font-mono text-[11px]">• BIN: {form.bin_vat_number}</span>
                )}
              </p>

              {form.tagline && (
                <div className="text-xs text-slate-400 italic mt-0.5 truncate">
                  "{form.tagline}"
                </div>
              )}
            </div>
          </div>

          {/* Quick Outlet Switcher Dropdown in Banner */}
          {userShops && userShops.length > 1 && (
            <div className="bg-white/10 backdrop-blur-md rounded-2xl p-3 sm:p-4 border border-white/10 shrink-0 flex flex-col justify-between">
              <div className="text-[11px] font-semibold text-slate-300 mb-1.5 flex items-center gap-1.5">
                <Store className="w-3.5 h-3.5 text-[#00df89]" />
                <span>{lang === 'bn' ? 'আউটলেট পরিবর্তন করুন:' : 'Switch Active Outlet:'}</span>
              </div>
              <select
                value={mongoShop?._id || ''}
                onChange={async (e) => {
                  const targetId = e.target.value;
                  if (!targetId || targetId === mongoShop?._id) return;
                  try {
                    await switchShop(targetId);
                    toast.success(lang === 'bn' ? 'আউটলেট পরিবর্তিত হয়েছে!' : 'Outlet switched successfully!');
                  } catch (err) {
                    toast.error(err.message || 'Failed to switch outlet');
                  }
                }}
                className="h-9 px-3 rounded-xl bg-slate-900/90 text-white border border-white/20 text-xs font-bold focus:outline-none focus:ring-1 focus:ring-[#00df89] cursor-pointer"
              >
                {userShops.map((shop) => (
                  <option key={shop._id} value={shop._id}>
                    {shop.name} ({shop.business_type})
                  </option>
                ))}
              </select>
            </div>
          )}
        </div>
      </div>

      {/* ---------------------------------------------------- */}
      {/* MODERN TAB NAVIGATION                                */}
      {/* ---------------------------------------------------- */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 border-b border-slate-200 dark:border-zinc-800 scrollbar-none">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          const isDanger = tab.id === 'danger';
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
                isActive
                  ? isDanger
                    ? 'bg-rose-600 text-white shadow-sm'
                    : 'bg-slate-900 text-white dark:bg-[#00df89] dark:text-slate-950 shadow-sm'
                  : isDanger
                  ? 'text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/30'
                  : 'text-slate-600 dark:text-zinc-400 hover:bg-slate-100 dark:hover:bg-zinc-800/60'
              }`}
            >
              <Icon className={`w-3.5 h-3.5 ${isActive ? (isDanger ? 'text-white' : 'text-[#00df89] dark:text-slate-950') : isDanger ? 'text-rose-500' : 'text-slate-400'}`} />
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
          <div className="space-y-6 animate-in fade-in duration-150">
            
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
                {/* Store Logo Preview Box */}
                <div className="relative group shrink-0">
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
                  <div className="flex items-center justify-between text-xs font-semibold text-slate-700 dark:text-zinc-300">
                    <span>{lang === 'bn' ? 'দোকানের লোগো URL বা ওয়েব লিংক' : 'Store Logo Direct Image URL'}</span>
                    {form.logo_url && (
                      <button
                        type="button"
                        onClick={() => setForm((prev) => ({ ...prev, logo_url: '' }))}
                        className="text-[11px] text-rose-500 hover:underline cursor-pointer"
                      >
                        {lang === 'bn' ? 'লোগো মুছুন' : 'Remove Logo'}
                      </button>
                    )}
                  </div>
                  <Input
                    value={form.logo_url}
                    onChange={(e) => setForm({ ...form, logo_url: e.target.value })}
                    placeholder="https://example.com/logo.png"
                    className="text-xs h-9 font-mono"
                  />
                  <div className="text-[11px] text-slate-400 dark:text-zinc-500">
                    {lang === 'bn' ? 'লোগোটি রসিদের প্রিন্ট হেডারে প্রদর্শিত হবে।' : 'Logo appears on POS receipts and financial reports.'}
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
                      className="pl-9 text-xs h-10 font-mono"
                    />
                  </div>
                </div>
              </div>
            </Card>

            {/* Business Category Selection Card */}
            <Card className="p-5 sm:p-6 bg-white dark:bg-zinc-900 border-slate-200/80 dark:border-zinc-800 shadow-xs rounded-2xl">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
                <div>
                  <CardTitle className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                    <Layers className="w-4 h-4 text-blue-500" />
                    <span>{lang === 'bn' ? 'ব্যবসার ধরণ ও ক্যাটাগরি' : 'Business Category & Industry Type'}</span>
                  </CardTitle>
                  <CardDescription className="text-xs text-slate-500 dark:text-zinc-400">
                    {lang === 'bn' ? 'আপনার দোকানের সাথে মানানসই ব্যবসার ক্যাটাগরি বেছে নিন।' : 'Select the appropriate retail/service template.'}
                  </CardDescription>
                </div>

                <div className="relative w-full sm:w-60">
                  <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <Input
                    value={typeSearch}
                    onChange={(e) => setTypeSearch(e.target.value)}
                    placeholder={lang === 'bn' ? 'ক্যাটাগরি খুঁজুন...' : 'Search category...'}
                    className="pl-8 text-xs h-9"
                  />
                </div>
              </div>

              {/* Category Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2.5 max-h-72 overflow-y-auto pr-1">
                {filteredTypes.map((st) => {
                  const StIcon = ICON_MAP[st.iconName] || Store;
                  const isSelected = form.business_type === st.id;
                  return (
                    <button
                      key={st.id}
                      type="button"
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
          <Card className="p-5 sm:p-6 bg-white dark:bg-zinc-900 border-slate-200/80 dark:border-zinc-800 shadow-xs rounded-2xl animate-in fade-in duration-150">
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
                {/* City quick pills */}
                <div className="flex items-center gap-1.5 flex-wrap mt-2">
                  {BANGLADESH_CITIES.slice(0, 5).map((c) => (
                    <button
                      key={c}
                      type="button"
                      onClick={() => setForm({ ...form, city: c })}
                      className="px-2 py-0.5 rounded-md bg-slate-100 dark:bg-zinc-800 text-[10px] text-slate-600 dark:text-zinc-400 hover:bg-slate-200 cursor-pointer"
                    >
                      {c}
                    </button>
                  ))}
                </div>
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
                    className="pl-9 text-xs h-10 font-mono"
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
                    className="pl-9 text-xs h-10 font-mono"
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
          <div className="space-y-6 animate-in fade-in duration-150">
            <CashMemoDesigner
              memoConfig={memoConfig}
              setMemoConfig={setMemoConfig}
              shop={mongoShop}
              form={form}
              setForm={setForm}
            />
          </div>
        )}

        {/* ==================================================== */}
        {/* TAB 4: INVENTORY CONTROLS                            */}
        {/* ==================================================== */}
        {activeTab === 'inventory' && (
          <Card className="p-5 sm:p-6 bg-white dark:bg-zinc-900 border-slate-200/80 dark:border-zinc-800 shadow-xs rounded-2xl animate-in fade-in duration-150">
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
                    min="0"
                    value={form.low_stock_threshold}
                    onChange={(e) => setForm({ ...form, low_stock_threshold: e.target.value })}
                    className="text-xs h-10 font-mono text-center"
                  />
                </div>
              </div>

              {/* Allow Negative Stock */}
              <div className="p-4 rounded-xl bg-slate-50 dark:bg-zinc-800/40 border border-slate-200/80 dark:border-zinc-700/60 flex items-center justify-between gap-4">
                <div>
                  <div className="text-xs font-bold text-slate-900 dark:text-white">
                    {lang === 'bn' ? 'জিরো স্টক অবস্থায় বিক্রয় অনুমোদন (Negative Stock)' : 'Allow Selling Out-of-Stock Items'}
                  </div>
                  <div className="text-[11px] text-slate-500 dark:text-zinc-400 mt-0.5">
                    {lang === 'bn' ? 'স্টক শূন্য হলেও ক্যাশিয়ারে বিক্রি সম্পন্ন করতে পারবে।' : 'Allow cashiers to complete sales when stock is zero (stock becomes negative).'}
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => setForm({ ...form, allow_negative_stock: !form.allow_negative_stock })}
                  className={`w-12 h-6.5 rounded-full transition-colors relative cursor-pointer ${form.allow_negative_stock ? 'bg-[#00df89]' : 'bg-slate-300 dark:bg-zinc-700'}`}
                >
                  <div className={`w-5 h-5 rounded-full bg-white shadow-md transition-transform absolute top-0.5 ${form.allow_negative_stock ? 'right-1' : 'left-1'}`} />
                </button>
              </div>

              {/* Auto Generate SKU */}
              <div className="p-4 rounded-xl bg-slate-50 dark:bg-zinc-800/40 border border-slate-200/80 dark:border-zinc-700/60 flex items-center justify-between gap-4">
                <div>
                  <div className="text-xs font-bold text-slate-900 dark:text-white">
                    {lang === 'bn' ? 'স্বয়ংক্রিয় SKU ও বারকোড তৈরি' : 'Auto-Generate SKU & Barcode Codes'}
                  </div>
                  <div className="text-[11px] text-slate-500 dark:text-zinc-400 mt-0.5">
                    {lang === 'bn' ? 'নতুন পণ্য যোগ করার সময় অটোমেটিক অনন্য SKU কোড জেনারেট হবে।' : 'Automatically generate unique alphanumeric SKUs during new product creation.'}
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => setForm({ ...form, auto_generate_sku: !form.auto_generate_sku })}
                  className={`w-12 h-6.5 rounded-full transition-colors relative cursor-pointer ${form.auto_generate_sku ? 'bg-[#00df89]' : 'bg-slate-300 dark:bg-zinc-700'}`}
                >
                  <div className={`w-5 h-5 rounded-full bg-white shadow-md transition-transform absolute top-0.5 ${form.auto_generate_sku ? 'right-1' : 'left-1'}`} />
                </button>
              </div>

            </div>
          </Card>
        )}

        {/* ==================================================== */}
        {/* TAB 5: LOCALIZATION & OPERATING HOURS                */}
        {/* ==================================================== */}
        {activeTab === 'schedule' && (
          <Card className="p-5 sm:p-6 bg-white dark:bg-zinc-900 border-slate-200/80 dark:border-zinc-800 shadow-xs rounded-2xl animate-in fade-in duration-150">
            <CardTitle className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2 mb-1">
              <Clock className="w-4 h-4 text-emerald-500" />
              <span>{lang === 'bn' ? 'লোকেশন, মুদ্রা ও সময়সূচি' : 'Localization & Business Operating Hours'}</span>
            </CardTitle>
            <CardDescription className="text-xs text-slate-500 dark:text-zinc-400 mb-6">
              {lang === 'bn'
                ? 'মুদ্রা প্রতীক, টাইমজোন, সাপ্তাহিক ছুটি এবং দোকান খোলার সময়সূচি।'
                : 'Currency formatting, operating schedule, and weekly closure settings.'}
            </CardDescription>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              
              {/* Currency Symbol */}
              <div>
                <label className="text-xs font-semibold text-slate-700 dark:text-zinc-300 block mb-1.5">
                  {lang === 'bn' ? 'মুদ্রা প্রতীক (Currency Symbol)' : 'Currency Symbol'}
                </label>
                <Input
                  value={form.currency_symbol}
                  onChange={(e) => setForm({ ...form, currency_symbol: e.target.value })}
                  placeholder="৳"
                  className="text-xs h-10 font-bold"
                />
              </div>

              {/* Currency Code */}
              <div>
                <label className="text-xs font-semibold text-slate-700 dark:text-zinc-300 block mb-1.5">
                  {lang === 'bn' ? 'মুদ্রা কোড (ISO Currency)' : 'Currency Code'}
                </label>
                <select
                  value={form.currency}
                  onChange={(e) => setForm({ ...form, currency: e.target.value })}
                  className="w-full h-10 px-3 rounded-xl border border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 text-xs font-medium text-slate-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-[#00df89]"
                >
                  <option value="BDT">BDT - Bangladeshi Taka (৳)</option>
                  <option value="USD">USD - US Dollar ($)</option>
                  <option value="INR">INR - Indian Rupee (₹)</option>
                  <option value="EUR">EUR - Euro (€)</option>
                  <option value="GBP">GBP - British Pound (£)</option>
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
        {/* TAB 6: DANGER ZONE & STORE DELETION                  */}
        {/* ==================================================== */}
        {activeTab === 'danger' && (
          <div className="space-y-6 animate-in fade-in duration-150">
            
            <Card className="p-5 sm:p-6 bg-white dark:bg-zinc-900 border-rose-500/30 dark:border-rose-900/40 shadow-xs rounded-2xl">
              <CardTitle className="text-base font-bold text-rose-600 dark:text-rose-400 flex items-center gap-2 mb-1">
                <ShieldAlert className="w-4 h-4" />
                <span>{lang === 'bn' ? 'ডেঞ্জার জোন ও দোকান মুছে ফেলা' : 'Danger Zone & Store Deletion'}</span>
              </CardTitle>
              <CardDescription className="text-xs text-slate-500 dark:text-zinc-400 mb-6">
                {lang === 'bn'
                  ? 'সংবেদনশীল অ্যাকশন এবং দোকান স্থায়ীভাবে মুছে ফেলার নিয়ন্ত্রণ।'
                  : 'Irreversible operations and permanent store tenant deactivation.'}
              </CardDescription>

              <div className="space-y-4">
                
                {/* Continuous Backup Notice */}
                <div className="p-4 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-start gap-3">
                  <AlertTriangle className="w-5 h-5 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
                  <div className="text-xs text-slate-700 dark:text-zinc-300 leading-relaxed">
                    <span className="font-bold text-slate-900 dark:text-white">
                      {lang === 'bn' ? 'জরুরি সতর্কতা:' : 'Critical Notice:'}
                    </span>{' '}
                    {lang === 'bn'
                      ? 'দোকান মুছে ফেললে এই আউটলেটের পণ্য তালিকা, বিক্রয় হিসাব এবং মেমো নিষ্ক্রিয় হবে। আপনি যদি একাধিক আউটলেট পরিচালনা করেন তবে পরবর্তী সক্রিয় আউটলেটে সুইচ করা হবে।'
                      : 'Deleting this store tenant will deactivate its associated catalog, invoices, and ledgers. If you manage multiple outlets, your session will automatically switch to your next active outlet.'}
                  </div>
                </div>

                {/* Outlet Meta */}
                <div className="p-4 rounded-xl bg-slate-50 dark:bg-zinc-800/40 border border-slate-200/80 dark:border-zinc-700/60 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div>
                    <div className="text-xs font-bold text-slate-900 dark:text-white">
                      {lang === 'bn' ? 'আউটলেট আইডি ও বর্তমান স্ট্যাটাস' : 'Store Tenant Identifier'}
                    </div>
                    <div className="text-xs font-mono font-bold text-slate-600 dark:text-zinc-400 mt-0.5">
                      ID: {mongoShop?._id || '—'}
                    </div>
                  </div>

                  <Badge className="bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20 text-xs">
                    Operational
                  </Badge>
                </div>

                {/* DELETE STORE ACTION BOX */}
                <div className="p-5 rounded-2xl bg-rose-500/5 border border-rose-500/20 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div>
                    <div className="text-xs font-bold text-rose-600 dark:text-rose-400 flex items-center gap-1.5">
                      <Trash2 className="w-4 h-4" />
                      <span>{lang === 'bn' ? 'এই দোকানটি স্থায়ীভাবে ডিলিট করুন' : 'Delete this Store Outlet'}</span>
                    </div>
                    <div className="text-[11px] text-slate-500 dark:text-zinc-400 mt-0.5">
                      {lang === 'bn'
                        ? `'${form.name}' দোকানটি সিস্টেম থেকে অপসারণ করা হবে।`
                        : `Permanently deactivate '${form.name}' and remove it from your outlets list.`}
                    </div>
                  </div>

                  <Button
                    type="button"
                    onClick={() => setIsDeleteModalOpen(true)}
                    className="h-10 px-5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold shadow-sm transition-all cursor-pointer gap-2 shrink-0"
                  >
                    <Trash2 className="w-4 h-4" />
                    <span>{lang === 'bn' ? 'দোকান ডিলিট করুন' : 'Delete Store'}</span>
                  </Button>
                </div>

              </div>
            </Card>

          </div>
        )}

        {/* ---------------------------------------------------- */}
        {/* SUBMIT BUTTON BAR                                    */}
        {/* ---------------------------------------------------- */}
        <div className="flex items-center justify-between gap-4 pt-2">
          <div className="text-xs text-slate-500 dark:text-zinc-400 flex items-center gap-1.5">
            {isDirty && (
              <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse shrink-0" />
            )}
            <span>
              {isDirty
                ? (lang === 'bn' ? 'অসংরক্ষিত পরিবর্তন রয়েছে' : 'You have unsaved changes')
                : (lang === 'bn' ? 'দোকানের সকল সেটিংস হালনাগাদ আছে' : 'All settings up to date')}
            </span>
          </div>

          <Button
            type="submit"
            disabled={isSaving}
            className="h-11 px-8 rounded-xl bg-[#00df89] hover:bg-[#00c578] text-[#011812] font-bold text-xs shadow-md hover:shadow-lg transition-all cursor-pointer gap-2"
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

      {/* ---------------------------------------------------- */}
      {/* CONFIRM DELETE STORE MODAL                           */}
      {/* ---------------------------------------------------- */}
      {isDeleteModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs animate-in fade-in">
          <div className="w-full max-w-md bg-white dark:bg-zinc-900 rounded-3xl border border-rose-500/30 p-6 shadow-2xl space-y-5 animate-in zoom-in-95">
            
            <div className="flex items-center justify-between">
              <div className="w-12 h-12 rounded-2xl bg-rose-500/10 text-rose-600 dark:text-rose-400 flex items-center justify-center">
                <Trash2 className="w-6 h-6" />
              </div>
              <button
                type="button"
                onClick={() => {
                  setIsDeleteModalOpen(false);
                  setDeleteConfirmText('');
                }}
                className="w-8 h-8 rounded-xl bg-slate-100 dark:bg-zinc-800 text-slate-500 hover:text-slate-900 dark:hover:text-white flex items-center justify-center cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white">
                {lang === 'bn' ? 'দোকান ডিলিট নিশ্চিতকরণ' : 'Confirm Store Deletion'}
              </h3>
              <p className="text-xs text-slate-500 dark:text-zinc-400 mt-1 leading-relaxed">
                {lang === 'bn'
                  ? `আপনি কি নিশ্চিত যে '${form.name}' দোকানটি মুছে ফেলতে চান? নিশ্চিত করতে নিচে দোকানের নামটি হুবহু টাইপ করুন:`
                  : `Are you absolutely sure you want to delete '${form.name}'? Please type the exact store name to confirm:`}
              </p>
            </div>

            {/* Confirm input box */}
            <div className="space-y-1.5">
              <div className="text-[11px] font-mono text-slate-400 font-bold bg-slate-100 dark:bg-zinc-800 p-2 rounded-lg text-center select-all">
                {form.name}
              </div>
              <Input
                value={deleteConfirmText}
                onChange={(e) => setDeleteConfirmText(e.target.value)}
                placeholder={lang === 'bn' ? 'দোকানের নাম টাইপ করুন' : 'Type store name exactly'}
                className="text-xs h-10 font-bold text-center"
                autoFocus
              />
            </div>

            <div className="flex items-center justify-end gap-3 pt-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setIsDeleteModalOpen(false);
                  setDeleteConfirmText('');
                }}
                disabled={isDeleting}
                className="text-xs font-semibold cursor-pointer"
              >
                {lang === 'bn' ? 'বাতিল' : 'Cancel'}
              </Button>

              <Button
                type="button"
                onClick={handleDeleteShop}
                disabled={isDeleting || deleteConfirmText.trim().toLowerCase() !== form.name.trim().toLowerCase()}
                className="bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold gap-2 cursor-pointer shadow-md disabled:opacity-40"
              >
                {isDeleting ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>{lang === 'bn' ? 'ডিলিট হচ্ছে...' : 'Deleting Store...'}</span>
                  </>
                ) : (
                  <>
                    <Trash2 className="w-4 h-4" />
                    <span>{lang === 'bn' ? 'স্থায়ীভাবে ডিলিট করুন' : 'Confirm Delete'}</span>
                  </>
                )}
              </Button>
            </div>

          </div>
        </div>
      )}

    </div>
  );
}
